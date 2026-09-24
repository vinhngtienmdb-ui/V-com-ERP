export interface LMSLesson {
  id: string;
  title: string;
  durationMinutes: number;
  type: 'video' | 'document' | 'interactive';
  videoUrl?: string;
  content: string;
}

export interface LMSQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface LMSCourse {
  id: string;
  title: string;
  category: 'onboarding' | 'sales' | 'logistics' | 'security' | 'leadership';
  categoryLabel: string;
  level: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  durationHours: number;
  totalLessons: number;
  enrolledCount: number;
  rating: number;
  thumbnail: string;
  description: string;
  instructor: string;
  instructorTitle: string;
  lessons: LMSLesson[];
  quiz: LMSQuizQuestion[];
  passingScorePercent: number;
  isMandatory?: boolean;
}

// UI Models used in LMSManagement component
export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'document';
  completed?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Course {
  id: string;
  title: string;
  category: 'onboarding' | 'sales' | 'operations' | 'security';
  instructor: string;
  duration: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  mandatory?: boolean;
  thumbnail: string;
  description: string;
  passingScore: number;
  lessons: Lesson[];
  quiz?: QuizQuestion[];
}

export interface LearningPath {
  id: string;
  title: string;
  role: string;
  deadline: string;
  progress: number;
  description: string;
  courses: string[];
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  issuedDate: string;
  expirationDate: string;
  score: number;
  credentialCode: string;
  status: 'valid' | 'expired';
}

export const initialCourses: Course[] = [
  {
    id: 'COURSE-001',
    title: 'Hội Nhập Cán Bộ Mới & Văn Hóa Doanh Nghiệp VComm',
    category: 'onboarding',
    instructor: 'Trần Ban Giám Đốc HR',
    duration: '4 Giờ học',
    progress: 100,
    status: 'completed',
    mandatory: true,
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    description: 'Khóa học bắt buộc dành cho 100% nhân sự mới gia nhập VComm. Giới thiệu sứ mệnh, giá trị cốt lõi, quy tắc ứng xử và các chính sách phúc lợi.',
    passingScore: 80,
    lessons: [
      { id: 'L-101', title: 'Lịch sử phát triển và Sứ mệnh O2O VComm', duration: '20 phút', type: 'video', completed: true },
      { id: 'L-102', title: 'Quy tắc ứng xử và Văn hóa phụng sự khách hàng', duration: '35 phút', type: 'document', completed: true },
      { id: 'L-103', title: 'Chính sách bảo mật dữ liệu khách hàng & Sở hữu trí tuệ', duration: '30 phút', type: 'video', completed: true },
      { id: 'L-104', title: 'Sơ đồ tổ chức & Hướng dẫn sử dụng phần mềm VComm ERP', duration: '45 phút', type: 'video', completed: true },
    ],
    quiz: [
      {
        id: 'Q-1',
        question: 'Giá trị cốt lõi hàng đầu tại sàn TMĐT VComm là gì?',
        options: ['Tập trung tối đa vào phụng sự trải nghiệm khách hàng', 'Chỉ ưu tiên lợi nhuận ngắn hạn', 'Cắt giảm tối đa chi phí hỗ trợ', 'Không cần đối soát đơn hàng'],
        correctAnswer: 0
      },
      {
        id: 'Q-2',
        question: 'Khi nhận được yêu cầu cung cấp thông tin khách hàng từ bên thứ ba chưa rõ danh tính, bạn phải làm gì?',
        options: ['Gửi ngay qua Zalo cá nhân', 'Từ chối và báo cáo ngay cho Cán bộ An ninh Dữ liệu / Ticket IT', 'Đăng tải lên nhóm nội bộ', 'Xóa email'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'COURSE-002',
    title: 'Kỹ Năng Tư Vấn Bán Hàng & Chốt Đơn O2O Đa Kênh',
    category: 'sales',
    instructor: 'Lê Chuyên Gia Bán Lẻ',
    duration: '6 Giờ học',
    progress: 50,
    status: 'in_progress',
    mandatory: false,
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=600&q=80',
    description: 'Nâng cao tỷ lệ chốt đơn O2O, kết hợp giữ chân khách mua tại điểm bán và kích hoạt khách hàng mua lại trên App VComm.',
    passingScore: 80,
    lessons: [
      { id: 'L-201', title: 'Nghệ thuật thấu cảm và nắm bắt nhu cầu khách hàng', duration: '30 phút', type: 'video', completed: true },
      { id: 'L-202', title: 'Kỹ thuật Upsell và Cross-sell sản phẩm bổ trợ', duration: '40 phút', type: 'video', completed: false },
      { id: 'L-203', title: 'Xử lý phản đối về giá và chính sách giao vận', duration: '35 phút', type: 'document', completed: false },
    ],
    quiz: [
      {
        id: 'Q-3',
        question: 'Mô hình bán hàng O2O của VComm hỗ trợ khách hàng điểm bán vật lý điều gì?',
        options: ['Trải nghiệm sản phẩm thật và đặt giao tận nhà trong 2h', 'Bắt buộc khách tự chở hàng về', 'Không cho đổi trả', 'Chỉ bán khi có tiền mặt'],
        correctAnswer: 0
      },
      {
        id: 'Q-4',
        question: 'Chiến thuật Upsell hiệu quả nhất là gì?',
        options: ['Giới thiệu phiên bản dung lượng hoặc combo tiết kiệm kèm giá trị vượt trội', 'Ép khách mua thêm hàng tồn', 'Tăng giá tùy tiện', 'Giảm bảo hành'],
        correctAnswer: 0
      }
    ]
  },
  {
    id: 'COURSE-003',
    title: 'Quy Trình Nhập Xuất & Kiểm Kê Kho WMS Đa Điểm',
    category: 'operations',
    instructor: 'Hoàng Quản Kho Trưởng',
    duration: '5 Giờ học',
    progress: 0,
    status: 'not_started',
    mandatory: true,
    thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    description: 'Quy chuẩn đóng gói đơn hàng TMĐT, dán tem mã vận đơn A6/K80, quét mã vạch Barcode và kiểm kê kho chống thất thoát.',
    passingScore: 85,
    lessons: [
      { id: 'L-301', title: 'Quy trình kiểm đếm PO nhập kho từ Nhà cung cấp', duration: '45 phút', type: 'video', completed: false },
      { id: 'L-302', title: 'Tiêu chuẩn đóng gói hàng dễ vỡ & Dán tem vận chuyển', duration: '30 phút', type: 'document', completed: false },
    ],
    quiz: [
      {
        id: 'Q-5',
        question: 'Quy chuẩn tem in vận chuyển chuẩn của VComm là kích thước nào?',
        options: ['Tem A6 (100x150mm) hoặc K80', 'Giấy A4 gấp đôi', 'Không cần tem', 'Giấy than viết tay'],
        correctAnswer: 0
      }
    ]
  },
  {
    id: 'COURSE-004',
    title: 'An Toàn Thông Tin & Phòng Chống Lừa Đảo Phishing',
    category: 'security',
    instructor: 'Nguyễn Kỹ Sư Bảo Mật',
    duration: '3 Giờ học',
    progress: 100,
    status: 'completed',
    mandatory: true,
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    description: 'Nhận diện email lừa đảo, bảo vệ thông tin thẻ ngân hàng và mật khẩu hệ thống ERP chống rò rỉ dữ liệu.',
    passingScore: 90,
    lessons: [
      { id: 'L-401', title: 'Dấu hiệu nhận biết email mạo danh Phishing', duration: '20 phút', type: 'video', completed: true },
      { id: 'L-402', title: 'Thiết lập bảo mật 2 lớp OTP và mật khẩu mạnh', duration: '25 phút', type: 'document', completed: true },
    ],
    quiz: [
      {
        id: 'Q-6',
        question: 'Khi nhận được email lạ yêu cầu đổi mật khẩu khẩn cấp, bạn nên làm gì?',
        options: ['Báo cáo ngay cho IT Helpdesk và không click link lạ', 'Click ngay và nhập mật khẩu cũ', 'Gửi cho cả phòng thử', 'Xóa mail bỏ qua'],
        correctAnswer: 0
      }
    ]
  }
];

export const initialLearningPaths: LearningPath[] = [
  {
    id: 'PATH-01',
    title: 'Lộ Trình Hội Nhập Nhân Viên Mới (Newbie 30 Days)',
    role: 'Tất cả nhân sự mới tuyển',
    deadline: '30 ngày kể từ ngày nhận việc',
    progress: 75,
    description: 'Lộ trình huấn luyện bắt buộc để hoàn tất thời gian thử việc và ký Hợp đồng lao động chính thức.',
    courses: ['COURSE-001', 'COURSE-004']
  },
  {
    id: 'PATH-02',
    title: 'Chuyên Viên Tư Vấn Bán Lẻ & O2O Xuất Sắc',
    role: 'Khối Kinh Doanh & Điểm Bán',
    deadline: 'Hạn chót: 31/03/2026',
    progress: 40,
    description: 'Lộ trình chuẩn hóa nghiệp vụ tư vấn, upsell và chăm sóc khách hàng VIP chuỗi cửa hàng.',
    courses: ['COURSE-002']
  }
];

export const initialCertificates: Certificate[] = [
  {
    id: 'CERT-001',
    courseId: 'COURSE-001',
    courseTitle: 'Hội Nhập Cán Bộ Mới & Văn Hóa Doanh Nghiệp VComm',
    studentName: 'Nguyễn Văn A (Mã NV: VC-0042)',
    issuedDate: '10/01/2026',
    expirationDate: 'Vô thời hạn',
    score: 100,
    credentialCode: 'VCOMM-LMS-2026-9812',
    status: 'valid'
  },
  {
    id: 'CERT-002',
    courseId: 'COURSE-004',
    courseTitle: 'An Toàn Thông Tin & Phòng Chống Lừa Đảo Phishing',
    studentName: 'Nguyễn Văn A (Mã NV: VC-0042)',
    issuedDate: '15/02/2026',
    expirationDate: '15/02/2027 (1 Năm)',
    score: 95,
    credentialCode: 'VCOMM-SEC-2026-4419',
    status: 'valid'
  }
];

// Compatibility exports
export const LMS_COURSES = initialCourses;
export const INITIAL_USER_PROGRESS: Record<string, any> = {};
