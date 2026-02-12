import { useEffect } from "react";
import Scene from "./scene/Scene";
import StatusBar from "./ui/StatusBar";

import MetricsDashboard from "./ui/MetricsDashboard";
import CameraControls from "./ui/CameraControls";
import AgentPanel from "./ui/AgentPanel";
import SkillTreeModal from "./ui/SkillTreeModal";
import { startPolling, stopPolling } from "./services/gateway";
import "./index.css";

/**
 * App.jsx — Root component for the Zo House 3D Command Center.
 *
 * Renders the full-viewport Three.js scene (Canvas) with HTML UI overlays
 * layered on top. The overlays use pointer-events:none so mouse events
 * pass through to the 3D canvas by default.
 *
 * Initializes the gateway polling service on mount.
 */
export default function App() {
  // Start polling the gateway for live agent data
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, []);

  return (
    <>
      {/* 3D Scene fills the entire viewport */}
      <Scene />

      {/* HTML UI Overlay Layer */}
      <div className="ui-overlay">
        {/* Top status bar */}
        <StatusBar />


        {/* Bottom-right metrics card */}
        <MetricsDashboard />

        {/* Right-side agent detail panel (slides in on select) */}
        <AgentPanel />
      </div>

      {/* Full-screen skill tree modal — rendered outside ui-overlay so it sits above all 3D Html labels */}
      <SkillTreeModal />
    </>
  );
}
