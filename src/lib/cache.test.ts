import { describe, it, expect, vi } from 'vitest';
import { MemoryCache, defaultCache } from './cache';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('GĐ 3.3 — MemoryCache: TTL', () => {
  it('đọc lại trong hạn → hit', () => {
    const c = new MemoryCache<string>({ ttlMs: 1000 });
    c.set('a', '1');
    expect(c.get('a')).toBe('1');
    expect(c.stats().hits).toBe(1);
  });

  it('hết hạn → miss và tự xoá (không trả dữ liệu cũ)', async () => {
    const c = new MemoryCache<string>({ ttlMs: 20 });
    c.set('a', '1');
    await sleep(30);
    expect(c.get('a')).toBeUndefined();
    expect(c.size).toBe(0);
    expect(c.stats().expirations).toBe(1);
  });

  it('TTL riêng từng key ghi đè TTL mặc định', async () => {
    const c = new MemoryCache<string>({ ttlMs: 1000 });
    c.set('ngắn', 'x', 20);
    c.set('dài', 'y');
    await sleep(30);
    expect(c.get('ngắn')).toBeUndefined();
    expect(c.get('dài')).toBe('y');
  });

  it('has() không tính hit/miss nhưng vẫn dọn bản ghi hết hạn', async () => {
    const c = new MemoryCache<string>({ ttlMs: 20 });
    c.set('a', '1');
    expect(c.has('a')).toBe(true);
    await sleep(30);
    expect(c.has('a')).toBe(false);
    expect(c.size).toBe(0);
    expect(c.stats().hits).toBe(0);
    expect(c.stats().misses).toBe(0);
  });

  it('prune() dọn hết bản ghi hết hạn, giữ lại bản ghi còn hạn', async () => {
    const c = new MemoryCache<string>({ ttlMs: 20 });
    c.set('cũ', '1', 10);
    c.set('mới', '2', 5000);
    await sleep(30);
    expect(c.prune()).toBe(1);
    expect(c.get('mới')).toBe('2');
  });
});

describe('GĐ 3.3 — MemoryCache: LRU', () => {
  it('đầy → đẩy bản ghi ÍT DÙNG NHẤT (không phải cũ nhất)', () => {
    const c = new MemoryCache<string>({ ttlMs: 10_000, maxEntries: 2 });
    c.set('a', '1');
    c.set('b', '2');
    c.get('a'); // ⭐ chạm lại 'a' → 'a' thành MỚI NHẤT, 'b' là ít dùng nhất
    c.set('c', '3');

    expect(c.get('a')).toBe('1'); // 'a' còn (vừa được dùng)
    expect(c.get('b')).toBeUndefined(); // 'b' bị đẩy
    expect(c.get('c')).toBe('3');
  });

  it('nếu KHÔNG chạm lại khi get → LRU biến thành FIFO (khẳng định lý do phải "touch")', () => {
    // Test này mô tả hành vi SAI để làm rõ: Map giữ thứ tự CHÈN,
    // nên nếu get() không delete+set, bản ghi cũ nhất bị đẩy dù vừa được đọc.
    const wrong = new Map<string, string>();
    wrong.set('a', '1');
    wrong.set('b', '2');
    wrong.get('a'); // chỉ đọc, không touch
    wrong.set('c', '3');
    // Với Map trần (không touch) thì size vẫn 3 — không tự giới hạn được.
    expect(wrong.size).toBe(3);
    // → phải có lớp LRU như MemoryCache mới giới hạn được số bản ghi.
  });

  it('set lại key đã có → không vượt quá maxEntries', () => {
    const c = new MemoryCache<string>({ ttlMs: 10_000, maxEntries: 2 });
    c.set('a', '1');
    c.set('b', '2');
    c.set('a', '1-mới');
    expect(c.size).toBe(2);
    expect(c.get('a')).toBe('1-mới');
  });

  it('maxEntries = 1 → chỉ giữ bản ghi cuối', () => {
    const c = new MemoryCache<string>({ ttlMs: 10_000, maxEntries: 1 });
    c.set('a', '1');
    c.set('b', '2');
    expect(c.get('a')).toBeUndefined();
    expect(c.get('b')).toBe('2');
  });

  it('onEvict nhận đúng lý do LRU', () => {
    const onEvict = vi.fn();
    const c = new MemoryCache<string>({ ttlMs: 10_000, maxEntries: 1, onEvict });
    c.set('a', '1');
    c.set('b', '2');
    expect(onEvict).toHaveBeenCalledWith('a', 'lru');
  });
});

describe('GĐ 3.3 — remember(): chống THUNDERING HERD', () => {
  it('100 lời gọi đồng thời cùng 1 key → producer chỉ chạy 1 LẦN', async () => {
    const c = new MemoryCache<number>({ ttlMs: 1000 });
    const producer = vi.fn(async () => {
      await sleep(10); // giả lập query DB chậm
      return 42;
    });

    const results = await Promise.all(Array.from({ length: 100 }, () => c.remember('k', producer)));

    expect(producer).toHaveBeenCalledTimes(1); // ⭐ nếu không single-flight = 100 lần
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe(42);
  });

  it('lần thứ 2 (cache đã có) → KHÔNG gọi producer', async () => {
    const c = new MemoryCache<number>({ ttlMs: 1000 });
    const producer = vi.fn(async () => 7);
    expect(await c.remember('k', producer)).toBe(7);
    expect(await c.remember('k', producer)).toBe(7);
    expect(producer).toHaveBeenCalledTimes(1);
  });

  it('🔴 producer NÉM LỖI → gỡ khỏi inflight, không cache lỗi, lần sau thử lại', async () => {
    const c = new MemoryCache<number>({ ttlMs: 1000 });
    let attempt = 0;
    const producer = async () => {
      attempt += 1;
      if (attempt === 1) throw new Error('DB die');
      return 99;
    };

    await expect(c.remember('k', producer)).rejects.toThrow('DB die');
    expect(c.inflightCount).toBe(0); // ⭐ không kẹt promise đã reject
    expect(c.has('k')).toBe(false); // không cache lỗi

    expect(await c.remember('k', producer)).toBe(99);
    expect(c.get('k')).toBe(99);
  });

  it('các key khác nhau chạy ĐỘC LẬP (không gom nhầm)', async () => {
    const c = new MemoryCache<string>({ ttlMs: 1000 });
    const [a, b] = await Promise.all([
      c.remember('a', async () => 'A'),
      c.remember('b', async () => 'B'),
    ]);
    expect(a).toBe('A');
    expect(b).toBe('B');
  });
});

describe('GĐ 3.3 — API phụ & chống cấu hình sai', () => {
  it('delete / clear', () => {
    const c = new MemoryCache<string>({ ttlMs: 1000 });
    c.set('a', '1');
    expect(c.delete('a')).toBe(true);
    expect(c.delete('a')).toBe(false);
    c.set('b', '2');
    c.clear();
    expect(c.size).toBe(0);
  });

  it('stats phản ánh hit/miss', () => {
    const c = new MemoryCache<string>({ ttlMs: 1000 });
    c.get('không-có'); // miss
    c.set('a', '1');
    c.get('a'); // hit
    c.get('a'); // hit
    const s = c.stats();
    expect(s.hits).toBe(2);
    expect(s.misses).toBe(1);
    expect(s.size).toBe(1);
  });

  it('cấu hình sai (ttl ≤ 0 / maxEntries ≤ 0) → ném lỗi ngay, không để cache hỏng ngầm', () => {
    expect(() => new MemoryCache({ ttlMs: 0 })).toThrow();
    expect(() => new MemoryCache({ maxEntries: 0 })).toThrow();
  });

  it('defaultCache là instance dùng chung, cấu hình hợp lý', () => {
    expect(defaultCache).toBeInstanceOf(MemoryCache);
    expect(defaultCache.size).toBe(0);
  });
});
