---
name: task-manager
description: Read and write tasks in the laundry list Google Sheet — the central task tracker for all Zo House operations
---

# Task Manager — Global Skill

This skill gives ALL agents read/write access to the laundry list (task tracker). Use it whenever anyone mentions tasks, priorities, status updates, or asks what needs to be done.

## Triggers
- "mark P{X} as done", "P{X} done", "finished P{X}"
- "start P{X}", "working on P{X}"
- "add task", "new task"
- "my tasks", "task status", "what needs to be done"
- "update P{X}", "postpone P{X}", "cancel P{X}"
- Any reference to task priorities (P1, P2, etc.)

## DATA SOURCE: Google Sheet — Laundry List

**Sheet ID:** `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI`
**Tab:** `main list`
**Credentials:** `/home/conscious-house/.credentials/google.json`

### Get OAuth Token:
```bash
TOKEN=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "client_id=$(jq -r .client_id /home/conscious-house/.credentials/google.json)" \
  -d "client_secret=$(jq -r .client_secret /home/conscious-house/.credentials/google.json)" \
  -d "refresh_token=$(jq -r .refresh_token /home/conscious-house/.credentials/google.json)" \
  -d "grant_type=refresh_token" | jq -r .access_token)
```

### READ all tasks:
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://sheets.googleapis.com/v4/spreadsheets/1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI/values/%27main%20list%27%21A1%3AO100"
```

### WRITE — Update a cell:
```bash
curl -s -X PUT \
  "https://sheets.googleapis.com/v4/spreadsheets/1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI/values/%27main%20list%27%21{CELL}?valueInputOption=USER_ENTERED" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"values": [["NEW_VALUE"]]}'
```

### WRITE — Append a new row:
```bash
curl -s -X POST \
  "https://sheets.googleapis.com/v4/spreadsheets/1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI/values/%27main%20list%27%21A1:O1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"values": [["task","request_from","added_by","nature","track","product_area","priority","owner","status","metric","date_added","","effort","link","comments"]]}'
```

## Column Mapping (row 1 = headers)

| Col | Header | Notes |
|-----|--------|-------|
| A | Task | Task name |
| B | Request From | BLRxZo, WTFxZo, HQ, Samurai, Marketing |
| C | Added By | Who created it |
| D | Nature of task | Ops, Community, Marketing |
| E | Track | Daily, Weekly, Monthly |
| F | Product Area | Revenue, Community Management |
| G | Priority Order | P1, P2... (lower = more urgent) |
| H | Owner | Darshan R, Boldrin Antony, Samurai Zan, Akhilesh |
| I | Status | 🟡 In Progress / 🛑 Not Started / 🟢 Done / ⏸ Postponed / ❌ Cancelled |
| J | Metric(s) Impacted | KPI affected |
| K | Date Added | DD/MM/YYYY |
| L | Last checked | DD/MM/YYYY — ALWAYS update when touching a task |
| M | Effort | Progress notes |
| N | Links | Related URLs |
| O | Comments | Additional notes |

## How to Find a Task Row

1. Read all rows from the sheet
2. Match column G (Priority) = "P{X}"
3. Sheet row number = array index + 1 (row 1 = header, row 2 = first data)
4. Use that in cell refs: `I{row}` for status, `L{row}` for last checked, `M{row}` for effort

## Write Operations

| Command | Action |
|---------|--------|
| "P{X} done" | Set col I to 🟢 Done, col L to today |
| "start P{X}" | Set col I to 🟡 In Progress, col L to today |
| "postpone P{X}" | Set col I to ⏸ Postponed, col L to today |
| "cancel P{X}" | Set col I to ❌ Cancelled, col L to today |
| "update P{X}: notes" | Set col M to notes, col L to today |
| "add task: desc" | Append new row, auto-assign next P number |
| "assign P{X} to {name}" | Set col H to name, col L to today |

Always confirm writes: tell the user exactly what task and what changed.

## Rules

- Never fabricate tasks — only show what is in the sheet
- ALWAYS update Last checked (col L) when modifying any task
- Date format: DD/MM/YYYY
- Priority sort: numeric (P1 before P2 before P13)
- If sheet unavailable: say so, do not guess
