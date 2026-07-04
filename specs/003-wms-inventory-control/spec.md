# Feature Spec: WMS & Inventory Control (Phase 2)

**Status**: Specification | **Phase**: 2. WMS | **Author**: Antigravity

## Overview

Implementing strict inventory control rules. Direct manual stock quantity editing is prohibited; all adjustments must flow through verified document actions (GRN, GDN, Transfer, Audit Adjustment). Introduce the available stock equation to protect fulfillment pipelines.

## Requirements

### 1. Available Stock Formula
- Implement the available stock calculation formula:
  $$\text{Tồn khả dụng (available)} = \text{Tồn thực tế (quantity)} - \text{Tồn đã giữ (allocated)} - \text{Tồn chờ xử lý (pending\_processing)}$$
- The `warehouse_stock` schema must support columns: `quantity`, `allocated`, `pending_processing`, and `safety_stock`.

### 2. Stock Movement Documents
- Prevent direct updates of `quantity` in `warehouse_stock` unless accompanied by a `stock_movements` transaction log.
- Define movement types:
  - `in` (Good Receipt Note - GRN)
  - `out` (Good Delivery Note - GDN)
  - `transfer` (Stock Transfer between warehouses)
  - `audit` (Inventory Count Adjustments with reason and supervisor signature)

### 3. UI Enforcement
- Modify the WMS user interface to disable direct quantity input fields.
- Add forms/modals to create GRN, GDN, Transfer, and Audit Adjustment documents.

## Success Criteria
- Direct quantity overrides are disabled in the UI.
- All quantity changes log a corresponding entry in the `stock_movements` database table.
