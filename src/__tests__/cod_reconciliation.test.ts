import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock dbService to test real functions
vi.unmock('../services/dbService');

import { db, setDoc, addDoc } from '../services/dbService';
import { supabase } from '../lib/supabase';
import { reconcileCodStatement } from '../services/codReconciliationService';
import axios from 'axios';

vi.mock('axios');

describe('Logistics COD Reconciliation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.post).mockResolvedValue({ data: { error: 0, message: 'Success' } });
  });

  it('nên hạch toán khớp tiền COD: Nợ 1121 / Có 1311 và cập nhật đơn hàng thành paid', async () => {
    const trackingCode = 'GHTK-MATCH-123';
    
    const selectMock = vi.fn().mockResolvedValue({
      data: {
        id: 'ORD-MATCH-123',
        total: 250000,
        tracking_code: trackingCode,
        tenant_id: 'tenant-vcomm-test',
        customer_id: 'KH-001'
      },
      error: null
    });
    
    const eqMock1 = vi.fn().mockReturnValue({ maybeSingle: selectMock });
    const selectChainMock = vi.fn().mockReturnValue({ eq: eqMock1 });

    const updateMock = vi.fn().mockResolvedValue({ error: null });
    const eqMock2 = vi.fn().mockReturnValue({ error: null });
    const updateChainMock = vi.fn().mockReturnValue({ eq: eqMock2 });

    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      const mockObj = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      };
      if (table === 'orders') {
        mockObj.select = selectChainMock;
        mockObj.update = updateChainMock;
      }
      return mockObj as any;
    });

    const result = await reconcileCodStatement(trackingCode, 250000, 'Giao Hàng Tiết Kiệm');

    expect(result.success).toBe(true);
    expect(result.status).toBe('matched');
    expect(result.difference).toBe(0);

    expect(updateChainMock).toHaveBeenCalledWith(expect.objectContaining({
      payment_status: 'paid',
      cod_reconciliation_status: 'matched'
    }));
  });

  it('nên hạch toán treo phần lệch vào TK Nợ 1388 và gửi cảnh báo ZNS khi nhận thiếu tiền COD', async () => {
    const trackingCode = 'GHTK-DEFICIT-123';
    
    const selectMock = vi.fn().mockResolvedValue({
      data: {
        id: 'ORD-DEFICIT-123',
        total: 300000,
        tracking_code: trackingCode,
        tenant_id: 'tenant-vcomm-test',
        customer_id: 'KH-002'
      },
      error: null
    });
    
    const eqMock1 = vi.fn().mockReturnValue({ maybeSingle: selectMock });
    const selectChainMock = vi.fn().mockReturnValue({ eq: eqMock1 });

    const updateMock = vi.fn().mockResolvedValue({ error: null });
    const eqMock2 = vi.fn().mockReturnValue({ error: null });
    const updateChainMock = vi.fn().mockReturnValue({ eq: eqMock2 });

    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      const mockObj = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      };
      if (table === 'orders') {
        mockObj.select = selectChainMock;
        mockObj.update = updateChainMock;
      }
      return mockObj as any;
    });

    const { saveZnsConfig } = await import('../services/znsService');
    saveZnsConfig({
      oaId: 'live-oa-id',
      appId: 'live-app-id',
      accessToken: 'live-access-token-xyz',
      autoRefresh: true,
      isActive: true
    });

    vi.mocked(axios.post).mockResolvedValue({ data: { error: 0, message: 'Success' } });

    const result = await reconcileCodStatement(trackingCode, 250000, 'Giao Hàng Tiết Kiệm');

    expect(result.success).toBe(true);
    expect(result.status).toBe('discrepancy');
    expect(result.difference).toBe(-50000);

    expect(updateChainMock).toHaveBeenCalledWith(expect.objectContaining({
      payment_status: 'discrepancy',
      cod_reconciliation_status: 'discrepancy'
    }));

    expect(axios.post).toHaveBeenCalledWith(
      '/api/zns/send',
      expect.objectContaining({
        templateId: 'ZNS-004'
      })
    );
  });
});
