# LOKI -- Vibe Curator
> Designs community experiences and manages guest onboarding for BLRxZo properties

**Spec version:** 2026-02-12
**Audited by:** Claude (agent-spec deep-dive)
**Source files reviewed:**
- `workspaces/vibe-curator/SOUL.md`
- `workspaces/vibe-curator/AGENTS.md`
- `workspaces/vibe-curator/TOOLS.md`
- `workspaces/vibe-curator/IDENTITY.md`
- `workspaces/vibe-curator/USER.md`
- `workspaces/vibe-curator/HEARTBEAT.md`
- `workspaces/vibe-curator/skills/guest-welcome/SKILL.md`
- `workspaces/vibe-curator/skills/daily-vibe/SKILL.md`
- `workspaces/vibe-curator/skills/community-pulse/SKILL.md`
- `workspaces/vibe-curator/skills/city-event/SKILL.md`
- `workspaces/vibe-curator/skills/google-workspace/SKILL.md`
- `docs/DATA_SOURCES.md`
- `docs/HANDOFF_MAP.md`
- `docs/TRIGGERS.md`

---

## Identity

| Field | Value |
|-------|-------|
| Agent ID | `loki` |
| Workspace | `workspaces/vibe-curator/` |
| Human Partner | Pooja (Vibe Curator / Life Designer) |
| Telegram ID | **Not bound.** USER.md says "TBD (binding activates once ID is known)". TRIGGERS.md lists Pooja's trigger table but no Telegram chat ID is assigned. LOKI does not route through Boldrin (817242399) -- Boldrin routes to Suki. LOKI currently has no Telegram inbound channel. |
| Role | Guest welcome (Five Senses framework), daily vibe creation, community management via WhatsApp, city-wide event planning, content creation, Founder Member engagement |
| Personality | Warm, playful, deeply intentional. "People don't remember the room -- they remember the people they met." |
| Escalation: Human | Pooja -- emotional support, conflict resolution, in-person facilitation |
| Escalation: System | ZomadPrime -- cross-property coordination, strategic community initiatives, budget approvals |

### Critical Identity Gap

Pooja has no Telegram ID on file. This means:
1. LOKI cannot receive inbound Telegram triggers from Pooja.
2. LOKI cannot send Pooja proactive messages (daily-vibe output, community-pulse reports).
3. The entire trigger table in TRIGGERS.md under "Pooja -> LOKI" is non-functional until a Telegram binding exists.

**Fix required:** Obtain Pooja's Telegram user ID, update USER.md, register the binding in OpenClaw gateway, and add the ID to DATA_SOURCES.md Telegram Chat IDs table.

---

## Current Skills Inventory

### 1. guest-welcome

| Field | Detail |
|-------|--------|
| Type | On-demand (human-triggered) |
| Trigger | "new guest", "someone just checked in", "welcome" |
| Data Sources | None specified in SKILL.md. No API calls, no database lookups. |
| Output | Structured welcome summary: guest name, property, Founder Member status, WhatsApp added, activities shared, Five Senses check |
| Quality | **Needs Work** |

**Issues found:**

1. **WhatsApp group overlap with Captain's guest-flow is partially addressed but not formalized.** SOUL.md says LOKI handles "ADD GUEST TO BLRxZo WHATSAPP GROUP (non-negotiable)." HANDOFF_MAP.md Flow #3 defines the boundary: Captain handles check-in (verify booking, docs, payment, room, welcome), then hands off to LOKI for community integration (welcome message, WhatsApp group add, daily vibe share, Founder Member VIP welcome, first-timer orientation). The SKILL.md itself handles the community side correctly. However, the skill does NOT reference the incoming handoff data format from Captain (guest name, room number, check-out date, Founder Member status, interests, first-time flag). It expects the human to provide all context manually.

2. **No Founder Member lookup mechanism.** SKILL.md says "Ask or look up whether the guest is a Founder Member" but does not specify HOW to look them up. DATA_SOURCES.md defines `founder_profiles` in Supabase with columns `id, display_name, email, membership, status, founder_token_ids`. The skill should query: `GET {SUPABASE_URL}/founder_profiles?display_name=ilike.*{name}*&membership=eq.founder` or match by email. This query is completely absent from the skill.

3. **No data source integration at all.** The skill is a pure checklist/framework document. It does not read from Supabase `pms_bookings` to know who is arriving today, does not query `founder_profiles`, and does not pull today's activities from Google Calendar or Luma for the "share today's activities" step.

4. **Property list is stale.** Output format references "Whitefield / Koramangala / Brigade Road / Indiranagar" -- these are four BLR Zo properties. SOUL.md references "Zo House Whitefield" as the primary, with cross-property mentions of "Zostel Brigade Road, Zo House HSR, Zostel Indiranagar." The property list in the skill output template does not match SOUL.md (Koramangala vs HSR discrepancy).

**Fix required:**
- Add Supabase `founder_profiles` query for Founder Member lookup
- Add Supabase `pms_bookings` query to auto-pull arriving guests
- Add Google Calendar / Luma read for "today's activities" step
- Define structured input format that matches HANDOFF_MAP.md Captain -> LOKI handoff payload
- Reconcile property names across SOUL.md and SKILL.md

---

### 2. daily-vibe

| Field | Detail |
|-------|--------|
| Type | Automated (cron) + on-demand |
| Trigger | "what's happening today", "activities", Heartbeat at 9AM IST daily |
| Data Sources | **None specified.** Skill says "Gather all scheduled activities for the day across properties" but does not say WHERE. |
| Output | Formatted WhatsApp message with MORNING / AFTERNOON / EVENING activity blocks |
| Quality | **Weak** |

**Issues found:**

1. **No data source for activities.** This is the most critical gap. The skill tells LOKI to "gather all scheduled activities" but provides zero guidance on where to find them. Based on DATA_SOURCES.md, the actual sources should be:
   - **Google Calendar** (`zo-events@zohouse.co` for all events, `zo-blr@zohouse.co` for BLR property calendar) via Calendar API v3
   - **Luma API** (`LUMA_API_KEY_BLRXZO`) for public/ticketed events: `GET /calendar/list-events?after={today_start}&before={today_end}`
   - **Supabase `canonical_events`** table for the event registry (synced from Luma by Suki's luma-sync skill)
   - Possibly a physical activity board or internal spreadsheet that is not documented anywhere

2. **No Google Calendar IDs referenced.** DATA_SOURCES.md lists `zo-events@zohouse.co` (all events), `zo-blr@zohouse.co` (BLR property), and `zo-wtf@zohouse.co` (WTF property). None of these appear in the daily-vibe skill.

3. **No cross-property event aggregation logic.** SOUL.md says to include activities from all four BLR properties. The skill mentions "cross-property activities" in content rules but provides no method for discovering events at other properties.

4. **No WhatsApp send mechanism.** The skill produces a formatted message but says nothing about how it actually gets posted to the BLRxZo WhatsApp group. Is it manual (Pooja copies it)? Is there a WhatsApp Business API integration? This is undefined.

5. **HEARTBEAT.md confirms this runs daily at 9AM IST** but the cron/heartbeat mechanism just says "Run daily-vibe skill" -- there is no enrichment step to pull live data before generating the post.

**Fix required:**
- Add explicit data gathering steps: query Google Calendar API for `zo-events@zohouse.co` and `zo-blr@zohouse.co`, query Luma API for today's events, query Supabase `canonical_events`
- Define calendar IDs and API endpoints inline or reference DATA_SOURCES.md
- Define the WhatsApp delivery mechanism (manual handoff to Pooja vs API)
- Add fallback logic per DATA_SOURCES.md error handling rules (e.g., "If Luma unavailable, note it; proceed with calendar data")

---

### 3. community-pulse

| Field | Detail |
|-------|--------|
| Type | Scheduled (weekly, Monday morning) + on-demand |
| Trigger | "how's the community", "engagement check", "WhatsApp stats" |
| Data Sources | **Not specified.** Skill defines WHAT to track but not WHERE the data lives. |
| Output | Structured community pulse report: WhatsApp group stats, Founder Member activity, event attendance, top contributors, quiet members, health rating |
| Quality | **Weak** |

**Issues found:**

1. **No engagement data store exists.** The skill asks LOKI to report on "active members vs total," "message frequency," "organic conversations," "top contributors," and "quiet members" -- but there is no database table, no Google Sheet, no WhatsApp analytics API, and no tracking mechanism defined ANYWHERE in the system. WhatsApp Business API provides limited group analytics. The BLRxZo WhatsApp group (100+ members per SOUL.md) likely runs on a standard WhatsApp group, not WhatsApp Business, which means zero programmatic access to message counts or member activity.

2. **No sheet or database for engagement tracking.** DATA_SOURCES.md does not list any "community engagement" table in Supabase or any "engagement tracking" tab in Google Sheets. If LOKI is supposed to track this data, someone needs to define and create the storage. Options:
   - A new Supabase table (e.g., `community_engagement`) with columns: date, property, total_members, active_7d, posts_by_zo, organic_threads, event_attendance
   - A new tab in the BLRxZo P&L sheet or a dedicated "Community Health" Google Sheet
   - Manual entry by Pooja into a form/sheet that LOKI reads

3. **Founder Member tracking references `founder_profiles` but the skill does not.** DATA_SOURCES.md lists `founder_profiles` as readable by `community-pulse`. The skill should query `GET {SUPABASE_URL}/founder_profiles?membership=eq.founder&status=eq.active` to get the ~40 Black Passport holders, then cross-reference with whatever engagement data exists.

4. **Event attendance has no source.** The skill wants "events held," "total attendance," "avg per event," "best attended." Supabase `event_registrations` has `checked_in` data (synced from Luma by Suki). The skill should query this but does not reference it.

5. **Health thresholds are defined (good)** but the data to evaluate them is not collectible.

**Fix required:**
- Create an engagement tracking mechanism (new Supabase table or Google Sheet)
- Add Supabase queries for `founder_profiles` and `event_registrations`
- Add Luma API query for event attendance data
- Define how WhatsApp metrics are gathered (manual input by Pooja? WhatsApp Business API? approximate from observation?)
- Acknowledge the hard truth: fully automated community-pulse is not possible without WhatsApp API access; define a hybrid model (Pooja inputs qualitative data, LOKI enriches with Supabase/Luma quantitative data)

---

### 4. city-event

| Field | Detail |
|-------|--------|
| Type | On-demand (human-triggered) |
| Trigger | "plan a trek", "food tour", "pub crawl", "weekend event" |
| Data Sources | None. Pure process/template document. |
| Output | Structured event plan: name, type, date, time, meeting point, cost, target size, timeline, logistics |
| Quality | **Needs Work** |

**Issues found:**

1. **No budget authority or approval thresholds defined.** The skill mentions costs ("Transport + guide fee", "Material costs") but does not say:
   - What is LOKI's spending authority? Can Pooja approve a trek bus rental (likely INR 5,000-15,000)?
   - What requires escalation to ZomadPrime? SOUL.md says "Budget approvals for events" escalate to ZomadPrime but provides no threshold.
   - Who pays vendors? Is there a petty cash system, a card, or does Pooja expense it?
   - Is there a cost-per-head cap for free-for-guests activities?

2. **No Luma or Google Calendar integration for event creation.** When LOKI plans a city event, it should:
   - Create the event on Luma (via Suki, or directly) so registrations are tracked
   - Add the event to Google Calendar `zo-events@zohouse.co` and `zo-blr@zohouse.co`
   - Neither step is referenced in the skill

3. **No connection to Suki's event pipeline.** City-wide events are LOKI's domain, but Suki manages the event registry (Supabase `canonical_events`, Luma pages, event marketing). There is no defined boundary: Does LOKI create the Luma page or does Suki? Who owns the event in the system? This overlap is unresolved.

4. **RSVP tracking is manual.** The skill says "Comment below or DM to join" and "Collect RSVPs -- track names and which property they are from." There is no spreadsheet, no Supabase table, no form for this. It lives in WhatsApp DMs.

5. **No post-event data flow.** The skill says "Note attendance for community-pulse tracking" on Day After, but community-pulse has no data store (see issue above). This is a dead-end instruction.

**Fix required:**
- Define budget thresholds: LOKI/Pooja can approve up to INR X; above that, escalate to ZomadPrime
- Add Google Calendar event creation step (reference google-workspace skill + calendar IDs from DATA_SOURCES.md)
- Define Luma event creation responsibility (LOKI vs Suki) or add a handoff
- Create RSVP tracking mechanism (Google Sheet tab, Google Form, or Supabase table)
- Link post-event attendance data to community-pulse's data store (once created)

---

### 5. google-workspace

| Field | Detail |
|-------|--------|
| Type | Utility (tool skill, not a workflow) |
| Trigger | Calendar, Drive, Sheets, Docs, Gmail action phrases |
| Data Sources | Google APIs (Calendar v3, Drive v3, Sheets v4, Docs v1, Gmail v1) |
| Output | Varies by operation |
| Quality | **Needs Work -- Generic copy-paste, not vibe-curator-specific** |

**Issues found:**

1. **This is a generic Google Workspace API reference.** It is identical boilerplate that could (and likely does) appear in every agent's workspace. It contains no LOKI-specific configuration:
   - No mention of the BLRxZo WhatsApp content calendar sheet (if one exists)
   - No reference to specific calendar IDs that LOKI should use (`zo-events@zohouse.co`, `zo-blr@zohouse.co`)
   - No mention of the community engagement tracking sheet (which should be created)
   - The "Key Spreadsheets" section says "Check workspace docs for ID" four times -- those IDs were never filled in

2. **Authentication path is hardcoded to zo-api directory.** Credential path `zo-api/client_secret_...json` and `zo-api/token.json` is referenced. This may or may not resolve correctly from LOKI's workspace. DATA_SOURCES.md mentions credentials at `C:\Users\user\.openclaw\` and `C:\Users\user\.credentials\` (Windows) or `/home/conscious-house/.credentials/` (legacy). The skill's path may be stale.

3. **Shared Calendar IDs are listed (good)** at the bottom under "Common Zo House Resources." However, daily-vibe and city-event skills do not reference this section. The useful data is here but disconnected from the skills that need it.

4. **Gmail capability may not be relevant for LOKI.** LOKI communicates via WhatsApp and Telegram, not email. Gmail API documentation takes up significant space in this skill file. If LOKI does not send emails, this section adds noise.

**Fix required:**
- Customize for LOKI: add specific calendar IDs, sheet IDs, and Drive folder IDs that LOKI needs
- Fill in the "Key Spreadsheets" section with actual IDs from DATA_SOURCES.md
- Remove or de-emphasize Gmail section unless LOKI has an email use case
- Verify credential path works from the vibe-curator workspace
- Cross-reference this skill from daily-vibe and city-event skills so they know how to access calendar data

---

### Founder Member Lookup Capability

**SOUL.md explicitly calls out Founder Member recognition** as a core workflow (Section 6: ~40 Black Passport holders). The system has the data: Supabase `founder_profiles` table with `display_name, email, membership, status, founder_token_ids` columns, readable by `guest-welcome` and `community-pulse` per DATA_SOURCES.md.

**Current state:** Neither guest-welcome nor community-pulse SKILL.md files contain the Supabase query. LOKI has no documented way to programmatically look up whether an arriving guest is a Founder Member. The instruction in guest-welcome says "Ask or look up" but the "look up" path has no implementation.

**Fix required:** Add a Founder Member lookup step to guest-welcome:
```
GET {SUPABASE_URL}/founder_profiles?display_name=ilike.*{guest_name}*&membership=eq.founder
Headers: apikey: {SUPABASE_ANON_KEY}, Authorization: Bearer {SUPABASE_ANON_KEY}
```
If result is non-empty, flag as Founder Member and trigger VIP welcome path.

---

## Missing Skills (Not Yet Built)

### 1. new-guest-onboard
- **Source:** HANDOFF_MAP.md Flow #3 (Check-in -> Community Onboarding)
- **Purpose:** Receives structured handoff from Captain after guest check-in is complete. Contains guest name, room number, check-out date, Founder Member status, interests, first-time flag. LOKI then executes: welcome message, WhatsApp group add, daily vibe share, VIP welcome (if Founder), orientation (if first-timer).
- **Current state:** Not built. HANDOFF_MAP.md explicitly lists this as "Not built" in the implementation checklist (row #3).
- **Relationship to guest-welcome:** guest-welcome is the Five Senses framework/checklist. new-guest-onboard is the automated handoff receiver that TRIGGERS guest-welcome with pre-populated data from the Captain. They are complementary, not duplicative.
- **Priority:** HIGH. This is the primary inter-agent handoff that connects operations (Captain) to community (LOKI). Without it, Pooja must manually learn about every check-in.

### 2. re-engage-quiet
- **Source:** TRIGGERS.md lists this under Pooja -> LOKI ("quiet members" trigger). HANDOFF_MAP.md Flow #6 references it as the action LOKI takes when community-pulse detects engagement below 40-60%.
- **Purpose:** Identify members silent for 7+ days, generate personal (non-automated-blast) check-in messages, invite them to upcoming events.
- **Current state:** Not built. Referenced in two system docs but no SKILL.md exists.
- **Dependency:** Requires community-pulse to have a working data source for engagement tracking (which it currently does not).
- **Priority:** MEDIUM. Depends on community-pulse data store being created first.

### 3. content-calendar
- **Source:** TRIGGERS.md lists this under Pooja -> LOKI ("content plan for this week" trigger).
- **Purpose:** Generate weekly content themes, platform assignments (WhatsApp, Instagram @zohouse.whitefield, Zo World App, Slack #community-managers), and property story ideas.
- **Current state:** Not built. No SKILL.md exists.
- **SOUL.md coverage:** Section 8 (Daily Content Capture & Social Media) defines the platforms and posting cadence. This should be formalized into a skill.
- **Priority:** MEDIUM. Pooja and LOKI can work ad-hoc, but a structured content calendar improves consistency.

### 4. consent-check
- **Source:** SOUL.md Section 3 (Consent Culture Management) is extensive and detailed. No skill exists for it.
- **Purpose:** Formalize consent protocols for photos, physical greetings, invitations, and info sharing. Provide a consent audit checklist for events.
- **Current state:** Documented in SOUL.md as philosophy/process but not encoded as a runnable skill. This may be intentional -- consent is a human-judgment domain. However, a "consent checklist" skill for event planning (pre-event: photo consent plan, opt-in language, safety briefing template) would be useful.
- **Priority:** LOW as a standalone skill. The philosophy is well-documented in SOUL.md. Consider embedding consent checkpoints into city-event and guest-welcome rather than a separate skill.

### 5. event-vibe (Suki -> LOKI handoff receiver)
- **Source:** HANDOFF_MAP.md Flow #2 shows Suki's event-to-ops sending to both Captain (prep checklist) and LOKI (atmosphere, music, decor planning). TRIGGERS.md lists "event vibe request" as an incoming handoff from Suki.
- **Current state:** Not built. No SKILL.md exists. When Suki confirms an event, LOKI has no structured way to receive the event details and plan the community/atmosphere layer.
- **Priority:** MEDIUM. Needed for LOKI to participate in the event pipeline rather than being informed ad-hoc.

---

## Handoff Connections

### Receives From

| Source Agent | Handoff | Data Received | Skill That Handles It | Status |
|-------------|---------|---------------|----------------------|--------|
| Wanda | sale-to-ops | Incoming guest: name, arrival date, property, Founder Member status, interests | new-guest-onboard | **Not built** (neither the Wanda sending skill nor the LOKI receiving skill) |
| Captain (BLRxZo JR / WTFxZo JR) | guest check-in -> onboard | Guest name, room, check-out date, Founder Member, interests, first-time flag | new-guest-onboard | **Not built** |
| Suki | event-to-ops (LOKI portion) | Event name, date, time, headcount, atmosphere/vibe requirements | event-vibe (not yet named) | **Not built** |

### Sends To

| Target Agent | Handoff | Data Sent | Skill That Sends It | Status |
|-------------|---------|-----------|---------------------|--------|
| ZomadPrime | low engagement alert | Community engagement critical: active member %, property, recommended action | community-pulse -> metrics-alert | **Not built** (HANDOFF_MAP.md Flow #6) |
| ZomadPrime | daily data roll-up | Daily vibe post / community summary | daily-vibe (cron output) | **Partially exists** -- daily-vibe runs on heartbeat but does not send structured data to ZomadPrime |

### Missing Handoff Infrastructure

| # | Handoff | From | To | HANDOFF_MAP.md Status |
|---|---------|------|-----|----------------------|
| 1 | sale-to-ops | Wanda | Captain + LOKI | Not built |
| 2 | event-to-ops (LOKI portion) | Suki | LOKI | Not built |
| 3 | guest check-in -> new-guest-onboard | Captain | LOKI | Not built |
| 6 | low engagement -> metrics-alert | LOKI | ZomadPrime | Not built |

All four handoffs involving LOKI are non-functional. LOKI is currently a fully siloed agent -- it neither receives structured data from other agents nor sends structured data to them.

---

## Data Access Summary

| Data Source | Resource | Access Method | Used By Skill | Current Status |
|-------------|----------|---------------|---------------|----------------|
| Supabase | `founder_profiles` | `GET /founder_profiles?membership=eq.founder` | guest-welcome, community-pulse | **Not wired.** DATA_SOURCES.md says these skills read it, but neither SKILL.md contains the query. |
| Supabase | `pms_bookings` | `GET /pms_bookings?property_id=eq.blrxzo&arrivaldate=eq.{today}` | guest-welcome (should auto-pull arriving guests) | **Not wired.** Skill does not reference booking data. |
| Supabase | `canonical_events` | `GET /canonical_events?start_at=gte.{today_start}&start_at=lte.{today_end}` | daily-vibe (today's activities) | **Not wired.** Skill says "gather activities" but has no data source. |
| Supabase | `event_registrations` | `GET /event_registrations?event_id=eq.{id}` | community-pulse (attendance tracking) | **Not wired.** Skill wants attendance data but does not reference this table. |
| Google Calendar | `zo-events@zohouse.co` | Calendar API v3, list events | daily-vibe, city-event | **Not wired.** Calendar IDs are in google-workspace skill but not referenced by daily-vibe or city-event. |
| Google Calendar | `zo-blr@zohouse.co` | Calendar API v3, list events | daily-vibe, city-event | **Not wired.** Same issue. |
| Luma API | `LUMA_API_KEY_BLRXZO` | `GET /calendar/list-events?after={date}` | daily-vibe (public events) | **Not wired.** Env var exists but no skill references it. |
| Google Sheets | BLRxZo P&L (`1VKZKfKrfF2q...`) | Sheets API v4 | None (LOKI does not do financial tracking) | N/A -- correct that LOKI does not access this. |
| Google Sheets | Laundry List (`1csj8lmB...`) | Sheets API v4 | Potentially task-manager if LOKI had one | **N/A** -- LOKI has no task-manager skill. |
| WhatsApp | BLRxZo group (100+ members) | **No API access defined** | daily-vibe, community-pulse, guest-welcome | **Critical gap.** No WhatsApp Business API or programmatic access documented. All WhatsApp posting appears to be manual (Pooja copies LOKI's output). |
| Engagement data | Does not exist | N/A | community-pulse, re-engage-quiet | **Does not exist.** No table, no sheet, no tracking mechanism for community engagement metrics. |

### Summary Verdict

**0 of 6 data integrations that should be wired are actually wired.** Every LOKI skill is a template/framework document with no live data connections. LOKI is essentially a prompt library, not an operational agent.

---

## Key Issues & Recommendations

### Critical (Blocks core functionality)

**1. Telegram binding missing -- LOKI has no inbound communication channel.**
Pooja's Telegram ID is "TBD." Without it, the entire trigger system (TRIGGERS.md Pooja -> LOKI section) is non-functional. LOKI cannot receive commands, cannot send reports, and cannot participate in the OpenClaw gateway routing.
- **Fix:** Get Pooja's Telegram user ID. Update USER.md, DATA_SOURCES.md Telegram table, and OpenClaw gateway bindings.

**2. Zero data integrations -- every skill is a static template.**
No skill contains an actual API call, database query, or data read. Daily-vibe does not read calendars. Guest-welcome does not query bookings. Community-pulse does not access engagement data. LOKI cannot do anything autonomously.
- **Fix:** For each skill, add the specific queries and API endpoints from DATA_SOURCES.md. Start with daily-vibe (highest-frequency skill, runs daily) and guest-welcome (highest-impact, every new guest).

**3. No engagement data store exists for community-pulse.**
Community-pulse defines what to track but there is nowhere to store or read the data. WhatsApp group analytics are not programmatically accessible.
- **Fix:** Create a `community_engagement` Supabase table or a dedicated Google Sheet. Define a hybrid model: Pooja manually inputs WhatsApp qualitative metrics (organic conversations: high/medium/low, approximate active count), LOKI enriches with Supabase event_registrations and founder_profiles data.

### High Priority (Major capability gaps)

**4. All four inter-agent handoffs are non-functional.**
LOKI is completely siloed. It cannot receive guest data from Captains, booking data from Wanda, or event data from Suki. It cannot send engagement alerts to ZomadPrime.
- **Fix:** Build new-guest-onboard skill first (Captain -> LOKI, HANDOFF_MAP.md Flow #3). This is the most frequent handoff and directly enables guest-welcome with real data.

**5. No WhatsApp delivery mechanism defined.**
Daily-vibe, guest-welcome, and community management all center on the BLRxZo WhatsApp group, but no programmatic send capability exists. If Pooja must manually copy-paste every message, LOKI's 9AM heartbeat produces a message that sits in a file until Pooja reads it.
- **Fix:** Either (a) integrate WhatsApp Business API (if the group uses it), (b) send LOKI's output to Pooja via Telegram so she can forward it to WhatsApp, or (c) document the manual handoff explicitly so it is a known limitation, not an unstated assumption.

**6. Founder Member lookup not implemented.**
SOUL.md and guest-welcome both emphasize Founder Member recognition (~40 Black Passport holders). The data exists in Supabase `founder_profiles`. The query does not exist in any skill.
- **Fix:** Add Supabase query to guest-welcome. Consider creating a quick-reference "Founder Member roster" that LOKI caches locally in the workspace for offline/fast access.

### Medium Priority (Operational improvements)

**7. google-workspace skill is generic boilerplate.**
It provides no LOKI-specific configuration. Calendar IDs, sheet IDs, and Drive folders relevant to LOKI's work are not filled in.
- **Fix:** Customize the skill: add LOKI's specific calendar IDs (`zo-events@zohouse.co`, `zo-blr@zohouse.co`), create/reference a community tracking sheet, remove Gmail section if unused.

**8. city-event has no budget authority or approval thresholds.**
SOUL.md says budget approvals escalate to ZomadPrime but defines no thresholds. Pooja cannot make spending decisions without knowing her limits.
- **Fix:** Define tiers: e.g., under INR 2,000 Pooja approves, INR 2,000-10,000 needs Pooja + ZomadPrime, above INR 10,000 needs Samurai approval. Codify in the city-event SKILL.md.

**9. Three referenced skills do not exist: re-engage-quiet, content-calendar, event-vibe.**
These appear in TRIGGERS.md and HANDOFF_MAP.md but have no SKILL.md files.
- **Fix:** Build re-engage-quiet first (depends on community-pulse data store). Content-calendar and event-vibe can follow.

**10. Property name inconsistency.**
SOUL.md references "Zo House HSR" but guest-welcome references "Koramangala." These may be the same location or different ones. Inconsistency creates confusion.
- **Fix:** Establish canonical property names in a shared reference (DATA_SOURCES.md or a dedicated properties registry) and use them consistently across all skill files.

### Low Priority (Nice-to-have)

**11. MOOP management (SOUL.md Section 4) has no skill.**
Matter Out Of Place management is a physical task. A skill could formalize the documentation/celebration aspect (photo logging, WhatsApp wins posts), but this is low priority compared to data integration gaps.

**12. Content capture workflow (SOUL.md Section 8) partially overlaps with content-calendar.**
Once content-calendar is built, ensure it covers the multi-platform posting cadence: WhatsApp 2-3x/day, Instagram @zohouse.whitefield 2x/week, Slack #community-managers 1-2 per activity, Zo World App daily.

---

## Recommended Build Order

| Priority | Action | Effort | Unblocks |
|----------|--------|--------|----------|
| 1 | Bind Pooja's Telegram ID | 10 min | All trigger-based interactions |
| 2 | Wire daily-vibe to Google Calendar + Luma + Supabase canonical_events | 2-3 hrs | Automated 9AM activity posts with real data |
| 3 | Add Supabase founder_profiles query to guest-welcome | 1 hr | Founder Member auto-detection |
| 4 | Build new-guest-onboard skill (Captain -> LOKI handoff receiver) | 2-3 hrs | Automated guest community onboarding |
| 5 | Create community engagement data store (Supabase table or Google Sheet) | 1-2 hrs | community-pulse, re-engage-quiet |
| 6 | Wire community-pulse to Supabase + new engagement store | 2 hrs | Weekly community health reporting |
| 7 | Build re-engage-quiet skill | 2 hrs | Proactive member re-engagement |
| 8 | Define budget thresholds in city-event | 30 min | Pooja spending authority clarity |
| 9 | Customize google-workspace for LOKI | 1 hr | Calendar/Sheet access from other skills |
| 10 | Build content-calendar skill | 2-3 hrs | Structured weekly content planning |
| 11 | Build event-vibe skill (Suki -> LOKI handoff receiver) | 2 hrs | LOKI participation in event pipeline |
| 12 | Build low-engagement -> ZomadPrime alert pathway | 1 hr | Escalation when community health drops |

---

## Appendix: File-by-File Audit Notes

### SOUL.md
- Comprehensive and well-written. Defines 8 workflows with clear process steps.
- Functions as the "ideal state" document -- everything LOKI should eventually do.
- Gap: workflows 1, 2, 3, 5, 6, 7, 8 are not fully encoded as runnable skills with data sources.
- The Skill Creation Protocol section at the bottom (notify ZomadPrime via `sessions_spawn`) is good practice.

### AGENTS.md
- Generic workspace operating manual (shared across all agents). Not LOKI-specific.
- Defines session startup (read SOUL.md, USER.md, memory), memory management, safety rules, group chat behavior, heartbeat protocol.
- No issues. Standard operating template.

### TOOLS.md
- Empty template. No LOKI-specific tool notes have been added.
- Should contain: WhatsApp group details, property addresses, Pooja's contact info, frequently used calendar IDs, Supabase query patterns.

### IDENTITY.md
- Clean agent identity card. Matches SOUL.md.

### USER.md
- Pooja's profile. Telegram ID is "TBD" -- this is the critical missing binding.

### HEARTBEAT.md
- Single line: daily-vibe at 9AM IST. Minimal but correct.
- Could add: Monday community-pulse check, weekly content-calendar generation.