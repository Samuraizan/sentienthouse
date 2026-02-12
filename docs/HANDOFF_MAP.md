# Handoff Map

> How agents pass work to each other. Every arrow is a skill that sends structured data from one agent to another — automatically, without humans copy-pasting between chats.

---

## The Flows

### 1. Sales → Operations → Community

When a guest books, three agents need to know.

```
Guest inquires
    │
    ▼
WANDA: lead-qualify
    │ Score: Hot / Warm / Cold
    ▼
WANDA: outreach-sequence → discovery-call → pipeline-update
    │
    │ Booking confirmed
    ▼
┌─────────────────────────────────────┐
│  WANDA: sale-to-ops (HANDOFF)       │
│                                     │
│  Sends to Captain + LOKI:           │
│  • Guest name                       │
│  • Check-in / check-out dates       │
│  • Property (BLR or Goa)            │
│  • Room type / preferences          │
│  • Payment status                   │
│  • Special requests                 │
│  • Booking source                   │
│  • Is Founder Member? (yes/no)      │
└──────────┬──────────┬───────────────┘
           │          │
           ▼          ▼
    CAPTAIN:      LOKI:
    incoming-     new-guest-
    guest-brief   onboard
    (prep room,   (welcome msg,
     staff,        WhatsApp,
     check-in)     community)
```

**Trigger:** Wanda says "booking confirmed for [name]" or cron detects new Supabase booking.
**Data format sent to Captain:**
```
NEW BOOKING
Guest: {name}
Dates: {check-in} → {check-out} ({nights} nights)
Property: {BLRxZo / WTFxZo}
Room: {type / preference}
Payment: {paid / partial / pending}
Source: {direct / Hostelworld / Booking.com / referral}
Founder Member: {yes / no}
Notes: {special requests}
```

**Data format sent to LOKI:**
```
INCOMING GUEST
Name: {name}
Arriving: {date}
Property: {BLRxZo / WTFxZo}
Founder Member: {yes / no}
Interests: {from booking notes if available}
Action: Welcome message + WhatsApp group + community intro
```

---

### 2. Events → Operations

When an event is confirmed, the property captain needs a prep checklist.

```
Inquiry arrives (Typeform / Telegram)
    │
    ▼
SUKI: event-inquiry
    │ GO / NO-GO assessment
    ▼
SUKI: event-marketing
    │ Luma page + social posts
    ▼
SUKI: invoice-maker (if external host)
    │
    │ Event confirmed (deposit received OR internal approval)
    ▼
┌─────────────────────────────────────┐
│  SUKI: event-to-ops (HANDOFF)       │
│                                     │
│  Sends to Captain:                  │
│  • Event name & type                │
│  • Date, time, duration             │
│  • Expected headcount               │
│  • Venue area / rooms needed        │
│  • AV / equipment requirements      │
│  • Catering needs                   │
│  • Setup time required              │
│  • External host contact (if any)   │
│  • Special requirements             │
└──────────┬──────────┬───────────────┘
           │          │
           ▼          ▼
    CAPTAIN:      LOKI:
    event-prep-   event vibe
    checklist     (atmosphere,
    (setup, AV,    music,
     staff,        community
     parking)      invite)
```

**Trigger:** Suki says "event confirmed: [name]" or invoice status changes to paid.
**Data format sent to Captain:**
```
EVENT PREP REQUIRED
Event: {name}
Date: {date} | {start_time} – {end_time}
Venue: {area / rooms}
Headcount: {expected}
Setup by: {time} (event starts at {start_time})

Requirements:
- [ ] AV: {speakers / projector / mic / none}
- [ ] Catering: {yes — {details} / no}
- [ ] Furniture: {extra chairs / tables / stage}
- [ ] Parking: {expected vehicles}
- [ ] Signage: {event name boards / directional}
- [ ] Staff: {needed for registration / service / cleanup}

Host contact: {name, phone} (if external)
Notes: {special requirements}
```

---

### 3. Check-in → Community Onboarding

When a captain completes check-in, LOKI takes over for community integration.

```
Guest arrives at property
    │
    ▼
CAPTAIN: guest-flow (check-in)
    │ Verify booking → Docs → Payment → Room → Welcome
    │
    │ Check-in complete
    ▼
┌─────────────────────────────────────┐
│  CAPTAIN → LOKI (HANDOFF)           │
│                                     │
│  Sends to LOKI:                     │
│  • Guest name                       │
│  • Room number                      │
│  • Check-out date                   │
│  • Founder Member status            │
│  • Interests / notes from check-in  │
│  • First time at Zo? (yes/no)       │
└──────────────────┬──────────────────┘
                   │
                   ▼
            LOKI: new-guest-onboard
            │
            ├── Send welcome message (Telegram / WhatsApp)
            ├── Add to property WhatsApp group
            ├── Share daily vibe / what's happening today
            ├── If Founder Member: VIP welcome + perks reminder
            └── If first-timer: Zo orientation (house rules, spaces, community norms)
```

**Trigger:** Captain says "checked in: [name]" or completes guest-flow skill.
**Data format sent to LOKI:**
```
GUEST CHECKED IN
Name: {name}
Room: {room_number}
Property: {BLRxZo / WTFxZo}
Staying until: {check-out date}
Founder Member: {yes / no}
First time at Zo: {yes / no}
Notes: {interests, profession, why they're here}
```

---

### 4. BD → Events (Partnership Events)

When Yana closes a partnership that involves events, Suki needs the details.

```
YANA: partner-research → founder-outreach → deal-pipeline
    │
    │ Partnership signed (includes co-branded events)
    ▼
┌─────────────────────────────────────┐
│  YANA: partnership-to-event         │
│  (HANDOFF)                          │
│                                     │
│  Sends to Suki:                     │
│  • Partner company & contact        │
│  • Partnership type                 │
│  • Event requirements               │
│  • Branding guidelines              │
│  • Budget / revenue share           │
│  • Timeline                         │
└──────────────────┬──────────────────┘
                   │
                   ▼
            SUKI: event-inquiry
            (fast-tracked — skip GO/NO-GO,
             already approved via partnership)
```

---

### 5. Operations → Director (Daily Roll-up)

All property data flows up to ZomadPrime every morning.

```
06:00 IST                          08:00 IST
    │                                  │
    ▼                                  ▼
Cron triggers                    Cron triggers
LOKI: daily-vibe                 CAPTAINS: daily-recap
(community post)                 (property status)
                                       │
                                       │ Data written to:
                                       │ • Google Sheets (PnL)
                                       │ • Supabase (bookings)
                                       │ • Luma (events)
                                       │
                                 10:00 IST
                                       │
                                       ▼
                              ZomadPrime: morning-briefing
                              │
                              ├── Read BLRxZo daily-recap data
                              ├── Read WTFxZo daily-recap data
                              ├── Read agent activity (gateway health)
                              ├── Read blockers (BLOCKERS_ACTIVE.md)
                              ├── Compare vs yesterday + vs targets
                              │
                              ▼
                         SAMURAI receives:
                         • Cross-property snapshot
                         • Anomalies highlighted
                         • Blockers requiring decisions
                         • Today's priorities
```

---

### 6. Low Engagement → Re-engagement

When community health drops, LOKI acts and ZomadPrime escalates.

```
Weekly (Monday morning)
    │
    ▼
LOKI: community-pulse
    │ Scan WhatsApp activity, event attendance, member engagement
    │
    ├── Active member % > 60%  →  All good, report only
    │
    ├── Active member % 40-60% →  LOKI: re-engage-quiet
    │                              │
    │                              ├── DM quiet members (silent > 7 days)
    │                              ├── Personal check-in (not automated blast)
    │                              └── Invite to upcoming events
    │
    └── Active member % < 40%  →  LOKI: re-engage-quiet
                                   +
                                   ZomadPrime: metrics-alert
                                   │
                                   ▼
                              SAMURAI receives:
                              "Community engagement critical at {property}.
                               Active members: {X}%. Action needed."
```

---

### 7. Shift Handoff (Captain → Night Staff)

End of day shift creates a structured handoff for overnight coverage.

```
20:00 IST (end of captain shift)
    │
    ▼
CAPTAIN: shift-handoff
    │
    ├── Open maintenance issues (what's pending overnight)
    ├── Expected check-ins tonight (from booking data)
    ├── Expected check-outs tomorrow morning
    ├── Guests with special needs / flags
    ├── Staff on night duty (names, tasks)
    ├── Any security / safety notes
    │
    ▼
Sent to: Night staff WhatsApp + Samurai
```

**Data format:**
```
SHIFT HANDOFF — {property} — {date}

OPEN ISSUES:
- {maintenance item — priority — status}
- {guest complaint — status}

TONIGHT:
- Check-ins expected: {count} ({names if known})
- Late checkout approved: {guest, room, time}

TOMORROW MORNING:
- Check-outs: {count} ({names, rooms})
- Events: {name, setup time}

NIGHT STAFF:
- {name} — {role} — {contact}

NOTES:
- {anything the night team needs to know}
```

---

## Handoff Implementation Checklist

| # | Handoff Skill | From | To | Status |
|---|--------------|------|-----|--------|
| 1 | sale-to-ops | Wanda | Captain + LOKI | Not built |
| 2 | event-to-ops | Suki | Captain + LOKI | Not built |
| 3 | guest check-in → onboard | Captain | LOKI | Not built |
| 4 | partnership-to-event | Yana | Suki | Not built |
| 5 | daily data → morning-briefing | Captains | ZomadPrime | Partially built (fragile) |
| 6 | low engagement → alert | LOKI | ZomadPrime | Not built |
| 7 | shift-handoff | Captain | Night staff | Not built |

**6 of 7 handoffs don't exist yet.** This is why the agents feel siloed.
