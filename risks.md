# Risk Register

**Version:** 1.0  
**Date:** 2026-04-02  
**Classification:** Operational, Technical, Legal

---

## 1. WhatsApp Web / Unofficial Automation Risks

### 1.1 Terms of Service Violation

**Risk:** whatsapp-web.js (and all browser-session-based WhatsApp automation tools) violate WhatsApp's Terms of Service, specifically sections prohibiting:
- Automated or bulk messaging
- Reverse engineering the client
- Using non-official clients

**Impact:** Meta/WhatsApp can ban the connected phone number at any time without prior warning or appeal.

**Likelihood:** Low-to-medium for genuine 1-to-1 CRM use. High for mass-blast or scraping patterns.

**Mitigation:**
- Use only for genuine 1-to-1 sales conversations, not bulk campaigns
- Never send unsolicited promotional blasts
- Keep message rate low (< 20 messages/hour per session in automation workflows)
- Do not message numbers that have not first contacted you
- Keep automations conservative — human review before send is always safer
- Treat each connected number as expendable; have a backup number ready

---

## 2. Session Stability Risks

### 2.1 WhatsApp Client Updates Break the Library

**Risk:** WhatsApp Web periodically updates its frontend code. whatsapp-web.js reverse-engineers the web client. Major updates can break the library until maintainers patch it.

**Impact:** All sessions stop working until the library is updated. Could be hours to days of downtime.

**Likelihood:** This happens roughly 2–4 times per year historically.

**Mitigation:**
- Pin a specific version of whatsapp-web.js in `package.json` (never `*` or `latest` in production)
- Monitor the whatsapp-web.js GitHub issues for breakage reports
- Have a tested upgrade procedure: test on staging, then upgrade production
- Implement session health monitoring so you know within minutes when sessions drop
- Design UI to show clear "Service temporarily unavailable" rather than silent failures

### 2.2 Session Drops Under Load

**Risk:** Running many Puppeteer/Chromium instances simultaneously consumes significant RAM (250–400MB per session). Under load, the OS may OOM-kill processes.

**Impact:** Sessions drop; messages fail.

**Likelihood:** Medium on low-spec VPS.

**Mitigation:**
- Minimum recommended server: 4GB RAM for up to 5 sessions
- 8GB+ RAM for 10+ sessions
- Set container memory limits in Docker Compose
- Session manager: if a session crashes, attempt auto-restart before alerting
- Dashboard shows session memory/health status

### 2.3 Auth File Corruption

**Risk:** Session auth files on disk may become corrupt (truncated write, disk full, container force-kill during write).

**Impact:** Session cannot restore and requires QR re-scan.

**Likelihood:** Low but non-zero.

**Mitigation:**
- Auth files stored on Docker volume (not in container layer)
- Backup auth files daily (they are small)
- If restore fails: status set to `requires_reauth` immediately; dashboard alerts operator
- Design for QR re-scan to take < 60 seconds — it's a recovery step, not a failure state

---

## 3. Device Pairing Risks

### 3.1 Phone Must Stay Online

**Risk:** WhatsApp Web sessions require the paired phone to be online and connected (for non-Business accounts). If the phone dies, loses data, or is turned off, the web session may drop.

**Impact:** Session disconnects until phone is back online.

**Likelihood:** High if using personal phones as paired devices.

**Mitigation:**
- Use dedicated phones kept plugged in, with battery optimization disabled
- Or: use WhatsApp Business App on the phone (slightly more stable for linked devices)
- Consider using a phone kept as a "WhatsApp server" — powered on at all times, not used for anything else
- Dashboard session status makes this visible within 30 seconds

### 3.2 Multi-Device vs Single-Device Behavior

**Risk:** WhatsApp's multi-device mode allows browser sessions without the phone actively connected. However, it is still subject to change.

**Impact:** If WhatsApp reverts multi-device support changes, sessions may require phone to always be online.

**Mitigation:**
- Enable multi-device (linked devices) mode on the paired phone before pairing
- Design the session restore flow to handle both modes gracefully
- Document this requirement in the admin setup guide

---

## 4. Rate Limit / Account Block Risks

### 4.1 Spam Detection

**Risk:** WhatsApp's backend monitors for unusual sending patterns: many messages to unknown numbers in a short time, high number of blocks or reports from recipients, identical message bodies sent to many recipients.

**Impact:** Number gets a temporary ban (24h–7 days) or permanent ban.

**Likelihood:** Low for genuine CRM use. Very high for blast campaigns.

**Mitigation:**
- Rate limit: max 60 outgoing messages per hour per session (configurable)
- Automation sends throttled: max 20 per hour (BullMQ rate-limited queue)
- No bulk template blasts to contacts who have never messaged you
- Add variety to templated messages (personalization via variables)
- Log and alert if a session stops sending (early ban indicator)
- Never import and blast a cold contact list

### 4.2 Number Warming Required

**Risk:** Newly registered WhatsApp numbers have low trust. High outbound volume on a fresh number increases ban risk significantly.

**Impact:** New number banned before it's useful.

**Mitigation:**
- Document in admin guide: new numbers should be used with very low message volume for first 2–4 weeks
- Start with < 30 messages/day on new numbers
- Prefer numbers with a history of normal WhatsApp use

---

## 5. Browser Automation Fragility

### 5.1 Puppeteer / Chromium Issues

**Risk:** Puppeteer version mismatches, missing system libraries on server, sandboxing issues in Docker, or headless Chrome crashes can prevent sessions from starting.

**Impact:** Sessions fail to initialize.

**Mitigation:**
- Use official `puppeteer` package which bundles Chromium (avoids version mismatch)
- Docker image must include all Chromium system dependencies (full list in Dockerfile)
- Run Chromium with `--no-sandbox` in Docker (document why: Docker containers lack kernel sandbox)
- Memory-mapped files: `--disable-dev-shm-usage` flag required in containers
- Integration test: on each deployment, start one session and verify it reaches "connected" state

### 5.2 QR Code Expiry

**Risk:** WhatsApp QR codes expire in ~60 seconds. If the UI doesn't render the QR fast enough, the user must refresh.

**Impact:** Minor UX friction.

**Mitigation:**
- QR modal auto-refreshes QR when a new one is emitted
- Show countdown timer until QR expiry
- Session manager auto-generates a new QR after each expiry (loop until connected or timed out)

---

## 6. Data Privacy Risks

### 6.1 WhatsApp Message Data in Your Database

**Risk:** All WhatsApp conversations (personal and business) are stored in your PostgreSQL database in plaintext. If the server is compromised, all conversation data is exposed.

**Impact:** Privacy breach affecting your contacts.

**Mitigation:**
- Encrypt database volume at rest (OS-level disk encryption on server)
- Use strong PostgreSQL password and restrict network access (DB not exposed to internet)
- Implement field-level encryption for message bodies (Phase 2)
- Data retention policy: archive or delete old messages after configurable period
- Access control: agents only see their assigned conversations

### 6.2 Contacts Data

**Risk:** Contact database includes phone numbers, names, potentially financial data (orders/payments). Leakage violates privacy.

**Impact:** Legal liability, loss of trust.

**Mitigation:**
- No public API endpoints exposing contacts
- All endpoints require auth
- Audit log tracks who accessed what
- Implement IP allowlist on admin panel (configurable)
- GDPR: if operating in EU, implement data deletion endpoint and data export

---

## 7. GA4 and Search Console Limitations

### 7.1 GA4 Measurement Protocol Attribution

**Risk:** Server-side events sent via Measurement Protocol are difficult to attribute correctly. Without a real `client_id` (from browser cookie), events may appear as `(direct)` traffic with no campaign attribution.

**Impact:** Misleading conversion reporting.

**Mitigation:**
- Website forms MUST pass `ga4_client_id` (read from `_ga` cookie) as a hidden field to the CRM webhook
- CRM stores `ga4_client_id` on contact record and includes it in all MP events
- Document this clearly in admin guide and integration docs
- Accept that offline-touched leads (phone calls, walk-ins) will have no GA4 client_id — that's expected

### 7.2 GA4 Sampling and Data Delays

**Risk:** GA4 free tier has data freshness delays (24–48h for some reports) and sampling in Explorations for high-traffic properties.

**Impact:** Real-time dashboarding via GA4 is not feasible.

**Mitigation:**
- The CRM's own dashboard is the real-time source of truth for pipeline and lead metrics
- GA4 is used for long-term trend reporting and marketing attribution, not operational monitoring
- Set accurate expectations with operators: GA4 data is T+24h at best

### 7.3 Search Console Not Directly Integrable

**Risk:** Search Console has no usable real-time API for CRM-level integration. Its data is T+3 days minimum.

**Impact:** Cannot tie GSC keywords to lead records automatically.

**Mitigation:**
- Phase 2: manual GSC data export → import to CRM for reporting (not MVP)
- Operators should review GSC separately, use it to inform landing page decisions
- CRM stores UTM parameters from ads; organic SEO attribution requires GSC + GA4 manual analysis

---

## 8. Legal and Compliance Notes

### 8.1 WhatsApp Terms of Service

> Using this software connects to WhatsApp via an unofficial, reverse-engineered method. This violates WhatsApp's Terms of Service. The operator takes full responsibility for any consequences including account suspension, legal notices from Meta, or loss of service.

### 8.2 GDPR (EU) / Privacy Regulations

- If you operate in the EU or process EU residents' data: you are a data controller
- You must have a lawful basis for storing contact data and WhatsApp messages
- Contacts must be informed that their data is stored in your CRM
- Implement: data deletion on request, data export on request
- Do not store more data than necessary

### 8.3 Local Telecom / Messaging Laws

- Some jurisdictions restrict automated messaging without opt-in consent (e.g., India's TRAI regulations, US TCPA)
- Consult a lawyer for your jurisdiction if sending automated messages at scale
- This software is designed for 1-to-1 CRM communications, not bulk messaging

### 8.4 Financial Data

- If storing payment data: do not store full card numbers
- This CRM only stores payment status (paid/pending/etc.) and amount — not card data
- For actual payment processing: use Stripe, Razorpay, or equivalent; link by transaction ID

---

## 9. Risk Mitigation Summary

| Risk | Severity | Likelihood | Mitigation Status |
|------|----------|------------|-------------------|
| WhatsApp account ban (overuse) | High | Low (for 1-to-1 use) | Rate limiting + guidelines |
| WhatsApp library breaks on update | Medium | Medium | Pinned version + monitoring |
| Session OOM on low-RAM server | Medium | Medium | RAM requirements documented |
| Auth file corruption | Low | Low | Daily backup + auto-detect |
| Phone goes offline | Medium | Medium | Dedicated device guidelines |
| GA4 attribution inaccurate | Low | High | client_id flow documented |
| Data breach (DB exposed) | High | Low | Network isolation + encryption |
| GDPR violation | High | Medium | Data deletion endpoint (Phase 2) |
| Automation sends spam | High | Low | Rate limits + manual review option |

---

## 10. Operational Recommendations

1. **Maintain a test number** — use a secondary WhatsApp number for testing automations and templates before running on production numbers.

2. **Never run automations in production without testing** — always validate a new automation rule on a test lead first.

3. **Keep session count realistic** — more sessions = more RAM = more fragility. 3–5 sessions on a well-specced server (4–8GB RAM) is a practical limit.

4. **Treat numbers as consumable** — design processes so a number ban doesn't halt operations. Keep a spare number ready to re-pair.

5. **Monitor session health daily** — dashboard session status panel should be checked at start of every business day.

6. **Do database backups religiously** — losing the CRM database is worse than losing a WhatsApp session. Automate backups.

7. **Update whatsapp-web.js carefully** — test on a staging server before updating production. Do not auto-update.
