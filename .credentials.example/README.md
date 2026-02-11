# Credentials Setup

This directory should contain your actual API credentials. **Never commit this to git.**

## Required Files

### `apis.json`
```json
{
  "luma": {
    "blrxzo": "secret-...",
    "sfoxzo": "secret-..."
  },
  "supabase": {
    "url": "https://elvaqxadfewcsohrswsi.supabase.co",
    "anon_key": "eyJ...",
    "service_role_key": "eyJ..."
  }
}
```

### `google.json`
Google OAuth credentials for Sheets API access. Download from Google Cloud Console.

### `sheets.json` / `drive.json`
Google OAuth token files (auto-generated after first auth flow).

## Setup

1. Create a `.credentials/` directory in the repo root (it's gitignored)
2. Copy the files from your secure backup into `.credentials/`
3. The `.env` file at the root references these values

## Getting the keys

| Key | Where to get it |
|-----|----------------|
| Supabase keys | Supabase Dashboard > Settings > API |
| Luma API key | Luma Dashboard > Developer > API Keys |
| Telegram bot token | @BotFather on Telegram |
| Google OAuth | Google Cloud Console > Credentials |
| Typeform token | Typeform Admin > Developer > Personal Tokens |
