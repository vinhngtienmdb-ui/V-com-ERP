import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * GĐ 3.3 — Cache cấu hình nhà cung cấp HĐĐT.
 *
 * Mục tiêu: mỗi lần phát hành / xử lý sai sót hoá đơn không được query lại
 * `integration_configs` liên tục, NHƯNG khi admin đổi nhà cung cấp thì cache
 * phải bị xoá NGAY (đổi provider mà còn cache cũ = phát hành sai mẫu đã đăng ký
 * với CQT — lỗi pháp lý).
 */

const mocks = vi.hoisted(() => ({
  // `any` có chủ đích: mock này phải giả lập được cả 3 dạng cấu hình thật
  // (có providerId · thiếu providerId · null) để test đủ nhánh.
  getIntegrationConfig: vi.fn(async (): Promise<any> => ({ config: { providerId: 'generic' } })),
}));

vi.mock('./integrationConfigService', () => ({
  getIntegrationConfig: mocks.getIntegrationConfig,
  requireReadyProvider: vi.fn(async () => ({})),
  onIntegrationConfigChanged: vi.fn(() => () => {}),
}));

const { configuredEInvoiceProviderId, invalidateEInvoiceProviderCache } = await import('./einvoiceService');

describe('GĐ 3.3 — cache provider HĐĐT', () => {
  beforeEach(() => {
    mocks.getIntegrationConfig.mockClear();
    invalidateEInvoiceProviderCache(); // bắt đầu mỗi test với cache sạch
  });

  it('gọi lặp → CHỈ query DB 1 lần (nhờ cache)', async () => {
    await Promise.all([
      configuredEInvoiceProviderId(),
      configuredEInvoiceProviderId(),
      configuredEInvoiceProviderId(),
      configuredEInvoiceProviderId(),
    ]);

    expect(mocks.getIntegrationConfig).toHaveBeenCalledTimes(1); // ⭐ không có cache = 4 lần
  });

  it('đọc đúng providerId từ cấu hình', async () => {
    mocks.getIntegrationConfig.mockResolvedValueOnce({ config: { providerId: 'viettel' } });
    expect(await configuredEInvoiceProviderId()).toBe('viettel');
  });

  it('chưa cấu hình → null (registry sẽ chọn mặc định generic)', async () => {
    mocks.getIntegrationConfig.mockResolvedValueOnce({ config: {} });
    expect(await configuredEInvoiceProviderId()).toBeNull();
  });

  it('lỗi đọc cấu hình → null, KHÔNG chặn phát hành (fail-soft)', async () => {
    mocks.getIntegrationConfig.mockRejectedValueOnce(new Error('RLS chặn'));
    expect(await configuredEInvoiceProviderId()).toBeNull();
  });

  it('🔴 invalidate → lần gọi sau đọc LẠI DB (đổi provider có hiệu lực ngay)', async () => {
    mocks.getIntegrationConfig.mockResolvedValue({ config: { providerId: 'generic' } });
    expect(await configuredEInvoiceProviderId()).toBe('generic');

    // Admin đổi sang VNPT → hệ thống phải xoá cache
    mocks.getIntegrationConfig.mockResolvedValue({ config: { providerId: 'vnpt' } });
    invalidateEInvoiceProviderCache();

    expect(await configuredEInvoiceProviderId()).toBe('vnpt'); // ⭐ không invalidate → vẫn 'generic'
    expect(mocks.getIntegrationConfig).toHaveBeenCalledTimes(2);
  });
});
