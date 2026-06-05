import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sePayService } from '../services/sepayService';
import { safeLocalStorage } from '../lib/storage';
import axios from 'axios';

vi.mock('axios');

describe('SePay Service Tests', () => {
  beforeEach(() => {
    safeLocalStorage.removeItem('api_sepay_api_token');
    vi.clearAllMocks();
  });

  it('nên sinh đường dẫn mã VietQR động chuẩn xác', () => {
    const amount = 50000;
    const description = 'ORD-1002';
    const qrUrl = sePayService.createPaymentQR(amount, description);
    expect(qrUrl).toContain('https://img.vietqr.io/image/');
    expect(qrUrl).toContain('amount=50000');
    expect(qrUrl).toContain('addInfo=ORD1002');
  });

  it('nên gọi API lịch sử giao dịch ngân hàng với header chứa mã xác thực', async () => {
    safeLocalStorage.setItem('api_sepay_api_token', 'sepay-token-xyz');
    const mockTx = [{ id: 'tx-1', amount_in: 50000, transaction_content: 'ORD-1002' }];
    vi.mocked(axios.get).mockResolvedValue({ data: { transactions: mockTx } });

    const txs = await sePayService.getTransactions({ limit: 10 });
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/sepay/transactions'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sepay-token-xyz'
        })
      })
    );
    expect(txs).toEqual(mockTx);
  });

  it('nên gọi API kích hoạt SoundBox thông báo giọng nói', async () => {
    safeLocalStorage.setItem('api_sepay_api_token', 'sepay-token-xyz');
    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success' } });

    const res = await sePayService.triggerSoundBox(15000, 'Cafe Sua', 'box-111');
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/soundbox/trigger'),
      expect.objectContaining({
        amount: 15000,
        content: 'Cafe Sua',
        box_id: 'box-111'
      }),
      expect.any(Object)
    );
    expect(res.status).toBe('success');
  });

  it('nên gọi API tạo tài khoản định danh ảo Virtual Account', async () => {
    safeLocalStorage.setItem('api_sepay_api_token', 'sepay-token-xyz');
    const mockVa = { account_number: '999123', bank_name: 'VCB', account_name: 'V-ERP' };
    vi.mocked(axios.post).mockResolvedValue({ data: mockVa });

    const va = await sePayService.createVirtualAccount('ORD-1003', 120000);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/virtual-account/create'),
      { order_id: 'ORD-1003', amount: 120000 },
      expect.any(Object)
    );
    expect(va).toEqual(mockVa);
  });
});
