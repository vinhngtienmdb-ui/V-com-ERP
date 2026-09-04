import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  defineFlag,
  listFlags,
  isEnabled,
  setOverride,
  resetOverrides,
  isTt99BridgeEnabled,
  FLAG_TT99_BRIDGE,
} from './featureFlags';

const T = 'tenant-vcomm-prod-01';

describe('GĐ 4.3 — feature flags', () => {
  beforeEach(() => {
    defineFlag({ key: 'test_flag', description: 'Flag dùng trong test', defaultValue: false });
  });

  afterEach(() => {
    resetOverrides();
    delete process.env.VCOMM_FLAG_TEST_FLAG;
    delete process.env.VCOMM_FLAG_TT99_BRIDGE;
  });

  it('flag chưa đăng ký → NÉM (tránh typo bị hiểu là false)', () => {
    expect(() => isEnabled('khong_ton_tai')).toThrow(/chưa được đăng ký/);
  });

  it('không env/override → dùng defaultValue', () => {
    expect(isEnabled('test_flag')).toBe(false);
    defineFlag({ key: 'on_by_default', description: '', defaultValue: true });
    expect(isEnabled('on_by_default')).toBe(true);
  });

  it('override thắng env và default', () => {
    process.env.VCOMM_FLAG_TEST_FLAG = 'false';
    setOverride('test_flag', true);
    expect(isEnabled('test_flag')).toBe(true);
  });

  it('env true/false đè default', () => {
    process.env.VCOMM_FLAG_TEST_FLAG = 'true';
    expect(isEnabled('test_flag')).toBe(true);
    process.env.VCOMM_FLAG_TEST_FLAG = 'false';
    expect(isEnabled('test_flag')).toBe(false);
  });

  it('env giá trị rác → ném, không âm thầm hiểu sai', () => {
    process.env.VCOMM_FLAG_TEST_FLAG = 'maybe';
    expect(() => isEnabled('test_flag')).toThrow(/không hợp lệ/);
  });

  it('rollout 100% → bật mọi tenant; 0% → tắt mọi tenant', () => {
    setOverride('test_flag', 100);
    expect(isEnabled('test_flag', { tenantId: T })).toBe(true);
    expect(isEnabled('test_flag', { tenantId: 'tenant-khac' })).toBe(true);

    setOverride('test_flag', 0);
    expect(isEnabled('test_flag', { tenantId: T })).toBe(false);
  });

  it('rollout % → ỔN ĐỊNH (cùng tenant luôn cùng kết quả)', () => {
    setOverride('test_flag', 50);
    const first = isEnabled('test_flag', { tenantId: T });
    for (let i = 0; i < 20; i++) {
      expect(isEnabled('test_flag', { tenantId: T })).toBe(first);
    }
  });

  it('rollout % → phân bố (một số tenant bật, một số tắt)', () => {
    setOverride('test_flag', 50);
    const results = new Set<string>();
    let on = 0;
    for (let i = 0; i < 40; i++) {
      const tid = `tenant-${i}`;
      results.add(tid);
      if (isEnabled('test_flag', { tenantId: tid })) on++;
    }
    expect(on).toBeGreaterThan(0);
    expect(on).toBeLessThan(40); // không phải tất cả
  });

  it('rollout % nhưng THIẾU tenantId → KHÔNG bật (an toàn, không bật ngầm cho tất cả)', () => {
    setOverride('test_flag', 100);
    expect(isEnabled('test_flag', {})).toBe(false);
    expect(isEnabled('test_flag')).toBe(false);
  });

  it('resetOverrides xoá override', () => {
    setOverride('test_flag', true);
    resetOverrides();
    expect(isEnabled('test_flag')).toBe(false);
  });

  it('listFlags liệt kê đủ flag đã đăng ký', () => {
    const keys = listFlags().map(f => f.key);
    expect(keys).toContain('test_flag');
    expect(keys).toContain(FLAG_TT99_BRIDGE);
  });
});

describe('GĐ 4.3 — TT99 bridge rollout', () => {
  afterEach(() => {
    resetOverrides();
    delete process.env.VCOMM_FLAG_TT99_BRIDGE;
  });

  it('mặc định BẬT (giữ nguyên hành vi TT99_BRIDGE_ENABLED = true)', () => {
    expect(isTt99BridgeEnabled(T)).toBe(true);
  });

  it('có thể TẮT hoàn toàn qua env (khi bridge gặp sự cố)', () => {
    process.env.VCOMM_FLAG_TT99_BRIDGE = 'false';
    expect(isTt99BridgeEnabled(T)).toBe(false);
  });

  it('rollout 30% → tenant được chọn bật, tenant khác tắt', () => {
    setOverride(FLAG_TT99_BRIDGE, 30);
    let on = 0;
    for (let i = 0; i < 30; i++) {
      if (isTt99BridgeEnabled(`tenant-${i}`)) on++;
    }
    expect(on).toBeGreaterThan(0);
    expect(on).toBeLessThan(30);
  });
});
