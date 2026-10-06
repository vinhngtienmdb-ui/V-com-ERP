# QT-34 — Vận hành VComm Hub

- Dự án: VComm
- Mã quy trình: QT-34
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-20 VComm Hub (`/vcomm-hub`)
- Hiện trạng mã nguồn: Đã có — có dịch vụ Hub với mã nhận hàng, nhắc hạn và xử lý không đến nhận

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên điểm Hub | Mở ca, tạo đơn tại quầy, xuất kho nội bộ | `src/services/hubService.ts:177`, `:135`, `:44` |
| Khách hàng | Nhận hàng tại điểm Hub bằng mã nhận hàng | `src/services/vcommHubService.ts:121` |
| Hệ thống | Nhắc hạn nhận hàng và áp phí khi không đến nhận | `src/services/vcommHubService.ts:43`, `:47` |

## 2. Điều kiện trước

- Đã có điểm Hub và nhân viên điểm Hub được phân ca.
- Đã cấu hình thời hạn nhận hàng và phí không đến nhận.

## 3. Luồng chính

1. Nhân viên điểm Hub mở ca làm việc (`hubService.ts:177`).
2. Đơn hàng được đưa về điểm Hub; hệ thống sinh mã nhận hàng (`vcommHubService.ts:121`).
3. Hệ thống tính thời hạn nhận hàng (`vcommHubService.ts:41`).
4. Hệ thống nhắc khách trước 72 giờ và 48 giờ (`vcommHubService.ts:43`, `:45`).
5. Khách đến nhận hàng bằng mã nhận hàng; nhân viên xác nhận và xuất kho.
6. Nếu khách không đến nhận, hệ thống áp phí theo tỉ lệ cấu hình (`vcommHubService.ts:47`).
7. Đơn tại quầy tạo trực tiếp qua dịch vụ tạo đơn điểm bán (`hubService.ts:135`).

## 4. Sơ đồ

```
[Mở ca điểm Hub :177]
        |
        v
[Đơn về Hub] --> [generatePickupCode :121]
        |
        v
[Tính thời hạn nhận hàng :41]
        |
        v
[Nhắc 72 giờ :43] --> [Nhắc 48 giờ :45]
        |
        +-----------+-----------+
        |                       |
        v                       v
[Khách nhận hàng]        [Không đến nhận]
        |                       |
        v                       v
[Xuất kho nội bộ :44]   [Áp phí :47]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Khách nhận hàng sau thời hạn | Áp phí không đến nhận theo tỉ lệ cấu hình | `src/services/vcommHubService.ts:47` |
| E2 | Mã nhận hàng sai hoặc hết hiệu lực | Từ chối xuất hàng | `src/services/vcommHubService.ts:121` |
| E3 | Xuất kho nội bộ cho đơn không tồn tại | Chặn tạo phiếu xuất | `src/services/hubService.ts:44` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Ca làm việc: Đã mở --> Đã đóng
Đơn tại Hub: Chờ nhận --> Đã nhận --> Không đến nhận
Đơn tại quầy: Mới --> Đã thanh toán --> Đã xuất kho
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Thời hạn nhận hàng tính từ lúc đơn về Hub | `src/services/vcommHubService.ts:41` |
| BR-02 | Nhắc khách hai mốc 72 giờ và 48 giờ trước hạn | `src/services/vcommHubService.ts:43`, `:45` |
| BR-03 | Phí không đến nhận áp theo tỉ lệ cấu hình | `src/services/vcommHubService.ts:47` |
| BR-04 | Đơn tại quầy ghi nhận doanh thu qua hàng đợi ra kế toán | `src/services/accountingOutbox.ts:70` |

## 8. Thông báo và nhật ký

- Nhắc khách nhận hàng trước 72 giờ và 48 giờ (`src/services/vcommHubService.ts:43`, `:45`).
- Chưa xác minh được kênh nhắc là tin nhắn hay thư điện tử.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng điểm Hub | Mã điểm, địa chỉ, nhân viên phụ trách | `src/services/hubService.ts:177` |
| Bảng đơn tại Hub | Mã đơn, mã nhận hàng, thời hạn, trạng thái | `src/services/vcommHubService.ts:121` |
| Bảng ca làm việc | Nhân viên, thời gian mở, thời gian đóng | `src/services/hubService.ts:177` |
| Bảng phí không đến nhận | Tỉ lệ phí, điều kiện áp | `src/services/vcommHubService.ts:47` |

## 10. Màn hình

- VComm Hub (`src/components/VCommHub.tsx`, tuyến `/vcomm-hub`, 685 dòng).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đơn về Hub, Khi hệ thống sinh mã, Thì khách nhận được mã nhận hàng.
- **AC-02.** Cho đơn còn 72 giờ là hết hạn, Khi đến mốc nhắc, Thì khách nhận thông báo nhắc (ca bắt buộc).
- **AC-03.** Cho khách không đến nhận, Khi quá hạn, Thì hệ thống áp phí theo tỉ lệ cấu hình.
- **AC-04.** Cho mã nhận hàng sai, Khi xuất hàng, Thì hệ thống từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại dịch vụ Hub và màn hình đã có.
- Cần bổ sung chính sách thời hạn và phí không đến nhận nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Mỗi điểm Hub có nhân viên mở ca và đóng ca theo ngày.
- **Q-01.** Thời hạn nhận hàng tại Hub là bao nhiêu giờ?
- **Q-02.** Tỉ lệ phí không đến nhận là bao nhiêu?

## 14. Ghi chú kỹ thuật

- Các mốc thời gian và tỉ lệ phí đã được khai báo thành hằng số có tên (`vcommHubService.ts:41` đến `:49`), thuận lợi khi chỉnh chính sách.

## Chưa xác minh được

- Chưa xác minh được giá trị cụ thể của thời hạn nhận hàng và tỉ lệ phí.
- Chưa xác minh được kênh nhắc khách.
- Chưa xác minh được luồng đối soát tiền mặt tại điểm Hub.
