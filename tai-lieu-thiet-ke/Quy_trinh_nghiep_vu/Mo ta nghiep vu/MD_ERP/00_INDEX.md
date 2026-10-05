# 00 — Mục lục đặc tả mô-đun ERP và phạm vi

> Mục lục 29 đặc tả nghiệp vụ mô-đun trong thư mục này, kèm bản đồ phạm vi đối chiếu với hệ thống VComm.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Quy cách chung

Mọi tệp mở đầu bằng tiêu đề `# Đặc tả nghiệp vụ: Phân hệ <Tên> (<English>)`, theo cùng cấu trúc năm mục: (1) Trường dữ liệu, (2) Quy trình, (3) Luồng nghiệp vụ, (4) Hướng dẫn kỹ thuật, (5) Hướng dẫn giao diện.

### 1.1. Quy ước về tham chiếu sản phẩm ngoài

Một số đặc tả có nhắc tới **MISA AMIS** và các sản phẩm cùng hãng (meInvoice, eSign, KYSO, WeSign, aiMarketing, AMIS Kế toán, AMIS Nhân sự, AMIS Hợp đồng, AMIS Quy trình, AMIS Công việc).

Các tham chiếu này có vai trò **sản phẩm tham khảo** — nêu ra để minh họa cách một hệ thống thương mại trên thị trường đang làm nghiệp vụ đó, giúp hình dung yêu cầu. **Không phải yêu cầu bắt buộc.** VComm tự xây dựng tính năng tương đương trên nền tảng của mình; không phụ thuộc, không tích hợp bắt buộc với bất kỳ sản phẩm MISA nào.

Danh sách 12 tệp có tham chiếu (đã chèn quy ước này ngay dưới tiêu đề):

| Nhóm | Tệp |
|---|---|
| Kế toán | `1_accounting/05_invoice.md` |
| Nhân sự | `2_hrm/15_labor_contracts.md`, `16_timekeeping.md`, `21_training.md`, `22_rewards_discipline.md` |
| CRM | `3_crm/23_leads.md`, `24_accounts.md`, `25_contacts.md`, `26_opportunities.md`, `27_quotes_orders.md` |
| Văn phòng | `4_office/28_workflows.md`, `29_tasks.md` |

Mười bảy tệp còn lại không có tham chiếu sản phẩm ngoài.

## 2. Mục lục 29 đặc tả

### 2.1. Phân hệ Kế toán (`1_accounting`, 11 tệp)

| Số | Tệp | Tên phân hệ |
|---|---|---|
| 01 | `01_cash.md` | Quỹ (Cash Management) |
| 02 | `02_bank.md` | Ngân hàng (Bank Management) |
| 03 | `03_purchase.md` | Mua hàng (Purchase & Accounts Payable) |
| 04 | `04_sales.md` | Bán hàng (Sales & Accounts Receivable) |
| 05 | `05_invoice.md` | Quản lý Hóa đơn (E-Invoice Management) |
| 06 | `06_inventory.md` | Kho (Inventory Management) |
| 07 | `07_tools.md` | Công cụ dụng cụ (Tools & Supplies) |
| 08 | `08_assets.md` | Tài sản cố định (Fixed Assets) |
| 09 | `09_taxes.md` | Thuế (Tax Management) |
| 10 | `10_costing.md` | Giá thành (Costing) |
| 11 | `11_general_ledger.md` | Tổng hợp (General Ledger) |

### 2.2. Phân hệ Nhân sự (`2_hrm`, 11 tệp)

| Số | Tệp | Tên phân hệ |
|---|---|---|
| 12 | `12_recruitment.md` | Tuyển dụng (Recruitment) |
| 13 | `13_onboarding.md` | Tiếp nhận (Onboarding) |
| 14 | `14_employee_records.md` | Hồ sơ nhân viên (Employee Records) |
| 15 | `15_labor_contracts.md` | Hợp đồng lao động (Labor Contracts) |
| 16 | `16_timekeeping.md` | Chấm công (Timekeeping) |
| 17 | `17_payroll.md` | Tính lương (Payroll) |
| 18 | `18_social_insurance.md` | Bảo hiểm xã hội (Social Insurance) |
| 19 | `19_pit.md` | Thuế thu nhập cá nhân (Personal Income Tax) |
| 20 | `20_kpi_okr.md` | Đánh giá hiệu suất (KPI/OKR) |
| 21 | `21_training.md` | Đào tạo (Training & Development) |
| 22 | `22_rewards_discipline.md` | Khen thưởng - Kỷ luật (Rewards & Discipline) |

### 2.3. Phân hệ CRM (`3_crm`, 5 tệp)

| Số | Tệp | Tên phân hệ |
|---|---|---|
| 23 | `23_leads.md` | Tiềm năng (Leads) |
| 24 | `24_accounts.md` | Khách hàng (Accounts) |
| 25 | `25_contacts.md` | Liên hệ (Contacts) |
| 26 | `26_opportunities.md` | Cơ hội bán hàng (Opportunities) |
| 27 | `27_quotes_orders.md` | Báo giá và Đơn hàng (Quotes & Orders) |

### 2.4. Phân hệ Văn phòng (`4_office`, 2 tệp)

| Số | Tệp | Tên phân hệ |
|---|---|---|
| 28 | `28_workflows.md` | Quy trình (Workflows/BPM) |
| 29 | `29_tasks.md` | Công việc và Dự án (Tasks & Projects) |

## 3. Bản đồ phạm vi

Đối chiếu phân hệ trong hệ thống VComm (theo định tuyến `src/App.tsx`) với đặc tả nguồn.

### 3.1. Đã có đặc tả nguồn

| Phân hệ / màn hình hệ thống | Đường dẫn hệ thống | Đặc tả nguồn |
|---|---|---|
| Kế toán (TT99, sổ cái, quỹ, ngân hàng, mua/bán, kho, thuế, giá thành) | `/ke-toan-tt99`, `/finance` | `01`–`11` |
| Nhân sự | `/hr`, `/easyhrm`, `/performance` | `12`–`22` |
| Khách hàng, CSKH | `/customers`, `/cskh` | `23`–`27` |
| Quy trình, công việc, đề xuất | `/workflow`, `/tasks`, `/requests` | `28`, `29` |

### 3.2. Chưa có đặc tả nguồn (phân hệ thương mại và mở rộng)

| Phân hệ / màn hình hệ thống | Đường dẫn hệ thống |
|---|---|
| Đơn hàng | `/orders` |
| Quản lý sản phẩm (PIM) | `/pim` |
| Người bán | `/sellers`, `/seller-finance` |
| Marketing, Flash Sale, Mua chung | `/marketing`, `/flash-sale`, `/group-buy` |
| F2B2B, Dropship, Hub, V-Xu | `/f2b2b`, `/dropship`, `/vcomm-hub`, `/vxu` |
| Tiếp thị liên kết | `/affiliate` |
| Mua hàng (SCM) | `/scm` |
| Kho vận, Logistics | `/warehouse`, `/logistics` |
| Đối soát | `/settlement` |
| Loyalty | `/loyalty` |
| Ví | `/wallet` |
| Live Commerce, Quảng cáo | `/live`, `/ads` |
| Tuân thủ, Hợp đồng, Tài liệu, Chữ ký | `/compliance`, `/contracts`, `/documents`, `/signature` |
| Tổ chức, Thiết bị cho thuê | `/org`, `/device-leasing` |
| Phân tích BI | `/bi`, `/analytics` |
| E-menu, Cổng nhà cung cấp | `/emenu/:tableId`, `/supplier-portal` |

## 4. Ghi chú phạm vi

- 29 đặc tả hiện phủ nhóm nghiệp vụ "hậu trường" (kế toán, nhân sự, CRM, văn phòng).
- Nhóm phân hệ thương mại (đơn hàng, khuyến mãi, mạng lưới Hub, ví, quảng cáo, KOL, tuân thủ) hiện chỉ được mô tả ở mức chiến lược trong bộ 9 đề án (`../`), chưa có đặc tả mô-đun chi tiết.
- Việc bổ sung đặc tả cho nhóm thương mại là công việc riêng, cần chủ dự án xác nhận phạm vi và mức chi tiết.

## Chưa xác minh được

- Danh sách màn hình lấy từ `src/App.tsx` của bản clone `_recovery_V-com-ERP`; một số màn hình có thể là phụ trợ, không phải phân hệ nghiệp vụ độc lập.
- Ranh giới giữa "phân hệ nghiệp vụ" và "màn hình tiện ích" chưa được chủ dự án xác nhận.
- Mức chi tiết mong muốn cho đặc tả nhóm thương mại (nếu bổ sung).
