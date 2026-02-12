# Skill Tasks

Checklist for rewriting and creating every skill. Work through top to bottom — Phase 1 fixes unblock everything else.

---

## Phase 1: Fix the Foundation

These skills exist but are broken or incomplete. Fix them first.

### Shared (All Agents)
- [ ] **google-workspace** — Rewrite per agent with specific sheet IDs, calendars, and folders. Kill the copy-paste version. (7 rewrites: director, captain-blrxzo, captain-wtfxzo, events, sales, bd, vibe-curator)
- [x] **Data Source Registry** — ~~Create `docs/DATA_SOURCES.md`~~ DONE. Canonical list of every sheet ID, API key location, Supabase table, and file path.
- [x] **Trigger Glossary** — ~~Create `docs/TRIGGERS.md`~~ DONE. Maps every natural phrase to the skill it activates, per agent.

### ZomadPrime (Director)
- [ ] **morning-briefing** — REWRITE. Add exact data sources (sheet IDs, cell ranges). Add anomaly detection (vs yesterday, vs target). Cap output at 15 lines. Add fallback for unavailable data.
- [ ] **delegate-task** — FIX. Add 3 concrete examples. Specify how much context to include in spawn message. Define what "ambiguous domain" means.
- [ ] **task-manager** — FIX. Address shared sheet conflict risk. Add ownership/locking guidance. Clarify which columns each agent can write.
- [ ] **weekly-scorecard** — FIX. Add previous-week comparison. Anchor scores to measurable outcomes not vibes. Add feedback delivery to agents.
- [ ] **skill-sync** — FIX. Add sync log (what was synced, when, from where). Add verification step (read target SOUL.md before adapting).

### BLRxZo JR (Captain — Bangalore)
- [ ] **morning-audit** — FIX. Replace fragile row-number references with column headers or named ranges. Add text fallback for emoji status. Add error handling for sheet unavailable.
- [ ] **daily-recap** — FIX. Parameterize credentials per property. Add error handling for Supabase/Luma/Sheets failures. Specify fallback behavior for each data source.
- [ ] **financial-entry** — FIX. Clarify approval thresholds (align with maintenance-triage). Document actual write method to Google Sheets. Define wait times for approval.
- [ ] **guest-flow** — FIX. Clarify Eezee PMS integration (manual vs API). Resolve WhatsApp group ownership (captain vs LOKI). Add edge cases (no rooms, guest disputes, key loss).
- [ ] **maintenance-triage** — FIX. Create vendor directory (or reference vendor-directory skill). Align cost thresholds with financial-entry. Add SLA for vendor response.
- [ ] **staff-report** — FIX. Verify Supabase table existence. Specify who receives report (Darshan only? + Samurai?).

### WTFxZo JR (Captain — Whitefield)
- [ ] **daily-recap** — FIX. Change Luma API key from `$LUMA_API_KEY_BLRXZO` to WTFxZo-specific key. Emphasize event schedule since 97% revenue is events.
- [ ] **morning-audit** — FIX. Same fixes as BLRxZo version, adapted for Whitefield property.
- [ ] **financial-entry** — FIX. Same fixes as BLRxZo.
- [ ] **guest-flow** — FIX. Same fixes as BLRxZo. Add event-linked guest handling.
- [ ] **maintenance-triage** — FIX. Same fixes, Whitefield-specific vendors.
- [ ] **staff-report** — CREATE. WTFxZo doesn't have this skill. Mirror BLRxZo version for Whitefield.

### Suki (Events) — CLEAN SLATE REBUILD
All 7 original skills deleted on 2026-02-12. Foundation docs (SOUL.md, TOOLS.md, IDENTITY.md, USER.md) rewritten with game.zo.xyz ecosystem awareness. Rebuilding from scratch with proper Supabase integration.

- [ ] **event-inquiry** — BUILD. Rate card, Typeform fields, Supabase event_inquiries integration, GO/NO-GO assessment.
- [ ] **luma-sync** — BUILD. Luma → Supabase sync with retry logic, pagination, 429 handling, both property keys.
- [ ] **rev-tracking** — BUILD. Write event financials to Rev-Events tab in P&L sheets via Google Sheets API.
- [ ] **typeform-sync** — BUILD (NEW). Daily poll Typeform → Supabase `event_inquiries`.
- [ ] **event-marketing** — BUILD. Luma page + social posts with LOKI handoff for cover images.
- [ ] **event-recap** — BUILD. Post-event analysis pulling data from Supabase + sheets.
- [ ] **day-of-event** — BUILD. Real-time coordination: check-in tracking, headcount, issue triage.
- [ ] **invoice-maker** — BUILD. GST-compliant invoice with GSTIN from config, counter storage.
- [ ] **rate-card** — BUILD (NEW). Single source of truth for venue pricing by day/time/event type.
- [ ] **host-followup** — BUILD (NEW). Thank host, collect feedback, pitch repeat booking.
- [ ] **google-workspace** — BUILD. Events-specific: event calendar, vendor sheets, marketing folders.

### Wanda (Sales)
- [ ] **lead-qualify** — FIX. Add B2B/corporate scoring track alongside individual traveler track.
- [ ] **outreach-sequence** — FIX. Add explicit "send via google-workspace Gmail" step. Define how to detect stalled leads.
- [ ] **pipeline-update** — REWRITE. Resolve Supabase vs Sheets question. Specify actual data source with access method. Add forecasting output.
- [ ] **founder-marketing** — FIX. Add content calendar/posting schedule. Add LOKI coordination step to avoid duplicate community content.

### Yana (BD)
- [ ] **founder-outreach** — REWRITE. Replace all `[PLACEHOLDER]` with real pricing OR add "request pricing from Boldrin" approval step. Rename triggers from crypto jargon to plain English.
- [ ] **partner-research** — FIX (minor). Add explicit research sources (web search, LinkedIn, Crunchbase). Add handoff: PURSUE → create deal-pipeline entry.
- [ ] **deal-pipeline** — FIX. Specify actual CRM (Google Sheet). Add sheet ID and column mapping. Define what triggers stage transitions.

### LOKI (Vibe Curator)
- [ ] **guest-welcome** — FIX. Resolve WhatsApp group overlap with captain guest-flow. Clarify: captain handles admin, LOKI handles community. Specify Founder Member lookup method.
- [ ] **daily-vibe** — FIX. Specify data sources for activities (Luma + Google Calendar). Add fallback: if no activities, suggest impromptu options (not make things up).
- [ ] **city-event** — FIX. Define budget authority and approval thresholds. Add post-event feedback collection. Clarify who decides to cancel if RSVPs < minimum.
- [ ] **community-pulse** — FIX. Specify where engagement data is tracked (create sheet if needed). Define re-engagement thresholds.

---

## Phase 2: Build the Handoffs

These skills don't exist yet. They're the connective tissue between agents.

### Wanda → Captains + LOKI
- [ ] **sale-to-ops** (Wanda) — HANDOFF. When booking confirmed: send guest name, dates, preferences, payment status, special requests to property captain + LOKI. Trigger: "booking confirmed for [name]".

### Suki → Captains
- [x] **event-to-ops** (Suki) — HANDOFF. DONE (2026-02-12). Routes ops brief to Captain by venue (Koramangala → BLRxZo JR, Whitefield → WTFxZo JR), notifies LOKI with vibe brief, confirms to Boldrin. Pulls from Supabase `event_inquiries` or `canonical_events` with smart defaults.

### Captains → LOKI
- [ ] **new-guest-onboard** (LOKI) — HANDOFF. Receives guest brief from captain check-in. Sends welcome message, adds to WhatsApp, schedules community intro. Auto-triggered.

### Captains → Captains
- [ ] **incoming-guest-brief** (Captains) — HANDOFF. Receives data from Wanda's sale-to-ops. Displays guest context for upcoming check-in. Includes preferences, booking notes, payment status.

### Captains → Night Staff
- [ ] **shift-handoff** (Captains) — HANDOFF. End-of-shift structured handoff: pending maintenance, expected check-ins/outs overnight, open issues, staff notes.

### Suki → Captains
- [ ] **event-prep-checklist** (Captains) — HANDOFF. Receives data from Suki's event-to-ops. Generates property-specific prep checklist: room blocks, equipment, signage, parking, staff briefing.

### Yana → Suki
- [ ] **partnership-to-event** (Yana) — HANDOFF. When partnership involves co-branded events: send partner requirements, branding guidelines, contact info to Suki.

---

## Phase 3: Add Missing Skills

These are gaps between what SOUL.md promises and what agents can actually do.

### ZomadPrime
- [ ] **metrics-alert** — REPORT. Auto-triggers when: occupancy < 80%, revenue drops > 10% vs prior week, blockers age > 48h, agent unresponsive > 24h. Sends alert to Samurai.
- [ ] **cross-property-compare** — REPORT. On-demand side-by-side: BLR vs Whitefield occupancy, revenue, events, guest satisfaction, staff performance.
- [ ] **agent-health-check** — REPORT. Which agents responded in last 24h, which cron jobs ran, which failed, which skills were triggered.

### Captains (Both)
- [ ] **vendor-directory** — REPORT. Searchable list of approved vendors by category. Contact info, response SLA, cost history, backup vendor. Property-specific.

### Suki
- [ ] **day-of-event** — ACTION. Real-time event coordination: attendee check-in tracking, issue triage, live headcount updates, photographer coordination, timeline management.
- [ ] **host-followup** — ACTION. Post-event: thank host within 24h, collect feedback, pitch repeat booking, log feedback for future improvement.
- [ ] **rate-card** — REPORT. Current venue rates by day of week, time slot, event type, and add-ons. Single source of truth for event-inquiry pricing.

### Wanda
- [ ] **discovery-call** — ACTION. Pre-call: prep guest profile, property match, pricing options. During: key questions, qualification signals. Post: log notes, next step, update pipeline.
- [ ] **repeat-guest-nurture** — ACTION. Identify past guests approaching anniversary/return window. Send personalized re-engagement. Track conversion back to booking.
- [ ] **upsell-playbook** — ACTION. When to offer: event access, longer stays, community membership, founder passport. Triggers during active booking conversations.

### Yana
- [ ] **partner-management** — ACTION. Post-signature lifecycle: payment tracking, deliverable checklist, quarterly review, renewal timeline, performance metrics.
- [ ] **negotiation-framework** — ACTION. Non-negotiables vs flexible terms, standard contract clauses, discount approval thresholds, counter-offer templates.

### LOKI
- [ ] **consent-check** — ACTION. Before posting photos: verify consent collected. Before adding to groups: confirm opt-in. Consent request templates. Tracking sheet.
- [ ] **re-engage-quiet** — ACTION. Weekly scan: members silent > 7 days get personal check-in. Silent > 30 days get re-engagement offer. Track in community health sheet.
- [ ] **content-calendar** — REPORT. Weekly content plan: themes, platforms, property stories. Coordinates with Wanda's founder-marketing to avoid overlap.

---

## Phase 4: Optimize

After all skills are solid, make the system proactive.

- [ ] Add anomaly detection to morning-briefing (highlight what's different, not just what is)
- [ ] Add auto-escalation: blocker > 48h → Samurai notification without manual trigger
- [ ] Stress-test full handoff chain: new lead → qualify → booking → sale-to-ops → guest-brief → check-in → onboard → community → check-out → re-engage
- [ ] Add feedback loops: weekly-scorecard results → agent skill improvement suggestions
- [ ] Create "system health" cron: daily check that all data sources are reachable, all API keys valid

---

## Progress Tracker

| Phase | Total | Done | Remaining | Notes |
|-------|-------|------|-----------|-------|
| Phase 1: Fix Foundation | 38 | 2 | 36 | DATA_SOURCES.md + TRIGGERS.md created. Suki old skills deleted (will rebuild from scratch — adds 4 new tasks). |
| Phase 2: Build Handoffs | 7 | 1 | 6 | event-to-ops DONE (2026-02-12) |
| Phase 3: Missing Skills | 14 | 0 | 14 | |
| Phase 4: Optimize | 5 | 0 | 5 | |
| **Total** | **64** | **3** | **61** | |

### Other Completed Work (not in original task list)
- Cron cleanup: 19 → 6 active jobs (removed broken/duplicate/orphan crons)
- HEARTBEAT.md sync: all 7 agents aligned with actual cron schedule
- Goa → Whitefield refactor: all references updated
- OpenClaw auth v1 schema fix: all 7 agents re-authed
- 3D Command Center: deterministic rewrite (removed 25 Math.random calls)
- Suki foundation docs rebuilt with game.zo.xyz ecosystem awareness
- Supabase data audit: discovered 56 unprocessed event inquiries

---

*Last updated: 2026-02-13*
