import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock dbService to test real functions
vi.unmock('../services/dbService');

import { recordPartnerLedgerEntry } from '../services/dbService';
import { supabase } from '../lib/supabase';

describe('Partner Ledgers Verification Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nên tự động ghi sổ chi tiết công nợ khi duyệt đối soát hoa hồng hoặc yêu cầu rút tiền', async () => {
    const selectMock = vi.fn().mockResolvedValue({
      data: {
        balance: 100000000
      },
      error: null
    });

    const insertMock = vi.fn().mockResolvedValue({ error: null });

    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      const mockObj = {
        select: vi.fn().mockReturnThis(),
        insert: insertMock,
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      };
      if (table === 'partner_ledgers') {
        mockObj.select = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: selectMock
              })
            })
          })
        });
      }
      return mockObj as any;
    });

    const newBalance = await recordPartnerLedgerEntry({
      partnerId: 'partner-seller-999',
      partnerType: 'seller',
      refType: 'withdrawal',
      refId: 'wdr-999',
      debit: 20000000,
      credit: 0
    });

    expect(newBalance).toBe(80000000);

    expect(fromSpy).toHaveBeenCalledWith('partner_ledgers');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        partner_id: 'partner-seller-999',
        partner_type: 'seller',
        ref_type: 'withdrawal',
        ref_id: 'wdr-999',
        debit: 20000000,
        credit: 0,
        balance: 80000000
      })
    );
  });
});
