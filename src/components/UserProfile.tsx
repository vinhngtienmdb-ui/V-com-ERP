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
 Eye,
 EyeOff,
 Globe,
 Palette,
 Building2,
 CalendarDays,
 IdCard,
 CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useNotifications } from '../context/NotificationContext';
import { cn } from '../lib/utils';

const tabList = [
 { id: 'profile',       label: 'Thông tin cá nhân',   icon: User,    bg: 'bg-blue-500' },
 { id: 'security',      label: 'Bảo mật & Mật khẩu',  icon: Shield,  bg: 'bg-red-500' },
 { id: 'notifications', label: 'Thông báo',            icon: Bell,    bg: 'bg-amber-500' },
 { id: 'appearance',    label: 'Giao diện',            icon: Palette, bg: 'bg-violet-500' },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
 return (
  <button
   onClick={onChange}
   className={cn(
    'w-11 h-6 rounded-full relative transition-colors shrink-0',
    enabled ? 'bg-blue-500' : 'bg-slate-200'
   )}
  >
   <div className={cn(
    'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
    enabled ? 'translate-x-6' : 'translate-x-1'
   )} />
  </button>
 );
}

function SectionCard({ title, icon: Icon, iconBg, children }: {
 title: string; icon: any; iconBg: string; children: React.ReactNode
}) {
 return (
  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
   <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
     <Icon className="w-4 h-4 text-white" />
    </div>
    <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
   </div>
   <div className="p-5">{children}</div>
  </div>
 );
}

export function UserProfile() {
 const { staffInfo } = useAuth();
 const { theme, setTheme, language, setLanguage } = usePreferences();
 const { addNotification } = useNotifications();
 const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
 const [isSaving, setIsSaving] = useState(false);
 const [showCurrentPassword, setShowCurrentPassword] = useState(false);
 const [showNewPassword, setShowNewPassword] = useState(false);
 const [notifSettings, setNotifSettings] = useState([
  { label: 'Thông báo đơn hàng mới', desc: 'Nhận thông báo ngay khi có khách hàng đặt đơn mới.', enabled: true },
  { label: 'Thông báo CRM & Tin nhắn', desc: 'Nhận thông báo khi khách hàng nhắn tin hoặc tag bạn.', enabled: true },
  { label: 'Báo cáo doanh thu ngày', desc: 'Gửi báo cáo tổng hợp doanh thu sau khi kết thúc ca.', enabled: false },
  { label: 'Cảnh báo tồn kho thấp', desc: 'Thông báo khi sản phẩm trong kho sắp hết hàng.', enabled: true },
 ]);

 const initials = (staffInfo?.name || 'U').split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase();

 const handleSave = () => {
  setIsSaving(true);
  setTimeout(() => {
   setIsSaving(false);
   addNotification('Đã lưu thay đổi', 'Thông tin tài khoản đã được cập nhật thành công.');
  }, 800);
 };

 return (
  <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">

   {/* Page header */}
   <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
    <div className="h-24 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
    <div className="px-6 pb-5">
     <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10">
      <div className="flex items-end gap-4">
       <div className="relative group">
        <div className="w-20 h-20 rounded-2xl bg-blue-500 border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold">
         {initials}
        </div>
        <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-slate-200 rounded-xl shadow flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
         <Camera className="w-3.5 h-3.5" />
        </button>
       </div>
       <div className="mb-1">
        <h1 className="text-lg font-bold text-slate-900">{staffInfo?.name || 'Nguyễn Văn A'}</h1>
        <div className="flex items-center gap-2 mt-1">
         <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full capitalize">
          {staffInfo?.role || 'staff'}
         </span>
         {staffInfo?.department && (
          <span className="text-xs text-slate-500 flex items-center gap-1">
           <Building2 className="w-3 h-3" /> {staffInfo.department}
          </span>
         )}
        </div>
       </div>
      </div>
      <button
       onClick={handleSave}
       disabled={isSaving}
       className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm mb-1"
      >
       {isSaving ? (
        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</>
       ) : (
        <><CheckCircle2 className="w-4 h-4" /> Lưu thay đổi</>
       )}
      </button>
     </div>
    </div>
   </div>

   <div className="flex flex-col md:flex-row gap-5">

    {/* Tab navigation */}
    <div className="w-full md:w-56 shrink-0 space-y-1.5">
     {tabList.map(tab => (
      <button
       key={tab.id}
       onClick={() => setActiveTab(tab.id as any)}
       className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
        activeTab === tab.id
         ? 'bg-white border border-slate-200 shadow-sm text-slate-900'
         : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:border hover:border-slate-200'
       )}
      >
       <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all',
        activeTab === tab.id ? tab.bg : 'bg-slate-100'
       )}>
        <tab.icon className={cn('w-4 h-4', activeTab === tab.id ? 'text-white' : 'text-slate-400')} />
       </div>
       {tab.label}
      </button>
     ))}
    </div>

    {/* Content */}
    <div className="flex-1 space-y-5">

     {/* Profile tab */}
     {activeTab === 'profile' && (
      <div className="space-y-5 animate-in fade-in duration-300">
       <SectionCard title="Thông tin cá nhân" icon={User} iconBg="bg-blue-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         {[
          { label: 'Họ và tên', icon: User, type: 'text', value: staffInfo?.name, readOnly: false },
          { label: 'ID Nhân viên', icon: IdCard, type: 'text', value: staffInfo?.id || 'STAFF-999', readOnly: true },
          { label: 'Email công việc', icon: Mail, type: 'email', value: staffInfo?.email, readOnly: false },
          { label: 'Số điện thoại', icon: Phone, type: 'tel', value: staffInfo?.phone || '0987654321', readOnly: false },
         ].map(field => (
          <div key={field.label} className="space-y-1.5">
           <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{field.label}</label>
           <div className="relative">
            <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
             type={field.type}
             defaultValue={field.value}
             readOnly={field.readOnly}
             className={cn(
              'w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all',
              field.readOnly
               ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
               : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
             )}
            />
           </div>
          </div>
         ))}
        </div>
       </SectionCard>

       <SectionCard title="Thông tin bổ sung" icon={Building2} iconBg="bg-indigo-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         {[
          { label: 'Phòng ban', value: staffInfo?.department || 'Vận hành Sàn' },
          { label: 'Ngày bắt đầu', value: '12/01/2024' },
         ].map(item => (
          <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
           <span className="text-xs text-slate-500 font-medium">{item.label}</span>
           <span className="text-sm font-semibold text-slate-800">{item.value}</span>
          </div>
         ))}
        </div>
       </SectionCard>
      </div>
     )}

     {/* Security tab */}
     {activeTab === 'security' && (
      <div className="space-y-5 animate-in fade-in duration-300">
       <SectionCard title="Đổi mật khẩu" icon={Lock} iconBg="bg-red-500">
        <div className="space-y-4 max-w-md">
         {[
          { label: 'Mật khẩu hiện tại', show: showCurrentPassword, toggle: () => setShowCurrentPassword(!showCurrentPassword) },
          { label: 'Mật khẩu mới', show: showNewPassword, toggle: () => setShowNewPassword(!showNewPassword) },
          { label: 'Xác nhận mật khẩu mới', show: false, toggle: null },
         ].map((field, i) => (
          <div key={i} className="space-y-1.5">
           <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{field.label}</label>
           <div className="relative">
            <input
             type={field.show ? 'text' : 'password'}
             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all pr-10"
            />
            {field.toggle && (
             <button onClick={field.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
             </button>
            )}
           </div>
          </div>
         ))}
         <button className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          Cập nhật mật khẩu
         </button>
        </div>
       </SectionCard>

       <SectionCard title="Bảo mật hai lớp (2FA)" icon={Shield} iconBg="bg-orange-500">
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
         <div>
          <p className="text-sm font-semibold text-slate-800">Xác thực Google Authenticator</p>
          <p className="text-xs text-slate-500 mt-0.5">Tăng cường bảo mật bằng mã xác thực khi đăng nhập.</p>
         </div>
         <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">Chưa kích hoạt</span>
          <Toggle enabled={false} onChange={() => {}} />
         </div>
        </div>
       </SectionCard>
      </div>
     )}

     {/* Notifications tab */}
     {activeTab === 'notifications' && (
      <div className="animate-in fade-in duration-300">
       <SectionCard title="Cài đặt thông báo" icon={Bell} iconBg="bg-amber-500">
        <div className="flex justify-end mb-4">
         <button
          onClick={() => addNotification('Thông báo thử nghiệm', 'Đây là thông báo test lúc ' + new Date().toLocaleTimeString())}
          className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors"
         >
          <Bell className="w-3.5 h-3.5" /> Gửi thông báo test
         </button>
        </div>
        <div className="space-y-3">
         {notifSettings.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
           <div>
            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
           </div>
           <Toggle
            enabled={item.enabled}
            onChange={() => setNotifSettings(prev => prev.map((n, i) => i === idx ? { ...n, enabled: !n.enabled } : n))}
           />
          </div>
         ))}
        </div>
       </SectionCard>
      </div>
     )}

     {/* Appearance tab */}
     {activeTab === 'appearance' && (
      <div className="space-y-5 animate-in fade-in duration-300">
       <SectionCard title="Chế độ giao diện" icon={Palette} iconBg="bg-violet-500">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
         {[
          { id: 'light',  label: 'Sáng (Mặc định)', bg: 'bg-slate-100', accent: 'bg-white border border-slate-200', dot: 'bg-blue-500' },
          { id: 'dark',   label: 'Tối (Dark Mode)',  bg: 'bg-slate-800', accent: 'bg-slate-900 border border-slate-700', dot: 'bg-slate-400' },
          { id: 'nature', label: 'Nature (Eco)',      bg: 'bg-emerald-50', accent: 'bg-emerald-600', dot: 'bg-emerald-500' },
         ].map(t => (
          <button
           key={t.id}
           onClick={() => setTheme(t.id as any)}
           className={cn(
            'p-4 rounded-2xl border-2 transition-all text-left',
            theme === t.id ? 'border-blue-500 shadow-md' : 'border-slate-200 hover:border-slate-300'
           )}
          >
           <div className={cn('w-full h-12 rounded-xl mb-3', t.bg)}>
            <div className={cn('m-2 w-16 h-2 rounded-full', t.accent)} />
           </div>
           <p className={cn('text-xs font-semibold', theme === t.id ? 'text-blue-600' : 'text-slate-600')}>
            {t.label}
           </p>
           {theme === t.id && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />}
          </button>
         ))}
        </div>
       </SectionCard>

       <SectionCard title="Ngôn ngữ hệ thống" icon={Globe} iconBg="bg-cyan-500">
        <div className="grid grid-cols-2 gap-3 max-w-xs">
         {[
          { id: 'vi', label: '🇻🇳 Tiếng Việt' },
          { id: 'en', label: '🇺🇸 English' },
         ].map(lang => (
          <button
           key={lang.id}
           onClick={() => setLanguage(lang.id as any)}
           className={cn(
            'p-3 rounded-xl text-sm font-semibold border-2 transition-all',
            language === lang.id
             ? 'border-blue-500 bg-blue-50 text-blue-700'
             : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
           )}
          >
           {lang.label}
          </button>
         ))}
        </div>
       </SectionCard>
      </div>
     )}

    </div>
   </div>

   {/* Danger zone */}
   <div className="bg-white border border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
     <div className="flex items-center gap-2 mb-1">
      <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
       <Shield className="w-3.5 h-3.5 text-red-500" />
      </div>
      <h4 className="text-sm font-semibold text-red-900">Vùng nguy hiểm</h4>
     </div>
     <p className="text-xs text-red-600 ml-8">Yêu cầu vô hiệu hóa tài khoản hoặc xóa dữ liệu theo chính sách bảo mật GDPR/CRM.</p>
    </div>
    <button className="shrink-0 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
     Vô hiệu hóa tài khoản
    </button>
   </div>

  </div>
 );
}
