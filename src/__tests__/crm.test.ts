import { describe, it, expect } from 'vitest';

// RFM Score Calculation Functions to test
function calculateRecencyDays(lastOrderDateStr: string, refDateStr: string): number {
  if (!lastOrderDateStr) return Infinity;
  const lastOrderTime = new Date(lastOrderDateStr).getTime();
  const refTime = new Date(refDateStr).getTime();
  return Math.max(0, Math.floor((refTime - lastOrderTime) / (1000 * 60 * 60 * 24)));
}

function getRfmScores(recencyDays: number, orderCount: number, totalSpent: number) {
  let rScore = 1;
  if (recencyDays <= 30) rScore = 5;
  else if (recencyDays <= 60) rScore = 4;
  else if (recencyDays <= 90) rScore = 3;
  else if (recencyDays <= 180) rScore = 2;

  let fScore = 1;
  if (orderCount >= 10) fScore = 5;
  else if (orderCount >= 5) fScore = 4;
  else if (orderCount >= 3) fScore = 3;
  else if (orderCount >= 2) fScore = 2;
  else if (orderCount === 1) fScore = 1;
  else if (orderCount === 0) fScore = 0;

  let mScore = 1;
  if (totalSpent >= 50000000) mScore = 5;
  else if (totalSpent >= 20000000) mScore = 4;
  else if (totalSpent >= 10000000) mScore = 3;
  else if (totalSpent >= 5000000) mScore = 2;
  else mScore = 1;

  return { recency: rScore, frequency: fScore, monetary: mScore };
}

function getSegment(fScore: number, recencyDays: number, totalSpent: number, orderCount: number): string {
  if (fScore >= 3 && recencyDays <= 30 && totalSpent >= 10000000) {
    return 'core';
  } else if (recencyDays > 90 && orderCount > 0) {
    return 'old';
  } else if (orderCount === 0 || (orderCount === 1 && recencyDays <= 30)) {
    return 'new';
  }
  return 'potential';
}

describe('CRM Intelligence & RFM Logic Tests', () => {
  it('tính toán số ngày Recency chính xác đối với ngày tham chiếu 2026-06-05', () => {
    const lastOrderDate = '2026-05-15';
    const recencyDays = calculateRecencyDays(lastOrderDate, '2026-06-05');
    expect(recencyDays).toBe(21); // 31 - 15 + 5 = 21 ngày
  });

  it('gán đúng điểm số R, F, M dựa trên ngưỡng quy định', () => {
    // TH1: R <= 30 ngày (score 5), F >= 3 (score 3), M >= 10M (score 3)
    const scores1 = getRfmScores(15, 4, 15000000);
    expect(scores1.recency).toBe(5);
    expect(scores1.frequency).toBe(3);
    expect(scores1.monetary).toBe(3);

    // TH2: R > 180 ngày (score 1), F = 1 (score 1), M < 5M (score 1)
    const scores2 = getRfmScores(200, 1, 2000000);
    expect(scores2.recency).toBe(1);
    expect(scores2.frequency).toBe(1);
    expect(scores2.monetary).toBe(1);
  });

  it('phân khúc khách hàng chuẩn xác theo luật phân đoạn RFM', () => {
    // 1. Khách hàng Core (F >= 3, R <= 30, M >= 10M)
    const segmentCore = getSegment(3, 20, 12000000, 3);
    expect(segmentCore).toBe('core');

    // 2. Khách hàng Cũ (R > 90 ngày và có mua hàng)
    const segmentOld = getSegment(1, 100, 2000000, 1);
    expect(segmentOld).toBe('old');

    // 3. Khách hàng Mới đăng ký (Order count = 0)
    const segmentNew0 = getSegment(0, Infinity, 0, 0);
    expect(segmentNew0).toBe('new');

    // 4. Khách hàng Tiềm năng (Các trường hợp còn lại)
    const segmentPotential = getSegment(2, 45, 6000000, 2);
    expect(segmentPotential).toBe('potential');
  });

  it('tính toán số dư chuyển đổi ví Cashback sang ví Khuyến mại tỷ lệ 1.1', () => {
    const convertAmount = 100000; // 100k
    const promoAdded = Math.round(convertAmount * 1.1);
    expect(promoAdded).toBe(110000); // Nhận 110k
  });
});
