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
  Coffee,
  ShieldCheck,
  Shield,
  Users,
  Settings2,
  Key,
  Lock,
  MoreVertical,
  ScanLine,
  FileText,
  Zap,
  BarChart4,
  TrendingUp,
  PieChart as PieChartIcon,
  Download,
  Calendar,
  Layers,
  LayoutDashboard,
  Mic,
  DollarSign
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
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
  where,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { sePayService } from '../services/sepayService';


import { StoreSelector } from './StoreSelector';
import { IPosStaff, IPosStore } from '../types/erp';
import { useNavigate } from 'react-router-dom';

const BOM_MAP: Record<string, { materialId: string, quantity: number }[]> = {
  'Cafe Phin Sữa Đá': [
    { materialId: 'MAT-001', quantity: 0.03 }, // 30g Coffee beans
    { materialId: 'MAT-002', quantity: 0.02 }, // 20ml Condensed milk
    { materialId: 'MAT-003', quantity: 0.5 },  // 0.5kg Ice
  ],
  'Trà Đào Cam Sả': [
    { materialId: 'MAT-004', quantity: 1 },    // 1 Tea bag
    { materialId: 'MAT-005', quantity: 0.05 }, // 50ml Syrup
    { materialId: 'MAT-006', quantity: 2 },    // 2 Peach slices
  ],
};

export function IPosModule() {
  const { user } = useAuth();
  const { activeStore } = useStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [activeTab, setActiveTab] = useState<'sales' | 'history' | 'lookup' | 'management' | 'delivery' | 'dashboard' | 'tables' | 'handover'>('dashboard');
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [incomingExternalOrders, setIncomingExternalOrders] = useState<any[]>([
    {
       id: `EXT-${Date.now()}-1`, platform: 'GrabFood',
       customerName: 'Nguyễn Văn Grab', targetPhone: '0901234567',
       items: [{ id: 'p1', name: 'Cà phê Sữa đá', price: 29000, quantity: 2 }],
       total: 58000, status: 'pending'
    },
    {
       id: `EXT-${Date.now()}-2`, platform: 'BeFood',
       customerName: 'Trần Minh Be', targetPhone: '0912112233',
       items: [{ id: 'p2', name: 'Trà Đào Cam Sả', price: 45000, quantity: 1 }],
       total: 45000, status: 'pending'
    },
    {
       id: `EXT-${Date.now()}-3`, platform: 'Green SM',
       customerName: 'Lê Xanh SM', targetPhone: '0944556677',
       items: [{ id: 'p3', name: 'Bánh Mì Thập Cẩm', price: 25000, quantity: 2 }],
       total: 50000, status: 'pending'
    }
  ]);

  // RBAC State
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'employee'>('employee');
  const [staffList, setStaffList] = useState<IPosStaff[]>([]);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<IPosStaff | null>(null);
  const [mgmtSubTab, setMgmtSubTab] = useState<'staff' | 'store' | 'revenue' | 'reports' | 'channels'>('revenue');
  const [staffForm, setStaffForm] = useState<Partial<IPosStaff>>({
    fullName: '',
    email: '',
    phone: '',
    role: 'employee'
  });

  useEffect(() => {
    if (editingStaff) {
      setStaffForm({
        fullName: editingStaff.fullName,
        email: editingStaff.email,
        phone: editingStaff.phone,
        role: editingStaff.role
      });
    } else {
      setStaffForm({
        fullName: '',
        email: '',
        phone: '',
        role: 'employee'
      });
    }
  }, [editingStaff, isAddingStaff]);
  
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
  const [actualCashInput, setActualCashInput] = useState('');
  const [handoverNote, setHandoverNote] = useState('');
  const [selectedTableForQr, setSelectedTableForQr] = useState<number | null>(null);
  const [tables, setTables] = useState<any[]>([
    { id: 1, name: 'Bàn 01', status: 'available', zone: 'Tầng 1', capacity: 4 },
    { id: 2, name: 'Bàn 02', status: 'occupied', zone: 'Tầng 1', capacity: 2, currentOrder: { total: 145000, items: 3 } },
    { id: 3, name: 'Bàn 03', status: 'available', zone: 'Tầng 1', capacity: 4 },
    { id: 4, name: 'Bàn 04', status: 'reserved', zone: 'Tầng 1', capacity: 6, reservationTime: '18:30' },
    { id: 5, name: 'Bàn 05', status: 'occupied', zone: 'Tầng 1', capacity: 2, currentOrder: { total: 85000, items: 2 } },
    { id: 6, name: 'Bàn 06', status: 'cleaning', zone: 'Tầng 1', capacity: 4 },
    { id: 7, name: 'Bàn 07', status: 'available', zone: 'Tầng 2', capacity: 2 },
    { id: 8, name: 'Bàn 08', status: 'available', zone: 'Tầng 2', capacity: 2 },
    { id: 9, name: 'Phòng VIP 1', status: 'occupied', zone: 'VIP', capacity: 10, currentOrder: { total: 1250000, items: 12 } },
    { id: 10, name: 'Phòng VIP 2', status: 'available', zone: 'VIP', capacity: 10 },
  ]);
  const [pendingEMenuOrders, setPendingEMenuOrders] = useState<any[]>([]);
  const [activeStoreConfig, setActiveStoreConfig] = useState<IPosStore | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any[]>([]);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<any | null>(null);

  // Fetch Revenue Stats (Simulated for speed, but could be real from history)
  useEffect(() => {
    if (!activeStore) return;
    
    // In a real app we'd query Firebase orders for the last 7 days
    const mockRevenue = [
      { day: 'Thứ 2', revenue: 4500000 },
      { day: 'Thứ 3', revenue: 5200000 },
      { day: 'Thứ 4', revenue: 3800000 },
      { day: 'Thứ 5', revenue: 6100000 },
      { day: 'Thứ 6', revenue: 7500000 },
      { day: 'Thứ 7', revenue: 9200000 },
      { day: 'Chủ nhật', revenue: 8400000 },
    ];
    setRevenueData(mockRevenue);

    const mockTop = [
      { name: 'Cafe Phin Sữa', value: 45 },
      { name: 'Trà Đào Cam Sả', value: 30 },
      { name: 'Bánh Mì', value: 15 },
      { name: 'Khác', value: 10 },
    ];
    setTopProducts(mockTop);

    setPaymentStats([
      { name: 'Tiền mặt', value: 40 },
      { name: 'Chuyển khoản QR', value: 50 },
      { name: 'Thẻ POS', value: 10 },
    ]);
  }, [activeStore]);

  // Integrated Delivery Channel Status (Grab, Be, GSM)
  const [deliveryChannelStatus, setDeliveryChannelStatus] = useState<any>({
     grab: { online: true, activeDrivers: 12 },
     be: { online: true, activeDrivers: 8 },
     gsm: { online: true, activeDrivers: 15 }
  });

  // Simulated Driver Tracking for External Orders
  useEffect(() => {
    const interval = setInterval(() => {
      setDeliveryChannelStatus((prev: any) => ({
        ...prev,
        grab: { ...prev.grab, activeDrivers: 10 + Math.floor(Math.random() * 5) },
        be: { ...prev.be, activeDrivers: 5 + Math.floor(Math.random() * 5) },
        gsm: { ...prev.gsm, activeDrivers: 12 + Math.floor(Math.random() * 5) }
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch User Role & Active Store Config
  useEffect(() => {
    if (!user || !activeStore) return;

    // In a real app, we would fetch this from a 'user_roles' or 'store_staff' collection
    // For this ERP, we check if the user is the store owner/admin
    const fetchRole = async () => {
      try {
        const staffQuery = query(
          collection(db, 'ipos_staff'), 
          where('email', '==', user.email),
          where('assignedStoreId', '==', activeStore.id)
        );
        const staffSnap = await getDocs(staffQuery);
        
        if (!staffSnap.empty) {
          const staffData = staffSnap.docs[0].data() as IPosStaff;
          setUserRole(staffData.role);
        } else {
          // Default to admin for the person who sees the dashboard (demo purpose)
          setUserRole('admin');
        }

        // Fetch Store Config
        const storeRef = doc(db, 'ipos_stores', activeStore.id);
        const storeSnap = await getDocs(query(collection(db, 'ipos_stores'), where('id', '==', activeStore.id)));
        // If not found, create a default one
        const qStore = query(collection(db, 'ipos_stores'), where('id', '==', activeStore.id));
        const sSnap = await getDocs(qStore);

        if (sSnap.empty) {
           const defaultStore: IPosStore = {
             id: activeStore.id,
             name: activeStore.name,
             address: activeStore.address,
             managerId: user.uid,
             status: 'active',
             config: {
               printReceiptAutomatically: true,
               allowReturns: true,
               requireShiftOpening: true
             }
           };
           await setDoc(doc(db, 'ipos_stores', activeStore.id), defaultStore);
           setActiveStoreConfig(defaultStore);
        } else {
           setActiveStoreConfig(sSnap.docs[0].data() as IPosStore);
        }
      } catch (err) {
        console.error("Error fetching RBAC:", err);
      }
    };

    fetchRole();
  }, [user, activeStore]);

  // Real-time Staff List
  useEffect(() => {
    if (!activeStore || userRole === 'employee') return;

    const unsub = onSnapshot(
      query(collection(db, 'ipos_staff'), where('assignedStoreId', '==', activeStore.id)),
      (snap) => {
        setStaffList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as IPosStaff)));
      }
    );
    return () => unsub();
  }, [activeStore, userRole]);

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

  const searchCustomers = async (val: string) => {
    setCustomerSearchQuery(val);
    if (val.length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    try {
      // In a real app we'd use Algolia or Typesense for multi-field search. 
      // For this demo, we fetch a limited set and filter client-side.
      const q = query(
        collection(db, 'customers'), 
        limit(100)
      );
      const snap = await getDocs(q);
      const allResults = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const lowerVal = val.toLowerCase();
      const filtered = allResults.filter(c => 
        (c.name && c.name.toLowerCase().includes(lowerVal)) ||
        (c.phone && c.phone.includes(lowerVal)) ||
        (c.email && c.email.toLowerCase().includes(lowerVal))
      );
      setCustomerSearchResults(filtered);
    } catch (error) {
      console.error("Error searching customers:", error);
    }
  };
  
  const scannerRef = React.useRef<Html5QrcodeScanner | null>(null);

  // Real-time products
  useEffect(() => {
    if (!activeStore) return;
    const q = query(
      collection(db, 'pos_products'),
      where('companyId', '==', activeStore.companyId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      if (data.length === 0) seedDemoProducts();
    });
    return () => unsub();
  }, [activeStore]);
  
  const seedDemoProducts = async () => {
    if (!activeStore) return;
    console.log("Seeding demo products...");
    const demoItems = [
      { name: 'Cafe Phin Sữa Đá', price: 35000, category: 'Đồ uống', stock: 100, image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&q=80' },
      { name: 'Trà Đào Cam Sả', price: 45000, category: 'Đồ uống', stock: 50, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
      { name: 'Bánh Mì Thập Cẩm', price: 25000, category: 'Đồ ăn', stock: 30, image: 'https://plus.unsplash.com/premium_photo-1664472851893-6b71158b47bb?w=400&q=80' },
      { name: 'Phở Bò Đặc Biệt', price: 65000, category: 'Đồ ăn', stock: 20, image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?w=400&q=80' },
      { name: 'Bạc Xỉu', price: 39000, category: 'Đồ uống', stock: 80, image: 'https://images.unsplash.com/photo-1550953683-9b889ebdb1e0?w=400&q=80' },
      { name: 'Cơm Tấm Sườn Bì', price: 55000, category: 'Đồ ăn', stock: 40, image: 'https://images.unsplash.com/photo-1698696879815-5e60882e7ba1?w=400&q=80' }
    ];
    for (const item of demoItems) {
      await addDoc(collection(db, 'pos_products'), {
        ...item,
        companyId: activeStore.companyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
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

  const [discrepancyPrompt, setDiscrepancyPrompt] = useState<any | null>(null);

  const proceedWithExternalOrder = (extOrder: any, matchedCustomer: any) => {
    // Load to cart
    const newCart = extOrder.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    
    setCart(newCart);
    setOrderNote(`[${extOrder.platform}] Khách: ${extOrder.customerName} - SĐT: ${extOrder.targetPhone}`);
    
    if (matchedCustomer) {
      setCustomer(matchedCustomer);
      setVoiceHint(`Đã liên kết tự động KH: ${matchedCustomer.name}`);
      setTimeout(() => setVoiceHint(null), 3000);
    } else {
      // Create a temporary customer object for checkout process
      setCustomer({
        name: extOrder.customerName,
        phone: extOrder.targetPhone,
        isNewFromExternal: true
      });
    }
    
    // Remove from mock incoming list
    setIncomingExternalOrders(prev => prev.filter(o => o.id !== extOrder.id));
    setActiveTab('sales');
    setDiscrepancyPrompt(null);
  };

  const handleProcessExternalOrder = async (extOrder: any) => {
    // Check CRM for existing phone
    let matchedCustomer = null;
    let discrepancyMsg = null;
    
    if (extOrder.targetPhone) {
       const q = query(collection(db, 'customers'), where('phone', '==', extOrder.targetPhone));
       const snap = await getDocs(q);
       if (!snap.empty) {
          matchedCustomer = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
          // Check for discrepancy
          const incomingNameSub = extOrder.customerName.toLowerCase().trim();
          const crmNameSub = matchedCustomer.name?.toLowerCase().trim();
          
          if (crmNameSub && !incomingNameSub.includes(crmNameSub) && !crmNameSub.includes(incomingNameSub)) {
             discrepancyMsg = `SĐT ${extOrder.targetPhone} trong hệ thống CRM thuộc về "${matchedCustomer.name}", nhưng đơn từ ${extOrder.platform} hiển thị tên là "${extOrder.customerName}". Bạn có muốn liên kết đơn này với hồ sơ CRM cũ?`;
          }
       }
    }

    if (discrepancyMsg) {
       setDiscrepancyPrompt({ order: extOrder, matchedCustomer, message: discrepancyMsg });
    } else {
       proceedWithExternalOrder(extOrder, matchedCustomer);
    }
  };

  const completeOrder = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      let finalCustomerId = customer?.id || null;

      // Auto save new external customer to CRM if they don't exist
      if (customer && customer.isNewFromExternal && !customer.id) {
         try {
           const newCustRef = await addDoc(collection(db, 'customers'), {
             name: customer.name,
             phone: customer.phone,
             points: 0,
             createdAt: serverTimestamp()
           });
           finalCustomerId = newCustRef.id;
         } catch(err) {
           console.error("Error auto-creating customer:", err);
         }
      }

      const orderData = {
        staffId: user.uid,
        storeId: activeStore.id,
        companyId: activeStore.companyId,
        source: 'ipos',
        customerName: customer?.name || 'Khách lẻ',
        customerId: finalCustomerId,
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

      // Register transaction in Finance
      if (total > 0) {
         await addDoc(collection(db, 'finance_transactions'), {
           type: 'income',
           amount: total,
           category: 'iPOS Doanh thu',
           description: `Đơn hàng iPOS #${orderData.customerName} - ${activeStore.name}`,
           storeId: activeStore.id,
           companyId: activeStore.companyId,
           date: serverTimestamp(),
           source: 'ipos'
         });
      }

      // BOM-based Warehouse Reduction
      for (const item of cart) {
        const bom = BOM_MAP[item.name];
        if (bom) {
          for (const component of bom) {
            // Find material in branch warehouse
            const q = query(
              collection(db, 'warehouse_stock'),
              where('materialId', '==', component.materialId),
              where('storeId', '==', activeStore.id)
            );
            const stockSnap = await getDocs(q);
            if (!stockSnap.empty) {
              const stockDoc = stockSnap.docs[0];
              const currentQty = stockDoc.data().quantity || 0;
              await updateDoc(doc(db, 'warehouse_stock', stockDoc.id), {
                quantity: Math.max(0, currentQty - (component.quantity * item.quantity)),
                updatedAt: serverTimestamp()
              });
            } else {
              // Create stock entry if missing for this branch
              await addDoc(collection(db, 'warehouse_stock'), {
                materialId: component.materialId,
                storeId: activeStore.id,
                companyId: activeStore.companyId,
                quantity: Math.max(0, 100 - (component.quantity * item.quantity)), // Initial demo stock
                updatedAt: serverTimestamp()
              });
            }
          }
        }
      }

      // Update POS product menu stock
      for (const item of cart) {
        const productRef = doc(db, 'pos_products', item.id);
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
      staffId: user?.uid,
      storeId: activeStore?.id,
      companyId: activeStore?.companyId
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

  const handleUpdateStoreConfig = async (key: string, value: any) => {
    if (!activeStore || !activeStoreConfig) return;
    try {
      const updatedConfig = {
        ...activeStoreConfig,
        config: {
          ...activeStoreConfig.config,
          [key]: value
        }
      };
      await updateDoc(doc(db, 'ipos_stores', activeStore.id), updatedConfig as any);
      setActiveStoreConfig(updatedConfig as any);
    } catch (err) {
      console.error("Error updating config:", err);
    }
  };

  const handleSaveStaff = async (staffData: Partial<IPosStaff>) => {
    if (!activeStore) return;
    try {
      if (editingStaff) {
        // Find the document ID first
        const q = query(collection(db, 'ipos_staff'), where('id', '==', editingStaff.id));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(doc(db, 'ipos_staff', snap.docs[0].id), {
            ...staffData,
            updatedAt: serverTimestamp()
          });
        }
      } else {
        const newStaff = {
          ...staffData,
          id: `STF-${Date.now()}`,
          assignedStoreId: activeStore.id,
          companyId: activeStore.companyId,
          status: 'active',
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'ipos_staff'), newStaff);
      }
      setIsAddingStaff(false);
      setEditingStaff(null);
    } catch (err) {
      console.error("Error saving staff:", err);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) return;
    try {
      const q = query(collection(db, 'ipos_staff'), where('id', '==', staffId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await deleteDoc(doc(db, 'ipos_staff', snap.docs[0].id));
      }
    } catch (err) {
      console.error("Error deleting staff:", err);
    }
  };

  if (!activeStore) {
     return <StoreSelector />;
  }

  if (!isShiftActive) {
    if (pendingHandover) {
      return (
        <div className="h-full flex items-center justify-center p-8 bg-slate-50/50">
          <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 shadow-xl p-10 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Nhận bàn giao ca</h2>
              <p className="text-sm text-slate-500">Ca trước: <span className="font-bold text-slate-700">{pendingHandover.previousStaffName}</span></p>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-5 space-y-4">
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
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/20"
            >
              Xác nhận nhận ca & Bắt đầu
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex items-center justify-center p-8 bg-slate-50/50">
        <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 shadow-xl p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Mở ca làm việc</h2>
            <p className="text-sm text-slate-500">Vui lòng kiểm tra tiền mặt đầu ca trước khi bắt đầu bán hàng.</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-6 text-left space-y-4">
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
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-600/20"
          >
            Bắt đầu ca làm việc
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full flex flex-col gap-5 animate-in fade-in duration-700 pb-6 relative font-sans",
      isDarkMode && "dark bg-[#0f172a] text-slate-100"
    )}>
      {/* Voice Assistant Overlay - Minimalist refinement */}
      {isListening && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-indigo-600 text-white px-5 py-2.5 rounded-full flex items-center gap-3 shadow-2xl animate-bounce border border-white/20 backdrop-blur-md">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-200"></span>
           </span>
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Siri iPOS • Đang nghe</span>
        </div>
      )}

      {voiceHint && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[300] bg-slate-900/95 text-white px-8 py-4 rounded-lg flex flex-col items-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 backdrop-blur-xl">
           <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.3em]">Hệ thống nhận diện</p>
           <p className="text-lg font-bold italic">"{voiceHint}"</p>
        </div>
      )}
      {/* Shift Summary Modal */}
      {showShiftSummary && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-lg p-10 w-full max-w-lg space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center font-bold">
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
              <div className="p-5 bg-slate-50 rounded-lg space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tiền mặt đầu ca</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(2000000)}</p>
              </div>
              <div className="p-5 bg-indigo-50 rounded-lg space-y-1 border border-indigo-100">
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
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-all"
              >
                Tiếp tục bán
              </button>
              <button 
                onClick={confirmCloseShift}
                className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all"
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
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
             {/* Left side: Order Summary */}
             <div className="w-full md:w-1/3 bg-slate-50 p-6 sm:p-10 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center border border-slate-100">
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
                     <div className="space-y-2 py-4 bg-white/50 rounded-lg p-4 border border-slate-100 border-dashed">
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
                     className="w-12 h-12 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-lg text-slate-400 transition-all flex items-center justify-center border border-slate-100"
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
                        "w-14 h-14 rounded-lg flex items-center justify-center transition-all",
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
                        "w-14 h-14 rounded-lg flex items-center justify-center transition-all",
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
                        "w-14 h-14 rounded-lg flex items-center justify-center transition-all",
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
                          "group p-5 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between",
                          useLoyaltyPoints 
                            ? "bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/5 ring-4 ring-emerald-50" 
                            : "bg-white border-slate-100 hover:border-emerald-200"
                        )} 
                        onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                      >
                         <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center transition-all",
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
                          className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-indigo-50 rounded-lg border border-indigo-100 shadow-inner"
                        >
                           <div className="bg-white p-4 rounded-lg shadow-2xl ring-4 ring-white/50">
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
                              <div className="p-4 bg-white/60 backdrop-blur-md rounded-lg text-xs font-bold text-slate-600 border border-indigo-100/50 leading-relaxed shadow-sm">
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
                          className="bg-slate-50 p-8 rounded-lg border border-slate-200 shadow-inner space-y-6"
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
                              <span className="text-xs font-black text-indigo-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-indigo-50">
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
           <div className="bg-white rounded-lg p-8 w-full max-w-lg space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold">Quét mã sản phẩm</h2>
                 <button onClick={() => setIsScannerOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X /></button>
              </div>
              <div id="pos-reader" className="overflow-hidden rounded-lg border border-slate-200 shadow-inner"></div>
              <p className="text-center text-xs text-slate-500 font-bold uppercase tracking-wider">Đưa mã vạch vào vùng nhận diện</p>
           </div>
        </div>
      )}

      {/* Header - Refined with better depth and hierarchy */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
             onClick={() => window.location.href = '/'}
             className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100 group"
             title="Trở về Trung tâm ERP"
          >
             <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="flex items-center gap-3.5 border-r border-slate-100 pr-5">
             <div className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md relative overflow-hidden group">
                <Store className="w-5 h-5 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-700/50 to-transparent group-hover:scale-110 transition-transform" />
                <div className={cn(
                  "absolute -top-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full shadow-sm z-20",
                  isOffline ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                )} />
             </div>
             <div>
                <h1 className="text-base font-bold text-slate-900 leading-none tracking-tight">iPOS Terminal</h1>
                <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider flex items-center gap-1.5">
                   {activeStore?.name} <span className="opacity-30">•</span> <span className={isOffline ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>{isOffline ? 'OFFLINE' : 'LIVE'}</span>
                </p>
             </div>
          </div>

          <div className="hidden xl:flex gap-8 pl-3">
             <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-medium ml-1">Thu ngân vận hành</p>
                <div className="flex items-center gap-2.5 group">
                   <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-100 shadow-sm transition-transform group-hover:scale-105">
                      {(selectedStaff?.name || user?.displayName || user?.email || 'N').charAt(0).toUpperCase()}
                   </div>
                   <select 
                      className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer hover:text-blue-600 transition-colors"
                      value={selectedStaff?.id || user?.uid}
                      onChange={(e) => setSelectedStaff({ id: e.target.value, name: e.target.options[e.target.selectedIndex].text })}
                    >
                      <option value={user?.uid || 'default'}>{user?.displayName || user?.email || 'Nhân viên hiện tại'}</option>
                    </select>
                </div>
             </div>
          </div>
        </div>

        <div className="flex bg-slate-50/80 p-1.5 rounded-xl mx-4 self-stretch border border-slate-100 hidden xl:flex">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
              activeTab === 'dashboard' ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            )}
          >
            <LayoutDashboard className="w-4 h-4" /> Tổng quan
          </button>
          <button 
            onClick={() => setActiveTab('sales')}
            className={cn(
              "px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
              activeTab === 'sales' ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            )}
          >
            <ShoppingCart className="w-4 h-4" /> Bán hàng
          </button>
          <button 
            onClick={() => setActiveTab('tables')}
            className={cn(
              "px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
              activeTab === 'tables' ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            )}
          >
            <Grid3x3 className="w-4 h-4" /> Sơ đồ bàn
          </button>
          {['admin', 'manager'].includes(userRole) && (
            <button 
              onClick={() => setActiveTab('management')}
              className={cn(
                "px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
                activeTab === 'management' ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              )}
            >
              <ShieldCheck className="w-4 h-4" /> Quản trị
            </button>
          )}
          <button 
            onClick={() => setActiveTab('delivery')}
            className={cn(
              "px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 relative",
              activeTab === 'delivery' ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            )}
          >
            <Building2 className="w-4 h-4" /> Đối tác Giao hàng
            {incomingExternalOrders.length > 0 && (
               <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full animate-pulse">{incomingExternalOrders.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('lookup')}
            className={cn(
              "px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
              activeTab === 'lookup' ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            )}
          >
            <Search className="w-4 h-4" /> Tra cứu
          </button>
        </div>

        <div className="flex gap-3 items-center">
          <div className="flex gap-1.5 px-1.5 py-1.5 bg-slate-50 rounded-xl border border-slate-100 mr-2">
            <button 
              onClick={startListening}
              className={cn(
                "w-9 h-9 rounded-lg transition-all flex items-center justify-center relative",
                isListening ? "bg-rose-500 text-white shadow-md animate-pulse ring-2 ring-rose-100" : "bg-white text-slate-500 hover:text-blue-600 hover:shadow-sm border border-slate-200"
              )}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-9 h-9 bg-white text-slate-500 rounded-lg hover:text-amber-500 hover:shadow-sm transition-all border border-slate-200 flex items-center justify-center"
            >
               {isDarkMode ? <Sparkles className="w-4 h-4 text-amber-500" /> : <Monitor className="w-4 h-4" />}
            </button>
          </div>

          <button 
            onClick={() => setActiveTab(activeTab === 'sales' ? 'history' : 'sales')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'history' ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 hover:border-blue-200 border border-slate-200 hover:text-blue-600"
            )}
          >
            {activeTab === 'history' ? <ShoppingCart className="w-4 h-4" /> : <History className="w-4 h-4" />}
            {activeTab === 'history' ? 'Bán hàng' : 'Lịch sử'}
            {pendingEMenuOrders.length > 0 && activeTab !== 'history' && (
              <span className="ml-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{pendingEMenuOrders.length}</span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('handover')}
            className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-100 hover:border-rose-300 transition-all flex items-center gap-2"
          >
            <Clock className="w-4 h-4" /> Kết Ca & Bàn Giao
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        {activeTab === 'dashboard' ? (
           <div className="col-span-12 space-y-8 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto no-scrollbar pb-20 scrollbar-hide">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Chào buổi sáng, {user?.displayName || 'Admin'}!</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Hệ thống iPOS đã sẵn sàng vận hành • {new Date().toLocaleDateString('vi-VN')}</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setActiveTab('sales')} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-sm hover:scale-105 transition-all active:scale-95">
                       <Plus className="w-4 h-4" /> Bán hàng ngay
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                    { label: 'Tổng Doanh thu', value: formatCurrency(8450000), icon: TrendingUp, trend: '+12.5%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Số lượng đơn', value: '124', icon: ShoppingCart, trend: '+8 đơn', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Khách hàng mới', value: '18', icon: Users, trend: '+5', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Lượt đánh giá', value: '4.8/5', icon: Sparkles, trend: '98%', color: 'text-amber-600', bg: 'bg-amber-50' }
                 ].map((card, i) => (
                    <div key={card.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                       <div className="flex justify-between items-start mb-4">
                          <div className={cn("p-3 rounded-xl", card.bg, card.color)}>
                             <card.icon className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">{card.trend}</span>
                       </div>
                       <p className="text-xs font-semibold text-slate-500 mb-1">{card.label}</p>
                       <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{card.value}</p>
                    </div>
                 ))}
              </div>

              {/* Delivery Channel Live Monitor */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-slate-900 flex items-center gap-3">
                       <Monitor className="w-5 h-5 text-emerald-600" /> Giám sát Kênh Giao hàng (Live)
                    </h3>
                    <div className="flex gap-2">
                       <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Connected
                       </span>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                       { id: 'grab', name: 'GrabFood', color: 'bg-emerald-500', icon: 'Grab', stats: deliveryChannelStatus.grab },
                       { id: 'be', name: 'BeFood', color: 'bg-yellow-400', icon: 'Be', stats: deliveryChannelStatus.be },
                       { id: 'gsm', name: 'Green SM', color: 'bg-emerald-400', icon: 'GSM', stats: deliveryChannelStatus.gsm }
                    ].map((ch) => (
                       <div key={ch.id} className="p-6 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md hover:border-slate-200 transition-all">
                          <div className="flex items-center gap-4">
                             <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm", ch.color)}>
                                {ch.icon}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900">{ch.name}</p>
                                <p className="text-xs font-medium text-slate-500">{ch.stats.online ? 'Online' : 'Offline'}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-blue-600 leading-none">{ch.stats.activeDrivers}</p>
                             <p className="text-[10px] font-medium text-slate-500 mt-1">Tài xế gần đây</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="font-bold text-slate-900 flex items-center gap-3">
                          <Zap className="w-5 h-5 text-blue-600" /> Hoạt động Bán hàng (Live)
                       </h3>
                    </div>
                    <div className="h-[320px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueData}>
                             <defs>
                                <linearGradient id="dashRevenue" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                                   <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(v) => `${v/1000}k`} />
                             <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                             <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#dashRevenue)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg shadow-blue-600/20 group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:bg-white/20 transition-all duration-700" />
                       <div className="relative z-10 space-y-6">
                          <div className="space-y-2">
                             <p className="text-xs font-semibold text-blue-200">Trạng thái Cửa hàng</p>
                             <h4 className="text-xl font-bold">{isShiftActive ? 'Đang hoạt động' : 'Đã đóng ca'}</h4>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                   <div key={i} className="w-8 h-8 rounded-full border-2 border-blue-600 bg-blue-500 flex items-center justify-center text-[10px] font-bold">
                                      {i}
                                   </div>
                                ))}
                             </div>
                             <span className="text-[10px] font-medium text-blue-100">3 nhân viên đang Online</span>
                          </div>
                          <button onClick={() => { setActiveTab('management'); setMgmtSubTab('revenue'); }} className="w-full py-3 bg-white text-blue-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all active:scale-95 shadow-sm">Xem báo cáo</button>
                       </div>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-8 space-y-6">
                       <h4 className="font-extrabold text-slate-900 text-sm italic">Tips vận hành AI</h4>
                       <div className="space-y-4">
                          {[
                             { t: 'Tăng cường nhân sự vào 18h tối nay', c: 'Dự báo giờ cao điểm' },
                             { t: 'Ưu tiên món "Cafe Phin Sữa"', c: 'Đang là xu hướng' }
                          ].map((tip, i) => (
                             <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all cursor-default">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                                <div>
                                   <p className="text-xs font-black text-slate-800">{tip.t}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{tip.c}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        ) : activeTab === 'sales' ? (
          <>
            {/* Main Content Area */}
            <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col gap-6 overflow-hidden h-full">
              <div className="flex gap-4 shrink-0 transition-all">
                  {/* Product Search & Categories - Refined with Glass effect */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 flex-1 flex flex-col items-center gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Tìm món, mã SKU hoặc ID..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => setIsScannerOpen(true)}
                      className="h-[52px] bg-slate-900 text-white px-6 rounded-xl flex items-center gap-3 hover:bg-slate-800 transition-all shadow-md active:scale-95 group w-full sm:w-auto justify-center shrink-0"
                    >
                      <ScanLine className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold uppercase tracking-widest">Quét mã</span>
                    </button>
                  </div>
                  
                  <div className="flex gap-2.5 w-full overflow-x-auto no-scrollbar py-1">
                    {['Tất cả', 'Cà phê', 'Trà trái cây', 'Đồ ăn nhẹ', 'Tráng miệng'].map((cat, idx) => (
                      <button 
                        key={cat} 
                        className={cn(
                          "px-5 py-2.5 whitespace-nowrap rounded-lg text-xs font-bold transition-all active:scale-95 border",
                          idx === 0 ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-white border-slate-200"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Grid - Refined with better rhythm and card design */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto custom-scrollbar flex flex-col gap-10">
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-8">
                  {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(product => (
                    <div 
                      key={product.id} 
                      className="group relative flex flex-col transition-all duration-300"
                    >
                      <button 
                         onClick={() => addToCart(product)}
                         className="absolute inset-0 z-10 w-full h-full cursor-pointer"
                      />
                      
                      <div className="aspect-[4/4.5] bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden relative mb-4 transition-all group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] group-hover:border-blue-200 group-active:scale-95">
                         <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                         
                         {/* Image or Placeholder */}
                         {product.image ? (
                           <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                         ) : (
                           <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                              <Monitor className="w-32 h-32" />
                           </div>
                         )}

                         <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                            <span className="text-[8px] font-black text-indigo-600 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest shadow-sm">
                               {product.category}
                            </span>
                            {product.stock <= 10 && (
                               <div className="bg-rose-500 text-white rounded-full p-1.5 shadow-lg shadow-rose-200 animate-pulse">
                                  <AlertCircle className="w-3 h-3" />
                               </div>
                            )}
                         </div>

                         <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                               <Plus className="w-5 h-5" />
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedProductLookup(product); setActiveTab('lookup'); }}
                              className="w-8 h-8 bg-white/90 backdrop-blur-md text-slate-400 hover:text-blue-600 rounded-lg flex items-center justify-center border border-slate-200 shadow-sm relative z-20"
                            >
                               <Search className="w-3.5 h-3.5" />
                            </button>
                         </div>
                      </div>
                      
                      <div className="px-1">
                         <h3 className="font-bold text-slate-800 leading-tight text-sm mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-2">{product.name}</h3>
                         <div className="flex justify-between items-center">
                            <p className="text-base font-black text-slate-900 tracking-tight">{formatCurrency(product.price)}</p>
                            <span className={cn(
                               "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                               product.stock <= 10 ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50"
                            )}>
                               {product.stock} pcs
                            </span>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {products.filter(p => !cart.find(ci => ci.id === p.id)).slice(0, 4).map(product => (
                        <div key={product.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 group hover:bg-white hover:border-blue-300 hover:shadow-lg transition-all">
                          <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{product.name}</p>
                          <div className="flex justify-between items-center">
                            <p className="text-[13px] font-bold text-slate-600">{formatCurrency(product.price)}</p>
                            <button 
                              onClick={() => addToCart(product)}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95"
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
            </div>

            {/* Cart/Checkout Sidebar - Modern touch-friendly desk */}
              <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col gap-5 overflow-hidden h-full animate-in slide-in-from-right-8 duration-500">
                 {/* Suspended Carts (Hold/Resume) - Elegant pills */}
                 {suspendedCarts.length > 0 && (
                   <div className="flex gap-2 w-full overflow-x-auto no-scrollbar py-1 shrink-0">
                      {suspendedCarts.map(sc => (
                         <button 
                           key={sc.id}
                           onClick={() => resumeCart(sc)}
                           className="shrink-0 px-4 py-2 bg-amber-50 border border-amber-200/50 rounded-lg flex items-center gap-3 hover:bg-amber-100 transition-all active:scale-95 shadow-sm"
                         >
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">{sc.time}</span>
                         </button>
                      ))}
                   </div>
                 )}

                 {/* Customer Selection - Modern unified bar */}
                 <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 relative group overflow-hidden transition-all hover:border-indigo-100 shrink-0">
                    {customer ? (
                      <div className="flex items-center justify-between relative z-10 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shadow-sm border border-indigo-100 relative group-hover:scale-105 transition-transform">
                            <User className="w-6 h-6" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <p className="font-black text-slate-900 text-sm tracking-tight">{customer.name}</p>
                               <span className="text-[8px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-widest">{customer.tier || 'LOYAL'}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{customer.phone} <span className="mx-1.5 opacity-30">•</span> {customer.points || 0} pts</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setCustomer(null)}
                          className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-lg transition-all border border-slate-100"
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    ) : showCustomerSearch ? (
                      <div className="space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            autoFocus
                            type="text" 
                            placeholder="Tìm theo Số điện thoại (10 chữ số)..." 
                            value={customerSearchQuery}
                            onChange={(e) => searchCustomers(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-10 py-3 text-xs font-black uppercase tracking-widest outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner placeholder:text-slate-200"
                          />
                          <button 
                            onClick={() => setShowCustomerSearch(false)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-rose-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {customerSearchResults.length > 0 && (
                          <div className="max-h-[160px] overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-50 shadow-xl shadow-slate-200/40 bg-white">
                            {customerSearchResults.map(c => (
                              <button 
                                key={c.id} 
                                onClick={() => { setCustomer(c); setShowCustomerSearch(false); }}
                                className="w-full text-left p-4 hover:bg-indigo-50 transition-all flex justify-between items-center group/item"
                              >
                                 <div>
                                    <p className="text-sm font-black text-slate-900 group-hover/item:text-indigo-600 transition-colors uppercase tracking-tight">{c.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{c.phone}</p>
                                 </div>
                                 <ArrowRight className="w-4 h-4 text-slate-200 group-hover/item:text-indigo-600 group-hover/item:translate-x-1 transition-all" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowCustomerSearch(true)}
                        className="w-full flex items-center gap-4 group transition-all"
                      >
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all border border-dashed border-slate-200 group-hover:border-blue-200">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors">Khách hàng mới</p>
                          <p className="text-xs text-slate-500 mt-1">Tích điểm • Nhận số ĐT</p>
                        </div>
                      </button>
                    )}
                 </div>

                 <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                            <ShoppingCart className="w-5 h-5" />
                         </div>
                         <div>
                            <h3 className="font-bold text-slate-900 text-sm">Đơn hàng hiện tại</h3>
                            <p className="text-xs text-blue-600 font-bold mt-0.5">{cart.reduce((a, b) => a + b.quantity, 0)} món</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={holdCart} className="w-9 h-9 bg-white border border-slate-200 text-slate-500 rounded-lg hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm flex items-center justify-center">
                            <Save className="w-4 h-4" />
                         </button>
                         <button onClick={() => { setCart([]); setCustomer(null); setIsReturnMode(false); }} className="w-9 h-9 bg-white border border-slate-200 text-rose-500 rounded-lg hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>

                    {/* Mode Switcher */}
                    <div className="flex p-1 bg-slate-100 mx-5 mt-5 rounded-xl shrink-0 border border-slate-200/50">
                       <button 
                        onClick={() => { setIsReturnMode(false); setReturnReason(''); }}
                        className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg transition-all", !isReturnMode ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50 text-sm py-2" : "text-slate-500 hover:text-slate-700")}
                       >Bán hàng</button>
                       <button 
                        onClick={() => setIsReturnMode(true)}
                        className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg transition-all", isReturnMode ? "bg-rose-500 text-white shadow-sm text-sm py-2" : "text-slate-500 hover:text-slate-700")}
                       >Đổi trả</button>
                    </div>

                    {isReturnMode && (
                       <div className="px-6 mt-4 animate-in slide-in-from-top-2">
                          <select 
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            className="w-full bg-rose-50 border border-rose-100 rounded-lg px-4 py-3 text-xs font-bold text-rose-600 outline-none focus:ring-2 ring-rose-200 transition-all cursor-pointer"
                          >
                             <option value="">-- Chọn lý do đổi trả --</option>
                             <option value="defective">Sản phẩm lỗi/hỏng</option>
                             <option value="wrong_size">Nhầm kích cỡ</option>
                             <option value="not_expected">Không ưng ý</option>
                             <option value="warranty">Bảo hành</option>
                          </select>
                       </div>
                    )}

                    <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar bg-slate-50/20">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center animate-in slide-in-from-right-4 bg-white p-4 rounded-xl border border-slate-200/50 relative group transition-all duration-300 hover:shadow-lg hover:border-blue-100">
                          {isReturnMode && <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 rounded-l-xl" />}
                          <div className="flex-1 pr-3">
                            <p className="font-bold text-slate-800 text-[13px] leading-snug mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{item.name}</p>
                            <div className="flex items-center gap-1.5">
                               <p className="text-[10px] text-slate-400 font-bold tracking-tight">{formatCurrency(item.price)}</p>
                               <span className="text-[8px] text-slate-300">•</span>
                               <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">SKU-{item.id.slice(-4).toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-5 mt-4 bg-slate-50 w-fit p-1 rounded-lg border border-slate-100">
                              <button 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:text-rose-500 hover:border-rose-200 transition-all active:scale-90"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-black w-4 text-center text-slate-700">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:text-blue-600 hover:border-blue-200 transition-all active:scale-90"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end justify-between self-stretch">
                            <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <p className="font-black text-slate-900 text-sm tracking-tight">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                      {cart.length > 0 && (
                        <div className="px-1 py-2">
                           <textarea 
                            placeholder="Ghi chú đơn hàng (VD: Giao sau 5h...)"
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg p-4 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all custom-scrollbar resize-none h-24 shadow-inner"
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

                    <div className="p-6 bg-white border-t border-slate-100 space-y-5 rounded-b-2xl shrink-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-slate-500">
                          <span className="text-xs font-semibold uppercase tracking-wider">Tạm tính</span>
                          <span className="text-sm font-bold text-slate-700">{formatCurrency(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between items-center text-rose-500 animate-in fade-in slide-in-from-right-4">
                            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                               <BadgePercent className="w-4 h-4" /> Giảm giá
                            </span>
                            <span className="text-sm font-bold">-{formatCurrency(discount)}</span>
                          </div>
                        )}
                        
                        <div className="bg-slate-900 rounded-2xl p-5 flex justify-between items-center text-white relative overflow-hidden group shadow-md mt-2">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 via-transparent to-transparent opacity-50" />
                            <div className="relative z-10">
                               <p className="text-xs font-semibold text-white/70 mb-1">Cần thanh toán</p>
                               <p className="text-3xl font-black tracking-tight">{isReturnMode ? '-' : ''}{formatCurrency(total)}</p>
                            </div>
                            <div className="relative z-10 h-10 w-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-blue-600 transition-colors">
                               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100">
                        <button className="h-[60px] bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl flex items-center justify-center gap-3 transition-all group active:scale-95 shadow-sm">
                           <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                           <span className="text-xs font-bold text-slate-700">Quẹt Thẻ</span>
                        </button>
                        <button className="h-[60px] bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl flex items-center justify-center gap-3 transition-all group active:scale-95 shadow-sm">
                           <QrCode className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                           <span className="text-xs font-bold text-slate-700">Chuyển QR</span>
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          disabled={cart.length === 0}
                          onClick={handlePrintProforma}
                          className="w-14 h-14 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 hover:text-slate-800 transition-all active:scale-95 disabled:opacity-50 border border-slate-200"
                          title="In tạm tính"
                        >
                          <FileText className="w-6 h-6" />
                        </button>
                        <button 
                          disabled={cart.length === 0}
                          onClick={() => setShowPaymentModal(true)}
                          className={cn(
                            "flex-1 h-14 rounded-xl text-sm font-bold uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden",
                            isReturnMode 
                              ? "bg-rose-600 text-white hover:bg-rose-700" 
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          )}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          {isReturnMode ? <ArrowRight className="w-5 h-5 -rotate-180" /> : <Zap className="w-5 h-5" />}
                          {isReturnMode ? "XÁC NHẬN TRẢ HÀNG" : "THANH TOÁN NHANH"}
                        </button>
                      </div>
                    </div>
                 </div>
              </div>
            </>
          ) : activeTab === 'tables' ? (
            <div className="col-span-12 bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex-1 flex flex-col gap-6 overflow-hidden animate-in slide-in-from-bottom-4">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-100 gap-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Grid3x3 className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="font-bold text-lg text-slate-900 leading-none">Sơ đồ Bàn / Phòng</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Trực quan hóa không gian phục vụ</p>
                     </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                     <span className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded border border-slate-200"><div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300" /> Trống ({tables.filter(t => t.status === 'available').length})</span>
                     <span className="flex items-center gap-2 px-2 py-1 bg-emerald-50 text-emerald-600 rounded border border-emerald-100"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Đang dùng ({tables.filter(t => t.status === 'occupied').length})</span>
                     <span className="flex items-center gap-2 px-2 py-1 bg-amber-50 text-amber-600 rounded border border-amber-100"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Đã đặt ({tables.filter(t => t.status === 'reserved').length})</span>
                     <span className="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-600 rounded border border-blue-100"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Đang dọn ({tables.filter(t => t.status === 'cleaning').length})</span>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto mt-2 pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                     {tables.map((table) => (
                        <div 
                          key={table.id} 
                          className={cn(
                            "aspect-square rounded-2xl border-2 flex flex-col p-4 cursor-pointer transition-all hover:-translate-y-1.5 hover:shadow-xl relative group overflow-hidden",
                            table.status === 'available' ? "bg-white border-slate-100 text-slate-400 hover:border-blue-400" :
                            table.status === 'occupied' ? "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm" :
                            table.status === 'reserved' ? "bg-amber-50 border-amber-200 text-amber-900" :
                            "bg-blue-50 border-blue-200 text-blue-900"
                          )}
                          onClick={() => {
                            if (table.status === 'available' || table.status === 'cleaning') {
                              alert(`Mở bàn ${table.name}`);
                            } else {
                              alert(`Xem đơn bàn ${table.name}`);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start mb-auto">
                             <div className={cn(
                               "w-8 h-8 rounded-lg flex items-center justify-center",
                               table.status === 'available' ? "bg-slate-50 text-slate-400" :
                               table.status === 'occupied' ? "bg-emerald-500 text-white" :
                               table.status === 'reserved' ? "bg-amber-500 text-white" :
                               "bg-blue-400 text-white"
                             )}>
                                <Coffee className="w-4.5 h-4.5" />
                             </div>
                             {table.status === 'occupied' && (
                                <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded shadow-sm">LIVE</span>
                             )}
                          </div>
                          
                          <div className="space-y-0.5">
                             <h4 className="font-black text-sm tracking-tight">{table.name}</h4>
                             <p className="text-[9px] font-bold text-slate-400 opacity-60 uppercase tracking-widest">{table.zone} • {table.capacity} chỗ</p>
                          </div>

                          {table.status === 'occupied' && (
                             <div className="mt-2 pt-2 border-t border-emerald-100 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                                <p className="text-[10px] font-black">{formatCurrency(table.currentOrder.total)}</p>
                                <span className="text-[9px] font-medium opacity-60">{table.currentOrder.items} món</span>
                             </div>
                          )}

                          {table.status === 'reserved' && (
                             <div className="mt-2 pt-2 border-t border-amber-100 flex items-center gap-1.5 text-amber-600 font-bold">
                                <Clock className="w-3 h-3" />
                                <span className="text-[9px]">{table.reservationTime}</span>
                             </div>
                          )}
                          
                          {/* Quick Actions Hover */}
                          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                             <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 hover:scale-110 transition-transform shadow-lg" onClick={(e) => { e.stopPropagation(); setSelectedTableForQr(table.id); }}>
                                <QrCode className="w-5 h-5" />
                             </button>
                             <p className="text-[10px] font-black text-white uppercase tracking-widest px-3 py-1.5 bg-white/20 rounded-lg">Chọn Bàn</p>
                          </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          ) : activeTab === 'handover' ? (
            <div className="col-span-12 bg-white rounded-lg border border-slate-200 shadow-sm p-10 flex-1 flex flex-col gap-8 animate-in slide-in-from-right-8 duration-500 overflow-y-auto no-scrollbar pb-20">
               <div className="flex items-center justify-between pb-8 border-b border-slate-100">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Clock className="w-7 h-7" />
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Bàn giao & Kết thúc Ca</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Xác nhận doanh thu tiền mặt và kết toán</p>
                     </div>
                  </div>
                  <button onClick={() => setActiveTab('sales')} className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all border border-slate-200">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-8">
                     <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 space-y-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-4">Tóm tắt hoạt động Ca</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Doanh thu Ca</p>
                              <p className="text-xl font-black text-slate-900">{formatCurrency(6850000)}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Tiền mặt thực tế</p>
                              <p className="text-xl font-black text-emerald-600">{formatCurrency(Number(actualCashInput))}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Tiền quẹt thẻ/QR</p>
                              <p className="text-xl font-black text-blue-600">{formatCurrency(2450000)}</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Kiểm tra thực tế</h3>
                        <div className="space-y-4">
                           <div>
                              <label className="text-xs font-black text-slate-500 mb-2 block uppercase">Nhập tiền mặt hiện có trong két</label>
                              <div className="relative">
                                 <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                 <input 
                                   type="number"
                                   className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-xl font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-50 transition-all shadow-sm"
                                   value={actualCashInput}
                                   onChange={(e) => setActualCashInput(e.target.value)}
                                   placeholder="0"
                                 />
                              </div>
                           </div>
                           <div>
                              <label className="text-xs font-black text-slate-500 mb-2 block uppercase">Ghi chú bàn giao</label>
                              <textarea 
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-rose-50 transition-all shadow-sm h-32 resize-none"
                                value={handoverNote}
                                onChange={(e) => setHandoverNote(e.target.value)}
                                placeholder="Ghi chú về tiền thừa, hỏng hóc hoặc sự cố trong ca..."
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="bg-indigo-600 rounded-2xl p-8 text-white space-y-6 shadow-xl shadow-indigo-200">
                        <div className="flex items-center gap-3">
                           <ShieldCheck className="w-6 h-6 text-indigo-200" />
                           <h4 className="font-bold text-lg">Pháp lý & Hệ thống</h4>
                        </div>
                        <ul className="space-y-4">
                           {[
                              'Dữ liệu đơn hàng đã được đẩy lên Cloud',
                              'Hợp đồng lao động & Chấm công đã ghi nhận',
                              'Sẵn sàng xuất hóa đơn VAT điện tử'
                           ].map((item, i) => (
                              <li key={i} className="flex gap-3 text-xs font-semibold leading-relaxed">
                                 <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                                 <span>{item}</span>
                              </li>
                           ))}
                        </ul>
                        <div className="pt-4 mt-4 border-t border-white/10">
                           <p className="text-[10px] font-bold text-indigo-400 uppercase mb-2">Nhân viên chốt ca</p>
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-[10px]">AD</div>
                              <span className="text-xs font-bold">{user?.displayName || 'Admin'}</span>
                           </div>
                        </div>
                     </div>

                     <button 
                       onClick={() => {
                          alert(`Đã chốt ca thành công! Doanh thu ghi nhận: ${formatCurrency(6850000)}. Tiền mặt thực tế: ${formatCurrency(Number(actualCashInput))}`);
                          setIsShiftActive(false);
                          setActiveTab('dashboard');
                       }}
                       className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 active:scale-95 flex items-center justify-center gap-3"
                     >
                        XÁC NHẬN CHỐT CA <ArrowRight className="w-5 h-5" />
                     </button>
                     <p className="text-[10px] text-center text-slate-400 font-bold italic leading-relaxed uppercase tracking-tighter">Hành động này sẽ gửi báo cáo kết ca về cho Quản lý và đóng cổng bán hàng của phiên hiện tại.</p>
                  </div>
               </div>
            </div>
          ) : activeTab === 'management' ? (
            <div className="col-span-12 bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden animate-in fade-in duration-500 min-h-[600px]">
               <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Settings2 className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Hệ thống Quản trị & Phân quyền</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Thiết lập cửa hàng & nhân sự • {activeStore?.name}</p>
                     </div>
                  </div>
                  <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                     <button 
                        onClick={() => setMgmtSubTab('revenue')}
                        className={cn(
                           "px-6 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                           mgmtSubTab === 'revenue' ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
                        )}
                     >
                        Báo cáo Doanh thu
                     </button>
                     <button 
                        onClick={() => setMgmtSubTab('staff')}
                        className={cn(
                           "px-6 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                           mgmtSubTab === 'staff' ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
                        )}
                     >
                        Nhân viên
                     </button>
                     <button 
                        onClick={() => setMgmtSubTab('store')}
                        className={cn(
                           "px-6 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                           mgmtSubTab === 'store' ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
                        )}
                     >
                        Cửa hàng
                     </button>
                     <button 
                        onClick={() => setMgmtSubTab('channels')}
                        className={cn(
                           "px-6 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                           mgmtSubTab === 'channels' ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
                        )}
                     >
                        Kênh bán hàng
                     </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-8">
                  {mgmtSubTab === 'revenue' ? (
                     <div className="space-y-8 animate-in backdrop-blur-sm">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                           {[
                              { label: 'Doanh thu hôm nay', value: formatCurrency(2450000), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                              { label: 'Số đơn hàng', value: '42', icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                              { label: 'Đơn trung bình', value: formatCurrency(58300), icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
                              { label: 'Tỷ lệ khách cũ', value: '32%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' }
                           ].map((stat, idx) => (
                              <div key={stat.label} className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                 <div className="flex justify-between items-start mb-4">
                                    <div className={cn("p-2 rounded-lg", stat.bg, stat.color)}>
                                       <stat.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live</span>
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                 <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                              </div>
                           ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                           <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm">
                              <div className="flex items-center justify-between mb-8">
                                 <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-600" /> Biểu đồ doanh thu tuần
                                 </h4>
                              </div>
                              <div className="h-[300px] w-full">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                       <defs>
                                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                             <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                             <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                          </linearGradient>
                                       </defs>
                                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                       <XAxis 
                                          dataKey="day" 
                                          axisLine={false} 
                                          tickLine={false} 
                                          tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                          dy={10}
                                       />
                                       <YAxis 
                                          axisLine={false} 
                                          tickLine={false} 
                                          tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                          tickFormatter={(value) => `${value / 1000000}M`}
                                       />
                                       <Tooltip 
                                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                          formatter={(value: any) => [formatCurrency(value), 'Doanh thu']}
                                       />
                                       <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                 </ResponsiveContainer>
                              </div>
                           </div>

                           <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm">
                              <h4 className="font-extrabold text-slate-900 mb-8 flex items-center gap-2">
                                 <PieChartIcon className="w-5 h-5 text-indigo-600" /> Tỷ lệ sản phẩm bán chạy
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                 <div className="h-[240px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                       <PieChart>
                                          <Pie
                                             data={topProducts}
                                             cx="50%"
                                             cy="50%"
                                             innerRadius={60}
                                             outerRadius={80}
                                             paddingAngle={5}
                                             dataKey="value"
                                          >
                                             {topProducts.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#4f46e5', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                                             ))}
                                          </Pie>
                                          <Tooltip />
                                       </PieChart>
                                    </ResponsiveContainer>
                                 </div>
                                 <div className="space-y-4">
                                    {topProducts.map((p, i) => (
                                       <div key={i} className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'][i % 4] }} />
                                             <span className="text-xs font-bold text-slate-600">{p.name}</span>
                                          </div>
                                          <span className="text-xs font-black text-slate-900">{p.value}%</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-slate-900 rounded-lg p-8 text-white relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-50" />
                           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                              <div className="space-y-4 text-center md:text-left">
                                 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">AI Insight • Phân tích Doanh thu</span>
                                 </div>
                                 <h3 className="text-2xl font-black tracking-tight leading-tight max-w-md">Doanh thu dự kiến tháng này đạt 185,000,000 VND (Tăng 12%)</h3>
                                 <p className="text-sm text-indigo-100 opacity-70">Model AI đề xuất nhập thêm 20% nguyên liệu "Cafe Phin" cho ngày Thứ 7 & Thứ 8 để tránh cháy hàng.</p>
                              </div>
                              <button className="px-8 py-4 bg-white text-indigo-600 font-black text-xs uppercase tracking-widest rounded-lg shadow-xl hover:scale-105 transition-all">Chi tiết dự báo AI</button>
                           </div>
                        </div>
                     </div>
                  ) : mgmtSubTab === 'channels' ? (
                     <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex justify-between items-center">
                           <div>
                              <h4 className="text-xl font-black text-slate-900 tracking-tight">Liên kết Kênh bán hàng (Delivery)</h4>
                              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Đồng bộ menu & đơn hàng với các nền tảng giao hàng</p>
                           </div>
                           <button className="px-6 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-lg hover:shadow-indigo-100 transition-all">Quét thiết bị POS mới</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {[
                              { name: 'GrabFood', status: 'Hỗ trợ', color: 'bg-emerald-500', logo: 'Grab', desc: 'Đồng bộ đơn hàng, menu tự động.' },
                              { name: 'BeFood', status: 'Đã kết nối', color: 'bg-yellow-400', logo: 'Be', desc: 'Tích hợp thanh toán bePay & Giao hàng.' },
                              { name: 'Green SM', status: 'Sẵn sàng', color: 'bg-emerald-400', logo: 'GSM', desc: 'Vận chuyển bằng xe điện Xanh SM.' },
                              { name: 'ShopeeFood', status: 'Chưa liên kết', color: 'bg-orange-600', logo: 'Shopee', desc: 'Kích hoạt để nhận đơn từ Shopee.' }
                           ].map((platform, idx) => (
                              <div key={idx} className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                                 <div className="flex justify-between items-start mb-6">
                                    <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center text-white font-black text-xs", platform.color)}>
                                       {platform.logo}
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className={cn(
                                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                          platform.status === 'Đã kết nối' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                                       )}>
                                          {platform.status}
                                       </span>
                                       <div className="mt-4 flex items-center gap-2">
                                          <div className={cn("w-2 h-2 rounded-full", platform.status === 'Đã kết nối' ? "bg-emerald-500 animate-pulse" : "bg-slate-200")} />
                                          <span className="text-[10px] font-bold text-slate-400">API: Up</span>
                                       </div>
                                    </div>
                                 </div>
                                 <h5 className="text-lg font-black text-slate-900 mb-2">{platform.name}</h5>
                                 <p className="text-xs text-slate-400 font-medium mb-6 leading-relaxed">{platform.desc}</p>
                                 <div className="pt-6 border-t border-slate-50 flex gap-3">
                                    <button className="flex-1 py-3 bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-100 transition-all">Cấu hình</button>
                                    <button className={cn(
                                       "flex-1 py-3 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all",
                                       platform.status === 'Đã kết nối' ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-indigo-600 text-white hover:bg-indigo-700"
                                    )}>
                                       {platform.status === 'Đã kết nối' ? 'Ngắt kết nối' : 'Kết nối ngay'}
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>

                        <div className="bg-emerald-900 rounded-lg p-10 text-white relative overflow-hidden">
                           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                              <div className="space-y-4">
                                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 rounded-full">
                                    <Sparkles className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Tính năng mới • Hệ thống iPOS</span>
                                 </div>
                                 <h4 className="text-3xl font-black tracking-tight leading-tight max-w-xl">
                                    Tự động điều phối Driver Xanh SM & Grab cho các đơn hàng độc lập từ iPOS E-Menu.
                                 </h4>
                                 <p className="text-emerald-100/70 text-sm max-w-lg">
                                    Hệ thống sẽ tự động gọi tài xế gần nhất để giao hàng khi bạn chốt đơn tại quầy hoặc từ các kênh online, tối ưu hóa thời gian vận chuyển.
                                 </p>
                              </div>
                              <button className="px-10 py-5 bg-white text-emerald-900 font-black text-xs uppercase tracking-widest rounded-lg shadow-2xl hover:scale-105 active:scale-95 transition-all">Kích hoạt Smart Shipping</button>
                           </div>
                           <Layers className="absolute -bottom-12 -right-12 w-64 h-64 text-white/5 rotate-12" />
                        </div>
                     </div>
                  ) : mgmtSubTab === 'staff' ? (
                     <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                           <div>
                              <h3 className="font-bold text-slate-800">Danh sách nhân sự ({staffList.length})</h3>
                              <p className="text-xs text-slate-500 font-medium">Quản lý tài khoản truy cập và vai trò của nhân viên tại chi nhánh này.</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <button 
                                onClick={() => navigate('/ipos-settings')}
                                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                              >
                                 <Shield className="w-4 h-4" /> Cài đặt Phân quyền
                              </button>
                              <button 
                                onClick={() => { setEditingStaff(null); setIsAddingStaff(true); }}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                              >
                                 <Plus className="w-4 h-4" /> Thêm nhân sự mới
                              </button>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                           {staffList.map(staff => (
                              <div key={staff.id} className="group relative bg-white border border-slate-200 rounded-lg p-6 hover:border-indigo-500 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                                 <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                       <User className="w-6 h-6" />
                                    </div>
                                    <div className={cn(
                                       "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                       staff.role === 'admin' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                       staff.role === 'manager' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                       "bg-blue-50 text-blue-600 border-blue-100"
                                    )}>
                                       {staff.role}
                                    </div>
                                 </div>
                                 <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{staff.fullName}</h4>
                                 <p className="text-xs text-slate-500 font-medium mb-1">{staff.email}</p>
                                 <p className="text-[10px] text-slate-300 font-mono font-bold">{staff.id}</p>
                                 
                                 <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                       <div className={cn("w-2 h-2 rounded-full", staff.status === 'active' ? "bg-emerald-500" : "bg-slate-300")} />
                                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{staff.status === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}</span>
                                    </div>
                                    <div className="flex gap-2">
                                       <button onClick={() => { setEditingStaff(staff); setIsAddingStaff(true); }} className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg"><Key className="w-4 h-4" /></button>
                                       <button onClick={() => handleDeleteStaff(staff.id)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-8 max-w-2xl">
                        <div className="space-y-2">
                           <h3 className="font-bold text-slate-800">Cấu hình Chi nhánh</h3>
                           <p className="text-xs text-slate-500 font-medium">Thiết lập các quy tắc vận hành cho chi nhánh <span className="font-bold text-indigo-600">{activeStore?.name}</span>.</p>
                        </div>
                        
                        <div className="space-y-6">
                           <div className="bg-slate-50 p-6 rounded-lg space-y-4">
                              <div className="flex justify-between items-center">
                                 <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-slate-900">Mở ca làm việc bắt buộc</p>
                                    <p className="text-xs text-slate-500">Yêu cầu nhân viên khai báo két tiền trước khi bắt đầu bán hàng.</p>
                                 </div>
                                 <button 
                                    onClick={() => handleUpdateStoreConfig('requireShiftOpening', !activeStoreConfig?.config?.requireShiftOpening)}
                                    className={cn(
                                       "w-12 h-6 rounded-full p-1 transition-all",
                                       activeStoreConfig?.config?.requireShiftOpening ? "bg-indigo-600" : "bg-slate-300"
                                    )}
                                 >
                                    <div className={cn("w-4 h-4 bg-white rounded-full transition-all", activeStoreConfig?.config?.requireShiftOpening && "translate-x-6")} />
                                 </button>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                 <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-slate-900">Tự động in hóa đơn</p>
                                    <p className="text-xs text-slate-500">In phiếu thu ngay sau khi hoàn tất thanh toán.</p>
                                 </div>
                                 <button 
                                    onClick={() => handleUpdateStoreConfig('printReceiptAutomatically', !activeStoreConfig?.config?.printReceiptAutomatically)}
                                    className={cn(
                                       "w-12 h-6 rounded-full p-1 transition-all",
                                       activeStoreConfig?.config?.printReceiptAutomatically ? "bg-indigo-600" : "bg-slate-300"
                                    )}
                                 >
                                    <div className={cn("w-4 h-4 bg-white rounded-full transition-all", activeStoreConfig?.config?.printReceiptAutomatically && "translate-x-6")} />
                                 </button>
                              </div>

                              <div className="flex justify-between items-center">
                                 <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-slate-900">Cho phép trả hàng</p>
                                    <p className="text-xs text-slate-500">Kích hoạt tính năng hoàn tiền cho các hóa đơn đã thanh toán.</p>
                                 </div>
                                 <button 
                                    onClick={() => handleUpdateStoreConfig('allowReturns', !activeStoreConfig?.config?.allowReturns)}
                                    className={cn(
                                       "w-12 h-6 rounded-full p-1 transition-all",
                                       activeStoreConfig?.config?.allowReturns ? "bg-indigo-600" : "bg-slate-300"
                                    )}
                                 >
                                    <div className={cn("w-4 h-4 bg-white rounded-full transition-all", activeStoreConfig?.config?.allowReturns && "translate-x-6")} />
                                 </button>
                              </div>
                           </div>

                           <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-4">
                              <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
                              <div className="space-y-1">
                                 <p className="text-sm font-bold text-indigo-900">Quyền hạn của bạn</p>
                                 <p className="text-xs text-indigo-700 leading-relaxed">Bạn đang truy cập với vai trò <span className="font-black uppercase tracking-widest">{userRole}</span>. Bạn có toàn quyền thiết lập nhân sự và cấu hình chi tiết cho cửa hàng này.</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
          ) : activeTab === 'delivery' ? (
             <div className="col-span-12 bg-white rounded-lg border border-slate-200 p-8 flex-1 animate-in slide-in-from-bottom-4 overflow-y-auto">
               <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đối tác Giao hàng</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Đơn đặt hàng từ ứng dụng ngoài</p>
                  </div>
               </div>

               {discrepancyPrompt && (
                 <div className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
                   <div className="bg-white rounded-lg max-w-lg shadow-2xl p-8 space-y-6">
                     <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                       <AlertCircle className="w-8 h-8" />
                     </div>
                     <div className="text-center">
                       <h3 className="text-lg font-black text-slate-900 mb-2">Phát hiện Sai lệch Thông tin</h3>
                       <p className="text-sm text-slate-600 leading-relaxed">{discrepancyPrompt.message}</p>
                     </div>
                     <div className="flex gap-4 pt-4 border-t border-slate-100">
                       <button 
                         onClick={() => proceedWithExternalOrder(discrepancyPrompt.order, null)} 
                         className="flex-1 py-3 bg-white border border-slate-200 shadow-sm text-slate-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all font-semibold"
                       >
                         Tạo KH Mới
                       </button>
                       <button 
                         onClick={() => proceedWithExternalOrder(discrepancyPrompt.order, discrepancyPrompt.matchedCustomer)} 
                         className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                       >
                         Liên kết
                       </button>
                     </div>
                   </div>
                 </div>
               )}

               {incomingExternalOrders.length === 0 ? (
                 <div className="py-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                      <Building2 className="w-8 h-8" />
                   </div>
                   <p className="text-sm font-bold text-slate-400">Không có đơn hàng mới nào</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {incomingExternalOrders.map(order => (
                     <div key={order.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:border-indigo-300 transition-all group flex flex-col relative overflow-hidden">
                       <div className={cn(
                          "absolute top-0 left-0 w-full h-1",
                          order.platform === 'GrabFood' ? 'bg-emerald-500' :
                          order.platform === 'BeFood' ? 'bg-yellow-400' :
                          order.platform === 'Green SM' ? 'bg-emerald-400' :
                          order.platform === 'ShopeeFood' ? 'bg-orange-500' : 'bg-slate-400'
                       )} />
                       <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded line-clamp-1",
                              order.platform === 'GrabFood' ? 'bg-emerald-50 text-emerald-700' :
                              order.platform === 'BeFood' ? 'bg-yellow-50 text-yellow-700' :
                              order.platform === 'Green SM' ? 'bg-emerald-50 text-emerald-600' :
                              order.platform === 'ShopeeFood' ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-700'
                            )}>{order.platform}</span>
                            <h3 className="font-bold text-slate-900 mt-2">{order.customerName}</h3>
                            <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">{order.targetPhone}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-black text-indigo-600">{formatCurrency(order.total)}</p>
                             <p className="text-[10px] text-slate-400 font-bold mt-1">{order.items.length} món</p>
                          </div>
                       </div>
                       
                       <div className="flex-1 space-y-2 mb-6">
                          {order.items.map((item: any, idx: number) => (
                             <div key={idx} className="flex justify-between text-xs text-slate-600">
                               <span>{item.quantity}x {item.name}</span>
                             </div>
                          ))}
                       </div>

                       <button 
                         onClick={() => handleProcessExternalOrder(order)}
                         className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                       >
                          Nhận & Gọi Tài xế
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          ) : activeTab === 'lookup' ? (
            <div className="col-span-12 bg-white rounded-lg border border-slate-200 shadow-sm p-10 flex-1 animate-in slide-in-from-left-4">
               <button onClick={() => setActiveTab('sales')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 mb-6 transition-colors">
                  <Undo2 className="w-4 h-4" /> Quay lại
               </button>
               
               {selectedProductLookup && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="aspect-square bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center relative overflow-hidden">
                       <Monitor className="w-24 h-24 text-slate-200" />
                       <div className="absolute top-6 left-6 bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg">In Stock</div>
                    </div>
                    <div className="space-y-8">
                       <div className="flex justify-between items-start">
                          <div>
                             <h2 className="text-3xl font-bold text-slate-900 mb-1 leading-tight">{selectedProductLookup.name}</h2>
                             <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{selectedProductLookup.id}</p>
                          </div>
                          <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                             <RefreshCcw className="w-4 h-4" /> Đặt giữ hàng
                          </button>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-6">
                          <div className="p-5 bg-slate-50 rounded-lg space-y-1">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Giá bán</p>
                             <p className="text-xl font-bold text-slate-900">{formatCurrency(selectedProductLookup.price)}</p>
                          </div>
                          <div className="p-5 bg-emerald-50 rounded-lg space-y-1 border border-emerald-100">
                             <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Tồn kho hệ thống</p>
                             <p className="text-xl font-bold text-emerald-600">{selectedProductLookup.stock || 0}</p>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-900 flex items-center gap-2">
                             <RefreshCcw className="w-3.5 h-3.5 text-indigo-600" /> Liên chi nhánh
                          </h4>
                          <div className="space-y-2">
                             <div className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-indigo-200 transition-all">
                                <span className="text-sm font-medium text-slate-700">CN Quận 1 (Chính)</span>
                                <span className="font-bold text-xs text-indigo-600">{selectedProductLookup.stock || 0} sp</span>
                             </div>
                          </div>
                       </div>

                       <button 
                         onClick={() => { addToCart(selectedProductLookup); setActiveTab('sales'); }}
                         className="w-full py-5 bg-indigo-600 text-white rounded-lg font-bold text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
                       >
                         Thêm vào đơn hàng
                       </button>
                    </div>
                 </div>
               )}
            </div>
          ) : (
            <div className="col-span-12 bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex-1 overflow-y-auto">
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
                      <div key={order.id} className="p-5 bg-rose-50/50 rounded-lg border border-rose-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
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
                             className="flex-1 py-2.5 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                           >
                              Nhận & Xử lý
                           </button>
                           <button 
                             onClick={() => handleDeclineOrder(order.id)}
                             className="px-4 py-2.5 bg-white text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-200 hover:bg-rose-50 transition-all active:scale-95"
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
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-5 bg-slate-50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group"
                    onClick={() => setSelectedTxForDetail(tx)}
                  >
                    <div className="flex items-center gap-5">
                       <div className="w-10 h-10 bg-white rounded-lg shadow-inner flex items-center justify-center font-bold text-xs text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors uppercase">{tx.time}</div>
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
                       <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          )}
        </div>
      
      {/* Print Proforma View */}
      <div className="hidden print:block w-[80mm] p-4 text-black bg-white font-mono text-xs">
          <h2 className="text-center font-bold text-xl uppercase mb-2">HÓA ĐƠN TẠM TÍNH</h2>
          <p className="text-center">{activeStore?.name || 'VComm ERP Store'}</p>
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
          <h1 className="text-sm font-bold uppercase">VComm ERP iPOS System</h1>
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

      {/* Staff Management MODAL */}
      <AnimatePresence>
        {isAddingStaff && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white rounded-lg w-full max-w-xl shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
                         <UserCheck className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingStaff ? 'Cập nhật nhân sự' : 'Thêm nhân sự mới'}</h3>
                   </div>
                   <button onClick={() => setIsAddingStaff(false)} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm"><X className="w-6 h-6 text-slate-400" /></button>
                </div>
                
                <div className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Họ và tên</label>
                         <input 
                           type="text" 
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none"
                           placeholder="Nguyễn Văn A"
                           value={staffForm.fullName}
                           onChange={(e) => setStaffForm({...staffForm, fullName: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Số điện thoại</label>
                         <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none font-mono"
                            placeholder="09xxx"
                            value={staffForm.phone}
                            onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Địa chỉ Email (Để đăng nhập)</label>
                      <input 
                         type="email" 
                         className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none"
                         placeholder="staff@example.com"
                         value={staffForm.email}
                         onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                      />
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vai trò & Phân quyền</label>
                      <div className="grid grid-cols-3 gap-3">
                         {[
                            { id: 'employee', name: 'Nhân viên', icon: User, desc: 'Chỉ bán hàng' },
                            { id: 'manager', name: 'Quản lý', icon: ShieldCheck, desc: 'Quản lý kho/ca' },
                            { id: 'admin', name: 'Admin', icon: Key, desc: 'Toàn quyền' }
                         ].map(role => (
                            <button 
                              key={role.id}
                              onClick={() => setStaffForm({...staffForm, role: role.id as any})}
                              className={cn(
                                 "p-4 rounded-lg border-2 transition-all text-left flex flex-col gap-2 relative group",
                                 staffForm.role === role.id ? "bg-indigo-50 border-indigo-600 shadow-lg shadow-indigo-100" : "bg-white border-slate-100 hover:border-slate-200"
                              )}
                            >
                               {staffForm.role === role.id && (
                                  <div className="absolute top-2 right-2">
                                     <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                  </div>
                               )}
                               <role.icon className={cn("w-6 h-6 mb-1", staffForm.role === role.id ? "text-indigo-600" : "text-slate-300")} />
                               <p className={cn("text-xs font-black", staffForm.role === role.id ? "text-indigo-600" : "text-slate-600")}>{role.name}</p>
                               <p className="text-[9px] font-medium text-slate-400">{role.desc}</p>
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                   <button 
                     onClick={() => setIsAddingStaff(false)}
                     className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 font-bold rounded-lg hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
                   >
                      Hủy bỏ
                   </button>
                   <button 
                      onClick={() => handleSaveStaff(staffForm)}
                      className="flex-[2] py-4 bg-indigo-600 text-white rounded-lg font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                   >
                      {editingStaff ? 'Cập nhật thay đổi' : 'Xác nhận thêm mới'}
                   </button>
                </div>
             </motion.div>
         </div>
          )}
       </AnimatePresence>

       {/* Receipt Detail Modal */}
       <AnimatePresence>
         {selectedTxForDetail && (
            <div className="fixed inset-0 z-[200] flex items-center justify-end p-0 bg-slate-900/40 backdrop-blur-sm">
               <motion.div 
                 initial={{ x: '100%' }}
                 animate={{ x: 0 }}
                 exit={{ x: '100%' }}
                 className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col"
               >
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                           <FileText className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-slate-900 tracking-tight">Chi tiết Hóa đơn</h3>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mã giao dịch: {selectedTxForDetail.id}</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedTxForDetail(null)} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm">
                        <X className="w-6 h-6 text-slate-400" />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8">
                     <div className="bg-slate-50 rounded-lg p-8 border border-dashed border-slate-200 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">E-Receipt Digital</div>
                        
                        <div className="text-center mb-8 space-y-2">
                           <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{activeStore?.name}</p>
                           <p className="text-[10px] text-slate-500 font-medium">{activeStore?.address}</p>
                           <p className="text-[10px] text-slate-500 font-medium">SĐT: 1900 1234</p>
                        </div>

                        <div className="space-y-4 mb-8">
                           <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>Mô tả</span>
                              <span>Thành tiền</span>
                           </div>
                           <div className="h-px bg-slate-200 w-full" />
                           {/* Mocking items for history detail since history list doesn't have partial items in this mock state */}
                           {[1, 2].map((_, i) => (
                              <div key={i} className="flex justify-between items-start">
                                 <div>
                                    <p className="text-xs font-black text-slate-900">Sản phẩm mẫu {i+1}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">1 x {formatCurrency(selectedTxForDetail.total / 2)}</p>
                                 </div>
                                 <span className="text-xs font-black text-slate-900">{formatCurrency(selectedTxForDetail.total / 2)}</span>
                              </div>
                           ))}
                        </div>

                        <div className="space-y-2 border-t border-dashed border-slate-200 pt-6">
                           <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <span>Tổng tiền</span>
                              <span>{formatCurrency(selectedTxForDetail.total)}</span>
                           </div>
                           <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <span>Thuế (VAT 8%)</span>
                              <span>{formatCurrency(selectedTxForDetail.total * 0.08)}</span>
                           </div>
                           <div className="flex justify-between items-center pt-4">
                              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Tổng cộng</span>
                              <span className="text-xl font-black text-indigo-600">{formatCurrency(selectedTxForDetail.total)}</span>
                           </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100 text-center space-y-6">
                           <div className="flex justify-center">
                              <div className="bg-slate-900 p-2 rounded-lg">
                                 <QrCode className="w-24 h-24 text-white" />
                              </div>
                           </div>
                           <p className="text-[10px] text-slate-400 font-medium italic">Vui lòng giữ lại hóa đơn để được hỗ trợ bảo hành & đổi trả trong vòng 7 ngày.</p>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 border-t border-slate-100 grid grid-cols-2 gap-4 bg-slate-50/50">
                     <button className="flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all shadow-sm">
                        <Download className="w-4 h-4" /> Lưu ảnh
                     </button>
                     <button 
                        onClick={() => window.print()}
                        className="flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                     >
                        <Printer className="w-4 h-4" /> In hóa đơn
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
       </AnimatePresence>

       {/* Table E-Menu QR Modal */}
       <AnimatePresence>
         {selectedTableForQr !== null && (
           <div className="fixed inset-0 z-[300] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative"
             >
                <div className="absolute top-4 right-4 z-10">
                   <button 
                     onClick={() => setSelectedTableForQr(null)}
                     className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="p-8 text-center space-y-6">
                   <div className="space-y-1 pt-4">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">QR E-Menu</h3>
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{tables.find(t => t.id === selectedTableForQr)?.name} • {tables.find(t => t.id === selectedTableForQr)?.zone}</p>
                   </div>

                   <div className="bg-slate-50 p-10 rounded-3xl border-2 border-dashed border-slate-200 relative group">
                      <div className="aspect-square bg-white rounded-2xl shadow-inner flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                         <QrCode className="w-40 h-40 text-slate-900" />
                         
                         {/* Visual overlay for logo branding */}
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 bg-white rounded-lg shadow-xl flex items-center justify-center border-4 border-slate-50">
                               <Store className="w-6 h-6 text-indigo-600" />
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3 justify-center text-xs font-bold text-emerald-600 bg-emerald-50 py-3 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" /> QR Code đã được kích hoạt
                   </div>
                   
                   <div className="space-y-4">
                      <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed uppercase tracking-tighter">Khách hàng quét mã này để truy cập thực đơn trực tuyến và đặt món trực tiếp tại bàn.</p>
                      <button 
                        onClick={() => {
                          alert('Đang tải xuống QR Code...');
                          setSelectedTableForQr(null);
                        }}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                      >
                         <Download className="w-4 h-4" /> Tải mã QR
                      </button>
                   </div>
                </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
     </div>
  );
}
