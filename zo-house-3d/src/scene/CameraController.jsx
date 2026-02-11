import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import useAgentStore from "../store/agentStore";
import { ZONE_POSITIONS } from "./Zones";

const LERP_SPEED = 2.8;
const CINEMATIC_ORBIT_SPEED = 0.1;
const ARRIVE_THRESHOLD = 0.05;

const PRESETS = {
  overview: {
    position: new THREE.Vector3(120, 85, 120),
    target: new THREE.Vector3(0, 0, 0),
  },
  topdown: {
    position: new THREE.Vector3(0.001, 160, 0.001),
    target: new THREE.Vector3(0, 0, 0),
  },
};

function agentFocusCamera(role) {
  const zone = ZONE_POSITIONS[role];
  if (!zone) {
    return {
      position: new THREE.Vector3(120, 85, 120),
      target: new THREE.Vector3(0, 0, 0),
    };
  }

  const agentPos = new THREE.Vector3(
    zone.position[0],
    zone.position[1],
    zone.position[2]
  );

  // Direction FROM center TO agent (agents face center, so we go opposite direction)
  const dir = agentPos.clone().normalize();
  if (dir.length() < 0.01) dir.set(0, 0, 1);

  // Position camera IN FRONT of agent (between agent and center)
  // by going in the OPPOSITE direction from the agent
  const cameraPos = agentPos
    .clone()
    .sub(dir.multiplyScalar(35))  // Move toward center (in front of agent)
    .add(new THREE.Vector3(0, 18, 0));  // Raise camera height

  const targetPos = agentPos.clone().add(new THREE.Vector3(0, 5, 0));

  return { position: cameraPos, target: targetPos };
}

export default function CameraController() {
  const controlsRef = useRef();
  const { camera } = useThree();

  const skillTreeAgentId = useAgentStore((s) => s.skillTreeAgentId);
  const cameraPreset = useAgentStore((s) => s.cameraPreset);
  const agents = useAgentStore((s) => s.agents);

  const goalPosition = useRef(new THREE.Vector3(120, 85, 120));
  const goalTarget = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(false);
  const isCinematic = useRef(false);
  const cinematicAngle = useRef(0);

  useEffect(() => {
    if (skillTreeAgentId) {
      const agent = agents.find((a) => a.id === skillTreeAgentId);
      if (agent) {
        const { position, target } = agentFocusCamera(agent.role);
        goalPosition.current.copy(position);
        goalTarget.current.copy(target);
        isTransitioning.current = true;
        isCinematic.current = false;
        return;
      }
    }

    if (cameraPreset === "cinematic") {
      isCinematic.current = true;
      isTransitioning.current = false;
      return;
    }

    isCinematic.current = false;

    const preset = PRESETS[cameraPreset] || PRESETS.overview;
    goalPosition.current.copy(preset.position);
    goalTarget.current.copy(preset.target);
    isTransitioning.current = true;
  }, [skillTreeAgentId, cameraPreset, agents]);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    if (isCinematic.current) {
      cinematicAngle.current += CINEMATIC_ORBIT_SPEED * delta;
      const radius = 44;
      const height = 24;
      const a = cinematicAngle.current;
      camera.position.set(
        radius * Math.sin(a),
        height,
        radius * Math.cos(a)
      );
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      return;
    }

    if (isTransitioning.current) {
      const lerpFactor = 1 - Math.exp(-LERP_SPEED * delta);

      camera.position.lerp(goalPosition.current, lerpFactor);
      controlsRef.current.target.lerp(goalTarget.current, lerpFactor);
      controlsRef.current.update();

      const posDist = camera.position.distanceTo(goalPosition.current);
      const tgtDist = controlsRef.current.target.distanceTo(goalTarget.current);
      if (posDist < ARRIVE_THRESHOLD && tgtDist < ARRIVE_THRESHOLD) {
        camera.position.copy(goalPosition.current);
        controlsRef.current.target.copy(goalTarget.current);
        controlsRef.current.update();
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.5}
      minDistance={5}
      maxDistance={100}
      enablePan={true}
      panSpeed={0.8}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      enableDamping={true}
      dampingFactor={0.05}
      target={[0, 0, 0]}
    />
  );
}
