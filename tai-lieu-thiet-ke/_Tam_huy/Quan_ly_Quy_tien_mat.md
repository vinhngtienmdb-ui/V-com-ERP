# QT-02 — Quản lý Quỹ tiền mặt

- Dự án: VComm
- Mã quy trình: QT-02
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Kế toán
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/1_accounting/01_cash.md (§2.1, §2.2)`
- Mô-đun hệ thống: MOD-29 Tài chính - Kế toán (`/finance`)
- Hiện trạng mã nguồn: Đề xuất — chưa có màn hình Quỹ riêng; phần ghi sổ dùng chung `Finance.tsx` và `accountingService.ts`

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Kế toán viên / Kế toán thanh toán | Lập phiếu thu, phiếu chi tiền mặt | `Mo ta nghiep vu/MD_ERP/1_accounting/01_cash.md (§2.2)` |
| Kế toán trưởng | Phê duyệt chứng từ chi | `Mo ta nghiep vu/MD_ERP/1_accounting/01_cash.md (§2.2)` |
| Thủ quỹ | Xác nhận thực thu / thực chi, giữ sổ quỹ độc lập với sổ kế toán | `Mo ta nghiep vu/MD_ERP/1_accounting/01_cash.md (§2.2)` |
| Hệ thống | Chặn ghi sổ khi lệch Nợ/Có hoặc khi kỳ đã khóa | `src/services/dbService.ts:1888`, `:1899` |

## 2. Điều kiện trước

- Danh mục tài khoản 111 (tiền mặt) đã có trong sổ kế toán (`src/services/tt99Service.ts:156` — `listAccounts`).
- Đã xác định ngày khóa sổ hiện hành nếu kỳ đang đóng (`src/services/dbService.ts:1899`).
- Người lập phiếu đã được cấp quyền ghi sổ qua cơ chế xác thực của hệ thống (`server.ts:384` — `requireAuth`).

## 3. Luồng chính

1. Kế toán lập Phiếu thu tiền mặt (thu từ khách hàng, thu nội bộ, hoặc rút tiền gửi ngân hàng về quỹ).
2. Kế toán trưởng phê duyệt phiếu nếu nghiệp vụ có luồng duyệt.
3. Thủ quỹ kiểm đếm tiền thực tế, đối chiếu với số trên phiếu rồi xác nhận trên phần mềm.
4. Hệ thống kiểm tra cân đối Nợ/Có của bút toán; nếu lệch quá 0,01 thì từ chối ghi sổ (`dbService.ts:1888`).
5. Hệ thống kiểm tra ngày hạch toán so với ngày khóa sổ; nếu nằm trong kỳ đã khóa thì từ chối (`dbService.ts:1899`).
6. Ghi sổ: cập nhật `journal_entries` và các dòng chi tiết, đồng thời cập nhật sổ quỹ tiền mặt.
7. In Phiếu thu theo mẫu 01-TT để người nộp tiền ký nhận.
8. Với nghiệp vụ chi: lặp lại trình tự trên theo hướng ngược, in Phiếu chi theo mẫu 02-TT.
9. Cuối kỳ, lập biên bản kiểm kê quỹ: hệ thống lấy số dư tồn quỹ theo sổ kế toán, thủ quỹ nhập số thực đếm.
10. Hệ thống tính chênh lệch; nếu thừa lập phiếu thu, nếu thiếu lập phiếu chi để xử lý.

## 4. Sơ đồ

```
[Kế toán] --lập--> [Phiếu thu / Phiếu chi]
                        |
                        v
                 [Kế toán trưởng duyệt]
                        |
                        v
                 [Thủ quỹ xác nhận thực thu / thực chi]
                        |
                        v
        +---------------+----------------+
        |  saveJournalEntry (dbService)  |
        |  - kiểm cân đối Nợ / Có :1888  |
        |  - kiểm ngày khóa sổ    :1899  |
        +---------------+----------------+
                        |
                        v
        [journal_entries + sổ quỹ tiền mặt] --> [Mẫu 01-TT / 02-TT]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Bút toán lệch Nợ/Có quá 0,01 | Từ chối ghi sổ, ném lỗi mất cân đối | `src/services/dbService.ts:1888` |
| E2 | Ngày hạch toán nằm trong kỳ đã khóa | Từ chối ghi sổ, ném lỗi kỳ đã khóa | `src/services/dbService.ts:1907` |
| E3 | Thiếu quyền xác thực khi gọi API ghi sổ | HTTP 401 | `server.ts:384` |
| E4 | Kiểm kê có chênh lệch thừa/thiếu | Sinh phiếu thu (thừa) hoặc phiếu chi (thiếu) để xử lý | `Mo ta nghiep vu/MD_ERP/1_accounting/01_cash.md (§2.1)` |

## 6. Máy trạng thái

```
Nháp --trình duyệt--> Chờ duyệt --duyệt--> Đã duyệt --ghi sổ--> Đã ghi sổ
Đã ghi sổ --phát hiện sai--> Đảo bút toán (không xóa)
Đã duyệt --từ chối--> Nháp (kèm lý do)
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Phiếu thu in theo mẫu 01-TT, phiếu chi in theo mẫu 02-TT | `Mo ta nghiep vu/MD_ERP/1_accounting/01_cash.md (§2.1)` |
| BR-02 | Chứng từ chỉ được ghi sổ khi tổng Nợ và tổng Có lệch không quá 0,01 | `src/services/dbService.ts:1888` |
| BR-03 | Không ghi sổ chứng từ có ngày hạch toán nhỏ hơn hoặc bằng ngày khóa sổ | `src/services/dbService.ts:1907` |
| BR-04 | Sổ quỹ của thủ quỹ tách khỏi sổ kế toán để đối chiếu chéo | `Mo ta nghiep vu/MD_ERP/1_accounting/01_cash.md (§2.2)` |
| BR-05 | Tenant mặc định khi thiếu thông tin là `tenant-vcomm-prod-01` | `src/services/dbService.ts:1915` |

## 8. Thông báo và nhật ký

- Chứng từ chờ duyệt hiện chưa có kênh thông báo riêng cho kế toán trưởng; đây là điểm cần bổ sung.
- Lỗi ghi sổ trả về dạng ngoại lệ với thông điệp tiếng Việt (`dbService.ts:1889`, `:1908`).

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| `journal_entries` | `id`, `tenant_id`, `date`, `ref`, `description` | `src/services/dbService.ts:1913` |
| `journal_items` | `debit`, `credit`, tài khoản đối ứng | `src/services/dbService.ts:1886` |
| `tenant_settings` | `data.closingLockDate` | `src/services/dbService.ts:1899` |
| `accounts` / `acc_*` | Tài khoản 111, 112 và tài khoản đối ứng | `src/services/tt99Service.ts:156` |

## 10. Màn hình

- Chưa có màn hình Quỹ chuyên biệt trong mã nguồn hiện tại.
- Màn hình gần nhất là Sổ cái chi tiết Tài khoản (`src/components/Finance.tsx:845`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho kế toán đã đăng nhập, Khi lập phiếu thu cân đối, Thì chứng từ được ghi sổ và xuất hiện trong sổ cái.
- **AC-02.** Cho bút toán lệch Nợ/Có 1.000 đồng, Khi ghi sổ, Thì hệ thống từ chối và báo mất cân đối (ca thất bại bắt buộc).
- **AC-03.** Cho kỳ đã khóa sổ ngày 30/09, Khi ghi chứng từ ngày 15/09, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-04.** Cho phiếu chi chưa được kế toán trưởng duyệt, Khi thủ quỹ cố xác nhận chi, Thì hệ thống không cho ghi sổ.
- **AC-05.** Cho biên bản kiểm kê có chênh lệch, Khi xử lý chênh lệch, Thì hệ thống sinh đúng phiếu thu hoặc phiếu chi tương ứng.

## 12. Ảnh hưởng tới phần có sẵn

- Không thay đổi cấu trúc bảng hiện có; dùng lại `journal_entries` và `journal_items`.
- Cần bổ sung màn hình Quỹ và mẫu in 01-TT, 02-TT — hiện chưa có.
- Cần bổ sung danh mục tài khoản quỹ theo tenant nếu muốn tách nhiều quỹ.

## 13. Giả định và câu hỏi mở

- **GD-01.** Mỗi tenant dùng một quỹ tiền mặt duy nhất trong giai đoạn đầu.
- **Q-01.** Có cần tách nhiều quỹ tiền mặt theo chi nhánh hoặc theo người phụ trách không?
- **Q-02.** Ngưỡng phê duyệt chi tiền mặt là bao nhiêu, và ai là người duyệt theo từng ngưỡng?

## 14. Ghi chú kỹ thuật

- Ghi sổ đi qua một hàm duy nhất `saveJournalEntry` (`src/services/dbService.ts:1883`), nhờ đó mọi phân hệ dùng chung một cổng kiểm soát.
- Quy tắc khóa sổ nằm ở tầng lưu trữ (adapter), không nằm ở tầng dịch vụ nghiệp vụ.

## Chưa xác minh được

- Màn hình Quỹ và mẫu in 01-TT, 02-TT chưa có trong mã nguồn — chưa xác minh được cách triển khai.
- Chưa xác minh được có cơ chế phân quyền riêng cho vai trò thủ quỹ hay không.
- Chưa xác minh được danh mục tài khoản quỹ có được cấu hình theo tenant hay cố định.
