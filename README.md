# Ascend

> A SaaS productivity platform. Build habits, crush goals, track your growth one day at a time.

---

## What is Ascend?

Most people who want to improve their lives juggle five different apps — one for habits, one for tasks, one for goals, a timer for focus sessions, and a notes app to track what actually happened. Nothing connects. Progress is invisible. Motivation fades.

Ascend brings all of that into one place and makes it actually rewarding to show up every day.

You set goals with milestones and attach motivation images — the grade screenshot, the target physique, the savings number. You build habits that feed directly into those goals and log completions to keep streaks alive. You run timed focus sessions that reward you with XP. Your work compounds into a level, a skill tree, achievements, and a leaderboard.

The platform runs an AI suggestion engine (Maya) that reads your data — missed habits, overdue tasks, social media overuse — and sends you a tailored action plan each day instead of generic advice.

### The problem it solves

| Common struggle | How Ascend addresses it |
| --- | --- |
| Habits break without visible streaks | Heatmap calendar, streak count, XP for every log |
| Goals feel abstract and distant | Milestone progress bars, motivation image uploads, auto-complete at 100% |
| Context-switching kills deep work | Built-in Pomodoro / Deep Work / Ultra Focus timer with session history |
| No feedback on whether effort is consistent | Weekly and monthly analytics with charts, daily snapshots |
| Accountability without a coach | Commitment tracker — declare a goal publicly, stake XP on it |
| Social media eating productive time | Social tracker logs daily platform usage and feeds into Maya's suggestions |
| Motivation is personal and visual | Upload your own motivation images tied to specific goals |

### Benefits

- **Single dashboard** — habits, tasks, focus, goals, analytics, and your rank in one view.
- **Gamified progress** — XP, levels, skill trees, rarity-tiered achievements, and weekly leaderboards make consistency intrinsically rewarding.
- **Data that talks back** — Maya reads your logs daily and produces specific, personalized suggestions rather than generic wellness tips.
- **Built for real goals** — attach grade screenshots, weight targets, savings goals, or any motivation image to a goal and see it every time you check progress.
- **Full accountability loop** — declare a commitment, stake XP, mark it done or fail it.

---

## System Architecture

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontSize': '15px', 'fontFamily': 'monospace'}}}%%
flowchart LR
    subgraph Clients["  Clients  "]
        direction TB
        Browser["🌐 Browser"]
        Mobile["📱 Mobile"]
    end

    subgraph FE["  Frontend  :3000  "]
        direction TB
        Next["Next.js 15"]
        React["React 19"]
        Tailwind["Tailwind v4"]
    end

    subgraph API["  NestJS Backend  :4000  "]
        direction TB
        Core["22 Feature Modules\nauth · habits · goals · focus\nXP · achievements · analytics"]
        GW["AiGatewayService\ncircuit breaker + retry"]
        BQ["BullMQ Workers\n4 queues on Redis DB:4"]
        CRON["Cron Schedulers\ndaily rollup · streaks · leaderboard"]
    end

    subgraph ML["  ML Platform  (Python / FastAPI)  "]
        direction TB
        AI["🧠 ai-engine  :5000\nXGBoost · SHAP\nproductivity · habit · burnout · goal"]
        AP["⚙️ ai-platform  :5001\nFeature Store · Retraining\nChampion / Challenger"]
        MA["💬 maya  :5002\nClaude Opus 4.8\nAI productivity coaching"]
        MV["🎙️ maya-voice  :5003\nOpenWakeWord · Whisper STT\nPiper TTS"]
        VI["🔍 vision  :5004\nTesseract · EasyOCR\nPaddleOCR · pdf2image"]
    end

    subgraph Data["  Data Layer  "]
        direction TB
        PG[("🐘 PostgreSQL\nNeon serverless\n28 models · 15 enums")]
        Redis[("⚡ Redis\ncache · rate limits\nBullMQ queues")]
        FS[("📁 Feature Store\nJSONL per user/model\nanti-poisoning filtered")]
    end

    subgraph Ext["  External Services  "]
        direction TB
        CDN["☁️ Cloudinary\nimage · PDF storage"]
        SMTP["✉️ Brevo SMTP\nverification · reset\nwelcome emails"]
        Anthropic["🤖 Anthropic API\nClaude Opus 4.8"]
    end

    Clients -->|HTTPS| FE
    FE -->|REST + JWT| API
    Core -->|Prisma ORM| PG
    Core -->|ioredis| Redis
    Core -->|Cloudinary SDK| CDN
    Core -->|Nodemailer| SMTP
    GW -->|x-api-key| AI
    GW -->|x-api-key| AP
    GW -->|x-api-key| MA
    GW -->|x-api-key| VI
    BQ -->|jobs| Redis
    BQ -->|async ingest| AP
    BQ -->|async score| AI
    BQ -->|async ocr| VI
    MA -->|Anthropic SDK| Anthropic
    AI <-->|cache| Redis
    MA <-->|cache| Redis
    AP -->|read/write| FS
    AI -->|read| FS
```

---

## Request & Event Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontSize': '14px'}}}%%
sequenceDiagram
    actor User
    participant FE   as Frontend :3000
    participant API  as NestJS :4000
    participant PG   as PostgreSQL
    participant EE   as EventEmitter2
    participant Redis as Redis :6379
    participant Q    as BullMQ Queues
    participant ML   as ML Services

    User->>FE: tap "Complete Habit"
    FE->>API: POST /habit-logs  Authorization: Bearer JWT
    API->>PG: INSERT habit_log  (streak + XP atomic)
    PG-->>API: updated record
    API-->>FE: 201 { streak, xpEarned, newLevel }
    API->>EE: emit('habit.completed', payload)
    API->>EE: emit('xp.awarded', payload)
    EE->>Q: ml-events queue → ingest-feature job
    EE->>Q: analytics queue → compute-daily job
    Note over Q,ML: async — does not block the response
    Q->>ML: ai-platform :5001  POST /ingest-event
    ML->>ML: anti-poison check (cheat_confidence)
    ML->>ML: append to Feature Store JSONL
    Q->>ML: ai-engine :5000  POST /score/productivity
    ML->>ML: XGBoost inference + SHAP
    ML-->>Q: AIEnvelope { prediction, confidence, factors }
    Q->>PG: upsert AnalyticsDaily row
```

---

## Monorepo Structure

```
ascend/
├── backend/
│   ├── src/                 # NestJS application
│   │   ├── modules/         # 22 feature modules
│   │   ├── integrations/
│   │   │   ├── email/       # Brevo SMTP
│   │   │   └── ai-gateway/  # AiGatewayService (circuit breaker + retry)
│   │   ├── queues/          # BullMQ processors + event listeners
│   │   └── jobs/            # Cron schedulers
│   ├── ml/
│   │   ├── ai/              # XGBoost inference engine  :5000
│   │   ├── ai-platform/     # MLOps platform            :5001
│   │   ├── maya/            # Claude coaching           :5002
│   │   ├── maya-voice/      # Voice interface           :5003
│   │   └── vision/          # OCR pipeline              :5004
│   └── prisma/              # Schema (28 models) + migrations
├── frontend/                # Next.js 15 web app        :3000
├── pnpm-workspace.yaml
└── turbo.json
```

| Package | Description | Port |
| --- | --- | --- |
| `backend` | NestJS API — auth, habits, goals, gamification, analytics | `4000` |
| `frontend` | Next.js 15 — dashboard, onboarding, all UI | `3000` |
| `backend/ml/ai` | XGBoost inference — productivity, habit, burnout, goal | `5000` |
| `backend/ml/ai-platform` | MLOps — feature store, retraining, champion/challenger | `5001` |
| `backend/ml/maya` | Claude Opus 4.8 coaching engine | `5002` |
| `backend/ml/maya-voice` | Voice interface — Whisper STT, Piper TTS | `5003` |
| `backend/ml/vision` | OCR pipeline — Tesseract, EasyOCR, PaddleOCR | `5004` |

---

## Stack

| Layer | | |
| --- | --- | --- |
| **API** | ![](.github/assets/nestjs.svg) ![](.github/assets/typescript.svg) ![](.github/assets/nodejs.svg) | NestJS 11 · TypeScript 5 · Node.js 20 |
| **Database** | ![](.github/assets/postgresql.svg) ![](.github/assets/prisma.svg) ![](.github/assets/neon.svg) | PostgreSQL · Prisma v6 · Neon serverless |
| **Auth** | ![](.github/assets/jwt.svg) ![](.github/assets/passport.svg) | JWT rotation · OAuth2 · TOTP 2FA |
| **Files & Email** | ![](.github/assets/cloudinary.svg) ![](.github/assets/brevo.svg) | Cloudinary uploads · Brevo SMTP |
| **Docs** | ![](.github/assets/swagger.svg) | Swagger / OpenAPI at `/api/docs` |
| **Frontend** | ![](.github/assets/nextjs.svg) ![](.github/assets/react.svg) ![](.github/assets/tailwind.svg) | Next.js 15 · React 19 · Tailwind v4 |
| **ML** | | XGBoost · SHAP · Claude Opus 4.8 · Faster Whisper · Piper TTS |

---

## Prerequisites

| Requirement | Version |
| --- | --- |
| Node.js | ≥ 20.0.0 |
| pnpm | ≥ 10.0.0 |
| Python | ≥ 3.11 |
| Redis | ≥ 7.0 |
| PostgreSQL | Neon account or local instance |

---

## Root Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start backend + frontend concurrently |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | TypeScript check across all packages |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed database with skills, achievements, challenges |
| `pnpm db:studio` | Open Prisma Studio |
