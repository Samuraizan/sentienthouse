import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useAgentStore from "../store/agentStore";
import { ZONE_POSITIONS } from "./Zones";

/**
 * AgentConnections.jsx — Visual lines connecting agents during meetings
 * 
 * Renders glowing connection beams between agents who are currently
 * visiting each other, making collaboration visible in the 3D scene.
 */

const AGENT_ROLES = {
  zomadprime: "director",
  "blrxzo-jr": "captain-blrxzo",
  "wtfxzo-jr": "captain-wtfxzo",
  suki: "events",
  loki: "vibe-curator",
  wanda: "sales",
  yana: "bd",
};

const PLATFORM_Y_OFFSET = 0.12;

function getAgentPosition(agentId) {
  const role = AGENT_ROLES[agentId];
  if (!role) return null;
  const zone = ZONE_POSITIONS[role];
  if (!zone) return null;
  return [
    zone.position[0],
    zone.position[1] + PLATFORM_Y_OFFSET + 3, // At agent head height
    zone.position[2],
  ];
}

function ConnectionBeam({ fromPos, toPos, color = "#44ffaa" }) {
  const lineRef = useRef();
  const glowRef = useRef();

  const points = useMemo(() => {
    const from = new THREE.Vector3(...fromPos);
    const to = new THREE.Vector3(...toPos);
    
    // Create curved path with midpoint arc
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 3; // Arc upward
    
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
      {/* Main connection line */}
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.7}
        />
      </line>
      
      {/* Glow effect at endpoints */}
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

  // Build list of active connections
  const connections = useMemo(() => {
    const conns = [];
    const processed = new Set();

    Object.entries(agentVisits).forEach(([agentId, visit]) => {
      if (!visit?.meetingWith) return;
      
      // Avoid duplicate connections
      const key = [agentId, visit.meetingWith].sort().join("-");
      if (processed.has(key)) return;
      processed.add(key);

      const fromPos = getAgentPosition(agentId);
      const toPos = getAgentPosition(visit.meetingWith);
      if (!fromPos || !toPos) return;

      // Get agent color for the beam
      const agent = agents.find(a => a.id === agentId);
      const color = agent?.color || "#44ffaa";

      conns.push({
        id: key,
        fromPos,
        toPos,
        color,
      });
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
