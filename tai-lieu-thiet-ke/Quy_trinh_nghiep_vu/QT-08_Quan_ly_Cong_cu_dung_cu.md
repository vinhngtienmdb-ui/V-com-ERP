# QT-08 — Quản lý Công cụ dụng cụ và Phân bổ

- Dự án: VComm
- Mã quy trình: QT-08
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Kế toán
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/1_accounting/07_tools.md (§2.1, §2.2)`
- Mô-đun hệ thống: MOD-29 Tài chính - Kế toán (`/finance`)
- Hiện trạng mã nguồn: Đề xuất — chưa có mã nguồn tương ứng trong kho hiện tại

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Kế toán tổng hợp / Kế toán tài sản | Ghi tăng, phân bổ, ghi giảm công cụ dụng cụ | `Mo ta nghiep vu/MD_ERP/1_accounting/07_tools.md (§2.2)` |
| Trưởng phòng / Quản lý thiết bị | Theo dõi công cụ dụng cụ do phòng mình quản lý | `Mo ta nghiep vu/MD_ERP/1_accounting/07_tools.md (§2.2)` |
| Hệ thống | Tự động chia nguyên giá theo số kỳ phân bổ | `Mo ta nghiep vu/MD_ERP/1_accounting/07_tools.md (§2.1)` |

## 2. Điều kiện trước

- Tài khoản 153 (công cụ dụng cụ) và 242 (chi phí trả trước) đã có trong sổ kế toán.
- Đã khai báo thẻ công cụ dụng cụ với nguyên giá, số kỳ phân bổ và bộ phận sử dụng.
- Kỳ kế toán chưa khóa sổ.

## 3. Luồng chính

1. Ghi tăng công cụ dụng cụ: xuất kho 153 đưa vào sử dụng, hoặc mua về dùng ngay không qua kho.
2. Khai báo thông tin thẻ: nguyên giá, số kỳ phân bổ, bộ phận sử dụng.
3. Cuối tháng, kế toán chạy chức năng tính phân bổ công cụ dụng cụ.
4. Hệ thống chia nguyên giá cho số kỳ để ra mức phân bổ của kỳ này.
5. Sinh chứng từ phân bổ ghi nhận chi phí cho từng phòng ban.
6. Nếu điều chuyển giữa các phòng, lập biên bản điều chuyển; từ kỳ sau chi phí hạch toán vào phòng nhận.
7. Nếu hỏng hoặc mất trước khi phân bổ hết, lập chứng từ ghi giảm và hạch toán phần giá trị còn lại.

## 4. Sơ đồ

```
[Ghi tăng CCDC] --> [Thẻ CCDC: nguyên giá, số kỳ, bộ phận]
                                        |
                                        v
                        [Cuối tháng: Tính phân bổ]
                                        |
                                        v
                    [Chứng từ phân bổ theo phòng ban]
                                        |
                    +-------------------+-------------------+
                    |                                       |
                    v                                       v
        [Điều chuyển phòng A sang B]            [Ghi giảm: hỏng, mất]
                    |                                       |
                    v                                       v
        [Kỳ sau: chi phí về phòng B]      [Hạch toán giá trị còn lại]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Chưa khai báo số kỳ phân bổ | Không tính được mức phân bổ; chặn lưu thẻ | `Mo ta nghiep vu/MD_ERP/1_accounting/07_tools.md (§2.1)` |
| E2 | Ghi giảm khi đã phân bổ hết | Không còn giá trị còn lại; chỉ đổi trạng thái thẻ | `Mo ta nghiep vu/MD_ERP/1_accounting/07_tools.md (§2.1)` |
| E3 | Bút toán lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |
| E4 | Kỳ kế toán đã khóa | Từ chối ghi sổ | `src/services/dbService.ts:1907` |

## 6. Máy trạng thái

```
Thẻ công cụ: Mới --> Đang phân bổ --> Đã phân bổ hết
Đang phân bổ --điều chuyển--> Đang phân bổ (đổi bộ phận)
Đang phân bổ --ghi giảm--> Đã ghi giảm
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Mức phân bổ mỗi kỳ bằng nguyên giá chia số kỳ phân bổ | `Mo ta nghiep vu/MD_ERP/1_accounting/07_tools.md (§2.1)` |
| BR-02 | Điều chuyển bộ phận chỉ ảnh hưởng chi phí từ kỳ sau | `Mo ta nghiep vu/MD_ERP/1_accounting/07_tools.md (§2.1)` |
| BR-03 | Ghi giảm trước hạn hạch toán toàn bộ giá trị còn lại trong kỳ đó | `Mo ta nghiep vu/MD_ERP/1_accounting/07_tools.md (§2.1)` |
| BR-04 | Chi phí phân bổ hạch toán vào tài khoản chi phí của bộ phận sử dụng | `Mo ta nghiep vu/MD_ERP/1_accounting/07_tools.md (§2.1)` |

## 8. Thông báo và nhật ký

- Chưa có thông báo khi công cụ dụng cụ sắp hết kỳ phân bổ.
- Chưa có nhật ký kiểm toán riêng cho nghiệp vụ công cụ dụng cụ.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng thẻ công cụ dụng cụ | Nguyên giá, số kỳ phân bổ, bộ phận, trạng thái | `Mo ta nghiep vu/MD_ERP/1_accounting/07_tools.md (§1)` |
| Bảng chứng từ phân bổ | Kỳ, số tiền, tài khoản chi phí | `Mo ta nghiep vu/MD_ERP/1_accounting/07_tools.md (§1)` |
| `journal_entries` / `journal_items` | Bút toán phân bổ và ghi giảm | `src/services/dbService.ts:1913` |

## 10. Màn hình

- Chưa có màn hình công cụ dụng cụ trong mã nguồn hiện tại.
- Màn hình gần nhất là Sổ cái chi tiết Tài khoản 153, 242 (`src/components/Finance.tsx:845`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho thẻ công cụ nguyên giá 12.000.000 đồng, số kỳ 12, Khi chạy phân bổ, Thì mức phân bổ mỗi kỳ là 1.000.000 đồng.
- **AC-02.** Cho điều chuyển bộ phận giữa kỳ, Khi chạy phân bổ kỳ sau, Thì chi phí về bộ phận nhận.
- **AC-03.** Cho ghi giảm công cụ chưa phân bổ hết, Khi ghi sổ, Thì giá trị còn lại vào chi phí kỳ đó (ca bắt buộc).
- **AC-04.** Cho kỳ đã khóa, Khi ghi chứng từ phân bổ trong kỳ, Thì hệ thống từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Cần tạo mới bảng thẻ công cụ dụng cụ và bảng chứng từ phân bổ.
- Cần bổ sung màn hình và chức năng chạy phân bổ theo kỳ.

## 13. Giả định và câu hỏi mở

- **GD-01.** Phân bổ theo phương pháp đường thẳng chia đều theo số kỳ.
- **Q-01.** Có cần phân bổ theo số ngày sử dụng thực tế thay vì chia đều theo kỳ không?
- **Q-02.** Ngưỡng giá trị để xếp vào công cụ dụng cụ thay vì tài sản cố định là bao nhiêu?

## 14. Ghi chú kỹ thuật

- Nên tách hàm tính phân bổ thành hàm thuần để kiểm thử, tương tự cách làm ở dịch vụ tài sản cố định.

## Chưa xác minh được

- Chưa có mã nguồn cho nghiệp vụ công cụ dụng cụ — chưa xác minh được hiện trạng triển khai.
- Chưa xác minh được ngưỡng giá trị phân loại công cụ dụng cụ.
- Chưa xác minh được có phân bổ nhiều lần cho công cụ đã qua sử dụng hay không.
