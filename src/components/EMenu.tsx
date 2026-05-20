import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
 ShoppingCart, 
 ChevronLeft, 
 Plus, 
 Minus, 
 CheckCircle2, 
 Timer, 
 Coffee, 
 Utensils, 
 Martini, 
 Cake,
 Search,
 X,
 CreditCard,
 QrCode,
 Info
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function EMenu() {
 const { tableId } = useParams();
 const [products, setProducts] = useState<any[]>([]);
 const [cart, setCart] = useState<{product: any, quantity: number}[]>([]);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedCategory, setSelectedCategory] = useState('All');
 const [orderStatus, setOrderStatus] = useState<'browsing' | 'submitting' | 'confirmed'>('browsing');
 const [lastOrderId, setLastOrderId] = useState<string | null>(null);

 useEffect(() => {
 const unsub = onSnapshot(collection(db, 'products'), (snap) => {
 setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 });
 return () => unsub();
 }, []);

 const categories = useMemo(() => {
 const cats = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
 return cats;
 }, [products]);

 const filteredProducts = useMemo(() => {
 return products.filter(p => {
 const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
 return matchesSearch && matchesCat;
 });
 }, [products, searchQuery, selectedCategory]);

 const addToCart = (product: any) => {
 setCart(prev => {
 const exists = prev.find(item => item.product.id === product.id);
 if (exists) {
 return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
 }
 return [...prev, { product, quantity: 1 }];
 });
 };

 const removeFromCart = (productId: string) => {
 setCart(prev => prev.map(item => {
 if (item.product.id === productId) {
 return { ...item, quantity: Math.max(0, item.quantity - 1) };
 }
 return item;
 }).filter(item => item.quantity > 0));
 };

 const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
 const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

 const handleSubmitOrder = async () => {
 if (cart.length === 0) return;
 setOrderStatus('submitting');
 try {
 const orderData = {
 tableId,
 source: 'emenu',
 status: 'pending',
 items: cart.map(item => ({
 productId: item.product.id,
 name: item.product.name,
 price: item.product.price,
 quantity: item.quantity
 })),
 total: cartTotal,
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 customerName: `Bàn ${tableId}`,
 paymentStatus: 'unpaid'
 };
 const docRef = await addDoc(collection(db, 'orders'), orderData);
 setLastOrderId(docRef.id);
 setOrderStatus('confirmed');
 setCart([]);
 } catch (error) {
 console.error("Error submitting order:", error);
 alert("Có lỗi xảy ra khi gọi món. Vui lòng thử lại!");
 setOrderStatus('browsing');
 }
 };

 if (orderStatus === 'confirmed') {
 return (
 <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
 <motion.div 
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 className="bg-white p-10 rounded-[32px] shadow-sm max-w-sm w-full space-y-6"
 >
 <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
 <CheckCircle2 className="w-10 h-10" />
 </div>
 <div className="space-y-2">
 <h2 className="text-2xl font-bold text-slate-900">Đặt món thành công!</h2>
 <p className="text-slate-600 text-sm">Đơn hàng của bạn tại <strong>Bàn {tableId}</strong> đã được gửi đến quầy. Nhân viên sẽ phục vụ bạn ngay!</p>
 </div>
 <div className="p-4 bg-slate-50 rounded-lg text-left space-y-2">
 <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
 <span>Mã đơn</span>
 <span>{lastOrderId?.slice(-6).toUpperCase()}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-slate-700">Trạng thái</span>
 <span className="text-primary-600 font-bold flex items-center gap-1"><Timer className="w-3 h-3" /> Chờ chuẩn bị</span>
 </div>
 </div>
 <button 
 onClick={() => setOrderStatus('browsing')}
 className="w-full py-4 bg-primary-600 text-[#FAF9F5] rounded-lg font-bold hover:bg-primary-700 transition-all shadow-sm shadow-indigo-600/20"
 >
 Quay lại Menu
 </button>
 </motion.div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-sm">
 {/* Header */}
 <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 py-6 border-b border-slate-200 flex items-center justify-between">
 <div className="flex flex-col">
 <h1 className="font-serif tracking-tight text-xs font-black text-primary-600 uppercase tracking-[0.2em]">E-Menu Experience</h1>
 <div className="flex items-center gap-2">
 <span className="text-xl font-bold text-slate-900 underline decoration-indigo-200 underline-offset-4">Bàn {tableId}</span>
 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
 </div>
 </div>
 <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
 <Info className="w-5 h-5" />
 </div>
 </header>

 {/* Categories Horizontal Scroll */}
 <div className="bg-white px-6 py-4 sticky top-[85px] z-20 border-b border-stone-50">
 <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 min-w-0">
 {categories.map(cat => (
 <button
 key={cat}
 onClick={() => setSelectedCategory(cat)}
 className={cn(
 "px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shadow-sm border",
 selectedCategory === cat 
 ? "bg-primary-600 text-[#FAF9F5] border-primary-600 scale-105" 
 : "bg-white text-slate-600 border-slate-200 hover:border-primary-200"
 )}
 >
 {cat === 'All' && 'Tất cả'}
 {cat === 'Đồ uống' && <span className="flex items-center gap-2"><Coffee className="w-3.5 h-3.5" /> Đồ uống</span>}
 {cat === 'Đồ ăn' && <span className="flex items-center gap-2"><Utensils className="w-3.5 h-3.5" /> Đồ ăn</span>}
 {cat !== 'All' && cat !== 'Đồ uống' && cat !== 'Đồ ăn' && cat}
 </button>
 ))}
 </div>
 </div>

 {/* Main Product List */}
 <main className="flex-1 px-6 py-6 space-y-6 pb-32">
 <div className="relative mb-8">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input 
 type="text" 
 placeholder="Tìm món ngon..." 
 className="w-full bg-white border border-slate-300 rounded-lg pl-12 pr-4 py-4 text-sm font-medium focus:outline-none focus:border-primary-500 transition-all shadow-sm"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>

 <div className="grid grid-cols-1 gap-6">
 {filteredProducts.map(product => {
 const cartItem = cart.find(item => item.product.id === product.id);
 return (
 <motion.div 
 layout
 key={product.id} 
 className="bg-white rounded-lg p-4 flex gap-4 border border-slate-200 shadow-sm hover:shadow-sm transition-shadow relative overflow-hidden"
 >
 <div className="w-24 h-24 bg-slate-50 rounded-lg flex-shrink-0 overflow-hidden border border-stone-50">
 <img 
 src={`https://picsum.photos/seed/${product.name}/200/200`} 
 alt={product.name} 
 className="w-full h-full object-cover"
 referrerPolicy="no-referrer"
 />
 </div>
 <div className="flex-1 flex flex-col justify-between py-1">
 <div>
 <h3 className="font-bold text-slate-900 leading-tight">{product.name}</h3>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{product.category}</p>
 </div>
 <div className="flex items-center justify-between">
 <span className="font-bold text-primary-600">{formatCurrency(product.price)}</span>
 
 <div className="flex items-center gap-3">
 {cartItem && cartItem.quantity > 0 ? (
 <>
 <button 
 onClick={() => removeFromCart(product.id)}
 className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 active:scale-90 transition-transform"
 >
 <Minus className="w-4 h-4" />
 </button>
 <span className="font-bold text-sm text-slate-900">{cartItem.quantity}</span>
 </>
 ) : null}
 <button 
 onClick={() => addToCart(product)}
 className="w-8 h-8 rounded-full bg-primary-600 text-[#FAF9F5] flex items-center justify-center active:scale-90 transition-transform shadow-sm shadow-indigo-600/20"
 >
 <Plus className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 </motion.div>
 );
 })}
 </div>
 </main>

 {/* Floating Bottom Cart Bar */}
 <AnimatePresence>
 {cartCount > 0 && (
 <motion.div 
 initial={{ y: 100 }}
 animate={{ y: 0 }}
 exit={{ y: 100 }}
 className="fixed bottom-6 left-6 right-6 z-40 bg-slate-900 rounded-[28px] p-4 flex items-center justify-between shadow-sm max-w-md mx-auto"
 >
 <div className="flex items-center gap-4 pl-2">
 <div className="relative">
 <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-[#FAF9F5] backdrop-blur-md">
 <ShoppingCart className="w-6 h-6" />
 </div>
 <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 text-[#FAF9F5] text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm">
 {cartCount}
 </span>
 </div>
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tổng tiền</span>
 <span className="text-lg font-bold text-[#FAF9F5]">{formatCurrency(cartTotal)}</span>
 </div>
 </div>
 
 <button 
 onClick={handleSubmitOrder}
 disabled={orderStatus === 'submitting'}
 className="bg-primary-600 text-[#FAF9F5] px-8 h-12 rounded-lg font-bold flex items-center gap-2 active:scale-95 transition-all shadow-sm shadow-indigo-600/30 disabled:opacity-50"
 >
 Đặt món ngay
 <ArrowRight className="w-4 h-4" />
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}

const ArrowRight = ({ className }: { className?: string }) => (
 <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
 </svg>
);
