# QT-58 — Cấu hình Hệ thống và Tích hợp

- Dự án: VComm
- Mã quy trình: QT-58
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-44 Cấu hình hệ thống (`/settings`)
- Hiện trạng mã nguồn: Đã có — màn hình cấu hình lớn nhất kho mã, gồm cấu hình ví, tích hợp và giao diện

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Quản trị hệ thống | Cấu hình giao diện, ví, tích hợp và cờ tính năng | `src/components/Settings.tsx:1299`, `:1466` |
| Kế toán trưởng | Thiết lập ngày khóa sổ | `src/services/dbService.ts:1899` |
| Hệ thống | Kiểm tra cấu hình và thử kết nối nhà cung cấp | `src/services/integrationConfigService.ts:137`, `:184` |

## 2. Điều kiện trước

- Người dùng có quyền quản trị hệ thống.
- Đã có thông tin xác thực của nhà cung cấp dịch vụ cần tích hợp.

## 3. Luồng chính

1. Quản trị viên mở màn hình cấu hình và chọn nhóm cấu hình (`Settings.tsx:1299`).
2. Thiết lập màu sắc chủ đạo và bo góc bảng biểu (`Settings.tsx:1414`, `:1430`).
3. Cấu hình ví và quy tắc điều chuyển số dư (`Settings.tsx:1466`, `:1542`).
4. Cấu hình tích hợp nhà cung cấp dịch vụ (`integrationConfigService.ts:137`).
5. Hệ thống kiểm tra lược đồ cấu hình theo nhà cung cấp (`integrationConfigService.ts:40`).
6. Hệ thống thử kết nối nhà cung cấp (`integrationConfigService.ts:184`).
7. Bật hoặc tắt cờ tính năng theo từng phạm vi (`featureFlagService.ts:146`).
8. Thiết lập ngày khóa sổ kế toán (`dbService.ts:1899`).

## 4. Sơ đồ

```
[Mở cấu hình :1299]
        |
    +---+---+---+---+
    |       |       |
    v       v       v
[Giao diện]  [Ví và điều chuyển số dư]  [Tích hợp nhà cung cấp]
    |               |                       |
    v               v                       v
[Theme]      [Transfer Rules :1542]   [PROVIDER_SCHEMAS :40]
                                            |
                                            v
                                [testIntegrationConnection :184]
                                            |
                                            v
                                    [Cờ tính năng :146]
                                            |
                                            v
                                [Ngày khóa sổ :1899]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Cấu hình nhà cung cấp thiếu trường bắt buộc | Chặn lưu theo lược đồ | `src/services/integrationConfigService.ts:40` |
| E2 | Thử kết nối nhà cung cấp thất bại | Báo lỗi kết nối, giữ cấu hình cũ | `src/services/integrationConfigService.ts:184` |
| E3 | Cấu hình bí mật giả hoặc để trống | Từ chối lưu | `src/services/integrationConfigService.ts:137` |
| E4 | Thiếu quyền quản trị | HTTP 401 hoặc 403 | `server.ts:384` |

## 6. Máy trạng thái

```
Cấu hình: Mặc định --> Đã chỉnh sửa --> Đã lưu --> Đã kích hoạt
Tích hợp: Chưa cấu hình --> Đã cấu hình --> Đã kiểm tra kết nối --> Đang bật / Đang tắt
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Cấu hình nhà cung cấp phải khớp lược đồ khai báo trước khi lưu | `src/services/integrationConfigService.ts:40` |
| BR-02 | Thay đổi cấu hình tích hợp phát sinh sự kiện thông báo cho các bên liên quan | `src/services/integrationConfigService.ts:96` |
| BR-03 | Cờ tính năng đọc theo phạm vi và có bộ nhớ đệm | `src/services/featureFlagService.ts:62` |
| BR-04 | Ngày khóa sổ chặn ghi chứng từ có ngày hạch toán nhỏ hơn hoặc bằng ngày đó | `src/services/dbService.ts:1907` |

## 8. Thông báo và nhật ký

- Thông báo cho các bên liên quan khi cấu hình tích hợp thay đổi (`src/services/integrationConfigService.ts:96`).
- Chưa xác minh được nhật ký kiểm toán cho thay đổi cấu hình hệ thống.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng cấu hình tích hợp | Nhà cung cấp, thông tin xác thực, trạng thái | `src/services/integrationConfigService.ts:115` |
| Bảng cờ tính năng | Tên cờ, phạm vi, giá trị | `src/services/featureFlagService.ts:50` |
| `tenant_settings` | `data.closingLockDate`, cấu hình giao diện | `src/services/dbService.ts:1899` |
| Bảng cấu hình ví | Quy tắc điều chuyển số dư | `src/components/Settings.tsx:1542` |

## 10. Màn hình

- Cấu hình và Tích hợp Hệ thống (`src/components/Settings.tsx:1299`, tuyến `/settings`, 6.328 dòng).
- Màu sắc chủ đạo (`src/components/Settings.tsx:1414`).
- Cấu hình ví và Payout (`src/components/Settings.tsx:1466`).
- Quy tắc điều chuyển số dư (`src/components/Settings.tsx:1542`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho cấu hình nhà cung cấp đúng lược đồ, Khi lưu, Thì hệ thống chấp nhận và phát sự kiện thông báo.
- **AC-02.** Cho cấu hình thiếu trường bắt buộc, Khi lưu, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho cấu hình bí mật giả, Khi lưu, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-04.** Cho ngày khóa sổ đã thiết lập, Khi ghi chứng từ trong kỳ đã khóa, Thì hệ thống từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình cấu hình và các dịch vụ cấu hình tích hợp, cờ tính năng.
- Màn hình cấu hình là màn hình lớn nhất kho mã (6.328 dòng), nên cân nhắc tách nhỏ theo nhóm cấu hình.

## 13. Giả định và câu hỏi mở

- **GD-01.** Chỉ quản trị hệ thống được thay đổi cấu hình tích hợp và cờ tính năng.
- **Q-01.** Có bao nhiêu nhà cung cấp dịch vụ cần tích hợp?
- **Q-02.** Có cần nhật ký kiểm toán cho mọi thay đổi cấu hình không?

## 14. Ghi chú kỹ thuật

- Cấu hình tích hợp kiểm tra theo lược đồ khai báo trước, tránh lưu cấu hình sai (`integrationConfigService.ts:40`).
- Cờ tính năng có bộ nhớ đệm theo thời gian sống (`src/services/featureFlagService.ts:62`).
- Bí mật cấu hình phải bị từ chối nếu là giá trị giả hoặc để trống (`integrationConfigService.ts:137`).

## Chưa xác minh được

- Chưa xác minh được danh sách nhà cung cấp dịch vụ đã hỗ trợ.
- Chưa xác minh được phạm vi nhật ký kiểm toán cho thay đổi cấu hình.
- Chưa xác minh được cơ chế mã hóa thông tin xác thực đã lưu.
