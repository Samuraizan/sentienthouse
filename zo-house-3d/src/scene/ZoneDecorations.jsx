import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Clone } from "@react-three/drei";
import * as THREE from "three";
import { ZONE_POSITIONS } from "./Zones";

/**
 * ZoneDecorations.jsx — Pirate-themed prop layouts for satellite islands
 *
 *   - HQ: GLTF model has baked equipment — only sign
 *   - BLRxZo House: Pirate props (barrels, chests, palms, cannons, etc.)
 *   - WTFxZo House: Mirrored pirate layout
 */

// ═══════════════════════════════════════════════════════════════════
// PROP LOADER — Generic GLTF prop component
// ═══════════════════════════════════════════════════════════════════

const PROP_BASE = "/models/props/";

function Prop({ model, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const { scene } = useGLTF(`${PROP_BASE}${model}`);
  const s = typeof scale === "number" ? [scale, scale, scale] : scale;
  return (
    <group position={position} rotation={rotation} scale={s}>
      <Clone object={scene} castShadow receiveShadow />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WORKSPACE LAYOUTS — Pirate island decorations
// ═══════════════════════════════════════════════════════════════════
const DECO_SCALE = 3;

/**
 * BLRxZoHouseWorkspace — BLRxZo House (left satellite island)
 * Pirate outpost: barrels, treasure chests, palm trees, cannon, dock.
 */
function BLRxZoHouseWorkspace({ position }) {
  return (
    <group position={position} scale={[DECO_SCALE, DECO_SCALE, DECO_SCALE]}>
      {/* Captain's desk — treasure chest with gold */}
      <Prop model="Prop_Chest_Gold.glb" position={[0, 0, -4]} scale={1.8} />
      <Prop model="Prop_Chest_Closed.glb" position={[3, 0, -3]} rotation={[0, -0.5, 0]} scale={1.5} />

      {/* Barrel cluster — common area */}
      <Prop model="Prop_Barrel.glb" position={[-3, 0, 2]} scale={1.8} />
      <Prop model="Prop_Barrel.glb" position={[-2, 0, 3]} rotation={[0, 1.2, 0]} scale={1.5} />
      <Prop model="Prop_Barrel.glb" position={[-4, 0, 3.5]} rotation={[0, 0.6, 0]} scale={1.6} />

      {/* Cannon — ops defense */}
      <Prop model="Prop_Cannon.glb" position={[4, 0, 1]} rotation={[0, -Math.PI / 4, 0]} scale={2} />

      {/* Gold & loot */}
      <Prop model="Prop_GoldBag.glb" position={[1, 0, -3]} scale={1.4} />
      <Prop model="Prop_Coins.glb" position={[-1, 0, -3.5]} scale={1.2} />

      {/* Supplies */}
      <Prop model="Prop_Bucket_Fishes.glb" position={[-4, 0, -2]} scale={1.5} />
      <Prop model="Prop_Bottle_1.glb" position={[2, 0, 2]} scale={1.3} />
      <Prop model="Prop_Bottle_2.glb" position={[2.5, 0, 2.5]} scale={1.3} />

      {/* Palm trees */}
      <Prop model="Environment_PalmTree_1.glb" position={[-6, 0, -5]} scale={2} />
      <Prop model="Environment_PalmTree_2.glb" position={[6, 0, -4]} scale={1.8} />
      <Prop model="Environment_PalmTree_3.glb" position={[5, 0, 5]} scale={2.2} />
      <Prop model="Environment_PalmTree_1.glb" position={[-5, 0, 5]} scale={1.6} />

      {/* Rocks */}
      <Prop model="Environment_Rock_1.glb" position={[-7, 0, 0]} scale={1.5} />
      <Prop model="Environment_Rock_3.glb" position={[7, 0, -1]} scale={1.2} />

      {/* Skull & bones for atmosphere */}
      <Prop model="Prop_Skull.glb" position={[5, 0, -5]} scale={1.5} />
      <Prop model="Prop_Anchor.glb" position={[-5, 0, -1]} rotation={[0, 0.8, 0]} scale={1.8} />

      {/* Bomb near the cannon */}
      <Prop model="Prop_Bomb.glb" position={[5, 0, 2]} scale={1.5} />
    </group>
  );
}

/**
 * WTFxZoHouseWorkspace — WTFxZo House (right satellite island)
 * Mirrored pirate outpost with different arrangement.
 */
function WTFxZoHouseWorkspace({ position }) {
  return (
    <group position={position} scale={[DECO_SCALE, DECO_SCALE, DECO_SCALE]}>
      {/* Captain's desk — treasure chest with gold */}
      <Prop model="Prop_Chest_Gold.glb" position={[0, 0, -4]} rotation={[0, Math.PI, 0]} scale={1.8} />
      <Prop model="Prop_Chest_Closed.glb" position={[-3, 0, -3]} rotation={[0, 0.5, 0]} scale={1.5} />

      {/* Barrel cluster — common area */}
      <Prop model="Prop_Barrel.glb" position={[3, 0, 2]} scale={1.8} />
      <Prop model="Prop_Barrel.glb" position={[2, 0, 3]} rotation={[0, -1.2, 0]} scale={1.5} />
      <Prop model="Prop_Barrel.glb" position={[4, 0, 3.5]} rotation={[0, -0.6, 0]} scale={1.6} />

      {/* Cannon — ops defense */}
      <Prop model="Prop_Cannon.glb" position={[-4, 0, 1]} rotation={[0, Math.PI / 4, 0]} scale={2} />

      {/* Gold & loot */}
      <Prop model="Prop_GoldBag.glb" position={[-1, 0, -3]} scale={1.4} />
      <Prop model="Prop_Coins.glb" position={[1, 0, -3.5]} scale={1.2} />

      {/* Supplies */}
      <Prop model="Prop_Bucket_Fishes.glb" position={[4, 0, -2]} scale={1.5} />
      <Prop model="Prop_Bottle_1.glb" position={[-2, 0, 2]} scale={1.3} />
      <Prop model="Prop_Bottle_2.glb" position={[-2.5, 0, 2.5]} scale={1.3} />

      {/* Palm trees */}
      <Prop model="Environment_PalmTree_2.glb" position={[6, 0, -5]} scale={2} />
      <Prop model="Environment_PalmTree_1.glb" position={[-6, 0, -4]} scale={1.8} />
      <Prop model="Environment_PalmTree_3.glb" position={[-5, 0, 5]} scale={2.2} />
      <Prop model="Environment_PalmTree_2.glb" position={[5, 0, 5]} scale={1.6} />

      {/* Rocks */}
      <Prop model="Environment_Rock_2.glb" position={[7, 0, 0]} scale={1.5} />
      <Prop model="Environment_Rock_1.glb" position={[-7, 0, -1]} scale={1.2} />

      {/* Skull & bones for atmosphere */}
      <Prop model="Environment_Skulls.glb" position={[-5, 0, -5]} scale={1.2} />
      <Prop model="Prop_Anchor.glb" position={[5, 0, -1]} rotation={[0, -0.8, 0]} scale={1.8} />

      {/* Bomb near the cannon */}
      <Prop model="Prop_Bomb.glb" position={[-5, 0, 2]} scale={1.5} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ZONE SIGN — Floating signpost with zone name
// ═══════════════════════════════════════════════════════════════════

function ZoneSign({ position, text, color }) {
  const signRef = useRef();

  useFrame((state) => {
    if (signRef.current) {
      signRef.current.position.y = position[1] + 5.5 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.15;
    }
  });

  return (
    <group ref={signRef} position={[position[0], position[1] + 5.5, position[2] - 14]}>
      <mesh position={[0, -2.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 5, 8]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[text.length * 0.65 + 1.5, 1.6, 0.15]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[text.length * 0.65 + 0.8, 1.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.15}
        />
      </mesh>
      <mesh position={[0, 0.75, 0.08]}>
        <boxGeometry args={[text.length * 0.65 + 1.2, 0.04, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0, -0.75, 0.08]}>
        <boxGeometry args={[text.length * 0.65 + 1.2, 0.04, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0, 0, 1]} color={color} intensity={1.5} distance={8} decay={2} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════

export default function ZoneDecorations() {
  const zones = ZONE_POSITIONS;

  return (
    <group>
      {/* HQ: GLTF model has baked equipment — only add sign */}
      <ZoneSign position={zones.hq.position} text="Interdimensional HQ" color={zones.hq.color} />

      {/* BLRxZo House: pirate props + sign */}
      <BLRxZoHouseWorkspace position={zones["blrxzo-house"].position} />
      <ZoneSign position={zones["blrxzo-house"].position} text="BLRxZo House" color={zones["blrxzo-house"].color} />

      {/* WTFxZo House: pirate props + sign */}
      <WTFxZoHouseWorkspace position={zones["wtfxzo-house"].position} />
      <ZoneSign position={zones["wtfxzo-house"].position} text="WTFxZo House" color={zones["wtfxzo-house"].color} />
    </group>
  );
}

// Preload all pirate props
const PROP_MODELS = [
  "Prop_Barrel.glb", "Prop_Cannon.glb", "Prop_Chest_Closed.glb", "Prop_Chest_Gold.glb",
  "Prop_Anchor.glb", "Prop_Skull.glb", "Prop_GoldBag.glb", "Prop_Coins.glb",
  "Prop_Bottle_1.glb", "Prop_Bottle_2.glb", "Prop_Bucket_Fishes.glb", "Prop_Bomb.glb",
  "Environment_PalmTree_1.glb", "Environment_PalmTree_2.glb", "Environment_PalmTree_3.glb",
  "Environment_Rock_1.glb", "Environment_Rock_2.glb", "Environment_Rock_3.glb",
  "Environment_Skulls.glb",
];
PROP_MODELS.forEach((m) => useGLTF.preload(`${PROP_BASE}${m}`));
