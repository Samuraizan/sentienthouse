/**
 * Gateway Proxy Routes for zo-api
 *
 * These routes shell out to `openclaw gateway call <method>` and return
 * the JSON output to the browser. This bridges the OpenClaw CLI-based
 * gateway with the browser-based 3D Command Center.
 *
 * All routes are mounted at /api/gateway/* and also at /gateway/*
 */

const { exec } = require("child_process");
const express = require("express");
const router = express.Router();

// Path to openclaw binary
const OPENCLAW_BIN = "openclaw";

// Auth token for the gateway (from environment or fallback)
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

// Cache to avoid hammering the gateway on rapid requests
const cache = {};
const CACHE_TTL = 5000; // 5 seconds

/**
 * Execute an openclaw gateway call and return parsed JSON.
 * The CLI outputs a header line like "Gateway call: <method>" followed by
 * pretty-printed JSON. We extract the JSON portion by finding the first
 * line that starts with { or [ and parsing from there to the end.
 */
function gatewayCall(method) {
  return new Promise((resolve, reject) => {
    // Check cache
    const cached = cache[method];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return resolve(cached.data);
    }

    const cmd = `${OPENCLAW_BIN} gateway call ${method} --token ${GATEWAY_TOKEN} 2>/dev/null`;

    exec(cmd, { timeout: 15000, maxBuffer: 2 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && !stdout) {
        return reject(new Error(`Gateway call "${method}" failed: ${error.message}`));
      }

      const raw = (stdout || "").trim();
      if (!raw) {
        return reject(new Error(`Gateway call "${method}" returned empty output`));
      }

      try {
        // Find the start of JSON in the output.
        // openclaw outputs "Gateway call: <method>\n{...}" — skip the header.
        let jsonStart = -1;
        for (let i = 0; i < raw.length; i++) {
          const ch = raw[i];
          if (ch === "{" || ch === "[") {
            jsonStart = i;
            break;
          }
        }

        if (jsonStart === -1) {
          // No JSON found — return raw as a string
          const fallback = { _raw: raw, _method: method };
          cache[method] = { data: fallback, timestamp: Date.now() };
          return resolve(fallback);
        }

        const jsonStr = raw.substring(jsonStart);
        const data = JSON.parse(jsonStr);
        cache[method] = { data, timestamp: Date.now() };
        resolve(data);
      } catch (parseErr) {
        // JSON parse failed — try to recover
        console.error(`[gateway] JSON parse error for ${method}:`, parseErr.message);
        const fallback = { _raw: raw, _parseError: parseErr.message, _method: method };
        cache[method] = { data: fallback, timestamp: Date.now() };
        resolve(fallback);
      }
    });
  });
}

/**
 * Generic handler that calls a gateway method and returns the result.
 */
function makeHandler(method) {
  return async (req, res) => {
    try {
      const data = await gatewayCall(method);
      res.json(data);
    } catch (err) {
      res.status(502).json({
        error: `Gateway unavailable: ${err.message}`,
        method,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

// ── Routes ─────────────────────────────────────────────────────

// GET /gateway/status — gateway uptime, version, agent count
router.get("/status", makeHandler("status"));

// GET /gateway/agents — all agent configs (role, model, channels, skills)
router.get("/agents", makeHandler("agents.list"));

// GET /gateway/sessions — active/recent sessions per agent
router.get("/sessions", makeHandler("sessions.list"));

// GET /gateway/cron — cron jobs with lastRun, lastStatus, nextRun
router.get("/cron", makeHandler("cron.list"));

// GET /gateway/cron-status — cron scheduler status
router.get("/cron-status", makeHandler("cron.status"));

// GET /gateway/presence — which agents have active sessions
router.get("/presence", makeHandler("system-presence"));

// GET /gateway/health — basic health check
router.get("/health", makeHandler("health"));

// GET /gateway/all — aggregated poll (all data in one request)
router.get("/all", async (req, res) => {
  try {
    const [status, agents, sessions, cron, presence] = await Promise.allSettled([
      gatewayCall("status"),
      gatewayCall("agents.list"),
      gatewayCall("sessions.list"),
      gatewayCall("cron.list"),
      gatewayCall("system-presence"),
    ]);

    res.json({
      status: status.status === "fulfilled" ? status.value : null,
      agents: agents.status === "fulfilled" ? agents.value : null,
      sessions: sessions.status === "fulfilled" ? sessions.value : null,
      cron: cron.status === "fulfilled" ? cron.value : null,
      presence: presence.status === "fulfilled" ? presence.value : null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
