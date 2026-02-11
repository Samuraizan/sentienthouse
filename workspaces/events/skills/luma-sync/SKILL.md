---
name: luma-sync
description: Pulls event registration and attendance data from Luma API for BLRxZo events
---

# Luma Sync

## Triggers
- "check registrations"
- "how many signed up"
- "event attendance"

## Purpose
Query the Luma (lu.ma) API to get real-time registration counts, guest lists, and event details for all BLRxZo events. This is the source of truth for who signed up and who showed up.

## Authentication

- **API Key:** `$LUMA_API_KEY_BLRXZO`
- **Header:** `x-luma-api-key`
- **Calendar:** BLRxZo

All requests must include the header:
```
x-luma-api-key: $LUMA_API_KEY_BLRXZO
```

## API Endpoints

### List All Events
```
GET https://public-api.luma.com/v1/calendar/list-events?after={yesterday}T00:00:00Z&sort_column=start_at&sort_direction=asc
```
Returns all events for the BLRxZo calendar. Use this to find event IDs, see upcoming/past events, and get an overview.

**Query parameters:**
- **IMPORTANT:** Always use `after` param — without it the API returns only the oldest 50 events and misses recent ones!
- `after` (optional): ISO datetime to filter events after a date
- `before` (optional): ISO datetime to filter events before a date

### Get Single Event
```
GET https://public-api.luma.com/v1/event/get?event_id={EVT_ID}
```
Returns full details for a specific event: title, description, start/end time, location, cover image, host info.

### Get Guest List
```
GET https://public-api.luma.com/v1/event/get-guests?event_id={EVT_ID}
```
Returns all registered guests for an event. Each guest record includes:
- Name
- Email
- Registration status (registered, approved, declined, waitlisted)
- Check-in status (checked_in: true/false)
- Registration timestamp
- Any custom question responses

**Pagination:** If there are many guests, results may be paginated. Check for `next_cursor` in the response and pass it as `?cursor={value}` to get the next page.

## Common Tasks

### Check registration count for an upcoming event
1. Call `get-events` to find the event by name or date
2. Note the `event_id`
3. Call `get-guests?event_id={EVT_ID}`
4. Count guests by status: registered, approved, waitlisted

### Report registration summary
Format the output as:

```
Event: {Event Name}
Date: {Date}
---
Registered: {count}
Approved: {count}
Waitlisted: {count}
Declined: {count}
---
Total signups: {total}
Checked in: {checked_in_count} ({percentage}%)
```

### Track attendance rate
After an event concludes, pull the guest list and calculate:
- **Show-up rate:** checked_in / registered (percentage)
- Note: Zo House events typically see 60-75% show-up rate. Flag if significantly higher or lower.

### Pre-event check (day-of)
On event day, pull the latest guest count and report to Boldrin:
- Total registered
- Any last-minute signups (registered in last 24h)
- Waitlist size (if capacity-limited)

## Error Handling
- If the API returns 401: the API key may have been rotated. Ask Boldrin for the updated key.
- If the API returns 404 for an event: double-check the event_id. Try listing all events first.
- If the API is slow or down: Luma occasionally has outages. Wait 5 minutes and retry. If persistent, check https://status.lu.ma or note it and move on.

## Important Notes
- The API key is for BLRxZo. Do not use it for other calendars.
- Guest emails are PII -- never share full guest lists publicly. Summaries and counts are fine.
- When reporting to Boldrin, always include the event name and date for context.
- Cross-reference Luma data with actual door count when available -- Luma check-ins may not capture walk-ins.
- Cache results sensibly. Don't hammer the API for the same event repeatedly within minutes.
