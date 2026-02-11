import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ZONE_POSITIONS } from "./Zones";

/**
 * ZoneDecorations.jsx — Themed 3D decorations for each agent's workspace
 *
 * Each agent has unique decorations matching their role and vibe:
 *   - HQ (Director): Command center with holographic displays
 *   - Captains: House management desks and plants
 *   - Events: Party lights and stage elements
 *   - Vibe: Music equipment and neon
 *   - Sales: Business boards and charts
 *   - BD: Meeting area with globe
 */

// ── Reusable decoration components ─────────────────────────────────

function FloatingOrb({ position, color, size = 0.5, speed = 1 }) {
  const ref = useRef();
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime() * speed + offset;
      ref.current.position.y = position[1] + Math.sin(t) * 0.5;
      ref.current.rotation.y = t * 0.5;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[size, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        transparent
        opacity={0.7}
        metalness={0.5}
        roughness={0.2}
      />
    </mesh>
  );
}

function HologramRing({ position, color, radius = 2 }) {
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = state.clock.getElapsedTime() * 0.3;
      ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.2;
    }
  });

  return (
    <mesh ref={ref} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.05, 8, 64]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

function Desk({ position, color }) {
  return (
    <group position={position}>
      {/* Desktop */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[3, 0.15, 1.5]} />
        <meshStandardMaterial color="#2a2a3a" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Legs */}
      {[[-1.3, 0.6, -0.6], [1.3, 0.6, -0.6], [-1.3, 0.6, 0.6], [1.3, 0.6, 0.6]].map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
          <meshStandardMaterial color="#1a1a2a" metalness={0.5} />
        </mesh>
      ))}
      {/* Monitor */}
      <mesh position={[0, 2, -0.5]}>
        <boxGeometry args={[1.8, 1, 0.08]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 2, -0.45]}>
        <planeGeometry args={[1.6, 0.85]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function Plant({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Pot */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.4, 0.3, 0.8, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      {/* Leaves */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <mesh key={i} position={[0, 1.2 + i * 0.1, 0]} rotation={[0.3, (angle * Math.PI) / 180, 0]}>
          <coneGeometry args={[0.3, 0.8, 4]} />
          <meshStandardMaterial color="#228B22" emissive="#228B22" emissiveIntensity={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function DiscoBall({ position, size = 1 }) {
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* String */}
      <mesh position={[0, size + 1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Ball */}
      <mesh ref={ref}>
        <icosahedronGeometry args={[size, 1]} />
        <meshStandardMaterial
          color="#silver"
          metalness={1}
          roughness={0.1}
          envMapIntensity={2}
        />
      </mesh>
      {/* Light source */}
      <pointLight color="#FF69B4" intensity={3} distance={15} decay={2} />
    </group>
  );
}

function Speaker({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Cabinet */}
      <mesh>
        <boxGeometry args={[1.2, 2, 1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      {/* Woofer */}
      <mesh position={[0, -0.3, 0.51]}>
        <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#333" metalness={0.5} />
      </mesh>
      {/* Tweeter */}
      <mesh position={[0, 0.5, 0.51]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#222" metalness={0.7} />
      </mesh>
    </group>
  );
}

function NeonSign({ position, text, color }) {
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = 1 + Math.sin(state.clock.getElapsedTime() * 3) * 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Backing board */}
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[4, 1.5, 0.1]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Neon tube simulation */}
      <mesh ref={ref}>
        <torusGeometry args={[0.8, 0.08, 8, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
        />
      </mesh>
      <pointLight color={color} intensity={2} distance={8} decay={2} />
    </group>
  );
}

function PresentationBoard({ position, color }) {
  return (
    <group position={position}>
      {/* Stand */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 3, 8]} />
        <meshStandardMaterial color="#333" metalness={0.5} />
      </mesh>
      {/* Board */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[3, 2, 0.1]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      {/* Chart bars */}
      {[-0.8, -0.3, 0.2, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 2 + i * 0.15, 0.06]}>
          <boxGeometry args={[0.35, 0.4 + i * 0.3, 0.02]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function Globe({ position, color }) {
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Stand */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.6, 16]} />
        <meshStandardMaterial color="#8B4513" metalness={0.3} roughness={0.8} />
      </mesh>
      {/* Axis */}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 8]} />
        <meshStandardMaterial color="#DAA520" metalness={0.8} />
      </mesh>
      {/* Globe */}
      <mesh ref={ref} position={[0, 1.2, 0]} rotation={[0, 0, 0.3]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial
          color="#1a5276"
          emissive={color}
          emissiveIntensity={0.1}
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

function MeetingTable({ position, color }) {
  return (
    <group position={position}>
      {/* Table top */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.15, 32]} />
        <meshStandardMaterial color="#3a3a4a" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Center leg */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 1, 16]} />
        <meshStandardMaterial color="#2a2a3a" metalness={0.5} />
      </mesh>
      {/* Chairs */}
      {[0, 90, 180, 270].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * 3.2;
        const z = Math.sin(rad) * 3.2;
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, -rad + Math.PI, 0]}>
            <mesh position={[0, 0.7, 0]}>
              <boxGeometry args={[0.8, 0.1, 0.8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, 1.2, -0.35]}>
              <boxGeometry args={[0.8, 1, 0.1]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function StringLights({ position, color, count = 8, radius = 8 }) {
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((light, i) => {
        const intensity = 0.8 + Math.sin(state.clock.getElapsedTime() * 2 + i) * 0.4;
        if (light.children[0]?.material) {
          light.children[0].material.emissiveIntensity = intensity;
        }
      });
    }
  });

  return (
    <group ref={ref} position={position}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh>
              <sphereGeometry args={[0.25, 8, 8]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={1}
              />
            </mesh>
            <pointLight color={color} intensity={0.5} distance={5} decay={2} />
          </group>
        );
      })}
    </group>
  );
}

function Stage({ position, color }) {
  return (
    <group position={position}>
      {/* Stage platform */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[8, 0.6, 6]} />
        <meshStandardMaterial color="#2a2a3a" />
      </mesh>
      {/* Stage edge lights */}
      <mesh position={[0, 0.62, 2.9]}>
        <boxGeometry args={[7.8, 0.1, 0.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>
      {/* Spotlights */}
      {[-3, 0, 3].map((x, i) => (
        <group key={i} position={[x, 5, 0]}>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <coneGeometry args={[0.5, 1, 8]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <spotLight
            position={[0, -0.5, 0]}
            angle={0.5}
            penumbra={0.5}
            intensity={3}
            color={i === 1 ? color : "#ffffff"}
            distance={10}
          />
        </group>
      ))}
    </group>
  );
}

function CommandPodium({ position, color }) {
  const ringRef = useRef();

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Base platform */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[3, 3.5, 0.3, 6]} />
        <meshStandardMaterial color="#1a1a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Inner ring */}
      <mesh position={[0, 0.35, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[2, 0.1, 8, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      {/* Holographic ring */}
      <group ref={ringRef} position={[0, 2, 0]}>
        <HologramRing position={[0, 0, 0]} color={color} radius={2.5} />
        <HologramRing position={[0, 0.5, 0]} color={color} radius={2} />
        <HologramRing position={[0, 1, 0]} color={color} radius={1.5} />
      </group>
      {/* Center light beam */}
      <pointLight position={[0, 3, 0]} color={color} intensity={5} distance={8} decay={2} />
    </group>
  );
}

function Turntable({ position, color }) {
  const platterRef = useRef();
  const armRef = useRef();

  useFrame((state) => {
    if (platterRef.current) {
      platterRef.current.rotation.y = state.clock.getElapsedTime() * 2;
    }
    if (armRef.current) {
      armRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1 - 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[2.5, 0.3, 2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Platter */}
      <mesh ref={platterRef} position={[-0.3, 0.35, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.05, 32]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Record */}
      <mesh position={[-0.3, 0.38, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.65, 0.65, 0.02, 32]} />
        <meshStandardMaterial color="#050505" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Tonearm */}
      <group ref={armRef} position={[0.8, 0.4, -0.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
          <meshStandardMaterial color={color} metalness={0.8} />
        </mesh>
      </group>
      {/* LED */}
      <mesh position={[1, 0.35, 0.7]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// ── Zone-specific decoration sets ──────────────────────────────────

function DirectorDecorations({ position, color }) {
  return (
    <group position={position}>
      <CommandPodium position={[0, 0, -5]} color={color} />
      <FloatingOrb position={[-8, 4, 8]} color={color} size={0.8} speed={0.8} />
      <FloatingOrb position={[8, 5, 8]} color={color} size={0.6} speed={1.2} />
      <FloatingOrb position={[0, 6, -12]} color={color} size={0.7} speed={1} />
      <Desk position={[10, 0, 5]} color={color} />
      <Plant position={[-12, 0, 12]} scale={1.5} />
      <Plant position={[12, 0, -10]} scale={1.2} />
    </group>
  );
}

function CaptainDecorations({ position, color, variant = "blr" }) {
  return (
    <group position={position}>
      <Desk position={[0, 0, -8]} color={color} />
      <Plant position={[-10, 0, 10]} scale={1.3} />
      <Plant position={[10, 0, 8]} scale={1} />
      <Plant position={[-8, 0, -10]} scale={0.8} />
      <FloatingOrb position={[0, 5, 0]} color={color} size={0.5} />
      {/* Welcome mat area */}
      <mesh position={[0, 0.05, 10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function EventsDecorations({ position, color }) {
  return (
    <group position={position}>
      <DiscoBall position={[0, 8, 0]} size={1.2} />
      <Stage position={[0, 0, -6]} color={color} />
      <StringLights position={[0, 6, 0]} color={color} count={12} radius={12} />
      <Speaker position={[-10, 1, 5]} rotation={[0, 0.3, 0]} />
      <Speaker position={[10, 1, 5]} rotation={[0, -0.3, 0]} />
    </group>
  );
}

function VibeDecorations({ position, color }) {
  return (
    <group position={position}>
      <NeonSign position={[0, 5, -10]} text="VIBES" color={color} />
      <Turntable position={[-5, 1.2, 0]} color={color} />
      <Speaker position={[-10, 1, -5]} rotation={[0, Math.PI / 4, 0]} />
      <Speaker position={[10, 1, -5]} rotation={[0, -Math.PI / 4, 0]} />
      <FloatingOrb position={[-6, 4, 6]} color="#E040FB" size={0.4} speed={1.5} />
      <FloatingOrb position={[6, 3, 6]} color="#00E5FF" size={0.35} speed={1.8} />
      <FloatingOrb position={[0, 5, -5]} color={color} size={0.5} speed={1} />
      <Plant position={[10, 0, 8]} scale={1} />
    </group>
  );
}

function SalesDecorations({ position, color }) {
  return (
    <group position={position}>
      <PresentationBoard position={[0, 0, -8]} color={color} />
      <Desk position={[-8, 0, 5]} color={color} />
      <Desk position={[8, 0, 5]} color={color} />
      <Plant position={[-12, 0, -8]} scale={1.2} />
      <Plant position={[12, 0, -8]} scale={1} />
      <FloatingOrb position={[0, 6, 0]} color={color} size={0.6} speed={0.7} />
    </group>
  );
}

function BDDecorations({ position, color }) {
  return (
    <group position={position}>
      <MeetingTable position={[0, 0, 2]} color={color} />
      <Globe position={[10, 1.5, -8]} color={color} />
      <PresentationBoard position={[-10, 0, -6]} color={color} />
      <Plant position={[-12, 0, 8]} scale={1.3} />
      <Plant position={[12, 0, 10]} scale={1} />
      <FloatingOrb position={[0, 5, -5]} color={color} size={0.5} speed={0.9} />
    </group>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function ZoneDecorations() {
  const zones = ZONE_POSITIONS;

  return (
    <group>
      {/* Director/HQ */}
      <DirectorDecorations
        position={zones.director.position}
        color={zones.director.color}
      />

      {/* Captain BLRxZo */}
      <CaptainDecorations
        position={zones["captain-blrxzo"].position}
        color={zones["captain-blrxzo"].color}
        variant="blr"
      />

      {/* Captain WTFxZo */}
      <CaptainDecorations
        position={zones["captain-wtfxzo"].position}
        color={zones["captain-wtfxzo"].color}
        variant="wtf"
      />

      {/* Events */}
      <EventsDecorations
        position={zones.events.position}
        color={zones.events.color}
      />

      {/* Vibe Curator */}
      <VibeDecorations
        position={zones["vibe-curator"].position}
        color={zones["vibe-curator"].color}
      />

      {/* Sales */}
      <SalesDecorations
        position={zones.sales.position}
        color={zones.sales.color}
      />

      {/* Business Dev */}
      <BDDecorations
        position={zones.bd.position}
        color={zones.bd.color}
      />
    </group>
  );
}
