# Yana -- Business Development Agent
> Identifies and develops strategic partnerships that drive revenue growth

**Spec version:** 2026-02-12
**Audited from:** `workspaces/bd/` (SOUL.md, AGENTS.md, TOOLS.md, IDENTITY.md, USER.md, HEARTBEAT.md, all skills/*/SKILL.md), `docs/DATA_SOURCES.md`, `docs/HANDOFF_MAP.md`, `docs/TRIGGERS.md`

---

## Identity

| Field | Value |
|-------|-------|
| Agent ID | `yana` |
| Workspace | `workspaces/bd/` |
| Human Partner | Boldrin (BD, Sales & Events Lead) |
| Telegram Handle | @Boldrin71 |
| Telegram ID | `817242399` |
| Role | Partnership research, founder outreach, deal pipeline tracking |
| Personality | Sharp, analytical, relationship-aware. "Sees partnership potential where others see competitors." |
| Heartbeat | None -- operates on-demand only. Boldrin triggers BD tasks as needed. |
| Model (Gateway) | Claude Haiku 4.5 (via OpenClaw) |

### Routing Note

Boldrin's Telegram DMs route to **Suki** by default (per OpenClaw bindings in DATA_SOURCES.md). To reach Yana, Boldrin must message through the main bot or use agent-specific routing. This is a UX friction point -- Boldrin manages three agents (Suki, Wanda, Yana) but only has a direct DM route to one.

---

## Current Skills Inventory

### 1. founder-outreach

| Field | Detail |
|-------|--------|
| **Type** | Outreach sequence generator |
| **Location** | `workspaces/bd/skills/founder-outreach/SKILL.md` |
| **Trigger phrases** | "NFT outreach", "founder members", "Black Passport" |
| **Data sources** | None specified. No database reads, no API calls. Relies entirely on LLM generation from context provided in the message. |
| **Output** | Multi-email outreach sequence (4 emails over 12 days) with channel adaptations for LinkedIn DM, WhatsApp, Twitter/X DM |
| **Quality** | **Needs Work** |

**Issues Found:**

1. **PLACEHOLDER pricing throughout.** Email 2 contains `[PLACEHOLDER -- awaiting Boldrin's confirmation]` and the output template includes `Pricing: [PLACEHOLDER -- confirm with Boldrin before sending]`. The skill was written with the expectation that Boldrin would confirm pricing. If this was never resolved, every outreach sequence generated is incomplete and cannot be sent without manual editing.

2. **Trigger phrases use crypto/web3 jargon.** All three triggers -- "NFT outreach", "Black Passport", "founder members" -- assume Boldrin already knows the internal branding. TRIGGERS.md maps these same terms to the user-facing glossary, but the phrases themselves are opaque. A plain-English trigger like "reach out to [name/company]" (which TRIGGERS.md actually lists under Yana) is better. The SKILL.md triggers and the TRIGGERS.md triggers are inconsistent: TRIGGERS.md says `"reach out to [name/company]" -> founder-outreach`, but the SKILL.md itself says `"NFT outreach"`, `"Black Passport"`.

3. **Framing is narrowly NFT/membership-focused.** The skill title is "Black Passport Membership Sales" and assumes every outreach is about selling Founder Member NFTs. SOUL.md describes a broader BD mandate (co-living brands, corporate housing, travel platforms, local businesses, investors). This skill only covers one slice: membership sales to individuals.

4. **No connection to `founder_profiles` table.** DATA_SOURCES.md lists `founder_profiles` in Supabase as readable by `founder-outreach`, with columns for `display_name`, `email`, `membership`, `status`, `founder_token_ids`. The skill does not reference this data source at all -- it has no instructions to look up existing founders, check membership status before outreach, or avoid re-contacting active members.

5. **No personalization data pipeline.** The skill says "Open with something personal -- reference their work, a recent post, a mutual connection" but provides no mechanism to research the target. There is no web search step, no LinkedIn lookup, no integration with partner-research.

**Fix Required:**

- Replace placeholder pricing with confirmed numbers or add a hard gate: "Do not generate outreach until pricing is confirmed. If pricing file does not exist, tell Boldrin."
- Rename triggers to plain English. Keep crypto terms as aliases at most.
- Add a step to query `founder_profiles` from Supabase before outreach to check if the target is already a member.
- Either broaden the skill to handle partnership outreach (not just NFT sales) or create a separate `partnership-outreach` skill for B2B outreach.
- Add a dependency on partner-research: "Before generating outreach, run partner-research or confirm a brief already exists."

---

### 2. partner-research

| Field | Detail |
|-------|--------|
| **Type** | Research brief generator |
| **Location** | `workspaces/bd/skills/partner-research/SKILL.md` |
| **Trigger phrases** | "research this company", "potential partner", "who is" |
| **Data sources** | None specified in the skill. SOUL.md claims access to "LinkedIn, Crunchbase (research)" but the skill contains no API endpoints, no web search instructions, no tool usage. |
| **Output** | Structured partner brief with fit assessment (5 dimensions scored 1-5), partnership model recommendation, PURSUE/PASS/EXPLORE verdict |
| **Quality** | **Needs Work** |

**Issues Found:**

1. **No actual research tools specified.** The skill describes an excellent research framework (company profile, funding, audience, brand fit) and a rigorous scoring system, but it has zero instructions for how to gather the data. There is no web search call, no LinkedIn API, no Crunchbase API, no browser tool. The agent would have to rely entirely on its training data (stale by definition) or ask Boldrin to provide everything manually. This makes it a "template skill" not a "research skill."

2. **SOUL.md mentions Pipedrive as the CRM.** The skill does not reference Pipedrive at all. If Pipedrive is the actual deal/partner database, the skill should read existing partner records before starting new research (to avoid duplicate work). If Pipedrive is not actually in use (likely, given no API credentials appear in DATA_SOURCES.md), SOUL.md should be corrected.

3. **No storage for completed briefs.** The skill outputs a formatted brief but does not specify where it goes. Is it saved to Google Drive? Appended to a Google Sheet? Stored in a local file? There is no persistence mechanism, meaning briefs are generated in-chat and then lost when the session ends.

4. **"who is" trigger is dangerously broad.** The phrase "who is" would match casual questions ("who is coming to dinner?") that have nothing to do with partner research.

**Fix Required:**

- Add explicit web search and/or browser tool usage steps. The skill should instruct the agent to use `web_search` (or equivalent tool) to look up the company, check LinkedIn profiles, find Crunchbase data, and scan recent news.
- Add a storage step: save completed briefs to Google Drive (BD folder) or append key fields to a partnership tracker Google Sheet.
- Remove or narrow the "who is" trigger to something like "who is [company] as a partner" or "research [company]".
- Clarify whether Pipedrive is in use. If not, remove the reference from SOUL.md and specify the actual CRM (Google Sheets, or none).

---

### 3. deal-pipeline

| Field | Detail |
|-------|--------|
| **Type** | Pipeline status reporter |
| **Location** | `workspaces/bd/skills/deal-pipeline/SKILL.md` |
| **Trigger phrases** | "partnership status", "BD pipeline", "active deals" |
| **Data sources** | None specified. No Google Sheet ID, no Supabase table, no Pipedrive reference, no local file. |
| **Output** | Pipeline summary with deal table, health indicators, attention items, recently closed deals, weekly priorities |
| **Quality** | **Weak** |

**Issues Found:**

1. **No CRM or data backing whatsoever.** This is the most critical gap. The skill defines a beautiful pipeline report format with stages, health indicators, and deal tracking -- but has no data source. Where do the deals live? There is no Google Sheet ID, no column mapping, no Supabase table for BD deals, no Pipedrive API. The agent would have to reconstruct the entire pipeline from memory (which resets every session) or ask Boldrin to dictate every deal every time.

2. **SOUL.md says "Pipedrive (partnership pipeline)" but Pipedrive is not in DATA_SOURCES.md.** There are no Pipedrive credentials, no API endpoint, no environment variable. Pipedrive appears to be aspirational, not actual.

3. **No persistence between sessions.** AGENTS.md is clear: "You wake up fresh each session." Without an external data store, the pipeline cannot persist. The agent would need to either (a) read from a Google Sheet, (b) read from a local JSON/markdown file in the workspace, or (c) ask Boldrin to repeat everything. None of these are implemented.

4. **Pipeline hygiene rules are good but unenforceable.** Rules like "Kill dead deals" and "Review weekly" require the ability to read and write deal state. Without a data store, these are suggestions that cannot be automated.

**Fix Required:**

- **Create a BD Pipeline Google Sheet** with columns matching the skill's schema: Partner | Type | Stage | Days in Stage | Health | Value (Est.) | Next Step | Blocker | Owner | Last Updated.
- Add the Sheet ID to DATA_SOURCES.md and as an environment variable.
- Update the skill to read from this sheet at the start (to populate the report) and write back after any updates.
- Remove the Pipedrive reference from SOUL.md or add actual Pipedrive integration.
- Add a cron or heartbeat-triggered weekly pipeline review.

---

### 4. google-workspace

| Field | Detail |
|-------|--------|
| **Type** | API integration reference (Calendar, Drive, Sheets, Docs, Gmail) |
| **Location** | `workspaces/bd/skills/google-workspace/SKILL.md` |
| **Trigger phrases** | Generic: "add to calendar", "upload to drive", "update sheet", "send email", "create doc", etc. |
| **Data sources** | Google APIs via OAuth 2.0 (credentials at `zo-api/client_secret_...json` and `zo-api/token.json`) |
| **Output** | Varies by operation |
| **Quality** | **Needs Work** |

**Issues Found:**

1. **Generic copy-paste, not BD-specific.** This is a general-purpose Google Workspace reference document. It contains no BD-specific configuration: no BD pipeline sheet ID, no BD Drive folder, no BD-specific calendar, no outreach email templates. It mentions "Check workspace docs for ID" for key spreadsheets -- meaning the IDs were never filled in.

2. **"Key Spreadsheets" section is entirely unresolved.** The skill lists:
   - Guest Tracker (BLR): "Check workspace docs for ID"
   - Guest Tracker (WTF): "Check workspace docs for ID"
   - Revenue Dashboard: "Check workspace docs for ID"
   - Event Pipeline: "Check workspace docs for ID"

   These are not BD-relevant spreadsheets (Guest Tracker belongs to Captains, Event Pipeline to Suki). The BD agent needs a Partnership Pipeline sheet, a Partner Briefs folder, and possibly a BD-specific calendar for partner meetings.

3. **Shared Calendars section is generic.** Lists `zo-events@zohouse.co`, `zo-blr@zohouse.co`, `zo-wtf@zohouse.co` -- these are property/event calendars, not BD calendars. No BD meeting calendar is configured.

4. **Credential path uses `zo-api/` prefix.** This appears to be a relative path that may not resolve correctly from the BD workspace context. DATA_SOURCES.md references `/home/conscious-house/.credentials/` as the legacy location and `C:\Users\user\.openclaw\` for Windows. The skill's path is inconsistent with both.

5. **Duplicate of other workspaces.** This exact skill (or near-identical) likely exists in every workspace. That is fine for shared infrastructure, but the BD workspace version should be customized with BD-specific resource IDs and folders.

**Fix Required:**

- Add BD-specific Google Sheet IDs (once the pipeline sheet is created).
- Add BD-specific Google Drive folder IDs for storing partner briefs, contracts, and outreach templates.
- Remove irrelevant spreadsheet references (Guest Tracker, Event Pipeline) or replace with BD equivalents.
- Validate the credential path against the actual runtime environment.
- Add a BD meeting calendar or specify which calendar Boldrin uses for partner meetings.

---

## Missing Skills (Not Yet Built)

### 1. partnership-to-event (HANDOFF -- Critical)

**Source:** HANDOFF_MAP.md (Flow #4: BD -> Events)

This is the handoff skill that sends partnership event details from Yana to Suki when a partnership involves co-branded events. HANDOFF_MAP.md defines it completely:

- **Trigger:** "partnership signed with [company]" (also in TRIGGERS.md)
- **Data to send:** Partner company & contact, partnership type, event requirements, branding guidelines, budget/revenue share, timeline
- **Recipient:** Suki (who fast-tracks it through event-inquiry, skipping GO/NO-GO since it is pre-approved via partnership)
- **Status in HANDOFF_MAP.md:** "Not built"
- **Implementation:** Would use `sessions_spawn` to send structured data to Suki's agent

This is the only inter-agent connection Yana has, and it does not exist. Without it, Boldrin has to manually copy partnership event details from a Yana conversation into a Suki conversation.

### 2. partnership-outreach (B2B Outreach)

The current `founder-outreach` skill is narrowly focused on selling NFT memberships to individuals. There is no skill for reaching out to companies/brands for B2B partnerships -- which is the core of what SOUL.md describes as Yana's job (co-living brands, corporate housing, travel platforms, local businesses). A dedicated `partnership-outreach` skill would handle multi-touch B2B outreach sequences with different templates for each partner type.

### 3. partner-management (Post-Deal Tracking)

SOUL.md's workflow lists: "Identify -> Research -> Outreach -> Relationship -> Negotiate -> Close -> **Manage**". There is no skill for the "Manage" phase. Once a partnership is active, there is no mechanism to track performance, schedule check-ins, monitor revenue attribution, or flag partnerships that are underperforming. The deal-pipeline skill covers up to "Active Partnership" but has no post-close management.

### 4. negotiation-framework (Pre-Deal Support)

SOUL.md's workflow includes "Negotiate" as a distinct phase, and the USER.md says Boldrin "handles relationship negotiations." A negotiation-framework skill could prepare Boldrin for negotiations with: comparable deal terms in the market, partner's likely priorities, BATNA analysis, recommended deal structure, and red lines. This would be a research/prep skill, not an autonomous negotiation skill.

### 5. bd-daily-update (Proactive Reporting)

Unlike other agents (Captains have daily-recap, Suki has luma-sync, LOKI has daily-vibe), Yana has no scheduled reporting. A lightweight cron-triggered skill that checks the pipeline sheet for stale deals (no activity in 7+ days), upcoming follow-ups, and deals at risk would give Boldrin a daily BD pulse without him having to ask.

---

## Handoff Connections

### Receives From

| Source Agent | Handoff | Data Received | Status |
|-------------|---------|---------------|--------|
| Wanda | (informal) | Warm leads that could become partnership conversations | **Not formalized** -- no skill, no data format. SOUL.md mentions "Warm introductions from partnerships" as a Wanda collaboration but there is no receiving skill. |
| LOKI | (informal) | Community member profiles who could be partners | **Not formalized** -- SOUL.md mentions "Founder Member network leverage" but no receiving skill exists. |
| ZomadPrime | delegate-task | Samurai can assign BD tasks to Yana via ZomadPrime's delegate-task skill | **Partially built** -- depends on ZomadPrime's skill, not Yana's. |

### Sends To

| Target Agent | Handoff | Data Sent | Status |
|-------------|---------|-----------|--------|
| Suki | partnership-to-event | Partner details, event requirements, branding, budget, timeline | **Not built** (HANDOFF_MAP.md #4) |
| Wanda | (informal) | Cross-sell opportunities, partnership referral leads | **Not formalized** |

### Missing Handoff Connections

1. **Yana -> Suki (partnership-to-event):** Defined in HANDOFF_MAP.md but not implemented. This is the single most important missing piece for Yana.
2. **Wanda -> Yana (lead-to-partnership):** When Wanda encounters a lead that is more of a partnership opportunity than a direct sale, there is no handoff to Yana.
3. **Yana -> ZomadPrime (bd-metrics):** No pipeline data flows up to the morning briefing. ZomadPrime's morning-briefing aggregates Captain data and event data but has no BD data input.
4. **Yana -> Captain (partner-visit):** When a partner is visiting a property (for a tour, a meeting, a co-branded event), the property captain should receive a brief. No such handoff exists.

---

## Data Access Summary

| Data Source | Referenced In | Actually Configured | Access Method | Status |
|-------------|--------------|-------------------|---------------|--------|
| Pipedrive | SOUL.md ("partnership pipeline") | **No.** Not in DATA_SOURCES.md, no API credentials, no env var. | N/A | **Ghost reference** -- remove or implement |
| LinkedIn | SOUL.md ("research") | **No.** No API configured. | Manual or web search | **Aspirational only** |
| Crunchbase | SOUL.md ("research") | **No.** No API configured. | Manual or web search | **Aspirational only** |
| `founder_profiles` (Supabase) | DATA_SOURCES.md (listed under "Read by: founder-outreach") | **Yes** -- Supabase credentials exist (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) | REST API: `GET {SUPABASE_URL}/founder_profiles` | **Available but unused** -- founder-outreach skill does not reference it |
| Google Sheets | google-workspace skill | **Partially.** OAuth credentials exist but no BD-specific sheet IDs are configured. | Google Sheets API v4 | **Infrastructure exists, BD config missing** |
| Google Calendar | google-workspace skill | **Partially.** Shared calendars listed but no BD-specific calendar. | Google Calendar API v3 | **Infrastructure exists, BD config missing** |
| Google Drive | google-workspace skill | **Partially.** No BD folder IDs configured. | Google Drive API v3 | **Infrastructure exists, BD config missing** |
| Gmail | google-workspace skill | **Yes.** OAuth credentials exist. | Gmail API | **Available** -- could be used for outreach sequences |
| Telegram (Boldrin) | DATA_SOURCES.md | **Yes.** Boldrin's ID `817242399` is configured. | OpenClaw gateway | **Working** -- but DMs route to Suki by default, not Yana |
| Laundry List (Google Sheet) | DATA_SOURCES.md | **Yes.** Sheet ID `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI` | Google Sheets API | **Available** -- Yana could read/write BD tasks (Category: `bd`) |
| Guest history | SOUL.md ("potential partner identification") | **Partially.** `pms_bookings` table exists in Supabase. | REST API | **Available but no skill uses it** |

---

## Trigger Consistency Audit

| TRIGGERS.md (User-Facing) | Skill SKILL.md (Internal) | Match? |
|---------------------------|--------------------------|--------|
| "research [company name]" -> partner-research | "research this company", "potential partner", "who is" | Partial -- "research [company]" aligns, but "who is" is too broad |
| "reach out to [name/company]" -> founder-outreach | "NFT outreach", "founder members", "Black Passport" | **Mismatch** -- TRIGGERS.md uses plain English, skill uses crypto jargon |
| "partnership status" / "BD pipeline" -> deal-pipeline | "partnership status", "BD pipeline", "active deals" | Good match |
| "partnership signed with [company]" -> partnership-to-event | Skill does not exist | **Skill not built** |

---

## Key Issues & Recommendations

### Critical Issues

1. **No persistent data store for the BD pipeline.** This is the single biggest problem. The deal-pipeline skill is a report template with no data behind it. Every other operational agent has a Google Sheet or Supabase table backing their core function (Captains have `pms_bookings` + P&L sheets, Suki has `canonical_events` + Rev-Events sheet). Yana has nothing.

   **Recommendation:** Create a BD Pipeline Google Sheet with the column schema defined in deal-pipeline's SKILL.md. Add it to DATA_SOURCES.md. Update deal-pipeline to read/write from it. This is a one-hour fix that transforms Yana from a stateless chatbot into a functional BD agent.

2. **partner-research has no research tools.** The skill describes excellent research methodology but cannot execute any of it. Without web search, LinkedIn, or Crunchbase access, the agent is limited to its training data.

   **Recommendation:** Add explicit `web_search` tool usage instructions to the skill. If the agent runtime supports browser/web-search tools, document how to invoke them. Even basic web search would be a massive improvement over pure LLM generation.

3. **founder-outreach has unresolved pricing placeholders.** If pricing has been decided since the skill was written, update the skill. If pricing is still unresolved, add a hard gate that prevents generating outreach sequences without confirmed pricing.

   **Recommendation:** Boldrin to confirm pricing. Update SKILL.md with actual numbers or a reference to where pricing lives (a Google Doc, a section in SOUL.md, etc.).

### Structural Issues

4. **SOUL.md references Pipedrive; nothing else does.** Pipedrive is listed as the partnership pipeline tool in SOUL.md, but there are no credentials, no API configuration, and no skill that uses it. This creates confusion about what the actual CRM is.

   **Recommendation:** Remove the Pipedrive reference from SOUL.md. Replace with "Google Sheet (BD Pipeline)" once the sheet is created. If Pipedrive is a future plan, note it as such.

5. **Crypto/web3 language throughout founder-outreach.** The skill is titled "Black Passport Membership Sales" and trigger phrases include "NFT outreach." If Zo World has moved away from NFT branding (or if the term confuses Boldrin), this should be updated to plain English: "membership outreach", "founder membership", etc.

   **Recommendation:** Audit whether "Black Passport" and "NFT" are still the public-facing terms. If not, update all references to current branding.

6. **google-workspace is a generic template.** It was likely copied from another workspace without BD customization. The "Key Spreadsheets" section references Guest Trackers and Event Pipeline -- neither of which are relevant to BD.

   **Recommendation:** Customize with BD-specific resource IDs. Remove irrelevant references. Add BD Drive folder for partner briefs and contracts.

### Operational Gaps

7. **No scheduled/proactive reporting.** Every other agent has at least one cron job or heartbeat routine. Yana has `HEARTBEAT.md` explicitly set to "no scheduled heartbeats." This means Boldrin gets zero proactive BD updates unless he asks.

   **Recommendation:** Add a weekly cron (Monday morning) that reads the pipeline sheet and sends Boldrin a quick summary: deals at risk, follow-ups due this week, pipeline value. Low token cost, high operational value.

8. **partnership-to-event handoff is not built.** This is the only defined inter-agent handoff for Yana (HANDOFF_MAP.md #4) and it does not exist. TRIGGERS.md lists "partnership signed with [company]" as a trigger for it.

   **Recommendation:** Build this skill. It is a straightforward `sessions_spawn` call to Suki with structured partner/event data. Template is fully defined in HANDOFF_MAP.md.

9. **No connection to the morning briefing.** ZomadPrime's morning briefing aggregates data from Captains and Suki but has no BD input. Samurai gets zero visibility into the BD pipeline unless he specifically asks Yana.

   **Recommendation:** Once the pipeline sheet exists, add it as a data source for ZomadPrime's morning-briefing skill. Even a one-line summary ("BD pipeline: X active deals, Y at risk, $Z total value") would close this gap.

10. **Yana has no memory of past interactions.** The `memory/` directory does not appear to exist in the workspace. Without daily memory files or MEMORY.md, Yana cannot track conversation history with partners, remember which companies have been researched, or build on prior sessions.

    **Recommendation:** Create `workspaces/bd/memory/` directory. Begin logging significant BD interactions (partner conversations, research completed, deals updated) in daily files. This is standard practice for all other agents per AGENTS.md.

### Priority Ranking

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P1 | Create BD Pipeline Google Sheet + wire deal-pipeline skill | Medium | Transforms Yana from stateless to functional |
| P1 | Add web search to partner-research | Low | Makes research skill actually useful |
| P2 | Build partnership-to-event handoff | Low | Enables the only inter-agent connection |
| P2 | Resolve founder-outreach pricing | Low | Unblocks outreach sequences |
| P2 | Add BD data to morning briefing | Low | Gives Samurai BD visibility |
| P3 | Add weekly BD pipeline cron | Low | Proactive reporting without Boldrin asking |
| P3 | Customize google-workspace for BD | Low | Removes confusion, adds BD resource IDs |
| P3 | Clean up crypto jargon in triggers | Low | Better UX for Boldrin |
| P4 | Build partner-management skill | Medium | Post-deal tracking (currently zero) |
| P4 | Build negotiation-framework skill | Medium | Pre-negotiation prep for Boldrin |
| P4 | Build partnership-outreach (B2B) skill | Medium | Separates B2B outreach from membership sales |

---

## Summary

Yana has a well-defined identity and a clear mandate from SOUL.md, but her four skills are templates without data infrastructure. The core loop -- research a partner, reach out, track the deal, hand off to Suki -- is architecturally sound in the documentation but operationally broken because:

- **partner-research** cannot research (no web search tools).
- **founder-outreach** cannot quote prices (placeholders) and is narrowly focused on NFT membership.
- **deal-pipeline** cannot track deals (no data store).
- **google-workspace** is not configured for BD (no sheet IDs, no folders).
- **partnership-to-event** does not exist (the only inter-agent handoff).

The fix path is clear: create one Google Sheet (pipeline tracker), add web search instructions to partner-research, resolve pricing, and build the Suki handoff. These four changes would take Yana from "well-written documentation with no backend" to "functional BD agent."