import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  DollarSign, 
  CreditCard, 
  Lock, 
  Unlock, 
  MessageSquare, 
  PhoneCall, 
  CheckCircle2, 
  RefreshCw, 
  Trophy, 
  ShieldCheck, 
  BadgeDollarSign, 
  Building, 
  User, 
  Phone, 
  Mail, 
  ExternalLink,
  Kanban,
  Coins,
  Send,
  MoreVertical,
  Check,
  Building2,
  Trash2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Customer } from '../types/erp';
import { supabase } from '../lib/supabase';
import { db, collection, onSnapshot } from '../lib/firebase';
import { syncCustomerToMisa } from '../services/misaService';
import { CompactPageHeader } from './common/CompactPageHeader';
import { CompactStatsRibbon, MetricRibbonItem } from './common/CompactStatsRibbon';

// VComm Design System UI Kit
import { 
  AppModuleShell, 
  StatMetricCard, 
  UnifiedDataTable, 
  FilterToolbar, 
  StatusBadge, 
  EntityLink,
  ColumnDef
} from './ui/design-system';

// Modular Customer Subcomponents
import { CustomerDetailModal } from './customers/CustomerDetailModal';
import { CustomerPipelineView } from './customers/CustomerPipelineView';
import { CustomerRfmView } from './customers/CustomerRfmView';
import { CustomerActivitiesView } from './customers/CustomerActivitiesView';
import { CustomerLoyaltyConfigView } from './customers/CustomerLoyaltyConfigView';
import { AddCustomerModal } from './customers/AddCustomerModal';
import { AdjustBalanceModal } from './customers/AdjustBalanceModal';
import { AiMessageModal } from './customers/AiMessageModal';

export function Customers() {
  const navigate = useNavigate();
  const location = useLocation();

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<'customers' | 'pipeline' | 'rfm_ai' | 'activities' | 'loyalty'>('customers');

  // Customer List Data & Loading State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const triggerRefresh = () => setRefreshCount(prev => prev + 1);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Cross-App Linked Data
  const [orders, setOrders] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  // Modals & Selected States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [adjustingCustomer, setAdjustingCustomer] = useState<Customer | null>(null);
  const [aiCustomer, setAiCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncingCustomerId, setSyncingCustomerId] = useState<string | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  // Handle URL deep linking (e.g. ?search=0987654321 or ?customerId=cust_123)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    const custId = params.get('customerId');
    if (q) setSearchQuery(q);
    if (custId && customers.length > 0) {
      const found = customers.find(c => c.id === custId);
      if (found) setSelectedCustomer(found);
    }
  }, [location.search, customers]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Customers from Supabase
  useEffect(() => {
    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        let queryBuilder = supabase
          .from('customers')
          .select('*', { count: 'exact' });

        if (debouncedSearchQuery.trim() !== '') {
          queryBuilder = queryBuilder.or(
            `name.ilike.%${debouncedSearchQuery}%,phone.ilike.%${debouncedSearchQuery}%,email.ilike.%${debouncedSearchQuery}%`
          );
        }

        queryBuilder = queryBuilder.order('name', { ascending: true });

        const { data, count, error } = await queryBuilder;

        if (active) {
          if (error) {
            console.warn('Supabase customers query fallback to users table:', error);
            // Fallback: Read from users table
            const { data: usersData, count: usersCount } = await supabase
              .from('users')
              .select('*', { count: 'exact' })
              .limit(100);

            if (usersData) {
              const mapped = usersData.map((u: any) => ({
                id: u.id,
                name: u.data?.displayName || u.data?.name || 'Khách hàng',
                phone: u.data?.phone || '',
                email: u.data?.email || '',
                totalSpent: Number(u.data?.totalSpent || 0),
                orderCount: Number(u.data?.orderCount || 0),
                status: u.data?.status === 'locked' ? 'locked' : 'active',
                channels: u.data?.channels || ['web'],
                tier: u.data?.tier || 'Hạng Bạc',
                points: Number(u.data?.points || u.data?.vXu || 0),
                walletBalance: Number(u.data?.walletBalance || u.data?.balance || 0),
                taxCode: u.data?.taxCode || null,
                customerType: u.data?.customerType || 'b2c',
                creditLimit: Number(u.data?.creditLimit || 50000000),
                lastOrderDate: u.data?.lastOrderDate || '2026-03-15'
              })) as Customer[];

              setCustomers(mapped);
              setTotalCount(usersCount || mapped.length);
            }
          } else if (data) {
            setCustomers(data as Customer[]);
            setTotalCount(count || data.length);
          }
        }
      } catch (err) {
        console.error('Failed to load customers', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [debouncedSearchQuery, refreshCount]);

  // Listen to linked collections for real-time consistency
  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setOrders(data);
    }, (err) => console.warn('Orders firestore offline', err));

    const unsubLeases = onSnapshot(collection(db, 'device_leases'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setLeases(data);
    }, (err) => console.warn('Leases firestore offline', err));

    const unsubTransactions = onSnapshot(collection(db, 'finance_transactions'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setTransactions(data);
    }, (err) => console.warn('Transactions firestore offline', err));

    // Load LocalStorage records for contracts, sellers, and payouts
    try {
      const c = localStorage.getItem('vcomm_contracts');
      if (c) setContracts(JSON.parse(c));

      const s = localStorage.getItem('vcomm_seller_credit_scores');
      if (s) setSellers(JSON.parse(s));

      const p = localStorage.getItem('vcomm_early_payouts');
      if (p) setPayouts(JSON.parse(p));
    } catch (e) {}

    return () => {
      unsubOrders();
      unsubLeases();
      unsubTransactions();
    };
  }, []);

  // Compute dynamic live fields (Orders and real-time Spent sync)
  const enrichedCustomers = useMemo(() => {
    return customers.map(c => {
      const customerOrders = orders.filter(o => 
        (o.customerId && o.customerId === c.id) ||
        (o.customerPhone && o.customerPhone === c.phone) ||
        (o.customerName && o.customerName.toLowerCase() === c.name.toLowerCase())
      );
      const computedSpent = customerOrders.length > 0 
        ? customerOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
        : (c.totalSpent || 0);
      const computedOrdersCount = customerOrders.length > 0 ? customerOrders.length : (c.orderCount || 0);

      return {
        ...c,
        totalSpent: computedSpent,
        orderCount: computedOrdersCount
      };
    });
  }, [customers, orders]);

  // Filtered customers based on all active dropdown filters
  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter(c => {
      if (channelFilter !== 'all' && !c.channels?.includes(channelFilter as any)) return false;
      if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (typeFilter !== 'all' && (c as any).customerType !== typeFilter) return false;
      return true;
    });
  }, [enrichedCustomers, channelFilter, tierFilter, statusFilter, typeFilter]);

  // Lock / Unlock customer account
  const handleToggleLock = async (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = currentStatus === 'locked' ? 'active' : 'locked';
      await supabase
        .from('customers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      // Also sync to users table
      const { data: userRow } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      if (userRow) {
        const userData = userRow.data || {};
        userData.status = newStatus;
        await supabase.from('users').update({ data: userData, updated_at: new Date().toISOString() }).eq('id', id);
      }

      triggerRefresh();
    } catch (err) {
      console.error('Error toggling lock state', err);
    }
  };

  // Sync customer profile to VComm accounting
  const handleSyncMisa = async (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncingCustomerId(customer.id);
    try {
      const result = await syncCustomerToMisa(customer);
      if (result.success) {
        alert(`✓ Đã đồng bộ khách hàng "${customer.name}" sang Kế toán VComm thành công!`);
        triggerRefresh();
      } else {
        alert(`Đồng bộ Kế toán VComm thất bại: ${result.error || 'Lỗi kết nối máy chủ kế toán'}`);
      }
    } catch (err: any) {
      alert(`Đồng bộ Kế toán VComm thất bại: ${err.message || err}`);
    } finally {
      setSyncingCustomerId(null);
    }
  };

  // Export to Excel / CSV with UTF-8 BOM for full Vietnamese support
  const handleExportExcel = () => {
    const dataToExport = selectedCustomerIds.length > 0 
      ? filteredCustomers.filter(c => selectedCustomerIds.includes(c.id))
      : filteredCustomers;

    if (dataToExport.length === 0) {
      alert('Không có dữ liệu khách hàng để xuất file!');
      return;
    }

    const headers = ['Mã KH', 'Tên khách hàng', 'Số điện thoại', 'Email', 'Loại KH', 'Hạng thẻ', 'Tổng chi tiêu (VNĐ)', 'Số đơn hàng', 'Số dư Ví (VNĐ)', 'Điểm V-Xu', 'Trạng thái'];
    const rows = dataToExport.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      (c as any).customerType === 'b2b' ? 'Doanh nghiệp B2B' : 'Cá nhân B2C',
      c.tier || 'Hạng Bạc',
      c.totalSpent || 0,
      c.orderCount || 0,
      c.walletBalance || 0,
      c.points || 0,
      c.status === 'locked' ? 'Tạm khóa' : 'Đang hoạt động'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VComm_Danh_Sach_Khach_Hang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import customers from CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length <= 1) {
          alert('File không chứa dữ liệu!');
          return;
        }

        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
          if (cols[1]) {
            const newId = 'cust_imp_' + Date.now() + '_' + i;
            await supabase.from('customers').insert({
              id: newId,
              name: cols[1],
              phone: cols[2] || '',
              email: cols[3] || '',
              customerType: cols[4]?.includes('B2B') ? 'b2b' : 'b2c',
              tier: cols[5] || 'Hạng Bạc',
              status: 'active',
              totalSpent: 0,
              orderCount: 0,
              channels: ['web']
            });
            importedCount++;
          }
        }

        alert(`✓ Nhập thành công ${importedCount} khách hàng từ file!`);
        triggerRefresh();
      } catch (err: any) {
        alert('Lỗi khi đọc file: ' + err.message);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // KPI Metrics Calculations
  const activeCount = useMemo(() => enrichedCustomers.filter(c => c.status !== 'locked').length, [enrichedCustomers]);
  const loyaltyCount = useMemo(() => enrichedCustomers.filter(c => c.tier && c.tier !== 'Hạng Bạc').length, [enrichedCustomers]);
  const clvAverage = useMemo(() => {
    if (enrichedCustomers.length === 0) return 18500000;
    const total = enrichedCustomers.reduce((s, c) => s + (c.totalSpent || 0), 0);
    return Math.round(total / enrichedCustomers.length);
  }, [enrichedCustomers]);

  // UnifiedDataTable Columns Definition
  const columns: ColumnDef<Customer>[] = [
    {
      key: 'customer',
      title: 'Khách hàng & Định danh',
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-900 truncate">{row.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
              <EntityLink type="customer" id={row.id} label={row.id.slice(0, 10)} showIcon={false} />
              <span>•</span>
              <span className="text-slate-700 font-semibold">{row.phone || 'Chưa có SĐT'}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Phân loại B2B/B2C',
      render: (row) => {
        const isB2b = (row as any).customerType === 'b2b';
        return (
          <div>
            <span className={cn(
              "px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border inline-flex items-center gap-1",
              isB2b ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}>
              {isB2b ? <Building className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {isB2b ? 'Doanh nghiệp' : 'Cá nhân'}
            </span>
            {(row as any).taxCode && (
              <p className="text-[10px] text-slate-500 font-mono mt-1">MST: {(row as any).taxCode}</p>
            )}
          </div>
        );
      }
    },
    {
      key: 'channels',
      title: 'Kênh tiếp cận',
      render: (row) => (
        <div className="flex items-center gap-1 flex-wrap">
          {row.channels && row.channels.length > 0 ? (
            row.channels.map(ch => (
              <span key={ch} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold rounded uppercase">
                {ch}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-400 italic">Web</span>
          )}
        </div>
      )
    },
    {
      key: 'loyalty',
      title: 'Hạng Thẻ & V-Xu',
      sortable: true,
      sortValue: (row) => row.points || 0,
      render: (row) => (
        <div>
          <div className="flex items-center gap-1">
            <Trophy className={cn(
              "w-3.5 h-3.5",
              row.tier?.includes('Vàng') ? "text-amber-500" :
              row.tier?.includes('Kim Cương') ? "text-cyan-500" : "text-slate-400"
            )} />
            <span className="font-bold text-xs text-slate-800">{row.tier || 'Hạng Bạc'}</span>
          </div>
          <span className="text-[11px] font-bold text-amber-600 font-mono mt-0.5 block">
            {(row.points || 0).toLocaleString()} V-Xu
          </span>
        </div>
      )
    },
    {
      key: 'spend',
      title: 'Chi tiêu & Đơn hàng',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.totalSpent || 0,
      render: (row) => (
        <div className="text-right">
          <p className="font-black text-xs text-slate-900 font-mono">
            {formatCurrency(row.totalSpent || 0)}
          </p>
          <span className="text-[11px] text-slate-500">
            {row.orderCount || 0} đơn hàng
          </span>
        </div>
      )
    },
    {
      key: 'wallet',
      title: 'Số dư Ví',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.walletBalance || 0,
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-emerald-600 font-mono">
            {formatCurrency(row.walletBalance || 0)}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <StatusBadge 
          status={row.status === 'locked' ? 'danger' : 'success'}
          text={row.status === 'locked' ? 'Tạm khóa' : 'Hoạt động'}
          dot
        />
      )
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          {/* Sync to MISA */}
          <button
            type="button"
            onClick={(e) => handleSyncMisa(row, e)}
            disabled={syncingCustomerId === row.id}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
            title="Đồng bộ sang Kế toán VComm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", syncingCustomerId === row.id && "animate-spin text-blue-600")} />
          </button>

          {/* AI Quick Care Message */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAiCustomer(row);
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
            title="Soạn tin nhắn chăm sóc bằng Gemini AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Nạp tiền / V-Xu */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAdjustingCustomer(row);
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors"
            title="Nạp tiền / Điều chỉnh số dư Ví & V-Xu"
          >
            <CreditCard className="w-3.5 h-3.5" />
          </button>

          {/* Lock / Unlock Toggle */}
          <button
            type="button"
            onClick={(e) => handleToggleLock(row.id, row.status, e)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
            title={row.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
          >
            {row.status === 'locked' ? <Unlock className="w-3.5 h-3.5 text-rose-500" /> : <Lock className="w-3.5 h-3.5" />}
          </button>
        </div>
      )
    }
  ];

  const customerRibbonItems: MetricRibbonItem[] = [
    {
      id: 'total',
      icon: <Users className="w-3.5 h-3.5" />,
      label: 'Tổng Khách CRM',
      value: totalCount.toLocaleString(),
      subText: '+8.5% MoM',
      colorVariant: 'blue',
      onClick: () => setActiveTab('customers')
    },
    {
      id: 'active',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      label: 'Đang Hoạt Động',
      value: activeCount.toLocaleString(),
      subText: 'Giữ chân 94.2%',
      colorVariant: 'emerald'
    },
    {
      id: 'clv',
      icon: <BadgeDollarSign className="w-3.5 h-3.5" />,
      label: 'CLV Trung Bình',
      value: formatCurrency(clvAverage),
      subText: 'AOV ổn định',
      colorVariant: 'purple'
    },
    {
      id: 'loyalty',
      icon: <Trophy className="w-3.5 h-3.5" />,
      label: 'Thành viên Loyalty',
      value: loyaltyCount.toLocaleString(),
      subText: '68% GMV',
      colorVariant: 'amber',
      onClick: () => setActiveTab('loyalty')
    }
  ];

  const crmTabs = [
    { id: 'customers', label: 'Khách hàng 360°', count: totalCount, icon: Users },
    { id: 'pipeline', label: 'Phễu Bán hàng (Pipeline)', badge: 'Deals', icon: Kanban },
    { id: 'rfm_ai', label: 'Phân khúc RFM & AI', badge: 'Gemini AI', icon: Sparkles },
    { id: 'activities', label: 'Nhật ký & Lịch hẹn', icon: PhoneCall },
    { id: 'loyalty', label: 'Cấu hình Hạng thẻ', badge: 'V-Xu', icon: Trophy }
  ];

  return (
    <div className="space-y-3 pb-12 animate-in fade-in slide-in- duration-300">
      {/* Compact Standardized Header */}
      <CompactPageHeader
        icon={<Users className="w-4 h-4 text-blue-600" />}
        title="Quản trị Khách hàng & CRM 360°"
        badge={{ text: "Enterprise CRM", variant: "blue" }}
        description="Hệ sinh thái chăm sóc khách hàng đa kênh, quản lý phễu cơ hội B2B/B2C, phân khúc RFM và trợ lý AI"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <label className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Nhập Excel</span>
              <input type="file" accept=".csv, .xlsx" onChange={handleImportCSV} className="hidden" />
            </label>

            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Xuất danh sách ra file Excel/CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Khách hàng</span>
            </button>
          </div>
        }
      />

      {/* Compact Stats Ribbon */}
      <CompactStatsRibbon
        items={customerRibbonItems}
        storageKey="customers_stats_ribbon"
      />

      {/* Compact Navigation Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs">
        {crmTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all select-none cursor-pointer',
                isActive
                  ? 'bg-blue-600 text-white shadow-2xs shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              )}
            >
              {TabIcon && <TabIcon className="w-3.5 h-3.5 shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'text-[10px] font-black px-1.5 py-0.2 rounded-full',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/70 text-slate-700'
                  )}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span
                  className={cn(
                    'text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CUSTOMERS 360 TABLE */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* Advanced Filter Toolbar */}
          <FilterToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Tìm kiếm theo Tên, Số điện thoại, Email, Mã định danh..."
            activeFiltersCount={[channelFilter, tierFilter, typeFilter, statusFilter].filter(f => f !== 'all').length}
            onResetFilters={() => {
              setSearchQuery('');
              setChannelFilter('all');
              setTierFilter('all');
              setTypeFilter('all');
              setStatusFilter('all');
            }}
            filterGroups={[
              {
                id: 'type',
                label: 'Loại khách hàng',
                value: typeFilter,
                options: [
                  { label: 'Tất cả loại', value: 'all' },
                  { label: 'Doanh nghiệp B2B', value: 'b2b' },
                  { label: 'Cá nhân B2C', value: 'b2c' },
                ],
                onChange: setTypeFilter
              },
              {
                id: 'channel',
                label: 'Kênh tiếp cận',
                value: channelFilter,
                options: [
                  { label: 'Tất cả kênh', value: 'all' },
                  { label: 'Zalo OA', value: 'zalo' },
                  { label: 'Facebook', value: 'facebook' },
                  { label: 'Website Store', value: 'web' },
                  { label: 'Hotline CSKH', value: 'hotline' },
                ],
                onChange: setChannelFilter
              },
              {
                id: 'tier',
                label: 'Hạng thành viên',
                value: tierFilter,
                options: [
                  { label: 'Tất cả hạng', value: 'all' },
                  { label: 'Hạng Bạc', value: 'Hạng Bạc' },
                  { label: 'Hạng Vàng', value: 'Hạng Vàng' },
                  { label: 'Hạng Kim Cương', value: 'Hạng Kim Cương' },
                ],
                onChange: setTierFilter
              },
              {
                id: 'status',
                label: 'Trạng thái',
                value: statusFilter,
                options: [
                  { label: 'Tất cả trạng thái', value: 'all' },
                  { label: 'Đang hoạt động', value: 'active' },
                  { label: 'Tạm khóa', value: 'locked' },
                ],
                onChange: setStatusFilter
              }
            ]}
          />

          {/* Unified Data Table with Selection & Batch Actions */}
          <UnifiedDataTable<Customer>
            columns={columns}
            data={filteredCustomers}
            keyExtractor={(row) => row.id}
            pageSize={10}
            selectable
            selectedKeys={selectedCustomerIds}
            onSelectionChange={setSelectedCustomerIds}
            onRowClick={(row) => setSelectedCustomer(row)}
            isLoading={loading}
            emptyMessage="Không tìm thấy khách hàng phù hợp"
            emptyDescription="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm kết quả."
            batchActions={(selectedRows) => (
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => {
                    navigate('/omnichat');
                  }}
                  className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi tin nhắn ({selectedRows.length})</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Excel</span>
                </button>
              </div>
            )}
          />
        </div>
      )}

      {/* TAB 2: SALES PIPELINE KANBAN */}
      {activeTab === 'pipeline' && (
        <CustomerPipelineView />
      )}

      {/* TAB 3: RFM SEGMENTATION & AI */}
      {activeTab === 'rfm_ai' && (
        <CustomerRfmView 
          customers={enrichedCustomers}
          onSelectCustomer={(cust) => setSelectedCustomer(cust)}
          onNavigateOmniChat={() => navigate('/omnichat')}
        />
      )}

      {/* TAB 4: INTERACTION ACTIVITIES & TIMELINE */}
      {activeTab === 'activities' && (
        <CustomerActivitiesView customers={enrichedCustomers} />
      )}

      {/* TAB 5: LOYALTY & TIERS CONFIG */}
      {activeTab === 'loyalty' && (
        <CustomerLoyaltyConfigView />
      )}

      {/* ================= MODALS ================= */}

      {/* 360 Degree Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          leases={leases}
          transactions={transactions}
          contracts={contracts}
          sellers={sellers}
          payouts={payouts}
          orders={orders}
          onSuccess={triggerRefresh}
        />
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={triggerRefresh}
        />
      )}

      {/* Adjust Balance / Points Modal */}
      {adjustingCustomer && (
        <AdjustBalanceModal
          customer={adjustingCustomer}
          onClose={() => setAdjustingCustomer(null)}
          onSuccess={triggerRefresh}
        />
      )}

      {/* AI Quick Care Message Modal */}
      {aiCustomer && (
        <AiMessageModal
          customer={aiCustomer}
          onClose={() => setAiCustomer(null)}
        />
      )}
    </div>
  );
}
