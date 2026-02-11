import { useEffect, useCallback, useState } from "react";
import useAgentStore from "../store/agentStore.js";
import SkillsGraph from "./SkillsGraph.jsx";

/**
 * SkillTreeModal.jsx — Full-screen modal overlay for the SkillsGraph.
 *
 * Opens when `skillTreeAgentId` is set in the store (via the Expand button
 * in AgentPanel's Skills tab). Renders the radial SkillsGraph at full viewport
 * size with a dark backdrop overlay. Closes on ESC, backdrop click, or the
 * close button.
 */

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3001`;

export default function SkillTreeModal() {
  const skillTreeAgentId = useAgentStore((s) => s.skillTreeAgentId);
  const closeSkillTree = useAgentStore((s) => s.closeSkillTree);
  const agents = useAgentStore((s) => s.agents);

  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [skillResult, setSkillResult] = useState(null);
  const [skillError, setSkillError] = useState(null);

  const agent = skillTreeAgentId
    ? agents.find((a) => a.id === skillTreeAgentId) || null
    : null;

  // Animate in/out
  useEffect(() => {
    if (skillTreeAgentId) {
      setRendered(true);
      setSkillResult(null);
      setSkillError(null);
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

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) closeSkillTree();
  }, [closeSkillTree]);

  const handleRunSkill = useCallback(async (skillName) => {
    if (!skillTreeAgentId) return;
    setSkillResult(null);
    setSkillError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/manage/agents/${skillTreeAgentId}/skill/${skillName}`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSkillResult({ skill: skillName, data });
    } catch (err) {
      setSkillError({ skill: skillName, message: err.message });
    }
  }, [skillTreeAgentId]);

  if (!rendered) return null;

  return (
    <div
      className={`skill-tree-modal ${visible ? "skill-tree-modal--open" : ""}`}
      onClick={handleBackdropClick}
    >
      <div className="skill-tree-modal__container">
        {/* Header */}
        <div className="skill-tree-modal__header">
          <div className="skill-tree-modal__agent-info">
            {agent && (
              <>
                <div
                  className="skill-tree-modal__avatar"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.name.charAt(0)}
                </div>
                <span className="skill-tree-modal__agent-name" style={{ color: agent.color }}>
                  {agent.name}
                </span>
                <span className="skill-tree-modal__subtitle">Skill Tree</span>
              </>
            )}
          </div>
          <button
            className="skill-tree-modal__close"
            onClick={closeSkillTree}
            title="Close (ESC)"
          >
            &times;
          </button>
        </div>

        {/* Graph body */}
        <div className="skill-tree-modal__body">
          {agent && (
            <SkillsGraph
              agentId={agent.id}
              agentColor={agent.color}
              agentName={agent.name}
              onRunSkill={handleRunSkill}
            />
          )}
        </div>

        {/* Result/error toast at bottom */}
        {skillResult && (
          <div className="skill-tree-modal__toast skill-tree-modal__toast--success">
            <span className="skill-tree-modal__toast-icon">&#10003;</span>
            <span>{skillResult.skill} completed</span>
          </div>
        )}
        {skillError && (
          <div className="skill-tree-modal__toast skill-tree-modal__toast--error">
            <span className="skill-tree-modal__toast-icon">&#10007;</span>
            <span>{skillError.skill}: {skillError.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
