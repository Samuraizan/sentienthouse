# Skill: agent-kot

## Purpose
Automated background task — monitors Gmail for incoming Fudr cafe order emails, parses them, looks up item prices, and appends item-level rows to the `Agent-KOT` tab in the WTFxZo P&L sheet. Runs silently with zero human intervention unless an error occurs.

## Property
- **Property:** WTFxZo (Zo House Bangalore — Whitefield)
- **Order ID prefix:** `NL0EKX` (all WTFxZo Fudr orders start with this)
- **Fudr account name in email:** "Zo House - Whitefield" / "In Account of: Zo House - Whitefield"
- **Captain:** Akhilesh (Telegram: 558199761)

## Trigger
- **Auto:** Runs every 30 minutes during operating hours (8:00 AM – 11:00 PM IST)
- **Also runs on:** Agent startup / restart
- **No manual trigger needed** — this is a background daemon task

## Data Flow

```
Gmail (noreply@fudr.in) → Parse email body → Lookup prices (Supabase menu_items) → Append to Agent-KOT tab → Done
```

## Step-by-Step Logic

### 1. Read existing Order IDs from sheet (deduplication)
- **Sheet ID:** `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY`
- **Tab:** `Agent-KOT`
- **Auth:** Google Sheets API v4 with OAuth token from `zo-api/token.json`
- Read column A (Order ID) from `Agent-KOT!A2:A` to get all already-processed order IDs
- Store as a Set for O(1) lookup

### 2. Search Gmail for new Fudr order emails
- **Auth:** Gmail API with same OAuth token from `zo-api/token.json`
- **Search query:** `from:noreply@fudr.in subject:"new Order" newer_than:2d`
  - `newer_than:2d` keeps the search window small and fast
  - Combined with deduplication in step 1, this ensures no duplicates and no missed orders
- Fetch up to 100 message IDs per run

### 3. For each email, fetch and parse
- Fetch full message body (base64 decode `payload.body.data` or `payload.parts[0].body.data`)
- **Filter:** Only process if Order ID starts with `NL0EKX` (skip BLRxZo orders starting with `3194`)
- **Skip:** If Order ID already exists in the dedup set from step 1

#### Parse fields from email body:
| Field | Regex Pattern | Example |
|-------|--------------|---------|
| Order ID | `Order ID\s*:\s*\*?([^\n*]+)` | `NL0EKX260212-9` |
| Date & Time | `Date & Time\s*:\s*\*?([^\n*]+)` | `February 12, 2026, 02:18 PM` |
| Guest Name | `Guest Name\s*:\s*\*?([^\n*]+)` | `darshan` |
| Guest Phone | `Guest number\s*:\s*\*?([^\n*]+)` | `7034777880` |
| Location | `Location:\s*(.+)` | `Degen Lounge - 2` |
| Amount | `Amount:\s*[₹Rs.]*\s*([\d,]+)` | `88` |
| Payment Status | `Payment Status:\s*(\w+)` | `PAID` |
| Items | `\* (\d+) X ([^(\n]+?)(?:\s*\(\s*(.+?)\s*\))?\s*$` | `01 X Ginger Tea` |

#### Date parsing:
- Input: `"February 12, 2026, 02:18 PM"`
- Extract date portion: `new Date("February 12, 2026")` → format as `MM/DD/YYYY`
- Extract time portion: `02:18 PM`

#### Item parsing:
- Each line matching `* {qty} X {name}` or `* {qty} X {name} ( {variant} )`
- Strip `&amp;` → `&`
- One row per item per order

### 4. Look up item prices from Supabase
- **Endpoint:** `GET https://$SUPABASE_URL/rest/v1/menu_items?select=item_name,price&active=eq.true`
- **Auth:** `apikey` and `Authorization: Bearer` headers with `$SUPABASE_SERVICE_ROLE_KEY`
- Build a lowercase lookup map: `item_name.lower() → price`

#### Fuzzy matching rules (Fudr names ≠ menu_items names):
| Fudr Name | menu_items Name |
|-----------|----------------|
| Watermelon juice | Water Melon Juice |
| Banana milk shake | Banana Shake |
| Ice Tea | Iced Tea |
| Veg Sandwich | Veg Club Sandwich |
| Dal Rice | Dal Rice Bowl |
| Garlic Noodles | Garlic Noodles - Veg |
| Chicken Burrito Bowl | Non- Veg Burrito Bowl |
| Cappuccino | Cappucino |
| Maggi of Choice | Maggie (base price) |
| Chicken sandwich | Chicken Sandwich |

#### Match order:
1. Exact lowercase match
2. Alias table match
3. Substring match (either direction)
4. If still no match → leave Item Price blank, add item name to unmatched log

#### Combo items:
- If item name is "Lunch", "Dinner", or "Breakfast" (case-insensitive) → Item Price = blank, Remark = "combo"
- These are variable-price combo meals, not in the a-la-carte menu

### 5. Append rows to Agent-KOT tab
- **Sheet ID:** `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY`
- **Tab:** `Agent-KOT`
- **Range:** `'Agent-KOT'!A2:M` (append after existing data)
- **Method:** `POST .../values/{range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`

#### Row format (13 columns):
| Column | Source |
|--------|--------|
| A: Order ID | Parsed from email |
| B: Order Date | Parsed, format `MM/DD/YYYY` |
| C: Order Time | Parsed, format `HH:MM AM/PM` |
| D: Guest Name | Parsed from email |
| E: Guest Phone | Parsed from email |
| F: Location | Parsed from email (zone name in the property) |
| G: Item Name | Parsed from email item line |
| H: Item Variant | Parsed from parenthetical, or blank |
| I: Quantity | Parsed from `{qty} X` |
| J: Item Price | From Supabase menu_items lookup (per unit) |
| K: Order Total | The `Amount:` from the email (total for entire order) |
| L: Payment Status | PAID / UNPAID from email |
| M: Remark | "combo" for Lunch/Dinner/Breakfast items, else blank |

### 6. Log result (silent unless errors)
- On success: Log internally only — `"agent-kot: +{n} rows from {x} new orders"`
- **Do NOT message the captain** for successful runs
- On partial failure (some items unmatched): Log warning, still write what you can
- On full failure: See error handling below

## Error Handling

| Error | Action |
|-------|--------|
| Google token refresh fails | Log error. Retry on next scheduled run. If fails 3 consecutive times → message captain: "⚠️ agent-kot: Google auth failing, may need token refresh" |
| Gmail API unreachable | Skip this run, retry next cycle. No alert unless 3 consecutive failures. |
| Sheet API unreachable | Skip this run, retry next cycle. No alert unless 3 consecutive failures. |
| Supabase unreachable | Still write rows but with blank Item Price. Log: "⚠️ Menu prices unavailable, prices blank for this batch" |
| Email parse fails | Skip that email, log the Order ID. Do NOT skip the entire batch. |
| Item not found in menu_items | Write row with blank price. Accumulate unmatched items. If >5 unmatched in one run → message captain with the list. |
| Duplicate Order ID detected | Skip silently (already in sheet). This is expected behavior. |
| No new orders found | Do nothing. This is normal outside cafe hours. |

## Credentials

| Service | Auth Method | Location |
|---------|------------|----------|
| Google Sheets API v4 | OAuth2 access token (refresh via refresh_token) | `zo-api/token.json` + `zo-api/client_secret_473298819240-kkqgen93r91d28h9u8erlb8r9t9donj8.apps.googleusercontent.com.json` |
| Gmail API | Same OAuth2 token (scope: gmail.readonly) | Same as above |
| Supabase | Service role key | `$SUPABASE_URL`, `$SUPABASE_SERVICE_ROLE_KEY` from environment |

## Known Fudr Locations at WTFxZo
Degen Lounge, and other zones at the Whitefield property (to be discovered as orders come in)

## Important Notes
- This skill is **read-only on Gmail** — it only searches and reads emails, never modifies/deletes them
- This skill is **append-only on Sheets** — it never edits or deletes existing rows
- The `newer_than:2d` window + dedup means the agent can safely restart without data loss or duplicates
- WTFxZo email notifications were turned on Feb 12 2026 — historical data before this date is not available via email
- The agent should refresh the OAuth token before each run (tokens expire after 1 hour)
- Both BLRxZo and WTFxZo Fudr accounts send emails to the same inbox (`blrxzo@zo.xyz`), so filtering by Order ID prefix (`NL0EKX`) is critical
