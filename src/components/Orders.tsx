import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EntityLink, StatusBadge } from './ui/design-system';
import { CompactPageHeader } from './common/CompactPageHeader';
import { CompactStatsRibbon, MetricRibbonItem } from './common/CompactStatsRibbon';
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
  Store,
  Globe,
  Boxes,
  Plus,
  CheckCheck,
  Layers,
} from 'lucide-react';
import { TableVirtuoso } from 'react-virtuoso';
import { formatCurrency, cn } from '../lib/utils';
import { Order } from '../types/erp';
import { generateRMAResponse } from '../services/geminiService';
import { db, collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, getDocs, range, where, search } from '../lib/firebase';
import { sendZnsNotification } from '../services/znsService';
import { QuickPrintModal } from './QuickPrintModal';
import { BatchWaybillModal } from './BatchWaybillModal';
import { PickListModal } from './orders/PickListModal';
import { syncOrderToMisa } from '../services/misaService';
import { supabase } from '../lib/supabase';

export const WAREHOUSES = [
  { id: 'WH-HN-01', name: 'Kho Hà Nội - Cầu Giấy', address: '15 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội', lat: 21.0362, lng: 105.7906 },
  { id: 'WH-HCM-01', name: 'Kho TP.HCM - Quận 1', address: '120 Lê Lợi, Bến Thành, Quận 1, TP.HCM', lat: 10.7719, lng: 106.6983 },
  { id: 'WH-DN-01', name: 'Kho Đà Nẵng - Hải Châu', address: '45 Lê Duẩn, Hải Châu 1, Hải Châu, Đà Nẵng', lat: 16.0718, lng: 108.2201 }
];

export const CHANNEL_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  vcomm_ecommerce: { label: 'VComm eCommerce', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Globe },
  vcomm_mall: { label: 'VComm eCommerce', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Globe },
};

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

export interface ShipmentPackage {
  packageId: string;
  trackingCode: string;
  carrier: string;
  sellerId: string;
  sellerName: string;
  warehouseId: string;
  warehouseName: string;
  items: any[];
  packageTotal: number;
  status: string;
  shippingCost: number;
}

export function getOrderPackages(order: any): ShipmentPackage[] {
  if (order.packages && Array.isArray(order.packages) && order.packages.length > 0) {
    return order.packages;
  }
  const items = order.items || [];
  if (items.length === 0) {
    return [{
      packageId: `${order.id}-PKG1`,
      trackingCode: order.tracking || `VC-${order.id}`,
      carrier: order.carrier || 'GHTK',
      sellerId: order.sellerId || 'SEL-01',
      sellerName: order.sellerName || 'VComm Official Store',
      warehouseId: order.routedWarehouse || 'WH-HN-01',
      warehouseName: order.warehouseName || 'Kho Hà Nội - Cầu Giấy',
      items: [],
      packageTotal: order.total || 0,
      status: order.status || 'new',
      shippingCost: order.shippingCost || 0
    }];
  }

  // Quy tắc: Cùng Seller và cùng Kho -> 1 kiện / 1 mã vận đơn. Khác Seller hoặc khác Kho -> Tự động tách kiện.
  const groups: Record<string, {
    sellerId: string;
    sellerName: string;
    warehouseId: string;
    warehouseName: string;
    items: any[];
    total: number;
  }> = {};

  items.forEach((item: any) => {
    const sellerId = item.sellerId || order.sellerId || 'SEL-01';
    const sellerName = item.sellerName || order.sellerName || 'VComm Official Store';
    const warehouseId = item.warehouseId || order.routedWarehouse || 'WH-HN-01';
    const warehouseName = item.warehouseName || order.warehouseName || (
      warehouseId === 'WH-HCM-01' ? 'Kho TP.HCM - Quận 1' :
      warehouseId === 'WH-DN-01' ? 'Kho Đà Nẵng - Hải Châu' : 'Kho Hà Nội - Cầu Giấy'
    );

    const groupKey = `${sellerId}__${warehouseId}`;
    if (!groups[groupKey]) {
      groups[groupKey] = {
        sellerId,
        sellerName,
        warehouseId,
        warehouseName,
        items: [],
        total: 0
      };
    }
    groups[groupKey].items.push(item);
    groups[groupKey].total += (item.price || 0) * (item.quantity || 1);
  });

  const groupKeys = Object.keys(groups);
  const carriers = ['GHTK', 'GHN', 'ViettelPost'];

  return groupKeys.map((key, idx) => {
    const g = groups[key];
    const carrier = groupKeys.length === 1 && order.carrier ? order.carrier : carriers[idx % carriers.length];
    const trackingCode = groupKeys.length === 1 && order.tracking 
      ? order.tracking 
      : `${carrier.toUpperCase()}-${order.id.split('-').pop()}-PKG${idx + 1}`;

    return {
      packageId: `${order.id}-PKG${idx + 1}`,
      trackingCode,
      carrier,
      sellerId: g.sellerId,
      sellerName: g.sellerName,
      warehouseId: g.warehouseId,
      warehouseName: g.warehouseName,
      items: g.items,
      packageTotal: g.total,
      status: order.status,
      shippingCost: Math.round((order.shippingCost || 30000) / groupKeys.length)
    };
  });
}

const OrderDetailModal = ({
  order,
  onClose,
}: {
  order: any;
  onClose: () => void;
  onUpdateStatus?: (id: string, s: string) => void;
}) => {
  const pkgs = useMemo(() => getOrderPackages(order), [order]);
  const isMultiPkg = pkgs.length > 1;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 font-sans">
        {/* Modal Header */}
        <div className="flex justify-between items-start mb-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Chi tiết đơn hàng #{order.id.split('-').pop()}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                <Globe className="w-3 h-3" />
                VComm eCommerce
              </span>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border flex items-center gap-1 shadow-2xs',
                  statusStyles[order.status as keyof typeof statusStyles] || 'bg-slate-100 text-slate-700'
                )}
              >
                {React.createElement(
                  statusIcons[order.status as keyof typeof statusIcons] || Package,
                  { className: 'w-3 h-3' }
                )}
                {statusLabels[order.status as keyof typeof statusLabels] || order.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Thời gian đặt: {order.date}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-semibold">Tự động đồng bộ Realtime</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Đóng chi tiết"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 11-Step Fulfillment Stepper (Read-Only) */}
        <div className="mb-5 p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Truck className="w-3 h-3 text-indigo-600" />
              Tiến trình xử lý đơn hàng tự động (11 Trạng thái)
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Tự động cập nhật qua Webhook sàn & ĐVVC
            </span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { key: 'new', label: 'Mới' },
              { key: 'pending_confirmation', label: 'Chờ xác nhận' },
              { key: 'confirmed', label: 'Đã xác nhận' },
              { key: 'pending_processing', label: 'Chờ xử lý' },
              { key: 'processed', label: 'Đã xử lý' },
              { key: 'pending_pickup', label: 'Chờ lấy' },
              { key: 'picked_up', label: 'Đã lấy' },
              { key: 'delivering', label: 'Chờ giao' },
              { key: 'delivered', label: 'Đã giao' },
            ].map((step, idx, arr) => {
              const orderIdx = arr.findIndex(s => s.key === order.status);
              const isDone = orderIdx >= idx;
              const isCurrent = order.status === step.key;

              return (
                <div key={step.key} className="flex items-center gap-1 shrink-0">
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-all",
                    isCurrent 
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-200" 
                      : isDone 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-white text-slate-400 border-slate-200"
                  )}>
                    {isDone && !isCurrent ? (
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    ) : (
                      <span className="w-2.5 text-center text-[9px]">{idx + 1}</span>
                    )}
                    <span>{step.label}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <span className={cn("text-[9px] font-bold px-0.5", isDone ? "text-emerald-500" : "text-slate-300")}>→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3 Overview Information Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
          {/* Card 1: Khách hàng */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              Khách hàng
            </span>
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-900 text-xs truncate" title={order.customerName}>
                  {order.customerName}
                </span>
                <EntityLink type="customer" id={order.customerName} label="360°" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{order.address || 'Việt Nam'}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Giá trị & Thanh toán */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-slate-400" />
              Giá trị & Thanh toán
            </span>
            <div>
              <div className="text-base font-black text-slate-900">
                {formatCurrency(order.total)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                <span>Cước 3PL:</span>
                <span className="font-semibold text-slate-700">{order.shippingCost ? formatCurrency(order.shippingCost) : '0 đ'}</span>
              </div>
              <div className="mt-1">
                <span className="px-1.5 py-0.5 bg-white text-slate-700 text-[10px] font-bold rounded border border-slate-200">
                  {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Tự động hạch toán & Ví Seller */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <CheckCheck className="w-3 h-3 text-emerald-600" />
              Kế toán & Ví Seller
            </span>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Chứng từ VComm:</span>
                <span className="font-mono font-bold text-slate-800 text-[10.5px]">
                  {order.misaVoucherId ? order.misaVoucherId.replace('MISA', 'VC') : `VC-V2026-${order.id.split('-').pop()}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Ví Seller (95%):</span>
                <span className={cn(
                  "font-bold text-[10.5px]",
                  order.sellerWalletSettled ? "text-emerald-700" : "text-amber-700"
                )}>
                  +{formatCurrency(order.sellerPayout || Math.round(order.total * 0.95))}
                  {order.sellerWalletSettled && " ✓"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Hóa đơn VAT:</span>
                <span className="font-mono font-bold text-indigo-700 text-[10.5px]">
                  {order.einvoiceLookupCode || `VC-INV-${order.id.split('-').pop()}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* VietQR nếu đơn pending / chuyển khoản */}
        {order.status === 'pending' && (
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 mb-5 text-center font-sans">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Thanh toán chuyển khoản VietQR</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm shrink-0">
                <img
                  src={`https://api.vietqr.io/image/970415-1020088998-qr_only.jpg?amount=${order.total}&addInfo=VCOMM_ORD_${order.id}`}
                  alt="VietQR Payment Code"
                  className="w-32 h-32 object-contain mx-auto"
                />
              </div>
              <div className="text-left space-y-1 text-xs">
                <p className="text-slate-700">Ngân hàng: <strong>VietinBank (ICB)</strong></p>
                <p className="text-slate-700">Số tài khoản: <strong>1020088998</strong></p>
                <p className="text-slate-700">Chủ tài khoản: <strong>CONG TY CỔ PHẦN VCOMM</strong></p>
                <p className="text-slate-700">Số tiền: <strong className="text-emerald-700">{formatCurrency(order.total)}</strong></p>
                <p className="text-slate-700">Nội dung: <strong className="font-mono text-emerald-800 bg-emerald-100/50 px-1 py-0.5 rounded border border-emerald-200">VCOMM_ORD_{order.id}</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* Fulfillment Packages & Tracking Details */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Phân Bổ Kiện Hàng & Mã Vận Đơn (Fulfillment Packages)
              </h3>
            </div>
            {isMultiPkg ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                <Boxes className="w-3 h-3 text-purple-600" />
                Tự Động Tách {pkgs.length} Kiện (Khác Seller / Kho)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Package className="w-3 h-3 text-emerald-600" />
                1 Kiện Duy Nhất (Cùng Seller & Kho)
              </span>
            )}
          </div>

          <div className="space-y-3">
            {pkgs.map((pkg, idx) => (
              <div key={pkg.packageId} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-black">
                      Kiện #{idx + 1}
                    </span>
                    <span className="font-black text-[10px] uppercase text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {pkg.carrier}
                    </span>
                    <span className="font-mono text-xs font-bold text-indigo-600">
                      {pkg.trackingCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-600 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {pkg.warehouseName}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-indigo-700 font-bold flex items-center gap-1">
                      <Store className="w-3 h-3 text-indigo-500" />
                      {pkg.sellerName}
                    </span>
                  </div>
                </div>

                {/* Danh sách SP trong kiện */}
                <div className="pt-2 space-y-1.5">
                  {pkg.items.map((it: any, itIdx: number) => (
                    <div key={itIdx} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        <span className="font-semibold text-slate-800">{it.productName || it.name}</span>
                        {it.shelfLocation && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            {it.shelfLocation}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-medium">SL: {it.quantity || 1}</span>
                        <span className="font-bold text-slate-900">{formatCurrency((it.price || 0) * (it.quantity || 1))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lịch sử vận hành hệ thống (Audit Trail) */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            Nhật ký tự động hóa hệ thống
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-slate-600">
                Ghi nhận đơn hàng: <strong>{order.date}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
              <span className="text-slate-600">
                Phân bổ kiện & kho xuất: <strong>Tự động 100%</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
              <span className="text-slate-600">
                Hạch toán kế toán VComm: <strong>Đã ghi sổ ngầm</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
              <span className="text-slate-600">
                Hóa đơn VAT Cloud HSM: <strong>Đã ký số tự động</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export function getAutoDeliveryInfo(order: any) {
  if (order.status === 'delivered') {
    if (order.sellerWalletSettled) {
      return {
        settled: true,
        label: `Ví Seller: +${formatCurrency(order.sellerPayout || Math.round(order.total * 0.95))}`,
        subtext: order.customerConfirmed ? 'Khách đã xác nhận nhận hàng' : 'Tự động tất toán sau 3 ngày giao',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    } else {
      return {
        settled: false,
        label: 'Ví Seller: Đang đối soát',
        subtext: 'Chờ tất toán ví',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    }
  }

  if (order.status === 'delivering') {
    const now = Date.now();
    const dispatchedTime = order.dispatchedAt ? new Date(order.dispatchedAt).getTime() : (now - 36 * 3600000);
    const elapsedHours = (now - dispatchedTime) / 3600000;
    const remainingHours = Math.max(0, Math.round(72 - elapsedHours));

    if (order.customerConfirmed || elapsedHours >= 72) {
      return {
        settled: true,
        label: 'Đủ 3 ngày: Tự động Giao & Ví',
        subtext: 'Tự động tất toán tiền hàng',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
      };
    }

    return {
      settled: false,
      label: `Tự động giao & ví: Còn ${remainingHours}h`,
      subtext: 'SLA 3 ngày nếu khách chưa bấm nhận',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
    };
  }

  return null;
}

export function getReturnWindowInfo(order: any) {
  if (order.status === 'returned') {
    return {
      type: 'returned',
      label: 'Đã trả hàng (Sàn phê duyệt)',
      subtext: 'Sàn eCommerce chấp thuận hoàn tất',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }

  if (order.status === 'delivered') {
    const now = Date.now();
    const deliveredTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : (now - 2 * 86400000);
    const elapsedDays = (now - deliveredTime) / 86400000;
    const remainingDays = Math.max(0, Math.round(7 - elapsedDays));

    if (elapsedDays > 7) {
      return {
        type: 'expired',
        label: 'Khóa đổi trả (> 7 ngày)',
        subtext: 'Đã quá hạn 7 ngày quy định',
        badgeClass: 'bg-slate-100 text-slate-500 border-slate-200'
      };
    }

    return {
      type: 'eligible',
      label: `Hạn đổi trả: Còn ${remainingDays} ngày`,
      subtext: 'Cần được sàn phê duyệt',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
    };
  }

  return null;
}

const MOCK_ORDERS: (Order & { 
  carrier?: string; 
  tracking?: string; 
  shippingCost?: number;
  channel?: string;
  address?: string;
  routedWarehouse?: string;
  warehouseName?: string;
  sellerId?: string;
  sellerName?: string;
  packages?: ShipmentPackage[];
  codAccrued?: boolean;
  codAccruedAt?: string;
  einvoiceStatus?: string;
  einvoiceLookupCode?: string;
  einvoiceSignedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  customerConfirmed?: boolean;
  sellerWalletSettled?: boolean;
  sellerWalletSettledAt?: string;
  sellerPayout?: number;
  misaSynced?: boolean;
  misaVoucherId?: string;
  misaSyncError?: string;
})[] = [
  {
    id: 'ECOM-2026-001',
    customerName: 'Nguyễn Văn An',
    date: '18/09/2026 09:15',
    total: 1290000,
    status: 'new',
    paymentMethod: 'bank_transfer',
    channel: 'vcomm_ecommerce',
    address: 'Ba Đình, Hà Nội',
    routedWarehouse: 'WH-HN-01',
    warehouseName: 'Kho Hà Nội - Cầu Giấy',
    sellerId: 'SEL-01',
    sellerName: 'VComm Official Store',
    items: [
      { productId: '1073131895', productName: 'Áo Polo Nam VComm SmartFabric', sku: 'SKU-POLO-01', price: 445000, quantity: 2, shelfLocation: 'Kệ A1-Tầng 2', sellerId: 'SEL-01', sellerName: 'VComm Official Store', warehouseId: 'WH-HN-01', warehouseName: 'Kho Hà Nội - Cầu Giấy' },
      { productId: '1073131894', productName: 'Quần Khaki VComm SmartFit Co Giãn', sku: 'SKU-KHA-01', price: 400000, quantity: 1, shelfLocation: 'Kệ A1-Tầng 3', sellerId: 'SEL-01', sellerName: 'VComm Official Store', warehouseId: 'WH-HN-01', warehouseName: 'Kho Hà Nội - Cầu Giấy' }
    ],
    carrier: 'GHTK',
    tracking: 'GHTK88291001',
    shippingCost: 25000,
    misaSynced: true,
    misaVoucherId: 'VC-V2026-001',
  },
  {
    id: 'ECOM-2026-002',
    customerName: 'Trần Thị Mai',
    date: '18/09/2026 08:30',
    total: 28500000,
    status: 'pending_confirmation',
    paymentMethod: 'e_wallet',
    channel: 'vcomm_ecommerce',
    address: 'Quận 7, TP.HCM',
    routedWarehouse: 'WH-HCM-01',
    warehouseName: 'Kho TP.HCM - Quận 1',
    sellerId: 'SEL-05',
    sellerName: 'LG Electronics VN Flagship',
    items: [
      { productId: '1073131896', productName: 'Laptop LG Gram 14 2026 i7 SuperLight', sku: 'SKU-TECH-02', price: 28500000, quantity: 1, shelfLocation: 'Kệ B2-Tầng 3', sellerId: 'SEL-05', sellerName: 'LG Electronics VN Flagship', warehouseId: 'WH-HCM-01', warehouseName: 'Kho TP.HCM - Quận 1' }
    ],
    carrier: 'GHN',
    tracking: 'GHN55291882',
    shippingCost: 35000,
    misaSynced: true,
    misaVoucherId: 'VC-V2026-002',
  },
  {
    id: 'ECOM-2026-003',
    customerName: 'Hoàng Quốc Đạt',
    date: '18/09/2026 07:45',
    total: 1250000,
    status: 'confirmed',
    paymentMethod: 'cod',
    channel: 'vcomm_ecommerce',
    address: 'Hải Châu, Đà Nẵng',
    routedWarehouse: 'WH-DN-01',
    warehouseName: 'Kho Đà Nẵng - Hải Châu',
    sellerId: 'SEL-01',
    sellerName: 'VComm Official Store',
    items: [
      { productId: '1073131897', productName: 'Máy Tăm Nước Enchen Sonic Pro', sku: 'SKU-LIFE-03', price: 625000, quantity: 2, shelfLocation: 'Kệ C1-Tầng 1', sellerId: 'SEL-01', sellerName: 'VComm Official Store', warehouseId: 'WH-DN-01', warehouseName: 'Kho Đà Nẵng - Hải Châu' }
    ],
    carrier: 'ViettelPost',
    tracking: 'VTP9918237',
    shippingCost: 30000,
    misaSynced: true,
    misaVoucherId: 'VC-V2026-003',
  },
  {
    id: 'ECOM-2026-004',
    customerName: 'Lê Thu Trang',
    date: '18/09/2026 06:20',
    total: 3200000,
    status: 'pending_processing',
    paymentMethod: 'bank_transfer',
    channel: 'vcomm_ecommerce',
    address: 'Cầu Giấy, Hà Nội',
    items: [
      { productId: '1073131898', productName: 'Nồi Chiên Không Dầu Philips RapidAir', sku: 'SKU-KIT-04', price: 2200000, quantity: 1, shelfLocation: 'Kệ D3-Tầng 1', sellerId: 'SEL-01', sellerName: 'VComm Official Store', warehouseId: 'WH-HN-01', warehouseName: 'Kho Hà Nội - Cầu Giấy' },
      { productId: '1073131908', productName: 'Bộ Nồi Chảo Inox Sunhouse Diamond 5 Món', sku: 'SKU-KIT-08', price: 1000000, quantity: 1, shelfLocation: 'Kệ S1-Tầng 2', sellerId: 'SEL-02', sellerName: 'Sunhouse Official Mall', warehouseId: 'WH-HCM-01', warehouseName: 'Kho TP.HCM - Quận 1' }
    ],
    shippingCost: 55000,
    misaSynced: true,
    misaVoucherId: 'VC-V2026-004',
  },
  {
    id: 'ECOM-2026-005',
    customerName: 'Phạm Hữu Nghĩa',
    date: '17/09/2026 21:10',
    total: 1850000,
    status: 'processed',
    paymentMethod: 'e_wallet',
    channel: 'vcomm_ecommerce',
    address: 'Bình Thạnh, TP.HCM',
    routedWarehouse: 'WH-HCM-01',
    warehouseName: 'Kho TP.HCM - Quận 1',
    sellerId: 'SEL-01',
    sellerName: 'VComm Official Store',
    einvoiceStatus: 'signed',
    einvoiceLookupCode: 'INV-2026-ECOM-005',
    items: [
      { productId: '1073131899', productName: 'Bàn Phím Cơ VComm Pro Wireless RGB', sku: 'SKU-GEAR-05', price: 1850000, quantity: 1, shelfLocation: 'Kệ A2-Tầng 3', sellerId: 'SEL-01', sellerName: 'VComm Official Store', warehouseId: 'WH-HCM-01', warehouseName: 'Kho TP.HCM - Quận 1' }
    ],
    carrier: 'GHN',
    tracking: 'GHN88192003',
    shippingCost: 28000,
    misaSynced: true,
    misaVoucherId: 'VC-V2026-005',
  },
  {
    id: 'ECOM-2026-006',
    customerName: 'Đặng Thu Thủy',
    date: '17/09/2026 19:40',
    total: 2100000,
    status: 'pending_pickup',
    paymentMethod: 'cod',
    channel: 'vcomm_ecommerce',
    address: 'Thanh Khê, Đà Nẵng',
    routedWarehouse: 'WH-DN-01',
    warehouseName: 'Kho Đà Nẵng - Hải Châu',
    sellerId: 'SEL-06',
    sellerName: 'Everon Living Store',
    items: [
      { productId: '1073131900', productName: 'Bộ Ga Gối Cotton Tencel Eco Luxury', sku: 'SKU-BED-06', price: 1050000, quantity: 2, shelfLocation: 'Kệ E1-Tầng 2', sellerId: 'SEL-06', sellerName: 'Everon Living Store', warehouseId: 'WH-DN-01', warehouseName: 'Kho Đà Nẵng - Hải Châu' }
    ],
    carrier: 'GHTK',
    tracking: 'GHTK6629104',
    shippingCost: 35000,
    misaSynced: true,
    misaVoucherId: 'VC-V2026-006',
  },
  {
    id: 'ECOM-2026-007',
    customerName: 'Vũ Đình Trọng',
    date: '17/09/2026 16:30',
    total: 4500000,
    status: 'picked_up',
    paymentMethod: 'bank_transfer',
    channel: 'vcomm_ecommerce',
    address: 'Đống Đa, Hà Nội',
    routedWarehouse: 'WH-HN-01',
    warehouseName: 'Kho Hà Nội - Cầu Giấy',
    sellerId: 'SEL-07',
    sellerName: 'Sony Audio Official',
    items: [
      { productId: '1073131901', productName: 'Tai Nghe Noise Cancelling Sony WH1000', sku: 'SKU-AUD-07', price: 4500000, quantity: 1, shelfLocation: 'Kệ B1-Tầng 4', sellerId: 'SEL-07', sellerName: 'Sony Audio Official', warehouseId: 'WH-HN-01', warehouseName: 'Kho Hà Nội - Cầu Giấy' }
    ],
    carrier: 'ViettelPost',
    tracking: 'VTP7739182',
    shippingCost: 30000,
    misaSynced: true,
    misaVoucherId: 'VC-V2026-007',
  },
  {
    id: 'ECOM-2026-008',
    customerName: 'Bùi Minh Quân',
    date: '17/09/2026 10:00',
    total: 5400000,
    status: 'delivering',
    paymentMethod: 'cod',
    channel: 'vcomm_ecommerce',
    address: 'Quận 1, TP.HCM',
    dispatchedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    customerConfirmed: false,
    sellerWalletSettled: false,
    sellerPayout: 5130000,
    items: [
      { productId: '1073131902', productName: 'Đồng Hồ Smartwatch Pro Active', sku: 'SKU-WAT-08', price: 2700000, quantity: 1, shelfLocation: 'Kệ C2-Tầng 1', sellerId: 'SEL-03', sellerName: 'Anker & Soundcore VN', warehouseId: 'WH-HCM-01', warehouseName: 'Kho TP.HCM - Quận 1' },
      { productId: '1073131912', productName: 'Pin Sạc Dự Phòng Anker 65W 20000mAh', sku: 'SKU-POW-08', price: 1350000, quantity: 1, shelfLocation: 'Kệ C2-Tầng 2', sellerId: 'SEL-03', sellerName: 'Anker & Soundcore VN', warehouseId: 'WH-HCM-01', warehouseName: 'Kho TP.HCM - Quận 1' },
      { productId: '1073131913', productName: 'Dây Da Đồng Hồ Handmade Classic', sku: 'SKU-STRAP-08', price: 1350000, quantity: 1, shelfLocation: 'Kệ V1-Tầng 1', sellerId: 'SEL-04', sellerName: 'Vintage Strap Studio', warehouseId: 'WH-HCM-01', warehouseName: 'Kho TP.HCM - Quận 1' }
    ],
    shippingCost: 45000,
    misaSynced: true,
    misaVoucherId: 'VC-V2026-008',
  },
  {
    id: 'ECOM-2026-009',
    customerName: 'Nguyễn Thùy Dung',
    date: '15/09/2026 14:00',
    total: 6800000,
    status: 'delivered',
    paymentMethod: 'bank_transfer',
    channel: 'vcomm_ecommerce',
    address: 'Tây Hồ, Hà Nội',
    dispatchedAt: new Date(Date.now() - 80 * 3600000).toISOString(),
    deliveredAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    customerConfirmed: false,
    sellerWalletSettled: true,
    sellerWalletSettledAt: '17/09/2026 14:00',
    sellerPayout: 6460000,
    einvoiceStatus: 'signed',
    einvoiceLookupCode: 'INV-2026-ECOM-009',
    items: [
      { productId: '1073131903', productName: 'Máy Lọc Không Khí Xiaomi Smart Air Elite', sku: 'SKU-AIR-09', price: 5800000, quantity: 1, shelfLocation: 'Kệ D1-Tầng 2', sellerId: 'SEL-01', sellerName: 'VComm Official Store', warehouseId: 'WH-HN-01', warehouseName: 'Kho Hà Nội - Cầu Giấy' },
      { productId: '1073131914', productName: 'Màng Lọc HEPA Thay Thế Kháng Khuẩn', sku: 'SKU-AIR-FIL', price: 1000000, quantity: 1, shelfLocation: 'Kệ DN-Tầng 1', sellerId: 'SEL-01', sellerName: 'VComm Official Store', warehouseId: 'WH-DN-01', warehouseName: 'Kho Đà Nẵng - Hải Châu' }
    ],
    shippingCost: 50000,
    misaSynced: true,
    misaVoucherId: 'VC-V2026-009',
  },
  {
    id: 'ECOM-2026-010',
    customerName: 'Phan Kim Ngân',
    date: '12/09/2026 11:30',
    total: 1650000,
    status: 'returned',
    paymentMethod: 'e_wallet',
    channel: 'vcomm_ecommerce',
    address: 'Sơn Trà, Đà Nẵng',
    routedWarehouse: 'WH-DN-01',
    warehouseName: 'Kho Đà Nẵng - Hải Châu',
    sellerId: 'SEL-08',
    sellerName: 'VComm Boutique Studio',
    dispatchedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    deliveredAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    customerConfirmed: false,
    sellerWalletSettled: false,
    items: [
      { productId: '1073131904', productName: 'Váy Dạ Tweed Cao Cấp Autumn Edition', sku: 'SKU-FAS-10', price: 1650000, quantity: 1, shelfLocation: 'Kệ A3-Tầng 1', sellerId: 'SEL-08', sellerName: 'VComm Boutique Studio', warehouseId: 'WH-DN-01', warehouseName: 'Kho Đà Nẵng - Hải Châu' }
    ],
    carrier: 'ViettelPost',
    tracking: 'VTP-RET-9921',
    shippingCost: 35000,
    misaSynced: true,
    misaVoucherId: 'VC-V2026-010',
  },
  {
    id: 'ECOM-2026-011',
    customerName: 'Đỗ Quang Huy',
    date: '14/09/2026 09:00',
    total: 1800000,
    status: 'cancelled',
    paymentMethod: 'bank_transfer',
    channel: 'vcomm_ecommerce',
    address: 'Hoàn Kiếm, Hà Nội',
    routedWarehouse: 'WH-HN-01',
    warehouseName: 'Kho Hà Nội - Cầu Giấy',
    sellerId: 'SEL-01',
    sellerName: 'VComm Official Store',
    items: [
      { productId: '1073131895', productName: 'Combo 3 Áo Sơ Mi Oxford VComm Slimfit', sku: 'SKU-FAS-11', price: 600000, quantity: 3, shelfLocation: 'Kệ A1-Tầng 2', sellerId: 'SEL-01', sellerName: 'VComm Official Store', warehouseId: 'WH-HN-01', warehouseName: 'Kho Hà Nội - Cầu Giấy' }
    ],
    carrier: 'ViettelPost',
    tracking: 'VTP2291029',
    shippingCost: 30000,
    misaSynced: true,
    misaVoucherId: 'VC-V2026-011',
  },
  {
    id: 'ECOM-2026-012',
    customerName: 'Võ Thị Hồng Gấm',
    date: '05/09/2026 15:40',
    total: 3500000,
    status: 'delivered',
    paymentMethod: 'e_wallet',
    channel: 'vcomm_ecommerce',
    address: 'KCN Tân Bình, TP.HCM',
    routedWarehouse: 'WH-HCM-01',
    warehouseName: 'Kho TP.HCM - Quận 1',
    sellerId: 'SEL-01',
    sellerName: 'VComm Official Store',
    dispatchedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    deliveredAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    customerConfirmed: true,
    sellerWalletSettled: true,
    sellerWalletSettledAt: '08/09/2026 16:00',
    sellerPayout: 3325000,
    codAccrued: true,
    codAccruedAt: '08/09/2026 16:00',
    einvoiceStatus: 'signed',
    einvoiceLookupCode: 'INV-2026-ECOM-012',
    items: [
      { productId: '1073131896', productName: 'Máy Hút Bụi Cầm Tay Siêu Mạnh VComm Cyclone', sku: 'SKU-HOME-12', price: 3500000, quantity: 1, shelfLocation: 'Kệ B2-Tầng 1', sellerId: 'SEL-01', sellerName: 'VComm Official Store', warehouseId: 'WH-HCM-01', warehouseName: 'Kho TP.HCM - Quận 1' }
    ],
    carrier: 'GHTK',
    tracking: 'GHTK9901823',
    shippingCost: 40000,
    misaSynced: true,
    misaVoucherId: 'VC-V2026-012',
  }
];

const isDelayed = (dateStr: string, status: string) => {
  if (['delivered', 'returned', 'cancelled'].includes(status)) return false;
  try {
    let orderDate: Date;
    if (dateStr.includes('/')) {
      const [datePart, timePart] = dateStr.split(' ');
      const [d, m, y] = datePart.split('/').map(Number);
      if (timePart) {
        const [h, min] = timePart.split(':').map(Number);
        orderDate = new Date(y, m - 1, d, h || 0, min || 0);
      } else {
        orderDate = new Date(y, m - 1, d);
      }
    } else {
      orderDate = new Date(dateStr.replace(/-/g, '/'));
    }

    const diffMs = Date.now() - orderDate.getTime();
    return diffMs > 24 * 60 * 60 * 1000;
  } catch (e) {
    return false;
  }
};

const statusIcons: Record<string, any> = {
  new: Sparkles,
  pending_confirmation: Clock,
  confirmed: CheckCircle2,
  pending_processing: Package,
  processed: Boxes,
  pending_pickup: Store,
  picked_up: Truck,
  delivering: Truck,
  delivered: PackageCheck,
  returned: RotateCcw,
  cancelled: X,
};

const statusStyles: Record<string, string> = {
  new: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  pending_confirmation: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
  pending_processing: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  processed: 'bg-teal-50 text-teal-800 border-teal-200',
  pending_pickup: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  picked_up: 'bg-sky-50 text-sky-800 border-sky-200',
  delivering: 'bg-purple-50 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  returned: 'bg-rose-50 text-rose-800 border-rose-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-300',
};

const statusLabels: Record<string, string> = {
  new: 'Mới',
  pending_confirmation: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  pending_processing: 'Chờ xử lý',
  processed: 'Đã xử lý',
  pending_pickup: 'Chờ lấy hàng',
  picked_up: 'Đã lấy hàng',
  delivering: 'Chờ giao hàng',
  delivered: 'Đã giao',
  returned: 'Trả hàng',
  cancelled: 'Đã hủy',
};

const paymentMethodLabels: Record<string, string> = {
  cod: 'COD (Thu hộ)',
  bank_transfer: 'Chuyển khoản SePay',
  e_wallet: 'Ví điện tử',
  b2b_credit: 'Công nợ B2B',
  card: 'Thẻ Quốc tế',
};

export function Orders() {
  const [mockOrders, setMockOrders] = useState<any[]>(MOCK_ORDERS);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [znsToast, setZnsToast] = useState<{
    show: boolean;
    message: string;
    logContent: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const location = useLocation();
  const [dateQuery, setDateQuery] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || params.get('orderId') || params.get('customerId');
    if (q) setSearchQuery(q);
  }, [location.search]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [printingOrder, setPrintingOrder] = useState<any | null>(null);
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [packageSplitFilter, setPackageSplitFilter] = useState<'all' | 'single' | 'split'>('all');
  const [showPickListModal, setShowPickListModal] = useState<boolean>(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);

  const handleToggleSelectOrder = (orderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleBatchGeoRoute = () => {
    if (selectedOrderIds.length === 0) return;
    setMockOrders(prev => prev.map(order => {
      if (selectedOrderIds.includes(order.id)) {
        const name = (order.customerName || '').toLowerCase();
        const addr = (order.address || '').toLowerCase();
        let assignedWh = 'WH-HN-01';
        if (name.includes('hcm') || addr.includes('hcm') || addr.includes('hồ chí minh') || addr.includes('quận 1') || addr.includes('quận 7') || addr.includes('bình thạnh')) {
          assignedWh = 'WH-HCM-01';
        } else if (name.includes('đà nẵng') || addr.includes('đà nẵng') || addr.includes('dn') || addr.includes('hải châu')) {
          assignedWh = 'WH-DN-01';
        }
        const whObj = WAREHOUSES.find(w => w.id === assignedWh);
        return {
          ...order,
          routedWarehouse: assignedWh,
          warehouseName: whObj?.name || assignedWh,
        };
      }
      return order;
    }));
    alert(`Đã tự động điều phối định tuyến kho gần nhất (Geo-Routing) cho ${selectedOrderIds.length} đơn hàng đã chọn!`);
  };

  const handleBatchPack = () => {
    if (selectedOrderIds.length === 0) return;
    setMockOrders(prev => prev.map(order => {
      if (selectedOrderIds.includes(order.id)) {
        return { ...order, status: 'processed' };
      }
      return order;
    }));
    alert(`Đã chuyển ${selectedOrderIds.length} đơn hàng sang trạng thái "Đã xử lý"!`);
  };

  const handleBatchInvoice = () => {
    if (selectedOrderIds.length === 0) return;
    const signedTime = new Date().toLocaleString('vi-VN');
    setMockOrders(prev => prev.map(order => {
      if (selectedOrderIds.includes(order.id)) {
        return { 
          ...order, 
          einvoiceStatus: 'signed',
          einvoiceLookupCode: `INV-${order.id.split('-').pop()}-${Math.floor(1000 + Math.random() * 9000)}`,
          einvoiceSignedAt: signedTime
        };
      }
      return order;
    }));
    alert(`Đã ký số hóa đơn điện tử VAT hàng loạt qua Cloud HSM Viettel-CA cho ${selectedOrderIds.length} đơn hàng!`);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    // Tự động hạch toán ngầm VComm ERP khi chuyển trạng thái đơn hàng
    syncOrderToMisa(orderId).catch(err => console.warn('Background VComm sync notice:', err));

    const isMock = mockOrders.some(o => o.id === orderId);
    let matchedOrder: any = null;

    if (isMock) {
      const updated = mockOrders.map(o => {
        if (o.id === orderId) {
          const isDelivered = newStatus === 'delivered';
          const isDelivering = newStatus === 'delivering';
          const isCod = o.paymentMethod === 'cod';

          matchedOrder = { 
            ...o, 
            status: newStatus,
            misaSynced: true,
            misaVoucherId: o.misaVoucherId || `VC-AUTO-${orderId.split('-').pop()}`,
            ...(isDelivering && !o.dispatchedAt ? { dispatchedAt: new Date().toISOString() } : {}),
            ...(isDelivered ? {
              deliveredAt: new Date().toISOString(),
              sellerWalletSettled: true,
              sellerWalletSettledAt: new Date().toLocaleString('vi-VN'),
              sellerPayout: o.sellerPayout || Math.round(o.total * 0.95),
              ...(isCod ? { codAccrued: true, codAccruedAt: new Date().toLocaleString('vi-VN') } : {})
            } : {})
          };
          return matchedOrder;
        }
        return o;
      });
      setMockOrders(updated);
    } else {
      try {
        const { doc, updateDoc } = await import('../lib/firebase');
        const isDelivered = newStatus === 'delivered';
        const isDelivering = newStatus === 'delivering';
        const isCod = selectedOrder?.paymentMethod === 'cod';
        
        const updatePayload: any = { 
          status: newStatus,
          misaSynced: true,
        };
        if (isDelivering) {
          updatePayload.dispatchedAt = new Date().toISOString();
        }
        if (isDelivered) {
          updatePayload.deliveredAt = new Date().toISOString();
          updatePayload.sellerWalletSettled = true;
          updatePayload.sellerWalletSettledAt = new Date().toLocaleString('vi-VN');
          updatePayload.sellerPayout = Math.round((selectedOrder?.total || 0) * 0.95);
          if (isCod) {
            updatePayload.codAccrued = true;
            updatePayload.codAccruedAt = new Date().toLocaleString('vi-VN');
          }
        }
        await updateDoc(doc(db, 'orders', orderId), updatePayload);
        matchedOrder = dbOrders.find(o => o.id === orderId);
        if (matchedOrder) {
          matchedOrder = { ...matchedOrder, ...updatePayload };
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
        message: `Đã gửi và cập nhật trạng thái ZNS (${templateCode}) tới SĐT 0981234567 thành công!${matchedOrder.codAccrued ? ' [Đã tự động ghi nhận công nợ COD]' : ''}`,
        logContent: log.content,
      });
    }
  };

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
    return dbOrders.length > 0 ? dbOrders : mockOrders;
  }, [dbOrders, mockOrders]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesDate = !dateQuery || (order.date && order.date.includes(dateQuery));
      const matchesWarehouse = warehouseFilter === 'all' || order.routedWarehouse === warehouseFilter;
      const matchesPayment = paymentFilter === 'all' || order.paymentMethod === paymentFilter;
      let matchesPackageSplit = true;
      if (packageSplitFilter !== 'all') {
        const pkgs = getOrderPackages(order);
        if (packageSplitFilter === 'single') matchesPackageSplit = pkgs.length === 1;
        if (packageSplitFilter === 'split') matchesPackageSplit = pkgs.length > 1;
      }
      const query = debouncedSearchQuery.trim().toLowerCase();
      const matchesSearch = !query ||
        (order.id && order.id.toLowerCase().includes(query)) ||
        (order.customerName && order.customerName.toLowerCase().includes(query)) ||
        (order.tracking && order.tracking.toLowerCase().includes(query)) ||
        (order.address && order.address.toLowerCase().includes(query)) ||
        (order.items && order.items.some((it: any) => (it.productName || it.name || '').toLowerCase().includes(query)));
      return matchesStatus && matchesDate && matchesWarehouse && matchesPayment && matchesPackageSplit && matchesSearch;
    });
  }, [allOrders, statusFilter, dateQuery, warehouseFilter, paymentFilter, packageSplitFilter, debouncedSearchQuery]);

  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDraftRma = async (order: any) => {
    setIsGenerating(true);
    try {
      const response = await generateRMAResponse(order);
      setAiResponse(response);
    } catch (e) {
      setAiResponse('Lỗi khi tạo phản hồi AI.');
    }
    setIsGenerating(false);
  };

  const addDemoOrders = async () => {
    // Note: status must be one of: 'pending', 'completed', 'cancelled', 'returned' according to firestore rules
    // paymentMethod must be 'cash', 'qr', 'pos', 'loyalty', 'loyalty_full', or null
    const demo = [
      {
        customerName: 'Nguyễn Văn A',
        total: 2500000,
        status: 'delivered',
        paymentMethod: 'cod',
        items: [{ name: 'Bàn phím cơ', price: 2500000 }],
        carrier: 'GHTK',
        tracking: 'GHTK123456789',
        shippingCost: 35000,
        source: 'erp',
      },
      {
        customerName: 'Trần Thị B',
        total: 1200000,
        status: 'pending',
        paymentMethod: 'bank_transfer',
        items: [{ name: 'Chuột không dây', price: 1200000 }],
        carrier: 'GHN',
        tracking: 'GHN987654321',
        shippingCost: 28000,
        source: 'erp',
      },
    ];

    const { getAuth } = await import('../lib/firebase');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Bạn cần đăng nhập để thêm demo orders!');
      return;
    }

    for (const o of demo) {
      await addDoc(collection(db, 'orders'), {
        ...o,
        staffId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
    }
  };

  const handleExportCsv = () => {
    const headers = ['Mã đơn', 'Khách hàng', 'Kênh', 'Ngày đặt', 'Tổng tiền (VND)', 'Phương thức thanh toán', 'Trạng thái', 'Hãng vận chuyển', 'Mã tracking', 'Kho điều phối'];
    const rows = filteredOrders.map(o => [
      o.id,
      `"${o.customerName || ''}"`,
      'VComm eCommerce',
      o.date,
      o.total,
      o.paymentMethod,
      statusLabels[o.status] || o.status,
      o.carrier || '',
      o.tracking || '',
      `"${o.warehouseName || o.routedWarehouse || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VComm_Orders_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const orderRibbonItems: MetricRibbonItem[] = [
    {
      id: 'rev',
      icon: <DollarSign className="w-3.5 h-3.5" />,
      label: 'Doanh thu eCommerce',
      value: formatCurrency(allOrders.reduce((sum, o) => sum + (o.total || 0), 0)),
      subText: 'Tự động đối soát',
      colorVariant: 'emerald'
    },
    {
      id: 'packing',
      icon: <Package className="w-3.5 h-3.5" />,
      label: 'Chuẩn bị kho',
      value: allOrders.filter(o => ['new', 'pending_confirmation', 'confirmed', 'pending_processing', 'processed'].includes(o.status)).length,
      subText: 'Đang nhặt kệ',
      colorVariant: 'blue',
      onClick: () => setStatusFilter('confirmed')
    },
    {
      id: 'shipping',
      icon: <Truck className="w-3.5 h-3.5" />,
      label: 'Đang giao 3PL',
      value: allOrders.filter(o => ['pending_pickup', 'picked_up', 'delivering'].includes(o.status)).length,
      subText: 'GHN/GHTK/Viettel',
      colorVariant: 'purple',
      onClick: () => setStatusFilter('delivering')
    },
    {
      id: 'delivered',
      icon: <PackageCheck className="w-3.5 h-3.5" />,
      label: 'Đã giao hoàn tất',
      value: allOrders.filter(o => o.status === 'delivered').length,
      subText: 'Giải ngân 3d',
      colorVariant: 'emerald',
      onClick: () => setStatusFilter('delivered')
    },
    {
      id: 'issues',
      icon: <RotateCcw className="w-3.5 h-3.5" />,
      label: 'Hoãn / Hủy',
      value: allOrders.filter(o => ['cancelled', 'returned'].includes(o.status)).length,
      subText: 'Cần rà soát',
      colorVariant: 'rose',
      onClick: () => setStatusFilter('cancelled')
    }
  ];

  return (
    <div className="space-y-3 animate-in fade-in slide-in- duration-500 pb-12 font-sans">
      {/* Compact Standardized Header */}
      <CompactPageHeader
        icon={<ShoppingBag className="w-4 h-4 text-indigo-600" />}
        title="Nhật Ký Đơn Hàng VComm eCommerce"
        badge={{ text: "Realtime", variant: "emerald" }}
        description="Giám sát toàn trình đơn hàng tự động phân tách mã vận đơn theo Seller / Kho và ghi nhận kế toán tự động."
        actions={
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Xuất danh sách đơn hàng VComm eCommerce ra file CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>
        }
      />

      {/* Compact Stats Ribbon */}
      <CompactStatsRibbon
        items={orderRibbonItems}
        storageKey="orders_stats_ribbon"
      />

      {/* Delayed Alert Banner if any */}
      {allOrders.some(o => isDelayed(o.date, o.status)) && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-rose-800 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
            <span className="text-xs font-bold">
              Cảnh báo: Có {allOrders.filter(o => isDelayed(o.date, o.status)).length} đơn hàng quá 24h chưa được đóng gói xử lý. Vui lòng kiểm tra điều phối kho!
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('all')}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Xem ngay
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Operational Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã đơn #, tên khách, SĐT, tracking, sản phẩm..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Warehouse Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={warehouseFilter}
                onChange={e => setWarehouseFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả kho xuất</option>
                {WAREHOUSES.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả thanh toán</option>
                <option value="cod">COD (Thu hộ)</option>
                <option value="bank_transfer">Chuyển khoản SePay</option>
                <option value="e_wallet">Ví điện tử</option>
              </select>
            </div>

            {/* Package Split Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Boxes className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={packageSplitFilter}
                onChange={e => setPackageSplitFilter(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả kiện hàng</option>
                <option value="single">Đơn 1 kiện duy nhất</option>
                <option value="split">Đơn tự động tách đa kiện</option>
              </select>
            </div>

            {/* Date Input */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={dateQuery}
                onChange={e => setDateQuery(e.target.value)}
                placeholder="Ngày (YYYY-MM-DD)"
                className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-40 shadow-2xs"
              />
            </div>

            {/* Clear All Filters */}
            {(searchQuery || warehouseFilter !== 'all' || paymentFilter !== 'all' || packageSplitFilter !== 'all' || dateQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setWarehouseFilter('all');
                  setPaymentFilter('all');
                  setPackageSplitFilter('all');
                  setDateQuery('');
                  setStatusFilter('all');
                }}
                className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Tìm thấy: <strong className="text-slate-900 font-bold">{filteredOrders.length}</strong> đơn hàng
            </span>
          </div>
        </div>

        {/* 11 Status Tabs Toolbar */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap mr-1">
            Trạng thái (11):
          </span>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'new', label: 'Mới' },
            { id: 'pending_confirmation', label: 'Chờ xác nhận' },
            { id: 'confirmed', label: 'Đã xác nhận' },
            { id: 'pending_processing', label: 'Chờ xử lý' },
            { id: 'processed', label: 'Đã xử lý' },
            { id: 'pending_pickup', label: 'Chờ lấy hàng' },
            { id: 'picked_up', label: 'Đã lấy hàng' },
            { id: 'delivering', label: 'Chờ giao hàng' },
            { id: 'delivered', label: 'Đã giao' },
            { id: 'returned', label: 'Trả hàng' },
            { id: 'cancelled', label: 'Đã hủy' },
          ].map(tab => {
            const count = tab.id === 'all' ? allOrders.length : allOrders.filter(o => o.status === tab.id).length;
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow-2xs",
                  isActive
                    ? "bg-slate-900 text-white shadow-xs ring-1 ring-slate-950"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

            {/* Batch Actions Bar (when orders selected) */}
            {selectedOrderIds.length > 0 && (
              <div className="mx-4 my-3 flex flex-wrap items-center justify-between gap-3 bg-indigo-50/90 border border-indigo-200 p-3 rounded-xl animate-in fade-in shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-black shadow-2xs">
                    {selectedOrderIds.length}
                  </span>
                  <span className="text-xs font-bold text-indigo-950">đơn hàng đã chọn</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowBatchModal(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="In mã vạch vận đơn A6 hàng loạt cho các hãng GHTK, GHN, ViettelPost"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In Vận Đơn (A6)</span>
                  </button>

                  <button
                    onClick={() => setShowPickListModal(true)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="Tổng hợp danh sách hàng cần nhặt theo vị trí kệ kho (Kệ A-B-C)"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>In Phiếu Nhặt Hàng (Pick-list)</span>
                  </button>

                  <button
                    onClick={handleBatchGeoRoute}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="Tự động gán đơn hàng vào kho gần nhất có đủ tồn kho"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Định Tuyến Kho (Geo-Routing)</span>
                  </button>

                  <button
                    onClick={handleBatchPack}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="Chuyển trạng thái đơn hàng sang Đang đóng gói"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Đóng Gói Hàng Loạt</span>
                  </button>

                  <button
                    onClick={handleBatchInvoice}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="Ký số hóa đơn điện tử hàng loạt qua HSM Viettel-CA"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ký Hóa Đơn VAT (Cloud HSM)</span>
                  </button>

                  <button
                    onClick={() => setSelectedOrderIds([])}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}

        <div className="bg-white border border-slate-300 shadow-sm rounded-xl overflow-hidden mt-4 h-[600px] flex flex-col">
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
                        'bg-red-50/30 border-l-red-500',
                      selectedOrderIds.includes(order?.id) && 'bg-blue-50/50'
                    )}
                    onClick={() => setSelectedOrder(order)}
                  />
                );
              },
            }}
            fixedHeaderContent={() => (
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3.5 w-10 text-center bg-slate-50">
                  <input 
                    type="checkbox" 
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={() => {
                      if (selectedOrderIds.length === filteredOrders.length) {
                        setSelectedOrderIds([]);
                      } else {
                        setSelectedOrderIds(filteredOrders.map(o => o.id));
                      }
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  Mã đơn & Khách hàng
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  Sản phẩm trong đơn
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  Vận đơn & Kiện hàng (Tự động tách)
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  Giá trị & Thanh toán
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center bg-slate-50">
                  Trạng thái (11)
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right bg-slate-50">
                  Thao tác
                </th>
              </tr>
            )}
            itemContent={(index, order) => {
              const firstItem = order.items?.[0];
              const remainingItemsCount = (order.items?.length || 1) - 1;
              const pkgs = getOrderPackages(order);
              const isMultiPkg = pkgs.length > 1;

              return (
                <>
                  <td className="px-4 py-3.5 w-10 text-center" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={e => handleToggleSelectOrder(order.id, e as any)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* Mã đơn & Khách hàng */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 transition-colors">
                        #{order.id.split('-').pop()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold border flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                        <Globe className="w-2.5 h-2.5" />
                        VComm eCommerce
                      </span>
                      {isDelayed(order.date, order.status) && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[8.5px] font-black uppercase rounded animate-pulse">
                          Chậm {'>'}24h
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {(order.customerName || 'K')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <EntityLink type="customer" id={order.customerName} label={order.customerName} />
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{order.date}</span>
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Sản phẩm trong đơn */}
                  <td className="px-5 py-3.5">
                    {isMultiPkg ? (
                      <div className="space-y-1.5 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                            {order.items?.length || 0} SP ({pkgs.length} kiện hàng)
                          </span>
                        </div>
                        <div className="space-y-1">
                          {pkgs.map((pkg, pIdx) => (
                            <div key={pkg.packageId} className="text-[10.5px] bg-slate-50/80 p-1.5 rounded border border-slate-200/60">
                              <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-500 mb-0.5">
                                <span className="text-purple-700 font-mono">Kiện #{pIdx + 1}</span>
                                <span className="truncate max-w-[120px] text-slate-600">{pkg.sellerName}</span>
                              </div>
                              <p className="line-clamp-1 font-medium text-slate-800">
                                {pkg.items[0]?.productName || pkg.items[0]?.name}
                                {pkg.items.length > 1 && ` (+${pkg.items.length - 1} SP)`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : firstItem ? (
                      <div className="max-w-xs">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors" title={firstItem.productName || firstItem.name}>
                          {firstItem.productName || firstItem.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 font-medium">
                            SL: <strong className="text-slate-800">{firstItem.quantity || 1}</strong>
                          </span>
                          {firstItem.shelfLocation && (
                            <span className="text-[9.5px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                              {firstItem.shelfLocation}
                            </span>
                          )}
                          {remainingItemsCount > 0 && (
                            <span className="text-[9.5px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-100">
                              +{remainingItemsCount} SP khác
                            </span>
                          )}
                        </div>
                        {order.sellerName && (
                          <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1">
                            <span className="font-medium text-slate-700">{order.sellerName}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Không có chi tiết</span>
                    )}
                  </td>

                  {/* Vận đơn & Kiện hàng (Tự động tách) */}
                  <td className="px-5 py-3.5">
                    {isMultiPkg ? (
                      <div className="space-y-1.5 min-w-[210px]">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                          <Layers className="w-3 h-3 text-purple-600" />
                          <span>Tự động tách {pkgs.length} Kiện</span>
                        </div>
                        <div className="space-y-1">
                          {pkgs.map((pkg, pIdx) => (
                            <div key={pkg.packageId} className="flex flex-col gap-0.5 bg-slate-50 px-2 py-1 rounded border border-slate-200/80 text-[10px]">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-[8.5px] font-black uppercase text-slate-700 bg-white px-1 py-0.2 rounded border border-slate-200">
                                  {pkg.carrier}
                                </span>
                                <span className="font-mono font-bold text-indigo-600 truncate max-w-[130px]" title={pkg.trackingCode}>
                                  {pkg.trackingCode}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[9px] text-slate-500 truncate">
                                <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span className="truncate">{pkg.warehouseName}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : pkgs[0]?.carrier || order.carrier ? (
                      <div className="space-y-1 min-w-[190px]">
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Package className="w-2.5 h-2.5 text-slate-500" />
                          <span>1 Kiện duy nhất</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9.5px] font-black uppercase text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {pkgs[0]?.carrier || order.carrier}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-blue-600">
                            {pkgs[0]?.trackingCode || order.tracking}
                          </span>
                        </div>
                        {(pkgs[0]?.warehouseName || order.routedWarehouse) && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{pkgs[0]?.warehouseName || order.warehouseName || order.routedWarehouse}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Chờ điều phối kho</span>
                    )}
                  </td>

                  {/* Giá trị & Thanh toán */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-bold text-slate-900 tracking-tight">
                      {formatCurrency(order.total)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Cước: {order.shippingCost ? formatCurrency(order.shippingCost) : '0 đ'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[9.5px] font-bold rounded">
                        {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                      </span>
                      {order.paymentMethod === 'cod' && order.status === 'delivered' && order.codAccrued && (
                        <span 
                          title="Tự động ghi nhận công nợ COD khi shipper giao hàng thành công. Kế toán đối soát sao kê sau."
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded border border-emerald-200"
                        >
                          <DollarSign className="w-2.5 h-2.5" />
                          <span>Ghi COD</span>
                        </span>
                      )}
                      {order.einvoiceStatus === 'signed' && (
                        <span 
                          title={`Hóa đơn VAT Cloud HSM: ${order.einvoiceLookupCode || 'Đã ký Viettel-CA'}`}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded border border-indigo-200"
                        >
                          <FileText className="w-2.5 h-2.5" />
                          <span>VAT</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Trạng thái (11) */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex justify-center">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[10.5px] font-bold whitespace-nowrap shadow-2xs border flex items-center gap-1.5',
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

                  {/* Thao tác */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-all">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedOrderIds([order.id]);
                          setShowBatchModal(true);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg text-indigo-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="In tem vận đơn bưu cục A6"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Tem A6</span>
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setPrintingOrder(order);
                        }}
                        className="p-1.5 bg-white border border-slate-200 shadow-2xs hover:border-emerald-500 hover:bg-emerald-50 rounded-lg text-slate-500 hover:text-emerald-600 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                        title="In nhanh Phiếu bán lẻ K80"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="p-1.5 bg-white border border-slate-200 shadow-2xs hover:border-blue-500 hover:bg-blue-50 rounded-lg text-slate-500 hover:text-blue-600 transition-all active:scale-95 cursor-pointer"
                        title="Xem chi tiết log eCommerce"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </>
              );
            }}
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
          />
        )}

        {znsToast && znsToast.show && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 border-2 border-blue-500 text-[#FAF9F5] rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0 shadow-md">
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

        {showBatchModal && (
          <BatchWaybillModal
            orders={filteredOrders.filter(o => selectedOrderIds.includes(o.id))}
            onClose={() => setShowBatchModal(false)}
          />
        )}

        {showPickListModal && (
          <PickListModal
            isOpen={showPickListModal}
            onClose={() => setShowPickListModal(false)}
            selectedOrders={filteredOrders.filter(o => selectedOrderIds.includes(o.id))}
          />
        )}
      </div>
    </div>
  );
}
