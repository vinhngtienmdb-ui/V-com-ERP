import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  Logger,
  createLogger,
  addLogSink,
  setLogSinks,
  setLogLevel,
  getLogLevel,
  redact,
  serializeError,
  safeStringify,
  consoleSink,
  jsonConsoleSink,
  __resetLoggerForTest,
  logger,
  LOG_LEVEL_ORDER,
  REDACTED_VALUE,
  type LogEntry,
} from './logger';

/** Sink thu thập entry vào mảng để assert. */
function collectSink() {
  const entries: LogEntry[] = [];
  const sink = { write: (e: LogEntry) => void entries.push(e) };
  return { entries, sink };
}

describe('lib/logger (GĐ 1.3 structured logging)', () => {
  beforeEach(() => {
    __resetLoggerForTest();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------- level ---

  it('LỌC theo level: debug không phát khi minLevel=info', () => {
    const { entries, sink } = collectSink();
    const log = new Logger('m', { sinks: [sink], minLevel: 'info', now: () => new Date(0) });

    log.debug('bị lọc');
    log.info('đi qua');
    log.warn('đi qua');
    log.error('đi qua');

    expect(entries.map((e) => e.level)).toEqual(['info', 'warn', 'error']);
  });

  it('minLevel=debug thì debug VẪN phát', () => {
    const { entries, sink } = collectSink();
    const log = new Logger('m', { sinks: [sink], now: () => new Date(0), minLevel: 'debug' });
    log.debug('thấy được');
    expect(entries).toHaveLength(1);
  });

  it('mặc định toàn cục là info — debug KHÔNG phát (tránh ngập console browser)', () => {
    // dbService nằm trên đường đi nóng của mọi màn hình; nếu mặc định debug
    // thì console trình duyệt sẽ ngập log cache-parse.
    expect(getLogLevel()).toBe('info');
    setLogLevel('debug');
    expect(getLogLevel()).toBe('debug');
    setLogLevel('info');
  });

  it('thứ tự level đúng để so sánh', () => {
    expect(LOG_LEVEL_ORDER.debug).toBeLessThan(LOG_LEVEL_ORDER.info);
    expect(LOG_LEVEL_ORDER.info).toBeLessThan(LOG_LEVEL_ORDER.warn);
    expect(LOG_LEVEL_ORDER.warn).toBeLessThan(LOG_LEVEL_ORDER.error);
  });

  it('setLogLevel áp dụng TOÀN CỤC cho logger tạo sau', () => {
    setLogLevel('debug');
    setLogLevel('error');
    expect(getLogLevel()).toBe('error');
    const { entries, sink } = collectSink();
    setLogSinks([sink]);
    const log = createLogger('m');
    log.warn('bị lọc');
    log.error('giữ lại');
    expect(entries).toHaveLength(1);
    setLogLevel('debug');
  });

  it('setLogLevel BỎ QUA giá trị rác (không làm hỏng logger)', () => {
    setLogLevel('error');
    setLogLevel('garbage' as never);
    expect(getLogLevel()).toBe('error');
    setLogLevel(undefined);
    expect(getLogLevel()).toBe('error');
    setLogLevel('debug');
  });

  // ------------------------------------------------------------- ngữ cảnh ---

  it('base context được GẮN vào mọi entry', () => {
    const { entries, sink } = collectSink();
    const log = new Logger('svc/tax', {
      sinks: [sink],
      now: () => new Date(0),
      base: { tenantId: 't1', module: 'tax' },
    });
    log.info('x');
    expect(entries[0].ctx).toMatchObject({ tenantId: 't1' });
    expect(entries[0].module).toBe('svc/tax');
  });

  it('child() thừa hưởng base và BỔ SUNG field (không mất base cũ)', () => {
    const { entries, sink } = collectSink();
    const parent = new Logger('m', {
      sinks: [sink],
      now: () => new Date(0),
      base: { tenantId: 't1' },
    });
    parent.child({ requestId: 'r9' }).info('x');
    expect(entries[0].ctx).toMatchObject({ tenantId: 't1', requestId: 'r9' });
  });

  it('ctx tại call site ĐÈ field cùng tên trong base', () => {
    const { entries, sink } = collectSink();
    const log = new Logger('m', {
      sinks: [sink],
      now: () => new Date(0),
      base: { tenantId: 'base' },
    });
    log.info('x', { tenantId: 'override' });
    expect(entries[0].ctx?.tenantId).toBe('override');
  });

  // ------------------------------------------------------------- redaction ---

  it('CHE các key nhạy cảm (token/password/secret/authorization/api_key)', () => {
    const { entries, sink } = collectSink();
    const log = new Logger('m', { sinks: [sink], now: () => new Date(0) });
    log.info('gọi API', {
      authorization: 'Bearer abc',
      apiKey: 'k-1',
      api_key: 'k-2',
      password: 'p',
      secret: 's',
      accessToken: 'at',
      cookie: 'c',
      signature: 'sig',
      // key bình thường phải GIỮ NGUYÊN
      orderId: 'ORD-1',
    });
    const ctx = entries[0].ctx as Record<string, unknown>;
    expect(ctx.authorization).toBe(REDACTED_VALUE);
    expect(ctx.apiKey).toBe(REDACTED_VALUE);
    expect(ctx.api_key).toBe(REDACTED_VALUE);
    expect(ctx.password).toBe(REDACTED_VALUE);
    expect(ctx.secret).toBe(REDACTED_VALUE);
    expect(ctx.accessToken).toBe(REDACTED_VALUE); // khớp token, không phân biệt hoa thường
    expect(ctx.cookie).toBe(REDACTED_VALUE);
    expect(ctx.signature).toBe(REDACTED_VALUE);
    expect(ctx.orderId).toBe('ORD-1');
  });

  it('redact đệ quy CẢ object LỒNG NHAU (lỗi từng làm lộ header)', () => {
    const out = redact({ headers: { Authorization: 'Bearer x', 'X-Trace': 'keep' } });
    expect(out).toEqual({ headers: { Authorization: REDACTED_VALUE, 'X-Trace': 'keep' } });
  });

  it('redact xử lý MẢNG', () => {
    const out = redact([{ token: 'a' }, { n: 1 }]);
    expect(out).toEqual([{ token: REDACTED_VALUE }, { n: 1 }]);
  });

  it('redact CHỐNG tràn ngăn xếp với object sâu (depth > 6 trả [deep])', () => {
    let deep: Record<string, unknown> = { leaf: 1 };
    for (let i = 0; i < 20; i++) deep = { nested: deep };
    expect(safeStringify(redact(deep))).toContain('[deep]');
  });

  it('redact KHÔNG sửa object gốc', () => {
    const src = { token: 'raw' };
    redact(src);
    expect(src.token).toBe('raw');
  });

  // ------------------------------------------------------------ error --------

  it('serializeError GIỮ name/message/stack (JSON.stringify(err) thì mất)', () => {
    const err = new TypeError('sai kiểu');
    const out = serializeError(err);
    expect(out.name).toBe('TypeError');
    expect(out.message).toBe('sai kiểu');
    expect(out.stack).toBeTruthy();
    // Chứng minh lý do phải serialize riêng:
    expect(JSON.stringify(err)).toBe('{}');
  });

  it('serializeError nhận cả string / object lạ / null', () => {
    expect(serializeError('chuỗi lỗi')).toMatchObject({ name: 'Error', message: 'chuỗi lỗi' });
    expect(serializeError({ message: 'obj' })).toMatchObject({ message: 'obj' });
    expect(serializeError({ name: 'CustomErr', message: 'm' })).toMatchObject({ name: 'CustomErr' });
    expect(serializeError(null).message).toBe('null');
  });

  it('logger.error(msg, err) TỰ TÁCH Error ra khỏi ctx', () => {
    const { entries, sink } = collectSink();
    const log = new Logger('m', { sinks: [sink], now: () => new Date(0) });
    log.error('ghi sổ lỗi', new Error('boom'));
    expect(entries[0].err?.message).toBe('boom');
    expect(entries[0].ctx).toBeUndefined();
  });

  it('logger.error(msg, ctx, err) giữ CẢ HAI', () => {
    const { entries, sink } = collectSink();
    const log = new Logger('m', { sinks: [sink], now: () => new Date(0) });
    log.error('ghi sổ lỗi', { orderId: 'ORD-1' }, new Error('boom'));
    expect(entries[0].ctx?.orderId).toBe('ORD-1');
    expect(entries[0].err?.message).toBe('boom');
  });

  it('giá trị nguyên thủy truyền vào ctx được gom thành { detail }', () => {
    const { entries, sink } = collectSink();
    const log = new Logger('m', { sinks: [sink], now: () => new Date(0) });
    log.info('x', 'chuỗi');
    expect(entries[0].ctx).toEqual({ detail: 'chuỗi' });
  });

  // ------------------------------------------------------------- sink --------

  it('addLogSink gắn TOÀN CỤC và có thể gỡ bằng hàm trả về', () => {
    const { entries, sink } = collectSink();
    setLogSinks([consoleSink]);
    const remove = addLogSink(sink);
    createLogger('m').info('thấy');
    expect(entries).toHaveLength(1);
    remove();
    createLogger('m').info('không thấy');
    expect(entries).toHaveLength(1);
  });

  it('SINK HỎNG KHÔNG làm sập nghiệp vụ — log phải là phụ trợ', () => {
    const boom = { write: () => { throw new Error('sink chết'); } };
    const { entries, sink } = collectSink();
    const log = new Logger('m', { sinks: [boom, sink], now: () => new Date(0) });
    expect(() => log.info('vẫn sống')).not.toThrow();
    expect(entries).toHaveLength(1);
  });

  it('ts lấy từ deps.now() để test kiểm soát được thời gian', () => {
    const { entries, sink } = collectSink();
    const fixed = new Date('2026-09-03T10:00:00.000Z');
    const log = new Logger('m', { sinks: [sink], now: () => fixed });
    log.info('x');
    expect(entries[0].ts).toBe(fixed.toISOString());
  });

  // ----------------------------------------------------------- sinks console --

  it('consoleSink ghi đúng kênh theo level (error→console.error)', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const log = new Logger('svc/x', { sinks: [consoleSink], now: () => new Date(0) });

    log.error('E');
    log.warn('W');
    log.info('I');

    expect(errSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
    expect(errSpy.mock.calls[0][0]).toContain('ERROR [svc/x] E');
  });

  it('jsonConsoleSink xuất JSON 1 dòng (gom log bằng công cụ được)', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const log = new Logger('m', { sinks: [jsonConsoleSink], now: () => new Date(0) });
    log.info('x', { a: 1 });
    const line = logSpy.mock.calls[0][0] as string;
    expect(() => JSON.parse(line)).not.toThrow();
    expect(JSON.parse(line).msg).toBe('x');
  });

  it('withModule() đổi module nhưng GIỮ base context', () => {
    const { entries, sink } = collectSink();
    const a = new Logger('svc/a', { sinks: [sink], now: () => new Date(0), base: { tenantId: 't1' } });
    a.withModule('svc/b').info('x');
    expect(entries[0].module).toBe('svc/b');
    expect(entries[0].ctx?.tenantId).toBe('t1');
  });

  // ---------------------------------------------------------- safeStringify --

  it('safeStringify KHÔNG ném với circular reference', () => {
    const a: Record<string, unknown> = { x: 1 };
    a.self = a;
    expect(() => safeStringify(a)).not.toThrow();
  });

  it('safeStringify xử lý BigInt', () => {
    expect(safeStringify({ v: BigInt(10) })).toBe('{"v":"10"}');
  });

  // ------------------------------------------------- API cũ (tương thích) ---

  /**
   * ⚠️ NHÓM NÀY LÀ LƯỚI AN TOÀN: `logger` (API kiểu console) đang được ~130 chỗ
   * trong `server.ts` và `accountingService.ts` dùng. Đã từng có lần file này
   * bị ghi đè mất export `logger` → 13 test kế toán fail với
   * "Cannot read properties of undefined (reading 'error')". Đừng xóa nhóm này.
   */
  describe('logger (API kiểu console — tương thích ngược)', () => {
    it('CÓ export logger và đủ 4 mức', () => {
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('logger.error(msg, err) tách Error ra (kiểu server.ts hay dùng)', () => {
      const { entries, sink } = collectSink();
      setLogSinks([sink]);
      logger.error('[SePay Webhook] Database operation failed:', new Error('boom'));
      expect(entries[0].level).toBe('error');
      expect(entries[0].msg).toBe('[SePay Webhook] Database operation failed:');
      expect(entries[0].err?.message).toBe('boom');
    });

    it('logger.error(e) — chỉ truyền Error, KHÔNG có thông điệp', () => {
      const { entries, sink } = collectSink();
      setLogSinks([sink]);
      logger.error(new Error('chỉ có lỗi'));
      expect(entries[0].msg).toBe('chỉ có lỗi');
      expect(entries[0].err?.message).toBe('chỉ có lỗi');
    });

    it('logger[level](msg) gọi ĐƯỢC bằng tên mức (server.ts truyền log callback)', () => {
      const { entries, sink } = collectSink();
      setLogSinks([sink]);
      const level: 'warn' | 'error' = 'warn';
      logger[level]('[SePay Webhook] thông điệp');
      expect(entries[0].level).toBe('warn');
    });

    it('object truyền kèm ĐƯỢC GỘP vào ctx và VẪN BỊ REDACT', () => {
      const { entries, sink } = collectSink();
      setLogSinks([sink]);
      // Đây chính là chỗ code cũ từng làm lộ accessToken khi log config ZNS.
      logger.info('[ZNS-Server] Syncing config:', {
        accessToken: 'tok-quan-trong',
        templateId: 'T1',
      });
      const ctx = entries[0].ctx as Record<string, unknown>;
      expect(ctx.accessToken).toBe(REDACTED_VALUE);
      expect(ctx.templateId).toBe('T1');
    });

    it('tham số nguyên thủy phụ được gom thành meta0, meta1 theo thứ tự', () => {
      const { entries, sink } = collectSink();
      setLogSinks([sink]);
      logger.info('SQL:', 'SELECT 1', 'ghi chú');
      const ctx = entries[0].ctx as Record<string, unknown>;
      expect(ctx.meta0).toBe('SELECT 1');
      expect(ctx.meta1).toBe('ghi chú');
    });

    it('debug bị LỌC theo minLevel toàn cục như API mới', () => {
      setLogLevel('info');
      const { entries, sink } = collectSink();
      setLogSinks([sink]);
      logger.debug('không thấy');
      logger.info('thấy');
      expect(entries).toHaveLength(1);
      setLogLevel('info');
    });
  });
});
