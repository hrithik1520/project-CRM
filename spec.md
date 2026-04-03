# CRM Product Specification

**Version:** 1.0  
**Date:** 2026-04-02  
**Status:** Draft — Pending Approval

---

## 1. Product Summary

A self-hosted, multi-WhatsApp CRM for small-to-medium sales teams. Built to manage leads, conversations, pipelines, orders, and follow-ups from a single dashboard — with WhatsApp as the primary communication channel, connected via browser-session automation (no official API required).

**Core value proposition:** One place for all leads, all WhatsApp conversations, all follow-ups, all orders — fast, offline-capable, and fully owned by the operator.

---

## 2. Target Users

| Role | Description |
|------|-------------|
| Admin | Business owner or IT operator. Manages team, pipelines, WhatsApp sessions, settings. |
| Sales Manager | Assigns leads, monitors pipeline, views performance. |
| Sales Agent | Works leads, sends messages, creates orders, logs notes. |
| (Future) Support Agent | Handles post-sale conversations. |

**Team size:** 1–20 users per installation.  
**Tech level:** Non-technical staff operating the app daily.

---

## 3. Core Modules

1. **Dashboard** — real-time stats, session health, pipeline summary
2. **WhatsApp Multi-Session Manager** — QR pairing, session health, inbox routing
3. **Contacts** — contact records, tags, history, attribution
4. **Leads & Pipeline** — customizable stages, drag-and-drop board, assignment
5. **Inbox** — unified WhatsApp inbox per session, conversations, chat view
6. **Templates & Quick Replies** — reusable message templates per session
7. **Reminders & Tasks** — per-lead, per-user, due dates
8. **Orders & Payments** — order creation from lead, payment status tracking
9. **Automations** — rule-based triggers, send/notify/move actions
10. **Analytics** — GA4 event dispatch, lead source attribution
11. **Settings** — pipeline config, team, sessions, GA4, branding

---

## 4. Functional Requirements

### 4.1 WhatsApp Sessions
- Connect multiple WhatsApp numbers via QR code scan
- Each session runs in an isolated process/context
- Session health visible on dashboard (connected / reconnecting / disconnected)
- Incoming messages routed to unified inbox and attached to contact/lead
- Outgoing messages sent via session associated with the number
- Media send/receive: images, documents, audio (text priority for MVP)
- Session data persisted (auth files) so reconnect does not need re-scanning
- Manual disconnect / logout per session
- Session logs for debugging

### 4.2 Contacts
- Create, edit, delete contacts
- Fields: name, phone (WhatsApp), email, company, tags, notes, source, UTM fields
- Deduplicate by phone number
- Full activity timeline on contact record
- Link multiple leads to one contact

### 4.3 Leads & Pipeline
- Multiple named pipelines (e.g., "Sales", "Support", "Renewals")
- Each pipeline has customizable stage names and order
- Lead board: Kanban drag-and-drop
- Lead list view with sort/filter
- Lead fields: contact, pipeline, stage, assigned agent, score, source, created_at
- Move lead between stages manually or via automation
- Lead status: active, won, lost, stale, archived
- Activity log per lead (all actions, messages, notes)
- Assign/reassign lead to agent

### 4.4 Messaging & Inbox
- Inbox per WhatsApp session
- Conversations linked to contacts
- Send text, template, quick reply
- Message status: sent, delivered, read, failed
- Conversation search
- Attach lead to conversation
- Incoming message notification (in-app)

### 4.5 Templates & Quick Replies
- Create named templates with variable placeholders ({{name}}, {{order_id}}, etc.)
- Templates scoped to pipeline or global
- Quick replies: short-trigger text that expands to full message
- Template categories: intro, follow-up, payment, order-confirm, etc.

### 4.6 Reminders & Tasks
- Create reminder on lead: due date/time, note, assigned user
- Create task on lead: title, due date, assignee, status
- Dashboard shows today's due reminders/tasks
- Overdue indicators
- Mark complete
- System-generated reminders from automations

### 4.7 Orders & Payments
- Create order linked to lead/contact
- Order fields: items (name, qty, price), total, status (draft, confirmed, shipped, delivered, cancelled)
- Payment fields: amount, method, status (pending, partial, paid, refunded), date
- Order notes
- Multiple orders per lead
- Payment history per order

### 4.8 Automations
- Trigger types: lead created, lead assigned, stage moved, no reply in X hours, no follow-up in X hours, payment pending, lead marked stale
- Action types: send WhatsApp message (from template), create task, create reminder, send internal notification, move lead to stage, assign lead to user
- Conditions: pipeline = X, stage = X, assigned = X
- Enable/disable per automation rule
- Run log per automation

### 4.9 Notes
- Rich-text notes per lead and contact
- Notes visible in activity timeline
- Author and timestamp recorded

### 4.10 Search & Filter
- Global search: contacts, leads, messages
- Per-page filters: pipeline, stage, assigned, date range, tags, source
- Sort by: created, updated, last_contact, score

### 4.11 Settings
- Pipeline and stage CRUD
- Team member invite / role assignment
- WhatsApp session management
- Template management
- Automation management
- GA4 Measurement ID and API Secret config
- Branding: business name, logo (minimal)

---

## 5. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load | < 1.5s on localhost / local LAN |
| Inbox render | < 500ms per conversation open |
| Message send latency | < 3s end-to-end under normal conditions |
| Session reconnect | Automatic, within 30s of disconnect |
| Concurrent users | 10–20 per instance |
| Data retention | Indefinite (operator-managed) |
| Uptime | Self-hosted; operator responsibility |
| Auth security | Bcrypt passwords, JWT/session-based |
| Rate limiting | Per-user message rate limit to prevent abuse |
| Audit log | All critical actions logged |
| Mobile | Usable on mobile browser (not native app) |

---

## 6. User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access: users, settings, sessions, all pipelines, all leads |
| `manager` | All lead/pipeline access, view team activity, cannot manage team |
| `agent` | Own leads + assigned leads, messaging, reminders, orders |
| (Future) `viewer` | Read-only dashboard and pipeline |

---

## 7. MVP Scope vs Phase 2 Scope

### MVP (Milestones 1–3)
- Auth (admin + agent roles)
- Contacts CRUD
- 1 default pipeline, customizable stages
- Lead board + list view
- Lead detail page (notes, reminders, tasks, activity log)
- WhatsApp multi-session: connect, inbox, send/receive text messages
- Basic templates (no variables yet)
- Orders and payment status
- Reminders and tasks (manual only)
- Dashboard summary stats
- Docker deployment

### Phase 2 (Milestones 4–5)
- Multiple pipelines
- Template variables and quick replies
- Automation engine (trigger/action rules)
- GA4 Measurement Protocol event dispatch
- Lead source attribution (UTM capture from website forms)
- Manager role and lead assignment workflow
- Advanced filters and search
- Media messages (images, documents)
- Webhook support (inbound lead capture from website)
- Calendar/reminder view

---

## 8. CRM Workflows

### 8.1 New Lead Capture
1. Agent creates lead manually **OR** webhook fires from website form
2. Contact record created/matched by phone number
3. Lead created in target pipeline at first stage
4. UTM/source attribution stored on contact
5. Activity log entry: "Lead created"
6. If automation rule exists: trigger first-message send or task creation
7. Dashboard count updates

### 8.2 Assign Lead
1. Admin/manager opens lead
2. Selects agent from dropdown
3. `assigned_to` field updated
4. Activity log: "Assigned to [Agent]"
5. If automation: notify agent or send intro message

### 8.3 Send First WhatsApp Message
1. Agent opens lead detail page
2. Clicks "Send WhatsApp Message"
3. Selects WhatsApp session (number) to send from
4. Types message or picks template
5. Message queued via BullMQ job
6. Worker sends via whatsapp-web.js session
7. Message stored in `messages` table with status `sent`
8. Activity log entry: "Message sent via [number]"
9. GA4 event `whatsapp_message_sent` queued

### 8.4 Follow-Up Automation
1. Automation rule: "If no reply in 24h, create task for agent"
2. Job scheduler checks leads with last_message_at > 24h and no inbound reply
3. Task created on lead: "Follow up — no reply in 24h"
4. Alternatively: auto-send follow-up template via WhatsApp session
5. Activity log entry: "Automation: follow-up task created"

### 8.5 Move Lead Across Pipeline
1. Agent drags lead card to new stage on Kanban board
2. OR: agent opens lead and changes stage dropdown
3. `stage_id` updated on lead
4. `stage_moved_at` timestamp updated
5. Activity log: "Moved to [Stage Name]"
6. If automation triggers on this stage: execute actions

### 8.6 Convert Lead to Order
1. Agent opens lead, clicks "Create Order"
2. Order form: items, quantities, prices
3. Order saved linked to lead + contact
4. Lead status can remain "active" or move to "won" stage
5. Payment record created with status `pending`
6. Activity log: "Order #X created"
7. GA4 event `order_created` queued

### 8.7 Mark Payment / Order Status
1. Agent opens order, changes payment status (pending → partial → paid)
2. Payment record updated
3. Activity log: "Payment status updated to [paid]"
4. If automation: trigger payment-received message or task
5. GA4 event `payment_received` queued

### 8.8 Set Reminder
1. Agent opens lead, clicks "Add Reminder"
2. Selects date/time, adds note, assigns to self or other user
3. Reminder saved
4. Job scheduler checks due reminders every minute
5. On due: in-app notification sent via WebSocket
6. Reminder shown on dashboard "Due Today" panel

### 8.9 Reopen Inactive Lead
1. Agent/manager finds stale or archived lead (via search/filter)
2. Changes status back to `active`, selects stage
3. Activity log: "Lead reopened"
4. Optionally reassigns or creates a new task

---

## 9. GA4 Event Model

GA4 is used via **Measurement Protocol** to push server-side CRM events. This supplements (does not replace) website-side gtag.js tracking.

### Events

| Event Name | When Fired | Key Parameters |
|------------|-----------|----------------|
| `lead_created` | Lead created | `source`, `pipeline`, `stage`, `agent_id` |
| `lead_assigned` | Lead assigned to agent | `lead_id`, `agent_id`, `pipeline` |
| `whatsapp_message_sent` | Message sent | `session_id`, `lead_id`, `template_used` |
| `followup_scheduled` | Reminder/task created | `lead_id`, `due_in_hours` |
| `order_created` | Order created from lead | `lead_id`, `order_value`, `currency` |
| `payment_received` | Payment marked paid | `order_id`, `amount`, `method` |
| `lead_won` | Lead moved to won stage | `lead_id`, `pipeline`, `days_to_close` |
| `lead_lost` | Lead moved to lost stage | `lead_id`, `reason` |
| `stage_moved` | Lead moves between stages | `from_stage`, `to_stage`, `pipeline` |

### Attribution
- `client_id`: stored on contact from website cookie (passed via form webhook)
- `session_id`: GA4 session ID if available from website
- `utm_source`, `utm_medium`, `utm_campaign`: stored on contact/lead

### Limitations (be honest)
- Measurement Protocol events are not tied to a live user session; attribution is approximate
- GA4 does not support fully custom user-journey stitching without client_id
- Data sent via MP may show as `(direct)` if client_id is not passed
- MP events cannot retroactively affect standard GA4 funnels from website
- Use GA4 here for business event counting/reporting, not conversion attribution

---

## 10. Search Console Role

Google Search Console is **not** a CRM event sink. Its role:
- Monitor website organic visibility (impressions, clicks, CTR, position)
- Identify which landing pages drive inbound leads
- Identify which queries/keywords bring traffic to lead capture pages
- No direct connection to CRM — it is a monitoring tool

**Integration:** CRM admin can store the domain's GSC property URL in settings for reference. No API integration in MVP. Phase 2 could surface GSC data alongside lead source reporting if there is demand.

---

## 11. Compliance / Risk Disclaimer

> **WARNING:** This CRM connects to WhatsApp using browser-session automation (whatsapp-web.js or equivalent). This method:
> - Is **not officially supported or endorsed by Meta/WhatsApp**
> - Violates WhatsApp's Terms of Service
> - Carries a non-trivial risk of **account bans** (temporary or permanent) on the connected numbers
> - May break without notice if WhatsApp updates its web client
> - Should **not** be used for mass-blast marketing (increases ban risk significantly)
> - Should be used for genuine 1-to-1 CRM conversations
>
> This software is provided for self-hosted, personal/business use. The operator assumes all responsibility for compliance with applicable laws (GDPR, local data protection, telecom regulations) and WhatsApp terms. No warranty is provided.
