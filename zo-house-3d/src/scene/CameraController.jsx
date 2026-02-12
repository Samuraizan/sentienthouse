import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import useAgentStore from "../store/agentStore";
import { ZONE_POSITIONS, ZONE_HOME_OFFSETS } from "./Zones";

const LERP_SPEED = 2.8;
const CINEMATIC_ORBIT_SPEED = 0.1;
const ARRIVE_THRESHOLD = 0.05;

const PRESETS = {
  overview: {
    position: new THREE.Vector3(110, 80, 100), // pulled back for 2x island
    target: new THREE.Vector3(0, 0, 0),
  },
  topdown: {
    position: new THREE.Vector3(0.001, 200, 0.001), // higher for wider island
    target: new THREE.Vector3(0, 0, 0),
  },
};

function agentFocusCamera(agent) {
  // Resolve agent position using homeZone + offset
  const homeZoneKey = agent.homeZone === "nomad" ? "hq" : agent.homeZone;
  const zone = ZONE_POSITIONS[homeZoneKey];
  if (!zone) {
    return {
      position: new THREE.Vector3(90, 70, 90),
      target: new THREE.Vector3(0, 0, 0),
    };
  }

  const offset = ZONE_HOME_OFFSETS[agent.id] || [0, 0, 0];
  const agentPos = new THREE.Vector3(
    zone.position[0] + offset[0],
    zone.position[1],
    zone.position[2] + offset[2]
  );

  const dir = agentPos.clone().normalize();
  if (dir.length() < 0.01) dir.set(0, 0, 1);

  const cameraPos = agentPos
    .clone()
    .sub(dir.multiplyScalar(28))
    .add(new THREE.Vector3(0, 14, 0));

  const targetPos = agentPos.clone().add(new THREE.Vector3(0, 4, 0));

  return { position: cameraPos, target: targetPos };
}

export default function CameraController() {
  const controlsRef = useRef();
  const { camera } = useThree();

  const skillTreeAgentId = useAgentStore((s) => s.skillTreeAgentId);
  const cameraPreset = useAgentStore((s) => s.cameraPreset);
  const agents = useAgentStore((s) => s.agents);

  const goalPosition = useRef(new THREE.Vector3(110, 80, 100));
  const goalTarget = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(false);
  const isCinematic = useRef(false);
  const cinematicAngle = useRef(0);

  useEffect(() => {
    if (skillTreeAgentId) {
      const agent = agents.find((a) => a.id === skillTreeAgentId);
      if (agent) {
        const { position, target } = agentFocusCamera(agent);
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
      const radius = 120;
      const height = 55;
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
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2.15}
      minDistance={8}
      maxDistance={300}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      screenSpacePanning={true}
      panSpeed={1.5}
      rotateSpeed={0.7}
      zoomSpeed={1.5}
      enableDamping={true}
      dampingFactor={0.12}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      target={[0, 0, 0]}
      makeDefault
    />
  );
}
