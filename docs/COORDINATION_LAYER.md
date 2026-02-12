# Coordination Layer — The Plan

> How to make every agent genuinely useful to their human partner through well-crafted skills and seamless agent-to-agent handoffs, all triggered via natural Telegram conversation.

---

## Philosophy

The agents exist to **remove cognitive load from humans**, not add it. Every skill should pass this test:

1. **Can the human trigger it naturally?** — No memorized commands. Say what you mean.
2. **Does the agent know exactly what to do?** — No ambiguity. Every step, data source, and output is explicit.
3. **Does the human know what to do next?** — Output is actionable, not just informational.
4. **Does it connect to the right people?** — When one agent's output is another agent's input, the handoff is automatic.

If a skill fails any of these, it's not ready.

---

## Current State (Audit Summary)

### What Exists
- 7 agents, 45 skill files
- Agents communicate via Telegram (OpenClaw gateway)
- Skills are markdown files — Claude reads them as instructions
- Cron scheduler triggers time-based skills (morning briefs, syncs)

### What's Broken
- **Data sources are vague** — skills say "check Google Sheets" without specifying which sheet, tab, row, or column
- **No error handling** — if an API is down, the skill fails silently
- **No handoffs** — agents work in silos; information doesn't flow between them
- **Inconsistent triggers** — same concept, different phrases across agents
- **Placeholders in production** — some skills literally cannot run
- **google-workspace is copy-pasted** across all agents with zero customization

### Quality Tiers
- **Strong (14 skills):** Can use today with minor fixes
- **Needs Work (12 skills):** Fixable with data source clarification and error handling
- **Weak/Broken (5+ skills):** Need complete rewrites

---

## The Rewrite Plan

### Skill File Format v2

Every skill will follow this structure:

```markdown
---
name: skill-id
description: One-line summary of what this does
category: report | action | triage | sync | handoff
---

## When This Runs
How the skill is triggered:
- Natural phrases the human would say
- Scheduled triggers (cron/heartbeat)
- Automatic triggers from other skills (handoffs)

## What You Need
Data sources with EXACT references:
- Which Google Sheet (ID), which tab, which cells
- Which API endpoint, which auth key, which parameters
- Which file path, which format
- Fallback if data is unavailable

## Steps
Numbered, unambiguous steps. Each step has:
1. What to do
2. Where to get the data
3. What to do if it fails

## Output
Exact template the human will receive via Telegram.
Every field has a source. No mysteries.

## Handoffs
What happens after this skill runs:
- Which agent gets notified
- What data they receive
- What they're expected to do with it

## Escalation
When to involve the human partner instead of proceeding autonomously.
Clear thresholds — not vibes.
```

### Categories Explained

| Category | Purpose | Trigger Type | Example |
|----------|---------|-------------|---------|
| **Report** | Human asks, agent delivers information | On-demand or scheduled | morning-briefing, daily-recap, pipeline-update |
| **Action** | Human requests something done | On-demand | log-expense, send-outreach, create-invoice |
| **Triage** | Human reports a situation, agent classifies and routes | On-demand | maintenance-triage, lead-qualify |
| **Sync** | Agent pulls from external system automatically | Scheduled | luma-sync, typeform-sync |
| **Handoff** | One agent passes structured data to another | Automatic | sale-closed → guest-brief, event-confirmed → ops-prep |

---

## Agent-by-Agent Rewrite Plan

### ZomadPrime (Director) — Samurai's Agent

**Role:** Strategic oversight. Single pane of glass across all properties and agents.

**What Samurai needs:**
- Morning brief he can read in 60 seconds that highlights ANOMALIES, not just status
- Ability to delegate tasks to any agent with one message
- Weekly scorecard with trends, not just snapshots
- Alerts when metrics fall below thresholds (don't wait for him to ask)
- Cross-property comparison on demand

**Skills to rewrite:**

| Skill | Status | What's Wrong | Fix |
|-------|--------|-------------|-----|
| morning-briefing | Weak | Data collection is vague, no anomaly detection, too long | Rewrite with exact data sources, add vs-yesterday comparison, cap at 15 lines |
| delegate-task | Needs Work | No example, context guidance is vague | Add 3 concrete examples, specify context rules |
| task-manager | Needs Work | Shared sheet, race condition risk | Add locking/conflict detection, clarify ownership |
| weekly-scorecard | Needs Work | Subjective scoring, no trends | Add previous-week comparison, anchor scores to measurable outcomes |
| skill-sync | Needs Work | Manual, no versioning | Add sync log, verify target agent context before copying |
| google-workspace | Weak | Generic copy-paste | Rewrite for director context: which calendars, which sheets, which folders |

**Skills to add:**

| Skill | Category | Purpose |
|-------|----------|---------|
| metrics-alert | report | Auto-trigger when occupancy < 80%, revenue drops > 10% vs prior week, or blockers age > 48h |
| cross-property-compare | report | Side-by-side BLR vs Goa: occupancy, revenue, events, guest satisfaction |
| agent-health-check | report | Which agents responded in last 24h, which cron jobs ran, which failed |

---

### BLRxZo JR (Captain) — Darshan's Agent

**Role:** Property operations for Bangalore. 12-hour shift support.

**What Darshan needs:**
- Morning checklist he can work through physically
- Quick expense logging without friction
- Guest check-in/out that actually talks to Eezee PMS
- Maintenance triage that routes to real vendors
- End-of-day summary he can hand off to night staff

**Skills to rewrite:**

| Skill | Status | What's Wrong | Fix |
|-------|--------|-------------|-----|
| morning-audit | Needs Work | Sheet references are fragile (row numbers), emoji status risky | Use named ranges or column headers, add text fallback for status |
| daily-recap | Strong but Fragile | Supabase credentials hardcoded, Luma key wrong for WTFxZo | Parameterize credentials per property, add error handling |
| financial-entry | Needs Work | Approval logic ambiguous, write path assumes helper script | Clarify approval thresholds, document actual write method |
| guest-flow | Strong but Incomplete | Eezee PMS integration vague, WhatsApp group overlap with LOKI | Specify exact Eezee steps OR acknowledge manual, clarify who adds to WhatsApp |
| maintenance-triage | Strong | Vendor list missing, cost thresholds inconsistent with financial-entry | Create vendor directory, align Rs thresholds across skills |
| staff-report | Needs Work | Supabase tables assumed, missing from WTFxZo | Verify table existence, create WTFxZo version |
| google-workspace | Weak | Generic | Rewrite for BLRxZo: specific sheet IDs, calendar names, shared drives |

**Skills to add:**

| Skill | Category | Purpose |
|-------|----------|---------|
| shift-handoff | handoff | Structured end-of-shift → night staff: pending issues, expected check-ins, maintenance in progress |
| vendor-directory | report | Searchable list of approved vendors by category with contact info, response SLA, cost history |
| incoming-guest-brief | handoff | Auto-triggered when Wanda closes a booking: guest name, dates, preferences, special requests |

---

### WTFxZo JR (Captain) — Akhilesh's Agent

**Role:** Property operations for Goa. Event-heavy property (97% revenue from events).

**What Akhilesh needs:**
- Same operational skills as BLRxZo JR but tuned for event-heavy property
- Event prep checklists when Suki confirms events
- Stronger integration with Suki for venue management

**Skills to rewrite:** Mirror BLRxZo JR fixes, plus:

| Skill | Status | What's Wrong | Fix |
|-------|--------|-------------|-----|
| daily-recap | Needs Work | Uses BLRxZo Luma API key instead of WTFxZo key | Fix API key reference |
| All skills | Missing | No staff-report skill | Create WTFxZo version |

**Skills to add:**

| Skill | Category | Purpose |
|-------|----------|---------|
| event-prep-checklist | handoff | Auto-triggered when Suki confirms event: venue setup, AV requirements, catering, staffing needs |
| shift-handoff | handoff | Same as BLRxZo |
| vendor-directory | report | Goa-specific vendors |

---

### Suki (Events) — Boldrin's Agent

**Role:** Complete event lifecycle — pre, during, post.

**What Boldrin needs:**
- Quick event inquiry assessment with actual pricing
- Day-of coordination (currently missing entirely)
- Revenue tracking that feeds into captain financials
- Post-event recap that's ready to post

**Skills to rewrite:**

| Skill | Status | What's Wrong | Fix |
|-------|--------|-------------|-----|
| event-inquiry | Needs Work | No rate card, Typeform trigger undefined | Create rate card section, define Typeform polling schedule |
| luma-sync | Needs Work | No error handling, API pagination fragile | Add retry logic, validate date params, handle 429 rate limits |
| rev-tracking | Needs Work | Helper script assumed, unclear sheet ownership | Document actual write method, specify which sheet owns event revenue |
| event-marketing | Strong | Minor: LOKI dependency for graphics not formalized | Add explicit handoff to LOKI for cover image |
| event-recap | Strong | Data dependency on rev-tracking timing | Specify: run rev-tracking first, then recap |
| invoice-maker | Strong | GSTIN hardcoded, invoice counter location unknown | Move GSTIN to config, specify counter storage |
| google-workspace | Weak | Generic | Rewrite for events: event calendar, vendor sheets, marketing folders |

**Skills to add:**

| Skill | Category | Purpose |
|-------|----------|---------|
| day-of-event | action | Real-time coordination: attendee check-in, issue triage, live headcount, photographer coordination |
| event-to-ops | handoff | When event is confirmed → send prep requirements to property captain (BLRxZo or WTFxZo) |
| host-followup | action | Post-event: thank host, collect feedback, pitch repeat booking |
| rate-card | report | Current venue rates by day/time/event type — single source of truth for event-inquiry |

---

### Wanda (Sales) — Boldrin's Agent

**Role:** Lead qualification, pipeline management, booking conversion.

**What Boldrin needs:**
- Quick lead scoring when inquiries come in
- Outreach sequences that actually send (not just draft)
- Pipeline visibility across all deal stages
- Conversion from lead → booking → guest handoff to captains

**Skills to rewrite:**

| Skill | Status | What's Wrong | Fix |
|-------|--------|-------------|-----|
| lead-qualify | Strong | No B2B/corporate track | Add corporate scoring path alongside individual |
| outreach-sequence | Strong | Doesn't specify how to send emails | Add explicit "use google-workspace to send via Gmail" step |
| pipeline-update | Needs Work | Supabase reference unclear, no fallback | Specify actual data source (Sheets or Supabase), document access |
| founder-marketing | Strong | No content calendar, no coordination with LOKI | Add posting schedule, add LOKI review step for community content |
| google-workspace | Weak | Generic | Rewrite for sales: CRM sheet, outreach templates folder, booking calendar |

**Skills to add:**

| Skill | Category | Purpose |
|-------|----------|---------|
| sale-to-ops | handoff | When booking is confirmed → send guest brief to property captain + LOKI (name, dates, preferences, payment status) |
| discovery-call | action | Pre-call prep, key questions, objection handling, qualification signals, post-call logging |
| repeat-guest-nurture | action | Identify past guests approaching anniversary/return window, send personalized re-engagement |
| upsell-playbook | action | When to offer event access, longer stays, community membership, founder passport |

---

### LOKI (Vibe Curator) — Pooja's Agent

**Role:** Community building, guest experience, cultural programming.

**What Pooja needs:**
- Daily vibe that actually pulls real activity data
- Guest onboarding that coordinates with captains (not duplicates)
- Community health tracking with re-engagement triggers
- Consent culture enforcement (promised in SOUL, missing in skills)

**Skills to rewrite:**

| Skill | Status | What's Wrong | Fix |
|-------|--------|-------------|-----|
| guest-welcome | Strong | WhatsApp group overlap with captain guest-flow | Clarify: captain handles PMS/admin, LOKI handles community/vibe. Only LOKI adds to WhatsApp group |
| daily-vibe | Strong | Data sources unspecified, no fallback for empty days | Specify: check Luma + Google Calendar. If nothing, suggest impromptu activities |
| city-event | Strong | Budget authority unclear, no post-event feedback | Add cost approval thresholds, add feedback collection step |
| community-pulse | Strong | Data tracking location unspecified | Specify: track in community health sheet (create if needed) |
| google-workspace | Weak | Generic | Rewrite for vibe: community calendar, content library, guest roster |

**Skills to add:**

| Skill | Category | Purpose |
|-------|----------|---------|
| consent-check | action | Before posting photos/content: verify consent was collected. Before adding to groups: confirm opt-in. Template for consent requests |
| new-guest-onboard | handoff | Auto-triggered by captain check-in: receive guest name + interests, send welcome message, add to WhatsApp, schedule intro |
| re-engage-quiet | action | Weekly scan of WhatsApp activity. Members silent > 7 days get personal check-in. Members silent > 30 days get re-engagement offer |
| content-calendar | report | Weekly content plan: which themes, which platforms, which property stories. Coordinates with Wanda's founder-marketing |

---

### Yana (BD) — Boldrin's Agent

**Role:** Strategic partnerships, founder outreach, deal pipeline.

**What Boldrin needs:**
- Research that's actually actionable (not just information dumps)
- Outreach with real pricing (no placeholders)
- Pipeline tracking connected to a real system
- Post-signature partnership management

**Skills to rewrite:**

| Skill | Status | What's Wrong | Fix |
|-------|--------|-------------|-----|
| partner-research | Strong | No specified data sources (web, LinkedIn, Crunchbase) | Add explicit research sources and search methodology |
| founder-outreach | Weak | Pricing is PLACEHOLDER, triggers are crypto jargon | Fill in real pricing OR create approval step, rename triggers to plain English |
| deal-pipeline | Needs Work | No actual CRM integration | Specify: use Google Sheet as CRM (create template), add pipeline sheet ID |
| google-workspace | Weak | Generic | Rewrite for BD: partnership tracker sheet, outreach templates, contracts folder |

**Skills to add:**

| Skill | Category | Purpose |
|-------|----------|---------|
| partner-management | action | Post-signature lifecycle: payment tracking, deliverable checklist, quarterly review, renewal timeline |
| partnership-to-event | handoff | When partnership involves co-branded events → send brief to Suki with partner requirements, branding guidelines |
| negotiation-framework | action | Non-negotiables vs flexible terms, standard contract clauses, approval thresholds for discounts |

---

## The Handoff Map

This is the coordination layer — how agents pass work to each other automatically.

```
SALES FLOW
Wanda: lead-qualify → outreach-sequence → discovery-call → pipeline-update
  ↓ (booking confirmed)
  sale-to-ops ─────→ BLRxZo/WTFxZo: incoming-guest-brief
       │
       └──────────→ LOKI: new-guest-onboard

EVENT FLOW
Suki: event-inquiry → event-marketing → day-of-event → event-recap → rev-tracking
  ↓ (event confirmed)
  event-to-ops ────→ BLRxZo/WTFxZo: event-prep-checklist
       │
       └──────────→ LOKI: event-vibe-plan (atmosphere, music, decor)

BD FLOW
Yana: partner-research → founder-outreach → deal-pipeline
  ↓ (partnership signed)
  partnership-to-event → Suki: co-branded event planning
       │
       └──────────→ Wanda: partner leads for sales pipeline

DAILY OPS FLOW
Captains: morning-audit → [throughout day] → daily-recap → shift-handoff
  ↓ (data feeds up)
  ZomadPrime: morning-briefing (aggregates all captain data)
       │
       └──────────→ weekly-scorecard (weekly rollup)

COMMUNITY FLOW
LOKI: daily-vibe → guest-welcome → community-pulse
  ↓ (low engagement detected)
  re-engage-quiet → personal outreach
       │
       └──────────→ ZomadPrime: metrics-alert (if community health drops)
```

---

## Data Source Registry

Every skill must reference data from this canonical list. No more mystery sources.

| Data Type | Source of Truth | Access Method | Owner |
|-----------|----------------|--------------|-------|
| Guest bookings | Eezee PMS | Manual (agent asks captain) | Captains |
| Accommodation revenue | Supabase `bookings` table | API via zo-api `/bookings` | ZomadPrime |
| Event revenue | Google Sheet (per-property P&L tab) | Google Sheets API | Suki |
| Other revenue (F&B, ancillary) | Google Sheet (per-property P&L tab) | Google Sheets API | Captains |
| Event registrations | Luma API | REST API with property-specific key | Suki |
| Event inquiries | Typeform | Polled daily via sync skill | Suki |
| Tasks/blockers | Google Sheet (shared task board) | Google Sheets API | ZomadPrime |
| Staff performance | Supabase `daily_performance` | API via zo-api `/staff/performance` | Captains |
| Sales pipeline | Google Sheet (sales pipeline tab) | Google Sheets API | Wanda |
| BD pipeline | Google Sheet (BD pipeline tab) | Google Sheets API | Yana |
| Community health | Google Sheet (community tracker) | Google Sheets API | LOKI |
| Agent activity | OpenClaw gateway | CLI `openclaw gateway call` | ZomadPrime |

---

## Trigger Glossary

Standardized phrases humans can use. Each agent responds to their domain.

### Universal (Any Agent)
- "help" / "what can you do" → List available skills
- "status" → Current agent status and recent activity

### Samurai → ZomadPrime
- "morning briefing" → Cross-property status with anomaly highlights
- "assign [task] to [agent]" → Delegate with context
- "how are we doing" → Key metrics snapshot
- "compare properties" → Side-by-side BLR vs Goa
- "scorecard" → Weekly agent performance

### Darshan/Akhilesh → Captains
- "morning audit" / "start shift" → Pull task board, generate checklist
- "log [amount] for [category]" → Financial entry
- "guest checking in: [name]" → Check-in workflow
- "guest checking out: [name]" → Check-out workflow
- "maintenance: [description]" → Triage and route
- "end of day" / "shift done" → Daily recap + handoff
- "staff report" → Performance summary

### Boldrin → Suki
- "new event inquiry" → Assess feasibility, generate quote
- "promote [event name]" → Create marketing across platforms
- "event today" → Day-of coordination mode
- "event recap: [event name]" → Post-event analysis
- "invoice for [event]" → Generate invoice
- "check registrations" → Luma sync

### Boldrin → Wanda
- "new lead: [details]" → Score and classify
- "follow up with [name]" → Next outreach step
- "pipeline status" → Current deals by stage
- "prep for call with [name]" → Discovery call brief

### Boldrin → Yana
- "research [company]" → Deep dive assessment
- "partnership status" → Active deals pipeline
- "reach out to [name/company]" → Initiate outreach sequence

### Pooja → LOKI
- "what's happening today" → Daily vibe post
- "new guest: [name]" → Onboarding welcome
- "community pulse" → Engagement health check
- "plan a [trek/food tour/pub crawl]" → City event coordination
- "quiet members" → Re-engagement scan

---

## Implementation Order

### Phase 1: Fix the Foundation (Week 1-2)

**Goal:** Make every existing skill actually work with real data.

1. Create the Data Source Registry as a shared document all agents reference
2. Rewrite google-workspace skill per agent with specific sheet IDs, calendars, folders
3. Fix all API references (Luma keys per property, Supabase access method, Google Sheets write path)
4. Add error handling to every skill: "If [source] is unavailable: [fallback behavior]"
5. Remove all placeholders (founder-outreach pricing, rate cards, vendor lists)
6. Standardize trigger phrases (create glossary, update all skills)

### Phase 2: Build the Handoffs (Week 3-4)

**Goal:** Agents pass work to each other automatically.

7. Write `sale-to-ops` (Wanda → Captains + LOKI)
8. Write `event-to-ops` (Suki → Captains)
9. Write `new-guest-onboard` (Captain check-in → LOKI)
10. Write `incoming-guest-brief` (from sale-to-ops, received by Captains)
11. Write `event-prep-checklist` (from event-to-ops, received by Captains)
12. Write `shift-handoff` (Captain → night staff / next shift)

### Phase 3: Add Missing Skills (Week 5-6)

**Goal:** Fill the gaps between what SOUL.md promises and what skills deliver.

13. Write `day-of-event` (Suki)
14. Write `discovery-call` (Wanda)
15. Write `consent-check` (LOKI)
16. Write `metrics-alert` (ZomadPrime)
17. Write `partner-management` (Yana)
18. Write `vendor-directory` (Captains)
19. Write `cross-property-compare` (ZomadPrime)

### Phase 4: Optimize (Week 7-8)

**Goal:** Make the system proactive, not just reactive.

20. Add anomaly detection to morning-briefing (vs yesterday, vs target, vs trend)
21. Add auto-escalation rules (blocker > 48h → Samurai notification)
22. Add re-engagement automation (LOKI scans for quiet members weekly)
23. Create feedback loops (scorecard → agent improvement suggestions)
24. Stress-test handoff chain end-to-end (new lead → booking → check-in → community → check-out → re-engage)

---

## Success Criteria

The coordination layer is working when:

- [ ] Every human can trigger any of their agent's skills with natural language — no cheat sheet needed
- [ ] Every skill produces output the human can act on immediately
- [ ] When Wanda closes a sale, captains and LOKI automatically receive a guest brief within 5 minutes
- [ ] When Suki confirms an event, the property captain gets a prep checklist without asking
- [ ] Morning briefing highlights what's DIFFERENT today, not just what's happening
- [ ] No skill references a data source that doesn't exist or lacks credentials
- [ ] Every skill has a defined fallback when data is unavailable
- [ ] Agent-to-agent handoffs work without human intervention
- [ ] The system degrades gracefully — if one agent is down, others continue with partial data
- [ ] Samurai can see the health of the entire operation in < 60 seconds
