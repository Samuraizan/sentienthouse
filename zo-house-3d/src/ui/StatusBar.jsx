import { useState, useEffect } from "react";
import useAgentStore from "../store/agentStore.js";

/**
 * StatusBar.jsx — Top status bar overlay (Task #11)
 *
 * Fixed at top of viewport with glassmorphism styling.
 * Left: ZO HOUSE logo (warm orange glow) + gateway connection indicator
 * Center: 7 agent status dots (color-coded, brightness = status)
 * Right: Gateway uptime, IST clock, active session count
 */

function getStatusBrightness(status) {
  switch (status) {
    case "active":  return 1.0;
    case "idle":    return 0.6;
    case "online":  return 0.45;
    case "standby": return 0.3;
    case "dormant": return 0.2;
    case "offline":
    default:        return 0.1;
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "active":  return "Active";
    case "idle":    return "Idle";
    case "online":  return "Online";
    case "standby": return "Standby";
    case "dormant": return "Dormant";
    case "offline":
    default:        return "Offline";
  }
}

function formatUptime(uptime) {
  if (!uptime) return "--:--:--";
  if (typeof uptime === "string") return uptime;
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StatusBar() {
  const agents = useAgentStore((s) => s.agents);
  const gatewayStatus = useAgentStore((s) => s.gatewayStatus);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const istTime = currentTime.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const istDate = currentTime.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
  });

  const totalSessions = agents.reduce((sum, a) => sum + (a.sessionCount || 0), 0);
  const connected = gatewayStatus.connected;

  return (
    <div className="status-bar">
      {/* Left: Logo + connection */}
      <div className="status-bar__left">
        <span
          className="status-bar__logo"
          style={{
            color: "#ff7744",
            textShadow: "0 0 20px rgba(255, 119, 68, 0.6), 0 0 40px rgba(255, 119, 68, 0.2)",
          }}
        >
          ZO HOUSE
        </span>
        <span
          className={`status-bar__connection-dot ${
            connected ? "status-bar__connection-dot--connected" : "status-bar__connection-dot--disconnected"
          }`}
        />
        <span className="status-bar__connection-label">
          {connected ? "GATEWAY LIVE" : "DISCONNECTED"}
        </span>
      </div>

      {/* Center: intentionally empty — agents visible in 3D scene */}
      <div className="status-bar__center" />

      {/* Right: Metrics */}
      <div className="status-bar__right">
        <div className="status-bar__metric">
          <span className="status-bar__metric-label">UPTIME</span>
          <span className="status-bar__metric-value">
            {formatUptime(gatewayStatus.uptime)}
          </span>
        </div>
        <div className="status-bar__divider" />
        <div className="status-bar__metric">
          <span className="status-bar__metric-label">IST</span>
          <span className="status-bar__metric-value">{istTime}</span>
          <span className="status-bar__metric-sub">{istDate}</span>
        </div>
        <div className="status-bar__divider" />
        <div className="status-bar__metric">
          <span className="status-bar__metric-label">SESSIONS</span>
          <span className="status-bar__metric-value">{totalSessions}</span>
        </div>
      </div>
    </div>
  );
}
