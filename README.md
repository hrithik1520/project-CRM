# CRM — Self-Hosted Sales CRM with WhatsApp

A full-featured, self-hosted CRM for small-to-medium sales teams. WhatsApp-first, multi-account, pipeline-based.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Auth | Clerk |
| Database | Supabase (PostgreSQL + Prisma ORM) |
| Queue | BullMQ + Redis |
| WhatsApp | whatsapp-web.js (browser session) |
| Deployment | Docker Compose + Caddy |

## Quick Start

### 1. Prerequisites

- Docker + Docker Compose
- Node.js 20+ (for local development)
- A Supabase project
- A Clerk application

### 2. Clone and configure

```bash
git clone <repo>
cd crm
cp .env.example .env
# Edit .env with your credentials
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `DATABASE_URL` and `DIRECT_URL` from Settings → Database
3. Run migrations:
```bash
npm run db:migrate
npm run db:seed
```

### 4. Set up Clerk

1. Create an app at [clerk.com](https://clerk.com)
2. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
3. After first signup, set your role in Clerk Dashboard:
   - Go to Users → select your user → Metadata → Public
   - Add: `{ "role": "admin" }`

### 5. Start with Docker

```bash
docker-compose up -d
```

Visit `http://localhost` (or your domain).

### 6. Local development

```bash
npm install
npm run dev
```

- Web app: http://localhost:3000
- WhatsApp engine: http://localhost:3001

## Key Files

| File | Purpose |
|------|---------|
| `packages/db/prisma/schema.prisma` | Full database schema |
| `apps/web/` | Next.js CRM frontend + API |
| `apps/whatsapp/` | WhatsApp session engine |
| `.env.example` | All required environment variables |
| `docker-compose.yml` | Production deployment |
| `risks.md` | WhatsApp automation risks and mitigations |
| `docs/deployment.md` | Server setup guide |

## ⚠ WhatsApp Disclaimer

This CRM connects to WhatsApp using unofficial browser-session automation. This violates WhatsApp's Terms of Service. Account bans are possible. Use only for genuine 1-to-1 sales conversations. See [risks.md](risks.md) for full details.

## Development Milestones

- [x] **M1** — UI shell with dummy data
- [ ] **M2** — Auth, DB, pipeline, contacts, reminders (real backend)
- [ ] **M3** — WhatsApp multi-session integration
- [ ] **M4** — Automations, templates, GA4
- [ ] **M5** — Dashboard, QA, production deployment

## Default Login (after seed)

| User | Email | Password |
|------|-------|---------|
| Admin | admin@crm.local | admin123 |
| Agent | ravi@crm.local | agent123 |

> Note: With Clerk, these seed credentials are for database records only. Actual login uses Clerk authentication.
