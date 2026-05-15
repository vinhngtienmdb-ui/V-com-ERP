import React from 'react';
import {
  Users, Rocket, Wallet, Target, Building2, Activity,
  BrainCircuit, MapPin, Briefcase, LineChart, Layers, LucidePieChart,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart as RechartsLineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DraggableGrid } from '../ui/DraggableGrid';
import { formatCurrency, cn } from '../../lib/utils';
import type { Employee } from '../../types/erp';
import { HR_METRICS_DATA } from './mockData';
import { HRModuleGrid } from './HRLayout';

// @ts-ignore — LucidePieChart usage
const LucidePieChartIcon = LucidePieChart as React.FC<{ className?: string }>;

interface Props {
  employees: Employee[];
  onNavigate: (tab: string) => void;
  onOpenRecruitment: () => void;
}

export function HROverview({ employees, onNavigate, onOpenRecruitment }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={16}>
        <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Tổng nhân sự</span>
            <Users className="w-4 h-4 text-orange-700" />
          </div>
          <div className="text-3xl font-black text-[#111827]">{employees.length || 124}</div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-orange-700 font-bold bg-slate-100 px-2 py-0.5 rounded w-fit">
            <Building2 className="w-3.5 h-3.5" /> 05 Phòng ban
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Đang Onboarding</span>
            <Rocket className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">12</div>
          <p className="text-[10px] text-[#6B7280] mt-3 font-bold uppercase">Bổ sung 4 nhân sự Kho</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Quỹ lương tháng</span>
            <Wallet className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-[#111827] truncate">{formatCurrency(1850000000)}</div>
          <p className="text-[10px] text-slate-500 mt-3 font-bold italic uppercase tracking-tighter">Tăng 5.2% so với T2</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Skill Health</h3>
          </div>
          <div className="p-5">
            <div className="text-3xl font-black text-slate-900 tracking-tighter">88.5%</div>
            <p className="text-[10px] text-orange-600 font-bold mt-1 uppercase">Top: Marketing Dept</p>
          </div>
        </div>
      </DraggableGrid>

      <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm mb-6">
        <h3 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-700" /> HR Dashboard Insight
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="h-72 w-full space-y-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center">Tỷ lệ Tuyển dụng & Nghỉ việc</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HR_METRICS_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis yAxisId="left" orientation="left" stroke="#2563EB" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
                <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#F3F4F6' }} />
                <Bar yAxisId="left" dataKey="hiring" name="Tuyển mới" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar yAxisId="right" dataKey="attrition" name="Tỷ lệ nghỉ việc (%)" fill="#FBBF24" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-72 w-full space-y-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center">Biểu đồ Vi phạm Chấm công</h4>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={HR_METRICS_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="late" name="Đi muộn" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} />
                <Line type="monotone" dataKey="absent" name="Vắng mặt" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-6">
            <div className="p-5 bg-slate-100/50 border border-slate-300 rounded-lg">
              <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2"><BrainCircuit className="w-4 h-4 text-orange-700" /> AI Insights</h4>
              <p className="text-xs text-blue-800 leading-relaxed">Tỷ lệ nghỉ việc giảm ổn định trong Q2, đặc biệt sau khi triển khai chương trình phúc lợi mới. Nhu cầu tuyển mới tăng mạnh trong tháng 6 chuẩn bị cho mùa Sale cuối năm.</p>
            </div>
            <DraggableGrid className="grid grid-cols-2 gap-4" columns={2} gap={16}>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Time to Fill</span>
                <div className="text-2xl font-bold text-[#111827]">14 Ngày</div>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">-2 ngày vs Q1</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Employee NPS</span>
                <div className="text-2xl font-bold text-[#111827]">78</div>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">Hạng A Industry</span>
              </div>
            </DraggableGrid>
          </div>
        </div>
      </div>

      <HRModuleGrid onNavigate={onNavigate} />

      <DraggableGrid className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8" columns={2} gap={32}>
        <div className="bg-white p-10 border border-slate-300 rounded-lg shadow-sm space-y-8 relative overflow-hidden group">
          <h3 className="text-xl font-bold text-[#111827] flex items-center gap-3 relative z-10">
            <Rocket className="w-6 h-6 text-emerald-500" /> New Hire Launchpad
          </h3>
          <div className="space-y-6 relative z-10">
            {[
              { name: 'Chuẩn bị workspace', progress: 100, status: 'Done' },
              { name: 'Training văn hóa sàn', progress: 45, status: 'In progress' },
              { name: 'Cấp quyền hệ thống ERP', progress: 10, status: 'Chờ xử lý' },
            ].map((m, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-[#111827]">{m.name}</span>
                  <span className={cn('text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest', m.status === 'Done' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-orange-700')}>{m.status}</span>
                </div>
                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                  <div className={cn('h-full transition-all duration-1000', m.status === 'Done' ? 'bg-emerald-500' : 'bg-slate-800')} style={{ width: `${m.progress}%` }} />
                </div>
              </div>
            ))}
            <button className="w-full py-4 bg-[#111827] text-[#FAF9F5] text-xs font-bold rounded-lg hover:bg-slate-800 transition-all uppercase tracking-[0.2em]">Quản lý lộ trình Onboarding</button>
          </div>
          <LucidePieChartIcon className="absolute -bottom-12 -right-12 w-48 h-48 text-slate-100 group-hover:scale-110 transition-transform duration-700" />
        </div>
        <div className="bg-gradient-to-br from-[#2563EB] to-[#1E40AF] p-10 rounded-lg text-[#FAF9F5] relative overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold italic font-serif tracking-tight">AI Skill Gap Analysis</h3>
                <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-widest mt-1">Hạt nhân HRM v5.0</p>
              </div>
            </div>
            <p className="text-blue-50 text-sm leading-relaxed max-w-sm">AI tự động phân tích dữ liệu hiệu suất để xác định lỗ hổng kỹ năng và cá nhân hóa lộ trình đào tạo nội bộ.</p>
          </div>
          <div className="relative z-10 pt-8">
            <button className="px-10 py-4 bg-white text-orange-700 font-bold rounded-lg text-xs hover:translate-y-[-2px] transition-all uppercase tracking-widest shadow-sm">Launch Matrix AI Scan</button>
          </div>
          <Activity className="absolute -top-12 -right-12 w-64 h-64 text-[#FAF9F5]/5 opacity-50" />
        </div>
      </DraggableGrid>

      <DraggableGrid className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6" columns={2} gap={16}>
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg border border-slate-300 shadow-sm">
          <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#2563EB]" /> Live Map Chấm công Giao hàng
          </h3>
          <div className="h-48 bg-slate-50 rounded-lg border border-[#F3F4F6] relative overflow-hidden flex items-center justify-center">
            <div className="text-center space-y-2 opacity-40">
              <MapPin className="w-8 h-8 mx-auto" />
              <p className="text-xs font-medium">Bản đồ GPS đang hoạt động (Mock)</p>
            </div>
            <div className="absolute top-10 left-20 w-3 h-3 bg-slate-800 rounded-full border-2 border-white animate-pulse shadow-sm" />
            <div className="absolute top-20 right-32 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Dynamic Salary Engine</h3>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <p className="text-slate-600 text-sm leading-relaxed">Cấu hình công thức tính lương động theo từng vị trí. Tự động kết nối dữ liệu từ module Seller & Đơn hàng.</p>
            <button className="w-full bg-slate-900 text-[#FAF9F5] font-bold py-3 rounded-lg text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              <Briefcase className="w-4 h-4" /> Cấu hình công thức tính lương
            </button>
          </div>
        </div>
      </DraggableGrid>
    </div>
  );
}
