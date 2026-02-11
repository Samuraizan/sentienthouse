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
  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);
  const setSelectedAgent = useAgentStore((state) => state.setSelectedAgent);

  const handleSelect = useCallback(
    (agentId) => {
      if (selectedAgentId === agentId) {
        setSelectedAgent(null);
      } else {
        setSelectedAgent(agentId);
      }
    },
    [selectedAgentId, setSelectedAgent]
  );

  const characters = useMemo(() => {
    return agents
      .map((agent) => {
        const config = CHARACTER_CONFIG[agent.id];
        if (!config) return null;

        const zone = ZONE_POSITIONS[agent.role];
        if (!zone) return null;

        const position = [
          zone.position[0],
          zone.position[1] + PLATFORM_Y_OFFSET,
          zone.position[2],
        ];

        return {
          agentId: agent.id,
          modelPath: config.model,
          position,
          color: config.tint,
          status: agent.status,
          agentColor: agent.color,
          agentName: agent.name,
          agentRole: zone.label,
        };
      })
      .filter(Boolean);
  }, [agents]);

  return (
    <group>
      {characters.map((char) => (
        <AgentCharacter
          key={char.agentId}
          agentId={char.agentId}
          agentName={char.agentName}
          agentRole={char.agentRole}
          modelPath={char.modelPath}
          position={char.position}
          color={char.color}
          status={char.status}
          agentColor={char.agentColor}
          isSelected={selectedAgentId === char.agentId}
          onSelect={handleSelect}
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
