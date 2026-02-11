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
- Node.js 22+
- 4GB+ RAM
- Always-on (set power settings to prevent sleep)

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

### Workspace Paths

In `openclaw.json`, all workspace paths must point to your local clone:

```json
{
  "workspace": "C:/Users/You/sentienthouse/workspaces/bd"
}
```

Use forward slashes even on Windows.

### Cron Jobs

Cron jobs are stored in `~/.openclaw/cron/jobs.json`. The `config/cron-jobs.json` in this repo is a reference copy.

To restore cron jobs from the repo:
```powershell
copy config\cron-jobs.json %USERPROFILE%\.openclaw\cron\jobs.json
```

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
| Telegram not responding | Verify bot token and allowFrom IDs |
| Vercel can't reach API | Check Tailscale Funnel is running |
| Cron jobs not firing | `openclaw cron list` to check status |
