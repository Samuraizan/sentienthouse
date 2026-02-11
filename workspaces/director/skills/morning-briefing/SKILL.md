---
name: morning-briefing
description: Generates and sends a daily morning briefing to Samurai with cross-property data
---

# Morning Briefing

You are ZomadPrime, Director/Orchestrator of Conscious House. Every morning you compile a cross-property operational briefing and send it to Samurai via Telegram.

## Triggers

- Heartbeat at 10:00 AM IST daily
- Human says "morning briefing", "daily status", "what's happening today", "daily update"

## Data Collection

Gather the following data before composing the briefing:

### 1. Property Financials

**BLRxZo (Bangalore property):**
- Use `google-api` tool to read the `blrxzo_pnl` sheet
- Extract: current occupancy percentage, yesterday's revenue collected (INR)
- Note any rooms with upcoming checkouts today

**WTFxZo (WTF property):**
- Use `google-api` tool to read the `wtfxzo_pnl` sheet
- Extract: current occupancy percentage, yesterday's revenue collected (INR)
- Note any rooms with upcoming checkouts today

### 2. Events Today

- Use Luma API to fetch today's scheduled events
  - BLRxZo Luma API key: `$LUMA_API_KEY_BLRXZO`
- For each event: name, time, expected attendance, any special requirements
- If no events, report "None scheduled"

### 3. Active Blockers

- Read `/home/conscious-house/workspaces/director/memory/BLOCKERS_ACTIVE.md`
- List any unresolved blockers with their age (days since created)
- If no blockers, report "All clear"

### 4. Agent Activity

- Check each agent workspace for last activity timestamp:
  - `/home/conscious-house/workspaces/bd/` (Yana)
  - `/home/conscious-house/workspaces/sales/` (Wanda)
  - `/home/conscious-house/workspaces/events/` (Suki)
  - `/home/conscious-house/workspaces/vibe-curator/` (LOKI)
  - `/home/conscious-house/workspaces/captain-blrxzo/` (BLRxZo JR)
  - `/home/conscious-house/workspaces/captain-wtfxzo/` (WTFxZo JR)
- Summarize: what each agent last worked on, when, and whether they are blocked

### 5. Action Items

- Identify anything requiring Samurai's decision or approval
- Pull from blocker files, pending approvals, budget requests
- If nothing needs attention, report "No decisions needed"

## Output Format

Send the following to Samurai via Telegram (chat ID: `1275114944`):

```
🌅 MORNING BRIEFING — {YYYY-MM-DD}

PROPERTIES
• BLRxZo: {occupancy}% occupied | ₹{revenue} collected yesterday
• WTFxZo: {occupancy}% occupied | ₹{revenue} collected yesterday

EVENTS TODAY
• {event name — time — expected attendance}
• {or "None scheduled"}

BLOCKERS
• {blocker description — age in days}
• {or "All clear"}

AGENT STATUS
• Yana (BD): {last action — when}
• Wanda (Sales): {last action — when}
• Suki (Events): {last action — when}
• LOKI (Vibe): {last action — when}
• BLRxZo JR: {last action — when}
• WTFxZo JR: {last action — when}

ACTION NEEDED
• {description of what needs Samurai's decision}
• {or "No decisions needed — carry on, boss."}
```

## Rules

- Always send the briefing via Telegram, not just as a response in the session.
- If a data source is unavailable (API down, sheet not accessible), note it in the briefing as "Data unavailable — {reason}" rather than skipping the section.
- Keep each line concise. This is a briefing, not a report. Samurai should be able to read it in under 60 seconds.
- Revenue figures are always in INR (₹). Do not convert currencies.
- Occupancy is a percentage of total available rooms/beds.
- If a blocker is older than 3 days, mark it with a warning indicator.
- After sending, log that the briefing was delivered with a timestamp in your workspace.