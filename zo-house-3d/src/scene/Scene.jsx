import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Floor from "./Floor";
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

function SceneContent() {
  return (
    <>
      {/* Camera controller — handles presets, agent focus, cinematic orbit */}
      <CameraController />

      {/* Very subtle fog — wider for 3-zone layout */}
      <fog attach="fog" args={["#1a1820", 140, 400]} />

      {/* Lighting rig */}
      <Lighting />

      {/* Ground plane */}
      <Floor />

      {/* 3 Zone Platforms — HQ center, BLRxZo House left, WTFxZo House right */}
      <Zones />

      {/* Themed decorations for each zone's workspace */}
      <ZoneDecorations />

      {/* 7 Animated Character Models — distributed across 3 zones */}
      <AgentCharacters />

      {/* Visual connection beams during agent meetings */}
      <AgentConnections />

      {/* Chat bubbles above active agents */}
      <ChatBubbles />

      {/* Atmospheric visual effects — particles, connection lines, glows, orbs */}
      <Effects />
    </>
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
        position: [90, 70, 90],
        fov: 45,
        near: 0.1,
        far: 500,
      }}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <color attach="background" args={["#1a1820"]} />
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
