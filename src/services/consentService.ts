import { supabase } from '../lib/supabase';

/**
 * Consent Center — Luật Bảo vệ dữ liệu cá nhân 86/2025/QH15 (hiệu lực 1/1/2026)
 * thay thế NĐ 13/2023.
 *
 * Yêu cầu chính:
 * 1. Ghi nhận sự đồng ý (consent) theo TỪNG mục đích xử lý, phân biệt rõ
 * 2. Mỗi thay đổi consent lưu version chính sách đang áp dụng
 * 3. Người dùng có quyền rút consent bất kỳ lúc nào (opt-out 1 click)
 * 4. DSAR: quyền truy cập, xuất dữ liệu (PDF/JSON), xóa dữ liệu
 * 5. Hồ sơ xử lý (record of processing activities) + DPIA cho xử lý rủi ro cao
 */

export type ConsentPurpose =
  | 'order_processing'      // xử lý đơn hàng (bắt buộc — hợp đồng)
  | 'marketing'            // email/SMS khuyến mãi
  | 'profiling'             // phân tích hành vi mua sắm, RFM
  | 'third_party_sharing'  // chia sẻ logistics/đối tác vận chuyển
  | 'data_retention_archive'; // lưu trữ dài hạn sau khi tài khoản đóng

export type ConsentAction = 'grant' | 'withdraw' | 'expire';

export interface ConsentRecord {
  id: string;
  subject_id: string;           // user id
  subject_email: string;
  purpose: ConsentPurpose;
  action: ConsentAction;
  policy_version: string;        // version chính sách privacy tại thời điểm đồng ý
  evidence: string | null;       // IP, user agent, timestamp click
  consent_given_at: string | null;
  consent_withdrawn_at: string | null;
}

/** Version chính sách hiện tại — cập nhật khi thay đổi chính sách */
export const CURRENT_POLICY_VERSION = '2026.1';

const MANDATORY_PURPOSES: ConsentPurpose[] = ['order_processing'];

export function isMandatoryPurpose(purpose: ConsentPurpose): boolean {
  return MANDATORY_PURPOSES.includes(purpose);
}

/** Ghi nhận đồng ý — mandatory purpose không thể withdraw trực tiếp */
export async function grantConsent(params: {
  subjectId: string;
  subjectEmail: string;
  purpose: ConsentPurpose;
  evidence?: string;
}): Promise<ConsentRecord> {
  const { data, error } = await supabase
    .from('data_consents')
    .insert({
      subject_id: params.subjectId,
      subject_email: params.subjectEmail,
      purpose: params.purpose,
      action: 'grant',
      policy_version: CURRENT_POLICY_VERSION,
      evidence: params.evidence || null,
      consent_given_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(`Ghi consent lỗi: ${error.message}`);
  return data as ConsentRecord;
}

/** Rút consent — CHẶN rút mục đích bắt buộc (xử lý đơn hàng theo hợp đồng) */
export async function withdrawConsent(subjectId: string, purpose: ConsentPurpose): Promise<void> {
  if (isMandatoryPurpose(purpose)) {
    throw new Error('Mục đích xử lý đơn hàng là bắt buộc theo hợp đồng — không thể rút đồng ý trực tiếp (Luật 86/2025 Điều 13).');
  }

  const { error } = await supabase
    .from('data_consents')
    .insert({
      subject_id: subjectId,
      purpose,
      action: 'withdraw',
      policy_version: CURRENT_POLICY_VERSION,
      consent_withdrawn_at: new Date().toISOString()
    });
  if (error) throw new Error(`Rút consent lỗi: ${error.message}`);
}

/** Trạng thái consent hiện tại của 1 người dùng (lấy record mới nhất theo purpose) */
export async function getConsentStatus(subjectId: string): Promise<Record<ConsentPurpose, boolean>> {
  const { data, error } = await supabase
    .from('data_consents')
    .select('purpose, action, consent_given_at, consent_withdrawn_at')
    .eq('subject_id', subjectId)
    .order('consent_given_at', { ascending: false });

  if (error) throw new Error(`Truy vấn consent lỗi: ${error.message}`);

  const status = {
    order_processing: false,
    marketing: false,
    profiling: false,
    third_party_sharing: false,
    data_retention_archive: false
  } as Record<ConsentPurpose, boolean>;

  const seen = new Set<string>();
  for (const row of (data || []) as any[]) {
    if (seen.has(row.purpose)) continue; // chỉ record mới nhất mỗi purpose
    seen.add(row.purpose);
    const granted = row.action === 'grant' && !row.consent_withdrawn_at;
    if (row.purpose in status) status[row.purpose as ConsentPurpose] = granted;
  }
  // order_processing: không có record coi như chưa đồng ý (default false — opt-in)
  return status;
}

/**
 * DSAR — XUẤT DỮ LIỆU (Art. Truy cập dữ liệu cá nhân)
 * Tổng hợp toàn bộ dữ liệu cá nhân liên quan user từ các bảng chính.
 */
export async function exportSubjectData(subjectId: string, email: string) {
  const safe = (p: any) => (p as any).catch(() => null);

  const [customers, orders, tickets, loyalty, consents] = await Promise.all([
    safe(supabase.from('customers').select('*').or(`id.eq.${subjectId},email.eq.${email}`)),
    safe(supabase.from('orders').select('*').eq('customer_id', subjectId)),
    safe(supabase.from('support_tickets').select('*').eq('customer_id', subjectId)),
    safe(supabase.from('loyalty_points_ledger').select('*').eq('customer_id', subjectId)),
    safe(supabase.from('data_consents').select('*').eq('subject_id', subjectId))
  ]);

  return {
    exported_at: new Date().toISOString(),
    policy_version: CURRENT_POLICY_VERSION,
    subject_id: subjectId,
    profile: customers?.data || [],
    orders: orders?.data || [],
    support_tickets: tickets?.data || [],
    loyalty_ledger: loyalty?.data || [],
    consents: consents?.data || []
  };
}

/**
 * DSAR — XÓA DỮ LIỆU (quyền bị quên)
 * Chỉ xóa dữ liệu phi nghiệp vụ; giữ dữ liệu bắt buộc theo nghĩa vụ pháp lý
 * (hóa đơn, chứng từ kế toán TT 99/2025 — lưu tối thiểu 10 năm).
 */
export async function requestAccountDeletion(subjectId: string, reason?: string): Promise<string> {
  const { data, error } = await supabase
    .from('dsar_requests')
    .insert({
      subject_id: subjectId,
      request_type: 'deletion',
      status: 'pending_legal_review', // KHÔNG xóa ngay — kiểm tra nghĩa vụ giữ liệu
      reason: reason || null,
      requested_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(`Gửi yêu cầu xóa lỗi: ${error.message}`);
  return (data as any).id;
}

/**
 * Đánh giá DPIA — bắt buộc khi xử lý rủi ro cao (Luật 86 Điều 24)
 * Trả về checklist rủi ro tự động dựa trên loại dữ liệu hệ thống xử lý.
 */
export interface DpiaFinding {
  item: string;
  risk: 'low' | 'medium' | 'high';
  note: string;
  required: boolean;
}

export function assessDpia(processingDescription: {
  hasSensitiveData: boolean;      // chính trị, tôn giáo, sức khỏe, sinh trắc học...
  hasAutomatedDecision: boolean;  // chấm điểm tín dụng seller tự động
  hasLargeScale: boolean;         // > 100k data subjects
  hasMinorData: boolean;          // dữ liệu trẻ em
  crossBorderTransfer: boolean;  // chuyển dữ liệu ra nước ngoài
}): { required: boolean; findings: DpiaFinding[] } {
  const findings: DpiaFinding[] = [];

  if (processingDescription.hasSensitiveData) {
    findings.push({ item: 'Dữ liệu nhạy cảm', risk: 'high', note: 'Bắt buộc có biện pháp bảo vệ đặc biệt và DPIA đầy đủ', required: true });
  }
  if (processingDescription.hasAutomatedDecision) {
    findings.push({ item: 'Quyết định tự động (Seller credit scoring)', risk: 'high', note: 'Phải cung cấp quyền phản đối quyết định tự động + giải trình', required: true });
  }
  if (processingDescription.hasMinorData) {
    findings.push({ item: 'Dữ liệu trẻ em dưới 7 tuổi', risk: 'high', note: 'Bắt buộc đồng ý của cha mẹ/người giám hộ', required: true });
  }
  if (processingDescription.hasLargeScale) {
    findings.push({ item: 'Quy mô lớn (>100k chủ thể)', risk: 'medium', note: 'Cần DPIA + đánh giá định kỳ', required: true });
  }
  if (processingDescription.crossBorderTransfer) {
    findings.push({ item: 'Chuyển dữ liệu xuyên biên giới', risk: 'medium', note: 'Phải tuân thủ Điều 30 — quy định chuyển dữ liệu ra nước ngoài', required: true });
  }
  if (findings.length === 0) {
    findings.push({ item: 'Xử lý thông thường', risk: 'low', note: 'Không bắt buộc DPIA nhưng cần ghi hồ sơ xử lý', required: false });
  }

  return { required: findings.some(f => f.required && f.risk === 'high'), findings };
}
