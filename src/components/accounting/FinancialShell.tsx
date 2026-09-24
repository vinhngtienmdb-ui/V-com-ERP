import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  PieChart,
  ShieldCheck,
  FolderTree,
  Sun,
  Moon,
  Plus,
  Settings,
  HelpCircle,
  Receipt,
  TrendingUp,
  FileText,
  Scan,
  Calendar,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
  Receipt
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatMonthVN } from '../../lib/keToan/dateUtils';
import { ThietLapCongTyModal, ThietLapCongTy } from './ThietLapCongTyModal';
import { NhatKyChungPage, MOCK_CHUNG_TU_LIST } from './NhatKyChungPage';
import { BaoCaoTt99Page } from './BaoCaoTt99Page';
import { KiemSoatDieu28Page } from './KiemSoatDieu28Page';
import { HoSoApp } from '../../pages/HoSo/HoSoApp';
import { DoiChieuHoaDonPage } from './DoiChieuHoaDonPage';
import { ChungTuNhatKyChung } from '../../lib/keToan/types';

export type AccountingTab = 's03_nkc' | 'bctc_reports' | 'dieu28_compliance' | 'ho_so_vault' | 'doi_chieu_hd' | 'legacy_invoices' | 'legacy_tax' | 'legacy_credit' | 'legacy_ocr';

interface FinancialShellProps {
  initialTab?: AccountingTab;
  onOpenLegacyInvoice?: () => void;
  onOpenLegacyTax?: () => void;
  onOpenLegacyCredit?: () => void;
}

export const FinancialShell: React.FC<FinancialShellProps> = ({
  initialTab = 's03_nkc',
  onOpenLegacyInvoice,
  onOpenLegacyTax,
  onOpenLegacyCredit
}) => {
  const [activeTab, setActiveTab] = useState<AccountingTab>(initialTab);
  const [vouchers, setVouchers] = useState<ChungTuNhatKyChung[]>(() => {
    try {
      const saved = localStorage.getItem('vcomm_accounting_vouchers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return MOCK_CHUNG_TU_LIST;
  });

  const handleAddVoucher = (newV: ChungTuNhatKyChung) => {
    setVouchers(prev => {
      const next = [newV, ...prev];
      try {
        localStorage.setItem('vcomm_accounting_vouchers', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('vcomm_finance_theme') === 'dark';
  });
  const [isWidescreen, setIsWidescreen] = useState<boolean>(() => {
    return localStorage.getItem('vcomm_finance_widescreen') !== 'false';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompanyConfigOpen, setIsCompanyConfigOpen] = useState(false);
  const [showLegacyMenu, setShowLegacyMenu] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [createTrigger, setCreateTrigger] = useState(0);

  const handleOpenCreateVoucher = () => {
    setActiveTab('s03_nkc');
    setCreateTrigger(Date.now());
  };

  // Lưu theme vào localStorage
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('vcomm_finance_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Mở rộng / Thu gọn không gian làm việc
  const toggleWidescreen = () => {
    setIsWidescreen(prev => {
      const next = !prev;
      localStorage.setItem('vcomm_finance_widescreen', String(next));
      return next;
    });
  };

  // Toàn màn hình trình duyệt (Native Fullscreen)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const containerWidthClass = isWidescreen 
    ? "w-full max-w-[2100px] px-3 sm:px-5 lg:px-7 mx-auto" 
    : "max-w-7xl mx-auto px-4";

  // Keyboard shortcut listener toàn cục không xung đột
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + N hoặc F2: Tạo chứng từ mới
      if ((e.altKey && (e.key === 'n' || e.key === 'N')) || e.key === 'F2') {
        e.preventDefault();
        handleOpenCreateVoucher();
      }
      // F1: Trợ giúp phím tắt
      if (e.key === 'F1') {
        e.preventDefault();
        setShowKeyboardHelp(prev => !prev);
      }
      // Alt + M hoặc Alt + W: Bật/Tắt mở rộng màn hình làm việc
      if (e.altKey && (e.key === 'm' || e.key === 'M' || e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        toggleWidescreen();
      }
      // Số 1..5 với Alt để chuyển nhanh các tab
      if (e.altKey && e.key === '1') { e.preventDefault(); setActiveTab('s03_nkc'); }
      if (e.altKey && e.key === '2') { e.preventDefault(); setActiveTab('bctc_reports'); }
      if (e.altKey && e.key === '3') { e.preventDefault(); setActiveTab('dieu28_compliance'); }
      if (e.altKey && e.key === '4') { e.preventDefault(); setActiveTab('ho_so_vault'); }
      if (e.altKey && e.key === '5') { e.preventDefault(); setActiveTab('doi_chieu_hd'); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Đọc cấu hình công ty đã lưu
  const [companyInfo, setCompanyInfo] = useState<ThietLapCongTy>(() => {
    const saved = localStorage.getItem('vcomm_company_config_tt99');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      tenCongTy: 'CÔNG TY CỔ PHẦN TẬP ĐOÀN VCOMM VIỆT NAM',
      maSoThue: '0109888888',
      coQuanThue: 'Cục Thuế TP. Hà Nội',
      diaChi: 'Tầng 18, Tòa nhà VComm Center, Cầu Giấy, Hà Nội',
      nguoiDaiDien: 'Nguyễn Tiến Vinh',
      keToanTruong: 'Trần Thị Thu Hương',
      thongTuApDung: 'TT99_2025',
      namTaiChinh: 2026,
      kyKeToan: 'THANG',
      phuongPhapKk: 'KKTX',
      linhVucKinhDoanh: ['E_COMMERCE', 'RETAIL', 'SERVICE', 'TECHNOLOGY']
    };
  });

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-200 font-sans pb-16",
      isDarkMode ? "bg-[#0B0F17] text-slate-100" : "bg-[#F8FAFC] text-slate-900"
    )}>
      {/* 1. TOP HEADER - FINANCIAL OS STATUS BAR */}
      <header className={cn(
        "sticky top-0 z-30 border-b px-4 py-2.5 backdrop-blur-md transition-colors",
        isDarkMode ? "bg-[#111827]/90 border-slate-800" : "bg-white/90 border-slate-200/90 shadow-2xs"
      )}>
        <div className={cn(containerWidthClass, "flex flex-wrap items-center justify-between gap-3")}>
          {/* Left: Brand & Company Legal Info */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs",
              "bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500"
            )}>
              <Building2 className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-black uppercase tracking-wide", isDarkMode ? "text-white" : "text-slate-900")}>
                  {companyInfo.tenCongTy}
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] tabular-nums font-bold",
                  isDarkMode ? "bg-blue-950 text-blue-300 border border-blue-800" : "bg-blue-50 text-blue-700 border border-blue-200"
                )}>
                  MST: {companyInfo.maSoThue}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Năm tài chính {companyInfo.namTaiChinh} • Kỳ {formatMonthVN('2026-03')} [ĐANG MỞ]
                </span>
                <span>•</span>
                <span className="font-medium text-slate-400">Chuẩn mực TT99/2025/TT-BTC</span>
              </div>
            </div>
          </div>

          {/* Right: Actions, Theme Switcher & Config */}
          <div className="flex items-center gap-2">
            {/* Keyboard Help trigger */}
            <button
              onClick={() => setShowKeyboardHelp(prev => !prev)}
              className={cn(
                "p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer",
                isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
              title="Xem danh mục phím tắt (F1)"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Phím tắt (F1)</span>
            </button>

            {/* Widescreen / Fluid Toggle */}
            <button
              onClick={toggleWidescreen}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold",
                isDarkMode
                  ? isWidescreen ? "bg-blue-950 text-blue-400 border border-blue-800" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : isWidescreen ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
              title={isWidescreen ? "Thu gọn màn hình về dạng hộp (Alt+M)" : "Mở rộng tối đa không gian làm việc (Toàn chiều rộng - Alt+M)"}
            >
              {isWidescreen ? <Minimize2 className="w-4 h-4 text-blue-500" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden lg:inline text-[11px]">{isWidescreen ? "Thu gọn" : "Mở rộng (Alt+M)"}</span>
            </button>

            {/* Browser Native Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold hidden xl:flex",
                isDarkMode
                  ? isFullscreen ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : isFullscreen ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
              title={isFullscreen ? "Thoát toàn màn hình (Esc)" : "Toàn màn hình trình duyệt (F11)"}
            >
              {isFullscreen ? <Shrink className="w-4 h-4 text-emerald-500" /> : <Expand className="w-4 h-4" />}
              <span className="text-[11px]">{isFullscreen ? "Cửa sổ" : "Toàn cảnh"}</span>
            </button>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold",
                isDarkMode
                  ? "bg-slate-800 text-amber-400 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
              title={isDarkMode ? "Chuyển sang Giao diện Sáng (Light)" : "Chuyển sang Giao diện Tối (Dark Cockpit)"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden md:inline text-[11px]">{isDarkMode ? "Sáng" : "Tối"}</span>
            </button>

            {/* Quick Button: Lập chứng từ mới (Alt+N) */}
            <button
              onClick={handleOpenCreateVoucher}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lập chứng từ (Alt+N)</span>
            </button>

            {/* Button: Cấu hình Doanh nghiệp TT99 */}
            <button
              onClick={() => setIsCompanyConfigOpen(true)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer",
                isDarkMode
                  ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              <Settings className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Cấu hình TT99</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. SUB-NAVIGATION TABS (4 CORE HUBS + UNCLIPPED EXTENSIONS) */}
      <div className={cn(
        "border-b sticky top-[53px] z-20 backdrop-blur-md transition-colors",
        isDarkMode ? "bg-[#0B0F17]/95 border-slate-800/80" : "bg-white/95 border-slate-200/80 shadow-2xs"
      )}>
        <div className={cn(containerWidthClass, "flex items-center justify-between")}>
          <div className="flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0 mr-3">
            {[
              { id: 's03_nkc', label: '1. Nhật ký chung (S03-DN)', sub: 'Bàn phím siêu tốc', icon: BookOpen, hotkey: 'Alt+1' },
              { id: 'bctc_reports', label: '2. Báo cáo & Sổ sách TT99', sub: 'B01, B02, F01, S04', icon: PieChart, hotkey: 'Alt+2' },
              { id: 'dieu28_compliance', label: '3. Kiểm soát Điều 28 & Khóa sổ', sub: 'SHA-256 Chuỗi khối', icon: ShieldCheck, hotkey: 'Alt+3' },
              { id: 'ho_so_vault', label: '4. Hồ sơ – Lưu trữ (NĐ 174)', sub: '18 Phần lưu trữ', icon: FolderTree, hotkey: 'Alt+4' },
              { id: 'doi_chieu_hd', label: '5. Hóa đơn XML & Đối chiếu (TCT)', sub: 'Thuế & Email tự động', icon: Receipt, hotkey: 'Alt+5' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AccountingTab)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                  activeTab === tab.id
                    ? isDarkMode
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-xs"
                      : "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                    : isDarkMode
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                )}
              >
                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-blue-500" : "text-slate-400")} />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-[10px] font-normal opacity-70">{tab.sub}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Legacy & Extension Dropdown - Positioned outside overflow-x-auto to prevent clipping */}
          <div className="relative shrink-0 flex items-center pl-3 border-l border-slate-200 dark:border-slate-800 py-2">
            <button
              onClick={() => setShowLegacyMenu(prev => !prev)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                isDarkMode ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <span>Tiện ích mở rộng</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showLegacyMenu && (
              <div className={cn(
                "absolute right-0 top-full mt-1.5 w-64 rounded-xl border shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2",
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
              )}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">Pháp lý & Thuế số</div>
                <button
                  onClick={() => { setShowLegacyMenu(false); onOpenLegacyInvoice?.(); }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-blue-500/10 hover:text-blue-600 flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold">Hóa đơn điện tử (NĐ 123)</div>
                    <div className="text-[10px] text-slate-400">VComm Cloud HSM ký số tự động</div>
                  </div>
                </button>
                <button
                  onClick={() => { setShowLegacyMenu(false); onOpenLegacyTax?.(); }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-blue-500/10 hover:text-blue-600 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <div>
                    <div className="font-semibold">Thuế TMĐT & Khấu trừ</div>
                    <div className="text-[10px] text-slate-400">Tờ khai mẫu 01/CNKD NĐ 126</div>
                  </div>
                </button>
                <button
                  onClick={() => { setShowLegacyMenu(false); onOpenLegacyCredit?.(); }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-blue-500/10 hover:text-blue-600 flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-semibold">Kết nối Vay vốn Seller</div>
                    <div className="text-[10px] text-slate-400">Hạn mức tín dụng dựa trên GMV</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <main className={cn(containerWidthClass, "py-3")}>
        {activeTab === 's03_nkc' && (
          <div className={cn("rounded-2xl transition-colors", isDarkMode ? "dark" : "")}>
            <NhatKyChungPage forceCreateTrigger={createTrigger} vouchers={vouchers} onAddVoucher={handleAddVoucher} />
          </div>
        )}

        {activeTab === 'bctc_reports' && (
          <div className={cn("rounded-2xl transition-colors", isDarkMode ? "dark" : "")}>
            <BaoCaoTt99Page companyInfo={companyInfo} />
          </div>
        )}

        {activeTab === 'dieu28_compliance' && (
          <div className={cn("rounded-2xl transition-colors", isDarkMode ? "dark" : "")}>
            <KiemSoatDieu28Page />
          </div>
        )}

        {activeTab === 'ho_so_vault' && (
          <div className={cn("rounded-2xl transition-colors", isDarkMode ? "dark" : "")}>
            <HoSoApp />
          </div>
        )}

        {activeTab === 'doi_chieu_hd' && (
          <div className={cn("rounded-2xl transition-colors", isDarkMode ? "dark" : "")}>
            <DoiChieuHoaDonPage vouchers={vouchers} onAddVoucher={handleAddVoucher} companyInfo={companyInfo} />
          </div>
        )}
      </main>

      {/* 4. FIXED BOTTOM DOCK - KEYBOARD SHORTCUTS BAR */}
      <footer className={cn(
        "fixed bottom-0 left-0 right-0 z-30 border-t px-4 py-2 backdrop-blur-md text-xs transition-colors",
        isDarkMode ? "bg-[#0B0F17]/95 border-slate-800 text-slate-400" : "bg-white/95 border-slate-200 text-slate-600 shadow-lg"
      )}>
        <div className={cn(containerWidthClass, "flex flex-wrap items-center justify-between gap-2 text-[11px]")}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Phím tắt ERP Speed:</span>
            <span className="inline-flex items-center gap-1 font-bold bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600">
              Alt+N
            </span>
            <span className="text-slate-500">Tạo mới</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>

            <span className="inline-flex items-center gap-1 font-bold bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600">
              Alt+K
            </span>
            <span className="text-slate-500">Tìm TK (172 TK)</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>

            <span className="inline-flex items-center gap-1 font-bold bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600">
              Alt+D
            </span>
            <span className="text-slate-500">Đối tượng KH/NCC</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>

            <span className="inline-flex items-center gap-1 font-bold bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded text-emerald-600">
              Alt+B
            </span>
            <span className="text-slate-500">Cân đối Nợ/Có</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>

            <span className="inline-flex items-center gap-1 font-bold bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600">
              Ctrl+Enter
            </span>
            <span className="text-slate-500">Lưu nháp</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>

            <span className="inline-flex items-center gap-1 font-bold bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded text-emerald-600">
              Alt+Enter
            </span>
            <span className="text-slate-500">Ghi sổ</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>

            <span className="inline-flex items-center gap-1 font-bold bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded text-purple-600">
              Alt+M
            </span>
            <span className="text-slate-500">{isWidescreen ? "Thu hẹp" : "Mở rộng"}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>

            <span className="inline-flex items-center gap-1 font-bold bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded text-amber-600">
              Alt+5
            </span>
            <span className="text-slate-500">Đối chiếu HĐ</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sẵn sàng kết nối Cloud HSM
            </span>
          </div>
        </div>
      </footer>

      {/* Modal Cấu hình Doanh nghiệp TT99 */}
      {isCompanyConfigOpen && (
        <ThietLapCongTyModal
          isOpen={isCompanyConfigOpen}
          currentConfig={companyInfo}
          onClose={() => setIsCompanyConfigOpen(false)}
          onSaved={(newCfg) => {
            setCompanyInfo(newCfg);
            localStorage.setItem('vcomm_company_config_tt99', JSON.stringify(newCfg));
            setIsCompanyConfigOpen(false);
          }}
        />
      )}

      {/* Modal Hướng dẫn phím tắt (F1) */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className={cn(
            "w-full max-w-lg rounded-2xl border p-5 shadow-2xl space-y-4",
            isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          )}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                Bảng phím tắt Siêu tốc (Speed-Entry Shortcuts)
              </h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-blue-500">Alt + N</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Tạo nhanh chứng từ mới</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-blue-500">Alt + K</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Mở tìm kiếm nhanh 172 tài khoản TT99</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-blue-500">Alt + D</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Chọn đối tượng công nợ (KH / NCC)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-emerald-500">Alt + B</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Tự động điền số tiền cân đối Nợ = Có</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-indigo-500">Ctrl + Enter</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Lưu bản nháp chứng từ</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-emerald-500">Alt + Enter</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Ghi sổ chính thức chứng từ</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-purple-500">Alt + M</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Bật/Tắt mở rộng màn hình làm việc</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-amber-500">Ctrl + Space</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Đảo chiều Nợ ⇄ Có trên dòng định khoản</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-blue-500">Alt + 1..4</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Chuyển nhanh giữa 4 phân hệ chính</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-emerald-500">F11</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Toàn màn hình trình duyệt (Toàn cảnh)</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Đã hiểu (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
