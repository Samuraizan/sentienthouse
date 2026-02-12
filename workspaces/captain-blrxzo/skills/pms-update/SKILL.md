# Skill: pms-update

## Purpose
Automated data-entry skill — reads booking data from Supabase `pms_bookings` table, runs pro-rata calculations to allocate revenue across months, and writes the total accommodation figure for the current month into the Summary 2026 worksheet of the BLRxZo P&L sheet.

## Property
- **Property:** BLRxZo (Zo House Bangalore — Koramangala)
- **Property ID (Supabase filter):** `BLRxZo`
- **Captain:** Darshan (Telegram: 1081875702)

## Triggers
- Cron: daily at 6:00 AM IST
- Manual: "update accommodation", "sync pms", "accommodation revenue"

## Recipients
- **Darshan** (Telegram ID: 1081875702) — summary after write

---

## DATA SOURCE 1: Supabase — pms_bookings

- **URL:** `https://elvaqxadfewcsohrswsi.supabase.co/rest/v1`
- **Table:** `pms_bookings`
- **Auth:** Service Role Key from `.env` → `SUPABASE_SERVICE_ROLE_KEY`
- **Headers:** `apikey: {SUPABASE_ANON_KEY}`, `Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}`

### Relevant Columns

| Column | Type | Description |
|--------|------|-------------|
| `tranunkid` | text | Unique booking ID |
| `arrivaldate` | timestamptz | Check-in datetime |
| `departuredate` | timestamptz | Check-out datetime |
| `total` | numeric | Total booking amount (inc. tax) |
| `total_room_charges` | numeric | Room charges excl. tax |
| `total_tax` | numeric | Tax amount |
| `property_id` | text | `BLRxZo` or `WTFxZo` |
| `cancellationno` | text | Cancellation ref (null or empty = active) |
| `gname` | text | Guest first name |

### Query: All bookings overlapping target month

For month M (1-12) of year Y:

```
GET /pms_bookings?property_id=eq.BLRxZo&arrivaldate=lt.{Y}-{M+1}-01&departuredate=gt.{Y}-{M}-01&select=tranunkid,arrivaldate,departuredate,total_room_charges
```

This returns every booking whose stay overlaps any part of the target month.

---

## DATA SOURCE 2: Google Sheet — BLRxZo P&L

- **Sheet ID:** `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y`
- **Tab:** `Summary 2026`
- **Auth:** Google Sheets API v4 with OAuth token from `zo-api/token.json`

### Target Cell

| Row | Content | Col C | Col D | ... | Col N |
|-----|---------|-------|-------|-----|-------|
| 2 | Headers | Jan-26 | Feb-26 | ... | Dec-26 |
| 4 | **Accommodation** | Jan value | Feb value | ... | Dec value |

**Column formula:** `column_letter = String.fromCharCode(67 + (month - 1))` where Jan=C, Feb=D, ..., Dec=N

**Cell reference for month M:** `'Summary 2026'!{column_letter}4`

Example: February → `'Summary 2026'!D4`

---

## PRO-RATA CALCULATION

For each booking that overlaps the target month:

```
total_nights = (departuredate - arrivaldate) in days  (min 1)
month_start  = max(arrivaldate, first_day_of_month)
month_end    = min(departuredate, first_day_of_next_month)
nights_in_month = (month_end - month_start) in days  (min 0)

revenue_this_month = total_room_charges * (nights_in_month / total_nights)
```

**Sum all `revenue_this_month`** across all overlapping bookings → this is the Accommodation figure.

### Rules
- Use `total_room_charges` (excl. tax), NOT `total` (inc. tax)
- Skip bookings where `total_room_charges = 0` (comp stays / staff bookings)
- Date math uses calendar days (midnight to midnight in IST/UTC+5:30)
- A 1-night stay (e.g. arrival Feb 10, departure Feb 11) = 1 night in Feb
- Round final sum to nearest integer (no decimals in the sheet)

---

## EXECUTION FLOW

### Step 1: Determine target month
- Default: current month (IST timezone)
- Manual override: captain can specify "update accommodation for January"

### Step 2: Query Supabase
```
GET /pms_bookings?property_id=eq.BLRxZo
    &arrivaldate=lt.{next_month_start}
    &departuredate=gt.{month_start}
    &select=tranunkid,arrivaldate,departuredate,total_room_charges
```

### Step 3: Pro-rata calculation
For each returned booking:
1. Parse `arrivaldate` and `departuredate` as dates
2. Calculate `total_nights` = ceil((departure - arrival) / 86400000) or min 1
3. Clamp to month: `month_start` = max(arrival, 1st of month), `month_end` = min(departure, 1st of next month)
4. `nights_in_month` = ceil((month_end - month_start) / 86400000)
5. `prorata` = `total_room_charges * nights_in_month / total_nights`
6. Skip if `total_room_charges === 0`

Sum all prorata values → `accommodation_total`
Round to nearest integer.

### Step 4: Write to Google Sheet
```
PUT /v4/spreadsheets/1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y/values/'Summary 2026'!{col}4?valueInputOption=USER_ENTERED
Body: {"values": [[accommodation_total]]}
```

Where `col` = column letter for the target month (C=Jan, D=Feb, ..., N=Dec).

### Step 5: Confirm via Telegram
```
BLRxZo Accommodation updated for Feb 2026:
- Bookings processed: 20
- Comp/zero stays skipped: 3
- Total: ₹5,32,355
- Cell: Summary 2026!D4
```

---

## VERIFICATION

After writing, read back the cell to confirm:
```
GET /v4/spreadsheets/1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y/values/'Summary 2026'!{col}4
```

If read-back value doesn't match written value, alert the captain.

---

## ERROR HANDLING

| Error | Action |
|-------|--------|
| Supabase returns empty | Send: "No bookings found for BLRxZo in {month}. Cell not updated." |
| Supabase auth fails | Send: "Supabase auth error — check service role key." |
| Google token refresh fails | Send: "Google auth error — can't write to sheet." |
| Sheet write fails | Send: "Sheet write failed for Summary 2026!{col}4. Will retry." |
| Read-back mismatch | Send: "WARNING: Written ₹{x} but cell shows ₹{y}. Please check manually." |

---

## RULES

- This skill is **fully automated** — no captain confirmation needed before writing
- Only writes to ONE cell per run: `Summary 2026!{col}4`
- Uses `total_room_charges` (excl. tax) — never `total` (inc. tax)
- Skips zero-revenue bookings (comp stays, staff rooms)
- Runs daily to capture new/modified bookings throughout the month
- Previous month values are NOT overwritten unless captain explicitly requests
- This skill unlocks `daily-recap` which reads from the same Summary row
