import { useRef, useEffect, useState, memo } from "react";
import { Html } from "@react-three/drei";

/**
 * ChatBubble.jsx - A 3D speech bubble that floats above an agent character.
 *
 * Uses drei Html to render a styled HTML div in 3D space.
 * Positioned ~3.5 units above the platform (above the character head).
 * Shows the agent last activity / current task with auto-hide after 8 seconds.
 *
 * Props:
 *   position    - [x, y, z] world position of the agent platform
 *   message     - string to display in the bubble
 *   agentColor  - hex color for accent border
 *   agentName   - display name for the agent
 *   visible     - whether the bubble should be shown
 *   onHide      - callback when bubble auto-hides
 */

const BUBBLE_Y_OFFSET = 3.5;
const AUTO_HIDE_MS = 8000;
const MAX_CHARS = 60;

function ChatBubble({
  position = [0, 0, 0],
  message = "",
  agentColor = "#8888ff",
  agentName = "",
  visible = true,
  onHide = null,
}) {
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  // Truncate long messages
  const displayText =
    message.length > MAX_CHARS
      ? message.slice(0, MAX_CHARS - 3) + "..."
      : message;

  // Auto-hide after 8 seconds
  useEffect(() => {
    if (!visible || !message) return;

    // Reset fading state on new message
    setFading(false);

    // Clear previous timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    // Start fade-out 500ms before hide
    timerRef.current = setTimeout(() => {
      setFading(true);
      fadeTimerRef.current = setTimeout(() => {
        if (onHide) onHide();
      }, 500);
    }, AUTO_HIDE_MS - 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [visible, message, onHide]);

  if (!visible || !message) return null;

  const bubblePosition = [
    position[0],
    position[1] + BUBBLE_Y_OFFSET,
    position[2],
  ];

  return (
    <group position={bubblePosition}>
      <Html
        center
        distanceFactor={18}
        occlude={false}
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
        zIndexRange={[50, 0]}
      >
        <div
          className={`chat-bubble ${fading ? "chat-bubble--fade-out" : "chat-bubble--fade-in"}`}
          style={{ "--agent-color": agentColor }}
        >
          <div className="chat-bubble__name" style={{ color: agentColor }}>
            {agentName}
          </div>
          <div className="chat-bubble__text">{displayText}</div>
          <div className="chat-bubble__pointer" style={{ borderTopColor: "rgba(10, 10, 30, 0.85)" }} />
        </div>
      </Html>
    </group>
  );
}

export default memo(ChatBubble);
