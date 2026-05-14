import { describe, it, expect, vi } from 'vitest';

type SellerStatus =
  | 'pending_docs' | 'pending_verification' | 'verified' | 'active'
  | 'suspended' | 'rejected' | 'closed';
type Seller = {
  status: SellerStatus;
  kycDocs?: { type: string }[];
};

// Logic submit (rút gọn từ sellers.ts)
function submitKycLogic(seller: Seller): { ok: true; nextStatus: SellerStatus } | { ok: false; reason: string } {
  if (seller.status !== 'pending_docs') return { ok: false, reason: `status=${seller.status}` };
  const types = new Set((seller.kycDocs ?? []).map((d) => d.type));
  const hasIndividualKyc = types.has('cccd_front') && types.has('cccd_back');
  const hasBusinessKyc = types.has('gpkd');
  if (!hasIndividualKyc && !hasBusinessKyc) return { ok: false, reason: 'Thiếu KYC docs' };
  return { ok: true, nextStatus: 'pending_verification' };
}

// Logic verify KYC (rút gọn từ Cloud Function)
function verifyKycLogic(seller: Seller, approved: boolean, reason?: string): { ok: true; nextStatus: SellerStatus } | { ok: false; reason: string } {
  if (seller.status !== 'pending_verification') return { ok: false, reason: `status=${seller.status}` };
  if (!approved && !reason?.trim()) return { ok: false, reason: 'reason bắt buộc khi reject' };
  return { ok: true, nextStatus: approved ? 'verified' : 'rejected' };
}

function activateLogic(seller: Seller): { ok: true; nextStatus: SellerStatus } | { ok: false; reason: string } {
  if (seller.status !== 'verified') return { ok: false, reason: `status=${seller.status}` };
  return { ok: true, nextStatus: 'active' };
}

describe('Seller state machine', () => {
  describe('submitKyc', () => {
    it('OK khi đủ CCCD front + back', () => {
      const r = submitKycLogic({ status: 'pending_docs', kycDocs: [{ type: 'cccd_front' }, { type: 'cccd_back' }] });
      expect(r).toEqual({ ok: true, nextStatus: 'pending_verification' });
    });

    it('OK khi có GPKD (hộ KD/DN)', () => {
      const r = submitKycLogic({ status: 'pending_docs', kycDocs: [{ type: 'gpkd' }] });
      expect(r).toEqual({ ok: true, nextStatus: 'pending_verification' });
    });

    it('Reject khi chỉ có 1 mặt CCCD', () => {
      const r = submitKycLogic({ status: 'pending_docs', kycDocs: [{ type: 'cccd_front' }] });
      expect(r.ok).toBe(false);
    });

    it('Reject khi không có docs', () => {
      const r = submitKycLogic({ status: 'pending_docs', kycDocs: [] });
      expect(r.ok).toBe(false);
    });

    it('Reject khi status không phải pending_docs', () => {
      const r = submitKycLogic({ status: 'verified', kycDocs: [{ type: 'cccd_front' }, { type: 'cccd_back' }] });
      expect(r.ok).toBe(false);
    });
  });

  describe('verifyKyc', () => {
    it('Approve OK', () => {
      const r = verifyKycLogic({ status: 'pending_verification' }, true);
      expect(r).toEqual({ ok: true, nextStatus: 'verified' });
    });

    it('Reject với lý do OK', () => {
      const r = verifyKycLogic({ status: 'pending_verification' }, false, 'CCCD mờ');
      expect(r).toEqual({ ok: true, nextStatus: 'rejected' });
    });

    it('Reject mà thiếu lý do → fail', () => {
      const r = verifyKycLogic({ status: 'pending_verification' }, false);
      expect(r.ok).toBe(false);
    });

    it('Không thể verify nếu chưa submit', () => {
      const r = verifyKycLogic({ status: 'pending_docs' }, true);
      expect(r.ok).toBe(false);
    });
  });

  describe('activate', () => {
    it('Verified → active OK', () => {
      const r = activateLogic({ status: 'verified' });
      expect(r).toEqual({ ok: true, nextStatus: 'active' });
    });

    it('Không thể active từ rejected', () => {
      const r = activateLogic({ status: 'rejected' });
      expect(r.ok).toBe(false);
    });

    it('Không thể active 2 lần', () => {
      const r = activateLogic({ status: 'active' });
      expect(r.ok).toBe(false);
    });
  });
});
