import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useAgentStore from "../store/agentStore";
import { ZONE_POSITIONS } from "./Zones";

/**
 * Effects.jsx — Atmospheric visual effects for the Zo House 3D Command Center.
 *
 * 3-zone layout: connection lines from HQ to 2 houses, zone glows for 3 zones,
 * warm-toned particles and ambient orbs.
 */

// HQ and house zones for connection lines
const HQ_POSITION = ZONE_POSITIONS.hq.position;
const HOUSE_ZONES = [
  { key: "blrxzo-house", position: ZONE_POSITIONS["blrxzo-house"].position, color: ZONE_POSITIONS["blrxzo-house"].color },
  { key: "wtfxzo-house", position: ZONE_POSITIONS["wtfxzo-house"].position, color: ZONE_POSITIONS["wtfxzo-house"].color },
];

// 1. FLOATING PARTICLES — reduced count, warm palette

const PARTICLE_COUNT = 80;
const PARTICLE_SPREAD = 30;
const PARTICLE_HEIGHT = 18;
const PARTICLE_BASE_Y = -1;

function FloatingParticles() {
  const pointsRef = useRef();

  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);

    const warmColors = [
      new THREE.Color("#ff9966"),
      new THREE.Color("#ffcc88"),
      new THREE.Color("#ffddaa"),
      new THREE.Color("#ff7744"),
      new THREE.Color("#ffe0c0"),
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * PARTICLE_SPREAD;
      pos[i3] = Math.cos(angle) * r;
      pos[i3 + 1] = PARTICLE_BASE_Y + Math.random() * PARTICLE_HEIGHT;
      pos[i3 + 2] = Math.sin(angle) * r;

      vel[i3] = (Math.random() - 0.5) * 0.003;
      vel[i3 + 1] = 0.005 + Math.random() * 0.015;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.003;

      const c = warmColors[Math.floor(Math.random() * warmColors.length)].clone();
      c.lerp(new THREE.Color("#ffffff"), 0.2);
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }

    return { positions: pos, velocities: vel, colors: col };
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArr = posAttr.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      posArr[i3] += velocities[i3];
      posArr[i3 + 1] += velocities[i3 + 1];
      posArr[i3 + 2] += velocities[i3 + 2];

      if (posArr[i3 + 1] > PARTICLE_HEIGHT) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * PARTICLE_SPREAD;
        posArr[i3] = Math.cos(angle) * r;
        posArr[i3 + 1] = PARTICLE_BASE_Y + Math.random() * 2;
        posArr[i3 + 2] = Math.sin(angle) * r;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// 2. CONNECTION LINES — HQ to each house zone (2 lines)

function ConnectionLine({ origin, target, isActive }) {
  const lineRef = useRef();
  const dotRef = useRef();

  const warmOrange = useMemo(() => new THREE.Color("#ff8855"), []);
  const brightOrange = useMemo(() => new THREE.Color("#ffaa77"), []);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const lineY = 0.4;
    const points = [
      new THREE.Vector3(origin[0], lineY, origin[2]),
      new THREE.Vector3(target[0], lineY, target[2]),
    ];
    geo.setFromPoints(points);
    return geo;
  }, [origin, target]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (lineRef.current) {
      const baseOpacity = isActive ? 0.15 : 0.06;
      const pulse = Math.sin(t * 1.5) * 0.04;
      lineRef.current.opacity = baseOpacity + pulse;
    }

    if (dotRef.current) {
      const speed = isActive ? 0.6 : 0.3;
      const raw = (t * speed) % 2;
      const progress = raw <= 1 ? raw : 2 - raw;

      dotRef.current.position.x = origin[0] + (target[0] - origin[0]) * progress;
      dotRef.current.position.z = origin[2] + (target[2] - origin[2]) * progress;
      dotRef.current.position.y = 0.5;

      const dotOpacity = isActive ? 0.5 : 0.2;
      dotRef.current.material.opacity = dotOpacity * (0.6 + 0.4 * Math.sin(t * 4));
    }
  });

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial
          ref={lineRef}
          color={isActive ? brightOrange : warmOrange}
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </line>

      <mesh ref={dotRef} position={[origin[0], 0.5, origin[2]]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial
          color={brightOrange}
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function ConnectionLines() {
  const agents = useAgentStore((state) => state.agents);

  const lines = useMemo(() => {
    return HOUSE_ZONES.map((hz) => {
      // Check if any agent in this house zone is active
      const houseAgents = agents.filter((a) => {
        const home = a.homeZone === "nomad" ? "hq" : a.homeZone;
        return home === hz.key;
      });
      const isActive = houseAgents.some(
        (a) => a.status === "active" || a.status === "online"
      );
      return {
        key: hz.key,
        origin: HQ_POSITION,
        target: hz.position,
        color: hz.color,
        isActive,
      };
    });
  }, [agents]);

  return (
    <group>
      {lines.map((line) => (
        <ConnectionLine
          key={line.key}
          origin={line.origin}
          target={line.target}
          isActive={line.isActive}
        />
      ))}
    </group>
  );
}

// 3. ZONE GLOW HALOS — 3 zones

function ZoneGlow({ position, color, isActive }) {
  const meshRef = useRef();
  const warmColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.lerp(new THREE.Color("#ff8855"), 0.4);
    return c;
  }, [color]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const baseOpacity = isActive ? 0.08 : 0.03;
    const pulse = Math.sin(t * 0.8) * 0.02;
    meshRef.current.material.opacity = baseOpacity + pulse;
  });

  return (
    <mesh
      ref={meshRef}
      position={[position[0], 0.04, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[8, 32]} />
      <meshBasicMaterial
        color={warmColor}
        transparent
        opacity={0.05}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ZoneGlowHalos() {
  const agents = useAgentStore((state) => state.agents);

  const halos = useMemo(() => {
    return Object.entries(ZONE_POSITIONS).map(([zoneKey, zone]) => {
      // Check if any agent in this zone is active
      const residents = agents.filter((a) => {
        const home = a.homeZone === "nomad" ? "hq" : a.homeZone;
        return home === zoneKey;
      });
      const isActive = residents.some(
        (a) => a.status === "active" || a.status === "online"
      );
      return {
        key: zoneKey,
        position: zone.position,
        color: zone.color,
        isActive,
      };
    });
  }, [agents]);

  return (
    <group>
      {halos.map((h) => (
        <ZoneGlow
          key={h.key}
          position={h.position}
          color={h.color}
          isActive={h.isActive}
        />
      ))}
    </group>
  );
}

// 4. AMBIENT FLOATING ORBS — warm tones, wider orbit

const ORB_CONFIG = [
  { color: "#ffaa44", radius: 18,  height: 7,  speed: 0.1,  phase: 0 },
  { color: "#ff8866", radius: 24, height: 10, speed: 0.07, phase: Math.PI },
];

function FloatingOrb({ color, radius, height, speed, phase }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const brightColor = useMemo(
    () => new THREE.Color(color).multiplyScalar(1.3),
    [color]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const angle = t * speed + phase;

    if (meshRef.current) {
      meshRef.current.position.x = Math.cos(angle) * radius;
      meshRef.current.position.z = Math.sin(angle) * radius;
      meshRef.current.position.y = height + Math.sin(t * 0.5 + phase) * 1.5;
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.1 + Math.sin(t * 2 + phase) * 0.05;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color={threeColor}
          emissive={brightColor}
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshBasicMaterial
          color={threeColor}
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <pointLight
        color={color}
        intensity={0.2}
        distance={4}
        decay={2}
      />
    </group>
  );
}

function AmbientOrbs() {
  return (
    <group>
      {ORB_CONFIG.map((cfg, idx) => (
        <FloatingOrb key={idx} {...cfg} />
      ))}
    </group>
  );
}

// MAIN EFFECTS COMPONENT

export default function Effects() {
  return (
    <group>
      <FloatingParticles />
      <ConnectionLines />
      <ZoneGlowHalos />
      <AmbientOrbs />
    </group>
  );
}
