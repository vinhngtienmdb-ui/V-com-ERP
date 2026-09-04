import { describe, it, expect } from 'vitest';
import { RateLimiter, rateLimitHeaders, SUGGESTED_RULES, type RateLimitRule } from './rateLimiter';

/** Clock giả lập — test mà KHÔNG cần đợi thật. */
function fakeClock(start = 1_000_000) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => { t += ms; },
  };
}

const RULE: RateLimitRule = { limit: 10, windowMs: 60_000 }; // 10 token / phút

describe('GĐ 3.4 — token bucket cơ bản', () => {
  it('rút trong hạn mức → allowed, remaining giảm dần', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: RULE, now: c.now });

    const r1 = rl.consume('ip-1');
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(9);

    const r2 = rl.consume('ip-1');
    expect(r2.remaining).toBe(8);
  });

  it('vượt hạn mức → chặn, remaining = 0, có retryAfterMs', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: RULE, now: c.now });

    for (let i = 0; i < 10; i++) expect(rl.consume('ip-1').allowed).toBe(true);

    const blocked = rl.consume('ip-1');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    // Thiếu 1 token / 10 token mỗi 60s → phải chờ 6s
    expect(blocked.retryAfterMs).toBe(6000);
  });

  it('chờ đủ lâu → được phép lại (token nạp LIÊN TỤC theo thời gian)', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: RULE, now: c.now });

    for (let i = 0; i < 10; i++) rl.consume('ip-1');
    expect(rl.consume('ip-1').allowed).toBe(false);

    c.advance(6000); // nạp lại 1 token
    expect(rl.consume('ip-1').allowed).toBe(true);
    expect(rl.consume('ip-1').allowed).toBe(false);
  });

  it('chờ nguyên 1 cửa sổ → xô ĐẦY LẠI (nạp tối đa = limit)', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: RULE, now: c.now });

    for (let i = 0; i < 10; i++) rl.consume('ip-1');
    c.advance(60_000);
    for (let i = 0; i < 10; i++) expect(rl.consume('ip-1').allowed).toBe(true);
    expect(rl.consume('ip-1').allowed).toBe(false);
  });
});

describe('GĐ 3.4 — vượt trội hơn fixed-window', () => {
  it('🔴 không có lỗi "burst ở mép cửa sổ" như fixed-window', () => {
    // Fixed-window: 10 request cuối phút này + 10 request đầu phút sau = 20
    // request trong 2 giây vẫn "hợp lệ". Token bucket nạp LIÊN TỤC → chặn đúng.
    const c = fakeClock();
    const rl = new RateLimiter({ rule: RULE, now: c.now });

    for (let i = 0; i < 10; i++) rl.consume('ip-1'); // xô cạn
    c.advance(60_000); // đúng mép sang phút mới
    for (let i = 0; i < 10; i++) rl.consume('ip-1'); // xô cạn lần 2
    c.advance(1000); // chỉ 1 giây sau
    // 1 giây = 10/60000 token ≈ 0.167 token → CHƯA ĐỦ cho 1 request
    expect(rl.consume('ip-1').allowed).toBe(false);
  });

  it('cho phép burst ngắn khi xô còn đầy (đúng bản chất token bucket)', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: { limit: 100, windowMs: 60_000 }, now: c.now });
    // 100 request dồn một lúc vẫn được — đó là burst hợp lệ, không phải tấn công
    for (let i = 0; i < 100; i++) expect(rl.consume('ip-1').allowed).toBe(true);
    expect(rl.consume('ip-1').allowed).toBe(false);
  });
});

describe('GĐ 3.4 — phân tách theo subject & luật', () => {
  it('mỗi subject có xô RIÊNG (chặn IP này không ảnh hưởng IP khác)', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: { limit: 2, windowMs: 60_000 }, now: c.now });

    rl.consume('ip-1');
    rl.consume('ip-1');
    expect(rl.consume('ip-1').allowed).toBe(false);

    expect(rl.consume('ip-2').allowed).toBe(true);
  });

  it('luật khác nhau trên CÙNG subject là xô khác nhau', () => {
    const c = fakeClock();
    const rl = new RateLimiter({
      rule: { limit: 1, windowMs: 60_000 },
      rules: { ai: { limit: 1, windowMs: 60_000 }, api: { limit: 5, windowMs: 60_000 } },
      now: c.now,
    });

    expect(rl.consume('user-1', 1, 'ai').allowed).toBe(true);
    expect(rl.consume('user-1', 1, 'ai').allowed).toBe(false);
    // Luật api vẫn còn 5 token, không bị ảnh hưởng bởi luật ai
    expect(rl.consume('user-1', 1, 'api').allowed).toBe(true);
  });

  it('tên luật CHƯA đăng ký → ném lỗi (không âm thầm dùng mặc định)', () => {
    const rl = new RateLimiter({ rule: RULE, rules: { ai: RULE } });
    expect(() => rl.consume('u', 1, 'không-tồn-tại')).toThrow(/Không có luật/);
  });
});

describe('GĐ 3.4 — cost (request "đắt")', () => {
  it('cost > 1 rút nhiều token hơn', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: { limit: 10, windowMs: 60_000 }, now: c.now });
    const r = rl.consume('u', 4);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(6);
    expect(rl.consume('u', 7).allowed).toBe(false); // chỉ còn 6
  });

  it('🔴 cost > limit → NÉM LỖI (chờ bao lâu cũng vô ích)', () => {
    const rl = new RateLimiter({ rule: { limit: 10, windowMs: 60_000 } });
    expect(() => rl.consume('u', 11)).toThrow(/không bao giờ được phép/);
  });

  it('cost không hợp lệ → ném lỗi', () => {
    const rl = new RateLimiter({ rule: RULE });
    expect(() => rl.consume('u', 0)).toThrow();
    expect(() => rl.consume('u', -1)).toThrow();
    expect(() => rl.consume('u', NaN)).toThrow();
  });
});

describe('GĐ 3.4 — peek / reset / prune', () => {
  it('peek KHÔNG rút token (để hiển thị remaining mà không tốn hạn mức)', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: RULE, now: c.now });
    rl.consume('u');
    expect(rl.peek('u').remaining).toBe(9);
    expect(rl.peek('u').remaining).toBe(9); // vẫn 9 — không bị trừ
    expect(rl.peek('chưa-từng-gọi').remaining).toBe(10);
  });

  it('reset xoá trạng thái (vd admin mở khoá tay)', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: { limit: 1, windowMs: 60_000 }, now: c.now });
    rl.consume('u');
    expect(rl.consume('u').allowed).toBe(false);
    expect(rl.reset('u')).toBe(true);
    expect(rl.consume('u').allowed).toBe(true);
  });

  it('prune dọn xô đã đầy → bộ nhớ không phình theo số IP đi qua', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: RULE, now: c.now });
    for (let i = 0; i < 100; i++) rl.consume(`ip-${i}`);
    expect(rl.size).toBe(100);

    c.advance(60_000); // tất cả xô đều nạp đầy lại
    expect(rl.prune()).toBe(100);
    expect(rl.size).toBe(0);
  });

  it('prune GIỮ lại xô đang bị thiếu token (chưa hồi phục)', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: RULE, now: c.now });
    for (let i = 0; i < 10; i++) rl.consume('ip-bận'); // xô CẠN
    rl.consume('ip-rảnh'); // xô còn 9/10

    // Chỉ chờ 6 giây (= nạp lại 1 token): ip-rảnh đã đầy lại (9+1=10) → xoá được;
    // ip-bận mới có 1/10 → phải GIỮ LẠI để không "quên" nó đang bị giới hạn.
    c.advance(6000);
    expect(rl.prune()).toBe(1); // chỉ xoá ip-rảnh
    expect(rl.size).toBe(1);
    expect(rl.peek('ip-bận').remaining).toBe(1);
  });
});

describe('GĐ 3.4 — header HTTP & cấu hình', () => {
  it('rateLimitHeaders đúng chuẩn (có Retry-After khi bị chặn)', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: RULE, now: c.now });

    const ok = rateLimitHeaders(rl.consume('u'));
    expect(ok['X-RateLimit-Limit']).toBe('10');
    expect(ok['X-RateLimit-Remaining']).toBe('9');
    expect(ok['Retry-After']).toBeUndefined();

    for (let i = 0; i < 9; i++) rl.consume('u');
    const blocked = rateLimitHeaders(rl.consume('u'));
    expect(blocked['X-RateLimit-Remaining']).toBe('0');
    expect(blocked['Retry-After']).toBe('6');
  });

  it('luật gợi ý hợp lý (AI chặt nhất, api lỏng nhất)', () => {
    expect(SUGGESTED_RULES.ai.limit).toBeLessThan(SUGGESTED_RULES.notify.limit);
    expect(SUGGESTED_RULES.auth.limit).toBeLessThanOrEqual(5); // OTP chống brute force
    expect(SUGGESTED_RULES.api.limit).toBeGreaterThan(SUGGESTED_RULES.einvoice.limit);
  });

  it('cấu hình luật sai → ném lỗi NGAY khi tạo (không chờ tới lúc có request)', () => {
    expect(() => new RateLimiter({ rule: { limit: 0, windowMs: 1000 } })).toThrow();
    expect(() => new RateLimiter({ rule: { limit: 5, windowMs: 0 } })).toThrow();
    expect(() => new RateLimiter({ rule: RULE, rules: { x: { limit: -1, windowMs: 1 } } })).toThrow();
  });

  it('thời gian ĐI LÙI (clock skew) không làm xô âm hay sinh thêm token', () => {
    const c = fakeClock();
    const rl = new RateLimiter({ rule: RULE, now: c.now });
    rl.consume('u');
    const after = rl.peek('u').remaining;

    c.advance(-5000); // lùi 5 giây
    expect(rl.peek('u').remaining).toBe(after); // không đổi
    expect(rl.consume('u').allowed).toBe(true); // vẫn hoạt động bình thường
  });
});
