import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 User, 
 Mail, 
 Phone, 
 Lock, 
 Shield, 
 Bell, 
 Camera, 
 CheckCircle2, 
 X, 
 Eye, 
 EyeOff,
 Globe,
 Palette
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useNotifications } from '../context/NotificationContext';
import { cn } from '../lib/utils';

export function UserProfile() {
 const { staffInfo, user } = useAuth();
 const { theme, setTheme, language, setLanguage } = usePreferences();
 const { addNotification } = useNotifications();
 const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
 const [isSaving, setIsSaving] = useState(false);
 const [showCurrentPassword, setShowCurrentPassword] = useState(false);
 const [showNewPassword, setShowNewPassword] = useState(false);

 const [isMfaEnabled, setIsMfaEnabled] = useState(false);
 const [isSettingUpMfa, setIsSettingUpMfa] = useState(false);
 const [isDisablingMfa, setIsDisablingMfa] = useState(false);
 const [mfaSecret, setMfaSecret] = useState('');
 const [mfaQrUrl, setMfaQrUrl] = useState('');
 const [otpCode, setOtpCode] = useState('');
 const [mfaError, setMfaError] = useState<string | null>(null);
 const [mfaLoading, setMfaLoading] = useState(false);

 React.useEffect(() => {
   if (staffInfo) {
     setIsMfaEnabled(!!staffInfo.twoFactorEnabled);
   }
 }, [staffInfo]);

 const handleStartMfaSetup = async () => {
   setMfaLoading(true);
   setMfaError(null);
   try {
     let secret = '';
     let otpauthUrl = '';
     try {
       const res = await fetch('/api/mfa/setup', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: user?.email || staffInfo?.email || 'admin@v-erp.com' })
       });
       const data = await res.json();
       if (res.ok && data.status === 'success') {
         secret = data.secret;
         otpauthUrl = data.otpauthUrl;
       } else {
         throw new Error(data.message || 'Không thể tạo khóa bí mật 2FA.');
       }
     } catch (fetchErr) {
       console.warn('API setup failed, falling back to browser generation:', fetchErr);
       const { generateBase32Secret } = await import('../lib/mfa');
       secret = generateBase32Secret(16);
       const email = user?.email || staffInfo?.email || 'admin@vcomm.vn';
       const issuer = 'VCommERP';
       otpauthUrl = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
     }

     setMfaSecret(secret);
     setMfaQrUrl(`https://quickchart.io/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(otpauthUrl)}`);
     setIsSettingUpMfa(true);
   } catch (err: any) {
     setMfaError(err.message || 'Lỗi kết nối tới máy chủ.');
   } finally {
     setMfaLoading(false);
   }
 };

 const handleConfirmMfaEnable = async () => {
   if (!otpCode || otpCode.length !== 6) {
     setMfaError('Vui lòng nhập mã OTP gồm 6 chữ số.');
     return;
   }
   setMfaLoading(true);
   setMfaError(null);
   try {
     let success = false;
     let message = '';
     try {
       const res = await fetch('/api/mfa/verify-and-enable', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           uid: user?.uid,
           secret: mfaSecret,
           code: otpCode,
           email: user?.email || staffInfo?.email
         })
       });
       const data = await res.json();
       if (res.ok && data.status === 'success') {
         success = true;
       } else {
         message = data.message || 'Mã xác thực không chính xác.';
       }
     } catch (fetchErr) {
       console.warn('API enable failed, falling back to client-side verification:', fetchErr);
       const { clientMfaVerifyAndEnable } = await import('../lib/mfa');
       if (user?.uid) {
         const res = await clientMfaVerifyAndEnable(user.uid, mfaSecret, otpCode);
         if (res.status === 'success') {
           success = true;
         } else {
           message = res.message || 'Mã xác thực không chính xác.';
         }
       } else {
         message = 'Không tìm thấy phiên đăng nhập.';
       }
     }

     if (success) {
       setIsMfaEnabled(true);
       setIsSettingUpMfa(false);
       setOtpCode('');
       alert('Kích hoạt xác thực 2 lớp (2FA) thành công!');
     } else {
       throw new Error(message || 'Mã xác thực không chính xác.');
     }
   } catch (err: any) {
     setMfaError(err.message || 'Lỗi kích hoạt 2FA.');
   } finally {
     setMfaLoading(false);
   }
 };

 const handleDisableMfa = async () => {
   if (!otpCode || otpCode.length !== 6) {
     setMfaError('Vui lòng nhập mã OTP gồm 6 chữ số để xác minh tắt 2FA.');
     return;
   }
   setMfaLoading(true);
   setMfaError(null);
   try {
     let success = false;
     let message = '';
     try {
       const res = await fetch('/api/mfa/disable', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           uid: user?.uid,
           code: otpCode,
           email: user?.email || staffInfo?.email
         })
       });
       const data = await res.json();
       if (res.ok && data.status === 'success') {
         success = true;
       } else {
         message = data.message || 'Mã xác thực không chính xác.';
       }
     } catch (fetchErr) {
       console.warn('API disable failed, falling back to client-side verification:', fetchErr);
       const { clientMfaDisable } = await import('../lib/mfa');
       if (user?.uid) {
         const res = await clientMfaDisable(user.uid, otpCode);
         if (res.status === 'success') {
           success = true;
         } else {
           message = res.message || 'Mã xác thực không chính xác.';
         }
       } else {
         message = 'Không tìm thấy phiên đăng nhập.';
       }
     }

     if (success) {
       setIsMfaEnabled(false);
       setIsDisablingMfa(false);
       setOtpCode('');
       alert('Đã tắt xác thực 2 lớp (2FA) thành công.');
     } else {
       throw new Error(message || 'Mã xác thực không chính xác.');
     }
   } catch (err: any) {
     setMfaError(err.message || 'Lỗi tắt 2FA.');
   } finally {
     setMfaLoading(false);
   }
 };

 const tabs = [
 { id: 'profile', label: 'Thông tin cá nhân', icon: User },
 { id: 'security', label: 'Bảo mật & Mật khẩu', icon: Shield },
 { id: 'notifications', label: 'Thông báo', icon: Bell },
 { id: 'appearance', label: 'Giao diện', icon: Palette },
 ];

 const handleSave = () => {
 setIsSaving(true);
 setTimeout(() => {
 setIsSaving(false);
 alert('Đã cập nhật thông tin thành công!');
 }, 1000);
 };

 return (
 <div className="max-w-5xl mx-auto animate-in fade-in slide-in- duration-500">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h1 className="font-serif tracking-tight text-2xl font-bold text-slate-900">Cài đặt tài khoản</h1>
 <p className="text-sm text-slate-600 mt-1">Quản lý thông tin cá nhân, bảo mật và tùy chỉnh trải nghiệm của bạn.</p>
 </div>
 <button 
 onClick={handleSave}
 disabled={isSaving}
 className="bg-slate-900 text-[#FAF9F5] px-6 py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-all shadow-sm shadow-blue-200 disabled:opacity-50"
 >
 {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
 </button>
 </div>

 <div className="flex flex-col md:flex-row gap-6">
 {/* Sidebar Tabs */}
 <div className="w-full md:w-64 space-y-1">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all",
 activeTab === tab.id 
 ? "bg-slate-100 text-orange-700 border border-slate-300 shadow-sm" 
 : "text-slate-600 hover:bg-white hover:text-slate-900"
 )}
 >
 <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-orange-700" : "text-slate-500")} />
 {tab.label}
 </button>
 ))}
 </div>

 {/* Content Area */}
 <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
 {activeTab === 'profile' && (
 <div className="p-6 space-y-8 animate-in fade-in duration-300">
 <div className="flex flex-col items-center sm:flex-row gap-6">
 <div className="relative group">
 <div className="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center text-orange-700 text-2xl font-bold border-2 border-white shadow-sm overflow-hidden relative">
 {staffInfo?.name?.split(' ').pop()?.charAt(0) || '?'}
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
 <Camera className="w-6 h-6 text-[#FAF9F5]" />
 </div>
 </div>
 <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-orange-700  transition-transform">
 <Camera className="w-4 h-4" />
 </button>
 </div>
 <div className="text-center sm:text-left">
 <h3 className="text-lg font-bold text-slate-900">{staffInfo?.name || 'Nguyễn Văn A'}</h3>
 <p className="text-sm text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-full inline-block mt-1 uppercase tracking-wider text-[10px]">
 {staffInfo?.role?.name || 'Nhân viên vận hành'}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Họ và tên</label>
 <div className="relative">
 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input 
 type="text" 
 defaultValue={staffInfo?.name}
 className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-slate-900 transition-all font-medium"
 />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">ID Nhân viên</label>
 <input 
 type="text" 
 readOnly 
 value={staffInfo?.id || 'STAFF-999'}
 className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-600 font-mono italic"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email công việc</label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input 
 type="email" 
 defaultValue={staffInfo?.email}
 className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-slate-900 transition-all font-medium"
 />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Số điện thoại</label>
 <div className="relative">
 <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input 
 type="tel" 
 defaultValue={staffInfo?.phone || '0987654321'}
 className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-slate-900 transition-all font-medium"
 />
 </div>
 </div>
 </div>

 <div className="pt-6 border-t border-slate-200">
 <h4 className="font-bold text-slate-900 mb-4">Thông tin bổ sung</h4>
 <div className="bg-slate-100 p-4 rounded-lg border border-slate-300/50 space-y-3">
 <div className="flex justify-between items-center text-sm">
 <span className="text-orange-700 font-medium">Phòng ban:</span>
 <span className="font-bold text-primary-900">{staffInfo?.role?.department || 'Vận hành Sàn'}</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-orange-700 font-medium">Ngày bắt đầu:</span>
 <span className="font-bold text-primary-900">12/01/2024</span>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'security' && (
 <div className="p-6 space-y-8 animate-in fade-in duration-300">
 <div>
 <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
 <Lock className="w-5 h-5 text-red-500" /> Đổi mật khẩu
 </h3>
 <div className="grid grid-cols-1 gap-4 max-w-md">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mật khẩu hiện tại</label>
 <div className="relative">
 <input 
 type={showCurrentPassword ? "text" : "password"} 
 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-slate-900 transition-all"
 />
 <button 
 onClick={() => setShowCurrentPassword(!showCurrentPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
 >
 {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mật khẩu mới</label>
 <div className="relative">
 <input 
 type={showNewPassword ? "text" : "password"} 
 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-slate-900 transition-all"
 />
 <button 
 onClick={() => setShowNewPassword(!showNewPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
 >
 {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
 <input 
 type="password" 
 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-slate-900 transition-all"
 />
 </div>
 <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2.5 rounded-lg text-sm font-bold mt-2 hover:bg-slate-800 transition-all">Cập nhật mật khẩu</button>
 </div>
 </div>

  <div className="pt-8 border-t border-slate-200">
    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
      <Shield className="w-5 h-5 text-orange-600" /> Bảo mật hai lớp (2FA)
    </h3>
    
    {isSettingUpMfa ? (
      <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-6">
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 text-sm">Thiết lập Google/Microsoft Authenticator</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            1. Quét mã QR dưới đây bằng ứng dụng Authenticator của bạn (hoặc nhập khóa bí mật thủ công).
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-slate-200 max-w-sm mx-auto">
          {mfaQrUrl ? (
            <img src={mfaQrUrl} alt="MFA QR Code" className="w-48 h-48 object-contain" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-xs text-slate-500">Đang tải QR...</div>
          )}
          <div className="mt-3 text-center w-full">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Khóa bí mật (Thủ công)</span>
            <code className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1.5 rounded block mt-1 select-all">{mfaSecret}</code>
          </div>
        </div>

        <div className="space-y-3 max-w-xs mx-auto">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">2. Nhập mã OTP 6 số để xác nhận</label>
            <input 
              type="text" 
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-center font-mono font-bold tracking-[0.3em] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-slate-900"
            />
          </div>

          {mfaError && (
            <p className="text-xs font-bold text-red-600 text-center">{mfaError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleConfirmMfaEnable}
              disabled={mfaLoading || otpCode.length !== 6}
              className="flex-1 bg-slate-900 text-[#FAF9F5] py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {mfaLoading ? 'Đang kích hoạt...' : 'Kích hoạt'}
            </button>
            <button
              onClick={() => {
                setIsSettingUpMfa(false);
                setOtpCode('');
                setMfaError(null);
              }}
              className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    ) : isDisablingMfa ? (
      <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-4 max-w-md">
        <h4 className="font-bold text-slate-900 text-sm">Vô hiệu hóa Bảo mật 2FA</h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          Vui lòng nhập mã OTP hiện tại từ ứng dụng Authenticator của bạn để xác minh việc vô hiệu hóa bảo mật hai lớp.
        </p>

        <div className="space-y-3 max-w-xs">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Mã OTP 6 số</label>
            <input 
              type="text" 
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-center font-mono font-bold tracking-[0.3em] text-sm focus:outline-none"
            />
          </div>

          {mfaError && (
            <p className="text-xs font-bold text-red-600">{mfaError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleDisableMfa}
              disabled={mfaLoading || otpCode.length !== 6}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {mfaLoading ? 'Đang xử lý...' : 'Xác nhận tắt'}
            </button>
            <button
              onClick={() => {
                setIsDisablingMfa(false);
                setOtpCode('');
                setMfaError(null);
              }}
              className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-900">Xác thực Google Authenticator</p>
          <p className="text-xs text-slate-600">Yêu cầu mã số OTP xác minh từ thiết bị của bạn khi thực hiện đăng nhập.</p>
        </div>
        <div className="flex items-center gap-3">
          {isMfaEnabled ? (
            <>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">Đang hoạt động</span>
              <button 
                onClick={() => {
                  setIsDisablingMfa(true);
                  setOtpCode('');
                  setMfaError(null);
                }}
                disabled={mfaLoading}
                className="bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Vô hiệu hóa
              </button>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">Chưa kích hoạt</span>
              <button 
                onClick={handleStartMfaSetup}
                disabled={mfaLoading}
                className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {mfaLoading ? 'Đang tải...' : 'Thiết lập'}
              </button>
            </>
          )}
        </div>
      </div>
    )}
  </div>
 </div>
 )}

 {activeTab === 'notifications' && (
 <div className="p-6 space-y-6 animate-in fade-in duration-300">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-bold text-slate-900">Cài đặt thông báo</h3>
 <button 
 onClick={() => addNotification('Thông báo thử nghiệm', 'Đây là thông báo test được tạo lúc ' + new Date().toLocaleTimeString())}
 className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold hover:bg-primary-100 transition-colors"
 >
 <Bell className="w-3.5 h-3.5" /> Gửi thông báo test
 </button>
 </div>
 <div className="space-y-4">
 {[
 { label: 'Thông báo đơn hàng mới', desc: 'Nhận thông báo ngay khi có khách hàng đặt đơn mới.', enabled: true },
 { label: 'Thông báo CRM & Tin nhắn', desc: 'Nhận thông báo khi khách hàng nhắn tin hoặc tag bạn.', enabled: true },
 { label: 'Báo cáo doanh thu ngày', desc: 'Gửi báo cáo tổng hợp doanh thu sau khi kết thúc ca.', enabled: false },
 { label: 'Cảnh báo tồn kho thấp', desc: 'Thông báo khi sản phẩm trong kho sắp hết hàng.', enabled: true },
 ].map((item, idx) => (
 <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors">
 <div className="space-y-1">
 <p className="text-sm font-bold text-slate-900">{item.label}</p>
 <p className="text-xs text-slate-600">{item.desc}</p>
 </div>
 <div className={cn(
 "w-12 h-6 rounded-full relative cursor-pointer transition-all",
 item.enabled ? "bg-slate-900" : "bg-slate-200"
 )}>
 <div className={cn(
 "absolute top-1 w-4 h-4 bg-white rounded-full transition-all outline outline-stone-100",
 item.enabled ? "right-1" : "left-1"
 )} />
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === 'appearance' && (
 <div className="p-6 space-y-8 animate-in fade-in duration-300">
 <div>
 <h3 className="text-lg font-bold text-slate-900 mb-4">Màu sắc chủ đạo (Chế độ Theme)</h3>
 <DraggableGrid className="grid grid-cols-2 sm:grid-cols-3 gap-4" columns={3} gap={16}>
 <div 
 onClick={() => setTheme('light')}
 className={cn("p-4 rounded-lg cursor-pointer transition-all", theme === 'light' ? "border-2 border-slate-900 bg-slate-100" : "border border-slate-300 bg-white hover:border-primary-300")}
 >
 <div className="w-full h-12 bg-slate-900 rounded-lg mb-3 shadow-inner shadow-blue-700/20" />
 <p className={cn("text-xs font-bold text-center uppercase tracking-widest", theme === 'light' ? "text-orange-700" : "text-slate-600")}>Sáng (Mặc định)</p>
 </div>
 <div 
 onClick={() => setTheme('dark')}
 className={cn("p-4 rounded-lg cursor-pointer transition-all", theme === 'dark' ? "border-2 border-slate-700 bg-slate-800" : "border border-slate-300 bg-slate-900 opacity-50 grayscale hover:grayscale-0 hover:border-slate-500")}
 >
 <div className="w-full h-12 bg-slate-900 border border-slate-700 rounded-lg mb-3" />
 <p className={cn("text-xs font-bold text-center uppercase tracking-widest", theme === 'dark' ? "text-[#FAF9F5]" : "text-slate-500")}>Tối (Dark Mode)</p>
 </div>
 <div 
 onClick={() => setTheme('nature')}
 className={cn("p-4 rounded-lg cursor-pointer transition-all", theme === 'nature' ? "border-2 border-emerald-500 bg-emerald-50" : "border border-slate-300 bg-emerald-50 opacity-50 grayscale hover:grayscale-0 hover:border-emerald-500")}
 >
 <div className="w-full h-12 bg-emerald-600 rounded-lg mb-3 shadow-inner" />
 <p className={cn("text-xs font-bold text-center uppercase tracking-widest", theme === 'nature' ? "text-emerald-600" : "text-slate-600")}>Nature (Eco)</p>
 </div>
 </DraggableGrid>
 </div>

 <div className="pt-8 border-t border-slate-200">
 <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
 <Globe className="w-5 h-5 text-primary-500" /> Ngôn ngữ hệ thống
 </h3>
 <div className="grid grid-cols-2 gap-4 max-w-sm">
 <button 
 onClick={() => setLanguage('vi')}
 className={cn("p-3 rounded-lg text-sm font-bold transition-all", language === 'vi' ? "border-2 border-slate-900 bg-white text-orange-700" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50")}
 >
 Tiếng Việt
 </button>
 <button 
 onClick={() => setLanguage('en')}
 className={cn("p-3 rounded-lg text-sm font-bold transition-all", language === 'en' ? "border-2 border-slate-900 bg-white text-orange-700" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50")}
 >
 English
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>

 <div className="mt-12 bg-rose-50 border border-rose-100 rounded-lg p-6 flex items-center justify-between">
 <div className="space-y-1">
 <h4 className="font-bold text-rose-900">Vùng nguy hiểm</h4>
 <p className="text-xs text-rose-700">Yêu cầu vô hiệu hóa tài khoản hoặc xóa dữ liệu cá nhân theo chính sách bảo mật GDPR/CRM.</p>
 </div>
 <button className="bg-rose-600 text-[#FAF9F5] px-6 py-2.5 rounded-lg font-bold hover:bg-rose-700 transition-all shadow-sm shadow-rose-200 text-sm">
 Vô hiệu hóa tài khoản
 </button>
 </div>
 </div>
 );
}
