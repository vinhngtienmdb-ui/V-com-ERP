/**
 * Structured logger — GĐ 1.3 (spec 022)
 * ======================================
 *
 * VẤN ĐỀ: dự án có ~258 lệnh `console.*` rải rác, không level, không ngữ cảnh,
 * và (tệ hơn) có chỗ log nguyên header/body request — lộ secret và PII.
 * Khi có sự cố production, cách duy nhất để biết là chờ người dùng phàn nàn.
 *
 * THIẾT KẾ (và lý do từng lựa chọn):
 *
 * 1. **KHÔNG dùng pino** dù spec gợi ý. Lý do: `src/services/**` chạy trong
 *    TRÌNH DUYỆT (Vite SPA), còn pino là logger cho Node — bản browser
 *    (`pino/browser`) là một entry khác, không có transport, không đồng nhất
 *    với bản server. Dùng pino đồng nghĩa ship 2 cây logging và tăng bundle.
 *    `server.ts` cũng dùng CHUNG logger này (esbuild bundle → CJS), nên chỉ
 *    cần 1 implementation, 0 dependency. Nếu sau này muốn đẩy log về
 *    Datadog/Loki, cắm thêm sink qua `addLogSink()` — không sửa call site.
 *
 * 2. **Không đụng `import.meta.env` trong file này.** `import.meta` không tồn
 *    tại khi esbuild bundle `server.ts` sang CJS (esbuild sẽ cảnh báo và thay
 *    bằng `{}`). Vì vậy level đọc từ `process.env` (server) và được cấu hình
 *    tường minh bằng `setLogLevel()` ở `App.tsx` (browser, nơi đọc được
 *    `import.meta.env`). Logger thuần túy → test được.
 *
 * 3. **Redaction mặc định.** Bất kỳ key nào trông giống bí mật
 *    (token/password/secret/authorization/api_key/cookie/signature) đều bị
 *    thay bằng `***` TRƯỚC khi tới sink. Lý do: chính đoạn code cũ đã từng
 *    log nguyên header chứa API key của SePay. Chặn ở tầng logger thì an toàn
 *    hơn là trông chờ từng call site nhớ không log.
 *
 * 4. **Sink console format:** dev → một dòng dễ đọc; còn lại → JSON 1 dòng để
 *    grep/ship được. Error được serialize riêng vì `JSON.stringify(new Error())`
 *    trả `{}` — mất sạch thông tin.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** Trường bị che khi đưa vào log. So khớp KHÔNG phân biệt hoa thường. */
export const REDACTED_KEY_PATTERN =
  /(token|password|passwd|secret|authorization|api[-_]?key|cookie|signature|otp|pin\b|private[-_]?key)/i;

export const REDACTED_VALUE = '***';

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
}

export interface LogEntry {
  /** ISO 8601, lấy từ `deps.now()` để test kiểm soát được thời gian. */
  ts: string;
  level: LogLevel;
  /** Module phát log, ví dụ `services/taxService`. */
  module: string;
  msg: string;
  ctx?: Record<string, unknown>;
  err?: SerializedError;
}

export interface LoggerDeps {
  now: () => Date;
  sinks: LogSink[];
  /** Ngữ cảnh gắn vào mọi entry của logger này (tenantId, requestId...). */
  base: Record<string, unknown>;
  /** Chỉ log khi `LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[minLevel]`. */
  minLevel: LogLevel;
}

export interface LogSink {
  write(entry: LogEntry): void;
}

// ---------------------------------------------------------------------------
// Helpers (export để test)
// ---------------------------------------------------------------------------

/**
 * Serialize Error thành object thuần.
 * Lý do: `JSON.stringify(err)` trả `{}` vì các thuộc tính của Error là
 * non-enumerable → log ra màn hình chỉ còn `{}`, vô dụng khi điều tra sự cố.
 * Nhận cả giá trị không phải Error (string, object lạ từ thư viện) để call
 * site không cần tự kiểm tra.
 */
export function serializeError(input: unknown): SerializedError {
  if (input instanceof Error) {
    return { name: input.name, message: input.message, stack: input.stack };
  }
  if (typeof input === 'string') return { name: 'Error', message: input };
  if (input && typeof input === 'object') {
    const anyInput = input as { name?: unknown; message?: unknown; stack?: unknown };
    return {
      name: typeof anyInput.name === 'string' ? anyInput.name : 'Error',
      message:
        typeof anyInput.message === 'string' ? anyInput.message : safeStringify(input),
      stack: typeof anyInput.stack === 'string' ? anyInput.stack : undefined,
    };
  }
  return { name: 'Error', message: String(input) };
}

/** `JSON.stringify` không ném khi gặp circular reference hoặc BigInt. */
export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)) ?? String(value);
  } catch {
    return String(value);
  }
}

/** Đệ quy thay giá trị của các key nhạy cảm bằng `***`. Trả object MỚI. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[deep]';
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACTED_KEY_PATTERN.test(k) ? REDACTED_VALUE : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------------

const globalSinks: LogSink[] = [];
let globalMinLevel: LogLevel = defaultMinLevel();

function defaultMinLevel(): LogLevel {
  // `process` chỉ tồn tại ở Node/Vitest; trình duyệt KHÔNG có.
  // Mặc định là `info` (không phải `debug`) vì: dbService nằm trên đường đi
  // nóng của mọi màn hình, các lỗi cache-parse ở đó chuyển thành log `debug`;
  // nếu mặc định `debug` thì console trình duyệt sẽ bị ngập.
  // Muốn xem debug: cấu hình `VITE_LOG_LEVEL=debug` (App.tsx gọi setLogLevel).
  try {
    if (typeof process !== 'undefined' && process.env) {
      const fromEnv = process.env.LOG_LEVEL;
      if (fromEnv && fromEnv.toLowerCase() in LOG_LEVEL_ORDER) {
        return fromEnv.toLowerCase() as LogLevel;
      }
      if (process.env.NODE_ENV === 'development') return 'debug';
    }
  } catch {
    /* môi trường không có process — giữ mặc định */
  }
  return 'info';
}

/** Sink mặc định: ghi ra console tương ứng với level. */
export const consoleSink: LogSink = {
  write(entry: LogEntry): void {
    const head = `[${entry.ts}] ${entry.level.toUpperCase()} [${entry.module}] ${entry.msg}`;
    // eslint-disable-next-line no-console
    const write = entry.level === 'error' ? console.error : entry.level === 'warn' ? console.warn : console.log;
    if (entry.ctx || entry.err) {
      write(head, { ...(entry.ctx ?? {}), ...(entry.err ? { err: entry.err } : {}) });
    } else {
      write(head);
    }
  },
};

/** Sink JSON 1 dòng — dùng khi log được gom bằng công cụ (server/CDN edge). */
export const jsonConsoleSink: LogSink = {
  write(entry: LogEntry): void {
    const line = safeStringify(entry);
    // eslint-disable-next-line no-console
    if (entry.level === 'error') console.error(line);
    // eslint-disable-next-line no-console
    else if (entry.level === 'warn') console.warn(line);
    // eslint-disable-next-line no-console
    else console.log(line);
  },
};

/** Thêm sink cho TẤT CẢ logger (dùng để đẩy log về server). Trả hàm gỡ. */
export function addLogSink(sink: LogSink): () => void {
  globalSinks.push(sink);
  return () => {
    const i = globalSinks.indexOf(sink);
    if (i >= 0) globalSinks.splice(i, 1);
  };
}

export function setLogSinks(sinks: LogSink[]): void {
  globalSinks.length = 0;
  globalSinks.push(...sinks);
}

export function setLogLevel(level: LogLevel | string | undefined | null): void {
  if (!level) return;
  const key = String(level).toLowerCase() as LogLevel;
  if (key in LOG_LEVEL_ORDER) globalMinLevel = key;
}

export function getLogLevel(): LogLevel {
  return globalMinLevel;
}

/** Reset về mặc định — chỉ dùng trong test. */
export function __resetLoggerForTest(): void {
  globalSinks.length = 0;
  globalSinks.push(consoleSink);
  globalMinLevel = defaultMinLevel();
}

if (globalSinks.length === 0) globalSinks.push(consoleSink);

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

export class Logger {
  private readonly deps: LoggerDeps;

  constructor(public readonly module: string, deps?: Partial<LoggerDeps>) {
    this.deps = {
      now: deps?.now ?? (() => new Date()),
      sinks: deps?.sinks ?? globalSinks,
      base: { ...(deps?.base ?? {}) },
      minLevel: deps?.minLevel ?? globalMinLevel,
    };
  }

  /** Tạo logger con thừa hưởng module + ngữ cảnh, thêm/b đè field. */
  child(extra: Record<string, unknown>): Logger {
    return new Logger(this.module, {
      now: this.deps.now,
      sinks: this.deps.sinks,
      base: { ...this.deps.base, ...extra },
      minLevel: this.deps.minLevel,
    });
  }

  withModule(module: string): Logger {
    return new Logger(module, {
      now: this.deps.now,
      sinks: this.deps.sinks,
      base: { ...this.deps.base },
      minLevel: this.deps.minLevel,
    });
  }

  debug(msg: string, ctx?: Record<string, unknown> | unknown, ...rest: unknown[]): void {
    this.write('debug', msg, ctx);
  }
  info(msg: string, ctx?: Record<string, unknown> | unknown, ...rest: unknown[]): void {
    this.write('info', msg, ctx);
  }
  warn(msg: string, ctx?: Record<string, unknown> | unknown, ...rest: unknown[]): void {
    this.write('warn', msg, ctx);
  }
  error(msg: string, ctx?: Record<string, unknown> | unknown, err?: unknown): void {
    this.write('error', msg, ctx, err);
  }

  /**
   * API kiểu console: `emitVariadic('error', 'thông điệp', [err, {a:1}])`.
   *
   * Quy tắc gom tham số phụ — cố ý đơn giản vì đây là lớp tương thích:
   *   · `Error` đầu tiên → `entry.err`
   *   · object thường    → GỘP vào `entry.ctx` (đã redact)
   *   · còn lại          → `entry.ctx.meta0`, `meta1`, ... theo thứ tự
   *
   * `msg` KHÔNG phải chuỗi (ví dụ gọi `logger.error(e)`) → lấy `message` của
   * nó làm thông điệp và đưa luôn vào `err`.
   */
  emitVariadic(level: LogLevel, msg: unknown, meta: unknown[] = []): void {
    let text: string;
    let err: unknown;

    if (typeof msg === 'string') {
      text = msg;
    } else {
      const serialized = serializeError(msg);
      text = serialized.message || safeStringify(msg);
      err = msg;
    }

    const ctx: Record<string, unknown> = {};
    let slot = 0;
    for (const item of meta) {
      if (item instanceof Error) {
        if (err === undefined) err = item;
        else ctx[`meta${slot++}`] = serializeError(item);
      } else if (item && typeof item === 'object') {
        // Gộp object — NHƯNG đã qua redact, vì đây chính là chỗ từng làm lộ
        // accessToken khi code cũ log nguyên config ZNS/cache.
        Object.assign(ctx, redact(item) as Record<string, unknown>);
      } else if (item !== undefined && item !== null) {
        ctx[`meta${slot++}`] = item;
      }
    }

    this.write(level, text, Object.keys(ctx).length ? ctx : undefined, err);
  }

  private write(level: LogLevel, msg: string, ctx?: unknown, err?: unknown): void {
    if (LOG_LEVEL_ORDER[level] < LOG_LEVEL_ORDER[this.deps.minLevel]) return;

    // Chấp nhận `logger.error('...', err)` — tự tách Error ra khỏi ctx.
    let realCtx: Record<string, unknown> | undefined;
    let realErr: unknown = err;
    if (ctx instanceof Error) {
      realErr = ctx;
    } else if (ctx && typeof ctx === 'object') {
      realCtx = ctx as Record<string, unknown>;
    } else if (ctx !== undefined && ctx !== null) {
      realCtx = { detail: ctx };
    }

    const entry: LogEntry = {
      ts: this.deps.now().toISOString(),
      level,
      module: this.module,
      msg,
    };
    if (this.deps.base && Object.keys(this.deps.base).length) {
      entry.ctx = redact(this.deps.base) as Record<string, unknown>;
    }
    if (realCtx && Object.keys(realCtx).length) {
      entry.ctx = { ...(entry.ctx ?? {}), ...(redact(realCtx) as Record<string, unknown>) };
    }
    if (realErr !== undefined && realErr !== null) entry.err = serializeError(realErr);

    for (const sink of this.deps.sinks) {
      try {
        sink.write(entry);
      } catch {
        // Sink hỏng KHÔNG được làm sập nghiệp vụ. Đây là chủ đích:
        // mất log còn hơn mất giao dịch.
      }
    }
  }
}

/** Lấy logger theo module. Nên gọi 1 lần ở đầu file rồi export. */
export function createLogger(module: string, base?: Record<string, unknown>): Logger {
  return new Logger(module, base ? { base } : undefined);
}

/** Logger dự phòng cho code chưa chuyển sang module cụ thể. */
export const rootLogger = createLogger('app');

// ---------------------------------------------------------------------------
// API kiểu console (tương thích ngược)
// ---------------------------------------------------------------------------

/**
 * Chữ ký của `logger.*` ở API cũ: giống `console.*` — nhận thông điệp rồi
 * bao nhiêu tham số phụ cũng được (Error, object, chuỗi...).
 *
 * LÝ DO CẦN GIỮ: `server.ts` có ~130 chỗ gọi theo kiểu này, ví dụ
 * `logger.error('[SePay Webhook] Database operation failed:', dbErr)` hay
 * `logger.info('[ZNS-Cron] ...')`. Bắt chúng đổi sang dạng cấu trúc ngay bây
 * giờ là một đợt sửa cơ học rất lớn, đổi rủi ro lấy... không thêm tính năng.
 * Nên giữ nguyên call site, đổi phần BÊN DƯỚI: vẫn có level, vẫn redact.
 */
export type LegacyLogger = Record<
  'debug' | 'info' | 'warn' | 'error',
  (msg: unknown, ...meta: unknown[]) => void
>;

/**
 * Singleton `logger` — API cũ, nhưng đi qua cùng đường ống với API mới:
 * lọc theo level, redact bí mật, serialize Error.
 */
export const logger: LegacyLogger = {
  debug: (msg, ...meta) => rootLogger.emitVariadic('debug', msg, meta),
  info: (msg, ...meta) => rootLogger.emitVariadic('info', msg, meta),
  warn: (msg, ...meta) => rootLogger.emitVariadic('warn', msg, meta),
  error: (msg, ...meta) => rootLogger.emitVariadic('error', msg, meta),
};
