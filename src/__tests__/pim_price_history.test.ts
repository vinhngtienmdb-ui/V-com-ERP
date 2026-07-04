import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock dbService to test real functions
vi.unmock('../services/dbService');

import { db, setDoc, updateDoc, doc } from '../services/dbService';
import { supabase } from '../lib/supabase';

describe('PIM SKU Standardization & Price History Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nên ánh xạ đầy đủ thuộc tính SKU chuẩn hóa khi lưu sản phẩm', async () => {
    const productPayload = {
      id: 'test-product-sku-123',
      name: 'Sản phẩm Test SKU',
      price: 250000,
      costPrice: 180000,
      sku: 'PROD-SKU-123',
      barcode: '893000111222',
      vatRate: 10,
      specification: 'Hộp 24 lon',
      supplierId: 'NCC-001',
      tenantId: 'tenant-vcomm-test'
    };

    const selectMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: selectMock });
    const selectChainMock = vi.fn().mockReturnValue({ eq: eqMock });
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
      select: selectChainMock,
      upsert: upsertMock
    } as any);

    const docRef = doc(db, 'products', productPayload.id);
    await setDoc(docRef, productPayload);

    expect(fromSpy).toHaveBeenCalledWith('products');
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        barcode: '893000111222',
        vat_rate: 10,
        specification: 'Hộp 24 lon',
        supplier_id: 'NCC-001'
      })
    );
  });

  it('nên tự động ghi nhật ký vào product_price_history khi đổi giá bán hoặc giá vốn', async () => {
    const productId = 'test-product-history-456';
    const docRef = doc(db, 'products', productId);

    const selectMock = vi.fn().mockResolvedValue({
      data: {
        price: 200000,
        cost_price: 150000
      },
      error: null
    });
    
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: selectMock });
    const selectChainMock = vi.fn().mockReturnValue({ eq: eqMock });
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const upsertMock = vi.fn().mockResolvedValue({ error: null });

    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'products') {
        return { 
          select: selectChainMock,
          upsert: upsertMock
        } as any;
      } else if (table === 'product_price_history') {
        return { insert: insertMock } as any;
      }
      return { upsert: upsertMock } as any;
    });

    await updateDoc(docRef, {
      price: 220000,
      costPrice: 160000
    });

    expect(fromSpy).toHaveBeenCalledWith('product_price_history');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: productId,
        old_price: 200000,
        new_price: 220000,
        old_cost_price: 150000,
        new_cost_price: 160000,
        changed_by: 'system-pim-user'
      })
    );
  });

  it('không tạo log lịch sử đổi giá khi các trường phi tài chính thay đổi', async () => {
    const productId = 'test-product-history-789';
    const docRef = doc(db, 'products', productId);

    const selectMock = vi.fn().mockResolvedValue({
      data: {
        price: 200000,
        cost_price: 150000
      },
      error: null
    });
    
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: selectMock });
    const selectChainMock = vi.fn().mockReturnValue({ eq: eqMock });
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const upsertMock = vi.fn().mockResolvedValue({ error: null });

    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'products') {
        return { 
          select: selectChainMock,
          upsert: upsertMock
        } as any;
      } else if (table === 'product_price_history') {
        return { insert: insertMock } as any;
      }
      return { upsert: upsertMock } as any;
    });

    await updateDoc(docRef, {
      barcode: '893999999999',
      specification: 'Thùng 12 lon'
    });

    expect(fromSpy).not.toHaveBeenCalledWith('product_price_history');
    expect(insertMock).not.toHaveBeenCalled();
  });
});
