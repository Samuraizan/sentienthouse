# Skill: running-opex

## Purpose
Data entry skill — captain sends an image (invoice/receipt/screenshot) or text message about an expense, agent parses, confirms with captain, and appends a row to the Running OPEX tab in the WTFxZo P&L sheet.

## Property
- **Property:** WTFxZo (Zo House Bangalore — Whitefield)
- **Captain:** Akhilesh (Telegram: 558199761)

## Triggers
- "expense", "payment", "paid", "bought", "invoice"
- "log expense", "add expense", "opex entry"
- Captain sends an image (receipt/invoice/payment screenshot)
- Captain sends a text describing an expense

## Recipients
- **Akhilesh** (Telegram ID: 558199761) — confirmation messages only

---

## DATA SOURCE: Google Sheet — WTFxZo P&L

- **Sheet ID:** `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY`
- **Tab:** `Running OPEX`
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
GET /v4/spreadsheets/{sheetId}/values/'Running OPEX'!A1:H1
```

Build a map: `header_name → column_index`. Expected headers (verified live):

| Col | Header |
|-----|--------|
| A | Date |
| B | Accrual Month |
| C | Items |
| D | Quantity |
| E | Head of Account |
| F | Amount |
| G | Payment Mode |
| H | Remarks |

**NOTE:** WTFxZo uses "Accrual Month" (not "Month") and "Items" (not "Item") — these differ from BLRxZo.

If headers don't match expected names, log a warning and fall back to position-based indexing.

### Append a new row

```
POST /v4/spreadsheets/{sheetId}/values/'Running OPEX'!A1:H1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS
Body: {"values": [["{date}", "{accrual_month}", "{items}", "{quantity}", "{head_of_account}", "{amount}", "{payment_mode}", "{remarks}"]]}
```

---

## Flow: Human Message → Parse → Confirm → Write

### Step 1: Receive input from captain

Captain sends one of:
- **Image** (photo of receipt, invoice, UPI screenshot, payment confirmation)
- **Text message** (e.g. "paid 500 for kitchen supplies, cash")
- **Forwarded message** (e.g. UPI payment notification)

### Step 2: Parse the input

Extract these 8 fields from the image or text:

| Field | How to extract | Default if missing |
|-------|---------------|-------------------|
| Date | From receipt date, payment date, or message date | Today's date (DD/MM/YYYY) |
| Accrual Month | Derive from the Date field | Current month (format: `Mon-YY`, e.g. `Feb-26`) |
| Items | Description of what was purchased/paid for | **ASK** — do not guess |
| Quantity | Number of units, or "1" for services | `1` |
| Head of Account | Expense category (see valid list below) | **ASK** — do not guess |
| Amount | Total amount in INR | **ASK** — do not guess |
| Payment Mode | Cash, UPI, Bank Transfer, Card, Credit, etc. | **ASK** — do not guess |
| Remarks | Any extra notes, vendor name, invoice number | Leave blank if none |

**CRITICAL: Never guess Items, Head of Account, or Amount. If you can't parse them from the image/text, ASK the captain.**

### Step 3: Confirm with captain

Show the parsed data as a bullet list and ask for confirmation:

```
📝 EXPENSE ENTRY — please confirm:

• Date: 12/02/2026
• Accrual Month: Feb-26
• Items: Kitchen gas cylinder refill
• Quantity: 1
• Head of Account: Kitchen Supplies
• Amount: ₹1,200
• Payment Mode: Cash
• Remarks: Vendor: Sri Gas Agency

✅ Confirm to log | ❌ Cancel | ✏️ Tell me what to change
```

### Step 4: Wait for captain response

- **If confirmed** → proceed to Step 5
- **If captain sends corrections** (e.g. "amount is 1300" or "head should be HK Supplies") → update the field(s), show the updated entry again, wait for confirmation
- **If cancelled** → acknowledge and stop
- **Do NOT write to the sheet until captain explicitly confirms**

### Step 5: Write to sheet

Append the confirmed row using the Sheets API append method.

### Step 6: Confirm write

```
✅ Logged: ₹1,200 — Kitchen gas cylinder refill → Kitchen Supplies (Cash)
```

---

## Date and Month Formatting

- **Date column:** `DD/MM/YYYY` (e.g. `12/02/2026`)
- **Accrual Month column:** `Mon-YY` (e.g. `Feb-26`)
- Derive Accrual Month from Date automatically — captain should not need to specify month separately
- If the expense is for a different month than the date (e.g. "this is for January"), use the month the captain specifies

---

## Valid Heads of Account

These are the 27 expense categories from the P&L Summary. Captain provides this — agent matches to the closest valid name:

- Advertising and Promotion
- Commission
- Postage and Delivery
- Dues and Subscription
- Miscellaneous
- Electricity
- Event Expenses
- HK Manpower
- HK Supplies
- Kitchen Supplies
- Licenses and Permits
- Office Supplies
- Professional Services
- Rent-Building
- Rent-Furniture
- R&M General
- R&M Carpentry
- R&M Electricals
- R&M Plumbing
- Salaries and Wages
- Software and Technology
- Staff Welfare
- Telephone and Internet
- Travel and Conveyance
- Trips and Group Activities
- Water
- Waste Management

### Fuzzy matching for Head of Account

If captain says a short form or variation, match to the closest valid name:
- "kitchen" → Kitchen Supplies
- "electricity" or "power" → Electricity
- "rent" → ask: "Building rent or furniture rent?"
- "R&M" or "repair" → ask: "General, Carpentry, Electricals, or Plumbing?"
- "HK" → ask: "Manpower or Supplies?"
- "salary" or "wages" → Salaries and Wages
- "software" or "tech" → Software and Technology
- "travel" → Travel and Conveyance
- "misc" → Miscellaneous
- "internet" or "wifi" → Telephone and Internet

If you can't match to any category, ASK the captain — do not default to Miscellaneous.

---

## Image Parsing Guidelines

When captain sends a receipt/invoice image:
- Look for: vendor name, date, itemized list, total amount, payment method
- UPI screenshots: extract amount, recipient, date, UPI transaction ID (put in Remarks)
- Bank transfer screenshots: extract amount, beneficiary, date, reference number
- Handwritten receipts: extract what you can, ASK for anything unclear
- If image is blurry or unreadable: tell the captain and ask them to type the details

---

## Multiple Items in One Message

If captain sends multiple expenses in one message:
1. Parse each expense separately
2. Show ALL entries for confirmation in one message
3. Wait for single confirmation to write all
4. Write each as a separate row

```
📝 2 EXPENSE ENTRIES — please confirm:

1. ₹1,200 — Gas cylinder → Kitchen Supplies (Cash)
2. ₹450 — Cleaning supplies → HK Supplies (UPI)

✅ Confirm both | ❌ Cancel | ✏️ Tell me what to change
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Token refresh fails | Send: "⚠️ Can't access the sheet right now — Google auth error. I'll note this and try again shortly." |
| Sheet API returns error | Send: "⚠️ Couldn't write to the sheet — API error. Please try again in a minute." |
| Image is unreadable | Send: "I can't read this image clearly. Can you type out the details? I need: items, amount, head of account, payment mode." |
| Field can't be parsed | ASK the captain for the specific field — never guess |
| Amount seems unusually high (>₹50,000) | Confirm: "That's ₹{amount} — just confirming this is correct?" |
| Rate limited (429) | Wait 60 seconds, retry once. If still 429: "⚠️ Sheet is busy, will retry in a minute." |

---

## RULES

- **Never write to the sheet without captain confirmation** — this is the #1 rule
- Never guess Head of Account or Amount — always ask if unclear
- Keep confirmation messages short and phone-readable
- One row per expense item (if a receipt has 3 line items, that's 3 rows)
- Date format: DD/MM/YYYY, Accrual Month format: Mon-YY (e.g. Feb-26)
- Do not modify existing rows — this skill is append-only
- Do not read or report on existing OPEX data — use daily-recap for that
