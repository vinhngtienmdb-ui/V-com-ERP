import { requireReadyProvider, getIntegrationConfig } from './integrationConfigService';

/**
 * CQT Reporting + HSM Adapter — NĐ 52/2013 + 85/2021/NĐ-CP
 *
 * 1. notifyMarketplaceOperation: thông báo hoạt động sàn TMĐT với Bộ Công Thương
 *    (bắt buộc khi bắt đầu hoạt động — Điều 8 NĐ 85/2021)
 * 2. submitPeriodicReport: trình báo định kỳ (6 tháng/năm)
 * 3. signWithHsm: ký số tài liệu bằng HSM tổ chức (thay mock /api/mock/hsm-sign-ledger)
 */

export interface BctNotificationResult {
  success: boolean;
  notificationRef?: string;   // mã tiếp nhận của BCT
  submittedAt?: string;
  message?: string;
}

export interface PeriodicReportResult {
  success: boolean;
  reportRef?: string;
  period?: string;
  message?: string;
}

export interface HsmSignResult {
  success: boolean;
  signature?: string;
  signedAt?: string;
  keyId?: string;
  message?: string;
}

/** Thông báo hoạt động sàn TMĐT lên cổng BCT (làm 1 lần khi go-live) */
export async function notifyMarketplaceOperation(payload: {
  companyName: string;
  taxCode: string;
  marketplaceName: string;
  websiteUrl: string;
  operationStartDate: string;
  contactEmail: string;
  contactPhone: string;
}): Promise<BctNotificationResult> {
  await requireReadyProvider('cq_reporting');

  const res = await fetch('/api/cq/notify-bct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message || 'Gửi thông báo BCT thất bại.');
  }
  return {
    success: true,
    notificationRef: data.notificationRef,
    submittedAt: data.submittedAt,
    message: data.message
  };
}

/** Trình báo định kỳ (6 tháng) — số liệu tổng hợp từ BI */
export async function submitPeriodicReport(period: {
  periodStart: string;
  periodEnd: string;
  totalSellers: number;
  totalOrders: number;
  totalGmv: number;
  topCategories: Array<{ category: string; revenue: number }>;
}): Promise<PeriodicReportResult> {
  await requireReadyProvider('cq_reporting');

  const res = await fetch('/api/cq/periodic-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period })
  });
  const data = await res.json();
  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message || 'Trình báo định kỳ thất bại.');
  }
  return {
    success: true,
    reportRef: data.reportRef,
    period: data.period,
    message: data.message
  };
}

/**
 * Ký số bằng HSM thật — thay cho /api/mock/hsm-sign-ledger trong Finance.
 * Dùng cho: ký sổ kế toán khóa kỳ, ký báo cáo, ký bảng đối soát.
 */
export async function signWithHsm(document: {
  type: 'ledger_closing' | 'report' | 'reconciliation';
  referenceId: string;
  contentHash: string;
}): Promise<HsmSignResult> {
  await requireReadyProvider('cq_reporting');

  const res = await fetch('/api/cq/hsm-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document })
  });
  const data = await res.json();
  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message || 'Ký HSM thất bại.');
  }
  return {
    success: true,
    signature: data.signature,
    signedAt: data.signedAt,
    keyId: data.keyId,
    message: data.message
  };
}

/** Sẵn sàng chưa */
export async function isCqReportingReady(): Promise<boolean> {
  try {
    const cfg = await getIntegrationConfig('cq_reporting');
    return !!(cfg?.is_enabled && cfg.config.hsm_endpoint && cfg.config.hsm_key_id);
  } catch {
    return false;
  }
}
