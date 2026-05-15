/**
 * HR.tsx — entry point cho module Quản trị Nguồn nhân lực.
 * Route active tab → sub-components; giữ ATS modal + AI Copilot widget.
 */
import React, { useState } from 'react';
import {
  UserPlus, ArrowLeft, BrainCircuit, Send, LineChart, X, Rocket,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { HROverview } from './hr/HROverview';
import { HREmployees } from './hr/HREmployees';
import { HRAttendance } from './hr/HRAttendance';
import { HRPayroll } from './hr/HRPayroll';
import { HRKPI } from './hr/HRKPI';
import { MOCK_EMPLOYEES, INITIAL_CANDIDATES } from './hr/mockData';
import type { Candidate } from './hr/types';

export function HumanResources() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Xin chào! Tôi là AI Copilot hỗ trợ nhân sự. Bạn muốn tôi phân tích dữ liệu, xuất báo cáo hay tìm kiếm nhân viên có kỹ năng cụ thể?' },
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [showATSModal, setShowATSModal] = useState(false);
  const [activeATSView, setActiveATSView] = useState<'request' | 'candidates' | 'interview' | 'email'>('candidates');
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);

  const handleNavigate = (tab: string) => {
    if (tab.startsWith('ats_')) {
      setActiveATSView(tab.replace('ats_', '') as any);
      setShowATSModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleSendCopilotMessage = () => {
    if (!copilotInput.trim()) return;
    setCopilotMessages(prev => [...prev, { role: 'user', content: copilotInput }]);
    setTimeout(() => {
      setCopilotMessages(prev => [...prev, {
        role: 'assistant',
        content: `Đã nhận yêu cầu: "${copilotInput}". Đang phân tích dữ liệu nhân sự...`,
      }]);
    }, 1000);
    setCopilotInput('');
  };

  const handleDragStart = (e: React.DragEvent, id: string) => { setDraggedCandidateId(id); e.dataTransfer.setData('text/plain', id); };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, status: Candidate['status']) => {
    e.preventDefault();
    if (draggedCandidateId) setCandidates(prev => prev.map(c => c.id === draggedCandidateId ? { ...c, status } : c));
    setDraggedCandidateId(null);
  };

  const empList = MOCK_EMPLOYEES.map(e => ({ id: e.id, fullName: e.fullName, department: e.department }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Quản trị Nguồn nhân lực (HRM)</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý hồ sơ nhân sự, Skill Matrix và Onboarding Intelligence.</p>
        </div>
        <div className="flex gap-3 items-center">
          <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold text-[#4B5563] hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <LineChart className="w-4 h-4 text-emerald-600" /> Báo cáo
          </button>
          <button
            onClick={() => { setActiveATSView('candidates'); setShowATSModal(true); }}
            className="bg-[#2563EB] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> + Tuyển dụng
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <HROverview employees={MOCK_EMPLOYEES} onNavigate={handleNavigate} onOpenRecruitment={() => { setActiveATSView('candidates'); setShowATSModal(true); }} />
      )}

      {activeTab === 'personnel' && <HREmployees onBack={() => setActiveTab('overview')} />}
      {activeTab === 'attendance' && <HRAttendance onBack={() => setActiveTab('overview')} employees={empList} />}
      {activeTab === 'payroll' && <HRPayroll onBack={() => setActiveTab('overview')} />}
      {activeTab === 'kpi' && <HRKPI onBack={() => setActiveTab('overview')} employees={empList} />}

      {activeTab !== 'overview' && !['personnel', 'attendance', 'payroll', 'kpi'].includes(activeTab) && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
          <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
            <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg w-fit shadow-sm">
              <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
            </button>
          </div>
          <div className="p-16 flex flex-col items-center justify-center text-center flex-1">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Rocket className="w-10 h-10 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Phân hệ đang được phát triển</h3>
            <p className="text-slate-600 max-w-md mx-auto leading-relaxed">Tính năng này đang trong quá trình hoàn thiện và sẽ sớm được ra mắt.</p>
          </div>
        </div>
      )}

      {/* ATS Modal */}
      <AnimatePresence>
        {showATSModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-lg w-full max-w-4xl p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#111827]">Quản lý Tuyển dụng (ATS) - {
                  activeATSView === 'request' ? 'Đề xuất' : activeATSView === 'candidates' ? 'Hồ sơ ứng viên' : activeATSView === 'interview' ? 'Lịch phỏng vấn' : 'Email ứng viên'
                }</h2>
                <button onClick={() => setShowATSModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex gap-4 mb-8 border-b border-slate-200 pb-4">
                {(['request', 'candidates', 'interview', 'email'] as const).map(t => (
                  <button key={t} onClick={() => setActiveATSView(t)} className={cn('px-5 py-2.5 text-sm font-bold rounded-lg transition-all', activeATSView === t ? 'bg-primary-600 text-[#FAF9F5] shadow-sm' : 'bg-slate-50 border border-slate-300 text-slate-700 hover:bg-slate-100')}>
                    {t === 'request' ? 'Đề xuất' : t === 'candidates' ? 'Ứng viên' : t === 'interview' ? 'Lịch phỏng vấn' : 'Email'}
                  </button>
                ))}
              </div>
              <div className="min-h-[500px]">
                {activeATSView === 'candidates' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
                    {(['sourced', 'interview', 'offered', 'hired'] as const).map(status => (
                      <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)} className="bg-slate-50/80 rounded-lg p-5 border border-slate-300 flex flex-col h-[500px]">
                        <div className="flex justify-between items-center mb-5">
                          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">
                            {status === 'sourced' ? 'Sourced' : status === 'interview' ? 'Phỏng vấn' : status === 'offered' ? 'Đề nghị' : 'Đã tuyển'}
                          </h3>
                          <span className="bg-white px-2.5 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm border border-slate-200">{candidates.filter(c => c.status === status).length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                          <AnimatePresence>
                            {candidates.filter(c => c.status === status).map(c => (
                              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={c.id} draggable onDragStart={(e: any) => handleDragStart(e, c.id)} className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm cursor-grab hover:shadow-sm transition-all relative overflow-hidden group">
                                <div className={cn('absolute top-0 left-0 w-1.5 h-full', c.matchScore >= 90 ? 'bg-emerald-500' : c.matchScore >= 80 ? 'bg-slate-800' : 'bg-amber-500')} />
                                <div className="pl-3">
                                  <p className="font-bold text-sm text-slate-900 mb-1 line-clamp-1">{c.name}</p>
                                  <div className="flex justify-between items-end mt-3">
                                    <span className="text-xs font-semibold text-slate-600">{c.role}</span>
                                    <div className={cn('px-2 py-1 rounded-lg font-bold text-[10px]', c.matchScore >= 90 ? 'bg-emerald-50 text-emerald-700' : c.matchScore >= 80 ? 'bg-slate-100 text-orange-800' : 'bg-amber-50 text-amber-700')}>
                                      Fit {c.matchScore}%
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeATSView !== 'candidates' && <div className="flex items-center justify-center h-full text-slate-500 text-sm mt-20">Nội dung chức năng {activeATSView} đang được xây dựng...</div>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI HR Copilot */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
          {isCopilotOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="w-[380px] h-[500px] bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden flex flex-col">
              <div className="p-4 bg-[#111827] text-[#FAF9F5] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800/20 rounded-lg"><BrainCircuit className="w-5 h-5 text-orange-500" /></div>
                  <div><h3 className="font-bold text-sm">HR Copilot</h3><p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Online</p></div>
                </div>
                <button onClick={() => setIsCopilotOpen(false)} className="text-slate-500 hover:text-[#FAF9F5] transition"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {copilotMessages.map((msg, idx) => (
                  <div key={idx} className={cn('flex max-w-[85%]', msg.role === 'user' ? 'ml-auto justify-end' : '')}>
                    <div className={cn('p-3 rounded-lg text-sm font-medium leading-relaxed', msg.role === 'user' ? 'bg-slate-900 text-[#FAF9F5] rounded-tr-sm' : 'bg-white border border-slate-300 text-slate-800 rounded-tl-sm shadow-sm')}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-white border-t border-slate-200">
                <div className="flex items-center bg-slate-100 rounded-full pr-1.5">
                  <input type="text" value={copilotInput} onChange={(e) => setCopilotInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendCopilotMessage()} placeholder="Hỏi AI về nhân sự..." className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none" />
                  <button onClick={handleSendCopilotMessage} className="p-2 bg-slate-900 hover:bg-slate-800 text-[#FAF9F5] rounded-full transition-colors shadow-sm"><Send className="w-4 h-4" /></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsCopilotOpen(!isCopilotOpen)} className="w-14 h-14 bg-slate-900 rounded-full shadow-sm text-[#FAF9F5] flex items-center justify-center relative group">
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" />
          {isCopilotOpen ? <X className="w-6 h-6" /> : <BrainCircuit className="w-6 h-6" />}
        </motion.button>
      </div>
    </div>
  );
}
