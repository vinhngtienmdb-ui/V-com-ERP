import axios from 'axios';
import { db, doc, getDoc, updateDoc, collection, query, where, limit, getDocs } from '../lib/firebase';
import { FinanceTransaction } from '../types/erp';
import { safeLocalStorage } from '../lib/storage';

export interface MisaConfig {
  appId: string;
  accessToken: string;
  isActive: boolean;
  debitAccountDefault: string;   // vd: 1121 - Tiền gửi ngân hàng VND
  creditAccountDefault: string;  // vd: 5111 - Doanh thu bán hàng hóa
  revenueAccountDefault: string; // vd: 5111
  receivableAccountDefault: string; // vd: 131 - Phải thu khách hàng
  cashAccountDefault: string;    // vd: 1111 - Tiền mặt
  taxAccountInDefault?: string;
  taxAccountOutDefault?: string;
  defaultWarehouseCode?: string;
  enableMarketplaceSplit?: boolean;
  partnerLiabilitiesAccount?: string;
  bankMappings?: Record<string, string>;
  localAccountingMode?: boolean;
}

const STORAGE_KEYS = {
  CONFIG: 'vcom_misa_config'
};

export const getMisaConfig = (): MisaConfig => {
  const data = safeLocalStorage.getItem(STORAGE_KEYS.CONFIG);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // Fallback below
    }
  }
  return {
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
    localAccountingMode: true
  };
};

export const saveMisaConfig = (config: MisaConfig): void => {
  safeLocalStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  window.dispatchEvent(new Event('misa-config-updated'));
};

/**
 * Đồng bộ danh mục đối tượng khách hàng sang MISA (Master Integrity Gate)
 */
export const syncCustomerToMisa = async (
  codeOrId: string,
  name?: string,
  phone = '',
  email = ''
): Promise<any> => {
  const config = getMisaConfig();
  if (!config.isActive) return { status: 'disabled', message: 'MISA Integration is deactivated' };

  let finalCode = codeOrId;
  let finalName = name || '';
  let finalPhone = phone;
  let finalEmail = email;
  let isFirestoreDoc = false;
  const customerRef = doc(db, 'customers', codeOrId);

  try {
    if (!name) {
      const snap = await getDoc(customerRef);
      if (snap.exists()) {
        const data = snap.data();
        finalCode = `KH-${codeOrId.substring(0, 5).toUpperCase()}`;
        finalName = data.name || '';
        finalPhone = data.phone || '';
        finalEmail = data.email || '';
        isFirestoreDoc = true;
      }
    }
  } catch (err) {
    // Treat as regular call if check fails
  }

  if (!finalName) {
    finalName = `Khách hàng ${finalCode}`;
  }

  try {
    let responseData;
    if (config.localAccountingMode) {
      responseData = { status: 'success', syncedAt: new Date().toISOString() };
    } else {
      const response = await axios.post('/api/misa/sync-object', {
        code: finalCode,
        name: finalName,
        phone: finalPhone,
        email: finalEmail,
        appId: config.appId,
        accessToken: config.accessToken
      });
      responseData = response.data;
    }

    if (isFirestoreDoc && responseData && responseData.status === 'success') {
      await updateDoc(customerRef, {
        misaSynced: true,
        misaSyncedAt: responseData.syncedAt || new Date().toISOString(),
        misaSyncError: ''
      });
    }
    return responseData;
  } catch (error: any) {
    console.error('[MisaService] Error syncing customer object:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Lỗi kết nối API MISA';
    if (isFirestoreDoc) {
      await updateDoc(customerRef, {
        misaSynced: false,
        misaSyncError: errorMsg
      });
    }
    throw new Error(errorMsg);
  }
};

/**
 * Đồng bộ danh mục đối tượng nhà cung cấp sang MISA (Vendor Sync Gate)
 */
export const syncVendorToMisa = async (
  code: string,
  name: string,
  taxCode = '',
  phone = '',
  email = '',
  bankAccount = '',
  bankName = ''
): Promise<any> => {
  const config = getMisaConfig();
  if (!config.isActive) return { status: 'disabled', message: 'MISA Integration is deactivated' };

  try {
    if (config.localAccountingMode) {
      return { status: 'success', syncedAt: new Date().toISOString() };
    }
    const response = await axios.post('/api/misa/sync-object', {
      code,
      name,
      taxCode,
      phone,
      email,
      bankAccount,
      bankName,
      isVendor: true,
      appId: config.appId,
      accessToken: config.accessToken
    });
    return response.data;
  } catch (error: any) {
    console.error('[MisaService] Error syncing vendor object:', error);
    throw error;
  }
};

/**
 * Đồng bộ danh mục vật tư hàng hóa sang MISA (Product Sync Gate)
 */
export const syncProductToMisa = async (
  skuOrId: string,
  name?: string,
  unit = 'Cái',
  price = 0
): Promise<any> => {
  const config = getMisaConfig();
  if (!config.isActive) return { status: 'disabled', message: 'MISA Integration is deactivated' };

  let finalSku = skuOrId;
  let finalName = name || '';
  let finalUnit = unit;
  let finalPrice = price;
  let isFirestoreDoc = false;
  const productRef = doc(db, 'products', skuOrId);

  try {
    if (!name) {
      const snap = await getDoc(productRef);
      if (snap.exists()) {
        const data = snap.data();
        finalSku = data.sku || skuOrId;
        finalName = data.name || '';
        finalUnit = 'Cái';
        finalPrice = data.price || 0;
        isFirestoreDoc = true;
      }
    }
  } catch (err) {
    // Treat as regular call if check fails
  }

  if (!finalName) {
    finalName = `Vật tư ${finalSku}`;
  }

  try {
    let responseData;
    if (config.localAccountingMode) {
      responseData = { status: 'success', syncedAt: new Date().toISOString() };
    } else {
      const response = await axios.post('/api/misa/sync-product', {
        sku: finalSku,
        name: finalName,
        unit: finalUnit,
        price: finalPrice,
        appId: config.appId,
        accessToken: config.accessToken
      });
      responseData = response.data;
    }

    if (isFirestoreDoc && responseData && responseData.status === 'success') {
      await updateDoc(productRef, {
        misaSynced: true,
        misaSyncedAt: responseData.syncedAt || new Date().toISOString(),
        misaSyncError: ''
      });
    }
    return responseData;
  } catch (error: any) {
    console.error('[MisaService] Error syncing product catalog:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Lỗi kết nối API MISA';
    if (isFirestoreDoc) {
      await updateDoc(productRef, {
        misaSynced: false,
        misaSyncError: errorMsg
      });
    }
    throw new Error(errorMsg);
  }
};

/**
 * Đồng bộ hóa một chứng từ giao dịch cụ thể từ Firestore lên MISA
 */
export const syncTransactionToMisa = async (transactionId: string, fallbackTxData?: Partial<FinanceTransaction>): Promise<any> => {
  const config = getMisaConfig();
  if (!config.isActive) {
    throw new Error('Chức năng tích hợp MISA chưa được kích hoạt trong phần cài đặt.');
  }

  let txData: FinanceTransaction;
  const docRef = doc(db, 'finance_transactions', transactionId);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      txData = docSnap.data() as FinanceTransaction;
    } else if (fallbackTxData) {
      txData = {
        id: transactionId,
        amount: fallbackTxData.amount || 0,
        description: fallbackTxData.description || '',
        type: fallbackTxData.type || 'expense',
        category: fallbackTxData.category || 'Inventory',
        date: new Date().toISOString(),
        ...fallbackTxData
      } as FinanceTransaction;
    } else {
      throw new Error('Không tìm thấy giao dịch tài chính này trong hệ thống.');
    }
  } catch (err) {
    if (fallbackTxData) {
      txData = {
        id: transactionId,
        amount: fallbackTxData.amount || 0,
        description: fallbackTxData.description || '',
        type: fallbackTxData.type || 'expense',
        category: fallbackTxData.category || 'Inventory',
        date: new Date().toISOString(),
        ...fallbackTxData
      } as FinanceTransaction;
    } else {
      throw err;
    }
  }

  // 1. Xác định Tài khoản Nợ và Có chi tiết dựa theo loại giao dịch
  let debitAccount = txData.debitAccount;
  let creditAccount = txData.creditAccount;

  if (txData.category === 'Quyết toán tạm ứng') {
    // Luồng Quyết toán tạm ứng hoàn ứng (R2P hoàn ứng)
    if (!debitAccount) debitAccount = '6422'; // Chi phí quản lý doanh nghiệp
    if (!creditAccount) creditAccount = '141'; // Có TK 141 (Tạm ứng)
  } else if (txData.type === 'income') {
    // Luồng Thu tiền (O2C)
    if (!debitAccount) {
      if (txData.bankAccount && config.bankMappings && config.bankMappings[txData.bankAccount]) {
        debitAccount = config.bankMappings[txData.bankAccount];
      } else {
        debitAccount = config.debitAccountDefault;
      }
    }
    if (!creditAccount) {
      creditAccount = config.creditAccountDefault;
    }
  } else {
    // Luồng Chi tiền / Mua hàng / Tạm ứng (P2P & R2P)
    // Tài khoản Có (tài khoản chi tiền / phải trả)
    if (!creditAccount) {
      if (txData.category === 'Service') {
        creditAccount = '331'; // Mua dịch vụ chưa thanh toán
      } else if (txData.bankAccount && config.bankMappings && config.bankMappings[txData.bankAccount]) {
        creditAccount = config.bankMappings[txData.bankAccount];
      } else if (txData.bankAccount) {
        creditAccount = config.debitAccountDefault; // tiền gửi
      } else {
        creditAccount = config.cashAccountDefault; // tiền mặt
      }
    }
    // Tài khoản Nợ (tài khoản chịu phí / hàng hóa)
    if (!debitAccount) {
      if (txData.category === 'Inventory') {
        debitAccount = '1561'; // Hàng hóa nhập kho
      } else if (txData.category === 'Tạm ứng') {
        debitAccount = '141'; // Tạm ứng nhân viên
      } else if (txData.category === 'Service' || txData.category === 'Operational') {
        debitAccount = '6422'; // Chi phí quản lý doanh nghiệp
      } else {
        debitAccount = '6422';
      }
    }
  }

  const objectCode = txData.accountingObjectCode || (txData.type === 'income' ? 'KHLE' : 'NCCLE');

  // Kiểm soát hạn mức đối tượng lẻ để tuân thủ quy định thuế
  if (txData.amount > 20000000 && (objectCode === 'KHLE' || objectCode === 'NCCLE')) {
    throw new Error('Đồng bộ thất bại: Không được phép hạch toán công nợ trên 20 triệu đồng sử dụng đối tượng khách lẻ/nhà cung cấp lẻ (KHLE/NCCLE) để tuân thủ quy định khấu trừ thuế GTGT.');
  }

  // 2. Ràng buộc hạch toán tài khoản lá (Leaf Accounts Gate)
  const isLeafAccount = (acc: string) => {
    if (!acc) return false;
    const cleanAcc = acc.trim();
    if (['141', '331', '131', '632'].includes(cleanAcc)) return true;
    return cleanAcc.length >= 4;
  };

  if (!isLeafAccount(debitAccount)) {
    throw new Error(`Định khoản thất bại: Tài khoản Nợ '${debitAccount}' là tài khoản tổng hợp cấp 1. Bạn bắt buộc phải cấu hình tài khoản chi tiết cấp 2 trở lên (ví dụ: 1121).`);
  }
  if (!isLeafAccount(creditAccount) && !(txData.type === 'income' && config.enableMarketplaceSplit)) {
    throw new Error(`Định khoản thất bại: Tài khoản Có '${creditAccount}' là tài khoản tổng hợp cấp 1. Bạn bắt buộc phải cấu hình tài khoản chi tiết cấp 2 trở lên (ví dụ: 5111).`);
  }

  // 3. Cổng xác thực tính toàn vẹn Danh mục gốc (Master Integrity Gate)
  try {
    if (txData.type === 'income') {
      await syncCustomerToMisa(objectCode, objectCode === 'KHLE' ? 'Khách hàng lẻ' : `Khách hàng ${objectCode}`);
    } else {
      await syncVendorToMisa(objectCode, objectCode === 'NCCLE' ? 'Nhà cung cấp lẻ' : `Nhà cung cấp ${objectCode}`);
    }
  } catch (objErr: any) {
    console.warn('[MisaService] Cảnh báo lỗi đồng bộ danh mục đối tượng:', objErr.message || objErr);
  }

  // 4. Trích xuất thông tin chi tiết hóa đơn/mặt hàng (Header-Details)
  let details: any[] = [];
  let totalAmount = 0;
  let totalVATAmount = 0;

  if (txData.orderId) {
    try {
      const orderRef = doc(db, 'orders', txData.orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const items = orderData.items || [];
        const warehouseCode = config.defaultWarehouseCode || 'KHO_TONG';
        const taxRateVal = txData.taxRate !== undefined ? txData.taxRate : 10;

        // Đồng bộ danh mục sản phẩm trước
        for (const item of items) {
          try {
            await syncProductToMisa(
              item.productId || item.sku || 'VT_CHUNG',
              item.productName || 'Vật tư hàng hóa',
              'Cái',
              item.price || 0
            );
          } catch (prodErr: any) {
            console.warn('[MisaService] Cảnh báo lỗi đồng bộ danh mục sản phẩm:', prodErr.message || prodErr);
          }
        }

        if (txData.type === 'income') {
          if (config.enableMarketplaceSplit) {
            // Logic chia tách doanh thu: Hoa hồng sàn 10%, còn lại chuyển sang đối tác
            const commissionRate = 10; // 10%
            const commissionAmount = Math.round(txData.amount * (commissionRate / 100));
            const partnerAmount = txData.amount - commissionAmount;

            details = [
              {
                itemCode: 'HH_PHITHU',
                itemName: `Phí hoa hồng sàn - Đơn hàng ${txData.orderId}`,
                unit: 'Lần',
                quantity: 1,
                unitPrice: commissionAmount,
                amount: commissionAmount,
                vatRate: '0%',
                vatAmount: 0,
                debitAccount,
                creditAccount: config.revenueAccountDefault || '5111',
                warehouseCode,
                inventoryAccount: '1561',
                cogsAccount: '632'
              },
              {
                itemCode: 'TH_DOITAC',
                itemName: `Tiền thu hộ đối tác - Đơn hàng ${txData.orderId}`,
                unit: 'Lần',
                quantity: 1,
                unitPrice: partnerAmount,
                amount: partnerAmount,
                vatRate: '0%',
                vatAmount: 0,
                debitAccount,
                creditAccount: config.partnerLiabilitiesAccount || '3388',
                warehouseCode,
                inventoryAccount: '1561',
                cogsAccount: '632'
              }
            ];
            totalAmount = txData.amount;
            totalVATAmount = 0;
          } else {
            details = items.map((item: any) => {
              const amount = item.price * item.quantity;
              const vat = Math.round(amount * (taxRateVal / 100));

              return {
                itemCode: item.productId || item.sku || 'VT_CHUNG',
                itemName: item.productName || 'Vật tư hàng hóa',
                unit: 'Cái',
                quantity: item.quantity,
                unitPrice: item.price,
                amount: amount,
                vatRate: `${taxRateVal}%`,
                vatAmount: vat,
                debitAccount,
                creditAccount,
                warehouseCode,
                inventoryAccount: '1561',
                cogsAccount: '632'
              };
            });

            totalAmount = details.reduce((sum, d) => sum + d.amount, 0);
            totalVATAmount = details.reduce((sum, d) => sum + d.vatAmount, 0);

            // Bù trừ sai số làm tròn
            const expectedTotal = txData.amount;
            const currentCalculatedTotal = totalAmount + totalVATAmount;
            const diff = expectedTotal - currentCalculatedTotal;

            if (diff !== 0 && details.length > 0) {
              const lastItem = details[details.length - 1];
              lastItem.vatAmount += diff;
              totalVATAmount += diff;
            }
          }
        } else {
          // Đối với Mua hàng nhập kho (expense && Inventory): Hạch toán Nợ 1561 / Có creditAccount
          details = items.map((item: any) => {
            const amount = item.price * item.quantity;
            const vat = Math.round(amount * (taxRateVal / 100));

            return {
              itemCode: item.productId || item.sku || 'VT_CHUNG',
              itemName: item.productName || 'Vật tư hàng hóa',
              unit: 'Cái',
              quantity: item.quantity,
              unitPrice: item.price,
              amount: amount,
              vatRate: `${taxRateVal}%`,
              vatAmount: vat,
              debitAccount, // 1561
              creditAccount, // 331 / 1121
              warehouseCode,
              inventoryAccount: debitAccount, // 1561
              cogsAccount: '632'
            };
          });

          totalAmount = details.reduce((sum, d) => sum + d.amount, 0);
          totalVATAmount = details.reduce((sum, d) => sum + d.vatAmount, 0);

          const expectedTotal = txData.amount;
          const currentCalculatedTotal = totalAmount + totalVATAmount;
          const diff = expectedTotal - currentCalculatedTotal;

          if (diff !== 0 && details.length > 0) {
            const lastItem = details[details.length - 1];
            lastItem.vatAmount += diff;
            totalVATAmount += diff;
          }
        }
      }
    } catch (orderErr) {
      console.warn('[MisaService] Không thể tải chi tiết đơn hàng, sử dụng fallback hạch toán đơn dòng:', orderErr);
    }
  }

  // Fallback nếu không có chi tiết từ đơn hàng
  if (details.length === 0) {
    if (txData.type === 'income') {
      if (config.enableMarketplaceSplit) {
        const commissionRate = 10;
        const commissionAmount = Math.round(txData.amount * (commissionRate / 100));
        const partnerAmount = txData.amount - commissionAmount;

        details = [
          {
            itemCode: 'HH_PHITHU',
            itemName: txData.description ? `Phí hoa hồng: ${txData.description}` : 'Phí hoa hồng sàn',
            unit: 'Lần',
            quantity: 1,
            unitPrice: commissionAmount,
            amount: commissionAmount,
            vatRate: '0%',
            vatAmount: 0,
            debitAccount,
            creditAccount: config.revenueAccountDefault || '5111',
            warehouseCode: config.defaultWarehouseCode || 'KHO_TONG',
            inventoryAccount: '1561',
            cogsAccount: '632'
          },
          {
            itemCode: 'TH_DOITAC',
            itemName: txData.description ? `Tiền thu hộ đối tác: ${txData.description}` : 'Tiền thu hộ đối tác',
            unit: 'Lần',
            quantity: 1,
            unitPrice: partnerAmount,
            amount: partnerAmount,
            vatRate: '0%',
            vatAmount: 0,
            debitAccount,
            creditAccount: config.partnerLiabilitiesAccount || '3388',
            warehouseCode: config.defaultWarehouseCode || 'KHO_TONG',
            inventoryAccount: '1561',
            cogsAccount: '632'
          }
        ];
        totalAmount = txData.amount;
        totalVATAmount = 0;
      } else {
        const taxRateVal = txData.taxRate !== undefined ? txData.taxRate : 10;
        const vat = txData.vatAmount !== undefined ? txData.vatAmount : Math.round(txData.amount - (txData.amount / (1 + taxRateVal / 100)));
        const amountVal = txData.amount - vat;

        details = [{
          itemCode: 'VT_BTHL',
          itemName: txData.description || 'Bán lẻ dịch vụ chung',
          unit: 'Lần',
          quantity: 1,
          unitPrice: amountVal,
          amount: amountVal,
          vatRate: `${taxRateVal}%`,
          vatAmount: vat,
          debitAccount,
          creditAccount,
          warehouseCode: config.defaultWarehouseCode || 'KHO_TONG',
          inventoryAccount: '1561',
          cogsAccount: '632'
        }];
        
        totalAmount = amountVal;
        totalVATAmount = vat;
      }
    } else {
      // Cho giao dịch Chi (expense) - P2P/R2P hoặc Quyết toán tạm ứng
      const taxRateVal = txData.taxRate !== undefined ? txData.taxRate : 0;
      const vat = txData.vatAmount !== undefined ? txData.vatAmount : 0;
      const amountVal = txData.amount - vat;

      const isStockPurchase = txData.category === 'Inventory';
      const itemName = txData.description || (
        txData.category === 'Tạm ứng' 
          ? 'Chi tiền tạm ứng nhân viên' 
          : (txData.category === 'Quyết toán tạm ứng' ? 'Quyết toán hoàn ứng nhân viên' : 'Chi phí dịch vụ/vận hành')
      );

      details = [{
        itemCode: isStockPurchase ? 'VT_MHL' : 'CP_CHUNG',
        itemName,
        unit: 'Lần',
        quantity: 1,
        unitPrice: amountVal,
        amount: amountVal,
        vatRate: `${taxRateVal}%`,
        vatAmount: vat,
        debitAccount, // 1561 hoặc 141 hoặc 6422
        creditAccount, // 331 hoặc 1121 hoặc 1111
        warehouseCode: config.defaultWarehouseCode || 'KHO_TONG',
        ...(isStockPurchase ? {
          inventoryAccount: debitAccount,
          cogsAccount: '632'
        } : {})
      }];
      
      totalAmount = amountVal;
      totalVATAmount = vat;
    }
  }

  const voucherType = txData.category === 'Quyết toán tạm ứng'
    ? 'GeneralVoucher'
    : (txData.type === 'income'
      ? 'SaleVoucher'
      : (txData.category === 'Inventory' ? 'PurchaseVoucher' : 'PaymentVoucher'));

  const defaultVoucherNoPrefix = voucherType === 'SaleVoucher'
    ? 'BH'
    : (voucherType === 'PurchaseVoucher'
      ? 'MH'
      : (voucherType === 'GeneralVoucher' ? 'PK' : 'PC'));

  const voucherNo = txData.referenceNumber || `${defaultVoucherNoPrefix}-${transactionId.substring(0, 8)}`;

  try {
    let responseData;
    if (config.localAccountingMode) {
      responseData = {
        status: 'success',
        voucherId: `VCOMM-${voucherNo}`,
        syncedAt: new Date().toISOString()
      };
    } else {
      const response = await axios.post('/api/misa/sync-voucher', {
        transactionId: transactionId,
        voucherNo,
        voucherType,
        customerCode: objectCode,
        details,
        debitAccount,
        creditAccount,
        amount: txData.amount,
        description: txData.description,
        accountingObjectCode: objectCode,
        taxRate: txData.taxRate || 0,
        vatAmount: txData.vatAmount || 0,
        appId: config.appId,
        accessToken: config.accessToken
      });
      responseData = response.data;
    }

    if (responseData && responseData.status === 'success') {
      const updateData = {
        misaSynced: true,
        misaVoucherId: responseData.voucherId,
        misaSyncedAt: responseData.syncedAt || new Date().toISOString(),
        misaSyncError: '',
        debitAccount,
        creditAccount,
        accountingObjectCode: objectCode
      };
      
      await updateDoc(docRef, updateData);
      window.dispatchEvent(new CustomEvent('misa-transaction-synced', { detail: { id: transactionId, ...updateData } }));
      return responseData;
    } else {
      throw new Error(responseData.message || 'Lỗi không xác định từ hệ thống hạch toán');
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Lỗi kết nối API đồng bộ MISA';
    
    await updateDoc(docRef, {
      misaSynced: false,
      misaSyncError: errorMsg
    });
    
    window.dispatchEvent(new CustomEvent('misa-transaction-synced', { detail: { id: transactionId, misaSynced: false, misaSyncError: errorMsg } }));
    throw new Error(errorMsg);
  }
};

/**
 * Đồng bộ trực tiếp Đơn hàng (Sales Order) sang MISA làm SaleVoucher
 */
export const syncOrderToMisa = async (orderId: string): Promise<any> => {
  const config = getMisaConfig();
  if (!config.isActive) {
    throw new Error('Chức năng tích hợp MISA chưa được kích hoạt trong phần cài đặt.');
  }

  const orderRef = doc(db, 'orders', orderId);
  let orderData: any;
  let hasRealDoc = false;

  try {
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      orderData = orderSnap.data();
      hasRealDoc = true;
    } else {
      // Fallback for mock demo orders
      orderData = {
        customerName: 'Nguyễn Văn A',
        total: 2500000,
        paymentMethod: 'cod',
        items: [{ name: 'Bàn phím cơ', price: 2500000, quantity: 1, productId: 'VT_BP_CO' }],
        status: 'completed'
      };
    }
  } catch (err) {
    orderData = {
      customerName: 'Nguyễn Văn A',
      total: 2500000,
      paymentMethod: 'cod',
      items: [{ name: 'Bàn phím cơ', price: 2500000, quantity: 1, productId: 'VT_BP_CO' }],
      status: 'completed'
    };
  }

  // 1. Ánh xạ phương thức thanh toán sang tài khoản kế toán
  let debitAccount = config.receivableAccountDefault || '1311';
  const creditAccount = config.revenueAccountDefault || '5111';

  if (orderData.paymentMethod === 'cash') {
    debitAccount = config.cashAccountDefault || '1111';
  } else if (orderData.paymentMethod === 'qr' || orderData.paymentMethod === 'bank_transfer' || orderData.paymentMethod === 'pos') {
    debitAccount = (config.bankMappings && Object.values(config.bankMappings)[0]) || config.debitAccountDefault || '1121';
  }

  const objectCode = orderData.customerId ? `KH-${orderData.customerId.substring(0, 5).toUpperCase()}` : 'KHLE';

  // 2. Chặn hạch toán đối tượng lẻ trên 20 triệu VND
  if (orderData.total > 20000000 && objectCode === 'KHLE') {
    throw new Error('Đồng bộ thất bại: Không được phép hạch toán công nợ trên 20 triệu đồng sử dụng đối tượng khách lẻ/nhà cung cấp lẻ (KHLE/NCCLE) để tuân thủ quy định khấu trừ thuế GTGT.');
  }

  // 3. Ràng buộc hạch toán tài khoản lá
  const isLeafAccount = (acc: string) => {
    if (!acc) return false;
    const cleanAcc = acc.trim();
    if (['141', '331', '131', '632'].includes(cleanAcc)) return true;
    return cleanAcc.length >= 4;
  };

  if (!isLeafAccount(debitAccount)) {
    debitAccount = '1121';
  }

  // 4. Đồng bộ danh mục Khách hàng trước
  try {
    await syncCustomerToMisa(objectCode, orderData.customerName || 'Khách hàng lẻ');
  } catch (objErr: any) {
    console.warn('[MisaService] Cảnh báo lỗi đồng bộ danh mục đối tượng cho đơn hàng:', objErr.message || objErr);
  }

  // 5. Chuẩn bị chi tiết dòng sản phẩm (SaleVoucher Details)
  const items = orderData.items || [];
  const warehouseCode = config.defaultWarehouseCode || 'KHO_TONG';
  const taxRateVal = 10; // Mặc định VAT 10% cho bán lẻ/POS

  // Đồng bộ danh mục sản phẩm trước
  for (const item of items) {
    try {
      await syncProductToMisa(
        item.productId || item.sku || 'VT_CHUNG',
        item.name || 'Vật tư hàng hóa',
        'Cái',
        item.price || 0
      );
    } catch (prodErr: any) {
      console.warn('[MisaService] Cảnh báo lỗi đồng bộ danh mục sản phẩm:', prodErr.message || prodErr);
    }
  }

  let details: any[] = [];
  if (config.enableMarketplaceSplit) {
    const commissionRate = 10;
    const commissionAmount = Math.round(orderData.total * (commissionRate / 100));
    const partnerAmount = orderData.total - commissionAmount;

    details = [
      {
        itemCode: 'HH_PHITHU',
        itemName: `Phí hoa hồng sàn - Đơn hàng ${orderId}`,
        unit: 'Lần',
        quantity: 1,
        unitPrice: commissionAmount,
        amount: commissionAmount,
        vatRate: '0%',
        vatAmount: 0,
        debitAccount,
        creditAccount: config.revenueAccountDefault || '5111',
        warehouseCode,
        inventoryAccount: '1561',
        cogsAccount: '632'
      },
      {
        itemCode: 'TH_DOITAC',
        itemName: `Tiền thu hộ đối tác - Đơn hàng ${orderId}`,
        unit: 'Lần',
        quantity: 1,
        unitPrice: partnerAmount,
        amount: partnerAmount,
        debitAccount,
        creditAccount: config.partnerLiabilitiesAccount || '3388',
        warehouseCode,
        inventoryAccount: '1561',
        cogsAccount: '632'
      }
    ];
  } else {
    details = items.map((item: any) => {
      const amount = item.price * item.quantity;
      const vat = Math.round(amount * (taxRateVal / 100));

      return {
        itemCode: item.productId || item.sku || 'VT_CHUNG',
        itemName: item.name || 'Vật tư hàng hóa',
        unit: 'Cái',
        quantity: item.quantity,
        unitPrice: item.price,
        amount: amount,
        vatRate: `${taxRateVal}%`,
        vatAmount: vat,
        debitAccount,
        creditAccount,
        warehouseCode,
        inventoryAccount: '1561',
        cogsAccount: '632'
      };
    });

    const totalAmount = details.reduce((sum, d) => sum + d.amount, 0);
    const totalVATAmount = details.reduce((sum, d) => sum + d.vatAmount, 0);
    const expectedTotal = orderData.total;
    const diff = expectedTotal - (totalAmount + totalVATAmount);

    if (diff !== 0 && details.length > 0) {
      details[details.length - 1].vatAmount += diff;
    }
  }

  const voucherNo = `BH-${orderId.substring(0, 8)}`;

  try {
    let responseData;
    if (config.localAccountingMode) {
      responseData = {
        status: 'success',
        voucherId: `VCOMM-${voucherNo}`,
        syncedAt: new Date().toISOString()
      };
    } else {
      const response = await axios.post('/api/misa/sync-voucher', {
        transactionId: orderId,
        voucherNo,
        voucherType: 'SaleVoucher',
        customerCode: objectCode,
        details,
        debitAccount,
        creditAccount,
        amount: orderData.total,
        description: `Đồng bộ đơn hàng ${orderId} (${orderData.customerName})`,
        accountingObjectCode: objectCode,
        taxRate: taxRateVal,
        vatAmount: Math.round(orderData.total * 0.1),
        appId: config.appId,
        accessToken: config.accessToken
      });
      responseData = response.data;
    }

    if (responseData && responseData.status === 'success') {
      const updateData = {
        misaSynced: true,
        misaVoucherId: responseData.voucherId,
        misaSyncedAt: responseData.syncedAt || new Date().toISOString(),
        misaSyncError: ''
      };
      
      if (hasRealDoc) {
        await updateDoc(orderRef, updateData);
      }
      window.dispatchEvent(new CustomEvent('misa-order-synced', { detail: { id: orderId, ...updateData } }));
      return responseData;
    } else {
      throw new Error(responseData.message || 'Lỗi không xác định từ hệ thống hạch toán');
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Lỗi kết nối API đồng bộ MISA';
    
    if (hasRealDoc) {
      await updateDoc(orderRef, {
        misaSynced: false,
        misaSyncError: errorMsg
      });
    }
    window.dispatchEvent(new CustomEvent('misa-order-synced', { detail: { id: orderId, misaSynced: false, misaSyncError: errorMsg } }));
    throw new Error(errorMsg);
  }
};

/**
 * Đồng bộ danh mục đối tượng nhân viên sang MISA (Employee Sync Gate)
 */
export const syncEmployeeToMisa = async (
  code: string,
  name: string,
  phone = '',
  email = ''
): Promise<any> => {
  const config = getMisaConfig();
  if (!config.isActive) return { status: 'disabled', message: 'MISA Integration is deactivated' };

  const finalCode = code.startsWith('NV-') ? code : `NV-${code.toUpperCase()}`;

  try {
    if (config.localAccountingMode) {
      return { status: 'success', syncedAt: new Date().toISOString() };
    }
    const response = await axios.post('/api/misa/sync-object', {
      code: finalCode,
      name,
      phone,
      email,
      isEmployee: true,
      appId: config.appId,
      accessToken: config.accessToken
    });
    return response.data;
  } catch (error: any) {
    console.error('[MisaService] Error syncing employee object:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Lỗi kết nối API MISA';
    throw new Error(errorMsg);
  }
};

/**
 * Đồng bộ chốt sổ lương sang MISA dưới dạng Chứng từ nghiệp vụ khác (GeneralVoucher)
 */
export const syncPayrollToMisa = async (
  backupId: string,
  name: string,
  year: number,
  month: number,
  details: Array<{ department: string; amount: number }>
): Promise<any> => {
  const config = getMisaConfig();
  if (!config.isActive) {
    throw new Error('Chức năng tích hợp MISA chưa được kích hoạt trong phần cài đặt.');
  }

  const voucherNo = `PK-${backupId.substring(0, 8)}`;
  const totalAmount = details.reduce((sum, d) => sum + d.amount, 0);

  const voucherDetails = details.map((d) => {
    const isSalesOrMarketing = d.department.toLowerCase() === 'marketing' || d.department.toLowerCase() === 'sales';
    const debitAccount = isSalesOrMarketing ? '6421' : '6422';
    const creditAccount = '3341';

    return {
      itemCode: `CP_LUONG_${d.department.toUpperCase()}`,
      itemName: `Chi phí lương bộ phận ${d.department} - Tháng ${month}/${year}`,
      unit: 'Tháng',
      quantity: 1,
      unitPrice: d.amount,
      amount: d.amount,
      vatRate: '0%',
      vatAmount: 0,
      debitAccount,
      creditAccount,
      warehouseCode: config.defaultWarehouseCode || 'KHO_TONG'
    };
  });

  try {
    let responseData;
    if (config.localAccountingMode) {
      responseData = {
        status: 'success',
        voucherId: `VCOMM-${voucherNo}`,
        syncedAt: new Date().toISOString()
      };
    } else {
      const response = await axios.post('/api/misa/sync-voucher', {
        transactionId: backupId,
        voucherNo,
        voucherType: 'GeneralVoucher',
        customerCode: 'NV-ALL',
        details: voucherDetails,
        debitAccount: '6422',
        creditAccount: '3341',
        amount: totalAmount,
        description: `Hạch toán chi phí lương ${name} - Năm ${year}`,
        accountingObjectCode: 'NV-ALL',
        taxRate: 0,
        vatAmount: 0,
        appId: config.appId,
        accessToken: config.accessToken
      });
      responseData = response.data;
    }

    if (responseData && responseData.status === 'success') {
      window.dispatchEvent(new CustomEvent('misa-payroll-synced', { detail: { id: backupId, status: 'success', syncedAt: responseData.syncedAt || new Date().toISOString() } }));
      return responseData;
    } else {
      throw new Error(responseData.message || 'Lỗi không xác định từ hệ thống hạch toán');
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Lỗi kết nối API đồng bộ MISA';
    window.dispatchEvent(new CustomEvent('misa-payroll-synced', { detail: { id: backupId, status: 'error', misaSyncError: errorMsg } }));
    throw new Error(errorMsg);
  }
};

/**
 * Hủy ghi sổ giao dịch kế toán nội bộ / MISA
 */
export const unpostTransaction = async (transactionId: string): Promise<any> => {
  const docRef = doc(db, 'finance_transactions', transactionId);
  try {
    const updateData = {
      misaSynced: false,
      misaVoucherId: null,
      misaSyncedAt: null,
      misaSyncError: ''
    };
    await updateDoc(docRef, updateData as any);
    window.dispatchEvent(new CustomEvent('misa-transaction-synced', { detail: { id: transactionId, ...updateData } }));
    return { status: 'success' };
  } catch (error: any) {
    console.error('[MisaService] Error unposting transaction:', error);
    throw error;
  }
};
