import { supabase } from '../lib/supabase';

/**
 * Legal Entity Config — Single Source of Truth thông tin pháp nhân công ty
 * vận hành sàn. Dùng chung cho:
 * - Trang công khai Điều 21 NĐ 52/2013 (PublicLegalInfo)
 * - Hóa đơn điện tử TT 78/2021 (einvoiceService — MST bắt buộc đúng)
 * - Thông báo BCT (NĐ 85/2021 Điều 8)
 *
 * Lưu bảng tenant_settings (key='legal_entity', JSONB). Chưa cấu hình →
 * fallback DEFAULT (giá trị đang khai báo tạm) + cảnh báo rõ trong UI.
 */

export interface LegalEntityInfo {
  marketplaceName: string;
  legalEntity: string;
  taxCode: string;
  businessLicense: string;     // GPKD số... do Sở KH&ĐT ... cấp
  headquarters: string;
  hotline: string;
  email: string;
  legalRep: string;            // Người đại diện pháp luật
  registrationDate: string;
}

export const DEFAULT_LEGAL_ENTITY: LegalEntityInfo = {
  marketplaceName: 'VComm Marketplace',
  legalEntity: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ VCOMM',
  taxCode: '0109123456',
  businessLicense: 'GPKD số 0109123456 do Sở KH&ĐT TP. Hà Nội cấp ngày 15/03/2024',
  headquarters: 'Tầng 5, Tòa nhà Innovation, Công viên phần mềm Quang Trung, P. Tân Chánh Hiệp, Q.12, TP. Hồ Chí Minh',
  hotline: '1900 1234',
  email: 'support@vcomm.vn',
  legalRep: 'Nguyễn Văn A — Tổng Giám đốc',
  registrationDate: '15/03/2024'
};

const TENANT_ID = 'tenant-vcomm-prod-01';
const SETTING_KEY = 'legal_entity';

/** Đọc thông tin pháp nhân — merge DB đè lên default (config một phần vẫn chạy) */
export async function getLegalEntityInfo(): Promise<LegalEntityInfo> {
  try {
    const { data, error } = await supabase
      .from('tenant_settings')
      .select('data')
      .eq('id', SETTING_KEY)
      .maybeSingle();

    if (error || !data?.data) return DEFAULT_LEGAL_ENTITY;

    const stored = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
    return { ...DEFAULT_LEGAL_ENTITY, ...stored };
  } catch (err) {
    console.warn('[LegalEntity] Không đọc được config, dùng default:', err);
    return DEFAULT_LEGAL_ENTITY;
  }
}

/** Lưu thông tin pháp nhân (validate MST 10-14 số trước) */
export async function saveLegalEntityInfo(info: Partial<LegalEntityInfo>): Promise<LegalEntityInfo> {
  if (info.taxCode !== undefined) {
    const mst = String(info.taxCode).replace(/\s/g, '');
    if (!/^\d{10}(\d{3})?$/.test(mst)) {
      throw new Error('Mã số thuế không hợp lệ (10 số, hoặc 13 số chi nhánh).');
    }
  }
  if (info.legalEntity !== undefined && !String(info.legalEntity).trim()) {
    throw new Error('Tên pháp nhân không được rỗng.');
  }

  const merged = { ...(await getLegalEntityInfo()), ...info };

  const { error } = await supabase
    .from('tenant_settings')
    .upsert({
      id: SETTING_KEY,
      tenant_id: TENANT_ID,
      data: merged
    });
  if (error) throw new Error(`Lưu thông tin pháp nhân lỗi: ${error.message}`);
  return merged;
}

/** E-invoice legalInfo — shape einvoiceService dùng */
export async function getEInvoiceLegalInfo(): Promise<{
  companyName: string; taxCode: string; address: string;
}> {
  const info = await getLegalEntityInfo();
  return {
    companyName: info.legalEntity,
    taxCode: info.taxCode,
    address: info.headquarters
  };
}
