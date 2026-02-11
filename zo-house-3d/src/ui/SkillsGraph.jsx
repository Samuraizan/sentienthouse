import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import useAgentStore from "../store/agentStore.js";

/**
 * SkillsGraph.jsx — Network/mind-map visualization of an agent's skills (#22)
 *
 * SVG-based radial graph with the agent avatar in the center and skills as
 * connected nodes arranged in a circle around it. Inspired by Ralv.ai's skills
 * view. Designed to sit inside the AgentPanel as a tab/overlay.
 *
 * Features:
 *   - Agent avatar (colored circle with initial) at center
 *   - Skills as rounded-rect nodes in a radial layout
 *   - Animated connecting lines from center to each skill
 *   - Hover effects with subtle floating animation
 *   - Click-to-expand skill detail tooltip
 *   - Falls back to static skill data when API is unavailable
 */

// ── Static fallback skill data with descriptions ───────────────────
const SKILL_CATALOG = {
  // events/suki
  "invoice-maker":    { description: "Generate PDF invoices for events and bookings", category: "finance" },
  "event-inquiry":    { description: "Handle inbound event inquiries and qualify leads", category: "events" },
  "luma-sync":        { description: "Sync event data with Luma calendar platform", category: "integration" },
  "event-marketing":  { description: "Create marketing materials and social posts for events", category: "marketing" },
  "event-recap":      { description: "Generate post-event summaries and metrics reports", category: "reporting" },
  "rev-tracking":     { description: "Track revenue across events and generate financial reports", category: "finance" },
  // captain-blrxzo / captain-wtfxzo
  "morning-audit":    { description: "Daily checklist audit for property operations kickoff", category: "operations" },
  "guest-flow":       { description: "Manage check-in/check-out flow and guest experience", category: "hospitality" },
  "financial-entry":  { description: "Record daily financial transactions and expenses", category: "finance" },
  "staff-report":     { description: "Compile staff attendance, tasks, and performance notes", category: "hr" },
  "maintenance-triage": { description: "Prioritize and route maintenance requests", category: "operations" },
  "daily-recap":      { description: "End-of-day property summary with KPIs and highlights", category: "reporting" },
  // vibe-curator/loki
  "guest-welcome":    { description: "Personalized welcome messages for new guests", category: "hospitality" },
  "daily-vibe":       { description: "Curate daily playlist, lighting mood, and atmosphere", category: "creative" },
  "city-event":       { description: "Scout and share relevant city events and happenings", category: "community" },
  "community-pulse":  { description: "Monitor community sentiment and engagement metrics", category: "community" },
  // sales/wanda
  "lead-qualify":     { description: "Score and qualify inbound sales leads", category: "sales" },
  "outreach-sequence": { description: "Manage automated outreach email sequences", category: "sales" },
  "pipeline-update":  { description: "Update sales pipeline status and forecast", category: "sales" },
  "founder-marketing": { description: "Create founder-focused marketing content and outreach", category: "marketing" },
  // bd/yana
  "partner-research": { description: "Research potential brand and business partners", category: "research" },
  "founder-outreach": { description: "Outreach campaigns targeting founders and entrepreneurs", category: "bd" },
  "deal-pipeline":    { description: "Track and manage business development deals", category: "bd" },
  // director/zomadprime
  "delegate-task":    { description: "Delegate tasks to agents with context and priority", category: "management" },
  "morning-briefing": { description: "Compile cross-agent morning briefing for leadership", category: "reporting" },
  "weekly-scorecard": { description: "Generate weekly team performance scorecards", category: "reporting" },
};

const FALLBACK_SKILLS = {
  zomadprime:    ["delegate-task", "morning-briefing", "weekly-scorecard"],
  "blrxzo-jr":   ["morning-audit", "guest-flow", "financial-entry", "staff-report", "maintenance-triage", "daily-recap"],
  "wtfxzo-jr":   ["morning-audit", "guest-flow", "financial-entry", "staff-report", "maintenance-triage", "daily-recap"],
  suki:          ["invoice-maker", "event-inquiry", "luma-sync", "event-marketing", "event-recap", "rev-tracking"],
  loki:          ["guest-welcome", "daily-vibe", "city-event", "community-pulse"],
  wanda:         ["lead-qualify", "outreach-sequence", "pipeline-update", "founder-marketing"],
  yana:          ["partner-research", "founder-outreach", "deal-pipeline"],
};

const CATEGORY_COLORS = {
  finance:      "#FFD700",
  events:       "#FF69B4",
  integration:  "#00CED1",
  marketing:    "#FF6347",
  reporting:    "#8A2BE2",
  operations:   "#4CAF50",
  hospitality:  "#FF8C00",
  hr:           "#1E90FF",
  creative:     "#E040FB",
  community:    "#00E676",
  sales:        "#FFAB00",
  research:     "#7C4DFF",
  bd:           "#FF5722",
  management:   "#00BCD4",
};

/**
 * Compute radial positions for skill nodes around a center point.
 */
function computeRadialLayout(skillCount, centerX, centerY, radius) {
  const positions = [];
  const angleStep = (2 * Math.PI) / skillCount;
  // Start from the top (-PI/2) and go clockwise
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
function SkillNode({
  skill,
  x,
  y,
  index,
  agentColor,
  isExpanded,
  onToggle,
  onTrigger,
}) {
  const info = SKILL_CATALOG[skill] || { description: "Custom skill", category: "operations" };
  const categoryColor = CATEGORY_COLORS[info.category] || agentColor;
  const nodeWidth = 140;
  const nodeHeight = isExpanded ? 80 : 44;
  const [hovered, setHovered] = useState(false);

  return (
    <g
      transform={`translate(${x - nodeWidth / 2}, ${y - nodeHeight / 2})`}
      style={{ cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(skill);
      }}
    >
      {/* Animate entrance */}
      <animateTransform
        attributeName="transform"
        type="translate"
        from={`${x - nodeWidth / 2}, ${y - nodeHeight / 2 + 20}`}
        to={`${x - nodeWidth / 2}, ${y - nodeHeight / 2}`}
        dur="0.5s"
        begin={`${index * 0.08}s`}
        fill="freeze"
        calcMode="spline"
        keySplines="0.25 0.46 0.45 0.94"
      />

      {/* Node background */}
      <rect
        width={nodeWidth}
        height={nodeHeight}
        rx={12}
        ry={12}
        fill={hovered ? "rgba(30, 34, 50, 0.95)" : "rgba(20, 24, 40, 0.85)"}
        stroke={agentColor}
        strokeWidth={hovered ? 2 : 1}
        strokeOpacity={hovered ? 0.9 : 0.4}
        style={{
          filter: hovered ? `drop-shadow(0 0 8px ${agentColor}60)` : "none",
          transition: "all 0.3s ease",
        }}
      />

      {/* Category indicator dot */}
      <circle
        cx={16}
        cy={22}
        r={4}
        fill={categoryColor}
        opacity={0.9}
      />

      {/* Skill name */}
      <text
        x={28}
        y={26}
        fill="#E0E0E0"
        fontSize="11"
        fontFamily="Inter, SF Pro Display, -apple-system, sans-serif"
        fontWeight="600"
      >
        {skill.length > 16 ? skill.slice(0, 15) + "\u2026" : skill}
      </text>

      {/* Expanded: description + trigger button */}
      {isExpanded && (
        <>
          <text
            x={12}
            y={48}
            fill="#999"
            fontSize="9"
            fontFamily="Inter, -apple-system, sans-serif"
            fontWeight="400"
          >
            {info.description.length > 28
              ? info.description.slice(0, 27) + "\u2026"
              : info.description}
          </text>

          {/* Trigger button */}
          <g
            onClick={(e) => {
              e.stopPropagation();
              onTrigger(skill);
            }}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={nodeWidth - 56}
              y={56}
              width={44}
              height={18}
              rx={9}
              fill={agentColor}
              opacity={0.25}
            />
            <text
              x={nodeWidth - 34}
              y={68}
              fill={agentColor}
              fontSize="9"
              fontWeight="600"
              textAnchor="middle"
              fontFamily="Inter, -apple-system, sans-serif"
            >
              Run
            </text>
          </g>
        </>
      )}

      {/* Subtle floating animation on hover */}
      {hovered && (
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`${x - nodeWidth / 2}, ${y - nodeHeight / 2}; ${x - nodeWidth / 2}, ${y - nodeHeight / 2 - 3}; ${x - nodeWidth / 2}, ${y - nodeHeight / 2}`}
          dur="2s"
          repeatCount="indefinite"
        />
      )}
    </g>
  );
}


/**
 * Main SkillsGraph component.
 * Renders an SVG radial mind-map of the selected agent's skills.
 */
export default function SkillsGraph({ agentId, agentColor, agentName, onRunSkill }) {
  const agent = useAgentStore((s) => s.agents.find((a) => a.id === agentId));
  const [expandedSkill, setExpandedSkill] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 480, height: 420 });
  const containerRef = useRef(null);

  // Get skills from store, fall back to static data
  const skills = useMemo(() => {
    if (agent?.skills && agent.skills.length > 0) return agent.skills;
    return FALLBACK_SKILLS[agentId] || [];
  }, [agent, agentId]);

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
  const initial = name.charAt(0).toUpperCase();

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

  const nodePositions = useMemo(() => {
    return computeRadialLayout(skills.length, centerX, centerY, radius);
  }, [skills.length, centerX, centerY, radius]);

  const handleToggleSkill = useCallback((skill) => {
    setExpandedSkill((prev) => (prev === skill ? null : skill));
  }, []);

  const handleTriggerSkill = useCallback((skill) => {
    if (onRunSkill) {
      onRunSkill(skill);
    } else {
      console.log(`[SkillsGraph] Trigger skill: ${skill} for agent: ${agentId}`);
    }
  }, [agentId, onRunSkill]);

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
        No skills configured for this agent.
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
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {/* Background grid pattern (subtle) */}
        <defs>
          <pattern
            id="skills-grid"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="15" cy="15" r="0.5" fill="#ffffff08" />
          </pattern>
          {/* Glow filter for center avatar */}
          <filter id="center-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Line gradient */}
          <linearGradient id={`line-grad-${agentId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#skills-grid)" />

        {/* ── Connection lines from center to each skill node ── */}
        {nodePositions.map((pos, i) => (
          <line
            key={`line-${i}`}
            x1={centerX}
            y1={centerY}
            x2={pos.x}
            y2={pos.y}
            stroke={color}
            strokeWidth={expandedSkill === skills[i] ? 2 : 1}
            strokeOpacity={expandedSkill === skills[i] ? 0.7 : 0.25}
            strokeDasharray={expandedSkill === skills[i] ? "none" : "4 4"}
            style={{ transition: "all 0.3s ease" }}
          >
            {/* Animated line drawing on mount */}
            <animate
              attributeName="stroke-dashoffset"
              from="200"
              to="0"
              dur="1s"
              begin={`${i * 0.1}s`}
              fill="freeze"
            />
          </line>
        ))}

        {/* ── Pulsing ring around center ── */}
        <circle
          cx={centerX}
          cy={centerY}
          r={32}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.3"
        >
          <animate
            attributeName="r"
            values="32;38;32"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            values="0.3;0.1;0.3"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>

        {/* ── Center avatar circle ── */}
        <circle
          cx={centerX}
          cy={centerY}
          r={28}
          fill={color}
          opacity="0.2"
          filter="url(#center-glow)"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={24}
          fill="rgba(15, 18, 30, 0.9)"
          stroke={color}
          strokeWidth="2"
          strokeOpacity="0.8"
        />
        {/* Agent initial */}
        <text
          x={centerX}
          y={centerY + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="18"
          fontWeight="700"
          fontFamily="Inter, SF Pro Display, -apple-system, sans-serif"
        >
          {initial}
        </text>
        {/* Agent name below avatar */}
        <text
          x={centerX}
          y={centerY + 44}
          textAnchor="middle"
          fill="#ccc"
          fontSize="10"
          fontWeight="500"
          fontFamily="Inter, -apple-system, sans-serif"
          letterSpacing="0.5"
        >
          {name}
        </text>

        {/* ── Skill nodes ── */}
        {skills.map((skill, i) => (
          <SkillNode
            key={skill}
            skill={skill}
            x={nodePositions[i].x}
            y={nodePositions[i].y}
            index={i}
            agentColor={color}
            isExpanded={expandedSkill === skill}
            onToggle={handleToggleSkill}
            onTrigger={handleTriggerSkill}
          />
        ))}

        {/* ── Skill count badge ── */}
        <text
          x={centerX}
          y={centerY - 38}
          textAnchor="middle"
          fill="#888"
          fontSize="9"
          fontFamily="Inter, -apple-system, sans-serif"
          fontWeight="500"
          letterSpacing="1"
        >
          {skills.length} SKILLS
        </text>
      </svg>

      {/* Tooltip for expanded skill (HTML overlay for better text rendering) */}
      {expandedSkill && (() => {
        const idx = skills.indexOf(expandedSkill);
        const pos = nodePositions[idx];
        if (!pos) return null;
        const info = SKILL_CATALOG[expandedSkill] || { description: "Custom skill", category: "operations" };

        return (
          <div
            className="skills-graph__tooltip"
            style={{
              position: "absolute",
              left: `${pos.x}px`,
              top: `${pos.y + 32}px`,
              transform: "translateX(-50%)",
              background: "rgba(15, 18, 30, 0.95)",
              border: `1px solid ${color}40`,
              borderRadius: "10px",
              padding: "10px 14px",
              maxWidth: "220px",
              pointerEvents: "none",
              zIndex: 10,
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{
              color: "#E0E0E0",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "Inter, -apple-system, sans-serif",
              marginBottom: "4px",
            }}>
              {expandedSkill}
            </div>
            <div style={{
              color: "#999",
              fontSize: "10px",
              fontFamily: "Inter, -apple-system, sans-serif",
              lineHeight: 1.4,
            }}>
              {info.description}
            </div>
            <div style={{
              marginTop: "6px",
              display: "inline-block",
              background: `${CATEGORY_COLORS[info.category] || color}20`,
              color: CATEGORY_COLORS[info.category] || color,
              fontSize: "9px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "6px",
              fontFamily: "Inter, -apple-system, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              {info.category}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export { SKILL_CATALOG, FALLBACK_SKILLS };
