import { useEffect, useCallback, useState, useMemo } from "react";
import useAgentStore from "../store/agentStore.js";
import SkillsGraph from "./SkillsGraph.jsx";

/**
 * SkillTreeModal.jsx — Full-screen RPG-style agent command center modal.
 *
 * Opens when clicking an agent in the 3D scene. Features:
 * - Four tabs: General, Skills, Workspace, Advanced
 * - Agent character/avatar prominently displayed
 * - Skills tab shows the radial skill graph with agent in center
 * - Escape key or backdrop click to close
 */

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ── Constants ─────────────────────────────────────────────────────

const STATUS_COLORS = {
  active: "#44ffaa",
  idle: "#ffaa44",
  online: "#8888ff",
  dormant: "#666688",
  standby: "#aa88ff",
  offline: "#ff4466",
};

const STATUS_LABELS = {
  active: "Active",
  idle: "Idle",
  online: "Online",
  dormant: "Dormant",
  standby: "Standby",
  offline: "Offline",
};

const ROLE_LABELS = {
  director: "Strategic Orchestrator",
  "captain-blrxzo": "House Captain — Bangalore",
  "captain-wtfxzo": "House Captain — Whitefield",
  events: "Events Manager",
  "vibe-curator": "Vibe Curator",
  sales: "Sales Lead",
  bd: "Business Development",
};

const TABS = [
  { id: "general", label: "General", icon: "👤" },
  { id: "skills", label: "Skills", icon: "⚡" },
  { id: "workspace", label: "Workspace", icon: "📁" },
  { id: "advanced", label: "Advanced", icon: "⚙️" },
];

// ── Helper functions ──────────────────────────────────────────────

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

// ── Tab Content Components ────────────────────────────────────────

function TabGeneral({ agent }) {
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline;
  const statusLabel = STATUS_LABELS[agent.status] || "Unknown";
  const roleLabel = ROLE_LABELS[agent.role] || agent.role;
  const cronJobs = useAgentStore((s) => s.cronJobs);
  const agentCronJobs = cronJobs.filter((j) => j.agent === agent.id);

  return (
    <div className="stm-tab-content stm-tab-general">
      {/* Agent Profile Card */}
      <div className="stm-profile-card">
        <div className="stm-profile-card__avatar" style={{ backgroundColor: agent.color }}>
          {agent.name.charAt(0)}
        </div>
        <div className="stm-profile-card__info">
          <h2 className="stm-profile-card__name" style={{ color: agent.color }}>
            {agent.name}
          </h2>
          <span className="stm-profile-card__role">{roleLabel}</span>
          <div className="stm-profile-card__status">
            <span
              className="stm-profile-card__status-dot"
              style={{ backgroundColor: statusColor }}
            />
            <span style={{ color: statusColor }}>{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stm-stats-grid">
        <div className="stm-stat-card">
          <span className="stm-stat-card__value">{agent.sessionCount || 0}</span>
          <span className="stm-stat-card__label">Sessions</span>
        </div>
        <div className="stm-stat-card">
          <span className="stm-stat-card__value stm-stat-card__value--accent">
            {formatTokens(agent.tokenUsage?.total || 0)}
          </span>
          <span className="stm-stat-card__label">Tokens</span>
        </div>
        <div className="stm-stat-card">
          <span className="stm-stat-card__value">{relativeTime(agent.lastActive)}</span>
          <span className="stm-stat-card__label">Last Active</span>
        </div>
        <div className="stm-stat-card">
          <span className="stm-stat-card__value">{agent.skills?.length || 0}</span>
          <span className="stm-stat-card__label">Skills</span>
        </div>
      </div>

      {/* Current Activity */}
      <div className="stm-section">
        <h3 className="stm-section__title">Current Activity</h3>
        <div className="stm-activity-indicator">
          <span
            className="stm-activity-indicator__dot"
            style={{ backgroundColor: agent.currentTask ? "#44ffaa" : "#666688" }}
          />
          <span>{agent.currentTask || "Idle — no active task"}</span>
        </div>
      </div>

      {/* Human Operator */}
      {agent.human && (
        <div className="stm-section">
          <h3 className="stm-section__title">Human Partner</h3>
          <div className="stm-human-card">
            <span className="stm-human-card__icon">👤</span>
            <span className="stm-human-card__name">{agent.human}</span>
          </div>
        </div>
      )}

      {/* Upcoming Tasks */}
      {agentCronJobs.length > 0 && (
        <div className="stm-section">
          <h3 className="stm-section__title">Scheduled Tasks</h3>
          <div className="stm-cron-list">
            {agentCronJobs.slice(0, 3).map((job) => (
              <div key={job.id} className="stm-cron-item">
                <span className="stm-cron-item__name">{job.name}</span>
                <span className="stm-cron-item__schedule">{job.schedule}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabSkills({ agent }) {
  return (
    <div className="stm-tab-content stm-tab-skills">
      <div className="stm-skills-graph-container">
        <SkillsGraph
          agentId={agent.id}
          agentColor={agent.color}
          agentName={agent.name}
        />
      </div>
    </div>
  );
}

function TabWorkspace({ agent }) {
  return (
    <div className="stm-tab-content stm-tab-workspace">
      <div className="stm-section">
        <h3 className="stm-section__title">Workspace Configuration</h3>
        <div className="stm-workspace-info">
          <div className="stm-workspace-row">
            <span className="stm-workspace-row__label">Workspace ID</span>
            <span className="stm-workspace-row__value">{agent.id}</span>
          </div>
          <div className="stm-workspace-row">
            <span className="stm-workspace-row__label">Model</span>
            <span className="stm-workspace-row__value">
              {agent.model || "claude-haiku-4-5"}
            </span>
          </div>
          <div className="stm-workspace-row">
            <span className="stm-workspace-row__label">Role</span>
            <span className="stm-workspace-row__value">{agent.role}</span>
          </div>
        </div>
      </div>

      {/* Channels */}
      {agent.channels && agent.channels.length > 0 && (
        <div className="stm-section">
          <h3 className="stm-section__title">Communication Channels</h3>
          <div className="stm-channels-list">
            {agent.channels.map((ch, i) => (
              <div key={i} className="stm-channel-card">
                <span className="stm-channel-card__icon">
                  {ch.type === "telegram" ? "✈️" : "#"}
                </span>
                <div className="stm-channel-card__info">
                  <span className="stm-channel-card__name">{ch.name || ch.id}</span>
                  <span className="stm-channel-card__type">{ch.type || "telegram"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills List */}
      <div className="stm-section">
        <h3 className="stm-section__title">Installed Skills ({agent.skills?.length || 0})</h3>
        <div className="stm-skills-list">
          {(agent.skills || []).map((skill) => (
            <div key={skill} className="stm-skill-tag" style={{ borderColor: agent.color }}>
              {skill}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabAdvanced({ agent }) {
  return (
    <div className="stm-tab-content stm-tab-advanced">
      <div className="stm-section">
        <h3 className="stm-section__title">Token Usage</h3>
        <div className="stm-token-breakdown">
          <div className="stm-token-row">
            <span className="stm-token-row__label">Input Tokens</span>
            <span className="stm-token-row__value">
              {formatTokens(agent.tokenUsage?.input || 0)}
            </span>
          </div>
          <div className="stm-token-row">
            <span className="stm-token-row__label">Output Tokens</span>
            <span className="stm-token-row__value">
              {formatTokens(agent.tokenUsage?.output || 0)}
            </span>
          </div>
          <div className="stm-token-row stm-token-row--total">
            <span className="stm-token-row__label">Total</span>
            <span className="stm-token-row__value">
              {formatTokens(agent.tokenUsage?.total || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="stm-section">
        <h3 className="stm-section__title">Agent Metadata</h3>
        <pre className="stm-json-view">
          {JSON.stringify(
            {
              id: agent.id,
              name: agent.name,
              role: agent.role,
              status: agent.status,
              model: agent.model,
              sessionCount: agent.sessionCount,
              lastActive: agent.lastActive,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export default function SkillTreeModal() {
  const skillTreeAgentId = useAgentStore((s) => s.skillTreeAgentId);
  const closeSkillTree = useAgentStore((s) => s.closeSkillTree);
  const agents = useAgentStore((s) => s.agents);

  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [activeTab, setActiveTab] = useState("skills"); // Default to skills tab
  const agent = useMemo(() => {
    if (!skillTreeAgentId) return null;
    return agents.find((a) => a.id === skillTreeAgentId) || null;
  }, [skillTreeAgentId, agents]);

  // Animate in/out
  useEffect(() => {
    if (skillTreeAgentId) {
      setRendered(true);
      setActiveTab("skills"); // Reset to skills tab when opening
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setRendered(false), 350);
      return () => clearTimeout(timeout);
    }
  }, [skillTreeAgentId]);

  // ESC key to close
  useEffect(() => {
    if (!skillTreeAgentId) return;
    const handleKey = (e) => {
      if (e.key === "Escape") closeSkillTree();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [skillTreeAgentId, closeSkillTree]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) closeSkillTree();
    },
    [closeSkillTree]
  );

  if (!rendered) return null;

  return (
    <div
      className={`stm-overlay ${visible ? "stm-overlay--open" : ""}`}
      onClick={handleBackdropClick}
    >
      <div className="stm-modal">
        {/* Header with tabs */}
        <div className="stm-header">
          <div className="stm-header__tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`stm-header__tab ${activeTab === tab.id ? "stm-header__tab--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="stm-header__tab-icon">{tab.icon}</span>
                <span className="stm-header__tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
          <button className="stm-header__close" onClick={closeSkillTree} title="Close (ESC)">
            ×
          </button>
        </div>

        {/* Modal body */}
        <div className="stm-body">
          {agent && (
            <>
              {activeTab === "general" && <TabGeneral agent={agent} />}
              {activeTab === "skills" && <TabSkills agent={agent} />}
              {activeTab === "workspace" && <TabWorkspace agent={agent} />}
              {activeTab === "advanced" && <TabAdvanced agent={agent} />}
            </>
          )}
        </div>

        {/* Footer with Save button */}
        <div className="stm-footer">
          <div className="stm-footer__branding">
            <span className="stm-footer__powered">POWERED BY</span>
            <span className="stm-footer__logo">SENTIENT HOUSE</span>
          </div>
          <button className="stm-footer__save-btn" onClick={closeSkillTree}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
