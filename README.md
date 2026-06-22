# Ascend

> A SaaS productivity platform. Build habits, crush goals, track your growth one day at a time.

---

## Monorepo Structure

```
ascend/
├── backend/            # NestJS REST API
├── frontend/           # Next.js 15 web app
├── package.json        # Root workspace manifest
├── pnpm-workspace.yaml
├── turbo.json
└── docker-compose.yml
```

| Package | Description | Port |
| --- | --- | --- |
| `backend` | NestJS API — auth, habits, goals, gamification, analytics | `4000` |
| `frontend` | Next.js 15 — dashboard, onboarding, all UI | `3000` |

---

## Stack

| | Layer | Technology |
| --- | --- | --- |
| 🔴 | **API** | NestJS 11 + TypeScript 5 |
| 🐘 | **Database** | PostgreSQL on Neon (serverless) |
| ◼️ | **ORM** | Prisma v6 |
| 🔐 | **Auth** | JWT token rotation · OAuth2 (Google, GitHub) · TOTP 2FA |
| ☁️ | **File Storage** | Cloudinary |
| 📧 | **Email** | Nodemailer + Brevo SMTP |
| ▲ | **Frontend** | Next.js 15 (App Router) · React 19 · Tailwind CSS v4 |
| 📦 | **Package Manager** | pnpm workspaces |
| 🚀 | **Build System** | Turborepo |

---

## Prerequisites

| Requirement | Version |
| --- | --- |
| Node.js | ≥ 20.0.0 |
| pnpm | ≥ 10.0.0 |
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
