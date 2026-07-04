# Feature Spec: SePay Webhook Hardening (Phase 2)

**Status**: Specification | **Phase**: 2. OMS/Payment | **Author**: Antigravity

## Overview

Hardening the SePay Webhook Listener to prevent payment discrepancies (lệch tiền), handle duplicate payloads (idempotency), and correctly route incorrect content transfers to a suspense account (TK 3388).

## Requirements

### 1. Price Discrepancy Check
- Match the incoming transfer amount from the webhook event with the order's expected total.
- If there is a price mismatch (lệch tiền):
  - Do NOT transition the order status to `paid`.
  - Set the order `paymentStatus` to `discrepancy`.
  - Route the journal entry credit account to suspense account `3388`.
  - Send a ZNS alert notification to the administrator.

### 2. Suspense Account Routing (TK 3388)
- Transactions with invalid/non-matching order codes must be logged with a credit account of `3388` and marked for manual reconciliation.

### 3. Idempotency Check
- Ensure that once a transaction ID has been processed, any duplicate webhook events with the same transaction ID are ignored.

## Success Criteria
- Orders with mismatched transfer amounts are marked as `discrepancy` and not `paid`.
- Discrepancy transactions are booked under Account `3388` instead of standard revenue account `5111` or receivable `1311`.
