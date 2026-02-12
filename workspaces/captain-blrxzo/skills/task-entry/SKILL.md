# Skill: task-entry

## Purpose
Data entry skill — captain manages tasks on the shared Laundry List via Telegram. Agent finds the correct row/cell, confirms the change, writes to the sheet, and confirms back.

## Property
- **Property:** BLRxZo (Zo House Bangalore — Koramangala)
- **Captain:** Darshan (Telegram: 1081875702)

## Triggers
- "mark P3 as done", "P3 is done", "finished P3"
- "start P14", "working on P14", "P14 in progress"
- "add task", "new task"
- "update P5", "P5 note:", "P5 notes"
- "postpone P13", "pause P13"
- "cancel P18"
- "task status P5", "show P5", "what's P5"

## Recipients
- **Darshan** (Telegram ID: 1081875702) — confirmation messages only

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

---

## SHEET STRUCTURE

### Header-based column discovery

**Always read row 1 first** to discover column positions by name. Do NOT hardcode column indices.

```
GET /v4/spreadsheets/{sheetId}/values/'main list'!A1:O1
```

Build a map: `header_name → column_letter`. Expected headers (verified live):

| Col | Header | Used for |
|-----|--------|----------|
| A | Task | Task name/description |
| B | Request From | Who requested it (BLRxZo, WTFxZo, HQ, Samurai, etc.) |
| C | Added By | Who created the task |
| D | Nature of task | Ops, Community, Marketing, etc. |
| E | Track | Daily, Weekly, Monthly |
| F | Product Area | Revenue, Community Management, etc. |
| G | Priority Order | P1, P2, P3... (unique identifier) |
| H | Owner | Who's responsible (filter for "Darshan") |
| I | Status | 🟡 In Progress / 🛑 Not Started / 🟢 Done / ⏸ Postponed / ❌ Cancelled |
| J | Metric(s) Impacted | What KPI this affects |
| K | Date Added | DD/MM/YYYY |
| L | Last checked | DD/MM/YYYY — ALWAYS update when touching a task |
| M | Effort | Progress notes, work done |
| N | Links | Related URLs |
| O | Comments | Additional notes |

If headers don't match expected names, log a warning and fall back to position-based indexing.

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

## SCOPE — What this agent can edit

### Permission hierarchy

```
Humans (Darshan, Samurai, etc.)
  ↓ assign tasks to
Agents (BLRxZo JR, WTFxZo JR, ZomadPrime, Suki, etc.)
  ↓ can reassign to
Other Agents only (never back to humans)
```

- **Humans assign tasks to agents** — captain says "add task" → Owner = BLRxZo JR
- **Agents can reassign to other agents** — BLRxZo JR can hand off to WTFxZo JR
- **Agents CANNOT assign tasks to humans** — agents are the worker layer, not managers

### Edit scope

This agent can ONLY edit tasks that belong to its scope:
1. **Owner** contains "Darshan" (case-insensitive) — tasks the captain owns (agent assists)
2. **Owner** contains "BLRxZo JR" (case-insensitive) — tasks assigned to this agent by humans or other agents
3. **Request From** contains "BLRxZo" (case-insensitive) — property-tagged tasks

If a task is outside this scope (e.g., owned by "Akhilesh" or "WTFxZo JR"), **refuse the edit**:
- "⚠️ [P{X}] is owned by {owner} — that's not in my scope. Ask WTFxZo JR or the task owner to update it."

---

## HOW TO FIND THE RIGHT ROW

This is the core logic for all write operations:

### Step 1: Read all data
```
GET /v4/spreadsheets/{sheetId}/values/'main list'!A1:O500
```

### Step 2: Find the row by Priority number
- Captain says "P3" → search the Priority Order column (G) for the cell containing "P3"
- The Priority number is the **unique task identifier** — no two tasks share the same P number

### Step 2.5: Check scope
- Before any write, verify the task belongs to this agent's scope (see SCOPE section above)
- If out of scope → tell the captain and stop
- Row number in the sheet = array index + 1 (row 1 = headers, so array index 0 = row 1)
- Example: if "P3" is found at array index 4, that's sheet row 5

### Step 3: Build the cell reference
Once you know the sheet row number, build references for any column:
- Status: `I{row}` (e.g., `I5`)
- Last checked: `L{row}` (e.g., `L5`)
- Effort: `M{row}` (e.g., `M5`)
- Comments: `O{row}` (e.g., `O5`)

### Step 4: Verify before writing
Before writing, **always show the captain what you found**:
```
Found [P3] "Setup custom dental kits" — row 5
Current status: 🛑 Not Started
→ Change to: 🟢 Done

✅ Confirm | ❌ Cancel
```

### If task not found
- "I can't find P{X} in the laundry list. Are you sure that's the right priority number?"
- Show the closest matches if possible (e.g., "Did you mean P13 or P31?")

---

## WRITE API

### Update a single cell
```
PUT /v4/spreadsheets/{sheetId}/values/'main list'!{CELL}?valueInputOption=USER_ENTERED
Body: {"values": [["{NEW_VALUE}"]]}
```

### Update multiple cells in the same row (batch)
When updating status + last checked together (which is most operations):
```
PUT /v4/spreadsheets/{sheetId}/values/'main list'!I{row}:L{row}?valueInputOption=USER_ENTERED
Body: {"values": [["{status}", "{metric}", "{date_added}", "{last_checked}"]]}
```

Or update them as two separate PUT calls if batch range would overwrite other cells.

### Append a new row
```
POST /v4/spreadsheets/{sheetId}/values/'main list'!A1:O1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS
Body: {"values": [["{task}", "{request_from}", "{added_by}", "{nature}", "{track}", "{product_area}", "{priority}", "{owner}", "{status}", "{metric}", "{date_added}", "", "{effort}", "{link}", "{comments}"]]}
```

---

## OPERATIONS

### 1. Mark as Done
**Triggers:** "mark P3 as done", "P3 is done", "finished P3", "done with P3"

1. Find row where Priority Order = P{X}
2. Show captain: task name, current status
3. Wait for confirmation
4. Update Status cell → `🟢 Done`
5. Update Last checked → today (DD/MM/YYYY)
6. Confirm: `✅ [P3] "Setup custom dental kits" marked as done`

### 2. Mark as In Progress
**Triggers:** "start P14", "working on P14", "P14 in progress", "starting P14"

1. Find row where Priority Order = P{X}
2. Show captain: task name, current status
3. Wait for confirmation
4. Update Status cell → `🟡 In Progress`
5. Update Last checked → today
6. Confirm: `🟡 [P14] "Vendor Reviews" marked as in progress`

### 3. Add New Task
**Triggers:** "add task: {description}", "new task: {description}"

1. Read all rows to find the highest P number
2. Next priority = highest P number + 1
3. Parse from captain's message:
   - Task = description (required — **ASK** if not clear)
   - Request From = "BLRxZo" (default, or parse if captain specifies)
   - Nature of task = **ASK** if not obvious
   - Added By = "Darshan" (the human who requested it)
   - Owner = "BLRxZo JR" (default — the agent owns the task, not the human)
   - Captain can override Owner to another agent name (e.g., "assign to WTFxZo JR")
   - **Never set Owner to a human name** — agents are the worker layer
4. Show captain the new task entry:
   ```
   📌 NEW TASK:
   • Task: {description}
   • Priority: P{next_number}
   • Owner: BLRxZo JR
   • Added By: Darshan
   • Request From: BLRxZo
   • Status: 🛑 Not Started
   • Date Added: {today}

   ✅ Confirm to add | ❌ Cancel | ✏️ Change something
   ```
5. Wait for confirmation
6. Append row
7. Confirm: `📌 Added [P{X}] "{task name}"`

### 4. Update Notes/Effort
**Triggers:** "update P5: {notes}", "P5 note: {notes}", "P5 effort: {notes}"

1. Find row where Priority Order = P{X}
2. Show captain: task name, current effort/notes
3. Show what will be written (append to existing or replace — ask if existing notes exist)
4. Wait for confirmation
5. Update Effort cell (M) with new notes
6. Update Last checked → today
7. Confirm: `📝 [P5] notes updated`

### 5. Postpone
**Triggers:** "postpone P13", "pause P13", "hold P13"

1. Find row where Priority Order = P{X}
2. Show captain: task name, current status
3. Wait for confirmation
4. Update Status cell → `⏸ Postponed`
5. Update Last checked → today
6. Confirm: `⏸ [P13] "{task name}" postponed`

### 6. Cancel
**Triggers:** "cancel P18", "drop P18", "remove P18"

1. Find row where Priority Order = P{X}
2. Show captain: task name, current status
3. **Extra confirmation** (cancellation is harder to undo): "Are you sure you want to cancel [P18] '{task name}'?"
4. Wait for explicit confirmation
5. Update Status cell → `❌ Cancelled`
6. Update Last checked → today
7. Confirm: `❌ [P18] "{task name}" cancelled`

### 7. Show Task Details
**Triggers:** "show P5", "what's P5", "task status P5", "details P5"

1. Find row where Priority Order = P{X}
2. Show all fields as bullet list:
   ```
   📋 [P5] Setup custom dental kits
   • Status: 🛑 Not Started
   • Owner: Darshan R
   • Request From: Samurai
   • Nature: Ops
   • Track: Monthly
   • Date Added: 15/01/2026
   • Last Checked: —
   • Effort: —
   • Comments: —
   ```
3. No write needed — this is read-only

### 8. Reassign Task (agent-to-agent only)
**Triggers:** "assign P5 to WTFxZo JR", "P5 owner: WTFxZo JR", "give P5 to Suki"

1. Find row where Priority Order = P{X}
2. Verify task is in this agent's scope (can only reassign FROM own scope)
3. Verify target is an **agent name**, not a human name
   - Valid targets: BLRxZo JR, WTFxZo JR, ZomadPrime, Suki, Wanda, Yana, LOKI
   - Invalid targets: Darshan, Akhilesh, Samurai, or any human name
   - If captain tries to assign to a human: "⚠️ Tasks can only be assigned to agents. Did you mean BLRxZo JR or WTFxZo JR?"
4. Show captain: task name, current owner, new owner
5. Wait for confirmation
6. Update Owner cell (H) → new agent name
7. Update Last checked → today
8. Confirm: `👤 [P5] reassigned to WTFxZo JR`

---

## ALWAYS UPDATE LAST CHECKED

Every write operation MUST also update the "Last checked" column (L) to today's date (DD/MM/YYYY). This is non-negotiable — it's how the team tracks task freshness.

---

## Error Handling

| Error | Action |
|-------|--------|
| Token refresh fails | Send: "⚠️ Can't access the laundry list — Google auth error. Try again shortly." |
| Sheet API returns error | Send: "⚠️ Couldn't update the sheet — API error. Please try again." |
| Task P{X} not found | Send: "I can't find P{X} in the laundry list. Did you mean P{closest}?" |
| Task already in requested status | Send: "[P{X}] is already {status}. No change needed." |
| Write operation fails | Send: "⚠️ Could not update [P{X}] — write failed. Try again." |
| Rate limited (429) | Wait 60 seconds, retry once. If still 429: "⚠️ Sheet is busy, will retry." |
| Multiple tasks with same P number | Send: "⚠️ Found duplicate P{X}. Showing both — which one?" |

---

## RULES

- **Never write without captain confirmation** — show what you found, what you'll change, wait for OK
- **Only edit tasks in your scope** — Owner=Darshan, Owner=BLRxZo JR, or Request From=BLRxZo
- Never guess which task to modify — if ambiguous, ask
- Always update Last checked on every write
- Priority numbers are unique identifiers — P1, P2, P3... never reuse
- Date format: DD/MM/YYYY
- Cancellation requires extra confirmation
- When adding tasks, always auto-assign the next available P number
- Do not fabricate or invent task data
- Keep confirmation messages short and phone-readable
