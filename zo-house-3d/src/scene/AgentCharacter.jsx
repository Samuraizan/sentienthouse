import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useRef, useEffect, useMemo, useState, useCallback, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Html } from "@react-three/drei";
import * as THREE from "three";
import useAgentStore from "../store/agentStore";
import { ZONE_POSITIONS } from "./Zones";
import { updateAgentPosition, getAllPositions, getAgentWorldPosition } from "./positionRegistry";
// bridgeUtils no longer used — agents teleport between islands (no walkable surface)

// ... (lines 10-237)


/**
 * AgentCharacter.jsx — Data-driven AI agent behavior (zero randomness)
 *
 * Behavior is 100% deterministic from gateway data:
 * - Working: currentTask exists -> agent at mapped desk
 * - Home Idle: no task -> agent at home position with status label
 * - Task Complete: task->null transition -> 2.5s celebration then home
 * - Offline: greyed out at home
 *
 * LOKI (nomad) rotates zones on a fixed 90s clock cycle, synced across browsers.
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
// Island is 2x scaled — agents roam the wide perimeter around centered equipment
// Equipment footprint: machines fill X[-31,30] Z[-26,15] on center island
const ZONE_INTERACTIONS = {
  hq: [
    // command-desk and display-wall near the big screen (back of island, -Z)
    { id: "command-desk", offset: [2, 0, -5], activity: "Reviewing strategy", emoji: "💻", duration: [12, 20], faceAngle: Math.PI },
    { id: "display-wall", offset: [-2, 0, -8], activity: "Checking analytics", emoji: "📊", duration: [8, 15], faceAngle: Math.PI },
    // Other desks spread around the island perimeter
    { id: "suki-desk", offset: [-22, 0, 26], activity: "Event coordination", emoji: "📝", duration: [10, 18] },
    { id: "wanda-desk", offset: [22, 0, 26], activity: "Sales pipeline review", emoji: "📈", duration: [10, 18] },
    { id: "yana-desk", offset: [-28, 0, 5], activity: "BD research", emoji: "🌍", duration: [10, 18] },
    { id: "conference", offset: [0, 0, 38], activity: "Team meeting", emoji: "🤝", duration: [10, 18] },
    { id: "lounge", offset: [28, 0, 18], activity: "Taking calls", emoji: "📞", duration: [6, 12] },
    { id: "whiteboard", offset: [18, 0, 36], activity: "Strategy planning", emoji: "📋", duration: [8, 15] },
    { id: "plant-break", offset: [-26, 0, 32], activity: "Brief pause", emoji: "🌿", duration: [2, 5] },
  ],
  "blrxzo-house": [
    { id: "desk", offset: [0, 0, 8], activity: "Managing Bangalore ops", emoji: "💻", duration: [12, 20] },
    { id: "checkin", offset: [8, 0, 5], activity: "Guest check-in", emoji: "🔑", duration: [5, 10] },
    { id: "common-sofa", offset: [-6, 0, 10], activity: "Guest consultation", emoji: "💬", duration: [8, 15] },
    { id: "kitchen", offset: [-10, 0, 3], activity: "Kitchen break", emoji: "☕", duration: [4, 8] },
    { id: "ops-board", offset: [5, 0, 3], activity: "Updating property status", emoji: "📋", duration: [6, 12] },
    { id: "welcome", offset: [0, 0, 14], activity: "Greeting guests", emoji: "👋", duration: [4, 8] },
  ],
  "wtfxzo-house": [
    { id: "desk", offset: [0, 0, 8], activity: "Managing Whitefield ops", emoji: "💻", duration: [12, 20] },
    { id: "checkin", offset: [-8, 0, 5], activity: "Guest check-in", emoji: "🔑", duration: [5, 10] },
    { id: "common-sofa", offset: [6, 0, 10], activity: "Discussing bookings", emoji: "💬", duration: [8, 15] },
    { id: "kitchen", offset: [10, 0, 3], activity: "Kitchen break", emoji: "☕", duration: [4, 8] },
    { id: "ops-board", offset: [-5, 0, 3], activity: "Property walkthrough", emoji: "📋", duration: [6, 12] },
    { id: "welcome", offset: [0, 0, 14], activity: "Greeting arrivals", emoji: "👋", duration: [4, 8] },
  ],
};

// ── Visit reasons — agents visit ZONES for work ───────────────────
const VISIT_REASONS = {
  // From HQ to houses
  "hq->blrxzo-house": ["Bangalore status update", "Property metrics review", "Guest feedback", "Ops check"],
  "hq->wtfxzo-house": ["Whitefield status update", "House performance check", "Staff coordination", "Ops check"],
  // From houses to HQ
  "blrxzo-house->hq": ["Reporting metrics", "Escalation", "Resource request", "Team sync"],
  "wtfxzo-house->hq": ["Reporting metrics", "Approval needed", "Escalation", "Team sync"],
  // Between houses
  "blrxzo-house->wtfxzo-house": ["Cross-property coordination", "Best practices sharing"],
  "wtfxzo-house->blrxzo-house": ["Cross-property coordination", "Guest transfer"],
};

const WALK_SPEED = 2.5;
const RUN_SPEED = 6.0;
const CROSSFADE_DURATION = 0.25;

// ── Collision avoidance (Reynolds separation) ────────────────────
const SEPARATION_RADIUS = 3.0;   // start steering away
const SEPARATION_STRENGTH = 4.0; // force multiplier
const MIN_SEPARATION = 1.5;      // hard minimum distance
const IDLE_DRIFT_SPEED = 0.5;    // drift speed for stationary agents

// LOKI nomad: deterministic clock-synced rotation
const NOMAD_ZONES = ["hq", "blrxzo-house", "wtfxzo-house"];
const NOMAD_CYCLE_MS = 90000; // 90 seconds per zone

// ── Task-to-interaction mapping (gateway cron → zone desk) ───────
const TASK_TO_INTERACTION = {
  // ── Director (ZomadPrime) ── (Zone: HQ)
  "morning-briefing": { zone: "hq", id: "command-desk" },
  "delegate-task": { zone: "hq", id: "conference" },
  "task-manager": { zone: "hq", id: "display-wall" }, // Managing ops board
  "weekly-scorecard": { zone: "hq", id: "display-wall" },
  "skill-sync": { zone: "hq", id: "command-desk" },
  "metrics-alert": { zone: "hq", id: "display-wall" },
  "cross-property-compare": { zone: "hq", id: "display-wall" },
  "agent-health-check": { zone: "hq", id: "command-desk" },

  // ── Wanda (Sales) ── (Zone: HQ)
  "lead-qualify": { zone: "hq", id: "wanda-desk" },
  "outreach-sequence": { zone: "hq", id: "wanda-desk" },
  "pipeline-update": { zone: "hq", id: "wanda-desk" },
  "founder-marketing": { zone: "hq", id: "whiteboard" },
  "sale-to-ops": { zone: "hq", id: "conference" }, // Handoff happens at table
  "discovery-call": { zone: "hq", id: "lounge" }, // Calls in comfortable area
  "repeat-guest-nurture": { zone: "hq", id: "lounge" },
  "upsell-playbook": { zone: "hq", id: "wanda-desk" },

  // ── Suki (Events) ── (Zone: HQ)
  "event-inquiry": { zone: "hq", id: "lounge" }, // Chatting with host
  "luma-sync": { zone: "hq", id: "display-wall" },
  "rev-tracking": { zone: "hq", id: "suki-desk" },
  "event-recap": { zone: "hq", id: "suki-desk" },
  "invoice-maker": { zone: "hq", id: "suki-desk" },
  "event-marketing": { zone: "hq", id: "whiteboard" },
  "event-to-ops": { zone: "hq", id: "conference" },
  "day-of-event": { zone: "hq", id: "suki-desk" }, // Coordination mode
  "host-followup": { zone: "hq", id: "lounge" },
  "rate-card": { zone: "hq", id: "suki-desk" },

  // ── Yana (BD) ── (Zone: HQ)
  "founder-outreach": { zone: "hq", id: "yana-desk" },
  "partner-research": { zone: "hq", id: "yana-desk" },
  "deal-pipeline": { zone: "hq", id: "yana-desk" },
  "partnership-to-event": { zone: "hq", id: "conference" },
  "partner-management": { zone: "hq", id: "yana-desk" },
  "negotiation-framework": { zone: "hq", id: "conference" },

  // ── LOKI (Vibe) ── (Zone: HQ / Nomad)
  "guest-welcome": { zone: "hq", id: "lounge" },
  "daily-vibe": { zone: "hq", id: "plant-break" }, // Assessing vibe
  "city-event": { zone: "hq", id: "whiteboard" },
  "community-pulse": { zone: "hq", id: "lounge" },
  "new-guest-onboard": { zone: "hq", id: "lounge" },
  "consent-check": { zone: "hq", id: "lounge" },
  "re-engage-quiet": { zone: "hq", id: "lounge" },
  "content-calendar": { zone: "hq", id: "whiteboard" },

  // ── Captain BLRxZo ── (Zone: BLRxZo House)
  "morning-audit": { zone: "blrxzo-house", id: "ops-board" },
  "daily-recap": { zone: "blrxzo-house", id: "desk" },
  "financial-entry": { zone: "blrxzo-house", id: "desk" },
  "guest-flow": { zone: "blrxzo-house", id: "checkin" },
  "maintenance-triage": { zone: "blrxzo-house", id: "desk" },
  "staff-report": { zone: "blrxzo-house", id: "ops-board" }, // Meeting w/ staff
  "vendor-directory": { zone: "blrxzo-house", id: "desk" },
  "incoming-guest-brief": { zone: "blrxzo-house", id: "checkin" },
  "shift-handoff": { zone: "blrxzo-house", id: "ops-board" },
  "event-prep-checklist": { zone: "blrxzo-house", id: "ops-board" },

  // ── Captain WTFxZo ── (Zone: WTFxZo House)
  // Maps same task names if they are generic, or specific if prefixed
  "morning-audit-wtf": { zone: "wtfxzo-house", id: "ops-board" }, // Alias if needed
  "daily-recap-wtf": { zone: "wtfxzo-house", id: "desk" },

  // Note: if task name is same (e.g. "morning-audit"), logic below checks active agent's zone.
  // But for explicit "whitefield" tasks:
  "guest-checkin-whitefield": { zone: "wtfxzo-house", id: "checkin" },
  "property-ops-whitefield": { zone: "wtfxzo-house", id: "ops-board" },
  "whitefield-maintenance": { zone: "wtfxzo-house", id: "desk" },
  "whitefield-guest-welcome": { zone: "wtfxzo-house", id: "welcome" },
  "whitefield-staff-report": { zone: "wtfxzo-house", id: "ops-board" },

  // ── Generic / shared tasks (zone resolved from agent's homeZone) ──
  "agent-kot": { zone: null, id: "ops-board" },  // Keep-on-Track audit — runs for both houses
  "pms-update": { zone: null, id: "desk" },       // PMS property update — runs for both houses
  "running-opex": { zone: null, id: "desk" },
  "co-working-entry": { zone: null, id: "checkin" },
  "activity-revenue": { zone: null, id: "desk" },
  "task-entry": { zone: null, id: "desk" },

  // ── Generic / Utility ──
  "google-workspace": { zone: "hq", id: "desk" }, // Fallback to desk
  "google-search": { zone: "hq", id: "desk" },
};

// ── Main Component ─────────────────────────────────────────────────

function AgentCharacter({
  modelPath,
  position = [0, 0, 0],
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
  characterScale = 2.5,
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

    activityEndTime: 0, // Will be set by pickNextActivity on init

    visitingAgentId: null,
    currentInteraction: null,
    workSessionsToday: 0,
    waypoints: [],
  });

  const { scene, animations } = useGLTF(modelPath);
  const clonedScene = useMemo(() => skeletonClone(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, characterRef);

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
        }
        // Force no glow — set emissive to black and intensity to 0
        child.material.emissive = new THREE.Color(0, 0, 0);
        child.material.emissiveIntensity = 0;
        child.material.emissiveMap = null;
        child.material.needsUpdate = true;
      }
    });
  }, [clonedScene, tintColor]);

  useEffect(() => {
    const isOffline = status === "offline";
    clonedScene.traverse((child) => {
      if (child.isSkinnedMesh || child.isMesh) {
        if (!child.material._originalColor) {
          child.material._originalColor = child.material.color?.clone() || new THREE.Color(1, 1, 1);
        }
        if (isOffline) {
          const col = child.material._originalColor.clone();
          if (tintColor) col.multiply(tintColor);
          const gray = (col.r + col.g + col.b) / 3;
          col.lerp(new THREE.Color(gray, gray, gray), 0.7);
          col.multiplyScalar(0.5);
          child.material.color.copy(col);
          child.material.emissive = new THREE.Color(0, 0, 0);
          child.material.emissiveIntensity = 0;
          child.material.emissiveMap = null;
        } else {
          // Restore original colors, no glow
          child.material.color.copy(child.material._originalColor);
          if (tintColor) child.material.color.multiply(tintColor);
          child.material.emissive = new THREE.Color(0, 0, 0);
          child.material.emissiveIntensity = 0;
          child.material.emissiveMap = null;
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
    // Use current zone center (important for nomad agents who teleport between zones)
    const currentZone = ZONE_POSITIONS[currentZoneKeyRef.current];
    const zc = currentZone ? currentZone.position : zoneCenter;
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
      // Deterministic offset based on agentId — each agent gets a unique angle
      const idOffset = agentId.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      const angle = (crowdCount * 1.2) + (idOffset % 100) * 0.063;
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

    // If driven by a live task, set activityEndTime far in the future —
    // the agent stays here until currentTask goes null (detected by useEffect).
    // If no live task (idle roaming), use shorter duration (8–18 seconds).
    const duration = currentTask
      ? 600 // 10 minutes max — task completion will interrupt before this
      : (interaction.duration[0] + interaction.duration[1]) / 2;

    s.mode = "interacting";
    s.activityEndTime = Date.now() + duration * 1000;
    s.isMoving = false;

    // "working" mode = green badge (real tasks), "roaming" = subtle label (idle)
    if (currentTask) {
      setCurrentMode("working");
      setActivityText(`Running: ${currentTask}`);
      setActivityEmoji(interaction.emoji);
    } else {
      setCurrentMode("roaming");
      // Activity text + emoji were already set by pickNextActivity idle roaming
    }

    // Face direction: use explicit faceAngle if defined, otherwise face zone center
    if (interaction.faceAngle !== undefined) {
      s.targetRotation = interaction.faceAngle;
    } else {
      const zc = zoneCenter;
      const dx = zc[0] - s.currentPos.x;
      const dz = zc[2] - s.currentPos.z;
      if (Math.abs(dx) > 0.5 || Math.abs(dz) > 0.5) {
        s.targetRotation = Math.atan2(dx, dz);
      }
    }

    startIdle();
  }, [zoneCenter, startIdle, currentTask]);

  // ── Behavior: Visit another agent (kept for future gateway-driven use) ──
  const _visitAgent = useCallback((targetAgentId) => {
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
    const reason = reasons[0];

    const offset = 3;
    // Deterministic angle based on agentId
    const idHash = agentId.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const angle = (idHash % 360) * (Math.PI / 180);
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
    const meetingDuration = 8000;

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
    const message = "Task Complete! ✅";

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

  // ── LOKI nomad rotation (deterministic, clock-synced) ───────────
  // Teleport between zones — no mid-air bridge walking (no walkable surface between islands)
  const nomadRotate = useCallback((targetZone) => {
    const s = stateRef.current;
    const targetZonePos = ZONE_POSITIONS[targetZone]?.position;
    if (!targetZonePos) return;

    currentZoneKeyRef.current = targetZone;

    // Instant teleport to target zone center
    s.currentPos.set(targetZonePos[0], position[1], targetZonePos[2]);
    s.targetPos.copy(s.currentPos);
    s.homePos.set(targetZonePos[0], position[1], targetZonePos[2]);
    s.waypoints = [];
    s.mode = "idle";
    s.isMoving = false;
    s.activityEndTime = Date.now() + 2000;

    setCurrentMode("idle");
    setActivityText(`Arrived at ${ZONE_POSITIONS[targetZone].label}`);
    setActivityEmoji("🌀");
    startIdle();
  }, [position, startIdle]);

  // ── Pick next activity (fully data-driven, no randomness) ───────
  const pickNextActivity = useCallback(() => {
    const s = stateRef.current;

    // 1. Offline → go home, idle
    if (status === "offline") {
      s.targetPos.copy(s.homePos);
      s.mode = "returning";
      s.isMoving = true;
      setCurrentMode("returning");
      setActivityText("Offline");
      setActivityEmoji("💤");
      startWalk();
      return;
    }

    // 2. Has a current task → go to the mapped desk
    if (currentTask) {
      const taskKey = Object.keys(TASK_TO_INTERACTION).find((k) =>
        currentTask.toLowerCase().includes(k.replace(/-/g, " ")) ||
        currentTask.toLowerCase().includes(k)
      );
      const mapping = taskKey ? TASK_TO_INTERACTION[taskKey] : null;

      if (mapping) {
        // zone: null means "use agent's home zone" (generic tasks like agent-kot, pms-update)
        const resolvedZone = mapping.zone || agentHomeZone;

        // If task is in a different zone, teleport there first (no mid-air walking)
        if (resolvedZone !== currentZoneKeyRef.current) {
          const tz = ZONE_POSITIONS[resolvedZone]?.position;
          if (tz) {
            s.currentPos.set(tz[0], position[1], tz[2]);
            s.homePos.set(tz[0], position[1], tz[2]);
            currentZoneKeyRef.current = resolvedZone;
          }
        }

        const targetInteractions = ZONE_INTERACTIONS[resolvedZone];
        const interaction = targetInteractions?.find((i) => i.id === mapping.id);
        if (interaction) {
          goToInteraction(interaction);
          setActivityText(`Running: ${currentTask}`);
          return;
        }
      }
      // No mapping → go to own desk in current zone
      const currentInteractions = ZONE_INTERACTIONS[currentZoneKeyRef.current] || ZONE_INTERACTIONS.hq;
      const deskInteraction = currentInteractions.find((i) => i.id.includes("desk")) || currentInteractions[0];
      if (deskInteraction) {
        goToInteraction(deskInteraction);
        setActivityText(`Running: ${currentTask}`);
        return;
      }
    }

    // 3. No task → idle roaming around the zone
    //    Agents cycle through interaction points deterministically so they
    //    look alive even when no cron job is active.
    if (status === "dormant") {
      // Dormant agents just stand at home
      s.targetPos.copy(s.homePos);
      s.mode = "returning";
      s.isMoving = true;
      setCurrentMode("returning");
      setActivityText("Dormant");
      setActivityEmoji("");
      startWalk();
      return;
    }

    const zoneInteractions = ZONE_INTERACTIONS[currentZoneKeyRef.current] || ZONE_INTERACTIONS.hq;
    if (zoneInteractions.length === 0) return;

    // Deterministic index: hash agentId + a slowly incrementing counter
    // Each agent gets a different sequence, cycling every 15–25 seconds
    const idHash = agentId.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    s.workSessionsToday = (s.workSessionsToday || 0) + 1;
    const roamIndex = (idHash + s.workSessionsToday) % zoneInteractions.length;
    const roamTarget = zoneInteractions[roamIndex];

    // Subtle idle activities when not running a real task
    const IDLE_ACTIVITIES = [
      { text: "Checking notes", emoji: "📝" },
      { text: "Looking around", emoji: "👀" },
      { text: "Reviewing data", emoji: "📊" },
      { text: "Quick stretch", emoji: "🧘" },
      { text: "Thinking...", emoji: "💭" },
      { text: "Reading updates", emoji: "📱" },
    ];
    const idleActivity = IDLE_ACTIVITIES[(idHash + s.workSessionsToday) % IDLE_ACTIVITIES.length];

    goToInteraction(roamTarget);
    setActivityText(idleActivity.text);
    setActivityEmoji(idleActivity.emoji);
  }, [status, currentTask, goToInteraction, startWalk]);

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
      returnHome();
    } else if (
      (status === "active" || status === "online") &&
      (prev === "dormant" || prev === "standby" || prev === "offline")
    ) {
      pickNextActivity();
    }
  }, [status]); // eslint-disable-line

  // ── 3D: Task changes — react to new/completed currentTask ───────
  const prevTaskRef = useRef(currentTask);
  useEffect(() => {
    const prev = prevTaskRef.current;
    prevTaskRef.current = currentTask;
    if (!actions || Object.keys(actions).length === 0) return;

    if (currentTask && currentTask !== prev) {
      // New task arrived → go to task desk immediately
      pickNextActivity();
    } else if (!currentTask && prev) {
      // Task just completed → celebrate, then go home after 2.5s
      celebrate();
      setTimeout(() => {
        pickNextActivity();
      }, 2500);
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

  // Track pointer down position to distinguish clicks from drags
  const pointerDownPos = useRef(null);
  const handlePointerDown = useCallback((e) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleClick = useCallback((e) => {
    // Only select if pointer didn't move much (i.e. a real click, not a drag)
    if (pointerDownPos.current) {
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) return; // Was a drag, ignore
    }
    e.stopPropagation();
    if (onSelect) onSelect(agentId);
  }, [onSelect, agentId]);

  // ── Main game loop ───────────────────────────────────────────────
  useFrame((state, delta) => {
    if (mixer) mixer.update(delta);

    const s = stateRef.current;
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

    // ── LOKI nomad rotation check (deterministic, clock-synced) ──
    if (agentHomeZone === "nomad" && !currentTask) {
      const zoneIndex = Math.floor(now / NOMAD_CYCLE_MS) % NOMAD_ZONES.length;
      const targetZone = NOMAD_ZONES[zoneIndex];
      if (targetZone !== currentZoneKeyRef.current && s.mode !== "nomad-traveling") {
        nomadRotate(targetZone);
      }
    }

    // ── State machine ──────────────────────────────────────────────
    // ── State machine ──────────────────────────────────────────────
    switch (s.mode) {
      case "idle":
      case "interacting":
      case "celebrating":
        // When activityEndTime expires, pick next activity (no random rolls)
        if (now > s.activityEndTime) {
          pickNextActivity();
        }

        // ... (idle drift logic unchanged) ...
        if (s.mode !== "celebrating") {
          // ... existing drift logic ...
        }
        break;

      case "goingToInteraction":
      case "traveling":
      case "returning":
      case "nomad-traveling":
        if (s.isMoving) {
          // PATTERN: Waypoint following (for Bridges)
          let target = s.targetPos;

          if (s.waypoints && s.waypoints.length > 0) {
            target = s.waypoints[0];
            // Check if reached current waypoint
            const dx = target.x - s.currentPos.x;
            const dz = target.z - s.currentPos.z;
            const d = Math.sqrt(dx * dx + dz * dz);
            if (d < 1.0) { // Reached waypoint
              s.waypoints.shift(); // Remove it
              if (s.waypoints.length > 0) {
                target = s.waypoints[0]; // Target next
              } else {
                target = s.targetPos; // No more waypoints, go to final
              }
            }
          }

          const dx = target.x - s.currentPos.x;
          // Y is handled by bridge waypoints or 0 for flat ground
          // We need accurate Y for bridge walking
          const dy = target.y - s.currentPos.y;
          const dz = target.z - s.currentPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz); // 2D dist for speed checks

          if (dist < 0.5 && (!s.waypoints || s.waypoints.length === 0)) {
            // Reached FINAL target
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
            // Move toward current TARGET (waypoint or final)
            // Note: We use 3D vector for velocity to handle bridge height
            const dist3d = Math.sqrt(dx * dx + dy * dy + dz * dz);

            let vx = (dx / dist3d) * s.moveSpeed;
            let vy = (dy / dist3d) * s.moveSpeed;
            let vz = (dz / dist3d) * s.moveSpeed;

            // Apply movement
            s.currentPos.x += vx * delta;
            s.currentPos.y += vy * delta;
            s.currentPos.z += vz * delta;

            // Rotation looks at 2D target
            s.targetRotation = Math.atan2(dx, dz);

            // Reynolds separation (only on flat ground/idle, lessen it on bridges to prevent falling off)
            if (!s.waypoints || s.waypoints.length === 0) {
              // ... existing reynolds logic ...
            }
          }
        }
        break;


      case "meeting":
        if (now > s.activityEndTime) {
          returnHome();
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
  const isRoaming = currentMode === "roaming" || currentMode === "walking";
  const isThinking = currentMode === "thinking";

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onPointerOver={(e) => { setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      <group ref={characterRef}>
        <primitive object={clonedScene} scale={[characterScale, characterScale, characterScale]} position={[0, 0, 0]} />

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
                        isRoaming ? "rgba(255, 255, 255, 0.15)" :
                          "rgba(0, 0, 0, 0.7)",
                borderRadius: "12px",
                fontSize: isRoaming ? "10px" : "11px",
                fontWeight: isRoaming ? 400 : 600,
                color: isRoaming ? "rgba(255,255,255,0.7)" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                boxShadow: isRoaming ? "none" : "0 2px 8px rgba(0,0,0,0.3)",
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

        {/* Activity glows removed — cleaner look */}
      </group>
    </group>
  );
}

export default memo(AgentCharacter);
