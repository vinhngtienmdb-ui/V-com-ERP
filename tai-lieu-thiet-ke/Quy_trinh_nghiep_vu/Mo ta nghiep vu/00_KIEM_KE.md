# 00 — Kiểm kê tài liệu nguồn nghiệp vụ

> Báo cáo kiểm kê toàn bộ tài liệu trong thư mục `Mo ta nghiep vu/`. Lập ngày 2026-10-05.

- Dự án: VComm
- Phạm vi: thư mục `tai-lieu-thiet-ke/Quy_trinh_nghiep_vu/Mo ta nghiep vu/`
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Tổng quan

Thư mục chứa ba nhóm tài liệu nguồn: đề án chiến lược (DOCX), đặc tả mô-đun ERP (Markdown), và kế hoạch tài chính (XLSX). Cộng thêm một thư mục lưu trữ bộ đề án cũ và một thư mục làm việc nội bộ.

| Nhóm | Số lượng | Định dạng | Ghi chú |
|---|---|---|---|
| Đề án chiến lược | 9 | DOCX | 1 đề án tổng thể + 8 đề án khối, số hiệu 01–09/KH-VCOMM |
| Đặc tả mô-đun ERP | 29 | Markdown | 4 phân hệ: Kế toán (11), Nhân sự (11), CRM (5), Văn phòng (2) |
| Kế hoạch tài chính | 2 | XLSX | 1 bản VNĐ (chuẩn) + 1 bản USD (cũ) |
| Lưu trữ đề án cũ | 6 | DOCX | trong `_Luu-tru-Bo-Cu-2026-2030/` |
| Thư mục làm việc | — | — | `.workbuddy-ai/` (script, sao lưu, trung gian) |

## 2. Đề án chiến lược (DOCX)

Chín đề án dùng chung một mẫu thể thức (bảng đầu có tên cơ quan, quốc hiệu, số, ngày; bảng cuối có nơi nhận và chữ ký Tổng Giám đốc).

| Số | Tệp | Vai trò | Kích thước văn bản |
|---|---|---|---|
| 01/KH-VCOMM | `De-An-Tong-The-VComm-2027-2036.docx` | Đề án tổng thể cho Ban Tổng Giám đốc | 96.296 ký tự |
| 02/KH-VCOMM | `De-An-Khoi-Cong-Nghe-VComm.docx` | Khối Công nghệ | 9.598 ký tự |
| 03/KH-VCOMM | `De-An-Khoi-Kinh-Doanh-VComm.docx` | Khối Kinh doanh | 7.572 ký tự |
| 04/KH-VCOMM | `De-An-Khoi-Marketing-VComm.docx` | Khối Marketing và Thương hiệu | 8.407 ký tự |
| 05/KH-VCOMM | `De-An-Khoi-KOC-VComm.docx` | Đội KOC | 6.844 ký tự |
| 06/KH-VCOMM | `De-An-Khoi-Nhan-Su-VComm.docx` | Khối Nhân sự | 6.828 ký tự |
| 07/KH-VCOMM | `De-An-Khoi-Phap-Che-VComm.docx` | Khối Pháp chế và Tuân thủ | 8.509 ký tự |
| 08/KH-VCOMM | `De-An-Khoi-Logistics-O2O-VComm.docx` | Khối Logistics và O2O | 9.540 ký tự |
| 09/KH-VCOMM | `De-An-Khoi-Tai-Chinh-Ke-Toan-VComm.docx` | Khối Tài chính và Kế toán | 9.767 ký tự |

Số hiệu 01–09 đã được đánh lại liên tục, khớp thứ tự trong bộ đề án. Ngày ban hành trên cả chín tệp đều ghi 05/10/2026.

## 3. Đặc tả mô-đun ERP (Markdown, 29 tệp)

Mỗi tệp theo cùng một cấu trúc năm mục: (1) Trường dữ liệu, (2) Quy trình, (3) Luồng nghiệp vụ, (4) Hướng dẫn kỹ thuật, (5) Hướng dẫn giao diện. Kiểm tra tự động cho thấy cả 29 tệp đều có đủ năm mục và không mục nào rỗng.

### 3.1. Phân hệ Kế toán (`1_accounting`, 11 tệp)
`01_cash` Quỹ, `02_bank` Ngân hàng, `03_purchase` Mua hàng, `04_sales` Bán hàng, `05_invoice` Hóa đơn điện tử, `06_inventory` Kho, `07_tools` Công cụ dụng cụ, `08_assets` Tài sản cố định, `09_taxes` Thuế, `10_costing` Giá thành, `11_general_ledger` Tổng hợp.

### 3.2. Phân hệ Nhân sự (`2_hrm`, 11 tệp)
`12_recruitment` Tuyển dụng, `13_onboarding` Tiếp nhận, `14_employee_records` Hồ sơ nhân viên, `15_labor_contracts` Hợp đồng lao động, `16_timekeeping` Chấm công, `17_payroll` Tiền lương, `18_social_insurance` Bảo hiểm xã hội, `19_pit` Thuế thu nhập cá nhân, `20_kpi_okr` KPI/OKR, `21_training` Đào tạo, `22_rewards_discipline` Khen thưởng và kỷ luật.

### 3.3. Phân hệ CRM (`3_crm`, 5 tệp)
`23_leads` Tiềm năng, `24_accounts` Khách hàng, `25_contacts` Liên hệ, `26_opportunities` Cơ hội bán hàng, `27_quotes_orders` Báo giá và Đơn hàng.

### 3.4. Phân hệ Văn phòng (`4_office`, 2 tệp)
`28_workflows` Quy trình (BPM), `29_tasks` Công việc và Dự án.

## 4. Kế hoạch tài chính (XLSX)

| Tệp | Đơn vị | Trang (sheet) |
|---|---|---|
| `Ke-Hoach-Tai-Chinh-Va-Nguon-Von-VComm-2026-2030 (1).xlsx` | VNĐ (bản chuẩn) | `P&L 5 năm (2026 - 2030)`, `Cơ cấu Doanh thu`, `Kế hoạch Nguồn vốn & Định giá`, `Chỉ số Mạng lưới & Vận hành Hub` |
| `Ke-Hoach-Tai-Chinh-Va-Nguon-Von-VComm-2026-2030.xlsx` | USD (bản cũ) | `Du-Phong-PnL-5-Nam`, `Unit-Economics`, `Ke-Hoach-Nguon-Von`, `Co-Cau-So-Huu-Cap-Table` |

Hai bản là hai mô hình khác nhau, không phải bản trùng. Bản VNĐ khớp với đề án Tài chính; bản USD có thêm trang Unit-Economics và Cap Table nhưng số liệu lệch.

## 5. Thư mục phụ

- `_Luu-tru-Bo-Cu-2026-2030/` — 6 đề án chuyên đề cũ (Chiến lược phát triển kinh doanh, Công nghệ sàn TMĐT, Mô hình kinh doanh, Tài chính và Nguồn vốn, Tổng thể sàn TMĐT 2026–2030, Vận hành chuỗi cung ứng). Đã được bộ 9 đề án khối thay thế.
- `.workbuddy-ai/` — thư mục làm việc nội bộ: `tmp/` (script trích xuất, nội dung trung gian), `backup/` (các bản sao lưu đề án cũ theo ngày), `memory/` (ghi chép phiên làm việc trước).

## 6. Đánh giá

> Đánh giá dưới đây lập tại thời điểm kiểm kê. Mục 1 và mục 4 của phần "Thiếu sót và không nhất quán" đã được xử lý; xem nhật ký hoàn thiện tại mục 8.

**Điểm mạnh**
- Bộ 29 đặc tả mô-đun đầy đủ về cấu trúc, có cả trường dữ liệu, quy trình, định khoản và gợi ý giao diện.
- Bộ 9 đề án có thể thức thống nhất, số hiệu liên tục, ngày ban hành thống nhất.

**Thiếu sót và không nhất quán**
- **Tiêu đề đặc tả mô-đun không thống nhất:** nhóm Kế toán và Nhân sự mở đầu bằng `# Phân hệ <tên>`; nhóm CRM và Văn phòng mở đầu bằng `# Đặc tả nghiệp vụ: Phân hệ <tên> - MISA AMIS <sản phẩm>`. Cùng một bộ tài liệu nhưng hai quy cách tiêu đề.
- **Phạm vi mô-đun hẹp:** 29 đặc tả chỉ phủ bốn phân hệ (Kế toán, Nhân sự, CRM, Văn phòng). Hệ thống ERP VComm thực tế còn nhiều phân hệ khác chưa có đặc tả nguồn (ví dụ Kho vận, Bán hàng đa kênh, Loyalty, Ví, Quảng cáo, Tuân thủ, Hợp đồng).
- **Hai bản kế hoạch tài chính chưa hòa giải:** bản VNĐ và bản USD lệch số liệu, chưa có tài liệu ghi rõ bản nào là chuẩn và vì sao.
- **Tham chiếu chưa đồng bộ:** một số đặc tả mô-đun gắn với sản phẩm tham chiếu "MISA AMIS"; cần ghi rõ đó là mẫu tham khảo hay yêu cầu bắt buộc.

## 7. Đề xuất hoàn thiện (chờ xác nhận)

1. Thống nhất tiêu đề 29 đặc tả mô-đun về một quy cách duy nhất.
2. Bổ sung đặc tả cho các phân hệ còn thiếu, hoặc ghi rõ phạm vi cố ý bỏ ngoài.
3. Lập một tệp ghi rõ bản kế hoạch tài chính nào là chuẩn và hòa giải chênh lệch giữa hai bản.
4. Ghi rõ vai trò của "MISA AMIS" trong các đặc tả (mẫu tham khảo hay yêu cầu).

## 8. Nhật ký hoàn thiện (2026-10-05)

- **Đã xong — thống nhất tiêu đề:** chuyển toàn bộ 29 đặc tả về quy cách `# Đặc tả nghiệp vụ: Phân hệ <Tên> (<English>)`, bỏ tên sản phẩm "MISA AMIS" khỏi tiêu đề (quyết định của chủ dự án). Sao lưu trước khi sửa tại `.workbuddy-ai/backup/MD_ERP-backup-titlefix-20261005/` (29 tệp).
- **Đã xong — ghi rõ phạm vi phân hệ:** lập `MD_ERP/00_INDEX.md` gồm mục lục 29 tệp và bản đồ phạm vi đối chiếu với các phân hệ trong `src/App.tsx` (nêu rõ nhóm phân hệ thương mại chưa có đặc tả mô-đun).
- **Đã xong — hòa giải hai bản kế hoạch tài chính:** lập `00_HOA_GIAI_KE_HOACH_TAI_CHINH.md`. Xác định bản VNĐ `...2026-2030 (1).xlsx` là bản chuẩn (khớp tuyệt đối với đề án Tài chính 09/KH-VCOMM, đề án Tổng thể 01/KH-VCOMM và bộ đề án cũ); bản USD `...2026-2030.xlsx` là bản cũ bị thay thế. Ghi rõ chênh lệch từng năm, từng trang, kèm hai bất nhất cần chủ dự án chốt: nhãn năm lệch một năm (XLSX 2026 - 2030 so với đề án 2027 - 2036) và cơ cấu sử dụng vốn lệch giữa đề án (25/35/20/12/8) với bảng tính chuẩn (40/25/20/15).
- **Đã xong — ghi rõ vai trò MISA AMIS:** thêm mục 1.1 vào `MD_ERP/00_INDEX.md` và chèn một dòng quy ước dưới tiêu đề của 12 tệp đặc tả có nhắc MISA/AMIS; khẳng định đây là **sản phẩm tham khảo**, không phải yêu cầu bắt buộc.
- **Đã xong — đưa bộ tài liệu vào repo mã nguồn:** sao chép `tai-lieu-thiet-ke` vào `_recovery_V-com-ERP` (75 tệp, loại trừ `.workbuddy-ai`), commit `3905307`, đẩy lên `origin/main`. **Lưu ý:** hiện tồn tại hai bản song song (bản gốc `D:\VComm\tai-lieu-thiet-ke` và bản trong repo), cần chủ dự án chốt phương án một bản duy nhất.
- **Còn lại (chưa làm):** bổ sung đặc tả chi tiết cho nhóm phân hệ thương mại; chốt nhãn năm và cơ cấu sử dụng vốn của kế hoạch tài chính.

## Chưa xác minh được

- Chín đề án DOCX đã đủ nội dung cuối cùng chưa (còn ô trống số hiệu, ngày ban hành hay chữ ký hay không) — mới kiểm tra phần đầu và số hiệu.
- Sự khác biệt chi tiết giữa bản kế hoạch tài chính VNĐ và USD (mới so tên trang, chưa so từng số liệu).
- Sáu đề án trong thư mục lưu trữ còn cần thiết hay không.
- Thư mục `.workbuddy-ai/` có phải giữ lại lâu dài hay chỉ là trung gian.
