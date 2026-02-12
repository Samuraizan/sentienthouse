import { useRef, useEffect, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/**
 * CameraController.jsx — Simple, non-fighting camera for the 3D Command Center.
 *
 * Default: front-top view looking down at all 3 islands.
 * OrbitControls handles ALL user interaction — no transition loops fighting it.
 *
 * Controls:
 *   Left-drag   → orbit / rotate
 *   Right-drag  → pan
 *   Scroll      → zoom
 *   Pinch       → zoom (touch)
 *   2-finger    → pan (touch)
 */

export default function CameraController() {
  const controlsRef = useRef();
  const { camera } = useThree();

  // Set initial camera to front-top view on first mount only
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Front-top view: slightly forward, looking down at the islands
    camera.position.set(0, 130, 160);
    camera.lookAt(0, 0, 0);

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={15}
      maxDistance={350}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      screenSpacePanning={true}
      panSpeed={1.2}
      rotateSpeed={0.5}
      zoomSpeed={1.2}
      enableDamping={true}
      dampingFactor={0.1}
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
