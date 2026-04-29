import React, { useState } from 'react';
import { 
 FileText, 
 Send, 
 Inbox, 
 BookOpen, 
 FileSignature, 
 Settings, 
 Search, 
 Plus,
 Sparkles,
 RefreshCw,
 Hash,
 Tag,
 Edit2,
 Trash2,
 CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const MOCK_DOCS = [
 { id: 'CV-2024-001', title: 'Quyết định bổ nhiệm Giám đốc', type: 'outbound', status: 'signed', date: '20/03/2024', signer: 'CEO', category: 'Quyết định' },
 { id: 'CV-2024-002', title: 'Công văn từ Bộ TT&TT', type: 'inbound', status: 'processing', date: '21/03/2024', signer: 'Bộ TT&TT', category: 'Công văn' },
 { id: 'QĐ-2024-05A', title: 'Quyết định ban hành nội quy công ty', type: 'internal', status: 'signed', date: '22/03/2024', signer: 'CEO', category: 'Quy định' }
];

const MOCK_CATEGORIES = [
 { id: 'cat-1', name: 'Quyết định', code: 'QĐ', type: 'Nội bộ/Đi', status: 'active', desc: 'Văn bản bắt buộc thi hành' },
 { id: 'cat-2', name: 'Quy định', code: 'QuyĐ', type: 'Nội bộ', status: 'active', desc: 'Văn bản quy định nội bộ cơ quan' },
 { id: 'cat-3', name: 'Thông báo', code: 'TB', type: 'Nội bộ/Đi', status: 'active', desc: 'Văn bản truyền đạt thông tin' },
 { id: 'cat-4', name: 'Biên bản', code: 'BB', type: 'Nội bộ', status: 'active', desc: 'Văn bản ghi nhận sự việc' },
 { id: 'cat-5', name: 'Nghị định', code: 'NĐ', type: 'Đến', status: 'active', desc: 'Văn bản cấp Chính phủ' },
 { id: 'cat-6', name: 'Thông tư', code: 'TT', type: 'Đến', status: 'active', desc: 'Văn bản cấp Bộ' },
 { id: 'cat-7', name: 'Luật', code: 'L', type: 'Đến', status: 'active', desc: 'Văn bản quy phạm pháp luật' },
 { id: 'cat-8', name: 'Công văn', code: 'CV', type: 'Đến/Đi', status: 'active', desc: 'Văn bản hành chính thông thường' }
];

export function DocumentManager() {
 const [activeTab, setActiveTab] = useState('inbound');
 const [isCreatingBook, setIsCreatingBook] = useState(false);
 const navigate = useNavigate();

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Quản trị Công văn & e-Office</h1>
 <p className="text-sm text-[#6B7280] mt-1">Hệ thống quản lý văn bản đi/đến, áp dụng Nghị định 30/CP, ký số và tự động hóa AI.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 transition-all flex items-center gap-2 text-orange-700 border-orange-200">
 <Sparkles className="w-4 h-4" />
 Soạn thảo bằng AI
 </button>
 <button className="bg-[#111827] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-stone-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" />
 Tạo văn bản mới (NĐ 30)
 </button>
 </div>
 </div>

 <div className="flex gap-6">
 {/* Sidebar */}
 <div className="w-[240px] shrink-0 space-y-1">
 {[
 { id: 'inbound', label: 'Văn bản đến', icon: Inbox },
 { id: 'outbound', label: 'Văn bản đi', icon: Send },
 { id: 'internal', label: 'Văn bản nội bộ', icon: FileText },
 { id: 'books', label: 'Sổ văn bản', icon: BookOpen },
 { id: 'categories', label: 'Hình thức văn bản', icon: Tag },
 { id: 'config', label: 'Cấu hình & Đánh số', icon: Settings },
 { id: 'signature', label: 'Trình ký số', icon: FileSignature },
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => tab.id === 'signature' ? navigate('/signature') : setActiveTab(tab.id)}
 className={cn(
 "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-left",
 activeTab === tab.id 
 ? "bg-[#F2F0E9] text-orange-800 font-bold" 
 : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium"
 )}
 >
 <tab.icon className="w-4 h-4" />
 {tab.label}
 </button>
 ))}
 </div>

 {/* Content */}
 <div className="flex-1 bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
 {['inbound', 'outbound', 'internal', 'signature'].includes(activeTab) && (
 <>
 <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
 <div className="relative w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
 <input 
 type="text" 
 placeholder="Tìm kiếm công văn..."
 className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-orange-600"
 />
 </div>
 <div className="flex gap-2">
 <button className="p-2 text-stone-400 hover:text-stone-600 bg-white border border-stone-200 rounded-lg shadow-sm">
 <RefreshCw className="w-4 h-4" />
 </button>
 <button className="bg-stone-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-stone-800 shadow-sm">
 <Plus className="w-4 h-4" />
 Tạo văn bản
 </button>
 </div>
 </div>

 <div className="p-0 overflow-auto">
 <table className="w-full text-left border-collapse">
 <thead className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <tr>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Số KH/Ký hiệu</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Trích yếu</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Hình thức</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Ngày ban hành</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {MOCK_DOCS.filter(doc => doc.type === activeTab).map(doc => (
 <tr key={doc.id} className="hover:bg-stone-50 transition-colors">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-[#111827]">{doc.id}</p>
 <p className="text-[10px] text-stone-500 font-bold uppercase">{doc.signer}</p>
 </td>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-stone-800">{doc.title}</p>
 </td>
 <td className="px-6 py-4">
 <span className={cn(
 "px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-tight",
 doc.type === 'inbound' ? "bg-amber-50 text-amber-600" : 
 doc.type === 'outbound' ? "bg-[#F2F0E9] text-orange-700" : "bg-emerald-50 text-emerald-600"
 )}>
 {doc.category || 'Văn bản'}
 </span>
 </td>
 <td className="px-6 py-4">
 <p className="text-sm text-stone-600">{doc.date}</p>
 </td>
 </tr>
 ))}
 {MOCK_DOCS.filter(doc => doc.type === activeTab).length === 0 && (
 <tr>
 <td colSpan={4} className="px-6 py-12 text-center text-stone-500 text-sm">
 Không có văn bản nào trong mục này.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </>
 )}

 {activeTab === 'books' && (
 <div className="p-6">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="text-lg font-bold text-stone-800">Quản lý Sổ văn bản</h3>
 <p className="text-sm text-stone-500">Tạo và quản lý các sổ đăng ký văn bản đi/đến theo năm và loại hình.</p>
 </div>
 <button onClick={() => setIsCreatingBook(true)} className="bg-stone-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-stone-800">
 <Plus className="w-4 h-4" />
 Thêm sổ mới
 </button>
 </div>
 
 {isCreatingBook && (
 <div className="mb-6 p-5 border border-orange-200 bg-[#F2F0E9]/50 rounded-lg animate-in fade-in slide-in-">
 <h4 className="font-bold text-stone-800 mb-4">Tạo Sổ Văn bản mới</h4>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <div>
 <label className="block text-xs font-bold text-stone-700 mb-1">Tên Số văn bản</label>
 <input type="text" placeholder="VD: Sổ công văn đi 2025" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white" />
 </div>
 <div>
 <label className="block text-xs font-bold text-stone-700 mb-1">Loại sổ</label>
 <select defaultValue="inbound" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
 <option value="inbound">Công văn đến</option>
 <option value="outbound">Công văn đi</option>
 <option value="internal">Văn bản nội bộ</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-stone-700 mb-1">Năm quản lý</label>
 <input type="number" defaultValue="2024" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white" />
 </div>
 <div className="flex items-end gap-2">
 <button onClick={() => setIsCreatingBook(false)} className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-lg border border-transparent">Hủy</button>
 <button onClick={() => setIsCreatingBook(false)} className="px-4 py-2 text-sm font-bold text-[#FAF9F5] bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm w-full">Lưu & Tạo Sổ</button>
 </div>
 </div>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {[
 { id: 'book-1', name: 'Sổ công văn đến 2024', type: 'Đến', year: 2024, currentNumber: 345, status: 'Đang mở' },
 { id: 'book-2', name: 'Sổ công văn đi 2024', type: 'Đi', year: 2024, currentNumber: 112, status: 'Đang mở' },
 { id: 'book-3', name: 'Sổ quyết định 2024', type: 'Nội bộ', year: 2024, currentNumber: 45, status: 'Đang mở' },
 { id: 'book-4', name: 'Sổ công văn đến 2023', type: 'Đến', year: 2023, currentNumber: 1250, status: 'Đã khóa' },
 ].map(book => (
 <div key={book.id} className="border border-stone-200 rounded-lg p-4 hover:border-blue-400 transition-colors bg-white">
 <div className="flex justify-between items-start mb-2">
 <h4 className="font-bold text-stone-800">{book.name}</h4>
 <span className={cn(
 "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
 book.status === 'Đang mở' ? "bg-emerald-50 text-emerald-600" : "bg-stone-100 text-stone-600"
 )}>{book.status}</span>
 </div>
 <div className="text-sm text-stone-500 mb-3 space-y-1">
 <p>Loại: <span className="font-semibold text-stone-700">{book.type}</span> • Năm: <span className="font-semibold text-stone-700">{book.year}</span></p>
 <p>Số hiện tại: <span className="font-bold text-orange-700">{book.currentNumber}</span></p>
 </div>
 <div className="flex gap-2">
 <button className="text-xs font-semibold text-orange-700 hover:text-blue-800 border-r border-stone-200 pr-2">Cấu hình</button>
 <button className="text-xs font-semibold text-stone-600 hover:text-stone-800">Khóa sổ</button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === 'categories' && (
 <div className="p-6">
 <div className="mb-6 flex items-center justify-between">
 <div>
 <h3 className="text-lg font-bold text-stone-800">Danh mục Hình thức Văn bản</h3>
 <p className="text-sm text-stone-500">Quản lý các loại hình văn bản sử dụng trong cơ quan (Quyết định, Thông báo, Tờ trình...).</p>
 </div>
 <button className="bg-stone-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-stone-800">
 <Plus className="w-4 h-4" />
 Thêm hình thức
 </button>
 </div>
 
 <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
 <table className="w-full text-left">
 <thead className="bg-stone-50 border-b border-stone-200">
 <tr>
 <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase">Tên hình thức</th>
 <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase">Mã (Ký hiệu)</th>
 <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase">Phân loại</th>
 <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase">Mô tả</th>
 <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase text-right">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-stone-100">
 {MOCK_CATEGORIES.map(cat => (
 <tr key={cat.id} className="hover:bg-stone-50">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-stone-800">{cat.name}</p>
 {cat.status === 'active' ? (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1">
 <CheckCircle2 className="w-3 h-3" /> Đang dùng
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded mt-1">
 Tạm ẩn
 </span>
 )}
 </td>
 <td className="px-6 py-4">
 <span className="px-2 py-1 bg-stone-100 text-stone-700 rounded text-xs font-mono font-bold">{cat.code}</span>
 </td>
 <td className="px-6 py-4">
 <span className="text-xs font-semibold text-stone-600">{cat.type}</span>
 </td>
 <td className="px-6 py-4">
 <span className="text-xs text-stone-500">{cat.desc}</span>
 </td>
 <td className="px-6 py-4">
 <div className="flex justify-end gap-2">
 <button className="p-1 text-stone-400 hover:text-orange-700 rounded"><Edit2 className="w-4 h-4" /></button>
 <button className="p-1 text-stone-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {activeTab === 'config' && (
 <div className="p-6">
 <div className="mb-6">
 <h3 className="text-lg font-bold text-stone-800">Cấu hình Đánh số Văn bản</h3>
 <p className="text-sm text-stone-500">Thiết lập quy tắc sinh số công văn tự động theo quy định (Ví dụ: Số/Năm/Mã-PhòngBan).</p>
 </div>
 
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Văn bản đi */}
 <div className="bg-white border border-stone-200 rounded-lg p-5">
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-bold text-stone-700 mb-2">Quy tắc sinh số Công văn ĐI</label>
 <div className="flex items-center gap-2">
 <div className="flex-1">
 <input type="text" defaultValue="{Số thứ tự}/{Năm ban hành}/{Ký hiệu cơ quan}" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:ring-1 focus:ring-orange-600 font-mono" />
 </div>
 </div>
 <p className="text-xs text-stone-500 mt-1">Ví dụ kết quả: 112/2024/CV-VCOMM</p>
 </div>

 <div className="grid grid-cols-2 gap-4 pt-3 border-t border-stone-100">
 <div>
 <label className="block text-xs font-bold text-stone-700 mb-2">Độ dài số thứ tự</label>
 <select defaultValue="3" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
 <option value="1">Không cố định</option>
 <option value="3">3 chữ số (001)</option>
 <option value="4">4 chữ số (0001)</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-stone-700 mb-2">Reset số theo</label>
 <select defaultValue="year" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
 <option value="year">Theo năm</option>
 <option value="book">Theo sổ văn bản</option>
 </select>
 </div>
 </div>
 </div>
 </div>

 {/* Văn bản đến */}
 <div className="bg-white border border-stone-200 rounded-lg p-5">
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-bold text-stone-700 mb-2">Quy tắc sinh số ĐẾN (Số nội bộ)</label>
 <div className="flex items-center gap-2">
 <div className="flex-1">
 <input type="text" defaultValue="ĐẾN-{Số thứ tự}/{Năm ban hành}" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:ring-1 focus:ring-orange-600 font-mono" />
 </div>
 </div>
 <p className="text-xs text-stone-500 mt-1">Ví dụ kết quả: ĐẾN-345/2024</p>
 </div>

 <div className="grid grid-cols-2 gap-4 pt-3 border-t border-stone-100">
 <div>
 <label className="block text-xs font-bold text-stone-700 mb-2">Độ dài số thứ tự</label>
 <select defaultValue="4" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
 <option value="1">Không cố định</option>
 <option value="3">3 chữ số (001)</option>
 <option value="4">4 chữ số (0001)</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-stone-700 mb-2">Reset số theo</label>
 <select defaultValue="year" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
 <option value="year">Theo năm</option>
 <option value="book">Theo sổ văn bản</option>
 </select>
 </div>
 </div>
 </div>
 </div>
 
 {/* Quyết định/Nội bộ */}
 <div className="bg-white border border-stone-200 rounded-lg p-5">
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-bold text-stone-700 mb-2">Quy tắc Quyết định/Nội bộ</label>
 <div className="flex items-center gap-2">
 <div className="flex-1">
 <input type="text" defaultValue="{Số thứ tự}/QĐ-{Ký hiệu phòng ban}" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:ring-1 focus:ring-orange-600 font-mono" />
 </div>
 </div>
 <p className="text-xs text-stone-500 mt-1">Ví dụ kết quả: 45/QĐ-NS</p>
 </div>

 <div className="grid grid-cols-2 gap-4 pt-3 border-t border-stone-100">
 <div>
 <label className="block text-xs font-bold text-stone-700 mb-2">Độ dài số thứ tự</label>
 <select defaultValue="1" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
 <option value="1">Không cố định</option>
 <option value="3">3 chữ số (001)</option>
 <option value="4">4 chữ số (0001)</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-stone-700 mb-2">Reset số theo</label>
 <select defaultValue="year" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
 <option value="year">Theo năm</option>
 <option value="book">Theo sổ văn bản</option>
 </select>
 </div>
 </div>
 </div>
 </div>
 </div>
 
 <div className="mt-6 flex justify-end">
 <button className="bg-stone-900 hover:bg-stone-800 text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm">
 Lưu tất cả cấu hình
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
