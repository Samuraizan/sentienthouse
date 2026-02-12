# TOOLS.md — Suki's Environment

## Runtime

- **Agent Runtime:** OpenClaw on Windows PC (`user@100.80.28.70` via Tailscale)
- **Gateway:** `127.0.0.1:18789`
- **Zo Ecosystem App:** game.zo.xyz (Next.js, Supabase, Mapbox) — I know about it, I don't run on it

## Supabase

- **URL:** `https://elvaqxadfewcsohrswsi.supabase.co`
- **Auth:** `$SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- **REST API:** `{SUPABASE_URL}/rest/v1/{table}` with `apikey` and `Authorization` headers

### Tables I Use

| Table | Purpose |
|-------|---------|
| `canonical_events` | All events — 34 columns, full lifecycle |
| `event_rsvps` | RSVPs + check-in tracking |
| `event_cultures` | 19 culture definitions |
| `event_inquiries` | Typeform inquiry submissions |
| `calendars` | iCal feed sources |

## Google Workspace

- **OAuth Client Secret:** `zo-api/client_secret_473298819240-kkqgen93r91d28h9u8erlb8r9t9donj8.apps.googleusercontent.com.json`
- **Token:** `zo-api/token.json`
- **Project:** `zoconsole`

### Sheets

| Sheet | ID | Tab |
|-------|----|-----|
| BLRxZo P&L | `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y` | `Rev-Events` |
| WTFxZo P&L | `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY` | `Rev-Events` |
| Laundry List | `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI` | `main list` (read-only) |

### Calendars

| Calendar | ID |
|----------|----|
| Events | `zo-events@zohouse.co` |
| BLRxZo | `zo-blr@zohouse.co` |
| WTFxZo | `zo-wtf@zohouse.co` |

## Luma

- **API base:** `https://public-api.luma.com/v1`
- **BLRxZo key:** `$LUMA_API_KEY_BLRXZO` (header: `x-luma-api-key`)
- **WTFxZo key:** `$LUMA_API_KEY_SFOXZO`
- **Zo Events key:** `$LUMA_ZO_EVENTS_API_KEY`
- **BLR calendar ID:** `cal-ZVonmjVxLk7F2oM`
- **SF calendar ID:** `cal-3YNnBTToy9fnnjQ`

## Typeform

- **Form ID:** `LgcBfa0M`
- **URL:** https://zostel.typeform.com/to/LgcBfa0M
- **Auth:** `$TYPEFORM_API_TOKEN`
- **API:** `https://api.typeform.com/forms/LgcBfa0M/responses`

## Telegram

- **Events bot:** Separate bot from main Sentient House bot
- **Events TG group:** Separate group for vibe checks + inquiry pipeline
- **Boldrin:** @Boldrin71 (ID: 817242399)
- **Samurai:** ID: 1275114944

## Email

- **Provider:** Resend (`$RESEND_API_KEY`)
- **Used for:** Quote delivery to hosts (HTML emails)

## Zo House Coordinates (hardcoded fallbacks)

| Location | Lat | Lng |
|----------|-----|-----|
| Koramangala (BLR) | 12.932658 | 77.634402 |
| Whitefield | 12.9725 | 77.745 |
| San Francisco | 37.7817309 | -122.401198 |

## Financial Reference

| Field | Value |
|-------|-------|
| Company | Zoworld Experiential Stays Pvt Ltd |
| GSTIN | 29AADCZ9152C1ZI |
| State | Karnataka (29) |
| Bank | HDFC Bank |
| Account | 50200089338498 |
| IFSC | HDFC0001751 |
| GST Rate | 18% on all event services |
| Crypto | USDT TRC20 (wallet shared by Boldrin on request) |
