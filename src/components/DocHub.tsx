import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderPlus,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  Image as ImageIcon,
  Upload,
  Search,
  Grid,
  List,
  ChevronRight,
  ChevronDown,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Clock,
  Download,
  Eye,
  Trash2,
  Share2,
  Copy,
  History,
  Lock,
  Unlock,
  Plus,
  Filter,
  Check,
  ExternalLink,
  Cloud,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ArrowUpDown,
  Tag,
  FileCheck,
  Building2,
  UserCheck,
  Sparkles,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { DocumentViewer } from './document-viewer';

// Types
export type AccessRole = 'Manager' | 'Editor' | 'Contributor' | 'Viewer';

export interface FileVersion {
  version: string;
  updatedAt: string;
  updatedBy: string;
  size: string;
  note: string;
  url?: string;
}

export interface DocItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  fileType?: 'pdf' | 'xlsx' | 'docx' | 'image' | 'archive' | 'other';
  size?: string;
  updatedAt: string;
  updatedBy: string;
  avatarUrl?: string;
  parentId: string | null;
  department?: string;
  userRole: AccessRole;
  inheritPermissions: boolean;
  tags?: string[];
  versions?: FileVersion[];
  description?: string;
  starred?: boolean;
}

export interface DepartmentFolder {
  id: string;
  name: string;
  icon?: string;
  badge?: string;
  color?: string;
  children?: DepartmentFolder[];
}

// Initial Data
const INITIAL_FOLDERS: DepartmentFolder[] = [
  {
    id: 'f-all',
    name: 'Tất cả tài liệu số',
    color: 'text-indigo-500',
    children: [
      {
        id: 'f-bod',
        name: 'Ban Giám Đốc (Bảo mật cao)',
        color: 'text-rose-500',
        badge: 'Cấp 1'
      },
      {
        id: 'f-acc',
        name: 'Tài chính - Kế toán',
        color: 'text-emerald-500',
        badge: 'Cấp 2',
        children: [
          { id: 'f-acc-reports', name: 'Báo cáo tài chính & Kiểm toán' },
          { id: 'f-acc-tax', name: 'Hóa đơn & Tờ khai thuế' },
          { id: 'f-acc-assets', name: 'Sổ sách tài sản cố định' }
        ]
      },
      {
        id: 'f-hr',
        name: 'Nhân sự & Lao động',
        color: 'text-blue-500',
        badge: 'Cấp 2',
        children: [
          { id: 'f-hr-contracts', name: 'Hồ sơ Hợp đồng lao động' },
          { id: 'f-hr-policies', name: 'Quy chế & Thỏa ước LĐTT' },
          { id: 'f-hr-insurance', name: 'Hồ sơ BHXH & Chế độ' }
        ]
      },
      {
        id: 'f-legal',
        name: 'Pháp chế & Tuân thủ',
        color: 'text-amber-500',
        badge: 'Cấp 2',
        children: [
          { id: 'f-legal-permits', name: 'Giấy phép kinh doanh & Đầu tư' },
          { id: 'f-legal-templates', name: 'Mẫu hợp đồng pháp lý chuẩn' },
          { id: 'f-legal-litigation', name: 'Hồ sơ tranh chấp & Khiếu nại' }
        ]
      },
      {
        id: 'f-tech',
        name: 'Công nghệ & Vận hành',
        color: 'text-purple-500',
        badge: 'Cấp 2',
        children: [
          { id: 'f-tech-arch', name: 'Kiến trúc hệ thống & API' },
          { id: 'f-tech-sop', name: 'Quy trình vận hành SOP' },
          { id: 'f-tech-sec', name: 'Tiêu chuẩn an toàn thông tin ISO 27001' }
        ]
      },
      {
        id: 'f-sales',
        name: 'Kinh doanh & Dự án',
        color: 'text-cyan-500',
        badge: 'Cấp 2'
      }
    ]
  }
];

const INITIAL_DOCS: DocItem[] = [
  {
    id: 'doc-001',
    name: 'Báo cáo Kiểm toán Độc lập Tài chính Năm 2025 (Đã soát xét).pdf',
    type: 'file',
    fileType: 'pdf',
    size: '4.8 MB',
    updatedAt: '15/03/2026 14:20',
    updatedBy: 'Trần Thị Thu Thảo (Kế toán trưởng)',
    parentId: 'f-acc-reports',
    department: 'Tài chính - Kế toán',
    userRole: 'Manager',
    inheritPermissions: true,
    tags: ['Kiểm toán', 'BCTC', 'EY Vietnam', 'Chính thức'],
    description: 'Bản quét có chữ ký của Kiểm toán viên độc lập Ernst & Young cho năm tài chính 2025.',
    starred: true,
    versions: [
      { version: 'v2.0', updatedAt: '15/03/2026 14:20', updatedBy: 'Trần Thị Thu Thảo', size: '4.8 MB', note: 'Bản ký chính thức có ý kiến chấp nhận toàn phần' },
      { version: 'v1.1', updatedAt: '10/03/2026 09:30', updatedBy: 'Lê Văn Minh', size: '4.6 MB', note: 'Soát xét số liệu dự phòng hàng tồn kho' },
      { version: 'v1.0', updatedAt: '01/03/2026 16:00', updatedBy: 'Lê Văn Minh', size: '4.5 MB', note: 'Bản thảo ban đầu' }
    ]
  },
  {
    id: 'doc-002',
    name: 'Quy chế Quản lý Tài chính và Phê duyệt Ngân sách 2026.docx',
    type: 'file',
    fileType: 'docx',
    size: '1.2 MB',
    updatedAt: '12/02/2026 10:15',
    updatedBy: 'Nguyễn Văn Quang (CFO)',
    parentId: 'f-acc-reports',
    department: 'Tài chính - Kế toán',
    userRole: 'Editor',
    inheritPermissions: true,
    tags: ['Quy chế', 'Hạn mức', 'Chi phí'],
    description: 'Quy định về thẩm quyền phê duyệt mua sắm, giải ngân các khoản chi trên 50 triệu.',
    starred: false,
    versions: [
      { version: 'v1.0', updatedAt: '12/02/2026 10:15', updatedBy: 'Nguyễn Văn Quang', size: '1.2 MB', note: 'Ban hành áp dụng từ 01/03/2026' }
    ]
  },
  {
    id: 'doc-003',
    name: 'Bảng Kê Hóa Đơn Giá Trị Gia Tăng Tháng 02-2026.xlsx',
    type: 'file',
    fileType: 'xlsx',
    size: '890 KB',
    updatedAt: '05/03/2026 17:45',
    updatedBy: 'Phạm Hồng Nhung (Kế toán Thuế)',
    parentId: 'f-acc-tax',
    department: 'Tài chính - Kế toán',
    userRole: 'Contributor',
    inheritPermissions: true,
    tags: ['VAT', 'Thuế', 'Hóa đơn điện tử'],
    description: 'Đối soát 2.450 hóa đơn đầu vào và đầu ra đã khớp mã cơ quan thuế.',
    versions: [
      { version: 'v1.2', updatedAt: '05/03/2026 17:45', updatedBy: 'Phạm Hồng Nhung', size: '890 KB', note: 'Bổ sung 15 hóa đơn chiết khấu thương mại' },
      { version: 'v1.0', updatedAt: '02/03/2026 11:00', updatedBy: 'Phạm Hồng Nhung', size: '850 KB', note: 'Kê khai đợt 1' }
    ]
  },
  {
    id: 'doc-004',
    name: 'Thỏa ước Lao động Tập thể Doanh nghiệp (Nhiệm kỳ 2025 - 2028).pdf',
    type: 'file',
    fileType: 'pdf',
    size: '2.5 MB',
    updatedAt: '18/01/2026 08:30',
    updatedBy: 'Đỗ Mạnh Cường (Trưởng ban Nhân sự)',
    parentId: 'f-hr-policies',
    department: 'Nhân sự & Lao động',
    userRole: 'Manager',
    inheritPermissions: true,
    tags: ['TƯLĐTT', 'Công đoàn', 'Phúc lợi', 'NĐ 283'],
    description: 'Đã đăng ký và có xác nhận của Sở Lao động Thương binh & Xã hội.',
    starred: true,
    versions: [
      { version: 'v1.0', updatedAt: '18/01/2026 08:30', updatedBy: 'Đỗ Mạnh Cường', size: '2.5 MB', note: 'Bản ký kết có xác nhận cơ quan thẩm quyền' }
    ]
  },
  {
    id: 'doc-005',
    name: 'Mẫu Hợp Đồng Lao Động Xác Định Thời Hạn Chuẩn 2026.docx',
    type: 'file',
    fileType: 'docx',
    size: '420 KB',
    updatedAt: '25/02/2026 15:10',
    updatedBy: 'Nguyễn Thị Hải Yến (Chuyên viên Nhân sự)',
    parentId: 'f-hr-contracts',
    department: 'Nhân sự & Lao động',
    userRole: 'Editor',
    inheritPermissions: true,
    tags: ['Mẫu HĐLĐ', 'BLLĐ 2019', 'Pháp chế thẩm định'],
    description: 'Mẫu hợp đồng áp dụng cho nhân sự khối kinh doanh và vận hành.',
    versions: [
      { version: 'v2.1', updatedAt: '25/02/2026 15:10', updatedBy: 'Nguyễn Thị Hải Yến', size: '420 KB', note: 'Cập nhật điều khoản thỏa thuận bảo mật NDA và lương đóng BHXH' }
    ]
  },
  {
    id: 'doc-006',
    name: 'Giấy Chứng Nhận Đăng Ký Doanh Nghiệp (Thay đổi lần 8).pdf',
    type: 'file',
    fileType: 'pdf',
    size: '1.8 MB',
    updatedAt: '10/01/2026 11:20',
    updatedBy: 'Vũ Quốc Khánh (Pháp chế)',
    parentId: 'f-legal-permits',
    department: 'Pháp chế & Tuân thủ',
    userRole: 'Viewer',
    inheritPermissions: false,
    tags: ['ĐKKD', 'Sở KH&ĐT', 'Pháp nhân'],
    description: 'Bản sao y công chứng tăng vốn điều lệ lên 150 tỷ VNĐ.',
    starred: true,
    versions: [
      { version: 'v1.0', updatedAt: '10/01/2026 11:20', updatedBy: 'Vũ Quốc Khánh', size: '1.8 MB', note: 'Bản chứng thực số 128/2026' }
    ]
  },
  {
    id: 'doc-007',
    name: 'Kiến Trúc Hệ Thống Đa Kênh Omni-channel & Cloud Infrastructure.pdf',
    type: 'file',
    fileType: 'pdf',
    size: '6.4 MB',
    updatedAt: '20/02/2026 09:00',
    updatedBy: 'Kỹ sư Trưởng (Enterprise Architect)',
    parentId: 'f-tech-arch',
    department: 'Công nghệ & Vận hành',
    userRole: 'Manager',
    inheritPermissions: true,
    tags: ['Architecture', 'Kubernetes', 'Microservices', 'High-Availability'],
    description: 'Sơ đồ topo triển khai trên AWS / Google Cloud kèm giải pháp chịu lỗi 99.99%.',
    versions: [
      { version: 'v3.0', updatedAt: '20/02/2026 09:00', updatedBy: 'Kỹ sư Trưởng', size: '6.4 MB', note: 'Bổ sung sơ đồ tích hợp cổng thanh toán VietQR và IPOS' }
    ]
  },
  {
    id: 'doc-008',
    name: 'Sơ đồ Tổ chức & Ma trận Phân quyền RACI Toàn Tập Đoàn 2026.png',
    type: 'file',
    fileType: 'image',
    size: '3.2 MB',
    updatedAt: '14/02/2026 16:30',
    updatedBy: 'Văn phòng HĐQT',
    parentId: 'f-bod',
    department: 'Ban Giám Đốc (Bảo mật cao)',
    userRole: 'Manager',
    inheritPermissions: false,
    tags: ['Sơ đồ', 'RACI', 'Cơ cấu'],
    description: 'Bảo mật cấp 1 - Chỉ thành viên Ban Điều Hành và Trưởng Bộ Phận được xem.',
    starred: true,
    versions: [
      { version: 'v1.0', updatedAt: '14/02/2026 16:30', updatedBy: 'Văn phòng HĐQT', size: '3.2 MB', note: 'Ban hành theo NQ HĐQT số 02/2026' }
    ]
  }
];

// Helper bỏ dấu tiếng Việt để tìm kiếm
function removeVietnameseTones(str: string): string {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str.toLowerCase();
}

export function DocHub() {
  const navigate = useNavigate();

  // State quản lý
  const [selectedFolderId, setSelectedFolderId] = useState<string>('f-acc-reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'f-all': true,
    'f-acc': true,
    'f-hr': true,
    'f-legal': true,
    'f-tech': true
  });

  // Modals & Panels
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);
  const [permissionDoc, setPermissionDoc] = useState<DocItem | null>(null);
  const [versionDoc, setVersionDoc] = useState<DocItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Danh sách tài liệu hiện tại
  const [docs, setDocs] = useState<DocItem[]>(INITIAL_DOCS);

  // Toggle folder open
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Tìm folder theo ID để hiển thị Breadcrumb
  const getFolderBreadcrumb = (folderId: string): string[] => {
    if (folderId === 'f-all') return ['Tất cả tài liệu'];
    if (folderId === 'f-acc-reports') return ['Tất cả tài liệu', 'Tài chính - Kế toán', 'Báo cáo tài chính & Kiểm toán'];
    if (folderId === 'f-acc-tax') return ['Tất cả tài liệu', 'Tài chính - Kế toán', 'Hóa đơn & Tờ khai thuế'];
    if (folderId === 'f-acc-assets') return ['Tất cả tài liệu', 'Tài chính - Kế toán', 'Sổ sách tài sản cố định'];
    if (folderId === 'f-acc') return ['Tất cả tài liệu', 'Tài chính - Kế toán'];
    if (folderId === 'f-hr-contracts') return ['Tất cả tài liệu', 'Nhân sự & Lao động', 'Hồ sơ Hợp đồng lao động'];
    if (folderId === 'f-hr-policies') return ['Tất cả tài liệu', 'Nhân sự & Lao động', 'Quy chế & Thỏa ước LĐTT'];
    if (folderId === 'f-hr') return ['Tất cả tài liệu', 'Nhân sự & Lao động'];
    if (folderId === 'f-legal-permits') return ['Tất cả tài liệu', 'Pháp chế & Tuân thủ', 'Giấy phép kinh doanh'];
    if (folderId === 'f-legal') return ['Tất cả tài liệu', 'Pháp chế & Tuân thủ'];
    if (folderId === 'f-tech-arch') return ['Tất cả tài liệu', 'Công nghệ & Vận hành', 'Kiến trúc hệ thống'];
    if (folderId === 'f-tech') return ['Tất cả tài liệu', 'Công nghệ & Vận hành'];
    if (folderId === 'f-bod') return ['Tất cả tài liệu', 'Ban Giám Đốc (Bảo mật cao)'];
    return ['Tất cả tài liệu', 'Thư mục hiện tại'];
  };

  // Filter tài liệu
  const filteredDocs = useMemo(() => {
    return docs.filter(doc => {
      const matchFolder = selectedFolderId === 'f-all' || doc.parentId === selectedFolderId || (selectedFolderId === 'f-acc' && doc.parentId?.startsWith('f-acc')) || (selectedFolderId === 'f-hr' && doc.parentId?.startsWith('f-hr')) || (selectedFolderId === 'f-legal' && doc.parentId?.startsWith('f-legal')) || (selectedFolderId === 'f-tech' && doc.parentId?.startsWith('f-tech'));

      const matchFileType = selectedFileType === 'all' || doc.fileType === selectedFileType;

      const cleanQuery = removeVietnameseTones(searchQuery.trim());
      const cleanName = removeVietnameseTones(doc.name);
      const cleanDesc = removeVietnameseTones(doc.description || '');
      const cleanTags = (doc.tags || []).map(t => removeVietnameseTones(t)).join(' ');
      const matchSearch = !cleanQuery || cleanName.includes(cleanQuery) || cleanDesc.includes(cleanQuery) || cleanTags.includes(cleanQuery);

      return matchFolder && matchFileType && matchSearch;
    });
  }, [docs, selectedFolderId, selectedFileType, searchQuery]);

  // Giả lập Upload File mới
  const handleSimulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(10);
    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsUploading(false);
          const newDoc: DocItem = {
            id: `doc-${Date.now()}`,
            name: `Tai-lieu-moi-${Date.now().toString().slice(-4)}.pdf`,
            type: 'file',
            fileType: 'pdf',
            size: '2.4 MB',
            updatedAt: 'Vừa xong',
            updatedBy: 'Bạn (Quản trị viên)',
            parentId: selectedFolderId === 'f-all' ? 'f-acc-reports' : selectedFolderId,
            department: 'Bộ phận hiện tại',
            userRole: 'Manager',
            inheritPermissions: true,
            tags: ['Mới tải lên', 'Bản nháp'],
            description: 'Tài liệu vừa được tải lên qua cổng DocHub.',
            versions: [
              { version: 'v1.0', updatedAt: 'Vừa xong', updatedBy: 'Bạn (Quản trị viên)', size: '2.4 MB', note: 'Phiên bản khởi tạo ban đầu' }
            ]
          };
          setDocs(prevDocs => [newDoc, ...prevDocs]);
          return 0;
        }
        return prev + 30;
      });
    }, 250);
  };

  const renderFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-rose-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-8 h-8 text-emerald-600" />;
      case 'docx':
        return <FileCode className="w-8 h-8 text-blue-600" />;
      case 'image':
        return <ImageIcon className="w-8 h-8 text-purple-500" />;
      default:
        return <File className="w-8 h-8 text-slate-400" />;
    }
  };

  const renderRoleBadge = (role: AccessRole) => {
    switch (role) {
      case 'Manager':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Manager (Toàn quyền)</span>;
      case 'Editor':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Editor (Chỉnh sửa)</span>;
      case 'Contributor':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Contributor (Đóng góp)</span>;
      case 'Viewer':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Viewer (Chỉ xem)</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Cloud className="w-4 h-4" />
            <span>DocHub • Enterprise Digital Document Management</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Drive Synced
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Tài Liệu Điện Tử (DocHub)
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              Chuẩn RBAC & Multi-Version
            </span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Hệ thống quản trị kho tri thức số, phân quyền kế thừa, bảo mật cấp độ doanh nghiệp & lưu trữ Copy-on-write.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Chuyển qua Văn thư */}
          <button
            onClick={() => navigate('/official-dispatch')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 border border-slate-300/80"
            title="Quay lại module Văn thư công văn NĐ 30/CP"
          >
            <FileCheck className="w-4 h-4 text-slate-600" />
            <span>Mở Phân hệ Văn thư</span>
          </button>

          {/* Nút Tạo thư mục */}
          <button
            onClick={() => setIsNewFolderOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-1.5 border border-indigo-200"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>Tạo thư mục</span>
          </button>

          {/* Nút Upload tài liệu */}
          <button
            onClick={handleSimulateUpload}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? `Đang tải lên ${uploadProgress}%...` : 'Tải lên tài liệu'}</span>
          </button>
        </div>
      </div>

      {/* Chỉ số nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng số tài liệu số</p>
            <p className="text-xl font-black text-slate-900">{docs.length} <span className="text-xs font-normal text-slate-400">tệp tin</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Dung lượng Google Drive</p>
            <p className="text-xl font-black text-slate-900">42.8 GB <span className="text-xs font-normal text-slate-400">/ 2 TB (2.1%)</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tài liệu bảo mật Cấp 1</p>
            <p className="text-xl font-black text-slate-900">2 <span className="text-xs font-semibold text-rose-600">(Mã hóa E2EE)</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Lịch sử đa phiên bản</p>
            <p className="text-xl font-black text-slate-900">Copy-on-write <span className="text-xs font-normal text-slate-400">tự động</span></p>
          </div>
        </div>
      </div>

      {/* Khung làm việc chính: Sidebar Tree + Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: Folder Tree */}
        <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-indigo-600" /> Cây Thư Mục Doanh Nghiệp
            </span>
            <span className="text-[11px] font-semibold text-slate-400">RBAC</span>
          </div>

          <div className="space-y-1 text-sm select-none">
            {INITIAL_FOLDERS.map(root => (
              <div key={root.id}>
                <div
                  onClick={() => setSelectedFolderId(root.id)}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-xl font-medium cursor-pointer transition-colors",
                    selectedFolderId === root.id ? "bg-indigo-50 text-indigo-900 font-bold" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFolder(root.id); }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {expandedFolders[root.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <Folder className={cn("w-4 h-4", root.color || "text-indigo-500")} />
                    <span>{root.name}</span>
                  </div>
                </div>

                {expandedFolders[root.id] && root.children && (
                  <div className="ml-5 pl-2 border-l border-slate-200 space-y-1 mt-1">
                    {root.children.map(sub => (
                      <div key={sub.id}>
                        <div
                          onClick={() => setSelectedFolderId(sub.id)}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors",
                            selectedFolderId === sub.id ? "bg-indigo-100/70 text-indigo-950 font-bold" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {sub.children ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFolder(sub.id); }}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                {expandedFolders[sub.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                            ) : (
                              <div className="w-3.5" />
                            )}
                            <Folder className={cn("w-3.5 h-3.5", sub.color || "text-slate-400")} />
                            <span className="truncate">{sub.name}</span>
                          </div>
                          {sub.badge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-semibold">{sub.badge}</span>
                          )}
                        </div>

                        {expandedFolders[sub.id] && sub.children && (
                          <div className="ml-4 pl-2 border-l border-slate-200 space-y-1 mt-1">
                            {sub.children.map(leaf => (
                              <div
                                key={leaf.id}
                                onClick={() => setSelectedFolderId(leaf.id)}
                                className={cn(
                                  "flex items-center gap-2 px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors",
                                  selectedFolderId === leaf.id ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-500 hover:bg-slate-100"
                                )}
                              >
                                <Folder className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{leaf.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lối tắt nhanh</p>
            <button
              onClick={() => setSelectedFolderId('f-all')}
              className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Tài liệu được gắn dấu sao
              </span>
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">4</span>
            </button>
            <button
              onClick={() => setSelectedFolderId('f-bod')}
              className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-500" /> Kho tài liệu mật HĐQT
              </span>
              <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">VIP</span>
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: File Explorer */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 flex-wrap">
                {getFolderBreadcrumb(selectedFolderId).map((crumb, idx, arr) => (
                  <React.Fragment key={crumb}>
                    <span className={cn(idx === arr.length - 1 ? "text-indigo-600 font-bold" : "text-slate-500")}>
                      {crumb}
                    </span>
                    {idx < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-1.5 rounded-lg text-xs transition-all",
                      viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700"
                    )}
                    title="Chế độ lưới (Grid)"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-1.5 rounded-lg text-xs transition-all",
                      viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700"
                    )}
                    title="Chế độ danh sách (List)"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tài liệu, mã số, tag, người cập nhật (hỗ trợ gõ tiếng Việt không dấu)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'pdf', label: 'PDF' },
                  { id: 'docx', label: 'Word' },
                  { id: 'xlsx', label: 'Excel' },
                  { id: 'image', label: 'Hình ảnh' }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedFileType(type.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border",
                      selectedFileType === type.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Không tìm thấy tài liệu phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Thư mục này chưa có tệp hoặc từ khóa tìm kiếm không khớp với bất kỳ tài liệu nào.
              </p>
              <button
                onClick={handleSimulateUpload}
                className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Tải lên tệp ngay
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-400 transition-all shadow-sm hover:shadow-md p-4 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2.5 bg-slate-50 rounded-xl group-hover:scale-105 transition-transform border border-slate-100">
                        {renderFileIcon(doc.fileType)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {renderRoleBadge(doc.userRole)}
                      </div>
                    </div>

                    <div>
                      <h4
                        onClick={() => setPreviewDoc(doc)}
                        className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-indigo-600 cursor-pointer transition-colors leading-relaxed"
                        title={doc.name}
                      >
                        {doc.name}
                      </h4>
                      {doc.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                          {doc.description}
                        </p>
                      )}
                    </div>

                    {doc.tags && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {doc.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      <span className="font-semibold text-slate-700">{doc.size}</span> • <span>{doc.updatedAt.split(' ')[0]}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Xem trước tài liệu"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setVersionDoc(doc)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lịch sử phiên bản (Copy-on-write)"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setPermissionDoc(doc)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Quản trị quyền truy cập RBAC"
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-3 px-4">Tên tài liệu</th>
                      <th className="py-3 px-3">Phòng ban</th>
                      <th className="py-3 px-3">Dung lượng</th>
                      <th className="py-3 px-3">Cập nhật gần nhất</th>
                      <th className="py-3 px-3">Quyền hạn</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-100 rounded-lg">
                              {renderFileIcon(doc.fileType)}
                            </div>
                            <div className="max-w-xs md:max-w-md truncate">
                              <span
                                onClick={() => setPreviewDoc(doc)}
                                className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer block truncate"
                                title={doc.name}
                              >
                                {doc.name}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate">{doc.description}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                          {doc.department || 'Nội bộ'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-semibold whitespace-nowrap">
                          {doc.size}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-slate-800 font-medium block">{doc.updatedAt}</span>
                          <span className="text-[10px] text-slate-400 block">{doc.updatedBy}</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {renderRoleBadge(doc.userRole)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              title="Xem trước"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setVersionDoc(doc)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Phiên bản"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setPermissionDoc(doc)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Phân quyền RBAC"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: PREVIEW FILE */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  {renderFileIcon(previewDoc.fileType)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 max-w-xl truncate">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-500">
                    {previewDoc.size} • Cập nhật bởi {previewDoc.updatedBy} ({previewDoc.updatedAt})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  Xem trực tiếp (Không tải về)
                </span>
                <button
                  onClick={() => alert(`Tải về tệp: ${previewDoc.name}`)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Tải về
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col bg-slate-100 min-h-[450px]">
              <DocumentViewer
                file={null}
                fileName={previewDoc.name}
                fileType={previewDoc.fileType as any}
                height="100%"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUẢN TRỊ PHÂN QUYỀN RBAC & KẾ THỪA */}
      {permissionDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Quản trị Quyền Truy Cập (RBAC)</h3>
              </div>
              <button onClick={() => setPermissionDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-950 truncate max-w-md">{permissionDoc.name}</p>
                  <p className="text-[11px] text-indigo-700">Thư mục cha: {permissionDoc.department || 'Bộ phận Nội bộ'}</p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-200/80 text-indigo-900">
                  {permissionDoc.userRole}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {permissionDoc.inheritPermissions ? <Lock className="w-3.5 h-3.5 text-emerald-600" /> : <Unlock className="w-3.5 h-3.5 text-amber-600" />}
                    Kế thừa quyền từ thư mục cha (Inherit Permissions)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {permissionDoc.inheritPermissions
                      ? 'Tài liệu này tự động nhận danh sách phân quyền từ thư mục chứa.'
                      : 'Đã ngắt kế thừa. Tài liệu có danh sách quyền truy cập độc lập.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={permissionDoc.inheritPermissions}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPermissionDoc({ ...permissionDoc, inheritPermissions: checked });
                    setDocs(prev => prev.map(d => d.id === permissionDoc.id ? { ...d, inheritPermissions: checked } : d));
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh sách Phân quyền Thành viên & Phòng ban</p>
                <div className="space-y-2">
                  {[
                    { name: 'Ban Giám Đốc (BOD)', role: 'Manager', desc: 'Toàn quyền xóa, sửa, chia sẻ' },
                    { name: 'Phòng Pháp Chế & Tuân Thủ', role: 'Editor', desc: 'Có quyền sửa, tải bản mới' },
                    { name: 'Chuyên viên Nghiệp vụ Phụ trách', role: 'Contributor', desc: 'Xem và đóng góp tệp' },
                    { name: 'Toàn bộ Cán bộ Nhân viên', role: 'Viewer', desc: 'Chỉ xem trực tuyến' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.desc}</p>
                      </div>
                      <select
                        defaultValue={item.role}
                        className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                      >
                        <option value="Manager">Manager (Toàn quyền)</option>
                        <option value="Editor">Editor (Chỉnh sửa)</option>
                        <option value="Contributor">Contributor (Đóng góp)</option>
                        <option value="Viewer">Viewer (Chỉ xem)</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setPermissionDoc(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    alert('Đã cập nhật chính sách phân quyền RBAC thành công!');
                    setPermissionDoc(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  Lưu cấu hình quyền
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LỊCH SỬ PHIÊN BẢN */}
      {versionDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Lịch Sử Phiên Bản (Copy-on-write)</h3>
                  <p className="text-[11px] text-slate-500 max-w-md truncate">{versionDoc.name}</p>
                </div>
              </div>
              <button onClick={() => setVersionDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Mỗi lần chỉnh sửa hoặc upload tệp đè, hệ thống tự động lưu bản sao lưu độc lập (Copy-on-write) giúp khôi phục dễ dàng mà không làm mất dữ liệu cũ.
                </span>
              </div>

              <div className="space-y-3">
                {(versionDoc.versions || []).map((ver, idx) => (
                  <div
                    key={ver.version}
                    className={cn(
                      "p-4 rounded-xl border transition-all flex items-start justify-between gap-4",
                      idx === 0 ? "bg-white border-blue-400 shadow-sm ring-1 ring-blue-400/20" : "bg-slate-50/60 border-slate-200"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 text-xs font-black rounded-lg", idx === 0 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700")}>
                          {ver.version}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Phiên bản hiện tại (Active)
                          </span>
                        )}
                        <span className="text-xs text-slate-400">• {ver.updatedAt}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800">{ver.note}</p>
                      <p className="text-[11px] text-slate-500">
                        Cập nhật bởi: <span className="font-medium text-slate-700">{ver.updatedBy}</span> • Kích thước: {ver.size}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => alert(`Tải về phiên bản ${ver.version}`)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200"
                      >
                        Tải về
                      </button>
                      {idx !== 0 && (
                        <button
                          onClick={() => {
                            alert(`Đã khôi phục phiên bản ${ver.version} làm bản hiện tại!`);
                            setVersionDoc(null);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
                        >
                          Khôi phục
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TẠO THƯ MỤC MỚI */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-indigo-600" /> Tạo Thư Mục Mới
            </h3>
            <p className="text-xs text-slate-500">
              Thư mục mới sẽ kế thừa phân quyền từ thư mục đang chọn ({getFolderBreadcrumb(selectedFolderId).slice(-1)[0]}).
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên thư mục</label>
              <input
                type="text"
                placeholder="VD: Hợp đồng đại lý 2026..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewFolderOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newFolderName.trim()) return;
                  alert(`Đã tạo thư mục: "${newFolderName}"`);
                  setIsNewFolderOpen(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
              >
                Xác nhận tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
