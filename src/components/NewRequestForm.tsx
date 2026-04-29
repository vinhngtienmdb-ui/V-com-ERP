import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Send } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData: any = {
      requestType,
      content,
      requester,
      requestDate,
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
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden w-full max-w-2xl mx-auto">
      <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
        <h3 className="text-lg font-bold text-stone-800">Tạo đề xuất mới</h3>
        {onCancel && (
          <button onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="block text-sm font-bold text-stone-700">Người đề xuất</label>
            <input 
              type="text" 
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-stone-600"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-bold text-stone-700">Loại đề xuất</label>
            <select 
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="Hanh chinh">Hành chính</option>
              <option value="Tai chinh">Tài chính</option>
              <option value="Khac">Khác</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-stone-700">Ngày đề xuất</label>
            <input 
              type="date"
              required
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="block text-sm font-bold text-stone-700">Nội dung đề xuất</label>
            <textarea 
              value={content}
              required
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium min-h-[100px]"
              placeholder="Nhập chi tiết nội dung đề xuất..."
            />
          </div>

          {/* Optional fields based on type */}
          {requestType === 'Hanh chinh' && (
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-stone-700">Số ngày nghỉ</label>
              <input 
                type="number"
                min="0"
                step="0.5"
                value={leaveDays}
                onChange={(e) => setLeaveDays(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                placeholder="Ví dụ: 1.5"
              />
            </div>
          )}

          {requestType === 'Tai chinh' && (
            <>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-stone-700">Nội dung chi phí</label>
                <input 
                  type="text"
                  value={expenseContent}
                  onChange={(e) => setExpenseContent(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="Ví dụ: Công tác phí, mua sắm thiết bị..."
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-stone-700">Số tiền (VNĐ)</label>
                <input 
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="Ví dụ: 1000000"
                />
              </div>
            </>
          )}

        </div>

        <div className="pt-6 border-t border-stone-100 flex justify-end gap-3">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-2.5 text-sm font-bold text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors shadow-sm"
            >
              Hủy
            </button>
          )}
          <button 
            type="submit"
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Gửi đề xuất
          </button>
        </div>
      </form>
    </div>
  );
}
