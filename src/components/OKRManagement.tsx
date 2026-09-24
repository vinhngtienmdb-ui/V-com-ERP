import React, { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Clock,
  ArrowRight,
  User,
  Building2,
  X
} from 'lucide-react';

interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number; // % trọng số
  owner: string;
  confidenceScore: 'high' | 'medium' | 'low';
}

interface ObjectiveItem {
  id: string;
  title: string;
  level: 'company' | 'department' | 'team';
  department: string;
  leadOwner: string;
  leadAvatar: string;
  quarter: string;
  progress: number;
  status: 'on_track' | 'at_risk' | 'lagging' | 'completed';
  keyResults: KeyResult[];
  lastCheckin: string;
}

export const OKRManagement: React.FC = () => {
  const [activeLevelFilter, setActiveLevelFilter] = useState<'ALL' | 'company' | 'department' | 'team'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const defaultInitialObjectives: ObjectiveItem[] = [
    {
      id: 'OKR-2026-C01',
      title: 'Bứt phá Tăng trưởng Tổng Doanh thu GMV Đạt 120 Tỷ VNĐ trong Quý 3/2026',
      level: 'company',
      department: 'Toàn sàn VComm',
      leadOwner: 'Nguyễn Văn An (CEO)',
      leadAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      quarter: 'Quý 3 - 2026',
      progress: 78.5,
      status: 'on_track',
      lastCheckin: '16/09/2026',
      keyResults: [
        { id: 'KR-1.1', title: 'Đạt GMV thương mại điện tử 120 tỷ VNĐ qua các đợt Mega Sale', targetValue: 120, currentValue: 94.2, unit: 'Tỷ VNĐ', weight: 40, owner: 'Khối Kinh Doanh', confidenceScore: 'high' },
        { id: 'KR-1.2', title: 'Thu hút thêm 1.500 Nhà Bán Hàng (Seller) uy tín mới mở gian hàng', targetValue: 1500, currentValue: 1240, unit: 'Shop', weight: 30, owner: 'Khối Phát triển Thị trường', confidenceScore: 'high' },
        { id: 'KR-1.3', title: 'Tỷ lệ khách hàng mua lặp lại (Retention rate) đạt trên 35%', targetValue: 35, currentValue: 29.8, unit: '%', weight: 30, owner: 'Khối Marketing & Loyalty', confidenceScore: 'medium' }
      ]
    },
    {
      id: 'OKR-2026-D01',
      title: 'Tối ưu Hóa Hệ thống Multi-WMS & Giảm Thời gian Xử lý Đơn hàng Dưới 4 Giờ',
      level: 'department',
      department: 'Chuỗi Cung Ứng & Kho Vận',
      leadOwner: 'Vũ Đức Thịnh (Logistics Director)',
      leadAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      quarter: 'Quý 3 - 2026',
      progress: 84.0,
      status: 'on_track',
      lastCheckin: '15/09/2026',
      keyResults: [
        { id: 'KR-2.1', title: 'Đạt tỷ lệ giao hàng đúng hẹn SLA 99.2% qua Smart Order Routing', targetValue: 99.2, currentValue: 98.8, unit: '%', weight: 40, owner: 'Đội Điều phối Vận chuyển', confidenceScore: 'high' },
        { id: 'KR-2.2', title: 'Áp dụng trạm đóng gói Scan-to-Verify giảm tỷ lệ nhầm hàng về 0.01%', targetValue: 0.01, currentValue: 0.02, unit: '%', weight: 35, owner: 'Quản lý Kho Tổng Hà Nội', confidenceScore: 'high' },
        { id: 'KR-2.3', title: 'Tối ưu chi phí bao bì đóng gói thân thiện môi trường tiết kiệm 15%', targetValue: 15, currentValue: 12.5, unit: '%', weight: 25, owner: 'Phòng Thu mua (SCM)', confidenceScore: 'medium' }
      ]
    },
    {
      id: 'OKR-2026-D02',
      title: 'Chuyển Đổi Số Toàn Diện Chứng Từ Kế Toán Chuẩn Thông Tư 99/2025/TT-BTC',
      level: 'department',
      department: 'Tài Chính - Kế Toán',
      leadOwner: 'Phạm Quỳnh Nga (CPA Kế Toán Trưởng)',
      leadAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      quarter: 'Quý 3 - 2026',
      progress: 92.0,
      status: 'completed',
      lastCheckin: '14/09/2026',
      keyResults: [
        { id: 'KR-3.1', title: 'Hoàn thiện 100% biểu mẫu BCTC B01-DN, B02-DN, B03-DN chuẩn TT99', targetValue: 100, currentValue: 100, unit: '%', weight: 50, owner: 'Tổ Kế toán Tổng hợp', confidenceScore: 'high' },
        { id: 'KR-3.2', title: 'Đồng bộ tự động 100% khấu trừ thuế sàn TMĐT NĐ 126 và VComm Invoice', targetValue: 100, currentValue: 94, unit: '%', weight: 50, owner: 'Tổ Thuế & Hóa đơn', confidenceScore: 'high' }
      ]
    },
    {
      id: 'OKR-2026-T01',
      title: 'Tăng Tốc Độ Tải Trang Web Bán Hàng (Storefront) Dưới 0.8 Giây & 99.9% Uptime',
      level: 'team',
      department: 'Công Nghệ & Kỹ Thuật (R&D)',
      leadOwner: 'Lê Hoàng Minh (Tech Lead)',
      leadAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      quarter: 'Quý 3 - 2026',
      progress: 65.0,
      status: 'at_risk',
      lastCheckin: '16/09/2026',
      keyResults: [
        { id: 'KR-4.1', title: 'Điểm Google Lighthouse Core Web Vitals đạt trên 95/100', targetValue: 95, currentValue: 88, unit: 'Điểm', weight: 50, owner: 'Frontend Team', confidenceScore: 'medium' },
        { id: 'KR-4.2', title: 'Tối ưu API Gateway & Redis Cache chịu tải 25.000 req/giây', targetValue: 25000, currentValue: 18000, unit: 'RPS', weight: 50, owner: 'DevOps Team', confidenceScore: 'low' }
      ]
    }
  ];

  const loadInitialOkrs = (): ObjectiveItem[] => {
    try {
      const saved = localStorage.getItem('vcomm_okrs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return defaultInitialObjectives;
  };

  const [objectives, setObjectives] = useState<ObjectiveItem[]>(loadInitialOkrs);

  useEffect(() => {
    if (!localStorage.getItem('vcomm_okrs')) {
      try {
        localStorage.setItem('vcomm_okrs', JSON.stringify(defaultInitialObjectives));
      } catch (e) {}
    }

    const handleSync = (e: any) => {
      if (e.detail) {
        setObjectives(e.detail);
      } else {
        setObjectives(loadInitialOkrs());
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('vcomm_okr_synced', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('vcomm_okr_synced', handleSync);
    };
  }, []);

  const handleSyncToPerformance = () => {
    try {
      localStorage.setItem('vcomm_okrs', JSON.stringify(objectives));
      window.dispatchEvent(new CustomEvent('vcomm_okr_synced', { detail: objectives }));
      showToast(`Đã đồng bộ thành công ${objectives.length} Mục tiêu OKRs sang Đánh giá Hiệu suất (Performance)!`);
    } catch (e) {
      console.error('Failed to sync OKRs:', e);
    }
  };

  const filteredObjectives = objectives.filter(obj => {
    const matchesLevel = activeLevelFilter === 'ALL' || obj.level === activeLevelFilter;
    const matchesSearch = obj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          obj.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          obj.leadOwner.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const getStatusBadge = (status: ObjectiveItem['status']) => {
    switch (status) {
      case 'on_track':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3 text-emerald-600" />Đang đúng tiến độ</span>;
      case 'at_risk':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full"><AlertCircle className="w-3 h-3 text-amber-600" />Cần can thiệp</span>;
      case 'lagging':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded-full"><AlertCircle className="w-3 h-3 text-rose-600" />Chậm tiến độ</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full"><Award className="w-3 h-3 text-blue-600" />Đã hoàn thành</span>;
    }
  };

  const getLevelBadge = (level: ObjectiveItem['level']) => {
    switch (level) {
      case 'company':
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60">Cấp Toàn Công Ty</span>;
      case 'department':
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">Cấp Khối / Phòng</span>;
      case 'team':
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">Cấp Nhóm Dự Án</span>;
    }
  };

  const avgProgress = Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length);
  const totalKRs = objectives.reduce((s, o) => s + o.keyResults.length, 0);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-100">
                Strategic Management
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Chiến lược Q3-Q4 2026</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              Quản Trị Mục Tiêu Chiến Lược (OKRs)
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-semibold border border-cyan-200/60">
                John Doerr Standard
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Liên kết mục tiêu từ Cấp công ty đến Phòng ban và Kết quả then chốt (Key Results) định lượng.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncToPerformance}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs active:scale-95"
            title="Đồng bộ toàn bộ OKRs và Key Results sang Đánh giá Hiệu suất (Performance)"
          >
            <Award className="w-3.5 h-3.5 text-indigo-200" />
            Đồng bộ sang Hiệu suất
          </button>
          <button
            onClick={() => showToast('Đang tạo báo cáo tổng hợp tiến độ OKRs tháng 09...')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs active:scale-95"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Lịch sử Check-in
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Thiết lập OKR mới
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Tiến độ thực thi trung bình</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{avgProgress}%</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              Vượt kỳ vọng (+4.2%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Tổng số Mục tiêu (Objectives)</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{objectives.length}</span>
            <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
              3 Cấp liên kết
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">1 Công ty • 2 Phòng ban • 1 Nhóm</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Kết quả then chốt (Key Results)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{totalKRs}</span>
            <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
              100% Định lượng
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Định kỳ check-in 2 tuần / lần</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Độ tự tin hoàn thành</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">8.6 / 10</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              High Confidence
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">3/4 OKRs đạt nhịp độ cam kết</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Level Switcher */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveLevelFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeLevelFilter === 'ALL' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả mục tiêu
          </button>
          <button
            onClick={() => setActiveLevelFilter('company')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeLevelFilter === 'company' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Toàn công ty
          </button>
          <button
            onClick={() => setActiveLevelFilter('department')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeLevelFilter === 'department' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Khối / Phòng ban
          </button>
          <button
            onClick={() => setActiveLevelFilter('team')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeLevelFilter === 'team' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhóm dự án
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề mục tiêu, người chủ trì..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 w-64 md:w-80 transition"
          />
        </div>
      </div>

      {/* OKR Cards List */}
      <div className="space-y-4">
        {filteredObjectives.map(obj => (
          <div
            key={obj.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-6 space-y-5"
          >
            {/* Header of Objective */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  {getLevelBadge(obj.level)}
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {obj.department}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">• {obj.quarter}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-cyan-700 transition cursor-pointer">
                  {obj.title}
                </h3>
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                {getStatusBadge(obj.status)}
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Check-in gần nhất: {obj.lastCheckin}</span>
                </div>
              </div>
            </div>

            {/* Overall Objective Progress Bar */}
            <div className="space-y-1.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <img src={obj.leadAvatar} alt={obj.leadOwner} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                  <span className="text-slate-600 font-medium">Chủ trì: <strong className="text-slate-900">{obj.leadOwner}</strong></span>
                </div>
                <span className="font-bold text-sm text-cyan-700">{obj.progress}% hoàn thành</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${obj.progress}%` }}
                />
              </div>
            </div>

            {/* Key Results Sub-Section */}
            <div className="space-y-2.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Kết quả then chốt định lượng ({obj.keyResults.length} Key Results):
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {obj.keyResults.map(kr => {
                  const krProgress = Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100));
                  return (
                    <div
                      key={kr.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-cyan-300 transition"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-mono text-[10px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                          {kr.id}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          kr.confidenceScore === 'high' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                          kr.confidenceScore === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                          'bg-rose-50 text-rose-700 border-rose-200/60'
                        }`}>
                          Độ tin cậy: {kr.confidenceScore.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed">
                        {kr.title}
                      </p>

                      <div className="flex justify-between items-baseline text-xs pt-1">
                        <span className="text-slate-500 text-[11px]">{kr.owner}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {kr.currentValue} / {kr.targetValue} {kr.unit}
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${krProgress >= 100 ? 'bg-emerald-500' : 'bg-cyan-600'}`}
                          style={{ width: `${krProgress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">{obj.id}</span>
              <button
                onClick={() => {
                  setSelectedObjective(obj);
                  showToast(`Mở phiên check-in cập nhật số liệu cho "${obj.title}"`);
                }}
                className="flex items-center gap-1 text-cyan-700 hover:text-cyan-800 font-bold transition"
              >
                Cập nhật kết quả KRs & Gửi báo cáo tuần
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Create OKR */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-600" />
                Thiết Lập Mục Tiêu OKR Mới
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Tiêu đề Mục tiêu (Objective)</label>
                <input
                  type="text"
                  placeholder="VD: Mở rộng mạng lưới kho vận sang khu vực miền Trung..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Cấp độ mục tiêu</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-cyan-500">
                    <option value="company">Cấp Toàn Công Ty</option>
                    <option value="department">Cấp Khối / Phòng Ban</option>
                    <option value="team">Cấp Nhóm Dự Án</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Kỳ chiến lược</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-cyan-500">
                    <option>Quý 3 - 2026</option>
                    <option>Quý 4 - 2026</option>
                    <option>Năm 2027</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Người chịu trách nhiệm chính (Lead Owner)</label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn An (CEO)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition text-xs shadow-2xs"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  showToast('Đã tạo thành công mục tiêu OKR mới và gửi thông báo tới các Trưởng bộ phận!');
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-95"
              >
                Xác nhận lưu OKR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
