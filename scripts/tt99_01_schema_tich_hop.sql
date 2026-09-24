-- =============================================================================
-- BỔ SUNG SCHEMA CHO VIỆC TÍCH HỢP KẾ TOÁN VÀO ERP HIỆN HỮU
-- Chạy SAU 03_schema.sql (hoặc sau khi đã có các bảng ct_*, dm_tai_khoan).
-- Nguyên tắc: chỉ THÊM bảng/cột. Không sửa, không đổi kiểu cột đã có.
--
-- ⚠️ ĐÃ ÁP DỤNG QUYẾT ĐỊNH KIẾN TRÚC (chốt 21/09/2026) — chi tiết: 11_CAU_HINH_STACK_VCOMM_ERP.md §5
--   Q1. TÊN BẢNG TIẾNG VIỆT (map_*, cfg_*, int_*, ky_*, so_*) — giữ nguyên.
--   Q2. MISA AMIS chỉ PHÁT HÀNH HÓA ĐƠN ĐIỆN TỬ. Sổ nội bộ là nguồn chân lý.
--       ⇒ Các quy tắc hạch toán trong §9 sinh bút toán trực tiếp vào ct_chung_tu,
--         KHÔNG đẩy sang MISA. Đăng ký MISA ở bảng int_connector (§12.1) với loai
--         = 'HOA_DON_DIEN_TU'. Xem 11 §9.
--   Q3. MỘT PHÁP NHÂN KẾ TOÁN: mọi bảng mới mang tenant_id TEXT
--       DEFAULT 'tenant-vcomm-prod-01'; KHÔNG dùng company_id BIGINT.
--       RLS bật trên 9/11 bảng mới — xem §13 (2 bảng cố ý không phân vùng).
--
-- ⚠️ CẬP NHẬT TT99/2025/TT-BTC (hiệu lực 01/01/2026):
--    - Seed quy tắc hạch toán ở mục 9 đã chuyển sang mã TK TT99
--      (33311→3331, 1121→112, 214→2141, 642→6421/6427, 421→4212).
--    - Bổ sung 4 quy tắc mới: SALE_PROGRESS (337), DIVIDEND_PAY (332),
--      ASSET_UPGRADE (2414), CIT_CURRENT (8211).
--    - Bổ sung IR-15: từ chối lưu quy tắc tham chiếu TK đã ngừng sử dụng.
--    - Bổ sung bảng int_connector (Điều 28.1.đ: sẵn sàng kết nối HĐĐT/ký số).
--    - Xem 06_CAP_NHAT_TT99_2025.md §10 và 09_AI_PROMPTS_CAP_NHAT_TT99.md (U2, U6).
-- =============================================================================

SET search_path TO acc, public;

-- =============================================================================
-- 1. CỘT TRUY VẾT NGUỒN CHỨNG TỪ (bổ sung vào ct_chung_tu)
-- =============================================================================

ALTER TABLE ct_chung_tu ADD COLUMN IF NOT EXISTS source_system     VARCHAR(30) NOT NULL DEFAULT 'MANUAL';
ALTER TABLE ct_chung_tu ADD COLUMN IF NOT EXISTS source_doc_type   VARCHAR(50);
ALTER TABLE ct_chung_tu ADD COLUMN IF NOT EXISTS source_doc_id     BIGINT;
ALTER TABLE ct_chung_tu ADD COLUMN IF NOT EXISTS source_doc_no     VARCHAR(50);
ALTER TABLE ct_chung_tu ADD COLUMN IF NOT EXISTS source_version    INT;
ALTER TABLE ct_chung_tu ADD COLUMN IF NOT EXISTS source_module     VARCHAR(30);  -- SALES|PURCHASING|INVENTORY|HR|ASSETS|TREASURY
ALTER TABLE ct_chung_tu ADD COLUMN IF NOT EXISTS auto_posted       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ct_chung_tu ADD COLUMN IF NOT EXISTS posting_rule_id   BIGINT;
ALTER TABLE ct_chung_tu ADD COLUMN IF NOT EXISTS reversal_of_id    BIGINT REFERENCES ct_chung_tu(id);
ALTER TABLE ct_chung_tu ADD COLUMN IF NOT EXISTS reversal_reason   VARCHAR(255);
ALTER TABLE ct_chung_tu ADD COLUMN IF NOT EXISTS external_ref      VARCHAR(100);
ALTER TABLE ct_chung_tu ADD COLUMN IF NOT EXISTS integration_status VARCHAR(20); -- SYNCED|PENDING|FAILED|REVERSED

-- Chốt chặn idempotency ở tầng DB: cùng một phiên bản chứng từ nguồn chỉ sinh 1 bút toán.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ct_source
    ON ct_chung_tu (tenant_id, source_system, source_doc_type, source_doc_id, source_version)
    WHERE source_doc_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_ct_source_lookup
    ON ct_chung_tu (source_system, source_doc_type, source_doc_id)
    WHERE source_doc_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_ct_auto_posted
    ON ct_chung_tu (tenant_id, auto_posted, integration_status);

COMMENT ON COLUMN ct_chung_tu.source_system IS 'MANUAL = nhập tay; ngược lại là mã hệ thống nguồn, ví dụ ERP_SALES';
COMMENT ON COLUMN ct_chung_tu.auto_posted   IS 'TRUE = bút toán do hệ thống sinh, cấm sửa/xóa qua API (IR-07)';

-- =============================================================================
-- 2. ÁNH XẠ DANH MỤC ERP ↔ KẾ TOÁN
--    Chỉ dùng khi khóa chính/kiểu khóa giữa hai bên khác nhau.
--    Nếu dùng chung được bảng danh mục ERP thì KHÔNG cần bảng này.
-- =============================================================================

CREATE TABLE IF NOT EXISTS map_danh_muc (
    id             BIGSERIAL PRIMARY KEY,
    tenant_id     TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    loai_danh_muc  VARCHAR(30) NOT NULL,   -- DOI_TUONG|HANG_HOA|KHO|NHAN_VIEN|THUE_SUAT|TIEN_TE|KHOAN_MUC_CP|BO_PHAN
    id_erp         BIGINT NOT NULL,
    ma_erp         VARCHAR(50),
    id_ke_toan     BIGINT,
    ma_ke_toan     VARCHAR(50),
    dong_bo_luc    TIMESTAMPTZ,
    trang_thai     VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ghi_chu        VARCHAR(500),
    CONSTRAINT uq_map UNIQUE (tenant_id, loai_danh_muc, id_erp)
);
CREATE INDEX IF NOT EXISTS ix_map_kt ON map_danh_muc (tenant_id, loai_danh_muc, id_ke_toan);

-- Cấu hình kế toán mặc định gắn vào danh mục ERP (nếu chưa có cột tương ứng).
-- Ví dụ: thêm cột TK công nợ mặc định cho bảng khách hàng/nhà cung cấp của ERP.
-- ĐIỀU CHỈNH TÊN BẢNG THEO ERP THỰC TẾ trước khi chạy:
--   ALTER TABLE erp_khach_hang   ADD COLUMN IF NOT EXISTS tk_cong_no      VARCHAR(20);
--   ALTER TABLE erp_nha_cung_cap ADD COLUMN IF NOT EXISTS tk_cong_no      VARCHAR(20);
--   ALTER TABLE erp_hang_hoa     ADD COLUMN IF NOT EXISTS tk_kho          VARCHAR(20);
--   ALTER TABLE erp_hang_hoa     ADD COLUMN IF NOT EXISTS tk_doanh_thu    VARCHAR(20);
--   ALTER TABLE erp_hang_hoa     ADD COLUMN IF NOT EXISTS tk_gia_von      VARCHAR(20);
--   ALTER TABLE erp_hang_hoa     ADD COLUMN IF NOT EXISTS thue_suat_id    BIGINT;
--   ALTER TABLE erp_hang_hoa     ADD COLUMN IF NOT EXISTS phuong_phap_gia VARCHAR(20) DEFAULT 'BQGQ';
--   ALTER TABLE erp_khoan_muc_cp ADD COLUMN IF NOT EXISTS tk_chi_phi      VARCHAR(20);

-- =============================================================================
-- 3. BỘ MÁY QUY TẮC HẠCH TOÁN  ⭐ trái tim của tích hợp
-- =============================================================================

CREATE TABLE IF NOT EXISTS cfg_quy_tac_hach_toan (
    id                BIGSERIAL PRIMARY KEY,
    tenant_id        TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ma_quy_tac        VARCHAR(50) NOT NULL,
    ten_quy_tac       VARCHAR(255) NOT NULL,
    su_kien           VARCHAR(60) NOT NULL,   -- SALE_INVOICE, PURCHASE_INVOICE, GOODS_ISSUE, PAYROLL, DEPRECIATION...
    mo_ta             VARCHAR(500),
    dieu_kien_json    JSONB,                  -- điều kiện áp dụng: loại đối tượng, nhóm hàng, thuế suất, chi nhánh...
    dong_but_toan_json JSONB NOT NULL,        -- danh sách dòng bút toán
    uu_tien           INT NOT NULL DEFAULT 100,   -- số nhỏ = ưu tiên cao
    hieu_luc_tu       DATE,
    hieu_luc_den      DATE,
    phien_ban         INT NOT NULL DEFAULT 1,
    trang_thai        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        BIGINT,
    updated_at        TIMESTAMPTZ,
    updated_by        BIGINT,
    CONSTRAINT uq_qt UNIQUE (tenant_id, ma_quy_tac, phien_ban)
);
CREATE INDEX IF NOT EXISTS ix_qt_sukien ON cfg_quy_tac_hach_toan (tenant_id, su_kien, trang_thai, uu_tien);

COMMENT ON COLUMN cfg_quy_tac_hach_toan.dong_but_toan_json IS
'Ví dụ:
[
  {"tk_no":"131","tk_co":"511","so_tien":"thanh_tien_truoc_thue","doi_tuong":"SOURCE","dien_giai":"Doanh thu bán hàng"},
  {"tk_no":"131","tk_co":"3331","so_tien":"tien_thue","tk_thue":"3331","dien_giai":"Thuế GTGT đầu ra"}
]
Biến được phép trong so_tien: thanh_tien_truoc_thue, tien_thue, tong_cong, so_luong, don_gia,
gia_von, tien_luong, tien_bhxh, tien_khau_hao, chenh_lech_ty_gia, chiet_khau.
Biểu thức số học an toàn (cộng trừ nhân chia, làm tròn) — KHÔNG thực thi mã tùy ý.
LƯU Ý TT99: dùng mã TK theo Phụ lục II TT99/2025 (3331, không phải 33311).';

-- Log quy tắc nào đã áp dụng cho từng bút toán (phục vụ truy vết & kiểm toán)
CREATE TABLE IF NOT EXISTS cfg_quy_tac_ap_dung (
    id             BIGSERIAL PRIMARY KEY,
    chung_tu_id    BIGINT NOT NULL REFERENCES ct_chung_tu(id) ON DELETE CASCADE,
    quy_tac_id     BIGINT NOT NULL REFERENCES cfg_quy_tac_hach_toan(id),
    phien_ban      INT NOT NULL,
    du_lieu_vao    JSONB,
    ap_dung_luc    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_qta_ct ON cfg_quy_tac_ap_dung (chung_tu_id);

-- =============================================================================
-- 4. TÍCH HỢP: OUTBOX / INBOX / DEAD-LETTER
-- =============================================================================

-- 4.1 Outbox — ghi CÙNG transaction với cập nhật chứng từ nguồn (IR-09)
CREATE TABLE IF NOT EXISTS int_outbox (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id      TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    aggregate_type  VARCHAR(50) NOT NULL,   -- SALE_INVOICE, PURCHASE_INVOICE, STOCK_ISSUE...
    aggregate_id    BIGINT NOT NULL,
    event_type      VARCHAR(60) NOT NULL,
    payload         JSONB NOT NULL,
    trang_thai      VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING|SENT|FAILED
    so_lan_thu      INT NOT NULL DEFAULT 0,
    loi_cuoi        VARCHAR(1000),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_outbox_pending ON int_outbox (trang_thai, created_at) WHERE trang_thai = 'PENDING';
CREATE INDEX IF NOT EXISTS ix_outbox_agg     ON int_outbox (aggregate_type, aggregate_id);

-- 4.2 Inbox — chống xử lý trùng (IR-02)
CREATE TABLE IF NOT EXISTS int_inbox_log (
    id            BIGSERIAL PRIMARY KEY,
    source_system VARCHAR(30) NOT NULL,
    message_id    VARCHAR(100) NOT NULL,
    event_type    VARCHAR(60) NOT NULL,
    payload       JSONB,
    trang_thai    VARCHAR(20) NOT NULL DEFAULT 'RECEIVED', -- RECEIVED|PROCESSED|SKIPPED|FAILED
    ket_qua       VARCHAR(1000),
    chung_tu_id   BIGINT REFERENCES ct_chung_tu(id),
    received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at  TIMESTAMPTZ,
    CONSTRAINT uq_inbox UNIQUE (source_system, message_id)
);
CREATE INDEX IF NOT EXISTS ix_inbox_trangthai ON int_inbox_log (trang_thai, received_at);

-- 4.3 Dead-letter — sự kiện lỗi quá ngưỡng retry (IR-10)
CREATE TABLE IF NOT EXISTS int_dead_letter (
    id             BIGSERIAL PRIMARY KEY,
    tenant_id     TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    outbox_id      BIGINT REFERENCES int_outbox(id),
    source_system  VARCHAR(30),
    event_type     VARCHAR(60) NOT NULL,
    payload        JSONB NOT NULL,
    loi            VARCHAR(2000) NOT NULL,
    so_lan_thu     INT NOT NULL DEFAULT 0,
    trang_thai     VARCHAR(20) NOT NULL DEFAULT 'CHO_XU_LY', -- CHO_XU_LY|DA_XU_LY|BO_QUA
    nguoi_xu_ly    BIGINT,
    xu_ly_luc      TIMESTAMPTZ,
    ghi_chu        VARCHAR(1000),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_dl_trangthai ON int_dead_letter (trang_thai, created_at DESC);

-- =============================================================================
-- 5. KHÓA SỔ XUYÊN MODULE (IR-05)
--    Module nguồn phải gọi kiểm tra bảng này trước khi ghi nhận chứng từ.
-- =============================================================================

CREATE TABLE IF NOT EXISTS ky_khoa_module (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id  TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ky_id       BIGINT NOT NULL REFERENCES dm_ky_ke_toan(id),
    module      VARCHAR(30) NOT NULL,   -- SALES|PURCHASING|INVENTORY|HR|ASSETS|TREASURY|ACCOUNTING
    trang_thai  VARCHAR(20) NOT NULL DEFAULT 'MO',  -- MO|KHOA
    ngay_khoa   TIMESTAMPTZ,
    nguoi_khoa  BIGINT,
    ly_do       VARCHAR(500),
    CONSTRAINT uq_khoa_module UNIQUE (tenant_id, ky_id, module)
);
CREATE INDEX IF NOT EXISTS ix_khoa_module ON ky_khoa_module (tenant_id, ky_id, module, trang_thai);

-- Hàm tiện ích cho các module khác gọi kiểm tra nhanh
CREATE OR REPLACE FUNCTION fn_ky_dang_mo(p_tenant_id TEXT, p_ngay DATE, p_module VARCHAR(30))
RETURNS BOOLEAN AS $$
DECLARE v_ky_id BIGINT; v_trang_thai VARCHAR(20);
BEGIN
    SELECT id, trang_thai INTO v_ky_id, v_trang_thai
    FROM dm_ky_ke_toan
    WHERE tenant_id = p_tenant_id AND p_ngay BETWEEN tu_ngay AND den_ngay
    LIMIT 1;

    IF v_ky_id IS NULL OR v_trang_thai = 'DA_KHOA' THEN
        RETURN FALSE;
    END IF;

    SELECT trang_thai INTO v_trang_thai
    FROM ky_khoa_module
    WHERE tenant_id = p_tenant_id AND ky_id = v_ky_id AND module = p_module;

    RETURN COALESCE(v_trang_thai, 'MO') = 'MO';
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- 6. SỐ DƯ ĐẦU KỲ (IR-11)
-- =============================================================================

CREATE TABLE IF NOT EXISTS so_du_dau_ky (
    id            BIGSERIAL PRIMARY KEY,
    tenant_id    TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ky_id         BIGINT NOT NULL REFERENCES dm_ky_ke_toan(id),
    tk            VARCHAR(20) NOT NULL,
    doi_tuong_id  BIGINT,
    tien_te       VARCHAR(3) NOT NULL DEFAULT 'VND',
    du_no         DECIMAL(19,4) NOT NULL DEFAULT 0,
    du_co         DECIMAL(19,4) NOT NULL DEFAULT 0,
    du_no_nt      DECIMAL(19,4) NOT NULL DEFAULT 0,
    du_co_nt      DECIMAL(19,4) NOT NULL DEFAULT 0,
    nguon         VARCHAR(20) NOT NULL DEFAULT 'NHAP_TAY', -- NHAP_TAY|DI_CHUYEN
    trang_thai    VARCHAR(20) NOT NULL DEFAULT 'NHAP',     -- NHAP|DA_CHOT
    chung_tu_id   BIGINT REFERENCES ct_chung_tu(id),       -- bút toán kết chuyển số dư đầu kỳ
    ghi_chu       VARCHAR(500),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    BIGINT,
    updated_at    TIMESTAMPTZ,
    updated_by    BIGINT,
    CONSTRAINT uq_sddk UNIQUE (tenant_id, ky_id, tk, doi_tuong_id, tien_te),
    CONSTRAINT ck_sddk_du CHECK (du_no >= 0 AND du_co >= 0)
);
CREATE INDEX IF NOT EXISTS ix_sddk_ky ON so_du_dau_ky (tenant_id, ky_id, tk);

-- Chỉ cho phép một bản ghi số dư đầu kỳ trên mỗi (tk, đối tượng) khi đã chốt
CREATE UNIQUE INDEX IF NOT EXISTS uq_sddk_chot
    ON so_du_dau_ky (tenant_id, ky_id, tk, COALESCE(doi_tuong_id, 0), tien_te)
    WHERE trang_thai = 'DA_CHOT';

-- =============================================================================
-- 7. ĐỐI SOÁT ERP ↔ KẾ TOÁN (IR-12)
-- =============================================================================

CREATE TABLE IF NOT EXISTS int_doi_soat (
    id             BIGSERIAL PRIMARY KEY,
    tenant_id     TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ky_id          BIGINT NOT NULL REFERENCES dm_ky_ke_toan(id),
    module         VARCHAR(30) NOT NULL,
    chi_tieu       VARCHAR(100) NOT NULL,   -- DOANH_THU|CHI_PHI|THUE_GTGT|TON_KHO|CONG_NO|PS_NO|PS_CO
    so_lieu_erp    DECIMAL(19,4) NOT NULL DEFAULT 0,
    so_lieu_ke_toan DECIMAL(19,4) NOT NULL DEFAULT 0,
    chenh_lech     DECIMAL(19,4) GENERATED ALWAYS AS (so_lieu_erp - so_lieu_ke_toan) STORED,
    nguong_canh_bao DECIMAL(19,4),
    trang_thai     VARCHAR(20) NOT NULL DEFAULT 'CHO_XU_LY', -- KHOP|LECH|CHO_XU_LY|DA_GIAI_THICH
    giai_thich     VARCHAR(1000),
    nguoi_giai_thich BIGINT,
    chay_luc       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ds UNIQUE (tenant_id, ky_id, module, chi_tieu)
);
CREATE INDEX IF NOT EXISTS ix_ds_ky ON int_doi_soat (tenant_id, ky_id, trang_thai);

-- =============================================================================
-- 8. VIEW PHỤC VỤ TRUY VẾT HAI CHIỀU (IR-08)
-- =============================================================================

CREATE OR REPLACE VIEW v_truy_vet_nguon AS
SELECT
    c.id                AS chung_tu_ke_toan_id,
    c.so_ct             AS so_chung_tu_ke_toan,
    c.ngay_hach_toan,
    c.loai_ct,
    c.source_system,
    c.source_module,
    c.source_doc_type,
    c.source_doc_id,
    c.source_doc_no,
    c.source_version,
    c.auto_posted,
    c.posting_rule_id,
    q.ma_quy_tac,
    q.ten_quy_tac,
    c.reversal_of_id,
    c.reversal_reason,
    c.integration_status,
    c.trang_thai,
    c.tong_cong,
    c.tenant_id
FROM ct_chung_tu c
LEFT JOIN cfg_quy_tac_hach_toan q ON q.id = c.posting_rule_id
WHERE c.deleted_at IS NULL;

-- View chỉ hiển thị bút toán tự động (phục vụ rà soát của kế toán trưởng)
CREATE OR REPLACE VIEW v_but_toan_tu_dong AS
SELECT *
FROM v_truy_vet_nguon
WHERE auto_posted = TRUE;

-- =============================================================================
-- 9. SEED QUY TẮC HẠCH TOÁN MẶC ĐỊNH — ĐÃ CẬP NHẬT THEO TT99/2025/TT-BTC
--    (công ty_id = 1; điều chỉnh theo thực tế khi triển khai)
--
--    ⚠️ Thay đổi so với bản TT200:
--      - 33311 → 3331  (TT99 KHÔNG còn cấp 3)
--      - 1121  → 112   (TT99 bỏ cấp con của 112)
--      - 214   → 2141  (TT99: 214 là TK cha, 2141/2142/2143/2147 là lá)
--      - 642   → 6421/6427 (TT99: 642 là TK cha, 6421..6428 là lá)
--      - 421   → 4212  (TT99: 421 là TK cha, 4211/4212 là lá; kết chuyển vào 4212)
--      - 242   : giữ nguyên mã, tên mới "Chi phí chờ phân bổ"
--      - 642   : giữ nguyên mã, tên mới "Chi phí quản lý doanh nghiệp"
--      - KHÔNG có 611, 631
--    Quy tắc mới bổ sung: SALE_PROGRESS (337), DIVIDEND_PAY (332),
--      ASSET_UPGRADE (2414), CIT_CURRENT (8211).
-- =============================================================================

INSERT INTO cfg_quy_tac_hach_toan
 (tenant_id, ma_quy_tac, ten_quy_tac, su_kien, dieu_kien_json, dong_but_toan_json, uu_tien)
VALUES
('tenant-vcomm-prod-01', 'SALE_INVOICE_CREDIT', 'Hóa đơn bán hàng ghi nợ', 'SALE_INVOICE',
 '{"phuong_thuc_thanh_toan":"GHI_NO"}',
 '[{"tk_no":"131","tk_co":"511","so_tien":"thanh_tien_truoc_thue","doi_tuong":"SOURCE","dien_giai":"Doanh thu bán hàng"},
   {"tk_no":"131","tk_co":"3331","so_tien":"tien_thue","tk_thue":"3331","dien_giai":"Thuế GTGT đầu ra"}]', 10),

('tenant-vcomm-prod-01', 'SALE_INVOICE_CASH', 'Hóa đơn bán hàng thu tiền ngay', 'SALE_INVOICE',
 '{"phuong_thuc_thanh_toan":"TIEN_MAT"}',
 '[{"tk_no":"111","tk_co":"511","so_tien":"thanh_tien_truoc_thue","dien_giai":"Doanh thu bán hàng"},
   {"tk_no":"111","tk_co":"3331","so_tien":"tien_thue","tk_thue":"3331","dien_giai":"Thuế GTGT đầu ra"}]', 10),

('tenant-vcomm-prod-01', 'GOODS_ISSUE_COGS', 'Xuất kho bán hàng - giá vốn', 'GOODS_ISSUE',
 '{"muc_dich":"BAN_HANG"}',
 '[{"tk_no":"632","tk_co":"156","so_tien":"gia_von","hang_hoa":"SOURCE","kho":"SOURCE","dien_giai":"Giá vốn hàng bán"}]', 10),

('tenant-vcomm-prod-01', 'SALE_RETURN', 'Hàng bán bị trả lại', 'SALE_RETURN',
 '{}',
 '[{"tk_no":"521","tk_co":"131","so_tien":"thanh_tien_truoc_thue","doi_tuong":"SOURCE","dien_giai":"Hàng bán bị trả lại"},
   {"tk_no":"3331","tk_co":"131","so_tien":"tien_thue","tk_thue":"3331","dien_giai":"Giảm thuế GTGT đầu ra"}]', 10),

-- TT99 MỚI: doanh thu theo tiến độ hợp đồng xây dựng → TK 337
('tenant-vcomm-prod-01', 'SALE_PROGRESS', 'Doanh thu theo tiến độ hợp đồng xây dựng', 'SALE_PROGRESS',
 '{}',
 '[{"tk_no":"131","tk_co":"337","so_tien":"tong_cong","doi_tuong":"SOURCE","dien_giai":"Phải thu theo tiến độ HĐXD"}]', 10),

('tenant-vcomm-prod-01', 'PURCHASE_INVOICE_CREDIT', 'Hóa đơn mua hàng ghi nợ NCC', 'PURCHASE_INVOICE',
 '{"phuong_thuc_thanh_toan":"GHI_NO"}',
 '[{"tk_no":"156","tk_co":"331","so_tien":"thanh_tien_truoc_thue","doi_tuong":"SOURCE","hang_hoa":"SOURCE","kho":"SOURCE","dien_giai":"Mua hàng hóa"},
   {"tk_no":"1331","tk_co":"331","so_tien":"tien_thue","tk_thue":"1331","doi_tuong":"SOURCE","dien_giai":"Thuế GTGT đầu vào"}]', 10),

('tenant-vcomm-prod-01', 'PURCHASE_INVOICE_CASH', 'Hóa đơn mua hàng trả tiền ngay', 'PURCHASE_INVOICE',
 '{"phuong_thuc_thanh_toan":"TIEN_MAT"}',
 '[{"tk_no":"156","tk_co":"111","so_tien":"thanh_tien_truoc_thue","hang_hoa":"SOURCE","kho":"SOURCE","dien_giai":"Mua hàng hóa"},
   {"tk_no":"1331","tk_co":"111","so_tien":"tien_thue","tk_thue":"1331","dien_giai":"Thuế GTGT đầu vào"}]', 10),

('tenant-vcomm-prod-01', 'AR_RECEIPT', 'Phiếu thu tiền khách hàng', 'AR_RECEIPT',
 '{}',
 '[{"tk_no":"111","tk_co":"131","so_tien":"tong_cong","doi_tuong":"SOURCE","dien_giai":"Thu tiền khách hàng"}]', 10),

('tenant-vcomm-prod-01', 'AP_PAYMENT', 'Phiếu chi trả nhà cung cấp', 'AP_PAYMENT',
 '{}',
 '[{"tk_no":"331","tk_co":"112","so_tien":"tong_cong","doi_tuong":"SOURCE","dien_giai":"Trả tiền nhà cung cấp"}]', 10),

-- TT99 MỚI: chi trả cổ tức, lợi nhuận → TK 332 (thay vì 338)
('tenant-vcomm-prod-01', 'DIVIDEND_PAY', 'Chi trả cổ tức, lợi nhuận', 'DIVIDEND',
 '{}',
 '[{"tk_no":"4212","tk_co":"332","so_tien":"tong_cong","dien_giai":"Phải trả cổ tức, lợi nhuận"},
   {"tk_no":"332","tk_co":"112","so_tien":"tong_cong","dien_giai":"Chi trả cổ tức, lợi nhuận"}]', 10),

('tenant-vcomm-prod-01', 'PAYROLL_ACCRUAL', 'Chi phí lương', 'PAYROLL',
 '{}',
 '[{"tk_no":"6421","tk_co":"334","so_tien":"tien_luong","bo_phan":"SOURCE","dien_giai":"Chi phí tiền lương"}]', 10),

('tenant-vcomm-prod-01', 'PAYROLL_INSURANCE', 'Trích BHXH, BHYT, BHTN', 'PAYROLL',
 '{}',
 '[{"tk_no":"6421","tk_co":"3383","so_tien":"tien_bhxh","dien_giai":"Trích BHXH"}]', 20),

('tenant-vcomm-prod-01', 'PAYROLL_PAYMENT', 'Trả lương nhân viên', 'PAYROLL_PAYMENT',
 '{}',
 '[{"tk_no":"334","tk_co":"112","so_tien":"tong_cong","dien_giai":"Trả lương nhân viên"}]', 10),

('tenant-vcomm-prod-01', 'ASSET_DEPRECIATION', 'Khấu hao tài sản cố định', 'DEPRECIATION',
 '{}',
 '[{"tk_no":"6424","tk_co":"2141","so_tien":"tien_khau_hao","dien_giai":"Khấu hao TSCĐ"}]', 10),

-- TT99 MỚI: nâng cấp, cải tạo TSCĐ hoàn thành → kết chuyển 2414 vào TSCĐ
('tenant-vcomm-prod-01', 'ASSET_UPGRADE', 'Nâng cấp, cải tạo TSCĐ hoàn thành', 'ASSET_UPGRADE',
 '{}',
 '[{"tk_no":"211","tk_co":"2414","so_tien":"tong_cong","dien_giai":"Kết chuyển chi phí nâng cấp, cải tạo TSCĐ"}]', 10),

('tenant-vcomm-prod-01', 'PREPAID_ALLOCATION', 'Phân bổ chi phí chờ phân bổ', 'PREPAID_ALLOCATION',
 '{}',
 '[{"tk_no":"6427","tk_co":"242","so_tien":"tong_cong","dien_giai":"Phân bổ chi phí chờ phân bổ"}]', 10),

('tenant-vcomm-prod-01', 'FX_GAIN', 'Chênh lệch tỷ giá lãi', 'FX_REVALUATION',
 '{"ket_qua":"LAI"}',
 '[{"tk_no":"131","tk_co":"515","so_tien":"chenh_lech_ty_gia","dien_giai":"Lãi chênh lệch tỷ giá"}]', 10),

('tenant-vcomm-prod-01', 'FX_LOSS', 'Chênh lệch tỷ giá lỗ', 'FX_REVALUATION',
 '{"ket_qua":"LO"}',
 '[{"tk_no":"635","tk_co":"131","so_tien":"chenh_lech_ty_gia","dien_giai":"Lỗ chênh lệch tỷ giá"}]', 10),

-- TT99 MỚI: chi phí thuế TNDN hiện hành → TK 8211 (TT99 tách 821 thành 8211/8212)
('tenant-vcomm-prod-01', 'CIT_CURRENT', 'Chi phí thuế TNDN hiện hành', 'TAX_SETTLEMENT',
 '{}',
 '[{"tk_no":"8211","tk_co":"3334","so_tien":"tong_cong","dien_giai":"Chi phí thuế TNDN hiện hành"}]', 10),

('tenant-vcomm-prod-01', 'CLOSE_REVENUE', 'Kết chuyển doanh thu cuối kỳ', 'PERIOD_CLOSE',
 '{}',
 '[{"tk_no":"511","tk_co":"911","so_tien":"tong_cong","dien_giai":"Kết chuyển doanh thu"}]', 10),

('tenant-vcomm-prod-01', 'CLOSE_EXPENSE', 'Kết chuyển chi phí cuối kỳ', 'PERIOD_CLOSE',
 '{}',
 '[{"tk_no":"911","tk_co":"642","so_tien":"tong_cong","dien_giai":"Kết chuyển chi phí"}]', 20),

('tenant-vcomm-prod-01', 'CLOSE_RESULT_PROFIT', 'Xác định kết quả kinh doanh - lãi', 'PERIOD_CLOSE',
 '{"ket_qua":"LAI"}',
 '[{"tk_no":"911","tk_co":"4212","so_tien":"tong_cong","dien_giai":"Kết chuyển lãi vào LNST chưa phân phối năm nay"}]', 30);

-- =============================================================================
-- 10. VIEW GIÁM SÁT TÍCH HỢP (cho dashboard admin)
-- =============================================================================

CREATE OR REPLACE VIEW v_giam_sat_tich_hop AS
SELECT
    (SELECT COUNT(*) FROM int_outbox      WHERE trang_thai = 'PENDING')                  AS outbox_cho_xu_ly,
    (SELECT COUNT(*) FROM int_outbox      WHERE trang_thai = 'FAILED')                   AS outbox_loi,
    (SELECT COUNT(*) FROM int_dead_letter WHERE trang_thai = 'CHO_XU_LY')                AS dead_letter_cho_xu_ly,
    (SELECT COUNT(*) FROM ct_chung_tu     WHERE auto_posted = TRUE
        AND integration_status = 'FAILED' AND deleted_at IS NULL)                        AS but_toan_loi,
    (SELECT COUNT(*) FROM int_doi_soat    WHERE trang_thai = 'LECH')                     AS doi_soat_lech,
    (SELECT COUNT(*) FROM so_du_dau_ky    WHERE trang_thai = 'NHAP')                     AS so_du_chua_chot;

-- =============================================================================
-- 11. KIỂM TRA SỨC KHỎE TÍCH HỢP (job định kỳ)
-- =============================================================================

-- 11.1 Bút toán tự động thiếu thông tin truy vết (phải trả 0 dòng)
-- SELECT id, so_ct FROM ct_chung_tu
-- WHERE auto_posted = TRUE AND (source_doc_type IS NULL OR source_doc_id IS NULL);

-- 11.2 Chứng từ ERP đã phát hành nhưng chưa có bút toán (phải trả 0 dòng)
-- SELECT o.aggregate_id, o.event_type, o.created_at
-- FROM int_outbox o
-- LEFT JOIN ct_chung_tu c
--   ON c.source_doc_id = o.aggregate_id AND c.source_doc_type = o.aggregate_type
-- WHERE o.trang_thai = 'SENT' AND c.id IS NULL;

-- 11.3 Bút toán tự động nhưng chưa ghi sổ (cảnh báo)
-- SELECT id, so_ct, source_doc_no, created_at FROM ct_chung_tu
-- WHERE auto_posted = TRUE AND trang_thai = 'CHUA_GHI_SO' AND deleted_at IS NULL;

-- 11.4 Mất cân đối Nợ - Có (phải trả 0 dòng)
-- SELECT c.id, c.so_ct, SUM(h.so_tien) AS lech
-- FROM ct_chung_tu c JOIN ct_hach_toan h ON h.chung_tu_id = c.id
-- WHERE c.deleted_at IS NULL
-- GROUP BY c.id, c.so_ct HAVING SUM(h.so_tien) <> 0;

-- =============================================================================
-- 12. BỔ SUNG TT99/2025/TT-BTC — TUÂN THỦ ĐIỀU 28 & CHUYỂN ĐỔI SỐ DƯ
--     (chạy phần này khi nâng cấp từ TT200 lên TT99)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 12.1. int_connector — Điều 28.1.đ: sẵn sàng kết nối phần mềm liên quan
--       (hóa đơn điện tử, chữ ký số, ngân hàng, cơ quan thuế)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS int_connector (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id          TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    connector_code      VARCHAR(50) NOT NULL,
    loai                VARCHAR(30) NOT NULL,   -- HOA_DON_DIEN_TU | CHU_KY_SO | NGAN_HANG | THUE
    ten                 VARCHAR(255) NOT NULL,
    endpoint            VARCHAR(500),
    auth_config         JSONB,                  -- cấu hình xác thực (mã hóa ở tầng ứng dụng)
    trang_thai          VARCHAR(20) NOT NULL DEFAULT 'CHUA_KET_NOI',
                                                -- CHUA_KET_NOI | READY | DANG_HOAT_DONG | LOI
    bat_buoc            BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = bắt buộc để tuân thủ Điều 28
    lan_kiem_tra_cuoi   TIMESTAMPTZ,
    ghi_chu             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,
    CONSTRAINT uq_connector UNIQUE (tenant_id, connector_code)
);
CREATE INDEX IF NOT EXISTS ix_connector_trang_thai ON int_connector (tenant_id, trang_thai);

-- Stub đăng ký 2 connector bắt buộc theo Điều 28.1.đ (trạng thái READY = "sẵn sàng kết nối")
INSERT INTO int_connector (tenant_id, connector_code, loai, ten, trang_thai, bat_buoc, ghi_chu) VALUES
 ('tenant-vcomm-prod-01', 'HDDT_DEFAULT', 'HOA_DON_DIEN_TU', 'Kết nối phần mềm hóa đơn điện tử', 'READY', TRUE,
  'Điều 28.1.đ TT99 — cần cấu hình endpoint + auth_config trước khi dùng'),
 ('tenant-vcomm-prod-01', 'CKS_DEFAULT',  'CHU_KY_SO',       'Kết nối dịch vụ chữ ký số',       'READY', TRUE,
  'Điều 28.1.đ TT99 — dùng để ký số BCTC và chứng từ điện tử')
ON CONFLICT (tenant_id, connector_code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 12.2. ht_ky_checksum — Điều 28.1.c: phát hiện can thiệp dữ liệu đã ghi sổ
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ht_ky_checksum (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id      TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01',
    ky_ke_toan_id   BIGINT NOT NULL REFERENCES dm_ky_ke_toan(id),
    so_but_toan     BIGINT NOT NULL,
    tong_phat_sinh  DECIMAL(19,4) NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    ngay_khoa       TIMESTAMPTZ NOT NULL DEFAULT now(),
    nguoi_khoa      BIGINT,
    lan_kiem_tra    TIMESTAMPTZ,
    ket_qua_kiem_tra VARCHAR(20),   -- KHOP | LECH | CHUA_KIEM_TRA
    CONSTRAINT uq_ky_checksum UNIQUE (tenant_id, ky_ke_toan_id)
);

-- Hàm tính checksum một kỳ (dùng cho cả khóa sổ lẫn job kiểm tra định kỳ)
CREATE OR REPLACE FUNCTION fn_ky_checksum(p_tenant_id TEXT, p_ky_id BIGINT)
RETURNS VARCHAR AS $$
DECLARE v_hash VARCHAR(64);
BEGIN
    SELECT encode(digest(string_agg(
              c.so_ct || '|' || c.ngay_hach_toan::text || '|' || h.stt::text || '|'
              || h.tk_no || '|' || h.tk_co || '|' || h.so_tien::text,
              E'\n' ORDER BY c.ngay_hach_toan, c.id, h.stt), 'sha256'), 'hex')
      INTO v_hash
      FROM ct_chung_tu c
      JOIN ct_hach_toan h ON h.chung_tu_id = c.id
     WHERE c.tenant_id = p_tenant_id
       AND c.ky_ke_toan_id = p_ky_id
       AND c.deleted_at IS NULL
       AND c.trang_thai <> 'DA_HUY';
    RETURN COALESCE(v_hash, encode(digest('', 'sha256'), 'hex'));
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- 12.3. TRIGGER — Điều 28.1.c: NGĂN CHẶN can thiệp dữ liệu đã ghi sổ
--       Bảo vệ ở TẦNG DATABASE, không chỉ tầng ứng dụng.
--       Gỡ ghi sổ hợp lệ: SET LOCAL app.cho_phep_sua_so = 'on' (trong transaction).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_chan_sua_chung_tu_da_ghi_so()
RETURNS TRIGGER AS $$
DECLARE v_trang_thai VARCHAR(20);
BEGIN
    IF current_setting('app.cho_phep_sua_so', TRUE) = 'on' THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_TABLE_NAME = 'ct_chung_tu' THEN
        v_trang_thai := COALESCE(NEW.trang_thai, OLD.trang_thai);
    ELSE
        SELECT trang_thai INTO v_trang_thai
          FROM ct_chung_tu
         WHERE id = COALESCE(NEW.chung_tu_id, OLD.chung_tu_id);
    END IF;

    IF v_trang_thai IN ('DA_GHI_SO', 'DA_KHOA_SO') THEN
        RAISE EXCEPTION
          'TT99 Điều 28.1.c: không được % dữ liệu của chứng từ đã ghi sổ (%). Phải gỡ ghi sổ trước.',
          lower(TG_OP), COALESCE(NEW.so_ct, OLD.so_ct, '');
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chan_sua_ct_chung_tu ON ct_chung_tu;
CREATE TRIGGER trg_chan_sua_ct_chung_tu
    BEFORE UPDATE OR DELETE ON ct_chung_tu
    FOR EACH ROW EXECUTE FUNCTION fn_chan_sua_chung_tu_da_ghi_so();

DROP TRIGGER IF EXISTS trg_chan_sua_ct_hach_toan ON ct_hach_toan;
CREATE TRIGGER trg_chan_sua_ct_hach_toan
    BEFORE UPDATE OR DELETE ON ct_hach_toan
    FOR EACH ROW EXECUTE FUNCTION fn_chan_sua_chung_tu_da_ghi_so();

-- -----------------------------------------------------------------------------
-- 12.4. AUDIT LOG APPEND-ONLY — Điều 28.1.b: dấu vết theo trình tự thời gian
-- -----------------------------------------------------------------------------
ALTER TABLE ht_audit_log ADD COLUMN IF NOT EXISTS sequence_no    BIGSERIAL;
ALTER TABLE ht_audit_log ADD COLUMN IF NOT EXISTS gia_tri_truoc  JSONB;
ALTER TABLE ht_audit_log ADD COLUMN IF NOT EXISTS gia_tri_sau    JSONB;
ALTER TABLE ht_audit_log ADD COLUMN IF NOT EXISTS recorded_at    TIMESTAMPTZ NOT NULL DEFAULT now();

-- Cấm sửa/xóa log (thay <app_role> bằng role thực tế của ứng dụng)
-- REVOKE UPDATE, DELETE ON ht_audit_log FROM <app_role>;

CREATE OR REPLACE FUNCTION fn_audit_log_bat_bien()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'TT99 Điều 28.1.b: bảng ht_audit_log là append-only, không được % .', lower(TG_OP);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_bat_bien ON ht_audit_log;
CREATE TRIGGER trg_audit_log_bat_bien
    BEFORE UPDATE OR DELETE ON ht_audit_log
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log_bat_bien();

-- -----------------------------------------------------------------------------
-- 12.5. KIỂM TRA SAU NÂNG CẤP TT99
-- -----------------------------------------------------------------------------
-- (a) Từ chối quy tắc hạch toán tham chiếu TK đã ngừng sử dụng (IR-15)
--     Chạy trước khi lưu quy tắc mới; kỳ vọng 0 dòng.
-- SELECT q.ma_quy_tac, t.ma_tk, t.ten_tk
--   FROM cfg_quy_tac_hach_toan q
--   CROSS JOIN LATERAL jsonb_array_elements(q.dong_but_toan_json) AS d
--   JOIN dm_tai_khoan t
--     ON t.ma_tk IN (d->>'tk_no', d->>'tk_co') AND t.tenant_id = q.tenant_id
--  WHERE t.ngung_su_dung = TRUE;

-- (b) Connector bắt buộc chưa kết nối (cảnh báo tuân thủ Điều 28.1.đ)
-- SELECT connector_code, ten, trang_thai FROM int_connector
--  WHERE tenant_id = 'tenant-vcomm-prod-01' AND bat_buoc = TRUE AND trang_thai = 'CHUA_KET_NOI';

-- (c) Kỳ đã khóa nhưng chưa có checksum (phải trả 0 dòng)
-- SELECT k.id, k.nam, k.thang FROM dm_ky_ke_toan k
--  WHERE k.tenant_id = 'tenant-vcomm-prod-01' AND k.trang_thai = 'DA_KHOA'
--    AND NOT EXISTS (SELECT 1 FROM ht_ky_checksum c WHERE c.ky_ke_toan_id = k.id);

-- (d) Phát hiện sửa lén: so checksum hiện tại với checksum đã lưu (kỳ vọng KHOP)
-- SELECT c.ky_ke_toan_id, c.checksum_sha256 AS da_luu,
--        fn_ky_checksum(c.tenant_id, c.ky_ke_toan_id) AS hien_tai,
--        CASE WHEN c.checksum_sha256 = fn_ky_checksum(c.tenant_id, c.ky_ke_toan_id)
--             THEN 'KHOP' ELSE 'LECH' END AS ket_qua
--   FROM ht_ky_checksum c WHERE c.tenant_id = 'tenant-vcomm-prod-01';

-- =============================================================================
-- 13. ROW LEVEL SECURITY — PHÂN VÙNG THEO tenant_id
-- =============================================================================
-- Quyết định Q3: chỉ có MỘT pháp nhân kế toán, nên mọi dòng đều mang
-- tenant_id = 'tenant-vcomm-prod-01'. Với giá trị cố định này, RLS là một
-- lưới an toàn vô hiệu về mặt logic, NHƯNG vẫn được bật để đồng nhất với
-- phần còn lại của schema VComm (mọi bảng đều có RLS + policy tenant).
-- Nếu sau này tách thành nhiều pháp nhân, chỉ cần đổi policy, không phải sửa bảng.
--
-- HAI BẢNG CỐ Ý KHÔNG PHÂN VÙNG (không có cột tenant_id):
--   - cfg_quy_tac_ap_dung : bảng con của ct_chung_tu, thừa hưởng tenant qua FK
--   - int_inbox_log       : log tích hợp toàn hệ, khóa chống trùng là
--                           (source_system, message_id) — dùng chung mọi tenant
-- =============================================================================

ALTER TABLE map_danh_muc ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfg_quy_tac_hach_toan ENABLE ROW LEVEL SECURITY;
ALTER TABLE int_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE int_dead_letter ENABLE ROW LEVEL SECURITY;
ALTER TABLE ky_khoa_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE so_du_dau_ky ENABLE ROW LEVEL SECURITY;
ALTER TABLE int_doi_soat ENABLE ROW LEVEL SECURITY;
ALTER TABLE int_connector ENABLE ROW LEVEL SECURITY;
ALTER TABLE ht_ky_checksum ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS map_danh_muc_tenant_isolation ON map_danh_muc;
CREATE POLICY map_danh_muc_tenant_isolation ON map_danh_muc
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS cfg_quy_tac_hach_toan_tenant_isolation ON cfg_quy_tac_hach_toan;
CREATE POLICY cfg_quy_tac_hach_toan_tenant_isolation ON cfg_quy_tac_hach_toan
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS int_outbox_tenant_isolation ON int_outbox;
CREATE POLICY int_outbox_tenant_isolation ON int_outbox
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS int_dead_letter_tenant_isolation ON int_dead_letter;
CREATE POLICY int_dead_letter_tenant_isolation ON int_dead_letter
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS ky_khoa_module_tenant_isolation ON ky_khoa_module;
CREATE POLICY ky_khoa_module_tenant_isolation ON ky_khoa_module
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS so_du_dau_ky_tenant_isolation ON so_du_dau_ky;
CREATE POLICY so_du_dau_ky_tenant_isolation ON so_du_dau_ky
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS int_doi_soat_tenant_isolation ON int_doi_soat;
CREATE POLICY int_doi_soat_tenant_isolation ON int_doi_soat
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS int_connector_tenant_isolation ON int_connector;
CREATE POLICY int_connector_tenant_isolation ON int_connector
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

DROP POLICY IF EXISTS ht_ky_checksum_tenant_isolation ON ht_ky_checksum;
CREATE POLICY ht_ky_checksum_tenant_isolation ON ht_ky_checksum
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')
                 OR tenant_id = 'tenant-vcomm-prod-01');

-- Bảng danh mục dùng chung toàn hệ (không phân vùng theo tenant):
--   dm_tien_te, ht_nguoi_dung, ht_vai_tro, ht_quyen,
--   ht_vai_tro_quyen, ht_nguoi_dung_vai_tro
