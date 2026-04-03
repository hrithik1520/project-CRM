# Development Roadmap

**Version:** 1.0  
**Date:** 2026-04-02

---

## Overview

| Milestone | Focus | Status |
|-----------|-------|--------|
| M1 | Project scaffold + UI shell with dummy data | Pending |
| M2 | Auth, DB, pipeline, contacts, reminders | Pending |
| M3 | WhatsApp multi-session integration | Pending |
| M4 | Automation engine, templates, orders, GA4 | Pending |
| M5 | QA, dashboards, polish, Docker deployment | Pending |

---

## Milestone 1 — Project Scaffold + UI Shell

**Goal:** A running Next.js app with full navigation, all pages stubbed with dummy/hardcoded data, no real backend yet. Developer and product owner can click through the entire product experience.

### Tasks

#### 1.1 Monorepo Setup
- [ ] Init npm workspaces: `apps/web`, `apps/whatsapp`, `packages/db`, `packages/types`, `packages/utils`
- [ ] Configure TypeScript (`tsconfig.json`) per workspace with shared base
- [ ] Configure ESLint + Prettier (shared config)
- [ ] Add root `package.json` scripts: `dev`, `build`, `lint`

#### 1.2 Next.js App Bootstrap
- [ ] Create `apps/web` with Next.js 14 App Router
- [ ] Install Tailwind CSS + shadcn/ui
- [ ] Configure global CSS, fonts (Inter)
- [ ] Create layout: `(auth)` layout and `(dashboard)` layout
- [ ] Dashboard layout: sidebar + topbar shell

#### 1.3 Navigation & Routing
- [ ] Sidebar with all nav items (icons + labels): Dashboard, Leads, Contacts, Inbox, Orders, Reminders, Templates, Automations, Settings
- [ ] Topbar: search bar (placeholder), session status badges, user avatar menu
- [ ] All pages created as stubs returning placeholder content
- [ ] Active nav state highlighting

#### 1.4 Dashboard Page (Dummy Data)
- [ ] Stat cards: Total Leads, Active Leads, Won This Month, Revenue This Month
- [ ] Pipeline mini-summary (bar or list)
- [ ] WhatsApp session status cards (3 dummy sessions)
- [ ] Due Today: reminders and tasks list
- [ ] Recent Activity feed (dummy)

#### 1.5 Pipeline/Leads Board (Dummy Data)
- [ ] Kanban board with 5 stages (dummy): New, Contacted, Qualified, Proposal, Won
- [ ] 10 dummy lead cards per stage (name, phone, tag, assigned agent avatar)
- [ ] Drag-and-drop between stages (using `@dnd-kit/core`)
- [ ] List view toggle (table format, same dummy data)
- [ ] Filter bar UI (pipeline selector, agent filter, date range) — non-functional for M1

#### 1.6 Lead Detail Page (Dummy Data)
- [ ] Route: `/leads/[id]`
- [ ] Left panel: contact info, tags, pipeline stage selector, assigned agent
- [ ] Tabs: Activity, Notes, Messages, Reminders, Tasks, Orders
- [ ] Activity tab: dummy timeline entries
- [ ] Notes tab: simple note list
- [ ] Messages tab: dummy chat-style message list
- [ ] Reminders tab: dummy reminder list
- [ ] Tasks tab: dummy task list
- [ ] Orders tab: dummy order summary card

#### 1.7 Contacts Page (Dummy Data)
- [ ] Table: name, phone, email, tags, last activity, source
- [ ] Search input (non-functional)
- [ ] Contact detail panel (side drawer) with dummy data

#### 1.8 Inbox Page (Dummy Data)
- [ ] Left panel: session selector tabs + conversation list
- [ ] Right panel: active chat with dummy messages
- [ ] Send box (UI only, non-functional)
- [ ] Template picker button (opens modal with dummy templates)

#### 1.9 Orders Page (Dummy Data)
- [ ] Orders table: contact, order #, items count, total, status, payment status
- [ ] Order detail drawer

#### 1.10 Reminders & Tasks Page (Dummy Data)
- [ ] List view: today / upcoming / overdue tabs
- [ ] Task and reminder cards

#### 1.11 Templates Page (Dummy Data)
- [ ] Template list cards
- [ ] Create/edit template modal (UI only)

#### 1.12 Automations Page (Dummy Data)
- [ ] Automation rule list (dummy)
- [ ] Create rule modal (trigger + action UI)

#### 1.13 Settings Pages (Stubs)
- [ ] Pipeline settings: stage editor UI
- [ ] Team settings: user list table
- [ ] WhatsApp sessions: session card with QR modal stub
- [ ] GA4 settings: form fields

### Acceptance Criteria
- `npm run dev` starts the app on port 3000 with zero errors
- All pages accessible via sidebar navigation
- Kanban board drag-and-drop works (frontend only, no persistence)
- No broken layouts on 1280px wide desktop
- No TypeScript errors on build

---

## Milestone 2 — Auth, Database, Pipeline, Contacts, Reminders

**Goal:** Real backend. Auth working. Database connected. All CRM core features (leads, contacts, pipeline, reminders, tasks, orders) fully functional with persistent data.

### Tasks

#### 2.1 Database Setup
- [ ] PostgreSQL container configured in docker-compose
- [ ] `packages/db`: Prisma schema (full schema — all tables)
- [ ] Initial migration: `prisma migrate dev --name init`
- [ ] Seed script: 3 users, 2 pipelines, 5 stages each, 20 contacts, 30 leads, 10 orders, sample reminders/tasks
- [ ] DB client singleton for Next.js

#### 2.2 Auth
- [ ] NextAuth.js v5 installed, credentials provider
- [ ] Login page (email + password)
- [ ] Password hashing with bcrypt on user creation
- [ ] JWT with `role` claim
- [ ] Middleware: protect `/(dashboard)` routes
- [ ] User profile in topbar dropdown (name, role, logout)
- [ ] Admin-only: create first user via seed; invite via settings later

#### 2.3 Pipeline & Lead API
- [ ] `GET /api/pipelines` — list all pipelines + stages
- [ ] `POST /api/pipelines` — create pipeline (admin/manager)
- [ ] `PUT /api/pipelines/:id` — update pipeline name
- [ ] `DELETE /api/pipelines/:id` — delete pipeline (admin)
- [ ] Stage CRUD within pipeline
- [ ] `GET /api/leads` — list leads (filtered, paginated)
- [ ] `POST /api/leads` — create lead
- [ ] `GET /api/leads/:id` — lead detail + relations
- [ ] `PUT /api/leads/:id` — update lead (stage, assignment, status)
- [ ] `DELETE /api/leads/:id` — archive lead (admin only)
- [ ] Lead activity log: auto-insert on every significant update

#### 2.4 Contacts API
- [ ] `GET /api/contacts` — paginated, searchable
- [ ] `POST /api/contacts` — create contact (dedup by phone)
- [ ] `GET /api/contacts/:id` — contact detail + leads + activity
- [ ] `PUT /api/contacts/:id` — update
- [ ] `DELETE /api/contacts/:id` — soft delete

#### 2.5 Notes API
- [ ] `GET /api/leads/:id/notes`
- [ ] `POST /api/leads/:id/notes`
- [ ] `DELETE /api/leads/:id/notes/:noteId`

#### 2.6 Reminders & Tasks API
- [ ] Full CRUD for reminders and tasks
- [ ] Reminder due check: BullMQ repeatable job (every 60s)
- [ ] On due: create in-app notification record
- [ ] Socket.IO server setup in Next.js custom server
- [ ] Emit `reminder:due` event to relevant user's socket room

#### 2.7 Orders & Payments API
- [ ] `GET/POST /api/orders`
- [ ] `GET/PUT /api/orders/:id`
- [ ] `POST /api/orders/:id/items`
- [ ] `PUT /api/orders/:id/payment`
- [ ] Order total computed from items

#### 2.8 Wire Frontend to Real API
- [ ] Replace all dummy data with React Query calls to real API
- [ ] Pipeline board persists drag-and-drop (optimistic update + API call)
- [ ] Lead detail form saves via API
- [ ] Contacts table paginated + searchable
- [ ] Reminders and tasks CRUD in UI
- [ ] Orders form functional

#### 2.9 Admin Settings
- [ ] Pipeline stage editor (create, rename, reorder, delete stages)
- [ ] Team member list + create user (admin only)
- [ ] Role assignment

#### 2.10 Audit Logging
- [ ] Middleware utility: `createAuditLog(userId, action, entity, id, before, after)`
- [ ] Applied to: lead create/update, contact create/update, order create/update, user changes

### Acceptance Criteria
- Login/logout works
- Create lead → appears on board
- Drag lead to new stage → persists on reload
- Create contact → searchable
- Create reminder → appears in Due Today on dashboard
- Create order → visible on orders page and lead detail
- All API routes return correct 401/403 for unauthorized access
- Audit log records created for key actions

---

## Milestone 3 — WhatsApp Multi-Session Integration

**Goal:** Connect multiple WhatsApp numbers via QR, receive and send messages, see inbox in CRM.

### Tasks

#### 3.1 WhatsApp Engine Service
- [ ] `apps/whatsapp`: Express app setup
- [ ] Install `whatsapp-web.js`, `puppeteer` (or `puppeteer-core` + chromium)
- [ ] `SessionManager`: start/stop/restore sessions by ID
- [ ] Auth file persistence: `./whatsapp-sessions/{sessionId}/`
- [ ] On app start: restore all active sessions from DB
- [ ] Environment: `INTERNAL_SECRET`, `WEB_APP_URL`, `REDIS_URL`, `DATABASE_URL`

#### 3.2 Session API (WhatsApp Engine)
- [ ] `POST /sessions/:id/start` — start/restore session
- [ ] `GET /sessions/:id/status` — return status + QR if available
- [ ] `POST /sessions/:id/stop` — stop session gracefully
- [ ] `POST /sessions/:id/logout` — logout and delete auth files
- [ ] `GET /sessions` — list all sessions + status
- [ ] `POST /sessions/:id/send` — send message (called by Next.js worker)

#### 3.3 BullMQ Worker in WhatsApp Engine
- [ ] Worker consuming `whatsapp-send` queue
- [ ] On job: call `session.client.sendMessage(to, body)`
- [ ] On success: HTTP PATCH to Next.js to update message status
- [ ] On failure after retries: HTTP PATCH to mark message failed
- [ ] Concurrency: 2 jobs per session

#### 3.4 Event Posting (WhatsApp Engine → Next.js)
- [ ] WhatsApp engine posts to `POST /api/internal/events` on:
  - Session status change (qr, connected, disconnected, requires_reauth)
  - Incoming message
- [ ] Protected by `Authorization: Bearer INTERNAL_SECRET`

#### 3.5 Next.js Internal Events Handler
- [ ] `POST /api/internal/events`: validates secret, processes event type
- [ ] On `session_status`: updates `whatsapp_sessions` table, emits socket event
- [ ] On `message_received`: creates/matches contact, creates conversation + message record, emits socket event

#### 3.6 Session Management UI
- [ ] Settings → WhatsApp Sessions page wired to real API
- [ ] Session card: number, status badge, last seen, actions (connect, disconnect, logout)
- [ ] QR code modal: polls for QR, renders QR image, shows scanning status
- [ ] Real-time status update via Socket.IO

#### 3.7 Inbox Wired to Real Data
- [ ] Conversation list from DB, sorted by last_message_at
- [ ] Active chat: message history from DB
- [ ] New incoming message appears in real-time via socket
- [ ] Send message from inbox: calls API → queues job
- [ ] Message status indicators (sent/delivered/read/failed)
- [ ] Link conversation to lead (dropdown in chat header)

#### 3.8 Lead Detail → Messages Tab
- [ ] Shows messages from conversations linked to lead
- [ ] Send message from lead detail page
- [ ] Select which WhatsApp session to send from

#### 3.9 Docker Compose Update
- [ ] Add `whatsapp` service
- [ ] Chromium/Puppeteer dependencies in Dockerfile
- [ ] Shared network with Next.js app
- [ ] Volume mounts for session auth files

### Acceptance Criteria
- Add new WhatsApp session in settings, scan QR, session shows "Connected"
- Session persists after `docker-compose restart` without re-scanning
- Incoming message from phone appears in inbox within 5 seconds
- Send message from inbox, message appears on target phone
- Message status updates to "delivered" when applicable
- Inbox conversation linked to lead, visible on lead detail page
- Two simultaneous sessions can send messages independently

---

## Milestone 4 — Automations, Templates, GA4

**Goal:** Automation engine running, templates with variables, GA4 event dispatch.

### Tasks

#### 4.1 Template System
- [ ] Template CRUD API (name, body, category, variables)
- [ ] Variable syntax: `{{contact_name}}`, `{{lead_stage}}`, `{{order_id}}`
- [ ] Variable resolver: given template + context object → rendered string
- [ ] Templates page: create, edit, preview, delete
- [ ] Template picker in inbox send box and lead detail send message
- [ ] Quick replies: shortcut → template expansion in message input

#### 4.2 Automation Engine
- [ ] Automation rule schema: trigger type, conditions, action type, config
- [ ] Trigger types:
  - `lead_created`
  - `lead_assigned`
  - `stage_changed` (with from/to stage conditions)
  - `no_reply_after` (hours threshold)
  - `no_followup_after` (hours threshold)
  - `payment_pending`
  - `lead_stale`
- [ ] Action types:
  - `send_whatsapp_message` (session, template)
  - `create_task` (title, due_offset_hours, assignee)
  - `create_reminder` (note, due_offset_hours)
  - `move_to_stage` (pipeline, stage)
  - `assign_to_user`
  - `send_notification` (internal)
- [ ] Automation worker: checks all active rules every 5 minutes
- [ ] On trigger match: enqueue action jobs
- [ ] `automation_runs` table: log each execution with status and error
- [ ] Automations UI: create/edit rule with trigger + conditions + action form
- [ ] Enable/disable toggle per rule

#### 4.3 Webhook Inbound Lead Capture
- [ ] `POST /api/webhooks/lead` — accepts lead from website form
- [ ] Auth: `X-Webhook-Secret` header
- [ ] Creates contact + lead + sets attribution fields (utm_source, utm_medium, utm_campaign, gclid, client_id)
- [ ] Triggers `lead_created` automations
- [ ] Webhook log in admin settings

#### 4.4 GA4 Measurement Protocol
- [ ] GA4 config: `GA4_MEASUREMENT_ID`, `GA4_API_SECRET` in env
- [ ] `ga4_event_queue` table: event name, parameters JSONB, sent status
- [ ] Queue event on: lead_created, lead_assigned, lead_won, lead_lost, order_created, payment_received, whatsapp_message_sent, followup_scheduled, stage_moved
- [ ] BullMQ `ga4-dispatch` worker: reads queue, posts to GA4 Measurement Protocol endpoint
- [ ] Retry 2x on failure, mark `failed` after that (non-critical, log and continue)
- [ ] Admin settings: GA4 config form + event log view

#### 4.5 Lead Source Attribution
- [ ] Fields on contact: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `ga4_client_id`
- [ ] Captured via webhook or manual entry on contact form
- [ ] Shown on lead detail page (source panel)

#### 4.6 Advanced Filters & Search
- [ ] Global search: contacts, leads, messages (PostgreSQL full-text)
- [ ] Lead list filters: pipeline, stage, assigned_to, status, date_range, tags, source
- [ ] Filter state persisted in URL query params

### Acceptance Criteria
- Create automation: "When lead assigned → send intro template via WhatsApp" — works end-to-end
- Create automation: "No reply in 24h → create task" — triggers correctly
- Send message using template with `{{contact_name}}` variable — renders correctly
- GA4 events appear in GA4 DebugView when test lead created (with valid Measurement ID)
- Webhook endpoint creates lead with UTM params from test POST request
- Automation run log shows execution history

---

## Milestone 5 — Dashboards, QA, Docker Deployment

**Goal:** Production-ready deployment. Dashboard fully functional. All edge cases handled. Docker Compose deployable on a fresh server.

### Tasks

#### 5.1 Dashboard
- [ ] Real stats from DB: leads today, total active, won this month, lost this month
- [ ] Revenue this month (sum of paid orders)
- [ ] WhatsApp session health panel (live status via socket)
- [ ] Due Today: reminders + tasks sorted by time
- [ ] Recent Activity feed: last 20 audit log entries
- [ ] Pipeline funnel: count per stage across all pipelines
- [ ] Charts: leads over time (last 30 days), messages per day

#### 5.2 QA Pass
- [ ] Test all CRUD flows: contacts, leads, orders, reminders, tasks, templates, automations
- [ ] Test WhatsApp: connect → send → receive → disconnect → reconnect
- [ ] Test automations end-to-end with real leads
- [ ] Test role permissions: agent cannot access admin routes
- [ ] Test rate limiting on message send
- [ ] Test audit log captures all required actions
- [ ] Test GA4 events fire correctly (DebugView verification)
- [ ] Test webhook lead capture with UTM params

#### 5.3 Error Handling Polish
- [ ] API error responses: consistent `{ error: string, code: string }` format
- [ ] Frontend: toast notifications for all errors
- [ ] Loading states on all async operations
- [ ] Empty states on all list/table pages
- [ ] 404 page for invalid routes

#### 5.4 Docker Deployment
- [ ] `Dockerfile` for `apps/web` (multi-stage: build + runtime)
- [ ] `Dockerfile` for `apps/whatsapp` (with Chromium dependencies)
- [ ] `docker-compose.yml`: web, whatsapp, postgres, redis, caddy
- [ ] `docker-compose.prod.yml`: overrides for production (restart policies, resource limits)
- [ ] `.env.example` with all required variables documented
- [ ] Caddy config: reverse proxy + HTTPS (Let's Encrypt or self-signed)
- [ ] Volume definitions: postgres-data, redis-data, whatsapp-sessions, uploads, backups
- [ ] Health checks on all services

#### 5.5 Documentation
- [ ] `README.md`: project overview, features, prerequisites
- [ ] `docs/deployment.md`: step-by-step server setup
- [ ] `docs/admin-setup.md`: first-run configuration guide
- [ ] `docs/ga4-events.md`: GA4 event mapping reference
- [ ] Inline code comments on complex logic (session manager, automation engine)

#### 5.6 Backup Script
- [ ] `docker/backup.sh`: pg_dump + session files archive
- [ ] Cron setup instructions in deployment guide

### Acceptance Criteria
- `docker-compose up` on fresh Ubuntu server → full app running in < 5 minutes
- Dashboard shows real data from DB
- All milestone 1–4 acceptance criteria pass
- No console errors in production build
- App handles WhatsApp session disconnect gracefully (UI shows warning, no crash)
- Backup script runs successfully and produces valid pg_dump
- README provides complete path from zero to running system
