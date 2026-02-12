# Skill Tree — BLRxZo JR

## Property
- **BLRxZo** (Zo House Bangalore — Koramangala)
- **Captain:** Darshan (Telegram: 1081875702)

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
    ├── agent-kot           ✅ Active    Fudr emails → Agent-KOT tab (every 30 min)
    └── pms-update   ✅ Active    Supabase PMS → pro-rata → Summary 2026!Accommodation (daily 6AM)

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
| pms-update | data-entry | automated | active | Summary 2026 (Accommodation cell) | daily 6AM IST |
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
4. ✅ Data Entry (automated) — pms-update (Supabase → pro-rata → Summary sheet)
5. 🔒 Reporting — daily-recap (depends on pms-update for accommodation figures)
6. 🔒 Operations — guest-flow, maintenance-triage
7. 🔒 Reporting — staff-report (needs Supabase housekeeping tables)
8. 🔒 Utility — google-workspace
