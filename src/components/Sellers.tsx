import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  ShieldCheck, 
  FileText, 
  Search, 
  Filter, 
  Star, 
  Percent, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Store, 
  User, 
  Building, 
  Lock, 
  Unlock, 
  Wallet, 
  Settings2, 
  Download, 
  Eye, 
  Clock, 
  ArrowUpDown, 
  Sliders, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  BadgeCheck
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { ComprehensiveSeller, LegalBusinessType, ApprovalStatus } from '../types/sellerKyc';
import { COMPREHENSIVE_MOCK_SELLERS } from '../data/mockSellers';
import { SellerApprovalModal } from './sellers/SellerApprovalModal';
import { SellerDetailModal } from './sellers/SellerDetailModal';
import { CompactPageHeader } from './common/CompactPageHeader';
import { CompactStatsRibbon, MetricRibbonItem } from './common/CompactStatsRibbon';

// Backward compatibility export for other components
export const MOCK_SELLERS = COMPREHENSIVE_MOCK_SELLERS.map(s => ({
  id: s.id,
  name: s.shopName,
  totalProducts: s.totalProducts,
  rating: s.rating,
  gmv: s.gmv,
  status: s.status,
  taxCode: s.tax.taxCode,
  identityCard: s.vneid.citizenId,
  address: s.businessAddress,
  representative: s.representativeName,
  commissionRate: s.commissionRate,
  joinDate: s.joinDate,
  onboardingStep: s.status === 'active' ? 'completed' as const : 'verification' as const,
  partnerType: s.partnerCategory,
  activeModules: s.activeModules,
  walletBalance: s.walletBalance
}));

export function SellerManagement() {
  const [sellers, setSellers] = useState<ComprehensiveSeller[]>(COMPREHENSIVE_MOCK_SELLERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [legalTypeFilter, setLegalTypeFilter] = useState<'all' | LegalBusinessType>('all');
  const [vneidFilter, setVneidFilter] = useState<'all' | 'verified' | 'pending'>('all');

  // Modal States
  const [approvingSeller, setApprovingSeller] = useState<ComprehensiveSeller | null>(null);
  const [viewingSeller, setViewingSeller] = useState<ComprehensiveSeller | null>(null);
  const [adjustingSeller, setAdjustingSeller] = useState<ComprehensiveSeller | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Platform Config States
  const [sellerAutoApprove, setSellerAutoApprove] = useState(false);
  const [requireVneidLevel2, setRequireVneidLevel2] = useState(true);
  const [sellerRequireTaxId, setSellerRequireTaxId] = useState(true);
  const [sellerRequireLicense, setSellerRequireLicense] = useState(true);
  const [slaHours, setSlaHours] = useState('24');
  const [defaultCommission, setDefaultCommission] = useState('5');

  // Fetch real data from Supabase if connected
  const fetchDbSellers = async () => {
    setIsLoading(true);
    try {
      const { data: sbSellers, error } = await supabase.from('sellers').select('*');
      if (error) throw error;

      if (sbSellers && sbSellers.length > 0) {
        const { data: sbWallets } = await supabase.from('seller_wallets').select('*');
        const walletMap = new Map((sbWallets || []).map(w => [w.seller_id, w]));

        const { data: sbTaxes } = await supabase.from('seller_taxes').select('*');
        const taxMap = new Map((sbTaxes || []).map(t => [t.seller_id, t]));

        const mapped: ComprehensiveSeller[] = sbSellers.map(s => {
          const wallet = walletMap.get(s.id);
          const tax = taxMap.get(s.id);
          const legalType: LegalBusinessType = s.business_type || 'INDIVIDUAL';

          return {
            id: s.id,
            shopName: s.shop_name,
            legalType,
            representativeName: tax?.representative_name || s.representative || 'Chưa cập nhật',
            phone: s.phone || '0901234567',
            email: s.email || `${s.id.toLowerCase()}@seller.vcomm.vn`,
            businessAddress: s.business_address || 'Địa chỉ đăng ký kinh doanh',
            warehouseAddress: s.warehouse_address || 'Tổng kho vận chuyển',
            status: s.status === 'APPROVED' ? 'active' : s.status === 'PENDING' ? 'pending' : 'suspended',
            vneid: {
              citizenId: s.vneid_identifier || '001090000000',
              fullName: tax?.representative_name || s.representative || 'CHỦ GIAN HÀNG',
              dob: '01/01/1990',
              gender: 'Nam',
              permanentAddress: 'Hà Nội / TP.HCM',
              level: (s.vneid_level || 2) as 1 | 2,
              verifiedAt: s.vneid_verified_at || new Date().toLocaleString('vi-VN'),
              qrVerified: true,
              matchRate: 100
            },
            tax: {
              taxCode: tax?.tax_id_number || '0100000000',
              registeredName: tax?.representative_name || s.shop_name,
              taxStatus: tax?.tax_status === 'VERIFIED' ? 'ACTIVE' : 'PENDING',
              vatRate: legalType === 'ENTERPRISE' ? 10.0 : 1.0,
              pitRate: legalType === 'ENTERPRISE' ? 0.0 : 0.5,
              invoiceType: legalType === 'ENTERPRISE' ? 'SELLER_ISSUES_INVOICE' : 'PLATFORM_WITHHOLDING',
              taxOffice: 'Cục Thuế Nhà Nước'
            },
            bank: {
              bankName: s.bank_name || 'Vietcombank',
              accountNumber: s.bank_account_number || '000000000000',
              accountHolder: s.bank_account_holder || tax?.representative_name || 'CHỦ GIAN HÀNG',
              isMatchedWithName: true
            },
            documents: [
              {
                id: 'doc-auto',
                type: legalType === 'ENTERPRISE' ? 'BUSINESS_LICENSE' : 'VNEID_CARD_FRONT',
                title: legalType === 'ENTERPRISE' ? 'ĐKKD Doanh nghiệp' : 'CCCD VNeID Mức 2',
                fileName: 'ChungTuPhapLy.pdf',
                fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
                uploadedAt: new Date(s.created_at).toLocaleDateString('vi-VN'),
                status: 'VERIFIED'
              }
            ],
            totalProducts: 0,
            rating: Number(s.rating || 5),
            gmv: Number(s.revenue || 0),
            walletBalance: Number(wallet?.balance || 0),
            commissionRate: legalType === 'ENTERPRISE' ? 3.5 : 5.0,
            joinDate: new Date(s.created_at).toLocaleDateString('vi-VN'),
            partnerCategory: 'seller',
            activeModules: ['orders', 'pim', 'marketing']
          };
        });

        // Merge supabase records with mocks (deduplicating by ID)
        const combined = [...mapped, ...COMPREHENSIVE_MOCK_SELLERS.filter(m => !mapped.some(db => db.id === m.id))];
        setSellers(combined);
      }
    } catch (err) {
      console.warn("Using local comprehensive seller repository:", err);
      setSellers(COMPREHENSIVE_MOCK_SELLERS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDbSellers();
  }, []);

  // Filtered sellers list
  const filteredSellers = useMemo(() => {
    return sellers.filter(s => {
      // Status Filter
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      // Legal Type Filter
      if (legalTypeFilter !== 'all' && s.legalType !== legalTypeFilter) return false;

      // VNeID Filter
      if (vneidFilter === 'verified' && s.vneid.level !== 2) return false;
      if (vneidFilter === 'pending' && s.vneid.level === 2) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.shopName.toLowerCase().includes(q);
        const matchRep = s.representativeName.toLowerCase().includes(q);
        const matchTax = s.tax.taxCode.toLowerCase().includes(q);
        const matchCccd = s.vneid.citizenId.toLowerCase().includes(q);
        const matchId = s.id.toLowerCase().includes(q);
        if (!matchName && !matchRep && !matchTax && !matchCccd && !matchId) return false;
      }

      return true;
    });
  }, [sellers, statusFilter, legalTypeFilter, vneidFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = sellers.length;
    const pending = sellers.filter(s => s.status === 'pending').length;
    const active = sellers.filter(s => s.status === 'active').length;
    const vneidLevel2Count = sellers.filter(s => s.vneid.level === 2).length;
    const vneidPercentage = total > 0 ? Math.round((vneidLevel2Count / total) * 100) : 0;

    const countIndividual = sellers.filter(s => s.legalType === 'INDIVIDUAL').length;
    const countHousehold = sellers.filter(s => s.legalType === 'HOUSEHOLD').length;
    const countEnterprise = sellers.filter(s => s.legalType === 'ENTERPRISE').length;

    const totalGmv = sellers.reduce((acc, curr) => acc + (curr.gmv || 0), 0);

    return {
      total,
      pending,
      active,
      vneidPercentage,
      countIndividual,
      countHousehold,
      countEnterprise,
      totalGmv
    };
  }, [sellers]);

  // Approve action
  const handleApprove = async (sellerId: string, commissionRate: number, customNotes: string) => {
    try {
      await supabase
        .from('sellers')
        .update({ status: 'APPROVED' })
        .eq('id', sellerId);

      await supabase
        .from('seller_taxes')
        .update({ tax_status: 'VERIFIED' })
        .eq('seller_id', sellerId);
    } catch (err) {
      console.warn('Updated in local memory mode:', err);
    }

    setSellers(prev => prev.map(s => {
      if (s.id === sellerId) {
        return {
          ...s,
          status: 'active',
          commissionRate,
          reviewedBy: 'Quản trị viên Compliance VComm',
          reviewedAt: new Date().toLocaleString('vi-VN')
        };
      }
      return s;
    }));

    alert(`✅ Đã phê duyệt và kích hoạt gian hàng ${sellerId} thành công! Hoa hồng: ${commissionRate}%.`);
  };

  // Reject action
  const handleReject = async (sellerId: string, reason: string) => {
    try {
      await supabase
        .from('sellers')
        .update({ status: 'SUSPENDED' })
        .eq('id', sellerId);
    } catch (err) {
      console.warn('Updated in local memory mode:', err);
    }

    setSellers(prev => prev.map(s => {
      if (s.id === sellerId) {
        return {
          ...s,
          status: 'suspended',
          rejectionReason: reason
        };
      }
      return s;
    }));

    alert(`⚠️ Đã từ chối hồ sơ ${sellerId}. Lý do đã được gửi tới người bán.`);
  };

  // Request changes action
  const handleRequestChanges = async (sellerId: string, requestNotes: string) => {
    alert(`✉️ Đã gửi thông báo yêu cầu bổ sung chứng từ tới Nhà bán hàng ${sellerId}:\n"${requestNotes}"`);
  };

  // Toggle lock / unlock
  const handleToggleLock = async (sellerId: string) => {
    const target = sellers.find(s => s.id === sellerId);
    if (!target) return;

    const nextStatus: ApprovalStatus = target.status === 'suspended' ? 'active' : 'suspended';
    try {
      await supabase
        .from('sellers')
        .update({ status: nextStatus === 'active' ? 'APPROVED' : 'SUSPENDED' })
        .eq('id', sellerId);
    } catch (e) {
      console.warn(e);
    }

    setSellers(prev => prev.map(s => s.id === sellerId ? { ...s, status: nextStatus } : s));
  };

  // Adjust balance
  const submitAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingSeller || !adjustAmount) return;

    const delta = Number(adjustAmount);
    setSellers(prev => prev.map(s => {
      if (s.id === adjustingSeller.id) {
        return { ...s, walletBalance: (s.walletBalance || 0) + delta };
      }
      return s;
    }));

    try {
      await supabase
        .from('seller_wallets')
        .update({ balance: (adjustingSeller.walletBalance || 0) + delta })
        .eq('seller_id', adjustingSeller.id);
    } catch (e) {
      console.warn(e);
    }

    alert(`Đã điều chỉnh ví của ${adjustingSeller.shopName}: ${delta > 0 ? '+' : ''}${formatCurrency(delta)}`);
    setAdjustingSeller(null);
    setAdjustAmount('');
  };

  // Export CSV of Sellers
  const handleExportCsv = () => {
    const headers = ['Mã Shop', 'Tên Gian Hàng', 'Loại Hình', 'Người Đại Diện', 'CCCD/VNeID', 'Mã Số Thuế', 'Thuế GTGT (%)', 'Thuế TNCN (%)', 'Trạng Thái', 'Hoa Hồng (%)', 'GMV'];
    const rows = filteredSellers.map(s => [
      s.id,
      `"${s.shopName}"`,
      s.legalType,
      `"${s.representativeName}"`,
      `"${s.vneid.citizenId}"`,
      `"${s.tax.taxCode}"`,
      s.tax.vatRate,
      s.tax.pitRate,
      s.status,
      s.commissionRate,
      s.gmv
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VComm_Sellers_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compact Ribbon items
  const ribbonItems: MetricRibbonItem[] = [
    {
      id: 'pending',
      icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
      label: 'Chờ thẩm định',
      value: stats.pending,
      subText: `SLA ${slaHours}h`,
      colorVariant: 'amber',
      isActive: statusFilter === 'pending',
      onClick: () => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending'),
      badge: stats.pending > 0 ? `${stats.pending} mới` : undefined
    },
    {
      id: 'vneid',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />,
      label: 'VNeID Mức 2',
      value: `${stats.vneidPercentage}%`,
      subText: 'Đã xác thực',
      colorVariant: 'emerald',
      isActive: vneidFilter === 'verified',
      onClick: () => setVneidFilter(vneidFilter === 'verified' ? 'all' : 'verified')
    },
    {
      id: 'legal_types',
      icon: <Building className="w-3.5 h-3.5 text-purple-500" />,
      label: 'Phân bổ pháp lý',
      value: `${stats.countIndividual} Cá nhân • ${stats.countHousehold} Hộ KD • ${stats.countEnterprise} DN`,
      colorVariant: 'purple'
    },
    {
      id: 'gmv',
      icon: <Percent className="w-3.5 h-3.5 text-blue-500" />,
      label: 'Doanh số GMV',
      value: formatCurrency(stats.totalGmv),
      colorVariant: 'blue'
    }
  ];

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
      
      {/* Compact Header (Single Line ~46px) */}
      <CompactPageHeader
        icon={<Store className="w-4 h-4 text-blue-600" />}
        title="Thẩm Định & Quản Lý Nhà Bán Hàng"
        badge={{ text: 'Cổng Đăng Ký Tập Trung', variant: 'blue' }}
        description="Hệ thống thẩm định định danh điện tử VNeID Mức 2 (Bộ Công An), đối soát cơ sở dữ liệu Tổng cục Thuế, phân loại pháp lý Cá nhân kinh doanh / Hộ kinh doanh / Doanh nghiệp và tự động áp dụng biểu thuế suất theo quy định TMĐT. Tuyệt đối không tạo thủ công."
        actions={
          <>
            <button 
              onClick={fetchDbSellers}
              disabled={isLoading}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Làm mới dữ liệu từ Cổng Seller"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-blue-600")} />
            </button>

            <button 
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Xuất Báo Cáo</span>
            </button>

            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <Settings2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{showConfig ? 'Quay Lại' : 'Cấu Hình Sàn'}</span>
            </button>
          </>
        }
      />

      {/* Main Content Area */}
      {showConfig ? (
        /* Configuration Panel */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Cấu Hình Quy Trình Phê Duyệt & Chính Sách Nhà Bán Hàng
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập các tiêu chuẩn thẩm định bắt buộc áp dụng trên toàn hệ thống sàn TMĐT VComm.
              </p>
            </div>
            <button 
              onClick={() => setShowConfig(false)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 cursor-pointer"
            >
              Đóng cấu hình
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Box 1: KYC & Identity Policies */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Tiêu chuẩn Định danh & Hồ sơ Pháp lý
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-800 block">Bắt buộc Xác thực VNeID Cấp độ 2</label>
                    <span className="text-slate-500 text-[11px]">Yêu cầu người đại diện quét QR VNeID hoặc xác thực CCCD gắn chip.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={requireVneidLevel2} 
                    onChange={e => setRequireVneidLevel2(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer" 
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-800 block">Bắt buộc Mã số thuế còn hoạt động</label>
                    <span className="text-slate-500 text-[11px]">Tự động đối soát trạng thái MST từ Cổng Tổng cục Thuế.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={sellerRequireTaxId} 
                    onChange={e => setSellerRequireTaxId(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer" 
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-800 block">Bắt buộc Giấy phép ĐKKD (Hộ KD & Doanh nghiệp)</label>
                    <span className="text-slate-500 text-[11px]">Chặn kích hoạt nếu chưa nộp bản scan ĐKKD / ERC hợp lệ.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={sellerRequireLicense} 
                    onChange={e => setSellerRequireLicense(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            {/* Box 2: Commission & Operational SLA */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-600" /> Biểu Phí Sàn & Cam Kết Vận Hành (SLA)
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Mức Phí Hoa Hồng Sàn Mặc Định Khi Duyệt (%)
                  </label>
                  <input 
                    type="number" 
                    value={defaultCommission}
                    onChange={e => setDefaultCommission(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Có thể điều chỉnh linh hoạt cho từng shop trong lúc thẩm định.</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Thời Gian Cam Kết Duyệt Hồ Sơ SLA (Giờ)
                  </label>
                  <input 
                    type="number" 
                    value={slaHours}
                    onChange={e => setSlaHours(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Hệ thống gửi cảnh báo nếu hồ sơ pending quá thời hạn cam kết.</span>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                alert('✅ Đã lưu cấu hình chính sách thẩm định Nhà bán hàng VComm thành công!');
                setShowConfig(false);
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              Lưu Thiết Lập
            </button>
          </div>
        </div>
      ) : (
        /* Regular Management View */
        <>
          {/* Compact Metric Ribbon (~42px) */}
          <CompactStatsRibbon
            items={ribbonItems}
            collapsible={true}
            storageKey="sellers_ribbon"
          />

          {/* Filter & Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            
            {/* Search & Pipeline Filters Bar */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
              
              {/* Search Box */}
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên Shop, Người đại diện, MST, CCCD..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Legal Type Dropdown Filter */}
                <select
                  value={legalTypeFilter}
                  onChange={e => setLegalTypeFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="all">Tất cả loại hình pháp lý</option>
                  <option value="INDIVIDUAL">Cá nhân kinh doanh</option>
                  <option value="HOUSEHOLD">Hộ kinh doanh</option>
                  <option value="ENTERPRISE">Doanh nghiệp (Công ty)</option>
                </select>

                {/* VNeID Dropdown Filter */}
                <select
                  value={vneidFilter}
                  onChange={e => setVneidFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="all">Tất cả định danh</option>
                  <option value="verified">Đã xác thực VNeID Mức 2</option>
                  <option value="pending">Chờ đối soát VNeID</option>
                </select>
              </div>

              {/* Status Segmented Control */}
              <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white p-1 shadow-2xs">
                <button 
                  onClick={() => setStatusFilter('all')}
                  className={cn(
                    "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    statusFilter === 'all' ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Tất cả ({sellers.length})
                </button>

                <button 
                  onClick={() => setStatusFilter('pending')}
                  className={cn(
                    "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                    statusFilter === 'pending' ? "bg-amber-500 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <span>Chờ duyệt</span>
                  {stats.pending > 0 && (
                    <span className={cn("px-1.5 py-0.2 rounded-full text-[10px] font-black", statusFilter === 'pending' ? "bg-white text-amber-600" : "bg-amber-100 text-amber-700")}>
                      {stats.pending}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => setStatusFilter('active')}
                  className={cn(
                    "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    statusFilter === 'active' ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Hoạt động ({stats.active})
                </button>

                <button 
                  onClick={() => setStatusFilter('suspended')}
                  className={cn(
                    "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    statusFilter === 'suspended' ? "bg-rose-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Tạm khóa ({sellers.filter(s => s.status === 'suspended').length})
                </button>
              </div>

            </div>

            {/* Table */}
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Hồ Sơ Gian Hàng & Pháp Lý</th>
                    <th className="px-6 py-3.5">Xác Thực VNeID & Thuế</th>
                    <th className="px-6 py-3.5">Cơ Chế Thuế Suất</th>
                    <th className="px-6 py-3.5 text-right">GMV / Ví Sàn</th>
                    <th className="px-6 py-3.5 text-center">Trạng Thái</th>
                    <th className="px-6 py-3.5 text-center">Hành Động Thẩm Định</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredSellers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold">Không tìm thấy nhà bán hàng nào phù hợp với bộ lọc.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSellers.map(seller => (
                      <tr key={seller.id} className="hover:bg-slate-50/80 transition-colors group">
                        
                        {/* Shop & Legal Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-2xs",
                              seller.legalType === 'ENTERPRISE' ? "bg-purple-50 text-purple-700 border-purple-200" :
                              seller.legalType === 'HOUSEHOLD' ? "bg-teal-50 text-teal-700 border-teal-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            )}>
                              {seller.legalType === 'ENTERPRISE' ? <Building className="w-5 h-5" /> :
                               seller.legalType === 'HOUSEHOLD' ? <Store className="w-5 h-5" /> :
                               <User className="w-5 h-5" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span 
                                  onClick={() => setViewingSeller(seller)}
                                  className="font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer text-sm"
                                >
                                  {seller.shopName}
                                </span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                                  seller.legalType === 'ENTERPRISE' ? "bg-purple-50 text-purple-700 border-purple-200" :
                                  seller.legalType === 'HOUSEHOLD' ? "bg-teal-50 text-teal-700 border-teal-200" :
                                  "bg-blue-50 text-blue-700 border-blue-200"
                                )}>
                                  {seller.legalType === 'ENTERPRISE' ? 'Doanh nghiệp' :
                                   seller.legalType === 'HOUSEHOLD' ? 'Hộ KD' :
                                   'Cá nhân KD'}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>Đại diện: <b className="text-slate-700 font-semibold">{seller.representativeName}</b></span>
                                <span>•</span>
                                <span className="font-mono text-slate-400">{seller.id}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* VNeID & Tax Check */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {seller.vneid.level === 2 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  VNeID Mức 2
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                  Chờ định danh
                                </span>
                              )}
                              <span className="font-mono text-slate-600 text-[11px]">{seller.vneid.citizenId}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                              <span>MST: <b className="text-slate-800 select-all">{seller.tax.taxCode}</b></span>
                              <span className="text-emerald-600 text-[10px] font-semibold">(GDT Active)</span>
                            </div>
                          </div>
                        </td>

                        {/* Tax Rate Policy */}
                        <td className="px-6 py-4">
                          {seller.legalType === 'ENTERPRISE' ? (
                            <div>
                              <span className="font-bold text-slate-800 text-[11px] block">DN Tự xuất hóa đơn</span>
                              <span className="text-[10px] text-slate-500">VAT 8% - 10% • Sàn thu phí dịch vụ</span>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded text-[10px] border border-blue-200">
                                  GTGT: {seller.tax.vatRate}%
                                </span>
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px] border border-indigo-200">
                                  TNCN: {seller.tax.pitRate}%
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">Sàn khấu trừ tại nguồn (TT40)</span>
                            </div>
                          )}
                        </td>

                        {/* GMV & Wallet */}
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-slate-900">{formatCurrency(seller.gmv)}</p>
                          <p className="text-[11px] font-bold text-emerald-600">
                            {formatCurrency(seller.walletBalance)} <span className="text-[9px] font-medium text-slate-400">Ví</span>
                          </p>
                          <p className="text-[10px] text-blue-600 font-medium">Hoa hồng: {seller.commissionRate}%</p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                            seller.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            seller.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" :
                            "bg-rose-50 text-rose-700 border-rose-200"
                          )}>
                            {seller.status === 'active' ? 'Đã duyệt' :
                             seller.status === 'pending' ? 'Chờ thẩm định' :
                             'Tạm khóa'}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {seller.status === 'pending' ? (
                              <button
                                onClick={() => setApprovingSeller(seller)}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Thẩm định hồ sơ
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => setViewingSeller(seller)}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                                  title="Xem hồ sơ pháp lý & Thuế"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => setAdjustingSeller(seller)}
                                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors"
                                  title="Điều chỉnh số dư ví"
                                >
                                  <Wallet className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleToggleLock(seller.id)}
                                  className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    seller.status === 'suspended'
                                      ? "bg-amber-50 hover:bg-amber-100 text-amber-700"
                                      : "bg-rose-50 hover:bg-rose-100 text-rose-700"
                                  )}
                                  title={seller.status === 'suspended' ? 'Mở khóa gian hàng' : 'Tạm khóa gian hàng'}
                                >
                                  {seller.status === 'suspended' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </>
      )}

      {/* Side-by-Side Approval Modal */}
      {approvingSeller && (
        <SellerApprovalModal
          seller={approvingSeller}
          onClose={() => setApprovingSeller(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestChanges={handleRequestChanges}
        />
      )}

      {/* Seller Detail Modal */}
      {viewingSeller && (
        <SellerDetailModal
          seller={viewingSeller}
          onClose={() => setViewingSeller(null)}
          onToggleLock={handleToggleLock}
          onAdjustWallet={s => {
            setViewingSeller(null);
            setAdjustingSeller(s);
          }}
        />
      )}

      {/* Wallet Adjustment Modal */}
      {adjustingSeller && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Điều Chỉnh Ví Tiền Nhà Bán Hàng</h3>
                <p className="text-xs text-slate-500">{adjustingSeller.shopName}</p>
              </div>
              <button onClick={() => setAdjustingSeller(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitAdjustBalance} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Số dư ví khả dụng hiện tại</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {formatCurrency(adjustingSeller.walletBalance || 0)}
                </span>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1.5">Số tiền cần cộng (+) hoặc trừ (-)</label>
                <input 
                  type="number"
                  required
                  placeholder="VD: 500000 hoặc -200000"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Dùng số âm để thu hồi/trừ phí phạt; số dương để nạp/giải ngân.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setAdjustingSeller(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer transition-all"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
