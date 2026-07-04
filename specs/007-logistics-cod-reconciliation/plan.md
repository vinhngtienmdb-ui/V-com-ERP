# Implementation Plan: Logistics COD Reconciliation (Phase 2)

**Branch**: `007-logistics-cod-reconciliation` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-logistics-cod-reconciliation/spec.md`

## Summary

This plan integrates GHTK/GHN COD statement reconciliation within the logistics module, mapping double-entry journal records to Debit `1121` and Credit `1311` (matched), or routing deficits to `1388` (mismatched) with admin ZNS alert integrations.

## Constitution Check

Verify that this plan adheres to the V-com-ERP Core Principles:
- [x] Detail views use fullscreen modal or slide-over layout (Principle I)
- [x] List tables use `ResizableTh` and `useTableColumns` for auto-saving sizes (Principle II)
- [x] Backend integrations are simulated on the client-side (Principle III)
- [x] TypeScript check and `npm run build` verify correctness (Principle IV)
- [x] Styles use modern aesthetics, gradients, and HSL variables (Principle V)

## Proposed Changes

### Logistics UI Update

#### [MODIFY] [Logistics.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Logistics.tsx)
- Load actual orders from database (filtered by `cod` payment method).
- Add a new "Đối soát COD" tab.
- Render reconciliation tables and actions (including mock statement upload/matching simulation).

---

### Reconciliation Logic

#### [NEW] [codReconciliationService.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/services/codReconciliationService.ts)
- Implement `reconcileCodStatement(trackingCode, actualCod, carrierName)` function:
  - Match order by tracking code.
  - If matched: write Nợ 1121 / Có 1311 journal entry, mark status as matched/paid.
  - If mismatched: write journal entry routing deficit to Nợ 1388, trigger ZNS alert to Admin, mark status as discrepancy.

---

### Verification Test Cases

#### [NEW] [cod_reconciliation.test.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/__tests__/cod_reconciliation.test.ts)
- Create automated unit tests verifying:
  - Successful match journal entries (Debit 1121, Credit 1311).
  - Price discrepancy routing to suspense account 1388 (deficit) or 3388 (surplus).
  - Admin ZNS notifications trigger.

## Verification Plan

### Automated Tests
- Run `npx vitest run src/__tests__/cod_reconciliation.test.ts` to verify functionality.
- Run `npm run build` to verify clean compilation.
