import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import useAgentStore from "../store/agentStore.js";
import SkillsGraph from "./SkillsGraph.jsx";

/**
 * AgentPanel.jsx — Interactive tabbed command panel for a selected agent (Task #20)
 *
 * Slides in from the RIGHT when an agent is selected.
 * Four tabs: General, Skills, Cron, Logs.
 *
 * - General: avatar, name, role, status, current activity, stats, human operator
 * - Skills: radial SkillsGraph + list with "Run" buttons that POST to the manage API
 * - Cron: job list with "Force Run" buttons
 * - Logs: scrollable monospace log feed with 10s auto-refresh
 */

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3001`;

// ── Helpers ────────────────────────────────────────────────────────

function formatTokens(n) {
  if (n == null || n === 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function relativeTime(isoString) {
  if (!isoString) return "Never";
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 0) return "Just now";
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return seconds + "s ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  return days + "d ago";
}

function relativeTimeFuture(isoString) {
  if (!isoString) return "--";
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff < 0) return "overdue";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return "in " + minutes + "m";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return "in " + hours + "h";
  const days = Math.floor(hours / 24);
  return "in " + days + "d";
}

const STATUS_COLORS = {
  active:  "#44ffaa",
  idle:    "#ffaa44",
  online:  "#8888ff",
  dormant: "#666688",
  standby: "#aa88ff",
  offline: "#ff4466",
};

const STATUS_LABELS = {
  active:  "Active",
  idle:    "Idle",
  online:  "Online",
  dormant: "Dormant",
  standby: "Standby",
  offline: "Offline",
};

const ROLE_LABELS = {
  director:         "Director",
  "captain-blrxzo": "Captain \u2014 BLRxZo",
  "captain-wtfxzo": "Captain \u2014 WTFxZo",
  events:           "Events Manager",
  "vibe-curator":   "Vibe Curator",
  sales:            "Sales Lead",
  bd:               "Business Development",
};

const SKILL_DESCRIPTIONS = {
  "delegate-task": "Delegate tasks to sub-agents with context",
  "morning-briefing": "Generate daily morning briefing for the team",
  "weekly-scorecard": "Compile weekly performance scorecard",
  "morning-audit": "Run morning property checklist and audit",
  "guest-flow": "Manage guest check-in/out flow",
  "financial-entry": "Log financial entries and receipts",
  "staff-report": "Generate staff attendance and task report",
  "maintenance-triage": "Triage and prioritize maintenance requests",
  "daily-recap": "End-of-day property summary and recap",
  "invoice-maker": "Generate invoices for events and services",
  "event-inquiry": "Handle incoming event inquiries",
  "luma-sync": "Sync events with Luma calendar",
  "event-marketing": "Create event marketing materials",
  "event-recap": "Generate post-event recap and metrics",
  "rev-tracking": "Track revenue and financial metrics",
  "guest-welcome": "Create personalized guest welcome messages",
  "daily-vibe": "Curate daily vibe and atmosphere report",
  "city-event": "Scout and share local city events",
  "community-pulse": "Gauge community mood and engagement",
  "lead-qualify": "Qualify incoming sales leads",
  "outreach-sequence": "Run automated outreach sequences",
  "pipeline-update": "Update sales pipeline and CRM",
  "founder-marketing": "Create founder-focused marketing content",
  "partner-research": "Research potential business partners",
  "founder-outreach": "Outreach to founders and entrepreneurs",
  "deal-pipeline": "Manage business development deal pipeline",
};

const TABS = [
  { id: "general", label: "General" },
  { id: "skills",  label: "Skills" },
  { id: "cron",    label: "Cron" },
  { id: "logs",    label: "Logs" },
];

// ── Sub-components ────────────────────────────────────────────────

function TabGeneral({ agent, cronJobs }) {
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline;
  const statusLabel = STATUS_LABELS[agent.status] || "Unknown";
  const roleLabel = ROLE_LABELS[agent.role] || agent.role;

  return (
    <div className="ap-tab-content">
      {/* Header with avatar */}
      <div className="ap-general__header">
        <div className="ap-general__avatar" style={{ backgroundColor: agent.color }}>
          {agent.name.charAt(0)}
        </div>
        <div className="ap-general__header-text">
          <h2 className="ap-general__name" style={{ color: agent.color }}>
            {agent.name}
          </h2>
          <span className="ap-general__role">{roleLabel}</span>
          <div className="ap-general__status-badge">
            <span
              className="ap-general__status-dot"
              style={{ backgroundColor: statusColor, boxShadow: "0 0 8px " + statusColor + "80" }}
            />
            <span className="ap-general__status-text" style={{ color: statusColor }}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Current Activity */}
      <div className="ap-section">
        <div className="ap-section__title">CURRENT ACTIVITY</div>
        <div className="ap-general__activity">
          <span
            className="ap-general__activity-dot"
            style={{ backgroundColor: agent.currentTask ? "#44ffaa" : "#666688" }}
          />
          <span className="ap-general__activity-text">
            {agent.currentTask || "Idle \u2014 no active task"}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="ap-section">
        <div className="ap-section__title">STATS</div>
        <div className="ap-general__stats-grid">
          <div className="ap-general__stat">
            <span className="ap-general__stat-value">{agent.sessionCount || 0}</span>
            <span className="ap-general__stat-label">Sessions</span>
          </div>
          <div className="ap-general__stat">
            <span className="ap-general__stat-value ap-general__stat-value--accent">
              {formatTokens(agent.tokenUsage?.total || 0)}
            </span>
            <span className="ap-general__stat-label">Tokens</span>
          </div>
          <div className="ap-general__stat">
            <span className="ap-general__stat-value">{relativeTime(agent.lastActive)}</span>
            <span className="ap-general__stat-label">Last Active</span>
          </div>
          <div className="ap-general__stat">
            <span className="ap-general__stat-value ap-general__stat-value--dim">
              {agent.model ? agent.model.replace("anthropic/", "") : "--"}
            </span>
            <span className="ap-general__stat-label">Model</span>
          </div>
        </div>
      </div>

      {/* Human Operator */}
      {agent.human && (
        <div className="ap-section">
          <div className="ap-section__title">HUMAN OPERATOR</div>
          <div className="ap-general__human">
            <span className="ap-general__human-icon">&#9786;</span>
            <span className="ap-general__human-name">{agent.human}</span>
          </div>
        </div>
      )}

      {/* Channels */}
      {agent.channels && agent.channels.length > 0 && (
        <div className="ap-section">
          <div className="ap-section__title">CHANNELS</div>
          <div className="ap-general__channels">
            {agent.channels.map((ch, i) => (
              <div key={i} className="ap-general__channel-row">
                <span className="ap-general__channel-icon">
                  {ch.type === "telegram" ? "\u2708" : "#"}
                </span>
                <span className="ap-general__channel-name">{ch.name || ch.id}</span>
                <span className="ap-general__channel-type">{ch.type || "telegram"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabSkills({ agent }) {
  const [runningSkill, setRunningSkill] = useState(null);
  const [skillResult, setSkillResult] = useState(null);
  const [skillError, setSkillError] = useState(null);
  const openSkillTree = useAgentStore((s) => s.openSkillTree);

  const handleRunSkill = async (skillName) => {
    setRunningSkill(skillName);
    setSkillResult(null);
    setSkillError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/manage/agents/${agent.id}/skill/${skillName}`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSkillResult({ skill: skillName, data });
    } catch (err) {
      setSkillError({ skill: skillName, message: err.message });
    } finally {
      setRunningSkill(null);
    }
  };

  const skills = agent.skills || [];

  return (
    <div className="ap-tab-content">
      {/* Skill Tree Graph Section */}
      <div className="ap-skills__tree-section">
        <div className="ap-skills__tree-header">
          <span className="ap-skills__tree-title">Skill tree</span>
          <button
            className="ap-skills__expand-btn"
            onClick={() => openSkillTree(agent.id)}
          >
            Expand
          </button>
        </div>
        <div className="ap-skills__graph-wrap">
          <SkillsGraph
            agentId={agent.id}
            agentColor={agent.color}
            agentName={agent.name}
            onRunSkill={handleRunSkill}
          />
        </div>
      </div>

      <div className="ap-section">
        <div className="ap-section__title">
          SKILLS
          <span className="ap-section__count">{skills.length}</span>
        </div>

        {skills.length === 0 && (
          <div className="ap-empty">No skills configured for this agent.</div>
        )}

        <div className="ap-skills__list">
          {skills.map((skill) => (
            <div key={skill} className="ap-skill-card" style={{ "--skill-accent": agent.color }}>
              <div className="ap-skill-card__info">
                <span className="ap-skill-card__name">{skill}</span>
                <span className="ap-skill-card__desc">
                  {SKILL_DESCRIPTIONS[skill] || "Agent skill"}
                </span>
              </div>
              <button
                className="ap-skill-card__run-btn"
                disabled={runningSkill === skill}
                onClick={() => handleRunSkill(skill)}
              >
                {runningSkill === skill ? (
                  <span className="ap-spinner" />
                ) : (
                  "\u25B6"
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Result display */}
        {skillResult && (
          <div className="ap-result ap-result--success">
            <div className="ap-result__header">
              <span className="ap-result__icon">&#10003;</span>
              <span className="ap-result__title">{skillResult.skill} completed</span>
            </div>
            <pre className="ap-result__body">
              {JSON.stringify(skillResult.data, null, 2)}
            </pre>
          </div>
        )}

        {skillError && (
          <div className="ap-result ap-result--error">
            <div className="ap-result__header">
              <span className="ap-result__icon">&#10007;</span>
              <span className="ap-result__title">{skillError.skill} failed</span>
            </div>
            <pre className="ap-result__body">{skillError.message}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

function TabCron({ agent, cronJobs }) {
  const [runningJob, setRunningJob] = useState(null);
  const [jobResult, setJobResult] = useState(null);
  const [jobError, setJobError] = useState(null);

  const agentCronJobs = useMemo(() => {
    return cronJobs.filter((j) => j.agent === agent.id);
  }, [agent, cronJobs]);

  // Re-render relative times every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleForceRun = async (jobId) => {
    setRunningJob(jobId);
    setJobResult(null);
    setJobError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/manage/agents/${agent.id}/cron/${jobId}/run`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setJobResult({ jobId, data });
    } catch (err) {
      setJobError({ jobId, message: err.message });
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div className="ap-tab-content">
      <div className="ap-section">
        <div className="ap-section__title">
          CRON JOBS
          <span className="ap-section__count">{agentCronJobs.length}</span>
        </div>

        {agentCronJobs.length === 0 && (
          <div className="ap-empty">No cron jobs assigned to this agent.</div>
        )}

        <div className="ap-cron__list">
          {agentCronJobs.map((job) => (
            <div key={job.id} className="ap-cron-card">
              <div className="ap-cron-card__top">
                <div className="ap-cron-card__info">
                  <span className="ap-cron-card__name">{job.name}</span>
                  <span className="ap-cron-card__schedule">{job.schedule}</span>
                </div>
                <button
                  className="ap-cron-card__run-btn"
                  disabled={runningJob === job.id}
                  onClick={() => handleForceRun(job.id)}
                  title="Force run this job"
                >
                  {runningJob === job.id ? (
                    <span className="ap-spinner" />
                  ) : (
                    "\u25B6"
                  )}
                </button>
              </div>
              <div className="ap-cron-card__meta">
                <div className="ap-cron-card__meta-item">
                  <span className="ap-cron-card__meta-label">NEXT</span>
                  <span className="ap-cron-card__meta-value ap-cron-card__meta-value--next">
                    {relativeTimeFuture(job.nextRun)}
                  </span>
                </div>
                <div className="ap-cron-card__meta-item">
                  <span className="ap-cron-card__meta-label">LAST</span>
                  <span className="ap-cron-card__meta-value">
                    {relativeTime(job.lastRun)}
                  </span>
                </div>
                <div className="ap-cron-card__meta-item">
                  <span className="ap-cron-card__meta-label">STATUS</span>
                  <span className={
                    "ap-cron-card__meta-value " +
                    (job.lastStatus === "ok" ? "ap-cron-card__meta-value--ok" :
                     job.lastStatus === "error" || job.lastStatus === "fail" ? "ap-cron-card__meta-value--fail" :
                     "ap-cron-card__meta-value--pending")
                  }>
                    {job.lastStatus === "ok" ? "\u2713 OK" :
                     job.lastStatus === "error" || job.lastStatus === "fail" ? "\u2717 FAIL" :
                     "\u2022 " + (job.lastStatus || "pending")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Result display */}
        {jobResult && (
          <div className="ap-result ap-result--success">
            <div className="ap-result__header">
              <span className="ap-result__icon">&#10003;</span>
              <span className="ap-result__title">Job triggered</span>
            </div>
            <pre className="ap-result__body">
              {JSON.stringify(jobResult.data, null, 2)}
            </pre>
          </div>
        )}

        {jobError && (
          <div className="ap-result ap-result--error">
            <div className="ap-result__header">
              <span className="ap-result__icon">&#10007;</span>
              <span className="ap-result__title">Job failed</span>
            </div>
            <pre className="ap-result__body">{jobError.message}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

function TabLogs({ agent }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const logsEndRef = useRef(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/manage/agents/${agent.id}/logs`,
        { headers: { "Accept": "application/json" } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : data.logs || data.entries || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [agent.id]);

  // Initial fetch and auto-refresh every 10 seconds
  useEffect(() => {
    fetchLogs();
    const timer = setInterval(fetchLogs, 10000);
    return () => clearInterval(timer);
  }, [fetchLogs]);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="ap-tab-content ap-tab-content--logs">
      <div className="ap-section">
        <div className="ap-section__title">
          ACTIVITY LOG
          <span className="ap-section__count">
            {loading ? "..." : logs.length}
          </span>
          <button className="ap-logs__refresh-btn" onClick={fetchLogs} title="Refresh logs">
            &#8635;
          </button>
        </div>

        {error && (
          <div className="ap-logs__error">
            Failed to load logs: {error}
          </div>
        )}

        <div className="ap-logs__container">
          {loading && logs.length === 0 && (
            <div className="ap-logs__loading">Loading activity log...</div>
          )}

          {!loading && logs.length === 0 && !error && (
            <div className="ap-empty">No recent activity logs.</div>
          )}

          {logs.map((log, i) => (
            <div key={log.id || i} className="ap-logs__entry">
              <span className="ap-logs__timestamp">
                {log.timestamp
                  ? new Date(log.timestamp).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    })
                  : "--:--:--"}
              </span>
              <span className={
                "ap-logs__level " +
                (log.level === "error" ? "ap-logs__level--error" :
                 log.level === "warn" ? "ap-logs__level--warn" : "ap-logs__level--info")
              }>
                {(log.level || "info").toUpperCase()}
              </span>
              <span className="ap-logs__message">{log.message || log.text || JSON.stringify(log)}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export default function AgentPanel() {
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const agents = useAgentStore((s) => s.agents);
  const cronJobs = useAgentStore((s) => s.cronJobs);
  const clearSelectedAgent = useAgentStore((s) => s.clearSelectedAgent);
  const activeTab = useAgentStore((s) => s.activeTab);
  const setActiveTab = useAgentStore((s) => s.setActiveTab);

  // Track visibility separately for slide animation
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (selectedAgentId) {
      setRendered(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setRendered(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [selectedAgentId]);

  const agent = useMemo(() => {
    if (!selectedAgentId) return null;
    return agents.find((a) => a.id === selectedAgentId) || null;
  }, [selectedAgentId, agents]);

  // Escape key closes panel
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && selectedAgentId) {
        clearSelectedAgent();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedAgentId, clearSelectedAgent]);

  // Re-render relative times every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  if (!rendered) return null;

  return (
    <div className={`ap-panel ${visible ? "ap-panel--open" : ""}`}>
      {/* Close button */}
      <button
        className="ap-panel__close"
        onClick={clearSelectedAgent}
        title="Close panel"
      >
        &times;
      </button>

      {agent && (
        <>
          {/* Compact header */}
          <div className="ap-panel__agent-bar">
            <div
              className="ap-panel__agent-bar-avatar"
              style={{ backgroundColor: agent.color }}
            >
              {agent.name.charAt(0)}
            </div>
            <span className="ap-panel__agent-bar-name" style={{ color: agent.color }}>
              {agent.name}
            </span>
            <span
              className="ap-panel__agent-bar-status"
              style={{
                backgroundColor: (STATUS_COLORS[agent.status] || "#666") + "20",
                color: STATUS_COLORS[agent.status] || "#666",
              }}
            >
              {STATUS_LABELS[agent.status] || "Unknown"}
            </span>
          </div>

          {/* Tab bar */}
          <div className="ap-panel__tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={"ap-panel__tab " + (activeTab === tab.id ? "ap-panel__tab--active" : "")}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="ap-panel__body">
            {activeTab === "general" && <TabGeneral agent={agent} cronJobs={cronJobs} />}
            {activeTab === "skills" && <TabSkills agent={agent} />}
            {activeTab === "cron" && <TabCron agent={agent} cronJobs={cronJobs} />}
            {activeTab === "logs" && <TabLogs agent={agent} />}
          </div>
        </>
      )}
    </div>
  );
}
