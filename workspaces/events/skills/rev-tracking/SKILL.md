---
name: rev-tracking
description: Updates the Rev-Events Google Sheet with event financials, revenue, costs, and payment status
---

# Revenue Tracking

## Triggers
- "update revenue"
- "event revenue"
- "PnL update"

## Purpose
Maintain an accurate, up-to-date record of all event-related revenue and expenses in the central Google Sheet. This is the financial source of truth for Zo House events and feeds into monthly reporting.

## Google Sheets Access

- **Helper script:** `/home/conscious-house/bin/google-api`
- **Credentials:** `/home/conscious-house/.credentials/sheets.json`
- **Sheet tab:** `Rev-Events`

Use the google-api helper script for all read/write operations. Do not attempt direct Google Sheets API calls without going through the helper.

## Sheet Schema (Rev-Events Tab)

| Column | Field | Format | Description |
|--------|-------|--------|-------------|
| A | **Event Name** | Text | Full event name as listed on Luma |
| B | **Date** | YYYY-MM-DD | Event date |
| C | **Venue** | Text | "Whitefield" or "Koramangala" |
| D | **Host** | Text | External host name or "Zo House" for internal events |
| E | **Type** | Text | Community / Corporate / Private / Partnership |
| F | **Revenue - Tickets** | Number | Ticket/entry fee revenue (pre-GST) |
| G | **Revenue - Venue Hire** | Number | Venue rental fee charged to host (pre-GST) |
| H | **Revenue - F&B** | Number | Food & beverage revenue (pre-GST) |
| I | **Revenue - Sponsorship** | Number | Sponsor contributions (pre-GST) |
| J | **Revenue - Other** | Number | Miscellaneous revenue |
| K | **Total Revenue** | Formula | =SUM(F:J) for the row |
| L | **Cost - F&B** | Number | Actual food & beverage costs |
| M | **Cost - Staff** | Number | Event staffing costs |
| N | **Cost - Marketing** | Number | Paid promotion, printing, etc. |
| O | **Cost - Other** | Number | Miscellaneous costs |
| P | **Total Costs** | Formula | =SUM(L:O) for the row |
| Q | **Net Profit** | Formula | =K-P for the row |
| R | **Margin %** | Formula | =Q/K for the row |
| S | **Payment Status** | Text | "Pending" / "Partial" / "Received" / "Overdue" |
| T | **Invoice #** | Text | Invoice number from invoice-maker (ZO-INV-...) |
| U | **Payment Date** | YYYY-MM-DD | Date payment was received |
| V | **Notes** | Text | Any additional context |

## Workflow

### After Event Booking Confirmed
1. Add a new row with: Event Name, Date, Venue, Host, Type
2. Fill in expected revenue columns based on the quote sent
3. Set Payment Status to "Pending"
4. Add Invoice # once invoice is generated

### After Event Completed
1. Update actual revenue figures (may differ from quote if walk-ins, bar sales, etc.)
2. Fill in all cost columns with actuals
3. Verify formulas are calculating correctly

### After Payment Received
1. Update Payment Status to "Received" (or "Partial" if partial payment)
2. Fill in Payment Date
3. Add notes if payment was via crypto, split payment, or had any issues

### Overdue Payments
- If payment not received within 14 days of invoice: update status to "Overdue"
- Flag to Boldrin for follow-up
- Add note with last follow-up date

## Monthly Reporting

At end of each month, compile:

```
# Monthly Events Revenue: {Month YYYY}

## Summary
- Total events: {count}
- Total revenue: INR {amount}
- Total costs: INR {amount}
- Net profit: INR {amount}
- Average margin: {percentage}%

## By Type
- Community events: {count} | Revenue: {amount} | Net: {amount}
- Corporate events: {count} | Revenue: {amount} | Net: {amount}
- Private events: {count} | Revenue: {amount} | Net: {amount}
- Partnerships: {count} | Revenue: {amount} | Net: {amount}

## Payment Status
- Received: {count} events | INR {amount}
- Pending: {count} events | INR {amount}
- Overdue: {count} events | INR {amount}

## Top Events (by net profit)
1. {Event Name} -- INR {net}
2. {Event Name} -- INR {net}
3. {Event Name} -- INR {net}
```

## Important Notes
- All revenue figures are **pre-GST** in the sheet. GST is tracked separately for tax filing.
- Never delete rows -- if an event is cancelled, mark it in Notes and zero out the numbers.
- Community events with zero revenue still get tracked (they have costs and are part of the story).
- Currency is always INR unless explicitly noted otherwise (e.g., crypto payments -- note USD equivalent).
- Keep the sheet clean: no merged cells, no color-coding without a legend, no random notes in formula columns.
- If the google-api helper script errors, check that credentials at `/home/conscious-house/.credentials/sheets.json` are valid and not expired. Refresh tokens if needed.
- Boldrin has final say on any revenue categorization disputes.
- This data feeds into Zo's overall P&L -- accuracy matters. Double-check numbers before writing to the sheet.
