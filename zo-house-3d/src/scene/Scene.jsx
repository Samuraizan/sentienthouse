import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import ZoneModel from "./ZoneModel";
import Lighting from "./Lighting";
import Zones from "./Zones";
import ZoneDecorations from "./ZoneDecorations";
import AgentCharacters from "./AgentCharacters";
import AgentConnections from "./AgentConnections";
import CameraController from "./CameraController";
import Effects from "./Effects";
import ChatBubbles from "./ChatBubbles";

/**
 * Scene.jsx — Main Three.js scene for the Zo House 3D Command Center.
 *
 * Department-based zone layout with warm dark theme inspired by Ralv.ai.
 * Wider camera start position to accommodate the spread-out layout.
 */

import { Physics } from "@react-three/rapier";

function SceneContent() {
  return (
    <Physics gravity={[0, -9.81, 0]}>
      {/* Camera controller — handles presets, agent focus, cinematic orbit */}
      <CameraController />

      {/* Very subtle fog — wide for 3-island layout (±91 spread) */}
      {/* Dusk fog — warm purple haze */}
      <fog attach="fog" args={["#2a1535", 120, 450]} />

      {/* Lighting rig */}
      <Lighting />

      {/* Custom 3D World Model (Replaces Voxels) */}
      <ZoneModel />

      {/* 3 Zone Platforms — HQ center, BLRxZo House left, WTFxZo House right */}
      {/* Kept for logical positioning/debugging, but visuals might overlap */}
      <Zones />

      {/* Themed decorations disabled — GLTF model has baked equipment */}
      {/* <ZoneDecorations /> */}

      {/* 7 Animated Character Models — distributed across 3 zones */}
      <AgentCharacters />

      {/* Visual connection beams during agent meetings */}
      <AgentConnections />

      {/* Chat bubbles above active agents */}
      <ChatBubbles />

      {/* Atmospheric visual effects — particles, connection lines, glows, orbs */}
      <Effects />
    </Physics>
  );
}

export default function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.5,
      }}
      camera={{
        position: [110, 80, 100],
        fov: 45,
        near: 0.1,
        far: 600,
      }}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <color attach="background" args={["#1a1028"]} />
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
