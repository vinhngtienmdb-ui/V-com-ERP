# Implementation Plan: SePay Webhook Hardening (Phase 2)

**Branch**: `005-sepay-webhook-hardening` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-sepay-webhook-hardening/spec.md`

## Summary

This plan hardens the SePay Webhook Listener to perform price discrepancy checks, handle incorrect order content transfers by routing them to a suspense account (Account 3388), and verify functionality using the unit test suite.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify that this plan adheres to the V-com-ERP Core Principles:
- [x] Detail views use fullscreen modal or slide-over layout (Principle I)
- [x] List tables use `ResizableTh` and `useTableColumns` for auto-saving sizes (Principle II)
- [x] Backend integrations are simulated on the client-side (Principle III)
- [x] TypeScript check and `npm run build` verify correctness (Principle IV)
- [x] Styles use modern aesthetics, gradients, and HSL variables (Principle V)

## Proposed Changes

### Webhook Listener Updates

#### [MODIFY] [useSepayListener.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/hooks/useSepayListener.ts)
- Add price matching check against expected order total retrieved from the database.
- If the transfer amount does not match the order total:
  - Do not transition order status to `paid`.
  - Update `paymentStatus` to `discrepancy`.
  - Route credit account to `3388` (suspense account).
  - Dispatch a warning ZNS notification.

## Verification Plan

### Automated Tests
- Run `npx vitest run src/__tests__/zns_sepay_integration.test.ts` to ensure no regression in SePay integration.
- Run `npm run build` to verify clean compilation.
