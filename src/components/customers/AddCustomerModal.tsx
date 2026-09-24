import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Building, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface AddCustomerModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddCustomerModal({ onClose, onSuccess }: AddCustomerModalProps) {
  const [customerType, setCustomerType] = useState<'b2c' | 'b2b' | 'agency'>('b2b');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [representative, setRepresentative] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('50000000');
  const [channels, setChannels] = useState<string[]>(['web']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleChannel = (ch: string) => {
    setChannels(prev => 
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    try {
      const customerId = 'cust_' + Date.now();
      
      // 1. Insert into Supabase customers table
      const { error: custError } = await supabase
        .from('customers')
        .insert({
          id: customerId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || `${phone.trim()}@customer.vcomm.vn`,
          status: 'active',
          totalSpent: 0,
          orderCount: 0,
          channels: channels,
          tier: customerType === 'b2b' ? 'Hạng Vàng' : 'Hạng Bạc',
          walletBalance: 0,
          points: 50, // Welcome gift 50 V-Xu
          taxCode: taxCode.trim() || null,
          representative: representative.trim() || null,
          customerType: customerType,
          creditLimit: Number(creditLimit) || 0,
          address: address.trim() || 'Việt Nam',
          created_at: new Date().toISOString()
        });

      if (custError) {
        console.warn('Could not insert directly to customers table, writing to users table fallback:', custError);
        // Fallback to users table
        await supabase
          .from('users')
          .insert({
            id: customerId,
            tenant_id: 'tenant-vcomm-prod-01',
            data: {
              userId: customerId,
              displayName: name.trim(),
              phone: phone.trim(),
              email: email.trim() || `${phone.trim()}@customer.vcomm.vn`,
              role: 'user',
              channels: channels,
              status: 'active',
              points: 50,
              walletBalance: 0,
              totalSpent: 0,
              orderCount: 0,
              taxCode: taxCode.trim(),
              customerType: customerType,
              creditLimit: Number(creditLimit) || 0
            },
            updated_at: new Date().toISOString()
          });
      }

      alert('✓ Tạo khách hàng mới thành công!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Tạo khách hàng thất bại: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Thêm Mới Khách Hàng / Đối Tác B2B</h3>
              <p className="text-[11px] text-slate-500">Đăng ký định danh 360° trên toàn hệ sinh thái ERP</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          
          {/* Customer Type Segmented Switcher */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Loại khách hàng</label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCustomerType('b2b')}
                className={cn(
                  "py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  customerType === 'b2b' ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Doanh nghiệp B2B</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomerType('b2c')}
                className={cn(
                  "py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  customerType === 'b2c' ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <User className="w-3.5 h-3.5" />
                <span>Cá nhân B2C</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomerType('agency')}
                className={cn(
                  "py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  customerType === 'agency' ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>Đại lý Phân phối</span>
              </button>
            </div>
          </div>

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {customerType === 'b2b' ? 'Tên Công ty / Doanh nghiệp *' : 'Họ và tên khách hàng *'}
              </label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={customerType === 'b2b' ? "VD: Công ty Cổ phần Sữa TH" : "VD: Nguyễn Văn An"}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Số điện thoại chính *</label>
              <input 
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email liên hệ</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.com"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {customerType === 'b2b' ? 'Mã số thuế (MST)' : 'Số CCCD / CMND'}
              </label>
              <input 
                type="text"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                placeholder="0316889988"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono outline-none"
              />
            </div>
          </div>

          {customerType === 'b2b' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Người đại diện pháp luật</label>
                <input 
                  type="text"
                  value={representative}
                  onChange={(e) => setRepresentative(e.target.value)}
                  placeholder="VD: Ông Nguyễn Anh Tuấn"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hạn mức công nợ phê duyệt (VNĐ)</label>
                <input 
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Địa chỉ trụ sở / Giao hàng</label>
            <input 
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none"
            />
          </div>

          {/* Channels Selection */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Kênh tiếp cận & Chăm sóc</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'zalo', label: 'Zalo OA' },
                { id: 'facebook', label: 'Facebook Page' },
                { id: 'web', label: 'Website Storefront' },
                { id: 'hotline', label: 'Hotline CSKH' },
              ].map(ch => {
                const checked = channels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer",
                      checked 
                        ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {checked ? '✓ ' : '+ '}{ch.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2.5 pt-4 border-t border-slate-100">
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
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Đang tạo hồ sơ...' : 'Xác nhận tạo khách hàng'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
