import { describe, it, expect, vi } from 'vitest';
import {
  verifySePayWebhook,
  safeSecretEquals,
  SEPAY_NOT_CONFIGURED,
  SEPAY_UNAUTHORIZED,
} from './sepayWebhookAuth';

const SECRET = 'sk_live_abcdef123456';

function logSpy() {
  const calls: Array<{ level: string; message: string }> = [];
  return { calls, log: (level: 'warn' | 'error', message: string) => calls.push({ level, message }) };
}

describe('sepayWebhookAuth — GĐ 2.4 (chốt chặn tiền)', () => {
  // -------------------------------------------------------------------------
  describe('LỖI 1: thiếu secret thì PHẢI từ chối (fail-closed)', () => {
    it('secret rỗng → 503, KHÔNG cho qua dù request không có header gì', () => {
      const r = verifySePayWebhook({}, '');
      expect(r.ok).toBe(false);
      expect(r.status).toBe(SEPAY_NOT_CONFIGURED);
      expect(r.code).toBe('not_configured');
    });

    it('secret chỉ toàn khoảng trắng → vẫn từ chối (trim)', () => {
      expect(verifySePayWebhook({}, '   ').ok).toBe(false);
    });

    it('secret null/undefined → từ chối', () => {
      expect(verifySePayWebhook({}, null).ok).toBe(false);
      expect(verifySePayWebhook({}, undefined).ok).toBe(false);
    });

    it('thiếu secret PHẢI ghi log mức error (để không thành lỗi ngầm)', () => {
      const { calls, log } = logSpy();
      verifySePayWebhook({}, '', { log });
      expect(calls.some((c) => c.level === 'error')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('LỖI 2: cửa hậu "Apikey mock_secret" không được còn tác dụng', () => {
    it('mock_secret BỊ TỪ CHỐI khi đã cấu hình secret thật', () => {
      // ĐÂY LÀ LỖI BỊ PHÁT HIỆN: bản cũ chấp nhận chuỗi này vô điều kiện.
      const r = verifySePayWebhook({ authorization: 'Apikey mock_secret' }, SECRET);
      expect(r.ok).toBe(false);
      expect(r.status).toBe(SEPAY_UNAUTHORIZED);
    });

    it('mock_secret cũng bị từ chối ở header signature', () => {
      expect(verifySePayWebhook({ signature: 'Apikey mock_secret' }, SECRET).ok).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('chữ ký đúng phải được chấp nhận', () => {
    it('Authorization: Apikey <secret>', () => {
      expect(verifySePayWebhook({ authorization: `Apikey ${SECRET}` }, SECRET).ok).toBe(true);
    });

    it('Authorization: <secret> (không có tiền tố)', () => {
      expect(verifySePayWebhook({ authorization: SECRET }, SECRET).ok).toBe(true);
    });

    it('x-sepay-signature: <secret>', () => {
      expect(verifySePayWebhook({ signature: SECRET }, SECRET).ok).toBe(true);
    });

    it('secret có khoảng trắng thừa ở cấu hình vẫn khớp (trim)', () => {
      expect(verifySePayWebhook({ signature: SECRET }, `  ${SECRET}  `).ok).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('chữ ký sai phải bị từ chối', () => {
    it('sai hoàn toàn → 401', () => {
      const r = verifySePayWebhook({ signature: 'sai-bét' }, SECRET);
      expect(r.ok).toBe(false);
      expect(r.status).toBe(SEPAY_UNAUTHORIZED);
    });

    it('thiếu 1 ký tự ở cuối → 401', () => {
      expect(verifySePayWebhook({ signature: SECRET.slice(0, -1) }, SECRET).ok).toBe(false);
    });

    it('thừa 1 ký tự → 401', () => {
      expect(verifySePayWebhook({ signature: `${SECRET}x` }, SECRET).ok).toBe(false);
    });

    it('không gửi header nào → 401', () => {
      expect(verifySePayWebhook({}, SECRET).ok).toBe(false);
    });

    it('header không phải chuỗi (mảng/object) → 401, KHÔNG ném', () => {
      expect(verifySePayWebhook({ authorization: ['a', 'b'] }, SECRET).ok).toBe(false);
      expect(verifySePayWebhook({ authorization: { evil: 1 } }, SECRET).ok).toBe(false);
      expect(verifySePayWebhook({ signature: 12345 }, SECRET).ok).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('chế độ dev (allowInsecure)', () => {
    it('cho qua NHƯNG đánh dấu insecure và cảnh báo', () => {
      const { calls, log } = logSpy();
      const r = verifySePayWebhook({}, '', { allowInsecure: true, log });
      expect(r.ok).toBe(true);
      expect(r.insecure).toBe(true);
      expect(r.code).toBe('insecure');
      expect(calls.some((c) => c.level === 'warn' && c.message.includes('production'))).toBe(true);
    });

    it('allowInsecure thắng cả khi secret SAI — đúng mục đích dev', () => {
      expect(verifySePayWebhook({ signature: 'sai' }, SECRET, { allowInsecure: true }).ok).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('safeSecretEquals', () => {
    it('không ném khi độ dài khác nhau (timingSafeEqual sẽ ném nếu không so trước)', () => {
      expect(() => safeSecretEquals('ngắn', 'dài-hơn-nhiều')).not.toThrow();
      expect(safeSecretEquals('ngắn', 'dài-hơn-nhiều')).toBe(false);
    });

    it('không ném khi truyền null/undefined/number', () => {
      expect(() => safeSecretEquals(null, 'x')).not.toThrow();
      expect(safeSecretEquals(null, 'x')).toBe(false);
      expect(safeSecretEquals(undefined, 'x')).toBe(false);
      expect(safeSecretEquals(42, 'x')).toBe(false);
    });

    it('chuỗi rỗng → false (tránh timingSafeEqual ném khi length 0)', () => {
      expect(safeSecretEquals('', '')).toBe(false);
      expect(safeSecretEquals('a', '')).toBe(false);
    });

    it('giống hệt → true', () => {
      expect(safeSecretEquals('abc', 'abc')).toBe(true);
    });
  });
});
