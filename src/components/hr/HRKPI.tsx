import React, { useState, useEffect } from 'react';
import { orderBy } from 'firebase/firestore';
import {
  ArrowLeft, Target, Calculator, TrendingUp, AlertCircle,
  Trophy, Search, Layers,
} from 'lucide-react';
import { DraggableGrid } from '../ui/DraggableGrid';
import { kpiRepo, type KPIInput } from '../../services/repositories';
import { cn } from '../../lib/utils';
import type { KPI } from '../../types/erp';
import { MOCK_KPIs } from './mockData';

function adaptKPI(k: KPIInput): KPI {
  const firstMetric = k.metrics?.[0];
  return {
    id: k.id,
    employeeId: k.employeeId,
    title: firstMetric?.name ?? 'KPI',
    target: firstMetric?.target ?? 0,
    current: firstMetric?.actual ?? 0,
    unit: firstMetric?.unit ?? '',
    period: k.period,
  };
}

interface Props {
  onBack: () => void;
  employees: { id: string; fullName: string; department?: string }[];
}

export function HRKPI({ onBack, employees }: Props) {
  const [dbKpis, setDbKpis] = useState<KPI[]>([]);
  const kpis = dbKpis.length > 0 ? dbKpis : MOCK_KPIs;

  const [searchKpi, setSearchKpi] = useState('');

  useEffect(() => {
    const unsub = kpiRepo.subscribe(
      [orderBy('period', 'desc')],
      (items) => setDbKpis(items.map(adaptKPI)),
    );
    return () => unsub();
  }, []);

  const filteredKpis = kpis.filter(k => {
    if (!searchKpi) return true;
    const emp = employees.find(e => e.id === k.employeeId);
    return k.title.toLowerCase().includes(searchKpi.toLowerCase()) ||
      (emp?.fullName.toLowerCase().includes(searchKpi.toLowerCase()) ?? false);
  });

  const avgCompletion = kpis.length > 0
    ? kpis.reduce((sum, k) => sum + (k.current / k.target) * 100, 0) / kpis.length
    : 0;

  const topPerformers = kpis.filter(k => (k.current / k.target) >= 1.2).length;
  const criticalCount = kpis.filter(k => (k.current / k.target) < 0.6).length;

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg w-fit shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
        </button>
      </div>

      <div className="space-y-8 p-8 bg-white min-h-[600px]">
        <div className="flex justify-between items-end border-b border-slate-200 pb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Target className="w-8 h-8 text-primary-600" /> KPI & Performance Analysis
            </h2>
            <p className="text-sm font-medium text-slate-500 italic mt-1">Đánh giá hiệu quả công việc dựa trên dữ liệu thời gian thực và AI Score.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-slate-100 p-1 rounded-xl flex">
              <button className="px-4 py-2 bg-white text-primary-600 font-bold text-xs rounded-lg shadow-sm">Tháng này</button>
              <button className="px-4 py-2 text-slate-600 font-bold text-xs hover:text-slate-800">Quý 1/2024</button>
            </div>
            <button className="px-4 py-2 bg-primary-600 text-[#FAF9F5] rounded-xl text-xs font-bold hover:bg-primary-700 transition-all shadow-sm flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Chốt KPI Batch
            </button>
          </div>
        </div>

        <DraggableGrid className="grid grid-cols-1 md:grid-cols-3 gap-4" columns={3} gap={16}>
          <div className="bg-primary-50 border border-primary-100 p-6 rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Average Completion</p>
              <div className="w-10 h-10 bg-primary-600 text-[#FAF9F5] rounded-full flex items-center justify-center font-black text-sm shadow-sm">{Math.round(avgCompletion)}%</div>
            </div>
            <div>
              <div className="text-3xl font-black text-primary-900 tabular-nums">{avgCompletion.toFixed(2)}%</div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
                <TrendingUp className="w-3 h-3" /> +4.2% vs Last Month
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Top Performers</p>
              <Trophy className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-900 tabular-nums">{topPerformers} KH</div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mt-1">Đạt trên 120% mục tiêu</p>
            </div>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-6 rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Critical Alert</p>
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <div className="text-3xl font-black text-rose-900 tabular-nums">{String(criticalCount).padStart(2, '0')} KH</div>
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter mt-1">Dưới 60% - Cần 1-on-1</p>
            </div>
          </div>
        </DraggableGrid>

        <DraggableGrid className="grid grid-cols-12 gap-8 mt-4" columns={12} gap={32}>
          <div className="col-span-12 lg:col-span-8 bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center px-8">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em]">Bảng theo dõi mục tiêu chi tiết</h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm KPIs..."
                  value={searchKpi}
                  onChange={(e) => setSearchKpi(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-64"
                />
              </div>
            </div>
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-200">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nhân sự & Vị trí</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chỉ tiêu trọng yếu</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Tiến độ (%)</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Phân tích AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredKpis.map(kpi => {
                    const emp = employees.find(e => e.id === kpi.employeeId);
                    const progress = (kpi.current / kpi.target) * 100;
                    return (
                      <tr key={kpi.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-900 text-sm shadow-sm group-hover:bg-white transition-all">
                              {emp?.fullName.split(' ').pop()?.charAt(0) ?? '?'}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 italic tracking-tight">{emp?.fullName ?? kpi.employeeId}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">{emp?.department ?? ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-bold text-slate-900">{kpi.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">Target: {kpi.target} {kpi.unit}</p>
                        </td>
                        <td className="px-8 py-5 w-48">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black">
                              <span className={cn(progress >= 100 ? 'text-emerald-600' : progress >= 80 ? 'text-orange-700' : 'text-rose-600')}>{progress.toFixed(1)}%</span>
                              <span className="text-slate-500 font-mono italic">#{kpi.id.slice(-4)}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div
                                className={cn('h-full transition-all duration-1000', progress >= 100 ? 'bg-emerald-500' : progress >= 80 ? 'bg-slate-800' : 'bg-rose-500')}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest', progress >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700')}>
                              {progress >= 100 ? 'OUTSTANDING' : 'ON TRACK'}
                            </div>
                            <p className="text-[9px] text-slate-500 italic">Dự báo: AI</p>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">PERFORMANCE LEADERBOARD</h3>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {[
                    { name: 'Hoàng Minh', score: 98, rank: 1, color: 'text-amber-500' },
                    { name: 'Thu Thủy', score: 94, rank: 2, color: 'text-slate-500' },
                    { name: 'Diệu Nhi', score: 91, rank: 3, color: 'text-orange-500' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition-all">
                      <div className="flex items-center gap-4">
                        <span className={cn('text-xl font-black w-6', p.color)}>{p.rank}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-900 tracking-tight">{p.name}</p>
                          <div className="h-1 w-12 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-slate-700" style={{ width: `${p.score}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black tabular-nums text-slate-900">{p.score}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Points</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3 bg-slate-900 hover:bg-slate-800 text-[#FAF9F5] border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                  Xem tất cả bảng xếp hạng
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-300 rounded-xl p-8 shadow-sm group">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-sm relative">
                  <Layers className="w-6 h-6" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Skill Matrix Heatmap</h3>
              </div>
              <div className="aspect-square bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-8 space-y-4 text-center group-hover:bg-white transition-all duration-500">
                <Layers className="w-16 h-16 text-slate-500 group-hover:text-primary-400 transition-all duration-500" />
                <div>
                  <p className="text-xs font-bold text-slate-700">Phân tích Phủ Kỹ năng</p>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed italic">Bản đồ nhiệt cho phép người quản lý nhìn ra các lỗ hổng kỹ năng trong từng phòng ban.</p>
                </div>
              </div>
            </div>
          </div>
        </DraggableGrid>
      </div>
    </div>
  );
}
