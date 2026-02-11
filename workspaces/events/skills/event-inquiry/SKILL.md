---
name: event-inquiry
description: Processes incoming event hosting inquiries from Typeform, assesses fit, and generates quotes
---

# Event Inquiry Processing

## Triggers
- "new event inquiry"
- "someone wants to host"
- "typeform submission"

## Purpose
Handle the full intake pipeline from inquiry to quote. Every potential event at Zo House goes through a structured GO/NO-GO assessment before any commitment is made.

## Inquiry Source

**Typeform:** https://zostel.typeform.com/to/LgcBfa0M

Typeform submissions contain: contact name, email, phone, event type, preferred date, expected headcount, budget range, event description, and any special requirements.

## Venue Specs

### Zo House Whitefield
- **Capacity:** ~100 pax (standing), ~70 pax (seated)
- **Location:** Whitefield, Bangalore
- **Best for:** Larger meetups, community events, product launches, screenings
- **Features:** Open layout, projector/screen, sound system, F&B kitchen access

### Zo House Koramangala
- **Capacity:** ~80 pax (standing), ~50 pax (seated)
- **Location:** Koramangala, Bangalore
- **Best for:** Intimate gatherings, workshops, jam sessions, dinners, podcast recordings
- **Features:** Cozy vibe, rooftop access (weather permitting), kitchen, AV setup

## Processing Pipeline

### Step 1: Receive & Log
- Capture all Typeform fields
- Log inquiry in the events tracker
- Acknowledge receipt to host within 24 hours

### Step 2: GO/NO-GO Assessment

Evaluate on these criteria:

| Criteria | GO | NO-GO |
|----------|-----|--------|
| **Venue fit** | Headcount within capacity, event type suits the space | Exceeds capacity, needs specialized infrastructure we lack |
| **Budget** | Meets minimum venue hire + costs | Significantly below cost floor, expects free venue |
| **Capacity** | Headcount realistic for the space | Overcrowded or too few to justify (under 15) |
| **Values alignment** | Aligns with Zo ethos -- creative, community, curious, conscious | MLM pitches, political rallies, anything exploitative or exclusionary |
| **Lead time** | 7+ days out | Less than 3 days (unless simple + Boldrin approves rush) |
| **Date availability** | Venue free on requested date | Conflict with existing booking or house event |

**Decision:**
- **GO** -- proceed to costing
- **CONDITIONAL GO** -- proceed with caveats (e.g., "only if headcount stays under X")
- **NO-GO** -- politely decline with reason, suggest alternatives if possible

### Step 3: Cost Breakdown

Build a line-item estimate:

- **Venue hire:** Base rate depends on hours, day of week (weekday vs weekend premium), and event type
- **F&B:** Per-head cost based on menu selection (tea/coffee, snacks, meals, bar)
- **AV/Tech:** Included in base for standard setup; extra for specialized needs
- **Staffing:** Event support, cleanup crew if needed
- **Miscellaneous:** Decor, printing, special requests

Add GST at 18% to arrive at total.

### Step 4: Quote Email to Host

Send a professional quote email containing:

1. Greeting referencing their event concept
2. Venue recommendation (Whitefield or Koramangala) with reasoning
3. Proposed date/time confirmation
4. Itemized cost breakdown
5. Total with GST
6. Payment terms (50% advance to confirm, 50% day-of or net-7)
7. What's included (basic AV, WiFi, seating, cleanup)
8. What's extra (catering upgrades, special decor, extended hours)
9. Next steps: "Reply to confirm, and we'll lock it in"

**Tone:** Warm but professional. Zo is not a hotel banquet hall -- it's a home. Frame it as "hosting at our place" energy, not corporate event management.

## Rush Events (< 7 days lead time)

- Flag to Boldrin immediately
- Only proceed if: simple format, no complex F&B, venue is available, Boldrin says yes
- Rush surcharge may apply (Boldrin's call)

## Decline Template

> Hey [Name], thanks for reaching out about hosting [Event] at Zo House! We love the energy, but unfortunately [reason -- date conflict / capacity mismatch / not the right fit for our space]. We'd love to stay connected though -- [suggest alternative date / recommend another venue / invite to upcoming Zo events]. Keep us in the loop for future plans!

## Important Notes
- Never commit to a date without checking the calendar AND getting Boldrin's approval
- Always CC Boldrin on quote emails
- Track every inquiry regardless of outcome -- NO-GOs are data too
- If an inquiry comes through a channel other than Typeform (DM, email, word of mouth), still run the same pipeline
