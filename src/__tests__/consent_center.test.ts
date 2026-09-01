import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('../services/dbService');

import {
  grantConsent,
  withdrawConsent,
  isMandatoryPurpose,
  getConsentStatus,
  assessDpia,
  CURRENT_POLICY_VERSION
} from '../services/consentService';
import { supabase } from '../lib/supabase';

describe('Consent Center — Luật 86/2025/QH15', () => {
  let fromSpy: any;

  const chain = (result: any = null) => {
    const c: any = {};
    c.select = vi.fn().mockImplementation((...args: any[]) => {
      if (args.length === 0) return Promise.resolve({ data: result, error: null });
      return c;
    });
    c.eq = vi.fn().mockReturnThis();
    c.or = vi.fn().mockResolvedValue({ data: result, error: null });
    c.order = vi.fn().mockReturnThis();
    // Chuỗi filter kết thúc bằng await → chain thenable resolve data
    c.then = (resolve: any, reject: any) => Promise.resolve({ data: result, error: null }).then(resolve, reject);
    c.maybeSingle = vi.fn().mockResolvedValue({ data: result, error: null });
    c.insert = vi.fn().mockImplementation(() => {
      const ret: any = {};
      ret.select = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: result, error: null })
      });
      ret.then = (resolve: any) => Promise.resolve({ data: result, error: null }).then(resolve);
      return ret;
    });
    return c;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fromSpy = vi.spyOn(supabase, 'from');
  });

  it('order_processing là mục đích bắt buộc (theo hợp đồng)', () => {
    expect(isMandatoryPurpose('order_processing')).toBe(true);
    expect(isMandatoryPurpose('marketing')).toBe(false);
    expect(isMandatoryPurpose('profiling')).toBe(false);
  });

  it('grantConsent: ghi kèm version chính sách hiện tại', async () => {
    const row = { purpose: 'marketing', action: 'grant', policy_version: CURRENT_POLICY_VERSION };
    const c = chain(row);
    fromSpy.mockImplementation(() => c);

    const result = await grantConsent({
      subjectId: 'USR-882',
      subjectEmail: 'test@example.com',
      purpose: 'marketing'
    });

    expect(result.policy_version).toBe(CURRENT_POLICY_VERSION);
    expect(c.insert).toHaveBeenCalledWith(expect.objectContaining({
      purpose: 'marketing',
      action: 'grant'
    }));
  });

  it('withdrawConsent: TỪ CHỐI rút mục đích bắt buộc order_processing', async () => {
    await expect(withdrawConsent('USR-882', 'order_processing'))
      .rejects.toThrow('không thể rút');
  });

  it('withdrawConsent: cho phép rút marketing', async () => {
    const c = chain({});
    fromSpy.mockImplementation(() => c);

    await expect(withdrawConsent('USR-882', 'marketing')).resolves.not.toThrow();
    expect(c.insert).toHaveBeenCalledWith(expect.objectContaining({
      purpose: 'marketing',
      action: 'withdraw'
    }));
  });

  it('getConsentStatus: record mới nhất theo purpose thắng (withdraw sau grant)', async () => {
    // Supabase order consent_given_at DESC → withdraw (20/08) đứng TRƯỚC grant (01/08)
    const rows = [
      { purpose: 'marketing', action: 'withdraw', consent_given_at: '2026-08-20T00:00:00Z', consent_withdrawn_at: '2026-08-20T00:00:00Z' },
      { purpose: 'marketing', action: 'grant', consent_given_at: '2026-08-01T00:00:00Z', consent_withdrawn_at: null }
    ];
    fromSpy.mockImplementation(() => chain(rows));

    const status = await getConsentStatus('USR-882');
    expect(status.marketing).toBe(false);
  });

  it('getConsentStatus: grant còn hiệu lực → true', async () => {
    const rows = [
      { purpose: 'marketing', action: 'grant', consent_given_at: '2026-08-20T00:00:00Z', consent_withdrawn_at: null }
    ];
    fromSpy.mockImplementation(() => chain(rows));

    const status = await getConsentStatus('USR-882');
    expect(status.marketing).toBe(true);
  });

  it('DPIA: bắt buộc khi có quyết định tự động (seller credit scoring)', () => {
    const result = assessDpia({ hasSensitiveData: false, hasAutomatedDecision: true, hasLargeScale: false, hasMinorData: false, crossBorderTransfer: false });
    expect(result.required).toBe(true);
    expect(result.findings.some(f => f.item.includes('tự động'))).toBe(true);
  });

  it('DPIA: bắt buộc khi dữ liệu nhạy cảm', () => {
    const result = assessDpia({ hasSensitiveData: true, hasAutomatedDecision: false, hasLargeScale: false, hasMinorData: false, crossBorderTransfer: false });
    expect(result.required).toBe(true);
  });

  it('DPIA: xử lý thông thường không bắt buộc nhưng vẫn ghi hồ sơ', () => {
    const result = assessDpia({ hasSensitiveData: false, hasAutomatedDecision: false, hasLargeScale: false, hasMinorData: false, crossBorderTransfer: false });
    expect(result.required).toBe(false);
    expect(result.findings[0].risk).toBe('low');
  });

  it('DPIA: chuyển dữ liệu xuyên biên giới phải ràng buộc Điều 30', () => {
    const result = assessDpia({ hasSensitiveData: false, hasAutomatedDecision: false, hasLargeScale: false, hasMinorData: false, crossBorderTransfer: true });
    expect(result.findings.some(f => f.note.includes('Điều 30'))).toBe(true);
  });
});
