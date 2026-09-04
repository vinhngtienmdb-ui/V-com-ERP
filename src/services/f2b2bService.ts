import {
  db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, where,
} from './dbService';
import type {
  F2B2BSource,
  F2B2BPoolOrder,
  F2B2BPoolParticipant,
  F2B2BPoolStatus,
  F2B2BPriceTier,
} from '../types/erp';

/**
 * TRỤ CỘT 4 — F2B2B (Farm / Factory → Business → Business) — spec 016
 *
 * KHÁC Mua chung (Trụ cột 3) ở điểm cốt lõi:
 *   - Mua chung: nhiều người mua cùng một SKU có sẵn, chốt khi đạt min
 *   - F2B2B    : nhiều doanh nghiệp gom đủ sản lượng để ĐẶT SẢN XUẤT hoặc
 *                thu mua trực tiếp từ nguồn → có vòng đời sản xuất & giao hàng
 *   => Hai mô hình giữ hai bộ bảng riêng, không gộp.
 *
 * Vòng đời phiên gom:
 *   draft ──(mở nhận gom)──> open ──(hết hạn & đạt min)──> closed
 *                                 ──(hết hạn & không đạt)─> cancelled
 *   closed ──(nguồn xác nhận)──> confirmed ──> producing ──> shipping ──> completed
 *
 * Giá theo bậc (tiered pricing): tổng sản lượng càng cao thì đơn giá càng tốt.
 * Giá mỗi bên tham gia được "khớp lùi" khi phiên đóng — xem `resolveTierPrice`.
 */

const DEFAULT_TENANT = 'tenant-vcomm-prod-01';

const ALLOWED_TRANSITIONS: Record<F2B2BPoolStatus, F2B2BPoolStatus[]> = {
  draft:     ['open', 'cancelled'],
  open:      ['closed', 'cancelled'],
  closed:    ['confirmed', 'cancelled'],
  confirmed: ['producing', 'cancelled'],
  producing: ['shipping', 'cancelled'],
  shipping:  ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export class F2B2BError extends Error {
  constructor(message: string, public readonly code: string = 'F2B2B_ERROR') {
    super(message);
    this.name = 'F2B2BError';
  }
}

function assertTransition(from: F2B2BPoolStatus, to: F2B2BPoolStatus): void {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new F2B2BError(
      `Không thể chuyển phiên gom từ "${from}" sang "${to}".`,
      'INVALID_TRANSITION'
    );
  }
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Bậc giá phải sắp xếp tăng dần theo sản lượng và giảm dần theo đơn giá để có nghĩa. */
export function normalizeTiers(tiers: F2B2BPriceTier[]): F2B2BPriceTier[] {
  return [...tiers]
    .filter(t => Number.isFinite(t.minQty) && Number.isFinite(t.unitPrice) && t.unitPrice >= 0)
    .sort((a, b) => a.minQty - b.minQty);
}

/**
 * Đơn giá tương ứng với một tổng sản lượng.
 * Chọn bậc có minQty lớn nhất mà tổng sản lượng vẫn chạm tới.
 * Không có bậc nào phù hợp → trả về giá cơ sở.
 */
export function resolveTierPrice(qty: number, tiers: F2B2BPriceTier[], basePrice: number): number {
  const sorted = normalizeTiers(tiers);
  let price = basePrice;
  for (const tier of sorted) {
    if (qty >= tier.minQty) price = tier.unitPrice;
    else break;
  }
  return price;
}

// -----------------------------------------------------------------------------
// NGUỒN HÀNG (farm / factory / cooperative)
// -----------------------------------------------------------------------------

export async function listSources(
  tenantId: string = DEFAULT_TENANT,
  status?: F2B2BSource['status']
): Promise<F2B2BSource[]> {
  const constraints: any[] = [where('tenantId', '==', tenantId)];
  if (status) constraints.push(where('status', '==', status));

  const snap = await getDocs(query(collection(db, 'f2b2b_sources'), ...constraints));
  return snap.docs
    .map((d: any) => ({ ...(d.data() as F2B2BSource), id: d.id }))
    .sort((a: F2B2BSource, b: F2B2BSource) => (b.rating || 0) - (a.rating || 0));
}

export async function getSource(
  sourceId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<F2B2BSource | null> {
  const snap = await getDoc(doc(db, 'f2b2b_sources', sourceId));
  if (!snap || typeof snap.exists !== 'function' || !snap.exists()) return null;
  const data = snap.data() as F2B2BSource | undefined;
  if (!data) return null;
  if (data.tenantId && data.tenantId !== tenantId) return null;
  return { ...data, id: snap.id };
}

export type CreateSourceInput = Omit<F2B2BSource, 'id' | 'rating' | 'totalCompletedPools' | 'createdAt' | 'updatedAt'>;

export async function createSource(input: CreateSourceInput): Promise<F2B2BSource> {
  const tenantId = input.tenantId || DEFAULT_TENANT;

  if (!input.code?.trim()) throw new F2B2BError('Mã nguồn hàng bắt buộc.', 'MISSING_CODE');
  if (!input.name?.trim()) throw new F2B2BError('Tên nguồn hàng bắt buộc.', 'MISSING_NAME');

  const now = new Date().toISOString();
  const id = newId('src');
  const source: F2B2BSource = {
    ...input,
    id,
    tenantId,
    capacityUnit: input.capacityUnit || 'kg',
    leadTimeDays: Math.max(0, Math.floor(input.leadTimeDays ?? 7)),
    certifications: input.certifications ?? [],
    rating: 0,
    totalCompletedPools: 0,
    status: input.status || 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'f2b2b_sources', id), source);
  return source;
}

export async function updateSource(
  sourceId: string,
  patch: Partial<F2B2BSource>,
  tenantId: string = DEFAULT_TENANT
): Promise<F2B2BSource> {
  const existing = await getSource(sourceId, tenantId);
  if (!existing) throw new F2B2BError('Nguồn hàng không tồn tại.', 'NOT_FOUND');

  await updateDoc(doc(db, 'f2b2b_sources', sourceId), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
  return { ...existing, ...patch, id: sourceId };
}

/** Chặn một nguồn không đạt chuẩn. Phiên gom đang mở của nguồn sẽ bị huỷ. */
export async function blacklistSource(
  sourceId: string,
  reason: string,
  tenantId: string = DEFAULT_TENANT
): Promise<{ cancelledPools: number }> {
  await updateSource(sourceId, { status: 'blacklisted' }, tenantId);

  const open = await listPools(tenantId, 'open');
  let cancelledPools = 0;
  for (const pool of open) {
    if (pool.sourceId === sourceId) {
      await cancelPool(pool.id, `Nguồn hàng bị đưa vào danh sách đen: ${reason}`, tenantId);
      cancelledPools += 1;
    }
  }
  return { cancelledPools };
}

// -----------------------------------------------------------------------------
// PHIÊN GOM ĐƠN
// -----------------------------------------------------------------------------

export async function listPools(
  tenantId: string = DEFAULT_TENANT,
  status?: F2B2BPoolStatus
): Promise<F2B2BPoolOrder[]> {
  const constraints: any[] = [where('tenantId', '==', tenantId)];
  if (status) constraints.push(where('status', '==', status));

  const snap = await getDocs(query(collection(db, 'f2b2b_pool_orders'), ...constraints));
  return snap.docs
    .map((d: any) => ({ ...(d.data() as F2B2BPoolOrder), id: d.id }))
    .sort((a: F2B2BPoolOrder, b: F2B2BPoolOrder) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getPool(
  poolId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<F2B2BPoolOrder | null> {
  const snap = await getDoc(doc(db, 'f2b2b_pool_orders', poolId));
  if (!snap || typeof snap.exists !== 'function' || !snap.exists()) return null;
  const data = snap.data() as F2B2BPoolOrder | undefined;
  if (!data) return null;
  if (data.tenantId && data.tenantId !== tenantId) return null;
  return { ...data, id: snap.id };
}

export async function listParticipants(
  poolId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<F2B2BPoolParticipant[]> {
  const snap = await getDocs(
    query(collection(db, 'f2b2b_pool_participants'), where('poolId', '==', poolId))
  );
  return snap.docs
    .map((d: any) => ({ ...(d.data() as F2B2BPoolParticipant), id: d.id }))
    .filter((p: F2B2BPoolParticipant) => !p.tenantId || p.tenantId === tenantId)
    .sort((a: F2B2BPoolParticipant, b: F2B2BPoolParticipant) =>
      (b.joinedAt || '').localeCompare(a.joinedAt || '')
    );
}

export async function getPoolDetail(
  poolId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<{ pool: F2B2BPoolOrder; source: F2B2BSource | null; participants: F2B2BPoolParticipant[] } | null> {
  const pool = await getPool(poolId, tenantId);
  if (!pool) return null;
  const [source, participants] = await Promise.all([
    getSource(pool.sourceId, tenantId),
    listParticipants(poolId, tenantId),
  ]);
  return { pool, source, participants };
}

export interface CreatePoolInput {
  code: string;
  sourceId: string;
  productId?: string;
  productName: string;
  unit?: string;
  targetQty: number;
  minQty: number;
  baseUnitPrice: number;
  priceTiers?: F2B2BPriceTier[];
  closeAt: string;
  expectedDeliveryAt?: string;
  createdBy?: string;
  tenantId?: string;
}

export async function createPool(input: CreatePoolInput): Promise<F2B2BPoolOrder> {
  const tenantId = input.tenantId || DEFAULT_TENANT;

  const source = await getSource(input.sourceId, tenantId);
  if (!source) throw new F2B2BError('Nguồn hàng không tồn tại.', 'SOURCE_NOT_FOUND');
  if (source.status !== 'active') {
    throw new F2B2BError(
      `Nguồn hàng đang ở trạng thái "${source.status}", chỉ nguồn "active" mới được mở phiên gom.`,
      'SOURCE_NOT_ACTIVE'
    );
  }
  if (input.minQty <= 0) throw new F2B2BError('Sản lượng tối thiểu phải lớn hơn 0.', 'INVALID_MIN_QTY');
  if (input.targetQty <= 0) throw new F2B2BError('Sản lượng mục tiêu phải lớn hơn 0.', 'INVALID_TARGET_QTY');
  if (input.minQty > input.targetQty) {
    throw new F2B2BError('Sản lượng tối thiểu không được vượt mục tiêu.', 'MIN_ABOVE_TARGET');
  }

  const close = new Date(input.closeAt);
  if (Number.isNaN(close.getTime())) throw new F2B2BError('Thời gian đóng gom không hợp lệ.', 'INVALID_CLOSE');
  if (close.getTime() <= Date.now()) throw new F2B2BError('Thời gian đóng gom phải nằm trong tương lai.', 'CLOSE_IN_PAST');

  const now = new Date().toISOString();
  const id = newId('pool');
  const pool: F2B2BPoolOrder = {
    id,
    tenantId,
    code: input.code,
    sourceId: input.sourceId,
    productId: input.productId,
    productName: input.productName,
    unit: input.unit || 'kg',
    targetQty: input.targetQty,
    minQty: input.minQty,
    pooledQty: 0,
    priceTiers: normalizeTiers(input.priceTiers ?? []),
    baseUnitPrice: input.baseUnitPrice,
    finalUnitPrice: null,
    status: 'draft',
    openAt: null,
    closeAt: close.toISOString(),
    expectedDeliveryAt: input.expectedDeliveryAt ? new Date(input.expectedDeliveryAt).toISOString() : null,
    createdBy: input.createdBy ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'f2b2b_pool_orders', id), pool);
  return pool;
}

/** Mở nhận đăng ký gom. */
export async function openPool(
  poolId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<F2B2BPoolOrder> {
  return transitionPool(poolId, 'open', tenantId, { openAt: new Date().toISOString() });
}

export interface CommitInput {
  poolId: string;
  buyerId: string;
  buyerName?: string;
  committedQty: number;
  deliveryAddress?: string;
  deliveryProvinceCode?: string;
  paymentRef?: string;
  tenantId?: string;
}

export async function commitToPool(input: CommitInput): Promise<F2B2BPoolParticipant> {
  const tenantId = input.tenantId || DEFAULT_TENANT;

  const pool = await getPool(input.poolId, tenantId);
  if (!pool) throw new F2B2BError('Phiên gom không tồn tại.', 'NOT_FOUND');
  if (pool.status !== 'open') {
    throw new F2B2BError(`Phiên gom đang ở trạng thái "${pool.status}", không nhận đăng ký.`, 'POOL_NOT_OPEN');
  }
  if (pool.closeAt && new Date(pool.closeAt).getTime() < Date.now()) {
    throw new F2B2BError('Phiên gom đã hết hạn đăng ký.', 'POOL_CLOSED');
  }

  const qty = Number(input.committedQty);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new F2B2BError('Sản lượng đăng ký phải lớn hơn 0.', 'INVALID_QTY');
  }

  const participants = await listParticipants(input.poolId, tenantId);
  if (participants.some(p => p.buyerId === input.buyerId && p.status !== 'cancelled')) {
    throw new F2B2BError('Bên mua đã đăng ký phiên gom này.', 'ALREADY_COMMITTED');
  }
  if (pool.pooledQty + qty > pool.targetQty) {
    throw new F2B2BError(
      `Vượt sản lượng mục tiêu. Còn trống ${pool.targetQty - pool.pooledQty} ${pool.unit}.`,
      'EXCEEDS_TARGET'
    );
  }

  // Giá tạm tính theo sản lượng SAU khi cộng thêm — sẽ khớp lại khi phiên đóng.
  const projected = pool.pooledQty + qty;
  const unitPrice = resolveTierPrice(projected, pool.priceTiers, pool.baseUnitPrice);

  const id = newId('pp');
  const participant: F2B2BPoolParticipant = {
    id,
    tenantId,
    poolId: input.poolId,
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    committedQty: qty,
    unitPrice,
    amount: qty * unitPrice,
    deliveryAddress: input.deliveryAddress,
    deliveryProvinceCode: input.deliveryProvinceCode,
    status: 'committed',
    paymentRef: input.paymentRef ?? null,
    joinedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'f2b2b_pool_participants', id), participant);
  return participant;
}

/** Rút đăng ký khi phiên vẫn đang mở. */
export async function withdrawFromPool(
  poolId: string,
  buyerId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<void> {
  const pool = await getPool(poolId, tenantId);
  if (!pool) throw new F2B2BError('Phiên gom không tồn tại.', 'NOT_FOUND');
  if (pool.status !== 'open') {
    throw new F2B2BError('Phiên gom đã chốt, không thể rút đăng ký.', 'POOL_NOT_OPEN');
  }

  const mine = (await listParticipants(poolId, tenantId)).find(
    p => p.buyerId === buyerId && p.status === 'committed'
  );
  if (!mine) throw new F2B2BError('Bên mua chưa đăng ký phiên gom này.', 'NOT_COMMITTED');

  await updateDoc(doc(db, 'f2b2b_pool_participants', mine.id), {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  });
}

async function transitionPool(
  poolId: string,
  to: F2B2BPoolStatus,
  tenantId: string,
  extra: Partial<F2B2BPoolOrder> = {}
): Promise<F2B2BPoolOrder> {
  const pool = await getPool(poolId, tenantId);
  if (!pool) throw new F2B2BError('Phiên gom không tồn tại.', 'NOT_FOUND');

  assertTransition(pool.status, to);

  await updateDoc(doc(db, 'f2b2b_pool_orders', poolId), {
    status: to,
    updatedAt: new Date().toISOString(),
    ...extra,
  });

  return { ...pool, status: to, ...extra };
}

/**
 * Chốt sổ phiên gom.
 * Khớp lại đơn giá cuối cùng cho TẤT CẢ bên tham gia theo tổng sản lượng
 * thực tế (tiered pricing khớp lùi) — đây là lợi ích cốt lõi của mô hình gom.
 */
export async function closePool(
  poolId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<{ pool: F2B2BPoolOrder; repriced: number }> {
  const pool = await getPool(poolId, tenantId);
  if (!pool) throw new F2B2BError('Phiên gom không tồn tại.', 'NOT_FOUND');
  if (pool.pooledQty < pool.minQty) {
    throw new F2B2BError(
      `Chưa đạt sản lượng tối thiểu (${pool.pooledQty}/${pool.minQty} ${pool.unit}).`,
      'BELOW_MINIMUM'
    );
  }

  const finalUnitPrice = resolveTierPrice(pool.pooledQty, pool.priceTiers, pool.baseUnitPrice);
  const result = await transitionPool(poolId, 'closed', tenantId, { finalUnitPrice });

  const participants = await listParticipants(poolId, tenantId);
  let repriced = 0;
  for (const p of participants) {
    if (p.status !== 'committed') continue;
    if (p.unitPrice !== finalUnitPrice) {
      await updateDoc(doc(db, 'f2b2b_pool_participants', p.id), {
        unitPrice: finalUnitPrice,
        amount: p.committedQty * finalUnitPrice,
      });
      repriced += 1;
    }
  }

  return { pool: result, repriced };
}

export async function confirmPool(
  poolId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<F2B2BPoolOrder> {
  return transitionPool(poolId, 'confirmed', tenantId, { confirmedAt: new Date().toISOString() });
}

export async function startProducing(
  poolId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<F2B2BPoolOrder> {
  return transitionPool(poolId, 'producing', tenantId);
}

export async function startShipping(
  poolId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<F2B2BPoolOrder> {
  return transitionPool(poolId, 'shipping', tenantId);
}

/**
 * Hoàn tất phiên gom: đánh dấu tất cả bên tham gia đã giao và
 * cập nhật điểm đánh giá nguồn hàng.
 */
export async function completePool(
  poolId: string,
  sourceRating?: number,
  tenantId: string = DEFAULT_TENANT
): Promise<F2B2BPoolOrder> {
  const pool = await getPool(poolId, tenantId);
  if (!pool) throw new F2B2BError('Phiên gom không tồn tại.', 'NOT_FOUND');

  if (sourceRating !== undefined && (sourceRating < 0 || sourceRating > 5)) {
    throw new F2B2BError('Điểm đánh giá nguồn phải nằm trong khoảng 0–5.', 'INVALID_RATING');
  }

  const result = await transitionPool(poolId, 'completed', tenantId, {
    completedAt: new Date().toISOString(),
  });

  const now = new Date().toISOString();
  const participants = await listParticipants(poolId, tenantId);
  for (const p of participants) {
    if (p.status === 'committed') {
      await updateDoc(doc(db, 'f2b2b_pool_participants', p.id), { status: 'delivered' });
    }
  }

  const source = await getSource(pool.sourceId, tenantId);
  if (source) {
    const completed = (source.totalCompletedPools || 0) + 1;
    const rating =
      sourceRating !== undefined
        ? Number(
            (((source.rating || 0) * (source.totalCompletedPools || 0)) + sourceRating) /
              completed
          ).toFixed(2)
        : source.rating;

    await updateDoc(doc(db, 'f2b2b_sources', source.id), {
      totalCompletedPools: completed,
      rating: Number(rating) || 0,
      updatedAt: now,
    });
  }

  return result;
}

export async function cancelPool(
  poolId: string,
  reason: string,
  tenantId: string = DEFAULT_TENANT
): Promise<{ pool: F2B2BPoolOrder; refunded: number }> {
  const pool = await getPool(poolId, tenantId);
  if (!pool) throw new F2B2BError('Phiên gom không tồn tại.', 'NOT_FOUND');

  const result = await transitionPool(poolId, 'cancelled', tenantId, {
    cancelledAt: new Date().toISOString(),
    cancelledReason: reason,
  });

  const now = new Date().toISOString();
  const participants = await listParticipants(poolId, tenantId);
  let refunded = 0;
  for (const p of participants) {
    if (p.status === 'committed') {
      await updateDoc(doc(db, 'f2b2b_pool_participants', p.id), {
        status: 'cancelled',
        cancelledAt: now,
      });
      refunded += 1;
    }
  }

  return { pool: result, refunded };
}

/** Xoá phiên gom ở trạng thái nháp và chưa có ai đăng ký. */
export async function deletePool(
  poolId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<void> {
  const pool = await getPool(poolId, tenantId);
  if (!pool) throw new F2B2BError('Phiên gom không tồn tại.', 'NOT_FOUND');
  if (pool.status !== 'draft') {
    throw new F2B2BError('Chỉ xoá được phiên gom ở trạng thái nháp.', 'NOT_DRAFT');
  }
  const participants = await listParticipants(poolId, tenantId);
  if (participants.length > 0) {
    throw new F2B2BError('Phiên gom đã có bên đăng ký, hãy huỷ thay vì xoá.', 'HAS_PARTICIPANTS');
  }
  await deleteDoc(doc(db, 'f2b2b_pool_orders', poolId));
}

// -----------------------------------------------------------------------------
// Tiện ích hiển thị
// -----------------------------------------------------------------------------

export function poolProgressPercent(pool: F2B2BPoolOrder): number {
  if (!pool.targetQty) return 0;
  return Math.min(100, Math.round((pool.pooledQty / pool.targetQty) * 100));
}

export function isPoolOpen(pool: F2B2BPoolOrder): boolean {
  if (pool.status !== 'open') return false;
  if (!pool.closeAt) return true;
  return new Date(pool.closeAt).getTime() > Date.now();
}

export const F2B2B_POOL_STATUS_LABEL: Record<F2B2BPoolStatus, string> = {
  draft: 'Nháp',
  open: 'Đang gom',
  closed: 'Đã chốt sổ',
  confirmed: 'Nguồn đã xác nhận',
  producing: 'Đang sản xuất',
  shipping: 'Đang giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã huỷ',
};

export const F2B2B_SOURCE_TYPE_LABEL = {
  farm: 'Nông trại',
  factory: 'Nhà máy',
  cooperative: 'Hợp tác xã',
} as const;

export const F2B2B_SOURCE_STATUS_LABEL = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  suspended: 'Tạm ngưng',
  blacklisted: 'Danh sách đen',
} as const;
