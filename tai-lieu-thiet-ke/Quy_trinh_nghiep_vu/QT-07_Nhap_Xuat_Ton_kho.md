# QT-07 — Nhập – Xuất – Tồn kho

- Dự án: VComm
- Mã quy trình: QT-07
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Kế toán
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/1_accounting/06_inventory.md (§2.1, §2.2)`
- Mô-đun hệ thống: MOD-25 Quản trị Kho vận (`/warehouse`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình kho vận và kiểm tra duyệt phiếu kho; chưa có màn hình kiểm kê riêng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Thủ kho | Ghi nhận số lượng nhập, xuất thực tế; không thấy giá trị nếu bị cấu hình ẩn | `Mo ta nghiep vu/MD_ERP/1_accounting/06_inventory.md (§2.2)` |
| Kế toán kho / Kế toán tổng hợp | Xem giá trị, tính giá xuất kho, xử lý hạch toán | `Mo ta nghiep vu/MD_ERP/1_accounting/06_inventory.md (§2.2)` |
| Người duyệt phiếu kho | Kiểm tra và duyệt phiếu kho trước khi ghi sổ | `src/services/warehouseVoucherApproval.ts:43` |

## 2. Điều kiện trước

- Danh mục kho và danh mục vật tư hàng hóa đã có.
- Tài khoản kho 152, 155, 156 đã có trong sổ kế toán.
- Đã chọn phương pháp tính giá xuất kho cho tenant.

## 3. Luồng chính

1. Lập phiếu nhập kho từ yêu cầu nhập hoặc lệnh sản xuất.
2. Kiểm đếm thực tế và điền số lượng vào phiếu.
3. Kiểm tra điều kiện duyệt phiếu kho (`warehouseVoucherApproval.ts:43` — `validateVoucherApproval`).
4. Ghi sổ phiếu nhập: tăng số lượng tồn kho và ghi bút toán tăng tài sản kho.
5. Với nghiệp vụ xuất kho: lập phiếu xuất, ghi sổ giảm số lượng tồn kho ngay lập tức.
6. Cuối kỳ, chạy chức năng tính giá xuất kho để cập nhật đơn giá và thành tiền cho các phiếu xuất trong kỳ.
7. Với chuyển kho nội bộ: ghi một dòng xuất kho nguồn và một dòng nhập kho đích.
8. Kiểm kê: hệ thống chụp số lượng tồn trên sổ, thủ kho nhập số thực đếm, hệ thống tính chênh lệch.
9. Xử lý chênh lệch: hệ thống sinh phiếu nhập kho cho phần thừa, phiếu xuất kho cho phần thiếu.

## 4. Sơ đồ

```
[Phiếu nhập kho] --> [validateVoucherApproval :43] --> [Ghi sổ: tăng tồn + bút toán]
[Phiếu xuất kho] --> [validateVoucherApproval :43] --> [Ghi sổ: giảm tồn ngay]
                                                                |
                                                                v
                                        [Cuối kỳ: Tính giá xuất kho]
                                                                |
                                                                v
                                     [Cập nhật đơn giá, thành tiền, sổ cái]
[Kiểm kê] --> [Chụp tồn sổ] --> [Nhập số thực đếm] --> [Chênh lệch]
                                                                |
                                        +-----------------------+-----------------------+
                                        |                                               |
                                        v                                               v
                              [Phiếu nhập kho (thừa)]                     [Phiếu xuất kho (thiếu)]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Phiếu kho chưa đủ điều kiện duyệt | Từ chối duyệt, trả về lý do | `src/services/warehouseVoucherApproval.ts:43` |
| E2 | Xuất kho vượt số lượng tồn | Không cho ghi sổ hoặc ghi âm tồn tùy cấu hình | `Mo ta nghiep vu/MD_ERP/1_accounting/06_inventory.md (§2.1)` |
| E3 | Chưa tính giá xuất kho mà đã lập báo cáo giá vốn | Giá vốn tạm tính sai; phải chạy tính giá trước khi chốt kỳ | `Mo ta nghiep vu/MD_ERP/1_accounting/06_inventory.md (§2.1)` |
| E4 | Bút toán lệch Nợ/Có hoặc kỳ đã khóa | Từ chối ghi sổ | `src/services/dbService.ts:1888`, `:1899` |

## 6. Máy trạng thái

```
Phiếu kho: Nháp --> Chờ duyệt --> Đã duyệt --> Đã ghi sổ
Kỳ giá: Chưa tính giá --> Đã tính giá --> Đã chốt giá vốn
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Phiếu xuất kho ghi giảm số lượng tồn ngay; giá trị cập nhật sau khi chạy tính giá xuất kho | `Mo ta nghiep vu/MD_ERP/1_accounting/06_inventory.md (§2.1)` |
| BR-02 | Chuyển kho nội bộ sinh một dòng xuất và một dòng nhập, tổng giá trị không đổi | `Mo ta nghiep vu/MD_ERP/1_accounting/06_inventory.md (§2.1)` |
| BR-03 | Thủ kho có thể bị cấu hình để không thấy đơn giá và thành tiền | `Mo ta nghiep vu/MD_ERP/1_accounting/06_inventory.md (§2.2)` |
| BR-04 | Kiểm kê chênh lệch thừa sinh phiếu nhập, thiếu sinh phiếu xuất | `Mo ta nghiep vu/MD_ERP/1_accounting/06_inventory.md (§2.1)` |

## 8. Thông báo và nhật ký

- Chưa có thông báo tự động khi tồn kho xuống dưới định mức.
- Chưa có nhật ký kiểm toán riêng cho thao tác điều chỉnh tồn kho.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng tồn kho theo kho và mặt hàng | Số lượng, đơn giá, thành tiền | `Mo ta nghiep vu/MD_ERP/1_accounting/06_inventory.md (§1)` |
| Bảng phiếu nhập kho, phiếu xuất kho | Số phiếu, ngày, kho, mặt hàng, số lượng | `Mo ta nghiep vu/MD_ERP/1_accounting/06_inventory.md (§1)` |
| `journal_entries` / `journal_items` | Bút toán tăng giảm kho | `src/services/dbService.ts:1913` |

## 10. Màn hình

- Quản trị Kho vận (`src/components/Warehouse.tsx:1129` — tiêu đề Tạo phiếu kho mới).
- Đơn đang giao và tối ưu tuyến đường giao hàng (`src/components/Warehouse.tsx`).
- Chưa có màn hình kiểm kê kho chuyên biệt.

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho phiếu nhập kho đủ điều kiện, Khi duyệt và ghi sổ, Thì số lượng tồn kho tăng đúng số nhập.
- **AC-02.** Cho phiếu xuất kho, Khi ghi sổ, Thì số lượng tồn kho giảm ngay (ca bắt buộc).
- **AC-03.** Cho phiếu kho chưa đủ điều kiện duyệt, Khi duyệt, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-04.** Cho biên bản kiểm kê có chênh lệch, Khi xử lý, Thì hệ thống sinh đúng phiếu nhập hoặc phiếu xuất.
- **AC-05.** Cho chuyển kho nội bộ, Khi ghi sổ, Thì tồn kho nguồn giảm và tồn kho đích tăng tương ứng.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình kho vận hiện có (`/warehouse`) và dịch vụ kiểm tra duyệt phiếu kho.
- Cần bổ sung màn hình kiểm kê và chức năng tính giá xuất kho nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Mỗi tenant chọn một phương pháp tính giá xuất kho duy nhất trong một kỳ.
- **Q-01.** Phương pháp tính giá xuất kho nào được chọn: bình quân gia quyền, nhập trước xuất trước, hay đích danh?
- **Q-02.** Có cho phép tồn kho âm không, và nếu có thì ai được duyệt?

## 14. Ghi chú kỹ thuật

- Kiểm tra duyệt phiếu kho là hàm thuần, có thể kiểm thử độc lập (`src/services/warehouseVoucherApproval.ts:43`).
- Có dịch vụ mua hàng theo tuần và tuần dự trữ phục vụ kế hoạch nhập hàng (`src/services/openToBuyService.ts:155`).

## Chưa xác minh được

- Chưa xác minh được chức năng tính giá xuất kho đã có trong mã nguồn hay chưa.
- Chưa xác minh được phương pháp tính giá xuất kho mặc định của hệ thống.
- Chưa xác minh được có chặn tồn kho âm hay không.
