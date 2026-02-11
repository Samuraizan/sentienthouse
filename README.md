# Sentient House

**AI-powered operations platform for [Zo House](https://zo.house) coliving properties.**

Seven specialized AI agents run 24/7, each paired with a human partner, managing everything from guest check-ins and event coordination to sales pipelines and community vibes — orchestrated through a real-time 3D command center.

> *"AI handles the logistics so humans can handle the love."*

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    3D Command Center                     │
│              zo-house-3d (React + Three.js)              │
│         Live visualization of all agent activity         │
└──────────────────────┬──────────────────────────────────┘
                       │ polls every 15s
┌──────────────────────▼──────────────────────────────────┐
│                      zo-api (Express)                    │
│    REST API · Agent registry · Task board · Skills       │
└──────────┬───────────────────────────────┬──────────────┘
           │                               │
┌──────────▼──────────┐     ┌──────────────▼──────────────┐
│   OpenClaw Gateway   │     │      Cloud Services         │
│  7 agents · Telegram │     │  Supabase · Luma · Google   │
│  Cron · Heartbeats   │     │  Typeform · Telegram Bot    │
└─────────────────────┘     └─────────────────────────────┘
```

The **3D Command Center** (deployed on Vercel) visualizes agent activity in real time — animated characters working at desks, walking between zones, collaborating on tasks. The **Express API** bridges the frontend to the **OpenClaw gateway** running locally on a Windows PC, which orchestrates all seven agents and their scheduled jobs.

---

## The Agents

Each agent has a distinct personality, skillset, and human partner. They communicate via Telegram and operate within defined workflows.

| Agent | Codename | Role | Human Partner |
|-------|----------|------|---------------|
| **ZomadPrime** | `director` | Strategic Orchestrator — daily briefs, cross-agent coordination, KPI tracking | Samurai |
| **BLRxZo JR** | `captain-blrxzo` | House Captain (Bangalore) — 12hr shifts, guest flow, maintenance, finances | Darshan |
| **WTFxZo JR** | `captain-wtfxzo` | House Captain (Goa) — property ops, staff supervision, daily audits | Akhilesh |
| **Suki** | `events` | Events Manager — planning, vendor coordination, marketing, post-event analysis | Boldrin |
| **LOKI** | `vibe-curator` | Vibe Curator — guest onboarding, daily vibes, community pulse, consent culture | Pooja |
| **Wanda** | `sales` | Sales — lead qualification, outreach sequences, pipeline management, booking conversion | Boldrin |
| **Yana** | `bd` | Business Development — partner research, founder outreach, deal pipeline | Boldrin |

Each agent's personality, workflows, and skills are defined in `workspaces/<codename>/`.

---

## Project Structure

```
sentienthouse/
├── zo-house-3d/           3D Command Center (React 19 + Three.js + Zustand)
│   ├── src/scene/         Three.js components (agents, zones, effects, camera)
│   ├── src/ui/            Overlay panels (metrics, status, skills, messages)
│   ├── src/services/      Gateway polling service
│   └── src/store/         Zustand state management
│
├── zo-api/                Express API server (port 3001)
│   ├── server.js          Main server — agents, tasks, skills, bookings, staff
│   ├── routes/gateway.js  Proxy to OpenClaw gateway CLI
│   └── google-auth.js     Google OAuth2 integration
│
├── workspaces/            Agent definitions (one folder per agent)
│   ├── director/          ZomadPrime — SOUL.md, AGENTS.md, TOOLS.md, skills/
│   ├── captain-blrxzo/    BLRxZo JR
│   ├── captain-wtfxzo/    WTFxZo JR
│   ├── events/            Suki
│   ├── vibe-curator/      LOKI
│   ├── sales/             Wanda
│   └── bd/                Yana
│
├── config/
│   ├── openclaw.template.json   OpenClaw gateway configuration
│   └── cron-jobs.json           Scheduled tasks (18 jobs)
│
├── scripts/
│   ├── setup.ps1          First-time Windows setup
│   ├── start-all.ps1      Start all services (Windows)
│   ├── start.ps1          PowerShell startup
│   ├── start.bat          CMD startup (double-clickable)
│   └── start.sh           Linux/Mac startup
│
├── docs/
│   ├── QUICK_START.md     15-minute setup guide
│   ├── DEPLOYMENT_GUIDE.md
│   └── agent-specs/       Detailed agent specifications
│
└── data/                  Runtime data (created on startup)
    ├── external_agents.json
    └── shared_tasks.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **3D Frontend** | React 19, Three.js, @react-three/fiber, @react-three/drei, Zustand, Vite |
| **API Server** | Express 5, Node.js 22+ |
| **Agent Orchestration** | OpenClaw (CLI gateway), Claude Haiku 4.5 |
| **Database** | Supabase (PostgreSQL) |
| **Integrations** | Telegram Bot, Luma, Google Workspace (Calendar, Sheets, Drive, Gmail), Typeform |
| **Networking** | Tailscale (VPN + Funnel for HTTPS) |
| **Deployment** | Vercel (frontend), Local Windows PC (API + agents) |
| **Hardware** | AMD Ryzen 9 7950X3D, 64GB RAM, RTX 4090, ~2TB NVMe |

---

## Quick Start

### Prerequisites

- **Node.js 22+**
- **[OpenClaw](https://openclaw.dev)** — `npm install -g openclaw@latest`
- **[Tailscale](https://tailscale.com/download)** — for secure remote access

### 1. Clone & configure

```bash
git clone https://github.com/Samuraizan/sentienthouse.git
cd sentienthouse

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (Supabase, Telegram, Luma, Google, etc.)
```

### 2. Configure OpenClaw

```bash
# Copy the template and fill in real values
cp config/openclaw.template.json ~/.openclaw/openclaw.json
# Replace all __PLACEHOLDER__ values with actual tokens
```

### 3. Install & run

**Windows (recommended):**
```powershell
.\scripts\setup.ps1        # First-time setup — checks prereqs, installs deps
.\scripts\start-all.ps1    # Start zo-api + zo-house-3d + OpenClaw
```

**Mac / Linux:**
```bash
./scripts/start.sh
```

### 4. Expose externally (optional)

```bash
tailscale funnel 3001
```

This gives the Vercel-deployed frontend a public HTTPS URL to reach the local API.

### 5. Verify

- **API health:** http://localhost:3001/health
- **3D frontend:** http://localhost:3002 (dev) or your Vercel URL
- **OpenClaw gateway:** port 18789

---

## API Reference

**Base URL:** `http://localhost:3001`

### Core

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/agents` | List all agents (core + external) |
| `POST` | `/agents/register` | Register an external agent |
| `POST` | `/agents/:id/heartbeat` | Agent heartbeat |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tasks` | Shared task board (JSON + Supabase) |
| `POST` | `/tasks` | Create a task |
| `PATCH` | `/tasks/:id` | Update task status/priority |
| `GET` | `/actions` | Pending actions (review column) |

### Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/bookings` | PMS bookings (last 20) |
| `GET` | `/staff` | Active housekeeping staff |
| `GET` | `/staff/performance` | Daily performance metrics |
| `GET` | `/schedules` | Today's housekeeping schedules |
| `GET` | `/founders` | Founder member profiles |

### Skills

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/skills` | All skills across all agents |
| `GET` | `/skills/:agentId` | Skills for a specific agent |
| `GET` | `/skills/:agentId/:skillId` | Full skill detail with content |

### Gateway Proxy

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/gateway/all` | Aggregated gateway data |
| `GET` | `/api/gateway/status` | Gateway health + heartbeat |
| `GET` | `/api/gateway/agents` | Agent list from OpenClaw |
| `GET` | `/api/gateway/cron` | Cron schedules + status |
| `GET` | `/api/gateway/presence` | Agent presence map |

---

## Cron Schedule

Managed by OpenClaw's built-in scheduler. Defined in `config/cron-jobs.json`.

| Time | Job | Agent |
|------|-----|-------|
| 8:00 AM IST | Daily recap | BLRxZo JR, WTFxZo JR |
| 10:00 AM IST | Morning audit | All captains + Suki |
| 10:00 AM UTC | Morning briefing | ZomadPrime |
| Daily | Luma event sync | Suki |
| Daily | Typeform inquiry sync | Suki |
| Monday 10 AM IST | Weekly scorecard | ZomadPrime |

---

## Deployment

| Component | Where | How |
|-----------|-------|-----|
| **zo-house-3d** | Vercel | Auto-deploys on push to `main` |
| **zo-api** | Local Windows PC | `start-all.ps1` or Task Scheduler on boot |
| **OpenClaw gateway** | Local Windows PC | Started by scripts, port 18789 |
| **Tailscale Funnel** | Local Windows PC | Exposes port 3001 over HTTPS |

See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) for production setup details.

---

## License

Private. All rights reserved.
