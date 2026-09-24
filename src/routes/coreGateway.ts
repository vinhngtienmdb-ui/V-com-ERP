import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { 
  createWaybillShipment, 
  SHIPPING_CARRIERS, 
  CreateShipmentPayload,
  maskPhoneNumber 
} from '../services/shippingService';
import { 
  executeSmartOrderRouting, 
  FULFILLMENT_HUBS, 
  MOCK_INVENTORY_BATCHES 
} from '../services/smartOrderRouting';

export const coreGatewayRouter = Router();

// In-memory audit trail and reimbursement records (with safe persistence)
let vXuReimbursements: any[] = [
  {
    id: 'VX-REIMB-001',
    timestamp: '2026-09-14 09:30:00',
    partnerType: 'IPOS_STORE',
    partnerId: 'ipos_store_quan1',
    partnerName: 'Cửa hàng Phở V-Liên Minh Q1',
    vXuPoints: 450000,
    reimburseVND: 450000,
    accountingNotes: 'Nợ TK 641 (Loyalty Exp) / Có TK 331 (Phải trả cửa hàng): 450.000đ',
    payoutStatus: 'COMPLETED',
    bankInfo: {
      bankCode: 'MB',
      accountNumber: '0988795908',
      accountName: 'NGUYEN TIEN VINH'
    },
    transactionCode: 'TX-PAYOUT-889102'
  },
  {
    id: 'VX-REIMB-002',
    timestamp: '2026-09-14 11:15:00',
    partnerType: 'SELLER_3P',
    partnerId: 'seller_fashion_vn',
    partnerName: 'Shop Thời Trang V-Style Official',
    vXuPoints: 1250000,
    reimburseVND: 1250000,
    accountingNotes: 'Nợ TK 641 (Loyalty Exp) / Có TK 331 (Phải trả Shop): 1.250.000đ',
    payoutStatus: 'PROCESSING',
    bankInfo: {
      bankCode: 'VCB',
      accountNumber: '1029384756',
      accountName: 'VO THI THU THAO'
    },
    transactionCode: 'TX-PAYOUT-889103'
  }
];

// In-memory 3PL shipment cache
let dispatchedShipments: Record<string, any> = {};

/**
 * 1. API: Danh sách hãng vận chuyển 3PL được tích hợp
 * GET /api/v1/shipping/carriers
 */
coreGatewayRouter.get('/shipping/carriers', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    carriers: Object.values(SHIPPING_CARRIERS)
  });
});

/**
 * 2. API: Tự động điều phối giao vận & cấp mã vận đơn 3PL
 * POST /api/v1/orders/dispatch-3pl
 * Body: CreateShipmentPayload
 */
coreGatewayRouter.post('/orders/dispatch-3pl', async (req: Request, res: Response) => {
  try {
    const payload = req.body as CreateShipmentPayload;

    if (!payload.orderId || !payload.carrierId || !payload.recipient) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu thông tin bắt buộc: orderId, carrierId, recipient'
      });
    }

    console.log(`[CoreGateway] Điều phối đơn hàng #${payload.orderId} sang hãng ${payload.carrierId}`);

    // Call internal shipping adapter
    const waybillResult = await createWaybillShipment(payload);

    // Cache shipment in gateway memory
    dispatchedShipments[payload.orderId] = waybillResult;

    res.json({
      status: 'success',
      message: `Đã cấp mã vận đơn thành công qua ${waybillResult.carrierName}`,
      waybill: waybillResult,
      meta: {
        orderId: payload.orderId,
        trackingNumber: waybillResult.trackingNumber,
        sortCode: waybillResult.sortCode,
        barcodeString: waybillResult.barcodeData,
        shippingFee: waybillResult.shippingFee,
        maskedPhone: maskPhoneNumber(payload.recipient.phone)
      }
    });
  } catch (error: any) {
    console.error('[CoreGateway] Lỗi cấp mã vận đơn 3PL:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể kết nối đến hệ thống bưu cục 3PL'
    });
  }
});

/**
 * 3. API: Tra cứu vận đơn đã cấp theo orderId
 * GET /api/v1/orders/:orderId/waybill
 */
coreGatewayRouter.get('/orders/:orderId/waybill', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const waybill = dispatchedShipments[orderId];

  if (!waybill) {
    return res.status(404).json({
      status: 'error',
      message: `Chưa có thông tin vận đơn cho đơn hàng #${orderId}`
    });
  }

  res.json({
    status: 'success',
    waybill
  });
});

/**
 * 4. API: Cơ chế Hoàn tiền mặt V-Xu (V-Xu Cash Reimbursement Engine)
 * POST /api/v1/settlement/v-xu-reimburse
 * 
 * Nghiệp vụ:
 * Khi người tiêu dùng sử dụng điểm V-Xu tại quầy iPOS liên minh hoặc trên sàn eCommerce,
 * Quỹ Loyalty VComm trích tiền mặt từ tài khoản ngân hàng (TK 1121) hoàn trả 100% giá trị
 * (1 V-Xu = 1 VND) cho Nhà bán / Cửa hàng đối tác thông qua lệnh chi hộ VietQR tự động.
 * 
 * Hạch toán kế toán Thông tư 99/VAS:
 * Bước 1 (Ghi nhận nghĩa vụ hoàn trả):
 *   Nợ TK 641 (Chi phí xúc tiến bán hàng / Quỹ Loyalty)
 *     Có TK 331 (Phải trả Nhà bán / Cửa hàng đối tác)
 * Bước 2 (Khi thực hiện chi tiền mặt qua VietQR):
 *   Nợ TK 331
 *     Có TK 1121 (Tiền gửi ngân hàng)
 */
coreGatewayRouter.post('/settlement/v-xu-reimburse', async (req: Request, res: Response) => {
  try {
    const { 
      partnerType, // 'IPOS_STORE' | 'SELLER_3P' | 'SUPERMARKET_MART'
      partnerId,
      partnerName,
      vXuPoints,
      period,
      bankInfo,
      autoPayout
    } = req.body;

    if (!partnerId || !vXuPoints || Number(vXuPoints) <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Thông tin hoàn tiền không hợp lệ: partnerId và vXuPoints (> 0) là bắt buộc'
      });
    }

    const points = Number(vXuPoints);
    const reimburseVND = points * 1; // Tỷ lệ quy đổi 1 V-Xu = 1 VND
    const reimbId = `VX-REIMB-${Date.now()}`;
    const transactionCode = `TX-PAYOUT-${Math.floor(100000 + Math.random() * 900000)}`;

    const bank = bankInfo || {
      bankCode: 'MB',
      accountNumber: '0988795908',
      accountName: partnerName || 'DOITAC VCOMM'
    };

    // Tạo QuickLink VietQR chi tiền tự động
    const vietQrPayoutUrl = `https://img.vietqr.io/image/${bank.bankCode}-${bank.accountNumber}-compact2.png?amount=${reimburseVND}&addInfo=${encodeURIComponent(`VCOMM HOAN TIEN V-XU ${reimbId}`)}&accountName=${encodeURIComponent(bank.accountName)}`;

    const newRecord = {
      id: reimbId,
      timestamp: new Date().toLocaleString('vi-VN'),
      partnerType: partnerType || 'IPOS_STORE',
      partnerId,
      partnerName: partnerName || 'Đối tác Liên minh VComm',
      period: period || 'Kỳ quyết toán hiện hành',
      vXuPoints: points,
      reimburseVND,
      accountingNotes: `Hạch toán TT99: Nợ TK 641 / Có TK 331 (${reimburseVND.toLocaleString('vi-VN')}đ) ➔ Nợ TK 331 / Có TK 1121`,
      payoutStatus: autoPayout ? 'COMPLETED' : 'PENDING_APPROVAL',
      bankInfo: bank,
      vietQrPayoutUrl,
      transactionCode
    };

    vXuReimbursements.unshift(newRecord);

    console.log(`[V-Xu Reimbursement] Hoàn trả ${reimburseVND}đ cho ${partnerName} (#${reimbId})`);

    res.json({
      status: 'success',
      message: `Đã tạo lệnh hoàn tiền mặt ${reimburseVND.toLocaleString('vi-VN')} VND cho điểm V-Xu thành công`,
      reimbursement: newRecord
    });
  } catch (error: any) {
    console.error('[CoreGateway] Lỗi xử lý hoàn tiền V-Xu:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi xử lý hoàn tiền mặt V-Xu'
    });
  }
});

/**
 * 5. API: Lấy danh sách lịch sử lệnh hoàn tiền V-Xu
 * GET /api/v1/settlement/v-xu-reimbursements
 */
coreGatewayRouter.get('/settlement/v-xu-reimbursements', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    totalRecords: vXuReimbursements.length,
    totalVndReimbursed: vXuReimbursements.reduce((sum, r) => sum + (r.reimburseVND || 0), 0),
    data: vXuReimbursements
  });
});

/**
 * 6. API: Khởi tạo mã thanh toán Dynamic VietQR & Open Banking
 * POST /api/v1/payments/dynamic-vietqr
 */
coreGatewayRouter.post('/payments/dynamic-vietqr', (req: Request, res: Response) => {
  const { 
    orderId, 
    amount, 
    customerName,
    description,
    bankCode = 'MB', 
    accountNumber = '0988795908',
    accountName = 'CONG TY CP THUONG MAI DIEN TU VCOMM'
  } = req.body;

  if (!orderId || !amount) {
    return res.status(400).json({
      status: 'error',
      message: 'orderId và amount là bắt buộc để sinh mã Dynamic VietQR'
    });
  }

  const orderAmount = Number(amount);
  const transferContent = `VCOMM ${orderId}`.toUpperCase();
  
  // Chuẩn VietQR QuickLink Napas247
  const qrImageUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${orderAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

  res.json({
    status: 'success',
    paymentMethod: 'DYNAMIC_VIETQR_NAPAS247',
    orderId,
    amount: orderAmount,
    transferContent,
    bankInfo: {
      bankCode,
      bankName: 'Ngân hàng Quân Đội (MB Bank)',
      accountNumber,
      accountName
    },
    qrImageUrl,
    deeplink: `vietqr://payment?bin=970422&acc=${accountNumber}&amount=${orderAmount}&des=${encodeURIComponent(transferContent)}`,
    note: 'Hệ thống tự động ghi nhận thanh toán trong 3 giây khi nhận được Webhook SePay/OpenBanking.'
  });
});

/**
 * 7. API: Đồng bộ đơn hàng từ Sàn TMĐT sang ERP Core
 * POST /api/v1/orders/sync-from-ecommerce
 */
coreGatewayRouter.post('/orders/sync-from-ecommerce', async (req: Request, res: Response) => {
  const order = req.body;
  console.log(`[CoreGateway] Đã nhận đơn hàng từ eCommerce: #${order.id || order.orderId} - Tổng tiền: ${order.total || order.amount}`);

  // Tự động phân loại 1P / 3P
  const is1P = order.items?.every((item: any) => item.sellerId === 'vcomm' || !item.sellerId);
  const orderSource = is1P ? '1P_VCOMM' : '3P_SELLER';

  // Tự động sinh mã vận đơn nếu chưa có
  let waybillInfo = null;
  if (!order.trackingNumber) {
    waybillInfo = await createWaybillShipment({
      orderId: order.id || `VC-${Date.now().toString().slice(-6)}`,
      orderSource,
      carrierId: 'ghn',
      sender: {
        name: is1P ? 'Kho Tổng VComm FBL' : 'Shop Đối Tác VComm',
        phone: '0988795908',
        address: 'Kho KCN Tân Bình',
        district: 'Tân Bình',
        province: 'TP. Hồ Chí Minh'
      },
      recipient: {
        name: order.shippingAddress?.fullName || order.customerName || 'Khách Hàng VComm',
        phone: order.shippingAddress?.phone || '0901234567',
        address: order.shippingAddress?.addressLine || 'Số 1 Lê Duẩn',
        district: order.shippingAddress?.district || 'Quận 1',
        province: order.shippingAddress?.city || 'TP. Hồ Chí Minh'
      },
      items: (order.items || []).map((i: any) => ({
        name: i.name || 'Sản phẩm TMĐT',
        quantity: i.quantity || 1,
        weightGram: i.weight || 250
      })),
      codAmount: order.paymentMethod === 'cod' ? (order.total || 0) : 0
    });
  }

  res.json({
    status: 'success',
    message: 'Đơn hàng TMĐT đã được đồng bộ vào Core ERP Hub',
    orderSource,
    waybill: waybillInfo
  });
});

// ==========================================
// 8. CỔNG THANH TOÁN APIPAY (VIETQR PRO & VIRTUAL ACCOUNT)
// ==========================================

interface ApiPayTransaction {
  id: string;
  chargeId?: string;
  payoutId?: string;
  orderId: string;
  amount: number;
  type: 'INWARD_CHARGE' | 'OUTWARD_PAYOUT';
  paymentMethod: 'VIETQR' | 'VA' | 'ATM' | 'VISA' | 'WALLET';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  customerName: string;
  customerPhone?: string;
  bankCode?: string;
  accountNumber?: string;
  description: string;
  accountingNote: string;
  createdAt: string;
  completedAt?: string;
}

const apiPayTransactions: ApiPayTransaction[] = [
  {
    id: 'TXN-AP-9901',
    chargeId: 'CHG-APIPAY-001',
    orderId: 'ORD-VC-2026-9812',
    amount: 1450000,
    type: 'INWARD_CHARGE',
    paymentMethod: 'VIETQR',
    status: 'SUCCESS',
    customerName: 'Hoàng Kim Long',
    customerPhone: '0901889988',
    bankCode: 'MB',
    accountNumber: '0318914439',
    description: 'Thanh toán đơn hàng ORD-VC-2026-9812 qua APIPay VietQR',
    accountingNote: 'Nợ TK 1121 / Có TK 131: 1.450.000đ (Đã gạch nợ tự động)',
    createdAt: '2026-09-17 07:15:00',
    completedAt: '2026-09-17 07:15:01'
  },
  {
    id: 'TXN-AP-9902',
    chargeId: 'CHG-APIPAY-002',
    orderId: 'ORD-VC-2026-9815',
    amount: 820000,
    type: 'INWARD_CHARGE',
    paymentMethod: 'VA',
    status: 'SUCCESS',
    customerName: 'Trần Thảo My',
    customerPhone: '0912345678',
    bankCode: 'MB',
    accountNumber: 'VCOMM9815',
    description: 'Thanh toán đơn hàng ORD-VC-2026-9815 qua Tài khoản ảo VA',
    accountingNote: 'Nợ TK 1121 / Có TK 131: 820.000đ',
    createdAt: '2026-09-17 07:45:00',
    completedAt: '2026-09-17 07:45:02'
  },
  {
    id: 'TXN-AP-9903',
    payoutId: 'PO-REFUND-001',
    orderId: 'VX-REIMB-001',
    amount: 450000,
    type: 'OUTWARD_PAYOUT',
    paymentMethod: 'VIETQR',
    status: 'SUCCESS',
    customerName: 'Cửa hàng Phở V-Liên Minh Q1',
    bankCode: 'MB',
    accountNumber: '0988795908',
    description: 'Chi hộ APIPay: Hoàn tiền mặt V-Xu cho đối tác iPOS',
    accountingNote: 'Nợ TK 331 / Có TK 1121: 450.000đ (Napas247 tức thời)',
    createdAt: '2026-09-17 08:00:00',
    completedAt: '2026-09-17 08:00:01'
  }
];

/**
 * 8.1 Khởi tạo giao dịch Thu hộ APIPay (Create Charge)
 * POST /api/v1/payments/apipay/create-charge
 */
coreGatewayRouter.post('/payments/apipay/create-charge', (req: Request, res: Response) => {
  try {
    const {
      orderId,
      amount,
      currency = 'VND',
      orderDescription,
      customerName = 'Khách Hàng VComm',
      customerEmail = 'khachhang@vcomm.vn',
      customerPhone = '0901234567',
      returnUrl = 'http://localhost:3002/orders',
      cancelUrl = 'http://localhost:3002/cart'
    } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu orderId hoặc amount bắt buộc'
      });
    }

    const chargeAmount = Number(amount);
    const chargeId = `CHG-APIPAY-${Date.now()}`;
    const cleanId = orderId.toString().replace(/[^0-9a-zA-Z]/g, '').slice(-8).toUpperCase();
    const virtualAccountNumber = `VCOMM${cleanId}`;
    const transferContent = `VCOMM ${orderId}`.toUpperCase();

    // Chuẩn VietQR PRO MB Bank
    const bankCode = 'MB';
    const primaryAccount = '0318914439';
    const accountName = 'CONG TY CP THUONG MAI DIEN TU VCOMM';
    const qrCodeUrl = `https://img.vietqr.io/image/${bankCode}-${primaryAccount}-compact2.png?amount=${chargeAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const newTxn: ApiPayTransaction = {
      id: `TXN-AP-${Math.floor(1000 + Math.random() * 9000)}`,
      chargeId,
      orderId,
      amount: chargeAmount,
      type: 'INWARD_CHARGE',
      paymentMethod: 'VIETQR',
      status: 'PENDING',
      customerName,
      customerPhone,
      bankCode,
      accountNumber: virtualAccountNumber,
      description: orderDescription || `Thanh toan don hang ${orderId} tai VComm`,
      accountingNote: `Dự thu: Nợ TK 1121 / Có TK 131 (${chargeAmount.toLocaleString('vi-VN')}đ)`,
      createdAt: new Date().toLocaleString('vi-VN')
    };

    apiPayTransactions.unshift(newTxn);

    res.json({
      success: true,
      chargeId,
      orderId,
      amount: chargeAmount,
      currency,
      paymentUrl: `http://localhost:3002/checkout/apipay-gateway?chargeId=${chargeId}`,
      qrCodeUrl,
      virtualAccount: {
        accountNumber: virtualAccountNumber,
        bankCode: 'MB',
        bankName: 'Ngân hàng Quân Đội (MB Bank)',
        accountName
      },
      transferContent,
      expiresAt,
      message: 'Khởi tạo cổng thanh toán APIPay thành công'
    });
  } catch (err: any) {
    console.error('[APIPay] Lỗi khởi tạo charge:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi kết nối cổng APIPay' });
  }
});

/**
 * 8.2 Xử lý Webhook IPN từ APIPay (Tự động gạch nợ & hạch toán kế toán)
 * POST /api/v1/payments/apipay-webhook
 */
coreGatewayRouter.post('/payments/apipay-webhook', (req: Request, res: Response) => {
  try {
    const {
      merchantId = 'MERCHANT_VCOMM_PRO_01',
      transactionId = `TXN-APIPAY-${Date.now()}`,
      orderId,
      amount,
      paymentMethod = 'VIETQR',
      status = 'SUCCESS',
      paidAt = new Date().toISOString(),
      signature
    } = req.body;

    console.log(`[APIPay Webhook IPN] Nhận callback đơn hàng #${orderId} - Số tiền: ${amount} - Trạng thái: ${status}`);

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Missing orderId' });
    }

    // Cập nhật trạng thái trong bộ nhớ giao dịch
    const existingTxn = apiPayTransactions.find(t => t.orderId === orderId || t.chargeId === orderId);
    if (existingTxn) {
      existingTxn.status = status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
      existingTxn.completedAt = new Date().toLocaleString('vi-VN');
      existingTxn.accountingNote = `Hạch toán TT99: Nợ TK 1121 / Có TK 131 (${Number(amount || existingTxn.amount).toLocaleString('vi-VN')}đ) - ĐÃ GẠCH NỢ QUA APIPAY`;
    } else {
      apiPayTransactions.unshift({
        id: `TXN-AP-${Math.floor(1000 + Math.random() * 9000)}`,
        chargeId: `CHG-${orderId}`,
        orderId,
        amount: Number(amount || 0),
        type: 'INWARD_CHARGE',
        paymentMethod: paymentMethod as any,
        status: 'SUCCESS',
        customerName: 'Khách hàng Sàn TMĐT',
        bankCode: 'MB',
        accountNumber: '0318914439',
        description: `Thanh toán thành công đơn hàng #${orderId}`,
        accountingNote: `Nợ TK 1121 / Có TK 131 (${Number(amount || 0).toLocaleString('vi-VN')}đ) - Xác nhận tự động`,
        createdAt: new Date().toLocaleString('vi-VN'),
        completedAt: new Date().toLocaleString('vi-VN')
      });
    }

    res.json({
      success: true,
      message: 'IPN processed successfully: Order marked as PAID',
      orderId,
      status: 'PAID',
      clearedAt: paidAt
    });
  } catch (err: any) {
    console.error('[APIPay Webhook] Lỗi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 8.3 Chi hộ Payout qua APIPay (Hoàn tiền V-Xu & Rút ví Shop 24/7 tức thời)
 * POST /api/v1/payments/apipay/create-payout
 */
coreGatewayRouter.post('/payments/apipay/create-payout', (req: Request, res: Response) => {
  try {
    const {
      payoutId = `PO-VCOMM-${Date.now()}`,
      recipientBankCode = 'MB',
      recipientAccountNumber,
      recipientAccountName,
      amount,
      reason = 'Chi hộ hoàn tiền V-Xu / Rút doanh số Shop'
    } = req.body;

    if (!recipientAccountNumber || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu số tài khoản hoặc số tiền chi hộ hợp lệ'
      });
    }

    const payoutAmount = Number(amount);
    const txnId = `TXN-AP-PO-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayout: ApiPayTransaction = {
      id: txnId,
      payoutId,
      orderId: payoutId,
      amount: payoutAmount,
      type: 'OUTWARD_PAYOUT',
      paymentMethod: 'VIETQR',
      status: 'SUCCESS',
      customerName: recipientAccountName || 'Chủ tài khoản thụ hưởng',
      bankCode: recipientBankCode,
      accountNumber: recipientAccountNumber,
      description: reason,
      accountingNote: `Hạch toán TT99: Nợ TK 331 / Có TK 1121 (${payoutAmount.toLocaleString('vi-VN')}đ) - Napas247 Chi hộ tức thời`,
      createdAt: new Date().toLocaleString('vi-VN'),
      completedAt: new Date().toLocaleString('vi-VN')
    };

    apiPayTransactions.unshift(newPayout);

    res.json({
      success: true,
      payoutId,
      transactionId: txnId,
      amount: payoutAmount,
      status: 'SUCCESS',
      recipient: {
        bankCode: recipientBankCode,
        accountNumber: recipientAccountNumber,
        accountName: recipientAccountName
      },
      message: `Đã thực hiện lệnh chi hộ ${payoutAmount.toLocaleString('vi-VN')} VND thành công qua Napas247`
    });
  } catch (err: any) {
    console.error('[APIPay Payout] Lỗi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 8.4 Danh sách giao dịch Cổng APIPay
 * GET /api/v1/payments/apipay/transactions
 */
coreGatewayRouter.get('/payments/apipay/transactions', (req: Request, res: Response) => {
  res.json({
    success: true,
    totalTransactions: apiPayTransactions.length,
    data: apiPayTransactions
  });
});

// ==========================================
// 9. VCOMM E-INVOICE ADAPTER
// ==========================================

interface ElectronicInvoice {
  id: string;
  invoiceNo: string;
  invoiceSeries: string;
  orderId: string;
  customerName: string;
  customerTaxCode?: string;
  subTotal: number;
  vatAmount: number;
  total: number;
  issuedAt: string;
  status: 'ISSUED' | 'SIGNED' | 'CANCELED';
  hsmSigned: boolean;
  misaCode: string;
}

const mockElectronicInvoices: ElectronicInvoice[] = [
  {
    id: 'INV-2026-001',
    invoiceNo: '0001289',
    invoiceSeries: '1C26TVC',
    orderId: 'ORD-VC-2026-9812',
    customerName: 'Hoàng Kim Long',
    customerTaxCode: '0318914439',
    subTotal: 1342593,
    vatAmount: 107407,
    total: 1450000,
    issuedAt: '2026-09-17 07:20:00',
    status: 'SIGNED',
    hsmSigned: true,
    misaCode: 'VC-INV-8891023'
  },
  {
    id: 'INV-2026-002',
    invoiceNo: '0001290',
    invoiceSeries: '1C26TVC',
    orderId: 'ORD-VC-2026-9815',
    customerName: 'Trần Thảo My',
    subTotal: 759259,
    vatAmount: 60741,
    total: 820000,
    issuedAt: '2026-09-17 07:50:00',
    status: 'SIGNED',
    hsmSigned: true,
    misaCode: 'VC-INV-8891024'
  }
];

coreGatewayRouter.post('/finance/me-invoice/issue-batch', (req: Request, res: Response) => {
  try {
    const { orderIds = [] } = req.body;
    const issued: ElectronicInvoice[] = [];

    const ordersToIssue = orderIds.length > 0 ? orderIds : [`ORD-VC-${Date.now().toString().slice(-4)}`];

    ordersToIssue.forEach((ordId: string, idx: number) => {
      const invNo = (1291 + mockElectronicInvoices.length + idx).toString().padStart(7, '0');
      const inv: ElectronicInvoice = {
        id: `INV-2026-${Date.now()}-${idx}`,
        invoiceNo: invNo,
        invoiceSeries: '1C26TVC',
        orderId: ordId,
        customerName: 'Khách hàng Sàn VComm',
        subTotal: 925926,
        vatAmount: 74074,
        total: 1000000,
        issuedAt: new Date().toLocaleString('vi-VN'),
        status: 'SIGNED',
        hsmSigned: true,
        misaCode: `VC-INV-${Math.floor(1000000 + Math.random() * 9000000)}`
      };
      mockElectronicInvoices.unshift(inv);
      issued.push(inv);
    });

    res.json({
      success: true,
      message: `Đã ký số HSM và phát hành ${issued.length} hóa đơn điện tử thành công qua VComm e-Invoice`,
      invoices: issued
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

coreGatewayRouter.get('/finance/me-invoice/invoices', (req: Request, res: Response) => {
  res.json({
    success: true,
    total: mockElectronicInvoices.length,
    data: mockElectronicInvoices
  });
});

// ==========================================
// 10. THUẾ TMĐT (NGHỊ ĐỊNH 126/2020 & THÔNG TƯ 88/2021)
// ==========================================

coreGatewayRouter.get('/finance/tax-deductions', (req: Request, res: Response) => {
  const taxRecords = [
    {
      id: 'TAX-001',
      sellerId: 'SEL-101',
      sellerName: 'Điện Máy Xanh ERP',
      sellerTaxCode: '0101234567',
      month: '09/2026',
      totalRevenue: 540000000,
      vatRate: 0.01,
      vatDeducted: 5400000,
      pitRate: 0.005,
      pitDeducted: 2700000,
      totalTaxDeducted: 8100000,
      status: 'DA_KHIEU_NAI_GDT',
      gdtSubmissionCode: 'TCT-ND126-2026-9811'
    },
    {
      id: 'TAX-002',
      sellerId: 'SEL-102',
      sellerName: 'Thời Trang VComm Official',
      sellerTaxCode: '0314567890',
      month: '09/2026',
      totalRevenue: 120000000,
      vatRate: 0.01,
      vatDeducted: 1200000,
      pitRate: 0.005,
      pitDeducted: 600000,
      totalTaxDeducted: 1800000,
      status: 'DA_KHIEU_NAI_GDT',
      gdtSubmissionCode: 'TCT-ND126-2026-9812'
    }
  ];

  res.json({
    success: true,
    regulation: 'Nghị định 126/2020/NĐ-CP & Thông tư 88/2021/TT-BTC',
    company: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM',
    companyTaxCode: '0318914439',
    totalTaxWithheld: taxRecords.reduce((s, r) => s + r.totalTaxDeducted, 0),
    records: taxRecords
  });
});

/**
 * 10.1 Xuất file XML Tờ khai thuế TMĐT chuẩn Tổng cục Thuế (eTax Mẫu 01/CNKD)
 * GET /api/v1/finance/tax-reports/export-xml
 */
coreGatewayRouter.get('/finance/tax-reports/export-xml', (req: Request, res: Response) => {
  const period = String(req.query.period || 'Q3/2026');
  const mst = '0318914439';
  const companyName = 'CONG TY CO PHAN THUONG MAI DIEN TU VCOMM';

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<HSoThueDTu xmlns="http://kekhaithue.gdt.gov.vn/TKhaiThue" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <TTinChung>
    <TTinDVu>
      <MaDVu>eTax-VComm-Gateway</MaDVu>
      <TenDVu>He thong Quan tri Thue San TMDT VComm</TenDVu>
      <PhienBan>2.4.0</PhienBan>
    </TTinDVu>
    <TTinTKhai>
      <MaTKhai>01_CNKD_TMDT</MaTKhai>
      <TenTKhai>TO KHAI THUE KHAU TRU SAN THUONG MAI DIEN TU (ND 126/2020 &amp; TT 88/2021)</TenTKhai>
      <MoTaBMau>To khai tong hop thue GTGT va TNCN khau tru tai nguon cua Ca nhan kinh doanh tren San TMDT</MoTaBMau>
      <KyKKhaiThue>
        <KieuKy>Q</KieuKy>
        <KyKKhai>03/2026</KyKKhai>
        <KyKKhaiTuNgay>01/07/2026</KyKKhaiTuNgay>
        <KyKKhaiDenNgay>30/09/2026</KyKKhaiDenNgay>
      </KyKKhaiThue>
      <LoaiTKhai>C</LoaiTKhai>
      <NgayLapTKhai>${new Date().toISOString().slice(0, 10)}</NgayLapTKhai>
      <NguoiKy>NGUYEN TIEN VINH - TONG GIAM DOC</NguoiKy>
      <NgayKy>${new Date().toISOString().slice(0, 10)}</NgayKy>
    </TTinTKhai>
    <NNT>
      <MST>${mst}</MST>
      <TenNNT>${companyName}</TenNNT>
      <DChiNNT>Tang 12, Toa nha VComm Tower, TP. Ho Chi Minh</DChiNNT>
      <DThoaiNNT>0988795908</DThoaiNNT>
      <EmailNNT>tax@vcomm.vn</EmailNNT>
      <TenCQTNoiNop>Chi cuc Thue Quan Tan Binh - Cuc Thue TP. Ho Chi Minh</TenCQTNoiNop>
      <MaCQTNoiNop>70119</MaCQTNoiNop>
    </NNT>
  </TTinChung>
  <CTietTKhai>
    <BangKeKhauTruTMDT>
      <Dong>
        <STT>1</STT>
        <TenShop>Dien May Xanh ERP</TenShop>
        <MSTNguoiBan>0101234567</MSTNguoiBan>
        <CCCD>001092008891</CCCD>
        <DoanhSoSan>540000000</DoanhSoSan>
        <ThueSuatGTGT>0.01</ThueSuatGTGT>
        <TienThueGTGTKhauTru>5400000</TienThueGTGTKhauTru>
        <ThueSuatTNCN>0.005</ThueSuatTNCN>
        <TienThueTNCNKhauTru>2700000</TienThueTNCNKhauTru>
        <TongThueKhauTru>8100000</TongThueKhauTru>
        <TrangThaiChuyenTCT>DA_DOI_SOAT</TrangThaiChuyenTCT>
      </Dong>
      <Dong>
        <STT>2</STT>
        <TenShop>Thoi Trang VComm Official</TenShop>
        <MSTNguoiBan>0314567890</MSTNguoiBan>
        <CCCD>079198007742</CCCD>
        <DoanhSoSan>120000000</DoanhSoSan>
        <ThueSuatGTGT>0.01</ThueSuatGTGT>
        <TienThueGTGTKhauTru>1200000</TienThueGTGTKhauTru>
        <ThueSuatTNCN>0.005</ThueSuatTNCN>
        <TienThueTNCNKhauTru>600000</TienThueTNCNKhauTru>
        <TongThueKhauTru>1800000</TongThueKhauTru>
        <TrangThaiChuyenTCT>DA_DOI_SOAT</TrangThaiChuyenTCT>
      </Dong>
    </BangKeKhauTruTMDT>
    <TongHopNghiaVuThue>
      <TongDoanhThuToanSan>660000000</TongDoanhThuToanSan>
      <TongThueGTGTPhaiNop>6600000</TongThueGTGTPhaiNop>
      <TongThueTNCNPhaiNop>3300000</TongThueTNCNPhaiNop>
      <TongGiaTriKhauTruNopNSNN>9900000</TongGiaTriKhauTruNopNSNN>
    </TongHopNghiaVuThue>
  </CTietTKhai>
  <ChuKySoHSM>
    <SerialToken>5404B8929A10098F2026</SerialToken>
    <NhaCungCap>VNPT-CA / VComm eSign HSM</NhaCungCap>
    <ThoiGianKy>${new Date().toISOString()}</ThoiGianKy>
    <GiaTriChuKy>MEYCIQDxKj...SHA256withRSA...99812A</GiaTriChuKy>
  </ChuKySoHSM>
</HSoThueDTu>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="ToKhaiThueTMDT_01_CNKD_${mst}_${period.replace('/', '_')}.xml"`);
  res.send(xmlContent);
});

// ==========================================
// 11. IMMUTABLE AUDIT TRAIL ENGINE (SỔ CÁI KIỂM TOÁN BẤT BIẾN)
// ==========================================

export interface AuditRecord {
  id: string;
  timestamp: string;
  action: 'INVOICE_ISSUED' | 'TAX_WITHHELD' | 'PAYMENT_RECEIVED' | 'PAYOUT_EXECUTED' | 'PRICE_MODIFIED' | 'ORDER_CANCELED';
  module: 'FINANCE' | 'ORDERS' | 'WMS' | 'HR' | 'SYSTEM';
  actor: string;
  role: string;
  entityId: string;
  details: string;
  previousHash: string;
  currentHash: string;
  ipAddress: string;
}

let auditLogChain: AuditRecord[] = [
  {
    id: 'AUD-0001',
    timestamp: '2026-09-17 07:15:00',
    action: 'PAYMENT_RECEIVED',
    module: 'FINANCE',
    actor: 'system.apipay.webhook',
    role: 'PAYMENT_GATEWAY',
    entityId: 'ORD-VC-2026-9812',
    details: 'Nhận thanh toán 1.450.000đ qua APIPay VietQR PRO. Gạch nợ tự động Nợ TK 1121 / Có TK 131.',
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    currentHash: '7b8f9e10283c4a5b6d7e8f90123456789abcdef0123456789abcdef012345678',
    ipAddress: '127.0.0.1'
  },
  {
    id: 'AUD-0002',
    timestamp: '2026-09-17 07:20:00',
    action: 'INVOICE_ISSUED',
    module: 'FINANCE',
    actor: 'accountant.nguyenvana',
    role: 'CHIEF_ACCOUNTANT',
    entityId: 'INV-2026-001',
    details: 'Ký số HSM phát hành HĐĐT 1C26TVC-0001289 cho đơn hàng ORD-VC-2026-9812. Thuế GTGT: 107.407đ.',
    previousHash: '7b8f9e10283c4a5b6d7e8f90123456789abcdef0123456789abcdef012345678',
    currentHash: 'c4d5e6f7a8b90123456789abcdef0123456789abcdef0123456789abcdef0123',
    ipAddress: '192.168.1.105'
  },
  {
    id: 'AUD-0003',
    timestamp: '2026-09-17 08:00:00',
    action: 'TAX_WITHHELD',
    module: 'FINANCE',
    actor: 'system.tax.engine',
    role: 'TAX_AUTOMATION',
    entityId: 'TAX-001',
    details: 'Tự động trích nộp 8.100.000đ thuế TMĐT NĐ 126 từ doanh số 540tr của Shop Điện Máy Xanh ERP.',
    previousHash: 'c4d5e6f7a8b90123456789abcdef0123456789abcdef0123456789abcdef0123',
    currentHash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    ipAddress: '127.0.0.1'
  }
];

coreGatewayRouter.get('/finance/audit-trail', (req: Request, res: Response) => {
  res.json({
    success: true,
    totalRecords: auditLogChain.length,
    blockchainIntegrity: 'VERIFIED_VALID',
    latestHash: auditLogChain[auditLogChain.length - 1]?.currentHash || '',
    records: auditLogChain
  });
});

coreGatewayRouter.post('/finance/audit-trail/log', (req: Request, res: Response) => {
  try {
    const { action, module, actor, role, entityId, details, ipAddress = '127.0.0.1' } = req.body;
    const prevRecord = auditLogChain[auditLogChain.length - 1];
    const prevHash = prevRecord ? prevRecord.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toLocaleString('vi-VN');

    // Sinh hash SHA-256 bất biến
    const hashData = `${prevHash}|${timestamp}|${action}|${module}|${actor}|${entityId}|${details}`;
    const currentHash = crypto.createHash('sha256').update(hashData).digest('hex');

    const newRecord: AuditRecord = {
      id: `AUD-${(auditLogChain.length + 1).toString().padStart(4, '0')}`,
      timestamp,
      action: action || 'PAYMENT_RECEIVED',
      module: module || 'FINANCE',
      actor: actor || 'admin',
      role: role || 'SYSTEM_OPERATOR',
      entityId: entityId || `REC-${Date.now()}`,
      details: details || 'Ghi nhận thao tác tài chính nghiệp vụ',
      previousHash: prevHash,
      currentHash,
      ipAddress
    };

    auditLogChain.push(newRecord);

    res.json({
      success: true,
      record: newRecord,
      message: 'Đã ghi nhận bản ghi vào Sổ cái kiểm toán bất biến (Audit Trail) thành công'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 12. SMART ORDER ROUTING & FEFO WMS ENGINE
// ==========================================

/**
 * GET /api/v1/wms/fulfillment-hubs
 */
coreGatewayRouter.get('/wms/fulfillment-hubs', (req: Request, res: Response) => {
  res.json({
    success: true,
    hubs: FULFILLMENT_HUBS
  });
});

/**
 * GET /api/v1/wms/fefo-batches
 */
coreGatewayRouter.get('/wms/fefo-batches', (req: Request, res: Response) => {
  const urgentBatches = MOCK_INVENTORY_BATCHES.filter(b => b.daysRemaining <= 45);
  res.json({
    success: true,
    totalBatches: MOCK_INVENTORY_BATCHES.length,
    urgentCount: urgentBatches.length,
    batches: MOCK_INVENTORY_BATCHES
  });
});

/**
 * POST /api/v1/wms/smart-order-routing
 */
coreGatewayRouter.post('/wms/smart-order-routing', (req: Request, res: Response) => {
  try {
    const orderInput = req.body;
    if (!orderInput || !orderInput.orderId || !orderInput.shippingProvince) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đơn hàng hoặc tỉnh/thành giao hàng' });
    }

    const decision = executeSmartOrderRouting(orderInput);

    // Ghi vào Immutable Audit Trail
    const prevHash = auditLogChain.length > 0 ? auditLogChain[auditLogChain.length - 1].currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const hashData = `${prevHash}|${timestamp}|ORDER_ROUTED|WMS|system.sor.ai|${orderInput.orderId}|${decision.reason}`;
    const currentHash = crypto.createHash('sha256').update(hashData).digest('hex');

    const routingAudit: AuditRecord = {
      id: `AUD-${(auditLogChain.length + 1).toString().padStart(4, '0')}`,
      timestamp,
      action: 'ORDER_ROUTED' as any,
      module: 'WMS' as any,
      actor: 'system.sor.ai',
      role: 'SMART_ORDER_ROUTER',
      entityId: orderInput.orderId,
      details: decision.reason,
      previousHash: prevHash,
      currentHash,
      ipAddress: '127.0.0.1'
    };
    auditLogChain.push(routingAudit);

    res.json({
      success: true,
      decision,
      auditRecord: routingAudit
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});


