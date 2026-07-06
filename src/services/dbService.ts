import { supabase } from '../lib/supabase';
import { safeLocalStorage } from '../lib/storage';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

// -----------------------------------------------------------------------------
// Relational Database Mapping Configuration & Helpers
// -----------------------------------------------------------------------------
export const RELATIONAL_TABLES = ['products', 'customers', 'orders', 'warehouse_stock', 'sellers', 'settlements', 'payments', 'product_price_history', 'partner_ledgers', 'loyalty_points_ledger', 'support_tickets', 'combos', 'combo_items', 'group_buy_sessions', 'stock_vouchers', 'stock_voucher_items', 'journal_entries', 'wallet_transactions', 'seller_transactions'];

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
    payload.combo_id = jsData.comboId || jsData.combo_id || null;
    payload.status = jsData.status || 'open';
    payload.min_qty = Number(jsData.minQty || jsData.min_qty) || 10;
    payload.current_qty = Number(jsData.currentQty || jsData.current_qty) || 0;
    payload.end_time = jsData.endTime || jsData.end_time || null;
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
    jsData.image = row.image_url; // Map to both image and imageUrl for frontend compatibility
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
    jsData.comboId = row.combo_id;
    jsData.status = row.status;
    jsData.minQty = Number(row.min_qty || 0);
    jsData.currentQty = Number(row.current_qty || 0);
    jsData.endTime = row.end_time;
    jsData.createdAt = row.created_at;
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
      } catch (e) {}
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
      } catch (e) {}
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
      console.error('[Order-Payment-Trigger] Failed to check/record payment:', e);
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
      try { currentData = JSON.parse(cached).data; } catch (e) {}
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
    console.warn(`[SupabaseAdapter] addDoc failed:`, error.message || error);
    return {
      id: `mock-id-${Date.now()}`,
      path: `${colRef.tableName}/mock-id-${Date.now()}`
    };
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
          } catch (e) {}
        }, 0);
      } catch (e) {}
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
        } catch (e) {}
      }, 0);
    } catch (e) {}
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const customError = new Error(error.message) as any;
    customError.code = 'auth/invalid-credential';
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
    const txnRef = collection(db, 'wallet_transactions');
    const newTxn = await addDoc(txnRef, {
      userId: sellerId,
      amount: Math.abs(amount),
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
