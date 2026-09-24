import { describe, it, expect } from 'vitest';
import { formatDateVN, formatDateTimeVN, formatMonthVN, formatMonthYearVN } from './dateUtils';

describe('dateUtils - Định dạng ngày tháng Kế toán VN (dd/mm/yyyy & mm/yyyy)', () => {
  describe('formatDateVN (dd/mm/yyyy)', () => {
    it('định dạng chính xác chuỗi ngày ISO yyyy-mm-dd', () => {
      expect(formatDateVN('2026-03-01')).toBe('01/03/2026');
      expect(formatDateVN('2026-12-31')).toBe('31/12/2026');
    });

    it('giữ nguyên chuỗi đã đúng định dạng dd/mm/yyyy', () => {
      expect(formatDateVN('15/03/2026')).toBe('15/03/2026');
    });

    it('xử lý giá trị null hoặc undefined', () => {
      expect(formatDateVN(null)).toBe('');
      expect(formatDateVN(undefined)).toBe('');
    });
  });

  describe('formatMonthVN (mm/yyyy)', () => {
    it('định dạng chuẩn từ chuỗi yyyy-mm', () => {
      expect(formatMonthVN('2026-03')).toBe('03/2026');
      expect(formatMonthVN('2026-1')).toBe('01/2026');
      expect(formatMonthVN('2026-12')).toBe('12/2026');
    });

    it('định dạng chuẩn từ chuỗi yyyy/mm', () => {
      expect(formatMonthVN('2026/03')).toBe('03/2026');
      expect(formatMonthVN('2026/3')).toBe('03/2026');
    });

    it('giữ nguyên hoặc chuẩn hóa chuỗi mm/yyyy hoặc m/yyyy', () => {
      expect(formatMonthVN('03/2026')).toBe('03/2026');
      expect(formatMonthVN('3/2026')).toBe('03/2026');
    });

    it('xử lý chuỗi có tiền tố như T03/2026 hoặc Tháng 3/2026', () => {
      expect(formatMonthVN('T03/2026')).toBe('03/2026');
      expect(formatMonthVN('T3/2026')).toBe('03/2026');
      expect(formatMonthVN('Tháng 3/2026')).toBe('03/2026');
      expect(formatMonthVN('Tháng 03/2026')).toBe('03/2026');
    });

    it('trích xuất mm/yyyy từ chuỗi ngày đầy đủ yyyy-mm-dd hoặc dd/mm/yyyy', () => {
      expect(formatMonthVN('2026-03-15')).toBe('03/2026');
      expect(formatMonthVN('15/03/2026')).toBe('03/2026');
    });

    it('xử lý Date object', () => {
      const d = new Date(2026, 2, 15); // Month 2 is March in JS Date (0-indexed)
      expect(formatMonthVN(d)).toBe('03/2026');
    });

    it('xử lý null và undefined an toàn', () => {
      expect(formatMonthVN(null)).toBe('');
      expect(formatMonthVN(undefined)).toBe('');
    });
  });

  describe('formatMonthYearVN (mm/yyyy)', () => {
    it('ghép tháng và năm thành mm/yyyy với số 0 ở đầu', () => {
      expect(formatMonthYearVN(3, 2026)).toBe('03/2026');
      expect(formatMonthYearVN(11, 2026)).toBe('11/2026');
      expect(formatMonthYearVN('1', '2026')).toBe('01/2026');
    });
  });
});
