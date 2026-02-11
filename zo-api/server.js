require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Supabase config from environment
const SUPABASE_URL = process.env.SUPABASE_URL || "https://elvaqxadfewcsohrswsi.supabase.co/rest/v1";
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || "";

async function supabaseQuery(table, query = "") {
  const fetch = (await import("node-fetch")).default;
  const res = await fetch(`${SUPABASE_URL}/${table}${query}`, {
    headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` }
  });
  return res.json();
}

// Core agents (internal OpenClaw team)
const CORE_AGENTS = [
  { id: "zomadprime", name: "ZomadPrime", role: "Strategic Orchestrator", human: "Samurai", type: "core" },
  { id: "yana", name: "Yana", role: "BD Agent", human: "Boldrin", type: "core" },
  { id: "wanda", name: "Wanda", role: "Sales Agent", human: "Boldrin", type: "core" },
  { id: "suki", name: "Suki", role: "Events Agent", human: "Boldrin", type: "core" },
  { id: "loki", name: "LOKI", role: "Vibe Curator", human: "Pooja", type: "core" },
  { id: "blrxzo-jr", name: "BLRxZo JR", role: "House Captain BLR", human: "Darshan", type: "core" },
  { id: "wtfxzo-jr", name: "WTFxZo JR", role: "House Captain WTF", human: "Akhilesh", type: "core" }
];

// Data directory (portable across platforms)
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// External agents registry
let externalAgents = [];
const AGENTS_FILE = path.join(DATA_DIR, "external_agents.json");

// Gateway proxy routes
const gatewayRoutes = require("./routes/gateway");

function loadExternalAgents() {
  try {
    if (fs.existsSync(AGENTS_FILE)) {
      externalAgents = JSON.parse(fs.readFileSync(AGENTS_FILE, "utf8"));
    }
  } catch (e) { externalAgents = []; }
}

function saveExternalAgents() {
  try {
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(externalAgents, null, 2));
  } catch (e) { console.error("Failed to save agents:", e); }
}

loadExternalAgents();

// Shared task board
let sharedTasks = [];
const TASKS_FILE = path.join(DATA_DIR, "shared_tasks.json");

function loadTasks() {
  try {
    if (fs.existsSync(TASKS_FILE)) {
      sharedTasks = JSON.parse(fs.readFileSync(TASKS_FILE, "utf8"));
    }
  } catch (e) { sharedTasks = []; }
}

function saveTasks() {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(sharedTasks, null, 2));
  } catch (e) { console.error("Failed to save tasks:", e); }
}

loadTasks();

// ==================== HANDLERS ====================

async function handleHealth(req, res) {
  res.json({
    gateway: "healthy",
    telegram: "connected",
    coreAgents: CORE_AGENTS.length,
    externalAgents: externalAgents.length,
    totalAgents: CORE_AGENTS.length + externalAgents.length
  });
}

async function handleGetAgents(req, res) {
  const allAgents = [...CORE_AGENTS, ...externalAgents.map(a => ({ ...a, type: "external" }))];
  res.json({ agents: allAgents, timestamp: new Date().toISOString() });
}

function handleRegisterAgent(req, res) {
  const { id, name, role, human, webhook } = req.body;

  if (!id || !name || !human) {
    return res.status(400).json({ error: "Missing required fields: id, name, human" });
  }

  const existing = externalAgents.find(a => a.id === id);
  if (existing) {
    Object.assign(existing, { name, role, human, webhook, lastSeen: new Date().toISOString() });
  } else {
    externalAgents.push({
      id, name, role: role || "Personal Agent", human, webhook, type: "external",
      registeredAt: new Date().toISOString(), lastSeen: new Date().toISOString()
    });
  }

  saveExternalAgents();
  res.json({ success: true, message: `Agent ${name} registered`, agentCount: externalAgents.length });
}

function handleHeartbeat(req, res) {
  const { agentId } = req.params;
  const agent = externalAgents.find(a => a.id === agentId);
  if (agent) {
    agent.lastSeen = new Date().toISOString();
    agent.status = req.body.status || "online";
    saveExternalAgents();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Agent not found" });
  }
}

async function handleGetTasks(req, res) {
  let allTasks = [...sharedTasks];

  try {
    const today = new Date().toISOString().split("T")[0];
    const completions = await supabaseQuery("task_completions", `?created_at=gte.${today}T00:00:00&order=created_at.desc&limit=20`);

    if (Array.isArray(completions)) {
      completions.forEach(tc => {
        allTasks.push({
          id: `hk-${tc.completion_id}`,
          title: tc.notes || "Housekeeping task",
          agent: "WhatsApp Bot",
          source: "supabase",
          column: "done",
          completedAt: tc.completed_at,
          staffId: tc.staff_id,
          propertyId: tc.property_id
        });
      });
    }
  } catch (e) {
    console.error("Supabase query error:", e);
  }

  res.json({ tasks: allTasks, timestamp: new Date().toISOString() });
}

function handleCreateTask(req, res) {
  const { title, agent, agentId, priority, column, assignee } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Missing required field: title" });
  }

  const task = {
    id: `task-${Date.now()}`,
    title, agent: agent || "Unknown", agentId,
    priority: priority || "normal", column: column || "queued",
    assignee, createdAt: new Date().toISOString(), source: "api"
  };

  sharedTasks.push(task);
  saveTasks();
  res.json({ success: true, task });
}

function handleUpdateTask(req, res) {
  const { taskId } = req.params;
  const task = sharedTasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const { column, priority, assignee, notes } = req.body;
  if (column) task.column = column;
  if (priority) task.priority = priority;
  if (assignee) task.assignee = assignee;
  if (notes) task.notes = notes;
  task.updatedAt = new Date().toISOString();

  saveTasks();
  res.json({ success: true, task });
}

function handleGetActions(req, res) {
  const pendingActions = sharedTasks
    .filter(t => t.column === "review" && t.assignee)
    .map(t => ({
      id: t.id, action: t.title, assignee: t.assignee,
      source: t.agent, priority: t.priority || "normal", createdAt: t.createdAt
    }));

  res.json({ actions: pendingActions, timestamp: new Date().toISOString() });
}

async function handleStaffPerformance(req, res) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const performance = await supabaseQuery("daily_performance", `?shift_date=eq.${today}&order=total_points.desc`);
    res.json({ performance, date: today });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch performance data" });
  }
}

async function handleGetStaff(req, res) {
  try {
    const staff = await supabaseQuery("housekeeping_staff", "?status=eq.active&order=staff_name");
    res.json({ staff });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch staff data" });
  }
}

async function handleGetSchedules(req, res) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const schedules = await supabaseQuery("housekeeping_schedules", `?scheduled_date=eq.${today}&order=scheduled_time`);
    res.json({ schedules, date: today });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
}

async function handleGetBookings(req, res) {
  try {
    const bookings = await supabaseQuery("pms_bookings", "?order=arrivaldate.desc&limit=20");
    res.json({ bookings });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
}

async function handleGetFounders(req, res) {
  try {
    const limit = req.query.limit || 50;
    const founders = await supabaseQuery("founder_profiles", `?select=id,display_name,email,membership,status,founder_token_ids&limit=${limit}`);
    res.json({ founders, count: founders.length });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch founders" });
  }
}

function handleWebhook(req, res) {
  const { agentId } = req.params;
  const { event, data } = req.body;

  console.log(`Webhook from ${agentId}:`, event, data);

  switch (event) {
    case "task_created":
      sharedTasks.push({ ...data, agentId, createdAt: new Date().toISOString() });
      saveTasks();
      break;
    case "task_completed":
      const task = sharedTasks.find(t => t.id === data.taskId);
      if (task) {
        task.column = "done";
        task.completedAt = new Date().toISOString();
        saveTasks();
      }
      break;
    case "status_update":
      const agent = externalAgents.find(a => a.id === agentId);
      if (agent) {
        agent.status = data.status;
        agent.lastSeen = new Date().toISOString();
        saveExternalAgents();
      }
      break;
  }

  res.json({ received: true });
}

// ==================== ROUTES ====================

// Routes without /api prefix (for Tailscale which strips it)
app.get("/health", handleHealth);
app.get("/agents", handleGetAgents);
app.post("/agents/register", handleRegisterAgent);
app.post("/agents/:agentId/heartbeat", handleHeartbeat);
app.get("/tasks", handleGetTasks);
app.post("/tasks", handleCreateTask);
app.patch("/tasks/:taskId", handleUpdateTask);
app.get("/actions", handleGetActions);
app.get("/staff/performance", handleStaffPerformance);
app.get("/staff", handleGetStaff);
app.get("/schedules", handleGetSchedules);
app.get("/bookings", handleGetBookings);
app.get("/founders", handleGetFounders);
app.post("/webhook/:agentId", handleWebhook);

// Routes with /api prefix (for local access)
app.get("/api/health", handleHealth);
app.get("/api/agents", handleGetAgents);
app.post("/api/agents/register", handleRegisterAgent);
app.post("/api/agents/:agentId/heartbeat", handleHeartbeat);
app.get("/api/tasks", handleGetTasks);
app.post("/api/tasks", handleCreateTask);
app.patch("/api/tasks/:taskId", handleUpdateTask);
app.get("/api/actions", handleGetActions);
app.get("/api/staff/performance", handleStaffPerformance);
app.get("/api/staff", handleGetStaff);
app.get("/api/schedules", handleGetSchedules);
app.get("/api/bookings", handleGetBookings);
app.get("/api/founders", handleGetFounders);
app.post("/api/webhook/:agentId", handleWebhook);

// Gateway proxy routes (for 3D Command Center)
app.use("/gateway", gatewayRoutes);
app.use("/api/gateway", gatewayRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Zo Console API v2 running on port ${PORT}`);
  console.log(`Core agents: ${CORE_AGENTS.length}, External agents: ${externalAgents.length}`);
});
