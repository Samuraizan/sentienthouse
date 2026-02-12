import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Clone, Html } from "@react-three/drei";
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
// ZONE SIGN — Massive hovering signboard above each island
// ═══════════════════════════════════════════════════════════════════

const SIGN_HEIGHT = 38; // Float high above islands (visible from default camera Y=130)
const SIGN_SCALE = 4;   // Overall sign scale multiplier

function ZoneSign({ position, text, color }) {
  const signRef = useRef();

  useFrame((state) => {
    if (signRef.current) {
      const t = state.clock.getElapsedTime();
      signRef.current.position.y = position[1] + SIGN_HEIGHT + Math.sin(t * 0.6) * 0.5;
    }
  });

  const boardW = text.length * 1.8 + 6;
  const boardH = 5;

  return (
    <group ref={signRef} position={[position[0], position[1] + SIGN_HEIGHT, position[2]]}>
      {/* Main board — dark panel */}
      <mesh castShadow>
        <boxGeometry args={[boardW, boardH, 0.4]} />
        <meshStandardMaterial color="#0a0a1a" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Inner glow panel */}
      <mesh position={[0, 0, 0.22]}>
        <planeGeometry args={[boardW - 1.5, boardH - 1.2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Top accent bar */}
      <mesh position={[0, boardH / 2 - 0.15, 0.22]}>
        <boxGeometry args={[boardW - 0.6, 0.12, 0.05]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.0} />
      </mesh>

      {/* Bottom accent bar */}
      <mesh position={[0, -boardH / 2 + 0.15, 0.22]}>
        <boxGeometry args={[boardW - 0.6, 0.12, 0.05]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.0} />
      </mesh>

      {/* Side accent bars */}
      <mesh position={[-boardW / 2 + 0.15, 0, 0.22]}>
        <boxGeometry args={[0.12, boardH - 0.6, 0.05]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[boardW / 2 - 0.15, 0, 0.22]}>
        <boxGeometry args={[0.12, boardH - 0.6, 0.05]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>

      {/* Corner accents — small glowing cubes */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([cx, cy], i) => (
        <mesh key={i} position={[cx * (boardW / 2 - 0.4), cy * (boardH / 2 - 0.4), 0.25]}>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.0} />
        </mesh>
      ))}

      {/* Text label — Html overlay so it's always crisp */}
      <Html
        position={[0, 0, 0.3]}
        center
        distanceFactor={40}
        occlude={false}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div style={{
          fontFamily: "Inter, SF Pro Display, -apple-system, sans-serif",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}>
          <div style={{
            fontSize: "52px",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "6px",
            textTransform: "uppercase",
            textShadow: `0 0 30px ${color}, 0 0 60px ${color}40, 0 4px 12px rgba(0,0,0,0.8)`,
          }}>
            {text}
          </div>
        </div>
      </Html>

      {/* Main light — illuminates the sign and area below */}
      <pointLight position={[0, 0, 3]} color={color} intensity={8} distance={30} decay={2} />
      {/* Downward light — casts glow onto the island */}
      <pointLight position={[0, -3, 0]} color={color} intensity={4} distance={25} decay={2} />
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
