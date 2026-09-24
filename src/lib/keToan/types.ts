// =============================================================================
// HỢP ĐỒNG DỮ LIỆU CHỨNG TỪ KẾ TOÁN NHẬT KÝ CHUNG (TT99/2025/TT-BTC)
// Căn cứ: 12_THIET_KE_GIAO_DIEN_NHAT_KY_CHUNG.md §4
// =============================================================================

export type LoaiChungTu = 'THU' | 'CHI' | 'BAN' | 'MUA' | 'KHO' | 'LUONG' | 'KET_CHUYEN' | 'KHAC';
export type TrangThaiChungTu = 'NHAP' | 'CHUA_GHI_SO' | 'DA_GHI_SO' | 'DA_KHOA_SO' | 'DA_HUY';

// ---- Dòng định khoản (Detail line) ----
export interface DinhKhoan {
  id?: string;
  soDong: number;
  dienGiai: string;
  tkNo: string;           // Mã tài khoản Nợ (bắt buộc TK lá)
  tenTkNo?: string;       // Auto-filled từ danh mục
  tkCo: string;           // Mã tài khoản Có (bắt buộc TK lá)
  tenTkCo?: string;       // Auto-filled từ danh mục
  soTien: number;         // > 0
  loaiTien: string;       // 'VND' | 'USD' | ...
  tyGia: number;          // Default 1 nếu VND
  soTienQuyDoi: number;   // soTien * tyGia
  // Đối tượng theo dõi
  doiTuongId?: string;    // KH / NCC / NV
  maDoiTuong?: string;
  tenDoiTuong?: string;
  khoId?: string;
  maKho?: string;
  hangHoaId?: string;
  maHangHoa?: string;
  soLuong?: number;
  donGia?: number;
  hoaDonSo?: string;
  hoaDonNgay?: string;
  thueSuat?: number;
  // Dấu vết Điều 28 TT99
  tkNoTt200?: string;
  tkCoTt200?: string;
}

// ---- Chứng từ Nhật ký chung (Master) ----
export interface ChungTuNhatKyChung {
  id?: string;
  tenantId: string;
  loaiCt: LoaiChungTu;
  soCt: string;
  ngayCt: string;          // ISO date YYYY-MM-DD
  ngayHachToan: string;    // ISO date YYYY-MM-DD
  kyKeToan: string;        // 'YYYY-MM'
  dienGiai: string;
  nguoiLapId: string;
  trangThai: TrangThaiChungTu;
  thongTuApDung: 'TT99' | 'TT200';
  dinhKhoan: DinhKhoan[];
  // Dấu vết tích hợp liên module (IR-08)
  sourceSystem?: 'MANUAL' | 'ERP_ORDER' | 'ERP_PURCHASE' | 'ERP_WAREHOUSE' | 'INTERNAL_INVOICE';
  sourceDocType?: string;
  sourceDocId?: string;
  sourceVersion?: number;
  reversalOfId?: string;
  checksum?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---- Kết quả kiểm tra cân đối ----
export interface KetQuaCanDoi {
  tongNo: number;
  tongCo: number;
  chenhLech: number;
  soDong: number;
  canDoi: boolean;
  loi: { dong: number; truong: string; thongDiep: string }[];
}
