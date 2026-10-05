# QT-57 — Phân tích Dữ liệu và Báo cáo Quản trị

- Dự án: VComm
- Mã quy trình: QT-57
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-03 Phân tích dữ liệu (`/bi`, `/analytics`)
- Hiện trạng mã nguồn: Đã có — màn hình phân tích dữ liệu với nhiều nhóm báo cáo và giám sát gian lận

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Ban điều hành | Xem báo cáo tổng hợp, lãi gộp, hiệu quả kênh | `src/components/AnalyticsBI.tsx:414` |
| Nhân viên phân tích | Khai thác báo cáo theo nhóm và theo kỳ | `src/components/AnalyticsBI.tsx:808`, `:827` |
| Hệ thống | Phát hiện gian lận và cảnh báo bất thường | `src/components/AnalyticsBI.tsx:990` |

## 2. Điều kiện trước

- Dữ liệu giao dịch, đơn hàng và tài chính đã được ghi nhận.
- Đã có quyền truy cập báo cáo theo vai trò.

## 3. Luồng chính

1. Người dùng chọn nhóm báo cáo và kỳ phân tích.
2. Hệ thống tổng hợp dữ liệu từ các phân hệ liên quan.
3. Hệ thống hiển thị báo cáo lãi gộp combo và sản phẩm (`AnalyticsBI.tsx:808`).
4. Hệ thống hiển thị hiệu quả kênh cộng tác viên và người bán (`AnalyticsBI.tsx:827`).
5. Hệ thống hiển thị hiệu quả mua chung (`AnalyticsBI.tsx:851`).
6. Hệ thống chạy giám sát gian lận và đưa ra cảnh báo (`AnalyticsBI.tsx:990`).
7. Người dùng kết xuất báo cáo nếu cần.

## 4. Sơ đồ

```
[Chọn nhóm báo cáo + kỳ]
            |
            v
[Tổng hợp dữ liệu từ các phân hệ]
            |
    +-------+-------+-------+
    |               |       |
    v               v       v
[Lãi gộp :808]  [Hiệu quả kênh :827]  [Mua chung :851]
    |               |       |
    +-------+-------+-------+
            |
            v
[Giám sát gian lận :990] --> [Cảnh báo bất thường]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Dữ liệu đầu vào chưa đầy đủ trong kỳ | Báo cáo thiếu chính xác; cần cảnh báo dữ liệu thiếu | `src/components/AnalyticsBI.tsx:414` |
| E2 | Người dùng không có quyền xem báo cáo | Từ chối truy cập | `server.ts:384` |
| E3 | Phát hiện dấu hiệu gian lận | Đưa vào danh sách cảnh báo | `src/components/AnalyticsBI.tsx:990` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Báo cáo: Chưa tổng hợp --> Đang tổng hợp --> Đã hiển thị --> Đã kết xuất
Cảnh báo gian lận: Mới --> Đang xác minh --> Đã xử lý / Đã bác bỏ
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Báo cáo chỉ tổng hợp trong phạm vi dữ liệu người dùng được phép xem | `server.ts:384` |
| BR-02 | Cảnh báo gian lận sinh từ quy tắc giám sát, không phải kết luận cuối cùng | `src/components/AnalyticsBI.tsx:990` |
| BR-03 | Số liệu báo cáo phải khớp với sổ kế toán đã ghi | `src/components/Finance.tsx:1493` |

## 8. Thông báo và nhật ký

- Cảnh báo bất thường hiển thị trên màn hình phân tích.
- Chưa xác minh được có thông báo đẩy khi phát hiện gian lận hay không.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng đơn hàng | Doanh thu, giá vốn, kênh bán | `src/components/AnalyticsBI.tsx:808` |
| Bảng kênh bán | Cộng tác viên, người bán, hiệu quả | `src/components/AnalyticsBI.tsx:827` |
| Bảng cảnh báo gian lận | Đối tượng, dấu hiệu, trạng thái | `src/components/AnalyticsBI.tsx:990` |

## 10. Màn hình

- Business Intelligence (`src/components/AnalyticsBI.tsx:414`, tuyến `/bi` và `/analytics`, 1.031 dòng).
- Lãi Gộp Combo và Sản phẩm (`src/components/AnalyticsBI.tsx:808`).
- Hiệu Quả Kênh CTV và Sellers (`src/components/AnalyticsBI.tsx:827`).
- Hiệu Quả Mua Chung (`src/components/AnalyticsBI.tsx:851`).
- Giám sát gian lận (`src/components/AnalyticsBI.tsx:990`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho kỳ có đủ dữ liệu, Khi mở báo cáo, Thì số liệu khớp với sổ kế toán.
- **AC-02.** Cho người dùng không có quyền, Khi mở báo cáo, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho giao dịch khớp quy tắc giám sát, Khi chạy, Thì sinh cảnh báo gian lận (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình phân tích dữ liệu đã có.
- Cần bổ sung quy tắc giám sát gian lận nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Báo cáo tổng hợp theo ngày, tuần, tháng và quý.
- **Q-01.** Những quy tắc giám sát gian lận nào cần áp dụng?
- **Q-02.** Có cần xuất báo cáo theo định dạng tệp bảng tính không?

## 14. Ghi chú kỹ thuật

- Có tiện ích kết xuất tệp bảng tính dùng chung (`src/lib/exportExcel.ts`).

## Chưa xác minh được

- Chưa xác minh được bộ quy tắc giám sát gian lận.
- Chưa xác minh được chu kỳ tổng hợp báo cáo.
- Chưa xác minh được phạm vi phân quyền xem báo cáo.
