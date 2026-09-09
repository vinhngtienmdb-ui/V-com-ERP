import { supabase } from '../lib/supabase';
import { safeLocalStorage } from '../lib/storage';
import { createLogger } from '../lib/logger';
import { reportWriteFailure } from './writeFailure';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

// GĐ 1.5 — đường đi nóng: mọi màn hình đều đọc qua đây. Dùng mức `debug` để
// không ồn console production, nhưng vẫn tra được khi bật VITE_LOG_LEVEL=debug.
const log = createLogger('services/dbService');

// -----------------------------------------------------------------------------
// Relational Database Mapping Configuration & Helpers
// -----------------------------------------------------------------------------
export const RELATIONAL_TABLES = ['products', 'customers', 'orders', 'warehouse_stock', 'sellers', 'settlements', 'payments', 'product_price_history', 'partner_ledgers', 'loyalty_points_ledger', 'support_tickets', 'combos', 'combo_items', 'group_buy_sessions', 'group_buy_participants', 'f2b2b_sources', 'f2b2b_pool_orders', 'f2b2b_pool_participants',
'dropship_partners', 'dropship_listings', 'dropship_orders', 'dropship_margin_ledger',
'vcomm_hubs', 'hub_shipments',
'vxu_accounts', 'vxu_ledger', 'vxu_redemptions',
'stock_vouchers', 'stock_voucher_items', 'journal_entries', 'wallet_transactions', 'seller_transactions',
'acc_accounts', 'acc_currencies', 'acc_fx_rates', 'acc_periods', 'acc_vouchers', 'acc_voucher_lines', 'acc_audit_log', 'acc_units', 'acc_internal_txn', 'acc_eliminations', 'acc_elimination_lines', 'rev_contracts', 'rev_performance_obligations', 'rev_price_allocations', 'rev_recognition', 'fs_reports', 'fs_report_lines', 'fs_account_mappings',
'fixed_assets', 'fixed_asset_depreciation',
// GĐ 2.1 — Outbox: hàng đợi sự kiện. Đưa vào danh sách này để CRUD qua
// dbService tự map camelCase → snake_case (list/retry sự kiện `dead`).
'domain_events',
// GĐ 2.6 — audit trail. Trước đây KHÔNG nằm trong danh sách này → mọi bản ghi
// bị nhét nguyên cục vào cột `data` JSONB, không query được theo action/email.
// Đưa vào để ghi đúng cột (cần kèm 3 nhánh bên dưới, xem từng chỗ).
'admin_audit_logs', 'tenant_audit_logs'];

export function getRealTableName(tableName: string): string {
  if (tableName === 'wallet_transactions') return 'seller_transactions';
  return tableName;
}

export function mapJsFieldToDbColumn(tableName: string, field: string): string {
  if (field === 'id') return 'id';
  if (field === 'tenantId') return 'tenant_id';
  
  if (RELATIONAL_TABLES.includes(tableName)) {
    if (tableName === 'products') {
      if (field === 'imageUrl' || field === 'image') return 'image_url';
      if (field === 'createdAt') return 'created_at';
      if (field === 'costPrice') return 'cost_price';
      if (field === 'hiddenCosts') return 'hidden_costs';
      if (field === 'sellerName') return 'seller_name';
      if (field === 'videoUrl') return 'video_url';
      if (field === 'barcode') return 'barcode';
      if (field === 'vatRate') return 'vat_rate';
      if (field === 'specification') return 'specification';
      if (field === 'supplierId') return 'supplier_id';
    } else if (tableName === 'product_price_history') {
      if (field === 'productId') return 'product_id';
      if (field === 'oldPrice') return 'old_price';
      if (field === 'newPrice') return 'new_price';
      if (field === 'oldCostPrice') return 'old_cost_price';
      if (field === 'newCostPrice') return 'new_cost_price';
      if (field === 'changedBy') return 'changed_by';
      if (field === 'changedAt') return 'changed_at';
    } else if (tableName === 'partner_ledgers') {
      if (field === 'partnerId') return 'partner_id';
      if (field === 'partnerType') return 'partner_type';
      if (field === 'refType') return 'ref_type';
      if (field === 'refId') return 'ref_id';
      if (field === 'createdAt') return 'created_at';
    } else if (tableName === 'loyalty_points_ledger') {
      if (field === 'customerId') return 'customer_id';
      if (field === 'pointsChange') return 'points_change';
      if (field === 'transactionType') return 'transaction_type';
      if (field === 'referenceType') return 'reference_type';
      if (field === 'referenceId') return 'reference_id';
      if (field === 'createdAt') return 'created_at';
    } else if (tableName === 'support_tickets') {
      if (field === 'customerId') return 'customer_id';
      if (field === 'customerName') return 'customer_name';
      if (field === 'slaDeadline') return 'sla_deadline';
      if (field === 'resolvedAt') return 'resolved_at';
      if (field === 'createdAt') return 'created_at';
    } else if (tableName === 'customers') {
      if (field === 'createdAt') return 'created_at';
    } else if (tableName === 'orders') {
      if (field === 'customerId') return 'customer_id';
      if (field === 'customerName') return 'customer_name';
      if (field === 'createdAt') return 'created_at';
      if (field === 'sellerId') return 'seller_id';
      if (field === 'parentOrderId') return 'parent_order_id';
      if (field === 'commissionFee') return 'commission_fee';
      if (field === 'settlementStatus') return 'settlement_status';
      if (field === 'paymentStatus') return 'payment_status';
      if (field === 'paymentMethod') return 'payment_method';
      if (field === 'settlementId') return 'settlement_id';
    } else if (tableName === 'warehouse_stock') {
      if (field === 'storeId' || field === 'warehouseId') return 'warehouse_id';
      if (field === 'productId' || field === 'materialId') return 'product_id';
      if (field === 'productName' || field === 'materialName') return 'product_name';
      if (field === 'safetyStock') return 'safety_stock';
      if (field === 'allocated') return 'allocated';
      if (field === 'pendingProcessing') return 'pending_processing';
      if (field === 'updatedAt') return 'updated_at';
    } else if (tableName === 'sellers') {
      if (field === 'totalProducts') return 'total_products';
      if (field === 'walletBalance') return 'wallet_balance';
      if (field === 'taxCode') return 'tax_code';
      if (field === 'identityCard') return 'identity_card';
      if (field === 'commissionRate') return 'commission_rate';
      if (field === 'joinDate') return 'join_date';
      if (field === 'onboardingStep') return 'onboarding_step';
      if (field === 'partnerType') return 'partner_type';
      if (field === 'activeModules') return 'active_modules';
      if (field === 'businessLicenseUrl') return 'business_license_url';
      if (field === 'idCardFrontUrl') return 'id_card_front_url';
      if (field === 'idCardBackUrl') return 'id_card_back_url';
    } else if (tableName === 'settlements') {
      if (field === 'sellerId') return 'seller_id';
      if (field === 'sellerName') return 'seller_name';
      if (field === 'periodStart') return 'period_start';
      if (field === 'periodEnd') return 'period_end';
      if (field === 'totalSales') return 'total_sales';
      if (field === 'commissionFee') return 'commission_fee';
      if (field === 'shippingFee') return 'shipping_fee';
      if (field === 'netPayout') return 'net_payout';
      if (field === 'paidAt') return 'paid_at';
      if (field === 'createdAt') return 'created_at';
      if (field === 'updatedAt') return 'updated_at';
    } else if (tableName === 'payments') {
      if (field === 'orderId') return 'order_id';
      if (field === 'paymentMethod') return 'payment_method';
      if (field === 'transactionId') return 'transaction_id';
      if (field === 'paymentGateway') return 'payment_gateway';
      if (field === 'createdAt') return 'created_at';
    } else if (tableName === 'admin_audit_logs' || tableName === 'tenant_audit_logs') {
      // GĐ 2.6 — code cũ sắp xếp/lọc theo 'timestamp', nhưng cột thật là
      // `created_at`. Map ở đây để các truy vấn CŨ không đánh sập SQL.
      if (field === 'timestamp') return 'created_at';
      if (field === 'createdAt') return 'created_at';
      if (field === 'userId') return 'user_id';
      if (field === 'ipAddress') return 'ip_address';
      if (field === 'userAgent') return 'user_agent';
    }
    // Default snake_case fallback for other fields in relational tables
    return field.replace(/([A-Z])/g, "_$1").toLowerCase();
  }
  
  // Non-relational tables
  return `data->>${field}`;
}

export function toRelationalPayload(tableName: string, docId: string, tenantId: string | null, jsData: any) {
  const payload: any = {
    id: docId,
    tenant_id: tenantId || jsData.tenantId || 'tenant-vcomm-prod-01'
  };

  if (tableName === 'products') {
    payload.name = jsData.name || '';
    payload.description = jsData.description || null;
    payload.price = Number(jsData.price) || 0.00;
    payload.sku = jsData.sku || null;
    payload.category = jsData.category || null;
    payload.image_url = jsData.image || jsData.imageUrl || jsData.image_url || null;
    payload.image_urls = jsData.image_urls ?? (Array.isArray(jsData.images) ? jsData.images : null);
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    
    // Add missing relational fields
    payload.brand = jsData.brand || null;
    payload.stock = Number(jsData.stock) || 0;
    payload.cost_price = Number(jsData.costPrice) || 0.00;
    payload.hidden_costs = Number(jsData.hiddenCosts) || 0.00;
    payload.margin = Number(jsData.margin) || 0.00;
    payload.profit = Number(jsData.profit) || 0.00;
    payload.seller_name = jsData.sellerName || null;
    payload.weight = jsData.weight || null;
    payload.dimensions = jsData.dimensions || null;
    payload.video_url = jsData.videoUrl || null;
    payload.images = Array.isArray(jsData.images) ? jsData.images : (jsData.images ? [jsData.images] : null);
    payload.specs = jsData.specs || null;
    payload.barcode = jsData.barcode || null;
    payload.vat_rate = Number(jsData.vatRate || jsData.vat_rate) || 0.00;
    payload.specification = jsData.specification || null;
    payload.supplier_id = jsData.supplierId || jsData.supplier_id || null;
    
    if (jsData.description_embedding) {
      payload.description_embedding = jsData.description_embedding;
    }
  } else if (tableName === 'customers') {
    payload.name = jsData.name || '';
    payload.email = jsData.email || null;
    payload.phone = jsData.phone || null;
    payload.address = jsData.address || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'orders') {
    payload.customer_id = jsData.customerId || jsData.customer_id || null;
    payload.customer_name = jsData.customerName || jsData.customer_name || 'KHLE';
    payload.total = Number(jsData.total) || 0.00;
    payload.status = jsData.status || 'pending';
    payload.items = jsData.items || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.routed_warehouse = jsData.routedWarehouse || null;
    payload.einvoice_status = jsData.einvoiceStatus || 'pending';
    payload.einvoice_xml = jsData.einvoiceXml || null;
    payload.einvoice_lookup_code = jsData.einvoiceLookupCode || null;
    payload.einvoice_signed_at = jsData.einvoiceSignedAt || null;
    // Các cột dưới thuộc migration 015 (TT 91/2026 Điều 10). Chỉ ghi khi có giá trị
    // thực — tránh đẩy cột NULL lên Supabase khi migration chưa được apply (postgrest
    // sẽ ném "Could not find column ... in schema cache"). Khi migration đã chạy, ghi
    // bình thường.
    if (jsData.einvoiceErrorFlow != null) payload.einvoice_error_flow = jsData.einvoiceErrorFlow;
    if (jsData.einvoiceErrorReason != null) payload.einvoice_error_reason = jsData.einvoiceErrorReason;
    if (jsData.einvoiceReplacesInvoiceNo != null) payload.einvoice_replaces_invoice_no = jsData.einvoiceReplacesInvoiceNo;
    if (jsData.einvoiceAdjustedAt != null) payload.einvoice_adjusted_at = jsData.einvoiceAdjustedAt;
    if (jsData.einvoiceConsolidationRef != null) payload.einvoice_consolidation_ref = jsData.einvoiceConsolidationRef;
    if (jsData.einvoiceErrorHandledAt != null) payload.einvoice_error_handled_at = jsData.einvoiceErrorHandledAt;
    payload.carrier = jsData.carrier || null;
    payload.tracking = jsData.tracking || null;
    payload.shipping_cost = Number(jsData.shippingCost || jsData.shipping_cost) || 0.00;
    payload.seller_id = jsData.sellerId || jsData.seller_id || null;
    payload.parent_order_id = jsData.parentOrderId || jsData.parent_order_id || null;
    payload.commission_fee = Number(jsData.commissionFee || jsData.commission_fee) || 0.00;
    payload.settlement_status = jsData.settlementStatus || jsData.settlement_status || 'pending';
    payload.settlement_id = jsData.settlementId || jsData.settlement_id || null;
    payload.payment_status = jsData.paymentStatus || jsData.payment_status || 'unpaid';
    payload.payment_method = jsData.paymentMethod || jsData.payment_method || 'cod';
    payload.channel = jsData.channel || null;
    payload.transaction_id = jsData.transactionId || jsData.transaction_id || null;
    payload.delivered_at = jsData.deliveredAt || jsData.delivered_at || null;
  } else if (tableName === 'warehouse_stock') {
    payload.warehouse_id = jsData.warehouseId || jsData.warehouse_id || jsData.storeId || jsData.store_id || null;
    payload.product_id = jsData.productId || jsData.materialId || jsData.product_id || null;
    payload.product_name = jsData.productName || jsData.materialName || jsData.product_name || null;
    payload.quantity = Number(jsData.quantity) || 0.00;
    payload.safety_stock = Number(jsData.safetyStock || jsData.safety_stock) || 0.00;
    payload.allocated = Number(jsData.allocated) || 0.00;
    payload.pending_processing = Number(jsData.pendingProcessing || jsData.pending_processing) || 0.00;
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'sellers') {
    payload.name = jsData.name || '';
    payload.email = jsData.email || null;
    payload.phone = jsData.phone || null;
    payload.total_products = Number(jsData.totalProducts) || 0;
    payload.rating = Number(row => row.rating) || 0;
    payload.gmv = Number(jsData.gmv) || 0;
    payload.wallet_balance = Number(jsData.walletBalance) || 0;
    payload.status = jsData.status || 'pending';
    payload.tax_code = jsData.taxCode || null;
    payload.identity_card = jsData.identityCard || null;
    payload.address = jsData.address || null;
    payload.representative = jsData.representative || null;
    payload.commission_rate = Number(jsData.commissionRate) || 0;
    payload.join_date = jsData.joinDate || jsData.join_date || new Date().toISOString();
    payload.onboarding_step = jsData.onboardingStep || jsData.onboarding_step || 'registration';
    payload.partner_type = jsData.partnerType || jsData.partner_type || 'dealer';
    payload.active_modules = jsData.activeModules || jsData.active_modules || [];
    payload.business_license_url = jsData.businessLicenseUrl || jsData.business_license_url || null;
    payload.id_card_front_url = jsData.idCardFrontUrl || jsData.id_card_front_url || null;
    payload.id_card_back_url = jsData.idCardBackUrl || jsData.id_card_back_url || null;
  } else if (tableName === 'settlements') {
    payload.seller_id = jsData.sellerId || jsData.seller_id || null;
    payload.seller_name = jsData.sellerName || jsData.seller_name || null;
    payload.period_start = jsData.periodStart || jsData.period_start || new Date().toISOString();
    payload.period_end = jsData.periodEnd || jsData.period_end || new Date().toISOString();
    payload.total_sales = Number(jsData.totalSales || jsData.total_sales) || 0.00;
    payload.commission_fee = Number(jsData.commissionFee || jsData.commission_fee) || 0.00;
    payload.shipping_fee = Number(jsData.shippingFee || jsData.shipping_fee) || 0.00;
    payload.net_payout = Number(jsData.netPayout || jsData.net_payout) || 0.00;
    payload.status = jsData.status || 'pending';
    payload.paid_at = jsData.paidAt || jsData.paid_at || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'payments') {
    payload.order_id = jsData.orderId || null;
    payload.amount = Number(jsData.amount) || 0.00;
    payload.payment_method = jsData.paymentMethod || null;
    payload.transaction_id = jsData.transactionId || null;
    payload.payment_gateway = jsData.paymentGateway || null;
    payload.status = jsData.status || 'success';
    payload.created_at = jsData.createdAt || new Date().toISOString();
  } else if (tableName === 'product_price_history') {
    payload.product_id = jsData.productId || null;
    payload.old_price = Number(jsData.oldPrice || 0) || 0.00;
    payload.new_price = Number(jsData.newPrice || 0) || 0.00;
    payload.old_cost_price = Number(jsData.oldCostPrice || 0) || 0.00;
    payload.new_cost_price = Number(jsData.newCostPrice || 0) || 0.00;
    payload.changed_by = jsData.changedBy || 'system';
    payload.changed_at = jsData.changedAt || new Date().toISOString();
  } else if (tableName === 'partner_ledgers') {
    payload.partner_id = jsData.partnerId || null;
    payload.partner_type = jsData.partnerType || null;
    payload.ref_type = jsData.refType || null;
    payload.ref_id = jsData.refId || null;
    payload.debit = Number(jsData.debit || 0) || 0.00;
    payload.credit = Number(jsData.credit || 0) || 0.00;
    payload.balance = Number(jsData.balance || 0) || 0.00;
    payload.created_at = jsData.createdAt || new Date().toISOString();
  } else if (tableName === 'loyalty_points_ledger') {
    payload.customer_id = jsData.customerId || null;
    payload.points_change = Number(jsData.pointsChange || 0) || 0;
    payload.transaction_type = jsData.transactionType || null;
    payload.description = jsData.description || null;
    payload.reference_type = jsData.referenceType || null;
    payload.reference_id = jsData.referenceId || null;
    payload.created_at = jsData.createdAt || new Date().toISOString();
  } else if (tableName === 'support_tickets') {
    payload.customer_id = jsData.customerId || null;
    payload.customer_name = jsData.customerName || null;
    payload.subject = jsData.subject || null;
    payload.status = jsData.status || 'open';
    payload.priority = jsData.priority || 'medium';
    payload.type = jsData.type || 'inquiry';
    payload.sla_deadline = jsData.slaDeadline || null;
    payload.resolved_at = jsData.resolvedAt || null;
    payload.created_at = jsData.createdAt || new Date().toISOString();
  } else if (tableName === 'combos') {
    payload.name = jsData.name || '';
    payload.description = jsData.description || null;
    payload.price = Number(jsData.price || 0) || 0.00;
    payload.cost_price = Number(jsData.costPrice || jsData.cost_price || 0) || 0.00;
    payload.status = jsData.status || 'active';
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'combo_items') {
    payload.combo_id = jsData.comboId || jsData.combo_id || null;
    payload.product_id = jsData.productId || jsData.product_id || null;
    payload.quantity = Number(jsData.quantity) || 1;
  } else if (tableName === 'group_buy_sessions') {
    // SỬA (spec 016): trước đây map sang min_qty / current_qty / end_time —
    // các cột này KHÔNG tồn tại trong DDL (005 tạo min_participants /
    // current_participants / expires_at), khiến ghi lỗi hoặc mất dữ liệu.
    // Canonical = tên trong DDL.
    payload.combo_id = jsData.comboId || jsData.combo_id || null;
    payload.product_id = jsData.productId || jsData.product_id || null;
    payload.status = jsData.status || 'group_open';
    payload.min_participants = Number(jsData.minParticipants || jsData.min_participants) || 2;
    payload.current_participants = Number(jsData.currentParticipants || jsData.current_participants) || 0;
    payload.unit_price = Number(jsData.unitPrice || jsData.unit_price) || 0;
    payload.expires_at = jsData.expiresAt || jsData.expires_at || null;
    payload.leader_id = jsData.leaderId || jsData.leader_id || null;
    payload.cancelled_reason = jsData.cancelledReason || jsData.cancelled_reason || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'group_buy_participants') {
    payload.session_id = jsData.sessionId || jsData.session_id || null;
    payload.customer_id = jsData.customerId || jsData.customer_id || null;
    payload.customer_name = jsData.customerName || jsData.customer_name || null;
    payload.quantity = Number(jsData.quantity) || 1;
    payload.unit_price = Number(jsData.unitPrice || jsData.unit_price) || 0;
    payload.amount = Number(jsData.amount) || 0;
    payload.status = jsData.status || 'joined';
    payload.payment_ref = jsData.paymentRef || jsData.payment_ref || null;
    payload.order_id = jsData.orderId || jsData.order_id || null;
    payload.joined_at = jsData.joinedAt || jsData.joined_at || new Date().toISOString();
  } else if (tableName === 'f2b2b_sources') {
    payload.code = jsData.code || '';
    payload.name = jsData.name || '';
    payload.type = jsData.type || 'farm';
    payload.tax_code = jsData.taxCode || jsData.tax_code || null;
    payload.contact_name = jsData.contactName || jsData.contact_name || null;
    payload.phone = jsData.phone || null;
    payload.email = jsData.email || null;
    payload.province_code = jsData.provinceCode || jsData.province_code || null;
    payload.province_name = jsData.provinceName || jsData.province_name || null;
    payload.address = jsData.address || null;
    payload.capacity_per_cycle = Number(jsData.capacityPerCycle || jsData.capacity_per_cycle) || 0;
    payload.capacity_unit = jsData.capacityUnit || jsData.capacity_unit || 'kg';
    payload.lead_time_days = Number(jsData.leadTimeDays || jsData.leadTime_days) || 7;
    payload.certifications = jsData.certifications || [];
    payload.rating = Number(jsData.rating) || 0;
    payload.total_completed_pools = Number(jsData.totalCompletedPools || jsData.total_completed_pools) || 0;
    payload.status = jsData.status || 'active';
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'f2b2b_pool_orders') {
    payload.code = jsData.code || '';
    payload.source_id = jsData.sourceId || jsData.source_id || null;
    payload.product_id = jsData.productId || jsData.product_id || null;
    payload.product_name = jsData.productName || jsData.product_name || '';
    payload.unit = jsData.unit || 'kg';
    payload.target_qty = Number(jsData.targetQty || jsData.target_qty) || 0;
    payload.min_qty = Number(jsData.minQty || jsData.min_qty) || 0;
    payload.pooled_qty = Number(jsData.pooledQty || jsData.pooled_qty) || 0;
    payload.price_tiers = jsData.priceTiers || jsData.price_tiers || [];
    payload.base_unit_price = Number(jsData.baseUnitPrice || jsData.base_unit_price) || 0;
    payload.final_unit_price = jsData.finalUnitPrice ?? jsData.final_unit_price ?? null;
    payload.status = jsData.status || 'draft';
    payload.open_at = jsData.openAt || jsData.open_at || null;
    payload.close_at = jsData.closeAt || jsData.close_at || null;
    payload.expected_delivery_at = jsData.expectedDeliveryAt || jsData.expected_delivery_at || null;
    payload.cancelled_reason = jsData.cancelledReason || jsData.cancelled_reason || null;
    payload.created_by = jsData.createdBy || jsData.created_by || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'f2b2b_pool_participants') {
    payload.pool_id = jsData.poolId || jsData.pool_id || null;
    payload.buyer_id = jsData.buyerId || jsData.buyer_id || null;
    payload.buyer_name = jsData.buyerName || jsData.buyer_name || null;
    payload.committed_qty = Number(jsData.committedQty || jsData.committed_qty) || 0;
    payload.unit_price = Number(jsData.unitPrice || jsData.unit_price) || 0;
    payload.amount = Number(jsData.amount) || 0;
    payload.delivery_address = jsData.deliveryAddress || jsData.delivery_address || null;
    payload.delivery_province_code = jsData.deliveryProvinceCode || jsData.delivery_province_code || null;
    payload.status = jsData.status || 'committed';
    payload.payment_ref = jsData.paymentRef || jsData.payment_ref || null;
    payload.joined_at = jsData.joinedAt || jsData.joined_at || new Date().toISOString();
  } else if (tableName === 'dropship_partners') {
    payload.code = jsData.code || '';
    payload.name = jsData.name || '';
    payload.shop_name = jsData.shopName || jsData.shop_name || null;
    payload.channels = jsData.channels || [];
    payload.tax_code = jsData.taxCode || jsData.tax_code || null;
    payload.contact_name = jsData.contactName || jsData.contact_name || null;
    payload.phone = jsData.phone || null;
    payload.email = jsData.email || null;
    payload.address = jsData.address || null;
    payload.vneid_verified = Boolean(jsData.vneidVerified ?? jsData.vneid_verified ?? false);
    payload.vneid_linked_at = jsData.vneidLinkedAt || jsData.vneid_linked_at || null;
    payload.margin_split = Number(jsData.marginSplit ?? jsData.margin_split ?? 0.8);
    payload.bank_name = jsData.bankName || jsData.bank_name || null;
    payload.bank_account = jsData.bankAccount || jsData.bank_account || null;
    payload.bank_account_name = jsData.bankAccountName || jsData.bank_account_name || null;
    payload.outstanding_cod = Number(jsData.outstandingCod || jsData.outstanding_cod) || 0;
    payload.status = jsData.status || 'pending';
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'dropship_listings') {
    payload.partner_id = jsData.partnerId || jsData.partner_id || null;
    payload.product_id = jsData.productId || jsData.product_id || '';
    payload.product_name = jsData.productName || jsData.product_name || '';
    payload.external_sku = jsData.externalSku || jsData.external_sku || null;
    payload.channel = jsData.channel || 'other';
    payload.external_url = jsData.externalUrl || jsData.external_url || null;
    payload.base_cost = Number(jsData.baseCost || jsData.base_cost) || 0;
    payload.listed_price = Number(jsData.listedPrice || jsData.listed_price) || 0;
    payload.min_selling_price = Number(jsData.minSellingPrice || jsData.min_selling_price) || 0;
    payload.shipping_fee = Number(jsData.shippingFee || jsData.shipping_fee) || 0;
    payload.stock_synced = Number(jsData.stockSynced || jsData.stock_synced) || 0;
    payload.synced_at = jsData.syncedAt || jsData.synced_at || null;
    payload.status = jsData.status || 'draft';
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'dropship_orders') {
    payload.partner_id = jsData.partnerId || jsData.partner_id || null;
    payload.code = jsData.code || '';
    payload.external_order_code = jsData.externalOrderCode || jsData.external_order_code || '';
    payload.channel = jsData.channel || 'other';
    payload.items = jsData.items || [];
    payload.item_count = Number(jsData.itemCount || jsData.item_count) || (jsData.items?.length || 0);
    payload.quantity = Number(jsData.quantity) || 0;
    payload.buyer_name = jsData.buyerName || jsData.buyer_name || null;
    payload.buyer_phone = jsData.buyerPhone || jsData.buyer_phone || null;
    payload.shipping_address = jsData.shippingAddress || jsData.shipping_address || null;
    payload.shipping_province_code = jsData.shippingProvinceCode || jsData.shipping_province_code || null;
    payload.cod_amount = Number(jsData.codAmount || jsData.cod_amount) || 0;
    payload.total_cost = Number(jsData.totalCost || jsData.total_cost) || 0;
    payload.shipping_fee = Number(jsData.shippingFee || jsData.shipping_fee) || 0;
    payload.gross_margin = Number(jsData.grossMargin || jsData.gross_margin) || 0;
    payload.partner_margin = Number(jsData.partnerMargin || jsData.partner_margin) || 0;
    payload.vcomm_margin = Number(jsData.vcommMargin || jsData.vcomm_margin) || 0;
    payload.carrier = jsData.carrier || null;
    payload.tracking_code = jsData.trackingCode || jsData.tracking_code || null;
    payload.status = jsData.status || 'pending';
    payload.reserved_at = jsData.reservedAt || jsData.reserved_at || null;
    payload.shipped_at = jsData.shippedAt || jsData.shipped_at || null;
    payload.delivered_at = jsData.deliveredAt || jsData.delivered_at || null;
    payload.settled_at = jsData.settledAt || jsData.settled_at || null;
    payload.cancelled_at = jsData.cancelledAt || jsData.cancelled_at || null;
    payload.cancelled_reason = jsData.cancelledReason || jsData.cancelled_reason || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'dropship_margin_ledger') {
    payload.partner_id = jsData.partnerId || jsData.partner_id || null;
    payload.order_id = jsData.orderId || jsData.order_id || null;
    payload.type = jsData.type || 'accrual';
    payload.amount = Number(jsData.amount) || 0;
    payload.note = jsData.note || null;
    payload.status = jsData.status || 'pending';
    payload.period = jsData.period || null;
    payload.paid_at = jsData.paidAt || jsData.paid_at || null;
    payload.payout_ref = jsData.payoutRef || jsData.payout_ref || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'vcomm_hubs') {
    payload.code = jsData.code || '';
    payload.name = jsData.name || '';
    payload.type = jsData.type || 'standard';
    payload.province_code = jsData.provinceCode || jsData.province_code || null;
    payload.province_name = jsData.provinceName || jsData.province_name || null;
    payload.address = jsData.address || null;
    payload.latitude = jsData.latitude != null ? Number(jsData.latitude) : null;
    payload.longitude = jsData.longitude != null ? Number(jsData.longitude) : null;
    payload.capacity = Number(jsData.capacity) || 100;
    payload.current_load = Number(jsData.currentLoad || jsData.current_load) || 0;
    payload.open_24_7 = Boolean(jsData.open247 ?? jsData.open_24_7 ?? false);
    payload.operating_hours = jsData.operatingHours || jsData.operating_hours || null;
    payload.manager_name = jsData.managerName || jsData.manager_name || null;
    payload.phone = jsData.phone || null;
    payload.status = jsData.status || 'active';
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'hub_shipments') {
    payload.hub_id = jsData.hubId || jsData.hub_id || null;
    payload.order_id = jsData.orderId || jsData.order_id || null;
    payload.tracking_code = jsData.trackingCode || jsData.tracking_code || '';
    payload.pickup_code = jsData.pickupCode || jsData.pickup_code || null;
    payload.qr_secret = jsData.qrSecret || jsData.qr_secret || null;
    payload.qr_issued_at = jsData.qrIssuedAt || jsData.qr_issued_at || null;
    payload.recipient_name = jsData.recipientName || jsData.recipient_name || null;
    payload.recipient_phone = jsData.recipientPhone || jsData.recipient_phone || null;
    payload.cod_amount = Number(jsData.codAmount || jsData.cod_amount) || 0;
    payload.insurance_fee = Number(jsData.insuranceFee || jsData.insurance_fee) || 0;
    payload.penalty_amount = Number(jsData.penaltyAmount || jsData.penalty_amount) || 0;
    payload.inspection_ok = jsData.inspectionOk ?? jsData.inspection_ok ?? null;
    payload.refunded_amount = Number(jsData.refundedAmount || jsData.refunded_amount) || 0;
    payload.status = jsData.status || 'in_transit';
    payload.arrived_at = jsData.arrivedAt || jsData.arrived_at || null;
    payload.ready_at = jsData.readyAt || jsData.ready_at || null;
    payload.reminder_48h_at = jsData.reminder48hAt || jsData.reminder_48h_at || null;
    payload.reminder_72h_at = jsData.reminder72hAt || jsData.reminder_72h_at || null;
    payload.picked_up_at = jsData.pickedUpAt || jsData.picked_up_at || null;
    payload.expired_at = jsData.expiredAt || jsData.expired_at || null;
    payload.returned_at = jsData.returnedAt || jsData.returned_at || null;
    payload.cancelled_reason = jsData.cancelledReason || jsData.cancelled_reason || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'vxu_accounts') {
    payload.customer_id = jsData.customerId || jsData.customer_id || '';
    payload.balance = Number(jsData.balance) || 0;
    payload.lifetime_earned = Number(jsData.lifetimeEarned || jsData.lifetime_earned) || 0;
    payload.lifetime_spend_vnd = Number(jsData.lifetimeSpendVnd || jsData.lifetime_spend_vnd) || 0;
    payload.lifetime_orders = Number(jsData.lifetimeOrders || jsData.lifetime_orders) || 0;
    payload.tier = jsData.tier || 'dong';
    payload.tier_changed_at = jsData.tierChangedAt || jsData.tier_changed_at || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'vxu_ledger') {
    payload.transaction_id = jsData.transactionId || jsData.transaction_id || '';
    payload.side = jsData.side || 'debit';
    payload.account = jsData.account || '';
    payload.counter_account = jsData.counterAccount || jsData.counter_account || '';
    payload.customer_id = jsData.customerId || jsData.customer_id || null;
    payload.amount = Number(jsData.amount) || 0;
    payload.type = jsData.type || 'earn';
    payload.reference_type = jsData.referenceType || jsData.reference_type || null;
    payload.reference_id = jsData.referenceId || jsData.reference_id || null;
    payload.note = jsData.note || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'vxu_redemptions') {
    payload.customer_id = jsData.customerId || jsData.customer_id || '';
    payload.voucher_code = jsData.voucherCode || jsData.voucher_code || '';
    payload.template_code = jsData.templateCode || jsData.template_code || '';
    payload.vxu_cost = Number(jsData.vxuCost || jsData.vxu_cost) || 0;
    payload.voucher_value_vnd = Number(jsData.voucherValueVnd || jsData.voucher_value_vnd) || 0;
    payload.required_tier = jsData.requiredTier || jsData.required_tier || 'dong';
    payload.min_spend_vnd = Number(jsData.minSpendVnd || jsData.min_spend_vnd) || 0;
    payload.status = jsData.status || 'issued';
    payload.transaction_id = jsData.transactionId || jsData.transaction_id || null;
    payload.order_id = jsData.orderId || jsData.order_id || null;
    payload.used_at = jsData.usedAt || jsData.used_at || null;
    payload.expires_at = jsData.expiresAt || jsData.expires_at || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'stock_vouchers') {
    payload.code = jsData.code || '';
    payload.type = jsData.type || '';
    payload.status = jsData.status || 'draft';
    payload.source_warehouse_id = jsData.sourceWarehouseId || jsData.source_warehouse_id || null;
    payload.target_warehouse_id = jsData.targetWarehouseId || jsData.target_warehouse_id || null;
    payload.created_by = jsData.createdBy || jsData.created_by || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.approved_by = jsData.approvedBy || jsData.approved_by || null;
    payload.approved_at = jsData.approvedAt || jsData.approved_at || null;
  } else if (tableName === 'stock_voucher_items') {
    payload.voucher_id = jsData.voucherId || jsData.voucher_id || null;
    payload.product_id = jsData.productId || jsData.product_id || null;
    payload.quantity = Number(jsData.quantity) || 0;
  } else if (tableName === 'acc_accounts') {
    payload.code = jsData.code || '';
    payload.name = jsData.name || '';
    payload.level = Number(jsData.level) || 1;
    payload.parent_code = jsData.parentCode || jsData.parent_code || null;
    payload.account_type = jsData.accountType || jsData.account_type || 'asset';
    payload.balance_side = jsData.balanceSide || jsData.balance_side || 'debit';
    payload.is_system = jsData.isSystem ?? jsData.is_system ?? false;
    payload.regulation_ref = jsData.regulationRef || jsData.regulation_ref || null;
    payload.is_active = jsData.isActive ?? jsData.is_active ?? true;
    payload.track_partner = jsData.trackPartner ?? jsData.track_partner ?? false;
    payload.track_unit = jsData.trackUnit ?? jsData.track_unit ?? false;
    payload.is_intercompany = jsData.isIntercompany ?? jsData.is_intercompany ?? false;
    payload.note = jsData.note || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'acc_currencies') {
    payload.code = jsData.code || '';
    payload.name = jsData.name || '';
    payload.symbol = jsData.symbol || null;
    payload.is_base = jsData.isBase ?? jsData.is_base ?? false;
    payload.is_active = jsData.isActive ?? jsData.is_active ?? true;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'acc_fx_rates') {
    payload.currency_code = jsData.currencyCode || jsData.currency_code || 'VND';
    payload.rate_date = jsData.rateDate || jsData.rate_date || new Date().toISOString().slice(0, 10);
    payload.booked_rate = Number(jsData.bookedRate || jsData.booked_rate) || 1;
    payload.actual_rate = jsData.actualRate ?? jsData.actual_rate ?? null;
    payload.tolerance_pct = jsData.tolerancePct ?? jsData.tolerance_pct ?? 1.0;
    payload.note = jsData.note || null;
    payload.created_by = jsData.createdBy || jsData.created_by || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'acc_periods') {
    payload.period_year = Number(jsData.periodYear || jsData.period_year) || 0;
    payload.period_no = jsData.periodNo ?? jsData.period_no ?? null;
    payload.start_date = jsData.startDate || jsData.start_date || new Date().toISOString().slice(0, 10);
    payload.end_date = jsData.endDate || jsData.end_date || new Date().toISOString().slice(0, 10);
    payload.status = jsData.status || 'open';
    payload.closed_at = jsData.closedAt || jsData.closed_at || null;
    payload.closed_by = jsData.closedBy || jsData.closed_by || null;
    payload.closing_hash = jsData.closingHash || jsData.closing_hash || null;
    payload.closing_note = jsData.closingNote || jsData.closing_note || null;
    payload.exported_at = jsData.exportedAt || jsData.exported_at || null;
    payload.exported_by = jsData.exportedBy || jsData.exported_by || null;
    payload.export_format = jsData.exportFormat || jsData.export_format || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'acc_vouchers') {
    payload.voucher_no = jsData.voucherNo || jsData.voucher_no || '';
    payload.voucher_type = jsData.voucherType || jsData.voucher_type || 'PKT';
    payload.voucher_date = jsData.voucherDate || jsData.voucher_date || new Date().toISOString().slice(0, 10);
    payload.post_date = jsData.postDate || jsData.post_date || payload.voucher_date;
    payload.period_id = jsData.periodId || jsData.period_id || null;
    payload.unit_id = jsData.unitId || jsData.unit_id || null;
    payload.currency_code = jsData.currencyCode || jsData.currency_code || 'VND';
    payload.fx_rate = Number(jsData.fxRate || jsData.fx_rate) || 1;
    payload.description = jsData.description || '';
    payload.attachments = jsData.attachments || null;
    payload.status = jsData.status || 'draft';
    payload.reversal_of = jsData.reversalOf || jsData.reversal_of || null;
    payload.reversal_reason = jsData.reversalReason || jsData.reversal_reason || null;
    payload.source_type = jsData.sourceType || jsData.source_type || null;
    payload.source_id = jsData.sourceId || jsData.source_id || null;
    payload.created_by = jsData.createdBy || jsData.created_by || null;
    payload.posted_by = jsData.postedBy || jsData.posted_by || null;
    payload.posted_at = jsData.postedAt || jsData.posted_at || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'acc_voucher_lines') {
    payload.voucher_id = jsData.voucherId || jsData.voucher_id || null;
    payload.line_no = Number(jsData.lineNo || jsData.line_no) || 1;
    payload.account_code = jsData.accountCode || jsData.account_code || '';
    payload.description = jsData.description || null;
    payload.debit = Number(jsData.debit) || 0;
    payload.credit = Number(jsData.credit) || 0;
    payload.debit_orig = Number(jsData.debitOrig || jsData.debit_orig) || 0;
    payload.credit_orig = Number(jsData.creditOrig || jsData.credit_orig) || 0;
    payload.partner_id = jsData.partnerId || jsData.partner_id || null;
    payload.partner_type = jsData.partnerType || jsData.partner_type || null;
    payload.unit_id = jsData.unitId || jsData.unit_id || null;
    payload.cost_center = jsData.costCenter || jsData.cost_center || null;
    payload.is_internal = jsData.isInternal ?? jsData.is_internal ?? false;
    payload.counterparty_unit_id = jsData.counterpartyUnitId || jsData.counterparty_unit_id || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'acc_audit_log') {
    payload.table_name = jsData.tableName || jsData.table_name || '';
    payload.record_id = jsData.recordId || jsData.record_id || '';
    payload.action = jsData.action || 'INSERT';
    payload.before_data = jsData.beforeData || jsData.before_data || null;
    payload.after_data = jsData.afterData || jsData.after_data || null;
    payload.changed_fields = jsData.changedFields || jsData.changed_fields || null;
    payload.actor = jsData.actor || null;
    payload.actor_ip = jsData.actorIp || jsData.actor_ip || null;
    payload.reason = jsData.reason || null;
    payload.occurred_at = jsData.occurredAt || jsData.occurred_at || new Date().toISOString();
  } else if (tableName === 'acc_units') {
    payload.code = jsData.code || '';
    payload.name = jsData.name || '';
    payload.parent_id = jsData.parentId || jsData.parent_id || null;
    payload.unit_type = jsData.unitType || jsData.unit_type || 'branch';
    payload.consolidation_method = jsData.consolidationMethod || jsData.consolidation_method || 'full';
    payload.is_head_office = jsData.isHeadOffice ?? jsData.is_head_office ?? false;
    payload.address = jsData.address || null;
    payload.tax_code = jsData.taxCode || jsData.tax_code || null;
    payload.manager_name = jsData.managerName || jsData.manager_name || null;
    payload.is_active = jsData.isActive ?? jsData.is_active ?? true;
    payload.opened_at = jsData.openedAt || jsData.opened_at || new Date().toISOString().slice(0, 10);
    payload.closed_at = jsData.closedAt || jsData.closed_at || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'acc_internal_txn') {
    payload.voucher_id = jsData.voucherId || jsData.voucher_id || null;
    payload.line_id = jsData.lineId || jsData.line_id || null;
    payload.period_id = jsData.periodId || jsData.period_id || null;
    payload.from_unit_id = jsData.fromUnitId || jsData.from_unit_id || null;
    payload.to_unit_id = jsData.toUnitId || jsData.to_unit_id || null;
    payload.account_code = jsData.accountCode || jsData.account_code || '';
    payload.amount = Number(jsData.amount) || 0;
    payload.txn_type = jsData.txnType || jsData.txn_type || 'receivable_payable';
    payload.status = jsData.status || 'unmatched';
    payload.matched_txn_id = jsData.matchedTxnId || jsData.matched_txn_id || null;
    payload.matched_at = jsData.matchedAt || jsData.matched_at || null;
    payload.elimination_id = jsData.eliminationId || jsData.elimination_id || null;
    payload.note = jsData.note || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'acc_eliminations') {
    payload.elimination_no = jsData.eliminationNo || jsData.elimination_no || '';
    payload.period_id = jsData.periodId || jsData.period_id || null;
    payload.elimination_date = jsData.eliminationDate || jsData.elimination_date || new Date().toISOString().slice(0, 10);
    payload.elimination_type = jsData.eliminationType || jsData.elimination_type || 'receivable_payable';
    payload.description = jsData.description || '';
    payload.total_amount = Number(jsData.totalAmount || jsData.total_amount) || 0;
    payload.voucher_id = jsData.voucherId || jsData.voucher_id || null;
    payload.status = jsData.status || 'draft';
    payload.created_by = jsData.createdBy || jsData.created_by || null;
    payload.posted_by = jsData.postedBy || jsData.posted_by || null;
    payload.posted_at = jsData.postedAt || jsData.posted_at || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'acc_elimination_lines') {
    payload.elimination_id = jsData.eliminationId || jsData.elimination_id || null;
    payload.line_no = Number(jsData.lineNo || jsData.line_no) || 1;
    payload.account_code = jsData.accountCode || jsData.account_code || '';
    payload.description = jsData.description || null;
    payload.debit = Number(jsData.debit) || 0;
    payload.credit = Number(jsData.credit) || 0;
    payload.unit_id = jsData.unitId || jsData.unit_id || null;
    payload.internal_txn_id = jsData.internalTxnId || jsData.internal_txn_id || null;
  } else if (tableName === 'rev_contracts') {
    payload.contract_no = jsData.contractNo || jsData.contract_no || '';
    payload.customer_id = jsData.customerId || jsData.customer_id || '';
    payload.order_id = jsData.orderId || jsData.order_id || null;
    payload.f2b2b_source_id = jsData.f2b2bSourceId || jsData.f2b2b_source_id || null;
    payload.signed_date = jsData.signedDate || jsData.signed_date || new Date().toISOString().slice(0, 10);
    payload.effective_date = jsData.effectiveDate || jsData.effective_date || null;
    payload.end_date = jsData.endDate || jsData.end_date || null;
    payload.collectability = jsData.collectability || 'probable';
    payload.status = jsData.status || 'draft';
    payload.currency_code = jsData.currencyCode || jsData.currency_code || 'VND';
    payload.fx_rate = Number(jsData.fxRate || jsData.fx_rate) || 1;
    payload.fixed_amount = Number(jsData.fixedAmount || jsData.fixed_amount) || 0;
    payload.variable_amount = Number(jsData.variableAmount || jsData.variable_amount) || 0;
    payload.variable_constraint_pct = jsData.variableConstraintPct ?? jsData.variable_constraint_pct ?? 100;
    payload.transaction_price = Number(jsData.transactionPrice || jsData.transaction_price) || 0;
    payload.allocated_total = Number(jsData.allocatedTotal || jsData.allocated_total) || 0;
    payload.recognized_total = Number(jsData.recognizedTotal || jsData.recognized_total) || 0;
    payload.deferred_total = Number(jsData.deferredTotal || jsData.deferred_total) || 0;
    payload.cancellation_date = jsData.cancellationDate || jsData.cancellation_date || null;
    payload.note = jsData.note || null;
    payload.created_by = jsData.createdBy || jsData.created_by || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'rev_performance_obligations') {
    payload.contract_id = jsData.contractId || jsData.contract_id || null;
    payload.code = jsData.code || '';
    payload.name = jsData.name || '';
    payload.obligation_type = jsData.obligationType || jsData.obligation_type || 'point_in_time';
    payload.progress_method = jsData.progressMethod || jsData.progress_method || null;
    payload.standalone_selling_price = Number(jsData.standaloneSellingPrice || jsData.standalone_selling_price) || 0;
    payload.allocation_pct = Number(jsData.allocationPct || jsData.allocation_pct) || 0;
    payload.allocated_amount = Number(jsData.allocatedAmount || jsData.allocated_amount) || 0;
    payload.revenue_account_code = jsData.revenueAccountCode || jsData.revenue_account_code || '5111';
    payload.deferred_account_code = jsData.deferredAccountCode || jsData.deferred_account_code || '3387';
    payload.satisfied_at = jsData.satisfiedAt || jsData.satisfied_at || null;
    payload.progress_pct = Number(jsData.progressPct || jsData.progress_pct) || 0;
    payload.recognized_amount = Number(jsData.recognizedAmount || jsData.recognized_amount) || 0;
    payload.status = jsData.status || 'pending';
    payload.display_order = Number(jsData.displayOrder || jsData.display_order) || 0;
    payload.note = jsData.note || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'rev_price_allocations') {
    payload.contract_id = jsData.contractId || jsData.contract_id || null;
    payload.obligation_id = jsData.obligationId || jsData.obligation_id || null;
    payload.standalone_selling_price = Number(jsData.standaloneSellingPrice || jsData.standalone_selling_price) || 0;
    payload.allocation_pct = Number(jsData.allocationPct || jsData.allocation_pct) || 0;
    payload.allocated_fixed = Number(jsData.allocatedFixed || jsData.allocated_fixed) || 0;
    payload.allocated_variable = Number(jsData.allocatedVariable || jsData.allocated_variable) || 0;
    payload.allocated_discount = Number(jsData.allocatedDiscount || jsData.allocated_discount) || 0;
    payload.allocated_total = Number(jsData.allocatedTotal || jsData.allocated_total) || 0;
    payload.basis = jsData.basis || 'relative_ssp';
    payload.justification = jsData.justification || null;
    payload.allocated_at = jsData.allocatedAt || jsData.allocated_at || new Date().toISOString();
    payload.allocated_by = jsData.allocatedBy || jsData.allocated_by || null;
    payload.is_superseded = jsData.isSuperseded ?? jsData.is_superseded ?? false;
  } else if (tableName === 'rev_recognition') {
    payload.obligation_id = jsData.obligationId || jsData.obligation_id || null;
    payload.contract_id = jsData.contractId || jsData.contract_id || null;
    payload.period_id = jsData.periodId || jsData.period_id || null;
    payload.recognition_date = jsData.recognitionDate || jsData.recognition_date || new Date().toISOString().slice(0, 10);
    payload.method = jsData.method || 'point_in_time';
    payload.progress_pct = Number(jsData.progressPct || jsData.progress_pct) || 0;
    payload.recognized_amount = Number(jsData.recognizedAmount || jsData.recognized_amount) || 0;
    payload.cumulative_recognized = Number(jsData.cumulativeRecognized || jsData.cumulative_recognized) || 0;
    payload.remaining_amount = Number(jsData.remainingAmount || jsData.remaining_amount) || 0;
    payload.breakage_pct = jsData.breakagePct ?? jsData.breakage_pct ?? null;
    payload.voucher_id = jsData.voucherId || jsData.voucher_id || null;
    payload.status = jsData.status || 'draft';
    payload.reason = jsData.reason || null;
    payload.created_by = jsData.createdBy || jsData.created_by || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'fs_reports') {
    payload.report_code = jsData.reportCode || jsData.report_code || 'B01-DN';
    payload.period_id = jsData.periodId || jsData.period_id || null;
    payload.scope = jsData.scope || 'company';
    payload.report_type = jsData.reportType || jsData.report_type || 'annual';
    payload.status = jsData.status || 'draft';
    payload.revision_no = Number(jsData.revisionNo || jsData.revision_no) || 1;
    payload.prepared_by = jsData.preparedBy || jsData.prepared_by || null;
    payload.prepared_at = jsData.preparedAt || jsData.prepared_at || new Date().toISOString();
    payload.approved_by = jsData.approvedBy || jsData.approved_by || null;
    payload.approved_at = jsData.approvedAt || jsData.approved_at || null;
    payload.submitted_at = jsData.submittedAt || jsData.submitted_at || null;
    payload.content_hash = jsData.contentHash || jsData.content_hash || null;
    payload.note = jsData.note || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
    payload.updated_at = jsData.updatedAt || jsData.updated_at || new Date().toISOString();
  } else if (tableName === 'fs_report_lines') {
    payload.report_id = jsData.reportId || jsData.report_id || null;
    payload.line_code = jsData.lineCode || jsData.line_code || '';
    payload.line_name = jsData.lineName || jsData.line_name || '';
    payload.display_order = Number(jsData.displayOrder || jsData.display_order) || 0;
    payload.indent_level = Number(jsData.indentLevel || jsData.indent_level) || 0;
    payload.is_bold = jsData.isBold ?? jsData.is_bold ?? false;
    payload.is_section = jsData.isSection ?? jsData.is_section ?? false;
    payload.is_custom = jsData.isCustom ?? jsData.is_custom ?? false;
    payload.current_amount = jsData.currentAmount ?? jsData.current_amount ?? null;
    payload.prior_amount = jsData.priorAmount ?? jsData.prior_amount ?? null;
    payload.formula = jsData.formula || null;
    payload.data_type = jsData.dataType || jsData.data_type || null;
    payload.note = jsData.note || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'fs_account_mappings') {
    payload.report_code = jsData.reportCode || jsData.report_code || 'B01-DN';
    payload.line_code = jsData.lineCode || jsData.line_code || '';
    payload.account_code = jsData.accountCode || jsData.account_code || '';
    payload.sign = jsData.sign || '+';
    payload.note = jsData.note || null;
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'journal_entries') {
    payload.date = jsData.date || jsData.dateStr || new Date().toISOString();
    payload.ref = jsData.ref || null;
    payload.description = jsData.description || null;
  } else if (tableName === 'wallet_transactions' || tableName === 'seller_transactions') {
    payload.seller_id = jsData.userId || jsData.sellerId || jsData.seller_id || null;
    payload.type = jsData.type || '';
    payload.amount = Number(jsData.amount) || 0.00;
    payload.reference_id = jsData.referenceId || jsData.gateway || null;
    payload.status = jsData.status || 'success';
    payload.created_at = jsData.createdAt || jsData.created_at || new Date().toISOString();
  } else if (tableName === 'admin_audit_logs' || tableName === 'tenant_audit_logs') {
    // GĐ 2.6 — ghi ĐÚNG CỘT thay vì nhét nguyên cục vào JSONB (`data`), để
    // query được theo action/email/tenant. Vẫn lưu kèm toàn bộ payload vào
    // `data` để không mất trường ngoài lề (metadata, before/after…).
    // Chấp nhận CẢ định dạng chuẩn mới (auditTrailService: actorEmail/actorUid…)
    // lẫn định dạng cũ (email/userId…) để không phá log đã có.
    payload.email = jsData.actorEmail || jsData.email || null;
    payload.user_id = jsData.actorUid || jsData.userId || jsData.user_id || null;
    payload.action = jsData.action || null;
    payload.status = jsData.status || null;
    payload.details = jsData.details ?? jsData.metadata ?? null;
    payload.ip_address = jsData.ipAddress || jsData.ip_address || null;
    payload.user_agent = jsData.userAgent || jsData.user_agent || null;
    payload.created_at = jsData.timestamp || jsData.createdAt || jsData.created_at || new Date().toISOString();
    // Các trường chuẩn KHÔNG có cột riêng → gom vào `data` để không mất:
    // actorName, targetId/targetLabel, path, browser, source.
    const extra: Record<string, unknown> = {};
    if (jsData.actionKey) extra.actionKey = jsData.actionKey;
    if (jsData.actorName) extra.actorName = jsData.actorName;
    if (jsData.targetId) extra.targetId = jsData.targetId;
    if (jsData.targetLabel) extra.targetLabel = jsData.targetLabel;
    if (jsData.path) extra.path = jsData.path;
    if (jsData.browser) extra.browser = jsData.browser;
    if (jsData.source) extra.source = jsData.source;
    if (jsData.data && typeof jsData.data === 'object') Object.assign(extra, jsData.data);
    payload.data = Object.keys(extra).length ? extra : null;
  }

  return payload;
}

export function fromRelationalRow(tableName: string, row: any) {
  if (!row) return row;
  
  const jsData: any = {
    id: row.id,
    tenantId: row.tenant_id
  };

  if (tableName === 'products') {
    jsData.name = row.name;
    jsData.description = row.description;
    jsData.price = Number(row.price);
    jsData.sku = row.sku;
    jsData.category = row.category;
    jsData.imageUrl = row.image_url;
    jsData.image = row.image_urls || row.image_url; // Ưu tiên gallery (image_urls) cho frontend
    jsData.image_urls = row.image_urls ?? (Array.isArray(row.images) ? row.images : null);
    jsData.createdAt = row.created_at;
    
    // Deserialize relational columns
    jsData.brand = row.brand;
    jsData.stock = Number(row.stock || 0);
    jsData.costPrice = Number(row.cost_price || 0);
    jsData.hiddenCosts = Number(row.hidden_costs || 0);
    jsData.margin = Number(row.margin || 0);
    jsData.profit = Number(row.profit || 0);
    jsData.sellerName = row.seller_name;
    jsData.weight = row.weight;
    jsData.dimensions = row.dimensions;
    jsData.videoUrl = row.video_url;
    jsData.images = row.images || [];
    jsData.specs = row.specs || [];
    jsData.barcode = row.barcode;
    jsData.vatRate = Number(row.vat_rate || 0);
    jsData.specification = row.specification;
    jsData.supplierId = row.supplier_id;
    
    if (row.description_embedding) {
      jsData.description_embedding = row.description_embedding;
    }
  } else if (tableName === 'customers') {
    jsData.name = row.name;
    jsData.email = row.email;
    jsData.phone = row.phone;
    jsData.address = row.address;
    jsData.createdAt = row.created_at;
  } else if (tableName === 'orders') {
    jsData.customerId = row.customer_id;
    jsData.customerName = row.customer_name;
    jsData.total = Number(row.total);
    jsData.status = row.status;
    jsData.items = row.items;
    jsData.createdAt = row.created_at;
    jsData.routedWarehouse = row.routed_warehouse;
    jsData.einvoiceStatus = row.einvoice_status;
    jsData.einvoiceXml = row.einvoice_xml;
    jsData.einvoiceLookupCode = row.einvoice_lookup_code;
    jsData.einvoiceSignedAt = row.einvoice_signed_at;
    jsData.einvoiceErrorFlow = row.einvoice_error_flow;
    jsData.einvoiceErrorReason = row.einvoice_error_reason;
    jsData.einvoiceReplacesInvoiceNo = row.einvoice_replaces_invoice_no;
    jsData.einvoiceAdjustedAt = row.einvoice_adjusted_at;
    jsData.einvoiceConsolidationRef = row.einvoice_consolidation_ref;
    jsData.einvoiceErrorHandledAt = row.einvoice_error_handled_at;
    jsData.carrier = row.carrier;
    jsData.tracking = row.tracking;
    jsData.shippingCost = Number(row.shipping_cost || 0);
    jsData.sellerId = row.seller_id;
    jsData.parentOrderId = row.parent_order_id;
    jsData.commissionFee = Number(row.commission_fee || 0);
    jsData.settlementStatus = row.settlement_status;
    jsData.settlementId = row.settlement_id;
    jsData.paymentStatus = row.payment_status;
    jsData.paymentMethod = row.payment_method;
    jsData.channel = row.channel;
  } else if (tableName === 'warehouse_stock') {
    jsData.warehouseId = row.warehouse_id || row.store_id;
    jsData.storeId = row.warehouse_id || row.store_id; // Keep storeId for backward compatibility
    jsData.productId = row.product_id;
    jsData.materialId = row.product_id; // backward compatibility for UI
    jsData.productName = row.product_name;
    jsData.materialName = row.product_name; // backward compatibility
    jsData.quantity = Number(row.quantity);
    jsData.safetyStock = Number(row.safety_stock);
    jsData.allocated = Number(row.allocated || 0);
    jsData.pendingProcessing = Number(row.pending_processing || 0);
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'sellers') {
    jsData.name = row.name;
    jsData.email = row.email;
    jsData.phone = row.phone;
    jsData.totalProducts = Number(row.total_products || 0);
    jsData.rating = Number(row.rating || 0);
    jsData.gmv = Number(row.gmv || 0);
    jsData.walletBalance = Number(row.wallet_balance || 0);
    jsData.status = row.status;
    jsData.taxCode = row.tax_code;
    jsData.identityCard = row.identity_card;
    jsData.address = row.address;
    jsData.representative = row.representative;
    jsData.commissionRate = Number(row.commission_rate || 0);
    jsData.joinDate = row.join_date;
    jsData.onboardingStep = row.onboarding_step;
    jsData.partnerType = row.partner_type;
    jsData.activeModules = row.active_modules || [];
    jsData.businessLicenseUrl = row.business_license_url;
    jsData.idCardFrontUrl = row.id_card_front_url;
    jsData.idCardBackUrl = row.id_card_back_url;
  } else if (tableName === 'settlements') {
    jsData.sellerId = row.seller_id;
    jsData.sellerName = row.seller_name;
    jsData.periodStart = row.period_start;
    jsData.periodEnd = row.period_end;
    jsData.totalSales = Number(row.total_sales || 0);
    jsData.commissionFee = Number(row.commission_fee || 0);
    jsData.shippingFee = Number(row.shipping_fee || 0);
    jsData.netPayout = Number(row.net_payout || 0);
    jsData.status = row.status;
    jsData.paidAt = row.paid_at;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'payments') {
    jsData.orderId = row.order_id;
    jsData.amount = Number(row.amount || 0);
    jsData.paymentMethod = row.payment_method;
    jsData.transactionId = row.transaction_id;
    jsData.paymentGateway = row.payment_gateway;
    jsData.status = row.status;
    jsData.createdAt = row.created_at;
  } else if (tableName === 'product_price_history') {
    jsData.productId = row.product_id;
    jsData.oldPrice = Number(row.old_price || 0);
    jsData.newPrice = Number(row.new_price || 0);
    jsData.oldCostPrice = Number(row.old_cost_price || 0);
    jsData.newCostPrice = Number(row.new_cost_price || 0);
    jsData.changedBy = row.changed_by;
    jsData.changedAt = row.changed_at;
  } else if (tableName === 'partner_ledgers') {
    jsData.partnerId = row.partner_id;
    jsData.partnerType = row.partner_type;
    jsData.refType = row.ref_type;
    jsData.refId = row.ref_id;
    jsData.debit = Number(row.debit || 0);
    jsData.credit = Number(row.credit || 0);
    jsData.balance = Number(row.balance || 0);
    jsData.createdAt = row.created_at;
  } else if (tableName === 'loyalty_points_ledger') {
    jsData.customerId = row.customer_id;
    jsData.pointsChange = Number(row.points_change || 0);
    jsData.transactionType = row.transaction_type;
    jsData.description = row.description;
    jsData.referenceType = row.reference_type;
    jsData.referenceId = row.reference_id;
    jsData.createdAt = row.created_at;
  } else if (tableName === 'support_tickets') {
    jsData.customerId = row.customer_id;
    jsData.customerName = row.customer_name;
    jsData.subject = row.subject;
    jsData.status = row.status;
    jsData.priority = row.priority;
    jsData.type = row.type;
    jsData.slaDeadline = row.sla_deadline;
    jsData.resolvedAt = row.resolved_at;
    jsData.createdAt = row.created_at;
  } else if (tableName === 'combos') {
    jsData.name = row.name;
    jsData.description = row.description;
    jsData.price = Number(row.price || 0);
    jsData.costPrice = Number(row.cost_price || 0);
    jsData.status = row.status;
    jsData.createdAt = row.created_at;
  } else if (tableName === 'combo_items') {
    jsData.comboId = row.combo_id;
    jsData.productId = row.product_id;
    jsData.quantity = Number(row.quantity || 0);
  } else if (tableName === 'group_buy_sessions') {
    // SỬA (spec 016): đọc theo canonical trong DDL (xem toRelationalPayload)
    jsData.comboId = row.combo_id;
    jsData.productId = row.product_id;
    jsData.status = row.status;
    jsData.minParticipants = Number(row.min_participants || 0);
    jsData.currentParticipants = Number(row.current_participants || 0);
    jsData.unitPrice = Number(row.unit_price || 0);
    jsData.expiresAt = row.expires_at;
    jsData.leaderId = row.leader_id;
    jsData.lockedAt = row.locked_at;
    jsData.supplierConfirmedAt = row.supplier_confirmed_at;
    jsData.completedAt = row.completed_at;
    jsData.cancelledAt = row.cancelled_at;
    jsData.cancelledReason = row.cancelled_reason;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'group_buy_participants') {
    jsData.sessionId = row.session_id;
    jsData.customerId = row.customer_id;
    jsData.customerName = row.customer_name;
    jsData.quantity = Number(row.quantity || 0);
    jsData.unitPrice = Number(row.unit_price || 0);
    jsData.amount = Number(row.amount || 0);
    jsData.status = row.status;
    jsData.paymentRef = row.payment_ref;
    jsData.orderId = row.order_id;
    jsData.joinedAt = row.joined_at;
    jsData.cancelledAt = row.cancelled_at;
  } else if (tableName === 'f2b2b_sources') {
    jsData.code = row.code;
    jsData.name = row.name;
    jsData.type = row.type;
    jsData.taxCode = row.tax_code;
    jsData.contactName = row.contact_name;
    jsData.phone = row.phone;
    jsData.email = row.email;
    jsData.provinceCode = row.province_code;
    jsData.provinceName = row.province_name;
    jsData.address = row.address;
    jsData.capacityPerCycle = Number(row.capacity_per_cycle || 0);
    jsData.capacityUnit = row.capacity_unit;
    jsData.leadTimeDays = Number(row.lead_time_days || 0);
    jsData.certifications = row.certifications || [];
    jsData.rating = Number(row.rating || 0);
    jsData.totalCompletedPools = Number(row.total_completed_pools || 0);
    jsData.status = row.status;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'f2b2b_pool_orders') {
    jsData.code = row.code;
    jsData.sourceId = row.source_id;
    jsData.productId = row.product_id;
    jsData.productName = row.product_name;
    jsData.unit = row.unit;
    jsData.targetQty = Number(row.target_qty || 0);
    jsData.minQty = Number(row.min_qty || 0);
    jsData.pooledQty = Number(row.pooled_qty || 0);
    jsData.priceTiers = row.price_tiers || [];
    jsData.baseUnitPrice = Number(row.base_unit_price || 0);
    jsData.finalUnitPrice = row.final_unit_price ?? null;
    jsData.status = row.status;
    jsData.openAt = row.open_at;
    jsData.closeAt = row.close_at;
    jsData.expectedDeliveryAt = row.expected_delivery_at;
    jsData.confirmedAt = row.confirmed_at;
    jsData.completedAt = row.completed_at;
    jsData.cancelledAt = row.cancelled_at;
    jsData.cancelledReason = row.cancelled_reason;
    jsData.createdBy = row.created_by;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'f2b2b_pool_participants') {
    jsData.poolId = row.pool_id;
    jsData.buyerId = row.buyer_id;
    jsData.buyerName = row.buyer_name;
    jsData.committedQty = Number(row.committed_qty || 0);
    jsData.unitPrice = Number(row.unit_price || 0);
    jsData.amount = Number(row.amount || 0);
    jsData.deliveryAddress = row.delivery_address;
    jsData.deliveryProvinceCode = row.delivery_province_code;
    jsData.status = row.status;
    jsData.paymentRef = row.payment_ref;
    jsData.joinedAt = row.joined_at;
    jsData.cancelledAt = row.cancelled_at;
  } else if (tableName === 'dropship_partners') {
    jsData.code = row.code;
    jsData.name = row.name;
    jsData.shopName = row.shop_name;
    jsData.channels = row.channels || [];
    jsData.taxCode = row.tax_code;
    jsData.contactName = row.contact_name;
    jsData.phone = row.phone;
    jsData.email = row.email;
    jsData.address = row.address;
    jsData.vneidVerified = Boolean(row.vneid_verified);
    jsData.vneidLinkedAt = row.vneid_linked_at;
    jsData.marginSplit = Number(row.margin_split ?? 0.8);
    jsData.bankName = row.bank_name;
    jsData.bankAccount = row.bank_account;
    jsData.bankAccountName = row.bank_account_name;
    jsData.outstandingCod = Number(row.outstanding_cod || 0);
    jsData.status = row.status;
  } else if (tableName === 'dropship_listings') {
    jsData.partnerId = row.partner_id;
    jsData.productId = row.product_id;
    jsData.productName = row.product_name;
    jsData.externalSku = row.external_sku;
    jsData.channel = row.channel;
    jsData.externalUrl = row.external_url;
    jsData.baseCost = Number(row.base_cost || 0);
    jsData.listedPrice = Number(row.listed_price || 0);
    jsData.minSellingPrice = Number(row.min_selling_price || 0);
    jsData.shippingFee = Number(row.shipping_fee || 0);
    jsData.stockSynced = Number(row.stock_synced || 0);
    jsData.syncedAt = row.synced_at;
    jsData.status = row.status;
  } else if (tableName === 'dropship_orders') {
    jsData.partnerId = row.partner_id;
    jsData.code = row.code;
    jsData.externalOrderCode = row.external_order_code;
    jsData.channel = row.channel;
    jsData.items = row.items || [];
    jsData.itemCount = Number(row.item_count || 0);
    jsData.quantity = Number(row.quantity || 0);
    jsData.buyerName = row.buyer_name;
    jsData.buyerPhone = row.buyer_phone;
    jsData.shippingAddress = row.shipping_address;
    jsData.shippingProvinceCode = row.shipping_province_code;
    jsData.codAmount = Number(row.cod_amount || 0);
    jsData.totalCost = Number(row.total_cost || 0);
    jsData.shippingFee = Number(row.shipping_fee || 0);
    jsData.grossMargin = Number(row.gross_margin || 0);
    jsData.partnerMargin = Number(row.partner_margin || 0);
    jsData.vcommMargin = Number(row.vcomm_margin || 0);
    jsData.carrier = row.carrier;
    jsData.trackingCode = row.tracking_code;
    jsData.status = row.status;
    jsData.reservedAt = row.reserved_at;
    jsData.shippedAt = row.shipped_at;
    jsData.deliveredAt = row.delivered_at;
    jsData.settledAt = row.settled_at;
    jsData.cancelledAt = row.cancelled_at;
    jsData.cancelledReason = row.cancelled_reason;
  } else if (tableName === 'dropship_margin_ledger') {
    jsData.partnerId = row.partner_id;
    jsData.orderId = row.order_id;
    jsData.type = row.type;
    jsData.amount = Number(row.amount || 0);
    jsData.note = row.note;
    jsData.status = row.status;
    jsData.period = row.period;
    jsData.paidAt = row.paid_at;
    jsData.payoutRef = row.payout_ref;
  } else if (tableName === 'vcomm_hubs') {
    jsData.code = row.code;
    jsData.name = row.name;
    jsData.type = row.type;
    jsData.provinceCode = row.province_code;
    jsData.provinceName = row.province_name;
    jsData.address = row.address;
    jsData.latitude = row.latitude != null ? Number(row.latitude) : null;
    jsData.longitude = row.longitude != null ? Number(row.longitude) : null;
    jsData.capacity = Number(row.capacity || 100);
    jsData.currentLoad = Number(row.current_load || 0);
    jsData.open247 = Boolean(row.open_24_7);
    jsData.operatingHours = row.operating_hours;
    jsData.managerName = row.manager_name;
    jsData.phone = row.phone;
    jsData.status = row.status;
  } else if (tableName === 'hub_shipments') {
    jsData.hubId = row.hub_id;
    jsData.orderId = row.order_id;
    jsData.trackingCode = row.tracking_code;
    jsData.pickupCode = row.pickup_code;
    jsData.qrSecret = row.qr_secret;
    jsData.qrIssuedAt = row.qr_issued_at;
    jsData.recipientName = row.recipient_name;
    jsData.recipientPhone = row.recipient_phone;
    jsData.codAmount = Number(row.cod_amount || 0);
    jsData.insuranceFee = Number(row.insurance_fee || 0);
    jsData.penaltyAmount = Number(row.penalty_amount || 0);
    jsData.inspectionOk = row.inspection_ok ?? null;
    jsData.refundedAmount = Number(row.refunded_amount || 0);
    jsData.status = row.status;
    jsData.arrivedAt = row.arrived_at;
    jsData.readyAt = row.ready_at;
    jsData.reminder48hAt = row.reminder_48h_at;
    jsData.reminder72hAt = row.reminder_72h_at;
    jsData.pickedUpAt = row.picked_up_at;
    jsData.expiredAt = row.expired_at;
    jsData.returnedAt = row.returned_at;
    jsData.cancelledReason = row.cancelled_reason;
  } else if (tableName === 'vxu_accounts') {
    jsData.customerId = row.customer_id;
    jsData.balance = Number(row.balance || 0);
    jsData.lifetimeEarned = Number(row.lifetime_earned || 0);
    jsData.lifetimeSpendVnd = Number(row.lifetime_spend_vnd || 0);
    jsData.lifetimeOrders = Number(row.lifetime_orders || 0);
    jsData.tier = row.tier;
    jsData.tierChangedAt = row.tier_changed_at;
  } else if (tableName === 'vxu_ledger') {
    jsData.transactionId = row.transaction_id;
    jsData.side = row.side;
    jsData.account = row.account;
    jsData.counterAccount = row.counter_account;
    jsData.customerId = row.customer_id;
    jsData.amount = Number(row.amount || 0);
    jsData.type = row.type;
    jsData.referenceType = row.reference_type;
    jsData.referenceId = row.reference_id;
    jsData.note = row.note;
  } else if (tableName === 'vxu_redemptions') {
    jsData.customerId = row.customer_id;
    jsData.voucherCode = row.voucher_code;
    jsData.templateCode = row.template_code;
    jsData.vxuCost = Number(row.vxu_cost || 0);
    jsData.voucherValueVnd = Number(row.voucher_value_vnd || 0);
    jsData.requiredTier = row.required_tier;
    jsData.minSpendVnd = Number(row.min_spend_vnd || 0);
    jsData.status = row.status;
    jsData.transactionId = row.transaction_id;
    jsData.orderId = row.order_id;
    jsData.usedAt = row.used_at;
    jsData.expiresAt = row.expires_at;
  } else if (tableName === 'stock_vouchers') {
    jsData.code = row.code;
    jsData.type = row.type;
    jsData.status = row.status;
    jsData.sourceWarehouseId = row.source_warehouse_id;
    jsData.targetWarehouseId = row.target_warehouse_id;
    jsData.createdBy = row.created_by;
    jsData.createdAt = row.created_at;
    jsData.approvedBy = row.approved_by;
    jsData.approvedAt = row.approved_at;
  } else if (tableName === 'stock_voucher_items') {
    jsData.voucherId = row.voucher_id;
    jsData.productId = row.product_id;
    jsData.quantity = Number(row.quantity || 0);
  } else if (tableName === 'acc_accounts') {
    jsData.code = row.code;
    jsData.name = row.name;
    jsData.level = Number(row.level || 1);
    jsData.parentCode = row.parent_code;
    jsData.accountType = row.account_type;
    jsData.balanceSide = row.balance_side;
    jsData.isSystem = !!row.is_system;
    jsData.regulationRef = row.regulation_ref;
    jsData.isActive = !!row.is_active;
    jsData.trackPartner = !!row.track_partner;
    jsData.trackUnit = !!row.track_unit;
    jsData.isIntercompany = !!row.is_intercompany;
    jsData.note = row.note;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'acc_currencies') {
    jsData.code = row.code;
    jsData.name = row.name;
    jsData.symbol = row.symbol;
    jsData.isBase = !!row.is_base;
    jsData.isActive = !!row.is_active;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'acc_fx_rates') {
    jsData.currencyCode = row.currency_code;
    jsData.rateDate = row.rate_date;
    jsData.bookedRate = Number(row.booked_rate || 0);
    jsData.actualRate = row.actual_rate;
    jsData.deviationPct = row.deviation_pct;
    jsData.exceedsTolerance = !!row.exceeds_tolerance;
    jsData.tolerancePct = Number(row.tolerance_pct || 1);
    jsData.note = row.note;
    jsData.createdBy = row.created_by;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'acc_periods') {
    jsData.periodYear = Number(row.period_year || 0);
    jsData.periodNo = row.period_no;
    jsData.startDate = row.start_date;
    jsData.endDate = row.end_date;
    jsData.status = row.status;
    jsData.closedAt = row.closed_at;
    jsData.closedBy = row.closed_by;
    jsData.closingHash = row.closing_hash;
    jsData.closingNote = row.closing_note;
    jsData.exportedAt = row.exported_at;
    jsData.exportedBy = row.exported_by;
    jsData.exportFormat = row.export_format;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'acc_vouchers') {
    jsData.voucherNo = row.voucher_no;
    jsData.voucherType = row.voucher_type;
    jsData.voucherDate = row.voucher_date;
    jsData.postDate = row.post_date;
    jsData.periodId = row.period_id;
    jsData.unitId = row.unit_id;
    jsData.currencyCode = row.currency_code;
    jsData.fxRate = Number(row.fx_rate || 1);
    jsData.description = row.description;
    jsData.attachments = row.attachments;
    jsData.status = row.status;
    jsData.reversalOf = row.reversal_of;
    jsData.reversalReason = row.reversal_reason;
    jsData.sourceType = row.source_type;
    jsData.sourceId = row.source_id;
    jsData.createdBy = row.created_by;
    jsData.postedBy = row.posted_by;
    jsData.postedAt = row.posted_at;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'acc_voucher_lines') {
    jsData.voucherId = row.voucher_id;
    jsData.lineNo = Number(row.line_no || 0);
    jsData.accountCode = row.account_code;
    jsData.description = row.description;
    jsData.debit = Number(row.debit || 0);
    jsData.credit = Number(row.credit || 0);
    jsData.debitOrig = Number(row.debit_orig || 0);
    jsData.creditOrig = Number(row.credit_orig || 0);
    jsData.partnerId = row.partner_id;
    jsData.partnerType = row.partner_type;
    jsData.unitId = row.unit_id;
    jsData.costCenter = row.cost_center;
    jsData.isInternal = !!row.is_internal;
    jsData.counterpartyUnitId = row.counterparty_unit_id;
    jsData.createdAt = row.created_at;
  } else if (tableName === 'acc_audit_log') {
    jsData.tableName = row.table_name;
    jsData.recordId = row.record_id;
    jsData.action = row.action;
    jsData.beforeData = row.before_data;
    jsData.afterData = row.after_data;
    jsData.changedFields = row.changed_fields;
    jsData.actor = row.actor;
    jsData.actorIp = row.actor_ip;
    jsData.reason = row.reason;
    jsData.occurredAt = row.occurred_at;
    jsData.seq = Number(row.seq || 0);
    jsData.prevHash = row.prev_hash;
    jsData.hash = row.hash;
  } else if (tableName === 'acc_units') {
    jsData.code = row.code;
    jsData.name = row.name;
    jsData.parentId = row.parent_id;
    jsData.unitType = row.unit_type;
    jsData.consolidationMethod = row.consolidation_method;
    jsData.isHeadOffice = !!row.is_head_office;
    jsData.address = row.address;
    jsData.taxCode = row.tax_code;
    jsData.managerName = row.manager_name;
    jsData.isActive = !!row.is_active;
    jsData.openedAt = row.opened_at;
    jsData.closedAt = row.closed_at;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'acc_internal_txn') {
    jsData.voucherId = row.voucher_id;
    jsData.lineId = row.line_id;
    jsData.periodId = row.period_id;
    jsData.fromUnitId = row.from_unit_id;
    jsData.toUnitId = row.to_unit_id;
    jsData.accountCode = row.account_code;
    jsData.amount = Number(row.amount || 0);
    jsData.txnType = row.txn_type;
    jsData.status = row.status;
    jsData.matchedTxnId = row.matched_txn_id;
    jsData.matchedAt = row.matched_at;
    jsData.eliminationId = row.elimination_id;
    jsData.note = row.note;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'acc_eliminations') {
    jsData.eliminationNo = row.elimination_no;
    jsData.periodId = row.period_id;
    jsData.eliminationDate = row.elimination_date;
    jsData.eliminationType = row.elimination_type;
    jsData.description = row.description;
    jsData.totalAmount = Number(row.total_amount || 0);
    jsData.voucherId = row.voucher_id;
    jsData.status = row.status;
    jsData.createdBy = row.created_by;
    jsData.postedBy = row.posted_by;
    jsData.postedAt = row.posted_at;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'acc_elimination_lines') {
    jsData.eliminationId = row.elimination_id;
    jsData.lineNo = Number(row.line_no || 0);
    jsData.accountCode = row.account_code;
    jsData.description = row.description;
    jsData.debit = Number(row.debit || 0);
    jsData.credit = Number(row.credit || 0);
    jsData.unitId = row.unit_id;
    jsData.internalTxnId = row.internal_txn_id;
  } else if (tableName === 'rev_contracts') {
    jsData.contractNo = row.contract_no;
    jsData.customerId = row.customer_id;
    jsData.orderId = row.order_id;
    jsData.f2b2bSourceId = row.f2b2b_source_id;
    jsData.signedDate = row.signed_date;
    jsData.effectiveDate = row.effective_date;
    jsData.endDate = row.end_date;
    jsData.collectability = row.collectability;
    jsData.status = row.status;
    jsData.currencyCode = row.currency_code;
    jsData.fxRate = Number(row.fx_rate || 1);
    jsData.fixedAmount = Number(row.fixed_amount || 0);
    jsData.variableAmount = Number(row.variable_amount || 0);
    jsData.variableConstraintPct = Number(row.variable_constraint_pct ?? 100);
    jsData.transactionPrice = Number(row.transaction_price || 0);
    jsData.allocatedTotal = Number(row.allocated_total || 0);
    jsData.recognizedTotal = Number(row.recognized_total || 0);
    jsData.deferredTotal = Number(row.deferred_total || 0);
    jsData.cancellationDate = row.cancellation_date;
    jsData.note = row.note;
    jsData.createdBy = row.created_by;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'rev_performance_obligations') {
    jsData.contractId = row.contract_id;
    jsData.code = row.code;
    jsData.name = row.name;
    jsData.obligationType = row.obligation_type;
    jsData.progressMethod = row.progress_method;
    jsData.standaloneSellingPrice = Number(row.standalone_selling_price || 0);
    jsData.allocationPct = Number(row.allocation_pct || 0);
    jsData.allocatedAmount = Number(row.allocated_amount || 0);
    jsData.revenueAccountCode = row.revenue_account_code;
    jsData.deferredAccountCode = row.deferred_account_code;
    jsData.satisfiedAt = row.satisfied_at;
    jsData.progressPct = Number(row.progress_pct || 0);
    jsData.recognizedAmount = Number(row.recognized_amount || 0);
    jsData.status = row.status;
    jsData.displayOrder = Number(row.display_order || 0);
    jsData.note = row.note;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'rev_price_allocations') {
    jsData.contractId = row.contract_id;
    jsData.obligationId = row.obligation_id;
    jsData.standaloneSellingPrice = Number(row.standalone_selling_price || 0);
    jsData.allocationPct = Number(row.allocation_pct || 0);
    jsData.allocatedFixed = Number(row.allocated_fixed || 0);
    jsData.allocatedVariable = Number(row.allocated_variable || 0);
    jsData.allocatedDiscount = Number(row.allocated_discount || 0);
    jsData.allocatedTotal = Number(row.allocated_total || 0);
    jsData.basis = row.basis;
    jsData.justification = row.justification;
    jsData.allocatedAt = row.allocated_at;
    jsData.allocatedBy = row.allocated_by;
    jsData.isSuperseded = !!row.is_superseded;
  } else if (tableName === 'rev_recognition') {
    jsData.obligationId = row.obligation_id;
    jsData.contractId = row.contract_id;
    jsData.periodId = row.period_id;
    jsData.recognitionDate = row.recognition_date;
    jsData.method = row.method;
    jsData.progressPct = Number(row.progress_pct || 0);
    jsData.recognizedAmount = Number(row.recognized_amount || 0);
    jsData.cumulativeRecognized = Number(row.cumulative_recognized || 0);
    jsData.remainingAmount = Number(row.remaining_amount || 0);
    jsData.breakagePct = row.breakage_pct;
    jsData.voucherId = row.voucher_id;
    jsData.status = row.status;
    jsData.reason = row.reason;
    jsData.createdBy = row.created_by;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'fs_reports') {
    jsData.reportCode = row.report_code;
    jsData.periodId = row.period_id;
    jsData.scope = row.scope;
    jsData.reportType = row.report_type;
    jsData.status = row.status;
    jsData.revisionNo = Number(row.revision_no || 1);
    jsData.preparedBy = row.prepared_by;
    jsData.preparedAt = row.prepared_at;
    jsData.approvedBy = row.approved_by;
    jsData.approvedAt = row.approved_at;
    jsData.submittedAt = row.submitted_at;
    jsData.contentHash = row.content_hash;
    jsData.note = row.note;
    jsData.createdAt = row.created_at;
    jsData.updatedAt = row.updated_at;
  } else if (tableName === 'fs_report_lines') {
    jsData.reportId = row.report_id;
    jsData.lineCode = row.line_code;
    jsData.lineName = row.line_name;
    jsData.displayOrder = Number(row.display_order || 0);
    jsData.indentLevel = Number(row.indent_level || 0);
    jsData.isBold = !!row.is_bold;
    jsData.isSection = !!row.is_section;
    jsData.isCustom = !!row.is_custom;
    jsData.currentAmount = row.current_amount;
    jsData.priorAmount = row.prior_amount;
    jsData.formula = row.formula;
    jsData.dataType = row.data_type;
    jsData.note = row.note;
    jsData.createdAt = row.created_at;
  } else if (tableName === 'fs_account_mappings') {
    jsData.reportCode = row.report_code;
    jsData.lineCode = row.line_code;
    jsData.accountCode = row.account_code;
    jsData.sign = row.sign;
    jsData.note = row.note;
    jsData.createdAt = row.created_at;
  } else if (tableName === 'journal_entries') {
    jsData.date = row.date;
    jsData.ref = row.ref;
    jsData.description = row.description;
    jsData.createdAt = row.created_at;
  } else if (tableName === 'wallet_transactions' || tableName === 'seller_transactions') {
    jsData.userId = row.seller_id;
    jsData.sellerId = row.seller_id;
    jsData.type = row.type;
    jsData.amount = Number(row.amount);
    jsData.referenceId = row.reference_id;
    jsData.gateway = row.reference_id;
    jsData.status = row.status;
    jsData.createdAt = row.created_at;
    jsData.timestamp = new Date(row.created_at).toLocaleString('vi-VN');
  } else if (tableName === 'admin_audit_logs' || tableName === 'tenant_audit_logs') {
    // GĐ 2.6 — trả camelCase chuẩn.
    // ⚠️ `timestamp` giữ nguyên kiểu ISO (KHÔNG format vi-VN): có nơi gọi
    //    `new Date(log.timestamp)`; format sẵn sẽ sinh "Invalid Date".
    // Trả CẢ 2 bộ khóa: chuẩn mới (actorEmail/actorUid) + cũ (email/userId)
    // để Settings.tsx (đọc `email`) và code mới đều chạy.
    jsData.email = row.email;
    jsData.actorEmail = row.email;
    jsData.userId = row.user_id;
    jsData.actorUid = row.user_id;
    jsData.action = row.action;
    jsData.status = row.status;
    jsData.details = row.details;
    jsData.ipAddress = row.ip_address;
    jsData.userAgent = row.user_agent;
    jsData.createdAt = row.created_at;
    // ⚠️ `timestamp` giữ nguyên ISO: có nơi gọi `new Date(log.timestamp)`.
    jsData.timestamp = row.created_at;
    // Các trường ngoài lề được writer nhét vào cột `data` → trả lại đủ.
    if (row.data && typeof row.data === 'object') Object.assign(jsData, row.data);
  }

  return jsData;
}

// -----------------------------------------------------------------------------
// Firestore Timestamp Compatibility Class
// -----------------------------------------------------------------------------
export class Timestamp {
  seconds: number;
  nanoseconds: number;

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate(): Date {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
  }

  toMillis(): number {
    return this.seconds * 1000 + this.nanoseconds / 1000000;
  }

  toISOString(): string {
    return this.toDate().toISOString();
  }

  static now(): Timestamp {
    const ms = Date.now();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
  }

  static fromMillis(ms: number): Timestamp {
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
  }

  static fromDate(date: Date): Timestamp {
    const ms = date.getTime();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
  }
}

// Helper functions for Date <-> Timestamp serialization
function deserializeTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Check if string matches ISO date format
    const isoDateRx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
    if (isoDateRx.test(obj)) {
      const date = new Date(obj);
      if (!isNaN(date.getTime())) {
        return Timestamp.fromDate(date);
      }
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(deserializeTimestamps);
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = deserializeTimestamps(obj[key]);
    }
    return res;
  }
  return obj;
}

function serializeTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Timestamp) {
    return obj.toDate().toISOString();
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (obj && typeof obj === 'object') {
    if (obj._methodName === 'serverTimestamp') {
      return new Date().toISOString();
    }
    if (Array.isArray(obj)) {
      return obj.map(serializeTimestamps);
    }
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = serializeTimestamps(obj[key]);
    }
    return res;
  }
  return obj;
}

// -----------------------------------------------------------------------------
// Database Query Interface and References
// -----------------------------------------------------------------------------
export interface QueryConstraint {
  type: 'where' | 'orderBy' | 'limit' | 'range' | 'ilike' | 'search';
  field?: string;
  op?: string;
  value?: any;
  direction?: 'asc' | 'desc';
}

export class SupabaseCollectionRef {
  tableName: string;
  tenantId?: string;

  constructor(tableName: string, tenantId?: string) {
    this.tableName = tableName;
    this.tenantId = tenantId;
  }

  get path(): string {
    return this.tenantId ? `tenants/${this.tenantId}/${this.tableName}` : this.tableName;
  }
}

export class SupabaseDocRef {
  tableName: string;
  id: string;
  tenantId?: string;

  constructor(tableName: string, id: string, tenantId?: string) {
    this.tableName = tableName;
    this.id = id;
    this.tenantId = tenantId;
  }

  get path(): string {
    return this.tenantId ? `tenants/${this.tenantId}/${this.tableName}/${this.id}` : `${this.tableName}/${this.id}`;
  }
}

export class SupabaseQuery {
  collectionRef: SupabaseCollectionRef;
  constraints: QueryConstraint[];

  constructor(collectionRef: SupabaseCollectionRef, constraints: QueryConstraint[]) {
    this.collectionRef = collectionRef;
    this.constraints = constraints;
  }

  get tableName(): string {
    return this.collectionRef.tableName;
  }

  get path(): string {
    return this.collectionRef.path;
  }
}

export const db = {
  // Dummy db object for Firebase compatibility
  __isSupabaseDummy: true
};

// -----------------------------------------------------------------------------
// Firebase Firestore Methods mapped to Supabase
// -----------------------------------------------------------------------------
export const doc = (dbRef: any, pathOrCollection: any, ...segments: string[]): SupabaseDocRef => {
  if (typeof pathOrCollection === 'string') {
    const table = pathOrCollection;
    const id = segments[0];
    return new SupabaseDocRef(table, id);
  } else if (pathOrCollection instanceof SupabaseCollectionRef) {
    return new SupabaseDocRef(pathOrCollection.tableName, segments[0], pathOrCollection.tenantId);
  }
  throw new Error('[SupabaseAdapter] doc() received invalid arguments');
};

export const collection = (dbRef: any, path: string, ...segments: string[]): SupabaseCollectionRef => {
  // Subcollection nesting support: mapping tenants/{id}/audit_logs to tenant_audit_logs
  if (path === 'tenants' && segments.length === 2 && segments[1] === 'audit_logs') {
    return new SupabaseCollectionRef('tenant_audit_logs', segments[0]);
  }
  return new SupabaseCollectionRef(path);
};

export const query = (colRef: SupabaseCollectionRef, ...constraints: QueryConstraint[]): SupabaseQuery => {
  return new SupabaseQuery(colRef, constraints);
};

export const where = (field: string, op: string, value: any): QueryConstraint => {
  return { type: 'where', field, op, value };
};

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint => {
  return { type: 'orderBy', field, direction };
};

export const limit = (value: number): QueryConstraint => {
  return { type: 'limit', value };
};

export const range = (from: number, to: number): QueryConstraint => {
  return { type: 'range', field: from.toString(), value: to };
};

export const ilike = (field: string, value: string): QueryConstraint => {
  return { type: 'ilike', field, value };
};

export const search = (queryText: string, fields: string[]): QueryConstraint => {
  return { type: 'search', field: fields.join(','), value: queryText };
};

export const arrayUnion = (...elements: any[]) => {
  return {
    _methodName: 'arrayUnion',
    elements
  };
};

export const serverTimestamp = () => {
  return {
    _methodName: 'serverTimestamp'
  };
};

// Internal query engine that maps constraints to Supabase filters
async function executeQuery(q: SupabaseQuery | SupabaseCollectionRef) {
  const tableName = q instanceof SupabaseCollectionRef ? q.tableName : q.tableName;
  let builder = supabase.from(getRealTableName(tableName)).select('*', { count: 'exact' });

  const constraints = q instanceof SupabaseQuery ? q.constraints : [];
  const tenantId = q instanceof SupabaseCollectionRef ? q.tenantId : q.collectionRef.tenantId;

  if (tenantId) {
    builder = builder.eq('tenant_id', tenantId);
  }

  for (const c of constraints) {
    if (c.type === 'where') {
      const field = c.field!;
      const op = c.op!;
      const value = c.value;
      const targetColumn = mapJsFieldToDbColumn(tableName, field);

      if (op === '==' || op === '===') {
        builder = builder.eq(targetColumn, value);
      } else if (op === '>') {
        builder = builder.gt(targetColumn, value);
      } else if (op === '>=') {
        builder = builder.gte(targetColumn, value);
      } else if (op === '<') {
        builder = builder.lt(targetColumn, value);
      } else if (op === '<=') {
        builder = builder.lte(targetColumn, value);
      } else if (op === 'in') {
        builder = builder.in(targetColumn, value);
      } else if (op === '!=' || op === '!==') {
        builder = builder.neq(targetColumn, value);
      } else if (op === 'array-contains') {
        if (RELATIONAL_TABLES.includes(tableName)) {
          builder = builder.contains(targetColumn, [value]);
        } else {
          builder = builder.contains(`data->${field}`, [value]);
        }
      }
    } else if (c.type === 'orderBy') {
      const field = c.field!;
      const ascending = c.direction === 'asc';
      const orderCol = mapJsFieldToDbColumn(tableName, field);
      builder = builder.order(orderCol, { ascending });
    } else if (c.type === 'limit') {
      builder = builder.limit(c.value!);
    } else if (c.type === 'range') {
      const from = parseInt(c.field!);
      const to = c.value as number;
      builder = builder.range(from, to);
    } else if (c.type === 'ilike') {
      const field = c.field!;
      const value = c.value as string;
      const targetColumn = mapJsFieldToDbColumn(tableName, field);
      builder = builder.ilike(targetColumn, `%${value}%`);
    } else if (c.type === 'search') {
      const fields = c.field!.split(',');
      const queryText = c.value as string;
      if (queryText && queryText.trim() !== '') {
        const orConditions = fields.map(f => {
          const col = mapJsFieldToDbColumn(tableName, f);
          return `${col}.ilike.%${queryText}%`;
        }).join(',');
        builder = builder.or(orConditions);
      }
    }
  }

  const { data, error, count } = await builder;
  if (error) {
    console.error(`[SupabaseAdapter] executeQuery failed for table ${tableName}:`, error);
    throw error;
  }
  return { data: data || [], count: count || 0 };
}

// Helper to write normalized journal entries and items with balance checks
async function saveJournalEntry(docId: string, serializedData: any, tenantId: any) {
  const items = serializedData.items;
  if (Array.isArray(items)) {
    const totalDebit = items.reduce((sum: number, item: any) => sum + (item.debit || 0), 0);
    const totalCredit = items.reduce((sum: number, item: any) => sum + (item.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Chứng từ kế toán mất cân đối Nợ / Có. Không thể ghi sổ!');
    }
  }

  // Check if period is locked
  const { data: settingsRow } = await supabase
    .from('tenant_settings')
    .select('data')
    .eq('id', 'config')
    .maybeSingle();
  const lockDateStr = settingsRow?.data?.closingLockDate;
  if (lockDateStr) {
    const lockDate = new Date(lockDateStr);
    const entryDate = new Date(serializedData.date || serializedData.dateStr || new Date());
    
    lockDate.setUTCHours(0, 0, 0, 0);
    entryDate.setUTCHours(0, 0, 0, 0);
    
    if (entryDate.getTime() <= lockDate.getTime()) {
      throw new Error(`Kỳ kế toán đã khóa sổ (Ngày khóa sổ: ${lockDate.toLocaleDateString('vi-VN')}). Không thể ghi nhận chứng từ vào ngày ${entryDate.toLocaleDateString('vi-VN')}!`);
    }
  }

  const { items: journalItems, ...mainEntry } = serializedData;
  const dbPayload = {
    id: docId,
    tenant_id: tenantId || mainEntry.tenantId || 'tenant-vcomm-prod-01',
    date: mainEntry.date || mainEntry.dateStr || new Date().toISOString(),
    ref: mainEntry.ref || null,
    description: mainEntry.description || null
  };

  const { error: entryError } = await supabase
    .from('journal_entries')
    .upsert(dbPayload);

  if (entryError) throw entryError;

  if (Array.isArray(journalItems)) {
    await supabase
      .from('journal_items')
      .delete()
      .eq('entry_id', docId);

    const itemsPayloads = journalItems.map((item: any) => ({
      entry_id: docId,
      account_id: item.accountId,
      debit: item.debit || 0,
      credit: item.credit || 0,
      partner_id: item.partnerId || null,
      tenant_id: tenantId || 'tenant-vcomm-prod-01'
    }));

    const { error: itemsError } = await supabase
      .from('journal_items')
      .insert(itemsPayloads);

    if (itemsError) throw itemsError;
  }
}

export const getDoc = async (docRef: SupabaseDocRef): Promise<any> => {
  const cacheKey = `fs_cache_doc_${docRef.path}`;
  try {
    const { data, error } = await supabase
      .from(getRealTableName(docRef.tableName))
      .select('*')
      .eq('id', docRef.id)
      .maybeSingle();

    if (error) throw error;

    const exists = !!data;
    let docData = null;
    if (exists) {
      if (RELATIONAL_TABLES.includes(docRef.tableName)) {
        docData = fromRelationalRow(docRef.tableName, data);
      } else {
        docData = data.data;
      }
    }

    if (exists) {
      if (docRef.tableName === 'journal_entries') {
        const { data: items, error: itemsError } = await supabase
          .from('journal_items')
          .select('*')
          .eq('entry_id', docRef.id);
        if (!itemsError && items) {
          docData.items = items.map((item: any) => ({
            accountId: item.account_id,
            debit: Number(item.debit),
            credit: Number(item.credit),
            partnerId: item.partner_id
          }));
        }
      }
      safeLocalStorage.setItem(cacheKey, JSON.stringify({ exists, data: docData }));
    }

    return {
      exists: () => exists,
      data: () => deserializeTimestamps(docData),
      id: docRef.id,
      ref: docRef
    };
  } catch (error: any) {
    console.warn(`[SupabaseAdapter] getDoc failed or timed out:`, error.message || error);
    const cached = safeLocalStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          exists: () => parsed.exists,
          data: () => deserializeTimestamps(parsed.data),
          id: docRef.id,
          ref: docRef
        };
      } catch (e) {
        log.debug('bỏ qua cache đọc doc (parse lỗi)', { path: docRef.path }, e);
      }
    }
    return {
      exists: () => false,
      data: () => undefined,
      id: docRef.id,
      ref: docRef
    };
  }
};

export const getDocFromServer = getDoc;

export const getDocs = async (queryRef: SupabaseQuery | SupabaseCollectionRef): Promise<any> => {
  const cacheKey = `fs_cache_docs_${queryRef.path}`;
  try {
    const { data: rows, count } = await executeQuery(queryRef);
    const docs = await Promise.all(rows.map(async (row) => {
      const rawData = RELATIONAL_TABLES.includes(queryRef.tableName)
        ? fromRelationalRow(queryRef.tableName, row)
        : row.data;
      const data = deserializeTimestamps(rawData);
      if (queryRef.tableName === 'journal_entries') {
        const { data: items, error: itemsError } = await supabase
          .from('journal_items')
          .select('*')
          .eq('entry_id', row.id);
        if (!itemsError && items) {
          data.items = items.map((item: any) => ({
            accountId: item.account_id,
            debit: Number(item.debit),
            credit: Number(item.credit),
            partnerId: item.partner_id
          }));
        }
      }
      return {
        id: row.id,
        data: () => data,
        exists: () => true
      };
    }));

    const cachedRows = rows.map(r => {
      const rowData = RELATIONAL_TABLES.includes(queryRef.tableName)
        ? fromRelationalRow(queryRef.tableName, r)
        : r.data;
      return { id: r.id, data: rowData };
    });
    safeLocalStorage.setItem(cacheKey, JSON.stringify(cachedRows));

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
      count,
      forEach: (cb: any) => docs.forEach(cb)
    };
  } catch (error: any) {
    console.warn(`[SupabaseAdapter] getDocs failed:`, error.message || error);
    const cached = safeLocalStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const docs = parsed.map((item: any) => ({
          id: item.id,
          data: () => deserializeTimestamps(item.data),
          exists: () => true
        }));
        return {
          docs,
          empty: docs.length === 0,
          size: docs.length,
          count: docs.length,
          forEach: (cb: any) => docs.forEach(cb)
        };
      } catch (e) {
        log.debug('bỏ qua cache đọc collection (parse lỗi)', { path: queryRef.path }, e);
      }
    }
    return {
      docs: [],
      empty: true,
      size: 0,
      count: 0,
      forEach: () => {}
    };
  }
};

async function handleOrderPaymentTrigger(orderId: string, orderData: any, tenantId: string | null) {
  if (orderData.status === 'paid' || orderData.paymentStatus === 'paid') {
    try {
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('order_id', orderId)
        .eq('status', 'success')
        .maybeSingle();

      if (!existing) {
        const paymentId = `pm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const amount = Number(orderData.total || orderData.totalPrice || 0);
        const paymentMethod = orderData.paymentMethod || 'vietqr';
        const transactionId = orderData.transactionId || `tx-${Date.now()}`;
        
        await supabase.from('payments').insert({
          id: paymentId,
          tenant_id: tenantId || 'tenant-vcomm-prod-01',
          order_id: orderId,
          amount: amount,
          payment_method: paymentMethod,
          transaction_id: transactionId,
          payment_gateway: 'sepay',
          status: 'success',
          created_at: new Date().toISOString()
        });
        console.log(`[Order-Payment-Trigger] Automatically recorded payment ${paymentId} for order ${orderId}`);
      }
    } catch (e) {
      // 🔴 FIX (pattern #74): trước đây chỉ console.error → mất THẦM LẶNG bản ghi
      // thanh toán (đơn đã lưu `paid` nhưng bảng `payments` không có dòng tương ứng,
      // gây hụt đối soát). Giờ báo rõ via reportWriteFailure (log + thông điệp
      // "chưa được lưu") thay vì nuốt lỗi. KHÔNG rethrow: hàm này chạy SAU khi
      // đơn đã upsert thành công, ném sẽ làm đơn được báo lỗi rồi user retry → lặp đơn.
      reportWriteFailure(`ghi nhận thanh toán đơn hàng ${orderId}`, e);
    }
  }
}

async function handleProductPriceHistoryTrigger(productId: string, newProductData: any, tenantId: string | null) {
  try {
    const { data: currentProduct } = await supabase
      .from('products')
      .select('price, cost_price')
      .eq('id', productId)
      .maybeSingle();

    if (currentProduct) {
      const oldPrice = Number(currentProduct.price || 0);
      const oldCostPrice = Number(currentProduct.cost_price || 0);
      
      const newPrice = Number(newProductData.price !== undefined ? newProductData.price : oldPrice);
      const newCostPrice = Number(newProductData.costPrice !== undefined ? newProductData.costPrice : (newProductData.cost_price !== undefined ? newProductData.cost_price : oldCostPrice));

      if (Math.abs(newPrice - oldPrice) > 0.01 || Math.abs(newCostPrice - oldCostPrice) > 0.01) {
        const historyId = `prh-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await supabase.from('product_price_history').insert({
          id: historyId,
          tenant_id: tenantId || 'tenant-vcomm-prod-01',
          product_id: productId,
          old_price: oldPrice,
          new_price: newPrice,
          old_cost_price: oldCostPrice,
          new_cost_price: newCostPrice,
          changed_by: 'system-pim-user',
          changed_at: new Date().toISOString()
        });
        console.log(`[Price-History-Trigger] Recorded price change for product ${productId}: Price ${oldPrice} -> ${newPrice}, Cost ${oldCostPrice} -> ${newCostPrice}`);
      }
    }
  } catch (e) {
    console.error('[Price-History-Trigger] Failed to record price change history:', e);
  }
}

export const setDoc = async (docRef: SupabaseDocRef, data: any, options?: any): Promise<any> => {
  const cacheKey = `fs_cache_doc_${docRef.path}`;
  try {
    const serializedData = serializeTimestamps(data);
    const tenantId = docRef.tenantId || data.tenantId || null;

    if (docRef.tableName === 'journal_entries') {
      await saveJournalEntry(docRef.id, serializedData, tenantId);
      return true;
    }

    const dbPayload = RELATIONAL_TABLES.includes(docRef.tableName)
      ? toRelationalPayload(docRef.tableName, docRef.id, tenantId, serializedData)
      : {
          id: docRef.id,
          tenant_id: tenantId,
          data: serializedData,
          updated_at: new Date().toISOString()
        };

    safeLocalStorage.setItem(cacheKey, JSON.stringify({ exists: true, data: serializedData }));

    if (docRef.tableName === 'products') {
      await handleProductPriceHistoryTrigger(docRef.id, serializedData, tenantId);
    }

    const { error } = await supabase
      .from(getRealTableName(docRef.tableName))
      .upsert(dbPayload);

    if (error) throw error;
    if (docRef.tableName === 'orders') {
      await handleOrderPaymentTrigger(docRef.id, serializedData, tenantId);
    }
    return true;
  } catch (error: any) {
    console.warn(`[SupabaseAdapter] setDoc failed:`, error.message || error);
    throw error;
  }
};

export const updateDoc = async (docRef: SupabaseDocRef, data: any): Promise<any> => {
  const cacheKey = `fs_cache_doc_${docRef.path}`;
  try {
    const cached = safeLocalStorage.getItem(cacheKey);
    let currentData: any = {};
    if (cached) {
      try { currentData = JSON.parse(cached).data; }
      catch (e) { log.debug('bỏ qua cache updateDoc (parse lỗi)', { path: docRef.path }, e); }
    } else {
      const selectFields = RELATIONAL_TABLES.includes(docRef.tableName) ? '*' : 'data';
      const { data: row } = await supabase
        .from(getRealTableName(docRef.tableName))
        .select(selectFields)
        .eq('id', docRef.id)
        .maybeSingle();
      if (row) {
        currentData = RELATIONAL_TABLES.includes(docRef.tableName)
          ? fromRelationalRow(docRef.tableName, row)
          : row.data;
      }
    }

    const mergedData = { ...currentData };
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val && typeof val === 'object' && val._methodName === 'arrayUnion') {
        const currentArray = Array.isArray(mergedData[key]) ? mergedData[key] : [];
        const newItems = serializeTimestamps(val.elements);
        const updatedArray = [...currentArray];
        for (const item of newItems) {
          if (!updatedArray.includes(item)) {
            updatedArray.push(item);
          }
        }
        mergedData[key] = updatedArray;
      } else {
        mergedData[key] = serializeTimestamps(val);
      }
    }

    const tenantId = docRef.tenantId || mergedData.tenantId || null;

    if (docRef.tableName === 'journal_entries') {
      await saveJournalEntry(docRef.id, mergedData, tenantId);
      return true;
    }

    const dbPayload = RELATIONAL_TABLES.includes(docRef.tableName)
      ? toRelationalPayload(docRef.tableName, docRef.id, tenantId, mergedData)
      : {
          id: docRef.id,
          tenant_id: tenantId,
          data: mergedData,
          updated_at: new Date().toISOString()
        };

    safeLocalStorage.setItem(cacheKey, JSON.stringify({ exists: true, data: mergedData }));

    if (docRef.tableName === 'products') {
      await handleProductPriceHistoryTrigger(docRef.id, mergedData, tenantId);
    }

    const { error } = await supabase
      .from(getRealTableName(docRef.tableName))
      .upsert(dbPayload);

    if (error) throw error;
    if (docRef.tableName === 'orders') {
      await handleOrderPaymentTrigger(docRef.id, mergedData, tenantId);
    }
    return true;
  } catch (error: any) {
    console.warn(`[SupabaseAdapter] updateDoc failed:`, error.message || error);
    throw error;
  }
};

export const addDoc = async (colRef: SupabaseCollectionRef, data: any): Promise<any> => {
  try {
    const id = data.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const docRef = new SupabaseDocRef(colRef.tableName, id, colRef.tenantId);
    await setDoc(docRef, { id, ...data });
    return docRef;
  } catch (error: any) {
    // ⚠️ GĐ 2.4 (pattern #84): trước đây bắt lỗi rồi TRẢ VỀ một ref GIẢ
    // (`mock-id-...`) → caller tưởng ghi thành công, nhưng Supabase thực sự
    // thất bại → MẤT ÂM THẦM mọi bản ghi tạo bằng addDoc (giao dịch tài chính,
    // bút toán ví, đơn hàng...). Giờ NÉM lại cho khớp với setDoc/updateDoc:
    // caller phải biết để báo lỗi / retry, không được giả "xong".
    console.warn(`[SupabaseAdapter] addDoc failed:`, error.message || error);
    throw error;
  }
};

export const deleteDoc = async (docRef: SupabaseDocRef): Promise<any> => {
  const cacheKey = `fs_cache_doc_${docRef.path}`;
  try {
    safeLocalStorage.removeItem(cacheKey);
    const { error } = await supabase
      .from(getRealTableName(docRef.tableName))
      .delete()
      .eq('id', docRef.id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[SupabaseAdapter] deleteDoc failed:', e);
    return false;
  }
};

export const onSnapshot = (
  queryRef: SupabaseQuery | SupabaseCollectionRef | SupabaseDocRef, 
  nextOrObserver: any, 
  errorCallback?: any
) => {
  const next = typeof nextOrObserver === 'function' ? nextOrObserver : nextOrObserver.next;
  const errorHandler = typeof nextOrObserver === 'function' ? errorCallback : nextOrObserver.error;

  if (queryRef instanceof SupabaseDocRef) {
    const docRef = queryRef;
    const cacheKey = `fs_cache_doc_${docRef.path}`;
    
    // 1. Initial cached render
    const cached = safeLocalStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setTimeout(() => {
          try {
            next({
              exists: () => parsed.exists,
              data: () => deserializeTimestamps(parsed.data),
              id: docRef.id,
              ref: docRef
            });
          } catch (e) {
            log.debug('lỗi khi phát snapshot doc đã cache', { path: docRef.path }, e);
          }
        }, 0);
      } catch (e) {
        log.debug('bỏ qua cache snapshot doc (parse lỗi)', { path: docRef.path }, e);
      }
    }

    // 2. Fetch fresh data right away
    getDoc(docRef).then((snap) => {
      next(snap);
    }).catch((err) => {
      if (errorHandler) errorHandler(err);
    });

    // 3. Subscribe to Realtime Postgres Changes
    const tableName = docRef.tableName;
    const channel = supabase
      .channel(`realtime-doc-${tableName}-${docRef.id}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName, filter: `id=eq.${docRef.id}` }, async () => {
        try {
          const snap = await getDoc(docRef);
          next(snap);
        } catch (err) {
          if (errorHandler) errorHandler(err);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  const cacheKey = `fs_cache_docs_${queryRef.path}`;

  // 1. Initial cached render
  const cached = safeLocalStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const docs = parsed.map((item: any) => ({
        id: item.id,
        data: () => deserializeTimestamps(item.data),
        exists: () => true
      }));
      setTimeout(() => {
        try {
          next({
            docs,
            empty: docs.length === 0,
            size: docs.length,
            forEach: (cb: any) => docs.forEach(cb)
          });
        } catch (e) {
          log.debug('lỗi khi phát snapshot collection đã cache', { path: queryRef.path }, e);
        }
      }, 0);
    } catch (e) {
      log.debug('bỏ qua cache snapshot collection (parse lỗi)', { path: queryRef.path }, e);
    }
  }

  // 2. Fetch fresh data right away
  getDocs(queryRef).then((snap) => {
    next(snap);
  }).catch((err) => {
    if (errorHandler) errorHandler(err);
  });

  // 3. Subscribe to Realtime Postgres Changes
  const tableName = queryRef instanceof SupabaseCollectionRef ? queryRef.tableName : queryRef.collectionRef.tableName;

  const channel = supabase
    .channel(`realtime-${tableName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, async () => {
      try {
        const snap = await getDocs(queryRef);
        next(snap);
      } catch (err) {
        if (errorHandler) errorHandler(err);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const handleFirestoreError = (error: any, operationType: string, path: string | null = null): never => {
  throw error;
};

// -----------------------------------------------------------------------------
// Authentication Compatibility Interface
// -----------------------------------------------------------------------------
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL?: string | null;
}

let _currentUser: User | null = null;
const authStateCallbacks = new Set<(user: User | null) => void>();

// Synchronize auth state using Supabase Auth Listener
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    _currentUser = {
      uid: session.user.id,
      email: session.user.email ?? null,
      displayName: session.user.user_metadata?.displayName ?? session.user.email ?? null,
      emailVerified: !!session.user.email_confirmed_at,
      photoURL: session.user.user_metadata?.avatar_url ?? null
    };
  } else {
    _currentUser = null;
  }
  for (const cb of authStateCallbacks) {
    cb(_currentUser);
  }
});

export const auth = {
  get currentUser() {
    return _currentUser;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    _currentUser = null;
  }
};

export const onAuthStateChanged = (authObj: any, callback: (user: User | null) => void) => {
  // Trigger callback with current value immediately
  callback(_currentUser);
  authStateCallbacks.add(callback);
  return () => {
    authStateCallbacks.delete(callback);
  };
};

export const signIn = async (authObj: any, email: string, password: any) => {
  let data: any = null;
  try {
    const res = await supabase.auth.signInWithPassword({ email, password });
    data = res.data;
    if (res.error) throw res.error;
  } catch (error: any) {
    const customError = new Error(error.message || 'fetch failed') as any;
    // Network/unreachable errors (e.g. unreachable Supabase host) must not be
    // treated as an invalid credential, so offline fallback logins stay possible.
    if (
      error?.name === 'AuthRetryableFetchError' ||
      error?.name === 'AuthUnknownError' ||
      error?.status === 0 ||
      /fetch failed|network|ENOTFOUND|ECONNREFUSED|Failed to fetch/i.test(error?.message || '')
    ) {
      customError.code = 'auth/network-request-failed';
    } else {
      customError.code = 'auth/invalid-credential';
    }
    throw customError;
  }
  
  if (data.user) {
    _currentUser = {
      uid: data.user.id,
      email: data.user.email ?? null,
      displayName: data.user.user_metadata?.displayName ?? data.user.email ?? null,
      emailVerified: !!data.user.email_confirmed_at
    };
  }
  return { user: _currentUser };
};

export const createUser = async (authObj: any, email: string, password: any) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    const customError = new Error(error.message) as any;
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      customError.code = 'auth/email-already-in-use';
    } else {
      customError.code = 'auth/weak-password';
    }
    throw customError;
  }
  
  const createdUser = data.user ? {
    uid: data.user.id,
    email: data.user.email ?? null,
    displayName: data.user.user_metadata?.displayName ?? data.user.email ?? null,
    emailVerified: !!data.user.email_confirmed_at
  } : null;
  
  return { user: createdUser };
};

export const logout = () => auth.signOut();

export class GoogleAuthProvider {
  addScope(scope: string) {}
  static credentialFromResult(result: any) {
    return {
      accessToken: 'mock-google-access-token-12345'
    };
  }
}

export const googleProvider = new GoogleAuthProvider();

export const signInWithPopup = async (authObj: any, providerObj: any) => {
  // Trigger oauth login
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) throw error;
  return {
    user: {
      email: _currentUser?.email || 'admin@v-erp.com',
      uid: _currentUser?.uid || 'mock-google-uid'
    }
  };
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) throw error;
  return data;
};

export const getAuth = () => auth;

// -----------------------------------------------------------------------------
// Wallet & Finance Helpers
// -----------------------------------------------------------------------------
export const updateWalletBalance = async (
  sellerId: string, 
  amount: number, 
  transactionData: {
    type: 'deposit' | 'withdraw' | 'payment' | 'refund' | 'payout',
    gateway: string,
    status: 'pending' | 'success' | 'failed'
  }
) => {
  try {
    // 1. Get current seller
    const sellerRef = doc(db, 'sellers', sellerId);
    const sellerSnap = await getDoc(sellerRef);
    if (!sellerSnap.exists()) {
      throw new Error('Seller not found');
    }
    
    const sellerData = sellerSnap.data();
    const currentBalance = Number(sellerData.walletBalance) || 0;
    const newBalance = currentBalance + amount;
    
    // Check if sufficient balance for withdrawal
    if (newBalance < 0) {
      throw new Error('Insufficient wallet balance');
    }
    
    // 2. Add transaction record
    // 🔴 FIX (pattern #61/#84): lưu ĐÚNG dấu của `amount`, KHÔNG dùng Math.abs.
    // Trước đây rút 500k lưu `amount: 500000` (dương) dù số dư giảm 500k → tổng
    // `wallet_transactions` LỆCH DẤU so với `sellers.walletBalance` (sai sổ phụ,
    // không đối chiếu được). `type` ('withdraw'/'refund'/'payout') đã mã hoá
    // hướng, nên lưu số có dấu là đủ và đúng.
    // ⚠️ ATOMICITY: bước này (addDoc txn) chạy TRƯỚC bước 3 (updateDoc số dư),
    // không có transaction → nếu ghi số dư lỗi sẽ để lại chứng từ ma. Cần đưa
    // vào Firestore `runTransaction` (hoặc Supabase RPC) — ĐỂ DBA xử lý.
    const txnRef = collection(db, 'wallet_transactions');
    const newTxn = await addDoc(txnRef, {
      userId: sellerId,
      amount,
      type: transactionData.type,
      gateway: transactionData.gateway,
      status: transactionData.status,
      timestamp: new Date().toLocaleString('vi-VN'),
      createdAt: new Date().toISOString()
    });
    
    // 3. Update seller balance (Only if transaction is successful or pending withdrawal that locks balance)
    if (transactionData.status === 'success' || (transactionData.type === 'withdraw' && transactionData.status === 'pending')) {
      await updateDoc(sellerRef, {
        walletBalance: newBalance
      });
    }
    
    return newTxn;
  } catch (err) {
    console.error('Error updating wallet balance:', err);
    throw err;
  }
};

export async function recordPartnerLedgerEntry(params: {
  tenantId?: string | null;
  partnerId: string;
  partnerType: 'seller' | 'supplier' | 'agent';
  refType: 'settlement' | 'order' | 'withdrawal' | 'purchase';
  refId: string;
  debit: number;
  credit: number;
}) {
  try {
    const { tenantId, partnerId, partnerType, refType, refId, debit, credit } = params;
    
    const { data: lastRecord } = await supabase
      .from('partner_ledgers')
      .select('balance')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousBalance = Number(lastRecord?.balance || 0);
    const newBalance = previousBalance + credit - debit;

    const entryId = `ple-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const { error: insertErr } = await supabase
      .from('partner_ledgers')
      .insert({
        id: entryId,
        tenant_id: tenantId || 'tenant-vcomm-prod-01',
        partner_id: partnerId,
        partner_type: partnerType,
        ref_type: refType,
        ref_id: refId,
        debit: debit,
        credit: credit,
        balance: newBalance,
        created_at: new Date().toISOString()
      });

    if (insertErr) throw insertErr;
    console.log(`[Partner-Ledger] Recorded entry ${entryId} for partner ${partnerId}: Debit ${debit}, Credit ${credit}, Balance ${newBalance}`);
    return newBalance;
  } catch (e) {
    console.error('[Partner-Ledger] Failed to record ledger entry:', e);
    throw e;
  }
}
