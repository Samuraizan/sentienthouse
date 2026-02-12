# Skill Tree — WTFxZo JR

## Property
- **WTFxZo** (Zo House Bangalore — Whitefield)
- **Captain:** Akhilesh (Telegram: 558199761)

---

## Tree

```
📊 DATA ENTRY
│
├── 👤 Human-Confirmed
│   ├── running-opex        ✅ Active    Expense logging → Running OPEX tab
│   ├── co-working-entry    ✅ Active    Co-working guests → Co Working Register tab
│   ├── activity-revenue    ✅ Active    Activities/bookings → Activity Revenue tab
│   └── task-entry          ✅ Active    Laundry List task management → main list tab
│
└── 🤖 Automated
    └── agent-kot           ✅ Active    Fudr emails → Agent-KOT tab (every 30 min)

📋 REPORTING
│
└── morning-audit           ✅ Active    10AM task audit → Telegram (read-only)

🔧 OPERATIONS (planned)
│
├── daily-recap             🔒 Locked    P&L summary + occupancy → Telegram (daily 8AM)
├── guest-flow              🔒 Locked    Check-in/out checklists + Eezee PMS assist
├── maintenance-triage      🔒 Locked    Maintenance requests → triage → vendor dispatch
├── staff-report            🔒 Locked    Housekeeping performance → Telegram (weekly)
└── google-workspace        🔒 Locked    Sheets/Calendar/Drive helper
```

---

## Skill Registry

| skill_id | category | type | status | sheet_tab | trigger |
|-----------|----------|------|--------|-----------|---------|
| running-opex | data-entry | human-confirmed | active | Running OPEX | message/image |
| co-working-entry | data-entry | human-confirmed | active | Co Working Register | message/image |
| activity-revenue | data-entry | human-confirmed | active | Activity Revenue | message/image |
| task-entry | data-entry | human-confirmed | active | Laundry List (main list) | message |
| agent-kot | data-entry | automated | active | Agent-KOT | every 30 min |
| morning-audit | reporting | scheduled | active | Laundry List (read-only) | daily 10AM IST |
| daily-recap | reporting | scheduled | locked | Summary 2026 (read-only) | daily 8AM IST |
| guest-flow | operations | human-confirmed | locked | — | message |
| maintenance-triage | operations | human-confirmed | locked | — | message |
| staff-report | reporting | scheduled | locked | — | weekly |
| google-workspace | utility | on-demand | locked | — | message |

---

## Categories

### 📊 data-entry
Skills that write rows to P&L sheet tabs. Two types:
- **human-confirmed:** Captain sends image/text → agent parses → confirms → writes
- **automated:** Agent runs on schedule, no human input unless errors

### 📋 reporting
Skills that read data and send formatted reports via Telegram.

### 🔧 operations
Skills that assist with property operations (check-ins, maintenance, etc.).

### 🛠 utility
Helper skills for Google Workspace access, calendar, etc.

---

## Unlock Order

Skills are built and activated in this order:
1. ✅ Data Entry (automated) — agent-kot
2. ✅ Data Entry (human-confirmed) — running-opex, co-working-entry, activity-revenue, task-entry
3. ✅ Reporting — morning-audit (read-only, depends on task-entry for writes)
4. 🔒 Reporting — daily-recap (needs accommodation auto-calc from Supabase)
5. 🔒 Operations — guest-flow, maintenance-triage
6. 🔒 Reporting — staff-report (needs Supabase housekeeping tables)
7. 🔒 Utility — google-workspace
