"""
Ascend AI Platform — Management API

Endpoints:
  GET  /health                          - Platform health check
  POST /ingest/{model_type}             - Ingest feature event from NestJS
  POST /train/{model_name}              - Trigger retraining (manual or scheduled)
  POST /train/all                       - Retrain all models
  POST /deploy/{model_name}             - Evaluate challenger and deploy if better
  POST /feedback                        - Record recommendation feedback
  POST /poison/evaluate                 - Flag user for anti-poison exclusion
  DELETE /poison/users/{user_id}        - Reinstate user
  GET  /models                          - List all models in registry
  GET  /models/{model_name}/champion    - Get current champion details
  GET  /models/{model_name}/shadow      - Shadow mode comparison report
  GET  /drift/{model_name}              - Drift history
  GET  /training/runs                   - Recent training run history
"""

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Any
from config import settings
from model_registry.registry import registry
from pipelines.ingestion.data_ingestion import ingest_event
from pipelines.retraining.retraining_pipeline import run_retraining, run_all_retraining
from pipelines.deployment.deployment_pipeline import evaluate_and_deploy
from feedback.feedback_collector import record_feedback, get_acceptance_rate, FeedbackRecord
from anti_poison.poison_detector import evaluate_user, reinstate_user, get_excluded_users, get_excluded_count
from inference.shadow_mode import get_shadow_report

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


def _verify_key(x_api_key: str = Header(...)):
    if x_api_key != settings.PLATFORM_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    from model_registry.registry import registry as reg
    champions = {
        name: reg.get_champion(name) is not None
        for name in ["productivity_score", "habit_completion", "burnout_detection", "recommendation_engine"]
    }
    return {
        "status": "ok",
        "version": settings.VERSION,
        "models_with_champion": champions,
        "excluded_users": get_excluded_count(),
    }


# ── Data ingestion ────────────────────────────────────────────────────────────

class IngestPayload(BaseModel):
    user_id: str
    data: dict[str, Any]

@app.post("/ingest/{model_type}", dependencies=[Depends(_verify_key)])
def ingest(model_type: str, payload: IngestPayload):
    result = ingest_event(payload.user_id, model_type, payload.data)
    return {"user_id": result.user_id, "stored": result.features_stored, "reason": result.skipped_reason}


# ── Training ──────────────────────────────────────────────────────────────────

class TrainRequest(BaseModel):
    force: bool = False

@app.post("/train/{model_name}", dependencies=[Depends(_verify_key)])
def train_model(model_name: str, req: TrainRequest):
    outcome = run_retraining(model_name, force=req.force)
    return {
        "model_name":       outcome.model_name,
        "triggered":        outcome.triggered,
        "trigger_reason":   outcome.trigger_reason,
        "status":           outcome.new_model_status,
        "version":          outcome.new_model_version,
        "validation_passed": outcome.validation_passed,
        "metrics":          outcome.metrics,
        "error":            outcome.error,
    }

@app.post("/train/all", dependencies=[Depends(_verify_key)])
def train_all(req: TrainRequest):
    outcomes = run_all_retraining(force=req.force)
    return [
        {
            "model_name": o.model_name,
            "triggered":  o.triggered,
            "status":     o.new_model_status,
            "version":    o.new_model_version,
            "error":      o.error,
        }
        for o in outcomes
    ]


# ── Deployment ────────────────────────────────────────────────────────────────

@app.post("/deploy/{model_name}", dependencies=[Depends(_verify_key)])
def deploy_model(model_name: str):
    decision = evaluate_and_deploy(model_name)
    return {
        "model_name":                 decision.model_name,
        "action":                     decision.action,
        "previous_champion_version":  decision.previous_champion_version,
        "new_champion_version":       decision.new_champion_version,
        "reason":                     decision.reason,
    }


# ── Feedback loop ─────────────────────────────────────────────────────────────

class FeedbackPayload(BaseModel):
    recommendation_id: str
    user_id: str
    recommendation_type: str
    accepted: bool
    helpful: Optional[bool] = None
    feedback_text: Optional[str] = None

@app.post("/feedback", dependencies=[Depends(_verify_key)])
def submit_feedback(payload: FeedbackPayload):
    record_feedback(FeedbackRecord(
        recommendation_id=payload.recommendation_id,
        user_id=payload.user_id,
        recommendation_type=payload.recommendation_type,
        accepted=payload.accepted,
        helpful=payload.helpful,
        feedback_text=payload.feedback_text,
    ))
    return {"recorded": True}

@app.get("/feedback/stats", dependencies=[Depends(_verify_key)])
def feedback_stats(recommendation_type: Optional[str] = None):
    return get_acceptance_rate(recommendation_type)


# ── Anti-poison ───────────────────────────────────────────────────────────────

class PoisonEvalPayload(BaseModel):
    user_id: str
    cheat_confidence: float
    cheat_flags: list[str]

@app.post("/poison/evaluate", dependencies=[Depends(_verify_key)])
def poison_evaluate(payload: PoisonEvalPayload):
    verdict = evaluate_user(payload.user_id, payload.cheat_confidence, payload.cheat_flags)
    return {
        "user_id":          verdict.user_id,
        "excluded":         verdict.excluded,
        "cheat_confidence": verdict.cheat_confidence,
        "reasons":          verdict.reasons,
    }

@app.delete("/poison/users/{user_id}", dependencies=[Depends(_verify_key)])
def reinstate(user_id: str):
    ok = reinstate_user(user_id)
    return {"user_id": user_id, "reinstated": ok}

@app.get("/poison/users", dependencies=[Depends(_verify_key)])
def list_excluded():
    return {"excluded_users": get_excluded_users()}


# ── Model registry ────────────────────────────────────────────────────────────

@app.get("/models", dependencies=[Depends(_verify_key)])
def list_models(status: Optional[str] = None, model_name: Optional[str] = None):
    records = registry.list_models(model_name=model_name, status=status)
    return [
        {
            "id":               r.id,
            "model_name":       r.model_name,
            "version":          r.version,
            "status":           r.status,
            "accuracy":         r.accuracy,
            "f1_score":         r.f1_score,
            "avg_latency_ms":   r.avg_latency_ms,
            "training_samples": r.training_samples,
            "created_at":       r.created_at,
        }
        for r in records
    ]

@app.get("/models/{model_name}/champion", dependencies=[Depends(_verify_key)])
def get_champion(model_name: str):
    record = registry.get_champion(model_name)
    if record is None:
        raise HTTPException(status_code=404, detail=f"No champion for {model_name}")
    return {
        "model_name":        record.model_name,
        "version":           record.version,
        "accuracy":          record.accuracy,
        "f1_score":          record.f1_score,
        "avg_latency_ms":    record.avg_latency_ms,
        "training_samples":  record.training_samples,
        "feature_importance": record.feature_importance,
        "promoted_at":       record.promoted_at,
    }

@app.get("/models/{model_name}/shadow", dependencies=[Depends(_verify_key)])
def shadow_report(model_name: str):
    report = get_shadow_report(model_name, settings.MIN_SHADOW_PREDICTIONS)
    if report is None:
        raise HTTPException(status_code=404, detail="No champion or challenger for this model")
    return {
        "model_name":                  report.model_name,
        "champion_version":            report.champion_version,
        "challenger_version":          report.challenger_version,
        "n_predictions":               report.n_predictions,
        "champion_avg_latency_ms":     report.champion_avg_latency_ms,
        "challenger_avg_latency_ms":   report.challenger_avg_latency_ms,
        "prediction_mae":              report.prediction_mae,
        "prediction_correlation":      report.prediction_correlation,
        "ready_for_evaluation":        report.ready_for_evaluation,
        "min_predictions_needed":      report.min_predictions_needed,
    }


# ── Drift & monitoring ────────────────────────────────────────────────────────

@app.get("/drift/{model_name}", dependencies=[Depends(_verify_key)])
def drift_history(model_name: str, days: int = 30):
    return registry.get_drift_history(model_name, days=days)

@app.get("/training/runs", dependencies=[Depends(_verify_key)])
def training_runs(model_name: Optional[str] = None, limit: int = 20):
    return registry.get_training_runs(model_name=model_name, limit=limit)


# ── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def generic_error(request, exc):
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "message": str(exc)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else 2,
    )
