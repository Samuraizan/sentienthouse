import { useState, useEffect, useRef, useCallback } from "react";
import useAgentStore from "../store/agentStore.js";

/**
 * MessageFeed.jsx — Live message feed panel (Task #13)
 *
 * Fixed to the LEFT side of the viewport, narrow panel (~280px).
 * Shows recent agent activity as a scrollable feed.
 * Generates entries from polling data when agent lastActive changes.
 * Glassmorphism style, collapsible.
 */

const MAX_ENTRIES = 50;

// Human-readable activity descriptions based on status changes
function describeActivity(agent, prevStatus, newStatus) {
  if (prevStatus === newStatus) return null;

  if (newStatus === "active") return `became active`;
  if (newStatus === "idle" && prevStatus === "active") return `went idle`;
  if (newStatus === "online") return `came online`;
  if (newStatus === "offline") return `went offline`;
  if (newStatus === "standby") return `entered standby`;
  if (newStatus === "dormant") return `went dormant`;
  return `status changed to ${newStatus}`;
}

function formatTimestamp(date) {
  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function MessageFeed() {
  const agents = useAgentStore((s) => s.agents);
  const cronJobs = useAgentStore((s) => s.cronJobs);
  const [entries, setEntries] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [, setTick] = useState(0);
  const feedRef = useRef(null);
  const prevAgentsRef = useRef(null);

  // Force re-render every 30s to update "time ago" labels
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Track agent status changes and generate feed entries
  useEffect(() => {
    const prevAgents = prevAgentsRef.current;
    if (!prevAgents) {
      // First render: snapshot the current state, add an init entry
      prevAgentsRef.current = agents.map((a) => ({
        id: a.id,
        status: a.status,
        lastActive: a.lastActive,
        sessionCount: a.sessionCount,
      }));

      setEntries([
        {
          id: `init-${Date.now()}`,
          agentId: "system",
          agentName: "System",
          agentColor: "#8888ff",
          message: "Command Center initialized",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const newEntries = [];

    agents.forEach((agent) => {
      const prev = prevAgents.find((p) => p.id === agent.id);
      if (!prev) return;

      // Status changed
      if (prev.status !== agent.status) {
        const desc = describeActivity(agent, prev.status, agent.status);
        if (desc) {
          newEntries.push({
            id: `${agent.id}-status-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            agentId: agent.id,
            agentName: agent.name,
            agentColor: agent.color,
            message: desc,
            timestamp: new Date(),
          });
        }
      }

      // Session count increased
      if (agent.sessionCount > prev.sessionCount) {
        const diff = agent.sessionCount - prev.sessionCount;
        newEntries.push({
          id: `${agent.id}-session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          agentId: agent.id,
          agentName: agent.name,
          agentColor: agent.color,
          message: `+${diff} new session${diff > 1 ? "s" : ""}`,
          timestamp: new Date(),
        });
      }

      // lastActive timestamp changed (indicates new activity)
      if (
        agent.lastActive &&
        agent.lastActive !== prev.lastActive &&
        prev.status === agent.status
      ) {
        newEntries.push({
          id: `${agent.id}-active-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          agentId: agent.id,
          agentName: agent.name,
          agentColor: agent.color,
          message: "new activity detected",
          timestamp: new Date(),
        });
      }
    });

    if (newEntries.length > 0) {
      setEntries((prev) => [...prev, ...newEntries].slice(-MAX_ENTRIES));
    }

    // Update snapshot
    prevAgentsRef.current = agents.map((a) => ({
      id: a.id,
      status: a.status,
      lastActive: a.lastActive,
      sessionCount: a.sessionCount,
    }));
  }, [agents]);

  // Track cron job completions
  const prevCronRef = useRef(null);
  useEffect(() => {
    const prevCron = prevCronRef.current;
    if (!prevCron) {
      prevCronRef.current = cronJobs.map((j) => ({
        id: j.id,
        lastRun: j.lastRun,
        lastStatus: j.lastStatus,
      }));
      return;
    }

    const newEntries = [];
    cronJobs.forEach((job) => {
      const prev = prevCron.find((p) => p.id === job.id);
      if (!prev) return;

      if (job.lastRun && job.lastRun !== prev.lastRun) {
        const agent = agents.find((a) => a.id === job.agent);
        const succeeded = job.lastStatus === "ok" || job.lastStatus === "success";
        newEntries.push({
          id: `cron-${job.id}-${Date.now()}`,
          agentId: job.agent,
          agentName: agent ? agent.name : job.agent,
          agentColor: agent ? agent.color : "#888",
          message: `cron "${job.name}" ${succeeded ? "completed" : "failed"}`,
          timestamp: new Date(),
          type: succeeded ? "cron-ok" : "cron-fail",
        });
      }
    });

    if (newEntries.length > 0) {
      setEntries((prev) => [...prev, ...newEntries].slice(-MAX_ENTRIES));
    }

    prevCronRef.current = cronJobs.map((j) => ({
      id: j.id,
      lastRun: j.lastRun,
      lastStatus: j.lastStatus,
    }));
  }, [cronJobs, agents]);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (feedRef.current && !collapsed) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [entries, collapsed]);

  const handleToggle = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  return (
    <div className={`message-feed ${collapsed ? "message-feed--collapsed" : ""}`}>
      <div className="message-feed__header" onClick={handleToggle}>
        <span className="message-feed__header-icon">
          {collapsed ? "\u25B6" : "\u25C0"}
        </span>
        <span className="message-feed__header-title">
          {collapsed ? "" : "LIVE FEED"}
        </span>
        {!collapsed && (
          <span className="message-feed__header-count">
            {entries.length}
          </span>
        )}
      </div>

      {!collapsed && (
        <div className="message-feed__list" ref={feedRef}>
          {entries.length === 0 ? (
            <div className="message-feed__empty">
              Waiting for agent activity...
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className={`message-feed__entry ${
                  entry.type === "cron-fail" ? "message-feed__entry--error" : ""
                }`}
              >
                <div
                  className="message-feed__avatar"
                  style={{ backgroundColor: entry.agentColor }}
                >
                  {entry.agentName.charAt(0).toUpperCase()}
                </div>
                <div className="message-feed__content">
                  <div className="message-feed__name">
                    {entry.agentName}
                    <span className="message-feed__time" title={formatTimestamp(entry.timestamp)}>
                      {timeAgo(entry.timestamp)}
                    </span>
                  </div>
                  <div className="message-feed__message">{entry.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
