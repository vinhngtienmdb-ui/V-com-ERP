import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  FileText, 
  Search, 
  Filter, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  Trophy, 
  Calendar, 
  Share2, 
  Download, 
  ChevronRight, 
  RotateCcw,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Layers,
  Users
} from 'lucide-react';
import { 
  Course, 
  LearningPath, 
  Certificate, 
  QuizQuestion,
  initialCourses, 
  initialLearningPaths, 
  initialCertificates 
} from '../data/lmsData';

export const LMSManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [paths] = useState<LearningPath[]>(initialLearningPaths);
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  
  const [activeTab, setActiveTab] = useState<'catalog' | 'paths' | 'certificates'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Trình xem khóa học / Học tập
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  // Modal Chứng chỉ chi tiết
  const [viewCertificate, setViewCertificate] = useState<Certificate | null>(null);

  // Lọc khóa học
  const filteredCourses = courses.filter(c => {
    const matchCat = selectedCategory === 'all' || c.category === selectedCategory;
    const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // Số liệu tổng hợp
  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.status === 'completed').length;
  const inProgressCourses = courses.filter(c => c.status === 'in_progress').length;
  const totalCertificates = certificates.length;

  // Xử lý nộp bài trắc nghiệm
  const handleSubmitQuiz = (questions: QuizQuestion[]) => {
    let correctCount = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    setQuizScore(calculatedScore);
    setQuizSubmitted(true);

    if (activeCourse && calculatedScore >= activeCourse.passingScore) {
      // Cập nhật trạng thái khóa học hoàn thành 100%
      setCourses(prev => prev.map(c => {
        if (c.id === activeCourse.id) {
          return { ...c, progress: 100, status: 'completed' };
        }
        return c;
      }));

      // Tự động cấp Chứng chỉ số mới nếu chưa có
      const existingCert = certificates.find(cert => cert.courseId === activeCourse.id);
      if (!existingCert) {
        const newCert: Certificate = {
          id: `CERT-${Date.now().toString().slice(-6)}`,
          courseId: activeCourse.id,
          courseTitle: activeCourse.title,
          studentName: 'Nguyễn Văn A (Mã NV: VC-0042)',
          issuedDate: new Date().toISOString().split('T')[0],
          expirationDate: 'Vô thời hạn',
          score: calculatedScore,
          credentialCode: `VCOMM-${activeCourse.id}-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'valid'
        };
        setCertificates(prev => [newCert, ...prev]);
      }
    }
  };

  const handleCompleteLesson = (lessonId: string) => {
    if (!activeCourse) return;
    const updatedLessons = activeCourse.lessons.map(l => 
      l.id === lessonId ? { ...l, completed: true } : l
    );
    const completedCount = updatedLessons.filter(l => l.completed).length;
    const newProgress = Math.round((completedCount / updatedLessons.length) * (activeCourse.quiz ? 80 : 100));
    
    const updatedCourse = {
      ...activeCourse,
      lessons: updatedLessons,
      progress: newProgress,
      status: newProgress === 100 ? ('completed' as const) : ('in_progress' as const)
    };

    setActiveCourse(updatedCourse);
    setCourses(prev => prev.map(c => c.id === activeCourse.id ? updatedCourse : c));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header & Dashboard Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            VComm Academy & Enterprise LMS
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Hệ Thống Đào Tạo & Khảo Thí Doanh Nghiệp</h1>
          <p className="text-indigo-200 text-sm md:text-base max-w-2xl">
            Nâng cao năng lực nhân sự với các khóa học chuẩn hóa O2O, quy trình bán lẻ thực chiến, sát hạch cấp chứng chỉ số và lộ trình hội nhập bắt buộc.
          </p>
        </div>

        {/* Stats Grid on Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
            <BookOpen className="w-5 h-5 mx-auto text-indigo-300 mb-1" />
            <div className="text-xl font-bold">{totalCourses}</div>
            <div className="text-xs text-indigo-200">Khóa học</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
            <Clock className="w-5 h-5 mx-auto text-amber-300 mb-1" />
            <div className="text-xl font-bold">{inProgressCourses}</div>
            <div className="text-xs text-indigo-200">Đang học</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-300 mb-1" />
            <div className="text-xl font-bold">{completedCourses}</div>
            <div className="text-xs text-indigo-200">Hoàn thành</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
            <Award className="w-5 h-5 mx-auto text-yellow-300 mb-1" />
            <div className="text-xl font-bold">{totalCertificates}</div>
            <div className="text-xs text-indigo-200">Chứng chỉ</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-2 rounded-xl shadow-sm">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'catalog'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Kho Khóa Học ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('paths')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'paths'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Lộ Trình Bắt Buộc ({paths.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'certificates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            Chứng Chỉ Điện Tử ({certificates.length})
          </button>
        </div>
      </div>

      {/* TAB 1: KHO KHÓA HỌC (CATALOG) */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search & Categories Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'onboarding', label: 'Hội nhập Onboarding' },
                { id: 'sales', label: 'Kinh doanh & Dịch vụ' },
                { id: 'operations', label: 'Vận hành & Kho vận' },
                { id: 'security', label: 'Bảo mật & CNTT' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm khóa học, giảng viên..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => {
              const isDone = course.status === 'completed';
              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
                >
                  {/* Thumbnail / Header */}
                  <div className="relative h-44 overflow-hidden bg-slate-800">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/30"></div>
                    
                    {/* Badge Category & Mandatory */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-md text-[11px] font-bold text-indigo-800 shadow-sm">
                        {course.category === 'onboarding' ? 'Hội nhập' : 
                         course.category === 'sales' ? 'Kinh doanh' : 
                         course.category === 'operations' ? 'Vận hành' : 'Bảo mật'}
                      </span>
                      {course.mandatory && (
                        <span className="px-2.5 py-1 bg-rose-600/90 backdrop-blur-md rounded-md text-[11px] font-bold text-white shadow-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Bắt buộc
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="text-xs text-indigo-200 mb-1 flex items-center gap-2">
                        <span>{course.instructor}</span>
                        <span>•</span>
                        <span>{course.duration}</span>
                      </div>
                      <h3 className="font-bold text-base line-clamp-1 group-hover:text-indigo-200 transition-colors">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="space-y-3">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-600">Tiến độ đào tạo</span>
                          <span className={isDone ? 'text-emerald-600' : 'text-indigo-600'}>
                            {course.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isDone ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          {course.lessons.length} bài học
                        </span>
                        {course.quiz && (
                          <span className="flex items-center gap-1 text-amber-600 font-medium">
                            <Trophy className="w-3.5 h-3.5" />
                            Đạt {course.passingScore}% nhận chứng chỉ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        setActiveCourse(course);
                        setActiveLessonIndex(0);
                        setQuizActive(false);
                        setQuizSubmitted(false);
                        setUserAnswers({});
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : course.progress > 0
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Xem lại khóa học
                        </>
                      ) : course.progress > 0 ? (
                        <>
                          <PlayCircle className="w-4 h-4" /> Tiếp tục học bài
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" /> Bắt đầu khóa học
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LỘ TRÌNH ĐÀO TẠO BẮT BUỘC (PATHS) */}
      {activeTab === 'paths' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <span className="font-bold">Lưu ý tuân thủ:</span> Các lộ trình bắt buộc liên quan trực tiếp đến hồ sơ thử việc, thẩm định bổ nhiệm và chỉ số kỷ luật học tập định kỳ của cán bộ nhân viên. Vui lòng hoàn tất trước thời hạn quy định.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paths.map(path => (
              <div key={path.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-bold">
                      {path.role}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900 mt-2">{path.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{path.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-slate-400 block">Thời hạn</span>
                    <span className="text-xs font-semibold text-rose-600 flex items-center gap-1 justify-end mt-0.5">
                      <Calendar className="w-3.5 h-3.5" /> {path.deadline}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Tiến độ hoàn thành lộ trình</span>
                    <span className="text-indigo-600 font-bold">{path.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${path.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Courses inside Path */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700">Các học phần trong lộ trình:</div>
                  {path.courses.map((courseId, idx) => {
                    const foundCourse = courses.find(c => c.id === courseId);
                    if (!foundCourse) return null;
                    return (
                      <div
                        key={courseId}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-slate-800">{foundCourse.title}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            foundCourse.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {foundCourse.status === 'completed' ? 'Đã đạt' : 'Đang học'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CHỨNG CHỈ SỐ ĐIỆN TỬ (CERTIFICATES) */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map(cert => (
              <div
                key={cert.id}
                className="bg-gradient-to-b from-white to-slate-50 border-2 border-amber-200/80 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-100 rounded-full blur-2xl pointer-events-none"></div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-600">
                      <Trophy className="w-6 h-6" />
                      <span className="text-xs font-bold uppercase tracking-wider">VComm Digital Credential</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Hợp lệ
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 line-clamp-2 pt-1">
                    {cert.courseTitle}
                  </h3>

                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200/60">
                    <div>Cấp cho: <span className="font-semibold text-slate-800">{cert.studentName}</span></div>
                    <div>Ngày cấp: <span className="font-semibold text-slate-800">{cert.issuedDate}</span></div>
                    <div>Điểm kiểm tra: <span className="font-bold text-indigo-600">{cert.score}/100</span></div>
                    <div>Mã tra cứu: <span className="font-mono text-xs font-bold text-slate-700">{cert.credentialCode}</span></div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center gap-2">
                  <button
                    onClick={() => setViewCertificate(cert)}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Xem chứng chỉ
                  </button>
                  <button
                    onClick={() => alert(`Đã sao chép mã xác thực: ${cert.credentialCode}`)}
                    className="p-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors"
                    title="Sao chép liên kết chứng chỉ"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL TRÌNH HỌC TẬP & SÁT HẠCH (COURSE VIEWER) */}
      {activeCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-indigo-600 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-white" />
                </span>
                <div>
                  <h2 className="text-base font-bold">{activeCourse.title}</h2>
                  <div className="text-xs text-indigo-300">Giảng viên: {activeCourse.instructor} • Tiến độ: {activeCourse.progress}%</div>
                </div>
              </div>
              <button
                onClick={() => setActiveCourse(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Left Player / Quiz, Right Curriculum */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
              {/* Left Column: Video/Doc or Quiz */}
              <div className="lg:col-span-2 p-6 overflow-y-auto bg-slate-50 border-r border-slate-200 flex flex-col justify-between">
                {!quizActive ? (
                  /* Lesson View */
                  <div className="space-y-5">
                    {/* Media Area */}
                    <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative shadow-inner flex items-center justify-center text-white">
                      {activeCourse.lessons[activeLessonIndex]?.type === 'video' ? (
                        <div className="text-center space-y-2 p-4">
                          <PlayCircle className="w-16 h-16 mx-auto text-indigo-400 opacity-90 animate-pulse cursor-pointer hover:scale-110 transition-transform" />
                          <div className="font-semibold text-sm">Trình phát Video Bài giảng Chuẩn HD</div>
                          <div className="text-xs text-slate-400">Thời lượng: {activeCourse.lessons[activeLessonIndex]?.duration}</div>
                        </div>
                      ) : (
                        <div className="text-center space-y-2 p-4">
                          <FileText className="w-16 h-16 mx-auto text-amber-400" />
                          <div className="font-semibold text-sm">Tài liệu Bài giảng E-learning Đính kèm</div>
                          <div className="text-xs text-slate-400">Vui lòng đọc kỹ nội dung bên dưới</div>
                        </div>
                      )}
                    </div>

                    {/* Lesson Content Description */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {activeCourse.lessons[activeLessonIndex]?.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
                        Bài giảng cung cấp các quy định thao tác chuẩn, tình huống thực tế thường gặp và các kịch bản mẫu áp dụng tại chuỗi chi nhánh VComm. Học viên cần theo dõi hết nội dung trước khi thực hiện bài sát hạch cấp chứng chỉ.
                      </p>
                    </div>

                    {/* Mark Complete Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <button
                        onClick={() => handleCompleteLesson(activeCourse.lessons[activeLessonIndex]?.id)}
                        className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                          activeCourse.lessons[activeLessonIndex]?.completed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        {activeCourse.lessons[activeLessonIndex]?.completed ? 'Đã hoàn thành bài này' : 'Đánh dấu đã hoàn thành'}
                      </button>

                      {activeLessonIndex < activeCourse.lessons.length - 1 ? (
                        <button
                          onClick={() => setActiveLessonIndex(prev => prev + 1)}
                          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                        >
                          Bài tiếp theo <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        activeCourse.quiz && (
                          <button
                            onClick={() => setQuizActive(true)}
                            className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                          >
                            <Trophy className="w-4 h-4" /> Vào làm bài Sát hạch Quiz
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  /* Quiz View */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-500" />
                          Bài Sát Hạch Cấp Chứng Chỉ: {activeCourse.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Yêu cầu điểm số tối thiểu để đạt: <span className="font-bold text-indigo-600">{activeCourse.passingScore}%</span>
                        </p>
                      </div>
                      <button
                        onClick={() => setQuizActive(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
                      >
                        Quay lại bài giảng
                      </button>
                    </div>

                    {/* Quiz Questions */}
                    <div className="space-y-6">
                      {activeCourse.quiz?.map((q, qIndex) => (
                        <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                          <div className="font-semibold text-xs text-slate-900 flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                              {qIndex + 1}
                            </span>
                            <span>{q.question}</span>
                          </div>

                          <div className="space-y-2 pl-7">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = userAnswers[q.id] === optIdx;
                              const isCorrect = q.correctAnswer === optIdx;
                              let style = "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700";
                              if (quizSubmitted) {
                                if (isCorrect) style = "bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold";
                                else if (isSelected && !isCorrect) style = "bg-rose-50 border-rose-400 text-rose-900";
                              } else if (isSelected) {
                                style = "bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  disabled={quizSubmitted}
                                  onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${style}`}
                                >
                                  <span>{opt}</span>
                                  {quizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                                  {quizSubmitted && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-600" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quiz Result / Submit Footer */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      {quizSubmitted ? (
                        <div className="flex items-center gap-4">
                          <div className={`text-sm font-bold ${quizScore >= activeCourse.passingScore ? 'text-emerald-600' : 'text-rose-600'}`}>
                            Kết quả: {quizScore}% ({quizScore >= activeCourse.passingScore ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT'})
                          </div>
                          {quizScore < activeCourse.passingScore && (
                            <button
                              onClick={() => {
                                setQuizSubmitted(false);
                                setUserAnswers({});
                              }}
                              className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Làm lại bài thi
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSubmitQuiz(activeCourse.quiz || [])}
                          className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all ml-auto"
                        >
                          Nộp bài & Chấm điểm tự động
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Curriculum Outline */}
              <div className="p-5 bg-white overflow-y-auto space-y-4">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-500">Nội dung khóa học</div>

                <div className="space-y-2">
                  {activeCourse.lessons.map((lesson, idx) => (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setActiveLessonIndex(idx);
                        setQuizActive(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                        !quizActive && activeLessonIndex === idx
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-semibold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {lesson.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : lesson.type === 'video' ? (
                          <PlayCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="line-clamp-1">{lesson.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 ml-2">{lesson.duration}</span>
                    </button>
                  ))}

                  {/* Quiz Item in Outline */}
                  {activeCourse.quiz && (
                    <button
                      onClick={() => setQuizActive(true)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                        quizActive
                          ? 'bg-amber-50 border-amber-500 text-amber-900 font-semibold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span>Bài thi trắc nghiệm ({activeCourse.quiz.length} câu)</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-600">Đạt {activeCourse.passingScore}%</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM CHỨNG CHỈ SỐ ĐIỆN TỬ (DIGITAL CERTIFICATE PREVIEW) */}
      {viewCertificate && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 border-4 border-amber-400/80 rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative text-center space-y-6">
            <button
              onClick={() => setViewCertificate(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-amber-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Emblem */}
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg border-4 border-white">
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-700">VComm Academy • Chứng nhận Đào tạo Doanh nghiệp</div>
              <h2 className="text-2xl font-serif font-black text-slate-900">CHỨNG CHỈ HOÀN THÀNH</h2>
              <div className="text-xs text-slate-500">Xác nhận cán bộ nhân sự đã vượt qua kỳ sát hạch chuyên môn</div>
            </div>

            <div className="py-3 border-y border-amber-200/80 my-4 space-y-2">
              <div className="text-xs text-slate-500">Chứng nhận trao tặng cho:</div>
              <div className="text-xl font-bold text-indigo-950 font-serif">{viewCertificate.studentName}</div>
              <div className="text-xs text-slate-600">Đã hoàn thành xuất sắc khóa huấn luyện:</div>
              <div className="text-base font-bold text-amber-900">{viewCertificate.courseTitle}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs text-slate-600 bg-white/80 p-4 rounded-xl border border-amber-200">
              <div>
                <span className="block text-slate-400 text-[10px]">Ngày cấp</span>
                <span className="font-semibold">{viewCertificate.issuedDate}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px]">Điểm sát hạch</span>
                <span className="font-bold text-emerald-600">{viewCertificate.score}/100</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px]">Mã định danh</span>
                <span className="font-mono font-bold text-indigo-700">{viewCertificate.credentialCode}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  alert(`Đã tải xuống file chứng chỉ điện tử PDF cho mã: ${viewCertificate.credentialCode}`);
                }}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all"
              >
                <Download className="w-4 h-4" /> Tải chứng chỉ (PDF)
              </button>
              <button
                onClick={() => setViewCertificate(null)}
                className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
