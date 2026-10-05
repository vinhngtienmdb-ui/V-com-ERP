# QT-32 — Quản lý Thông tin Sản phẩm

- Dự án: VComm
- Mã quy trình: QT-32
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-14 Quản lý sản phẩm (`/pim`)
- Hiện trạng mã nguồn: Đã có — màn hình quản lý sản phẩm với nhập tệp, chuẩn hóa dữ liệu và kiểm tra hợp lệ

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên quản lý sản phẩm | Tạo, sửa sản phẩm, nhập danh sách từ tệp | `src/components/PIM.tsx:776` |
| Hệ thống | Chuẩn hóa và kiểm tra hợp lệ dữ liệu nhập vào | `src/components/PIM.tsx:1004`, `:1016` |
| Người bán | Đăng bán sản phẩm trên sàn | `src/services/sellerKycService.ts:186` |
| Hệ thống dữ liệu ngành | Công bố sản phẩm và xác minh nguồn gốc | `src/services/databankService.ts:35`, `:68` |

## 2. Điều kiện trước

- Đã có danh mục ngành hàng và thuộc tính sản phẩm.
- Đã có quy tắc đặt mã sản phẩm.

## 3. Luồng chính

1. Tạo sản phẩm mới thủ công hoặc nhập danh sách từ tệp dữ liệu.
2. Hệ thống quét và chuẩn hóa dữ liệu nhập vào (`PIM.tsx:1004`).
3. Hệ thống kiểm tra hợp lệ và báo lỗi dữ liệu nếu có (`PIM.tsx:1016`).
4. Nếu dữ liệu đạt chuẩn, sản phẩm được ghi nhận và có thể đăng bán.
5. Hệ thống gợi ý giá bán theo công cụ định giá.
6. Công bố sản phẩm lên kho dữ liệu ngành và sinh mã tra cứu nguồn gốc (`databankService.ts:35`, `:87`).

## 4. Sơ đồ

```
[Tạo thủ công]  [Nhập tệp CSV/Excel]
        |                  |
        +--------+---------+
                 |
                 v
        [Quét và chuẩn hóa dữ liệu :1004]
                 |
                 v
        [Kiểm tra hợp lệ :1016] --lỗi--> [Báo lỗi dữ liệu]
                 |
                 v
        [Đạt chuẩn] --> [Gợi ý giá bán] --> [Đăng bán]
                 |
                 v
        [Công bố kho dữ liệu ngành + mã tra cứu nguồn gốc]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Tệp nhập sai định dạng hoặc thiếu cột bắt buộc | Dừng nhập, báo lỗi xác thực dữ liệu | `src/components/PIM.tsx:1016` |
| E2 | Trùng mã sản phẩm | Chặn lưu, yêu cầu mã khác | `src/components/PIM.tsx:776` |
| E3 | Người bán chưa được duyệt hồ sơ | Không cho đăng bán | `src/services/sellerKycService.ts:186` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Sản phẩm: Nháp --> Chờ kiểm duyệt --> Đang bán --> Ngừng bán
Tệp nhập: Đang quét --> Đạt chuẩn / Lỗi xác thực
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Dữ liệu nhập từ tệp phải qua bước chuẩn hóa và kiểm tra hợp lệ trước khi ghi nhận | `src/components/PIM.tsx:1004`, `:1016` |
| BR-02 | Chỉ người bán đã được duyệt hồ sơ mới được đăng bán | `src/services/sellerKycService.ts:186` |
| BR-03 | Sản phẩm công bố lên kho dữ liệu ngành phải sinh được mã tra cứu nguồn gốc | `src/services/databankService.ts:87` |

## 8. Thông báo và nhật ký

- Thông báo lỗi xác thực dữ liệu hiển thị ngay khi nhập tệp.
- Chưa xác minh được có thông báo khi sản phẩm bị từ chối kiểm duyệt hay không.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng sản phẩm | Mã, tên, ngành hàng, giá, trạng thái | `src/components/PIM.tsx:776` |
| Bảng thuộc tính sản phẩm | Thuộc tính theo ngành hàng | `src/components/PIM.tsx` |
| Bảng kho dữ liệu ngành | Dữ liệu công bố, mã tra cứu nguồn gốc | `src/services/databankService.ts:35` |

## 10. Màn hình

- Quản lý sản phẩm (`src/components/PIM.tsx`, tuyến `/pim`, 2.738 dòng).
- Thêm sản phẩm mới (`src/components/PIM.tsx:776`).
- Kéo thả tệp CSV hoặc Excel để nhập (`src/components/PIM.tsx:991`).
- Công cụ định giá bằng trí tuệ nhân tạo (`src/components/PIM.tsx:758`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho tệp dữ liệu đúng định dạng, Khi nhập, Thì hệ thống chuẩn hóa và ghi nhận sản phẩm.
- **AC-02.** Cho tệp thiếu cột bắt buộc, Khi nhập, Thì hệ thống dừng và báo lỗi xác thực (ca thất bại bắt buộc).
- **AC-03.** Cho người bán chưa duyệt hồ sơ, Khi đăng bán, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-04.** Cho sản phẩm đã công bố kho dữ liệu ngành, Khi tra cứu, Thì trả về đúng thông tin nguồn gốc.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình quản lý sản phẩm đã có.
- Cần bổ sung bảng thuộc tính theo ngành hàng nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Mỗi sản phẩm thuộc một ngành hàng duy nhất.
- **Q-01.** Có bao nhiêu ngành hàng và bộ thuộc tính tương ứng?
- **Q-02.** Có cần kiểm duyệt sản phẩm trước khi đăng bán không?

## 14. Ghi chú kỹ thuật

- Màn hình sản phẩm là màn hình lớn thứ tư trong kho mã (2.738 dòng).
- Có hàm tìm kiếm sản phẩm toàn văn (`src/services/fullTextSearchService.ts:232`).

## Chưa xác minh được

- Chưa xác minh được bộ thuộc tính sản phẩm theo ngành hàng.
- Chưa xác minh được luồng kiểm duyệt sản phẩm trước khi đăng bán.
- Chưa xác minh được kết nối thật tới kho dữ liệu ngành.
