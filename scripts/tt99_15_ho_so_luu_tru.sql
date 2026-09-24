-- =============================================================================
-- PHÂN HỆ HỒ SƠ – LƯU TRỮ KẾ TOÁN — DDL + SEED + VIEW + HÀM TRÍCH XUẤT
-- PostgreSQL 16 (Supabase)
-- Kèm theo: 14_THIET_KE_HO_SO_LUU_TRU.md
--
-- Đặt file tại: D:\VComm\vcomm-erp\scripts\tt99_15_ho_so_luu_tru.sql
-- Chạy bằng runner tsx sau khi 03_schema.sql (lõi kế toán) đã chạy xong.
--
-- ⚠️ ÁP DỤNG QUYẾT ĐỊNH KIẾN TRÚC (11_CAU_HINH_STACK_VCOMM_ERP.md §5):
--   Q1. Tên bảng tiếng Việt dm_* / hs_* — giữ nguyên.
--   Q2. Sổ kế toán nội bộ là NGUỒN CHÂN LÝ. MISA AMIS chỉ phát hành HĐĐT.
--   Q3. MỘT pháp nhân kế toán. Mọi bảng mang tenant_id TEXT
--       DEFAULT 'tenant-vcomm-prod-01' + Row Level Security.
--
-- ⚠️ CĂN CỨ PHÁP LÝ:
--   • Luật Kế toán 2015 (88/2015/QH13) Điều 41 — hạn 12 tháng; 3 mức thời hạn
--   • NĐ 174/2016/NĐ-CP:
--       Điều 8  — danh mục tài liệu kế toán phải lưu trữ
--       Điều 9  — PHẢI phân loại, sắp xếp theo thứ tự thời gian phát sinh
--                 và theo kỳ kế toán năm  ← TRỤC GỐC CỦA THIẾT KẾ NÀY
--       Điều 11 — nơi lưu trữ (kho của đơn vị hoặc thuê tổ chức lưu trữ)
--       Điều 12 — lưu trữ tối thiểu 5 năm
--       Điều 13 — lưu trữ tối thiểu 10 năm (7 khoản)
--       Điều 14 — lưu trữ vĩnh viễn (Đ.14.2: doanh nghiệp do người đại diện
--                 theo pháp luật QUYẾT ĐỊNH từng trường hợp — KHÔNG hard-code)
--       Điều 15 — thời điểm tính thời hạn lưu trữ (3 mốc khác nhau)
--       Điều 16 — tiêu hủy: Hội đồng, Danh mục tiêu hủy, Biên bản tiêu hủy
--   • NĐ 41/2018/NĐ-CP Điều 15 — xử phạt; đặc biệt điểm 15.1.b xử phạt hành vi
--     KHÔNG sắp xếp tài liệu theo thứ tự thời gian phát sinh & kỳ kế toán năm
--   • TT 99/2025/TT-BTC Điều 28 khoản 1 điểm b (tra cứu theo trình tự thời gian)
--     và điểm d (cung cấp đầy đủ dữ liệu đầu ra theo yêu cầu cơ quan có thẩm quyền)
--
-- ⚠️ NGUYÊN TẮC KIẾN TRÚC (14 §2.3, §5.2):
--   PHÂN LOẠI MỘT LẦN KHI NHẬP — TRÍCH XUẤT THEO MỌI TRỤC.
--   MỘT TRỤC THỜI GIAN, SÁU PHÉP CẮT (NGAY|TUAN|THANG|QUY|BAN_NIEN|NAM).
--   KHÔNG có bảng tổng hợp riêng cho từng mức thời gian.
--   KHÔNG có 6 báo cáo riêng — chỉ 1 view phẳng + 1 hàm nhận tham số mức.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS acc;
SET search_path TO acc, public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- PHẦN A. DANH MỤC LOẠI HỒ SƠ (3 CẤP)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A1. dm_loai_ho_so — cây 3 cấp: 18 phần → nhóm con → thành phần
-- -----------------------------------------------------------------------------
-- ma_loai là khóa tự nhiên có cấu trúc:
--   cấp 1: '01' … '18'          (2 ký tự)
--   cấp 2: '04.1', '08.5'       (4 ký tự)
--   cấp 3: '04.1.01', '08.5.02' (7 ký tự)
--
-- truc phân biệt ba loại trục nghiệp vụ (xem 14 §2.2):
--   NGHIEP_VU — phần 01–11: loại hồ sơ thật, phân loại BẮT BUỘC
--   NGANH     — phần 12–17: danh mục kiểm tra bổ sung theo ngành, KHÔNG phải
--               loại hồ sơ mới; trỏ về thành phần gốc qua cột tro_toi
--   HOP_DONG  — phần 18: trục phụ xuyên suốt
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dm_loai_ho_so (
    ma_loai             VARCHAR(20)  PRIMARY KEY,
    ma_loai_cha         VARCHAR(20)  REFERENCES dm_loai_ho_so(ma_loai),
    cap                 SMALLINT     NOT NULL,
    ten_loai            VARCHAR(255) NOT NULL,
    truc                VARCHAR(20)  NOT NULL,
    linh_vuc            VARCHAR(20),
    -- Thời hạn lưu trữ: NAM_5 (NĐ174 Đ.12) | NAM_10 (Đ.13.6, mặc định)
    --                   VINH_VIEN (Đ.14.2 — chỉ do người đại diện quyết định)
    --                   KE_THUA (phần 12–17 kế thừa từ thành phần gốc)
    thoi_han_luu_tru    VARCHAR(20)  NOT NULL DEFAULT 'NAM_10',
    moc_tinh_thoi_han   VARCHAR(30)  NOT NULL DEFAULT 'KET_THUC_NAM_TC',
    bat_buoc            BOOLEAN      NOT NULL DEFAULT FALSE,
    nguon_tu_dong       VARCHAR(20)  NOT NULL DEFAULT 'NGOAI',
    tai_khoan_lien_quan TEXT,
    so_hieu_mau_tt99    VARCHAR(60),
    -- Phần 12–17: trỏ tới mã cấp 3 gốc ở phần 01–11 (cùng bản ghi, không trùng lặp)
    tro_toi             VARCHAR(20)  REFERENCES dm_loai_ho_so(ma_loai),
    -- Gợi ý cho người dùng đánh dấu vĩnh viễn (Đ.14.2) — KHÔNG tự động áp dụng
    goi_y_vinh_vien     BOOLEAN      NOT NULL DEFAULT FALSE,
    thu_tu              INT          NOT NULL DEFAULT 0,
    mo_ta               VARCHAR(500),
    ngung_su_dung       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_lhs_cap   CHECK (cap IN (1,2,3)),
    CONSTRAINT ck_lhs_truc  CHECK (truc IN ('NGHIEP_VU','NGANH','HOP_DONG')),
    CONSTRAINT ck_lhs_th    CHECK (thoi_han_luu_tru IN ('NAM_5','NAM_10','VINH_VIEN','KE_THUA')),
    CONSTRAINT ck_lhs_moc   CHECK (moc_tinh_thoi_han IN
                             ('KET_THUC_NAM_TC','DUYET_QT_DA','NGAY_THANH_LAP',
                              'NGAY_THAY_DOI','NGAY_KIEM_TOAN')),
    CONSTRAINT ck_lhs_nguon CHECK (nguon_tu_dong IN ('ERP','KE_TOAN','NGOAI','KE_THUA')),
    CONSTRAINT ck_lhs_lv    CHECK (linh_vuc IS NULL OR linh_vuc IN
                             ('THUONG_MAI','DICH_VU','SAN_XUAT','XAY_DUNG','XNK','BDS')),
    -- Cấp 1 không có cha; cấp 2, 3 phải có cha
    CONSTRAINT ck_lhs_cha   CHECK ((cap = 1 AND ma_loai_cha IS NULL)
                                OR (cap > 1 AND ma_loai_cha IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS ix_lhs_cha  ON dm_loai_ho_so (ma_loai_cha);
CREATE INDEX IF NOT EXISTS ix_lhs_truc ON dm_loai_ho_so (truc, cap);

-- -----------------------------------------------------------------------------
-- A2. dm_bo_ho_so_mau — mẫu bộ hồ sơ (chuỗi nghiệp vụ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dm_bo_ho_so_mau (
    id                 BIGSERIAL    PRIMARY KEY,
    tenant_id          TEXT         NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ma_mau             VARCHAR(30)  NOT NULL,
    ten_mau            VARCHAR(255) NOT NULL,
    loai_ho_so_chinh   VARCHAR(20)  REFERENCES dm_loai_ho_so(ma_loai),
    linh_vuc_ap_dung   TEXT[],      -- {THUONG_MAI,SAN_XUAT} — NULL = mọi ngành
    mo_ta              VARCHAR(500),
    bat_buoc_toi_thieu INT          NOT NULL DEFAULT 1,
    ngung_su_dung      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_bhsm UNIQUE (tenant_id, ma_mau)
);

-- -----------------------------------------------------------------------------
-- A3. dm_bo_ho_so_mau_ct — thành phần của mẫu
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dm_bo_ho_so_mau_ct (
    id            BIGSERIAL   PRIMARY KEY,
    mau_id        BIGINT      NOT NULL REFERENCES dm_bo_ho_so_mau(id) ON DELETE CASCADE,
    ma_loai_ho_so VARCHAR(20) NOT NULL REFERENCES dm_loai_ho_so(ma_loai),
    bat_buoc      BOOLEAN     NOT NULL DEFAULT FALSE,
    thu_tu        INT         NOT NULL DEFAULT 0,
    nguon         VARCHAR(20) NOT NULL DEFAULT 'NGOAI',
    ghi_chu       VARCHAR(500),
    CONSTRAINT uq_bhsmct UNIQUE (mau_id, ma_loai_ho_so),
    CONSTRAINT ck_bhsmct_nguon CHECK (nguon IN ('ERP','KE_TOAN','NGOAI'))
);
CREATE INDEX IF NOT EXISTS ix_bhsmct_mau ON dm_bo_ho_so_mau_ct (mau_id, thu_tu);

-- =============================================================================
-- PHẦN B. NGHIỆP VỤ HỒ SƠ
-- =============================================================================

-- -----------------------------------------------------------------------------
-- B1. hs_vi_tri — vị trí lưu trữ (NĐ 174 Điều 11)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_vi_tri (
    id               BIGSERIAL    PRIMARY KEY,
    tenant_id        TEXT         NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ma_vi_tri        VARCHAR(100) NOT NULL,
    loai_vi_tri      VARCHAR(20)  NOT NULL DEFAULT 'DIEN_TU',
    ten_vi_tri       VARCHAR(255) NOT NULL,
    vi_tri_cha_id    BIGINT       REFERENCES hs_vi_tri(id),
    don_vi_thue      VARCHAR(255),
    hop_dong_luu_tru VARCHAR(100),
    suc_chua         INT,
    dang_dung        INT          NOT NULL DEFAULT 0,
    ngung_su_dung    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by       BIGINT,
    updated_at       TIMESTAMPTZ,
    updated_by       BIGINT,
    deleted_at       TIMESTAMPTZ,
    CONSTRAINT uq_hs_vt      UNIQUE (tenant_id, ma_vi_tri),
    CONSTRAINT ck_hs_vt_loai CHECK (loai_vi_tri IN ('DIEN_TU','VAT_LY','THUE_NGOAI'))
);
CREATE INDEX IF NOT EXISTS ix_hs_vt_cha ON hs_vi_tri (tenant_id, vi_tri_cha_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- B2. hs_tai_lieu — tài liệu KHÔNG phải chứng từ kế toán
-- -----------------------------------------------------------------------------
-- Điểm khác biệt then chốt so với ct_dinh_kem: hợp đồng, PO, biên bản giao nhận,
-- tờ khai thuế, C/O KHÔNG có bút toán → không thể nhồi vào ct_chung_tu.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_tai_lieu (
    id            BIGSERIAL    PRIMARY KEY,
    tenant_id     TEXT         NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ma_loai_ho_so VARCHAR(20)  NOT NULL REFERENCES dm_loai_ho_so(ma_loai),
    ten_tai_lieu  VARCHAR(500) NOT NULL,
    so_tai_lieu   VARCHAR(100),         -- số hợp đồng / số PO / số tờ khai
    ngay_tai_lieu DATE         NOT NULL, -- ngày ký / ngày lập — trục thời gian
    ngay_het_han  DATE,
    doi_tuong_id  BIGINT       REFERENCES dm_doi_tuong(id),
    gia_tri       DECIMAL(19,4),
    tien_te       VARCHAR(3)   NOT NULL DEFAULT 'VND',
    file_path     VARCHAR(500),
    mime_type     VARCHAR(100),
    dung_luong    BIGINT,
    checksum      VARCHAR(64),          -- SHA-256
    la_ban_chinh  BOOLEAN      NOT NULL DEFAULT TRUE,  -- NĐ 174 Đ.9
    trang_thai    VARCHAR(20)  NOT NULL DEFAULT 'HIEU_LUC',
    ghi_chu       VARCHAR(1000),
    row_version   INT          NOT NULL DEFAULT 1,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by    BIGINT,
    updated_at    TIMESTAMPTZ,
    updated_by    BIGINT,
    deleted_at    TIMESTAMPTZ,
    CONSTRAINT ck_htl_tt   CHECK (trang_thai IN ('HIEU_LUC','HET_HAN','DA_THAY_THE')),
    CONSTRAINT ck_htl_size CHECK (dung_luong IS NULL OR dung_luong <= 10485760),
    CONSTRAINT ck_htl_ngay CHECK (ngay_het_han IS NULL OR ngay_het_han >= ngay_tai_lieu)
);
CREATE INDEX IF NOT EXISTS ix_htl_ngay   ON hs_tai_lieu (tenant_id, ngay_tai_lieu DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_htl_loai   ON hs_tai_lieu (tenant_id, ma_loai_ho_so)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_htl_so     ON hs_tai_lieu (tenant_id, so_tai_lieu)        WHERE so_tai_lieu IS NOT NULL;

-- -----------------------------------------------------------------------------
-- B3. hs_ho_so — bộ hồ sơ  ★ TRỤC THỜI GIAN LÀ TRỤC GỐC
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_ho_so (
    id             BIGSERIAL    PRIMARY KEY,
    tenant_id      TEXT         NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    so_ho_so       VARCHAR(40)  NOT NULL,
    mau_id         BIGINT       REFERENCES dm_bo_ho_so_mau(id),
    ma_loai_ho_so  VARCHAR(20)  NOT NULL REFERENCES dm_loai_ho_so(ma_loai),
    ten_ho_so      VARCHAR(500) NOT NULL,
    ky_ke_toan_id  BIGINT       NOT NULL REFERENCES dm_ky_ke_toan(id),

    -- ═══ TRỤC GỐC: thời gian phát sinh (NĐ 174 Đ.9) ═══
    ngay_phat_sinh DATE NOT NULL,

    -- 6 mức thời gian — GENERATED, KHÔNG BAO GIỜ nhập tay
    nam          INT GENERATED ALWAYS AS (EXTRACT(YEAR    FROM ngay_phat_sinh)::INT) STORED,
    thang        INT GENERATED ALWAYS AS (EXTRACT(MONTH   FROM ngay_phat_sinh)::INT) STORED,
    quy          INT GENERATED ALWAYS AS (EXTRACT(QUARTER FROM ngay_phat_sinh)::INT) STORED,
    ky_6thang    INT GENERATED ALWAYS AS
                     (CASE WHEN EXTRACT(MONTH FROM ngay_phat_sinh) <= 6 THEN 1 ELSE 2 END) STORED,
    -- ISOYEAR chứ không YEAR: tránh lệch ở ranh giới năm (xem 14 §4.2)
    tuan_iso     INT GENERATED ALWAYS AS (EXTRACT(WEEK    FROM ngay_phat_sinh)::INT) STORED,
    nam_tuan_iso INT GENERATED ALWAYS AS (EXTRACT(ISOYEAR FROM ngay_phat_sinh)::INT) STORED,

    -- Trục đối tượng
    doi_tuong_id  BIGINT REFERENCES dm_doi_tuong(id),
    hang_hoa_id   BIGINT REFERENCES dm_hang_hoa(id),
    kho_id        BIGINT REFERENCES dm_kho(id),
    -- ⚠️ dm_tai_san / dm_cong_trinh chưa có trong 03_schema.sql → để BIGINT trần.
    --    Khi hai bảng đó được thêm, bổ sung FK bằng migration riêng.
    tai_san_id    BIGINT,
    cong_trinh_id BIGINT,
    hop_dong_id   BIGINT REFERENCES hs_tai_lieu(id),
    nhan_vien_id  BIGINT,

    -- Lưu trữ
    hinh_thuc_luu_tru VARCHAR(20) NOT NULL DEFAULT 'DIEN_TU',   -- NĐ 174 Đ.9
    vi_tri_id         BIGINT      REFERENCES hs_vi_tri(id),
    trang_thai        VARCHAR(20) NOT NULL DEFAULT 'DANG_MO',

    -- Thời hạn lưu trữ
    thoi_han_luu_tru     VARCHAR(20) NOT NULL DEFAULT 'NAM_10',
    moc_tinh_thoi_han    VARCHAR(30) NOT NULL DEFAULT 'KET_THUC_NAM_TC',
    ngay_dua_vao_luu_tru DATE,
    -- Hạn đưa vào lưu trữ = ngày kết thúc kỳ kế toán năm + 12 tháng (Luật KT Đ.41)
    -- Tính theo năm dương lịch; nếu kỳ kế toán khác năm dương lịch, service cập nhật.
    han_dua_vao_luu_tru  DATE GENERATED ALWAYS AS
        ((make_date(EXTRACT(YEAR FROM ngay_phat_sinh)::INT, 12, 31) + INTERVAL '12 months')::DATE) STORED,
    ngay_het_han_luu_tru DATE,   -- NULL khi VINH_VIEN (NĐ 174 Đ.14.3)

    -- Chất lượng hồ sơ
    so_luong_tai_lieu INT          NOT NULL DEFAULT 0,
    ty_le_day_du      NUMERIC(5,2) NOT NULL DEFAULT 0,

    -- Quyết định vĩnh viễn (NĐ 174 Đ.14.2)
    ly_do_vinh_vien            VARCHAR(500),
    nguoi_quyet_dinh_vinh_vien BIGINT,
    ghi_chu      VARCHAR(1000),
    row_version  INT          NOT NULL DEFAULT 1,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by   BIGINT,
    updated_at   TIMESTAMPTZ,
    updated_by   BIGINT,
    deleted_at   TIMESTAMPTZ,

    CONSTRAINT uq_hs UNIQUE (tenant_id, so_ho_so),
    CONSTRAINT ck_hs_tt CHECK (trang_thai IN
        ('DANG_MO','DA_DU','THIEU','DA_LUU_TRU','DA_TIEU_HUY')),
    CONSTRAINT ck_hs_hinhthuc CHECK (hinh_thuc_luu_tru IN ('DIEN_TU','GIAY','CA_HAI')),
    CONSTRAINT ck_hs_th CHECK (thoi_han_luu_tru IN ('NAM_5','NAM_10','VINH_VIEN')),
    CONSTRAINT ck_hs_moc CHECK (moc_tinh_thoi_han IN
        ('KET_THUC_NAM_TC','DUYET_QT_DA','NGAY_THANH_LAP','NGAY_THAY_DOI','NGAY_KIEM_TOAN')),
    -- Vĩnh viễn ⇒ KHÔNG có ngày hết hạn (NĐ 174 Đ.14.3)
    CONSTRAINT ck_hs_vinhvien_han CHECK
        (thoi_han_luu_tru <> 'VINH_VIEN' OR ngay_het_han_luu_tru IS NULL),
    -- Vĩnh viễn ⇒ BẮT BUỘC có lý do + người quyết định (NĐ 174 Đ.14.2)
    CONSTRAINT ck_hs_vinhvien_lydo CHECK
        (thoi_han_luu_tru <> 'VINH_VIEN'
         OR (ly_do_vinh_vien IS NOT NULL AND nguoi_quyet_dinh_vinh_vien IS NOT NULL)),
    CONSTRAINT ck_hs_tyle CHECK (ty_le_day_du BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS ix_hs_ngay_phat_sinh ON hs_ho_so (ngay_phat_sinh);
CREATE INDEX IF NOT EXISTS ix_hs_nam_thang       ON hs_ho_so (nam, thang);
CREATE INDEX IF NOT EXISTS ix_hs_nam_quy         ON hs_ho_so (nam, quy);
CREATE INDEX IF NOT EXISTS ix_hs_ky_ke_toan      ON hs_ho_so (ky_ke_toan_id);
CREATE INDEX IF NOT EXISTS ix_hs_ma_loai         ON hs_ho_so (ma_loai_ho_so);
CREATE INDEX IF NOT EXISTS ix_hs_doi_tuong       ON hs_ho_so (doi_tuong_id)  WHERE doi_tuong_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_hs_hop_dong        ON hs_ho_so (hop_dong_id)   WHERE hop_dong_id   IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_hs_cong_trinh      ON hs_ho_so (cong_trinh_id) WHERE cong_trinh_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_hs_dang_mo         ON hs_ho_so (trang_thai, han_dua_vao_luu_tru)
    WHERE trang_thai IN ('DANG_MO','THIEU');
-- tenant_id LUÔN đứng đầu index tổ hợp (RLS luôn thêm điều kiện tenant_id)
CREATE INDEX IF NOT EXISTS ix_hs_tenant_ngay     ON hs_ho_so (tenant_id, ngay_phat_sinh);

-- -----------------------------------------------------------------------------
-- B4. hs_thanh_phan — thành phần thực tế của bộ hồ sơ (n-n)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_thanh_phan (
    id            BIGSERIAL   PRIMARY KEY,
    ho_so_id      BIGINT      NOT NULL REFERENCES hs_ho_so(id) ON DELETE CASCADE,
    ma_loai_ho_so VARCHAR(20) NOT NULL REFERENCES dm_loai_ho_so(ma_loai),
    chung_tu_id   BIGINT      REFERENCES ct_chung_tu(id),   -- NULL nếu là tài liệu ngoài
    tai_lieu_id   BIGINT      REFERENCES hs_tai_lieu(id),   -- NULL nếu là chứng từ KT
    bat_buoc      BOOLEAN     NOT NULL DEFAULT FALSE,  -- bản chụp từ mẫu (HSo-21)
    -- co_tai_lieu = "thành phần này đã có nguồn hay chưa"
    --   COALESCE(...) IS NOT NULL  ⇔  (chung_tu_id IS NOT NULL OR tai_lieu_id IS NOT NULL)
    --   Viết dạng COALESCE để tương thích parser (sqlglot không nhận OR trong GENERATED)
    co_tai_lieu   BOOLEAN     GENERATED ALWAYS AS
                      (COALESCE(chung_tu_id, tai_lieu_id) IS NOT NULL) STORED,
    thu_tu        INT         NOT NULL DEFAULT 0,
    ghi_chu       VARCHAR(500),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    BIGINT,
    updated_at    TIMESTAMPTZ,
    updated_by    BIGINT,
    -- Đúng MỘT nguồn: chứng từ XOR tài liệu (HSo-04)
    CONSTRAINT ck_htp_mot_nguon CHECK (num_nonnulls(chung_tu_id, tai_lieu_id) = 1),
    -- Không gắn cùng chứng từ vào 2 thành phần trong cùng bộ hồ sơ (HSo-05)
    CONSTRAINT uq_htp_ct UNIQUE (ho_so_id, chung_tu_id)
);
CREATE INDEX IF NOT EXISTS ix_htp_ho_so   ON hs_thanh_phan (ho_so_id, thu_tu);
CREATE INDEX IF NOT EXISTS ix_htp_ma_loai ON hs_thanh_phan (ma_loai_ho_so);
CREATE INDEX IF NOT EXISTS ix_htp_ct      ON hs_thanh_phan (chung_tu_id) WHERE chung_tu_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_htp_tl      ON hs_thanh_phan (tai_lieu_id) WHERE tai_lieu_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- B5. hs_lich_su — lịch sử append-only (TT99 Đ.28.1.b)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_lich_su (
    id             BIGSERIAL    PRIMARY KEY,
    tenant_id      TEXT         NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ho_so_id       BIGINT,
    thanh_phan_id  BIGINT,
    hanh_dong      VARCHAR(30)  NOT NULL,
    nguoi_thuc_hien BIGINT,
    ten_nguoi      VARCHAR(150),
    thoi_gian      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    ip             VARCHAR(45),
    du_lieu_truoc  JSONB,
    du_lieu_sau    JSONB,
    ly_do          VARCHAR(500),
    CONSTRAINT ck_hls_hd CHECK (hanh_dong IN
        ('TAO','GAN_TAI_LIEU','GO_TAI_LIEU','CHUYEN_VI_TRI','MUON','TRA',
         'DANH_DAU_DAY_DU','DANH_DAU_THIEU','DANH_DAU_VINH_VIEN',
         'DE_XUAT_TIEU_HUY','TIEU_HUY','IN_BI','KET_XUAT')),
    -- Bắt buộc lý do với các hành động nhạy cảm (HSo-10, HSo-13)
    CONSTRAINT ck_hls_lydo CHECK
        (hanh_dong NOT IN ('GO_TAI_LIEU','MUON','TIEU_HUY','DANH_DAU_VINH_VIEN')
         OR ly_do IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS ix_hls_ho_so  ON hs_lich_su (tenant_id, ho_so_id, thoi_gian DESC);
CREATE INDEX IF NOT EXISTS ix_hls_hd     ON hs_lich_su (tenant_id, hanh_dong, thoi_gian DESC);

-- Chặn sửa/xóa ở tầng trigger (bổ sung cho REVOKE ở Phần D)
CREATE OR REPLACE FUNCTION fn_hs_lich_su_append_only() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'hs_lich_su là bảng append-only (TT99 Điều 28.1.b): không được % bản ghi.', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hs_lich_su_append_only ON hs_lich_su;
CREATE TRIGGER trg_hs_lich_su_append_only
    BEFORE UPDATE OR DELETE ON hs_lich_su
    FOR EACH ROW EXECUTE FUNCTION fn_hs_lich_su_append_only();

-- =============================================================================
-- PHẦN C. VIEW PHẲNG + HÀM TRÍCH XUẤT ĐA MỨC  (14 §5.3, §5.4)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- C1. v_ho_so_phang — nguồn sự thật duy nhất cho mọi trích xuất
--     Mỗi dòng = một thành phần trong một bộ hồ sơ, đã kèm cả 4 trục.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_ho_so_phang AS
SELECT
    -- Trục 1: nghiệp vụ (3 cấp)
    lh1.ma_loai       AS ma_loai_c1,
    lh1.ten_loai      AS ten_loai_c1,
    lh2.ma_loai       AS ma_loai_c2,
    lh2.ten_loai      AS ten_loai_c2,
    htp.ma_loai_ho_so AS ma_loai_c3,
    lh3.ten_loai      AS ten_loai_c3,

    -- Trục 2: thời gian (trục gốc + 6 mức)
    hs.ngay_phat_sinh,
    hs.nam, hs.thang, hs.quy, hs.ky_6thang, hs.tuan_iso, hs.nam_tuan_iso,
    hs.ky_ke_toan_id,

    -- Trục 3: đối tượng
    hs.doi_tuong_id, hs.hang_hoa_id, hs.kho_id,
    hs.tai_san_id, hs.cong_trinh_id, hs.hop_dong_id, hs.nhan_vien_id,

    -- Trục 4: trạng thái & mức đầy đủ
    hs.trang_thai, hs.ty_le_day_du, hs.thoi_han_luu_tru,
    htp.bat_buoc, htp.co_tai_lieu,

    -- Nhận dạng hồ sơ
    hs.id AS ho_so_id, hs.so_ho_so, hs.ten_ho_so,
    hs.hinh_thuc_luu_tru, hs.vi_tri_id,

    -- Nguồn: chứng từ kế toán
    htp.chung_tu_id, ct.so_ct AS so_chung_tu,
    ct.ngay_ct, ct.trang_thai AS trang_thai_chung_tu, ct.tong_cong AS tong_tien,

    -- Nguồn: tài liệu ngoài
    htp.tai_lieu_id, tl.so_tai_lieu, tl.ten_tai_lieu,
    tl.ngay_tai_lieu, tl.gia_tri AS gia_tri_tai_lieu,

    -- Hạn lưu trữ
    hs.han_dua_vao_luu_tru, hs.ngay_het_han_luu_tru, hs.ngay_dua_vao_luu_tru
FROM   hs_thanh_phan htp
JOIN   hs_ho_so     hs  ON hs.id = htp.ho_so_id AND hs.deleted_at IS NULL
JOIN   dm_loai_ho_so lh3 ON lh3.ma_loai = htp.ma_loai_ho_so
LEFT   JOIN dm_loai_ho_so lh2 ON lh2.ma_loai = lh3.ma_loai_cha
LEFT   JOIN dm_loai_ho_so lh1 ON lh1.ma_loai = lh2.ma_loai_cha
LEFT   JOIN ct_chung_tu   ct  ON ct.id = htp.chung_tu_id
LEFT   JOIN hs_tai_lieu   tl  ON tl.id = htp.tai_lieu_id;

-- -----------------------------------------------------------------------------
-- C2. fn_trich_xuat_ho_so — MỘT hàm, SÁU mức thời gian
--     Đổi p_muc_thoi_gian là đổi mức phân bổ — không đổi gì khác.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trich_xuat_ho_so(
    p_muc_thoi_gian TEXT    DEFAULT 'THANG',
    p_tu_ngay       DATE    DEFAULT NULL,
    p_den_ngay      DATE    DEFAULT NULL,
    p_nam           INT     DEFAULT NULL,
    p_ma_loai_c1    TEXT    DEFAULT NULL,
    p_ma_loai_c2    TEXT    DEFAULT NULL,
    p_doi_tuong_id  BIGINT  DEFAULT NULL,
    p_hop_dong_id   BIGINT  DEFAULT NULL,
    p_chi_bat_buoc  BOOLEAN DEFAULT FALSE,
    p_chi_thieu     BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    muc_thoi_gian   TEXT,
    ky_bat_dau      DATE,
    ky_ket_thuc     DATE,
    ma_loai         TEXT,
    ten_loai        TEXT,
    so_ho_so        BIGINT,
    so_thanh_phan   BIGINT,
    so_chung_tu     BIGINT,
    so_tai_lieu     BIGINT,
    so_thieu        BIGINT,
    tong_gia_tri    NUMERIC,
    ty_le_day_du_tb NUMERIC
)
LANGUAGE sql STABLE AS $$
    WITH loc AS (
        SELECT * FROM v_ho_so_phang
        WHERE  (p_tu_ngay      IS NULL OR ngay_phat_sinh >= p_tu_ngay)
          AND  (p_den_ngay     IS NULL OR ngay_phat_sinh <= p_den_ngay)
          AND  (p_nam          IS NULL OR nam = p_nam)
          AND  (p_ma_loai_c1   IS NULL OR ma_loai_c1 = p_ma_loai_c1)
          AND  (p_ma_loai_c2   IS NULL OR ma_loai_c2 = p_ma_loai_c2)
          AND  (p_doi_tuong_id IS NULL OR doi_tuong_id = p_doi_tuong_id)
          AND  (p_hop_dong_id  IS NULL OR hop_dong_id  = p_hop_dong_id)
          AND  (NOT p_chi_bat_buoc OR bat_buoc)
          AND  (NOT p_chi_thieu   OR ty_le_day_du < 100)
    ),
    nhom AS (
        SELECT *,
            CASE p_muc_thoi_gian
                WHEN 'NGAY'     THEN to_char(ngay_phat_sinh, 'YYYY-MM-DD')
                WHEN 'TUAN'     THEN to_char(nam_tuan_iso,'FM0000')||'-W'||to_char(tuan_iso,'FM00')
                WHEN 'THANG'    THEN to_char(nam,'FM0000')||'-'||to_char(thang,'FM00')
                WHEN 'QUY'      THEN to_char(nam,'FM0000')||'-Q'||quy
                WHEN 'BAN_NIEN' THEN to_char(nam,'FM0000')||'-H'||ky_6thang
                WHEN 'NAM'      THEN to_char(nam,'FM0000')
            END AS nhan_ky,
            CASE p_muc_thoi_gian
                WHEN 'NGAY'     THEN ngay_phat_sinh
                WHEN 'TUAN'     THEN date_trunc('week', ngay_phat_sinh)::DATE
                WHEN 'THANG'    THEN date_trunc('month', ngay_phat_sinh)::DATE
                WHEN 'QUY'      THEN date_trunc('quarter', ngay_phat_sinh)::DATE
                WHEN 'BAN_NIEN' THEN make_date(nam, CASE WHEN ky_6thang=1 THEN 1 ELSE 7 END, 1)
                WHEN 'NAM'      THEN make_date(nam, 1, 1)
            END AS ky_dau,
            CASE p_muc_thoi_gian
                WHEN 'NGAY'     THEN ngay_phat_sinh
                WHEN 'TUAN'     THEN (date_trunc('week', ngay_phat_sinh) + INTERVAL '6 days')::DATE
                WHEN 'THANG'    THEN (date_trunc('month', ngay_phat_sinh) + INTERVAL '1 month - 1 day')::DATE
                WHEN 'QUY'      THEN (date_trunc('quarter', ngay_phat_sinh) + INTERVAL '3 months - 1 day')::DATE
                WHEN 'BAN_NIEN' THEN make_date(nam, CASE WHEN ky_6thang=1 THEN 6 ELSE 12 END, 1)
                WHEN 'NAM'      THEN make_date(nam, 12, 31)
            END AS ky_cuoi
        FROM loc
    )
    SELECT
        nhan_ky, ky_dau, ky_cuoi,
        ma_loai_c1, ten_loai_c1,
        COUNT(DISTINCT ho_so_id)                                      AS so_ho_so,
        COUNT(*)                                                      AS so_thanh_phan,
        COUNT(chung_tu_id)                                            AS so_chung_tu,
        COUNT(tai_lieu_id)                                            AS so_tai_lieu,
        COUNT(*) FILTER (WHERE bat_buoc AND NOT co_tai_lieu)          AS so_thieu,
        COALESCE(SUM(tong_tien),0) + COALESCE(SUM(gia_tri_tai_lieu),0) AS tong_gia_tri,
        ROUND(AVG(ty_le_day_du), 2)                                   AS ty_le_day_du_tb
    FROM nhom
    GROUP BY nhan_ky, ky_dau, ky_cuoi, ma_loai_c1, ten_loai_c1
    ORDER BY ky_dau, ma_loai_c1;
$$;

-- -----------------------------------------------------------------------------
-- C3. fn_tinh_ty_le_day_du — tính lại % đầy đủ của một bộ hồ sơ (HSo-07)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_tinh_ty_le_day_du(p_ho_so_id BIGINT)
RETURNS NUMERIC AS $$
    SELECT COALESCE(
        ROUND(100.0 * COUNT(*) FILTER (WHERE bat_buoc AND co_tai_lieu)
              / NULLIF(COUNT(*) FILTER (WHERE bat_buoc), 0), 2), 0)
    FROM hs_thanh_phan
    WHERE ho_so_id = p_ho_so_id;
$$ LANGUAGE sql STABLE;

-- -----------------------------------------------------------------------------
-- C4. fn_bat_buoc_thanh_toan_khong_tien_mat — HSo-07
--     Hóa đơn ≥ 5 triệu ⇒ thành phần 04.3.01 trở thành bắt buộc
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_bat_buoc_thanh_toan_khong_tien_mat(p_ho_so_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE hs_thanh_phan htp
       SET bat_buoc = TRUE
     WHERE htp.ho_so_id = p_ho_so_id
       AND htp.ma_loai_ho_so = '04.3.01'
       AND EXISTS (
           SELECT 1 FROM hs_thanh_phan x
           JOIN ct_chung_tu ct ON ct.id = x.chung_tu_id
           WHERE x.ho_so_id = p_ho_so_id
             AND x.ma_loai_ho_so = '04.1.01'
             AND ct.tong_cong >= 5000000
       );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PHẦN D. ROW LEVEL SECURITY + QUYỀN (Q3)
-- =============================================================================
ALTER TABLE dm_bo_ho_so_mau    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_vi_tri          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_tai_lieu        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_ho_so           ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_lich_su         ENABLE ROW LEVEL SECURITY;
-- dm_loai_ho_so, dm_bo_ho_so_mau_ct là danh mục dùng chung (không phân vùng)

DROP POLICY IF EXISTS dm_bo_ho_so_mau_tenant_isolation ON dm_bo_ho_so_mau;
CREATE POLICY dm_bo_ho_so_mau_tenant_isolation ON dm_bo_ho_so_mau
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS hs_vi_tri_tenant_isolation ON hs_vi_tri;
CREATE POLICY hs_vi_tri_tenant_isolation ON hs_vi_tri
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS hs_tai_lieu_tenant_isolation ON hs_tai_lieu;
CREATE POLICY hs_tai_lieu_tenant_isolation ON hs_tai_lieu
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS hs_ho_so_tenant_isolation ON hs_ho_so;
CREATE POLICY hs_ho_so_tenant_isolation ON hs_ho_so
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS hs_lich_su_tenant_isolation ON hs_lich_su;
CREATE POLICY hs_lich_su_tenant_isolation ON hs_lich_su
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

-- Append-only ở tầng quyền (HSo-15)
REVOKE UPDATE, DELETE ON hs_lich_su FROM PUBLIC;

-- =============================================================================
-- PHẦN E. SEED — 18 PHẦN HỒ SƠ + 6 MẪU BỘ HỒ SƠ
--   Sinh tự động bởi _tt99/gen_seed_ho_so.py — sửa generator rồi sinh lại,
--   KHÔNG sửa tay khối seed bên dưới.
-- =============================================================================
-- =============================================================================
-- E1. SEED — 18 PHẦN HỒ SƠ (cấp 1) + NHÓM CON (cấp 2) + THÀNH PHẦN (cấp 3)
--     Nguồn: 14_THIET_KE_HO_SO_LUU_TRU.md §3.9.1 – §3.9.18
--     Tên chứng từ / sổ kế toán: nguyên văn từ 10_danh_muc_chung_tu_tt99.csv
--     và 10_danh_muc_so_ke_toan_tt99.csv
-- =============================================================================

-- ── Phần 01 — Hồ sơ pháp lý doanh nghiệp ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('01', NULL, 1, 'Hồ sơ pháp lý doanh nghiệp', 'NGHIEP_VU', NULL,
   'NAM_10', 'NGAY_THANH_LAP', FALSE, 'NGOAI',
   '411', NULL, TRUE, 0, 'Giấy tờ pháp lý, thuế, ngân hàng của doanh nghiệp')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('01.1', '01', 2, 'Hồ sơ thành lập', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', FALSE, 'NGOAI', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.1.01', '01.1', 3, 'Giấy chứng nhận đăng ký doanh nghiệp (bản gốc)', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.1.02', '01.1', 3, 'Điều lệ công ty (bản gốc + các bản sửa đổi)', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', TRUE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.1.03', '01.1', 3, 'Danh sách thành viên / cổ đông sáng lập', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', TRUE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.1.04', '01.1', 3, 'Biên bản góp vốn, giấy nộp tiền góp vốn', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', FALSE, 'NGOAI',
    NULL, NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.1.05', '01.1', 3, 'Giấy phép kinh doanh ngành nghề có điều kiện', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', FALSE, 'NGOAI',
    NULL, NULL, 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.1.06', '01.1', 3, 'Quyết định bổ nhiệm Giám đốc / Kế toán trưởng', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', TRUE, 'NGOAI',
    NULL, NULL, 6, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('01.2', '01', 2, 'Hồ sơ thuế', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', FALSE, 'NGOAI', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.2.01', '01.2', 3, 'Giấy chứng nhận đăng ký thuế / Thông báo mã số thuế', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.2.02', '01.2', 3, 'Thông báo phương pháp tính thuế GTGT', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', TRUE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.2.03', '01.2', 3, 'Đăng ký chữ ký số, tài khoản thuế điện tử', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', FALSE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.2.04', '01.2', 3, 'Thông báo phát hành hóa đơn điện tử', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', TRUE, 'NGOAI',
    NULL, NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('01.3', '01', 2, 'Hồ sơ ngân hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', FALSE, 'NGOAI', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.3.01', '01.3', 3, 'Giấy đăng ký mở tài khoản ngân hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', FALSE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.3.02', '01.3', 3, 'Danh sách chữ ký mẫu và mẫu dấu', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', TRUE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('01.4', '01', 2, 'Hồ sơ thay đổi', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', FALSE, 'NGOAI', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.4.01', '01.4', 3, 'Thông báo thay đổi đăng ký doanh nghiệp', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', FALSE, 'NGOAI',
    NULL, NULL, 1, 'moc NGAY_THAY_DOI')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.4.02', '01.4', 3, 'Điều lệ sửa đổi', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', FALSE, 'NGOAI',
    NULL, NULL, 2, 'moc NGAY_THAY_DOI')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('01.4.03', '01.4', 3, 'Nghị quyết ĐHĐCĐ / HĐTV', 'NGHIEP_VU', NULL,
    'NAM_10', 'NGAY_THANH_LAP', FALSE, 'NGOAI',
    NULL, NULL, 3, 'moc NGAY_THAY_DOI')
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 02 — Sổ sách kế toán ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('02', NULL, 1, 'Sổ sách kế toán', 'NGHIEP_VU', NULL,
   'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
   NULL, NULL, TRUE, 0, '42 sổ kế toán theo Phụ lục III TT99')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('02.1', '02', 2, 'Sổ tổng hợp', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.1.01', '02.1', 3, 'Nhật ký chung', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S03a-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.1.02', '02.1', 3, 'Sổ Cái', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S03b-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.1.03', '02.1', 3, 'Bảng cân đối số phát sinh', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S06-DN', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.1.04', '02.1', 3, 'Sổ Đăng ký Chứng từ ghi sổ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S02b-DN', NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.1.05', '02.1', 3, 'Chứng từ ghi sổ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S02a-DN', NULL, 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.1.06', '02.1', 3, 'Sổ Cái (hình thức Chứng từ ghi sổ)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S02c1-DN;S02c2-DN', NULL, 6, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.1.07', '02.1', 3, 'Nhật ký - Sổ Cái', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S01-DN', NULL, 7, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('02.2', '02', 2, 'Nhật ký đặc biệt', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.2.01', '02.2', 3, 'Sổ Nhật ký thu tiền', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S03a1-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.2.02', '02.2', 3, 'Sổ Nhật ký chi tiền', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S03a2-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.2.03', '02.2', 3, 'Sổ Nhật ký mua hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S03a3-DN', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.2.04', '02.2', 3, 'Sổ Nhật ký bán hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S03a4-DN', NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('02.3', '02', 2, 'Sổ quỹ và tiền', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.3.01', '02.3', 3, 'Sổ quỹ tiền mặt', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S07-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.3.02', '02.3', 3, 'Sổ kế toán chi tiết quỹ tiền mặt', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S07a-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.3.03', '02.3', 3, 'Sổ tiền gửi không kỳ hạn', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S08-DN', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('02.4', '02', 2, 'Sổ kho và vật tư', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.4.01', '02.4', 3, 'Thẻ kho (Sổ kho)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S12-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.4.02', '02.4', 3, 'Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S10-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.4.03', '02.4', 3, 'Bảng tổng hợp chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S11-DN', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('02.5', '02', 2, 'Sổ tài sản cố định', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 5::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.5.01', '02.5', 3, 'Sổ tài sản cố định', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S21-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.5.02', '02.5', 3, 'Sổ theo dõi TSCĐ và công cụ, dụng cụ tại nơi sử dụng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S22-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.5.03', '02.5', 3, 'Thẻ Tài sản cố định', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S23-DN', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('02.6', '02', 2, 'Sổ thanh toán', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 6::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.6.01', '02.6', 3, 'Sổ chi tiết thanh toán với người mua (người bán)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S31-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.6.02', '02.6', 3, 'Sổ chi tiết thanh toán với người mua (người bán) bằng ngoại tệ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S32-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.6.03', '02.6', 3, 'Sổ theo dõi thanh toán bằng ngoại tệ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S33-DN', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.6.04', '02.6', 3, 'Sổ chi tiết tiền vay', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S34-DN', NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.6.05', '02.6', 3, 'Sổ chi tiết bán hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S35-DN', NULL, 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('02.7', '02', 2, 'Sổ chi phí và giá thành', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 7::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.7.01', '02.7', 3, 'Sổ chi phí sản xuất, kinh doanh', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S36-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.7.02', '02.7', 3, 'Thẻ tính giá thành sản phẩm, dịch vụ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S37-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.7.03', '02.7', 3, 'Sổ chi tiết các tài khoản', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S38-DN', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('02.8', '02', 2, 'Sổ đầu tư và vốn', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 8::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.8.01', '02.8', 3, 'Sổ kế toán chi tiết theo dõi các khoản đầu tư vào công ty liên doanh', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S41a-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.8.02', '02.8', 3, 'Sổ theo dõi phân bổ chênh lệch phát sinh khi mua khoản đầu tư vào công ty liên doanh', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S42a-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.8.03', '02.8', 3, 'Sổ kế toán chi tiết theo dõi các khoản đầu tư vào công ty liên kết', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S41b-DN', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.8.04', '02.8', 3, 'Sổ theo dõi phân bổ chênh lệch phát sinh khi mua khoản đầu tư vào công ty liên kết', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S42b-DN', NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.8.05', '02.8', 3, 'Sổ chi tiết phát hành cổ phiếu', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S43-DN', NULL, 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.8.06', '02.8', 3, 'Sổ chi tiết cổ phiếu mua lại của chính mình', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S44-DN', NULL, 6, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.8.07', '02.8', 3, 'Sổ chi tiết đầu tư chứng khoán', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S45-DN', NULL, 7, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.8.08', '02.8', 3, 'Sổ theo dõi chi tiết vốn đầu tư của chủ sở hữu', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S51-DN', NULL, 8, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.8.09', '02.8', 3, 'Sổ chi phí đầu tư xây dựng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S52-DN', NULL, 9, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('02.9', '02', 2, 'Sổ thuế GTGT', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 9::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.9.01', '02.9', 3, 'Sổ theo dõi thuế GTGT', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S61-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.9.02', '02.9', 3, 'Sổ chi tiết thuế GTGT được hoàn lại', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S62-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.9.03', '02.9', 3, 'Sổ chi tiết thuế GTGT được miễn giảm', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S63-DN', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('02.10', '02', 2, 'Hình thức Nhật ký - Chứng từ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 10::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.10.01', '02.10', 3, 'Nhật ký - Chứng từ và Bảng kê (số 1-10)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S04-DN;S04a1-DN..S04a10-DN;S04b1-DN..S04b10-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('02.10.02', '02.10', 3, 'Sổ Cái (hình thức Nhật ký - Chứng từ)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'S05-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 03 — Tiền mặt và ngân hàng ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('03', NULL, 1, 'Tiền mặt và ngân hàng', 'NGHIEP_VU', NULL,
   'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
   '111, 112, 113, 1281', NULL, FALSE, 0, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('03.1', '03', 2, 'Tiền mặt (TK 111)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.1.01', '03.1', 3, 'Phiếu thu', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    '01-TT', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.1.02', '03.1', 3, 'Phiếu chi', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    '02-TT', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.1.03', '03.1', 3, 'Giấy đề nghị tạm ứng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    '03-TT', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.1.04', '03.1', 3, 'Giấy thanh toán tiền tạm ứng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    '04-TT', NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.1.05', '03.1', 3, 'Giấy đề nghị thanh toán', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    '05-TT', NULL, 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.1.06', '03.1', 3, 'Biên lai thu tiền', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    '06-TT', NULL, 6, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.1.07', '03.1', 3, 'Bảng kê vàng tiền tệ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    '07-TT', NULL, 7, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.1.08', '03.1', 3, 'Bảng kiểm kê quỹ (08a-TT / 08b-TT)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    '08a-TT;08b-TT', NULL, 8, 'cuoi ky')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.1.09', '03.1', 3, 'Bảng kê chi tiền', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    '09-TT', NULL, 9, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('03.2', '03', 2, 'Ngân hàng (TK 112, 113)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.2.01', '03.2', 3, 'Giấy báo Nợ / Giấy báo Có', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.2.02', '03.2', 3, 'Sao kê tài khoản ngân hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.2.03', '03.2', 3, 'Ủy nhiệm chi / Lệnh chuyển tiền', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.2.04', '03.2', 3, 'Giấy nộp tiền vào ngân hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.2.05', '03.2', 3, 'Biên bản đối chiếu số dư ngân hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 5, 'cuoi ky')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('03.3', '03', 2, 'Tiền gửi có kỳ hạn (TK 1281)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.3.01', '03.3', 3, 'Hợp đồng tiền gửi có kỳ hạn / Sổ tiết kiệm', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('03.3.02', '03.3', 3, 'Bảng tính lãi tiền gửi', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 04 — Hóa đơn đầu vào ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('04', NULL, 1, 'Hóa đơn đầu vào', 'NGHIEP_VU', NULL,
   'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
   '1331, 1332', NULL, FALSE, 0, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('04.1', '04', 2, 'Hóa đơn mua vào', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('04.1.01', '04.1', 3, 'Hóa đơn GTGT đầu vào (bản thể hiện + XML)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('04.1.02', '04.1', 3, 'Hóa đơn bán hàng của hộ, cá nhân kinh doanh', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('04.1.03', '04.1', 3, 'Bảng kê hóa đơn, chứng từ hàng hóa dịch vụ mua vào (01-1/GTGT)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('04.1.04', '04.1', 3, 'Biên bản đối chiếu hóa đơn với nhà cung cấp', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('04.1.05', '04.1', 3, 'Thông báo sai sót hóa đơn điện tử + biên bản điều chỉnh/thay thế', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('04.2', '04', 2, 'Chứng từ mua hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('04.2.01', '04.2', 3, 'Bảng kê mua hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    '06-VT', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('04.2.02', '04.2', 3, 'Biên bản giao nhận hàng hóa', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('04.2.03', '04.2', 3, 'Biên bản kiểm nghiệm vật tư, công cụ, sản phẩm, hàng hóa', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    '03-VT', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('04.3', '04', 2, 'Chứng từ thanh toán không dùng tiền mặt', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('04.3.01', '04.3', 3, 'Ủy nhiệm chi / chứng từ chuyển khoản', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, 'bat buoc khi hoa don >= 5 trieu')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('04.3.02', '04.3', 3, 'Xác nhận giao dịch của ngân hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 05 — Hóa đơn đầu ra và doanh thu ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('05', NULL, 1, 'Hóa đơn đầu ra và doanh thu', 'NGHIEP_VU', NULL,
   'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
   '511, 515, 521, 131, 3331', NULL, FALSE, 0, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('05.1', '05', 2, 'Hóa đơn bán ra', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.1.01', '05.1', 3, 'Hóa đơn GTGT đầu ra (bản thể hiện + XML)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.1.02', '05.1', 3, 'Bảng kê hóa đơn, chứng từ hàng hóa dịch vụ bán ra (01-1/GTGT)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.1.03', '05.1', 3, 'Báo cáo tình hình sử dụng hóa đơn', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.1.04', '05.1', 3, 'Thông báo phát hành / mất / hỏng hóa đơn', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('05.2', '05', 2, 'Chứng từ bán hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.2.01', '05.2', 3, 'Phiếu xuất kho', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    '02-VT', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.2.02', '05.2', 3, 'Đơn đặt hàng / Lệnh bán hàng của khách', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.2.03', '05.2', 3, 'Biên bản giao nhận hàng hóa', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.2.04', '05.2', 3, 'Bảng thanh toán hàng đại lý, ký gửi', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    '01-BH', NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.2.05', '05.2', 3, 'Thẻ quầy hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    '02-BH', NULL, 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('05.3', '05', 2, 'Doanh thu dịch vụ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.3.01', '05.3', 3, 'Biên bản nghiệm thu / xác nhận khối lượng dịch vụ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, 'dich vu')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.3.02', '05.3', 3, 'Bảng xác nhận doanh thu / timesheet', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, 'dich vu')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('05.4', '05', 2, 'Giảm trừ doanh thu', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.4.01', '05.4', 3, 'Hóa đơn chiết khấu / giảm giá / hàng trả lại', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('05.4.02', '05.4', 3, 'Biên bản trả lại hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 06 — Công nợ phải thu, phải trả ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('06', NULL, 1, 'Công nợ phải thu, phải trả', 'NGHIEP_VU', NULL,
   'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
   '131, 331, 1388, 3388, 3411, 3412, 2293', NULL, FALSE, 0, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('06.1', '06', 2, 'Phải thu khách hàng (TK 131)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('06.1.01', '06.1', 3, 'Sổ chi tiết thanh toán với người mua', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S31-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('06.1.02', '06.1', 3, 'Biên bản đối chiếu công nợ có ký xác nhận của khách hàng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 2, 'cuoi ky')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('06.1.03', '06.1', 3, 'Bảng phân tích tuổi nợ (aging report)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('06.1.04', '06.1', 3, 'Quyết định trích lập / hoàn nhập dự phòng phải thu khó đòi (TK 2293)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('06.2', '06', 2, 'Phải trả người bán (TK 331)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('06.2.01', '06.2', 3, 'Sổ chi tiết thanh toán với người bán', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('06.2.02', '06.2', 3, 'Biên bản đối chiếu công nợ nhà cung cấp', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 2, 'cuoi ky')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('06.2.03', '06.2', 3, 'Bảng kê chứng từ thanh toán', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('06.3', '06', 2, 'Phải thu, phải trả khác', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('06.3.01', '06.3', 3, 'Sổ chi tiết TK 1388 (phải thu khác)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('06.3.02', '06.3', 3, 'Sổ chi tiết TK 3388 (phải trả, phải nộp khác)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('06.4', '06', 2, 'Vay và nợ thuê tài chính', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('06.4.01', '06.4', 3, 'Hợp đồng vay vốn / hợp đồng thuê tài chính', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('06.4.02', '06.4', 3, 'Sổ chi tiết tiền vay', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S34-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('06.4.03', '06.4', 3, 'Bảng tính lãi vay phải trả', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 07 — Hàng tồn kho ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('07', NULL, 1, 'Hàng tồn kho', 'NGHIEP_VU', NULL,
   'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
   '151, 152, 153, 154, 155, 156, 157, 2294', NULL, FALSE, 0, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('07.1', '07', 2, 'Nhập kho', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('07.1.01', '07.1', 3, 'Phiếu nhập kho', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    '01-VT', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('07.1.02', '07.1', 3, 'Biên bản kiểm nghiệm vật tư, công cụ, sản phẩm, hàng hóa', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    '03-VT', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('07.1.03', '07.1', 3, 'Biên bản giao nhận hàng hóa', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('07.2', '07', 2, 'Xuất kho', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('07.2.01', '07.2', 3, 'Phiếu xuất kho', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    '02-VT', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('07.2.02', '07.2', 3, 'Bảng phân bổ nguyên liệu, vật liệu, công cụ, dụng cụ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    '07-VT', NULL, 2, 'cuoi ky')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('07.3', '07', 2, 'Kiểm kê và theo dõi', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('07.3.01', '07.3', 3, 'Biên bản tổng hợp kiểm kê vật tư, công cụ, sản phẩm, hàng hóa', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    '05-VT', NULL, 1, 'cuoi ky')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('07.3.02', '07.3', 3, 'Bảng kê chi tiết vật tư còn lại cuối kỳ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    '04-VT', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('07.3.03', '07.3', 3, 'Thẻ kho', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S12-DN', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('07.3.04', '07.3', 3, 'Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S10-DN', NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('07.3.05', '07.3', 3, 'Bảng tổng hợp chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S11-DN', NULL, 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('07.4', '07', 2, 'Dự phòng giảm giá hàng tồn kho', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('07.4.01', '07.4', 3, 'Bảng tính dự phòng giảm giá hàng tồn kho (TK 2294)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    NULL, NULL, 1, 'cuoi ky')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('07.4.02', '07.4', 3, 'Quyết định trích lập / hoàn nhập dự phòng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 08 — TSCĐ, CCDC và chi phí trả trước ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('08', NULL, 1, 'TSCĐ, CCDC và chi phí trả trước', 'NGHIEP_VU', NULL,
   'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
   '211, 213, 217, 2411-2414, 242, 2141, 2142, 2143, 2147, 229', NULL, FALSE, 0, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('08.1', '08', 2, 'TSCĐ hữu hình (TK 211)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.1.01', '08.1', 3, 'Biên bản giao nhận TSCĐ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    '01-TSCĐ', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.1.02', '08.1', 3, 'Hóa đơn mua TSCĐ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.1.03', '08.1', 3, 'Hợp đồng mua sắm TSCĐ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.1.04', '08.1', 3, 'Biên bản bàn giao TSCĐ sửa chữa, bảo dưỡng hoặc nâng cấp, cải tạo hoàn thành', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    '03-TSCĐ', NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.1.05', '08.1', 3, 'Biên bản đánh giá lại TSCĐ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    '04-TSCĐ', NULL, 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('08.2', '08', 2, 'TSCĐ vô hình (TK 213)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.2.01', '08.2', 3, 'Hợp đồng / quyết định liên quan đến TSCĐ vô hình', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.2.02', '08.2', 3, 'Giấy chứng nhận quyền sở hữu trí tuệ, nhãn hiệu', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('08.3', '08', 2, 'Bất động sản đầu tư (TK 217)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.3.01', '08.3', 3, 'Giấy chứng nhận quyền sử dụng đất / quyền sở hữu nhà', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.3.02', '08.3', 3, 'Hợp đồng cho thuê bất động sản đầu tư', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('08.4', '08', 2, 'Khấu hao (TK 214)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.4.01', '08.4', 3, 'Bảng tính và phân bổ khấu hao TSCĐ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    '06-TSCĐ', NULL, 1, 'cuoi ky')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.4.02', '08.4', 3, 'Sổ tài sản cố định', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S21-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.4.03', '08.4', 3, 'Thẻ Tài sản cố định', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S23-DN', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('08.5', '08', 2, 'Thanh lý, nhượng bán TSCĐ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 5::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.5.01', '08.5', 3, 'Biên bản thanh lý TSCĐ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    '02-TSCĐ', NULL, 1, 'khi phat sinh')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.5.02', '08.5', 3, 'Hợp đồng nhượng bán / hóa đơn bán TSCĐ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 2, 'khi phat sinh')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.5.03', '08.5', 3, 'Quyết định thanh lý / nhượng bán của cấp có thẩm quyền', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 3, 'khi phat sinh')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('08.6', '08', 2, 'Kiểm kê TSCĐ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 6::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.6.01', '08.6', 3, 'Biên bản tổng hợp kiểm kê TSCĐ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    '05-TSCĐ', NULL, 1, 'cuoi ky')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('08.7', '08', 2, 'Công cụ, dụng cụ (TK 153)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 7::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.7.01', '08.7', 3, 'Phiếu nhập / xuất công cụ, dụng cụ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.7.02', '08.7', 3, 'Sổ theo dõi TSCĐ và công cụ, dụng cụ tại nơi sử dụng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'S22-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.7.03', '08.7', 3, 'Bảng phân bổ công cụ, dụng cụ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('08.8', '08', 2, 'Chi phí trả trước (TK 242)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 8::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.8.01', '08.8', 3, 'Bảng phân bổ chi phí trả trước', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('08.8.02', '08.8', 3, 'Hợp đồng / chứng từ gốc của khoản trả trước', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 09 — Tiền lương, lao động, BHXH và TNCN ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('09', NULL, 1, 'Tiền lương, lao động, BHXH và TNCN', 'NGHIEP_VU', NULL,
   'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
   '334, 3382, 3383, 3384, 3386, 3335, 353', NULL, FALSE, 0, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('09.1', '09', 2, 'Chứng từ lao động', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.1.01', '09.1', 3, 'Hợp đồng lao động', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.1.02', '09.1', 3, 'Quyết định tuyển dụng / chấm dứt hợp đồng lao động', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.1.03', '09.1', 3, 'Bảng chấm công', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.1.04', '09.1', 3, 'Bảng theo dõi giờ làm thêm', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    NULL, NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('09.2', '09', 2, 'Bảng lương', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.2.01', '09.2', 3, 'Bảng thanh toán tiền lương', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    '01-LĐTL', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.2.02', '09.2', 3, 'Bảng thanh toán tiền thưởng', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    '02-LĐTL', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.2.03', '09.2', 3, 'Bảng thanh toán tiền làm thêm giờ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    '03-LĐTL', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.2.04', '09.2', 3, 'Bảng thanh toán tiền thuê ngoài', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    '04-LĐTL', NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.2.05', '09.2', 3, 'Bảng kê trích nộp các khoản theo lương', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    '07-LĐTL', NULL, 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.2.06', '09.2', 3, 'Bảng phân bổ tiền lương và các khoản trích theo lương', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    '08-LĐTL', NULL, 6, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('09.3', '09', 2, 'Giao khoán', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.3.01', '09.3', 3, 'Hợp đồng giao khoán', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    '05-LĐTL', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.3.02', '09.3', 3, 'Biên bản thanh lý (nghiệm thu) hợp đồng giao khoán', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    '06-LĐTL', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('09.4', '09', 2, 'BHXH, BHYT, BHTN', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.4.01', '09.4', 3, 'Tờ khai tham gia BHXH, BHYT, BHTN', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.4.02', '09.4', 3, 'Danh sách lao động tham gia BHXH (D02-LT)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.4.03', '09.4', 3, 'Chứng từ nộp BHXH (TK 3383, 3384, 3386)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('09.5', '09', 2, 'Thuế TNCN (TK 3335)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 5::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.5.01', '09.5', 3, 'Tờ khai thuế TNCN (05/KK-TNCN)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.5.02', '09.5', 3, 'Bảng kê thu nhập, thuế TNCN đã khấu trừ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.5.03', '09.5', 3, 'Chứng từ nộp thuế TNCN', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('09.6', '09', 2, 'Quỹ khen thưởng, phúc lợi (TK 353)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 6::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('09.6.01', '09.6', 3, 'Quyết định trích lập / sử dụng quỹ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 10 — Hồ sơ thuế ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('10', NULL, 1, 'Hồ sơ thuế', 'NGHIEP_VU', NULL,
   'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
   '133, 3331-3339, 8211, 8212, 243, 347', NULL, FALSE, 0, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('10.1', '10', 2, 'Thuế GTGT (TK 133, 3331)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.1.01', '10.1', 3, 'Tờ khai thuế GTGT (01/GTGT) theo kỳ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.1.02', '10.1', 3, 'Bảng kê hóa đơn mua vào / bán ra kèm tờ khai', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.1.03', '10.1', 3, 'Chứng từ nộp thuế GTGT', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.1.04', '10.1', 3, 'Hồ sơ đề nghị hoàn thuế GTGT', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('10.2', '10', 2, 'Thuế TNDN (TK 3334, 8211, 8212)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.2.01', '10.2', 3, 'Tờ khai quyết toán thuế TNDN (03/TNDN)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.2.02', '10.2', 3, 'Tờ khai thuế TNDN tạm tính theo quý', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.2.03', '10.2', 3, 'Chứng từ nộp thuế TNDN', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.2.04', '10.2', 3, 'Hồ sơ xác định chi phí thuế TNDN hoãn lại (TK 243, 347)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('10.3', '10', 2, 'Các loại thuế khác', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.3.01', '10.3', 3, 'Tờ khai thuế thu nhập cá nhân', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.3.02', '10.3', 3, 'Tờ khai thuế nhà thầu / thuế nhà thầu nước ngoài', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.3.03', '10.3', 3, 'Tờ khai thuế tiêu thụ đặc biệt (TK 3332)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.3.04', '10.3', 3, 'Tờ khai thuế tài nguyên (TK 3336)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.3.05', '10.3', 3, 'Tờ khai thuế nhà đất, tiền thuê đất (TK 3337)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.3.06', '10.3', 3, 'Tờ khai thuế bảo vệ môi trường (TK 3338)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 6, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.3.07', '10.3', 3, 'Tờ khai phí, lệ phí (TK 3339)', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 7, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('10.4', '10', 2, 'Hồ sơ thanh tra, kiểm tra thuế', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.4.01', '10.4', 3, 'Quyết định thanh tra / kiểm tra thuế', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 1, 'moc NGAY_KIEM_TOAN')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.4.02', '10.4', 3, 'Biên bản làm việc với cơ quan thuế', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, 'moc NGAY_KIEM_TOAN')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.4.03', '10.4', 3, 'Kết luận thanh tra / kiểm tra thuế', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 3, 'moc NGAY_KIEM_TOAN')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('10.4.04', '10.4', 3, 'Quyết định xử phạt vi phạm hành chính về thuế', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 4, 'moc NGAY_KIEM_TOAN')
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 11 — Báo cáo tài chính và quyết toán năm ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('11', NULL, 1, 'Báo cáo tài chính và quyết toán năm', 'NGHIEP_VU', NULL,
   'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
   '4211, 4212, 911', NULL, TRUE, 0, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('11.1', '11', 2, 'Báo cáo tài chính năm', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('11.1.01', '11.1', 3, 'Báo cáo tình hình tài chính', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'B01-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('11.1.02', '11.1', 3, 'Báo cáo kết quả hoạt động kinh doanh', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'B02-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('11.1.03', '11.1', 3, 'Báo cáo lưu chuyển tiền tệ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'B03-DN', NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('11.1.04', '11.1', 3, 'Bản thuyết minh Báo cáo tài chính', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    'B09-DN', NULL, 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('11.2', '11', 2, 'Báo cáo tài chính giữa niên độ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('11.2.01', '11.2', 3, 'BCTC giữa niên độ dạng đầy đủ', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'B01a-DN;B02a-DN;B03a-DN;B09a-DN', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('11.2.02', '11.2', 3, 'BCTC giữa niên độ dạng tóm lược', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'B01b-DN;B02b-DN;B03b-DN', NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('11.3', '11', 2, 'BCTC giả định không hoạt động liên tục', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('11.3.01', '11.3', 3, 'Bộ biểu mẫu giả định không hoạt động liên tục', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    'B01-DNKLT;B02-DNKLT;B03-DNKLT;B09-DNKLT', NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('11.4', '11', 2, 'Quyết toán năm', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('11.4.01', '11.4', 3, 'Báo cáo quyết toán năm', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'ERP',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('11.4.02', '11.4', 3, 'Báo cáo tự kiểm tra kế toán', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('11.4.03', '11.4', 3, 'Biên bản kiểm tra, xác nhận số dư của cơ quan thuế', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('11.5', '11', 2, 'Kiểm toán và công bố', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'ERP', 5::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('11.5.01', '11.5', 3, 'Báo cáo kiểm toán độc lập', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('11.5.02', '11.5', 3, 'Tài liệu công bố Báo cáo tài chính', 'NGHIEP_VU', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 12 — Doanh nghiệp thương mại ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('12', NULL, 1, 'Doanh nghiệp thương mại', 'NGANH', 'THUONG_MAI',
   'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
   '156, 632', NULL, FALSE, 0, 'Danh mục kiểm tra bổ sung theo ngành — trỏ về thành phần gốc')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('12.1', '12', 2, 'Mua hàng hóa', 'NGANH', 'THUONG_MAI',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('12.1.01', '12.1', 3, 'Phiếu nhập kho hàng hóa', 'NGANH', 'THUONG_MAI',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.1.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('12.1.02', '12.1', 3, 'Hóa đơn mua hàng hóa', 'NGANH', 'THUONG_MAI',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '04.1.01', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('12.2', '12', 2, 'Bán hàng hóa', 'NGANH', 'THUONG_MAI',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('12.2.01', '12.2', 3, 'Phiếu xuất kho hàng hóa', 'NGANH', 'THUONG_MAI',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.2.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('12.2.02', '12.2', 3, 'Hóa đơn bán hàng hóa', 'NGANH', 'THUONG_MAI',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '05.1.01', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('12.3', '12', 2, 'Giá vốn', 'NGANH', 'THUONG_MAI',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('12.3.01', '12.3', 3, 'Bảng tính giá vốn hàng bán (TK 632)', 'NGANH', 'THUONG_MAI',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.2.02', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('12.4', '12', 2, 'Hàng ký gửi, đại lý', 'NGANH', 'THUONG_MAI',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('12.4.01', '12.4', 3, 'Bảng thanh toán hàng đại lý, ký gửi (01-BH)', 'NGANH', 'THUONG_MAI',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '05.2.04', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('12.5', '12', 2, 'Hàng tồn kho cuối kỳ', 'NGANH', 'THUONG_MAI',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 5::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('12.5.01', '12.5', 3, 'Biên bản kiểm kê hàng hóa', 'NGANH', 'THUONG_MAI',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.3.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 13 — Doanh nghiệp dịch vụ ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('13', NULL, 1, 'Doanh nghiệp dịch vụ', 'NGANH', 'DICH_VU',
   'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
   '154, 632, 3387', NULL, FALSE, 0, 'Danh mục kiểm tra bổ sung theo ngành — trỏ về thành phần gốc')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('13.1', '13', 2, 'Hợp đồng dịch vụ', 'NGANH', 'DICH_VU',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('13.1.01', '13.1', 3, 'Hợp đồng cung cấp dịch vụ', 'NGANH', 'DICH_VU',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '18.1.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('13.1.02', '13.1', 3, 'Phụ lục hợp đồng', 'NGANH', 'DICH_VU',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '18.1.02', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('13.2', '13', 2, 'Thực hiện dịch vụ', 'NGANH', 'DICH_VU',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('13.2.01', '13.2', 3, 'Biên bản nghiệm thu khối lượng dịch vụ', 'NGANH', 'DICH_VU',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '05.3.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('13.2.02', '13.2', 3, 'Bảng xác nhận doanh thu / timesheet', 'NGANH', 'DICH_VU',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '05.3.02', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('13.3', '13', 2, 'Chi phí dịch vụ dở dang', 'NGANH', 'DICH_VU',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('13.3.01', '13.3', 3, 'Bảng tập hợp chi phí dịch vụ (TK 154)', 'NGANH', 'DICH_VU',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '02.7.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('13.3.02', '13.3', 3, 'Thẻ tính giá thành dịch vụ (S37-DN)', 'NGANH', 'DICH_VU',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '02.7.02', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('13.4', '13', 2, 'Doanh thu chờ phân bổ', 'NGANH', 'DICH_VU',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('13.4.01', '13.4', 3, 'Bảng phân bổ doanh thu chờ phân bổ (TK 3387)', 'NGANH', 'DICH_VU',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '02.7.03', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 14 — Doanh nghiệp sản xuất ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('14', NULL, 1, 'Doanh nghiệp sản xuất', 'NGANH', 'SAN_XUAT',
   'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
   '621, 622, 623, 627, 154, 155', NULL, FALSE, 0, 'Danh mục kiểm tra bổ sung theo ngành — trỏ về thành phần gốc')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('14.1', '14', 2, 'Nguyên vật liệu trực tiếp (TK 621)', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('14.1.01', '14.1', 3, 'Phiếu xuất kho NVL cho sản xuất', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.2.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('14.1.02', '14.1', 3, 'Bảng phân bổ nguyên liệu, vật liệu (07-VT)', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.2.02', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('14.2', '14', 2, 'Nhân công trực tiếp (TK 622)', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('14.2.01', '14.2', 3, 'Bảng phân bổ tiền lương trực tiếp (08-LĐTL)', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '09.2.06', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('14.3', '14', 2, 'Chi phí sản xuất chung (TK 627)', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('14.3.01', '14.3', 3, 'Bảng phân bổ chi phí sản xuất chung (6271-6278)', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '02.7.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('14.3.02', '14.3', 3, 'Bảng tính và phân bổ khấu hao TSCĐ sản xuất', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '08.4.01', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('14.4', '14', 2, 'Chi phí sản xuất kinh doanh dở dang (TK 154)', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('14.4.01', '14.4', 3, 'Bảng tổng hợp chi phí sản xuất dở dang', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '02.7.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('14.5', '14', 2, 'Nhập kho thành phẩm (TK 155)', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 5::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('14.5.01', '14.5', 3, 'Phiếu nhập kho thành phẩm', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.1.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('14.5.02', '14.5', 3, 'Thẻ tính giá thành sản phẩm (S37-DN)', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '02.7.02', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('14.6', '14', 2, 'Định mức và kiểm kê', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 6::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('14.6.01', '14.6', 3, 'Định mức nguyên vật liệu / định mức tiêu hao', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.3.02', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('14.6.02', '14.6', 3, 'Biên bản kiểm kê nguyên vật liệu, thành phẩm', 'NGANH', 'SAN_XUAT',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.3.01', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 15 — Doanh nghiệp xây dựng, xây lắp ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('15', NULL, 1, 'Doanh nghiệp xây dựng, xây lắp', 'NGANH', 'XAY_DUNG',
   'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
   '154, 337, 2412, 3522', NULL, FALSE, 0, 'Danh mục kiểm tra bổ sung theo ngành — trỏ về thành phần gốc')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('15.1', '15', 2, 'Hợp đồng xây dựng', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.1.01', '15.1', 3, 'Hợp đồng thi công xây dựng', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '18.1.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.1.02', '15.1', 3, 'Hồ sơ mời thầu / hồ sơ dự thầu', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '18.3.01', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.1.03', '15.1', 3, 'Quyết định trúng thầu / thông báo trúng thầu', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '18.3.02', 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('15.2', '15', 2, 'Dự toán và quyết toán công trình', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.2.01', '15.2', 3, 'Dự toán công trình được duyệt', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '18.3.03', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.2.02', '15.2', 3, 'Bảng quyết toán khối lượng A-B', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '15.3.02', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('15.3', '15', 2, 'Nghiệm thu và thanh toán', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.3.01', '15.3', 3, 'Biên bản nghiệm thu công việc / hạng mục / công trình', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '05.3.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.3.02', '15.3', 3, 'Bảng xác nhận khối lượng hoàn thành', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '05.3.01', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.3.03', '15.3', 3, 'Hồ sơ thanh toán theo tiến độ (TK 337)', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '06.2.01', 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('15.4', '15', 2, 'Chi phí xây dựng dở dang', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.4.01', '15.4', 3, 'Bảng tập hợp chi phí công trình (TK 154)', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '02.7.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.4.02', '15.4', 3, 'Sổ chi phí đầu tư xây dựng (S52-DN)', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '02.8.09', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('15.5', '15', 2, 'Bảo hành công trình', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 5::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.5.01', '15.5', 3, 'Hồ sơ dự phòng bảo hành công trình (TK 3522)', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.4.02', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.5.02', '15.5', 3, 'Biên bản hết thời hạn bảo hành, hoàn nhập dự phòng', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.4.02', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('15.6', '15', 2, 'Thầu phụ và giao khoán', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 6::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.6.01', '15.6', 3, 'Hợp đồng thầu phụ', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '18.2.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.6.02', '15.6', 3, 'Hợp đồng giao khoán nội bộ (05-LĐTL)', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '09.3.01', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('15.6.03', '15.6', 3, 'Biên bản thanh lý hợp đồng giao khoán (06-LĐTL)', 'NGANH', 'XAY_DUNG',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '09.3.02', 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 16 — Doanh nghiệp xuất nhập khẩu ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('16', NULL, 1, 'Doanh nghiệp xuất nhập khẩu', 'NGANH', 'XNK',
   'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
   '151, 157, 3333, 1383', NULL, FALSE, 0, 'Danh mục kiểm tra bổ sung theo ngành — trỏ về thành phần gốc')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('16.1', '16', 2, 'Nhập khẩu', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.1.01', '16.1', 3, 'Tờ khai hải quan nhập khẩu', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '16.1.05', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.1.02', '16.1', 3, 'Hóa đơn thương mại (Commercial Invoice)', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '16.1.05', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.1.03', '16.1', 3, 'Vận đơn (Bill of Lading / AWB)', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '16.1.05', 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.1.04', '16.1', 3, 'Giấy chứng nhận xuất xứ (C/O)', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '16.1.05', 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.1.05', '16.1', 3, 'Bộ chứng từ ngoại thương', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '04.1.01', 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.1.06', '16.1', 3, 'Hợp đồng ngoại thương', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '18.4.01', 6, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.1.07', '16.1', 3, 'Hợp đồng bảo hiểm / giấy chứng nhận bảo hiểm hàng hóa', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '16.1.05', 7, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.1.08', '16.1', 3, 'Chứng từ nộp thuế nhập khẩu (TK 3333)', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '10.3.02', 8, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.1.09', '16.1', 3, 'Biên lai thuế GTGT hàng nhập khẩu (TK 1383, 1331)', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '04.1.01', 9, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.1.10', '16.1', 3, 'Hồ sơ hàng mua đang đi đường (TK 151)', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.1.03', 10, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('16.2', '16', 2, 'Xuất khẩu', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.2.01', '16.2', 3, 'Tờ khai hải quan xuất khẩu', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '16.1.05', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.2.02', '16.2', 3, 'Hóa đơn xuất khẩu', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '05.1.01', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.2.03', '16.2', 3, 'Vận đơn xuất khẩu', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '16.1.05', 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.2.04', '16.2', 3, 'Giấy chứng nhận xuất xứ hàng hóa xuất khẩu', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '16.1.05', 4, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.2.05', '16.2', 3, 'Hồ sơ hàng gửi đi bán (TK 157)', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '05.2.03', 5, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.2.06', '16.2', 3, 'Hồ sơ hoàn thuế GTGT xuất khẩu', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '10.1.04', 6, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('16.3', '16', 2, 'Thanh toán quốc tế', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.3.01', '16.3', 3, 'Thư tín dụng (L/C) / Hợp đồng thanh toán quốc tế', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '16.1.05', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.3.02', '16.3', 3, 'Sổ theo dõi thanh toán bằng ngoại tệ (S33-DN)', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '02.6.03', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('16.3.03', '16.3', 3, 'Bảng tính chênh lệch tỷ giá', 'NGANH', 'XNK',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '02.6.03', 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 17 — Doanh nghiệp bất động sản ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('17', NULL, 1, 'Doanh nghiệp bất động sản', 'NGANH', 'BDS',
   'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
   '154, 155, 217, 632', NULL, FALSE, 0, 'Danh mục kiểm tra bổ sung theo ngành — trỏ về thành phần gốc')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('17.1', '17', 2, 'Dự án bất động sản', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.1.01', '17.1', 3, 'Quyết định chủ trương đầu tư / Giấy chứng nhận đầu tư dự án', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '18.3.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.1.02', '17.1', 3, 'Quy hoạch chi tiết được duyệt', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '18.3.03', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.1.03', '17.1', 3, 'Giấy phép xây dựng', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '18.3.03', 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('17.2', '17', 2, 'Chi phí hình thành bất động sản', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.2.01', '17.2', 3, 'Bảng tập hợp chi phí dự án (TK 154)', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '02.7.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.2.02', '17.2', 3, 'Hồ sơ bồi thường giải phóng mặt bằng', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '06.3.02', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.2.03', '17.2', 3, 'Chi phí hạ tầng, xây dựng', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '15.4.01', 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('17.3', '17', 2, 'Bất động sản hình thành để bán', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.3.01', '17.3', 3, 'Hồ sơ nhập kho bất động sản (TK 155, 156)', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '07.1.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.3.02', '17.3', 3, 'Bảng tính giá thành bất động sản', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '02.7.02', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('17.4', '17', 2, 'Bất động sản đầu tư cho thuê (TK 217)', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.4.01', '17.4', 3, 'Giấy chứng nhận quyền sử dụng đất / sở hữu nhà', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '08.3.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.4.02', '17.4', 3, 'Hợp đồng cho thuê bất động sản đầu tư', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '08.3.02', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.4.03', '17.4', 3, 'Bảng tính khấu hao / phân bổ bất động sản đầu tư', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '08.4.01', 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('17.5', '17', 2, 'Bán bất động sản', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 5::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.5.01', '17.5', 3, 'Hợp đồng mua bán bất động sản', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '18.1.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.5.02', '17.5', 3, 'Hóa đơn bán bất động sản', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '05.1.01', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.5.03', '17.5', 3, 'Biên bản bàn giao nhà, đất cho khách hàng', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '05.2.03', 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('17.6', '17', 2, 'Quyết toán dự án', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA', 6::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.6.01', '17.6', 3, 'Báo cáo quyết toán vốn đầu tư dự án hoàn thành', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '11.4.01', 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('17.6.02', '17.6', 3, 'Quyết định phê duyệt quyết toán dự án', 'NGANH', 'BDS',
    'KE_THUA', 'KET_THUC_NAM_TC', FALSE, 'KE_THUA',
    NULL, '11.4.01', 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Phần 18 — Hợp đồng ──
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    tai_khoan_lien_quan, tro_toi, goi_y_vinh_vien, thu_tu, mo_ta)
VALUES
  ('18', NULL, 1, 'Hợp đồng', 'HOP_DONG', NULL,
   'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
   NULL, NULL, FALSE, 0, 'Trục phụ xuyên suốt — mỗi hợp đồng có mã để liên kết với chứng từ kế toán')
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('18.1', '18', 2, 'Hợp đồng kinh tế', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI', 1::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.1.01', '18.1', 3, 'Hợp đồng mua bán hàng hóa / cung cấp dịch vụ', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', TRUE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.1.02', '18.1', 3, 'Phụ lục hợp đồng', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.1.03', '18.1', 3, 'Biên bản thanh lý hợp đồng', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('18.2', '18', 2, 'Hợp đồng thầu phụ, giao khoán', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI', 2::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.2.01', '18.2', 3, 'Hợp đồng thầu phụ', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.2.02', '18.2', 3, 'Hợp đồng giao khoán nội bộ (05-LĐTL)', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.2.03', '18.2', 3, 'Biên bản nghiệm thu, thanh lý giao khoán (06-LĐTL)', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('18.3', '18', 2, 'Hồ sơ dự án, đấu thầu', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI', 3::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.3.01', '18.3', 3, 'Hồ sơ mời thầu / hồ sơ dự thầu', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.3.02', '18.3', 3, 'Quyết định trúng thầu / thông báo trúng thầu', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.3.03', '18.3', 3, 'Dự toán, quy hoạch, giấy phép được duyệt', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 3, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('18.4', '18', 2, 'Hợp đồng ngoại thương', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI', 4::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.4.01', '18.4', 3, 'Hợp đồng ngoại thương', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.4.02', '18.4', 3, 'Thư tín dụng (L/C)', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('18.5', '18', 2, 'Hợp đồng vay, thuê tài chính', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI', 5::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.5.01', '18.5', 3, 'Hợp đồng vay vốn (TK 3411)', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.5.02', '18.5', 3, 'Hợp đồng thuê tài chính (TK 3412)', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 2, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong, thu_tu, mo_ta)
VALUES ('18.6', '18', 2, 'Hợp đồng lao động', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI', 6::INT, NULL)
ON CONFLICT (ma_loai) DO NOTHING;
INSERT INTO dm_loai_ho_so (ma_loai, ma_loai_cha, cap, ten_loai, truc, linh_vuc,
    thoi_han_luu_tru, moc_tinh_thoi_han, bat_buoc, nguon_tu_dong,
    so_hieu_mau_tt99, tro_toi, thu_tu, mo_ta)
VALUES ('18.6.01', '18.6', 3, 'Hợp đồng lao động', 'HOP_DONG', NULL,
    'NAM_10', 'KET_THUC_NAM_TC', FALSE, 'NGOAI',
    NULL, NULL, 1, NULL)
ON CONFLICT (ma_loai) DO NOTHING;

-- ── Kiểm tra: kỳ vọng 18 cấp 1, 91 cấp 2, 286 cấp 3 ──
-- SELECT cap, COUNT(*) FROM dm_loai_ho_so GROUP BY cap ORDER BY cap;

-- =============================================================================
-- E2. SEED — 6 MẪU BỘ HỒ SƠ
-- =============================================================================

INSERT INTO dm_bo_ho_so_mau (ma_mau, ten_mau, loai_ho_so_chinh, linh_vuc_ap_dung,
    mo_ta, bat_buoc_toi_thieu)
VALUES ('MUA_HANG', 'Bộ hồ sơ mua hàng', '04', '{THUONG_MAI,SAN_XUAT}',
    'Bộ hồ sơ mua hàng', 4)
ON CONFLICT (tenant_id, ma_mau) DO NOTHING;
INSERT INTO dm_bo_ho_so_mau_ct (mau_id, ma_loai_ho_so, bat_buoc, thu_tu, nguon)
SELECT id, v.ma, v.bb, v.tt, v.nguon
FROM   dm_bo_ho_so_mau m,
       (VALUES
         ('04.2.02'::VARCHAR(20), TRUE::BOOLEAN, 1, 'NGOAI'::VARCHAR(20)),
         ('04.1.01'::VARCHAR(20), TRUE::BOOLEAN, 2, 'NGOAI'::VARCHAR(20)),
         ('04.3.01'::VARCHAR(20), TRUE::BOOLEAN, 3, 'NGOAI'::VARCHAR(20)),
         ('07.1.01'::VARCHAR(20), TRUE::BOOLEAN, 4, 'ERP'::VARCHAR(20)),
         ('04.2.01'::VARCHAR(20), FALSE::BOOLEAN, 5, 'ERP'::VARCHAR(20)),
         ('04.2.03'::VARCHAR(20), FALSE::BOOLEAN, 6, 'NGOAI'::VARCHAR(20)),
         ('06.2.02'::VARCHAR(20), FALSE::BOOLEAN, 7, 'NGOAI'::VARCHAR(20)),
         ('04.1.04'::VARCHAR(20), FALSE::BOOLEAN, 8, 'NGOAI'::VARCHAR(20)),
         ('04.1.05'::VARCHAR(20), FALSE::BOOLEAN, 9, 'NGOAI'::VARCHAR(20)),
         ('18.1.01'::VARCHAR(20), FALSE::BOOLEAN, 10, 'NGOAI'::VARCHAR(20))
       ) AS v(ma, bb, tt, nguon)
WHERE  m.ma_mau = 'MUA_HANG'
ON CONFLICT (mau_id, ma_loai_ho_so) DO NOTHING;

INSERT INTO dm_bo_ho_so_mau (ma_mau, ten_mau, loai_ho_so_chinh, linh_vuc_ap_dung,
    mo_ta, bat_buoc_toi_thieu)
VALUES ('BAN_HANG', 'Bộ hồ sơ bán hàng', '05', '{THUONG_MAI,DICH_VU}',
    'Bộ hồ sơ bán hàng', 4)
ON CONFLICT (tenant_id, ma_mau) DO NOTHING;
INSERT INTO dm_bo_ho_so_mau_ct (mau_id, ma_loai_ho_so, bat_buoc, thu_tu, nguon)
SELECT id, v.ma, v.bb, v.tt, v.nguon
FROM   dm_bo_ho_so_mau m,
       (VALUES
         ('05.2.02'::VARCHAR(20), TRUE::BOOLEAN, 1, 'ERP'::VARCHAR(20)),
         ('05.2.01'::VARCHAR(20), TRUE::BOOLEAN, 2, 'ERP'::VARCHAR(20)),
         ('05.1.01'::VARCHAR(20), TRUE::BOOLEAN, 3, 'ERP'::VARCHAR(20)),
         ('05.2.03'::VARCHAR(20), TRUE::BOOLEAN, 4, 'NGOAI'::VARCHAR(20)),
         ('05.2.05'::VARCHAR(20), FALSE::BOOLEAN, 5, 'NGOAI'::VARCHAR(20)),
         ('06.1.02'::VARCHAR(20), FALSE::BOOLEAN, 6, 'NGOAI'::VARCHAR(20)),
         ('18.1.01'::VARCHAR(20), FALSE::BOOLEAN, 7, 'NGOAI'::VARCHAR(20))
       ) AS v(ma, bb, tt, nguon)
WHERE  m.ma_mau = 'BAN_HANG'
ON CONFLICT (mau_id, ma_loai_ho_so) DO NOTHING;

INSERT INTO dm_bo_ho_so_mau (ma_mau, ten_mau, loai_ho_so_chinh, linh_vuc_ap_dung,
    mo_ta, bat_buoc_toi_thieu)
VALUES ('LUONG_THANG', 'Bộ hồ sơ lương tháng', '09', '{THUONG_MAI,DICH_VU,SAN_XUAT,XAY_DUNG,XNK,BDS}',
    'Bộ hồ sơ lương tháng', 5)
ON CONFLICT (tenant_id, ma_mau) DO NOTHING;
INSERT INTO dm_bo_ho_so_mau_ct (mau_id, ma_loai_ho_so, bat_buoc, thu_tu, nguon)
SELECT id, v.ma, v.bb, v.tt, v.nguon
FROM   dm_bo_ho_so_mau m,
       (VALUES
         ('09.1.03'::VARCHAR(20), TRUE::BOOLEAN, 1, 'ERP'::VARCHAR(20)),
         ('09.2.01'::VARCHAR(20), TRUE::BOOLEAN, 2, 'ERP'::VARCHAR(20)),
         ('09.2.05'::VARCHAR(20), TRUE::BOOLEAN, 3, 'ERP'::VARCHAR(20)),
         ('09.2.06'::VARCHAR(20), TRUE::BOOLEAN, 4, 'ERP'::VARCHAR(20)),
         ('09.5.02'::VARCHAR(20), TRUE::BOOLEAN, 5, 'ERP'::VARCHAR(20)),
         ('09.4.03'::VARCHAR(20), FALSE::BOOLEAN, 6, 'NGOAI'::VARCHAR(20)),
         ('09.5.03'::VARCHAR(20), FALSE::BOOLEAN, 7, 'NGOAI'::VARCHAR(20))
       ) AS v(ma, bb, tt, nguon)
WHERE  m.ma_mau = 'LUONG_THANG'
ON CONFLICT (mau_id, ma_loai_ho_so) DO NOTHING;

INSERT INTO dm_bo_ho_so_mau (ma_mau, ten_mau, loai_ho_so_chinh, linh_vuc_ap_dung,
    mo_ta, bat_buoc_toi_thieu)
VALUES ('TSCD', 'Bộ hồ sơ tài sản cố định', '08', '{THUONG_MAI,DICH_VU,SAN_XUAT,XAY_DUNG,XNK,BDS}',
    'Bộ hồ sơ tài sản cố định', 4)
ON CONFLICT (tenant_id, ma_mau) DO NOTHING;
INSERT INTO dm_bo_ho_so_mau_ct (mau_id, ma_loai_ho_so, bat_buoc, thu_tu, nguon)
SELECT id, v.ma, v.bb, v.tt, v.nguon
FROM   dm_bo_ho_so_mau m,
       (VALUES
         ('08.1.01'::VARCHAR(20), TRUE::BOOLEAN, 1, 'NGOAI'::VARCHAR(20)),
         ('08.1.02'::VARCHAR(20), TRUE::BOOLEAN, 2, 'NGOAI'::VARCHAR(20)),
         ('08.4.01'::VARCHAR(20), TRUE::BOOLEAN, 3, 'ERP'::VARCHAR(20)),
         ('08.4.03'::VARCHAR(20), TRUE::BOOLEAN, 4, 'ERP'::VARCHAR(20)),
         ('08.1.03'::VARCHAR(20), FALSE::BOOLEAN, 5, 'NGOAI'::VARCHAR(20)),
         ('08.6.01'::VARCHAR(20), FALSE::BOOLEAN, 6, 'NGOAI'::VARCHAR(20))
       ) AS v(ma, bb, tt, nguon)
WHERE  m.ma_mau = 'TSCD'
ON CONFLICT (mau_id, ma_loai_ho_so) DO NOTHING;

INSERT INTO dm_bo_ho_so_mau (ma_mau, ten_mau, loai_ho_so_chinh, linh_vuc_ap_dung,
    mo_ta, bat_buoc_toi_thieu)
VALUES ('XNK_NHAP', 'Bộ hồ sơ nhập khẩu', '16', '{XNK}',
    'Bộ hồ sơ nhập khẩu', 6)
ON CONFLICT (tenant_id, ma_mau) DO NOTHING;
INSERT INTO dm_bo_ho_so_mau_ct (mau_id, ma_loai_ho_so, bat_buoc, thu_tu, nguon)
SELECT id, v.ma, v.bb, v.tt, v.nguon
FROM   dm_bo_ho_so_mau m,
       (VALUES
         ('16.1.06'::VARCHAR(20), TRUE::BOOLEAN, 1, 'NGOAI'::VARCHAR(20)),
         ('16.1.01'::VARCHAR(20), TRUE::BOOLEAN, 2, 'NGOAI'::VARCHAR(20)),
         ('16.1.02'::VARCHAR(20), TRUE::BOOLEAN, 3, 'NGOAI'::VARCHAR(20)),
         ('16.1.03'::VARCHAR(20), TRUE::BOOLEAN, 4, 'NGOAI'::VARCHAR(20)),
         ('16.1.05'::VARCHAR(20), TRUE::BOOLEAN, 5, 'NGOAI'::VARCHAR(20)),
         ('07.1.01'::VARCHAR(20), TRUE::BOOLEAN, 6, 'ERP'::VARCHAR(20)),
         ('16.1.04'::VARCHAR(20), FALSE::BOOLEAN, 7, 'NGOAI'::VARCHAR(20)),
         ('16.1.08'::VARCHAR(20), FALSE::BOOLEAN, 8, 'NGOAI'::VARCHAR(20)),
         ('16.3.02'::VARCHAR(20), FALSE::BOOLEAN, 9, 'ERP'::VARCHAR(20))
       ) AS v(ma, bb, tt, nguon)
WHERE  m.ma_mau = 'XNK_NHAP'
ON CONFLICT (mau_id, ma_loai_ho_so) DO NOTHING;

INSERT INTO dm_bo_ho_so_mau (ma_mau, ten_mau, loai_ho_so_chinh, linh_vuc_ap_dung,
    mo_ta, bat_buoc_toi_thieu)
VALUES ('XAY_DUNG', 'Bộ hồ sơ công trình xây dựng', '15', '{XAY_DUNG}',
    'Bộ hồ sơ công trình xây dựng', 5)
ON CONFLICT (tenant_id, ma_mau) DO NOTHING;
INSERT INTO dm_bo_ho_so_mau_ct (mau_id, ma_loai_ho_so, bat_buoc, thu_tu, nguon)
SELECT id, v.ma, v.bb, v.tt, v.nguon
FROM   dm_bo_ho_so_mau m,
       (VALUES
         ('15.1.01'::VARCHAR(20), TRUE::BOOLEAN, 1, 'NGOAI'::VARCHAR(20)),
         ('15.1.03'::VARCHAR(20), TRUE::BOOLEAN, 2, 'NGOAI'::VARCHAR(20)),
         ('15.3.01'::VARCHAR(20), TRUE::BOOLEAN, 3, 'NGOAI'::VARCHAR(20)),
         ('15.3.02'::VARCHAR(20), TRUE::BOOLEAN, 4, 'NGOAI'::VARCHAR(20)),
         ('15.4.01'::VARCHAR(20), TRUE::BOOLEAN, 5, 'ERP'::VARCHAR(20)),
         ('15.2.01'::VARCHAR(20), FALSE::BOOLEAN, 6, 'NGOAI'::VARCHAR(20)),
         ('15.5.01'::VARCHAR(20), FALSE::BOOLEAN, 7, 'NGOAI'::VARCHAR(20)),
         ('15.6.01'::VARCHAR(20), FALSE::BOOLEAN, 8, 'NGOAI'::VARCHAR(20)),
         ('17.6.01'::VARCHAR(20), FALSE::BOOLEAN, 9, 'NGOAI'::VARCHAR(20))
       ) AS v(ma, bb, tt, nguon)
WHERE  m.ma_mau = 'XAY_DUNG'
ON CONFLICT (mau_id, ma_loai_ho_so) DO NOTHING;

-- ── Kiểm tra mẫu ──
-- SELECT m.ma_mau, COUNT(c.*) AS so_thanh_phan,
--        COUNT(*) FILTER (WHERE c.bat_buoc) AS so_bat_buoc
-- FROM dm_bo_ho_so_mau m JOIN dm_bo_ho_so_mau_ct c ON c.mau_id = m.id
-- GROUP BY m.ma_mau ORDER BY m.ma_mau;

-- =============================================================================
-- PHẦN F. KIỂM THỬ BẮT BUỘC (14 §9)
-- =============================================================================
-- T1: Tổng theo NGÀY phải bằng tổng theo NĂM (với cùng bộ lọc)
-- SELECT
--   (SELECT SUM(so_thanh_phan) FROM fn_trich_xuat_ho_so('NGAY', p_nam => 2026))
--   =
--   (SELECT SUM(so_thanh_phan) FROM fn_trich_xuat_ho_so('NAM',  p_nam => 2026)) AS khop;

-- T2: Không hồ sơ nào thiếu trục thời gian gốc
-- SELECT COUNT(*) FROM hs_ho_so WHERE ngay_phat_sinh IS NULL;            -- kỳ vọng 0

-- T3: Không thành phần nào vi phạm quy tắc "đúng một nguồn"
-- SELECT COUNT(*) FROM hs_thanh_phan
-- WHERE num_nonnulls(chung_tu_id, tai_lieu_id) <> 1;                     -- kỳ vọng 0

-- T4: Không hồ sơ VINH_VIEN nào có ngày hết hạn
-- SELECT COUNT(*) FROM hs_ho_so
-- WHERE thoi_han_luu_tru = 'VINH_VIEN' AND ngay_het_han_luu_tru IS NOT NULL;  -- kỳ vọng 0

-- T5: Cây danh mục đủ 3 cấp
-- SELECT cap, COUNT(*) FROM dm_loai_ho_so GROUP BY cap ORDER BY cap;
--   kỳ vọng: 1 → 18 ; 2 → 91 ; 3 → 279   (tổng 388)
