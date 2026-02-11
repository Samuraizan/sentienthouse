import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * ZonePlatform.jsx — Rectangular department zone for the Zo House 3D Command Center.
 *
 * Clean rectangular floor plate with thin orange outline border,
 * department name label floating above using Html billboard,
 * and subtle fill color. Inspired by Ralv.ai style — minimal, warm outlines.
 *
 * Props:
 *   position  — [x, y, z] world position of the zone center
 *   size      — [width, depth] of the rectangular zone
 *   agentId   — unique agent identifier
 *   color     — hex color for the zone accent
 *   name      — agent display name
 *   role      — agent role label
 *   label     — department zone label (e.g. "HQ", "Events")
 *   status    — agent status (active|idle|online|dormant|standby|offline)
 *   onClick   — callback(agentId)
 */

const STATUS_GLOW_INTENSITY = {
  active: 1.0,
  online: 0.7,
  idle: 0.4,
  standby: 0.25,
  dormant: 0.15,
  offline: 0.08,
};

const STATUS_PULSE_SPEED = {
  active: 3.0,
  online: 2.0,
  idle: 0.8,
  standby: 0.5,
  dormant: 0.3,
  offline: 0.2,
};

export default function ZonePlatform({
  position = [0, 0, 0],
  size = [6, 6],
  agentId,
  color = "#ff7744",
  name = "Agent",
  role = "role",
  label = "Zone",
  status = "offline",
  onClick,
}) {
  const groupRef = useRef();
  const borderRef = useRef();
  const fillRef = useRef();

  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const borderColor = useMemo(() => new THREE.Color("#ff7744"), []);

  const glowIntensity = STATUS_GLOW_INTENSITY[status] || STATUS_GLOW_INTENSITY.offline;
  const pulseSpeed = STATUS_PULSE_SPEED[status] || STATUS_PULSE_SPEED.offline;

  // Build border outline geometry — 4 line segments forming a rectangle
  const borderGeometry = useMemo(() => {
    const hw = size[0] / 2;
    const hd = size[1] / 2;
    const y = 0.12;
    const points = [
      new THREE.Vector3(-hw, y, -hd),
      new THREE.Vector3(hw, y, -hd),
      new THREE.Vector3(hw, y, hd),
      new THREE.Vector3(-hw, y, hd),
      new THREE.Vector3(-hw, y, -hd), // close the loop
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [size]);

  // Corner accent geometry — small L-shapes at each corner
  const cornerGeometries = useMemo(() => {
    const hw = size[0] / 2;
    const hd = size[1] / 2;
    const y = 0.13;
    const len = 0.6; // corner accent length

    const corners = [
      // top-left
      [
        new THREE.Vector3(-hw, y, -hd),
        new THREE.Vector3(-hw + len, y, -hd),
        new THREE.Vector3(-hw, y, -hd),
        new THREE.Vector3(-hw, y, -hd + len),
      ],
      // top-right
      [
        new THREE.Vector3(hw, y, -hd),
        new THREE.Vector3(hw - len, y, -hd),
        new THREE.Vector3(hw, y, -hd),
        new THREE.Vector3(hw, y, -hd + len),
      ],
      // bottom-left
      [
        new THREE.Vector3(-hw, y, hd),
        new THREE.Vector3(-hw + len, y, hd),
        new THREE.Vector3(-hw, y, hd),
        new THREE.Vector3(-hw, y, hd - len),
      ],
      // bottom-right
      [
        new THREE.Vector3(hw, y, hd),
        new THREE.Vector3(hw - len, y, hd),
        new THREE.Vector3(hw, y, hd),
        new THREE.Vector3(hw, y, hd - len),
      ],
    ];

    return corners.map((pts) => {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      return geo;
    });
  }, [size]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pulse = 0.5 + 0.5 * Math.sin(t * pulseSpeed);

    // Animate border opacity based on status
    if (borderRef.current) {
      const baseOpacity = 0.3 + glowIntensity * 0.5;
      borderRef.current.opacity = baseOpacity + pulse * 0.15;
    }

    // Animate fill opacity
    if (fillRef.current) {
      const baseFill = 0.03 + glowIntensity * 0.05;
      fillRef.current.opacity = baseFill + pulse * 0.02;
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick(agentId);
  };

  const isActive = status === "active" || status === "online";

  return (
    <group ref={groupRef} position={position} onClick={handleClick}>
      {/* Raised rectangular floor plate */}
      <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0], size[1]]} />
        <meshStandardMaterial
          ref={fillRef}
          color={threeColor}
          transparent
          opacity={0.06}
          roughness={0.8}
          metalness={0.2}
          emissive={threeColor}
          emissiveIntensity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Slightly raised border fill — gives depth to the platform */}
      <mesh receiveShadow position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0] - 0.1, size[1] - 0.1]} />
        <meshStandardMaterial
          color="#1e1c24"
          roughness={0.7}
          metalness={0.3}
          emissive={threeColor}
          emissiveIntensity={0.03}
        />
      </mesh>

      {/* Thin outline border — warm orange */}
      <line geometry={borderGeometry}>
        <lineBasicMaterial
          ref={borderRef}
          color={isActive ? color : "#ff7744"}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </line>

      {/* Corner accents — brighter, thicker feel */}
      {cornerGeometries.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </line>
      ))}

      {/* Department zone label — floating above using Html billboard */}
      <Html
        position={[0, 0.5, 0]}
        center
        distanceFactor={20}
        occlude={false}
        style={{ pointerEvents: "none", userSelect: "none" }}
        zIndexRange={[40, 0]}
      >
        <div style={{
          fontFamily: "Inter, SF Pro Display, -apple-system, sans-serif",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}>
          <div style={{
            fontSize: "14px",
            fontWeight: 700,
            color: color,
            textTransform: "uppercase",
            letterSpacing: "2px",
            textShadow: "0 0 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)",
            opacity: 0.9,
          }}>
            {label}
          </div>
        </div>
      </Html>

      {/* Status indicator — small dot at front of zone */}
      <mesh position={[0, 0.2, size[1] / 2 - 0.3]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial
          color={isActive ? "#22ff66" : status === "idle" ? "#ffcc22" : "#555555"}
          emissive={isActive ? new THREE.Color("#22ff66") : new THREE.Color("#333333")}
          emissiveIntensity={isActive ? 1.5 : 0.3}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* Subtle point light under zone — warmer tint */}
      <pointLight
        position={[0, 0.3, 0]}
        color={isActive ? color : "#ffaa77"}
        intensity={isActive ? 1.5 : 0.4}
        distance={size[0] + 2}
        decay={2}
      />
    </group>
  );
}
