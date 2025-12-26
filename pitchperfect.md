Below is the complete updated PRD text you can paste into pitchperfect.md (full replacement). It includes Update 1 plus the new Commission Management feature, the admin/devteam flows, and the soft-block policy.

Redone: Product Requirements Document (PRD): PitchPerfect Africa — Updated (Events, Owner Management & Commission Flow)

**1. Executive Summary**  
Eliminating reliance on fragmented WhatsApp flows by hosting the full booking and event lifecycle—discovery, a 7‑day real‑time availability calendar, transactional slot locking, event creation/joining, image‑proof payments and owner confirmation—while remaining serverless (Firestore-only) for MVP. Owners manage pitches, events, promotions, payouts and commission payments from a compact admin home; customers create/join events and upload payment proof. The platform will show weekly invoice summaries and a per-arena commission/payments view in the `devteam` UI for manual reconciliation.

**2. Target Personas**  
- The Pitch Owner: wants occupancy, transparent payments, manual verification for proof-based money receipts, quick calendar & event controls.  
- The Weekend Warrior: wants instant, mobile-first bookings and event participation with clear payment status and simple payment proof upload.

**3. Functional Requirements (User Stories)**

**3.1 Facility & Pitch Management**
- Owners add/manage pitches (images, pricePerSlot, slotDuration, daily availability windows, buffer minutes). Reuses AddProductComposer UX patterns.  
- Owners set blocked ranges (maintenance), create promos per pitch, and add categories (Football, Table Tennis, Badminton, Sports Items Rental).  
- Owners edit payout/account details in Account modal (bank name, account number, account holder). Create-store flow captures these fields.

**3.2 Calendar & Availability (Public)**
- 7‑day horizontal calendar with date picker; selecting a date shows timeslots for selected pitch with clear status badges: Available / Held (countdown) / Booked / Blocked / Event.  
- Timeslots derived from pitch config (slotDuration, availability) and blockedRanges. UI is mobile-optimized with large tap targets.

**3.3 Booking & Slot Locking (Firestore-only)**
- Slot reservation uses deterministic slot lock docs (format described below) and Firestore transactions to avoid double-bookings: read locks, clear expired holds, create booking and lock docs atomically.  
- Booking statuses: held → pending_payment → confirmed → completed → cancelled. Holds expire after configured holdDuration (default 10 minutes).

**3.4 Payments (MVP: Owner-Collects with Proof)**
- Customer uploads payment proof image (Cloudinary or Firebase Storage URL) after creating a held booking. UI shows hold countdown and a “Proceed to Payment / Upload Proof” flow.  
- Owner receives notification, reviews proof in Admin Bookings modal, and marks booking as Paid. Confirming payment updates booking, slot locks to confirmed, and appears in weekly invoice and devteam payment lists.  
- Platform invoices owner the platform commission (weekly) based on confirmed bookings and events. Invoice line items include commission per booking and net payout.

**3.5 Events (Owner & Customer)**
- Owners and customers can create events attached to a pitch or as general events. Event model includes capacity, pricePerParticipant, date/time, and split rules.  
- Participants join using transactional event locks; participant records track amountDue, amountPaid, paymentProofUrl and status. Owners review participant proofs and mark paid. UI shows split breakdown and remaining amounts.

**3.6 Commission Management (New)**

Overview
- Arena owners see commission reporting and pay platform commission manually (MVP). Owners pay the platform externally to a specified account and upload the payment confirmation image via the owner admin UI.
- Commission payments are tracked per-store, shown in the `devteam` UI for reconciliation, and require manual acknowledgement by a Bizcon admin. A soft non-payment policy (informational) is defined; enforcement (blocking) is a later feature.

Flow & UI
- In ` /admin/[storeId]` (admin home):
  - Add a new “Commission” section/card inside AdminHomeCards or the admin sidebar that shows:
    - Current Billing Window (Weekly: Sunday–Saturday)
    - Outstanding Commission Due (NGN)
    - Last Payment Date
    - `Pay Commission` CTA → opens Commission Payment modal
  - Commission Payment modal:
    - Shows invoice summary for the current window (gross revenue, calculated platform commission, breakdown per booking/event).
    - Displays the required remittance account details (example): Account Number: 8119772223 — Mustapha Gambo Lawal — Opay.
    - Provides `Upload Payment Confirmation` control to upload an image (Cloudinary/Firebase Storage) and optional notes/reference.
    - On upload, the commission payment record is created in `stores/{storeId}/commissionPayments/{paymentId}` with fields: amount, periodStart, periodEnd, accountNumber, accountName, proofUrl, uploadedAt, status: 'submitted'.
  - After submission, owner sees status: Submitted → Awaiting Bizcon Confirmation.

- In ` /devteam` UI (Bizcon admin):
  - Add Commission & Payment Details per Arena:
    - A per-arena summary with a filter for the last 7 days (default) plus full history.
    - Shows `Submitted Payments` with proof thumbnails, uploadedAt, uploader (storeId), invoice period, amount, and status (Submitted / Acknowledged / Rejected).  
    - Bizcon admin clicks `Acknowledge Payment` to mark payment record status = 'acknowledged' (this updates store's lastPaidAt and clears the outstanding commission for that period). Optionally add `Reject` with reason.
    - The `devteam` home shows a quick pivot: “Stores with payments in last 7 days” and flags awaiting acknowledgement.

Storage & Docs
- Commission records: `stores/{storeId}/commissionPayments/{paymentId}`:
  - fiscalPeriod: {startDate, endDate}
  - grossRevenue: number
  - commissionRate: number
  - platformCommissionAmount: number
  - amountPaidByVendor: number
  - accountNumber, accountName, remittanceReference (optional)
  - proofUrl, uploadedBy, uploadedAt, status: 'submitted'|'acknowledged'|'rejected'
  - acknowledgedBy, acknowledgedAt (set when Bizcon admin acknowledges)

Soft Enforcement Policy
- For now: soft non-payment policy. If commission remains unpaid after N days (configurable; future: 8 days), the system flags the store as delinquent in `devteam` (visual warning). Future feature: automated temporary soft-block after 8 days (e.g., hide promoted listings or reduce visibility) — not implemented in MVP.

**3.7 Admin Invoicing & Weekly Summary (in ` /admin/[storeId]`)**
- Weekly Invoice Summary (Sunday–Saturday) visible in AdminHomeCards or invoicing section:
  - Reporting window
  - Total Gross Revenue (confirmed payments)
  - Platform Commission (sum for period)
  - Owner Net (gross − commission)
  - Confirmed Bookings / Events count
  - Number of Expired Holds
  - Pending Payouts & Manual Adjustments
  - Export CSV / Download PDF with per-booking lines: bookingId, date, pitchId, maskedCustomer, gross, commission, platformFee, netPayout, paymentStatus, proofUrl.
- Owners can add manual adjustments (walk-in cash), and these are factored into the weekly invoice.

**4. Data Model (Canonical Summary)**  
- `stores/{storeId}`: add `storeType: 'sports'|'sports-rental'`, `timezone`, and bank/payout fields.  
- `stores/{storeId}/pitches/{pitchId}`: name, images[], pricePerSlot, slotDurationMinutes, availability, bufferMinutes, promos[], blockedRanges[]  
- `stores/{storeId}/slotLocks/{lockId}`: deterministic lockId (`{pitchId}__{YYYY-MM-DD}__{HHmm}`), bookingRef, status: 'held'|'confirmed', createdAt, holdDurationMins  
- `stores/{storeId}/bookings/{bookingId}`: pitchId, date, startISO, endISO, customerId/phone, totalAmount, status, paymentStatus, holdExpiresAt, paymentProofUrl, createdAt  
- `stores/{storeId}/events/{eventId}` and `stores/{storeId}/events/{eventId}/participants/{participantId}`: event metadata and per-participant payment fields (amountDue, amountPaid, proofUrl, status)  
- `stores/{storeId}/commissionPayments/{paymentId}`: commission invoice & payment proof records (see Commission section)

**5. Transaction Patterns (High-level)**  
- Use Firestore transactions for all reservation flows:
  - Create booking: read slot lock docs, delete expired locks, if free → create booking + set slotLocks atomically.  
  - Confirm payment: owner updates booking.paymentStatus to 'paid' and atomically updates related lock docs to 'confirmed'.  
  - Join event: same lock pattern applied to event capacity slots.  
- Use deterministic doc IDs so transactions operate on known docRefs rather than wide queries.

**6. Realtime & Listener Strategy**  
- Listeners scoped to visible date ranges to minimize reads: subscribe to `bookings`/`slotLocks`/`events` for the 7‑day window.  
- Admin has persistent snapshot listeners for bookings/events relevant to their store.  
- `devteam` shows recent commission submissions via a query filtered by `uploadedAt` within last 7 days.

**7. Firestore Rules (Dev vs Production)**  
- Dev: permissive rules for iteration (current).  
- Prod: restrict writes so only owners may create/modify their store resources in controlled ways; only Bizcon admins can set `commissionPayments.status = 'acknowledged'`. Disallow clients from marking `paymentStatus = 'paid'` on bookings — owner auth required.

**8. UX & Mobile Optimization**  
- Calendar: horizontal 7‑day strip with occupancy dots, large day chips, and accessible labels.  
- Slot grid: responsive cards (2 columns narrow → 4 columns wide), clear color coding and non-color cues.  
- Commission UI: compact modal in ` /admin/[storeId]` showing invoice details and upload control.  
- Devteam: per-arena payment panel with quick ack buttons and proof preview.  
- Low-data strategy: lazy images, small JSON payloads for visible date ranges, caching, and placeholders.

**9. Edge Cases, Fraud & Controls**  
- Race conditions: prevented via deterministic slotLocks + transactions.  
- Stale holds: cleared opportunistically in transactions; UI indicates hold expiry.  
- Proof fraud: manual owner confirmation and Bizcon acknowledgment create an audit trail; disputes handled via manual review.  
- Clock skew: use serverTimestamp and add a small buffer window when considering expiry.

**10. Commission Recommendation & Rationale**  
- Default commission: 8% of booking subtotal (recommended starting point).  
- Promoted/Marketplace placement: 12% when owner opts into featured listings.  
- Managed/Premium Fulfillment: 14% if Bizcon handles payments/logistics.  
- Subscription alternative: NGN 5,000–15,000/month + reduced commission (3%–5%) for high-volume owners.  
Rationale: 8% balances platform viability and owner adoption in Nigerian market; subscription option offers predictable cost for high-volume arenas.

**11. Testing Matrix & Rollout**  
- Devices: iPhone SE, Galaxy S8, iPhone Pro Max. Test network conditions (2G/3G), offline UX, and concurrency flows.  
- Scenarios: simultaneous bookings, hold expiry, proof upload + owner confirm, join event race, commission payment submission & Bizcon acknowledgement.  
- Pilot: initial rollout to 30 arenas for 6–8 weeks with 0% commission or discounted subscription for early adopters. Gather metrics: activation rate, hold→paid conversion, dispute rate.

**12. Implementation Phases (No Cloud Functions Required for MVP)**

Phase A (MVP — 2–4 weeks)
- Add `storeType = sports`, pitch schema, AddPitchComposer, manage pitches, block slots UI.  
- Implement slotLocks + transactional createBooking.  
- Build 7‑day calendar, timeslot grid, booking sheet, booking list, proof upload, owner confirmation flows.  
- Commission: Commission Payment modal in ` /admin/[storeId]`, `commissionPayments` docs, upload flow.  
- `devteam`: per-arena commission and payment acknowledgment UI (show last 7 days).

Phase B (2–4 weeks)
- Events UIs, participant management, admin analytics per pitch, promo workflows and CSV export.  
- Harden Firestore rules and enable Bizcon manual acknowledgment workflows. UI/UX polish.

Phase C (optional)
- Integrate Paystack/webhooks and scheduled payouts once billing & serverless functions are available; implement automated delinquent flags/soft-blocks (after 8 days) if required.

**13. Operational & Reporting Notes**  
- Weekly invoice is generated client-side from confirmed bookings (or precomputed metrics) and displayed for owner review; owners attach proof of commission payment by uploading an image in admin.  
- Bizcon will use `devteam` UI to acknowledge payment receipts; once acknowledged, the `commissionPayments` record is updated and flagged reconciled.  
- Commission calculations are transparent and per-booking line items are part of the invoice export.

**14. Update Log**  

Update 1 — Events, Owner Management & Weekly Invoicing  
- Added events support, deterministic slotLocks, transactional join flow and admin event management. Weekly invoice summary added to the admin view.

Update 2 — Commission Management & Devteam Reconciliation (this document)  
- Added commission payment flow for owners: in ` /admin/[storeId]`, `Pay Commission` modal with remittance instructions (Account: 8119772223 — Mustapha Gambo Lawal — Opay), upload payment confirmation, tracked in `commissionPayments`.  
- `devteam` now displays recent payments (last 7 days) and allows Bizcon admin to `Acknowledge` or `Reject` uploaded payments. Manual acknowledgement updates DB and reconciles the weekly invoice. Soft delinquent flagging after 8 days planned (no blocking in MVP).

