import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { db, collection, addDoc, serverTimestamp } from '../../lib/firebase';
import { ArrowLeft, Send, AlertTriangle, UserPlus, DollarSign, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { INITIAL_FORM_CONFIGS } from '../../lib/formConfigs';

export function DynamicRequestForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Retrieve formConfigs (In a real app, fetch from Context/DB)
  const formConfigs = INITIAL_FORM_CONFIGS;

  const [newRequest, setNewRequest] = useState<any>({ 
    subtype: formConfigs[0]?.name || '', 
    title: '', 
    requester: 'Tôi (Người đang đăng nhập)', 
    formData: {},
    isUrgent: false,
    customReviewers: [{ step: 1, reviewer: 'Quản lý trực tiếp' }]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const matchedConfig = formConfigs.find(c => c.name === newRequest.subtype);

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.title) return alert("Vui lòng nhập nội dung đề xuất");
    
    setIsSubmitting(true);
    let type = 'other';
    if (matchedConfig?.category === 'Hành chính') type = 'admin';
    if (matchedConfig?.category === 'Tài chính') type = 'finance';
    
    // Auto-generate an ID based on timestamp for mock purposes
    const generatedId = `REQ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const request = {
      id: generatedId,
      type,
      subtype: newRequest.subtype,
      title: newRequest.title,
      requester: user?.displayName || user?.email || newRequest.requester,
      status: 'pending',
      date: new Date().toLocaleDateString('en-GB'),
      currentLevel: 1,
      approvalLog: [],
      formData: newRequest.formData,
      isUrgent: newRequest.isUrgent,
      customReviewers: newRequest.customReviewers
    };
    
    try {
      await addDoc(collection(db, 'requests'), { ...request, createdAt: serverTimestamp() });
      addNotification('Gửi thành công', `Đề xuất ${generatedId} đã được gửi thành công.`);
      navigate('/requests');
    } catch (err) {
      console.error('RequestHub addRequest error:', err);
      addNotification('Lỗi', 'Không thể gửi đề xuất, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/requests')}
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tạo Đề xuất / Trình ký mới</h1>
          <p className="text-sm text-slate-500 font-medium">Điền thông tin chi tiết để gửi phê duyệt</p>
        </div>
      </div>

      <form onSubmit={handleAddRequest} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Thông tin cơ bản</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-2">Loại đề xuất</label>
                <select 
                  value={newRequest.subtype}
                  onChange={(e) => setNewRequest({...newRequest, subtype: e.target.value, formData: {} })}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 cursor-pointer shadow-inner"
                >
                  {Array.from(new Set(formConfigs.map(c => c.category))).map(cat => (
                    <optgroup key={cat} label={cat}>
                      {formConfigs.filter(c => c.category === cat).map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-2">Người đề xuất</label>
                <input 
                  type="text" 
                  disabled
                  value={user?.displayName || user?.email || newRequest.requester}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-2">Lý do / Nội dung chung</label>
              <textarea 
                value={newRequest.title}
                onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                required
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[100px] shadow-sm resize-y"
                placeholder="Ví dụ: Nghỉ phép 2 ngày đi du lịch gia đình..."
              />
            </div>
          </div>
        </div>

        {matchedConfig && matchedConfig.fields && matchedConfig.fields.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Chi tiết biểu mẫu: {matchedConfig.name}</h2>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">{matchedConfig.category}</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matchedConfig.fields.map((field: any) => (
                  <div key={field.id} className={cn(field.type === 'textarea' ? "col-span-1 md:col-span-2" : "")}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea 
                        className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                        required={field.required}
                        value={newRequest.formData[field.id] || ''}
                        onChange={(e) => setNewRequest({...newRequest, formData: {...newRequest.formData, [field.id]: e.target.value}})}
                        rows={4}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors cursor-pointer"
                        required={field.required}
                        value={newRequest.formData[field.id] || ''}
                        onChange={(e) => setNewRequest({...newRequest, formData: {...newRequest.formData, [field.id]: e.target.value}})}
                      >
                        <option value="">-- Chọn --</option>
                        {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input 
                        type={field.type} 
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                        required={field.required}
                        value={newRequest.formData[field.id] || ''}
                        onChange={(e) => setNewRequest({...newRequest, formData: {...newRequest.formData, [field.id]: e.target.value}})}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {matchedConfig?.category === 'Tài chính' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 flex items-start gap-4 shadow-sm border-l-4 border-l-orange-500 animate-in fade-in">
            <div className="bg-orange-100 text-orange-600 p-2 rounded-lg flex-shrink-0">
              <DollarSign className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-orange-900 flex items-center gap-2">
                Đối chiếu Ngân sách (Budget Control) 
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-600 px-2 py-0.5 rounded shadow-sm">Over-budget Warning</span>
              </h4>
              <p className="text-[13px] text-orange-800/90 mt-1.5 leading-relaxed font-medium">
                Ngân sách chi tiêu khả dụng của phòng ban đã đạt <b>85% hạn mức tháng</b>. Đề xuất khoản chi này có thể yêu cầu phê duyệt bổ sung (budget allocation) từ Giám đốc Tài chính (CFO).
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Tùy chỉnh luồng xử lý</h2>
          </div>
          <div className="p-6 space-y-6">
            <label className="flex items-start gap-3 p-4 bg-rose-50/50 border border-rose-100 rounded-xl cursor-pointer hover:bg-rose-50 transition-colors">
              <input 
                type="checkbox"
                checked={newRequest.isUrgent}
                onChange={(e) => setNewRequest({...newRequest, isUrgent: e.target.checked})}
                className="w-5 h-5 mt-0.5 text-rose-600 rounded border-rose-300 focus:ring-rose-500 cursor-pointer"
              />
              <div className="flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-900">Yêu cầu xử lý khẩn cấp (Urgent)</p>
                  <p className="text-[13px] text-rose-700/80 mt-1 font-medium">Bỏ qua SLA thông thường, gửi thông báo ưu tiên trực tiếp (Push Notification/SMS) tới người phê duyệt để xử lý ngay lập tức.</p>
                </div>
              </div>
            </label>

            <div>
              <p className="text-[13px] font-bold text-slate-800 mb-3">Người phê duyệt từng bước</p>
              <div className="space-y-3">
                {(newRequest.customReviewers || []).map((reviewer: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="w-20 shrink-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-200 px-2 py-1 rounded">
                        Bước {reviewer.step}
                      </span>
                    </div>
                    <select 
                      value={reviewer.reviewer}
                      onChange={(e) => {
                        const newRef = [...(newRequest.customReviewers||[])];
                        newRef[index].reviewer = e.target.value;
                        setNewRequest({...newRequest, customReviewers: newRef});
                      }}
                      className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      required
                    >
                      <option value="">-- Chọn người phê duyệt --</option>
                      <option value="Quản lý trực tiếp">Quản lý trực tiếp</option>
                      <option value="Giám đốc Nhân sự">Giám đốc Nhân sự</option>
                      <option value="Kế toán trưởng">Kế toán trưởng</option>
                      <option value="Giám đốc Điều hành">Giám đốc Điều hành (CEO)</option>
                    </select>
                    {(newRequest.customReviewers || []).length > 1 && (
                      <button 
                        type="button"
                        onClick={() => {
                          const newRef = [...(newRequest.customReviewers||[])];
                          newRef.splice(index, 1);
                          newRef.forEach((r, idx) => r.step = idx + 1);
                          setNewRequest({...newRequest, customReviewers: newRef});
                        }}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={() => setNewRequest({...newRequest, customReviewers: [...(newRequest.customReviewers||[]), { step: (newRequest.customReviewers?.length || 0) + 1, reviewer: '' }]})}
                className="mt-3 text-[13px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors inline-block"
              >
                + Thêm bước phê duyệt
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button 
            type="button"
            onClick={() => navigate('/requests')} 
            className="px-6 py-3 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            Hủy bỏ
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Đang xử lý...</span>
            ) : (
              <>
                <Send className="w-4 h-4" /> Gửi Đề xuất
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
