import { describe, it, expect } from 'vitest';
import {
  addWorkingHours,
  nextWorkingMoment,
  computeSlaDeadline,
  slaStatusOf,
  isoLocalDate,
  isWorkingDay,
  computeRfmFromOrders,
  rfmTierOf,
  rfmSegmentOf,
  DEFAULT_BUSINESS_CALENDAR,
  SLA_HOURS_BY_PRIORITY,
  CrmTicketError,
  type BusinessCalendar,
} from './crmTicketService';

const CAL = DEFAULT_BUSINESS_CALENDAR; // T2–T6, 08:00–17:00

/** Thứ Sáu 18/09/2026 (ngày làm việc). */
const FRI_16H = new Date(2026, 8, 18, 16, 0, 0);
const MON_09H = new Date(2026, 8, 21, 9, 0, 0);

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(
    d.getHours()
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

describe('GĐ 4.6 — SLA theo GIỜ HÀNH CHÍNH', () => {
  it('🔴 cộng giờ làm việc NHẢY QUA CUỐI TUẦN (bug của code cũ)', () => {
    // Code cũ: `now + 24h` → Thứ Sáu 16:00 + 4h = Thứ Sáu 20:00 (ngoài giờ, vô nghĩa)
    const sla = addWorkingHours(FRI_16H, 4, CAL);
    // Đúng: 1h còn lại của Thứ Sáu (16→17) + 3h sáng Thứ Hai (08→11)
    expect(fmt(sla)).toBe('2026-09-21 11:00');
  });

  it('trong cùng ngày làm việc → cộng bình thường', () => {
    expect(fmt(addWorkingHours(MON_09H, 4, CAL))).toBe('2026-09-21 13:00');
  });

  it('bắt đầu NGOÀI GIỜ (20:00 tối) → dời sang sáng hôm sau', () => {
    const night = new Date(2026, 8, 21, 20, 0, 0); // T2 20:00
    expect(fmt(nextWorkingMoment(night, CAL))).toBe('2026-09-22 08:00');
  });

  it('bắt đầu vào THỨ BẢY → dời sang sáng Thứ Hai', () => {
    const sat = new Date(2026, 8, 19, 10, 0, 0); // T7 10:00
    expect(fmt(nextWorkingMoment(sat, CAL))).toBe('2026-09-21 08:00');
  });

  it('bắt đầu TRƯỚC giờ mở cửa (6h sáng) → dời đến 08:00 cùng ngày', () => {
    const early = new Date(2026, 8, 21, 6, 0, 0);
    expect(fmt(nextWorkingMoment(early, CAL))).toBe('2026-09-21 08:00');
  });

  it('tôn trọng NGÀY LỄ', () => {
    const cal: BusinessCalendar = { ...CAL, holidays: ['2026-09-21'] }; // nghỉ T2
    const sla = addWorkingHours(new Date(2026, 8, 21, 9, 0, 0), 8, cal);
    // 8h làm việc của T2 bị nghỉ → lùi sang T3, 08:00 + 8h = 16:00
    expect(fmt(sla)).toBe('2026-09-22 16:00');
  });

  it('0 giờ → thời điểm làm việc hợp lệ gần nhất', () => {
    expect(fmt(addWorkingHours(new Date(2026, 8, 19, 10, 0, 0), 0, CAL))).toBe('2026-09-21 08:00');
  });

  it('computeSlaDeadline dùng đúng số giờ theo priority', () => {
    const created = new Date(2026, 8, 21, 9, 0, 0); // T2 09:00
    expect(fmt(computeSlaDeadline(created, 'urgent', CAL))).toBe('2026-09-21 10:00');
    expect(fmt(computeSlaDeadline(created, 'high', CAL))).toBe('2026-09-21 13:00');
    // 1 ngày làm việc = 9 giờ (08:00–17:00). Bắt đầu T2 09:00:
    // medium = 24h → T2 còn 8h (09→17) + T3 trọn 9h = 17h, còn 7h → T4 08:00 + 7h = 15:00
    expect(fmt(computeSlaDeadline(created, 'medium', CAL))).toBe('2026-09-23 15:00');
    // low = 48h → T2 8h + T3–T6 4×9h = 44h, còn 4h; qua T7/CN → T2 tuần sau 08:00 + 4h = 12:00
    expect(fmt(computeSlaDeadline(created, 'low', CAL))).toBe('2026-09-28 12:00');
  });

  it('priority không hợp lệ → ném lỗi (không âm thầm dùng mặc định)', () => {
    expect(() => computeSlaDeadline(MON_09H, 'super-urgent' as never, CAL)).toThrow(CrmTicketError);
  });

  it('lịch sai (workEnd ≤ workStart) → ném lỗi, không treo', () => {
    expect(() => addWorkingHours(MON_09H, 4, { ...CAL, workEndHour: 8 })).toThrow(CrmTicketError);
  });

  it('lịch KHÔNG CÓ ngày làm việc → ném lỗi thay vì vòng lặp vô hạn', () => {
    expect(() => addWorkingHours(MON_09H, 4, { ...CAL, workdays: [] })).toThrow(/không có ngày làm việc/);
  });
});

describe('GĐ 4.6 — trạng thái SLA', () => {
  const now = new Date(2026, 8, 21, 10, 0, 0);

  it('còn nhiều thời gian → on_track', () => {
    const t = { createdAt: now.toISOString(), slaDeadline: new Date(2026, 8, 23, 10, 0, 0).toISOString() };
    expect(slaStatusOf(t, now)).toBe('on_track');
  });

  it('còn < 20% thời gian → at_risk (ưu tiên xử lý ngay)', () => {
    const created = new Date(2026, 8, 21, 9, 0, 0);
    const deadline = new Date(2026, 8, 21, 13, 0, 0); // 4h
    const almost = new Date(2026, 8, 21, 12, 30, 0); // còn 30' = 12,5%
    expect(slaStatusOf({ createdAt: created.toISOString(), slaDeadline: deadline.toISOString() }, almost)).toBe('at_risk');
  });

  it('quá hạn chưa xử lý → breached', () => {
    const t = { createdAt: now.toISOString(), slaDeadline: new Date(2026, 8, 21, 9, 0, 0).toISOString() };
    expect(slaStatusOf(t, now)).toBe('breached');
  });

  it('xử lý TRƯỚC hạn → met', () => {
    const t = {
      createdAt: new Date(2026, 8, 21, 8, 0, 0).toISOString(),
      slaDeadline: new Date(2026, 8, 21, 12, 0, 0).toISOString(),
      resolvedAt: new Date(2026, 8, 21, 11, 0, 0).toISOString(),
    };
    expect(slaStatusOf(t, now)).toBe('met');
  });

  it('xử lý SAU hạn → breached (dù đã đóng)', () => {
    const t = {
      createdAt: new Date(2026, 8, 21, 8, 0, 0).toISOString(),
      slaDeadline: new Date(2026, 8, 21, 12, 0, 0).toISOString(),
      resolvedAt: new Date(2026, 8, 21, 15, 0, 0).toISOString(),
    };
    expect(slaStatusOf(t, now)).toBe('breached');
  });

  it('ticket không có SLA → không bị đánh giá (on_track, không ném lỗi)', () => {
    expect(slaStatusOf({ slaDeadline: null }, now)).toBe('on_track');
  });
});

describe('GĐ 4.6 — RFM dùng chung', () => {
  const at = new Date(2026, 8, 21, 12, 0, 0);

  it('tính recency / frequency / monetary từ đơn hoàn thành', () => {
    const rfm = computeRfmFromOrders(
      [
        { date: '2026-09-01T00:00:00Z', status: 'completed', total: 1_000_000 },
        { date: '2026-09-11T00:00:00Z', status: 'delivered', total: 2_000_000 },
        { date: '2026-09-20T00:00:00Z', status: 'cancelled', total: 9_000_000 }, // bỏ
      ],
      at
    );
    expect(rfm).not.toBeNull();
    expect(rfm?.frequency).toBe(2);
    expect(rfm?.monetary).toBe(3_000_000);
    expect(rfm?.recency).toBeGreaterThan(0);
  });

  it('chưa có đơn hoàn thành → null (khớp hành vi cũ)', () => {
    expect(computeRfmFromOrders([], at)).toBeNull();
    expect(computeRfmFromOrders([{ date: '2026-09-01', status: 'pending', total: 100 }], at)).toBeNull();
  });

  it('🔴 đơn có ngày TƯƠNG LAI không tạo recency âm (code cũ dùng Math.abs)', () => {
    const rfm = computeRfmFromOrders([{ date: '2026-12-01T00:00:00Z', status: 'completed', total: 100 }], at);
    expect(rfm?.recency).toBe(0);
  });

  it('hạng theo tổng chi tiêu', () => {
    expect(rfmTierOf(0)).toBe('Bronze');
    expect(rfmTierOf(1_000_000)).toBe('Silver');
    expect(rfmTierOf(6_000_000)).toBe('Gold');
    expect(rfmTierOf(20_000_000)).toBe('Platinum');
    expect(rfmTierOf(99_000_000)).toBe('Diamond');
  });

  it('phân khúc: VIP · trung thành · tiềm năng · rời bỏ · mới', () => {
    expect(rfmSegmentOf(null)).toBe('new');
    expect(rfmSegmentOf({ recency: 5, frequency: 10, monetary: 60_000_000 }, 'Diamond')).toBe('vip');
    expect(rfmSegmentOf({ recency: 120, frequency: 10, monetary: 60_000_000 })).toBe('old');
    expect(rfmSegmentOf({ recency: 10, frequency: 5, monetary: 3_000_000 })).toBe('core');
    expect(rfmSegmentOf({ recency: 10, frequency: 1, monetary: 500_000 })).toBe('potential');
  });

  it('dữ liệu rác → ném lỗi, không sinh RFM sai lặng lẽ', () => {
    expect(() => computeRfmFromOrders([], new Date('x-nhảm'))).toThrow(CrmTicketError);
    expect(() => rfmTierOf(-1)).toThrow(CrmTicketError);
  });
});

describe('GĐ 4.6 — lịch làm việc', () => {
  it('isoLocalDate theo GIỜ ĐỊA PHƯƠNG (không dùng toISOString — lệch múi giờ)', () => {
    // 23:30 giờ VN ngày 21/09 → toISOString sẽ ra 22/09 (UTC) → sai ngày lễ.
    expect(isoLocalDate(new Date(2026, 8, 21, 23, 30))).toBe('2026-09-21');
  });

  it('isWorkingDay đúng T2–T6, loại CN & ngày lễ', () => {
    expect(isWorkingDay(new Date(2026, 8, 21), CAL)).toBe(true); // T2
    expect(isWorkingDay(new Date(2026, 8, 20), CAL)).toBe(false); // CN
    expect(isWorkingDay(new Date(2026, 8, 21), { ...CAL, holidays: ['2026-09-21'] })).toBe(false);
  });

  it('SLA_HOURS_BY_PRIORITY giữ đúng quy tắc cũ (1/4/24/48)', () => {
    expect(SLA_HOURS_BY_PRIORITY).toEqual({ urgent: 1, high: 4, medium: 24, low: 48 });
  });
});
