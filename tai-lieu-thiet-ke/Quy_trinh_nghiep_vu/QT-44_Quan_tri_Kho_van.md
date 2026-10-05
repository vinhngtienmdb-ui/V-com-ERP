# QT-44 — Quản trị Kho vận

- Dự án: VComm
- Mã quy trình: QT-44
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-25 Quản trị Kho vận (`/warehouse`)
- Hiện trạng mã nguồn: Đã có — màn hình kho vận lớn nhất nhóm, có tối ưu tuyến đường giao hàng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Thủ kho | Tạo phiếu kho, xác nhận nhập xuất | `src/components/Warehouse.tsx:3525` |
| Nhân viên điều phối | Tối ưu tuyến đường giao hàng | `src/components/Warehouse.tsx:3108` |
| Người duyệt phiếu kho | Kiểm tra điều kiện duyệt phiếu | `src/services/warehouseVoucherApproval.ts:43` |

## 2. Điều kiện trước

- Đã có danh mục kho và mặt hàng.
- Đã có thông tin địa chỉ giao hàng để tối ưu tuyến.

## 3. Luồng chính

1. Tạo phiếu kho mới cho nghiệp vụ nhập, xuất hoặc chuyển kho (`Warehouse.tsx:3525`).
2. Kiểm tra điều kiện duyệt phiếu (`warehouseVoucherApproval.ts:43`).
3. Ghi sổ phiếu và cập nhật tồn kho.
4. Theo dõi danh sách đơn đang giao (`Warehouse.tsx:3059`).
5. Tối ưu tuyến đường giao hàng theo nhóm đơn (`Warehouse.tsx:3108`).
6. Xác nhận giao hàng và đối chiếu tiền thu hộ nếu có.

## 4. Sơ đồ

```
[Tạo phiếu kho :3525] --> [validateVoucherApproval :43]
                                |
                                v
                    [Ghi sổ + cập nhật tồn kho]
                                |
                                v
                    [Danh sách đơn đang giao :3059]
                                |
                                v
                    [Tối ưu tuyến đường giao :3108]
                                |
                                v
                    [Xác nhận giao + đối chiếu tiền thu hộ]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Phiếu kho chưa đủ điều kiện duyệt | Từ chối duyệt, trả lý do | `src/services/warehouseVoucherApproval.ts:43` |
| E2 | Tồn kho không đủ để xuất | Chặn xuất hoặc ghi âm tùy cấu hình | `src/components/Warehouse.tsx:3525` |
| E3 | Tuyến đường không tối ưu được do thiếu địa chỉ | Yêu cầu bổ sung địa chỉ | `src/components/Warehouse.tsx:3108` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Phiếu kho: Nháp --> Chờ duyệt --> Đã duyệt --> Đã ghi sổ
Đơn giao: Chờ giao --> Đang giao --> Đã giao --> Đã đối chiếu
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Phiếu kho phải qua kiểm tra điều kiện duyệt trước khi ghi sổ | `src/services/warehouseVoucherApproval.ts:43` |
| BR-02 | Tối ưu tuyến đường dựa trên nhóm đơn đang giao | `src/components/Warehouse.tsx:3108` |
| BR-03 | Tiền thu hộ phải được đối chiếu với chứng từ giao hàng | `src/services/codReconciliationService.ts:15` |

## 8. Thông báo và nhật ký

- Chưa xác minh được có thông báo cho khách khi đơn rời kho hay không.
- Chưa xác minh được nhật ký kiểm toán cho thao tác điều chỉnh phiếu kho.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng phiếu kho | Số phiếu, loại, kho, mặt hàng, số lượng, trạng thái | `src/components/Warehouse.tsx:3525` |
| Bảng tồn kho | Kho, mặt hàng, số lượng | `src/components/Warehouse.tsx` |
| Bảng đơn giao hàng | Mã đơn, địa chỉ, tuyến, trạng thái | `src/components/Warehouse.tsx:3059` |
| Bảng đối chiếu tiền thu hộ | Đơn, số tiền thu hộ, trạng thái đối chiếu | `src/services/codReconciliationService.ts:15` |

## 10. Màn hình

- Quản trị Kho vận (`src/components/Warehouse.tsx`, tuyến `/warehouse`, 3.794 dòng).
- Tạo phiếu kho mới (`src/components/Warehouse.tsx:3525`).
- Đơn đang giao (`src/components/Warehouse.tsx:3059`).
- Tối ưu Tuyến đường Giao hàng (`src/components/Warehouse.tsx:3108`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho phiếu kho đủ điều kiện, Khi duyệt, Thì tồn kho cập nhật đúng số lượng.
- **AC-02.** Cho phiếu kho chưa đủ điều kiện, Khi duyệt, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho nhóm đơn đang giao có địa chỉ hợp lệ, Khi tối ưu tuyến, Thì hệ thống trả về thứ tự giao đề xuất.
- **AC-04.** Cho đơn giao thành công có tiền thu hộ, Khi đối chiếu, Thì số tiền khớp chứng từ (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình kho vận và dịch vụ duyệt phiếu kho đã có.
- Cần bổ sung bảng đối chiếu tiền thu hộ nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Tối ưu tuyến đường dựa trên khoảng cách địa lý và khối lượng đơn.
- **Q-01.** Có kết nối đơn vị vận chuyển bên ngoài không?
- **Q-02.** Tiền thu hộ đối chiếu theo ngày hay theo chuyến giao?

## 14. Ghi chú kỹ thuật

- Màn hình kho vận là màn hình lớn thứ hai trong kho mã (3.794 dòng), nên cân nhắc tách nhỏ khi mở rộng.
- Có dịch vụ đối chiếu tiền thu hộ riêng (`src/services/codReconciliationService.ts:15`).

## Chưa xác minh được

- Chưa xác minh được kết nối đơn vị vận chuyển.
- Chưa xác minh được thuật toán tối ưu tuyến đường.
- Chưa xác minh được chu kỳ đối chiếu tiền thu hộ.
