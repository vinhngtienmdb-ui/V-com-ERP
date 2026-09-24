import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Star,
  Trash2,
  Tag,
  Clock,
  CheckSquare,
  Square,
  Share2,
  Copy,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Edit3,
  Calendar,
  X
} from 'lucide-react';

interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: 'meeting' | 'project' | 'idea' | 'personal';
  tags: string[];
  pinned: boolean;
  starred: boolean;
  cardTheme: {
    bg: string;
    border: string;
    badge: string;
    accent: string;
  };
  updatedAt: string;
  todos: { id: string; text: string; done: boolean }[];
}

export const QuickNotes: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'NOTE-001',
      title: 'Biên bản Họp Chiến lược Q4/2026 - Ban Giám đốc',
      content: `1. Thống nhất mục tiêu tăng trưởng GMV thương mại điện tử đạt 120 tỷ VNĐ trong quý 4.
2. Chuyển đổi toàn diện hệ thống chứng từ kế toán theo Thông tư 99/2025/TT-BTC từ ngày 01/10.
3. Ký kết hạn mức vốn lưu động 5 tỷ VNĐ với Techcombank SME.
4. Triển khai kho thông minh WMS tại chi nhánh Tân Bình, tích hợp mã vạch QR/RFID.`,
      category: 'meeting',
      tags: ['Chiến lược', 'Q4-2026', 'Ban Giám đốc'],
      pinned: true,
      starred: true,
      cardTheme: {
        bg: 'bg-amber-50/70',
        border: 'border-amber-200/80',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        accent: 'text-amber-700'
      },
      updatedAt: 'Hôm nay, 10:15',
      todos: [
        { id: 't1', text: 'Hoàn thiện hồ sơ thẩm định tín chấp với Techcombank', done: true },
        { id: 't2', text: 'Phổ biến tài liệu đào tạo TT99/2025 cho phòng Kế toán', done: false },
        { id: 't3', text: 'Kiểm tra chạy thử nghiệm WMS tại kho Bình Dương', done: false }
      ]
    },
    {
      id: 'NOTE-002',
      title: 'Ý tưởng Tối ưu hóa Tỷ lệ Chuyển đổi Storefront VComm',
      content: `• Tích hợp tính năng AI Chatbot tư vấn sản phẩm trực tiếp dựa trên lịch sử mua hàng.
• Thêm huy hiệu "Đã kiểm định chính hãng 100%" trên trang chi tiết sản phẩm.
• Áp dụng chính sách Freeship Extra cho các đơn hàng trên 300k.`,
      category: 'idea',
      tags: ['Growth', 'E-commerce', 'UX/UI'],
      pinned: true,
      starred: false,
      cardTheme: {
        bg: 'bg-blue-50/70',
        border: 'border-blue-200/80',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        accent: 'text-blue-700'
      },
      updatedAt: 'Hôm qua, 16:40',
      todos: [
        { id: 't4', text: 'Thiết kế banner sự kiện Mega Sale 10.10', done: true },
        { id: 't5', text: 'A/B testing luồng thanh toán 1-click', done: false }
      ]
    },
    {
      id: 'NOTE-003',
      title: 'Kế hoạch Phỏng vấn Ứng viên Tech Lead Backend',
      content: `Hội đồng: Anh Tuấn (CTO) + Chị Lan (HR Manager).
Câu hỏi trọng tâm:
- Kinh nghiệm thiết kế hệ thống chịu tải cao > 10.000 TPS trong ngày sale.
- Giải pháp xử lý race condition tồn kho phân tán.
- Kiến trúc microservices trên nền tảng Docker & Kubernetes.`,
      category: 'project',
      tags: ['Tuyển dụng', 'Tech Lead', 'R&D'],
      pinned: false,
      starred: true,
      cardTheme: {
        bg: 'bg-purple-50/70',
        border: 'border-purple-200/80',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        accent: 'text-purple-700'
      },
      updatedAt: '15/09/2026',
      todos: [
        { id: 't6', text: 'Gửi link bài test Codility cho ứng viên', done: true },
        { id: 't7', text: 'Xếp phòng họp trực tuyến Google Meet', done: true }
      ]
    },
    {
      id: 'NOTE-004',
      title: 'Ghi chú Khảo sát Nhà cung cấp Bao bì Thân thiện Môi trường',
      content: `Đã liên hệ 3 đơn vị sản xuất hộp carton tái chế đạt chuẩn FSC:
- Công ty Giấy Đồng Nai: Giá 4.200đ/hộp, MOQ 10.000 hộp.
- Bao bì Toàn Cầu: Giá 3.900đ/hộp, hỗ trợ in logo dập nổi miễn phí.
Cần chốt phương án trước ngày 25/09 để kịp sản xuất.`,
      category: 'project',
      tags: ['Thu mua', 'Bao bì', 'Supply Chain'],
      pinned: false,
      starred: false,
      cardTheme: {
        bg: 'bg-emerald-50/70',
        border: 'border-emerald-200/80',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        accent: 'text-emerald-700'
      },
      updatedAt: '13/09/2026',
      todos: [
        { id: 't8', text: 'Yêu cầu gửi mẫu sản phẩm thực tế về văn phòng', done: true }
      ]
    }
  ]);

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || n.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const toggleTodo = (noteId: string, todoId: string) => {
    setNotes(prev => prev.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          todos: note.todos.map(t => t.id === todoId ? { ...t, done: !t.done } : t)
        };
      }
      return note;
    }));
  };

  const togglePin = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, pinned: !n.pinned } : n));
    showToast('Đã cập nhật trạng thái ghim ghi chú');
  };

  const toggleStar = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, starred: !n.starred } : n));
  };

  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (activeNote?.id === noteId) setActiveNote(null);
    showToast('Đã xóa ghi chú thành công');
  };

  const handleCreateNewNote = () => {
    const newNote: NoteItem = {
      id: `NOTE-${Date.now().toString().slice(-4)}`,
      title: 'Ghi chú mới chưa đặt tên',
      content: 'Bắt đầu nhập nội dung ghi chép tại đây...',
      category: 'project',
      tags: ['Chưa phân loại'],
      pinned: false,
      starred: false,
      cardTheme: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        accent: 'text-slate-700'
      },
      updatedAt: 'Vừa xong',
      todos: []
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
    showToast('Đã tạo ghi chú mới');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Sổ tay Công việc & Biên bản Họp Thông minh</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Sổ tay Ghi chép & Nhiệm vụ Cá nhân (QuickNotes)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ghi chép nhanh ý tưởng, cuộc họp, danh sách việc cần làm (Checklist to-do) và đồng bộ tức thì trên mọi thiết bị.
          </p>
        </div>

        <button
          onClick={handleCreateNewNote}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tạo ghi chú mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'meeting', label: 'Biên bản Họp' },
            { id: 'project', label: 'Dự án & Vận hành' },
            { id: 'idea', label: 'Ý tưởng sáng tạo' },
            { id: 'personal', label: 'Cá nhân' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo từ khóa, thẻ tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64 transition"
          />
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNotes.map(note => (
          <div
            key={note.id}
            onClick={() => setActiveNote(note)}
            className={`p-5 rounded-2xl border ${note.cardTheme.border} ${note.cardTheme.bg} cursor-pointer hover:shadow-md transition duration-200 flex flex-col justify-between group shadow-xs relative`}
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                  {note.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => toggleStar(note.id, e)}
                    className={`p-1 rounded-lg hover:bg-white/60 transition ${note.starred ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Star className={`w-4 h-4 ${note.starred ? 'fill-amber-400' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => togglePin(note.id, e)}
                    className={`p-1 rounded-lg hover:bg-white/60 transition ${note.pinned ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Pin className={`w-4 h-4 ${note.pinned ? 'fill-indigo-500' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Note Excerpt */}
              <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed whitespace-pre-line mb-4 font-normal">
                {note.content}
              </p>

              {/* Todos Preview if any */}
              {note.todos.length > 0 && (
                <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 mb-4 space-y-1.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Checklist ({note.todos.filter(t => t.done).length}/{note.todos.length})
                  </span>
                  {note.todos.slice(0, 3).map(todo => (
                    <div
                      key={todo.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTodo(note.id, todo.id);
                      }}
                      className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      {todo.done ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className={todo.done ? 'line-through text-slate-400' : 'font-medium'}>
                        {todo.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags and Footer */}
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag, idx) => (
                  <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${note.cardTheme.badge}`}>
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 whitespace-nowrap font-medium">
                <Clock className="w-3 h-3 text-slate-400" />
                {note.updatedAt}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Note Editor Modal */}
      {activeNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-700">Chi tiết Ghi chú</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${activeNote.title}\n\n${activeNote.content}`);
                    showToast('Đã sao chép nội dung ghi chú vào bộ nhớ tạm!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Sao chép ghi chú"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Sao chép
                </button>
                <button
                  onClick={() => setActiveNote(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">Tiêu đề ghi chú:</label>
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setActiveNote({ ...activeNote, title: newTitle });
                    setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, title: newTitle } : n));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-base focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Nội dung chi tiết:</label>
                <textarea
                  rows={8}
                  value={activeNote.content}
                  onChange={(e) => {
                    const newContent = e.target.value;
                    setActiveNote({ ...activeNote, content: newContent });
                    setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, content: newContent } : n));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 leading-relaxed font-sans focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none text-xs transition"
                />
              </div>

              {/* Checklist Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-2">Danh sách đầu việc (Checklist):</span>
                <div className="space-y-2">
                  {activeNote.todos.map(todo => (
                    <div
                      key={todo.id}
                      onClick={() => toggleTodo(activeNote.id, todo.id)}
                      className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900"
                    >
                      {todo.done ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span className={todo.done ? 'line-through text-slate-400' : 'font-medium'}>
                        {todo.text}
                      </span>
                    </div>
                  ))}
                  {activeNote.todos.length === 0 && (
                    <div className="text-slate-400 text-xs italic">Chưa có đầu việc con trong ghi chú này.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Tự động lưu vào Local ERP Storage</span>
              <button
                onClick={() => {
                  setActiveNote(null);
                  showToast('Đã lưu nội dung ghi chú thành công!');
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
