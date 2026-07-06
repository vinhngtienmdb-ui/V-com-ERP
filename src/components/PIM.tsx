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
 EyeOff,
 Loader2,
 Layers,
 Tv,
 Settings
} from 'lucide-react';

import { useAuditLog } from '../hooks/useAuditLog';
import { formatCurrency, cn } from '../lib/utils';
import { Product } from '../types/erp';
import { syncProductToMisa } from '../services/misaService';
import { supabase } from '../lib/supabase';

import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  db, 
  serverTimestamp, 
  handleFirestoreError,
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
} from '../services/dbService';
import nexhubProducts from '../constants/nexhub_products.json';

export function PIM() {
  const { log } = useAuditLog();
 const [products, setProducts] = useState<Product[]>([]);
  const [syncingProductId, setSyncingProductId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
 const [loading, setLoading] = useState(true);
 const [filterStatus, setFilterStatus] = useState<'all' | 'pending_approval' | 'in_stock' | 'hidden'>('all');
 const seedingRef = useRef(false);
 
 useEffect(() => {
 const unsub = onSnapshot(collection(db, 'products'), (snap) => {
 let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
 data = data.filter(p => !['Đồ ăn', 'Đồ uống', 'Thức ăn', 'Cà phê', 'Trà'].includes(p.category));
 setProducts(data);
 
 const hasNexhub = data.some(p => p.sku === 'bundle-16' || p.sku === '8934669241349x2');
 if ((data.length === 0 || !hasNexhub) && !seedingRef.current) {
 seedingRef.current = true;
 seedDemoPimProducts(data);
 }
 setLoading(false);
 });
 return () => unsub();
 }, []);

 const seedDemoPimProducts = async (existingProducts: Product[] = []) => {
 console.log("Seeding PIM products...");
 const existingSkus = new Set(existingProducts.map(p => p.sku));
 const demoItems = [
 ...nexhubProducts
 ];
 for (const item of demoItems) {
 if (!existingSkus.has(item.sku)) {
 await addDoc(collection(db, 'products'), {
 ...item,
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp()
 });
 }
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
      log({ action: 'product.deleted', targetId: id, targetLabel: 'Sản phẩm đã xóa' });
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

 const approveProduct = async (id: string) => {
    try {
      await updateDoc(doc(db, 'products', id), {
        status: 'in_stock',
        updatedAt: serverTimestamp()
      });
      alert('Phê duyệt sản phẩm thành công!');
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
  
  // AI Semantic Search States
  const [isAiSearch, setIsAiSearch] = useState<boolean>(false);
  const [aiSearchResults, setAiSearchResults] = useState<{ id: string; similarity: number }[] | null>(null);
  const [aiSearchLoading, setAiSearchLoading] = useState<boolean>(false);
  const [isEmbedding, setIsEmbedding] = useState<boolean>(false);

  useEffect(() => {
    if (!isAiSearch) {
      setAiSearchResults(null);
    }
  }, [isAiSearch]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setAiSearchResults(null);
    }
  }, [searchQuery]);

  const handleAiSearch = async (queryText?: string) => {
    const q = queryText !== undefined ? queryText : searchQuery;
    if (!q.trim()) {
      setAiSearchResults(null);
      return;
    }
    setAiSearchLoading(true);
    try {
      const res = await fetch("/api/mock/vector-search");
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setAiSearchResults(data.products);
      } else {
        alert(data.error || 'Lỗi tìm kiếm ngữ nghĩa AI');
      }
    } catch (err: any) {
      console.error('[PIM-AI-Search] Error:', err);
      alert('Không thể kết nối tới AI Server');
    } finally {
      setAiSearchLoading(false);
    }
  };

  const handleEmbedAllProducts = async () => {
    setIsEmbedding(true);
    try {
      const res = await fetch("/api/mock/embed-all-products");
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Đồng bộ vector thành công!');
      } else {
        alert(data.error || 'Lỗi đồng bộ vector');
      }
    } catch (err: any) {
      console.error('[PIM-AI-Embed] Error:', err);
      alert('Không thể kết nối tới AI Server');
    } finally {
      setIsEmbedding(false);
    }
  };
 
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
  const [showDetailForProduct, setShowDetailForProduct] = useState<Product | null>(null);
  // Close detail modal on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDetailForProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetailForProduct]);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'specs' | 'media' | 'pnl' | 'edit'>('overview');
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
 const [fileValidation, setFileValidation] = useState<{status: 'idle'|'validating'|'success'|'error', message: string, data?: any}>({status: 'idle', message: ''});
  const [editProductData, setEditProductData] = useState<any>({});

  const [activePimTab, setActivePimTab] = useState<'products' | 'combos'>('products');
  const [combos, setCombos] = useState<any[]>([]);
  const [combosLoading, setCombosLoading] = useState(false);
  const [showCreateComboModal, setShowCreateComboModal] = useState(false);
  const [newCombo, setNewCombo] = useState({
    name: '',
    description: '',
    price: 0,
    costPrice: 0,
    status: 'active' as const
  });
  const [newComboItems, setNewComboItems] = useState<any[]>([]);
  const [selectedComboProdId, setSelectedComboProdId] = useState('');
  const [selectedComboQty, setSelectedComboQty] = useState(1);

  const loadCombos = async () => {
    try {
      setCombosLoading(true);
      const { data: combosData } = await supabase.from('combos').select('*').order('created_at', { ascending: false });
      if (combosData) {
        const { data: itemsData } = await supabase.from('combo_items').select('*');
        const mapped = combosData.map(c => ({
          ...c,
          items: itemsData ? itemsData.filter((i: any) => i.combo_id === c.id) : []
        }));
        setCombos(mapped);
      }
    } catch (err) {
      console.error('Lỗi khi tải combo:', err);
    } finally {
      setCombosLoading(false);
    }
  };

  const handleAddComboItem = () => {
    if (!selectedComboProdId || selectedComboQty <= 0) return;
    const prod = products.find(p => p.id === selectedComboProdId);
    if (!prod) return;
    if (newComboItems.some(item => item.productId === selectedComboProdId)) {
      setNewComboItems(prev => prev.map(item => item.productId === selectedComboProdId ? { ...item, quantity: item.quantity + selectedComboQty } : item));
    } else {
      setNewComboItems(prev => [...prev, { productId: selectedComboProdId, name: prod.name, sku: prod.sku, quantity: selectedComboQty, price: prod.price, costPrice: prod.costPrice }]);
    }
    setSelectedComboProdId('');
    setSelectedComboQty(1);
  };

  const handleCreateCombo = async () => {
    if (!newCombo.name) {
      alert('Vui lòng nhập tên combo!');
      return;
    }
    if (newComboItems.length === 0) {
      alert('Vui lòng thêm ít nhất một mặt hàng!');
      return;
    }
    try {
      const comboId = `combo-${Date.now()}`;
      
      const finalPrice = newCombo.price || newComboItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const finalCost = newCombo.costPrice || newComboItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);

      await supabase.from('combos').insert({
        id: comboId,
        tenant_id: 'tenant-vcomm-prod-01',
        name: newCombo.name,
        description: newCombo.description || null,
        price: finalPrice,
        cost_price: finalCost,
        status: newCombo.status,
        created_at: new Date().toISOString()
      });

      for (const item of newComboItems) {
        await supabase.from('combo_items').insert({
          id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          tenant_id: 'tenant-vcomm-prod-01',
          combo_id: comboId,
          product_id: item.productId,
          quantity: item.quantity
        });
      }

      alert('Đã tạo combo thành công!');
      setShowCreateComboModal(false);
      setNewComboItems([]);
      setNewCombo({
        name: '',
        description: '',
        price: 0,
        costPrice: 0,
        status: 'active'
      });
      loadCombos();
    } catch (err: any) {
      console.error(err);
      alert('Tạo combo thất bại: ' + err.message);
    }
  };

  useEffect(() => {
    if (activePimTab === 'combos') {
      loadCombos();
    }
  }, [activePimTab]);

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
  dimensions: '',
  videoUrl: '',
  imagesCsv: '',
  specsText: ''
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

  const handleBulkApprove = async () => {
    setIsScanning(true);
    try {
      const pendingProds = products.filter(p => p.status === 'pending_approval');
      const targetIds = selectedProductIds.length > 0
        ? selectedProductIds.filter(id => products.find(p => p.id === id)?.status === 'pending_approval')
        : pendingProds.map(p => p.id);

      if (targetIds.length === 0) {
        alert("Không có sản phẩm nào đang chờ duyệt.");
        setIsScanning(false);
        return;
      }

      for (const id of targetIds) {
        await updateDoc(doc(db, 'products', id), {
          status: 'in_stock',
          updatedAt: serverTimestamp()
        });
      }
      
      setSelectedProductIds([]);
      alert(`Đã phê duyệt thành công ${targetIds.length} sản phẩm!`);
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi duyệt sản phẩm.");
    } finally {
      setIsScanning(false);
    }
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

  const handleAddProduct = async (e: React.FormEvent) => {
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

  for (const p of newBulkProducts) {
    await addDoc(collection(db, 'products'), {
      ...p,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  setIsUploadModalOpen(false);
  setFileValidation({status: 'idle', message: ''});
  return;
  }

  const price = Number(newProduct.price) || 0;
  const costPrice = Number(newProduct.costPrice) || (price * 0.7);
  const hiddenCosts = Number(newProduct.hiddenCosts) || 0;
  const profit = price - costPrice - hiddenCosts;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  // Parse specs
  const specs = newProduct.specsText
    ? newProduct.specsText
        .split('\n')
        .map(line => {
          const index = line.indexOf(':');
          if (index === -1) return null;
          return {
            key: line.substring(0, index).trim(),
            value: line.substring(index + 1).trim()
          };
        })
        .filter((item): item is { key: string; value: string } => item !== null)
    : [];

  // Parse images
  const images = newProduct.imagesCsv
    ? newProduct.imagesCsv
        .split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0)
    : [];

  const productData = {
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
  status: 'in_stock' as const,
  image: `https://picsum.photos/seed/${encodeURIComponent(newProduct.name)}/200/200`,
  description: newProduct.description || '',
  weight: newProduct.weight || '',
  dimensions: newProduct.dimensions || '',
  videoUrl: newProduct.videoUrl || '',
  images: images,
  specs: specs,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, 'products'), productData);
    setIsUploadModalOpen(false);
    setNewProduct({
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
      dimensions: '',
      videoUrl: '',
      imagesCsv: '',
      specsText: ''
    });
  } catch (err: any) {
    console.error("Lỗi khi thêm sản phẩm:", err);
    alert("Thêm sản phẩm thất bại: " + err.message);
  }
  };

  const categories = Array.from(new Set(products.map(p => p.category)));
  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));

  const filteredProducts = React.useMemo(() => {
    if (isAiSearch && aiSearchResults) {
      return aiSearchResults
        .map(res => {
          const prod = products.find(p => p.id === res.id);
          if (prod) {
            return { ...prod, similarity: res.similarity };
          }
          return null;
        })
        .filter((p): p is (Product & { similarity: number }) => p !== null)
        .filter(p => {
          const matchStatus = filterStatus === 'all' || p.status === filterStatus;
          const matchCategory = filterCategory === 'all' || p.category === filterCategory;
          const matchBrand = filterBrand === 'all' || p.brand === filterBrand;
          return matchStatus && matchCategory && matchBrand;
        });
    }

    return products.filter(p => {
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
  }, [products, isAiSearch, aiSearchResults, filterStatus, filterCategory, filterBrand, searchQuery]);

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 {/* Banner Khuyến mãi/Tính năng mới */}
 <div className="relative w-full h-48 rounded-lg overflow-hidden shadow-sm group">
 <img 
 src="https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=1200&h=400" 
 alt="Banner giới thiệu tính năng" 
 className="w-full h-full object-cover  transition-transform duration-700" 
 referrerPolicy="no-referrer"
 />
 <div className="absolute inset-0 bg-blue-900/60 flex flex-col justify-center px-6">
 <h2 className="text-3xl font-black text-[#FAF9F5] italic tracking-tight">Ra mắt Công cụ AI Pricing 2.0</h2>
 <p className="text-blue-100 text-sm mt-3 max-w-lg">Tối ưu hoá giá bán tự động dựa trên dữ liệu đối thủ và tồn kho thực tế. Giúp tăng 15% biên lợi nhuận chỉ trong 1 thao tác.</p>
 <button className="mt-6 w-fit px-6 py-3 bg-white text-blue-800 font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm">
 Trải nghiệm ngay
 </button>
 </div>
 </div>

 {/* Modal Bổ sung sản phẩm */}
 {isUploadModalOpen && (
 <div className="fixed inset-0 bg-slate-50 z-[110] flex flex-col animate-in slide-in-from-right-4 duration-300">
 <div className="bg-white w-full max-w-7xl mx-auto flex flex-col flex-1 relative">
 <div className="p-6 border-b border-[#F3F4F6] flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
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
 className={cn("px-6 py-2.5 text-xs font-black rounded-lg transition-all uppercase tracking-widest", uploadMode === 'single' ? "bg-white text-primary-750 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >Nhập thủ công</button>
 <button 
 onClick={() => setUploadMode('bulk')}
 className={cn("px-6 py-2.5 text-xs font-black rounded-lg transition-all uppercase tracking-widest", uploadMode === 'bulk' ? "bg-white text-primary-750 shadow-sm" : "text-slate-600 hover:text-slate-800")}
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
 <div className="p-6 space-y-8 max-w-4xl mx-auto w-full">
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Tên sản phẩm</label>
 <input 
 type="text" required placeholder="Ví dụ: iPhone 16 Pro Max..." 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/5 transition-all font-medium"
 value={newProduct.name}
 onChange={e => setNewProduct({...newProduct, name: e.target.value})}
 />
 </div>
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Thương hiệu</label>
 <input 
 type="text" required placeholder="Apple, Samsung, Sony..." 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/5 transition-all font-medium"
 value={newProduct.brand}
 onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Ngành hàng</label>
 <select 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/5 transition-all font-bold appearance-none"
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
 className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-5 pr-12 py-4 text-sm focus:outline-none focus:bg-white font-mono font-bold text-primary-750"
 value={newProduct.sku}
 onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
 />
 <button 
 type="button"
 onClick={generateSKU}
 title="Sinh mã SKU tự động"
 className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 text-primary-750 rounded-lg transition-all"
 >
 <Hash className="w-5 h-5" />
 </button>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Giá niêm yết (VNĐ)</label>
 <input 
 type="number" required placeholder="30.000.000" 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white font-mono font-bold"
 value={newProduct.price}
 onChange={e => setNewProduct({...newProduct, price: e.target.value})}
 />
 </div>
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Tồn kho ban đầu</label>
 <input 
 type="number" required placeholder="Số lượng nhập kho..." 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white font-mono font-bold"
 value={newProduct.stock}
 onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Giá vốn (VNĐ)</label>
 <input 
 type="number" placeholder="Mặc định: 70% giá niêm yết" 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white font-mono font-bold"
 value={newProduct.costPrice}
 onChange={e => setNewProduct({...newProduct, costPrice: e.target.value})}
 />
 </div>
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Chi phí ẩn (VC, Đóng gói... VNĐ)</label>
 <input 
 type="number" placeholder="Ví dụ: 15.000" 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white font-mono font-bold"
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
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/5 transition-all font-medium resize-none"
 value={newProduct.description}
 onChange={e => setNewProduct({...newProduct, description: e.target.value})}
 ></textarea>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Trọng lượng (Gram)</label>
 <input 
 type="number" placeholder="Ví dụ: 500" 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white font-mono font-bold"
 value={newProduct.weight}
 onChange={e => setNewProduct({...newProduct, weight: e.target.value})}
 />
 </div>
 <div className="space-y-3">
 <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Kích thước (DxRxC) (cm)</label>
 <input 
 type="text" placeholder="Ví dụ: 15x10x5" 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white font-mono font-bold"
 value={newProduct.dimensions}
 onChange={e => setNewProduct({...newProduct, dimensions: e.target.value})}
 />
 </div>
 </div>

  <div className="grid grid-cols-2 gap-6 mt-4">
  <div className="space-y-3">
  <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">URL Video giới thiệu</label>
  <input 
  type="text" placeholder="Ví dụ: https://www.youtube.com/watch?v=..." 
  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white font-medium"
  value={newProduct.videoUrl}
  onChange={e => setNewProduct({...newProduct, videoUrl: e.target.value})}
  />
  </div>
  <div className="space-y-3">
  <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Ảnh bộ sưu tập (Phân tách bằng dấu phẩy)</label>
  <input 
  type="text" placeholder="Ví dụ: https://url1.jpg, https://url2.jpg" 
  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white font-medium"
  value={newProduct.imagesCsv}
  onChange={e => setNewProduct({...newProduct, imagesCsv: e.target.value})}
  />
  </div>
  </div>

  <div className="space-y-3 mt-4">
  <label className="text-[11px] font-black text-[#111827] uppercase tracking-widest px-1">Cấu hình chi tiết (Mỗi dòng một thông số dạng Key: Value)</label>
  <textarea 
  rows={3} placeholder="Ví dụ:&#10;CPU: Apple A18 Pro&#10;RAM: 8GB"
  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-5 py-4 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/5 transition-all font-medium resize-none"
  value={newProduct.specsText}
  onChange={e => setNewProduct({...newProduct, specsText: e.target.value})}
  ></textarea>
  </div>
  </div>
  ) : (
 <div className="p-6 space-y-8 flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
 <div 
 onDragOver={handleDragOver}
 onDrop={handleDrop}
 className={cn(
 "border-2 border-dashed rounded-lg p-6 text-center transition-all relative flex flex-col items-center justify-center gap-6",
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
 <div className="w-20 h-20 bg-white shadow-sm shadow-slate-200/50 rounded-full flex items-center justify-center text-primary-750">
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
 <div className="w-20 h-20 bg-white shadow-sm shadow-blue-200/50 rounded-full flex items-center justify-center text-primary-750">
 <Sparkles className="w-8 h-8 animate-pulse" />
 </div>
 <div>
 <h3 className="text-xl font-black text-primary-750">Đang quét và chuẩn hóa dữ liệu...</h3>
 <p className="text-sm text-primary-600 font-medium mt-2">{fileValidation.message}</p>
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
 <div className="flex justify-between items-center bg-slate-100/50 border border-slate-300 rounded-lg p-6 hover:border-primary-200 transition-all">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-white rounded-lg shadow-sm">
 <DownloadCloud className="w-6 h-6 text-primary-750" />
 </div>
 <div>
 <p className="text-sm font-bold text-[#111827]">Tải File Mẫu (Template)</p>
 <p className="text-[10px] text-[#6B7280] font-bold mt-0.5">Bản chuẩn 2.0 đã bao gồm schema của AI Server.</p>
 </div>
 </div>
 <a href="#" className="flex items-center gap-2 text-xs font-bold text-primary-750 hover:text-orange-800 bg-white px-5 py-2.5 rounded-lg border border-slate-300 shadow-sm transition-all relative z-20 uppercase tracking-widest">
 Tải Template
 </a>
 </div>
 )}
 </div>
 )}

 <div className="flex gap-4 p-6 border-t border-slate-200 bg-white mt-auto justify-center">
 <button 
 type="button"
 onClick={() => setIsUploadModalOpen(false)}
 className="px-6 py-5 border border-slate-300 text-[#4B5563] font-black rounded-lg text-[11px] hover:bg-slate-50 transition-all uppercase tracking-[0.2em]"
 >
 Hủy bỏ
 </button>
 <button 
 type="submit"
 disabled={uploadMode === 'bulk' && fileValidation.status !== 'success'}
 className="px-12 py-5 bg-[#111827] text-[#FAF9F5] font-black rounded-lg text-[11px] hover:bg-slate-800 transition-all uppercase tracking-[0.2em] shadow-sm shadow-slate-900/40 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
 <div className="bg-white w-full max-w-xl rounded-lg shadow-sm p-6 animate-in zoom-in-95">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-xl font-black">Quét mã vạch & Kiểm kê</h2>
 <button onClick={() => { setIsScanMode(false); setIsCameraActive(false); }} className="p-2 hover:bg-slate-100 rounded-lg">
 <X className="w-5 h-5 text-slate-600" />
 </button>
 </div>

 <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-lg">
 <button 
 onClick={() => setInventoryUpdateMode(false)}
 className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", !inventoryUpdateMode ? "bg-white text-primary-750 shadow-sm" : "text-slate-600")}
 >Tìm kiếm chung</button>
 <button 
 onClick={() => setInventoryUpdateMode(true)}
 className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", inventoryUpdateMode ? "bg-white text-primary-750 shadow-sm" : "text-slate-600")}
 >Bổ sung tồn kho (+1)</button>
 </div>

 {!isCameraActive ? (
 <div className="space-y-6">
 <div className="aspect-video bg-slate-900 rounded-lg flex flex-col items-center justify-center text-[#FAF9F5]/40 cursor-pointer hover:bg-slate-800 transition-all group" onClick={() => setIsCameraActive(true)}>
 <Camera className="w-12 h-12 mb-3  transition-transform" />
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
 className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono font-bold"
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
 <span className="text-primary-750">{sku}</span>
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
 <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-[11px] font-medium italic">
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
 <Zap className="w-5 h-5 text-primary-750" />
 </div>
 <div>
 <p className="text-xs font-bold text-primary-900">Chế độ Bổ sung Tồn kho</p>
 <p className="text-[10px] text-primary-750 font-medium mt-1">Khi quét thành công một mã vạch hợp lệ, hệ thống sẽ tự động cộng 1 đơn vị vào tồn kho của sản phẩm đó ngay lập tức.</p>
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
 <div className="bg-white w-full max-w-md rounded-lg shadow-sm border border-slate-300 overflow-hidden p-6 animate-in zoom-in-95 duration-300">
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
 <ScanBarcode className="w-5 h-5 text-primary-600" />
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
 <Sparkles className={cn("w-4 h-4 text-primary-600 group-hover:rotate-12 transition-transform", isScanning && "animate-spin")} />
 {isScanning ? "AI đang quét dữ liệu..." : "AI Auto-Scan SP"}
 </button>
 <button 
 onClick={handleEmbedAllProducts}
 disabled={isEmbedding}
 className="bg-white border border-slate-300 px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 group shadow-sm hover:bg-slate-100 active:scale-95 border-b-4 border-b-primary-600 disabled:opacity-50"
 >
 {isEmbedding ? <Loader2 className="w-4 h-4 animate-spin text-primary-600" /> : <Sparkles className="w-4 h-4 text-primary-600 group-hover:rotate-12 transition-transform" />}
 {isEmbedding ? "Đang đồng bộ..." : "Đồng bộ Vector AI"}
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
 className="bg-primary-600 text-[#FAF9F5] px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5 active:scale-95 disabled:opacity-50"
 >
 Duyệt sản phẩm mới (Bulk)
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" columns={4} gap={16}>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm transform  transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Chờ duyệt (Seller)</span>
 <Clock className="w-5 h-5 text-amber-500" />
 </div>
 <div className="text-3xl font-bold text-[#111827]">245</div>
 <p className="text-[10px] text-amber-600 mt-2 font-bold bg-amber-50 px-2 py-0.5 rounded w-fit">Cần SLA xử lý: 4h</p>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm transform  transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Lỗi chuẩn hóa (AI)</span>
 <AlertCircle className="w-5 h-5 text-red-500" />
 </div>
 <div className="text-3xl font-bold text-red-500">18</div>
 <p className="text-[10px] text-slate-500 mt-2">Phát hiện bởi AI Auto-Scan</p>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm transform  transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Biên lợi nhuận gộp</span>
 <Calculator className="w-5 h-5 text-primary-750" />
 </div>
 <div className="text-3xl font-bold text-[#111827]">22.4%</div>
 <p className="text-[10px] text-emerald-600 mt-2 font-bold">Tối ưu +1.2% Target</p>
 </div>
 <div className="bg-[#111827] p-6 rounded-lg shadow-sm shadow-slate-200 relative overflow-hidden group">
 <div className="relative z-10 flex flex-col justify-between h-full">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Category AI</span>
 <Zap className="w-5 h-5 text-primary-600" />
 </div>
 <div>
 <div className="text-3xl font-bold text-[#FAF9F5] tracking-tighter">99.2%</div>
 <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase">Accuracy Rate</p>
 </div>
 </div>
 <Package className="absolute -bottom-6 -right-6 w-24 h-24 text-[#FAF9F5]/5 group-hover:rotate-12 transition-transform duration-700" />
 </div>
 </DraggableGrid>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6 mt-6">
        <button
          onClick={() => setActivePimTab('products')}
          className={cn(
            "pb-4 text-sm font-black uppercase tracking-wider transition-all relative",
            activePimTab === 'products' ? "text-primary-600 border-b-2 border-primary-600" : "text-slate-500 hover:text-slate-800"
          )}
        >
          Sản phẩm đơn lẻ
        </button>
        <button
          onClick={() => setActivePimTab('combos')}
          className={cn(
            "pb-4 text-sm font-black uppercase tracking-wider transition-all relative",
            activePimTab === 'combos' ? "text-primary-600 border-b-2 border-primary-600" : "text-slate-500 hover:text-slate-800"
          )}
        >
          Combo mua chung
        </button>
      </div>

      {activePimTab === 'products' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-6 border-b border-[#F3F4F6] space-y-4">
 <div className="flex flex-col xl:flex-row gap-4 justify-between items-start w-full">
 <div className="flex flex-col sm:flex-row gap-3 w-full xl:flex-1 max-w-3xl">
  <div className="relative flex-1">
   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
   <input 
    type="text" 
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        if (isAiSearch) {
          handleAiSearch();
        }
      }
    }}
    placeholder={isAiSearch ? "Tìm kiếm bằng AI (VD: giày thể thao chống trượt đi mưa)..." : "Tìm sản phẩm (Tên, SKU, ID, Nhà bán, Thương hiệu)..."} 
    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-12 pr-12 py-3 sm:py-3.5 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
   />
   {isAiSearch && (
    <button
     type="button"
     onClick={() => handleAiSearch()}
     disabled={aiSearchLoading}
     className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 text-primary-600 rounded-lg transition-all"
     title="Tìm kiếm AI"
    >
     {aiSearchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
    </button>
   )}
  </div>
  
  <button
   type="button"
   onClick={() => setIsAiSearch(!isAiSearch)}
   className={cn(
    "px-5 py-3 sm:py-3.5 rounded-lg border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shrink-0 shadow-sm active:scale-95",
    isAiSearch 
     ? "bg-primary-600 border-blue-600 text-white shadow-md shadow-blue-500/20" 
     : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
   )}
  >
   <Sparkles className={cn("w-4 h-4", isAiSearch && "animate-pulse")} />
   {isAiSearch ? "AI Search: BẬT" : "Tìm bằng AI"}
  </button>
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
 className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-xs font-bold text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-primary-500/20"
 >
 <option value="all">Tất cả ngành hàng</option>
 {categories.map(category => (
 <option key={category} value={category}>{category}</option>
 ))}
 </select>

 <select
 value={filterBrand}
 onChange={(e) => setFilterBrand(e.target.value)}
 className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-xs font-bold text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-primary-500/20"
 >
 <option value="all">Tất cả thương hiệu</option>
 {brands.map(brand => (
 <option key={brand} value={brand}>{brand}</option>
 ))}
 </select>
 </div>
 </div>

 <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
 {filteredProducts.map((product) => (
 <div key={product.id} className={cn("group flex flex-col bg-white border border-slate-300 rounded-lg p-4 hover:shadow-[0_20px_50px_rgba(37,99,235,0.08)] hover:border-primary-200 transition-all animate-in fade-in relative", selectedProductIds.includes(product.id) && "ring-2 ring-primary-500 border-primary-200")}>
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
 {product.status === 'pending_approval' && (
   <button 
     onClick={() => approveProduct(product.id)}
     className="p-3 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white shadow-sm transition-all"
     title="Phê duyệt sản phẩm"
   >
     <CheckCircle2 className="w-5 h-5" />
   </button>
 )}
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
 <div onClick={() => { setShowDetailForProduct(product); setActiveDetailTab('overview'); setCurrentGalleryIndex(0); }} className="relative h-44 w-full rounded-lg bg-slate-50 border border-slate-300 overflow-hidden mb-4 group-hover:shadow-sm transition-all cursor-pointer">
 <img src={product.image} alt={product.name} className={cn("w-full h-full object-cover  transition-transform duration-700", product.status === 'hidden' && "grayscale opacity-50")} referrerPolicy="no-referrer" />
 <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm rounded-lg text-[8px] font-black text-slate-600 shadow-sm border border-slate-200 uppercase tracking-tighter z-10">
 {product.id}
 </div>
 {isAiSearch && product.similarity !== undefined && (
 <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-primary-600/95 text-white rounded-lg text-[8px] font-black shadow-sm z-10 flex items-center gap-1 uppercase tracking-wider">
 <Sparkles className="w-2.5 h-2.5 text-white animate-pulse" />
 {(product.similarity * 100).toFixed(1)}% Match
 </div>
 )}
 {/* Status Badge */}
 <div className="absolute bottom-2 left-2 flex gap-2 z-10">
 <span className={cn(
 "px-2 py-1 rounded-md text-[8px] font-black flex items-center gap-1.5 shadow-sm uppercase tracking-wider border backdrop-blur-md",
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
 <div className="flex justify-between items-start mb-2">
 <span className="text-[8px] font-black text-primary-750 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 uppercase tracking-wider shadow-sm inline-block">
 {product.category}
 </span>
 </div>
 <h3 onClick={() => { setShowDetailForProduct(product); setActiveDetailTab('overview'); setCurrentGalleryIndex(0); }} className="text-sm font-black text-[#111827] group-hover:text-primary-750 transition-colors line-clamp-2 tracking-tight leading-tight mb-3 flex-1 h-10 cursor-pointer">
 {product.name}
 </h3>

 <div className="space-y-2 mb-4">
 <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-md border border-slate-200">
 <div className="flex items-center gap-1.5 text-[10px] text-[#4B5563] font-bold">
 <ShieldCheck className="w-4 h-4 text-emerald-500" />
 <span className="truncate max-w-[90px]">{product.sellerName}</span>
 </div>
 <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280] font-medium">
 <Hash className="w-3.5 h-3.5 text-primary-500" />
 <span className="font-mono text-[10px] uppercase font-black">{product.sku}</span>
 </div>
 </div>

 <div className="flex justify-between items-end px-1.5">
 <div className="space-y-1">
 <p className="text-[8px] text-[#6B7280] font-black uppercase tracking-widest">Giá bán</p>
 <p className="text-lg font-black text-[#111827] font-mono leading-none">
 {formatCurrency(product.price)}
 </p>
 </div>
 <div className="text-right space-y-1">
 <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest flex items-center justify-end gap-0.5">
 <Target className="w-3 h-3" /> Profit
 </p>
 <div className="flex items-baseline gap-1">
 <p className="text-sm font-black text-emerald-600 font-mono leading-none">
 +{formatCurrency(product.profit)}
 </p>
 <span className="text-[8px] font-black text-emerald-500/80 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">+{product.margin}%</span>
 </div>
 </div>
 </div>

 <div className="border-t border-slate-200 pt-2.5 mt-2.5 flex justify-between items-center px-1.5 relative z-20">
 <p className="text-[9px] text-[#6B7280] font-black uppercase tracking-widest" title="Bao gồm phí vận chuyển, đóng gói,...">Chi phí ẩn</p>
 <input 
 type="number"
 defaultValue={product.hiddenCosts || 0}
 onBlur={(e) => updateHiddenCost(product, Number(e.target.value))}
                      className="w-20 text-right bg-white border border-slate-300 hover:border-primary-300 rounded-md px-2 py-1 text-[10px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-[#111827] shadow-sm transition-all"
                      placeholder="VD: 15000"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-md border border-slate-200 mt-1.5 px-2 py-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ghi sổ</span>
                    <div className="flex items-center gap-1">
                      {product.misaSynced ? (
                        <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">Đã ghi sổ 🟢</span>
                      ) : product.misaSyncError ? (
                        <span className="text-[8px] font-black text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200 uppercase tracking-wider" title={product.misaSyncError}>Lỗi 🔴</span>
                      ) : (
                        <span className="text-[8px] font-black text-slate-500 bg-slate-50 px-1 py-0.5 rounded border border-slate-200 uppercase tracking-wider">Chờ 🟡</span>
                      )}
                      <button
                        disabled={syncingProductId === product.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setSyncingProductId(product.id);
                          try {
                            await syncProductToMisa(product.id);
                            alert("Ghi sổ sản phẩm thành công!");
                          } catch (err) {
                            alert("Ghi sổ thất bại: " + err.message);
                          } finally {
                            setSyncingProductId(null);
                          }
                        }}
                        className="px-1 py-0.5 bg-slate-900 text-white rounded text-[8px] font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-0.5"
                      >
                        {syncingProductId === product.id && <Loader2 className="w-2 h-2 animate-spin" />}
                        Sync
                      </button>
                    </div>
                  </div>
                </div>

 {/* Footer Metrics */}
 <div className="mt-auto pt-5 border-t border-slate-200 flex items-center justify-between">
 <div className="flex flex-col gap-2">
 <div className="flex items-center gap-2 text-[10px] font-black text-primary-750">
 <Sparkles className="w-4 h-4 text-primary-500 animate-pulse" /> AI Verified
 </div>
 <div className="flex items-center gap-2">
 <div className={cn("w-2.5 h-2.5 rounded-full", product.stock < 10 ? "bg-red-500 animate-pulse" : "bg-emerald-500")}></div>
 <p className="text-[11px] text-[#111827] font-black uppercase tracking-tighter">Kho: {product.stock} SP</p>
 </div>
 </div>

 <button 
 onClick={() => { setShowDetailForProduct(product); setActiveDetailTab('overview'); setCurrentGalleryIndex(0); }}
 className="flex items-center gap-2 text-[11px] font-black text-primary-750 hover:translate-x-1 transition-all bg-slate-100 px-4 py-2.5 rounded-lg group/btn"
 >
 Xem chi tiết <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
 </button>
  </div>
  </div>
  </div>
  ))}
  </div>
  </div>
      )}

      {activePimTab === 'combos' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-6">
          <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-none mb-1">
                Quản lý Combo sản phẩm
              </h3>
              <p className="text-[10px] text-slate-600 font-medium mt-1">
                Tạo và bán các gói combo sản phẩm mua chung
              </p>
            </div>
            <button 
              onClick={() => {
                setNewComboItems([]);
                setNewCombo({
                  name: '',
                  description: '',
                  price: 0,
                  costPrice: 0,
                  status: 'active'
                });
                setShowCreateComboModal(true);
              }}
              className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5 hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Tạo Combo mới
            </button>
          </div>

          <div className="p-6 flex-1">
            {combosLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
              </div>
            ) : combos.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-medium">
                Chưa có combo nào được tạo.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {combos.map((combo) => (
                  <div key={combo.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all bg-white relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-base font-black text-slate-900">{combo.name}</h4>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                          combo.status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                        )}>
                          {combo.status === 'active' ? 'Đang bán' : 'Ngưng bán'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mb-4 line-clamp-2">{combo.description || 'Không có mô tả'}</p>
                      
                      <div className="space-y-2 border-t border-slate-100 pt-3 mb-4">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sản phẩm trong combo:</div>
                        {combo.items?.map((item: any) => {
                          const prod = products.find(p => p.id === item.product_id);
                          return (
                            <div key={item.id} className="flex justify-between items-center text-xs font-bold text-slate-700">
                              <span className="truncate max-w-[180px]">{prod ? prod.name : 'Sản phẩm ' + item.product_id}</span>
                              <span className="text-slate-600">x{item.quantity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex justify-between items-end">
                      <div>
                        <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Giá Combo</div>
                        <div className="text-lg font-black text-slate-900 font-mono">{formatCurrency(combo.price)}</div>
                      </div>
                      <div>
                        <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest text-right">Giá vốn</div>
                        <div className="text-sm font-black text-slate-600 font-mono text-right">{formatCurrency(combo.costPrice)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateComboModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-300 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#F3F4F6] flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Tạo Combo mới</h3>
              <button 
                onClick={() => setShowCreateComboModal(false)}
                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Tên Combo</label>
                  <input 
                    type="text"
                    required
                    placeholder="VD: Combo Cơm trưa gia đình, Combo Dã ngoại..."
                    value={newCombo.name}
                    onChange={(e) => setNewCombo({ ...newCombo, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Mô tả Combo</label>
                  <textarea 
                    placeholder="Nhập mô tả chi tiết sản phẩm..."
                    value={newCombo.description}
                    onChange={(e) => setNewCombo({ ...newCombo, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Giá Combo (để trống để tự tính)</label>
                  <input 
                    type="number"
                    value={newCombo.price || ''}
                    onChange={(e) => setNewCombo({ ...newCombo, price: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Giá vốn Combo (để trống để tự tính)</label>
                  <input 
                    type="number"
                    value={newCombo.costPrice || ''}
                    onChange={(e) => setNewCombo({ ...newCombo, costPrice: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              {/* Add item row */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-4">
                <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Thêm sản phẩm đơn lẻ vào Combo</div>
                <div className="grid grid-cols-4 gap-4 items-end">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-slate-600">Sản phẩm</label>
                    <select
                      value={selectedComboProdId}
                      onChange={(e) => setSelectedComboProdId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="">Chọn sản phẩm...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-600">Số lượng</label>
                    <input 
                      type="number"
                      min="1"
                      value={selectedComboQty}
                      onChange={(e) => setSelectedComboQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddComboItem}
                    className="bg-slate-900 hover:bg-slate-800 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold h-fit transition-colors"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* Selected items list */}
              <div className="space-y-2">
                <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Sản phẩm đã chọn cho Combo</div>
                {newComboItems.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs font-medium border border-dashed border-slate-300 rounded-lg">
                    Chưa có sản phẩm nào được chọn.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                          <th className="p-3">Sản phẩm</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3">Số lượng</th>
                          <th className="p-3 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                        {newComboItems.map(item => (
                          <tr key={item.productId}>
                            <td className="p-3">{item.name}</td>
                            <td className="p-3 text-slate-600">{item.sku}</td>
                            <td className="p-3 font-black">{item.quantity}</td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => setNewComboItems(prev => prev.filter(x => x.productId !== item.productId))}
                                className="text-rose-600 hover:text-rose-800 font-bold"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-[#F3F4F6] flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setShowCreateComboModal(false)}
                className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleCreateCombo}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-[#FAF9F5] rounded-lg text-sm font-bold shadow-sm transition-colors"
              >
                Lưu Combo
              </button>
            </div>
          </div>
        </div>
      )}

  <DraggableGrid className="grid grid-cols-1 lg:grid-cols-2 gap-6" columns={2} gap={32}>
 <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-6 rounded-lg text-[#FAF9F5] relative overflow-hidden shadow-sm flex flex-col justify-between group">
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
 <button className="px-6 py-4 bg-[#111827] text-[#FAF9F5] font-bold rounded-lg text-xs hover:translate-y-[-2px] transition-all uppercase tracking-[0.2em] shadow-sm shadow-slate-900/40">Launch Data AI Matrix</button>
 </div>
 <Target className="absolute -bottom-12 -right-12 w-64 h-64 text-[#FAF9F5]/5 opacity-50 group-hover:rotate-12 transition-transform duration-1000" />
 </div>

 <div className="bg-white p-6 border border-slate-300 rounded-lg shadow-sm space-y-8 relative overflow-hidden group">
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
 <Activity className="absolute -top-12 -right-12 w-48 h-48 text-slate-100 opacity-50  transition-transform duration-700" />
 </div>
 </DraggableGrid>
 
 {/* P&L Details Modal */}
 {showPnLForProduct && (
 <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col animate-in slide-in-from-right-4 duration-300">
 <div className="bg-white w-full max-w-7xl mx-auto flex flex-col flex-1 relative">
 {/* Header */}
 <div className="px-6 py-6 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center text-primary-750">
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
 <div className="p-6 overflow-y-auto no-scrollbar space-y-8">
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
 <span className="px-2.5 py-1 bg-primary-750 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
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
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
 <Sparkles className="w-3.5 h-3.5 text-primary-600" /> Cấu hình Giá & Chi phí gốc
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
 className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono font-bold focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
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
 className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono font-bold focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
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
 className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono font-bold focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
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
 <p className="text-[9px] text-primary-600 font-bold">Tùy chọn hiển thị</p>
 </div>
 </div>
 <p className="text-xs font-mono font-bold text-primary-750">
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
 <div className="bg-slate-900 rounded-lg p-6 text-[#FAF9F5] relative overflow-hidden flex items-center justify-between shadow-sm shadow-blue-900/20">
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

 <div className="relative z-10 text-right bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20">
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
 
 <div className="flex items-start gap-3 p-5 bg-slate-50 rounded-lg border border-slate-200">
 <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
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

  {showDetailForProduct && (
    <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col animate-in slide-in-from-right-4 duration-300">
      <div className="bg-white w-full max-w-7xl mx-auto flex flex-col flex-1 relative shadow-sm border-x border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10 flex justify-between items-center shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center text-primary-750">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Chi tiết sản phẩm</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                SKU: {showDetailForProduct.sku} | ID: {showDetailForProduct.id}
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setShowDetailForProduct(null); }}
            className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100/80 p-1.5 border-b border-slate-200 gap-1.5 overflow-x-auto">
          <button 
            onClick={() => setActiveDetailTab('overview')}
            className={cn("px-5 py-2.5 text-xs font-black rounded-lg transition-all uppercase tracking-wider flex items-center gap-2 shrink-0", activeDetailTab === 'overview' ? "bg-white text-primary-750 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-800")}
          >
            <Package className="w-4 h-4" /> Tổng quan
          </button>
          <button 
            onClick={() => setActiveDetailTab('specs')}
            className={cn("px-5 py-2.5 text-xs font-black rounded-lg transition-all uppercase tracking-wider flex items-center gap-2 shrink-0", activeDetailTab === 'specs' ? "bg-white text-primary-750 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-800")}
          >
            <Layers className="w-4 h-4" /> Cấu hình & Specs
          </button>
          <button 
            onClick={() => setActiveDetailTab('media')}
            className={cn("px-5 py-2.5 text-xs font-black rounded-lg transition-all uppercase tracking-wider flex items-center gap-2 shrink-0", activeDetailTab === 'media' ? "bg-white text-primary-750 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-800")}
          >
            <Camera className="w-4 h-4" /> Ảnh & Video
          </button>
          <button 
            onClick={() => setActiveDetailTab('pnl')}
            className={cn("px-5 py-2.5 text-xs font-black rounded-lg transition-all uppercase tracking-wider flex items-center gap-2 shrink-0", activeDetailTab === 'pnl' ? "bg-white text-primary-750 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-800")}
          >
            <Calculator className="w-4 h-4" /> Phân tích P&L
          </button>
          <button 
            onClick={() => {
              setActiveDetailTab('edit');
              setEditProductData({
                name: showDetailForProduct.name,
                brand: showDetailForProduct.brand,
                category: showDetailForProduct.category,
                price: showDetailForProduct.price,
                costPrice: showDetailForProduct.costPrice,
                hiddenCosts: showDetailForProduct.hiddenCosts,
                stock: showDetailForProduct.stock,
                sku: showDetailForProduct.sku,
                image: showDetailForProduct.image,
                description: showDetailForProduct.description || '',
                weight: showDetailForProduct.weight || '',
                dimensions: showDetailForProduct.dimensions || '',
                videoUrl: showDetailForProduct.videoUrl || '',
                images: showDetailForProduct.images || [],
                specs: showDetailForProduct.specs || []
              });
            }}
            className={cn("px-5 py-2.5 text-xs font-black rounded-lg transition-all uppercase tracking-wider flex items-center gap-2 shrink-0 ml-auto", activeDetailTab === 'edit' ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-800")}
          >
            <Settings className="w-4 h-4" /> Chỉnh sửa
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          {activeDetailTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left side: Main Image Preview & Quick specs */}
              <div className="space-y-4">
                <div className="relative aspect-square w-full rounded-lg bg-white border border-slate-200 overflow-hidden shadow-sm flex items-center justify-center">
                  <img 
                    src={showDetailForProduct.images && showDetailForProduct.images.length > 0 
                      ? showDetailForProduct.images[currentGalleryIndex] 
                      : showDetailForProduct.image} 
                    alt={showDetailForProduct.name} 
                    className="w-full h-full object-contain p-4"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {showDetailForProduct.images && showDetailForProduct.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {showDetailForProduct.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentGalleryIndex(idx)}
                        className={cn("w-16 h-16 rounded-lg border bg-white overflow-hidden shadow-sm shrink-0 transition-all", idx === currentGalleryIndex ? "ring-2 ring-primary-500 border-primary-500" : "border-slate-200 hover:border-primary-200")}
                      >
                        <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side: Core Info & Description */}
              <div className="flex flex-col space-y-4">
                <div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                    {showDetailForProduct.category}
                  </span>
                  <span className="px-2.5 py-1 bg-primary-50 text-primary-750 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-100 ml-2">
                    {showDetailForProduct.brand || 'No Brand'}
                  </span>
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 leading-snug">{showDetailForProduct.name}</h4>
                
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-200">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Giá bán lẻ</p>
                    <p className="text-2xl font-black text-slate-900 font-mono mt-1">{formatCurrency(showDetailForProduct.price)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Tồn kho</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("w-3 h-3 rounded-full", showDetailForProduct.stock < 10 ? "bg-red-500 animate-pulse" : "bg-emerald-500")} />
                      <span className="text-lg font-black text-slate-900 font-mono">{showDetailForProduct.stock} sản phẩm</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-[200px]">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mô tả sản phẩm</h5>
                  <div 
                    className="bg-white border border-slate-200 rounded-lg p-4 overflow-y-auto max-h-[300px] text-sm text-slate-600 leading-relaxed font-sans prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: showDetailForProduct.description || '<p className="text-slate-400 italic">Chưa có mô tả chi tiết sản phẩm.</p>' }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeDetailTab === 'specs' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary-600" />
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Thông số kỹ thuật</h4>
                </div>
                <table className="w-full text-left text-sm text-slate-600 divide-y divide-slate-200">
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="px-6 py-3.5 bg-slate-50/50 w-1/3 font-black text-[11px] uppercase tracking-wider text-slate-500">Mã SKU</td>
                      <td className="px-6 py-3.5 font-mono text-slate-900 font-bold">{showDetailForProduct.sku}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3.5 bg-slate-50/50 font-black text-[11px] uppercase tracking-wider text-slate-500">Nhà cung cấp (Seller)</td>
                      <td className="px-6 py-3.5 text-slate-900">{showDetailForProduct.sellerName}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3.5 bg-slate-50/50 font-black text-[11px] uppercase tracking-wider text-slate-500">Trọng lượng</td>
                      <td className="px-6 py-3.5 text-slate-900">{showDetailForProduct.weight ? `${showDetailForProduct.weight} Gram` : 'Chưa cập nhật'}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3.5 bg-slate-50/50 font-black text-[11px] uppercase tracking-wider text-slate-500">Kích thước (DxRxC)</td>
                      <td className="px-6 py-3.5 text-slate-900">{showDetailForProduct.dimensions ? `${showDetailForProduct.dimensions} cm` : 'Chưa cập nhật'}</td>
                    </tr>
                    {showDetailForProduct.specs && showDetailForProduct.specs.map((spec, sIdx) => (
                      <tr key={sIdx}>
                        <td className="px-6 py-3.5 bg-slate-50/50 font-black text-[11px] uppercase tracking-wider text-slate-500">{spec.key}</td>
                        <td className="px-6 py-3.5 text-slate-900">{spec.value}</td>
                      </tr>
                    ))}
                    {(!showDetailForProduct.specs || showDetailForProduct.specs.length === 0) && (
                      <tr>
                        <td colSpan={2} className="px-6 py-8 text-center text-slate-400 italic">
                          Chưa cập nhật thêm thông số kỹ thuật tùy biến.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeDetailTab === 'media' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Images grid */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary-600" /> Thư viện ảnh sản phẩm
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {showDetailForProduct.images && showDetailForProduct.images.map((imgUrl, imgIdx) => (
                    <div key={imgIdx} className="aspect-square bg-white border border-slate-200 rounded-lg overflow-hidden relative shadow-sm group">
                      <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200">
                        <Maximize2 className="w-6 h-6" />
                      </a>
                    </div>
                  ))}
                  {(!showDetailForProduct.images || showDetailForProduct.images.length === 0) && (
                    <div className="col-span-3 bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 italic">
                      Chưa có ảnh phụ trong thư viện.
                    </div>
                  )}
                </div>
              </div>

              {/* Video section */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Tv className="w-5 h-5 text-primary-600" /> Video giới thiệu
                </h4>
                {showDetailForProduct.videoUrl ? (
                  <div className="w-full rounded-lg overflow-hidden border border-slate-200 bg-black aspect-video relative shadow-sm">
                    {showDetailForProduct.videoUrl.includes('youtube.com') || showDetailForProduct.videoUrl.includes('youtu.be') ? (
                      (() => {
                        const getYoutubeId = (url: string) => {
                          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                          const match = url.match(regExp);
                          return (match && match[2].length === 11) ? match[2] : null;
                        };
                        const videoId = getYoutubeId(showDetailForProduct.videoUrl);
                        return videoId ? (
                          <iframe 
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="Product Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="p-4 text-center text-white text-xs">Không thể phân tích mã video YouTube</div>
                        );
                      })()
                    ) : (
                      <video 
                        className="w-full h-full" 
                        controls 
                        src={showDetailForProduct.videoUrl}
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 aspect-video shadow-inner">
                    <Tv className="w-10 h-10 text-slate-600 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Không có video giới thiệu</p>
                    <p className="text-[10px] text-slate-500 mt-1 text-center">Bạn có thể thêm liên kết video YouTube hoặc link MP4 trong tab Chỉnh sửa.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeDetailTab === 'pnl' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial Summary */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" /> Báo cáo doanh thu & Lợi nhuận gộp
                </h4>
                <div className="divide-y divide-slate-100 space-y-3 pt-2 font-medium">
                  <div className="flex justify-between text-sm py-1.5">
                    <span className="text-slate-500">Giá niêm yết (Retail Price)</span>
                    <span className="font-mono font-black text-slate-900">{formatCurrency(showDetailForProduct.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1.5">
                    <span className="text-slate-500">Giá vốn gốc (Cost Price)</span>
                    <span className="font-mono font-bold text-slate-700">{formatCurrency(showDetailForProduct.costPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1.5">
                    <span className="text-slate-500">Chi phí ẩn (Vận chuyển, đóng gói)</span>
                    <span className="font-mono text-slate-700">{formatCurrency(showDetailForProduct.hiddenCosts)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1.5 pt-3 font-bold border-t border-slate-200">
                    <span className="text-slate-800">Lợi nhuận gộp (Gross Profit)</span>
                    <span className="font-mono text-emerald-600">+{formatCurrency(showDetailForProduct.profit)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1.5">
                    <span className="text-slate-800">Biên lợi nhuận (Gross Margin)</span>
                    <span className="font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-emerald-700 text-xs font-black">+{showDetailForProduct.margin}%</span>
                  </div>
                </div>
              </div>

              {/* Integration & Misa status */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary-600" /> Trạng thái đồng bộ MISA AMIS
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-2">
                    Sản phẩm này cần được ghi sổ kế toán và ánh xạ đầy đủ sang DIInventoryItems trên hệ thống MISA AMIS Cloud để thực hiện các nghiệp vụ bán hàng kiêm xuất kho tự động.
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2 mt-4 font-bold">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Trạng thái liên kết</span>
                    {showDetailForProduct.misaSynced ? (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 uppercase tracking-wider">Đã đồng bộ hóa 🟢</span>
                    ) : showDetailForProduct.misaSyncError ? (
                      <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 uppercase tracking-wider">Lỗi kết nối 🔴</span>
                    ) : (
                      <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200 uppercase tracking-wider">Chờ đồng bộ 🟡</span>
                    )}
                  </div>
                  {showDetailForProduct.misaSyncedAt && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Thời điểm đồng bộ</span>
                      <span className="text-slate-800 font-mono text-[11px]">{new Date(showDetailForProduct.misaSyncedAt).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeDetailTab === 'edit' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6 shadow-sm">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Settings className="w-5 h-5 text-primary-600" /> Trình chỉnh sửa chi tiết sản phẩm
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic settings */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tên sản phẩm</label>
                    <input 
                      type="text"
                      value={editProductData.name || ''}
                      onChange={(e) => setEditProductData({...editProductData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:bg-white transition-all font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Thương hiệu</label>
                      <input 
                        type="text"
                        value={editProductData.brand || ''}
                        onChange={(e) => setEditProductData({...editProductData, brand: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ngành hàng</label>
                      <input 
                        type="text"
                        value={editProductData.category || ''}
                        onChange={(e) => setEditProductData({...editProductData, category: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:bg-white font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Giá bán lẻ</label>
                      <input 
                        type="number"
                        value={editProductData.price || 0}
                        onChange={(e) => setEditProductData({...editProductData, price: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono font-bold focus:outline-none focus:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tồn kho</label>
                      <input 
                        type="number"
                        value={editProductData.stock || 0}
                        onChange={(e) => setEditProductData({...editProductData, stock: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono font-bold focus:outline-none focus:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Trọng lượng (g)</label>
                      <input 
                        type="text"
                        value={editProductData.weight || ''}
                        onChange={(e) => setEditProductData({...editProductData, weight: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono font-bold focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Media settings */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">URL ảnh chính</label>
                    <input 
                      type="text"
                      value={editProductData.image || ''}
                      onChange={(e) => setEditProductData({...editProductData, image: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">URL bộ sưu tập ảnh (Cách nhau bằng dấu phẩy)</label>
                    <input 
                      type="text"
                      value={editProductData.images ? editProductData.images.join(', ') : ''}
                      onChange={(e) => {
                        const urls = e.target.value.split(',').map(url => url.trim()).filter(url => url.length > 0);
                        setEditProductData({...editProductData, images: urls});
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:bg-white"
                      placeholder="Ví dụ: url1.jpg, url2.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">URL Video giới thiệu (YouTube / mp4)</label>
                    <input 
                      type="text"
                      value={editProductData.videoUrl || ''}
                      onChange={(e) => setEditProductData({...editProductData, videoUrl: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:bg-white"
                      placeholder="Ví dụ: https://www.youtube.com/watch?v=..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Detailed Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Mô tả sản phẩm (HTML)</label>
                  <textarea 
                    rows={5}
                    value={editProductData.description || ''}
                    onChange={(e) => setEditProductData({...editProductData, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium resize-none"
                  />
                </div>

                {/* Specifications text parsing area */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Thông số cấu hình kỹ thuật (Mỗi dòng một thông số Key: Value)</label>
                  <textarea 
                    rows={5}
                    value={editProductData.specs ? editProductData.specs.map(s => `${s.key}: ${s.value}`).join('\n') : ''}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      const specArray = lines.map(line => {
                        const idx = line.indexOf(':');
                        if (idx === -1) return null;
                        return {
                          key: line.substring(0, idx).trim(),
                          value: line.substring(idx + 1).trim()
                        };
                      }).filter((item): item is { key: string; value: string } => item !== null);
                      setEditProductData({...editProductData, specs: specArray});
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium font-mono resize-none"
                    placeholder="Ví dụ:&#10;CPU: Apple A18 Pro&#10;RAM: 8GB"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setActiveDetailTab('overview')}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs uppercase tracking-wider hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={async () => {
                    if (!showDetailForProduct) return;
                    
                    const price = editProductData.price || 0;
                    const costPrice = editProductData.costPrice || (price * 0.7);
                    const hiddenCosts = editProductData.hiddenCosts || 0;
                    const profit = price - costPrice - hiddenCosts;
                    const margin = price > 0 ? (profit / price) * 100 : 0;
                    
                    const updatedProduct = {
                      ...editProductData,
                      profit,
                      margin: Number(margin.toFixed(1)),
                      updatedAt: serverTimestamp()
                    };

                    try {
                      await updateDoc(doc(db, 'products', showDetailForProduct.id), updatedProduct);
                      log({ action: 'product.updated', targetId: showDetailForProduct.id, targetLabel: updatedProduct.name, meta: { updatedProduct } });
                      setShowDetailForProduct({
                        ...showDetailForProduct,
                        ...updatedProduct
                      } as Product);
                      setActiveDetailTab('overview');
                      alert("Cập nhật thông tin sản phẩm thành công!");
                    } catch (err) {
                      console.error("Lỗi cập nhật sản phẩm:", err);
                      alert("Cập nhật sản phẩm thất bại!");
                    }
                  }}
                  className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-lg text-xs uppercase tracking-wider hover:bg-primary-700 shadow-sm"
                >
                  Lưu cấu hình & thông tin
                </button>
              </div>
            </div>
          )}
        </div>
              </div>
      </div>
    )}
  </div>
  );
}
