# Nhật ký dự án

- Dự án: VComm
- Ngày bắt đầu: 2026-10-05
- Ngày cập nhật gần nhất: 2026-10-05

## Quy ước ghi nhật ký

- Chỉ ghi thêm, không ghi đè.
- Mỗi mục ghi rõ ngày, người thực hiện, nội dung, tệp bị ảnh hưởng, kết quả kiểm thử.
- Không ghi thông tin tạm thời như kết quả tra cứu, đường dẫn tạm, thông báo lỗi của công cụ.

## Nhật ký theo ngày

### 2026-10-05

**Người thực hiện:**

**Nội dung:**

- Khởi tạo bộ tài liệu thiết kế cho dự án VComm.

**Tệp bị ảnh hưởng:**

- Toàn bộ thư mục tai-lieu-thiet-ke.

**Kết quả kiểm thử:**

- Không áp dụng.

**Ghi chú:**

- Bộ tài liệu này là tài liệu cấp toàn dự án VComm.
- Dự án đã có các tài liệu trước đó, giữ nguyên và không di chuyển: `thiet-ke-erp-ke-toan/` (phân hệ kế toán), `vcomm-erp/docs/` (lớp tích hợp vcomm-erp), `CHANGELOG.md` và `NHAT_KY_CAP_NHAT.md` (nhật ký phiên bản toàn hệ sinh thái).
- `CHANGELOG.md` và `NHAT_KY_CAP_NHAT.md` có nội dung giống hệt nhau, cần xử lý trùng lặp.

### 2026-10-05 — Đồng bộ theo chuẩn quy trình mới

**Người thực hiện:**

**Nội dung:**

- Đồng bộ bộ tài liệu thiết kế theo chuẩn cập nhật của quy trình VibeCode.
- Thêm thư mục `Quy_trinh_nghiep_vu` chứa mục lục quy trình và phiếu yêu cầu trống.
- Thay checklist công việc bằng mẫu mới, có thêm phần roadmap sản phẩm và mã công việc theo phân hệ.

**Tệp bị ảnh hưởng:**

- `tai-lieu-thiet-ke/Checklist_cong_viec.md`
- `tai-lieu-thiet-ke/index.md`
- `tai-lieu-thiet-ke/Quy_trinh_nghiep_vu/index.md`
- `tai-lieu-thiet-ke/Quy_trinh_nghiep_vu/Phieu_yeu_cau.md`

**Kết quả kiểm thử:**

- Chạy script khởi tạo lần hai: tạo 2 tệp mới, bỏ qua 23 tệp đã tồn tại. Không ghi đè tệp nào.

**Ghi chú:**

- Không xóa, không di chuyển, không đổi tên bất kỳ tệp nào của VComm.
- Checklist cũ còn trống hoàn toàn nên thay được an toàn, không mất nội dung.

### 2026-10-05 — Gộp hai tệp nhật ký phiên bản trùng lặp

**Người thực hiện:**

**Nội dung:**

- Gộp `CHANGELOG.md` và `NHAT_KY_CAP_NHAT.md` ở thư mục gốc dự án thành một nguồn duy nhất.
- Giữ lại `NHAT_KY_CAP_NHAT.md`, xóa `CHANGELOG.md` theo yêu cầu của chủ dự án.
- Cập nhật mục "Tài liệu đã có trong dự án trước khi khởi tạo" trong `index.md`.

**Tệp bị ảnh hưởng:**

- Xóa: `CHANGELOG.md`
- Giữ nguyên: `NHAT_KY_CAP_NHAT.md`
- `tai-lieu-thiet-ke/index.md`

**Kết quả kiểm thử:**

- Trước khi xóa, kiểm tra mã băm của hai tệp: giống hệt nhau, `012757021ddd9ee0a0a960cf1a7c02fa`.
- Sau khi xóa, `NHAT_KY_CAP_NHAT.md` còn nguyên 323 dòng.
- Đã tìm toàn kho, chỉ có bốn tệp nhắc tới hai tên này: chính hai tệp đó và hai tệp trong `tai-lieu-thiet-ke`. Không có mã nguồn, script hay công cụ nào phụ thuộc.

**Ghi chú:**

- Không mất dữ liệu vì hai tệp giống hệt nhau từng byte.

### 2026-10-05 — Khảo sát lại toàn bộ quy trình (VibeCode)

**Người thực hiện:** AI (Minh) theo yêu cầu của Eric

**Nội dung:**

- Thực hiện khảo sát lại toàn bộ quy trình dự án VComm theo skill `quy-trinh-vibecode` (5 bước BA → Design → Code → Test → Release).
- Tác giả 20 tệp thiết kế (`01_Tong_quan_du_an.md` … `20_Lich_su_thay_doi.md`), mỗi tệp đều dẫn chứng đường dẫn tệp và số dòng mã nguồn thực tế, kèm phần "Chưa xác minh được".
- Tổng hợp phát hiện hiện trạng: 86 route API (chỉ 23 route có guard xác thực); bảng `domain_events` không có chính sách RLS; `src/services/dbService.ts` không có cơ chế transaction (ghi không nguyên tử); token MISA giả (`misaService.ts:56`); hai sổ kế toán song song (`journal_entries` cũ và `acc_*` TT99).
- Xác nhận 5 lỗi bảo mật đã sửa trong mã (#61, #74, #75, #77, #89) cộng #90, qua các commit `0126231`, `128dd2f`, `651804f`, `3eac0a6`, `d65dc6a`.

**Tệp bị ảnh hưởng:**

- `tai-lieu-thiet-ke/01_Tong_quan_du_an.md` … `20_Lich_su_thay_doi.md` (20 tệp thiết kế)
- `tai-lieu-thiet-ke/Checklist_cong_viec.md` (cập nhật modules + các đầu việc M1–M7, N1–N4)

**Kết quả kiểm thử:**

- Không áp dụng (tài liệu thiết kế).

**Ghi chú:**

- Cơ sở mã khảo sát: bản clone sạch `_recovery_V-com-ERP` (origin/main), commit mới nhất `128dd2f`.
- Các rủi ro còn mở (OPEN) đã đưa vào `Checklist_cong_viec.md` và `19_Bao_mat.md` để xử lý theo thứ tự ưu tiên (M1 bảo vệ route nhạy cảm → M2 RLS domain_events → M7 rà quét route → M3 transaction → M5 thống nhất sổ kế toán).

### 2026-10-05 — Hoàn thiện bộ tài liệu thiết kế (10 tệp stub và quy trình QT-01)

**Người thực hiện:** AI (Minh) theo yêu cầu của Eric

**Nội dung:**

- Hoàn thiện 10 tệp thiết kế còn để trống: `05_Vai_tro_nguoi_dung.md`, `06_Luong_nghiep_vu.md`, `07_Yeu_cau_chuc_nang.md`, `08_Tieu_chi_nghiem_thu.md`, `11_Dac_ta_giao_dien.md`, `12_He_thong_thiet_ke.md`, `15_Quy_tac_phat_trien_AI.md`, `16_Cau_lenh_he_thong_AI.md`, `17_Ke_hoach_kiem_thu.md`, `18_Ca_kiem_thu.md`. Mỗi tệp đều có bằng chứng đường dẫn tệp và số dòng, kèm mục "Chưa xác minh được".
- Tạo quy trình nghiệp vụ đầu tiên `Quy_trinh_nghiep_vu/QT-01_Dang_nhap_va_xac_thuc_phien_nguoi_ban.md` (khuôn B đủ mục, có mã BR/AC/E/GD/Q và ít nhất một tiêu chí thất bại về quyền).
- Cập nhật `Quy_trinh_nghiep_vu/index.md` (số quy trình đã cấp 1, số tiếp theo QT-02) và `index.md` (bổ sung dòng QT-01).
- Bổ sung bằng chứng hiện trạng: 34/86 route có guard (trước đây ước lượng 23); 86 tệp `*.test.ts`; Tailwind 4 cấu hình hướng CSS (không có `tailwind.config.js`), bảng màu primary ánh xạ indigo (`src/index.css:22-31`, `:44-48`).

**Tệp bị ảnh hưởng:**

- `tai-lieu-thiet-ke/05_Vai_tro_nguoi_dung.md` … `18_Ca_kiem_thu.md` (10 tệp thiết kế)
- `tai-lieu-thiet-ke/Quy_trinh_nghiep_vu/QT-01_Dang_nhap_va_xac_thuc_phien_nguoi_ban.md` (mới)
- `tai-lieu-thiet-ke/Quy_trinh_nghiep_vu/index.md`
- `tai-lieu-thiet-ke/index.md`

**Kết quả kiểm thử:**

- Không áp dụng (tài liệu thiết kế). Bằng chứng lấy từ bản clone `_recovery_V-com-ERP` tại các dòng đã trích.

**Ghi chú:**

- Bộ tài liệu 20 tệp nay đã có nội dung đầy đủ, không còn tệp trống.
- Việc triển khai M1/M2 (bảo mật) đã hoàn tất trước đó và được phản ánh trong `19_Bao_mat.md`, `Checklist_cong_viec.md`, `20_Lich_su_thay_doi.md`.

### 2026-10-05 — Hoàn thiện tài liệu nguồn và đưa bộ tài liệu thiết kế vào repo

**Người thực hiện:** AI (Minh) theo yêu cầu của Eric

**Nội dung:**

- Lập tài liệu hòa giải hai bản kế hoạch tài chính. Xác định bản VNĐ `Ke-Hoach-Tai-Chinh-Va-Nguon-Von-VComm-2026-2030 (1).xlsx` là bản chuẩn — khớp tuyệt đối với đề án Tài chính 09/KH-VCOMM, đề án Tổng thể 01/KH-VCOMM và cả bộ đề án cũ đang lưu trữ; bản USD `Ke-Hoach-Tai-Chinh-Va-Nguon-Von-VComm-2026-2030.xlsx` là bản cũ bị thay thế, không đề án nào tham chiếu. Ghi rõ mọi chênh lệch theo từng năm và từng trang, kèm hai bất nhất cần chốt: nhãn năm lệch một năm và cơ cấu sử dụng vốn lệch giữa đề án và bảng tính.
- Ghi rõ vai trò sản phẩm tham chiếu MISA AMIS: thêm mục quy ước vào `MD_ERP/00_INDEX.md` và chèn một dòng quy ước dưới tiêu đề của 12 tệp đặc tả có nhắc MISA/AMIS; khẳng định đây là sản phẩm tham khảo, không phải yêu cầu bắt buộc.
- Đưa toàn bộ bộ tài liệu thiết kế vào repo mã nguồn `_recovery_V-com-ERP` (nhánh `main`), loại trừ thư mục tạm `.workbuddy-ai`.

**Tệp bị ảnh hưởng:**

- `tai-lieu-thiet-ke/Quy_trinh_nghiep_vu/Mo ta nghiep vu/00_HOA_GIAI_KE_HOACH_TAI_CHINH.md` (mới)
- `tai-lieu-thiet-ke/Quy_trinh_nghiep_vu/Mo ta nghiep vu/00_KIEM_KE.md`
- `tai-lieu-thiet-ke/Quy_trinh_nghiep_vu/Mo ta nghiep vu/MD_ERP/00_INDEX.md`
- Mười hai tệp `MD_ERP/**/*.md` được chèn dòng quy ước
- `_recovery_V-com-ERP/tai-lieu-thiet-ke/` (mới, 75 tệp)

**Kết quả kiểm thử:**

- Đối chiếu số liệu hai tệp XLSX với ba nguồn đề án: khớp tuyệt đối với bản VNĐ, lệch ở các năm 2028–2030 đối với bản USD.
- Kiểm tra 12 tệp: đều có dòng quy ước đúng vị trí; 29 tiêu đề H1 của bộ đặc tả còn nguyên vẹn.

**Ghi chú:**

- Commit `3905307` đã đẩy lên `origin/main` (`c384e46..3905307`).
- Bản gốc vẫn giữ tại `D:\VComm\tai-lieu-thiet-ke`; hiện tồn tại hai bản song song, cần chủ dự án chốt phương án một bản duy nhất.
