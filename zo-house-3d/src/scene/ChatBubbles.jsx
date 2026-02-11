import { useState, useEffect, useCallback, useMemo } from "react";
import useAgentStore from "../store/agentStore";
import ChatBubble from "./ChatBubble";
import { ZONE_POSITIONS } from "./Zones";

/**
 * ChatBubbles.jsx - Container that manages all 3D chat bubbles above agent characters.
 *
 * Uses ZONE_POSITIONS from Zones.jsx for department-based layout positioning.
 * Shows a speech bubble above each agent that has recent activity.
 */

// Platform Y offset (characters stand at ~0.12, bubble goes above)
const PLATFORM_Y_OFFSET = 0.12;

// Stagger delay between bubble appearances (ms)
const STAGGER_DELAY = 400;

// How recent activity must be to show a bubble (5 minutes)
const RECENT_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Generate a contextual message for an agent based on their state.
 */
function getAgentMessage(agent, cronJobs) {
  const agentCrons = cronJobs.filter((j) => j.agent === agent.id);
  const now = Date.now();

  for (const job of agentCrons) {
    if (job.lastRun) {
      const lastRunMs = new Date(job.lastRun).getTime();
      if (now - lastRunMs < 2 * 60 * 1000) {
        return "Running " + job.name + "...";
      }
    }
  }

  if (agent.currentTask) {
    return agent.currentTask;
  }

  switch (agent.status) {
    case "active":
      return "Processing request...";
    case "idle":
      return "Idle - awaiting tasks";
    case "online":
      return "Online - standing by";
    case "standby":
      return "Standby mode";
    case "dormant":
      return "Dormant - last active a while ago";
    default:
      return null;
  }
}

export default function ChatBubbles() {
  const agents = useAgentStore((state) => state.agents);
  const cronJobs = useAgentStore((state) => state.cronJobs);
  const [visibleBubbles, setVisibleBubbles] = useState({});

  const bubbleData = useMemo(() => {
    const now = Date.now();
    return agents
      .map((agent) => {
        const zone = ZONE_POSITIONS[agent.role];
        if (!zone) return null;

        const isRecent =
          agent.lastActive &&
          now - new Date(agent.lastActive).getTime() < RECENT_THRESHOLD_MS;

        const isActive = [
          "active",
          "idle",
          "online",
          "standby",
        ].includes(agent.status);

        if (!isRecent && !isActive) return null;

        const message = getAgentMessage(agent, cronJobs);
        if (!message) return null;

        const position = [
          zone.position[0],
          zone.position[1] + PLATFORM_Y_OFFSET,
          zone.position[2],
        ];

        return {
          agentId: agent.id,
          agentName: agent.name,
          agentColor: agent.color,
          position,
          message,
          status: agent.status,
        };
      })
      .filter(Boolean);
  }, [agents, cronJobs]);

  useEffect(() => {
    const newIds = bubbleData.map((b) => b.agentId);
    const currentIds = Object.keys(visibleBubbles);

    const toShow = newIds.filter(
      (id) => !currentIds.includes(id) || !visibleBubbles[id]
    );

    if (toShow.length > 0) {
      toShow.forEach((id, index) => {
        setTimeout(() => {
          setVisibleBubbles((prev) => ({ ...prev, [id]: true }));
        }, index * STAGGER_DELAY);
      });
    }

    const toHide = currentIds.filter((id) => !newIds.includes(id));
    if (toHide.length > 0) {
      setVisibleBubbles((prev) => {
        const next = { ...prev };
        toHide.forEach((id) => {
          delete next[id];
        });
        return next;
      });
    }
  }, [bubbleData]);

  const handleHide = useCallback((agentId) => {
    setVisibleBubbles((prev) => {
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
  }, []);

  return (
    <group>
      {bubbleData.map((bubble) => (
        <ChatBubble
          key={bubble.agentId}
          position={bubble.position}
          message={bubble.message}
          agentColor={bubble.agentColor}
          agentName={bubble.agentName}
          visible={!!visibleBubbles[bubble.agentId]}
          onHide={() => handleHide(bubble.agentId)}
        />
      ))}
    </group>
  );
}
