# QT-09 — Quản lý Tài sản cố định và Khấu hao

- Dự án: VComm
- Mã quy trình: QT-09
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Kế toán
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/1_accounting/08_assets.md (§2.1, §2.2)`
- Mô-đun hệ thống: MOD-29 Tài chính - Kế toán (`/finance`)
- Hiện trạng mã nguồn: Đã có một phần — có dịch vụ tài sản cố định và lịch chạy khấu hao cuối tháng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Kế toán tài sản cố định | Quản lý thẻ tài sản, tính khấu hao | `Mo ta nghiep vu/MD_ERP/1_accounting/08_assets.md (§2.2)` |
| Kế toán trưởng | Duyệt đánh giá lại và thanh lý tài sản | `Mo ta nghiep vu/MD_ERP/1_accounting/08_assets.md (§2.2)` |
| Lịch chạy tự động | Chạy trích khấu hao cuối mỗi kỳ | `src/services/monthEndScheduler.ts:117` |

## 2. Điều kiện trước

- Tài khoản 211 (tài sản cố định), 214 (hao mòn), 627 và 642 (chi phí) đã có trong sổ kế toán.
- Đã khai báo niên hạn sử dụng theo nhóm tài sản.
- Kỳ kế toán chưa khóa sổ.

## 3. Luồng chính

1. Ghi tăng tài sản cố định từ mua mới, xây dựng cơ bản hoàn thành, hoặc nhận vốn góp.
2. Khai báo thẻ tài sản: nguyên giá, tỷ lệ khấu hao, thời gian sử dụng, bộ phận sử dụng.
3. Hệ thống xác định niên hạn theo nhóm tài sản (`fixedAssetService.ts:85` — `TSCĐ_USEFUL_LIFE_MONTHS`).
4. Hàng tháng, lịch chạy tự động gọi trích khấu hao (`monthEndScheduler.ts:117`).
5. Hệ thống tính mức khấu hao kỳ (`fixedAssetService.ts:217` — `computeMonthlyDepreciation`) và sinh bút toán.
6. Tổng hợp các bút toán khấu hao trong kỳ (`depreciationRunService.ts:127` — `consolidateDepreciationEntries`).
7. Nếu đánh giá lại tài sản, lưu vết lịch sử và tính lại mức khấu hao các kỳ sau.
8. Cuối năm, kiểm kê tài sản và in biên bản.
9. Khi thanh lý, nhượng bán hoặc ghi giảm, lập chứng từ và ghi nhận thu nhập, chi phí thanh lý.

## 4. Sơ đồ

```
[Ghi tăng TSCĐ] --> [Thẻ TSCĐ: nguyên giá, nhóm, bộ phận]
                                        |
                                        v
                      [monthEndScheduler :117 hàng tháng]
                                        |
                                        v
                    [computeMonthlyDepreciation :217]
                                        |
                                        v
                     [buildDepreciationJournalEntry]
                                        |
                                        v
                  [consolidateDepreciationEntries :127]
                                        |
                                        v
                       [Ghi sổ: Nợ 627/642, Có 214]
                                        |
                    +-------------------+-------------------+
                    |                                       |
                    v                                       v
        [Đánh giá lại: lưu vết, tính lại]        [Thanh lý / ghi giảm]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Thiếu niên hạn sử dụng theo nhóm tài sản | Không tính được khấu hao; chặn lưu thẻ | `src/services/fixedAssetService.ts:85` |
| E2 | Đã khấu hao hết nguyên giá | Dừng trích khấu hao; không sinh bút toán âm | `src/services/fixedAssetService.ts:166` |
| E3 | Bút toán lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |
| E4 | Kỳ kế toán đã khóa | Từ chối ghi sổ | `src/services/dbService.ts:1907` |

## 6. Máy trạng thái

```
Thẻ tài sản: Mới --> Đang khấu hao --> Đã khấu hao hết
Đang khấu hao --đánh giá lại--> Đang khấu hao (mức mới)
Đang khấu hao --thanh lý, nhượng bán, ghi giảm--> Đã ghi giảm
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Niên hạn sử dụng lấy theo nhóm tài sản, không nhập tùy ý cho từng tài sản | `src/services/fixedAssetService.ts:85` |
| BR-02 | Khấu hao tính theo phương pháp đường thẳng theo tháng | `src/services/fixedAssetService.ts:217` |
| BR-03 | Bút toán khấu hao: Nợ tài khoản chi phí bộ phận, Có 214 | `src/services/fixedAssetService.ts:263` |
| BR-04 | Đánh giá lại phải lưu vết lịch sử và tính lại mức khấu hao các kỳ sau | `Mo ta nghiep vu/MD_ERP/1_accounting/08_assets.md (§2.1)` |

## 8. Thông báo và nhật ký

- Lịch chạy cuối tháng tự động gọi trích khấu hao và ghi nhận kết quả chạy.
- Có tệp kiểm thử cho dịch vụ tài sản cố định và lịch chạy cuối tháng.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng thẻ tài sản cố định | Nguyên giá, nhóm, bộ phận, trạng thái | `Mo ta nghiep vu/MD_ERP/1_accounting/08_assets.md (§1)` |
| Bảng lịch khấu hao | Kỳ, mức khấu hao, giá trị còn lại | `src/services/fixedAssetService.ts:263` |
| Bảng lịch chạy cuối tháng | Kỳ đã chạy, trạng thái | `src/services/monthEndScheduler.ts:43` |
| `journal_entries` / `journal_items` | Bút toán khấu hao | `src/services/dbService.ts:1913` |

## 10. Màn hình

- Sổ cái chi tiết Tài khoản 211, 214 (`src/components/Finance.tsx:845`).
- Chưa có màn hình thẻ tài sản cố định chuyên biệt trong mã nguồn hiện tại.

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho tài sản nguyên giá 120.000.000 đồng, niên hạn 120 tháng, Khi chạy khấu hao tháng, Thì mức khấu hao là 1.000.000 đồng.
- **AC-02.** Cho tài sản đã khấu hao hết, Khi chạy khấu hao kỳ sau, Thì không sinh bút toán (ca bắt buộc).
- **AC-03.** Cho chạy khấu hao hai lần trong cùng một kỳ, Khi kiểm tra sổ, Thì không ghi trùng bút toán (ca thất bại bắt buộc).
- **AC-04.** Cho kỳ đã khóa, Khi chạy khấu hao, Thì hệ thống từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại `fixedAssetService.ts`, `depreciationRunService.ts`, `monthEndScheduler.ts` đã có.
- Cần bổ sung màn hình thẻ tài sản và biên bản kiểm kê nếu muốn đủ luồng theo đặc tả.

## 13. Giả định và câu hỏi mở

- **GD-01.** Hệ thống chỉ dùng phương pháp khấu hao đường thẳng trong giai đoạn đầu.
- **Q-01.** Có cần hỗ trợ phương pháp khấu hao theo số dư giảm dần có điều chỉnh không?
- **Q-02.** Có cần tách khấu hao theo bộ phận sử dụng để lên báo cáo quản trị theo phòng ban không?

## 14. Ghi chú kỹ thuật

- Niên hạn sử dụng đã được đưa vào mã nguồn dưới dạng bảng theo nhóm, không gắn cứng trong hàm.
- Có tệp kiểm thử `src/services/fixedAssetService.test.ts` và `src/services/depreciationRunService.test.ts`.

## Chưa xác minh được

- Chưa xác minh được màn hình thẻ tài sản cố định có tồn tại hay không.
- Chưa xác minh được bảng niên hạn sử dụng đã cập nhật đủ nhóm tài sản theo quy định hiện hành hay chưa.
- Chưa xác minh được cơ chế chống ghi trùng khấu hao theo kỳ.
