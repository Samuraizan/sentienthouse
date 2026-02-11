import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useRef, useEffect, useMemo, useState, useCallback, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Html } from "@react-three/drei";
import * as THREE from "three";
import useAgentStore from "../store/agentStore";

/**
 * AgentCharacter.jsx — Game-like AI agent simulation
 *
 * Agents work, collaborate, think, celebrate, and grind 24/7 like characters
 * in a simulation game, but doing actual Zo House work.
 *
 * Behaviors:
 *   - 💻 Working: Typing at their station, processing tasks
 *   - 🤔 Thinking: Pondering, problem-solving
 *   - 🎉 Celebrating: Task complete celebrations
 *   - ☕ Break: Quick coffee/stretch break
 *   - 🚶 Wandering: Moving around their zone
 *   - 🏃 Traveling: Running to meet another agent
 *   - 💬 Meeting: Collaborating with another agent
 */

// ── Animation helpers ──────────────────────────────────────────────
function findAction(actions, ...names) {
  for (const n of names) {
    if (actions[n]) return actions[n];
    const prefixed = `CharacterArmature|${n}`;
    if (actions[prefixed]) return actions[prefixed];
  }
  return null;
}

// Animation sets
const WALK_ANIMS = ["Walking_A", "Walking_B", "Walk"];
const RUN_ANIMS = ["Running_A", "Running_B", "Run"];
const IDLE_ANIMS = ["Idle"];
const WAVE_ANIMS = ["Wave"];
const INTERACT_ANIMS = ["Interact", "PickUp"];
const CHEER_ANIMS = ["Cheer", "Jump"];

// Game-like work activities
const WORK_ACTIVITIES = [
  { text: "Processing requests...", emoji: "⚡", duration: [8, 15] },
  { text: "Analyzing data...", emoji: "📊", duration: [6, 12] },
  { text: "Sending messages...", emoji: "💬", duration: [4, 8] },
  { text: "Updating systems...", emoji: "🔄", duration: [5, 10] },
  { text: "Writing responses...", emoji: "✍️", duration: [6, 12] },
  { text: "Reviewing tasks...", emoji: "📋", duration: [4, 8] },
  { text: "Syncing channels...", emoji: "📡", duration: [3, 6] },
  { text: "Optimizing workflow...", emoji: "⚙️", duration: [5, 10] },
];

const THINKING_ACTIVITIES = [
  { text: "Thinking...", emoji: "🤔" },
  { text: "Planning next move...", emoji: "🎯" },
  { text: "Processing...", emoji: "💭" },
  { text: "Strategizing...", emoji: "🧠" },
];

const BREAK_ACTIVITIES = [
  { text: "Quick break", emoji: "☕" },
  { text: "Stretching", emoji: "🧘" },
  { text: "Recharging", emoji: "🔋" },
];

const CELEBRATION_MESSAGES = [
  "+1 Task Complete! 🎉",
  "Nailed it! ✨",
  "Mission success! 🚀",
  "Done & dusted! ✅",
  "Another one! 💪",
];

// Status-based activity (higher = more work)
const STATUS_ACTIVITY = {
  active: 1.0,
  idle: 0.4,
  online: 0.7,
  dormant: 0.1,
  standby: 0.2,
  offline: 0.02,
};

// Movement speeds
const WALK_SPEED = 2.0;
const RUN_SPEED = 5.5;

// Behavior timings (seconds)
const WORK_CHANCE = 0.6;        // Chance to start working vs other activity
const VISIT_INTERVAL = [20, 50]; // Time between visits
const MEETING_DURATION = [5, 10]; // How long meetings last

const CROSSFADE_DURATION = 0.25;

function AgentCharacter({
  modelPath,
  position = [0, 0, 0],
  zoneSize = [10, 10],
  color = null,
  status = "offline",
  agentId = "",
  agentName = "",
  agentRole = "",
  isSelected = false,
  onSelect = null,
  agentColor = "#8888ff",
  allAgentPositions = {},
  currentTask = null, // Real task from the backend
}) {
  const groupRef = useRef();
  const characterRef = useRef();
  const selectionRingRef = useRef();
  const selectionGlowRef = useRef();
  const currentActionRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  // Game state for UI
  const [currentMode, setCurrentMode] = useState("idle");
  const [activityText, setActivityText] = useState("");
  const [activityEmoji, setActivityEmoji] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const [tasksCompleted, setTasksCompleted] = useState(0);

  // Store actions
  const startVisit = useAgentStore((s) => s.startVisit);
  const startMeeting = useAgentStore((s) => s.startMeeting);
  const endVisit = useAgentStore((s) => s.endVisit);

  // Agent state machine
  const stateRef = useRef({
    // Position tracking
    currentPos: new THREE.Vector3(position[0], position[1], position[2]),
    targetPos: new THREE.Vector3(position[0], position[1], position[2]),
    homePos: new THREE.Vector3(position[0], position[1], position[2]),
    workStationPos: new THREE.Vector3(
      position[0] + (Math.random() - 0.5) * 2,
      position[1],
      position[2] + (Math.random() - 0.5) * 2
    ),
    currentRotation: 0,
    targetRotation: 0,

    // Behavior state
    mode: "idle", // idle | working | thinking | celebrating | break | wandering | traveling | meeting | returning
    isMoving: false,
    moveSpeed: WALK_SPEED,

    // Timers
    activityEndTime: 0,
    nextActivityTime: Date.now() + Math.random() * 3000 + 1000,
    nextVisitTime: Date.now() + Math.random() * 20000 + 10000,
    celebrationEndTime: 0,

    // Visit tracking
    visitingAgentId: null,
    meetingWithAgentId: null,

    // Work stats
    workSessionsToday: 0,
  });

  const { scene, animations } = useGLTF(modelPath);
  const clonedScene = useMemo(() => skeletonClone(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, characterRef);

  // Zone boundaries
  const zoneBounds = useMemo(() => {
    const halfW = (zoneSize[0] / 2) - 1.5;
    const halfD = (zoneSize[1] / 2) - 1.5;
    return {
      minX: position[0] - halfW,
      maxX: position[0] + halfW,
      minZ: position[2] - halfD,
      maxZ: position[2] + halfD,
    };
  }, [position, zoneSize]);

  // Parse colors
  const tintColor = useMemo(() => (color ? new THREE.Color(color) : null), [color]);
  const ringBrightColor = useMemo(() => {
    const c = new THREE.Color(agentColor);
    c.multiplyScalar(1.5);
    return c;
  }, [agentColor]);

  // ── Apply color tint ─────────────────────────────────────────────
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isSkinnedMesh || child.isMesh) {
        child.material = child.material.clone();
        if (tintColor) {
          child.material.color.multiply(tintColor);
          child.material.emissive = tintColor.clone().multiplyScalar(0.15);
          child.material.emissiveIntensity = 0.5;
        }
        child.material.needsUpdate = true;
      }
    });
  }, [clonedScene, tintColor]);

  // ── Status-based visual effects ──────────────────────────────────
  useEffect(() => {
    const isActive = status === "active" || status === "online";
    const isOffline = status === "offline";
    clonedScene.traverse((child) => {
      if (child.isSkinnedMesh || child.isMesh) {
        if (!child.material._originalColor) {
          child.material._originalColor = child.material.color?.clone() || new THREE.Color(1, 1, 1);
          child.material._originalEmissive = child.material.emissive?.clone() || new THREE.Color(0, 0, 0);
        }
        if (isActive) {
          child.material.emissive = tintColor ? tintColor.clone().multiplyScalar(0.3) : new THREE.Color(0.15, 0.15, 0.3);
          child.material.emissiveIntensity = 0.8;
        } else if (isOffline) {
          const col = child.material._originalColor.clone();
          if (tintColor) col.multiply(tintColor);
          const gray = (col.r + col.g + col.b) / 3;
          col.lerp(new THREE.Color(gray, gray, gray), 0.7);
          col.multiplyScalar(0.5);
          child.material.color.copy(col);
          child.material.emissiveIntensity = 0;
        }
        child.material.needsUpdate = true;
      }
    });
  }, [clonedScene, status, tintColor]);

  // ── Enable shadows ───────────────────────────────────────────────
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  // ── Animation helpers ────────────────────────────────────────────
  const crossFadeTo = useCallback((newAction, duration = CROSSFADE_DURATION, timeScale = 1.0) => {
    if (!newAction) return;
    const prev = currentActionRef.current;
    newAction.reset();
    newAction.setLoop(THREE.LoopRepeat, Infinity);
    newAction.timeScale = timeScale;
    if (prev && prev !== newAction) {
      newAction.crossFadeFrom(prev, duration, true);
    }
    newAction.fadeIn(duration).play();
    currentActionRef.current = newAction;
  }, []);

  const playOneShot = useCallback((animNames, onComplete) => {
    const action = findAction(actions, ...animNames);
    if (!action) {
      if (onComplete) onComplete();
      return;
    }
    const prev = currentActionRef.current;
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.timeScale = 1.0;
    if (prev) action.crossFadeFrom(prev, CROSSFADE_DURATION, true);
    action.fadeIn(CROSSFADE_DURATION).play();
    currentActionRef.current = action;

    const onFinished = (e) => {
      if (e.action === action) {
        mixer.removeEventListener("finished", onFinished);
        if (onComplete) onComplete();
      }
    };
    mixer.addEventListener("finished", onFinished);
  }, [actions, mixer]);

  // ── Movement helpers ─────────────────────────────────────────────
  const startWalk = useCallback(() => {
    const walkAction = findAction(actions, ...WALK_ANIMS);
    if (walkAction) crossFadeTo(walkAction, 0.2, 1.0);
    stateRef.current.moveSpeed = WALK_SPEED;
  }, [actions, crossFadeTo]);

  const startRun = useCallback(() => {
    const runAction = findAction(actions, ...RUN_ANIMS);
    if (runAction) crossFadeTo(runAction, 0.2, 1.2);
    stateRef.current.moveSpeed = RUN_SPEED;
  }, [actions, crossFadeTo]);

  const startIdle = useCallback(() => {
    const idleAction = findAction(actions, ...IDLE_ANIMS);
    if (idleAction) crossFadeTo(idleAction, 0.3, 0.8);
  }, [actions, crossFadeTo]);

  // ── Game Behaviors ───────────────────────────────────────────────

  // Start working at station
  const startWorking = useCallback(() => {
    const s = stateRef.current;
    const activity = WORK_ACTIVITIES[Math.floor(Math.random() * WORK_ACTIVITIES.length)];
    const duration = activity.duration[0] + Math.random() * (activity.duration[1] - activity.duration[0]);

    // Use real task if available
    const displayText = currentTask || activity.text;

    s.mode = "working";
    s.activityEndTime = Date.now() + duration * 1000;
    s.isMoving = false;
    s.workSessionsToday++;

    setCurrentMode("working");
    setActivityText(displayText);
    setActivityEmoji(activity.emoji);

    // Typing animation (use interact/idle mix)
    const idleAction = findAction(actions, ...IDLE_ANIMS);
    if (idleAction) crossFadeTo(idleAction, 0.3, 0.6); // Slower idle = focused work
  }, [currentTask, actions, crossFadeTo]);

  // Start thinking
  const startThinking = useCallback(() => {
    const s = stateRef.current;
    const thought = THINKING_ACTIVITIES[Math.floor(Math.random() * THINKING_ACTIVITIES.length)];

    s.mode = "thinking";
    s.activityEndTime = Date.now() + (3000 + Math.random() * 4000);
    s.isMoving = false;

    setCurrentMode("thinking");
    setActivityText(thought.text);
    setActivityEmoji(thought.emoji);

    startIdle();

    // Look around while thinking
    s.targetRotation += (Math.random() - 0.5) * Math.PI * 0.5;
  }, [startIdle]);

  // Take a break
  const startBreak = useCallback(() => {
    const s = stateRef.current;
    const breakType = BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)];

    s.mode = "break";
    s.activityEndTime = Date.now() + (2000 + Math.random() * 3000);
    s.isMoving = false;

    setCurrentMode("break");
    setActivityText(breakType.text);
    setActivityEmoji(breakType.emoji);

    // Stretch animation
    playOneShot(INTERACT_ANIMS, startIdle);
  }, [playOneShot, startIdle]);

  // Celebrate task completion
  const celebrate = useCallback(() => {
    const s = stateRef.current;
    const message = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];

    s.mode = "celebrating";
    s.activityEndTime = Date.now() + 2500;

    setCurrentMode("celebrating");
    setShowCelebration(true);
    setCelebrationText(message);
    setTasksCompleted((prev) => prev + 1);

    playOneShot(CHEER_ANIMS, () => {
      setShowCelebration(false);
      startIdle();
    });

    // Clear celebration after animation
    setTimeout(() => setShowCelebration(false), 2500);
  }, [playOneShot, startIdle]);

  // Wander around zone
  const startWandering = useCallback(() => {
    const s = stateRef.current;
    const targetX = zoneBounds.minX + Math.random() * (zoneBounds.maxX - zoneBounds.minX);
    const targetZ = zoneBounds.minZ + Math.random() * (zoneBounds.maxZ - zoneBounds.minZ);

    s.targetPos.set(targetX, position[1], targetZ);
    s.mode = "wandering";
    s.isMoving = true;

    setCurrentMode("wandering");
    setActivityText("");
    setActivityEmoji("");

    const dx = targetX - s.currentPos.x;
    const dz = targetZ - s.currentPos.z;
    s.targetRotation = Math.atan2(dx, dz);

    startWalk();
  }, [zoneBounds, position, startWalk]);

  // Visit another agent
  const visitAgent = useCallback((targetAgentId) => {
    const targetInfo = allAgentPositions[targetAgentId];
    if (!targetInfo) return;

    const s = stateRef.current;
    const [tx, ty, tz] = targetInfo.position;

    const offset = 2.5;
    const angle = Math.random() * Math.PI * 2;
    s.targetPos.set(
      tx + Math.cos(angle) * offset,
      ty,
      tz + Math.sin(angle) * offset
    );

    s.mode = "traveling";
    s.isMoving = true;
    s.visitingAgentId = targetAgentId;

    setCurrentMode("traveling");
    setActivityText("Going to sync up...");
    setActivityEmoji("🏃");

    const dx = s.targetPos.x - s.currentPos.x;
    const dz = s.targetPos.z - s.currentPos.z;
    s.targetRotation = Math.atan2(dx, dz);

    startRun();
    startVisit(agentId, targetAgentId);
  }, [allAgentPositions, startRun, startVisit, agentId]);

  // Begin meeting
  const beginMeeting = useCallback(() => {
    const s = stateRef.current;
    s.mode = "meeting";
    s.isMoving = false;
    s.activityEndTime = Date.now() + (MEETING_DURATION[0] + Math.random() * (MEETING_DURATION[1] - MEETING_DURATION[0])) * 1000;

    setCurrentMode("meeting");
    setActivityText("Syncing info...");
    setActivityEmoji("💬");

    const targetInfo = allAgentPositions[s.visitingAgentId];
    if (targetInfo) {
      const [tx, , tz] = targetInfo.position;
      const dx = tx - s.currentPos.x;
      const dz = tz - s.currentPos.z;
      s.targetRotation = Math.atan2(dx, dz);
    }

    startMeeting(agentId, s.visitingAgentId);
    playOneShot(WAVE_ANIMS, startIdle);
  }, [allAgentPositions, startMeeting, agentId, playOneShot, startIdle]);

  // Return home
  const returnHome = useCallback(() => {
    const s = stateRef.current;
    s.targetPos.copy(s.homePos);
    s.mode = "returning";
    s.isMoving = true;
    s.visitingAgentId = null;

    setCurrentMode("returning");
    setActivityText("Heading back...");
    setActivityEmoji("🚶");

    const dx = s.targetPos.x - s.currentPos.x;
    const dz = s.targetPos.z - s.currentPos.z;
    s.targetRotation = Math.atan2(dx, dz);

    endVisit(agentId);
    startWalk();
  }, [endVisit, agentId, startWalk]);

  // Pick next activity based on game logic
  const pickNextActivity = useCallback(() => {
    const activity = STATUS_ACTIVITY[status] || 0.3;
    if (status === "offline") {
      // Offline agents mostly idle
      startIdle();
      setActivityText("Offline");
      setActivityEmoji("💤");
      return;
    }

    const roll = Math.random();

    if (roll < WORK_CHANCE * activity) {
      // Work!
      startWorking();
    } else if (roll < (WORK_CHANCE + 0.15) * activity) {
      // Think
      startThinking();
    } else if (roll < (WORK_CHANCE + 0.25) * activity) {
      // Wander
      startWandering();
    } else if (roll < (WORK_CHANCE + 0.30) * activity) {
      // Take break
      startBreak();
    } else {
      // Just idle briefly
      startIdle();
      setActivityText("");
      setActivityEmoji("");
      stateRef.current.mode = "idle";
      setCurrentMode("idle");
      stateRef.current.activityEndTime = Date.now() + 2000 + Math.random() * 3000;
    }
  }, [status, startWorking, startThinking, startWandering, startBreak, startIdle]);

  // ── Initialize ───────────────────────────────────────────────────
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;
    pickNextActivity();
  }, [actions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Selection wave ───────────────────────────────────────────────
  useEffect(() => {
    if (!isSelected || !actions || Object.keys(actions).length === 0) return;
    const s = stateRef.current;
    s.mode = "idle";
    s.isMoving = false;
    setActivityText("At your service!");
    setActivityEmoji("👋");
    playOneShot(WAVE_ANIMS, startIdle);
  }, [isSelected, actions, playOneShot, startIdle]);

  // ── Cursor ───────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => { document.body.style.cursor = "auto"; };
  }, [hovered]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (onSelect) onSelect(agentId);
  }, [onSelect, agentId]);

  // ── Main game loop ───────────────────────────────────────────────
  useFrame((state, delta) => {
    if (mixer) mixer.update(delta);

    const s = stateRef.current;
    const activity = STATUS_ACTIVITY[status] || 0.3;
    const now = Date.now();

    // Skip AI when selected
    if (isSelected) {
      const rotDiff = s.targetRotation - s.currentRotation;
      const normDiff = Math.atan2(Math.sin(rotDiff), Math.cos(rotDiff));
      s.currentRotation += normDiff * Math.min(1, delta * 5);

      if (characterRef.current) {
        characterRef.current.position.x = s.currentPos.x - position[0];
        characterRef.current.position.z = s.currentPos.z - position[2];
        characterRef.current.rotation.y = s.currentRotation;
      }
      return;
    }

    // ── Game State Machine ─────────────────────────────────────────
    switch (s.mode) {
      case "idle":
      case "working":
      case "thinking":
      case "break":
      case "celebrating":
        // Check if activity is done
        if (now > s.activityEndTime) {
          // Chance to celebrate after work
          if (s.mode === "working" && Math.random() < 0.3) {
            celebrate();
          } else {
            pickNextActivity();
          }
        }

        // Check for visit opportunity
        if (now > s.nextVisitTime && s.mode !== "celebrating") {
          const otherAgents = Object.keys(allAgentPositions).filter(id => id !== agentId);
          if (otherAgents.length > 0 && Math.random() < activity * 0.4) {
            const targetId = otherAgents[Math.floor(Math.random() * otherAgents.length)];
            visitAgent(targetId);
          }
          s.nextVisitTime = now + (VISIT_INTERVAL[0] + Math.random() * (VISIT_INTERVAL[1] - VISIT_INTERVAL[0])) * 1000 / activity;
        }
        break;

      case "wandering":
      case "traveling":
      case "returning":
        if (s.isMoving) {
          const dx = s.targetPos.x - s.currentPos.x;
          const dz = s.targetPos.z - s.currentPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 0.3) {
            s.currentPos.copy(s.targetPos);
            s.isMoving = false;

            if (s.mode === "traveling") {
              beginMeeting();
            } else {
              pickNextActivity();
            }
          } else {
            const moveAmount = Math.min(s.moveSpeed * delta, dist);
            s.currentPos.x += (dx / dist) * moveAmount;
            s.currentPos.z += (dz / dist) * moveAmount;
            s.targetRotation = Math.atan2(dx, dz);
          }
        }
        break;

      case "meeting":
        if (now > s.activityEndTime) {
          if (Math.random() < 0.5) {
            playOneShot(WAVE_ANIMS, returnHome);
          } else {
            returnHome();
          }
        } else if (Math.random() < 0.008) {
          // Occasional gestures
          playOneShot(Math.random() < 0.5 ? WAVE_ANIMS : INTERACT_ANIMS, startIdle);
        }
        break;
    }

    // ── Smooth rotation ────────────────────────────────────────────
    const rotDiff = s.targetRotation - s.currentRotation;
    const normDiff = Math.atan2(Math.sin(rotDiff), Math.cos(rotDiff));
    s.currentRotation += normDiff * Math.min(1, delta * 5);

    // ── Apply transforms ───────────────────────────────────────────
    if (characterRef.current) {
      characterRef.current.position.x = s.currentPos.x - position[0];
      characterRef.current.position.z = s.currentPos.z - position[2];
      characterRef.current.rotation.y = s.currentRotation;
    }

    // ── Selection ring animation ───────────────────────────────────
    if (selectionRingRef.current) {
      const t = state.clock.getElapsedTime();
      selectionRingRef.current.rotation.z = t * 0.5;
      const pulse = 1.0 + Math.sin(t * 2.5) * 0.08;
      selectionRingRef.current.scale.set(pulse, pulse, 1);
    }
    if (selectionGlowRef.current) {
      const t = state.clock.getElapsedTime();
      selectionGlowRef.current.material.opacity = 0.15 + Math.sin(t * 3.0) * 0.1;
    }
  });

  // Status indicators
  const isTraveling = currentMode === "traveling" || currentMode === "returning";
  const isInMeeting = currentMode === "meeting";
  const isWorking = currentMode === "working";
  const isThinking = currentMode === "thinking";

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Character container */}
      <group ref={characterRef}>
        <primitive object={clonedScene} scale={[2.5, 2.5, 2.5]} position={[0, 0, 0]} />

        {/* Shadow disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <circleGeometry args={[0.7, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.4} depthWrite={false} />
        </mesh>

        {/* Game-style floating UI */}
        <Html
          position={[0, 8, 0]}
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
            {/* Agent name */}
            <div style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#ffffff",
              textShadow: "0 0 6px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.7)",
              lineHeight: 1.2,
            }}>
              {agentName}
            </div>

            {/* Role badge */}
            <div style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#1a1a2e",
              background: agentColor,
              padding: "2px 8px",
              borderRadius: "10px",
              marginTop: "3px",
              display: "inline-block",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}>
              {agentRole}
            </div>

            {/* Activity indicator - game style */}
            {activityText && (
              <div style={{
                marginTop: "6px",
                padding: "4px 10px",
                background: isWorking ? "rgba(34, 197, 94, 0.9)" :
                           isThinking ? "rgba(168, 85, 247, 0.9)" :
                           isInMeeting ? "rgba(59, 130, 246, 0.9)" :
                           isTraveling ? "rgba(251, 146, 60, 0.9)" :
                           "rgba(0, 0, 0, 0.7)",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}>
                <span>{activityEmoji}</span>
                <span>{activityText}</span>
              </div>
            )}

            {/* Celebration popup */}
            {showCelebration && (
              <div style={{
                position: "absolute",
                top: "-40px",
                left: "50%",
                transform: "translateX(-50%)",
                padding: "6px 14px",
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                borderRadius: "16px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#1a1a2e",
                boxShadow: "0 4px 12px rgba(251, 191, 36, 0.5)",
                animation: "celebration-pop 0.3s ease-out",
              }}>
                {celebrationText}
              </div>
            )}

            {/* Tasks completed counter */}
            {tasksCompleted > 0 && (
              <div style={{
                marginTop: "4px",
                fontSize: "9px",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.5px",
              }}>
                ✨ {tasksCompleted} tasks today
              </div>
            )}
          </div>
        </Html>

        {/* Selection ring */}
        {isSelected && (
          <>
            <mesh ref={selectionRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
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
            <mesh ref={selectionGlowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.8, 1.4, 64]} />
              <meshBasicMaterial color={agentColor} transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <pointLight position={[0, 0.5, 0]} color={agentColor} intensity={1.5} distance={4} decay={2} />
          </>
        )}

        {/* Working glow */}
        {isWorking && (
          <pointLight position={[0, 2, 0]} color="#22c55e" intensity={1.5} distance={4} decay={2} />
        )}

        {/* Meeting glow */}
        {isInMeeting && (
          <pointLight position={[0, 2, 0]} color="#3b82f6" intensity={2} distance={5} decay={2} />
        )}

        {/* Thinking glow */}
        {isThinking && (
          <pointLight position={[0, 2, 0]} color="#a855f7" intensity={1.5} distance={4} decay={2} />
        )}
      </group>
    </group>
  );
}

export default memo(AgentCharacter);
