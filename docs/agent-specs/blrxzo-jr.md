# BLRxZo JR — House Captain (Bangalore)

> AI operations captain for BLRxZo properties — manages digital coordination, financial tracking, staff performance, maintenance triage, and daily reporting across a 12-hour shift alongside human partner Darshan.

---

## Identity
- **Agent ID:** blrxzo-jr
- **Workspace:** workspaces/captain-blrxzo/
- **Human Partner:** Darshan (House Captain)
- **Telegram ID:** 1081875702
- **Role:** Property operations captain for BLRxZo properties (Whitefield, Koramangala, Brigade Road, Indiranagar)
- **Shift:** 08:00 AM - 08:00 PM IST
- **OpenClaw Routing:** Darshan's Telegram DMs route directly to blrxzo-jr
- **Model:** Claude Haiku 4.5 (via OpenClaw gateway)

---

## Current Skills Inventory

### 1. daily-recap
- **Type:** Report
- **Trigger:**
  - Human phrases: "morning update", "daily recap", "daily status", "recap", "end of day"
  - Cron: Heartbeat at 8:00 AM IST daily (per HEARTBEAT.md)
  - Custom range: "recap for last week", "January numbers", "today only"
- **Data Sources:**
  - **Supabase `pms_bookings`** — Accommodation revenue (sum of `total_room_charges` filtered by `property_id=eq.BLRxZo` and `arrivaldate` range). Base URL: `https://elvaqxadfewcsohrswsi.supabase.co/rest/v1`. Credentials: `/home/conscious-house/.credentials/apis.json` -> `supabase.service_role_key`
  - **Google Sheets** — BLRxZo Running P&L, Sheet ID: `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y`, Tab: `Summary 2026`, Rows 4-39 (revenue lines, expense lines, EBITDA). Credentials: `/home/conscious-house/.credentials/google.json`
  - **Supabase `pms_bookings`** — Occupancy (count of guests with overlapping arrival/departure dates against 15-bed capacity)
  - **Luma API** — Events for today. Endpoint: `https://public-api.luma.com/v1/calendar/list-events?after={yesterday}T00:00:00Z`. Auth: `$LUMA_API_KEY_BLRXZO`. Filters by BLRxZo location strings (Koramangala, BLRxZo, Brigade Road, Indiranagar).
- **Output:** Structured report with MTD revenue (Accommodation, Co-Working, Events, Cafe), EBITDA, occupancy (X/15 beds), today's events, auto-generated warning flags, and top priorities. Sent via Telegram to both Darshan (1081875702) and Samurai (1275114944).
- **Quality Assessment:** Needs Work
- **Issues Found:**
  1. **Hardcoded date in Supabase query example** — The SKILL.md contains `arrivaldate=gte.2026-02-01T00:00:00` as a literal example rather than parameterized `{current_month_start}`. Risk of agent copying the literal date.
  2. **Credential path mismatch** — Skill references `/home/conscious-house/.credentials/apis.json` and `/home/conscious-house/.credentials/google.json`, but DATA_SOURCES.md notes actual credential location on Windows PC is `C:\Users\user\.openclaw\` and `C:\Users\user\.credentials\`. The `/home/conscious-house/` path is a legacy path. If the agent runs on a different host, this breaks.
  3. **No error handling for individual data source failures** — SKILL_TASKS.md explicitly calls this out: "Add error handling for Supabase/Luma/Sheets failures. Specify fallback behavior for each data source." The RULES section says "show unavailable" but does not define per-source fallback behavior (e.g., should the recap still send if Sheets is down but Supabase works?).
  4. **Accommodation row in Sheet ignored** — Row 4 (Accommodation) is intentionally skipped in favor of Supabase data, but there is no cross-validation step to flag divergence between the two sources.
  5. **Luma pagination not fully handled** — Skill mentions checking `has_more` and `pagination_cursor` but does not specify how many pages to fetch or a max-events cap.
  6. **P&L row mapping is fragile** — Relies on exact row numbers (Row 4, 5, 6, etc.) in the Summary 2026 tab. If anyone inserts a row, all mappings break. SKILL_TASKS.md specifically flags this: "Replace fragile row-number references with column headers or named ranges."
  7. **Property ID casing inconsistency** — The Supabase query uses `property_id=eq.BLRxZo` (mixed case), but DATA_SOURCES.md example shows `property_id=eq.blrxzo` (lowercase). This could cause zero-result queries if the database uses one convention.
- **Fix Required:**
  - Parameterize all dates; remove hardcoded date examples
  - Resolve credential path to use environment variables (`$SUPABASE_SERVICE_ROLE_KEY`, Google OAuth via env) instead of hardcoded file paths
  - Add per-source fallback: if Supabase fails, note "Accommodation: unavailable" and still report Sheet data; if Sheets fail, report only Supabase data; if both fail, send error notice
  - Add cross-validation: if Sheet accommodation (Row 4) diverges >15% from Supabase sum, flag it
  - Replace row-number mapping with a lookup by label text in Column B
  - Standardize property_id casing across all queries (confirm actual DB value)

---

### 2. morning-audit
- **Type:** Report / Action (read + write)
- **Trigger:**
  - Human phrases: "task audit", "my tasks", "what do I need to do", "task status", "morning audit", "start shift"
  - Human write phrases: "mark P3 as done", "update task", "add task", "new task", "postpone P13", "cancel P18"
  - Cron: Heartbeat at 10:00 AM IST daily (per HEARTBEAT.md says 8AM, but TRIGGERS.md says 10:30 AM — **conflict**)
- **Data Sources:**
  - **Google Sheets** — Laundry List, Sheet ID: `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI`, Tab: `main list`, Range: A1:O100. Credentials: `/home/conscious-house/.credentials/google.json`
- **Output:** Structured task audit showing In Progress, Not Started, Postponed tasks filtered by Owner="Darshan", sorted by priority (P1 > P2 > ...). Includes completion score, property breakdown, and top 3 priorities. Sent to Darshan (1081875702) and Samurai (1275114944).
- **Quality Assessment:** Needs Work
- **Issues Found:**
  1. **Column mapping conflicts with DATA_SOURCES.md** — This is a critical discrepancy. The morning-audit SKILL.md defines 15 columns with this order: A=Task, B=Request From, C=Added By, D=Nature of task, E=Track, F=Product Area, G=Priority Order, H=Owner, I=Status, J=Metric(s) Impacted, K=Date Added, L=Last checked, M=Effort, N=Links, O=Comments. However, DATA_SOURCES.md defines a different column order: A=Task, B=Status, C=Owner, D=Property, E=Due Date, F=Created, G=Priority, H=Category, I=Assigned By, J=Blocker, K=Last Checked, L=Agent, M=Human, N=Notes, O=Comments. **These two mappings are incompatible.** If the agent uses the SKILL.md mapping against a sheet organized per DATA_SOURCES.md, it will read Status from column B (where SKILL.md expects "Request From"), Owner from column C (where SKILL.md expects "Added By"), etc. Every read and write operation would target the wrong cells.
  2. **Cron time conflict** — HEARTBEAT.md says 8AM (for daily-recap) and 7PM (for daily-recap again). It does not mention morning-audit at all. TRIGGERS.md says morning-audit runs at 10:30 AM IST. The SKILL.md itself says "Heartbeat at 10AM IST daily." Three different times across three documents.
  3. **No error handling for sheet unavailable** — SKILL_TASKS.md flags: "Add error handling for sheet unavailable."
  4. **Fragile row-number references** — SKILL_TASKS.md flags: "Replace fragile row-number references with column headers or named ranges."
  5. **Priority format assumption** — Assumes priorities are always formatted as "P{number}" (P1, P2, etc.). If someone enters "P1 - urgent" or "High", the numeric extraction will fail.
  6. **Range limit of A1:O100** — If the task list exceeds 100 rows, tasks beyond row 100 are invisible to the agent.
- **Fix Required:**
  - **CRITICAL: Resolve the column mapping conflict.** Read the actual sheet header row first to determine the real column order, or update SKILL.md to match DATA_SOURCES.md (or vice versa). One must be canonical.
  - Settle the cron time: pick one (likely 10:00 AM IST as the SKILL.md states) and update HEARTBEAT.md and TRIGGERS.md to match
  - Add error handling: if sheet returns 403 or timeout, send "Task sheet unavailable" message
  - Look up columns by header text rather than hardcoded positions
  - Increase range to A1:O500 or use dynamic range detection

---

### 3. financial-entry
- **Type:** Action
- **Trigger:**
  - Human phrases: "log expense", "revenue entry", "capex", "opex", "procurement", "log [amount] for [category]"
  - Downstream from guest-flow (payment events)
- **Data Sources:**
  - **Google Sheets** — BLRxZo P&L, referenced via `/home/conscious-house/.credentials/sheets.json` key `blrxzo_pnl`. Sheet ID not explicitly stated in the SKILL.md (only the credential key), but DATA_SOURCES.md confirms it is `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y`. Writes to tab `{property}_P&L`.
  - **Eezee PMS** — Cross-reference for booking revenue (no API details provided)
- **Output:** Confirmation message with date, property, type, category, description, amount, payment method, reference, and row number. Appends row to the P&L sheet via `/home/conscious-house/bin/google-api` helper.
- **Quality Assessment:** Needs Work
- **Issues Found:**
  1. **Dependency on non-existent helper binary** — References `/home/conscious-house/bin/google-api` as the write tool. This binary is not documented in DATA_SOURCES.md or TOOLS.md. If it does not exist on the host, all writes fail silently.
  2. **Credential file mismatch** — Uses `/home/conscious-house/.credentials/sheets.json` with key `blrxzo_pnl`, while daily-recap uses `/home/conscious-house/.credentials/google.json`. DATA_SOURCES.md lists both `apis.json` and `google.json` and `sheets.json` as separate files. It is unclear if `sheets.json` is auto-generated from `google.json` or a separate credential.
  3. **Sheet ID not in SKILL.md** — The skill references the sheet by credential key (`blrxzo_pnl`) rather than by explicit Sheet ID. This adds an indirection layer that makes debugging harder.
  4. **No duplicate detection implementation** — The skill says "warn about possible duplicate" if same vendor+amount in last 7 days, but provides no query method to check existing rows.
  5. **Approval threshold misalignment** — Financial-entry says capex threshold is Rs 5,000. Maintenance-triage says: repairs under Rs 2,000 have standing approval, Rs 2,000-5,000 notify Darshan, Rs 5,000+ require explicit approval. These are compatible but the financial-entry skill does not reference the Rs 2,000 notification tier.
  6. **Eezee PMS integration undefined** — "Cross-reference for accommodation and booking revenue" is mentioned but no API endpoint, credentials, or method is provided. SKILL_TASKS.md flags: "Clarify Eezee PMS integration (manual vs API)."
  7. **Tab naming convention assumed** — Writes to `{property}_P&L` (e.g., `Whitefield_P&L`), but DATA_SOURCES.md shows the tab is `BLRxZo_P&L`. If properties are individual tabs per location (Whitefield, Koramangala, etc.), this conflicts with DATA_SOURCES.md which shows a single `BLRxZo_P&L` tab.
- **Fix Required:**
  - Replace the `/home/conscious-house/bin/google-api` helper with direct Google Sheets API v4 append call (documented in google-workspace skill)
  - Embed the actual Sheet ID `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y` directly in the skill
  - Clarify which tabs exist (one `BLRxZo_P&L` tab for all properties, or separate tabs per location)
  - Implement duplicate detection: read last 7 days of rows, compare vendor+amount
  - Add the Rs 2,000 notification tier from maintenance-triage
  - Either document Eezee PMS API or explicitly state it is manual-only

---

### 4. guest-flow
- **Type:** Action / Handoff
- **Trigger:**
  - Human phrases: "guest checking in", "check-out", "new arrival", "room assignment", "guest checking in: [name]", "guest checking out: [name]"
  - Eezee PMS events (undefined integration)
- **Data Sources:**
  - **Eezee PMS** — Bookings, payment status, room assignment (no API documented)
  - **PM Tool (zo.xyz/pm)** — Web check-in documents (no API documented)
  - **WhatsApp** — Community groups (manual process, no API)
- **Output:** Structured check-in or check-out confirmation with guest details, room, payment, documents, and WhatsApp status.
- **Quality Assessment:** Needs Work
- **Issues Found:**
  1. **No programmatic integration with Eezee PMS** — Every step references Eezee (pull reservation, check payment, assign room, mark check-out) but no API endpoint, credential, or method is documented. This is effectively a human-executed checklist, not an automated skill. SKILL_TASKS.md flags: "Clarify Eezee PMS integration (manual vs API)."
  2. **No programmatic integration with PM Tool** — "Verify guest ID documents are uploaded in PM Tool (zo.xyz/pm)" — no API or method to actually check this.
  3. **WhatsApp group management conflict** — The skill says "Add guest to the property WhatsApp group" and "Send a brief intro message." HANDOFF_MAP.md specifies that after check-in, the captain should hand off to LOKI for community onboarding (including WhatsApp group add and intro message). SKILL_TASKS.md flags: "Resolve WhatsApp group ownership (captain vs LOKI)."
  4. **No handoff to LOKI implemented** — The check-in workflow ends at Step 6 (Community Onboarding) without any `sessions_spawn` call or structured message to LOKI. HANDOFF_MAP.md flow #3 ("Check-in -> Community Onboarding") is not built.
  5. **No handoff to financial-entry** — When payment is collected at check-in (Step 3), the skill says "Log payment receipt in Eezee PMS immediately" but does not trigger financial-entry to update the Google Sheet P&L.
  6. **Missing edge cases** — SKILL_TASKS.md flags: "Add edge cases (no rooms, guest disputes, key loss)." The skill covers no-rooms partially (upgrade or escalate) but not disputes or key loss.
  7. **Google Review request method undefined** — Check-out Step 5 says "Send Google Review request link to guest via WhatsApp or SMS" but no link template or method is provided.
- **Fix Required:**
  - Determine if Eezee PMS has an API and document it, or explicitly mark all Eezee steps as "Darshan executes manually, agent tracks"
  - Remove WhatsApp community onboarding from guest-flow and replace with a structured handoff to LOKI (via `sessions_spawn` with GUEST CHECKED IN payload per HANDOFF_MAP.md)
  - Add financial-entry trigger after payment collection
  - Add Google Review link template
  - Add edge cases: key loss procedure, guest disputes escalation path, overbooking protocol

---

### 5. maintenance-triage
- **Type:** Triage / Action
- **Trigger:**
  - Human phrases: "something's broken", "maintenance issue", "repair needed", "maintenance: [description]", "AC not working in room 204"
  - Staff/guest reports of facility problems
- **Data Sources:**
  - None specified for reading. The skill is input-driven (Darshan or staff describes the issue).
  - **Writes to:** Maintenance log (format defined in skill but no destination specified — not a Google Sheet, not Supabase, not a file).
  - **Feeds into:** financial-entry skill for cost tracking.
- **Output:** Maintenance log entry with date/time, property, location, reporter, priority (CRITICAL/HIGH/MEDIUM/LOW), category, description, assignment, estimated resolution, estimated cost, and status.
- **Quality Assessment:** Needs Work
- **Issues Found:**
  1. **No persistent storage for maintenance logs** — The skill defines a detailed log format but does not specify where it is stored. Not a Google Sheet, not a Supabase table, not a local file. The log exists only in the Telegram conversation and will be lost when context is pruned.
  2. **No vendor directory** — The skill references "approved vendor categories" and "vendor contacts are maintained by Darshan" but provides no queryable directory. SKILL_TASKS.md flags: "Create vendor directory (or reference vendor-directory skill)." The vendor-directory skill is listed as a Phase 3 missing skill.
  3. **Cost threshold alignment** — The skill defines three tiers: under Rs 2,000 (standing approval), Rs 2,000-5,000 (opex, notify), Rs 5,000+ (capex, explicit approval). Financial-entry only defines the Rs 5,000 capex threshold. These should cross-reference each other.
  4. **SLA tracking not implemented** — Vendor SLAs are defined (Electrician: 1hr, Plumber: 1hr, etc.) but there is no mechanism to track whether the SLA was met or to trigger escalation when it is exceeded.
  5. **No integration with financial-entry** — The skill says "All maintenance costs feed into the financial-entry skill" but does not define how (no auto-trigger, no structured handoff).
  6. **No photo storage integration** — "Take or request photos of every issue before and after repair" — no upload method or storage location defined.
- **Fix Required:**
  - Define a maintenance log destination: either a Supabase table (e.g., `maintenance_logs`) or a dedicated Google Sheet tab
  - Build or reference a vendor-directory skill with actual contact info
  - Add explicit trigger to financial-entry when a repair cost is confirmed
  - Add SLA timer: if vendor hasn't responded within SLA, auto-escalate message to Darshan
  - Define photo storage (Google Drive folder or Supabase storage bucket)

---

### 6. staff-report
- **Type:** Report
- **Trigger:**
  - Human phrases: "housekeeping report", "staff performance", "task completion"
  - Runs as part of daily-recap (per skill description)
- **Data Sources:**
  - **Supabase `housekeeping_staff`** — Staff directory (id, name, property, role, active, joined_date, reward_points). Base URL: `https://elvaqxadfewcsohrswsi.supabase.co/rest/v1`
  - **Supabase `housekeeping_sessions`** — Cleaning task records (staff_id, property, zone, task_type, assigned_at, started_at, completed_at, photo_before, photo_after, photo_verified)
  - **Supabase `daily_performance`** — Aggregated daily metrics (staff_id, date, tasks_assigned, tasks_completed, avg_time_minutes, photo_pass_rate, points_earned, flag)
- **Output:** Multi-section report: property summary table, individual performance rankings, top performers, coaching flags, unfinished tasks. Optional weekly trend on request.
- **Quality Assessment:** Needs Work
- **Issues Found:**
  1. **Supabase tables may not exist** — SKILL_TASKS.md flags: "Verify Supabase table existence." The tables `housekeeping_staff`, `housekeeping_sessions`, and `daily_performance` are listed in DATA_SOURCES.md but there is no confirmation they have been created and populated. If the tables are empty or non-existent, the skill produces no output with no fallback.
  2. **No credentials specified in skill** — The skill lists the Supabase table schemas but does not include the actual query commands, credential file reference, or auth header. Unlike daily-recap, which provides full curl commands, staff-report provides zero implementation details for data retrieval.
  3. **Recipient ambiguity** — SKILL_TASKS.md flags: "Specify who receives report (Darshan only? + Samurai?)." The skill says "Needs Coaching section is for Darshan's eyes only" but does not specify the Telegram delivery targets.
  4. **No Supabase query examples** — Daily-recap includes complete curl commands. Staff-report has none — just table schemas. The agent must infer the query pattern.
  5. **Reward points system undocumented as data flow** — Points are described as a reward system (5 pts for completion, 3 pts for photo quality, etc.) but it is unclear if these are calculated by the agent or pre-calculated in the `daily_performance` table.
  6. **Output format uses markdown tables** — AGENTS.md warns: "Discord/WhatsApp: No markdown tables! Use bullet lists instead." Since output goes to Telegram, tables may render poorly depending on the client.
- **Fix Required:**
  - Verify the three Supabase tables exist; if not, create them or define a fallback data source
  - Add complete curl query examples matching the daily-recap pattern
  - Define recipients: Darshan for full report (including coaching flags), Samurai for summary only (excluding individual coaching data)
  - Add fallback: if Supabase tables are empty, send "No housekeeping data available — tables may need initial population"
  - Consider converting table output to bullet-list format for Telegram readability

---

### 7. google-workspace
- **Type:** Sync (utility/integration layer)
- **Trigger:**
  - Calendar: "add to calendar", "schedule", "create event", "check calendar"
  - Drive: "upload to drive", "save to drive", "find in drive"
  - Sheets: "update sheet", "read spreadsheet", "add row"
  - Docs: "create doc", "update document", "read doc"
  - Gmail: "send email", "check email", "read inbox", "draft email"
- **Data Sources:**
  - **Google OAuth 2.0** — Client secret: `zo-api/client_secret_473298819240-kkqgen93r91d28h9u8erlb8r9t9donj8.apps.googleusercontent.com.json`, Token: `zo-api/token.json`, Project ID: `zoconsole`
  - **Shared calendars:** `zo-events@zohouse.co`, `zo-blr@zohouse.co`, `zo-wtf@zohouse.co`
- **Output:** Varies by operation — calendar events, file lists, sheet data, email content.
- **Quality Assessment:** Weak
- **Issues Found:**
  1. **Generic copy-paste skill** — SKILL_TASKS.md explicitly flags: "Rewrite per agent with specific sheet IDs, calendars, and folders. Kill the copy-paste version." This is the same google-workspace skill shared across all agents with zero BLRxZo-specific customization.
  2. **No BLRxZo-specific sheet IDs** — The "Key Spreadsheets" section says "Check workspace docs for ID" for Guest Tracker, Revenue Dashboard, and Event Pipeline. These IDs are never provided.
  3. **Credential path differs from other skills** — Uses `zo-api/client_secret_473298819240-...json` and `zo-api/token.json` (relative paths), while daily-recap uses `/home/conscious-house/.credentials/google.json` (absolute path). It is unclear if these are the same credentials or different ones.
  4. **No BLRxZo-specific calendar referenced** — The skill lists `zo-blr@zohouse.co` but does not configure it as the default calendar for BLRxZo operations.
  5. **Example dates are from 2024** — The create event example uses `2024-01-15`, which is outdated.
  6. **No rate limit handling for Sheets** — DATA_SOURCES.md specifies: "For 429: wait 60s, retry once." This skill only has a generic error table.
- **Fix Required:**
  - Rewrite for BLRxZo specifically: embed Sheet ID `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y` (P&L) and `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI` (Laundry List)
  - Set default calendar to `zo-blr@zohouse.co`
  - Resolve credential path: use one canonical path and reference it consistently
  - Add retry logic for 429 rate limits per DATA_SOURCES.md

---

## Missing Skills (Not Yet Built)

Skills promised in SOUL.md, HANDOFF_MAP.md, TRIGGERS.md, or SKILL_TASKS.md that do not exist in the `workspaces/captain-blrxzo/skills/` directory:

| # | Skill Name | Source of Promise | Type | Description |
|---|-----------|-------------------|------|-------------|
| 1 | **shift-handoff** | SOUL.md (Phase 6: EOD Wrap-Up), HANDOFF_MAP.md (#7), TRIGGERS.md ("shift handoff"), SKILL_TASKS.md (Phase 2) | Handoff | End-of-shift structured handoff to night staff: pending maintenance, expected check-ins/outs, open issues, staff notes. TRIGGERS.md lists it as a valid trigger phrase for Darshan. |
| 2 | **incoming-guest-brief** | HANDOFF_MAP.md (#1), TRIGGERS.md (Incoming Handoffs), SKILL_TASKS.md (Phase 2) | Handoff | Receives guest data from Wanda's sale-to-ops handoff. Displays upcoming guest context: name, dates, preferences, payment status, booking source. |
| 3 | **event-prep-checklist** | HANDOFF_MAP.md (#2), TRIGGERS.md (Incoming Handoffs), SKILL_TASKS.md (Phase 2) | Handoff | Receives event requirements from Suki's event-to-ops handoff. Generates property-specific prep checklist: AV, catering, staffing, signage, parking. |
| 4 | **vendor-directory** | SKILL_TASKS.md (Phase 3) | Report | Searchable list of approved vendors by category with contact info, response SLA, cost history, and backup vendor. Property-specific. Referenced by maintenance-triage but does not exist. |
| 5 | **task-manager** | TRIGGERS.md (Darshan: "mark P2 as done") | Action | TRIGGERS.md lists "mark P{X} as done" under a skill called "task-manager" for Darshan, but the actual implementation lives inside morning-audit. The naming inconsistency could confuse routing. |

### SOUL.md Promises Without Matching Skills

| SOUL.md Section | Capability Promised | Current Status |
|----------------|--------------------|----|
| Phase 1: Digital Audit | "Eezee system review: Check-ins scheduled, check-outs pending, payment status" | No Eezee API integration exists in any skill |
| Phase 1: Digital Audit | "PM Tool check: Verify web check-in documents uploaded" | No PM Tool API integration exists |
| Phase 2: Physical Inspection | "25-item visual inspection checklist" | No checklist skill or template exists |
| Phase 2: Physical Inspection | "Review staff 'Before & After' photo submissions" | staff-report references photo_verified but no photo review interface |
| Phase 3: Financial Management | "Procurement: Hyperpure bulk orders (2-3x weekly)" | No Hyperpure integration skill |
| Phase 3: Financial Management | "Bill digitization: Photo -> store for records" | No OCR or photo-to-record skill |
| Phase 4: Recreation & Activities | "Activity schedule upload to Activity Manager" | No Activity Manager integration |
| Phase 4: Recreation & Activities | "Sync schedules to Zoster/Playo platforms" | No Zoster/Playo integration |
| Phase 6: EOD Wrap-Up | "Night staff briefing" | shift-handoff skill not built |
| Reports | "Weekly Revenue Summary -- Sunday to Finance" | No weekly revenue summary skill |
| Reports | "Weekly Staff Performance -- Rankings, coaching needs" | staff-report exists but no weekly aggregation skill |
| Reports | "Monthly P&L Summary -- Opex/Capex sheets" | No monthly summary skill |

---

## Handoff Connections

### Receives From

| From Agent | Via Skill | Data Received | Status |
|-----------|----------|---------------|--------|
| Wanda | `sale-to-ops` | Guest name, dates, property, room type, payment status, special requests, booking source, Founder Member status | **Not built** — HANDOFF_MAP.md #1. Wanda's sale-to-ops skill does not exist. BLRxZo JR's incoming-guest-brief receiver skill does not exist. |
| Suki | `event-to-ops` | Event name, date/time, headcount, venue requirements, AV, catering, setup time, host contact | **Not built** — HANDOFF_MAP.md #2. Suki's event-to-ops skill does not exist. BLRxZo JR's event-prep-checklist receiver skill does not exist. |
| ZomadPrime | `delegate-task` | Delegated tasks from Samurai via ZomadPrime | **Partially built** — ZomadPrime has delegate-task, but there is no explicit receiver skill on blrxzo-jr. Tasks arrive as raw Telegram messages. |

### Sends To

| To Agent | Via Skill | Data Sent | Status |
|---------|----------|-----------|--------|
| LOKI | `guest check-in -> onboard` | Guest name, room, check-out date, Founder status, interests, first-time flag | **Not built** — HANDOFF_MAP.md #3. guest-flow does not trigger LOKI. The guest-flow skill handles community onboarding itself (conflicting with LOKI's role). |
| ZomadPrime | `daily data -> morning-briefing` | Daily recap data (revenue, occupancy, events, issues) | **Partially built** — daily-recap writes to Google Sheets and Supabase, and ZomadPrime's morning-briefing reads from those sources. But this is data-mediated (both read the same sources independently), not a direct agent-to-agent handoff. Fragile. |
| Night Staff | `shift-handoff` | Open maintenance, expected check-ins tonight, tomorrow check-outs, staff assignments, notes | **Not built** — HANDOFF_MAP.md #7. |

### Missing Handoffs

1. **BLRxZo JR -> LOKI after check-in** — Most critical missing connection. When a guest checks in, LOKI should be notified for community onboarding. Currently, guest-flow tries to do community onboarding itself, conflicting with LOKI's purpose.
2. **BLRxZo JR -> financial-entry after maintenance cost** — maintenance-triage says costs feed into financial-entry but provides no trigger mechanism.
3. **BLRxZo JR -> ZomadPrime for anomaly alerts** — If occupancy drops below 80% or maintenance costs spike, there is no auto-alert to ZomadPrime. Only the daily-recap flags exist.

---

## Data Access Summary

| Data Source | Type | Identifier | Needed By Skills | Access Status | Issues |
|------------|------|-----------|-----------------|---------------|--------|
| Supabase `pms_bookings` | Database table | `https://elvaqxadfewcsohrswsi.supabase.co/rest/v1/pms_bookings` | daily-recap, guest-flow | **Has access** (via `SUPABASE_SERVICE_ROLE_KEY` in `/home/conscious-house/.credentials/apis.json`) | Property ID casing inconsistency (`BLRxZo` vs `blrxzo`). Credential path is legacy. |
| Supabase `housekeeping_staff` | Database table | Same base URL | staff-report | **Unverified** — table may not exist | SKILL_TASKS.md flags table existence unverified |
| Supabase `housekeeping_sessions` | Database table | Same base URL | staff-report | **Unverified** — table may not exist | Same as above |
| Supabase `daily_performance` | Database table | Same base URL | staff-report | **Unverified** — table may not exist | Same as above |
| Google Sheets: BLRxZo P&L | Spreadsheet | `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y` | daily-recap, financial-entry | **Has access** (via Google OAuth in `/home/conscious-house/.credentials/google.json`) | Row-number-based mapping is fragile. Credential path is legacy. |
| Google Sheets: Laundry List | Spreadsheet | `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI` | morning-audit | **Has access** (via same Google OAuth) | **CRITICAL: Column mapping conflict** between SKILL.md and DATA_SOURCES.md |
| Google Sheets: `sheets.json` credential | Credential | `/home/conscious-house/.credentials/sheets.json` | financial-entry | **Unknown** — separate from `google.json`, may or may not exist | financial-entry uses this; all other skills use `google.json` |
| Luma API (BLRxZo) | External API | `https://public-api.luma.com/v1/calendar/list-events` | daily-recap | **Has access** (via `$LUMA_API_KEY_BLRXZO`) | Must always pass `after` param. Rate limit handling incomplete. |
| Eezee PMS | External system | `zo.xyz/pm` or PMS URL (undocumented) | guest-flow, daily-recap (SOUL.md) | **No programmatic access** | No API endpoint, no credentials, no integration documented anywhere. All Eezee operations are manual. |
| PM Tool | External system | `zo.xyz/pm` | guest-flow | **No programmatic access** | Same — no API documented. |
| WhatsApp | Messaging platform | Property groups | guest-flow | **No programmatic access** | Bot sends via WhatsApp but no group management API. |
| Google Calendar (BLR) | Calendar | `zo-blr@zohouse.co` | google-workspace | **Has access** (via Google OAuth) | Not referenced by any operational skill; only in generic google-workspace. |
| `/home/conscious-house/bin/google-api` | CLI helper | Local binary | financial-entry | **Unknown** — may not exist on host | Not documented in DATA_SOURCES.md or TOOLS.md |
| Telegram Bot | Messaging | Bot token via `$TELEGRAM_BOT_TOKEN` | All skills (output delivery) | **Has access** (via OpenClaw gateway) | No issues. |

---

## Key Issues & Recommendations

Prioritized by operational impact:

### P0 — Critical (Blocks Core Functionality)

1. **Column mapping conflict in morning-audit vs DATA_SOURCES.md**
   - The morning-audit SKILL.md defines columns A-O in one order (A=Task, B=Request From, C=Added By, ..., H=Owner, I=Status). DATA_SOURCES.md defines them differently (A=Task, B=Status, C=Owner, ...). If the actual Google Sheet follows one schema and the skill follows the other, every read and write operation targets the wrong cell. This could corrupt data.
   - **Fix:** Read the actual sheet header row to determine ground truth. Update whichever document is wrong. All skills and docs must agree on one column order.

2. **No persistent storage for maintenance logs**
   - maintenance-triage generates detailed logs but has nowhere to store them. Logs vanish when the conversation context is pruned (OpenClaw cache-ttl: 1 hour).
   - **Fix:** Create a `maintenance_logs` Supabase table or a dedicated Google Sheet tab. Update maintenance-triage to write to it.

3. **Eezee PMS has zero programmatic integration**
   - SOUL.md describes 6 operational phases, many dependent on Eezee (check booking, verify payment, assign room, mark check-out). guest-flow references it extensively. But no API endpoint, credential, or integration method exists anywhere in the codebase.
   - **Fix:** Determine if Eezee has a REST API. If yes, document it. If no, explicitly mark all Eezee operations as "manual — Darshan executes, agent tracks status via Telegram confirmation."

### P1 — High (Degrades Reliability)

4. **Credential path inconsistency across skills**
   - daily-recap uses `/home/conscious-house/.credentials/google.json`. financial-entry uses `/home/conscious-house/.credentials/sheets.json`. google-workspace uses `zo-api/client_secret_...json`. DATA_SOURCES.md says actual location is `C:\Users\user\.credentials\`. At least 3-4 different credential references exist.
   - **Fix:** Standardize on environment variables (`$GOOGLE_CLIENT_ID`, `$GOOGLE_CLIENT_SECRET`, `$GOOGLE_REFRESH_TOKEN`) or one canonical path. Update all skills.

5. **Fragile row-number mapping in daily-recap P&L**
   - The Summary 2026 tab is read by hardcoded row numbers (Row 4 = Accommodation, Row 5 = Events, ..., Row 39 = EBITDA). A single row insertion by any human breaks every number.
   - **Fix:** Look up rows by matching the label text in Column B instead of by row index.

6. **Housekeeping Supabase tables unverified**
   - staff-report depends on three Supabase tables (`housekeeping_staff`, `housekeeping_sessions`, `daily_performance`) that may not have been created yet. The skill has no fallback if they don't exist.
   - **Fix:** Run a verification query against each table. If they don't exist, either create them or add a clear "tables not yet provisioned" fallback message.

7. **google-workspace is a generic copy-paste**
   - The skill is shared identically across all agents with no BLRxZo customization. It lists placeholder spreadsheet IDs ("Check workspace docs for ID") and uses 2024 example dates.
   - **Fix:** Rewrite with BLRxZo-specific sheet IDs, default calendar `zo-blr@zohouse.co`, and current-year examples.

### P2 — Medium (Missing Capabilities)

8. **6 of 7 cross-agent handoffs are not built**
   - Per HANDOFF_MAP.md, only the daily-data -> morning-briefing handoff partially works (and it is fragile, relying on both agents reading the same data sources independently). sale-to-ops, event-to-ops, guest check-in -> LOKI onboard, partnership-to-event, shift-handoff, and low-engagement -> alert are all missing.
   - **Fix:** Build receiver skills first: incoming-guest-brief, event-prep-checklist, shift-handoff. These are the captain-side skills that enable handoffs from Wanda, Suki, and to night staff.

9. **guest-flow conflicts with LOKI's community onboarding role**
   - guest-flow Step 6 does WhatsApp group add and intro message, which HANDOFF_MAP.md assigns to LOKI. This creates either duplication (both do it) or confusion (neither does it, each assuming the other will).
   - **Fix:** Remove community onboarding from guest-flow. Add a `sessions_spawn` call to LOKI at the end of check-in with the GUEST CHECKED IN payload.

10. **Cron schedule conflicts across documents**
    - HEARTBEAT.md: 8AM (daily-recap), 7PM (daily-recap). TRIGGERS.md: 8AM (daily-recap), 10:30AM (morning-audit). morning-audit SKILL.md: 10AM. Three documents, three different answers for the same skill.
    - **Fix:** Establish one canonical schedule. Recommended: 8AM daily-recap, 10AM morning-audit, 7PM daily-recap (EOD). Update HEARTBEAT.md, TRIGGERS.md, and SKILL.md to match.

### P3 — Low (Nice to Have)

11. **Property ID casing inconsistency**
    - daily-recap uses `property_id=eq.BLRxZo` while DATA_SOURCES.md shows `property_id=eq.blrxzo`. Query the database to confirm the stored value and standardize.

12. **Missing weekly and monthly report skills**
    - SOUL.md promises Weekly Revenue Summary (Sunday), Weekly Staff Performance, and Monthly P&L Summary. None exist as skills.

13. **No bill digitization or OCR capability**
    - SOUL.md lists "Bill digitization: Photo -> store for records" as a pain point (25 mins/day) to automate. No skill addresses this.

14. **financial-entry helper binary may not exist**
    - `/home/conscious-house/bin/google-api` is referenced but never documented. Replace with direct API calls.

---

*Audit conducted: 2026-02-12*
*Source files reviewed: SOUL.md, AGENTS.md, TOOLS.md, IDENTITY.md, HEARTBEAT.md, USER.md, 7 SKILL.md files, DATA_SOURCES.md, HANDOFF_MAP.md, TRIGGERS.md, SKILL_TASKS.md*
