import {
  db, collection, doc, getDocs, getDoc, setDoc, updateDoc,
  query, where,
} from './dbService';
import type {
  DropshipPartner,
  DropshipListing,
  DropshipOrder,
  DropshipOrderItem,
  DropshipOrderStatus,
  DropshipMarginEntry,
  DropshipChannel,
} from '../types/erp';

/**
 * TRỤ CỘT 1 (phần DROPSHIP) — DROPSHIP — spec 017
 *
 * KHÁC AFFILIATE — đây là hai mô hình, giữ hai bộ bảng riêng:
 *   - Affiliate: NGƯỜI GIỚI THIỆU. Không bán, không đặt giá, không chạm kho,
 *     không chạm giao hàng. Thu nhập = HOA HỒNG trên đơn VComm tự chốt.
 *   - Dropship : NGƯỜI BÁN. Tự niêm yết và bán trên kênh của họ (Shopee /
 *     Lazada / TikTok Shop / website riêng), tự đặt giá bán, ăn CHÊNH LỆCH.
 *     VComm giữ kho, lấy hàng, đóng gói, giao hàng và thu hộ COD.
 *
 * Vòng đời đơn dropship (phần fulfill mà Affiliate không có):
 *   pending ──(giữ được kho)──> stock_reserved ──> picking ──> shipping
 *                                                              │
 *                                        ┌─────────────────────┴────────┐
 *                                     delivered                      returned
 *                                        │                              │
 *                                     settled                      cancelled
 *   pending / stock_reserved / picking ──(hết kho, khách huỷ)──> cancelled
 *
 * Tiền — quy ước tính margin (quan trọng, dùng thống nhất toàn module):
 *   revenue      = Σ (unitPrice × quantity)        — tiền bán hàng
 *   totalCost    = Σ (unitCost  × quantity)        — vốn hàng VComm xuất
 *   grossMargin  = revenue − totalCost             — chênh lệch gộp
 *   codAmount    = revenue + shippingFee           — số VComm thu hộ khách
 *   Phí ship là khoản THU HỘ CHI HỘ: đối tác thu của khách, không tính vào
 *   margin. Nếu phí ship thực tế lệch, xử lý bằng bút toán `adjustment`.
 *   partnerMargin = grossMargin × marginSplit
 *   vcommMargin   = grossMargin − partnerMargin
 */

const DEFAULT_TENANT = 'tenant-vcomm-prod-01';

const ALLOWED_TRANSITIONS: Record<DropshipOrderStatus, DropshipOrderStatus[]> = {
  pending:        ['stock_reserved', 'cancelled'],
  stock_reserved: ['picking', 'cancelled'],
  picking:        ['shipping', 'cancelled'],
  shipping:       ['delivered', 'returned'],
  delivered:      ['settled'],
  settled:        [],
  cancelled:      [],
  returned:       ['cancelled'],
};

export class DropshipError extends Error {
  constructor(message: string, public readonly code: string = 'DROPSHIP_ERROR') {
    super(message);
    this.name = 'DropshipError';
  }
}

function assertTransition(from: DropshipOrderStatus, to: DropshipOrderStatus): void {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new DropshipError(
      `Không thể chuyển đơn dropship từ "${from}" sang "${to}".`,
      'INVALID_TRANSITION'
    );
  }
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// -----------------------------------------------------------------------------
// TÍNH TIỀN
// -----------------------------------------------------------------------------

export interface OrderFinancials {
  revenue: number;
  totalCost: number;
  grossMargin: number;
  partnerMargin: number;
  vcommMargin: number;
  codAmount: number;
  quantity: number;
  itemCount: number;
}

/**
 * Tính tiền cho một đơn dropship.
 * `marginSplit` là tỉ lệ chênh lệch đối tác được hưởng (0..1).
 */
export function computeOrderFinancials(
  items: DropshipOrderItem[],
  shippingFee: number,
  marginSplit: number,
  codAmountOverride?: number
): OrderFinancials {
  let revenue = 0;
  let totalCost = 0;
  let quantity = 0;

  for (const it of items) {
    const q = Number(it.quantity) || 0;
    revenue += (Number(it.unitPrice) || 0) * q;
    totalCost += (Number(it.unitCost) || 0) * q;
    quantity += q;
  }

  const fee = Number(shippingFee) || 0;
  const grossMargin = revenue - totalCost;

  // Kẹp tỉ lệ về [0,1] — dữ liệu đối tác có thể bị nhập sai
  const split = Math.min(1, Math.max(0, Number(marginSplit) || 0));
  const partnerMargin = grossMargin * split;

  return {
    revenue,
    totalCost,
    grossMargin,
    partnerMargin,
    vcommMargin: grossMargin - partnerMargin,
    codAmount: codAmountOverride != null ? Number(codAmountOverride) : revenue + fee,
    quantity,
    itemCount: items.length,
  };
}

/** Chênh lệch trên mỗi đơn vị niêm yết — dùng để hiển thị trước khi có đơn */
export function computeListingUnitMargin(listing: Pick<DropshipListing, 'listedPrice' | 'baseCost' | 'shippingFee'>): number {
  return (Number(listing.listedPrice) || 0) - (Number(listing.baseCost) || 0);
}

// -----------------------------------------------------------------------------
// ĐỐI TÁC DROPSHIP
// -----------------------------------------------------------------------------

export async function listPartners(
  tenantId: string = DEFAULT_TENANT,
  status?: DropshipPartner['status']
): Promise<DropshipPartner[]> {
  const constraints: any[] = [where('tenantId', '==', tenantId)];
  if (status) constraints.push(where('status', '==', status));

  const snap = await getDocs(query(collection(db, 'dropship_partners'), ...constraints));
  return snap.docs
    .map((d: any) => ({ ...(d.data() as DropshipPartner), id: d.id }))
    .sort((a: DropshipPartner, b: DropshipPartner) => (a.name || '').localeCompare(b.name || ''));
}

export async function getPartner(
  partnerId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<DropshipPartner | null> {
  const snap = await getDoc(doc(db, 'dropship_partners', partnerId));
  if (!snap || typeof snap.exists !== 'function' || !snap.exists()) return null;
  const data = snap.data() as DropshipPartner | undefined;
  if (!data) return null;
  if (data.tenantId && data.tenantId !== tenantId) return null;
  return { ...data, id: snap.id };
}

export type CreatePartnerInput = Omit<DropshipPartner, 'id' | 'outstandingCod' | 'createdAt' | 'updatedAt'>;

export async function createPartner(input: CreatePartnerInput): Promise<DropshipPartner> {
  const tenantId = input.tenantId || DEFAULT_TENANT;

  if (!input.code?.trim()) throw new DropshipError('Mã đối tác bắt buộc.', 'MISSING_CODE');
  if (!input.name?.trim()) throw new DropshipError('Tên đối tác bắt buộc.', 'MISSING_NAME');

  const split = input.marginSplit ?? 0.8;
  if (split < 0 || split > 1) {
    throw new DropshipError('Tỉ lệ chia chênh lệch phải nằm trong khoảng 0–1.', 'INVALID_SPLIT');
  }

  const now = new Date().toISOString();
  const id = newId('dsp');
  const partner: DropshipPartner = {
    ...input,
    id,
    tenantId,
    channels: input.channels ?? [],
    marginSplit: split,
    outstandingCod: 0,
    status: input.status || 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'dropship_partners', id), partner);
  return partner;
}

export async function updatePartner(
  partnerId: string,
  patch: Partial<DropshipPartner>,
  tenantId: string = DEFAULT_TENANT
): Promise<DropshipPartner> {
  const existing = await getPartner(partnerId, tenantId);
  if (!existing) throw new DropshipError('Đối tác dropship không tồn tại.', 'NOT_FOUND');

  if (patch.marginSplit != null && (patch.marginSplit < 0 || patch.marginSplit > 1)) {
    throw new DropshipError('Tỉ lệ chia chênh lệch phải nằm trong khoảng 0–1.', 'INVALID_SPLIT');
  }

  await updateDoc(doc(db, 'dropship_partners', partnerId), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
  return { ...existing, ...patch, id: partnerId };
}

/**
 * Khoá một đối tác. Các listing đang mở bị gỡ khỏi kênh (delisted) để tránh
 * nhận đơn mới trong khi đối tác bị tạm ngưng.
 */
export async function suspendPartner(
  partnerId: string,
  reason: string,
  tenantId: string = DEFAULT_TENANT
): Promise<{ delisted: number }> {
  await updatePartner(partnerId, { status: 'suspended' }, tenantId);

  const listings = await listListings(tenantId, partnerId);
  let delisted = 0;
  for (const l of listings) {
    if (l.status === 'active' || l.status === 'paused') {
      await updateListing(l.id, { status: 'delisted' }, tenantId);
      delisted += 1;
    }
  }
  void reason;
  return { delisted };
}

// -----------------------------------------------------------------------------
// LISTING — sản phẩm VComm niêm yết trên kênh của đối tác
// -----------------------------------------------------------------------------

export async function listListings(
  tenantId: string = DEFAULT_TENANT,
  partnerId?: string,
  status?: DropshipListing['status']
): Promise<DropshipListing[]> {
  const constraints: any[] = [where('tenantId', '==', tenantId)];
  if (partnerId) constraints.push(where('partnerId', '==', partnerId));
  if (status) constraints.push(where('status', '==', status));

  const snap = await getDocs(query(collection(db, 'dropship_listings'), ...constraints));
  return snap.docs
    .map((d: any) => ({ ...(d.data() as DropshipListing), id: d.id }))
    .sort((a: DropshipListing, b: DropshipListing) => (a.productName || '').localeCompare(b.productName || ''));
}

export async function getListing(
  listingId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<DropshipListing | null> {
  const snap = await getDoc(doc(db, 'dropship_listings', listingId));
  if (!snap || typeof snap.exists !== 'function' || !snap.exists()) return null;
  const data = snap.data() as DropshipListing | undefined;
  if (!data) return null;
  if (data.tenantId && data.tenantId !== tenantId) return null;
  return { ...data, id: snap.id };
}

export type CreateListingInput = Omit<DropshipListing, 'id' | 'stockSynced' | 'syncedAt' | 'createdAt' | 'updatedAt'>;

export async function createListing(input: CreateListingInput): Promise<DropshipListing> {
  const tenantId = input.tenantId || DEFAULT_TENANT;

  if (!input.productId?.trim()) throw new DropshipError('Sản phẩm bắt buộc.', 'MISSING_PRODUCT');

  // Chặn phá giá: giá niêm yết không được dưới giá sàn do VComm ấn định.
  const minPrice = Number(input.minSellingPrice) || 0;
  if (minPrice > 0 && Number(input.listedPrice) < minPrice) {
    throw new DropshipError(
      `Giá niêm yết (${input.listedPrice}) không được thấp hơn giá sàn (${minPrice}).`,
      'BELOW_FLOOR_PRICE'
    );
  }

  const now = new Date().toISOString();
  const id = newId('dsl');
  const listing: DropshipListing = {
    ...input,
    id,
    tenantId,
    channel: input.channel || 'other',
    stockSynced: 0,
    syncedAt: null,
    status: input.status || 'draft',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'dropship_listings', id), listing);
  return listing;
}

export async function updateListing(
  listingId: string,
  patch: Partial<DropshipListing>,
  tenantId: string = DEFAULT_TENANT
): Promise<DropshipListing> {
  const existing = await getListing(listingId, tenantId);
  if (!existing) throw new DropshipError('Listing không tồn tại.', 'NOT_FOUND');

  const nextListed = patch.listedPrice ?? existing.listedPrice;
  const nextFloor = patch.minSellingPrice ?? existing.minSellingPrice;
  if (nextFloor > 0 && nextListed < nextFloor) {
    throw new DropshipError(
      `Giá niêm yết (${nextListed}) không được thấp hơn giá sàn (${nextFloor}).`,
      'BELOW_FLOOR_PRICE'
    );
  }

  await updateDoc(doc(db, 'dropship_listings', listingId), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
  return { ...existing, ...patch, id: listingId };
}

/** Đẩy tồn kho an toàn (trừ phần đã giữ và tồn an toàn) sang kênh ngoài */
export async function syncListingStock(
  listingId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<DropshipListing> {
  const listing = await getListing(listingId, tenantId);
  if (!listing) throw new DropshipError('Listing không tồn tại.', 'NOT_FOUND');

  const available = await getAvailableStock(listing.productId, tenantId);
  return updateListing(listingId, {
    stockSynced: Math.max(0, available),
    syncedAt: new Date().toISOString(),
  }, tenantId);
}

// -----------------------------------------------------------------------------
// TỒN KHO — giữ / nhả (chống oversell)
// -----------------------------------------------------------------------------

interface StockRow {
  id: string;
  warehouseId?: string | null;
  quantity: number;
  safetyStock: number;
  allocated: number;
}

/** Tồn có thể bán = quantity − safety_stock − allocated */
function availableOf(row: StockRow): number {
  return Math.max(0, (Number(row.quantity) || 0) - (Number(row.safetyStock) || 0) - (Number(row.allocated) || 0));
}

async function loadStockRows(productId: string, tenantId: string): Promise<StockRow[]> {
  const snap = await getDocs(query(
    collection(db, 'warehouse_stock'),
    where('tenantId', '==', tenantId),
    where('productId', '==', productId)
  ));
  return snap.docs.map((d: any) => {
    const data = d.data() || {};
    return {
      id: d.id,
      warehouseId: data.warehouseId ?? data.warehouse_id ?? null,
      quantity: Number(data.quantity) || 0,
      safetyStock: Number(data.safetyStock ?? data.safety_stock) || 0,
      allocated: Number(data.allocated) || 0,
    };
  });
}

/** Tồn có thể bán của một sản phẩm trên toàn bộ kho */
export async function getAvailableStock(productId: string, tenantId: string = DEFAULT_TENANT): Promise<number> {
  const rows = await loadStockRows(productId, tenantId);
  return rows.reduce((sum, r) => sum + availableOf(r), 0);
}

/** Kiểm tra nhanh: có đủ tồn cho giỏ items không */
export async function checkStock(
  items: DropshipOrderItem[],
  tenantId: string = DEFAULT_TENANT
): Promise<{ ok: boolean; shortages: Array<{ productId: string; need: number; available: number }> }> {
  const need = new Map<string, number>();
  for (const it of items) {
    need.set(it.productId, (need.get(it.productId) || 0) + (Number(it.quantity) || 0));
  }

  const shortages: Array<{ productId: string; need: number; available: number }> = [];
  for (const [productId, qty] of need) {
    const available = await getAvailableStock(productId, tenantId);
    if (available < qty) shortages.push({ productId, need: qty, available });
  }
  return { ok: shortages.length === 0, shortages };
}

/**
 * Giữ kho cho đơn: cộng `allocated` tại các kho, ưu tiên kho còn nhiều tồn nhất.
 * Chỉ giữ khi TẤT CẢ sản phẩm đều đủ — tránh giữ lẻ gây kẹt kho.
 */
async function reserveStock(
  items: DropshipOrderItem[],
  tenantId: string
): Promise<void> {
  const { ok, shortages } = await checkStock(items, tenantId);
  if (!ok) {
    const detail = shortages
      .map(s => `SP ${s.productId}: cần ${s.need}, có ${s.available}`)
      .join('; ');
    throw new DropshipError(`Không đủ tồn kho để giữ hàng. ${detail}`, 'INSUFFICIENT_STOCK');
  }

  for (const it of items) {
    let remaining = Number(it.quantity) || 0;
    if (remaining <= 0) continue;

    const rows = (await loadStockRows(it.productId, tenantId))
      .filter(r => availableOf(r) > 0)
      .sort((a, b) => availableOf(b) - availableOf(a));

    for (const row of rows) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, availableOf(row));
      await updateDoc(doc(db, 'warehouse_stock', row.id), {
        allocated: (Number(row.allocated) || 0) + take,
        updatedAt: new Date().toISOString(),
      });
      remaining -= take;
    }
  }
}

/** Nhả kho: trừ ngược `allocated` khi đơn bị huỷ */
async function releaseStock(
  items: DropshipOrderItem[],
  tenantId: string
): Promise<void> {
  for (const it of items) {
    let remaining = Number(it.quantity) || 0;
    if (remaining <= 0) continue;

    const rows = (await loadStockRows(it.productId, tenantId))
      .filter(r => (Number(r.allocated) || 0) > 0)
      .sort((a, b) => (Number(b.allocated) || 0) - (Number(a.allocated) || 0));

    for (const row of rows) {
      if (remaining <= 0) break;
      const give = Math.min(remaining, Number(row.allocated) || 0);
      await updateDoc(doc(db, 'warehouse_stock', row.id), {
        allocated: Math.max(0, (Number(row.allocated) || 0) - give),
        updatedAt: new Date().toISOString(),
      });
      remaining -= give;
    }
  }
}

// -----------------------------------------------------------------------------
// ĐƠN DROPSHIP
// -----------------------------------------------------------------------------

export async function listOrders(
  tenantId: string = DEFAULT_TENANT,
  status?: DropshipOrderStatus,
  partnerId?: string
): Promise<DropshipOrder[]> {
  const constraints: any[] = [where('tenantId', '==', tenantId)];
  if (status) constraints.push(where('status', '==', status));
  if (partnerId) constraints.push(where('partnerId', '==', partnerId));

  const snap = await getDocs(query(collection(db, 'dropship_orders'), ...constraints));
  return snap.docs
    .map((d: any) => ({ ...(d.data() as DropshipOrder), id: d.id }))
    .sort((a: DropshipOrder, b: DropshipOrder) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getOrder(
  orderId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<DropshipOrder | null> {
  const snap = await getDoc(doc(db, 'dropship_orders', orderId));
  if (!snap || typeof snap.exists !== 'function' || !snap.exists()) return null;
  const data = snap.data() as DropshipOrder | undefined;
  if (!data) return null;
  if (data.tenantId && data.tenantId !== tenantId) return null;
  return { ...data, id: snap.id };
}

export interface CreateOrderInput {
  tenantId?: string;
  partnerId: string;
  externalOrderCode: string;
  channel: DropshipChannel;
  items: DropshipOrderItem[];
  shippingFee?: number;
  codAmount?: number;
  buyerName?: string;
  buyerPhone?: string;
  shippingAddress?: string;
  shippingProvinceCode?: string;
}

/**
 * Nhận đơn từ kênh của đối tác.
 *
 * Đơn được tạo ở trạng thái `pending`, sau đó tự động giữ kho:
 *   - Đủ hàng  → `stock_reserved`
 *   - Thiếu hàng → giữ nguyên `pending`, trả về `stockShortages` để điều phối viên
 *     xử lý (đặt bổ sung hoặc huỷ). Không tự huỷ, vì có thể chờ nhập kho.
 *
 * Chống trùng: mỗi (channel, externalOrderCode) chỉ nhận một lần.
 */
export async function createOrder(input: CreateOrderInput): Promise<{
  order: DropshipOrder;
  reserved: boolean;
  stockShortages: Array<{ productId: string; need: number; available: number }>;
}> {
  const tenantId = input.tenantId || DEFAULT_TENANT;

  const partner = await getPartner(input.partnerId, tenantId);
  if (!partner) throw new DropshipError('Đối tác dropship không tồn tại.', 'PARTNER_NOT_FOUND');
  if (partner.status !== 'active') {
    throw new DropshipError(
      `Đối tác đang ở trạng thái "${partner.status}", không thể nhận đơn mới.`,
      'PARTNER_INACTIVE'
    );
  }

  if (!input.externalOrderCode?.trim()) {
    throw new DropshipError('Mã đơn trên kênh bắt buộc.', 'MISSING_EXTERNAL_CODE');
  }
  if (!input.items?.length) {
    throw new DropshipError('Đơn phải có ít nhất một sản phẩm.', 'EMPTY_ITEMS');
  }

  // Chống đơn trùng lặp từ kênh
  const dupSnap = await getDocs(query(
    collection(db, 'dropship_orders'),
    where('tenantId', '==', tenantId),
    where('channel', '==', input.channel),
    where('externalOrderCode', '==', input.externalOrderCode)
  ));
  if (dupSnap.docs?.length) {
    throw new DropshipError(
      `Đơn "${input.externalOrderCode}" trên ${input.channel} đã được nhận trước đó.`,
      'DUPLICATE_ORDER'
    );
  }

  const fin = computeOrderFinancials(
    input.items,
    input.shippingFee || 0,
    partner.marginSplit,
    input.codAmount
  );

  const now = new Date().toISOString();
  const id = newId('dso');
  const order: DropshipOrder = {
    id,
    tenantId,
    partnerId: input.partnerId,
    code: `DS-${Date.now().toString().slice(-8)}`,
    externalOrderCode: input.externalOrderCode,
    channel: input.channel,
    items: input.items,
    itemCount: fin.itemCount,
    quantity: fin.quantity,
    buyerName: input.buyerName,
    buyerPhone: input.buyerPhone,
    shippingAddress: input.shippingAddress,
    shippingProvinceCode: input.shippingProvinceCode,
    codAmount: fin.codAmount,
    totalCost: fin.totalCost,
    shippingFee: Number(input.shippingFee) || 0,
    grossMargin: fin.grossMargin,
    partnerMargin: fin.partnerMargin,
    vcommMargin: fin.vcommMargin,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'dropship_orders', id), order);

  // Thử giữ kho ngay. Thiếu hàng → để pending, không huỷ.
  const stock = await checkStock(input.items, tenantId);
  let reserved = false;
  if (stock.ok) {
    await reserveStock(input.items, tenantId);
    await updateDoc(doc(db, 'dropship_orders', id), {
      status: 'stock_reserved',
      reservedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    order.status = 'stock_reserved';
    order.reservedAt = new Date().toISOString();
    reserved = true;
  }

  return { order, reserved, stockShortages: stock.shortages };
}

/**
 * Chuyển trạng thái fulfill: picking → shipping → delivered → settled.
 * Khi sang `delivered`, tự động ghi bút toán margin (accrual) cho đối tác.
 */
export async function advanceOrder(
  orderId: string,
  to: DropshipOrderStatus,
  patch: Partial<Pick<DropshipOrder, 'carrier' | 'trackingCode' | 'cancelledReason'>> = {},
  tenantId: string = DEFAULT_TENANT
): Promise<DropshipOrder> {
  const existing = await getOrder(orderId, tenantId);
  if (!existing) throw new DropshipError('Đơn dropship không tồn tại.', 'NOT_FOUND');

  assertTransition(existing.status, to);

  const now = new Date().toISOString();
  const stampByStatus: Partial<Record<DropshipOrderStatus, keyof DropshipOrder>> = {
    shipping: 'shippedAt',
    delivered: 'deliveredAt',
    settled: 'settledAt',
    cancelled: 'cancelledAt',
  };
  const stampField = stampByStatus[to];

  const updates: Record<string, unknown> = {
    ...patch,
    status: to,
    updatedAt: now,
  };
  if (stampField) updates[stampField] = now;

  // Huỷ / hoàn hàng → nhả kho đã giữ
  if (to === 'cancelled' && (existing.status === 'stock_reserved' || existing.status === 'picking')) {
    await releaseStock(existing.items, tenantId);
  }

  await updateDoc(doc(db, 'dropship_orders', orderId), updates);

  // Ghi nhận margin cho đối tác khi giao thành công
  if (to === 'delivered') {
    await accrueMargin(existing, tenantId);
  }

  return { ...existing, ...patch, status: to, id: orderId, ...(stampField ? { [stampField]: now } : {}) } as DropshipOrder;
}

// -----------------------------------------------------------------------------
// SỔ CHÊNH LỆCH (margin ledger)
// -----------------------------------------------------------------------------

/** Kỳ đối soát theo tháng, ví dụ '2026-09' */
function periodOf(iso: string): string {
  return (iso || new Date().toISOString()).slice(0, 7);
}

export async function listLedger(
  tenantId: string = DEFAULT_TENANT,
  partnerId?: string,
  status?: DropshipMarginEntry['status']
): Promise<DropshipMarginEntry[]> {
  const constraints: any[] = [where('tenantId', '==', tenantId)];
  if (partnerId) constraints.push(where('partnerId', '==', partnerId));
  if (status) constraints.push(where('status', '==', status));

  const snap = await getDocs(query(collection(db, 'dropship_margin_ledger'), ...constraints));
  return snap.docs
    .map((d: any) => ({ ...(d.data() as DropshipMarginEntry), id: d.id }))
    .sort((a: DropshipMarginEntry, b: DropshipMarginEntry) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/** Ghi bút toán margin khi đơn delivered (chưa trả tiền) */
async function accrueMargin(order: DropshipOrder, tenantId: string): Promise<DropshipMarginEntry> {
  const id = newId('dsm');
  const entry: DropshipMarginEntry = {
    id,
    tenantId,
    partnerId: order.partnerId,
    orderId: order.id,
    type: 'accrual',
    amount: Number(order.partnerMargin) || 0,
    note: `Margin đơn ${order.code} (${order.channel}/${order.externalOrderCode})`,
    status: 'pending',
    period: periodOf(order.deliveredAt || new Date().toISOString()),
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'dropship_margin_ledger', id), entry);
  return entry;
}

/** Tổng margin đang chờ trả của một đối tác */
export async function getPayableBalance(
  partnerId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<number> {
  const entries = await listLedger(tenantId, partnerId);
  return entries
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

/**
 * Thanh toán margin cho đối tác: gom tất cả bút toán `pending` trong kỳ,
 * tạo một bút toán `payout` âm và đánh dấu các bút toán đã trả.
 */
export async function payoutPartner(
  partnerId: string,
  payoutRef: string,
  period?: string,
  tenantId: string = DEFAULT_TENANT
): Promise<{ paidAmount: number; settledEntries: number }> {
  const partner = await getPartner(partnerId, tenantId);
  if (!partner) throw new DropshipError('Đối tác dropship không tồn tại.', 'NOT_FOUND');

  const all = await listLedger(tenantId, partnerId, 'pending');
  const targets = period ? all.filter(e => e.period === period) : all;

  const paidAmount = targets.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  if (paidAmount <= 0) {
    throw new DropshipError('Không có khoản margin nào đang chờ thanh toán.', 'NOTHING_TO_PAY');
  }

  const now = new Date().toISOString();
  for (const e of targets) {
    await updateDoc(doc(db, 'dropship_margin_ledger', e.id), {
      status: 'paid',
      paidAt: now,
      payoutRef,
    });
  }

  const id = newId('dsm');
  await setDoc(doc(db, 'dropship_margin_ledger', id), {
    tenantId,
    partnerId,
    type: 'payout',
    amount: -paidAmount,
    note: `Thanh toán margin${period ? ` kỳ ${period}` : ''}`,
    status: 'paid',
    period: period || periodOf(now),
    paidAt: now,
    payoutRef,
    createdAt: now,
  } as DropshipMarginEntry);

  return { paidAmount, settledEntries: targets.length };
}

// -----------------------------------------------------------------------------
// NHÃN HIỂN THỊ (dùng chung cho UI)
// -----------------------------------------------------------------------------

export const DROPSHIP_ORDER_STATUS_LABEL: Record<DropshipOrderStatus, string> = {
  pending: 'Chờ kiểm tồn',
  stock_reserved: 'Đã giữ kho',
  picking: 'Đang lấy hàng',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  settled: 'Đã đối soát',
  cancelled: 'Đã huỷ',
  returned: 'Hoàn hàng',
};

export const DROPSHIP_CHANNEL_LABEL: Record<DropshipChannel, string> = {
  shopee: 'Shopee',
  lazada: 'Lazada',
  tiktok: 'TikTok Shop',
  tiki: 'Tiki',
  sendo: 'Sendo',
  website: 'Website riêng',
  other: 'Kênh khác',
};

export const DROPSHIP_PARTNER_STATUS_LABEL = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  suspended: 'Tạm ngưng',
  blacklisted: 'Danh sách đen',
} as const;

export const DROPSHIP_LISTING_STATUS_LABEL = {
  draft: 'Nháp',
  active: 'Đang bán',
  paused: 'Tạm dừng',
  delisted: 'Đã gỡ',
} as const;
