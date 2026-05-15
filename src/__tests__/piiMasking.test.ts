import { describe, it, expect } from 'vitest';
import { maskPhone, maskEmail, maskIdentityCard } from '../services/repositories/pii';

describe('PII masking — maskPhone', () => {
  it('Mask 10-số đúng — giữ 4 cuối', () => {
    expect(maskPhone('0901234567')).toBe('******4567');
  });
  it('Mask 11-số', () => {
    expect(maskPhone('09812345678')).toBe('*******5678');
  });
  it('Phone ngắn ≤ 4 ký tự — giữ nguyên', () => {
    expect(maskPhone('1234')).toBe('1234');
    expect(maskPhone('12')).toBe('12');
  });
  it('Empty → empty', () => {
    expect(maskPhone('')).toBe('');
    expect(maskPhone(undefined)).toBe('');
  });
});

describe('PII masking — maskEmail', () => {
  it('Email thông thường', () => {
    // local "vinh" → giữ "v" + mask 3 ký tự còn lại
    expect(maskEmail('vinh@vcomm.vn')).toBe('v***@vcomm.vn');
  });
  it('Email 1 char local', () => {
    expect(maskEmail('a@example.com')).toBe('*@example.com');
  });
  it('Email local dài — chỉ mask 5 ký tự', () => {
    expect(maskEmail('verylongemailprefix@x.com')).toBe('v*****@x.com');
  });
  it('Empty → empty', () => {
    expect(maskEmail('')).toBe('');
    expect(maskEmail(undefined)).toBe('');
  });
  it('Không phải email (thiếu @) → giữ nguyên', () => {
    expect(maskEmail('notanemail')).toBe('notanemail');
  });
});

describe('PII masking — maskIdentityCard', () => {
  it('CCCD 12 số', () => {
    expect(maskIdentityCard('012345678901')).toBe('012******901');
  });
  it('CMND 9 số', () => {
    expect(maskIdentityCard('123456789')).toBe('123***789');
  });
  it('Quá ngắn (≤ 4) — giữ nguyên', () => {
    expect(maskIdentityCard('1234')).toBe('1234');
  });
  it('Empty', () => {
    expect(maskIdentityCard('')).toBe('');
    expect(maskIdentityCard(undefined)).toBe('');
  });
});
