import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useEffect, useRef } from 'react';
import { 
 Package, 
 CheckCircle2, 
 Clock, 
 AlertCircle, 
 Calculator,
 Info,
 ChevronDown,
 Filter,
 Search,
 DollarSign,
 MoreVertical,
 Sparkles,
 ShieldCheck,
 Target,
 Activity,
 ArrowRight,
 Zap,
 Trash2,
 Plus,
 ArrowUpCircle,
 Hash,
 X,
 UploadCloud,
 DownloadCloud,
 ScanBarcode,
 Camera,
 Maximize2,
 Eye,
 EyeOff
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Product } from '../types/erp';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db, serverTimestamp, handleFirestoreError } from '../lib/firebase';
import { productsRepo } from '../services/repositories';
import { 
 collection, 
 onSnapshot, 
 addDoc, 
 query, 
 orderBy, 
 limit,
 doc,
 updateDoc,
 deleteDoc,
 where
} from 'firebase/firestore';

export function PIM() {
 const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
 const [loading, setLoading] = useState(true);
 const [filterStatus, setFilterStatus] = useState<'all' | 'pending_approval' | 'in_stock' | 'hidden'>('all');
 
 useEffect(() => {
 // Migrate sang productsRepo.subscribe để có zod validation + error tập trung.
 // Filter các category F&B (chúng thuộc iPos, không phải PIM TMĐT).
 const unsub = productsRepo.subscribe([], (items) => {
   const data = items.filter((p: any) => !['Đồ ăn', 'Đồ uống', 'Thức ăn', 'Cà phê', 'Trà'].includes(p.category)) as any[];
   setProducts(data);
   setLoading(false);
 });
 return () => unsub();
 }, []);

 const seedDemoPimProducts = async () => {
 console.log("Seeding PIM products...");
 const demoItems = [
 {
 name: 'iPhone 15 Pro Max 256GB - VN/A',
 sku: 'APP-IP15PM-256',
 price: 34990000,
 costPrice: 31000000,
 margin: 11.4,
 stock: 45,
 category: 'Thết bị số',
 brand: 'Apple',
 sellerName: 'VComm Electronics',
 status: 'in_stock',
 image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80',
 weight: '221',
 dimensions: '159.9 x 76.7 x 8.25'
 },
 {
 name: 'MacBook Air M2 13.6" 8CPU 8GPU 8GB/256GB',
 sku: 'APP-MBA-M2-8-256',
 price: 26490000,
 costPrice: 23500000,
 margin: 11.2,
 stock: 20,
 category: 'Thiết bị số',
 brand: 'Apple',
 sellerName: 'VComm Electronics',
 status: 'in_stock',
 image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
 weight: '1240',
 dimensions: '304.1 x 215 x 11.3'
 },
 {
 name: 'Bàn phím cơ không dây Logitech MX Mechanical Mini',
 sku: 'LOG-MX-MECH-MINI',
 price: 3590000,
 costPrice: 2800000,
 margin: 22,
 stock: 120,
 category: 'Phụ kiện',
 brand: 'Logitech',
 sellerName: 'VComm Accessories',
 status: 'in_stock',
 image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&q=80',
 weight: '612',
 dimensions: '312.6 x 131.5 x 26.1'
 },
 {
 name: 'Chuột không dây Logitech MX Master 3S',
 sku: 'LOG-MX-MASTER-3S',
 price: 2590000,
 costPrice: 1900000,
 margin: 26.6,
 stock: 85,
 category: 'Phụ kiện',
 brand: 'Logitech',
 sellerName: 'VComm Accessories',
 status: 'pending_approval',
 image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80',
 weight: '141',
 dimensions: '124.9 x 84.3 x 51'
 },
 {
 name: 'Sony FE 24-70mm f/2.8 GM II',
 sku: 'SONY-SEL2470GM2',
 price: 45990000,
 costPrice: 40000000,
 margin: 13,
 stock: 8,
 category: 'Nhiếp ảnh',
 brand: 'Sony',
 sellerName: 'Camera Pro Studio',
 status: 'in_stock',
 image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
 weight: '695',
 dimensions: '87.8 x 119.9 x 87.8'
 }
 ];
 for (const item of demoItems) {
 await addDoc(collection(db, 'products'), {
 ...item,
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp()
 });
 }
 };

 const addProduct = async (productData: Partial<Product>) => {
 try {
 await addDoc(collection(db, 'products'), {
 ...productData,
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp()
 });
 } catch (error) {
 handleFirestoreError(error, 'create', 'products');
 }
 };

 const deleteProduct = async (id: string) => {
 try {
 await deleteDoc(doc(db, 'products', id));
 } catch (error) {
 handleFirestoreError(error, 'delete', 'products');
 }
 };

 const toggleVisibility = async (id: string, currentStatus: string) => {
 try {
 const newStatus = currentStatus === 'hidden' ? 'in_stock' : 'hidden';
 await updateDoc(doc(db, 'products', id), {
 status: newStatus,
 updatedAt: serverTimestamp()
 });
 } catch (error) {
 handleFirestoreError(error, 'update', 'products');
 }
 };

 const updateHiddenCost = async (product: Product, value: number) => {
 try {
 const newProfit = product.price - (product.costPrice || 0) - value;
 const newMargin = product.price > 0 ? (newProfit / product.price) * 100 : 0;
 await updateDoc(doc(db, 'products', product.id), {
 hiddenCosts: value,
 profit: newProfit,
 margin: Number(newMargin.toFixed(1)),
 updatedAt: serverTimestamp()
 });
 } catch (error) {
 handleFirestoreError(error, 'update', 'products');
 }
 };

 const [filterCategory, setFilterCategory] = useState<string>('all');
 const [filterBrand, setFilterBrand] = useState<string>('all');
 const [searchQuery, setSearchQuery] = useState<string>('');
 
 const [isScanning, setIsScanning] = useState(false);
 const [isScanMode, setIsScanMode] = useState(false);
 const [isCameraActive, setIsCameraActive] = useState(false);
 const [scannedSkus, setScannedSkus] = useState<string[]>([]);
 const [currentSku, setCurrentSku] = useState('');
 const [inventoryUpdateMode, setInventoryUpdateMode] = useState(false);
 const scannerRef = useRef<Html5QrcodeScanner | null>(null);

 useEffect(() => {
 if (isCameraActive) {
 const scanner = new Html5QrcodeScanner(
 "reader", 
 { fps: 10, qrbox: { width: 250, height: 250 } },
 /* verbose= */ false
 );
 
 scanner.render((decodedText) => {
 // Success callback
 if (decodedText) {
 handleScannedResult(decodedText);
 scanner.clear();
 setIsCameraActive(false);
 }
 }, (error) => {
 // Error callback (usually just 'no code found in frame')
 // console.warn(error);
 });

 scannerRef.current = scanner;
 }

 return () => {
 if (scannerRef.current) {
 scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
 }
 };
 }, [isCameraActive]);

 const handleScannedResult = (sku: string) => {
 if (inventoryUpdateMode) {
 // Find product and increment stock
 const productIndex = products.findIndex(p => p.sku === sku || p.id === sku);
 if (productIndex > -1) {
 const updatedProducts = [...products];
 updatedProducts[productIndex].stock += 1;
 setProducts(updatedProducts);
 alert(`Đã nhận diện: ${updatedProducts[productIndex].name}. Đã cập nhật tồn kho +1 (Tổng: ${updatedProducts[productIndex].stock})`);
 } else {
 alert(`Không tìm thấy sản phẩm có SKU: ${sku}`);
 }
 } else {
 if (!scannedSkus.includes(sku)) {
 setScannedSkus(prev => [...prev, sku]);
 }
 }
 };
 const [showPnLForProduct, setShowPnLForProduct] = useState<Product | null>(null);
 const [pnlPrice, setPnlPrice] = useState(0);
 const [pnlCostPrice, setPnlCostPrice] = useState(0);
 const [pnlHiddenCosts, setPnlHiddenCosts] = useState(0);
 const [useOptionalPlatformFees, setUseOptionalPlatformFees] = useState(true);
 const [pnlOptionalFees, setPnlOptionalFees] = useState({
 serviceFee: true,
 adFee: true,
 affiliateFee: true
 });

 useEffect(() => {
 if (showPnLForProduct) {
 setPnlPrice(showPnLForProduct.price || 0);
 setPnlCostPrice(showPnLForProduct.costPrice || 0);
 setPnlHiddenCosts(showPnLForProduct.hiddenCosts || 0);
 }
 }, [showPnLForProduct]);

 const saveProductPricing = async () => {
 if (!showPnLForProduct) return;
 try {
 const profit = pnlPrice - pnlCostPrice - pnlHiddenCosts;
 const margin = pnlPrice > 0 ? (profit / pnlPrice) * 100 : 0;
 
 await updateDoc(doc(db, 'products', showPnLForProduct.id), {
 price: pnlPrice,
 costPrice: pnlCostPrice,
 hiddenCosts: pnlHiddenCosts,
 profit: profit,
 margin: Number(margin.toFixed(1)),
 updatedAt: serverTimestamp()
 });
 
 setShowPnLForProduct(null);
 alert('Đã cập nhật giá và chi phí thành công!');
 } catch (error) {
 handleFirestoreError(error, 'update', 'products');
 }
 };
 const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
 const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
 const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
 const [fileValidation, setFileValidation] = useState<{status: 'idle'|'validating'|'success'|'error', message: string, data?: any}>({status: 'idle', message: ''});
 const [newProduct, setNewProduct] = useState({
 name: '',
 category: 'Điện thoại',
 brand: '',
 price: '',
 costPrice: '',
 hiddenCosts: '',
 stock: '',
 sku: '',
 description: '',
 weight: '',
 dimensions: ''
 });

 const generateSKU = () => {
 const brandPart = newProduct.brand ? newProduct.brand.substring(0, 3).toUpperCase() : 'GEN';
 const catPart = newProduct.category.substring(0, 2).toUpperCase();
 const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
 const sku = `${brandPart}-${catPart}-${randomPart}`;
 setNewProduct({ ...newProduct, sku });
 };

 const toggleScanMode = () => {
 setIsScanMode(true);
 setScannedSkus([]);
 };

 const addSku = () => {
 if (currentSku && !scannedSkus.includes(currentSku)) {
 setScannedSkus([...scannedSkus, currentSku]);
 setCurrentSku('');
 }
 };

 const toggleScan = () => {
 setIsScanning(true);
 setTimeout(() => setIsScanning(false), 3000);
 };

 const confirmDelete = () => {
 if (deleteConfirm) {
 setProducts(prev => prev.filter(p => p.id !== deleteConfirm.id));
 setDeleteConfirm(null);
 }
 };

  const toggleProductSelection = (id: string, e?: React.MouseEvent) => { if (e) { e.stopPropagation(); } setSelectedProductIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]); }; 
  const handleSelectAll = (filteredList: Product[]) => { if (selectedProductIds.length === filteredList.length) { setSelectedProductIds([]); } else { setSelectedProductIds(filteredList.map(p => p.id)); } }; 
  const performBulkDelete = async () => { if (window.confirm("Xác nhận xóa?")) { for (const id of selectedProductIds) { await deleteProduct(id); } setSelectedProductIds([]); } }; 
  const performBulkHide = async () => { if (window.confirm("Xác nhận đổi trạng thái?")) { for (const id of selectedProductIds) { const p = products.find(prod => prod.id === id); if (p) await toggleVisibility(id, p.status); } setSelectedProductIds([]); } };

  const handleBulkApprove = () => {
 setIsScanning(true);
 setTimeout(() => {
 setIsScanning(false);
 alert('Đã phê duyệt toàn bộ 245 sản phẩm từ các Seller (Bulk Approve Success)');
 }, 2000);
 };

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
 setFileValidation({status: 'error', message: 'Vui lòng tải lên định dạng .csv hoặc .xlsx'});
 return;
 }

 setFileValidation({status: 'validating', message: 'Hệ thống đang AI-Scan và chuẩn hóa cấu trúc dữ liệu...'});
 
 // Simulate validation and processing
 setTimeout(() => {
 if (file.size > 5 * 1024 * 1024) {
 setFileValidation({status: 'error', message: 'File vượt quá kích thước cho phép (Max: 5MB).'});
 } else {
 // Mock successful parse with a random number of items
 const parsedCount = Math.floor(Math.random() * 50) + 10;
 setFileValidation({status: 'success', message: `Xác thực thành công. Phát hiện ${parsedCount} sản phẩm hợp lệ, 0 lỗi.`, data: parsedCount});
 }
 }, 2000);
 };

 const handleDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 };

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 const file = e.dataTransfer.files?.[0];
 if (file) {
 // Simulate file input change
 handleFileUpload({ target: { files: [file] } } as any);
 }
 };

 const handleAddProduct = (e: React.FormEvent) => {
 e.preventDefault();
 
 if (uploadMode === 'bulk') {
 if (fileValidation.status !== 'success') return;
 
 const count = fileValidation.data || 12;
 const newBulkProducts: Product[] = Array.from({length: count}).map((_, i) => ({
 id: `PRD-BLK-${Math.floor(Math.random() * 9000) + 1000}`,
 name: `Sản phẩm Data Import ${i + 1}`,
 sku: `CSV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
 price: 150000 + Math.floor(Math.random() * 500000),
 costPrice: 100000,
 hiddenCosts: 10000,
 margin: 25,
 profit: 50000,
 stock: Math.floor(Math.random() * 100) + 10,
 category: 'Nhập khẩu CSV',
 brand: 'Bulk Data',
 sellerName: 'Hệ thống (Self-managed)',
 status: 'pending_approval' as const,
 image: `https://picsum.photos/seed/bulk${i}/100/100`
 }));
 setProducts([...newBulkProducts, ...products]);
 setIsUploadModalOpen(false);
 setFileValidation({status: 'idle', message: ''});
 return;
 }

 const price = Number(newProduct.price) || 0;
 const costPrice = Number(newProduct.costPrice) || (price * 0.7);
 const hiddenCosts = Number(newProduct.hiddenCosts) || 0;
 const profit = price - costPrice - hiddenCosts;
 const margin = price > 0 ? (profit / price) * 100 : 0;

 const product: Product = {
 id: `PRD-${Math.floor(Math.random() * 900) + 100}`,
 name: newProduct.name,
 sku: newProduct.sku,
 price: price,
 costPrice: costPrice,
 hiddenCosts: hiddenCosts,
 margin: Number(margin.toFixed(1)),
 profit: profit,
 stock: Number(newProduct.stock) || 0,
 category: newProduct.category,
 brand: newProduct.brand,
 sellerName: 'Hệ thống (Self-managed)',
 status: 'in_stock',
 image: `https://picsum.photos/seed/${newProduct.name}/100/100`
 };
 setProducts([product, ...products]);
 setIsUploadModalOpen(false);
 setNewProduct({ name: '', category: 'Điện thoại', brand: '', price: '', costPrice: '', hiddenCosts: '', stock: '', sku: '', description: '', weight: '', dimensions: '' });
 };

 const categories = Array.from(new Set(products.map(p => p.category)));
 const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));

 const filteredProducts = products.filter(p => {
 const matchStatus = filterStatus === 'all' || p.status === filterStatus;
 const matchCategory = filterCategory === 'all' || p.category === filterCategory;
 const matchBrand = filterBrand === 'all' || p.brand === filterBrand;
 
 const queries = searchQuery.split(',').map(q => q.trim().toLowerCase()).filter(Boolean);
 const matchSearch = queries.length === 0 || queries.some(q =>
 p.name.toLowerCase().includes(q) ||
 p.sku.toLowerCase().includes(q) ||
 p.sellerName.toLowerCase().includes(q) ||
 (p.brand && p.brand.toLowerCase().includes(q)) ||
 p.id.toLowerCase().includes(q)
 );

 return matchStatus && matchCategory && matchBrand && matchSearch;
 });

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 {/* Banner Khuyến mãi/Tính năng mới */}
 <div className="relative w-full h-48 rounded-lg overflow-hidden shadow-sm group">
 <img 
 src="https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=1200&h=400" 
 alt="Banner giới thiệu tính năng" 
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
 referrerPolicy="no-referrer"
 />
 <div className="absolute inset-0 bg-blue-900/60 flex flex-col justify-center px-12">
 <h2 className="text-3xl font-black text-[#FAF9F5] italic tracking-tight">Ra mắt Công cụ AI Pricing 2.0</h2>
 <p className="text-blue-100 text-sm mt-3 max-w-lg">Tối ưu hoá giá bán tự động dựa trên dữ liệu đối thủ và tồn kho thực tế. Giúp tăng 15% biên lợi nhuận chỉ trong 1 thao tác.</p>
 <button className="mt-6 w-fit px-8 py-3 bg-white text-blue-800 font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm">
 Trải nghiệm ngay
 </button>
 </div>
 </div>

 {/* Modal Bổ sung sản phẩm */}
 {isUploadModalOpen && (
 <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#111827]/70 backdrop-blur-md animate-in fade-in duration-300">
 <div className="bg-white w-full max-w-4xl rounded-lg shadow-sm border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
 <div className="p-8 border-b border-[#F3F4F6] flex justify-between items-center bg-slate-50/50">
 <div className="flex items-center gap-4">
 <div className="p-4 bg-slate-900 rounded-[1.5rem] shadow-sm shadow-slate-900/5">
 <ArrowUpCircle className="w-8 h-8 text-[#FAF9F5]" />
 </div>
 <div>
 <h2 className="text-2xl font-black text-[#111827] tracking-tight">Thêm sản phẩm mới</h2>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-[0.2em] mt-1">Automatic SKU & AI Validation flow</p>
 </div>
 </div>
 
 <div className="flex bg-slate-100 p-1.5 rounded-lg mx-8">
 <button 
 onClick={() => setUploadMode('single')}
 className={cn("px-6 py-2.5 text-xs font-black rounded-lg transition-all uppercase tracking-widest", uploadMode === 'single' ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >Nhập thủ công</button>
 <button 
 onClick={() => setUploadMode('bulk')}
 className={cn("px-6 py-2.5 text-xs font-black rounded-lg transition-all uppercase tracking-widest", uploadMode === 'bulk' ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >Tải lên (CSV/Excel)</button>
 </div>

 <button 
 onClick={() => { setIsUploadModalOpen(false); setUploadMode('single'); setFileValidation({status: 'idle', message: ''}); }}
 className="p-3 hover:bg-white rounded-lg text-[#9CA3AF] transition-all hover:text-[#111827] border border-transparent hover:border-slate-300 group"
 >
 <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
 </button>
 </div>

 <form onSubmit={handleAddProduct} className="flex-1 overflow-y-auto flex flex-col">
 {uploadMode === 'single' ? (
 <div className="p-10 space-y-8">
 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Tên sản phẩm</label>
 <input 
 type="text" required placeholder="Ví dụ: iPhone 16 Pro Max..." 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-600/5 transition-all font-medium"
 value={newProduct.name}
 onChange={e => setNewProduct({...newProduct, name: e.target.value})}
 />
 </div>
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Thương hiệu</label>
 <input 
 type="text" required placeholder="Apple, Samsung, Sony..." 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-600/5 transition-all font-medium"
 value={newProduct.brand}
 onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Ngành hàng</label>
 <select 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-600/5 transition-all font-bold appearance-none"
 value={newProduct.category}
 onChange={e => setNewProduct({...newProduct, category: e.target.value})}
 >
 <option>Điện thoại</option>
 <option>Gia dụng</option>
 <option>Thời trang</option>
 <option>Điện tử</option>
 </select>
 </div>
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Mã SKU (Tự động hoặc Thủ công)</label>
 <div className="relative">
 <input 
 type="text" required placeholder="Mã SKU định danh..." 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-5 pr-12 py-4 text-sm focus:outline-none focus:bg-white font-mono font-bold text-orange-700"
 value={newProduct.sku}
 onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
 />
 <button 
 type="button"
 onClick={generateSKU}
 title="Sinh mã SKU tự động"
 className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 text-orange-700 rounded-lg transition-all"
 >
 <Hash className="w-5 h-5" />
 </button>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Giá niêm yết (VNĐ)</label>
 <input 
 type="number" required placeholder="30.000.000" 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white font-mono font-bold"
 value={newProduct.price}
 onChange={e => setNewProduct({...newProduct, price: e.target.value})}
 />
 </div>
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Tồn kho ban đầu</label>
 <input 
 type="number" required placeholder="Số lượng nhập kho..." 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white font-mono font-bold"
 value={newProduct.stock}
 onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Giá vốn (VNĐ)</label>
 <input 
 type="number" placeholder="Mặc định: 70% giá niêm yết" 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white font-mono font-bold"
 value={newProduct.costPrice}
 onChange={e => setNewProduct({...newProduct, costPrice: e.target.value})}
 />
 </div>
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Chi phí ẩn (VC, Đóng gói... VNĐ)</label>
 <input 
 type="number" placeholder="Ví dụ: 15.000" 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white font-mono font-bold"
 value={newProduct.hiddenCosts}
 onChange={e => setNewProduct({...newProduct, hiddenCosts: e.target.value})}
 />
 </div>
 </div>

 {/* Add additional details per user request */}
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Mô tả sản phẩm chi tiết</label>
 <textarea 
 rows={3} placeholder="Mô tả công năng, đặc điểm nổi bật..."
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-600/5 transition-all font-medium resize-none"
 value={newProduct.description}
 onChange={e => setNewProduct({...newProduct, description: e.target.value})}
 ></textarea>
 </div>

 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Trọng lượng (Gram)</label>
 <input 
 type="number" placeholder="Ví dụ: 500" 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white font-mono font-bold"
 value={newProduct.weight}
 onChange={e => setNewProduct({...newProduct, weight: e.target.value})}
 />
 </div>
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Kích thước (DxRxC) (cm)</label>
 <input 
 type="text" placeholder="Ví dụ: 15x10x5" 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white font-mono font-bold"
 value={newProduct.dimensions}
 onChange={e => setNewProduct({...newProduct, dimensions: e.target.value})}
 />
 </div>
 </div>
 </div>
 ) : (
 <div className="p-10 space-y-8 flex-1 flex flex-col justify-center">
 <div 
 onDragOver={handleDragOver}
 onDrop={handleDrop}
 className={cn(
 "border-2 border-dashed rounded-lg p-12 text-center transition-all relative flex flex-col items-center justify-center gap-6",
 fileValidation.status === 'validating' ? "border-blue-300 bg-slate-100/50" : 
 fileValidation.status === 'error' ? "border-red-300 bg-red-50/50" :
 fileValidation.status === 'success' ? "border-emerald-300 bg-emerald-50/50" :
 "border-slate-400 bg-slate-50 hover:bg-slate-100 hover:border-blue-400"
 )}
 >
 <input 
 type="file" 
 accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
 onChange={handleFileUpload}
 disabled={fileValidation.status === 'validating'}
 />
 
 {fileValidation.status === 'idle' && (
 <>
 <div className="w-20 h-20 bg-white shadow-sm shadow-slate-200/50 rounded-full flex items-center justify-center text-orange-700">
 <UploadCloud className="w-8 h-8" />
 </div>
 <div>
 <h3 className="text-xl font-black text-[#111827]">Kéo thả file CSV/Excel vào đây</h3>
 <p className="text-sm text-[#6B7280] font-medium mt-2">Hoặc click để chọn file từ máy tính của bạn (Tối đa 50MB)</p>
 </div>
 <p className="text-[10px] uppercase font-black tracking-widest text-[#9CA3AF]">Hỗ trợ: .CSV, .XLS, .XLSX</p>
 </>
 )}

 {fileValidation.status === 'validating' && (
 <>
 <div className="w-20 h-20 bg-white shadow-sm shadow-blue-200/50 rounded-full flex items-center justify-center text-orange-700">
 <Sparkles className="w-8 h-8 animate-pulse" />
 </div>
 <div>
 <h3 className="text-xl font-black text-orange-700">Đang quét và chuẩn hóa dữ liệu...</h3>
 <p className="text-sm text-orange-600 font-medium mt-2">{fileValidation.message}</p>
 </div>
 </>
 )}

 {fileValidation.status === 'error' && (
 <>
 <div className="w-20 h-20 bg-white shadow-sm shadow-red-200/50 rounded-full flex items-center justify-center text-red-600">
 <AlertCircle className="w-8 h-8" />
 </div>
 <div>
 <h3 className="text-xl font-black text-red-600">Lỗi xác thực dữ liệu</h3>
 <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium text-left">
 Phát hiện dữ liệu thiếu định dạng tiền tệ (Cột Giá Bán) hoặc các trường bắt buộc bị trống. <br />
 Bạn có thể sử dụng <b>AI Auto-correction</b> để hỗ trợ điền tự động các trường này.
 </div>
 </div>
 <div className="flex gap-4 relative z-20 mt-4">
 <button 
 type="button"
 onClick={(e) => { e.preventDefault(); setFileValidation({status:'idle', message:''}); }}
 className="px-6 py-2.5 bg-white text-red-600 border border-red-200 font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-red-50 transition-all"
 >Chỉnh sửa & Thử lại</button>
 <button 
 type="button"
 onClick={(e) => { 
 e.preventDefault(); 
 setFileValidation({status: 'validating', message: 'AI đang tiến hành sửa lỗi và chuẩn hóa dữ liệu...'});
 setTimeout(() => {
 const parsedCount = Math.floor(Math.random() * 50) + 10;
 setFileValidation({status: 'success', message: `AI đã xử lý xong. Cập nhật ${parsedCount} sản phẩm hợp vệ, 0 lỗi.`, data: parsedCount});
 }, 2500);
 }}
 className="px-6 py-2.5 bg-red-600 text-[#FAF9F5] font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2 shadow-sm shadow-red-500/20"
 ><Sparkles className="w-4 h-4"/> Sửa lỗi với AI</button>
 </div>
 </>
 )}

 {fileValidation.status === 'success' && (
 <>
 <div className="w-20 h-20 bg-white shadow-sm shadow-emerald-200/50 rounded-full flex items-center justify-center text-emerald-600">
 <CheckCircle2 className="w-8 h-8" />
 </div>
 <div>
 <h3 className="text-xl font-black text-emerald-600">Pass: Dữ liệu đạt chuẩn ERP</h3>
 <p className="text-sm text-emerald-500 font-medium mt-2">{fileValidation.message}</p>
 </div>
 </>
 )}
 </div>
 
 {fileValidation.status === 'idle' && (
 <div className="flex justify-between items-center bg-slate-100/50 border border-slate-300 rounded-lg p-6 hover:border-orange-200 transition-all">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-white rounded-lg shadow-sm">
 <DownloadCloud className="w-6 h-6 text-orange-700" />
 </div>
 <div>
 <p className="text-sm font-bold text-[#111827]">Tải File Mẫu (Template)</p>
 <p className="text-[10px] text-[#6B7280] font-bold mt-0.5">Bản chuẩn 2.0 đã bao gồm schema của AI Server.</p>
 </div>
 </div>
 <a href="#" className="flex items-center gap-2 text-xs font-bold text-orange-700 hover:text-orange-800 bg-white px-5 py-2.5 rounded-lg border border-slate-300 shadow-sm transition-all relative z-20 uppercase tracking-widest">
 Tải Template
 </a>
 </div>
 )}
 </div>
 )}

 <div className="flex gap-4 p-8 border-t border-slate-200 bg-white mt-auto">
 <button 
 type="button"
 onClick={() => setIsUploadModalOpen(false)}
 className="px-8 py-5 border border-slate-300 text-[#4B5563] font-black rounded-lg text-[11px] hover:bg-slate-50 transition-all uppercase tracking-[0.2em]"
 >
 Hủy bỏ
 </button>
 <button 
 type="submit"
 disabled={uploadMode === 'bulk' && fileValidation.status !== 'success'}
 className="flex-1 py-5 bg-[#111827] text-[#FAF9F5] font-black rounded-lg text-[11px] hover:bg-slate-800 transition-all uppercase tracking-[0.2em] shadow-sm shadow-slate-900/40 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {uploadMode === 'bulk' ? 'Import Dữ Liệu' : 'Duyệt & Thêm vào hệ thống'} <Plus className="w-5 h-5" />
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {isScanMode && (
 <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#111827]/70 backdrop-blur-md animate-in fade-in duration-300">
 <div className="bg-white w-full max-w-xl rounded-lg shadow-sm p-8 animate-in zoom-in-95">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-xl font-black">Quét mã vạch & Kiểm kê</h2>
 <button onClick={() => { setIsScanMode(false); setIsCameraActive(false); }} className="p-2 hover:bg-slate-100 rounded-lg">
 <X className="w-5 h-5 text-slate-600" />
 </button>
 </div>

 <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-lg">
 <button 
 onClick={() => setInventoryUpdateMode(false)}
 className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", !inventoryUpdateMode ? "bg-white text-orange-700 shadow-sm" : "text-slate-600")}
 >Tìm kiếm chung</button>
 <button 
 onClick={() => setInventoryUpdateMode(true)}
 className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", inventoryUpdateMode ? "bg-white text-orange-700 shadow-sm" : "text-slate-600")}
 >Bổ sung tồn kho (+1)</button>
 </div>

 {!isCameraActive ? (
 <div className="space-y-6">
 <div className="aspect-video bg-slate-900 rounded-lg flex flex-col items-center justify-center text-[#FAF9F5]/40 cursor-pointer hover:bg-slate-800 transition-all group" onClick={() => setIsCameraActive(true)}>
 <Camera className="w-12 h-12 mb-3 group-hover:scale-110 transition-transform" />
 <p className="text-sm font-bold">Bật Camera để quét mã vạch</p>
 <p className="text-[10px] uppercase tracking-widest mt-1">Hỗ trợ QR, Barcode, SKU</p>
 </div>

 <div className="relative">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full border-t border-slate-300"></div>
 </div>
 <div className="relative flex justify-center text-xs uppercase font-bold text-slate-500">
 <span className="bg-white px-4">Hoặc nhập thủ công</span>
 </div>
 </div>

 <div className="flex gap-2">
 <input 
 type="text" 
 value={currentSku}
 onChange={(e) => setCurrentSku(e.target.value)}
 placeholder="Nhập mã SKU/Barcode..."
 className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold"
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 handleScannedResult(currentSku);
 setCurrentSku('');
 }
 }}
 />
 <button 
 onClick={() => {
 handleScannedResult(currentSku);
 setCurrentSku('');
 }} 
 className="px-6 py-2 bg-[#111827] text-[#FAF9F5] font-bold rounded-lg text-xs hover:bg-slate-800"
 >Thêm</button>
 </div>
 </div>
 ) : (
 <div className="space-y-4">
 <div id="reader" className="w-full h-full overflow-hidden rounded-lg border-4 border-slate-900/20 shadow-inner"></div>
 <button 
 onClick={() => setIsCameraActive(false)}
 className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-lg text-xs hover:bg-red-100 transition-all flex items-center justify-center gap-2"
 >
 <X className="w-4 h-4" /> Dừng quét Camera
 </button>
 </div>
 )}

 {!inventoryUpdateMode && (
 <div className="mt-8">
 <div className="flex justify-between items-center mb-3">
 <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Danh sách SKU đã quét ({scannedSkus.length})</h4>
 {scannedSkus.length > 0 && (
 <button onClick={() => setScannedSkus([])} className="text-[10px] font-bold text-red-500 hover:underline">Xóa tất cả</button>
 )}
 </div>
 <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
 {scannedSkus.map(sku => (
 <div key={sku} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg text-xs font-mono font-bold border border-slate-200 animate-in slide-in- transition-all">
 <span className="text-orange-700">{sku}</span>
 <div className="flex items-center gap-4">
 <span className="text-[10px] text-slate-500">
 {products.find(p => p.sku === sku || p.id === sku)?.name || 'SKU chưa xác định'}
 </span>
 <button onClick={() => setScannedSkus(scannedSkus.filter(s => s !== sku))} className="p-1 hover:bg-red-50 text-red-400 rounded transition-all">
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 {scannedSkus.length === 0 && (
 <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-[11px] font-medium italic">
 Chưa có SKU nào được quét
 </div>
 )}
 </div>
 
 <div className="flex gap-4 mt-8">
 <button 
 onClick={() => {
 setSearchQuery(scannedSkus.join(', '));
 setIsScanMode(false); 
 }} 
 disabled={scannedSkus.length === 0}
 className="flex-1 py-4 bg-[#111827] text-[#FAF9F5] rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm shadow-slate-900/20"
 >
 Tìm kiếm {scannedSkus.length} SKU
 </button>
 </div>
 </div>
 )}

 {inventoryUpdateMode && (
 <div className="mt-8 p-4 bg-slate-100 border border-slate-300 rounded-lg">
 <div className="flex gap-3">
 <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
 <Zap className="w-5 h-5 text-orange-700" />
 </div>
 <div>
 <p className="text-xs font-bold text-blue-900">Chế độ Bổ sung Tồn kho</p>
 <p className="text-[10px] text-orange-700 font-medium mt-1">Khi quét thành công một mã vạch hợp lệ, hệ thống sẽ tự động cộng 1 đơn vị vào tồn kho của sản phẩm đó ngay lập tức.</p>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Confirmation Dialog */}
 {deleteConfirm && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#111827]/60 backdrop-blur-sm animate-in fade-in duration-300">
 <div className="bg-white w-full max-w-md rounded-lg shadow-sm border border-slate-300 overflow-hidden p-8 animate-in zoom-in-95 duration-300">
 <div className="flex flex-col items-center text-center space-y-4">
 <div className="p-4 bg-red-50 rounded-full text-red-600">
 <Trash2 className="w-8 h-8" />
 </div>
 <div className="space-y-2">
 <h3 className="text-xl font-bold text-[#111827]">Xác nhận xóa sản phẩm?</h3>
 <p className="text-sm text-[#6B7280]">
 Bạn có chắc chắn muốn xóa sản phẩm <span className="font-bold text-[#111827]">"{deleteConfirm.name}"</span> không? Hành động này không thể hoàn tác.
 </p>
 </div>
 </div>
 <div className="flex gap-4 mt-8">
 <button 
 onClick={() => setDeleteConfirm(null)}
 className="flex-1 py-4 border border-slate-300 text-[#4B5563] font-bold rounded-lg text-xs hover:bg-slate-50 transition-all uppercase tracking-widest"
 >
 Hủy bỏ
 </button>
 <button 
 onClick={confirmDelete}
 className="flex-1 py-4 bg-red-600 text-[#FAF9F5] font-bold rounded-lg text-xs hover:bg-red-700 transition-all uppercase tracking-widest shadow-sm shadow-red-500/20"
 >
 Xóa ngay
 </button>
 </div>
 </div>
 </div>
 )}

 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Quản lý Sản phẩm (PIM)</h1>
 <p className="text-sm text-[#6B7280] mt-1">Chuẩn hóa dữ liệu, quản lý duyệt sản phẩm Seller và vận hành AI Governance.</p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={toggleScanMode}
 className="bg-white border border-slate-300 px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 group shadow-sm hover:bg-slate-100 active:scale-95 border-b-4 border-b-blue-600"
 >
 <ScanBarcode className="w-5 h-5 text-[#2563EB]" />
 Quét mã / Kiểm kê
 </button>
 <button 
 onClick={toggleScan}
 disabled={isScanning}
 className={cn(
 "bg-white border border-slate-300 px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 group shadow-sm",
 isScanning ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 active:scale-95"
 )}
 >
 <Sparkles className={cn("w-4 h-4 text-[#2563EB] group-hover:rotate-12 transition-transform", isScanning && "animate-spin")} />
 {isScanning ? "AI đang quét dữ liệu..." : "AI Auto-Scan SP"}
 </button>
 <button 
 onClick={() => setIsUploadModalOpen(true)}
 className="bg-[#111827] text-[#FAF9F5] px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 active:scale-95"
 >
 <Plus className="w-4 h-4" /> Bổ sung sản phẩm
 </button>
 <button 
 onClick={handleBulkApprove}
 disabled={isScanning}
 className="bg-[#2563EB] text-[#FAF9F5] px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5 active:scale-95 disabled:opacity-50"
 >
 Duyệt sản phẩm mới (Bulk)
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" columns={4} gap={16}>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm transform hover:-translate-y-1 transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Chờ duyệt (Seller)</span>
 <Clock className="w-5 h-5 text-amber-500" />
 </div>
 <div className="text-3xl font-bold text-[#111827]">245</div>
 <p className="text-[10px] text-amber-600 mt-2 font-bold bg-amber-50 px-2 py-0.5 rounded w-fit">Cần SLA xử lý: 4h</p>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm transform hover:-translate-y-1 transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Lỗi chuẩn hóa (AI)</span>
 <AlertCircle className="w-5 h-5 text-red-500" />
 </div>
 <div className="text-3xl font-bold text-red-500">18</div>
 <p className="text-[10px] text-slate-500 mt-2">Phát hiện bởi AI Auto-Scan</p>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm transform hover:-translate-y-1 transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Biên lợi nhuận gộp</span>
 <Calculator className="w-5 h-5 text-orange-700" />
 </div>
 <div className="text-3xl font-bold text-[#111827]">22.4%</div>
 <p className="text-[10px] text-emerald-600 mt-2 font-bold">Tối ưu +1.2% Target</p>
 </div>
 <div className="bg-[#111827] p-6 rounded-lg shadow-sm shadow-slate-200 relative overflow-hidden group">
 <div className="relative z-10 flex flex-col justify-between h-full">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Category AI</span>
 <Zap className="w-5 h-5 text-orange-600" />
 </div>
 <div>
 <div className="text-3xl font-bold text-[#FAF9F5] tracking-tighter">99.2%</div>
 <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase">Accuracy Rate</p>
 </div>
 </div>
 <Package className="absolute -bottom-6 -right-6 w-24 h-24 text-[#FAF9F5]/5 group-hover:rotate-12 transition-transform duration-700" />
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-6 border-b border-[#F3F4F6] space-y-4">
 <div className="flex flex-col xl:flex-row gap-4 justify-between items-start">
 <div className="relative flex-1 max-w-2xl">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
 <input 
 type="text" 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Tìm sản phẩm (Tên, SKU, ID, Nhà bán, Thương hiệu)..." 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-12 pr-4 py-3 sm:py-3.5 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-600/10 transition-all font-medium"
 />
 </div>
 <div className="flex p-1.5 bg-slate-100 rounded-lg w-full xl:w-auto overflow-x-auto custom-scrollbar flex-nowrap min-w-0">
 <button 
 onClick={() => setFilterStatus('all')}
 className={cn("px-6 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap", filterStatus === 'all' ? "bg-white text-[#111827] shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >Tất cả trạng thái</button>
 <button 
 onClick={() => setFilterStatus('pending_approval')}
 className={cn("px-6 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap", filterStatus === 'pending_approval' ? "bg-white text-amber-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >Chờ duyệt</button>
 <button 
 onClick={() => setFilterStatus('in_stock')}
 className={cn("px-6 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap", filterStatus === 'in_stock' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >Kinh doanh</button>
 <button 
 onClick={() => setFilterStatus('hidden')}
 className={cn("px-6 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap", filterStatus === 'hidden' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >Đã ẩn</button>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-4 pt-2">
 <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest pl-1"><Filter className="w-4 h-4"/> Lọc nâng cao:</div>
 <select
 value={filterCategory}
 onChange={(e) => setFilterCategory(e.target.value)}
 className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-xs font-bold text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-orange-600/20"
 >
 <option value="all">Tất cả ngành hàng</option>
 {categories.map(category => (
 <option key={category} value={category}>{category}</option>
 ))}
 </select>

 <select
 value={filterBrand}
 onChange={(e) => setFilterBrand(e.target.value)}
 className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-xs font-bold text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-orange-600/20"
 >
 <option value="all">Tất cả thương hiệu</option>
 {brands.map(brand => (
 <option key={brand} value={brand}>{brand}</option>
 ))}
 </select>
 </div>
 </div>

 <div className="p-8 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
 {filteredProducts.map((product) => (
 <div key={product.id} className={cn("group flex flex-col bg-white border border-slate-300 rounded-lg p-6 hover:shadow-[0_20px_50px_rgba(37,99,235,0.08)] hover:border-orange-200 transition-all animate-in fade-in relative", selectedProductIds.includes(product.id) && "ring-2 ring-primary-500 border-primary-200")}>
 <div className="absolute top-4 left-4 z-20">
  <input 
    type="checkbox" 
    className="w-5 h-5 rounded border-slate-400 text-primary-600 focus:ring-primary-500 cursor-pointer"
    checked={selectedProductIds.includes(product.id)}
    onChange={(e) => toggleProductSelection(product.id)}
  />
 </div>
 {/* Actions - Hover only */}
 <div className="absolute top-8 right-8 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
 <button 
 onClick={() => toggleVisibility(product.id, product.status)}
 className="p-3 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-200 shadow-sm transition-all"
 title={product.status === 'hidden' ? "Hiển thị sản phẩm" : "Ẩn sản phẩm"}
 >
 {product.status === 'hidden' ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
 </button>
 <button 
 onClick={() => setDeleteConfirm({ id: product.id, name: product.name })}
 className="p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-[#FAF9F5] shadow-sm transition-all"
 title="Xóa sản phẩm"
 >
 <Trash2 className="w-5 h-5" />
 </button>
 </div>

 {/* Image & Badges */}
 <div className="relative h-60 w-full rounded-lg bg-slate-50 border border-slate-300 overflow-hidden mb-6 group-hover:shadow-sm transition-all">
 <img src={product.image} alt={product.name} className={cn("w-full h-full object-cover group-hover:scale-105 transition-transform duration-700", product.status === 'hidden' && "grayscale opacity-50")} referrerPolicy="no-referrer" />
 <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[9px] font-black text-slate-600 shadow-sm border border-slate-200 uppercase tracking-tighter z-10">
 {product.id}
 </div>
 {/* Status Badge */}
 <div className="absolute bottom-3 left-3 flex gap-2 z-10">
 <span className={cn(
 "px-4 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 shadow-sm uppercase tracking-widest border backdrop-blur-md",
 product.status === 'hidden' ? "bg-slate-600/90 text-[#FAF9F5] border-slate-500" :
 product.status === 'in_stock' ? "bg-emerald-500/90 text-[#FAF9F5] border-emerald-400" : "bg-amber-500/90 text-[#FAF9F5] border-amber-400"
 )}>
 {product.status === 'hidden' ? <EyeOff className="w-4 h-4" /> :
 product.status === 'in_stock' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
 {product.status === 'hidden' ? 'Đã ẩn' : 
 product.status === 'in_stock' ? 'Đang kinh doanh' : 'Chờ AI duyệt'}
 </span>
 </div>
 </div>

 {/* Info Area */}
 <div className="flex flex-col flex-1">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] font-black text-orange-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 uppercase tracking-widest shadow-sm inline-block">
 {product.category}
 </span>
 </div>
 <h3 className="text-xl font-black text-[#111827] group-hover:text-orange-700 transition-colors line-clamp-2 tracking-tight leading-tight mb-5 flex-1">
 {product.name}
 </h3>

 <div className="space-y-4 mb-6">
 <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
 <div className="flex items-center gap-2.5 text-xs text-[#4B5563] font-bold">
 <ShieldCheck className="w-5 h-5 text-emerald-500" />
 <span className="truncate max-w-[120px]">{product.sellerName}</span>
 </div>
 <div className="flex items-center gap-2 text-xs text-[#6B7280] font-medium">
 <Hash className="w-4 h-4 text-orange-500" />
 <span className="font-mono text-[11px] uppercase font-black">{product.sku}</span>
 </div>
 </div>

 <div className="flex justify-between items-end px-2">
 <div className="space-y-1.5">
 <p className="text-[10px] text-[#6B7280] font-black uppercase tracking-widest">Giá bán</p>
 <p className="text-2xl font-black text-[#111827] font-mono leading-none">
 {formatCurrency(product.price)}
 </p>
 </div>
 <div className="text-right space-y-1.5">
 <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center justify-end gap-1">
 <Target className="w-3.5 h-3.5" /> Profit
 </p>
 <div className="flex items-baseline gap-2">
 <p className="text-lg font-black text-emerald-600 font-mono leading-none">
 +{formatCurrency(product.profit)}
 </p>
 <span className="text-[10px] font-black text-emerald-500/80 bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-100">+{product.margin}%</span>
 </div>
 </div>
 </div>

 <div className="border-t border-slate-200 pt-4 mt-4 flex justify-between items-center px-2 relative z-20">
 <p className="text-[10px] text-[#6B7280] font-black uppercase tracking-widest" title="Bao gồm phí vận chuyển, đóng gói,...">Chi phí ẩn (VC, Đóng gói...)</p>
 <input 
 type="number"
 defaultValue={product.hiddenCosts || 0}
 onBlur={(e) => updateHiddenCost(product, Number(e.target.value))}
 className="w-28 text-right bg-white border border-slate-300 hover:border-blue-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-[#111827] shadow-sm transition-all"
 placeholder="VD: 15000"
 />
 </div>
 </div>

 {/* Footer Metrics */}
 <div className="mt-auto pt-5 border-t border-slate-200 flex items-center justify-between">
 <div className="flex flex-col gap-2">
 <div className="flex items-center gap-2 text-[10px] font-black text-orange-700">
 <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" /> AI Verified
 </div>
 <div className="flex items-center gap-2">
 <div className={cn("w-2.5 h-2.5 rounded-full", product.stock < 10 ? "bg-red-500 animate-pulse" : "bg-emerald-500")}></div>
 <p className="text-[11px] text-[#111827] font-black uppercase tracking-tighter">Kho: {product.stock} SP</p>
 </div>
 </div>

 <button 
 onClick={() => setShowPnLForProduct(product)}
 className="flex items-center gap-2 text-[11px] font-black text-orange-700 hover:translate-x-1 transition-all bg-slate-100 px-4 py-2.5 rounded-lg group/btn"
 >
 Chi tiết P&L <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-2 gap-8" columns={2} gap={32}>
 <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] p-10 rounded-lg text-[#FAF9F5] relative overflow-hidden shadow-sm flex flex-col justify-between group">
 <div className="relative z-10 space-y-6">
 <div className="flex items-center gap-4">
 <div className="p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
 <Sparkles className="w-8 h-8" />
 </div>
 <div>
 <h3 className="text-3xl font-extrabold italic font-serif tracking-tight">AI Metadata Engine</h3>
 <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mt-1 pl-1">Data Governance v2.0</p>
 </div>
 </div>
 <p className="text-blue-50 text-sm leading-relaxed max-w-sm">
 Tự động trích xuất thông tin kỹ thuật từ hình ảnh sản phẩm, tự động gắn tag SEO và đề xuất hạng mục tối ưu hóa P&L dựa trên dữ thị trường thời gian thực.
 </p>
 </div>
 <div className="relative z-10 pt-8">
 <button className="px-10 py-4 bg-[#111827] text-[#FAF9F5] font-bold rounded-lg text-xs hover:translate-y-[-2px] transition-all uppercase tracking-[0.2em] shadow-sm shadow-slate-900/40">Launch Data AI Matrix</button>
 </div>
 <Target className="absolute -bottom-12 -right-12 w-64 h-64 text-[#FAF9F5]/5 opacity-50 group-hover:rotate-12 transition-transform duration-1000" />
 </div>

 <div className="bg-white p-10 border border-slate-300 rounded-lg shadow-sm space-y-8 relative overflow-hidden group">
 <h3 className="text-xl font-bold text-[#111827] flex items-center gap-3">
 <ShieldCheck className="w-6 h-6 text-emerald-500" /> P&L Configuration Engine
 </h3>
 <div className="space-y-6">
 <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 hover:border-emerald-500/30 transition-all cursor-pointer">
 <div className="flex justify-between items-center mb-4">
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global P&L Rules</span>
 <Info className="w-4 h-4 text-slate-500" />
 </div>
 <div className="flex items-end gap-3">
 <div className="text-3xl font-bold text-[#111827]">94%</div>
 <p className="text-[10px] text-emerald-600 font-bold uppercase pb-1.5 tracking-tighter">Độ chính xác định mức</p>
 </div>
 <div className="mt-4 pt-4 border-t border-slate-300/50 flex justify-between items-center">
 <span className="text-[10px] text-slate-600 font-medium italic">Bao gồm: Chi phí Marketing (15%), Vận hành (5%)</span>
 <ArrowRight className="w-4 h-4 text-slate-500" />
 </div>
 </div>
 <div className="space-y-4">
 <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.2em] pl-2">Top Profit Categories</h4>
 <div className="space-y-3">
 {[
 { name: 'Thời trang', share: 45, color: 'bg-slate-800' },
 { name: 'Gia dụng', share: 28, color: 'bg-emerald-500' },
 { name: 'Điện thoại', share: 15, color: 'bg-amber-500' }
 ].map((c, i) => (
 <div key={i} className="space-y-2">
 <div className="flex justify-between text-[11px] font-bold">
 <span>{c.name}</span>
 <span className="text-slate-500">{c.share}%</span>
 </div>
 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div className={cn("h-full transition-all duration-1000", c.color)} style={{ width: `${c.share}%` }} />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 <Activity className="absolute -top-12 -right-12 w-48 h-48 text-slate-100 opacity-50 group-hover:scale-105 transition-transform duration-700" />
 </div>
 </DraggableGrid>
 
 {/* P&L Details Modal */}
 {showPnLForProduct && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md transition-all">
 <div className="bg-white rounded-lg w-full max-w-3xl shadow-sm overflow-hidden flex flex-col max-h-[90vh]">
 {/* Header */}
 <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center text-orange-700">
 <Calculator className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-xl font-black text-slate-900 tracking-tight">Chi tiết P&L Sản phẩm</h3>
 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
 Ref: {showPnLForProduct.sku || showPnLForProduct.id}
 </p>
 </div>
 </div>
 <button 
 onClick={() => setShowPnLForProduct(null)}
 className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
 >
 <X className="w-6 h-6" />
 </button>
 </div>

 {/* Body */}
 <div className="p-8 overflow-y-auto no-scrollbar space-y-8">
 {/* Product Info Summary */}
 <div className="flex items-center gap-6 pb-8 border-b border-slate-200">
 {showPnLForProduct.image ? (
 <img src={showPnLForProduct.image} alt={showPnLForProduct.name} className="w-20 h-20 rounded-lg object-cover border border-slate-200 shadow-sm" referrerPolicy="no-referrer" />
 ) : (
 <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
 <Package className="w-8 h-8" />
 </div>
 )}
 <div className="flex-1">
 <h4 className="text-lg font-bold text-slate-900">{showPnLForProduct.name}</h4>
 <div className="flex items-center gap-3 mt-2">
 <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
 {showPnLForProduct.category || 'N/A'}
 </span>
 <span className="px-2.5 py-1 bg-slate-100 text-orange-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
 {showPnLForProduct.brand || 'No Brand'}
 </span>
 </div>
 </div>
 <button 
 onClick={saveProductPricing}
 className="px-6 py-2.5 bg-slate-900 text-[#FAF9F5] text-xs font-black rounded-lg hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5 uppercase tracking-widest"
 >
 Lưu thay đổi
 </button>
 </div>

 {/* Financial Metrics Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-4">
 <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
 <Sparkles className="w-3.5 h-3.5 text-orange-600" /> Cấu hình Giá & Chi phí gốc
 </h5>
 
 <div className="bg-slate-50 rounded-lg p-5 space-y-5 border border-slate-200">
 <div className="space-y-2">
 <div className="flex justify-between items-center px-1">
 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Giá bán lẻ (Retail)</span>
 </div>
 <input 
 type="number"
 value={pnlPrice}
 onChange={(e) => setPnlPrice(Number(e.target.value))}
 className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
 />
 </div>
 <div className="space-y-2">
 <div className="flex justify-between items-center px-1">
 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Giá vốn (COGS)</span>
 </div>
 <input 
 type="number"
 value={pnlCostPrice}
 onChange={(e) => setPnlCostPrice(Number(e.target.value))}
 className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
 />
 </div>
 <div className="space-y-2">
 <div className="flex justify-between items-center px-1">
 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chi phí ẩn (Hidden Cost)</span>
 <span title="Chi phí bao bì, tem nhãn, quà tặng kèm..."><Info className="w-3 h-3 text-slate-500" /></span>
 </div>
 <input 
 type="number"
 value={pnlHiddenCosts}
 onChange={(e) => setPnlHiddenCosts(Number(e.target.value))}
 className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:ring-2 focus:ring-orange-600/20 focus:outline-none"
 />
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
 <Zap className="w-3.5 h-3.5 text-amber-500" /> Hệ sinh thái phí sàn
 </h5>
 
 <div className="bg-white rounded-lg p-5 space-y-4 border border-slate-300 shadow-sm">
 {/* Mandatory Fees */}
 <div className="flex justify-between items-center p-3 bg-red-50/50 rounded-lg border border-red-100">
 <div>
 <p className="text-[11px] font-black text-slate-800">Phí cố định & Thanh toán</p>
 <p className="text-[9px] text-red-500 font-bold uppercase tracking-tight">Bắt buộc theo quy định sàn</p>
 </div>
 <div className="text-right">
 <p className="text-xs font-mono font-bold text-red-600">-{formatCurrency(pnlPrice * 0.07)}</p>
 <p className="text-[9px] text-slate-500 font-bold">~ 7% (5% CĐ + 2% TT)</p>
 </div>
 </div>

 {/* Optional Fees with Toggles */}
 <div className="space-y-3">
 <div className="flex justify-between items-center pb-2 border-b border-slate-200">
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setUseOptionalPlatformFees(!useOptionalPlatformFees)}
 className={cn("w-8 h-4 rounded-full relative transition-all", useOptionalPlatformFees ? "bg-emerald-500" : "bg-slate-300")}
 >
 <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", useOptionalPlatformFees ? "left-4.5" : "left-0.5")} />
 </button>
 <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Sử dụng chi phí tùy chọn</p>
 </div>
 <p className="text-xs font-mono font-bold text-slate-800">
 {useOptionalPlatformFees ? `-${formatCurrency(
 (pnlOptionalFees.serviceFee ? pnlPrice * 0.05 : 0) + 
 (pnlOptionalFees.adFee ? pnlPrice * 0.08 : 0) +
 (pnlOptionalFees.affiliateFee ? pnlPrice * 0.05 : 0)
 )}` : "0 VNĐ"}
 </p>
 </div>

 {useOptionalPlatformFees && (
 <div className="space-y-3">
 <div className={cn(
 "flex justify-between items-center p-3 rounded-lg border transition-all",
 pnlOptionalFees.serviceFee ? "bg-slate-100 border-slate-300" : "bg-slate-50 border-slate-200 grayscale opacity-60"
 )}>
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setPnlOptionalFees({...pnlOptionalFees, serviceFee: !pnlOptionalFees.serviceFee})}
 className={cn("w-8 h-4 rounded-full relative transition-all", pnlOptionalFees.serviceFee ? "bg-slate-900" : "bg-slate-300")}
 >
 <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", pnlOptionalFees.serviceFee ? "left-4.5" : "left-0.5")} />
 </button>
 <div>
 <p className="text-[11px] font-black text-slate-800">Gói dịch vụ (Freeship Xtra...)</p>
 <p className="text-[9px] text-orange-600 font-bold">Tùy chọn hiển thị</p>
 </div>
 </div>
 <p className="text-xs font-mono font-bold text-orange-700">
 -{formatCurrency(pnlOptionalFees.serviceFee ? pnlPrice * 0.05 : 0)}
 </p>
 </div>

 <div className={cn(
 "flex justify-between items-center p-3 rounded-lg border transition-all",
 pnlOptionalFees.adFee ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-200 grayscale opacity-60"
 )}>
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setPnlOptionalFees({...pnlOptionalFees, adFee: !pnlOptionalFees.adFee})}
 className={cn("w-8 h-4 rounded-full relative transition-all", pnlOptionalFees.adFee ? "bg-amber-600" : "bg-slate-300")}
 >
 <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", pnlOptionalFees.adFee ? "left-4.5" : "left-0.5")} />
 </button>
 <div>
 <p className="text-[11px] font-black text-slate-800">Quảng cáo & Marketing</p>
 <p className="text-[9px] text-amber-500 font-bold">Dự kiến chi trả</p>
 </div>
 </div>
 <p className="text-xs font-mono font-bold text-amber-600">
 -{formatCurrency(pnlOptionalFees.adFee ? pnlPrice * 0.08 : 0)}
 </p>
 </div>

 <div className={cn(
 "flex justify-between items-center p-3 rounded-lg border transition-all",
 pnlOptionalFees.affiliateFee ? "bg-purple-50 border-purple-100" : "bg-slate-50 border-slate-200 grayscale opacity-60"
 )}>
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setPnlOptionalFees({...pnlOptionalFees, affiliateFee: !pnlOptionalFees.affiliateFee})}
 className={cn("w-8 h-4 rounded-full relative transition-all", pnlOptionalFees.affiliateFee ? "bg-purple-600" : "bg-slate-300")}
 >
 <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", pnlOptionalFees.affiliateFee ? "left-4.5" : "left-0.5")} />
 </button>
 <div>
 <p className="text-[11px] font-black text-slate-800">Tiếp thị liên kết (Affiliate)</p>
 <p className="text-[9px] text-purple-500 font-bold">5% Giá bán</p>
 </div>
 </div>
 <p className="text-xs font-mono font-bold text-purple-600">
 -{formatCurrency(pnlOptionalFees.affiliateFee ? pnlPrice * 0.05 : 0)}
 </p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Net Profit Summary */}
 {(() => {
 const mandatoryFee = pnlPrice * 0.07;
 const serviceFee = (useOptionalPlatformFees && pnlOptionalFees.serviceFee) ? pnlPrice * 0.05 : 0;
 const adFee = (useOptionalPlatformFees && pnlOptionalFees.adFee) ? pnlPrice * 0.08 : 0;
 const affiliateFee = (useOptionalPlatformFees && pnlOptionalFees.affiliateFee) ? pnlPrice * 0.05 : 0;
 const totalFees = mandatoryFee + serviceFee + adFee + affiliateFee;
 const grossProfit = pnlPrice - pnlCostPrice - pnlHiddenCosts;
 const netProfit = grossProfit - totalFees;
 const netMargin = pnlPrice > 0 ? (netProfit / pnlPrice) * 100 : 0;

 return (
 <div className="bg-slate-900 rounded-lg p-8 text-[#FAF9F5] relative overflow-hidden flex items-center justify-between shadow-sm shadow-blue-900/20">
 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20" />
 <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl -translate-x-10 translate-y-10" />
 
 <div className="relative z-10 space-y-2">
 <div className="flex items-center gap-2">
 <h5 className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em]">Lợi nhuận ròng thực tế (Actual Net Profit)</h5>
 <div className="px-2 py-0.5 bg-blue-400/30 rounded-full text-[9px] font-black uppercase">Real-time update</div>
 </div>
 <div className="flex items-end gap-3">
 <span className="text-4xl font-black tracking-tight font-mono">
 {formatCurrency(netProfit)}
 </span>
 <span className="text-sm font-bold text-blue-200 pb-2">
 / SP bán ra
 </span>
 </div>
 <p className="text-[10px] text-blue-300 font-medium">
 Tổng chi phí khấu trừ: {formatCurrency(totalFees + pnlCostPrice + pnlHiddenCosts)}
 </p>
 </div>

 <div className="relative z-10 text-right bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
 <div className="text-3xl font-black font-mono">
 {netMargin.toFixed(1)}%
 </div>
 <div className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-1">
 Net Profit Margin
 </div>
 </div>
 </div>
 );
 })()}
 
 <div className="flex items-start gap-3 p-5 bg-slate-50 rounded-xl border border-slate-200">
 <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
 <div className="space-y-1">
 <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Cơ chế tính toán ERP 2.0</p>
 <p className="text-[11px] text-slate-600 leading-relaxed">
 * Hệ thống tự động tính phí sàn theo các hạng mục được bật. <br />
 * <b>Chi phí ẩn</b> được cộng trực tiếp vào giá vốn để tính Gross Margin trước khi trừ phí sàn. <br />
 * Nhấn <b>Lưu thay đổi</b> để cập nhật dữ liệu giá và chi phí gốc vào hệ thống sản phẩm.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
