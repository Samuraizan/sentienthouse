import { useMemo, useCallback } from "react";
import { useGLTF } from "@react-three/drei";
import useAgentStore from "../store/agentStore";
import AgentCharacter from "./AgentCharacter";
import { ZONE_POSITIONS, ZONE_HOME_OFFSETS } from "./Zones";

/**
 * AgentCharacters.jsx — Container that renders all 7 animated character models
 * placed within their home zones using per-agent offsets.
 *
 * Uses homeZone from agentStore + ZONE_HOME_OFFSETS from Zones.jsx
 * so multiple agents in the same zone don't overlap.
 */

const CHARACTER_CONFIG = {
  zomadprime:   { model: "/models/characters/zomadprime-pirate.glb",  tint: null, scale: 9.0 },   // Captain Barbarossa
  "blrxzo-jr":  { model: "/models/characters/blrxzo-jr-pirate.glb",  tint: null, scale: 7.5 },   // Henry
  "wtfxzo-jr":  { model: "/models/characters/wtfxzo-jr-pirate.glb",  tint: null, scale: 7.5 },   // Skeleton
  suki:         { model: "/models/characters/suki-pirate.glb",        tint: null, scale: 7.5 },   // Anne
  loki:         { model: "/models/characters/loki.glb",               tint: null },                // (unchanged, default 2.5)
  wanda:        { model: "/models/characters/wanda-pirate.glb",       tint: null, scale: 7.5 },   // Mako
  yana:         { model: "/models/characters/yana-pirate.glb",        tint: null, scale: 7.5 },   // Sharky
};

const PLATFORM_Y_OFFSET = 0.12;

export default function AgentCharacters() {
  const agents = useAgentStore((state) => state.agents);
  const skillTreeAgentId = useAgentStore((state) => state.skillTreeAgentId);
  const openSkillTree = useAgentStore((state) => state.openSkillTree);
  const closeSkillTree = useAgentStore((state) => state.closeSkillTree);

  const handleSelect = useCallback(
    (agentId) => {
      if (skillTreeAgentId === agentId) {
        closeSkillTree();
      } else {
        openSkillTree(agentId);
      }
    },
    [skillTreeAgentId, openSkillTree, closeSkillTree]
  );

  const { characters, allAgentPositions } = useMemo(() => {
    const charList = [];
    const positionsMap = {};

    agents.forEach((agent) => {
      const config = CHARACTER_CONFIG[agent.id];
      if (!config) return;

      // Resolve home zone — nomad defaults to hq
      const homeZoneKey = agent.homeZone === "nomad" ? "hq" : agent.homeZone;
      const zone = ZONE_POSITIONS[homeZoneKey];
      if (!zone) return;

      // Apply per-agent offset within the zone
      const offset = ZONE_HOME_OFFSETS[agent.id] || [0, 0, 0];
      const position = [
        zone.position[0] + offset[0],
        zone.position[1] + PLATFORM_Y_OFFSET,
        zone.position[2] + offset[2],
      ];

      positionsMap[agent.id] = {
        position,
        zoneSize: zone.size,
        zoneKey: homeZoneKey,
        zoneCenter: zone.position,
      };

      charList.push({
        agentId: agent.id,
        modelPath: config.model,
        position,
        zoneSize: zone.size,
        zoneKey: homeZoneKey,
        zoneCenter: zone.position,
        color: config.tint,
        status: agent.status,
        agentColor: agent.color,
        agentName: agent.name,
        agentRoleLabel: zone.label,
        agentRole: agent.role,
        agentHomeZone: agent.homeZone,
        currentTask: agent.currentTask,
        characterScale: config.scale || 2.5,
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
          agentHomeZone={char.agentHomeZone}
          modelPath={char.modelPath}
          position={char.position}
          zoneSize={char.zoneSize}
          zoneKey={char.zoneKey}
          zoneCenter={char.zoneCenter}
          color={char.color}
          status={char.status}
          agentColor={char.agentColor}
          isSelected={skillTreeAgentId === char.agentId}
          onSelect={handleSelect}
          allAgentPositions={allAgentPositions}
          currentTask={char.currentTask}
          characterScale={char.characterScale}
        />
      ))}
    </group>
  );
}

Object.values(CHARACTER_CONFIG).forEach(({ model }) => {
  useGLTF.preload(model);
});
