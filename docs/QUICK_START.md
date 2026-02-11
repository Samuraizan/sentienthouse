# Quick Start Guide

Get Sentient House running on your Windows PC in 15 minutes.

## Step 1: Install prerequisites

1. **Node.js 22+** — [Download](https://nodejs.org)
2. **Git** — [Download](https://git-scm.com)
3. **Tailscale** — [Download](https://tailscale.com/download)
4. **OpenClaw** — `npm install -g openclaw@latest`

## Step 2: Clone the repo

```powershell
git clone https://github.com/Samuraizan/sentienthouse.git
cd sentienthouse
```

## Step 3: Configure secrets

```powershell
# Create .env from template
copy .env.example .env
# Edit .env with real API keys (Supabase, Luma, Telegram, etc.)
notepad .env
```

Create `.credentials/` directory:
```powershell
mkdir .credentials
# Copy apis.json, google.json, sheets.json, drive.json into .credentials/
```

## Step 4: Configure OpenClaw

```powershell
# Copy template to OpenClaw config location
mkdir %USERPROFILE%\.openclaw
copy config\openclaw.template.json %USERPROFILE%\.openclaw\openclaw.json
# Edit and replace all __PLACEHOLDER__ values
notepad %USERPROFILE%\.openclaw\openclaw.json
```

**Key values to replace:**
- `__TELEGRAM_BOT_TOKEN__` → Your Telegram bot token
- `__GATEWAY_TOKEN__` → Generate with: `openclaw gateway token`
- `__REPO_ROOT__` → Full path to your sentienthouse clone (e.g., `C:/Users/You/sentienthouse`)
- Telegram IDs → Real Telegram user IDs for each person

## Step 5: Run setup

```powershell
.\scripts\setup.ps1
```

## Step 6: Start services

```powershell
.\scripts\start-all.ps1
```

This starts:
- **zo-api** on port 3001 (Express API)
- **OpenClaw gateway** on port 18789 (agent orchestration)

## Step 7: Expose externally

```powershell
tailscale funnel 3001
```

This gives you a public HTTPS URL like `https://your-machine.tail12345.ts.net` that the Vercel frontend can call.

## Step 8: Update Vercel frontend

Set the API URL environment variable in Vercel dashboard:
```
VITE_API_URL=https://your-machine.tail12345.ts.net
```

## Verify

- [ ] `http://localhost:3001/health` returns healthy
- [ ] `sentienthouse.vercel.app` loads the 3D scene
- [ ] Telegram bot responds to messages
- [ ] Cron jobs fire on schedule (check with `openclaw cron list`)
