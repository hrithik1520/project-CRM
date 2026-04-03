# Architecture Document

**Version:** 1.0  
**Date:** 2026-04-02

---

## 1. Recommended Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js 14 (App Router) | SSR for fast initial load, RSC for data pages, API routes for BFF, single repo |
| UI Library | Tailwind CSS + shadcn/ui | Fast, minimal, production-quality components, no over-design |
| State | Zustand (client state) + React Query (server state) | Lightweight, predictable, no Redux boilerplate |
| Backend | Next.js API Routes + Express microservice for WhatsApp engine | API routes for most CRM logic; WhatsApp session engine isolated as separate Node process |
| Database | PostgreSQL 15 | Relational, battle-tested, JSONB for flexible fields, full-text search built-in |
| ORM | Prisma | Type-safe, migration-friendly, excellent DX |
| Auth | **Clerk** (`@clerk/nextjs`) | Hosted auth with built-in UI, MFA, social login, session management. CRM roles stored in `publicMetadata`. No custom password/JWT code needed. |
| Realtime | Socket.IO | Mature, fallback-friendly, works well with Node |
| Queue | BullMQ + Redis | Reliable job queues for message sending, automations, GA4 dispatch |
| WhatsApp Engine | whatsapp-web.js | Most maintained unofficial library; runs as separate Express service |
| File Storage | Local filesystem (MVP) → MinIO-compatible S3 path later | Self-hosted, no external dependency for MVP |
| Deployment | Docker Compose | Single-command startup, service isolation |
| Reverse Proxy | Caddy | Auto-HTTPS, simple config, better DX than Nginx for self-hosted |
| Analytics | GA4 Measurement Protocol (HTTP API) | Server-side event push, no SDK needed |

---

## 2. Monorepo Decision

**Decision: Single repository, separated by folders.**

```
crm/
  apps/
    web/           ← Next.js app (frontend + API routes)
    whatsapp/      ← WhatsApp session engine (Express + whatsapp-web.js)
  packages/
    db/            ← Prisma schema + client (shared)
    types/         ← Shared TypeScript types
    utils/         ← Shared utilities
  docker/
  docs/
```

**Why:** Two apps are genuinely separate (WhatsApp engine must be isolated), but they share DB schema and types. A monorepo avoids duplication. We use simple npm workspaces — no Turborepo/NX complexity for MVP.

---

## 3. Frontend Architecture

```
apps/web/
  app/
    (auth)/         ← Login page (public)
    (dashboard)/    ← Protected layout with sidebar
      dashboard/    ← Overview page
      leads/        ← Pipeline board + list
      leads/[id]/   ← Lead detail
      contacts/     ← Contact list + detail
      inbox/        ← WhatsApp inbox (session selector + chat)
      orders/       ← Orders list
      reminders/    ← Reminders + tasks calendar
      templates/    ← Template manager
      automations/  ← Automation rules
      settings/     ← All settings pages
  components/
    ui/             ← shadcn/ui base components
    crm/            ← Domain components (LeadCard, PipelineBoard, etc.)
    whatsapp/       ← Chat UI, session badge, QR modal
    layout/         ← Sidebar, topbar, shell
  lib/
    api/            ← API client (typed fetch wrappers)
    hooks/          ← Custom hooks
    store/          ← Zustand stores
    socket/         ← Socket.IO client setup
```

**Key decisions:**
- App Router with React Server Components for data-heavy pages (lead list, contacts)
- Client components for interactive UI (Kanban board, chat window)
- React Query for all data fetching with cache invalidation
- Socket.IO client for real-time: incoming messages, session status changes, reminders

---

## 4. Backend Architecture

**CRM API (Next.js API Routes — `/apps/web/app/api/`)**

```
api/
  auth/          ← NextAuth handlers
  leads/         ← CRUD + stage moves + assignments
  contacts/      ← CRUD + search
  messages/      ← Send message (queues job), fetch history
  sessions/      ← WhatsApp session status, list, connect/disconnect
  templates/     ← Template CRUD
  automations/   ← Automation rule CRUD
  reminders/     ← Reminder CRUD
  tasks/         ← Task CRUD
  orders/        ← Order + payment CRUD
  webhooks/      ← Inbound lead webhooks (website forms)
  ga4/           ← GA4 queue management
  admin/         ← Team, settings, pipeline management
```

**WhatsApp Engine (`apps/whatsapp/` — standalone Express service)**

```
src/
  sessions/      ← SessionManager: create, destroy, restore sessions
  handlers/      ← Incoming message handler, QR event handler
  routes/        ← REST API for web app to call: send, status, qr, sessions
  worker/        ← BullMQ worker: consumes send-message jobs
  store/         ← Auth file persistence (.wwebjs_auth/)
  events/        ← Emits events to Socket.IO server
```

**Why isolated:** whatsapp-web.js uses Puppeteer/Chromium. Running it inside Next.js would make deployments unstable and slow. Isolation means crashes in one session don't take down the CRM.

---

## 5. Database Schema Overview

Core tables and their relationships:

```
users ─────────────────── roles (enum: admin, manager, agent)
  │
  ├── assigned to ──────── leads
  │
pipelines ────────────── lead_stages ───── leads
                                               │
contacts ──────────────────────────────────────┤
  │                                            │
  ├── conversations ────── messages            │
  │                                            │
  ├── notes                                    │
  │                                            │
  └── lead_activity ───────────────────────────┤
                                               │
                            reminders ─────────┤
                            tasks ─────────────┤
                            orders ────────────┤
                              │
                            order_items
                            payments
                                               │
whatsapp_accounts ──── whatsapp_sessions       │
                            │                  │
                          messages ────────────┘

message_templates
automations ──── automation_runs
audit_logs
ga4_event_queue
webhooks
tags ──── (lead_tags, contact_tags join tables)
```

See `prisma/schema.prisma` for full detail.

---

## 6. Real-Time Event Layer

**Architecture:** Socket.IO server runs inside the WhatsApp engine process. The Next.js web app connects as a Socket.IO client (server-side) and proxies events to browser clients.

**Alternatively (simpler for MVP):** Socket.IO server runs as part of the Next.js custom server. WhatsApp engine posts events to the Next.js API via internal HTTP, which then emits to browser clients.

**Decision: Option 2 (simpler).** WhatsApp engine posts events to Next.js via `POST /api/internal/events` (internal, auth-token gated). Next.js emits to connected browser clients via Socket.IO.

**Events broadcast to browser:**
- `whatsapp:message_received` — new incoming message
- `whatsapp:session_status` — session connected/disconnected/qr
- `reminder:due` — reminder firing
- `lead:updated` — lead stage change, assignment change
- `notification:new` — internal notification

---

## 7. WhatsApp Session Engine Design

```
SessionManager
  └── Map<sessionId, WhatsAppSession>
        └── WhatsAppSession
              ├── client: WWebJS.Client
              ├── status: 'initializing' | 'qr' | 'connected' | 'disconnected'
              ├── authPath: string (persisted)
              ├── lastQR: string | null
              └── eventHandlers: onMessage, onQR, onReady, onDisconnected
```

**Persistence:** Auth files stored in `./whatsapp-sessions/{sessionId}/` volume-mounted. On restart, each session auto-restores from auth files without re-scanning QR.

**QR Flow:**
1. Web app calls `POST /sessions/:id/start`
2. Engine initializes client, gets QR event
3. Engine posts QR data to Next.js internal events endpoint
4. Next.js emits `whatsapp:session_status { status: 'qr', qr: '...' }` to browser
5. Browser renders QR code modal
6. User scans → client fires `ready` event
7. Engine posts `connected` event → browser modal closes

**Message Send Flow:**
1. API receives send request
2. Validates session is `connected`
3. Creates `messages` record with `status: 'queued'`
4. Pushes BullMQ job: `{ sessionId, to, body, messageId }`
5. Worker picks up job, calls `session.client.sendMessage()`
6. On success: updates message to `status: 'sent'`
7. On failure: retries up to 3x with exponential backoff, then marks `failed`

**Incoming Message Handler:**
1. `client.on('message')` fires
2. Look up or create contact by phone number
3. Look up or create conversation
4. Save message to DB
5. Post event to Next.js internal endpoint
6. Next.js emits to browser socket

---

## 8. Job / Queue Design

**Queue: `whatsapp-send`**
- Producer: API route on message send
- Consumer: WhatsApp engine worker
- Retry: 3 attempts, exponential backoff
- Concurrency: 2 per session (avoid rate limits)

**Queue: `automation-run`**
- Producer: Automation scheduler (runs every 5 min via cron job inside BullMQ)
- Consumer: Automation worker in Next.js backend
- Actions: send message job, create task, create reminder, move stage, notify

**Queue: `ga4-dispatch`**
- Producer: Any backend action that generates a GA4 event
- Consumer: GA4 worker that batches and posts to Measurement Protocol endpoint
- Retry: 2 attempts; on failure, log and discard (GA4 is non-critical)

**Queue: `reminder-check`**
- Repeatable job: every 60 seconds
- Checks for reminders due in next 60 seconds
- Emits socket events and creates in-app notifications

---

## 9. Auth and Permissions

**Auth:** [Clerk](https://clerk.com) via `@clerk/nextjs`.

**How it works:**
- `clerkMiddleware()` in `middleware.ts` protects all routes automatically
- `ClerkProvider` wraps the entire app in `layout.tsx`
- Login/signup UI served by Clerk's hosted components (`<SignIn />`, `<SignUpButton />`)
- User avatar/profile/sign-out handled by Clerk's `<UserButton />`
- After first signup: admin sets CRM role via Clerk Dashboard → `publicMetadata: { role: 'admin' | 'manager' | 'agent' }`

**CRM role access in code:**
```typescript
// Client components
import { useUser } from '@clerk/nextjs'
const { user } = useUser()
const role = user?.publicMetadata?.role as CRMRole

// Server components / API routes
import { auth, currentUser } from '@clerk/nextjs/server'
const { userId } = await auth()
const user = await currentUser()
const role = user?.publicMetadata?.role as CRMRole
```

**Permission checks:**
```typescript
// lib/permissions.ts
hasPermission(role: CRMRole, action: Action): boolean
```

**Role matrix:**

| Action | admin | manager | agent |
|--------|-------|---------|-------|
| manage_users | ✓ | | |
| manage_sessions | ✓ | | |
| manage_pipelines | ✓ | ✓ | |
| view_all_leads | ✓ | ✓ | |
| assign_lead | ✓ | ✓ | |
| create_lead | ✓ | ✓ | ✓ |
| edit_own_lead | ✓ | ✓ | ✓ |
| send_message | ✓ | ✓ | ✓ |
| manage_templates | ✓ | ✓ | |
| manage_automations | ✓ | | |
| view_audit_logs | ✓ | | |

---

## 10. File / Media Handling

**MVP:** Incoming media (images, docs) saved to local volume `./uploads/media/{sessionId}/{msgId}.{ext}`. Served via Next.js static file route.

**Phase 2:** Move to S3-compatible storage (MinIO, Cloudflare R2). Upload URLs signed, no direct public access.

**Limits:** 10MB per file MVP. Configurable via env.

---

## 11. Logging and Audit Trail

**Audit log** (`audit_logs` table): every create/update/delete on lead, contact, order, payment, user, pipeline, session. Fields: `user_id`, `action`, `entity_type`, `entity_id`, `before`, `after` (JSONB), `ip`, `created_at`.

**App logs:** `pino` logger. JSON format. Log to stdout in Docker. Severity levels: info, warn, error.

**WhatsApp engine logs:** Per-session log file + stdout. Session events, errors, reconnects.

**Error tracking:** Uncaught exceptions logged to stderr. Phase 2: integrate Sentry (self-hosted Glitchtip).

---

## 12. Deployment Topology

```
Internet
    │
  [Caddy]  ← HTTPS termination, reverse proxy
    │
    ├── / ──────────────────── [Next.js app] :3000
    │                               │
    │                           [PostgreSQL] :5432
    │                           [Redis] :6379
    │
    └── /ws-engine ─────────── [WhatsApp Engine] :3001
                                    │
                                [./whatsapp-sessions/] (volume)
                                [./uploads/] (volume)
```

All services in `docker-compose.yml` on the same Docker network. Caddy as the only public-facing service.

---

## 13. Backup Strategy

**Database:** Daily `pg_dump` via cron inside a backup container. Output to `./backups/db/`. Retain 7 days.

**WhatsApp sessions:** Volume `./whatsapp-sessions/` backed up daily. Session auth files are critical — losing them means re-scanning QR.

**Uploads:** Volume `./uploads/` backed up weekly.

**Backup script:** Included in `docker/backup.sh`. Operator configures destination (local, rsync, rclone to S3).

---

## 14. Security Design

- All API routes require valid session JWT (except `/api/auth/**` and `/api/webhooks/**`)
- Webhook endpoints protected by shared secret header (`X-Webhook-Secret`)
- Internal events endpoint (`/api/internal/events`) protected by shared secret between WhatsApp engine and Next.js
- Passwords: bcrypt, cost factor 12
- SQL injection: prevented by Prisma parameterized queries
- XSS: Next.js escapes by default; avoid `dangerouslySetInnerHTML`
- CSRF: SameSite=Lax cookie + origin check on mutations
- Rate limiting: per-IP on auth endpoints (10 req/min); per-user on message send (60 msg/min)
- Env vars: never committed; `.env.example` only
- Docker: non-root user in containers
- Caddy: HSTS headers, TLS 1.2+

---

## 15. Failure Recovery Design

**WhatsApp session disconnect:**
- Client fires `disconnected` event
- Engine attempts reconnect every 30s (up to 5 times)
- If auth files valid: reconnect without QR
- If auth invalid (logged out from phone): status set to `requires_reauth`, dashboard shows alert
- Queued messages: held in BullMQ, retried when session reconnects (configurable: drop after 1h)

**Redis failure:**
- BullMQ jobs lost in-flight only
- App continues to work; only automations and async sending affected
- Redis uses `appendonly yes` persistence

**Database failure:**
- App returns 503 for write operations
- Read operations may succeed from connection pool
- Daily backups provide recovery point

**Next.js crash:**
- Docker restart policy: `always`
- WhatsApp engine continues running independently
- Messages queue in BullMQ until Next.js restores

**WhatsApp engine crash:**
- Docker restart policy: `always`
- Sessions restore from auth files on restart
- Queued send jobs retry automatically when worker restarts
