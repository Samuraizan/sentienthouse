import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useAgentStore from "../store/agentStore";
import { ZONE_POSITIONS, ZONE_HOME_OFFSETS } from "./Zones";
import { getAgentWorldPosition } from "./positionRegistry";

/**
 * AgentConnections.jsx — Visual lines connecting agents during meetings
 *
 * Uses live position registry, falls back to homeZone + offset.
 */

const PLATFORM_Y_OFFSET = 0.12;

function getAgentPosition(agent) {
  if (!agent) return null;
  // Live position from registry (tracks walking agents)
  const live = getAgentWorldPosition(agent.id);
  if (live) return [live[0], live[1] + 3, live[2]];
  // Fallback to static home position
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

function ConnectionBeam({ fromAgentId, toAgentId, fromPos, toPos, color = "#44ffaa" }) {
  const lineRef = useRef();
  const fromSphereRef = useRef();
  const toSphereRef = useRef();
  const geometryRef = useRef(new THREE.BufferGeometry());

  // Initial geometry
  useMemo(() => {
    const from = new THREE.Vector3(...fromPos);
    const to = new THREE.Vector3(...toPos);
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 3;
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    geometryRef.current.setFromPoints(curve.getPoints(32));
    geometryRef.current.computeBoundingSphere();
  }, []); // eslint-disable-line

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = 0.6 + Math.sin(t * 3) * 0.2;
    }

    // Update beam to track live agent positions
    const liveFrom = getAgentWorldPosition(fromAgentId);
    const liveTo = getAgentWorldPosition(toAgentId);
    const fPos = liveFrom || fromPos;
    const tPos = liveTo || toPos;

    const from = new THREE.Vector3(fPos[0], fPos[1] + 3, fPos[2]);
    const to = new THREE.Vector3(tPos[0], tPos[1] + 3, tPos[2]);
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 3;
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    geometryRef.current.setFromPoints(curve.getPoints(32));
    geometryRef.current.computeBoundingSphere();

    if (fromSphereRef.current) {
      fromSphereRef.current.position.set(from.x, from.y, from.z);
    }
    if (toSphereRef.current) {
      toSphereRef.current.position.set(to.x, to.y, to.z);
    }
  });

  return (
    <group>
      <line ref={lineRef} geometry={geometryRef.current}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.7}
        />
      </line>
      <mesh ref={fromSphereRef} position={fromPos}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <mesh ref={toSphereRef} position={toPos}>
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

      conns.push({ id: key, fromAgentId: agentId, toAgentId: visit.meetingWith, fromPos, toPos, color });
    });

    return conns;
  }, [agentVisits, agents]);

  if (connections.length === 0) return null;

  return (
    <group>
      {connections.map((conn) => (
        <ConnectionBeam
          key={conn.id}
          fromAgentId={conn.fromAgentId}
          toAgentId={conn.toAgentId}
          fromPos={conn.fromPos}
          toPos={conn.toPos}
          color={conn.color}
        />
      ))}
    </group>
  );
}
