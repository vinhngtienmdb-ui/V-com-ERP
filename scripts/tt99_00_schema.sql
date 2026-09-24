-- =============================================================================
-- PHÂN HỆ KẾ TOÁN ERP — DDL KHỞI TẠO (PostgreSQL 16)
-- Kèm theo: 01_THIET_KE_CHUC_NANG_KE_TOAN.md
--
-- ⚠️ ĐÃ ÁP DỤNG QUYẾT ĐỊNH KIẾN TRÚC (chốt 21/09/2026) — chi tiết: 11_CAU_HINH_STACK_VCOMM_ERP.md §5
--   Q1. TÊN BẢNG TIẾNG VIỆT (dm_* / ct_* / ht_* / so_* / sys_* / ai_*) — giữ nguyên.
--   Q2. MISA AMIS chỉ dùng để PHÁT HÀNH HÓA ĐƠN ĐIỆN TỬ. Sổ kế toán nội bộ trong
--       file này là NGUỒN CHÂN LÝ (book of record). Xem 11 §9.
--   Q3. MỘT PHÁP NHÂN KẾ TOÁN DUY NHẤT. Thể hiện bằng:
--       • dm_cong_ty là bảng SINGLETON (khóa chính = tenant_id + CHECK ràng buộc)
--       • mọi bảng nghiệp vụ mang cột tenant_id TEXT DEFAULT 'tenant-vcomm-prod-01'
--       • KHÔNG còn company_id BIGINT và KHÔNG còn FK tới dm_cong_ty
--       • RLS bật trên mọi bảng có tenant_id (xem §8)
--
-- Quy ước kỹ thuật (khớp VComm ERP):
--   • CSDL: Supabase PostgreSQL (project ref wivioicznwyhmpbeqoib)
--   • Tiền tệ: DECIMAL(19,4) — KHÔNG dùng float/double
--   • Không dùng ORM — sinh migration bằng script .sql + runner tsx
--   • Đặt file migration tại D:\VComm\vcomm-erp\scripts\ với tiền tố tt99_
--
-- ⚠️ CĂN CỨ PHÁP LÝ (cập nhật): Thông tư 99/2025/TT-BTC ngày 27/10/2025,
--    hiệu lực 01/01/2026, thay thế Thông tư 200/2014/TT-BTC.
--    - Hệ thống tài khoản: 172 TK (Phụ lục II) → nạp đầy đủ bằng
--      file 07_seed_tt99_tai_khoan.sql. Khối seed trong file này chỉ là TRÍCH ĐOẠN.
--    - Biểu mẫu sổ kế toán: 42 mẫu (Phụ lục III) → 10_seed_tt99_bieu_mau.sql
--    - Biểu mẫu BCTC: 15 mã mẫu (Phụ lục IV) → 10_seed_tt99_bieu_mau.sql
--    - Xem hướng dẫn nâng cấp đầy đủ: 06_CAP_NHAT_TT99_2025.md,
--      08_ANH_XA_TAI_KHOAN_TT200_TT99.md, 09_AI_PROMPTS_CAP_NHAT_TT99.md
-- =============================================================================

-- ---------- 0. SCHEMA & EXTENSION ----------
CREATE SCHEMA IF NOT EXISTS acc;
SET search_path TO acc, public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. DANH MỤC (MASTER DATA)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ĐƠN VỊ KẾ TOÁN — SINGLETON  (quyết định Q3: MỘT pháp nhân kế toán duy nhất)
-- -----------------------------------------------------------------------------
-- Khóa chính CHÍNH LÀ tenant_id để đồng nhất với quy ước multi-tenant của VComm
-- (cột tenant_id TEXT + RLS trên mọi bảng).
-- Ràng buộc ck_dm_cong_ty_singleton bảo đảm bảng chỉ có ĐÚNG 1 dòng: mọi giá
-- trị khác 'tenant-vcomm-prod-01' đều bị từ chối.
-- Các bảng khác KHÔNG dùng FK tới đây — chúng chỉ mang cột tenant_id với
-- DEFAULT 'tenant-vcomm-prod-01' (đúng quy ước repo, tránh FK chéo không cần thiết).
CREATE TABLE dm_cong_ty (
    tenant_id        TEXT PRIMARY KEY DEFAULT 'tenant-vcomm-prod-01',
    ma_cong_ty       VARCHAR(30)  NOT NULL UNIQUE,
    ten_cong_ty      VARCHAR(255) NOT NULL,
    ma_so_thue       VARCHAR(20),
    dia_chi          VARCHAR(255),
    dien_thoai       VARCHAR(30),
    email            VARCHAR(120),
    nguoi_dai_dien   VARCHAR(150),
    ke_toan_truong   VARCHAR(150),
    linh_vuc_hoat_dong TEXT[] DEFAULT '{THUONG_MAI,DICH_VU}',
    -- Chế độ kế toán áp dụng (TT99 từ 01/01/2026)
    thong_tu_ap_dung VARCHAR(10) NOT NULL DEFAULT 'TT99',   -- TT99 | TT200 | TT133
    hinh_thuc_so     VARCHAR(20) NOT NULL DEFAULT 'NKC',    -- NKC|NK_SO_CAI|CTGS|NK_CT|MAY_VI_TINH
    ngay_hieu_luc_tt99 DATE      DEFAULT DATE '2026-01-01',
    ky_chuyen_doi    VARCHAR(7)  DEFAULT '2026-01',
    logo_url         VARCHAR(500),
    trang_thai       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by       BIGINT,
    updated_at       TIMESTAMPTZ,
    updated_by       BIGINT,
    deleted_at       TIMESTAMPTZ,
    CONSTRAINT ck_dm_cong_ty_singleton CHECK (tenant_id = 'tenant-vcomm-prod-01')
);

CREATE TABLE dm_ky_ke_toan (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id  TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    nam         SMALLINT NOT NULL,
    thang       SMALLINT NOT NULL DEFAULT 0,   -- 0 = kỳ năm
    tu_ngay     DATE NOT NULL,
    den_ngay    DATE NOT NULL,
    trang_thai  VARCHAR(20) NOT NULL DEFAULT 'DANG_MO',  -- CHUA_MO | DANG_MO | DA_KHOA
    ngay_khoa   TIMESTAMPTZ,
    nguoi_khoa  BIGINT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ky UNIQUE (tenant_id, nam, thang),
    CONSTRAINT ck_ky_thang CHECK (thang BETWEEN 0 AND 12),
    CONSTRAINT ck_ky_ngay  CHECK (tu_ngay <= den_ngay)
);
CREATE INDEX ix_ky_lookup ON dm_ky_ke_toan (tenant_id, trang_thai, tu_ngay, den_ngay);

CREATE TABLE dm_tai_khoan (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id      TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ma_tk           VARCHAR(20)  NOT NULL,
    ten_tk          VARCHAR(255) NOT NULL,
    ten_tk_en       VARCHAR(255),
    tk_me_id        BIGINT REFERENCES dm_tai_khoan(id),
    cap             SMALLINT NOT NULL DEFAULT 1,
    loai_tk         VARCHAR(20) NOT NULL,   -- TAI_SAN|NO_PHAI_TRA|VON|DOANH_THU|CHI_PHI
    tinh_chat       VARCHAR(20) NOT NULL,   -- DU_NO|DU_CO|LUONG_TINH
    la_tk_chi_tiet  BOOLEAN NOT NULL DEFAULT TRUE,
    tk_cong_no      BOOLEAN NOT NULL DEFAULT FALSE,
    tk_kho          BOOLEAN NOT NULL DEFAULT FALSE,
    tk_ngoai_te     BOOLEAN NOT NULL DEFAULT FALSE,
    tk_thue         BOOLEAN NOT NULL DEFAULT FALSE,
    tk_luong_tinh   BOOLEAN NOT NULL DEFAULT FALSE,
    tk_am           BOOLEAN NOT NULL DEFAULT FALSE,
    -- TT99/2025: theo dõi vòng đời tài khoản và chế độ kế toán áp dụng
    ngung_su_dung   BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE = TK bị TT99 bỏ, chặn hạch toán mới
    ngay_ngung      DATE,                             -- ngày ngừng sử dụng
    tt_ap_dung      VARCHAR(10) NOT NULL DEFAULT 'TT99',  -- TT99 | TT200 | TT99_TUYBIEN
    la_tuy_bien     BOOLEAN NOT NULL DEFAULT FALSE,   -- DN tự mở thêm (Điều 11 TT99)
    trang_thai      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT uq_tk UNIQUE (tenant_id, ma_tk)
);
CREATE INDEX ix_tk_ma ON dm_tai_khoan (tenant_id, ma_tk) WHERE deleted_at IS NULL;

CREATE TABLE dm_doi_tuong (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id          TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ma_dt               VARCHAR(30)  NOT NULL,
    ten_dt              VARCHAR(255) NOT NULL,
    loai_dt             VARCHAR(30)  NOT NULL,  -- KHACH_HANG|NHA_CUNG_CAP|NHAN_VIEN|CA_NHAN_KHAC
    ma_so_thue          VARCHAR(20),
    cmnd_cccd           VARCHAR(20),
    dia_chi             VARCHAR(255),
    dien_thoai          VARCHAR(30),
    email               VARCHAR(120),
    nguoi_lien_he       VARCHAR(150),
    tk_cong_no          VARCHAR(20),
    dieu_khoan_thanh_toan INT NOT NULL DEFAULT 0,
    han_muc_cong_no     DECIMAL(19,4),
    nhom_dt             VARCHAR(50),
    ghi_chu             VARCHAR(500),
    trang_thai          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT uq_dt UNIQUE (tenant_id, ma_dt)
);
CREATE INDEX ix_dt_ten ON dm_doi_tuong (tenant_id, loai_dt) WHERE deleted_at IS NULL;

CREATE TABLE dm_hang_hoa (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id          TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ma_hh               VARCHAR(30)  NOT NULL,
    ten_hh              VARCHAR(255) NOT NULL,
    don_vi_tinh         VARCHAR(20),
    nhom_hh             VARCHAR(50),
    tk_kho              VARCHAR(20),
    tk_doanh_thu        VARCHAR(20),
    tk_gia_von          VARCHAR(20),
    thue_suat_id        BIGINT,
    phuong_phap_tinh_gia VARCHAR(20) NOT NULL DEFAULT 'BQGQ', -- FIFO|BQGQ|THUC_TE_DICH_DANH
    gia_ban             DECIMAL(19,4),
    trang_thai          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT uq_hh UNIQUE (tenant_id, ma_hh)
);

CREATE TABLE dm_kho (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id  TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ma_kho      VARCHAR(20)  NOT NULL,
    ten_kho     VARCHAR(150) NOT NULL,
    dia_diem    VARCHAR(255),
    loai_kho    VARCHAR(30) NOT NULL DEFAULT 'KHO_HANG',
    thu_kho_id  BIGINT REFERENCES dm_doi_tuong(id),
    trang_thai  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT uq_kho UNIQUE (tenant_id, ma_kho)
);

CREATE TABLE dm_thue_suat (
    id            BIGSERIAL PRIMARY KEY,
    tenant_id    TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ma_thue       VARCHAR(20)  NOT NULL,
    ten_thue      VARCHAR(150) NOT NULL,
    ty_le         DECIMAL(5,2) NOT NULL,
    loai_thue     VARCHAR(20) NOT NULL DEFAULT 'GTGT',  -- GTGT|TNDN|TNCN|NT
    hieu_luc_tu   DATE,
    hieu_luc_den  DATE,
    tk_thue       VARCHAR(20),
    trang_thai    VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT uq_thue UNIQUE (tenant_id, ma_thue)
);

CREATE TABLE dm_khoan_muc_chi_phi (
    id            BIGSERIAL PRIMARY KEY,
    tenant_id    TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ma_km         VARCHAR(30)  NOT NULL,
    ten_km        VARCHAR(255) NOT NULL,
    tk_chi_phi    VARCHAR(20),
    km_cha_id     BIGINT REFERENCES dm_khoan_muc_chi_phi(id),
    ngan_sach_nam DECIMAL(19,4),
    trang_thai    VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT uq_km UNIQUE (tenant_id, ma_km)
);

CREATE TABLE dm_bo_phan (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id  TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ma_bp       VARCHAR(30)  NOT NULL,
    ten_bp      VARCHAR(150) NOT NULL,
    bp_cha_id   BIGINT REFERENCES dm_bo_phan(id),
    trang_thai  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT uq_bp UNIQUE (tenant_id, ma_bp)
);

CREATE TABLE dm_tien_te (
    ma_tien     VARCHAR(3) PRIMARY KEY,
    ten_tien    VARCHAR(50) NOT NULL,
    ky_hieu     VARCHAR(10),
    so_thap_phan SMALLINT NOT NULL DEFAULT 0
);

-- =============================================================================
-- 2. CHỨNG TỪ (TRANSACTIONS)
-- =============================================================================

CREATE TABLE ct_chung_tu (
    id                      BIGSERIAL PRIMARY KEY,
    tenant_id              TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    branch_id               BIGINT,
    loai_ct                 VARCHAR(20)  NOT NULL,   -- CHI|THU|NK|XK|HD|NKC|PKT|LUONG|TS
    so_ct                   VARCHAR(30)  NOT NULL,
    ngay_ct                 DATE NOT NULL,
    ngay_hach_toan          DATE NOT NULL,
    ky_ke_toan_id           BIGINT NOT NULL REFERENCES dm_ky_ke_toan(id),

    doi_tuong_id            BIGINT REFERENCES dm_doi_tuong(id),
    ten_doi_tuong_snapshot  VARCHAR(255),
    dia_chi_snapshot        VARCHAR(255),
    dien_giai               VARCHAR(500) NOT NULL,

    -- Thông tin hóa đơn
    so_hoa_don              VARCHAR(30),
    ngay_hoa_don            DATE,
    mau_so_hd               VARCHAR(20),
    ky_hieu_hd              VARCHAR(20),
    han_thanh_toan          DATE,
    tham_chieu              VARCHAR(100),
    la_hoa_don_dien_tu      BOOLEAN NOT NULL DEFAULT FALSE,
    ma_tra_cuu_hddt         VARCHAR(100),

    -- Tiền tệ
    tien_te                 VARCHAR(3) NOT NULL DEFAULT 'VND',
    ty_gia                  DECIMAL(19,6) NOT NULL DEFAULT 1,

    -- Tổng hợp (sinh tự động từ ct_hach_toan)
    tong_tien_hang          DECIMAL(19,4) NOT NULL DEFAULT 0,
    tong_tien_thue          DECIMAL(19,4) NOT NULL DEFAULT 0,
    tong_cong               DECIMAL(19,4) NOT NULL DEFAULT 0,

    -- Trạng thái & vòng đời
    trang_thai              VARCHAR(20) NOT NULL DEFAULT 'CHUA_GHI_SO',
    ngay_ghi_so             TIMESTAMPTZ,
    nguoi_ghi_so            BIGINT,
    ly_do_huy                VARCHAR(500),
    ghi_chu                 VARCHAR(1000),

    -- Checklist trước khi ghi sổ
    kiem_tra_chung_tu_goc   BOOLEAN NOT NULL DEFAULT FALSE,
    doi_chieu_cong_no       BOOLEAN NOT NULL DEFAULT FALSE,
    kiem_tra_so_du          BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
    row_version             INT NOT NULL DEFAULT 1,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              BIGINT,
    updated_at              TIMESTAMPTZ,
    updated_by              BIGINT,
    deleted_at              TIMESTAMPTZ,

    CONSTRAINT uq_ct UNIQUE (tenant_id, loai_ct, so_ct),
    CONSTRAINT ck_ct_trang_thai CHECK (trang_thai IN ('NHAP','CHUA_GHI_SO','DA_GHI_SO','DA_HUY')),
    CONSTRAINT ck_ct_ngay CHECK (ngay_ct <= ngay_hach_toan),
    CONSTRAINT ck_ct_ty_gia CHECK (ty_gia > 0)
);
CREATE INDEX ix_ct_ky        ON ct_chung_tu (tenant_id, ky_ke_toan_id, trang_thai) WHERE deleted_at IS NULL;
CREATE INDEX ix_ct_ngay      ON ct_chung_tu (tenant_id, ngay_hach_toan DESC)        WHERE deleted_at IS NULL;
CREATE INDEX ix_ct_doituong  ON ct_chung_tu (tenant_id, doi_tuong_id)               WHERE deleted_at IS NULL;
CREATE INDEX ix_ct_hoadon    ON ct_chung_tu (tenant_id, so_hoa_don)                 WHERE so_hoa_don IS NOT NULL;
CREATE INDEX ix_ct_fulltext  ON ct_chung_tu USING gin (to_tsvector('simple', dien_giai));

CREATE TABLE ct_hach_toan (
    id                  BIGSERIAL PRIMARY KEY,
    chung_tu_id         BIGINT NOT NULL REFERENCES ct_chung_tu(id) ON DELETE CASCADE,
    stt                 INT NOT NULL,
    tk_no               VARCHAR(20) NOT NULL,
    tk_co               VARCHAR(20) NOT NULL,
    so_tien             DECIMAL(19,4) NOT NULL,   -- cho phép âm (bút toán đỏ)
    so_tien_nt          DECIMAL(19,4),
    ty_gia              DECIMAL(19,6),
    doi_tuong_id        BIGINT REFERENCES dm_doi_tuong(id),
    hang_hoa_id         BIGINT REFERENCES dm_hang_hoa(id),
    kho_id              BIGINT REFERENCES dm_kho(id),
    so_luong            DECIMAL(19,4),
    don_gia             DECIMAL(19,4),
    thanh_tien          DECIMAL(19,4) NOT NULL DEFAULT 0,
    thue_suat_id        BIGINT REFERENCES dm_thue_suat(id),
    thue_suat           DECIMAL(5,2),
    tien_thue           DECIMAL(19,4) NOT NULL DEFAULT 0,
    tk_thue             VARCHAR(20),
    khoan_muc_cp_id     BIGINT REFERENCES dm_khoan_muc_chi_phi(id),
    bo_phan_id          BIGINT REFERENCES dm_bo_phan(id),
    vu_viec_id          BIGINT,
    dien_giai           VARCHAR(500),
    la_but_toan_ket_chuyen BOOLEAN NOT NULL DEFAULT FALSE,
    la_dieu_chinh_lam_tron BOOLEAN NOT NULL DEFAULT FALSE,
    -- TT99: vết ánh xạ tài khoản khi chuyển đổi số dư (Điều 29)
    tk_no_tt200         VARCHAR(20),
    tk_co_tt200         VARCHAR(20),
    CONSTRAINT uq_ht_stt UNIQUE (chung_tu_id, stt),
    CONSTRAINT ck_ht_so_tien CHECK (so_tien <> 0)
);
CREATE INDEX ix_ht_ct   ON ct_hach_toan (chung_tu_id, stt);
CREATE INDEX ix_ht_tkno ON ct_hach_toan (tk_no);
CREATE INDEX ix_ht_tkco ON ct_hach_toan (tk_co);
CREATE INDEX ix_ht_dt   ON ct_hach_toan (doi_tuong_id);
CREATE INDEX ix_ht_hh   ON ct_hach_toan (hang_hoa_id, kho_id);

CREATE TABLE ct_dinh_kem (
    id           BIGSERIAL PRIMARY KEY,
    chung_tu_id  BIGINT NOT NULL REFERENCES ct_chung_tu(id) ON DELETE CASCADE,
    ten_file     VARCHAR(255) NOT NULL,
    duong_dan    VARCHAR(500) NOT NULL,
    dung_luong   BIGINT NOT NULL,          -- bytes, max 10*1024*1024
    mime_type    VARCHAR(100) NOT NULL,
    checksum     VARCHAR(64) NOT NULL,     -- SHA-256
    uploaded_by  BIGINT,
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_dk_size CHECK (dung_luong <= 10485760)
);
CREATE INDEX ix_dk_ct ON ct_dinh_kem (chung_tu_id);

CREATE TABLE ct_lich_su (
    id              BIGSERIAL PRIMARY KEY,
    chung_tu_id     BIGINT NOT NULL REFERENCES ct_chung_tu(id) ON DELETE CASCADE,
    hanh_dong       VARCHAR(20) NOT NULL,  -- TAO|SUA|XOA|GHI_SO|BO_GHI_SO|HUY|IN
    nguoi_thuc_hien BIGINT,
    ten_nguoi       VARCHAR(150),
    thoi_gian       TIMESTAMPTZ NOT NULL DEFAULT now(),
    du_lieu_truoc   JSONB,
    du_lieu_sau     JSONB,
    ly_do           VARCHAR(500),
    ip              VARCHAR(45)
);
CREATE INDEX ix_ls_ct ON ct_lich_su (chung_tu_id, thoi_gian DESC);

CREATE TABLE ct_lien_ket (
    id                    BIGSERIAL PRIMARY KEY,
    chung_tu_id           BIGINT NOT NULL REFERENCES ct_chung_tu(id),
    chung_tu_lien_ket_id  BIGINT NOT NULL REFERENCES ct_chung_tu(id),
    loai_lien_ket         VARCHAR(30) NOT NULL, -- THANH_TOAN_CHO|DIEU_CHINH|GOC
    so_tien               DECIMAL(19,4),
    ghi_chu               VARCHAR(500)
);

-- =============================================================================
-- 3. HỆ THỐNG
-- =============================================================================

-- Người dùng ứng dụng kế toán (kế toán viên, thủ quỹ, kế toán trưởng…).
-- BẢNG DÙNG CHUNG TOÀN HỆ — KHÔNG phân vùng theo tenant_id.
-- Lý do: quyết định Q3 chỉ có MỘT pháp nhân kế toán, nên mọi người dùng đều
-- thuộc cùng một đơn vị; thêm tenant_id ở đây là dư thừa.
-- Xác thực danh tính gốc do VComm Core Backend đảm nhiệm (bảng vcomm_users);
-- bảng này chỉ giữ hồ sơ người dùng phục vụ phân quyền trong phân hệ kế toán.
CREATE TABLE ht_nguoi_dung (
    id                BIGSERIAL PRIMARY KEY,
    ten_dang_nhap     VARCHAR(50) NOT NULL UNIQUE,
    mat_khau_hash     VARCHAR(255) NOT NULL,   -- Argon2id / bcrypt cost >= 12
    ho_ten            VARCHAR(150) NOT NULL,
    email             VARCHAR(120),
    dien_thoai        VARCHAR(30),
    trang_thai        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    lan_dang_nhap_cuoi TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ
);

CREATE TABLE ht_vai_tro (
    id        BIGSERIAL PRIMARY KEY,
    ma_vt     VARCHAR(30) NOT NULL UNIQUE,
    ten_vt    VARCHAR(150) NOT NULL,
    mo_ta     VARCHAR(500)
);

CREATE TABLE ht_quyen (
    id        BIGSERIAL PRIMARY KEY,
    ma_quyen  VARCHAR(50) NOT NULL UNIQUE,   -- JOURNAL_CREATE, JOURNAL_POST, PERIOD_CLOSE...
    mo_ta     VARCHAR(255)
);

CREATE TABLE ht_vai_tro_quyen (
    vai_tro_id BIGINT NOT NULL REFERENCES ht_vai_tro(id) ON DELETE CASCADE,
    quyen_id   BIGINT NOT NULL REFERENCES ht_quyen(id)   ON DELETE CASCADE,
    PRIMARY KEY (vai_tro_id, quyen_id)
);

CREATE TABLE ht_nguoi_dung_vai_tro (
    nguoi_dung_id BIGINT NOT NULL REFERENCES ht_nguoi_dung(id) ON DELETE CASCADE,
    vai_tro_id    BIGINT NOT NULL REFERENCES ht_vai_tro(id)    ON DELETE CASCADE,
    PRIMARY KEY (nguoi_dung_id, vai_tro_id)
);

CREATE TABLE ht_audit_log (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id  TEXT,
    user_id     BIGINT,
    ten_dang_nhap VARCHAR(50),
    hanh_dong   VARCHAR(50) NOT NULL,
    entity      VARCHAR(50),
    entity_id   BIGINT,
    du_lieu     JSONB,
    ip          VARCHAR(45),
    user_agent  VARCHAR(255),
    trace_id    VARCHAR(50),
    thoi_gian   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_time   ON ht_audit_log (thoi_gian DESC);
CREATE INDEX ix_audit_entity ON ht_audit_log (entity, entity_id);
-- KHÔNG tạo API xóa cho bảng này.

CREATE TABLE ht_cau_hinh (
    id         BIGSERIAL PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    khoa       VARCHAR(50) NOT NULL,
    gia_tri    TEXT,
    kieu       VARCHAR(20) NOT NULL DEFAULT 'STRING', -- STRING|NUMBER|BOOLEAN|JSON
    mo_ta      VARCHAR(255),
    CONSTRAINT uq_cauhinh UNIQUE (tenant_id, khoa)
);

CREATE TABLE ht_sao_luu (
    id         BIGSERIAL PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ten_file   VARCHAR(255) NOT NULL,
    duong_dan  VARCHAR(500) NOT NULL,
    dung_luong BIGINT,
    loai       VARCHAR(20) NOT NULL DEFAULT 'TU_DONG', -- TU_DONG|THU_CONG
    trang_thai  VARCHAR(20) NOT NULL DEFAULT 'THANH_CONG',
    thoi_gian  TIMESTAMPTZ NOT NULL DEFAULT now(),
    nguoi_tao  BIGINT
);

CREATE TABLE sys_sequence (
    id                BIGSERIAL PRIMARY KEY,
    tenant_id        TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    loai_ct           VARCHAR(20) NOT NULL,
    nam               SMALLINT NOT NULL,
    ky                SMALLINT NOT NULL DEFAULT 0,
    gia_tri_hien_tai  BIGINT NOT NULL DEFAULT 0,
    do_dai            SMALLINT NOT NULL DEFAULT 6,
    CONSTRAINT uq_seq UNIQUE (tenant_id, loai_ct, nam, ky)
);
-- Cấp số an toàn khi đồng thời:
-- UPDATE sys_sequence SET gia_tri_hien_tai = gia_tri_hien_tai + 1
--  WHERE tenant_id = $1 AND loai_ct = $2 AND nam = $3 AND ky = $4
--  RETURNING gia_tri_hien_tai;

-- Bảng log gợi ý AI (Phase 5)
CREATE TABLE ai_goi_y_log (
    id             BIGSERIAL PRIMARY KEY,
    tenant_id     TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    chung_tu_id    BIGINT REFERENCES ct_chung_tu(id),
    nguon_goi_y    VARCHAR(20) NOT NULL,  -- RULE|STAT|ML|DEFAULT
    du_lieu_vao    JSONB NOT NULL,
    ket_qua        JSONB NOT NULL,
    confidence     DECIMAL(5,4),
    nguoi_dung_chap_nhan BOOLEAN,
    thoi_gian      TIMESTAMPTZ NOT NULL DEFAULT now(),
    latency_ms     INT
);

-- =============================================================================
-- 4. TẦNG PROJECTION CHO SỔ KẾ TOÁN
-- =============================================================================

-- 4.1 Bung mỗi dòng hạch toán (cặp Nợ-Có) thành 2 bút toán đơn.
--     ĐÂY LÀ NGUỒN DUY NHẤT cho mọi sổ và báo cáo.
CREATE OR REPLACE VIEW v_but_toan_don AS
SELECT
    h.id                AS hach_toan_id,
    h.chung_tu_id,
    c.tenant_id,
    c.loai_ct,
    c.so_ct,
    c.ngay_ct,
    c.ngay_hach_toan,
    c.ky_ke_toan_id,
    c.trang_thai,
    c.tien_te,
    c.ty_gia,
    c.doi_tuong_id      AS ct_doi_tuong_id,
    c.dien_giai         AS ct_dien_giai,
    h.stt,
    h.tk_no,
    h.tk_co,
    h.so_tien,
    h.so_tien_nt,
    h.thanh_tien,
    h.thue_suat,
    h.tien_thue,
    h.tk_thue,
    h.khoan_muc_cp_id,
    h.bo_phan_id,
    h.hang_hoa_id,
    h.kho_id,
    h.so_luong,
    h.dien_giai         AS line_dien_giai,
    'NO'::varchar(2)    AS ben,
    h.tk_no             AS tk,
    h.so_tien           AS ps_no,
    0::numeric          AS ps_co
FROM ct_hach_toan h
JOIN ct_chung_tu c ON c.id = h.chung_tu_id
WHERE c.deleted_at IS NULL AND c.trang_thai = 'DA_GHI_SO'
UNION ALL
SELECT
    h.id, h.chung_tu_id, c.tenant_id, c.loai_ct, c.so_ct, c.ngay_ct, c.ngay_hach_toan,
    c.ky_ke_toan_id, c.trang_thai, c.tien_te, c.ty_gia, c.doi_tuong_id, c.dien_giai,
    h.stt, h.tk_no, h.tk_co, h.so_tien, h.so_tien_nt, h.thanh_tien, h.thue_suat,
    h.tien_thue, h.tk_thue, h.khoan_muc_cp_id, h.bo_phan_id, h.hang_hoa_id, h.kho_id,
    h.so_luong, h.dien_giai,
    'CO'::varchar(2), h.tk_co, 0::numeric, h.so_tien
FROM ct_hach_toan h
JOIN ct_chung_tu c ON c.id = h.chung_tu_id
WHERE c.deleted_at IS NULL AND c.trang_thai = 'DA_GHI_SO';

-- 4.2 Sổ Nhật ký chung (mẫu S03a-DN)
CREATE OR REPLACE VIEW v_so_nhat_ky_chung AS
SELECT
    c.ngay_hach_toan,
    c.so_ct,
    c.ngay_ct,
    COALESCE(h.dien_giai, c.dien_giai) AS dien_giai,
    h.tk_no,
    h.tk_co,
    h.so_tien,
    h.stt,
    c.id AS chung_tu_id,
    c.tenant_id,
    c.ky_ke_toan_id
FROM ct_hach_toan h
JOIN ct_chung_tu c ON c.id = h.chung_tu_id
WHERE c.deleted_at IS NULL AND c.trang_thai = 'DA_GHI_SO'
ORDER BY c.ngay_hach_toan, c.so_ct, h.stt;

-- 4.3 Sổ Cái (mẫu S03b-DN) — cần tham số kỳ & tài khoản
CREATE OR REPLACE VIEW v_so_cai AS
SELECT
    b.tenant_id,
    b.ky_ke_toan_id,
    b.tk,
    b.ngay_hach_toan,
    b.so_ct,
    COALESCE(b.line_dien_giai, b.ct_dien_giai) AS dien_giai,
    b.doi_tuong_id,
    b.ps_no,
    b.ps_co,
    b.chung_tu_id,
    b.stt,
    b.ben
FROM v_but_toan_don b;

-- 4.4 Số dư tài khoản (materialize, rebuild được)
CREATE TABLE so_du_tai_khoan (
    id            BIGSERIAL PRIMARY KEY,
    tenant_id    TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ky_ke_toan_id BIGINT NOT NULL REFERENCES dm_ky_ke_toan(id),
    tk            VARCHAR(20) NOT NULL,
    doi_tuong_id  BIGINT,
    du_dau_no     DECIMAL(19,4) NOT NULL DEFAULT 0,
    du_dau_co     DECIMAL(19,4) NOT NULL DEFAULT 0,
    ps_no         DECIMAL(19,4) NOT NULL DEFAULT 0,
    ps_co         DECIMAL(19,4) NOT NULL DEFAULT 0,
    du_cuoi_no    DECIMAL(19,4) NOT NULL DEFAULT 0,
    du_cuoi_co    DECIMAL(19,4) NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_sodu UNIQUE (tenant_id, ky_ke_toan_id, tk, doi_tuong_id)
);
CREATE INDEX ix_sodu_lookup ON so_du_tai_khoan (tenant_id, ky_ke_toan_id, tk);

-- =============================================================================
-- 5. KIỂM TRA TOÀN VẸN (chạy định kỳ, job "Kiểm tra dữ liệu")
-- =============================================================================

-- 5.1 Mọi chứng từ đã ghi sổ phải cân Nợ = Có
-- SELECT c.id, c.so_ct, SUM(h.so_tien) AS tong
-- FROM ct_chung_tu c JOIN ct_hach_toan h ON h.chung_tu_id = c.id
-- WHERE c.trang_thai = 'DA_GHI_SO'
-- GROUP BY c.id, c.so_ct
-- HAVING SUM(h.so_tien) <> 0;    -- kỳ vọng: 0 dòng

-- 5.2 Toàn hệ phải cân: Σ PS Nợ = Σ PS Có
-- SELECT SUM(ps_no) AS tong_no, SUM(ps_co) AS tong_co FROM v_but_toan_don;
--   -- kỳ vọng: tong_no = tong_co

-- 5.3 Không có bút toán vào TK mẹ
-- SELECT h.id, h.tk_no FROM ct_hach_toan h
-- JOIN dm_tai_khoan t ON t.ma_tk = h.tk_no AND t.la_tk_chi_tiet = FALSE;
--   -- kỳ vọng: 0 dòng

-- =============================================================================
-- 6. SEED TỐI THIỂU
-- =============================================================================

-- Đơn vị kế toán DUY NHẤT (singleton). Khởi tạo mặc định; cấu hình chi tiết qua màn hình Cấu hình hệ thống.
INSERT INTO dm_cong_ty (tenant_id, ma_cong_ty, ten_cong_ty, ma_so_thue, dia_chi, nguoi_dai_dien, ke_toan_truong, linh_vuc_hoat_dong,
                        thong_tu_ap_dung, hinh_thuc_so, ngay_hieu_luc_tt99, ky_chuyen_doi)
VALUES ('tenant-vcomm-prod-01', 'VCOMM', 'CÔNG TY TNHH VCOMM', '0101234567', 'Trụ sở chính VComm', 'Giám đốc', 'Kế toán trưởng', ARRAY['THUONG_MAI','DICH_VU']::TEXT[],
        'TT99', 'NKC', DATE '2026-01-01', '2026-01')
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO dm_tien_te (ma_tien, ten_tien, ky_hieu, so_thap_phan) VALUES
 ('VND', 'Việt Nam Đồng', '₫', 0),
 ('USD', 'Đô la Mỹ', '$', 2),
 ('EUR', 'Euro', '€', 2);

-- TT99 không còn cấp 3 (33311); dùng 3331 - Thuế GTGT phải nộp
INSERT INTO dm_thue_suat (tenant_id, ma_thue, ten_thue, ty_le, loai_thue, tk_thue) VALUES
 ('tenant-vcomm-prod-01', 'VAT0',    'Thuế GTGT 0%',  0.00, 'GTGT', '3331'),
 ('tenant-vcomm-prod-01', 'VAT5',    'Thuế GTGT 5%',  5.00, 'GTGT', '3331'),
 ('tenant-vcomm-prod-01', 'VAT8',    'Thuế GTGT 8%',  8.00, 'GTGT', '3331'),
 ('tenant-vcomm-prod-01', 'VAT10',   'Thuế GTGT 10%', 10.00,'GTGT', '3331'),
 ('tenant-vcomm-prod-01', 'KKKNT',   'Không kê khai nộp thuế', 0.00, 'GTGT', NULL);

INSERT INTO dm_ky_ke_toan (tenant_id, nam, thang, tu_ngay, den_ngay, trang_thai, thong_tu_ap_dung) VALUES
 ('tenant-vcomm-prod-01', 2025, 12, '2025-12-01', '2025-12-31', 'DANG_MO', 'TT200'),
 ('tenant-vcomm-prod-01', 2026,  1, '2026-01-01', '2026-01-31', 'DANG_MO', 'TT99');   -- kỳ chuyển đổi

INSERT INTO ht_vai_tro (ma_vt, ten_vt) VALUES
 ('ADMIN',            'Quản trị hệ thống'),
 ('CHIEF_ACCOUNTANT', 'Kế toán trưởng'),
 ('ACCOUNTANT',       'Kế toán viên'),
 ('CASHIER',          'Thủ quỹ'),
 ('WAREHOUSE',        'Thủ kho'),
 ('DIRECTOR',         'Ban giám đốc'),
 ('AUDITOR',          'Kiểm toán');

INSERT INTO ht_cau_hinh (tenant_id, khoa, gia_tri, kieu, mo_ta) VALUES
 ('tenant-vcomm-prod-01', 'thong_tu_ap_dung',      'TT99',  'STRING',  'Thông tư áp dụng: TT99 | TT200 | TT133'),
 ('tenant-vcomm-prod-01', 'hinh_thuc_so',          'NKC',   'STRING',  'NKC | NK_SO_CAI | CTGS | NK_CT | MAY_VI_TINH'),
 ('tenant-vcomm-prod-01', 'ngay_hieu_luc_tt99',    '2026-01-01', 'STRING', 'Ngày TT99/2025/TT-BTC có hiệu lực'),
 ('tenant-vcomm-prod-01', 'ky_chuyen_doi',         '2026-01',   'STRING', 'Kỳ kế toán đầu tiên áp dụng TT99'),
 ('tenant-vcomm-prod-01', 'bat_buoc_dinh_kem',     'true',  'BOOLEAN', 'Bắt buộc đính kèm chứng từ gốc khi ghi sổ'),
 ('tenant-vcomm-prod-01', 'cho_phep_am_kho',       'false', 'BOOLEAN', 'Cho phép tồn kho âm'),
 ('tenant-vcomm-prod-01', 'cho_phep_am_tien',      'false', 'BOOLEAN', 'Cho phép số dư tiền âm'),
 ('tenant-vcomm-prod-01', 'prefix_so_ct',          '{"CHI":"PC","THU":"PT","NK":"PN","XK":"PX","NKC":"NKC","CD":"CD"}', 'JSON', 'Tiền tố số chứng từ'),
 ('tenant-vcomm-prod-01', 'reset_so_ct_theo',      'NAM',   'STRING',  'NAM hoặc KY'),
 ('tenant-vcomm-prod-01', 'so_ngay_ngay_hd_toi_da', '30',   'NUMBER',  'Số ngày hóa đơn chậm hơn ngày chứng từ tối đa'),
 ('tenant-vcomm-prod-01', 'dung_ai_goi_y',         'false', 'BOOLEAN', 'Bật trợ lý AI gợi ý hạch toán'),
 ('tenant-vcomm-prod-01', 'don_vi_tien_mac_dinh',  'VND',   'STRING',  'Đơn vị tiền tệ mặc định'),
 -- Cấu hình mới theo TT99
 ('tenant-vcomm-prod-01', 'bat_checksum_ky',       'true',  'BOOLEAN', 'Bật kiểm tra toàn vẹn kỳ đã khóa (Điều 28.1.c)'),
 ('tenant-vcomm-prod-01', 'bat_buoc_quy_che_ht',   'true',  'BOOLEAN', 'Bắt buộc Quy chế hạch toán khi sửa biểu mẫu (Điều 12/18)'),
 ('tenant-vcomm-prod-01', 'phuong_phap_dieu_chinh_md', 'HOI_TO_DON_GIAN', 'STRING', 'HOI_TO | HOI_TO_DON_GIAN | PHI_HOI_TO'),
 ('tenant-vcomm-prod-01', 'bat_ket_noi_hddt',      'false', 'BOOLEAN', 'Bật kết nối phần mềm hóa đơn điện tử (Điều 28.1.đ)'),
 ('tenant-vcomm-prod-01', 'bat_ky_so_bctc',        'true',  'BOOLEAN', 'Bắt buộc ký số BCTC');

-- =============================================================================
-- 6.1. DANH MỤC TÀI KHOẢN THEO THÔNG TƯ 99/2025/TT-BTC
-- =============================================================================
-- ⚠️ NGUỒN CHÂN LÝ: file 07_seed_tt99_tai_khoan.sql chứa ĐẦY ĐỦ 172 tài khoản
--    TT99 (71 cấp 1 + 101 cấp 2, 148 tài khoản lá). Chạy file đó SAU file này.
--
--    Khối dưới đây chỉ là TRÍCH ĐOẠN MINH HỌA để schema tự chạy được và để
--    chứng từ mẫu ở mục 7 hoạt động. Các điểm khác TT200 đã được phản ánh:
--      - 111/112 KHÔNG còn cấp con 1111/1112/1121/1122 (TT99 bỏ)
--      - 112 đổi tên: "Tiền gửi ngân hàng" → "Tiền gửi không kỳ hạn"
--      - 242 đổi tên: "Chi phí trả trước" → "Chi phí chờ phân bổ"
--      - 642 đổi tên: "Chi phí quản lý kinh doanh" → "Chi phí quản lý doanh nghiệp"
--      - 333 KHÔNG còn cấp 3 (33311); dùng 3331
--      - 155 đổi tên: "Thành phẩm" → "Sản phẩm"
--      - 419 đổi tên: "Cổ phiếu quỹ" → "Cổ phiếu mua lại của chính mình"
--      - KHÔNG có 611, 631; KHÔNG có 1541..1544
-- =============================================================================
INSERT INTO dm_tai_khoan (tenant_id, ma_tk, ten_tk, cap, loai_tk, tinh_chat, la_tk_chi_tiet, tk_cong_no, tk_kho, tk_ngoai_te, tk_thue, tt_ap_dung) VALUES
 -- Tiền (TT99: không còn cấp con)
 ('tenant-vcomm-prod-01','111','Tiền mặt',1,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,TRUE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','112','Tiền gửi không kỳ hạn',1,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,TRUE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','113','Tiền đang chuyển',1,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,TRUE,FALSE,'TT99'),
 -- Đầu tư
 ('tenant-vcomm-prod-01','121','Chứng khoán kinh doanh',1,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','128','Đầu tư nắm giữ đến ngày đáo hạn',1,'TAI_SAN','DU_NO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','1281','Tiền gửi có kỳ hạn',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 -- Phải thu
 ('tenant-vcomm-prod-01','131','Phải thu của khách hàng',1,'TAI_SAN','LUONG_TINH',TRUE,TRUE,FALSE,TRUE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','133','Thuế GTGT được khấu trừ',1,'TAI_SAN','DU_NO',FALSE,FALSE,FALSE,FALSE,TRUE,'TT99'),
 ('tenant-vcomm-prod-01','1331','Thuế GTGT được khấu trừ của hàng hóa, dịch vụ',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,TRUE,'TT99'),
 ('tenant-vcomm-prod-01','1332','Thuế GTGT được khấu trừ của TSCĐ',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,TRUE,'TT99'),
 ('tenant-vcomm-prod-01','138','Phải thu khác',1,'TAI_SAN','LUONG_TINH',FALSE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','1381','Tài sản thiếu chờ xử lý',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','1383','Thuế TTĐB của hàng nhập khẩu',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,TRUE,'TT99'),  -- MỚI trong TT99
 ('tenant-vcomm-prod-01','1388','Phải thu khác',2,'TAI_SAN','LUONG_TINH',TRUE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','141','Tạm ứng',1,'TAI_SAN','DU_NO',TRUE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 -- Hàng tồn kho (TT99: 158 là "Nguyên liệu, vật tư tại kho bảo thuế")
 ('tenant-vcomm-prod-01','151','Hàng mua đang đi đường',1,'TAI_SAN','DU_NO',TRUE,FALSE,TRUE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','152','Nguyên liệu, vật liệu',1,'TAI_SAN','DU_NO',TRUE,FALSE,TRUE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','153','Công cụ, dụng cụ',1,'TAI_SAN','DU_NO',TRUE,FALSE,TRUE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','154','Chi phí sản xuất, kinh doanh dở dang',1,'TAI_SAN','DU_NO',TRUE,FALSE,TRUE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','155','Sản phẩm',1,'TAI_SAN','DU_NO',TRUE,FALSE,TRUE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','156','Hàng hóa',1,'TAI_SAN','DU_NO',TRUE,FALSE,TRUE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','157','Hàng gửi đi bán',1,'TAI_SAN','DU_NO',TRUE,FALSE,TRUE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','158','Nguyên liệu, vật tư tại kho bảo thuế',1,'TAI_SAN','DU_NO',TRUE,FALSE,TRUE,FALSE,FALSE,'TT99'),
 -- TSCĐ / BĐSĐT / tài sản sinh học
 ('tenant-vcomm-prod-01','211','Tài sản cố định hữu hình',1,'TAI_SAN','DU_NO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','212','Tài sản cố định thuê tài chính',1,'TAI_SAN','DU_NO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','213','Tài sản cố định vô hình',1,'TAI_SAN','DU_NO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','214','Hao mòn tài sản cố định',1,'TAI_SAN','DU_CO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2141','Hao mòn TSCĐ hữu hình',2,'TAI_SAN','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2142','Hao mòn TSCĐ thuê tài chính',2,'TAI_SAN','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2143','Hao mòn TSCĐ vô hình',2,'TAI_SAN','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2147','Hao mòn BĐSĐT',2,'TAI_SAN','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','215','Tài sản sinh học',1,'TAI_SAN','DU_NO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),          -- MỚI
 ('tenant-vcomm-prod-01','2151','Súc vật nuôi cho sản phẩm định kỳ',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2152','Súc vật nuôi lấy sản phẩm một lần',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2153','Cây trồng theo mùa vụ hoặc lấy sản phẩm một lần',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','217','Bất động sản đầu tư',1,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','221','Đầu tư vào công ty con',1,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','222','Đầu tư vào công ty liên doanh, liên kết',1,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','228','Đầu tư khác',1,'TAI_SAN','DU_NO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2281','Đầu tư góp vốn vào đơn vị khác',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','229','Dự phòng tổn thất tài sản',1,'TAI_SAN','DU_CO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2293','Dự phòng phải thu khó đòi',2,'TAI_SAN','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2294','Dự phòng giảm giá hàng tồn kho',2,'TAI_SAN','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2295','Dự phòng tổn thất tài sản sinh học',2,'TAI_SAN','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),  -- MỚI
 -- XDCB dở dang / chi phí chờ phân bổ / thuế hoãn lại
 ('tenant-vcomm-prod-01','241','Xây dựng cơ bản dở dang',1,'TAI_SAN','DU_NO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2411','Mua sắm TSCĐ',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2412','Xây dựng cơ bản',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2413','Sửa chữa, bảo dưỡng định kỳ TSCĐ',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','2414','Nâng cấp, cải tạo TSCĐ',2,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),      -- MỚI
 ('tenant-vcomm-prod-01','242','Chi phí chờ phân bổ',1,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','243','Tài sản thuế thu nhập hoãn lại',1,'TAI_SAN','DU_NO',TRUE,FALSE,FALSE,FALSE,TRUE,'TT99'),
 ('tenant-vcomm-prod-01','244','Ký quỹ, ký cược',1,'TAI_SAN','DU_NO',TRUE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 -- Nợ phải trả
 ('tenant-vcomm-prod-01','331','Phải trả cho người bán',1,'NO_PHAI_TRA','LUONG_TINH',TRUE,TRUE,FALSE,TRUE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','332','Phải trả cổ tức, lợi nhuận',1,'NO_PHAI_TRA','DU_CO',TRUE,TRUE,FALSE,FALSE,FALSE,'TT99'),  -- MỚI
 ('tenant-vcomm-prod-01','333','Thuế và các khoản phải nộp Nhà nước',1,'NO_PHAI_TRA','DU_CO',FALSE,FALSE,FALSE,FALSE,TRUE,'TT99'),
 ('tenant-vcomm-prod-01','3331','Thuế giá trị gia tăng phải nộp',2,'NO_PHAI_TRA','DU_CO',TRUE,FALSE,FALSE,FALSE,TRUE,'TT99'),
 ('tenant-vcomm-prod-01','3334','Thuế thu nhập doanh nghiệp',2,'NO_PHAI_TRA','DU_CO',TRUE,FALSE,FALSE,FALSE,TRUE,'TT99'),
 ('tenant-vcomm-prod-01','3335','Thuế thu nhập cá nhân',2,'NO_PHAI_TRA','DU_CO',TRUE,FALSE,FALSE,FALSE,TRUE,'TT99'),
 ('tenant-vcomm-prod-01','334','Phải trả người lao động',1,'NO_PHAI_TRA','DU_CO',TRUE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','335','Chi phí phải trả',1,'NO_PHAI_TRA','DU_CO',TRUE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','336','Phải trả nội bộ',1,'NO_PHAI_TRA','DU_CO',FALSE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','337','Thanh toán theo tiến độ hợp đồng xây dựng',1,'NO_PHAI_TRA','DU_CO',TRUE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','338','Phải trả, phải nộp khác',1,'NO_PHAI_TRA','LUONG_TINH',FALSE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','3383','Bảo hiểm xã hội',2,'NO_PHAI_TRA','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','3387','Doanh thu chờ phân bổ',2,'NO_PHAI_TRA','DU_CO',TRUE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','3388','Phải trả, phải nộp khác',2,'NO_PHAI_TRA','LUONG_TINH',TRUE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','341','Vay và nợ thuê tài chính',1,'NO_PHAI_TRA','DU_CO',FALSE,TRUE,FALSE,TRUE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','3411','Các khoản đi vay',2,'NO_PHAI_TRA','DU_CO',TRUE,TRUE,FALSE,TRUE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','343','Trái phiếu phát hành',1,'NO_PHAI_TRA','DU_CO',FALSE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','344','Nhận ký quỹ, ký cược',1,'NO_PHAI_TRA','DU_CO',TRUE,TRUE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','347','Thuế thu nhập hoãn lại phải trả',1,'NO_PHAI_TRA','DU_CO',TRUE,FALSE,FALSE,FALSE,TRUE,'TT99'),
 ('tenant-vcomm-prod-01','352','Dự phòng phải trả',1,'NO_PHAI_TRA','DU_CO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','3521','Dự phòng bảo hành sản phẩm, hàng hóa',2,'NO_PHAI_TRA','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','353','Quỹ khen thưởng, phúc lợi',1,'NO_PHAI_TRA','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','356','Quỹ phát triển khoa học và công nghệ',1,'NO_PHAI_TRA','DU_CO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','357','Quỹ bình ổn giá',1,'NO_PHAI_TRA','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),          -- MỚI
 -- Vốn chủ sở hữu
 ('tenant-vcomm-prod-01','411','Vốn đầu tư của chủ sở hữu',1,'VON','DU_CO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','4111','Vốn góp của chủ sở hữu',2,'VON','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','4112','Thặng dư vốn',2,'VON','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','4118','Vốn khác',2,'VON','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),                      -- đích chuyển đổi 441/461/466
 ('tenant-vcomm-prod-01','412','Chênh lệch đánh giá lại tài sản',1,'VON','LUONG_TINH',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','413','Chênh lệch tỷ giá hối đoái',1,'VON','LUONG_TINH',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','414','Quỹ đầu tư phát triển',1,'VON','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','418','Các quỹ khác thuộc vốn chủ sở hữu',1,'VON','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','419','Cổ phiếu mua lại của chính mình',1,'VON','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','421','Lợi nhuận sau thuế chưa phân phối',1,'VON','LUONG_TINH',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','4211','Lợi nhuận sau thuế chưa phân phối lũy kế đến cuối năm trước',2,'VON','LUONG_TINH',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','4212','Lợi nhuận sau thuế chưa phân phối năm nay',2,'VON','LUONG_TINH',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 -- Doanh thu
 ('tenant-vcomm-prod-01','511','Doanh thu bán hàng và cung cấp dịch vụ',1,'DOANH_THU','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','515','Doanh thu hoạt động tài chính',1,'DOANH_THU','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','521','Các khoản giảm trừ doanh thu',1,'DOANH_THU','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','711','Thu nhập khác',1,'DOANH_THU','DU_CO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 -- Chi phí sản xuất, kinh doanh (TT99: KHÔNG có 611, 631)
 ('tenant-vcomm-prod-01','621','Chi phí nguyên liệu, vật liệu trực tiếp',1,'CHI_PHI','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','622','Chi phí nhân công trực tiếp',1,'CHI_PHI','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','623','Chi phí sử dụng máy thi công',1,'CHI_PHI','DU_NO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','627','Chi phí sản xuất chung',1,'CHI_PHI','DU_NO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','632','Giá vốn hàng bán',1,'CHI_PHI','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','635','Chi phí tài chính',1,'CHI_PHI','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','641','Chi phí bán hàng',1,'CHI_PHI','DU_NO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','642','Chi phí quản lý doanh nghiệp',1,'CHI_PHI','DU_NO',FALSE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','6421','Chi phí nhân viên quản lý',2,'CHI_PHI','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','6422','Chi phí vật liệu quản lý',2,'CHI_PHI','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','6427','Chi phí dịch vụ mua ngoài',2,'CHI_PHI','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 -- Chi phí khác & xác định kết quả
 ('tenant-vcomm-prod-01','811','Chi phí khác',1,'CHI_PHI','DU_NO',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99'),
 ('tenant-vcomm-prod-01','821','Chi phí thuế thu nhập doanh nghiệp',1,'CHI_PHI','DU_NO',FALSE,FALSE,FALSE,FALSE,TRUE,'TT99'),
 ('tenant-vcomm-prod-01','8211','Chi phí thuế TNDN hiện hành',2,'CHI_PHI','DU_NO',TRUE,FALSE,FALSE,FALSE,TRUE,'TT99'),
 ('tenant-vcomm-prod-01','8212','Chi phí thuế TNDN hoãn lại',2,'CHI_PHI','DU_NO',TRUE,FALSE,FALSE,FALSE,TRUE,'TT99'),
 ('tenant-vcomm-prod-01','911','Xác định kết quả kinh doanh',1,'CHI_PHI','LUONG_TINH',TRUE,FALSE,FALSE,FALSE,FALSE,'TT99');

-- -----------------------------------------------------------------------------
-- Tài khoản TT200 ĐÃ NGỪNG SỬ DỤNG (chỉ đánh dấu, KHÔNG xóa — Điều 28.1.b)
-- Chạy khối này nếu nâng cấp từ hệ thống đang dùng TT200.
-- -----------------------------------------------------------------------------
UPDATE dm_tai_khoan
   SET ngung_su_dung = TRUE, ngay_ngung = DATE '2025-12-31', tt_ap_dung = 'TT200'
 WHERE ma_tk IN ('161','417','441','461','466','611','631','1385','3385',
                 '1111','1112','1113','1121','1122','1123','1131','1132',
                 '1211','1212','1218','1541','1542','1543','1544',
                 '1561','1562','1567')
   AND ngung_su_dung = FALSE;

-- -----------------------------------------------------------------------------
-- Dựng lại quan hệ cha–con (tk_me_id) cho TOÀN BỘ cây.
-- TT99 KHÔNG hard-code độ sâu: cha = TK có mã dài nhất vẫn là tiền tố của mã con.
-- -----------------------------------------------------------------------------
UPDATE dm_tai_khoan SET tk_me_id = NULL;

UPDATE dm_tai_khoan c
   SET tk_me_id = p.id
  FROM dm_tai_khoan p
 WHERE p.tenant_id = c.tenant_id
   AND c.ma_tk <> p.ma_tk
   AND c.ma_tk LIKE p.ma_tk || '_%'
   AND LENGTH(p.ma_tk) = (SELECT MAX(LENGTH(x.ma_tk))
                            FROM dm_tai_khoan x
                           WHERE x.tenant_id = c.tenant_id
                             AND x.ma_tk <> c.ma_tk
                             AND c.ma_tk LIKE x.ma_tk || '_%');

-- =============================================================================
-- 7. VÍ DỤ DỮ LIỆU MẪU — CHỨNG TỪ TRONG ẢNH GIAO DIỆN
-- =============================================================================

INSERT INTO dm_doi_tuong (tenant_id, ma_dt, ten_dt, loai_dt, ma_so_thue, dia_chi, tk_cong_no, dieu_khoan_thanh_toan)
VALUES ('tenant-vcomm-prod-01', 'NCC001', 'Công ty TNHH Thiên Phú', 'NHA_CUNG_CAP', '0401234567', '123 Nguyễn Văn Linh, Đà Nẵng', '331', 15);

-- Chứng từ PC000125: thanh toán 80.000.000 + thuế 8.000.000 = 88.000.000
-- Lưu ý TT99: TK tiền gửi là '112' (KHÔNG còn '1121'); TK thuế GTGT đầu vào là '1331'.
INSERT INTO ct_chung_tu
 (tenant_id, loai_ct, so_ct, ngay_ct, ngay_hach_toan, ky_ke_toan_id, doi_tuong_id,
  ten_doi_tuong_snapshot, dia_chi_snapshot, dien_giai, so_hoa_don, ngay_hoa_don,
  mau_so_hd, ky_hieu_hd, han_thanh_toan, tien_te, ty_gia,
  tong_tien_hang, tong_tien_thue, tong_cong, trang_thai, thong_tu_ap_dung)
VALUES
 ('tenant-vcomm-prod-01', 'CHI', 'PC000125', '2025-12-22', '2025-12-22', 1, 1,
  'Công ty TNHH Thiên Phú', '123 Nguyễn Văn Linh, Đà Nẵng',
  'Thanh toán tiền hàng theo hóa đơn số 000125', '000125', '2025-12-15',
  '01GTKT0/001', 'AA/25E', '2025-12-30', 'VND', 1,
  80000000, 8000000, 88000000, 'CHUA_GHI_SO', 'TT200');

INSERT INTO ct_hach_toan
 (chung_tu_id, stt, tk_no, tk_co, so_tien, doi_tuong_id, thanh_tien, thue_suat, tien_thue, dien_giai)
VALUES
 ('tenant-vcomm-prod-01', 1, '331',  '112', 80000000, 1, 80000000, 0,  0, 'Thanh toán tiền hàng'),
 ('tenant-vcomm-prod-01', 2, '1331', '112',  8000000, 1,  8000000, 10, 0, 'Thuế GTGT hóa đơn 000125');

-- -----------------------------------------------------------------------------
-- Chứng từ CHUYỂN ĐỔI SỐ DƯ theo Điều 29 TT99/2025/TT-BTC (loại 'CD')
-- Ví dụ CĐ-4: kết chuyển 441 + 466 → 4118 Vốn khác
-- Bắt buộc sinh CHỨNG TỪ (không UPDATE thẳng số dư) — yêu cầu Điều 28.1.b.
-- -----------------------------------------------------------------------------
INSERT INTO ct_chung_tu
 (tenant_id, loai_ct, so_ct, ngay_ct, ngay_hach_toan, ky_ke_toan_id,
  dien_giai, tien_te, ty_gia, tong_tien_hang, tong_tien_thue, tong_cong,
  trang_thai, thong_tu_ap_dung)
VALUES
 ('tenant-vcomm-prod-01', 'CD', 'CD2026-0001', '2026-01-01', '2026-01-01', 2,
  'Chuyển đổi số dư theo Điều 29 TT99/2025/TT-BTC — CĐ-4: 441 + 466 → 4118 Vốn khác',
  'VND', 1, 500000000, 0, 500000000, 'CHUA_GHI_SO', 'TT99');

INSERT INTO ct_hach_toan
 (chung_tu_id, stt, tk_no, tk_co, so_tien, thanh_tien, thue_suat, tien_thue, dien_giai, tk_co_tt200)
VALUES
 (2, 1, '441', '4118', 300000000, 300000000, 0, 0, 'Kết chuyển 441 Nguồn vốn ĐT XDCB → 4118 Vốn khác', '441'),
 (2, 2, '466', '4118', 200000000, 200000000, 0, 0, 'Kết chuyển 466 Nguồn kinh phí đã hình thành TSCĐ → 4118 Vốn khác', '466');

INSERT INTO sys_sequence (tenant_id, loai_ct, nam, ky, gia_tri_hien_tai) VALUES
 ('tenant-vcomm-prod-01', 'CHI', 2025, 0, 125),
 ('tenant-vcomm-prod-01', 'THU', 2025, 0, 0),
 ('tenant-vcomm-prod-01', 'NK',  2025, 0, 0),
 ('tenant-vcomm-prod-01', 'XK',  2025, 0, 0),
 ('tenant-vcomm-prod-01', 'CD',  2026, 0, 1);

-- =============================================================================
-- 8. ROW LEVEL SECURITY — PHÂN VÙNG THEO tenant_id
-- =============================================================================
-- Quyết định Q3: chỉ có MỘT pháp nhân kế toán, nên mọi dòng đều mang
-- tenant_id = 'tenant-vcomm-prod-01'. Với giá trị cố định này, RLS là một
-- lưới an toàn vô hiệu về mặt logic, NHƯNG vẫn được bật để đồng nhất với
-- phần còn lại của schema VComm (mọi bảng đều có RLS + policy tenant).
-- Nếu sau này tách thành nhiều pháp nhân, chỉ cần đổi policy, không phải sửa bảng.
-- =============================================================================

ALTER TABLE dm_cong_ty ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_ky_ke_toan ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_tai_khoan ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_doi_tuong ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_hang_hoa ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_kho ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_thue_suat ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_khoan_muc_chi_phi ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_bo_phan ENABLE ROW LEVEL SECURITY;
ALTER TABLE ct_chung_tu ENABLE ROW LEVEL SECURITY;
ALTER TABLE ht_nguoi_dung ENABLE ROW LEVEL SECURITY;
ALTER TABLE ht_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ht_cau_hinh ENABLE ROW LEVEL SECURITY;
ALTER TABLE ht_sao_luu ENABLE ROW LEVEL SECURITY;
ALTER TABLE sys_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_goi_y_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE so_du_tai_khoan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dm_cong_ty_tenant_isolation ON dm_cong_ty;
CREATE POLICY dm_cong_ty_tenant_isolation ON dm_cong_ty
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS dm_ky_ke_toan_tenant_isolation ON dm_ky_ke_toan;
CREATE POLICY dm_ky_ke_toan_tenant_isolation ON dm_ky_ke_toan
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS dm_tai_khoan_tenant_isolation ON dm_tai_khoan;
CREATE POLICY dm_tai_khoan_tenant_isolation ON dm_tai_khoan
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS dm_doi_tuong_tenant_isolation ON dm_doi_tuong;
CREATE POLICY dm_doi_tuong_tenant_isolation ON dm_doi_tuong
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS dm_hang_hoa_tenant_isolation ON dm_hang_hoa;
CREATE POLICY dm_hang_hoa_tenant_isolation ON dm_hang_hoa
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS dm_kho_tenant_isolation ON dm_kho;
CREATE POLICY dm_kho_tenant_isolation ON dm_kho
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS dm_thue_suat_tenant_isolation ON dm_thue_suat;
CREATE POLICY dm_thue_suat_tenant_isolation ON dm_thue_suat
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS dm_khoan_muc_chi_phi_tenant_isolation ON dm_khoan_muc_chi_phi;
CREATE POLICY dm_khoan_muc_chi_phi_tenant_isolation ON dm_khoan_muc_chi_phi
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS dm_bo_phan_tenant_isolation ON dm_bo_phan;
CREATE POLICY dm_bo_phan_tenant_isolation ON dm_bo_phan
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS ct_chung_tu_tenant_isolation ON ct_chung_tu;
CREATE POLICY ct_chung_tu_tenant_isolation ON ct_chung_tu
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS ht_audit_log_tenant_isolation ON ht_audit_log;
CREATE POLICY ht_audit_log_tenant_isolation ON ht_audit_log
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS ht_cau_hinh_tenant_isolation ON ht_cau_hinh;
CREATE POLICY ht_cau_hinh_tenant_isolation ON ht_cau_hinh
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS ht_sao_luu_tenant_isolation ON ht_sao_luu;
CREATE POLICY ht_sao_luu_tenant_isolation ON ht_sao_luu
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS sys_sequence_tenant_isolation ON sys_sequence;
CREATE POLICY sys_sequence_tenant_isolation ON sys_sequence
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS ai_goi_y_log_tenant_isolation ON ai_goi_y_log;
CREATE POLICY ai_goi_y_log_tenant_isolation ON ai_goi_y_log
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS so_du_tai_khoan_tenant_isolation ON so_du_tai_khoan;
CREATE POLICY so_du_tai_khoan_tenant_isolation ON so_du_tai_khoan
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

-- Bảng danh mục dùng chung toàn hệ (không phân vùng theo tenant):
--   dm_tien_te, ht_nguoi_dung, ht_vai_tro, ht_quyen,
--   ht_vai_tro_quyen, ht_nguoi_dung_vai_tro
