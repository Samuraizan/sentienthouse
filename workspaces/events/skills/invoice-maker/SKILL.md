---
name: invoice-maker
description: Creates Zoworld proforma invoices with GST, bank details, and crypto payment options for events
---

# Invoice Maker

## Triggers
- "create invoice"
- "bill for event"
- "send invoice"

## Purpose
Generate professional proforma invoices for Zo House events on behalf of the legal entity. Every invoice must be accurate, GST-compliant, and include all payment options.

## Company Details

| Field | Value |
|-------|-------|
| **Company** | Zoworld Experiential Stays Pvt Ltd |
| **GSTIN** | 29AADCZ9152C1ZI |
| **State** | Karnataka (29) |

## Payment Details

### Bank Transfer
- **Bank:** HDFC Bank
- **Account Number:** 50200089338498
- **IFSC Code:** HDFC0001751
- **Account Type:** Current Account
- **Beneficiary:** Zoworld Experiential Stays Pvt Ltd

### Crypto Payment
- **Accepted:** USDT (TRC20 network)
- Wallet address to be shared on request by Boldrin
- Equivalent USD amount at time of invoice, converted at market rate on payment date

## Invoice Format

Every invoice MUST include:

### Header
- Invoice number: `ZO-INV-{YYYYMMDD}-{SEQ}` (e.g., ZO-INV-20260215-001)
- Invoice date
- Due date (default: 7 days from issue unless negotiated)

### Client Section
- Host/client name
- Company name (if applicable)
- GSTIN (if applicable, for B2B)
- Billing address

### Event Details
- Event name
- Event date(s)
- Venue (Whitefield / Koramangala)
- Expected headcount

### Line Items Breakdown

| # | Description | Qty | Rate | Amount |
|---|-------------|-----|------|--------|
| 1 | Venue hire (specify hours) | - | - | - |
| 2 | F&B package (per head) | - | - | - |
| 3 | AV/Tech setup | - | - | - |
| 4 | Additional services | - | - | - |
| | **Subtotal** | | | - |
| | **GST @ 18%** | | | - |
| | **TOTAL** | | | - |

### Footer
- Payment terms and bank/crypto details
- "This is a proforma invoice. A tax invoice will be issued upon payment confirmation."

## Instructions

1. **Gather required info** before generating: event name, date, venue, host name, services needed
2. **Calculate GST** at 18% on the subtotal. Do not round individual items -- round only the final GST amount.
3. **Number invoices** sequentially. Check the rev-tracking sheet or ask Boldrin for the last invoice number if unsure.
4. **Format as clean markdown** that can be copy-pasted or exported to PDF.
5. **Always confirm** the final invoice with Boldrin before sending to the host.
6. For crypto payments, note: "Crypto equivalent calculated at market rate on date of payment. Confirmation via transaction hash required."
7. If the host has a GST number, this is a B2B invoice -- include their GSTIN and note "Reverse charge not applicable."
