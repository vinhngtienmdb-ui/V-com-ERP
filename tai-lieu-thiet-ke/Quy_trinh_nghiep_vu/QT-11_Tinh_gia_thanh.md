# QT-11 — Tính giá thành sản phẩm

- Dự án: VComm
- Mã quy trình: QT-11
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Kế toán
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§2.1, §2.2)`
- Mô-đun hệ thống: MOD-29 Tài chính - Kế toán (`/finance`)
- Hiện trạng mã nguồn: Đề xuất — chưa có mã nguồn tương ứng trong kho hiện tại

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Kế toán giá thành | Phụ trách toàn bộ quy trình, kiểm tra chi phí và phân bổ | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§2.2)` |
| Kế toán tổng hợp | Kiểm tra khớp giữa sổ giá thành và sổ cái | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§2.2)` |
| Hệ thống | Tập hợp chi phí, phân bổ chi phí chung, tính giá thành đơn vị | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§2.1)` |

## 2. Điều kiện trước

- Tài khoản tập hợp chi phí 621, 622, 627 và tài khoản 154 đã có trong sổ kế toán.
- Đã xác định đối tượng tập hợp chi phí và tiêu thức phân bổ.
- Đã có dữ liệu sản lượng nhập kho trong kỳ.

## 3. Luồng chính

1. Chọn kỳ tính giá thành và tập hợp chi phí phát sinh trong kỳ theo đối tượng tập hợp.
2. Chọn tiêu thức phân bổ chi phí chung (theo nguyên vật liệu trực tiếp, theo số lượng, theo định mức).
3. Hệ thống phân bổ chi phí chung vào từng mã thành phẩm theo tiêu thức đã chọn.
4. Đánh giá sản phẩm dở dang cuối kỳ theo phương pháp đã chọn.
5. Chạy công thức: tổng giá thành bằng dở dang đầu kỳ cộng chi phí phát sinh trừ dở dang cuối kỳ.
6. Chia tổng giá thành cho số lượng nhập kho để ra giá thành đơn vị.
7. Hệ thống cập nhật đơn giá vào các phiếu nhập kho thành phẩm trong kỳ.
8. Chạy lại tính giá xuất kho để cập nhật giá vốn xuất bán.

## 4. Sơ đồ

```
[Tập hợp chi phí 621, 622, 627, 154]
                    |
                    v
        [Chọn tiêu thức phân bổ chi phí chung]
                    |
                    v
        [Đánh giá sản phẩm dở dang cuối kỳ]
                    |
                    v
   Tổng Z = Dở dang đầu kỳ + Chi phí phát sinh - Dở dang cuối kỳ
                    |
                    v
        [Giá thành đơn vị = Tổng Z / Số lượng nhập kho]
                    |
                    v
   [Cập nhật đơn giá phiếu nhập kho 155] --> [Chạy lại tính giá xuất kho]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Chưa chọn tiêu thức phân bổ | Không phân bổ được chi phí chung; chặn chạy | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§2.1)` |
| E2 | Số lượng nhập kho bằng không | Không chia được giá thành đơn vị; chặn chạy | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§2.1)` |
| E3 | Sổ giá thành lệch sổ cái | Cảnh báo để kế toán tổng hợp kiểm tra | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§2.2)` |
| E4 | Kỳ kế toán đã khóa | Từ chối ghi sổ | `src/services/dbService.ts:1907` |

## 6. Máy trạng thái

```
Kỳ giá thành: Chưa tập hợp --> Đã tập hợp chi phí --> Đã phân bổ --> Đã tính giá thành --> Đã cập nhật giá vốn
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Tổng giá thành bằng dở dang đầu kỳ cộng chi phí phát sinh trừ dở dang cuối kỳ | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§2.1)` |
| BR-02 | Giá thành đơn vị bằng tổng giá thành chia số lượng nhập kho | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§2.1)` |
| BR-03 | Giá thành tính xong phải đẩy ngược vào phiếu nhập kho thành phẩm trong kỳ | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§2.1)` |
| BR-04 | Sau khi tính giá thành phải chạy lại tính giá xuất kho để cập nhật giá vốn | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§2.1)` |

## 8. Thông báo và nhật ký

- Chưa có thông báo tự động khi kỳ giá thành chưa chạy trước thời điểm chốt sổ.
- Chưa có nhật ký kiểm toán riêng cho thao tác phân bổ chi phí.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng tập hợp chi phí | Đối tượng tập hợp, tài khoản, số tiền | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§1)` |
| Bảng phân bổ chi phí chung | Tiêu thức, tỷ lệ phân bổ, số tiền | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§1)` |
| Bảng giá thành | Mã thành phẩm, tổng giá thành, giá thành đơn vị | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§1)` |
| Phiếu nhập kho thành phẩm | Đơn giá cập nhật sau khi tính giá thành | `Mo ta nghiep vu/MD_ERP/1_accounting/10_costing.md (§2.1)` |

## 10. Màn hình

- Chưa có màn hình giá thành trong mã nguồn hiện tại.
- Màn hình gần nhất là Sổ cái chi tiết Tài khoản 154, 155 (`src/components/Finance.tsx:845`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho dở dang đầu kỳ 10, chi phí phát sinh 100, dở dang cuối kỳ 20, Khi tính giá thành, Thì tổng giá thành bằng 90.
- **AC-02.** Cho số lượng nhập kho bằng không, Khi tính giá thành đơn vị, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho tính giá thành xong, Khi kiểm tra phiếu nhập kho thành phẩm, Thì đơn giá đã được cập nhật.
- **AC-04.** Cho kỳ đã khóa, Khi ghi bút toán giá thành, Thì hệ thống từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Cần tạo mới các bảng tập hợp chi phí, phân bổ chi phí và giá thành.
- Cần bổ sung màn hình và chức năng chạy tính giá thành theo kỳ.

## 13. Giả định và câu hỏi mở

- **GD-01.** Đơn vị áp dụng tính giá thành theo phương pháp giản đơn, một loại sản phẩm chính.
- **Q-01.** Có cần tính giá thành theo hệ số hoặc theo tỷ lệ cho nhóm sản phẩm không?
- **Q-02.** Có cần tính giá thành theo từng công đoạn sản xuất không?

## 14. Ghi chú kỹ thuật

- Công thức giá thành là hàm thuần, nên tách riêng để kiểm thử và để tái sử dụng cho nhiều phương pháp.

## Chưa xác minh được

- Chưa có mã nguồn cho nghiệp vụ giá thành — chưa xác minh được hiện trạng triển khai.
- Chưa xác minh được phương pháp tính giá thành nào được chọn cho VComm.
- Chưa xác minh được có phân bổ chi phí chung theo nhiều tiêu thức đồng thời hay không.
