import { create } from "zustand";

/**
 * Agent Store — Zustand state for the Zo House 3D Command Center
 *
 * Holds live data polled from the OpenClaw gateway via the zo-api proxy.
 * Three primary slices: agents, cronJobs, gatewayStatus.
 */

// Default agent metadata (display names, roles, colors for 3D rendering)
const AGENT_META = {
  zomadprime: { name: "ZomadPrime", role: "director", homeZone: "hq", color: "#FFD700", human: "Samurai" },
  "blrxzo-jr": { name: "BLRxZo JR", role: "captain-blrxzo", homeZone: "blrxzo-house", color: "#00BFFF", human: "Darshan" },
  "wtfxzo-jr": { name: "WTFxZo JR", role: "captain-wtfxzo", homeZone: "wtfxzo-house", color: "#FF6347", human: "Akhilesh" },
  suki: { name: "Suki", role: "events", homeZone: "hq", color: "#FF69B4", human: "Boldrin" },
  loki: { name: "LOKI", role: "vibe-curator", homeZone: "nomad", color: "#9B59B6", human: "Pooja" },
  wanda: { name: "Wanda", role: "sales", homeZone: "hq", color: "#2ECC71", human: "Boldrin" },
  yana: { name: "Yana", role: "bd", homeZone: "hq", color: "#E67E22", human: "Boldrin" },
};

const useAgentStore = create((set, get) => ({
  // ── Agent state ──────────────────────────────────────────────
  agents: Object.entries(AGENT_META).map(([id, meta]) => ({
    id,
    name: meta.name,
    role: meta.role,
    homeZone: meta.homeZone,
    color: meta.color,
    human: meta.human,
    status: "offline",       // active | idle | online | dormant | standby | offline
    lastActive: null,        // ISO timestamp
    tokenUsage: { input: 0, output: 0, total: 0 },
    sessionCount: 0,
    currentTask: null,       // string description or null
    skills: [],              // skill names array
    channels: [],            // telegram channel bindings
    model: null,             // model string from gateway
  })),

  // ── Cron jobs ────────────────────────────────────────────────
  cronJobs: [],
  // Each: { id, name, agent, lastRun, lastStatus, nextRun, schedule }

  // ── Gateway status ───────────────────────────────────────────
  gatewayStatus: {
    connected: false,
    uptime: null,
    version: null,
    agentCount: 0,
    lastPoll: null,
    error: null,
  },

  // ── Presence map ─────────────────────────────────────────────
  presence: {},
  // keyed by agent id, value = presence info from gateway

  // ── Agent visits/meetings ───────────────────────────────────
  // Tracks when agents visit each other for collaboration
  agentVisits: {},
  // keyed by agent id, value = { visiting: targetAgentId, meetingWith: agentId, returnTime: timestamp }

  // ── UI state ─────────────────────────────────────────────────
  selectedAgentId: null,
  showAgentGrid: false,
  activeTab: "general",     // general | skills | cron | logs

  // ── Skill tree modal state ───────────────────────────────────
  skillTreeAgentId: null,   // null = closed, agent id = open for that agent

  // ── Camera state ─────────────────────────────────────────────
  cameraPreset: "overview", // overview | topdown | cinematic

  // ── Actions ──────────────────────────────────────────────────

  setSelectedAgent: (id) => set({ selectedAgentId: id, activeTab: "general" }),

  clearSelectedAgent: () => set({ selectedAgentId: null, activeTab: "general" }),

  toggleAgentGrid: () => set((state) => ({ showAgentGrid: !state.showAgentGrid })),

  openAgentGrid: () => set({ showAgentGrid: true }),

  closeAgentGrid: () => set({ showAgentGrid: false }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  // Skill tree modal actions
  openSkillTree: (agentId) => set({ skillTreeAgentId: agentId }),
  closeSkillTree: () => set({ skillTreeAgentId: null }),

  // Agent visit/meeting actions
  startVisit: (agentId, targetAgentId) =>
    set((state) => ({
      agentVisits: {
        ...state.agentVisits,
        [agentId]: { visiting: targetAgentId, meetingWith: null, startTime: Date.now() },
      },
    })),

  startMeeting: (agentId, withAgentId) =>
    set((state) => ({
      agentVisits: {
        ...state.agentVisits,
        [agentId]: { ...state.agentVisits[agentId], meetingWith: withAgentId },
      },
    })),

  endVisit: (agentId) =>
    set((state) => {
      const newVisits = { ...state.agentVisits };
      delete newVisits[agentId];
      return { agentVisits: newVisits };
    }),

  getAgentVisit: (agentId) => get().agentVisits[agentId] || null,

  /**
   * Set the active camera preset.
   * Valid values: "overview", "topdown", "cinematic"
   */
  setCameraPreset: (preset) => set({ cameraPreset: preset }),

  /**
   * Merge fresh agent data from the gateway into the store.
   * Preserves existing meta (color, human) while updating live fields.
   */
  updateAgents: (gatewayAgents) =>
    set((state) => {
      const updated = state.agents.map((existing) => {
        const fresh = gatewayAgents.find((a) => a.id === existing.id);
        if (!fresh) return { ...existing, status: "offline" };

        return {
          ...existing,
          status: fresh.status || "online",
          lastActive: fresh.lastActive || existing.lastActive,
          tokenUsage: fresh.tokenUsage || existing.tokenUsage,
          sessionCount: fresh.sessionCount ?? existing.sessionCount,
          currentTask: fresh.currentTask || null,
          skills: fresh.skills || existing.skills,
          channels: fresh.channels || existing.channels,
          model: fresh.model || existing.model,
        };
      });
      return { agents: updated };
    }),

  /**
   * Replace the entire cronJobs array with fresh data.
   */
  updateCronJobs: (jobs) =>
    set({
      cronJobs: jobs.map((j) => ({
        id: j.id || j.name,
        name: j.name,
        agent: j.agent || j.agentId,
        lastRun: j.lastRun || null,
        lastStatus: j.lastStatus || "unknown",
        nextRun: j.nextRun || null,
        schedule: j.schedule || j.cron,
        enabled: j.enabled !== undefined ? j.enabled : true,
        lastDurationMs: j.lastDurationMs || null,
      })),
    }),

  /**
   * Update gateway connection status.
   */
  updateGatewayStatus: (data) =>
    set((state) => ({
      gatewayStatus: {
        ...state.gatewayStatus,
        ...data,
        lastPoll: new Date().toISOString(),
      },
    })),

  /**
   * Update agent presence map.
   */
  updatePresence: (presenceData) => set({ presence: presenceData }),

  /**
   * Get the currently selected agent object.
   */
  getSelectedAgent: () => {
    const state = get();
    if (!state.selectedAgentId) return null;
    return state.agents.find((a) => a.id === state.selectedAgentId) || null;
  },

  /**
   * Get agents filtered by status.
   */
  getAgentsByStatus: (status) => {
    return get().agents.filter((a) => a.status === status);
  },

  /**
   * Get upcoming cron jobs (next 60 minutes).
   */
  getUpcomingCronJobs: () => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return get().cronJobs.filter((j) => {
      if (!j.nextRun) return false;
      const next = new Date(j.nextRun).getTime();
      return next > now && next < now + oneHour;
    });
  },
}));

export default useAgentStore;
export { AGENT_META };
