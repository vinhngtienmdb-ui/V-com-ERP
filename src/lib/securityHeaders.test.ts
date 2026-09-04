import { describe, it, expect } from 'vitest';
import {
  buildCsp,
  buildSecurityHeaders,
  securityHeadersMiddleware,
  originOf,
  DEFAULT_CONNECT_SRC,
} from './securityHeaders';

describe('GĐ 2.5 — originOf', () => {
  it('lấy origin từ URL đầy đủ', () => {
    expect(originOf('https://abc.supabase.co/rest/v1')).toBe('https://abc.supabase.co');
  });

  it('URL rác / rỗng → null (không ném)', () => {
    expect(originOf('')).toBeNull();
    expect(originOf(undefined)).toBeNull();
    expect(originOf('không-phải-url')).toBeNull();
  });
});

describe('GĐ 2.5 — buildCsp', () => {
  it('luôn chứa các chỉ thị nền tảng chống XSS/clickjacking', () => {
    const csp = buildCsp({});
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/object-src 'none'/);
    expect(csp).toMatch(/base-uri 'self'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(csp).toMatch(/form-action 'self'/);
  });

  it('chứa các host app THẬT SỰ gọi tới (sửa từ rà soát mã nguồn)', () => {
    const csp = buildCsp({});
    expect(csp).toMatch(/https:\/\/api\.misa\.vn/);
    expect(csp).toMatch(/https:\/\/api\.vietqr\.io/);
    expect(csp).toMatch(/https:\/\/provinces\.open-api\.vn/);
    expect(csp).toMatch(/https:\/\/\*\.supabase\.co/);
  });

  it('connect-src có websocket Supabase (realtime)', () => {
    const csp = buildCsp({});
    expect(csp).toMatch(/wss:\/\/\*\.supabase\.co/);
  });

  it('thêm đúng host Supabase của tenant từ env (cả https và ws)', () => {
    const csp = buildCsp({ supabaseUrl: 'https://wivioicznwyhmpbeqoib.supabase.co' });
    expect(csp).toMatch(/https:\/\/wivioicznwyhmpbeqoib\.supabase\.co/);
    expect(csp).toMatch(/wss:\/\/wivioicznwyhmpbeqoib\.supabase\.co/);
  });

  it('bỏ qua supabaseUrl rác', () => {
    const csp = buildCsp({ supabaseUrl: 'hổng phải url' });
    expect(csp).not.toMatch(/hổng/);
  });

  it('dev: có unsafe-eval + ws localhost (Vite HMR)', () => {
    const csp = buildCsp({ env: 'development' });
    expect(csp).toMatch(/'unsafe-eval'/);
    expect(csp).toMatch(/ws:\/\/localhost:\*/);
  });

  it('⭐ production: KHÔNG có unsafe-eval (siết chặt hơn)', () => {
    const csp = buildCsp({ env: 'production' });
    expect(csp).not.toMatch(/'unsafe-eval'/);
    expect(csp).not.toMatch(/ws:\/\/localhost/);
    // vẫn cần unsafe-inline vì React dùng inline style
    expect(csp).toMatch(/'unsafe-inline'/);
  });

  it('host bổ sung được nối vào connect-src / img-src', () => {
    const csp = buildCsp({ extraConnectSrc: ['https://api.doi-tac.vn'], extraImgSrc: ['https://cdn.doi-tac.vn'] });
    expect(csp).toMatch(/https:\/\/api\.doi-tac\.vn/);
    expect(csp).toMatch(/https:\/\/cdn\.doi-tac\.vn/);
  });

  it('img-src nới https: vì app lấy ảnh từ nhiều CDN', () => {
    const csp = buildCsp({});
    const img = /img-src ([^;]+)/.exec(csp)?.[1] ?? '';
    expect(img).toMatch(/https:/);
    expect(img).toMatch(/data:/);
  });

  it('report-uri được nối vào khi có', () => {
    const csp = buildCsp({ reportUri: '/api/csp-report' });
    expect(csp.endsWith('report-uri /api/csp-report')).toBe(true);
  });

  it('DEFAULT_CONNECT_SRC không bị rỗng (chốt an toàn)', () => {
    expect(DEFAULT_CONNECT_SRC.length).toBeGreaterThan(3);
  });
});

describe('GĐ 2.5 — buildSecurityHeaders', () => {
  it('các header an toàn được bật MẶC ĐỊNH', () => {
    const h = buildSecurityHeaders({});
    expect(h['X-Content-Type-Options']).toBe('nosniff');
    expect(h['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(h['X-XSS-Protection']).toBe('0');
    expect(h['X-Frame-Options']).toBe('DENY');
    expect(h['Permissions-Policy']).toMatch(/geolocation=\(\)/);
  });

  it('⭐ MẶC ĐỊNH là REPORT-ONLY — không thể tự gãy production', () => {
    const h = buildSecurityHeaders({});
    expect(h['Content-Security-Policy-Report-Only']).toBeDefined();
    expect(h['Content-Security-Policy']).toBeUndefined();
  });

  it('CSP_MODE=enforce → gắn header chặn thật', () => {
    const h = buildSecurityHeaders({ cspMode: 'enforce' });
    expect(h['Content-Security-Policy']).toBeDefined();
    expect(h['Content-Security-Policy-Report-Only']).toBeUndefined();
  });

  it('cspMode=off → không gắn header CSP nào', () => {
    const h = buildSecurityHeaders({ cspMode: 'off' });
    expect(h['Content-Security-Policy']).toBeUndefined();
    expect(h['Content-Security-Policy-Report-Only']).toBeUndefined();
  });

  it('⭐ HSTS chỉ gắn khi request qua HTTPS (tránh khoá site HTTP 6 tháng)', () => {
    expect(buildSecurityHeaders({ isSecure: false })['Strict-Transport-Security']).toBeUndefined();
    expect(buildSecurityHeaders({ isSecure: true })['Strict-Transport-Security']).toMatch(/max-age=15552000/);
    // ép bằng tường minh vẫn được
    expect(buildSecurityHeaders({ isSecure: false, hsts: true })['Strict-Transport-Security']).toBeDefined();
    // tắt hẳn
    expect(buildSecurityHeaders({ isSecure: true, hsts: false })['Strict-Transport-Security']).toBeUndefined();
  });

  it('⚠️ COOP/COEP KHÔNG bật mặc định (sẽ gãy popup OAuth + ảnh cross-origin)', () => {
    const h = buildSecurityHeaders({});
    expect(h['Cross-Origin-Opener-Policy']).toBeUndefined();
    expect(h['Cross-Origin-Embedder-Policy']).toBeUndefined();
  });

  it('COOP/COEP chỉ bật khi yêu cầu tường minh', () => {
    const h = buildSecurityHeaders({ crossOriginIsolation: true });
    expect(h['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(h['Cross-Origin-Embedder-Policy']).toBe('require-corp');
  });

  it('frameOptions có thể đổi SAMEORIGIN hoặc tắt', () => {
    expect(buildSecurityHeaders({ frameOptions: 'SAMEORIGIN' })['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(buildSecurityHeaders({ frameOptions: false })['X-Frame-Options']).toBeUndefined();
  });
});

describe('GĐ 2.5 — middleware Express', () => {
  function fakeRes() {
    const store: Record<string, string> = {};
    return {
      store,
      getHeader: (n: string) => store[n.toLowerCase()],
      setHeader: (n: string, v: string) => {
        store[n.toLowerCase()] = v;
      },
    };
  }

  it('gắn header và gọi next()', () => {
    const res = fakeRes();
    let called = false;
    securityHeadersMiddleware({ supabaseUrl: 'https://x.supabase.co' })(
      { headers: {}, secure: false },
      res,
      () => {
        called = true;
      }
    );
    expect(called).toBe(true);
    expect(res.store['x-content-type-options']).toBe('nosniff');
    expect(res.store['content-security-policy-report-only']).toMatch(/x\.supabase\.co/);
  });

  it('nhận diện HTTPS qua X-Forwarded-Proto (đứng sau proxy)', () => {
    const res = fakeRes();
    securityHeadersMiddleware()(
      { headers: { 'x-forwarded-proto': 'https, http' }, secure: false },
      res,
      () => {}
    );
    expect(res.store['strict-transport-security']).toBeDefined();
  });

  it('không ghi đè header đã có (tôn trọng proxy/Vite)', () => {
    const res = fakeRes();
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    securityHeadersMiddleware()({ headers: {}, secure: false }, res, () => {});
    expect(res.store['x-frame-options']).toBe('SAMEORIGIN');
  });
});
