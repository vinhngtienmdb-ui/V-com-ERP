import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('../services/dbService');

import {
  canTransition,
  submitKycDocuments,
  approveKyc,
  rejectKyc,
  assertSellerCanPublish
} from '../services/sellerKycService';
import { supabase } from '../lib/supabase';

describe('Seller KYC — NĐ 52/2013 + 85/2021/NĐ-CP', () => {
  let fromSpy: any;

  const chain = (result: any = null) => {
    const c: any = {};
    // select trả về chain để tiếp tục .eq()/.maybeSingle(); nếu gọi không args (end-of-chain) thì resolve
    c.select = vi.fn().mockImplementation((...args: any[]) => {
      if (args.length === 0) return Promise.resolve({ data: result, error: null });
      return c;
    });
    c.eq = vi.fn().mockReturnThis();
    c.update = vi.fn().mockReturnThis();
    c.insert = vi.fn().mockReturnThis();
    c.maybeSingle = vi.fn().mockResolvedValue({ data: result, error: null });
    c.single = vi.fn().mockResolvedValue({ data: result, error: null });
    // update() cuối chuỗi resolve
    c.update = vi.fn().mockImplementation(() => {
      const ret: any = {};
      // Hỗ trợ update().eq(...) rồi kết thúc (thenable)
      const thenable = {
        then: (resolve: any) => Promise.resolve({ data: result, error: null }).then(resolve)
      };
      ret.eq = vi.fn().mockReturnValue(thenable);
      ret.select = vi.fn().mockReturnValue({ single: c.single });
      return ret;
    });
    c.insert = vi.fn().mockImplementation(() => {
      const ret: any = {};
      ret.select = vi.fn().mockReturnValue({ single: c.single });
      return ret;
    });
    return c;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fromSpy = vi.spyOn(supabase, 'from');
  });

  it('state machine: chỉ cho phép chuyển hợp lệ', () => {
    expect(canTransition('unverified', 'documents_submitted')).toBe(true);
    expect(canTransition('documents_submitted', 'under_review')).toBe(true);
    expect(canTransition('under_review', 'approved')).toBe(true);
    expect(canTransition('under_review', 'rejected')).toBe(true);
    expect(canTransition('rejected', 'documents_submitted')).toBe(true); // nộp lại

    expect(canTransition('unverified', 'approved')).toBe(false); // không nhảy cóc
    expect(canTransition('approved', 'rejected')).toBe(false);   // đã duyệt không tự bị từ chối
    expect(canTransition('documents_submitted', 'approved')).toBe(false); // phải qua review
  });

  it('submitKycDocuments: seller mới tạo hồ sơ documents_submitted', async () => {
    const kycRow = { seller_id: 'SEL-001', status: 'documents_submitted', tax_code: '0101234567' };
    const single = vi.fn().mockResolvedValue({ data: kycRow, error: null });
    const c = chain();
    c.insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    c.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null }); // chưa có existing
    fromSpy.mockImplementation(() => c);

    const result = await submitKycDocuments({
      sellerId: 'SEL-001',
      taxCode: '0101234567',
      businessLicenseUrl: 'https://r2.vcomm.vn/licenses/sel001.pdf',
      identityCard: '001203001234'
    });
    expect(result.status).toBe('documents_submitted');
  });

  it('approveKyc: TỪ CHỐI khi chưa ký hợp đồng khung (NĐ 52 Điều 17)', async () => {
    const kycRow = {
      seller_id: 'SEL-003',
      status: 'under_review',
      tax_code: '0401122334',
      contract_signed_at: null // CHƯA KÝ
    };
    fromSpy.mockImplementation(() => chain(kycRow));

    await expect(approveKyc('SEL-003', 'admin-uid'))
      .rejects.toThrow('hợp đồng khung');
  });

  it('approveKyc: TỪ CHỐI khi thiếu MST', async () => {
    const kycRow = {
      seller_id: 'SEL-003',
      status: 'under_review',
      tax_code: null,
      contract_signed_at: '2026-08-01T00:00:00Z'
    };
    fromSpy.mockImplementation(() => chain(kycRow));

    await expect(approveKyc('SEL-003', 'admin-uid'))
      .rejects.toThrow('mã số thuế');
  });

  it('approveKyc: duyệt thành công khi đủ điều kiện', async () => {
    const kycRow = {
      seller_id: 'SEL-001',
      status: 'under_review',
      tax_code: '0101234567',
      contract_signed_at: '2026-08-01T00:00:00Z'
    };
    fromSpy.mockImplementation(() => chain(kycRow));

    await expect(approveKyc('SEL-001', 'admin-uid')).resolves.not.toThrow();
  });

  it('rejectKyc: lý do từ chối là bắt buộc', async () => {
    await expect(rejectKyc('SEL-001', 'admin-uid', '   '))
      .rejects.toThrow('bắt buộc');
  });

  it('assertSellerCanPublish: CHẶN publish khi KYC chưa approved', async () => {
    fromSpy.mockImplementation(() => chain({ status: 'under_review' }));
    await expect(assertSellerCanPublish('SEL-003'))
      .rejects.toThrow('NĐ 52/2013');

    // Không có hồ sơ KYC
    fromSpy.mockImplementation(() => chain(null));
    await expect(assertSellerCanPublish('SEL-NEW'))
      .rejects.toThrow('NĐ 52/2013');
  });

  it('assertSellerCanPublish: CHẶN khi approved nhưng chưa ký hợp đồng', async () => {
    fromSpy.mockImplementation(() => chain({
      status: 'approved',
      contract_signed_at: null
    }));
    await expect(assertSellerCanPublish('SEL-001'))
      .rejects.toThrow('hợp đồng khung');
  });

  it('assertSellerCanPublish: cho phép khi approved + đã ký hợp đồng', async () => {
    fromSpy.mockImplementation(() => chain({
      status: 'approved',
      contract_signed_at: '2026-08-01T00:00:00Z',
      tax_code: '0101234567'
    }));
    await expect(assertSellerCanPublish('SEL-001')).resolves.not.toThrow();
  });
});
