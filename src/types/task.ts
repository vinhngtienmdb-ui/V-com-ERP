import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  User, 
  Users, 
  Building2, 
  Crown 
} from 'lucide-react';

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  position: string;
  department: string;
  email: string;
}

export interface TaskComment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  date: string;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  desc?: string;
  scope: 'individual' | 'team' | 'department' | 'company'; // Cá nhân, Đội nhóm, Phòng ban, Công ty
  department: string; // Ban Lãnh đạo, Phòng Công nghệ, Phòng CSKH, Phòng Nhân sự, Phòng Marketing...
  priority: 'low' | 'medium' | 'high' | 'urgent'; // Thấp, Trung bình, Cao, Gấp
  status: 'todo' | 'in_progress' | 'testing' | 'done'; // Cần làm, Đang làm, Đang test, Đã xong
  progress: number; // 0 - 100
  labels: string[]; // các nhãn công việc
  assignee: Member;
  date: string; // Hạn chót (YYYY-MM-DD)
  createdAt: string;
  creator: string;
  subtasks: SubTask[];
  comments: TaskComment[];
}

export const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: 'Nguyễn Văn Thắng', initials: 'NT', position: 'Tổng Giám đốc', department: 'Ban Lãnh đạo', email: 'thang.nv@eoffice.com' },
  { id: 'm2', name: 'Trần Thị Hồng', initials: 'TH', position: 'Trưởng phòng Nhân sự', department: 'Phòng Nhân sự', email: 'hong.tt@eoffice.com' },
  { id: 'm3', name: 'Lê Hoàng Nam', initials: 'LN', position: 'Trưởng phòng Công nghệ', department: 'Phòng Công nghệ', email: 'nam.lh@eoffice.com' },
  { id: 'm4', name: 'Phạm Quỳnh Anh', initials: 'QA', position: 'Quản lý CSKH', department: 'Phòng CSKH', email: 'anh.pq@eoffice.com' },
  { id: 'm5', name: 'Đỗ Minh Quân', initials: 'MQ', position: 'Kỹ sư Phần mềm', department: 'Phòng Công nghệ', email: 'quan.dm@eoffice.com' },
  { id: 'm6', name: 'Trịnh Thu Thảo', initials: 'TT', position: 'Chuyên viên UI/UX', department: 'Phòng Công nghệ', email: 'thao.tt@eoffice.com' },
  { id: 'm7', name: 'Phan Văn Đức', initials: 'VĐ', position: 'Chuyên viên Marketing', department: 'Phòng Marketing', email: 'duc.pv@eoffice.com' },
  { id: 'm8', name: 'Nguyễn Bích Thủy', initials: 'BT', position: 'Chuyên viên CSKH', department: 'Phòng CSKH', email: 'thuy.nb@eoffice.com' },
];

export const DEFAULT_TASKS: Task[] = [
  {
    id: 'TKS-001',
    title: 'Nâng cấp bảo mật máy chủ dữ liệu ERP cơ quan',
    desc: 'Tiến hành vá lỗ hổng rò rỉ phiên làm việc trên cổng giao dịch nội bộ và triển khai xác thực 2 lớp (2FA) bắt buộc cho tất cả tài khoản quản trị.',
    scope: 'company',
    department: 'Phòng Công nghệ',
    priority: 'urgent',
    status: 'in_progress',
    progress: 75,
    labels: ['Hệ thống', 'Bảo mật', 'eOffice'],
    assignee: MOCK_MEMBERS[2], // Lê Hoàng Nam
    date: '2026-06-15',
    createdAt: '2026-05-28',
    creator: 'Nguyễn Văn Thắng',
    subtasks: [
      { id: 's1', title: 'Rà soát log đăng nhập bất thường', done: true },
      { id: 's2', title: 'Cấu hình module Auth OTP', done: true },
      { id: 's3', title: 'Viết tài liệu hướng dẫn 2FA', done: false },
      { id: 's4', title: 'Cập nhật phiên bản lên Production', done: false }
    ],
    comments: [
      { id: 'c1', author: 'Nguyễn Văn Thắng', text: 'Nhiệm vụ này cực kỳ cấp thiết, anh Nam tập trung nhân lực xử lý dứt điểm trước kỳ hạn.', date: '2026-05-29' },
      { id: 'c2', author: 'Lê Hoàng Nam', text: 'Dạ vâng, bên em đã vá xong core API, đang tiến hành kiểm thử thêm tính năng OTP dự phòng.', date: '2026-05-30' }
    ]
  },
  {
    id: 'TKS-002',
    title: 'Thiết kế Landing Page chiến dịch hè 2026',
    desc: 'Thiết kế giao diện chi tiết cho chiến dịch ưu đãi hè tích hợp vòng quay may mắn Loyalty trên Mobile Web.',
    scope: 'team',
    department: 'Phòng Công nghệ',
    priority: 'high',
    status: 'todo',
    progress: 10,
    labels: ['Thiết kế', 'UI/UX', 'Marketing'],
    assignee: MOCK_MEMBERS[5], // Trịnh Thu Thảo
    date: '2026-06-10',
    createdAt: '2026-06-01',
    creator: 'Lê Hoàng Nam',
    subtasks: [
      { id: 'sw1', title: 'Nghiên cứu yêu cầu & Moodboard', done: true },
      { id: 'sw2', title: 'Thiết kế Wireframe', done: false },
      { id: 'sw3', title: 'Thiết kế chi diện Desk + Mobile', done: false }
    ],
    comments: []
  },
  {
    id: 'TKS-003',
    title: 'Đánh giá chỉ số hiệu quả CSKH tháng 5',
    desc: 'Lập báo cáo tổng hợp tỷ lệ vi phạm SLA, thời gian phản hồi trung bình và biểu đồ phân phối để trình Ban giám đốc.',
    scope: 'department',
    department: 'Phòng CSKH',
    priority: 'medium',
    status: 'done',
    progress: 100,
    labels: ['CSKH', 'Báo cáo', 'SLA'],
    assignee: MOCK_MEMBERS[3], // Phạm Quỳnh Anh
    date: '2026-06-01',
    createdAt: '2026-05-25',
    creator: 'Nguyễn Văn Thắng',
    subtasks: [
      { id: 'sc1', title: 'Xuất dữ liệu thô từ hệ thống soát vé', done: true },
      { id: 'sc2', title: 'Vẽ biểu đồ phân phối đáp ứng SLA', done: true },
      { id: 'sc3', title: 'Hoàn thiện bản báo cáo gửi CEO', done: true }
    ],
    comments: [
      { id: 'cc1', author: 'Nguyễn Văn Thắng', text: 'Báo cáo rất chi tiết, tỷ lệ SLA cải thiện tốt so với quý trước.', date: '2026-06-01' }
    ]
  },
  {
    id: 'TKS-004',
    title: 'Xây dựng kế hoạch tuyển dụng Dev React/Go',
    desc: 'Soạn thảo tin tuyển dụng, ngân sách lương thưởng và đề án xin phê duyệt định biên nhân sự quý 3 cho phòng Công nghệ.',
    scope: 'individual',
    department: 'Phòng Nhân sự',
    priority: 'medium',
    status: 'in_progress',
    progress: 40,
    labels: ['Nhân sự', 'Tuyển dụng'],
    assignee: MOCK_MEMBERS[1], // Trần Thị Hồng
    date: '2026-06-18',
    createdAt: '2026-06-01',
    creator: 'Trần Thị Hồng',
    subtasks: [
      { id: 'sh1', title: 'Lấy JD & yêu cầu chi tiết từ anh Nam', done: true },
      { id: 'sh2', title: 'Lập tờ trình định biên gửi Ban giám đốc', done: false },
      { id: 'sh3', title: 'Đăng tin tuyển dụng trên các kênh', done: false }
    ],
    comments: []
  },
  {
    id: 'TKS-005',
    title: 'Tối ưu hiệu suất cơ sở dữ liệu Postgres',
    desc: 'Phân tích các câu truy vấn chậm, đánh chỉ mục index bổ sung và dọn dẹp các bảng log lịch sử phình to.',
    scope: 'team',
    department: 'Phòng Công nghệ',
    priority: 'high',
    status: 'testing',
    progress: 90,
    labels: ['Hệ thống', 'Database'],
    assignee: MOCK_MEMBERS[4], // Đỗ Minh Quân
    date: '2026-06-05',
    createdAt: '2026-05-20',
    creator: 'Lê Hoàng Nam',
    subtasks: [
      { id: 'sd1', title: 'Cài đặt công cụ giám sát query chậm', done: true },
      { id: 'sd2', title: 'Cấu hình index cho các bảng khách hàng & đơn hàng', done: true },
      { id: 'sd3', title: 'Test thử tải sau khi tối ưu', done: true },
      { id: 'sd4', title: 'Theo dõi tải hệ thống thực tế', done: false }
    ],
    comments: [
      { id: 'cd1', author: 'Lê Hoàng Nam', text: 'Kết quả test tải rất hứa hẹn, thời gian phản hồi API giảm được 60%.', date: '2026-05-31' }
    ]
  },
  {
    id: 'TKS-006',
    title: 'Triển khai khảo sát ý kiến khách hàng về eMenu',
    desc: 'Tạo lập biểu mẫu khảo sát, gửi email tự động và báo cáo tổng kết phản hồi của người dùng về tính năng gọi món thông minh.',
    scope: 'company',
    department: 'Phòng CSKH',
    priority: 'low',
    status: 'todo',
    progress: 0,
    labels: ['Kinh doanh', 'eMenu', 'Khảo sát'],
    assignee: MOCK_MEMBERS[7], // Nguyễn Bích Thủy
    date: '2026-06-25',
    createdAt: '2026-06-02',
    creator: 'Phạm Quỳnh Anh',
    subtasks: [
      { id: 'se1', title: 'Soạn lập bộ câu hỏi khảo sát', done: false },
      { id: 'se2', title: 'Cấu hình luồng tự động gửi email sau thanh toán', done: false },
      { id: 'se3', title: 'Thu thập kết quả sau 2 tuần', done: false }
    ],
    comments: []
  }
];

export const DEPARTMENTS = [
  'Ban Lãnh đạo',
  'Phòng Công nghệ',
  'Phòng CSKH',
  'Phòng Nhân sự',
  'Phòng Marketing',
  'Ban Dự án eOffice'
];

export const LABELS = [
  'Hệ thống',
  'Bảo mật',
  'eOffice',
  'UI/UX',
  'Thiết kế',
  'Marketing',
  'Tuyển dụng',
  'Đào tạo',
  'Database',
  'CSKH',
  'eMenu',
  'Báo cáo',
  'Tài chính'
];
