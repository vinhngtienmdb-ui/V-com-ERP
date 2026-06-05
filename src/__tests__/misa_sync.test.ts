import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMisaConfig,
  saveMisaConfig,
  syncCustomerToMisa,
  syncTransactionToMisa,
  syncVendorToMisa,
  syncOrderToMisa,
  syncProductToMisa,
  syncEmployeeToMisa,
  syncPayrollToMisa,
  unpostTransaction
} from '../services/misaService';
import { safeLocalStorage } from '../lib/storage';
import axios from 'axios';
import { addDoc, getDoc, updateDoc, doc } from '../lib/firebase';

vi.mock('axios');

describe('MISA Accounting Mapping & Sync Integration Tests', () => {
  beforeEach(() => {
    safeLocalStorage.setItem('vcom_misa_config', JSON.stringify({
      appId: 'vcom_misa_integration_2026',
      accessToken: 'simulated_misa_access_token_abc123',
      isActive: true,
      debitAccountDefault: '1121',
      creditAccountDefault: '5111',
      revenueAccountDefault: '5111',
      receivableAccountDefault: '1311',
      cashAccountDefault: '1111',
      taxAccountInDefault: '1331',
      taxAccountOutDefault: '33311',
      defaultWarehouseCode: 'KHO_TONG',
      enableMarketplaceSplit: false,
      partnerLiabilitiesAccount: '3388',
      bankMappings: {},
      localAccountingMode: false
    }));
    vi.clearAllMocks();
    
    // Mock doc to return path and id for getDoc distinguishing
    vi.mocked(doc).mockImplementation((db: any, col: string, id: string) => {
      return { path: `${col}/${id}`, id } as any;
    });
  });

  it('nên lưu và đọc cấu hình MISA thành công', () => {
    const config = {
      appId: 'test-misa-app',
      accessToken: 'test-token',
      isActive: true,
      debitAccountDefault: '1121',
      creditAccountDefault: '5111',
      revenueAccountDefault: '5111',
      receivableAccountDefault: '131',
      cashAccountDefault: '1111'
    };

    saveMisaConfig(config);
    const loaded = getMisaConfig();
    expect(loaded).toEqual(config);
  });

  it('nên đồng bộ danh mục đối tượng khách hàng sang MISA qua proxy API', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success', message: 'Success' } });

    const result = await syncCustomerToMisa('KH-001', 'Nguyễn Văn A', '0987654321', 'a@gmail.com');
    
    expect(axios.post).toHaveBeenCalledWith(
      '/api/misa/sync-object',
      expect.objectContaining({
        code: 'KH-001',
        name: 'Nguyễn Văn A',
        phone: '0987654321'
      })
    );
    expect(result.status).toBe('success');
  });

  it('nên đồng bộ chứng từ giao dịch sang MISA và cập nhật thông tin chứng từ vào Firestore', async () => {
    const mockTx = {
      amount: 150000,
      description: 'Thanh toán đơn hàng VCOM-101',
      type: 'income',
      category: 'Doanh thu bán hàng',
      debitAccount: '1121',
      creditAccount: '5111',
      accountingObjectCode: 'KH-101',
      taxRate: 10,
      vatAmount: 13636
    };

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockTx,
      id: 'tx-999'
    } as any);

    const mockMisaResponse = {
      status: 'success',
      voucherId: 'MISA-VC-777666',
      syncedAt: '2026-06-04T00:00:00Z'
    };
    vi.mocked(axios.post).mockResolvedValue({ data: mockMisaResponse });

    const result = await syncTransactionToMisa('tx-999');

    expect(axios.post).toHaveBeenCalledWith(
      '/api/misa/sync-voucher',
      expect.objectContaining({
        transactionId: 'tx-999',
        debitAccount: '1121',
        creditAccount: '5111',
        amount: 150000,
        accountingObjectCode: 'KH-101'
      })
    );

    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        misaSynced: true,
        misaVoucherId: 'MISA-VC-777666',
        debitAccount: '1121',
        creditAccount: '5111'
      })
    );

    expect(result.voucherId).toBe('MISA-VC-777666');
  });

  it('nên ghi nhận lỗi đồng bộ vào Firestore khi gọi API MISA thất bại', async () => {
    const mockTx = {
      amount: 100000,
      description: 'Giao dịch test lỗi',
      type: 'income',
      debitAccount: '1121',
      creditAccount: '5111'
    };

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockTx,
      id: 'tx-error'
    } as any);

    vi.mocked(axios.post).mockRejectedValue({
      response: { data: { message: 'Lỗi tài khoản không tồn tại trên MISA AMIS' } }
    });

    await expect(syncTransactionToMisa('tx-error')).rejects.toThrow('Lỗi tài khoản không tồn tại trên MISA AMIS');

    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        misaSynced: false,
        misaSyncError: 'Lỗi tài khoản không tồn tại trên MISA AMIS'
      })
    );
  });

  it('nên đồng bộ danh mục vật tư hàng hóa tự động sang MISA', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success', voucherId: 'MISA-1122', syncedAt: '2026-06-04T00:00:00Z' } });

    const mockTx = {
      amount: 100000,
      description: 'Test sync product',
      type: 'income',
      orderId: 'ORD-PROD-101'
    };

    vi.mocked(getDoc).mockImplementation((ref: any) => {
      if (ref.path === 'finance_transactions/tx-prod' || ref.id === 'tx-prod') {
        return Promise.resolve({
          exists: () => true,
          data: () => mockTx,
          id: 'tx-prod'
        }) as any;
      }
      if (ref.path === 'orders/ORD-PROD-101' || ref.id === 'ORD-PROD-101') {
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            items: [{ productId: 'PROD-001', productName: 'Sản phẩm mới', price: 90909, quantity: 1 }]
          }),
          id: 'ORD-PROD-101'
        }) as any;
      }
      return Promise.resolve({ exists: () => false }) as any;
    });

    await syncTransactionToMisa('tx-prod');

    expect(axios.post).toHaveBeenCalledWith(
      '/api/misa/sync-product',
      expect.objectContaining({
        sku: 'PROD-001',
        name: 'Sản phẩm mới'
      })
    );
  });

  it('nên tự động phân tách doanh thu sàn và công nợ đối tác khi bật enableMarketplaceSplit', async () => {
    const config = getMisaConfig();
    saveMisaConfig({
      ...config,
      enableMarketplaceSplit: true,
      partnerLiabilitiesAccount: '3388',
      revenueAccountDefault: '5111'
    });

    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success', voucherId: 'MISA-SPLIT', syncedAt: '2026-06-04T00:00:00Z' } });

    const mockTx = {
      amount: 500000,
      description: 'Đơn hàng đa đại lý',
      type: 'income',
      orderId: 'ORD-SPLIT'
    };

    vi.mocked(getDoc).mockImplementation((ref: any) => {
      if (ref.path === 'finance_transactions/tx-split' || ref.id === 'tx-split') {
        return Promise.resolve({ exists: () => true, data: () => mockTx, id: 'tx-split' }) as any;
      }
      if (ref.path === 'orders/ORD-SPLIT' || ref.id === 'ORD-SPLIT') {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ items: [{ productId: 'VT001', price: 500000, quantity: 1 }] }),
          id: 'ORD-SPLIT'
        }) as any;
      }
      return Promise.resolve({ exists: () => false }) as any;
    });

    await syncTransactionToMisa('tx-split');

    expect(axios.post).toHaveBeenCalledWith(
      '/api/misa/sync-voucher',
      expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({
            itemCode: 'HH_PHITHU',
            amount: 50000,
            creditAccount: '5111'
          }),
          expect.objectContaining({
            itemCode: 'TH_DOITAC',
            amount: 450000,
            creditAccount: '3388'
          })
        ])
      })
    );
  });

  it('nên ánh xạ động tài khoản nợ tiền gửi từ bankMappings dựa trên số tài khoản giao dịch', async () => {
    const config = getMisaConfig();
    saveMisaConfig({
      ...config,
      bankMappings: {
        '19034567890123': '11212'
      }
    });

    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success', voucherId: 'MISA-BANK', syncedAt: '2026-06-04T00:00:00Z' } });

    const mockTx = {
      amount: 200000,
      description: 'Chuyển khoản TCB',
      type: 'income',
      bankAccount: '19034567890123'
    };

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockTx,
      id: 'tx-bank'
    } as any);

    await syncTransactionToMisa('tx-bank');

    expect(axios.post).toHaveBeenCalledWith(
      '/api/misa/sync-voucher',
      expect.objectContaining({
        debitAccount: '11212'
      })
    );
  });

  it('nên đồng bộ danh mục đối tượng nhà cung cấp sang MISA qua proxy API', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success', message: 'Success' } });

    const result = await syncVendorToMisa('SUP-001', 'LG Việt Nam', '0100101114', '0901234567', 'sales@lg.com', '123456', 'TCB');
    
    expect(axios.post).toHaveBeenCalledWith(
      '/api/misa/sync-object',
      expect.objectContaining({
        code: 'SUP-001',
        name: 'LG Việt Nam',
        isVendor: true
      })
    );
    expect(result.status).toBe('success');
  });

  it('nên đồng bộ giao dịch chi phí mua hàng (P2P) thành công với Nợ 1561 / Có 331', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success', voucherId: 'MISA-PURCHASE', syncedAt: '2026-06-04T00:00:00Z' } });

    const mockTx = {
      amount: 15000000,
      description: 'Nhập hàng kho tổng - LG',
      type: 'expense',
      category: 'Inventory',
      creditAccount: '331',
      accountingObjectCode: 'SUP-001'
    };

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockTx,
      id: 'tx-purchase'
    } as any);

    await syncTransactionToMisa('tx-purchase');

    expect(axios.post).toHaveBeenCalledWith(
      '/api/misa/sync-voucher',
      expect.objectContaining({
        voucherType: 'PurchaseVoucher',
        debitAccount: '1561',
        creditAccount: '331',
        customerCode: 'SUP-001'
      })
    );
  });

  it('nên đồng bộ giao dịch chi tạm ứng nhân viên (R2P) thành công với Nợ 141 / Có 1121', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success', voucherId: 'MISA-ADVANCE', syncedAt: '2026-06-04T00:00:00Z' } });

    const mockTx = {
      amount: 5000000,
      description: 'Tạm ứng đi công tác',
      type: 'expense',
      category: 'Tạm ứng',
      creditAccount: '1121',
      accountingObjectCode: 'NV-001'
    };

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockTx,
      id: 'tx-advance'
    } as any);

    await syncTransactionToMisa('tx-advance');

    expect(axios.post).toHaveBeenCalledWith(
      '/api/misa/sync-voucher',
      expect.objectContaining({
        voucherType: 'PaymentVoucher',
        debitAccount: '141',
        creditAccount: '1121',
        customerCode: 'NV-001'
      })
    );
  });

  it('nên đồng bộ giao dịch mua dịch vụ (P2P Service) thành công với Nợ 6422 / Có 331 và không chứa inventoryAccount', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success', voucherId: 'MISA-SERVICE', syncedAt: '2026-06-04T00:00:00Z' } });

    const mockTx = {
      amount: 12000000,
      description: 'Chi phí thuê ngoài quảng cáo',
      type: 'expense',
      category: 'Service',
      debitAccount: '6422',
      creditAccount: '331',
      accountingObjectCode: 'SUP-001'
    };

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockTx,
      id: 'tx-service'
    } as any);

    await syncTransactionToMisa('tx-service');

    expect(axios.post).toHaveBeenCalledWith(
      '/api/misa/sync-voucher',
      expect.objectContaining({
        voucherType: 'PaymentVoucher',
        debitAccount: '6422',
        creditAccount: '331',
        details: expect.arrayContaining([
          expect.not.objectContaining({
            inventoryAccount: expect.any(String)
          })
        ])
      })
    );
  });

  it('nên đồng bộ giao dịch quyết toán hoàn ứng (R2P hoàn ứng) thành công với GeneralVoucher Nợ 6422 / Có 141', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success', voucherId: 'MISA-SETTLE', syncedAt: '2026-06-04T00:00:00Z' } });

    const mockTx = {
      amount: 3500000,
      description: 'Quyết toán chi phí công tác hoàn ứng',
      type: 'expense',
      category: 'Quyết toán tạm ứng',
      accountingObjectCode: 'NV-001'
    };

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockTx,
      id: 'tx-settle'
    } as any);

    await syncTransactionToMisa('tx-settle');

    expect(axios.post).toHaveBeenCalledWith(
      '/api/misa/sync-voucher',
      expect.objectContaining({
        voucherType: 'GeneralVoucher',
        debitAccount: '6422',
        creditAccount: '141',
        customerCode: 'NV-001'
      })
    );
  });

  it('nên chặn đồng bộ và báo lỗi nếu giao dịch trên 20 triệu đồng dùng đối tượng khách lẻ/nhà cung cấp lẻ', async () => {
    const mockTx = {
      amount: 25000000,
      description: 'Giao dịch giá trị lớn dùng khách lẻ',
      type: 'income',
      accountingObjectCode: 'KHLE',
      debitAccount: '1121',
      creditAccount: '5111'
    };

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockTx,
      id: 'tx-large-khle'
    } as any);

    await expect(syncTransactionToMisa('tx-large-khle')).rejects.toThrow(
      'Đồng bộ thất bại: Không được phép hạch toán công nợ trên 20 triệu đồng sử dụng đối tượng khách lẻ/nhà cung cấp lẻ (KHLE/NCCLE) để tuân thủ quy định khấu trừ thuế GTGT.'
    );
  });

  describe('Đồng bộ đơn hàng trực tiếp (syncOrderToMisa)', () => {
    it('nên đồng bộ đơn hàng sang MISA thành công làm SaleVoucher và cập nhật Firestore orders', async () => {
      const mockOrder = {
        customerName: 'Nguyễn Văn A',
        total: 1500000,
        paymentMethod: 'qr',
        items: [{ name: 'Bàn phím cơ', price: 1500000, quantity: 1, productId: 'VT_BP_CO' }],
        status: 'completed',
        customerId: '12345'
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockOrder,
        id: 'ord-test-999'
      } as any);

      vi.mocked(axios.post).mockResolvedValue({
        data: {
          status: 'success',
          voucherId: 'MISA-VOUCHER-999',
          syncedAt: '2026-06-04T00:00:00Z'
        }
      });

      const res = await syncOrderToMisa('ord-test-999');

      expect(axios.post).toHaveBeenCalledWith(
        '/api/misa/sync-voucher',
        expect.objectContaining({
          transactionId: 'ord-test-999',
          voucherType: 'SaleVoucher',
          amount: 1500000,
          customerCode: 'KH-12345'
        })
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          misaSynced: true,
          misaVoucherId: 'MISA-VOUCHER-999'
        })
      );

      expect(res.voucherId).toBe('MISA-VOUCHER-999');
    });

    it('nên chặn đồng bộ đơn hàng nếu tổng tiền > 20 triệu đồng và dùng khách lẻ KHLE', async () => {
      const mockOrderLarge = {
        customerName: 'Khách lẻ',
        total: 35000000,
        paymentMethod: 'cash',
        items: [{ name: 'Laptop Gaming', price: 35000000, quantity: 1, productId: 'LT_GAMING' }],
        status: 'completed'
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockOrderLarge,
        id: 'ord-large-khle'
      } as any);

      await expect(syncOrderToMisa('ord-large-khle')).rejects.toThrow(
        'Đồng bộ thất bại: Không được phép hạch toán công nợ trên 20 triệu đồng sử dụng đối tượng khách lẻ/nhà cung cấp lẻ (KHLE/NCCLE) để tuân thủ quy định khấu trừ thuế GTGT.'
      );
    });
  });

  describe('Đồng bộ khách hàng và sản phẩm trực tiếp', () => {
    it('nên đồng bộ khách hàng trực tiếp và cập nhật Firestore', async () => {
      const mockCustomer = {
        name: 'Nguyễn Văn A',
        phone: '0987654321',
        email: 'a@gmail.com',
        totalSpent: 0,
        orderCount: 0
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockCustomer,
        id: 'cust-12345'
      } as any);

      vi.mocked(axios.post).mockResolvedValue({
        data: { status: 'success', syncedAt: '2026-06-04T00:00:00Z' }
      });

      const res = await syncCustomerToMisa('cust-12345');

      expect(axios.post).toHaveBeenCalledWith(
        '/api/misa/sync-object',
        expect.objectContaining({
          code: 'KH-CUST-',
          name: 'Nguyễn Văn A',
          phone: '0987654321',
          email: 'a@gmail.com'
        })
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          misaSynced: true
        })
      );
      expect(res.status).toBe('success');
    });

    it('nên đồng bộ sản phẩm trực tiếp và cập nhật Firestore', async () => {
      const mockProduct = {
        name: 'iPhone 15',
        sku: 'APP-IP15',
        price: 20000000,
        stock: 10
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockProduct,
        id: 'prod-123'
      } as any);

      vi.mocked(axios.post).mockResolvedValue({
        data: { status: 'success', syncedAt: '2026-06-04T00:00:00Z' }
      });

      const res = await syncProductToMisa('prod-123');

      expect(axios.post).toHaveBeenCalledWith(
        '/api/misa/sync-product',
        expect.objectContaining({
          sku: 'APP-IP15',
          name: 'iPhone 15',
          price: 20000000
        })
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          misaSynced: true
        })
      );
      expect(res.status).toBe('success');
    });

    it('nên đồng bộ danh mục đối tượng nhân viên sang MISA', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success', message: 'Success' } });

      const result = await syncEmployeeToMisa('EMP-2061', 'Nguyễn Thị Kim Anh', '0987654321', 'kimanh.nguyen@gmail.com');
      
      expect(axios.post).toHaveBeenCalledWith(
        '/api/misa/sync-object',
        expect.objectContaining({
          code: 'NV-EMP-2061',
          name: 'Nguyễn Thị Kim Anh',
          phone: '0987654321',
          email: 'kimanh.nguyen@gmail.com',
          isEmployee: true
        })
      );
      expect(result.status).toBe('success');
    });

    it('nên đồng bộ hạch toán bảng lương tháng sang MISA dưới dạng GeneralVoucher', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: { status: 'success', voucherId: 'MISA-PAY-1122', syncedAt: '2026-06-04T00:00:00Z' } });

      const mockBackupId = 'BKP-001';
      const mockDetails = [
        { department: 'Marketing', amount: 15000000 },
        { department: 'CSKH', amount: 18000000 }
      ];

      const result = await syncPayrollToMisa(mockBackupId, 'Bảng lương Tháng 05/2026', 2026, 5, mockDetails);

      expect(axios.post).toHaveBeenCalledWith(
        '/api/misa/sync-voucher',
        expect.objectContaining({
          transactionId: mockBackupId,
          voucherType: 'GeneralVoucher',
          amount: 33000000,
          details: expect.arrayContaining([
            expect.objectContaining({
              debitAccount: '6421',
              creditAccount: '3341',
              amount: 15000000
            }),
            expect.objectContaining({
              debitAccount: '6422',
              creditAccount: '3341',
              amount: 18000000
            })
          ])
        })
      );

      expect(result.status).toBe('success');
      expect(result.voucherId).toBe('MISA-PAY-1122');
    });
  });
  describe('Kế toán Nội bộ Độc lập (Standalone Local Accounting)', () => {
    beforeEach(() => {
      const config = getMisaConfig();
      saveMisaConfig({
        ...config,
        localAccountingMode: true
      });
    });

    it('nên ghi sổ kế toán nội bộ thành công không gọi API MISA bên ngoài', async () => {
      const mockTx = {
        amount: 5000000,
        description: 'Chi tiền lương nhân viên',
        type: 'expense',
        category: 'Operational',
        debitAccount: '6422',
        creditAccount: '1111',
        accountingObjectCode: 'NV-001'
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockTx,
        id: 'tx-local-1'
      } as any);

      const result = await syncTransactionToMisa('tx-local-1');

      expect(axios.post).not.toHaveBeenCalled();

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          misaSynced: true,
          misaVoucherId: expect.stringContaining('VCOMM-PC-'),
          debitAccount: '6422',
          creditAccount: '1111'
        })
      );
      expect(result.status).toBe('success');
      expect(result.voucherId).toContain('VCOMM-PC-');
    });

    it('nên hủy ghi sổ kế toán nội bộ thành công cập nhật Firestore', async () => {
      const mockTx = {
        amount: 5000000,
        description: 'Chi tiền lương nhân viên',
        type: 'expense',
        debitAccount: '6422',
        creditAccount: '1111',
        misaSynced: true,
        misaVoucherId: 'VCOMM-PC-12345'
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockTx,
        id: 'tx-local-1'
      } as any);

      const result = await unpostTransaction('tx-local-1');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          misaSynced: false,
          misaVoucherId: null,
          misaSyncedAt: null,
          misaSyncError: ''
        })
      );
      expect(result.status).toBe('success');
    });
  });

});