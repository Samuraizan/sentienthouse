import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useRef, useEffect, useMemo, useState, useCallback, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * AgentCharacter.jsx — Individual 3D character for an agent in the Command Center.
 *
 * Loads a KayKit Adventurer GLB model, plays status-based animations with
 * smooth crossfade transitions, handles click-to-select with visual selection
 * ring, and applies color tinting.
 *
 * Name labels use drei Html component (billboard) positioned well above the
 * character head (Y=7+) so they never clip inside the model.
 *
 * Props:
 *   modelPath     — path to the .glb file
 *   position      — [x, y, z] world position
 *   color         — optional hex color string for tinting mesh materials
 *   status        — agent status string (active|idle|online|dormant|standby|offline)
 *   agentId       — unique agent identifier string
 *   agentName     — display name for label
 *   agentRole     — role/department label
 *   rotation      — optional [x, y, z] Euler rotation override
 *   isSelected    — boolean, whether this agent is currently selected
 *   onSelect      — callback(agentId) when character is clicked
 *   agentColor    — hex color for the selection ring (from store)
 */

// ── Animation name resolution helpers ──────────────────────────────
function findAction(actions, ...names) {
  for (const n of names) {
    if (actions[n]) return actions[n];
    const prefixed = `CharacterArmature|${n}`;
    if (actions[prefixed]) return actions[prefixed];
  }
  return null;
}

const STATUS_ANIMATION_MAP = {
  active:  ["Running_A", "Run", "Walking_A"],
  idle:    ["Idle"],
  online:  ["Idle"],
  dormant: ["Idle"],
  standby: ["Idle"],
  offline: ["Idle"],
};

const STATUS_TIMESCALE = {
  active:  1.0,
  idle:    0.8,
  online:  0.9,
  dormant: 0.3,
  standby: 0.3,
  offline: 0.1,
};

const CROSSFADE_DURATION = 0.3;

function AgentCharacter({
  modelPath,
  position = [0, 0, 0],
  color = null,
  status = "offline",
  agentId = "",
  agentName = "",
  agentRole = "",
  rotation = null,
  isSelected = false,
  onSelect = null,
  agentColor = "#8888ff",
}) {
  const groupRef = useRef();
  const selectionRingRef = useRef();
  const selectionGlowRef = useRef();
  const currentActionRef = useRef(null);
  const currentStatusRef = useRef(null);
  const selectAnimTimeoutRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  const { scene, animations } = useGLTF(modelPath);
  const clonedScene = useMemo(() => skeletonClone(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, groupRef);

  // Compute rotation to face center [0, 0, 0] from the character position
  const faceCenter = useMemo(() => {
    if (rotation) return rotation;
    const dx = 0 - position[0];
    const dz = 0 - position[2];
    const angle = Math.atan2(dx, dz);
    return [0, angle, 0];
  }, [position, rotation]);

  // Parse tint color
  const tintColor = useMemo(() => {
    if (!color) return null;
    return new THREE.Color(color);
  }, [color]);

  // Parse agent/selection ring color
  const ringColor = useMemo(() => new THREE.Color(agentColor), [agentColor]);
  const ringBrightColor = useMemo(() => {
    const c = new THREE.Color(agentColor);
    c.multiplyScalar(1.5);
    return c;
  }, [agentColor]);

  // ── Apply color tint to skinned meshes ───────────────────────
  useEffect(() => {
    if (!tintColor) return;
    clonedScene.traverse((child) => {
      if (child.isSkinnedMesh || child.isMesh) {
        child.material = child.material.clone();
        child.material.color.multiply(tintColor);
        child.material.emissive = tintColor.clone().multiplyScalar(0.15);
        child.material.emissiveIntensity = 0.5;
        child.material.needsUpdate = true;
      }
    });
  }, [clonedScene, tintColor]);

  // ── Apply emissive glow when status is active ────────────────
  useEffect(() => {
    const isActive = status === "active" || status === "online";
    const isOffline = status === "offline";
    clonedScene.traverse((child) => {
      if (child.isSkinnedMesh || child.isMesh) {
        if (!child.material._originalEmissive) {
          child.material._originalEmissive = child.material.emissive
            ? child.material.emissive.clone()
            : new THREE.Color(0, 0, 0);
          child.material._originalEmissiveIntensity =
            child.material.emissiveIntensity || 0;
          child.material._originalColor = child.material.color
            ? child.material.color.clone()
            : new THREE.Color(1, 1, 1);
        }
        if (isActive) {
          if (tintColor) {
            child.material.emissive = tintColor.clone().multiplyScalar(0.3);
          } else {
            child.material.emissive = new THREE.Color(0.15, 0.15, 0.3);
          }
          child.material.emissiveIntensity = 0.8;
          child.material.color.copy(child.material._originalColor);
          if (tintColor) child.material.color.multiply(tintColor);
        } else if (isOffline) {
          child.material.emissive = child.material._originalEmissive.clone();
          child.material.emissiveIntensity = child.material._originalEmissiveIntensity;
          const col = child.material._originalColor.clone();
          if (tintColor) col.multiply(tintColor);
          const gray = (col.r + col.g + col.b) / 3;
          col.r = col.r * 0.3 + gray * 0.7;
          col.g = col.g * 0.3 + gray * 0.7;
          col.b = col.b * 0.3 + gray * 0.7;
          col.multiplyScalar(0.5);
          child.material.color.copy(col);
        } else {
          child.material.emissive = child.material._originalEmissive.clone();
          child.material.emissiveIntensity =
            child.material._originalEmissiveIntensity;
          child.material.color.copy(child.material._originalColor);
          if (tintColor) child.material.color.multiply(tintColor);
        }
        child.material.needsUpdate = true;
      }
    });
  }, [clonedScene, status, tintColor]);

  // ── Enable shadow casting on all meshes ──────────────────────
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  // ── Helper: crossfade to a new action ────────────────────────
  const crossFadeTo = useCallback(
    (newAction, duration = CROSSFADE_DURATION, timeScale = 1.0) => {
      if (!newAction) return;
      const prev = currentActionRef.current;
      newAction.reset();
      newAction.setLoop(THREE.LoopRepeat, Infinity);
      newAction.timeScale = timeScale;
      newAction.clampWhenFinished = false;
      if (prev && prev !== newAction) {
        newAction.crossFadeFrom(prev, duration, true);
      }
      newAction.fadeIn(duration).play();
      currentActionRef.current = newAction;
    },
    []
  );

  // ── Helper: play a one-shot animation then return to status anim ──
  const playOneShot = useCallback(
    (clipName, onComplete) => {
      const action = findAction(actions, clipName);
      if (!action) {
        if (onComplete) onComplete();
        return;
      }
      const prev = currentActionRef.current;
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.timeScale = 1.0;
      if (prev) {
        action.crossFadeFrom(prev, CROSSFADE_DURATION, true);
      }
      action.fadeIn(CROSSFADE_DURATION).play();
      currentActionRef.current = action;

      const onFinished = (e) => {
        if (e.action === action) {
          mixer.removeEventListener("finished", onFinished);
          if (onComplete) onComplete();
        }
      };
      mixer.addEventListener("finished", onFinished);
    },
    [actions, mixer]
  );

  // ── Status-based animation switching ─────────────────────────
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;

    if (selectAnimTimeoutRef.current) {
      clearTimeout(selectAnimTimeoutRef.current);
      selectAnimTimeoutRef.current = null;
    }

    const animNames = STATUS_ANIMATION_MAP[status] || STATUS_ANIMATION_MAP.offline;
    const timeScale = STATUS_TIMESCALE[status] ?? 1.0;

    const targetAction = findAction(actions, ...animNames);
    if (!targetAction) {
      const firstKey = Object.keys(actions)[0];
      if (firstKey && actions[firstKey]) {
        crossFadeTo(actions[firstKey], CROSSFADE_DURATION, timeScale);
      }
    } else {
      crossFadeTo(targetAction, CROSSFADE_DURATION, timeScale);
    }

    currentStatusRef.current = status;

    return () => {
      if (selectAnimTimeoutRef.current) {
        clearTimeout(selectAnimTimeoutRef.current);
      }
    };
  }, [actions, status, crossFadeTo]);

  // ── Selection animation: play Wave then return to status anim ──
  useEffect(() => {
    if (!isSelected || !actions || Object.keys(actions).length === 0) return;

    playOneShot("Wave", () => {
      const animNames = STATUS_ANIMATION_MAP[status] || STATUS_ANIMATION_MAP.offline;
      const timeScale = STATUS_TIMESCALE[status] ?? 1.0;
      const targetAction = findAction(actions, ...animNames);
      if (targetAction) {
        crossFadeTo(targetAction, CROSSFADE_DURATION, timeScale);
      }
    });
  }, [isSelected, actions, status, playOneShot, crossFadeTo]);

  // ── Cursor pointer on hover ──────────────────────────────────
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  // ── Click handler ────────────────────────────────────────────
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (onSelect) onSelect(agentId);
    },
    [onSelect, agentId]
  );

  const handlePointerEnter = useCallback((e) => {
    e.stopPropagation();
    setHovered(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
  }, []);

  // ── Update mixer + selection ring animation each frame ───────
  useFrame((state, delta) => {
    if (mixer) mixer.update(delta);

    if (selectionRingRef.current) {
      const t = state.clock.getElapsedTime();
      selectionRingRef.current.rotation.z = t * 0.5;
      const pulse = 1.0 + Math.sin(t * 2.5) * 0.08;
      selectionRingRef.current.scale.set(pulse, pulse, 1);
    }
    if (selectionGlowRef.current) {
      const t = state.clock.getElapsedTime();
      selectionGlowRef.current.material.opacity =
        0.15 + Math.sin(t * 3.0) * 0.1;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={faceCenter}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <primitive
        object={clonedScene}
        scale={[2.5, 2.5, 2.5]}
        position={[0, 0, 0]}
      />

      {/* Shadow disc on the ground beneath the character */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        receiveShadow
      >
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* ── Name label using Html billboard — positioned well above head ── */}
      <Html
        position={[0, 7.5, 0]}
        center={true}
        distanceFactor={15}
        occlude={false}
        style={{ pointerEvents: "none", userSelect: "none" }}
        zIndexRange={[100, 0]}
      >
        <div style={{
          fontFamily: "Inter, SF Pro Display, -apple-system, sans-serif",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}>
          <div style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#ffffff",
            textShadow: "0 0 6px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.5)",
            lineHeight: 1.2,
          }}>
            {agentName}
          </div>
          <div style={{
            fontSize: "11px",
            fontWeight: 500,
            color: agentColor,
            textShadow: "0 0 6px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.7)",
            marginTop: "2px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            opacity: 0.85,
          }}>
            {agentRole}
          </div>
        </div>
      </Html>

      {/* ── Selection ring — visible only when selected ──────── */}
      {isSelected && (
        <>
          <mesh
            ref={selectionRingRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.05, 0]}
          >
            <torusGeometry args={[1.2, 0.05, 8, 64]} />
            <meshStandardMaterial
              color={agentColor}
              emissive={ringBrightColor}
              emissiveIntensity={2.0}
              transparent
              opacity={0.9}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>

          <mesh
            ref={selectionGlowRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.04, 0]}
          >
            <ringGeometry args={[0.8, 1.4, 64]} />
            <meshBasicMaterial
              color={agentColor}
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          <pointLight
            position={[0, 0.5, 0]}
            color={agentColor}
            intensity={1.5}
            distance={4}
            decay={2}
          />
        </>
      )}
    </group>
  );
}

export default memo(AgentCharacter);
