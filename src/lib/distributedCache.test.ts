import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DistributedCache,
  isMigrationMissing,
  l1TtlOf,
  L1_MAX_TTL_MS,
  DEFAULT_TTL_MS,
  type DistributedCacheDeps,
  type RpcResult,
} from './distributedCache';

/**
 * Giả lập Postgres: lưu thật vào Map để test chứng minh được
 * "instance A ghi → instance B đọc thấy" (chính là lý do tồn tại của L2).
 */
function makeFakeDb() {
  const rows = new Map<string, { value: unknown; expiresAt: number }>();
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  let failWith: unknown = null;
  /** Giả lập phát sóng Realtime: được gán từ ngoài để nối vào kênh broadcast. */
  let notify: ((change: { key: string; eventType: string }) => void) | null = null;

  const rpc = async (fn: string, args: Record<string, unknown>): Promise<RpcResult> => {
    calls.push({ fn, args });
    if (failWith) return { data: null, error: failWith };

    const now = Date.now();
    const tenant = (args.p_tenant_id as string) || 'tenant-vcomm-prod-01';
    const full = `t:${tenant}:${args.p_key as string}`;

    if (fn === 'vcomm_cache_get') {
      const row = rows.get(full);
      if (!row || row.expiresAt <= now) {
        rows.delete(full);
        return { data: null, error: null };
      }
      return { data: row.value, error: null };
    }

    if (fn === 'vcomm_cache_set') {
      rows.set(full, {
        value: args.p_value,
        expiresAt: now + (args.p_ttl_seconds as number) * 1000,
      });
      // upsert = UPDATE với Realtime → instance khác phải bỏ cache cũ ngay.
      notify?.({ key: full, eventType: 'UPDATE' });
      return { data: true, error: null };
    }

    if (fn === 'vcomm_cache_del') {
      const ok = rows.delete(full);
      if (ok) notify?.({ key: full, eventType: 'DELETE' });
      return { data: ok, error: null };
    }

    if (fn === 'vcomm_cache_del_prefix') {
      const prefix = `t:${tenant}:${args.p_prefix as string}`;
      let n = 0;
      for (const k of [...rows.keys()]) {
        if (k.startsWith(prefix)) {
          rows.delete(k);
          n += 1;
        }
      }
      for (const k of [...rows.keys()]) {
        if (k.startsWith(prefix)) notify?.({ key: k, eventType: 'DELETE' });
      }
      return { data: n, error: null };
    }

    if (fn === 'vcomm_cache_prune') {
      let n = 0;
      for (const [k, v] of [...rows]) {
        if (v.expiresAt <= now) {
          rows.delete(k);
          n += 1;
        }
      }
      return { data: n, error: null };
    }

    return { data: null, error: null };
  };

  return {
    rows,
    calls,
    rpc,
    setFailure: (e: unknown) => { failWith = e; },
    setNotifier: (n: ((change: { key: string; eventType: string }) => void) | null) => { notify = n; },
  };
}

function makeDeps(db: ReturnType<typeof makeFakeDb>) {
  const logs: string[] = [];
  const deps: DistributedCacheDeps = {
    rpc: db.rpc,
    log: (m) => logs.push(m),
    tenantId: 'tenant-A',
    // Giả lập kênh Realtime: giữ lại callback để test tự "phát sóng" sự kiện.
    subscribe: (onRemoteChange) => {
      broadcast = onRemoteChange;
      return () => {
        broadcast = null;
      };
    },
  };
  return { deps, logs };
}

/** Callback Realtime do `subscribe` đăng ký — test dùng để phát sự kiện thủ công. */
let broadcast: ((change: { key: string; eventType: string }) => void) | null = null;

describe('distributedCache — GĐ 2.3', () => {
  let db: ReturnType<typeof makeFakeDb>;
  let deps: DistributedCacheDeps;
  let logs: string[];

  beforeEach(() => {
    db = makeFakeDb();
    const made = makeDeps(db);
    deps = made.deps;
    logs = made.logs;
    // Nối "phát sóng Realtime" của DB giả vào kênh mà các cache đăng ký.
    db.setNotifier((change) => broadcast?.(change));
  });

  // ---------------------------------------------------------------------------
  describe('isMigrationMissing', () => {
    it('nhận đúng các mã "chưa chạy migration"', () => {
      expect(isMigrationMissing({ code: 'PGRST202' })).toBe(true); // function not found
      expect(isMigrationMissing({ code: '42883' })).toBe(true);
      expect(isMigrationMissing({ code: '42P01' })).toBe(true); // undefined_table
      expect(isMigrationMissing({ code: 'PGRST205' })).toBe(true);
    });

    it('KHÔNG nuốt lỗi phân quyền/JWT — phải để nó ồn ào', () => {
      expect(isMigrationMissing({ code: '42501' })).toBe(false); // permission denied
      expect(isMigrationMissing({ code: 'PGRST301' })).toBe(false); // JWT expired
    });

    it('nhận qua message khi PostgREST không trả code', () => {
      expect(isMigrationMissing({ message: 'Could not find the function public.vcomm_cache_get' })).toBe(true);
      expect(isMigrationMissing({ message: 'something else' })).toBe(false);
      expect(isMigrationMissing(null)).toBe(false);
    });
  });

  describe('l1TtlOf', () => {
    it('không vượt quá trần 30s — giới hạn cửa sổ lệch giữa các instance', () => {
      expect(l1TtlOf(5 * 60 * 1000)).toBe(L1_MAX_TTL_MS);
      expect(l1TtlOf(1000)).toBe(1000);
      expect(l1TtlOf(0)).toBe(DEFAULT_TTL_MS > L1_MAX_TTL_MS ? L1_MAX_TTL_MS : DEFAULT_TTL_MS);
    });

    it('TTL rác (NaN/âm) → rớt về mặc định, không sinh số âm', () => {
      expect(l1TtlOf(Number.NaN)).toBe(L1_MAX_TTL_MS);
      expect(l1TtlOf(-5)).toBe(L1_MAX_TTL_MS);
    });
  });

  // ---------------------------------------------------------------------------
  describe('getOrSet', () => {
    it('miss → gọi producer, ghi CẢ L1 lẫn L2, trả giá trị', async () => {
      const cache = new DistributedCache(deps);
      const producer = vi.fn(async () => ({ vat: 0.08 }));

      const out = await cache.getOrSet('tax_rules:all', producer);

      expect(out).toEqual({ vat: 0.08 });
      expect(producer).toHaveBeenCalledTimes(1);
      expect(db.rows.size).toBe(1);
    });

    it('hit L1 → KHÔNG query L2, KHÔNG gọi producer lại', async () => {
      const cache = new DistributedCache(deps);
      const producer = vi.fn(async () => 'value');
      await cache.getOrSet('k', producer);
      const callsAfterFirst = db.calls.length;

      const out = await cache.getOrSet('k', producer);

      expect(out).toBe('value');
      expect(producer).toHaveBeenCalledTimes(1);
      expect(db.calls.length).toBe(callsAfterFirst); // không thêm RPC nào
    });

    it('⭐ GIÁ TRỊ CỐT LÕI: instance B đọc được giá trị instance A đã ghi', async () => {
      // Đây là điều cache in-memory cũ KHÔNG làm được.
      const cacheA = new DistributedCache(deps);
      await cacheA.getOrSet('tax_rules:all', async () => ({ vat: 0.1 }));

      const cacheB = new DistributedCache(deps); // instance khác, L1 trống
      const producerB = vi.fn(async () => ({ vat: 0.08 })); // sẽ trả KHÁC nếu gọi

      const out = await cacheB.getOrSet('tax_rules:all', producerB);

      expect(out).toEqual({ vat: 0.1 }); // lấy từ L2, KHÔNG phải 0.08
      expect(producerB).not.toHaveBeenCalled();
    });

    it('single-flight: 10 request đồng thời cùng key → producer chạy ĐÚNG 1 lần', async () => {
      const cache = new DistributedCache(deps);
      let n = 0;
      const producer = async () => {
        n += 1;
        await new Promise((r) => setTimeout(r, 5));
        return n;
      };
      const results = await Promise.all(
        Array.from({ length: 10 }, () => cache.getOrSet('race', producer))
      );
      expect(n).toBe(1);
      expect(new Set(results).size).toBe(1);
    });

    it('producer ném lỗi → NÉM TIẾP (lỗi nghiệp vụ không được nuốt như lỗi cache)', async () => {
      const cache = new DistributedCache(deps);
      await expect(
        cache.getOrSet('boom', async () => {
          throw new Error('DB die');
        })
      ).rejects.toThrow('DB die');
    });

    it('producer ném → lần gọi sau vẫn thử lại (không kẹt promise hỏng)', async () => {
      const cache = new DistributedCache(deps);
      let attempt = 0;
      const producer = async () => {
        attempt += 1;
        if (attempt === 1) throw new Error('lần 1 hỏng');
        return 'ok';
      };
      await expect(cache.getOrSet('retry', producer)).rejects.toThrow('lần 1 hỏng');
      await expect(cache.getOrSet('retry', producer)).resolves.toBe('ok');
    });
  });

  // ---------------------------------------------------------------------------
  describe('fail-soft', () => {
    it('chưa chạy migration 004 → chỉ dùng L1, KHÔNG ném, và ngừng gọi L2', async () => {
      const cache = new DistributedCache(deps);
      db.setFailure({ code: 'PGRST202', message: 'Could not find the function public.vcomm_cache_get' });

      const producer = vi.fn(async () => 'x');
      await expect(cache.getOrSet('k', producer)).resolves.toBe('x');
      expect(cache.isL2Available()).toBe(false);

      // Lần 2: vẫn chạy được nhờ L1, và KHÔNG sinh thêm RPC (đã tắt L2).
      const before = db.calls.length;
      await expect(cache.getOrSet('k', producer)).resolves.toBe('x');
      expect(db.calls.length).toBe(before);
      expect(producer).toHaveBeenCalledTimes(1);
    });

    it('lỗi PHÂN QUYỀN (42501) → KHÔNG tắt hẳn L2, vẫn tiếp tục thử', async () => {
      const cache = new DistributedCache(deps);
      db.setFailure({ code: '42501', message: 'permission denied for table cache_entries' });

      await cache.getOrSet('k', async () => 'x');
      expect(cache.isL2Available()).toBe(true); // không bị coi là "thiếu migration"
      expect(logs.some((m) => m.includes('Lỗi đọc L2'))).toBe(true);
    });

    it('ghi L2 lỗi → giá trị vẫn nằm ở L1, kết quả vẫn đúng', async () => {
      const cache = new DistributedCache(deps);
      const origRpc = deps.rpc;
      deps.rpc = async (fn, args) => {
        if (fn === 'vcomm_cache_set') return { data: null, error: { code: 'XX', message: 'write fail' } };
        return origRpc(fn, args);
      };

      const out = await cache.getOrSet('k', async () => 'value');
      expect(out).toBe('value');
      expect(db.rows.size).toBe(0); // L2 không có
      expect(logs.some((m) => m.includes('Lỗi ghi L2'))).toBe(true);
      // L1 vẫn phục vụ được
      await expect(cache.getOrSet('k', async () => 'khác')).resolves.toBe('value');
    });
  });

  // ---------------------------------------------------------------------------
  describe('invalidate', () => {
    it('xóa CẢ L1 lẫn L2', async () => {
      const cache = new DistributedCache(deps, { ttlMs: 60_000 });
      await cache.getOrSet('k', async () => 'v1');

      const ok = await cache.invalidate('k');

      expect(ok).toBe(true);
      expect(db.rows.size).toBe(0);
      const producer = vi.fn(async () => 'v2');
      await expect(cache.getOrSet('k', producer)).resolves.toBe('v2');
    });

    it('⭐ invalidate TỪ XA: instance B nhìn thấy thay đổi ngay, không chờ TTL', async () => {
      const cacheA = new DistributedCache(deps, { ttlMs: 60_000 });
      const cacheB = new DistributedCache(deps, { ttlMs: 60_000 });

      await cacheA.getOrSet('tax', async () => 'luật-cũ');
      await cacheB.getOrSet('tax', async () => 'luật-cũ'); // B cũng đã cache

      await cacheA.invalidate('tax'); // A sửa luật rồi invalidate

      // B ĐÁNG LẼ vẫn còn L1 (30s) và L2 (60s) — nhưng L2 đã bị xóa nên B phải
      // nạp lại. Đây chính là điều cache in-memory cũ KHÔNG làm được.
      await expect(cacheB.getOrSet('tax', async () => 'luật-mới')).resolves.toBe('luật-mới');
    });

    it('KHÔNG tự xóa L1 của mình khi nhận lại sự kiện do CHÍNH MÌNH gây ra', async () => {
      // Nếu không chặn echo: ghi L2 → Realtime phát lại → chính mình xóa L1
      // → hit L1 không bao giờ xảy ra, cache mất tác dụng.
      const cache = new DistributedCache(deps, { ttlMs: 60_000 });
      await cache.getOrSet('self', async () => 'v1');

      // L1 phải còn nguyên sau khi đã ghi L2 (sự kiện echo bị bỏ qua).
      const producer = vi.fn(async () => 'v2');
      await expect(cache.getOrSet('self', producer)).resolves.toBe('v1');
      expect(producer).not.toHaveBeenCalled();
    });

    it('vẫn NHẬN invalidate từ instance khác (echo chặn theo KEY, không theo instance)', async () => {
      const cacheA = new DistributedCache(deps, { ttlMs: 60_000 });
      const cacheB = new DistributedCache(deps, { ttlMs: 60_000 });

      // A ghi key `a`, B ghi key `b` — hai key KHÁC nhau.
      await cacheA.getOrSet('a', async () => 'A');
      await cacheB.getOrSet('b', async () => 'B');

      // A invalidate `b` → B phải thấy. Nếu chặn echo theo INSTANCE thay vì
      // theo KEY, B (vừa tự ghi `b`) sẽ bỏ sót mất sự kiện này.
      await cacheA.invalidate('b');
      await expect(cacheB.getOrSet('b', async () => 'B-moi')).resolves.toBe('B-moi');
    });

    it('invalidatePrefix xóa theo tiền tố ở CẢ L1 lẫn L2', async () => {
      const cache = new DistributedCache(deps, { ttlMs: 60_000 });
      await cache.getOrSet('tax_rules:all', async () => 1);
      await cache.getOrSet('tax_rules:hang-hoa', async () => 2);
      await cache.getOrSet('khac:1', async () => 3);

      const n = await cache.invalidatePrefix('tax_rules:');

      expect(n).toBeGreaterThanOrEqual(2);
      expect(db.rows.size).toBe(1); // chỉ còn khac:1
      await expect(cache.getOrSet('khac:1', async () => 99)).resolves.toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  describe('phân tách tenant', () => {
    it('cùng key nhưng khác tenant → cache RIÊNG, không lộ chéo', async () => {
      const tenantA = new DistributedCache({ ...deps, tenantId: 'tenant-A' });
      const tenantB = new DistributedCache({ ...deps, tenantId: 'tenant-B' });

      await tenantA.getOrSet('tax', async () => 'của-A');
      const outB = await tenantB.getOrSet('tax', async () => 'của-B');

      expect(outB).toBe('của-B');
      await expect(tenantA.getOrSet('tax', async () => 'khác')).resolves.toBe('của-A');
    });
  });

  // ---------------------------------------------------------------------------
  describe('prune', () => {
    it('dọn các bản ghi hết hạn', async () => {
      const cache = new DistributedCache(deps);
      await cache.getOrSet('short', async () => 'x', 1); // 1 giây
      await cache.getOrSet('long', async () => 'y', 600);
      expect(db.rows.size).toBe(2);

      // Giả lập đã quá hạn bằng cách tua expiresAt trong "DB" giả
      for (const [, v] of db.rows) {
        if (v.value === 'x') v.expiresAt = Date.now() - 1;
      }

      const n = await cache.prune();
      expect(n).toBe(1);
      expect(db.rows.size).toBe(1);
    });

    it('L2 tắt → prune trả 0, không gọi RPC', async () => {
      const cache = new DistributedCache(deps);
      db.setFailure({ code: 'PGRST202' });
      await cache.getOrSet('k', async () => 'x');
      const before = db.calls.length;
      await expect(cache.prune()).resolves.toBe(0);
      expect(db.calls.length).toBe(before);
    });
  });
});
