# WTFxZo JR — House Captain (Whitefield)

> Digital operations captain for WTFxZo property. Manages financial tracking, daily reporting, staff oversight, guest flow, and maintenance triage alongside human partner Akhilesh -- with a heavy events-first orientation because 97% of revenue comes from events.

---

## Identity

| Field | Value |
|-------|-------|
| **Agent ID** | `wtfxzo-jr` |
| **Workspace** | `workspaces/captain-wtfxzo/` |
| **Human Partner** | Akhilesh (@bhangbuddy.x) |
| **Telegram ID** | `558199761` |
| **Role** | Property operations captain for WTFxZo (Whitefield). 97% of revenue is from events. |
| **Shift** | 08:00 AM -- 08:00 PM IST (12-hour digital shift) |
| **Emoji** | Target |
| **Model** | Claude Haiku 4.5 (via OpenClaw gateway) |
| **Heartbeat** | 8:00 AM IST (morning-audit), 7:00 PM IST (daily-recap) -- per HEARTBEAT.md |
| **Reports To** | Operations Manager (costs >5K), ZomadPrime (cross-property) |

### What Stays Human
- Physical property walkthroughs
- Guest welcome and relationship building
- Emergency response decisions
- Staff coaching and motivation
- Event host relationships

---

## Current Skills Inventory

### 1. daily-recap

| Field | Detail |
|-------|--------|
| **Type** | Report (automated + on-demand) |
| **Trigger** | "morning update", "daily recap", "daily status", "recap"; Heartbeat at 8AM IST; custom date ranges |
| **Recipients** | Akhilesh (558199761) AND Samurai (1275114944) -- both always |
| **Data Sources** | (1) Supabase `pms_bookings` (accommodation revenue, occupancy -- property_id=eq.WTFxZo); (2) Google Sheet `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY` tab `Summary 2026` (events, co-working, cafe, expenses, EBITDA); (3) Luma API for today's events |
| **Output** | Formatted Telegram message: MTD revenue breakdown, EBITDA, occupancy (X/20 beds), today's events, auto-flags, today's focus |
| **Quality Assessment** | **BROKEN -- Critical Luma API key error** |

#### Issues Found

**CRITICAL: Wrong Luma API key.** The daily-recap SKILL.md at line 148 uses:
```
curl -s -H "x-luma-api-key: $LUMA_API_KEY_BLRXZO"
```
This is the **Bangalore** Luma API key. WTFxZo (Whitefield) MUST use `$LUMA_API_KEY_SFOXZO`. This is explicitly documented in `docs/DATA_SOURCES.md`:
> "BLRxZo uses `$LUMA_API_KEY_BLRXZO`, WTFxZo uses `$LUMA_API_KEY_SFOXZO` -- DO NOT mix these"

This means **every daily-recap run is pulling Bangalore events instead of Whitefield events**, or getting an empty/wrong event list. Since WTFxZo derives 97% of revenue from events, this is a severe data integrity issue -- the most important section of the most important report is showing the wrong data.

**ISSUE: Location filter strings are wrong.** The skill filters events by matching `Whitefield`, `WTFxZo`, or `Zo House Whitefield`. Whitefield is a Bangalore neighborhood, not Whitefield. These filters appear to be copy-pasted from a template or confused with the BLR property. The BLRxZo daily-recap filters for `Koramangala`, `BLRxZo`, `Brigade Road`, `Indiranagar` -- these are all Bangalore locations. WTFxZo should filter for Whitefield-specific location strings- **Primary Whitefieldl**: Ensure **Zo House Whitefield** operates at 5-star standards.he Luma events use as their address).

**ISSUE: HEARTBEAT.md says 7PM for daily-recap, but SKILL.md says 8AM.** The HEARTBEAT.md specifies: "every day at 7:00 PM IST: Run daily-recap skill." But the SKILL.md trigger says "Heartbeat at 8AM IST daily." These contradict each other. The SOUL.md Phase 6 (EOD Wrap-Up) runs 06:30-08:00 PM, and USER.md says "7PM daily recap with event revenue summary." The correct heartbeat time should be 7PM for the EOD recap, with a separate 8AM trigger for the morning audit. The SKILL.md trigger line needs correction.

#### Fix Required

1. **Replace `$LUMA_API_KEY_BLRXZO` with `$LUMA_API_KEY_SFOXZO`** in the Luma API curl command (line 148 of daily-recap/SKILL.md). This is a one-line fix with maximum impact.
2. **Replace Whitefield-based location filters** with correct Whitefield location strings. Audit actual Luma event data to determine the exact address strings used for WTFxZo events.
3. **Align heartbeat timing** -- SKILL.md trigger should say "Heartbeat at 7PM IST daily (EOD recap)" to match HEARTBEAT.md and USER.md.

---

### 2. morning-audit

| Field | Detail |
|-------|--------|
| **Type** | Report + Action (read/write to shared task sheet) |
| **Trigger** | "task audit", "my tasks", "what do I need to do", "task status", "mark P{X} as done", "add task"; Heartbeat at 10AM IST |
| **Recipients** | Akhilesh (558199761) AND Samurai (1275114944) -- both always |
| **Data Sources** | Google Sheet `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI` tab `main list` (Laundry List -- shared task tracker) |
| **Output** | Formatted task audit: In Progress, Not Started, Postponed counts; property tasks; top 3 priorities; score. Also performs write operations (status updates, new tasks, notes). |
| **Quality Assessment** | **Strong** |

#### Issues Found

**MINOR: Column mapping diverges from DATA_SOURCES.md.** The Laundry List column structure in `docs/DATA_SOURCES.md` lists 15 columns (A=Task, B=Status, C=Owner, D=Property, E=Due Date...) but the morning-audit SKILL.md uses a different column mapping (A=Task, B=Request From, C=Added By, D=Nature, E=Track, F=Product Area, G=Priority, H=Owner, I=Status...). One of these is wrong, or the sheet was restructured after DATA_SOURCES.md was written. **The skill's column mapping should be verified against the actual sheet.** If the skill is correct (it appears more detailed and recently written), then DATA_SOURCES.md needs to be updated.

**MINOR: HEARTBEAT.md says 8AM for morning-audit, but SKILL.md and TRIGGERS.md both say 10AM/10:30AM.** The HEARTBEAT.md says "every day at 8:00 AM IST: Run morning-audit skill" but TRIGGERS.md says "10:30 AM IST daily" and the SKILL.md itself says "Heartbeat at 10AM IST daily." The actual 8AM slot in HEARTBEAT.md is inconsistent with the skill's own documentation.

#### Fix Required

1. Verify column mapping against actual Google Sheet and reconcile DATA_SOURCES.md vs. SKILL.md.
2. Align HEARTBEAT.md timing to 10:00 AM IST for morning-audit (matching SKILL.md and TRIGGERS.md).

---

### 3. financial-entry

| Field | Detail |
|-------|--------|
| **Type** | Action (write to Google Sheet) |
| **Trigger** | "log expense", "revenue entry", "capex", "opex", "procurement"; any mention of money at WTFxZo |
| **Data Sources** | Google Sheet via `/home/conscious-house/bin/google-api` helper with `/home/conscious-house/.credentials/sheets.json` key `wtfxzo_pnl`; Supabase (backup logging) |
| **Output** | Confirmation of logged entry; approval prompts for CapEx >=5K; event P&L gap alerts; weekly summary prompts |
| **Quality Assessment** | **Needs Work** |

#### Issues Found

**ISSUE: CapEx threshold alignment with maintenance-triage.** The financial-entry skill defines the OpEx/CapEx boundary as Rs 5,000 (OpEx < 5K, CapEx >= 5K). The maintenance-triage skill also references this threshold: "If maintenance cost will exceed Rs 5,000, trigger the financial-entry skill with CapEx classification." These ARE aligned, which is correct. However, SOUL.md says "Items <5,000 -> Opex sheet" and "Items >5,000 -> Capex sheet" which leaves exactly Rs 5,000 ambiguous (neither < nor >). The financial-entry skill treats 5,000 as CapEx (>= 5,000), which is the safer interpretation. **This is properly aligned but should be explicitly documented as >= 5,000 in SOUL.md.**

**ISSUE: Uses a custom helper binary that may not exist.** The skill references `/home/conscious-house/bin/google-api` as the API helper tool, plus `/home/conscious-house/.credentials/sheets.json` with a `wtfxzo_pnl` key. This is a different auth path than daily-recap (which uses `/home/conscious-house/.credentials/google.json` with raw OAuth refresh). If the `google-api` binary was never built or deployed, this skill silently fails. The skill does include a fallback ("ENTRY QUEUED -- Google Sheets unavailable. Will retry in 15 minutes") but the queuing mechanism itself is not defined.

**ISSUE: No actual Sheet ID in the skill.** The skill references a `--sheet-key wtfxzo_pnl` abstraction but never states the actual Sheet ID (`1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY`). If the `sheets.json` mapping is misconfigured, there is no fallback or self-correction.

**ISSUE: Writes to a "Transactions" tab.** The append command targets `Transactions!A:M` but daily-recap reads from `Summary 2026` and `WTFxZo_P&L` tabs. It is unclear whether "Transactions" is the same as "WTFxZo_P&L" or a separate tab. If these are different tabs, financial entries may not surface in the daily recap.

#### Fix Required

1. Verify that `/home/conscious-house/bin/google-api` binary exists and is functional.
2. Verify `sheets.json` contains the `wtfxzo_pnl` key mapped to Sheet ID `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY`.
3. Confirm "Transactions" tab name matches what daily-recap reads. If they are different, ensure data flows correctly.
4. Add the explicit Sheet ID as a fallback reference in the skill.

---

### 4. guest-flow

| Field | Detail |
|-------|--------|
| **Type** | Workflow (multi-step check-in / check-out) |
| **Trigger** | "guest checking in", "check-out", "new arrival", "room assignment"; guest name + arrival/departure context |
| **Data Sources** | Eezee PMS (bookings, payments, room assignment); PM Tool (zo.xyz/pm -- document collection); Master Workbook (financial logging); WhatsApp (community group) |
| **Output** | Structured check-in/check-out completion message with room, payment, event association |
| **Quality Assessment** | **Needs Work** |

#### Issues Found

**ISSUE: Eezee PMS integration is undefined.** The skill references "Pull reservation from Eezee PMS" and "Mark check-out in Eezee PMS" but provides no API endpoint, credentials, or integration method. There are no Eezee-related entries in DATA_SOURCES.md. This skill is procedural documentation (a runbook for the agent to follow) rather than an executable integration. The agent would need to be told what Eezee is and how to access it, or Akhilesh handles Eezee manually while the agent tracks the workflow.

**ISSUE: PM Tool integration is undefined.** Same as above -- "Log document collection in PM Tool (zo.xyz/pm)" has no API or auth details.

**ISSUE: No handoff to LOKI after check-in.** Per HANDOFF_MAP.md, check-in completion should trigger a handoff to LOKI for community onboarding (welcome message, WhatsApp group, community intro). The guest-flow skill does Step 6 (WhatsApp Group) internally but does not send the structured `GUEST CHECKED IN` handoff payload to LOKI. This means LOKI never knows about new guests.

**POSITIVE: Event association check is well-designed.** The skill explicitly checks for event-linked guests throughout the flow (VIP event clients, speakers, event attendees), which is appropriate for WTFxZo's event-heavy model.

#### Fix Required

1. Define Eezee PMS API integration or explicitly mark those steps as "Akhilesh handles manually."
2. Define PM Tool API integration or mark as manual.
3. Add LOKI handoff step after check-in completion (use `sessions_spawn` or structured message format from HANDOFF_MAP.md).

---

### 5. maintenance-triage

| Field | Detail |
|-------|--------|
| **Type** | Workflow (decision tree) |
| **Trigger** | "something's broken", "maintenance issue", "repair needed", "not working"; facility problem reports; event setup failures |
| **Data Sources** | PM Tool (issue logging); event calendar (for event-impact assessment); approved vendor list (undefined) |
| **Output** | Triage classification (Level 1-4), assignment, cost estimate, structured issue log |
| **Quality Assessment** | **Strong** |

#### Issues Found

**POSITIVE: Event-specific triage rules are excellent.** The WTFxZo-specific additions (pre-event escalation, AV/Sound/Lighting auto-escalation, power during event = Level 1) are well-tailored to the 97% events revenue model.

**POSITIVE: CapEx threshold aligned.** Costs exceeding Rs 5,000 correctly trigger financial-entry with CapEx classification.

**ISSUE: Approved vendor list is referenced but not defined.** "Pull from the approved vendor list first" -- but no such list exists in the workspace or is referenced in DATA_SOURCES.md. This is a gap that Akhilesh would need to populate.

**ISSUE: PM Tool logging has no API.** Same as guest-flow -- procedural but not executable.

**MINOR: No Supabase logging.** Maintenance issues are logged to PM Tool only, not to Supabase. This means ZomadPrime's morning-briefing cannot aggregate maintenance data across properties.

#### Fix Required

1. Create or locate the approved vendor list and add it to the workspace.
2. Consider adding Supabase logging for cross-property maintenance visibility.

---

### 6. staff-report

| Field | Detail |
|-------|--------|
| **Type** | Report (on-demand) |
| **Trigger** | "housekeeping report", "staff performance", "task completion"; event teardown/setup check |
| **Data Sources** | Supabase: `housekeeping_staff` (roster), `housekeeping_sessions` (task sessions), `daily_performance` (aggregated metrics) -- all filtered by `property = 'wtfxzo'` |
| **Output** | Shift summary table, zone breakdown, event zone report, alerts, top performer / needs attention |
| **Quality Assessment** | **Weak -- depends on data pipeline that may not exist** |

#### Issues Found

**ISSUE: Supabase tables may not be populated.** The skill reads from `housekeeping_staff`, `housekeeping_sessions`, and `daily_performance`. These tables are documented in DATA_SOURCES.md as owned by "Captains (auto-logged)" and "System (aggregated daily)." However, there is no WhatsApp Bot integration or data ingestion pipeline defined anywhere in the workspace. The skill says "Data comes from the housekeeping WhatsApp Bot and is stored in Supabase" but no sync mechanism or bot integration is documented. If the WhatsApp Bot is not writing to Supabase, this skill returns empty data.

**ISSUE: No credentials specified.** Unlike daily-recap which specifies the exact credential path, staff-report has no curl commands or auth references. The agent would need to infer the Supabase connection from other skills.

**ISSUE: No cron schedule.** TRIGGERS.md lists "staff report" as an on-demand trigger only (no automatic schedule). But SOUL.md Phase 5 (04:30-06:30 PM) implies a daily quality audit. If this is meant to be daily, it should be on a cron or heartbeat.

#### Fix Required

1. Verify that the WhatsApp Bot -> Supabase data pipeline exists and is writing to the three required tables.
2. Add explicit Supabase credential paths and curl examples (matching daily-recap's pattern).
3. Consider adding a 5PM IST heartbeat trigger for automated daily staff reporting.

---

### 7. google-workspace

| Field | Detail |
|-------|--------|
| **Type** | Utility (shared integration layer) |
| **Trigger** | Calendar, Drive, Sheets, Docs, Gmail operations |
| **Data Sources** | Google APIs (Calendar v3, Drive v3, Sheets v4, Docs v1, Gmail v1) |
| **Output** | API responses from Google services |
| **Quality Assessment** | **Needs Work -- generic copy-paste, not WTFxZo-specific** |

#### Issues Found

**CRITICAL: This is a generic template, not WTFxZo-configured.** The skill contains no WTFxZo-specific sheet IDs, no property-specific calendar IDs, and no pre-configured resource references. The "Key Spreadsheets" section says:
```
- Guest Tracker (WTF): Check workspace docs for ID
- Revenue Dashboard: Check workspace docs for ID
- Event Pipeline: Check workspace docs for ID
```
These are placeholder instructions, not actual IDs. In contrast, daily-recap and morning-audit have their sheet IDs hardcoded. This skill serves as a generic API reference document rather than a functional WTFxZo integration.

**ISSUE: Auth path differs from other skills.** Uses `zo-api/client_secret_...json` and `zo-api/token.json` whereas daily-recap and morning-audit use `/home/conscious-house/.credentials/google.json`. These may be the same credentials at different paths, or they may be different credentials entirely.

**ISSUE: Calendar IDs are listed but not mapped.** The skill lists `zo-wtf@zohouse.co` as the WTF property calendar but no skill actually uses it for WTFxZo calendar operations.

#### Fix Required

1. Populate all WTFxZo-specific resource IDs (P&L Sheet: `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY`, Laundry List: `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI`, Calendar: `zo-wtf@zohouse.co`).
2. Align auth path with the pattern used by daily-recap and morning-audit.
3. Remove or adapt generic examples to WTFxZo context.

---

## Missing Skills (Not Yet Built)

These skills are referenced in TRIGGERS.md, HANDOFF_MAP.md, and/or SOUL.md but do **not** exist in `workspaces/captain-wtfxzo/skills/`:

| # | Skill Name | Referenced In | Purpose | Priority |
|---|-----------|---------------|---------|----------|
| 1 | **shift-handoff** | TRIGGERS.md, HANDOFF_MAP.md (Flow 7), SOUL.md Phase 6 | Structured handoff to night staff at 8PM: open issues, tonight's check-ins, tomorrow's prep, night staff roster | **HIGH** -- no night continuity without this |
| 2 | **task-manager** | TRIGGERS.md ("mark P{X} as done") | Dedicated task CRUD on shared board | **LOW** -- morning-audit already implements this functionality (read + write + status updates) |
| 3 | **incoming-guest-brief** | HANDOFF_MAP.md (Flow 1), TRIGGERS.md | Receives structured booking data from Wanda after sale closes; prepares room, staff, check-in | **MEDIUM** -- depends on Wanda's sale-to-ops which is also not built |
| 4 | **event-prep-checklist** | HANDOFF_MAP.md (Flow 2), TRIGGERS.md | Receives event confirmation from Suki; generates setup requirements (AV, catering, furniture, staffing) | **HIGH** -- critical for an events-first property |
| 5 | **guest check-in -> LOKI handoff** | HANDOFF_MAP.md (Flow 3) | Sends structured guest data to LOKI after check-in for community onboarding | **MEDIUM** -- LOKI integration |

**Note:** task-manager functionality is effectively built into morning-audit. The triggers reference in TRIGGERS.md ("mark P{X} as done") maps directly to morning-audit's write operations. These could remain merged or be separated for clarity.

---

## Handoff Connections

### Receives From

| Source Agent | Handoff | Data Received | Status |
|-------------|---------|---------------|--------|
| **Wanda** | sale-to-ops -> incoming-guest-brief | Guest name, dates, room preference, payment status, source, Founder Member status | **NOT BUILT** (neither Wanda's skill nor receiving skill exist) |
| **Suki** | event-to-ops -> event-prep-checklist | Event name, date/time, headcount, venue, AV/catering/furniture/staff requirements, host contact | **NOT BUILT** (neither Suki's skill nor receiving skill exist) |
| **ZomadPrime** | delegate-task | Ad-hoc task assignments from Samurai via ZomadPrime | **PARTIALLY WORKS** (via Telegram routing, but no structured intake) |

### Sends To

| Target Agent | Handoff | Data Sent | Status |
|-------------|---------|-----------|--------|
| **ZomadPrime** | daily-recap data -> morning-briefing | Financial data, occupancy, events written to Sheets + Supabase; ZomadPrime reads these at 10AM | **PARTIALLY WORKS** (data sources exist but daily-recap has wrong Luma key, so event data is wrong) |
| **LOKI** | guest check-in -> new-guest-onboard | Guest name, room, dates, interests, Founder status, first-timer flag | **NOT BUILT** |
| **Night Staff** | shift-handoff | Open issues, tonight's check-ins, tomorrow's events, night staff roster | **NOT BUILT** |

### Missing Handoff Connections

| # | Handoff | Impact |
|---|---------|--------|
| 1 | Suki -> WTFxZo JR (event prep) | Captain has no automated event prep notification. Must check manually or rely on Akhilesh hearing about events through other channels. Critical gap for 97%-events property. |
| 2 | WTFxZo JR -> LOKI (post check-in) | Community manager never knows when guests arrive. No automated welcome or onboarding. |
| 3 | WTFxZo JR -> Night Staff (shift handoff) | Night team has no structured briefing. Relies on verbal handoff from Akhilesh. |
| 4 | Wanda -> WTFxZo JR (new booking) | Captain learns about bookings by checking Eezee PMS, not proactively notified. |

---

## Data Access Summary

| Data Source | Type | Identifier | Access Method | Used By Skills | Read/Write | Status |
|-------------|------|-----------|---------------|---------------|------------|--------|
| WTFxZo P&L Sheet | Google Sheet | `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY` | OAuth 2.0 via google.json | daily-recap (R), financial-entry (W) | R+W | Working (verified in daily-recap) |
| Laundry List | Google Sheet | `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI` | OAuth 2.0 via google.json | morning-audit (R+W) | R+W | Working (verified in morning-audit) |
| pms_bookings | Supabase table | `property_id=eq.WTFxZo` | REST API via service_role_key | daily-recap (R) | R | Working |
| housekeeping_staff | Supabase table | `property='wtfxzo'` | REST API via service_role_key | staff-report (R) | R | **Unknown -- data pipeline unverified** |
| housekeeping_sessions | Supabase table | `property='wtfxzo'` | REST API via service_role_key | staff-report (R) | R | **Unknown -- data pipeline unverified** |
| daily_performance | Supabase table | `property='wtfxzo'` | REST API via service_role_key | staff-report (R) | R | **Unknown -- data pipeline unverified** |
| canonical_events | Supabase table | WTFxZo events | REST API | (not directly used -- Luma API used instead) | R | Available but unused |
| Luma API (Whitefield) | External API | `$LUMA_API_KEY_SFOXZO` | REST via x-luma-api-key header | daily-recap | R | **BROKEN -- wrong key in skill ($LUMA_API_KEY_BLRXZO used instead)** |
| Eezee PMS | External system | Unknown | Unknown (no API documented) | guest-flow (R+W) | R+W | **No integration -- manual only** |
| PM Tool | External system | zo.xyz/pm | Unknown (no API documented) | guest-flow (R+W), maintenance-triage (W) | R+W | **No integration -- manual only** |
| WTFxZo Calendar | Google Calendar | `zo-wtf@zohouse.co` | Calendar API v3 | google-workspace (listed, not used) | R+W | **Configured but unused by any skill** |
| Approved Vendor List | Unknown | Not defined | Not defined | maintenance-triage (R) | R | **Does not exist** |

---

## Key Issues & Recommendations

### CRITICAL (Fix Immediately)

**1. Wrong Luma API key in daily-recap**
- **File:** `workspaces/captain-wtfxzo/skills/daily-recap/SKILL.md`, line 148
- **Problem:** Uses `$LUMA_API_KEY_BLRXZO` (Bangalore) instead of `$LUMA_API_KEY_SFOXZO` (Whitefield)
- **Impact:** The events section of every daily recap is pulling Bangalore events or returning wrong data. For a property where 97% of revenue is events, this corrupts the most critical section of the most important daily report. Both Akhilesh and Samurai receive incorrect event information every morning.
- **Fix:** Replace `$LUMA_API_KEY_BLRXZO` with `$LUMA_API_KEY_SFOXZO`. One line change, maximum impact.

**2. Wrong location filter strings in daily-recap**
- **File:** `workspaces/captain-wtfxzo/skills/daily-recap/SKILL.md`, lines 155-157
- **Problem:** Filters for `Whitefield`, `Zo House Whitefield` -- these are Bangalore locations, not Whitefield. This was copy-pasted from a BLRxZo template and not updated.
- **Impact:** Even if the API key were correct, the location filter would miss Whitefield events or match nothing.
- **Fix:** Replace with Whitefield-specific strings (e.g., `Whitefield`, `WTFxZo`, `Zo House Whitefield`). Audit actual Luma event addresses to confirm correct filter values.

### HIGH (Fix This Week)

**3. No event-prep-checklist skill**
- **Problem:** WTFxZo generates 97% revenue from events, but there is no skill to receive event prep requirements from Suki. The Suki -> Captain handoff (HANDOFF_MAP.md Flow 2) is entirely missing.
- **Impact:** Event setup coordination is entirely verbal/manual. No automated prep checklists, no AV/catering/staffing requirement tracking, no advance notification system.
- **Fix:** Build `event-prep-checklist` skill that accepts structured event data (from Suki or manual input) and generates a setup checklist with assignments and timelines.

**4. No shift-handoff skill**
- **Problem:** SOUL.md Phase 6, TRIGGERS.md, and HANDOFF_MAP.md Flow 7 all reference a shift-handoff that does not exist.
- **Impact:** Night staff has no structured briefing. Open maintenance issues, overnight check-ins, and security notes are not formally transferred.
- **Fix:** Build `shift-handoff` skill using the template from HANDOFF_MAP.md Flow 7.

**5. HEARTBEAT.md timing inconsistencies**
- **Problem:** HEARTBEAT.md says 8AM=morning-audit, 7PM=daily-recap. But morning-audit SKILL.md says 10AM, and daily-recap SKILL.md says 8AM. TRIGGERS.md says morning-audit at 10:30AM and daily-recap at 8AM.
- **Impact:** The agent may run the wrong skill at the wrong time, or skip runs entirely due to confusion.
- **Fix:** Reconcile all timing references. Recommended schedule:
  - 8:00 AM IST: daily-recap (morning property status)
  - 10:00 AM IST: morning-audit (task board review)
  - 5:00 PM IST: staff-report (housekeeping audit)
  - 7:00 PM IST: shift-handoff (EOD handover)

### MEDIUM (Fix This Sprint)

**6. google-workspace is a generic template**
- **Problem:** Contains no WTFxZo-specific IDs, no pre-configured resources, placeholder "check workspace docs" instructions.
- **Impact:** Any skill that delegates to google-workspace for Sheet/Calendar/Drive operations cannot rely on it for WTFxZo-specific resources.
- **Fix:** Populate with all WTFxZo resource IDs and align auth credentials with the pattern used by working skills.

**7. Staff-report data pipeline is unverified**
- **Problem:** Reads from three Supabase tables (housekeeping_staff, housekeeping_sessions, daily_performance) that depend on a WhatsApp Bot data ingestion pipeline. No pipeline documentation exists.
- **Impact:** Skill may return empty results. Akhilesh would get "DATA UNAVAILABLE" every time.
- **Fix:** Verify the WhatsApp Bot -> Supabase pipeline exists and is populating WTFxZo data. Add credential paths and curl examples to the skill.

**8. No LOKI handoff after guest check-in**
- **Problem:** guest-flow handles WhatsApp group addition internally but does not send structured data to LOKI for community onboarding.
- **Impact:** Community manager is not notified of new guests. No personalized welcome, no event schedule sharing, no Founder Member VIP treatment from the community side.
- **Fix:** Add a Step 7 to guest-flow that sends the `GUEST CHECKED IN` payload to LOKI via sessions_spawn.

### LOW (Backlog)

**9. Eezee PMS and PM Tool have no API integration**
- **Problem:** guest-flow and maintenance-triage reference these systems procedurally but have no executable API calls.
- **Impact:** These skills serve as runbooks, not automations. The agent follows the steps but Akhilesh must interact with these systems manually.
- **Fix:** Research Eezee PMS API availability. If API exists, integrate. If not, document explicitly as manual steps.

**10. financial-entry tab name "Transactions" is unverified**
- **Problem:** Writes to a `Transactions!A:M` range, but daily-recap reads from `Summary 2026` and `WTFxZo_P&L`. If "Transactions" is not feeding into the summary tab, financial entries may not appear in daily recaps.
- **Fix:** Verify the Sheet tab structure and confirm data flow between Transactions -> Summary 2026.

**11. Approved vendor list does not exist**
- **Problem:** maintenance-triage references "approved vendor list" but no such document exists in the workspace.
- **Fix:** Create `workspaces/captain-wtfxzo/vendors.md` or add to TOOLS.md with vendor names, contacts, specialties, and response times.

---

## Skill Dependency Map

```
HEARTBEAT (8AM)
    |
    v
daily-recap -----> [Supabase: pms_bookings]
    |               [Google Sheet: P&L Summary 2026]
    |               [Luma API: BROKEN - wrong key]
    |
    +-----> Telegram -> Akhilesh (558199761)
    +-----> Telegram -> Samurai (1275114944)

HEARTBEAT (10AM)
    |
    v
morning-audit ---> [Google Sheet: Laundry List]
    |
    +-----> Telegram -> Akhilesh (558199761)
    +-----> Telegram -> Samurai (1275114944)

Akhilesh says "log expense"
    |
    v
financial-entry -> [Google Sheet: P&L "Transactions" tab]
    |               [via google-api helper binary]
    |
    +-----> Rs >=5K? -> "PENDING APPROVAL" -> Akhilesh confirms -> write

Akhilesh says "guest checking in"
    |
    v
guest-flow ------> [Eezee PMS: MANUAL]
    |               [PM Tool: MANUAL]
    |               [WhatsApp: group add]
    |
    +-----> (MISSING) LOKI handoff

Akhilesh says "maintenance issue"
    |
    v
maintenance-triage -> [PM Tool: MANUAL]
    |                   [Event calendar check]
    |
    +-----> Rs >5K? -> financial-entry (CapEx)
    +-----> Level 1? -> Immediate alert -> Akhilesh

Akhilesh says "staff report"
    |
    v
staff-report ----> [Supabase: housekeeping_*]
                    [DATA PIPELINE UNVERIFIED]
```

---

## Summary Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Skills Built** | 7/11 | 7 skills exist, 4 are missing (shift-handoff, incoming-guest-brief, event-prep-checklist, LOKI handoff) |
| **Skills Functional** | 4/7 | daily-recap is broken (wrong API key + wrong filters), google-workspace is generic, staff-report is unverifiable |
| **Data Integrations** | 3/7 | Supabase + Google Sheets + Telegram work. Luma is misconfigured. Eezee PMS, PM Tool, and vendor list are not integrated. |
| **Handoff Connections** | 1/5 | Only daily data -> ZomadPrime partially works. All other handoffs (Suki, Wanda, LOKI, Night Staff) are not built. |
| **Event Operations Readiness** | Low | For a 97%-events property, the critical event-related capabilities are broken (wrong Luma key, wrong location filters) or missing (event-prep-checklist, event zone coordination). |

**Bottom line:** WTFxZo JR has solid foundational skills (morning-audit, maintenance-triage, financial-entry) but its most critical capability -- event-aware daily operations -- is compromised by a copy-paste error from BLRxZo that put the wrong Luma API key and wrong location filters in the daily-recap skill. Fixing the Luma key and location filters is a 5-minute change that immediately restores the most valuable report. Building the event-prep-checklist and shift-handoff skills should be the next priority to match this agent's operational scope to WTFxZo's event-driven revenue model.