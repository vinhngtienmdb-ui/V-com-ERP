import {
  db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy,
} from './dbService';
import type {
  GroupBuySession,
  GroupBuyParticipant,
  GroupBuyStatus,
} from '../types/erp';

/**
 * TRỤ CỘT 3 — MUA CHUNG (GROUP BUY) — spec 016
 *
 * Buồn cười là phần schema/type/persistence của module này ĐÃ TỒN TẠI từ
 * migration 005 (xem spec 015 mục 9.1 để biết phần hiệu đính). Thứ thực sự
 * thiếu là lớp điều phối nghiệp vụ này.
 *
 * Vòng đời:
 *   group_open ──(đạt min, trigger DB)──> group_reached_minimum
 *              ──(admin chốt sổ)────────> group_locked
 *              ──(nguồn xác nhận)───────> supplier_confirmed
 *              ──(giao xong)────────────> completed
 *   Bất kỳ bước nào cũng có thể ──> cancelled | expired (tự động)
 *
 * Lưu ý quan trọng:
 *   - `currentParticipants` do TRIGGER `trg_gbp_sync` trong DB quản lý,
 *     không ghi từ JS để tránh đếm sai khi có người tham gia đồng thời.
 *   - Mọi chuyển trạng thái đều đi qua `assertTransition()`.
 */

const DEFAULT_TENANT = 'tenant-vcomm-prod-01';

/** Các bước chuyển trạng thái hợp lệ. Giữ tập trung để không ai tự chế riêng. */
const ALLOWED_TRANSITIONS: Record<GroupBuyStatus, GroupBuyStatus[]> = {
  group_open:            ['group_reached_minimum', 'group_locked', 'cancelled', 'expired'],
  group_reached_minimum: ['group_open', 'group_locked', 'cancelled', 'expired'],
  group_locked:          ['supplier_confirmed', 'cancelled'],
  supplier_confirmed:    ['completed', 'cancelled'],
  completed:             [],
  cancelled:             [],
  expired:               [],
};

export class GroupBuyError extends Error {
  constructor(message: string, public readonly code: string = 'GROUP_BUY_ERROR') {
    super(message);
    this.name = 'GroupBuyError';
  }
}

function assertTransition(from: GroupBuyStatus, to: GroupBuyStatus): void {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new GroupBuyError(
      `Không thể chuyển phiên mua chung từ "${from}" sang "${to}".`,
      'INVALID_TRANSITION'
    );
  }
}

function isExpired(session: GroupBuySession): boolean {
  if (!session.expiresAt) return false;
  return new Date(session.expiresAt).getTime() < Date.now();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// -----------------------------------------------------------------------------
// Đọc
// -----------------------------------------------------------------------------

export interface ListSessionsOptions {
  status?: GroupBuyStatus | GroupBuyStatus[];
  comboId?: string;
  onlyOpen?: boolean;
}

export async function listSessions(
  tenantId: string = DEFAULT_TENANT,
  opts: ListSessionsOptions = {}
): Promise<GroupBuySession[]> {
  const constraints: any[] = [where('tenantId', '==', tenantId)];

  if (opts.status) {
    const statuses = Array.isArray(opts.status) ? opts.status : [opts.status];
    if (statuses.length === 1) constraints.push(where('status', '==', statuses[0]));
  }
  if (opts.comboId) constraints.push(where('comboId', '==', opts.comboId));

  const snap = await getDocs(query(collection(db, 'group_buy_sessions'), ...constraints));
  let rows: GroupBuySession[] = snap.docs.map((d: any) => ({ ...(d.data() as GroupBuySession), id: d.id }));

  // where('status','in',[...]) chưa được adapter hỗ trợ cho mảng → lọc phía client
  if (opts.status && Array.isArray(opts.status) && opts.status.length > 1) {
    const set = new Set(opts.status);
    rows = rows.filter(r => set.has(r.status));
  }

  if (opts.onlyOpen) {
    rows = rows.filter(r =>
      (r.status === 'group_open' || r.status === 'group_reached_minimum') && !isExpired(r)
    );
  }

  return rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getSession(
  sessionId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<GroupBuySession | null> {
  const snap = await getDoc(doc(db, 'group_buy_sessions', sessionId));
  // LƯU Ý: getDoc trả về { exists(), data(), id } — exists/data là HÀM, không phải thuộc tính.
  if (!snap || typeof snap.exists !== 'function' || !snap.exists()) return null;
  const data = snap.data() as GroupBuySession | undefined;
  if (!data) return null;
  if (data.tenantId && data.tenantId !== tenantId) return null;
  return { ...data, id: snap.id };
}

export async function listParticipants(
  sessionId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<GroupBuyParticipant[]> {
  const snap = await getDocs(
    query(collection(db, 'group_buy_participants'), where('sessionId', '==', sessionId))
  );
  const rows: GroupBuyParticipant[] = snap.docs
    .map((d: any) => ({ ...(d.data() as GroupBuyParticipant), id: d.id }))
    .filter(p => !p.tenantId || p.tenantId === tenantId);

  return rows.sort((a, b) => (b.joinedAt || '').localeCompare(a.joinedAt || ''));
}

/** Gộp phiên + danh sách người tham gia — dùng cho màn hình chi tiết. */
export async function getSessionDetail(
  sessionId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<{ session: GroupBuySession; participants: GroupBuyParticipant[] } | null> {
  const session = await getSession(sessionId, tenantId);
  if (!session) return null;
  const participants = await listParticipants(sessionId, tenantId);
  return { session, participants };
}

// -----------------------------------------------------------------------------
// Ghi
// -----------------------------------------------------------------------------

export interface CreateSessionInput {
  comboId?: string;
  productId?: string;
  minParticipants: number;
  unitPrice: number;
  /** ISO string. Bắt buộc để cron có thể dọn phiên treo. */
  expiresAt: string;
  leaderId?: string;
  tenantId?: string;
}

export async function createSession(input: CreateSessionInput): Promise<GroupBuySession> {
  const tenantId = input.tenantId || DEFAULT_TENANT;

  if (input.minParticipants < 2) {
    throw new GroupBuyError('Số lượng tối thiểu phải từ 2 trở lên.', 'INVALID_MIN');
  }
  if (input.unitPrice < 0) {
    throw new GroupBuyError('Đơn giá không được âm.', 'INVALID_PRICE');
  }
  const expires = new Date(input.expiresAt);
  if (Number.isNaN(expires.getTime())) {
    throw new GroupBuyError('Thời gian kết thúc không hợp lệ.', 'INVALID_EXPIRES');
  }
  if (expires.getTime() <= Date.now()) {
    throw new GroupBuyError('Thời gian kết thúc phải nằm trong tương lai.', 'EXPIRES_IN_PAST');
  }

  const now = new Date().toISOString();
  const id = newId('gb');
  const session: GroupBuySession = {
    id,
    tenantId,
    comboId: input.comboId,
    productId: input.productId,
    status: 'group_open',
    minParticipants: input.minParticipants,
    currentParticipants: 0,
    unitPrice: input.unitPrice,
    expiresAt: expires.toISOString(),
    leaderId: input.leaderId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  // Dùng setDoc thay vì addDoc: addDoc nuốt lỗi và trả id giả.
  await setDoc(doc(db, 'group_buy_sessions', id), session);
  return session;
}

export interface JoinInput {
  sessionId: string;
  customerId: string;
  customerName?: string;
  quantity: number;
  paymentRef?: string;
  tenantId?: string;
}

export async function joinSession(input: JoinInput): Promise<GroupBuyParticipant> {
  const tenantId = input.tenantId || DEFAULT_TENANT;

  const session = await getSession(input.sessionId, tenantId);
  if (!session) throw new GroupBuyError('Phiên mua chung không tồn tại.', 'NOT_FOUND');

  if (session.status !== 'group_open' && session.status !== 'group_reached_minimum') {
    throw new GroupBuyError(
      `Phiên đang ở trạng thái "${session.status}", không nhận người tham gia mới.`,
      'SESSION_CLOSED'
    );
  }
  if (isExpired(session)) {
    throw new GroupBuyError('Phiên mua chung đã hết hạn.', 'SESSION_EXPIRED');
  }
  const qty = Math.floor(input.quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new GroupBuyError('Số lượng tham gia phải lớn hơn 0.', 'INVALID_QUANTITY');
  }

  // Ngăn một khách chiếm hai dòng đang hoạt động (DB cũng có partial unique index)
  const existing = await listParticipants(input.sessionId, tenantId);
  if (existing.some(p => p.customerId === input.customerId && (p.status === 'joined' || p.status === 'confirmed'))) {
    throw new GroupBuyError('Khách hàng đã tham gia phiên này.', 'ALREADY_JOINED');
  }

  const now = new Date().toISOString();
  const id = newId('gbp');
  const participant: GroupBuyParticipant = {
    id,
    tenantId,
    sessionId: input.sessionId,
    customerId: input.customerId,
    customerName: input.customerName,
    quantity: qty,
    unitPrice: session.unitPrice,
    amount: qty * session.unitPrice,
    status: 'joined',
    paymentRef: input.paymentRef ?? null,
    joinedAt: now,
  };

  await setDoc(doc(db, 'group_buy_participants', id), participant);

  // Trigger DB tự cập nhật current_participants và nâng lên group_reached_minimum.
  return participant;
}

/** Khách rời phiên khi chưa chốt sổ. */
export async function leaveSession(
  sessionId: string,
  customerId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<void> {
  const session = await getSession(sessionId, tenantId);
  if (!session) throw new GroupBuyError('Phiên mua chung không tồn tại.', 'NOT_FOUND');

  if (session.status === 'group_locked' || session.status === 'supplier_confirmed' || session.status === 'completed') {
    throw new GroupBuyError('Phiên đã chốt sổ, không thể rời.', 'SESSION_LOCKED');
  }

  const mine = (await listParticipants(sessionId, tenantId)).find(
    p => p.customerId === customerId && (p.status === 'joined' || p.status === 'confirmed')
  );
  if (!mine) throw new GroupBuyError('Bạn chưa tham gia phiên này.', 'NOT_JOINED');

  await updateDoc(doc(db, 'group_buy_participants', mine.id), {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  });
}

// -----------------------------------------------------------------------------
// Chuyển trạng thái
// -----------------------------------------------------------------------------

async function transition(
  sessionId: string,
  to: GroupBuyStatus,
  tenantId: string,
  extra: Partial<GroupBuySession> = {}
): Promise<GroupBuySession> {
  const session = await getSession(sessionId, tenantId);
  if (!session) throw new GroupBuyError('Phiên mua chung không tồn tại.', 'NOT_FOUND');

  assertTransition(session.status, to);

  await updateDoc(doc(db, 'group_buy_sessions', sessionId), {
    status: to,
    updatedAt: new Date().toISOString(),
    ...extra,
  });

  return { ...session, status: to, ...extra };
}

/** Admin chốt sổ — yêu cầu đã đạt số lượng tối thiểu. */
export async function lockSession(
  sessionId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<GroupBuySession> {
  const session = await getSession(sessionId, tenantId);
  if (!session) throw new GroupBuyError('Phiên mua chung không tồn tại.', 'NOT_FOUND');
  if (session.currentParticipants < session.minParticipants) {
    throw new GroupBuyError(
      `Chưa đạt số lượng tối thiểu (${session.currentParticipants}/${session.minParticipants}).`,
      'BELOW_MINIMUM'
    );
  }
  return transition(sessionId, 'group_locked', tenantId, {
    lockedAt: new Date().toISOString(),
  });
}

export async function confirmBySupplier(
  sessionId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<GroupBuySession> {
  return transition(sessionId, 'supplier_confirmed', tenantId, {
    supplierConfirmedAt: new Date().toISOString(),
  });
}

/** Hoàn tất phiên. Tham số `orderIds` map customerId → orderId để đối chiếu sau. */
export async function completeSession(
  sessionId: string,
  orderIds: Record<string, string> = {},
  tenantId: string = DEFAULT_TENANT
): Promise<GroupBuySession> {
  const session = await getSession(sessionId, tenantId);
  if (!session) throw new GroupBuyError('Phiên mua chung không tồn tại.', 'NOT_FOUND');

  const result = await transition(sessionId, 'completed', tenantId, {
    completedAt: new Date().toISOString(),
  });

  // Gắn mã đơn vào từng người tham gia để truy vết
  const participants = await listParticipants(sessionId, tenantId);
  for (const p of participants) {
    const orderId = orderIds[p.customerId];
    if (orderId && p.status !== 'cancelled') {
      await updateDoc(doc(db, 'group_buy_participants', p.id), {
        status: 'confirmed',
        orderId,
      });
    }
  }

  return result;
}

/** Huỷ phiên — mọi người tham gia đang hoạt động được đánh dấu hoàn tiền. */
export async function cancelSession(
  sessionId: string,
  reason: string,
  tenantId: string = DEFAULT_TENANT
): Promise<{ session: GroupBuySession; refunded: number }> {
  const session = await getSession(sessionId, tenantId);
  if (!session) throw new GroupBuyError('Phiên mua chung không tồn tại.', 'NOT_FOUND');

  const result = await transition(sessionId, 'cancelled', tenantId, {
    cancelledAt: new Date().toISOString(),
    cancelledReason: reason,
  });

  const now = new Date().toISOString();
  const participants = await listParticipants(sessionId, tenantId);
  let refunded = 0;
  for (const p of participants) {
    if (p.status === 'joined' || p.status === 'confirmed') {
      await updateDoc(doc(db, 'group_buy_participants', p.id), {
        status: 'refunded',
        cancelledAt: now,
      });
      refunded += 1;
    }
  }

  return { session: result, refunded };
}

/** Xoá hẳn một phiên (chỉ khi chưa có ai tham gia) — dùng để dọn phiên tạo nhầm. */
export async function deleteSession(
  sessionId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<void> {
  const participants = await listParticipants(sessionId, tenantId);
  if (participants.length > 0) {
    throw new GroupBuyError(
      'Không thể xoá phiên đã có người tham gia. Hãy huỷ phiên thay vì xoá.',
      'HAS_PARTICIPANTS'
    );
  }
  await deleteDoc(doc(db, 'group_buy_sessions', sessionId));
}

// -----------------------------------------------------------------------------
// Tiện ích hiển thị
// -----------------------------------------------------------------------------

/** Phần trăm tiến độ so với số lượng tối thiểu (chặn 100%). */
export function progressPercent(session: GroupBuySession): number {
  if (!session.minParticipants) return 0;
  return Math.min(100, Math.round((session.currentParticipants / session.minParticipants) * 100));
}

/** Thời gian còn lại tính bằng mili-giây; số âm nghĩa là đã hết hạn. */
export function timeRemainingMs(session: GroupBuySession): number {
  if (!session.expiresAt) return Number.POSITIVE_INFINITY;
  return new Date(session.expiresAt).getTime() - Date.now();
}

export const GROUP_BUY_STATUS_LABEL: Record<GroupBuyStatus, string> = {
  group_open: 'Đang mở',
  group_reached_minimum: 'Đạt tối thiểu',
  group_locked: 'Đã chốt sổ',
  supplier_confirmed: 'Nguồn đã xác nhận',
  completed: 'Hoàn tất',
  cancelled: 'Đã huỷ',
  expired: 'Hết hạn',
};

export const GROUP_BUY_PARTICIPANT_STATUS_LABEL = {
  joined: 'Đã tham gia',
  confirmed: 'Đã chốt đơn',
  refunded: 'Đã hoàn tiền',
  cancelled: 'Đã rời',
} as const;
