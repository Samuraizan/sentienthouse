# Trigger Glossary

> What to say to your agent via Telegram. Every phrase below is mapped to a specific skill. Say it naturally — the agent will understand.

---

## How Triggers Work

1. You send a message to the Telegram bot
2. OpenClaw routes it to your agent (based on who you are)
3. Your agent matches your message to a skill
4. The skill runs and sends you the output

**You don't need exact wording.** These are the primary phrases, but agents understand natural variations. "log expense" and "I need to record a payment" both trigger financial-entry.

---

## Samurai → ZomadPrime

Samurai's DMs route to ZomadPrime (the director agent).

### Reports
| Say This | Skill | What You Get |
|----------|-------|-------------|
| "morning briefing" | morning-briefing | Cross-property snapshot: occupancy, revenue, events, blockers, anomalies |
| "how are we doing" | morning-briefing | Same as above (on-demand) |
| "compare properties" | cross-property-compare | Side-by-side BLR vs Whitefield metrics |
| "scorecard" | weekly-scorecard | Agent + human performance scores with trends |
| "agent status" | agent-health-check | Which agents are active, which cron jobs ran |

### Actions
| Say This | Skill | What Happens |
|----------|-------|-------------|
| "assign [task] to [agent name]" | delegate-task | ZomadPrime spawns the target agent with your task + context |
| "have Suki plan an event for [date]" | delegate-task | Routes to Suki with event planning context |
| "mark P3 as done" | task-manager | Updates task board (Google Sheet) |
| "add task: [description]" | task-manager | Creates new task on shared board |
| "teach [agent] the [skill] skill" | skill-sync | Copies and adapts a skill from one agent to another |

### Automatic (Cron)
| When | Skill | What You Receive |
|------|-------|-----------------|
| 10:00 AM UTC daily | morning-briefing | Daily cross-property brief |
| Monday 10:00 AM IST | weekly-scorecard | Weekly performance review |
| When metrics drop | metrics-alert | Alert: occupancy/revenue/engagement below threshold |

---

## Darshan → BLRxZo JR

Darshan's DMs route to BLRxZo JR (Bangalore house captain).

### Reports
| Say This | Skill | What You Get |
|----------|-------|-------------|
| "morning audit" / "start shift" | morning-audit | Today's task board: priorities, status, what needs attention |
| "daily recap" / "end of day" | daily-recap | Full day summary: revenue, occupancy, events, issues |
| "staff report" | staff-report | Housekeeping performance: completion rates, scores, coaching flags |
| "shift handoff" | shift-handoff | Structured handoff for night staff |

### Actions
| Say This | Skill | What Happens |
|----------|-------|-------------|
| "log [amount] for [category]" | financial-entry | Records expense/revenue to P&L sheet |
| "log ₹2500 for plumbing repair" | financial-entry | Categorizes as maintenance opex, writes to sheet |
| "guest checking in: [name]" | guest-flow | Check-in workflow: verify booking, docs, payment, room, welcome |
| "guest checking out: [name]" | guest-flow | Check-out workflow: inspection, charges, settlement, feedback |
| "maintenance: [description]" | maintenance-triage | Classifies priority, routes to vendor, logs issue |
| "AC not working in room 204" | maintenance-triage | Triages as guest-impacting, high priority |
| "mark P2 as done" | task-manager | Updates task status on shared board |

### Automatic (Cron)
| When | Skill | What You Receive |
|------|-------|-----------------|
| 8:00 AM IST daily | daily-recap | Morning property status |
| 10:30 AM IST daily | morning-audit | Task board review |

### Incoming Handoffs (from other agents)
| From | Skill | What Arrives |
|------|-------|-------------|
| Wanda (sale closed) | incoming-guest-brief | Guest name, dates, preferences, payment status |
| Suki (event confirmed) | event-prep-checklist | Venue setup requirements, AV, catering, staffing |

---

## Akhilesh → WTFxZo JR

Akhilesh's DMs route to WTFxZo JR (Whitefield house captain). Same skills as Darshan's agent, tuned for Whitefield.

### Reports
| Say This | Skill | What You Get |
|----------|-------|-------------|
| "morning audit" / "start shift" | morning-audit | Today's task board |
| "daily recap" / "end of day" | daily-recap | Full day summary (event-heavy focus) |
| "staff report" | staff-report | Staff performance |
| "shift handoff" | shift-handoff | Night staff handoff |

### Actions
| Say This | Skill | What Happens |
|----------|-------|-------------|
| "log [amount] for [category]" | financial-entry | Records to WTFxZo P&L sheet |
| "guest checking in: [name]" | guest-flow | Check-in workflow |
| "guest checking out: [name]" | guest-flow | Check-out workflow |
| "maintenance: [description]" | maintenance-triage | Classify, route, log |
| "mark P1 as done" | task-manager | Update shared task board |

### Automatic (Cron)
| When | Skill | What You Receive |
|------|-------|-----------------|
| 8:00 AM IST daily | daily-recap | Morning property status |
| 10:30 AM IST daily | morning-audit | Task board review |

---

## Boldrin → Suki (Events)

Boldrin's DMs route to Suki by default. He also manages Wanda and Yana — see switching below.

### Reports
| Say This | Skill | What You Get |
|----------|-------|-------------|
| "check registrations" / "how many signed up" | luma-sync | Current event registrations from Luma |
| "event recap: [event name]" | event-recap | Post-event analysis: attendance, revenue, social metrics |
| "revenue update" / "event PnL" | rev-tracking | Event revenue and cost breakdown |

### Actions
| Say This | Skill | What Happens |
|----------|-------|-------------|
| "new event inquiry" | event-inquiry | Assess feasibility, GO/NO-GO, generate quote |
| "someone wants to host on [date]" | event-inquiry | Same — triggers inquiry assessment |
| "promote [event name]" | event-marketing | Create Luma page + social posts (LinkedIn, X, Instagram, Farcaster) |
| "create invoice for [event]" | invoice-maker | Generate GST-compliant invoice |
| "event confirmed: [name]" | event-to-ops | Send prep requirements to property captain |
| "event today: [name]" | day-of-event | Activate real-time coordination mode |

### Automatic (Cron)
| When | Skill | What You Receive |
|------|-------|-----------------|
| Daily | luma-sync | Updated event registrations |
| Daily | typeform-sync | New event inquiries from Typeform |

---

## Boldrin → Wanda (Sales)

To reach Wanda, Boldrin messages through the main bot or uses agent-specific routing.

### Reports
| Say This | Skill | What You Get |
|----------|-------|-------------|
| "pipeline status" / "how are sales" | pipeline-update | Deals by stage with weighted revenue forecast |

### Actions
| Say This | Skill | What Happens |
|----------|-------|-------------|
| "new lead: [details]" | lead-qualify | Score and classify (Hot / Warm / Cold / Disqualified) |
| "someone interested in staying" | lead-qualify | Same — triggers qualification |
| "follow up with [name]" | outreach-sequence | Next step in email sequence |
| "send outreach to [name]" | outreach-sequence | Initiate personalized outreach |
| "prep for call with [name]" | discovery-call | Pre-call brief: guest profile, pricing options, key questions |
| "booking confirmed for [name]" | sale-to-ops | Send guest brief to captain + LOKI |
| "market rooms" / "founder experience" | founder-marketing | Generate positioning content |

---

## Boldrin → Yana (BD)

To reach Yana, Boldrin messages through the main bot or uses agent-specific routing.

### Reports
| Say This | Skill | What You Get |
|----------|-------|-------------|
| "partnership status" / "BD pipeline" | deal-pipeline | Active deals by stage with health indicators |

### Actions
| Say This | Skill | What Happens |
|----------|-------|-------------|
| "research [company name]" | partner-research | Deep dive: company profile, funding, audience fit, recommendation |
| "reach out to [name/company]" | founder-outreach | Initiate outreach sequence |
| "partnership signed with [company]" | partnership-to-event | If events involved, hand off to Suki |

---

## Pooja → LOKI

Pooja's DMs route to LOKI (vibe curator).

### Reports
| Say This | Skill | What You Get |
|----------|-------|-------------|
| "what's happening today" | daily-vibe | Today's activities, events, community rhythm |
| "community pulse" / "how's the community" | community-pulse | Engagement health: active members, attendance, quiet members |
| "quiet members" | re-engage-quiet | List of members who've gone silent + re-engagement plan |

### Actions
| Say This | Skill | What Happens |
|----------|-------|-------------|
| "new guest: [name]" | guest-welcome | Five Senses onboarding: sight, sound, touch, smell, taste |
| "plan a trek" / "food tour" / "pub crawl" | city-event | Coordinate city activity: venue, transport, communication |
| "plan a [activity] for [date]" | city-event | Same — with specific date |
| "content plan for this week" | content-calendar | Weekly themes, platforms, property stories |

### Automatic (Cron)
| When | Skill | What You Receive |
|------|-------|-----------------|
| 9:00 AM IST daily | daily-vibe | Morning community post |
| Monday morning | community-pulse | Weekly engagement health check |

### Incoming Handoffs (from other agents)
| From | Skill | What Arrives |
|------|-------|-------------|
| Captain (check-in complete) | new-guest-onboard | Guest name, room, dates, interests — ready for community welcome |
| Wanda (booking confirmed) | new-guest-onboard | Advance notice of incoming guest |
| Suki (event confirmed) | event vibe request | Atmosphere, music, decor planning for upcoming event |

---

## Quick Reference Card

Print this or pin it in each person's Telegram chat.

```
SAMURAI:
  "morning briefing"     → cross-property status
  "compare properties"   → BLR vs Whitefield
  "assign X to Y"        → delegate task
  "scorecard"            → weekly performance

DARSHAN / AKHILESH:
  "morning audit"        → task board
  "log ₹X for Y"        → record expense
  "guest checking in: X" → check-in flow
  "maintenance: X"       → triage issue
  "end of day"           → daily recap

BOLDRIN (→ Suki):
  "new event inquiry"    → assess feasibility
  "promote [event]"      → marketing posts
  "create invoice"       → GST invoice
  "check registrations"  → Luma attendance

BOLDRIN (→ Wanda):
  "new lead: X"          → score lead
  "pipeline status"      → deal stages
  "booking confirmed"    → handoff to ops

BOLDRIN (→ Yana):
  "research [company]"   → deep dive
  "partnership status"   → BD pipeline

POOJA:
  "what's happening"     → daily vibe
  "new guest: X"         → welcome flow
  "plan a trek"          → city event
  "community pulse"      → engagement health
```
