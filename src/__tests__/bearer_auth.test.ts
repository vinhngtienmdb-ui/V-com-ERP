import { describe, it, expect } from 'vitest';
import { parseBearerToken, verifyBearerToken } from '../lib/bearerAuth';

describe('bearerAuth — parseBearerToken', () => {
  it('trả token khi header đúng định dạng Bearer', () => {
    expect(parseBearerToken('Bearer abc123')).toBe('abc123');
  });

  it('trim khoảng trắng thừa quanh token', () => {
    expect(parseBearerToken('Bearer   xyz  ')).toBe('xyz');
  });

  it('trả null khi header null/undefined', () => {
    expect(parseBearerToken(null)).toBeNull();
    expect(parseBearerToken(undefined)).toBeNull();
  });

  it('trả null khi không bắt đầu bằng "Bearer "', () => {
    expect(parseBearerToken('Basic abc')).toBeNull();
    expect(parseBearerToken('abc123')).toBeNull();
  });

  it('trả null khi chỉ có "Bearer" không có token', () => {
    expect(parseBearerToken('Bearer ')).toBeNull();
    expect(parseBearerToken('Bearer')).toBeNull();
  });
});

describe('bearerAuth — verifyBearerToken (fail-closed)', () => {
  it('đúng khi token khớp khoá kỳ vọng', () => {
    expect(verifyBearerToken('Bearer s3cr3t', 's3cr3t')).toBe(true);
  });

  it('sai khi token không khớp', () => {
    expect(verifyBearerToken('Bearer wrong', 's3cr3t')).toBe(false);
  });

  it('sai khi header thiếu/không đúng định dạng', () => {
    expect(verifyBearerToken(null, 's3cr3t')).toBe(false);
    expect(verifyBearerToken('Basic s3cr3t', 's3cr3t')).toBe(false);
    expect(verifyBearerToken('Bearer ', 's3cr3t')).toBe(false);
  });

  it('🔴 FAIL-CLOSED: trả false khi khoá chưa cấu hình (rỗng)', () => {
    // Nếu sai thành true ở đây → endpoint mở khi chưa đặt khoá (mất an toàn).
    expect(verifyBearerToken('Bearer anything', '')).toBe(false);
    expect(verifyBearerToken('Bearer anything', undefined)).toBe(false);
    expect(verifyBearerToken('Bearer anything', null)).toBe(false);
  });

  it('sai khi độ dài token khác khoá (không lọt qua timing-safe)', () => {
    expect(verifyBearerToken('Bearer s3cr3tX', 's3cr3t')).toBe(false);
    expect(verifyBearerToken('Bearer s3cr', 's3cr3t')).toBe(false);
  });

  it('khớp chính xác cả chuỗi dài', () => {
    const key = 'a'.repeat(32);
    expect(verifyBearerToken(`Bearer ${key}`, key)).toBe(true);
    expect(verifyBearerToken(`Bearer ${'b'.repeat(32)}`, key)).toBe(false);
  });
});
