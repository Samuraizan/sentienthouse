import { useEffect, useCallback } from "react";
import useAgentStore from "../store/agentStore";

const OVERVIEW = {
  id: "overview",
  label: "Overview",
  shortcut: "1",
  icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
};

const RESET_BUTTON = {
  id: "reset",
  label: "Reset",
  shortcut: "Esc",
  icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
};

export default function CameraControls() {
  const cameraPreset = useAgentStore((s) => s.cameraPreset);
  const setCameraPreset = useAgentStore((s) => s.setCameraPreset);
  const clearSelectedAgent = useAgentStore((s) => s.clearSelectedAgent);
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);

  const handlePreset = useCallback(
    (presetId) => {
      if (presetId === "reset") {
        clearSelectedAgent();
        setCameraPreset("overview");
        return;
      }
      clearSelectedAgent();
      setCameraPreset(presetId);
    },
    [setCameraPreset, clearSelectedAgent]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      switch (e.key) {
        case "1":
          handlePreset("overview");
          break;
        case "Escape":
          handlePreset("reset");
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePreset]);

  const activeId = selectedAgentId ? null : cameraPreset;

  return (
    <div className="camera-controls">
      <div className="camera-controls__group">
        <button
          className={
            "camera-controls__btn" +
            (activeId === "overview" ? " camera-controls__btn--active" : "")
          }
          onClick={() => handlePreset("overview")}
          title="Overview (1)"
        >
          <span className="camera-controls__btn-icon">{OVERVIEW.icon}</span>
          <span className="camera-controls__btn-label">Overview</span>
        </button>

        <div className="camera-controls__divider" />

        <button
          className="camera-controls__btn camera-controls__btn--reset"
          onClick={() => handlePreset("reset")}
          title="Reset (Esc)"
        >
          <span className="camera-controls__btn-icon">{RESET_BUTTON.icon}</span>
          <span className="camera-controls__btn-label">Reset</span>
        </button>
      </div>

      <div className="camera-controls__shortcuts">
        <span>1</span> home &nbsp;&bull;&nbsp; <span>Esc</span> reset
      </div>
    </div>
  );
}
