# ZomadPrime -- Director / Strategic Orchestrator

> Cross-property oversight agent that compiles operational intelligence from all Zo House agents and data sources, delivers executive briefings to Samurai, delegates tasks to sub-agents, and tracks performance across the entire agent hierarchy.

---

## Identity
- **Agent ID:** main
- **Workspace:** workspaces/director/
- **Human Partner:** Samurai (Strategic Director)
- **Telegram ID:** 1275114944
- **Role:** Director / Orchestrator -- multi-property oversight, cross-agent coordination

---

## Current Skills Inventory

### morning-briefing
- **Type:** Report
- **Trigger:** Cron at 10:00 AM IST daily; human says "morning briefing", "daily status", "what's happening today", "daily update"
- **Data Sources:**
  - Google Sheets -- BLRxZo P&L (`1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y`, tab `BLRxZo_P&L` and `Summary 2026`) via `google-api` tool -- occupancy and revenue
  - Google Sheets -- WTFxZo P&L (`1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY`, tab `WTFxZo_P&L` and `Summary 2026`) via `google-api` tool -- occupancy and revenue
  - Luma API (`https://public-api.luma.com/v1/calendar/list-events`) using `$LUMA_API_KEY_BLRXZO` -- today's events
  - Local file: `/home/conscious-house/workspaces/director/memory/BLOCKERS_ACTIVE.md` -- unresolved blockers
  - Agent workspace timestamps at `/home/conscious-house/workspaces/{bd,sales,events,vibe-curator,captain-blrxzo,captain-wtfxzo}/` -- last activity per agent
- **Output:** Formatted Telegram message to Samurai (chat ID `1275114944`) covering: property financials, today's events, active blockers, agent status, and items requiring Samurai's decision. Logged to workspace with timestamp.
- **Quality Assessment:** Needs Work
- **Issues Found:**
  1. **Wrong file paths.** The skill references `/home/conscious-house/workspaces/...` paths throughout (blocker file, agent workspaces). The actual monorepo is at `/Users/samuraizan/Sentient House/sentienthouse-monorepo/workspaces/...`. These legacy Linux paths will fail on the current macOS environment.
  2. **Vague sheet references.** The skill says "read the `blrxzo_pnl` sheet" and "read the `wtfxzo_pnl` sheet" without specifying the actual Sheet IDs, tab names, or cell ranges. DATA_SOURCES.md defines these precisely (Sheet ID `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y`, tab `BLRxZo_P&L`) but the skill does not reference them.
  3. **Only BLRxZo Luma key mentioned.** The skill says "BLRxZo Luma API key: `$LUMA_API_KEY_BLRXZO`" for events but never mentions `$LUMA_API_KEY_SFOXZO` for WTFxZo events. A cross-property briefing should pull events from both calendars.
  4. **No Supabase integration.** The skill does not query `pms_bookings` for occupancy or `canonical_events` for event data, despite these being the canonical sources per DATA_SOURCES.md. It relies solely on Google Sheets, which may be stale.
  5. **No credential path for Google auth.** The skill says "use `google-api` tool" without specifying the OAuth flow or credential location. The google-workspace skill defines credentials at `zo-api/client_secret_...json` and `zo-api/token.json`, but morning-briefing does not reference this.
  6. **BLOCKERS_ACTIVE.md does not exist.** No mechanism creates or maintains this file. The skill will always report "All clear" or error out.
  7. **Agent activity check is naive.** Checking file modification timestamps in workspace directories is unreliable. No integration with OpenClaw gateway's presence/status endpoints (`openclaw gateway call presence`, `openclaw gateway call agents`).
- **Fix Required:**
  - Replace all `/home/conscious-house/` paths with correct monorepo-relative paths or environment-variable-based paths.
  - Add explicit Sheet IDs, tab names, and cell ranges per DATA_SOURCES.md.
  - Add WTFxZo Luma API key (`$LUMA_API_KEY_SFOXZO`) and query both event calendars.
  - Add Supabase queries for `pms_bookings` (occupancy) and `canonical_events` (events) as primary sources, with Sheets as fallback.
  - Reference google-workspace skill for authentication or inline the OAuth token flow.
  - Define how BLOCKERS_ACTIVE.md gets created and maintained (likely by task-manager or manually).
  - Use OpenClaw gateway API for agent health instead of filesystem timestamps.

---

### weekly-scorecard
- **Type:** Report
- **Trigger:** Cron at 10:00 AM IST on Mondays; human says "weekly scores", "performance", "scorecard", "how did everyone do", "weekly review"
- **Data Sources:**
  - Agent workspace files at `/home/conscious-house/workspaces/{agent}/memory/` -- activity logs, file modification timestamps
  - `BLOCKERS_ACTIVE.md` and `BLOCKERS_RESOLVED.md` -- blocker history for the week
  - Google Sheets -- `blrxzo_pnl` and `wtfxzo_pnl` (same vague references as morning-briefing, no Sheet IDs specified in skill)
  - Luma API -- event attendance vs. expected
  - Qualitative signals from human feedback during the week
- **Output:** Formatted Telegram message to Samurai (chat ID `1275114944`) with a 6-row scoring table (Yana, Wanda, Suki, LOKI, BLRxZo JR, WTFxZo JR) across 4 dimensions (Speed, Quality, Impact, Blocker-Free) each scored 1-10. Includes top performer, needs-attention flag, key wins, and next-week priorities. Logged to `/home/conscious-house/workspaces/director/memory/scorecards/`.
- **Quality Assessment:** Weak
- **Issues Found:**
  1. **Same broken file paths as morning-briefing.** All workspace paths use `/home/conscious-house/` which does not exist on the current system.
  2. **Scorecard logging path does not exist.** The skill specifies saving historical scorecards to `memory/scorecards/` but this directory has never been created and no initialization is documented.
  3. **Vague sheet references.** References "blrxzo_pnl sheet" and "wtfxzo_pnl sheet" without Sheet IDs or tab names. Same problem as morning-briefing.
  4. **No concrete data collection method.** The skill lists 6 categories of data to review ("agent workspace activity", "session history", "blocker history", "property data", "event outcomes", "qualitative signals") but provides no API calls, Sheet queries, or file read commands. It is entirely a conceptual rubric with no implementation scaffolding.
  5. **Blocker files (BLOCKERS_ACTIVE.md, BLOCKERS_RESOLVED.md) do not exist.** No skill creates or maintains these files, making the blocker-tracking dimension unscorable by data.
  6. **Session history inaccessible.** The skill says "review spawned sessions and their outcomes" but provides no method to query OpenClaw session history. The gateway CLI commands in DATA_SOURCES.md (`openclaw gateway call status`) could help, but are not referenced.
  7. **Scoring will be largely fabricated.** Without concrete data pipelines, the agent must guess or hallucinate scores. The "score 5 and note insufficient data" fallback will likely fire for most dimensions.
  8. **No trend tracking implemented.** The skill mentions "use past scorecards to track trends" and "escalate if declining 3+ weeks" but provides no mechanism for reading historical scorecards or comparing them.
- **Fix Required:**
  - Add concrete data collection steps: specific Supabase queries for occupancy/revenue, Luma API calls for event metrics, Google Sheets reads with explicit IDs.
  - Integrate with OpenClaw gateway for session history and agent activity data.
  - Create and maintain BLOCKERS_ACTIVE.md and BLOCKERS_RESOLVED.md via task-manager or a dedicated blocker-tracking mechanism.
  - Build the `memory/scorecards/` directory and define the file format for historical tracking.
  - Add a trend comparison step that reads past scorecard files and computes deltas.
  - Fix all file paths to match the actual deployment environment.

---

### delegate-task
- **Type:** Handoff / Action
- **Trigger:** Human says "assign to", "delegate", "have X do this", "tell X to", "get X on this"; or agent self-determines a task belongs to a sub-agent's domain
- **Data Sources:** None directly. Uses the current conversation context to build the delegation payload.
- **Output:** Spawns a sub-agent session via `sessions_spawn` with full context (task description, relevant data, deadline, requester, constraints). Reports back to Samurai with confirmation of which agent was assigned and what context was passed.
- **Quality Assessment:** Strong
- **Issues Found:**
  1. **Depends on `sessions_spawn` tool existing.** The skill assumes the OpenClaw gateway exposes a `sessions_spawn` tool for spawning sub-agent sessions. This is an infrastructure dependency that is not validated in the skill itself.
  2. **No logging destination specified.** The skill says "always log the delegation" but does not specify where (a file path, a Supabase table, or a Sheet).
  3. **No follow-up mechanism.** Once a task is delegated, there is no way to check if the sub-agent completed it. No callback, no polling, no status check.
  4. **Example section is truncated.** The SKILL.md file ends mid-section at "## Example" with no actual example provided.
- **Fix Required:**
  - Add a delegation log file path (e.g., `memory/delegations.json`) with structured entries.
  - Add a follow-up mechanism: either a heartbeat check that polls sub-agent status, or a callback pattern where the sub-agent reports completion.
  - Complete the truncated example section.
  - Add error handling for when `sessions_spawn` fails (agent not found, gateway down).

---

### task-manager
- **Type:** Action / Sync
- **Trigger:** "mark P{X} as done", "start P{X}", "add task", "my tasks", "task status", "what needs to be done", "update P{X}", "postpone P{X}", "cancel P{X}", any reference to task priorities
- **Data Sources:**
  - Google Sheets -- Laundry List (Sheet ID: `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI`, tab: `main list`, range: `A1:O100`)
  - Credentials: `/home/conscious-house/.credentials/google.json` for OAuth token generation
- **Output:** Reads/writes task data in the Google Sheet. For reads: displays task list with status. For writes: updates status (col I), last-checked (col L), effort notes (col M), or appends new rows. Always confirms to user what changed.
- **Quality Assessment:** Needs Work
- **Issues Found:**
  1. **Wrong credential path.** References `/home/conscious-house/.credentials/google.json` -- the legacy Linux path. DATA_SOURCES.md says credentials are at `C:\Users\user\.openclaw\` (Windows) or referenced via the google-workspace skill's `zo-api/client_secret_...json` path. The actual macOS path is undefined.
  2. **Column mapping mismatch with DATA_SOURCES.md.** The task-manager SKILL.md defines 15 columns (A=Task, B=Request From, C=Added By, D=Nature, E=Track, F=Product Area, G=Priority Order, H=Owner, I=Status, J=Metric, K=Date Added, L=Last checked, M=Effort, N=Links, O=Comments). DATA_SOURCES.md defines a different 15-column structure (A=Task, B=Status, C=Owner, D=Property, E=Due Date, F=Created, G=Priority, H=Category, I=Assigned By, J=Blocker, K=Last Checked, L=Agent, M=Human, N=Notes, O=Comments). **These are completely different schemas.** One of them is wrong -- the Sheet can only have one structure.
  3. **Hardcoded read range of A1:O100.** If the task list exceeds 100 rows, tasks will be silently missed. Should dynamically detect the last row.
  4. **No error handling for OAuth token refresh failure.** The inline `curl` command to get the OAuth token does not handle cases where the refresh token has been revoked or the credentials file is missing.
  5. **No property filtering.** ZomadPrime oversees all properties, but the skill does not support filtering tasks by property (BLRxZo vs WTFxZo vs All).
- **Fix Required:**
  - Reconcile the column mapping with the actual Google Sheet structure. Read the sheet headers at runtime to determine the real schema, or audit the sheet and update exactly one of the two documents.
  - Fix credential path to match the actual deployment environment.
  - Replace hardcoded `A1:O100` range with dynamic range detection (read column A to find last row, or use `A:O` unbounded range).
  - Add OAuth error handling per DATA_SOURCES.md error handling rules (403 = "Sheets auth expired", 429 = wait and retry).
  - Add property filter support for ZomadPrime's cross-property view.

---

### skill-sync
- **Type:** Action
- **Trigger:** "teach {agent} the same skill", "give {agent} the {skill-name} skill", "copy {skill-name} from {source} to {target}", "sync skills between {agent} and {agent}"
- **Data Sources:**
  - Source agent workspace: `/home/conscious-house/workspaces/{source-workspace}/skills/{skill-name}/SKILL.md`
  - Target agent workspace: `/home/conscious-house/workspaces/{target-workspace}/skills/{skill-name}/SKILL.md`
- **Output:** Reads source SKILL.md, adapts it for the target agent's context (name, human partner, property, API keys, Telegram IDs, escalation paths), writes adapted SKILL.md to target workspace, confirms to Samurai.
- **Quality Assessment:** Needs Work
- **Issues Found:**
  1. **All workspace paths are wrong.** Uses `/home/conscious-house/workspaces/` throughout. Must be updated to the actual monorepo path.
  2. **`chown` command will fail.** The skill runs `chown -R conscious-house:conscious-house ...` which assumes a Linux user that does not exist on the current macOS system. File ownership is not a concern in the current deployment model.
  3. **No validation of target skill functionality.** After writing the adapted skill, there is no test or validation step to ensure the target agent can actually use it (e.g., that referenced API keys exist, that credential paths are valid for the target).
  4. **Agent workspace map may be outdated.** The hardcoded workspace paths in the skill (`/home/conscious-house/workspaces/bd`, etc.) should be derived from a central config rather than duplicated.
- **Fix Required:**
  - Update all paths to the actual monorepo location.
  - Remove the `chown` command or replace with a no-op on macOS.
  - Add a post-sync validation step: check that referenced env vars, credential files, and API keys exist for the target agent.
  - Consider reading the workspace map from a central config file rather than hardcoding it.

---

### google-workspace
- **Type:** Utility (foundational tool used by other skills)
- **Trigger:** "add to calendar", "schedule", "create event", "check calendar", "upload to drive", "update sheet", "read spreadsheet", "send email", "check email", "draft email", and variations
- **Data Sources:**
  - Google Calendar API v3 (`https://www.googleapis.com/calendar/v3`)
  - Google Drive API v3 (`https://www.googleapis.com/drive/v3`)
  - Google Sheets API v4 (`https://sheets.googleapis.com/v4/spreadsheets`)
  - Google Docs API v1 (`https://docs.googleapis.com/v1/documents`)
  - Gmail API v1 (`https://gmail.googleapis.com/gmail/v1`)
  - Credentials: `zo-api/client_secret_473298819240-kkqgen93r91d28h9u8erlb8r9t9donj8.apps.googleusercontent.com.json` and `zo-api/token.json`
  - Shared calendars: `zo-events@zohouse.co`, `zo-blr@zohouse.co`, `zo-wtf@zohouse.co`
- **Output:** Varies by operation -- reads/writes to any Google Workspace service.
- **Quality Assessment:** Needs Work
- **Issues Found:**
  1. **Credential path is relative and ambiguous.** References `zo-api/client_secret_...json` and `zo-api/token.json` without an absolute base path. This is presumably relative to the monorepo root, but that is not stated.
  2. **Key Spreadsheet IDs are "Check workspace docs."** The "Common Zo House Resources" section lists Guest Tracker (BLR), Guest Tracker (WTF), Revenue Dashboard, and Event Pipeline with the note "Check workspace docs for ID" rather than the actual IDs. DATA_SOURCES.md has the real Sheet IDs -- they should be here too.
  3. **No Zo-specific usage examples.** The skill is a generic Google Workspace API reference. It does not show how to read the BLRxZo P&L sheet specifically, or how to query the Zo events calendar. Other skills (morning-briefing, task-manager) need these specific operations but must figure them out independently.
  4. **Date example is from 2024.** The example event creation uses `2024-01-15` which is outdated and suggests the skill was written generically without being updated for the current operational context.
  5. **No connection to the `google.json` / `sheets.json` credential files.** DATA_SOURCES.md references `/home/conscious-house/.credentials/google.json` and `sheets.json` as the credential sources. The google-workspace skill references a completely different credential file (`zo-api/client_secret_...json`). These may or may not be the same credentials accessed via different paths.
- **Fix Required:**
  - Specify the absolute credential path or use an environment variable.
  - Fill in the actual Sheet IDs from DATA_SOURCES.md instead of "check workspace docs."
  - Add Zo-specific usage examples (reading BLRxZo P&L, querying today's events from zo-events calendar).
  - Reconcile credential file references across all skills (google-workspace, task-manager, and DATA_SOURCES.md all reference different paths for what may be the same credentials).
  - Update date examples to use current year placeholders.

---

## Missing Skills (Not Yet Built)

The following skills are referenced in SOUL.md, TRIGGERS.md, or HANDOFF_MAP.md as capabilities ZomadPrime should have, but no SKILL.md file exists in `workspaces/director/skills/`.

### cross-property-compare
- **Type:** Report
- **Should Do:** Generate a side-by-side comparison of BLRxZo vs WTFxZo metrics (occupancy, revenue, events, community health, maintenance response times).
- **Referenced In:** TRIGGERS.md -- Samurai says "compare properties" to trigger this skill.
- **Why It Matters:** This is a core director function. Without it, Samurai has no quick way to benchmark properties against each other.

### agent-health-check
- **Type:** Report
- **Should Do:** Query the OpenClaw gateway for active agents, their last heartbeat, cron job execution status, and error rates. Report which agents are active, stale, or failing.
- **Referenced In:** TRIGGERS.md -- Samurai says "agent status" to trigger this skill.
- **Why It Matters:** ZomadPrime's SOUL.md says "Monitor all agents 24/7" and the gateway exposes `openclaw gateway call status`, `openclaw gateway call agents`, `openclaw gateway call presence` endpoints. Without this skill, agent monitoring is manual.

### metrics-alert
- **Type:** Triage / Report
- **Should Do:** Fire automatically when key metrics drop below thresholds (occupancy below 85%, WhatsApp engagement below 60%, NPS below 70, maintenance response over 20 min). Send alert to Samurai via Telegram.
- **Referenced In:** TRIGGERS.md (cron: "When metrics drop"), HANDOFF_MAP.md (Flow 6: low engagement triggers ZomadPrime metrics-alert), SOUL.md (escalation responsibilities).
- **Why It Matters:** This is the proactive alerting system. Without it, problems are only discovered during the next morning briefing -- potentially 24 hours late.

### monthly-board-report
- **Type:** Report
- **Should Do:** Compile monthly summary for board/investors: revenue trends, occupancy averages, event count and revenue, community growth, strategic opportunities, quarterly forecast.
- **Referenced In:** SOUL.md -- "Monthly board reports" listed under monthly responsibilities.
- **Why It Matters:** SOUL.md commits to monthly board reports and quarterly forecasting, but no skill exists to produce them. This is a strategic deliverable that is entirely manual today.

---

## Handoff Connections

### Receives From

| Source Agent | Handoff Skill | Data Received | Status |
|-------------|---------------|---------------|--------|
| BLRxZo JR | daily-recap (data written to Sheets/Supabase) | Property financials, occupancy, events, issues | Partially built -- morning-briefing reads Sheets but the data pipeline is fragile |
| WTFxZo JR | daily-recap (data written to Sheets/Supabase) | Property financials, occupancy, events, issues | Partially built -- same fragility |
| LOKI | community-pulse (low engagement alert) | Active member percentage, engagement health | Not built -- HANDOFF_MAP.md Flow 6 requires LOKI to alert ZomadPrime when engagement drops below 40%, but no receiving skill exists |
| All agents | Workspace activity timestamps | Last action per agent | Implemented naively via filesystem checks; should use gateway API |

### Sends To

| Target Agent | Handoff Skill | Data Sent | Status |
|-------------|---------------|-----------|--------|
| Any sub-agent | delegate-task (via `sessions_spawn`) | Task description, context, deadline, requester | Built -- skill exists and is well-structured |
| Any sub-agent | skill-sync (write SKILL.md to target workspace) | Adapted skill files | Built -- skill exists but has path issues |

### Missing Handoffs

1. **metrics-alert --> Samurai.** When occupancy, revenue, or engagement drops below threshold, ZomadPrime should alert Samurai. Skill does not exist.
2. **LOKI --> ZomadPrime (engagement alert).** HANDOFF_MAP.md Flow 6 requires LOKI to send engagement data to ZomadPrime when active member % drops below 40%. Neither LOKI's sending skill nor ZomadPrime's receiving skill exists.
3. **ZomadPrime --> Captains (strategic directives).** SOUL.md says ZomadPrime does "cross-property optimization" but there is no skill to push optimization recommendations to property captains.
4. **Wanda --> ZomadPrime (pipeline summary).** SOUL.md says ZomadPrime tracks "Monthly bookings growth" but there is no skill to pull pipeline data from Wanda's workspace or Pipedrive.
5. **Suki --> ZomadPrime (event revenue roll-up).** The Rev-Events sheet exists and Suki writes to it, but ZomadPrime has no skill to read and aggregate event revenue data.

---

## Data Access Summary

| Data Source | Type | Identifier | Currently Accessed By ZomadPrime? | Issues |
|------------|------|------------|----------------------------------|--------|
| BLRxZo P&L Sheet | Google Sheets | `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y` | Yes (morning-briefing, weekly-scorecard) | Skill references vague "blrxzo_pnl" not the actual Sheet ID |
| WTFxZo P&L Sheet | Google Sheets | `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY` | Yes (morning-briefing, weekly-scorecard) | Same vague reference problem |
| Laundry List (Tasks) | Google Sheets | `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI` | Yes (task-manager) | Column schema conflict between task-manager SKILL.md and DATA_SOURCES.md |
| Rev-Events (Event Revenue) | Google Sheets | Tab within P&L sheets | No | Not referenced in any ZomadPrime skill |
| `pms_bookings` | Supabase | `https://elvaqxadfewcsohrswsi.supabase.co/rest/v1/pms_bookings` | No | morning-briefing should query this for occupancy; currently only reads Sheets |
| `canonical_events` | Supabase | `https://elvaqxadfewcsohrswsi.supabase.co/rest/v1/canonical_events` | No | morning-briefing should query this for events; currently only reads Luma API |
| `daily_performance` | Supabase | `https://elvaqxadfewcsohrswsi.supabase.co/rest/v1/daily_performance` | No | weekly-scorecard should use this for staff/ops scoring |
| `founder_profiles` | Supabase | `https://elvaqxadfewcsohrswsi.supabase.co/rest/v1/founder_profiles` | No | DATA_SOURCES.md says ZomadPrime owns this table, but no skill reads or writes it |
| Luma API (BLRxZo) | External API | `$LUMA_API_KEY_BLRXZO` | Yes (morning-briefing) | Only BLRxZo key is referenced; WTFxZo key missing from skill |
| Luma API (WTFxZo) | External API | `$LUMA_API_KEY_SFOXZO` | No | Not referenced in any ZomadPrime skill |
| Google Calendar | Google API | `zo-events@zohouse.co`, `zo-blr@zohouse.co`, `zo-wtf@zohouse.co` | Indirectly (via google-workspace skill) | Not used by morning-briefing or any report skill |
| Google Credentials | OAuth | `zo-api/client_secret_...json` + `zo-api/token.json` | Partially | google-workspace references these; task-manager references `/home/conscious-house/.credentials/google.json` -- path conflict |
| OpenClaw Gateway | Local API | `localhost:18789` | No | morning-briefing and agent-health-check should use `openclaw gateway call agents/presence/status` |
| Telegram Bot | API | `$TELEGRAM_BOT_TOKEN` via OpenClaw | Yes (all report skills send via Telegram) | No issues -- routing works via OpenClaw gateway |
| Pipedrive | External API | Not documented | No | SOUL.md lists Pipedrive as a system ZomadPrime uses, but no env var, API key, or skill references it |
| BLOCKERS_ACTIVE.md | Local file | `workspaces/director/memory/BLOCKERS_ACTIVE.md` | Referenced but does not exist | morning-briefing and weekly-scorecard depend on this file; nothing creates it |
| BLOCKERS_RESOLVED.md | Local file | `workspaces/director/memory/BLOCKERS_RESOLVED.md` | Referenced but does not exist | weekly-scorecard depends on this file; nothing creates it |

---

## Key Issues & Recommendations

### P1 -- Critical (blocking core functionality)

1. **Column schema conflict in task-manager will cause data corruption.**
   The task-manager SKILL.md and DATA_SOURCES.md define completely different 15-column schemas for the Laundry List Google Sheet (`1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI`). In task-manager, column B is "Request From" and column I is "Status"; in DATA_SOURCES.md, column B is "Status" and column I is "Assigned By." If the agent writes to the wrong column, it will overwrite unrelated data.
   **Fix:** Read the actual sheet headers at row 1 and determine which schema is correct. Update the wrong document. This must happen before any write operations.

2. **All file paths reference a non-existent Linux environment.**
   Every skill uses `/home/conscious-house/workspaces/...` and `/home/conscious-house/.credentials/...`. The actual system is macOS at `/Users/samuraizan/Sentient House/sentienthouse-monorepo/`. Every path-dependent operation (blocker checks, agent activity monitoring, credential loading, skill syncing, scorecard archiving) will fail.
   **Fix:** Establish a `$WORKSPACE_ROOT` environment variable and update all skills to use it. Alternatively, do a bulk path replacement across all SKILL.md files.

3. **Google credential paths are inconsistent across skills.**
   Three different credential references exist: `zo-api/client_secret_...json` (google-workspace), `/home/conscious-house/.credentials/google.json` (task-manager), and `C:\Users\user\.credentials\` (DATA_SOURCES.md). The agent cannot authenticate if it does not know where the credentials actually are.
   **Fix:** Establish a single canonical credential path, document it in DATA_SOURCES.md, and update all skills to reference it.

### P2 -- High (significantly limits value)

4. **No Supabase integration in any ZomadPrime skill.**
   The Supabase database is the canonical source for bookings (`pms_bookings`), events (`canonical_events`), and staff performance (`daily_performance`). ZomadPrime's skills only read from Google Sheets and Luma API, missing the most reliable data source. Additionally, DATA_SOURCES.md says ZomadPrime owns the `founder_profiles` table, but no skill reads or writes it.
   **Fix:** Add Supabase REST API calls to morning-briefing (for occupancy and events) and weekly-scorecard (for performance metrics). Add `$SUPABASE_URL` and `$SUPABASE_ANON_KEY` references to relevant skills.

5. **metrics-alert skill does not exist.**
   SOUL.md, TRIGGERS.md, and HANDOFF_MAP.md all reference proactive alerting when KPIs drop below thresholds. Without this skill, ZomadPrime is purely reactive -- problems discovered only during the next scheduled briefing.
   **Fix:** Build `skills/metrics-alert/SKILL.md` with threshold definitions (occupancy < 85%, engagement < 60%, NPS < 70), data source queries, and Telegram alert output.

6. **BLOCKERS_ACTIVE.md and BLOCKERS_RESOLVED.md do not exist and nothing creates them.**
   Two skills (morning-briefing, weekly-scorecard) depend on blocker files that have never been created. The blocker-tracking dimension of the scorecard is unscorable.
   **Fix:** Either add blocker tracking to task-manager (a new column/tab in the Laundry List sheet) or create a dedicated blocker-management skill that maintains these files.

### P3 -- Medium (reduces quality)

7. **weekly-scorecard has no concrete data collection implementation.**
   The scoring rubric is well-defined but the data collection section is entirely conceptual. Without specific API calls, sheet queries, or gateway commands, the agent will produce scores based on whatever context it has in session -- essentially guessing.
   **Fix:** Add explicit data collection steps: Supabase queries for revenue/occupancy, Luma API for event attendance, OpenClaw gateway for agent activity, Google Sheets for task completion rates.

8. **morning-briefing only queries BLRxZo Luma events, not WTFxZo.**
   WTFxZo generates 97% of its revenue from events (per skill-sync SKILL.md). Missing WTFxZo event data in the morning briefing means Samurai gets an incomplete picture of the most event-dependent property.
   **Fix:** Add `$LUMA_API_KEY_SFOXZO` query to morning-briefing alongside the existing BLRxZo query.

9. **cross-property-compare and agent-health-check skills are referenced in TRIGGERS.md but do not exist.**
   Samurai expects to say "compare properties" or "agent status" and get structured output. These triggers will currently fall through to the LLM's general knowledge, producing ungrounded responses.
   **Fix:** Build both skills with explicit data sources and output formats.

### P4 -- Low (nice to have)

10. **delegate-task has no follow-up mechanism.**
    Tasks are delegated via `sessions_spawn` but there is no way to check if the sub-agent completed the work. ZomadPrime cannot close the loop.
    **Fix:** Add a delegation log (`memory/delegations.json`) and a heartbeat check that polls sub-agent status or checks for completion signals.

11. **Pipedrive integration is referenced in SOUL.md but completely absent.**
    SOUL.md lists Pipedrive under "SYSTEMS" for Sales/BD pipeline data. No env var, API key, or skill references Pipedrive anywhere in the codebase.
    **Fix:** Either integrate Pipedrive (add env var, build a pipeline-read skill) or remove it from SOUL.md if Wanda/Yana handle it independently.

12. **google-workspace skill is a generic API reference, not Zo-specific.**
    It provides boilerplate Google API documentation but lacks the specific Sheet IDs, calendar IDs, and operational patterns that ZomadPrime actually needs.
    **Fix:** Add a "Zo House Quick Reference" section with the exact Sheet IDs, calendar IDs, and common query patterns from DATA_SOURCES.md.