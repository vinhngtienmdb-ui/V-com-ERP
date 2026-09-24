import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  Building2,
  MapPin,
  Search,
  Filter,
  Users,
  Grid,
  List,
  GitFork,
  MessageSquare,
  Sparkles,
  PhoneCall,
  UserCheck,
  Building,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  Download,
  Plus
} from 'lucide-react';

interface EmployeeContact {
  id: string;
  name: string;
  avatar: string;
  position: string;
  department: string;
  branch: string;
  internalExt: string; // Số máy lẻ VoIP (vd: #101)
  mobilePhone: string;
  email: string;
  directManager: string;
  status: 'online' | 'offline' | 'busy';
  joinDate: string;
}

export const EmployeeDirectory: React.FC = () => {
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'tree'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [callingEmployee, setCallingEmployee] = useState<EmployeeContact | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const defaultDirectoryList: EmployeeContact[] = [
    {
      id: 'EMP-001',
      name: 'Nguyễn Văn An',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      position: 'Tổng Giám Đốc (CEO)',
      department: 'Ban Điều Hành & Chiến Lược',
      branch: 'Trụ sở Hà Nội',
      internalExt: '#101',
      mobilePhone: '0912.345.678',
      email: 'an.nguyen@vcomm.vn',
      directManager: 'Hội đồng Quản trị',
      status: 'online',
      joinDate: '01/01/2020'
    },
    {
      id: 'EMP-002',
      name: 'Trần Thị Mai Lan',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
      position: 'Giám Đốc Vận Hành (COO)',
      department: 'Ban Điều Hành & Chiến Lược',
      branch: 'Trụ sở Hà Nội',
      internalExt: '#102',
      mobilePhone: '0983.456.789',
      email: 'lan.tran@vcomm.vn',
      directManager: 'Nguyễn Văn An',
      status: 'online',
      joinDate: '15/03/2021'
    },
    {
      id: 'EMP-003',
      name: 'Lê Hoàng Minh',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      position: 'Trưởng Phòng Phát Triển Sản Phẩm (R&D)',
      department: 'Công Nghệ & Kỹ Thuật (R&D)',
      branch: 'Trụ sở Hà Nội',
      internalExt: '#201',
      mobilePhone: '0904.567.890',
      email: 'minh.le@vcomm.vn',
      directManager: 'Nguyễn Văn An',
      status: 'busy',
      joinDate: '10/06/2022'
    },
    {
      id: 'EMP-004',
      name: 'Phạm Quỳnh Nga',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      position: 'Kế Toán Trưởng (CPA)',
      department: 'Tài Chính - Kế Toán',
      branch: 'Trụ sở Hà Nội',
      internalExt: '#301',
      mobilePhone: '0978.901.234',
      email: 'nga.pham@vcomm.vn',
      directManager: 'Nguyễn Văn An',
      status: 'online',
      joinDate: '01/08/2021'
    },
    {
      id: 'EMP-005',
      name: 'Vũ Đức Thịnh',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      position: 'Giám Đốc Kho Vận Miền Nam',
      department: 'Chuỗi Cung Ứng & Kho Vận',
      branch: 'Chi nhánh TP. Hồ Chí Minh',
      internalExt: '#401',
      mobilePhone: '0936.789.123',
      email: 'thinh.vu@vcomm.vn',
      directManager: 'Trần Thị Mai Lan',
      status: 'online',
      joinDate: '20/11/2022'
    },
    {
      id: 'EMP-006',
      name: 'Đặng Thùy Dương',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      position: 'Trưởng Nhóm CSKH & OmniChat',
      department: 'Chăm Sóc Khách Hàng (CSKH)',
      branch: 'Chi nhánh Đà Nẵng',
      internalExt: '#501',
      mobilePhone: '0962.112.233',
      email: 'duong.dang@vcomm.vn',
      directManager: 'Trần Thị Mai Lan',
      status: 'offline',
      joinDate: '05/02/2023'
    }
  ];

  const loadMergedEmployees = (): EmployeeContact[] => {
    try {
      const saved = localStorage.getItem('vcomm_hr_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        const mappedFromHrm: EmployeeContact[] = parsed.map((e: any) => ({
          id: e.id || `EMP-${Math.floor(100 + Math.random() * 900)}`,
          name: e.name,
          avatar: e.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          position: e.position || e.title || 'Nhân viên',
          department: e.department || 'Vận hành Sàn',
          branch: e.branch || 'Trụ sở Hà Nội',
          internalExt: e.internalExt || `#${String(e.id || '').replace(/\D/g, '').slice(-3) || '199'}`,
          mobilePhone: e.phone || '0901.234.567',
          email: e.workEmail || e.personalEmail || `${String(e.id || '').toLowerCase()}@vcomm-erp.vn`,
          directManager: e.directManager || 'Trưởng bộ phận',
          status: (e.status === 'active' || !e.status) ? 'online' : 'busy',
          joinDate: e.officialStartDate || e.contractStartDate || '01/01/2025'
        }));

        const combined = [...defaultDirectoryList];
        mappedFromHrm.forEach(hrmEmp => {
          if (!combined.some(item => item.id === hrmEmp.id || item.name.toLowerCase() === hrmEmp.name.toLowerCase())) {
            combined.push(hrmEmp);
          }
        });
        return combined;
      }
    } catch (err) {
      console.error('Failed to load vcomm_hr_employees:', err);
    }
    return defaultDirectoryList;
  };

  const [employees, setEmployees] = useState<EmployeeContact[]>(loadMergedEmployees);

  // Real-time synchronization listener for cross-tab and cross-app updates
  useEffect(() => {
    const handleSync = () => {
      setEmployees(loadMergedEmployees());
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('vcomm_employee_synced', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('vcomm_employee_synced', handleSync);
    };
  }, []);

  const departments = ['ALL', 'Ban Điều Hành & Chiến Lược', 'Công Nghệ & Kỹ Thuật (R&D)', 'Tài Chính - Kế Toán', 'Chuỗi Cung Ứng & Kho Vận', 'Chăm Sóc Khách Hàng (CSKH)'];
  const branches = ['ALL', 'Trụ sở Hà Nội', 'Chi nhánh TP. Hồ Chí Minh', 'Chi nhánh Đà Nẵng'];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.internalExt.includes(searchQuery) ||
                          emp.mobilePhone.includes(searchQuery) ||
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment === 'ALL' || emp.department === selectedDepartment;
    const matchesBranch = selectedBranch === 'ALL' || emp.branch === selectedBranch;
    return matchesSearch && matchesDept && matchesBranch;
  });

  const getStatusBadge = (status: EmployeeContact['status']) => {
    switch (status) {
      case 'online':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Trực tuyến</span>;
      case 'busy':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Đang bận</span>;
      case 'offline':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Ngoại tuyến</span>;
    }
  };

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
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                Corporate Directory
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Toàn hệ thống 124 nhân sự</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              Danh Bạ Doanh Nghiệp & Sơ Đồ Tổ Chức
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200/60">
                VoIP #101-#599
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Tra cứu nhanh thông tin liên lạc nội bộ, máy lẻ VoIP tổng đài và sơ đồ cây tổ chức phòng ban trực quan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => showToast('Đang kết xuất danh bạ nhân sự ra file Excel...')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Xuất danh bạ
          </button>
          <button
            onClick={() => showToast('Chức năng thêm liên hệ chỉ dành cho HR Admin')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Thêm danh bạ mới
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Tổng nhân sự hiện diện</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">124</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              100% Hoạt động
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">3 Chi nhánh & 5 Khối nghiệp vụ</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Máy lẻ VoIP hoạt động</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">68</span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
              SIP Server Online
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Đầu số tổng đài trung tâm: 1900 888 999</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Đang sẵn sàng liên lạc</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">96</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              Trực ban 77%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Sẵn sàng nhận cuộc gọi & chat</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Trụ sở & Chi nhánh</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">03</span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
              Bắc - Trung - Nam
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Hà Nội • TP.HCM • Đà Nẵng</p>
        </div>
      </div>

      {/* Filter and View Modes Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, máy lẻ #Ext, SĐT, chức danh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 w-64 md:w-80 transition"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 py-2 px-3 focus:outline-none focus:border-purple-500 font-medium transition"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d === 'ALL' ? 'Tất cả phòng ban' : d}</option>
            ))}
          </select>

          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 py-2 px-3 focus:outline-none focus:border-purple-500 font-medium transition"
          >
            {branches.map(b => (
              <option key={b} value={b}>{b === 'ALL' ? 'Tất cả chi nhánh' : b}</option>
            ))}
          </select>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 self-start md:self-auto">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'cards'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Thẻ danh thiếp
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'table'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Dạng danh sách
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'tree'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            Cây sơ đồ tổ chức
          </button>
        </div>
      </div>

      {/* VIEW 1: Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map(emp => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 p-5 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Header of Card */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                      />
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        emp.status === 'online' ? 'bg-emerald-500' : emp.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition leading-tight">
                        {emp.name}
                      </h3>
                      <p className="text-[11px] text-purple-600 font-semibold mt-0.5">{emp.position}</p>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{emp.id}</span>
                    </div>
                  </div>

                  {/* Ext badge */}
                  <div className="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-700 font-mono font-bold text-xs shadow-2xs shrink-0">
                    {emp.internalExt}
                  </div>
                </div>

                {/* Details List */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2 text-xs mb-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emp.branch}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-800 font-semibold">{emp.mobilePhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-700 font-medium">{emp.email}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {getStatusBadge(emp.status)}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCallingEmployee(emp);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
                    title="Gọi máy lẻ VoIP"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    Gọi {emp.internalExt}
                  </button>
                  <button
                    onClick={() => showToast(`Đang mở hội thoại OmniChat với ${emp.name}...`)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                    title="Nhắn tin OmniChat"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Họ và tên</th>
                  <th className="p-3.5">Máy lẻ VoIP</th>
                  <th className="p-3.5">Chức danh</th>
                  <th className="p-3.5">Phòng ban</th>
                  <th className="p-3.5">Chi nhánh</th>
                  <th className="p-3.5">Số điện thoại di động</th>
                  <th className="p-3.5">Email nội bộ</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-xl object-cover border border-slate-200" />
                        <div>
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-lg">
                        {emp.internalExt}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-900">{emp.position}</td>
                    <td className="p-3.5">{emp.department}</td>
                    <td className="p-3.5">{emp.branch}</td>
                    <td className="p-3.5 font-mono font-semibold text-slate-800">{emp.mobilePhone}</td>
                    <td className="p-3.5 text-slate-600">{emp.email}</td>
                    <td className="p-3.5">{getStatusBadge(emp.status)}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setCallingEmployee(emp)}
                          className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition"
                          title="Gọi VoIP"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => showToast(`Mở OmniChat với ${emp.name}`)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                          title="Nhắn tin"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Org Tree View */}
      {viewMode === 'tree' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs overflow-x-auto">
          <div className="min-w-[800px] flex flex-col items-center">
            {/* Level 1: CEO */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl shadow-xs text-center w-72">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
                Lãnh đạo Tối cao
              </span>
              <img
                src={employees[0].avatar}
                alt={employees[0].name}
                className="w-14 h-14 rounded-full mx-auto mb-2 border-2 border-white shadow-xs object-cover"
              />
              <h4 className="font-bold text-slate-900 text-sm">{employees[0].name}</h4>
              <p className="text-xs text-purple-600 font-semibold">{employees[0].position}</p>
              <div className="mt-2 font-mono text-[11px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md inline-block border border-purple-200">
                VoIP {employees[0].internalExt}
              </div>
            </div>

            {/* Tree Branch Line */}
            <div className="w-0.5 h-8 bg-slate-300" />

            {/* Level 2: COO */}
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl shadow-xs text-center w-64">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Ban Điều Hành
              </span>
              <img
                src={employees[1].avatar}
                alt={employees[1].name}
                className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white shadow-xs object-cover"
              />
              <h4 className="font-bold text-slate-900 text-xs">{employees[1].name}</h4>
              <p className="text-[11px] text-blue-600 font-medium">{employees[1].position}</p>
              <div className="mt-1 font-mono text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md inline-block border border-blue-200">
                VoIP {employees[1].internalExt}
              </div>
            </div>

            {/* Tree Branch Line To Departments */}
            <div className="w-0.5 h-8 bg-slate-300" />
            <div className="w-[600px] h-0.5 bg-slate-300" />

            {/* Level 3: Department Heads */}
            <div className="flex justify-between w-[700px] mt-4 gap-4">
              {employees.slice(2).map((lead) => (
                <div
                  key={lead.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs text-center flex-1 hover:border-purple-300 transition"
                >
                  <img
                    src={lead.avatar}
                    alt={lead.name}
                    className="w-10 h-10 rounded-full mx-auto mb-1.5 border border-slate-200 object-cover"
                  />
                  <h5 className="font-bold text-slate-900 text-xs truncate">{lead.name}</h5>
                  <p className="text-[10px] text-slate-500 truncate">{lead.position}</p>
                  <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mt-1.5 inline-block border border-purple-100">
                    {lead.internalExt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VoIP Call Simulator Modal */}
      {callingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden text-center p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-end">
              <button
                onClick={() => setCallingEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20" />
              <img
                src={callingEmployee.avatar}
                alt={callingEmployee.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-purple-100 relative z-10 shadow-md"
              />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">{callingEmployee.name}</h3>
              <p className="text-xs text-purple-600 font-semibold">{callingEmployee.position}</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">Máy lẻ: {callingEmployee.internalExt} • Di động: {callingEmployee.mobilePhone}</p>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl text-xs text-purple-800 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <span>Đang kết nối tổng đài nội bộ VComm PBX...</span>
            </div>

            <div className="pt-2 flex justify-center gap-4">
              <button
                onClick={() => {
                  setCallingEmployee(null);
                  showToast(`Đã kết thúc cuộc gọi với ${callingEmployee.name}`);
                }}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition shadow-lg shadow-rose-600/20 active:scale-95 flex items-center gap-2"
              >
                <Phone className="w-4 h-4 rotate-[135deg]" />
                Ngắt kết nối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
