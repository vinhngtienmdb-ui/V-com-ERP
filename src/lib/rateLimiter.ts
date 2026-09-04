/**
 * ============================================================================
 *  rateLimiter.ts — GĐ 3.4: Giới hạn tốc độ (token bucket)
 * ============================================================================
 *
 *  Lỗ hổng hạ tầng (spec 022): VComm KHÔNG có rate limit. Rủi ro cụ thể:
 *    · Endpoint AI/ZNS/OTP bị gọi lặp → ĐỐT TIỀN (token + SMS) hoặc bị nhà
 *      cung cấp khóa (Zalo ZNS có hạn mức, MISA/AI có quota)
 *    · Endpoint phát HĐĐT / khấu trừ thuế bị spam → sinh chứng từ RÁC
 *
 *  Thuật toán: **TOKEN BUCKET** (xô token) thay vì fixed-window vì:
 *    · Fixed-window có lỗi "burst ở mép cửa sổ": 100 request lúc 23:59:59 +
 *      100 request lúc 00:00:00 = 200 request trong 2 giây mà vẫn "hợp lệ".
 *    · Token bucket nạp LIÊN TỤC theo thời gian → không có mép cửa sổ, vừa
 *      cho phép burst ngắn (đủ token thì được) vừa giữ tốc độ trung bình.
 *
 *  Cách hoạt động:
 *    Mỗi key có 1 xô chứa tối đa `limit` token, nạp lại với tốc độ
 *    `limit / windowMs` token mỗi ms. Mỗi request rút `cost` token.
 *    Không đủ token → bị chặn, kèm `retryAfterMs` để client biết chờ bao lâu.
 *
 *  🔴 THIẾT KẾ CÓ CHỦ ĐÍCH:
 *    · `now()` có thể inject → test được mà KHÔNG cần fake timer/đợi thật.
 *    · Trả `retryAfterMs` + `resetAt` → caller dựng được header
 *      `Retry-After` / `X-RateLimit-Reset` đúng chuẩn HTTP.
 *    · `prune()` để dọn xô rỗng — nếu không, bộ nhớ phình theo số IP/user
 *      từng đi qua (dạng tấn công chậm).
 *    · Module THUẦN, không biết Express → dùng được cho cả server lẫn client.
 * ============================================================================
 */

export interface RateLimitRule {
  /** Số token tối đa trong xô (= burst tối đa). */
  limit: number;
  /** Cửa sổ nạp đầy xô (ms). Tốc độ nạp = limit / windowMs token mỗi ms. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Số token còn lại SAU khi rút (0 nếu bị chặn). */
  remaining: number;
  /** Giới hạn của luật đang áp dụng. */
  limit: number;
  /** Thời điểm (epoch ms) xô đầy lại. */
  resetAt: number;
  /** Số ms cần chờ để có đủ token. 0 nếu được phép. */
  retryAfterMs: number;
}

export interface RateLimiterOptions {
  /** Luật MẶC ĐỊNH (dùng khi không chỉ định tên luật). */
  rule: RateLimitRule;
  /** Luật theo tên — ví dụ `{ ai: {limit:10, windowMs:60_000}, otp: {...} }`. */
  rules?: Record<string, RateLimitRule>;
  /** Inject clock (epoch ms) để test mà không cần đợi thật. Mặc định Date.now. */
  now?: () => number;
}

interface Bucket {
  tokens: number;
  lastRefillAt: number;
}

/** Luật gợi ý cho các endpoint hay bị lạm dụng ở VComm. */
export const SUGGESTED_RULES = {
  /** AI: đắt tiền, chậm → chặt nhất. */
  ai: { limit: 10, windowMs: 60_000 },
  /** Gửi ZNS/SMS: tính tiền theo tin. */
  notify: { limit: 20, windowMs: 60_000 },
  /** Phát hành HĐĐT / xử lý sai sót: sinh chứng từ thật. */
  einvoice: { limit: 30, windowMs: 60_000 },
  /** Đăng nhập / OTP: chống brute force. */
  auth: { limit: 5, windowMs: 60_000 },
  /** API chung. */
  api: { limit: 120, windowMs: 60_000 },
  /**
   * Webhook ngân hàng (SePay): mỗi giao dịch = 1 request. Phải RỘNG để không
   * rớt giao dịch thật (rớt = mất tiền, không khôi phục được), nhưng vẫn có
   * trần để chặn flood/spam. 10 request/giây là vượt xa tải thực tế.
   */
  webhook: { limit: 600, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitRule>;

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly rule: RateLimitRule;
  private readonly rules: Record<string, RateLimitRule>;
  private readonly now: () => number;

  constructor(opts: RateLimiterOptions) {
    this.rule = opts.rule;
    this.rules = opts.rules ?? {};
    this.now = opts.now ?? (() => Date.now());
    this.assertRule('default', this.rule);
    Object.entries(this.rules).forEach(([name, r]) => this.assertRule(name, r));
  }

  private assertRule(name: string, r: RateLimitRule): void {
    if (!r || !Number.isFinite(r.limit) || r.limit <= 0) {
      throw new Error(`[rateLimiter] Luật "${name}": limit phải là số > 0`);
    }
    if (!Number.isFinite(r.windowMs) || r.windowMs <= 0) {
      throw new Error(`[rateLimiter] Luật "${name}": windowMs phải là số > 0`);
    }
  }

  private resolve(ruleName?: string): RateLimitRule {
    if (!ruleName) return this.rule;
    const found = this.rules[ruleName];
    if (!found) {
      throw new Error(
        `[rateLimiter] Không có luật "${ruleName}". Đã đăng ký: ${Object.keys(this.rules).join(', ') || '(trống)'}`
      );
    }
    return found;
  }

  /** Khóa nội bộ: luật khác nhau trên cùng 1 subject phải là xô khác nhau. */
  private keyOf(subject: string, ruleName?: string): string {
    return ruleName ? `${ruleName}::${subject}` : subject;
  }

  private refill(bucket: Bucket, r: RateLimitRule, now: number): void {
    if (now <= bucket.lastRefillAt) return; // thời gian không đi lùi
    const elapsedMs = now - bucket.lastRefillAt;
    const refillPerMs = r.limit / r.windowMs;
    bucket.tokens = Math.min(r.limit, bucket.tokens + elapsedMs * refillPerMs);
    bucket.lastRefillAt = now;
  }

  /**
   * Rút token. `cost` > 1 dùng cho request "đắt" (vd 1 lần phát HĐĐT nhiều hoá đơn).
   *
   * ⚠️ cost lớn hơn sức chứa xô → KHÔNG BAO GIỜ được phép (chờ bao lâu cũng vô
   * ích). Ném lỗi để cấu hình sai bị phát hiện ngay, thay vì chặn vĩnh viễn.
   */
  consume(subject: string, cost = 1, ruleName?: string): RateLimitResult {
    const r = this.resolve(ruleName);
    if (!Number.isFinite(cost) || cost <= 0) {
      throw new Error('[rateLimiter] cost phải là số > 0');
    }
    if (cost > r.limit) {
      throw new Error(
        `[rateLimiter] cost (${cost}) vượt quá limit (${r.limit}) — request này không bao giờ được phép`
      );
    }

    const now = this.now();
    const key = this.keyOf(subject, ruleName);
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: r.limit, lastRefillAt: now };
      this.buckets.set(key, bucket);
    }

    this.refill(bucket, r, now);

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        limit: r.limit,
        resetAt: Math.ceil(now + ((r.limit - bucket.tokens) / r.limit) * r.windowMs),
        retryAfterMs: 0,
      };
    }

    // Thiếu bao nhiêu token → cần chừng nào ms để nạp đủ.
    const missing = cost - bucket.tokens;
    const retryAfterMs = Math.ceil((missing / r.limit) * r.windowMs);
    return {
      allowed: false,
      remaining: 0,
      limit: r.limit,
      resetAt: now + retryAfterMs,
      retryAfterMs,
    };
  }

  /** Xem trạng thái mà KHÔNG rút token (để hiển thị remaining cho user). */
  peek(subject: string, ruleName?: string): RateLimitResult {
    const r = this.resolve(ruleName);
    const now = this.now();
    const key = this.keyOf(subject, ruleName);
    const bucket = this.buckets.get(key);
    const tokens = bucket ? bucket.tokens : r.limit;

    return {
      allowed: tokens >= 1,
      remaining: Math.floor(tokens),
      limit: r.limit,
      resetAt: bucket ? Math.ceil(now + ((r.limit - tokens) / r.limit) * r.windowMs) : now,
      retryAfterMs: 0,
    };
  }

  /** Xoá trạng thái của 1 subject (vd admin mở khoá tay, hoặc sau khi login OK). */
  reset(subject: string, ruleName?: string): boolean {
    return this.buckets.delete(this.keyOf(subject, ruleName));
  }

  /**
   * Dọn các xô đã ĐẦY (không còn thiếu token) — bộ nhớ không phình theo số
   * IP/user từng đi qua. Gọi định kỳ (vd mỗi phút).
   */
  prune(): number {
    const now = this.now();
    let removed = 0;
    for (const [key, bucket] of this.buckets) {
      const ruleName = key.includes('::') ? key.split('::')[0] : undefined;
      const r = this.resolve(ruleName);
      this.refill(bucket, r, now);
      if (bucket.tokens >= r.limit - 1e-9) {
        this.buckets.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  get size(): number {
    return this.buckets.size;
  }
}

/**
 * Tiện ích: dựng header HTTP chuẩn từ kết quả.
 * Dùng được cho cả Express (`res.set(headers)`) lẫn fetch Response.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
  if (!result.allowed) {
    headers['Retry-After'] = String(Math.ceil(result.retryAfterMs / 1000));
  }
  return headers;
}
