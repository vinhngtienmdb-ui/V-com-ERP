import React, { useState } from 'react';
import { 
 Shield, 
 Settings, 
 Check, 
 Key, 
 Users, 
 Save, 
 Plus, 
 Edit2, 
 Trash2,
 MonitorSmartphone,
 Lock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const DEFAULT_ROLES = [
 { id: 'admin', name: 'Admin', description: 'ToÃ n quyá»n truy cáº­p vÃ  quáº£n trá»‹ há»‡ thá»‘ng' },
 { id: 'manager', name: 'Quáº£n lÃ½ cá»­a hÃ ng', description: 'Quáº£n lÃ½ nhÃ¢n viÃªn, doanh thu, kho bÃ¡o cÃ¡o' },
 { id: 'cashier', name: 'NhÃ¢n viÃªn bÃ¡n hÃ ng', description: 'Táº¡o Ä‘Æ¡n, nháº­n thanh toÃ¡n, xem lá»‹ch sá»­' },
 { id: 'accountant', name: 'Káº¿ toÃ¡n', description: 'Xem bÃ¡o cÃ¡o doanh thu, cÃ´ng ná»£, Ä‘á»‘i soÃ¡t' },
];

const IPOS_MODULES = [
 { 
 id: 'sales', 
 name: 'BÃ¡n hÃ ng (POS)', 
 features: [
 { id: 'create_order', name: 'Táº¡o Ä‘Æ¡n hÃ ng má»›i' },
 { id: 'apply_discount', name: 'Ãp dá»¥ng giáº£m giÃ¡/Voucher' },
 { id: 'void_item', name: 'Há»§y mÃ³n trong Ä‘Æ¡n' },
 { id: 'void_order', name: 'Há»§y toÃ n bá»™ Ä‘Æ¡n' },
 { id: 'change_price', name: 'Sá»­a giÃ¡ bÃ¡n trá»±c tiáº¿p' },
 ]
 },
 { 
 id: 'orders', 
 name: 'Quáº£n lÃ½ ÄÆ¡n hÃ ng', 
 features: [
 { id: 'view_history', name: 'Xem lá»‹ch sá»­ Ä‘Æ¡n hÃ ng' },
 { id: 'refund_order', name: 'HoÃ n tráº£/Äá»•i tráº£ hÃ ng' },
 { id: 'manage_delivery', name: 'Quáº£n lÃ½ Ä‘Æ¡n giao hÃ ng/Grab/ShopeeFood' },
 ]
 },
 {
 id: 'inventory',
 name: 'Kho & Sáº£n pháº©m',
 features: [
 { id: 'view_inventory', name: 'Xem tá»“n kho' },
 { id: 'edit_product', name: 'ThÃªm/Sá»­a/XÃ³a sáº£n pháº©m' },
 { id: 'stock_take', name: 'Kiá»ƒm kho' },
 { id: 'import_export', name: 'Nháº­p/Xuáº¥t kho' },
 ]
 },
 {
 id: 'report',
 name: 'BÃ¡o cÃ¡o & TÃ i chÃ­nh',
 features: [
 { id: 'view_revenue', name: 'Xem bÃ¡o cÃ¡o doanh thu' },
 { id: 'view_profit', name: 'Xem lá»£i nhuáº­n' },
 { id: 'end_shift', name: 'Chá»‘t ca/BÃ n giao tiá»n' },
 { id: 'export_report', name: 'Xuáº¥t file bÃ¡o cÃ¡o (Excel/PDF)' }
 ]
 },
 {
 id: 'setup',
 name: 'Thiáº¿t láº­p há»‡ thá»‘ng',
 features: [
 { id: 'manage_staff', name: 'Quáº£n lÃ½ nhÃ¢n viÃªn & PhÃ¢n quyá»n' },
 { id: 'manage_store', name: 'ThÃ´ng tin cá»­a hÃ ng & Cáº¥u hÃ¬nh' },
 { id: 'manage_payment', name: 'Cáº¥u hÃ¬nh phÆ°Æ¡ng thá»©c thanh toÃ¡n' }
 ]
 }
];

export function IPosSettings() {
 const navigate = useNavigate();
 const [activeRole, setActiveRole] = useState(DEFAULT_ROLES[0].id);
 const [roles, setRoles] = useState(DEFAULT_ROLES);
 
 // Initialize default permissions
 const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({
 admin: {
 sales_create_order: true, sales_apply_discount: true, sales_void_item: true, sales_void_order: true, sales_change_price: true,
 orders_view_history: true, orders_refund_order: true, orders_manage_delivery: true,
 inventory_view_inventory: true, inventory_edit_product: true, inventory_stock_take: true, inventory_import_export: true,
 report_view_revenue: true, report_view_profit: true, report_end_shift: true, report_export_report: true,
 setup_manage_staff: true, setup_manage_store: true, setup_manage_payment: true
 },
 manager: {
 sales_create_order: true, sales_apply_discount: true, sales_void_item: true, sales_void_order: true, sales_change_price: false,
 orders_view_history: true, orders_refund_order: true, orders_manage_delivery: true,
 inventory_view_inventory: true, inventory_edit_product: true, inventory_stock_take: true, inventory_import_export: true,
 report_view_revenue: true, report_view_profit: false, report_end_shift: true, report_export_report: true,
 setup_manage_staff: false, setup_manage_store: false, setup_manage_payment: false
 },
 cashier: {
 sales_create_order: true, sales_apply_discount: false, sales_void_item: false, sales_void_order: false, sales_change_price: false,
 orders_view_history: true, orders_refund_order: false, orders_manage_delivery: true,
 inventory_view_inventory: true, inventory_edit_product: false, inventory_stock_take: false, inventory_import_export: false,
 report_view_revenue: false, report_view_profit: false, report_end_shift: true, report_export_report: false,
 setup_manage_staff: false, setup_manage_store: false, setup_manage_payment: false
 },
 accountant: {
 sales_create_order: false, sales_apply_discount: false, sales_void_item: false, sales_void_order: false, sales_change_price: false,
 orders_view_history: true, orders_refund_order: true, orders_manage_delivery: false,
 inventory_view_inventory: true, inventory_edit_product: false, inventory_stock_take: true, inventory_import_export: true,
 report_view_revenue: true, report_view_profit: true, report_end_shift: false, report_export_report: true,
 setup_manage_staff: false, setup_manage_store: false, setup_manage_payment: false
 }
 });

 const handleTogglePermission = (roleId: string, moduleId: string, featureId: string) => {
 const permKey = `${moduleId}_${featureId}`;
 setPermissions(prev => ({
 ...prev,
 [roleId]: {
 ...prev[roleId],
 [permKey]: !prev[roleId]?.[permKey]
 }
 }));
 };

 const currentRole = roles.find(r => r.id === activeRole);

 const handleSave = () => {
 alert('ÄÃ£ lÆ°u cáº¥u hÃ¬nh phÃ¢n quyá»n iPOS thÃ nh cÃ´ng!');
 };

 return (
 <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in slide-in- duration-500">
 <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
 <MonitorSmartphone className="w-6 h-6" />
 </div>
 <div>
 <h1 className="font-serif tracking-tight text-xl font-bold text-slate-900">CÃ i Ä‘áº·t iPOS & PhÃ¢n quyá»n</h1>
 <p className="text-sm text-slate-600 mt-1">Thiáº¿t láº­p vai trÃ² nÃ¢ng cao vÃ  giá»›i háº¡n quyá»n truy cáº­p tá»«ng module iPOS.</p>
 </div>
 </div>
 <div className="flex gap-3">
 <button onClick={() => navigate('/ipos')} className="px-4 py-2 border border-slate-300 text-slate-800 bg-white rounded-lg text-sm font-semibold hover:bg-slate-50 shadow-sm">
 Quay láº¡i iPOS
 </button>
 <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-[#FAF9F5] rounded-lg text-sm font-semibold hover:bg-primary-700 shadow-sm flex items-center gap-2">
 <Save className="w-4 h-4" />
 LÆ°u thay Ä‘á»•i
 </button>
 </div>
 </div>

 <div className="flex flex-col lg:flex-row gap-6">
 {/* Roles Sidebar */}
 <div className="w-full lg:w-72 shrink-0 space-y-4">
 <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm">
 <div className="flex items-center justify-between mb-4">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <Users className="w-4 h-4 text-primary-600" />
 Vai trÃ² (Roles)
 </h3>
 <button className="p-1 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded">
 <Plus className="w-4 h-4" />
 </button>
 </div>
 
 <div className="space-y-2">
 {roles.map(role => (
 <button
 key={role.id}
 onClick={() => setActiveRole(role.id)}
 className={cn(
 "w-full text-left px-3 py-3 rounded-lg border transition-all",
 activeRole === role.id 
 ? "bg-primary-50 border-primary-200 shadow-sm" 
 : "bg-white border-transparent hover:border-slate-300 hover:bg-slate-50"
 )}
 >
 <p className={cn(
 "font-bold text-sm",
 activeRole === role.id ? "text-primary-700" : "text-slate-800"
 )}>{role.name}</p>
 <p className={cn(
 "text-[11px] mt-1 line-clamp-2",
 activeRole === role.id ? "text-primary-500/80" : "text-slate-600"
 )}>{role.description}</p>
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Permissions Content */}
 <div className="flex-1 bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
 <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
 <div>
 <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
 <Shield className="w-5 h-5 text-emerald-600" />
 Quyá»n háº¡n: {currentRole?.name}
 </h2>
 <p className="text-sm text-slate-600 mt-1">Gáº¡t cÃ´ng táº¯c Ä‘á»ƒ cáº¥p hoáº·c thu há»“i quyá»n truy cáº­p tÃ­nh nÄƒng.</p>
 </div>
 {activeRole === 'admin' && (
 <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100">
 <Lock className="w-3.5 h-3.5" />
 Vai trÃ² Admin khÃ´ng thá»ƒ giá»›i háº¡n má»™t sá»‘ quyá»n cá»‘t lÃµi
 </span>
 )}
 </div>

 <div className="p-0">
 {IPOS_MODULES.map((module, mIdx) => (
 <div key={module.id} className={cn(
 "p-6",
 mIdx !== IPOS_MODULES.length - 1 ? "border-b border-slate-200" : ""
 )}>
 <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
 <span className="w-1.5 h-4 bg-primary-500 rounded-full inline-block"></span>
 {module.name}
 </h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {module.features.map(feature => {
 const permKey = `${module.id}_${feature.id}`;
 const isGranted = permissions[activeRole]?.[permKey] || false;
 const isDisabled = activeRole === 'admin'; // Admin gets all by default, can't toggle
 
 return (
 <label 
 key={feature.id} 
 className={cn(
 "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
 isGranted ? "bg-slate-50 border-emerald-200" : "bg-white border-slate-300 hover:border-slate-400",
 isDisabled && "opacity-75 cursor-not-allowed"
 )}
 >
 <div className="relative flex items-center justify-center mt-0.5">
 <input 
 type="checkbox" 
 className="sr-only"
 checked={isGranted}
 disabled={isDisabled}
 onChange={() => handleTogglePermission(activeRole, module.id, feature.id)}
 />
 <div className={cn(
 "w-5 h-5 rounded flex items-center justify-center transition-colors shadow-sm",
 isGranted ? "bg-emerald-500 text-[#FAF9F5]" : "bg-slate-200 text-transparent"
 )}>
 <Check className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="flex-1">
 <p className={cn(
 "text-sm font-semibold",
 isGranted ? "text-slate-900" : "text-slate-700"
 )}>{feature.name}</p>
 <p className="text-[10px] text-slate-500 mt-0.5">MÃ£ quyá»n: {permKey}</p>
 </div>
 </label>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}

