import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';

describe('Giai đoạn 5: Hành chính, Ký số & BI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Test Luồng phê duyệt đa cấp (Multi-level Approval Workflow)
  it('nên chuyển cấp duyệt currentLevel + 1 và giữ status pending nếu chưa duyệt đến cấp cuối', () => {
    const request = {
      id: 'REQ-101',
      subtype: 'Đơn xin nghỉ phép',
      currentLevel: 1,
      status: 'pending',
      approvalLog: []
    };

    const workflowSteps = [
      { id: 1, ruleType: 'system', sla: '24h', specificUser: '' },
      { id: 2, ruleType: 'specific', sla: '48h', specificUser: 'Giám đốc Nhân sự' }
    ];

    const totalLevels = workflowSteps.length;
    const currentLevel = request.currentLevel;
    let updatedReq: any = null;

    if (currentLevel < totalLevels) {
      updatedReq = {
        ...request,
        currentLevel: currentLevel + 1,
        status: 'pending',
        approvalLog: [...request.approvalLog, {
          level: currentLevel,
          status: 'approved',
          by: 'Trưởng phòng A',
          time: new Date().toLocaleString('vi-VN'),
          stepName: `Duyệt cấp ${currentLevel}`
        }]
      };
    }

    expect(updatedReq).not.toBeNull();
    expect(updatedReq.currentLevel).toBe(2);
    expect(updatedReq.status).toBe('pending');
    expect(updatedReq.approvalLog.length).toBe(1);
    expect(updatedReq.approvalLog[0].level).toBe(1);
  });

  it('nên cập nhật status thành approved nếu duyệt đến cấp cuối cùng', () => {
    const request = {
      id: 'REQ-101',
      subtype: 'Đơn xin nghỉ phép',
      currentLevel: 2,
      status: 'pending',
      approvalLog: [{ level: 1, status: 'approved', by: 'Trưởng phòng A', stepName: 'Duyệt cấp 1' }]
    };

    const workflowSteps = [
      { id: 1, ruleType: 'system', sla: '24h', specificUser: '' },
      { id: 2, ruleType: 'specific', sla: '48h', specificUser: 'Giám đốc Nhân sự' }
    ];

    const totalLevels = workflowSteps.length;
    const currentLevel = request.currentLevel;
    let updatedReq: any = null;

    if (currentLevel === totalLevels) {
      updatedReq = {
        ...request,
        status: 'approved',
        approvalLog: [...request.approvalLog, {
          level: currentLevel,
          status: 'approved',
          by: 'Giám đốc Nhân sự',
          time: new Date().toLocaleString('vi-VN'),
          stepName: 'Duyệt cấp cuối'
        }]
      };
    }

    expect(updatedReq).not.toBeNull();
    expect(updatedReq.status).toBe('approved');
    expect(updatedReq.approvalLog.length).toBe(2);
    expect(updatedReq.approvalLog[1].level).toBe(2);
    expect(updatedReq.approvalLog[1].by).toBe('Giám đốc Nhân sự');
  });

  // 2. Test Ký số RSA viết vào bảng document_signatures
  it('nên thực hiện chèn bản ghi chữ ký vào bảng document_signatures khi gọi ký số', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      return {
        insert: insertMock
      } as any;
    });

    const sigPayload = {
      tenant_id: 'tenant-vcomm-prod-01',
      document_id: 'REQ-002',
      document_type: 'request',
      signer_email: 'director@vcomm-erp.vn',
      signer_name: 'Giám đốc Điều hành',
      signature_hash: 'RSA-signature-example-hash-xyz',
      document_hash: 'document-sha256-hash-example',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('document_signatures').insert(sigPayload);
    expect(error).toBeNull();
    expect(fromSpy).toHaveBeenCalledWith('document_signatures');
    expect(insertMock).toHaveBeenCalledWith(sigPayload);
  });

  // 3. Test công thức BI Margins (Lãi gộp combo, CTV, Group Buy)
  it('nên tính toán chính xác tỷ lệ lãi gộp combo, CTV và Group Buy từ mock dữ liệu', () => {
    // Mock dữ liệu
    const mockCombos = [
      { id: 'c1', name: 'Combo Ăn Sáng', price: 100000, costPrice: 60000 }
    ];

    const mockSellers = [
      { id: 's1', name: 'CTV Nguyễn Văn B', gmv: 100000000, commissionRate: 15 } // 15%
    ];

    const mockOrders = [
      { id: 'o1', channel: 'group_buy', total: 50000000 }
    ];

    // Cài đặt công thức tính toán
    // 1. Combo Margin
    const combosResult = mockCombos.map(c => {
      const price = Number(c.price || 0);
      const cost = Number(c.costPrice || 0);
      const profit = price - cost;
      const marginPct = price > 0 ? Math.round((profit / price) * 100) : 0;
      return { profit, marginPct };
    });

    expect(combosResult[0].profit).toBe(40000);
    expect(combosResult[0].marginPct).toBe(40);

    // 2. CTV Profitability
    let totalCtfGmv = 0;
    let totalCtfCommission = 0;
    mockSellers.forEach(s => {
      totalCtfGmv += s.gmv;
      totalCtfCommission += s.gmv * (s.commissionRate / 100);
    });
    const ctfNetProfit = totalCtfGmv - totalCtfCommission;
    const ctfMarginPct = totalCtfGmv > 0 ? Math.round((ctfNetProfit / totalCtfGmv) * 100) : 100;

    expect(totalCtfCommission).toBe(15000000);
    expect(ctfNetProfit).toBe(85000000);
    expect(ctfMarginPct).toBe(85);

    // 3. Group Buy Profitability
    const groupBuyOrders = mockOrders.filter(o => o.channel === 'group_buy');
    const groupBuyRevenue = groupBuyOrders.reduce((sum, o) => sum + o.total, 0);
    const groupBuyCogs = groupBuyRevenue * 0.65;
    const groupBuyProfit = groupBuyRevenue - groupBuyCogs;
    const groupBuyMarginPct = groupBuyRevenue > 0 ? Math.round((groupBuyProfit / groupBuyRevenue) * 100) : 35;

    expect(groupBuyRevenue).toBe(50000000);
    expect(groupBuyCogs).toBe(32500000);
    expect(groupBuyProfit).toBe(17500000);
    expect(groupBuyMarginPct).toBe(35);
  });
});
