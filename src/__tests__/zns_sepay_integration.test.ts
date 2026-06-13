import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sePayService } from '../services/sepayService';
import { sendZnsNotification, getZnsConfig, saveZnsConfig, refreshZnsToken } from '../services/znsService';
import { safeLocalStorage } from '../lib/storage';
import axios from 'axios';
import { addDoc, setDoc } from '../lib/firebase';

vi.mock('axios');

describe('Tích hợp Zalo ZNS & SePay Webhook Integration Tests', () => {
  beforeEach(() => {
    safeLocalStorage.removeItem('vcomm_zns_config');
    safeLocalStorage.removeItem('vcomm_zns_logs');
    vi.clearAllMocks();
  });

  it('nên gọi API webhook events của local backend để kiểm tra giao dịch', async () => {
    const mockEvents = [
      { id: 101, transactionContent: 'IPOS_PAY_1717329000', transferAmount: 50000 }
    ];
    vi.mocked(axios.get).mockResolvedValue({ data: { events: mockEvents } });

    const events = await sePayService.getWebhookEvents();
    expect(axios.get).toHaveBeenCalledWith('/api/sepay/webhook-events');
    expect(events).toEqual(mockEvents);
  });

  it('nên gọi API dọn dẹp các webhook events đã xử lý thành công', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success' } });

    await sePayService.clearWebhookEvents([101, 102]);
    expect(axios.post).toHaveBeenCalledWith(
      '/api/sepay/webhook-events/clear',
      { ids: [101, 102] }
    );
  });

  it('gửi ZNS chế độ Live nên đi qua proxy API backend', async () => {
    // Config ZNS mode live
    saveZnsConfig({
      oaId: 'live-oa-id',
      appId: 'live-app-id',
      accessToken: 'live-access-token-xyz', // Không chứa chữ 'simulated'
      autoRefresh: true,
      isActive: true
    });

    vi.mocked(axios.post).mockResolvedValue({ data: { error: 0, message: 'Success' } });

    const log = sendZnsNotification('0987654321', 'ZNS_ORDER_CONFIRMED', {
      'Tên_Khách_Hàng': 'Nguyễn Văn A',
      'Mã_Đơn_Hàng': 'ORD-999',
      'Tổng_Tiền': '150,000 đ',
      'Trạng_Thái': 'Đã xác nhận'
    }, {
      customerName: 'Nguyễn Văn A',
      orderId: 'ORD-999'
    });

    // Trả về log lập tức
    expect(log.recipientPhone).toBe('0987654321');
    expect(log.status).toBe('sent'); // Trạng thái ban đầu

    // Đợi microtask kết thúc để cuộc gọi async axios.post được gọi
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(axios.post).toHaveBeenCalledWith(
      '/api/zns/send',
      expect.objectContaining({
        phone: '84987654321',
        templateId: 'ZNS-001',
        accessToken: 'live-access-token-xyz'
      })
    );
  });

  it('gửi ZNS chế độ Mock nên tự động chạy offline fallback', async () => {
    // Config ZNS mode simulated
    saveZnsConfig({
      oaId: 'mock-oa-id',
      appId: 'mock-app-id',
      accessToken: 'simulated-token-xyz', // Chứa chữ 'simulated'
      autoRefresh: true,
      isActive: true
    });

    // Clear call history to ignore config sync posts
    vi.mocked(axios.post).mockClear();

    const log = sendZnsNotification('0987654321', 'ZNS_ORDER_CONFIRMED', {
      'Tên_Khách_Hàng': 'Nguyễn Văn A',
      'Mã_Đơn_Hàng': 'ORD-999',
      'Tổng_Tiền': '150,000 đ',
      'Trạng_Thái': 'Đã xác nhận'
    }, {
      customerName: 'Nguyễn Văn A',
      orderId: 'ORD-999'
    });

    expect(log.status).toBe('sent');
    
    // axios.post for ZNS send should not be called (config sync is fine)
    expect(axios.post).not.toHaveBeenCalledWith('/api/zns/send', expect.any(Object));
  });

  it('nên hỗ trợ làm mới token Zalo OA khi gọi refreshZnsToken', async () => {
    // Cấu hình live mode
    saveZnsConfig({
      oaId: 'live-oa-id',
      appId: 'live-app-id',
      accessToken: 'live-access-token-xyz',
      refreshToken: 'live-refresh-token-123', // không chứa chữ simulated
      autoRefresh: true,
      isActive: true
    });

    const mockResponse = { access_token: 'new-live-access-token', refresh_token: 'new-live-refresh-token', expires_in: 90000 };
    vi.mocked(axios.post).mockResolvedValue({ data: mockResponse });

    const updated = await refreshZnsToken();
    expect(axios.post).toHaveBeenCalledWith(
      '/api/zns/refresh',
      expect.objectContaining({
        refreshToken: 'live-refresh-token-123',
        appId: 'live-app-id'
      })
    );
    expect(updated.accessToken).toBe('new-live-access-token');
    expect(updated.refreshToken).toBe('new-live-refresh-token');

    const saved = getZnsConfig();
    expect(saved.accessToken).toBe('new-live-access-token');
  });

  it('useSepayListener nên tự động hạch toán kế toán và tạo hóa đơn khi nhận webhook', async () => {
    const mockEvents = [
      { id: 901, transactionContent: 'IPOS_PAY_ORD123', transferAmount: 250000, bankAccountNumber: '999888777' }
    ];
    vi.mocked(axios.get).mockResolvedValue({ data: { events: mockEvents } });
    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success' } });

    // Spy on global.setInterval to extract the polling callback
    let checkCallback: any = null;
    const setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation((cb: any) => {
      checkCallback = cb;
      return 123 as any;
    });

    // Clear addDoc & setDoc mock calls
    (addDoc as any).mockClear();
    (setDoc as any).mockClear();

    const { getDoc } = await import('../lib/firebase');
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ id: 'IPOS_PAY_ORD123' })
    } as any);

    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { useSepayListener } = await import('../hooks/useSepayListener');

    const TestComponent = () => {
      useSepayListener();
      return null;
    };

    const container = document.createElement('div');
    const root = createRoot(container);
    root.render(React.createElement(TestComponent));

    // Wait for mount & useEffect execution
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(checkCallback).not.toBeNull();

    // Clear mock post calls (like config syncs) to start fresh
    vi.mocked(axios.post).mockClear();

    // Call the check function directly
    await checkCallback();

    // Wait for internal async operations of checkCallback to run
    await new Promise(resolve => setTimeout(resolve, 20));

    // Verify accounting record in Firestore
    expect(addDoc).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        orderId: 'IPOS_PAY_ORD123',
        amount: 250000,
        type: 'income',
        category: 'Doanh thu bán hàng',
        creditAccount: '1311'
      })
    );

    // Verify native double-entry ledger hạch toán in journal_entries
    expect(setDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        id: 'JE-SP-901',
        ref: 'IPOS_PAY_ORD123',
        items: expect.arrayContaining([
          expect.objectContaining({ accountId: '1121', debit: 250000, credit: 0 }),
          expect.objectContaining({ accountId: '1311', debit: 0, credit: 250000 })
        ])
      })
    );

    // Verify SePay invoice creation
    expect(axios.post).toHaveBeenCalledWith(
      '/api/sepay/einvoice/create',
      expect.objectContaining({
        order_id: 'IPOS_PAY_ORD123',
        amount: 250000
      }),
      expect.any(Object)
    );

    setIntervalSpy.mockRestore();
    root.unmount();
  });

  it('useSepayListener nên hạch toán tạm vào TK 3388 và gửi cảnh báo ZNS khi đối soát đơn hàng thất bại', async () => {
    const mockEvents = [
      { id: 902, transactionContent: 'Chuyen khoan nguoi dung tu do', transferAmount: 500000, bankAccountNumber: '999888777' }
    ];
    vi.mocked(axios.get).mockResolvedValue({ data: { events: mockEvents } });
    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success' } });

    // Spy on global.setInterval to extract the polling callback
    let checkCallback: any = null;
    const setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation((cb: any) => {
      checkCallback = cb;
      return 456 as any;
    });

    // Clear addDoc & setDoc mock calls
    (addDoc as any).mockClear();
    (setDoc as any).mockClear();

    const { getDoc } = await import('../lib/firebase');
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false
    } as any);

    // Config ZNS ở chế độ Live để axios.post được gọi
    const { saveZnsConfig } = await import('../services/znsService');
    saveZnsConfig({
      oaId: 'live-oa-id',
      appId: 'live-app-id',
      accessToken: 'live-access-token-xyz', // Không chứa chữ simulated
      autoRefresh: true,
      isActive: true
    });

    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { useSepayListener } = await import('../hooks/useSepayListener');

    const TestComponent = () => {
      useSepayListener();
      return null;
    };

    const container = document.createElement('div');
    const root = createRoot(container);
    root.render(React.createElement(TestComponent));

    // Wait for mount & useEffect execution
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(checkCallback).not.toBeNull();

    // Clear mock post calls (like config syncs) to start fresh
    vi.mocked(axios.post).mockClear();

    // Call the check function directly
    await checkCallback();

    // Wait for internal async operations of checkCallback to run
    await new Promise(resolve => setTimeout(resolve, 20));

    // Verify accounting record in Firestore
    expect(addDoc).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        orderId: '',
        amount: 500000,
        type: 'income',
        category: 'Doanh thu bán hàng',
        creditAccount: '3388' // Hạch toán tạm treo
      })
    );

    // Verify native double-entry ledger hạch toán in journal_entries (tạm treo Có 3388)
    expect(setDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        id: 'JE-SP-902',
        ref: 'SEPAY-902',
        items: expect.arrayContaining([
          expect.objectContaining({ accountId: '1121', debit: 500000, credit: 0 }),
          expect.objectContaining({ accountId: '3388', debit: 0, credit: 500000 })
        ])
      })
    );

    // Đợi microtask kết thúc để cuộc gọi gửi ZNS async hoàn tất
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify ZNS notification request
    expect(axios.post).toHaveBeenCalledWith(
      '/api/zns/send',
      expect.objectContaining({
        templateId: 'ZNS-004' // templateId mapped for ZNS_TICKET_REPLIED
      })
    );

    setIntervalSpy.mockRestore();
    root.unmount();
  });
});
