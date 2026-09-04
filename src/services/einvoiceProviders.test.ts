import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  registerProvider,
  unregisterProvider,
  getProvider,
  hasProvider,
  listProviders,
  resolveProvider,
  GenericHttpProvider,
  DEFAULT_PROVIDER_ID,
  type EInvoiceProviderAdapter,
} from './einvoiceProviders';

function mockAdapter(id: string): EInvoiceProviderAdapter & { calls: any[] } {
  return {
    id,
    label: `Mock ${id}`,
    calls: [],
    async call(req: any) {
      this.calls.push(req);
      return { status: 'success', invoiceNumber: `${id}-001` };
    },
  } as any;
}

describe('GĐ 3.1 — registry nhà cung cấp HĐĐT', () => {
  it('mặc định luôn có adapter generic (không hồi quy luồng cũ)', () => {
    expect(hasProvider(DEFAULT_PROVIDER_ID)).toBe(true);
    expect(getProvider().id).toBe('generic');
  });

  it('registerProvider / getProvider / listProviders', () => {
    const a = mockAdapter('viettel');
    registerProvider(a);
    expect(hasProvider('viettel')).toBe(true);
    expect(getProvider('viettel')).toBe(a);
    expect(listProviders().map(p => p.id)).toContain('viettel');
    unregisterProvider('viettel');
    expect(hasProvider('viettel')).toBe(false);
  });

  it('getProvider chưa đăng ký → ném lỗi rõ ràng, liệt kê provider đã có', () => {
    expect(() => getProvider('khong-ton-tai')).toThrow(/Chưa đăng ký nhà cung cấp HĐĐT/);
  });

  it('resolveProvider: không cấu hình → mặc định generic', () => {
    expect(resolveProvider(null).id).toBe('generic');
    expect(resolveProvider(undefined).id).toBe('generic');
  });

  it('resolveProvider: cấu hình đã đăng ký → dùng đúng provider', () => {
    const a = mockAdapter('vnpt');
    registerProvider(a);
    expect(resolveProvider('vnpt')).toBe(a);
    unregisterProvider('vnpt');
  });

  it('resolveProvider: cấu hình CHƯA đăng ký → ném, KHÔNG âm thầm dùng mặc định', () => {
    expect(() => resolveProvider('misa')).toThrow(/chưa đăng ký adapter/);
  });

  it('dispatch đúng hành động (TT 91 Điều 10 thay vì "hủy")', async () => {
    const a = mockAdapter('fpt');
    registerProvider(a);
    await a.call({ action: 'replace', payload: { id: '1' } });
    await a.call({ action: 'announce_adjust', payload: { id: '2' } });
    await a.call({ action: 'monthly_consolidate', payload: { id: '3' } });
    expect(a.calls.map(c => c.action)).toEqual([
      'replace',
      'announce_adjust',
      'monthly_consolidate',
    ]);
    unregisterProvider('fpt');
  });
});

describe('GĐ 3.1 — GenericHttpProvider (server proxy)', () => {
  const okResponse = {
    ok: true,
    json: async () => ({ status: 'success', invoiceNumber: 'INV-1', lookupCode: 'LK1' }),
  };

  it('issue → POST /api/einvoice/issue (giữ nguyên path cũ)', async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse);
    const p = new GenericHttpProvider({ fetchFn: fetchFn as any });
    const res = await p.call({ action: 'issue', refId: 'ORD-1', payload: { orderId: 'ORD-1' } });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('/api/einvoice/issue');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({ orderId: 'ORD-1', action: 'issue', refId: 'ORD-1' });
    expect(res.invoiceNumber).toBe('INV-1');
  });

  it('3 luồng sai sót (TT 91 Điều 10) → cùng endpoint /handle-error (không hồi quy)', async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse);
    const p = new GenericHttpProvider({ fetchFn: fetchFn as any });
    for (const action of ['announce_adjust', 'replace', 'monthly_consolidate'] as const) {
      await p.call({ action, refId: 'X', payload: {} });
      expect(fetchFn.mock.calls.at(-1)![0]).toBe('/api/einvoice/handle-error');
    }
  });

  it('provider báo lỗi → ném message từ provider', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ status: 'error', message: 'Sai chứng thư số' }),
    });
    const p = new GenericHttpProvider({ fetchFn: fetchFn as any });
    await expect(p.call({ action: 'issue', payload: {} })).rejects.toThrow(/Sai chứng thư số/);
  });

  it('baseUrl có thể ghi đè (multi-tenant / proxy riêng)', async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse);
    const p = new GenericHttpProvider({ baseUrl: '/api/v2/einvoice', fetchFn: fetchFn as any });
    await p.call({ action: 'lookup', payload: {} });
    expect(fetchFn.mock.calls[0][0]).toBe('/api/v2/einvoice/lookup');
  });
});
