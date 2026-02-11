---
name: skill-sync
description: Copy and adapt a skill from one agent to another, adjusting context for the target agent
---

# Skill Sync — Cross-Agent Skill Transfer

## Triggers
- "teach {agent} the same skill"
- "give {agent} the {skill-name} skill"
- "copy {skill-name} from {source agent} to {target agent}"
- "sync skills between {agent} and {agent}"
- Samurai forwarding a skill creation notification with "give this to {agent}"

## Purpose

When one human teaches their agent a useful skill, Samurai can tell you to give that same skill to another agent. You read the source skill, adapt it for the target agent's context, and write it to their workspace.

## Agent Workspace Map

| Agent | Workspace Path | Human | Context |
|-------|---------------|-------|---------|
| yana | /home/conscious-house/workspaces/bd | Boldrin | BD partnerships |
| wanda | /home/conscious-house/workspaces/sales | Boldrin | Sales & leads |
| suki | /home/conscious-house/workspaces/events | Boldrin | Events lifecycle |
| loki | /home/conscious-house/workspaces/vibe-curator | Pooja | Community & vibe |
| blrxzo-jr | /home/conscious-house/workspaces/captain-blrxzo | Darshan | BLR property ops |
| wtfxzo-jr | /home/conscious-house/workspaces/captain-wtfxzo | Akhilesh | WTF property ops (97% events) |

## Process

### Step 1: Read the Source Skill
Read the SKILL.md from the source agent's workspace:
```
/home/conscious-house/workspaces/{source-workspace}/skills/{skill-name}/SKILL.md
```

### Step 2: Identify What Needs Adapting
When copying between agents, these things change:
- **Agent name** — "You are BLRxZo JR" becomes "You are WTFxZo JR"
- **Human partner** — "Darshan" becomes "Akhilesh"
- **Property context** — BLRxZo properties vs WTFxZo property
- **Operational emphasis** — WTFxZo is 97% event revenue, BLRxZo is mixed
- **API keys / sheet references** — `blrxzo_pnl` vs `wtfxzo_pnl`
- **Telegram IDs** — each human has a different ID
- **Escalation paths** — different managers for different properties

Things that should NOT change:
- Core logic and decision trees
- Output format structure
- Escalation thresholds (₹5K rules etc.)
- API endpoints and tool references (unless property-specific)

### Step 3: Adapt the Skill
Rewrite the skill with the target agent's context. Don't just find-replace names — actually think about whether the workflow makes sense for the target agent.

Examples of smart adaptation:
- BLRxZo's `morning-audit` → WTFxZo should lead with event schedule (97% revenue)
- Suki's `event-inquiry` → if adapted for another agent, remove Typeform-specific details
- LOKI's `guest-welcome` → different WhatsApp group for a different property

If a skill doesn't make sense for the target agent (e.g., `luma-sync` for a house captain), say so and suggest what would be more useful instead.

### Step 4: Write the New Skill
Create the skill directory and file:
```
mkdir -p /home/conscious-house/workspaces/{target-workspace}/skills/{skill-name}
```
Write the adapted SKILL.md to:
```
/home/conscious-house/workspaces/{target-workspace}/skills/{skill-name}/SKILL.md
```
Set ownership:
```
chown -R conscious-house:conscious-house /home/conscious-house/workspaces/{target-workspace}/skills/{skill-name}
```

### Step 5: Confirm to Samurai
Send a confirmation:
```
✅ SKILL SYNCED
Source: {source-agent} / {skill-name}
Target: {target-agent} / {skill-name}
Adapted: {brief list of what was changed}
```

## Bulk Sync

If Samurai says "sync all skills from X to Y" or "make sure both captains have the same skills":
1. List all skills in the source workspace
2. List all skills in the target workspace
3. Identify what's missing or outdated in the target
4. Adapt and write each missing skill
5. Report a summary of what was synced

## Rules
- Always adapt — never blind-copy. A BLRxZo skill pasted into WTFxZo with "Darshan" still in it is broken.
- If the source skill references credentials or API keys, check that the target agent has equivalent access.
- Keep the same skill name unless there's a strong reason to rename.
- If Samurai asks to sync a skill that already exists in the target, ask: "Replace the existing one or keep both?"
- After syncing, the target agent picks up the new skill automatically — no restart needed.
