# Skill: co-working-entry

## Purpose
Data entry skill — captain sends an image or text about a co-working guest, agent parses, confirms with captain, and appends a row to the Co Working Register tab in the WTFxZo P&L sheet.

## Property
- **Property:** WTFxZo (Zo House Bangalore — Whitefield)
- **Captain:** Akhilesh (Telegram: 558199761)

## Triggers
- "co-working", "coworking", "day pass", "guest working", "walk-in"
- "log co-working", "add co-working guest", "new co-working"
- Captain sends an image (guest registration form, payment screenshot)
- Captain sends text about a co-working guest

## Recipients
- **Akhilesh** (Telegram ID: 558199761) — confirmation messages only

---

## DATA SOURCE: Google Sheet — WTFxZo P&L

- **Sheet ID:** `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY`
- **Tab:** `Co Working Register`
- **Auth:** Google Sheets API v4 with OAuth token from `zo-api/token.json`
- **Client secret:** `zo-api/client_secret_473298819240-kkqgen93r91d28h9u8erlb8r9t9donj8.apps.googleusercontent.com.json`

### Authentication

1. Read `zo-api/token.json` to get `refresh_token`
2. Read client secret file to get `client_id` and `client_secret`
3. POST to `https://oauth2.googleapis.com/token` with `grant_type=refresh_token` to get fresh `access_token`
4. Use `Authorization: Bearer {access_token}` on all Sheets API calls

### Tab structure (verified live)

- **Row 1:** Summary row (No. of slots, Price per Slot, Total Amount) — DO NOT write to this row
- **Row 2:** Headers
- **Row 3+:** Data rows

### Header-based column discovery

**Always read row 2** (not row 1) to discover column positions by name.

```
GET /v4/spreadsheets/{sheetId}/values/'Co Working Register'!A2:K2
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
| K | Remark |

**NOTE:** WTFxZo has 11 columns (extra "Remark" column at K) vs BLRxZo's 10 columns. Also "PAYMENT TYPE" is all-caps vs BLRxZo's "Payment Type".

If headers don't match expected names, log a warning and fall back to position-based indexing.

### Append a new row

```
POST /v4/spreadsheets/{sheetId}/values/'Co Working Register'!A3:K3:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS
Body: {"values": [["{date}", "{name}", "{location}", "{reference}", "{contact}", "{checkin_time}", "{checkout_time}", "{amount}", "{amount_status}", "{payment_type}", "{remark}"]]}
```

**Important:** Append range starts at A3 (after headers in row 2), not A2. This preserves the summary row in row 1.

---

## Flow: Human Message → Parse → Confirm → Write

### Step 1: Receive input from captain

Captain sends one of:
- **Image** (guest form, payment screenshot)
- **Text message** (e.g. "Priya, day pass, Degen Lounge, 500 paid UPI, contact 9876543210")

### Step 2: Parse the input

Extract these 11 fields from the image or text:

| Field | How to extract | Default if missing |
|-------|---------------|-------------------|
| DATE | From message context or explicit date | Today's date (DD/MM/YYYY) |
| NAME | Guest's name | **ASK** — do not guess |
| LOCATION | Zone in the property where guest is seated | **ASK** — do not guess |
| REFERENCE | How they found Zo / who referred them | Leave blank if not mentioned |
| CONTACT | Phone number or email | Leave blank if not provided |
| CHECKIN TIME | When the guest arrived | Current time if not specified |
| CHECKOUT TIME | When the guest left | Leave blank (fill later or skip) |
| AMOUNT | Amount charged in INR | **ASK** — do not guess |
| AMOUNT STATUS | PAID or other status | **ASK** — do not guess |
| PAYMENT TYPE | Cash, UPI, Card, etc. | **ASK** — do not guess |
| Remark | Any notes about the guest or visit | Leave blank if none |

### Known locations at WTFxZo
Degen Lounge, and other zones at the Whitefield property (to be discovered as guests come in)

### Step 3: Confirm with captain

```
📝 CO-WORKING ENTRY — please confirm:

• Date: 12/02/2026
• Name: Priya Sharma
• Location: Degen Lounge
• Reference: Walk-in
• Contact: 9876543210
• Check-in: 10:30 AM
• Check-out: —
• Amount: ₹500
• Status: PAID
• Payment: UPI
• Remark: —

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
✅ Logged: Priya Sharma — Degen Lounge — ₹500 (UPI, PAID)
```

---

## Date and Time Formatting

- **DATE:** `DD/MM/YYYY` (e.g. `12/02/2026`)
- **CHECKIN TIME:** `HH:MM AM/PM` (e.g. `10:30 AM`)
- **CHECKOUT TIME:** `HH:MM AM/PM` or blank if guest hasn't left

---

## Multiple Guests in One Message

If captain sends info for multiple guests:
1. Parse each guest separately
2. Show ALL entries for confirmation in one message
3. Wait for single confirmation to write all
4. Write each as a separate row

---

## Checkout Update

If captain says "Priya checked out at 6pm" or "checkout for today's co-working":
1. This requires finding and updating an existing row — NOT appending
2. Read recent rows to find the guest by name and today's date
3. Update the CHECKOUT TIME cell for that row
4. Confirm: "✅ Checkout updated: Priya Sharma — 6:00 PM"

```
PUT /v4/spreadsheets/{sheetId}/values/'Co Working Register'!{CELL}?valueInputOption=USER_ENTERED
Body: {"values": [["{checkout_time}"]]}
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Token refresh fails | Send: "⚠️ Can't access the sheet right now — Google auth error. I'll note this and try again shortly." |
| Sheet API returns error | Send: "⚠️ Couldn't write to the sheet — API error. Please try again in a minute." |
| Image is unreadable | Send: "I can't read this clearly. Can you type: name, location, amount, payment type?" |
| Field can't be parsed | ASK the captain for the specific field — never guess |
| Guest name not found for checkout | Send: "I can't find {name} in today's entries. Can you give me the exact name?" |
| Rate limited (429) | Wait 60 seconds, retry once. If still 429: "⚠️ Sheet is busy, will retry in a minute." |

---

## RULES

- **Never write to the sheet without captain confirmation** — this is the #1 rule
- Never guess Name, Amount, or Payment Type — always ask if unclear
- Keep confirmation messages short and phone-readable
- Do NOT write to Row 1 (summary row) — ever
- Date format: DD/MM/YYYY
- This skill is append-only for new entries, update-only for checkout times
- Do not read or report on existing co-working data — use daily-recap for that
