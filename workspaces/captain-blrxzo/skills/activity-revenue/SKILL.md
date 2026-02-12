# Skill: activity-revenue

## Purpose
Data entry skill — captain sends an image or text about an activity revenue entry (e.g. pickle ball booking, workshop fee, equipment rental), agent parses, confirms with captain, and appends a row to the Activity Revenue tab in the BLRxZo P&L sheet.

## Property
- **Property:** BLRxZo (Zo House Bangalore — Koramangala)
- **Captain:** Darshan (Telegram: 1081875702)

## Triggers
- "activity", "pickle ball", "workshop", "booking", "activity revenue"
- "log activity", "add activity revenue", "new activity"
- Captain sends an image (booking confirmation, payment screenshot)
- Captain sends text about an activity booking or revenue

## Recipients
- **Darshan** (Telegram ID: 1081875702) — confirmation messages only

---

## DATA SOURCE: Google Sheet — BLRxZo P&L

- **Sheet ID:** `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y`
- **Tab:** `Activity Revenue`
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
GET /v4/spreadsheets/{sheetId}/values/'Activity Revenue'!A1:J1
```

Build a map: `header_name → column_index`. Expected headers (verified live):

| Col | Header |
|-----|--------|
| A | DATE |
| B | NAME |
| C | LOCATION |
| D | REFERENCE |
| E | CONTACT |
| F | CHECKIN TIME |
| G | CHECKOUT TIME |
| H | AMOUNT |
| I | AMOUNT STATUS |
| J | PAYMENT TYPE |

If headers don't match expected names, log a warning and fall back to position-based indexing.

### Append a new row

```
POST /v4/spreadsheets/{sheetId}/values/'Activity Revenue'!A1:J1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS
Body: {"values": [["{date}", "{name}", "{location}", "{reference}", "{contact}", "{checkin_time}", "{checkout_time}", "{amount}", "{amount_status}", "{payment_type}"]]}
```

---

## Flow: Human Message → Parse → Confirm → Write

### Step 1: Receive input from captain

Captain sends one of:
- **Image** (booking confirmation, payment screenshot)
- **Text message** (e.g. "Pickle ball booking, Amit, 2 hours, 800 paid UPI")

### Step 2: Parse the input

Extract these 10 fields from the image or text:

| Field | How to extract | Default if missing |
|-------|---------------|-------------------|
| DATE | From booking date or message date | Today's date (DD/MM/YYYY) |
| NAME | Guest/participant name | **ASK** — do not guess |
| LOCATION | Where the activity happened (zone or facility name) | **ASK** — do not guess |
| REFERENCE | Booking source, referral, or activity type | Leave blank if not mentioned |
| CONTACT | Phone number or email | Leave blank if not provided |
| CHECKIN TIME | Activity start time | Leave blank if not specified |
| CHECKOUT TIME | Activity end time | Leave blank if not specified |
| AMOUNT | Amount charged in INR | **ASK** — do not guess |
| AMOUNT STATUS | PAID or other status | **ASK** — do not guess |
| PAYMENT TYPE | Cash, UPI, Card, etc. | **ASK** — do not guess |

### Common activity types at BLRxZo
- Pickle Ball bookings
- Workshop fees
- Equipment rental
- Studio bookings
- Private event space rental
- Other recurring activities (as discovered)

### Step 3: Confirm with captain

```
📝 ACTIVITY REVENUE — please confirm:

• Date: 12/02/2026
• Name: Amit Shah
• Location: Pickle Ball Court
• Reference: Walk-in
• Contact: 9876543210
• Check-in: 4:00 PM
• Check-out: 6:00 PM
• Amount: ₹800
• Status: PAID
• Payment: UPI

✅ Confirm to log | ❌ Cancel | ✏️ Tell me what to change
```

### Step 4: Wait for captain response

- **If confirmed** → proceed to Step 5
- **If captain sends corrections** → update field(s), show again, wait for confirmation
- **If cancelled** → acknowledge and stop
- **Do NOT write to the sheet until captain explicitly confirms**

### Step 5: Write to sheet

Append the confirmed row using the Sheets API append method.

### Step 6: Confirm write

```
✅ Logged: Amit Shah — Pickle Ball Court — ₹800 (UPI, PAID)
```

---

## Date and Time Formatting

- **DATE:** `DD/MM/YYYY` (e.g. `12/02/2026`)
- **CHECKIN TIME:** `HH:MM AM/PM` (e.g. `4:00 PM`)
- **CHECKOUT TIME:** `HH:MM AM/PM` or blank if not known

### CRITICAL: Preventing Date Format Flip

Google Sheets `USER_ENTERED` mode auto-interprets `12/02/2026` as December 2 (US mm/dd) instead of February 12 (Indian dd/mm). **Always prefix the DATE value with an apostrophe** (`'12/02/2026`) to force plain text. The apostrophe is invisible in the cell display.

---

## Multiple Bookings in One Message

If captain sends info for multiple bookings:
1. Parse each booking separately
2. Show ALL entries for confirmation in one message
3. Wait for single confirmation to write all
4. Write each as a separate row

---

## Error Handling

| Error | Action |
|-------|--------|
| Token refresh fails | Send: "⚠️ Can't access the sheet right now — Google auth error. I'll note this and try again shortly." |
| Sheet API returns error | Send: "⚠️ Couldn't write to the sheet — API error. Please try again in a minute." |
| Image is unreadable | Send: "I can't read this clearly. Can you type: name, activity, amount, payment type?" |
| Field can't be parsed | ASK the captain for the specific field — never guess |
| Rate limited (429) | Wait 60 seconds, retry once. If still 429: "⚠️ Sheet is busy, will retry in a minute." |

---

## RULES

- **Never write to the sheet without captain confirmation** — this is the #1 rule
- Never guess Name, Amount, or Payment Type — always ask if unclear
- Keep confirmation messages short and phone-readable
- Date format: DD/MM/YYYY
- This skill is append-only — do not modify existing rows
- Do not read or report on existing activity data — use daily-recap for that
