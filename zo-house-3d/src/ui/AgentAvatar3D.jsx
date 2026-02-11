import { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, OrbitControls, Environment } from "@react-three/drei";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

/**
 * AgentAvatar3D.jsx — 3D character viewer for the skill tree modal
 * 
 * Renders the agent's actual 3D model in a mini canvas, with idle animation
 * and subtle rotation. Used as the centerpiece of the skill tree graph.
 */

const CHARACTER_MODELS = {
  zomadprime: "/models/characters/zomadprime.glb",
  "blrxzo-jr": "/models/characters/blrxzo-jr.glb",
  "wtfxzo-jr": "/models/characters/wtfxzo-jr.glb",
  suki: "/models/characters/suki.glb",
  loki: "/models/characters/loki.glb",
  wanda: "/models/characters/wanda.glb",
  yana: "/models/characters/yana.glb",
};

function findAction(actions, ...names) {
  for (const n of names) {
    if (actions[n]) return actions[n];
    const prefixed = `CharacterArmature|${n}`;
    if (actions[prefixed]) return actions[prefixed];
  }
  return null;
}

function CharacterModel({ modelPath, agentColor, autoRotate = true }) {
  const groupRef = useRef();
  const { scene, animations } = useGLTF(modelPath);
  const clonedScene = useMemo(() => skeletonClone(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, groupRef);

  // Apply color tint
  useEffect(() => {
    const color = new THREE.Color(agentColor);
    clonedScene.traverse((child) => {
      if (child.isSkinnedMesh || child.isMesh) {
        child.material = child.material.clone();
        child.material.emissive = color.clone().multiplyScalar(0.2);
        child.material.emissiveIntensity = 0.8;
        child.material.needsUpdate = true;
      }
    });
  }, [clonedScene, agentColor]);

  // Play idle animation
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;
    const idleAction = findAction(actions, "Idle");
    if (idleAction) {
      idleAction.reset();
      idleAction.setLoop(THREE.LoopRepeat, Infinity);
      idleAction.timeScale = 0.7;
      idleAction.fadeIn(0.3).play();
    }
  }, [actions]);

  // Update mixer and auto-rotate
  useFrame((state, delta) => {
    if (mixer) mixer.update(delta);
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[0, -2.5, 0]}>
      <primitive object={clonedScene} scale={[2.8, 2.8, 2.8]} />
    </group>
  );
}

function FallbackAvatar({ agentColor }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <capsuleGeometry args={[0.8, 1.5, 8, 16]} />
      <meshStandardMaterial 
        color={agentColor} 
        emissive={agentColor}
        emissiveIntensity={0.3}
        metalness={0.2}
        roughness={0.7}
      />
    </mesh>
  );
}

export default function AgentAvatar3D({ 
  agentId, 
  agentColor = "#8888ff",
  agentName = "",
  status = "offline",
  currentTask = null,
  size = 200 
}) {
  const modelPath = CHARACTER_MODELS[agentId];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        background: `radial-gradient(circle at 50% 50%, ${agentColor}15 0%, transparent 70%)`,
        border: `2px solid ${agentColor}40`,
        boxShadow: `0 0 40px ${agentColor}30, inset 0 0 60px ${agentColor}10`,
      }}
    >
      <Canvas
        camera={{
          position: [0, 2, 8],
          fov: 35,
          near: 0.1,
          far: 100,
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          preserveDrawingBuffer: true,
        }}
        style={{ background: "transparent" }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} color={agentColor} />
        <pointLight position={[0, -2, 3]} intensity={0.8} color={agentColor} distance={10} />
        
        {/* Character */}
        <Suspense fallback={<FallbackAvatar agentColor={agentColor} />}>
          {modelPath ? (
            <CharacterModel 
              modelPath={modelPath} 
              agentColor={agentColor}
              autoRotate={true}
            />
          ) : (
            <FallbackAvatar agentColor={agentColor} />
          )}
        </Suspense>

        {/* Orbit controls for user interaction */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
          autoRotate={false}
        />
      </Canvas>

      {/* Status ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `3px solid ${status === "active" || status === "online" ? "#44ffaa" : status === "idle" ? "#ffaa44" : "#666"}`,
          pointerEvents: "none",
          animation: status === "active" ? "pulse-glow 2s infinite" : "none",
        }}
      />

      {/* Agent name badge */}
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0, 0, 0, 0.8)",
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: 600,
          color: agentColor,
          whiteSpace: "nowrap",
          fontFamily: "Inter, -apple-system, sans-serif",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        {agentName}
      </div>

      {/* Current task indicator */}
      {currentTask && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(34, 197, 94, 0.9)",
            padding: "3px 10px",
            borderRadius: "10px",
            fontSize: "9px",
            fontWeight: 600,
            color: "#fff",
            whiteSpace: "nowrap",
            fontFamily: "Inter, -apple-system, sans-serif",
            maxWidth: "90%",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          ⚡ Working
        </div>
      )}
    </div>
  );
}
