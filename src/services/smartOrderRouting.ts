/**
 * VComm Smart Order Routing (SOR) & FEFO Inventory Engine
 * Thuật toán định tuyến đơn hàng thông minh đa kho và xuất kho ưu tiên hạn dùng
 */

export interface WarehouseNode {
  id: string;
  name: string;
  code: string;
  region: 'NORTH' | 'CENTRAL' | 'SOUTH';
  address: string;
  province: string;
  lat: number;
  lng: number;
  capacityScore: number; // 0 - 100
  isActive: boolean;
}

export const FULFILLMENT_HUBS: WarehouseNode[] = [
  {
    id: 'WH-SGN',
    name: 'Tổng kho Miền Nam - Tân Bình',
    code: 'SGN-HUB-01',
    region: 'SOUTH',
    address: 'Số 18 Đường Bạch Đằng, Phường 2, Quận Tân Bình, TP. Hồ Chí Minh',
    province: 'Hồ Chí Minh',
    lat: 10.8014,
    lng: 106.6534,
    capacityScore: 95,
    isActive: true
  },
  {
    id: 'WH-DAD',
    name: 'Trung tâm Phân phối Miền Trung - Hòa Khánh',
    code: 'DAD-HUB-01',
    region: 'CENTRAL',
    address: 'Đường Số 3, KCN Hòa Khánh, Quận Liên Chiểu, TP. Đà Nẵng',
    province: 'Đà Nẵng',
    lat: 16.0678,
    lng: 108.1542,
    capacityScore: 88,
    isActive: true
  },
  {
    id: 'WH-HAN',
    name: 'Tổng kho Miền Bắc - Cầu Giấy',
    code: 'HAN-HUB-01',
    region: 'NORTH',
    address: 'Số 10 Phạm Văn Bạch, Phường Yên Hòa, Quận Cầu Giấy, TP. Hà Nội',
    province: 'Hà Nội',
    lat: 21.0333,
    lng: 105.7833,
    capacityScore: 92,
    isActive: true
  }
];

export interface InventoryBatch {
  id: string;
  batchNumber: string;
  sku: string;
  productName: string;
  warehouseId: string;
  warehouseCode: string;
  shelfLocation: string; // Vị trí kệ: vd K3-A-04
  manufacturingDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  initialQty: number;
  availableQty: number;
  reservedQty: number;
  status: 'SAFE' | 'NEAR_EXPIRY' | 'EXPIRED';
  daysRemaining: number;
}

// Dữ liệu mẫu các Lô hàng chuẩn FEFO
export const MOCK_INVENTORY_BATCHES: InventoryBatch[] = [
  {
    id: 'BATCH-001',
    batchNumber: 'LOT-2026-N901',
    sku: 'SKU-S24-ULTRA',
    productName: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray',
    warehouseId: 'WH-SGN',
    warehouseCode: 'SGN-HUB-01',
    shelfLocation: 'A1-R02-B01',
    manufacturingDate: '2026-01-10',
    expiryDate: '2027-01-10',
    initialQty: 100,
    availableQty: 42,
    reservedQty: 8,
    status: 'SAFE',
    daysRemaining: 480
  },
  {
    id: 'BATCH-002',
    batchNumber: 'LOT-2026-N902',
    sku: 'SKU-S24-ULTRA',
    productName: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray',
    warehouseId: 'WH-HAN',
    warehouseCode: 'HAN-HUB-01',
    shelfLocation: 'B2-R01-A05',
    manufacturingDate: '2026-02-15',
    expiryDate: '2027-02-15',
    initialQty: 80,
    availableQty: 25,
    reservedQty: 5,
    status: 'SAFE',
    daysRemaining: 516
  },
  {
    id: 'BATCH-003',
    batchNumber: 'LOT-2025-Q489',
    sku: 'SKU-S24-ULTRA',
    productName: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray',
    warehouseId: 'WH-DAD',
    warehouseCode: 'DAD-HUB-01',
    shelfLocation: 'C1-R03-A02',
    manufacturingDate: '2025-11-01',
    expiryDate: '2026-11-01',
    initialQty: 50,
    availableQty: 18,
    reservedQty: 2,
    status: 'NEAR_EXPIRY',
    daysRemaining: 45 // Cận hạn bảo hành/date -> Cần xuất trước theo FEFO
  },
  {
    id: 'BATCH-004',
    batchNumber: 'LOT-MILK-2026-A1',
    sku: 'SKU-ORGANIC-MILK',
    productName: 'Sữa tươi hữu cơ VComm Farm 1L',
    warehouseId: 'WH-SGN',
    warehouseCode: 'SGN-HUB-01',
    shelfLocation: 'COLD-01-A',
    manufacturingDate: '2026-08-01',
    expiryDate: '2026-10-15',
    initialQty: 300,
    availableQty: 85,
    reservedQty: 15,
    status: 'NEAR_EXPIRY',
    daysRemaining: 28 // HSD còn 28 ngày -> Cần ưu tiên xuất FEFO ngay lập tức
  },
  {
    id: 'BATCH-005',
    batchNumber: 'LOT-MILK-2026-B2',
    sku: 'SKU-ORGANIC-MILK',
    productName: 'Sữa tươi hữu cơ VComm Farm 1L',
    warehouseId: 'WH-SGN',
    warehouseCode: 'SGN-HUB-01',
    shelfLocation: 'COLD-01-B',
    manufacturingDate: '2026-09-01',
    expiryDate: '2026-12-01',
    initialQty: 500,
    availableQty: 320,
    reservedQty: 40,
    status: 'SAFE',
    daysRemaining: 75
  }
];

export interface OrderItemInput {
  sku: string;
  productName: string;
  quantity: number;
}

export interface OrderRoutingInput {
  orderId: string;
  customerName: string;
  phone: string;
  shippingAddress: string;
  shippingProvince: string;
  shippingDistrict?: string;
  shippingLat?: number;
  shippingLng?: number;
  items: OrderItemInput[];
}

export interface RoutingDecision {
  orderId: string;
  selectedWarehouse: WarehouseNode;
  distanceKm: number;
  deliveryEstimate: string;
  confidenceScore: number;
  routingRule: 'CLOSEST_PROXIMITY' | 'REGIONAL_AFFINITY' | 'STOCK_BALANCING';
  fefoAllocations: Array<{
    sku: string;
    productName: string;
    requestedQty: number;
    allocatedBatches: Array<{
      batchNumber: string;
      shelfLocation: string;
      allocatedQty: number;
      expiryDate: string;
      daysRemaining: number;
      isUrgentFefo: boolean;
    }>;
  }>;
  carrierRecommendation: {
    carrierId: 'ghn' | 'ghtk' | 'viettel_post';
    carrierName: string;
    estimatedCost: number;
    slaHours: number;
  };
  reason: string;
}

/**
 * Tính khoảng cách Haversine giữa 2 tọa độ (km)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Suy diễn tọa độ đại diện dựa theo Tỉnh/Thành phố Việt Nam
 */
export function getCoordinatesByProvince(provinceName: string): { lat: number; lng: number; region: 'NORTH' | 'CENTRAL' | 'SOUTH' } {
  const p = provinceName.toLowerCase();

  // Miền Bắc
  if (p.includes('hà nội') || p.includes('ha noi')) return { lat: 21.0285, lng: 105.8542, region: 'NORTH' };
  if (p.includes('hải phòng') || p.includes('quảng ninh') || p.includes('bắc ninh') || p.includes('hải dương') || p.includes('thái nguyên') || p.includes('nam định')) {
    return { lat: 20.8449, lng: 106.6881, region: 'NORTH' };
  }

  // Miền Trung
  if (p.includes('đà nẵng') || p.includes('da nang')) return { lat: 16.0544, lng: 108.2022, region: 'CENTRAL' };
  if (p.includes('huế') || p.includes('quảng nam') || p.includes('quảng ngãi') || p.includes('bình định') || p.includes('khánh hòa') || p.includes('nha trang')) {
    return { lat: 15.5684, lng: 108.4756, region: 'CENTRAL' };
  }

  // Miền Nam (Default)
  if (p.includes('hồ chí minh') || p.includes('sài gòn') || p.includes('tp.hcm')) return { lat: 10.7769, lng: 106.7009, region: 'SOUTH' };
  if (p.includes('bình dương') || p.includes('đồng nai') || p.includes('cần thơ') || p.includes('bà rịa') || p.includes('vũng tàu') || p.includes('long an') || p.includes('tiền giang')) {
    return { lat: 10.9805, lng: 106.6518, region: 'SOUTH' };
  }

  return { lat: 10.7769, lng: 106.7009, region: 'SOUTH' };
}

/**
 * Thuật toán FEFO: Bốc hàng theo thứ tự Hạn sử dụng gần nhất trước
 */
export function allocateFefoInventory(sku: string, requestedQty: number, warehouseId: string): {
  allocatedBatches: Array<{
    batchNumber: string;
    shelfLocation: string;
    allocatedQty: number;
    expiryDate: string;
    daysRemaining: number;
    isUrgentFefo: boolean;
  }>;
  fulfilledQty: number;
  isFullyFulfilled: boolean;
} {
  const eligibleBatches = MOCK_INVENTORY_BATCHES
    .filter(b => b.sku === sku && b.warehouseId === warehouseId && b.availableQty > 0)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()); // FEFO: Tăng dần theo HSD

  let needed = requestedQty;
  const allocations: any[] = [];
  let fulfilled = 0;

  for (const batch of eligibleBatches) {
    if (needed <= 0) break;
    const take = Math.min(needed, batch.availableQty);
    allocations.push({
      batchNumber: batch.batchNumber,
      shelfLocation: batch.shelfLocation,
      allocatedQty: take,
      expiryDate: batch.expiryDate,
      daysRemaining: batch.daysRemaining,
      isUrgentFefo: batch.daysRemaining <= 45
    });
    needed -= take;
    fulfilled += take;
  }

  return {
    allocatedBatches: allocations,
    fulfilledQty: fulfilled,
    isFullyFulfilled: fulfilled >= requestedQty
  };
}

/**
 * Thuật toán Smart Order Routing (SOR) tối ưu đa kho
 */
export function executeSmartOrderRouting(order: OrderRoutingInput): RoutingDecision {
  const dest = (order.shippingLat && order.shippingLng)
    ? { lat: order.shippingLat, lng: order.shippingLng, region: getCoordinatesByProvince(order.shippingProvince).region }
    : getCoordinatesByProvince(order.shippingProvince);

  // 1. Tính toán khoảng cách và điểm số từng kho
  const evaluatedHubs = FULFILLMENT_HUBS.map(hub => {
    const distanceKm = calculateDistanceKm(dest.lat, dest.lng, hub.lat, hub.lng);
    const isSameRegion = hub.region === dest.region;

    // Kiểm tra khả năng cung ứng tồn kho
    let totalStockScore = 0;
    for (const item of order.items) {
      const fefoRes = allocateFefoInventory(item.sku, item.quantity, hub.id);
      if (fefoRes.isFullyFulfilled) {
        totalStockScore += 100;
      } else {
        totalStockScore += Math.round((fefoRes.fulfilledQty / item.quantity) * 60);
      }
    }
    const avgStockScore = totalStockScore / Math.max(1, order.items.length);

    // Điểm tổng hợp: 50% tồn kho + 35% khoảng cách + 15% năng lực vận hành
    const distanceScore = Math.max(0, 100 - (distanceKm / 20));
    const totalScore = (avgStockScore * 0.5) + (distanceScore * 0.35) + (hub.capacityScore * 0.15);

    return {
      hub,
      distanceKm,
      isSameRegion,
      avgStockScore,
      totalScore
    };
  });

  // Chọn kho có điểm số tối ưu nhất
  evaluatedHubs.sort((a, b) => b.totalScore - a.totalScore);
  const bestChoice = evaluatedHubs[0];

  // 2. Thực hiện bốc hàng FEFO cho kho được chọn
  const fefoAllocations = order.items.map(item => {
    const alloc = allocateFefoInventory(item.sku, item.quantity, bestChoice.hub.id);
    return {
      sku: item.sku,
      productName: item.productName,
      requestedQty: item.quantity,
      allocatedBatches: alloc.allocatedBatches
    };
  });

  // 3. Dự tính thời gian giao hàng & Đề xuất Hãng vận chuyển tối ưu
  let deliveryEstimate = 'Giao tiêu chuẩn 24h - 48h';
  let slaHours = 36;
  let estCost = 35000;
  let carrierId: 'ghn' | 'ghtk' | 'viettel_post' = 'ghn';
  let carrierName = 'Giao Hàng Nhanh (GHN)';

  if (bestChoice.distanceKm < 30) {
    deliveryEstimate = 'Hỏa tốc nội thành 2h - 4h';
    slaHours = 4;
    estCost = 28000;
    carrierId = 'ghn';
    carrierName = 'GHN Express Sameday';
  } else if (bestChoice.isSameRegion) {
    deliveryEstimate = 'Giao nhanh cùng miền trong 24h';
    slaHours = 24;
    estCost = 32000;
    carrierId = 'ghtk';
    carrierName = 'GHTK Chuẩn Liên tỉnh';
  } else {
    deliveryEstimate = 'Giao liên miền đường trục hàng không 36h';
    slaHours = 36;
    estCost = 45000;
    carrierId = 'viettel_post';
    carrierName = 'Viettel Post Bay Nhanh';
  }

  return {
    orderId: order.orderId,
    selectedWarehouse: bestChoice.hub,
    distanceKm: bestChoice.distanceKm,
    deliveryEstimate,
    confidenceScore: Math.min(99, Math.round(bestChoice.totalScore)),
    routingRule: bestChoice.distanceKm < 50 ? 'CLOSEST_PROXIMITY' : (bestChoice.isSameRegion ? 'REGIONAL_AFFINITY' : 'STOCK_BALANCING'),
    fefoAllocations,
    carrierRecommendation: {
      carrierId,
      carrierName,
      estimatedCost: estCost,
      slaHours
    },
    reason: `Định tuyến tự động tới ${bestChoice.hub.name} (${bestChoice.hub.code}) do khoảng cách tối ưu (${bestChoice.distanceKm} km), khả năng đáp ứng tồn kho ${Math.round(bestChoice.avgStockScore)}% và ưu tiên xuất lô cận date theo FEFO.`
  };
}
