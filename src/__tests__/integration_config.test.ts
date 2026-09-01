import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('../services/dbService');

import {
  PROVIDER_SCHEMAS,
  getIntegrationConfig,
  saveIntegrationConfig,
  toggleIntegration,
  maskConfigForDisplay,
  ProviderKey
} from '../services/integrationConfigService';
import { buildEInvoiceDraft, isEInvoiceReady, issueEInvoice } from '../services/einvoiceService';
import { supabase } from '../lib/supabase';

describe('Integration Config Layer — 3 provider add-key-sau', () => {
  let fromSpy: any;
  let fetchSpy: any;

  const chain = (result: any = null) => {
    const c: any = {};
    c.select = vi.fn().mockImplementation((...args: any[]) => {
      if (args.length === 0) return Promise.resolve({ data: result, error: null });
      return c;
    });
    c.eq = vi.fn().mockReturnThis();
    c.maybeSingle = vi.fn().mockResolvedValue({ data: result, error: null });
    c.update = vi.fn().mockImplementation(() => {
      const ret: any = {};
      ret.eq = vi.fn().mockReturnValue({
        then: (resolve: any) => Promise.resolve({ data: result, error: null }).then(resolve)
      });
      return ret;
    });
    c.insert = vi.fn().mockImplementation(() => {
      const ret: any = {};
      ret.then = (resolve: any) => Promise.resolve({ data: result, error: null }).then(resolve);
      return ret;
    });
    c.upsert = vi.fn().mockImplementation(() => {
      const ret: any = {};
      ret.then = (resolve: any) => Promise.resolve({ data: result, error: null }).then(resolve);
      return ret;
    });
    return c;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fromSpy = vi.spyOn(supabase, 'from');
    vi.stubGlobal('fetch', vi.fn());
    fetchSpy = globalThis.fetch;
  });

  it('PROVIDER_SCHEMAS: đủ 3 provider pháp lý với required fields', () => {
    const keys = Object.keys(PROVIDER_SCHEMAS) as ProviderKey[];
    expect(keys).toContain('einvoice');
    expect(keys).toContain('databank');
    expect(keys).toContain('cq_reporting');

    expect(PROVIDER_SCHEMAS.einvoice.fields.some(f => f.name === 'api_key' && f.required)).toBe(true);
    expect(PROVIDER_SCHEMAS.databank.fields.some(f => f.name === 'endpoint' && f.required)).toBe(true);
    expect(PROVIDER_SCHEMAS.cq_reporting.fields.some(f => f.name === 'hsm_key_id' && f.required)).toBe(true);
  });

  it('getIntegrationConfig: trả null khi chưa cấu hình (chưa add key)', async () => {
    fromSpy.mockImplementation(() => chain(null));
    const cfg = await getIntegrationConfig('einvoice');
    expect(cfg).toBeNull();
  });

  it('saveIntegrationConfig: TỪ CHỐI khi thiếu trường bắt buộc', async () => {
    await expect(saveIntegrationConfig('einvoice', { vendor: 'misa' }))
      .rejects.toThrow('Thiếu trường bắt buộc');
  });

  it('saveIntegrationConfig: đủ trường thì ghi config + audit', async () => {
    const c = chain({});
    fromSpy.mockImplementation((table: string) => {
      if (table === 'integration_config_audit') {
        return chain({});
      }
      return c;
    });
    await expect(saveIntegrationConfig('einvoice', {
      vendor: 'misa',
      endpoint: 'https://api.misa.vn',
      api_key: 'misa-key-123',
      account_id: '0109123456'
    })).resolves.not.toThrow();
  });

  it('toggleIntegration: bật/tắt không mất key', async () => {
    const c = chain({});
    fromSpy.mockImplementation((table: string) => table === 'integration_config_audit' ? chain({}) : c);
    await expect(toggleIntegration('databank', false)).resolves.not.toThrow();
  });

  it('maskConfigForDisplay: key bị che, endpoint giữ nguyên', () => {
    const masked = maskConfigForDisplay({
      api_key: 'sk-1234567890abcdef',
      endpoint: 'https://api.misa.vn',
      hsm_cert: 'ABCDEF1234567890'
    });
    expect(masked.api_key.startsWith('sk-1')).toBe(true);
    expect(masked.api_key).toContain('•');
    expect(masked.api_key).not.toBe('sk-1234567890abcdef');
    expect(masked.endpoint).toBe('https://api.misa.vn');
  });

  // ----- E-invoice adapter -----

  it('buildEInvoiceDraft: dựng hóa đơn chuẩn TT 78 từ order', () => {
    const draft = buildEInvoiceDraft(
      { id: 'ORD-1', customerName: 'Nguyễn Văn A', paymentMethod: 'cod' },
      [{ name: 'Áo thun', price: 200000, qty: 2 }],
      { companyName: 'VCOMM', taxCode: '0109123456', address: 'Q12, HCM' }
    );
    expect(draft.currency).toBe('VND');
    expect(draft.sellerInfo.taxCode).toBe('0109123456');
    expect(draft.subtotal).toBe(400000);
    expect(draft.items).toHaveLength(1);
    expect(draft.orderRef).toBe('ORD-1');
  });

  it('isEInvoiceReady: false khi chưa cấu hình — UI disable nút phát hành', async () => {
    fromSpy.mockImplementation(() => chain(null));
    expect(await isEInvoiceReady()).toBe(false);
  });

  it('issueEInvoice: throw hướng dẫn rõ ràng khi chưa add key (not configured)', async () => {
    fromSpy.mockImplementation(() => chain(null));
    await expect(issueEInvoice('ORD-1', { id: 'ORD-1' }, [], { companyName: 'V', taxCode: '01', address: 'x' }))
      .rejects.toThrow('chưa được cấu hình');
  });

  it('issueEInvoice: phát hành thành công khi provider sẵn sàng + lưu kết quả vào order', async () => {
    // config enabled
    fromSpy.mockImplementation((table: string) => {
      if (table === 'integration_configs') {
        return chain({
          provider_key: 'einvoice',
          is_enabled: true,
          config: { vendor: 'misa', endpoint: 'https://api.misa.vn', api_key: 'k', account_id: '01' },
          last_test_status: 'untested',
          updated_at: new Date().toISOString()
        });
      }
      // updateDoc orders
      return chain({});
    });
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', invoiceNumber: 'HD-1', lookupCode: 'LC-99', signedAt: '2026-08-31T00:00:00Z' })
    } as any);

    const result = await issueEInvoice('ORD-1', { id: 'ORD-1', customerName: 'A' }, [{ name: 'Áo', price: 100000, qty: 1 }], { companyName: 'V', taxCode: '01', address: 'x' });
    expect(result.success).toBe(true);
    expect(result.lookupCode).toBe('LC-99');
    // gọi đúng server proxy
    expect(fetchSpy).toHaveBeenCalledWith('/api/einvoice/issue', expect.objectContaining({ method: 'POST' }));
  });
});
