import React, { useState } from 'react';
import { 
  Monitor, 
  ShoppingCart, 
  Search, 
  CreditCard, 
  QrCode, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Clock, 
  Tag, 
  History,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  ScanBarcode,
  Save,
  Undo2,
  RefreshCcw,
  BadgePercent,
  UserCheck,
  ChevronRight,
  Printer,
  X,
  Camera
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Html5QrcodeScanner } from 'html5-qrcode';

const MOCK_PRODUCTS = [
  { id: 'P001', name: 'Áo thun cơ bản', price: 150000, stock: 50, category: 'Top' },
  { id: 'P002', name: 'Quần Jeans đen', price: 450000, stock: 20, category: 'Bottom' },
  { id: 'P003', name: 'Giày sneaker', price: 850000, stock: 15, category: 'Shoes' },
  { id: 'P004', name: 'Mũ lưỡi trai', price: 120000, stock: 30, category: 'Acc' },
  { id: 'P005', name: 'Thắt lưng da', price: 320000, stock: 10, category: 'Acc' },
  { id: 'P006', name: 'Sơ mi trắng', price: 280000, stock: 25, category: 'Top' },
];

const MOCK_SALES_HISTORY = [
  { id: 'TX-1001', time: '09:30', items: 2, total: 600000, status: 'Completed' },
  { id: 'TX-1002', time: '10:15', items: 1, total: 450000, status: 'Completed' },
];

const MOCK_STAFF = [
  { id: 'ST-01', name: 'Trần Thị Mai', role: 'Sales' },
  { id: 'ST-02', name: 'Lê Văn Tám', role: 'Support' },
  { id: 'ST-03', name: 'Hoàng Anh', role: 'Sales' },
];

const MOCK_STORES = [
  { id: 'S1', name: 'CN Quận 1', stock: 12 },
  { id: 'S2', name: 'CN Quận 7', stock: 5 },
  { id: 'S3', name: 'CN Thủ Đức', stock: 0 },
];

export function IPosModule() {
  const [cart, setCart] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [activeTab, setActiveTab] = useState<'sales' | 'history' | 'lookup'>('sales');
  
  const [suspendedCarts, setSuspendedCarts] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(MOCK_STAFF[0]);
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedProductLookup, setSelectedProductLookup] = useState<any | null>(null);
  const [showShiftSummary, setShowShiftSummary] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | 'pos'>('cash');
  
  const scannerRef = React.useRef<Html5QrcodeScanner | null>(null);

  React.useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner(
        "pos-reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scanner.render((decodedText) => {
        if (decodedText) {
          const product = MOCK_PRODUCTS.find(p => p.id === decodedText);
          if (product) {
            addToCart(product);
          }
          scanner.clear();
          setIsScannerOpen(false);
        }
      }, () => {});

      scannerRef.current = scanner;
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [isScannerOpen]);

  const holdCart = () => {
    if (cart.length === 0) return;
    setSuspendedCarts([...suspendedCarts, { 
      id: `H-${Date.now()}`, 
      items: cart, 
      customer, 
      total, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }]);
    setCart([]);
    setCustomer(null);
  };

  const resumeCart = (heldCart: any) => {
    setCart(heldCart.items);
    setCustomer(heldCart.customer);
    setSuspendedCarts(suspendedCarts.filter(c => c.id !== heldCart.id));
  };

  const addToCart = (product: any) => {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      updateQuantity(product.id, 1);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = discountCode === 'GIAM10' ? subtotal * 0.1 : 0;
  const loyaltyPoints = customer ? Math.floor(subtotal / 10000) : 0;
  const total = subtotal - discount;

  const handleCheckout = () => {
    setShowPaymentModal(true);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Trình duyệt không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceHint("Đang nghe...");
    };

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      setVoiceHint(command);
      
      // Basic AI Command Logic
      if (command.includes('thêm') || command.includes('search')) {
        const query = command.replace('thêm', '').replace('search', '').trim();
        const found = MOCK_PRODUCTS.find(p => p.name.toLowerCase().includes(query));
        if (found) {
          addToCart(found);
          setVoiceHint(`Đã thêm: ${found.name}`);
        }
      } else if (command.includes('thanh toán') || command.includes('checkout')) {
        handleCheckout();
      } else if (command.includes('chốt ca') || command.includes('đóng ca')) {
        toggleShift();
      } else if (command.includes('tìm khách') || command.includes('khách hàng')) {
        mockSetCustomer();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setTimeout(() => setVoiceHint(null), 3000);
    };

    recognition.start();
  };

  const completeOrder = () => {
    // Mock completion logic
    setCart([]);
    setCustomer(null);
    setDiscountCode('');
    setOrderNote('');
    setShowPaymentModal(false);
    setActiveTab('history');
  };

  const toggleShift = () => {
    if (isShiftActive) {
      setShowShiftSummary(true);
    } else {
      setIsShiftActive(true);
    }
  };

  const confirmCloseShift = () => {
    setShowShiftSummary(false);
    setIsShiftActive(false);
    setCart([]);
  };

  const mockSetCustomer = () => {
    setCustomer({
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      tier: 'Gold',
      points: 1250,
      aiInsight: 'Ưa chuộng phong cách tối giản, nhạy cảm với Flash Sale.'
    });
  };

  if (!isShiftActive) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-slate-50/50">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Mở ca làm việc</h2>
            <p className="text-sm text-slate-500">Vui lòng kiểm tra tiền mặt đầu ca trước khi bắt đầu bán hàng.</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tiền mặt đầu ca (VND)</label>
              <input 
                type="text" 
                defaultValue="2,000,000" 
                className="w-full bg-transparent border-b-2 border-slate-200 focus:border-blue-500 py-2 text-xl font-bold outline-none"
              />
            </div>
          </div>
          <button 
            onClick={toggleShift}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20"
          >
            Bắt đầu ca làm việc
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full flex flex-col gap-6 animate-in fade-in duration-500 pb-8 relative",
      isDarkMode && "dark bg-[#0f172a] text-slate-100"
    )}>
      {/* Voice Assistant Overlay */}
      {isListening && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] bg-indigo-600 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-bounce">
           <div className="w-2 h-2 bg-white rounded-full animate-ping" />
           <span className="text-xs font-bold uppercase tracking-widest">Đang nghe...</span>
        </div>
      )}

      {voiceHint && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[300] bg-slate-900/90 text-white px-8 py-4 rounded-2xl flex flex-col items-center gap-2 shadow-2xl border border-white/10 backdrop-blur-md">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Khẩu lệnh nhận diện</p>
           <p className="text-lg font-bold">"{voiceHint}"</p>
        </div>
      )}
      {/* Shift Summary Modal */}
      {showShiftSummary && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl p-10 w-full max-w-lg space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Báo cáo chốt ca</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Hà Nội • Terminal #01</p>
                </div>
              </div>
              <button onClick={() => setShowShiftSummary(false)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-slate-900 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 rounded-xl space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tiền mặt đầu ca</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(2000000)}</p>
              </div>
              <div className="p-5 bg-indigo-50 rounded-xl space-y-1 border border-indigo-100">
                <p className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Doanh thu trong ca</p>
                <p className="text-lg font-bold text-indigo-700">{formatCurrency(12500000)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-bold text-slate-900 tracking-widest flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Thống kê thanh toán
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Tiền mặt (Cash)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(4500000)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">QR / Chuyển khoản</span>
                  <span className="font-bold text-slate-900">{formatCurrency(6000000)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Thẻ (POS/Visa)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(2000000)}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setShowShiftSummary(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Tiếp tục bán
              </button>
              <button 
                onClick={confirmCloseShift}
                className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all"
              >
                Kết thúc ca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout/Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex shadow-2xl animate-in zoom-in-95 duration-300">
             {/* Left side: Order Summary */}
             <div className="w-1/3 bg-slate-50 p-10 border-r border-slate-100 overflow-y-auto">
                <h3 className="text-xl font-bold text-slate-900 mb-8">Tóm tắt đơn hàng</h3>
                <div className="space-y-6">
                   {cart.map(item => (
                     <div key={item.id} className="flex justify-between gap-4">
                        <div className="flex-1">
                           <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
                           <p className="text-[10px] text-slate-400 font-bold">SL: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                     </div>
                   ))}
                </div>
                <div className="mt-10 pt-10 border-t border-slate-200 space-y-4">
                   <div className="flex justify-between text-slate-500 text-sm">
                      <span>Tạm tính</span>
                      <span>{formatCurrency(subtotal)}</span>
                   </div>
                   {discount > 0 && (
                     <div className="flex justify-between text-rose-500 text-sm font-bold">
                        <span>Giảm giá</span>
                        <span>-{formatCurrency(discount)}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-indigo-600 font-black text-xl pt-4 border-t border-slate-200">
                      <span>Tổng tiền</span>
                      <span>{formatCurrency(total)}</span>
                   </div>
                </div>
             </div>

             {/* Right side: Payment Methods */}
             <div className="flex-1 p-10 flex flex-col gap-10">
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-bold text-slate-900">Chọn phương thức thanh toán</h3>
                   <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"><X /></button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                   <button 
                     onClick={() => setPaymentMethod('cash')}
                     className={cn(
                       "p-8 bg-white border-2 rounded-2xl flex flex-col items-center gap-4 transition-all",
                       paymentMethod === 'cash' ? "border-indigo-600 text-indigo-600 shadow-xl shadow-indigo-600/10 ring-4 ring-indigo-50" : "border-slate-100 text-slate-400 mt-2 hover:border-indigo-200"
                     )}
                   >
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                         <CreditCard className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-sm">Tiền mặt</span>
                   </button>
                   <button 
                     onClick={() => setPaymentMethod('qr')}
                     className={cn(
                       "p-8 bg-white border-2 rounded-2xl flex flex-col items-center gap-4 transition-all",
                       paymentMethod === 'qr' ? "border-indigo-600 text-indigo-600 shadow-xl shadow-indigo-600/10 ring-4 ring-indigo-50" : "border-slate-100 text-slate-400 mt-2 hover:border-indigo-200"
                     )}
                   >
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                         <QrCode className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-sm">Mobile QR</span>
                   </button>
                   <button 
                     onClick={() => setPaymentMethod('pos')}
                     className={cn(
                       "p-8 bg-white border-2 rounded-2xl flex flex-col items-center gap-4 transition-all",
                       paymentMethod === 'pos' ? "border-indigo-600 text-indigo-600 shadow-xl shadow-indigo-600/10 ring-4 ring-indigo-50" : "border-slate-100 text-slate-400 mt-2 hover:border-indigo-200"
                     )}
                   >
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                         <Monitor className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-sm">Thẻ / POS</span>
                   </button>
                </div>

                <div className="mt-auto space-y-6">
                   {paymentMethod === 'qr' && (
                     <div className="flex flex-col items-center gap-4 p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-indigo-200 animate-in fade-in zoom-in-95">
                        <div className="bg-white p-4 rounded-2xl shadow-xl">
                           <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=vietqr://payment?amount=${total}&msg=iPOS_TRX_${Date.now()}`}
                              alt="Payment QR"
                              className="w-48 h-48"
                              referrerPolicy="no-referrer"
                           />
                        </div>
                        <div className="text-center">
                           <p className="text-sm font-bold text-slate-900">Quét mã VietQR để thanh toán</p>
                           <p className="text-xs text-slate-500 mt-1">Hệ thống tự động xác nhận sau khi nhận tiền</p>
                        </div>
                     </div>
                   )}
                   
                   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tiền khách đưa (VND)</span>
                         <span className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">Gợi ý: {formatCurrency(Math.ceil(total/100000)*100000)}</span>
                      </div>
                      <input 
                        type="text" 
                        defaultValue={total.toString()}
                        className="w-full bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-xl py-5 px-6 text-3xl font-black text-slate-900 outline-none transition-all shadow-inner"
                      />
                   </div>

                   <button 
                     onClick={completeOrder}
                     className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xl uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                   >
                     <CheckCircle2 className="w-7 h-7" /> Hoàn tất đơn hàng
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-8 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white rounded-2xl p-8 w-full max-w-lg space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold">Quét mã sản phẩm</h2>
                 <button onClick={() => setIsScannerOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X /></button>
              </div>
              <div id="pos-reader" className="overflow-hidden rounded-xl border border-slate-200 shadow-inner"></div>
              <p className="text-center text-xs text-slate-500 font-bold uppercase tracking-wider">Đưa mã vạch vào vùng nhận diện</p>
           </div>
        </div>
      )}

      {/* Header with Shift Stats and Staff */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 relative">
                <Monitor className="w-6 h-6" />
                <div className={cn(
                  "absolute -top-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full shadow-sm",
                  isOffline ? "bg-rose-500" : "bg-emerald-500"
                )} />
             </div>
             <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">iPos Doanh nghiệp</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Thiết bị #01 • VN_HUB • {isOffline ? 'OFFLINE' : 'ONLINE'}</p>
             </div>
          </div>

          <div className="hidden lg:flex gap-6 border-l border-slate-100 pl-8">
             <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Nhân viên trực</p>
                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-[9px] font-bold text-emerald-600">
                      {selectedStaff.name.charAt(0)}
                   </div>
                   <select 
                      className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                      value={selectedStaff.id}
                      onChange={(e) => setSelectedStaff(MOCK_STAFF.find(s => s.id === e.target.id))}
                    >
                      {MOCK_STAFF.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
             </div>
             <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Doanh số ca</p>
                <p className="text-xs font-bold text-indigo-600">{formatCurrency(1050000)}</p>
             </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={startListening}
            className={cn(
              "p-3 rounded-xl transition-all shadow-lg active:scale-95",
              isListening ? "bg-rose-500 animate-pulse" : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 shadow-indigo-100/50"
            )}
          >
            <div className="relative">
               <Monitor className={cn("w-6 h-6", isListening && "text-white")} />
               {!isListening && (
                  <div className="absolute -top-1 -right-1 flex gap-0.5">
                     <span className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce" />
                     <span className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
               )}
            </div>
          </button>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-lg shadow-slate-100/50"
          >
             {isDarkMode ? <Sparkles className="w-6 h-6 text-amber-500" /> : <Monitor className="w-6 h-6" />}
          </button>

          <button 
            onClick={() => setActiveTab(activeTab === 'sales' ? 'history' : 'sales')}
            className={cn(
              "px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              activeTab === 'history' ? "bg-slate-900 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {activeTab === 'history' ? <ArrowRight className="w-4 h-4" /> : <History className="w-4 h-4" />}
            {activeTab === 'history' ? 'Bán hàng' : 'Nhật ký'}
          </button>
          
          <div className="w-px h-8 bg-slate-100 my-auto mx-1" />

          <button 
            onClick={toggleShift}
            className="bg-rose-50 text-rose-600 px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-rose-100 transition-all border border-rose-100 active:scale-95"
          >
            Chốt ca
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className={cn(
          "col-span-12 lg:col-span-7 flex flex-col gap-8 overflow-hidden",
          activeTab === 'history' ? "block" : "flex"
        )}>
          {activeTab === 'sales' ? (
            <>
              <div className="flex gap-4 shrink-0">
                {/* Product Search & Categories */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex-1">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Tìm sản phẩm (Tên, SKU)..." 
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => setIsScannerOpen(true)}
                      className="bg-indigo-600 text-white px-5 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                    >
                      <ScanBarcode className="w-5 h-5" />
                      <span className="font-bold text-xs hidden sm:inline">Quét</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex items-center transition-all overflow-hidden">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                    {['Tất cả', 'Top', 'Bottom', 'Shoes', 'Acc'].map(cat => (
                      <button key={cat} className="px-6 py-2.5 whitespace-nowrap bg-slate-50 hover:bg-white hover:border-indigo-200 border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-all active:scale-95">
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Grid (Spacious & Touch-Optimized) */}
              <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(product => (
                    <div 
                      key={product.id} 
                      className="aspect-[4/5] bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-indigo-500 hover:bg-white hover:shadow-xl transition-all text-left flex flex-col group relative overflow-hidden"
                    >
                      <button 
                        onClick={() => addToCart(product)}
                        className="absolute inset-0 z-0"
                      />
                      
                      <div className="relative z-10 flex flex-col h-full">
                         <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 uppercase tracking-wider shadow-sm">
                               {product.category}
                            </span>
                            {product.stock <= 10 && (
                               <span className="text-[8px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 uppercase tracking-wider animate-pulse">Sắp hết</span>
                            )}
                         </div>
                         
                         <h3 className="font-bold text-slate-800 leading-snug text-sm mb-1 line-clamp-2">{product.name}</h3>
                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-3"># {product.id}</p>
                         
                         <div className="mt-auto flex items-end justify-between gap-2">
                            <div className="space-y-1">
                               <div className={cn(
                                 "text-[9px] font-bold flex items-center gap-1",
                                 product.stock <= 10 ? "text-rose-600" : "text-emerald-600"
                               )}>
                                  <div className={cn("w-1 h-1 rounded-full", product.stock <= 10 ? "bg-rose-500" : "bg-emerald-500")} /> {product.stock} pcs
                               </div>
                               <p className="text-base font-bold text-slate-900 tracking-tight">{formatCurrency(product.price)}</p>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedProductLookup(product); setActiveTab('lookup'); }}
                              className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600 relative z-10"
                            >
                               <Search className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Suggestions Section (Upsell) */}
                {cart.length > 0 && (
                  <div className="mt-4 pt-10 border-t border-slate-100 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                          <BadgePercent className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">Gợi ý thông minh cho đơn hàng này</h4>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {MOCK_PRODUCTS.filter(p => !cart.find(ci => ci.id === p.id)).slice(0, 4).map(product => (
                        <div key={product.id} className="bg-indigo-50/50 border border-dashed border-indigo-200 rounded-2xl p-4 flex flex-col gap-3 group hover:bg-white hover:border-solid hover:border-indigo-500 hover:shadow-xl transition-all">
                          <p className="text-[10px] font-bold text-slate-800 line-clamp-1">{product.name}</p>
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-indigo-600">{formatCurrency(product.price)}</p>
                            <button 
                              onClick={() => addToCart(product)}
                              className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'lookup' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 flex-1 animate-in slide-in-from-left-4">
               <button onClick={() => setActiveTab('sales')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 mb-6 transition-colors">
                  <Undo2 className="w-4 h-4" /> Quay lại
               </button>
               
               {selectedProductLookup && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
                       <Monitor className="w-24 h-24 text-slate-200" />
                       <div className="absolute top-6 left-6 bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg">In Stock</div>
                    </div>
                    <div className="space-y-8">
                       <div className="flex justify-between items-start">
                          <div>
                             <h2 className="text-3xl font-bold text-slate-900 mb-1 leading-tight">{selectedProductLookup.name}</h2>
                             <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{selectedProductLookup.id}</p>
                          </div>
                          <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                             <RefreshCcw className="w-4 h-4" /> Đặt giữ hàng
                          </button>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-6">
                          <div className="p-5 bg-slate-50 rounded-xl space-y-1">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Giá bán</p>
                             <p className="text-xl font-bold text-slate-900">{formatCurrency(selectedProductLookup.price)}</p>
                          </div>
                          <div className="p-5 bg-emerald-50 rounded-xl space-y-1 border border-emerald-100">
                             <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Tồn kho hệ thống</p>
                             <p className="text-xl font-bold text-emerald-600">{MOCK_STORES.reduce((a,b) => a+b.stock, 0)}</p>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-900 flex items-center gap-2">
                             <RefreshCcw className="w-3.5 h-3.5 text-indigo-600" /> Liên chi nhánh
                          </h4>
                          <div className="space-y-2">
                             {MOCK_STORES.map(store => (
                               <div key={store.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-200 transition-all">
                                  <span className="text-sm font-medium text-slate-700">{store.name}</span>
                                  <span className={cn(
                                    "font-bold text-xs",
                                    store.stock > 0 ? "text-indigo-600" : "text-slate-300"
                                  )}>{store.stock > 0 ? `${store.stock} sp` : 'Hết hàng'}</span>
                               </div>
                             ))}
                          </div>
                       </div>

                       <button 
                         onClick={() => { addToCart(selectedProductLookup); setActiveTab('sales'); }}
                         className="w-full py-5 bg-indigo-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
                       >
                         Thêm vào đơn hàng
                       </button>
                    </div>
                 </div>
               )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 overflow-y-auto">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-base">
                <History className="w-5 h-5 text-indigo-600" /> Nhật ký đơn hàng
              </h3>
              <div className="space-y-3">
                {MOCK_SALES_HISTORY.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-lg hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-5">
                       <div className="w-10 h-10 bg-white rounded-lg shadow-inner flex items-center justify-center font-bold text-xs">{tx.time}</div>
                       <div>
                          <p className="font-bold text-slate-900 text-base">{tx.id}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{tx.items} sản phẩm • {tx.status}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <p className="font-bold text-slate-900 text-lg">{formatCurrency(tx.total)}</p>
                          <button className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1 justify-end">
                             <Printer className="w-3 h-3" /> In biên lai
                          </button>
                       </div>
                       <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart/Checkout Sidebar (Redesigned for touch) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6 overflow-hidden">
          {/* Suspended Carts (Hold/Resume) */}
          {suspendedCarts.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
               {suspendedCarts.map(sc => (
                  <button 
                    key={sc.id}
                    onClick={() => resumeCart(sc)}
                    className="shrink-0 px-5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 hover:bg-amber-100 transition-all active:scale-95 shadow-sm"
                  >
                     <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Đơn treo</span>
                     <span className="text-xs font-bold text-amber-900">{sc.time}</span>
                  </button>
               ))}
            </div>
          )}

          {/* Customer Selection (Loyalty) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative group overflow-hidden">
            {customer ? (
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shadow-md shadow-amber-200">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <p className="font-bold text-slate-900 text-base leading-none">{customer.name}</p>
                       <span className="text-[9px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded uppercase">{customer.tier}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-1">{customer.phone}</p>
                    <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex gap-2 animate-in slide-in-from-top-2">
                       <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                       <div>
                          <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">AI Insights</p>
                          <p className="text-[10px] text-indigo-800 font-medium leading-tight mt-1">{customer.aiInsight}</p>
                       </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setCustomer(null)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={mockSetCustomer}
                className="w-full flex items-center gap-4 p-1 group"
              >
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all border-2 border-dashed border-slate-200">
                  <Plus className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm">Tìm khách hàng</p>
                  <p className="text-xs text-slate-400 font-medium tracking-tight">Quét Loyalty / Số điện thoại</p>
                </div>
              </button>
            )}
          </div>

          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Giỏ hàng</h3>
                    <p className="text-[9px] text-slate-400 font-bold">{cart.reduce((a, b) => a + b.quantity, 0)} sản phẩm</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={holdCart} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-indigo-600 transition-all shadow-sm">
                    <Save className="w-4 h-4" />
                 </button>
                 <button onClick={() => { setCart([]); setCustomer(null); setIsReturnMode(false); }} className="p-2.5 bg-white border border-slate-200 text-rose-400 rounded-lg hover:bg-rose-50 transition-all shadow-sm">
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
            
            {/* Mode Switcher */}
            <div className="flex p-1 bg-slate-100 mx-6 mt-4 rounded-xl shrink-0">
               <button 
                onClick={() => { setIsReturnMode(false); setReturnReason(''); }}
                className={cn("flex-1 py-2.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all", !isReturnMode ? "bg-white text-indigo-600 shadow-md" : "text-slate-500 hover:text-slate-700")}
               >Bán hàng</button>
               <button 
                onClick={() => setIsReturnMode(true)}
                className={cn("flex-1 py-2.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all", isReturnMode ? "bg-rose-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700")}
               >Đổi trả</button>
            </div>

            {isReturnMode && (
               <div className="px-6 mt-4 animate-in slide-in-from-top-2">
                  <select 
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-xs font-bold text-rose-600 outline-none focus:ring-2 ring-rose-200 transition-all cursor-pointer"
                  >
                     <option value="">-- Chọn lý do đổi trả --</option>
                     <option value="defective">Sản phẩm lỗi/hỏng</option>
                     <option value="wrong_size">Nhầm kích cỡ</option>
                     <option value="not_expected">Không ưng ý</option>
                     <option value="warranty">Bảo hành</option>
                  </select>
               </div>
            )}

            <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center animate-in slide-in-from-right-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 relative group overflow-hidden shadow-sm hover:shadow-md transition-all">
                  {isReturnMode && <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />}
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-slate-900 text-sm leading-tight mb-1">{item.name}</p>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{formatCurrency(item.price)}</p>
                    <div className="flex items-center gap-6 mt-4">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 hover:border-indigo-500 transition-all active:scale-90"
                      >
                        <Minus className="w-4 h-4 text-slate-600" />
                      </button>
                      <span className="text-base font-bold w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 hover:border-indigo-500 transition-all active:scale-90"
                      >
                        <Plus className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-5">
                    <p className="font-bold text-slate-900 text-base">{formatCurrency(item.price * item.quantity)}</p>
                    <button onClick={() => removeFromCart(item.id)} className="p-3 bg-white text-slate-300 hover:text-rose-500 hover:shadow-md rounded-xl transition-all border border-slate-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {cart.length > 0 && (
                <div className="px-1 py-2">
                   <textarea 
                    placeholder="Ghi chú đơn hàng (VD: Giao sau 5h...)"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all custom-scrollbar resize-none h-24 shadow-inner"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                   />
                </div>
              )}
              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-5 py-12">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100">
                      <ShoppingCart className="w-10 h-10" />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Giỏ hàng trống</p>
                      <p className="text-[10px] text-slate-400 mt-2 max-w-[160px] mx-auto">Vui lòng chọn sản phẩm để thanh toán</p>
                   </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-200 space-y-5">
              {/* Promotion UI */}
              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                 <div className="flex items-center gap-2">
                    <BadgePercent className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Ưu đãi / Mã giảm</span>
                 </div>
                 <button onClick={() => setDiscountCode(discountCode ? '' : 'GIAM10')} className={cn(
                    "px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                    discountCode ? "bg-indigo-600 text-white shadow-md" : "bg-slate-100 text-slate-400 hover:text-slate-600"
                 )}>
                    {discountCode ? 'Hủy' : 'Áp dụng'}
                 </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tạm tính</span>
                  <span className="text-sm font-bold text-slate-700">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-rose-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Coupon (10%)</span>
                    <span className="text-sm font-bold">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-4 border-y border-slate-200 gap-4">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-[0.1em] whitespace-nowrap">Tổng thanh toán</span>
                  <span className={cn(
                    "text-2xl font-black tracking-tight truncate",
                    isReturnMode ? "text-rose-600" : "text-indigo-600"
                  )}>{isReturnMode ? '-' : ''}{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="py-4 bg-white border border-slate-200 hover:border-indigo-600 rounded-xl font-bold flex flex-col items-center justify-center gap-1.5 transition-all group active:scale-95 shadow-sm">
                  <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                  <span className="text-[9px] uppercase text-slate-500 font-bold tracking-widest group-hover:text-slate-900">Thẻ / POS</span>
                </button>
                <button className="py-4 bg-white border border-slate-200 hover:border-indigo-600 rounded-xl font-bold flex flex-col items-center justify-center gap-1.5 transition-all group active:scale-95 shadow-sm">
                  <QrCode className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                  <span className="text-[9px] uppercase text-slate-500 font-bold tracking-widest group-hover:text-slate-900">Chuyển QR</span>
                </button>
              </div>

              <button 
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className={cn(
                  "w-full py-6 text-white font-bold rounded-xl transition-all shadow-lg text-sm uppercase tracking-[0.2em] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3",
                  isReturnMode ? "bg-rose-600 shadow-rose-600/20 hover:bg-rose-700" : "bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700"
                )}
              >
                {isReturnMode ? <RefreshCcw className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                {isReturnMode ? 'Xác nhận Đổi trả' : 'Thanh toán (F9)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
