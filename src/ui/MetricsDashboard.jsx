import { useState, useEffect, useCallback } from "react";
import useAgentStore from "../store/agentStore.js";

/**
 * MetricsDashboard.jsx — Metrics overlay card (Task #14)
 *
 * Fixed to the BOTTOM-RIGHT corner, small card (~240x200px).
 * Shows: total tokens, active/total agents, next cron job countdown,
 * cron success/fail summary for last 24h.
 * Glassmorphism style, collapsible.
 */

function formatTokens(count) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function formatCountdown(targetDate) {
  if (!targetDate) return "--:--";
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return "NOW";

  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function MetricsDashboard() {
  const agents = useAgentStore((s) => s.agents);
  const cronJobs = useAgentStore((s) => s.cronJobs);
  const [collapsed, setCollapsed] = useState(false);
  const [, setTick] = useState(0);

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggle = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  // Total tokens across all agents
  const totalTokens = agents.reduce(
    (sum, a) => sum + (a.tokenUsage?.total || 0),
    0
  );

  // Active agents (active or idle)
  const activeAgents = agents.filter(
    (a) => a.status === "active" || a.status === "idle" || a.status === "online"
  ).length;

  // Next upcoming cron job
  const now = Date.now();
  const upcomingJobs = cronJobs
    .filter((j) => j.nextRun && new Date(j.nextRun).getTime() > now)
    .sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime());
  const nextJob = upcomingJobs[0] || null;

  // Cron jobs summary (last 24h)
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  const recentCron = cronJobs.filter(
    (j) => j.lastRun && new Date(j.lastRun).getTime() > twentyFourHoursAgo
  );
  const cronSucceeded = recentCron.filter(
    (j) => j.lastStatus === "ok" || j.lastStatus === "success"
  ).length;
  const cronFailed = recentCron.filter(
    (j) => j.lastStatus === "error" || j.lastStatus === "failed"
  ).length;

  return (
    <div className={`metrics-dashboard ${collapsed ? "metrics-dashboard--collapsed" : ""}`}>
      <div className="metrics-dashboard__header" onClick={handleToggle}>
        <span className="metrics-dashboard__header-title">
          {collapsed ? "" : "METRICS"}
        </span>
        <span className="metrics-dashboard__header-icon">
          {collapsed ? "\u25B2" : "\u25BC"}
        </span>
      </div>

      {!collapsed && (
        <div className="metrics-dashboard__body">
          {/* Token usage */}
          <div className="metrics-dashboard__row">
            <span className="metrics-dashboard__label">Tokens Today</span>
            <span className="metrics-dashboard__value metrics-dashboard__value--tokens">
              {formatTokens(totalTokens)}
            </span>
          </div>

          {/* Active agents */}
          <div className="metrics-dashboard__row">
            <span className="metrics-dashboard__label">Active Agents</span>
            <span className="metrics-dashboard__value">
              <span className="metrics-dashboard__value--highlight">{activeAgents}</span>
              <span className="metrics-dashboard__value--dim"> / {agents.length}</span>
            </span>
          </div>

          {/* Separator */}
          <div className="metrics-dashboard__separator" />

          {/* Next cron job */}
          <div className="metrics-dashboard__row metrics-dashboard__row--cron">
            <span className="metrics-dashboard__label">Next Cron</span>
            {nextJob ? (
              <div className="metrics-dashboard__cron-detail">
                <span className="metrics-dashboard__cron-name">{nextJob.name}</span>
                <span className="metrics-dashboard__cron-countdown">
                  {formatCountdown(nextJob.nextRun)}
                </span>
              </div>
            ) : (
              <span className="metrics-dashboard__value metrics-dashboard__value--dim">
                No upcoming
              </span>
            )}
          </div>

          {/* Cron summary */}
          <div className="metrics-dashboard__row">
            <span className="metrics-dashboard__label">Cron (24h)</span>
            <span className="metrics-dashboard__value">
              <span className="metrics-dashboard__cron-ok">{cronSucceeded}</span>
              <span className="metrics-dashboard__value--dim"> ok </span>
              <span className="metrics-dashboard__cron-fail">{cronFailed}</span>
              <span className="metrics-dashboard__value--dim"> fail</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
