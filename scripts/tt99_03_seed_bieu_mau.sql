-- =====================================================================
-- 10_seed_tt99_bieu_mau.sql
-- Du lieu tham chieu TT99/2025/TT-BTC:
--   42 bieu mau so ke toan (Phu luc III)
--   15 ma mau BCTC (Dieu 17 + Phu luc IV)
--   33 bieu mau chung tu (Phu luc I)
--   Chi tieu B 01 - DN + mapping chi tieu <-> tai khoan
-- Sinh tu dong boi gen_bieu_mau.py — KHONG sua tay.
-- Idempotent: chay lai khong loi, khong nhan doi du lieu.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. DDL — bang danh muc bieu mau (neu chua co tu migration U0)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dm_bieu_mau_so (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id          TEXT,
    so_tt               INT NOT NULL,
    ten_so              VARCHAR(255) NOT NULL,
    ky_hieu             VARCHAR(120) NOT NULL,
    hinh_thuc_ap_dung   VARCHAR(20)[] NOT NULL,
    la_mac_dinh         BOOLEAN NOT NULL DEFAULT TRUE,
    la_tuy_bien         BOOLEAN NOT NULL DEFAULT FALSE,
    template_id         VARCHAR(120),
    quy_che_id          BIGINT,
    ghi_chu             TEXT,
    -- tenant_id NULL = bieu mau dung chung (mac dinh theo Phu luc III).
    -- NULLS NOT DISTINCT (PostgreSQL 15+) de ON CONFLICT hoat dong voi NULL.
    UNIQUE NULLS NOT DISTINCT (tenant_id, so_tt)
);

CREATE TABLE IF NOT EXISTS dm_bieu_mau_bctc (
    id                  BIGSERIAL PRIMARY KEY,
    ma_mau              VARCHAR(20) NOT NULL UNIQUE,
    ten_bctc            VARCHAR(255) NOT NULL,
    loai_ky             VARCHAR(20) NOT NULL,   -- NAM | GIUA_NIEN_DO
    gia_dinh_hoat_dong  VARCHAR(20) NOT NULL,   -- LIEN_TUC | KHONG_LIEN_TUC
    dang                VARCHAR(20) NOT NULL,   -- DAY_DU | TOM_LUOC
    ghi_chu             TEXT
);

CREATE TABLE IF NOT EXISTS dm_chi_tieu_bctc (
    id              BIGSERIAL PRIMARY KEY,
    ma_mau          VARCHAR(20) NOT NULL,
    ma_chi_tieu     VARCHAR(10) NOT NULL,
    ten_chi_tieu    VARCHAR(500) NOT NULL,
    cap             INT NOT NULL DEFAULT 1,
    ma_me           VARCHAR(10),
    cong_thuc       VARCHAR(500),
    loai            VARCHAR(20) NOT NULL,   -- TAI_SAN | NO_PHAI_TRA | VON
    la_mac_dinh     BOOLEAN NOT NULL DEFAULT TRUE,
    la_bo_sung      BOOLEAN NOT NULL DEFAULT FALSE,
    quy_che_id      BIGINT,
    thuyet_minh     TEXT,
    UNIQUE (ma_mau, ma_chi_tieu)
);

CREATE TABLE IF NOT EXISTS map_chi_tieu_tk (
    id              BIGSERIAL PRIMARY KEY,
    ma_mau          VARCHAR(20) NOT NULL DEFAULT 'B01-DN',
    ma_chi_tieu     VARCHAR(10) NOT NULL,
    ma_tk           VARCHAR(20) NOT NULL,
    he_so           INT NOT NULL DEFAULT 1,
    chieu           VARCHAR(10) NOT NULL,   -- DU_NO | DU_CO | PS_NO | PS_CO
    ghi_chu         TEXT,
    UNIQUE (ma_mau, ma_chi_tieu, ma_tk, chieu)
);

CREATE TABLE IF NOT EXISTS dm_loai_chung_tu_mau (
    id              BIGSERIAL PRIMARY KEY,
    nhom_ct         VARCHAR(10) NOT NULL,   -- LDTL | VT | BH | TT | TSCD
    so_hieu_mau     VARCHAR(20) NOT NULL UNIQUE,
    ten_ct          VARCHAR(255) NOT NULL,
    template_id     VARCHAR(120),
    bat_buoc_ky_so  BOOLEAN NOT NULL DEFAULT FALSE
);

-- ---------------------------------------------------------------------
-- 2. 42 BIEU MAU SO KE TOAN (Phu luc III TT99)
-- ---------------------------------------------------------------------
INSERT INTO dm_bieu_mau_so (tenant_id, so_tt, ten_so, ky_hieu, hinh_thuc_ap_dung, ghi_chu) VALUES
 (NULL, 1, 'Nhật ký - Sổ Cái', 'S01-DN', ARRAY['NK_SO_CAI']::VARCHAR[], NULL),
 (NULL, 2, 'Chứng từ ghi sổ', 'S02a-DN', ARRAY['CTGS']::VARCHAR[], NULL),
 (NULL, 3, 'Sổ Đăng ký Chứng từ ghi sổ', 'S02b-DN', ARRAY['CTGS']::VARCHAR[], NULL),
 (NULL, 4, 'Sổ Cái (dùng cho hình thức Chứng từ ghi sổ)', 'S02c1-DN;S02c2-DN', ARRAY['CTGS']::VARCHAR[], 'Gồm S02c1-DN và S02c2-DN'),
 (NULL, 5, 'Sổ Nhật ký chung', 'S03a-DN', ARRAY['NKC']::VARCHAR[], 'TRỌNG TÂM của hình thức Nhật ký chung'),
 (NULL, 6, 'Sổ Nhật ký thu tiền', 'S03a1-DN', ARRAY['NKC']::VARCHAR[], 'Nhật ký đặc biệt'),
 (NULL, 7, 'Sổ Nhật ký chi tiền', 'S03a2-DN', ARRAY['NKC']::VARCHAR[], 'Nhật ký đặc biệt'),
 (NULL, 8, 'Sổ Nhật ký mua hàng', 'S03a3-DN', ARRAY['NKC']::VARCHAR[], 'Nhật ký đặc biệt'),
 (NULL, 9, 'Sổ Nhật ký bán hàng', 'S03a4-DN', ARRAY['NKC']::VARCHAR[], 'Nhật ký đặc biệt'),
 (NULL, 10, 'Sổ Cái (dùng cho hình thức Nhật ký chung)', 'S03b-DN', ARRAY['NKC']::VARCHAR[], NULL),
 (NULL, 11, 'Nhật ký - Chứng từ và Bảng kê', 'S04-DN;S04a1-DN..S04a10-DN;S04b1-DN..S04b10-DN', ARRAY['NK_CT']::VARCHAR[], 'Nhật ký - Chứng từ số 1-10 và Bảng kê số 1-10'),
 (NULL, 12, 'Sổ Cái (dùng cho hình thức Nhật ký - Chứng từ)', 'S05-DN', ARRAY['NK_CT']::VARCHAR[], NULL),
 (NULL, 13, 'Bảng cân đối số phát sinh', 'S06-DN', ARRAY['NKC','CTGS']::VARCHAR[], 'Dùng chung, đối chiếu tổng hợp'),
 (NULL, 14, 'Sổ quỹ tiền mặt', 'S07-DN', ARRAY['NKC','NK_SO_CAI','CTGS']::VARCHAR[], NULL),
 (NULL, 15, 'Sổ kế toán chi tiết quỹ tiền mặt', 'S07a-DN', ARRAY['NKC','NK_SO_CAI','CTGS']::VARCHAR[], NULL),
 (NULL, 16, 'Sổ tiền gửi không kỳ hạn', 'S08-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], 'Tên sổ đổi theo TT99 (TK 112 "Tiền gửi không kỳ hạn")'),
 (NULL, 17, 'Sổ chi tiết vật liệu, dụng cụ (sản phẩm, hàng hóa)', 'S10-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 18, 'Bảng tổng hợp chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa', 'S11-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 19, 'Thẻ kho (Sổ kho)', 'S12-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 20, 'Sổ tài sản cố định', 'S21-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 21, 'Sổ theo dõi TSCĐ và công cụ, dụng cụ tại nơi sử dụng', 'S22-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 22, 'Thẻ Tài sản cố định', 'S23-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 23, 'Sổ chi tiết thanh toán với người mua (người bán)', 'S31-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 24, 'Sổ chi tiết thanh toán với người mua (người bán) bằng ngoại tệ', 'S32-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 25, 'Sổ theo dõi thanh toán bằng ngoại tệ', 'S33-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 26, 'Sổ chi tiết tiền vay', 'S34-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 27, 'Sổ chi tiết bán hàng', 'S35-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 28, 'Sổ chi phí sản xuất, kinh doanh', 'S36-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 29, 'Thẻ tính giá thành sản phẩm, dịch vụ', 'S37-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 30, 'Sổ chi tiết các tài khoản', 'S38-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 31, 'Sổ kế toán chi tiết theo dõi các khoản đầu tư vào công ty liên doanh', 'S41a-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], 'Tách riêng liên doanh (a)'),
 (NULL, 32, 'Sổ theo dõi phân bổ các khoản chênh lệch phát sinh khi mua khoản đầu tư vào công ty liên doanh', 'S42a-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 33, 'Sổ kế toán chi tiết theo dõi các khoản đầu tư vào công ty liên kết', 'S41b-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], 'Tách riêng liên kết (b)'),
 (NULL, 34, 'Sổ theo dõi phân bổ các khoản chênh lệch phát sinh khi mua khoản đầu tư vào công ty liên kết', 'S42b-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 35, 'Sổ chi tiết phát hành cổ phiếu', 'S43-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 36, 'Sổ chi tiết cổ phiếu mua lại của chính mình', 'S44-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], 'TT99 đổi tên từ "Cổ phiếu quỹ"'),
 (NULL, 37, 'Sổ chi tiết đầu tư chứng khoán', 'S45-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 38, 'Sổ theo dõi chi tiết vốn đầu tư của chủ sở hữu', 'S51-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 39, 'Sổ chi phí đầu tư xây dựng', 'S52-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 40, 'Sổ theo dõi thuế GTGT', 'S61-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 41, 'Sổ chi tiết thuế GTGT được hoàn lại', 'S62-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL),
 (NULL, 42, 'Sổ chi tiết thuế GTGT được miễn giảm', 'S63-DN', ARRAY['NKC','NK_SO_CAI','CTGS','NK_CT']::VARCHAR[], NULL)
ON CONFLICT (tenant_id, so_tt) DO UPDATE
  SET ten_so = EXCLUDED.ten_so, ky_hieu = EXCLUDED.ky_hieu,
      hinh_thuc_ap_dung = EXCLUDED.hinh_thuc_ap_dung, ghi_chu = EXCLUDED.ghi_chu;

-- ---------------------------------------------------------------------
-- 3. 15 MA MAU BCTC (Dieu 17 + Phu luc IV TT99)
-- ---------------------------------------------------------------------
INSERT INTO dm_bieu_mau_bctc (ma_mau, ten_bctc, loai_ky, gia_dinh_hoat_dong, dang, ghi_chu) VALUES
 ('B01-DN', 'Báo cáo tình hình tài chính', 'NAM', 'LIEN_TUC', 'DAY_DU', 'Thay "Bảng cân đối kế toán" B01-DN cũ'),
 ('B02-DN', 'Báo cáo kết quả hoạt động kinh doanh', 'NAM', 'LIEN_TUC', 'DAY_DU', NULL),
 ('B03-DN', 'Báo cáo lưu chuyển tiền tệ', 'NAM', 'LIEN_TUC', 'DAY_DU', NULL),
 ('B09-DN', 'Bản thuyết minh Báo cáo tài chính', 'NAM', 'LIEN_TUC', 'DAY_DU', NULL),
 ('B01-DNKLT', 'Báo cáo tình hình tài chính', 'NAM', 'KHONG_LIEN_TUC', 'DAY_DU', 'MỚI — bộ biểu mẫu riêng'),
 ('B02-DNKLT', 'Báo cáo kết quả hoạt động kinh doanh', 'NAM', 'KHONG_LIEN_TUC', 'DAY_DU', 'MỚI'),
 ('B03-DNKLT', 'Báo cáo lưu chuyển tiền tệ', 'NAM', 'KHONG_LIEN_TUC', 'DAY_DU', 'MỚI'),
 ('B09-DNKLT', 'Bản thuyết minh Báo cáo tài chính', 'NAM', 'KHONG_LIEN_TUC', 'DAY_DU', 'MỚI'),
 ('B01a-DN', 'Báo cáo tình hình tài chính giữa niên độ', 'GIUA_NIEN_DO', 'LIEN_TUC', 'DAY_DU', 'Giữa niên độ dạng đầy đủ'),
 ('B02a-DN', 'Báo cáo KQHĐKD giữa niên độ', 'GIUA_NIEN_DO', 'LIEN_TUC', 'DAY_DU', NULL),
 ('B03a-DN', 'Báo cáo lưu chuyển tiền tệ giữa niên độ', 'GIUA_NIEN_DO', 'LIEN_TUC', 'DAY_DU', NULL),
 ('B09a-DN', 'Bản thuyết minh BCTC chọn lọc', 'GIUA_NIEN_DO', 'LIEN_TUC', 'DAY_DU', 'Dùng chung cho cả dạng đầy đủ và tóm lược'),
 ('B01b-DN', 'Báo cáo tình hình tài chính giữa niên độ', 'GIUA_NIEN_DO', 'LIEN_TUC', 'TOM_LUOC', 'Giữa niên độ dạng tóm lược'),
 ('B02b-DN', 'Báo cáo KQHĐKD giữa niên độ', 'GIUA_NIEN_DO', 'LIEN_TUC', 'TOM_LUOC', NULL),
 ('B03b-DN', 'Báo cáo lưu chuyển tiền tệ giữa niên độ', 'GIUA_NIEN_DO', 'LIEN_TUC', 'TOM_LUOC', NULL)
ON CONFLICT (ma_mau) DO UPDATE
  SET ten_bctc = EXCLUDED.ten_bctc, loai_ky = EXCLUDED.loai_ky,
      gia_dinh_hoat_dong = EXCLUDED.gia_dinh_hoat_dong, dang = EXCLUDED.dang,
      ghi_chu = EXCLUDED.ghi_chu;

-- ---------------------------------------------------------------------
-- 4. 33 BIEU MAU CHUNG TU (Phu luc I TT99) — 6 nhom
-- ---------------------------------------------------------------------
INSERT INTO dm_loai_chung_tu_mau (nhom_ct, so_hieu_mau, ten_ct) VALUES
 ('LDTL', '01-LĐTL', 'Bảng thanh toán tiền lương'),
 ('LDTL', '02-LĐTL', 'Bảng thanh toán tiền thưởng'),
 ('LDTL', '03-LĐTL', 'Bảng thanh toán tiền làm thêm giờ'),
 ('LDTL', '04-LĐTL', 'Bảng thanh toán tiền thuê ngoài'),
 ('LDTL', '05-LĐTL', 'Hợp đồng giao khoán'),
 ('LDTL', '06-LĐTL', 'Biên bản thanh lý (nghiệm thu) hợp đồng giao khoán'),
 ('LDTL', '07-LĐTL', 'Bảng kê trích nộp các khoản theo lương'),
 ('LDTL', '08-LĐTL', 'Bảng phân bổ tiền lương và các khoản trích theo lương'),
 ('VT', '01-VT', 'Phiếu nhập kho'),
 ('VT', '02-VT', 'Phiếu xuất kho'),
 ('VT', '03-VT', 'Biên bản kiểm nghiệm vật tư, công cụ, sản phẩm, hàng hóa'),
 ('VT', '04-VT', 'Bảng kê chi tiết vật tư còn lại cuối kỳ'),
 ('VT', '05-VT', 'Biên bản tổng hợp kiểm kê vật tư, công cụ, sản phẩm, hàng hóa'),
 ('VT', '06-VT', 'Bảng kê mua hàng'),
 ('VT', '07-VT', 'Bảng phân bổ nguyên liệu, vật liệu, công cụ, dụng cụ'),
 ('BH', '01-BH', 'Bảng thanh toán hàng đại lý, ký gửi'),
 ('BH', '02-BH', 'Thẻ quầy hàng'),
 ('TT', '01-TT', 'Phiếu thu'),
 ('TT', '02-TT', 'Phiếu chi'),
 ('TT', '03-TT', 'Giấy đề nghị tạm ứng'),
 ('TT', '04-TT', 'Giấy thanh toán tiền tạm ứng'),
 ('TT', '05-TT', 'Giấy đề nghị thanh toán'),
 ('TT', '06-TT', 'Biên lai thu tiền'),
 ('TT', '07-TT', 'Bảng kê vàng tiền tệ'),
 ('TT', '08a-TT', 'Bảng kiểm kê quỹ (dùng cho VND)'),
 ('TT', '08b-TT', 'Bảng kiểm kê quỹ (dùng cho ngoại tệ, vàng tiền tệ)'),
 ('TT', '09-TT', 'Bảng kê chi tiền'),
 ('TSCD', '01-TSCĐ', 'Biên bản giao nhận TSCĐ'),
 ('TSCD', '02-TSCĐ', 'Biên bản thanh lý TSCĐ'),
 ('TSCD', '03-TSCĐ', 'Biên bản bàn giao TSCĐ sửa chữa, bảo dưỡng hoặc nâng cấp, cải tạo hoàn thành'),
 ('TSCD', '04-TSCĐ', 'Biên bản đánh giá lại TSCĐ'),
 ('TSCD', '05-TSCĐ', 'Biên bản tổng hợp kiểm kê TSCĐ'),
 ('TSCD', '06-TSCĐ', 'Bảng tính và phân bổ khấu hao TSCĐ')
ON CONFLICT (so_hieu_mau) DO UPDATE
  SET nhom_ct = EXCLUDED.nhom_ct, ten_ct = EXCLUDED.ten_ct;

-- ---------------------------------------------------------------------
-- 5. CHI TIEU B 01 - DN (Bao cao tinh hinh tai chinh, gia dinh hoat dong lien tuc)
--    LUU Y: ma 112 o day la CHI TIEU BCTC 'Cac khoan tuong duong tien',
--           KHAC ma tai khoan 112 'Tien gui khong ky han'.
-- ---------------------------------------------------------------------
INSERT INTO dm_chi_tieu_bctc (ma_mau, ma_chi_tieu, ten_chi_tieu, cap, ma_me, cong_thuc, loai) VALUES
 ('B01-DN', '100', 'A - TÀI SẢN NGẮN HẠN', 1, NULL, '110+120+130+140+150+160', 'TAI_SAN'),
 ('B01-DN', '110', 'I. Tiền và các khoản tương đương tiền', 2, '100', '111+112', 'TAI_SAN'),
 ('B01-DN', '111', '1. Tiền', 3, '110', NULL, 'TAI_SAN'),
 ('B01-DN', '112', '2. Các khoản tương đương tiền', 3, '110', NULL, 'TAI_SAN'),
 ('B01-DN', '120', 'II. Đầu tư tài chính ngắn hạn', 2, '100', '121+122+123+124+125+126', 'TAI_SAN'),
 ('B01-DN', '121', '1. Chứng khoán kinh doanh', 3, '120', NULL, 'TAI_SAN'),
 ('B01-DN', '122', '2. Dự phòng giảm giá chứng khoán kinh doanh (*)', 3, '120', NULL, 'TAI_SAN'),
 ('B01-DN', '123', '3. Đầu tư nắm giữ đến ngày đáo hạn ngắn hạn', 3, '120', NULL, 'TAI_SAN'),
 ('B01-DN', '124', '4. Dự phòng đầu tư nắm giữ đến ngày đáo hạn ngắn hạn (*)', 3, '120', NULL, 'TAI_SAN'),
 ('B01-DN', '125', '5. Đầu tư ngắn hạn khác', 3, '120', NULL, 'TAI_SAN'),
 ('B01-DN', '126', '6. Dự phòng tổn thất các khoản đầu tư ngắn hạn khác (*)', 3, '120', NULL, 'TAI_SAN'),
 ('B01-DN', '130', 'III. Các khoản phải thu ngắn hạn', 2, '100', '131+132+133+134+135+136+137', 'TAI_SAN'),
 ('B01-DN', '131', '1. Phải thu ngắn hạn của khách hàng', 3, '130', NULL, 'TAI_SAN'),
 ('B01-DN', '132', '2. Trả trước cho người bán ngắn hạn', 3, '130', NULL, 'TAI_SAN'),
 ('B01-DN', '133', '3. Phải thu nội bộ ngắn hạn', 3, '130', NULL, 'TAI_SAN'),
 ('B01-DN', '134', '4. Phải thu theo tiến độ hợp đồng xây dựng', 3, '130', NULL, 'TAI_SAN'),
 ('B01-DN', '135', '5. Phải thu ngắn hạn khác', 3, '130', NULL, 'TAI_SAN'),
 ('B01-DN', '136', '6. Dự phòng phải thu ngắn hạn khó đòi (*)', 3, '130', NULL, 'TAI_SAN'),
 ('B01-DN', '137', '7. Tài sản thiếu chờ xử lý', 3, '130', NULL, 'TAI_SAN'),
 ('B01-DN', '140', 'IV. Hàng tồn kho', 2, '100', '141+142', 'TAI_SAN'),
 ('B01-DN', '141', '1. Hàng tồn kho', 3, '140', NULL, 'TAI_SAN'),
 ('B01-DN', '142', '2. Dự phòng giảm giá hàng tồn kho (*)', 3, '140', NULL, 'TAI_SAN'),
 ('B01-DN', '150', 'V. Tài sản sinh học ngắn hạn', 2, '100', '151+152+153', 'TAI_SAN'),
 ('B01-DN', '151', '1. Súc vật nuôi lấy sản phẩm một lần ngắn hạn', 3, '150', NULL, 'TAI_SAN'),
 ('B01-DN', '152', '2. Cây trồng theo mùa vụ hoặc lấy sản phẩm một lần ngắn hạn', 3, '150', NULL, 'TAI_SAN'),
 ('B01-DN', '153', '3. Dự phòng tổn thất tài sản sinh học ngắn hạn (*)', 3, '150', NULL, 'TAI_SAN'),
 ('B01-DN', '160', 'VI. Tài sản ngắn hạn khác', 2, '100', '161+162+163+164+165', 'TAI_SAN'),
 ('B01-DN', '161', '1. Chi phí chờ phân bổ ngắn hạn', 3, '160', NULL, 'TAI_SAN'),
 ('B01-DN', '162', '2. Thuế GTGT được khấu trừ', 3, '160', NULL, 'TAI_SAN'),
 ('B01-DN', '163', '3. Thuế và các khoản khác phải thu Nhà nước', 3, '160', NULL, 'TAI_SAN'),
 ('B01-DN', '164', '4. Giao dịch mua bán lại trái phiếu Chính phủ', 3, '160', NULL, 'TAI_SAN'),
 ('B01-DN', '165', '5. Tài sản ngắn hạn khác', 3, '160', NULL, 'TAI_SAN'),
 ('B01-DN', '200', 'B - TÀI SẢN DÀI HẠN', 1, NULL, '210+220+230+240+250+260+270', 'TAI_SAN'),
 ('B01-DN', '210', 'I. Các khoản phải thu dài hạn', 2, '200', '211+212+213+214+215+216', 'TAI_SAN'),
 ('B01-DN', '211', '1. Phải thu dài hạn của khách hàng', 3, '210', NULL, 'TAI_SAN'),
 ('B01-DN', '212', '2. Trả trước cho người bán dài hạn', 3, '210', NULL, 'TAI_SAN'),
 ('B01-DN', '213', '3. Vốn kinh doanh ở đơn vị trực thuộc', 3, '210', NULL, 'TAI_SAN'),
 ('B01-DN', '214', '4. Phải thu nội bộ dài hạn', 3, '210', NULL, 'TAI_SAN'),
 ('B01-DN', '215', '5. Phải thu dài hạn khác', 3, '210', NULL, 'TAI_SAN'),
 ('B01-DN', '216', '6. Dự phòng phải thu dài hạn khó đòi (*)', 3, '210', NULL, 'TAI_SAN'),
 ('B01-DN', '220', 'II. Tài sản cố định', 2, '200', '221+224+227', 'TAI_SAN'),
 ('B01-DN', '221', '1. Tài sản cố định hữu hình', 3, '220', '222+223', 'TAI_SAN'),
 ('B01-DN', '222', '- Nguyên giá', 4, '221', NULL, 'TAI_SAN'),
 ('B01-DN', '223', '- Giá trị hao mòn lũy kế (*)', 4, '221', NULL, 'TAI_SAN'),
 ('B01-DN', '224', '2. Tài sản cố định thuê tài chính', 3, '220', '225+226', 'TAI_SAN'),
 ('B01-DN', '225', '- Nguyên giá', 4, '224', NULL, 'TAI_SAN'),
 ('B01-DN', '226', '- Giá trị hao mòn lũy kế (*)', 4, '224', NULL, 'TAI_SAN'),
 ('B01-DN', '227', '3. Tài sản cố định vô hình', 3, '220', '228+229', 'TAI_SAN'),
 ('B01-DN', '228', '- Nguyên giá', 4, '227', NULL, 'TAI_SAN'),
 ('B01-DN', '229', '- Giá trị hao mòn lũy kế (*)', 4, '227', NULL, 'TAI_SAN'),
 ('B01-DN', '230', 'III. Tài sản sinh học dài hạn', 2, '200', '231+236+237+238', 'TAI_SAN'),
 ('B01-DN', '231', '1. Súc vật nuôi cho sản phẩm định kỳ', 3, '230', '232+233', 'TAI_SAN'),
 ('B01-DN', '232', 'a) Chưa đến giai đoạn trưởng thành', 4, '231', NULL, 'TAI_SAN'),
 ('B01-DN', '233', 'b) Đến giai đoạn trưởng thành', 4, '231', '234+235', 'TAI_SAN'),
 ('B01-DN', '234', '- Nguyên giá', 5, '233', NULL, 'TAI_SAN'),
 ('B01-DN', '235', '- Giá trị khấu hao lũy kế (*)', 5, '233', NULL, 'TAI_SAN'),
 ('B01-DN', '236', '2. Súc vật nuôi lấy sản phẩm một lần dài hạn', 3, '230', NULL, 'TAI_SAN'),
 ('B01-DN', '237', '3. Cây trồng theo mùa vụ hoặc lấy sản phẩm một lần dài hạn', 3, '230', NULL, 'TAI_SAN'),
 ('B01-DN', '238', '4. Dự phòng tổn thất tài sản sinh học dài hạn (*)', 3, '230', NULL, 'TAI_SAN'),
 ('B01-DN', '240', 'IV. Bất động sản đầu tư', 2, '200', '241+242', 'TAI_SAN'),
 ('B01-DN', '241', '- Nguyên giá', 3, '240', NULL, 'TAI_SAN'),
 ('B01-DN', '242', '- Giá trị hao mòn lũy kế (*)', 3, '240', NULL, 'TAI_SAN'),
 ('B01-DN', '250', 'V. Tài sản dở dang dài hạn', 2, '200', '251+252', 'TAI_SAN'),
 ('B01-DN', '251', '1. Chi phí sản xuất, kinh doanh dở dang dài hạn', 3, '250', NULL, 'TAI_SAN'),
 ('B01-DN', '252', '2. Chi phí xây dựng cơ bản dở dang', 3, '250', NULL, 'TAI_SAN'),
 ('B01-DN', '260', 'VI. Đầu tư tài chính dài hạn', 2, '200', '261+262+263+264+265+266', 'TAI_SAN'),
 ('B01-DN', '261', '1. Đầu tư vào công ty con', 3, '260', NULL, 'TAI_SAN'),
 ('B01-DN', '262', '2. Đầu tư vào công ty liên doanh, liên kết', 3, '260', NULL, 'TAI_SAN'),
 ('B01-DN', '263', '3. Đầu tư góp vốn vào đơn vị khác', 3, '260', NULL, 'TAI_SAN'),
 ('B01-DN', '264', '4. Dự phòng tổn thất đầu tư vào đơn vị khác dài hạn (*)', 3, '260', NULL, 'TAI_SAN'),
 ('B01-DN', '265', '5. Đầu tư nắm giữ đến ngày đáo hạn dài hạn', 3, '260', NULL, 'TAI_SAN'),
 ('B01-DN', '266', '6. Dự phòng đầu tư nắm giữ đến ngày đáo hạn dài hạn (*)', 3, '260', NULL, 'TAI_SAN'),
 ('B01-DN', '270', 'VII. Tài sản dài hạn khác', 2, '200', '271+272+273+274', 'TAI_SAN'),
 ('B01-DN', '271', '1. Chi phí chờ phân bổ dài hạn', 3, '270', NULL, 'TAI_SAN'),
 ('B01-DN', '272', '2. Tài sản thuế thu nhập hoãn lại', 3, '270', NULL, 'TAI_SAN'),
 ('B01-DN', '273', '3. Thiết bị, vật tư, phụ tùng thay thế dài hạn', 3, '270', NULL, 'TAI_SAN'),
 ('B01-DN', '274', '4. Tài sản dài hạn khác', 3, '270', NULL, 'TAI_SAN'),
 ('B01-DN', '280', 'TỔNG CỘNG TÀI SẢN (280 = 100 + 200)', 1, NULL, '100+200', 'TAI_SAN'),
 ('B01-DN', '300', 'C - NỢ PHẢI TRẢ', 1, NULL, '310+330', 'NO_PHAI_TRA'),
 ('B01-DN', '310', 'I. Nợ ngắn hạn', 2, '300', '311+312+313+314+315+316+317+318+319+320+321+322+323+324+325', 'NO_PHAI_TRA'),
 ('B01-DN', '311', '1. Phải trả người bán ngắn hạn', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '312', '2. Người mua trả tiền trước ngắn hạn', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '313', '3. Phải trả cổ tức, lợi nhuận', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '314', '4. Thuế và các khoản phải nộp Nhà nước ngắn hạn', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '315', '5. Phải trả người lao động', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '316', '6. Chi phí phải trả ngắn hạn', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '317', '7. Phải trả nội bộ ngắn hạn', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '318', '8. Phải trả theo tiến độ hợp đồng xây dựng ngắn hạn', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '319', '9. Doanh thu chờ phân bổ ngắn hạn', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '320', '10. Phải trả ngắn hạn khác', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '321', '11. Vay và nợ thuê tài chính ngắn hạn', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '322', '12. Dự phòng phải trả ngắn hạn', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '323', '13. Quỹ khen thưởng, phúc lợi', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '324', '14. Quỹ bình ổn giá', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '325', '15. Giao dịch mua bán lại trái phiếu Chính phủ', 3, '310', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '330', 'II. Nợ dài hạn', 2, '300', '331+332+333+334+335+336+337+338+339+340+341+342+343+344', 'NO_PHAI_TRA'),
 ('B01-DN', '331', '1. Phải trả người bán dài hạn', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '332', '2. Người mua trả tiền trước dài hạn', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '333', '3. Thuế và các khoản phải nộp Nhà nước dài hạn', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '334', '4. Chi phí phải trả dài hạn', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '335', '5. Phải trả nội bộ về vốn kinh doanh', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '336', '6. Phải trả nội bộ dài hạn', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '337', '7. Doanh thu chờ phân bổ dài hạn', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '338', '8. Phải trả dài hạn khác', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '339', '9. Vay và nợ thuê tài chính dài hạn', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '340', '10. Trái phiếu chuyển đổi', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '341', '11. Cổ phiếu ưu đãi', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '342', '12. Thuế thu nhập hoãn lại phải trả', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '343', '13. Dự phòng phải trả dài hạn', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '344', '14. Quỹ phát triển khoa học và công nghệ', 3, '330', NULL, 'NO_PHAI_TRA'),
 ('B01-DN', '400', 'D - VỐN CHỦ SỞ HỮU', 1, NULL, '411+412+413+414+415+416+417+418+419+420+421+422', 'VON'),
 ('B01-DN', '411', '1. Vốn góp của chủ sở hữu', 2, '400', '411a+411b', 'VON'),
 ('B01-DN', '411a', '- Cổ phiếu phổ thông có quyền biểu quyết', 3, '411', NULL, 'VON'),
 ('B01-DN', '411b', '- Cổ phiếu ưu đãi', 3, '411', NULL, 'VON'),
 ('B01-DN', '412', '2. Thặng dư vốn', 2, '400', NULL, 'VON'),
 ('B01-DN', '413', '3. Quyền chọn chuyển đổi trái phiếu', 2, '400', NULL, 'VON'),
 ('B01-DN', '414', '4. Vốn khác của chủ sở hữu', 2, '400', NULL, 'VON'),
 ('B01-DN', '415', '5. Cổ phiếu mua lại của chính mình (*)', 2, '400', NULL, 'VON'),
 ('B01-DN', '416', '6. Chênh lệch đánh giá lại tài sản', 2, '400', NULL, 'VON'),
 ('B01-DN', '417', '7. Chênh lệch tỷ giá hối đoái', 2, '400', NULL, 'VON'),
 ('B01-DN', '418', '8. Các quỹ thuộc vốn chủ sở hữu', 2, '400', NULL, 'VON'),
 ('B01-DN', '419', '9. Lợi nhuận sau thuế chưa phân phối', 2, '400', NULL, 'VON'),
 ('B01-DN', '420', '10. Lợi ích cổ đông không kiểm soát', 2, '400', NULL, 'VON'),
 ('B01-DN', '440', 'TỔNG CỘNG NGUỒN VỐN (440 = 300 + 400)', 1, NULL, '300+400', 'VON')
ON CONFLICT (ma_mau, ma_chi_tieu) DO UPDATE
  SET ten_chi_tieu = EXCLUDED.ten_chi_tieu, cap = EXCLUDED.cap,
      ma_me = EXCLUDED.ma_me, cong_thuc = EXCLUDED.cong_thuc, loai = EXCLUDED.loai;

-- ---------------------------------------------------------------------
-- 6. MAPPING CHI TIEU BCTC <-> TAI KHOAN (bo khoi tao — can ra soat bo sung)
--    he_so = 1: cong vao; he_so = -1: tru ra (du phong, giam tru)
--    chieu = DU_NO | DU_CO | PS_NO | PS_CO
-- ---------------------------------------------------------------------
INSERT INTO map_chi_tieu_tk (ma_mau, ma_chi_tieu, ma_tk, he_so, chieu, ghi_chu) VALUES
 ('B01-DN', '111', '111', 1, 'DU_NO', 'Tiền mặt'),
 ('B01-DN', '111', '112', 1, 'DU_NO', 'Tiền gửi không kỳ hạn'),
 ('B01-DN', '111', '113', 1, 'DU_NO', 'Tiền đang chuyển'),
 ('B01-DN', '112', '1281', 1, 'DU_NO', 'Tiền gửi có kỳ hạn <= 3 tháng (phần tương đương tiền)'),
 ('B01-DN', '121', '121', 1, 'DU_NO', 'Chứng khoán kinh doanh'),
 ('B01-DN', '123', '1281', 1, 'DU_NO', 'Đầu tư nắm giữ đến ngày đáo hạn ngắn hạn'),
 ('B01-DN', '123', '1282', 1, 'DU_NO', 'Trái phiếu'),
 ('B01-DN', '123', '1288', 1, 'DU_NO', 'Các khoản đầu tư khác nắm giữ đến ngày đáo hạn'),
 ('B01-DN', '131', '131', 1, 'DU_NO', 'Phải thu ngắn hạn của khách hàng'),
 ('B01-DN', '132', '331', 1, 'DU_NO', 'Trả trước cho người bán (dư Nợ 331)'),
 ('B01-DN', '133', '136', 1, 'DU_NO', 'Phải thu nội bộ ngắn hạn'),
 ('B01-DN', '135', '138', 1, 'DU_NO', 'Phải thu ngắn hạn khác'),
 ('B01-DN', '135', '141', 1, 'DU_NO', 'Tạm ứng'),
 ('B01-DN', '135', '244', 1, 'DU_NO', 'Ký quỹ, ký cược ngắn hạn'),
 ('B01-DN', '137', '1381', 1, 'DU_NO', 'Tài sản thiếu chờ xử lý'),
 ('B01-DN', '141', '151', 1, 'DU_NO', 'Hàng mua đang đi đường'),
 ('B01-DN', '141', '152', 1, 'DU_NO', 'Nguyên liệu, vật liệu'),
 ('B01-DN', '141', '153', 1, 'DU_NO', 'Công cụ, dụng cụ'),
 ('B01-DN', '141', '154', 1, 'DU_NO', 'Chi phí SXKD dở dang'),
 ('B01-DN', '141', '155', 1, 'DU_NO', 'Sản phẩm'),
 ('B01-DN', '141', '156', 1, 'DU_NO', 'Hàng hóa'),
 ('B01-DN', '141', '157', 1, 'DU_NO', 'Hàng gửi đi bán'),
 ('B01-DN', '141', '158', 1, 'DU_NO', 'Nguyên liệu, vật tư tại kho bảo thuế'),
 ('B01-DN', '142', '2294', -1, 'DU_CO', 'Dự phòng giảm giá hàng tồn kho'),
 ('B01-DN', '151', '2152', 1, 'DU_NO', 'Súc vật nuôi lấy sản phẩm một lần (ngắn hạn)'),
 ('B01-DN', '152', '2153', 1, 'DU_NO', 'Cây trồng theo mùa vụ (ngắn hạn)'),
 ('B01-DN', '153', '2295', -1, 'DU_CO', 'Dự phòng tổn thất tài sản sinh học'),
 ('B01-DN', '161', '242', 1, 'DU_NO', 'Chi phí chờ phân bổ ngắn hạn'),
 ('B01-DN', '162', '133', 1, 'DU_NO', 'Thuế GTGT được khấu trừ'),
 ('B01-DN', '163', '333', 1, 'DU_NO', 'Thuế và các khoản khác phải thu Nhà nước'),
 ('B01-DN', '164', '171', 1, 'DU_NO', 'Giao dịch mua bán lại trái phiếu Chính phủ'),
 ('B01-DN', '211', '131', 1, 'DU_NO', 'Phải thu dài hạn của khách hàng'),
 ('B01-DN', '213', '1361', 1, 'DU_NO', 'Vốn kinh doanh ở đơn vị trực thuộc'),
 ('B01-DN', '222', '211', 1, 'DU_NO', 'Nguyên giá TSCĐ hữu hình'),
 ('B01-DN', '223', '2141', -1, 'DU_CO', 'Hao mòn TSCĐ hữu hình'),
 ('B01-DN', '225', '212', 1, 'DU_NO', 'Nguyên giá TSCĐ thuê tài chính'),
 ('B01-DN', '226', '2142', -1, 'DU_CO', 'Hao mòn TSCĐ thuê tài chính'),
 ('B01-DN', '228', '213', 1, 'DU_NO', 'Nguyên giá TSCĐ vô hình'),
 ('B01-DN', '229', '2143', -1, 'DU_CO', 'Hao mòn TSCĐ vô hình'),
 ('B01-DN', '231', '2151', 1, 'DU_NO', 'Súc vật nuôi cho sản phẩm định kỳ'),
 ('B01-DN', '241', '217', 1, 'DU_NO', 'Nguyên giá bất động sản đầu tư'),
 ('B01-DN', '242', '2147', -1, 'DU_CO', 'Hao mòn bất động sản đầu tư'),
 ('B01-DN', '251', '154', 1, 'DU_NO', 'Chi phí SXKD dở dang dài hạn'),
 ('B01-DN', '252', '241', 1, 'DU_NO', 'Chi phí xây dựng cơ bản dở dang'),
 ('B01-DN', '261', '221', 1, 'DU_NO', 'Đầu tư vào công ty con'),
 ('B01-DN', '262', '222', 1, 'DU_NO', 'Đầu tư vào công ty liên doanh, liên kết'),
 ('B01-DN', '263', '228', 1, 'DU_NO', 'Đầu tư góp vốn vào đơn vị khác'),
 ('B01-DN', '264', '2292', -1, 'DU_CO', 'Dự phòng tổn thất đầu tư vào đơn vị khác'),
 ('B01-DN', '271', '242', 1, 'DU_NO', 'Chi phí chờ phân bổ dài hạn'),
 ('B01-DN', '272', '243', 1, 'DU_NO', 'Tài sản thuế thu nhập hoãn lại'),
 ('B01-DN', '273', '153', 1, 'DU_NO', 'Thiết bị, vật tư, phụ tùng thay thế dài hạn'),
 ('B01-DN', '311', '331', 1, 'DU_CO', 'Phải trả người bán ngắn hạn'),
 ('B01-DN', '312', '131', 1, 'DU_CO', 'Người mua trả tiền trước (dư Có 131)'),
 ('B01-DN', '313', '332', 1, 'DU_CO', 'Phải trả cổ tức, lợi nhuận'),
 ('B01-DN', '314', '333', 1, 'DU_CO', 'Thuế và các khoản phải nộp Nhà nước ngắn hạn'),
 ('B01-DN', '315', '334', 1, 'DU_CO', 'Phải trả người lao động'),
 ('B01-DN', '316', '335', 1, 'DU_CO', 'Chi phí phải trả ngắn hạn'),
 ('B01-DN', '317', '336', 1, 'DU_CO', 'Phải trả nội bộ ngắn hạn'),
 ('B01-DN', '318', '337', 1, 'DU_CO', 'Phải trả theo tiến độ hợp đồng xây dựng'),
 ('B01-DN', '319', '3387', 1, 'DU_CO', 'Doanh thu chờ phân bổ ngắn hạn'),
 ('B01-DN', '320', '338', 1, 'DU_CO', 'Phải trả ngắn hạn khác'),
 ('B01-DN', '321', '341', 1, 'DU_CO', 'Vay và nợ thuê tài chính ngắn hạn'),
 ('B01-DN', '322', '352', 1, 'DU_CO', 'Dự phòng phải trả ngắn hạn'),
 ('B01-DN', '323', '353', 1, 'DU_CO', 'Quỹ khen thưởng, phúc lợi'),
 ('B01-DN', '324', '357', 1, 'DU_CO', 'Quỹ bình ổn giá'),
 ('B01-DN', '325', '171', 1, 'DU_CO', 'Giao dịch mua bán lại trái phiếu Chính phủ'),
 ('B01-DN', '334', '335', 1, 'DU_CO', 'Chi phí phải trả dài hạn'),
 ('B01-DN', '335', '3361', 1, 'DU_CO', 'Phải trả nội bộ về vốn kinh doanh'),
 ('B01-DN', '337', '3387', 1, 'DU_CO', 'Doanh thu chờ phân bổ dài hạn'),
 ('B01-DN', '339', '341', 1, 'DU_CO', 'Vay và nợ thuê tài chính dài hạn'),
 ('B01-DN', '340', '3432', 1, 'DU_CO', 'Trái phiếu chuyển đổi'),
 ('B01-DN', '342', '347', 1, 'DU_CO', 'Thuế thu nhập hoãn lại phải trả'),
 ('B01-DN', '344', '356', 1, 'DU_CO', 'Quỹ phát triển khoa học và công nghệ'),
 ('B01-DN', '411a', '4111', 1, 'DU_CO', 'Vốn góp của chủ sở hữu'),
 ('B01-DN', '412', '4112', 1, 'DU_CO', 'Thặng dư vốn'),
 ('B01-DN', '413', '4113', 1, 'DU_CO', 'Quyền chọn chuyển đổi trái phiếu'),
 ('B01-DN', '414', '4118', 1, 'DU_CO', 'Vốn khác của chủ sở hữu'),
 ('B01-DN', '415', '419', -1, 'DU_NO', 'Cổ phiếu mua lại của chính mình (giảm trừ)'),
 ('B01-DN', '416', '412', 1, 'DU_CO', 'Chênh lệch đánh giá lại tài sản'),
 ('B01-DN', '417', '413', 1, 'DU_CO', 'Chênh lệch tỷ giá hối đoái'),
 ('B01-DN', '418', '414', 1, 'DU_CO', 'Quỹ đầu tư phát triển'),
 ('B01-DN', '418', '418', 1, 'DU_CO', 'Các quỹ khác thuộc vốn chủ sở hữu'),
 ('B01-DN', '419', '421', 1, 'DU_CO', 'Lợi nhuận sau thuế chưa phân phối')
ON CONFLICT (ma_mau, ma_chi_tieu, ma_tk, chieu) DO UPDATE
  SET he_so = EXCLUDED.he_so, ghi_chu = EXCLUDED.ghi_chu;

-- ---------------------------------------------------------------------
-- 7. KIEM TRA
-- ---------------------------------------------------------------------
-- Ky vong: so_ke_toan = 42, bctc = 15, chung_tu = 33
SELECT 'dm_bieu_mau_so' AS bang, COUNT(*) AS so_dong FROM dm_bieu_mau_so
UNION ALL SELECT 'dm_bieu_mau_bctc', COUNT(*) FROM dm_bieu_mau_bctc
UNION ALL SELECT 'dm_loai_chung_tu_mau', COUNT(*) FROM dm_loai_chung_tu_mau
UNION ALL SELECT 'dm_chi_tieu_bctc', COUNT(*) FROM dm_chi_tieu_bctc
UNION ALL SELECT 'map_chi_tieu_tk', COUNT(*) FROM map_chi_tieu_tk;

-- Bat buoc: chi tieu BCTC '112' phai la 'Cac khoan tuong duong tien'
SELECT ma_chi_tieu, ten_chi_tieu FROM dm_chi_tieu_bctc
 WHERE ma_mau = 'B01-DN' AND ma_chi_tieu = '112';

-- Bat buoc: tong cong tai san dung ma 280
SELECT ma_chi_tieu, cong_thuc FROM dm_chi_tieu_bctc
 WHERE ma_mau = 'B01-DN' AND ma_chi_tieu = '280';

COMMIT;
