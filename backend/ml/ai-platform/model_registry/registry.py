import sqlite3
import json
import os
from datetime import datetime
from dataclasses import dataclass
from typing import Optional
from config import settings


@dataclass
class ModelRecord:
    id: Optional[int]
    model_name: str
    version: int
    status: str        # candidate | challenger | champion | retired
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    avg_latency_ms: float
    training_samples: int
    feature_importance: dict
    artifact_path: str
    created_at: str
    promoted_at: Optional[str] = None
    retired_at: Optional[str] = None


_SCHEMA = """
CREATE TABLE IF NOT EXISTS models (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name       TEXT    NOT NULL,
    version          INTEGER NOT NULL,
    status           TEXT    NOT NULL DEFAULT 'candidate',
    accuracy         REAL    DEFAULT 0.0,
    precision        REAL    DEFAULT 0.0,
    recall           REAL    DEFAULT 0.0,
    f1_score         REAL    DEFAULT 0.0,
    avg_latency_ms   REAL    DEFAULT 0.0,
    training_samples INTEGER DEFAULT 0,
    feature_importance TEXT  DEFAULT '{}',
    artifact_path    TEXT    NOT NULL,
    created_at       TEXT    NOT NULL,
    promoted_at      TEXT,
    retired_at       TEXT,
    UNIQUE(model_name, version)
);

CREATE TABLE IF NOT EXISTS shadow_predictions (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    champion_model_id     INTEGER NOT NULL,
    challenger_model_id   INTEGER NOT NULL,
    user_id               TEXT    NOT NULL,
    champion_prediction   REAL    NOT NULL,
    challenger_prediction REAL    NOT NULL,
    champion_latency_ms   REAL    NOT NULL,
    challenger_latency_ms REAL    NOT NULL,
    created_at            TEXT    NOT NULL,
    FOREIGN KEY (champion_model_id)   REFERENCES models(id),
    FOREIGN KEY (challenger_model_id) REFERENCES models(id)
);

CREATE TABLE IF NOT EXISTS training_runs (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name        TEXT NOT NULL,
    trigger_reason    TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'running',
    started_at        TEXT NOT NULL,
    completed_at      TEXT,
    new_model_id      INTEGER,
    new_model_version INTEGER,
    metrics           TEXT DEFAULT '{}',
    error_message     TEXT,
    FOREIGN KEY (new_model_id) REFERENCES models(id)
);

CREATE TABLE IF NOT EXISTS drift_records (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name     TEXT NOT NULL,
    feature_name   TEXT NOT NULL,
    psi_score      REAL NOT NULL,
    kl_divergence  REAL NOT NULL,
    js_divergence  REAL NOT NULL,
    drift_detected INTEGER NOT NULL DEFAULT 0,
    window_start   TEXT NOT NULL,
    window_end     TEXT NOT NULL,
    recorded_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    recommendation_id   TEXT NOT NULL UNIQUE,
    user_id             TEXT NOT NULL,
    recommendation_type TEXT NOT NULL,
    accepted            INTEGER NOT NULL DEFAULT 0,
    helpful             INTEGER,
    feedback_text       TEXT,
    created_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_models_name_status   ON models(model_name, status);
CREATE INDEX IF NOT EXISTS idx_shadow_challenger     ON shadow_predictions(challenger_model_id);
CREATE INDEX IF NOT EXISTS idx_training_runs_name   ON training_runs(model_name, status);
CREATE INDEX IF NOT EXISTS idx_drift_model          ON drift_records(model_name, recorded_at);
"""


class ModelRegistry:
    def __init__(self, db_path: str = settings.REGISTRY_DB_PATH):
        self._db_path = db_path
        os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else ".", exist_ok=True)
        self._init_db()

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

    def _init_db(self) -> None:
        with self._conn() as conn:
            conn.executescript(_SCHEMA)

    # ── Registration ──────────────────────────────────────────────────────────

    def get_next_version(self, model_name: str) -> int:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT MAX(version) as v FROM models WHERE model_name = ?", (model_name,)
            ).fetchone()
        return (row["v"] or 0) + 1

    def register_model(
        self,
        model_name: str,
        accuracy: float,
        precision: float,
        recall: float,
        f1_score: float,
        avg_latency_ms: float,
        training_samples: int,
        feature_importance: dict,
        artifact_path: str,
    ) -> ModelRecord:
        version = self.get_next_version(model_name)
        now = datetime.utcnow().isoformat()
        with self._conn() as conn:
            cur = conn.execute(
                """INSERT INTO models
                   (model_name, version, status, accuracy, precision, recall, f1_score,
                    avg_latency_ms, training_samples, feature_importance, artifact_path, created_at)
                   VALUES (?, ?, 'candidate', ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (model_name, version, accuracy, precision, recall, f1_score,
                 avg_latency_ms, training_samples, json.dumps(feature_importance),
                 artifact_path, now),
            )
        return self.get_model_by_id(cur.lastrowid)

    # ── Queries ───────────────────────────────────────────────────────────────

    def get_champion(self, model_name: str) -> Optional[ModelRecord]:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT * FROM models WHERE model_name = ? AND status = 'champion' LIMIT 1",
                (model_name,),
            ).fetchone()
        return self._to_record(row) if row else None

    def get_challenger(self, model_name: str) -> Optional[ModelRecord]:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT * FROM models WHERE model_name = ? AND status = 'challenger' LIMIT 1",
                (model_name,),
            ).fetchone()
        return self._to_record(row) if row else None

    def get_model_by_id(self, model_id: int) -> Optional[ModelRecord]:
        with self._conn() as conn:
            row = conn.execute("SELECT * FROM models WHERE id = ?", (model_id,)).fetchone()
        return self._to_record(row) if row else None

    def list_models(
        self,
        model_name: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> list[ModelRecord]:
        q, params = "SELECT * FROM models WHERE 1=1", []
        if model_name:
            q += " AND model_name = ?"; params.append(model_name)
        if status:
            q += " AND status = ?";     params.append(status)
        q += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        with self._conn() as conn:
            rows = conn.execute(q, params).fetchall()
        return [self._to_record(r) for r in rows]

    # ── Promotion logic ───────────────────────────────────────────────────────

    def set_as_champion(self, model_id: int) -> ModelRecord:
        model = self.get_model_by_id(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        now = datetime.utcnow().isoformat()
        with self._conn() as conn:
            conn.execute(
                "UPDATE models SET status='retired', retired_at=? WHERE model_name=? AND status='champion'",
                (now, model.model_name),
            )
            conn.execute(
                "UPDATE models SET status='champion', promoted_at=? WHERE id=?",
                (now, model_id),
            )
        return self.get_model_by_id(model_id)

    def promote_to_challenger(self, model_id: int) -> None:
        model = self.get_model_by_id(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        now = datetime.utcnow().isoformat()
        with self._conn() as conn:
            conn.execute(
                "UPDATE models SET status='retired', retired_at=? WHERE model_name=? AND status='challenger'",
                (now, model.model_name),
            )
            conn.execute("UPDATE models SET status='challenger' WHERE id=?", (model_id,))

    def promote_challenger_to_champion(self, model_name: str) -> Optional[ModelRecord]:
        challenger = self.get_challenger(model_name)
        if not challenger:
            return None
        now = datetime.utcnow().isoformat()
        with self._conn() as conn:
            conn.execute(
                "UPDATE models SET status='retired', retired_at=? WHERE model_name=? AND status='champion'",
                (now, model_name),
            )
            conn.execute(
                "UPDATE models SET status='champion', promoted_at=? WHERE id=?",
                (now, challenger.id),
            )
        return self.get_model_by_id(challenger.id)

    # ── Shadow predictions ────────────────────────────────────────────────────

    def log_shadow_prediction(
        self,
        champion_model_id: int,
        challenger_model_id: int,
        user_id: str,
        champion_prediction: float,
        challenger_prediction: float,
        champion_latency_ms: float,
        challenger_latency_ms: float,
    ) -> None:
        with self._conn() as conn:
            conn.execute(
                """INSERT INTO shadow_predictions
                   (champion_model_id, challenger_model_id, user_id,
                    champion_prediction, challenger_prediction,
                    champion_latency_ms, challenger_latency_ms, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (champion_model_id, challenger_model_id, user_id,
                 champion_prediction, challenger_prediction,
                 champion_latency_ms, challenger_latency_ms,
                 datetime.utcnow().isoformat()),
            )

    def get_shadow_count(self, challenger_model_id: int) -> int:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT COUNT(*) as cnt FROM shadow_predictions WHERE challenger_model_id = ?",
                (challenger_model_id,),
            ).fetchone()
        return row["cnt"] if row else 0

    def get_shadow_comparison(self, challenger_model_id: int) -> dict:
        with self._conn() as conn:
            rows = conn.execute(
                """SELECT champion_prediction, challenger_prediction,
                          champion_latency_ms, challenger_latency_ms
                   FROM shadow_predictions WHERE challenger_model_id = ?""",
                (challenger_model_id,),
            ).fetchall()
        if not rows:
            return {}
        import numpy as np
        ch_preds  = [r["champion_prediction"]   for r in rows]
        cl_preds  = [r["challenger_prediction"]  for r in rows]
        ch_lat    = [r["champion_latency_ms"]    for r in rows]
        cl_lat    = [r["challenger_latency_ms"]  for r in rows]
        return {
            "n_predictions":              len(rows),
            "champion_avg_latency_ms":    round(float(np.mean(ch_lat)), 2),
            "challenger_avg_latency_ms":  round(float(np.mean(cl_lat)), 2),
            "prediction_mae":             round(float(np.mean(np.abs(np.array(ch_preds) - np.array(cl_preds)))), 4),
            "prediction_correlation":     round(float(np.corrcoef(ch_preds, cl_preds)[0, 1]), 4),
        }

    # ── Logging helpers ───────────────────────────────────────────────────────

    def log_drift(
        self,
        model_name: str,
        feature_name: str,
        psi: float,
        kl: float,
        js: float,
        drift_detected: bool,
        window_start: str,
        window_end: str,
    ) -> None:
        with self._conn() as conn:
            conn.execute(
                """INSERT INTO drift_records
                   (model_name, feature_name, psi_score, kl_divergence, js_divergence,
                    drift_detected, window_start, window_end, recorded_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (model_name, feature_name, psi, kl, js, int(drift_detected),
                 window_start, window_end, datetime.utcnow().isoformat()),
            )

    def log_training_run(self, model_name: str, trigger_reason: str) -> int:
        with self._conn() as conn:
            cur = conn.execute(
                "INSERT INTO training_runs (model_name, trigger_reason, status, started_at) VALUES (?, ?, 'running', ?)",
                (model_name, trigger_reason, datetime.utcnow().isoformat()),
            )
        return cur.lastrowid

    def complete_training_run(
        self,
        run_id: int,
        new_model_id: Optional[int],
        metrics: dict,
        error: Optional[str] = None,
    ) -> None:
        with self._conn() as conn:
            conn.execute(
                """UPDATE training_runs
                   SET status=?, completed_at=?, new_model_id=?, metrics=?, error_message=?
                   WHERE id=?""",
                ("failed" if error else "completed", datetime.utcnow().isoformat(),
                 new_model_id, json.dumps(metrics), error, run_id),
            )

    def log_feedback(
        self,
        recommendation_id: str,
        user_id: str,
        recommendation_type: str,
        accepted: bool,
        helpful: Optional[bool] = None,
        feedback_text: Optional[str] = None,
    ) -> None:
        with self._conn() as conn:
            conn.execute(
                """INSERT OR REPLACE INTO recommendation_feedback
                   (recommendation_id, user_id, recommendation_type,
                    accepted, helpful, feedback_text, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (recommendation_id, user_id, recommendation_type,
                 int(accepted), int(helpful) if helpful is not None else None,
                 feedback_text, datetime.utcnow().isoformat()),
            )

    def get_drift_history(self, model_name: str, days: int = 30) -> list[dict]:
        with self._conn() as conn:
            rows = conn.execute(
                """SELECT * FROM drift_records
                   WHERE model_name = ? AND recorded_at >= datetime('now', ?)
                   ORDER BY recorded_at DESC""",
                (model_name, f"-{days} days"),
            ).fetchall()
        return [dict(r) for r in rows]

    def get_training_runs(self, model_name: Optional[str] = None, limit: int = 20) -> list[dict]:
        q, params = "SELECT * FROM training_runs", []
        if model_name:
            q += " WHERE model_name = ?"; params.append(model_name)
        q += " ORDER BY started_at DESC LIMIT ?"; params.append(limit)
        with self._conn() as conn:
            rows = conn.execute(q, params).fetchall()
        return [dict(r) for r in rows]

    @staticmethod
    def _to_record(row: sqlite3.Row) -> ModelRecord:
        return ModelRecord(
            id=row["id"],
            model_name=row["model_name"],
            version=row["version"],
            status=row["status"],
            accuracy=row["accuracy"],
            precision=row["precision"],
            recall=row["recall"],
            f1_score=row["f1_score"],
            avg_latency_ms=row["avg_latency_ms"],
            training_samples=row["training_samples"],
            feature_importance=json.loads(row["feature_importance"] or "{}"),
            artifact_path=row["artifact_path"],
            created_at=row["created_at"],
            promoted_at=row["promoted_at"],
            retired_at=row["retired_at"],
        )


registry = ModelRegistry()
