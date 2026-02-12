import { useRef, useEffect, useState, memo } from "react";
import { Html } from "@react-three/drei";

/**
 * ChatBubble.jsx - A 3D speech bubble that floats above an agent character.
 *
 * More prominent: larger text, higher Y offset, longer visibility,
 * stronger background, thicker border accent.
 */

const BUBBLE_Y_OFFSET = 20; // Higher above scaled-up pirate characters
const AUTO_HIDE_MS = 15000;
const MAX_CHARS = 120;

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

  const displayText =
    message.length > MAX_CHARS
      ? message.slice(0, MAX_CHARS - 3) + "..."
      : message;

  useEffect(() => {
    if (!visible || !message) return;

    setFading(false);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

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
        distanceFactor={30}
        occlude={false}
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
        zIndexRange={[50, 0]}
      >
        <div
          className={`chat-bubble ${fading ? "chat-bubble--fade-out" : "chat-bubble--fade-in"}`}
          style={{
            "--agent-color": agentColor,
            background: "rgba(10, 10, 30, 0.95)",
            borderLeft: `4px solid ${agentColor}`,
            borderRadius: "14px",
            padding: "12px 20px",
            maxWidth: "360px",
            boxShadow: `0 6px 24px rgba(0,0,0,0.6), 0 0 12px ${agentColor}44`,
          }}
        >
          <div style={{
            color: agentColor,
            fontSize: "20px",
            fontWeight: 700,
            fontFamily: "Inter, SF Pro Display, -apple-system, sans-serif",
            marginBottom: "6px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>
            {agentName}
          </div>
          <div style={{
            color: "#e8e8f0",
            fontSize: "22px",
            fontWeight: 500,
            fontFamily: "Inter, SF Pro Display, -apple-system, sans-serif",
            lineHeight: "1.4",
          }}>
            {displayText}
          </div>
          <div style={{
            position: "absolute",
            bottom: "-10px",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "10px solid rgba(10, 10, 30, 0.95)",
          }} />
        </div>
      </Html>
    </group>
  );
}

export default memo(ChatBubble);
