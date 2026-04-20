import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Monitor, 
  ShoppingCart, 
  Search, 
  CreditCard, 
  QrCode, 
  Store,
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Clock, 
  Tag, 
  History,
  Building2,
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
  Camera,
  Sparkles,
  Grid3x3,
  Coffee
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db, serverTimestamp, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { sePayService } from '../services/sepayService';

import { StoreSelector } from './StoreSelector';

export function IPosModule() {
  const { user } = useAuth();
  const { activeStore } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [activeTab, setActiveTab] = useState<'sales' | 'history' | 'lookup'>('sales');
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  
  const [suspendedCarts, setSuspendedCarts] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | 'pos' | 'loyalty'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTableForQr, setSelectedTableForQr] = useState<number | null>(null);
  const [pendingEMenuOrders, setPendingEMenuOrders] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'orders'), where('source', '==', 'emenu'), where('status', '==', 'pending')),
      (snap) => {
        setPendingEMenuOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );
    return () => unsub();
  }, []);
  
  const calculateLoyaltyPayment = () => {
    if (!customer) return 0;
    // 1 point = 1 VND discount
    return Math.min(total, customer.points || 0);
  };
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  // State cho Bàn giao ca
  const [pendingHandover, setPendingHandover] = useState<any>(null);
  const [actualCashInput, setActualCashInput] = useState('6500000');
  const [handoverNote, setHandoverNote] = useState('');

  const searchCustomers = async (val: string) => {
    setCustomerSearchQuery(val);
    if (val.length < 3) {
      setCustomerSearchResults([]);
      return;
    }
    try {
      const q = query(
        collection(db, 'customers'), 
        where('phone', '==', val)
      );
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomerSearchResults(results);
    } catch (error) {
      console.error("Error searching customers:", error);
    }
  };
  
  const scannerRef = React.useRef<Html5QrcodeScanner | null>(null);

  // Real-time products
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      if (data.length === 0) seedDemoProducts();
    });
    return () => unsub();
  }, []);
  
  const seedDemoProducts = async () => {
    console.log("Seeding demo products...");
    const demoItems = [
      { name: 'Cafe Phin Sữa Đá', price: 35000, category: 'Đồ uống' },
      { name: 'Trà Đào Cam Sả', price: 45000, category: 'Đồ uống' },
      { name: 'Bánh Mì Thập Cẩm', price: 25000, category: 'Đồ ăn' },
      { name: 'Phở Bò Đặc Biệt', price: 65000, category: 'Đồ ăn' }
    ];
    for (const item of demoItems) {
      await addDoc(collection(db, 'products'), item);
    }
  };

  // Real-time order history for this user
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('staffId', '==', user.uid), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        time: doc.data().createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...'
      }));
      setOrderHistory(data);
    });
    return () => unsub();
  }, [user]);

  React.useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner(
        "pos-reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scanner.render((decodedText) => {
        if (decodedText) {
          const product = products.find(p => p.id === decodedText || p.sku === decodedText);
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
  }, [isScannerOpen, products]);

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
  
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  const calculateLoyaltyDiscount = () => {
     if (!customer || !useLoyaltyPoints) return 0;
     // Allow using up to max available points, 1 point = 1 VND
     return Math.min(subtotal - discount, customer.points || 0);
  };
  
  const loyaltyDiscount = calculateLoyaltyDiscount();
  const total = Math.max(0, subtotal - discount - loyaltyDiscount);

  const handleCheckout = () => {
    setShowPaymentModal(true);
  };

  const handlePrintProforma = () => {
    window.print();
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
        const found = products.find(p => p.name.toLowerCase().includes(query));
        if (found) {
          addToCart(found);
          setVoiceHint(`Đã thêm: ${found.name}`);
        }
      } else if (command.includes('thanh toán') || command.includes('checkout')) {
        handleCheckout();
      } else if (command.includes('chốt ca') || command.includes('đóng ca')) {
        toggleShift();
      } else if (command.includes('tìm khách') || command.includes('khách hàng')) {
        setShowCustomerSearch(true);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setTimeout(() => setVoiceHint(null), 3000);
    };

    recognition.start();
  };

  const handleDeclineOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error declining order:", error);
    }
  };

  const handleProcessEMenuOrder = (order: any) => {
    // Fill cart with order items
    const newCart = order.items.map((item: any) => ({
      id: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    setCart(newCart);
    setOrderNote(`Đơn từ Bàn ${order.tableId}`);
    // If we have a way to set tableId in Sales, we should do it.
    // For now, note is enough.
    setActiveTab('sales');
    // We'll mark the original eMenu order as 'processing' so it doesn't show up again
    updateDoc(doc(db, 'orders', order.id), {
      status: 'processing',
      staffId: user?.uid,
      updatedAt: serverTimestamp()
    });
  };

  const completeOrder = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const orderData = {
        staffId: user.uid,
        customerName: customer?.name || 'Khách lẻ',
        customerId: customer?.id || null,
        items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        subtotal,
        discount,
        loyaltyDiscount,
        total,
        status: 'completed',
        paymentMethod: total === 0 ? 'loyalty_full' : paymentMethod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);

      // Trigger SePay SoundBox if payment was successful (simulated)
      if (paymentMethod === 'qr' || paymentMethod === 'pos') {
        try {
          await sePayService.triggerSoundBox(total, `Thanh toán đơn hàng iPos`, 'BOX-001');
        } catch (err) {
          console.warn("SoundBox trigger failed:", err);
        }
      }

      // Create eInvoice if requested (simulated flag)
      try {
        await sePayService.createInvoice({
          customer_name: customer?.name || 'Khách lẻ',
          amount: total,
          items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
          order_id: `ORD-${Date.now()}`
        });
      } catch (err) {
        console.warn("eInvoice creation failed:", err);
      }

      // Create finance transaction
      if (total > 0) {
         await addDoc(collection(db, 'transactions'), {
           type: 'income',
           amount: total,
           category: 'Bán lẻ iPOS',
           description: `Đơn hàng iPOS ${customer?.name || 'Khách lẻ'} - TT Bằng ${paymentMethod}`,
           createdAt: serverTimestamp()
         });
      }

      // Update inventory (simplified)
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        const currentStock = products.find(p => p.id === item.id)?.stock || 0;
        await updateDoc(productRef, {
          stock: Math.max(0, currentStock - item.quantity),
          updatedAt: serverTimestamp()
        });
      }

      // Update customer loyalty points and last purchase
      if (customer && customer.id) {
        const customerRef = doc(db, 'customers', customer.id);
        let updatedPoints = customer.points || 0;
        
        if (useLoyaltyPoints) {
           updatedPoints = Math.max(0, updatedPoints - loyaltyDiscount);
        }
        
        if (total > 0) {
           const earnedPoints = Math.floor(total / 100); // 1 point per 100 VND (1%)
           updatedPoints += earnedPoints;
        }

        await updateDoc(customerRef, {
          points: updatedPoints,
          lastPurchase: new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
        });
      }

      setCart([]);
      setCustomer(null);
      setDiscountCode('');
      setOrderNote('');
      setUseLoyaltyPoints(false);
      setShowPaymentModal(false);
      setActiveTab('history');
    } catch (error) {
      handleFirestoreError(error, 'create', 'orders');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleShift = () => {
    if (isShiftActive) {
      // Show handover summary
      setActualCashInput('6500000');
      setHandoverNote('');
      setShowShiftSummary(true);
    } else {
      setIsShiftActive(true);
    }
  };

  const confirmCloseShift = async () => {
    const handoverData = {
      expectedCash: 6500000,
      actualCash: parseInt(actualCashInput.replace(/\D/g, '')) || 0,
      discrepancy: (parseInt(actualCashInput.replace(/\D/g, '')) || 0) - 6500000,
      notes: handoverNote,
      previousStaffName: selectedStaff?.name || user?.displayName || 'Nhân viên ca trước',
      createdAt: serverTimestamp(),
      staffId: user?.uid
    };

    setPendingHandover(handoverData as any);
    setShowShiftSummary(false);
    setIsShiftActive(false);
    setCart([]);
    
    try {
       await addDoc(collection(db, 'shifts'), handoverData);
    } catch(err) {
       console.error("Failed to log shift:", err);
    }
  };

  if (!activeStore) {
     return <StoreSelector />;
  }

  if (!isShiftActive) {
    if (pendingHandover) {
      return (
        <div className="h-full flex items-center justify-center p-8 bg-slate-50/50">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-10 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Nhận bàn giao ca</h2>
              <p className="text-sm text-slate-500">Ca trước: <span className="font-bold text-slate-700">{pendingHandover.previousStaffName}</span></p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 text-sm">
                <span className="font-bold text-slate-500 uppercase">Khai báo ca trước</span>
                <span className="font-bold text-slate-900">{formatCurrency(pendingHandover.actualCash)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 text-sm">
                <span className="font-bold text-slate-500 uppercase">Đối soát hệ thống (Lệch)</span>
                <span className={cn("font-bold", pendingHandover.discrepancy === 0 ? "text-emerald-600" : "text-rose-600")}>
                  {pendingHandover.discrepancy >= 0 && pendingHandover.discrepancy !== 0 ? '+' : ''}{formatCurrency(pendingHandover.discrepancy)}
                </span>
              </div>
              <div className="space-y-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ghi chú bàn giao</span>
                 <p className="text-sm text-slate-700 italic bg-white p-3 rounded-lg border border-slate-200">{pendingHandover.notes || 'Không có ghi chú'}</p>
              </div>
            </div>

            <button 
              onClick={() => {
                setPendingHandover(null);
                setIsShiftActive(true);
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
            >
              Xác nhận nhận ca & Bắt đầu
            </button>
          </div>
        </div>
      );
    }

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

            <div className="space-y-3 pt-4 border-t border-slate-100">
               <h4 className="text-[10px] uppercase font-bold text-slate-900 tracking-widest flex items-center gap-2">
                 <UserCheck className="w-4 h-4 text-rose-500" /> Khai báo & Bàn giao Két tiền mặt
               </h4>
               <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                     <label className="text-[10px] uppercase font-bold text-slate-400">Tiền mặt lý thuyết (Hệ thống)</label>
                     <div className="text-sm font-bold text-slate-900 px-3 py-2.5 bg-slate-100 rounded-lg">{formatCurrency(6500000)}</div>
                  </div>
                  <div className="flex-1 space-y-1">
                     <label className="text-[10px] uppercase font-bold text-slate-400">Thực đếm trong két</label>
                     <input 
                        type="text" 
                        value={actualCashInput}
                        onChange={(e) => setActualCashInput(e.target.value)}
                        className="w-full text-sm font-bold text-indigo-600 px-3 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all shadow-inner"
                     />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Ghi chú bàn giao</label>
                  <textarea 
                     value={handoverNote}
                     onChange={(e) => setHandoverNote(e.target.value)}
                     className="w-full text-xs text-slate-700 px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all resize-none h-16"
                     placeholder="VD: Cọc thừa 50k của khách, Lệch 20k do thối nhầm..."
                  />
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
                Xác nhận Bàn giao & Đóng ca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout/Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-8 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
             {/* Left side: Order Summary */}
             <div className="w-full md:w-1/3 bg-slate-50 p-6 sm:p-10 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100">
                      <ShoppingCart className="w-5 h-5 text-indigo-600" />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Chi tiết đơn</h3>
                </div>
                
                <div className="space-y-5">
                   {cart.map(item => (
                     <div key={item.id} className="flex justify-between gap-4 animate-in fade-in slide-in-from-left-2 transition-all">
                        <div className="flex-1">
                           <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">x{item.quantity} • {formatCurrency(item.price)}</p>
                        </div>
                        <p className="text-sm font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                     </div>
                   ))}
                </div>

                <div className="mt-10 pt-10 border-t border-slate-200 space-y-4">
                   <div className="flex justify-between text-slate-500 text-sm font-medium">
                      <span>Tạm tính</span>
                      <span>{formatCurrency(subtotal)}</span>
                   </div>
                   
                   {/* Discount Breakdown */}
                   {(discount > 0 || loyaltyDiscount > 0) && (
                     <div className="space-y-2 py-4 bg-white/50 rounded-2xl p-4 border border-slate-100 border-dashed">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ưu đãi & Giảm giá</p>
                        {discount > 0 && (
                          <div className="flex justify-between text-rose-500 text-sm font-bold">
                             <div className="flex items-center gap-2">
                                <BadgePercent className="w-3.5 h-3.5" />
                                <span>Mã giảm giá (10%)</span>
                             </div>
                             <span>-{formatCurrency(discount)}</span>
                          </div>
                        )}
                        {loyaltyDiscount > 0 && (
                          <div className="flex justify-between text-emerald-600 text-sm font-bold">
                             <div className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Điểm Loyalty</span>
                             </div>
                             <span>-{formatCurrency(loyaltyDiscount)}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-100 flex justify-between">
                           <span className="text-[10px] font-bold text-slate-500">Tiết kiệm được</span>
                           <span className="text-xs font-black text-emerald-600">{formatCurrency(discount + loyaltyDiscount)}</span>
                        </div>
                     </div>
                   )}

                   <div className="flex justify-between text-indigo-600 font-black text-2xl pt-6 border-t-2 border-indigo-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cần thanh toán</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Right side: Payment Methods */}
             <div className="flex-1 p-6 sm:p-10 flex flex-col gap-8 bg-white overflow-y-auto">
                <div className="flex justify-between items-center">
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Chọn phương thức</h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">Đảm bảo thanh toán an toàn & bảo mật</p>
                   </div>
                   <button 
                     onClick={() => setShowPaymentModal(false)} 
                     className="w-12 h-12 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-2xl text-slate-400 transition-all flex items-center justify-center border border-slate-100"
                   >
                     <X className="w-6 h-6" />
                   </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <button 
                     onClick={() => setPaymentMethod('cash')}
                     className={cn(
                       "p-6 bg-white border-2 rounded-[1.5rem] flex flex-col items-center gap-4 transition-all group relative overflow-hidden",
                       paymentMethod === 'cash' 
                         ? "border-indigo-600 ring-4 ring-indigo-50 shadow-xl shadow-indigo-600/10" 
                         : "border-slate-100 hover:border-indigo-200"
                     )}
                   >
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                        paymentMethod === 'cash' ? "bg-indigo-600 text-white scale-110 shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      )}>
                         <CreditCard className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                         <span className={cn("block font-black text-[11px] uppercase tracking-wider", paymentMethod === 'cash' ? "text-indigo-600" : "text-slate-500")}>Tiền mặt</span>
                         <span className="text-[9px] text-slate-400 font-bold">(Cash/COD)</span>
                      </div>
                      {paymentMethod === 'cash' && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />}
                   </button>

                   <button 
                     onClick={() => setPaymentMethod('qr')}
                     className={cn(
                       "p-6 bg-white border-2 rounded-[1.5rem] flex flex-col items-center gap-4 transition-all group relative overflow-hidden",
                       paymentMethod === 'qr' 
                        ? "border-indigo-600 ring-4 ring-indigo-50 shadow-xl shadow-indigo-600/10" 
                        : "border-slate-100 hover:border-indigo-200"
                     )}
                   >
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                        paymentMethod === 'qr' ? "bg-indigo-600 text-white scale-110 shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      )}>
                         <QrCode className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                         <span className={cn("block font-black text-[11px] uppercase tracking-wider", paymentMethod === 'qr' ? "text-indigo-600" : "text-slate-500")}>Chuyển QR</span>
                         <span className="text-[9px] text-slate-400 font-bold">(VietQR/Bank)</span>
                      </div>
                      {paymentMethod === 'qr' && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />}
                   </button>

                   <button 
                     onClick={() => setPaymentMethod('pos')}
                     className={cn(
                       "p-6 bg-white border-2 rounded-[1.5rem] flex flex-col items-center gap-4 transition-all group relative overflow-hidden",
                       paymentMethod === 'pos' 
                        ? "border-indigo-600 ring-4 ring-indigo-50 shadow-xl shadow-indigo-600/10" 
                        : "border-slate-100 hover:border-indigo-200"
                     )}
                   >
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                        paymentMethod === 'pos' ? "bg-indigo-600 text-white scale-110 shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      )}>
                         <Monitor className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                         <span className={cn("block font-black text-[11px] uppercase tracking-wider", paymentMethod === 'pos' ? "text-indigo-600" : "text-slate-500")}>Thẻ / POS</span>
                         <span className="text-[9px] text-slate-400 font-bold">(VISA/Master)</span>
                      </div>
                      {paymentMethod === 'pos' && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />}
                   </button>
                </div>

                <div className="mt-2 space-y-6">
                   {/* Loyalty Reward Integration */}
                   {customer && (customer.points || 0) > 0 && (
                      <div 
                        className={cn(
                          "group p-5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between",
                          useLoyaltyPoints 
                            ? "bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/5 ring-4 ring-emerald-50" 
                            : "bg-white border-slate-100 hover:border-emerald-200"
                        )} 
                        onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                      >
                         <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                              useLoyaltyPoints ? "bg-emerald-600 text-white shadow-md rotate-12" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                            )}>
                               <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Thanh toán bằng Điểm Loyalty</p>
                               <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                                 Sẵn có: <span className="text-emerald-600">{(customer.points || 0).toLocaleString()} điểm</span> 
                                 <span className="mx-2 opacity-30">•</span> 
                                 Khả dụng: <span className="text-indigo-600">{formatCurrency(Math.min(subtotal - discount, customer.points || 0))}</span>
                               </p>
                            </div>
                         </div>
                         <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                            useLoyaltyPoints ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200 group-hover:border-emerald-500"
                         )}>
                            {useLoyaltyPoints ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 bg-slate-100 rounded-full" />}
                         </div>
                      </div>
                   )}

                   {/* Payment Method Details */}
                   <AnimatePresence mode="wait">
                      {paymentMethod === 'qr' ? (
                        <motion.div 
                          key="qr-view"
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-inner"
                        >
                           <div className="bg-white p-4 rounded-[2rem] shadow-2xl ring-4 ring-white/50">
                              <img 
                                 src={sePayService.createPaymentQR(total, `IPOS_PAY_${Date.now()}`)}
                                 alt="Payment QR"
                                 className="w-40 h-40"
                                 referrerPolicy="no-referrer"
                              />
                           </div>
                           <div className="text-center sm:text-left space-y-4">
                              <div className="space-y-1">
                                <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                   Quét mã VietQR Pro
                                   <div className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase rounded shadow-sm">SePay Active</div>
                                </h4>
                                <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                   <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                                   Auto-Reconciliation Enabled
                                </p>
                              </div>
                              <div className="p-4 bg-white/60 backdrop-blur-md rounded-2xl text-xs font-bold text-slate-600 border border-indigo-100/50 leading-relaxed shadow-sm">
                                 Sử dụng bất kỳ ứng dụng Ngân hàng để thanh toán. Hệ thống sẽ <strong>tự động chốt đơn</strong> ngay khi tiền vào tài khoản.
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                       <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center">
                                          <Building2 className="w-3 h-3 text-slate-400" />
                                       </div>
                                    ))}
                                 </div>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Linked with 30+ Banks</span>
                              </div>
                           </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="cash-view"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-inner space-y-6"
                        >
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Xác nhận số tiền</span>
                              <div className="flex gap-2">
                                 {[50000, 100000, 200000, 500000].map(val => (
                                   <button 
                                     key={val}
                                     onClick={() => {
                                       const input = document.getElementById('cash-input') as HTMLInputElement;
                                       if(input) input.value = val.toString();
                                     }}
                                     className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                                   >
                                     {val/1000}k
                                   </button>
                                 ))}
                              </div>
                           </div>
                           <div className="relative group">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 group-focus-within:text-indigo-600 transition-all">đ</span>
                              <input 
                                id="cash-input"
                                type="text" 
                                defaultValue={total.toString()}
                                className="w-full bg-white border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 rounded-[1.5rem] py-6 pl-14 pr-8 text-4xl font-black text-slate-900 outline-none transition-all shadow-lg text-right"
                              />
                           </div>
                           <div className="flex justify-between items-center pt-2">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                 <AlertCircle className="w-3.5 h-3.5" /> Thừa/Thiếu sẽ được tính vào giao dịch
                              </p>
                              <span className="text-xs font-black text-indigo-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-indigo-50">
                                 Gợi ý: {formatCurrency(Math.ceil(total/100000)*100000)}
                              </span>
                           </div>
                        </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                <div className="mt-auto pt-6 flex gap-4">
                   <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-400 font-black rounded-[1.5rem] hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
                   >
                     Quay lại
                   </button>
                   <button 
                     onClick={completeOrder}
                     disabled={isProcessing}
                     className={cn(
                       "flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-4 relative overflow-hidden group",
                       isProcessing && "opacity-70 cursor-not-allowed"
                     )}
                   >
                     {isProcessing ? (
                       <span className="flex items-center gap-3">
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         Đang xử lý...
                       </span>
                     ) : (
                       <>
                         <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                         <span className="relative z-10 flex items-center gap-3">
                           Hoàn tất thanh toán
                           <CheckCircle2 className="w-6 h-6 animate-pulse" />
                         </span>
                       </>
                     )}
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
        <div className="flex items-center gap-6">
          <button 
             onClick={() => window.location.href = '/'}
             className="w-10 h-10 bg-slate-100/80 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
             title="Trở về Trung tâm ERP"
          >
             <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 relative">
                <Monitor className="w-6 h-6" />
                <div className={cn(
                  "absolute -top-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full shadow-sm",
                  isOffline ? "bg-rose-500" : "bg-emerald-500"
                )} />
             </div>
             <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">iPos Bán hàng</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cửa hàng: {activeStore?.name || 'Chi nhánh mặc định'} • {isOffline ? 'OFFLINE' : 'ONLINE'}</p>
             </div>
          </div>

          <div className="hidden lg:flex gap-6 border-l border-slate-100 pl-8">
             <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Nhân viên trực</p>
                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-[9px] font-bold text-emerald-600">
                      {(selectedStaff?.name || user?.displayName || user?.email || 'N').charAt(0).toUpperCase()}
                   </div>
                   <select 
                      className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
                      value={selectedStaff?.id || user?.uid}
                      onChange={(e) => setSelectedStaff({ id: e.target.value, name: e.target.options[e.target.selectedIndex].text })}
                    >
                      <option value={user?.uid || 'default'}>{user?.displayName || user?.email || 'Nhân viên hiện tại'}</option>
                    </select>
                </div>
             </div>
             <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Doanh số ca</p>
                <p className="text-xs font-bold text-indigo-600">{formatCurrency(1050000)}</p>
             </div>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-xl ml-auto mr-4 hidden xl:flex">
          <button 
            onClick={() => setActiveTab('sales')}
            className={cn(
              "px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              activeTab === 'sales' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            <ShoppingCart className="w-4 h-4" /> Bán hàng
          </button>
          <button 
            onClick={() => setActiveTab('tables' as any)}
            className={cn(
              "px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              activeTab === 'tables' as any ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            <Grid3x3 className="w-4 h-4" /> Bàn / Phòng
          </button>
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
              "px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 relative",
              activeTab === 'history' ? "bg-slate-900 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {activeTab === 'history' ? <ArrowRight className="w-4 h-4" /> : <History className="w-4 h-4" />}
            {activeTab === 'history' ? 'Bán hàng' : 'Nhật ký'}
            {pendingEMenuOrders.length > 0 && activeTab !== 'history' && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-slate-50 animate-bounce">
                {pendingEMenuOrders.length}
              </span>
            )}
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
                  {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(product => (
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
                      {products.filter(p => !cart.find(ci => ci.id === p.id)).slice(0, 4).map(product => (
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
          ) : activeTab === 'tables' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col gap-6 overflow-hidden animate-in slide-in-from-left-4">
               <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-indigo-600">
                     <Grid3x3 className="w-5 h-5" />
                     <h3 className="font-bold text-lg">Sơ đồ Bàn / Phòng</h3>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                     <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200" /> Bàn Trống</span>
                     <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600" /> Đang phục vụ</span>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto mt-2">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                     {[...Array(15)].map((_, i) => {
                       const isServing = i === 1 || i === 4; // Mock logic 
                       return (
                         <div 
                           key={i} 
                           className={cn(
                             "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg relative group",
                             isServing ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200"
                           )}
                           onClick={() => alert('Đã chọn Bàn ' + (i + 1))}
                         >
                           <Coffee className={cn("w-6 h-6", isServing ? "text-emerald-500" : "text-slate-300")} />
                           <span className="font-black text-sm">Bàn {i + 1}</span>
                           
                           {/* Quick eMenu Overlay */}
                           <div className="absolute inset-0 bg-indigo-900/90 rounded-[14px] flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="bg-white/20 hover:bg-white text-white hover:text-indigo-900 p-2 rounded-full transition-colors backdrop-blur-sm shadow-xl" onClick={(e) => { e.stopPropagation(); setSelectedTableForQr(i+1); }}>
                                 <QrCode className="w-5 h-5" />
                              </button>
                           </div>
                         </div>
                       );
                     })}
                  </div>
               </div>
               
               {/* QR eMenu Modal */}
               {selectedTableForQr && (
                 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                   <div className="bg-white rounded-[32px] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 relative border border-slate-200">
                      <button onClick={() => setSelectedTableForQr(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                         <X className="w-6 h-6 text-slate-400" />
                      </button>
                      
                      <div className="text-center space-y-6">
                         <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-900">Quét gọi món (eMenu)</h3>
                            <p className="text-sm font-medium text-slate-500">Bàn {selectedTableForQr} • {activeStore?.name}</p>
                         </div>
                         
                         <div className="aspect-square bg-slate-50 rounded-[40px] border-4 border-slate-100 flex items-center justify-center p-8 relative overflow-hidden group">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/emenu/' + selectedTableForQr)}`} 
                              alt="QR Code" 
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                               <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-slate-50">
                                  <Store className="w-6 h-6 text-indigo-600" />
                               </div>
                            </div>
                         </div>
                         
                         <div className="flex items-center gap-3 justify-center text-xs font-bold text-emerald-600 bg-emerald-50 py-3 rounded-2xl">
                            <CheckCircle2 className="w-4 h-4" /> QR Code đã được kích hoạt
                         </div>
                         
                         <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">Khách hàng quét mã này để truy cập thư đơn trực tuyến và đặt món trực tiếp tại bàn.</p>
                      </div>
                   </div>
                 </div>
               )}
            </div>
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
                             <p className="text-xl font-bold text-emerald-600">{selectedProductLookup.stock || 0}</p>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-900 flex items-center gap-2">
                             <RefreshCcw className="w-3.5 h-3.5 text-indigo-600" /> Liên chi nhánh
                          </h4>
                          <div className="space-y-2">
                             <div className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-200 transition-all">
                                <span className="text-sm font-medium text-slate-700">CN Quận 1 (Chính)</span>
                                <span className="font-bold text-xs text-indigo-600">{selectedProductLookup.stock || 0} sp</span>
                             </div>
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
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                  <History className="w-5 h-5 text-indigo-600" /> Nhật ký đơn hàng
                </h3>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Hôm nay
                  </div>
                </div>
              </div>

              {/* Pending E-Menu Orders Section */}
              {pendingEMenuOrders.length > 0 && (
                <div className="mb-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                      Đơn E-Menu mới ({pendingEMenuOrders.length})
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">Yêu cầu từ khách tại bàn</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingEMenuOrders.map(order => (
                      <div key={order.id} className="p-5 bg-rose-50/50 rounded-3xl border border-rose-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
                              <QrCode className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="font-black text-slate-900">BÀN {order.tableId}</p>
                               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{order.items?.length || 0} món • {formatCurrency(order.total)}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{order.time || 'Vừa xong'}</span>
                        </div>
                        
                        <div className="flex gap-2 border-t border-rose-100 pt-4">
                           <button 
                             onClick={() => handleProcessEMenuOrder(order)}
                             className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                           >
                              Nhận & Xử lý
                           </button>
                           <button 
                             onClick={() => handleDeclineOrder(order.id)}
                             className="px-4 py-2.5 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-200 hover:bg-rose-50 transition-all active:scale-95"
                           >
                              Hủy
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="w-full h-px bg-slate-100" />
                </div>
              )}

              <div className="space-y-3">
                {orderHistory.map(tx => (
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
                       <span className="text-[9px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded uppercase">{customer.tier || 'MEMBER'}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-1">{customer.phone}</p>
                    {customer.aiInsight && (
                      <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex gap-2 animate-in slide-in-from-top-2">
                         <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                         <div>
                            <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">AI Insights</p>
                            <p className="text-[10px] text-indigo-800 font-medium leading-tight mt-1">{customer.aiInsight}</p>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setCustomer(null)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : showCustomerSearch ? (
              <div className="space-y-3 relative z-10">
                <div className="relative">
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Nhập số điện thoại (10 số)..." 
                    value={customerSearchQuery}
                    onChange={(e) => searchCustomers(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                  />
                  <button 
                    onClick={() => setShowCustomerSearch(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {customerSearchResults.length > 0 && (
                  <div className="max-h-[120px] overflow-y-auto border border-indigo-100 rounded-lg divide-y divide-indigo-50 shadow-lg shadow-indigo-100">
                    {customerSearchResults.map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => { setCustomer(c); setShowCustomerSearch(false); }}
                        className="w-full text-left p-3 hover:bg-indigo-50 transition-all flex justify-between items-center bg-white"
                      >
                         <div>
                            <p className="text-xs font-bold text-slate-900">{c.name}</p>
                            <p className="text-[10px] text-slate-500">{c.phone}</p>
                         </div>
                         <ChevronRight className="w-4 h-4 text-indigo-300" />
                      </button>
                    ))}
                  </div>
                )}
                <button 
                  className="w-full py-2 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all"
                >
                  Tạo khách hàng mới
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowCustomerSearch(true)}
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

              <div className="flex gap-2">
                <button 
                  disabled={cart.length === 0}
                  onClick={handlePrintProforma}
                  className="w-1/3 py-6 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition-all shadow-sm text-xs uppercase tracking-widest disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                >
                  <Printer className="w-5 h-5" />
                  In tạm tính
                </button>
                <button 
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  className={cn(
                    "w-2/3 py-6 text-white font-bold rounded-xl transition-all shadow-lg text-sm uppercase tracking-[0.2em] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3",
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
      
      {/* Print Proforma View */}
      <div className="hidden print:block w-[80mm] p-4 text-black bg-white font-mono text-xs">
          <h2 className="text-center font-bold text-xl uppercase mb-2">HÓA ĐƠN TẠM TÍNH</h2>
          <p className="text-center">{activeStore?.name || 'V-ERP Store'}</p>
          <p className="text-center mb-4">Nhân viên: {selectedStaff?.name || user?.displayName}</p>
          <p className="mb-4">Khách hàng: {customer?.name || 'Khách lẻ'}</p>

          <div className="border-t border-dashed border-black pt-2 mb-2">
             {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between mb-1">
                   <div className="flex-1 truncate max-w-[50mm]">{item.quantity}x {item.name}</div>
                   <div>{formatCurrency(item.price * item.quantity)}</div>
                </div>
             ))}
          </div>

          <div className="border-t border-dashed border-black pt-2 space-y-1">
             <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
             </div>
             {discount > 0 && (
               <div className="flex justify-between">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(discount)}</span>
               </div>
             )}
             {loyaltyDiscount > 0 && (
               <div className="flex justify-between">
                  <span>Trừ điểm</span>
                  <span>-{formatCurrency(loyaltyDiscount)}</span>
               </div>
             )}
             <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-black">
                <span>PHẢI THANH TOÁN</span>
                <span>{formatCurrency(total)}</span>
             </div>
          </div>
          <div className="text-center mt-6">
             <p>Cảm ơn quý khách!</p>
             <p className="text-[10px] mt-1 italic">Bill In Tạm Tính Không Có Giá Trị Thuế</p>
          </div>
      </div>
      {/* Hidden Print View for Receipt */}
      <div className="hidden print:block p-8 bg-white text-black font-mono text-[10px] w-[80mm]">
        <div className="text-center border-b border-dashed border-black pb-4 mb-4">
          <h1 className="text-sm font-bold uppercase">V-ERP iPOS System</h1>
          <p>Chi nhánh: {activeStore?.name}</p>
          <p>{activeStore?.address}</p>
          <p>SĐT: 1900 1234</p>
        </div>
        
        <div className="mb-4">
          <p className="font-bold uppercase mb-2">HÓA ĐƠN TẠM TÍNH</p>
          <p>Ngày: {new Date().toLocaleString('vi-VN')}</p>
          <p>Nhân viên: {user?.displayName || 'NV Bán hàng'}</p>
          {customer && <p>Khách hàng: {customer.name} ({customer.phone})</p>}
        </div>

        <div className="border-b border-dashed border-black pb-2 mb-2">
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between py-1">
              <span className="flex-1">{item.name} x{item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Tạm tính:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span>Giảm giá:</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          {loyaltyDiscount > 0 && (
            <div className="flex justify-between">
              <span>Điểm Loyalty:</span>
              <span>-{formatCurrency(loyaltyDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs pt-2 border-t border-dashed border-black">
            <span>TỔNG CỘNG:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="text-center mt-8 border-t border-dashed border-black pt-4">
          <p>Cảm ơn quý khách!</p>
          <p>Hẹn gặp lại.</p>
        </div>
      </div>
    </div>
  );
}
