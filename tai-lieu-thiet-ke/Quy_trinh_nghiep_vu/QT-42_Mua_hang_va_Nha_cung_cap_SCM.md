# QT-42 — Mua hàng và Nhà cung cấp

- Dự án: VComm
- Mã quy trình: QT-42
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-27 Mua hàng và Nhà cung cấp (`/scm`) và Cổng Nhà cung cấp (`/supplier-portal`)
- Hiện trạng mã nguồn: Đã có — màn hình mua hàng, đề xuất mua, in đơn đặt hàng và cổng nhà cung cấp

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên mua hàng | Tạo đề xuất mua hàng, lập đơn đặt hàng | `src/components/Procurement.tsx:370`, `:548` |
| Nhà cung cấp | Nhận đơn đặt hàng, xác nhận giao hàng qua cổng riêng | `src/components/SupplierPortal.tsx:336` |
| Kế toán công nợ | Theo dõi công nợ nhà cung cấp và đối chiếu | `src/components/Procurement.tsx:110` |
| Hệ thống | Đồng bộ nhà cung cấp sang hệ thống kế toán | `src/services/misaService.ts:159` |

## 2. Điều kiện trước

- Đã có danh mục nhà cung cấp và danh mục vật tư hàng hóa.
- Đã có ngưỡng phê duyệt đề xuất mua hàng.

## 3. Luồng chính

1. Nhân viên mua hàng lập phiếu đề xuất mua hàng (`Procurement.tsx:370`).
2. Phiếu đề xuất được duyệt theo ngưỡng đã cấu hình.
3. Lập đơn đặt hàng gửi nhà cung cấp và in phiếu đơn đặt hàng (`Procurement.tsx:548`).
4. Nhà cung cấp truy cập cổng riêng để xem đơn và xác nhận giao hàng (`SupplierPortal.tsx:336`).
5. Hệ thống sinh mã tra cứu phiếu giao hàng (`SupplierPortal.tsx:592`).
6. Hàng về, thủ kho nhập kho và kế toán ghi nhận công nợ.
7. Hệ thống đồng bộ nhà cung cấp sang hệ thống kế toán (`misaService.ts:159`).

## 4. Sơ đồ

```
[Phiếu Đề xuất mua hàng :370] --> [Duyệt theo ngưỡng]
                                            |
                                            v
                        [Đơn đặt hàng + in phiếu :548]
                                            |
                                            v
                        [Cổng Nhà cung cấp :336]
                                            |
                                            v
                        [Mã QR Phiếu giao hàng :592]
                                            |
                                            v
                        [Nhập kho] --> [Ghi nhận công nợ]
                                            |
                                            v
                        [Đồng bộ nhà cung cấp :159]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Đề xuất mua vượt ngưỡng chưa được duyệt | Chặn lập đơn đặt hàng | `src/components/Procurement.tsx:370` |
| E2 | Nhà cung cấp chưa có mã tra cứu | Không xem được đơn trên cổng | `src/components/SupplierPortal.tsx:592` |
| E3 | Đồng bộ nhà cung cấp sang hệ thống kế toán thất bại | Ghi nhận thất bại và thử lại | `src/services/writeFailure.ts:52` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Đề xuất mua: Nháp --> Chờ duyệt --> Đã duyệt --> Đã lập đơn
Đơn đặt hàng: Đã gửi --> Đã xác nhận --> Đang giao --> Đã nhận hàng --> Đã thanh toán
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Đề xuất mua hàng phải được duyệt trước khi lập đơn đặt hàng | `src/components/Procurement.tsx:370` |
| BR-02 | Nhà cung cấp xem đơn qua mã tra cứu, không cần tài khoản nội bộ | `src/components/SupplierPortal.tsx:592` |
| BR-03 | Nhà cung cấp được đồng bộ sang hệ thống kế toán | `src/services/misaService.ts:159` |

## 8. Thông báo và nhật ký

- Thông báo cho nhà cung cấp khi có đơn đặt hàng mới.
- Ghi nhận lỗi ghi dữ liệu để thử lại (`src/services/writeFailure.ts:52`).

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng nhà cung cấp | Mã, tên, mã số thuế, điều khoản thanh toán | `src/components/Procurement.tsx:110` |
| Bảng đề xuất mua hàng | Mặt hàng, số lượng, người đề xuất, trạng thái | `src/components/Procurement.tsx:370` |
| Bảng đơn đặt hàng | Số đơn, nhà cung cấp, mặt hàng, giá trị | `src/components/Procurement.tsx:548` |
| Bảng mã tra cứu giao hàng | Mã, đơn, trạng thái | `src/components/SupplierPortal.tsx:592` |

## 10. Màn hình

- Mua hàng và Nhà cung cấp (`src/components/Procurement.tsx:695`, tuyến `/scm`, 817 dòng).
- Quản lý Nhà cung cấp (`src/components/Procurement.tsx:110`).
- Phiếu Đề xuất mua hàng (`src/components/Procurement.tsx:370`).
- Chi tiết Đơn đặt hàng (`src/components/Procurement.tsx:548`).
- Cổng Nhà cung cấp (`src/components/SupplierPortal.tsx:336`, tuyến `/supplier-portal`, 624 dòng).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đề xuất mua đã duyệt, Khi lập đơn đặt hàng, Thì đơn được tạo và gửi nhà cung cấp.
- **AC-02.** Cho đề xuất mua chưa duyệt, Khi lập đơn đặt hàng, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho nhà cung cấp có mã tra cứu, Khi truy cập cổng, Thì xem được đơn và phiếu giao hàng.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình mua hàng và cổng nhà cung cấp đã có.
- Cần bổ sung ngưỡng phê duyệt đề xuất mua nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Nhà cung cấp truy cập cổng bằng mã tra cứu, chưa có tài khoản riêng.
- **Q-01.** Ngưỡng phê duyệt đề xuất mua theo giá trị như thế nào?
- **Q-02.** Có cần tài khoản riêng cho nhà cung cấp không?

## 14. Ghi chú kỹ thuật

- Có cơ chế ghi nhận lỗi ghi dữ liệu và mô tả lỗi (`src/services/writeFailure.ts:37`).
- Màn hình mua hàng và cổng nhà cung cấp tách riêng, thuận lợi phân quyền.

## Chưa xác minh được

- Chưa xác minh được ngưỡng phê duyệt đề xuất mua.
- Chưa xác minh được cơ chế xác thực cho cổng nhà cung cấp.
- Chưa xác minh được luồng đối chiếu công nợ nhà cung cấp.
