import { useMemo, useCallback } from "react";
import { useGLTF } from "@react-three/drei";
import useAgentStore from "../store/agentStore";
import AgentCharacter from "./AgentCharacter";
import { ZONE_POSITIONS } from "./Zones";

/**
 * AgentCharacters.jsx — Container that renders all 7 animated character models
 * standing at the center of their respective department zones.
 *
 * Uses ZONE_POSITIONS from Zones.jsx so characters stand centered in their
 * rectangular zone platforms. Each character faces the HQ center.
 */

/**
 * Map agent IDs to their GLB model paths and optional tint colors.
 */
const CHARACTER_CONFIG = {
  zomadprime:   { model: "/models/characters/zomadprime.glb",  tint: null },
  "blrxzo-jr":  { model: "/models/characters/blrxzo-jr.glb",  tint: null },
  "wtfxzo-jr":  { model: "/models/characters/wtfxzo-jr.glb",  tint: null },
  suki:         { model: "/models/characters/suki.glb",        tint: null },
  loki:         { model: "/models/characters/loki.glb",        tint: null },
  wanda:        { model: "/models/characters/wanda.glb",       tint: "#ff8866" },
  yana:         { model: "/models/characters/yana.glb",        tint: "#ff88cc" },
};

/**
 * Y offset to place character on top of the zone platform.
 * Platform surface is at ~y=0.1, so offset character slightly above.
 */
const PLATFORM_Y_OFFSET = 0.12;

export default function AgentCharacters() {
  const agents = useAgentStore((state) => state.agents);
  const skillTreeAgentId = useAgentStore((state) => state.skillTreeAgentId);
  const openSkillTree = useAgentStore((state) => state.openSkillTree);
  const closeSkillTree = useAgentStore((state) => state.closeSkillTree);

  const handleSelect = useCallback(
    (agentId) => {
      // Toggle: if already open for this agent, close it; otherwise open
      if (skillTreeAgentId === agentId) {
        closeSkillTree();
      } else {
        openSkillTree(agentId);
      }
    },
    [skillTreeAgentId, openSkillTree, closeSkillTree]
  );

  // Build character data and positions map for inter-agent visits
  const { characters, allAgentPositions } = useMemo(() => {
    const charList = [];
    const positionsMap = {};

    agents.forEach((agent) => {
      const config = CHARACTER_CONFIG[agent.id];
      if (!config) return;

      const zone = ZONE_POSITIONS[agent.role];
      if (!zone) return;

      const position = [
        zone.position[0],
        zone.position[1] + PLATFORM_Y_OFFSET,
        zone.position[2],
      ];

      // Store position for inter-agent visits
      positionsMap[agent.id] = {
        position,
        zoneSize: zone.size,
      };

      charList.push({
        agentId: agent.id,
        modelPath: config.model,
        position,
        zoneSize: zone.size,
        color: config.tint,
        status: agent.status,
        agentColor: agent.color,
        agentName: agent.name,
        agentRoleLabel: zone.label,
        agentRole: agent.role, // Pass role key for interaction lookups
        currentTask: agent.currentTask,
      });
    });

    return { characters: charList, allAgentPositions: positionsMap };
  }, [agents]);

  return (
    <group>
      {characters.map((char) => (
        <AgentCharacter
          key={char.agentId}
          agentId={char.agentId}
          agentName={char.agentName}
          agentRole={char.agentRole}
          agentRoleLabel={char.agentRoleLabel}
          modelPath={char.modelPath}
          position={char.position}
          zoneSize={char.zoneSize}
          color={char.color}
          status={char.status}
          agentColor={char.agentColor}
          isSelected={skillTreeAgentId === char.agentId}
          onSelect={handleSelect}
          allAgentPositions={allAgentPositions}
          currentTask={char.currentTask}
        />
      ))}
    </group>
  );
}

/**
 * Preload all GLB models.
 */
Object.values(CHARACTER_CONFIG).forEach(({ model }) => {
  useGLTF.preload(model);
});
