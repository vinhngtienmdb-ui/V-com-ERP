# QT-24 — Quản trị Khách hàng

- Dự án: VComm
- Mã quy trình: QT-24
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: CRM
- Nguồn nghiệp vụ: mã nguồn `_recovery_V-com-ERP` và quyết định của chủ dự án ngày 2026-10-09 (mô hình thương mại điện tử). Đặc tả `Mo ta nghiep vu/MD_ERP/3_crm/24_accounts.md` mô tả mô hình CRM doanh nghiệp cũ, không còn áp dụng.
- Mô-đun hệ thống: MOD-36 Khách hàng (CRM) (`/customers`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình hồ sơ khách hàng 360 độ, hạng thành viên và cấu hình tích điểm; cổng đăng ký eCommerce không nằm trong kho mã này

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Khách hàng | Tự đăng ký tài khoản qua cổng eCommerce; tài khoản đó sinh bản ghi khách hàng dùng chung với ERP | `src/services/dbService.ts:2532`, `src/components/Customers.tsx:1599` |
| Quản trị viên | Tác nhân duy nhất được tạo khách hàng bằng tay từ ERP | `src/components/Customers.tsx:1045`, `:2079` |
| Hệ thống | Từ chối tạo tài khoản ảo; chặn cộng và trừ số dư khi khách chưa có tài khoản eCommerce | `src/components/Customers.tsx:1597` |
| Hệ thống | Tính điểm khách hàng, ghi sổ điểm thưởng, mở phiếu hỗ trợ | `src/services/crmService.ts:19`, `:65`, `:112` |

## 2. Điều kiện trước

- Cổng đăng ký eCommerce hoạt động và ghi vào bảng tài khoản mà ERP đọc.
- Đã có danh mục hạng thành viên và cấu hình tích điểm.
- Không có phễu tiềm năng, sổ liên hệ, cơ hội bán hàng hay báo giá trong mô hình.

## 3. Luồng chính

1. Khách hàng tự đăng ký tài khoản trên cổng eCommerce (`src/services/dbService.ts:2532`).
2. Hệ thống sinh bản ghi khách hàng với trạng thái hoạt động, hạng mặc định và điểm bằng không (`src/components/Customers.tsx:1069`).
3. ERP đọc bản ghi dùng chung và hiển thị hồ sơ khách hàng 360 độ (`src/components/Customers.tsx:203`).
4. Hệ thống tính điểm khách hàng theo mô hình tần suất, thời gian gần nhất và giá trị để xếp hạng (`src/services/crmService.ts:19`).
5. Điểm thưởng cộng hoặc trừ đi qua sổ điểm thưởng (`src/services/crmService.ts:65`).
6. Ngoại lệ: quản trị viên tạo khách hàng bằng tay khi khách không tự đăng ký được (`src/components/Customers.tsx:1045`).

## 4. Sơ đồ

```
[Khách tự đăng ký trên cổng eCommerce :2532]
                        |
                        v
          [Bản ghi khách hàng dùng chung :1069]
                        |
        +---------------+---------------+
        |                               |
        v                               v
[Hồ sơ 360 độ :203]         [Quản trị viên tạo tay :1045]
        |
        v
[Tính điểm khách hàng :19] --> [Hạng thành viên :888] --> [Sổ điểm thưởng :65]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Khách chưa có tài khoản eCommerce | Từ chối cộng hoặc trừ số dư; không tạo tài khoản ảo | `src/components/Customers.tsx:1597` |
| E2 | Email đã được đăng ký | Từ chối đăng ký | `src/services/dbService.ts:2535` |
| E3 | Mật khẩu không đạt yêu cầu | Từ chối đăng ký | `src/services/dbService.ts:2538` |
| E4 | Khách chưa có đơn hàng | Không tính được điểm khách hàng; trả về rỗng | `src/services/crmService.ts:30` |
| E5 | Thiếu token xác thực | HTTP 401 | `server.ts:389` |

## 6. Máy trạng thái

```
Khách hàng: Chưa có --> Đã đăng ký --> Đang giao dịch --> Tạm dừng --> Đã đóng
Hạng thành viên: Mới --> Bạc --> Vàng --> Kim cương
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Khách hàng chỉ sinh ra từ đăng ký eCommerce; không có tiềm năng, liên hệ, cơ hội bán hàng hay báo giá | quyết định chủ dự án 2026-10-09; `src/components/Customers.tsx:1597` |
| BR-02 | Chỉ quản trị viên được tạo khách hàng bằng tay | `src/components/Customers.tsx:1045`, `:2079` |
| BR-03 | Không tạo tài khoản ảo khi khách chưa đăng ký | `src/components/Customers.tsx:1597` |
| BR-04 | Hạng thành viên và tỉ lệ tích điểm lấy từ cấu hình, không gắn cứng | `src/components/Customers.tsx:933` |
| BR-05 | Điểm khách hàng tính theo mô hình tần suất, thời gian gần nhất và giá trị | `src/services/crmService.ts:19` |

## 8. Thông báo và nhật ký

- Hàm ghi điểm thưởng và mở phiếu hỗ trợ có ghi nhật ký kỹ thuật (`src/services/crmService.ts:104`, `:147`).
- Chưa có thông báo tự động khi khách hàng lâu không phát sinh giao dịch.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng tài khoản người dùng | Mã, tenant, tên hiển thị, điện thoại, thư điện tử, vai trò, kênh, trạng thái, điểm, số dư ví, tổng chi tiêu, số đơn | `src/components/Customers.tsx:1059` |
| Bảng khách hàng | Mã, tenant, tên, thư điện tử, điện thoại, địa chỉ | `scripts/normalize_relational_schema.sql:36` |
| Bảng sổ điểm thưởng | Khách hàng, số điểm thay đổi, loại giao dịch, tenant | `src/services/crmService.ts:77` |
| Bảng phiếu hỗ trợ | Khách hàng, tiêu đề, độ ưu tiên, hạn xử lý, tenant | `src/services/crmService.ts:133` |
| Bảng đơn hàng | Khách hàng, ngày | `src/services/crmService.ts:21` |

## 10. Màn hình

- Hồ sơ Khách hàng 360 độ (`src/components/Customers.tsx:203`).
- Danh sách Hạng thành viên (`src/components/Customers.tsx:888`).
- Cấu hình Tích điểm và Tiêu điểm (`src/components/Customers.tsx:933`).
- Thẻ phân loại ưu tiên (`src/components/Customers.tsx:973`).
- Cấu hình Nguồn Tracking (`src/components/Customers.tsx:1003`).
- Nút "Thêm Khách hàng" (`src/components/Customers.tsx:2079`) — dành cho quản trị viên.

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho khách tự đăng ký thành công trên cổng eCommerce, Khi ERP đọc dữ liệu, Thì hồ sơ khách hàng xuất hiện với hạng mặc định và không điểm.
- **AC-02.** Cho khách chưa có tài khoản eCommerce, Khi cố cộng hoặc trừ số dư, Thì hệ thống từ chối và không tạo tài khoản ảo (ca thất bại bắt buộc).
- **AC-03.** Cho quản trị viên, Khi bấm "Thêm Khách hàng" và gửi biểu mẫu, Thì bản ghi mới được tạo (`src/components/Customers.tsx:1078`).
- **AC-04.** Cho khách đủ điều kiện lên hạng, Khi tính lại hạng, Thì hạng thành viên cập nhật đúng quy tắc (`src/services/crmService.ts:35`).
- **AC-05.** Cho mô hình thương mại điện tử, Khi kiểm tra cây quy trình, Thì không còn quy trình tiềm năng, liên hệ, cơ hội bán hàng hay báo giá.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình khách hàng, hạng thành viên và cấu hình tích điểm đã có.
- Đã dời bốn quy trình CRM cũ (tiềm năng, liên hệ, cơ hội bán hàng, báo giá) vào `_Tam_huy/` ngày 2026-10-09.
- Cần bổ sung kiểm tra quyền quản trị viên cho nút tạo tay — thành phần hiện không kiểm tra quyền.

## 13. Giả định và câu hỏi mở

- **GD-01.** Cổng đăng ký eCommerce ghi vào cùng bảng tài khoản mà ERP đọc.
- **Q-01.** Điều kiện lên hạng và quyền lợi theo hạng như thế nào?
- **Q-02.** Khách vãng lai mua không đăng ký có được tạo hồ sơ không?
- **Q-03.** Mô-đun "Đội ngũ Kinh doanh" (`/sales`, MOD-38) còn phần quản lý tiềm năng trong mã nguồn — mô-đun này có bị hủy theo mô hình thương mại điện tử không?

## 14. Ghi chú kỹ thuật

- Có hai đường ghi khách hàng: bảng tài khoản người dùng cho biểu mẫu tạo tay (`src/components/Customers.tsx:1079`) và bảng khách hàng cho điểm khách hàng và điểm thưởng (`src/services/crmService.ts:46`). Chưa thấy cầu nối giữa hai đường.
- Có hàm tìm kiếm khách hàng toàn văn (`src/services/fullTextSearchService.ts:236`).
- Tuyến `/customers` khai ở `src/App.tsx:396`; mục menu khai ở `src/constants.ts:104`.

## Chưa xác minh được

- Chưa xác minh được cổng đăng ký eCommerce có nằm trong kho mã này hay không; không thấy ứng dụng eCommerce riêng trong `_recovery_V-com-ERP`.
- Chưa xác minh được có kiểm tra quyền quản trị viên cho nút "Thêm Khách hàng" hay không; thành phần `Customers` không dùng ngữ cảnh xác thực.
- Chưa xác minh được cầu nối giữa bảng tài khoản người dùng và bảng khách hàng.
- Chưa xác minh được quy tắc lên hạng đang áp dụng.
- Chưa xác minh được mô-đun "Đội ngũ Kinh doanh" (`/sales`) có bị hủy theo mô hình thương mại điện tử hay không.
