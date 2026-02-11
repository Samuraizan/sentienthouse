import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useRef, useEffect, useMemo, useState, useCallback, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Html } from "@react-three/drei";
import * as THREE from "three";
import useAgentStore from "../store/agentStore";

/**
 * AgentCharacter.jsx — Sentient AI agent with natural workspace interactions
 *
 * Agents interact with objects in their zone, wander naturally, and visit
 * other agents for work-related collaboration.
 *
 * Behaviors:
 *   - 💻 Working at desk/station
 *   - 🎵 Using zone-specific equipment (turntable, presentation board, etc.)
 *   - 🤔 Thinking/planning
 *   - 🚶 Walking around zone
 *   - 🏃 Visiting other agents
 *   - 💬 Collaborating in meetings
 *   - 🎉 Celebrating completions
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

const WALK_ANIMS = ["Walking_A", "Walking_B", "Walk"];
const RUN_ANIMS = ["Running_A", "Running_B", "Run"];
const IDLE_ANIMS = ["Idle"];
const WAVE_ANIMS = ["Wave"];
const INTERACT_ANIMS = ["Interact", "PickUp"];
const CHEER_ANIMS = ["Cheer", "Jump"];

// ── Zone-specific interaction points ───────────────────────────────
// Aligned with actual furniture positions in ZoneDecorations.jsx
const ZONE_INTERACTIONS = {
  director: [
    { id: "desk", offset: [0, 0, -8], activity: "Reviewing strategy", emoji: "💻", duration: [12, 20] },
    { id: "display", offset: [0, 0, -12], activity: "Checking analytics", emoji: "📊", duration: [8, 15] },
    { id: "seating", offset: [8, 0, 5], activity: "Taking calls", emoji: "📞", duration: [6, 12] },
    { id: "filing1", offset: [-8, 0, -10], activity: "Reviewing documents", emoji: "📁", duration: [5, 10] },
    { id: "plant", offset: [-10, 0, 8], activity: "Brief pause", emoji: "🌿", duration: [2, 5] },
  ],
  "captain-blrxzo": [
    { id: "desk", offset: [0, 0, -6], activity: "Managing Bangalore ops", emoji: "💻", duration: [12, 20] },
    { id: "checkin", offset: [8, 0, 0], activity: "Guest check-in", emoji: "🔑", duration: [5, 10] },
    { id: "welcome", offset: [0, 0, 8], activity: "Greeting guests", emoji: "👋", duration: [4, 8] },
    { id: "waiting", offset: [-6, 0, 6], activity: "Guest consultation", emoji: "💬", duration: [8, 15] },
    { id: "board", offset: [0, 0, -10], activity: "Updating property status", emoji: "📋", duration: [6, 12] },
  ],
  "captain-wtfxzo": [
    { id: "desk", offset: [0, 0, -6], activity: "Managing Goa ops", emoji: "💻", duration: [12, 20] },
    { id: "checkin", offset: [8, 0, 0], activity: "Guest check-in", emoji: "🔑", duration: [5, 10] },
    { id: "welcome", offset: [0, 0, 8], activity: "Greeting arrivals", emoji: "👋", duration: [4, 8] },
    { id: "waiting", offset: [-6, 0, 6], activity: "Discussing bookings", emoji: "💬", duration: [8, 15] },
    { id: "board", offset: [0, 0, -10], activity: "Property walkthrough", emoji: "🚶", duration: [6, 12] },
  ],
  events: [
    { id: "desk", offset: [-6, 0, 0], activity: "Planning event details", emoji: "📝", duration: [10, 18] },
    { id: "stage", offset: [0, 0, -6], activity: "Checking stage setup", emoji: "🎪", duration: [8, 15] },
    { id: "avrack", offset: [10, 0, -5], activity: "Adjusting AV equipment", emoji: "🎛️", duration: [6, 12] },
    { id: "meeting", offset: [5, 0, 8], activity: "Client consultation", emoji: "🤝", duration: [10, 18] },
    { id: "speakers", offset: [-5, 0, -4], activity: "Sound check", emoji: "🔊", duration: [5, 10] },
  ],
  "vibe-curator": [
    { id: "djbooth", offset: [0, 0, -4], activity: "Mixing tracks", emoji: "🎧", duration: [15, 25] },
    { id: "monitors", offset: [-6, 0, -6], activity: "Adjusting sound levels", emoji: "🔊", duration: [6, 12] },
    { id: "vinyl", offset: [-10, 0, 0], activity: "Selecting records", emoji: "💿", duration: [5, 10] },
    { id: "laptop", offset: [1, 0, -4], activity: "Curating playlist", emoji: "📱", duration: [8, 15] },
    { id: "chill", offset: [8, 0, 5], activity: "Vibing out", emoji: "✨", duration: [4, 8] },
  ],
  sales: [
    { id: "desk", offset: [0, 0, -6], activity: "Following up leads", emoji: "💻", duration: [12, 20] },
    { id: "board", offset: [0, 0, -10], activity: "Updating pipeline", emoji: "📈", duration: [8, 15] },
    { id: "desk2", offset: [-8, 0, 2], activity: "Preparing proposals", emoji: "📧", duration: [10, 18] },
    { id: "callbooth", offset: [10, 0, 2], activity: "Sales call", emoji: "📞", duration: [8, 15] },
    { id: "meeting", offset: [-6, 0, 10], activity: "Deal discussion", emoji: "🤝", duration: [10, 18] },
  ],
  bd: [
    { id: "conference", offset: [0, 0, 0], activity: "Partnership meeting", emoji: "🤝", duration: [12, 20] },
    { id: "presentation", offset: [0, 0, -8], activity: "Presenting pitch", emoji: "📊", duration: [10, 18] },
    { id: "research", offset: [-8, 0, -5], activity: "Market research", emoji: "🌍", duration: [10, 18] },
    { id: "dealboard", offset: [10, 0, 0], activity: "Deal analysis", emoji: "📋", duration: [8, 15] },
    { id: "lounge", offset: [6, 0, 8], activity: "Networking chat", emoji: "☕", duration: [6, 12] },
  ],
};

// ── Work-related visit reasons ─────────────────────────────────────
const VISIT_REASONS = {
  director: {
    "captain-blrxzo": ["Bangalore status update", "Property metrics review", "Guest feedback"],
    "captain-wtfxzo": ["Goa status update", "House performance check", "Staff coordination"],
    events: ["Event calendar sync", "Venue requirements", "Budget approval"],
    "vibe-curator": ["Atmosphere check", "Music curation review", "Guest experience"],
    sales: ["Pipeline review", "Revenue targets", "Lead quality check"],
    bd: ["Partnership updates", "Deal pipeline", "Strategic planning"],
  },
  "captain-blrxzo": {
    director: ["Reporting metrics", "Escalation", "Resource request"],
    events: ["Event coordination", "Space booking", "Setup planning"],
    "vibe-curator": ["Atmosphere request", "Music for event", "Guest preferences"],
    sales: ["Lead handoff", "Guest inquiry", "Booking confirmation"],
  },
  "captain-wtfxzo": {
    director: ["Reporting metrics", "Escalation", "Approval needed"],
    events: ["Event coordination", "Venue prep", "Catering sync"],
    "vibe-curator": ["Vibe check", "Party planning", "Music selection"],
    sales: ["Guest leads", "Inquiry response", "Booking update"],
  },
  events: {
    director: ["Event approval", "Budget review", "Schedule confirmation"],
    "captain-blrxzo": ["Venue walkthrough", "Setup coordination", "Timing sync"],
    "captain-wtfxzo": ["Space requirements", "Equipment needs", "Staff briefing"],
    "vibe-curator": ["Music planning", "Atmosphere design", "Theme coordination"],
    sales: ["Event leads", "Corporate inquiries", "Package details"],
    bd: ["Partner events", "Sponsorship", "Co-hosted events"],
  },
  "vibe-curator": {
    director: ["Creative direction", "Brand alignment", "Feedback session"],
    events: ["Event playlist", "Sound setup", "Lighting design"],
    "captain-blrxzo": ["House vibes", "Guest playlist", "Atmosphere update"],
    "captain-wtfxzo": ["Party prep", "Music schedule", "Mood setting"],
  },
  sales: {
    director: ["Pipeline review", "Target updates", "Deal support"],
    events: ["Event packages", "Corporate leads", "Booking coordination"],
    bd: ["Partner leads", "Cross-sell opps", "Deal collaboration"],
    "captain-blrxzo": ["Guest inquiries", "Availability check", "Special requests"],
    "captain-wtfxzo": ["Booking requests", "Rate discussion", "Promo coordination"],
  },
  bd: {
    director: ["Deal approval", "Partnership strategy", "Resource allocation"],
    events: ["Partner events", "Sponsorship deals", "Co-marketing"],
    sales: ["Lead sharing", "Deal support", "Pipeline sync"],
  },
};

// ── Status activity levels ─────────────────────────────────────────
const STATUS_ACTIVITY = {
  active: 1.0,
  idle: 0.4,
  online: 0.7,
  dormant: 0.1,
  standby: 0.2,
  offline: 0.02,
};

const WALK_SPEED = 2.5;
const RUN_SPEED = 6.0;
const CROSSFADE_DURATION = 0.25;

// ── Main Component ─────────────────────────────────────────────────

function AgentCharacter({
  modelPath,
  position = [0, 0, 0],
  zoneSize = [10, 10],
  color = null,
  status = "offline",
  agentId = "",
  agentName = "",
  agentRole = "",
  agentRoleLabel = "",
  isSelected = false,
  onSelect = null,
  agentColor = "#8888ff",
  allAgentPositions = {},
  currentTask = null,
}) {
  const groupRef = useRef();
  const characterRef = useRef();
  const selectionRingRef = useRef();
  const currentActionRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  // Game state for UI
  const [currentMode, setCurrentMode] = useState("idle");
  const [activityText, setActivityText] = useState("");
  const [activityEmoji, setActivityEmoji] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [visitReason, setVisitReason] = useState("");

  // Store actions
  const startVisit = useAgentStore((s) => s.startVisit);
  const startMeeting = useAgentStore((s) => s.startMeeting);
  const endVisit = useAgentStore((s) => s.endVisit);

  // Get zone interactions for this agent's role
  const zoneInteractions = useMemo(() => {
    return ZONE_INTERACTIONS[agentRole] || ZONE_INTERACTIONS.director;
  }, [agentRole]);

  // Agent state machine
  const stateRef = useRef({
    currentPos: new THREE.Vector3(position[0], position[1], position[2]),
    targetPos: new THREE.Vector3(position[0], position[1], position[2]),
    homePos: new THREE.Vector3(position[0], position[1], position[2]),
    currentRotation: 0,
    targetRotation: 0,

    mode: "idle",
    isMoving: false,
    moveSpeed: WALK_SPEED,

    activityEndTime: Date.now() + 2000,
    nextActivityTime: Date.now() + Math.random() * 3000 + 1000,
    nextVisitTime: Date.now() + Math.random() * 25000 + 15000,

    visitingAgentId: null,
    currentInteraction: null,
    workSessionsToday: 0,
  });

  const { scene, animations } = useGLTF(modelPath);
  const clonedScene = useMemo(() => skeletonClone(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, characterRef);

  // Zone boundaries
  const zoneBounds = useMemo(() => {
    const halfW = (zoneSize[0] / 2) - 2;
    const halfD = (zoneSize[1] / 2) - 2;
    return {
      minX: position[0] - halfW,
      maxX: position[0] + halfW,
      minZ: position[2] - halfD,
      maxZ: position[2] + halfD,
    };
  }, [position, zoneSize]);

  // Colors
  const tintColor = useMemo(() => (color ? new THREE.Color(color) : null), [color]);
  const ringBrightColor = useMemo(() => {
    const c = new THREE.Color(agentColor);
    c.multiplyScalar(1.5);
    return c;
  }, [agentColor]);

  // ── Visual setup effects ─────────────────────────────────────────
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

  useEffect(() => {
    const isActive = status === "active" || status === "online";
    const isOffline = status === "offline";
    clonedScene.traverse((child) => {
      if (child.isSkinnedMesh || child.isMesh) {
        if (!child.material._originalColor) {
          child.material._originalColor = child.material.color?.clone() || new THREE.Color(1, 1, 1);
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

  // ── Behavior: Go to interaction point ────────────────────────────
  const goToInteraction = useCallback((interaction) => {
    const s = stateRef.current;
    const targetX = position[0] + interaction.offset[0];
    const targetZ = position[2] + interaction.offset[2];

    s.targetPos.set(targetX, position[1], targetZ);
    s.mode = "goingToInteraction";
    s.isMoving = true;
    s.currentInteraction = interaction;

    setCurrentMode("walking");
    setActivityText(`Going to ${interaction.id}...`);
    setActivityEmoji("🚶");

    const dx = targetX - s.currentPos.x;
    const dz = targetZ - s.currentPos.z;
    s.targetRotation = Math.atan2(dx, dz);

    startWalk();
  }, [position, startWalk]);

  // ── Behavior: Start interacting with object ──────────────────────
  const startInteracting = useCallback(() => {
    const s = stateRef.current;
    const interaction = s.currentInteraction;
    if (!interaction) return;

    const duration = interaction.duration[0] + Math.random() * (interaction.duration[1] - interaction.duration[0]);

    s.mode = "interacting";
    s.activityEndTime = Date.now() + duration * 1000;
    s.isMoving = false;
    s.workSessionsToday++;

    setCurrentMode("working");
    setActivityText(interaction.activity);
    setActivityEmoji(interaction.emoji);

    // Face the object (towards zone center for most)
    const dx = position[0] - s.currentPos.x;
    const dz = position[2] - s.currentPos.z;
    if (Math.abs(dx) > 0.5 || Math.abs(dz) > 0.5) {
      s.targetRotation = Math.atan2(dx, dz);
    }

    startIdle();
  }, [position, startIdle]);

  // ── Behavior: Random wander ──────────────────────────────────────
  const startWandering = useCallback(() => {
    const s = stateRef.current;
    const targetX = zoneBounds.minX + Math.random() * (zoneBounds.maxX - zoneBounds.minX);
    const targetZ = zoneBounds.minZ + Math.random() * (zoneBounds.maxZ - zoneBounds.minZ);

    s.targetPos.set(targetX, position[1], targetZ);
    s.mode = "wandering";
    s.isMoving = true;

    setCurrentMode("walking");
    setActivityText("Walking around");
    setActivityEmoji("🚶");

    const dx = targetX - s.currentPos.x;
    const dz = targetZ - s.currentPos.z;
    s.targetRotation = Math.atan2(dx, dz);

    startWalk();
  }, [zoneBounds, position, startWalk]);

  // ── Behavior: Visit another agent ────────────────────────────────
  const visitAgent = useCallback((targetAgentId) => {
    const targetInfo = allAgentPositions[targetAgentId];
    if (!targetInfo) return;

    const s = stateRef.current;
    const [tx, ty, tz] = targetInfo.position;

    // Get visit reason
    const reasons = VISIT_REASONS[agentRole]?.[targetAgentId] || ["Quick sync", "Collaboration", "Update"];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];

    const offset = 3;
    const angle = Math.random() * Math.PI * 2;
    s.targetPos.set(tx + Math.cos(angle) * offset, ty, tz + Math.sin(angle) * offset);

    s.mode = "traveling";
    s.isMoving = true;
    s.visitingAgentId = targetAgentId;

    setCurrentMode("traveling");
    setActivityText(reason);
    setActivityEmoji("🏃");
    setVisitReason(reason);

    const dx = s.targetPos.x - s.currentPos.x;
    const dz = s.targetPos.z - s.currentPos.z;
    s.targetRotation = Math.atan2(dx, dz);

    startRun();
    startVisit(agentId, targetAgentId);
  }, [allAgentPositions, agentRole, startRun, startVisit, agentId]);

  // ── Behavior: Begin meeting ──────────────────────────────────────
  const beginMeeting = useCallback(() => {
    const s = stateRef.current;
    const meetingDuration = 5000 + Math.random() * 8000;

    s.mode = "meeting";
    s.isMoving = false;
    s.activityEndTime = Date.now() + meetingDuration;

    setCurrentMode("meeting");
    setActivityText(visitReason || "Syncing up");
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
  }, [allAgentPositions, visitReason, startMeeting, agentId, playOneShot, startIdle]);

  // ── Behavior: Return home ────────────────────────────────────────
  const returnHome = useCallback(() => {
    const s = stateRef.current;
    s.targetPos.copy(s.homePos);
    s.mode = "returning";
    s.isMoving = true;
    s.visitingAgentId = null;

    setCurrentMode("returning");
    setActivityText("Heading back");
    setActivityEmoji("🚶");
    setVisitReason("");

    const dx = s.targetPos.x - s.currentPos.x;
    const dz = s.targetPos.z - s.currentPos.z;
    s.targetRotation = Math.atan2(dx, dz);

    endVisit(agentId);
    startWalk();
  }, [endVisit, agentId, startWalk]);

  // ── Behavior: Celebrate ──────────────────────────────────────────
  const celebrate = useCallback(() => {
    const messages = ["+1 Task Complete! 🎉", "Nailed it! ✨", "Done! 🚀", "Success! ✅"];
    const message = messages[Math.floor(Math.random() * messages.length)];

    stateRef.current.mode = "celebrating";
    stateRef.current.activityEndTime = Date.now() + 2500;

    setCurrentMode("celebrating");
    setShowCelebration(true);
    setCelebrationText(message);
    setTasksCompleted((prev) => prev + 1);

    playOneShot(CHEER_ANIMS, () => {
      setShowCelebration(false);
      startIdle();
    });

    setTimeout(() => setShowCelebration(false), 2500);
  }, [playOneShot, startIdle]);

  // ── Pick next activity ───────────────────────────────────────────
  const pickNextActivity = useCallback(() => {
    const activity = STATUS_ACTIVITY[status] || 0.3;
    const s = stateRef.current;

    if (status === "offline") {
      startIdle();
      setActivityText("Offline");
      setActivityEmoji("💤");
      s.mode = "idle";
      setCurrentMode("idle");
      s.activityEndTime = Date.now() + 10000;
      return;
    }

    const roll = Math.random();

    if (roll < 0.55 * activity && zoneInteractions.length > 0) {
      // Go interact with an object in zone
      const interaction = zoneInteractions[Math.floor(Math.random() * zoneInteractions.length)];
      goToInteraction(interaction);
    } else if (roll < 0.75 * activity) {
      // Wander around
      startWandering();
    } else if (roll < 0.85 * activity) {
      // Brief thinking/idle
      s.mode = "thinking";
      s.activityEndTime = Date.now() + 3000 + Math.random() * 4000;
      setCurrentMode("thinking");
      setActivityText("Planning...");
      setActivityEmoji("🤔");
      startIdle();
      s.targetRotation += (Math.random() - 0.5) * Math.PI * 0.5;
    } else {
      // Just idle
      s.mode = "idle";
      s.activityEndTime = Date.now() + 2000 + Math.random() * 3000;
      setCurrentMode("idle");
      setActivityText("");
      setActivityEmoji("");
      startIdle();
    }
  }, [status, zoneInteractions, goToInteraction, startWandering, startIdle]);

  // ── Initialize ───────────────────────────────────────────────────
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;
    pickNextActivity();
  }, [actions]); // eslint-disable-line

  // ── Selection wave ───────────────────────────────────────────────
  useEffect(() => {
    if (!isSelected || !actions || Object.keys(actions).length === 0) return;
    stateRef.current.mode = "idle";
    stateRef.current.isMoving = false;
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

    // ── State machine ──────────────────────────────────────────────
    switch (s.mode) {
      case "idle":
      case "thinking":
      case "interacting":
      case "celebrating":
        if (now > s.activityEndTime) {
          if (s.mode === "interacting" && Math.random() < 0.25) {
            celebrate();
          } else {
            pickNextActivity();
          }
        }

        // Check for visit opportunity
        if (now > s.nextVisitTime && s.mode !== "celebrating") {
          const otherAgents = Object.keys(allAgentPositions).filter(id => id !== agentId);
          if (otherAgents.length > 0 && Math.random() < activity * 0.5) {
            const targetId = otherAgents[Math.floor(Math.random() * otherAgents.length)];
            visitAgent(targetId);
          }
          s.nextVisitTime = now + (20000 + Math.random() * 35000) / activity;
        }
        break;

      case "goingToInteraction":
      case "wandering":
      case "traveling":
      case "returning":
        if (s.isMoving) {
          const dx = s.targetPos.x - s.currentPos.x;
          const dz = s.targetPos.z - s.currentPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 0.5) {
            s.currentPos.copy(s.targetPos);
            s.isMoving = false;

            if (s.mode === "goingToInteraction") {
              startInteracting();
            } else if (s.mode === "traveling") {
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
        } else if (Math.random() < 0.005) {
          playOneShot(Math.random() < 0.5 ? WAVE_ANIMS : INTERACT_ANIMS, startIdle);
        }
        break;
    }

    // Smooth rotation
    const rotDiff = s.targetRotation - s.currentRotation;
    const normDiff = Math.atan2(Math.sin(rotDiff), Math.cos(rotDiff));
    s.currentRotation += normDiff * Math.min(1, delta * 5);

    // Apply transforms
    if (characterRef.current) {
      characterRef.current.position.x = s.currentPos.x - position[0];
      characterRef.current.position.z = s.currentPos.z - position[2];
      characterRef.current.rotation.y = s.currentRotation;
    }

    // Selection ring animation
    if (selectionRingRef.current) {
      const t = state.clock.getElapsedTime();
      selectionRingRef.current.rotation.z = t * 0.5;
      const pulse = 1.0 + Math.sin(t * 2.5) * 0.08;
      selectionRingRef.current.scale.set(pulse, pulse, 1);
    }
  });

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
      <group ref={characterRef}>
        <primitive object={clonedScene} scale={[2.5, 2.5, 2.5]} position={[0, 0, 0]} />

        {/* Shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <circleGeometry args={[0.7, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.4} depthWrite={false} />
        </mesh>

        {/* UI */}
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
            <div style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#ffffff",
              textShadow: "0 0 6px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.7)",
            }}>
              {agentName}
            </div>
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
              {agentRoleLabel || agentRole}
            </div>
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
              }}>
                {celebrationText}
              </div>
            )}
            {tasksCompleted > 0 && (
              <div style={{
                marginTop: "4px",
                fontSize: "9px",
                color: "rgba(255,255,255,0.7)",
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
              />
            </mesh>
            <pointLight position={[0, 0.5, 0]} color={agentColor} intensity={1.5} distance={4} decay={2} />
          </>
        )}

        {/* Activity glows */}
        {isWorking && <pointLight position={[0, 2, 0]} color="#22c55e" intensity={1.5} distance={4} decay={2} />}
        {isInMeeting && <pointLight position={[0, 2, 0]} color="#3b82f6" intensity={2} distance={5} decay={2} />}
        {isThinking && <pointLight position={[0, 2, 0]} color="#a855f7" intensity={1.5} distance={4} decay={2} />}
      </group>
    </group>
  );
}

export default memo(AgentCharacter);
