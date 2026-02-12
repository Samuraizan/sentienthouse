# Zo House 3D — Current State vs Next Steps

A detailed snapshot of what exists today and what to build next: **bigger agent spaces**, **per-agent personalization**, and **full agent management on click** (like the reference Skills/Workspace/Advanced panel with central avatar and Save).

---

## Part 1: What We Have Currently

### 1.1 Architecture

| Layer | Tech | Purpose |
|-------|------|---------|
| **Frontend** | Vite + React 19 + Three.js (R3F) | 3D scene + HTML overlays |
| **Serving** | `serve -s dist -l 3000` | Static build |
| **API** | Express (zo-api, port 3001) | REST proxy to OpenClaw gateway |
| **Gateway** | OpenClaw (port 18789) | Agent sessions, cron, presence |
| **Access** | Tailscale Funnel (HTTPS) | `/` → 3000, `/api` → 3001 |

- Frontend uses **relative paths** for API (`/api/gateway/all`) so Funnel can route without exposing ports.
- **Polling only:** 15s HTTP poll to zo-api; no WebSocket. Connection status comes from poll success/failure.

### 1.2 3D Scene (Current)

- **Canvas:** Full viewport, dark background `#1a1820`, subtle fog (80–180), ACES tone mapping.
- **Camera:** Start `[30, 25, 30]`, FOV 45. Presets: overview, topdown, cinematic; click agent to focus.
- **Floor:** Single ground plane (no per-zone floors).
- **Zones:** One rectangular platform per agent, driven by `ZONE_POSITIONS` in `Zones.jsx`:

| Role | Position (x, z) | Size (w×d) | Label |
|------|-----------------|------------|--------|
| director | (0, 0) | 8×8 | HQ |
| captain-blrxzo | (-14, -4) | 6×6 | BLRxZo |
| captain-wtfxzo | (14, -4) | 6×6 | WTFxZo (Whitefield) |
| events | (-8, 10) | 6×6 | Events |
| sales | (8, 10) | 6×6 | Sales |
| bd | (-10, -14) | 5×5 | Business Dev |
| vibe-curator | (10, -14) | 5×5 | Vibe |

- **Zone look:** Same for everyone: rectangular plate, thin orange outline, corner accents, floating label (Html billboard). Status affects glow/pulse only. **No per-agent theme, props, or “room” identity.**
- **Agents:** 7 GLB characters in `dist/models/characters/` (zomadprime, blrxzo-jr, wtfxzo-jr, suki, loki, wanda, yana). Each stands on their zone; click selects agent.
- **Effects:** Particles, connection lines, chat bubbles above active agents.

**Limitations today:**

- Zone sizes are modest (5×5 to 8×8); layout feels tight for “personal space.”
- Every zone uses the same visual language (rectangle, same border, same label style).
- No agent-specific decorations, furniture, or “room” identity (e.g. Suki’s zone doesn’t look like an events desk, Loki’s like a vibe lounge).

### 1.3 UI Overlays (Current)

| Component | Position | Role |
|-----------|----------|------|
| **StatusBar** | Top | Logo, connection dot, agent dots (ZOM/BLR/WTF/SUK/LOK/WAN/YAN), uptime, clock, sessions |
| **MessageFeed** | Left | “LIVE FEED” — system messages (e.g. “Command Center initialized”) |
| **MetricsDashboard** | Bottom-right | Small metrics card |
| **CameraControls** | Bottom-left | Camera presets (1–3) |
| **AgentPanel** | Right (slides in on agent click) | **Main management surface** (see below) |
| **Bottom bar** | Bottom | Scroll/zoom, drag/rotate, pan, presets, ESC |

### 1.4 Agent Panel — Current (Click on Agent)

- **Trigger:** Click an agent or their zone → panel slides in from the right.
- **Tabs:** General | Skills | Cron | Logs (four tabs only).

**Tab contents:**

1. **General**
   - Avatar (colored circle + initial), name, role, status badge (Active/Idle/Offline etc.).
   - CURRENT ACTIVITY (current task or “Idle — no active task”).
   - STATS: Sessions, Tokens, Last Active, Model.
   - HUMAN OPERATOR (e.g. Boldrin, Darshan).
   - Channels (e.g. Telegram).

2. **Skills**
   - List of skill names for that agent (from gateway or fallback).
   - Each row: skill name + “Run” button (POST to `/api/manage/agents/:id/skill/:skillName`).
   - **SkillsGraph** (radial): agent initial in center, skill nodes in a circle, lines from center to nodes; click node to expand description + “Run.” No “Add/Remove” or “Save” yet.

3. **Cron**
   - List of cron jobs for the agent (next run, last run, status).
   - “Force Run” per job (POST to manage API).

4. **Logs**
   - Scrollable monospace log area; 10s refresh from `/api/manage/agents/:id/logs`.

**What’s missing vs reference image:**

- No **Workspace** tab (files, context, or workspace-specific controls).
- No **Advanced** tab (settings, model, limits, etc.).
- No **Save** button to persist changes (e.g. skill set, preferences).
- Skills view is radial graph + list but no “manage” (add from skills.sh, remove, reorder).
- Panel is functional but not yet the full “agent management hub” with all sections and persistence.

### 1.5 Data Flow

- **agentStore (Zustand):** `agents`, `cronJobs`, `gatewayStatus`, `presence`, `selectedAgentId`, `activeTab`, `cameraPreset`.
- **Gateway polling:** `gateway.js` calls `/api/gateway/all` (or individual endpoints), merges into store (`updateAgents`, `updateCronJobs`, `updateGatewayStatus`, `updatePresence`). Skills per agent come from gateway response or static `AGENT_SKILLS` fallback.
- **Agent panel:** Reads `getSelectedAgent()`, shows General/Skills/Cron/Logs; Skills tab uses `agent.skills` and SkillsGraph.

### 1.6 File Map (Relevant to This Doc)

```
zo-house-3d/src/
├── App.jsx                 # Scene + overlays, polling init
├── scene/
│   ├── Scene.jsx           # Canvas, fog, lighting, Floor, Zones, AgentCharacters, Effects, ChatBubbles
│   ├── Zones.jsx           # ZONE_POSITIONS, zone list, click → setSelectedAgent
│   ├── ZonePlatform.jsx    # Single zone: rect plate, border, label, status glow
│   ├── AgentCharacters.jsx # Load 7 GLBs, place per zone
│   └── AgentCharacter.jsx  # One character, click handler
├── ui/
│   ├── AgentPanel.jsx      # Slide-in panel, tabs General/Skills/Cron/Logs, TabSkills uses SkillsGraph
│   └── SkillsGraph.jsx     # Radial skill graph (center avatar, nodes, Run)
├── store/agentStore.js     # Agents, skills[], selectedAgentId, activeTab
└── services/gateway.js     # Poll /api/gateway/*, AGENT_SKILLS fallback
```

---

## Part 2: Next Steps to Build

### 2.1 Bigger Space for Agents

**Whitefieldl:** Each agent has more room so the world feels less cramped and zones can hold personalization.

**Concrete steps:**

1. **Increase zone sizes in `ZONE_POSITIONS` (Zones.jsx)**
   - Today: HQ 8×8, captains/events/sales 6×6, bd/vibe 5×5.
   - Proposal: e.g. HQ 12×12, department zones 8×8 or 9×9, so each platform is clearly a “room” not a tile.

2. **Spread positions out**
   - Multiply or offset position values so platforms don’t feel clustered (e.g. push captains, events, sales, bd, vibe further from center).
   - Adjust camera default and far clip so the larger spread still fits; may need to tweak `Scene.jsx` camera and fog `far`.

3. **Optional: scale floor or add “corridors”**
   - If the ground plane feels small, extend it or add subtle paths between zones so the bigger layout reads as one world.

**Files to touch:** `src/scene/Zones.jsx` (ZONE_POSITIONS), possibly `Scene.jsx` (camera/fog), `CameraController.jsx` (focus distances).

---

### 2.2 Personalization — Each Agent’s Space Looks Unique

**Whitefieldl:** When you look at a zone, you can tell whose it is (e.g. Events desk, Vibe lounge, BD war room) without reading the label.

**Concrete steps:**

1. **Per-zone theme in data**
   - Extend zone config (e.g. in `Zones.jsx` or `agentStore`) with optional fields per role: `theme`, `accentColor`, `decor`, `labelStyle`, or a `zoneThemeId` that points to a theme object.
   - Themes can define: border color, fill tint, label position, and (later) which decor set to use.

2. **ZonePlatform accepts theme/decor**
   - `ZonePlatform.jsx`: In addition to `color`, accept e.g. `theme`, `decor`, or `variant`. Use them to:
     - Vary border color or width (e.g. Events = pink, BD = orange).
     - Optionally switch to a different geometry (e.g. hex for one, rect for another) or add a second plane “layer” (e.g. a small podium or rug area).

3. **Optional 3D decor per role**
   - Add a small set of simple props (Three.js primitives or very low-poly GLBs): desk, plant, screen, couch, etc.
   - In `Zones.jsx` or a new `ZoneDecor.jsx`, map each role to a decor set and place props on or beside the platform (offset from zone position so they sit inside the “room”).
   - Keep it minimal at first (e.g. one prop per zone) so the space looks unique without blowing the triangle budget.

4. **Labels and typography**
   - Allow per-zone label style (e.g. “Events” in a different font or with a small icon). Could be driven by the same theme object.

**Files to touch:** `Zones.jsx` (attach theme/decor to each zone), `ZonePlatform.jsx` (theme/variant/decor rendering), optionally new `ZoneDecor.jsx` or `scene/Decor.jsx`, and CSS if labels are styled from theme.

---

### 2.3 Agent Management on Click — Like the Reference Image

**Whitefieldl:** Clicking an agent opens a full **agent management** experience: General, Skills (with central avatar and radial skill graph), **Workspace**, **Advanced**, and **Save**, matching the reference.

**Concrete steps:**

1. **Add two new tabs to AgentPanel**
   - **Workspace:** Content TBD: e.g. “Workspace root” path, quick links to agent workspace files, or a list of “context files” the agent is using. Could later integrate with OpenClaw workspace API or a zo-api endpoint that lists workspace files.
   - **Advanced:** Placeholder for: model selector, token/context limits, rate limits, or other settings. Can start with “Coming soon” or a simple read-only display of model/limits from gateway.

2. **Skills tab as the “management” view**
   - Keep the **central avatar** (already in SkillsGraph) and **radial skill graph**.
   - Add **management actions:**
     - “Add skill” (from local list or by skills.sh owner/repo); calls Zo API to add skill to agent.
     - “Remove” per skill; calls Zo API to remove.
   - Show **source** per skill (e.g. “Local” vs “skills.sh • owner/repo”) in the list or on the graph node.
   - Optional: “Open on skills.sh” link for skills.sh skills.

3. **Save button**
   - Add a **Save** button (e.g. in the panel header or as a sticky footer inside the panel). On click:
     - If the frontend holds dirty state (e.g. edited skill set, toggled cron, advanced settings), POST to Zo API to persist (e.g. `PATCH /api/manage/agents/:id` with skills, preferences, or settings).
     - Then clear dirty state and optionally show a short “Saved” feedback.
   - Backend (zo-api) needs corresponding endpoints to persist agent config/skills if not already present.

4. **Panel layout and polish**
   - Ensure the Skills tab is the “hero” view when you think “agent skills”: big radial graph, avatar in center, skills around it (already there), plus the new add/remove and Save.
   - Optional: Tab order **General → Skills → Workspace → Advanced** to match the reference; keep Logs or move it under Advanced.

5. **Backend (Zo API) for skills and save**
   - `GET /api/manage/agents/:id/skills` — list with source (local / skills.sh).
   - `POST /api/manage/agents/:id/skills` — add (body: local skill name or skills.sh owner/repo).
   - `DELETE /api/manage/agents/:id/skills/:skillId` — remove.
   - `PATCH /api/manage/agents/:id` or `PUT` — persist preferences/settings when Save is clicked (if applicable).

**Files to touch:** `ui/AgentPanel.jsx` (new tabs, Save button, optional dirty state), `ui/SkillsGraph.jsx` (add/remove UI, source label, link to skills.sh), zo-api routes (skills CRUD + save).

---

## Part 3: Summary Table

| Area | Current | Next steps |
|------|--------|------------|
| **Space** | Fixed zone sizes (5×5–8×8), compact layout | Bigger zones (e.g. 8×8–12×12), spread positions, optional floor/paths |
| **Personalization** | Same look for every zone (rect, orange border, label) | Per-zone theme (color, variant), optional decor props, distinct “room” identity |
| **Agent panel** | General, Skills, Cron, Logs; no Workspace/Advanced, no Save | Add Workspace + Advanced tabs; Skills add/remove + source; Save button; backend skills CRUD + save |
| **Skills** | List + radial graph, Run only; fallback/gateway data | Manage: add (local/skills.sh), remove, show source; persist via Zo API |

---

## Part 4: Suggested Order of Work

1. **Backend first (if not done):** Zo API endpoints for agent skills (list/add/remove) and optional PATCH for Save. So the panel has something to call.
2. **Panel and Skills management:** Add Workspace and Advanced tabs, add/remove skill in Skills tab, Save button. No need to wait for bigger space or decor.
3. **Bigger space:** Bump zone sizes and spread in `Zones.jsx`; tune camera/fog. Quick win for “room” feel.
4. **Personalization:** Per-zone theme in data and ZonePlatform; then optional decor. Can ship theme first, decor in a follow-up.

This keeps “agent management on click” (the panel + Skills + Save) aligned with the reference image, while making the 3D world bigger and each agent’s space visually unique.
