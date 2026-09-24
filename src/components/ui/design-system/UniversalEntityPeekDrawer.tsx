import React, { useState } from 'react';
import { useEntityPeek, EntityType } from '../../../context/EntityContext';
import { UniversalDrawer } from './UniversalDrawer';
import { StatusBadge } from './StatusBadge';
import { formatCurrency } from '../../../lib/utils';
import { 
  User, 
  ShoppingBag, 
  BadgeCheck, 
  Boxes, 
  FileText, 
  Headphones, 
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wallet,
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  PlusCircle,
  FileCheck2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UniversalEntityPeekDrawer() {
  const { activeEntity, isOpen, closePeek, navigateToEntityApp } = useEntityPeek();
  const [activeTab, setActiveTab] = useState<'overview' | 'related' | 'actions'>('overview');
  const navigate = useNavigate();

  if (!activeEntity) return null;

  const { type, id, title, subtitle, metadata } = activeEntity;

  // Icon & Header styling by entity type
  const getEntityHeader = () => {
    switch (type) {
      case 'customer':
        return {
          title: title || `Khách hàng: ${id}`,
          subtitle: subtitle || 'Hồ sơ 360° Khách hàng & Lịch sử giao dịch đa kênh',
          icon: User,
          iconColor: 'bg-blue-600 text-white',
          appName: 'App Khách Hàng',
        };
      case 'order':
        return {
          title: title || `Đơn hàng: ${id}`,
          subtitle: subtitle || 'Thông tin đóng gói, kho vận & chứng từ hóa đơn',
          icon: ShoppingBag,
          iconColor: 'bg-indigo-600 text-white',
          appName: 'App Đơn Hàng',
        };
      case 'employee':
        return {
          title: title || `Nhân sự: ${id}`,
          subtitle: subtitle || 'Hồ sơ nhân sự, CCDC cấp phát, KPI & Chữ ký số',
          icon: BadgeCheck,
          iconColor: 'bg-purple-600 text-white',
          appName: 'App Nhân Sự (HRM)',
        };
      case 'asset':
        return {
          title: title || `Tài sản / Thiết bị: ${id}`,
          subtitle: subtitle || 'Tình trạng thiết bị, người đang mượn & bảo hành',
          icon: Boxes,
          iconColor: 'bg-emerald-600 text-white',
          appName: 'App Tài Sản & Thiết Bị',
        };
      case 'invoice':
        return {
          title: title || `Hóa đơn: ${id}`,
          subtitle: subtitle || 'Hóa đơn điện tử Thông tư 78/2021 & thuế GTGT',
          icon: FileText,
          iconColor: 'bg-amber-600 text-white',
          appName: 'App Hóa Đơn (M-Invoice)',
        };
      case 'ticket':
        return {
          title: title || `Ticket Khiếu nại: ${id}`,
          subtitle: subtitle || 'Yêu cầu hỗ trợ CSKH & IT Helpdesk',
          icon: Headphones,
          iconColor: 'bg-rose-600 text-white',
          appName: 'App CSKH & Helpdesk',
        };
    }
  };

  const headerInfo = getEntityHeader();

  return (
    <UniversalDrawer
      isOpen={isOpen}
      onClose={closePeek}
      title={headerInfo.title}
      subtitle={headerInfo.subtitle}
      icon={headerInfo.icon}
      iconColor={headerInfo.iconColor}
      width="lg"
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Mã định danh: <strong className="font-mono text-slate-800">{id}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={closePeek}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={() => navigateToEntityApp(type, id)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span>Mở trong {headerInfo.appName}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      }
    >
      {/* 360° Entity Tabs */}
      <div className="flex border-b border-slate-200 gap-4 mb-4 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Thông tin tổng quan
        </button>
        <button
          onClick={() => setActiveTab('related')}
          className={`pb-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'related'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Liên kết hệ sinh thái
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`pb-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'actions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Thao tác liền mạch
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Trạng thái</span>
              <div className="mt-1">
                <StatusBadge variant="success" dot size="sm">
                  Đang hoạt động
                </StatusBadge>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Phân hệ quản lý</span>
              <div className="mt-1 text-xs font-bold text-slate-900">{headerInfo.appName}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Độ tin cậy</span>
              <div className="mt-1 text-xs font-black text-emerald-600">99.8% Đồng bộ</div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Chi tiết thực thể
            </h4>

            {type === 'customer' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Tên khách / Doanh nghiệp:</span>
                  <span className="font-bold text-slate-900">{title || 'Công ty TNHH V-Retail'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Số điện thoại:</span>
                  <span className="font-bold text-slate-900">0987 654 321</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Hạng thành viên:</span>
                  <span className="font-bold text-amber-600">VIP Platinum (RFM: 5-5-4)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Tổng chi tiêu lũy kế:</span>
                  <span className="font-black text-emerald-600">45.000.000 đ (12 đơn hàng)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Số dư ví tín dụng:</span>
                  <span className="font-bold text-blue-600">25.000.000 đ</span>
                </div>
              </div>
            )}

            {type === 'order' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-indigo-600">{id}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Tổng giá trị đơn:</span>
                  <span className="font-black text-emerald-600">3.850.000 đ</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Phương thức thanh toán:</span>
                  <span className="font-bold text-slate-800">Chuyển khoản SePay QR (Đã thanh toán)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Đơn vị vận chuyển:</span>
                  <span className="font-bold text-slate-800">ViettelPost (Mã MVĐ: VTP-884920)</span>
                </div>
              </div>
            )}

            {type === 'employee' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Họ và tên:</span>
                  <span className="font-bold text-slate-900">{title || 'Nguyễn Văn An'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Chức vụ & Phòng ban:</span>
                  <span className="font-bold text-slate-800">Kế toán trưởng • Khối Tài chính</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Trạng thái Chữ ký số HSM:</span>
                  <span className="font-bold text-emerald-600">Đã cấp chứng thư cá nhân Viettel-CA</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Hiệu suất KPI Q1/2026:</span>
                  <span className="font-bold text-indigo-600">Xuất sắc (Grade A - 96.5 điểm)</span>
                </div>
              </div>
            )}

            {type === 'asset' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Model thiết bị:</span>
                  <span className="font-bold text-slate-900">Máy POS Sunmi V2 Pro (4G/NFC)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Mã Serial / IMEI:</span>
                  <span className="font-mono font-bold text-slate-800">SN-SUNMI-2026-99124</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Đối tượng sử dụng:</span>
                  <span className="font-bold text-indigo-600">Điểm bán F&B Quận 1 (Cửa hàng Flagship)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Tình trạng bảo hành:</span>
                  <span className="font-bold text-emerald-600">Còn bảo hành chính hãng đến 12/2027</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CROSS-APP RELATED ENTITIES */}
      {activeTab === 'related' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Dữ liệu liên kết tức thời từ các phân hệ liên quan trong hệ sinh thái VComm ERP:
          </p>

          {type === 'customer' && (
            <div className="space-y-2">
              <div
                onClick={() => {
                  closePeek();
                  navigate('/orders?customer=active');
                }}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">12 Đơn Hàng Đã Giao</div>
                    <div className="text-[11px] text-slate-500">Tổng doanh thu: 45.000.000 đ</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => {
                  closePeek();
                  navigate('/device-leasing');
                }}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">1 Hợp Đồng Thuê Máy POS Sunmi</div>
                    <div className="text-[11px] text-slate-500">Hạn hợp đồng: Còn 8 tháng (Đúng hạn)</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => {
                  closePeek();
                  navigate('/cskh');
                }}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Ticket CSKH & Khiếu Nại</div>
                    <div className="text-[11px] text-emerald-600 font-bold">0 sự cố mở • Đã giải quyết 3 ticket</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          )}

          {type === 'order' && (
            <div className="space-y-2">
              <div
                onClick={() => {
                  closePeek();
                  navigate('/warehouse?tab=packing');
                }}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Vị Trí Kho & Kiện Hàng WMS</div>
                    <div className="text-[11px] text-slate-500">Kho Tổng Tân Bình • Kệ D-04 • Đã quét mã SKU</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => {
                  closePeek();
                  navigate('/invoices');
                }}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Hóa Đơn Điện Tử VAT (M-Invoice)</div>
                    <div className="text-[11px] text-slate-500">Số HĐ: 0029144 • Ký số Cloud HSM thành công</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          )}

          {type === 'employee' && (
            <div className="space-y-2">
              <div
                onClick={() => {
                  closePeek();
                  navigate('/assets');
                }}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">CCDC Cấp Phát Cho Nhân Viên</div>
                    <div className="text-[11px] text-slate-500">Laptop Dell Latitude 5530 + Màn hình Dell 24"</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => {
                  closePeek();
                  navigate('/signature');
                }}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Chứng Thư Chữ Ký Số Cá Nhân</div>
                    <div className="text-[11px] text-slate-500">Hạn mức ký: 500.000.000 đ • Viettel-CA</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WORKFLOW ACTIONS */}
      {activeTab === 'actions' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Các thao tác chuyển tiếp quy trình tự động (Workflow Continuity):
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {type === 'customer' && (
              <>
                <button
                  onClick={() => {
                    closePeek();
                    navigate('/orders?action=new');
                  }}
                  className="flex items-center justify-between p-3.5 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-indigo-600" />
                    <span>Tạo Đơn Hàng Mới Cho Khách Hàng Này</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                </button>

                <button
                  onClick={() => {
                    closePeek();
                    navigate('/omnichat');
                  }}
                  className="flex items-center justify-between p-3.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Mở Hội Thoại Tư Vấn OmniChat</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                </button>

                <button
                  onClick={() => {
                    closePeek();
                    navigate('/device-leasing?action=new');
                  }}
                  className="flex items-center justify-between p-3.5 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Lập Hợp Đồng Cho Thuê Thiết Bị / Máy POS</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-500" />
                </button>
              </>
            )}

            {type === 'order' && (
              <>
                <button
                  onClick={() => {
                    closePeek();
                    navigate('/warehouse?tab=packing');
                  }}
                  className="flex items-center justify-between p-3.5 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes className="w-4 h-4 text-indigo-600" />
                    <span>Chuyển Sang Trạm Đóng Gói Scan-to-Verify</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                </button>

                <button
                  onClick={() => {
                    closePeek();
                    navigate('/invoices?action=issue');
                  }}
                  className="flex items-center justify-between p-3.5 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Ký Số & Phát Hành Hóa Đơn VAT Ngay</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-500" />
                </button>
              </>
            )}

            {type === 'employee' && (
              <>
                <button
                  onClick={() => {
                    closePeek();
                    navigate('/assets?action=assign');
                  }}
                  className="flex items-center justify-between p-3.5 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes className="w-4 h-4 text-emerald-600" />
                    <span>Bàn Giao Thêm Thiết Bị / CCDC Công Tác</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-500" />
                </button>

                <button
                  onClick={() => {
                    closePeek();
                    navigate('/performance');
                  }}
                  className="flex items-center justify-between p-3.5 bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <BadgeCheck className="w-4 h-4 text-purple-600" />
                    <span>Đánh Giá Hiệu Suất KPI / Đánh Giá 360°</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </UniversalDrawer>
  );
}
