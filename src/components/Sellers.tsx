import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 Users, 
 ShieldCheck, 
 FileText, 
 Search, 
 Filter, 
 MoreVertical, 
 Star, 
 Percent,
 History,
 CheckCircle2,
 XCircle,
 AlertCircle,
 Briefcase,
 Store,
 Globe,
 Plus,
 Key,
 X,
 UserCheck,
 UserCog,
 Trash2,
 Edit2,
 Settings2,
 Building,
 Lock,
 Unlock,
 MapPin,
 Wallet
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { SellerMetric } from '../types/erp';

interface SellerPosAccount {
 id: string;
 email: string;
 name: string;
 role: 'Admin' | 'Manager' | 'Staff';
 branches: string[];
}

interface PartnerData extends SellerMetric {
 partnerType: 'seller' | 'dealer' | 'factory';
 activeModules: string[];
}

export const MOCK_SELLERS: PartnerData[] = [
 {
 id: 'SEL-001',
 name: 'Mobile World',
 totalProducts: 1250,
 rating: 4.8,
 gmv: 4500000000,
 status: 'active',
 taxCode: '0101234567',
 identityCard: '001090123456',
 address: '123 Nguyen Trai, Q1, HCMC',
 representative: 'Nguyen Van A',
 commissionRate: 5,
 joinDate: '01/12/2023',
 onboardingStep: 'completed',
 partnerType: 'dealer',
 activeModules: ['ipos', 'pim', 'scm', 'hr']
 },
 {
 id: 'SEL-002',
 name: 'Fashion Hub',
 totalProducts: 850,
 rating: 4.6,
 gmv: 2800000000,
 status: 'active',
 taxCode: '0309876543',
 identityCard: '079090987654',
 commissionRate: 8,
 joinDate: '15/01/2024',
 onboardingStep: 'completed',
 partnerType: 'seller',
 activeModules: ['orders', 'pim', 'marketing', 'flashsale', 'affiliate']
 },
 {
 id: 'SEL-003',
 name: 'Eco Mart',
 totalProducts: 120,
 rating: 0,
 gmv: 0,
 status: 'pending',
 taxCode: '0401122334',
 identityCard: '012345678901',
 commissionRate: 10,
 joinDate: '10/03/2024',
 onboardingStep: 'verification',
 partnerType: 'seller',
 activeModules: []
 },
 {
 id: 'SEL-004',
 name: 'Tech Haven',
 totalProducts: 450,
 rating: 4.9,
 gmv: 1500000000,
 status: 'active',
 taxCode: '0101112223',
 identityCard: '001111222333',
 commissionRate: 3,
 joinDate: '01/02/2024',
 onboardingStep: 'completed',
 partnerType: 'seller',
 activeModules: ['orders', 'marketing']
 },
 {
 id: 'SEL-005',
 name: 'Green Cafe',
 totalProducts: 50,
 rating: 4.5,
 gmv: 500000000,
 status: 'active',
 taxCode: '0202223334',
 identityCard: '020222333444',
 commissionRate: 4,
 joinDate: '20/01/2024',
 onboardingStep: 'completed',
 partnerType: 'dealer',
 activeModules: ['ipos', 'scm']
 },
 {
 id: 'SEL-006',
 name: 'Book Worm',
 totalProducts: 2000,
 rating: 4.7,
 gmv: 300000000,
 status: 'active',
 taxCode: '0505556667',
 identityCard: '050555666777',
 commissionRate: 7,
 joinDate: '15/11/2023',
 onboardingStep: 'completed',
 partnerType: 'seller',
 activeModules: ['orders', 'marketing', 'affiliate']
 },
 {
 id: 'SEL-007',
 name: 'Fresh Foodie',
 totalProducts: 20,
 rating: 0,
 gmv: 0,
 status: 'pending',
 taxCode: '0909998887',
 identityCard: '090999888777',
 commissionRate: 12,
 joinDate: '10/04/2024',
 onboardingStep: 'verification',
 partnerType: 'dealer',
 activeModules: []
 },
 {
 id: 'SEL-008',
  name: 'Gia dá»¥ng T&T (Factory)',
 totalProducts: 45,
 rating: 4.9,
 gmv: 890000000,
 status: 'active',
 taxCode: '0315923940',
 identityCard: '001090123999',
 commissionRate: 3,
 joinDate: '15/02/2024',
 onboardingStep: 'completed',
 partnerType: 'factory',
 activeModules: ['scm', 'pim', 'marketing']
 }
];

export function SellerManagement() {
 const [sellers, setSellers] = useState<PartnerData[]>(MOCK_SELLERS);
 const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'seller' | 'dealer' | 'factory'>('all');
 const [showConfig, setShowConfig] = useState(false);
 const [selectedSeller, setSelectedSeller] = useState<PartnerData | null>(null);
 const [approvingSeller, setApprovingSeller] = useState<PartnerData | null>(null);
 const [adjustingSeller, setAdjustingSeller] = useState<PartnerData | null>(null);
 const [adjustAmount, setAdjustAmount] = useState('');
 const [approvalType, setApprovalType] = useState<'seller' | 'dealer' | 'factory'>('seller');
 const [iposFeeStatus, setIposFeeStatus] = useState<string>('paid');

 // Seller config states
 const [sellerAutoApprove, setSellerAutoApprove] = useState(false);
 const [sellerRequireTaxId, setSellerRequireTaxId] = useState(true);
 const [sellerRequireLicense, setSellerRequireLicense] = useState(true);
 const [sellerUploadLimit, setSellerUploadLimit] = useState('1000');
 const [sellerPayoutSchedule, setSellerPayoutSchedule] = useState('weekly');

 // Aditional config states
 const [productModeration, setProductModeration] = useState('auto');
 const [minRatingActive, setMinRatingActive] = useState('4.0');
 const [maxPenaltyPoints, setMaxPenaltyPoints] = useState('12');
 const [requiredFulfillment, setRequiredFulfillment] = useState(false);
 const [sellerAllowCod, setSellerAllowCod] = useState(true);

 // Advanced config states
 const [sellerShippingMode, setSellerShippingMode] = useState('platform');
 const [slaHours, setSlaHours] = useState('24');
 const [autoReturnLimit, setAutoReturnLimit] = useState('200000');

 const handleToggleLock = (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 setSellers(sellers.map(s => {
 if (s.id === id) {
 return { ...s, status: s.status === 'suspended' ? 'active' : 'suspended' as any };
 }
 return s;
 }));
 };

 const submitAdjustBalance = (e: React.FormEvent) => {
 e.preventDefault();
 if (!adjustingSeller || !adjustAmount) return;
 
 setSellers(sellers.map(s => {
 if (s.id === adjustingSeller.id) {
 return { ...s, walletBalance: (s.walletBalance || 0) + Number(adjustAmount) };
 }
 return s;
 }));
 setAdjustingSeller(null);
 setAdjustAmount('');
 };

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Quáº£n lÃ½ Seller / Vendor</h1>
 <p className="text-sm text-[#6B7280] mt-1">Há»“ sÆ¡ nhÃ  bÃ¡n, Ä‘á»‘i soÃ¡t MST/CCCD vÃ  quáº£n lÃ½ hoa há»“ng.</p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={() => setShowConfig(!showConfig)}
 className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2 text-primary-600"
 >
 <Settings2 className="w-4 h-4" />
 {showConfig ? 'Quay láº¡i Quáº£n lÃ½' : 'Cáº¥u hÃ¬nh'}
 </button>
 {!showConfig && (
 <button className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm">
 KÃ­ch hoáº¡t Seller nhanh
 </button>
 )}
 </div>
 </div>

 {showConfig ? (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-6">
 <h3 className="font-bold text-[#111827] flex items-center gap-2 text-sm border-b border-[#F3F4F6] pb-3">
 <Briefcase className="w-4 h-4 text-[#2563EB]" /> Cáº¥u hÃ¬nh NhÃ  bÃ¡n hÃ ng
 </h3>

 <div className="space-y-6">
 {/* Section 1: Seller Onboarding & Approval */}
 <div>
 <h4 className="text-sm font-bold text-slate-900 mb-3">Quy trÃ¬nh ÄÄƒng kÃ½ & Duyá»‡t</h4>
 <div className="space-y-3">
 <div className="flex items-center justify-between p-3 border border-slate-300 rounded-lg bg-slate-50">
 <div>
 <label className="text-sm font-bold text-slate-800">Duyá»‡t tá»± Ä‘á»™ng (Auto-Approve)</label>
 <p className="text-xs text-slate-600">Tá»± Ä‘á»™ng duyá»‡t Seller ná»™p Ä‘á»§ há»“ sÆ¡ khÃ´ng cáº§n qua kiá»ƒm duyá»‡t tay.</p>
 </div>
 <div 
 onClick={() => setSellerAutoApprove(!sellerAutoApprove)}
 className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", sellerAutoApprove ? "bg-emerald-500" : "bg-slate-200")}
 >
 <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300", sellerAutoApprove ? "left-[22px]" : "left-1")} />
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="flex-1 flex items-center justify-between p-3 border border-slate-300 rounded-lg">
 <div>
 <label className="text-sm font-bold text-slate-800">Báº¯t buá»™c CMND/CCCD/MÃ£ sá»‘ thuáº¿</label>
 </div>
 <input 
 type="checkbox" 
 checked={sellerRequireTaxId} 
 onChange={(e) => setSellerRequireTaxId(e.target.checked)}
 className="w-4 h-4 text-orange-700 rounded" 
 />
 </div>
 <div className="flex-1 flex items-center justify-between p-3 border border-slate-300 rounded-lg">
 <div>
 <label className="text-sm font-bold text-slate-800">Báº¯t buá»™c Giáº¥y phÃ©p kinh doanh (Äá»‘i vá»›i DN)</label>
 </div>
 <input 
 type="checkbox" 
 checked={sellerRequireLicense} 
 onChange={(e) => setSellerRequireLicense(e.target.checked)}
 className="w-4 h-4 text-orange-700 rounded" 
 />
 </div>
 </div>
 </div>
 </div>

 {/* Section 2: Quotas & Limits */}
 <div>
 <h4 className="text-sm font-bold text-slate-900 mb-3">Giá»›i háº¡n & Äá»‹nh má»©c máº·c Ä‘á»‹nh</h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">Sá»‘ sáº£n pháº©m tá»‘i Ä‘a (Má»›i má»Ÿ shop)</label>
 <input 
 type="number" 
 value={sellerUploadLimit}
 onChange={(e) => setSellerUploadLimit(e.target.value)}
 className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">Chu ká»³ Äá»‘i soÃ¡t / Payout máº·c Ä‘á»‹nh</label>
 <select 
 value={sellerPayoutSchedule}
 onChange={(e) => setSellerPayoutSchedule(e.target.value)}
 className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white"
 >
 <option value="daily">HÃ ng ngÃ y (Daily)</option>
 <option value="weekly">HÃ ng tuáº§n (Weekly)</option>
 <option value="biweekly">2 tuáº§n / láº§n (Bi-weekly)</option>
 <option value="monthly">HÃ ng thÃ¡ng (Monthly)</option>
 </select>
 </div>
 </div>
 </div>

 {/* Section 3: Product Moderation */}
 <div>
 <h4 className="text-sm font-bold text-slate-900 mb-3">Kiá»ƒm duyá»‡t sáº£n pháº©m & Váº­n hÃ nh</h4>
 <div className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">Cháº¿ Ä‘á»™ kiá»ƒm duyá»‡t sáº£n pháº©m má»›i</label>
 <select 
 value={productModeration}
 onChange={(e) => setProductModeration(e.target.value)}
 className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white"
 >
 <option value="auto">Tá»± Ä‘á»™ng duyá»‡t (AI Auto-Approve)</option>
 <option value="manual">Duyá»‡t thá»§ cÃ´ng (Manual review)</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">YÃªu cáº§u tham gia FBP (Fulfillment By Platform)</label>
 <select 
 value={requiredFulfillment ? "yes" : "no"}
 onChange={(e) => setRequiredFulfillment(e.target.value === "yes")}
 className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white"
 >
 <option value="no">KhÃ´ng báº¯t buá»™c (NhÃ  bÃ¡n tá»± ship)</option>
 <option value="yes">Báº¯t buá»™c gá»­i kho xá»­ lÃ½</option>
 </select>
 </div>
 </div>
 
 <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-slate-300 rounded-lg bg-slate-50 gap-4">
 <div>
 <label className="text-sm font-bold text-slate-800">Cho phÃ©p NhÃ  bÃ¡n báº­t COD</label>
 <p className="text-xs text-slate-600">KhÃ¡ch hÃ ng Ä‘Æ°á»£c quyá»n nháº­n hÃ ng má»›i thanh toÃ¡n cho cÃ¡c Ä‘Æ¡n cá»§a Seller.</p>
 </div>
 <div className="flex-shrink-0">
 <div 
 onClick={() => setSellerAllowCod(!sellerAllowCod)}
 className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", sellerAllowCod ? "bg-emerald-500" : "bg-slate-200")}
 >
 <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300", sellerAllowCod ? "left-[22px]" : "left-1")} />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Section 4: Performance & Penalty */}
 <div>
 <h4 className="text-sm font-bold text-slate-900 mb-3">Hiá»‡u suáº¥t & Cháº¿ tÃ i vi pháº¡m</h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">Äiá»ƒm Ä‘Ã¡nh giÃ¡ tá»‘i thiá»ƒu (Duy trÃ¬ Shop)</label>
 <div className="relative">
 <input 
 type="number" step="0.1"
 value={minRatingActive}
 onChange={(e) => setMinRatingActive(e.target.value)}
 className="w-full p-2 pl-3 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 <span className="absolute right-3 top-1.5 text-sm text-slate-500">â­</span>
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">NgÆ°á»¡ng Ä‘iá»ƒm pháº¡t (KhÃ³a tÃ i khoáº£n)</label>
 <div className="relative">
 <input 
 type="number"
 value={maxPenaltyPoints}
 onChange={(e) => setMaxPenaltyPoints(e.target.value)}
 className="w-full p-2 pl-3 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 <span className="absolute right-3 top-2 text-sm text-slate-500 font-bold text-xs uppercase pt-[2px]">Äiá»ƒm</span>
 </div>
 </div>
 </div>
 </div>

 {/* Section 5: Shipping & SLA */}
 <div>
 <h4 className="text-sm font-bold text-slate-900 mb-3">Váº­n chuyá»ƒn & Xá»­ lÃ½ Ä‘Æ¡n hÃ ng (SLA)</h4>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">HÃ¬nh thá»©c váº­n chuyá»ƒn</label>
 <select 
 value={sellerShippingMode}
 onChange={(e) => setSellerShippingMode(e.target.value)}
 className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white"
 >
 <option value="platform">SÃ n láº¥y vÃ  giao hÃ ng (BÆ°u cá»¥c sÃ n)</option>
 <option value="custom">NhÃ  bÃ¡n tá»± cáº¥u hÃ¬nh Ä‘á»‘i tÃ¡c váº­n chuyá»ƒn</option>
 <option value="mixed">Linh hoáº¡t theo vÃ¹ng</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">SLA XÃ¡c nháº­n & Giao hÃ ng (Giá»)</label>
 <div className="relative">
 <input 
 type="number"
 value={slaHours}
 onChange={(e) => setSlaHours(e.target.value)}
 className="w-full p-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 <span className="absolute right-3 top-2 text-sm text-slate-500 font-bold text-xs uppercase pt-[2px]">Giá»</span>
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">Háº¡n má»©c hoÃ n tráº£ tá»± Ä‘á»™ng (VNÄ)</label>
 <div className="relative">
 <input 
 type="number"
 value={autoReturnLimit}
 onChange={(e) => setAutoReturnLimit(e.target.value)}
 className="w-full p-2 pr-12 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 <span className="absolute right-3 top-2 text-sm text-slate-500 font-bold text-xs pt-[2px]">VNÄ</span>
 </div>
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-4 border-t border-[#F3F4F6] mt-6">
 <button 
 onClick={() => {
 alert('ÄÃ£ lÆ°u cáº¥u hÃ¬nh Module NhÃ  bÃ¡n hÃ ng!');
 setShowConfig(false);
 }}
 className="px-6 py-2.5 bg-[#2563EB] text-[#FAF9F5] rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
 >
 LÆ°u cáº¥u hÃ¬nh
 </button>
 </div>
 </div>
 </div>
 </div>
 ) : (
 <>
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-3 gap-4" columns={3} gap={24}>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex items-center gap-3 mb-4">
 <div className="p-2 bg-slate-100 text-orange-700 rounded-lg">
 <ShieldCheck className="w-5 h-5" />
 </div>
 <span className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Äang chá» Onboarding</span>
 </div>
 <div className="text-3xl font-bold text-[#111827]">12 <span className="text-sm font-normal text-[#9CA3AF]">Seller</span></div>
 <div className="mt-4 flex items-center gap-2 text-xs text-[#EAB308] font-bold">
 <AlertCircle className="w-3 h-3" /> 8 Seller Ä‘ang chá» Ä‘á»‘i soÃ¡t MST
 </div>
 </div>

 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex items-center gap-3 mb-4">
 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
 <Percent className="w-5 h-5" />
 </div>
 <span className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Hoa há»“ng trung bÃ¬nh</span>
 </div>
 <div className="text-3xl font-bold text-[#111827]">7.2% <span className="text-sm font-normal text-[#9CA3AF]">revenue share</span></div>
 <p className="mt-4 text-[10px] text-[#6B7280]">Tá»•ng doanh thu phÃ­ sÃ n: {formatCurrency(850000000)}</p>
 </div>

 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex items-center gap-3 mb-4">
 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
 <Star className="w-5 h-5" />
 </div>
 <span className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Rating trung bÃ¬nh sÃ n</span>
 </div>
 <div className="text-3xl font-bold text-[#111827]">4.72 <span className="text-sm font-normal text-[#9CA3AF]">/ 5.0</span></div>
 <p className="mt-4 text-[10px] text-[#10B981] font-medium">+0.15 so vá»›i thÃ¡ng trÆ°á»›c</p>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="TÃ¬m tÃªn Seller, MST, CCCD..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-80"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Bá»™ lá»c Ä‘á»‘i soÃ¡t
 </button>
 </div>
 <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white">
 <button 
 onClick={() => setActiveTab('all')}
 className={cn("px-4 py-2 text-xs font-semibold transition-all", activeTab === 'all' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-[#4B5563] hover:bg-slate-50")}
 >Táº¥t cáº£ Äá»‘i tÃ¡c</button>
 <button 
 onClick={() => setActiveTab('seller')}
 className={cn("px-4 py-2 text-xs font-semibold border-l border-slate-300 transition-all", activeTab === 'seller' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-[#4B5563] hover:bg-slate-50")}
 >NhÃ  bÃ¡n (Online)</button>
 <button 
 onClick={() => setActiveTab('dealer')}
 className={cn("px-4 py-2 text-xs font-semibold border-l border-slate-300 transition-all", activeTab === 'dealer' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-[#4B5563] hover:bg-slate-50")}
 >Äáº¡i lÃ½ (Offline)</button>
 <button 
 onClick={() => setActiveTab('factory')}
 className={cn("px-4 py-2 text-xs font-semibold border-l border-slate-300 transition-all", activeTab === 'factory' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-[#4B5563] hover:bg-slate-50")}
 >NhÃ  mÃ¡y (M2C)</button>
 <button 
 onClick={() => setActiveTab('pending')}
 className={cn("px-4 py-2 text-xs font-semibold border-l border-slate-300 transition-all", activeTab === 'pending' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-[#4B5563] hover:bg-slate-50")}
 >Äang chá» duyá»‡t</button>
 </div>
 </div>

 <div className="bg-white border border-slate-300 shadow-sm rounded-xl overflow-hidden mt-4">
 <div className="overflow-x-auto min-w-0">
<table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Há»“ sÆ¡ Äá»‘i tÃ¡c</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">XÃ¡c thá»±c Äá»‹nh danh</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">GMV / PhÃ­ SÃ n</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Chá»‰ sá»‘ Rating</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">HÃ nh Ä‘á»™ng</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {sellers.filter(s => {
 if (activeTab === 'pending') return s.status === 'pending';
 if (activeTab === 'seller') return s.partnerType === 'seller';
 if (activeTab === 'dealer') return s.partnerType === 'dealer';
 if (activeTab === 'factory') return s.partnerType === 'factory';
 return true;
 }).map((seller) => (
 <tr key={seller.id} className="hover:bg-[#F9FAFB] group transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#2563EB] font-bold text-sm border border-slate-300">
 {seller.name.charAt(0)}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <p 
 className="text-sm font-semibold text-[#111827] cursor-pointer hover:text-orange-700 transition-colors"
 onClick={() => setSelectedSeller(seller)}
 >{seller.name}</p>
 {seller.partnerType === 'seller' ? (
 <span className="text-[9px] bg-primary-50 text-primary-600 border border-primary-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">NhÃ  bÃ¡n</span>
 ) : seller.partnerType === 'dealer' ? (
 <span className="text-[9px] bg-teal-50 text-teal-600 border border-teal-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Äáº¡i lÃ½ Offline</span>
 ) : (
 <span className="text-[9px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">NhÃ  mÃ¡y (M2C)</span>
 )}
 </div>
 <p className="text-[10px] text-[#9CA3AF] mt-0.5">NgÃ y gia nháº­p: {seller.joinDate}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col items-center gap-1.5">
 <div className="flex items-center gap-2">
 <div className={cn(
 "px-2 py-0.5 rounded text-[10px] font-bold",
 seller.onboardingStep === 'completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
 )}>
 {seller.onboardingStep === 'completed' ? 'MST ÄÃƒ Äá»I SOÃT' : 'CHá»œ Äá»I SOÃT MST'}
 </div>
 </div>
 <div className="text-[10px] font-mono text-[#6B7280] select-all">MST: {seller.taxCode}</div>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <p className="text-sm font-bold text-[#111827]">{formatCurrency(seller.gmv)}</p>
 <p className="text-[12px] font-bold text-emerald-600 mt-1">{formatCurrency(seller.walletBalance || 0)} <span className="text-[10px] font-medium text-slate-600">Wallet</span></p>
 <p className="text-[10px] text-[#2563EB] font-medium mt-0.5">Hoa há»“ng: {seller.commissionRate}%</p>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col items-center">
 <div className="flex items-center gap-1">
 <Star className={cn("w-3.5 h-3.5 fill-current", seller.rating > 0 ? "text-[#F59E0B]" : "text-[#E5E7EB]")} />
 <span className="text-sm font-bold text-[#111827]">{seller.rating || '--'}</span>
 </div>
 <span className="text-[10px] text-[#9CA3AF] mt-1">{seller.totalProducts} SP</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex gap-2 justify-center">
 {seller.status === 'pending' ? (
 <button 
 onClick={() => {
 setApprovalType(seller.partnerType || 'seller');
 setApprovingSeller(seller);
 }}
 className="flex-1 px-3 py-1.5 bg-[#2563EB] text-[#FAF9F5] text-[11px] font-bold rounded-md hover:bg-slate-800 shadow-sm"
 >
 Duyá»‡t há»“ sÆ¡
 </button>
 ) : (
 <>
 <button 
 onClick={() => setSelectedSeller(seller)}
 className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all font-bold flex items-center gap-1 text-[10px]"
 title="TÃ­ch há»£p iPOS, App & PhÃ¢n quyá»n"
 >
 <Briefcase className="w-3.5 h-3.5" /> PhÃ¢n quyá»n
 </button>
 <button 
 onClick={(e) => { e.stopPropagation(); setAdjustingSeller(seller); }}
 className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
 title="Cá»™ng/Trá»« tiá»n Wallet"
 >
 <Wallet className="w-4 h-4" />
 </button>
 <button 
 onClick={(e) => handleToggleLock(seller.id, e)}
 className={cn("p-2 rounded-lg transition-all", seller.status === 'suspended' ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-red-50 text-red-600 hover:bg-red-100")}
 title={seller.status === 'suspended' ? "Má»Ÿ khÃ³a tÃ i khoáº£n" : "KhÃ³a tÃ i khoáº£n"}
 >
 {seller.status === 'suspended' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
 </button>
 </>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 <div className="bg-[#111827] rounded-lg p-8 text-[#FAF9F5] relative overflow-hidden shadow-sm">
 <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
 <ShieldCheck className="w-32 h-32" />
 </div>
 <div className="relative z-10 space-y-4">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-800/20 rounded-lg">
 <Briefcase className="w-6 h-6 text-orange-500" />
 </div>
 <h3 className="text-xl font-semibold">CÆ¡ cháº¿ phÃª duyá»‡t há»“ sÆ¡ tá»± Ä‘á»™ng</h3>
 </div>
 <p className="text-slate-500 text-sm max-w-2xl">
 Há»‡ thá»‘ng tÃ­ch há»£p API tra cá»©u tá»« Tá»•ng cá»¥c Thuáº¿ vÃ  cÆ¡ sá»Ÿ dá»¯ liá»‡u quá»‘c gia vá» dÃ¢n cÆ°. Tá»± Ä‘á»™ng tá»« chá»‘i há»“ sÆ¡ náº¿u MST hoáº·c CCCD/CMND khÃ´ng tá»“n táº¡i hoáº·c khÃ´ng chÃ­nh chá»§.
 </p>
 <div className="flex gap-4 pt-2">
 <div className="flex items-center gap-2 text-xs bg-white/5 px-3 py-2 rounded-lg border border-white/10">
 <div className="w-2 h-2 rounded-full bg-[#10B981]"></div> Äang káº¿t ná»‘i MST API
 </div>
 <div className="flex items-center gap-2 text-xs bg-white/5 px-3 py-2 rounded-lg border border-white/10">
 <div className="w-2 h-2 rounded-full bg-[#10B981]"></div> Äang káº¿t ná»‘i CCCD OCR
 </div>
 </div>
 </div>
 </div>

 {selectedSeller && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-sm animate-in zoom-in-95 duration-300">
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold text-xl">
 {selectedSeller.name.charAt(0)}
 </div>
 <div>
 <h2 className="text-xl font-bold text-slate-900 leading-tight">Cáº¥u hÃ¬nh Há»‡ sinh thÃ¡i & PhÃ¢n quyá»n á»©ng dá»¥ng</h2>
 <p className="text-xs text-slate-600 font-medium">Äá»‘i tÃ¡c: <span className="font-bold text-primary-600">{selectedSeller.name}</span> ({selectedSeller.partnerType === 'seller' ? 'NhÃ  bÃ¡n Online' : selectedSeller.partnerType === 'dealer' ? 'Äáº¡i lÃ½ Offline' : 'NhÃ  mÃ¡y (M2C)'}) â€¢ MST: {selectedSeller.taxCode}</p>
 </div>
 </div>
 <button onClick={() => setSelectedSeller(null)} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
 </div>
 <DraggableGrid className="flex-1 overflow-y-auto p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar" columns={2} gap={32}>
 {/* Left Col: Domain Setup */}
 <div className="space-y-6">
 <div>
 <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
 <Globe className="w-5 h-5 text-primary-600" /> TÃªn miá»n POS (Domain)
 </h3>
 <p className="text-[11px] text-slate-600 mb-4">Cáº¥u hÃ¬nh Subdomain dÃ nh riÃªng cho nhÃ¢n viÃªn táº¡i cÃ¡c chi nhÃ¡nh/cá»­a hÃ ng cá»§a Seller nÃ y Ä‘Äƒng nháº­p há»‡ thá»‘ng iPOS Ä‘á»™c láº­p.</p>
 <div className="space-y-3">
 <div>
 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Subdomain chÃ­nh</label>
 <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg overflow-hidden">
 <span className="pl-4 pr-1 py-3 text-slate-500"><Globe className="w-4 h-4" /></span>
 <input type="text" className="flex-1 bg-transparent px-2 py-3 text-sm font-bold text-slate-900 focus:outline-none" defaultValue={selectedSeller.name.toLowerCase().replace(/\s/g, '')} />
 <span className="px-4 py-3 bg-slate-100 border-l border-slate-300 text-xs font-mono font-medium text-slate-600">.v-erp.com</span>
 </div>
 </div>
 </div>
 <button className="mt-4 w-full bg-primary-50 text-primary-700 py-2.5 rounded-lg text-sm font-bold border border-primary-100 hover:bg-primary-100 transition-colors">
 Cáº­p nháº­t Domain
 </button>
 </div>
 
 <div className="pt-6 border-t border-slate-200">
 <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
 <Store className="w-5 h-5 text-primary-600" /> Chi nhÃ¡nh / Cá»­a hÃ ng
 </h3>
 <div className="space-y-3">
 <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex justify-between items-center">
 <div>
 <p className="text-sm font-bold text-slate-900">Chi nhÃ¡nh Máº·c Ä‘á»‹nh (Trá»¥ sá»Ÿ)</p>
 <p className="text-[10px] text-slate-600">MÃ£: ST-001</p>
 </div>
 <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold">ACTIVE</span>
 </div>
 </div>
 <button className="mt-4 w-full border-2 border-dashed border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm font-bold hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
 <Plus className="w-4 h-4" /> ThÃªm Cá»­a hÃ ng má»›i
 </button>
 </div>

 <div className="pt-6 border-t border-slate-200">
 <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
 <ShieldCheck className="w-5 h-5 text-primary-600" /> Cáº¥p phÃ©p á»¨ng dá»¥ng & Modules
 </h3>
 <p className="text-[11px] text-slate-600 mb-4">Chá»n cÃ¡c module trÃªn há»‡ thá»‘ng ERP mÃ  Ä‘á»‘i tÃ¡c nÃ y Ä‘Æ°á»£c phÃ©p truy cáº­p dá»±a trÃªn mÃ´ hÃ¬nh kinh doanh.</p>
 <div className="grid grid-cols-2 gap-3">
 {[
 { id: 'dashboard', label: 'Dashboard & PhÃ¢n tÃ­ch', reqDealer: true, reqSeller: true, reqFactory: true },
 { id: 'orders', label: 'Quáº£n lÃ½ ÄÆ¡n hÃ ng', reqDealer: false, reqSeller: true, reqFactory: true },
 { id: 'pim', label: 'Quáº£n lÃ½ Sáº£n pháº©m (PIM)', reqDealer: true, reqSeller: true, reqFactory: true },
 { id: 'ipos', label: 'iPOS BÃ¡n hÃ ng', reqDealer: true, reqSeller: false, reqFactory: false },
 { id: 'marketing', label: 'Chiáº¿n dá»‹ch Marketing', reqDealer: false, reqSeller: true, reqFactory: true },
 { id: 'flashsale', label: 'Flash Sale (Mua chung)', reqDealer: false, reqSeller: true, reqFactory: true },
 { id: 'scm', label: 'Chuá»—i cung á»©ng (Kho)', reqDealer: true, reqSeller: false, reqFactory: true },
 { id: 'hr', label: 'NhÃ¢n sá»± (Giao ca, LÆ°Æ¡ng)', reqDealer: true, reqSeller: false, reqFactory: true }
 ].map(mod => {
 const isActive = selectedSeller.activeModules.includes(mod.id) || 
 (selectedSeller.partnerType === 'seller' && mod.reqSeller) ||
 (selectedSeller.partnerType === 'dealer' && mod.reqDealer) ||
 (selectedSeller.partnerType === 'factory' && mod.reqFactory);
 
 return (
 <label key={mod.id} className={cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-all", isActive ? "border-primary-200 bg-primary-50/30" : "border-slate-200")}>
 <input type="checkbox" defaultChecked={isActive} className="mt-1 flex-shrink-0 text-primary-600 rounded border-slate-400 focus:ring-primary-500" />
 <span className="text-xs font-bold text-slate-800 leading-tight">{mod.label}</span>
 </label>
 );
 })}
 </div>
 </div>
 </div>

 {/* Right Col: RBAC Staff Setup */}
 <div className="bg-slate-50 rounded-lg p-6 border border-slate-300">
 <div className="flex justify-between items-center mb-6">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <UserCog className="w-5 h-5 text-primary-600" /> PhÃ¢n quyá»n TÃ i khoáº£n
 </h3>
 <button className="bg-primary-600 text-[#FAF9F5] p-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
 <Plus className="w-4 h-4" />
 </button>
 </div>

 <div className="space-y-4">
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
 <div className="flex justify-between items-start">
 <div className="flex gap-3">
 <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center font-bold text-rose-600 text-xs">AD</div>
 <div>
 <p className="text-sm font-bold text-slate-900">{selectedSeller.name} Admin</p>
 <p className="text-[10px] text-slate-600">admin@{selectedSeller.name.toLowerCase().replace(/\s/g, '')}.v-erp.com</p>
 <div className="mt-2 flex gap-2">
 <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Quáº£n trá»‹ viÃªn (Admin)</span>
 </div>
 </div>
 </div>
 <button className="text-slate-500 hover:text-primary-600 transition-colors"><Key className="w-4 h-4" /></button>
 </div>
 </div>

 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800" />
 <div className="flex justify-between items-start">
 <div className="flex gap-3">
 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-orange-700 text-xs">MG</div>
 <div>
 <p className="text-sm font-bold text-slate-900">Quáº£n lÃ½ Cá»­a hÃ ng 1</p>
 <p className="text-[10px] text-slate-600">manager1@{selectedSeller.name.toLowerCase().replace(/\s/g, '')}.v-erp.com</p>
 <div className="mt-2 flex gap-2">
 <span className="text-[9px] bg-[#EAE7DF] text-orange-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Quáº£n lÃ½ (Manager)</span>
 </div>
 </div>
 </div>
 <div className="flex gap-2">
 <button className="text-slate-500 hover:text-primary-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
 <button className="text-slate-500 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>
 <div className="mt-3 pt-3 border-t border-stone-50">
 <p className="text-[10px] text-slate-600 flex items-center gap-1"><Store className="w-3 h-3" /> Quyá»n truy cáº­p: <span className="font-bold text-slate-800">Chi nhÃ¡nh Máº·c Ä‘á»‹nh (ST-001)</span></p>
 </div>
 </div>

 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
 <div className="flex justify-between items-start">
 <div className="flex gap-3">
 <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-emerald-600 text-xs">ST</div>
 <div>
 <p className="text-sm font-bold text-slate-900">Thu NgÃ¢n (Ca 1)</p>
 <p className="text-[10px] text-slate-600">pos1@{selectedSeller.name.toLowerCase().replace(/\s/g, '')}.v-erp.com</p>
 <div className="mt-2 flex gap-2">
 <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">NhÃ¢n viÃªn POS (Staff)</span>
 </div>
 </div>
 </div>
 <div className="flex gap-2">
 <button className="text-slate-500 hover:text-primary-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
 <button className="text-slate-500 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </DraggableGrid>
 </div>
 </div>
 )}

 {approvingSeller && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-sm animate-in zoom-in-95 duration-300">
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-[#EAE7DF] text-orange-700 rounded-lg flex items-center justify-center font-bold text-xl">
 <UserCheck className="w-6 h-6" />
 </div>
 <div>
 <h2 className="text-xl font-bold text-slate-900 leading-tight">Duyá»‡t há»“ sÆ¡ Äá»‘i tÃ¡c má»›i</h2>
 <p className="text-xs text-slate-600 font-medium">Äá»‘i tÃ¡c: <span className="font-bold text-orange-700">{approvingSeller.name}</span> â€¢ MST: {approvingSeller.taxCode}</p>
 </div>
 </div>
 <button onClick={() => setApprovingSeller(null)} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
 </div>

 <div className="flex-1 overflow-y-auto p-8 bg-white grid grid-cols-1 md:grid-cols-12 gap-8 custom-scrollbar">
 {/* Left Column: Information Overview & Selection */}
 <div className="md:col-span-5 space-y-6">
 <div>
 <h3 className="font-bold text-slate-900 mb-3">Loáº¡i hÃ¬nh Äá»‘i tÃ¡c</h3>
 <div className="grid grid-cols-3 gap-3">
 <button 
 onClick={() => setApprovalType('seller')}
 className={cn("p-4 border rounded-xl flex flex-col items-center gap-2 text-center transition-all", approvalType === 'seller' ? "border-slate-900 bg-slate-100/50 shadow-sm" : "border-slate-300 hover:bg-slate-50")}
 >
 <div className={cn("p-2 rounded-full", approvalType === 'seller' ? "bg-[#EAE7DF] text-orange-700" : "bg-slate-100 text-slate-600")}>
 <Store className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-900">NhÃ  bÃ¡n TMÄT</p>
 <p className="text-[10px] text-slate-600 mt-1">BÃ¡n hÃ ng Online</p>
 </div>
 </button>
 <button 
 onClick={() => setApprovalType('dealer')}
 className={cn("p-4 border rounded-xl flex flex-col items-center gap-2 text-center transition-all", approvalType === 'dealer' ? "border-emerald-500 bg-emerald-50/50 shadow-sm" : "border-slate-300 hover:bg-slate-50")}
 >
 <div className={cn("p-2 rounded-full", approvalType === 'dealer' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600")}>
 <Briefcase className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-900">Cá»­a hÃ ng iPOS</p>
 <p className="text-[10px] text-slate-600 mt-1">F&B / Retail Offline</p>
 </div>
 </button>
 <button 
 onClick={() => setApprovalType('factory')}
 className={cn("p-4 border rounded-xl flex flex-col items-center gap-2 text-center transition-all", approvalType === 'factory' ? "border-purple-500 bg-purple-50/50 shadow-sm" : "border-slate-300 hover:bg-slate-50")}
 >
 <div className={cn("p-2 rounded-full", approvalType === 'factory' ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-600")}>
 <Building className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-900">NhÃ  mÃ¡y M2C</p>
 <p className="text-[10px] text-slate-600 mt-1">BÃ¡n trá»±c tiáº¿p</p>
 </div>
 </button>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-slate-300 p-5 space-y-4">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 ThÃ´ng tin NgÆ°á»i bÃ¡n
 </h3>
 <div className="space-y-4">
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">MÃ´ hÃ¬nh kinh doanh</label>
 <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-600">
 <option>CÃ¡ nhÃ¢n kinh doanh</option>
 <option>Há»™ kinh doanh</option>
 <option>CÃ´ng ty / Doanh nghiá»‡p</option>
 </select>
 </div>
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">MÃ£ sá»‘ thuáº¿</label>
 <input type="text" defaultValue={approvingSeller.taxCode} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-600" />
 </div>
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Äá»‹a chá»‰ Ä‘Äƒng kÃ½ Thuáº¿</label>
 <input type="text" defaultValue="123 ÄÆ°á»ng Nguyá»…n VÄƒn Linh, Quáº­n 7, TP.HCM" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-600" />
 </div>
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Äá»‹a chá»‰ Cá»­a hÃ ng / Kho hÃ ng</label>
 <input type="text" defaultValue="123 ÄÆ°á»ng Nguyá»…n VÄƒn Linh, Quáº­n 7, TP.HCM" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-600" />
 </div>
 </div>
 </div>

 <div className="bg-slate-50 rounded-xl border border-slate-300 p-5 space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-slate-500" /> Há»“ sÆ¡ nÄƒng lá»±c (Upload)
 </h3>
 <label className="cursor-pointer text-xs font-bold text-orange-700 hover:text-orange-800 bg-white border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all">
 Táº£i lÃªn
 <input type="file" className="hidden" multiple />
 </label>
 </div>
 <div className="space-y-3">
 <div className="flex items-center gap-3 bg-white p-3 border border-slate-300 rounded-lg">
 <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
 <CheckCircle2 className="w-4 h-4" />
 </div>
 <div className="flex-1">
 <p className="text-sm font-bold text-slate-900">Giáº¥y phÃ©p ÄKKD.pdf</p>
 <p className="text-[10px] text-slate-600">ÄÃ£ xÃ¡c thá»±c OCR thÃ nh cÃ´ng</p>
 </div>
 <button className="text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
 </div>
 <div className="flex items-center gap-3 bg-white p-3 border border-slate-300 rounded-lg">
 <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
 <CheckCircle2 className="w-4 h-4" />
 </div>
 <div className="flex-1">
 <p className="text-sm font-bold text-slate-900">CMND_MatTruoc.jpg</p>
 <p className="text-[10px] text-slate-600">Khá»›p thÃ´ng tin ngÆ°á»i Ä‘áº¡i diá»‡n</p>
 </div>
 <button className="text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>
 </div>
 </div>

 {/* Right Column: Configuration & Actions */}
 <div className="md:col-span-7 space-y-6">
 <div className="p-6 border border-slate-300 rounded-xl bg-white shadow-sm">
 <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
 <Settings2 className="w-5 h-5 text-primary-600" /> Cáº¥u hÃ¬nh Khá»Ÿi táº¡o
 </h3>

 {approvalType === 'seller' ? (
 <div className="space-y-4 animate-in fade-in duration-300">
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Má»©c phÃ­ SÃ n máº·c Ä‘á»‹nh (%)</label>
 <input type="number" defaultValue={5} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-600" />
 </div>
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Háº¡n má»©c hiá»ƒn thá»‹ Sáº£n pháº©m (PIM Limit)</label>
 <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-600">
 <option>1,000 Sáº£n pháº©m (CÆ¡ báº£n)</option>
 <option>5,000 Sáº£n pháº©m (Pro)</option>
 <option>KhÃ´ng giá»›i háº¡n (Enterprise)</option>
 </select>
 </div>
 <div className="pt-2">
 <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
 <input type="checkbox" defaultChecked className="rounded text-orange-700 border-slate-400 focus:ring-orange-600" />
 <span className="text-sm font-medium text-slate-800">Tá»± Ä‘á»™ng duyá»‡t SP Ä‘áº©y lÃªn há»‡ thá»‘ng</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer mt-2">
 <input type="checkbox" className="rounded text-orange-700 border-slate-400 focus:ring-orange-600" />
 <span className="text-sm font-medium text-slate-800">Má»Ÿ quyá»n tham gia Mega Flash Sale</span>
 </label>
 </div>
 </div>
 ) : approvalType === 'dealer' ? (
 <div className="space-y-4 animate-in fade-in duration-300">
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Thiáº¿t láº­p PhÃ­ pháº§n má»m iPOS</label>
 <select 
 value={iposFeeStatus}
 onChange={(e) => setIposFeeStatus(e.target.value)}
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
 >
 <option value="paid">CÃ³ tÃ­nh phÃ­ (Thu phÃ­ duy trÃ¬)</option>
 <option value="free">Miá»…n phÃ­ (Sá»­ dá»¥ng vÄ©nh viá»…n)</option>
 </select>
 </div>

 {iposFeeStatus === 'paid' && (
 <div className="space-y-4 animate-in slide-in- duration-300">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">HÃ¬nh thá»©c thanh toÃ¡n</label>
 <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
 <option>Tráº£ trÆ°á»›c 6 thÃ¡ng (Æ¯u Ä‘Ã£i)</option>
 <option>Tráº£ trÆ°á»›c 1 nÄƒm (Æ¯u Ä‘Ã£i + Táº·ng 1 thÃ¡ng)</option>
 <option>Tráº£ phÃ­ hÃ ng thÃ¡ng</option>
 </select>
 </div>
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Sá»‘ phÃ­ má»—i thÃ¡ng (VND)</label>
 <input type="text" defaultValue="500,000" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
 </div>
 </div>
 <div className="p-3 bg-primary-50/50 border border-primary-100 rounded-lg">
 <label className="text-[11px] font-bold text-primary-900 uppercase block mb-2 flex items-center gap-2">
 <History className="w-3.5 h-3.5" /> Thá»i háº¡n sá»­ dá»¥ng iPOS (NgÃ y háº¿t háº¡n)
 </label>
 <div className="flex gap-2">
 <input 
 type="date" 
 className="flex-1 border border-primary-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
 defaultValue="2027-04-24"
 />
 <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-red-200">
 <AlertCircle className="w-3.5 h-3.5" /> Cháº·n truy cáº­p sau ngÃ y nÃ y
 </div>
 </div>
 </div>
 </div>
 )}

 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">PhÃ­ thu bÃ¡n hÃ ng iPOS dá»±a trÃªn ÄÆ¡n hÃ ng (%)</label>
 <input type="number" defaultValue={2} step="0.1" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
 </div>
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Subdomain Khá»Ÿi táº¡o truy cáº­p ERP</label>
 <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden">
 <input type="text" className="flex-1 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" defaultValue={approvingSeller?.name.toLowerCase().replace(/\s/g, '') || ''} />
 <span className="bg-slate-100 text-slate-600 px-3 py-2 text-sm border-l border-slate-300">.v-erp.com</span>
 </div>
 </div>
 <div className="pt-2 grid grid-cols-2 gap-2">
 <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
 <input type="checkbox" defaultChecked className="rounded text-emerald-600 border-slate-400 focus:ring-emerald-500" />
 <span className="text-[11px] font-medium text-slate-800">iPOS BÃ¡n hÃ ng</span>
 </label>
 <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
 <input type="checkbox" defaultChecked className="rounded text-emerald-600 border-slate-400 focus:ring-emerald-500" />
 <span className="text-[11px] font-medium text-slate-800">E-Menu (QR Code)</span>
 </label>
 <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
 <input type="checkbox" defaultChecked className="rounded text-emerald-600 border-slate-400 focus:ring-emerald-500" />
 <span className="text-[11px] font-medium text-slate-800">Quáº£n lÃ½ Kho (SCM)</span>
 </label>
 <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
 <input type="checkbox" className="rounded text-emerald-600 border-slate-400 focus:ring-emerald-500" />
 <span className="text-[11px] font-medium text-slate-800">KDS (MÃ n hÃ¬nh báº¿p)</span>
 </label>
 </div>
 </div>
 ) : (
 <div className="space-y-4 animate-in fade-in duration-300">
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Má»©c phÃ­ SÃ n máº·c Ä‘á»‹nh (M2C) (%)</label>
 <input type="number" defaultValue={2.5} step="0.1" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
 </div>
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">PhÃ¢n bá»• chiáº¿t kháº¥u NhÃ  MÃ¡y - SÃ n (%)</label>
 <input type="text" defaultValue="80 / 20" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
 </div>
 <div>
 <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Háº¡n má»©c LÆ°u kho tÄ©nh (mÂ³)</label>
 <input type="number" defaultValue={1000} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
 </div>
 <div className="pt-2">
 <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
 <input type="checkbox" defaultChecked className="rounded text-purple-600 border-slate-400 focus:ring-purple-500" />
 <span className="text-sm font-medium text-slate-800">XÃ¡c thá»±c chá»©ng nháº­n Nguá»“n gá»‘c (C/O) tá»± Ä‘á»™ng</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer mt-2">
 <input type="checkbox" defaultChecked className="rounded text-purple-600 border-slate-400 focus:ring-purple-500" />
 <span className="text-sm font-medium text-slate-800">Cá»•ng thanh toÃ¡n B2B & CÃ´ng ná»£ 30 ngÃ y</span>
 </label>
 </div>
 </div>
 )}
 </div>

 <div className="flex gap-4">
 <button 
 onClick={() => setApprovingSeller(null)}
 className="flex-1 py-3 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold text-sm transition-all"
 >
 Tá»« chá»‘i Há»“ sÆ¡
 </button>
 <button 
 onClick={() => setApprovingSeller(null)}
 className={cn("flex-1 py-3 text-[#FAF9F5] rounded-xl font-bold text-sm shadow-sm transition-all shadow-sm hover:-translate-y-0.5", approvalType === 'seller' ? "bg-slate-900 shadow-slate-900/5 hover:bg-slate-800" : approvalType === 'dealer' ? "bg-emerald-600 shadow-emerald-500/30 hover:bg-emerald-700" : "bg-purple-600 shadow-purple-500/30 hover:bg-purple-700")}
 >
 PhÃª duyá»‡t & KÃ­ch hoáº¡t
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {selectedSeller && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <div>
 <h2 className="text-xl font-bold text-slate-900 border-l-4 border-slate-900 pl-3">ThÃ´ng tin chi tiáº¿t Äá»‘i tÃ¡c</h2>
 <p className="text-xs text-slate-600 mt-1 ml-4 font-mono">ID: {selectedSeller.id}</p>
 </div>
 <button onClick={() => setSelectedSeller(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>
 <div className="p-6 space-y-6">
 <div>
 <div className="flex items-center justify-between mb-2">
 <h3 className="font-bold text-slate-900 text-lg">{selectedSeller.name}</h3>
 <span className={cn(
 "px-3 py-1 text-xs font-bold rounded-lg border",
 selectedSeller.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
 selectedSeller.status === 'suspended' ? "bg-red-50 text-red-600 border-red-100" :
 selectedSeller.status === 'warning' ? "bg-amber-50 text-amber-600 border-amber-100" :
 "bg-slate-50 text-slate-700 border-slate-300"
 )}>
 Tráº¡ng thÃ¡i: {selectedSeller.status.toUpperCase()}
 </span>
 </div>
 </div>
 
 <DraggableGrid className="grid grid-cols-2 gap-4" columns={2} gap={16}>
 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
 <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">MÃ£ sá»‘ thuáº¿</p>
 <p className="text-slate-900 font-mono text-sm">{selectedSeller.taxCode || '---'}</p>
 </div>
 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
 <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">CCCD ngÆ°á»i Ä‘áº¡i diá»‡n</p>
 <p className="text-slate-900 font-mono text-sm">{selectedSeller.identityCard || '---'}</p>
 </div>
 </DraggableGrid>

 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
 <div>
 <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-2"><UserCheck className="w-3.5 h-3.5"/> NgÆ°á»i Ä‘áº¡i diá»‡n</p>
 <p className="text-slate-900 text-sm font-semibold">{selectedSeller.representative || 'ChÆ°a cáº­p nháº­t'}</p>
 </div>
 <div className="pt-2 border-t border-slate-300">
 <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-2"><MapPin className="w-3.5 h-3.5"/> Äá»‹a chá»‰ / Trá»¥ sá»Ÿ</p>
 <p className="text-slate-900 text-sm">{selectedSeller.address || 'ChÆ°a cáº­p nháº­t'}</p>
 </div>
 </div>
 </div>
 <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
 <button onClick={() => setSelectedSeller(null)} className="px-5 py-2.5 bg-slate-800 text-[#FAF9F5] rounded-lg text-sm font-bold shadow-sm hover:bg-slate-900 transition-all">ÄÃ³ng</button>
 </div>
 </div>
 </div>
 )}

 {adjustingSeller && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <div>
 <h2 className="text-lg font-bold text-slate-900">Äiá»u chá»‰nh vÃ­ Ä‘iá»‡n tá»­</h2>
 <p className="text-xs text-slate-600">Äá»‘i tÃ¡c: {adjustingSeller.name}</p>
 </div>
 <button onClick={() => setAdjustingSeller(null)} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
 </div>
 <form onSubmit={submitAdjustBalance} className="p-6 space-y-6">
 <div>
 <div className="flex justify-between items-center mb-1.5">
 <label className="text-xs font-bold text-slate-800 uppercase">Sá»‘ dÆ° hiá»‡n táº¡i</label>
 </div>
 <div className="text-xl font-bold text-slate-900">{formatCurrency(adjustingSeller.walletBalance || 0)}</div>
 </div>
 <div>
 <div className="flex justify-between items-center mb-1.5">
 <label className="text-xs font-bold text-slate-800 uppercase">Sá»‘ tiá»n cá»™ng / trá»«</label>
 </div>
 <input 
 type="number" 
 required
 value={adjustAmount}
 onChange={(e) => setAdjustAmount(e.target.value)}
 placeholder="VD: 500000 (cá»™ng) hoáº·c -500000 (trá»«)"
 className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono" 
 />
 <p className="text-[11px] text-slate-600 mt-2">DÃ¹ng sá»‘ Ã¢m Ä‘á»ƒ trá»« tiá»n. Viáº¿t liá»n khÃ´ng dáº¥u pháº©y.</p>
 </div>
 <div className="flex gap-4 pt-4 border-t border-slate-200">
 <button 
 type="button"
 onClick={() => setAdjustingSeller(null)}
 className="flex-1 py-2.5 bg-slate-100 text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
 >
 Há»§y
 </button>
 <button 
 type="submit"
 className="flex-1 py-2.5 bg-emerald-600 text-[#FAF9F5] rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-emerald-700 hover:shadow-sm"
 >
 XÃ¡c nháº­n
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 </>
 )}
 </div>
 );
}

