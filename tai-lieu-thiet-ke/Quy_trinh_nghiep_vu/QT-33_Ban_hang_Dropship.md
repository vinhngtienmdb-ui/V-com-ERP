# QT-33 — Bán hàng Dropship

- Dự án: VComm
- Mã quy trình: QT-33
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-19 Dropship (`/dropship`)
- Hiện trạng mã nguồn: Đã có — có dịch vụ dropship với tính toán tài chính đơn hàng và quản lý đối tác

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Đối tác dropship | Đăng ký, niêm yết sản phẩm, bán hàng | `src/services/dropshipService.ts:169`, `:198` |
| Nhân viên vận hành | Duyệt hoặc tạm ngưng đối tác | `src/services/dropshipService.ts:221` |
| Hệ thống | Tính lợi nhuận đơn hàng và biên lợi nhuận niêm yết | `src/services/dropshipService.ts:97`, `:134` |

## 2. Điều kiện trước

- Đã có nguồn hàng và giá nhập.
- Đã có chính sách hoa hồng và biên lợi nhuận tối thiểu.

## 3. Luồng chính

1. Đối tác dropship đăng ký và được duyệt (`dropshipService.ts:169`).
2. Đối tác niêm yết sản phẩm; hệ thống tính biên lợi nhuận niêm yết (`dropshipService.ts:134`).
3. Khi có đơn, hệ thống tính toán tài chính đơn hàng (`dropshipService.ts:97`).
4. Hệ thống đối chiếu với biên lợi nhuận tối thiểu đã cấu hình.
5. Nếu đối tác vi phạm, nhân viên vận hành tạm ngưng đối tác (`dropshipService.ts:221`).

## 4. Sơ đồ

```
[Đối tác đăng ký :169] --> [Niêm yết sản phẩm]
                                    |
                                    v
                    [computeListingUnitMargin :134]
                                    |
                                    v
                            [Khách đặt hàng]
                                    |
                                    v
                    [computeOrderFinancials :97]
                                    |
                                    v
                    [Đối chiếu biên lợi nhuận tối thiểu]
                                    |
                                    v
                    [Vi phạm --> suspendPartner :221]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Biên lợi nhuận niêm yết dưới mức tối thiểu | Cảnh báo hoặc chặn niêm yết | `src/services/dropshipService.ts:134` |
| E2 | Đối tác bị tạm ngưng vẫn nhận đơn | Chặn nhận đơn | `src/services/dropshipService.ts:221` |
| E3 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Đối tác: Mới --> Đang hoạt động --> Tạm ngưng --> Đã chấm dứt
Đơn dropship: Mới --> Đã xác nhận --> Đang giao --> Hoàn tất
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Biên lợi nhuận niêm yết tính bằng hàm riêng và đối chiếu với mức tối thiểu | `src/services/dropshipService.ts:134` |
| BR-02 | Tính toán tài chính đơn hàng là hàm thuần theo dữ liệu đơn | `src/services/dropshipService.ts:97` |
| BR-03 | Đối tác bị tạm ngưng không nhận đơn mới | `src/services/dropshipService.ts:221` |

## 8. Thông báo và nhật ký

- Chưa xác minh được có thông báo cho đối tác khi bị tạm ngưng hay không.
- Chưa xác minh được nhật ký kiểm toán cho thay đổi trạng thái đối tác.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng đối tác dropship | Mã, tên, trạng thái, chính sách hoa hồng | `src/services/dropshipService.ts:142` |
| Bảng niêm yết sản phẩm | Sản phẩm, giá bán, biên lợi nhuận | `src/services/dropshipService.ts:134` |
| Bảng đơn dropship | Mã đơn, đối tác, giá trị, lợi nhuận | `src/services/dropshipService.ts:97` |

## 10. Màn hình

- Dropship (`src/components/Dropship.tsx`, tuyến `/dropship`, 1.152 dòng).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đối tác đăng ký đủ điều kiện, Khi duyệt, Thì đối tác được niêm yết sản phẩm.
- **AC-02.** Cho biên lợi nhuận dưới mức tối thiểu, Khi niêm yết, Thì hệ thống cảnh báo hoặc chặn (ca thất bại bắt buộc).
- **AC-03.** Cho đối tác bị tạm ngưng, Khi có đơn mới, Thì hệ thống không gán đơn cho đối tác đó (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại dịch vụ dropship và màn hình đã có.
- Cần bổ sung chính sách biên lợi nhuận tối thiểu nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Đối tác dropship không giữ hàng, chỉ niêm yết và bán.
- **Q-01.** Biên lợi nhuận tối thiểu là bao nhiêu phần trăm?
- **Q-02.** Ai chịu trách nhiệm vận chuyển và đổi trả trong đơn dropship?

## 14. Ghi chú kỹ thuật

- Tính toán tài chính đơn hàng là hàm thuần, thuận lợi cho kiểm thử và đối chiếu số liệu.

## Chưa xác minh được

- Chưa xác minh được chính sách biên lợi nhuận tối thiểu.
- Chưa xác minh được trách nhiệm vận chuyển và đổi trả.
- Chưa xác minh được luồng đối soát thanh toán với đối tác.
