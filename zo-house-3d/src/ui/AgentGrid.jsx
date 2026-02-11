import { useEffect, useCallback } from "react";
import useAgentStore from "../store/agentStore.js";

/**
 * AgentGrid.jsx — Modal overlay showing all 7 agents in a grid (Task #21)
 *
 * Glassmorphism backdrop, 3-column grid of agent cards.
 * Clicking a card selects the agent, closes the grid, and camera flies to their zone.
 * Escape key or X button closes the modal.
 */

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
  bd:               "Business Dev",
};

export default function AgentGrid() {
  const showAgentGrid = useAgentStore((s) => s.showAgentGrid);
  const closeAgentGrid = useAgentStore((s) => s.closeAgentGrid);
  const setSelectedAgent = useAgentStore((s) => s.setSelectedAgent);
  const agents = useAgentStore((s) => s.agents);

  const handleEscape = useCallback((e) => {
    if (e.key === "Escape" && showAgentGrid) {
      closeAgentGrid();
    }
  }, [showAgentGrid, closeAgentGrid]);

  useEffect(() => {
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  const handleAgentClick = (agentId) => {
    setSelectedAgent(agentId);
    closeAgentGrid();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeAgentGrid();
    }
  };

  if (!showAgentGrid) return null;

  return (
    <div className="agent-grid-overlay" onClick={handleBackdropClick}>
      <div className="agent-grid-modal">
        {/* Close button */}
        <button
          className="agent-grid-modal__close"
          onClick={closeAgentGrid}
          title="Close"
        >
          &times;
        </button>

        {/* Header */}
        <div className="agent-grid-modal__header">
          <h2 className="agent-grid-modal__title">Zo House Agents</h2>
          <p className="agent-grid-modal__subtitle">Select an agent to view details</p>
        </div>

        {/* Grid */}
        <div className="agent-grid-modal__grid">
          {agents.map((agent) => {
            const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline;
            const statusLabel = STATUS_LABELS[agent.status] || "Unknown";
            const roleLabel = ROLE_LABELS[agent.role] || agent.role;

            return (
              <button
                key={agent.id}
                className="agent-grid-card"
                onClick={() => handleAgentClick(agent.id)}
                style={{ "--card-accent": agent.color }}
              >
                {/* Avatar */}
                <div
                  className="agent-grid-card__avatar"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.name.charAt(0)}
                </div>

                {/* Status dot */}
                <span
                  className="agent-grid-card__status-dot"
                  style={{
                    backgroundColor: statusColor,
                    boxShadow: "0 0 6px " + statusColor + "80",
                  }}
                  title={statusLabel}
                />

                {/* Name */}
                <span
                  className="agent-grid-card__name"
                  style={{ color: agent.color }}
                >
                  {agent.name}
                </span>

                {/* Role */}
                <span className="agent-grid-card__role">{roleLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
