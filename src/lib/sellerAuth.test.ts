import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  issueSellerToken,
  verifySellerToken,
  parseBearerToken,
  SellerAuthError,
} from './sellerAuth';

describe('M1 — sellerAuth token sign/verify (revert-proof)', () => {
  const ORIGINAL = process.env.SELLER_TOKEN_SECRET;

  beforeEach(() => {
    process.env.SELLER_TOKEN_SECRET = 'unit-test-secret';
  });

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.SELLER_TOKEN_SECRET;
    else process.env.SELLER_TOKEN_SECRET = ORIGINAL;
  });

  it('round-trip issue + verify trả đúng sellerId', () => {
    const t = issueSellerToken('seller-abc-123');
    const { sellerId } = verifySellerToken(t);
    expect(sellerId).toBe('seller-abc-123');
  });

  it('từ chối token bị sửa đổi (tampered)', () => {
    const t = issueSellerToken('seller-abc-123');
    const tampered = t.slice(0, -2) + (t.endsWith('AA') ? 'BB' : 'AA');
    expect(() => verifySellerToken(tampered)).toThrow(SellerAuthError);
  });

  it('từ chối token ký bằng khoá khác', () => {
    const t = issueSellerToken('seller-abc-123');
    process.env.SELLER_TOKEN_SECRET = 'different-secret';
    expect(() => verifySellerToken(t)).toThrow(SellerAuthError);
  });

  it('từ chối token đã hết hạn', () => {
    const t = issueSellerToken('seller-abc-123', -10); // exp đã qua
    expect(() => verifySellerToken(t)).toThrow(SellerAuthError);
  });

  it('từ chối token sai định dạng', () => {
    expect(() => verifySellerToken('not-a-token')).toThrow(SellerAuthError);
    expect(() => verifySellerToken('')).toThrow(SellerAuthError);
  });

  it('parseBearerToken xử lý các định dạng', () => {
    expect(parseBearerToken('Bearer xyz')).toBe('xyz');
    expect(parseBearerToken('xyz')).toBeNull();
    expect(parseBearerToken(undefined)).toBeNull();
    expect(parseBearerToken('Bearer ')).toBeNull();
  });

  it('issueSellerToken từ chối sellerId rỗng', () => {
    expect(() => issueSellerToken('')).toThrow(SellerAuthError);
  });
});
