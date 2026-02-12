import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Lighting.jsx — Dusk / golden-hour lighting rig for the Zo House 3D Command Center.
 *
 * Warm amber key light, cool purple-blue fill from opposite side,
 * hemisphere blending warm sky into cool ground — sunset feel.
 */
export default function Lighting() {
  const dirLightRef = useRef();

  // Subtle light drift to feel alive
  useFrame(({ clock }) => {
    if (dirLightRef.current) {
      const t = clock.getElapsedTime();
      dirLightRef.current.position.x = 10 + Math.sin(t * 0.1) * 2;
      dirLightRef.current.position.z = 10 + Math.cos(t * 0.1) * 2;
    }
  });

  return (
    <>
      {/* Ambient fill — warm tint, lower intensity for dusk contrast */}
      <ambientLight intensity={0.6} color="#ffd4a8" />

      {/* Hemisphere light — warm peach sky fading to deep purple ground */}
      <hemisphereLight
        skyColor="#ff9966"
        groundColor="#2a1535"
        intensity={0.8}
      />

      {/* Key light — warm amber sun low on the horizon, casts long shadows */}
      <directionalLight
        ref={dirLightRef}
        position={[10, 12, 10]}
        intensity={2.5}
        color="#ffaa55"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0005}
      />

      {/* Fill light — cool purple-blue from opposite side for dusk contrast */}
      <directionalLight
        position={[-8, 12, -8]}
        intensity={1.0}
        color="#8866cc"
      />

      {/* Rim light — faint warm backlight to outline silhouettes */}
      <directionalLight
        position={[-5, 8, 15]}
        intensity={0.6}
        color="#ff7744"
      />
    </>
  );
}
