# Ascend — Backend API

> NestJS REST API powering the Ascend productivity platform. Feature-based architecture, event-driven gamification, JWT auth with token rotation, and 22 production-ready modules.

---

## Tech Stack

| | Category | Technology | Notes |
| --- | --- | --- | --- |
| ![](./../.github/assets/nestjs.svg) | **Framework** | NestJS 11 | Feature-based module architecture |
| ![](./../.github/assets/typescript.svg) | **Language** | TypeScript 5.7 | Strict mode, `esModuleInterop` |
| ![](./../.github/assets/nodejs.svg) | **Runtime** | Node.js ≥ 20 | |
| ![](./../.github/assets/prisma.svg) | **ORM** | Prisma v6 | PostgreSQL, full-text search |
| ![](./../.github/assets/postgresql.svg) ![](./../.github/assets/neon.svg) | **Database** | PostgreSQL on Neon | Serverless, connection pooler |
| ![](./../.github/assets/passport.svg) ![](./../.github/assets/jwt.svg) | **Auth** | Passport.js + JWT | Access (15m) + refresh (7d) token rotation |
| | **OAuth** | Google + GitHub | Passport OAuth2 strategies |
| | **2FA** | Speakeasy + QRCode | TOTP via authenticator apps |
| | **Hashing** | bcryptjs | Passwords cost 12 · SHA-256 for refresh tokens |
| ![](./../.github/assets/cloudinary.svg) | **File Uploads** | Cloudinary + Multer | Avatar, goal images, habit evidence |
| ![](./../.github/assets/brevo.svg) | **Email** | Nodemailer + Brevo | Verification, password reset, welcome templates |
| ![](./../.github/assets/swagger.svg) | **API Docs** | Swagger / OpenAPI | Auto-generated at `/api/docs` |
| | **Queues** | BullMQ + `@nestjs/bull` | 4 queues — ml-events, analytics, ocr, notifications |
| | **Rate Limiting** | `@nestjs/throttler` | Short / medium / long tier throttling |
| | **Caching** | `@nestjs/cache-manager` + Redis | Redis-backed in production, in-memory fallback |
| | **Events** | `@nestjs/event-emitter` | XP, achievements, ML ingestion, notifications |
| | **Scheduling** | `@nestjs/schedule` | Cron jobs — daily rollup, streak alerts, leaderboard |
| | **Validation** | class-validator + class-transformer | Global `ValidationPipe` |
| | **Logging** | Winston + nest-winston | Structured JSON logs |
| | **Health** | `@nestjs/terminus` | DB + memory heap + ML service ping checks |
| | **Security** | Helmet · CORS · cookie-parser | Production hardening |
| | **Dates** | dayjs | ISO week, timezone-aware calculations |

---

## Architecture

### Request Pipeline

```mermaid
flowchart LR
    REQ(["Incoming\nHTTP Request"])

    subgraph Middleware["Middleware Layer"]
        direction LR
        HLM["Helmet\nsecurity headers"]
        COR["CORS\norigin check"]
        RID["RequestID Middleware\nX-Request-ID header\nfor log correlation"]
    end

    subgraph Guards["Guard Layer"]
        direction LR
        THR["ThrottlerGuard\nshort 10/s · med 30/10s\nlong 100/min"]
        JWT["JwtAuthGuard\nverify access token"]
        ROL["RolesGuard +\nPermissionsGuard\nRBAC — zero DB hits"]
    end

    subgraph Processing["Processing Layer"]
        direction LR
        VAL["ValidationPipe\nclass-validator\nwhitelist · forbidNonWhitelisted"]
        HND["Route Handler\n@Controller + @Service"]
        TRF["TransformInterceptor\n{ data, statusCode, timestamp }"]
    end

    ERR["GlobalExceptionFilter\nstructured error — no stack trace"]
    RES(["HTTP Response"])

    REQ --> HLM --> COR --> RID --> THR --> JWT --> ROL --> VAL --> HND --> TRF --> RES
    HND -- throws --> ERR --> RES
```

---

### Module Dependency Graph

```mermaid
flowchart TD
    subgraph Root["AppModule"]
        direction LR
        DB["DatabaseModule\n@Global · PrismaService"]
        EM["EmailModule\nBrevo SMTP"]
        AGW["AiGatewayModule\n@Global · circuit breaker · retry"]
        QM["QueuesModule\nBullMQ · Redis DB:4\n4 queues · 5 processors"]
        JM["JobsModule\n3 cron schedulers\ndaily · streaks · leaderboard"]
        CM["CacheModule\n@Global · Redis-backed"]
        EVT["EventEmitterModule\nwildcard · maxListeners:20"]
        SCH["ScheduleModule"]
    end

    subgraph Domain["Domain Modules (22)"]
        direction LR
        Auth["AuthModule\nJWT · OAuth · 2FA · lockout"]
        Users["UsersModule"]
        Habits["HabitsModule + HabitLogsModule"]
        Goals["GoalsModule + GoalProgressModule"]
        Focus["FocusModule\nPomodoro · DeepWork · UltraFocus"]
        Gamification["XpModule · LevelsModule · SkillsModule\nAchievementsModule · BadgesModule"]
        Social["LeaderboardModule · AccountabilityModule\nSocialTrackerModule"]
        Content["PlannerModule · CalendarModule"]
        Platform["AnalyticsModule · NotificationsModule\nUploadsModule · MayaModule"]
        Infra["HealthModule · AdminModule · AuditLogsModule"]
    end

    Root --> Domain
    QM --> AGW
    QM --> DB
    JM --> QM
    JM --> DB
    Platform --> AGW
    Platform --> QM
    Domain --> DB
```

---

### Event-Driven Gamification & ML Flow

```mermaid
sequenceDiagram
    participant Handler  as Route Handler
    participant EE       as EventEmitter2
    participant XP       as XpModule
    participant Ach      as AchievementsModule
    participant Notif    as NotificationsQueue
    participant Listener as MlEventsListener
    participant MLQueue  as BullMQ ml-events
    participant AnalQ    as BullMQ analytics
    participant MLSvc    as ai-platform :5001

    Handler->>EE: emit('habit.completed', { userId, habitId, xpEarned, streak })
    EE->>XP: onHabitCompleted — award XP atomically
    XP->>EE: emit('xp.awarded', { newTotalXp })
    EE->>XP: onXpAwarded — check level threshold
    XP->>EE: emit('xp.level_up', { newLevel })
    EE->>Ach: checkUnlocks — scan all achievement conditions
    Ach->>EE: emit('achievement.unlocked')
    EE->>Notif: push notification job (queue)
    EE->>Listener: onHabitCompleted
    Listener->>MLQueue: add ingest-feature job
    Listener->>AnalQ: add compute-daily + refresh-snapshot jobs
    Note over MLQueue,MLSvc: async — never blocks the HTTP response
    MLQueue->>MLSvc: POST /ingest-event (anti-poison filtered)
```

---

### Queue Architecture

```mermaid
flowchart LR
    subgraph Producers["Producers"]
        direction TB
        EL["MlEventsListener\n@OnEvent — 15+ domain events"]
        AJ["AnalyticsJob\ncron 00:05 daily · */5 * * * *"]
        SJ["StreakJob\ncron 20:00 · 00:02 daily"]
        LJ["LeaderboardJob\ncron */15 6-23 * * *"]
        UP["UploadsService\npost-upload trigger"]
    end

    subgraph Redis["Redis  DB:4  —  BullMQ"]
        direction TB
        Q1["ml-events\nattempts:3 · exp backoff 2s\nremoveOnComplete:100"]
        Q2["analytics\nattempts:3 · exp backoff 1s\nremoveOnComplete:100"]
        Q3["ocr\nattempts:2 · fixed delay 5s\nremoveOnComplete:50"]
        Q4["notifications\nattempts:5 · exp backoff 1s\nremoveOnComplete:200"]
    end

    subgraph Workers["Processors  (NestJS workers)"]
        direction TB
        P1["MlEventsProcessor\ningest-feature → ai-platform :5001\nanticheat-check → ai-engine :5000"]
        P2["AnalyticsProcessor\ncompute-daily → upsert AnalyticsDaily\nrefresh-snapshot → upsert Dashboard"]
        P3["OcrProcessor\nocr-process → vision :5004\nemit ocr.intelligence_ready"]
        P4["NotificationsProcessor\npush-notification → DB insert\nemit notification.created (WS)"]
    end

    EL --> Q1 & Q2
    AJ --> Q2
    SJ --> Q4
    LJ -.->|SQL UPDATE direct| DB2[("PostgreSQL")]
    UP --> Q3
    Q1 --> P1
    Q2 --> P2
    Q3 --> P3
    Q4 --> P4
```

---

### ML Gateway — Circuit Breaker Pattern

```mermaid
stateDiagram-v2
    [*]    --> Closed   : service starts
    Closed --> Closed   : request succeeds\nfailures--
    Closed --> Open     : 5 consecutive failures\nopenUntil = now + 30s
    Open   --> HalfOpen : 30 seconds elapsed
    HalfOpen --> Closed  : probe request succeeds\nfailures = floor(threshold/2)
    HalfOpen --> Open    : probe request fails\nopenUntil = now + 30s

    note right of Open
        Returns GatewayResult { ok: false }
        immediately — no HTTP call made.
        Caller can use rule-based fallback.
    end note

    note right of Closed
        2 retries with 200ms / 400ms
        exponential backoff before
        a failure is recorded.
    end note
```

---

## Modules

| Module | Endpoints | Description |
| --- | --- | --- |
| **auth** | register · login · google · github · refresh · logout · verify-email · forgot-password · reset-password · 2fa/setup · 2fa/enable | JWT auth, OAuth2, 2FA, brute-force lockout, token rotation |
| **users** | GET/PATCH/DELETE `/users/me` · PATCH `/users/me/password` · GET `/users/profile/:username` | Profile, password change, soft delete, public profile |
| **habits** | CRUD `/habits` · `/habits/:id/stats` | Categories, reminders, XP rewards |
| **habit-logs** | POST `/habits/:id/log` · GET `/habits/:id/logs` · DELETE · GET `/habits/heatmap` | Completions, 48h backdating cap, heatmap |
| **planner** | CRUD `/planner/tasks` · `/tasks/range` · `/tasks/overdue` | Task management with priorities, date range queries |
| **goals** | CRUD `/goals` · PATCH `/goals/:id/progress` | Milestones, auto-complete at 100% |
| **goal-progress** | GET `/goals/:goalId/progress` | Paginated progress history |
| **focus** | start · complete · interrupt · GET sessions · GET stats | POMODORO / DEEP\_WORK / ULTRA\_FOCUS with XP rewards |
| **xp** | GET `/xp/level` · GET `/xp/history` | Atomic level-up, multi-level-up, XP ledger |
| **levels** | GET `/levels/me` · GET `/levels/thresholds` | `level² × 100` XP formula |
| **skills** | GET `/skills` | 8 skills with event-driven XP progression |
| **achievements** | GET `/achievements` · GET `/achievements/mine` | 12 seeded, event-driven unlock, rarity tiers |
| **badges** | GET · GET mine · PATCH `/:id/display` | Earn and display up to 6 badges |
| **leaderboard** | global XP · weekly XP · streaks · my-rank | Rankings with hydrated user info |
| **analytics** | dashboard · daily · weekly · monthly · snapshot/refresh | Pre-computed + live dashboard snapshot |
| **notifications** | GET · unread-count · mark-read · mark-all-read · DELETE | Event-driven push notifications |
| **social-tracker** | POST · GET · DELETE | Daily social media usage logs by platform |
| **accountability** | create · list · complete · fail | Commitments with XP stakes |
| **uploads** | avatar · goal image · habit evidence · general file · list · DELETE | Cloudinary uploads, auto-enqueue OCR for images/PDFs |
| **calendar** | CRUD events · date range query | Calendar with all-day and timed events |
| **maya** | GET `/maya/suggestions` · POST `/maya/chat` | AI coaching — full DB context assembled in NestJS, calls ml/maya, rule-based fallback |
| **admin** | list users · set role · set active · platform stats | RBAC user management |
| **health** | GET `/health` | DB + memory heap + all 4 ML service ping checks |

---

## Security

| Feature | Implementation |
| --- | --- |
| Password hashing | bcryptjs, cost factor 12 |
| Refresh token storage | SHA-256 hash in `sessions` table — raw token never persisted |
| Token reuse detection | Hash mismatch → all user sessions immediately revoked |
| Brute-force protection | 10 failed logins → 15-min lockout (`failedLoginAttempts`, `lockUntil`) |
| RBAC | `RolesGuard` + `PermissionsGuard` — in-process map, zero DB hits per request |
| Rate limiting | Short 10/s · medium 30/10s · long 100/min |
| Input validation | `whitelist: true`, `forbidNonWhitelisted: true` on every route |
| OAuth redirect | URL fragment (`#token=`) — never logged by proxy servers |
| HTTP hardening | Helmet headers, CORS, secure cookie options |
| ML inter-service auth | `x-api-key` header on every ML call; validated by each Python service |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # 28 models · 15 enums
│   └── seed/index.ts          # Skills, achievements, challenges
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── common/
│   │   ├── decorators/        # @CurrentUser  @Roles  @Permissions  @Public
│   │   ├── filters/           # GlobalExceptionFilter
│   │   ├── guards/            # JwtAuthGuard  RolesGuard  PermissionsGuard  ThrottlerGuard
│   │   ├── interceptors/      # TransformInterceptor  LoggingInterceptor
│   │   ├── pipes/             # ParseUuidPipe
│   │   └── utils/             # pagination  try-catch
│   ├── config/                # app  auth  database  cloudinary  mail  ml
│   ├── database/              # PrismaService (global module)
│   ├── integrations/
│   │   ├── email/             # EmailService — Brevo SMTP, HTML templates
│   │   └── ai-gateway/        # AiGatewayService — circuit breaker, retry, all ML endpoints
│   ├── queues/                # BullMQ processors + MlEventsListener
│   │   ├── ml-events/         # feature ingestion · anticheat
│   │   ├── analytics/         # daily rollup · dashboard snapshot
│   │   ├── ocr/               # OCR pipeline processor
│   │   └── notifications/     # push delivery
│   ├── jobs/                  # Cron schedulers
│   │   ├── analytics/         # daily · weekly rollup + 5-min snapshot refresh
│   │   ├── streaks/           # 20:00 alert · 00:02 update
│   │   └── leaderboard/       # 15-min XP refresh
│   └── modules/               # 22 feature modules
└── test/http/                 # .http test files for every endpoint
```

---

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start in watch mode — hot reload on port **4000** |
| `pnpm start` | Start compiled build (`node dist/main`) |
| `pnpm build` | Compile TypeScript (`nest build`) |
| `pnpm type-check` | TypeScript check without emit |
| `pnpm lint` | ESLint with auto-fix |
| `pnpm test` | Jest unit tests |
| `pnpm test:cov` | Jest with coverage report |
| `pnpm db:migrate` | Run Prisma migrations (dev) |
| `pnpm db:migrate:prod` | Deploy migrations (production) |
| `pnpm db:generate` | Regenerate Prisma client after schema changes |
| `pnpm db:seed` | Seed skills, achievements, and challenges |
| `pnpm db:studio` | Open Prisma Studio at `localhost:5555` |
| `pnpm db:reset` | Reset and re-migrate dev database |

### Start the server

```bash
# Development — hot reload
cd backend
pnpm dev

# Production — compiled
cd backend
pnpm build && pnpm start
```

| URL | |
| --- | --- |
| `http://localhost:4000/api/v1` | REST API base |
| `http://localhost:4000/api/docs` | Swagger UI (dev only) |
| `http://localhost:4000/api/v1/health` | Health check |

---

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Secret for signing JWTs | any strong random string |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `GOOGLE_CLIENT_ID` | Google OAuth app client ID | from Google Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth app secret | from Google Console |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback | `http://localhost:4000/api/v1/auth/google/callback` |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | from GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret | from GitHub Developer Settings |
| `GITHUB_CALLBACK_URL` | GitHub OAuth callback | `http://localhost:4000/api/v1/auth/github/callback` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc123...` |
| `SMTP_HOST` | SMTP relay host | `smtp-relay.brevo.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | Use TLS | `false` |
| `SMTP_USER` | SMTP username | from Brevo |
| `SMTP_PASS` | SMTP password | from Brevo |
| `SMTP_FROM` | Sender name + address | `"Ascend <hello@ascend.app>"` |
| `FRONTEND_URL` | Frontend base URL (email links) | `http://localhost:3000` |
| `PORT` | API server port | `4000` |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_QUEUE_DB` | Redis DB index for BullMQ queues | `4` |
| `REDIS_URL` | Full Redis URL — enables Redis HTTP cache | `redis://localhost:6379/0` |
| `ML_API_KEY` | Shared secret for NestJS ↔ ML inter-service auth | strong random string |
| `AI_ENGINE_URL` | ai-engine service base URL | `http://localhost:5000` |
| `AI_PLATFORM_URL` | ai-platform service base URL | `http://localhost:5001` |
| `MAYA_URL` | maya service base URL | `http://localhost:5002` |
| `MAYA_VOICE_URL` | maya-voice base URL | `http://localhost:5003` |
| `OCR_URL` | vision/OCR service base URL | `http://localhost:5004` |
| `ML_TIMEOUT_MS` | HTTP timeout for all ML calls | `8000` |
