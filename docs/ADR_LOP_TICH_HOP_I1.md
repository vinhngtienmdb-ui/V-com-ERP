# ADR — THIẾT KẾ LỚP TÍCH HỢP KẾ TOÁN TT99 TRONG VCOMM ERP (BƯỚC I1)

> **Trạng thái:** ACCEPTED  
> **Người đề xuất:** Antigravity AI Architect  
> **Căn cứ:** `13_PLAYBOOK_TRIEN_KHAI.md` (§PHASE 1, BƯỚC I1), `11_CAU_HINH_STACK_VCOMM_ERP.md`  

---

## 1. BỐI CẢNH & VẤN ĐỀ
VComm ERP nâng cấp phân hệ kế toán từ chế độ cũ lên **Thông tư 99/2025/TT-BTC** và lưu trữ hồ sơ theo **Nghị định 174/2016/NĐ-CP**. Hệ thống trước đây phụ thuộc vào cơ chế sync sang MISA AMIS bên ngoài. Nay người dùng yêu cầu:
1. **Hoàn toàn tự xây dựng lõi kế toán nội bộ VComm**, chấm dứt phụ thuộc MISA.
2. Tích hợp liền mạch với các module hiện hữu: Đơn hàng (Orders), Kho vận (WMS), Mua hàng (Procurement), Nhân sự (HR/Payroll), Quản trị tài sản (Assets), Thuế TMĐT.
3. Tuân thủ 10 nguyên tắc tích hợp và quy tắc bất biến IR-01..IR-15.

---

## 2. CÁC QUYẾT ĐỊNH KIẾN TRÚC (ADR)

### ADR-1: Nguồn chân lý kế toán (Single Source of Truth)
- **Quyết định:** Sổ kế toán kép nội bộ của VComm (`ct_chung_tu`, `ct_hach_toan`, `so_du_tai_khoan`) là **NGUỒN CHÂN LÝ DUY NHẤT**.
- **Loại bỏ MISA:** Không đồng bộ sang MISA AMIS để ghi sổ. VComm tự phát hành HĐĐT nội bộ (theo NĐ 123) và lưu trữ hồ sơ điện tử theo NĐ 174.

### ADR-2: Cơ chế đảm bảo tính nhất quán (Consistency & Outbox Pattern)
- **Quyết định:** Sử dụng **Transactional Outbox Pattern** với bảng `int_outbox` và `int_inbox`:
  1. Khi một chứng từ ERP nguồn được duyệt/thanh toán (ví dụ `orders.status = 'paid'`), bản ghi sự kiện được INSERT vào `int_outbox` trong **CÙNG 1 TRANSACTION** với chứng từ nguồn.
  2. Worker kế toán (`autoPostingService`) quét các bản ghi `PENDING` trong `int_outbox`, đối chiếu với bộ máy quy tắc `cfg_quy_tac_hach_toan`, sinh bút toán kép trong `ct_chung_tu` + `ct_hach_toan`.
  3. Cập nhật `int_outbox.trang_thai = 'PROCESSED'`.
  4. Nếu xảy ra lỗi: ghi vào `int_dead_letter` kèm thông điệp lỗi và cảnh báo cho Kế toán trưởng; không bao giờ nuốt lỗi hoặc làm mất bút toán (IR-10).

### ADR-3: Tính lũy đẳng (Idempotency Key)
- **Quyết định:** Khóa chống trùng lặp dựa trên bộ tứ:
  `UNIQUE (tenant_id, source_system, source_doc_type, source_doc_id, source_version)`
  Nếu sự kiện nhận lại mang cùng khóa này, hệ thống tự động bỏ qua, trả về mã chứng từ kế toán đã tồn tại (IR-02).

### ADR-4: Bút toán sinh tự động là Bất biến (Immutability)
- **Quyết định:** Mọi chứng từ có `auto_posted = true` hoặc `source_system <> 'MANUAL'`:
  - Khóa toàn bộ ô nhập trên giao diện S03-DN Nhật ký chung.
  - Hiển thị banner nguồn kèm liên kết drill-down về chứng từ ERP gốc (IR-01, IR-07, IR-08).
  - Khi chứng từ nguồn bị hủy/thu hồi: hệ thống **sinh bút toán đảo** (`reversal_of_id`), tuyệt đối không xóa cứng bút toán cũ (IR-04).

### ADR-5: Bộ máy quy tắc hạch toán tách rời mã nguồn (Rule-Driven Engine)
- **Quyết định:** Toàn bộ quan hệ Nợ/Có, công thức tính số tiền được lưu trữ trong bảng `cfg_quy_tac_hach_toan`, **tuyệt đối không hard-code mã tài khoản trong source code nghiệp vụ**.
- Chỉ cho phép hạch toán vào **TÀI KHOẢN LÁ** (`tk_chi_tiet = TRUE`) và tài khoản đang hoạt động (`ngung_su_dung = FALSE`) (IR-13, IR-15).

---

## 3. NHỮNG GÌ TUYỆT ĐỐI KHÔNG LÀM (NON-GOALS)
1. **KHÔNG** tạo hệ thống bảng kế toán song song (re-inventing schema).
2. **KHÔNG** sửa chữ ký hàm hoặc schema gốc của các module đang chạy production.
3. **KHÔNG** hard-code thông tin công ty hay lĩnh vực kinh doanh vào mã SQL — tất cả cấu hình qua UI.
4. **KHÔNG** cho phép sửa trực tiếp số dư tài khoản; mọi biến động số dư phải phát sinh qua chứng từ hợp lệ.
