import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import useAgentStore from "../store/agentStore.js";
import AgentAvatar3D from "./AgentAvatar3D.jsx";

/**
 * SkillsGraph.jsx — Interactive skill visualization for agents
 *
 * Fetches actual skills from the workspace folders via API and displays them
 * in a radial graph with the agent avatar at center. Click skills to see
 * full details including description, triggers, and content preview.
 */

const API_BASE = import.meta.env.VITE_API_BASE || "";

const CATEGORY_COLORS = {
  "data-entry": "#00E5FF",
  finance: "#FFD700",
  events: "#FF69B4",
  integration: "#00CED1",
  marketing: "#FF6347",
  reporting: "#8A2BE2",
  operations: "#4CAF50",
  hospitality: "#FF8C00",
  hr: "#1E90FF",
  creative: "#E040FB",
  community: "#00E676",
  sales: "#FFAB00",
  research: "#7C4DFF",
  bd: "#FF5722",
  management: "#00BCD4",
};

const CATEGORY_ICONS = {
  "data-entry": "📊",
  finance: "💰",
  events: "🎉",
  integration: "🔗",
  marketing: "📣",
  reporting: "📊",
  operations: "⚙️",
  hospitality: "🏠",
  hr: "👥",
  creative: "🎨",
  community: "🌐",
  sales: "💼",
  research: "🔬",
  bd: "🤝",
  management: "👑",
};

/**
 * Compute radial positions for skill nodes around a center point.
 */
function computeRadialLayout(skillCount, centerX, centerY, radius) {
  const positions = [];
  const angleStep = (2 * Math.PI) / skillCount;
  const startAngle = -Math.PI / 2;

  for (let i = 0; i < skillCount; i++) {
    const angle = startAngle + i * angleStep;
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      angle,
    });
  }
  return positions;
}

/**
 * A single skill node component rendered in SVG.
 */
function SkillNode({ skill, x, y, index, agentColor, isSelected, onSelect }) {
  const categoryColor = CATEGORY_COLORS[skill.category] || agentColor;
  const nodeWidth = 130;
  const nodeHeight = 42;
  const [hovered, setHovered] = useState(false);

  return (
    <g
      transform={`translate(${x - nodeWidth / 2}, ${y - nodeHeight / 2})`}
      style={{ cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(skill);
      }}
    >
      {/* Animate entrance */}
      <animateTransform
        attributeName="transform"
        type="translate"
        from={`${x - nodeWidth / 2}, ${y - nodeHeight / 2 + 20}`}
        to={`${x - nodeWidth / 2}, ${y - nodeHeight / 2}`}
        dur="0.4s"
        begin={`${index * 0.06}s`}
        fill="freeze"
        calcMode="spline"
        keySplines="0.25 0.46 0.45 0.94"
      />

      {/* Node background */}
      <rect
        width={nodeWidth}
        height={nodeHeight}
        rx={10}
        ry={10}
        fill={isSelected ? "rgba(40, 44, 60, 0.98)" : hovered ? "rgba(30, 34, 50, 0.95)" : "rgba(20, 24, 40, 0.85)"}
        stroke={isSelected ? categoryColor : agentColor}
        strokeWidth={isSelected ? 2.5 : hovered ? 2 : 1}
        strokeOpacity={isSelected ? 1 : hovered ? 0.9 : 0.4}
        style={{
          filter: isSelected || hovered ? `drop-shadow(0 0 10px ${categoryColor}50)` : "none",
          transition: "all 0.2s ease",
        }}
      />

      {/* Category indicator */}
      <rect
        x={0}
        y={0}
        width={6}
        height={nodeHeight}
        rx={3}
        fill={categoryColor}
        opacity={0.9}
      />

      {/* Skill name */}
      <text
        x={14}
        y={18}
        fill="#E8E8E8"
        fontSize="11"
        fontFamily="Inter, SF Pro Display, -apple-system, sans-serif"
        fontWeight="600"
      >
        {skill.name.length > 14 ? skill.name.slice(0, 13) + "…" : skill.name}
      </text>

      {/* Category label */}
      <text
        x={14}
        y={32}
        fill={categoryColor}
        fontSize="9"
        fontFamily="Inter, -apple-system, sans-serif"
        fontWeight="500"
        opacity={0.8}
      >
        {CATEGORY_ICONS[skill.category] || "📋"} {skill.category}
      </text>

      {/* Selection indicator */}
      {isSelected && (
        <circle
          cx={nodeWidth - 12}
          cy={nodeHeight / 2}
          r={5}
          fill={categoryColor}
        >
          <animate
            attributeName="r"
            values="4;6;4"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
}

/**
 * Skill detail panel showing full information
 */
function SkillDetailPanel({ skill, agentColor, onClose, onRun }) {
  if (!skill) return null;

  const categoryColor = CATEGORY_COLORS[skill.category] || agentColor;

  return (
    <div
      className="skill-detail-panel"
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: "320px",
        background: "linear-gradient(180deg, rgba(20, 22, 35, 0.98) 0%, rgba(15, 17, 28, 0.98) 100%)",
        borderLeft: `2px solid ${categoryColor}40`,
        padding: "20px",
        overflowY: "auto",
        zIndex: 20,
        boxShadow: "-4px 0 20px rgba(0,0,0,0.4)",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: "50%",
          width: "28px",
          height: "28px",
          cursor: "pointer",
          color: "#888",
          fontSize: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ✕
      </button>

      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "inline-block",
            padding: "4px 10px",
            background: `${categoryColor}25`,
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: 600,
            color: categoryColor,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "10px",
          }}
        >
          {CATEGORY_ICONS[skill.category]} {skill.category}
        </div>
        <h3
          style={{
            color: "#f0f0f0",
            fontSize: "18px",
            fontWeight: 700,
            margin: "0 0 8px 0",
            fontFamily: "Inter, -apple-system, sans-serif",
          }}
        >
          {skill.name}
        </h3>
        <p
          style={{
            color: "#aaa",
            fontSize: "13px",
            lineHeight: 1.5,
            margin: 0,
            fontFamily: "Inter, -apple-system, sans-serif",
          }}
        >
          {skill.description}
        </p>
      </div>

      {/* Triggers */}
      {skill.triggers && skill.triggers.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h4
            style={{
              color: "#888",
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "10px",
            }}
          >
            Triggers
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {skill.triggers.slice(0, 6).map((trigger, i) => (
              <span
                key={i}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  color: "#ccc",
                  fontFamily: "Inter, -apple-system, sans-serif",
                }}
              >
                "{trigger}"
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content preview */}
      {skill.content && (
        <div style={{ marginBottom: "20px" }}>
          <h4
            style={{
              color: "#888",
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "10px",
            }}
          >
            Instructions Preview
          </h4>
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: "8px",
              padding: "12px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            <pre
              style={{
                color: "#999",
                fontSize: "11px",
                lineHeight: 1.5,
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "SF Mono, Menlo, monospace",
              }}
            >
              {skill.content.slice(0, 800)}
              {skill.content.length > 800 && "..."}
            </pre>
          </div>
        </div>
      )}

      {/* Run button */}
      <button
        onClick={() => onRun(skill.name)}
        style={{
          width: "100%",
          padding: "12px",
          background: `linear-gradient(135deg, ${categoryColor}90 0%, ${categoryColor}60 100%)`,
          border: "none",
          borderRadius: "10px",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "Inter, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        ⚡ Run Skill
      </button>
    </div>
  );
}

/**
 * Main SkillsGraph component.
 */
export default function SkillsGraph({ agentId, agentColor, agentName, onRunSkill }) {
  const agent = useAgentStore((s) => s.agents.find((a) => a.id === agentId));
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 480, height: 420 });
  const containerRef = useRef(null);

  // Fetch skills from API
  useEffect(() => {
    async function fetchSkills() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/skills/${agentId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.skills && data.skills.length > 0) {
            setSkills(data.skills);
          }
        }
      } catch (e) {
        console.error("[SkillsGraph] Failed to fetch skills:", e);
      } finally {
        setLoading(false);
      }
    }
    
    if (agentId) {
      fetchSkills();
    }
  }, [agentId]);

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const color = agentColor || agent?.color || "#8888ff";
  const name = agentName || agent?.name || agentId;

  // Adjust layout based on whether detail panel is open
  const graphWidth = selectedSkill ? dimensions.width - 320 : dimensions.width;
  const centerX = graphWidth / 2;
  const centerY = dimensions.height / 2;
  const avatarSize = Math.min(graphWidth, dimensions.height) * 0.16;
  const radius = Math.min(graphWidth, dimensions.height) * 0.38;

  const nodePositions = useMemo(() => {
    return computeRadialLayout(skills.length, centerX, centerY, radius);
  }, [skills.length, centerX, centerY, radius]);

  const handleSelectSkill = useCallback((skill) => {
    setSelectedSkill((prev) => (prev?.id === skill.id ? null : skill));
  }, []);

  const handleTriggerSkill = useCallback(
    (skillName) => {
      if (onRunSkill) {
        onRunSkill(skillName);
      } else {
        console.log(`[SkillsGraph] Trigger skill: ${skillName} for agent: ${agentId}`);
      }
    },
    [agentId, onRunSkill]
  );

  if (loading) {
    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontFamily: "Inter, -apple-system, sans-serif",
          fontSize: "13px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              border: `3px solid ${color}30`,
              borderTopColor: color,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          Loading skills...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontFamily: "Inter, -apple-system, sans-serif",
          fontSize: "13px",
        }}
      >
        No skills found for this agent.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="skills-graph"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "350px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg
        width={graphWidth}
        height={dimensions.height}
        viewBox={`0 0 ${graphWidth} ${dimensions.height}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {/* Background grid pattern */}
        <defs>
          <pattern id="skills-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="0.5" fill="#ffffff08" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#skills-grid)" />

        {/* Connection lines */}
        {nodePositions.map((pos, i) => (
          <line
            key={`line-${i}`}
            x1={centerX}
            y1={centerY}
            x2={pos.x}
            y2={pos.y}
            stroke={selectedSkill?.id === skills[i].id ? CATEGORY_COLORS[skills[i].category] || color : color}
            strokeWidth={selectedSkill?.id === skills[i].id ? 2 : 1}
            strokeOpacity={selectedSkill?.id === skills[i].id ? 0.8 : 0.2}
            strokeDasharray={selectedSkill?.id === skills[i].id ? "none" : "4 4"}
            style={{ transition: "all 0.2s ease" }}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="200"
              to="0"
              dur="0.8s"
              begin={`${i * 0.08}s`}
              fill="freeze"
            />
          </line>
        ))}

        {/* Pulsing ring around avatar */}
        <circle
          cx={centerX}
          cy={centerY}
          r={avatarSize / 2 + 6}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeOpacity="0.4"
        >
          <animate
            attributeName="r"
            values={`${avatarSize / 2 + 6};${avatarSize / 2 + 12};${avatarSize / 2 + 6}`}
            dur="3s"
            repeatCount="indefinite"
          />
          <animate attributeName="stroke-opacity" values="0.4;0.15;0.4" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Rotating outer ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={avatarSize / 2 + 16}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.2"
          strokeDasharray="6 3"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${centerX} ${centerY}`}
            to={`360 ${centerX} ${centerY}`}
            dur="15s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Skill nodes */}
        {skills.map((skill, i) => (
          <SkillNode
            key={skill.id}
            skill={skill}
            x={nodePositions[i].x}
            y={nodePositions[i].y}
            index={i}
            agentColor={color}
            isSelected={selectedSkill?.id === skill.id}
            onSelect={handleSelectSkill}
          />
        ))}

        {/* Skill count badge */}
        <text
          x={centerX}
          y={centerY - avatarSize / 2 - 24}
          textAnchor="middle"
          fill="#999"
          fontSize="10"
          fontFamily="Inter, -apple-system, sans-serif"
          fontWeight="600"
          letterSpacing="1.5"
        >
          {skills.length} SKILLS
        </text>
      </svg>

      {/* 3D Agent Avatar at center */}
      <div
        style={{
          position: "absolute",
          left: centerX - avatarSize / 2,
          top: centerY - avatarSize / 2,
          width: avatarSize,
          height: avatarSize,
          pointerEvents: "auto",
        }}
      >
        <AgentAvatar3D
          agentId={agentId}
          agentColor={color}
          agentName={name}
          status={agent?.status || "offline"}
          currentTask={agent?.currentTask}
          size={avatarSize}
        />
      </div>

      {/* Skill detail panel */}
      <SkillDetailPanel
        skill={selectedSkill}
        agentColor={color}
        onClose={() => setSelectedSkill(null)}
        onRun={handleTriggerSkill}
      />

      {/* Click-to-select hint */}
      {!selectedSkill && (
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#666",
            fontSize: "11px",
            fontFamily: "Inter, -apple-system, sans-serif",
          }}
        >
          Click a skill to view details
        </div>
      )}
    </div>
  );
}
