import { safeLocalStorage } from '../lib/storage';
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Search, 
  Package, 
  Layers, 
  Printer, 
  Check, 
  X, 
  Sparkles, 
  Tag, 
  UserPlus, 
  UserCheck, 
  ChevronRight, 
  ArrowRight,
  TrendingUp, 
  LineChart, 
  Sliders, 
  FileCheck,
  Building,
  QrCode,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { db, collection, addDoc, onSnapshot, query, doc, updateDoc, arrayUnion } from '../services/dbService';

interface SupermarketProduct {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  category: 'food' | 'drink' | 'household' | 'other';
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  shelfLocation: string;
}

interface CartItem {
  product: SupermarketProduct;
  quantity: number;
}

const SUPERMARKET_MOCK_ITEMS: SupermarketProduct[] = [
  { id: "sm-p-1", sku: "SM-FOOD-001", name: "Thịt bò ba chỉ Mỹ khay 500g", barcode: "893112233441", category: "food", price: 185000, cost: 135000, stock: 45, minStock: 10, shelfLocation: "Tủ mát số 2" },
  { id: "sm-p-2", sku: "SM-DRINK-001", name: "Red Bull Thái lon vàng 250ml", barcode: "885112233442", category: "drink", price: 15000, cost: 9500, stock: 350, minStock: 50, shelfLocation: "Kệ đồ uống A1" },
  { id: "sm-p-3", sku: "SM-DRINK-002", name: "Nước khoáng Lavie 500ml", barcode: "893112233443", category: "drink", price: 6000, cost: 3200, stock: 500, minStock: 80, shelfLocation: "Kệ đồ uống A2" },
  { id: "sm-p-4", sku: "SM-FOOD-002", name: "Mì ăn liền Indomie Goreng khô bao 5 gói", barcode: "893112233444", category: "food", price: 29000, cost: 18000, stock: 120, minStock: 20, shelfLocation: "Kệ ăn liền B3" },
  { id: "sm-p-5", sku: "SM-HOUSE-001", name: "Nước rửa chén Sunlight Trà Xanh 1.4kg", barcode: "893112233445", category: "household", price: 58000, cost: 42000, stock: 45, minStock: 8, shelfLocation: "Kệ hóa chất C1" },
  { id: "sm-p-6", sku: "SM-FOOD-003", name: "Sữa tươi TH True Milk ít đường hộp 1L", barcode: "893112233446", category: "food", price: 36000, cost: 28000, stock: 85, minStock: 15, shelfLocation: "Tủ mát sữa số 1" },
  { id: "sm-p-7", sku: "SM-FOOD-004", name: "Táo Fuji Organic nhập khẩu túi 1kg", barcode: "893112233447", category: "food", price: 95000, cost: 65000, stock: 30, minStock: 10, shelfLocation: "Đảo trái cây" },
  { id: "sm-p-6", sku: "SM-HOUSE-002", name: "Khăn giấy rút cao cấp Silkwell 3 lớp", barcode: "893112233448", category: "household", price: 22000, cost: 14000, stock: 150, minStock: 25, shelfLocation: "Kệ gia dụng D2" }
];

export function VCommSupermarket() {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory'>('pos');
  const [products, setProducts] = useState<SupermarketProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'food' | 'drink' | 'household' | 'other'>('all');
  
  // Checkout POS Cart system
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [customerName, setCustomerName] = useState('Khách lẻ');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vietqr' | 'card'>('cash');
  const [cashAmountReceive, setCashAmountReceive] = useState<number>(0);
  
  // Inventory form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSKU, setNewSKU] = useState('');
  const [newName, setNewName] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newCategory, setNewCategory] = useState<'food' | 'drink' | 'household' | 'other'>('food');
  const [newPrice, setNewPrice] = useState(0);
  const [newCost, setNewCost] = useState(0);
  const [newStock, setNewStock] = useState(0);
  const [newMinStock, setNewMinStock] = useState(5);
  const [newShelf, setNewShelf] = useState('');

  // Print view receipt parameters
  const [showReceiptPrintModal, setShowReceiptPrintModal] = useState(false);
  const [completedBillData, setCompletedBillData] = useState<any | null>(null);

  // Sync products from db on mount
  useEffect(() => {
    const qProds = query(collection(db, 'vcomm_sm_products'));
    const unsubscribe = onSnapshot(qProds, (snap) => {
      const prods: SupermarketProduct[] = [];
      snap.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as SupermarketProduct);
      });

      if (prods.length === 0) {
        SUPERMARKET_MOCK_ITEMS.forEach(async (p) => {
          try {
            await addDoc(collection(db, 'vcomm_sm_products'), p);
          } catch (e) {
            console.error("Error creating super product mock: ", e);
          }
        });
        setProducts(SUPERMARKET_MOCK_ITEMS);
      } else {
        setProducts(prods);
      }
      setLoading(false);
    }, (error) => {
      console.warn("DB querying Vcomm Supermarket failed, using storage:", error);
      const localStock = safeLocalStorage.getItem('vcomm_sm_stock');
      if (localStock) {
        setProducts(JSON.parse(localStock));
      } else {
        setProducts(SUPERMARKET_MOCK_ITEMS);
        safeLocalStorage.setItem('vcomm_sm_stock', JSON.stringify(SUPERMARKET_MOCK_ITEMS));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Write catalog to localstorage
  useEffect(() => {
    if (products.length > 0) {
      safeLocalStorage.setItem('vcomm_sm_stock', JSON.stringify(products));
    }
  }, [products]);

  // Cart helper functions
  const addToCart = (product: SupermarketProduct) => {
    if (product.stock <= 0) {
      alert("Sản phẩm đã hết hàng trong siêu thị, vui lòng nhập bổ sung kho trước!");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Không thể thêm thêm! Kho siêu thị chỉ còn tồn ${product.stock} sản phẩm.`);
          return prev;
        }
        return prev.map((item) => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, val: number) => {
    const targetItem = cart.find(i => i.product.id === productId);
    if (!targetItem) return;

    if (val <= 0) {
      removeFromCart(productId);
      return;
    }

    if (val > targetItem.product.stock) {
      alert(`Chỉ còn ${targetItem.product.stock} mặt hàng trong kho siêu thị.`);
      return;
    }

    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: val }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Pricing calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const taxAmount = Math.round(subtotal * 0.08); // Fixed 8% VAT supermarket incentive rate
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const finalTotal = subtotal + taxAmount - discountAmount;

  // Save order and deduct stock
  const handleCheckoutAndPrint = async () => {
    if (cart.length === 0) {
      alert("Giỏ hàng siêu thị đang trống!");
      return;
    }

    if (paymentMethod === 'cash' && cashAmountReceive < finalTotal) {
      alert(`Cảnh báo: Khách đưa thiếu tiền! Cần trả tối thiểu ${formatCurrency(finalTotal)}`);
      return;
    }

    const orderId = `VCM-SM-${Date.now().toString().slice(-6)}`;
    const billItems = cart.map(item => ({
      name: item.product.name,
      sku: item.product.sku,
      price: item.product.price,
      quantity: item.quantity,
      total: item.product.price * item.quantity
    }));

    const billPayload = {
      orderId,
      customerName,
      customerPhone: customerPhone || "N/A",
      items: billItems,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total: finalTotal,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cashAmountReceive : finalTotal,
      cashChange: paymentMethod === 'cash' ? Math.max(0, cashAmountReceive - finalTotal) : 0,
      timestamp: new Date().toLocaleString('vi-VN'),
      operator: "Thu Ngân VComm Offline"
    };

    // Trigger local reactive inventory deduction
    const updatedProducts = products.map(prod => {
      const cartMatch = cart.find(item => item.product.id === prod.id);
      if (cartMatch) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartMatch.quantity)
        };
      }
      return prod;
    });

    setProducts(updatedProducts);

    // Save to server
    try {
      await addDoc(collection(db, 'vcomm_sm_orders'), billPayload);
      
      // Update each product's stock in Firebase on a simple batch logic
      cart.forEach(async (item) => {
        try {
          const prodRef = doc(db, 'vcomm_sm_products', item.product.id);
          const currentStock = products.find(p => p.id === item.product.id)?.stock || 1;
          await updateDoc(prodRef, {
            stock: Math.max(0, currentStock - item.quantity)
          });
        } catch(e) {
          console.warn("Stock update fail:", e);
        }
      });
    } catch (err) {
      console.warn("Error recording billing order: ", err);
    }

    setCompletedBillData(billPayload);
    setShowReceiptPrintModal(true);
    setCart([]);
    setCashAmountReceive(0);
    setCustomerName('Khách lẻ');
    setCustomerPhone('');
  };

  // Generate K80 Print overlay and trigger print dialog
  const printK80ThermalInvoice = () => {
    const styleId = 'k80-print-override-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      @media print {
        @page {
          size: 80mm auto !important;
          margin: 0 !important;
        }
        body * {
          visibility: hidden !important;
        }
        #vcomm-k80-print-document, #vcomm-k80-print-document * {
          visibility: visible !important;
        }
        #vcomm-k80-print-document {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 80mm !important;
          margin: 0 !important;
          padding: 4mm !important;
          box-shadow: none !important;
          border: none !important;
          background: white !important;
          color: black !important;
        }
      }
    `;

    document.body.classList.add('printing-k80');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-k80');
        styleEl?.remove();
      }, 1000);
    }, 150);
  };

  // Add inventory product trigger
  const handleAddNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSKU || !newName || !newPrice) {
      alert("Vui lòng nhập SKU, tên mặt hàng và giá bán!");
      return;
    }

    const payload: Omit<SupermarketProduct, 'id'> = {
      sku: newSKU,
      name: newName,
      barcode: newBarcode || `893${Date.now().toString().slice(-9)}`,
      category: newCategory,
      price: Number(newPrice),
      cost: Number(newCost) || Math.round(newPrice * 0.7),
      stock: Number(newStock) || 0,
      minStock: Number(newMinStock) || 5,
      shelfLocation: newShelf || "Bàn giao sau"
    };

    try {
      await addDoc(collection(db, 'vcomm_sm_products'), payload);
      setShowAddModal(false);
      // reset form
      setNewSKU('');
      setNewName('');
      setNewBarcode('');
      setNewPrice(0);
      setNewCost(0);
      setNewStock(0);
      setNewShelf('');
    } catch(err) {
      // Local fallback
      const manualId = `p-manual-${Date.now()}`;
      setProducts(prev => [...prev, { id: manualId, ...payload }]);
      setShowAddModal(false);
    }
  };

  // Fast stock adjustments
  const adjustProductStock = async (prodId: string, delta: number) => {
    const matched = products.find(p => p.id === prodId);
    if (!matched) return;
    const finalStock = Math.max(0, matched.stock + delta);

    try {
      const prodRef = doc(db, 'vcomm_sm_products', prodId);
      await updateDoc(prodRef, {
        stock: finalStock
      });
    } catch(err) {
      setProducts(prev => prev.map(p => p.id === prodId ? {...p, stock: finalStock} : p));
    }
  };

  // Filter Catalog lists
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = 
      prod.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.barcode.includes(searchTerm) ||
      prod.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (categoryFilter === 'all') return matchesSearch;
    return matchesSearch && prod.category === categoryFilter;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'food': return 'Thực phẩm';
      case 'drink': return 'Đồ uống';
      case 'household': return 'Hóa mỹ phẩm';
      default: return 'Khác';
    }
  };

  const stats = {
    totalSkus: products.length,
    lowStockSkus: products.filter(p => p.stock <= p.minStock).length,
    totalStockUnits: products.reduce((sum, item) => sum + item.stock, 0),
    inventoryValuation: products.reduce((sum, item) => sum + (item.price * item.stock), 0)
  };

  return (
    <div className="space-y-6">
      {/* Supermarket Dashboard Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-950 to-emerald-900 rounded-lg p-6 text-white shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full">COMMERCE RETALER</span>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Building className="w-2.5 h-2.5" /> Chuỗi Siêu Thị Offline VComm
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-100">Siêu Thị Offline VComm</h2>
          <p className="text-xs md:text-sm text-emerald-150 max-w-2xl mt-1.5">
            Phần mềm quản lý tính tiền tại quầy (POS), quản trị mã kho hàng, phân khu kệ quầy và in bill hóa đơn nhiệt mini khổ K80 tự động dành riêng cho các siêu thị do VComm trực tiếp sở hữu kinh doanh.
          </p>
        </div>
        {activeTab === 'inventory' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold px-5 py-3 rounded-lg transition duration-200 cursor-pointer flex items-center gap-2 shadow-sm shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Thêm Sản Phẩm Siêu Thị
          </button>
        )}
      </div>

      {/* Mode Switches */}
      <div className="flex border-b border-slate-200 gap-4">
        <button 
          onClick={() => setActiveTab('pos')}
          className={cn(
            "pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer",
            activeTab === 'pos' ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Màn Hình POS Bán Hàng Tại Quầy
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer",
            activeTab === 'inventory' ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Quản Lý Kho Hàng & Tồn Kho Cửa Hàng
        </button>
      </div>

      {/* POS screen mode */}
      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products menu catalog (Left 2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-4">
              {/* Category tabs & Filter layout */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex flex-wrap gap-1.5">
                 {['all', 'food', 'drink', 'household', 'other'].map((cat) => (
                   <button 
                     key={cat}
                     onClick={() => setCategoryFilter(cat as any)}
                     className={cn(
                       "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                       categoryFilter === cat 
                         ? "bg-slate-900 border-slate-900 text-white shadow-xs" 
                         : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                     )}
                   >
                     {cat === 'all' ? 'Tất cả' : getCategoryLabel(cat)}
                   </button>
                 ))}
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Quét mã vạch hoặc gõ tên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-1.5 w-full rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {loading ? (
                  <div className="col-span-full text-center py-6 text-slate-400">
                    Sắp xếp gian hàng siêu thị...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="col-span-full text-center py-6 text-slate-400 italic">
                    Không tìm thấy sản phẩm nào trong kệ quầy VComm.
                  </div>
                ) : (
                  filteredProducts.map((prod) => {
                    const isOutOfStock = prod.stock <= 0;
                    const isLowStock = prod.stock <= prod.minStock;
                    return (
                      <div 
                        key={prod.id}
                        onClick={() => !isOutOfStock && addToCart(prod)}
                        className={cn(
                          "bg-slate-50 border rounded-lg p-3 flex flex-col justify-between hover:shadow-sm hover:border-emerald-400 transition-all cursor-pointer relative overflow-hidden group",
                          isOutOfStock ? "opacity-60 grayscale cursor-not-allowed border-slate-200" : "border-slate-150"
                        )}
                      >
                        {isLowStock && !isOutOfStock && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl">Cận phát</div>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-slate-900/15 flex items-center justify-center text-[11px] font-bold text-slate-100 uppercase bg-opacity-70 dark:bg-slate-900/30">Hết hàng</div>
                        )}
                        
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{getCategoryLabel(prod.category)}</span>
                          <h4 className="text-[11.5px] font-extrabold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 h-8" title={prod.name}>
                            {prod.name}
                          </h4>
                          <p className="font-mono text-[9px] text-slate-450">SKU: {prod.sku}</p>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2">
                          <span className="font-black text-slate-900 text-xs">{formatCurrency(prod.price)}</span>
                          <span className="text-[9.5px] font-bold text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded">Tồn: {prod.stock}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* POS Side bar Cart Receipt system (Right column) */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between min-h-[500px]">
              {/* Cart section header */}
              <div className="p-4 border-b border-slate-150 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <span className="font-black text-xs uppercase text-slate-800">Giỏ Hàng Siêu Thị ({cart.length})</span>
                </div>
                {cart.length > 0 && (
                  <button onClick={clearCart} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Items scroll screen */}
              <div className="flex-grow p-4 space-y-3 overflow-y-auto max-h-[280px] custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 space-y-2">
                    <Layers className="w-8 h-8 text-slate-200 mx-auto" />
                    <p className="text-[11px] font-medium leading-relaxed">Giỏ hàng siêu thị đang trống.<br/>Click chọn sản phẩm ở giá kệ bên trái để quét hàng hóa tính tiền.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex items-start justify-between gap-1.5 text-xs text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-extrabold text-slate-900 leading-tight truncate" title={item.product.name}>{item.product.name}</h5>
                        <p className="font-semibold text-slate-500 mt-0.5">{formatCurrency(item.product.price)} / sản phẩm</p>
                      </div>
                      
                      {/* Quantity switcher */}
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-5 h-5 bg-white hover:bg-slate-200 rounded border border-slate-250 flex items-center justify-center font-bold"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-5 h-5 bg-white hover:bg-slate-200 rounded border border-slate-250 flex items-center justify-center font-bold"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                        
                        <div className="w-16 text-right font-extrabold text-slate-900 ml-1">
                          {formatCurrency(item.product.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Financial checkout parameters */}
              <div className="p-4 bg-slate-50 border-t border-slate-150 space-y-3 text-xs">
                {/* Customer selection */}
                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-dashed border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Tên Người mua:</span>
                    <input 
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Số điện thoại (Loyalty):</span>
                    <input 
                      type="text"
                      placeholder="09..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Sub calculations */}
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Tạm tính siêu thị:</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thuế VAT siêu thị (8%):</span>
                    <span className="font-semibold text-slate-950">+{formatCurrency(taxAmount)}</span>
                  </div>
                  {/* Promo code */}
                  <div className="flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-1 text-slate-500 font-semibold">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>CK Chiết khấu (%):</span>
                    </div>
                    <select 
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-xs font-bold"
                    >
                      <option value={0}>0%</option>
                      <option value={2}>Giảm 2% VIP</option>
                      <option value={5}>Giảm 5% Ngày vàng</option>
                      <option value={10}>Chiết khấu 10% Staff</option>
                    </select>
                  </div>
                </div>

                {/* Payment channel selector */}
                <div className="pt-2 border-t border-dashed border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cách thức thanh toán:</span>
                  <div className="grid grid-cols-3 gap-1 px-1 py-0.5 bg-slate-200/50 rounded-lg">
                    <button 
                      onClick={() => setPaymentMethod('cash')}
                      className={cn(
                        "py-1.5 rounded-md text-[11px] font-bold cursor-pointer text-center whitespace-nowrap",
                        paymentMethod === 'cash' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Tiền mặt
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('vietqr')}
                      className={cn(
                        "py-1.5 rounded-md text-[11px] font-bold cursor-pointer text-center whitespace-nowrap",
                        paymentMethod === 'vietqr' ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      VietQR
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('card')}
                      className={cn(
                        "py-1.5 rounded-md text-[11px] font-bold cursor-pointer text-center whitespace-nowrap",
                        paymentMethod === 'card' ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Cà thẻ POS
                    </button>
                  </div>

                  {paymentMethod === 'cash' && (
                    <div className="flex items-center justify-between gap-2 mt-2 bg-slate-100 p-2 rounded-lg border border-slate-200 animate-in fade-in">
                      <span className="font-bold text-slate-600 block text-[10px] uppercase">Khách đưa VNĐ:</span>
                      <input 
                        type="number"
                        placeholder="0"
                        value={cashAmountReceive || ''}
                        onChange={(e) => setCashAmountReceive(Number(e.target.value))}
                        className="px-2 py-1 w-28 text-right bg-white border border-slate-250 text-xs font-black text-slate-900 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {paymentMethod === 'vietqr' && (
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
                      <div>
                        <p className="font-extrabold text-indigo-900">Quét Mã VietQR Dynamic</p>
                        <p className="text-[10px] text-slate-500 mt-1">Hệ thống sinh mã QR hạch toán tức thời</p>
                      </div>
                      <QrCode className="w-10 h-10 text-indigo-700 animate-pulse shrink-0" />
                    </div>
                  )}
                </div>

                {/* Final calculated total amount */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="font-bold text-slate-800 text-[11px]">Tổng cần thanh toán:</span>
                    <span className="font-black text-lg text-emerald-700">{formatCurrency(finalTotal)}</span>
                  </div>

                  {paymentMethod === 'cash' && cashAmountReceive >= finalTotal && (
                    <div className="p-2 mb-3 bg-emerald-55 text-emerald-800 rounded border border-emerald-250 flex justify-between font-bold text-[11px] animate-in slide-in-from-bottom">
                      <span>Trả lại khách hàng:</span>
                      <span>{formatCurrency(cashAmountReceive - finalTotal)}</span>
                    </div>
                  )}

                  {/* Submit checkout billing details */}
                  <button 
                    onClick={handleCheckoutAndPrint}
                    disabled={cart.length === 0}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:bg-slate-450 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-sm shadow-emerald-700/20 cursor-pointer text-center"
                  >
                    <Printer className="w-4 h-4" /> Bán Hàng & In Hoá Đơn K80
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Inventory / catalog segment */
        <div className="space-y-4">
          {/* Quick statistic cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Tổng số danh mục SKUs</span>
              <h4 className="text-xl font-extrabold text-slate-900 mt-1">{stats.totalSkus} mặt hàng</h4>
            </div>
            <div className="bg-amber-50/40 border border-amber-200 p-4 rounded-lg">
              <span className="text-[10px] font-bold text-amber-600 block uppercase tracking-wider">Cần nhập thêm hàng (Low-stock)</span>
              <h4 className="text-xl font-extrabold text-amber-700 mt-1">{stats.lowStockSkus} SKUs</h4>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Tổng số lượng thùng / gói sẵn kho</span>
              <h4 className="text-xl font-extrabold text-slate-900 mt-1">{stats.totalStockUnits} chiếc</h4>
            </div>
            <div className="bg-emerald-50/20 border border-emerald-250 p-4 rounded-lg">
              <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider">Khấu hao giá trị kho tồn</span>
              <h4 className="text-xl font-extrabold text-emerald-700 mt-1">{formatCurrency(stats.inventoryValuation)}</h4>
            </div>
          </div>

          {/* Table display */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-3">
              <h4 className="font-extrabold text-sm text-slate-800">Quản Trị Kệ Trưng Bày & Tồn Phát Siêu Thị</h4>
              {/* Category selector */}
              <div className="flex gap-2">
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs select-none"
                >
                  <option value="all">Mọi ngành hàng</option>
                  <option value="food">Thực phẩm đóng gói</option>
                  <option value="drink">Đồ uống đóng lon</option>
                  <option value="household">Hóa gia dụng</option>
                </select>
                
                <input 
                  type="text"
                  placeholder="Quét Barcode hoặc tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-550 border-b border-slate-200">
                    <th className="p-4 w-28">Barcode / SKU</th>
                    <th className="p-4">Tên hàng hóa siêu thị</th>
                    <th className="p-4">Phân ngành</th>
                    <th className="p-4">Giá nhập / Giá bán</th>
                    <th className="p-4">Vị trí kệ quầy</th>
                    <th className="p-4 text-center">Tồn siêu thị</th>
                    <th className="p-4 text-center">Điều chỉnh tồn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock <= p.minStock;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono">
                          <p className="font-bold text-slate-900">{p.barcode}</p>
                          <span className="text-[10px] text-slate-400 capitalize">{p.sku}</span>
                        </td>
                        <td className="p-4 font-black text-slate-900">
                          {p.name}
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-[10.5px]">
                            {getCategoryLabel(p.category)}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <p className="font-medium text-slate-450 text-[11px]">Nhập: {formatCurrency(p.cost)}</p>
                          <p className="font-extrabold text-slate-900">Bán: {formatCurrency(p.price)}</p>
                        </td>
                        <td className="p-4 italic font-medium text-slate-500">
                          {p.shelfLocation}
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded font-bold text-xs inline-block",
                            p.stock <= 0 ? "bg-red-100 text-red-700" :
                            isLow ? "bg-amber-100 text-amber-700" :
                            "bg-emerald-50 text-emerald-800"
                          )}>
                            {p.stock} chiếc
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => adjustProductStock(p.id, -5)}
                              className="px-2 py-1 border border-slate-200 hover:border-slate-350 bg-slate-50/80 rounded font-bold"
                            >
                              -5
                            </button>
                            <button 
                              onClick={() => adjustProductStock(p.id, -1)}
                              className="px-2 py-1 border border-slate-200 hover:border-slate-350 bg-slate-50/80 rounded font-bold"
                            >
                              -1
                            </button>
                            <button 
                              onClick={() => adjustProductStock(p.id, 1)}
                              className="px-2 py-1 border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-bold"
                            >
                              +1
                            </button>
                            <button 
                              onClick={() => adjustProductStock(p.id, 10)}
                              className="px-2 py-1 border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-bold"
                            >
                              +10
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INVENTARY MODAL: Create and place dynamic products */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg border border-slate-200 shadow-sm w-full max-w-lg overflow-hidden text-xs font-sans"
          >
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-black text-base">Thêm Mặt Hàng Siêu Thị VComm</h3>
                <p className="text-[11px] text-slate-350">Tạo mã vạch, đặt giá và kê khai vị trí quầy trưng bày.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Mã SKU định vị:</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="SM-FOOD-101"
                    value={newSKU}
                    onChange={(e) => setNewSKU(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Mã Barcode vạch lẻ:</label>
                  <input 
                    type="text" 
                    placeholder="89311..."
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Tên mặt hàng:</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Coca Cola lon nhôm 320ml"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Nhóm ngành hàng:</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="food">Thực phẩm</option>
                    <option value="drink">Đồ uống</option>
                    <option value="household">Hóa mỹ phẩm</option>
                    <option value="other">Nhóm khác</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="font-bold text-slate-700 block">Vị trí tủ / quầy kệ kệ:</label>
                  <input 
                    type="text" 
                    placeholder="Kệ gia dụng B1"
                    value={newShelf}
                    onChange={(e) => setNewShelf(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Giá gốc nhập (đ):</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={newCost || ''}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Giá niêm yết bán lẻ (đ):</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    required
                    value={newPrice || ''}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Tồn kho ban đầu:</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={newStock || ''}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Hạn mức báo động cận kho:</label>
                  <input 
                    type="number" 
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-150">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-250 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Đóng
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Đăng Ký Sản Phẩm
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* POS BILL K80 THERMAL PRINT PREVIEW MODAL */}
      {showReceiptPrintModal && completedBillData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-100 rounded-lg border border-slate-200 shadow-sm w-full max-w-[420px] overflow-hidden"
          >
            {/* Header toolbar */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1">
                <FileCheck className="w-4 h-4 text-emerald-400" /> BẢN TRỰC QUAN HOÁ ĐƠN NHIỆT K80
              </span>
              <button 
                onClick={() => {
                  setShowReceiptPrintModal(false);
                  setCompletedBillData(null);
                }}
                className="text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Paper receipt body */}
            <div className="p-6 overflow-y-auto max-h-[460px] flex justify-center custom-scrollbar">
              
              {/* This is the div that will be singled out during window.print() */}
              <div 
                id="vcomm-k80-print-document" 
                className="bg-white text-black p-4 w-[80mm] border border-slate-350 shadow-xs text-[10px] font-mono leading-tight select-none"
              >
                <div className="text-center mb-4 space-y-1">
                  <h1 className="font-serif tracking-tight text-sm font-black uppercase text-slate-900">VComm Supermarket</h1>
                  <p className="text-[9px] font-semibold">Cửa hàng Offline số 1 • Thành Phố Hà Nội</p>
                  <p className="text-[9px] font-semibold">Địa chỉ: 15 Lê Duẩn, Nguyễn Du, Hai Bà Trưng</p>
                  <p className="text-[9px] font-semibold">Hotline hỗ trợ: 1900.8198</p>
                  <div className="my-2 border-b-2 border-dashed border-gray-400"></div>
                  
                  <h2 className="text-xs font-black uppercase tracking-wide py-1">HÓA ĐƠN BÁN LẺ</h2>
                  
                  <div className="text-left py-1 text-[9px] space-y-0.5">
                    <p>Mã HĐ: <span className="font-bold">{completedBillData.orderId}</span></p>
                    <p>Ngày in: {completedBillData.timestamp}</p>
                    <p>Khách hàng: <span className="font-bold">{completedBillData.customerName}</span> ({completedBillData.customerPhone})</p>
                    <p>Thu ngân: {completedBillData.operator}</p>
                  </div>
                </div>

                <div className="my-2 border-b border-dashed border-gray-400"></div>

                {/* Bill Items list */}
                <table className="w-full text-left text-[9px] mb-2 font-mono whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-dashed border-gray-300 font-bold">
                      <th className="py-1">Tên hàng</th>
                      <th className="py-1 text-center w-8">SL</th>
                      <th className="py-1 text-right w-16">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedBillData.items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-dashed border-gray-150">
                        <td className="py-1 pr-1 font-bold">{item.name}</td>
                        <td className="py-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-1 text-right">{new Intl.NumberFormat('vi-VN').format(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Sub totals and Taxes */}
                <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 font-mono text-[9px]">
                  <div className="flex justify-between">
                    <span>Cộng tiền hàng:</span>
                    <span>{new Intl.NumberFormat('vi-VN').format(completedBillData.subtotal)}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thuế VAT siêu thị (8%):</span>
                    <span>+{new Intl.NumberFormat('vi-VN').format(completedBillData.tax)}đ</span>
                  </div>
                  {completedBillData.discount > 0 && (
                    <div className="flex justify-between font-bold text-emerald-650">
                      <span>Tổng Chiết khấu:</span>
                      <span>-{new Intl.NumberFormat('vi-VN').format(completedBillData.discount)}đ</span>
                    </div>
                  )}

                  <div className="my-1 border-b border-dashed border-gray-300"></div>

                  <div className="flex justify-between font-black text-xs">
                    <span>TỔNG THANH TOÁN:</span>
                    <span>{new Intl.NumberFormat('vi-VN').format(completedBillData.total)} VNĐ</span>
                  </div>

                  <div className="my-1 border-b border-dashed border-gray-400"></div>

                  <div className="flex justify-between font-bold text-[9px]">
                    <span className="uppercase">PT Thanh toán:</span>
                    <span className="uppercase">{completedBillData.paymentMethod === 'cash' ? 'Tiền mặt' : completedBillData.paymentMethod === 'vietqr' ? 'VietQR Chuyển khoản' : 'Thẻ Visa/Master'}</span>
                  </div>

                  {completedBillData.paymentMethod === 'cash' && (
                    <div className="space-y-0.5 text-slate-800 text-[9px] font-bold">
                      <div className="flex justify-between">
                        <span>Khách trả VNĐ:</span>
                        <span>{new Intl.NumberFormat('vi-VN').format(completedBillData.cashReceived)}đ</span>
                      </div>
                      <div className="flex justify-between text-emerald-650">
                        <span>Tiền thừa trả khách:</span>
                        <span>{new Intl.NumberFormat('vi-VN').format(completedBillData.cashChange)}đ</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="my-2 border-b border-dashed border-gray-400"></div>

                {/* Footer and dynamic barcode */}
                <div className="text-center space-y-1 mt-3">
                  <p className="font-extrabold text-[9px]">Quét Barcode nhận tích điểm Loyalty 5% vào Ví!</p>
                  <div className="mx-auto my-2 w-44 bg-slate-900 h-8 flex items-center justify-center text-white font-serif tracking-[0.4em] font-extrabold text-[12px] opacity-90 rounded">
                    ||||||||||||||||||
                  </div>
                  <p className="text-[8px] italic mt-2 text-slate-400">Cảm ơn quý khách đã đồng hành cùng VComm!</p>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <button 
                onClick={() => {
                  setShowReceiptPrintModal(false);
                  setCompletedBillData(null);
                }}
                className="flex-1 py-2.5 border border-slate-250 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-center"
              >
                Đóng lại
              </button>
              <button 
                onClick={printK80ThermalInvoice}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Bắn Lệnh In K80
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
