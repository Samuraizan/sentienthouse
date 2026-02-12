# Data Source Registry

> The single source of truth for where every piece of data lives. Every skill must reference this document — no more mystery sources or assumed paths.

---

## Environment Variables

All stored in `.env` at repo root. Never committed to git.

| Variable | Purpose | Used By |
|----------|---------|---------|
| `SUPABASE_URL` | Database REST API base URL | daily-recap, staff-report, pipeline-update |
| `SUPABASE_ANON_KEY` | Read-only database access | All read queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Full database access (read + write) | Sync skills, data writes |
| `LUMA_API_KEY_BLRXZO` | Luma calendar API — Bangalore events | luma-sync, daily-recap (BLRxZo) |
| `LUMA_API_KEY_SFOXZO` | Luma calendar API — Goa events | luma-sync, daily-recap (WTFxZo) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot for all agent messaging | OpenClaw gateway |
| `OPENCLAW_GATEWAY_TOKEN` | Gateway authentication | zo-api gateway proxy |
| `GOOGLE_SHEET_BLRXZO` | BLRxZo P&L sheet ID | financial-entry, daily-recap |
| `GOOGLE_SHEET_WTFXZO` | WTFxZo P&L sheet ID | financial-entry, daily-recap |
| `TYPEFORM_TOKEN` | Typeform API access | event-inquiry sync |
| `PORT` | zo-api server port (default: 3001) | zo-api |
| `DATA_DIR` | Runtime data directory (default: ./data) | zo-api |

---

## Google Sheets

### BLRxZo P&L (Running Financial Tracker)
- **Sheet ID:** `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y`
- **Env var:** `$GOOGLE_SHEET_BLRXZO`
- **Key tabs:**
  - `Summary 2026` — Monthly revenue/expense summary
  - `BLRxZo_P&L` — Line-by-line financial entries
- **Who writes:** BLRxZo JR (financial-entry), Suki (rev-tracking)
- **Who reads:** BLRxZo JR (daily-recap, morning-audit), ZomadPrime (morning-briefing)
- **Column structure (P&L tab):** Date | Type | Category | Description | Amount | Payment Method | Approved By | Notes

### WTFxZo P&L (Running Financial Tracker)
- **Sheet ID:** `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY`
- **Env var:** `$GOOGLE_SHEET_WTFXZO`
- **Key tabs:**
  - `Summary 2026` — Monthly revenue/expense summary
  - `WTFxZo_P&L` — Line-by-line financial entries
- **Who writes:** WTFxZo JR (financial-entry), Suki (rev-tracking)
- **Who reads:** WTFxZo JR (daily-recap, morning-audit), ZomadPrime (morning-briefing)

### Laundry List (Shared Task Tracker)
- **Sheet ID:** `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI`
- **Key tab:** `main list`
- **Who writes:** All agents (task-manager, morning-audit)
- **Who reads:** All agents, ZomadPrime (morning-briefing, weekly-scorecard)
- **Column structure (15 columns):**

| Col | Header | Content |
|-----|--------|---------|
| A | Task | Task description |
| B | Status | Emoji: 🛑 Not Started / 🟡 In Progress / 🟢 Done / ⏸ Postponed / ❌ Cancelled |
| C | Owner | Agent or human name |
| D | Property | BLRxZo / WTFxZo / All |
| E | Due Date | Target date |
| F | Created | Date created |
| G | Priority | P1 (critical) through P5 (nice-to-have) |
| H | Category | ops / events / sales / bd / community / finance |
| I | Assigned By | Who created this task |
| J | Blocker | What's blocking (if any) |
| K | Last Checked | Timestamp of last review |
| L | Agent | Which agent owns this |
| M | Human | Which human is responsible |
| N | Notes | Free text |
| O | Comments | Threaded discussion |

### Rev-Events (Event Revenue Tracking)
- **Sheet ID:** Referenced in Suki's rev-tracking skill (within BLRxZo or WTFxZo P&L sheet as a tab)
- **Key tab:** `Rev-Events`
- **Who writes:** Suki (rev-tracking)
- **Who reads:** Suki (event-recap), ZomadPrime (morning-briefing)
- **Column structure (20 columns):** Event Name | Date | Venue | Type | Ticket Revenue | Sponsorship | F&B | Merch | Other Revenue | Host Fee | Total Revenue | Venue Cost | Staff Cost | AV Cost | F&B Cost | Marketing Cost | Other Cost | Total Cost | Net Margin | Notes

---

## Supabase Database

**Base URL:** `https://elvaqxadfewcsohrswsi.supabase.co/rest/v1`
**Auth header:** `apikey: {SUPABASE_ANON_KEY}` + `Authorization: Bearer {SUPABASE_ANON_KEY}`
**For writes:** Use `SUPABASE_SERVICE_ROLE_KEY` instead

### Tables

#### `pms_bookings` — Guest Bookings
- **Owner:** Captains (via PMS sync)
- **Read by:** daily-recap, morning-briefing, sale-to-ops
- **Key columns:** property_id, arrivaldate, departuredate, guestname, total_room_charges, roomtypeunkid, payment_status
- **Query example:**
  ```
  GET {SUPABASE_URL}/pms_bookings?property_id=eq.blrxzo&arrivaldate=gte.{today}
  ```

#### `housekeeping_staff` — Staff Directory
- **Owner:** Captains
- **Read by:** staff-report
- **Key columns:** id, name, property, role, active, joined_date, reward_points

#### `housekeeping_sessions` — Cleaning Tasks
- **Owner:** Captains (auto-logged)
- **Read by:** staff-report
- **Key columns:** staff_id, property, zone, task_type, assigned_at, started_at, completed_at, photo_before, photo_after, photo_verified

#### `daily_performance` — Staff Performance Metrics
- **Owner:** System (aggregated daily)
- **Read by:** staff-report, morning-briefing
- **Key columns:** staff_id, date, tasks_assigned, tasks_completed, avg_time_minutes, photo_pass_rate, points_earned, flag

#### `canonical_events` — Event Registry
- **Owner:** Suki (via luma-sync)
- **Read by:** daily-recap, morning-briefing
- **Key columns:** event_id, name, culture_tag, start_at, end_at, location

#### `event_registrations` — Event Guests
- **Owner:** Suki (via luma-sync)
- **Read by:** event-recap, day-of-event
- **Key columns:** event_id, guest_email, registration_status, checked_in

#### `event_inquiries` — Hosting Inquiries
- **Owner:** Suki (via typeform-sync)
- **Read by:** event-inquiry
- **Key columns:** first_name, last_name, email, phone, organization, event_type, budget, venue_preference

#### `founder_profiles` — Community Members
- **Owner:** ZomadPrime
- **Read by:** guest-welcome, founder-outreach, community-pulse
- **Key columns:** id, display_name, email, membership, status, founder_token_ids

---

## External APIs

### Luma (Event Management)

**Base URL:** `https://public-api.luma.com/v1`
**Auth:** `x-luma-api-key: {LUMA_API_KEY}`

| Endpoint | Method | Purpose | Used By |
|----------|--------|---------|---------|
| `/calendar/list-events?after={date}&before={date}` | GET | List events in date range | luma-sync, daily-recap |
| `/event/get?event_id={id}` | GET | Event details | event-recap |
| `/event/get-guests?event_id={id}` | GET | Guest list + registration status | luma-sync, day-of-event |

**Critical notes:**
- ALWAYS pass `after` parameter — without it, API returns only oldest 50 events
- Pagination: check `next_cursor` in response
- BLRxZo uses `$LUMA_API_KEY_BLRXZO`, WTFxZo uses `$LUMA_API_KEY_SFOXZO` — DO NOT mix these
- Rate limits apply — if you get 429, wait 60 seconds and retry

### Google Sheets API v4

**Base URL:** `https://sheets.googleapis.com/v4/spreadsheets`
**Auth:** OAuth 2.0 Bearer token (from Google credentials)

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Read range | GET | `/{sheetId}/values/{range}` |
| Write range | PUT | `/{sheetId}/values/{range}?valueInputOption=USER_ENTERED` |
| Append row | POST | `/{sheetId}/values/{range}:append?valueInputOption=USER_ENTERED` |

**Notes:**
- Tab names with spaces need URL encoding: `'main list'` → `'main%20list'`
- Tab names are case-sensitive
- Range format: `'Tab Name'!A1:O100`
- Strip `₹`, commas, and spaces when parsing financial values

### Google Calendar API v3

**Base URL:** `https://www.googleapis.com/calendar/v3`
**Auth:** OAuth 2.0 Bearer token

| Calendar | ID | Property |
|----------|-----|----------|
| Events | `zo-events@zohouse.co` | All |
| BLR Property | `zo-blr@zohouse.co` | BLRxZo |
| WTF Property | `zo-wtf@zohouse.co` | WTFxZo |

### Google Drive API v3

**Base URL:** `https://www.googleapis.com/drive/v3`
**Auth:** OAuth 2.0 Bearer token
**Used for:** Invoices, contracts, event assets, partner documents

### Typeform

**Base URL:** `https://api.typeform.com`
**Auth:** `Authorization: Bearer {TYPEFORM_TOKEN}`

| Form | ID | Purpose |
|------|-----|---------|
| Event Inquiry | `LgcBfa0M` | External event hosting requests |

**Field IDs (for parsing responses):**
- `c020d8de` — first_name
- `b931d769` — last_name
- `5c9964fc` — email
- `828119d2` — phone
- Other fields: organization, event_type, budget, venue_preference, expected_headcount

---

## Telegram

### Bot
- **Token:** `$TELEGRAM_BOT_TOKEN`
- **Managed by:** OpenClaw gateway

### Chat IDs (for sending messages)

| Person | Telegram ID | Receives From |
|--------|------------|---------------|
| Samurai | `1275114944` | ZomadPrime (morning-briefing, weekly-scorecard, alerts) |
| Darshan | `1081875702` | BLRxZo JR (daily-recap, morning-audit, maintenance alerts) |
| Akhilesh | `558199761` | WTFxZo JR (daily-recap, morning-audit) |
| Boldrin | `817242399` | Suki (event updates), Wanda (pipeline), Yana (BD updates) |

### Agent Routing (OpenClaw Bindings)

| Telegram DM From | Routes To Agent |
|-------------------|----------------|
| Darshan (`1081875702`) | blrxzo-jr |
| Akhilesh (`558199761`) | wtfxzo-jr |
| Boldrin (`817242399`) | suki |
| Anyone else on allowlist | main (ZomadPrime) |

---

## OpenClaw Gateway

**Port:** 18789 (localhost)
**Auth:** Token-based (`$OPENCLAW_GATEWAY_TOKEN`)
**Model:** Claude Haiku 4.5
**Max concurrent:** 4 agents, 8 subagents
**Heartbeat:** Every 1 hour
**Context pruning:** cache-ttl mode (1 hour)

### Gateway CLI Commands (used by zo-api proxy)
```
openclaw gateway call status          → Gateway health
openclaw gateway call agents          → Agent list
openclaw gateway call cron            → Cron job status
openclaw gateway call presence        → Agent activity map
```

---

## zo-api (Express Server)

**Port:** 3001 (local) or via Tailscale Funnel (HTTPS)
**Data directory:** `./data/`

### Runtime Files
| File | Purpose | Created By |
|------|---------|-----------|
| `data/external_agents.json` | External agent registry | zo-api |
| `data/shared_tasks.json` | Shared task board | zo-api |

---

## Credential Files

**Location on Windows PC:** `C:\Users\user\.openclaw\` and `C:\Users\user\.credentials\`
**Location in skills (legacy):** `/home/conscious-house/.credentials/`

| File | Contents | Used By |
|------|----------|---------|
| `apis.json` | Luma API keys, Supabase credentials | daily-recap, luma-sync, staff-report |
| `google.json` | Google OAuth client ID, secret, refresh token | All google-workspace skills |
| `sheets.json` | Auto-generated Google Sheets OAuth token | financial-entry, morning-audit |
| `openclaw.json` | OpenClaw gateway config | Gateway startup |

**Security notes:**
- `SUPABASE_SERVICE_ROLE_KEY` has full database access — treat as root password
- Google refresh tokens don't expire but can be revoked
- Luma API keys are per-calendar — rotation requires updating env vars
- Telegram bot token compromise = full bot control — rotate immediately if leaked
- NEVER commit credential files to git

---

## Financial Reference

| Field | Value |
|-------|-------|
| Company | Zoworld Experiential Stays Pvt Ltd |
| GSTIN | 29AADCZ9152C1ZI |
| State Code | 29 (Karnataka) |
| GST Rate | 18% |
| Bank | HDFC Bank |
| Account | 50200089338498 |
| IFSC | HDFC0001751 |
| Account Type | Current |
| Invoice Format | `ZO-INV-{YYYYMMDD}-{SEQ}` |
| Crypto | USDT (TRC20) — wallet shared on request |
| Currency | INR (unless explicitly USD/crypto) |

---

## Error Handling Rules

Every skill that reads from a data source MUST follow these rules:

| Source | If Unavailable | Fallback |
|--------|---------------|----------|
| Supabase | API returns error or timeout | Note "Database unavailable" in output. Proceed with other sources. |
| Google Sheets | 403 (auth expired) or 429 (rate limit) | For 403: note "Sheets auth expired — ask Samurai to re-auth". For 429: wait 60s, retry once. |
| Luma API | Error or empty response | Note "Luma data unavailable". Check if API key is correct for property. |
| Typeform | Error or no new responses | Note "No new inquiries" (not an error). |
| Telegram | Message fails to send | Retry once. If still fails, log error and notify ZomadPrime. |
| Local files | File not found | Create the file with empty/default structure. Note "Created new {file}". |

**Never silently fail.** If data is missing, say so in the output. Partial data is better than no output.
