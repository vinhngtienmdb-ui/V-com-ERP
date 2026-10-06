# QT-49 — Tuân thủ và Bảo vệ Thương hiệu

- Dự án: VComm
- Mã quy trình: QT-49
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-28 Tuân thủ và Pháp chế (`/compliance`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình tuân thủ và bảo vệ thương hiệu, quy mô nhỏ

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên tuân thủ | Theo dõi vi phạm, xử lý hàng giả và bảo vệ thương hiệu | `src/components/Compliance.tsx:84` |
| Hệ thống | Giám sát tuân thủ tự động | `src/components/Compliance.tsx:312` |
| Người dùng | Đồng ý hoặc rút lại sự đồng ý về dữ liệu cá nhân | `src/services/consentService.ts:46`, `:71` |

## 2. Điều kiện trước

- Đã có chính sách tuân thủ và chính sách bảo vệ dữ liệu cá nhân.
- Đã có quy trình tiếp nhận báo cáo vi phạm.

## 3. Luồng chính

1. Hệ thống giám sát tuân thủ và phát hiện dấu hiệu vi phạm (`Compliance.tsx:312`).
2. Nhân viên tuân thủ tiếp nhận và xác minh báo cáo vi phạm.
3. Xử lý vi phạm theo chính sách, có thể áp chế tài lên người bán.
4. Với dữ liệu cá nhân, người dùng đồng ý hoặc rút lại sự đồng ý (`consentService.ts:46`, `:71`).
5. Hệ thống ghi nhận và lưu vết các thay đổi về sự đồng ý.
6. Hệ thống hỗ trợ người dùng xuất dữ liệu cá nhân khi có yêu cầu (`consentService.ts:121`).

## 4. Sơ đồ

```
[Giám sát tuân thủ :312]
            |
            v
[Tiếp nhận và xác minh báo cáo vi phạm]
            |
    +-------+-------+
    |               |
    v               v
[Xử lý vi phạm]  [Sự đồng ý dữ liệu cá nhân]
    |               |
    v               v
[Áp chế tài]    [grantConsent :46 / withdrawConsent :71]
                    |
                    v
            [Lưu vết + exportSubjectData :121]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Báo cáo vi phạm thiếu bằng chứng | Trả lại yêu cầu bổ sung | `src/components/Compliance.tsx:84` |
| E2 | Người dùng rút lại sự đồng ý bắt buộc | Xử lý theo chính sách, có thể hạn chế dịch vụ | `src/services/consentService.ts:41` |
| E3 | Yêu cầu xóa tài khoản khi còn nghĩa vụ pháp lý | Từ chối tạm thời và giải thích lý do | `src/services/consentService.ts:121` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Báo cáo vi phạm: Tiếp nhận --> Đang xác minh --> Đã xử lý / Đã bác bỏ
Sự đồng ý: Chưa đồng ý --> Đã đồng ý --> Đã rút lại
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Chính sách dữ liệu cá nhân có phiên bản hiện hành và phải được ghi nhận khi người dùng đồng ý | `src/services/consentService.ts:37` |
| BR-02 | Sự đồng ý bắt buộc không thể rút lại nếu là điều kiện cung cấp dịch vụ | `src/services/consentService.ts:41` |
| BR-03 | Người dùng có quyền xuất dữ liệu cá nhân của mình | `src/services/consentService.ts:121` |

## 8. Thông báo và nhật ký

- Thông báo cho nhân viên tuân thủ khi có báo cáo vi phạm mới.
- Chưa xác minh được thông báo cho người bán khi bị áp chế tài.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng báo cáo vi phạm | Đối tượng, nội dung, bằng chứng, trạng thái | `src/components/Compliance.tsx:84` |
| Bảng sự đồng ý | Người dùng, mục đích, phiên bản chính sách, trạng thái | `src/services/consentService.ts:89` |
| Bảng chế tài | Vi phạm, mức chế tài, thời điểm | `src/components/Sellers.tsx:458` |

## 10. Màn hình

- Pháp chế và Bảo vệ thương hiệu (`src/components/Compliance.tsx:84`, tuyến `/compliance`, 344 dòng).
- Giám sát tuân thủ (`src/components/Compliance.tsx:312`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho người dùng đồng ý chính sách dữ liệu, Khi lưu, Thì hệ thống ghi nhận phiên bản chính sách đã đồng ý (ca bắt buộc).
- **AC-02.** Cho mục đích đồng ý bắt buộc, Khi người dùng rút lại, Thì hệ thống xử lý theo chính sách (ca bắt buộc).
- **AC-03.** Cho người dùng yêu cầu xuất dữ liệu, Khi thực hiện, Thì hệ thống trả về dữ liệu cá nhân của người đó.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình tuân thủ và dịch vụ đồng ý dữ liệu cá nhân.
- Cần bổ sung chính sách tuân thủ và quy trình tiếp nhận báo cáo nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Chính sách dữ liệu cá nhân áp dụng cho toàn bộ người dùng hệ thống.
- **Q-01.** Các mục đích thu thập dữ liệu nào là bắt buộc?
- **Q-02.** Thời hạn xử lý yêu cầu xóa tài khoản là bao lâu?

## 14. Ghi chú kỹ thuật

- Dịch vụ đồng ý dữ liệu cá nhân là hàm thuần theo phiên bản chính sách, kiểm thử được độc lập.

## Chưa xác minh được

- Chưa xác minh được danh sách mục đích thu thập dữ liệu bắt buộc.
- Chưa xác minh được thời hạn xử lý yêu cầu xóa tài khoản.
- Chưa xác minh được phạm vi giám sát tuân thủ tự động.
