import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Lighting.jsx — Warm studio-style lighting rig for the Zo House 3D Command Center.
 *
 * Bright, warm lighting that makes characters pop against the dark background.
 * No colored point lights — clean, well-lit studio feel.
 */
export default function Lighting() {
  const dirLightRef = useRef();

  // Optional: subtle light animation (slow drift) to feel alive
  useFrame(({ clock }) => {
    if (dirLightRef.current) {
      const t = clock.getElapsedTime();
      dirLightRef.current.position.x = 10 + Math.sin(t * 0.1) * 2;
      dirLightRef.current.position.z = 10 + Math.cos(t * 0.1) * 2;
    }
  });

  return (
    <>
      {/* Neutral white ambient fill — keeps everything visible */}
      <ambientLight intensity={1.0} color="#ffffff" />

      {/* Hemisphere light — warm cream sky, warm brown ground */}
      <hemisphereLight
        skyColor="#ffeedd"
        groundColor="#443322"
        intensity={1.0}
      />

      {/* Primary directional light — bright white from above-front, casts shadows */}
      <directionalLight
        ref={dirLightRef}
        position={[10, 20, 10]}
        intensity={3.0}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
      />

      {/* Fill directional light — warm tint from opposite side */}
      <directionalLight
        position={[-8, 12, -8]}
        intensity={1.5}
        color="#ffddcc"
      />
    </>
  );
}
