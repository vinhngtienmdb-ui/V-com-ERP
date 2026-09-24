/**
 * VComm 3PL Shipping & Automated Waybill Service
 * Hỗ trợ liên thông tự động với các hãng vận chuyển hàng đầu Việt Nam:
 * - Giao Hàng Nhanh (GHN)
 * - Giao Hàng Tiết Kiệm (GHTK)
 * - Viettel Post
 * - J&T Express
 */

export interface ShippingCarrier {
  id: 'ghn' | 'ghtk' | 'viettel_post' | 'jt_express';
  name: string;
  logo: string;
  hotline: string;
  color: string;
}

export const SHIPPING_CARRIERS: Record<string, ShippingCarrier> = {
  ghn: {
    id: 'ghn',
    name: 'Giao Hàng Nhanh (GHN)',
    logo: '⚡',
    hotline: '1900 636677',
    color: '#f97316' // Cam GHN
  },
  ghtk: {
    id: 'ghtk',
    name: 'Giao Hàng Tiết Kiệm (GHTK)',
    logo: '🚚',
    hotline: '1900 6092',
    color: '#15803d' // Xanh GHTK
  },
  viettel_post: {
    id: 'viettel_post',
    name: 'Viettel Post',
    logo: '🔴',
    hotline: '1900 8095',
    color: '#dc2626' // Đỏ Viettel
  },
  jt_express: {
    id: 'jt_express',
    name: 'J&T Express',
    logo: '📦',
    hotline: '1900 1088',
    color: '#b91c1c' // Đỏ J&T
  }
};

export interface CreateShipmentPayload {
  orderId: string;
  orderSource: '1P_VCOMM' | '3P_SELLER';
  carrierId: 'ghn' | 'ghtk' | 'viettel_post' | 'jt_express';
  sender: {
    name: string;
    phone: string;
    address: string;
    district: string;
    province: string;
  };
  recipient: {
    name: string;
    phone: string;
    address: string;
    district: string;
    province: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
    weightGram?: number;
    price?: number;
  }>;
  totalWeightGram?: number;
  codAmount?: number;
  isInsured?: boolean;
  notes?: string;
  requiredNote?: 'CHOKHEMHANG' | 'CHOXEMHANGKHONGTHU' | 'KHONGCHOXEMHANG';
}

export interface ShipmentResult {
  success: boolean;
  trackingNumber: string;
  carrierId: string;
  carrierName: string;
  shippingFee: number;
  expectedDeliveryDate: string;
  sortCode: string; // Mã phân loại tuyến bưu cục (VD: HN-CG-04B)
  barcodeData: string;
  qrCodeData: string;
  waybillPrintUrl?: string;
  status: 'READY_TO_PICK' | 'PICKING' | 'IN_TRANSIT' | 'DELIVERED';
  createdAt: string;
}

/**
 * Tạo mã vận đơn tự động qua API hãng vận chuyển
 */
export async function createWaybillShipment(payload: CreateShipmentPayload): Promise<ShipmentResult> {
  // Giả lập độ trễ gọi API 3PL
  await new Promise(resolve => setTimeout(resolve, 600));

  const carrier = SHIPPING_CARRIERS[payload.carrierId] || SHIPPING_CARRIERS.ghn;
  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  // Sinh mã vận đơn theo định dạng thực tế của từng hãng
  let trackingNumber = '';
  let sortCode = '';

  switch (payload.carrierId) {
    case 'ghn':
      trackingNumber = `GHN${timestamp}${randomSuffix}`;
      sortCode = 'HN-CG-102B';
      break;
    case 'ghtk':
      trackingNumber = `GHTK.${payload.recipient.province.slice(0, 2).toUpperCase()}.${timestamp}.${randomSuffix}`;
      sortCode = 'S1.D4.KHO_ME';
      break;
    case 'viettel_post':
      trackingNumber = `VT${timestamp}${randomSuffix}VN`;
      sortCode = 'VTP-HUB-01';
      break;
    case 'jt_express':
      trackingNumber = `84${timestamp}${randomSuffix}`;
      sortCode = 'JT-79-Q1';
      break;
    default:
      trackingNumber = `VC${timestamp}${randomSuffix}`;
      sortCode = 'VCOMM-HUB';
  }

  // Tính phí vận chuyển ước tính
  const totalWeight = payload.totalWeightGram || (payload.items || []).reduce((sum, i) => sum + ((i.weightGram || 250) * (i.quantity || 1)), 0) || 500;
  const baseFee = 22000;
  const weightFee = Math.ceil(Math.max(0, totalWeight - 500) / 500) * 5000;
  const estimatedShippingFee = baseFee + weightFee;

  const now = new Date();
  const deliveryDate = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));

  return {
    success: true,
    trackingNumber,
    carrierId: payload.carrierId,
    carrierName: carrier.name,
    shippingFee: estimatedShippingFee,
    expectedDeliveryDate: deliveryDate.toLocaleDateString('vi-VN'),
    sortCode,
    barcodeData: trackingNumber,
    qrCodeData: `https://vcomm.vn/tracking?code=${trackingNumber}`,
    status: 'READY_TO_PICK',
    createdAt: new Date().toISOString()
  };
}

/**
 * Ẩn số điện thoại theo chuẩn Nghị định 13/2023/NĐ-CP (PDPD)
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 7) return phone || '';
  return phone.slice(0, 4) + '****' + phone.slice(-3);
}
