# Suki -- Events Agent
> Manages complete event lifecycle from inquiry to post-event analytics

---

## Identity

| Field | Value |
|-------|-------|
| **Agent ID** | `suki` |
| **Workspace** | `workspaces/events/` |
| **Human Partner** | Boldrin (BD, Sales & Events Lead) |
| **Telegram ID** | `817242399` (@Boldrin71) |
| **Timezone** | IST (Asia/Kolkata) |
| **Role** | Full event lifecycle -- inquiry, marketing, day-of coordination, revenue tracking, post-event analytics |
| **Creature** | AI events operator -- part logistics engine, part creative copywriter, part revenue tracker |
| **Escalation** | Boldrin for GO/NO-GO, budget negotiations, costs >INR 5K; ZomadPrime for cross-agent coordination |

### Core Philosophy
Events are experiences that generate revenue AND community. Every event should create stories worth telling. Zo is not a coworking brand -- it's a living room that got out of hand.

### Venues
- **Zo House Whitefield** -- ~100 pax standing, ~70 seated. Open layout, projector/screen, sound, F&B kitchen.
- **Zo House Koramangala** -- ~80 pax standing, ~50 seated. Cozy vibe, rooftop access, kitchen, AV.

### Heartbeat
Every 2 hours: run `luma-sync`, check registration updates for active events, flag significant changes.

---

## Current Skills Inventory

### 1. event-inquiry

| Field | Detail |
|-------|--------|
| **Type** | Action (intake pipeline) |
| **Trigger** | "new event inquiry", "someone wants to host", "typeform submission" |
| **Data Sources** | Typeform form `LgcBfa0M` (https://zostel.typeform.com/to/LgcBfa0M), Google Calendar (venue availability), Events Tracker (logging) |
| **Output** | GO / CONDITIONAL GO / NO-GO decision + itemized cost breakdown + quote email to host |
| **Quality Assessment** | **Needs Work** |

**What It Does Well:**
- References the correct Typeform form ID (`LgcBfa0M`) and URL
- Structured GO/NO-GO criteria matrix (venue fit, budget, capacity, values, lead time, date)
- Clear processing pipeline: Receive & Log -> GO/NO-GO -> Cost Breakdown -> Quote Email
- Decline template with warm-but-professional Zo tone
- Rush event handling (<7 days) with Boldrin escalation

**Issues Found:**
1. **No rate card.** Cost breakdown section says "Base rate depends on hours, day of week, event type" but provides zero actual pricing. No INR amounts anywhere. Suki has no numbers to work from and must ask Boldrin every time.
2. **No Typeform polling mechanism defined.** The skill assumes Typeform submissions arrive but does not specify HOW (cron poll via `$TYPEFORM_TOKEN` API? Webhook? Manual check?). SOUL.md mentions "Typeform inquiry -> Slack #event-bd notification" but the skill does not reference Slack at all.
3. **No reference to `event_inquiries` Supabase table.** DATA_SOURCES.md documents a `event_inquiries` table (columns: first_name, last_name, email, phone, organization, event_type, budget, venue_preference) that should be the destination for logged inquiries. The skill says "log inquiry in the events tracker" without specifying where.
4. **Typeform field IDs not referenced.** DATA_SOURCES.md lists specific field IDs (`c020d8de` for first_name, `b931d769` for last_name, `5c9964fc` for email, `828119d2` for phone) but the skill does not use them for parsing.
5. **Google Calendar check is mentioned but not specified.** No calendar ID provided (`zo-events@zohouse.co` or `zo-blr@zohouse.co`).

**Fix Required:**
- Add a concrete rate card section with actual pricing by day/time/event type (or a "request from Boldrin" approval step)
- Define Typeform polling: cron schedule, API endpoint (`GET https://api.typeform.com/forms/LgcBfa0M/responses`), auth via `$TYPEFORM_TOKEN`
- Specify logging destination: `event_inquiries` Supabase table via `$SUPABASE_SERVICE_ROLE_KEY`
- Add Typeform field ID mappings for structured parsing
- Add specific Google Calendar IDs for availability checks

---

### 2. event-marketing

| Field | Detail |
|-------|--------|
| **Type** | Action (content creation + publishing) |
| **Trigger** | "create event page", "promote event", "post about event" |
| **Data Sources** | Event details from inquiry/booking, Luma API (page creation), social platforms (LinkedIn, X/Twitter, Instagram, Farcaster) |
| **Output** | Luma event page + platform-specific social media copy (LinkedIn, X, Instagram, Farcaster) |
| **Quality Assessment** | **Strong** (with one notable gap) |

**What It Does Well:**
- Excellent Luma event page template with the signature "WHAT IT'S NOT / WHAT IT IS" framework
- Platform-specific copy guidelines with correct tone per channel
- Detailed posting timeline (2 weeks -> 1 week -> 3 days -> day-of -> day-after)
- Cover image spec (1200x630px, Zo-branded)
- Registration question defaults
- Approval flow (Boldrin signs off before publish)

**Issues Found:**
1. **LOKI dependency is informal.** Line 106 says "LOKI (vibe-curator) handles visual assets -- coordinate with them for cover images and carousel designs" but there is no structured handoff. No `sessions_spawn` call, no data format, no timeline for asset delivery. If LOKI is unavailable or slow, the entire marketing timeline stalls.
2. **No Luma API write method documented.** The skill describes what fields to fill on a Luma page but does not reference Luma's event creation API. DATA_SOURCES.md only documents read endpoints (`list-events`, `get`, `get-guests`). Is page creation manual through the Luma web UI?
3. **No reference to which Luma calendar to publish to.** Should use `$LUMA_API_KEY_BLRXZO` for BLRxZo events but this is not stated.

**Fix Required:**
- Formalize the LOKI handoff for cover images: define a structured request format, expected turnaround time, and fallback (use existing Zo template if LOKI does not deliver within 24h)
- Clarify Luma page creation method (API vs manual UI) and document the correct API key
- Add co-branding checklist for partnership events (referenced in HANDOFF_MAP.md flow #4)

---

### 3. event-recap

| Field | Detail |
|-------|--------|
| **Type** | Report (analytics + content) |
| **Trigger** | "event recap", "post-event report", "how did the event go" |
| **Data Sources** | `luma-sync` (registration + attendance), `rev-tracking` (revenue + costs), host feedback (manual), photos (manual collection) |
| **Output** | Internal report (structured markdown) + social media recap posts (LinkedIn, X, Instagram, Farcaster) |
| **Quality Assessment** | **Needs Work** (minor) |

**What It Does Well:**
- Comprehensive internal report template with numbers, revenue, what worked/didn't, lessons
- Social recap guidelines per platform with specific slide counts and thread structures
- Photo consent guidelines
- "Repeat?" assessment for strategic event planning
- Correct timeline: social recap within 48h, internal report within 5 days

**Issues Found:**
1. **No explicit dependency chain.** The skill says it pulls from `luma-sync` and `rev-tracking` but does not define what happens if revenue data is not ready yet (booking confirmed but payment still pending, costs not yet tallied).
2. **No automated data pull.** The skill assumes data is available but does not specify: "Step 1: Run luma-sync for event X. Step 2: Read Rev-Events row for event X." It reads as a template, not a procedure.
3. **No storage location for recap reports.** Where does the internal report get saved? Google Drive? Local workspace? Posted to Slack #event-bd?
4. **Qualitative data collection is entirely manual.** Host satisfaction, attendee feedback, and vibe checks have no structured collection mechanism (no Luma survey template, no feedback form link).

**Fix Required:**
- Add explicit prerequisite: "Run `rev-tracking` before generating recap. If revenue data is incomplete, generate partial recap and flag missing fields."
- Add step-by-step data pull procedure referencing actual API calls
- Define recap storage: save to Google Drive (Zo House Events folder) and post summary to Slack #event-bd
- Add Luma post-event survey template or Typeform feedback form reference

---

### 4. invoice-maker

| Field | Detail |
|-------|--------|
| **Type** | Action (document generation) |
| **Trigger** | "create invoice", "bill for event", "send invoice" |
| **Data Sources** | Event booking details, company financial reference (hardcoded in skill) |
| **Output** | Proforma invoice in markdown (ZO-INV-YYYYMMDD-SEQ format) with GST, bank, and crypto payment options |
| **Quality Assessment** | **Needs Work** (minor) |

**What It Does Well:**
- Complete invoice template with all legally required fields
- Correct company details: Zoworld Experiential Stays Pvt Ltd, GSTIN 29AADCZ9152C1ZI
- Correct bank details: HDFC 50200089338498, IFSC HDFC0001751
- B2B handling (client GSTIN, reverse charge note)
- Crypto payment option with TRC20 USDT
- Sequential numbering format

**Issues Found:**
1. **GSTIN and bank details are hardcoded in the skill.** These match DATA_SOURCES.md's Financial Reference section, so they are currently correct. However, if the company changes banks or gets a new GSTIN, this skill and the central reference could drift apart. Should reference a single config source.
2. **Invoice counter storage is undefined.** The skill says "Check the rev-tracking sheet or ask Boldrin for the last invoice number if unsure" -- this is fragile. There is no defined location for the sequence counter. Concurrent invoice generation could produce duplicates.
3. **No PDF generation method.** The skill outputs markdown and says it "can be copy-pasted or exported to PDF" but does not specify how. No reference to Google Docs conversion, wkhtmltopdf, or any PDF tool.
4. **No connection to rev-tracking.** After generating an invoice, the Invoice # should be written to column T of the Rev-Events sheet. This link is mentioned in rev-tracking but not in invoice-maker itself.

**Fix Required:**
- Reference DATA_SOURCES.md Financial Reference instead of hardcoding (or accept the duplication with a note to keep in sync)
- Define invoice counter storage: dedicated cell in Rev-Events sheet, or a local counter file, or derive from last row in sheet
- Add post-generation step: "Write Invoice # to Rev-Events column T for the corresponding event row"
- Clarify PDF generation method (Google Docs template + export, or markdown-to-PDF tool)

---

### 5. luma-sync

| Field | Detail |
|-------|--------|
| **Type** | Data sync (read-only from Luma API) |
| **Trigger** | "check registrations", "how many signed up", "event attendance"; also heartbeat (every 2 hours) |
| **Data Sources** | Luma API (`$LUMA_API_KEY_BLRXZO`): `list-events`, `get`, `get-guests` endpoints |
| **Output** | Registration summary (registered/approved/waitlisted/declined counts, check-in stats) |
| **Quality Assessment** | **Needs Work** |

**What It Does Well:**
- Correct API key reference (`$LUMA_API_KEY_BLRXZO`) with proper header format
- Critical `after` parameter documented (without it, API returns only oldest 50 events)
- Pagination handling via `next_cursor`
- Clean registration summary output format
- Show-up rate calculation with Zo benchmark (60-75%)
- Pre-event day-of check procedure
- PII awareness (guest emails not shared publicly)

**Issues Found:**
1. **No 429 rate limit handling.** The error handling section covers 401 (auth) and 404 (not found) but completely omits 429 (rate limit). DATA_SOURCES.md explicitly warns: "Rate limits apply -- if you get 429, wait 60 seconds and retry." With heartbeat running every 2 hours, rate limiting is a real risk during busy event periods.
2. **No retry logic for transient failures.** The skill says "Wait 5 minutes and retry" for outages but does not define structured retry (e.g., exponential backoff, max retries).
3. **No write to Supabase.** DATA_SOURCES.md documents `canonical_events` and `event_registrations` Supabase tables that Suki owns "via luma-sync." The skill only reads from Luma but never writes to Supabase. This means downstream consumers (daily-recap, morning-briefing) that read from Supabase will find stale or empty data.
4. **BLRxZo only.** The skill is hardcoded for BLRxZo events. WTFxZo events use `$LUMA_API_KEY_SFOXZO` (documented in DATA_SOURCES.md) but this skill has no awareness of it. If Suki manages events across both properties, this is a gap.
5. **No date validation.** The skill does not specify how to construct the `after` parameter (yesterday? 7 days ago? configurable?).

**Fix Required:**
- Add 429 rate limit handling: wait 60 seconds, retry once; if still 429, report "Luma rate limited, try again later"
- Add retry logic: max 2 retries with 30s/60s backoff for 5xx errors
- Add Supabase write step: after Luma pull, upsert events to `canonical_events` and registrations to `event_registrations` via `$SUPABASE_SERVICE_ROLE_KEY`
- Add WTFxZo support: parameterize API key by property (`$LUMA_API_KEY_BLRXZO` vs `$LUMA_API_KEY_SFOXZO`)
- Define default `after` parameter: yesterday for heartbeat syncs, 30 days ago for full syncs

---

### 6. rev-tracking

| Field | Detail |
|-------|--------|
| **Type** | Data write (Google Sheets) |
| **Trigger** | "update revenue", "event revenue", "PnL update" |
| **Data Sources** | Event financials (manual input from Boldrin), Rev-Events tab in BLRxZo P&L sheet (`1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y`) |
| **Output** | Updated Rev-Events row with revenue, costs, payment status, margin calculations |
| **Quality Assessment** | **Needs Work** |

**What It Does Well:**
- Comprehensive 22-column schema covering full event financial lifecycle
- Clear workflow stages: booking confirmed -> event completed -> payment received -> overdue
- Monthly reporting template with by-type and payment status breakdowns
- Revenue tracked pre-GST (correct for accounting)
- "Never delete rows" data integrity rule
- Community events with zero revenue still tracked

**Issues Found:**
1. **Write method references a non-existent helper script.** The skill specifies: "Helper script: `/home/conscious-house/bin/google-api`" and "Credentials: `/home/conscious-house/.credentials/sheets.json`." This is a legacy Linux path. The actual deployment is on a Windows PC with credentials at `C:\Users\user\.openclaw\` or referenced via `zo-api`. The google-workspace skill in this same workspace uses OAuth via `zo-api/client_secret_*.json` and `zo-api/token.json`. These are incompatible references.
2. **Does not specify which Google Sheet.** The Rev-Events tab lives inside one of the P&L sheets but the skill never names the sheet ID. DATA_SOURCES.md says: "Referenced in Suki's rev-tracking skill (within BLRxZo or WTFxZo P&L sheet as a tab)." For BLRxZo events, this is `$GOOGLE_SHEET_BLRXZO` = `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y`. For WTFxZo events, this is `$GOOGLE_SHEET_WTFXZO` = `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY`. Neither is stated.
3. **No actual Google Sheets API write method.** The skill says "use the google-api helper script" but the google-workspace skill (the actual tool available) documents `PUT .../values/{range}?valueInputOption=USER_ENTERED` for writes and `POST .../values/{range}:append` for appending rows. The skill should reference these.
4. **Row lookup undefined.** When updating an existing event's row (e.g., changing Payment Status from "Pending" to "Received"), how does Suki find the correct row? No search-by-event-name or row-index tracking mechanism defined.
5. **No cross-property routing.** Revenue for WTFxZo events should go to the WTFxZo P&L sheet, not BLRxZo. This routing logic is absent.

**Fix Required:**
- Replace legacy helper script reference with actual Google Sheets API v4 calls via google-workspace skill
- Add explicit sheet IDs: `$GOOGLE_SHEET_BLRXZO` for BLR events, `$GOOGLE_SHEET_WTFXZO` for WTF events
- Document the write method: `POST https://sheets.googleapis.com/v4/spreadsheets/{sheetId}/values/'Rev-Events'!A:V:append?valueInputOption=USER_ENTERED`
- Define row lookup: read all rows, match by Event Name (column A) + Date (column B), update via `PUT` to the matched range
- Add property-based routing for multi-property support

---

### 7. google-workspace

| Field | Detail |
|-------|--------|
| **Type** | Utility (shared API integration layer) |
| **Trigger** | Various -- calendar, drive, sheets, docs, Gmail operations |
| **Data Sources** | Google APIs (Calendar v3, Drive v3, Sheets v4, Docs v1, Gmail v1) via OAuth 2.0 |
| **Output** | API responses (CRUD operations across Google services) |
| **Quality Assessment** | **Weak** |

**What It Does Well:**
- Comprehensive API reference for all five Google Workspace services
- Correct authentication setup (OAuth 2.0 via `zo-api/client_secret_*.json`)
- Lists shared calendar IDs correctly (`zo-events@zohouse.co`, `zo-blr@zohouse.co`, `zo-wtf@zohouse.co`)
- Error handling table with appropriate actions per error code
- Good best practices (confirm before destructive actions, batch operations, cache IDs)

**Issues Found:**
1. **This is a generic copy-paste, not events-specific.** The skill is identical boilerplate that could be in any agent's workspace. SKILL_TASKS.md explicitly calls this out: "Rewrite per agent with specific sheet IDs, calendars, and folders. Kill the copy-paste version."
2. **Key Spreadsheets section is empty.** It says "Check workspace docs for ID" four times. For Suki, these should be:
   - BLRxZo P&L: `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y` (Rev-Events tab)
   - WTFxZo P&L: `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY` (Rev-Events tab)
   - Laundry List: `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI` (task tracking)
3. **No events-specific workflows.** For Suki, this skill should document: how to check venue availability on the events calendar, how to write to the Rev-Events tab, how to send quote emails via Gmail, how to upload invoices to Google Drive.
4. **Shared Drives section is vague.** "Zo House Events - Event materials" -- no folder ID, no structure.
5. **Example dates are from 2024.** Minor, but stale.

**Fix Required:**
- Rewrite as events-specific google-workspace with:
  - Suki's specific sheet IDs pre-filled
  - Event calendar queries (check availability for date range)
  - Rev-Events append workflow (the specific API call with the specific sheet ID and tab name)
  - Gmail workflow for quote emails and invoice delivery
  - Drive workflow for invoice and photo storage
- Remove generic sections Suki will never use (e.g., creating spreadsheets from scratch)

---

## Missing Skills (Not Yet Built)

These skills are referenced in HANDOFF_MAP.md, TRIGGERS.md, and SKILL_TASKS.md but have no SKILL.md file in `workspaces/events/skills/`.

### event-to-ops (HANDOFF -- Critical)

| Field | Detail |
|-------|--------|
| **Source** | HANDOFF_MAP.md flow #2 (Events -> Operations) |
| **Status in HANDOFF_MAP** | "Not built" |
| **What It Should Do** | When an event is confirmed, send structured prep requirements to the property Captain (and LOKI for vibe/atmosphere). Includes: event name, date/time, headcount, venue area, AV/equipment, catering, setup time, host contact, special requirements. |
| **Trigger** | "event confirmed: [name]" or invoice status changes to paid |
| **Sends To** | Captain (event-prep-checklist) + LOKI (event vibe request) |
| **Implementation** | Use `sessions_spawn` to message the Captain agent with the structured EVENT PREP REQUIRED format defined in HANDOFF_MAP.md |
| **Priority** | **High** -- without this, Boldrin must manually relay event details to property staff. This is the most operationally impactful missing skill for Suki. |

### day-of-event (ACTION -- Critical)

| Field | Detail |
|-------|--------|
| **Source** | SKILL_TASKS.md Phase 3, TRIGGERS.md ("event today: [name]"), SOUL.md During-Event Phase |
| **What It Should Do** | Real-time event coordination mode: attendee check-in tracking via Luma API, issue triage, live headcount updates to Boldrin, photographer coordination (CCVTV), timeline management, 30-min host check-ins. |
| **Trigger** | "event today: [name]" |
| **Data Sources** | Luma API (`get-guests` for live check-in), `event_registrations` Supabase table, CCVTV camera system |
| **Priority** | **High** -- SOUL.md describes this workflow in detail but no skill exists to execute it. |

### host-followup (ACTION -- Medium)

| Field | Detail |
|-------|--------|
| **Source** | SKILL_TASKS.md Phase 3, SOUL.md Post-Event Phase |
| **What It Should Do** | Post-event: thank host within 24h, collect satisfaction feedback, pitch repeat booking, log feedback for quality tracking. Target: 4.5/5 host satisfaction, 20-30% repeat host rate. |
| **Trigger** | Automatic 24h after event completion, or "follow up with host" |
| **Data Sources** | Event details from Rev-Events sheet, host contact from event-inquiry |
| **Priority** | **Medium** -- directly affects repeat host rate KPI. |

### rate-card (REPORT -- Medium)

| Field | Detail |
|-------|--------|
| **Source** | SKILL_TASKS.md Phase 3 |
| **What It Should Do** | Single source of truth for venue pricing by day of week, time slot, event type, and add-ons. Feeds into event-inquiry cost breakdowns and invoice-maker. |
| **Trigger** | "what are the rates", "venue pricing", referenced by event-inquiry |
| **Data Sources** | Should be a managed config document or Google Sheet, maintained by Boldrin |
| **Priority** | **Medium** -- event-inquiry currently has no pricing data, making every quote manual. |

### typeform-sync (DATA SYNC -- Medium)

| Field | Detail |
|-------|--------|
| **Source** | TRIGGERS.md (Boldrin -> Suki automatic: "Daily: typeform-sync -- New event inquiries from Typeform") |
| **What It Should Do** | Daily cron: poll Typeform API for new responses on form `LgcBfa0M`, parse using field IDs from DATA_SOURCES.md, write to `event_inquiries` Supabase table, notify Boldrin of new inquiries. |
| **Trigger** | Daily cron |
| **Data Sources** | Typeform API (`$TYPEFORM_TOKEN`, form ID `LgcBfa0M`), Supabase `event_inquiries` table |
| **Priority** | **Medium** -- currently no automated pipeline from Typeform to Suki. Inquiries may sit unprocessed. |

---

## Handoff Connections

### Receives From

| Source Agent | Handoff Skill | Data Received | Status |
|-------------|--------------|---------------|--------|
| **Yana** (BD) | `partnership-to-event` | Partner company, contact, event requirements, branding, budget/rev-share, timeline | **Not built** (Yana side) |
| **ZomadPrime** | `delegate-task` | Ad-hoc event planning tasks from Samurai | Partially built (generic) |
| **Boldrin** (human) | Direct Telegram DM | Event instructions, GO/NO-GO decisions, host context | Active (via OpenClaw routing) |

### Sends To

| Target Agent | Handoff Skill | Data Sent | Status |
|-------------|--------------|-----------|--------|
| **Captain** (BLRxZo JR / WTFxZo JR) | `event-to-ops` | Event prep requirements: venue, AV, catering, headcount, setup time, host contact | **Not built** |
| **LOKI** (Vibe Curator) | `event-to-ops` (secondary) | Event vibe request: atmosphere, music, community invite | **Not built** |
| **LOKI** | Cover image request | 1200x630px event cover for Luma/social | **Informal** (mentioned in event-marketing but no structured handoff) |
| **ZomadPrime** | Data feed (via Sheets/Supabase) | Rev-Events data read by morning-briefing | **Fragile** (depends on google-workspace working) |
| **Boldrin** (human) | Telegram notifications | Registration updates, recaps, revenue reports | Active |

### Missing Handoffs (Critical Gaps)

1. **Suki -> Captain (event-to-ops):** Most impactful gap. Without this, property staff do not receive structured event prep requirements. Boldrin bridges this manually.
2. **Suki -> LOKI (cover image request):** Event marketing timeline depends on LOKI delivering visual assets. No formal request/response protocol.
3. **Yana -> Suki (partnership-to-event):** Partnership events bypass the normal inquiry pipeline. No fast-track mechanism exists.
4. **Suki -> Supabase (luma-sync write):** luma-sync reads from Luma but never writes to `canonical_events` or `event_registrations`, breaking the data chain for downstream agents (Captains, ZomadPrime).

---

## Data Access Summary

| Data Source | Type | Identifier | Access Method | Used By Skills | Read/Write |
|-------------|------|------------|---------------|----------------|------------|
| **Luma API (BLRxZo)** | External API | `$LUMA_API_KEY_BLRXZO` | `x-luma-api-key` header, base URL `https://public-api.luma.com/v1` | luma-sync, event-recap, event-marketing, day-of-event | Read |
| **Luma API (WTFxZo)** | External API | `$LUMA_API_KEY_SFOXZO` | Same as above, different key | luma-sync (NOT YET) | Read |
| **Typeform (Event Inquiry)** | External API | Form ID `LgcBfa0M`, `$TYPEFORM_TOKEN` | `Authorization: Bearer` header, base URL `https://api.typeform.com` | event-inquiry, typeform-sync (NOT BUILT) | Read |
| **BLRxZo P&L Sheet** | Google Sheets | `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y` (`$GOOGLE_SHEET_BLRXZO`) | Sheets API v4 via OAuth | rev-tracking | Read + Write (Rev-Events tab) |
| **WTFxZo P&L Sheet** | Google Sheets | `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY` (`$GOOGLE_SHEET_WTFXZO`) | Sheets API v4 via OAuth | rev-tracking (NOT YET) | Read + Write (Rev-Events tab) |
| **Laundry List** | Google Sheets | `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI` | Sheets API v4 via OAuth | task-manager (shared) | Read + Write |
| **Supabase: canonical_events** | Database | `https://elvaqxadfewcsohrswsi.supabase.co/rest/v1/canonical_events` | `$SUPABASE_SERVICE_ROLE_KEY` | luma-sync (SHOULD WRITE, DOES NOT) | Write (missing) |
| **Supabase: event_registrations** | Database | Same base URL + `/event_registrations` | Same | luma-sync (SHOULD WRITE, DOES NOT) | Write (missing) |
| **Supabase: event_inquiries** | Database | Same base URL + `/event_inquiries` | Same | typeform-sync (NOT BUILT) | Write (missing) |
| **Google Calendar** | API | `zo-events@zohouse.co`, `zo-blr@zohouse.co` | Calendar API v3 via OAuth | event-inquiry (availability check) | Read |
| **Google Drive** | API | Zo House Events folder (ID unknown) | Drive API v3 via OAuth | invoice-maker (storage), event-recap (photo archive) | Read + Write |
| **Gmail** | API | Zo account via OAuth | Gmail API v1 | event-inquiry (quote emails), invoice-maker (delivery) | Write |
| **Google OAuth Credentials** | Config | `zo-api/client_secret_473298819240-*.json`, `zo-api/token.json` | Local filesystem | google-workspace | N/A |
| **Legacy Credentials (BROKEN)** | Config | `/home/conscious-house/.credentials/sheets.json` | Referenced by rev-tracking | rev-tracking | N/A (path does not exist) |

---

## Key Issues & Recommendations

### CRITICAL: Broken Data Chain (Luma -> Supabase)

**Problem:** `luma-sync` reads from Luma but never writes to Supabase tables (`canonical_events`, `event_registrations`). DATA_SOURCES.md says Suki owns these tables "via luma-sync." Downstream agents (Captains' daily-recap, ZomadPrime's morning-briefing) expect to read event data from Supabase. The data never arrives.

**Fix:** Add Supabase upsert steps to luma-sync. After every Luma pull:
1. Upsert events to `canonical_events` (event_id, name, culture_tag, start_at, end_at, location)
2. Upsert guests to `event_registrations` (event_id, guest_email, registration_status, checked_in)
Use `$SUPABASE_SERVICE_ROLE_KEY` for writes.

### CRITICAL: rev-tracking References Non-Existent Infrastructure

**Problem:** rev-tracking references `/home/conscious-house/bin/google-api` helper script and `/home/conscious-house/.credentials/sheets.json`. These are legacy Linux paths that do not exist in the current deployment. The skill is effectively broken for automated writes.

**Fix:** Rewrite rev-tracking to use Google Sheets API v4 directly (as documented in google-workspace skill), with OAuth credentials from `zo-api/token.json`. Add the specific sheet IDs (`$GOOGLE_SHEET_BLRXZO`, `$GOOGLE_SHEET_WTFXZO`).

### HIGH: No Automated Inquiry Pipeline

**Problem:** SOUL.md describes "Host fills Typeform inquiry -> Slack #event-bd notification" but there is no `typeform-sync` skill to poll the Typeform API. TRIGGERS.md lists it as a daily automatic task. event-inquiry assumes submissions arrive but does not define how.

**Fix:** Build `typeform-sync` skill:
- Cron: daily at 09:00 IST
- Poll: `GET https://api.typeform.com/forms/LgcBfa0M/responses?since={last_check}`
- Parse using field IDs from DATA_SOURCES.md
- Write to `event_inquiries` Supabase table
- Notify Boldrin via Telegram with summary of new inquiries

### HIGH: event-to-ops Handoff Does Not Exist

**Problem:** HANDOFF_MAP.md defines this as flow #2. TRIGGERS.md lists "event confirmed: [name]" as a trigger. But no skill exists. When Suki confirms an event, the property Captain receives no automated prep requirements.

**Fix:** Build `event-to-ops` skill using `sessions_spawn` to message the Captain agent with the structured format from HANDOFF_MAP.md. Include: event name, date, time, duration, headcount, venue area, AV requirements, catering needs, setup time, host contact, special requirements.

### HIGH: google-workspace Is Generic Boilerplate

**Problem:** SKILL_TASKS.md explicitly flags this: "Rewrite per agent with specific sheet IDs, calendars, and folders. Kill the copy-paste version." The current skill has placeholder text where sheet IDs should be. Suki's other skills (rev-tracking, event-inquiry) cannot effectively use it.

**Fix:** Rewrite with Suki-specific content:
- Pre-fill BLRxZo P&L sheet ID, WTFxZo P&L sheet ID
- Add Rev-Events tab append workflow
- Add events calendar availability check workflow
- Add Gmail quote/invoice delivery workflow
- Remove generic sections (creating spreadsheets, etc.)

### MEDIUM: luma-sync Missing 429 Rate Limit Handling

**Problem:** DATA_SOURCES.md warns about rate limits. The heartbeat runs every 2 hours. During busy event weeks with multiple events, rapid Luma API calls could trigger 429s. The skill handles 401 and 404 but not 429.

**Fix:** Add to error handling: "If 429: wait 60 seconds, retry once. If still 429, report 'Luma rate limited' and skip this sync cycle."

### MEDIUM: No Rate Card

**Problem:** event-inquiry's cost breakdown section has no actual pricing. Every quote requires Boldrin's manual input on rates. This defeats the purpose of having an automated inquiry pipeline.

**Fix:** Build `rate-card` skill or section within event-inquiry:
- Weekday base rates by venue
- Weekend premium multiplier
- F&B per-head tiers (tea/coffee, snacks, meals, bar)
- AV packages (standard included, premium extra)
- Boldrin reviews and updates quarterly

### MEDIUM: Invoice Counter Has No Persistent Storage

**Problem:** invoice-maker says "check the rev-tracking sheet or ask Boldrin" for the last invoice number. No reliable automated counter exists.

**Fix:** Define counter storage: read column T (Invoice #) of Rev-Events tab, find the highest sequence number for the current date prefix, increment by 1. Or maintain a dedicated counter cell (e.g., `Rev-Events!Z1`).

### LOW: WTFxZo Events Not Supported

**Problem:** luma-sync is BLRxZo-only (`$LUMA_API_KEY_BLRXZO`). rev-tracking does not specify which sheet to write to per property. If Suki manages events at WTFxZo (Whitefield), the entire pipeline breaks.

**Fix:** Parameterize all skills by property. luma-sync should accept a property parameter and use the correct API key. rev-tracking should route to the correct P&L sheet based on venue.

### LOW: LOKI Cover Image Dependency Is Informal

**Problem:** event-marketing mentions coordinating with LOKI for cover images but provides no structured handoff, timeline, or fallback.

**Fix:** Add a formal request: use `sessions_spawn` to LOKI with event name, date, vibe keywords, and 24h deadline. Fallback: use generic Zo-branded template if LOKI does not deliver in time.

---

## Skill Maturity Summary

| Skill | Status | Quality | Blocking Issues |
|-------|--------|---------|-----------------|
| event-inquiry | Exists | Needs Work | No rate card, no Typeform polling, no Supabase logging |
| event-marketing | Exists | Strong | LOKI dependency informal, no Luma write API |
| event-recap | Exists | Needs Work | No automated data pull, no storage location |
| invoice-maker | Exists | Needs Work (minor) | Hardcoded GSTIN, no counter storage, no PDF method |
| luma-sync | Exists | Needs Work | No 429 handling, no Supabase write, BLRxZo only |
| rev-tracking | Exists | Needs Work | Broken helper script path, no sheet ID, no write method |
| google-workspace | Exists | Weak | Generic copy-paste, no events-specific content |
| event-to-ops | **NOT BUILT** | N/A | Critical handoff missing |
| day-of-event | **NOT BUILT** | N/A | No real-time coordination capability |
| host-followup | **NOT BUILT** | N/A | Affects repeat host rate KPI |
| rate-card | **NOT BUILT** | N/A | Blocks automated quoting in event-inquiry |
| typeform-sync | **NOT BUILT** | N/A | No automated inquiry intake |

---

## Recommended Fix Order

1. **rev-tracking** -- Fix the broken helper script reference and add sheet IDs. Unblocks financial data flow.
2. **luma-sync** -- Add 429 handling, Supabase writes, WTFxZo support. Unblocks the entire data chain.
3. **google-workspace** -- Rewrite as events-specific. Unblocks all skills that need Google API access.
4. **event-to-ops** -- Build the handoff. Unblocks Captain coordination.
5. **typeform-sync** -- Build the intake pipeline. Unblocks automated inquiry processing.
6. **rate-card** -- Build pricing reference. Unblocks automated quoting.
7. **event-inquiry** -- Fix with Typeform field IDs, Supabase logging, calendar IDs.
8. **day-of-event** -- Build real-time coordination. Fills the biggest operational gap.
9. **invoice-maker** -- Minor fixes (counter, PDF, config reference).
10. **event-recap** -- Minor fixes (dependency chain, storage).
11. **event-marketing** -- Minor fixes (LOKI handoff formalization).
12. **host-followup** -- Build post-event relationship skill.

---

*Last updated: 2026-02-12*
*Source files: workspaces/events/{SOUL.md, AGENTS.md, TOOLS.md, IDENTITY.md, USER.md, HEARTBEAT.md}, workspaces/events/skills/{event-inquiry, event-marketing, event-recap, google-workspace, invoice-maker, luma-sync, rev-tracking}/SKILL.md, docs/{DATA_SOURCES.md, HANDOFF_MAP.md, TRIGGERS.md, SKILL_TASKS.md}*