"""
Background scheduler for the AI Platform.

Runs alongside the FastAPI app and triggers retraining / drift checks
on a cron schedule. For production with BullMQ, NestJS can POST to
/train/{model_name} directly — this scheduler is the self-contained
alternative when running the platform standalone.

Schedule:
  Daily  02:00 UTC  — generate feature snapshots and check for drift
  Weekly 03:00 UTC  — evaluate all model accuracies
  Monthly 04:00 1st — trigger full retraining pipeline for all models
"""

import asyncio
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from pipelines.retraining.retraining_pipeline import run_all_retraining, ALL_MODELS
from pipelines.deployment.deployment_pipeline import evaluate_and_deploy
from monitoring.model_metrics.metrics_tracker import get_snapshots
from model_registry.registry import registry

logger = logging.getLogger("ascend.scheduler")


async def _daily_drift_check():
    logger.info("[scheduler] Running daily drift check — %s", datetime.utcnow().isoformat())
    for model_name in ALL_MODELS:
        history = registry.get_drift_history(model_name, days=1)
        significant = [r for r in history if r.get("drift_detected")]
        if significant:
            logger.warning(
                "[scheduler] Drift detected for %s in %d features — scheduling emergency retrain",
                model_name, len(significant),
            )
            loop = asyncio.get_event_loop()
            loop.run_in_executor(None, lambda m=model_name: _retrain_model(m))


async def _weekly_model_eval():
    logger.info("[scheduler] Running weekly model evaluation — %s", datetime.utcnow().isoformat())
    for model_name in ALL_MODELS:
        champion = registry.get_champion(model_name)
        if champion is None:
            logger.info("[scheduler] No champion for %s — triggering initial training", model_name)
            _retrain_model(model_name)
            continue

        snapshots = get_snapshots(model_name, limit=7)
        if not snapshots:
            continue

        avg_acc = sum(s["accuracy"] for s in snapshots) / len(snapshots)
        logger.info("[scheduler] %s: 7-day avg accuracy = %.4f", model_name, avg_acc)


async def _monthly_retraining():
    logger.info("[scheduler] Running monthly full retraining — %s", datetime.utcnow().isoformat())
    outcomes = run_all_retraining(force=False)
    for o in outcomes:
        logger.info(
            "[scheduler] %s: triggered=%s status=%s version=%s error=%s",
            o.model_name, o.triggered, o.new_model_status, o.new_model_version, o.error,
        )
        if o.new_model_status == "challenger":
            logger.info("[scheduler] Evaluating deployment for %s", o.model_name)
            decision = evaluate_and_deploy(o.model_name)
            logger.info("[scheduler] Deploy decision for %s: %s", o.model_name, decision.action)


def _retrain_model(model_name: str):
    from pipelines.retraining.retraining_pipeline import run_retraining
    outcome = run_retraining(model_name, force=False)
    logger.info(
        "[scheduler] Retrain %s: triggered=%s status=%s error=%s",
        model_name, outcome.triggered, outcome.new_model_status, outcome.error,
    )


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")

    scheduler.add_job(
        _daily_drift_check,
        CronTrigger(hour=2, minute=0),
        id="daily_drift_check",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    scheduler.add_job(
        _weekly_model_eval,
        CronTrigger(day_of_week="sun", hour=3, minute=0),
        id="weekly_model_eval",
        replace_existing=True,
        misfire_grace_time=7200,
    )
    scheduler.add_job(
        _monthly_retraining,
        CronTrigger(day=1, hour=4, minute=0),
        id="monthly_retraining",
        replace_existing=True,
        misfire_grace_time=14400,
    )

    return scheduler


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scheduler = create_scheduler()
    scheduler.start()
    logger.info("Scheduler started. Press Ctrl+C to stop.")
    try:
        asyncio.get_event_loop().run_forever()
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
