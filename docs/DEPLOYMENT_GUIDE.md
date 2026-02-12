# Deployment Guide

## Architecture Overview

```
Vercel (sentienthouse.vercel.app)
  └── zo-house-3d (Vite + React + Three.js)
        ↓ API calls
Windows PC (always-on)
  ├── zo-api (Express, port 3001)
  ├── OpenClaw gateway (port 18789)
  ├── Tailscale Funnel (HTTPS proxy)
  └── Agent workspaces + skills
```

## Vercel Setup

The `zo-house-3d/` folder deploys to Vercel automatically.

### Vercel Project Settings

1. Go to Vercel Dashboard
2. Set **Root Directory** to `zo-house-3d`
3. Set **Build Command** to `npm run build`
4. Set **Output Directory** to `dist`
5. Add environment variable:
   - `VITE_API_URL` = your Tailscale Funnel URL

### Custom Domain (optional)

In Vercel dashboard, add your custom domain and point DNS to Vercel.

## Windows PC Setup

### System Requirements

- Windows 10/11
- Node.js 22+ (v22.14.0 currently installed)
- 4GB+ RAM (current: AMD Ryzen 9 7950X3D, RTX 4090, 64GB)
- Always-on (set power settings to prevent sleep)
- Tailscale for SSH access and Funnel

### CRITICAL: Mac vs Windows Runtime Split
- **Mac repo** = dev/docs copy, NOT the runtime
- **Windows PC** (`C:\Users\user\sentienthouse\`) = where OpenClaw agents actually execute
- ALL runtime config lives on Windows: `.env`, `zo-api/token.json`, Google OAuth, Luma API keys
- NEVER conclude a key/config is "missing" by only checking the Mac repo — always SSH to Windows to verify
- HEARTBEAT.md edits on Mac need `git push` + `git pull` on Windows to take effect

### Power Settings

Prevent the PC from sleeping:
1. Settings > System > Power & Sleep
2. Set "Sleep" to **Never** (when plugged in)
3. Set "Screen" to **Never** or your preference

### Auto-Start on Boot

Create a Task Scheduler entry:

1. Open Task Scheduler
2. Create Basic Task: "Sentient House"
3. Trigger: "When the computer starts"
4. Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "C:\path\to\sentienthouse\scripts\start-all.ps1"`
5. Check "Run whether user is logged on or not"

### Tailscale Funnel

Tailscale Funnel exposes a local port via a stable HTTPS URL.

```powershell
# One-time setup
tailscale up
tailscale funnel 3001
```

The Funnel URL (e.g., `https://your-machine.tail12345.ts.net`) is stable and doesn't change. Set this as `VITE_API_URL` in Vercel.

### Firewall

Windows Firewall should auto-allow Node.js. If not:
1. Windows Security > Firewall > Allow an app
2. Add `node.exe` for Private networks

## OpenClaw Configuration

### Authentication (v1 Schema)

OpenClaw v2026.2.9 uses **v1 auth schema**. All 7 agents share the same Anthropic API key.

Auth files at: `%USERPROFILE%\.openclaw\agents\<agent-id>\agent\auth-profiles.json`

Correct v1 schema:
```json
{"version":1,"profiles":{"anthropic:default":{"type":"token","provider":"anthropic","token":"sk-ant-..."}}}
```

**Common error:** "No API key found" = wrong schema. Old/broken schemas used `"mode":"api-key"` and `"key":"sk-ant-..."`.

To fix non-interactively:
```powershell
openclaw onboard --non-interactive --accept-risk --auth-choice token --token YOUR_KEY --token-provider anthropic --skip-channels --skip-skills --skip-daemon --skip-ui --skip-health
```

### Workspace Paths

In `openclaw.json`, all workspace paths must point to your local clone:

```json
{
  "workspace": "C:/Users/You/sentienthouse/workspaces/bd"
}
```

Use forward slashes even on Windows.

### Cron Jobs

**IMPORTANT:** Gateway reads crons from `~/.openclaw/cron/jobs.json`, NOT from the project's `config/cron-jobs.json`. The repo config is a reference copy only.

Register new crons via CLI: `openclaw cron add`

**Current active jobs (6 total):**

| Job | Agent | Schedule |
|-----|-------|----------|
| BLRxZo Morning Audit | captain-blrxzo | 10:00 AM IST daily |
| WTFxZo Morning Audit | captain-wtfxzo | 10:00 AM IST daily |
| BLRxZo Agent-KOT Fudr Sync | captain-blrxzo | Every 1 hour |
| WTFxZo Agent-KOT Fudr Sync | captain-wtfxzo | Every 1 hour |
| BLRxZo PMS Update | captain-blrxzo | Every 1 hour |
| WTFxZo PMS Update | captain-wtfxzo | Every 1 hour |

**Removed crons (2026-02-12):** Daily Recap (both captains), Director Morning Briefing, Director Weekly Scorecard, Suki Event Sync, Suki Typeform Sync, Task Kanban Sync, and 8+ disabled legacy crons.

### Telegram Bot

The Telegram bot token is set in `openclaw.json` under `channels.telegram.botToken`. The bot must be running for agents to receive and send messages.

## Monitoring

### Check service health
```powershell
curl http://localhost:3001/health
openclaw gateway call status
```

### View logs
```powershell
Get-Content logs\zo-api.log -Tail 50
Get-Content logs\openclaw-gateway.log -Tail 50
```

### Check cron jobs
```powershell
openclaw cron list
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 3001 in use | `netstat -ano \| findstr :3001` then kill the PID |
| Gateway won't start | Check `openclaw.json` exists in `~/.openclaw/` |
| "No API key found" | Auth schema is wrong — re-run `openclaw onboard` with v1 schema (see Authentication section above) |
| Telegram not responding | Verify bot token and allowFrom IDs |
| Vercel can't reach API | Check Tailscale Funnel is running |
| Cron jobs not firing | `openclaw cron list` — jobs must be in `~/.openclaw/cron/jobs.json`, not project config |
| Config "missing" on Mac | Runtime config only lives on Windows — SSH to `user@100.80.28.70` to verify |
| HEARTBEAT.md changes not working | Push from Mac, pull on Windows (`git push` + SSH + `git pull`) |
| WTFxZo getting BLR data | Check Luma API key — `daily-recap` may use wrong key (`$LUMA_API_KEY_BLRXZO` instead of `$LUMA_API_KEY_SFOXZO`) |
