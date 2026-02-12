/**
 * positionRegistry.js — Frame-level position tracking for all agents.
 *
 * Plain JS module (no React state, no Zustand) so reads/writes are free
 * at 60 fps. Each agent calls updateAgentPosition() in useFrame;
 * collision avoidance, connection beams, and chat bubbles read from here.
 */

const _positions = {}; // { [agentId]: { x, y, z, mode, zoneKey } }

export function updateAgentPosition(agentId, x, y, z, mode, zoneKey) {
  _positions[agentId] = { x, y, z, mode, zoneKey };
}

export function getAllPositions() {
  return _positions;
}

export function getAgentWorldPosition(agentId) {
  const p = _positions[agentId];
  if (!p) return null;
  return [p.x, p.y, p.z];
}

// Expose for browser console verification: getAllPositions()
if (typeof window !== "undefined") {
  window.getAllPositions = getAllPositions;
}
