# KẾ HOẠCH CUTOVER CHUYỂN ĐỔI SANG THÔNG TƯ 99/2025/TT-BTC (BƯỚC I8 & PHASE 10-11)

**Dự án:** VComm Enterprise Resource Planning (VComm ERP)  
**Phân hệ:** Kế toán Tổng hợp & Quản trị Tài chính số  
**Căn cứ pháp lý:** 
- Thông tư 99/2025/TT-BTC ngày 27/10/2025 (Điều 9, 11, 12, 13, 17, 28, 29, 30, 31)
- Nghị định 174/2016/NĐ-CP & Nghị định 41/2018/NĐ-CP về Lưu trữ & Xử phạt kế toán
- Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC về Hóa đơn điện tử

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC CUTOVER

1. **Nguyên tắc Bất biến (Immutability):** Toàn bộ dữ liệu kế toán lịch sử theo Thông tư 200/2014/TT-BTC được bảo toàn nguyên vẹn, phục vụ tra cứu, thanh tra, kiểm toán tối thiểu 10 năm theo Nghị định 174/2016/NĐ-CP.
2. **Không gián đoạn vận hành (Zero Downtime):** Hoạt động bán hàng sàn TMĐT, siêu thị offline VComm, cổng thanh toán SePay và kho vận WMS không bị dừng trong quá trình chuyển đổi.
3. **Lũy đẳng & Khả năng đảo ngược (Idempotent & Reversible):** Các script chuyển đổi số dư hỗ trợ chế độ `dry-run` để đối chiếu trước khi thực thi thực tế (`apply`), đồng thời có script khôi phục (rollback) tức thời.

---

## 2. TIMELINE TRIỂN KHAI CHI TIẾT (LỊCH TRÌNH D-DAY)

| Thời điểm | Hạng mục thực hiện | Người phụ trách | Tiêu chí hoàn thành (Sign-off) |
|---|---|---|---|
| **T - 7 ngày** | Khóa sổ kế toán năm tài chính 2025 theo chế độ cũ | Kế toán trưởng | Toàn bộ chứng từ 2025 có trạng thái `DA_KHOA_SO` |
| **T - 5 ngày** | Đối soát số dư công nợ KH (131), NCC (331), Kho (156) | Kế toán công nợ & kho | 100% biên bản đối chiếu khớp số liệu |
| **T - 3 ngày** | Chạy kiểm tra tính toàn vẹn và đánh số liên tục | Dev Lead | 0 chứng từ trùng lặp, 0 khoảng trống (gaps) |
| **T - 1 ngày (23:00)** | Tạo bản sao lưu Database Snapshot (PostgreSQL / Firebase) | DBA / DevOps | Snapshot backup verified & test restore OK |
| **T - 1 ngày (23:30)** | Chạy thử nghiệm chuyển đổi số dư ở chế độ `dry-run` | Dev Kế toán | Cân đối Nợ = Có: 100%, 0 tài khoản bị lệch |
| **D-Day 00:00** | Kích hoạt script chuyển đổi số dư chính thức (`applyConversion`) | KTT & Dev Lead | Sinh chứng từ số dư `CD-2026-0001` thành công |
| **D-Day 00:30** | Xác minh Bảng cân đối số phát sinh đầu kỳ (F01-DN) | Kế toán trưởng | Tổng Nợ đầu kỳ = Tổng Có đầu kỳ khớp 100% |
| **D-Day 01:00** | Kích hoạt Rule Engine TT99 cho luồng đơn hàng mới | Tech Lead | Đơn hàng phát sinh tự động sinh bút toán TT99 |
| **D-Day 08:00** | Bàn giao người dùng & Kích hoạt giao diện S03-DN, B01-DN, Hồ sơ NĐ 174 | PO / Trainer | Kế toán viên nhập liệu thành công qua phím tắt F3/F4 |
| **T + 30 ngày** | Khóa sổ kỳ kế toán Tháng 01/2026 đầu tiên theo TT99 | Kế toán trưởng | Ký duyệt số liệu, sinh mã băm SHA-256 Điều 28 |

---

## 3. CHECKLIST 5 NHÓM CHUYỂN ĐỔI SỐ DƯ (ĐIỀU 29 THÔNG TƯ 99/2025/TT-BTC)

- [x] **CĐ-1 (Sửa chữa lớn TSCĐ):** Chuyển toàn bộ số dư Nợ TK 2413 sang TK 2414. Xóa bỏ trích trước chi phí sửa chữa lớn theo Điều 30.
- [x] **CĐ-2 (Phải trả cổ tức, lợi nhuận):** Chuyển số dư Có TK 3388 (tiểu khoản cổ tức) sang TK 332 mới của TT99.
- [x] **CĐ-3 (Nguồn vốn khác):** Chuyển số dư Có TK 441 (Nguồn vốn ĐTXDCB) và TK 466 (Nguồn kinh phí đã hình thành TSCĐ) sang TK 4118 (Vốn khác của CSH).
- [x] **CĐ-4 (Đầu tư khác):** Chuyển số dư các khoản đầu tư dài hạn khác từ TK 138 sang TK 2281.
- [x] **CĐ-5 (Rút gọn cấp chi tiết tài khoản tiền):** Quy tụ toàn bộ số dư 1111/1112 về TK 111; quy tụ 1121/1122 về TK 112 theo chuẩn mới TT99.

---

## 4. MA TRẬN KIỂM SOÁT TUÂN THỦ ĐIỀU 28 TT99 & NGHỊ ĐỊNH 174

| Quy định pháp lý | Giải pháp kỹ thuật trên VComm ERP | File nguồn thực thi | Trạng thái |
|---|---|---|---|
| **Điều 13.3 & 28.1.a:** Khóa sổ kỳ kế toán | Chặn ghi sổ, sửa, xóa chứng từ vào kỳ đã khóa ở cả tầng UI, Service và Trigger | `dieu28Compliance.ts`, `KiemSoatDieu28Page.tsx` | ĐÃ HOÀN THÀNH |
| **Điều 28.1.b:** Đánh số liên tục, không ngắt quãng | Thuật toán quét và cảnh báo tự động Gaps & Duplicate numbers | `kiemTraDanhSoLienTuc()` | ĐÃ HOÀN THÀNH |
| **Điều 28.1.b:** Vết kiểm toán (Audit Trail) | Append-only audit logger với sequence đơn điệu, lưu dữ liệu cũ/mới và hash bất biến | `AuditTrailManager` | ĐÃ HOÀN THÀNH |
| **Điều 28.1.c:** Chống can thiệp dữ liệu đã ghi sổ | Chuỗi khối mã băm SHA-256 (Block Chaining) liên kết giữa các chứng từ | `tinhHashChungTu()`, `taoChuoiHashChungTu()` | ĐÃ HOÀN THÀNH |
| **Điều 17 & Phụ lục IV:** Báo cáo tài chính TT99 | Bộ báo cáo F01-DN, S03-DN, S04-DN, B01-DN (mã 280), B02-DN | `financialReports.ts`, `BaoCaoTt99Page.tsx` | ĐÃ HOÀN THÀNH |
| **NĐ 174 & TT99:** Lưu trữ hồ sơ kế toán 18 phần | Cây thư mục 18 phần, khóa vĩnh viễn Giám đốc, trích xuất 6 mức thời gian | `HoSoApp.tsx`, `danhMucHoSoData.ts` | ĐÃ HOÀN THÀNH |

---

## 5. PHƯƠNG ÁN DỰ PHÒNG & ROLLBACK (ROLLBACK PROCEDURE)

Trong trường hợp xảy ra lỗi nghiêm trọng trong đêm Cutover D-Day:
1. **Dừng Outbox Worker:** Tạm dừng tiến trình `AutoPostingService` đồng bộ bút toán tự động.
2. **Khôi phục Database:** Revert database về snapshot T - 1 ngày (23:00).
3. **Chuyển cờ cấu hình (Feature Flag):** Chuyển `SYSTEM_ACCOUNTING_STANDARD` từ `TT99` về `TT200` trong `tenant_settings`.
4. **Thông báo KTT:** Lập biên bản sự cố và dời lịch cutover sang kỳ cuối tuần tiếp theo.
