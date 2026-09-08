// Warehouse stock-voucher approval — pure, fail-closed validation.
//
// Pattern #89: `handleApproveVoucher` (Warehouse.tsx) previously:
//  - deducted outbound/transfer stock with `Math.max(0, onHand - qty)`, silently
//    DROPPING any shortfall (stock clamped to 0) while `inventory_logs` still
//    recorded the FULL requested qty as moved out → phantom shipments, undetectable
//    inventory loss (wrong COGS / valuation).
//  - when the source warehouse had NO such product (`sourceStock` null), the
//    deduction was SKIPPED but the `inventory_logs` row was still written → phantom
//    outbound movement with zero stock change (stock overstated).
//  - never re-validated `item.quantity` as positive in the approval path.
//
// Fix: validate the WHOLE voucher against a stock snapshot BEFORE any mutation.
// A voucher that would over-issue or move a non-existent product is REJECTED
// (fail-closed) — not partially fulfilled and not logged.
//
// Note: this validates against a snapshot read just before the writes, so it
// prevents the deterministic over-issuance. True read-write atomicity (two approvals
// racing) still needs a Supabase RPC / transaction — flagged for DBA (pattern #61/#84).

export type VoucherType = 'in' | 'out' | 'transfer';

export interface VoucherApprovalItem {
  product_id: string;
  quantity: unknown; // raw from DB/UI — validated here
}

export interface StockSnapshotRow {
  warehouse_id: string;
  product_id: string;
  quantity: unknown;
}

export type VoucherApprovalResult =
  | { ok: true }
  | {
      ok: false;
      code: 'INVALID_QUANTITY' | 'MISSING_SOURCE_STOCK' | 'INSUFFICIENT_SOURCE_STOCK';
      message: string;
      productId?: string;
    };

export function validateVoucherApproval(
  type: VoucherType,
  sourceWarehouseId: string | null | undefined,
  items: VoucherApprovalItem[],
  stockSnapshot: StockSnapshotRow[]
): VoucherApprovalResult {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      ok: false,
      code: 'INVALID_QUANTITY',
      message: 'Phiếu kho không có mặt hàng nào.',
    };
  }

  const stockMap = new Map<string, number>();
  for (const row of stockSnapshot || []) {
    const qty = Number(row.quantity);
    if (Number.isFinite(qty)) {
      stockMap.set(`${row.warehouse_id}::${row.product_id}`, qty);
    }
  }

  const needsSource = type === 'out' || type === 'transfer';

  for (const item of items) {
    const qty = Number(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return {
        ok: false,
        code: 'INVALID_QUANTITY',
        message: `Số lượng không hợp lệ cho mặt hàng ${item.product_id} (phải là số dương).`,
        productId: item.product_id,
      };
    }

    if (needsSource) {
      if (!sourceWarehouseId) {
        return {
          ok: false,
          code: 'MISSING_SOURCE_STOCK',
          message: 'Phiếu xuất/chuyển thiếu kho nguồn.',
          productId: item.product_id,
        };
      }
      const onHand = stockMap.get(`${sourceWarehouseId}::${item.product_id}`);
      if (onHand === undefined) {
        return {
          ok: false,
          code: 'MISSING_SOURCE_STOCK',
          message: `Mặt hàng ${item.product_id} không tồn tại trong kho nguồn.`,
          productId: item.product_id,
        };
      }
      if (onHand < qty) {
        return {
          ok: false,
          code: 'INSUFFICIENT_SOURCE_STOCK',
          message: `Không đủ tồn kho ${item.product_id}: còn ${onHand}, yêu cầu xuất ${qty}.`,
          productId: item.product_id,
        };
      }
    }
  }

  return { ok: true };
}
