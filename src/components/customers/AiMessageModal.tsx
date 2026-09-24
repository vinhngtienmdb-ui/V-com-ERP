import React, { useState } from 'react';
import { X, Sparkles, Send, Copy, Check, Loader2 } from 'lucide-react';
import { Customer } from '../../types/erp';
import { generateCustomerCareMessage } from '../../services/geminiService';
import { useNavigate } from 'react-router-dom';

interface AiMessageModalProps {
  customer: Customer;
  onClose: () => void;
}

export function AiMessageModal({ customer, onClose }: AiMessageModalProps) {
  const navigate = useNavigate();
  const [aiMessage, setAiMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const msg = await generateCustomerCareMessage(customer);
      setAiMessage(msg || `Kính gửi ${customer.name}, VComm trân trọng cảm ơn Quý khách đã luôn đồng hành cùng chúng tôi! Kính gửi tặng Quý khách mã ưu đãi VIP khi đặt hàng tiếp theo.`);
    } catch (err) {
      setAiMessage(`Kính gửi ${customer.name}, VComm xin gửi tặng Quý khách voucher giảm 10% cho đơn hàng tiếp theo. Trân trọng cảm ơn sự ủng hộ của Quý khách!`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Trợ Lý AI CSKH: {customer.name}</h3>
              <p className="text-[11px] text-slate-500">Tự động phân tích lịch sử mua sắm để soạn tin cá nhân hóa</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl min-h-[160px] flex flex-col items-center justify-center text-center relative">
            {loading ? (
              <div className="flex flex-col items-center gap-2.5">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs font-bold text-indigo-700 animate-pulse">
                  Gemini AI đang phân tích RFM & lịch sử mua hàng...
                </p>
              </div>
            ) : aiMessage ? (
              <div className="w-full text-left">
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line italic">
                  "{aiMessage}"
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="w-10 h-10 text-indigo-300" />
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-500/10 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Soạn tin nhắn độc bản</span>
                </button>
              </div>
            )}
          </div>

          {aiMessage && (
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(aiMessage);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép nội dung'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/omnichat');
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Chuyển sang OmniChat</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
