import { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, OrbitControls } from "@react-three/drei";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

/**
 * AgentAvatar3D.jsx — 3D character viewer for the skill tree modal
 * 
 * Renders the agent's actual 3D model in a mini canvas, with idle animation
 * and subtle rotation. Used as the centerpiece of the skill tree graph.
 */

// Character model paths - same as main scene uses
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
    <group ref={groupRef} position={[0, -1.4, 0]}>
      <primitive object={clonedScene} scale={[1.6, 1.6, 1.6]} />
    </group>
  );
}

function FallbackAvatar({ agentColor, agentName = "" }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.4;
    }
  });

  // Create a stylized avatar shape (humanoid silhouette)
  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* Head */}
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial 
          color={agentColor} 
          emissive={agentColor}
          emissiveIntensity={0.5}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.3, 0.9, 8, 16]} />
        <meshStandardMaterial 
          color={agentColor} 
          emissive={agentColor}
          emissiveIntensity={0.4}
          metalness={0.2}
          roughness={0.7}
        />
      </mesh>
      {/* Glow ring at feet */}
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.04, 8, 32]} />
        <meshStandardMaterial 
          color={agentColor} 
          emissive={agentColor}
          emissiveIntensity={1.2}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

export default function AgentAvatar3D({ 
  agentId, 
  agentColor = "#8888ff",
  agentName = "",
  status = "offline",
  currentTask = null,
  size = 120,  // Smaller default size
  modelPath: providedModelPath = null,  // Allow passing model path directly
}) {
  // Use provided path or look up from config
  const modelPath = providedModelPath || CHARACTER_MODELS[agentId];

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
          position: [0, 0.8, 6.5],
          fov: 30,
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
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1} />
        <directionalLight position={[-3, 4, -3]} intensity={0.4} color={agentColor} />
        <pointLight position={[0, 0, 3]} intensity={0.6} color={agentColor} distance={8} />
        
        {/* Character */}
        <Suspense fallback={<FallbackAvatar agentColor={agentColor} agentName={agentName} />}>
          {modelPath ? (
            <CharacterModel 
              modelPath={modelPath} 
              agentColor={agentColor}
              autoRotate={true}
            />
          ) : (
            <FallbackAvatar agentColor={agentColor} agentName={agentName} />
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
          border: `2px solid ${status === "active" || status === "online" ? "#44ffaa" : status === "idle" ? "#ffaa44" : "#555"}`,
          pointerEvents: "none",
          animation: status === "active" ? "pulse-glow 2s infinite" : "none",
        }}
      />

      {/* Agent initial badge - shows first letter */}
      <div
        style={{
          position: "absolute",
          bottom: "4px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0, 0, 0, 0.85)",
          padding: "2px 8px",
          borderRadius: "8px",
          fontSize: size > 100 ? "10px" : "8px",
          fontWeight: 700,
          color: agentColor,
          whiteSpace: "nowrap",
          fontFamily: "Inter, -apple-system, sans-serif",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          maxWidth: "90%",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {agentName}
      </div>

      {/* Current task indicator */}
      {currentTask && size > 80 && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(34, 197, 94, 0.9)",
            padding: "2px 6px",
            borderRadius: "6px",
            fontSize: "8px",
            fontWeight: 600,
            color: "#fff",
            whiteSpace: "nowrap",
            fontFamily: "Inter, -apple-system, sans-serif",
          }}
        >
          ⚡
        </div>
      )}
    </div>
  );
}
