import React, { useState } from 'react';
import { 
  PhoneCall, 
  MessageSquare, 
  Users, 
  Mail, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  X,
  Search,
  ChevronRight
} from 'lucide-react';
import { Customer } from '../../types/erp';
import { StatusBadge } from '../ui/design-system';
import { cn } from '../../lib/utils';

export interface CustomerInteractionLog {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  type: 'call' | 'chat' | 'meeting' | 'email';
  title: string;
  content: string;
  outcome: 'success' | 'pending' | 'rescheduled' | 'failed';
  date: string;
  time: string;
  assignee: string;
  nextFollowUpDate?: string;
}

const INITIAL_LOGS: CustomerInteractionLog[] = [
  {
    id: 'act_01',
    customerName: 'Công ty Cổ phần Sữa TH',
    customerPhone: '0912345678',
    type: 'call',
    title: 'Gọi điện tư vấn hệ thống POS & Sim 4G chuyên dụng',
    content: 'Trao đổi với Giám đốc Mua sắm về việc trang bị 50 máy POS Pax A920 cho chuỗi cửa hàng TH Truemart miền Bắc. Khách quan tâm chiết khấu và phí thuê thiết bị theo tháng.',
    outcome: 'success',
    date: '18/03/2026',
    time: '09:30',
    assignee: 'Lê Minh Hùng',
    nextFollowUpDate: '20/03/2026'
  },
  {
    id: 'act_02',
    customerName: 'Thời Trang H&M Vietnam',
    customerPhone: '0987654321',
    type: 'meeting',
    title: 'Gặp mặt ký duyệt phụ lục Hợp đồng đại lý sỉ',
    content: 'Đã hoàn tất kiểm duyệt mẫu vải và hạn mức thanh toán công nợ 500 triệu đồng. Đã trình ký hợp đồng điện tử qua Cloud HSM.',
    outcome: 'success',
    date: '17/03/2026',
    time: '14:15',
    assignee: 'Võ Thị Mai'
  },
  {
    id: 'act_03',
    customerName: 'Vinpearl Nha Trang Resort',
    customerPhone: '0987112233',
    type: 'chat',
    title: 'Hỗ trợ kỹ thuật đơn hàng lỗi giao vận qua Zalo OA',
    content: 'Tiếp nhận thông tin 2 kiện hàng giao chậm do bão tại Khánh Hòa. Đã điều phối bộ phận Kho WMS kích hoạt đơn giao hỏa tốc thay thế.',
    outcome: 'pending',
    date: '16/03/2026',
    time: '16:45',
    assignee: 'Nguyễn Quốc Bảo',
    nextFollowUpDate: '19/03/2026'
  },
  {
    id: 'act_04',
    customerName: 'Gia Dụng LockLock',
    customerPhone: '0903889900',
    type: 'email',
    title: 'Gửi báo giá chương trình Flash Sale mùa hè',
    content: 'Gửi catalog sản phẩm kèm biểu phí nền tảng chiết khấu 8% cho gian hàng Mall trên sàn TMĐT VComm.',
    outcome: 'success',
    date: '15/03/2026',
    time: '11:00',
    assignee: 'Lê Minh Hùng'
  }
];

export function CustomerActivitiesView({ customers }: { customers: Customer[] }) {
  const [logs, setLogs] = useState<CustomerInteractionLog[]>(INITIAL_LOGS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'call' | 'chat' | 'meeting' | 'email'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form fields
  const [targetCustomer, setTargetCustomer] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [interactionType, setInteractionType] = useState<'call' | 'chat' | 'meeting' | 'email'>('call');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [nextDate, setNextDate] = useState('');

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCustomer.trim() || !title.trim()) return;

    const newLog: CustomerInteractionLog = {
      id: 'act_' + Date.now(),
      customerName: targetCustomer.trim(),
      customerPhone: targetPhone.trim(),
      type: interactionType,
      title: title.trim(),
      content: content.trim() || 'Đã ghi nhận tương tác chăm sóc khách hàng.',
      outcome: 'success',
      date: new Date().toLocaleDateString('vi-VN'),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      assignee: 'System Admin',
      nextFollowUpDate: nextDate || undefined
    };

    setLogs([newLog, ...logs]);
    setShowAddModal(false);
    setTargetCustomer('');
    setTargetPhone('');
    setTitle('');
    setContent('');
    setNextDate('');
  };

  const filteredLogs = activeFilter === 'all' 
    ? logs 
    : logs.filter(l => l.type === activeFilter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneCall className="w-4 h-4 text-blue-600" />;
      case 'chat': return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'meeting': return <Users className="w-4 h-4 text-indigo-600" />;
      case 'email': return <Mail className="w-4 h-4 text-amber-600" />;
      default: return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'call': return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase">Cuộc gọi</span>;
      case 'chat': return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md uppercase">Zalo / Chat</span>;
      case 'meeting': return <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase">Gặp mặt B2B</span>;
      case 'email': return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md uppercase">Email</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Filter Strip */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: `Tất cả (${logs.length})` },
            { id: 'call', label: 'Cuộc gọi' },
            { id: 'chat', label: 'Zalo / Chat' },
            { id: 'meeting', label: 'Gặp mặt B2B' },
            { id: 'email', label: 'Email báo giá' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0",
                activeFilter === f.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi nhận tương tác mới</span>
        </button>
      </div>

      {/* Interaction Timeline Feed */}
      <div className="space-y-4">
        {filteredLogs.map(log => (
          <div 
            key={log.id} 
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start gap-4"
          >
            {/* Type Avatar */}
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
              {getTypeIcon(log.type)}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{log.title}</h4>
                  {getTypeBadge(log.type)}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {log.time} • {log.date}
                </span>
              </div>

              <p className="text-xs font-semibold text-blue-700 mb-2">
                Khách hàng: <strong>{log.customerName}</strong> {log.customerPhone && `(${log.customerPhone})`}
              </p>

              <p className="text-xs text-slate-600 leading-relaxed font-sans bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                {log.content}
              </p>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span>Nhân viên phụ trách: <strong className="text-slate-700">{log.assignee}</strong></span>
                {log.nextFollowUpDate && (
                  <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Calendar className="w-3 h-3 text-amber-600" />
                    Lịch hẹn tiếp theo: {log.nextFollowUpDate}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Ghi Nhận Lịch Sử Tương Tác / CSKH</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Khách hàng liên hệ *</label>
                <input 
                  type="text"
                  required
                  value={targetCustomer}
                  onChange={(e) => setTargetCustomer(e.target.value)}
                  placeholder="VD: Anh Nam - Giám đốc TH True Milk"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kênh tương tác</label>
                  <select
                    value={interactionType}
                    onChange={(e) => setInteractionType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none bg-white font-medium"
                  >
                    <option value="call">Cuộc gọi thoại</option>
                    <option value="chat">Tin nhắn Zalo/FB</option>
                    <option value="meeting">Gặp mặt trực tiếp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại</label>
                  <input 
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề tương tác *</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Gọi điện chốt hợp đồng thuê máy POS"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung trao đổi chi tiết</label>
                <textarea 
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ghi chú phản hồi, yêu cầu hỗ trợ hoặc thắc mắc của khách hàng..."
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lịch hẹn liên hệ lại (nếu có)</label>
                <input 
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none font-sans"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Lưu nhật ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
