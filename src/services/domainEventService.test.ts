import { describe, it, expect, vi } from 'vitest';
import {
  publishDomainEvent,
  runOutboxOnce,
  startOutboxWorker,
  outboxStats,
  fromOutboxRow,
  isMigrationMissing,
  dedupeKeyOf,
  nextRetryDelayMs,
  nextRetryAt,
  DEFAULT_MAX_ATTEMPTS,
  STUCK_LOCK_MINUTES,
  type OutboxDeps,
  type RpcResult,
} from './domainEventService';

/* -------------------------------------------------------------------------- */
/*  Giả lập hàng đợi                                                          */
/* -------------------------------------------------------------------------- */

interface FakeQueueOptions {
  /** Trả lỗi này cho mọi RPC (giả lập chưa chạy migration 002). */
  error?: RpcResult['error'];
  /** Sự kiện trả về khi claim. */
  events?: Array<Partial<Record<string, any>>>;
}

function makeQueue(opts: FakeQueueOptions = {}) {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const acked: string[] = [];
  const failed: Array<{ id: string; message: string; dead: boolean; retryAt?: string }> = [];
  let events: Array<Record<string, any>> = (opts.events ?? []).map((e, i) => ({
    id: String(e.id ?? `evt-${i + 1}`),
    tenant_id: 'tenant-vcomm-prod-01',
    event_type: e.event_type ?? 'order.completed',
    aggregate_type: e.aggregate_type ?? 'order',
    aggregate_id: e.aggregate_id ?? `AGG-${i + 1}`,
    dedupe_key: e.dedupe_key ?? null,
    payload: e.payload ?? {},
    status: 'processing',
    attempts: e.attempts ?? 0,
    max_attempts: e.max_attempts ?? DEFAULT_MAX_ATTEMPTS,
    available_at: '2026-09-01T00:00:00Z',
    created_at: '2026-09-01T00:00:00Z',
    last_error: null,
  }));

  const deps: OutboxDeps = {
    log: () => {},
    rpc: async (fn, args) => {
      calls.push({ fn, args });
      if (opts.error) return { data: null, error: opts.error } as RpcResult;

      switch (fn) {
        case 'vcomm_publish_domain_event':
          return { data: [{ event_id: 'evt-new', inserted: true }], error: null } as RpcResult;
        case 'vcomm_claim_domain_events': {
          const taken = events;
          events = [];
          return { data: taken, error: null } as RpcResult;
        }
        case 'vcomm_ack_domain_event':
          acked.push(String(args.p_id));
          return { data: null, error: null } as RpcResult;
        case 'vcomm_fail_domain_event':
          failed.push({
            id: String(args.p_id),
            message: String(args.p_last_error ?? ''),
            dead: args.p_is_dead === true,
            retryAt: args.p_retry_at as string | undefined,
          });
          return { data: null, error: null } as RpcResult;
        case 'vcomm_requeue_stuck_domain_events':
          return { data: 0, error: null } as RpcResult;
        case 'vcomm_outbox_stats':
          return {
            data: [
              { status: 'pending', cnt: 3, oldest_age_min: 12.5 },
              { status: 'dead', cnt: 1, oldest_age_min: 300 },
            ],
            error: null,
          } as RpcResult;
        default:
          return { data: null, error: { code: 'PGRST202', message: `unknown ${fn}` } } as RpcResult;
      }
    },
  };

  return { deps, calls, acked, failed, fnOf: (i: number) => calls[i]?.fn };
}

const MIGRATION_MISSING = { code: 'PGRST202', message: 'Could not find the function public.vcomm_claim_domain_events' };

/* -------------------------------------------------------------------------- */
/*  Hàm thuần                                                                 */
/* -------------------------------------------------------------------------- */

describe('GĐ 2.1 — hàm thuần: khoá dedupe & backoff', () => {
  it('dedupeKeyOf: ghép loại sự kiện + mã đối tượng', () => {
    expect(dedupeKeyOf('order.completed', 'ORD-123')).toBe('order.completed:ORD-123');
  });

  it('backoff LUỸ THỪA: mỗi lần thử gấp đôi, có trần 5 phút', () => {
    // rand = 0.5 → jitter = 1 + (0.5*2-1)*0.2 = 1 → không lệch
    expect(nextRetryDelayMs(1, 0.5)).toBe(5_000);
    expect(nextRetryDelayMs(2, 0.5)).toBe(10_000);
    expect(nextRetryDelayMs(3, 0.5)).toBe(20_000);
    expect(nextRetryDelayMs(4, 0.5)).toBe(40_000);
    expect(nextRetryDelayMs(20, 0.5)).toBe(300_000); // trần
  });

  it('backoff có JITTER ±20% (tránh cả đàn worker retry cùng nhịp)', () => {
    const lo = nextRetryDelayMs(1, 0);   // jitter −20% → 4.000
    const hi = nextRetryDelayMs(1, 1);   // jitter +20% → 6.000
    expect(lo).toBe(4_000);
    expect(hi).toBe(6_000);
    expect(hi).toBeGreaterThan(lo);
  });

  it('backoff không bao giờ dưới 1 giây (retry dồn dập = tự DDOS mình)', () => {
    expect(nextRetryDelayMs(0, 0)).toBeGreaterThanOrEqual(1_000);
    expect(nextRetryDelayMs(-5, 0)).toBeGreaterThanOrEqual(1_000);
  });

  it('nextRetryAt = now + delay (nhận now để test xác định)', () => {
    const now = new Date('2026-09-01T10:00:00Z');
    const at = nextRetryAt(2, now, 0.5); // +10s
    expect(at.toISOString()).toBe('2026-09-01T10:00:10.000Z');
  });
});

describe('GĐ 2.1 — nhận diện "chưa chạy migration"', () => {
  it('nhận đúng các mã báo thiếu hàm/bảng', () => {
    expect(isMigrationMissing({ code: 'PGRST202' })).toBe(true);
    expect(isMigrationMissing({ code: '42883' })).toBe(true);
    expect(isMigrationMissing({ code: '42P01' })).toBe(true);
    expect(isMigrationMissing({ code: 'PGRST205' })).toBe(true);
    expect(isMigrationMissing({ message: 'relation "public.domain_events" does not exist' })).toBe(true);
  });

  it('⚠️ KHÔNG nuốt lỗi PHÂN QUYỀN thành "chưa cài" (lỗi thật phải ồn ào)', () => {
    expect(isMigrationMissing({ code: 'PGRST301' })).toBe(false);
    expect(isMigrationMissing({ code: '42501' })).toBe(false);
    expect(isMigrationMissing({ message: 'permission denied for table domain_events' })).toBe(false);
  });

  it('không có lỗi → false', () => {
    expect(isMigrationMissing(null)).toBe(false);
  });
});

describe('GĐ 2.1 — fromOutboxRow', () => {
  it('map snake_case → camelCase, có giá trị mặc định an toàn', () => {
    const e = fromOutboxRow({
      id: 'evt-1',
      tenant_id: 't1',
      event_type: 'order.completed',
      aggregate_id: 'ORD-1',
      payload: { total: 100 },
      status: 'pending',
      attempts: 2,
      max_attempts: 5,
      available_at: '2026-09-01T00:00:00Z',
      created_at: '2026-08-31T00:00:00Z',
      last_error: null,
    });
    expect(e.tenantId).toBe('t1');
    expect(e.aggregateType).toBe('generic'); // mặc định
    expect(e.dedupeKey).toBeNull();
    expect(e.payload).toEqual({ total: 100 });
    expect(e.attempts).toBe(2);
  });
});

/* -------------------------------------------------------------------------- */
/*  PUBLISH                                                                   */
/* -------------------------------------------------------------------------- */

describe('GĐ 2.1 — publishDomainEvent', () => {
  it('ghi thành công → trả eventId, deduped = false', async () => {
    const q = makeQueue();
    const r = await publishDomainEvent(
      { eventType: 'order.completed', aggregateType: 'order', aggregateId: 'ORD-1', dedupeKey: 'order.completed:ORD-1' },
      q.deps
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.eventId).toBe('evt-new');
      expect(r.deduped).toBe(false);
    }
    expect(q.calls[0].fn).toBe('vcomm_publish_domain_event');
    expect(q.calls[0].args.p_dedupe_key).toBe('order.completed:ORD-1');
  });

  it('trùng dedupe_key → deduped = true (double-click không sinh sự kiện 2)', async () => {
    const q = makeQueue();
    const deps: OutboxDeps = {
      log: () => {},
      rpc: async () => ({ data: [{ event_id: 'evt-cu', inserted: false }], error: null }) as RpcResult,
    };
    const r = await publishDomainEvent(
      { eventType: 'order.completed', aggregateType: 'order', aggregateId: 'ORD-1', dedupeKey: 'order.completed:ORD-1' },
      deps
    );
    expect(r.ok && r.deduped).toBe(true);
    expect(r.ok && r.eventId).toBe('evt-cu');
    expect(q.calls).toHaveLength(0); // deps bị thay, queue giả không dùng
  });

  it('⭐ chưa chạy migration → ok=false, reason=unavailable (caller rơi về đường cũ)', async () => {
    const q = makeQueue({ error: MIGRATION_MISSING });
    const r = await publishDomainEvent(
      { eventType: 'order.completed', aggregateType: 'order', aggregateId: 'ORD-1' },
      q.deps
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unavailable');
  });

  it('lỗi thật (không phải thiếu migration) → ok=false, reason=error', async () => {
    const q = makeQueue({ error: { code: '42501', message: 'permission denied' } });
    const r = await publishDomainEvent(
      { eventType: 'order.completed', aggregateType: 'order', aggregateId: 'ORD-1' },
      q.deps
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('error');
  });

  it('⚠️ KHÔNG BAO GIỜ ném lỗi — outbox là việc phụ, không được gãy nghiệp vụ chính', async () => {
    const deps: OutboxDeps = {
      log: () => {},
      rpc: async () => {
        throw new Error('mất mạng');
      },
    };
    await expect(
      publishDomainEvent({ eventType: 'order.completed', aggregateType: 'order', aggregateId: 'ORD-1' }, deps)
    ).resolves.toMatchObject({ ok: false, reason: 'error' });
  });

  it('delayMs được đổi sang giây (làm tròn, không âm)', async () => {
    const q = makeQueue();
    await publishDomainEvent(
      { eventType: 'withdrawal.approved', aggregateType: 'withdrawal', aggregateId: 'W-1', delayMs: 9_600 },
      q.deps
    );
    expect(q.calls[0].args.p_delay_seconds).toBe(10);
  });
});

/* -------------------------------------------------------------------------- */
/*  WORKER                                                                    */
/* -------------------------------------------------------------------------- */

describe('GĐ 2.1 — runOutboxOnce', () => {
  it('không có việc → không làm gì, không lỗi', async () => {
    const q = makeQueue({ events: [] });
    const r = await runOutboxOnce(q.deps, { 'order.completed': async () => {} });
    expect(r.claimed).toBe(0);
    expect(r.succeeded).toBe(0);
  });

  it('xử lý thành công → ack', async () => {
    const q = makeQueue({ events: [{ id: 'e1', event_type: 'order.completed' }] });
    const handler = vi.fn(async (_e: unknown) => {});
    const r = await runOutboxOnce(q.deps, { 'order.completed': handler });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toMatchObject({ id: 'e1', eventType: 'order.completed' });
    expect(r.succeeded).toBe(1);
    expect(q.acked).toEqual(['e1']);
  });

  it('handler lỗi → đánh failed + hẹn giờ thử lại (chưa dead)', async () => {
    const q = makeQueue({ events: [{ id: 'e1', attempts: 0, max_attempts: 5 }] });
    const r = await runOutboxOnce(q.deps, {
      'order.completed': async () => {
        throw new Error('Supabase timeout');
      },
    });

    expect(r.failed).toBe(1);
    expect(r.dead).toBe(0);
    expect(q.failed[0]).toMatchObject({ id: 'e1', message: 'Supabase timeout', dead: false });
    // retry phải nằm trong tương lai
    expect(new Date(q.failed[0].retryAt!).getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  it('⭐ hết lượt thử → dead (CẦN NGƯỜI), không retry vô hạn', async () => {
    const q = makeQueue({ events: [{ id: 'e1', attempts: 4, max_attempts: 5 }] });
    const r = await runOutboxOnce(q.deps, {
      'order.completed': async () => {
        throw new Error('sổ cái mất cân đối');
      },
    });

    expect(r.dead).toBe(1);
    expect(r.failed).toBe(0);
    expect(q.failed[0]).toMatchObject({ id: 'e1', dead: true });
  });

  it('không có handler → dead ngay, KHÔNG kẹt hàng đợi', async () => {
    const q = makeQueue({ events: [{ id: 'e1', event_type: 'sự.kiện.lạ' }] });
    const r = await runOutboxOnce(q.deps, { 'order.completed': async () => {} });

    expect(r.unhandled).toBe(1);
    expect(q.failed[0]).toMatchObject({ id: 'e1', dead: true });
    expect(q.failed[0].message).toMatch(/Không có handler/);
  });

  it('⭐ 1 sự kiện lỗi KHÔNG làm gãy cả lô (lỗi được cô lập)', async () => {
    const q = makeQueue({
      events: [
        { id: 'e1', event_type: 'order.completed' },
        { id: 'e2', event_type: 'order.completed' },
        { id: 'e3', event_type: 'order.completed' },
      ],
    });
    const r = await runOutboxOnce(q.deps, {
      'order.completed': async (e) => {
        if (e.id === 'e2') throw new Error('lỗi e2');
      },
    });

    expect(r.claimed).toBe(3);
    expect(r.succeeded).toBe(2);
    expect(r.failed).toBe(1);
    expect(q.acked).toEqual(['e1', 'e3']);
  });

  it('chưa chạy migration → unavailable = true, không đập RPC liên tục', async () => {
    const q = makeQueue({ error: MIGRATION_MISSING });
    const r = await runOutboxOnce(q.deps, { 'order.completed': async () => {} });
    expect(r.unavailable).toBe(true);
    expect(r.claimed).toBe(0);
  });

  it('gọi thu hồi sự kiện kẹt với ngưỡng 15 phút', async () => {
    const q = makeQueue({ events: [] });
    await runOutboxOnce(q.deps, {}, { requeueStuck: true });
    const call = q.calls.find((c) => c.fn === 'vcomm_requeue_stuck_domain_events');
    expect(call?.args.p_stuck_minutes).toBe(STUCK_LOCK_MINUTES);
  });

  it('tắt thu hồi theo options', async () => {
    const q = makeQueue({ events: [] });
    await runOutboxOnce(q.deps, {}, { requeueStuck: false });
    expect(q.calls.some((c) => c.fn === 'vcomm_requeue_stuck_domain_events')).toBe(false);
  });

  it('claim được gọi kèm tên worker và giới hạn lô', async () => {
    const q = makeQueue({ events: [] });
    await runOutboxOnce(q.deps, {}, { workerId: 'worker-A', limit: 7 });
    const call = q.calls.find((c) => c.fn === 'vcomm_claim_domain_events');
    expect(call?.args).toMatchObject({ p_worker: 'worker-A', p_limit: 7 });
  });
});

describe('GĐ 2.1 — vòng lặp worker', () => {
  it('tick() chạy được và stop() dừng hẳn', async () => {
    const q = makeQueue({ events: [{ id: 'e1' }] });
    const w = startOutboxWorker(q.deps, { 'order.completed': async () => {} }, { intervalMs: 10_000 });
    const r = await w.tick();
    expect(r.succeeded).toBe(1);
    w.stop();
    expect(w.isRunning()).toBe(false);
  });

  it('onResult được gọi mỗi nhịp', async () => {
    const q = makeQueue({ events: [{ id: 'e1' }] });
    const seen: number[] = [];
    const w = startOutboxWorker(
      q.deps,
      { 'order.completed': async () => {} },
      { intervalMs: 10_000, onResult: (r) => seen.push(r.claimed) }
    );
    await w.tick();
    w.stop();
    expect(seen).toEqual([1]);
  });
});

describe('GĐ 2.1 — outboxStats (phục vụ /metrics)', () => {
  it('đọc được số lượng và tuổi sự kiện theo trạng thái', async () => {
    const q = makeQueue();
    const s = await outboxStats(q.deps);
    expect(s.unavailable).toBe(false);
    expect(s.byStatus.pending).toEqual({ count: 3, oldestAgeMinutes: 12.5 });
    expect(s.byStatus.dead).toEqual({ count: 1, oldestAgeMinutes: 300 });
  });

  it('chưa chạy migration → unavailable, không ném lỗi', async () => {
    const q = makeQueue({ error: MIGRATION_MISSING });
    const s = await outboxStats(q.deps);
    expect(s.unavailable).toBe(true);
  });
});
