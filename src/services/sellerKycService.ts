import { supabase } from '../lib/supabase';

/**
 * Seller KYC — NĐ 52/2013/NĐ-CP + 85/2021/NĐ-CP (sàn TMĐT)
 *
 * State machine bắt buộc:
 *   unverified → documents_submitted → under_review → approved
 *                                     ↘ rejected (kèm lý do, có thể nộp lại)
 *
 * Ràng buộc nghiệp vụ (NĐ 52/85):
 * 1. Seller chỉ được publish sản phẩm khi kyc_status = 'approved'
 * 2. Hợp đồng khung đã ký (contract_signed_at) là điều kiện cần approval
 * 3. Mọi chuyển trạng thái lưu audit kèm người duyệt
 * 4. Thay đổi MST/hồ sơ pháp lý sau approval → quay lại under_review
 */

export type KycStatus = 'unverified' | 'documents_submitted' | 'under_review' | 'approved' | 'rejected';

export interface SellerKyc {
  id: string;
  seller_id: string;
  status: KycStatus;
  tax_code: string | null;
  business_license_url: string | null;
  identity_card: string | null;
  contract_signed_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
}

const VALID_TRANSITIONS: Record<KycStatus, KycStatus[]> = {
  unverified: ['documents_submitted'],
  documents_submitted: ['under_review', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: [],
  rejected: ['documents_submitted']
};

export function canTransition(from: KycStatus, to: KycStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Seller nộp hồ sơ KYC (GPKD, CCCD, MST) */
export async function submitKycDocuments(params: {
  sellerId: string;
  taxCode: string;
  businessLicenseUrl: string;
  identityCard: string;
}): Promise<SellerKyc> {
  const { data: existing } = await supabase
    .from('seller_kyc')
    .select('*')
    .eq('seller_id', params.sellerId)
    .maybeSingle();

  if (existing) {
    const from = existing.status as KycStatus;
    if (from !== 'unverified' && from !== 'rejected') {
      throw new Error(`Không thể nộp lại hồ sơ khi đang ở trạng thái ${from}`);
    }
    const { data, error } = await supabase
      .from('seller_kyc')
      .update({
        status: 'documents_submitted',
        tax_code: params.taxCode,
        business_license_url: params.businessLicenseUrl,
        identity_card: params.identityCard,
        submitted_at: new Date().toISOString(),
        rejection_reason: null
      })
      .eq('seller_id', params.sellerId)
      .select()
      .single();
    if (error) throw new Error(`Nộp hồ sơ KYC lỗi: ${error.message}`);
    return data as SellerKyc;
  }

  const { data, error } = await supabase
    .from('seller_kyc')
    .insert({
      seller_id: params.sellerId,
      status: 'documents_submitted',
      tax_code: params.taxCode,
      business_license_url: params.businessLicenseUrl,
      identity_card: params.identityCard,
      submitted_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw new Error(`Tạo hồ sơ KYC lỗi: ${error.message}`);
  return data as SellerKyc;
}

/** Admin vào duyệt → under_review */
export async function startKycReview(sellerId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('seller_kyc')
    .select('status')
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (!existing) throw new Error('Không tìm thấy hồ sơ KYC');
  if (!canTransition(existing.status as KycStatus, 'under_review')) {
    throw new Error(`Không thể bắt đầu duyệt từ trạng thái ${existing.status}`);
  }

  const { error } = await supabase
    .from('seller_kyc')
    .update({ status: 'under_review' })
    .eq('seller_id', sellerId);
  if (error) throw new Error(`Chuyển trạng thái duyệt lỗi: ${error.message}`);
}

/** Admin phê duyệt — BẮT BUỘC hợp đồng khung đã ký (NĐ 52 Điều 17) */
export async function approveKyc(sellerId: string, reviewedBy: string): Promise<void> {
  const { data: kyc } = await supabase
    .from('seller_kyc')
    .select('*')
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (!kyc) throw new Error('Không tìm thấy hồ sơ KYC');
  if (!canTransition(kyc.status as KycStatus, 'approved')) {
    throw new Error(`Không thể phê duyệt từ trạng thái ${kyc.status}`);
  }
  if (!kyc.contract_signed_at) {
    throw new Error('Bắt buộc ký hợp đồng khung trước khi phê duyệt (NĐ 52/2024 Điều 17)');
  }
  if (!kyc.tax_code) {
    throw new Error('Thiếu mã số thuế — không thể phê duyệt');
  }

  const { error } = await supabase
    .from('seller_kyc')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy
    })
    .eq('seller_id', sellerId);
  if (error) throw new Error(`Phê duyệt KYC lỗi: ${error.message}`);
}

/** Từ chối kèm lý do bắt buộc */
export async function rejectKyc(sellerId: string, reviewedBy: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error('Lý do từ chối là bắt buộc');

  const { data: kyc } = await supabase
    .from('seller_kyc')
    .select('status')
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (!kyc) throw new Error('Không tìm thấy hồ sơ KYC');
  if (!canTransition(kyc.status as KycStatus, 'rejected')) {
    throw new Error(`Không thể từ chối từ trạng thái ${kyc.status}`);
  }

  const { error } = await supabase
    .from('seller_kyc')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy
    })
    .eq('seller_id', sellerId);
  if (error) throw new Error(`Từ chối KYC lỗi: ${error.message}`);
}

/** Đánh dấu hợp đồng khung đã ký số */
export async function markContractSigned(sellerId: string, signedAtIso?: string): Promise<void> {
  const { error } = await supabase
    .from('seller_kyc')
    .update({ contract_signed_at: signedAtIso || new Date().toISOString() })
    .eq('seller_id', sellerId);
  if (error) throw new Error(`Ghi hợp đồng ký lỗi: ${error.message}`);
}

/**
 * CỔNG TỔNG QUÁT KIỂM TRA GATE: seller có được publish sản phẩm không?
 * NĐ 52/85: chỉ seller đã xác minh danh tính + hợp đồng khung mới được bán hàng.
 */
export async function assertSellerCanPublish(sellerId: string): Promise<void> {
  const { data: kyc, error } = await supabase
    .from('seller_kyc')
    .select('status, contract_signed_at, tax_code')
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (error) throw new Error(`Kiểm tra KYC lỗi: ${error.message}`);
  if (!kyc || kyc.status !== 'approved') {
    throw new Error('Seller chưa hoàn tất xác minh danh tính (KYC) — không được đăng bán sản phẩm theo NĐ 52/2013.');
  }
  if (!kyc.contract_signed_at) {
    throw new Error('Chưa ký hợp đồng khung với sàn — không được đăng bán sản phẩm.');
  }
}

export async function getSellerKyc(sellerId: string): Promise<SellerKyc | null> {
  const { data } = await supabase
    .from('seller_kyc')
    .select('*')
    .eq('seller_id', sellerId)
    .maybeSingle();
  return (data as SellerKyc) || null;
}
