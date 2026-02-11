# Sentient House

AI-powered operations platform for Zo House coliving properties. 7 specialized AI agents manage hostel operations, events, sales, BD, and community — coordinated by ZomadPrime.

## Architecture

```
sentienthouse/
├── zo-house-3d/       → 3D Command Center (Vercel)
├── zo-api/            → Express API server (local)
├── workspaces/        → Agent personalities, skills, configs
├── config/            → OpenClaw config templates, cron jobs
├── scripts/           → Startup scripts (Windows + Linux/Mac)
└── docs/              → Guides
```

## Agents

| Agent | Role | Human Partner |
|-------|------|---------------|
| ZomadPrime | Strategic Orchestrator | Samurai |
| Yana | Business Development | Boldrin |
| Wanda | Sales | Boldrin |
| Suki | Events | Boldrin |
| LOKI | Vibe Curator | Pooja |
| BLRxZo JR | House Captain (Bangalore) | Darshan |
| WTFxZo JR | House Captain (Goa) | Akhilesh |

## Quick Start

### Prerequisites
- Node.js 22+
- [OpenClaw](https://openclaw.dev) (`npm install -g openclaw@latest`)
- [Tailscale](https://tailscale.com/download) (for external access)

### Setup
```bash
git clone https://github.com/Samuraizan/sentienthouse.git
cd sentienthouse

# Copy and fill in secrets
cp .env.example .env
# Edit .env with your real API keys

# Create .credentials/ directory with apis.json, google.json
# See .credentials.example/README.md for details

# Configure OpenClaw
# Copy config/openclaw.template.json to ~/.openclaw/openclaw.json
# Replace __PLACEHOLDERS__ with real values

# Install dependencies
cd zo-api && npm install && cd ..
cd zo-house-3d && npm install && cd ..
```

### Windows
```powershell
.\scripts\setup.ps1      # First-time setup
.\scripts\start-all.ps1  # Start services
```

### Linux/Mac
```bash
./scripts/start-all.sh
```

### Expose API externally
```bash
tailscale funnel 3001
```

## Deployment

- **zo-house-3d** auto-deploys to Vercel on push to `main`
- **zo-api** + **OpenClaw gateway** run on your local machine
- Vercel frontend calls the API via Tailscale Funnel URL

## Cron Jobs

Scheduled tasks are defined in `config/cron-jobs.json` and managed by OpenClaw's built-in cron scheduler. Key schedules:

- **8:00 AM IST** — Daily recaps (BLRxZo JR, WTFxZo JR)
- **10:00 AM IST** — Morning audits (all captains + Suki + ZomadPrime)
- **10:00 AM UTC** — ZomadPrime morning briefing
- **Monday 10 AM IST** — Weekly scorecard

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /agents | List all agents |
| GET | /tasks | Get task board |
| POST | /tasks | Create task |
| GET | /bookings | PMS bookings |
| GET | /staff | Staff list |
| GET | /gateway/all | Aggregated gateway data |
