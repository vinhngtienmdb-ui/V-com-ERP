import { requireReadyProvider, getIntegrationConfig } from './integrationConfigService';

/**
 * Databank Adapter — TT 13/2023/TT-BCT + truy xuất nguồn gốc hàng hóa
 *
 * Chức năng:
 * 1. publishProductToDatabank: đăng tải công khai thông tin sản phẩm theo TT 13/2023
 *    (chủ thể kinh doanh có trách nhiệm đăng tải công khai thông tin trước khi bán)
 * 2. verifyProductOrigin: kiểm tra chuỗi truy xuất nguồn gốc
 * 3. generateTraceQrPayload: tạo payload QR dán lên sản phẩm/bao bì
 *
 * Chưa add key → trả 'not_configured', PIM hiển thị badge hướng dẫn.
 */

export interface DatabankPublishResult {
  success: boolean;
  databankRef?: string;   // mã hồ sơ trên databank BCT
  publicUrl?: string;      // link công khai thông tin sản phẩm
  message?: string;
}

export interface OriginVerificationResult {
  success: boolean;
  verified: boolean;
  originInfo?: {
    manufacturer?: string;
    manufactureCountry?: string;
    importDocs?: string[];
    logisticsChain?: Array<{ stage: string; at: string; actor: string }>;
  };
  message?: string;
}

/** Đăng tải sản phẩm lên databank BCT (TT 13/2023 Điều 10) */
export async function publishProductToDatabank(product: {
  id: string;
  name: string;
  sku?: string;
  category: string;
  brand?: string;
  manufacturer?: string;
  originCountry?: string;
  specs?: any;
  images?: string[];
  price: number;
}): Promise<DatabankPublishResult> {
  await requireReadyProvider('databank');

  const res = await fetch('/api/databank/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product })
  });
  const data = await res.json();

  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message || 'Đăng tải databank thất bại.');
  }
  return {
    success: true,
    databankRef: data.databankRef,
    publicUrl: data.publicUrl,
    message: data.message
  };
}

/** Kiểm tra hồ sơ truy xuất nguồn gốc của 1 sản phẩm */
export async function verifyProductOrigin(sku: string): Promise<OriginVerificationResult> {
  await requireReadyProvider('databank');

  const res = await fetch(`/api/databank/verify-origin?sku=${encodeURIComponent(sku)}`);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Truy vấn nguồn gốc thất bại.');
  return {
    success: true,
    verified: data.verified,
    originInfo: data.originInfo,
    message: data.message
  };
}

/**
 * Payload QR truy xuất nguồn gốc — in lên bao bì.
 * QR trỏ về trang /trace/{token} của sàn; trang đó gọi verifyProductOrigin.
 */
export async function generateTraceQrPayload(sku: string, appUrl: string): Promise<{
  qrPayload: string;
  traceToken: string;
}> {
  await requireReadyProvider('databank');

  const res = await fetch('/api/databank/trace-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku })
  });
  const data = await res.json();
  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message || 'Tạo token truy xuất thất bại.');
  }
  return {
    qrPayload: `${appUrl}/trace/${data.traceToken}`,
    traceToken: data.traceToken
  };
}

/** Sẵn sàng chưa (UI badge) */
export async function isDatabankReady(): Promise<boolean> {
  try {
    const cfg = await getIntegrationConfig('databank');
    return !!(cfg?.is_enabled && cfg.config.endpoint && cfg.config.api_key);
  } catch {
    return false;
  }
}
