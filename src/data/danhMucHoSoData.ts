export interface LoaiHoSoItem {
  maLoai: string;
  maLoaiCha?: string;
  cap: 1 | 2 | 3;
  tenLoai: string;
  truc: 'NGHIEP_VU' | 'NGANH' | 'HOP_DONG';
  linhVuc?: string;
  thoiHanLuuTru: 'NAM_5' | 'NAM_10' | 'VINH_VIEN' | 'KE_THUA';
  mocTinhThoiHan: string;
  batBuoc: boolean;
  nguonTuDong: 'ERP' | 'KE_TOAN' | 'NGOAI' | 'KE_THUA';
  taiKhoanLienQuan?: string;
  canCuPhapLy?: string;
  moTa?: string;
}

export interface BoHoSoItem {
  id: string;
  soHoSo: string;
  tenHoSo: string;
  maLoaiHoSo: string;
  phanLoai: string; // e.g. "04 Hóa đơn đầu vào"
  kyKeToan: string;
  thang: number;
  nam: number;
  ngayPhatSinh: string; // YYYY-MM-DD
  hanDuaVaoLuuTru: string;
  doiTuongTen: string;
  hopDongSo?: string;
  hinhThucLuuTru: 'DIEN_TU' | 'VAT_LY' | 'CA_HAI';
  viTriTen?: string;
  thoiHanLuuTru: 'NAM_5' | 'NAM_10' | 'VINH_VIEN';
  tyLeDayDu: number; // 0..100
  trangThai: 'DANG_MO' | 'DA_DU' | 'DA_LUU_TRU' | 'DA_TIEU_HUY';
  tongGiaTri: number;
  ghiChu?: string;
  thanhPhan: ThanhPhanHoSoItem[];
  lichSu: LichSuHoSoItem[];
}

export interface ThanhPhanHoSoItem {
  id: string;
  maLoaiHoSo: string;
  tenThanhPhan: string;
  batBuoc: boolean;
  nguon: 'ERP' | 'KE_TOAN' | 'NGOAI';
  soHieu?: string;
  tenTaiLieu?: string;
  daCo: boolean;
  ngayDinhKem?: string;
}

export interface LichSuHoSoItem {
  id: string;
  thoiDiem: string;
  hanhDong: 'TAO' | 'GAN_CHUNG_TU' | 'GAN_TAI_LIEU' | 'GO_THANH_PHAN' | 'DANH_DAU_DAY_DU' | 'LUU_TRU' | 'DANH_DAU_VINH_VIEN' | 'IN_BIA' | 'XUAT_GOI' | 'TIEU_HUY';
  nguoiThucHien: string;
  vaiTro: string;
  moTa: string;
  chiTiet?: string;
}

export interface ViTriLuuTruItem {
  id: string;
  maViTri: string;
  tenViTri: string;
  loaiViTri: 'DIEN_TU' | 'VAT_LY' | 'THUE_NGOAI';
  donViThue?: string;
  hopDongLuuTru?: string;
  sucChua: number;
  dangDung: number;
  donVi: string;
  viTriChaId?: string;
  trangThai: 'HOAT_DONG' | 'DAY' | 'BAO_TRI';
  con?: ViTriLuuTruItem[];
}

// 18 Phần chuẩn theo NĐ 174 & Playbook
export const DANH_MUC_18_PHAN: { ma: string; ten: string; truc: 'NGHIEP_VU' | 'NGANH' | 'HOP_DONG'; moTa: string }[] = [
  { ma: '01', ten: 'Hồ sơ pháp lý doanh nghiệp', truc: 'NGHIEP_VU', moTa: 'ĐKKD, vốn điều lệ, con dấu, điều lệ công ty' },
  { ma: '02', ten: 'Sổ sách kế toán & BCTC', truc: 'NGHIEP_VU', moTa: 'Sổ cái, nhật ký chung, bảng cân đối tài khoản, BCTC' },
  { ma: '03', ten: 'Tiền mặt & Ngân hàng', truc: 'NGHIEP_VU', moTa: 'Phiếu thu, phiếu chi, sổ phụ, sao kê ngân hàng' },
  { ma: '04', ten: 'Hóa đơn đầu vào (Mua hàng)', truc: 'NGHIEP_VU', moTa: 'Hóa đơn GTGT mua vào, PO, phiếu nhập kho, ủy nhiệm chi' },
  { ma: '05', ten: 'Hóa đơn đầu ra (Bán hàng)', truc: 'NGHIEP_VU', moTa: 'Hóa đơn bán ra, phiếu xuất kho, biên bản bàn giao' },
  { ma: '06', ten: 'Tiền lương & Bảo hiểm', truc: 'NGHIEP_VU', moTa: 'Bảng chấm công, bảng tính lương, chứng từ nộp BHXH' },
  { ma: '07', ten: 'Tài sản cố định & CCDC', truc: 'NGHIEP_VU', moTa: 'Hồ sơ mua sắm TSCĐ, thẻ TSCĐ, biên bản kiểm kê, thanh lý' },
  { ma: '08', ten: 'Kê khai thuế & Nghĩa vụ NSNN', truc: 'NGHIEP_VU', moTa: 'Tờ khai GTGT, TNDN, TNCN, thông báo cơ quan thuế' },
  { ma: '09', ten: 'Chi phí trả trước & Phân bổ', truc: 'NGHIEP_VU', moTa: 'Bảng phân bổ 242, hợp đồng thuê nhà, bảo hiểm' },
  { ma: '10', ten: 'Vay vốn & Đầu tư tài chính', truc: 'NGHIEP_VU', moTa: 'Hợp đồng tín dụng, khế ước nhận nợ, sao kê trả lãi' },
  { ma: '11', ten: 'Kiểm toán, Thanh tra & Quyết toán', truc: 'NGHIEP_VU', moTa: 'Báo cáo kiểm toán, biên bản thanh tra thuế, quyết toán' },
  { ma: '12', ten: 'Lĩnh vực Thương mại (Checklist)', truc: 'NGANH', moTa: 'Checklist bổ sung: quản lý lô, bảo hành, chiết khấu' },
  { ma: '13', ten: 'Lĩnh vực Dịch vụ (Checklist)', truc: 'NGANH', moTa: 'Checklist bổ sung: nghiệm thu dịch vụ, bảng kê giờ công' },
  { ma: '14', ten: 'Lĩnh vực Sản xuất (Checklist)', truc: 'NGANH', moTa: 'Checklist bổ sung: định mức NVL, lệnh sản xuất, dở dang 154' },
  { ma: '15', ten: 'Lĩnh vực Xây dựng (Checklist)', truc: 'NGANH', moTa: 'Checklist bổ sung: dự toán, nhật ký công trình, khối lượng đợt' },
  { ma: '16', ten: 'Lĩnh vực Xuất nhập khẩu (Checklist)', truc: 'NGANH', moTa: 'Checklist bổ sung: tờ khai hải quan, Bill, C/O, LC' },
  { ma: '17', ten: 'Lĩnh vực Bất động sản (Checklist)', truc: 'NGANH', moTa: 'Checklist bổ sung: pháp lý dự án, tiến độ thanh toán' },
  { ma: '18', ten: 'Hợp đồng kinh tế & Pháp lý phụ', truc: 'HOP_DONG', moTa: 'Hợp đồng nguyên tắc, phụ lục, thanh lý hợp đồng' },
];

// Sample Tree categories
export const SAMPLE_DANH_MUC_LOAI_HO_SO: LoaiHoSoItem[] = [
  // Cấp 1
  { maLoai: '04', cap: 1, tenLoai: 'Phần 04 — Hóa đơn đầu vào (Mua hàng)', truc: 'NGHIEP_VU', thoiHanLuuTru: 'NAM_10', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: true, nguonTuDong: 'KE_TOAN', canCuPhapLy: 'NĐ 174/2016 Điều 13.6', moTa: 'Toàn bộ hồ sơ chứng minh nghiệp vụ mua hàng hóa dịch vụ đầu vào' },
  // Cấp 2
  { maLoai: '04.1', maLoaiCha: '04', cap: 2, tenLoai: 'Nhóm 04.1: Hóa đơn GTGT đầu vào', truc: 'NGHIEP_VU', thoiHanLuuTru: 'NAM_10', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: true, nguonTuDong: 'KE_TOAN' },
  { maLoai: '04.2', maLoaiCha: '04', cap: 2, tenLoai: 'Nhóm 04.2: Hồ sơ giao nhận & Kho', truc: 'NGHIEP_VU', thoiHanLuuTru: 'NAM_10', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: true, nguonTuDong: 'ERP' },
  { maLoai: '04.3', maLoaiCha: '04', cap: 2, tenLoai: 'Nhóm 04.3: Chứng từ thanh toán ngân hàng', truc: 'NGHIEP_VU', thoiHanLuuTru: 'NAM_10', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: true, nguonTuDong: 'KE_TOAN' },
  // Cấp 3
  { maLoai: '04.1.01', maLoaiCha: '04.1', cap: 3, tenLoai: 'Hóa đơn điện tử đầu vào (XML + PDF)', truc: 'NGHIEP_VU', thoiHanLuuTru: 'NAM_10', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: true, nguonTuDong: 'KE_TOAN', taiKhoanLienQuan: '1331, 331, 156, 642', canCuPhapLy: 'NĐ 123/2020 Điều 10', moTa: 'Bản gốc XML có chữ ký số của bên bán kèm bản thể hiện PDF' },
  { maLoai: '04.1.02', maLoaiCha: '04.1', cap: 3, tenLoai: 'Thông báo kết quả tra cứu hóa đơn TCT', truc: 'NGHIEP_VU', thoiHanLuuTru: 'NAM_10', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: false, nguonTuDong: 'NGOAI', moTa: 'Kết quả tra cứu trạng thái hoạt động của doanh nghiệp bán hàng' },
  { maLoai: '04.2.01', maLoaiCha: '04.2', cap: 3, tenLoai: 'Phiếu nhập kho (Mẫu 01-VT TT99)', truc: 'NGHIEP_VU', thoiHanLuuTru: 'NAM_10', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: true, nguonTuDong: 'ERP', taiKhoanLienQuan: '152, 156', canCuPhapLy: 'TT 99/2025/TT-BTC Mẫu 01-VT' },
  { maLoai: '04.2.02', maLoaiCha: '04.2', cap: 3, tenLoai: 'Biên bản giao nhận hàng hóa / Bàn giao', truc: 'NGHIEP_VU', thoiHanLuuTru: 'NAM_10', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: true, nguonTuDong: 'NGOAI' },
  { maLoai: '04.3.01', maLoaiCha: '04.3', cap: 3, tenLoai: 'Ủy nhiệm chi / Giấy báo Nợ ngân hàng', truc: 'NGHIEP_VU', thoiHanLuuTru: 'NAM_10', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: true, nguonTuDong: 'KE_TOAN', taiKhoanLienQuan: '112, 331', canCuPhapLy: 'Luật thuế GTGT (ngưỡng 5tr)' },

  // Cấp 1 Phần 01
  { maLoai: '01', cap: 1, tenLoai: 'Phần 01 — Hồ sơ pháp lý doanh nghiệp', truc: 'NGHIEP_VU', thoiHanLuuTru: 'VINH_VIEN', mocTinhThoiHan: 'NGAY_THANH_LAP', batBuoc: true, nguonTuDong: 'NGOAI', canCuPhapLy: 'NĐ 174/2016 Điều 14' },
  { maLoai: '01.1', maLoaiCha: '01', cap: 2, tenLoai: 'Nhóm 01.1: Giấy phép đăng ký kinh doanh & Điều lệ', truc: 'NGHIEP_VU', thoiHanLuuTru: 'VINH_VIEN', mocTinhThoiHan: 'NGAY_THANH_LAP', batBuoc: true, nguonTuDong: 'NGOAI' },
  { maLoai: '01.1.01', maLoaiCha: '01.1', cap: 3, tenLoai: 'Giấy chứng nhận đăng ký doanh nghiệp (các lần đổi)', truc: 'NGHIEP_VU', thoiHanLuuTru: 'VINH_VIEN', mocTinhThoiHan: 'NGAY_THANH_LAP', batBuoc: true, nguonTuDong: 'NGOAI', canCuPhapLy: 'NĐ 174 Điều 14.1' },

  // Cấp 1 Phần 05
  { maLoai: '05', cap: 1, tenLoai: 'Phần 05 — Hóa đơn đầu ra (Bán hàng)', truc: 'NGHIEP_VU', thoiHanLuuTru: 'NAM_10', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: true, nguonTuDong: 'KE_TOAN', canCuPhapLy: 'NĐ 174/2016 Điều 13.6' },
  { maLoai: '05.1', maLoaiCha: '05', cap: 2, tenLoai: 'Nhóm 05.1: Hóa đơn điện tử bán ra', truc: 'NGHIEP_VU', thoiHanLuuTru: 'NAM_10', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: true, nguonTuDong: 'KE_TOAN' },
  { maLoai: '05.1.01', maLoaiCha: '05.1', cap: 3, tenLoai: 'Hóa đơn điện tử bán hàng nội bộ phát hành', truc: 'NGHIEP_VU', thoiHanLuuTru: 'NAM_10', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: true, nguonTuDong: 'KE_TOAN', taiKhoanLienQuan: '511, 33311, 131' },

  // Cấp 1 Phần 14 (Ngành Sản xuất)
  { maLoai: '14', cap: 1, tenLoai: 'Phần 14 — Lĩnh vực Sản xuất (Checklist)', truc: 'NGANH', linhVuc: 'SAN_XUAT', thoiHanLuuTru: 'KE_THUA', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: false, nguonTuDong: 'KE_THUA' },
  { maLoai: '14.1', maLoaiCha: '14', cap: 2, tenLoai: 'Nhóm 14.1: Chi phí dở dang & Lệnh sản xuất', truc: 'NGANH', linhVuc: 'SAN_XUAT', thoiHanLuuTru: 'KE_THUA', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: false, nguonTuDong: 'KE_THUA' },
  { maLoai: '14.1.01', maLoaiCha: '14.1', cap: 3, tenLoai: 'Lệnh sản xuất / Phiếu yêu cầu xuất kho NVL', truc: 'NGANH', linhVuc: 'SAN_XUAT', thoiHanLuuTru: 'KE_THUA', mocTinhThoiHan: 'KET_THUC_NAM_TC', batBuoc: true, nguonTuDong: 'ERP', taiKhoanLienQuan: '154, 621' },
];

// Sample dossiers (Bộ hồ sơ)
export const SAMPLE_BO_HO_SO: BoHoSoItem[] = [
  {
    id: 'hs-1',
    soHoSo: 'HS-2026-03-0001',
    tenHoSo: 'Bộ hồ sơ mua máy chủ Cloud Server đợt 1',
    maLoaiHoSo: '04',
    phanLoai: '04 Hóa đơn đầu vào',
    kyKeToan: '2026',
    thang: 3,
    nam: 2026,
    ngayPhatSinh: '2026-03-01',
    hanDuaVaoLuuTru: '2027-12-31',
    doiTuongTen: 'Công ty Cổ phần Công nghệ ABC',
    hopDongSo: 'HĐ-2026/ABC-SERVER',
    hinhThucLuuTru: 'DIEN_TU',
    viTriTen: 'S3://vcomm-archive/2026/03/HS-0001',
    thoiHanLuuTru: 'NAM_10',
    tyLeDayDu: 100,
    trangThai: 'DA_DU',
    tongGiaTri: 125000000,
    ghiChu: 'Đã hoàn tất thanh toán chuyển khoản và nhận đủ HĐĐT XML',
    thanhPhan: [
      { id: 'tp-1', maLoaiHoSo: '04.1.01', tenThanhPhan: 'Hóa đơn điện tử XML + PDF', batBuoc: true, nguon: 'KE_TOAN', soHieu: 'HD-001234', tenTaiLieu: '0101234_ABC_001234.xml', daCo: true, ngayDinhKem: '2026-03-01' },
      { id: 'tp-2', maLoaiHoSo: '04.2.01', tenThanhPhan: 'Phiếu nhập kho Mẫu 01-VT', batBuoc: true, nguon: 'ERP', soHieu: 'PNK-2026-0042', tenTaiLieu: 'PNK_MayChu_ABC.pdf', daCo: true, ngayDinhKem: '2026-03-01' },
      { id: 'tp-3', maLoaiHoSo: '04.2.02', tenThanhPhan: 'Biên bản nghiệm thu bàn giao', batBuoc: true, nguon: 'NGOAI', soHieu: 'BBNT-01/ABC', tenTaiLieu: 'BienBanNghiemThu.pdf', daCo: true, ngayDinhKem: '2026-03-01' },
      { id: 'tp-4', maLoaiHoSo: '04.3.01', tenThanhPhan: 'Ủy nhiệm chi ngân hàng (≥ 5tr)', batBuoc: true, nguon: 'KE_TOAN', soHieu: 'UNC-MB-0091', tenTaiLieu: 'GiayBaoNo_MBBank.pdf', daCo: true, ngayDinhKem: '2026-03-02' },
    ],
    lichSu: [
      { id: 'ls-1', thoiDiem: '2026-03-01 09:15', hanhDong: 'TAO', nguoiThucHien: 'Minh (Kế toán)', vaiTro: 'ACCOUNTANT', moTa: 'Tạo bộ hồ sơ từ mẫu MUA_HANG_DICH_VU' },
      { id: 'ls-2', thoiDiem: '2026-03-01 09:20', hanhDong: 'GAN_CHUNG_TU', nguoiThucHien: 'Minh (Kế toán)', vaiTro: 'ACCOUNTANT', moTa: 'Gắn hóa đơn HD-001234 và PNK-2026-0042' },
      { id: 'ls-3', thoiDiem: '2026-03-02 14:00', hanhDong: 'GAN_TAI_LIEU', nguoiThucHien: 'Minh (Kế toán)', vaiTro: 'ACCOUNTANT', moTa: 'Gắn UNC ngân hàng MBBank số UNC-MB-0091' },
      { id: 'ls-4', thoiDiem: '2026-03-02 14:05', hanhDong: 'DANH_DAU_DAY_DU', nguoiThucHien: 'Minh (Kế toán)', vaiTro: 'ACCOUNTANT', moTa: 'Đạt 100% thành phần bắt buộc' },
    ]
  },
  {
    id: 'hs-2',
    soHoSo: 'HS-2026-03-0002',
    tenHoSo: 'Hồ sơ mua văn phòng phẩm Quý 1',
    maLoaiHoSo: '04',
    phanLoai: '04 Hóa đơn đầu vào',
    kyKeToan: '2026',
    thang: 3,
    nam: 2026,
    ngayPhatSinh: '2026-03-03',
    hanDuaVaoLuuTru: '2027-12-31',
    doiTuongTen: 'Nhà sách Fahasa chi nhánh Hà Nội',
    hopDongSo: 'HĐ-VPP-2026',
    hinhThucLuuTru: 'DIEN_TU',
    viTriTen: 'S3://vcomm-archive/2026/03/HS-0002',
    thoiHanLuuTru: 'NAM_10',
    tyLeDayDu: 75,
    trangThai: 'DANG_MO',
    tongGiaTri: 18500000,
    ghiChu: 'Chưa có UNC thanh toán chuyển khoản',
    thanhPhan: [
      { id: 'tp-5', maLoaiHoSo: '04.1.01', tenThanhPhan: 'Hóa đơn điện tử XML + PDF', batBuoc: true, nguon: 'KE_TOAN', soHieu: 'HD-FAH-0081', tenTaiLieu: 'HD_Fahasa.pdf', daCo: true, ngayDinhKem: '2026-03-03' },
      { id: 'tp-6', maLoaiHoSo: '04.2.01', tenThanhPhan: 'Phiếu nhập kho Mẫu 01-VT', batBuoc: true, nguon: 'ERP', soHieu: 'PNK-2026-0048', tenTaiLieu: 'PNK_VPP.pdf', daCo: true, ngayDinhKem: '2026-03-03' },
      { id: 'tp-7', maLoaiHoSo: '04.2.02', tenThanhPhan: 'Bảng kê danh mục hàng hóa', batBuoc: false, nguon: 'NGOAI', soHieu: 'BK-01', tenTaiLieu: 'BangKeChiTiet.xlsx', daCo: true, ngayDinhKem: '2026-03-03' },
      { id: 'tp-8', maLoaiHoSo: '04.3.01', tenThanhPhan: 'Chứng từ thanh toán không dùng tiền mặt (≥5tr)', batBuoc: true, nguon: 'KE_TOAN', daCo: false },
    ],
    lichSu: [
      { id: 'ls-5', thoiDiem: '2026-03-03 11:00', hanhDong: 'TAO', nguoiThucHien: 'Linh (Kế toán)', vaiTro: 'ACCOUNTANT', moTa: 'Khởi tạo hồ sơ mua VPP Fahasa' },
    ]
  },
  {
    id: 'hs-3',
    soHoSo: 'HS-2026-03-0003',
    tenHoSo: 'Hồ sơ xuất bán giải pháp phần mềm VComm CRM',
    maLoaiHoSo: '05',
    phanLoai: '05 Hóa đơn đầu ra',
    kyKeToan: '2026',
    thang: 3,
    nam: 2026,
    ngayPhatSinh: '2026-03-05',
    hanDuaVaoLuuTru: '2027-12-31',
    doiTuongTen: 'Tập đoàn Dược phẩm Nam Á',
    hopDongSo: 'HĐKT-2026/VCOMM-NAMA',
    hinhThucLuuTru: 'DIEN_TU',
    viTriTen: 'S3://vcomm-archive/2026/03/HS-0003',
    thoiHanLuuTru: 'NAM_10',
    tyLeDayDu: 100,
    trangThai: 'DA_LUU_TRU',
    tongGiaTri: 450000000,
    ghiChu: 'Đã lưu kho điện tử, sẵn sàng trích xuất kiểm tra thuế',
    thanhPhan: [
      { id: 'tp-9', maLoaiHoSo: '05.1.01', tenThanhPhan: 'Hóa đơn GTGT điện tử bán ra', batBuoc: true, nguon: 'KE_TOAN', soHieu: 'HD-VCOMM-0001', tenTaiLieu: 'HDe_0001_signed.xml', daCo: true, ngayDinhKem: '2026-03-05' },
      { id: 'tp-10', maLoaiHoSo: '05.1.02', tenThanhPhan: 'Biên bản nghiệm thu hoàn thành dịch vụ', batBuoc: true, nguon: 'NGOAI', soHieu: 'BBNT-VCOMM-01', tenTaiLieu: 'NghiemThuNamA.pdf', daCo: true, ngayDinhKem: '2026-03-05' },
    ],
    lichSu: [
      { id: 'ls-6', thoiDiem: '2026-03-05 16:30', hanhDong: 'TAO', nguoiThucHien: 'Minh (Kế toán)', vaiTro: 'ACCOUNTANT', moTa: 'Tạo hồ sơ đầu ra cho Tập đoàn Nam Á' },
      { id: 'ls-7', thoiDiem: '2026-03-06 09:00', hanhDong: 'LUU_TRU', nguoiThucHien: 'Kế toán trưởng', vaiTro: 'CHIEF_ACCOUNTANT', moTa: 'Đưa vào kho lưu trữ điện tử S3' },
    ]
  },
  {
    id: 'hs-4',
    soHoSo: 'HS-2015-12-0089',
    tenHoSo: 'Phiếu thu chi tiếp khách & công tác phí năm 2015 (Không ghi sổ trực tiếp)',
    maLoaiHoSo: '03',
    phanLoai: '03 Tiền mặt & Ngân hàng',
    kyKeToan: '2015',
    thang: 12,
    nam: 2015,
    ngayPhatSinh: '2015-12-15',
    hanDuaVaoLuuTru: '2016-12-31',
    doiTuongTen: 'Phòng Hành chính - Tổng hợp',
    hinhThucLuuTru: 'VAT_LY',
    viTriTen: 'Kho A - Kệ 01 - Hộp 09',
    thoiHanLuuTru: 'NAM_10',
    tyLeDayDu: 100,
    trangThai: 'DA_LUU_TRU',
    tongGiaTri: 45000000,
    ghiChu: 'Đã hết hạn lưu trữ (hết hạn ngày 31/12/2025 theo NĐ 174 Đ.13/Đ.15), đủ điều kiện tiêu hủy',
    thanhPhan: [
      { id: 'tp-11', maLoaiHoSo: '03.1.01', tenThanhPhan: 'Bảng kê chứng từ chi', batBuoc: true, nguon: 'KE_TOAN', soHieu: 'BK-2015-12', daCo: true, ngayDinhKem: '2015-12-15' },
    ],
    lichSu: [
      { id: 'ls-8', thoiDiem: '2016-12-20 10:00', hanhDong: 'LUU_TRU', nguoiThucHien: 'Thủ kho lưu trữ', vaiTro: 'WAREHOUSE', moTa: 'Nhập hộp vật lý Hộp 09 Kệ 01 Kho A' },
    ]
  },
  {
    id: 'hs-5',
    soHoSo: 'HS-2024-06-0012',
    tenHoSo: 'Hồ sơ pháp lý thành lập công ty & Điều lệ sáng lập',
    maLoaiHoSo: '01',
    phanLoai: '01 Hồ sơ pháp lý',
    kyKeToan: '2024',
    thang: 6,
    nam: 2024,
    ngayPhatSinh: '2024-06-18',
    hanDuaVaoLuuTru: '2025-12-31',
    doiTuongTen: 'Sở Kế hoạch & Đầu tư TP.HCM',
    hinhThucLuuTru: 'CA_HAI',
    viTriTen: 'Kho A - Két an toàn 01 + S3 Cold Storage',
    thoiHanLuuTru: 'VINH_VIEN',
    tyLeDayDu: 100,
    trangThai: 'DA_LUU_TRU',
    tongGiaTri: 5000000000,
    ghiChu: 'Hồ sơ vĩnh viễn theo Quyết định của Tổng Giám đốc (NĐ 174 Điều 14)',
    thanhPhan: [
      { id: 'tp-12', maLoaiHoSo: '01.1.01', tenThanhPhan: 'Giấy chứng nhận ĐKKD bản gốc', batBuoc: true, nguon: 'NGOAI', soHieu: '0316888999', daCo: true, ngayDinhKem: '2024-06-18' },
    ],
    lichSu: [
      { id: 'ls-9', thoiDiem: '2024-06-18 08:30', hanhDong: 'TAO', nguoiThucHien: 'Vinh (Admin)', vaiTro: 'ADMIN', moTa: 'Khởi tạo hồ sơ pháp lý' },
      { id: 'ls-10', thoiDiem: '2024-06-18 09:00', hanhDong: 'DANH_DAU_VINH_VIEN', nguoiThucHien: 'Tổng Giám đốc', vaiTro: 'DIRECTOR', moTa: 'Đánh dấu lưu trữ VĨNH VIỄN theo NĐ 174 Điều 14.2' },
    ]
  }
];

// Sample Storage locations
export const SAMPLE_VI_TRI_LUU_TRU: ViTriLuuTruItem[] = [
  {
    id: 'vt-1',
    maViTri: 'KHO_A',
    tenViTri: 'Kho tài liệu vật lý Tầng 1 (Trụ sở chính)',
    loaiViTri: 'VAT_LY',
    sucChua: 500,
    dangDung: 128,
    donVi: 'Hộp tài liệu',
    trangThai: 'HOAT_DONG',
    con: [
      {
        id: 'vt-1-1',
        maViTri: 'KE_01',
        tenViTri: 'Kệ 01 (Hồ sơ chứng từ mua bán 2015-2020)',
        loaiViTri: 'VAT_LY',
        sucChua: 100,
        dangDung: 72,
        donVi: 'Hộp',
        viTriChaId: 'vt-1',
        trangThai: 'HOAT_DONG',
        con: [
          { id: 'vt-1-1-1', maViTri: 'HOP_01', tenViTri: 'Hộp 01 · Chứng từ Quý 1/2015', loaiViTri: 'VAT_LY', sucChua: 40, dangDung: 34, donVi: 'Bộ hồ sơ', viTriChaId: 'vt-1-1', trangThai: 'HOAT_DONG' },
          { id: 'vt-1-1-2', maViTri: 'HOP_02', tenViTri: 'Hộp 02 · Chứng từ Quý 2/2015', loaiViTri: 'VAT_LY', sucChua: 40, dangDung: 28, donVi: 'Bộ hồ sơ', viTriChaId: 'vt-1-1', trangThai: 'HOAT_DONG' },
          { id: 'vt-1-1-3', maViTri: 'HOP_03', tenViTri: 'Hộp 03 · Trống (Sẵn sàng tiếp nhận)', loaiViTri: 'VAT_LY', sucChua: 40, dangDung: 0, donVi: 'Bộ hồ sơ', viTriChaId: 'vt-1-1', trangThai: 'HOAT_DONG' },
        ]
      },
      {
        id: 'vt-1-2',
        maViTri: 'KE_02',
        tenViTri: 'Kệ 02 (Sổ sách kế toán & Báo cáo tài chính)',
        loaiViTri: 'VAT_LY',
        sucChua: 100,
        dangDung: 56,
        donVi: 'Hộp',
        viTriChaId: 'vt-1',
        trangThai: 'HOAT_DONG'
      }
    ]
  },
  {
    id: 'vt-2',
    maViTri: 'CLOUD_S3_PROD',
    tenViTri: 'Amazon S3 Bucket vcomm-accounting-archive (Mã hóa KMS)',
    loaiViTri: 'DIEN_TU',
    sucChua: 1000,
    dangDung: 340,
    donVi: 'GB',
    trangThai: 'HOAT_DONG',
    con: [
      { id: 'vt-2-1', maViTri: 'S3_2026', tenViTri: 'Thư mục /2026 (Chứng từ năm hiện hành)', loaiViTri: 'DIEN_TU', sucChua: 200, dangDung: 42, donVi: 'GB', viTriChaId: 'vt-2', trangThai: 'HOAT_DONG' },
      { id: 'vt-2-2', maViTri: 'S3_2025', tenViTri: 'Thư mục /2025 (Đã đóng sổ năm tài chính)', loaiViTri: 'DIEN_TU', sucChua: 200, dangDung: 158, donVi: 'GB', viTriChaId: 'vt-2', trangThai: 'HOAT_DONG' }
    ]
  },
  {
    id: 'vt-3',
    maViTri: 'VINACERT_OUTSOURCE',
    tenViTri: 'Kho chuyên dụng Vinacert (Thuê ngoài bảo quản)',
    loaiViTri: 'THUE_NGOAI',
    donViThue: 'Công ty Cổ phần Chứng nhận & Lưu trữ Vinacert',
    hopDongLuuTru: 'HĐLT-2025/VINACERT-VCOMM',
    sucChua: 3000,
    dangDung: 2400,
    donVi: 'Bộ hồ sơ',
    trangThai: 'HOAT_DONG'
  }
];
