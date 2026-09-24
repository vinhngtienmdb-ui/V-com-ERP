import React, { useState } from 'react';
import { X, Wallet, Coins, QrCode } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { Customer } from '../../types/erp';
import { supabase } from '../../lib/supabase';

interface AdjustBalanceModalProps {
  customer: Customer;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdjustBalanceModal({ customer, onClose, onSuccess }: AdjustBalanceModalProps) {
  const [adjustType, setAdjustType] = useState<'wallet' | 'points'>('wallet');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (isNaN(val) || val === 0) {
      alert('Vui lòng nhập số tiền hoặc điểm hợp lệ!');
      return;
    }

    setIsSubmitting(true);
    const canonicalField = adjustType === 'wallet' ? 'walletBalance' : 'vXu';

    try {
      // Find matching user in 'users' table (eCommerce source of truth)
      const lookupId = (customer as any).linkedUserId || customer.id;
      const { data: userById } = await supabase
        .from('users')
        .select('*')
        .eq('id', lookupId)
        .maybeSingle();

      let userRow = userById;
      if (!userRow && customer.email) {
        const { data: allUsers } = await supabase.from('users').select('*').limit(300);
        if (allUsers) {
          userRow = allUsers.find((u: any) => 
            u.data?.email && u.data.email.toLowerCase() === customer.email.toLowerCase()
          ) || null;
        }
      }

      if (userRow) {
        const userData = userRow.data || {};
        const currentVal = Number(userData[canonicalField] || 0);
        const newVal = currentVal + val;

        const updatedData = {
          ...userData,
          [canonicalField]: newVal,
        };

        if (canonicalField === 'walletBalance') {
          updatedData.balance = newVal; // Legacy compat
        } else if (canonicalField === 'vXu') {
          updatedData.points = newVal; // Legacy compat
        }

        await supabase
          .from('users')
          .update({ data: updatedData, updated_at: new Date().toISOString() })
          .eq('id', userRow.id);
      }

      // Also update directly in 'customers' table if exists
      await supabase
        .from('customers')
        .update({
          ...(adjustType === 'wallet' 
            ? { walletBalance: (customer.walletBalance || 0) + val }
            : { points: (customer.points || 0) + val }
          ),
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);

      const typeLabel = adjustType === 'wallet' ? 'số dư Ví' : 'V-Xu';
      const action = val >= 0 ? 'Cộng' : 'Trừ';
      alert(`✓ ${action} ${Math.abs(val).toLocaleString('vi-VN')}${adjustType === 'wallet' ? '₫' : ' V-Xu'} vào ${typeLabel} của "${customer.name}" thành công!`);
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Điều chỉnh số dư thất bại: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Nạp / Điều Chỉnh Số Dư</h3>
              <p className="text-[11px] text-slate-500">{customer.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setAdjustType('wallet')}
              className={cn(
                "py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                adjustType === 'wallet' ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Ví tiền mặt</span>
            </button>
            <button
              type="button"
              onClick={() => setAdjustType('points')}
              className={cn(
                "py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                adjustType === 'points' ? "bg-white text-amber-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Điểm V-Xu</span>
            </button>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <span className="text-slate-500">Số dư hiện tại:</span>
            <span className="text-sm font-black text-slate-900 font-mono">
              {adjustType === 'wallet' 
                ? formatCurrency(customer.walletBalance || 0) 
                : `${(customer.points || 0).toLocaleString()} V-Xu`}
            </span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {adjustType === 'wallet' ? 'Số tiền cần cộng hoặc trừ (VNĐ) *' : 'Số điểm V-Xu cần cộng hoặc trừ *'}
            </label>
            <input 
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="VD: 500000 (cộng) hoặc -100000 (trừ)"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Dùng dấu trừ (-) đằng trước nếu muốn thu hồi/trừ bớt.</p>
          </div>

          {adjustType === 'wallet' && Number(amount) > 0 && (
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl text-center space-y-3">
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Mã VietQR Chuyển Khoản Tự Động Khách Hàng
              </p>
              <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs w-fit mx-auto">
                <img 
                  src={`https://api.vietqr.io/image/970415-1020088998-qr_only.jpg?amount=${amount}&addInfo=VCOMM_DEP_${customer.id}`}
                  alt="VietQR"
                  className="w-28 h-28 object-contain"
                />
              </div>
              <div className="text-[11px] text-slate-700 text-left space-y-0.5">
                <p>Nội dung CK: <strong className="font-mono text-emerald-800 font-bold">VCOMM_DEP_{customer.id}</strong></p>
                <p>Số tiền: <strong className="text-emerald-700 font-bold">{formatCurrency(Number(amount))}</strong></p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Đang lưu...' : 'Xác nhận cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
