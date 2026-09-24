import React, { useState } from 'react';
import { 
  Trash2, ShieldAlert, FileText, CheckCircle2, AlertTriangle, 
  Users, Calendar, Flame, Scissors, HardDrive, Printer, Download
} from 'lucide-react';
import { SAMPLE_BO_HO_SO, BoHoSoItem } from '../../data/danhMucHoSoData';

export const TieuHuyTaiLieuPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Eligible items for destruction: expired & not VINH_VIEN
  const [eligibleItems, setEligibleItems] = useState<BoHoSoItem[]>(() => {
    return SAMPLE_BO_HO_SO.filter(h => h.id === 'hs-4'); // Sample expired item
  });

  const [danhMucMa, setDanhMucMa] = useState('DMTH-2026-01');
  const [bienBanMa, setBienBanMa] = useState('BBTH-2026-01');

  // Council members
  const [chuTich, setChuTich] = useState('Nguyễn Văn An (Tổng Giám đốc)');
  const [thanhVien1, setThanhVien1] = useState('Trần Thị Bình (Kế toán trưởng)');
  const [thanhVien2, setThanhVien2] = useState('Lê Văn Cường (Thủ kho tài liệu)');
  const [ngayHop, setNgayHop] = useState('2026-03-20');
  const [hinhThuc, setHinhThuc] = useState<'NGHIEN' | 'DOT' | 'XOA_DIEN_TU'>('NGHIEN');

  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const handleConfirmDestruction = () => {
    // Strict business rules: HSo-12, HSo-13
    const hasVinhVien = eligibleItems.some(i => i.thoiHanLuuTru === 'VINH_VIEN');
    if (hasVinhVien) {
      alert('LỖI NGHIÊM TRỌNG (HSo-12): Không thể tiêu hủy hồ sơ có thời hạn lưu trữ VĨNH VIỄN theo NĐ 174 Điều 14!');
      return;
    }

    if (eligibleItems.length === 0) {
      alert('Không có hồ sơ nào trong danh mục tiêu hủy!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xác nhận đã tiêu hủy ${eligibleItems.length} bộ hồ sơ theo Biên bản ${bienBanMa}? Thao tác này sẽ ghi nhận vào lịch sử lưu trữ bất biến và không xóa dữ liệu gốc.`)) {
      return;
    }

    setIsCompleted(true);
    alert(`Xác nhận hoàn tất tiêu hủy tài liệu kế toán. Biên bản ${bienBanMa} đã được tự động lưu trữ 10 năm theo NĐ 174 Điều 13 khoản 1.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <Trash2 className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quy trình Tiêu hủy Tài liệu Kế toán (NĐ 174/2016/NĐ-CP Điều 16)
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Chỉ được tiêu hủy tài liệu hết thời hạn lưu trữ và có quyết định của Hội đồng tiêu hủy. Không xóa vật lý dữ liệu phần mềm — chỉ đổi trạng thái lưu trữ và lưu biên bản 10 năm.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, title: 'BƯỚC 1: Kiểm kê tài liệu đủ điều kiện' },
          { num: 2, title: 'BƯỚC 2: Lập danh mục đề xuất' },
          { num: 3, title: 'BƯỚC 3: Hội đồng tiêu hủy' },
          { num: 4, title: 'BƯỚC 4: Biên bản & Xác nhận' }
        ].map(step => (
          <button
            key={step.num}
            onClick={() => setCurrentStep(step.num)}
            className={`p-3 rounded-xl text-left border transition-all text-xs ${
              currentStep === step.num
                ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] opacity-80 uppercase tracking-wider">Bước {step.num}</div>
            <div className="truncate font-semibold mt-0.5">{step.title.split(': ')[1]}</div>
          </button>
        ))}
      </div>

      {/* Step 1: Kiểm kê */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Bước 1 — Kiểm kê tài liệu đã hết thời hạn lưu trữ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Điều kiện: ngay_het_han_luu_tru &lt; hôm nay AND trang_thai = 'DA_LUU_TRU' AND thoi_han_luu_tru &lt;&gt; 'VINH_VIEN'
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-lg border border-emerald-200">
              Tìm thấy {eligibleItems.length} hồ sơ đủ điều kiện
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Số hồ sơ</th>
                  <th className="py-2.5 px-4">Kỳ phát sinh</th>
                  <th className="py-2.5 px-4">Tên bộ hồ sơ</th>
                  <th className="py-2.5 px-4">Thời hạn</th>
                  <th className="py-2.5 px-4">Ngày hết hạn</th>
                  <th className="py-2.5 px-4">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eligibleItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{item.soHoSo}</td>
                    <td className="py-3 px-4">{item.ngayPhatSinh} (Năm {item.nam})</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.tenHoSo}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium">
                        10 Năm
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600">31/12/2025 (Đã hết hạn)</td>
                    <td className="py-3 px-4 text-slate-500">{item.ghiChu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-xs"
            >
              Chuyển sang Bước 2: Lập danh mục đề xuất ➔
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Danh mục tiêu hủy */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Bước 2 — Danh mục tài liệu đề xuất tiêu hủy</span>
                <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                  {danhMucMa}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Căn cứ NĐ 174 Điều 16 khoản 1: Lập danh mục chi tiết kèm thời hạn và lý do tiêu hủy
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                <Printer className="w-3.5 h-3.5" />
                In danh mục
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between font-semibold text-slate-700">
              <span>Đơn vị: CÔNG TY CỔ PHẦN CÔNG NGHỆ VCOMM</span>
              <span>Ngày lập danh mục: 20/03/2026</span>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">STT</th>
                    <th className="py-2 px-3">Mã hồ sơ</th>
                    <th className="py-2 px-3">Tên tài liệu / Hồ sơ</th>
                    <th className="py-2 px-3">Thời gian lưu trữ</th>
                    <th className="py-2 px-3">Số lượng</th>
                    <th className="py-2 px-3">Lý do tiêu hủy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eligibleItems.map((item, i) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3 text-center">{i + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{item.soHoSo}</td>
                      <td className="py-2.5 px-3 font-medium">{item.tenHoSo}</td>
                      <td className="py-2.5 px-3">2015 – 2025 (10 năm)</td>
                      <td className="py-2.5 px-3">01 Hộp (45 chứng từ)</td>
                      <td className="py-2.5 px-3 text-slate-600">Đã hết thời hạn theo NĐ 174 Điều 13</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between pt-3">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50"
            >
              ⬅ Quay lại Bước 1
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-xs"
            >
              Chuyển sang Bước 3: Hội đồng tiêu hủy ➔
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Hội đồng tiêu hủy */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Bước 3 — Thành lập Hội đồng tiêu hủy tài liệu (NĐ 174 Điều 16 khoản 2)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hội đồng bắt buộc gồm: Lãnh đạo đơn vị (Chủ tịch), Kế toán trưởng, Thủ kho/người phụ trách lưu trữ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chủ tịch Hội đồng (Người đại diện pháp luật) *
              </label>
              <input
                type="text"
                value={chuTich}
                onChange={(e) => setChuTich(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kế toán trưởng / Phụ trách kế toán *
              </label>
              <input
                type="text"
                value={thanhVien1}
                onChange={(e) => setThanhVien1(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Thành viên (Người làm lưu trữ / Thủ kho) *
              </label>
              <input
                type="text"
                value={thanhVien2}
                onChange={(e) => setThanhVien2(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ngày họp hội đồng *
              </label>
              <input
                type="date"
                value={ngayHop}
                onChange={(e) => setNgayHop(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              Phương pháp tiêu hủy được Hội đồng phê chuẩn *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'NGHIEN', label: 'Nghiền cắt vụn giấy', icon: Scissors, desc: 'Máy hủy công nghiệp chuẩn P-4' },
                { id: 'DOT', label: 'Đốt tiêu hủy tập trung', icon: Flame, desc: 'Lò đốt chuyên dụng có giám sát' },
                { id: 'XOA_DIEN_TU', label: 'Xóa an toàn dữ liệu', icon: HardDrive, desc: 'Ghi đè bit 7 lần chuẩn DoD' },
              ].map(method => {
                const Icon = method.icon;
                const active = hinhThuc === method.id;
                return (
                  <div
                    key={method.id}
                    onClick={() => setHinhThuc(method.id as any)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      active ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <span className="font-bold text-slate-900">{method.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{method.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between pt-3">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50"
            >
              ⬅ Quay lại Bước 2
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-xs"
            >
              Chuyển sang Bước 4: Lập Biên bản & Xác nhận ➔
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Biên bản & Xác nhận */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Bước 4 — Biên bản tiêu hủy tài liệu kế toán</span>
                <span className="font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs font-bold">
                  {bienBanMa}
                </span>
              </h2>
              <p className="text-xs text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Nghị định 174/2016 Điều 13 khoản 1: Biên bản tiêu hủy BẮT BUỘC lưu trữ tối thiểu 10 năm!
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              <Printer className="w-3.5 h-3.5" />
              In biên bản PDF
            </button>
          </div>

          {/* Form biên bản */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs leading-relaxed text-slate-800">
            <div className="text-center space-y-1 pb-3 border-b border-slate-200">
              <div className="font-bold text-sm uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="font-semibold text-xs">Độc lập – Tự do – Hạnh phúc</div>
              <div className="text-[11px] text-slate-500 pt-1">Hà Nội, ngày {ngayHop.split('-')[2]} tháng {ngayHop.split('-')[1]} năm {ngayHop.split('-')[0]}</div>
              <div className="font-bold text-base text-slate-900 pt-2 uppercase">BIÊN BẢN TIÊU HỦY TÀI LIỆU KẾ TOÁN</div>
              <div className="font-mono text-slate-500">Số: {bienBanMa}</div>
            </div>

            <div className="space-y-1">
              <p>Hôm nay, ngày {ngayHop}, tại trụ sở Công ty Cổ phần Công nghệ VComm, Hội đồng tiêu hủy tài liệu kế toán gồm:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Ông/Bà: <strong>{chuTich}</strong> — Chủ tịch Hội đồng</li>
                <li>Ông/Bà: <strong>{thanhVien1}</strong> — Kế toán trưởng, Thành viên</li>
                <li>Ông/Bà: <strong>{thanhVien2}</strong> — Phụ trách lưu trữ, Thành viên</li>
              </ul>
            </div>

            <p>
              Đã tiến hành đánh giá, kiểm kê và nhất trí tiêu hủy {eligibleItems.length} bộ hồ sơ theo Danh mục tiêu hủy số <strong>{danhMucMa}</strong> do đã hết thời hạn lưu trữ theo quy định tại Luật Kế toán 2015 và Nghị định 174/2016/NĐ-CP.
            </p>

            <p>
              Hình thức tiêu hủy thực hiện: <strong>{hinhThuc === 'NGHIEN' ? 'Nghiền cắt vụn giấy' : hinhThuc === 'DOT' ? 'Đốt nhiệt độ cao' : 'Xóa an toàn dữ liệu điện tử'}</strong>, bảo đảm không thể phục hồi nội dung thông tin tài liệu.
            </p>

            <div className="grid grid-cols-3 text-center pt-6 font-semibold">
              <div>
                <span>NGƯỜI LÀM LƯU TRỮ</span>
                <div className="h-14"></div>
                <span>{thanhVien2.split(' (')[0]}</span>
              </div>
              <div>
                <span>KẾ TOÁN TRƯỞNG</span>
                <div className="h-14"></div>
                <span>{thanhVien1.split(' (')[0]}</span>
              </div>
              <div>
                <span>CHỦ TỊCH HỘI ĐỒNG</span>
                <div className="h-14"></div>
                <span>{chuTich.split(' (')[0]}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50"
            >
              ⬅ Quay lại Bước 3
            </button>

            <button
              onClick={handleConfirmDestruction}
              disabled={isCompleted}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-colors ${
                isCompleted ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isCompleted ? 'Đã hoàn tất tiêu hủy' : 'Xác nhận đã hoàn thành tiêu hủy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
