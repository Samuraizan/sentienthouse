import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useAgentStore from "../store/agentStore";
import { ZONE_POSITIONS, ZONE_HOME_OFFSETS } from "./Zones";

/**
 * AgentConnections.jsx — Visual lines connecting agents during meetings
 *
 * Uses homeZone + ZONE_HOME_OFFSETS for position lookups.
 */

const PLATFORM_Y_OFFSET = 0.12;

function getAgentPosition(agent) {
  if (!agent) return null;
  const homeZoneKey = agent.homeZone === "nomad" ? "hq" : agent.homeZone;
  const zone = ZONE_POSITIONS[homeZoneKey];
  if (!zone) return null;
  const offset = ZONE_HOME_OFFSETS[agent.id] || [0, 0, 0];
  return [
    zone.position[0] + offset[0],
    zone.position[1] + PLATFORM_Y_OFFSET + 3,
    zone.position[2] + offset[2],
  ];
}

function ConnectionBeam({ fromPos, toPos, color = "#44ffaa" }) {
  const lineRef = useRef();

  const points = useMemo(() => {
    const from = new THREE.Vector3(...fromPos);
    const to = new THREE.Vector3(...toPos);
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 3;
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    return curve.getPoints(32);
  }, [fromPos, toPos]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    geo.computeBoundingSphere();
    return geo;
  }, [points]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = 0.6 + Math.sin(t * 3) * 0.2;
    }
  });

  return (
    <group>
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.7}
        />
      </line>
      <mesh position={fromPos}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <mesh position={toPos}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export default function AgentConnections() {
  const agentVisits = useAgentStore((s) => s.agentVisits);
  const agents = useAgentStore((s) => s.agents);

  const connections = useMemo(() => {
    const conns = [];
    const processed = new Set();

    Object.entries(agentVisits).forEach(([agentId, visit]) => {
      if (!visit?.meetingWith) return;

      const key = [agentId, visit.meetingWith].sort().join("-");
      if (processed.has(key)) return;
      processed.add(key);

      const fromAgent = agents.find(a => a.id === agentId);
      const toAgent = agents.find(a => a.id === visit.meetingWith);
      const fromPos = getAgentPosition(fromAgent);
      const toPos = getAgentPosition(toAgent);
      if (!fromPos || !toPos) return;

      const color = fromAgent?.color || "#44ffaa";

      conns.push({ id: key, fromPos, toPos, color });
    });

    return conns;
  }, [agentVisits, agents]);

  if (connections.length === 0) return null;

  return (
    <group>
      {connections.map((conn) => (
        <ConnectionBeam
          key={conn.id}
          fromPos={conn.fromPos}
          toPos={conn.toPos}
          color={conn.color}
        />
      ))}
    </group>
  );
}
