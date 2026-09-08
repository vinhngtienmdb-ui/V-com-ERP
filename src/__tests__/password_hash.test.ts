import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, isPlaintextPassword } from '../lib/passwordHash';

describe('passwordHash — hashPassword (bcrypt)', () => {
  it('băm ra chuỗi có tiền tố $2 (không lưu plaintext)', async () => {
    const h = await hashPassword('sup3rSecret');
    expect(h.startsWith('$2')).toBe(true);
    expect(h).not.toBe('sup3rSecret');
  });

  it('mỗi lần băm ra giá trị KHÁC (salt ngẫu nhiên)', async () => {
    const a = await hashPassword('sup3rSecret');
    const b = await hashPassword('sup3rSecret');
    expect(a).not.toBe(b);
  });

  it('ném khi đầu vào rỗng', async () => {
    await expect(hashPassword('')).rejects.toThrow();
    await expect(hashPassword(undefined as unknown as string)).rejects.toThrow();
  });
});

describe('passwordHash — verifyPassword (tương thích ngược)', () => {
  it('bcrypt hash đúng → ok, không cần upgrade', async () => {
    const h = await hashPassword('sup3rSecret');
    expect(await verifyPassword('sup3rSecret', h)).toEqual({ ok: true, needsUpgrade: false });
  });

  it('bcrypt hash sai → không ok', async () => {
    const h = await hashPassword('sup3rSecret');
    expect(await verifyPassword('wrong-password', h)).toEqual({ ok: false, needsUpgrade: false });
  });

  it('plaintext cũ khớp → ok VÀ needsUpgrade (để login nâng cấp)', async () => {
    // Trước GĐ 2.4 mật khẩu lưu nguyên bản → verify vẫn đúng, báo cần nâng cấp.
    expect(await verifyPassword('plain123', 'plain123')).toEqual({ ok: true, needsUpgrade: true });
  });

  it('plaintext cũ sai → không ok', async () => {
    expect(await verifyPassword('plain123', 'other')).toEqual({ ok: false, needsUpgrade: false });
  });

  it('đầu vào rỗng / stored rỗng → fail-closed (ok:false)', async () => {
    const h = await hashPassword('x');
    expect(await verifyPassword('', h)).toEqual({ ok: false, needsUpgrade: false });
    expect(await verifyPassword('x', '')).toEqual({ ok: false, needsUpgrade: false });
    expect(await verifyPassword('x', undefined)).toEqual({ ok: false, needsUpgrade: false });
    expect(await verifyPassword('x', null)).toEqual({ ok: false, needsUpgrade: false });
  });

  it('login user cũ (plaintext) vẫn vào được, lần sau đã là bcrypt', async () => {
    // Mô phỏng: user cũ lưu plaintext 'legacy', login verify thành công + upgrade.
    const legacy = await verifyPassword('legacy', 'legacy');
    expect(legacy).toEqual({ ok: true, needsUpgrade: true });
    // Sau khi upgrade (hashPassword), verify lần sau dùng bcrypt, không cần upgrade nữa.
    const upgraded = await hashPassword('legacy');
    expect(await verifyPassword('legacy', upgraded)).toEqual({ ok: true, needsUpgrade: false });
  });
});

describe('passwordHash — isPlaintextPassword (cho backfill quét DB)', () => {
  it('plaintext → true (cần nâng cấp)', () => {
    expect(isPlaintextPassword('plain123')).toBe(true);
    expect(isPlaintextPassword('a')).toBe(true);
  });

  it('bcrypt hash → false (đã an toàn, bỏ qua)', async () => {
    const h = await hashPassword('anything');
    expect(isPlaintextPassword(h)).toBe(false);
  });

  it('rỗng / undefined / null → false (không nâng cấp nhầm', () => {
    expect(isPlaintextPassword('')).toBe(false);
    expect(isPlaintextPassword(undefined)).toBe(false);
    expect(isPlaintextPassword(null)).toBe(false);
    expect(isPlaintextPassword(123 as unknown as string)).toBe(false);
  });
});
