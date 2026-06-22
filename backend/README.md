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
| | **Rate Limiting** | `@nestjs/throttler` | Short / medium / long tier throttling |
| | **Caching** | `@nestjs/cache-manager` | In-memory, Redis-swappable |
| | **Events** | `@nestjs/event-emitter` | XP, achievements, notifications |
| | **Scheduling** | `@nestjs/schedule` | Cron-ready for background jobs |
| | **Validation** | class-validator + class-transformer | Global `ValidationPipe` |
| | **Logging** | Winston + nest-winston | Structured JSON logs |
| | **Health** | `@nestjs/terminus` | DB + memory heap checks |
| | **Security** | Helmet · CORS · cookie-parser | Production hardening |
| | **Dates** | dayjs | ISO week, timezone-aware calculations |

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
| **uploads** | avatar · goal image · habit evidence · general file · list · DELETE | Cloudinary uploads, metadata stored in DB |
| **calendar** | CRUD events · date range query | Calendar with all-day and timed events |
| **maya** | GET `/maya/suggestions` | Rule-based AI productivity suggestions |
| **admin** | list users · set role · set active · platform stats | RBAC user management |
| **health** | GET `/health` | DB + memory heap checks |

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
│   ├── config/                # app  auth  database  cloudinary  mail
│   ├── database/              # PrismaService (global module)
│   ├── integrations/
│   │   └── email/             # EmailService — Brevo SMTP, HTML templates
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
