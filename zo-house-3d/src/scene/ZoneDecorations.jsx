import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ZONE_POSITIONS } from "./Zones";

/**
 * ZoneDecorations.jsx — Thoughtfully designed workspaces for each agent
 *
 * Each zone is a proper workspace layout, not random floating objects:
 *   - HQ: Executive command center
 *   - Captains: Property management reception
 *   - Events: Event planning studio
 *   - Vibe: DJ/Music production booth
 *   - Sales: Sales office with pipeline board
 *   - BD: Business development meeting room
 */

// ═══════════════════════════════════════════════════════════════════
// FURNITURE & EQUIPMENT COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// Office desk with monitor setup
function Desk({ position, rotation = [0, 0, 0], color, monitors = 1 }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Desk surface */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.12, 1.6]} />
        <meshStandardMaterial color="#2d2d3d" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Desk legs */}
      {[[-1.6, 0.5, -0.7], [1.6, 0.5, -0.7], [-1.6, 0.5, 0.7], [1.6, 0.5, 0.7]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.08, 1, 0.08]} />
          <meshStandardMaterial color="#1f1f2f" metalness={0.5} />
        </mesh>
      ))}
      {/* Monitor(s) */}
      {Array.from({ length: monitors }).map((_, i) => {
        const offsetX = monitors === 1 ? 0 : (i - (monitors - 1) / 2) * 1.4;
        return (
          <group key={i} position={[offsetX, 1.8, -0.5]}>
            {/* Monitor frame */}
            <mesh castShadow>
              <boxGeometry args={[1.3, 0.8, 0.06]} />
              <meshStandardMaterial color="#0a0a0f" />
            </mesh>
            {/* Screen */}
            <mesh position={[0, 0, 0.035]}>
              <planeGeometry args={[1.15, 0.65]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
            </mesh>
            {/* Stand */}
            <mesh position={[0, -0.5, 0.1]}>
              <boxGeometry args={[0.15, 0.2, 0.15]} />
              <meshStandardMaterial color="#1a1a2a" metalness={0.6} />
            </mesh>
          </group>
        );
      })}
      {/* Keyboard */}
      <mesh position={[0, 1.08, 0.3]}>
        <boxGeometry args={[0.8, 0.03, 0.25]} />
        <meshStandardMaterial color="#1a1a25" />
      </mesh>
      {/* Chair */}
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

// Floor lamp
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

// Potted plant (grounded, not floating)
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

// Whiteboard/display board
function Whiteboard({ position, rotation = [0, 0, 0], color, title = "" }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[4, 2.5, 0.1]} />
        <meshStandardMaterial color="#2a2a3a" />
      </mesh>
      {/* Board surface */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[3.7, 2.2]} />
        <meshStandardMaterial color="#f8f8f8" />
      </mesh>
      {/* Content bars (like a chart) */}
      {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
        <mesh key={i} position={[x, -0.3 + i * 0.15, 0.08]}>
          <boxGeometry args={[0.5, 0.3 + i * 0.25, 0.02]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
        </mesh>
      ))}
      {/* Legs */}
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

// Conference/meeting table
function ConferenceTable({ position, color, seats = 4 }) {
  return (
    <group position={position}>
      {/* Table top */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 0.12, 2.5]} />
        <meshStandardMaterial color="#3d3d4d" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Table legs */}
      {[[-2.2, 0.45, -1], [2.2, 0.45, -1], [-2.2, 0.45, 1], [2.2, 0.45, 1]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.12, 0.9, 0.12]} />
          <meshStandardMaterial color="#2a2a3a" metalness={0.5} />
        </mesh>
      ))}
      {/* Chairs */}
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

// Filing cabinet
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

// Couch/sofa
function Sofa({ position, rotation = [0, 0, 0], color }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[2.5, 0.5, 1]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.8, -0.4]} castShadow>
        <boxGeometry args={[2.5, 0.7, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Arms */}
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

// Coffee table
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

// Rug/carpet
function Rug({ position, size = [4, 3], color }) {
  return (
    <mesh position={[position[0], 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} transparent opacity={0.6} roughness={1} />
    </mesh>
  );
}

// Speaker on stand
function SpeakerOnStand({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Stand */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 1.2, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.04, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Speaker */}
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.5, 0.8, 0.4]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.15, 0.21]}>
        <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
        <meshStandardMaterial color="#222" metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.45, 0.21]}>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} />
      </mesh>
    </group>
  );
}

// DJ Booth setup
function DJBooth({ position, color }) {
  const platterRef = useRef();
  
  useFrame((state) => {
    if (platterRef.current) {
      platterRef.current.rotation.y = state.clock.getElapsedTime() * 1.5;
    }
  });

  return (
    <group position={position}>
      {/* Booth desk */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[4, 0.15, 1.5]} />
        <meshStandardMaterial color="#1a1a2a" metalness={0.4} />
      </mesh>
      {/* Front panel */}
      <mesh position={[0, 0.5, 0.7]} castShadow>
        <boxGeometry args={[4, 1, 0.1]} />
        <meshStandardMaterial color="#0f0f1a" />
      </mesh>
      {/* LED strip */}
      <mesh position={[0, 0.1, 0.76]}>
        <boxGeometry args={[3.8, 0.05, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      {/* Turntable left */}
      <group position={[-1.2, 1.1, 0]}>
        <mesh>
          <boxGeometry args={[1.1, 0.1, 1.1]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh ref={platterRef} position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.03, 32]} />
          <meshStandardMaterial color="#050505" metalness={0.9} />
        </mesh>
      </group>
      {/* Mixer center */}
      <group position={[0, 1.12, 0]}>
        <mesh>
          <boxGeometry args={[0.8, 0.12, 0.6]} />
          <meshStandardMaterial color="#1a1a2a" metalness={0.3} />
        </mesh>
        {/* Faders */}
        {[-0.25, 0, 0.25].map((x, i) => (
          <mesh key={i} position={[x, 0.08, 0]}>
            <boxGeometry args={[0.08, 0.06, 0.25]} />
            <meshStandardMaterial color={i === 1 ? color : "#333"} emissive={i === 1 ? color : "#000"} emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>
      {/* Laptop */}
      <group position={[1.2, 1.1, 0]} rotation={[-0.2, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.8, 0.02, 0.5]} />
          <meshStandardMaterial color="#2a2a3a" metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.28, -0.24]} rotation={[1.3, 0, 0]}>
          <boxGeometry args={[0.78, 0.5, 0.02]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, 0.29, -0.24]} rotation={[1.3, 0, 0]}>
          <planeGeometry args={[0.7, 0.42]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// Stage/platform
function Stage({ position, color }) {
  return (
    <group position={position}>
      {/* Main platform */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 0.4, 5]} />
        <meshStandardMaterial color="#2a2a3a" />
      </mesh>
      {/* Edge light strip */}
      <mesh position={[0, 0.42, 2.4]}>
        <boxGeometry args={[7.8, 0.05, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      {/* Steps */}
      <mesh position={[0, 0.1, 3]} castShadow>
        <boxGeometry args={[3, 0.2, 1]} />
        <meshStandardMaterial color="#252535" />
      </mesh>
    </group>
  );
}

// Ambient/mood light
function MoodLight({ position, color, intensity = 2 }) {
  return (
    <group position={position}>
      <pointLight color={color} intensity={intensity} distance={12} decay={2} />
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// Wall-mounted display
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

// Globe on desk
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

// ═══════════════════════════════════════════════════════════════════
// WORKSPACE LAYOUTS
// ═══════════════════════════════════════════════════════════════════

// HQ - Director's Command Center
function DirectorWorkspace({ position, color }) {
  return (
    <group position={position}>
      {/* Main executive desk with triple monitors */}
      <Desk position={[0, 0, -10]} rotation={[0, 0, 0]} color={color} monitors={3} />
      
      {/* Strategy display wall */}
      <WallDisplay position={[0, 3, -14]} rotation={[0, 0, 0]} color={color} />
      
      {/* Seating area */}
      <Sofa position={[10, 0, 5]} rotation={[0, -Math.PI / 2, 0]} color="#3a3a4a" />
      <CoffeeTable position={[7, 0, 5]} />
      
      {/* Side tables */}
      <FilingCabinet position={[-8, 0, -12]} />
      <FilingCabinet position={[8, 0, -12]} />
      
      {/* Plants for atmosphere */}
      <Plant position={[-12, 0, -10]} scale={1.4} />
      <Plant position={[12, 0, -10]} scale={1.2} />
      <Plant position={[-10, 0, 10]} scale={1} />
      
      {/* Floor lamps */}
      <FloorLamp position={[-10, 0, 0]} color={color} />
      <FloorLamp position={[10, 0, 0]} color={color} />
      
      {/* Rug under desk area */}
      <Rug position={[0, 0, -8]} size={[8, 6]} color={color} />
    </group>
  );
}

// Captains - Property Management Reception
function CaptainWorkspace({ position, color }) {
  return (
    <group position={position}>
      {/* Reception desk */}
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
      
      {/* Waiting area */}
      <Sofa position={[-8, 0, 6]} rotation={[0, Math.PI / 4, 0]} color={color} />
      <CoffeeTable position={[-5, 0, 8]} />
      
      {/* Key board / status display */}
      <Whiteboard position={[0, 2.5, -12]} rotation={[0, 0, 0]} color={color} />
      
      {/* Plants */}
      <Plant position={[-10, 0, -10]} scale={1.3} />
      <Plant position={[10, 0, -10]} scale={1.1} />
      <Plant position={[12, 0, 8]} scale={1} />
      
      {/* Welcome mat area */}
      <Rug position={[0, 0, 10]} size={[5, 2]} color={color} />
      
      {/* Floor lamp */}
      <FloorLamp position={[-10, 0, 5]} color={color} />
    </group>
  );
}

// Events - Event Planning Studio
function EventsWorkspace({ position, color }) {
  return (
    <group position={position}>
      {/* Planning desk */}
      <Desk position={[-8, 0, 0]} rotation={[0, Math.PI / 2, 0]} color={color} monitors={2} />
      
      {/* Mini stage for previews */}
      <Stage position={[0, 0, -8]} color={color} />
      
      {/* AV equipment rack */}
      <group position={[10, 0, -5]}>
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[1.5, 2, 0.8]} />
          <meshStandardMaterial color="#1a1a2a" />
        </mesh>
        {[0.3, 0.8, 1.3, 1.8].map((y, i) => (
          <mesh key={i} position={[0, y, 0.42]}>
            <boxGeometry args={[1.3, 0.35, 0.05]} />
            <meshStandardMaterial color="#0a0a15" />
          </mesh>
        ))}
        <MoodLight position={[0, 2.2, 0]} color={color} intensity={1} />
      </group>
      
      {/* Client meeting area */}
      <ConferenceTable position={[5, 0, 8]} color={color} seats={4} />
      
      {/* Speakers */}
      <SpeakerOnStand position={[-5, 0, -4]} rotation={[0, Math.PI / 4, 0]} />
      <SpeakerOnStand position={[5, 0, -4]} rotation={[0, -Math.PI / 4, 0]} />
      
      {/* Plants */}
      <Plant position={[-12, 0, 10]} scale={1.2} />
      <Plant position={[12, 0, 10]} scale={1} />
      
      {/* Mood lighting */}
      <MoodLight position={[-6, 4, -6]} color={color} intensity={1.5} />
      <MoodLight position={[6, 4, -6]} color={color} intensity={1.5} />
    </group>
  );
}

// Vibe Curator - DJ/Music Production Booth
function VibeWorkspace({ position, color }) {
  return (
    <group position={position}>
      {/* DJ Booth - the centerpiece */}
      <DJBooth position={[0, 0, -6]} color={color} />
      
      {/* Monitor speakers */}
      <SpeakerOnStand position={[-6, 0, -8]} rotation={[0, Math.PI / 6, 0]} />
      <SpeakerOnStand position={[6, 0, -8]} rotation={[0, -Math.PI / 6, 0]} />
      
      {/* Vinyl/records storage */}
      <group position={[-10, 0, 0]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[1.5, 1.2, 0.8]} />
          <meshStandardMaterial color="#3a3a4a" />
        </mesh>
        {/* Vinyl slots */}
        {[-0.4, 0, 0.4].map((x, i) => (
          <mesh key={i} position={[x, 0.6, 0.42]}>
            <boxGeometry args={[0.35, 0.35, 0.02]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
      </group>
      
      {/* Chill seating */}
      <Sofa position={[8, 0, 5]} rotation={[0, -Math.PI / 3, 0]} color="#2a2a3a" />
      
      {/* Mood lighting - essential for vibe */}
      <MoodLight position={[-8, 3, -3]} color="#E040FB" intensity={2} />
      <MoodLight position={[8, 3, -3]} color="#00E5FF" intensity={2} />
      <MoodLight position={[0, 4, 0]} color={color} intensity={1.5} />
      
      {/* Wall neon accent */}
      <group position={[0, 3.5, -12]}>
        <mesh>
          <torusGeometry args={[1.5, 0.08, 8, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
        </mesh>
      </group>
      
      {/* Plant */}
      <Plant position={[10, 0, -10]} scale={1.2} />
      
      {/* Floor rug */}
      <Rug position={[0, 0, -4]} size={[6, 4]} color={color} />
    </group>
  );
}

// Sales - Sales Office
function SalesWorkspace({ position, color }) {
  return (
    <group position={position}>
      {/* Main sales desk */}
      <Desk position={[0, 0, -8]} rotation={[0, 0, 0]} color={color} monitors={2} />
      
      {/* Pipeline/target whiteboard */}
      <Whiteboard position={[0, 2.5, -12]} rotation={[0, 0, 0]} color={color} />
      
      {/* Secondary desk */}
      <Desk position={[-10, 0, 2]} rotation={[0, Math.PI / 2, 0]} color={color} monitors={1} />
      
      {/* Call booth area */}
      <group position={[10, 0, 2]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[2, 2.4, 2]} />
          <meshStandardMaterial color="#2a2a3a" transparent opacity={0.4} />
        </mesh>
        <mesh position={[0, 0.5, 0.8]}>
          <boxGeometry args={[1.5, 0.1, 0.4]} />
          <meshStandardMaterial color="#3a3a4a" />
        </mesh>
      </group>
      
      {/* Meeting corner */}
      <CoffeeTable position={[-6, 0, 10]} />
      <Sofa position={[-6, 0, 12]} rotation={[0, 0, 0]} color="#3a3a4a" />
      
      {/* Filing */}
      <FilingCabinet position={[-12, 0, -8]} />
      <FilingCabinet position={[12, 0, -8]} />
      
      {/* Plants */}
      <Plant position={[-12, 0, 10]} scale={1.2} />
      <Plant position={[12, 0, 10]} scale={1} />
      
      {/* Floor lamp */}
      <FloorLamp position={[8, 0, 10]} color={color} />
    </group>
  );
}

// BD - Business Development Meeting Room
function BDWorkspace({ position, color }) {
  return (
    <group position={position}>
      {/* Main conference table */}
      <ConferenceTable position={[0, 0, 0]} color={color} seats={6} />
      
      {/* Presentation screen */}
      <WallDisplay position={[0, 3, -10]} rotation={[0, 0, 0]} color={color} />
      
      {/* Research station */}
      <Desk position={[-10, 0, -5]} rotation={[0, Math.PI / 2, 0]} color={color} monitors={1} />
      <DeskGlobe position={[-8, 1.1, -5]} color={color} />
      
      {/* Partnership/deal board */}
      <Whiteboard position={[12, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} color={color} />
      
      {/* Networking lounge */}
      <Sofa position={[8, 0, 8]} rotation={[0, -Math.PI / 2, 0]} color="#3a3a4a" />
      <CoffeeTable position={[5, 0, 8]} />
      
      {/* Filing */}
      <FilingCabinet position={[-12, 0, 5]} />
      
      {/* Plants */}
      <Plant position={[-12, 0, 10]} scale={1.3} />
      <Plant position={[12, 0, 10]} scale={1.1} />
      <Plant position={[-12, 0, -10]} scale={1} />
      
      {/* Floor lamps */}
      <FloorLamp position={[-8, 0, 10]} color={color} />
      <FloorLamp position={[10, 0, -8]} color={color} />
      
      {/* Rug */}
      <Rug position={[0, 0, 0]} size={[7, 5]} color={color} />
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
      <DirectorWorkspace position={zones.director.position} color={zones.director.color} />
      <CaptainWorkspace position={zones["captain-blrxzo"].position} color={zones["captain-blrxzo"].color} />
      <CaptainWorkspace position={zones["captain-wtfxzo"].position} color={zones["captain-wtfxzo"].color} />
      <EventsWorkspace position={zones.events.position} color={zones.events.color} />
      <VibeWorkspace position={zones["vibe-curator"].position} color={zones["vibe-curator"].color} />
      <SalesWorkspace position={zones.sales.position} color={zones.sales.color} />
      <BDWorkspace position={zones.bd.position} color={zones.bd.color} />
    </group>
  );
}
