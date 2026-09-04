import { supabase } from '../lib/supabase';

/**
 * Integration Config Layer — trung tâm cấu hình API 3 nhà cung cấp.
 * Nguyên tắc:
 * 1. Config lưu DB (bảng integration_configs) — không hardcode env
 * 2. Service đọc qua server.ts proxy (key không lộ ra client bundle)
 * 3. Chưa cấu hình → trạng thái rõ ràng 'not_configured', feature degrade an toàn
 * 4. Mọi save/test/enable ghi audit
 */

export type ProviderKey = 'einvoice' | 'databank' | 'cq_reporting';

export interface IntegrationConfig {
  id: string;
  provider_key: ProviderKey;
  is_enabled: boolean;
  config: Record<string, any>;
  last_tested_at: string | null;
  last_test_status: 'ok' | 'error' | 'untested' | null;
  last_test_message: string | null;
  updated_at: string;
}

export interface ProviderSchema {
  key: ProviderKey;
  label: string;
  legalBasis: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'password' | 'url';
    required: boolean;
    placeholder?: string;
    helpText?: string;
  }>;
}

/** Schema mô tả từng provider — UI render form + server validate từ đây */
export const PROVIDER_SCHEMAS: Record<ProviderKey, ProviderSchema> = {
  einvoice: {
    key: 'einvoice',
    label: 'Hóa đơn điện tử (TT 91/2026/TT-BTC)',
    legalBasis: 'Thông tư 91/2026/TT-BTC — nhà cung cấp được CQT cấp phép (MISA / VNPT / FPT)',
    fields: [
      { name: 'vendor', label: 'Nhà cung cấp', type: 'text', required: true, placeholder: 'misa | vnpt | fpt', helpText: 'Chọn nhà cung cấp e-invoice đã đăng ký mẫu BC22 với CQT' },
      { name: 'endpoint', label: 'API Endpoint', type: 'url', required: true, placeholder: 'https://api.misa.vn/invoice-api/v1' },
      { name: 'api_key', label: 'API Key / Token', type: 'password', required: true },
      { name: 'account_id', label: 'Mã tài khoản (tax_identifier)', type: 'text', required: true, placeholder: '0109123456' },
      { name: 'template_code', label: 'Mẫu số hóa đơn', type: 'text', required: false, placeholder: '1/2024/TT78-MST' },
      { name: 'serial_number', label: 'Ký hiệu hóa đơn', type: 'text', required: false, placeholder: 'AA/24E' }
    ]
  },
  databank: {
    key: 'databank',
    label: 'Databank BCT & Truy xuất nguồn gốc (TT 31/2026/TT-BCT)',
    legalBasis: 'TT 31/2026/TT-BCT (Bộ Công Thương, HL 01/7/2026) — Điều 10 đăng tải công khai thông tin sản phẩm; Điều 17 chuyển tiếp (hệ thống cũ tiếp tục áp dụng đến 01/01/2027); Điều 18 lộ trình (truy xuất đầy đủ từ 01/01/2027). LƯU Ý: TT 13/2023/TT-BCT là văn bản HẠN NGẠCH THUẾ QUAN (muối/trứng), KHÔNG phải truy xuất — không dùng làm căn cứ.',
    fields: [
      { name: 'endpoint', label: 'API Endpoint', type: 'url', required: true, placeholder: 'https://databank.moit.gov.vn/api/v1' },
      { name: 'api_key', label: 'API Key', type: 'password', required: true },
      { name: 'org_code', label: 'Mã tổ chức', type: 'text', required: true, placeholder: 'Mã đơn vị đăng ký với BCT' },
      { name: 'trace_endpoint', label: 'Trace Endpoint (QR nguồn gốc)', type: 'url', required: false, placeholder: 'https://tracuunguongoc.cucthuenoibo.gov.vn/api' }
    ]
  },
  cq_reporting: {
    key: 'cq_reporting',
    label: 'Báo cáo CQT & Chữ ký HSM',
    legalBasis: 'NĐ 52/2013 + 85/2021 — thông báo/trình báo Bộ Công Thương; HSM cho chữ ký số tổ chức',
    fields: [
      { name: 'bct_endpoint', label: 'Cổng thông tin BCT (thông báo sàn)', type: 'url', required: true, placeholder: 'https://moit.gov.vn/api/notifications' },
      { name: 'bct_token', label: 'Token BCT', type: 'password', required: true },
      { name: 'hsm_endpoint', label: 'HSM Endpoint', type: 'url', required: true, placeholder: 'https://hsm.provider.vn/api/v1' },
      { name: 'hsm_key_id', label: 'HSM Key ID', type: 'text', required: true },
      { name: 'hsm_cert', label: 'Certificate Serial', type: 'text', required: false, placeholder: 'Serial chứng thư số tổ chức' }
    ]
  }
};

/* -------------------------------------------------------------------------- */
/*  GĐ 3.3 — Thông báo đổi cấu hình (để module đang cache tự vô hiệu NGAY)      */
/* -------------------------------------------------------------------------- */

export type ConfigChangedListener = (provider: ProviderKey) => void;
const configChangedListeners = new Set<ConfigChangedListener>();

/**
 * Đăng ký nhận thông báo khi cấu hình 1 provider bị đổi (lưu hoặc bật/tắt).
 * Dùng để XOÁ CACHE ngay thay vì chờ TTL — quan trọng với thứ nhạy cảm như nhà
 * cung cấp HĐĐT: đổi provider mà cache còn cũ → phát hành sai mẫu đã đăng ký.
 *
 * Cơ chế listener (thay vì import trực tiếp) để TRÁNH IMPORT VÒNG:
 * einvoiceService → integrationConfigService → einvoiceService.
 *
 * @returns hàm huỷ đăng ký.
 */
export function onIntegrationConfigChanged(fn: ConfigChangedListener): () => void {
  configChangedListeners.add(fn);
  return () => {
    configChangedListeners.delete(fn);
  };
}

function notifyConfigChanged(provider: ProviderKey): void {
  configChangedListeners.forEach((fn) => {
    try {
      fn(provider);
    } catch (err) {
      // Listener lỗi KHÔNG được chặn việc lưu cấu hình.
      console.error('[integrationConfig] listener onChange lỗi:', err);
    }
  });
}

/** Đọc config — trả về null nếu chưa cấu hình */
export async function getIntegrationConfig(provider: ProviderKey): Promise<IntegrationConfig | null> {
  const { data, error } = await supabase
    .from('integration_configs')
    .select('*')
    .eq('provider_key', provider)
    .maybeSingle();

  if (error) throw new Error(`Đọc config ${provider} lỗi: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    provider_key: data.provider_key,
    is_enabled: data.is_enabled,
    config: data.config || {},
    last_tested_at: data.last_tested_at,
    last_test_status: data.last_test_status,
    last_test_message: data.last_test_message,
    updated_at: data.updated_at
  };
}

/** Lưu config — validate required fields theo schema trước khi ghi */
export async function saveIntegrationConfig(
  provider: ProviderKey,
  config: Record<string, any>,
  options: { enable?: boolean; changedBy?: string } = {}
): Promise<void> {
  const schema = PROVIDER_SCHEMAS[provider];
  const missing = schema.fields
    .filter(f => f.required)
    .filter(f => !config[f.name] || String(config[f.name]).trim() === '');
  if (missing.length > 0) {
    throw new Error(`Thiếu trường bắt buộc: ${missing.map(m => m.label).join(', ')}`);
  }

  const { data: existing } = await supabase
    .from('integration_configs')
    .select('id')
    .eq('provider_key', provider)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('integration_configs')
      .update({
        config,
        is_enabled: options.enable ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
    if (error) throw new Error(`Cập nhật config ${provider} lỗi: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('integration_configs')
      .insert({
        provider_key: provider,
        config,
        is_enabled: options.enable ?? true,
        last_test_status: 'untested'
      });
    if (error) throw new Error(`Tạo config ${provider} lỗi: ${error.message}`);
  }

  await auditConfigChange(provider, 'save', { changed_by: options.changedBy, fields: Object.keys(config) });
  // GĐ 3.3: báo cho các module đang cache để chúng vô hiệu NGAY, không chờ TTL.
  notifyConfigChanged(provider);
}

/** Bật/tắt provider không xóa key */
export async function toggleIntegration(provider: ProviderKey, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('integration_configs')
    .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('provider_key', provider);
  if (error) throw new Error(`Bật/tắt ${provider} lỗi: ${error.message}`);
  await auditConfigChange(provider, enabled ? 'enable' : 'disable', {});
  // GĐ 3.3: vô hiệu cache — bật/tắt cũng có thể làm thay đổi provider được chọn.
  notifyConfigChanged(provider);
}

/**
 * Test kết nối: gọi qua server proxy /api/integrations/test
 * (server giữ key, client chỉ gửi tên provider — key không bao giờ ra ngoài)
 */
export async function testIntegrationConnection(provider: ProviderKey): Promise<{
  ok: boolean;
  message: string;
  latency_ms?: number;
}> {
  const started = Date.now();
  try {
    const res = await fetch('/api/integrations/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    });
    const data = await res.json();
    const latency = Date.now() - started;

    const status = data.status === 'success' ? 'ok' : 'error';
    await recordTestResult(provider, status, data.message || '', latency);
    return { ok: status === 'ok', message: data.message, latency_ms: latency };
  } catch (err: any) {
    const message = `Không gọi được server proxy: ${err.message}`;
    await recordTestResult(provider, 'error', message, Date.now() - started);
    return { ok: false, message };
  }
}

async function recordTestResult(provider: ProviderKey, status: 'ok' | 'error', message: string, latencyMs: number) {
  await supabase
    .from('integration_configs')
    .update({
      last_tested_at: new Date().toISOString(),
      last_test_status: status,
      last_test_message: `${message} (${latencyMs}ms)`
    })
    .eq('provider_key', provider);
  await auditConfigChange(provider, 'test', { status, message });
}

async function auditConfigChange(provider: ProviderKey, action: string, summary: Record<string, any>) {
  await supabase.from('integration_config_audit').insert({
    provider_key: provider,
    action,
    summary,
    tenant_id: 'tenant-vcomm-prod-01'
  });
}

/**
 * Gate dùng trong adapter: kiểm tra provider sẵn sàng trước khi gọi API thật.
 * Trả về config nếu enabled + có endpoint; ngược lại throw lỗi hướng dẫn rõ ràng.
 */
export async function requireReadyProvider(provider: ProviderKey): Promise<Record<string, any>> {
  const cfg = await getIntegrationConfig(provider);
  if (!cfg || !cfg.is_enabled) {
    throw new Error(
      `Tích hợp "${PROVIDER_SCHEMAS[provider].label}" chưa được cấu hình. ` +
      `Vào Settings → Integrations để thêm API key.`
    );
  }
  return cfg.config;
}

/** Trạng thái masked để hiển thị UI (không lộ key đầy đủ) */
export function maskConfigForDisplay(config: Record<string, any>): Record<string, any> {
  const masked: Record<string, any> = {};
  for (const [k, v] of Object.entries(config)) {
    masked[k] = typeof v === 'string' && (k.includes('key') || k.includes('token') || k.includes('secret') || k.includes('cert'))
      ? (v.length > 8 ? v.slice(0, 4) + '•'.repeat(Math.max(4, v.length - 8)) + v.slice(-4) : '••••')
      : v;
  }
  return masked;
}
