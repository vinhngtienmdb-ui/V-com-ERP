/**
 * ============================================================================
 *  securityHeaders.ts — GĐ 2.5: Security headers (thay Helmet, không thêm dep)
 * ============================================================================
 *
 *  spec 022 GĐ2.5 yêu cầu Helmet (CSP, HSTS, X-Frame-Options, CORS chặt) kèm
 *  lưu ý: **"Rà soát CSP vì hiện dùng `@google/genai` và AWS S3 từ client"**.
 *
 *  Lưu ý đó là CHÍNH XÁC và còn nhẹ — thực tế app gọi tới rất nhiều host:
 *    api.misa.vn · api.vietqr.io · img.vietqr.io · provinces.open-api.vn ·
 *    app.chatwoot.com · www.youtube.com · i.pravatar.cc · picsum.photos ·
 *    images.unsplash.com · ui-avatars.com · *.supabase.co · www.googleapis.com
 *  Một CSP gõ tay thiếu host nào thì tính năng đó CHẾT NGAY LẬP TỨC.
 *
 *  ⭐ VÌ VẬY MẶC ĐỊNH LÀ **REPORT-ONLY**:
 *    Gắn header `Content-Security-Policy-Report-Only` → trình duyệt CHỈ ghi log
 *    vi phạm, KHÔNG chặn. Triển khai an toàn 100%, không thể tự gãy production.
 *    Quy trình: để report-only → mở Console đọc cảnh báo → bổ sung host còn
 *    thiếu → khi sạch mới chuyển `CSP_MODE=enforce`.
 *
 *  Các header KHÔNG gây rủi ro (nosniff, X-Frame-Options, Referrer-Policy,
 *  Permissions-Policy) được bật NGAY ở mọi môi trường.
 *
 *  🔴 HAI CÁI CỐ TÌNH KHÔNG BẬT MẶC ĐỊNH (hay làm gãy OAuth/embed):
 *    · `Cross-Origin-Opener-Policy: same-origin` → gãy popup OAuth
 *      (Google Calendar trong `googleCalendar.ts`) và chat widget.
 *    · `Cross-Origin-Embedder-Policy: require-corp` → gãy mọi tài nguyên
 *      cross-origin không có CORP header (ảnh S3/CDN).
 *    Bật bằng tùy chọn `crossOriginIsolation: true` khi đã kiểm chứng.
 * ============================================================================
 */

export type CspMode = 'off' | 'report' | 'enforce';

export interface SecurityHeadersOptions {
  env?: 'development' | 'production' | string;
  /** URL Supabase để đưa đúng host vào connect-src (VD https://abc.supabase.co). */
  supabaseUrl?: string;
  /** Chế độ CSP. Mặc định: 'report' (an toàn, không chặn). */
  cspMode?: CspMode;
  /** Nơi nhận báo cáo vi phạm CSP (endpoint hoặc URI). */
  reportUri?: string | null;
  /**
   * HSTS. 'auto' = chỉ gắn khi request đi qua HTTPS (tránh khoá nhầm site HTTP).
   * Mặc định 'auto'.
   */
  hsts?: boolean | 'auto';
  /** false = không gắn header này. */
  frameOptions?: 'DENY' | 'SAMEORIGIN' | false;
  /** Bật COOP + COEP (cô lập cross-origin). Xem cảnh báo đầu file. */
  crossOriginIsolation?: boolean;
  /** Host bổ sung cho connect-src (API đối tác…). */
  extraConnectSrc?: string[];
  /** Host bổ sung cho img-src. */
  extraImgSrc?: string[];
  /** true khi request hiện tại đi qua HTTPS (dùng cho hsts: 'auto'). */
  isSecure?: boolean;
}

/** Các host `connect-src` mặc định — lấy từ rà soát mã nguồn thực tế. */
export const DEFAULT_CONNECT_SRC = [
  "'self'",
  'https://*.supabase.co',
  'wss://*.supabase.co',
  'https://api.misa.vn',
  'https://api.vietqr.io',
  'https://provinces.open-api.vn',
  'https://www.googleapis.com',
  'https://app.chatwoot.com',
];

/** `img-src` nới rộng: app lấy ảnh từ rất nhiều CDN (pravatar/picsum/unsplash…). */
export const DEFAULT_IMG_SRC = ["'self'", 'data:', 'blob:', 'https:'];

export const DEFAULT_FRAME_SRC = ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://app.chatwoot.com'];

/** Lấy host gốc (origin) từ một URL bất kỳ; trả null nếu không parse được. */
export function originOf(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function directivesToHeader(map: Record<string, string[]>): string {
  return Object.entries(map)
    .filter(([, values]) => values.length > 0)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Dựng chính sách CSP. Tách thành hàm thuần để test được mà không cần HTTP.
 */
export function buildCsp(opts: SecurityHeadersOptions = {}): string {
  const isDev = (opts.env ?? 'development') !== 'production';

  // Dev cần 'unsafe-eval' (Vite HMR / source-map). Production bỏ đi để siết.
  const scriptSrc = isDev
    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://app.chatwoot.com', 'https://www.youtube.com']
    : ["'self'", "'unsafe-inline'", 'https://app.chatwoot.com', 'https://www.youtube.com'];

  const connectSrc = [...DEFAULT_CONNECT_SRC, ...(opts.extraConnectSrc ?? [])];
  const supabaseOrigin = originOf(opts.supabaseUrl);
  if (supabaseOrigin) {
    connectSrc.push(supabaseOrigin);
    connectSrc.push(supabaseOrigin.replace(/^http/, 'ws'));
  }
  if (isDev) {
    // Vite dev server: HMR websocket + fetch module
    connectSrc.push('ws://localhost:*', 'http://localhost:*', 'ws://127.0.0.1:*', 'http://127.0.0.1:*');
  }

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    // React + hầu hết UI kit đều dùng inline style → bắt buộc 'unsafe-inline'
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'img-src': [...DEFAULT_IMG_SRC, ...(opts.extraImgSrc ?? [])],
    'connect-src': connectSrc,
    'media-src': ["'self'", 'blob:', 'data:'],
    'frame-src': DEFAULT_FRAME_SRC,
    // Chống clickjacking: không ai được nhúng app vào frame của họ
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
  };

  const policy = directivesToHeader(directives);
  const reportUri = opts.reportUri ?? null;

  return reportUri ? `${policy}; report-uri ${reportUri}` : policy;
}

/**
 * Dựng BỘ HEADER đầy đủ. Hàm thuần — test được không cần Express.
 */
export function buildSecurityHeaders(opts: SecurityHeadersOptions = {}): Record<string, string> {
  const headers: Record<string, string> = {};

  // --- Luôn bật, không có tác dụng phụ ---
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
  // Giá trị 0 = TẮT bộ lọc XSS cũ của trình duyệt (chính nó từng có lỗ hổng).
  headers['X-XSS-Protection'] = '0';
  headers['Permissions-Policy'] = [
    'geolocation=()',
    'camera=()',
    'microphone=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
  ].join(', ');

  if (opts.frameOptions !== false) {
    headers['X-Frame-Options'] = opts.frameOptions ?? 'DENY';
  }

  // --- Có điều kiện ---
  const secure = opts.isSecure === true;
  const hsts = opts.hsts ?? 'auto';
  if (hsts === true || (hsts === 'auto' && secure)) {
    // 180 ngày. ⚠️ Chỉ gắn khi request thật sự qua HTTPS: gắn HSTS lên một site
    // đang chạy HTTP sẽ KHOÁ người dùng ngoài HTTP suốt 6 tháng.
    headers['Strict-Transport-Security'] = 'max-age=15552000; includeSubDomains';
  }

  if (opts.crossOriginIsolation) {
    headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
  }

  // --- CSP ---
  const mode = opts.cspMode ?? 'report';
  if (mode !== 'off') {
    headers[mode === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only'] =
      buildCsp(opts);
  }

  return headers;
}

/**
 * Middleware Express. Đặt TRƯỚC mọi route: `app.use(securityHeadersMiddleware(...))`.
 */
export function securityHeadersMiddleware(options: SecurityHeadersOptions = {}) {
  return function securityHeaders(req: any, res: any, next: () => void): void {
    const isSecure =
      req.secure === true ||
      String(req.headers?.['x-forwarded-proto'] ?? '').split(',')[0].trim() === 'https';

    const headers = buildSecurityHeaders({
      ...options,
      isSecure: options.isSecure ?? isSecure,
    });

    for (const [name, value] of Object.entries(headers)) {
      // Không ghi đè header đã được thiết lập ở nơi khác (VD proxy, Vite).
      if (!res.getHeader(name)) res.setHeader(name, value);
    }
    next();
  };
}
