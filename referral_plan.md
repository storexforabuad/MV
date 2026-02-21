# Referral Dashboard: Robust Implementation Plan

This plan outlines the technical strategy for implementing a premium referral dashboard on BizConnect™, following the guidelines in `aerials.md`.

## ⚙️ Diagnosis & Analysis

### Current State
- Referral codes are captured during registration and stored in the `registrations` collection.
- When a registration is approved and converted into a store via `CreateStoreModal`, the referral link is currently lost.
- Store performance is tracked in `dailyMetrics` (views, orders, revenue) but not aggregated for external reporting.

### Root Cause of Missing Features
- Lack of data persistence for referral links in the `stores` collection.
- Absence of a dedicated reporting interface for referrers.

## 🛠️ Proposed Solution

### 1. Architectural Alignment
The solution leverages existing Next.js Server Actions and Firestore subcollections, maintaining the project's serverless-first architecture without introducing Cloud Functions.

### 2. Database Schema Updates
- **[MODIFY] `stores` collection**:
    - `referralCode`: string (persisted from registration)
    - `referralDate`: Timestamp (date of store creation/approval)
- **[NEW] `referralCommissions` collection** (Optional/Future):
    - For now, commissions are calculated on-the-fly to ensure "No Cloud Functions" constraints are met while providing real-time accuracy.

### 3. Performance Aggregation Logic
- Fetch `dailyMetrics` for the last 14 days.
- Split into two 7-day buckets: `Current Week` and `Previous Week`.
- Calculate percentage trends for Views and Orders.

### 4. Commission Calculation (20% Rule)
- Referrers earn 20% of the weekly subscription fee.
- Eligibility: `now < referralDate + 12 months`.
- Fee Calculation: `TIER_DETAILS[tier].price / 2` (accounting for the 50% lifetime discount applied during registration).

## 🧩 Edge Cases & Mitigations

| Edge Case | Handling Strategy |
|---|---|
| **New Store (No Metrics)** | Display "No data yet" or "0" with a neutral trend indicator. |
| **Subscription Tier Change** | Commission automatically recalculates based on the new tier's weekly fee. |
| **12-Month Expiry** | Dashboard displays "Expired" status for that store and stops adding to total earnings. |
| **Deleted Stores** | Handled by checking for store existence; registrations remain visible but stats show as N/A. |

## 🚀 Implementation Steps

### Phase 1: Data Persistence
- [x] Update `CreateStoreModal.tsx` to save `referralCode` and `referralDate`.

### Phase 2: Backend Logic
- [x] Create `src/app/actions/referralActions.ts` for data aggregation and trend analysis.

### Phase 3: Premium UI
- [x] Create `src/components/referral/ReferralCharts.tsx` using Recharts.
- [x] Create `src/components/referral/ReferralDashboardClient.tsx` with Framer Motion.
- [x] Create `src/app/register/[code]/dashboard/page.tsx` as the entry point.

## ⚖️ Alternatives Considered

### Alternative: Cloud Functions for Commission Logging
- **Pros**: Provides a permanent audit trail.
- **Cons**: Violates the "No Cloud Functions" requirement and adds complexity.
- **Decision**: Calculate on-the-fly for the dashboard, which is sufficient for the current phase.

## 🌐 Rendering Strategy
- **Optimal Strategy**: Server-Side Rendering (SSR) via Next.js Server Components for the main page, with Client-Side Rendering (CSR) for interactive charts and animations.
- **Justification**: Ensures real-time performance data while providing a premium, interactive user experience.
