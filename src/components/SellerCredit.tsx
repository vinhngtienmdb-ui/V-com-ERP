import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  DollarSign,
  Percent,
  FileCheck,
  Plus,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Landmark,
  BadgeCheck,
  Wallet,
  X
} from 'lucide-react';
import { collection, onSnapshot, db } from '../lib/firebase';

interface LoanRequest {
  id: string;
  bankName: string;
  bankLogo: string;
  loanType: string;
  requestedAmount: number;
  approvedAmount: number;
  interestRate: string;
  durationMonths: number;
  status: 'approved' | 'reviewing' | 'disbursed' | 'rejected';
  submittedDate: string;
  purpose: string;
}

interface BankPartner {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  maxLimit: string;
  interestRate: string;
  approvalTime: string;
  benefits: string[];
  recommended?: boolean;
}

export const SellerCredit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'requests'>('overview');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>('techcombank');
  const [loanAmount, setLoanAmount] = useState<number>(500000000);
  const [loanDuration, setLoanDuration] = useState<number>(12);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const partnerBanks: BankPartner[] = [
    {
      id: 'techcombank',
      name: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
      shortName: 'Techcombank',
      logo: '🔴',
      maxLimit: 'Đến 5,000,000,000 VNĐ',
      interestRate: 'Từ 0.75% / tháng (9.0%/năm)',
      approvalTime: 'Phê duyệt 4 giờ làm việc',
      benefits: ['Không cần tài sản thế chấp', 'Hạn mức thấu chi tín chấp linh hoạt', 'Giải ngân online 100%'],
      recommended: true
    },
    {
      id: 'mbbank',
      name: 'Ngân hàng TMCP Quân Đội (MB Bank)',
      shortName: 'MB Bank',
      logo: '🔵',
      maxLimit: 'Đến 3,500,000,000 VNĐ',
      interestRate: 'Từ 0.79% / tháng (9.5%/năm)',
      approvalTime: 'Phê duyệt trong ngày',
      benefits: ['Tài trợ theo dòng tiền bán lẻ', 'Miễn phí chuyển khoản trọn đời', 'Thủ tục số hóa qua API ERP']
    },
    {
      id: 'vpbank',
      name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank SME)',
      shortName: 'VPBank',
      logo: '🟢',
      maxLimit: 'Đến 7,000,000,000 VNĐ',
      interestRate: 'Từ 0.82% / tháng (9.8%/năm)',
      approvalTime: 'Phê duyệt 24 giờ',
      benefits: ['Tài trợ đơn hàng PO lên tới 80%', 'Ân hạn gốc 6 tháng đầu', 'Hạn mức thẻ tín dụng doanh nghiệp 500M']
    }
  ];

  const defaultInitialLoans: LoanRequest[] = [
    {
      id: 'LEND-2026-089',
      bankName: 'Techcombank SME',
      bankLogo: '🔴',
      loanType: 'Vay tín chấp bổ sung vốn lưu động mùa cao điểm',
      requestedAmount: 1000000000,
      approvedAmount: 1000000000,
      interestRate: '9.0% / năm',
      durationMonths: 12,
      status: 'disbursed',
      submittedDate: '02/09/2026',
      purpose: 'Nhập khẩu 5.000 kiện hàng phụ kiện thời trang đón Black Friday'
    },
    {
      id: 'LEND-2026-094',
      bankName: 'MB Bank',
      bankLogo: '🔵',
      loanType: 'Tài trợ chiết khấu hóa đơn B2B (Invoice Financing)',
      requestedAmount: 650000000,
      approvedAmount: 650000000,
      interestRate: '9.5% / năm',
      durationMonths: 6,
      status: 'approved',
      submittedDate: '12/09/2026',
      purpose: 'Tài trợ thanh toán trước đơn hàng cung ứng đại lý chuỗi siêu thị'
    },
    {
      id: 'LEND-2026-097',
      bankName: 'VPBank SME',
      bankLogo: '🟢',
      loanType: 'Hạn mức thấu chi tài khoản doanh nghiệp',
      requestedAmount: 500000000,
      approvedAmount: 0,
      interestRate: '9.8% / năm',
      durationMonths: 12,
      status: 'reviewing',
      submittedDate: '16/09/2026',
      purpose: 'Dự phòng dòng tiền trả lương và chi phí vận hành kho vận'
    }
  ];

  const loadInitialLoans = (): LoanRequest[] => {
    try {
      const saved = localStorage.getItem('vcomm_loan_requests');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultInitialLoans;
  };

  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>(loadInitialLoans);
  const [liveOrdersCount, setLiveOrdersCount] = useState<number>(1240);
  const [liveCompletedCount, setLiveCompletedCount] = useState<number>(1225);
  const [liveGmv, setLiveGmv] = useState<number>(4820000000);

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      let gmv = 0;
      let completed = 0;
      const total = snap.size;

      snap.docs.forEach(doc => {
        const d = doc.data();
        const orderTotal = Number(d.total || d.amount || 0);
        if (d.status === 'completed' || d.status === 'paid' || d.status === 'delivered') {
          gmv += orderTotal;
          completed++;
        }
      });

      if (total > 0) {
        setLiveGmv(4500000000 + gmv);
        setLiveOrdersCount(1200 + total);
        setLiveCompletedCount(1180 + completed);
      }
    });

    const handleCreditSync = (e: any) => {
      if (e.detail) {
        setLoanRequests(prev => [e.detail, ...prev.filter(l => l.id !== e.detail.id)]);
      }
    };
    window.addEventListener('vcomm_credit_synced', handleCreditSync);

    return () => {
      unsubOrders();
      window.removeEventListener('vcomm_credit_synced', handleCreditSync);
    };
  }, []);

  const fulfillmentRate = liveOrdersCount > 0 ? (liveCompletedCount / liveOrdersCount) * 100 : 98.8;
  const computedScore = Math.min(990, Math.max(760, Math.round(790 + (fulfillmentRate - 90) * 10 + Math.min(liveOrdersCount * 0.04, 50))));
  const scoreGrade = computedScore >= 850 ? 'AAA' : computedScore >= 800 ? 'AA+' : computedScore >= 750 ? 'AA' : 'A';
  const riskLabel = computedScore >= 850 ? 'Rủi ro rất thấp' : computedScore >= 800 ? 'Rủi ro thấp' : 'Rủi ro trung bình';
  const preApprovedLimit = Math.round((liveGmv * 2.5) / 100000000) * 100000000;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status: LoanRequest['status']) => {
    switch (status) {
      case 'disbursed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" />Đã giải ngân</span>;
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1 w-fit"><BadgeCheck className="w-3 h-3" />Đã duyệt - Chờ nhận tiền</span>;
      case 'reviewing':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" />Đang thẩm định</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center gap-1 w-fit">Từ chối</span>;
    }
  };

  const handleApplyNewLoan = () => {
    const selected = partnerBanks.find(b => b.id === selectedBank) || partnerBanks[0];
    const newReq: LoanRequest = {
      id: `LEND-2026-${Math.floor(100 + Math.random() * 900)}`,
      bankName: selected.shortName,
      bankLogo: selected.logo,
      loanType: 'Tín dụng tín chấp doanh nghiệp số hóa ERP',
      requestedAmount: loanAmount,
      approvedAmount: loanAmount <= preApprovedLimit ? loanAmount : preApprovedLimit,
      interestRate: selected.interestRate.split('(')[1]?.replace(')', '') || '9.2% / năm',
      durationMonths: loanDuration,
      status: 'reviewing',
      submittedDate: new Date().toLocaleDateString('vi-VN'),
      purpose: 'Bổ sung vốn lưu động mở rộng kênh bán hàng đa sàn'
    };

    const updated = [newReq, ...loanRequests];
    setLoanRequests(updated);
    try {
      localStorage.setItem('vcomm_loan_requests', JSON.stringify(updated));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('vcomm_credit_synced', { detail: newReq }));

    setShowApplyModal(false);
    showToast(`Đã gửi hồ sơ vay ${formatCurrency(loanAmount)} tới ${selected.shortName} thành công! Ngân hàng sẽ phản hồi trong 4 giờ.`);
    setActiveTab('requests');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Nền tảng Kết nối Vốn tín chấp Doanh nghiệp (Lending Hub)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
            Kết nối Vay vốn & Tài trợ vốn lưu động
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200/80">
              Chấm điểm Tín nhiệm AI
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Đã liên thông Đơn hàng ({liveOrdersCount} đơn • {fulfillmentRate.toFixed(1)}% giao thành công)
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hạn mức vay không thế chấp dựa trên doanh thu GMV và dòng tiền thực tế trên VComm ERP. Giải ngân 100% online.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            Đăng ký gói vay mới
          </button>
        </div>
      </div>

      {/* Credit Rating Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hồ sơ Tín nhiệm VComm Score</span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-black text-slate-900">{scoreGrade} ({computedScore} / 1000)</span>
                <span className="text-xs font-bold text-emerald-700 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200/80 rounded-full">
                  {riskLabel}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-semibold text-slate-500">Hạn mức ngân hàng cấp sẵn:</span>
              <div className="text-2xl font-black text-amber-600">{formatCurrency(preApprovedLimit)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 block mb-1 font-medium">Doanh thu TB / tháng</span>
              <span className="text-base font-black text-slate-900">{(liveGmv / 1000000000).toFixed(2)} tỷ VNĐ</span>
              <span className="text-[11px] text-emerald-700 font-semibold block mt-1">Tăng trưởng +24% YoY</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 block mb-1 font-medium">Lịch sử trả nợ & thanh toán</span>
              <span className="text-base font-black text-emerald-700">100% Đúng hạn</span>
              <span className="text-[11px] text-slate-500 font-medium block mt-1">Không nợ xấu CIC</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 block mb-1 font-medium">Số dư lưu thông bình quân</span>
              <span className="text-base font-black text-blue-700">1.95 tỷ VNĐ</span>
              <span className="text-[11px] text-slate-500 font-medium block mt-1">Đảm bảo thanh khoản</span>
            </div>
          </div>
        </div>

        {/* Quick Action Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-amber-600" />
              Tại sao chọn vay qua ERP?
            </h3>
            <ul className="text-xs text-slate-600 space-y-2.5 mt-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Không cần thế chấp:</strong> Tự động thẩm định qua doanh số bán lẻ.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Lãi suất thấp hơn 1.5%:</strong> Ưu đãi từ ngân hàng đối tác chiến lược.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Hồ sơ số hóa 100%:</strong> Ký hợp đồng tín dụng qua chữ ký số Cloud HSM.</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="w-full mt-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            Tính toán khoản trả góp hàng tháng
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Đối tác Ngân hàng & Gói vay
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'requests'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Hồ sơ giải ngân của tôi ({loanRequests.length})
        </button>
      </div>

      {/* Packages Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {partnerBanks.map(bank => (
            <div
              key={bank.id}
              className={`p-6 rounded-2xl border bg-white shadow-xs hover:shadow-md transition flex flex-col justify-between relative ${
                bank.recommended
                  ? 'border-amber-400/80 ring-1 ring-amber-400/40'
                  : 'border-slate-200/80'
              }`}
            >
              {bank.recommended && (
                <div className="absolute -top-3 right-4 px-3 py-0.5 bg-amber-500 text-slate-950 text-[11px] font-black rounded-full uppercase tracking-wider shadow-xs">
                  Được khuyên dùng nhất
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{bank.logo}</div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{bank.shortName}</h4>
                    <span className="text-xs text-slate-500 font-medium">{bank.approvalTime}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 my-4 space-y-2">
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Hạn mức phê duyệt tối đa:</span>
                    <span className="text-base font-black text-amber-600">{bank.maxLimit}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Lãi suất chỉ từ:</span>
                    <span className="text-sm font-bold text-emerald-700">{bank.interestRate}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">Đặc quyền dành riêng:</span>
                  {bank.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setSelectedBank(bank.id);
                    setShowApplyModal(true);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                >
                  Nộp hồ sơ phê duyệt ngay
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Danh sách Đơn yêu cầu vay & Giải ngân</h3>
              <p className="text-xs text-slate-500 mt-0.5">Dữ liệu kết nối trực tiếp cổng Open Banking các ngân hàng</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Mã hồ sơ & Ngân hàng</th>
                  <th className="p-3.5">Mục đích vay vốn</th>
                  <th className="p-3.5">Số tiền đề xuất</th>
                  <th className="p-3.5">Số tiền đã duyệt</th>
                  <th className="p-3.5">Lãi suất & Thời hạn</th>
                  <th className="p-3.5">Ngày nộp hồ sơ</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loanRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{req.bankLogo}</span>
                        <div>
                          <div className="font-bold text-slate-900">{req.bankName}</div>
                          <div className="text-[11px] font-mono text-blue-600 font-semibold">{req.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{req.loanType}</div>
                      <div className="text-[11px] text-slate-500 truncate">{req.purpose}</div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{formatCurrency(req.requestedAmount)}</td>
                    <td className="p-3.5 font-bold text-emerald-700">
                      {req.approvedAmount > 0 ? formatCurrency(req.approvedAmount) : 'Đang duyệt'}
                    </td>
                    <td className="p-3.5">
                      <div className="text-emerald-700 font-bold">{req.interestRate}</div>
                      <div className="text-slate-500 text-[11px]">{req.durationMonths} tháng</div>
                    </td>
                    <td className="p-3.5 text-slate-600">{req.submittedDate}</td>
                    <td className="p-3.5">{getStatusBadge(req.status)}</td>
                    <td className="p-3.5 text-right">
                      {req.status === 'approved' && (
                        <button
                          onClick={() => {
                            setLoanRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'disbursed' } : r));
                            showToast(`Đã giải ngân thành công ${formatCurrency(req.approvedAmount)} vào Tài khoản Doanh nghiệp VComm!`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                        >
                          Rút tiền ngay
                        </button>
                      )}
                      {req.status === 'disbursed' && (
                        <button
                          onClick={() => showToast(`Đang tải Biên bản khế ước nhận nợ điện tử hồ sơ ${req.id}...`)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          Xem khế ước
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-600" />
                Nộp Hồ Sơ Đăng Ký Vay Vốn Doanh Nghiệp
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Chọn Ngân hàng đối tác</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:border-amber-500"
                >
                  {partnerBanks.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-slate-700 font-bold">Số tiền muốn vay (VNĐ):</label>
                  <span className="font-black text-amber-600 text-sm">{formatCurrency(loanAmount)}</span>
                </div>
                <input
                  type="range"
                  min={100000000}
                  max={5000000000}
                  step={50000000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-medium">
                  <span>100 triệu</span>
                  <span>2.5 tỷ</span>
                  <span>5 tỷ</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Thời hạn vay</label>
                <div className="grid grid-cols-4 gap-2">
                  {[6, 12, 18, 24].map(m => (
                    <button
                      key={m}
                      onClick={() => setLoanDuration(m)}
                      className={`py-2 rounded-xl text-xs font-bold transition ${
                        loanDuration === m
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {m} tháng
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Ước tính trả góp hàng tháng (Gốc + Lãi):</span>
                  <span className="text-slate-900 font-bold text-xs">
                    {formatCurrency(Math.round((loanAmount / loanDuration) + (loanAmount * 0.0075)))} / tháng
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Hồ sơ tự động đính kèm:</span>
                  <span className="text-emerald-700 font-bold">BCTC TT99 + Sao kê GMV</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/60">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleApplyNewLoan}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition text-xs shadow-xs"
              >
                Xác nhận & Nộp hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
