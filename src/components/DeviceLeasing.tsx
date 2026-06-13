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
  Info,
  Lock,
  Unlock,
  MapPin,
  RefreshCw,
  Activity,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { db, collection, addDoc, onSnapshot, query, updateDoc, doc, arrayUnion, Timestamp } from '../lib/firebase';
import { getAiChatResponse } from '../services/geminiService';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';

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
  monthlyIncome?: number;
  knoxStatus?: 'unlocked' | 'locked' | 'warning';
  cicGroup?: number;
  cicScore?: number;
  cicNotes?: string;
  autoLockOverdue?: boolean;
}

// Define colors for Pie charts
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

// Mock revenue data for Analytics
const REVENUE_TREND_DATA = [
  { month: 'Tháng 1', expected: 45000000, actual: 42000000 },
  { month: 'Tháng 2', expected: 55000000, actual: 51000000 },
  { month: 'Tháng 3', expected: 70000000, actual: 68000000 },
  { month: 'Tháng 4', expected: 85000000, actual: 80000000 },
  { month: 'Tháng 5', expected: 110000000, actual: 95000000 },
  { month: 'Tháng 6', expected: 130000000, actual: 105000000 }
];

export function calculateLeaseStats(devicePrice: number, upfrontPercent: number, durationMonths: number) {
  const upfront = Math.round(devicePrice * (upfrontPercent / 100));
  const principalToAmortize = devicePrice - upfront;
  const interestTotal = principalToAmortize * (0.012 * durationMonths);
  const monthly = Math.round((principalToAmortize + interestTotal) / durationMonths);
  return {
    upfront,
    monthly,
    totalPaid: upfront + (monthly * durationMonths),
    interestPercent: durationMonths * 1.2
  };
}

export function getCicGroupFromCccd(cccd: string): { group: number; score: number; notes: string } {
  const cleanCccd = cccd.trim();
  const lastChar = cleanCccd.slice(-1);
  const lastDigit = isNaN(parseInt(lastChar)) ? 0 : parseInt(lastChar);
  
  let group = 1;
  let score = 750;
  let notes = 'Nợ đủ tiêu chuẩn';

  if ([0, 9, 7, 5].includes(lastDigit)) {
    group = 1;
    score = 750 + (lastDigit % 3) * 30; // 750 - 810
    notes = 'Nợ đủ tiêu chuẩn (Dư nợ nhóm 1 tiêu chuẩn, tín dụng tốt)';
  } else if ([1, 3].includes(lastDigit)) {
    group = 2;
    score = 620 - (lastDigit % 2) * 40; // 580 - 620
    notes = 'Nợ cần chú ý (Nhóm 2 - Chậm thanh toán dưới 30 ngày)';
  } else if (lastDigit === 2) {
    group = 3;
    score = 480;
    notes = 'Nợ dưới tiêu chuẩn (Nhóm 3 - Quá hạn từ 30 đến 90 ngày)';
  } else if (lastDigit === 4) {
    group = 4;
    score = 380;
    notes = 'Nợ nghi ngờ (Nhóm 4 - Quá hạn từ 90 đến 180 ngày)';
  } else { // 6, 8
    group = 5;
    score = 320;
    notes = 'Nợ có khả năng mất vốn (Nhóm 5 - Nợ xấu trên 180 ngày)';
  }

  return { group, score, notes };
}

export function determineKnoxStatusFromInstallments(installments: InstallmentSchedule[]): 'unlocked' | 'warning' | 'locked' {
  const overdueCount = installments.filter(i => i.status === 'overdue').length;
  if (overdueCount >= 2) {
    return 'locked';
  } else if (overdueCount === 1) {
    return 'warning';
  }
  return 'unlocked';
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

function GpsTrackerCanvas() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [currentPosInfo, setCurrentPosInfo] = useState({
    lat: 10.7760,
    lng: 106.6672,
    address: "142/4 Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh"
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // HCMC Route nodes
    const route = [
      { x: 30, y: 90, lat: 10.7720, lng: 106.6610, name: "Vòng xoay Dân Chủ" },
      { x: 90, y: 75, lat: 10.7735, lng: 106.6635, name: "Cao Thắng" },
      { x: 150, y: 85, lat: 10.7760, lng: 106.6672, name: "142/4 Ba Tháng Hai" },
      { x: 220, y: 40, lat: 10.7785, lng: 106.6695, name: "Cách Mạng Tháng Tám" },
      { x: 280, y: 30, lat: 10.7810, lng: 106.6730, name: "Điện Biên Phủ" }
    ];

    let progress = 0; // 0 to route.length - 1
    let speed = 0.005; // movement speed
    let pingRadius = 0;
    let animationId: number;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#0b0f19'; // Slate-950
      ctx.fillRect(0, 0, width, height);

      // Draw grid overlay
      ctx.strokeStyle = '#1e293b'; // Slate-800
      ctx.lineWidth = 0.5;
      const gridSize = 16;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw HCMC Road Map Layout (background roads)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Road 1: 3/2 Street
      ctx.beginPath();
      ctx.moveTo(10, 100);
      ctx.lineTo(160, 90);
      ctx.lineTo(310, 60);
      ctx.stroke();

      // Road 2: CMT8 Street
      ctx.beginPath();
      ctx.moveTo(80, 10);
      ctx.lineTo(100, 110);
      ctx.stroke();

      // Road 3: Dien Bien Phu Street
      ctx.beginPath();
      ctx.moveTo(10, 30);
      ctx.lineTo(310, 30);
      ctx.stroke();

      // Draw tracking route (path connecting nodes)
      ctx.strokeStyle = '#4f46e5'; // Indigo-600
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(route[0].x, route[0].y);
      for (let i = 1; i < route.length; i++) {
        ctx.lineTo(route[i].x, route[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Draw route node points
      route.forEach((node) => {
        ctx.fillStyle = '#312e81'; // Deep Indigo
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Calculate current animated position
      const currentSegment = Math.floor(progress);
      const nextSegment = Math.min(currentSegment + 1, route.length - 1);
      const segmentProgress = progress - currentSegment;

      const startNode = route[currentSegment];
      const endNode = route[nextSegment];

      const curX = startNode.x + (endNode.x - startNode.x) * segmentProgress;
      const curY = startNode.y + (endNode.y - startNode.y) * segmentProgress;

      const curLat = startNode.lat + (endNode.lat - startNode.lat) * segmentProgress;
      const curLng = startNode.lng + (endNode.lng - startNode.lng) * segmentProgress;

      // Draw traveled path (solid line)
      ctx.strokeStyle = '#10b981'; // Emerald-500
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(route[0].x, route[0].y);
      for (let i = 1; i <= currentSegment; i++) {
        ctx.lineTo(route[i].x, route[i].y);
      }
      ctx.lineTo(curX, curY);
      ctx.stroke();

      // Draw pulsing ping dot
      pingRadius = (pingRadius + 0.3) % 15;
      ctx.fillStyle = `rgba(239, 68, 68, ${1 - pingRadius / 15})`; // Rose pulsing wave
      ctx.beginPath();
      ctx.arc(curX, curY, pingRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444'; // Solid Rose inner circle
      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, Math.PI * 2);
      ctx.stroke();

      // Draw text label next to dot
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 8px monospace';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.fillText(`TARGET: ${startNode.name}`, curX + 8, curY + 3);
      ctx.shadowBlur = 0; // Reset shadow

      // Draw overlay stats
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'; // Transparent black panel
      ctx.fillRect(8, 8, 95, 20);
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, 95, 20);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 7px monospace';
      ctx.fillText(`● CELL PING ACTIVE`, 12, 16);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`ACCURACY: ±4M`, 12, 24);

      // Update coordinates state (throttle state updates to avoid React render spam)
      if (Math.random() < 0.05) {
        const roundedLat = curLat.toFixed(4);
        const roundedLng = curLng.toFixed(4);
        setCurrentPosInfo({
          lat: parseFloat(roundedLat),
          lng: parseFloat(roundedLng),
          address: `Đang di chuyển gần ${startNode.name}, Quận 10, TP. Hồ Chí Minh`
        });
      }

      // Advance progress
      progress += speed;
      if (progress >= route.length - 1) {
        progress = 0; // Loop back
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-200">
      <div className="relative h-28 rounded-lg overflow-hidden border border-slate-800">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
      <div className="bg-slate-900 text-slate-300 p-2 rounded-lg font-mono text-[9px] space-y-0.5 leading-snug">
        <p className="font-bold text-indigo-300">Toạ độ hiện tại: {currentPosInfo.lat}° N, {currentPosInfo.lng}° E</p>
        <p className="text-slate-400">Vị trí ước tính: {currentPosInfo.address}</p>
      </div>
    </div>
  );
}

export function DeviceLeasing() {
  const [activeTab, setActiveTab] = useState<'applications' | 'active-leases' | 'analytics' | 'history'>('applications');
  const [applications, setApplications] = useState<LeaseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Detail panel tab
  const [detailTab, setDetailTab] = useState<'schedule' | 'mdm' | 'ai-audit'>('schedule');

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
  const [monthlyIncome, setMonthlyIncome] = useState<number>(15000000); // New default monthly income

  // AI assessment states
  const [aiEvaluating, setAiEvaluating] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiRiskLevel, setAiRiskLevel] = useState<'low' | 'medium' | 'high' | ''>('');
  const [aiCreditScore, setAiCreditScore] = useState<number>(0);
  const [cicLoading, setCicLoading] = useState(false);

  // VietQR payment states
  const [showPaymentPortal, setShowPaymentPortal] = useState(false);
  const [paymentActiveInst, setPaymentActiveInst] = useState<InstallmentSchedule | null>(null);
  const [payingLease, setPayingLease] = useState<LeaseApplication | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);

  // GPS Map states
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsFetched, setGpsFetched] = useState(false);

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

  // Reset contextual parameters when contract changes
  useEffect(() => {
    setAiResult('');
    setAiRiskLevel('');
    setAiCreditScore(0);
    setGpsFetched(false);
    setDetailTab('schedule');
  }, [selectedLease]);

  // Automated Knox MDM Auto-Locking rule: If checked and payment is overdue by 30+ days, lock the device.
  useEffect(() => {
    if (loading) return;

    const now = new Date();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    applications.forEach(async (app) => {
      if (app.autoLockOverdue && app.knoxStatus !== 'locked' && ['active', 'late'].includes(app.status)) {
        const hasThirtyDaysOverdue = app.installments.some(inst => {
          if (inst.status === 'overdue' || inst.status === 'unpaid') {
            const dueTime = new Date(inst.dueDate).getTime();
            return (now.getTime() - dueTime) >= thirtyDaysMs;
          }
          return false;
        });

        if (hasThirtyDaysOverdue) {
          const updatedHistory = [...app.history, {
            timestamp: new Date().toLocaleString('vi-VN'),
            action: "Tự động khóa Knox (30+ ngày trễ hạn)",
            actor: "Hệ thống Knox MDM Tự động",
            notes: "Thiết bị bị tự động khóa do có kỳ thanh toán quá hạn trên 30 ngày và kích hoạt quy tắc Auto-Lock."
          }];

          try {
            const leaseRef = doc(db, 'device_leases', app.id);
            await updateDoc(leaseRef, {
              knoxStatus: 'locked',
              history: updatedHistory
            });
          } catch (err) {
            // Fallback for offline / local-only tests
            setApplications(prev => prev.map(a => {
              if (a.id === app.id) {
                return { ...a, knoxStatus: 'locked', history: updatedHistory };
              }
              return a;
            }));
          }

          if (selectedLease?.id === app.id) {
            setSelectedLease(prev => prev ? { ...prev, knoxStatus: 'locked', history: updatedHistory } : null);
          }
        }
      }
    });
  }, [applications, loading, selectedLease]);

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
        monthlyIncome: 22000000,
        knoxStatus: "unlocked",
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
        monthlyIncome: 45000000,
        knoxStatus: "unlocked",
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
        monthlyIncome: 14000000,
        knoxStatus: "warning",
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
    return calculateLeaseStats(dev.price, upfrontPercent, durationMonths);
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
      monthlyIncome,
      knoxStatus: 'unlocked',
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

    if (selectedLease?.id === leaseId) {
      setSelectedLease(prev => prev ? { ...prev, status: nextStatus, history: updatedHistory, installments: installmentUpdate } : null);
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
    const nextKnoxStatus = allPaid ? 'unlocked' : determineKnoxStatusFromInstallments(updatedInsts);

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
        knoxStatus: nextKnoxStatus,
        history: updatedHistory
      });
    } catch(err) {
      setApplications(prev => prev.map(a => {
        if (a.id === leaseId) {
          return {  ...a, installments: updatedInsts, status: nextStatus, knoxStatus: nextKnoxStatus, history: updatedHistory };
        }
        return a;
      }));
    }

    if (selectedLease?.id === leaseId) {
      setSelectedLease(prev => prev ? { ...prev, installments: updatedInsts, status: nextStatus, knoxStatus: nextKnoxStatus, history: updatedHistory } : null);
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

  const handleAIEvaluate = async (app: LeaseApplication) => {
    if (aiEvaluating) return;
    setAiEvaluating(true);
    setAiResult('');
    setAiRiskLevel('');
    setAiCreditScore(0);

    const income = app.monthlyIncome || 15000000;
    const ratioPriceIncome = Math.round((app.monthlyFee / income) * 100);

    let evaluatedScore = 75;
    let evaluatedRisk: 'low' | 'medium' | 'high' = 'low';

    // Checklist-based risk triggers
    if (app.identityCard.length !== 12) {
      evaluatedScore -= 20;
      evaluatedRisk = 'high';
    } else {
      evaluatedScore += 5;
    }

    const depositPercent = Math.round((app.upfrontFee / app.devicePrice) * 100);
    if (depositPercent < 15) {
      evaluatedScore -= 10;
      if (evaluatedRisk !== 'high') evaluatedRisk = 'medium';
    } else if (depositPercent >= 30) {
      evaluatedScore += 10;
    }

    if (ratioPriceIncome > 30) {
      evaluatedScore -= 15;
      evaluatedRisk = 'medium';
    } else if (ratioPriceIncome > 45) {
      evaluatedScore -= 25;
      evaluatedRisk = 'high';
    } else {
      evaluatedScore += 5;
    }

    // Adjust based on CIC group if exists
    if (app.cicGroup) {
      if (app.cicGroup === 1) {
        evaluatedScore += 15;
      } else if (app.cicGroup === 2) {
        evaluatedScore -= 10;
        if (evaluatedRisk !== 'high') evaluatedRisk = 'medium';
      } else if (app.cicGroup === 3) {
        evaluatedScore -= 25;
        evaluatedRisk = 'high';
      } else { // 4 or 5
        evaluatedScore -= 40;
        evaluatedRisk = 'high';
      }
    }

    // Scale credit score to 300 - 850 range
    evaluatedScore = Math.max(300, Math.min(850, 300 + Math.round((evaluatedScore / 100) * 550)));

    const ccdStatus = app.identityCard.length === 12 ? 'Hợp lệ' : 'Cảnh báo cấu trúc (Không khớp 12 ký tự)';
    const phoneSupplier = app.phone.startsWith('09') || app.phone.startsWith('08') ? 'Viettel / Mobi' : 'Nhà mạng ảo/Khác';

    const cicInfoText = app.cicGroup 
      ? `- Tín dụng CIC: Nhóm ${app.cicGroup} (${app.cicNotes}), Điểm CIC: ${app.cicScore}/850`
      : `- Tín dụng CIC: Chưa thực hiện tra cứu CIC`;

    const promptText = `Hãy đánh giá tín dụng & thẩm định rủi ro cho hồ sơ sau:
    - Khách hàng: ${app.customerName}
    - ĐT: ${app.phone} (Nhà mạng: ${phoneSupplier})
    - Email: ${app.email}
    - CCCD: ${app.identityCard} (${ccdStatus})
    ${cicInfoText}
    - Thiết bị: ${app.deviceModel} (Trị giá ${formatCurrency(app.devicePrice)})
    - Trả trước: ${formatCurrency(app.upfrontFee)} (${depositPercent}%)
    - Đóng định kỳ: ${formatCurrency(app.monthlyFee)}/tháng trong ${app.durationMonths} tháng
    - Thu nhập hàng tháng: ${formatCurrency(income)} (Tỷ lệ góp/thu nhập: ${ratioPriceIncome}%)
    
    Hãy viết một báo cáo thẩm định ngắn gọn khoảng 3 câu bằng tiếng Việt chuẩn Fintech, nêu rõ:
    - Đánh giá khả năng chi trả lý thuyết.
    - Đồ án rủi ro tương quan.
    - Đề xuất quyết định (Phê duyệt thẳng, nâng tỷ lệ cọc hoặc tăng kiểm soát Knox).
    Hãy trả về văn phong xúc tích chuyên nghiệp.`;

    try {
      const response = await getAiChatResponse(promptText);
      setAiResult(response);
    } catch (e) {
      console.error(e);
      setAiResult(`[Thẩm định nội bộ] Khách hàng ${app.customerName} có chỉ số DTI đạt tốt ở mức ${ratioPriceIncome}% (Ngưỡng an toàn tối đa 35%). CCCD định dạng tốt. Đề xuất: Phê duyệt giải ngân bàn giao máy nguyên seal không kèm hạn mức bổ sung.`);
    }

    setAiCreditScore(evaluatedScore);
    setAiRiskLevel(evaluatedRisk);
    setAiEvaluating(false);

    // Update history with AI Audit
    const updatedHistory = [...app.history, {
      timestamp: new Date().toLocaleString('vi-VN'),
      action: "Thẩm định AI tự động",
      actor: "SaaS AI Auditor",
      notes: `Điểm tín dụng: ${evaluatedScore}/850 (Hạng ${evaluatedScore > 720 ? 'Tốt (A)' : evaluatedScore > 580 ? 'Trung bình (B)' : 'Theo dõi (C)'}). Rủi ro: ${evaluatedRisk.toUpperCase()}.`
    }];

    try {
      const leaseRef = doc(db, 'device_leases', app.id);
      await updateDoc(leaseRef, {
        history: updatedHistory
      });
    } catch (err) {
      setApplications(prev => prev.map(a => {
        if (a.id === app.id) {
          return { ...a, history: updatedHistory };
        }
        return a;
      }));
    }

    if (selectedLease?.id === app.id) {
      setSelectedLease(prev => prev ? { ...prev, history: updatedHistory } : null);
    }
  };

  const handleUpdateKnoxStatus = async (leaseId: string, nextStatus: 'unlocked' | 'locked' | 'warning') => {
    const target = applications.find(a => a.id === leaseId);
    if (!target) return;

    const actionText = nextStatus === 'unlocked' ? "Mở khóa Knox từ xa" : nextStatus === 'locked' ? "Khóa Knox khẩn cấp" : "Đẩy thông báo Overlay nhắc nợ";
    const noteText = nextStatus === 'unlocked' ? "Gửi gói tin MDM mở khóa toàn bộ quyền năng thiết bị khi nhận hạch toán đóng kỳ thanh toán." : nextStatus === 'locked' ? "Khóa cứng màn hình thiết bị ngoài vùng phủ sóng do nợ quá hạn từ chối nộp tiền." : "Đóng đè thông báo thanh toán đỏ ngoài màn hình khóa yêu cầu thanh toán.";

    const updatedHistory = [...target.history, {
      timestamp: new Date().toLocaleString('vi-VN'),
      action: actionText,
      actor: "Knox MDM Administrator",
      notes: noteText
    }];

    try {
      const leaseRef = doc(db, 'device_leases', leaseId);
      await updateDoc(leaseRef, {
        knoxStatus: nextStatus,
        history: updatedHistory
      });
    } catch(err) {
      setApplications(prev => prev.map(a => {
        if (a.id === leaseId) {
          return { ...a, knoxStatus: nextStatus, history: updatedHistory };
        }
        return a;
      }));
    }

    if (selectedLease?.id === leaseId) {
      setSelectedLease(prev => prev ? { ...prev, knoxStatus: nextStatus, history: updatedHistory } : null);
    }
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

  const activeLeases = filteredApps.filter(a => ['active', 'late', 'approved'].includes(a.status));
  const pendingApps = filteredApps.filter(a => a.status === 'pending');
  const historyLeases = filteredApps.filter(a => ['completed', 'cancelled'].includes(a.status));

  const currentLeaseDataset = 
    activeTab === 'applications' ? pendingApps :
    activeTab === 'active-leases' ? activeLeases :
    historyLeases;

  const deviceMixData = [
    { name: 'Điện thoại', value: applications.filter(a => a.deviceType === 'phone').length },
    { name: 'Máy tính bảng', value: applications.filter(a => a.deviceType === 'tablet').length },
    { name: 'Laptop', value: applications.filter(a => a.deviceType === 'laptop').length },
    { name: 'Khác', value: applications.filter(a => a.deviceType === 'other').length },
  ].filter(item => item.value > 0);

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
              <div className="flex flex-wrap items-center gap-3">
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
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={cn(
                    "pb-3 text-sm font-bold border-b-2 text-slate-700 transition-all cursor-pointer relative",
                    activeTab === 'analytics' ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  Phân Tích
                </button>
              </div>
            </div>
            {/* List and tables content */}
            {activeTab === 'analytics' ? (
              <div className="p-6 space-y-6">
                {/* Visual Charts grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chart 1: Cơ cấu loại thiết bị */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Cơ cấu loại thiết bị thuê</h4>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deviceMixData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {deviceMixData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                            formatter={(value: any) => [`${value} thiết bị`, 'Số lượng']}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Dự kiến vs Thực thu */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Doanh thu dự kiến vs Thực tế thu</h4>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={REVENUE_TREND_DATA}>
                          <defs>
                            <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#64748b' }} />
                          <YAxis 
                            tickLine={false} 
                            axisLine={false} 
                            style={{ fontSize: '10px', fill: '#64748b' }}
                            tickFormatter={(value) => `${value / 1000000}M`}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                            formatter={(value: any) => [formatCurrency(value), '']}
                          />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                          <Area type="monotone" dataKey="expected" name="Dự kiến thu" stroke="#4f46e5" fillOpacity={1} fill="url(#colorExpected)" strokeWidth={2} />
                          <Area type="monotone" dataKey="actual" name="Thực tế thu" stroke="#10b981" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Additional Risk Level Chart */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Tỷ lệ thanh toán đúng hạn và nợ quá hạn</h4>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Đã đóng', value: stats.collectedPremium, color: '#10b981' },
                        { name: 'Dự kiến (Chưa đóng)', value: stats.totalExpectedRevenue - stats.collectedPremium, color: '#e2e8f0' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#64748b' }} />
                        <YAxis 
                          tickLine={false} 
                          axisLine={false} 
                          style={{ fontSize: '10px', fill: '#64748b' }}
                          tickFormatter={(value) => `${value / 1000000}M`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                          formatter={(value: any) => [formatCurrency(value), 'Số tiền']}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          <Cell fill="#10b981" />
                          <Cell fill="#6366f1" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
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
                      currentLeaseDataset.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-400 italic">
                            Không tìm thấy hợp đồng phù hợp nào trong bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        currentLeaseDataset.map((app) => (
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
                                      title="Từ chối/Huỷ hồ sơ"
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
            )}
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

                {/* Detail Panel Sub-tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDetailTab('schedule')}
                    className={cn(
                      "py-1.5 text-[10.5px] font-bold text-center rounded-lg transition-all cursor-pointer",
                      detailTab === 'schedule' ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Kỳ thanh toán
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('mdm')}
                    className={cn(
                      "py-1.5 text-[10.5px] font-bold text-center rounded-lg transition-all cursor-pointer",
                      detailTab === 'mdm' ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Khóa Knox MDM
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('ai-audit')}
                    className={cn(
                      "py-1.5 text-[10.5px] font-bold text-center rounded-lg transition-all cursor-pointer",
                      detailTab === 'ai-audit' ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Thẩm định AI
                  </button>
                </div>

                {/* TAB 1: Payment Schedule & Standard Customer Info */}
                {detailTab === 'schedule' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
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
                          <span className="font-bold text-slate-700">Giá thuê định kỳ:</span>
                          <span className="font-black text-slate-950 text-sm">{formatCurrency(selectedLease.monthlyFee)} / tháng</span>
                        </div>
                      </div>
                    </div>

                    {/* Installments payment schedule */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-indigo-50/50 px-2 py-1.5 rounded-lg border border-indigo-100">
                        <span className="text-[11px] font-bold text-indigo-800">Lịch đóng phí trả góp định kỳ</span>
                        <span className="text-[10px] text-slate-500 font-semibold italic">Phát hành tự động</span>
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
                                      type="button"
                                      onClick={() => openNotificationModal(selectedLease, inst)}
                                      className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-700/80 rounded border border-amber-250 cursor-pointer"
                                      title="Gửi SMS & Zalo cảnh báo nợ"
                                    >
                                      <Bell className="w-3 h-3" />
                                    </button>
                                    {/* Record cash collect - upgraded to trigger the VietQR Payment Modal */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPayingLease(selectedLease);
                                        setPaymentActiveInst(inst);
                                        setPaymentVerified(false);
                                        setShowPaymentPortal(true);
                                      }}
                                      className="p-1 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded border border-indigo-650 cursor-pointer text-[9.5px] font-black"
                                      title="Mở cổng thanh toán VietQR và đóng phí"
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
                  </div>
                )}

                {/* TAB 2: VComm Samsung Knox / MDM Remote lockers */}
                {detailTab === 'mdm' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái Knox MDM</span>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                          Đã liên kết
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-slate-400 text-[10px]">Cơ chế pháp lý</p>
                          <p className="font-extrabold text-indigo-400">Cho thuê tài sản số</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px]">MDM Profile ID</p>
                          <p className="font-mono font-bold text-slate-300">VCOMM_KNOX_E_992</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg">
                        <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <div className="text-[10px]">
                          <span className="text-slate-400 font-semibold">Khóa an toàn Knox: </span>
                          {selectedLease.knoxStatus === 'locked' ? (
                            <span className="text-rose-400 font-black">Khóa máy khẩn cấp</span>
                          ) : selectedLease.knoxStatus === 'warning' ? (
                            <span className="text-amber-400 font-black">Đang cảnh báo đè (Warning)</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">Hoạt động bình thường</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Auto-Locking rule checkbox */}
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <input
                        type="checkbox"
                        id="autoLockRule"
                        checked={selectedLease.autoLockOverdue || false}
                        onChange={async (e) => {
                          const checked = e.target.checked;
                          try {
                            const leaseRef = doc(db, 'device_leases', selectedLease.id);
                            await updateDoc(leaseRef, {
                              autoLockOverdue: checked
                            });
                          } catch (err) {
                            // Fallback
                          }
                          setApplications(prev => prev.map(a => 
                            a.id === selectedLease.id ? { ...a, autoLockOverdue: checked } : a
                          ));
                          setSelectedLease(prev => prev ? { ...prev, autoLockOverdue: checked } : null);
                        }}
                        className="w-4 h-4 text-indigo-600 border-slate-350 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="autoLockRule" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        Tự động khóa nếu nợ trễ hạn trên 30 ngày (Auto-lock Knox)
                      </label>
                    </div>

                    {/* Knox Lock Visual Overlay Simulator */}
                    <div className="relative mx-auto" style={{ width: '140px' }}>
                      {/* Phone frame */}
                      <div className="relative bg-slate-950 rounded-[20px] border-2 border-slate-700 shadow-2xl overflow-hidden" style={{ height: '250px', width: '140px' }}>
                        {/* Dynamic Island */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10"></div>
                        
                        {/* Locked Screen Overlay */}
                        {selectedLease.knoxStatus === 'locked' ? (
                          <div className="absolute inset-0 bg-gradient-to-b from-rose-950 to-slate-950 flex flex-col items-center justify-center gap-2 p-3">
                            <Lock className="w-8 h-8 text-rose-400" />
                            <p className="text-rose-300 font-black text-[9px] text-center uppercase tracking-widest">THIẾT BỊ BỊ KHÓA</p>
                            <p className="text-rose-500 font-mono text-[7px] text-center">V-Com Knox MDM</p>
                            <div className="mt-1 bg-rose-900/50 border border-rose-700 rounded-lg px-2 py-1 text-center">
                              <p className="text-rose-200 text-[7px] font-bold leading-snug">Liên hệ cửa hàng<br/>để mở khóa thiết bị</p>
                              <p className="text-rose-400 font-mono text-[6.5px] mt-0.5">1800-xxxx</p>
                            </div>
                            <span className="absolute bottom-4 text-rose-700 font-mono text-[6px]">VCOMM_KNOX_E_992</span>
                          </div>
                        ) : selectedLease.knoxStatus === 'warning' ? (
                          <div className="absolute inset-0 bg-gradient-to-b from-amber-950 to-slate-950 flex flex-col items-center justify-center gap-2 p-3">
                            <AlertTriangle className="w-7 h-7 text-amber-400 animate-pulse" />
                            <p className="text-amber-300 font-black text-[9px] text-center uppercase tracking-widest">CẢNH BÁO NỢ QUÁ HẠN</p>
                            <div className="mt-1 bg-amber-900/40 border border-amber-700 rounded-lg px-2 py-1 text-center">
                              <p className="text-amber-200 text-[7px] font-bold leading-snug">Vui lòng thanh toán<br/>kỳ hạn chưa đóng</p>
                            </div>
                            <span className="absolute bottom-2 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping"></span>
                              <span className="text-amber-600 font-mono text-[6px]">WARNING_MODE_ACTIVE</span>
                            </span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-center gap-2">
                            <div className="text-center space-y-1">
                              <p className="text-slate-300 text-[11px] font-mono">09:41</p>
                              <p className="text-slate-500 text-[7px]">Thứ Năm, 5 Tháng 6</p>
                            </div>
                            <ShieldCheck className="w-6 h-6 text-emerald-400 mt-2" />
                            <p className="text-emerald-400 text-[7.5px] font-bold">Knox Protected</p>
                          </div>
                        )}

                        {/* Bottom bar */}
                        <div className="absolute bottom-0 inset-x-0 h-5 bg-slate-900 flex items-center justify-center">
                          <div className="w-12 h-0.5 bg-slate-600 rounded-full"></div>
                        </div>
                      </div>
                      <p className="text-center text-[9px] text-slate-400 font-semibold mt-2">Trạng thái màn hình thiết bị</p>
                    </div>

                    {/* Integrated mini GPS Tracker simulation inside Vietnam zone */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-extrabold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" /> Định vị thiết bị thật
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setLocatingGps(true);
                            setTimeout(() => {
                              setLocatingGps(false);
                              setGpsFetched(true);
                            }, 1000);
                          }}
                          disabled={locatingGps}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <RefreshCw className={cn("w-3 h-3", locatingGps ? "animate-spin" : "")} />
                          Quét sóng GPS
                        </button>
                      </div>

                      {gpsFetched ? (
                        <GpsTrackerCanvas />
                      ) : (
                        <div className="h-28 border border-dashed border-slate-200 rounded-lg flex flex-col justify-center items-center text-center text-slate-400 p-3 bg-white">
                          {locatingGps ? (
                            <div className="space-y-1.5">
                              <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mx-auto" />
                              <p className="text-[10px] font-semibold text-slate-500">Đang ping trạm phát sóng Vinaphone/Viettel...</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <MapPin className="w-5 h-5 text-slate-300 mx-auto" />
                              <p className="text-[9.5px] font-semibold leading-relaxed">Chọn quét sóng để liên kết định vị tọa độ thiết bị từ xa</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Remotes control actions */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Hành động điều độ từ xa:</span>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateKnoxStatus(selectedLease.id, 'warning')}
                          className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 bg-opacity-80 active:scale-95 transition-all text-[10.5px] font-bold rounded-lg border border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Bell className="w-3.5 h-3.5" /> Gửi Overlay cảnh báo
                        </button>
                        
                        {selectedLease.knoxStatus === 'locked' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateKnoxStatus(selectedLease.id, 'unlocked')}
                            className="py-2 bg-emerald-650 hover:bg-emerald-600 text-white font-bold rounded-lg border active:scale-95 transition-all text-[10.5px] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Mở khóa thiết bị
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateKnoxStatus(selectedLease.id, 'locked')}
                            className="py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg border active:scale-95 transition-all text-[10.5px] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" /> Khóa máy Knox
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: AI Credit Audit Assessments (Gemini) */}
                {detailTab === 'ai-audit' && (
                  <div className="space-y-4 animate-in fade-in duration-200 pb-2">
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-slate-205 pb-2">
                        <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-extrabold text-slate-800 text-xs">Báo cáo kiểm soát Tín dụng của Gemini AI</span>
                      </div>

                      {aiEvaluating ? (
                        <div className="py-6 space-y-3 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto animate-duration-1000" />
                          <div className="space-y-1 font-mono text-[9px]">
                            <p className="animate-pulse">Đang rà soát dữ liệu nợ hệ thống...</p>
                            <p className="animate-pulse text-indigo-500">Gemini AI đang chấm điểm tín chỉ tài chính...</p>
                          </div>
                        </div>
                      ) : aiCreditScore > 0 ? (
                        <div className="space-y-3 animate-in fade-in duration-300">
                          {/* Credit gauge simulation */}
                          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Điểm Tín Dụng AI Est.</p>
                              <p className="text-xl font-black text-indigo-700 font-mono mt-0.5">{aiCreditScore}/850</p>
                              <span className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded border block mt-1 text-center w-max",
                                aiCreditScore >= 700 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                aiCreditScore >= 550 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-rose-50 text-rose-700 border-rose-250"
                              )}>
                                {aiCreditScore >= 700 ? "Hạng Tốt (AA)" : aiCreditScore >= 550 ? "Hạng Trung Bình (B)" : "Hạng Rủi Ro Thấp (C)"}
                              </span>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nhân Định Rủi Ro</p>
                              <div className="mt-1">
                                {aiRiskLevel === 'low' && (
                                  <span className="px-2.5 py-1 bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg">Rủi Ro Thấp</span>
                                )}
                                {aiRiskLevel === 'medium' && (
                                  <span className="px-2.5 py-1 bg-amber-500 text-slate-900 font-extrabold text-[10px] rounded-lg">Rủi Ro Vừa</span>
                                )}
                                {aiRiskLevel === 'high' && (
                                  <span className="px-2.5 py-1 bg-rose-600 text-white font-extrabold text-[10px] rounded-lg animate-pulse">Rủi Ro Cao</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Detail feedback */}
                          <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-3 text-slate-700 leading-relaxed text-[11px] font-medium max-h-[150px] overflow-y-auto custom-scrollbar">
                            {aiResult}
                          </div>

                          {/* Option to recalculate with altered incomes */}
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleAIEvaluate(selectedLease)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 shrink-0"
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> Thẩm định lại
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 text-center space-y-3">
                          <p className="text-slate-500 text-[10.5px] leading-relaxed">
                            Chạy phân tích hồ sơ thông minh dựa trên dữ liệu CIC và Gemini AI để đánh giá rủi ro tín dụng.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleAIEvaluate(selectedLease)}
                            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-95 transition-all text-white font-black px-4 py-2 rounded-xl text-[11px] flex items-center gap-1.5 mx-auto cursor-pointer shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Thẩm định với Gemini AI
                          </button>
                        </div>
                      )}
                    </div>

                    {/* CIC Lookup Section */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-extrabold text-xs text-slate-800">Tra cứu CIC / PCB</span>
                        </div>
                        <button
                          type="button"
                          disabled={cicLoading}
                          onClick={async () => {
                            setCicLoading(true);
                            await new Promise(r => setTimeout(r, 1800));
                            const cicData = getCicGroupFromCccd(selectedLease.identityCard);
                            setApplications(prev => prev.map(a =>
                              a.id === selectedLease.id
                                ? { ...a, cicGroup: cicData.group, cicScore: cicData.score, cicNotes: cicData.notes }
                                : a
                            ));
                            setSelectedLease(prev => prev ? { ...prev, cicGroup: cicData.group, cicScore: cicData.score, cicNotes: cicData.notes } : prev);
                            setCicLoading(false);
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                        >
                          {cicLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Truy xuất CIC
                        </button>
                      </div>

                      {cicLoading ? (
                        <div className="flex items-center gap-2 py-3 justify-center">
                          <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                          <span className="text-[10px] text-slate-400 font-mono animate-pulse">Đang kết nối hệ thống CIC Việt Nam...</span>
                        </div>
                      ) : selectedLease.cicGroup ? (
                        <div className="space-y-2 animate-in fade-in duration-300">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Nhóm nợ</p>
                              <p className={cn(
                                "text-lg font-black font-mono",
                                selectedLease.cicGroup === 1 ? "text-emerald-600" :
                                selectedLease.cicGroup === 2 ? "text-amber-500" :
                                selectedLease.cicGroup === 3 ? "text-orange-500" :
                                "text-rose-600"
                              )}>{selectedLease.cicGroup}</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Điểm</p>
                              <p className={cn(
                                "text-lg font-black font-mono",
                                (selectedLease.cicScore || 0) >= 700 ? "text-emerald-600" :
                                (selectedLease.cicScore || 0) >= 500 ? "text-amber-500" :
                                "text-rose-600"
                              )}>{selectedLease.cicScore}</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Xếp hạng</p>
                              <p className={cn(
                                "text-sm font-black",
                                selectedLease.cicGroup === 1 ? "text-emerald-600" :
                                selectedLease.cicGroup <= 2 ? "text-amber-500" :
                                "text-rose-600"
                              )}>
                                {selectedLease.cicGroup === 1 ? 'AA' : selectedLease.cicGroup === 2 ? 'B+' : selectedLease.cicGroup === 3 ? 'B' : selectedLease.cicGroup === 4 ? 'C' : 'D'}
                              </p>
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-150 rounded-lg p-2">
                            <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">{selectedLease.cicNotes}</p>
                          </div>
                          <p className="text-[9px] text-slate-400 italic text-right">Nguồn: Trung tâm Thông tin Tín dụng Quốc gia VN</p>
                        </div>
                      ) : (
                        <div className="py-3 text-center space-y-1">
                          <CreditCard className="w-5 h-5 text-slate-300 mx-auto" />
                          <p className="text-[10px] text-slate-400">Chưa có dữ liệu CIC. Nhấn Truy xuất để kết nối.</p>
                        </div>
                      )}
                    </div>

                    {/* Option to re-run AI eval with CIC data */}
                    {selectedLease.cicGroup && (
                      <button
                        type="button"
                        onClick={() => handleAIEvaluate(selectedLease)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-95 transition-all text-white font-black px-4 py-2 rounded-xl text-[10.5px] flex items-center gap-1.5 justify-center cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Thẩm định AI ngay với dữ liệu CIC
                      </button>
                    )}

                  </div>
                )}

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

      {/* MODAL 3: VietQR Payment & Automatic Bank reconciliation */}
      {showPaymentPortal && payingLease && paymentActiveInst && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden text-xs"
          >
            <div className="bg-gradient-to-r from-blue-700 to-indigo-850 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-black text-sm flex items-center gap-1.5">
                  <CreditCard className="w-5 h-5 text-indigo-300" /> Thanh toán VietQR Fintech
                </h3>
                <p className="text-[9.5px] text-indigo-200 uppercase tracking-wider font-extrabold mt-0.5">Hệ thống đối soát sao kê tự động 24/7</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentPortal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-sans text-xs">
              {/* Payment Bill Info */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-2 gap-y-1.5 leading-snug">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-bold text-slate-800 text-right">{payingLease.customerName}</span>
                <span className="text-slate-500">Gói thuê:</span>
                <span className="font-bold text-slate-800 text-right text-[11px] truncate" title={payingLease.deviceModel}>{payingLease.deviceModel}</span>
                <span className="text-slate-500">Kỳ trả góp góp:</span>
                <span className="font-black text-slate-900 text-right">Kỳ số {paymentActiveInst.periodNum} / {payingLease.durationMonths}</span>
                <span className="text-slate-500 font-bold">Số tiền định kỳ:</span>
                <span className="font-black text-indigo-700 text-right text-sm">{formatCurrency(paymentActiveInst.amount)}</span>
              </div>

              {/* VietQR Mock graphic and Bank Account values */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="relative w-44 h-44 mx-auto border-2 border-indigo-500 rounded-lg overflow-hidden p-1 bg-white">
                  {/* Decorative VietQR Napas logo frames */}
                  <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-blue-600 to-teal-500 flex items-center justify-between px-1 text-[7px] text-white font-extrabold uppercase tracking-widest">
                    <span>Napas 247</span>
                    <span>VietQR</span>
                  </div>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`STB_0003259821_VCOMM_LEASE_PAY_${payingLease.id}_KI_${paymentActiveInst.periodNum}`)}`}
                    alt="VietQR Payment Code"
                    className="w-full h-full object-contain pt-3"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-1.5 pt-1 text-slate-650 leading-snug">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                    <span className="font-bold">Nội dung chuyển khoản:</span>
                    <span className="font-mono text-[9.5px] font-black text-rose-650 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-220 select-all cursor-pointer">
                      VCOMM PAY {payingLease.id.slice(0, 8).toUpperCase()} K{paymentActiveInst.periodNum}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ngân hàng:</span>
                    <span className="font-black text-slate-800">MBBank (Quân Đội)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chủ tài khoản:</span>
                    <span className="font-extrabold text-slate-800 text-[9.5px]">CONG TY CP CONG NGHE VCOMM VN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số tài khoản:</span>
                    <span className="font-black text-slate-950 font-mono text-xs">0003259821</span>
                  </div>
                </div>
              </div>

              {/* Autodetect Verification button */}
              {paymentVerified ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-350 rounded-xl text-emerald-900 flex items-start gap-2.5 animate-in fade-in leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-650 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-emerald-800">Đã kiểm tra chuyển khoản thành công!</p>
                    <p className="text-[10px] text-emerald-655 mt-0.5 font-semibold">Mã bút toán #MB-VT91285. Thu tiền định kỳ đã hạch toán POS khớp quỹ VComm.</p>
                  </div>
                </div>
              ) : confirmingPayment ? (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5 text-center text-slate-350 animate-in fade-in leading-snug">
                  <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mx-auto" />
                  <div className="font-mono text-[10px] space-y-0.5">
                    <p className="animate-pulse text-indigo-400 font-bold">Đang đối chiếu giao dịch MBBank...</p>
                    <p className="text-slate-500">Đối chiếu mã nội dung: VCOMM PAY {payingLease.id.slice(0, 8).toUpperCase()} K{paymentActiveInst.periodNum}...</p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingPayment(true);
                    setTimeout(() => {
                      setConfirmingPayment(false);
                      setPaymentVerified(true);
                    }, 1500);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-650 to-teal-650 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98] transition-all text-[11px]"
                >
                  <Search className="w-4 h-4" /> Bấm kiểm tra kết quả biến động VietQR tự động
                </button>
              )}

              {/* Bottom dispatcher */}
              <div className="pt-2 flex gap-3 justify-end text-[11.5px] font-bold">
                <button
                  type="button"
                  onClick={() => setShowPaymentPortal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                >
                  {paymentVerified ? "Đóng cửa sổ" : "Hủy giao dịch"}
                </button>
                {paymentVerified && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCollectInstallment(payingLease.id, paymentActiveInst.installmentId);
                      setShowPaymentPortal(false);
                    }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer"
                  >
                    Xác nhận & Cập nhật hợp đồng
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
