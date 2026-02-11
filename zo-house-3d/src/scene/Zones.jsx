import { useMemo } from "react";
import useAgentStore from "../store/agentStore";
import ZonePlatform from "./ZonePlatform";

/**
 * Zones.jsx — Department-based zone layout for the Zo House 3D Command Center.
 *
 * Replaces the old hexagonal ring with an isometric grid of rectangular
 * department zones. Each zone is a raised rectangular floor plate with
 * an outlined border and department label.
 *
 * Layout:
 *                     [HQ - ZomadPrime]
 *                     (center, largest)
 *
 *     [BLRxZo]                            [WTFxZo]
 *     (left)                              (right)
 *
 *          [Events - Suki]         [Sales - Wanda]
 *          (front-left)            (front-right)
 *
 *               [BD - Yana]    [Vibe - Loki]
 *               (back-left)   (back-right)
 */

/**
 * ZONE_POSITIONS — exported so other components (AgentCharacters, ChatBubbles,
 * Effects, CameraController) can reference the same positions.
 *
 * Each entry: { position: [x, y, z], size: [w, d], color, label, role }
 */
export const ZONE_POSITIONS = {
  director: {
    position: [0, 0, 0],
    size: [14, 14],  // Expanded for movement
    color: "#FFD700",
    label: "HQ",
    role: "director",
  },
  "captain-blrxzo": {
    position: [-28, 0, -4],
    size: [12, 12],  // Expanded for movement
    color: "#00BFFF",
    label: "BLRxZo",
    role: "captain-blrxzo",
  },
  "captain-wtfxzo": {
    position: [28, 0, -4],
    size: [12, 12],  // Expanded for movement
    color: "#FF6347",
    label: "WTFxZo",
    role: "captain-wtfxzo",
  },
  events: {
    position: [-18, 0, 24],
    size: [11, 11],  // Expanded for movement
    color: "#FF69B4",
    label: "Events",
    role: "events",
  },
  sales: {
    position: [18, 0, 24],
    size: [11, 11],  // Expanded for movement
    color: "#2ECC71",
    label: "Sales",
    role: "sales",
  },
  bd: {
    position: [-20, 0, -26],
    size: [11, 11],  // Expanded for movement
    color: "#E67E22",
    label: "Business Dev",
    role: "bd",
  },
  "vibe-curator": {
    position: [20, 0, -26],
    size: [11, 11],  // Expanded for movement
    color: "#9B59B6",
    label: "Vibe",
    role: "vibe-curator",
  },
};

/**
 * Friendly role label for display under the zone label.
 */
const ROLE_LABELS = {
  director: "Director",
  bd: "Business Dev",
  sales: "Sales",
  events: "Events",
  "vibe-curator": "Vibe Curator",
  "captain-blrxzo": "Captain BLRxZo",
  "captain-wtfxzo": "Captain WTFxZo",
};

export default function Zones() {
  const agents = useAgentStore((state) => state.agents);
  const openSkillTree = useAgentStore((state) => state.openSkillTree);

  const zones = useMemo(() => {
    return agents
      .map((agent) => {
        const zone = ZONE_POSITIONS[agent.role];
        if (!zone) return null;

        return {
          agentId: agent.id,
          name: agent.name,
          role: ROLE_LABELS[agent.role] || agent.role,
          color: zone.color,
          status: agent.status,
          position: zone.position,
          size: zone.size,
          label: zone.label,
        };
      })
      .filter(Boolean);
  }, [agents]);

  const handleClick = (agentId) => {
    openSkillTree(agentId);
  };

  return (
    <group>
      {zones.map((zone) => (
        <ZonePlatform
          key={zone.agentId}
          position={zone.position}
          size={zone.size}
          agentId={zone.agentId}
          color={zone.color}
          name={zone.name}
          role={zone.role}
          label={zone.label}
          status={zone.status}
          onClick={handleClick}
        />
      ))}
    </group>
  );
}
