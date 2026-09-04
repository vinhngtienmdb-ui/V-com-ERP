import {
  db, collection, doc, getDocs, getDoc, setDoc, updateDoc,
  query, where,
} from './dbService';
import type {
  VCommHub, VCommHubType, HubShipment, HubShipmentStatus,
  PickupVerificationResult,
} from '../types/erp';

/**
 * O2O (Phần A) — VCOMM HUB — spec 018
 *
 * Trạm giao hàng / shop offline do VComm TỰ VẬN HÀNH, dùng phần mềm VComm HUB,
 * CÙNG TENANT với VComm → nằm trong repo này.
 *
 * Shop Offline ĐỐI TÁC (phần mềm iPOS) là sản phẩm SaaS ĐA TENANT RIÊNG BIỆT,
 * KHÔNG nằm ở đây. Điểm giao nhau duy nhất là `verifyPickup` — một API xác thực
 * QR nhận hàng duy nhất, cả VComm HUB và iPOS đều gọi.
 *
 * Vòng đời kiện:
 *   in_transit ──(đến trạm)──> arrived ──(sẵn sàng)──> ready
 *                                                        │
 *                       ┌────────────────────────────────┴─────────┐
 *                  (quét QR, ≤72h)                             (quá 72h)
 *                       │                                          │
 *                  picked_up                                    expired
 *                                                                  │
 *                                                               returned
 *
 * Quy tắc Đề án E.3 được hiện thực ở đây:
 *   - 3 loại trạm: standard / freeze / locker
 *   - Định tuyến linh hoạt: ẨN trạm quá tải, điều hướng sang trạm lân cận
 *   - Nhận hàng bằng QR động (TOTP 30s, dung sai ±1 cửa sổ)
 *   - Nhắc 48h / 72h, tự huỷ sau 72h, PHẠT 15%
 *   - Quỹ bảo hiểm O2O 100–200đ/đơn
 */

const DEFAULT_TENANT = 'tenant-vcomm-prod-01';

/** Thời gian chờ nhận hàng tối đa — quá sẽ tự huỷ và phạt (Đề án E.3) */
export const MAX_PICKUP_HOURS = 72;
/** Ngưỡng nhắc lần 2 */
export const REMINDER_72H_HOURS = 48;
/** Ngưỡng nhắc lần 1 */
export const REMINDER_48H_HOURS = 24;
/** Tỉ lệ phạt khi khách không đến nhận */
export const NO_SHOW_PENALTY_RATE = 0.15;
/** Quỹ bảo hiểm O2O mỗi đơn (100–200đ) */
export const O2O_INSURANCE_FEE = 150;

const ALLOWED_TRANSITIONS: Record<HubShipmentStatus, HubShipmentStatus[]> = {
  in_transit: ['arrived', 'returned'],
  arrived:    ['ready', 'returned'],
  ready:      ['picked_up', 'expired', 'returned'],
  picked_up:  [],
  expired:    ['returned'],
  returned:   [],
};

export class VCommHubError extends Error {
  constructor(message: string, public readonly code: string = 'HUB_ERROR') {
    super(message);
    this.name = 'VCommHubError';
  }
}

function assertTransition(from: HubShipmentStatus, to: HubShipmentStatus): void {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new VCommHubError(
      `Không thể chuyển kiện hàng từ "${from}" sang "${to}".`,
      'INVALID_TRANSITION'
    );
  }
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// -----------------------------------------------------------------------------
// QR ĐỘNG — TOTP (RFC 6238)
// -----------------------------------------------------------------------------
// ⚠️ LƯU Ý BẢO MẬT: secret đang được xử lý ở phía client vì toàn bộ app là SPA
// gọi thẳng Supabase. Trước khi lên production phải chuyển việc CẤP và XÁC THỰC
// QR về phía server (endpoint /api/o2o/verify-pickup) — nếu không, chủ trạm có
// thể tự sinh mã hợp lệ. Hàm này đã tách sẵn để dời sang server mà không đổi API.

const TOTP_STEP_SECONDS = 30;
/** Dung sai ±1 cửa sổ để tránh lệch đồng hồ giữa thiết bị quét và thiết bị phát hành */
const TOTP_WINDOW = 1;

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return new Uint8Array(sig);
}

async function hotp(secret: string, counter: number): Promise<string> {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);

  const msg = String.fromCharCode(...new Uint8Array(buf));
  const mac = await hmacSha256(secret, msg);

  const offset = mac[mac.length - 1] & 0x0f;
  const bin =
    ((mac[offset] & 0x7f) << 24) |
    ((mac[offset + 1] & 0xff) << 16) |
    ((mac[offset + 2] & 0xff) << 8) |
    (mac[offset + 3] & 0xff);

  return String(bin % 1000000).padStart(6, '0');
}

/** Sinh secret ngẫu nhiên dạng base32 cho một kiện hàng */
export function newQrSecret(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

/** Sinh mã nhận hàng 6 chữ số tại một thời điểm */
export async function generatePickupCode(secret: string, at: number = Date.now()): Promise<string> {
  return hotp(secret, Math.floor(at / 1000 / TOTP_STEP_SECONDS));
}

/** Kiểm tra mã nhận hàng, chấp nhận lệch ±1 cửa sổ 30 giây */
export async function verifyPickupCode(
  secret: string,
  code: string,
  at: number = Date.now()
): Promise<boolean> {
  const counter = Math.floor(at / 1000 / TOTP_STEP_SECONDS);
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i += 1) {
    if ((await hotp(secret, counter + i)) === code) return true;
  }
  return false;
}

// -----------------------------------------------------------------------------
// TRẠM (HUB)
// -----------------------------------------------------------------------------

export async function listHubs(
  tenantId: string = DEFAULT_TENANT,
  status?: VCommHub['status']
): Promise<VCommHub[]> {
  const constraints: any[] = [where('tenantId', '==', tenantId)];
  if (status) constraints.push(where('status', '==', status));

  const snap = await getDocs(query(collection(db, 'vcomm_hubs'), ...constraints));
  return snap.docs
    .map((d: any) => ({ ...(d.data() as VCommHub), id: d.id }))
    .sort((a: VCommHub, b: VCommHub) => (a.name || '').localeCompare(b.name || ''));
}

export async function getHub(
  hubId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<VCommHub | null> {
  const snap = await getDoc(doc(db, 'vcomm_hubs', hubId));
  if (!snap || typeof snap.exists !== 'function' || !snap.exists()) return null;
  const data = snap.data() as VCommHub | undefined;
  if (!data) return null;
  if (data.tenantId && data.tenantId !== tenantId) return null;
  return { ...data, id: snap.id };
}

export type CreateHubInput = Omit<VCommHub, 'id' | 'currentLoad' | 'status' | 'createdAt' | 'updatedAt'>;

export async function createHub(input: CreateHubInput): Promise<VCommHub> {
  const tenantId = input.tenantId || DEFAULT_TENANT;

  if (!input.code?.trim()) throw new VCommHubError('Mã trạm bắt buộc.', 'MISSING_CODE');
  if (!input.name?.trim()) throw new VCommHubError('Tên trạm bắt buộc.', 'MISSING_NAME');
  if (input.capacity <= 0) throw new VCommHubError('Sức chứa phải lớn hơn 0.', 'INVALID_CAPACITY');

  const now = new Date().toISOString();
  const id = newId('hub');
  const hub: VCommHub = {
    ...input,
    id,
    tenantId,
    type: input.type || 'standard',
    currentLoad: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'vcomm_hubs', id), hub);
  return hub;
}

export async function updateHub(
  hubId: string,
  patch: Partial<VCommHub>,
  tenantId: string = DEFAULT_TENANT
): Promise<VCommHub> {
  const existing = await getHub(hubId, tenantId);
  if (!existing) throw new VCommHubError('Trạm không tồn tại.', 'NOT_FOUND');

  if (patch.capacity != null && patch.capacity <= 0) {
    throw new VCommHubError('Sức chứa phải lớn hơn 0.', 'INVALID_CAPACITY');
  }

  const next: VCommHub = { ...existing, ...patch, id: hubId };
  // Tự cập nhật trạng thái quá tải — không để caller tự nhớ set
  if (next.currentLoad >= next.capacity && next.status === 'active') next.status = 'full';
  else if (next.currentLoad < next.capacity && next.status === 'full') next.status = 'active';

  await updateDoc(doc(db, 'vcomm_hubs', hubId), {
    ...patch,
    status: next.status,
    updatedAt: new Date().toISOString(),
  });
  return next;
}

/** Tải hiện tại của trạm (%) */
export function hubLoadRatio(hub: VCommHub): number {
  if (!hub.capacity) return 1;
  return hub.currentLoad / hub.capacity;
}

/** Trạm còn nhận thêm kiện được không */
function canAccept(hub: VCommHub): boolean {
  return hub.status === 'active' && hub.currentLoad < hub.capacity;
}

/**
 * Tìm trạm phù hợp nhất cho một khu vực.
 *
 * Định tuyến linh hoạt (Đề án E.2): trạm ĐANG HOẠT ĐỘNG NHƯNG SẮP ĐẦY
 * (tải ≥ 80%) bị đẩy XUỐNG CUỐI danh sách, trạm ĐÃ ĐẦY hoặc BẢO TRÌ bị LOẠI BỎ
 * hoàn toàn. Luôn trả phương án dự phòng nếu còn trạm nào nhận được.
 */
export async function findNearestHub(
  provinceCode?: string,
  type?: VCommHubType,
  tenantId: string = DEFAULT_TENANT
): Promise<{ hub: VCommHub | null; alternatives: VCommHub[] }> {
  const all = await listHubs(tenantId);

  const candidates = all
    .filter(h => h.status !== 'maintenance' && h.status !== 'inactive')
    .filter(h => canAccept(h))
    .filter(h => !type || h.type === type);

  const inProvince = provinceCode
    ? candidates.filter(h => h.provinceCode === provinceCode)
    : candidates;

  const pool = inProvince.length ? inProvince : candidates;

  const sorted = [...pool].sort((a, b) => {
    // Ưu tiên trạm cùng tỉnh, rồi đến trạm còn nhiều chỗ trống nhất
    const aProv = provinceCode && a.provinceCode === provinceCode ? 0 : 1;
    const bProv = provinceCode && b.provinceCode === provinceCode ? 0 : 1;
    if (aProv !== bProv) return aProv - bProv;
    return hubLoadRatio(a) - hubLoadRatio(b);
  });

  return { hub: sorted[0] || null, alternatives: sorted.slice(1, 4) };
}

// -----------------------------------------------------------------------------
// KIỆN HÀNG
// -----------------------------------------------------------------------------

export async function listShipments(
  tenantId: string = DEFAULT_TENANT,
  status?: HubShipmentStatus,
  hubId?: string
): Promise<HubShipment[]> {
  const constraints: any[] = [where('tenantId', '==', tenantId)];
  if (status) constraints.push(where('status', '==', status));
  if (hubId) constraints.push(where('hubId', '==', hubId));

  const snap = await getDocs(query(collection(db, 'hub_shipments'), ...constraints));
  return snap.docs
    .map((d: any) => ({ ...(d.data() as HubShipment), id: d.id }))
    .sort((a: HubShipment, b: HubShipment) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getShipment(
  shipmentId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<HubShipment | null> {
  const snap = await getDoc(doc(db, 'hub_shipments', shipmentId));
  if (!snap || typeof snap.exists !== 'function' || !snap.exists()) return null;
  const data = snap.data() as HubShipment | undefined;
  if (!data) return null;
  if (data.tenantId && data.tenantId !== tenantId) return null;
  return { ...data, id: snap.id };
}

export interface CreateShipmentInput {
  tenantId?: string;
  hubId?: string;
  orderId?: string;
  trackingCode: string;
  recipientName?: string;
  recipientPhone?: string;
  codAmount?: number;
  /** Nếu không truyền hubId, tự định tuyến theo tỉnh */
  provinceCode?: string;
  hubType?: VCommHubType;
}

/**
 * Tạo kiện hàng gửi về trạm. Tự động:
 *   - Chọn trạm theo định tuyến linh hoạt nếu không chỉ định sẵn
 *   - Sinh secret QR động
 *   - Trích quỹ bảo hiểm O2O (150đ/đơn)
 *   - Tăng tải của trạm
 */
export async function createShipment(input: CreateShipmentInput): Promise<{
  shipment: HubShipment;
  alternatives: VCommHub[];
}> {
  const tenantId = input.tenantId || DEFAULT_TENANT;

  if (!input.trackingCode?.trim()) {
    throw new VCommHubError('Mã vận đơn bắt buộc.', 'MISSING_TRACKING');
  }

  let hub: VCommHub | null = null;
  let alternatives: VCommHub[] = [];

  if (input.hubId) {
    hub = await getHub(input.hubId, tenantId);
    if (!hub) throw new VCommHubError('Trạm không tồn tại.', 'HUB_NOT_FOUND');
    if (!canAccept(hub)) {
      throw new VCommHubError(
        `Trạm "${hub.name}" đã đầy (${hub.currentLoad}/${hub.capacity}). Hãy chọn trạm khác.`,
        'HUB_FULL'
      );
    }
  } else {
    const routed = await findNearestHub(input.provinceCode, input.hubType, tenantId);
    hub = routed.hub;
    alternatives = routed.alternatives;
    if (!hub) {
      throw new VCommHubError(
        'Không còn trạm nào có thể nhận hàng trong khu vực này.',
        'NO_HUB_AVAILABLE'
      );
    }
  }

  const now = new Date().toISOString();
  const id = newId('shp');
  const shipment: HubShipment = {
    id,
    tenantId,
    hubId: hub.id,
    orderId: input.orderId || null,
    trackingCode: input.trackingCode.trim(),
    pickupCode: null,
    qrSecret: newQrSecret(),
    qrIssuedAt: now,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    codAmount: Number(input.codAmount) || 0,
    insuranceFee: O2O_INSURANCE_FEE,
    penaltyAmount: 0,
    inspectionOk: null,
    refundedAmount: 0,
    status: 'in_transit',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'hub_shipments', id), shipment);
  await updateHub(hub.id, { currentLoad: (hub.currentLoad || 0) + 1 }, tenantId);

  return { shipment, alternatives };
}

async function applyTransition(
  shipmentId: string,
  to: HubShipmentStatus,
  tenantId: string,
  extra: Record<string, unknown> = {}
): Promise<HubShipment> {
  const existing = await getShipment(shipmentId, tenantId);
  if (!existing) throw new VCommHubError('Kiện hàng không tồn tại.', 'NOT_FOUND');

  assertTransition(existing.status, to);

  const now = new Date().toISOString();
  const stamp: Partial<Record<HubShipmentStatus, keyof HubShipment>> = {
    arrived: 'arrivedAt',
    ready: 'readyAt',
    picked_up: 'pickedUpAt',
    expired: 'expiredAt',
    returned: 'returnedAt',
  };
  const field = stamp[to];

  const updates: Record<string, unknown> = { status: to, updatedAt: now, ...extra };
  if (field) updates[field] = now;

  await updateDoc(doc(db, 'hub_shipments', shipmentId), updates);

  // Nhả tải của trạm khi kiện rời khỏi trạm (nhận hoặc hoàn)
  if (to === 'picked_up' || to === 'returned') {
    const hub = await getHub(existing.hubId, tenantId);
    if (hub) {
      await updateDoc(doc(db, 'vcomm_hubs', hub.id), {
        currentLoad: Math.max(0, (hub.currentLoad || 0) - 1),
        updatedAt: now,
      });
    }
  }

  return { ...existing, status: to, ...(field ? { [field]: now } : {}), ...extra } as HubShipment;
}

export async function markArrived(shipmentId: string, tenantId: string = DEFAULT_TENANT) {
  return applyTransition(shipmentId, 'arrived', tenantId);
}

/** Chuyển sang sẵn sàng nhận — BẮT ĐẦU TÍNH 72H từ thời điểm này */
export async function markReady(shipmentId: string, tenantId: string = DEFAULT_TENANT) {
  return applyTransition(shipmentId, 'ready', tenantId);
}

/**
 * Xác thực nhận hàng bằng QR động.
 *
 * Đây là API DUY NHẤT để xác thực nhận hàng — cả VComm HUB (trạm VComm tự vận
 * hành) và iPOS (shop đối tác) đều gọi chung hàm này, đảm bảo hai sản phẩm
 * không bao giờ lệch chuẩn QR (rủi ro 3 của spec 018).
 */
export async function verifyPickup(
  trackingCode: string,
  code: string,
  options: { tenantId?: string; inspectionOk?: boolean } = {}
): Promise<PickupVerificationResult> {
  const tenantId = options.tenantId || DEFAULT_TENANT;

  const snap = await getDocs(query(
    collection(db, 'hub_shipments'),
    where('tenantId', '==', tenantId),
    where('trackingCode', '==', trackingCode)
  ));

  const found = snap.docs?.[0];
  if (!found) return { ok: false, reason: 'NOT_FOUND' };

  const shipment = { ...(found.data() as HubShipment), id: found.id };
  if (shipment.status !== 'ready') return { ok: false, reason: 'NOT_READY' };

  if (!shipment.qrSecret) return { ok: false, reason: 'INVALID_CODE' };
  if (!(await verifyPickupCode(shipment.qrSecret, code))) {
    return { ok: false, reason: 'INVALID_CODE' };
  }

  const updated = await applyTransition(shipment.id, 'picked_up', tenantId, {
    inspectionOk: options.inspectionOk ?? true,
  });
  return { ok: true, shipment: updated };
}

/** Đánh dấu đã nhắc (48h hoặc 72h) */
export async function markReminded(
  shipmentId: string,
  kind: '48h' | '72h',
  tenantId: string = DEFAULT_TENANT
): Promise<HubShipment> {
  const existing = await getShipment(shipmentId, tenantId);
  if (!existing) throw new VCommHubError('Kiện hàng không tồn tại.', 'NOT_FOUND');

  const now = new Date().toISOString();
  await updateDoc(doc(db, 'hub_shipments', shipmentId), {
    [kind === '48h' ? 'reminder48hAt' : 'reminder72hAt']: now,
    updatedAt: now,
  });
  return {
    ...existing,
    [kind === '48h' ? 'reminder48hAt' : 'reminder72hAt']: now,
  } as HubShipment;
}

// -----------------------------------------------------------------------------
// TỰ ĐỘNG: NHẮC 48H/72H · TỰ HUỶ SAU 72H · PHẠT 15%
// -----------------------------------------------------------------------------

export interface StalePackage {
  shipment: HubShipment;
  hoursWaiting: number;
  action: 'remind_48h' | 'remind_72h' | 'expire';
}

/**
 * Quét các kiện đang chờ nhận, trả về danh sách cần xử lý.
 *
 * Không tự gửi thông báo ở đây — phần gửi ZNS/Zalo do tầng tích hợp đảm nhiệm
 * (đã có `znsService`), để service này giữ nguyên một trách nhiệm.
 */
export async function findStalePackages(
  tenantId: string = DEFAULT_TENANT
): Promise<StalePackage[]> {
  const ready = await listShipments(tenantId, 'ready');
  const now = Date.now();
  const out: StalePackage[] = [];

  for (const s of ready) {
    if (!s.readyAt) continue;
    const hours = (now - new Date(s.readyAt).getTime()) / 36e5;

    if (hours >= MAX_PICKUP_HOURS) {
      out.push({ shipment: s, hoursWaiting: hours, action: 'expire' });
    } else if (hours >= REMINDER_72H_HOURS && !s.reminder72hAt) {
      out.push({ shipment: s, hoursWaiting: hours, action: 'remind_72h' });
    } else if (hours >= REMINDER_48H_HOURS && !s.reminder48hAt) {
      out.push({ shipment: s, hoursWaiting: hours, action: 'remind_48h' });
    }
  }
  return out;
}

/**
 * Tự huỷ các kiện quá 72h và GHI PHẠT 15% trên tiền thu hộ.
 * Trả về tổng số tiền phạt đã ghi nhận.
 */
export async function expireStalePackages(
  tenantId: string = DEFAULT_TENANT
): Promise<{ expiredCount: number; totalPenalty: number }> {
  const ready = await listShipments(tenantId, 'ready');
  const now = Date.now();

  let expiredCount = 0;
  let totalPenalty = 0;

  for (const s of ready) {
    if (!s.readyAt) continue;
    const hours = (now - new Date(s.readyAt).getTime()) / 36e5;
    if (hours < MAX_PICKUP_HOURS) continue;

    const penalty = Math.round((Number(s.codAmount) || 0) * NO_SHOW_PENALTY_RATE);
    totalPenalty += penalty;

    await updateDoc(doc(db, 'hub_shipments', s.id), {
      status: 'expired',
      expiredAt: new Date().toISOString(),
      penaltyAmount: penalty,
      cancelledReason: `Khách không đến nhận trong ${MAX_PICKUP_HOURS}h — phạt ${NO_SHOW_PENALTY_RATE * 100}%`,
      updatedAt: new Date().toISOString(),
    });

    // Nhả tải trạm khi kiện bị huỷ do quá hạn
    const hub = await getHub(s.hubId, tenantId);
    if (hub) {
      await updateDoc(doc(db, 'vcomm_hubs', hub.id), {
        currentLoad: Math.max(0, (hub.currentLoad || 0) - 1),
        updatedAt: new Date().toISOString(),
      });
    }

    expiredCount += 1;
  }
  return { expiredCount, totalPenalty };
}

/** Hoàn kiện về kho (sau khi expired, hoặc khách từ chối nhận) */
export async function markReturned(
  shipmentId: string,
  reason?: string,
  tenantId: string = DEFAULT_TENANT
): Promise<HubShipment> {
  return applyTransition(shipmentId, 'returned', tenantId, {
    cancelledReason: reason || 'Hoàn về kho',
  });
}

/** Đồng kiểm tại quầy & hoàn tiền tức thì (Đề án E.3) */
export async function recordInspection(
  shipmentId: string,
  inspectionOk: boolean,
  refundedAmount: number,
  tenantId: string = DEFAULT_TENANT
): Promise<HubShipment> {
  const existing = await getShipment(shipmentId, tenantId);
  if (!existing) throw new VCommHubError('Kiện hàng không tồn tại.', 'NOT_FOUND');

  if (refundedAmount < 0) throw new VCommHubError('Số tiền hoàn không được âm.', 'INVALID_REFUND');
  if (refundedAmount > (existing.codAmount || 0)) {
    throw new VCommHubError('Số tiền hoàn vượt quá tiền thu hộ.', 'REFUND_EXCEEDS_COD');
  }

  await updateDoc(doc(db, 'hub_shipments', shipmentId), {
    inspectionOk,
    refundedAmount,
    updatedAt: new Date().toISOString(),
  });
  return { ...existing, inspectionOk, refundedAmount };
}

// -----------------------------------------------------------------------------
// NHÃN HIỂN THỊ
// -----------------------------------------------------------------------------

export const HUB_TYPE_LABEL: Record<VCommHubType, string> = {
  standard: 'Trạm tiêu chuẩn',
  freeze: 'Trạm đông lạnh',
  locker: 'Tủ khóa 24-7',
};

export const HUB_STATUS_LABEL = {
  active: 'Đang hoạt động',
  full: 'Đã đầy',
  maintenance: 'Bảo trì',
  inactive: 'Ngưng hoạt động',
} as const;

export const HUB_SHIPMENT_STATUS_LABEL: Record<HubShipmentStatus, string> = {
  in_transit: 'Đang vận chuyển',
  arrived: 'Đã đến trạm',
  ready: 'Sẵn sàng nhận',
  picked_up: 'Đã nhận',
  expired: 'Quá hạn',
  returned: 'Đã hoàn',
};
