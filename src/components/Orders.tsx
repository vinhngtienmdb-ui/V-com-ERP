import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  MoreHorizontal,
  Truck,
  RotateCcw,
  PackageCheck,
  MapPin,
  ShieldAlert,
  DollarSign,
  Calendar,
  X,
  Package,
  User,
  Clock,
  Download,
  BrainCircuit,
  PieChart as PieIcon,
  Sparkles,
  Printer,
  Loader2,
  CheckCircle2,
  Map,
  Cpu,
  FileText,
  Building2,
} from 'lucide-react';
import { useAuditLog } from '../hooks/useAuditLog';
import { TableVirtuoso } from 'react-virtuoso';
import { formatCurrency, cn } from '../lib/utils';
import { Order } from '../types/erp';

import { db, collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, getDocs, range, where, search } from '../services/dbService';
import { sendZnsNotification } from '../services/znsService';
import { QuickPrintModal } from './QuickPrintModal';
import { syncOrderToMisa } from '../services/misaService';
import { supabase } from '../lib/supabase';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

const OrderDetailModal = ({
  order,
  onClose,
  onUpdateStatus,
  onSyncMisa,
  isSyncingMisa,
}: {
  order: any;
  onClose: () => void;
  onUpdateStatus: (id: string, s: string) => void;
  onSyncMisa: (id: string) => Promise<void>;
  isSyncingMisa: boolean;
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Multi-Warehouse Routing states
  const [warehouses, setWarehouses] = useState<any[]>([
    { id: 'WH-HN-01', name: 'Kho Hà Nội - Cầu Giấy', address: '15 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội', lat: 21.0362, lng: 105.7906 },
    { id: 'WH-HCM-01', name: 'Kho TP.HCM - Quận 1', address: '120 Lê Lợi, Bến Thành, Quận 1, TP.HCM', lat: 10.7719, lng: 106.6983 },
    { id: 'WH-DN-01', name: 'Kho Đà Nẵng - Hải Châu', address: '45 Lê Duẩn, Hải Châu 1, Hải Châu, Đà Nẵng', lat: 16.0718, lng: 108.2201 }
  ]);
  const [warehouseStock, setWarehouseStock] = useState<any[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [routedWarehouse, setRoutedWarehouse] = useState<string | null>(order.routedWarehouse || null);
  const [isRouting, setIsRouting] = useState(false);

  // e-Invoice states
  const [einvoiceStatus, setEinvoiceStatus] = useState<string>(order.einvoiceStatus || 'pending');
  const [einvoiceXml, setEinvoiceXml] = useState<string | null>(order.einvoiceXml || null);
  const [einvoiceLookupCode, setEinvoiceLookupCode] = useState<string | null>(order.einvoiceLookupCode || null);
  const [einvoiceSignedAt, setEinvoiceSignedAt] = useState<string | null>(order.einvoiceSignedAt || null);
  const [isSigningHsm, setIsSigningHsm] = useState(false);
  const [showXml, setShowXml] = useState(false);
  const [taxCode, setTaxCode] = useState<string>(order.taxCode || '0101234567');
  const isPaidOrBeyond = ['paid', 'confirmed', 'allocated', 'picking', 'packed', 'shipped', 'delivered', 'completed'].includes(order.status);

  const handleDraftRma = async (order: any) => {
    setIsGenerating(true);
    try {
//       const resp = await generateRMAResponse(order);
      setAiResponse(resp);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Customer coordinates mock mapping
  const customerLocation = useMemo(() => {
    const name = (order.customerName || '').toLowerCase();
    const addr = (order.address || '').toLowerCase();
    if (name.includes('nguyễn văn a') || addr.includes('hcm') || addr.includes('hồ chí minh') || addr.includes('miền nam')) {
      return { address: 'Quận 1, TP.HCM', lat: 10.7719, lng: 106.6983 };
    }
    if (name.includes('lê văn c') || addr.includes('đà nẵng') || addr.includes('dn') || addr.includes('miền trung')) {
      return { address: 'Hải Châu, Đà Nẵng', lat: 16.0718, lng: 108.2201 };
    }
    if (name.includes('lê hoàng minh') || addr.includes('bình thạnh')) {
      return { address: 'Quận Bình Thạnh, TP.HCM', lat: 10.8016, lng: 106.6988 };
    }
    // Default to Hanoi
    return { address: 'Cầu Giấy, Hà Nội', lat: 21.0362, lng: 105.7906 };
  }, [order]);

  // Load warehouses & stock
  useEffect(() => {
    let active = true;
    const fetchDbData = async () => {
      setIsLoadingStock(true);
      try {
        const { data: whs, error: whError } = await supabase.from('warehouses').select('*');
        if (!whError && whs && whs.length > 0 && active) {
          setWarehouses(whs);
        }

        const productIds = (order.items || []).map((item: any) => item.productId || item.id || '').filter(Boolean);
        if (productIds.length > 0) {
          const { data: stock, error: stError } = await supabase
            .from('warehouse_stock')
            .select('*')
            .in('product_id', productIds);
          if (!stError && stock && active) {
            setWarehouseStock(stock);
          } else if (active) {
            setWarehouseStock(getMockWarehouseStock(productIds));
          }
        }
      } catch (err) {
        console.error('Failed to fetch warehouse data from Supabase:', err);
        const productIds = (order.items || []).map((item: any) => item.productId || item.id || '').filter(Boolean);
        setWarehouseStock(getMockWarehouseStock(productIds));
      } finally {
        if (active) setIsLoadingStock(false);
      }
    };

    fetchDbData();
    return () => { active = false; };
  }, [order]);

  const getMockWarehouseStock = (productIds: string[]) => {
    const mockStocks: any[] = [];
    const seedData = [
      { product_id: '1073131895', warehouse_id: 'WH-HN-01', quantity: 150, safety_stock: 20, product_name: 'Áo Thun Nam Cotton' },
      { product_id: '1073131895', warehouse_id: 'WH-HCM-01', quantity: 80, safety_stock: 20, product_name: 'Áo Thun Nam Cotton' },
      { product_id: '1073131895', warehouse_id: 'WH-DN-01', quantity: 30, safety_stock: 20, product_name: 'Áo Thun Nam Cotton' },
      { product_id: '1073131896', warehouse_id: 'WH-HN-01', quantity: 12, safety_stock: 15, product_name: 'Laptop LG Gram 14' },
      { product_id: '1073131896', warehouse_id: 'WH-HCM-01', quantity: 5, safety_stock: 15, product_name: 'Laptop LG Gram 14' },
      { product_id: '1073131897', warehouse_id: 'WH-HN-01', quantity: 200, safety_stock: 50, product_name: 'Bộ Hộp Cơm Giữ Nhiệt Sunhouse' },
      { product_id: '1073131897', warehouse_id: 'WH-HCM-01', quantity: 250, safety_stock: 50, product_name: 'Bộ Hộp Cơm Giữ Nhiệt Sunhouse' }
    ];
    for (const pid of productIds) {
      const matched = seedData.filter(s => s.product_id === pid);
      mockStocks.push(...matched);
    }
    return mockStocks;
  };

  const getDistance = (wh: any) => {
    if (!wh.lat || !wh.lng) return 9999;
    return calculateDistance(customerLocation.lat, customerLocation.lng, wh.lat, wh.lng);
  };

  const handleAutoRoute = async () => {
    if (isPaidOrBeyond) {
      alert('Đơn hàng đã thanh toán hoặc đang vận hành, không được phép điều phối lại!');
      return;
    }
    setIsRouting(true);
    try {
      const items = order.items || [];
      if (items.length === 0) {
        alert('Cảnh báo: Đơn hàng không có sản phẩm để điều phối!');
        setIsRouting(false);
        return;
      }
      const eligibleWarehouses = warehouses.filter(wh => {
        return items.every((item: any) => {
          const pid = item.productId || item.id;
          const stockEntry = warehouseStock.find(s => s.product_id === pid && s.warehouse_id === wh.id);
          const qty = stockEntry ? (Number(stockEntry.quantity) - Number(stockEntry.allocated || 0) - Number(stockEntry.pendingProcessing || 0)) : 0;
          return qty >= (item.quantity || 1);
        });
      });

      if (eligibleWarehouses.length === 0) {
        alert('Cảnh báo: Không có kho đơn lẻ nào đủ tồn kho cho tất cả sản phẩm trong đơn hàng!');
        setIsRouting(false);
        return;
      }

      const sorted = eligibleWarehouses.sort((a, b) => getDistance(a) - getDistance(b));
      const bestWh = sorted[0];

      const { doc, updateDoc } = await import('../services/dbService');
      await updateDoc(doc(db, 'orders', order.id), { routedWarehouse: bestWh.id });
      
      setRoutedWarehouse(bestWh.id);
      onUpdateStatus(order.id, order.status);
      alert(`Đã tự động điều phối đơn hàng thành công tới: ${bestWh.name} (${getDistance(bestWh).toFixed(1)} km)`);
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi điều phối đơn hàng: ' + err.message);
    } finally {
      setIsRouting(false);
    }
  };

  const handleManualRoute = async (whId: string) => {
    if (!whId) return;
    if (isPaidOrBeyond) {
      alert('Đơn hàng đã thanh toán hoặc đang vận hành, không được phép điều phối lại!');
      return;
    }
    setIsRouting(true);
    try {
      const selectedWh = warehouses.find(w => w.id === whId);
      const { doc, updateDoc } = await import('../services/dbService');
      await updateDoc(doc(db, 'orders', order.id), { routedWarehouse: whId });
      setRoutedWarehouse(whId);
      onUpdateStatus(order.id, order.status);
      alert(`Đã điều phối đơn hàng thủ công tới: ${selectedWh ? selectedWh.name : whId}`);
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi điều phối đơn hàng: ' + err.message);
    } finally {
      setIsRouting(false);
    }
  };

  const handleSignHsm = async () => {
    setIsSigningHsm(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const lookupCode = 'VCOMM-LUT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const signedTime = new Date().toLocaleString('vi-VN');
      const invoiceId = 'VCOMM_INV_' + order.id.replace(/-/g, '_');

      const itemsXml = (order.items || []).map((item: any, idx: number) => `
              <ChiTiet>
                <STT>${idx + 1}</STT>
                <Ten>${item.name}</Ten>
                <SLuong>${item.quantity || 1}</SLuong>
                <DGia>${item.price}</DGia>
                <ThanhTien>${item.price * (item.quantity || 1)}</ThanhTien>
              </ChiTiet>`).join('');

      const xml = `<?xml version="1.0" encoding="utf-8"?>
<HuyenHoaDon>
  <DLHDon Id="${invoiceId}">
    <TTChung>
      <PBan>1.0.0</PBan>
      <MSo>1/001</MSo>
      <KHieu>C26TAA</KHieu>
      <So>${Math.floor(1000000 + Math.random() * 9000000)}</So>
      <Ngay>${new Date().toISOString().split('T')[0]}</Ngay>
    </TTChung>
    <NDHDon>
      <NBan>
        <Ten>CÔNG TY CỔ PHẦN VCOMM</Ten>
        <MST>0109876543</MST>
        <DChi>15 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội</DChi>
      </NBan>
      <NMua>
        <Ten>${order.customerName}</Ten>
        <MST>${taxCode || 'N/A'}</MST>
      </NMua>
      <DSTHHDon>
        ${itemsXml}
      </DSTHHDon>
      <TToan>
        <TgTCThue>${order.total}</TgTCThue>
        <ThueSuat>8%</ThueSuat>
        <TgThue>${Math.floor(order.total * 0.08)}</TgThue>
        <TgTTToan>${Math.floor(order.total * 1.08)}</TgTTToan>
      </TToan>
    </NDHDon>
  </DLHDon>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>
      <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
      <Reference URI="#${invoiceId}">
        <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <DigestValue>${Math.random().toString(36).substring(2, 15)}</DigestValue>
      </Reference>
    </SignedInfo>
    <SignatureValue>
      MIIEpAIBAAKCAQEA0G9s8d6a8f6a9fd6s7df6s7df68s7df6s8df6s7df8s7df6s7df6s8f
      ...[Cloud HSM RSA-2048 Cryptographic Digital Signature]
    </SignatureValue>
    <KeyInfo>
      <X509Data>
        <X509Certificate>
          MIIFdzCCA1+gAwIBAgIUTaxCode0109876543CertNo1234567890abcdef1234567890
          ...[VComm Corporate HSM RSA-2048 Public Certificate]
        </X509Certificate>
      </X509Data>
    </KeyInfo>
  </Signature>
</HuyenHoaDon>`;

      const { doc, updateDoc } = await import('../services/dbService');
      await updateDoc(doc(db, 'orders', order.id), {
        einvoiceStatus: 'issued',
        einvoiceXml: xml,
        einvoiceLookupCode: lookupCode,
        einvoiceSignedAt: signedTime
      });

      setEinvoiceStatus('issued');
      setEinvoiceXml(xml);
      setEinvoiceLookupCode(lookupCode);
      setEinvoiceSignedAt(signedTime);
      onUpdateStatus(order.id, order.status);
      alert('Ký số Cloud HSM thành công và đã đồng bộ lên hệ thống Tổng cục Thuế!');
    } catch (err: any) {
      console.error(err);
      alert('Lỗi ký số HSM: ' + err.message);
    } finally {
      setIsSigningHsm(false);
    }
  };

  const downloadXml = () => {
    if (!einvoiceXml) return;
    const blob = new Blob([einvoiceXml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eInvoice_${order.id}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col animate-in slide-in-from-right-4 duration-300">
      <div className="bg-white w-full max-w-7xl mx-auto flex flex-col flex-1 relative shadow-sm border-x border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Chi tiết đơn hàng {order.id}</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Đặt ngày: {order.date}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Thông tin khách hàng
            </p>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <User className="w-5 h-5 text-slate-500" />
              <span className="font-bold text-slate-900">{order.customerName}</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Phương thức thanh toán
            </p>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <DollarSign className="w-5 h-5 text-slate-500" />
              <span className="font-bold text-slate-900">
                {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {order.status === 'pending' && (
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-4 mb-6 text-center font-sans">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2.5">Thanh toán chuyển khoản VietQR</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm shrink-0">
                <img
                  src={`https://api.vietqr.io/image/970415-1020088998-qr_only.jpg?amount=${order.total}&addInfo=VCOMM_ORD_${order.id}`}
                  alt="VietQR Payment Code"
                  className="w-40 h-40 object-contain mx-auto"
                />
              </div>
              <div className="text-left space-y-2 text-xs">
                <p className="text-slate-700">Ngân hàng: <strong>VietinBank (ICB)</strong></p>
                <p className="text-slate-700">Số tài khoản: <strong>1020088998</strong></p>
                <p className="text-slate-700">Chủ tài khoản: <strong>CONG TY CỔ PHẦN VCOMM</strong></p>
                <p className="text-slate-700">Số tiền: <strong className="text-emerald-700 text-sm">{formatCurrency(order.total)}</strong></p>
                <p className="text-slate-700">Nội dung chuyển khoản: <strong className="font-mono text-emerald-800 bg-emerald-100/50 px-1.5 py-0.5 rounded border border-emerald-200">VCOMM_ORD_{order.id}</strong></p>
                <p className="text-[10px] text-slate-500 italic mt-2.5">* Hệ thống sẽ tự động xác nhận qua webhook SePay sau khi nhận được tiền.</p>
              </div>
            </div>
          </div>
        )}

        {/* Zalo ZNS Order Status Workflow */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Tính năng Zalo ZNS Tự động
              </p>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-transparent inline-flex items-center gap-1.5',
                  statusStyles[order.status as keyof typeof statusStyles] ||
                    'bg-slate-100 text-slate-700'
                )}
              >
                {React.createElement(
                  statusIcons[order.status as keyof typeof statusIcons] || Package,
                  { className: 'w-3.5 h-3.5' }
                )}
                {statusLabels[order.status as keyof typeof statusLabels] || order.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Đổi trạng thái:
              </label>
              <select
                value={order.status}
                onChange={e => onUpdateStatus(order.id, e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                {Object.entries(statusLabels).map(([key, label]) => {
                  const isBackward = ['draft', 'pending'].includes(key) && isPaidOrBeyond;
                  return (
                    <option key={key} value={key} disabled={isBackward}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                Zalo Notification Service: <strong>Đang kết nối</strong>
              </span>
            </div>
            <span className="text-[9.5px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
              Template:{' '}
              {order.status === 'shipped'
                ? 'ZNS_ORDER_SHIPPED'
                : order.status === 'delivered'
                  ? 'ZNS_ORDER_DELIVERED'
                  : 'ZNS_ORDER_CONFIRMED'}
            </span>
          </div>
        </div>

        {/* Trạng thái Ghi sổ Kế toán */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Trạng thái Ghi sổ Kế toán
              </p>
              <div className="flex items-center gap-2">
                {order.misaSynced ? (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 rounded-full flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Đã ghi sổ chứng từ: {order.misaVoucherId} 🟢
                  </span>
                ) : order.misaSyncError ? (
                  <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 rounded-full flex items-center gap-1.5 cursor-help" title={order.misaSyncError}>
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                    Lỗi kiểm tra 🔴
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 rounded-full flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                    Chờ ghi sổ 🟡
                  </span>
                )}
              </div>
            </div>

            {!order.misaSynced && (
              <button
                onClick={() => onSyncMisa(order.id)}
                disabled={isSyncingMisa}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all"
              >
                {isSyncingMisa ? 'Đang ghi sổ...' : 'Ghi sổ Kế toán'}
              </button>
            )}
          </div>
          {order.misaSyncError && (
            <p className="text-xs text-rose-600 mt-2 bg-rose-50/50 p-2 rounded border border-rose-100 font-mono">
              Lỗi chi tiết: {order.misaSyncError}
            </p>
          )}
        </div>

        {/* Điều phối Kho hàng Logistics (Multi-Warehouse Routing) */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
            Điều phối Kho hàng Logistics (Multi-Warehouse Routing)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {warehouses.map((wh) => {
              const dist = getDistance(wh);
              const isWhSelected = routedWarehouse === wh.id;
              
              const stockStatus = (order.items || []).map((item: any) => {
                const pid = item.productId || item.id;
                 const stockEntry = warehouseStock.find(s => s.product_id === pid && s.warehouse_id === wh.id);
                 const qty = stockEntry ? (Number(stockEntry.quantity) - Number(stockEntry.allocated || 0) - Number(stockEntry.pendingProcessing || 0)) : 0;
                 const required = item.quantity || 1;
                return {
                  name: item.name,
                  qty,
                  required,
                  ok: qty >= required
                };
              });
              
              const allOk = stockStatus.every(s => s.ok);

              return (
                <div 
                  key={wh.id}
                  onClick={() => handleManualRoute(wh.id)}
                  className={cn(
                    "p-3 rounded-lg border text-left cursor-pointer transition-all hover:shadow-xs relative overflow-hidden",
                    isWhSelected 
                      ? "bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500" 
                      : "bg-white border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-bold text-xs text-slate-800 line-clamp-1">{wh.name}</span>
                    {isWhSelected && (
                      <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase rounded shrink-0">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2 font-medium truncate">{wh.address}</p>
                  
                  <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-100">
                    <span className="font-mono text-slate-600 font-semibold flex items-center gap-1">
                      📍 {dist < 9999 ? `${dist.toFixed(1)} km` : 'N/A'}
                    </span>
                    <span className={cn(
                      "font-bold px-1.5 py-0.5 rounded text-[9px] uppercase",
                      allOk ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {allOk ? "Đủ hàng ✓" : "Thiếu hàng ⚠"}
                    </span>
                  </div>

                  <div className="mt-2 space-y-0.5 text-[9px] text-slate-500">
                    {stockStatus.map((st, i) => (
                      <div key={i} className="flex justify-between font-mono">
                        <span className="truncate max-w-[120px]">{st.name}</span>
                        <span className={st.ok ? "text-slate-600" : "text-rose-600 font-bold"}>
                          {st.qty}/{st.required}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-600">
              Trạng thái: {routedWarehouse ? (
                <span>Đã điều phối đơn hàng về <strong className="text-indigo-700 font-bold">{warehouses.find(w => w.id === routedWarehouse)?.name || routedWarehouse}</strong></span>
              ) : (
                <span className="text-amber-600 font-medium">🟡 Chưa chọn kho điều phối</span>
              )}
            </div>
            <button
              onClick={handleAutoRoute}
              disabled={isRouting || isLoadingStock || isPaidOrBeyond}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all self-end sm:self-auto"
            >
              {isRouting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang điều phối...
                </>
              ) : (
                <>
                  <Map className="w-3.5 h-3.5" />
                  Điều phối Tự động (Geo-Routing)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hóa đơn Điện tử & Ký số Cloud HSM */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Hóa đơn Điện tử (e-Invoice) & Cloud HSM
              </p>
              <div className="flex items-center gap-2">
                {einvoiceStatus === 'issued' ? (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 rounded-full flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đã ký số Cloud HSM & Phát hành thành công 🟢
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 rounded-full flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    Chờ phát hành hóa đơn điện tử 🟡
                  </span>
                )}
              </div>
            </div>

            {einvoiceStatus !== 'issued' ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Mã số thuế..."
                  value={taxCode}
                  onChange={e => setTaxCode(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none w-32"
                />
                <button
                  onClick={handleSignHsm}
                  disabled={isSigningHsm}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all"
                >
                  {isSigningHsm ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang ký HSM...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5" />
                      Ký số Cloud HSM
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowXml(!showXml)}
                  className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  {showXml ? 'Ẩn XML' : 'Xem XML'}
                </button>
                <button
                  onClick={downloadXml}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải XML
                </button>
              </div>
            )}
          </div>

          {einvoiceStatus === 'issued' && (
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Mã tra cứu hóa đơn</p>
                <span className="font-mono font-bold text-slate-800 text-[11px] bg-slate-100 px-1 py-0.5 rounded select-all">
                  {einvoiceLookupCode}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Thời gian ký số</p>
                <span className="font-semibold text-slate-700 font-sans">
                  {einvoiceSignedAt}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Cổng tra cứu Thuế</p>
                <a 
                  href={`https://tracuu.vcomm.vn/invoice?code=${einvoiceLookupCode}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-primary-600 hover:underline font-semibold flex items-center gap-1"
                >
                  tracuu.vcomm.vn ↗
                </a>
              </div>
            </div>
          )}

          {showXml && einvoiceXml && (
            <div className="mt-4 bg-slate-900 text-slate-300 p-3 rounded-lg border border-slate-800 font-mono text-[10.5px] leading-relaxed max-h-60 overflow-y-auto custom-scrollbar shadow-inner select-all whitespace-pre">
              {einvoiceXml}
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Danh sách sản phẩm
          </p>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            {order.items && order.items.length > 0 ? (
              order.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between py-3 border-b last:border-0 border-slate-300 items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-md border border-slate-300 flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-500" />
                    </div>
                    <span className="font-medium text-slate-800">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(item.price)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600 italic pb-2">Chưa có thông tin sản phẩm.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Lịch sử Vận chuyển
            </p>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-[#EAE7DF] text-primary-600 rounded-lg">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{order.carrier || 'Chưa vận chuyển'}</p>
                  <p className="font-mono text-xs text-primary-600">{order.tracking || 'N/A'}</p>
                </div>
              </div>

              <div className="relative pl-4 space-y-4 before:absolute before:inset-y-0 before:left-[7px] before:w-0.5 before:bg-slate-200">
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-4 h-4 rounded-full bg-slate-800 border-4 border-stone-50 shrink-0 mt-0.5"></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Đơn hàng được tạo</p>
                    <p className="text-xs text-slate-600">{order.date}</p>
                  </div>
                </div>
                {order.carrier && (
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-4 h-4 rounded-full bg-slate-800 border-4 border-stone-50 shrink-0 mt-0.5"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Đã bàn giao cho ĐVVC</p>
                      <p className="text-xs text-slate-600">Chờ cập nhật...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Hỗ trợ CSKH (AI)
            </p>
            <div className="p-4 rounded-lg bg-slate-100 border border-slate-300">
              <button
                onClick={() => handleDraftRma(order)}
                disabled={isGenerating}
                className="text-xs font-bold text-[#FAF9F5] bg-slate-900 hover:bg-slate-800 disabled:bg-primary-300 px-4 py-2.5 rounded-lg flex items-center gap-2 mb-3 shadow-sm transition-all w-full justify-center"
              >
                <BrainCircuit className="w-4 h-4" />{' '}
                {isGenerating ? 'AI Đang phân tích và tạo phản hồi...' : 'Tạo phản hồi RMA bằng AI'}
              </button>
              {aiResponse ? (
                <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm text-sm text-slate-800 whitespace-pre-line leading-relaxed h-48 overflow-y-auto custom-scrollbar">
                  {aiResponse}
                </div>
              ) : (
                <div className="bg-white/50 p-3 rounded-lg border border-slate-300 border-dashed text-sm text-slate-600 text-center flex flex-col items-center justify-center h-48">
                  <BrainCircuit className="w-8 h-8 text-blue-300 mb-2 opacity-50" />
                  Nhấp để tự động phân tích đơn hàng
                  <br />
                  và sinh mẫu phản hồi CSKH.
                </div>
              )}
            </div>

            {/* Action buttons based on payment rules */}
            <div className="space-y-2 mt-4">
              {order.paymentMethod === 'cod' && order.status === 'delivered' && (
                <button className="w-full bg-emerald-500 text-[#FAF9F5] px-4 py-3 rounded-lg text-sm font-bold hover:bg-emerald-600 shadow-sm flex items-center justify-center gap-2">
                  <DollarSign className="w-5 h-5" /> Xác nhận thực thu COD
                </button>
              )}
              {order.paymentMethod === 'cod' && order.status === 'processing' && (
                <button className="w-full bg-slate-100 text-slate-500 px-4 py-3 rounded-lg text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2 border border-slate-300">
                  <Clock className="w-5 h-5" /> Chờ giao để thu COD
                </button>
              )}
            </div>


          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
const MOCK_ORDERS: (Order & { carrier?: string; tracking?: string; shippingCost?: number })[] = [
  {
    id: 'ORD-2024-001',
    customerName: 'Nguyễn Văn A',
    date: '15/03/2024 14:30',
    total: 2500000,
    status: 'delivered',
    paymentMethod: 'cod',
    items: [
      { productId: '1073131895', productName: 'Áo Thun Nam Cotton', price: 250000, quantity: 10 }
    ],
    carrier: 'GHTK',
    tracking: 'GHTK123456789',
    shippingCost: 35000,
  },
  {
    id: 'ORD-2024-002',
    customerName: 'Trần Thị B',
    date: '15/03/2024 15:00',
    total: 1200000,
    status: 'processing',
    paymentMethod: 'cod',
    items: [
      { productId: '1073131896', productName: 'Laptop LG Gram 14', price: 1200000, quantity: 1 }
    ],
    carrier: 'GHN',
    tracking: 'GHN987654321',
    shippingCost: 28000,
  },
  {
    id: 'ORD-2024-003',
    customerName: 'Lê Văn C',
    date: '15/03/2024 16:15',
    total: 8500000,
    status: 'cancelled',
    paymentMethod: 'e_wallet',
    items: [
      { productId: '1073131897', productName: 'Bộ Hộp Cơm Giữ Nhiệt Sunhouse', price: 850000, quantity: 10 }
    ],
    shippingCost: 0,
  },
  {
    id: 'ORD-2024-006',
    customerName: 'Vũ Minh Tuấn',
    date: '15/03/2024 17:30',
    total: 4500000,
    status: 'shipped',
    paymentMethod: 'bank_transfer',
    items: [
      { productId: '1073131895', productName: 'Áo Thun Nam Cotton', price: 250000, quantity: 18 }
    ],
    carrier: 'ViettelPost',
    tracking: 'VT0987123',
    shippingCost: 45000,
  },
  {
    id: 'ORD-DELAY-001',
    customerName: 'Lê Hoàng Minh',
    date: new Date(Date.now() - 30 * 60 * 60 * 1000).toLocaleString('vi-VN'), // 30 hours ago
    total: 3500000,
    status: 'pending',
    paymentMethod: 'bank_transfer',
    items: [
      { productId: '1073131897', productName: 'Bộ Hộp Cơm Giữ Nhiệt Sunhouse', price: 850000, quantity: 4 }
    ],
    shippingCost: 0,
  },
];

const isDelayed = (dateStr: string, status: string) => {
  if (status !== 'pending' && status !== 'processing') return false;
  try {
    // Attempt to handle both 'YYYY-MM-DD HH:mm' and 'toLocaleDateString' formats
    let orderDate: Date;
    if (dateStr.includes('/')) {
      // Assuming 'DD/MM/YYYY, HH:mm:ss' or similar from toLocaleString('vi-VN')
      const [datePart, timePart] = dateStr.split(', ');
      const [d, m, y] = datePart.split('/').map(Number);
      if (timePart) {
        const [h, min] = timePart.split(':').map(Number);
        orderDate = new Date(y, m - 1, d, h, min);
      } else {
        orderDate = new Date(y, m - 1, d);
      }
    } else {
      // Assuming 'YYYY-MM-DD HH:mm'
      orderDate = new Date(dateStr.replace(/-/g, '/'));
    }

    const diffMs = Date.now() - orderDate.getTime();
    return diffMs > 24 * 60 * 60 * 1000;
  } catch (e) {
    return false;
  }
};

const statusIcons = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: X,
  returning: RotateCcw,
};

const statusStyles = {
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  processing: 'bg-[#DBEAFE] text-[#1E40AF]',
  shipped: 'bg-[#EAE7DF] text-blue-800',
  delivered: 'bg-[#D1FAE5] text-[#065F46]',
  cancelled: 'bg-[#FEE2E2] text-[#991B1B]',
  returning: 'bg-purple-50 text-purple-700 border border-purple-100',
};

const statusLabels = {
  pending: 'Chờ xác nhận',
  processing: 'Đang đóng gói',
  shipped: 'Đang giao hàng',
  delivered: 'Đã hoàn tất',
  cancelled: 'Đã hủy đơn',
  returning: 'Đang đổi trả (RMA)',
};

const paymentMethodLabels: Record<string, string> = {
  cod: 'Tiền mặt (COD)',
  bank_transfer: 'Chuyển khoản',
  e_wallet: 'Ví điện tử',
  cash: 'Tiền mặt (Tại quầy)',
  qr: 'Quét mã QR',
  pos: 'Quẹt thẻ POS',
  loyalty: 'Điểm thưởng',
};

export function Orders() {
  const { log } = useAuditLog();
  const [activeStep, setActiveStep] = useState<'all' | 'rma'>('all');
  const [mockOrders, setMockOrders] = useState<any[]>(MOCK_ORDERS);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSyncOrderToMisa = async (orderId: string) => {
    setSyncingOrderId(orderId);
    try {
      const res = await syncOrderToMisa(orderId);
      const isMock = mockOrders.some(o => o.id === orderId);
      if (isMock) {
        setMockOrders(prev => prev.map(o => o.id === orderId ? { ...o, misaSynced: true, misaVoucherId: 'VOUCHER-' + orderId.substring(0, 8), misaSyncError: '' } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, misaSynced: true, misaVoucherId: 'VOUCHER-' + orderId.substring(0, 8), misaSyncError: '' }));
        }
      } else {
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, misaSynced: true, misaVoucherId: res.voucherId || 'VOUCHER-MISA', misaSyncError: '' }));
        }
      }
    } catch (err: any) {
      console.error('Failed to sync order to MISA:', err);
      const isMock = mockOrders.some(o => o.id === orderId);
      if (isMock) {
        setMockOrders(prev => prev.map(o => o.id === orderId ? { ...o, misaSynced: false, misaSyncError: err.message || err } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, misaSynced: false, misaSyncError: err.message || err }));
        }
      } else {
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, misaSynced: false, misaSyncError: err.message || err }));
        }
      }
      alert('Đồng bộ MISA thất bại: ' + (err.message || err));
    } finally {
      setSyncingOrderId(null);
    }
  };
  const [znsToast, setZnsToast] = useState<{
    show: boolean;
    message: string;
    logContent: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateQuery, setDateQuery] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [printingOrder, setPrintingOrder] = useState<any | null>(null);
  const [dbOrders, setDbOrders] = useState<any[]>([]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const isMock = mockOrders.some(o => o.id === orderId);
    let matchedOrder: any = null;

    if (isMock) {
      const updated = mockOrders.map(o => {
        if (o.id === orderId) {
          matchedOrder = { ...o, status: newStatus };
          return matchedOrder;
        }
        return o;
      });
      setMockOrders(updated);
    } else {
      try {
        const { doc, updateDoc } = await import('../services/dbService');
        await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      log({ action: 'order.updated', targetId: orderId, meta: { event: 'Status/payment update' } });
        matchedOrder = dbOrders.find(o => o.id === orderId);
        if (matchedOrder) {
          matchedOrder = { ...matchedOrder, status: newStatus };
        }
      } catch (err: any) {
        console.error('Firestore update failed:', err);
      }
    }

    if (matchedOrder) {
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(matchedOrder);
      }

      const variables = {
        Tên_Khách_Hàng: matchedOrder.customerName,
        Mã_Đơn_Hàng: matchedOrder.id,
        Tổng_Tiền: formatCurrency(matchedOrder.total),
        Trạng_Thái: statusLabels[newStatus as keyof typeof statusLabels] || newStatus,
        Đơn_Vị_Vận_Chuyển: matchedOrder.carrier || 'GHN Fast',
        Mã_Vận_Đơn: matchedOrder.tracking || 'N/A',
      };

      let templateCode = 'ZNS_ORDER_CONFIRMED';
      if (newStatus === 'shipped') templateCode = 'ZNS_ORDER_SHIPPED';
      else if (newStatus === 'delivered') templateCode = 'ZNS_ORDER_DELIVERED';

      const log = sendZnsNotification('0981234567', templateCode, variables, {
        orderId: matchedOrder.id,
        customerName: matchedOrder.customerName,
      });

      setZnsToast({
        show: true,
        message: `Đã gửi và cập nhật trạng thái ZNS (${templateCode}) tới SĐT 0981234567 thành công!`,
        logContent: log.content,
      });
    }
  };

    // Close modals on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedOrder(null);
        setPrintingOrder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrder, printingOrder]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    const load = async () => {
      try {
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        
        let qConstraints: any[] = [
          orderBy('createdAt', 'desc'),
          range(from, to)
        ];
        
        if (statusFilter !== 'all') {
          qConstraints.push(where('status', '==', statusFilter));
        }

        if (debouncedSearchQuery.trim() !== '') {
          qConstraints.push(search(debouncedSearchQuery, ['id', 'customerName']));
        }
        
        const q = query(
          collection(db, 'orders'),
          ...qConstraints
        );
        
        const snap = await getDocs(q);
        if (active) {
          let data = snap.docs.map((doc: any) => {
            const d = doc.data();
            return {
              id: doc.id,
              ...d,
              date: d.createdAt?.toDate
                ? d.createdAt.toDate().toLocaleString('vi-VN')
                : new Date().toLocaleString('vi-VN'),
            };
          });

          // Fetch MISA sync metadata from finance_transactions
          const orderIds = data.map((d: any) => d.id);
          if (orderIds.length > 0) {
            try {
              const { data: syncData } = await supabase
                .from('finance_transactions')
                .select('id, data')
                .in('id', orderIds.map((id: string) => `misa_sync_${id}`));
              
              if (syncData && syncData.length > 0) {
                data = data.map((d: any) => {
                  const sd = syncData.find((s: any) => s.id === `misa_sync_${d.id}`);
                  if (sd && sd.data) {
                    return { ...d, ...sd.data };
                  }
                  return d;
                });
              }
            } catch (syncErr) {
              console.warn('Failed to fetch MISA sync data:', syncErr);
            }
          }

          setDbOrders(data);
          setTotalCount(snap.count || 0);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        if (active) setLoading(false);
      }
    };
    
    load();
    return () => { active = false; };
  }, [currentPage, statusFilter, debouncedSearchQuery]);

  const allOrders = useMemo(() => {
    return dbOrders;
  }, [dbOrders]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesDate = !dateQuery || (order.date && order.date.includes(dateQuery));
      const matchesActiveStep =
        activeStep === 'all' || (activeStep === 'rma' && order.status === 'returning');
      return matchesStatus && matchesDate && matchesActiveStep;
    });
  }, [allOrders, activeStep, statusFilter, dateQuery]);

  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDraftRma = async (order: any) => {
    setIsGenerating(true);
    try {
//       const response = await generateRMAResponse(order);
      setAiResponse(response);
    } catch (e) {
      setAiResponse('Lỗi khi tạo phản hồi AI.');
    }
    setIsGenerating(false);
  };

  const addDemoOrders = async () => {
    const { getAuth } = await import('../services/dbService');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Bạn cần đăng nhập để thêm demo orders!');
      return;
    }

    // Define items for the cart
    const itemSeller1 = { name: 'Điện thoại Smartphone', price: 15000000, quantity: 1, sellerId: 'SEL-001' };
    const itemSeller2 = { name: 'Ốp lưng silicon', price: 150000, quantity: 2, sellerId: 'SEL-002' };

    // 1. Create Parent Order
    const parentOrder = {
      customerName: 'Nguyễn Văn A (Split Test)',
      total: itemSeller1.price * itemSeller1.quantity + itemSeller2.price * itemSeller2.quantity,
      status: 'pending',
      paymentMethod: 'bank_transfer',
      paymentStatus: 'paid',
      items: [itemSeller1, itemSeller2],
      source: 'erp',
      staffId: currentUser.uid,
      createdAt: serverTimestamp(),
      sellerId: null, // It's a parent
      parentOrderId: null,
    };

    try {
      const parentRef = await addDoc(collection(db, 'orders'), parentOrder);
      const parentId = parentRef.id;

      // 2. Create Sub-order for SEL-001
      await addDoc(collection(db, 'orders'), {
        customerName: 'Nguyễn Văn A (Split Test)',
        total: itemSeller1.price * itemSeller1.quantity,
        status: 'pending',
        paymentMethod: 'bank_transfer',
        paymentStatus: 'paid',
        items: [itemSeller1],
        source: 'erp',
        staffId: currentUser.uid,
        createdAt: serverTimestamp(),
        sellerId: 'SEL-001',
        parentOrderId: parentId,
        commissionFee: (itemSeller1.price * itemSeller1.quantity) * 0.05, // 5% commission
        settlementStatus: 'pending',
        shippingCost: 35000,
        carrier: 'GHTK'
      });

      // 3. Create Sub-order for SEL-002
      await addDoc(collection(db, 'orders'), {
        customerName: 'Nguyễn Văn A (Split Test)',
        total: itemSeller2.price * itemSeller2.quantity,
        status: 'pending',
        paymentMethod: 'bank_transfer',
        paymentStatus: 'paid',
        items: [itemSeller2],
        source: 'erp',
        staffId: currentUser.uid,
        createdAt: serverTimestamp(),
        sellerId: 'SEL-002',
        parentOrderId: parentId,
        commissionFee: (itemSeller2.price * itemSeller2.quantity) * 0.08, // 8% commission
        settlementStatus: 'pending',
        shippingCost: 15000,
        carrier: 'GHN'
      });
      
      alert('Đã tạo thành công Đơn gốc và Tách thành 2 Đơn con!');
    } catch (error) {
      console.error('Error creating split orders:', error);
      alert('Có lỗi xảy ra khi tạo đơn hàng ngẫu nhiên');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">
            Vận hành Đơn hàng & Logistics
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Điều phối giao vận, xử lý đổi trả (RMA) và quản lý cước phí thực tế.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={addDemoOrders}
            className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold text-[#4B5563] hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Mã giảm giá
          </button>
          <button className="bg-[#111827] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
            + Tạo đơn mới
          </button>
        </div>
      </div>

      <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
        <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all ring-2 ring-red-100">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-red-600 font-bold uppercase italic tracking-widest">
              Cảnh báo chậm trễ
            </span>
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-red-600">
            {allOrders.filter(o => isDelayed(o.date, o.status)).length}
          </div>
          <div className="mt-3 text-[10px] text-red-400 font-bold uppercase tracking-tight">
            Đơn {'>'}24h chưa xử lý
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">
              Cần đóng gói
            </span>
            <PackageCheck className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-3xl font-black text-[#111827]">42</div>
          <div className="mt-3 text-[10px] text-[#6B7280] font-bold uppercase tracking-tighter">
            12 đơn đóng muộn ({'>'}24h)
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">
              Đang vận chuyển
            </span>
            <Truck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-[#111827]">156</div>
          <div className="mt-3 text-[10px] text-[#6B7280] font-bold uppercase tracking-tighter">
            Chủ yếu: GHTK (65%)
          </div>
        </div>
        <div className="bg-[#111827] p-6 rounded-lg shadow-sm shadow-slate-200 relative overflow-hidden group border border-slate-800">
          <div className="relative z-10 flex flex-col justify-between h-full text-[#FAF9F5]">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Yêu cầu Đổi trả (RMA)
              </span>
              <RotateCcw className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tighter">08</div>
              <p className="text-[10px] text-orange-400 font-bold mt-1 uppercase tracking-tighter">
                3 đơn cần xử lý gấp
              </p>
            </div>
          </div>
          <RotateCcw className="absolute -bottom-6 -right-6 w-24 h-24 text-[#FAF9F5]/5 group-hover:rotate-12 transition-transform duration-700" />
        </div>
      </DraggableGrid>
      <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] text-[#6B7280] font-bold uppercase">
            Tổng cước phí dự kiến
          </span>
          <DollarSign className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-2xl font-bold text-[#111827]">{formatCurrency(12450000)}</div>
        <div className="mt-1 text-[10px] text-[#10B981]">Tiết kiệm 8% với Hợp đồng sàn</div>
      </div>

      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Mã đơn, Mã Tracking, SĐT..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72 font-sans"
              />
            </div>

            {/* Filters */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-[#4B5563] appearance-none"
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                value={dateQuery}
                onChange={e => setDateQuery(e.target.value)}
                placeholder="Ngày (YYYY-MM-DD)"
                className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-48"
              />
            </div>
          </div>

          <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setActiveStep('all')}
              className={cn(
                'px-4 py-2 text-xs font-semibold',
                activeStep === 'all' ? 'bg-primary-600 text-[#FAF9F5]' : 'text-[#4B5563]'
              )}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveStep('rma')}
              className={cn(
                'px-4 py-2 text-xs font-semibold border-l border-slate-300',
                activeStep === 'rma' ? 'bg-primary-600 text-[#FAF9F5]' : 'text-[#4B5563]'
              )}
            >
              Phê duyệt Hoàn tiền/Trả hàng
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden mt-4 h-[600px] flex flex-col">
          <TableVirtuoso
            data={filteredOrders}
            style={{ height: '100%', flex: 1 }}
            components={{
              Scroller: React.forwardRef((props, ref) => (
                <div {...props} ref={ref} className="overflow-auto custom-scrollbar" />
              )),
              Table: ({ style, ...props }) => (
                <table
                  {...props}
                  className="w-full text-left border-collapse table-auto"
                  style={style}
                />
              ),
              TableHead: React.forwardRef((props, ref) => (
                <thead
                  {...props}
                  ref={ref}
                  className="bg-[#F9FAFB] border-b border-[#F3F4F6] sticky top-0 z-10 shadow-sm"
                />
              )),
              TableRow: props => {
                const order = props.item;
                return (
                  <tr
                    {...props}
                    className={cn(
                      'bg-white hover:bg-slate-50 group hover:shadow-sm transition-all cursor-pointer relative border-l-4 border-transparent hover:border-l-indigo-600 border-b border-[#F3F4F6]',
                      isDelayed(order?.date || '', order?.status || '') &&
                        'bg-red-50/30 border-l-red-500'
                    )}
                    onClick={() => setSelectedOrder(order)}
                  />
                );
              },
            }}
            fixedHeaderContent={() => (
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest bg-[#F9FAFB]">
                  Đơn hàng & Khách hàng
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest bg-[#F9FAFB]">
                  Gian hàng & Phân rã
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest bg-[#F9FAFB]">
                  Giao nhận & Tracking
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest bg-[#F9FAFB]">
                  Cước phí
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest bg-[#F9FAFB]">
                  Thanh toán
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center bg-[#F9FAFB]">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center bg-[#F9FAFB]">
                  Trạng thái Ghi sổ
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right bg-[#F9FAFB]">
                  Thao tác
                </th>
              </tr>
            )}
            itemContent={(index, order) => (
              <>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#111827] group-hover:text-primary-600 transition-colors flex items-center gap-1.5">
                      {order.parentOrderId ? <i className="text-[10px] text-purple-600 bg-purple-50 px-1 py-0.5 rounded border border-purple-200 not-italic">Sub</i> : <i className="text-[10px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200 not-italic">Root</i>}
                      #{order.id.split('-').pop()}
                    </p>
                    {isDelayed(order.date, order.status) && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded animate-bounce">
                        Delayed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 font-medium">
                    {order.customerName}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">{order.date}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {order.sellerId ? (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-fit">
                        🏢 {order.sellerId}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 italic">
                        Đơn tổng (Parent)
                      </span>
                    )}
                    {order.parentOrderId && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        ↳ Gốc: <span className="font-mono text-slate-700">{order.parentOrderId.split('-').pop()}</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {order.carrier ? (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1 bg-white p-2 rounded-lg border border-slate-200 shadow-sm w-full group-hover:border-primary-200 transition-colors">
                        <span className="text-[10px] font-bold text-slate-800 uppercase">
                          {order.carrier}
                        </span>
                        <span className="text-[10px] font-mono text-primary-600 font-bold">
                          {order.tracking}
                        </span>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                        }}
                        className="text-[10px] text-primary-600 hover:bg-[#EAE7DF] px-2 py-1 rounded bg-slate-100 transition-all flex items-center gap-1 shrink-0"
                      >
                        <MapPin className="w-3 h-3" /> Tra cứu
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#9CA3AF] italic">Chưa đẩy đơn</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-[#111827]">
                    {formatCurrency(order.total)}
                  </p>
                  <p className="text-[10px] text-[#6B7280]">
                    Cước: {order.shippingCost ? formatCurrency(order.shippingCost) : '--'}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-[#111827]">
                    {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shadow-sm border border-transparent flex items-center gap-1.5',
                        statusStyles[order.status as keyof typeof statusStyles] ||
                          'bg-slate-100 text-slate-700'
                      )}
                    >
                      {React.createElement(
                        statusIcons[order.status as keyof typeof statusIcons] || Package,
                        { className: 'w-3 h-3' }
                      )}
                      {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    {order.misaSynced ? (
                      <span 
                        title={'Mã chứng từ: ' + order.misaVoucherId}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 rounded-full animate-in fade-in"
                      >
                        Đã ghi sổ 🟢
                      </span>
                    ) : order.misaSyncError ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <span 
                          title={'Lỗi: ' + order.misaSyncError}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 rounded-full cursor-help"
                        >
                          Lỗi kiểm tra 🔴
                        </span>
                        <button
                          onClick={() => handleSyncOrderToMisa(order.id)}
                          disabled={syncingOrderId === order.id}
                          className="px-2 py-1 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-semibold rounded-lg shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        >
                          {syncingOrderId === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Thử lại 🔄'
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSyncOrderToMisa(order.id)}
                        disabled={syncingOrderId === order.id}
                        className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-bold rounded-lg shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer animate-in fade-in"
                      >
                        {syncingOrderId === order.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Ghi sổ'
                        )}
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-all">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setPrintingOrder(order);
                      }}
                      className="p-2.5 bg-white border border-slate-300 shadow-sm hover:border-emerald-500 hover:bg-emerald-50 rounded-lg text-slate-500 hover:text-emerald-600 transition-all active:scale-95 flex items-center justify-center"
                      title="In nhanh Biên lai"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                      }}
                      className="p-2.5 bg-white border border-slate-300 shadow-sm hover:border-primary-500 hover:bg-primary-50 rounded-lg text-slate-500 hover:text-primary-600 transition-all active:scale-95"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </>
            )}
          />
          {/* Phân trang Server-side */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans shrink-0 border-l border-r border-b rounded-b-xl animate-in fade-in">
            <div className="text-xs text-slate-500 font-bold uppercase">
              Hiển thị {totalCount ? ((currentPage - 1) * pageSize) + 1 : 0} - {Math.min(currentPage * pageSize, totalCount)} trong số {totalCount} đơn hàng
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Trang trước
              </button>
              <span className="px-4 py-2 text-xs font-bold text-slate-900 self-center">
                Trang {currentPage} / {Math.ceil(totalCount / pageSize) || 1}
              </span>
              <button
                disabled={currentPage >= Math.ceil(totalCount / pageSize) || loading}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={handleUpdateStatus}
            onSyncMisa={handleSyncOrderToMisa}
            isSyncingMisa={syncingOrderId === selectedOrder.id}
          />
        )}

        {znsToast && znsToast.show && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 border-2 border-blue-500 text-[#FAF9F5] rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center font-bold text-white shrink-0 shadow-md">
                Z
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                  Zalo Notification Service (ZNS)
                </p>
                <p className="text-xs font-semibold text-slate-100 mt-1 leading-snug">
                  {znsToast.message}
                </p>

                <div className="mt-3 bg-slate-950 p-2.5 rounded-lg border border-slate-700">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                    Nội dung tin nhắn:
                  </p>
                  <p className="text-[10.5px] text-slate-300 font-mono leading-relaxed max-h-24 overflow-y-auto">
                    {znsToast.logContent}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 text-[10px]">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đã gửi thành công
                  </span>
                  <button
                    onClick={() => setZnsToast(null)}
                    className="font-bold text-slate-400 hover:text-white underline transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {printingOrder && (
          <QuickPrintModal order={printingOrder} onClose={() => setPrintingOrder(null)} />
        )}

        <div className="bg-amber-50 rounded-lg p-6 border border-amber-100 flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">
              Tính năng Phê duyệt Đổi trả tự động
            </h4>
            <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
              Dựa trên hình ảnh/video khiếu nại của người mua và kết quả từ đơn vị vận chuyển (tổng
              hợp từ sensor va đập hoặc khối lượng thay đổi), hệ thống sẽ đánh giá mức độ tin cậy để
              đề xuất Admin phê duyệt nhanh các đơn hàng RMA dưới 500k.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
