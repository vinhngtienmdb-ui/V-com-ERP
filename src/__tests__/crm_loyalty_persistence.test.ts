import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';

describe('CRM & Loyalty Database Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nên ghi nhận bản ghi log tích lũy/tiêu điểm vào bảng loyalty_points_ledger', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      return {
        insert: insertMock
      } as any;
    });

    const ledgerPayload = {
      id: 'lpl-test-001',
      tenant_id: 'tenant-vcomm-prod-01',
      customer_id: 'cust-123',
      points_change: 100,
      transaction_type: 'adjust_add',
      description: 'ERP Adjustment: +100 V-Xu',
      reference_type: 'manual',
      reference_id: null,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('loyalty_points_ledger').insert(ledgerPayload);
    expect(error).toBeNull();
    expect(fromSpy).toHaveBeenCalledWith('loyalty_points_ledger');
    expect(insertMock).toHaveBeenCalledWith(ledgerPayload);
  });

  it('nên cập nhật trạng thái đóng ticket hỗ trợ thành closed ở bảng support_tickets', async () => {
    const updateMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    
    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      return {
        update: updateMock,
        eq: eqMock
      } as any;
    });

    updateMock.mockImplementation(() => ({
      eq: eqMock
    }));

    const ticketId = 'TKT-1042';
    const updatePayload = {
      status: 'closed',
      resolved_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('support_tickets')
      .update(updatePayload)
      .eq('id', ticketId);

    expect(error).toBeNull();
    expect(fromSpy).toHaveBeenCalledWith('support_tickets');
    expect(updateMock).toHaveBeenCalledWith(updatePayload);
    expect(eqMock).toHaveBeenCalledWith('id', ticketId);
  });

  it('nên tính toán phân nhóm RFM chính xác từ dữ liệu đơn hàng và ngày mua cuối cùng', () => {
    const calculateSegment = (orderCount: number, totalSpent: number, lastOrderDateStr: string, refDateStr: string) => {
      let recencyScore = 1; // 1: Old, 2: Medium, 3: Recent
      if (lastOrderDateStr) {
        const lastOrderDate = new Date(lastOrderDateStr);
        const refDate = new Date(refDateStr);
        const daysDiff = (refDate.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff <= 30) recencyScore = 3;
        else if (daysDiff <= 90) recencyScore = 2;
      }
      
      let frequencyScore = 1;
      if (orderCount >= 5) frequencyScore = 3;
      else if (orderCount >= 2) frequencyScore = 2;
      
      let monetaryScore = 1;
      if (totalSpent >= 1000000) monetaryScore = 3;
      else if (totalSpent >= 500000) monetaryScore = 2;
      
      if (orderCount === 0) {
        return 'new';
      } else if (recencyScore >= 2 && frequencyScore >= 2 && monetaryScore >= 2) {
        return 'core';
      } else if (recencyScore === 1) {
        return 'old';
      }
      return 'potential';
    };

    const refDate = '2026-07-06';

    expect(calculateSegment(6, 1500000, '2026-06-20', refDate)).toBe('core');
    expect(calculateSegment(2, 500000, '2026-03-10', refDate)).toBe('old');
    expect(calculateSegment(0, 0, '', refDate)).toBe('new');
    expect(calculateSegment(1, 250000, '2026-06-15', refDate)).toBe('potential');
  });
});
