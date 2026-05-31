import { safeLocalStorage } from '../lib/storage';
import React from 'react';
import { LogIn, Rocket, ShieldCheck, Zap, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
 const { login } = useAuth();
 const [username, setUsername] = React.useState('');
 const [password, setPassword] = React.useState('');
 const [isSubmitting, setIsSubmitting] = React.useState(false);
 const [error, setError] = React.useState<string | null>(null);
 
 const [logo, setLogo] = React.useState<string | null>(null);

 React.useEffect(() => {
   const savedLogo = safeLocalStorage.getItem('system-logo');
   if (savedLogo) setLogo(savedLogo);
 }, []);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSubmitting(true);
 setError(null);
 try {
 await login(username, password);
 } catch (err: any) {
 console.error(err);
 setError('Tài khoản hoặc mật khẩu không chính xác.');
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row font-sans">
 {/* Left Pane - Branding & Illustration */}
 <div className="hidden md:flex md:w-1/2 bg-[#0F172A] p-12 flex-col justify-between relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-full opacity-20">
 <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-slate-900 rounded-full blur-[120px]" />
 <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-600 rounded-full blur-[120px]" />
 </div>
 
 <div className="relative z-10">
 <div className="flex items-center gap-3 mb-12">
 {logo ? (
   <img src={logo} alt="Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
 ) : (
   <>
     <div className="w-6 h-6 bg-[#2563EB] rounded-sm transform rotate-45 shadow-sm shadow-slate-900/5"></div>
     <h1 className="font-serif tracking-tight text-2xl font-black text-[#FAF9F5] tracking-tight">
     VComm <span className="text-orange-500">ERP</span>
     </h1>
   </>
 )}
 </div>
 
 <div className="space-y-6 max-w-lg">
 <h2 className="text-5xl font-bold text-[#FAF9F5] leading-tight">
 Hệ quản trị doanh nghiệp <br /> 
 <span className="text-orange-500">Sử dụng sức mạnh AI.</span>
 </h2>
 <p className="text-slate-500 text-lg">
 Giải pháp toàn diện cho Sàn TMĐT Thế hệ mới. Tối ưu vận hành, đột phá doanh thu và nâng tầm trải nghiệm khách hàng.
 </p>
 </div>
 </div>

 <div className="relative z-10 grid grid-cols-2 gap-8">
 <div>
 <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-4 border border-white/10 backdrop-blur-sm">
 <Zap className="w-6 h-6 text-amber-400" />
 </div>
 <h3 className="text-[#FAF9F5] font-bold text-sm mb-1 uppercase tracking-wider">AIOps Execution</h3>
 <p className="text-slate-600 text-xs">Vận hành thông minh bằng AI, giảm 40% chi phí nhân sự.</p>
 </div>
 <div>
 <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-4 border border-white/10 backdrop-blur-sm">
 <ShieldCheck className="w-6 h-6 text-emerald-400" />
 </div>
 <h3 className="text-[#FAF9F5] font-bold text-sm mb-1 uppercase tracking-wider">Enterprise Security</h3>
 <p className="text-slate-600 text-xs">Bảo mật đa tầng theo tiêu chuẩn quốc tế cho doanh nghiệp.</p>
 </div>
 </div>
 </div>

 {/* Right Pane - Login Form */}
 <div className="flex-1 flex items-center justify-center p-6 md:p-12">
 <div className="max-w-sm w-full space-y-10 animate-in fade-in slide-in-">
 <div className="space-y-2">
 <div className="md:hidden flex items-center gap-2 mb-8">
 <div className="w-4 h-4 bg-[#2563EB] rounded-sm transform rotate-45"></div>
 <span className="text-xl font-bold text-[#111827]">VComm ERP</span>
 </div>
 <h2 className="text-3xl font-bold text-[#111827] tracking-tight">Chào mừng trở lại</h2>
 <p className="text-[#6B7280] text-sm font-medium">Nhập thông tin tài khoản được cấp để tiếp tục</p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="space-y-1.5">
 <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.1em] ml-1">Tên đăng nhập</label>
 <div className="relative group">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#2563EB] transition-colors">
 <Rocket className="w-4 h-4" />
 </div>
 <input 
 type="text" 
 required
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 placeholder="admin"
 className="w-full bg-white border border-slate-300 rounded-lg pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2563EB] transition-all"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.1em] ml-1">Mật khẩu</label>
 <div className="relative group">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#2563EB] transition-colors">
 <LogIn className="w-4 h-4" />
 </div>
 <input 
 type="password" 
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••"
 className="w-full bg-white border border-slate-300 rounded-lg pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2563EB] transition-all"
 />
 </div>
 </div>

 {error && (
 <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
 <div className="text-xs font-medium text-red-600 leading-relaxed">
 {error} <br />
 <span className="opacity-70">Vui lòng kiểm tra lại Username hoặc Password.</span>
 </div>
 </div>
 )}

 <button 
 type="submit"
 disabled={isSubmitting}
 className="w-full py-4 bg-[#2563EB] text-[#FAF9F5] rounded-lg font-bold text-sm shadow-sm shadow-slate-900/5 hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
 >
 {isSubmitting ? (
 <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
 ) : (
 <>
 <span>Xác thực & Truy cập</span>
 <ArrowRight className="w-4 h-4" />
 </>
 )}
 </button>
 </form>

 <div className="pt-6 border-t border-[#F3F4F6]">
 <div className="flex items-center gap-4 justify-center grayscale opacity-40">
 <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest whitespace-nowrap">Trusted Enterprise System</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
