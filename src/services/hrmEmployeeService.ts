// Service cung cấp dữ liệu Cán bộ Nhân viên (CBNV) và Đơn yêu cầu cá nhân từ HRM
// Ngăn chặn hoàn toàn việc nhập tay tự do trong các phân hệ Chữ ký số, IT, Tài sản...

export interface HrmEmployee {
  id: string; // Mã nhân viên (EMP-xxx)
  name: string; // Họ và tên
  avatar?: string;
  department: string; // Phòng ban
  position: string; // Chức vụ
  title: string; // Chức danh nghề nghiệp
  email: string; // Email công vụ
  phone?: string; // Số điện thoại
  branch?: string; // Chi nhánh làm việc
  identityNum?: string; // CCCD
  status?: 'active' | 'probation' | 'leave';
}

export interface HrmPersonalRequest {
  id: string; // Mã đơn REQ-xxx
  requesterName: string;
  requesterCode: string;
  requesterEmail: string;
  department: string;
  title: string;
  category: 'it_support' | 'signature' | 'equipment' | 'admin' | 'finance' | 'hr';
  categoryLabel: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress';
  date: string;
  description: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
}

export const DEFAULT_HRM_EMPLOYEES: HrmEmployee[] = [
  {
    id: 'EMP-001',
    name: 'Nguyễn Văn An',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    position: 'Tổng Giám Đốc (CEO)',
    title: 'Tổng Giám Đốc Điều Hành',
    department: 'Ban Giám Đốc',
    branch: 'Trụ sở Hà Nội',
    email: 'an.nguyen@vcomm.vn',
    phone: '0912.345.678',
    status: 'active'
  },
  {
    id: 'EMP-002',
    name: 'Trần Thị Mai Lan',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    position: 'Giám Đốc Vận Hành (COO)',
    title: 'Giám Đốc Vận Hành Toàn Quốc',
    department: 'Ban Giám Đốc',
    branch: 'Trụ sở Hà Nội',
    email: 'lan.tran@vcomm.vn',
    phone: '0983.456.789',
    status: 'active'
  },
  {
    id: 'EMP-003',
    name: 'Lê Hoàng Minh',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    position: 'Trưởng Phòng R&D',
    title: 'Kỹ sư Trưởng / Kiến trúc sư Hệ thống',
    department: 'Công Nghệ & Kỹ Thuật (R&D)',
    branch: 'Trụ sở Hà Nội',
    email: 'minh.le@vcomm.vn',
    phone: '0904.567.890',
    status: 'active'
  },
  {
    id: 'EMP-004',
    name: 'Phạm Quỳnh Nga',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    position: 'Kế Toán Trưởng (CPA)',
    title: 'Kế Toán Trưởng & Giám Đốc Tài Chính',
    department: 'Tài chính - Kế toán',
    branch: 'Trụ sở Hà Nội',
    email: 'nga.pham@vcomm.vn',
    phone: '0978.901.234',
    status: 'active'
  },
  {
    id: 'EMP-005',
    name: 'Vũ Đức Thịnh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    position: 'Giám Đốc Kho Vận Miền Nam',
    title: 'Quản lý Tổng Kho Trung Tâm',
    department: 'Kho vận & Vận hành',
    branch: 'Chi nhánh TP. Hồ Chí Minh',
    email: 'thinh.vu@vcomm.vn',
    phone: '0936.789.123',
    status: 'active'
  },
  {
    id: 'EMP-2061',
    name: 'Nguyễn Thị Kim Anh',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    position: 'Trưởng nhóm CSKH',
    title: 'Trưởng nhóm Chăm Sóc Khách Hàng',
    department: 'Chăm sóc Khách hàng',
    branch: 'Trụ sở Hà Nội',
    email: 'anh.ntk@vcomm.vn',
    phone: '0912.345.678',
    status: 'active'
  },
  {
    id: 'EMP-2062',
    name: 'Phạm Minh Hoàng',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
    position: 'Chuyên viên Vận hành',
    title: 'Chuyên viên Cấp cao Vận hành Sàn',
    department: 'Kinh doanh & Bán lẻ',
    branch: 'Trụ sở Hà Nội',
    email: 'hoang.pm@vcomm.vn',
    phone: '0908.765.432',
    status: 'active'
  },
  {
    id: 'EMP-2067',
    name: 'Đặng Thu Thảo',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    position: 'Trưởng phòng Tuyển dụng',
    title: 'Trưởng phòng Quản trị Nhân sự & Đào tạo',
    department: 'Quản trị Nhân sự',
    branch: 'Trụ sở Hà Nội',
    email: 'thao.dt@vcomm.vn',
    phone: '0915.223.344',
    status: 'active'
  },
  {
    id: 'EMP-2068',
    name: 'Hoàng Văn Thái',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    position: 'Trưởng nhóm Bán hàng O2O',
    title: 'Trưởng nhóm Phát triển Thị trường O2O',
    department: 'Kinh doanh & Bán lẻ',
    branch: 'Trụ sở Hà Nội',
    email: 'thai.hv@vcomm.vn',
    phone: '0945.678.901',
    status: 'active'
  },
  {
    id: 'EMP-IT-01',
    name: 'Đinh Bá Tùng',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    position: 'Kỹ sư IT Helpdesk',
    title: 'Chuyên viên Hỗ trợ Hạ tầng & Thiết bị CNTT',
    department: 'Công Nghệ & Kỹ Thuật (R&D)',
    branch: 'Trụ sở Hà Nội',
    email: 'tung.db@vcomm.vn',
    phone: '0968.112.233',
    status: 'active'
  },
  {
    id: 'EMP-IT-02',
    name: 'Trần Quốc Toản',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    position: 'Kỹ sư An ninh Mạng',
    title: 'Chuyên gia Mật mã học & Cloud HSM',
    department: 'Công Nghệ & Kỹ Thuật (R&D)',
    branch: 'Trụ sở Hà Nội',
    email: 'toan.tq@vcomm.vn',
    phone: '0977.889.900',
    status: 'active'
  }
];

export const DEFAULT_HRM_REQUESTS: HrmPersonalRequest[] = [
  {
    id: 'REQ-010',
    requesterCode: 'EMP-2068',
    requesterName: 'Hoàng Văn Thái',
    requesterEmail: 'thai.hv@vcomm.vn',
    department: 'Kinh doanh & Bán lẻ',
    title: 'Đề nghị cấp chứng thư số cá nhân ký số hợp đồng bán lẻ',
    category: 'signature',
    categoryLabel: 'Chữ ký số & Chứng thư',
    status: 'approved',
    date: '17/09/2026',
    description: 'Cần cấp chứng thư số cá nhân chuẩn RSA 2048 để ký hợp đồng đại lý và biên bản bàn giao O2O hạn mức 50 triệu VNĐ.',
    priority: 'P2'
  },
  {
    id: 'REQ-011',
    requesterCode: 'EMP-004',
    requesterName: 'Phạm Quỳnh Nga',
    requesterEmail: 'nga.pham@vcomm.vn',
    department: 'Tài chính - Kế toán',
    title: 'Đề nghị gia hạn chứng thư số ký lệnh chi ngân hàng & thuế',
    category: 'signature',
    categoryLabel: 'Chữ ký số & Chứng thư',
    status: 'approved',
    date: '16/09/2026',
    description: 'Chứng thư số kế toán trưởng sắp hết hạn, đề nghị cấp mới chuẩn SmartCA Cloud thời hạn 3 năm, hạn mức không giới hạn.',
    priority: 'P1'
  },
  {
    id: 'REQ-012',
    requesterCode: 'EMP-005',
    requesterName: 'Vũ Đức Thịnh',
    requesterEmail: 'thinh.vu@vcomm.vn',
    department: 'Kho vận & Vận hành',
    title: 'Máy in tem vận đơn kho tổng HCM bị mất kết nối mạng LAN',
    category: 'it_support',
    categoryLabel: 'Sự cố thiết bị IT',
    status: 'pending',
    date: '18/09/2026',
    description: 'Máy in Xprinter XP-420B tại chuyền đóng gói số 2 không nhận lệnh in từ hệ thống WMS ERP từ sáng nay.',
    priority: 'P2'
  },
  {
    id: 'REQ-013',
    requesterCode: 'EMP-2061',
    requesterName: 'Nguyễn Thị Kim Anh',
    requesterEmail: 'anh.ntk@vcomm.vn',
    department: 'Chăm sóc Khách hàng',
    title: 'Cấp tai nghe Call Center chống ồn và cấu hình Softphone VoIP',
    category: 'it_support',
    categoryLabel: 'Yêu cầu CNTT',
    status: 'pending',
    date: '18/09/2026',
    description: 'Nhân sự mới bổ sung ca trực CSKH cần cấp phát tai nghe Jabra và kích hoạt extension VoIP #108 trên ERP.',
    priority: 'P3'
  },
  {
    id: 'REQ-014',
    requesterCode: 'EMP-2067',
    requesterName: 'Đặng Thu Thảo',
    requesterEmail: 'thao.dt@vcomm.vn',
    department: 'Quản trị Nhân sự',
    title: 'Đề xuất trang bị máy tính trạm xử lý đồ họa tuyển dụng',
    category: 'equipment',
    categoryLabel: 'Mua sắm thiết bị',
    status: 'approved',
    date: '15/09/2026',
    description: 'Trang bị 01 PC cấu hình cao cho chuyên viên sản xuất hình ảnh Employer Branding.',
    priority: 'P3'
  },
  {
    id: 'REQ-015',
    requesterCode: 'EMP-2062',
    requesterName: 'Phạm Minh Hoàng',
    requesterEmail: 'hoang.pm@vcomm.vn',
    department: 'Kinh doanh & Bán lẻ',
    title: 'Hệ thống ERP tối ưu phân bổ tồn kho sàn VComm',
    category: 'it_support',
    categoryLabel: 'Lỗi phần mềm ERP',
    status: 'in_progress',
    date: '18/09/2026',
    description: 'Tối ưu độ trễ ghi nhận đơn hàng thời gian thực từ sàn TMĐT VComm.',
    priority: 'P2'
  }
];

export const hrmEmployeeService = {
  /**
   * Lấy toàn bộ danh sách Cán bộ Nhân viên chính thức (CBNV)
   */
  getHrmEmployeeList(): HrmEmployee[] {
    try {
      const stored = localStorage.getItem('vcomm_hr_employees');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge stored employees with defaults (deduplicate by id)
          const mergedMap = new Map<string, HrmEmployee>();
          
          DEFAULT_HRM_EMPLOYEES.forEach(emp => mergedMap.set(emp.id, emp));
          
          parsed.forEach((p: any) => {
            if (p.id && p.name) {
              mergedMap.set(p.id, {
                id: p.id,
                name: p.name,
                avatar: p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=6366f1&color=fff`,
                department: p.department || 'Văn phòng VComm',
                position: p.position || 'Chuyên viên',
                title: p.title || p.position || 'Cán bộ Nhân viên',
                email: p.workEmail || p.email || `${p.id.toLowerCase()}@vcomm.vn`,
                phone: p.phone || '0900.000.000',
                branch: p.branch || 'Trụ sở Hà Nội',
                identityNum: p.identityNum,
                status: 'active'
              });
            }
          });
          
          return Array.from(mergedMap.values());
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc vcomm_hr_employees từ localStorage, dùng danh sách mặc định:', e);
    }
    return DEFAULT_HRM_EMPLOYEES;
  },

  /**
   * Alias cho getHrmEmployeeList để đảm bảo tương thích mọi component (AssetManagement, HRM...)
   */
  getAllEmployees(): HrmEmployee[] {
    return this.getHrmEmployeeList();
  },

  /**
   * Lấy danh sách đơn yêu cầu cá nhân trong HRM
   */
  getHrmPersonalRequests(categoryFilter?: 'it_support' | 'signature' | 'all'): HrmPersonalRequest[] {
    try {
      const storedReqs = localStorage.getItem('vcomm_hrm_requests');
      let allReqs = DEFAULT_HRM_REQUESTS;
      if (storedReqs) {
        const parsed = JSON.parse(storedReqs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          allReqs = [...parsed, ...DEFAULT_HRM_REQUESTS];
        }
      }

      if (!categoryFilter || categoryFilter === 'all') {
        return allReqs;
      }

      if (categoryFilter === 'signature') {
        return allReqs.filter(r => r.category === 'signature');
      }

      if (categoryFilter === 'it_support') {
        return allReqs.filter(r => r.category === 'it_support' || r.category === 'equipment');
      }

      return allReqs;
    } catch (e) {
      return DEFAULT_HRM_REQUESTS;
    }
  },

  /**
   * Lấy thông tin CBNV của người dùng hiện tại đang đăng nhập
   */
  getCurrentLoggedInStaff(): HrmEmployee {
    try {
      const authSession = localStorage.getItem('vcomm_auth_session');
      if (authSession) {
        const parsed = JSON.parse(authSession);
        const name = parsed?.staffInfo?.name || parsed?.user?.displayName || 'Lê Hoàng Minh';
        const email = parsed?.user?.email || 'minh.le@vcomm.vn';
        const role = parsed?.staffInfo?.role || 'Trưởng Phòng R&D';
        
        // Find in default list if matched
        const matched = DEFAULT_HRM_EMPLOYEES.find(e => e.email.toLowerCase() === email.toLowerCase() || e.name === name);
        if (matched) return matched;

        return {
          id: 'EMP-003',
          name: name,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          position: role,
          title: role,
          department: 'Công Nghệ & Kỹ Thuật (R&D)',
          branch: 'Trụ sở Hà Nội',
          email: email,
          phone: '0904.567.890',
          status: 'active'
        };
      }
    } catch (e) {
      // Ignored
    }

    // Default current staff
    return DEFAULT_HRM_EMPLOYEES[2]; // Lê Hoàng Minh
  }
};
