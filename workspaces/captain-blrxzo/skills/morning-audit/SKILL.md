---
name: morning-audit
description: Daily 10AM task audit — reads the laundry list sheet and sends Darshan a formatted task report via Telegram.
---

# Task Audit — BLRxZo (Reporting)

You are BLRxZo JR sending Darshan his 10AM task audit. This skill is **read-only** — it reads the Laundry List and sends a formatted report. For task updates (mark done, add task, etc.), see the `task-entry` skill.

## Triggers
- "task audit", "my tasks", "what do I need to do", "task status"
- Heartbeat at 10:00 AM IST daily

## Recipients

**ALWAYS send to BOTH:**
1. **Darshan** (Telegram ID: 1081875702) — your House Captain
2. **Samurai** (Telegram ID: 1275114944) — Strategic Director

---

## DATA SOURCE: Google Sheet — Laundry List

- **Sheet ID:** `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI`
- **Tab:** `main list`
- **Auth:** Google Sheets API v4 with OAuth token from `zo-api/token.json`
- **Client secret:** `zo-api/client_secret_473298819240-kkqgen93r91d28h9u8erlb8r9t9donj8.apps.googleusercontent.com.json`

### Authentication

1. Read `zo-api/token.json` to get `refresh_token`
2. Read client secret file to get `client_id` and `client_secret`
3. POST to `https://oauth2.googleapis.com/token` with `grant_type=refresh_token` to get fresh `access_token`
4. Use `Authorization: Bearer {access_token}` on all Sheets API calls

### Header-based column discovery

**Always read row 1 first** to discover column positions by name. Do NOT hardcode column indices.

```
GET /v4/spreadsheets/{sheetId}/values/'main list'!A1:O1
```

Build a map: `header_name → column_index`. Expected headers (verified live):

| Col | Header |
|-----|--------|
| A | Task |
| B | Request From |
| C | Added By |
| D | Nature of task |
| E | Track |
| F | Product Area |
| G | Priority Order |
| H | Owner |
| I | Status |
| J | Metric(s) Impacted |
| K | Date Added |
| L | Last checked |
| M | Effort |
| N | Links |
| O | Comments |

If headers don't match expected names, log a warning and fall back to position-based indexing.

### Read all tasks

```
GET /v4/spreadsheets/{sheetId}/values/'main list'!A1:O500
```

Read up to row 500 (the sheet may grow). Row 1 = headers, data from row 2.

---

## Filtering for BLRxZo scope

Include a task if ANY of these match (case-insensitive):
1. **Owner** contains "Darshan" — tasks assigned to the captain
2. **Owner** contains "BLRxZo JR" — tasks assigned to this agent by other agents (e.g. ZomadPrime, Suki)
3. **Request From** contains "BLRxZo" — tasks tagged to BLRxZo property

Exclude tasks with Status = 🟢 Done or ❌ Cancelled (match emoji or text).
Sort by Priority: extract number after "P" (P1=1, P12=12, P67=67).

### Status values (emoji + text fallback)

| Emoji | Text | Meaning |
|-------|------|---------|
| 🟢 | Done | Completed |
| 🟡 | In Progress | Active work |
| 🛑 | Not Started | Pending |
| ⏸ | Postponed | On hold |
| ❌ | Cancelled | Dropped |

When matching status, check for both the emoji AND the text string (e.g., a cell might contain "🟡 In Progress" or just "In Progress").

---

## TASK AUDIT OUTPUT (10AM daily)

Send this format via Telegram (bullet lists, no tables):

```
📋 TASK AUDIT — BLRxZo (Darshan)
{date}, 10:00 AM IST

🔥 IN PROGRESS ({count}):
• [P{X}] {task name} — {effort notes, max 50 chars}
• [P{X}] {task name}

🛑 NOT STARTED ({count}):
• [P{X}] {task name} — from: {request_from}
• [P{X}] {task name} — from: {request_from}

⏸ POSTPONED ({count}):
• [P{X}] {task name}

📊 SCORE: {done_count} done / {total_active} active — {completion_rate}%

🏠 PROPERTY TASKS:
• BLRxZo: {list tasks where Request From = BLRxZo}
• WTFxZo: {list tasks where Request From = WTFxZo}

⚡ TOP 3 TODAY:
→ 1. {highest priority in-progress or not-started task}
→ 2. {next highest}
→ 3. {next}
```

If a section has 0 items, show the header with "(0)" and skip the bullet list.

---

## AUTO-FLAGS

Append these warnings at the end of the audit if conditions are met:

- P1-P5 task that's 🛑 Not Started → "⚠️ HIGH PRIORITY STUCK: [P{X}] {task}"
- More than 5 tasks 🛑 Not Started → "⚠️ BACKLOG: {count} tasks not started"
- Last checked >14 days ago → "⚠️ STALE: [P{X}] {task} — last checked {date}"

---

## Error Handling

| Error | Action |
|-------|--------|
| Token refresh fails | Send: "⚠️ Task sheet unavailable — Google auth error. Will retry next cycle." |
| Sheet API returns error | Send: "⚠️ Task sheet unavailable — API error. Will retry." |
| Sheet returns empty data | Send: "⚠️ No tasks found in laundry list. Sheet may be empty or tab name changed." |
| Headers don't match expected | Log warning, fall back to position-based indexing. Still produce audit. |
| Rate limited (429) | Wait 60 seconds, retry once. If still 429, skip and retry next cycle. |

---

## RULES

- **This skill is READ-ONLY** — it never writes to the sheet
- For task updates, the captain uses `task-entry` skill (or says "mark P3 as done", which triggers task-entry)
- Never fabricate tasks. Only show what's in the sheet.
- Keep audit under 35 lines — phone-readable
- Priority sort: P1 > P2 > P3... (numerically, not alphabetically)
- End audit with: "💪 {one-liner based on task load}"
