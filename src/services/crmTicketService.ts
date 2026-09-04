/**
 * ============================================================================
 *  crmTicketService.ts — GĐ 4.6: Nối lại CRM (SLA + RFM dùng chung)
 * ============================================================================
 *
 *  Vấn đề (spec 023 §GĐ4.6): `crmService.ts` là MÃ MỒ CÔI — chỉ `Orders.tsx` gọi
 *  khi đơn hoàn thành. Màn `CustomerService.tsx` (CSKH) hiển thị `MOCK_TICKETS`
 *  / `MOCK_FEEDBACKS` cứng trong code → nhân viên CSKH thấy dữ liệu GIẢ, còn
 *  bảng `support_tickets` (đã có trong RELATIONAL_TABLES) thì trống.
 *
 *  Module này nối lại, gồm 2 phần:
 *
 *  **A. SLA theo GIỜ HÀNH CHÍNH (sửa một lỗi nghiệp vụ có thật).**
 *     `crmService.createSupportTicket()` cũ cộng SLA theo GIỜ THỰC:
 *       `now + 24h`  →  ticket tạo 17:00 Thứ Sáu có hạn 17:00 Thứ Bảy —
 *       trong khi tổng đài NGHỈ cả cuối tuần. KPI SLA vì thế không bao giờ đúng.
 *     Ở đây SLA được tính trên LỊCH LÀM VIỆC: bỏ qua ngoài giờ, ngày nghỉ, lễ.
 *
 *  **B. RFM dùng chung.**
 *     Hiện RFM bị tính ở 2 nơi (crmService.calculateRfmScores + logic rải rác
 *     trong Customers.tsx) với cách xử lý KHÁC NHAU → cùng 1 khách hàng có thể
 *     ra 2 phân khúc khác nhau. Đưa về 1 hàm thuần `computeRfmFromOrders()`.
 *
 *  🔧 THIẾT KẾ CÓ CHỦ ĐÍCH: module KHÔNG import `dbService` ở top-level.
 *     `dbService` kéo theo Supabase client; import tĩnh sẽ làm mọi file test
 *     import module này phải khởi tạo kết nối (từng gây TREO test suite).
 *     Các hàm DB dùng `await import('./dbService')` bên trong → phần thuần
 *     (SLA/RFM) test được hoàn toàn offline.
 * ============================================================================
 */

export class CrmTicketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CrmTicketError';
  }
}

/* ========================================================================== */
/*  A. SLA theo lịch làm việc                                                  */
/* ========================================================================== */

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketType = 'complaint' | 'inquiry' | 'refund' | 'feedback';

export interface BusinessCalendar {
  /** Giờ BẮT ĐẦU ca (giờ local). Mặc định 8. */
  workStartHour: number;
  /** Giờ KẾT THÚC ca (giờ local). Mặc định 17. */
  workEndHour: number;
  /** Ngày làm việc: 0 = Chủ nhật … 6 = Thứ Bảy. Mặc định T2–T6. */
  workdays: number[];
  /** Ngày lễ, dạng 'YYYY-MM-DD'. */
  holidays: string[];
}

export const DEFAULT_BUSINESS_CALENDAR: BusinessCalendar = {
  workStartHour: 8,
  workEndHour: 17,
  workdays: [1, 2, 3, 4, 5],
  holidays: [],
};

/** Thời gian xử lý tối đa (GIỜ LÀM VIỆC) theo mức ưu tiên — giữ nguyên quy tắc cũ. */
export const SLA_HOURS_BY_PRIORITY: Record<TicketPriority, number> = {
  urgent: 1,
  high: 4,
  medium: 24,
  low: 48,
};

/**
 * Ngưỡng "SẮP VI PHẠM": còn dưới 20% thời gian SLA thì chuyển `at_risk`
 * để tổng đài ưu tiên xử lý trước khi vỡ hạn.
 */
export const SLA_AT_RISK_RATIO = 0.2;

export type SlaStatus = 'on_track' | 'at_risk' | 'breached' | 'met';

/** 'YYYY-MM-DD' theo GIỜ ĐỊA PHƯƠNG (không dùng toISOString — lệch múi giờ). */
export function isoLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isWorkingDay(d: Date, cal: BusinessCalendar = DEFAULT_BUSINESS_CALENDAR): boolean {
  return cal.workdays.includes(d.getDay()) && !cal.holidays.includes(isoLocalDate(d));
}

function startOfDay(d: Date): Date {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}

function openingTimeOf(day: Date, cal: BusinessCalendar): Date {
  const x = startOfDay(day);
  x.setHours(cal.workStartHour, 0, 0, 0);
  return x;
}

function closingTimeOf(day: Date, cal: BusinessCalendar): Date {
  const x = startOfDay(day);
  x.setHours(cal.workEndHour, 0, 0, 0);
  return x;
}

/**
 * Thời điểm làm việc hợp lệ TIẾP THEO tính từ `from`.
 *  - Đang trong giờ làm → chính `from`.
 *  - Trước giờ mở cửa → giờ mở cửa hôm đó.
 *  - Sau giờ đóng cửa / ngày nghỉ / lễ → giờ mở cửa của ngày làm kế tiếp.
 */
export function nextWorkingMoment(from: Date, cal: BusinessCalendar = DEFAULT_BUSINESS_CALENDAR): Date {
  const cursor = startOfDay(from);
  // Giới hạn 2 năm để không kẹt vòng lặp nếu lịch cấu hình sai (0 ngày làm việc).
  for (let i = 0; i < 731; i++) {
    if (isWorkingDay(cursor, cal)) {
      const open = openingTimeOf(cursor, cal);
      const close = closingTimeOf(cursor, cal);
      if (from.getTime() < open.getTime()) return open;
      if (from.getTime() < close.getTime()) return new Date(from.getTime());
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  throw new CrmTicketError('Lịch làm việc không có ngày làm việc nào trong 2 năm tới — kiểm lại cấu hình');
}

/**
 * ⭐ Cộng GIỜ LÀM VIỆC (bỏ qua ngoài giờ, cuối tuần, ngày lễ).
 *
 * Ví dụ (lịch T2–T6, 8:00–17:00):
 *   Thứ Sáu 16:00 + 4h làm việc → Thứ Hai 11:00 (không phải Thứ Sáu 20:00)
 */
export function addWorkingHours(
  start: Date,
  hours: number,
  cal: BusinessCalendar = DEFAULT_BUSINESS_CALENDAR
): Date {
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
    throw new CrmTicketError('start phải là Date hợp lệ');
  }
  if (!Number.isFinite(hours) || hours < 0) {
    throw new CrmTicketError('hours phải là số không âm');
  }
  if (cal.workEndHour <= cal.workStartHour) {
    throw new CrmTicketError('workEndHour phải lớn hơn workStartHour');
  }

  if (hours === 0) return nextWorkingMoment(start, cal);

  let remaining = hours;
  let cursor = nextWorkingMoment(start, cal);

  // Mỗi vòng lặp tiêu thụ hết phần còn lại của 1 ngày làm việc.
  // Giới hạn vòng lặp để fail loud thay vì treo khi cấu hình lịch sai.
  for (let guard = 0; guard < 3650 && remaining > 0; guard++) {
    const dayEnd = closingTimeOf(cursor, cal);
    const availableHours = (dayEnd.getTime() - cursor.getTime()) / 3_600_000;

    if (remaining <= availableHours) {
      cursor = new Date(cursor.getTime() + remaining * 3_600_000);
      remaining = 0;
    } else {
      remaining -= availableHours;
      cursor = nextWorkingMoment(dayEnd, cal); // sang ngày làm việc kế tiếp
    }
  }

  if (remaining > 0) {
    throw new CrmTicketError('Không thể tính SLA: số giờ vượt quá giới hạn lịch làm việc');
  }
  return cursor;
}

/** Hạn SLA của 1 ticket (ISO string), tính trên lịch làm việc. */
export function computeSlaDeadline(
  createdAt: Date,
  priority: TicketPriority,
  cal: BusinessCalendar = DEFAULT_BUSINESS_CALENDAR
): Date {
  const hours = SLA_HOURS_BY_PRIORITY[priority];
  if (hours == null) throw new CrmTicketError(`Mức ưu tiên không hợp lệ: ${String(priority)}`);
  return addWorkingHours(createdAt, hours, cal);
}

/**
 * Trạng thái SLA tại thời điểm `now`.
 *  - `met`      : đã xử lý TRƯỚC hạn (có `resolvedAt` ≤ deadline)
 *  - `breached` : quá hạn (chưa xử lý, hoặc xử lý sau hạn)
 *  - `at_risk`  : còn < 20% thời gian — cần ưu tiên ngay
 *  - `on_track` : còn thời gian
 */
export function slaStatusOf(
  ticket: { slaDeadline?: string | Date | null; resolvedAt?: string | Date | null; createdAt?: string | Date | null },
  now: Date = new Date()
): SlaStatus {
  if (!ticket.slaDeadline) return 'on_track';

  const deadline = new Date(ticket.slaDeadline);
  if (Number.isNaN(deadline.getTime())) return 'on_track';

  if (ticket.resolvedAt) {
    const resolved = new Date(ticket.resolvedAt);
    if (!Number.isNaN(resolved.getTime())) {
      return resolved.getTime() <= deadline.getTime() ? 'met' : 'breached';
    }
  }

  const remainingMs = deadline.getTime() - now.getTime();
  if (remainingMs <= 0) return 'breached';

  const start = ticket.createdAt ? new Date(ticket.createdAt) : null;
  const totalMs =
    start && !Number.isNaN(start.getTime()) ? deadline.getTime() - start.getTime() : 0;
  const thresholdMs = totalMs > 0 ? totalMs * SLA_AT_RISK_RATIO : 3_600_000;
  return remainingMs <= thresholdMs ? 'at_risk' : 'on_track';
}

export const SLA_STATUS_LABEL: Record<SlaStatus, string> = {
  on_track: 'Đúng hạn',
  at_risk: 'Sắp vi phạm',
  breached: 'Vi phạm SLA',
  met: 'Hoàn thành đúng hạn',
};

/* ========================================================================== */
/*  B. RFM dùng chung                                                          */
/* ========================================================================== */

export interface RfmScore {
  /** Số ngày kể từ đơn hàng gần nhất. */
  recency: number;
  /** Số đơn hàng hoàn thành. */
  frequency: number;
  /** Tổng giá trị đã mua (VND). */
  monetary: number;
}

export type RfmTier = 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

/** Ngưỡng hạng theo TỔNG CHI TIÊU — giữ nguyên các mốc đã dùng trong crmService. */
export const RFM_TIER_THRESHOLDS: Array<{ tier: RfmTier; minMonetary: number }> = [
  { tier: 'Diamond', minMonetary: 50_000_000 },
  { tier: 'Platinum', minMonetary: 15_000_000 },
  { tier: 'Gold', minMonetary: 5_000_000 },
  { tier: 'Silver', minMonetary: 1_000_000 },
  { tier: 'Bronze', minMonetary: 0 },
];

export type RfmSegment = 'vip' | 'core' | 'potential' | 'old' | 'new';

/** Trạng thái đơn được tính là "đã mua" — khớp với crmService cũ. */
export const RFM_COUNTED_STATUSES = ['completed', 'delivered'];

/**
 * Tính RFM từ danh sách đơn hàng. THUẦN (pure) — nhận `atDate` thay vì gọi
 * `new Date()` ngầm, để chạy lại được số liệu quá khứ và test được.
 *
 * @returns `null` nếu khách chưa có đơn hoàn thành nào (khớp hành vi cũ).
 */
export function computeRfmFromOrders(
  orders: Array<{ date?: string | Date | null; status?: string | null; total?: number | string | null }>,
  atDate: Date = new Date()
): RfmScore | null {
  if (!(atDate instanceof Date) || Number.isNaN(atDate.getTime())) {
    throw new CrmTicketError('atDate phải là Date hợp lệ');
  }

  const counted = (orders ?? [])
    .filter((o) => o && RFM_COUNTED_STATUSES.includes(String(o.status ?? '')))
    .map((o) => {
      const d = o.date ? new Date(o.date) : null;
      return { time: d && !Number.isNaN(d.getTime()) ? d.getTime() : null, total: Number(o.total ?? 0) || 0 };
    })
    .filter((o) => o.time != null) as Array<{ time: number; total: number }>;

  if (counted.length === 0) return null;

  const lastTime = Math.max(...counted.map((o) => o.time));
  // ⚠️ Không dùng Math.abs: đơn có ngày TƯƠNG LAI (lệch giờ/đặt trước) không được
  // phép thành "recency dương" — kẹp về 0.
  const recencyDays = Math.max(0, Math.ceil((atDate.getTime() - lastTime) / 86_400_000));
  const monetary = counted.reduce((s, o) => s + o.total, 0);

  return { recency: recencyDays, frequency: counted.length, monetary };
}

export function rfmTierOf(monetary: number): RfmTier {
  if (!Number.isFinite(monetary) || monetary < 0) {
    throw new CrmTicketError('monetary phải là số không âm');
  }
  return (RFM_TIER_THRESHOLDS.find((t) => monetary >= t.minMonetary) ?? { tier: 'Bronze' as RfmTier }).tier;
}

/**
 * Phân khúc khách hàng từ RFM — gom logic đang bị xé ra giữa crmService và
 * Customers.tsx thành MỘT nơi để không còn 2 câu trả lời cho cùng 1 khách.
 */
export function rfmSegmentOf(score: RfmScore | null, tier?: RfmTier | string): RfmSegment {
  if (!score || score.frequency === 0) return 'new';
  if (tier === 'Diamond' || tier === 'Gold' || tier === 'Vàng') return 'vip';
  if (score.recency > 90) return 'old';
  if (score.frequency >= 3 && score.recency <= 30) return 'core';
  if (score.frequency <= 1) return 'potential';
  return 'core';
}

export const RFM_SEGMENT_LABEL: Record<RfmSegment, string> = {
  vip: 'Khách VIP',
  core: 'Khách trung thành',
  potential: 'Khách tiềm năng',
  old: 'Khách đã rời bỏ',
  new: 'Khách mới',
};

/* ========================================================================== */
/*  C. Lớp DB (nối vào bảng support_tickets thật)                             */
/* ========================================================================== */

export interface TicketRow {
  id: string;
  customerId?: string | null;
  customerName?: string | null;
  subject?: string | null;
  status?: TicketStatus | string | null;
  priority?: TicketPriority | string | null;
  type?: TicketType | string | null;
  slaDeadline?: string | null;
  resolvedAt?: string | null;
  createdAt?: string | null;
}

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Mới',
  in_progress: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  closed: 'Đóng',
};

/** Trạng thái kết thúc → tự động ghi `resolvedAt` nếu chưa có. */
export const TICKET_CLOSED_STATUSES: TicketStatus[] = ['resolved', 'closed'];

/**
 * Đọc ticket từ Supabase. Dùng dynamic import để module này vẫn là "thuần"
 * khi chỉ test phần SLA/RFM.
 */
export async function listTickets(opts: { limit?: number; status?: TicketStatus | string } = {}): Promise<TicketRow[]> {
  const { db, collection, getDocs, query, orderBy, limit, where } = await import('./dbService');
  const constraints: any[] = [];
  if (opts.status) constraints.push(where('status', '==', opts.status));
  constraints.push(orderBy('createdAt', 'desc'));
  if (opts.limit) constraints.push(limit(opts.limit));

  const snap = await getDocs(query(collection(db, 'support_tickets'), ...constraints));
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as TicketRow[];
}

export interface CreateTicketInput {
  customerId?: string | null;
  customerName?: string | null;
  subject: string;
  priority: TicketPriority;
  type: TicketType;
  calendar?: BusinessCalendar;
  createdAt?: Date;
}

/**
 * Tạo ticket THẬT vào bảng `support_tickets`, kèm `slaDeadline` tính theo
 * GIỜ HÀNH CHÍNH (thay vì cộng giờ thực như crmService cũ).
 */
export async function createTicket(input: CreateTicketInput): Promise<TicketRow> {
  if (!input.subject?.trim()) throw new CrmTicketError('Tiêu đề ticket không được trống');

  const { db, collection, addDoc } = await import('./dbService');
  const createdAt = input.createdAt ?? new Date();
  const sla = computeSlaDeadline(createdAt, input.priority, input.calendar ?? DEFAULT_BUSINESS_CALENDAR);

  const payload = {
    customerId: input.customerId ?? null,
    customerName: input.customerName ?? null,
    subject: input.subject.trim(),
    status: 'open' as TicketStatus,
    priority: input.priority,
    type: input.type,
    slaDeadline: sla.toISOString(),
    resolvedAt: null,
    createdAt: createdAt.toISOString(),
  };

  const ref = await addDoc(collection(db, 'support_tickets'), payload);
  return { id: ref.id, ...payload };
}

/** Cập nhật ticket; chuyển sang trạng thái kết thúc sẽ tự ghi `resolvedAt`. */
export async function updateTicket(
  id: string,
  patch: Partial<Pick<TicketRow, 'status' | 'priority' | 'subject' | 'customerName'>> & { resolvedAt?: Date }
): Promise<void> {
  const { db, doc, updateDoc } = await import('./dbService');

  // Tách riêng resolvedAt (Date) — không đưa thẳng Date xuống DB, phải chuyển ISO.
  const { resolvedAt, ...rest } = patch;
  const data: Record<string, unknown> = { ...rest };

  const nextStatus = patch.status as TicketStatus | undefined;
  if (nextStatus && TICKET_CLOSED_STATUSES.includes(nextStatus)) {
    data.resolvedAt = (resolvedAt ?? new Date()).toISOString();
  } else if (resolvedAt) {
    data.resolvedAt = resolvedAt.toISOString();
  }

  await updateDoc(doc(db, 'support_tickets', id), data);
}
