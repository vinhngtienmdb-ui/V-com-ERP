import { describe, it, expect } from 'vitest';
import {
  buildOpenToBuyPlan,
  computeOpenToBuyPeriod,
  applyCashLimit,
  endingInventoryFromWeeks,
  weeksOfSupply,
  roundVnd,
  WEEKS_PER_MONTH,
  OpenToBuyError,
  type OpenToBuyPeriodInput,
} from './openToBuyService';

const WPM = WEEKS_PER_MONTH;

describe('GĐ 4.4 — công thức OTB cơ bản', () => {
  it('OTB = bán + giảm giá + hao hụt + tồn cuối mục tiêu − tồn đầu − hàng đã đặt', () => {
    const line = computeOpenToBuyPeriod(
      {
        period: '2026-10',
        forecastSales: 100_000_000,
        plannedMarkdown: 5_000_000,
        plannedShrinkage: 2_000_000,
        onOrderRetail: 20_000_000,
        targetEndingInventoryRetail: 30_000_000,
      },
      10_000_000 // tồn đầu
    );

    // 100 + 5 + 2 + 30 − 10 − 20 = 107 triệu
    expect(line.otbRetail).toBe(107_000_000);
    expect(line.totalRequirementRetail).toBe(107_000_000);
  });

  it('không có hàng đã đặt → OTB cao hơn (OTB trừ cả onOrder để KHÔNG MUA TRÙNG)', () => {
    const base: OpenToBuyPeriodInput = {
      period: '2026-10',
      forecastSales: 100_000_000,
      targetEndingInventoryRetail: 30_000_000,
    };
    const withOrder = computeOpenToBuyPeriod({ ...base, onOrderRetail: 25_000_000 }, 10_000_000);
    const noOrder = computeOpenToBuyPeriod({ ...base, onOrderRetail: 0 }, 10_000_000);

    expect(noOrder.otbRetail - withOrder.otbRetail).toBe(25_000_000);
  });

  it('quy ra GIÁ VỐN theo tỷ lệ lãi gộp (markup 30% → 100đ bán cần 70đ vốn)', () => {
    const line = computeOpenToBuyPeriod(
      { period: '2026-10', forecastSales: 100_000_000, onOrderRetail: 0, targetEndingInventoryRetail: 0 },
      0,
      0.3
    );
    expect(line.otbRetail).toBe(100_000_000);
    expect(line.otbCost).toBe(70_000_000);
  });

  it('OTB ÂM hợp lệ và có ý nghĩa: đã mua vượt kế hoạch (không tự kẹp về 0)', () => {
    const line = computeOpenToBuyPeriod(
      {
        period: '2026-10',
        forecastSales: 50_000_000,
        onOrderRetail: 100_000_000, // đã đặt gấp đôi kế hoạch bán
        targetEndingInventoryRetail: 0,
      },
      0
    );
    expect(line.otbRetail).toBe(-50_000_000);
    expect(line.warnings.join(' ')).toMatch(/OTB ÂM/);
  });
});

describe('GĐ 4.4 — tồn cuối kỳ & số tuần cung ứng', () => {
  it('suy tồn cuối từ số tuần cung ứng', () => {
    // bán 100tr/tháng, muốn dự trữ 2 tuần
    expect(endingInventoryFromWeeks(100_000_000, 2, WPM)).toBe(roundVnd((100_000_000 / WPM) * 2));
  });

  it('weeksOfSupply = tồn / bán 1 tuần', () => {
    // bán 100tr/tháng ≈ 23,08tr/tuần; tồn 92tr ≈ 4 tuần cung ứng
    expect(weeksOfSupply(92_000_000, 100_000_000, WPM)).toBeCloseTo(4, 1);
  });

  it('không bán gì mà vẫn có tồn → vô hạn tuần (tồn chết)', () => {
    expect(weeksOfSupply(10_000_000, 0, WPM)).toBe(Infinity);
    expect(weeksOfSupply(0, 0, WPM)).toBe(0);
  });

  it('cảnh báo khi tồn mục tiêu vượt 8 tuần cung ứng', () => {
    const line = computeOpenToBuyPeriod(
      { period: '2026-10', forecastSales: 100_000_000, targetEndingInventoryRetail: 300_000_000 },
      0
    );
    expect(line.weeksOfSupply).toBeGreaterThan(8);
    expect(line.warnings.join(' ')).toMatch(/vượt ngưỡng/);
  });

  it('hàng DỄ HỎNG dùng ngưỡng 3 tuần (nông sản) thay vì 8', () => {
    const perish = computeOpenToBuyPeriod(
      { period: '2026-10', forecastSales: 100_000_000, targetEndingInventoryRetail: 80_000_000, perishable: true },
      0
    );
    // ~8.3 tuần → vượt ngưỡng 3 tuần của hàng tươi
    expect(perish.warnings.join(' ')).toMatch(/hàng dễ hỏng/);

    const normal = computeOpenToBuyPeriod(
      { period: '2026-10', forecastSales: 100_000_000, targetEndingInventoryRetail: 80_000_000 },
      0
    );
    expect(normal.warnings.join(' ')).not.toMatch(/hàng dễ hỏng/);
  });

  it('hàng dễ hỏng chưa tính hao hụt → cảnh báo kế hoạch mua sẽ THIẾU', () => {
    const line = computeOpenToBuyPeriod(
      { period: '2026-10', forecastSales: 100_000_000, targetEndingInventoryRetail: 10_000_000, perishable: true },
      0
    );
    expect(line.warnings.join(' ')).toMatch(/chưa tính hao hụt/);
  });

  it('tồn cuối = 0 mà vẫn có kế hoạch bán → cảnh báo GÃY HÀNG', () => {
    const line = computeOpenToBuyPeriod(
      { period: '2026-10', forecastSales: 100_000_000, targetEndingInventoryRetail: 0 },
      0
    );
    expect(line.warnings.join(' ')).toMatch(/GÃY HÀNG/);
  });
});

describe('GĐ 4.4 — kế hoạch nhiều kỳ (nối tồn kho)', () => {
  it('tồn cuối kỳ trước TỰ ĐỘNG là tồn đầu kỳ sau', () => {
    const plan = buildOpenToBuyPlan({
      openingInventoryRetail: 10_000_000,
      periods: [
        { period: '2026-10', forecastSales: 100_000_000, targetEndingInventoryRetail: 40_000_000 },
        { period: '2026-11', forecastSales: 120_000_000, targetEndingInventoryRetail: 50_000_000 },
      ],
    });

    expect(plan.lines[0].beginningInventoryRetail).toBe(10_000_000);
    expect(plan.lines[1].beginningInventoryRetail).toBe(40_000_000); // = tồn cuối T10
  });

  it('mua tháng 10 nhiều → OTB tháng 11 giảm tương ứng', () => {
    const a = buildOpenToBuyPlan({
      openingInventoryRetail: 0,
      periods: [
        { period: '2026-10', forecastSales: 100_000_000, targetEndingInventoryRetail: 20_000_000 },
        { period: '2026-11', forecastSales: 100_000_000, targetEndingInventoryRetail: 20_000_000 },
      ],
    });
    const b = buildOpenToBuyPlan({
      openingInventoryRetail: 0,
      periods: [
        { period: '2026-10', forecastSales: 100_000_000, targetEndingInventoryRetail: 60_000_000 },
        { period: '2026-11', forecastSales: 100_000_000, targetEndingInventoryRetail: 20_000_000 },
      ],
    });

    // T10 mua thêm 40tr → T11 phải mua ÍT hơn 40tr
    expect(b.lines[0].otbRetail - a.lines[0].otbRetail).toBe(40_000_000);
    expect(a.lines[1].otbRetail - b.lines[1].otbRetail).toBe(40_000_000);
  });

  it('tổng cộng đúng', () => {
    const plan = buildOpenToBuyPlan({
      openingInventoryRetail: 0,
      plannedMarkupRate: 0.25,
      periods: [
        { period: '2026-10', forecastSales: 100_000_000, targetEndingInventoryRetail: 20_000_000 },
        { period: '2026-11', forecastSales: 100_000_000, targetEndingInventoryRetail: 20_000_000 },
      ],
    });
    expect(plan.totals.forecastSales).toBe(200_000_000);
    // T10: 100 + 20 − 0 = 120tr · T11: 100 + 20 − 20(tồn đầu = tồn cuối T10) = 100tr
    expect(plan.totals.otbRetail).toBe(220_000_000);
    expect(plan.totals.otbCost).toBe(165_000_000); // × 0.75
  });

  it('cảnh báo khi kế hoạch có kỳ bị trùng', () => {
    const plan = buildOpenToBuyPlan({
      openingInventoryRetail: 0,
      periods: [
        { period: '2026-10', forecastSales: 100_000_000 },
        { period: '2026-10', forecastSales: 100_000_000 },
      ],
    });
    expect(plan.warnings.join(' ')).toMatch(/BỊ TRÙNG/);
  });
});

describe('GĐ 4.4 — 🔑 ràng buộc TIỀN MẶT (đặc thù VComm)', () => {
  it('thiếu tiền → kỳ GẦN được ưu tiên, kỳ sau bị hoãn', () => {
    const plan = buildOpenToBuyPlan({
      openingInventoryRetail: 0,
      plannedMarkupRate: 0.5,
      cashLimit: 40_000_000, // chỉ đủ mua 40tr, trong khi cần 100tr (T10) + 100tr (T11)
      periods: [
        { period: '2026-10', forecastSales: 200_000_000, targetEndingInventoryRetail: 0 }, // otbCost = 100tr
        { period: '2026-11', forecastSales: 200_000_000, targetEndingInventoryRetail: 0 }, // otbCost = 100tr
      ],
    });

    expect(plan.lines[0].otbCost).toBe(100_000_000);
    expect(plan.lines[0].affordableOtbCost).toBe(40_000_000);
    expect(plan.lines[0].deferredOtbCost).toBe(60_000_000);
    expect(plan.lines[1].affordableOtbCost).toBe(0);
    expect(plan.lines[1].deferredOtbCost).toBe(100_000_000);
    expect(plan.totals.deferredOtbCost).toBe(160_000_000);
    expect(plan.warnings.join(' ')).toMatch(/Thiếu .* tiền mặt/);
  });

  it('đủ tiền → mọi kỳ mua trọn vẹn, không có hoãn', () => {
    const plan = buildOpenToBuyPlan({
      openingInventoryRetail: 0,
      cashLimit: 500_000_000,
      periods: [
        { period: '2026-10', forecastSales: 100_000_000, targetEndingInventoryRetail: 0 },
        { period: '2026-11', forecastSales: 100_000_000, targetEndingInventoryRetail: 0 },
      ],
    });
    expect(plan.totals.deferredOtbCost).toBe(0);
    expect(plan.totals.affordableOtbCost).toBe(200_000_000);
  });

  it('OTB ÂM không chiếm ngân sách (không "trả lại" tiền cho kỳ sau)', () => {
    const lines = [
      computeOpenToBuyPeriod({ period: '2026-10', forecastSales: 10_000_000, onOrderRetail: 50_000_000 }, 0), // âm
      computeOpenToBuyPeriod({ period: '2026-11', forecastSales: 60_000_000, targetEndingInventoryRetail: 0 }, 0),
    ];
    const capped = applyCashLimit(lines, 30_000_000);
    expect(capped[0].affordableOtbCost).toBe(0);
    expect(capped[0].deferredOtbCost).toBe(0);
    expect(capped[1].affordableOtbCost).toBe(30_000_000);
  });

  it('không truyền cashLimit → affordableOtbCost bằng otbCost (tương thích ngược)', () => {
    const plan = buildOpenToBuyPlan({
      openingInventoryRetail: 0,
      periods: [{ period: '2026-10', forecastSales: 100_000_000, targetEndingInventoryRetail: 0 }],
    });
    expect(plan.lines[0].affordableOtbCost).toBeUndefined();
    expect(plan.totals.affordableOtbCost).toBe(100_000_000);
  });
});

describe('GĐ 4.4 — chống dữ liệu rác', () => {
  it('forecastSales âm → ném lỗi', () => {
    expect(() =>
      computeOpenToBuyPeriod({ period: '2026-10', forecastSales: -1, targetEndingInventoryRetail: 0 }, 0)
    ).toThrow(OpenToBuyError);
  });

  it('tồn đầu âm → ném lỗi', () => {
    expect(() =>
      computeOpenToBuyPeriod({ period: '2026-10', forecastSales: 1, targetEndingInventoryRetail: 0 }, -5)
    ).toThrow(OpenToBuyError);
  });

  it('markup ≥ 1 → ném lỗi (sẽ ra giá vốn âm)', () => {
    expect(() =>
      computeOpenToBuyPeriod({ period: '2026-10', forecastSales: 1, targetEndingInventoryRetail: 0 }, 0, 1.2)
    ).toThrow(/plannedMarkupRate/);
  });

  it('NaN → ném lỗi (không lén truyền NaN xuống DB)', () => {
    expect(() =>
      computeOpenToBuyPeriod({ period: '2026-10', forecastSales: NaN, targetEndingInventoryRetail: 0 }, 0)
    ).toThrow(OpenToBuyError);
  });

  it('kế hoạch rỗng → ném lỗi', () => {
    expect(() => buildOpenToBuyPlan({ openingInventoryRetail: 0, periods: [] })).toThrow(OpenToBuyError);
  });

  it('period trống → ném lỗi', () => {
    expect(() =>
      computeOpenToBuyPeriod({ period: '', forecastSales: 1, targetEndingInventoryRetail: 0 }, 0)
    ).toThrow(OpenToBuyError);
  });
});
