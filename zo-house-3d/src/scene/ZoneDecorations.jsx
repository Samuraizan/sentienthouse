import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ZONE_POSITIONS } from "./Zones";

/**
 * ZoneDecorations.jsx — Workspace layouts for 3 zones
 *
 *   - HQ: Command desk, strategy wall, 3 workstations, conference table, lounge
 *   - BLRxZo House: Reception, check-in counter, common area, kitchen, ops board
 *   - WTFxZo House: Mirrored BLRxZo layout, different color accents
 */

// ═══════════════════════════════════════════════════════════════════
// FURNITURE & EQUIPMENT COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function Desk({ position, rotation = [0, 0, 0], color, monitors = 1 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.12, 1.6]} />
        <meshStandardMaterial color="#2d2d3d" metalness={0.3} roughness={0.7} />
      </mesh>
      {[[-1.6, 0.5, -0.7], [1.6, 0.5, -0.7], [-1.6, 0.5, 0.7], [1.6, 0.5, 0.7]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.08, 1, 0.08]} />
          <meshStandardMaterial color="#1f1f2f" metalness={0.5} />
        </mesh>
      ))}
      {Array.from({ length: monitors }).map((_, i) => {
        const offsetX = monitors === 1 ? 0 : (i - (monitors - 1) / 2) * 1.4;
        return (
          <group key={i} position={[offsetX, 1.8, -0.5]}>
            <mesh castShadow>
              <boxGeometry args={[1.3, 0.8, 0.06]} />
              <meshStandardMaterial color="#0a0a0f" />
            </mesh>
            <mesh position={[0, 0, 0.035]}>
              <planeGeometry args={[1.15, 0.65]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, -0.5, 0.1]}>
              <boxGeometry args={[0.15, 0.2, 0.15]} />
              <meshStandardMaterial color="#1a1a2a" metalness={0.6} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 1.08, 0.3]}>
        <boxGeometry args={[0.8, 0.03, 0.25]} />
        <meshStandardMaterial color="#1a1a25" />
      </mesh>
      <group position={[0, 0, 1.5]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.7, 0.1, 0.7]} />
          <meshStandardMaterial color="#2a2a3a" />
        </mesh>
        <mesh position={[0, 1.1, -0.3]}>
          <boxGeometry args={[0.7, 0.9, 0.1]} />
          <meshStandardMaterial color="#2a2a3a" />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.05, 16]} />
          <meshStandardMaterial color="#222" metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function FloorLamp({ position, color }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.1, 16]} />
        <meshStandardMaterial color="#1a1a2a" metalness={0.5} />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 2, 8]} />
        <meshStandardMaterial color="#333" metalness={0.6} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 0.4, 16]} />
        <meshStandardMaterial color="#2a2a3a" />
      </mesh>
      <pointLight position={[0, 1.8, 0]} color={color} intensity={2} distance={8} decay={2} />
    </group>
  );
}

function Plant({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.25, 0.7, 12]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#2d1810" roughness={1} />
      </mesh>
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <mesh key={i} position={[
          Math.cos(angle * Math.PI / 180) * 0.15,
          1.0 + i * 0.15,
          Math.sin(angle * Math.PI / 180) * 0.15
        ]} rotation={[0.4, angle * Math.PI / 180, 0.2]}>
          <coneGeometry args={[0.15, 0.5, 4]} />
          <meshStandardMaterial color="#228B22" />
        </mesh>
      ))}
    </group>
  );
}

function Whiteboard({ position, rotation = [0, 0, 0], color }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[4, 2.5, 0.1]} />
        <meshStandardMaterial color="#2a2a3a" />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[3.7, 2.2]} />
        <meshStandardMaterial color="#f8f8f8" />
      </mesh>
      {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
        <mesh key={i} position={[x, -0.3 + i * 0.15, 0.08]}>
          <boxGeometry args={[0.5, 0.3 + i * 0.25, 0.02]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
        </mesh>
      ))}
      <mesh position={[-1.5, -1.5, 0]}>
        <boxGeometry args={[0.08, 0.5, 0.3]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[1.5, -1.5, 0]}>
        <boxGeometry args={[0.08, 0.5, 0.3]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

function ConferenceTable({ position, color, seats = 4 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 0.12, 2.5]} />
        <meshStandardMaterial color="#3d3d4d" metalness={0.3} roughness={0.6} />
      </mesh>
      {[[-2.2, 0.45, -1], [2.2, 0.45, -1], [-2.2, 0.45, 1], [2.2, 0.45, 1]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.12, 0.9, 0.12]} />
          <meshStandardMaterial color="#2a2a3a" metalness={0.5} />
        </mesh>
      ))}
      {Array.from({ length: seats }).map((_, i) => {
        const side = i < seats / 2 ? -1 : 1;
        const idx = i % (seats / 2);
        const xPos = (idx - (seats / 4 - 0.5)) * 1.8;
        return (
          <group key={i} position={[xPos, 0, side * 2]} rotation={[0, side > 0 ? Math.PI : 0, 0]}>
            <mesh position={[0, 0.55, 0]}>
              <boxGeometry args={[0.6, 0.08, 0.6]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, 0.95, -0.25]}>
              <boxGeometry args={[0.6, 0.7, 0.08]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function FilingCabinet({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[0.8, 1.5, 0.6]} />
        <meshStandardMaterial color="#3a3a4a" metalness={0.4} roughness={0.6} />
      </mesh>
      {[0.2, 0.6, 1.0].map((y, i) => (
        <mesh key={i} position={[0, y, 0.32]}>
          <boxGeometry args={[0.6, 0.3, 0.02]} />
          <meshStandardMaterial color="#2a2a3a" />
        </mesh>
      ))}
    </group>
  );
}

function Sofa({ position, rotation = [0, 0, 0], color }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[2.5, 0.5, 1]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.8, -0.4]} castShadow>
        <boxGeometry args={[2.5, 0.7, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[-1.15, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 0.5, 1]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[1.15, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 0.5, 1]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
}

function CoffeeTable({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.08, 0.6]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.7} />
      </mesh>
      {[[-0.5, 0.2, -0.2], [0.5, 0.2, -0.2], [-0.5, 0.2, 0.2], [0.5, 0.2, 0.2]].map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
          <meshStandardMaterial color="#333" metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Rug({ position, size = [4, 3], color }) {
  return (
    <mesh position={[position[0], 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} transparent opacity={0.6} roughness={1} />
    </mesh>
  );
}

function WallDisplay({ position, rotation = [0, 0, 0], color }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[3, 1.8, 0.08]} />
        <meshStandardMaterial color="#0a0a0f" />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[2.8, 1.6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function DeskGlobe({ position, color }) {
  const globeRef = useRef();

  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 12]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0.2]}>
        <torusGeometry args={[0.35, 0.015, 8, 32]} />
        <meshStandardMaterial color="#DAA520" metalness={0.8} />
      </mesh>
      <mesh ref={globeRef} position={[0, 0.5, 0]} rotation={[0, 0, 0.2]}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial color="#1a4a6a" emissive={color} emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}

// Kitchen counter for house zones
function KitchenCounter({ position, rotation = [0, 0, 0], color }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Counter base */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[4, 1.1, 1.2]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.7} />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <boxGeometry args={[4.1, 0.08, 1.3]} />
        <meshStandardMaterial color="#4a4a5a" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Sink basin */}
      <mesh position={[1, 1.1, 0]}>
        <boxGeometry args={[0.8, 0.06, 0.6]} />
        <meshStandardMaterial color="#555" metalness={0.6} />
      </mesh>
      {/* Bar stools */}
      {[-1.2, 0, 1.2].map((x, i) => (
        <group key={i} position={[x, 0, 1]}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
            <meshStandardMaterial color="#333" metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.82, 0]}>
            <cylinderGeometry args={[0.25, 0.22, 0.06, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3 WORKSPACE LAYOUTS
// ═══════════════════════════════════════════════════════════════════

/**
 * HQWorkspace — Interdimensional HQ (center)
 * Command desk at center-back, strategy wall, 3 workstations (Suki/Wanda/Yana),
 * conference table, lounge area, whiteboard.
 */
function HQWorkspace({ position, color }) {
  return (
    <group position={position}>
      {/* ZomadPrime command desk — center-back with triple monitors */}
      <Desk position={[0, 0, -10]} rotation={[0, 0, 0]} color={color} monitors={3} />

      {/* Strategy display wall behind command desk */}
      <WallDisplay position={[0, 3, -14]} rotation={[0, 0, 0]} color={color} />

      {/* Suki workstation — left-front */}
      <Desk position={[-10, 0, 5]} rotation={[0, Math.PI / 6, 0]} color="#FF69B4" monitors={2} />

      {/* Wanda workstation — right-front */}
      <Desk position={[10, 0, 5]} rotation={[0, -Math.PI / 6, 0]} color="#2ECC71" monitors={2} />

      {/* Yana workstation — left-back */}
      <Desk position={[-10, 0, -5]} rotation={[0, Math.PI / 4, 0]} color="#E67E22" monitors={1} />
      <DeskGlobe position={[-8, 1.1, -5]} color="#E67E22" />

      {/* Conference table — center area */}
      <ConferenceTable position={[0, 0, 10]} color={color} seats={6} />

      {/* Lounge area — right side */}
      <Sofa position={[15, 0, -5]} rotation={[0, -Math.PI / 2, 0]} color="#3a3a4a" />
      <CoffeeTable position={[12, 0, -5]} />

      {/* Whiteboard — strategy planning */}
      <Whiteboard position={[15, 2.5, 5]} rotation={[0, -Math.PI / 2, 0]} color={color} />

      {/* Filing cabinets */}
      <FilingCabinet position={[-15, 0, -12]} />
      <FilingCabinet position={[15, 0, -12]} />

      {/* Plants for atmosphere */}
      <Plant position={[-18, 0, -10]} scale={1.4} />
      <Plant position={[18, 0, -10]} scale={1.2} />
      <Plant position={[-15, 0, 12]} scale={1} />
      <Plant position={[18, 0, 12]} scale={1.1} />

      {/* Floor lamps */}
      <FloorLamp position={[-16, 0, 0]} color={color} />
      <FloorLamp position={[16, 0, 0]} color={color} />

      {/* Rug under command desk */}
      <Rug position={[0, 0, -8]} size={[8, 6]} color={color} />
    </group>
  );
}

/**
 * BLRxZoHouseWorkspace — BLRxZo House (Darshan's property, left side)
 * Reception desk, check-in counter, common area sofas, kitchen counter, ops board.
 */
function BLRxZoHouseWorkspace({ position, color }) {
  return (
    <group position={position}>
      {/* BLRxZo JR reception desk */}
      <Desk position={[0, 0, -8]} rotation={[0, 0, 0]} color={color} monitors={2} />

      {/* Guest check-in counter */}
      <group position={[8, 0, 0]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[2.5, 1.2, 1]} />
          <meshStandardMaterial color="#3a3a4a" />
        </mesh>
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[2.6, 0.08, 1.1]} />
          <meshStandardMaterial color="#4a4a5a" metalness={0.3} />
        </mesh>
      </group>

      {/* Common area — sofas facing each other */}
      <Sofa position={[-6, 0, 6]} rotation={[0, Math.PI / 4, 0]} color={color} />
      <Sofa position={[2, 0, 10]} rotation={[0, Math.PI + Math.PI / 4, 0]} color="#3a3a4a" />
      <CoffeeTable position={[-2, 0, 8]} />

      {/* Kitchen counter */}
      <KitchenCounter position={[-8, 0, -2]} rotation={[0, Math.PI / 2, 0]} color={color} />

      {/* Ops board / status display */}
      <Whiteboard position={[0, 2.5, -12]} rotation={[0, 0, 0]} color={color} />

      {/* Plants — house feel */}
      <Plant position={[-12, 0, -10]} scale={1.3} />
      <Plant position={[12, 0, -10]} scale={1.1} />
      <Plant position={[12, 0, 8]} scale={1} />
      <Plant position={[-12, 0, 10]} scale={0.9} />

      {/* Welcome mat area */}
      <Rug position={[0, 0, 12]} size={[5, 2]} color={color} />

      {/* Floor lamps — warm */}
      <FloorLamp position={[-10, 0, 5]} color={color} />
      <FloorLamp position={[10, 0, 5]} color={color} />
    </group>
  );
}

/**
 * WTFxZoHouseWorkspace — WTFxZo House (Akhilesh's property, right side)
 * Mirrored BLRxZo layout with different color accents.
 */
function WTFxZoHouseWorkspace({ position, color }) {
  return (
    <group position={position}>
      {/* WTFxZo JR reception desk */}
      <Desk position={[0, 0, -8]} rotation={[0, 0, 0]} color={color} monitors={2} />

      {/* Guest check-in counter — mirrored to left */}
      <group position={[-8, 0, 0]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[2.5, 1.2, 1]} />
          <meshStandardMaterial color="#3a3a4a" />
        </mesh>
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[2.6, 0.08, 1.1]} />
          <meshStandardMaterial color="#4a4a5a" metalness={0.3} />
        </mesh>
      </group>

      {/* Common area — sofas mirrored */}
      <Sofa position={[6, 0, 6]} rotation={[0, -Math.PI / 4, 0]} color={color} />
      <Sofa position={[-2, 0, 10]} rotation={[0, Math.PI - Math.PI / 4, 0]} color="#3a3a4a" />
      <CoffeeTable position={[2, 0, 8]} />

      {/* Kitchen counter — mirrored to right */}
      <KitchenCounter position={[8, 0, -2]} rotation={[0, -Math.PI / 2, 0]} color={color} />

      {/* Ops board / status display */}
      <Whiteboard position={[0, 2.5, -12]} rotation={[0, 0, 0]} color={color} />

      {/* Plants — house feel */}
      <Plant position={[12, 0, -10]} scale={1.3} />
      <Plant position={[-12, 0, -10]} scale={1.1} />
      <Plant position={[-12, 0, 8]} scale={1} />
      <Plant position={[12, 0, 10]} scale={0.9} />

      {/* Welcome mat area */}
      <Rug position={[0, 0, 12]} size={[5, 2]} color={color} />

      {/* Floor lamps — warm */}
      <FloorLamp position={[10, 0, 5]} color={color} />
      <FloorLamp position={[-10, 0, 5]} color={color} />
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
      // Gentle hover bob
      signRef.current.position.y = position[1] + 5.5 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.15;
    }
  });

  const textColor = new THREE.Color(color);

  return (
    <group ref={signRef} position={[position[0], position[1] + 5.5, position[2] - 14]}>
      {/* Post */}
      <mesh position={[0, -2.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 5, 8]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
      </mesh>
      {/* Sign board */}
      <mesh castShadow>
        <boxGeometry args={[text.length * 0.65 + 1.5, 1.6, 0.15]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Inner glow panel */}
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
      {/* Accent line top */}
      <mesh position={[0, 0.75, 0.08]}>
        <boxGeometry args={[text.length * 0.65 + 1.2, 0.04, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      {/* Accent line bottom */}
      <mesh position={[0, -0.75, 0.08]}>
        <boxGeometry args={[text.length * 0.65 + 1.2, 0.04, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      {/* Glow light */}
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

      {/* BLRxZo House: full furniture + sign */}
      <BLRxZoHouseWorkspace position={zones["blrxzo-house"].position} color={zones["blrxzo-house"].color} />
      <ZoneSign position={zones["blrxzo-house"].position} text="BLRxZo House" color={zones["blrxzo-house"].color} />

      {/* WTFxZo House: full furniture + sign */}
      <WTFxZoHouseWorkspace position={zones["wtfxzo-house"].position} color={zones["wtfxzo-house"].color} />
      <ZoneSign position={zones["wtfxzo-house"].position} text="WTFxZo House" color={zones["wtfxzo-house"].color} />
    </group>
  );
}
