# QT-36 — KOL, KOC và Tiếp thị liên kết

- Dự án: VComm
- Mã quy trình: QT-36
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-22 KOL, KOC và Affiliate (`/affiliate`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình quản lý và thiết lập hoa hồng theo ngành hàng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên marketing | Quản lý danh sách KOL, KOC và thiết lập hoa hồng theo ngành hàng | `src/components/Affiliate.tsx:85`, `:251` |
| Cộng tác viên | Nhận liên kết, theo dõi hoa hồng | `src/components/Affiliate.tsx:85` |
| Hệ thống | Tính hoa hồng và khấu trừ thuế trên hoa hồng | `src/services/commissionWithholdingService.ts:77` |

## 2. Điều kiện trước

- Đã có danh mục ngành hàng và tỉ lệ hoa hồng tương ứng.
- Đã có quy tắc khấu trừ thuế đối với thu nhập của cộng tác viên.

## 3. Luồng chính

1. Nhân viên marketing đăng ký cộng tác viên và gán mã theo dõi.
2. Thiết lập tỉ lệ hoa hồng theo từng ngành hàng (`Affiliate.tsx:251`).
3. Khách mua qua liên kết; hệ thống ghi nhận đơn gắn mã cộng tác viên.
4. Khi đơn hoàn tất, hệ thống tính hoa hồng theo tỉ lệ ngành hàng.
5. Hệ thống tính khấu trừ thuế trên hoa hồng (`commissionWithholdingService.ts:77`).
6. Chi trả hoa hồng đã trừ thuế cho cộng tác viên.

## 4. Sơ đồ

```
[Đăng ký cộng tác viên + mã theo dõi]
            |
            v
[Thiết lập hoa hồng theo ngành hàng :251]
            |
            v
[Khách mua qua liên kết] --> [Ghi nhận đơn gắn mã]
            |
            v
[Đơn hoàn tất] --> [Tính hoa hồng]
            |
            v
[buildCommissionWithholding :77] --> [Chi trả hoa hồng đã trừ thuế]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Ngành hàng chưa có tỉ lệ hoa hồng | Không tính được hoa hồng; yêu cầu cấu hình trước | `src/components/Affiliate.tsx:251` |
| E2 | Đơn bị hủy hoặc đổi trả | Hoa hồng bị thu hồi | `src/components/Affiliate.tsx:85` |
| E3 | Thiếu thông tin thuế của cộng tác viên | Không chi trả được; yêu cầu bổ sung | `src/services/commissionWithholdingService.ts:77` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Cộng tác viên: Mới --> Đang hoạt động --> Tạm ngưng
Hoa hồng: Chờ tính --> Đã tính --> Chờ chi trả --> Đã chi trả / Đã thu hồi
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Tỉ lệ hoa hồng thiết lập theo ngành hàng, không gắn cứng | `src/components/Affiliate.tsx:251` |
| BR-02 | Hoa hồng chỉ tính trên đơn hoàn tất | `src/components/Affiliate.tsx:85` |
| BR-03 | Hoa hồng phải qua khấu trừ thuế trước khi chi trả | `src/services/commissionWithholdingService.ts:77` |

## 8. Thông báo và nhật ký

- Chưa xác minh được có thông báo cho cộng tác viên khi hoa hồng được ghi nhận hay không.
- Chưa xác minh được nhật ký kiểm toán cho thay đổi tỉ lệ hoa hồng.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng cộng tác viên | Mã, tên, mã theo dõi, trạng thái | `src/components/Affiliate.tsx:85` |
| Bảng tỉ lệ hoa hồng | Ngành hàng, tỉ lệ | `src/components/Affiliate.tsx:251` |
| Bảng hoa hồng phát sinh | Đơn hàng, số tiền, thuế khấu trừ, trạng thái chi trả | `src/services/commissionWithholdingService.ts:77` |

## 10. Màn hình

- Quản lý KOL, KOC và Affiliate (`src/components/Affiliate.tsx:85`).
- Thiết lập Hoa hồng Affiliate theo ngành hàng (`src/components/Affiliate.tsx:251`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đơn hoàn tất gắn mã cộng tác viên, Khi tính hoa hồng, Thì số tiền theo tỉ lệ ngành hàng.
- **AC-02.** Cho ngành hàng chưa cấu hình tỉ lệ, Khi tính hoa hồng, Thì hệ thống không tính và báo thiếu cấu hình (ca thất bại bắt buộc).
- **AC-03.** Cho hoa hồng phát sinh, Khi chi trả, Thì đã trừ thuế theo quy định (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình quản lý cộng tác viên và dịch vụ khấu trừ thuế.
- Cần bổ sung bảng hoa hồng phát sinh nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Cộng tác viên là cá nhân, có thu nhập phải khấu trừ thuế.
- **Q-01.** Tỉ lệ hoa hồng theo ngành hàng như thế nào?
- **Q-02.** Hoa hồng bị thu hồi khi đơn đổi trả hay chỉ giảm một phần?

## 14. Ghi chú kỹ thuật

- Dịch vụ khấu trừ thuế hoa hồng là hàm thuần, kiểm thử được độc lập (`commissionWithholdingService.ts:77`).

## Chưa xác minh được

- Chưa xác minh được tỉ lệ hoa hồng đang áp dụng.
- Chưa xác minh được quy tắc thu hồi hoa hồng khi đổi trả.
- Chưa xác minh được luồng chi trả hoa hồng.
