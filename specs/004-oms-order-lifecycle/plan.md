# Implementation Plan: OMS Order Lifecycle & Payment Ledger (Phase 2)

**Branch**: `004-oms-order-lifecycle` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-oms-order-lifecycle/spec.md`

## Summary

This plan updates the database service to support `payments` ledger records automatically triggered on order status updates, restricts paid orders from being demoted or re-routed, and verifies correctness using a new Vitest suite.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify that this plan adheres to the V-com-ERP Core Principles:
- [x] Detail views use fullscreen modal or slide-over layout (Principle I)
- [x] List tables use `ResizableTh` and `useTableColumns` for auto-saving sizes (Principle II)
- [x] Backend integrations are simulated on the client-side (Principle III)
- [x] TypeScript check and `npm run build` verify correctness (Principle IV)
- [x] Styles use modern aesthetics, gradients, and HSL variables (Principle V)

## Proposed Changes

### Database Service Update

#### [MODIFY] [dbService.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/services/dbService.ts)
- Add `'payments'` to `RELATIONAL_TABLES`.
- Update `mapJsFieldToDbColumn` for `payments`.
- Update `toRelationalPayload` and `fromRelationalRow` for `payments`.
- Implement `handleOrderPaymentTrigger(orderId, orderData, tenantId)` helper function.
- Call `handleOrderPaymentTrigger` inside `setDoc` and `updateDoc` if `docRef.tableName === 'orders'`.

---

### OMS Available Stock & Status Locking

#### [MODIFY] [Orders.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Orders.tsx)
- Define `const isPaidOrBeyond = ['paid', 'confirmed', 'allocated', 'picking', 'packed', 'shipped', 'delivered', 'completed'].includes(order.status);`
- Check `isPaidOrBeyond` and prevent manual/auto routing changes inside `handleManualRoute` and `handleAutoRoute`.
- Filter out/disable the `draft` and `pending` options in the "Đổi trạng thái" select list if the order is already `paid` or beyond.

---

### Verification Test Cases

#### [NEW] [oms_lifecycle.test.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/__tests__/oms_lifecycle.test.ts)
- Create automated unit tests for:
  - Intercepting order payment trigger when status transitions to `paid`.
  - Preventing duplicate payments for the same order (idempotency).

## Verification Plan

### Automated Tests
- Run `npx vitest run src/__tests__/oms_lifecycle.test.ts` to verify.
- Run `npm run build` to verify clean compilation.
