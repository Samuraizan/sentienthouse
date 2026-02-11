import { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useAgentStore from "../store/agentStore";

/**
 * Floor.jsx — The ground plane for the Zo House Command Center.
 *
 * Warm dark gray floor with subtle orange grid lines.
 * Enlarged to accommodate the wider department zone layout.
 */

function createGridTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1e1c24";
  ctx.fillRect(0, 0, size, size);

  const gridSpacing = size / 32;
  ctx.strokeStyle = "rgba(255, 140, 80, 0.08)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 32; i++) {
    const pos = i * gridSpacing;
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255, 140, 80, 0.15)";
  ctx.lineWidth = 2;
  const majorSpacing = size / 8;

  for (let i = 0; i <= 8; i++) {
    const pos = i * majorSpacing;
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
    ctx.stroke();
  }

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.2,
    size / 2, size / 2, size * 0.5
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.15)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function FloorRing({ radius, color = "#ff8855", opacity = 0.1, y = 0.02 }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, y, 0]}>
      <ringGeometry args={[radius - 0.05, radius + 0.05, 128]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function Floor() {
  const meshRef = useRef();
  const clearSelectedAgent = useAgentStore((state) => state.clearSelectedAgent);

  const gridTexture = useMemo(() => createGridTexture(), []);

  const handleFloorClick = useCallback(
    (e) => {
      clearSelectedAgent();
    },
    [clearSelectedAgent]
  );

  return (
    <group onClick={handleFloorClick}>
      {/* Main floor — enlarged for wider layout */}
      <mesh
        ref={meshRef}
        rotation-x={-Math.PI / 2}
        position={[0, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[55, 128]} />
        <meshStandardMaterial
          map={gridTexture}
          color="#1e1c24"
          roughness={0.85}
          metalness={0.15}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Concentric reference rings — wider spacing for new layout */}
      <FloorRing radius={6} color="#ff8855" opacity={0.08} />
      <FloorRing radius={14} color="#ff8855" opacity={0.06} />
      <FloorRing radius={22} color="#ff8855" opacity={0.05} />
      <FloorRing radius={32} color="#ff8855" opacity={0.04} />
      <FloorRing radius={44} color="#ff8855" opacity={0.03} />

      {/* Center dot marker */}
      <mesh position={[0, 0.05, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.3, 32]} />
        <meshBasicMaterial color="#ff7744" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
