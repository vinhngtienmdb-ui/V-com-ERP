import { safeLocalStorage } from '../lib/storage';
import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  Check, 
  X, 
  FileText, 
  Plus, 
  Percent, 
  Calendar, 
  AlertTriangle, 
  MessageSquare, 
  Bell, 
  Clock, 
  Filter, 
  Search, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  History, 
  TrendingUp, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, updateDoc, doc, arrayUnion, Timestamp } from 'firebase/firestore';

interface LeaseApplication {
  id: string;
  customerName: string;
  identityCard: string;
  phone: string;
  email: string;
  deviceModel: string;
  deviceType: 'phone' | 'tablet' | 'laptop' | 'other';
  devicePrice: number;
  upfrontFee: number; // Deposit
  monthlyFee: number;
  durationMonths: number;
  dateCreated: string;
  status: 'pending' | 'approved' | 'active' | 'late' | 'completed' | 'cancelled';
  installments: InstallmentSchedule[];
  history: HistoryLog[];
}

interface InstallmentSchedule {
  installmentId: string;
  periodNum: number;
  dueDate: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'overdue';
  datePaid?: string;
  paymentMethod?: string;
}

interface HistoryLog {
  timestamp: string;
  action: string;
  actor: string;
  notes: string;
}

const SAMPLE_DEVICES = [
  { name: 'iPhone 15 Pro Max 256GB', type: 'phone', price: 34990000, monthlyBase: 1950000 },
  { name: 'Samsung Galaxy S24 Ultra 512GB', type: 'phone', price: 31990000, monthlyBase: 1750000 },
  { name: 'iPad Pro M4 11-inch WiFi 256GB', type: 'tablet', price: 28990000, monthlyBase: 1550000 },
  { name: 'MacBook Pro 14-inch M3 Max (36GB/1TB)', type: 'laptop', price: 79990000, monthlyBase: 4450000 },
  { name: 'Asus ROG Strix G16 Gaming Laptop', type: 'laptop', price: 38990000, monthlyBase: 2150000 }
];

export function DeviceLeasing() {
  const [activeTab, setActiveTab] = useState<'applications' | 'active-leases' | 'history'>('applications');
  const [applications, setApplications] = useState<LeaseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLease, setSelectedLease] = useState<LeaseApplication | null>(null);
  
  // Create lease form state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [identityCard, setIdentityCard] = useState('');
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [durationMonths, setDurationMonths] = useState(12);
  const [upfrontPercent, setUpfrontPercent] = useState(20);

  // Simulated notification popup state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifTarget, setNotifTarget] = useState<LeaseApplication | null>(null);
  const [notifInstallment, setNotifInstallment] = useState<InstallmentSchedule | null>(null);
  const [notifChannel, setNotifChannel] = useState<'sms' | 'zalo' | 'email'>('zalo');
  const [notifContent, setNotifContent] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccessText, setNotifSuccessText] = useState('');

  // Fetch from Firebase with offline fallback
  useEffect(() => {
    const qLeases = query(collection(db, 'device_leases'));
    const unsubscribe = onSnapshot(qLeases, (snap) => {
      const data: LeaseApplication[] = [];
      snap.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as LeaseApplication);
      });

      // If firebase is empty or offline-cache is clear, fill with mock data
      if (data.length === 0) {
        const mockData = generateMockLeases();
        mockData.forEach(async (m) => {
          try {
            await addDoc(collection(db, 'device_leases'), m);
          } catch(e) {
            console.error("Error writing mock lease: ", e);
          }
        });
        setApplications(mockData);
      } else {
        // Sort by newest date
        data.sort((a,b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
        setApplications(data);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firebase query error, loading offline-first storage:", error);
      const offlineLeases = safeLocalStorage.getItem('vcomm_device_leases');
      if (offlineLeases) {
        setApplications(JSON.parse(offlineLeases));
      } else {
        const mockData = generateMockLeases();
        setApplications(mockData);
        safeLocalStorage.setItem('vcomm_device_leases', JSON.stringify(mockData));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync to localstorage
  useEffect(() => {
    if (applications.length > 0) {
      safeLocalStorage.setItem('vcomm_device_leases', JSON.stringify(applications));
    }
  }, [applications]);

  const generateMockLeases = (): LeaseApplication[] => {
    return [
      {
        id: "l-mock-1",
        customerName: "Nguyễn Văn Hùng",
        identityCard: "030099026351",
        phone: "0912345678",
        email: "hung.nv@gmail.com",
        deviceModel: "iPhone 15 Pro Max 256GB",
        deviceType: "phone",
        devicePrice: 34990000,
        upfrontFee: 6998000,
        monthlyFee: 2566000,
        durationMonths: 12,
        dateCreated: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: "active",
        installments: [
          { installmentId: "inst-1-1", periodNum: 1, dueDate: "2026-05-15", amount: 2566000, status: "paid", datePaid: "2026-05-14", paymentMethod: "Chuyển khoản VietQR" },
          { installmentId: "inst-1-2", periodNum: 2, dueDate: "2026-06-15", amount: 2566000, status: "unpaid" },
          { installmentId: "inst-1-3", periodNum: 3, dueDate: "2026-07-15", amount: 2566000, status: "unpaid" },
          { installmentId: "inst-1-4", periodNum: 4, dueDate: "2026-08-15", amount: 2566000, status: "unpaid" },
          { installmentId: "inst-1-5", periodNum: 5, dueDate: "2026-09-15", amount: 2566000, status: "unpaid" },
          { installmentId: "inst-1-6", periodNum: 6, dueDate: "2026-10-15", amount: 2566000, status: "unpaid" },
          { installmentId: "inst-1-7", periodNum: 7, dueDate: "2026-11-15", amount: 2566000, status: "unpaid" },
          { installmentId: "inst-1-8", periodNum: 8, dueDate: "2026-12-15", amount: 2566000, status: "unpaid" },
          { installmentId: "inst-1-9", periodNum: 9, dueDate: "2027-01-15", amount: 2566000, status: "unpaid" },
          { installmentId: "inst-1-10", periodNum: 10, dueDate: "2027-02-15", amount: 2566000, status: "unpaid" },
          { installmentId: "inst-1-11", periodNum: 11, dueDate: "2027-03-15", amount: 2566000, status: "unpaid" },
          { installmentId: "inst-1-12", periodNum: 12, dueDate: "2027-04-15", amount: 2566000, status: "unpaid" }
        ],
        history: [
          { timestamp: "2026-04-16 09:30", action: "Nộp hồ sơ thuê thiết bị", actor: "Khách hàng", notes: "Thuê trả góp iPhone 15 Pro Max 256GB mới" },
          { timestamp: "2026-04-16 14:15", action: "Kiểm tra tín dụng & hồ sơ CIC", actor: "VComm Risk Admin", notes: "Điểm tín dụng tốt hạng A - Đủ điều kiện duyệt" },
          { timestamp: "2026-04-16 15:00", action: "Ký Hợp đồng dịch vụ thuê tài sản số #VCL-9921", actor: "VComm Risk Admin", notes: "Khách nộp tiền cọc 20% (6,998,000đ) qua hệ thống, kích hoạt bàn giao bàn giao thiết bị nguyên seal kèm dán nhãn bảo hành bảo lưu nguồn" }
        ]
      },
      {
        id: "l-mock-2",
        customerName: "Trần Thị Ánh Tuyết",
        identityCard: "123456789123",
        phone: "0987654321",
        email: "tuyet.tta@vcomm.vn",
        deviceModel: "MacBook Pro 14-inch M3 Max (36GB/1TB)",
        deviceType: "laptop",
        devicePrice: 79990000,
        upfrontFee: 23997000, // 30% upfront
        monthlyFee: 5133000,
        durationMonths: 12,
        dateCreated: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: "pending",
        installments: [
          { installmentId: "inst-2-1", periodNum: 1, dueDate: "2026-06-21", amount: 5133000, status: "unpaid" },
          { installmentId: "inst-2-2", periodNum: 2, dueDate: "2026-07-21", amount: 5133000, status: "unpaid" },
          { installmentId: "inst-2-3", periodNum: 3, dueDate: "2026-08-21", amount: 5133000, status: "unpaid" },
          { installmentId: "inst-2-4", periodNum: 4, dueDate: "2026-09-21", amount: 5133000, status: "unpaid" },
          { installmentId: "inst-2-5", periodNum: 5, dueDate: "2026-10-21", amount: 5133000, status: "unpaid" },
          { installmentId: "inst-2-6", periodNum: 6, dueDate: "2026-11-21", amount: 5133000, status: "unpaid" },
          { installmentId: "inst-2-7", periodNum: 7, dueDate: "2026-12-21", amount: 5133000, status: "unpaid" },
          { installmentId: "inst-2-8", periodNum: 8, dueDate: "2027-01-21", amount: 5133000, status: "unpaid" },
          { installmentId: "inst-2-9", periodNum: 9, dueDate: "2027-02-21", amount: 5133000, status: "unpaid" },
          { installmentId: "inst-2-10", periodNum: 10, dueDate: "2027-03-21", amount: 5133000, status: "unpaid" },
          { installmentId: "inst-2-11", periodNum: 11, dueDate: "2027-04-21", amount: 5133000, status: "unpaid" },
          { installmentId: "inst-2-12", periodNum: 12, dueDate: "2027-05-21", amount: 5133000, status: "unpaid" }
        ],
        history: [
          { timestamp: "2026-05-21 11:20", action: "Nộp hồ sơ thuê thiết bị", actor: "Khách hàng", notes: "Macbook làm thiết kế đồ họa, đóng trước 30% giá máy." }
        ]
      },
      {
        id: "l-mock-3",
        customerName: "Lê Minh Tuấn",
        identityCard: "112233445566",
        phone: "0321456789",
        email: "tuan.lm@gmail.com",
        deviceModel: "Samsung Galaxy S24 Ultra 512GB",
        deviceType: "phone",
        devicePrice: 31990000,
        upfrontFee: 3199000, // 10%
        monthlyFee: 5065000,
        durationMonths: 6,
        dateCreated: new Date(Date.now() - 75 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: "late",
        installments: [
          { installmentId: "inst-3-1", periodNum: 1, dueDate: "2026-04-15", amount: 5065000, status: "paid", datePaid: "2026-04-14", paymentMethod: "Ví VComm" },
          { installmentId: "inst-3-2", periodNum: 2, dueDate: "2026-05-15", amount: 5065000, status: "overdue" },
          { installmentId: "inst-3-3", periodNum: 3, dueDate: "2026-06-15", amount: 5065000, status: "unpaid" },
          { installmentId: "inst-3-4", periodNum: 4, dueDate: "2026-07-15", amount: 5065000, status: "unpaid" },
          { installmentId: "inst-3-5", periodNum: 5, dueDate: "2026-08-15", amount: 5065000, status: "unpaid" },
          { installmentId: "inst-3-6", periodNum: 6, dueDate: "2026-09-15", amount: 5065000, status: "unpaid" }
        ],
        history: [
          { timestamp: "2026-03-15 10:00", action: "Tạo hồ sơ", actor: "Telesales", notes: "Yêu cầu trả góp gói 6 tháng máy Samsung nguyên seal" },
          { timestamp: "2026-03-15 14:00", action: "Duyệt hồ sơ & Bàn giao", actor: "Admin", notes: "Thuê bao thiết bị kèm đặt cọc 10%. Gửi máy trực tiếp." },
          { timestamp: "2026-05-16 10:00", action: "Đánh dấu quá hạn thanh toán kỳ 2", actor: "Hệ thống tự động", notes: "Cảnh báo quá hạn 1 ngày. Khách treo máy chưa liên lạc được." }
        ]
      }
    ];
  };

  // Upfront and Lease dynamic pricing logic
  const handleDeviceChange = (idx: number) => {
    setSelectedDeviceIndex(idx);
  };

  const getLeasePriceStats = () => {
    const dev = SAMPLE_DEVICES[selectedDeviceIndex];
    const upfront = Math.round(dev.price * (upfrontPercent / 100));
    const principalToAmortize = dev.price - upfront;
    // Leasing rate includes finance premium of 1% flat interest rate per month 
    const interestTotal = principalToAmortize * (0.012 * durationMonths);
    const monthlyTotal = Math.round((principalToAmortize + interestTotal) / durationMonths);
    return {
      upfront,
      monthly: monthlyTotal,
      totalPaid: upfront + (monthlyTotal * durationMonths),
      interestPercent: durationMonths * 1.2
    };
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !email || !identityCard) {
      alert("Vui lòng nhập đầy đủ thông tin khách hàng!");
      return;
    }

    const dev = SAMPLE_DEVICES[selectedDeviceIndex];
    const stats = getLeasePriceStats();

    // Build installment list
    const insts: InstallmentSchedule[] = [];
    const now = new Date();
    for (let i = 1; i <= durationMonths; i++) {
      const dueDate = new Date(now.getFullYear(), now.getMonth() + i, now.getDate());
      insts.push({
        installmentId: `inst-new-${Date.now()}-${i}`,
        periodNum: i,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: stats.monthly,
        status: 'unpaid'
      });
    }

    const newLease: Omit<LeaseApplication, 'id'> = {
      customerName,
      phone,
      email,
      identityCard,
      deviceModel: dev.name,
      deviceType: dev.type as any,
      devicePrice: dev.price,
      upfrontFee: stats.upfront,
      monthlyFee: stats.monthly,
      durationMonths,
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'pending',
      installments: insts,
      history: [
        {
          timestamp: new Date().toLocaleString('vi-VN'),
          action: "Tạo đơn xin thuê trả góp",
          actor: "Admin (VComm Operator)",
          notes: `Đăng ký gói thiết bị ${dev.name} thời gian ${durationMonths} tháng, cọc trước ${upfrontPercent}%.`
        }
      ]
    };

    try {
      await addDoc(collection(db, 'device_leases'), newLease);
      setShowApplyModal(false);
      // Reset form
      setCustomerName('');
      setPhone('');
      setEmail('');
      setIdentityCard('');
    } catch(err) {
      console.error(err);
      // fallback local update manually
      const manualId = `l-manual-${Date.now()}`;
      setApplications(prev => [{ id: manualId, ...newLease } as LeaseApplication, ...prev]);
      setShowApplyModal(false);
    }
  };

  // Change action state helper
  const handleUpdateStatus = async (leaseId: string, nextStatus: 'approved' | 'active' | 'cancelled' | 'completed') => {
    const target = applications.find(a => a.id === leaseId);
    if (!target) return;

    let updatedHistory = [...target.history];
    let installmentUpdate = [...target.installments];

    if (nextStatus === 'approved') {
      updatedHistory.push({
        timestamp: new Date().toLocaleString('vi-VN'),
        action: "Duyệt hồ sơ cho thuê",
        actor: "VComm Risk Manager",
        notes: "Xác minh thông tin tài sản đạt định mức rủi ro tối thiểu. Sẵn sàng bàn giao phần cứng."
      });
    } else if (nextStatus === 'active') {
      updatedHistory.push({
        timestamp: new Date().toLocaleString('vi-VN'),
        action: "Đã giao thiết bị & Kích hoạt hợp đồng",
        actor: "Nhân viên Bàn giao",
        notes: "Ký biên bản giao nhận thiết bị thật, kích hoạt thiết bị chạy mượn thử và khóa Knox bảo vệ từ xa."
      });
    } else if (nextStatus === 'completed') {
      updatedHistory.push({
        timestamp: new Date().toLocaleString('vi-VN'),
        action: "Thanh toán đầy đủ & Kết thúc hợp đồng",
        actor: "Hệ thống Tài chính",
        notes: "Thu hồi toàn bộ tiền, bàn giao quyền sở hữu máy vĩnh viễn cho khách thuê."
      });
      // Set all installments to paid
      installmentUpdate = installmentUpdate.map(i => ({...i, status: 'paid' as const}));
    } else if (nextStatus === 'cancelled') {
      updatedHistory.push({
        timestamp: new Date().toLocaleString('vi-VN'),
        action: "Huỷ hợp đồng/ Từ chối duyệt",
        actor: "VComm Admin",
        notes: "Dừng hồ sơ do không đạt đàm phán hoặc khách hủy nhu cầu."
      });
    }

    try {
      const leaseRef = doc(db, 'device_leases', leaseId);
      await updateDoc(leaseRef, {
        status: nextStatus,
        history: updatedHistory,
        installments: installmentUpdate
      });
    } catch(err) {
      // Local fallback modification
      setApplications(prev => prev.map(a => {
        if (a.id === leaseId) {
          return { ...a, status: nextStatus, history: updatedHistory, installments: installmentUpdate };
        }
        return a;
      }));
    }
  };

  // Log detailed collection of month installment
  const handleCollectInstallment = async (leaseId: string, installmentId: string) => {
    const target = applications.find(a => a.id === leaseId);
    if (!target) return;

    const matchedInst = target.installments.find(i => i.installmentId === installmentId);
    if (!matchedInst) return;

    const updatedInsts = target.installments.map(i => {
      if (i.installmentId === installmentId) {
        return {
          ...i,
          status: 'paid' as const,
          datePaid: new Date().toISOString().split('T')[0],
          paymentMethod: "Chuyển khoản / Tiền mặt"
        };
      }
      return i;
    });

    // Check if all are paid
    const allPaid = updatedInsts.every(i => i.status === 'paid');
    const nextStatus = allPaid ? 'completed' : target.status;

    const updatedHistory = [...target.history, {
      timestamp: new Date().toLocaleString('vi-VN'),
      action: `Thu tiền thuê định kỳ (Kỳ ${matchedInst.periodNum}/${target.durationMonths})`,
      actor: "Thu Ngân VComm",
      notes: `Đã thu số tiền ${formatCurrency(matchedInst.amount)} thành công thông qua hạch toán POS.`
    }];

    try {
      const leaseRef = doc(db, 'device_leases', leaseId);
      await updateDoc(leaseRef, {
        installments: updatedInsts,
        status: nextStatus,
        history: updatedHistory
      });
    } catch(err) {
      setApplications(prev => prev.map(a => {
        if (a.id === leaseId) {
          return {  ...a, installments: updatedInsts, status: nextStatus, history: updatedHistory };
        }
        return a;
      }));
    }
  };

  // Open notify window
  const openNotificationModal = (lease: LeaseApplication, installment: InstallmentSchedule) => {
    setNotifTarget(lease);
    setNotifInstallment(installment);
    
    // Auto populate template message based on current status and date
    const brandName = "VComm Superstore";
    const appBaseMsg = `[Kính gửi] khách hàng ${lease.customerName}, VComm xin thông báo hoá đơn thuê kỳ ${installment.periodNum}/${lease.durationMonths} thiết bị ${lease.deviceModel} trị giá ${formatCurrency(installment.amount)} sẽ hết hạn vào ngày ${installment.dueDate}. Vui lòng chuyển khoản QR đính kèm hoặc ghé siêu thị VComm để đóng đúng hạn tránh trễ hạn khóa máy Knox từ xa. SĐT hỗ trợ: 1900 1215. Trân trọng!`;
    
    setNotifContent(appBaseMsg);
    setNotifSuccessText('');
    setSendingNotif(false);
    setShowNotificationModal(true);
  };

  const handleSendNotification = () => {
    if (!notifTarget || !notifInstallment) return;
    setSendingNotif(true);

    // Simulate calling third-party billing gateway
    setTimeout(async () => {
      setSendingNotif(false);
      setNotifSuccessText(`Mô phỏng: Cảnh báo qua ${notifChannel.toUpperCase()} đã gửi thành công tới số điện thoại ${notifTarget.phone}. Khách hàng đã nhận báo nợ tự động!`);
      
      // Append communication log to lease contract history
      const updatedHistory = [...notifTarget.history, {
        timestamp: new Date().toLocaleString('vi-VN'),
        action: `Gửi Cảnh báo thanh toán (${notifChannel.toUpperCase()})`,
        actor: "Hệ thống Tự động",
        notes: `Nội dung: ${notifContent.slice(0, 100)}...`
      }];

      try {
        const leaseRef = doc(db, 'device_leases', notifTarget.id);
        await updateDoc(leaseRef, {
          history: updatedHistory
        });
      } catch (err) {
        setApplications(prev => prev.map(a => {
          if (a.id === notifTarget.id) {
            return { ...a, history: updatedHistory };
          }
          return a;
        }));
      }
    }, 1500);
  };

  // Filter and search
  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.includes(searchQuery) ||
      app.id.includes(searchQuery) ||
      app.deviceModel.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && app.status === statusFilter;
  });

  const activeLeases = filteredApps.filter(a => ['active', 'late'].includes(a.status));
  const pendingApps = filteredApps.filter(a => a.status === 'pending');

  const stats = {
    totalApplications: applications.length,
    activeLeaseNum: applications.filter(a => a.status === 'active').length,
    pendingApprovalNum: applications.filter(a => a.status === 'pending').length,
    overdueNum: applications.filter(a => a.status === 'late').length,
    totalExpectedRevenue: applications.reduce((acc, current) => {
      // upfront + sum of installments
      const totalInsts = current.installments.reduce((sum, item) => sum + item.amount, 0);
      return acc + current.upfrontFee + totalInsts;
    }, 0),
    collectedPremium: applications.reduce((acc, current) => {
      const upfront = current.upfrontFee;
      const paidInsts = current.installments
        .filter(i => i.status === 'paid')
        .reduce((sum, item) => sum + item.amount, 0);
      return acc + upfront + paidInsts;
    }, 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-1 rounded-md border border-amber-300">Chờ duyệt</span>;
      case 'approved':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-semibold px-2 py-1 rounded-md border border-blue-200">Đã duyệt (Chờ bàn giao)</span>;
      case 'active':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-1 rounded-md border border-emerald-200 flex items-center gap-1"><span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>Đang thuê</span>;
      case 'late':
        return <span className="bg-rose-100 text-rose-850 text-[11px] font-semibold px-2 py-1 rounded-md border border-rose-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-600 animate-bounce" /> Trễ hạn</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-1 rounded-md border border-slate-350">Hoàn tất trả góp</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 text-[11px] font-semibold px-2 py-1 rounded-md">Đã huỷ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner & header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full">PRO-SaaS FINTECH</span>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Mượn Danh Cho Thuê
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-100">Trả Góp & Cho Thuê Thiết Bị</h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl mt-1.5">
            Module quản lý phê duyệt đơn mua trả góp iPhone, Samsung, iPad, Macbook... sử dụng hình thức pháp chế "Cho thuê tài sản thiết bị" bảo hộ rủi ro của VComm Toàn Cầu.
          </p>
        </div>
        <button 
          onClick={() => setShowApplyModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-bold px-5 py-3 rounded-xl transition duration-200 cursor-pointer flex items-center gap-2 shadow-sm shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Tạo Hồ Sơ Trả Góp/Thuê
        </button>
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Hợp đồng hoạt động</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{stats.activeLeaseNum} / {stats.totalApplications}</h3>
              <p className="text-[11px] text-slate-500 mt-2">Tổng số hồ sơ trả góp đang bàn giao máy</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Doanh thu dự kiến</span>
              <h3 className="text-2xl font-black text-indigo-700 mt-2">{formatCurrency(stats.totalExpectedRevenue)}</h3>
              <p className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
                Đã thu: {formatCurrency(stats.collectedPremium)}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Đơn Chờ phê duyệt</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{stats.pendingApprovalNum}</h3>
              <p className="text-[11px] text-amber-600 mt-2 font-semibold">Khách hàng đang nộp đặt cọc online</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Nợ xấu / Trễ hạn thanh toán</span>
              <h3 className="text-2xl font-black text-rose-600 mt-2">{stats.overdueNum} KH</h3>
              <p className="text-[11px] text-rose-500 mt-2">Thiết bị sẽ tự khoá từ xa Knox nếu không đóng</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns - Lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header controls */}
            <div className="p-5 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab('applications')}
                  className={cn(
                    "pb-3 text-sm font-bold border-b-2 text-slate-700 transition-all cursor-pointer relative",
                    activeTab === 'applications' ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  Hồ Sơ Yêu Cầu Thuê/Trả Góp
                  {stats.pendingApprovalNum > 0 && (
                    <span className="ml-1.5 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full align-middle">
                      {stats.pendingApprovalNum}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('active-leases')}
                  className={cn(
                    "pb-3 text-sm font-bold border-b-2 text-slate-700 transition-all cursor-pointer relative",
                    activeTab === 'active-leases' ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  Danh Sách Đang Thuê (Trả Góp)
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm khách hàng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 w-full sm:w-60 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
            </div>

            {/* List and tables content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-500">
                    <th className="p-4 w-15">Mã số</th>
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Sản Phẩm</th>
                    <th className="p-4">Giá bán / Cọc</th>
                    <th className="p-4">Tiền Thuê Tháng</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-400">
                        <div className="flex justify-center items-center gap-2">
                          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                          <span>Đang truy vấn hợp đồng từ hệ thống...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    (activeTab === 'applications' ? pendingApps : activeLeases).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-400 italic">
                          Không tìm thấy hợp đồng phù hợp nào trong bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      (activeTab === 'applications' ? pendingApps : activeLeases).map((app) => (
                        <tr 
                          key={app.id} 
                          onClick={() => setSelectedLease(app)}
                          className={cn(
                            "hover:bg-slate-50/75 cursor-pointer transition-colors",
                            selectedLease?.id === app.id ? "bg-indigo-50/30" : ""
                          )}
                        >
                          <td className="p-4 font-mono font-bold text-slate-500 whitespace-nowrap">
                            {app.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="p-4">
                            <p className="font-extrabold text-slate-900 leading-snug">{app.customerName}</p>
                            <p className="text-[10px] text-slate-400">{app.phone} • {app.email}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              {app.deviceType === 'phone' ? <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                              <span className="font-bold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={app.deviceModel}>
                                {app.deviceModel}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Ngày tạo: {app.dateCreated}</span>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-slate-800">{formatCurrency(app.devicePrice)}</p>
                            <span className="text-[10px] text-emerald-600 font-bold">Cọc: {formatCurrency(app.upfrontFee)}</span>
                          </td>
                          <td className="p-4">
                            <p className="font-black text-slate-900">{formatCurrency(app.monthlyFee)}</p>
                            <span className="text-[10.5px] text-indigo-500 font-bold">{app.durationMonths} kỳ (tháng)</span>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {getStatusBadge(app.status)}
                          </td>
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              {app.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleUpdateStatus(app.id, 'approved')}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg  active:scale-95 transition-all"
                                    title="Phê duyệt hồ sơ"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg  active:scale-95 transition-all"
                                    title="Từ chố/Huỷ hồ sơ"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {app.status === 'approved' && (
                                <button 
                                  onClick={() => handleUpdateStatus(app.id, 'active')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg  active:scale-95 transition-all"
                                >
                                  Khởi tạo & Giao máy
                                </button>
                              )}
                              {['active', 'late'].includes(app.status) && (
                                <button 
                                  onClick={() => setSelectedLease(app)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-bold rounded-lg border border-slate-300"
                                >
                                  Quản lý thu tiền
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column - Detailed active lease / installments */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            {selectedLease ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between border-b border-slate-150 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Hồ sơ chi tiết</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedLease.id.toUpperCase()}</p>
                  </div>
                  <div>
                    {getStatusBadge(selectedLease.status)}
                  </div>
                </div>

                {/* Customer summary */}
                <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h5 className="font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-4 h-4 text-indigo-500" /> Thông tin người thuê
                  </h5>
                  <div className="grid grid-cols-2 gap-y-1.5 mt-2 text-slate-600">
                    <div>Tên KH:</div>
                    <div className="font-extrabold text-slate-900 text-right">{selectedLease.customerName}</div>
                    <div>Số CCCD:</div>
                    <div className="font-semibold text-right">{selectedLease.identityCard}</div>
                    <div>Liên hệ:</div>
                    <div className="font-semibold text-right">{selectedLease.phone}</div>
                    <div>E-mail:</div>
                    <div className="font-semibold text-right overflow-hidden text-ellipsis max-w-28 text-slate-500" title={selectedLease.email}>
                      {selectedLease.email}
                    </div>
                  </div>
                </div>

                {/* Device Lease info */}
                <div className="space-y-2 text-xs">
                  <h5 className="font-extrabold text-slate-800">Thông số thanh toán</h5>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Thiết bị bàn giao:</span>
                      <span className="font-extrabold text-slate-900">{selectedLease.deviceModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Giá niêm yết:</span>
                      <span className="font-semibold">{formatCurrency(selectedLease.devicePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tiền cọc đầu:</span>
                      <span className="text-emerald-600 font-extrabold">{formatCurrency(selectedLease.upfrontFee)}</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-slate-150 pt-1.5">
                      <span className="font-bold text-slate-700">Giá thuê (đóng góp) định kỳ:</span>
                      <span className="font-black text-slate-950 text-sm">{formatCurrency(selectedLease.monthlyFee)} / tháng</span>
                    </div>
                  </div>
                </div>

                {/* Installments payment schedule */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-indigo-50/50 px-2 py-1.5 rounded-lg border border-indigo-100">
                    <span className="text-[11px] font-bold text-indigo-800">Lịch thanh toán định kỳ</span>
                    <span className="text-[10px] text-slate-500 font-semibold italic">Đóng trước hàng tháng</span>
                  </div>
                  
                  <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                    {selectedLease.installments.map((inst) => {
                      const isUnpaid = inst.status === 'unpaid';
                      const isPaid = inst.status === 'paid';
                      const isLate = inst.status === 'overdue';
                      return (
                        <div 
                          key={inst.installmentId}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg border text-[11px] transition-all",
                            isPaid ? "bg-slate-50 border-slate-200 text-slate-400" :
                            isLate ? "bg-rose-50 border-rose-300 text-rose-800" :
                            "bg-white border-slate-200 text-slate-800 hover:border-slate-350"
                          )}
                        >
                          <div>
                            <p className="font-extrabold">Kỳ {inst.periodNum}/{selectedLease.durationMonths}</p>
                            <p className="text-[9.5px] text-slate-400 font-semibold">Hạn đóng: {inst.dueDate}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{formatCurrency(inst.amount)}</span>
                            
                            {isPaid ? (
                              <span className="text-[10px] text-emerald-650 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-250 font-bold">✓ Đã đóng</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                {isLate && (
                                  <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-250 font-extrabold flex items-center gap-0.5">
                                    Quá hạn
                                  </span>
                                )}
                                {/* Push warning */}
                                <button
                                  onClick={() => openNotificationModal(selectedLease, inst)}
                                  className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-700/80 rounded border border-amber-250 cursor-pointer"
                                  title="Gửi SMS & Zalo cảnh báo nợ"
                                >
                                  <Bell className="w-3 h-3" />
                                </button>
                                {/* Record cash collect */}
                                <button
                                  onClick={() => handleCollectInstallment(selectedLease.id, inst.installmentId)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded border border-emerald-650 cursor-pointer text-[9.5px] font-black"
                                  title="Xác nhận đóng tiền mặt / thẻ"
                                >
                                  Đóng
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* History logs */}
                <div className="space-y-2 border-t border-slate-200 pt-3">
                  <h5 className="font-bold text-xs text-slate-700 flex items-center gap-1">
                    <History className="w-3.5 h-3.5" /> Lịch sử hành trình hồ sơ
                  </h5>
                  <div className="space-y-2 font-mono text-[10px] max-h-[120px] overflow-y-auto custom-scrollbar">
                    {selectedLease.history.map((h, hidx) => (
                      <div key={hidx} className="border-l-2 border-indigo-150 pl-2 ml-1 space-y-0.5">
                        <div className="flex justify-between font-bold text-slate-600">
                          <span>{h.action}</span>
                          <span className="text-slate-400">{h.timestamp.split(' ')[0]}</span>
                        </div>
                        <p className="text-slate-400 font-semibold">{h.actor}</p>
                        <p className="text-slate-500">{h.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 space-y-2">
                <Info className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold">Chọn một hồ sơ từ danh sách bên trái để quản lý chi tiết kỳ hạn thanh toán, lịch sử hạch toán đóng tiền, và đẩy cảnh báo nhắc nợ.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Create new Device Leasing Contract */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-xl overflow-hidden"
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-black text-lg">Mở Đơn Xin Thuê/Trả Góp</h3>
                <p className="text-[11.5px] text-slate-400">Chọn dòng máy, cấu hình hợp đồng thuê góp theo tháng.</p>
              </div>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="p-6 space-y-4 text-xs font-sans">
              {/* Product selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Chọn thiết bị cung cấp:</label>
                <select 
                  value={selectedDeviceIndex}
                  onChange={(e) => handleDeviceChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500/20"
                >
                  {SAMPLE_DEVICES.map((dev, idx) => (
                    <option key={idx} value={idx}>
                      {dev.name} ({formatCurrency(dev.price)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lease settings configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Kỳ hạn thuê góp:</label>
                  <select 
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value={6}>6 tháng</option>
                    <option value={12}>12 tháng (Hỗ trợ lãi suất)</option>
                    <option value={18}>18 tháng</option>
                    <option value={24}>24 tháng (Tối đa)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Tỷ lệ cọc trước (%):</label>
                  <select 
                    value={upfrontPercent}
                    onChange={(e) => setUpfrontPercent(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value={10}>10% giá máy</option>
                    <option value={20}>20% (Khuyến nghị)</option>
                    <option value={30}>30%</option>
                    <option value={50}>50% (Duyệt nhanh)</option>
                  </select>
                </div>
              </div>

              {/* Financial Calculation review */}
              <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-2 font-medium">
                <div className="flex justify-between">
                  <span>Số tiền cọc (upfront):</span>
                  <span className="font-extrabold text-slate-900">{formatCurrency(getLeasePriceStats().upfront)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Khấu hao + Phí dịch vụ góp tháng:</span>
                  <span className="font-black text-indigo-700 text-sm">
                    {formatCurrency(getLeasePriceStats().monthly)} / tháng
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 border-t border-indigo-100/50 pt-2">
                  <span>Tổng tiền góp gốc & lãi:</span>
                  <span>{formatCurrency(getLeasePriceStats().totalPaid)}</span>
                </div>
              </div>

              {/* Customer documentation */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h5 className="font-extrabold text-slate-800">Thông Tin Hồ Sơ Khách Hàng (Dùng KYC)</h5>
                
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 block">Họ và tên khách hàng:</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">Số CCCD / Hộ chiếu:</label>
                    <input 
                      type="text" 
                      required
                      placeholder="030099..."
                      value={identityCard}
                      onChange={(e) => setIdentityCard(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">Số điện thoại liên hệ:</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="09..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 block">Địa chỉ Email:</label>
                  <input 
                    type="email" 
                    required
                    placeholder="khachhang@vcomm.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex gap-3 justify-end border-t border-slate-150">
                <button 
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-250 text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Đóng
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-sm shadow-indigo-600/10 transition-colors"
                >
                  Nộp Hợp Đồng Lên Hệ Thống
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: Simulated SMS & Zalo Automated Notification center */}
      {showNotificationModal && notifTarget && notifInstallment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-sm w-full max-w-md overflow-hidden text-xs font-sans"
          >
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                  <Bell className="w-4 h-4 animate-swing" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-200">Cổng Cảnh Báo Thu Nợ Định Kỳ</h3>
                  <p className="text-[10px] text-slate-400">Gửi nhắc nhở đa kênh (SMS, Zalo, Email) tự động</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Channel Selector */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">Cấu hình kênh truyền thông:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setNotifChannel('zalo');
                      setNotifContent(`[VCOMM ZALO OA] Kính gửi ${notifTarget.customerName}, kỳ thanh toán thứ ${notifInstallment.periodNum}/${notifTarget.durationMonths} cho thiết bị ${notifTarget.deviceModel} (Số hợp đồng: HD-${notifTarget.id.toUpperCase().slice(0,6)}) trị giá ${formatCurrency(notifInstallment.amount)} có hạn đóng là ${notifInstallment.dueDate}. Quý khách vui lòng thanh toán để tránh cơ chế bảo mật Knox khoá màn hình tạm thời.`);
                    }}
                    className={cn(
                      "py-2 px-3 rounded-lg border font-bold text-center transition-all cursor-pointer",
                      notifChannel === 'zalo' ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-850"
                    )}
                  >
                    Zalo ZNS
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setNotifChannel('sms');
                      setNotifContent(`[VCOMM CORP] TB: Khach hang ${notifTarget.customerName} can thanh toan hop dong ${notifTarget.id.toUpperCase().slice(0,6)} (Ky ${notifInstallment.periodNum}/${notifTarget.durationMonths}), phai dong ${formatCurrency(notifInstallment.amount)} truoc ngay ${notifInstallment.dueDate}. Neu qua han dien thoai se bi tu dong khoa qua Knox.`);
                    }}
                    className={cn(
                      "py-2 px-3 rounded-lg border font-bold text-center transition-all cursor-pointer",
                      notifChannel === 'sms' ? "bg-amber-600/20 border-amber-500 text-amber-400" : "bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-850"
                    )}
                  >
                    SMS Brandname
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setNotifChannel('email');
                      setNotifContent(`Kính gửi Ông/Bà ${notifTarget.customerName},\n\nChúng tôi gửi thông báo công nợ kỳ thanh toán góp thứ ${notifInstallment.periodNum}/${notifTarget.durationMonths} của thiết bị ${notifTarget.deviceModel}.\n- Hạn thanh toán: ${notifInstallment.dueDate}\n- Số tiền định kỳ: ${formatCurrency(notifInstallment.amount)}\n\nVui lòng truy cập cổng tài chính hoặc chuyển khoản quét mã VietQR kèm theo email này để hoàn tất thanh toán định kỳ.\n\nTrân trọng,\nVcomm Financial Team`);
                    }}
                    className={cn(
                      "py-2 px-3 rounded-lg border font-bold text-center transition-all cursor-pointer",
                      notifChannel === 'email' ? "bg-purple-600/20 border-purple-500 text-purple-400" : "bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-850"
                    )}
                  >
                    E-mail Invoice
                  </button>
                </div>
              </div>

              {/* Message edit block */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">Biên tập nội dung tin gửi:</span>
                <textarea 
                  value={notifContent}
                  onChange={(e) => setNotifContent(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500/20 text-[11px] focus:outline-none"
                />
              </div>

              {/* Display response status */}
              {sendingNotif && (
                <div className="flex justify-center items-center gap-2 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></span>
                  <span>Đang kết nối API Gateway và điều độ tin gửi...</span>
                </div>
              )}

              {notifSuccessText && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-900 rounded-xl text-emerald-400 flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span className="font-medium">{notifSuccessText}</span>
                </div>
              )}

              {/* Dispatch Action */}
              <div className="pt-2 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 font-bold rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="button"
                  disabled={sendingNotif}
                  onClick={handleSendNotification}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-950/50"
                >
                  <MessageSquare className="w-4 h-4" /> Bắn cảnh báo ngay
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
