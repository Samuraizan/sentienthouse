---
name: daily-recap
description: Generates the standardized daily recap with MTD financials, occupancy, events, and key metrics for Darshan
---

# Daily Recap — BLRxZo

You are BLRxZo JR generating the daily recap for Darshan. This is the most important report of the day.

## Triggers
- "morning update", "daily recap", "daily status", "recap"
- Heartbeat at 8AM IST daily
- Custom range: "recap for last week", "January numbers", "today only"

## Recipients

**ALWAYS send to BOTH:**
1. **Darshan** (Telegram ID: 1081875702) — your House Captain
2. **Samurai** (Telegram ID: 1275114944) — Strategic Director

Both must receive the same recap every morning at 8AM IST. When triggered by heartbeat, send automatically to both. When triggered manually by Darshan, still CC Samurai.

## Output Format

Send this EXACT format:

```
📊 DAILY RECAP - BLRxZo (Darshan)

MONTH TO DATE ({Mon} 1-{today's date}):

💰 REVENUE: ₹{total_revenue}
• Accommodation: ₹{accommodation}
• Co-Working: ₹{coworking}
• Events: ₹{events}
• Cafe: ₹{cafe}

💵 EBITDA: ₹{ebitda} ({🟢 Positive / 🔴 Negative})
• Total Expenses: ₹{total_expenses}
• Rent - Building: ₹{rent} ({X}% of expenses)
• Salaries & Wages: ₹{salaries} ({X}% of expenses)
• Event Expenses: ₹{event_expenses} ({X}% of expenses)

🏠 OCCUPANCY: {X}%
• Beds occupied tonight: {X}/15

🎪 EVENTS TODAY:
• {event name} | {time} | {location}
(or "No events today")

⚠️ KEY METRICS TO WATCH:
• {auto-generated flags}

✅ TODAY'S FOCUS:
→ {top 2-3 priorities}
```

---

## DATA SOURCE 1: Accommodation Revenue → Supabase pms_bookings

**What:** Sum of `total_room_charges` for bookings arriving this month at BLRxZo.

**Credentials:** `/home/conscious-house/.credentials/apis.json` → `supabase.service_role_key`

```bash
BASE="https://elvaqxadfewcsohrswsi.supabase.co/rest/v1"
KEY="$(jq -r .supabase.service_role_key /home/conscious-house/.credentials/apis.json)"

# MTD accommodation revenue
curl -s "$BASE/pms_bookings?select=total_room_charges&property_id=eq.BLRxZo&arrivaldate=gte.2026-02-01T00:00:00&arrivaldate=lt.2026-03-01T00:00:00" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

Sum all `total_room_charges` values from the response array. This is the source of truth for accommodation revenue.

---

## DATA SOURCE 2: Co-Working, Events, Cafe, Expenses, EBITDA → Google Sheet

**Sheet:** BLRxZo Running PnL
**Sheet ID:** `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y`
**Tab:** `Summary 2026`

**How to get the token and read:**
```bash
TOKEN=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "client_id=$(jq -r .client_id /home/conscious-house/.credentials/google.json)" \
  -d "client_secret=$(jq -r .client_secret /home/conscious-house/.credentials/google.json)" \
  -d "refresh_token=$(jq -r .refresh_token /home/conscious-house/.credentials/google.json)" \
  -d "grant_type=refresh_token" | jq -r .access_token)

# Read the entire summary (rows 1-42, cols A-Z)
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://sheets.googleapis.com/v4/spreadsheets/1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y/values/%27Summary%202026%27%21A1%3AZ42"
```

**Finding the current month's column:**
- Row 2 contains month headers: `Jan-26`, `Feb-26`, `Mar-26`, etc.
- Column B = labels, Column C = Jan-26, Column D = Feb-26, and so on
- Match current month format `{Mon}-{YY}` (e.g., `Feb-26`) to find the right column index

**Row mapping (column B = label, read from the matched month column):**

| Row | Label | Use For |
|-----|-------|---------|
| 4 | Accommodation | IGNORE — use Supabase number instead (more real-time) |
| 5 | Events | Events revenue |
| 6 | Co-Working | Co-Working revenue |
| 7 | Activity Revenue | Activity revenue (add to total if non-zero) |
| 8 | Cafe | Cafe revenue |
| 9 | Total Revenue [A] | Cross-check: should ≈ Supabase accomm + sheet events + coworking + cafe |
| 11 | Advertisment & Publicity | Expense line |
| 17 | Event Expenses | Event costs — show in recap |
| 24 | Rent - Building | Rent — show in recap |
| 30 | Salaries & Wages | Salaries — show in recap |
| 38 | Total Expenses [B] | Total expenses |
| 39 | EBITDA | EBITDA |

**Parsing values:** Strip `₹`, commas, and spaces. Handle negative: `"-₹55,725"` → `-55725`. Use Indian number format in output: `₹4,93,934`.

---

## DATA SOURCE 3: Occupancy → Supabase pms_bookings

**BLRxZo total capacity: 15 beds**
- 1× 4-bed mixed dorm (4 beds)
- 1× 5-bed mixed dorm (5 beds)
- 1× 3-bed female dorm (3 beds)
- 3× private rooms (3 beds)

**Today's occupancy:**
```bash
# Count guests staying tonight
curl -s "$BASE/pms_bookings?select=guestname,roomtypeunkid&property_id=eq.BLRxZo&arrivaldate=lte.{today}T23:59:59&departuredate=gte.{today}T00:00:00" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

**Occupancy % = (count of results / 15) × 100** — round to 2 decimal places.

**MTD average occupancy:** If requested, calculate occupancy for each day of the month and average. For the standard daily recap, just show tonight's number.

---

## DATA SOURCE 4: Events/Activities → Luma API

**IMPORTANT:** You MUST pass the `after` parameter with yesterday's date, otherwise the API returns only the oldest 50 events and you'll miss today's events.

```bash
# Replace {yesterday} with yesterday's date in ISO format
curl -s -H "x-luma-api-key: $LUMA_API_KEY_BLRXZO" \
  "https://public-api.luma.com/v1/calendar/list-events?after={yesterday}T00:00:00Z&sort_column=start_at&sort_direction=asc"
```

**Response format:** Events are in `entries[].event` (not a flat array). Each event has `name`, `start_at`, `end_at`, `geo_address_json.full_address`, `geo_address_json.city`. Pagination: check `has_more` and use `pagination_cursor` if needed.

**Filter for BLRxZo events:** Match these strings (case-insensitive) in `geo_address_json.full_address`, `geo_address_json.city`, or `name`:
- `Koramangala`, `koramangala`
- `BLRxZo`, `blrxzo`
- `Brigade Road`, `brigade`
- `Indiranagar`, `indiranagar`
- `Zo House Bangalore` (if it's the Koramangala location)

**Filter for today:** Compare event `start_at` date (ISO format: `2026-02-10T...`) to today's date. Times are in UTC — add 5:30 for IST.

Show: event name, time (converted to IST), location. If guest count available from Luma, show it.

---

## KEY METRICS AUTO-FLAGS

Generate the ⚠️ section based on these rules:
- EBITDA negative → "EBITDA negative — ₹{amount} gap to breakeven"
- Occupancy below 80% → "Occupancy at {X}% — below 80% target"
- Any revenue line dropped >20% vs previous month → "{Category} down {X}% vs last month"
- Rent > 70% of total expenses → "Rent-heavy: {X}% of all expenses"
- No events this week → "No events scheduled — revenue risk"
- Expenses growing faster than revenue (compare MTD ratios) → "Expense ratio widening"

Generate the ✅ section: top 2-3 actionable priorities for today based on the flags above.

---

## DATE RANGE BEHAVIOR

- **Default:** Current month MTD (1st to today)
- **"last month" / "January":** Read the previous month's column from the sheet
- **"today only":** Show only today's Supabase collections + today's events
- **"weekly":** Last 7 days from Supabase + current month column from sheet
- **Custom range:** If Darshan specifies dates, adapt the Supabase query range. Sheet data is always monthly columns.

## RULES

- Never fabricate numbers. If a source is down, show "⚠️ unavailable" for that line.
- Format all currency in Indian numbering: ₹4,93,934 not ₹493,934
- Keep the full report scannable on a phone — under 40 lines for the main recap
- Always end with the day assessment:
  - "Strong day — targets met, operations smooth."
  - "Solid day — minor issues, all handled."
  - "Challenging day — {reason}. Follow-up: {action}."
  - "Below target — revenue at {X}%. Recommend: {action}."
