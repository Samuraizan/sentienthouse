import useAgentStore from "../store/agentStore.js";

/**
 * Gateway Polling Service
 *
 * Polls the zo-api proxy (Express on port 3001) which shells out to
 * `openclaw gateway call <method>` and returns JSON.
 *
 * Actual data shapes (discovered from live gateway):
 *
 * status -> { heartbeat: { agents: [...] }, sessions: { byAgent: [...], recent: [...] }, channelSummary }
 * agents.list -> { defaultId, agents: [{ id, name? }] }
 * sessions.list -> { sessionsByAgent: [...] } or similar
 * cron.list -> { jobs: [{ id, agentId, name, schedule, state: { nextRunAtMs, lastRunAtMs, lastStatus } }] }
 * system-presence -> presence data
 */

const API_BASE = import.meta.env.VITE_API_BASE || "";
const POLL_INTERVAL = 15_000; // 15 seconds

let pollTimer = null;
let isPolling = false;

// ── Static agent metadata for skills, channels, model ──────────────
// These are known from the deployed workspace configurations and are used
// as fallback when the gateway does not return this data natively.
const AGENT_SKILLS = {
  zomadprime:  ["delegate-task", "morning-briefing", "weekly-scorecard"],
  "blrxzo-jr": ["morning-audit", "guest-flow", "financial-entry", "staff-report", "maintenance-triage", "daily-recap"],
  "wtfxzo-jr": ["morning-audit", "guest-flow", "financial-entry", "staff-report", "maintenance-triage", "daily-recap"],
  suki:        ["invoice-maker", "event-inquiry", "luma-sync", "event-marketing", "event-recap", "rev-tracking"],
  loki:        ["guest-welcome", "daily-vibe", "city-event", "community-pulse"],
  wanda:       ["lead-qualify", "outreach-sequence", "pipeline-update", "founder-marketing"],
  yana:        ["partner-research", "founder-outreach", "deal-pipeline"],
};

const AGENT_CHANNELS = {
  zomadprime:  [{ type: "telegram", name: "Samurai", id: "1275114944" }],
  "blrxzo-jr": [{ type: "telegram", name: "Darshan", id: "1081875702" }],
  "wtfxzo-jr": [{ type: "telegram", name: "Akhilesh", id: "558199761" }],
  suki:        [{ type: "telegram", name: "Boldrin", id: "817242399" }],
  loki:        [{ type: "telegram", name: "Pooja", id: "TBD" }],
  wanda:       [{ type: "telegram", name: "Boldrin (mention)", id: "817242399" }],
  yana:        [{ type: "telegram", name: "Boldrin (mention)", id: "817242399" }],
};

const DEFAULT_MODEL = "claude-haiku-4-5";

/**
 * Safe JSON fetch with timeout and error handling.
 */
async function fetchJSON(endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Use the aggregated /all endpoint for efficiency (single request).
 * Falls back to individual endpoints if /all fails.
 */
async function pollAll() {
  try {
    const data = await fetchJSON("/api/gateway/all");
    processGatewayData(data);
  } catch (err) {
    console.warn("[gateway] Aggregated poll failed, trying individual:", err.message);
    await pollIndividual();
  }
}

/**
 * Fallback: poll each endpoint individually.
 */
async function pollIndividual() {
  const results = await Promise.allSettled([
    fetchJSON("/api/gateway/status"),
    fetchJSON("/api/gateway/agents"),
    fetchJSON("/api/gateway/cron"),
    fetchJSON("/api/gateway/presence"),
  ]);

  const data = {
    status: results[0].status === "fulfilled" ? results[0].value : null,
    agents: results[1].status === "fulfilled" ? results[1].value : null,
    cron: results[2].status === "fulfilled" ? results[2].value : null,
    presence: results[3].status === "fulfilled" ? results[3].value : null,
  };

  processGatewayData(data);
}

/**
 * Determine the currentTask for an agent based on recently-running cron jobs.
 * If a cron job for this agent ran in the last 2 minutes, consider it the current task.
 */
function findCurrentTask(agentId, cronJobs) {
  if (!cronJobs || cronJobs.length === 0) return null;

  const now = Date.now();
  const TWO_MINUTES = 2 * 60 * 1000;

  // Check cron jobs that belong to this agent and ran recently
  for (const job of cronJobs) {
    const jobAgentId = job.agentId === "main" ? "zomadprime" : job.agentId;
    if (jobAgentId !== agentId) continue;
    if (!job.enabled) continue;

    // If the job has a lastRunAtMs and it ran within the last 2 minutes
    // plus its duration, it might still be running
    const lastRun = job.state?.lastRunAtMs;
    const duration = job.state?.lastDurationMs || 60000;
    if (lastRun) {
      const endedAt = lastRun + duration;
      // If job started within 2 min or is still running
      if (now - lastRun < TWO_MINUTES || endedAt > now) {
        return job.name;
      }
    }

    // If nextRunAtMs is very close (within 30s past), it might be starting now
    const nextRun = job.state?.nextRunAtMs;
    if (nextRun && now >= nextRun && now - nextRun < TWO_MINUTES) {
      return job.name;
    }
  }

  return null;
}

/**
 * Process the combined gateway data and update the Zustand store.
 */
function processGatewayData(data) {
  const store = useAgentStore.getState();

  // ── Gateway status ───────────────────────────────────────────
  if (data.status) {
    const s = data.status;
    store.updateGatewayStatus({
      connected: true,
      uptime: s.heartbeat?.defaultAgentId ? "running" : null,
      version: s.version || null,
      agentCount: s.heartbeat?.agents?.length || s.sessions?.count || 7,
      error: null,
    });
  } else {
    store.updateGatewayStatus({
      connected: false,
      error: "Status endpoint unavailable",
    });
  }

  // ── Build cron job reference for currentTask lookup ──────────
  const rawCronJobs = data.cron?.jobs || [];

  // ── Agents ───────────────────────────────────────────────────
  // Merge data from agents.list + status.sessions.byAgent
  const agentsList = data.agents?.agents || [];
  const sessionsByAgent = data.status?.sessions?.byAgent || [];
  const recentSessions = data.status?.sessions?.recent || [];
  const heartbeatAgents = data.status?.heartbeat?.agents || [];

  // Build a session map from byAgent data
  const sessionMap = {};
  sessionsByAgent.forEach((entry) => {
    sessionMap[entry.agentId] = entry;
  });

  // Build heartbeat map
  const heartbeatMap = {};
  heartbeatAgents.forEach((h) => {
    heartbeatMap[h.agentId] = h;
  });

  // Map agent id from gateway to our store id
  // The gateway uses "main" for zomadprime
  const idMap = { main: "zomadprime" };
  const reverseIdMap = { zomadprime: "main" };

  const mapped = agentsList.map((agent) => {
    const gwId = agent.id;
    const storeId = idMap[gwId] || gwId;
    const sess = sessionMap[gwId];
    const hb = heartbeatMap[gwId];

    // Calculate token totals from sessions
    let totalInput = 0;
    let totalOutput = 0;
    let totalTokens = 0;
    const sessions = sess?.recent || [];

    sessions.forEach((s) => {
      totalInput += s.inputTokens || 0;
      totalOutput += s.outputTokens || 0;
      totalTokens += s.totalTokens || 0;
    });

    // Determine last active timestamp
    let lastActive = null;
    if (sessions.length > 0) {
      const mostRecent = sessions.reduce((latest, s) => {
        const ts = s.updatedAt;
        return ts && ts > (latest || 0) ? ts : latest;
      }, 0);
      if (mostRecent) {
        lastActive = new Date(mostRecent).toISOString();
      }
    }

    // Determine status based on session recency
    let status = "offline";
    const now = Date.now();
    if (sessions.length > 0) {
      const newestMs = sessions.reduce((max, s) => Math.max(max, s.updatedAt || 0), 0);
      const ageMs = now - newestMs;

      if (ageMs < 2 * 60 * 1000) {
        status = "active";      // Active in last 2 minutes
      } else if (ageMs < 10 * 60 * 1000) {
        status = "idle";        // Active in last 10 minutes
      } else if (ageMs < 60 * 60 * 1000) {
        status = "online";      // Active in last hour
      } else {
        status = "dormant";     // Has sessions but old
      }
    }

    // Check if heartbeat is enabled — if so and no sessions, it is standby
    if (hb?.enabled) {
      status = status === "offline" ? "standby" : status;
    }

    // Determine currentTask from actively running cron jobs
    const currentTask = findCurrentTask(storeId, rawCronJobs);

    // If the agent has a running cron task, ensure status is at least "active"
    if (currentTask && (status === "offline" || status === "standby" || status === "dormant")) {
      status = "active";
    }

    return {
      id: storeId,
      status,
      lastActive,
      tokenUsage: {
        input: totalInput,
        output: totalOutput,
        total: totalTokens,
      },
      sessionCount: sess?.count || 0,
      currentTask,
      skills: agent.skills || AGENT_SKILLS[storeId] || [],
      channels: agent.channels || AGENT_CHANNELS[storeId] || [],
      model: sessions[0]?.model || DEFAULT_MODEL,
    };
  });

  if (mapped.length > 0) {
    store.updateAgents(mapped);
  }

  // ── Cron jobs ────────────────────────────────────────────────
  if (data.cron) {
    const jobs = data.cron.jobs || [];
    const cronMapped = jobs.map((j) => {
      const agentId = idMap[j.agentId] || j.agentId;
      return {
        id: j.id,
        name: j.name,
        agent: agentId,
        lastRun: j.state?.lastRunAtMs
          ? new Date(j.state.lastRunAtMs).toISOString()
          : null,
        lastStatus: j.state?.lastStatus || "pending",
        nextRun: j.state?.nextRunAtMs
          ? new Date(j.state.nextRunAtMs).toISOString()
          : null,
        schedule: j.schedule?.expr || `every ${Math.round((j.schedule?.everyMs || 0) / 60000)}m`,
        enabled: j.enabled,
        lastDurationMs: j.state?.lastDurationMs || null,
      };
    });
    store.updateCronJobs(cronMapped);
  }

  // ── Presence ─────────────────────────────────────────────────
  if (data.presence) {
    const presenceMap = {};
    if (Array.isArray(data.presence)) {
      data.presence.forEach((p) => {
        const id = idMap[p.agentId || p.id] || p.agentId || p.id;
        presenceMap[id] = p;
      });
    } else if (typeof data.presence === "object") {
      Object.entries(data.presence).forEach(([key, val]) => {
        const id = idMap[key] || key;
        presenceMap[id] = val;
      });
    }
    store.updatePresence(presenceMap);
  }
}

/**
 * Start the polling loop. Safe to call multiple times.
 */
export function startPolling(intervalMs = POLL_INTERVAL) {
  if (isPolling) return;
  isPolling = true;

  console.log(`[gateway] Starting poll loop (every ${intervalMs / 1000}s)`);

  // Immediate first poll
  pollAll();

  pollTimer = setInterval(() => {
    pollAll();
  }, intervalMs);
}

/**
 * Stop the polling loop.
 */
export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  isPolling = false;
  console.log("[gateway] Polling stopped");
}

/**
 * Trigger a single manual poll (for refresh buttons).
 */
export async function pollOnce() {
  await pollAll();
}

/**
 * Check if polling is currently active.
 */
export function isPollingActive() {
  return isPolling;
}
