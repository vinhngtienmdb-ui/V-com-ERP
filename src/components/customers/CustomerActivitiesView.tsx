import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Send,
  Copy,
  Check,
  Building,
  User,
  Filter
} from 'lucide-react';
import { Customer } from '../../types/erp';
import { StatusBadge } from '../ui/design-system';
import { cn } from '../../lib/utils';

export interface CustomerInteractionLog {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  type: 'call' | 'chat' | 'meeting' | 'email' | 'demo' | 'complaint';
  title: string;
  content: string;
  outcome: 'success' | 'pending' | 'rescheduled' | 'failed';
  date: string;
  time: string;
  assignee: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  priority?: 'low' | 'normal' | 'urgent';
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
    date: '2026-06-18',
    time: '09:30',
    assignee: 'Lê Minh Hùng',
    sentiment: 'positive',
    priority: 'urgent',
    nextFollowUpDate: '2026-06-22'
  },
  {
    id: 'act_02',
    customerName: 'Thời Trang H&M Vietnam',
    customerPhone: '0987654321',
    type: 'meeting',
    title: 'Gặp mặt ký duyệt phụ lục Hợp đồng đại lý sỉ',
    content: 'Đã hoàn tất kiểm duyệt mẫu vải và hạn mức thanh toán công nợ 500 triệu đồng. Đã trình ký hợp đồng điện tử qua Cloud HSM.',
    outcome: 'success',
    date: '2026-06-17',
    time: '14:15',
    assignee: 'Võ Thị Mai',
    sentiment: 'positive',
    priority: 'normal'
  },
  {
    id: 'act_03',
    customerName: 'Vinpearl Nha Trang Resort',
    customerPhone: '0987112233',
    type: 'complaint',
    title: 'Xử lý phản hồi đơn giao chậm do bão biển',
    content: 'Tiếp nhận thông tin 2 kiện hàng giao chậm do bão tại Khánh Hòa. Đã điều phối bộ phận Kho WMS kích hoạt đơn giao hỏa tốc thay thế và hỗ trợ phí ship.',
    outcome: 'pending',
    date: '2026-06-16',
    time: '16:45',
    assignee: 'Nguyễn Quốc Bảo',
    sentiment: 'negative',
    priority: 'urgent',
    nextFollowUpDate: '2026-06-19'
  },
  {
    id: 'act_04',
    customerName: 'Gia Dụng LockLock',
    customerPhone: '0903889900',
    type: 'email',
    title: 'Gửi báo giá chương trình Flash Sale mùa hè',
    content: 'Gửi catalog sản phẩm kèm biểu phí nền tảng chiết khấu 8% cho gian hàng Mall trên sàn TMĐT VComm.',
    outcome: 'success',
    date: '2026-06-15',
    time: '11:00',
    assignee: 'Lê Minh Hùng',
    sentiment: 'neutral',
    priority: 'low'
  },
  {
    id: 'act_05',
    customerName: 'Mỹ Phẩm Coco Lux',
    customerPhone: '0900112233',
    type: 'demo',
    title: 'Demo giải pháp tích hợp SePay VietQR đa chi nhánh',
    content: 'Trực tiếp demo kết nối tài khoản ngân hàng và webhook tự động xác nhận hóa đơn qua màn hình POS.',
    outcome: 'success',
    date: '2026-06-14',
    time: '10:00',
    assignee: 'Võ Thị Mai',
    sentiment: 'positive',
    priority: 'normal',
    nextFollowUpDate: '2026-06-25'
  }
];

export function CustomerActivitiesView({ customers }: { customers: Customer[] }) {
  const [logs, setLogs] = useState<CustomerInteractionLog[]>(INITIAL_LOGS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'call' | 'chat' | 'meeting' | 'email' | 'complaint'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form fields
  const [targetCustomer, setTargetCustomer] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [interactionType, setInteractionType] = useState<CustomerInteractionLog['type']>('call');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative'>('positive');
  const [priority, setPriority] = useState<'low' | 'normal' | 'urgent'>('normal');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [assignee, setAssignee] = useState('Lê Minh Hùng');

  // Load from backend API if available
  useEffect(() => {
    fetch('/api/v1/crm/activities')
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          // Merge with initial logs
          const backendMapped: CustomerInteractionLog[] = json.data.map((item: any) => ({
            id: item.id,
            customerId: item.customerId,
            customerName: item.customerName,
            type: item.type || 'call',
            title: item.title,
            content: item.description,
            outcome: item.status === 'completed' ? 'success' : 'pending',
            date: item.scheduledDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            time: item.scheduledDate?.slice(11, 16) || '10:00',
            assignee: item.assignee || 'Lê Minh Hùng',
            sentiment: item.sentiment || 'positive',
            priority: item.priority || 'normal',
          }));
          setLogs(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const fresh = backendMapped.filter(b => !existingIds.has(b.id));
            return [...fresh, ...prev];
          });
        }
      })
      .catch(err => console.warn('[CRM Client] Failed to fetch activities:', err));
  }, []);

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
      outcome: 'pending',
      date: scheduledDate || new Date().toISOString().slice(0, 10),
      time: scheduledTime || '09:00',
      assignee,
      sentiment,
      priority,
      nextFollowUpDate: scheduledDate || undefined,
    };

    setLogs([newLog, ...logs]);

    // Sync to backend
    fetch('/api/v1/crm/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: newLog.customerName,
        type: newLog.type,
        title: newLog.title,
        description: newLog.content,
        scheduledDate: `${newLog.date} ${newLog.time}`,
        status: 'pending',
        sentiment: newLog.sentiment,
        priority: newLog.priority,
        assignee: newLog.assignee,
      })
    }).catch(err => console.warn('Failed to save activity to backend:', err));

    setShowAddModal(false);
    setTargetCustomer('');
    setTargetPhone('');
    setTitle('');
    setContent('');
    setScheduledDate('');
  };

  const handleToggleOutcome = (id: string) => {
    setLogs(prev => prev.map(l => {
      if (l.id === id) {
        return { ...l, outcome: l.outcome === 'success' ? 'pending' : 'success' };
      }
      return l;
    }));
  };

  const filteredLogs = activeFilter === 'all' 
    ? logs 
    : logs.filter(l => l.type === activeFilter);

  const pendingFollowUps = logs.filter(l => l.outcome === 'pending');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneCall className="w-4 h-4 text-blue-600" />;
      case 'chat': return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'meeting': return <Users className="w-4 h-4 text-indigo-600" />;
      case 'email': return <Mail className="w-4 h-4 text-amber-600" />;
      case 'complaint': return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default: return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'call': return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase">Cuộc gọi</span>;
      case 'chat': return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md uppercase">Zalo / Chat</span>;
      case 'meeting': return <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase">Gặp mặt B2B</span>;
      case 'email': return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md uppercase">Email</span>;
      case 'complaint': return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md uppercase">Khiếu nại</span>;
      default: return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase">Khác</span>;
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-bold"><Smile className="w-3.5 h-3.5" /> Hài lòng</span>;
      case 'neutral': return <span className="inline-flex items-center gap-1 text-slate-500 text-[10px] font-bold"><Meh className="w-3.5 h-3.5" /> Bình thường</span>;
      case 'negative': return <span className="inline-flex items-center gap-1 text-rose-600 text-[10px] font-bold"><Frown className="w-3.5 h-3.5" /> Bức xúc</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Filter Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', label: `Tất cả (${logs.length})` },
            { id: 'call', label: 'Cuộc gọi' },
            { id: 'meeting', label: 'Gặp mặt B2B' },
            { id: 'chat', label: 'Zalo OA' },
            { id: 'email', label: 'Email' },
            { id: 'complaint', label: 'Khiếu nại' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0",
                activeFilter === f.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Lập Lịch Hẹn / Ghi Tương Tác</span>
        </button>
      </div>

      {/* Pending Follow-ups Alert Ribbon (if any) */}
      {pendingFollowUps.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 font-medium">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Có <strong>{pendingFollowUps.length} nhiệm vụ chăm sóc</strong> đang chờ xử lý hoặc cần liên hệ lại.</span>
          </div>
          <span className="text-[11px] font-bold text-amber-700 font-mono">
            Hạn chót hôm nay
          </span>
        </div>
      )}

      {/* Interaction Timeline Feed */}
      <div className="space-y-3">
        {filteredLogs.map(log => (
          <div 
            key={log.id} 
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start gap-4"
          >
            {/* Type Avatar */}
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              {getTypeIcon(log.type)}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">
                    {log.title}
                  </h4>
                  {getTypeBadge(log.type)}
                  {log.priority === 'urgent' && (
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-black uppercase">
                      Khẩn cấp
                    </span>
                  )}
                  {getSentimentIcon(log.sentiment)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleOutcome(log.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1",
                      log.outcome === 'success' 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-emerald-50 hover:text-emerald-700"
                    )}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{log.outcome === 'success' ? 'Đã hoàn tất' : 'Chờ xử lý'}</span>
                  </button>
                </div>
              </div>

              {/* Customer info pill */}
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="font-bold text-slate-900">{log.customerName}</span>
                {log.customerPhone && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-slate-700">{log.customerPhone}</span>
                  </>
                )}
                <span>•</span>
                <span className="text-slate-400 font-mono text-[11px]">{log.date} {log.time}</span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {log.content}
              </p>

              {/* Footer details */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Phụ trách:</span>
                  <span className="font-bold text-slate-700">{log.assignee}</span>
                </div>

                {log.nextFollowUpDate && (
                  <div className="flex items-center gap-1 text-indigo-600 font-bold text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>Hẹn lại: {log.nextFollowUpDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-slate-400 text-xs">
            Không có nhật ký tương tác phù hợp với bộ lọc.
          </div>
        )}
      </div>

      {/* Add Interaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Lập Lịch Hẹn / Ghi Tương Tác CSKH</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Khách hàng / Doanh nghiệp *</label>
                  <input 
                    type="text"
                    required
                    value={targetCustomer}
                    onChange={e => setTargetCustomer(e.target.value)}
                    placeholder="Tên khách hàng..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại</label>
                  <input 
                    type="tel"
                    value={targetPhone}
                    onChange={e => setTargetPhone(e.target.value)}
                    placeholder="0987..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hình thức tương tác</label>
                  <select 
                    value={interactionType}
                    onChange={e => setInteractionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                  >
                    <option value="call">Cuộc gọi điện thoại</option>
                    <option value="meeting">Gặp mặt trực tiếp B2B</option>
                    <option value="chat">Tin nhắn Zalo OA</option>
                    <option value="email">Email trao đổi</option>
                    <option value="demo">Demo phần mềm / Thiết bị</option>
                    <option value="complaint">Tiếp nhận khiếu nại</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đánh giá cảm xúc</label>
                  <select 
                    value={sentiment}
                    onChange={e => setSentiment(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                  >
                    <option value="positive">😊 Hài lòng / Tích cực</option>
                    <option value="neutral">😐 Bình thường / Trung lập</option>
                    <option value="negative">😡 Bức xúc / Khiếu nại</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề tương tác / Cuộc hẹn *</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ví dụ: Gọi điện khảo sát nhu cầu nâng hạn mức B2B..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chi tiết nội dung trao đổi / Ghi chú</label>
                <textarea 
                  rows={3}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Ghi nhận các điểm quan trọng, yêu cầu của khách hàng..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày thực hiện</label>
                  <input 
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giờ hẹn</label>
                  <input 
                    type="time"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mức độ ưu tiên</label>
                  <select 
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                  >
                    <option value="low">Thấp</option>
                    <option value="normal">Bình thường</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu Nhật Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
