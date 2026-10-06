# QT-43 — Chăm sóc Khách hàng và Tổng đài

- Dự án: VComm
- Mã quy trình: QT-43
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-06 Chăm sóc Khách hàng (`/cskh`)
- Hiện trạng mã nguồn: Đã có — có màn hình chăm sóc khách hàng, phân ca, tổng đài và các kênh mạng xã hội

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên chăm sóc khách hàng | Tiếp nhận và xử lý yêu cầu hỗ trợ | `src/components/CustomerService.tsx:434` |
| Trưởng nhóm chăm sóc khách hàng | Phân ca và chấm công cho nhân viên | `src/components/CustomerService.tsx:936` |
| Khách hàng | Liên hệ qua tổng đài, Facebook, Zalo | `src/components/CustomerService.tsx:1190`, `:1444`, `:1487` |
| Hệ thống | Tính hạn xử lý theo mức ưu tiên và lịch làm việc | `src/services/crmTicketService.ts:66`, `:117` |

## 2. Điều kiện trước

- Đã có lịch làm việc và mức ưu tiên của yêu cầu hỗ trợ.
- Đã cấu hình hạn xử lý theo mức ưu tiên.

## 3. Luồng chính

1. Khách hàng liên hệ qua tổng đài, Facebook hoặc Zalo; hệ thống tạo yêu cầu hỗ trợ.
2. Hệ thống xác định mức ưu tiên và tính hạn xử lý (`crmTicketService.ts:66`).
3. Hạn xử lý được tính theo lịch làm việc, có xét ngày nghỉ (`crmTicketService.ts:58`, `:117`).
4. Nhân viên chăm sóc tiếp nhận và xử lý yêu cầu.
5. Hệ thống cảnh báo khi yêu cầu sắp quá hạn (`crmTicketService.ts:77`).
6. Khi xử lý xong, nhân viên đóng yêu cầu và ghi nhận kết quả.
7. Hệ thống theo dõi phân ca và chấm công của nhân viên chăm sóc khách hàng.

## 4. Sơ đồ

```
[Kênh: tổng đài / Facebook / Zalo]
            |
            v
[Tạo yêu cầu hỗ trợ]
            |
            v
[SLA_HOURS_BY_PRIORITY :66] --> [nextWorkingMoment :117]
            |
            v
[Cảnh báo sắp quá hạn :77]
            |
            v
[Nhân viên xử lý]
            |
            v
[Đóng yêu cầu + ghi nhận kết quả]
            |
            v
[Phân ca và chấm công nhân viên :936]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Yêu cầu quá hạn xử lý | Cảnh báo sắp quá hạn và đánh dấu quá hạn | `src/services/crmTicketService.ts:77` |
| E2 | Hạn xử lý rơi vào ngày nghỉ | Dời sang thời điểm làm việc kế tiếp | `src/services/crmTicketService.ts:117` |
| E3 | Khách hàng liên hệ ngoài giờ | Ghi nhận yêu cầu và xử lý vào giờ làm việc kế tiếp | `src/services/crmTicketService.ts:58` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Yêu cầu hỗ trợ: Mới --> Đang xử lý --> Chờ khách phản hồi --> Đã đóng
Đang xử lý --quá hạn--> Quá hạn --> Đã đóng
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Hạn xử lý xác định theo mức ưu tiên | `src/services/crmTicketService.ts:66` |
| BR-02 | Hạn xử lý tính theo lịch làm việc, có xét ngày nghỉ | `src/services/crmTicketService.ts:58`, `:117` |
| BR-03 | Cảnh báo khi yêu cầu sắp quá hạn theo tỉ lệ cấu hình | `src/services/crmTicketService.ts:77` |

## 8. Thông báo và nhật ký

- Cảnh báo cho nhân viên khi yêu cầu sắp quá hạn.
- Có tệp kiểm thử cho dịch vụ yêu cầu hỗ trợ (`src/services/crmTicketService.test.ts`).

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng yêu cầu hỗ trợ | Mã, kênh, mức ưu tiên, hạn xử lý, trạng thái | `src/services/crmTicketService.ts:66` |
| Bảng lịch làm việc | Ngày làm việc, giờ làm việc | `src/services/crmTicketService.ts:58` |
| Bảng phân ca | Nhân viên, ca, ngày | `src/components/CustomerService.tsx:936` |
| Bảng hội thoại | Kênh, nội dung, trạng thái | `src/services/chatwootService.ts:117` |

## 10. Màn hình

- Chăm sóc Khách hàng (`src/components/CustomerService.tsx:434`, tuyến `/cskh`, 1.723 dòng).
- Bảng Phân Ca và Chấm Công CSKH (`src/components/CustomerService.tsx:936`).
- Tổng đài OmiCall (`src/components/CustomerService.tsx:1190`).
- Facebook Fanpage (`src/components/CustomerService.tsx:1444`).
- Zalo Official Account (`src/components/CustomerService.tsx:1487`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho yêu cầu ưu tiên cao, Khi tạo, Thì hạn xử lý ngắn hơn yêu cầu ưu tiên thấp.
- **AC-02.** Cho hạn xử lý rơi vào ngày nghỉ, Khi tính hạn, Thì hạn dời sang ngày làm việc kế tiếp.
- **AC-03.** Cho yêu cầu sắp quá hạn, Khi đến mốc cảnh báo, Thì nhân viên nhận cảnh báo (ca bắt buộc).
- **AC-04.** Cho yêu cầu đã đóng, Khi cập nhật thêm, Thì hệ thống chặn (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình chăm sóc khách hàng và dịch vụ yêu cầu hỗ trợ.
- Cần bổ sung mức ưu tiên và hạn xử lý tương ứng nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Lịch làm việc áp dụng chung cho toàn bộ nhân viên chăm sóc khách hàng.
- **Q-01.** Hạn xử lý theo từng mức ưu tiên là bao nhiêu giờ?
- **Q-02.** Có hỗ trợ trực ngoài giờ không?

## 14. Ghi chú kỹ thuật

- Lịch làm việc là tham số đầu vào của hàm tính hạn, không gắn cứng (`src/services/crmTicketService.ts:58`).
- Có tích hợp nền tảng hội thoại đa kênh (`src/services/chatwootService.ts:117`).

## Chưa xác minh được

- Chưa xác minh được hạn xử lý theo từng mức ưu tiên.
- Chưa xác minh được kênh hội thoại đang kết nối.
- Chưa xác minh được cơ chế trực ngoài giờ.
