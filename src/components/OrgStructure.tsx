import React, { useState } from 'react';
import { Building2, Users, Briefcase, Plus, Search, Edit2 } from 'lucide-react';

const MOCK_DEPARTMENTS = [
  { id: 'D-001', name: 'Vận hành Sàn', manager: 'Lê Hoàng Minh', staffCount: 45 },
  { id: 'D-002', name: 'Marketing', manager: 'Nguyễn Diệu Nhi', staffCount: 22 },
  { id: 'D-003', name: 'Nhân sự & Đào tạo', manager: 'Trần Văn A', staffCount: 15 },
];

const MOCK_JOB_TITLES = [
  { id: 'T-001', name: 'Quản lý kho', department: 'Vận hành Sàn' },
  { id: 'T-002', name: 'KOL Specialist', department: 'Marketing' },
  { id: 'T-003', name: 'HR Executive', department: 'Nhân sự & Đào tạo' },
];

const MOCK_JOB_RANKS = [
  { id: 'R-001', name: 'Nhân viên', level: 1 },
  { id: 'R-002', name: 'Trưởng nhóm', level: 2 },
  { id: 'R-003', name: 'Quản lý', level: 3 },
  { id: 'R-004', name: 'Giám đốc', level: 4 },
];

export function OrgStructure() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Cơ cấu Tổ chức</h1>
          <p className="text-sm text-[#6B7280]">Quản lý sơ đồ bộ máy phòng ban, chức danh và cấp bậc trong hệ thống.</p>
        </div>
        <button className="bg-[#2563EB] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Thêm đơn vị/chức danh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Phòng ban', data: MOCK_DEPARTMENTS, icon: Building2 },
          { title: 'Chức danh', data: MOCK_JOB_TITLES, icon: Briefcase },
          { title: 'Cấp bậc', data: MOCK_JOB_RANKS, icon: Users }
        ].map(section => (
          <div key={section.title} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
            <h3 className="font-bold text-[#111827] flex items-center gap-2 mb-6">
              <section.icon className="w-5 h-5 text-blue-600" /> {section.title}
            </h3>
            <div className="space-y-3">
              {section.data.map((item: any, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:shadow-sm transition-all">
                  <span className="text-sm font-semibold">{item.name}</span>
                  <button className="text-[10px] bg-white border border-[#E5E7EB] px-2 py-1 rounded shadow-sm text-[#2563EB] font-bold">Chi tiết</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
