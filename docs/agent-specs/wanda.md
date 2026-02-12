# Wanda -- Sales Agent

> Converts leads into bookings and nurtures guest relationships for repeat business

---

## Identity

| Field | Value |
|-------|-------|
| Agent ID | `wanda` |
| Workspace | `workspaces/sales/` |
| Human Partner | Boldrin (BD, Sales & Events Lead) |
| Telegram Handle | @Boldrin71 |
| Telegram ID | `817242399` |
| Role | Lead qualification, outreach sequences, pipeline management, booking conversion, founder-lifestyle marketing |
| Personality | Warm but direct. "Sales is service, not hustle." |
| Escalates To | Boldrin (pricing, VIP, contracts, complex negotiations), ZomadPrime (cross-property, multi-agent, strategic accounts) |
| Sibling Agents | Yana (BD), Suki (Events) -- all share Boldrin as human partner |
| Heartbeat | None. Operates on-demand only. Boldrin triggers tasks as needed. |

### Routing Note

Boldrin's Telegram DMs route to **Suki by default** (per OpenClaw bindings in DATA_SOURCES.md). To reach Wanda, Boldrin must use "agent-specific routing" -- the exact mechanism for this is not documented anywhere. This is a UX gap: Boldrin's primary bot connection goes to Suki, not Wanda, meaning sales tasks require an extra routing step.

---

## Current Skills Inventory

### 1. lead-qualify

| Field | Detail |
|-------|--------|
| **Type** | Manual (on-demand, triggered by Boldrin) |
| **Trigger phrases** | "new lead", "inquiry from", "someone interested" |
| **Data Sources** | None specified. Works from message context only (whatever Boldrin pastes in). |
| **Output** | Structured lead scorecard: Budget/Timeline/Values Fit/Source rated 1-5, total /20, tier assignment (Hot/Warm/Cold/Disqualified), recommended action, suggested approach |
| **Quality Assessment** | **Needs Work** |

**Issues Found:**

1. **No B2B/corporate scoring track.** The entire framework is built for individual travelers (digital nomads, remote workers, founders). There is no scoring rubric for corporate bookings, team offsites, or group stays -- which are higher-value deals that SOUL.md explicitly mentions via collaboration with Yana (BD) on "Corporate leads" and "Strategic accounts." A corporate lead with 15 people for a week-long offsite would be awkwardly scored on individual criteria like "values fit" and "source quality."

2. **No data source integration.** The skill does not read from Supabase (`pms_bookings`), Google Sheets, or any CRM. It relies entirely on whatever information Boldrin copy-pastes into the chat. There is no automatic enrichment -- no check against `founder_profiles` to see if the lead is already a community member, no cross-reference with past booking history in `pms_bookings`.

3. **No persistence.** After scoring a lead, the output is a chat message. There is no instruction to write the score anywhere -- not to Supabase, not to a Google Sheet, not even to a local file. The score exists only in the conversation and cannot be referenced by `pipeline-update` or `outreach-sequence`.

4. **SOUL.md mentions Pipedrive** as a data source for "leads, deals, history." The skill never references Pipedrive. Either Pipedrive is actually in use and the skill ignores it, or SOUL.md is aspirational and Pipedrive was never connected. Either way, there is a mismatch.

**Fix Required:**
- Add a B2B/corporate scoring track with criteria for group size, contract value, partnership potential, and repeat booking likelihood.
- Integrate with `founder_profiles` (Supabase) to auto-detect existing community members.
- Integrate with `pms_bookings` (Supabase) to check for returning guests.
- Add a write step: persist the lead score to a defined data store (Supabase table or Google Sheet) so downstream skills can read it.
- Resolve the Pipedrive question: either integrate it or remove it from SOUL.md.

---

### 2. outreach-sequence

| Field | Detail |
|-------|--------|
| **Type** | Manual (on-demand, triggered by Boldrin) |
| **Trigger phrases** | "send outreach", "follow up", "email sequence" |
| **Data Sources** | None specified. Works from conversation context and the lead's pipeline stage. |
| **Output** | Full email sequences (subject + body) tailored to stage: New Lead (3 emails/7 days), Warm Lead (2 emails/5 days), Hot Lead (2 emails/3 days), Stalled Lead (1 email) |
| **Quality Assessment** | **Needs Work** |

**Issues Found:**

1. **Does not specify how to actually send emails.** The skill generates email copy but has no instruction to invoke `google-workspace` Gmail APIs to send or draft the emails. The output is formatted text in chat -- Boldrin would need to manually copy-paste into Gmail. The `google-workspace` skill has full Gmail send/draft capability (`POST .../messages/send`, `POST .../drafts`) but `outreach-sequence` never references it.

2. **No send-from address specified.** Even if Gmail integration were added, the skill does not specify which email address to send from (e.g., `sales@zohouse.co`, `boldrin@zohouse.co`, or a generic `hello@zohouse.co`).

3. **No tracking or state.** The skill does not track which emails have been sent to which leads, when, or what stage the lead was at. If Boldrin says "follow up with Priya," Wanda has no way to know what was already sent without Boldrin providing full context again.

4. **No connection to lead-qualify output.** The skill says it generates sequences "based on lead pipeline stage" but has no mechanism to read the lead's score or tier from `lead-qualify`. It depends on Boldrin stating the stage manually.

5. **WhatsApp gap.** SOUL.md mentions "Email (outreach)" but the Indian market heavily favors WhatsApp for sales communication. There is no WhatsApp outreach template or integration.

**Fix Required:**
- Add explicit integration with `google-workspace` Gmail: after generating the sequence, offer to create drafts or send emails via the Gmail API.
- Specify the send-from address.
- Add a tracking mechanism (Supabase table or Google Sheet) to log: lead name, email sent, date, stage, sequence position.
- Read lead-qualify output from persistent storage instead of relying on conversational context.
- Consider adding WhatsApp message templates for the Indian market.

---

### 3. pipeline-update

| Field | Detail |
|-------|--------|
| **Type** | Manual (on-demand, triggered by Boldrin) |
| **Trigger phrases** | "pipeline status", "deal update", "how are sales" |
| **Data Sources** | "Pull from Supabase if available (zo-api on port 3001). If Supabase data is not available, work from the most recent manual pipeline update." |
| **Output** | Pipeline summary: active deals by stage, weighted revenue forecast, stalled deal alerts, wins/losses, top priorities |
| **Quality Assessment** | **Weak** |

**Issues Found:**

1. **Supabase has no sales pipeline table.** The DATA_SOURCES.md registry lists these Supabase tables: `pms_bookings`, `housekeeping_staff`, `housekeeping_sessions`, `daily_performance`, `canonical_events`, `event_registrations`, `event_inquiries`, `founder_profiles`. None of these is a sales pipeline or deals table. The skill says "Pull from Supabase if available" but there is nothing to pull. There is no `deals`, `leads`, or `pipeline` table.

2. **The fallback is undefined.** When Supabase has no data (which is always, given the missing table), the skill says "work from the most recent manual pipeline update." But what is a "manual pipeline update"? A chat message? A file? A Google Sheet? This is not defined anywhere. There is no Google Sheet ID for a sales pipeline tracker in DATA_SOURCES.md.

3. **SOUL.md says Pipedrive.** The SOUL.md file lists "Pipedrive (leads, deals, history)" as a primary data source. The skill completely ignores Pipedrive and mentions only Supabase. If Pipedrive is the actual source of truth, this skill should be reading from the Pipedrive API -- but there is no Pipedrive API key, no Pipedrive integration documented anywhere, and no Pipedrive entry in DATA_SOURCES.md.

4. **No write path.** Even if Wanda could read pipeline data, there is no mechanism to update deal stages. When Boldrin says "moved Acme Corp to Negotiation," where does that get written?

5. **Revenue weighting is defined but data is not.** The skill has well-defined stage probabilities (New=10%, Qualified=25%, etc.) but no actual deal values to apply them to.

**This skill is effectively non-functional.** It describes a reporting format but has no real data source to report from.

**Fix Required:**
- CRITICAL: Decide the pipeline data store. Options: (a) create a Supabase `sales_pipeline` table, (b) create a dedicated Google Sheet for the sales pipeline, or (c) integrate with Pipedrive. Pick one and document it in DATA_SOURCES.md.
- Add both read and write operations for the chosen data store.
- Remove or deprecate the Pipedrive reference in SOUL.md if Pipedrive is not being used.
- Add a cron or heartbeat trigger for automated weekly pipeline reports to Boldrin.

---

### 4. founder-marketing

| Field | Detail |
|-------|--------|
| **Type** | Manual (on-demand, triggered by Boldrin) |
| **Trigger phrases** | "market rooms", "founder experience", "live the day" |
| **Data Sources** | None. Pure copywriting skill using internal positioning guidelines. |
| **Output** | Marketing copy for LinkedIn, Instagram, and listing platforms (Booking.com, Hostelworld, website), structured by target audience and content theme |
| **Quality Assessment** | **Strong** |

**Issues Found:**

1. **No coordination with LOKI to avoid duplicate content.** LOKI (Vibe Curator) has a `content-calendar` skill and a `daily-vibe` skill that also produce community-facing content. The HANDOFF_MAP.md shows no content coordination flow between Wanda and LOKI. Both agents could independently post about "A Day at Zo" or spotlight the same community member on the same day. There is no shared content calendar, no deconfliction mechanism.

2. **Bangalore-only focus.** The content themes and ecosystem references are entirely Bangalore-centric ("Bangalore startup ecosystem", "Why Bangalore is the best city for founders"). WTFxZo (Whitefield) gets no marketing attention. The skill should have property-specific positioning (Whitefield = retreat/creative energy vs Bangalore = startup/hustle).

3. **No publishing mechanism.** Like outreach-sequence, this skill generates copy but has no way to actually publish it. No LinkedIn API, no Instagram API, no integration to update listing platforms. The output is text in chat for Boldrin to manually post.

4. **No performance tracking.** There is no feedback loop. The skill does not track which content performed well, what CTAs converted, or which audiences responded. Without this, the "rotate through themes" instruction is arbitrary rather than data-driven.

**Fix Required:**
- Add a shared content calendar (Google Sheet or Supabase table) that both Wanda and LOKI reference before creating content, to avoid overlap.
- Add WTFxZo (Whitefield) positioning templates alongside Bangalore content.
- Consider integration with LinkedIn API for direct posting (or at minimum, draft creation via Google Docs that Boldrin can review and post).
- Long-term: add conversion tracking to measure which marketing copy drives actual bookings.

---

### 5. google-workspace

| Field | Detail |
|-------|--------|
| **Type** | Utility / Integration layer |
| **Trigger phrases** | Calendar: "add to calendar", "schedule"; Drive: "upload to drive", "find in drive"; Sheets: "update sheet", "read spreadsheet"; Docs: "create doc"; Gmail: "send email", "check email", "draft email" |
| **Data Sources** | Google APIs (Calendar v3, Drive v3, Sheets v4, Docs v1, Gmail v1) via OAuth 2.0 |
| **Output** | API responses from Google services |
| **Quality Assessment** | **Needs Work** |

**Issues Found:**

1. **Generic copy-paste, not sales-specific.** This skill is identical boilerplate that could exist in any workspace. It contains no sales-specific configuration: no Wanda-specific calendar IDs, no sales pipeline sheet IDs, no email templates folder, no draft conventions. The "Key Spreadsheets" section says "Check workspace docs for ID" four times -- the IDs are never filled in.

2. **Authentication path may be incorrect.** The skill references credentials at `zo-api/client_secret_...json` and `zo-api/token.json`. DATA_SOURCES.md says credentials are at `C:\Users\user\.openclaw\` and `C:\Users\user\.credentials\` (Windows paths) or `/home/conscious-house/.credentials/` (legacy Linux). The paths do not match the current macOS environment (`/Users/samuraizan/...`). Authentication may fail silently.

3. **No sales-specific email configuration.** Gmail capability is documented but there is no specification of: which email account Wanda sends from, what signature to use, what the "From" display name should be, or whether emails should come from a shared sales inbox vs Boldrin's personal account.

4. **Shared calendar IDs are listed but not contextualized.** The skill lists `zo-events@zohouse.co`, `zo-blr@zohouse.co`, `zo-wtf@zohouse.co` but does not explain when Wanda should use which. For example, should discovery calls go on `zo-blr@zohouse.co` or Boldrin's personal calendar?

**Fix Required:**
- Customize this skill for the sales workspace: add specific Sheet IDs for the sales pipeline (once created), specific calendar IDs for discovery calls, email send-from configuration.
- Verify and update the credential file paths for the current environment.
- Add a sales email signature template.
- Remove or annotate the placeholder "Check workspace docs for ID" entries with actual IDs.

---

## Missing Skills (Not Yet Built)

### CRITICAL: sale-to-ops (Handoff Skill)

**Status in HANDOFF_MAP.md:** "Not built" (row 1 of the Implementation Checklist)

This is the single most important missing skill in Wanda's inventory. Per HANDOFF_MAP.md, when a booking is confirmed, Wanda must send structured data to both the property Captain (BLRxZo JR or WTFxZo JR) and LOKI:

**To Captain:** Guest name, dates, property, room type, payment status, booking source, founder member status, special requests.

**To LOKI:** Guest name, arrival date, property, founder member status, interests, action items (welcome message, WhatsApp group, community intro).

**Trigger:** Boldrin says "booking confirmed for [name]" or cron detects a new `pms_bookings` row in Supabase.

**Why this is critical:** Without sale-to-ops, a confirmed booking creates zero downstream action. The Captain does not know a guest is coming. LOKI does not prepare a welcome. The guest arrives with no preparation, no personalized onboarding, and the "Sales is service" philosophy breaks at the most important moment -- the transition from prospect to guest.

**What it needs to do:**
1. Read booking details from `pms_bookings` (Supabase) or from Boldrin's confirmation message.
2. Format the data into the two structured payloads defined in HANDOFF_MAP.md.
3. Use `sessions_spawn` to send the Captain payload to the correct property agent (`blrxzo-jr` or `wtfxzo-jr`).
4. Use `sessions_spawn` to send the LOKI payload to trigger `new-guest-onboard`.
5. Update the pipeline entry to "Closed Won" in whatever data store is chosen.
6. Send confirmation to Boldrin via Telegram.

---

### MISSING: discovery-call

**Referenced in:** TRIGGERS.md ("prep for call with [name]" -> `discovery-call` -> "Pre-call brief: guest profile, pricing options, key questions")

**Status:** Skill file does not exist in `workspaces/sales/skills/`.

**What it should do:**
1. Pull lead context from the pipeline data store.
2. Pull any past booking history from `pms_bookings` (returning guest detection).
3. Pull property availability from `pms_bookings` (open date ranges).
4. Generate a pre-call brief: lead profile summary, scoring from lead-qualify, pricing options by room type and duration, key questions to ask, objections to anticipate.
5. Optionally schedule the call on Google Calendar via `google-workspace`.

---

### MISSING: repeat-guest-nurture

**Referenced in:** SOUL.md ("Repeat booking rate" as a key metric; collaboration with LOKI on "Repeat guest identification" and "Referral program")

**Status:** No skill file exists. No reference in TRIGGERS.md.

**What it should do:**
1. Query `pms_bookings` for guests with 2+ stays.
2. Cross-reference with `founder_profiles` for membership status.
3. Generate personalized re-engagement outreach (different from cold outreach-sequence).
4. Track repeat booking conversion rate.
5. Coordinate with LOKI for referral program integration.

---

### MISSING: upsell-playbook

**Referenced in:** SOUL.md (collaboration with Suki on "Experience upsells"; collaboration with LOKI on "Guest satisfaction insights")

**Status:** No skill file exists. No reference in TRIGGERS.md.

**What it should do:**
1. Identify upsell opportunities for confirmed guests: room upgrades, extended stays, event tickets, founder memberships.
2. Pull upcoming events from `canonical_events` (Supabase) to suggest event add-ons.
3. Generate upsell messaging tied to the guest's profile and booking context.
4. Track upsell revenue separately.

---

## Handoff Connections

### Receives From

| Source Agent | Handoff | Data Received | Status |
|-------------|---------|--------------|--------|
| Yana (BD) | Partner referrals, corporate leads | Warm leads from partnerships | **Informal only** -- no structured handoff skill exists from Yana to Wanda. HANDOFF_MAP.md defines `partnership-to-event` (Yana -> Suki) but has no `partnership-to-sales` equivalent. |
| Suki (Events) | Event attendee leads | Attendees interested in staying | **Informal only** -- no structured handoff exists. |
| Website / Listing Platforms | Inbound inquiries | Raw lead data | **Manual** -- Boldrin copy-pastes into chat. No automated intake. |

### Sends To

| Target Agent | Handoff | Data Sent | Status |
|-------------|---------|-----------|--------|
| Captain (BLRxZo JR / WTFxZo JR) | `sale-to-ops` | Booking confirmation: guest name, dates, room, payment, requests | **NOT BUILT** |
| LOKI | `sale-to-ops` | Incoming guest notice: name, arrival, property, interests | **NOT BUILT** |
| ZomadPrime | Pipeline status (via morning-briefing consumption) | Revenue forecasts, deal velocity | **NOT BUILT** -- ZomadPrime's morning-briefing reads from Captains and Sheets, but has no Wanda data feed. |

### Missing Handoff Flows

| Flow | Description | Impact |
|------|-------------|--------|
| Yana -> Wanda | Partnership-generated leads need structured handoff to sales pipeline | Corporate/partnership leads may fall through cracks |
| Suki -> Wanda | Event attendee conversion. When someone at a Zo event expresses interest in staying, that lead should land in Wanda's pipeline. | Lost conversion opportunity from events to bookings |
| Wanda -> ZomadPrime | Sales pipeline data for morning-briefing roll-up. Currently ZomadPrime has no visibility into sales health. | Samurai has no sales visibility in the daily brief |
| Captain -> Wanda | Post-stay feedback loop. When a guest checks out, satisfaction data should flow back to Wanda for repeat-guest-nurture. | No closed-loop guest lifecycle |

---

## Data Access Summary

| Data Source | Table / Sheet | Access Type | Used By Skill | Status |
|------------|--------------|-------------|---------------|--------|
| Supabase | `pms_bookings` | Read | pipeline-update (claimed), sale-to-ops (needed) | **Not actually used.** pipeline-update claims Supabase but there is no pipeline table. pms_bookings exists but is for PMS data, not sales pipeline. |
| Supabase | `founder_profiles` | Read | lead-qualify (needed for enrichment) | **Not connected.** Would enable automatic founder member detection during lead scoring. |
| Supabase | `canonical_events` | Read | upsell-playbook (needed) | **Not connected.** Would enable event-based upselling. |
| Supabase | Sales pipeline table | Read/Write | pipeline-update, lead-qualify, outreach-sequence | **TABLE DOES NOT EXIST.** This is the biggest data gap. |
| Google Sheets | Sales pipeline sheet | Read/Write | pipeline-update (as fallback) | **SHEET DOES NOT EXIST.** No Sheet ID in DATA_SOURCES.md. |
| Google Sheets | Laundry List (`1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI`) | Read/Write | Task management | **Available** but not referenced by any Wanda skill. |
| Google Calendar | `zo-events@zohouse.co` | Read/Write | discovery-call scheduling (needed) | **Available** via google-workspace but unused by Wanda. |
| Google Calendar | `zo-blr@zohouse.co` / `zo-wtf@zohouse.co` | Read | Availability checking (needed) | **Available** via google-workspace but unused by Wanda. |
| Gmail | Zo House account | Read/Write | outreach-sequence (needed for sending) | **Available** via google-workspace but outreach-sequence does not invoke it. |
| Pipedrive | Leads, deals, history | Read/Write | SOUL.md claims usage | **UNVERIFIED.** No API key in DATA_SOURCES.md, no env var, no skill references it. Likely aspirational or abandoned. |
| LinkedIn | Prospect research | Read | SOUL.md claims usage | **UNVERIFIED.** No API integration exists. |
| Telegram | Bot messages to Boldrin (`817242399`) | Write | Pipeline alerts, updates | **Available** via OpenClaw but no Wanda skill uses it for proactive notifications. |

---

## Key Issues and Recommendations

### P0 -- Critical (Blocks core functionality)

**1. No persistent sales data store exists.**

Every sales skill assumes data that does not exist. `pipeline-update` cannot report on a pipeline that is not stored anywhere. `lead-qualify` scores vanish after the conversation ends. `outreach-sequence` cannot track what was sent. This is the root cause of most issues.

**Recommendation:** Create a `sales_pipeline` table in Supabase with columns: `id`, `lead_name`, `email`, `phone`, `source`, `property`, `lead_score`, `tier`, `pipeline_stage`, `deal_value`, `created_at`, `updated_at`, `last_activity`, `notes`, `assigned_to`. Add the table to DATA_SOURCES.md. Update `lead-qualify` to write scores, `pipeline-update` to read/write stages, and `outreach-sequence` to log sent emails.

**2. sale-to-ops handoff does not exist.**

This is the single handoff that connects sales revenue to operational delivery. Without it, confirmed bookings create no downstream action.

**Recommendation:** Build `sale-to-ops` as the highest-priority new skill. Spec is fully defined in HANDOFF_MAP.md -- it just needs implementation.

### P1 -- High (Degrades effectiveness significantly)

**3. discovery-call skill is missing.**

TRIGGERS.md promises "prep for call with [name]" functionality. Boldrin expects it. It does not exist.

**Recommendation:** Build `discovery-call` skill. It should pull from the new pipeline data store, `pms_bookings` (for returning guests), and property availability data.

**4. outreach-sequence generates copy but cannot send it.**

The skill produces email sequences but has no connection to Gmail. Boldrin must manually copy-paste every email.

**Recommendation:** Add a step at the end of outreach-sequence that asks "Create as Gmail draft?" and, if confirmed, uses `google-workspace` Gmail draft API to create the email ready for Boldrin's review and send.

**5. Routing to Wanda is unclear.**

Boldrin's Telegram DMs default to Suki. How does he reach Wanda? The TRIGGERS.md section says "messages through the main bot or uses agent-specific routing" but this mechanism is not documented.

**Recommendation:** Document the exact Telegram command or routing mechanism for Boldrin to switch between Suki, Wanda, and Yana. Consider adding trigger-word-based routing (e.g., any message containing "lead", "pipeline", "outreach" auto-routes to Wanda).

### P2 -- Medium (Improvements that would add significant value)

**6. No B2B/corporate lead scoring track.**

Zo House hosts team offsites, corporate retreats, and group bookings. The lead-qualify skill only scores individuals.

**Recommendation:** Add a parallel corporate scoring rubric: group size, contract value, company fit with Zo values, event potential, repeat booking likelihood.

**7. Wanda has no content coordination with LOKI.**

Both agents produce marketing/community content independently with no deconfliction.

**Recommendation:** Create a shared content calendar (Google Sheet) that both Wanda and LOKI read/write to before creating content.

**8. google-workspace skill is uncustomized.**

The skill is generic boilerplate with placeholder IDs. It works in theory but gives Wanda no sales-specific shortcuts.

**Recommendation:** Fill in actual Sheet IDs (once the pipeline sheet is created), set the default send-from email address, add Boldrin's calendar ID, remove placeholder text.

**9. Founder marketing is Bangalore-only.**

WTFxZo (Whitefield property) receives no marketing attention in the founder-marketing skill.

**Recommendation:** Add Whitefield-specific positioning: retreat vibe, creative energy, beach lifestyle for founders, contrast with Bangalore's startup hustle.

### P3 -- Nice to Have (Future enhancements)

**10. No repeat-guest-nurture or upsell-playbook skills.**

These would close the guest lifecycle loop and increase revenue per guest.

**11. No automated pipeline alerts.**

Wanda could use cron/heartbeat to proactively notify Boldrin of stalled deals, expiring proposals, or new high-score leads rather than waiting for him to ask.

**12. Pipedrive reference should be resolved.**

SOUL.md lists Pipedrive as a primary data source. If it is not being used, remove it. If it is, integrate it properly and add credentials to DATA_SOURCES.md.

---

## Audit Summary

| Metric | Value |
|--------|-------|
| Total skills defined | 5 |
| Skills functional as-is | 1 (founder-marketing -- generates useful copy, though with gaps) |
| Skills partially functional | 3 (lead-qualify, outreach-sequence, pipeline-update -- produce output but lack data persistence and integrations) |
| Skills that are generic/uncustomized | 1 (google-workspace) |
| Skills referenced in TRIGGERS.md but missing | 2 (discovery-call, sale-to-ops) |
| Skills needed but not referenced anywhere | 2 (repeat-guest-nurture, upsell-playbook) |
| Critical handoffs not built | 1 (sale-to-ops) |
| Missing handoff flows (inbound) | 2 (Yana -> Wanda, Suki -> Wanda) |
| Missing handoff flows (outbound) | 2 (Wanda -> ZomadPrime, Captain -> Wanda feedback loop) |
| Data sources claimed in SOUL.md | 5 (Pipedrive, Google Calendar, Email, LinkedIn, Guest history) |
| Data sources actually connected | 0 |

**Bottom line:** Wanda is a well-designed agent with clear identity, good skill templates, and thoughtful sales philosophy -- but she is operating almost entirely from conversational context with no persistent data layer, no integrations, and no handoff connections. She is a sales agent without a CRM, an email writer without an inbox, and a pipeline manager without a pipeline. The fix order should be: (1) create the sales data store, (2) build sale-to-ops, (3) build discovery-call, (4) wire outreach-sequence to Gmail, (5) everything else.