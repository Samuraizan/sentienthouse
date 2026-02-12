
import React, { useEffect, useMemo } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import useAgentStore from "../store/agentStore";

/**
 * ZoneModel.jsx
 * Loads the custom 3D world model (zonespack) to replace procedural voxels.
 * A larger procedural platform extends the walkable area around the GLTF model.
 */

// Meshes to hide: balloon/sign (blimp), skybox sphere, shadow plane
const HIDDEN_MATERIALS = new Set([
    "BALOON", "BALOON_BULB", "BALOON_CURVE",
    "sphere",              // 36k-unit skybox sphere
    "ISLAND_BASE_SHADOW",  // flat shadow plane (z-fighting)
]);

/**
 * Extended HQ platform — larger organic disc that sits under the GLTF model.
 * Matches the island's sandy gold top + purple tapered underside.
 */
function ExtendedPlatform() {
    // Organic edge noise for the top disc
    const topGeo = useMemo(() => {
        const radius = 55;
        const geo = new THREE.CylinderGeometry(radius, radius, 0.6, 64);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const dist = Math.sqrt(x * x + z * z);
            if (dist > 2) {
                const angle = Math.atan2(z, x);
                const wobble = Math.sin(angle * 5) * 3 + Math.cos(angle * 7.3) * 2;
                const factor = 1 + wobble / radius;
                pos.setX(i, x * factor);
                pos.setZ(i, z * factor);
            }
        }
        geo.computeVertexNormals();
        return geo;
    }, []);

    // Organic edge noise for the underside taper
    const taperGeo = useMemo(() => {
        const geo = new THREE.CylinderGeometry(54, 16, 20, 48, 6);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);
            const dist = Math.sqrt(x * x + z * z);
            if (dist > 2) {
                const angle = Math.atan2(z, x);
                const wobble = Math.sin(angle * 4) * 2 + Math.cos(angle * 6) * 1.5;
                // Less wobble near the narrow bottom
                const yFactor = (y + 10) / 20; // 0 at bottom, 1 at top
                const factor = 1 + (wobble / 54) * yFactor;
                pos.setX(i, x * factor);
                pos.setZ(i, z * factor);
            }
        }
        geo.computeVertexNormals();
        return geo;
    }, []);

    return (
        <group position={[0, 0, 0]}>
            {/* Thin flat top — top surface at Y=0, flush with original island */}
            <mesh geometry={topGeo} position={[0, -0.3, 0]} receiveShadow castShadow>
                <meshStandardMaterial
                    color="#f0d090"
                    roughness={0.85}
                    metalness={0.05}
                />
            </mesh>

            {/* Purple tapered underside — starts just below the disc */}
            <mesh geometry={taperGeo} position={[0, -10.6, 0]} castShadow>
                <meshStandardMaterial
                    color="#6b2fa0"
                    roughness={0.6}
                    metalness={0.2}
                    flatShading={true}
                />
            </mesh>
        </group>
    );
}

/**
 * BigScreenText — "WE ARE ALIVE" on the main monitor when gateway is connected.
 * Positioned to overlay the big screen mesh in the GLTF model.
 */
function BigScreenText() {
    const connected = useAgentStore((s) => s.gatewayStatus.connected);
    const agentCount = useAgentStore((s) => s.gatewayStatus.agentCount);

    return (
        <Html
            position={[1, 24, -10]}
            center
            distanceFactor={12}
            occlude={false}
            transform
            rotation={[0, 0, 0]}
            style={{ pointerEvents: "none", userSelect: "none" }}
            zIndexRange={[50, 0]}
        >
            <div style={{
                width: "500px",
                textAlign: "center",
                fontFamily: "Inter, SF Pro Display, -apple-system, monospace",
            }}>
                {connected ? (
                    <>
                        <div style={{
                            fontSize: "64px",
                            fontWeight: 800,
                            color: "#ffffff",
                            textShadow: "0 0 20px rgba(255,255,255,0.6), 0 0 40px rgba(255,255,255,0.3)",
                            letterSpacing: "8px",
                            textTransform: "uppercase",
                        }}>
                            We Are Alive
                        </div>
                        <div style={{
                            fontSize: "18px",
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.5)",
                            marginTop: "10px",
                            letterSpacing: "4px",
                        }}>
                            {agentCount}/7 AGENTS ONLINE
                        </div>
                    </>
                ) : (
                    <div style={{
                        fontSize: "48px",
                        fontWeight: 600,
                        color: "#ff4444",
                        textShadow: "0 0 25px rgba(255,68,68,0.6)",
                        letterSpacing: "4px",
                    }}>
                        DISCONNECTED
                    </div>
                )}
            </div>
        </Html>
    );
}

export default function ZoneModel() {
    const { scene } = useGLTF("/models/zones/scene.gltf");

    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                // Hide the balloon/blimp + Hedgehog sign
                if (HIDDEN_MATERIALS.has(child.material?.name)) {
                    child.visible = false;
                    return;
                }
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [scene]);

    return (
        <group dispose={null}>
            {/* Extended platform underneath — 2x walkable area */}
            <ExtendedPlatform />

            {/* Original GLTF model at original scale — equipment untouched */}
            <RigidBody type="fixed" colliders="trimesh">
                <primitive
                    object={scene}
                    scale={[0.04287, 0.04287, 0.04287]}
                    position={[0.81, 0.19, 1.22]}
                    rotation={[0, 0, 0]}
                />
            </RigidBody>

            {/* "WE ARE ALIVE" text overlaid on the big screen */}
            <BigScreenText />
        </group>
    );
}

useGLTF.preload("/models/zones/scene.gltf");
