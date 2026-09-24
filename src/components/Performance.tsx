import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  ArrowRight, 
  Star, 
  Users, 
  AlertCircle,
  FileCheck,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles,
  BookOpen,
  X,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  Calendar,
  Settings2,
  Copy,
  Edit3,
  Trash2,
  Check,
  Printer,
  ChevronDown,
  Building,
  UserCheck,
  Briefcase,
  HelpCircle,
  Save,
  BarChart3,
  Bookmark,
  AlertTriangle,
  RotateCcw,
  Send,
  Lock,
  Building2,
  User
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { DraggableGrid } from './ui/DraggableGrid';
import { HrmStaffOrRequestPickerModal } from './common/HrmStaffOrRequestPickerModal';
import { HrmEmployee } from '../services/hrmEmployeeService';

// ==========================================
// 1. CẤU TRÚC DỮ LIỆU TIÊU CHÍ & MA TRẬN TIÊU CHÍ
// ==========================================
export type CriteriaCategory = 'specialty' | 'sla_progress' | 'revenue_business' | 'discipline_culture' | 'innovation';

export interface EvaluationCriteria {
  id: string;
  name: string;
  category: CriteriaCategory;
  weight: number; // % (tổng phải = 100%)
  target: string;
  unit: string;
  actual?: string;
  score?: number; // 0 - 100
  guideline?: string;
}

// Cấu hình tiêu chí mẫu theo Chức danh (Role Template)
export interface RoleCriteriaTemplate {
  id: string;
  roleName: string;
  department: string;
  portalType: 'monthly' | 'mid_year' | 'annual';
  criteria: EvaluationCriteria[];
  updatedAt: string;
}

// Cấu hình tiêu chí riêng cho từng Nhân sự theo từng Tháng/Kỳ cụ thể
export interface EmployeeCriteriaSetting {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  role: string;
  periodType: 'monthly' | 'mid_year' | 'annual';
  periodKey: string; // ví dụ: "Tháng 03/2026", "Tháng 04/2026", "Kỳ H1/2026", "Năm 2026"
  criteria: EvaluationCriteria[];
  source: 'role_template' | 'custom' | 'cloned_previous';
  status: 'active' | 'draft';
  updatedAt: string;
}

// Thư viện tiêu chí chuẩn hóa VComm để chọn nhanh
export interface StandardCriteriaItem {
  id: string;
  name: string;
  category: CriteriaCategory;
  categoryName: string;
  defaultWeight: number;
  defaultTarget: string;
  unit: string;
  description: string;
}

export const STANDARD_CRITERIA_LIBRARY: StandardCriteriaItem[] = [
  // Doanh số & Kinh doanh
  {
    id: 'LIB-REV-01',
    name: 'Doanh số bán lẻ O2O & Sàn TMĐT cụm',
    category: 'revenue_business',
    categoryName: 'Doanh Số & Tài Chính',
    defaultWeight: 40,
    defaultTarget: '2.5 Tỷ',
    unit: 'VNĐ',
    description: 'Tổng giá trị GMV thực tế ghi nhận qua các kênh điểm bán O2O và gian hàng sàn'
  },
  {
    id: 'LIB-REV-02',
    name: 'Doanh thu dịch vụ Gian hàng & Quảng cáo Mall',
    category: 'revenue_business',
    categoryName: 'Doanh Số & Tài Chính',
    defaultWeight: 30,
    defaultTarget: '800 Triệu',
    unit: 'VNĐ',
    description: 'Doanh thu phí dịch vụ sàn, gói tài trợ thương hiệu và ads của nhà bán'
  },
  {
    id: 'LIB-REV-03',
    name: 'Phát triển điểm bán đại lý O2O / Nhà bán mới',
    category: 'revenue_business',
    categoryName: 'Doanh Số & Tài Chính',
    defaultWeight: 20,
    defaultTarget: '5 Đối tác',
    unit: 'Đối tác',
    description: 'Ký kết hợp tác thành công với đại lý hoặc nhà bán hàng chính hãng mới'
  },
  // Vận hành SLA & Tiến độ
  {
    id: 'LIB-SLA-01',
    name: 'Tỷ lệ đơn hàng giao hỏa tốc 2h chuẩn SLA',
    category: 'sla_progress',
    categoryName: 'Tiến Độ & SLA Vận Hành',
    defaultWeight: 25,
    defaultTarget: '96%',
    unit: '%',
    description: 'Tỷ lệ đơn giao thành công đến tay khách đúng hẹn theo cam kết Express 2H'
  },
  {
    id: 'LIB-SLA-02',
    name: 'Thời gian đóng gói & xuất kho trung bình',
    category: 'sla_progress',
    categoryName: 'Tiến Độ & SLA Vận Hành',
    defaultWeight: 30,
    defaultTarget: '< 25 phút',
    unit: 'Phút',
    description: 'Thời gian từ lúc đơn xác nhận đến khi bàn giao bưu cục vận chuyển'
  },
  {
    id: 'LIB-SLA-03',
    name: 'Tỷ lệ giải quyết cuộc gọi đầu tiên (FCR)',
    category: 'sla_progress',
    categoryName: 'Tiến Độ & SLA Vận Hành',
    defaultWeight: 35,
    defaultTarget: '85%',
    unit: '%',
    description: 'Tỷ lệ khiếu nại hoặc thắc mắc được xử lý dứt điểm ngay trong phiên hỗ trợ đầu'
  },
  {
    id: 'LIB-SLA-04',
    name: 'Thời gian phản hồi ticket / tin nhắn CSKH < 5p',
    category: 'sla_progress',
    categoryName: 'Tiến Độ & SLA Vận Hành',
    defaultWeight: 30,
    defaultTarget: '95%',
    unit: '%',
    description: 'Tỷ lệ phản hồi tin nhắn khách hàng trên Fanpage/Zalo/Livechat dưới 5 phút'
  },
  {
    id: 'LIB-SLA-05',
    name: 'Uptime vận hành hệ thống ERP & Hạ tầng Cloud',
    category: 'sla_progress',
    categoryName: 'Tiến Độ & SLA Vận Hành',
    defaultWeight: 40,
    defaultTarget: '99.9%',
    unit: '%',
    description: 'Mức độ sẵn sàng liên tục của hệ thống Core ERP và cơ sở dữ liệu Cloud'
  },
  {
    id: 'LIB-SLA-06',
    name: 'Thời gian xử lý sự cố công nghệ MTTR < 30p',
    category: 'sla_progress',
    categoryName: 'Tiến Độ & SLA Vận Hành',
    defaultWeight: 30,
    defaultTarget: '100%',
    unit: '%',
    description: 'Khắc phục hoàn toàn các sự cố P1/P2 trong vòng 30 phút phát sinh'
  },
  // Chuyên môn nghiệp vụ
  {
    id: 'LIB-SPEC-01',
    name: 'Tỷ lệ sai lệch kiểm kê kho định kỳ',
    category: 'specialty',
    categoryName: 'Chuyên Môn & Nghiệp Vụ',
    defaultWeight: 35,
    defaultTarget: '< 0.1%',
    unit: '%',
    description: 'Sai lệch số lượng giữa sổ kế toán và kiểm kê thực tế theo Mẫu 05-TSCĐ'
  },
  {
    id: 'LIB-SPEC-02',
    name: 'Tối ưu hóa chi phí vận hành & Hạ tầng Server',
    category: 'specialty',
    categoryName: 'Chuyên Môn & Nghiệp Vụ',
    defaultWeight: 20,
    defaultTarget: '-10%',
    unit: '%',
    description: 'Tỷ lệ tiết kiệm ngân sách so với hạn mức định mức được phê duyệt'
  },
  {
    id: 'LIB-SPEC-03',
    name: 'Tỷ lệ chuyển đổi đơn hàng qua Chiến dịch Ads/Live',
    category: 'specialty',
    categoryName: 'Chuyên Môn & Nghiệp Vụ',
    defaultWeight: 25,
    defaultTarget: '4.5%',
    unit: '%',
    description: 'Tỷ lệ người xem phiên Livestream hoặc click quảng cáo thực hiện mua hàng'
  },
  // Kỷ luật & Văn hóa tổ chức
  {
    id: 'LIB-DISC-01',
    name: 'Chỉ số hài lòng khách hàng CSAT sau dịch vụ',
    category: 'discipline_culture',
    categoryName: 'Kỷ Luật & Văn Hóa Tổ Chức',
    defaultWeight: 15,
    defaultTarget: '4.8/5.0',
    unit: 'Điểm',
    description: 'Điểm đánh giá trung bình từ khách hàng sau khi kết thúc hỗ trợ hoặc nhận hàng'
  },
  {
    id: 'LIB-DISC-02',
    name: 'Tuân thủ quy trình 5S, an toàn PCCC & kỷ luật ca',
    category: 'discipline_culture',
    categoryName: 'Kỷ Luật & Văn Hóa Tổ Chức',
    defaultWeight: 10,
    defaultTarget: '100%',
    unit: '%',
    description: 'Chấp hành nghiêm chỉnh nội quy giờ giấc ca trực và an toàn kho bãi/văn phòng'
  },
  // Sáng kiến & Đổi mới
  {
    id: 'LIB-INNO-01',
    name: 'Sáng kiến cải tiến tự động hóa quy trình (AI/Bot)',
    category: 'innovation',
    categoryName: 'Sáng Kiến & Đổi Mới',
    defaultWeight: 15,
    defaultTarget: '1 Sáng kiến',
    unit: 'Sáng kiến',
    description: 'Đề xuất giải pháp cải tiến hiệu năng hoặc giảm thiểu thao tác thủ công được áp dụng'
  }
];

// Bộ tiêu chí mẫu theo chức danh
export const INITIAL_ROLE_TEMPLATES: RoleCriteriaTemplate[] = [
  {
    id: 'TPL-SALES-M',
    roleName: 'Trưởng nhóm Bán hàng O2O',
    department: 'Kinh doanh & Bán lẻ',
    portalType: 'monthly',
    updatedAt: '2026-03-01',
    criteria: [
      { id: 'CR-01', name: 'Doanh số bán lẻ O2O toàn cụm', category: 'revenue_business', weight: 40, target: '2.5 Tỷ', unit: 'VNĐ', guideline: 'Doanh số chốt thành công qua app & cửa hàng O2O' },
      { id: 'CR-02', name: 'Tỷ lệ đơn thành công SLA giao 2h', category: 'sla_progress', weight: 25, target: '96%', unit: '%', guideline: 'Giao hàng đúng cam kết Express' },
      { id: 'CR-03', name: 'Phát triển điểm bán đại lý mới', category: 'revenue_business', weight: 20, target: '5 Điểm', unit: 'Điểm bán', guideline: 'Hợp đồng đại lý kích hoạt mới' },
      { id: 'CR-04', name: 'Độ hài lòng CSAT khách hàng', category: 'discipline_culture', weight: 15, target: '4.8/5', unit: 'Điểm', guideline: 'Đánh giá sau đơn hàng' }
    ]
  },
  {
    id: 'TPL-CSKH-M',
    roleName: 'Chuyên viên CSKH VIP',
    department: 'Chăm sóc Khách hàng',
    portalType: 'monthly',
    updatedAt: '2026-03-01',
    criteria: [
      { id: 'CR-05', name: 'Tỷ lệ giải quyết cuộc gọi đầu (FCR)', category: 'sla_progress', weight: 35, target: '85%', unit: '%', guideline: 'Xử lý triệt để ngay cuộc gọi đầu' },
      { id: 'CR-06', name: 'Thời gian phản hồi ticket SLA < 5p', category: 'sla_progress', weight: 30, target: '95%', unit: '%', guideline: 'Tốc độ phản hồi đa kênh Fanpage/Zalo/Web' },
      { id: 'CR-07', name: 'CSAT đánh giá sau cuộc gọi', category: 'discipline_culture', weight: 25, target: '4.8/5', unit: 'Điểm', guideline: 'Khách hàng vote sao sau phiên chat/call' },
      { id: 'CR-08', name: 'Kỷ luật ca trực & tuân thủ', category: 'discipline_culture', weight: 10, target: '100%', unit: '%', guideline: 'Đúng giờ, không bỏ cuộc gọi' }
    ]
  },
  {
    id: 'TPL-WMS-M',
    roleName: 'Quản kho Trung tâm VComm',
    department: 'Kho vận & Vận hành',
    portalType: 'monthly',
    updatedAt: '2026-03-01',
    criteria: [
      { id: 'CR-09', name: 'Tỷ lệ sai lệch kiểm kê kho định kỳ', category: 'specialty', weight: 40, target: '< 0.1%', unit: '%', guideline: 'Kiểm kê Mẫu 05-TSCĐ đối chiếu sổ sách' },
      { id: 'CR-10', name: 'Thời gian xuất hàng trung bình TB', category: 'sla_progress', weight: 30, target: '25 phút', unit: 'Phút', guideline: 'Thời gian chuẩn bị hàng từ lúc có đơn' },
      { id: 'CR-11', name: 'An toàn phòng cháy & 5S kho', category: 'discipline_culture', weight: 20, target: '100%', unit: '%', guideline: 'Vệ sinh, xếp dỡ pallet an toàn' },
      { id: 'CR-12', name: 'Kỷ luật tỷ lệ hao hụt hàng lỗi', category: 'discipline_culture', weight: 10, target: '< 0.05%', unit: '%', guideline: 'Tỷ lệ hỏng vỡ trong quá trình lưu kho' }
    ]
  },
  {
    id: 'TPL-IT-M',
    roleName: 'Kỹ sư Vận hành ERP & Cloud',
    department: 'Công nghệ Thông tin (IT)',
    portalType: 'monthly',
    updatedAt: '2026-03-01',
    criteria: [
      { id: 'CR-13', name: 'Uptime hệ thống ERP Core', category: 'sla_progress', weight: 40, target: '99.9%', unit: '%', guideline: 'Hệ thống vận hành liên tục không gián đoạn' },
      { id: 'CR-14', name: 'MTTR xử lý sự cố P1/P2 < 30p', category: 'sla_progress', weight: 30, target: '100%', unit: '%', guideline: 'Thời gian phục hồi dịch vụ sau sự cố' },
      { id: 'CR-15', name: 'Tối ưu chi phí hạ tầng Cloud', category: 'specialty', weight: 20, target: '-10%', unit: '%', guideline: 'Tối ưu tài nguyên GCP/AWS hiệu quả' },
      { id: 'CR-16', name: 'Triển khai bảo mật định kỳ', category: 'discipline_culture', weight: 10, target: '100%', unit: '%', guideline: 'Rà quét lỗ hổng và backup dữ liệu' }
    ]
  }
];

// Cấu hình tiêu chí riêng theo từng nhân sự và theo tháng
export const INITIAL_EMPLOYEE_CRITERIA: EmployeeCriteriaSetting[] = [
  {
    id: 'ECR-EMP-001-2026-03',
    employeeId: 'EMP-001',
    employeeName: 'Nguyễn Văn A',
    department: 'Kinh doanh & Bán lẻ',
    role: 'Trưởng nhóm Bán hàng O2O',
    periodType: 'monthly',
    periodKey: 'Tháng 03/2026',
    source: 'custom',
    status: 'active',
    updatedAt: '2026-03-02',
    criteria: [
      { id: 'C-01', name: 'Doanh số bán lẻ O2O toàn cụm', category: 'revenue_business', weight: 40, target: '2.5 Tỷ', unit: 'VNĐ', actual: '2.8 Tỷ', score: 98 },
      { id: 'C-02', name: 'Tỷ lệ đơn thành công SLA giao 2h', category: 'sla_progress', weight: 25, target: '96%', unit: '%', actual: '95.5%', score: 92 },
      { id: 'C-03', name: 'Phát triển điểm bán đại lý mới', category: 'revenue_business', weight: 20, target: '5 Điểm', unit: 'Điểm bán', actual: '6 Điểm', score: 100 },
      { id: 'C-04', name: 'Độ hài lòng CSAT khách hàng', category: 'discipline_culture', weight: 15, target: '4.8/5', unit: 'Điểm', actual: '4.7/5', score: 88 }
    ]
  },
  {
    id: 'ECR-EMP-001-2026-04',
    employeeId: 'EMP-001',
    employeeName: 'Nguyễn Văn A',
    department: 'Kinh doanh & Bán lẻ',
    role: 'Trưởng nhóm Bán hàng O2O',
    periodType: 'monthly',
    periodKey: 'Tháng 04/2026',
    source: 'custom',
    status: 'active',
    updatedAt: '2026-03-15',
    criteria: [
      { id: 'C-05', name: 'Doanh số chiến dịch Flash Sale Đại lễ 30/4', category: 'revenue_business', weight: 50, target: '3.2 Tỷ', unit: 'VNĐ', actual: '', score: 0 },
      { id: 'C-06', name: 'Tỷ lệ đơn thành công SLA giao 2h', category: 'sla_progress', weight: 20, target: '97%', unit: '%', actual: '', score: 0 },
      { id: 'C-07', name: 'Khai trương Hub trải nghiệm O2O Q1', category: 'revenue_business', weight: 20, target: '1 Hub', unit: 'Hub', actual: '', score: 0 },
      { id: 'C-08', name: 'Độ hài lòng CSAT khách hàng', category: 'discipline_culture', weight: 10, target: '4.9/5', unit: 'Điểm', actual: '', score: 0 }
    ]
  },
  {
    id: 'ECR-EMP-002-2026-03',
    employeeId: 'EMP-002',
    employeeName: 'Trần Thị B',
    department: 'Chăm sóc Khách hàng',
    role: 'Chuyên viên CSKH VIP',
    periodType: 'monthly',
    periodKey: 'Tháng 03/2026',
    source: 'role_template',
    status: 'active',
    updatedAt: '2026-03-01',
    criteria: [
      { id: 'C-09', name: 'Tỷ lệ giải quyết cuộc gọi đầu (FCR)', category: 'sla_progress', weight: 35, target: '85%', unit: '%', actual: '87%', score: 90 },
      { id: 'C-10', name: 'Thời gian phản hồi ticket SLA < 5p', category: 'sla_progress', weight: 30, target: '95%', unit: '%', actual: '92%', score: 85 },
      { id: 'C-11', name: 'CSAT đánh giá sau cuộc gọi', category: 'discipline_culture', weight: 25, target: '4.8/5', unit: 'Điểm', actual: '4.7/5', score: 84 },
      { id: 'C-12', name: 'Kỷ luật ca trực & tuân thủ', category: 'discipline_culture', weight: 10, target: '100%', unit: '%', actual: '98%', score: 85 }
    ]
  },
  {
    id: 'ECR-EMP-003-2026-03',
    employeeId: 'EMP-003',
    employeeName: 'Lê Văn C',
    department: 'Kho vận & Vận hành',
    role: 'Quản kho Trung tâm VComm',
    periodType: 'monthly',
    periodKey: 'Tháng 03/2026',
    source: 'role_template',
    status: 'active',
    updatedAt: '2026-03-01',
    criteria: [
      { id: 'C-13', name: 'Tỷ lệ sai lệch kiểm kê kho định kỳ', category: 'specialty', weight: 40, target: '< 0.1%', unit: '%', actual: '0.35%', score: 65 },
      { id: 'C-14', name: 'Thời gian xuất hàng trung bình TB', category: 'sla_progress', weight: 30, target: '25 phút', unit: 'Phút', actual: '28 phút', score: 75 },
      { id: 'C-15', name: 'An toàn phòng cháy & 5S kho', category: 'discipline_culture', weight: 20, target: '100%', unit: '%', actual: '95%', score: 80 },
      { id: 'C-16', name: 'Kỷ luật tỷ lệ hao hụt hàng lỗi', category: 'discipline_culture', weight: 10, target: '< 0.05%', unit: '%', actual: '0.12%', score: 60 }
    ]
  },
  {
    id: 'ECR-EMP-004-2026-03',
    employeeId: 'EMP-004',
    employeeName: 'Phạm Thị D',
    department: 'Công nghệ Thông tin (IT)',
    role: 'Kỹ sư Vận hành ERP & Cloud',
    periodType: 'monthly',
    periodKey: 'Tháng 03/2026',
    source: 'role_template',
    status: 'active',
    updatedAt: '2026-03-01',
    criteria: [
      { id: 'C-17', name: 'Uptime hệ thống ERP Core', category: 'sla_progress', weight: 40, target: '99.9%', unit: '%', actual: '99.95%', score: 100 },
      { id: 'C-18', name: 'MTTR xử lý sự cố P1/P2 < 30p', category: 'sla_progress', weight: 30, target: '100%', unit: '%', actual: '95%', score: 92 },
      { id: 'C-19', name: 'Tối ưu chi phí hạ tầng Cloud', category: 'specialty', weight: 20, target: '-10%', unit: '%', actual: '-14%', score: 98 },
      { id: 'C-20', name: 'Triển khai bảo mật định kỳ', category: 'discipline_culture', weight: 10, target: '100%', unit: '%', actual: '100%', score: 100 }
    ]
  }
];

// ==========================================
// 2. DỮ LIỆU ĐÁNH GIÁ CỦA 3 CỔNG TÁCH BIỆT
// ==========================================

// CỔNG 1: Dữ liệu đánh giá KPI hàng tháng theo Quy Trình 3 Cấp
export type EvaluationWorkflowStage = 
  | 'STAGE_1_MANAGER'   // Quản lý trực tiếp đang/chờ chấm điểm
  | 'STAGE_2_HR'        // Phòng Nhân sự đang thẩm định Tuân thủ & Chuyên cần
  | 'STAGE_3_BOD'       // Ban Giám đốc phê duyệt cuối cùng
  | 'FINAL_APPROVED'    // Ban Giám đốc đã phê duyệt hoàn tất (Đủ điều kiện chuyển Lương)
  | 'RETURNED';         // Bị trả về yêu cầu đánh giá lại

export interface MonthlyKPIEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  role: string;
  avatar: string;
  month: string; // ví dụ "Tháng 03/2026"
  kpiScore: number; // 0 - 100
  grade: 'A' | 'B' | 'C' | 'D';
  salaryMultiplier: number; // 1.2, 1.0, 0.8, 0.5
  status: 'approved' | 'pending' | 'draft';
  stage: EvaluationWorkflowStage;
  approvedBy?: string;
  criteria: EvaluationCriteria[];

  // 1. Quản lý trực tiếp đánh giá
  managerReview: {
    managerName: string;
    managerRole: string;
    workResultScore: number; // Điểm chuyên môn & kết quả
    notes: string;
    submittedAt?: string;
    signature?: string;
    isCompleted: boolean;
  };

  // 2. Phòng Nhân sự thẩm định Tuân thủ & Chuyên cần
  hrReview: {
    hrSpecialistName: string;
    complianceScore: number; // Điểm tuân thủ nội quy, 5S, văn hóa (0 - 100)
    attendanceScore: number; // Điểm chuyên cần từ chấm công (0 - 100)
    attendanceSummary: string; // Tóm tắt chuyên cần: Đúng giờ, nghỉ phép...
    lmsTrainingCompleted: boolean; // Hoàn thành khóa học LMS
    notes: string;
    reviewedAt?: string;
    signature?: string;
    isCompleted: boolean;
    isPassed: boolean;
  };

  // 3. Ban Giám đốc phê duyệt cuối cùng
  bodReview: {
    bodApproverName: string;
    bodRole: string;
    finalDecision: 'APPROVED' | 'ADJUSTED' | 'RETURNED';
    finalGrade: 'A' | 'B' | 'C' | 'D';
    finalMultiplier: number;
    executiveNotes: string;
    approvedAt?: string;
    signature?: string;
    isCompleted: boolean;
  };
}

export const INITIAL_MONTHLY_KPIS: MonthlyKPIEvaluation[] = [
  {
    id: 'KPI-2026-03-01',
    employeeId: 'EMP-001',
    employeeName: 'Nguyễn Văn A',
    department: 'Kinh doanh & Bán lẻ',
    role: 'Trưởng nhóm Bán hàng O2O',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    month: 'Tháng 03/2026',
    kpiScore: 94.5,
    grade: 'A',
    salaryMultiplier: 1.2,
    status: 'approved',
    stage: 'FINAL_APPROVED',
    approvedBy: 'Trần Ban Giám Đốc',
    criteria: [
      { id: 'C-01', name: 'Doanh số bán lẻ O2O toàn cụm', category: 'revenue_business', weight: 40, target: '2.5 Tỷ', actual: '2.8 Tỷ', score: 98, unit: 'VNĐ' },
      { id: 'C-02', name: 'Tỷ lệ đơn thành công SLA giao 2h', category: 'sla_progress', weight: 25, target: '96%', actual: '95.5%', score: 92, unit: '%' },
      { id: 'C-03', name: 'Phát triển điểm bán đại lý mới', category: 'revenue_business', weight: 20, target: '5 Điểm', actual: '6 Điểm', score: 100, unit: 'Điểm bán' },
      { id: 'C-04', name: 'Độ hài lòng CSAT khách hàng', category: 'discipline_culture', weight: 15, target: '4.8/5', actual: '4.7/5', score: 88, unit: 'Điểm' }
    ],
    managerReview: {
      managerName: 'Vũ Trưởng Khối Kinh Doanh',
      managerRole: 'Giám Đốc Kinh Doanh Bán Lẻ',
      workResultScore: 96,
      notes: 'Đạt và vượt mức chỉ tiêu doanh số cụm O2O, mở rộng thành công 6 điểm bán mới.',
      submittedAt: '2026-03-12 10:30',
      signature: 'Vũ GĐKD (Đã ký điện tử)',
      isCompleted: true
    },
    hrReview: {
      hrSpecialistName: 'Lê Chuyên Viên Nhân Sự',
      complianceScore: 95,
      attendanceScore: 98,
      attendanceSummary: 'Chấm công 26/26 ca, đúng giờ 100%, chấp hành tốt 5S điểm bán.',
      lmsTrainingCompleted: true,
      notes: 'Đã hoàn thành xuất sắc khóa đào tạo Kỹ năng Quản trị Đội nhóm trên LMS.',
      reviewedAt: '2026-03-14 14:15',
      signature: 'Lê HR (Đã xác nhận)',
      isCompleted: true,
      isPassed: true
    },
    bodReview: {
      bodApproverName: 'Trần Ban Giám Đốc',
      bodRole: 'Tổng Giám Đốc Điều Hành (CEO)',
      finalDecision: 'APPROVED',
      finalGrade: 'A',
      finalMultiplier: 1.2,
      executiveNotes: 'Phê duyệt xếp loại A và hệ số lương 1.2x. Đề xuất khen thưởng đặc cách quý I.',
      approvedAt: '2026-03-16 09:00',
      signature: 'Trần CEO (Đã ký duyệt)',
      isCompleted: true
    }
  },
  {
    id: 'KPI-2026-03-02',
    employeeId: 'EMP-002',
    employeeName: 'Trần Thị B',
    department: 'Chăm sóc Khách hàng',
    role: 'Chuyên viên CSKH VIP',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    month: 'Tháng 03/2026',
    kpiScore: 86.0,
    grade: 'B',
    salaryMultiplier: 1.0,
    status: 'pending',
    stage: 'STAGE_3_BOD',
    approvedBy: 'Chờ Ban Giám Đốc Duyệt',
    criteria: [
      { id: 'C-09', name: 'Tỷ lệ giải quyết cuộc gọi đầu (FCR)', category: 'sla_progress', weight: 35, target: '85%', actual: '87%', score: 90, unit: '%' },
      { id: 'C-10', name: 'Thời gian phản hồi ticket SLA < 5p', category: 'sla_progress', weight: 30, target: '95%', actual: '92%', score: 85, unit: '%' },
      { id: 'C-11', name: 'CSAT đánh giá sau cuộc gọi', category: 'discipline_culture', weight: 25, target: '4.8/5', actual: '4.7/5', score: 84, unit: 'Điểm' },
      { id: 'C-12', name: 'Kỷ luật ca trực & tuân thủ', category: 'discipline_culture', weight: 10, target: '100%', actual: '98%', score: 85, unit: '%' }
    ],
    managerReview: {
      managerName: 'Lê Quản Lý CSKH',
      managerRole: 'Trưởng Bộ Phận Contact Center',
      workResultScore: 88,
      notes: 'Thực hiện tốt chỉ tiêu giải quyết khiếu nại VIP, xử lý khủng hoảng đa kênh khéo léo.',
      submittedAt: '2026-03-13 16:20',
      signature: 'Lê QL (Đã ký)',
      isCompleted: true
    },
    hrReview: {
      hrSpecialistName: 'Lê Chuyên Viên Nhân Sự',
      complianceScore: 90,
      attendanceScore: 92,
      attendanceSummary: 'Đi làm đúng giờ 98%, vắng 0 buổi, tuân thủ đúng ca trực trực đêm.',
      lmsTrainingCompleted: true,
      notes: 'Tuân thủ nội quy tốt, không có phàn nàn về tác phong thái độ.',
      reviewedAt: '2026-03-15 11:00',
      signature: 'Lê HR (Đã xác nhận)',
      isCompleted: true,
      isPassed: true
    },
    bodReview: {
      bodApproverName: 'Ban Giám Đốc',
      bodRole: 'Tổng Giám Đốc',
      finalDecision: 'APPROVED',
      finalGrade: 'B',
      finalMultiplier: 1.0,
      executiveNotes: '',
      isCompleted: false
    }
  },
  {
    id: 'KPI-2026-03-03',
    employeeId: 'EMP-003',
    employeeName: 'Lê Văn C',
    department: 'Kho vận & Vận hành',
    role: 'Quản kho Trung tâm VComm',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    month: 'Tháng 03/2026',
    kpiScore: 71.5,
    grade: 'C',
    salaryMultiplier: 0.8,
    status: 'pending',
    stage: 'STAGE_2_HR',
    criteria: [
      { id: 'C-13', name: 'Tỷ lệ sai lệch kiểm kê kho định kỳ', category: 'specialty', weight: 40, target: '< 0.1%', actual: '0.35%', score: 65, unit: '%' },
      { id: 'C-14', name: 'Thời gian xuất hàng trung bình TB', category: 'sla_progress', weight: 30, target: '25 phút', actual: '28 phút', score: 75, unit: 'Phút' },
      { id: 'C-15', name: 'An toàn phòng cháy & 5S kho', category: 'discipline_culture', weight: 20, target: '100%', actual: '95%', score: 80, unit: '%' },
      { id: 'C-16', name: 'Kỷ luật tỷ lệ hao hụt hàng lỗi', category: 'discipline_culture', weight: 10, target: '< 0.05%', actual: '0.12%', score: 60, unit: '%' }
    ],
    managerReview: {
      managerName: 'Ngô Trưởng Phòng Kho Vận',
      managerRole: 'Giám Đốc Chuỗi Cung Ứng',
      workResultScore: 72,
      notes: 'Đợt kiểm kê vừa rồi có tỷ lệ sai lệch nhẹ 0.35%, cần siết chặt quy trình bàn giao ca.',
      submittedAt: '2026-03-14 09:10',
      signature: 'Ngô SC (Đã ký)',
      isCompleted: true
    },
    hrReview: {
      hrSpecialistName: 'Chờ Phòng Nhân Sự',
      complianceScore: 80,
      attendanceScore: 85,
      attendanceSummary: 'Đang trích xuất dữ liệu quẹt vân tay và biên bản 5S...',
      lmsTrainingCompleted: false,
      notes: '',
      isCompleted: false,
      isPassed: false
    },
    bodReview: {
      bodApproverName: 'Ban Giám Đốc',
      bodRole: 'Tổng Giám Đốc',
      finalDecision: 'APPROVED',
      finalGrade: 'C',
      finalMultiplier: 0.8,
      executiveNotes: '',
      isCompleted: false
    }
  },
  {
    id: 'KPI-2026-03-04',
    employeeId: 'EMP-004',
    employeeName: 'Phạm Thị D',
    department: 'Công nghệ Thông tin (IT)',
    role: 'Kỹ sư Vận hành ERP & Cloud',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    month: 'Tháng 03/2026',
    kpiScore: 96.0,
    grade: 'A',
    salaryMultiplier: 1.2,
    status: 'pending',
    stage: 'STAGE_1_MANAGER',
    criteria: [
      { id: 'C-17', name: 'Uptime hệ thống ERP Core', category: 'sla_progress', weight: 40, target: '99.9%', actual: '99.95%', score: 100, unit: '%' },
      { id: 'C-18', name: 'MTTR xử lý sự cố P1/P2 < 30p', category: 'sla_progress', weight: 30, target: '100%', actual: '95%', score: 92, unit: '%' },
      { id: 'C-19', name: 'Tối ưu chi phí hạ tầng Cloud', category: 'specialty', weight: 20, target: '-10%', actual: '-14%', score: 98, unit: '%' },
      { id: 'C-20', name: 'Triển khai bảo mật định kỳ', category: 'discipline_culture', weight: 10, target: '100%', actual: '100%', score: 100, unit: '%' }
    ],
    managerReview: {
      managerName: 'Hoàng Giám Đốc CNTT',
      managerRole: 'CTO / Trưởng Phòng IT',
      workResultScore: 96,
      notes: 'Đang hoàn tất chấm điểm thực tế hạ tầng Cloud tháng này...',
      isCompleted: false
    },
    hrReview: {
      hrSpecialistName: 'Chờ Phòng Nhân Sự',
      complianceScore: 100,
      attendanceScore: 100,
      attendanceSummary: 'Chờ Quản lý hoàn tất Vòng 1',
      lmsTrainingCompleted: true,
      notes: '',
      isCompleted: false,
      isPassed: false
    },
    bodReview: {
      bodApproverName: 'Ban Giám Đốc',
      bodRole: 'Tổng Giám Đốc',
      finalDecision: 'APPROVED',
      finalGrade: 'A',
      finalMultiplier: 1.2,
      executiveNotes: '',
      isCompleted: false
    }
  }
];

// CỔNG 2: Dữ liệu đánh giá Năng lực 360 độ Hàng nửa năm (H1/H2)
export interface Review360Data {
  employeeId: string;
  employeeName: string;
  department: string;
  period: string; // 'Kỳ H1/2026'
  talentBox: string; // e.g. "Ngôi sao (Star)"
  talentBoxCoords: [number, number]; // [Performance 1-3, Potential 1-3]
  summaryScore: number;
  selfScore: number;
  managerScore: number;
  peersScore: number;
  subordinatesScore: number;
  competencies: {
    skill: string;
    score: number;
    benchmark: number;
    fullMark: number;
  }[];
}

export const MOCK_360_REVIEWS: Record<string, Review360Data> = {
  'EMP-001': {
    employeeId: 'EMP-001',
    employeeName: 'Nguyễn Văn A',
    department: 'Kinh doanh & Bán lẻ',
    period: 'Kỳ H1/2026',
    talentBox: 'Ngôi sao (Star - High Performance & High Potential)',
    talentBoxCoords: [3, 3],
    summaryScore: 92,
    selfScore: 90,
    managerScore: 94,
    peersScore: 91,
    subordinatesScore: 93,
    competencies: [
      { skill: 'Chuyên môn TMĐT & O2O', score: 95, benchmark: 80, fullMark: 100 },
      { skill: 'Kỹ năng Đàm phán & Bán lẻ', score: 92, benchmark: 75, fullMark: 100 },
      { skill: 'Quản trị Lãnh đạo Đội ngũ', score: 88, benchmark: 70, fullMark: 100 },
      { skill: 'Tư duy Đổi mới Sáng tạo', score: 90, benchmark: 75, fullMark: 100 },
      { skill: 'Kỷ luật & Tinh thần Trách nhiệm', score: 96, benchmark: 85, fullMark: 100 },
    ]
  },
  'EMP-002': {
    employeeId: 'EMP-002',
    employeeName: 'Trần Thị B',
    department: 'Chăm sóc Khách hàng',
    period: 'Kỳ H1/2026',
    talentBox: 'Cốt cán Ổn định (Core Performer - High Performance & Medium Potential)',
    talentBoxCoords: [3, 2],
    summaryScore: 86,
    selfScore: 84,
    managerScore: 88,
    peersScore: 86,
    subordinatesScore: 85,
    competencies: [
      { skill: 'Giao tiếp & Đồng cảm Khách hàng', score: 96, benchmark: 80, fullMark: 100 },
      { skill: 'Xử lý Khủng hoảng & Khiếu nại', score: 88, benchmark: 75, fullMark: 100 },
      { skill: 'Phối hợp Liên phòng ban', score: 82, benchmark: 75, fullMark: 100 },
      { skill: 'Thích ứng Quy trình Công nghệ', score: 80, benchmark: 75, fullMark: 100 },
      { skill: 'Kỷ luật Thực thi SLA', score: 90, benchmark: 85, fullMark: 100 },
    ]
  },
  'EMP-004': {
    employeeId: 'EMP-004',
    employeeName: 'Phạm Thị D',
    department: 'Công nghệ Thông tin (IT)',
    period: 'Kỳ H1/2026',
    talentBox: 'Ngôi sao (Star - High Performance & High Potential)',
    talentBoxCoords: [3, 3],
    summaryScore: 95,
    selfScore: 94,
    managerScore: 97,
    peersScore: 95,
    subordinatesScore: 94,
    competencies: [
      { skill: 'Kiến trúc Cloud & Cơ sở dữ liệu ERP', score: 98, benchmark: 85, fullMark: 100 },
      { skill: 'Bảo mật & Ứng cứu sự cố DevSecOps', score: 96, benchmark: 80, fullMark: 100 },
      { skill: 'Lãnh đạo Kỹ thuật & Mentoring', score: 92, benchmark: 75, fullMark: 100 },
      { skill: 'Nghiên cứu & Ứng dụng AI/Automation', score: 94, benchmark: 70, fullMark: 100 },
      { skill: 'Trách nhiệm & Cam kết SLA 24/7', score: 98, benchmark: 90, fullMark: 100 },
    ]
  }
};

// CỔNG 3: Dữ liệu Đánh giá Toàn niên (Annual Review - 1 Năm)
export interface AnnualEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  role: string;
  avatar: string;
  year: string; // e.g. "Năm 2026"
  avgMonthlyKpiScore: number; // Trung bình 12 tháng (60% trọng số)
  competencyScore: number; // Trung bình Năng lực 360 H1 & H2 (25% trọng số)
  okrScore: number; // Mức độ hoàn thành OKR chiến lược năm (15% trọng số)
  finalAnnualScore: number; // Điểm tổng kết toàn niên
  annualGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  bonusMonths: number; // Tháng lương thưởng Tết / thưởng năm
  bonusAmountEstimated: number; // VNĐ
  promotionDecision: 'promote' | 'maintain' | 'pip' | 'talent_pool';
  promotionTitle?: string;
  idpNextYear: string; // Kế hoạch phát triển cá nhân năm tiếp theo
  status: 'approved' | 'pending' | 'draft';
  approvedBy?: string;
}

export const INITIAL_ANNUAL_EVALUATIONS: AnnualEvaluation[] = [
  {
    id: 'ANN-2026-01',
    employeeId: 'EMP-001',
    employeeName: 'Nguyễn Văn A',
    department: 'Kinh doanh & Bán lẻ',
    role: 'Trưởng nhóm Bán hàng O2O',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    year: 'Năm 2026',
    avgMonthlyKpiScore: 93.8,
    competencyScore: 92.0,
    okrScore: 96.0,
    finalAnnualScore: 93.7,
    annualGrade: 'A',
    bonusMonths: 2.0,
    bonusAmountEstimated: 56000000,
    promotionDecision: 'promote',
    promotionTitle: 'Phó Trưởng Phòng Kinh Doanh & Phân Phối O2O',
    idpNextYear: 'Tham gia khóa Đào tạo Quản trị Chuỗi Cung ứng O2O Quốc tế & Mentoring 3 Cán bộ nguồn',
    status: 'approved',
    approvedBy: 'Hội Đồng Quản Trị & Ban TGĐ'
  },
  {
    id: 'EMP-002-ANN-2026',
    employeeId: 'EMP-002',
    employeeName: 'Trần Thị B',
    department: 'Chăm sóc Khách hàng',
    role: 'Chuyên viên CSKH VIP',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    year: 'Năm 2026',
    avgMonthlyKpiScore: 86.2,
    competencyScore: 86.0,
    okrScore: 88.0,
    finalAnnualScore: 86.4,
    annualGrade: 'B',
    bonusMonths: 1.5,
    bonusAmountEstimated: 33000000,
    promotionDecision: 'maintain',
    idpNextYear: 'Nâng cao kỹ năng Xử lý Khủng hoảng đa kênh và Phân tích Dữ liệu CSAT khách hàng cao cấp',
    status: 'approved',
    approvedBy: 'Trần Ban Giám Đốc'
  },
  {
    id: 'ANN-2026-03',
    employeeId: 'EMP-003',
    employeeName: 'Lê Văn C',
    department: 'Kho vận & Vận hành',
    role: 'Quản kho Trung tâm VComm',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    year: 'Năm 2026',
    avgMonthlyKpiScore: 73.5,
    competencyScore: 76.0,
    okrScore: 71.0,
    finalAnnualScore: 73.8,
    annualGrade: 'C',
    bonusMonths: 1.0,
    bonusAmountEstimated: 18000000,
    promotionDecision: 'pip',
    idpNextYear: 'Tham gia chương trình Tái chuẩn hóa 5S Vận hành Kho bãi và Quy trình kiểm kê Mẫu 05-TSCĐ',
    status: 'pending'
  },
  {
    id: 'ANN-2026-04',
    employeeId: 'EMP-004',
    employeeName: 'Phạm Thị D',
    department: 'Công nghệ Thông tin (IT)',
    role: 'Kỹ sư Vận hành ERP & Cloud',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    year: 'Năm 2026',
    avgMonthlyKpiScore: 96.5,
    competencyScore: 95.0,
    okrScore: 98.0,
    finalAnnualScore: 96.4,
    annualGrade: 'A+',
    bonusMonths: 2.5,
    bonusAmountEstimated: 87500000,
    promotionDecision: 'talent_pool',
    promotionTitle: 'Giám Đốc Kỹ Thuật Hạ Tầng & Cloud (Deputy CTO)',
    idpNextYear: 'Quy hoạch Cán bộ Nguồn C-Level, chủ trì dự án Di chuyển Đa đám mây và Tối ưu Chi phí IT Core',
    status: 'approved',
    approvedBy: 'Tổng Giám Đốc Điều Hành VComm'
  }
];


export type UserRole = 'DIRECT_MANAGER' | 'HR_DEPT' | 'BOD' | 'ADMIN';

export function Performance() {
  // 4 Cổng chính: Hàng tháng, Nửa năm (360), 1 năm (Annual), Thiết lập tiêu chí
  const [activeTab, setActiveTab] = useState<'monthly_kpi' | 'mid_year_360' | 'annual_review' | 'criteria_matrix'>('monthly_kpi');

  // Phân quyền vai trò người dùng (Role Switcher 3 Cấp)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('ADMIN');

  // Quản lý dữ liệu đánh giá
  const [monthlyEvaluations, setMonthlyEvaluations] = useState<MonthlyKPIEvaluation[]>(INITIAL_MONTHLY_KPIS);
  const [annualEvaluations, setAnnualEvaluations] = useState<AnnualEvaluation[]>(INITIAL_ANNUAL_EVALUATIONS);
  const [roleTemplates, setRoleTemplates] = useState<RoleCriteriaTemplate[]>(INITIAL_ROLE_TEMPLATES);
  const [employeeCriteriaList, setEmployeeCriteriaList] = useState<EmployeeCriteriaSetting[]>(INITIAL_EMPLOYEE_CRITERIA);

  // Bộ lọc chung
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState('Tháng 03/2026');
  const [selectedYear, setSelectedYear] = useState('Năm 2026');
  
  // Modal Chấm điểm & Thẩm định Đa Cấp KPI Tháng
  const [selectedEvaluation, setSelectedEvaluation] = useState<MonthlyKPIEvaluation | null>(null);
  const [isEditingGrading, setIsEditingGrading] = useState(false);
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'manager_step' | 'hr_step' | 'bod_step'>('manager_step');
  
  // Trạng thái Sync sang Bảng lương
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncSummaryMessage, setSyncSummaryMessage] = useState<string>('');

  // 360 Review State
  const [selected360Emp, setSelected360Emp] = useState<string>('EMP-001');
  const [selected360Period, setSelected360Period] = useState<string>('Kỳ H1/2026');
  const current360 = MOCK_360_REVIEWS[selected360Emp] || MOCK_360_REVIEWS['EMP-001'];

  // Modal In Quyết định Toàn niên
  const [selectedAnnualEval, setSelectedAnnualEval] = useState<AnnualEvaluation | null>(null);
  const [showPrintAnnualModal, setShowPrintAnnualModal] = useState(false);

  // ====================================================
  // STATE CỔNG THIẾT LẬP TIÊU CHÍ (CRITERIA MATRIX)
  // ====================================================
  const [criteriaViewMode, setCriteriaViewMode] = useState<'by_role' | 'by_employee'>('by_role');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(INITIAL_ROLE_TEMPLATES[0].id);
  const [selectedEmpForCriteria, setSelectedEmpForCriteria] = useState<string>('EMP-001');
  const [selectedPeriodForCriteria, setSelectedPeriodForCriteria] = useState<string>('Tháng 03/2026');
  const [showCriteriaLibraryModal, setShowCriteriaLibraryModal] = useState(false);
  const [showAddCriteriaModal, setShowAddCriteriaModal] = useState(false);
  const [criteriaSaveSuccess, setCriteriaSaveSuccess] = useState(false);

  // Form tiêu chí mới
  const [newCriteriaDraft, setNewCriteriaDraft] = useState<Partial<EvaluationCriteria>>({
    name: '',
    category: 'specialty',
    weight: 20,
    target: '100%',
    unit: '%',
    guideline: ''
  });

  // Lấy bộ tiêu chí đang cấu hình hiện tại
  const currentRoleTemplate = roleTemplates.find(t => t.id === selectedRoleId) || roleTemplates[0];
  const currentEmpSetting = employeeCriteriaList.find(
    e => e.employeeId === selectedEmpForCriteria && e.periodKey === selectedPeriodForCriteria
  ) || {
    id: `ECR-${selectedEmpForCriteria}-${selectedPeriodForCriteria}`,
    employeeId: selectedEmpForCriteria,
    employeeName: selectedEmpForCriteria === 'EMP-001' ? 'Nguyễn Văn A' : 
                  selectedEmpForCriteria === 'EMP-002' ? 'Trần Thị B' : 
                  selectedEmpForCriteria === 'EMP-003' ? 'Lê Văn C' : 'Phạm Thị D',
    department: selectedEmpForCriteria === 'EMP-001' ? 'Kinh doanh & Bán lẻ' : 
                selectedEmpForCriteria === 'EMP-002' ? 'Chăm sóc Khách hàng' : 
                selectedEmpForCriteria === 'EMP-003' ? 'Kho vận & Vận hành' : 'Công nghệ Thông tin (IT)',
    role: selectedEmpForCriteria === 'EMP-001' ? 'Trưởng nhóm Bán hàng O2O' : 
          selectedEmpForCriteria === 'EMP-002' ? 'Chuyên viên CSKH VIP' : 
          selectedEmpForCriteria === 'EMP-003' ? 'Quản kho Trung tâm VComm' : 'Kỹ sư Vận hành ERP & Cloud',
    periodType: 'monthly' as const,
    periodKey: selectedPeriodForCriteria,
    criteria: currentRoleTemplate ? [...currentRoleTemplate.criteria] : [],
    source: 'role_template' as const,
    status: 'active' as const,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  // Tính tổng trọng số tiêu chí đang cấu hình
  const activeCriteriaList = criteriaViewMode === 'by_role' ? currentRoleTemplate.criteria : currentEmpSetting.criteria;
  const totalWeight = activeCriteriaList.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  const isWeightValid = totalWeight === 100;

  // Handler: Kế thừa tiêu chí từ Chức danh cho Nhân sự
  const handleInheritFromRole = () => {
    const matchedRole = roleTemplates.find(r => r.roleName === currentEmpSetting.role) || roleTemplates[0];
    if (!matchedRole) return;
    const clonedCriteria = matchedRole.criteria.map(c => ({ ...c, id: `C-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, actual: '', score: 0 }));
    
    const updatedSetting: EmployeeCriteriaSetting = {
      ...currentEmpSetting,
      criteria: clonedCriteria,
      source: 'role_template',
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setEmployeeCriteriaList(prev => {
      const idx = prev.findIndex(p => p.employeeId === selectedEmpForCriteria && p.periodKey === selectedPeriodForCriteria);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedSetting;
        return next;
      }
      return [...prev, updatedSetting];
    });

    setCriteriaSaveSuccess(true);
    setTimeout(() => setCriteriaSaveSuccess(false), 3000);
  };

  // Handler: Sao chép tiêu chí từ tháng trước
  const handleCloneFromPreviousMonth = () => {
    // Tìm cấu hình tháng gần nhất của nhân sự
    const prevSetting = employeeCriteriaList.find(
      e => e.employeeId === selectedEmpForCriteria && e.periodKey !== selectedPeriodForCriteria
    );
    if (!prevSetting) {
      alert('Chưa tìm thấy dữ liệu tiêu chí tháng trước của nhân sự này để sao chép!');
      return;
    }

    const clonedCriteria = prevSetting.criteria.map(c => ({
      ...c,
      id: `C-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actual: '',
      score: 0
    }));

    const updatedSetting: EmployeeCriteriaSetting = {
      ...currentEmpSetting,
      criteria: clonedCriteria,
      source: 'cloned_previous',
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setEmployeeCriteriaList(prev => {
      const idx = prev.findIndex(p => p.employeeId === selectedEmpForCriteria && p.periodKey === selectedPeriodForCriteria);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedSetting;
        return next;
      }
      return [...prev, updatedSetting];
    });

    setCriteriaSaveSuccess(true);
    setTimeout(() => setCriteriaSaveSuccess(false), 3000);
  };

  // Handler: Thêm tiêu chí từ Thư viện Chuẩn
  const handleAddCriteriaFromLibrary = (item: StandardCriteriaItem) => {
    const newCriteria: EvaluationCriteria = {
      id: `CR-LIB-${Date.now()}`,
      name: item.name,
      category: item.category,
      weight: item.defaultWeight,
      target: item.defaultTarget,
      unit: item.unit,
      guideline: item.description,
      actual: '',
      score: 0
    };

    if (criteriaViewMode === 'by_role') {
      const updatedTemplate = {
        ...currentRoleTemplate,
        criteria: [...currentRoleTemplate.criteria, newCriteria],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setRoleTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    } else {
      const updatedSetting: EmployeeCriteriaSetting = {
        ...currentEmpSetting,
        criteria: [...currentEmpSetting.criteria, newCriteria],
        source: 'custom',
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setEmployeeCriteriaList(prev => {
        const idx = prev.findIndex(p => p.employeeId === selectedEmpForCriteria && p.periodKey === selectedPeriodForCriteria);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedSetting;
          return next;
        }
        return [...prev, updatedSetting];
      });
    }

    setShowCriteriaLibraryModal(false);
  };

  // Handler: Thêm tiêu chí mới thủ công
  const handleSaveNewCriteriaDraft = () => {
    if (!newCriteriaDraft.name || !newCriteriaDraft.target) {
      alert('Vui lòng nhập đầy đủ tên tiêu chí và chỉ tiêu mục tiêu!');
      return;
    }
    const newCr: EvaluationCriteria = {
      id: `CR-CUSTOM-${Date.now()}`,
      name: newCriteriaDraft.name || 'Tiêu chí mới',
      category: newCriteriaDraft.category || 'specialty',
      weight: Number(newCriteriaDraft.weight) || 10,
      target: newCriteriaDraft.target || '100%',
      unit: newCriteriaDraft.unit || '%',
      guideline: newCriteriaDraft.guideline || '',
      actual: '',
      score: 0
    };

    if (criteriaViewMode === 'by_role') {
      const updatedTemplate = {
        ...currentRoleTemplate,
        criteria: [...currentRoleTemplate.criteria, newCr],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setRoleTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    } else {
      const updatedSetting: EmployeeCriteriaSetting = {
        ...currentEmpSetting,
        criteria: [...currentEmpSetting.criteria, newCr],
        source: 'custom',
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setEmployeeCriteriaList(prev => {
        const idx = prev.findIndex(p => p.employeeId === selectedEmpForCriteria && p.periodKey === selectedPeriodForCriteria);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedSetting;
          return next;
        }
        return [...prev, updatedSetting];
      });
    }

    setShowAddCriteriaModal(false);
    setNewCriteriaDraft({
      name: '',
      category: 'specialty',
      weight: 20,
      target: '100%',
      unit: '%',
      guideline: ''
    });
  };

  // Handler: Xóa tiêu chí
  const handleDeleteCriteria = (criteriaId: string) => {
    if (criteriaViewMode === 'by_role') {
      const updatedTemplate = {
        ...currentRoleTemplate,
        criteria: currentRoleTemplate.criteria.filter(c => c.id !== criteriaId),
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setRoleTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    } else {
      const updatedSetting: EmployeeCriteriaSetting = {
        ...currentEmpSetting,
        criteria: currentEmpSetting.criteria.filter(c => c.id !== criteriaId),
        source: 'custom',
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setEmployeeCriteriaList(prev => {
        const idx = prev.findIndex(p => p.employeeId === selectedEmpForCriteria && p.periodKey === selectedPeriodForCriteria);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedSetting;
          return next;
        }
        return [...prev, updatedSetting];
      });
    }
  };

  // Handler: Chỉnh sửa trọng số / chỉ tiêu của tiêu chí trực tiếp
  const handleUpdateCriteriaField = (criteriaId: string, field: keyof EvaluationCriteria, val: any) => {
    if (criteriaViewMode === 'by_role') {
      const updatedTemplate = {
        ...currentRoleTemplate,
        criteria: currentRoleTemplate.criteria.map(c => c.id === criteriaId ? { ...c, [field]: val } : c),
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setRoleTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    } else {
      const updatedSetting: EmployeeCriteriaSetting = {
        ...currentEmpSetting,
        criteria: currentEmpSetting.criteria.map(c => c.id === criteriaId ? { ...c, [field]: val } : c),
        source: 'custom',
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setEmployeeCriteriaList(prev => {
        const idx = prev.findIndex(p => p.employeeId === selectedEmpForCriteria && p.periodKey === selectedPeriodForCriteria);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedSetting;
          return next;
        }
        return [...prev, updatedSetting];
      });
    }
  };

  // Lưu cấu hình tiêu chí vào localStorage
  const handleSaveCriteriaConfig = () => {
    localStorage.setItem('vcomm_role_templates', JSON.stringify(roleTemplates));
    localStorage.setItem('vcomm_employee_criteria_matrix', JSON.stringify(employeeCriteriaList));
    setCriteriaSaveSuccess(true);
    setTimeout(() => setCriteriaSaveSuccess(false), 3500);
  };

  // ====================================================
  // LOGIC ĐÁNH GIÁ KPI HÀNG THÁNG
  // ====================================================

  // Thêm nhân sự vào danh sách chấm điểm tháng (kết nối trực tiếp từ Cổng Tiêu Chí)
  const handleStaffSelectedForKPI = (staff: HrmEmployee) => {
    const existing = monthlyEvaluations.find(e => e.employeeId === staff.staffCode && e.month === selectedMonth);
    if (existing) {
      setSelectedEvaluation(existing);
      setIsEditingGrading(true);
      setShowStaffPicker(false);
      return;
    }

    // 1. Tìm cấu hình tiêu chí riêng của nhân sự này trong tháng đã chọn
    const empSetting = employeeCriteriaList.find(e => e.employeeId === staff.staffCode && e.periodKey === selectedMonth);
    let resolvedCriteria: EvaluationCriteria[] = [];

    if (empSetting && empSetting.criteria.length > 0) {
      resolvedCriteria = empSetting.criteria.map(c => ({ ...c }));
    } else {
      // 2. Nếu chưa có cấu hình riêng, kế thừa từ chức danh
      const matchedRole = roleTemplates.find(r => r.roleName === staff.title) || roleTemplates[0];
      resolvedCriteria = matchedRole.criteria.map(c => ({ ...c, actual: '', score: 85 }));
    }

    // Tính điểm sơ bộ
    const calcScore = resolvedCriteria.reduce((sum, c) => sum + ((c.score || 85) * c.weight) / 100, 0);
    const grade = calcScore >= 90 ? 'A' : calcScore >= 75 ? 'B' : calcScore >= 60 ? 'C' : 'D';
    const salaryMultiplier = grade === 'A' ? 1.2 : grade === 'B' ? 1.0 : grade === 'C' ? 0.8 : 0.5;

    const newEval: MonthlyKPIEvaluation = {
      id: `KPI-${selectedMonth.replace(/\s+/g, '')}-${staff.staffCode}`,
      employeeId: staff.staffCode,
      employeeName: staff.fullName,
      department: staff.department,
      role: staff.title,
      avatar: staff.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      month: selectedMonth,
      kpiScore: Number(calcScore.toFixed(1)),
      grade,
      salaryMultiplier,
      status: 'pending',
      stage: 'STAGE_1_MANAGER',
      criteria: resolvedCriteria,
      managerReview: {
        managerName: 'Trưởng bộ phận ' + staff.department,
        managerRole: 'Quản lý trực tiếp',
        workResultScore: Number(calcScore.toFixed(1)),
        notes: 'Cán bộ hoàn thành tốt các chỉ tiêu nhiệm vụ được giao trong tháng.',
        isCompleted: false,
        signature: 'Trưởng bộ phận ' + staff.department
      },
      hrReview: {
        hrSpecialistName: 'Phạm Thị Nhân Sự (HR BP)',
        complianceScore: 95,
        attendanceScore: 98,
        attendanceSummary: '26/26 ngày công chuẩn, 0 lần vi phạm nội quy, 0 lần đi muộn',
        lmsTrainingCompleted: true,
        notes: 'Chấp hành nghiêm chỉnh nội quy lao động và 5S văn phòng/kho bãi.',
        isCompleted: false,
        isPassed: true,
        signature: 'Phạm Thị Nhân Sự'
      },
      bodReview: {
        bodApproverName: 'Trần Ban Giám Đốc',
        bodRole: 'Tổng Giám Đốc Điều Hành (CEO)',
        finalDecision: 'APPROVED',
        finalGrade: grade,
        finalMultiplier: salaryMultiplier,
        executiveNotes: 'Nhất trí với đề xuất của Quản lý trực tiếp và kết quả thẩm định của HR.',
        isCompleted: false,
        signature: 'Trần Ban Giám Đốc'
      }
    };

    setMonthlyEvaluations([newEval, ...monthlyEvaluations]);
    setSelectedEvaluation(newEval);
    setIsEditingGrading(true);
    setActiveModalTab('manager_step');
    setShowStaffPicker(false);
  };

  // Cập nhật điểm thành phần trong Modal chấm điểm KPI tháng
  const handleUpdateGradingScore = (criteriaIndex: number, field: 'actual' | 'score', value: any) => {
    if (!selectedEvaluation) return;
    const nextCriteria = [...selectedEvaluation.criteria];
    nextCriteria[criteriaIndex] = {
      ...nextCriteria[criteriaIndex],
      [field]: field === 'score' ? Number(value) : value
    };

    // Tự động tính lại điểm trung bình gia quyền
    const newKpiScore = nextCriteria.reduce((sum, c) => sum + ((Number(c.score) || 0) * (Number(c.weight) || 0)) / 100, 0);
    const newGrade: 'A' | 'B' | 'C' | 'D' = newKpiScore >= 90 ? 'A' : newKpiScore >= 75 ? 'B' : newKpiScore >= 60 ? 'C' : 'D';
    const newMultiplier = newGrade === 'A' ? 1.2 : newGrade === 'B' ? 1.0 : newGrade === 'C' ? 0.8 : 0.5;

    setSelectedEvaluation({
      ...selectedEvaluation,
      criteria: nextCriteria,
      kpiScore: Number(newKpiScore.toFixed(1)),
      grade: newGrade,
      salaryMultiplier: newMultiplier,
      managerReview: {
        ...selectedEvaluation.managerReview,
        workResultScore: Number(newKpiScore.toFixed(1))
      }
    });
  };

  // 1. Quản lý trực tiếp ký duyệt & chuyển lên HR
  const handleSubmitManagerReview = () => {
    if (!selectedEvaluation) return;
    const updated: MonthlyKPIEvaluation = {
      ...selectedEvaluation,
      stage: 'STAGE_2_HR',
      status: 'pending',
      managerReview: {
        ...selectedEvaluation.managerReview,
        isCompleted: true,
        submittedAt: new Date().toISOString().split('T')[0],
        workResultScore: selectedEvaluation.kpiScore,
        signature: selectedEvaluation.managerReview.signature || selectedEvaluation.managerReview.managerName
      }
    };
    setMonthlyEvaluations(prev => prev.map(e => e.id === updated.id ? updated : e));
    setSelectedEvaluation(updated);
    setActiveModalTab('hr_step');
  };

  // 2. Phòng Nhân sự thẩm định Tuân thủ & Chuyên cần -> Chuyển BOD hoặc Trả về
  const handleSubmitHrReview = (isPassed: boolean, returnReason?: string) => {
    if (!selectedEvaluation) return;
    if (isPassed) {
      const updated: MonthlyKPIEvaluation = {
        ...selectedEvaluation,
        stage: 'STAGE_3_BOD',
        status: 'pending',
        hrReview: {
          ...selectedEvaluation.hrReview,
          isCompleted: true,
          isPassed: true,
          reviewedAt: new Date().toISOString().split('T')[0],
          signature: selectedEvaluation.hrReview.signature || selectedEvaluation.hrReview.hrSpecialistName
        }
      };
      setMonthlyEvaluations(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelectedEvaluation(updated);
      setActiveModalTab('bod_step');
    } else {
      const updated: MonthlyKPIEvaluation = {
        ...selectedEvaluation,
        stage: 'RETURNED',
        status: 'draft',
        hrReview: {
          ...selectedEvaluation.hrReview,
          isCompleted: false,
          isPassed: false,
          notes: returnReason ? `[HR Trả về]: ${returnReason}` : selectedEvaluation.hrReview.notes,
          reviewedAt: new Date().toISOString().split('T')[0]
        }
      };
      setMonthlyEvaluations(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelectedEvaluation(updated);
      setActiveModalTab('manager_step');
    }
  };

  // 3. Ban Giám đốc phê duyệt cuối cùng -> Phê chuẩn chính thức hoặc Yêu cầu rà soát
  const handleSubmitBodApproval = (decision: 'APPROVED' | 'RETURNED', customGrade?: 'A' | 'B' | 'C' | 'D', customMultiplier?: number) => {
    if (!selectedEvaluation) return;
    if (decision === 'APPROVED') {
      const chosenGrade = customGrade || selectedEvaluation.bodReview.finalGrade || selectedEvaluation.grade;
      const chosenMultiplier = customMultiplier ?? (selectedEvaluation.bodReview.finalMultiplier || selectedEvaluation.salaryMultiplier);
      const updated: MonthlyKPIEvaluation = {
        ...selectedEvaluation,
        stage: 'FINAL_APPROVED',
        status: 'approved',
        grade: chosenGrade,
        salaryMultiplier: chosenMultiplier,
        approvedBy: selectedEvaluation.bodReview.bodApproverName || 'Trần Ban Giám Đốc',
        bodReview: {
          ...selectedEvaluation.bodReview,
          finalDecision: 'APPROVED',
          finalGrade: chosenGrade,
          finalMultiplier: chosenMultiplier,
          isCompleted: true,
          approvedAt: new Date().toISOString().split('T')[0],
          signature: selectedEvaluation.bodReview.signature || selectedEvaluation.bodReview.bodApproverName
        }
      };
      setMonthlyEvaluations(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelectedEvaluation(updated);
    } else {
      const updated: MonthlyKPIEvaluation = {
        ...selectedEvaluation,
        stage: 'RETURNED',
        status: 'draft',
        bodReview: {
          ...selectedEvaluation.bodReview,
          finalDecision: 'RETURNED',
          isCompleted: false
        }
      };
      setMonthlyEvaluations(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelectedEvaluation(updated);
    }
  };

  // Lưu nhanh đánh giá
  const handleSaveEvaluation = () => {
    if (!selectedEvaluation) return;
    setMonthlyEvaluations(prev => prev.map(e => e.id === selectedEvaluation.id ? selectedEvaluation : e));
    setSelectedEvaluation(null);
    setIsEditingGrading(false);
  };

  // Lọc danh sách KPI hàng tháng theo tháng, phòng ban, từ khóa và tiến trình 3 cấp
  const filteredKPIs = monthlyEvaluations.filter(e => {
    const matchMonth = e.month === selectedMonth;
    const matchDept = filterDepartment === 'all' || e.department === filterDepartment;
    const matchStage = filterStage === 'all' || e.stage === filterStage;
    const matchSearch = e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        e.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        e.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchMonth && matchDept && matchSearch && matchStage;
  });

  // Lọc danh sách Đánh giá Toàn niên (1 Năm)
  const filteredAnnuals = annualEvaluations.filter(a => {
    const matchYear = a.year === selectedYear;
    const matchDept = filterDepartment === 'all' || a.department === filterDepartment;
    const matchSearch = a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchYear && matchDept && matchSearch;
  });

  // Đồng bộ hệ số sang Bảng lương (/payroll) - CHỈ đồng bộ phiếu đã đạt FINAL_APPROVED
  const handleSyncToPayroll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Chỉ đồng bộ các phiếu đã được Ban Giám Đốc phê duyệt cuối cùng (FINAL_APPROVED)
      const approvedEvaluations = monthlyEvaluations.filter(
        k => k.month === selectedMonth && k.stage === 'FINAL_APPROVED'
      );
      const pendingCount = monthlyEvaluations.filter(
        k => k.month === selectedMonth && k.stage !== 'FINAL_APPROVED'
      ).length;

      if (approvedEvaluations.length === 0) {
        setIsSyncing(false);
        alert(`Chưa có phiếu đánh giá nào đạt trạng thái "Ban Giám Đốc Phê Chuẩn" (FINAL_APPROVED) trong ${selectedMonth}!\n\nHệ thống chỉ cho phép đồng bộ sang Bảng Lương khi đã hoàn tất quy trình 3 cấp (Quản lý -> HR -> Ban Giám đốc).`);
        return;
      }

      const payrollData = approvedEvaluations.map(k => ({
        employeeId: k.employeeId,
        employeeName: k.employeeName,
        kpiScore: k.kpiScore,
        grade: k.grade,
        salaryMultiplier: k.salaryMultiplier,
        month: k.month,
        approvedBy: k.approvedBy || k.bodReview.bodApproverName,
        stage: k.stage,
        syncedAt: new Date().toISOString()
      }));

      localStorage.setItem('vcomm_payroll_kpi_sync', JSON.stringify(payrollData));
      window.dispatchEvent(new CustomEvent('vcomm_kpi_synced_to_payroll', { detail: payrollData }));

      setIsSyncing(false);
      setSyncSuccess(true);
      setSyncSummaryMessage(
        `Đã đồng bộ thành công ${approvedEvaluations.length} nhân sự đã có phê chuẩn của Ban Giám Đốc sang Bảng Lương. (${pendingCount} nhân sự đang ở các cấp duyệt trước chưa được chuyển).`
      );
      setTimeout(() => setSyncSuccess(false), 6000);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 text-slate-800 p-2 md:p-4">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            Hệ Thống Đánh Giá Hiệu Suất VComm Enterprise
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Cổng Đánh Giá & Ma Trận Tiêu Chí Hiệu Suất</h1>
          <p className="text-indigo-200 text-xs md:text-sm max-w-3xl leading-relaxed">
            Hệ thống phân tách chuyên biệt 3 chu kỳ đánh giá (Hàng tháng, Nửa năm, 1 Năm) kết hợp Cổng Thiết Lập Tiêu Chí linh hoạt theo chức danh và từng nhân sự, biến thiên theo từng tháng quản trị.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setActiveTab('criteria_matrix')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-indigo-100 text-xs font-bold rounded-xl backdrop-blur-md border border-white/20 flex items-center gap-2 transition-all"
          >
            <Settings2 className="w-4 h-4 text-indigo-300" />
            Cổng Thiết Lập Tiêu Chí
          </button>
          <button
            onClick={handleSyncToPayroll}
            disabled={isSyncing}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <DollarSign className="w-4 h-4" />
            )}
            Đồng Bộ Hệ Số Sang Bảng Lương
          </button>
        </div>
      </div>

      {/* Role Switcher Toolbar: Phân Quyền 3 Cấp Thẩm Định & Phê Duyệt */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex flex-wrap items-center gap-2">
              <span>Phân Quyền Quy Trình Đánh Giá 3 Cấp</span>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-normal",
                currentUserRole === 'DIRECT_MANAGER' ? "bg-blue-100 text-blue-800" :
                currentUserRole === 'HR_DEPT' ? "bg-purple-100 text-purple-800" :
                currentUserRole === 'BOD' ? "bg-amber-100 text-amber-800" :
                "bg-indigo-600 text-white"
              )}>
                {currentUserRole === 'DIRECT_MANAGER' ? '👔 Vai trò: Quản Lý Trực Tiếp' :
                 currentUserRole === 'HR_DEPT' ? '📋 Vai trò: Phòng Nhân Sự (HR)' :
                 currentUserRole === 'BOD' ? '🏛️ Vai trò: Ban Giám Đốc (BOD)' :
                 '⚡ Quản Trị Viên (Toàn Quyền)'}
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Chuyển đổi vai trò để kiểm thử phân quyền: <strong>1. Quản lý trực tiếp</strong> (chuyên môn & KPI) &rarr; <strong>2. Phòng Nhân sự</strong> (tuân thủ & chuyên cần) &rarr; <strong>3. Ban Giám đốc</strong> (phê duyệt cuối).
            </div>
          </div>
        </div>

        {/* Role Pills Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-stretch lg:self-auto shrink-0">
          <button
            onClick={() => setCurrentUserRole('DIRECT_MANAGER')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all",
              currentUserRole === 'DIRECT_MANAGER'
                ? "bg-white text-blue-900 shadow-xs border border-slate-200 font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>1. Quản Lý</span>
          </button>
          <button
            onClick={() => setCurrentUserRole('HR_DEPT')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all",
              currentUserRole === 'HR_DEPT'
                ? "bg-white text-purple-900 shadow-xs border border-slate-200 font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
          >
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            <span>2. Phòng Nhân Sự</span>
          </button>
          <button
            onClick={() => setCurrentUserRole('BOD')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all",
              currentUserRole === 'BOD'
                ? "bg-white text-amber-900 shadow-xs border border-slate-200 font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>3. Ban Giám Đốc</span>
          </button>
          <button
            onClick={() => setCurrentUserRole('ADMIN')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all",
              currentUserRole === 'ADMIN'
                ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin (Toàn quyền)</span>
          </button>
        </div>
      </div>

      {/* Sync Alert Banner */}
      {syncSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <span className="font-bold">Đồng bộ thành công!</span> {syncSummaryMessage || `Hệ số lương hiệu suất đã được chuyển tiếp sang Phân hệ Tiền Lương (/payroll).`}
          </div>
        </div>
      )}

      {/* 4 Metric Cards */}
      <DraggableGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" columns={4} gap={16}>
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">KPI Hàng Tháng (T3/2026)</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">87.0 / 100</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Liên thông Bảng Lương (1.0x - 1.2x)</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nửa Năm 360° (H1/2026)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">Radar & 9-Box</div>
          <div className="mt-2 text-xs text-slate-500">Đã hoàn tất 86% phiếu khảo sát</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Kết 1 Năm ({selectedYear})</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">Thưởng Tết & Bổ Nhiệm</div>
          <div className="mt-2 text-xs text-slate-500">Tổng quỹ thưởng: 194.5 Tr VNĐ</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ma Trận Tiêu Chí Đang Chạy</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600">{roleTemplates.length} Chức danh • {employeeCriteriaList.length} Bản ghi NV</div>
          <div className="mt-2 text-xs text-indigo-600 font-semibold flex items-center gap-1 cursor-pointer hover:underline" onClick={() => setActiveTab('criteria_matrix')}>
            Tùy biến tiêu chí theo tháng <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      </DraggableGrid>

      {/* Main Tabs Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs Header - 4 TABS RÕ RÀNG */}
        <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('monthly_kpi')}
              className={cn(
                "px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2",
                activeTab === 'monthly_kpi'
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100"
              )}
            >
              <Target className="w-4 h-4" />
              1. Đánh Giá Hàng Tháng
            </button>

            <button
              onClick={() => setActiveTab('mid_year_360')}
              className={cn(
                "px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2",
                activeTab === 'mid_year_360'
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100"
              )}
            >
              <Users className="w-4 h-4" />
              2. Đánh Giá Nửa Năm (360° & 9-Box)
            </button>

            <button
              onClick={() => setActiveTab('annual_review')}
              className={cn(
                "px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2",
                activeTab === 'annual_review'
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100"
              )}
            >
              <Award className="w-4 h-4" />
              3. Đánh Giá 1 Năm (Toàn Niên)
            </button>

            <button
              onClick={() => setActiveTab('criteria_matrix')}
              className={cn(
                "px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2",
                activeTab === 'criteria_matrix'
                  ? "bg-purple-700 text-white shadow-sm"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
              )}
            >
              <Settings2 className="w-4 h-4" />
              ⚙️ Cổng Thiết Lập Tiêu Chí
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Liên thông tự động giữa Cổng Tiêu Chí, 3 Cổng Đánh Giá và Bảng Lương
          </div>
        </div>

        {/* ==================================================== */}
        {/* TAB 1: CỔNG ĐÁNH GIÁ HÀNG THÁNG                      */}
        {/* ==================================================== */}
        {activeTab === 'monthly_kpi' && (
          <div className="p-6 space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Chọn Tháng:</span>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  >
                    <option value="Tháng 01/2026">Tháng 01/2026</option>
                    <option value="Tháng 02/2026">Tháng 02/2026</option>
                    <option value="Tháng 03/2026">Tháng 03/2026 (Hiện tại)</option>
                    <option value="Tháng 04/2026">Tháng 04/2026 (Kế hoạch)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filterDepartment}
                    onChange={e => setFilterDepartment(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Tất cả phòng ban</option>
                    <option value="Kinh doanh & Bán lẻ">Kinh doanh & Bán lẻ</option>
                    <option value="Chăm sóc Khách hàng">Chăm sóc Khách hàng</option>
                    <option value="Kho vận & Vận hành">Kho vận & Vận hành</option>
                    <option value="Công nghệ Thông tin (IT)">Công nghệ Thông tin (IT)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <select
                    value={filterStage}
                    onChange={e => setFilterStage(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  >
                    <option value="all">Tất cả tiến trình 3 cấp</option>
                    <option value="STAGE_1_MANAGER">Cấp 1: Chờ Quản lý đánh giá</option>
                    <option value="STAGE_2_HR">Cấp 2: Chờ HR thẩm định Tuân thủ & Chuyên cần</option>
                    <option value="STAGE_3_BOD">Cấp 3: Chờ Ban Giám đốc phê duyệt</option>
                    <option value="FINAL_APPROVED">✅ BGĐ Đã phê chuẩn (Đủ đk chuyển Lương)</option>
                    <option value="RETURNED">↩️ Bị trả về yêu cầu đánh giá lại</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full lg:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Tìm nhân sự, chức danh..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={() => setShowStaffPicker(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Đánh Giá Nhân Sự HRM
                </button>
              </div>
            </div>

            {/* KPI Salary Multiplier Guidance Alert */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">Loại A (Xuất sắc)</span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-black">1.2x</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">Điểm KPI: &ge; 90 điểm</div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800">Loại B (Hoàn thành tốt)</span>
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-black">1.0x</span>
                </div>
                <div className="text-[11px] text-blue-700 mt-1">Điểm KPI: 75 - 89 điểm</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">Loại C (Cần cải thiện)</span>
                  <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-black">0.8x</span>
                </div>
                <div className="text-[11px] text-amber-700 mt-1">Điểm KPI: 60 - 74 điểm</div>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800">Loại D (Không đạt)</span>
                  <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black">0.5x</span>
                </div>
                <div className="text-[11px] text-rose-700 mt-1">Điểm KPI: &lt; 60 điểm</div>
              </div>
            </div>

            {/* KPI Evaluation Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Cán bộ Nhân sự</th>
                      <th className="py-3 px-4">Phòng ban & Chức vụ</th>
                      <th className="py-3 px-4 text-center">Kỳ Đánh Giá</th>
                      <th className="py-3 px-4 text-center">Tiêu Chí Áp Dụng</th>
                      <th className="py-3 px-4 text-center">Điểm KPI</th>
                      <th className="py-3 px-4 text-center">Xếp loại</th>
                      <th className="py-3 px-4 text-center">Hệ số Lương (HQ)</th>
                      <th className="py-3 px-4 text-center">Tiến Trình 3 Cấp</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredKPIs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          Chưa có phiếu đánh giá nào trong {selectedMonth} khớp bộ lọc. Hãy bấm "Đánh Giá Nhân Sự HRM" để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      filteredKPIs.map(ev => {
                        const isManagerCurrent = ev.stage === 'STAGE_1_MANAGER' || ev.stage === 'RETURNED';
                        const isHrCurrent = ev.stage === 'STAGE_2_HR';
                        const isBodCurrent = ev.stage === 'STAGE_3_BOD';
                        const isApproved = ev.stage === 'FINAL_APPROVED';

                        return (
                          <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={ev.avatar}
                                  alt={ev.employeeName}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <div className="font-bold text-slate-900">{ev.employeeName}</div>
                                  <div className="text-[10px] font-mono text-slate-400">{ev.employeeId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800">{ev.department}</div>
                              <div className="text-[11px] text-slate-500">{ev.role}</div>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-indigo-900">
                              {ev.month}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                                {ev.criteria.length} tiêu chí
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-sm text-indigo-700">
                                {ev.kpiScore}
                              </span>
                              <span className="text-[10px] text-slate-400">/100</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-black",
                                ev.grade === 'A' ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                                ev.grade === 'B' ? "bg-blue-100 text-blue-800 border border-blue-300" :
                                ev.grade === 'C' ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                "bg-rose-100 text-rose-800 border border-rose-300"
                              )}>
                                Loại {ev.grade}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-mono font-black text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {ev.salaryMultiplier}x
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {ev.stage === 'STAGE_1_MANAGER' ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200">
                                  <UserCheck className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                                  1. Chờ Quản lý
                                </span>
                              ) : ev.stage === 'STAGE_2_HR' ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 bg-purple-50 text-purple-800 border border-purple-200">
                                  <Building2 className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                                  2. Chờ HR thẩm định
                                </span>
                              ) : ev.stage === 'STAGE_3_BOD' ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200">
                                  <Award className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                  3. Chờ BGĐ duyệt
                                </span>
                              ) : ev.stage === 'FINAL_APPROVED' ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  ✅ BGĐ Đã Phê Chuẩn
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200">
                                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                  ↩️ Yêu cầu rà soát
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedEvaluation(ev);
                                  setIsEditingGrading(true);
                                  // Tự động mở tab phù hợp với vai trò và giai đoạn
                                  if (currentUserRole === 'DIRECT_MANAGER') {
                                    setActiveModalTab('manager_step');
                                  } else if (currentUserRole === 'HR_DEPT') {
                                    setActiveModalTab('hr_step');
                                  } else if (currentUserRole === 'BOD') {
                                    setActiveModalTab('bod_step');
                                  } else {
                                    if (ev.stage === 'STAGE_1_MANAGER' || ev.stage === 'RETURNED') setActiveModalTab('manager_step');
                                    else if (ev.stage === 'STAGE_2_HR') setActiveModalTab('hr_step');
                                    else setActiveModalTab('bod_step');
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs",
                                  currentUserRole === 'DIRECT_MANAGER' && isManagerCurrent ? "bg-blue-600 hover:bg-blue-700 text-white" :
                                  currentUserRole === 'HR_DEPT' && isHrCurrent ? "bg-purple-600 hover:bg-purple-700 text-white" :
                                  currentUserRole === 'BOD' && isBodCurrent ? "bg-amber-600 hover:bg-amber-700 text-white" :
                                  currentUserRole === 'ADMIN' ? "bg-indigo-600 hover:bg-indigo-700 text-white" :
                                  "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                )}
                              >
                                {currentUserRole === 'DIRECT_MANAGER' && isManagerCurrent ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Chấm điểm Vòng 1</span>
                                  </>
                                ) : currentUserRole === 'HR_DEPT' && isHrCurrent ? (
                                  <>
                                    <Building2 className="w-3.5 h-3.5" />
                                    <span>Thẩm định HR</span>
                                  </>
                                ) : currentUserRole === 'BOD' && isBodCurrent ? (
                                  <>
                                    <Award className="w-3.5 h-3.5" />
                                    <span>BGĐ Phê duyệt</span>
                                  </>
                                ) : isApproved ? (
                                  <>
                                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Xem hồ sơ duyệt</span>
                                  </>
                                ) : (
                                  <>
                                    <FileCheck className="w-3.5 h-3.5" />
                                    <span>Chi tiết 3 Cấp</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: CỔNG ĐÁNH GIÁ NỬA NĂM (360° & 9-BOX MATRIX)    */}
        {/* ==================================================== */}
        {activeTab === 'mid_year_360' && (
          <div className="p-6 space-y-6">
            {/* Top Selector for 360 Employee & Period */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Kỳ Đánh Giá Nửa Năm:</span>
                <select
                  value={selected360Period}
                  onChange={e => setSelected360Period(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg text-xs py-1.5 px-3 font-bold text-indigo-900"
                >
                  <option value="Kỳ H1/2026">Kỳ H1/2026 (6 Tháng đầu năm)</option>
                  <option value="Kỳ H2/2026">Kỳ H2/2026 (6 Tháng cuối năm)</option>
                </select>

                <span className="text-xs font-bold text-slate-700 ml-2">Chọn nhân sự khảo sát:</span>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(MOCK_360_REVIEWS).map(empKey => {
                    const emp = MOCK_360_REVIEWS[empKey];
                    return (
                      <button
                        key={empKey}
                        onClick={() => setSelected360Emp(empKey)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                          selected360Emp === empKey
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <span>{emp.employeeName}</span>
                        <span className="text-[10px] opacity-75">({emp.department})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Tổng điểm năng lực: <strong className="text-indigo-950 font-black">{current360.summaryScore}/100</strong>
              </div>
            </div>

            {/* 4-Direction Scores Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase">1. Tự Đánh Giá (Self)</div>
                <div className="text-2xl font-black text-indigo-600 mt-1">{current360.selfScore}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Tự nhận xét năng lực cá nhân</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase">2. Quản Lý Trực Tiếp (Manager)</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{current360.managerScore}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Trưởng phòng / Trưởng nhóm</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase">3. Đồng Cấp Ngang Hàng (Peers)</div>
                <div className="text-2xl font-black text-blue-600 mt-1">{current360.peersScore}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Khảo sát ẩn danh 4 đồng nghiệp</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase">4. Cấp Dưới & Tuyến Dưới (Subordinates)</div>
                <div className="text-2xl font-black text-purple-600 mt-1">{current360.subordinatesScore}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Phản hồi từ nhân sự tuyến dưới</div>
              </div>
            </div>

            {/* Radar Chart & 9-Box Grid Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart 5 Trụ cột */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Biểu Đồ Mạng Nhện Năng Lực (Radar Chart)</h3>
                    <p className="text-xs text-slate-500">Đối chiếu năng lực thực tế với Tiêu chuẩn Chức danh (Benchmark)</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg">
                    5 Trụ cột cốt lõi
                  </span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius="75%" data={current360.competencies}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: '#475569', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Điểm Đạt Được" dataKey="score" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.5} />
                      <Radar name="Chuẩn Chức Danh" dataKey="benchmark" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-center gap-6 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                    <span>Năng lực thực tế</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span>Chuẩn định biên (Benchmark)</span>
                  </div>
                </div>
              </div>

              {/* 9-Box Talent Matrix */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Ma Trận Phân Loại Nhân Tài (9-Box Grid)</h3>
                    <p className="text-xs text-slate-500">Trục Tung: Tiềm năng phát triển • Trục Hoành: Hiệu suất công việc</p>
                  </div>
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-md">
                    Talent Review
                  </span>
                </div>

                {/* 9-Box Visual Representation */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {/* Row 3 (High Potential) */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-600">
                    <div className="font-bold text-[11px]">Enigma</div>
                    <div className="text-[10px] text-slate-400">Hiệu suất Thấp - Tiềm năng Cao</div>
                  </div>
                  <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 text-indigo-900">
                    <div className="font-bold text-[11px]">Growth Potential</div>
                    <div className="text-[10px] text-indigo-600">Hiệu suất Vừa - Tiềm năng Cao</div>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg border text-white relative transition-all",
                    current360.talentBoxCoords[0] === 3 && current360.talentBoxCoords[1] === 3
                      ? "bg-gradient-to-tr from-amber-500 to-amber-600 border-amber-600 shadow-md ring-2 ring-amber-400"
                      : "bg-amber-100 text-amber-900 border-amber-300"
                  )}>
                    <div className="font-extrabold text-[11px]">⭐ STAR (Ngôi sao)</div>
                    <div className="text-[10px] opacity-90">Hiệu suất Cao - Tiềm năng Cao</div>
                    {current360.talentBoxCoords[0] === 3 && current360.talentBoxCoords[1] === 3 && (
                      <div className="mt-1 text-[10px] font-bold bg-white/20 rounded px-1">
                        📍 {current360.employeeName}
                      </div>
                    )}
                  </div>

                  {/* Row 2 (Medium Potential) */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-600">
                    <div className="font-bold text-[11px]">Dilemma</div>
                    <div className="text-[10px] text-slate-400">Hiệu suất Thấp - Tiềm năng Vừa</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700">
                    <div className="font-bold text-[11px]">Core Performer</div>
                    <div className="text-[10px] text-slate-400">Hiệu suất Vừa - Tiềm năng Vừa</div>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg border transition-all",
                    current360.talentBoxCoords[0] === 3 && current360.talentBoxCoords[1] === 2
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400"
                      : "bg-emerald-50 text-emerald-900 border-emerald-200"
                  )}>
                    <div className="font-bold text-[11px]">High Performer</div>
                    <div className="text-[10px] opacity-90">Hiệu suất Cao - Tiềm năng Vừa</div>
                    {current360.talentBoxCoords[0] === 3 && current360.talentBoxCoords[1] === 2 && (
                      <div className="mt-1 text-[10px] font-bold bg-white/20 rounded px-1">
                        📍 {current360.employeeName}
                      </div>
                    )}
                  </div>

                  {/* Row 1 (Low Potential) */}
                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-800">
                    <div className="font-bold text-[11px]">Risk / Underperformer</div>
                    <div className="text-[10px] text-rose-500">Hiệu suất Thấp - Tiềm năng Thấp</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-600">
                    <div className="font-bold text-[11px]">Effective Specialist</div>
                    <div className="text-[10px] text-slate-400">Hiệu suất Vừa - Tiềm năng Thấp</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700">
                    <div className="font-bold text-[11px]">Trusted Professional</div>
                    <div className="text-[10px] text-slate-400">Hiệu suất Cao - Tiềm năng Thấp</div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                  <div className="font-bold">Đánh giá phân loại hiện tại:</div>
                  <div>{current360.talentBox}</div>
                  <div className="text-[11px] text-indigo-700">
                    Khuyến nghị: Đưa vào danh sách Cán bộ Nguồn (Succession Planning), quy hoạch bổ nhiệm Cấp quản lý trong 6 - 12 tháng tới.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: CỔNG ĐÁNH GIÁ 1 NĂM (ANNUAL / YEAR-END)        */}
        {/* ==================================================== */}
        {activeTab === 'annual_review' && (
          <div className="p-6 space-y-6">
            {/* Filter Bar Annual */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-700">Năm Đánh Giá Toàn Niên:</span>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 font-black text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Năm 2026">Năm 2026 (Đang tổng kết)</option>
                  <option value="Năm 2025">Năm 2025 (Đã hoàn tất)</option>
                </select>

                <select
                  value={filterDepartment}
                  onChange={e => setFilterDepartment(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tất cả phòng ban</option>
                  <option value="Kinh doanh & Bán lẻ">Kinh doanh & Bán lẻ</option>
                  <option value="Chăm sóc Khách hàng">Chăm sóc Khách hàng</option>
                  <option value="Kho vận & Vận hành">Kho vận & Vận hành</option>
                  <option value="Công nghệ Thông tin (IT)">Công nghệ Thông tin (IT)</option>
                </select>
              </div>

              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Công thức: <strong>60% KPI 12 Tháng + 25% Năng Lực 360° + 15% OKR Năm</strong></span>
              </div>
            </div>

            {/* Policy Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 rounded-xl">
                <div className="font-extrabold text-amber-900 text-xs flex items-center justify-between">
                  <span>Loại A+ (Vượt bậc)</span>
                  <span className="px-1.5 py-0.5 bg-amber-600 text-white rounded text-[10px]">2.5T</span>
                </div>
                <div className="text-[11px] text-amber-800 mt-1">&ge; 95đ • Thưởng 2.5 tháng + Bổ nhiệm C-Level</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="font-bold text-emerald-800 text-xs flex items-center justify-between">
                  <span>Loại A (Xuất sắc)</span>
                  <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px]">2.0T</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">90 - 94đ • Thưởng 2.0 tháng + Cán bộ nguồn</div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="font-bold text-blue-800 text-xs flex items-center justify-between">
                  <span>Loại B (Hoàn thành tốt)</span>
                  <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]">1.5T</span>
                </div>
                <div className="text-[11px] text-blue-700 mt-1">75 - 89đ • Thưởng 1.5 tháng lương</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="font-bold text-amber-800 text-xs flex items-center justify-between">
                  <span>Loại C (Hoàn thành)</span>
                  <span className="px-1.5 py-0.5 bg-amber-600 text-white rounded text-[10px]">1.0T</span>
                </div>
                <div className="text-[11px] text-amber-700 mt-1">60 - 74đ • Thưởng 1 tháng (Lương T13)</div>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="font-bold text-rose-800 text-xs flex items-center justify-between">
                  <span>Loại D (Không đạt)</span>
                  <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px]">0.0T</span>
                </div>
                <div className="text-[11px] text-rose-700 mt-1">&lt; 60đ • Không thưởng năm + Kế hoạch PIP</div>
              </div>
            </div>

            {/* Annual Review Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Cán bộ Nhân sự</th>
                      <th className="py-3 px-4">Phòng ban & Vị trí</th>
                      <th className="py-3 px-4 text-center">KPI 12T (60%)</th>
                      <th className="py-3 px-4 text-center">Năng Lực (25%)</th>
                      <th className="py-3 px-4 text-center">OKR (15%)</th>
                      <th className="py-3 px-4 text-center">Điểm Năm</th>
                      <th className="py-3 px-4 text-center">Xếp loại</th>
                      <th className="py-3 px-4 text-center">Thưởng Tết / Năm</th>
                      <th className="py-3 px-4">Quyết Định Nhân Sự & IDP</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAnnuals.map(an => (
                      <tr key={an.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={an.avatar}
                              alt={an.employeeName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{an.employeeName}</div>
                              <div className="text-[10px] font-mono text-slate-400">{an.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{an.department}</div>
                          <div className="text-[11px] text-slate-500">{an.role}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {an.avgMonthlyKpiScore}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {an.competencyScore}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {an.okrScore}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-black text-sm text-indigo-800">
                            {an.finalAnnualScore}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-black",
                            an.annualGrade === 'A+' ? "bg-amber-100 text-amber-900 border border-amber-400 shadow-xs" :
                            an.annualGrade === 'A' ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                            an.annualGrade === 'B' ? "bg-blue-100 text-blue-800 border border-blue-300" :
                            an.annualGrade === 'C' ? "bg-amber-100 text-amber-800 border border-amber-300" :
                            "bg-rose-100 text-rose-800 border border-rose-300"
                          )}>
                            Loại {an.annualGrade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="font-mono font-bold text-emerald-700">
                            {an.bonusMonths} Tháng Lương
                          </div>
                          <div className="text-[10px] font-black text-slate-800">
                            {an.bonusAmountEstimated.toLocaleString('vi-VN')} đ
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          {an.promotionTitle ? (
                            <div className="font-bold text-indigo-700 text-[11px] flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
                              {an.promotionTitle}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-600 font-medium">Giữ nguyên vị trí</span>
                          )}
                          <div className="text-[10px] text-slate-400 truncate mt-0.5" title={an.idpNextYear}>
                            IDP: {an.idpNextYear}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAnnualEval(an);
                              setShowPrintAnnualModal(true);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors border border-slate-300 flex items-center gap-1 ml-auto"
                          >
                            <Printer className="w-3.5 h-3.5 text-indigo-600" />
                            Biên Bản A4
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: CỔNG THIẾT LẬP TIÊU CHÍ (CRITERIA MATRIX)      */}
        {/* ==================================================== */}
        {activeTab === 'criteria_matrix' && (
          <div className="p-6 space-y-6">
            {/* Header Control for Criteria Mode */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-purple-50/70 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Chế độ thiết lập:</span>
                <div className="flex p-1 bg-white rounded-lg border border-purple-200 shadow-xs">
                  <button
                    onClick={() => setCriteriaViewMode('by_role')}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5",
                      criteriaViewMode === 'by_role'
                        ? "bg-purple-700 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    Theo Chức Danh (Role Template)
                  </button>
                  <button
                    onClick={() => setCriteriaViewMode('by_employee')}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5",
                      criteriaViewMode === 'by_employee'
                        ? "bg-purple-700 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Tùy Biến Từng Nhân Sự & Tháng
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCriteriaLibraryModal(true)}
                  className="px-3.5 py-1.5 bg-white border border-purple-300 text-purple-800 hover:bg-purple-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Bookmark className="w-3.5 h-3.5 text-purple-600" />
                  Thư Viện Tiêu Chí Chuẩn VComm
                </button>
                <button
                  onClick={() => setShowAddCriteriaModal(true)}
                  className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm Tiêu Chí Mới
                </button>
              </div>
            </div>

            {/* Notification alert on save */}
            {criteriaSaveSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-2 text-emerald-800 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Đã lưu thành công bộ tiêu chí! Dữ liệu đã được nạp ngay vào Cổng Đánh Giá Hàng Tháng.</span>
              </div>
            )}

            {/* MODE 1: THEO CHỨC DANH */}
            {criteriaViewMode === 'by_role' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Chọn Chức danh:</span>
                    <select
                      value={selectedRoleId}
                      onChange={e => setSelectedRoleId(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg text-xs py-2 px-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                    >
                      {roleTemplates.map(tpl => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.roleName} ({tpl.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border",
                      isWeightValid ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                    )}>
                      {isWeightValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      Tổng Trọng Số: {totalWeight}% {isWeightValid ? '(Chuẩn 100%)' : '(Cần đúng 100%)'}
                    </span>
                    <button
                      onClick={handleSaveCriteriaConfig}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Lưu Cấu Hình Mẫu
                    </button>
                  </div>
                </div>

                {/* Criteria Table for Role */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Tên Tiêu Chí</th>
                        <th className="py-3 px-4">Phân Nhóm</th>
                        <th className="py-3 px-4 text-center">Trọng Số (%)</th>
                        <th className="py-3 px-4 text-center">Chỉ Tiêu Mục Tiêu</th>
                        <th className="py-3 px-4 text-center">Đơn Vị</th>
                        <th className="py-3 px-4">Hướng Dẫn Cách Chấm</th>
                        <th className="py-3 px-4 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentRoleTemplate.criteria.map(cr => (
                        <tr key={cr.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{cr.name}</td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              cr.category === 'revenue_business' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              cr.category === 'sla_progress' ? "bg-blue-50 text-blue-700 border border-blue-200" :
                              cr.category === 'specialty' ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                              cr.category === 'discipline_culture' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                              "bg-purple-50 text-purple-700 border border-purple-200"
                            )}>
                              {cr.category === 'revenue_business' ? 'Doanh số' :
                               cr.category === 'sla_progress' ? 'Tiến độ & SLA' :
                               cr.category === 'specialty' ? 'Chuyên môn' :
                               cr.category === 'discipline_culture' ? 'Kỷ luật 5S' : 'Đổi mới'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              value={cr.weight}
                              onChange={e => handleUpdateCriteriaField(cr.id, 'weight', Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center font-bold text-indigo-700"
                            />
                            <span className="ml-1 text-slate-400">%</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="text"
                              value={cr.target}
                              onChange={e => handleUpdateCriteriaField(cr.id, 'target', e.target.value)}
                              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-center font-semibold text-slate-800"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-slate-600">
                            {cr.unit}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {cr.guideline || 'Theo chuẩn quy trình VComm'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteCriteria(cr.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa tiêu chí này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MODE 2: TÙY BIẾN TỪNG NHÂN SỰ VÀ THEO THÁNG */}
            {criteriaViewMode === 'by_employee' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Nhân sự:</span>
                      <select
                        value={selectedEmpForCriteria}
                        onChange={e => setSelectedEmpForCriteria(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg text-xs py-2 px-3 font-bold text-slate-900"
                      >
                        <option value="EMP-001">Nguyễn Văn A (Trưởng nhóm O2O)</option>
                        <option value="EMP-002">Trần Thị B (Chuyên viên CSKH VIP)</option>
                        <option value="EMP-003">Lê Văn C (Quản kho Trung tâm)</option>
                        <option value="EMP-004">Phạm Thị D (Kỹ sư ERP & Cloud)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-700">Tháng áp dụng:</span>
                      <select
                        value={selectedPeriodForCriteria}
                        onChange={e => setSelectedPeriodForCriteria(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg text-xs py-2 px-3 font-black text-indigo-900"
                      >
                        <option value="Tháng 01/2026">Tháng 01/2026</option>
                        <option value="Tháng 02/2026">Tháng 02/2026</option>
                        <option value="Tháng 03/2026">Tháng 03/2026 (Hiện tại)</option>
                        <option value="Tháng 04/2026">Tháng 04/2026 (Kế hoạch)</option>
                      </select>
                    </div>
                  </div>

                  {/* Smart action buttons: Inherit from role & clone from previous */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleInheritFromRole}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                      title="Nạp lại bộ tiêu chí chuẩn của chức danh này"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Kế Thừa Chức Danh
                    </button>
                    <button
                      onClick={handleCloneFromPreviousMonth}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                      title="Sao chép toàn bộ tiêu chí của tháng trước sang tháng này để chỉnh sửa"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Sao Chép Tháng Trước
                    </button>
                    <button
                      onClick={handleSaveCriteriaConfig}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Lưu Cấu Hình Tháng Này
                    </button>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-indigo-900">
                    <span className="font-bold">Đang cấu hình:</span>
                    <span>{currentEmpSetting.employeeName} ({currentEmpSetting.role})</span>
                    <span className="text-slate-400">•</span>
                    <span>Áp dụng: <strong className="text-indigo-950">{selectedPeriodForCriteria}</strong></span>
                    <span className="text-slate-400">•</span>
                    <span className="px-2 py-0.5 rounded bg-white text-[10px] font-mono border border-indigo-200">
                      Nguồn: {currentEmpSetting.source === 'cloned_previous' ? 'Sao chép tháng trước' : currentEmpSetting.source === 'role_template' ? 'Kế thừa chức danh' : 'Tùy biến riêng'}
                    </span>
                  </div>

                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border",
                    isWeightValid ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                  )}>
                    {isWeightValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    Tổng Trọng Số: {totalWeight}% {isWeightValid ? '(Chuẩn 100%)' : '(Cần đúng 100%)'}
                  </span>
                </div>

                {/* Criteria Table for Personalized Employee */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Tên Tiêu Chí Tháng Này</th>
                        <th className="py-3 px-4">Phân Nhóm</th>
                        <th className="py-3 px-4 text-center">Trọng Số (%)</th>
                        <th className="py-3 px-4 text-center">Chỉ Tiêu Tháng Này</th>
                        <th className="py-3 px-4 text-center">Đơn Vị</th>
                        <th className="py-3 px-4">Hướng Dẫn / Mục Tiêu Trọng Tâm</th>
                        <th className="py-3 px-4 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentEmpSetting.criteria.map(cr => (
                        <tr key={cr.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <input
                              type="text"
                              value={cr.name}
                              onChange={e => handleUpdateCriteriaField(cr.id, 'name', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={cr.category}
                              onChange={e => handleUpdateCriteriaField(cr.id, 'category', e.target.value)}
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700"
                            >
                              <option value="revenue_business">Doanh số & Tài chính</option>
                              <option value="sla_progress">Tiến độ & SLA</option>
                              <option value="specialty">Chuyên môn</option>
                              <option value="discipline_culture">Kỷ luật & 5S</option>
                              <option value="innovation">Sáng kiến AI</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              value={cr.weight}
                              onChange={e => handleUpdateCriteriaField(cr.id, 'weight', Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center font-bold text-indigo-700"
                            />
                            <span className="ml-1 text-slate-400">%</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="text"
                              value={cr.target}
                              onChange={e => handleUpdateCriteriaField(cr.id, 'target', e.target.value)}
                              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-center font-semibold text-slate-800"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-slate-600">
                            {cr.unit}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            <input
                              type="text"
                              value={cr.guideline || ''}
                              onChange={e => handleUpdateCriteriaField(cr.id, 'guideline', e.target.value)}
                              placeholder="Ghi chú trọng tâm..."
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-600"
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteCriteria(cr.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa tiêu chí này khỏi tháng"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: CHẤM ĐIỂM & CHI TIẾT ĐÁNH GIÁ KPI HÀNG THÁNG  */}
      {/* ==================================================== */}
      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base">Hồ Sơ Đánh Giá Hiệu Suất 3 Cấp: {selectedEvaluation.employeeName}</h3>
                  {selectedEvaluation.stage === 'STAGE_1_MANAGER' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      Cấp 1: Chờ Quản lý đánh giá
                    </span>
                  ) : selectedEvaluation.stage === 'STAGE_2_HR' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      Cấp 2: Chờ HR thẩm định
                    </span>
                  ) : selectedEvaluation.stage === 'STAGE_3_BOD' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Cấp 3: Chờ Ban Giám đốc duyệt
                    </span>
                  ) : selectedEvaluation.stage === 'FINAL_APPROVED' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      ✅ BGĐ Đã Phê Chuẩn (Đủ đk chuyển Lương)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-400/30">
                      ↩️ Yêu Cầu Rà Soát Lại
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {selectedEvaluation.role} • {selectedEvaluation.department} • Mã NV: <span className="font-mono text-indigo-300">{selectedEvaluation.employeeId}</span> • Kỳ: <strong className="text-white">{selectedEvaluation.month}</strong>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedEvaluation(null);
                  setIsEditingGrading(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Navigation Tabs (3 Cấp) */}
            <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-2">
                {/* Tab 1 */}
                <button
                  onClick={() => setActiveModalTab('manager_step')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border",
                    activeModalTab === 'manager_step'
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                    activeModalTab === 'manager_step' ? "bg-white text-blue-600" : "bg-blue-100 text-blue-700"
                  )}>
                    1
                  </div>
                  <span>Quản Lý Trực Tiếp Đánh Giá</span>
                  {selectedEvaluation.managerReview?.isCompleted && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>

                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                {/* Tab 2 */}
                <button
                  onClick={() => setActiveModalTab('hr_step')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border",
                    activeModalTab === 'hr_step'
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                    activeModalTab === 'hr_step' ? "bg-white text-purple-600" : "bg-purple-100 text-purple-700"
                  )}>
                    2
                  </div>
                  <span>Phòng Nhân Sự Thẩm Định</span>
                  {selectedEvaluation.hrReview?.isCompleted && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>

                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                {/* Tab 3 */}
                <button
                  onClick={() => setActiveModalTab('bod_step')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border",
                    activeModalTab === 'bod_step'
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                    activeModalTab === 'bod_step' ? "bg-white text-amber-600" : "bg-amber-100 text-amber-700"
                  )}>
                    3
                  </div>
                  <span>Ban Giám Đốc Phê Chuẩn</span>
                  {selectedEvaluation.bodReview?.isCompleted && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-semibold hidden md:block">
                Quyền đang xem: <strong className="text-indigo-900">{currentUserRole}</strong>
              </div>
            </div>

            {/* Modal Body with 3 Tabs */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* ========================================================= */}
              {/* TAB 1: QUẢN LÝ TRỰC TIẾP ĐÁNH GIÁ (CHUYÊN MÔN & KPI)      */}
              {/* ========================================================= */}
              {activeModalTab === 'manager_step' && (
                <div className="space-y-5 animate-in fade-in">
                  {/* Banner Role info */}
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-blue-900 text-xs">
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <strong>Cấp 1 - Trách nhiệm Quản lý trực tiếp:</strong> Đánh giá mức độ hoàn thành chỉ tiêu chuyên môn, khối lượng thực tế và tiến độ SLA của nhân viên trong tháng.
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px] shrink-0">
                      {selectedEvaluation.managerReview?.isCompleted ? 'Đã Ký Nộp Vòng 1' : 'Đang Chờ Quản Lý Ký'}
                    </span>
                  </div>

                  {/* Summary Score Banner */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Điểm Chuyên Môn & KPI Tháng ({selectedEvaluation.month})</div>
                      <div className="text-3xl font-black text-blue-950 mt-1">
                        {selectedEvaluation.kpiScore} <span className="text-sm font-normal text-slate-500">/ 100 điểm</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "px-3 py-1 text-white font-black rounded-lg text-xs shadow-xs",
                        selectedEvaluation.grade === 'A' ? "bg-emerald-600" :
                        selectedEvaluation.grade === 'B' ? "bg-blue-600" :
                        selectedEvaluation.grade === 'C' ? "bg-amber-600" : "bg-rose-600"
                      )}>
                        Dự kiến Loại {selectedEvaluation.grade}
                      </span>
                      <div className="text-xs font-bold text-emerald-700 mt-1">
                        Hệ số dự kiến: <strong>{selectedEvaluation.salaryMultiplier}x</strong>
                      </div>
                    </div>
                  </div>

                  {/* Criteria Input Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <span>Bảng Tiêu Chí Chuyên Môn ({selectedEvaluation.criteria.length} tiêu chí)</span>
                      </div>
                      <span className="text-[11px] text-slate-400 italic">
                        Cập nhật kết quả thực tế và chấm điểm (0-100) cho từng tiêu chí
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="p-3">Tiêu chí chuyên môn / SLA</th>
                            <th className="p-3 text-center">Trọng số</th>
                            <th className="p-3 text-center">Chỉ tiêu (Target)</th>
                            <th className="p-3 text-center">Thực tế đạt được</th>
                            <th className="p-3 text-right">Điểm đạt (0-100)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedEvaluation.criteria.map((cr, idx) => (
                            <tr key={cr.id || idx} className="hover:bg-slate-50">
                              <td className="p-3">
                                <div className="font-bold text-slate-900">{cr.name}</div>
                                <div className="text-[10px] text-slate-400">{cr.guideline || 'Đơn vị: ' + cr.unit}</div>
                              </td>
                              <td className="p-3 text-center font-bold text-slate-600">{cr.weight}%</td>
                              <td className="p-3 text-center font-semibold text-slate-700">{cr.target}</td>
                              <td className="p-3 text-center">
                                <input
                                  type="text"
                                  value={cr.actual || ''}
                                  onChange={e => handleUpdateGradingScore(idx, 'actual', e.target.value)}
                                  placeholder="VD: 98%..."
                                  className="w-28 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-semibold text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="p-3 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={cr.score || 0}
                                  onChange={e => handleUpdateGradingScore(idx, 'score', e.target.value)}
                                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-right font-black text-indigo-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <span className="text-[10px] text-slate-400 ml-1">/100</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Manager Notes & Signature */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nhận xét & Đánh giá của Quản lý trực tiếp:
                      </label>
                      <textarea
                        rows={3}
                        value={selectedEvaluation.managerReview?.notes || ''}
                        onChange={e => setSelectedEvaluation({
                          ...selectedEvaluation,
                          managerReview: {
                            ...selectedEvaluation.managerReview,
                            notes: e.target.value
                          }
                        })}
                        placeholder="Nhập nhận xét về nỗ lực, kết quả vượt trội hoặc những điểm cần lưu ý..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Họ tên Quản lý trực tiếp ký số:
                        </label>
                        <input
                          type="text"
                          value={selectedEvaluation.managerReview?.signature || selectedEvaluation.managerReview?.managerName || ''}
                          onChange={e => setSelectedEvaluation({
                            ...selectedEvaluation,
                            managerReview: {
                              ...selectedEvaluation.managerReview,
                              signature: e.target.value,
                              managerName: e.target.value
                            }
                          })}
                          placeholder="Nhập họ tên Quản lý..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span>Ngày ký nộp: <strong>{selectedEvaluation.managerReview?.submittedAt || 'Chưa nộp'}</strong></span>
                        <span>Trạng thái: <strong className="text-blue-700">{selectedEvaluation.managerReview?.isCompleted ? 'Đã hoàn tất Vòng 1' : 'Bản thảo'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Manager Action Bar */}
                  <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-blue-800">
                      Bấm chuyển tiếp để gửi kết quả chuyên môn lên <strong>Phòng Nhân Sự</strong> thẩm định về tuân thủ và chuyên cần.
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={handleSubmitManagerReview}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all shrink-0"
                      >
                        <Send className="w-4 h-4" />
                        Ký Duyệt & Chuyển Phòng Nhân Sự (Cấp 2)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: PHÒNG NHÂN SỰ THẨM ĐỊNH (TUÂN THỦ & CHUYÊN CẦN)    */}
              {/* ========================================================= */}
              {activeModalTab === 'hr_step' && (
                <div className="space-y-5 animate-in fade-in">
                  {/* Banner HR Info */}
                  <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl flex items-center justify-between gap-3 text-purple-900 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-5 h-5 text-purple-600 shrink-0" />
                      <div>
                        <strong>Cấp 2 - Trách nhiệm Phòng Nhân sự (HR):</strong> Đối chiếu dữ liệu chấm công thực tế, văn hóa tổ chức, tuân thủ 5S và kết quả đào tạo LMS nội bộ trước khi trình Ban Giám Đốc.
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px] shrink-0">
                      {selectedEvaluation.hrReview?.isCompleted ? 'HR Đã Thẩm Định' : 'Đang Chờ HR Thẩm Định'}
                    </span>
                  </div>

                  {/* Summary of Manager Review (Vòng 1) */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        Tóm Tắt Đánh Giá Của Quản Lý Trực Tiếp (Vòng 1)
                      </span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Điểm chuyên môn: {selectedEvaluation.kpiScore}/100 • Loại {selectedEvaluation.grade}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 italic">
                      "{selectedEvaluation.managerReview?.notes || 'Quản lý chưa ghi nhận xét cụ thể.'}"
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Quản lý đánh giá: <strong>{selectedEvaluation.managerReview?.signature || selectedEvaluation.managerReview?.managerName}</strong></span>
                      <span>Ngày nộp: <strong>{selectedEvaluation.managerReview?.submittedAt || 'Hôm nay'}</strong></span>
                    </div>
                  </div>

                  {/* HR Appraisal Metrics Form */}
                  <div className="space-y-4">
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Thẩm Định Của Phòng Nhân Sự Về Kỷ Luật & Chuyên Cần
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Metric 1: Compliance */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800">
                            1. Điểm Tuân Thủ Nội Quy & 5S:
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={selectedEvaluation.hrReview?.complianceScore ?? 95}
                              onChange={e => setSelectedEvaluation({
                                ...selectedEvaluation,
                                hrReview: {
                                  ...selectedEvaluation.hrReview,
                                  complianceScore: Number(e.target.value)
                                }
                              })}
                              className="w-16 px-2 py-1 border border-purple-300 rounded text-right font-black text-purple-700 text-sm focus:ring-1 focus:ring-purple-500"
                            />
                            <span className="text-xs text-slate-400 font-bold">/100</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Chấp hành nội quy lao động, quy chế bảo mật thông tin, an toàn phòng cháy và chuẩn 5S văn phòng/kho.
                        </p>
                      </div>

                      {/* Metric 2: Attendance */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800">
                            2. Điểm Chuyên Cần (Chấm Công):
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={selectedEvaluation.hrReview?.attendanceScore ?? 98}
                              onChange={e => setSelectedEvaluation({
                                ...selectedEvaluation,
                                hrReview: {
                                  ...selectedEvaluation.hrReview,
                                  attendanceScore: Number(e.target.value)
                                }
                              })}
                              className="w-16 px-2 py-1 border border-purple-300 rounded text-right font-black text-purple-700 text-sm focus:ring-1 focus:ring-purple-500"
                            />
                            <span className="text-xs text-slate-400 font-bold">/100</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Đối soát dữ liệu máy chấm công vân tay/FaceID: Số ngày công thực tế, đi muộn, về sớm, nghỉ phép đúng quy định.
                        </p>
                      </div>
                    </div>

                    {/* Attendance Details & LMS Checklist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tóm tắt đối soát dữ liệu chấm công:
                        </label>
                        <input
                          type="text"
                          value={selectedEvaluation.hrReview?.attendanceSummary || ''}
                          onChange={e => setSelectedEvaluation({
                            ...selectedEvaluation,
                            hrReview: {
                              ...selectedEvaluation.hrReview,
                              attendanceSummary: e.target.value
                            }
                          })}
                          placeholder="VD: 26/26 ngày công chuẩn, 0 lần đi muộn..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Khóa đào tạo bắt buộc LMS nội bộ:
                        </label>
                        <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <input
                            type="checkbox"
                            id="lmsCompletedCheck"
                            checked={selectedEvaluation.hrReview?.lmsTrainingCompleted ?? true}
                            onChange={e => setSelectedEvaluation({
                              ...selectedEvaluation,
                              hrReview: {
                                ...selectedEvaluation.hrReview,
                                lmsTrainingCompleted: e.target.checked
                              }
                            })}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="lmsCompletedCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                            Đã hoàn thành 100% chuyên đề đào tạo LMS bắt buộc của tháng
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* HR Notes & Signature */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nhận xét thẩm định của Chuyên viên Phòng Nhân sự:
                        </label>
                        <textarea
                          rows={3}
                          value={selectedEvaluation.hrReview?.notes || ''}
                          onChange={e => setSelectedEvaluation({
                            ...selectedEvaluation,
                            hrReview: {
                              ...selectedEvaluation.hrReview,
                              notes: e.target.value
                            }
                          })}
                          placeholder="Ghi nhận về kỷ luật, ý thức chấp hành và các thành tích văn hóa tổ chức..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Cán bộ Nhân sự (HR BP) ký tên:
                          </label>
                          <input
                            type="text"
                            value={selectedEvaluation.hrReview?.signature || selectedEvaluation.hrReview?.hrSpecialistName || ''}
                            onChange={e => setSelectedEvaluation({
                              ...selectedEvaluation,
                              hrReview: {
                                ...selectedEvaluation.hrReview,
                                signature: e.target.value,
                                hrSpecialistName: e.target.value
                              }
                            })}
                            placeholder="Nhập họ tên cán bộ HR..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span>Ngày thẩm định: <strong>{selectedEvaluation.hrReview?.reviewedAt || 'Chưa hoàn tất'}</strong></span>
                          <span>Kết quả: <strong className="text-purple-700">{selectedEvaluation.hrReview?.isPassed ? 'Đạt chuẩn HR' : 'Cần rà soát'}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HR Action Bar */}
                  <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-purple-800">
                      Nếu dữ liệu tuân thủ & chuyên cần hợp lệ, chuyển hồ sơ lên <strong>Ban Giám Đốc</strong> phê duyệt cuối cùng. Nếu có sai lệch, có quyền trả về Quản lý trực tiếp.
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => {
                          const reason = prompt('Nhập lý do Phòng Nhân sự trả về yêu cầu Quản lý rà soát lại:');
                          if (reason !== null) {
                            handleSubmitHrReview(false, reason);
                          }
                        }}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                        Trả Về Quản Lý
                      </button>
                      <button
                        onClick={() => handleSubmitHrReview(true)}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all shrink-0"
                      >
                        <Send className="w-4 h-4" />
                        Thẩm Định Đạt & Chuyển Ban Giám Đốc (Cấp 3)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: BAN GIÁM ĐỐC PHÊ CHUẨN CUỐI CÙNG (BOD APPROVAL)   */}
              {/* ========================================================= */}
              {activeModalTab === 'bod_step' && (
                <div className="space-y-5 animate-in fade-in">
                  {/* Banner BOD Info */}
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-amber-900 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Award className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <strong>Cấp 3 - Thẩm quyền Ban Giám Đốc (BOD):</strong> Xem xét tổng hợp đối chiếu từ Quản lý trực tiếp và Phòng Nhân sự; quyết định Xếp loại thi đua và Hệ số Lương hiệu suất chính thức.
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] shrink-0">
                      {selectedEvaluation.stage === 'FINAL_APPROVED' ? 'BGĐ Đã Phê Chuẩn Chính Thức' : 'Chờ Phê Chuẩn Cuối'}
                    </span>
                  </div>

                  {/* Comparative Summary 2 Rounds */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Col 1: Manager Review */}
                    <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1.5">
                      <div className="text-[11px] font-bold text-blue-700 uppercase flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        1. Quản lý trực tiếp
                      </div>
                      <div className="text-xl font-black text-blue-950">
                        {selectedEvaluation.kpiScore} / 100
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Đề xuất: <strong>Loại {selectedEvaluation.grade}</strong> ({selectedEvaluation.salaryMultiplier}x)
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Ký bởi: {selectedEvaluation.managerReview?.signature || selectedEvaluation.managerReview?.managerName}
                      </div>
                    </div>

                    {/* Col 2: HR Review */}
                    <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1.5">
                      <div className="text-[11px] font-bold text-purple-700 uppercase flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        2. Phòng Nhân sự
                      </div>
                      <div className="text-xl font-black text-purple-950">
                        Tuân thủ: {selectedEvaluation.hrReview?.complianceScore ?? 95}đ
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Chuyên cần: <strong>{selectedEvaluation.hrReview?.attendanceScore ?? 98}đ</strong> • LMS: {selectedEvaluation.hrReview?.lmsTrainingCompleted ? 'Đạt' : 'Chưa đạt'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Ký bởi: {selectedEvaluation.hrReview?.signature || selectedEvaluation.hrReview?.hrSpecialistName}
                      </div>
                    </div>

                    {/* Col 3: Final Eligibility */}
                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                      <div className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        3. Điều kiện đồng bộ Lương
                      </div>
                      <div className="text-xl font-black text-emerald-950">
                        {selectedEvaluation.stage === 'FINAL_APPROVED' ? 'ĐỦ ĐIỀU KIỆN' : 'CHỜ KÝ DUYỆT'}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Chỉ các phiếu đã có phê chuẩn của BGĐ mới được chuyển sang Bảng Lương.
                      </div>
                    </div>
                  </div>

                  {/* BOD Executive Decisions Form */}
                  <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Quyết Định Phê Chuẩn Của Ban Giám Đốc
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Xếp loại thi đua chính thức:
                        </label>
                        <select
                          value={selectedEvaluation.bodReview?.finalGrade || selectedEvaluation.grade}
                          onChange={e => {
                            const newG = e.target.value as 'A' | 'B' | 'C' | 'D';
                            const newM = newG === 'A' ? 1.2 : newG === 'B' ? 1.0 : newG === 'C' ? 0.8 : 0.5;
                            setSelectedEvaluation({
                              ...selectedEvaluation,
                              grade: newG,
                              salaryMultiplier: newM,
                              bodReview: {
                                ...selectedEvaluation.bodReview,
                                finalGrade: newG,
                                finalMultiplier: newM
                              }
                            });
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-indigo-950 bg-slate-50 focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="A">Loại A - Xuất sắc (Chuẩn 1.2x Lương HQ)</option>
                          <option value="B">Loại B - Hoàn thành tốt (Chuẩn 1.0x Lương HQ)</option>
                          <option value="C">Loại C - Cần cải thiện (Chuẩn 0.8x Lương HQ)</option>
                          <option value="D">Loại D - Không đạt (Chuẩn 0.5x Lương HQ)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Hệ số lương hiệu suất áp dụng (/payroll):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="3"
                            value={selectedEvaluation.bodReview?.finalMultiplier || selectedEvaluation.salaryMultiplier}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setSelectedEvaluation({
                                ...selectedEvaluation,
                                salaryMultiplier: val,
                                bodReview: {
                                  ...selectedEvaluation.bodReview,
                                  finalMultiplier: val
                                }
                              });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-emerald-800 bg-slate-50"
                          />
                          <span className="text-xs font-bold text-slate-500">hệ số</span>
                        </div>
                      </div>
                    </div>

                    {/* Executive Notes */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ý kiến chỉ đạo & Ghi chú từ Ban Giám Đốc:
                      </label>
                      <textarea
                        rows={2}
                        value={selectedEvaluation.bodReview?.executiveNotes || ''}
                        onChange={e => setSelectedEvaluation({
                          ...selectedEvaluation,
                          bodReview: {
                            ...selectedEvaluation.bodReview,
                            executiveNotes: e.target.value
                          }
                        })}
                        placeholder="Nhập ý kiến chỉ đạo, định hướng công việc hoặc lý do điều chỉnh..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Signature */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Đại diện Ban Giám Đốc ký số phê chuẩn:
                        </label>
                        <input
                          type="text"
                          value={selectedEvaluation.bodReview?.signature || selectedEvaluation.bodReview?.bodApproverName || 'Trần Ban Giám Đốc (CEO)'}
                          onChange={e => setSelectedEvaluation({
                            ...selectedEvaluation,
                            approvedBy: e.target.value,
                            bodReview: {
                              ...selectedEvaluation.bodReview,
                              signature: e.target.value,
                              bodApproverName: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span>Ngày phê chuẩn: <strong>{selectedEvaluation.bodReview?.approvedAt || 'Hôm nay'}</strong></span>
                        <span>Hiệu lực: <strong className="text-emerald-700">Chính thức toàn công ty</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* BOD Action Bar */}
                  <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-amber-900">
                      Sau khi Ban Giám Đốc phê chuẩn chính thức, phiếu sẽ chuyển sang trạng thái <strong>FINAL_APPROVED</strong> và sẵn sàng đồng bộ sang Bảng Lương.
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleSubmitBodApproval('RETURNED')}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                        Yêu Cầu Rà Soát Lại
                      </button>
                      <button
                        onClick={() => handleSubmitBodApproval('APPROVED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Ban Giám Đốc Phê Chuẩn Chính Thức
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedEvaluation(null);
                  setIsEditingGrading(false);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEvaluation}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Lưu Tiến Trình Đánh Giá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: IN BIÊN BẢN / QUYẾT ĐỊNH ĐÁNH GIÁ 1 NĂM A4    */}
      {/* ==================================================== */}
      {showPrintAnnualModal && selectedAnnualEval && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Action Bar */}
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="text-xs font-bold flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-400" />
                Xem Trước & In Quyết Định Đánh Giá Toàn Niên {selectedAnnualEval.year} (Khổ A4)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In Văn Bản
                </button>
                <button
                  onClick={() => setShowPrintAnnualModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Paper Printable Content */}
            <div className="p-8 overflow-y-auto bg-white text-slate-900 space-y-6 font-serif print:p-0">
              {/* Header Quốc hiệu Tiêu ngữ */}
              <div className="text-center space-y-1 border-b border-slate-300 pb-4">
                <div className="font-bold text-xs uppercase tracking-widest text-slate-700">CÔNG TY CỔ PHẦN CÔNG NGHỆ & SÀN TMĐT VCOMM VIỆT NAM</div>
                <div className="font-black text-sm uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="text-xs italic underline">Độc lập - Tự do - Hạnh phúc</div>
                <div className="text-[11px] text-slate-500 pt-2">Hà Nội, ngày 18 tháng 09 năm 2026</div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
                  QUYẾT ĐỊNH TỔNG KẾT HIỆU SUẤT & KHEN THƯỞNG TOÀN NIÊN
                </h2>
                <div className="text-xs font-sans font-bold text-indigo-900">
                  Kỳ Đánh Giá: {selectedAnnualEval.year} • Mã văn bản: QD-VCOMM-ANN/{selectedAnnualEval.employeeId}
                </div>
              </div>

              {/* Content Body */}
              <div className="space-y-4 text-xs font-sans leading-relaxed text-slate-800">
                <p>Căn cứ Quy chế Đánh giá Hiệu suất và Khen thưởng Cán bộ Nhân viên Tập đoàn VComm Enterprise;</p>
                <p>Xét kết quả tổng kết điểm thi đua 12 tháng, kết quả khảo thí Năng lực 360 độ và mức độ hoàn thành Mục tiêu Chiến lược OKR năm {selectedAnnualEval.year};</p>

                {/* Info Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Họ và tên nhân sự: <strong>{selectedAnnualEval.employeeName}</strong></div>
                    <div>Mã số nhân viên: <strong className="font-mono">{selectedAnnualEval.employeeId}</strong></div>
                    <div>Phòng ban công tác: <strong>{selectedAnnualEval.department}</strong></div>
                    <div>Chức danh hiện tại: <strong>{selectedAnnualEval.role}</strong></div>
                  </div>
                </div>

                {/* Score Breakdown Table */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                      <tr>
                        <th className="p-2.5">Trụ cột đánh giá</th>
                        <th className="p-2.5 text-center">Trọng số</th>
                        <th className="p-2.5 text-center">Điểm số</th>
                        <th className="p-2.5 text-right">Điểm quy đổi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 font-medium">1. Điểm trung bình KPI 12 tháng</td>
                        <td className="p-2.5 text-center">60%</td>
                        <td className="p-2.5 text-center font-bold">{selectedAnnualEval.avgMonthlyKpiScore} / 100</td>
                        <td className="p-2.5 text-right font-bold">{(selectedAnnualEval.avgMonthlyKpiScore * 0.6).toFixed(1)}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium">2. Khảo thí Năng lực Đa chiều 360° (H1 + H2)</td>
                        <td className="p-2.5 text-center">25%</td>
                        <td className="p-2.5 text-center font-bold">{selectedAnnualEval.competencyScore} / 100</td>
                        <td className="p-2.5 text-right font-bold">{(selectedAnnualEval.competencyScore * 0.25).toFixed(1)}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium">3. Mức độ hoàn thành OKR Chiến lược năm</td>
                        <td className="p-2.5 text-center">15%</td>
                        <td className="p-2.5 text-center font-bold">{selectedAnnualEval.okrScore}%</td>
                        <td className="p-2.5 text-right font-bold">{(selectedAnnualEval.okrScore * 0.15).toFixed(1)}</td>
                      </tr>
                      <tr className="bg-slate-50 font-black text-indigo-950">
                        <td className="p-2.5" colSpan={3}>TỔNG ĐIỂM TỔNG KẾT TOÀN NIÊN & XẾP LOẠI THI ĐUA</td>
                        <td className="p-2.5 text-right text-sm">{selectedAnnualEval.finalAnnualScore} (Loại {selectedAnnualEval.annualGrade})</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Decision Box */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2">
                  <div className="font-bold text-emerald-900 uppercase text-[11px]">QUYẾT ĐỊNH KHEN THƯỞNG & ĐÃI NGỘ:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Thưởng Tết / Thưởng Năm: <strong>{selectedAnnualEval.bonusMonths} Tháng Lương</strong></div>
                    <div>Số tiền thưởng thực nhận: <strong className="text-emerald-800 font-mono font-black">{selectedAnnualEval.bonusAmountEstimated.toLocaleString('vi-VN')} VNĐ</strong></div>
                  </div>
                  {selectedAnnualEval.promotionTitle && (
                    <div className="pt-2 border-t border-emerald-200 text-indigo-900 font-bold">
                      Quyết định Bổ nhiệm chức vụ mới: {selectedAnnualEval.promotionTitle}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-600">
                    Kế hoạch phát triển cá nhân (IDP): {selectedAnnualEval.idpNextYear}
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center pt-8 text-xs font-sans">
                <div className="space-y-16">
                  <div className="font-bold uppercase">CÁN BỘ ĐƯỢC ĐÁNH GIÁ</div>
                  <div className="font-bold text-slate-800">{selectedAnnualEval.employeeName}</div>
                </div>
                <div className="space-y-16">
                  <div className="font-bold uppercase">TỔNG GIÁM ĐỐC ĐIỀU HÀNH VCOMM</div>
                  <div className="font-bold text-slate-800">Trần Ban Giám Đốc (Đã ký)</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowPrintAnnualModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: THƯ VIỆN TIÊU CHÍ CHUẨN VCOMM                */}
      {/* ==================================================== */}
      {showCriteriaLibraryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Thư Viện Tiêu Chí Hiệu Suất Chuẩn VComm</h3>
                <div className="text-xs text-purple-200">Chọn nhanh tiêu chí chuẩn hóa để bổ sung vào cấu hình</div>
              </div>
              <button onClick={() => setShowCriteriaLibraryModal(false)} className="p-1 text-purple-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {STANDARD_CRITERIA_LIBRARY.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 rounded-xl flex items-center justify-between gap-4 transition-all group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{item.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-purple-700">
                        {item.categoryName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.description}</p>
                    <div className="text-[10px] text-slate-400">
                      Chỉ tiêu mặc định: <strong>{item.defaultTarget}</strong> ({item.unit}) • Trọng số gợi ý: <strong>{item.defaultWeight}%</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddCriteriaFromLibrary(item)}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm Vào
                  </button>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowCriteriaLibraryModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: THÊM TIÊU CHÍ MỚI THỦ CÔNG                    */}
      {/* ==================================================== */}
      {showAddCriteriaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Thêm Tiêu Chí Đánh Giá Mới</h3>
              <button onClick={() => setShowAddCriteriaModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên tiêu chí (*):</label>
                <input
                  type="text"
                  value={newCriteriaDraft.name}
                  onChange={e => setNewCriteriaDraft({ ...newCriteriaDraft, name: e.target.value })}
                  placeholder="Ví dụ: Tỷ lệ hoàn tất đơn hàng O2O..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phân nhóm tiêu chí:</label>
                <select
                  value={newCriteriaDraft.category}
                  onChange={e => setNewCriteriaDraft({ ...newCriteriaDraft, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="revenue_business">Doanh Số & Tài Chính</option>
                  <option value="sla_progress">Tiến Độ & SLA Vận Hành</option>
                  <option value="specialty">Chuyên Môn & Nghiệp Vụ</option>
                  <option value="discipline_culture">Kỷ Luật, 5S & Văn Hóa Tổ Chức</option>
                  <option value="innovation">Sáng Kiến & Tự Động Hóa AI</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trọng số (%):</label>
                  <input
                    type="number"
                    value={newCriteriaDraft.weight}
                    onChange={e => setNewCriteriaDraft({ ...newCriteriaDraft, weight: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn vị đo:</label>
                  <input
                    type="text"
                    value={newCriteriaDraft.unit}
                    onChange={e => setNewCriteriaDraft({ ...newCriteriaDraft, unit: e.target.value })}
                    placeholder="%, VNĐ, Giờ..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chỉ tiêu mục tiêu (Target) (*):</label>
                <input
                  type="text"
                  value={newCriteriaDraft.target}
                  onChange={e => setNewCriteriaDraft({ ...newCriteriaDraft, target: e.target.value })}
                  placeholder="Ví dụ: 96% hoặc 2.5 Tỷ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hướng dẫn cách chấm / Ghi chú:</label>
                <textarea
                  value={newCriteriaDraft.guideline}
                  onChange={e => setNewCriteriaDraft({ ...newCriteriaDraft, guideline: e.target.value })}
                  placeholder="Mô tả cách lấy số liệu đối soát..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[11px]"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowAddCriteriaModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNewCriteriaDraft}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold"
              >
                Xác Nhận Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chọn Nhân Sự từ Danh Sách CBNV HRM */}
      <HrmStaffOrRequestPickerModal
        isOpen={showStaffPicker}
        onClose={() => setShowStaffPicker(false)}
        onSelectEmployee={handleStaffSelectedForKPI}
        title="Chọn Cán Bộ Nhân Viên Để Thiết Lập & Đánh Giá KPI"
        subtitle="Dữ liệu đồng bộ trực tiếp từ danh mục CBNV HRM — Nghiêm cấm tự nhập thủ công"
        allowRequests={false}
      />
    </div>
  );
}
