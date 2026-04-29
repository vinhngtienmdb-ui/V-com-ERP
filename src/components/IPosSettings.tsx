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
 { id: 'admin', name: 'Admin', description: 'Toàn quyền truy cập và quản trị hệ thống' },
 { id: 'manager', name: 'Quản lý cửa hàng', description: 'Quản lý nhân viên, doanh thu, kho báo cáo' },
 { id: 'cashier', name: 'Nhân viên bán hàng', description: 'Tạo đơn, nhận thanh toán, xem lịch sử' },
 { id: 'accountant', name: 'Kế toán', description: 'Xem báo cáo doanh thu, công nợ, đối soát' },
];

const IPOS_MODULES = [
 { 
 id: 'sales', 
 name: 'Bán hàng (POS)', 
 features: [
 { id: 'create_order', name: 'Tạo đơn hàng mới' },
 { id: 'apply_discount', name: 'Áp dụng giảm giá/Voucher' },
 { id: 'void_item', name: 'Hủy món trong đơn' },
 { id: 'void_order', name: 'Hủy toàn bộ đơn' },
 { id: 'change_price', name: 'Sửa giá bán trực tiếp' },
 ]
 },
 { 
 id: 'orders', 
 name: 'Quản lý Đơn hàng', 
 features: [
 { id: 'view_history', name: 'Xem lịch sử đơn hàng' },
 { id: 'refund_order', name: 'Hoàn trả/Đổi trả hàng' },
 { id: 'manage_delivery', name: 'Quản lý đơn giao hàng/Grab/ShopeeFood' },
 ]
 },
 {
 id: 'inventory',
 name: 'Kho & Sản phẩm',
 features: [
 { id: 'view_inventory', name: 'Xem tồn kho' },
 { id: 'edit_product', name: 'Thêm/Sửa/Xóa sản phẩm' },
 { id: 'stock_take', name: 'Kiểm kho' },
 { id: 'import_export', name: 'Nhập/Xuất kho' },
 ]
 },
 {
 id: 'report',
 name: 'Báo cáo & Tài chính',
 features: [
 { id: 'view_revenue', name: 'Xem báo cáo doanh thu' },
 { id: 'view_profit', name: 'Xem lợi nhuận' },
 { id: 'end_shift', name: 'Chốt ca/Bàn giao tiền' },
 { id: 'export_report', name: 'Xuất file báo cáo (Excel/PDF)' }
 ]
 },
 {
 id: 'setup',
 name: 'Thiết lập hệ thống',
 features: [
 { id: 'manage_staff', name: 'Quản lý nhân viên & Phân quyền' },
 { id: 'manage_store', name: 'Thông tin cửa hàng & Cấu hình' },
 { id: 'manage_payment', name: 'Cấu hình phương thức thanh toán' }
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
 alert('Đã lưu cấu hình phân quyền iPOS thành công!');
 };

 return (
 <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in slide-in- duration-500">
 <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
 <MonitorSmartphone className="w-6 h-6" />
 </div>
 <div>
 <h1 className="font-serif tracking-tight text-xl font-bold text-stone-900">Cài đặt iPOS & Phân quyền</h1>
 <p className="text-sm text-stone-500 mt-1">Thiết lập vai trò nâng cao và giới hạn quyền truy cập từng module iPOS.</p>
 </div>
 </div>
 <div className="flex gap-3">
 <button onClick={() => navigate('/ipos')} className="px-4 py-2 border border-stone-200 text-stone-700 bg-white rounded-lg text-sm font-semibold hover:bg-stone-50 shadow-sm">
 Quay lại iPOS
 </button>
 <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-[#FAF9F5] rounded-lg text-sm font-semibold hover:bg-primary-700 shadow-sm flex items-center gap-2">
 <Save className="w-4 h-4" />
 Lưu thay đổi
 </button>
 </div>
 </div>

 <div className="flex flex-col lg:flex-row gap-6">
 {/* Roles Sidebar */}
 <div className="w-full lg:w-72 shrink-0 space-y-4">
 <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
 <div className="flex items-center justify-between mb-4">
 <h3 className="font-bold text-stone-800 flex items-center gap-2">
 <Users className="w-4 h-4 text-primary-600" />
 Vai trò (Roles)
 </h3>
 <button className="p-1 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded">
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
 : "bg-white border-transparent hover:border-stone-200 hover:bg-stone-50"
 )}
 >
 <p className={cn(
 "font-bold text-sm",
 activeRole === role.id ? "text-primary-700" : "text-stone-700"
 )}>{role.name}</p>
 <p className={cn(
 "text-[11px] mt-1 line-clamp-2",
 activeRole === role.id ? "text-primary-500/80" : "text-stone-500"
 )}>{role.description}</p>
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Permissions Content */}
 <div className="flex-1 bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
 <div className="p-6 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
 <div>
 <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
 <Shield className="w-5 h-5 text-emerald-600" />
 Quyền hạn: {currentRole?.name}
 </h2>
 <p className="text-sm text-stone-500 mt-1">Gạt công tắc để cấp hoặc thu hồi quyền truy cập tính năng.</p>
 </div>
 {activeRole === 'admin' && (
 <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100">
 <Lock className="w-3.5 h-3.5" />
 Vai trò Admin không thể giới hạn một số quyền cốt lõi
 </span>
 )}
 </div>

 <div className="p-0">
 {IPOS_MODULES.map((module, mIdx) => (
 <div key={module.id} className={cn(
 "p-6",
 mIdx !== IPOS_MODULES.length - 1 ? "border-b border-stone-100" : ""
 )}>
 <h3 className="text-sm font-black text-stone-800 uppercase tracking-wider mb-4 flex items-center gap-2">
 <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>
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
 isGranted ? "bg-stone-50 border-emerald-200" : "bg-white border-stone-200 hover:border-stone-300",
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
 isGranted ? "bg-emerald-500 text-[#FAF9F5]" : "bg-stone-200 text-transparent"
 )}>
 <Check className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="flex-1">
 <p className={cn(
 "text-sm font-semibold",
 isGranted ? "text-stone-900" : "text-stone-600"
 )}>{feature.name}</p>
 <p className="text-[10px] text-stone-400 mt-0.5">Mã quyền: {permKey}</p>
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
