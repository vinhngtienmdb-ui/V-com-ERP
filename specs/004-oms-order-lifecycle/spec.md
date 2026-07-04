# Feature Spec: OMS Order Lifecycle & Payment Ledger (Phase 2)

**Status**: Specification | **Phase**: 2. OMS | **Author**: Antigravity

## Overview

Upgrading the Order Management System (OMS) to strictly enforce the standard order lifecycle, lock order editing once paid, and record detailed financial transactions in a dedicated `payments` table.

## Requirements

### 1. Unified Lifecycles
- **Normal Orders**:
  `draft` -> `pending_payment` -> `paid` -> `confirmed` -> `allocated` -> `picking` -> `packed` -> `shipped` -> `delivered` -> `completed`
- **Group Buy Orders**:
  `group_open` -> `group_reached_minimum` -> `group_locked` -> `supplier_confirmed` -> `allocated` -> `picking` -> `delivered` -> `completed`

### 2. Lock Order Modifications
- Disable any order modification, address editing, item additions/removals, or warehouse routing changes in the UI once the order status transitions to `paid` or beyond.

### 3. Payment Ledger separation
- Create a dedicated `payments` database table.
- When an order is marked as `paid`, create a corresponding row in the `payments` table capturing: `order_id`, `amount`, `payment_method`, `transaction_id`, `payment_gateway`, `status`, and `created_at`.

## Success Criteria
- Modifying paid orders is disabled in the UI.
- Payments are recorded as rows in the `payments` table rather than just modifying the order's status flag.
