import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isFeatureEnabled,
  areFeaturesEnabled,
  clearFeatureFlagCache,
  setFeatureFlagDeps,
  defaultFeatureFlagDeps,
  FEATURE_FLAGS,
  FLAG_CACHE_TTL_MS,
} from './featureFlagService';
import { setOverride, resetOverrides, defineFlag } from '../config/featureFlags';
import type { OutboxDeps, RpcResult } from './domainEventService';

const TENANT = 'tenant-vcomm-prod-01';

/** Deps giả lập: đếm số lần gọi RPC để kiểm chứng cache có thật sự hoạt động. */
function makeDeps(handler: (fn: string, args: Record<string, unknown>) => RpcResult | boolean | null) {
  let count = 0;
  let last: Record<string, unknown> = {};

  const deps: OutboxDeps = {
    rpc: async (fn, args) => {
      count += 1;
      last = args;
      const out = handler(fn, args);
      if (out === null) return { data: null, error: null } as RpcResult; // DB trả NULL
      return typeof out === 'boolean' ? ({ data: out, error: null } as RpcResult) : out;
    },
  };

  return { deps, callCount: () => count, lastArgs: () => last };
}

const DB_MISSING: RpcResult = { data: null, error: { code: 'PGRST202', message: 'chưa có hàm' } };

describe('GĐ 3.2 — lớp ①: DB quyết định khi CÓ hàng', () => {
  beforeEach(() => {
    clearFeatureFlagCache();
    setFeatureFlagDeps(null);
    resetOverrides();
  });
  afterEach(resetOverrides);

  it('DB bật → true', async () => {
    const q = makeDeps(() => true);
    expect(await isFeatureEnabled(FEATURE_FLAGS.TT99_BRIDGE, {}, q.deps)).toBe(true);
  });

  it('DB tắt → false (kể cả khi lớp config đang mặc định BẬT)', async () => {
    // ⭐ Đây chính là lý do phải có 3 trạng thái: DB tắt là CỐ Ý, phải thắng
    //    mặc định `true` của `src/config/featureFlags.ts`.
    const q = makeDeps(() => false);
    expect(await isFeatureEnabled(FEATURE_FLAGS.TT99_BRIDGE, {}, q.deps)).toBe(false);
  });
});

describe('GĐ 3.2 — lớp ②: DB KHÔNG có hàng (NULL) → rơi về config', () => {
  beforeEach(() => {
    clearFeatureFlagCache();
    setFeatureFlagDeps(null);
    resetOverrides();
  });
  afterEach(resetOverrides);

  it('⭐ DB NULL + flag có trong config → theo config (tt99_bridge mặc định BẬT)', async () => {
    const q = makeDeps(() => null);
    expect(await isFeatureEnabled(FEATURE_FLAGS.TT99_BRIDGE, {}, q.deps)).toBe(true);
  });

  it('⭐ DB NULL + config bị override tắt → false', async () => {
    setOverride(FEATURE_FLAGS.TT99_BRIDGE, false);
    const q = makeDeps(() => null);
    expect(await isFeatureEnabled(FEATURE_FLAGS.TT99_BRIDGE, {}, q.deps)).toBe(false);
  });

  it('⭐ DB NULL + flag KHÔNG có trong config → fallback (mặc định false = fail-closed)', async () => {
    const q = makeDeps(() => null);
    expect(await isFeatureEnabled('flag_chua_dang_ky', {}, q.deps)).toBe(false);
  });

  it('DB NULL + flag không có trong config + fallback=true → true', async () => {
    const q = makeDeps(() => null);
    expect(await isFeatureEnabled('flag_chua_dang_ky', { fallback: true }, q.deps)).toBe(true);
  });

  it('⭐ CHƯA CHẠY MIGRATION → hành vi giữ nguyên như hôm nay (theo config)', async () => {
    // Đây là điều kiện sống còn: chạy migration 003 không được đổi hành vi.
    const q = makeDeps(() => DB_MISSING);
    expect(await isFeatureEnabled(FEATURE_FLAGS.TT99_BRIDGE, {}, q.deps)).toBe(true);
  });

  it('⚠️ KHÔNG ném lỗi khi RPC ném — lỗi flag không được làm gãy màn hình', async () => {
    const deps: OutboxDeps = {
      rpc: async () => {
        throw new Error('mất mạng');
      },
    };
    await expect(isFeatureEnabled(FEATURE_FLAGS.EINVOICE, {}, deps)).resolves.toBe(false);
  });
});

describe('GĐ 3.2 — tham số gửi sang RPC', () => {
  beforeEach(() => {
    clearFeatureFlagCache();
    setFeatureFlagDeps(null);
    resetOverrides();
  });
  afterEach(resetOverrides);

  it('gửi đúng key / tenant mặc định / subject', async () => {
    const q = makeDeps(() => true);
    await isFeatureEnabled(FEATURE_FLAGS.TT99_BRIDGE, { subject: 'user-9' }, q.deps);
    expect(q.lastArgs()).toEqual({
      p_flag_key: FEATURE_FLAGS.TT99_BRIDGE,
      p_tenant_id: TENANT,
      p_subject: 'user-9',
    });
  });

  it('truyền tenant + subject riêng', async () => {
    const q = makeDeps(() => true);
    await isFeatureEnabled('x', { tenantId: 'tenant-b', subject: 's1' }, q.deps);
    expect(q.lastArgs()).toMatchObject({ p_tenant_id: 'tenant-b', p_subject: 's1' });
  });

  it('subject bỏ trống → gửi null (đánh giá cấp tenant)', async () => {
    const q = makeDeps(() => true);
    await isFeatureEnabled('x', {}, q.deps);
    expect(q.lastArgs().p_subject).toBeNull();
  });
});

describe('GĐ 3.2 — cache flag (30 giây)', () => {
  beforeEach(() => {
    clearFeatureFlagCache();
    setFeatureFlagDeps(null);
    resetOverrides();
  });
  afterEach(resetOverrides);

  it('⭐ 10 lần hỏi cùng 1 flag → RPC chỉ bị gọi 1 LẦN', async () => {
    const q = makeDeps(() => true);
    for (let i = 0; i < 10; i++) await isFeatureEnabled(FEATURE_FLAGS.TT99_BRIDGE, {}, q.deps);
    expect(q.callCount()).toBe(1);
  });

  it('khác subject → không dùng chung cache (canary đánh riêng từng người)', async () => {
    const q = makeDeps(() => true);
    await isFeatureEnabled('f', { subject: 'user-a' }, q.deps);
    await isFeatureEnabled('f', { subject: 'user-b' }, q.deps);
    expect(q.callCount()).toBe(2);
  });

  it('khác tenant → không dùng chung cache', async () => {
    const q = makeDeps(() => true);
    await isFeatureEnabled('f', { tenantId: 't1' }, q.deps);
    await isFeatureEnabled('f', { tenantId: 't2' }, q.deps);
    expect(q.callCount()).toBe(2);
  });

  it('⚠️ KHÔNG cache nhánh "rơi về config" — lỗi tạm thời không được đóng băng flag', async () => {
    let n = 0;
    const q = makeDeps(() => {
      n += 1;
      // Lần 1: DB lỗi → rơi về config. Lần 2: DB bật → phải thấy true NGAY.
      return n === 1 ? DB_MISSING : true;
    });
    expect(await isFeatureEnabled('f', {}, q.deps)).toBe(false); // chưa đăng ký → fallback
    expect(await isFeatureEnabled('f', {}, q.deps)).toBe(true);
    expect(q.callCount()).toBe(2);
  });

  it('clearFeatureFlagCache() buộc đọc lại ngay (dùng sau khi đổi flag)', async () => {
    const q = makeDeps(() => true);
    await isFeatureEnabled('f', {}, q.deps);
    clearFeatureFlagCache();
    await isFeatureEnabled('f', {}, q.deps);
    expect(q.callCount()).toBe(2);
  });

  it('TTL cache là 30 giây', () => {
    expect(FLAG_CACHE_TTL_MS).toBe(30_000);
  });
});

describe('GĐ 3.2 — areFeaturesEnabled (gom nhiều flag)', () => {
  beforeEach(() => {
    clearFeatureFlagCache();
    setFeatureFlagDeps(null);
    resetOverrides();
  });
  afterEach(resetOverrides);

  it('trả map đúng từng flag', async () => {
    const q = makeDeps((_fn, args) => args.p_flag_key === 'flag-a');
    const r = await areFeaturesEnabled(['flag-a', 'flag-b'], {}, q.deps);
    expect(r).toEqual({ 'flag-a': true, 'flag-b': false });
  });

  it('danh sách rỗng → object rỗng, không gọi RPC', async () => {
    const q = makeDeps(() => true);
    const r = await areFeaturesEnabled([], {}, q.deps);
    expect(r).toEqual({});
    expect(q.callCount()).toBe(0);
  });

  it('flag đã đăng ký trong config nhưng DB NULL → lấy từ config', async () => {
    defineFlag({ key: 'ff_local', description: 'test', defaultValue: true });
    const q = makeDeps(() => null);
    const r = await areFeaturesEnabled(['ff_local'], {}, q.deps);
    expect(r).toEqual({ ff_local: true });
  });
});

describe('GĐ 3.2 — an toàn môi trường', () => {
  beforeEach(() => {
    clearFeatureFlagCache();
    setFeatureFlagDeps(null);
    resetOverrides();
  });
  afterEach(() => {
    resetOverrides();
    vi.unstubAllGlobals();
  });

  it('⚠️ KHÔNG ở trình duyệt (test/SSR) + không truyền deps → KHÔNG tự tạo client, không gọi mạng', async () => {
    vi.stubGlobal('window', undefined);
    // Kết quả đến thẳng từ lớp config (tt99_bridge mặc định BẬT) mà không cần
    // deps nào → chứng tỏ không hề khởi tạo Supabase client (nếu có sẽ gọi mạng).
    await expect(isFeatureEnabled(FEATURE_FLAGS.TT99_BRIDGE)).resolves.toBe(true);
  });

  it('có deps tường minh → vẫn dùng DB dù không ở trình duyệt (dùng cho server)', async () => {
    vi.stubGlobal('window', undefined);
    const q = makeDeps(() => false);
    expect(await isFeatureEnabled(FEATURE_FLAGS.TT99_BRIDGE, {}, q.deps)).toBe(false);
    expect(q.callCount()).toBe(1);
  });
});

describe('GĐ 3.2 — deps mặc định (browser)', () => {
  beforeEach(() => setFeatureFlagDeps(null));

  it('defaultFeatureFlagDeps() cache lại client — gọi 2 lần chỉ import 1 lần', async () => {
    const a = await defaultFeatureFlagDeps();
    const b = await defaultFeatureFlagDeps();
    expect(a).toBe(b);
  });

  it('setFeatureFlagDeps() ghi đè client (dùng cho test / SSR)', async () => {
    const fake: OutboxDeps = { rpc: async () => ({ data: true, error: null }) };
    setFeatureFlagDeps(fake);
    expect(await defaultFeatureFlagDeps()).toBe(fake);
    setFeatureFlagDeps(null);
  });
});
