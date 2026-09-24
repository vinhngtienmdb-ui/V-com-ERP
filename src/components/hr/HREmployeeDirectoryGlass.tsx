import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  ArrowUpRight, 
  Building2,
  FileBadge,
  Filter
} from 'lucide-react';
import { EmployeePassportData } from './HREmployeePassportModal';
import { cn } from '../../lib/utils';

interface HREmployeeDirectoryGlassProps {
  employees: EmployeePassportData[];
  onSelectEmployee: (emp: EmployeePassportData) => void;
}

export function HREmployeeDirectoryGlass({ employees, onSelectEmployee }: HREmployeeDirectoryGlassProps) {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const departments = ['ALL', 'Vận hành Sàn', 'Marketing', 'Kỹ thuật', 'Kế toán', 'Ban Giám Đốc'];

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = e.fullName.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q) || e.position.toLowerCase().includes(q);
    const matchDept = selectedDept === 'ALL' || e.department === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-xl shadow-slate-200/40 p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Danh bạ Nhân sự (Digital Directory)
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Hiển thị {filtered.length} / {employees.length} cán bộ nhân viên • Chạm thẻ để mở Digital Passport
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã EMP, chức vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/90 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>
      </div>

      {/* Department Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {departments.map(dept => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={cn(
              "px-3.5 py-1.5 rounded-2xl font-bold transition-all cursor-pointer shrink-0",
              selectedDept === dept
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
            )}
          >
            {dept === 'ALL' ? 'Tất cả phòng ban' : dept}
          </button>
        ))}
      </div>

      {/* Grid of Apple-style Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(emp => (
          <div
            key={emp.id}
            onClick={() => onSelectEmployee(emp)}
            className="group relative p-5 rounded-3xl bg-white/90 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            {/* Top Card Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white text-base font-black flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  {emp.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {emp.fullName}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {emp.employeeCode}
                  </span>
                </div>
              </div>

              <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center text-slate-400 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>

            {/* Role & Department */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>{emp.department} • {emp.position}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="truncate">{emp.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{emp.phone}</span>
              </div>
            </div>

            {/* Bottom: Skills & RSA Badge */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1">
                {emp.skills.slice(0, 2).map((s, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-100 font-semibold text-slate-600">
                    {s.name}
                  </span>
                ))}
              </div>

              <span className="flex items-center gap-1 font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/50">
                <ShieldCheck className="w-3 h-3" /> RSA Signed
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
