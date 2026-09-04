/**
 * ============================================================================
 *  cache.ts — GĐ 3.3: Cache tập trung (TTL + LRU + single-flight)
 * ============================================================================
 *
 *  Lỗ hổng hạ tầng (spec 022): VComm KHÔNG có cache tập trung. Hậu quả:
 *    · Cùng 1 dữ liệu (danh mục, cấu hình thuế, tỷ giá) bị query lại liên tục
 *    · Mỗi lần reload lại gọi Supabase → chậm + tốn quota
 *
 *  Module này là cache IN-MEMORY, không dependency, chạy được cả node lẫn browser.
 *  Không dùng Redis vì: (a) chưa có hạ tầng, (b) phần lớn thứ cần cache ở VComm là
 *  dữ liệu NHỎ và ÍT ĐỔI (cấu hình thuế, danh mục, feature flag) — cache cục bộ đủ.
 *
 *  Ba tính năng CHÍNH (lý do không dùng `Map` trần):
 *
 *  1. **TTL** — bản ghi tự hết hạn. `get()` trả `undefined` khi hết hạn (và xoá).
 *  2. **LRU** — giới hạn số bản ghi; đầy thì đẩy bản ghi ÍT DÙNG NHẤT ra trước.
 *     `Map` giữ thứ tự chèn → `get()` phải "chạm" lại (delete + set) để bản ghi
 *     vừa dùng được coi là mới nhất. Quên bước này = LRU biến thành FIFO.
 *  3. ⭐ **Single-flight (`remember`)** — chống THUNDERING HERD: 100 request cùng
 *     hỏi 1 key vừa hết hạn → nếu không gom lại, tất cả cùng gọi DB. `remember()`
 *     gom các lời gọi đang chờ vào CHUNG 1 promise; producer chỉ chạy 1 lần.
 *
 *  ⚠️ GIỚI HẠN: cache nằm TRONG TIẾN TRÌNH. Nhiều instance/serverless → mỗi
 *    instance 1 bản sao, và invalidate ở instance này KHÔNG lan sang instance
 *    khác. Chỉ dùng cho dữ liệu chấp nhận "nhất quán cuối cùng".
 * ============================================================================
 */

export interface CacheOptions {
  /** Thời gian sống mặc định (ms). Mặc định 60_000 (1 phút). */
  ttlMs?: number;
  /** Số bản ghi tối đa (LRU). Mặc định 500. */
  maxEntries?: number;
  /** Gọi khi 1 bản ghi bị đẩy ra (để log/telemetry). */
  onEvict?: (key: string, reason: 'lru' | 'expired' | 'deleted' | 'cleared') => void;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  expirations: number;
  size: number;
}

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache<T = unknown> {
  private readonly store = new Map<string, Entry<T>>();
  private readonly inflight = new Map<string, Promise<T>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly onEvict?: CacheOptions['onEvict'];

  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private expirations = 0;

  constructor(opts: CacheOptions = {}) {
    this.ttlMs = opts.ttlMs ?? 60_000;
    this.maxEntries = opts.maxEntries ?? 500;
    this.onEvict = opts.onEvict;
    if (this.ttlMs <= 0) throw new Error('[cache] ttlMs phải > 0');
    if (this.maxEntries <= 0) throw new Error('[cache] maxEntries phải > 0');
  }

  /** Số bản ghi đang giữ (chưa loại bản ghi hết hạn). */
  get size(): number {
    return this.store.size;
  }

  /**
   * Đọc 1 key. Hết hạn → xoá và coi như miss.
   * ⭐ Phải "chạm" lại (delete + set) để LRU đúng — nếu không sẽ thành FIFO.
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.expirations += 1;
      this.onEvict?.(key, 'expired');
      this.misses += 1;
      return undefined;
    }

    // Đưa lên cuối Map = bản ghi "mới dùng nhất"
    this.store.delete(key);
    this.store.set(key, entry);
    this.hits += 1;
    return entry.value;
  }

  /** Có key này không (còn hạn). Không tính vào hit/miss. */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.expirations += 1;
      this.onEvict?.(key, 'expired');
      return false;
    }
    return true;
  }

  /** Ghi 1 key. Đầy → đẩy bản ghi ít dùng nhất (đầu Map). */
  set(key: string, value: T, ttlMs?: number): void {
    if (this.store.has(key)) this.store.delete(key);

    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs != null ? ttlMs : this.ttlMs),
    });

    while (this.store.size > this.maxEntries) {
      const oldestKey = this.store.keys().next().value as string | undefined;
      if (oldestKey == null) break;
      this.store.delete(oldestKey);
      this.evictions += 1;
      this.onEvict?.(oldestKey, 'lru');
    }
  }

  delete(key: string): boolean {
    const existed = this.store.delete(key);
    if (existed) this.onEvict?.(key, 'deleted');
    return existed;
  }

  /**
   * Danh sách key CÒN HẠN, theo thứ tự ít-dùng-nhất → mới-dùng-nhất (thứ tự LRU).
   *
   * ⚠️ Trả bản SAO: caller có thể `delete()` ngay trong lúc duyệt (vd
   * `DistributedCache.invalidatePrefix`) — duyệt trực tiếp trên Map đang bị sửa
   * sẽ bỏ sót phần tử.
   */
  keys(): string[] {
    const now = Date.now();
    const out: string[] = [];
    for (const [key, entry] of this.store) {
      if (entry.expiresAt > now) out.push(key);
    }
    return out;
  }

  clear(): void {
    const keys = [...this.store.keys()];
    this.store.clear();
    this.inflight.clear();
    keys.forEach((k) => this.onEvict?.(k, 'cleared'));
  }

  /** Dọn các bản ghi hết hạn. @returns số bản ghi đã dọn. */
  prune(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
        removed += 1;
        this.onEvict?.(key, 'expired');
      }
    }
    this.expirations += removed;
    return removed;
  }

  stats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      expirations: this.expirations,
      size: this.store.size,
    };
  }

  /**
   * ⭐ Cache-aside + SINGLE-FLIGHT.
   *
   *  - Cache còn hạn → trả ngay, KHÔNG gọi producer.
   *  - Cache trống/hết hạn → gọi producer ĐÚNG 1 LẦN; các lời gọi đồng thời
   *    khác chờ CHUNG promise đó (tránh 100 request cùng đánh DB).
   *  - Producer NÉM LỖI → promise đang chờ bị gỡ bỏ ngay (không cache lỗi,
   *    không để các request sau chờ một promise đã reject).
   *
   * @param ttlMs ghi đè TTL cho riêng key này (nếu cần).
   */
  async remember(key: string, producer: () => Promise<T> | T, ttlMs?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const pending = this.inflight.get(key);
    if (pending) return pending; // đang có người đi lấy → chờ chung

    const task = (async () => {
      try {
        const value = await producer();
        this.set(key, value, ttlMs);
        return value;
      } finally {
        // Dù thành công hay lỗi cũng gỡ khỏi danh sách đang chờ.
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, task);
    return task;
  }

  /** Số lời gọi đang chờ (để debug/telemetry). */
  get inflightCount(): number {
    return this.inflight.size;
  }
}

/** Cache chia sẻ mặc định — dùng cho dữ liệu ít đổi (cấu hình, danh mục…). */
export const defaultCache = new MemoryCache<unknown>({ ttlMs: 60_000, maxEntries: 500 });
