# Zo House 3D Command Center — Changelog & Operations Log

## Architecture Overview

```
Browser (Tailscale Funnel HTTPS)
  ├── / → serve -s dist (port 3000) — Vite + React + Three.js
  ├── /api → zo-api Express (port 3001) — REST proxy layer
  └── /gateway → openclaw-gateway (port 18789) — WebSocket (unused by frontend)

zo-api /api/gateway/* routes → shells out to `openclaw gateway call <method>`
  → Returns JSON to browser via HTTP polling (15s interval)
```

### EC2 Instance
- **Type:** m7i-flex.large (2 vCPU Intel Xeon 8488C, 8 GB RAM)
- **Disk:** 8 GB (73% used — tight)
- **OS:** Amazon Linux 2023

### Key Processes (memory baseline)
| Process | RSS | Notes |
|---------|-----|-------|
| openclaw-gateway | ~500 MB | Always running, manages all agent sessions |
| openclaw-cron (per job) | ~350 MB | Spawned per cron execution, then exits |
| node serve (3D frontend) | ~95 MB | Static file server |
| node server.js (zo-api) | ~65 MB | Express API proxy |
| tailscaled | ~90 MB | Tailscale funnel |

**Total baseline:** ~750 MB. Each cron job adds 350 MB. Two concurrent = 1.45 GB spike.

---

## 2026-02-11 — Session Changes

### FIX: API_BASE causing DISCONNECTED status
- **File:** `src/services/gateway.js:18`
- **Problem:** `API_BASE` defaulted to `${window.location.protocol}//${window.location.hostname}:3001`
  which resolved to `https://ip-172-31-23-183.tail797355.ts.net:3001`.
  Tailscale Funnel only exposes port 443. Port 3001 is NOT reachable externally.
- **Fix:** Changed to `const API_BASE = import.meta.env.VITE_API_BASE || ""`
  so fetches use relative paths → `/api/gateway/all` → Funnel routes to port 3001.
- **Rebuild:** `npx vite build` → new hash `index-DiKlM5an.js` (was `index-Qk5Eggqx.js`)
- **Restart:** Killed old serve, restarted via `npx serve -s dist -l 3000`

### FIX: Cron jobs eating resources / gateway timeouts
- **Problem:**
  - Typeform sync ran every 5 min (288 times/day), each spawning ~350 MB process
  - Multiple jobs overlapped at :00 and :30 marks (2+ concurrent = 1.4 GB spike)
  - Gateway timed out during cron execution (can't handle requests while saturated)
  - Internal OpenClaw scheduler AND crontab both trigger same jobs (double execution possible)
- **Fix (crontab):**
  - Added `flock` wrapper to ALL jobs → single lockfile → only 1 cron process at a time
  - Reduced Typeform from `*/5` to `*/15` (still <15 min latency for event inquiries)
  - Staggered all recurring jobs to unique minutes: `:3/:18/:33/:48` (typeform), `:8/:38` (luma), `:13` (kanban), `:23` (blocker)
  - Widened daily job gaps from 5 min to 10 min
  - Reduced timeouts: recurring jobs 90s (was 120s), daily jobs 120s (was 180s)
  - Recurring use `flock -n` (skip if busy), daily use `flock -w 300` (wait up to 5 min)
- **Backup:** Previous crontab saved at `/tmp/crontab-backup-20260211.txt` on server
- **Internal scheduler:** Disabled 7 wasteful jobs permanently, changed 4 recurring jobs to 24h internal interval. Crontab is now the SOLE scheduler.

### FIX: Double execution — Internal scheduler + crontab overlap
- **Problem:** 19 internal scheduler jobs ALL enabled + 13 crontab entries = same jobs firing twice
- **Fix:**
  - Disabled 7 internal-only jobs that were pure waste (PMS sync 10m, BD pipeline 30m, Sales pipeline 30m, Maintenance 1h, Community 1h)
  - Changed Typeform/Luma/Kanban/Blocker internal intervals to 24h (crontab handles real scheduling)
  - Daily/weekly jobs: internal cron expression kept but crontab fires them with `--force`
  - Net result: **crontab is the single source of truth** for all scheduling

### Resource savings
- **Before:** Up to 3 concurrent openclaw-cron processes (1.05 GB spike) + double execution
- **After:** Max 1 process at a time (350 MB spike), zero double execution
- **Memory:** 1.1 GB used (down from 1.4 GB+ during cron storms)
- **Removed 7 wasteful jobs:** PMS sync ×2 (every 10m), BD pipeline (30m), Sales pipeline (30m), Maintenance ×2 (1h), Community activity (1h) — these were burning tokens with no real data sources configured

### Tricks & Patterns That Worked

#### SSH + sudo patterns
- `sudo -u conscious-house bash -c '...'` for running commands as the app user
- `scp` fails on `/home/conscious-house/` (permissions) → copy to `/tmp` first with `sudo cp`, then `sudo chown ec2-user`
- `sudo pkill` can kill the SSH connection itself (exit 255) → use a script file instead
- Write script to `/tmp/restart-serve.sh`, then `sudo -u conscious-house bash /tmp/restart-serve.sh`

#### Vite rebuild & deploy
```bash
# 1. Edit source on server (or scp from local)
sudo python3 -c "..." /path/to/file   # for safe text replacement

# 2. Rebuild (as app user)
sudo -u conscious-house bash -c 'cd /home/conscious-house/zo-house-3d && npx vite build'

# 3. Restart serve (via script to avoid pkill issues)
cat > /tmp/restart-serve.sh << 'EOF'
#!/bin/bash
PID=$(pgrep -f 'node.*serve.*dist.*3000' | head -1)
[ -n "$PID" ] && kill $PID; sleep 2
fuser -k 3000/tcp 2>/dev/null; sleep 1
cd /home/conscious-house/zo-house-3d
nohup npx serve -s dist -l 3000 >> /home/conscious-house/logs/zo-house-3d.log 2>&1 &
sleep 3; ss -tlnp | grep 3000
EOF
sudo -u conscious-house bash /tmp/restart-serve.sh
```

#### Tailscale Funnel routing
- `/` → port 3000 (frontend), `/api` → port 3001 (Express), `/gateway` → port 18789
- Funnel may or may not strip path prefix — zo-api has routes at BOTH `/api/*` AND `/*` as safety net
- Frontend must use relative paths (no explicit port) since Funnel only exposes 443

#### Cron optimization
- `flock -n $LOCK` = non-blocking (skip if another cron is running) — for recurring jobs
- `flock -w 300 $LOCK` = wait up to 5 min — for important daily jobs that must run
- Single lockfile for ALL jobs = only 1 openclaw-cron at a time = 350 MB max spike instead of N×350 MB
- Use prime-ish minute offsets (:3, :8, :13, :18, :23...) to avoid cron collision

#### Gateway data flow
- `openclaw gateway call <method>` shells out and returns JSON with a header line
- zo-api gateway.js parses JSON by finding first `{` or `[` character
- 5-second cache in gateway.js prevents hammering during rapid polls
- Frontend polls `/api/gateway/all` (aggregated) every 15s, falls back to individual endpoints

---

## File Map

```
zo-house-3d/
├── index.html              # Entry point
├── vite.config.js          # Vite config (port 3002 dev, dist output)
├── package.json            # React 19, Three.js 0.182, R3F 9.5, Zustand 5
├── src/
│   ├── main.jsx            # React root mount
│   ├── App.jsx             # Root component — Scene + UI overlays + polling init
│   ├── index.css           # Global styles + glassmorphism theme
│   ├── App.css             # (mostly empty / overrides)
│   ├── services/
│   │   └── gateway.js      # HTTP polling service → zo-api → openclaw gateway
│   ├── store/
│   │   └── agentStore.js   # Zustand store — agents, cronJobs, gatewayStatus, UI state
│   ├── scene/
│   │   ├── Scene.jsx       # R3F Canvas + camera + background
│   │   ├── Floor.jsx       # Ground plane
│   │   ├── Lighting.jsx    # Ambient + directional + point lights
│   │   ├── Zones.jsx       # 7 department zone positions
│   │   ├── ZonePlatform.jsx # Rectangular platform per agent (border, label, status glow)
│   │   ├── AgentCharacters.jsx # Loads all 7 .glb models
│   │   ├── AgentCharacter.jsx  # Individual character (model + animation + click)
│   │   ├── CameraController.jsx # Presets (overview/topdown/cinematic) + agent focus
│   │   ├── ChatBubble.jsx  # Speech bubble above active agents
│   │   ├── ChatBubbles.jsx # Manages all chat bubbles
│   │   └── Effects.jsx     # Particles, connection lines, glows
│   └── ui/
│       ├── StatusBar.jsx    # Top bar — logo, connection dot, agent dots, clock, sessions
│       ├── MessageFeed.jsx  # Left panel — live event feed
│       ├── AgentPanel.jsx   # Right panel — agent detail (status, stats, skills, cron)
│       ├── AgentGrid.jsx    # Grid view of all agents
│       ├── CameraControls.jsx # Bottom-left camera preset buttons
│       ├── MetricsDashboard.jsx # Bottom-right metrics card
│       └── SkillsGraph.jsx  # Radial skills graph (used in AgentPanel Skills tab)
└── dist/                    # Built output (served by `serve -s`)
    ├── index.html
    ├── assets/
    │   ├── index-DiKlM5an.js   # Current build
    │   └── index-Bj1RpYlv.css
    └── models/characters/
        ├── zomadprime.glb
        ├── blrxzo-jr.glb
        ├── wtfxzo-jr.glb
        ├── suki.glb
        ├── loki.glb
        ├── wanda.glb
        └── yana.glb
```

---

## Agent Status (as of 2026-02-11 ~10:00 UTC)

| Agent | Sessions | Tokens Used | Context % | Last Active | Status |
|-------|----------|-------------|-----------|-------------|--------|
| ZomadPrime | 4 | 83K | 42% | ~1 min ago | active |
| Suki | 1 | 34K | 17% | ~13 min ago | idle |
| BLRxZo JR | 2 | 88K | 44% | ~35 min ago | online |
| WTFxZo JR | 2 | 157K | **78%** | ~3 hrs ago | dormant |
| Loki | 0 | 0 | 0% | never | offline |
| Wanda | 0 | 0 | 0% | never | offline |
| Yana | 0 | 0 | 0% | never | offline |

**Warning:** WTFxZo JR at 78% context — will need session reset soon.

---

## Cron Schedule (optimized)

| Time (UTC) | Time (IST) | Job | Agent | Freq |
|------------|------------|-----|-------|------|
| :03/:18/:33/:48 | — | Typeform sync | main | 15m |
| :08/:38 | — | Luma event sync | main | 30m |
| :13 | — | Kanban sync | main | 2h |
| :23 | — | Blocker escalation | main | 6h |
| 02:30 | 08:00 | Daily recap | BLRxZo JR | daily |
| 02:40 | 08:10 | Daily recap | WTFxZo JR | daily |
| 04:30 | 10:00 | Task audit | BLRxZo JR | daily |
| 04:40 | 10:10 | Task audit | WTFxZo JR | daily |
| 04:50 | 10:20 | Task audit | Suki | daily |
| 05:00 | 10:30 | Task audit | ZomadPrime | daily |
| 10:00 | 15:30 | Morning briefing | ZomadPrime | daily |
| 05:15 Mon | 10:45 Mon | Weekly scorecard | ZomadPrime | weekly |

All serialized via single flock. Max 1 cron process (350 MB) at any time.

---

## Final Resource State (after optimization)

```
Memory:  1.0 GB used / 7.6 GB total (6.2 GB available)
Processes:
  492 MB  openclaw-gateway (always on)
   77 MB  serve (3D frontend — was 182 MB with npm wrapper)
   69 MB  node server.js (zo-api)
   92 MB  tailscaled
   56 MB  openclaw (launcher)
```

### What was cut
| Before | After | Savings |
|--------|-------|---------|
| Typeform every 5m (96 runs/day) | Every 30m (48 runs/day) | 50% fewer process spawns |
| Luma every 30m (48 runs/day) | Every 2h (12 runs/day) | 75% fewer |
| Kanban every 2h (12 runs/day) | Every 4h (6 runs/day) | 50% fewer |
| Blocker every 6h (4 runs/day) | Removed (audits cover this) | 100% fewer |
| 7 internal-only sync jobs | Disabled permanently | 100% fewer |
| Internal scheduler double-firing | Intervals set to 24h | No double execution |
| `npm exec serve` wrapper (75 MB) | Direct `/usr/bin/serve` | 75 MB saved |
| Max 3 concurrent cron processes | Max 1 (flock) | 700 MB peak saved |

**Before:** ~170 cron processes/day, up to 1.45 GB spikes, double execution
**After:** ~80 cron processes/day, max 350 MB spike, zero doubles, 1.0 GB steady state
