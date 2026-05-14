import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Send, AlertTriangle, UserPlus, Plus, Trash2, Save } from 'lucide-react';

interface NewRequestFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

export function NewRequestForm({ onSubmit, onCancel }: NewRequestFormProps) {
  const { staffInfo, user } = useAuth();
  
  const defaultRequester = staffInfo?.name || user?.displayName || user?.email || 'Người dùng';
  
  const [requestType, setRequestType] = useState('Hanh chinh');
  const [content, setContent] = useState('');
  const [requester, setRequester] = useState(defaultRequester);
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Specific fields
  const [leaveDays, setLeaveDays] = useState('');
  const [expenseContent, setExpenseContent] = useState('');
  const [amount, setAmount] = useState('');

  // New features
  const [isUrgent, setIsUrgent] = useState(false);
  const [customReviewers, setCustomReviewers] = useState<{step: number, reviewer: string}[]>([
    { step: 1, reviewer: 'Quản lý trực tiếp' }
  ]);

  const handleAddReviewer = () => {
    setCustomReviewers([...customReviewers, { step: customReviewers.length + 1, reviewer: '' }]);
  };

  const handleRemoveReviewer = (index: number) => {
    const newReviewers = [...customReviewers];
    newReviewers.splice(index, 1);
    // Reassign steps
    newReviewers.forEach((r, idx) => r.step = idx + 1);
    setCustomReviewers(newReviewers);
  };

  const handleReviewerChange = (index: number, value: string) => {
    const newReviewers = [...customReviewers];
    newReviewers[index].reviewer = value;
    setCustomReviewers(newReviewers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData: any = {
      requestType,
      content,
      requester,
      requestDate,
      isUrgent,
      customReviewers
    };
    
    if (requestType === 'Hanh chinh') {
      formData.leaveDays = leaveDays;
    } else if (requestType === 'Tai chinh') {
      formData.expenseContent = expenseContent;
      formData.amount = amount;
    }

    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden w-full max-w-2xl mx-auto">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="text-lg font-bold text-slate-900">Tạo đề xuất mới</h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <DraggableGrid className="grid grid-cols-1 md:grid-cols-2 gap-6" columns={2} gap={24}>
          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="block text-sm font-bold text-slate-800">Người đề xuất</label>
            <input 
              type="text" 
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-700"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">Loại đề xuất</label>
            <select 
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium cursor-pointer"
            >
              <option value="Hanh chinh">Hành chính</option>
              <option value="Tai chinh">Tài chính</option>
              <option value="Khac">Khác</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">Ngày đề xuất</label>
            <input 
              type="date"
              required
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            />
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="block text-sm font-bold text-slate-800">Nội dung đề xuất</label>
            <textarea 
              value={content}
              required
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium min-h-[100px]"
              placeholder="Nhập chi tiết nội dung đề xuất..."
            />
          </div>

          {/* Optional fields based on type */}
          {requestType === 'Hanh chinh' && (
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-slate-800">Số ngày nghỉ</label>
              <input 
                type="number"
                min="0"
                step="0.5"
                value={leaveDays}
                onChange={(e) => setLeaveDays(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                placeholder="Ví dụ: 1.5"
              />
            </div>
          )}

          {requestType === 'Tai chinh' && (
            <>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-slate-800">Nội dung chi phí</label>
                <input 
                  type="text"
                  value={expenseContent}
                  onChange={(e) => setExpenseContent(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                  placeholder="Ví dụ: Công tác phí, mua sắm thiết bị..."
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-slate-800">Số tiền (VNĐ)</label>
                <input 
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                  placeholder="Ví dụ: 1000000"
                />
              </div>
            </>
          )}

          {/* Workflow Enhancements */}
          <div className="col-span-1 md:col-span-2 border-t border-slate-200 pt-6 mt-2">
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary-600" />
              Tùy chỉnh luồng xử lý
            </h4>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 bg-rose-50/50 border border-rose-100 rounded-lg cursor-pointer hover:bg-rose-50 transition-colors">
                <input 
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-400 focus:ring-rose-500"
                />
                <div className="flex gap-2 items-center">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <div>
                    <p className="text-sm font-bold text-rose-900">Yêu cầu xử lý khẩn cấp</p>
                    <p className="text-xs text-rose-600/80">Bỏ qua SLA rườm rà, thông báo ưu tiên trực tiếp tới người phê duyệt.</p>
                  </div>
                </div>
              </label>

              <div className="bg-slate-50 rounded-lg border border-slate-300 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-300 bg-white flex justify-between items-center">
                  <p className="text-sm font-bold text-slate-800">Gán người xử lý cụ thể</p>
                  <button 
                    type="button" 
                    onClick={handleAddReviewer}
                    className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Thêm bước
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {customReviewers.map((reviewer, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-20 shrink-0 text-xs font-bold text-slate-600 uppercase tracking-widest">
                        Bước {reviewer.step}
                      </div>
                      <select 
                        value={reviewer.reviewer}
                        onChange={(e) => handleReviewerChange(index, e.target.value)}
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="">-- Chọn người phê duyệt --</option>
                        <option value="Quản lý trực tiếp">Quản lý trực tiếp</option>
                        <option value="Giám đốc Nhân sự">Giám đốc Nhân sự</option>
                        <option value="Kế toán trưởng">Kế toán trưởng</option>
                        <option value="Giám đốc Điều hành">Giám đốc Điều hành (CEO)</option>
                        <option value="Nguyễn Văn A (IT)">Nguyễn Văn A (IT)</option>
                      </select>
                      {customReviewers.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveReviewer(index)}
                          className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </DraggableGrid>

        <div className="pt-6 border-t border-slate-200 flex justify-end gap-3">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              Hủy
            </button>
          )}
          <button 
            type="button"
            onClick={() => alert("Đã lưu bản nháp!")}
            className="px-6 py-2.5 text-sm font-bold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Lưu nháp
          </button>
          <button 
            type="submit"
            className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Gửi đề xuất
          </button>
        </div>
      </form>
    </div>
  );
}
