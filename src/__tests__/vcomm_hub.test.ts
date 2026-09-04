import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock toàn bộ tầng DB — test logic nghiệp vụ, không test persistence
vi.mock('../services/dbService', () => ({
  db: {},
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
}));

import { getDocs, getDoc, updateDoc } from '../services/dbService';
import {
  findNearestHub,
  expireStalePackages,
  verifyPickup,
  generatePickupCode,
  verifyPickupCode,
  newQrSecret,
  NO_SHOW_PENALTY_RATE,
  O2O_INSURANCE_FEE,
} from '../services/vcommHubService';
import type { VCommHub, HubShipment } from '../types/erp';

/**
 * O2O (Phần A) — VComm Hub — spec 018
 *
 * Ba quy tắc dễ sai nhất được kiểm chứng ở đây:
 *   1. Định tuyến linh hoạt — trạm đầy/bảo trì phải bị loại khỏi lựa chọn
 *   2. Tự huỷ sau 72h và PHẠT 15% trên tiền thu hộ
 *   3. QR động (TOTP) — mã đúng được nhận, mã sai/mã cũ bị từ chối
 */

const hub = (over: Partial<VCommHub> = {}): VCommHub => ({
  id: 'hub-1',
  tenantId: 'tenant-vcomm-prod-01',
  code: 'HUB-001',
  name: 'Trạm Quận 1',
  type: 'standard',
  provinceCode: 'HCM',
  capacity: 100,
  currentLoad: 0,
  status: 'active',
  ...over,
});

function mockHubs(hubs: VCommHub[]) {
  vi.mocked(getDocs).mockResolvedValue({
    docs: hubs.map(h => ({ id: h.id, data: () => h })),
  } as any);
}

describe('VComm Hub — định tuyến linh hoạt (Đề án E.2)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ưu tiên trạm còn nhiều chỗ trống nhất', async () => {
    mockHubs([
      hub({ id: 'hub-a', name: 'Trạm A', currentLoad: 95 }), // 95% tải
      hub({ id: 'hub-c', name: 'Trạm C', currentLoad: 10 }), // 10% tải
    ]);

    const { hub: best } = await findNearestHub('HCM');
    expect(best?.id).toBe('hub-c');
  });

  it('LOẠI BỎ trạm đã đầy và trạm bảo trì', async () => {
    mockHubs([
      hub({ id: 'hub-full', name: 'Trạm đầy', currentLoad: 100, status: 'full' }),
      hub({ id: 'hub-maint', name: 'Trạm bảo trì', status: 'maintenance' }),
      hub({ id: 'hub-ok', name: 'Trạm tốt', currentLoad: 50 }),
    ]);

    const { hub: best, alternatives } = await findNearestHub('HCM');
    expect(best?.id).toBe('hub-ok');
    // Trạm đầy/bảo trì không được xuất hiện cả ở phương án dự phòng
    expect(alternatives.map(a => a.id)).not.toContain('hub-full');
    expect(alternatives.map(a => a.id)).not.toContain('hub-maint');
  });

  it('trả về null khi không còn trạm nào nhận được', async () => {
    mockHubs([
      hub({ id: 'hub-full', currentLoad: 100, status: 'full' }),
    ]);

    const { hub: best, alternatives } = await findNearestHub('HCM');
    expect(best).toBeNull();
    expect(alternatives).toHaveLength(0);
  });

  it('rơi về trạm tỉnh khác khi tỉnh hiện tại không còn chỗ', async () => {
    mockHubs([
      hub({ id: 'hub-hcm', provinceCode: 'HCM', currentLoad: 100, status: 'full' }),
      hub({ id: 'hub-hn', provinceCode: 'HN', currentLoad: 20 }),
    ]);

    const { hub: best } = await findNearestHub('HCM');
    expect(best?.id).toBe('hub-hn');
  });

  it('lọc theo loại trạm đông lạnh', async () => {
    mockHubs([
      hub({ id: 'hub-std', type: 'standard', currentLoad: 5 }),
      hub({ id: 'hub-frz', type: 'freeze', currentLoad: 50 }),
    ]);

    const { hub: best } = await findNearestHub('HCM', 'freeze');
    expect(best?.id).toBe('hub-frz');
  });
});

describe('VComm Hub — tự huỷ sau 72h & phạt 15% (Đề án E.3)', () => {
  beforeEach(() => vi.clearAllMocks());

  const readyShipment = (over: Partial<HubShipment> = {}): HubShipment => ({
    id: 'shp-1',
    tenantId: 'tenant-vcomm-prod-01',
    hubId: 'hub-1',
    trackingCode: 'TRK-001',
    codAmount: 100000,
    insuranceFee: O2O_INSURANCE_FEE,
    penaltyAmount: 0,
    refundedAmount: 0,
    status: 'ready',
    readyAt: new Date(Date.now() - 73 * 3600 * 1000).toISOString(), // 73h trước
    ...over,
  });

  it('huỷ kiện quá 72h và ghi phạt đúng 15% tiền thu hộ', async () => {
    mockHubs([readyShipment()] as any);
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: 'shp-1', data: () => readyShipment() }],
    } as any);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => hub(),
    } as any);

    const r = await expireStalePackages();

    expect(r.expiredCount).toBe(1);
    expect(r.totalPenalty).toBe(100000 * 0.15);

    const [, payload] = vi.mocked(updateDoc).mock.calls[0] as any[];
    expect(payload.status).toBe('expired');
    expect(payload.penaltyAmount).toBe(15000);
  });

  it('KHÔNG huỷ kiện mới sẵn sàng 1 giờ', async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{
        id: 'shp-2',
        data: () => readyShipment({ readyAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString() }),
      }],
    } as any);

    const r = await expireStalePackages();
    expect(r.expiredCount).toBe(0);
    expect(r.totalPenalty).toBe(0);
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('tổng phạt = tổng 15% của nhiều kiện', async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        { id: 'shp-a', data: () => readyShipment({ id: 'shp-a', codAmount: 200000 }) },
        { id: 'shp-b', data: () => readyShipment({ id: 'shp-b', codAmount: 100000 }) },
      ],
    } as any);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => hub(),
    } as any);

    const r = await expireStalePackages();
    // 200k × 15% + 100k × 15% = 30k + 15k
    expect(r.expiredCount).toBe(2);
    expect(r.totalPenalty).toBe(45000);
  });

  it('tỉ lệ phạt đúng hằng số đã công bố', () => {
    expect(NO_SHOW_PENALTY_RATE).toBe(0.15);
    expect(O2O_INSURANCE_FEE).toBeGreaterThanOrEqual(100);
    expect(O2O_INSURANCE_FEE).toBeLessThanOrEqual(200);
  });
});

describe('VComm Hub — QR động (TOTP)', () => {
  it('mã vừa sinh phải xác thực được ngay', async () => {
    const secret = newQrSecret();
    const now = Date.now();
    const code = await generatePickupCode(secret, now);

    expect(code).toMatch(/^\d{6}$/);
    expect(await verifyPickupCode(secret, code, now)).toBe(true);
  });

  it('từ chối mã sai', async () => {
    const secret = newQrSecret();
    const code = await generatePickupCode(secret, Date.now());
    const wrong = code === '000000' ? '111111' : '000000';

    expect(await verifyPickupCode(secret, wrong, Date.now())).toBe(false);
  });

  it('từ chối mã đã quá hạn (cách 10 phút)', async () => {
    const secret = newQrSecret();
    const issued = Date.now();
    const code = await generatePickupCode(secret, issued);

    // Dung sai chỉ ±1 cửa sổ 30s → 10 phút sau phải bị từ chối
    expect(await verifyPickupCode(secret, code, issued + 10 * 60 * 1000)).toBe(false);
  });

  it('chấp nhận mã trong cửa sổ dung sai 30 giây', async () => {
    const secret = newQrSecret();
    const issued = Date.now();
    const code = await generatePickupCode(secret, issued);

    expect(await verifyPickupCode(secret, code, issued + 30 * 1000)).toBe(true);
  });

  it('mỗi secret sinh ra mã khác nhau', async () => {
    const a = newQrSecret();
    const b = newQrSecret();
    expect(a).not.toBe(b);
  });
});

describe('VComm Hub — xác thực nhận hàng (API dùng chung cho VComm HUB và iPOS)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('trả NOT_FOUND khi mã vận đơn không tồn tại', async () => {
    vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);

    const r = await verifyPickup('TRK-NOPE', '123456');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('NOT_FOUND');
  });

  it('trả NOT_READY khi kiện chưa sẵn sàng nhận', async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{
        id: 'shp-1',
        data: () => ({
          id: 'shp-1', tenantId: 'tenant-vcomm-prod-01', hubId: 'hub-1',
          trackingCode: 'TRK-001', codAmount: 0, insuranceFee: 0,
          penaltyAmount: 0, refundedAmount: 0,
          status: 'in_transit', qrSecret: newQrSecret(),
        }),
      }],
    } as any);

    const r = await verifyPickup('TRK-001', '123456');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('NOT_READY');
  });

  it('trả INVALID_CODE khi mã QR sai', async () => {
    const secret = newQrSecret();
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{
        id: 'shp-1',
        data: () => ({
          id: 'shp-1', tenantId: 'tenant-vcomm-prod-01', hubId: 'hub-1',
          trackingCode: 'TRK-001', codAmount: 0, insuranceFee: 0,
          penaltyAmount: 0, refundedAmount: 0,
          status: 'ready', qrSecret: secret,
        }),
      }],
    } as any);

    const correct = await generatePickupCode(secret, Date.now());
    const wrong = correct === '000000' ? '111111' : '000000';

    const r = await verifyPickup('TRK-001', wrong);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('INVALID_CODE');
  });
});
