# Sales Strategy Deep Research

**Trigger:** Cron job every 45 minutes (overnight, 16 phases over 12 hours)
**Output:** `workspaces/sales/SALES_STRATEGY_2026.md`
**Progress:** `workspaces/sales/RESEARCH_PROGRESS.md`

## How This Works

You are running a slow, methodical overnight research sweep. Each time this cron fires, you:

1. Read `workspaces/sales/RESEARCH_PROGRESS.md` to see which phase you're on
2. Execute ONLY that one phase (keep token usage low — be concise, use bullet points)
3. Append your findings to `workspaces/sales/SALES_STRATEGY_2026.md` under the correct section header
4. Update RESEARCH_PROGRESS.md to mark the phase complete and set next phase
5. Send a SHORT status update to Samurai (Telegram ID: 1275114944): "Phase N/16 complete: [topic]. Findings appended."

**CRITICAL: Only do ONE phase per invocation. Be thorough but concise. Use structured bullets, not prose. Keep each phase under 2000 tokens of output.**

---

## Phase Definitions

### Phase 1: Booking Patterns Analysis
**Data:** Supabase `pms_bookings` — fetch ALL rows
**Query:** `GET https://elvaqxadfewcsohrswsi.supabase.co/rest/v1/pms_bookings?order=arrivaldate.desc&limit=500`
**Headers:** `apikey: $SUPABASE_ANON_KEY`, `Authorization: Bearer $SUPABASE_ANON_KEY`
**Analyze:**
- Total bookings by property (BLRxZo vs WTFxZo)
- Revenue distribution (total_room_charges breakdown)
- Average stay length
- Booking seasonality (which months are strongest)
- Payment status distribution (paid vs pending)
- Guest repeat rate (same guestname appearing multiple times)
- Room type popularity
- Booking lead time (gap between booking date and arrival)

### Phase 2: Community & Founder Analysis
**Data:** Supabase `founder_profiles` — fetch ALL rows
**Query:** `GET https://elvaqxadfewcsohrswsi.supabase.co/rest/v1/founder_profiles?limit=500`
**Analyze:**
- Total community members
- Membership tier distribution
- Active vs inactive members
- Growth rate (by created_at timestamps)
- Which members have founder tokens (founder_token_ids)
- Overlap between founders and bookings (cross-reference with pms_bookings guestname)
- Potential for membership upsell

### Phase 3: Events Performance
**Data:** Supabase `canonical_events` + `event_registrations`
**Query 1:** `GET .../canonical_events?limit=500`
**Query 2:** `GET .../event_registrations?limit=500`
**Analyze:**
- Total events hosted (by property)
- Event types and categories (culture_tag distribution)
- Average attendance per event
- Registration-to-attendance conversion
- Revenue per event (if tracked)
- Most popular event types
- Event frequency trends (monthly/weekly)
- Which events drive bookings (correlate event dates with booking arrivals)

### Phase 4: Inbound Inquiry Analysis
**Data:** Supabase `event_inquiries`
**Query:** `GET .../event_inquiries?limit=500`
**Analyze:**
- Total inquiries received
- Inquiry sources and channels
- Event type demand (what people ask for most)
- Budget ranges requested
- Venue preference distribution
- Inquiry-to-booking conversion rate (if trackable)
- Response time patterns
- Seasonal inquiry trends

### Phase 5: Operations & Performance
**Data:** Supabase `daily_performance` + `housekeeping_sessions`
**Query 1:** `GET .../daily_performance?limit=200`
**Query 2:** `GET .../housekeeping_sessions?limit=200`
**Analyze:**
- Staff performance metrics and trends
- Housekeeping quality scores
- Operational bottlenecks
- Turnaround times
- Guest experience indicators
- Cost efficiency of operations
- Impact of ops quality on guest satisfaction/rebooking

### Phase 6: BLRxZo P&L Deep Dive
**Data:** Google Sheets — BLRxZo P&L (Sheet ID: `1VKZKfKrfF2qNEnqvuttQwdNDsqueUUtGE0pzq8wnL2Y`)
**Use Google Sheets API or read via workspace tools**
**Analyze:**
- Revenue streams breakdown (room revenue, event revenue, co-working, F&B)
- Monthly revenue trends
- Cost structure (fixed vs variable)
- Gross and net margins
- Revenue per available room (RevPAR)
- Occupancy rate trends
- Highest margin revenue streams
- Cost optimization opportunities

### Phase 7: WTFxZo P&L Deep Dive
**Data:** Google Sheets — WTFxZo P&L (Sheet ID: `1_sdVufcJP4tAS-anT_8KDQaCGO110AL1hYJV3j4w9kY`)
**Analyze:** Same metrics as Phase 6, PLUS:
- Property comparison: BLRxZo vs WTFxZo head-to-head
- Which property is more profitable and why
- Revenue mix differences
- Can successful strategies from one property transfer to the other?

### Phase 8: Task Board & Operational Bottlenecks
**Data:** Google Sheets — Laundry List (Sheet ID: `1csj8lmBRRHtcDdapRhiANn2xNYIDaPlRPZ1EQv_x0BI`)
**Analyze:**
- Task completion rate by owner
- Blocked tasks and why
- Sales-related tasks status
- Marketing tasks status
- Revenue-impacting tasks that are stalled
- Operational dependencies that block sales

### Phase 9: Market Research — Bangalore Co-Living
**Data:** Web search
**Research:**
- Bangalore co-living market size and growth (2025-2026)
- Top competitors: pricing, positioning, target audience
- Co-working space pricing benchmarks in Bangalore
- What amenities/experiences are competitors offering
- Gap analysis: what does Zo House offer that others don't

### Phase 10: Market Research — Digital Nomad & Founder Trends
**Data:** Web search
**Research:**
- Digital nomad population in India (2025-2026 stats)
- "Live as a founder" programs globally — what exists, pricing, duration
- Remote work trends in India
- Startup ecosystem Bangalore — events, meetups, accelerators
- Content marketing trends for co-living spaces
- Social media strategies that work for community-driven brands

### Phase 11: Market Research — B2B & Corporate
**Data:** Web search
**Research:**
- Corporate retreat market India 2026
- Team offsite trends and pricing
- Event venue market Bangalore
- What corporates look for in offsite venues
- How to position Zo House for corporate bookings
- B2B lead generation strategies for hospitality

### Phase 12: What's Already Working
**Data:** Synthesize findings from Phases 1-11
**Analyze:**
- Revenue drivers: which channels bring the most money
- Strongest booking sources
- Most profitable guest segments
- Events that drive bookings
- Community features that retain guests
- Marketing channels with best ROI
- Operational strengths

### Phase 13: What's NOT Working & Gaps
**Data:** Synthesize findings from Phases 1-11
**Analyze:**
- Leaky funnel: where are we losing potential guests
- Underperforming revenue streams
- Missed B2B/corporate opportunities
- Events that don't convert to stays
- Guest segments we're NOT reaching
- Pricing gaps vs competition
- Operational issues that hurt sales

### Phase 14: Revenue Doubling Opportunities
**Data:** Synthesize all previous phases
**Identify:**
- Top 5 quick wins (implementable in 2 weeks)
- Top 5 medium-term plays (1-3 months)
- Top 3 big bets (3-6 months)
- For each: expected revenue impact, effort required, resources needed
- Pricing optimization opportunities
- New revenue streams to explore
- Partnership opportunities

### Phase 15: Comprehensive Sales Strategy
**Compile the full strategy document:**
1. Executive Summary (5 bullet points)
2. Current State Analysis (from Phases 1-8)
3. Market Context (from Phases 9-11)
4. Strengths & Opportunities (from Phase 12)
5. Gaps & Threats (from Phase 13)
6. Revenue Growth Roadmap (from Phase 14)
7. 90-Day Action Plan with owner assignments
8. KPIs to track
9. Budget recommendations

### Phase 16: Final Report & Delivery
- Polish the full SALES_STRATEGY_2026.md document
- Send comprehensive summary to Samurai (1275114944) AND Boldrin (817242399) via Telegram
- Include top 3 immediate action items
- Mark research as complete in RESEARCH_PROGRESS.md
