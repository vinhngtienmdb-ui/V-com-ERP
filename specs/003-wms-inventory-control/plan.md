# Implementation Plan: WMS & Inventory Control (Phase 2)

**Branch**: `003-wms-inventory-control` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-wms-inventory-control/spec.md`

## Summary

This plan implements strict inventory control by updating database serialization for `warehouse_stock` (handling `allocated` and `pending_processing`), enforcing available stock checks during order allocation in `Orders.tsx`, and showing available stock clearly in `Warehouse.tsx`.

## Technical Context

- **Language/Version**: TypeScript 5.x / React 18 / Node.js 18+
- **Primary Dependencies**: `@supabase/supabase-js`
- **Storage**: PostgreSQL (Supabase database)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify that this plan adheres to the V-com-ERP Core Principles:
- [x] Detail views use fullscreen modal or slide-over layout (Principle I)
- [x] List tables use `ResizableTh` and `useTableColumns` for auto-saving sizes (Principle II)
- [x] Backend integrations are simulated on the client-side (Principle III)
- [x] TypeScript check and `npm run build` verify correctness (Principle IV)
- [x] Styles use modern aesthetics, gradients, and HSL variables (Principle V)

## Proposed Changes

### Database Mapping Hardening

#### [MODIFY] [dbService.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/services/dbService.ts)
- Add serialization and deserialization support for the new stock properties `allocated` and `pending_processing` in `warehouse_stock` mapper.

---

### OMS Allocation Logic

#### [MODIFY] [Orders.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Orders.tsx)
- In the order routing and allocation check blocks (lines 191 & 519), calculate available stock instead of raw quantity:
  `const qty = stockEntry ? (Number(stockEntry.quantity) - Number(stockEntry.allocated || 0) - Number(stockEntry.pending_processing || 0)) : 0;`

---

### WMS UI Presentation

#### [MODIFY] [Warehouse.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Warehouse.tsx)
- Add a new column `Tồn khả dụng` to the table layout inside the stock items list.
- Calculate and render the available quantity using the available stock formula: `quantity - allocated - pending_processing`.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify clean compilation.

### Manual Verification
- View stock in the warehouse tab and verify both real quantity and available quantity are listed.
