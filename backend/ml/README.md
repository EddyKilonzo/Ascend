# Ascend ML Platform

Five FastAPI services that power the AI layer of Ascend. All are read-only with respect to the PostgreSQL database — NestJS is the sole DB writer.

---

## Service Map

```mermaid
graph TB
    subgraph NestJS["NestJS :4000"]
        GW["AiGatewayService\ncircuit breaker · retry · x-api-key"]
    end

    subgraph ML["ML Services"]
        AI["ai-engine\n:5000\nXGBoost inference\nSHAP explainability"]
        AP["ai-platform\n:5001\nFeature store\nChampion/Challenger\nRetraining pipeline"]
        MA["maya\n:5002\nClaude Opus 4.8\nproductivity coaching"]
        MV["maya-voice\n:5003\nOpenWakeWord\nFaster Whisper STT\nPiper TTS"]
        VI["vision\n:5004\nTesseract · EasyOCR\nPaddleOCR"]
    end

    subgraph Storage
        FS[("Feature Store\nJSONL files\nper user · per model")]
        MC[("Model Artifacts\njoblib files\nchampion · challenger")]
        Redis_AI[("Redis DB:0\nai-engine cache")]
        Redis_AP[("Redis DB:1\nai-platform cache")]
        Redis_MA[("Redis DB:2\nmaya cache")]
    end

    GW -->|productivity · habit · burnout · goal · anticheat · recommend| AI
    GW -->|ingest-event · retrain · health| AP
    GW -->|chat · suggest| MA
    GW -->|stt · tts · wakeword| MV
    GW -->|ocr/image · ocr/document · ocr/screenshot| VI

    AI <--> Redis_AI
    AP <--> Redis_AP
    AP <--> FS
    AP --> MC
    MA <--> Redis_MA
    MC --> AI
```

---

## Data Flow — Feature Ingestion to Prediction

```mermaid
sequenceDiagram
    participant NestJS
    participant AP as ai-platform :5001
    participant FS as Feature Store
    participant AI as ai-engine :5000

    NestJS->>AP: POST /ingest-event\n{ userId, eventType, payload }
    AP->>AP: validate payload\ncheck trustScore (anti-poisoning)
    AP->>FS: append to {model}/{userId}.jsonl
    Note over FS: bad data never reaches here —<br/>cheat_confidence ≥ 0.70 excluded

    NestJS->>AI: POST /predict/habit\n{ userId, habit_difficulty, ... 10 features }
    AI->>AI: load model (cache: path:mtime key)\nrun XGBoost inference\ncompute SHAP values
    AI-->>NestJS: AIEnvelope\n{ prediction, confidence,\n  reasoning, factors, recommendations }
```

---

## Model Lifecycle — Champion/Challenger

```mermaid
stateDiagram-v2
    [*] --> Challenger : upload artifact
    Challenger --> ShadowMode : activate_challenger()
    ShadowMode --> ShadowMode : both models predict\nchallenger logs only
    ShadowMode --> Evaluation : ≥ 1000 predictions accumulated
    Evaluation --> Champion : challenger wins\nauto_promote()
    Evaluation --> ShadowMode : champion wins\nchallenger stays in shadow
    Champion --> [*] : retired on next promotion

    note right of ShadowMode
        PSI drift check runs daily
        PSI > 0.2 → significant drift flagged
        PSI > 0.4 → critical alert
    end note
```

---

## Anti-Poisoning Pipeline

```mermaid
flowchart TD
    Event["User Activity Event"] --> AC["AntiCheat Engine\nml/ai :5000/anticheat"]
    AC --> Score{"cheat_confidence"}
    Score -->|≥ 0.70| Exclude["Excluded from training\ntrustScore updated in DB"]
    Score -->|< 0.70| Ingest["Feature Store\neligible for training"]
    Ingest --> Retrain["Retraining Pipeline\nai-platform :5001"]
    Retrain --> Challenger["New Challenger Model"]
    Challenger --> CC["Champion/Challenger\nevaluation"]
```

---

## Security Model

| Concern | Mitigation |
| --- | --- |
| Inter-service auth | `x-api-key` header required on every route; 401 on missing/wrong key |
| Rate limiting | Redis sliding-window per `x-user-id` / client IP (fallback to in-process) |
| Path traversal | `_safe_user_id()` regex + `os.path.abspath` containment check on Feature Store writes |
| Model poisoning | Users with `cheat_confidence ≥ 0.70` excluded from all training data |
| Sensitive data leakage | `str(exc)` never returned to callers — structured error object only |
| DB writes | None — all services are read-only; NestJS is the sole DB writer |
| Image retention | Temporary files only; deleted immediately after OCR processing |

---

## Ports & Redis DB Assignments

| Service | Port | Redis DB | Notes |
| --- | --- | --- | --- |
| ai-engine | 5000 | 0 | Inference cache, rate-limit keys |
| ai-platform | 5001 | 1 | Platform cache |
| maya | 5002 | 2 | Coaching response cache |
| maya-voice | 5003 | 3 | Voice session state |
| vision | 5004 | — | No caching (image data too large) |
| NestJS queues | — | 4 | BullMQ job queues |

---

## Performance Targets

| Endpoint | Target | Implementation |
| --- | --- | --- |
| AI inference (habit/productivity/burnout/goal) | < 200ms | In-process model cache keyed `path:mtime`, 300s TTL |
| Maya coaching response | < 500ms | Redis cache on full request SHA-256 hash |
| OCR processing | < 1.5s | EasyOCR GPU when available; Tesseract CPU fallback |
| Recommendation generation | < 300ms | Cached at Redis with 60s TTL |
| Dashboard load | < 500ms | Pre-computed `UserDashboardSnapshot`, refreshed every 5 min |

---

## Running the Services

```bash
# Create a shared virtualenv (or use per-service envs)
python -m venv .venv && source .venv/bin/activate

# Install shared deps
pip install -r requirements/base.txt

# Start each service (separate terminals)
cd ai         && uvicorn app:app --port 5000 --reload
cd ai-platform && uvicorn app:app --port 5001 --reload
cd maya        && uvicorn app:app --port 5002 --reload
cd maya-voice  && uvicorn app:app --port 5003 --reload
cd vision      && uvicorn app:app --port 5004 --reload
```

All services read `ML_API_KEY` from the environment. Set the same value in NestJS `.env`.
