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
| `LUMA_API_KEY_SFOXZO` | Luma calendar API — Whitefield events | luma-sync, daily-recap (WTFxZo) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot for all agent messaging | OpenClaw gateway |
| `OPENCLAW_GATEWAY_TOKEN` | Gateway authentication | zo-api gateway proxy |
| `GOOGLE_SHEET_BLRXZO` | BLRxZo P&L sheet ID | financial-entry, daily-recap |
| `GOOGLE_SHEET_WTFXZO` | WTFxZo P&L sheet ID | financial-entry, daily-recap |
| `TYPEFORM_TOKEN` | Typeform API access | event-inquiry sync |
| `TYPEFORM_API_TOKEN` | Typeform API access (alias used in Suki skills) | typeform-sync |
| `RESEND_API_KEY` | Resend email API (quote delivery to hosts) | Suki (quote emails) |
| `LUMA_ZO_EVENTS_API_KEY` | Luma Zo Events calendar API key | luma-sync (Zo Events calendar) |
| `ANTHROPIC_API_KEY` | Shared Anthropic API key for all agents | OpenClaw gateway |
| `PORT` | zo-api server port (default: 3001) | zo-api |
| `DATA_DIR` | Runtime data directory (default: ./data) | zo-api |

**Note:** All env vars live on the **Windows PC** (`C:\Users\user\sentienthouse\.env`). The Mac repo is dev/docs only — never conclude a key is "missing" by only checking Mac.

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
- **Owner:** Suki (via luma-sync) + game.zo.xyz (community events)
- **Read by:** daily-recap, morning-briefing, event-to-ops, day-of-event, event-recap
- **Column count:** 39 columns (not 34 as originally documented)
- **Key columns:** id, title, description, location_name, zo_property_id, starts_at, ends_at, tz, max_capacity, current_rsvp_count, host_name, category, culture, external_rsvp_url, luma_event_id, submission_status
- **Event categories:** `community` (user-created, may need vibe check), `sponsored` (external host, inquiry pipeline), `ticketed` (paid entry, schema ready)
- **Submission status flow:** `draft` → `pending` → `approved` / `rejected` / `cancelled`
- **Current data:** 7 events (all community/test — no sponsored events yet)

#### `event_rsvps` — Event Attendance
- **Owner:** Suki (via luma-sync) + game.zo.xyz (self-serve RSVPs)
- **Read by:** event-recap, day-of-event, event-to-ops
- **Key columns:** event_id, guest_email, registration_status, checked_in
- **RSVP state machine:** `pending` → `interested` → `going` / `waitlist` → `checked_in`
- **Current data:** 15 RSVPs across 7 test events

#### `event_inquiries` — Hosting Inquiries
- **Owner:** Suki (via typeform-sync / game.zo.xyz webhook)
- **Read by:** event-inquiry, event-to-ops
- **Key columns:** host_name, host_email, host_phone, organization, event_type, event_date, budget, expected_headcount, venue_preference, duration, needs_projector, needs_music, needs_catering, needs_accommodation, needs_convention_hall, needs_outdoor_area, additional_notes, inquiry_status
- **IMPORTANT:** Uses `host_name` (NOT `first_name/last_name`). Budget is free-text (not normalized): "$500-1000", "1 lakh", "Expecting a Barter :)"
- **Current data:** 56 inquiries — **all stuck at `inquiry_status: "new"`, none processed**. Companies include Devfolio, ETHGlobal, Monad, Coinbase, Scale VP, Abnormal AI.

#### `event_cultures` — Culture Definitions
- **Owner:** System (seeded)
- **Read by:** event-to-ops, event-marketing
- **Key columns:** slug, emoji, color, sticker_url
- **Current data:** 19 cultures, all active: science_technology, business, design, food, game, health_fitness, home_lifestyle, law, literature_stories, music_entertainment, nature_wildlife, photography, spiritual, travel_adventure, television_cinema, stories_journal, sport, follow_your_heart, default

#### `calendars` — iCal Feed Sources
- **Owner:** System
- **Read by:** luma-sync
- **Key columns:** calendar_id, source_type, source_url
- **Contains Luma calendar IDs:** BLR = `cal-ZVonmjVxLk7F2oM`, SF = `cal-3YNnBTToy9fnnjQ`

#### `canonical_event_changes` — Event Audit Trail
- **Owner:** System (auto-logged)
- **Read by:** luma-sync (for dedup/conflict resolution)
- **Purpose:** Tracks all changes to canonical_events for sync operations

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

**Calendar IDs:**
- BLR calendar: `cal-ZVonmjVxLk7F2oM`
- SF/Whitefield calendar: `cal-3YNnBTToy9fnnjQ`

**API keys (3 separate keys):**
- `$LUMA_API_KEY_BLRXZO` — BLRxZo (Koramangala) calendar
- `$LUMA_API_KEY_SFOXZO` — WTFxZo (Whitefield) calendar (Note: variable name is legacy SFO, but maps to Whitefield)
- `$LUMA_ZO_EVENTS_API_KEY` — Zo Events master calendar

**Critical notes:**
- ALWAYS pass `after` parameter — without it, API returns only oldest 50 events
- Pagination: check `next_cursor` in response
- DO NOT mix API keys between properties
- Rate limits apply — if you get 429, wait 60 seconds and retry
- game.zo.xyz can push approved events to Luma (feature-flagged: `LUMA_API_SYNC`)
- game.zo.xyz can pull RSVPs from Luma (webhook + cron sync)

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
**Auth:** `Authorization: Bearer {TYPEFORM_TOKEN}` (also aliased as `$TYPEFORM_API_TOKEN`)
**Form URL:** https://zostel.typeform.com/to/LgcBfa0M

| Form | ID | Purpose |
|------|-----|---------|
| Event Inquiry | `LgcBfa0M` | External event hosting requests |

**Intake pipeline:**
- Primary: Webhook to game.zo.xyz (`/api/webhooks/typeform`)
- Fallback: Poll worker (`/api/worker/poll-typeform`) for missed webhooks
- Parser extracts fields by title (not field ID) in game.zo.xyz

**Field IDs (for direct API parsing):**
- `c020d8de` — first_name
- `b931d769` — last_name
- `5c9964fc` — email
- `828119d2` — phone
- Other fields: organization, event_type, budget, venue_preference, expected_headcount

**Note:** Data lands in Supabase `event_inquiries` table using `host_name` (not separate first/last). Budget is free-text, not normalized.

### Resend (Email)

**Base URL:** `https://api.resend.com`
**Auth:** `Authorization: Bearer {RESEND_API_KEY}`
**Used by:** Suki (quote delivery to hosts via HTML emails)
**Implementation:** `quoteSender.ts` in game.zo.xyz sends calculated quotes from `quoteEngine.ts`

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

**Port:** 18789 (localhost on Windows PC)
**Auth:** Token-based (`$OPENCLAW_GATEWAY_TOKEN`)
**Auth schema:** v1 (`"type":"token"`, `"provider":"anthropic"`) — NOT `"mode":"api-key"`
**Model:** Claude Haiku 4.5
**Max concurrent:** 4 agents, 8 subagents
**Heartbeat:** Every 1 hour
**Context pruning:** cache-ttl mode (1 hour)
**Runtime:** Windows PC (`user@100.80.28.70` via Tailscale SSH), installed as Windows scheduled task

### Active Cron Jobs (6 total, as of 2026-02-13)

| Job | Agent | Schedule | Type |
|-----|-------|----------|------|
| BLRxZo Morning Audit | captain-blrxzo | 10:00 AM IST daily | Task audit → Telegram |
| WTFxZo Morning Audit | captain-wtfxzo | 10:00 AM IST daily | Task audit → Telegram |
| BLRxZo Agent-KOT Fudr Sync | captain-blrxzo | Every 1 hour | Gmail → Sheets (silent) |
| WTFxZo Agent-KOT Fudr Sync | captain-wtfxzo | Every 1 hour | Gmail → Sheets (silent) |
| BLRxZo PMS Update | captain-blrxzo | Every 1 hour | Supabase → Sheets (silent) |
| WTFxZo PMS Update | captain-wtfxzo | Every 1 hour | Supabase → Sheets (silent) |

**Important:** Gateway reads crons from `~/.openclaw/cron/jobs.json`, NOT from the project's `config/cron-jobs.json`. Register new crons via `openclaw cron add` CLI.

### Gateway CLI Commands (used by zo-api proxy)
```
openclaw gateway call status          → Gateway health
openclaw gateway call agents          → Agent list
openclaw gateway call cron            → Cron job status
openclaw gateway call presence        → Agent activity map
```

### Auth Fix (non-interactive onboard)
```
openclaw onboard --non-interactive --accept-risk --auth-choice token --token <KEY> --token-provider anthropic --skip-channels --skip-skills --skip-daemon --skip-ui --skip-health
```
Auth files at: `C:\Users\user\.openclaw\agents\<id>\agent\auth-profiles.json`

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

**IMPORTANT: Mac vs Windows Runtime Split**
- **Mac repo** (`/Users/samuraizan/Sentient House/sentienthouse-monorepo/`) = dev/docs copy only
- **Windows PC** (`C:\Users\user\sentienthouse\`) = where OpenClaw agents actually execute
- ALL runtime credentials live on Windows — NEVER conclude config is "missing" by only checking Mac

**Location on Windows PC:** `C:\Users\user\.openclaw\` and `C:\Users\user\sentienthouse\`
**Location in skills (legacy, BROKEN):** `/home/conscious-house/.credentials/` — needs updating
**Actual Google OAuth files:** `zo-api/client_secret_473298819240-kkqgen93r91d28h9u8erlb8r9t9donj8.apps.googleusercontent.com.json` + `zo-api/token.json`

| File | Contents | Location | Used By |
|------|----------|----------|---------|
| `.env` | All API keys (Supabase, Luma, Telegram, etc.) | Repo root on Windows | All agents |
| `zo-api/client_secret_*.json` | Google OAuth client credentials | Repo root on Windows | google-workspace skills |
| `zo-api/token.json` | Google OAuth refresh token | Repo root on Windows | google-workspace skills |
| `auth-profiles.json` | OpenClaw agent authentication (v1 schema) | `~/.openclaw/agents/<id>/agent/` on Windows | OpenClaw gateway |
| `openclaw.json` | OpenClaw gateway config | `~/.openclaw/` on Windows | Gateway startup |

**Security notes:**
- `SUPABASE_SERVICE_ROLE_KEY` has full database access — treat as root password
- Google refresh tokens don't expire but can be revoked
- Luma API keys are per-calendar — rotation requires updating env vars
- Telegram bot token compromise = full bot control — rotate immediately if leaked
- `ANTHROPIC_API_KEY` shared by all 7 agents — rotation requires re-onboarding all agents
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

---

## Zo Ecosystem (game.zo.xyz)

The Zo World community app (`game.zo.xyz`) is part of the same ecosystem and shares Supabase tables. Agents should know about it but not duplicate its functionality.

### What game.zo.xyz Provides
- **Community event creation** — 5-step modal (type → culture → details → location → review)
- **Sponsored event intake** — Typeform → webhook → venue matcher → TG notification → quote engine → email via Resend
- **RSVP system** — full state machine (pending → interested → going/waitlist → checked_in) with capacity management
- **Vibe Check governance** — pending events trigger TG community vote (24h window, simple majority)
- **Luma integration** — event push + RSVP sync (feature-flagged: `LUMA_API_SYNC`)
- **Venue matcher** — scores venues against inquiry requirements (100-point scale)
- **Quote engine** — calculates venue rate + F&B per-head + GST 18%
- **Cover images** — Supabase Storage `event-covers` bucket with culture sticker fallbacks
- **GeoJSON map** — events plotted on Mapbox with culture stickers and clustering

### Feature Flags
| Flag | What It Controls |
|------|-----------------|
| `VIBE_CHECK_TELEGRAM` | Pending events → TG community vote |
| `LUMA_API_SYNC` | Auto-push approved events to Luma |
| `EVENT_INQUIRY_PIPELINE` | Typeform → venue match → quote pipeline |
| `CANONICAL_EVENTS_READ` | UI reads from DB vs iCal |
| `CANONICAL_EVENTS_WRITE` | Worker writes to DB |

### Venue Coordinates
| Location | Lat | Lng |
|----------|-----|-----|
| Koramangala (BLR) | 12.932658 | 77.634402 |
| Whitefield | 12.9725 | 77.745 |
| San Francisco | 37.7817309 | -122.401198 |

---

*Last updated: 2026-02-13*
