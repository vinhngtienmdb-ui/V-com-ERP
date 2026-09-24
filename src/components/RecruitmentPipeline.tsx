import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  Calendar,
  UserCheck,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Star,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Award,
  DollarSign,
  Building2,
  MapPin,
  X
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired';
  rating: number;
  appliedDate: string;
  experience: string;
  expectedSalary: string;
  avatar: string;
  notes: string;
}

interface JobPosting {
  id: string;
  title: string;
  department: string;
  headcount: number;
  filled: number;
  salaryRange: string;
  deadline: string;
  status: 'active' | 'closed' | 'draft';
  applicantsCount: number;
  location: string;
}

export const RecruitmentPipeline: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'jobs' | 'interviews'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [jobs, setJobs] = useState<JobPosting[]>([
    {
      id: 'JOB-01',
      title: 'Senior Frontend Engineer (React/TypeScript)',
      department: 'Phát triển Sản phẩm (R&D)',
      headcount: 2,
      filled: 1,
      salaryRange: '35M - 50M VNĐ',
      deadline: '30/10/2026',
      status: 'active',
      applicantsCount: 14,
      location: 'Hà Nội'
    },
    {
      id: 'JOB-02',
      title: 'Trưởng nhóm Digital Marketing & Livestream',
      department: 'Marketing & Tăng trưởng',
      headcount: 1,
      filled: 0,
      salaryRange: '25M - 35M VNĐ',
      deadline: '15/10/2026',
      status: 'active',
      applicantsCount: 8,
      location: 'Hà Nội'
    },
    {
      id: 'JOB-03',
      title: 'Chuyên viên Quản lý Kho vận WMS',
      department: 'Chuỗi cung ứng & Kho vận',
      headcount: 3,
      filled: 2,
      salaryRange: '15M - 20M VNĐ',
      deadline: '20/10/2026',
      status: 'active',
      applicantsCount: 19,
      location: 'TP. Hồ Chí Minh'
    },
    {
      id: 'JOB-04',
      title: 'Kế toán Tổng hợp (Phụ trách TT99/2025)',
      department: 'Tài chính - Kế toán',
      headcount: 1,
      filled: 0,
      salaryRange: '20M - 28M VNĐ',
      deadline: '25/10/2026',
      status: 'active',
      applicantsCount: 6,
      location: 'Hà Nội'
    }
  ]);

  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: 'CAN-001',
      name: 'Nguyễn Anh Tuấn',
      email: 'tuan.na@gmail.com',
      phone: '0912.888.999',
      position: 'Senior Frontend Engineer (React/TypeScript)',
      department: 'Phát triển Sản phẩm (R&D)',
      stage: 'interview',
      rating: 5,
      appliedDate: '12/09/2026',
      experience: '5 năm kinh nghiệm React, Next.js, Microfrontends',
      expectedSalary: '45,000,000 VNĐ',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      notes: 'Đã qua vòng Tech 1 đạt điểm tuyệt đối thuật toán & architecture. Phỏng vấn Cultural fit thứ Năm tới.'
    },
    {
      id: 'CAN-002',
      name: 'Lê Quỳnh Anh',
      email: 'quynhanh.mkt@yahoo.com',
      phone: '0983.112.334',
      position: 'Trưởng nhóm Digital Marketing & Livestream',
      department: 'Marketing & Tăng trưởng',
      stage: 'offer',
      rating: 4,
      appliedDate: '08/09/2026',
      experience: '4 năm phụ trách tăng trưởng GMV sàn TMĐT 20 tỷ/tháng',
      expectedSalary: '32,000,000 VNĐ',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      notes: 'Đã gửi Offer Letter mức lương 32M + Thưởng KPI GMV. Đang chờ phản hồi trước ngày 20/09.'
    },
    {
      id: 'CAN-003',
      name: 'Trần Văn Mạnh',
      email: 'manhtv.wms@outlook.com',
      phone: '0904.556.778',
      position: 'Chuyên viên Quản lý Kho vận WMS',
      department: 'Chuỗi cung ứng & Kho vận',
      stage: 'hired',
      rating: 5,
      appliedDate: '01/09/2026',
      experience: '3 năm điều phối kho hàng thông minh, thành thạo mã vạch RFID',
      expectedSalary: '18,000,000 VNĐ',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      notes: 'Đã ký HĐ thử việc 2 tháng. Ngày nhận việc chính thức: 01/10/2026.'
    },
    {
      id: 'CAN-004',
      name: 'Vũ Thị Minh Hạnh',
      email: 'hanh.vu.cpa@gmail.com',
      phone: '0977.345.678',
      position: 'Kế toán Tổng hợp (Phụ trách TT99/2025)',
      department: 'Tài chính - Kế toán',
      stage: 'screening',
      rating: 4,
      appliedDate: '14/09/2026',
      experience: '6 năm Big4, chứng chỉ CPA Việt Nam, am hiểu TT99/2025/TT-BTC',
      expectedSalary: '26,000,000 VNĐ',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      notes: 'Hồ sơ nổi bật, chứng chỉ kiểm toán đầy đủ. Đã xếp lịch phỏng vấn với Kế toán trưởng.'
    },
    {
      id: 'CAN-005',
      name: 'Đặng Hoàng Long',
      email: 'longdh.dev@gmail.com',
      phone: '0936.789.012',
      position: 'Senior Frontend Engineer (React/TypeScript)',
      department: 'Phát triển Sản phẩm (R&D)',
      stage: 'applied',
      rating: 3,
      appliedDate: '16/09/2026',
      experience: '4 năm Vue và React, có kinh nghiệm hệ thống B2B',
      expectedSalary: '40,000,000 VNĐ',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      notes: 'Hồ sơ mới nộp từ TopCV hôm qua. Đang chờ Lead HR đánh giá.'
    }
  ]);

  const stages: { id: Candidate['stage']; label: string; bgCol: string; badgeCol: string; borderCol: string }[] = [
    { id: 'applied', label: '1. Ứng tuyển mới', bgCol: 'bg-blue-50/50', badgeCol: 'bg-blue-100 text-blue-700', borderCol: 'border-blue-200/70' },
    { id: 'screening', label: '2. Sơ loại hồ sơ', bgCol: 'bg-amber-50/50', badgeCol: 'bg-amber-100 text-amber-700', borderCol: 'border-amber-200/70' },
    { id: 'interview', label: '3. Phỏng vấn', bgCol: 'bg-purple-50/50', badgeCol: 'bg-purple-100 text-purple-700', borderCol: 'border-purple-200/70' },
    { id: 'offer', label: '4. Đề xuất đãi ngộ', bgCol: 'bg-emerald-50/50', badgeCol: 'bg-emerald-100 text-emerald-700', borderCol: 'border-emerald-200/70' },
    { id: 'hired', label: '5. Nhận việc / Onboard', bgCol: 'bg-teal-50/50', badgeCol: 'bg-teal-100 text-teal-700', borderCol: 'border-teal-200/70' }
  ];

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesJob = selectedJobFilter === 'ALL' || c.position === selectedJobFilter;
    return matchesSearch && matchesJob;
  });

  const moveCandidateStage = (candidateId: string, nextStage: Candidate['stage']) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, stage: nextStage } : c));
    showToast(`Đã chuyển trạng thái ứng viên sang "${stages.find(s => s.id === nextStage)?.label}"`);
  };

  const handleConvertToEmployee = (candidate: Candidate) => {
    // 1. Generate new employee ID & VoIP Ext
    const newEmpId = `EMP-${Math.floor(2100 + Math.random() * 800)}`;
    const internalVoipExt = `#${Math.floor(100 + Math.random() * 899)}`;
    const cleanSalary = parseInt(candidate.expectedSalary.replace(/\D/g, '')) || 22000000;

    // 2. Build EmployeeProfile compatible with VComm HRM and EmployeeDirectory
    const newProfile = {
      id: newEmpId,
      name: candidate.name,
      aliasName: candidate.name.split(' ').slice(-1)[0],
      foreignName: candidate.name,
      gender: "Nam",
      birthDate: "1995-06-15",
      department: candidate.department,
      position: candidate.position,
      title: candidate.position,
      nationality: "Việt Nam",
      identityNum: `001195${Math.floor(100000 + Math.random() * 900000)}`,
      taxCode: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
      personalEmail: candidate.email,
      workEmail: `${candidate.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '.') || 'staff'}@vcomm-erp.vn`,
      phone: candidate.phone,
      internalExt: internalVoipExt,
      avatar: candidate.avatar,
      salaryBase: cleanSalary,
      contractType: "HĐ lao động chính thức 1 năm",
      contractStartDate: new Date().toISOString().split('T')[0],
      officialStartDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    // 3. Save to vcomm_hr_employees in localStorage
    try {
      const existing = localStorage.getItem('vcomm_hr_employees');
      const employees = existing ? JSON.parse(existing) : [];
      if (!employees.some((e: any) => e.id === newEmpId || e.phone === candidate.phone)) {
        const updated = [newProfile, ...employees];
        localStorage.setItem('vcomm_hr_employees', JSON.stringify(updated));
      }
      // Broadcast storage and custom event for real-time live sync
      window.dispatchEvent(new CustomEvent('vcomm_employee_synced', { detail: newProfile }));
    } catch (err) {
      console.error('Failed to sync to vcomm_hr_employees:', err);
    }

    // 4. Update candidate stage to 'hired'
    setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, stage: 'hired' } : c));
    showToast(`Đã đồng bộ ứng viên ${candidate.name} thành Nhân sự chính thức VComm HRM & Danh bạ VoIP (${newEmpId} - Ext ${internalVoipExt})!`);
    setSelectedCandidate(null);
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
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Phân hệ Tuyển dụng & Quản trị ứng viên (ATS)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Quy trình Tuyển dụng & Đãi ngộ
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200/80">
              VComm Recruitment ATS 2.0
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi phễu ứng viên từ Sơ loại đến Phỏng vấn & Đồng bộ 1-click sang Hồ sơ nhân viên VComm HRM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewJobModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Đăng tin tuyển dụng
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tin tuyển dụng đang mở</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">4</span>
            <span className="text-xs text-blue-600 font-bold">7 vị trí trống</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Hồ sơ ứng viên trong phễu</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">47</span>
            <span className="text-xs text-purple-600 font-bold">+12 tuần này</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lịch phỏng vấn tuần này</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">8</span>
            <span className="text-xs text-amber-600 font-bold">Hôm nay: 3 buổi</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tuyển dụng thành công (Tháng 9)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">3</span>
            <span className="text-xs text-emerald-600 font-bold">Tỷ lệ chốt: 85%</span>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'kanban'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bảng Kanban Pipeline
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'jobs'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tin tuyển dụng ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'interviews'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lịch phỏng vấn & Scorecard
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm ứng viên, kỹ năng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-52 transition"
            />
          </div>

          <select
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 py-1.5 px-3 focus:outline-none focus:border-blue-500 transition font-medium"
          >
            <option value="ALL">Tất cả vị trí</option>
            {jobs.map(j => (
              <option key={j.id} value={j.title}>{j.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageCandidates = filteredCandidates.filter(c => c.stage === stage.id);
            return (
              <div
                key={stage.id}
                className={`rounded-2xl border ${stage.borderCol} ${stage.bgCol} p-3.5 flex flex-col min-h-[550px] shadow-xs`}
              >
                <div className="flex items-center justify-between mb-3.5 px-1">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{stage.label}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${stage.badgeCol}`}>
                    {stageCandidates.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {stageCandidates.map(c => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCandidate(c)}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md cursor-pointer transition shadow-xs group relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition leading-tight">
                              {c.name}
                            </h4>
                            <span className="text-[11px] text-slate-500">{c.department}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-amber-500 text-xs font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-1" />
                          <span>{c.rating}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-slate-800 font-semibold line-clamp-1">
                        {c.position}
                      </div>

                      <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-100 p-2 rounded-lg line-clamp-2 leading-relaxed">
                        {c.experience}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {c.appliedDate}
                        </span>
                        <span className="text-emerald-700 font-bold">
                          {c.expectedSalary}
                        </span>
                      </div>
                    </div>
                  ))}

                  {stageCandidates.length === 0 && (
                    <div className="h-36 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-xs text-slate-400 bg-white/50">
                      Chưa có hồ sơ
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Tin tuyển dụng hoạt động</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tự động đồng bộ cổng thông tin tuyển dụng & TopCV, VietnamWorks, LinkedIn</p>
            </div>
            <button
              onClick={() => setShowNewJobModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo vị trí mới
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Mã tin & Vị trí</th>
                  <th className="p-3.5">Phòng ban</th>
                  <th className="p-3.5">Địa điểm</th>
                  <th className="p-3.5">Chỉ tiêu / Đã tuyển</th>
                  <th className="p-3.5">Mức lương</th>
                  <th className="p-3.5">Hồ sơ đã nộp</th>
                  <th className="p-3.5">Hạn chót</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{job.title}</div>
                      <div className="text-[11px] text-blue-600 font-semibold">{job.id}</div>
                    </td>
                    <td className="p-3.5 text-slate-600">{job.department}</td>
                    <td className="p-3.5 text-slate-600">{job.location}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">{job.filled}</span> / {job.headcount} nhân sự
                    </td>
                    <td className="p-3.5 font-bold text-emerald-700">{job.salaryRange}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200/60">
                        {job.applicantsCount} hồ sơ
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{job.deadline}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/60">
                        Đang mở
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedJobFilter(job.title);
                          setActiveTab('kanban');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                      >
                        Xem ứng viên
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'interviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Lịch phỏng vấn sắp diễn ra
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tự động đồng bộ với Google Calendar & Microsoft Teams</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center text-blue-700">
                      <span className="text-xs font-bold uppercase">T5</span>
                      <span className="text-sm font-black">18/09</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Nguyễn Anh Tuấn (Senior Frontend)</h4>
                      <p className="text-xs text-slate-500">14:30 - 15:30 | Phòng Họp VIP 2 & Google Meet</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Hội đồng: Tech Lead & Giám đốc Sản phẩm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showToast('Đã gửi nhắc nhở lịch họp qua OmniChat & Email tới ứng viên')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs"
                    >
                      Nhắc lịch
                    </button>
                    <button
                      onClick={() => showToast('Đang mở Phiếu đánh giá phỏng vấn Scorecard chuẩn HRM...')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                    >
                      Đánh giá Scorecard
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex flex-col items-center justify-center text-purple-700">
                      <span className="text-xs font-bold uppercase">T6</span>
                      <span className="text-sm font-black">19/09</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Vũ Thị Minh Hạnh (Kế toán Tổng hợp TT99)</h4>
                      <p className="text-xs text-slate-500">09:30 - 10:30 | Phòng Họp Tài chính 1</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Hội đồng: Kế toán Trưởng & Trưởng phòng HR</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showToast('Đã gửi nhắc nhở lịch họp qua OmniChat & Email tới ứng viên')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs"
                    >
                      Nhắc lịch
                    </button>
                    <button
                      onClick={() => showToast('Đang mở Phiếu đánh giá phỏng vấn Scorecard chuẩn HRM...')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                    >
                      Đánh giá Scorecard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">Tiêu chí Đánh giá Ứng viên (Scorecard)</h3>
            <p className="text-xs text-slate-500 mb-4">Khung năng lực chuẩn áp dụng cho toàn hệ thống:</p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>1. Chuyên môn & Nghiệp vụ</span>
                  <span className="text-blue-600 font-bold">40%</span>
                </div>
                <div className="text-slate-500 text-[11px]">Đánh giá kiến thức thực chiến, giải bài test và xử lý tình huống.</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>2. Tư duy Logic & Problem-Solving</span>
                  <span className="text-indigo-600 font-bold">25%</span>
                </div>
                <div className="text-slate-500 text-[11px]">Khả năng phân tích hệ thống, ra quyết định dựa trên dữ liệu.</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>3. Văn hóa & Tinh thần phụng sự</span>
                  <span className="text-emerald-600 font-bold">20%</span>
                </div>
                <div className="text-slate-500 text-[11px]">Mức độ phù hợp với giá trị cốt lõi và cam kết đạo đức nghề nghiệp.</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex justify-between font-bold text-slate-800 mb-1">
                  <span>4. Ngoại ngữ & Giao tiếp</span>
                  <span className="text-amber-600 font-bold">15%</span>
                </div>
                <div className="text-slate-500 text-[11px]">Khả năng đọc tài liệu chuyên ngành quốc tế, trình bày mạch lạc.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <img src={selectedCandidate.avatar} alt={selectedCandidate.name} className="w-12 h-12 rounded-full object-cover border-2 border-blue-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedCandidate.name}</h3>
                  <p className="text-xs text-blue-600 font-semibold">{selectedCandidate.position}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 block mb-1">Email liên hệ:</span>
                  <span className="text-slate-900 font-semibold">{selectedCandidate.email}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 block mb-1">Số điện thoại:</span>
                  <span className="text-slate-900 font-semibold">{selectedCandidate.phone}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 block mb-1">Lương mong muốn:</span>
                  <span className="text-emerald-700 font-bold">{selectedCandidate.expectedSalary}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 block mb-1">Giai đoạn hiện tại:</span>
                  <span className="text-blue-700 font-bold">
                    {stages.find(s => s.id === selectedCandidate.stage)?.label}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <h4 className="font-bold text-slate-900 mb-1.5">Tóm tắt kinh nghiệm & Năng lực:</h4>
                <p className="text-slate-600 leading-relaxed">{selectedCandidate.experience}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <h4 className="font-bold text-slate-900 mb-1.5">Ghi chú từ Hội đồng Phỏng vấn / HR:</h4>
                <p className="text-slate-600 leading-relaxed">{selectedCandidate.notes}</p>
              </div>

              {/* Stage Stepper Buttons */}
              <div className="pt-2">
                <label className="text-slate-700 block mb-2 font-bold text-xs">Chuyển sang giai đoạn tiếp theo:</label>
                <div className="grid grid-cols-5 gap-2">
                  {stages.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        moveCandidateStage(selectedCandidate.id, s.id);
                        setSelectedCandidate({ ...selectedCandidate, stage: s.id });
                      }}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold transition text-center ${
                        selectedCandidate.stage === s.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {s.label.split('.')[1]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Đóng
              </button>

              <button
                onClick={() => handleConvertToEmployee(selectedCandidate)}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                <UserCheck className="w-4 h-4" />
                Đồng bộ thành Hồ sơ Nhân viên (VComm HRM)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Job Modal */}
      {showNewJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Tạo Tin Tuyển Dụng Mới
              </h3>
              <button onClick={() => setShowNewJobModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Tiêu đề vị trí tuyển dụng</label>
                <input
                  type="text"
                  placeholder="VD: Senior Data Engineer..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Phòng ban</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-blue-500">
                    <option>Phát triển Sản phẩm (R&D)</option>
                    <option>Marketing & Tăng trưởng</option>
                    <option>Chuỗi cung ứng & Kho vận</option>
                    <option>Tài chính - Kế toán</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Số lượng cần tuyển</label>
                  <input
                    type="number"
                    defaultValue={1}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Mức lương dự kiến</label>
                  <input
                    type="text"
                    placeholder="VD: 25M - 35M VNĐ"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Hạn nộp hồ sơ</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/60">
              <button
                onClick={() => setShowNewJobModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowNewJobModal(false);
                  showToast('Đã đăng tin tuyển dụng mới và đồng bộ cổng việc làm tuyển dụng!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold text-xs shadow-xs"
              >
                Đăng tin ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
