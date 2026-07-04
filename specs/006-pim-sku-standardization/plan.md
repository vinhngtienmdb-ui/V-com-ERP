# Implementation Plan: PIM SKU Standardization & Price History (Phase 2)

**Branch**: `006-pim-sku-standardization` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-pim-sku-standardization/spec.md`

## Summary

This plan updates the database schema for the `products` table (adding barcode, VAT, specification, supplier ID), registers a new price history logging trigger for database mutations, and verifies it with a new Vitest test suite.

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
- Add `'product_price_history'` to `RELATIONAL_TABLES`.
- Update `mapJsFieldToDbColumn` for `products` and `product_price_history`.
- Update `toRelationalPayload` and `fromRelationalRow` for both tables.
- Implement `handleProductPriceHistoryTrigger(productId, newProductData, tenantId)` helper function.
- Invoke this trigger inside `setDoc` and `updateDoc` before saving mutations to `products`.

---

### Database Schema Updates
- Run SQL commands on the active Supabase project to:
  - Add missing columns (`barcode`, `vat_rate`, `specification`, `supplier_id`) to `products`.
  - Create the new `product_price_history` table.

---

### Verification Test Cases

#### [NEW] [pim_price_history.test.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/__tests__/pim_price_history.test.ts)
- Create automated unit tests for:
  - SKU standardization property mappings.
  - Automatic price change detection and history insertion.
  - Guaranteeing no log is created when non-price fields are updated.

## Verification Plan

### Automated Tests
- Run `npx vitest run src/__tests__/pim_price_history.test.ts` to verify functionality.
- Run `npm run build` to verify clean compilation.
