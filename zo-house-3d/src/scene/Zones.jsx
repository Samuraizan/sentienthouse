import { useMemo } from "react";
import useAgentStore from "../store/agentStore";
import ZonePlatform from "./ZonePlatform";

/**
 * Zones.jsx — 3-zone layout for the Zo House 3D Command Center.
 *
 * Layout:
 *   [BLRxZo House]      [Interdimensional HQ]      [WTFxZo House]
 *    [-55, 0, 0]             [0, 0, 0]               [55, 0, 0]
 *      42x42                  60x60                     42x42
 */

/**
 * ZONE_POSITIONS — 3 zones: HQ center, BLRxZo House left, WTFxZo House right.
 * Each entry: { position: [x, y, z], size: [w, d], color, label }
 */
export const ZONE_POSITIONS = {
  hq: {
    position: [0, 0, 0],
    size: [116, 100], // 2x island footprint — equipment stays centered
    color: "#FFD700",
    label: "Interdimensional HQ",
  },
  "blrxzo-house": {
    position: [-91, 0, 0], // Aligned to left satellite island center
    size: [55, 40],
    color: "#00BFFF",
    label: "BLRxZo House",
  },
  "wtfxzo-house": {
    position: [91, 0, 0], // Aligned to right satellite island center
    size: [55, 40],
    color: "#FF6347",
    label: "WTFxZo House",
  },
};

/**
 * ZONE_HOME_OFFSETS — per-agent position offsets within their home zone.
 * Prevents agents from stacking on top of each other.
 */
export const ZONE_HOME_OFFSETS = {
  // HQ agents: spread around 2x island (equipment occupies center X[-31,30] Z[-26,15])
  zomadprime: [0, 0, 30],     // front center — commanding view
  suki: [-22, 0, 26],         // front-left quadrant
  wanda: [22, 0, 26],         // front-right quadrant
  yana: [-28, 0, 0],          // left flank of equipment
  loki: [28, 0, 0],           // right flank of equipment
  // Satellite agents: front of their islands (unchanged)
  "blrxzo-jr": [0, 0, 8],
  "wtfxzo-jr": [0, 0, 8],
};

/**
 * Zone labels for display.
 */
const ZONE_LABELS = {
  hq: "Interdimensional HQ",
  "blrxzo-house": "BLRxZo House",
  "wtfxzo-house": "WTFxZo House",
};

export default function Zones() {
  const agents = useAgentStore((state) => state.agents);
  const openSkillTree = useAgentStore((state) => state.openSkillTree);

  // Derive zone status from most active resident agent
  const zones = useMemo(() => {
    return Object.entries(ZONE_POSITIONS).map(([zoneKey, zone]) => {
      // Find agents whose homeZone matches this zone (nomad defaults to hq)
      const residents = agents.filter((a) => {
        const home = a.homeZone === "nomad" ? "hq" : a.homeZone;
        return home === zoneKey;
      });

      // Pick the most active status among residents
      const statusPriority = ["active", "online", "idle", "standby", "dormant", "offline"];
      let bestStatus = "offline";
      let primaryAgentId = residents[0]?.id || null;

      for (const agent of residents) {
        if (statusPriority.indexOf(agent.status) < statusPriority.indexOf(bestStatus)) {
          bestStatus = agent.status;
          primaryAgentId = agent.id;
        }
      }

      return {
        zoneKey,
        label: zone.label,
        color: zone.color,
        status: bestStatus,
        position: zone.position,
        size: zone.size,
        agentId: primaryAgentId,
        name: ZONE_LABELS[zoneKey],
        role: zone.label,
      };
    });
  }, [agents]);

  const handleClick = (agentId) => {
    if (agentId) openSkillTree(agentId);
  };

  return (
    <group>
      {zones.map((zone) => (
        <ZonePlatform
          key={zone.zoneKey}
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
