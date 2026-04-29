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
 const { staffInfo } = useAuth();
 const { theme, setTheme, language, setLanguage } = usePreferences();
 const { addNotification } = useNotifications();
 const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
 const [isSaving, setIsSaving] = useState(false);
 const [showCurrentPassword, setShowCurrentPassword] = useState(false);
 const [showNewPassword, setShowNewPassword] = useState(false);

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
 <h1 className="font-serif tracking-tight text-2xl font-bold text-stone-900">Cài đặt tài khoản</h1>
 <p className="text-sm text-stone-500 mt-1">Quản lý thông tin cá nhân, bảo mật và tùy chỉnh trải nghiệm của bạn.</p>
 </div>
 <button 
 onClick={handleSave}
 disabled={isSaving}
 className="bg-stone-900 text-[#FAF9F5] px-6 py-2.5 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-sm shadow-blue-200 disabled:opacity-50"
 >
 {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
 </button>
 </div>

 <div className="flex flex-col md:flex-row gap-8">
 {/* Sidebar Tabs */}
 <div className="w-full md:w-64 space-y-1">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
 activeTab === tab.id 
 ? "bg-[#F2F0E9] text-orange-700 border border-[#EAE7DF] shadow-sm" 
 : "text-stone-500 hover:bg-white hover:text-stone-900"
 )}
 >
 <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-orange-700" : "text-stone-400")} />
 {tab.label}
 </button>
 ))}
 </div>

 {/* Content Area */}
 <div className="flex-1 bg-white rounded-lg border border-stone-100 shadow-sm overflow-hidden">
 {activeTab === 'profile' && (
 <div className="p-8 space-y-8 animate-in fade-in duration-300">
 <div className="flex flex-col items-center sm:flex-row gap-6">
 <div className="relative group">
 <div className="w-24 h-24 rounded-lg bg-[#F2F0E9] flex items-center justify-center text-orange-700 text-2xl font-bold border-2 border-white shadow-sm overflow-hidden relative">
 {staffInfo?.name?.split(' ').pop()?.charAt(0) || 'U'}
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
 <Camera className="w-6 h-6 text-[#FAF9F5]" />
 </div>
 </div>
 <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-sm border border-stone-100 text-orange-700 hover:scale-110 transition-transform">
 <Camera className="w-4 h-4" />
 </button>
 </div>
 <div className="text-center sm:text-left">
 <h3 className="text-lg font-bold text-stone-900">{staffInfo?.name || 'Nguyễn Văn A'}</h3>
 <p className="text-sm text-stone-500 font-medium bg-stone-100 px-3 py-1 rounded-full inline-block mt-1 uppercase tracking-wider text-[10px]">
 {staffInfo?.role?.name || 'Nhân viên vận hành'}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Họ và tên</label>
 <div className="relative">
 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
 <input 
 type="text" 
 defaultValue={staffInfo?.name}
 className="w-full bg-stone-50 border border-stone-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-stone-900 transition-all font-medium"
 />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">ID Nhân viên</label>
 <input 
 type="text" 
 readOnly 
 value={staffInfo?.id || 'STAFF-999'}
 className="w-full bg-stone-100 border border-stone-100 rounded-xl px-4 py-3 text-sm text-stone-500 font-mono italic"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Email công việc</label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
 <input 
 type="email" 
 defaultValue={staffInfo?.email}
 className="w-full bg-stone-50 border border-stone-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-stone-900 transition-all font-medium"
 />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Số điện thoại</label>
 <div className="relative">
 <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
 <input 
 type="tel" 
 defaultValue={staffInfo?.phone || '0987654321'}
 className="w-full bg-stone-50 border border-stone-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-stone-900 transition-all font-medium"
 />
 </div>
 </div>
 </div>

 <div className="pt-6 border-t border-stone-100">
 <h4 className="font-bold text-stone-900 mb-4">Thông tin bổ sung</h4>
 <div className="bg-[#F2F0E9] p-4 rounded-xl border border-[#EAE7DF]/50 space-y-3">
 <div className="flex justify-between items-center text-sm">
 <span className="text-orange-700 font-medium">Phòng ban:</span>
 <span className="font-bold text-blue-900">{staffInfo?.role?.department || 'Vận hành Sàn'}</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-orange-700 font-medium">Ngày bắt đầu:</span>
 <span className="font-bold text-blue-900">12/01/2024</span>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'security' && (
 <div className="p-8 space-y-8 animate-in fade-in duration-300">
 <div>
 <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
 <Lock className="w-5 h-5 text-red-500" /> Đổi mật khẩu
 </h3>
 <div className="grid grid-cols-1 gap-4 max-w-md">
 <div className="space-y-2">
 <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Mật khẩu hiện tại</label>
 <div className="relative">
 <input 
 type={showCurrentPassword ? "text" : "password"} 
 className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-stone-900 transition-all"
 />
 <button 
 onClick={() => setShowCurrentPassword(!showCurrentPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
 >
 {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Mật khẩu mới</label>
 <div className="relative">
 <input 
 type={showNewPassword ? "text" : "password"} 
 className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-stone-900 transition-all"
 />
 <button 
 onClick={() => setShowNewPassword(!showNewPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
 >
 {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
 <input 
 type="password" 
 className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-stone-900 transition-all"
 />
 </div>
 <button className="bg-stone-900 text-[#FAF9F5] px-4 py-2.5 rounded-xl text-sm font-bold mt-2 hover:bg-stone-800 transition-all">Cập nhật mật khẩu</button>
 </div>
 </div>

 <div className="pt-8 border-t border-stone-100">
 <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
 <Shield className="w-5 h-5 text-orange-600" /> Bảo mật hai lớp (2FA)
 </h3>
 <div className="p-4 bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-between">
 <div className="space-y-1">
 <p className="text-sm font-bold text-stone-900">Xác thực Google Authenticator</p>
 <p className="text-xs text-stone-500">Tăng cường bảo mật bằng cách yêu cầu mã xác thực khi đăng nhập.</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-200 px-2 py-1 rounded">Chưa kích hoạt</span>
 <div className="w-12 h-6 bg-stone-200 rounded-full relative cursor-pointer group">
 <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'notifications' && (
 <div className="p-8 space-y-6 animate-in fade-in duration-300">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-bold text-stone-900">Cài đặt thông báo</h3>
 <button 
 onClick={() => addNotification('Thông báo thử nghiệm', 'Đây là thông báo test được tạo lúc ' + new Date().toLocaleTimeString())}
 className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
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
 <div key={idx} className="flex items-center justify-between p-4 hover:bg-stone-50 rounded-xl transition-colors">
 <div className="space-y-1">
 <p className="text-sm font-bold text-stone-900">{item.label}</p>
 <p className="text-xs text-stone-500">{item.desc}</p>
 </div>
 <div className={cn(
 "w-12 h-6 rounded-full relative cursor-pointer transition-all",
 item.enabled ? "bg-stone-900" : "bg-stone-200"
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
 <div className="p-8 space-y-8 animate-in fade-in duration-300">
 <div>
 <h3 className="text-lg font-bold text-stone-900 mb-4">Màu sắc chủ đạo (Chế độ Theme)</h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
 <div 
 onClick={() => setTheme('light')}
 className={cn("p-4 rounded-lg cursor-pointer transition-all", theme === 'light' ? "border-2 border-stone-900 bg-[#F2F0E9]" : "border border-stone-200 bg-white hover:border-blue-300")}
 >
 <div className="w-full h-12 bg-stone-900 rounded-lg mb-3 shadow-inner shadow-blue-700/20" />
 <p className={cn("text-xs font-bold text-center uppercase tracking-widest", theme === 'light' ? "text-orange-700" : "text-stone-500")}>Sáng (Mặc định)</p>
 </div>
 <div 
 onClick={() => setTheme('dark')}
 className={cn("p-4 rounded-lg cursor-pointer transition-all", theme === 'dark' ? "border-2 border-stone-700 bg-stone-800" : "border border-stone-200 bg-stone-900 opacity-50 grayscale hover:grayscale-0 hover:border-stone-500")}
 >
 <div className="w-full h-12 bg-stone-900 border border-stone-700 rounded-lg mb-3" />
 <p className={cn("text-xs font-bold text-center uppercase tracking-widest", theme === 'dark' ? "text-[#FAF9F5]" : "text-stone-300")}>Tối (Dark Mode)</p>
 </div>
 <div 
 onClick={() => setTheme('nature')}
 className={cn("p-4 rounded-lg cursor-pointer transition-all", theme === 'nature' ? "border-2 border-emerald-500 bg-emerald-50" : "border border-stone-200 bg-emerald-50 opacity-50 grayscale hover:grayscale-0 hover:border-emerald-500")}
 >
 <div className="w-full h-12 bg-emerald-600 rounded-lg mb-3 shadow-inner" />
 <p className={cn("text-xs font-bold text-center uppercase tracking-widest", theme === 'nature' ? "text-emerald-600" : "text-stone-500")}>Nature (Eco)</p>
 </div>
 </div>
 </div>

 <div className="pt-8 border-t border-stone-100">
 <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
 <Globe className="w-5 h-5 text-indigo-500" /> Ngôn ngữ hệ thống
 </h3>
 <div className="grid grid-cols-2 gap-4 max-w-sm">
 <button 
 onClick={() => setLanguage('vi')}
 className={cn("p-3 rounded-xl text-sm font-bold transition-all", language === 'vi' ? "border-2 border-stone-900 bg-white text-orange-700" : "border border-stone-200 bg-white text-stone-500 hover:bg-stone-50")}
 >
 Tiếng Việt
 </button>
 <button 
 onClick={() => setLanguage('en')}
 className={cn("p-3 rounded-xl text-sm font-bold transition-all", language === 'en' ? "border-2 border-stone-900 bg-white text-orange-700" : "border border-stone-200 bg-white text-stone-500 hover:bg-stone-50")}
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
 <button className="bg-rose-600 text-[#FAF9F5] px-6 py-2.5 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-sm shadow-rose-200 text-sm">
 Vô hiệu hóa tài khoản
 </button>
 </div>
 </div>
 );
}
