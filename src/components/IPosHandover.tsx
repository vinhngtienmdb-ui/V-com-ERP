import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Clock, 
  Coins, 
  Printer, 
  History, 
  Save, 
  UserCheck, 
  AlertCircle, 
  CheckCircle, 
  Search,
  Filter,
  FileCheck,
  RefreshCw,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { db } from "../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { cn, formatCurrency } from '../lib/utils';

// Standard VND denominations for breakdown
const VND_DENOMINATIONS = [
  { value: 500000, label: "500,000 đ đ" },
  { value: 200000, label: "200,000 đ" },
  { value: 100000, label: "100,000 đ" },
  { value: 50000, label: "50,000 đ" },
  { value: 20000, label: "20,000 đ" },
  { value: 10000, label: "10,000 đ" },
  { value: 5000, label: "5,000 đ" },
  { value: 2000, label: "2,000 đ" },
  { value: 1000, label: "1,000 đ" },
];

interface IPosHandoverProps {
  activeStore: any;
  user: any;
  selectedStaff: any;
  isShiftActive: boolean;
  shiftData: any;
  setIsShiftActive: (active: boolean) => void;
  setShiftData: (data: any) => void;
  setActualCashInput: (cash: string) => void;
  setHandoverNote: (note: string) => void;
  setPrintMode: (mode: "proforma" | "customer_bill" | "kitchen_bill" | "handover") => void;
  setHandoverToPrint: (data: any) => void;
  triggerPrint: () => void;
}

export function IPosHandover({
  activeStore,
  user,
  selectedStaff,
  isShiftActive,
  shiftData,
  setIsShiftActive,
  setShiftData,
  setActualCashInput,
  setHandoverNote,
  setPrintMode,
  setHandoverToPrint,
  triggerPrint,
}: IPosHandoverProps) {
  // Views navigation of handover tab
  const [currentTab, setCurrentTab] = useState<'current_shift' | 'handover_history'>('current_shift');

  // Multi-denomination counting state
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({
    500000: 0,
    200000: 0,
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });

  const [notes, setNotes] = useState("");
  const [openingCashInput, setOpeningCashInput] = useState("2000000");
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);

  // Compute calculated end-cash based on counting breakdown
  const countedCashTotal = Object.entries(denomCounts).reduce(
    (sum, [denom, count]) => sum + parseInt(denom) * count,
    0
  );

  const theoreticalCash = (shiftData?.startCash || 0) + (shiftData?.cashRevenue || 0);
  const cashDiscrepancy = countedCashTotal - theoreticalCash;

  // Retrieve past shift handovers history
  useEffect(() => {
    if (!activeStore) return;
    setHistoryLoading(true);
    const q = query(
      collection(db, "shifts"),
      where("storeId", "==", activeStore.id),
      orderBy("endTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const records: any[] = [];
      snap.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      setHistoryRecords(records);
      setHistoryLoading(false);
    }, (error) => {
      console.error("Error fetching handover history:", error);
      setHistoryLoading(false);
    });

    return () => unsubscribe();
  }, [activeStore]);

  const handleDenomChange = (value: number, countStr: string) => {
    const parsed = parseInt(countStr) || 0;
    setDenomCounts((prev) => ({
      ...prev,
      [value]: parsed >= 0 ? parsed : 0,
    }));
  };

  const handleOpenNewShift = () => {
    const startCashRaw = parseInt(openingCashInput.replace(/\D/g, "")) || 0;
    if (isNaN(startCashRaw) || startCashRaw < 0) {
      alert("Số tiền đầu ca không hợp lệ.");
      return;
    }
    const date = new Date();
    const hours = date.getHours();
    const shiftName = hours < 12 ? "Ca Sáng" : hours < 18 ? "Ca Chiều" : "Ca Tối";
    
    const newShift = {
      shiftName,
      startTime: date.toISOString(),
      startCash: startCashRaw,
      revenue: 0,
      ordersCount: 0,
      cashRevenue: 0,
      qrRevenue: 0,
      posRevenue: 0,
    };

    setShiftData(newShift);
    setIsShiftActive(true);
  };

  const handleCloseAndHandover = async () => {
    const confirmation = window.confirm("Bạn có chắc chắn muốn CHỐT CA và BÀN GIAO này không? Hành động này sẽ đóng ca hiện tại.");
    if (!confirmation) return;

    const handoverRecord = {
      shiftName: shiftData?.shiftName || "Ca Bán Hàng",
      startTime: shiftData?.startTime || new Date().toISOString(),
      endTime: new Date().toISOString(),
      totalRevenue: shiftData?.revenue || 0,
      totalOrders: shiftData?.ordersCount || 0,
      startCash: shiftData?.startCash || 0,
      cashRevenue: shiftData?.cashRevenue || 0,
      qrRevenue: shiftData?.qrRevenue || 0,
      posRevenue: shiftData?.posRevenue || 0,
      expectedCash: theoreticalCash,
      actualCash: countedCashTotal,
      discrepancy: cashDiscrepancy,
      notes: notes,
      denomBreakdown: denomCounts,
      previousStaffName: selectedStaff?.name || user?.displayName || user?.email || "Nhân viên thu ngân",
      staffId: user?.uid || "unknown",
      storeId: activeStore?.id || "",
      companyId: activeStore?.companyId || "",
      status: "closed"
    };

    try {
      // Add record to Firestore database
      await addDoc(collection(db, "shifts"), handoverRecord);

      // Print handover receipt right away
      setHandoverToPrint(handoverRecord);
      setPrintMode("handover");
      
      // Delay slightly for React state synchronization, then call printer
      setTimeout(() => {
        triggerPrint();
      }, 300);

      // Reset parent states
      setActualCashInput(countedCashTotal.toString());
      setHandoverNote(notes);
      setIsShiftActive(false);
      setShiftData(null);
      setNotes("");
      setDenomCounts({
        500000: 0,
        200000: 0,
        100000: 0,
        50000: 0,
        20000: 0,
        10000: 0,
        5000: 0,
        2000: 0,
        1000: 0,
      });

      alert("Bàn giao ca thành công! Phiếu bàn giao đã được gửi in.");
    } catch (err) {
      console.error("Lỗi khi ghi nhận bàn giao ca:", err);
      alert("Đã xảy ra lỗi khi lưu thông tin ca bàn giao.");
    }
  };

  const handlePrintPastHandover = (record: any) => {
    setHandoverToPrint(record);
    setPrintMode("handover");
    setTimeout(() => {
      triggerPrint();
    }, 300);
  };

  const filteredHistory = historyRecords.filter((rec) => {
    const textStr = `${rec.shiftName} ${rec.previousStaffName} ${rec.notes}`.toLowerCase();
    return textStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="col-span-12 flex-1 bg-slate-50 flex flex-col h-full animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="bg-white border-b border-slate-300 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5.5 h-5.5 text-[#2563EB]" /> Quản Lý Bàn Giao Ca (Shift Handover)
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{activeStore?.name}</p>
        </div>

        {/* Tab Controllers */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setCurrentTab('current_shift')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all",
              currentTab === 'current_shift'
                ? "bg-white text-[#2563EB] shadow-sm font-black border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Clock className="w-4 h-4" /> Ca Hiện Tại
          </button>
          <button
            onClick={() => setCurrentTab('handover_history')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all",
              currentTab === 'handover_history'
                ? "bg-white text-[#2563EB] shadow-sm font-black border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <History className="w-4 h-4" /> Lịch Sử Bàn Giao Ca ({filteredHistory.length})
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
        {currentTab === 'current_shift' ? (
          /* Active Handover View */
          !isShiftActive ? (
            /* Shift is inactive, show Start Shift screen */
            <div className="max-w-md mx-auto bg-white border border-slate-300 rounded-2xl shadow-sm p-8 md:p-10 text-center space-y-6 mt-10">
              <div className="w-16 h-16 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-inner">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Mở Ca Làm Việc</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Hiện tại không có ca làm việc nào đang chạy. Vui lòng kiểm tra két đựng tiền và khai báo số dư mặt đầu ca để bắt đầu.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 text-left border border-slate-200">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                  Tiền mặt khai báo đầu ca (VND)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₫</span>
                  <input
                    type="text"
                    value={openingCashInput}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      if (clean) {
                        setOpeningCashInput(new Intl.NumberFormat('vi-VN').format(parseInt(clean)));
                      } else {
                        setOpeningCashInput("");
                      }
                    }}
                    className="w-full bg-transparent pl-8 border-b border-slate-300 focus:border-[#2563EB] py-2 text-xl font-black text-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleOpenNewShift}
                className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-100 active:scale-95 duration-200"
              >
                Khai báo và Bắt đầu ca
              </button>
            </div>
          ) : (
            /* Shift is ACTIVE, show full Handover Workflow */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Denomination Breakdown Form (Columns: 7/12) */}
              <div className="lg:col-span-7 bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-black text-slate-900 uppercase">Kê khai mệnh giá tiền mặt</h3>
                  </div>
                  <span className="text-xs text-slate-700 bg-slate-150 px-2.5 py-1 rounded-md font-bold">
                    Tổng kê khai: {formatCurrency(countedCashTotal)}
                  </span>
                </div>

                <div className="p-5 space-y-3 Divide-y divide-slate-100 overflow-y-auto max-h-[500px] custom-scrollbar">
                  <div className="grid grid-cols-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider pb-2 border-b border-slate-100 mb-2">
                    <span>Mệnh giá</span>
                    <span className="text-center">Số tờ/Số lượng</span>
                    <span className="text-right">Thành tiền</span>
                  </div>

                  {VND_DENOMINATIONS.map((denom) => {
                    const count = denomCounts[denom.value] || 0;
                    const subtotal = denom.value * count;
                    return (
                      <div key={denom.value} className="grid grid-cols-3 pt-3 pb-1 items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500 shrink-0"></div>
                          <span className="text-sm font-bold text-slate-800">{denom.label}</span>
                        </div>
                        <div className="mx-auto select-none w-28 flex items-center border border-slate-300 rounded-lg bg-slate-50 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleDenomChange(denom.value, (count - 1).toString())}
                            className="p-1 px-2 hover:bg-slate-200 text-slate-600 border-r border-slate-200 transition-colors rounded-l-lg font-black"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={count || ""}
                            onChange={(e) => handleDenomChange(denom.value, e.target.value)}
                            className="bg-transparent text-center text-sm font-bold text-slate-900 w-full focus:outline-none placeholder:text-slate-400 py-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleDenomChange(denom.value, (count + 1).toString())}
                            className="p-1 px-2 hover:bg-slate-200 text-slate-600 border-l border-slate-200 transition-colors rounded-r-lg font-black"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-right text-sm font-bold text-[#111827]">{formatCurrency(subtotal)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Additional Comments */}
                <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                    Ghi chú / Lý do chênh lệch bàn giao
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Giải trình lý do lệch quỹ tiền mặt (phục vụ đối soát kế toán)..."
                    className="w-full text-xs text-slate-800 px-3 py-2 bg-white border border-slate-300 focus:border-[#2563EB] rounded-lg outline-none transition-all resize-none shadow-inner"
                  />
                </div>
              </div>

              {/* Right Column: Comparative System Numbers & Trigger (Columns: 5/12) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 1. Shift Meta Info Card */}
                <div className="bg-white border border-slate-300 rounded-2xl shadow-sm p-5 space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-3">
                    <UserCheck className="w-4 h-4 text-[#2563EB]" /> Thông tin ca trực
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500 font-bold">Thu ngân bàn giao</p>
                      <p className="font-black text-slate-800 mt-0.5">{selectedStaff?.name || user?.displayName || user?.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold">Ký hiệu ca</p>
                      <p className="font-black text-[#2563EB] mt-0.5">{shiftData?.shiftName || "Ca trực"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold">Bắt đầu lúc</p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {shiftData?.startTime ? new Date(shiftData.startTime).toLocaleTimeString("vi-VN") : "N/A"} - {shiftData?.startTime ? new Date(shiftData.startTime).toLocaleDateString("vi-VN") : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold">Số lượng hóa đơn</p>
                      <p className="font-bold text-slate-800 mt-0.5">{shiftData?.ordersCount || 0} hóa đơn</p>
                    </div>
                  </div>
                </div>

                {/* 2. System and Reality comparison */}
                <div className="bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" /> Đối soát hệ thống
                    </h3>
                    <span className="text-[10px] px-2.5 py-0.5 font-bold uppercase rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Đo lường tự động
                    </span>
                  </div>

                  <div className="p-5 space-y-3.5 text-xs font-medium">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Tiền mặt khai báo đầu ca</span>
                      <span className="font-bold text-slate-800">{formatCurrency(shiftData?.startCash || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Tiền mặt thu thêm trong ca</span>
                      <span className="font-bold text-slate-800">{formatCurrency(shiftData?.cashRevenue || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-150 mt-1">
                      <span className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Tiền mặt bàn giao lý thuyết</span>
                      <span className="font-black text-slate-900 text-sm">{formatCurrency(theoreticalCash)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-150 mt-1">
                      <span className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Tiền mặt bàn giao thực đếm</span>
                      <span className="font-black text-[#2563EB] text-sm">{formatCurrency(countedCashTotal)}</span>
                    </div>

                    {/* Discrepancy Display */}
                    <div className={cn(
                      "p-4 rounded-xl flex items-center justify-between border mt-3 transition-colors",
                      cashDiscrepancy === 0 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : cashDiscrepancy > 0 
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    )}>
                      <div className="flex items-center gap-2">
                        {cashDiscrepancy === 0 ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : cashDiscrepancy > 0 ? (
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                        <div>
                          <p className="font-black leading-none">Chênh lệch quỹ trực</p>
                          <p className="text-[10px] opacity-80 mt-0.5">
                            {cashDiscrepancy === 0 
                              ? "Cân đối lý tưởng" 
                              : cashDiscrepancy > 0 
                              ? "Thặng dư tiền mặt trong két" 
                              : "Thiếu hụt thất thoát tiền mặt"}
                          </p>
                        </div>
                      </div>
                      <span className="text-base font-black tracking-tight font-mono">
                        {cashDiscrepancy > 0 ? "+" : ""}
                        {formatCurrency(cashDiscrepancy)}
                      </span>
                    </div>

                    {/* QR and POS stats summary for review */}
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Các doanh số thanh toán khác</p>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <p className="text-[10px] text-slate-500">Chuyển khoản QR</p>
                          <p className="font-bold text-slate-800 mt-0.5">{formatCurrency(shiftData?.qrRevenue || 0)}</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <p className="text-[10px] text-slate-500">Quyẹt thẻ POS</p>
                          <p className="font-bold text-slate-800 mt-0.5">{formatCurrency(shiftData?.posRevenue || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Printing option & Closing Confirmation */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const tempRecord = {
                        shiftName: shiftData?.shiftName || "Ca Bán Hàng",
                        startTime: shiftData?.startTime || new Date().toISOString(),
                        endTime: new Date().toISOString(),
                        totalRevenue: shiftData?.revenue || 0,
                        totalOrders: shiftData?.ordersCount || 0,
                        startCash: shiftData?.startCash || 0,
                        cashRevenue: shiftData?.cashRevenue || 0,
                        qrRevenue: shiftData?.qrRevenue || 0,
                        posRevenue: shiftData?.posRevenue || 0,
                        expectedCash: theoreticalCash,
                        actualCash: countedCashTotal,
                        discrepancy: cashDiscrepancy,
                        notes: notes,
                        denomBreakdown: denomCounts,
                        previousStaffName: selectedStaff?.name || user?.displayName || "Nhân viên",
                      };
                      setHandoverToPrint(tempRecord);
                      setPrintMode("handover");
                      setTimeout(() => {
                        triggerPrint();
                      }, 200);
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> In Thử Phiếu Chốt Ca
                  </button>
                  
                  <button
                    onClick={handleCloseAndHandover}
                    className="flex-1 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 text-xs whitespace-nowrap"
                  >
                    <Save className="w-4 h-4" /> Bàn Giao & Chốt Ca
                  </button>
                </div>

              </div>
            </div>
          )
        ) : (
          /* Handover History Tab View */
          <div className="space-y-4">
            
            {/* Filter control bar */}
            <div className="bg-white border border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-center shadow-sm">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo ca, người bàn giao..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  Tổng sổ ca chốt: {filteredHistory.length}
                </span>
              </div>
            </div>

            {/* List and Grid display split */}
            {historyLoading ? (
              <div className="bg-white border border-slate-300 rounded-2xl p-20 text-center text-slate-500">
                <div className="w-8 h-8 rounded-full border-2 border-[#2563EB]/40 border-t-[#2563EB] animate-spin mx-auto mb-3"></div>
                <p className="text-sm font-bold">Đang tải lịch sử bàn giao...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="bg-white border border-slate-300 rounded-2xl p-16 text-center text-slate-500">
                <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-700">Chưa có bản ghi bàn giao ca nào</p>
                <p className="text-xs text-slate-400 mt-1">Các phiên làm sau khi chốt sẽ hiển thị tự động tại đây.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* List of items on Left (col-span-1) */}
                <div className="md:col-span-1 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {filteredHistory.map((rec) => {
                    const isSelected = selectedHistoryItem?.id === rec.id;
                    const dateObj = new Date(rec.endTime);
                    return (
                      <div
                        key={rec.id}
                        onClick={() => setSelectedHistoryItem(rec)}
                        className={cn(
                          "bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md block text-left",
                          isSelected 
                            ? "border-[#2563EB] ring-1 ring-blue-100 bg-blue-50/10" 
                            : "border-slate-300 hover:border-slate-400"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{rec.shiftName}</span>
                          <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider",
                            rec.discrepancy === 0 
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          )}>
                            {rec.discrepancy === 0 ? "Khớp két" : "Lệch két"}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 mt-3 text-[11px] font-semibold text-slate-500">
                          <p>Người trực: <strong className="text-slate-800">{rec.previousStaffName}</strong></p>
                          <p>Giờ chốt: <strong className="text-slate-800">{dateObj.toLocaleTimeString("vi-VN")} {dateObj.toLocaleDateString("vi-VN")}</strong></p>
                          <p className="flex justify-between items-center text-xs mt-2 pt-1 border-t border-slate-100">
                            <span>Két thực thu:</span>
                            <span className="font-extrabold text-slate-900">{formatCurrency(rec.actualCash)}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Details on Right (col-span-2) */}
                <div className="md:col-span-2 bg-white border border-slate-300 rounded-2xl shadow-sm p-6">
                  {selectedHistoryItem ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-150 pb-4">
                        <div>
                          <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Chi tiết bàn giao - {selectedHistoryItem.shiftName}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                            Mã lưu trữ: {selectedHistoryItem.id.slice(0, 12)}...
                          </p>
                        </div>
                        <button
                          onClick={() => handlePrintPastHandover(selectedHistoryItem)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Printer className="w-4 h-4 text-slate-600" /> In Lại Phiếu Bán Giao
                        </button>
                      </div>

                      {/* Cash Breakdown Grid for selected past item */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        
                        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 text-xs leading-relaxed">
                          <p className="text-[10px] uppercase font-bold text-slate-600 tracking-wider flex items-center gap-1 pb-1.5 border-b border-slate-200">
                            <Clock className="w-4 h-4 text-indigo-600"/> Số liệu hoạt động
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Giờ vào ca:</span>
                              <span className="font-bold text-slate-800">{new Date(selectedHistoryItem.startTime).toLocaleString("vi-VN")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Giờ đóng ca:</span>
                              <span className="font-bold text-slate-800">{new Date(selectedHistoryItem.endTime).toLocaleString("vi-VN")}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-700">
                              <span>Tiền mặt đầu ca:</span>
                              <span>{formatCurrency(selectedHistoryItem.startCash)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-700">
                              <span>Tiền mặt thu thêm:</span>
                              <span>{formatCurrency(selectedHistoryItem.cashRevenue)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-slate-800">
                              <span>Tiền mặt lý thuyết:</span>
                              <span>{formatCurrency(selectedHistoryItem.expectedCash)}</span>
                            </div>
                            <div className="flex justify-between font-black text-[#2563EB]">
                              <span>Tiền bàn giao thực tế:</span>
                              <span>{formatCurrency(selectedHistoryItem.actualCash)}</span>
                            </div>

                            <div className={cn(
                              "flex justify-between p-2.5 rounded-lg border font-black mt-2",
                              selectedHistoryItem.discrepancy === 0 
                                ? "bg-emerald-50 border-emerald-250 text-emerald-800" 
                                : "bg-rose-50 border-rose-250 text-rose-800"
                            )}>
                              <span>Chênh lệch chốt:</span>
                              <span>
                                {selectedHistoryItem.discrepancy > 0 ? "+" : ""}
                                {formatCurrency(selectedHistoryItem.discrepancy)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Denomination list breakdown columns */}
                        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                          <p className="text-[10px] uppercase font-bold text-slate-600 tracking-wider flex items-center gap-1 pb-1.5 border-b border-slate-200">
                            <Coins className="w-4 h-4 text-amber-500" /> Bản kê mệnh giá tiền mặt
                          </p>
                          
                          <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar text-xs">
                            {selectedHistoryItem.denomBreakdown ? (
                              Object.entries(selectedHistoryItem.denomBreakdown).map(([denom, count]) => {
                                const countVal = parseInt(count as string) || 0;
                                if (countVal === 0) return null;
                                return (
                                  <div key={denom} className="flex justify-between py-1 border-b border-slate-100/60 font-semibold text-slate-600">
                                    <span>{new Intl.NumberFormat('vi-VN').format(parseInt(denom))}đ x {countVal} tờ</span>
                                    <span className="font-bold text-slate-800">{formatCurrency(parseInt(denom) * countVal)}</span>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-slate-400 font-bold text-center py-6">Kê khai mệnh giá thủ công (không nhập chi tiết)</p>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Ghi chú */}
                      <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-yellow-800 tracking-widest">Ghi chú giải trình chênh lệch:</span>
                        <p className="text-sm font-bold text-slate-700 italic">
                          {selectedHistoryItem.notes || "Không có ghi chú của thu ngân."}
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-20 text-center">
                      <FileCheck className="w-14 h-14 opacity-30 text-[#2563EB] mb-3" />
                      <p className="text-base font-bold text-slate-600">Chưa chọn bản chốt ca</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">Chọn một ca trực ở danh sách bên trái để kiểm tra đối soát mệnh giá chi tiết hoặc in lại hóa đơn.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
