import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useRef, useEffect, useMemo, useState, useCallback, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Html } from "@react-three/drei";
import * as THREE from "three";
import useAgentStore from "../store/agentStore";
import { ZONE_POSITIONS } from "./Zones";
import { updateAgentPosition, getAllPositions, getAgentWorldPosition } from "./positionRegistry";

/**
 * AgentCharacter.jsx — Sentient AI agent with zone-aware workspace interactions
 *
 * 3-zone model: agents interact with objects in their zone, wander naturally,
 * and visit other zones for work-related collaboration.
 *
 * LOKI (nomad) rotates between all 3 zones every 60-120s.
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
// Offsets are from ZONE CENTER, aligned with ZoneDecorations furniture
const ZONE_INTERACTIONS = {
  hq: [
    { id: "command-desk", offset: [0, 0, -10], activity: "Reviewing strategy", emoji: "💻", duration: [12, 20] },
    { id: "display-wall", offset: [0, 0, -12], activity: "Checking analytics", emoji: "📊", duration: [8, 15] },
    { id: "suki-desk", offset: [-10, 0, 5], activity: "Event coordination", emoji: "📝", duration: [10, 18] },
    { id: "wanda-desk", offset: [10, 0, 5], activity: "Sales pipeline review", emoji: "📈", duration: [10, 18] },
    { id: "yana-desk", offset: [-10, 0, -5], activity: "BD research", emoji: "🌍", duration: [10, 18] },
    { id: "conference", offset: [0, 0, 10], activity: "Team meeting", emoji: "🤝", duration: [10, 18] },
    { id: "lounge", offset: [12, 0, -5], activity: "Taking calls", emoji: "📞", duration: [6, 12] },
    { id: "whiteboard", offset: [15, 0, 5], activity: "Strategy planning", emoji: "📋", duration: [8, 15] },
    { id: "plant-break", offset: [-15, 0, 12], activity: "Brief pause", emoji: "🌿", duration: [2, 5] },
  ],
  "blrxzo-house": [
    { id: "desk", offset: [0, 0, -8], activity: "Managing Bangalore ops", emoji: "💻", duration: [12, 20] },
    { id: "checkin", offset: [8, 0, 0], activity: "Guest check-in", emoji: "🔑", duration: [5, 10] },
    { id: "common-sofa", offset: [-6, 0, 6], activity: "Guest consultation", emoji: "💬", duration: [8, 15] },
    { id: "kitchen", offset: [-8, 0, -2], activity: "Kitchen break", emoji: "☕", duration: [4, 8] },
    { id: "ops-board", offset: [0, 0, -10], activity: "Updating property status", emoji: "📋", duration: [6, 12] },
    { id: "welcome", offset: [0, 0, 10], activity: "Greeting guests", emoji: "👋", duration: [4, 8] },
  ],
  "wtfxzo-house": [
    { id: "desk", offset: [0, 0, -8], activity: "Managing Goa ops", emoji: "💻", duration: [12, 20] },
    { id: "checkin", offset: [-8, 0, 0], activity: "Guest check-in", emoji: "🔑", duration: [5, 10] },
    { id: "common-sofa", offset: [6, 0, 6], activity: "Discussing bookings", emoji: "💬", duration: [8, 15] },
    { id: "kitchen", offset: [8, 0, -2], activity: "Kitchen break", emoji: "☕", duration: [4, 8] },
    { id: "ops-board", offset: [0, 0, -10], activity: "Property walkthrough", emoji: "📋", duration: [6, 12] },
    { id: "welcome", offset: [0, 0, 10], activity: "Greeting arrivals", emoji: "👋", duration: [4, 8] },
  ],
};

// ── Visit reasons — agents visit ZONES for work ───────────────────
const VISIT_REASONS = {
  // From HQ to houses
  "hq->blrxzo-house": ["Bangalore status update", "Property metrics review", "Guest feedback", "Ops check"],
  "hq->wtfxzo-house": ["Goa status update", "House performance check", "Staff coordination", "Ops check"],
  // From houses to HQ
  "blrxzo-house->hq": ["Reporting metrics", "Escalation", "Resource request", "Team sync"],
  "wtfxzo-house->hq": ["Reporting metrics", "Approval needed", "Escalation", "Team sync"],
  // Between houses
  "blrxzo-house->wtfxzo-house": ["Cross-property coordination", "Best practices sharing"],
  "wtfxzo-house->blrxzo-house": ["Cross-property coordination", "Guest transfer"],
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

// ── Collision avoidance (Reynolds separation) ────────────────────
const SEPARATION_RADIUS = 3.0;   // start steering away
const SEPARATION_STRENGTH = 4.0; // force multiplier
const MIN_SEPARATION = 1.5;      // hard minimum distance
const IDLE_DRIFT_SPEED = 0.5;    // drift speed for stationary agents

// LOKI nomad timing
const NOMAD_MIN_MS = 60000;
const NOMAD_MAX_MS = 120000;

// ── Task-to-interaction mapping (gateway cron → zone desk) ───────
const TASK_TO_INTERACTION = {
  "morning-briefing":     { zone: "hq", id: "command-desk" },
  "agent-kot":            { zone: "hq", id: "conference" },
  "event-marketing":      { zone: "hq", id: "whiteboard" },
  "lead-qualify":         { zone: "hq", id: "wanda-desk" },
  "sales-pipeline":       { zone: "hq", id: "wanda-desk" },
  "bd-research":          { zone: "hq", id: "yana-desk" },
  "partner-outreach":     { zone: "hq", id: "yana-desk" },
  "strategy-review":      { zone: "hq", id: "command-desk" },
  "analytics-digest":     { zone: "hq", id: "display-wall" },
  "content-calendar":     { zone: "hq", id: "whiteboard" },
  "social-post":          { zone: "hq", id: "whiteboard" },
  "community-engagement": { zone: "hq", id: "lounge" },
  "vibe-check":           { zone: "hq", id: "lounge" },
  "event-coordination":   { zone: "hq", id: "suki-desk" },
  "ticket-sales":         { zone: "hq", id: "suki-desk" },
  "guest-checkin-blr":    { zone: "blrxzo-house", id: "checkin" },
  "property-ops-blr":     { zone: "blrxzo-house", id: "ops-board" },
  "blr-maintenance":      { zone: "blrxzo-house", id: "desk" },
  "blr-guest-welcome":    { zone: "blrxzo-house", id: "welcome" },
  "guest-checkin-goa":    { zone: "wtfxzo-house", id: "checkin" },
  "property-ops-goa":     { zone: "wtfxzo-house", id: "ops-board" },
  "goa-maintenance":      { zone: "wtfxzo-house", id: "desk" },
  "goa-guest-welcome":    { zone: "wtfxzo-house", id: "welcome" },
  "weekly-report":        { zone: "hq", id: "display-wall" },
  "daily-standup":        { zone: "hq", id: "conference" },
  "pms-update":           { zone: "blrxzo-house", id: "desk" },
  "running-opex":         { zone: "blrxzo-house", id: "desk" },
  "co-working-entry":     { zone: "blrxzo-house", id: "checkin" },
  "activity-revenue":     { zone: "blrxzo-house", id: "ops-board" },
  "morning-audit":        { zone: "hq", id: "display-wall" },
};

// ── Main Component ─────────────────────────────────────────────────

function AgentCharacter({
  modelPath,
  position = [0, 0, 0],
  zoneSize = [10, 10],
  zoneKey = "hq",
  zoneCenter = [0, 0, 0],
  color = null,
  status = "offline",
  agentId = "",
  agentName = "",
  agentRole = "",
  agentRoleLabel = "",
  agentHomeZone = "hq",
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

  const [currentMode, setCurrentMode] = useState("idle");
  const [activityText, setActivityText] = useState("");
  const [activityEmoji, setActivityEmoji] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [visitReason, setVisitReason] = useState("");

  const startVisit = useAgentStore((s) => s.startVisit);
  const startMeeting = useAgentStore((s) => s.startMeeting);
  const endVisit = useAgentStore((s) => s.endVisit);

  // Current zone key — tracks where the agent actually is (for LOKI nomad rotation)
  const currentZoneKeyRef = useRef(zoneKey);

  // Get zone interactions for this agent's current zone
  const zoneInteractions = useMemo(() => {
    return ZONE_INTERACTIONS[zoneKey] || ZONE_INTERACTIONS.hq;
  }, [zoneKey]);

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

    // LOKI nomad: time to rotate to next zone
    nextNomadRotation: agentHomeZone === "nomad"
      ? Date.now() + NOMAD_MIN_MS + Math.random() * (NOMAD_MAX_MS - NOMAD_MIN_MS)
      : Infinity,

    visitingAgentId: null,
    currentInteraction: null,
    workSessionsToday: 0,
  });

  const { scene, animations } = useGLTF(modelPath);
  const clonedScene = useMemo(() => skeletonClone(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, characterRef);

  // Zone boundaries — based on zone center for full zone wandering
  const zoneBounds = useMemo(() => {
    const zc = zoneCenter;
    const halfW = (zoneSize[0] / 2) - 2;
    const halfD = (zoneSize[1] / 2) - 2;
    return {
      minX: zc[0] - halfW,
      maxX: zc[0] + halfW,
      minZ: zc[2] - halfD,
      maxZ: zc[2] + halfD,
    };
  }, [zoneCenter, zoneSize]);

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

  // ── Behavior: Go to interaction point (offset from zone center) ──
  const goToInteraction = useCallback((interaction) => {
    const s = stateRef.current;
    const zc = zoneCenter;
    let targetX = zc[0] + interaction.offset[0];
    let targetZ = zc[2] + interaction.offset[2];

    // Anti-crowding: if agents already near target, offset around it
    const others = getAllPositions();
    let crowdCount = 0;
    for (const otherId in others) {
      if (otherId === agentId) continue;
      const o = others[otherId];
      const d = Math.sqrt((targetX - o.x) ** 2 + (targetZ - o.z) ** 2);
      if (d < SEPARATION_RADIUS) crowdCount++;
    }
    if (crowdCount > 0) {
      const angle = (crowdCount * 1.2) + Math.random() * 0.5;
      targetX += Math.cos(angle) * 2.0;
      targetZ += Math.sin(angle) * 2.0;
    }

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
  }, [zoneCenter, position, startWalk, agentId]);

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

    // Face towards zone center
    const zc = zoneCenter;
    const dx = zc[0] - s.currentPos.x;
    const dz = zc[2] - s.currentPos.z;
    if (Math.abs(dx) > 0.5 || Math.abs(dz) > 0.5) {
      s.targetRotation = Math.atan2(dx, dz);
    }

    startIdle();
  }, [zoneCenter, startIdle]);

  // ── Behavior: Random wander within zone ──────────────────────────
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

  // ── Behavior: Visit another agent (cross-zone or same-zone) ──────
  const visitAgent = useCallback((targetAgentId) => {
    // Use live position from registry, fall back to static allAgentPositions
    const livePos = getAgentWorldPosition(targetAgentId);
    const staticInfo = allAgentPositions[targetAgentId];
    if (!livePos && !staticInfo) return;

    const s = stateRef.current;
    const tx = livePos ? livePos[0] : staticInfo.position[0];
    const ty = livePos ? livePos[1] : staticInfo.position[1];
    const tz = livePos ? livePos[2] : staticInfo.position[2];

    // Determine visit reason based on zone pair
    const fromZone = currentZoneKeyRef.current;
    const allPos = getAllPositions();
    const toZone = allPos[targetAgentId]?.zoneKey || staticInfo?.zoneKey || fromZone;
    const routeKey = `${fromZone}->${toZone}`;
    const reasons = VISIT_REASONS[routeKey] || ["Quick sync", "Collaboration", "Update"];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];

    const offset = 3;
    const angle = Math.random() * Math.PI * 2;
    s.targetPos.set(tx + Math.cos(angle) * offset, ty, tz + Math.sin(angle) * offset);

    // Same-zone visit = walk, cross-zone = run
    const isCrossZone = fromZone !== toZone;

    s.mode = "traveling";
    s.isMoving = true;
    s.visitingAgentId = targetAgentId;

    setCurrentMode("traveling");
    setActivityText(reason);
    setActivityEmoji(isCrossZone ? "🏃" : "🚶");
    setVisitReason(reason);

    const dx = s.targetPos.x - s.currentPos.x;
    const dz = s.targetPos.z - s.currentPos.z;
    s.targetRotation = Math.atan2(dx, dz);

    if (isCrossZone) {
      startRun();
    } else {
      startWalk();
    }
    startVisit(agentId, targetAgentId);
  }, [allAgentPositions, startRun, startWalk, startVisit, agentId]);

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

  // ── LOKI nomad rotation ──────────────────────────────────────────
  const nomadRotate = useCallback(() => {
    const s = stateRef.current;
    const allZoneKeys = Object.keys(ZONE_POSITIONS);
    const currentZone = currentZoneKeyRef.current;

    // Pick a different zone
    const otherZones = allZoneKeys.filter((z) => z !== currentZone);
    const nextZone = otherZones[Math.floor(Math.random() * otherZones.length)];
    const targetZonePos = ZONE_POSITIONS[nextZone].position;

    currentZoneKeyRef.current = nextZone;

    // Run to center of next zone
    s.targetPos.set(targetZonePos[0], position[1], targetZonePos[2]);
    s.mode = "nomad-traveling";
    s.isMoving = true;

    setCurrentMode("traveling");
    setActivityText(`Rotating to ${ZONE_POSITIONS[nextZone].label}`);
    setActivityEmoji("🌀");

    const dx = s.targetPos.x - s.currentPos.x;
    const dz = s.targetPos.z - s.currentPos.z;
    s.targetRotation = Math.atan2(dx, dz);

    startRun();

    // Schedule next rotation
    s.nextNomadRotation = Date.now() + NOMAD_MIN_MS + Math.random() * (NOMAD_MAX_MS - NOMAD_MIN_MS);
  }, [position, startRun]);

  // ── Pick next activity ───────────────────────────────────────────
  const pickNextActivity = useCallback(() => {
    const activity = STATUS_ACTIVITY[status] || 0.3;
    const s = stateRef.current;

    // 1. Offline → return home, idle
    if (status === "offline") {
      s.targetPos.copy(s.homePos);
      s.mode = "returning";
      s.isMoving = true;
      setCurrentMode("returning");
      setActivityText("Going offline");
      setActivityEmoji("💤");
      startWalk();
      return;
    }

    // 2. If gateway has a current task → go to the mapped interaction point
    if (currentTask) {
      const taskKey = Object.keys(TASK_TO_INTERACTION).find((k) =>
        currentTask.toLowerCase().includes(k.replace(/-/g, " ")) ||
        currentTask.toLowerCase().includes(k)
      );
      const mapping = taskKey ? TASK_TO_INTERACTION[taskKey] : null;

      if (mapping) {
        const targetInteractions = ZONE_INTERACTIONS[mapping.zone];
        const interaction = targetInteractions?.find((i) => i.id === mapping.id);
        if (interaction) {
          // Override activity text with task name
          goToInteraction(interaction);
          setActivityText(`Running: ${currentTask}`);
          return;
        }
      }
      // No mapping found — still show the task, go to a desk
      const currentInteractions = ZONE_INTERACTIONS[currentZoneKeyRef.current] || ZONE_INTERACTIONS.hq;
      const deskInteraction = currentInteractions.find((i) => i.id.includes("desk")) || currentInteractions[0];
      if (deskInteraction) {
        goToInteraction(deskInteraction);
        setActivityText(`Running: ${currentTask}`);
        return;
      }
    }

    // 3. No task → existing random roll but prefer unoccupied interaction points
    const currentInteractions = ZONE_INTERACTIONS[currentZoneKeyRef.current] || ZONE_INTERACTIONS.hq;
    const roll = Math.random();

    if (roll < 0.55 * activity && currentInteractions.length > 0) {
      // Anti-crowding: score each interaction point by how many agents are nearby
      const others = getAllPositions();
      const scored = currentInteractions.map((interaction) => {
        const zc = zoneCenter;
        const ix = zc[0] + interaction.offset[0];
        const iz = zc[2] + interaction.offset[2];
        let crowding = 0;
        for (const otherId in others) {
          if (otherId === agentId) continue;
          const o = others[otherId];
          const d = Math.sqrt((ix - o.x) ** 2 + (iz - o.z) ** 2);
          if (d < SEPARATION_RADIUS * 2) crowding++;
        }
        return { interaction, crowding };
      });
      // Sort by least crowded, pick from top 3
      scored.sort((a, b) => a.crowding - b.crowding);
      const pick = scored[Math.floor(Math.random() * Math.min(3, scored.length))];
      goToInteraction(pick.interaction);
    } else if (roll < 0.75 * activity) {
      startWandering();
    } else if (roll < 0.85 * activity) {
      s.mode = "thinking";
      s.activityEndTime = Date.now() + 3000 + Math.random() * 4000;
      setCurrentMode("thinking");
      setActivityText("Planning...");
      setActivityEmoji("🤔");
      startIdle();
      s.targetRotation += (Math.random() - 0.5) * Math.PI * 0.5;
    } else {
      s.mode = "idle";
      s.activityEndTime = Date.now() + 2000 + Math.random() * 3000;
      setCurrentMode("idle");
      setActivityText("");
      setActivityEmoji("");
      startIdle();
    }
  }, [status, currentTask, goToInteraction, startWandering, startIdle, startWalk, zoneCenter, agentId]);

  // ── Initialize ───────────────────────────────────────────────────
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;
    pickNextActivity();
  }, [actions]); // eslint-disable-line

  // ── 3C: Status-reactive — respond to gateway status changes ─────
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (!actions || Object.keys(actions).length === 0) return;

    if (status === "offline" && prev !== "offline") {
      // Immediately return home
      returnHome();
    } else if (
      (status === "active" || status === "online") &&
      (prev === "dormant" || prev === "standby" || prev === "offline")
    ) {
      // Woke up — force next activity, tighten visit timer
      stateRef.current.nextVisitTime = Date.now() + 8000;
      pickNextActivity();
    }
  }, [status]); // eslint-disable-line

  // ── 3D: Task interruption — react to new currentTask ────────────
  const prevTaskRef = useRef(currentTask);
  useEffect(() => {
    const prev = prevTaskRef.current;
    prevTaskRef.current = currentTask;
    if (!actions || Object.keys(actions).length === 0) return;
    if (currentTask && currentTask !== prev) {
      const s = stateRef.current;
      // If idle/wandering/thinking, force immediate activity pick
      if (s.mode === "idle" || s.mode === "wandering" || s.mode === "thinking") {
        pickNextActivity();
      }
    }
  }, [currentTask]); // eslint-disable-line

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

    // ── LOKI nomad rotation check ────────────────────────────────
    if (agentHomeZone === "nomad" && now > s.nextNomadRotation && s.mode !== "nomad-traveling" && s.mode !== "traveling" && s.mode !== "meeting") {
      nomadRotate();
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

        // Soft drift: nudge stationary agents apart if overlapping
        if (s.mode !== "celebrating") {
          const others = getAllPositions();
          let driftX = 0, driftZ = 0;
          for (const otherId in others) {
            if (otherId === agentId) continue;
            const o = others[otherId];
            const ox = s.currentPos.x - o.x;
            const oz = s.currentPos.z - o.z;
            const oDist = Math.sqrt(ox * ox + oz * oz);
            if (oDist < MIN_SEPARATION && oDist > 0.01) {
              driftX += (ox / oDist);
              driftZ += (oz / oDist);
            }
          }
          if (Math.abs(driftX) > 0.01 || Math.abs(driftZ) > 0.01) {
            const dLen = Math.sqrt(driftX * driftX + driftZ * driftZ);
            s.currentPos.x += (driftX / dLen) * IDLE_DRIFT_SPEED * delta;
            s.currentPos.z += (driftZ / dLen) * IDLE_DRIFT_SPEED * delta;
          }
        }

        // Check for visit opportunity — proximity-aware using live registry
        if (now > s.nextVisitTime && s.mode !== "celebrating") {
          const myZone = currentZoneKeyRef.current;
          const livePositions = getAllPositions();
          const otherAgents = Object.keys(livePositions).filter(id => id !== agentId);

          if (otherAgents.length > 0 && Math.random() < activity * 0.5) {
            const sameZone = [];
            const crossZone = [];
            for (const id of otherAgents) {
              const p = livePositions[id];
              const d = Math.sqrt((s.currentPos.x - p.x) ** 2 + (s.currentPos.z - p.z) ** 2);
              const entry = { id, dist: d };
              if (p.zoneKey === myZone) sameZone.push(entry);
              else crossZone.push(entry);
            }
            // Sort by distance (nearest first)
            sameZone.sort((a, b) => a.dist - b.dist);
            crossZone.sort((a, b) => a.dist - b.dist);

            let targetId;
            if (sameZone.length > 0 && (Math.random() < 0.7 || crossZone.length === 0)) {
              // Pick nearest same-zone agent (with slight randomness in top 3)
              const pool = sameZone.slice(0, Math.min(3, sameZone.length));
              targetId = pool[Math.floor(Math.random() * pool.length)].id;
            } else if (crossZone.length > 0) {
              targetId = crossZone[0].id; // nearest cross-zone
            }

            if (targetId) visitAgent(targetId);
          }
          s.nextVisitTime = now + (20000 + Math.random() * 35000) / activity;
        }
        break;

      case "goingToInteraction":
      case "wandering":
      case "traveling":
      case "returning":
      case "nomad-traveling":
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
            } else if (s.mode === "nomad-traveling") {
              pickNextActivity();
            } else {
              pickNextActivity();
            }
          } else {
            // Base movement toward target
            let vx = (dx / dist) * s.moveSpeed;
            let vz = (dz / dist) * s.moveSpeed;

            // Reynolds separation force — steer away from nearby agents
            const others = getAllPositions();
            let sepX = 0, sepZ = 0;
            for (const otherId in others) {
              if (otherId === agentId) continue;
              const o = others[otherId];
              const ox = s.currentPos.x - o.x;
              const oz = s.currentPos.z - o.z;
              const oDist = Math.sqrt(ox * ox + oz * oz);
              if (oDist < SEPARATION_RADIUS && oDist > 0.01) {
                const force = (SEPARATION_RADIUS - oDist) / SEPARATION_RADIUS;
                sepX += (ox / oDist) * force;
                sepZ += (oz / oDist) * force;
                // Hard minimum: strong push if too close
                if (oDist < MIN_SEPARATION) {
                  sepX += (ox / oDist) * 2;
                  sepZ += (oz / oDist) * 2;
                }
              }
            }
            vx += sepX * SEPARATION_STRENGTH;
            vz += sepZ * SEPARATION_STRENGTH;

            const moveAmount = Math.min(s.moveSpeed * delta, dist);
            const vLen = Math.sqrt(vx * vx + vz * vz) || 1;
            s.currentPos.x += (vx / vLen) * moveAmount;
            s.currentPos.z += (vz / vLen) * moveAmount;

            // Clamp to zone bounds (wandering mode)
            if (s.mode === "wandering") {
              s.currentPos.x = Math.max(zoneBounds.minX, Math.min(zoneBounds.maxX, s.currentPos.x));
              s.currentPos.z = Math.max(zoneBounds.minZ, Math.min(zoneBounds.maxZ, s.currentPos.z));
            }

            // Rotation follows actual velocity (visually turns when steering)
            s.targetRotation = Math.atan2(vx, vz);
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

    // Write live position to registry (zero-cost plain JS)
    updateAgentPosition(agentId, s.currentPos.x, s.currentPos.y, s.currentPos.z, s.mode, currentZoneKeyRef.current);

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
