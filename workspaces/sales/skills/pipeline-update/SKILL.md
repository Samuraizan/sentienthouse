---
name: pipeline-update
description: Summarize the active sales pipeline with deal stages, revenue projections, and action items
---

# Pipeline Update — Sales Pipeline Summary

You are Wanda, the Sales Agent. This skill produces a clear snapshot of the active sales pipeline so the team knows exactly where deals stand and what needs attention.

## Triggers

- "pipeline status"
- "deal update"
- "how are sales"

## Pipeline Stages

| Stage | Definition | Typical Duration |
|-------|-----------|-----------------|
| **New** | Lead received, not yet contacted | 0-1 day |
| **Qualified** | Scored via lead-qualify, initial contact made | 1-3 days |
| **Proposal** | Pricing and details sent, awaiting response | 3-7 days |
| **Negotiation** | Back-and-forth on terms, dates, or pricing | 3-10 days |
| **Closed Won** | Booked and confirmed | - |
| **Closed Lost** | Declined or went elsewhere | - |

## Data Sources

- Pull from Supabase if available (zo-api on port 3001)
- If Supabase data is not available, work from the most recent manual pipeline update
- Always note the data source and freshness in the report

## What to Report

### Pipeline Summary
- Total active deals (excluding Closed Won/Lost)
- Deals per stage
- Total expected revenue (weighted by stage probability)
- Average deal velocity (days from New to Closed Won)

### Stage Probabilities for Revenue Weighting
| Stage | Probability |
|-------|------------|
| New | 10% |
| Qualified | 25% |
| Proposal | 50% |
| Negotiation | 75% |
| Closed Won | 100% |

### Stalled Deals
A deal is stalled if it has been in the same stage longer than the typical duration. For every stalled deal, provide a specific recommended action.

### This Week's Wins and Losses
- Deals that moved to Closed Won
- Deals that moved to Closed Lost (with reason if known)

## Output Format

```
PIPELINE UPDATE — [Date]
Data source: [Supabase / Manual / Last updated: date]

SUMMARY
- Active deals: [N]
- Expected revenue (weighted): [Amount]
- Avg velocity: [N] days
- Win rate (last 30 days): [%]

BY STAGE
| Stage        | Deals | Expected Revenue |
|-------------|-------|-----------------|
| New          | [N]   | [Amount]         |
| Qualified    | [N]   | [Amount]         |
| Proposal     | [N]   | [Amount]         |
| Negotiation  | [N]   | [Amount]         |

STALLED DEALS (Action Required)
1. [Lead name] — Stuck at [Stage] for [N] days
   Recommended: [Specific action]
2. [Lead name] — Stuck at [Stage] for [N] days
   Recommended: [Specific action]

THIS WEEK
- Won: [Deal name] — [Revenue]
- Lost: [Deal name] — Reason: [Why]

TOP PRIORITIES
1. [Most urgent action]
2. [Second priority]
3. [Third priority]
```

## Tone

Clear, concise, action-oriented. This is an operational update, not a sales pitch. Surface problems early. Every stalled deal gets a next step — no item left without a recommendation.
