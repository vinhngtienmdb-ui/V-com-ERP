import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_AUDIT_TENANT,
  AUDIT_SINK_TABLE,
  detectBrowser,
  readableAction,
  canonicalAction,
  sinkOf,
  normalizeAudit,
  recordAudit,
  logLoginAudit,
  logActivity,
  setAuditDeps,
  type AuditDeps,
  type AuditRecord,
  type AuditSink,
} from './auditTrailService';

/** Deps giả lập: ghi nhận mọi lần ghi để assert, không đụng mạng. */
function makeDeps(overrides: Partial<AuditDeps> = {}) {
  const writes: Array<{ sink: AuditSink; record: AuditRecord }> = [];
  const mirrors: AuditRecord[] = [];
  const logs: string[] = [];
  const deps: AuditDeps = {
    write: async (sink, record) => {
      writes.push({ sink, record });
      return { id: `w${writes.length}` };
    },
    writeMirror: async (record) => {
      mirrors.push(record);
      return { id: 'm1' };
    },
    log: (msg) => logs.push(msg),
    // Đồng hồ CỐ ĐỊNH → test xác định, không phụ thuộc thời gian chạy.
    now: () => new Date('2026-09-03T10:00:00.000Z'),
    tenantId: 'tenant-test-01',
    ...overrides,
  };
  return { deps, writes, mirrors, logs };
}

const FIXED_DATE = new Date('2026-09-03T10:00:00.000Z');

describe('auditTrailService — GĐ 2.6 chuẩn hóa audit trail', () => {
  afterEach(() => {
    setAuditDeps(null);
  });

  // ---------------------------------------------------------------------------
  // detectBrowser
  // ---------------------------------------------------------------------------
  describe('detectBrowser', () => {
    it('nhận diện Edge TRƯỚC Chrome (Chromium Edge chứa cả "Chrome/" lẫn "Edg/")', () => {
      // ĐÂY LÀ LỖI CÓ THẬT ở bản cũ (AuthContext xếp Chrome trước Edge).
      const edgeChromium =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91';
      expect(detectBrowser(edgeChromium)).toBe('Edge');
    });

    it('nhận diện Edge legacy (Edge/)', () => {
      expect(detectBrowser('Mozilla/5.0 ... Edge/18.18362')).toBe('Edge');
    });

    it('nhận diện Safari CHỈ KHI không phải Chrome (Chrome UA cũng chứa "Safari")', () => {
      const chrome = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36';
      const safari = 'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
      expect(detectBrowser(chrome)).toBe('Chrome');
      expect(detectBrowser(safari)).toBe('Safari');
    });

    it('nhận diện Firefox / Opera', () => {
      expect(detectBrowser('Mozilla/5.0 (X11; Linux) Gecko/20100101 Firefox/121.0')).toBe('Firefox');
      expect(detectBrowser('Mozilla/5.0 ... OPR/105.0.0.0')).toBe('Opera');
    });

    it('UA rỗng hoặc null → Unknown Browser (không ném)', () => {
      expect(detectBrowser('')).toBe('Unknown Browser');
      expect(detectBrowser(null)).toBe('Unknown Browser');
      expect(detectBrowser(undefined)).toBe('Unknown Browser');
    });
  });

  // ---------------------------------------------------------------------------
  // action để hiển thị vs actionKey để query
  // ---------------------------------------------------------------------------
  describe('action: giữ hiển thị, tách khóa query', () => {
    it('readableAction GIỮ NGUYÊN chữ hoa — Settings.tsx so khớp "Failed"/"Logout"', () => {
      expect(readableAction('Login Failed')).toBe('Login Failed');
      expect(readableAction('Logout')).toBe('Logout');
    });

    it('readableAction gọn khoảng trắng thừa, không đổi chữ', () => {
      expect(readableAction('  Circulate   Document  ')).toBe('Circulate Document');
    });

    it('canonicalAction hạ chữ thường + thay ký tự lạ bằng _', () => {
      expect(canonicalAction('Login Failed')).toBe('login_failed');
      // Ngoặc vuông + tiếng Việt bị giản lược; dấu `-` được GIỮ (để mã dạng
      // `order.status-changed` không bị tách thành 2 nhóm).
      expect(canonicalAction('Circulate Document [REQ-9] to Kế toán')).toBe(
        'circulate_document_req-9_to_k_to_n'
      );
    });

    it('readableAction rỗng → "unknown"; canonicalAction không để _ ở đầu/cuối', () => {
      expect(readableAction('')).toBe('unknown');
      expect(canonicalAction('!!  !!')).toBe('');
      expect(canonicalAction('  Order Created  ')).toBe('order_created');
    });

    it('cắt action quá dài (tránh phình hàng / vỡ index)', () => {
      const long = 'x'.repeat(500);
      expect((readableAction(long) as string).length).toBe(200);
    });
  });

  // ---------------------------------------------------------------------------
  // sink
  // ---------------------------------------------------------------------------
  describe('sinkOf', () => {
    it('chỉ định tường minh → dùng luôn', () => {
      expect(sinkOf({ sink: 'activity', source: 'auth' })).toBe('activity');
      expect(sinkOf({ sink: 'security', source: 'app' })).toBe('security');
    });

    it('không chỉ định → auth/workflow là security, còn lại activity', () => {
      expect(sinkOf({ source: 'auth' })).toBe('security');
      expect(sinkOf({ source: 'workflow' })).toBe('security');
      expect(sinkOf({ source: 'app' })).toBe('activity');
      expect(sinkOf({})).toBe('activity');
    });

    it('security → tenant_audit_logs (bảng Settings.tsx đang đọc)', () => {
      expect(AUDIT_SINK_TABLE.security).toBe('tenant_audit_logs');
      expect(AUDIT_SINK_TABLE.activity).toBe('audit_logs');
    });
  });

  // ---------------------------------------------------------------------------
  // normalizeAudit (pure)
  // ---------------------------------------------------------------------------
  describe('normalizeAudit', () => {
    it('điền đủ định dạng chuẩn, mặc định tenant + thời gian từ ctx.now', () => {
      const r = normalizeAudit({ action: 'Login' }, { now: () => FIXED_DATE });
      expect(r.action).toBe('Login');
      expect(r.actionKey).toBe('login');
      expect(r.status).toBe('Success');
      expect(r.tenantId).toBe(DEFAULT_AUDIT_TENANT);
      expect(r.timestamp).toBe('2026-09-03T10:00:00.000Z');
      expect(r.browser).toBe('Unknown Browser');
      expect(r.details).toBe(null);
    });

    it('status chỉ nhận Success/Failed — giá trị lạ rớt về Success', () => {
      expect(normalizeAudit({ action: 'x', status: 'Failed' }).status).toBe('Failed');
      // @ts-expect-error cố tình truyền sai kiểu để kiểm tra chặn runtime
      expect(normalizeAudit({ action: 'x', status: 'WARNING' }).status).toBe('Success');
    });

    it('details KHÔNG phải object → null (đảm bảo query JSONB được)', () => {
      // @ts-expect-error cố tình truyền chuỗi để kiểm tra chặn runtime
      expect(normalizeAudit({ action: 'x', details: 'oops' }).details).toBe(null);
      expect(normalizeAudit({ action: 'x', details: { a: 1 } }).details).toEqual({ a: 1 });
    });

    it('giữ ISO gốc nếu `at` là chuỗi hợp lệ; parse được cả Date', () => {
      expect(normalizeAudit({ action: 'x', at: '2026-01-02T03:04:05.000Z' }).timestamp).toBe(
        '2026-01-02T03:04:05.000Z'
      );
      expect(normalizeAudit({ action: 'x', at: FIXED_DATE }).timestamp).toBe(
        '2026-09-03T10:00:00.000Z'
      );
    });

    it('`at` chuỗi rác → rớt về now() thay vì sinh "Invalid Date"', () => {
      expect(normalizeAudit({ action: 'x', at: 'không phải ngày' }, { now: () => FIXED_DATE }).timestamp).toBe(
        '2026-09-03T10:00:00.000Z'
      );
    });

    it('tự suy browser từ userAgent', () => {
      const r = normalizeAudit({ action: 'x', userAgent: 'Mozilla/5.0 ... Firefox/121.0' });
      expect(r.browser).toBe('Firefox');
      expect(r.userAgent).toBe('Mozilla/5.0 ... Firefox/121.0');
    });

    it('cắt userAgent dài (tránh phình hàng)', () => {
      const r = normalizeAudit({ action: 'x', userAgent: 'u'.repeat(2000) });
      expect((r.userAgent as string).length).toBe(500);
    });

    it('chuỗi rỗng → null, không giữ "" (đỡ rác khi lọc)', () => {
      const r = normalizeAudit({ action: 'x', actor: { email: '   ' }, ipAddress: '' });
      expect(r.actorEmail).toBe(null);
      expect(r.ipAddress).toBe(null);
    });
  });

  // ---------------------------------------------------------------------------
  // recordAudit
  // ---------------------------------------------------------------------------
  describe('recordAudit', () => {
    it('ghi vào đúng sink theo source', async () => {
      const { deps, writes } = makeDeps();
      await recordAudit({ action: 'Login', source: 'auth' }, deps);
      expect(writes).toHaveLength(1);
      expect(writes[0].sink).toBe('security');
      expect(AUDIT_SINK_TABLE[writes[0].sink]).toBe('tenant_audit_logs');
    });

    it('GHI MỘT LẦN — không còn nhân đôi admin_audit_logs + tenant_audit_logs', async () => {
      // Đây chính là mục tiêu GĐ 2.6: hai bảng cũ có schema & RLS y hệt nhau,
      // ghi 2 lần không tạo thêm cách ly nào. Mirror mặc định TẮT.
      const { deps, writes, mirrors } = makeDeps();
      await recordAudit({ action: 'Login', source: 'auth' }, deps);
      expect(writes).toHaveLength(1);
      expect(mirrors).toHaveLength(0);
    });

    it('trả ok + id + record chuẩn', async () => {
      const { deps } = makeDeps();
      const r = await recordAudit({ action: 'Login', source: 'auth' }, deps);
      expect(r.ok).toBe(true);
      expect(r.id).toBe('w1');
      expect(r.sink).toBe('tenant_audit_logs');
      expect(r.record.action).toBe('Login');
    });

    it('FAIL-SOFT: write ném lỗi → KHÔNG ném tiếp, trả ok:false', async () => {
      const { deps, logs } = makeDeps({
        write: async () => {
          throw new Error('RLS chặn');
        },
      });
      const r = await recordAudit({ action: 'Login', source: 'auth' }, deps);
      expect(r.ok).toBe(false);
      expect(logs.some((m) => m.includes('thất bại'))).toBe(true);
    });

    it('bật mirror → ghi thêm 1 bản vào admin_audit_logs', async () => {
      const { deps, writes, mirrors } = makeDeps({ mirror: true });
      await recordAudit({ action: 'Login', source: 'auth' }, deps);
      expect(writes).toHaveLength(1);
      expect(mirrors).toHaveLength(1);
      expect(mirrors[0].action).toBe('Login');
    });

    it('mirror NÉM lỗi → nuốt, kết quả chính VẪN ok (log không được chết theo)', async () => {
      const { deps, writes, logs } = makeDeps({
        mirror: true,
        writeMirror: async () => {
          throw new Error('admin_audit_logs die');
        },
      });
      const r = await recordAudit({ action: 'Login', source: 'auth' }, deps);
      expect(r.ok).toBe(true);
      expect(writes).toHaveLength(1);
      expect(logs.some((m) => m.includes('mirror'))).toBe(true);
    });

    it('nhận deps.tenantId làm mặc định khi input không có tenantId', async () => {
      const { deps, writes } = makeDeps({ tenantId: 'tenant-test-01' });
      await recordAudit({ action: 'x', source: 'workflow' }, deps);
      expect(writes[0].record.tenantId).toBe('tenant-test-01');
    });

    it('input.tenantId thắng deps.tenantId', async () => {
      const { deps, writes } = makeDeps({ tenantId: 'tenant-test-01' });
      await recordAudit({ action: 'x', source: 'workflow', tenantId: 'tenant-khac' }, deps);
      expect(writes[0].record.tenantId).toBe('tenant-khac');
    });
  });

  // ---------------------------------------------------------------------------
  // logLoginAudit
  // ---------------------------------------------------------------------------
  describe('logLoginAudit', () => {
    it('ghi sink security, source auth, kèm IP do caller inject', async () => {
      const { deps, writes } = makeDeps();
      await logLoginAudit(
        {
          email: 'admin@vcom.vn',
          action: 'Login Failed',
          status: 'Failed',
          userId: 'u-1',
          fetchIp: async () => '1.2.3.4',
        },
        deps
      );
      expect(writes).toHaveLength(1);
      const r = writes[0].record;
      expect(writes[0].sink).toBe('security');
      expect(r.source).toBe('auth');
      expect(r.actorEmail).toBe('admin@vcom.vn');
      expect(r.actorUid).toBe('u-1');
      expect(r.ipAddress).toBe('1.2.3.4');
      expect(r.status).toBe('Failed');
      // ⚠️ action GIỮ nguyên để Settings.tsx còn so khớp includes('Failed')
      expect(r.action).toBe('Login Failed');
      expect(r.actionKey).toBe('login_failed');
    });

    it('fetchIp ném lỗi → rớt về 127.0.0.1, vẫn ghi được (không mất log)', async () => {
      const { deps, writes } = makeDeps();
      await logLoginAudit(
        { email: 'a@b.c', action: 'Login', status: 'Success', fetchIp: async () => { throw new Error('offline'); } },
        deps
      );
      expect(writes[0].record.ipAddress).toBe('127.0.0.1');
    });
  });

  // ---------------------------------------------------------------------------
  // logActivity
  // ---------------------------------------------------------------------------
  describe('logActivity', () => {
    it('ghi sink activity (feed nghiệp vụ, tách khỏi nhật ký an ninh)', async () => {
      const { deps, writes } = makeDeps();
      await logActivity(
        {
          action: 'order.status_changed',
          actor: { uid: 'u-9', email: 'nv@vcom.vn', name: 'Nguyễn Văn A' },
          targetId: 'ORD-1',
          targetLabel: 'ORD-1',
          details: { from: 'pending', to: 'shipping' },
          path: '/orders',
        },
        deps
      );
      expect(writes[0].sink).toBe('activity');
      const r = writes[0].record;
      expect(r.targetId).toBe('ORD-1');
      expect(r.details).toEqual({ from: 'pending', to: 'shipping' });
      expect(r.path).toBe('/orders');
      expect(r.actorName).toBe('Nguyễn Văn A');
    });

    it('actor rỗng (phiên chưa đăng nhập) VẪN ghi — không nuốt log như bản cũ', async () => {
      const { deps, writes } = makeDeps();
      await logActivity({ action: 'product.updated', actor: { uid: null, email: null, name: null } }, deps);
      expect(writes).toHaveLength(1);
      expect(writes[0].record.actorUid).toBe(null);
    });
  });

  // ---------------------------------------------------------------------------
  // setAuditDeps
  // ---------------------------------------------------------------------------
  describe('setAuditDeps', () => {
    it('deps mặc định bị thay thế hoàn toàn (dùng cho test/SSR)', async () => {
      const { deps, writes } = makeDeps();
      setAuditDeps(deps);
      await recordAudit({ action: 'x', source: 'auth' });
      expect(writes).toHaveLength(1);
      setAuditDeps(null);
    });
  });
});
