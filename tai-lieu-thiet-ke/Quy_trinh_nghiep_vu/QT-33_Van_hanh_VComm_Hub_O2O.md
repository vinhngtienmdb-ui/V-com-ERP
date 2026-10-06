# QT-33 — Vận hành VComm Hub

- Dự án: VComm
- Mã quy trình: QT-33
- Phiên bản: 2.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án), mã nguồn `_recovery_V-com-ERP`, và Quyết định chủ dự án 2026-10-09 (xem `Phan_tich_chong_cheo_iPOS_Hub_MuaChung_VXu.md`, mục 6.1 quyết định 1 và mục 4.1)
- Mô-đun hệ thống: MOD-12 VComm Hub (`/vcomm-hub`)
- Hiện trạng mã nguồn: Đã có dịch vụ Hub (`vcommHubService.ts`) với mã nhận hàng, nhắc hạn và xử lý không đến nhận; hàm bán tại quầy trong `hubService.ts` là **mã chết**

> Quyết định chủ dự án ngày 2026-10-09 (quyết định 1): **giữ bán tại quầy ở Hub nhưng phân biệt theo loại trạm** — trạm `standard` và `freeze` (có nhân viên trực) được bán tại quầy; trạm `locker` (tự phục vụ) **chỉ nhận hàng**. Quyết định #19 vì vậy bị giới hạn phạm vi, không bãi bỏ hoàn toàn. Xem mục 7 và mục 12.

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên điểm Hub (trạm standard/freeze) | Mở ca, nhận hàng, xuất kho, **bán tại quầy** (POS nội bộ) | `src/services/vcommHubService.ts:121`; `src/services/hubService.ts:135`, `:177` (mã chết) |
| Trạm locker (tự phục vụ) | **Chỉ nhận hàng, giữ hàng, giao chặng cuối, đồng kiểm, hoàn tiền** — không bán | `src/services/vcommHubService.ts` (luồng nhận hàng) |
| Khách hàng | Nhận hàng tại điểm Hub bằng mã nhận hàng | `src/services/vcommHubService.ts:121` |
| Hệ thống | Nhắc hạn nhận hàng và áp phí khi không đến nhận | `src/services/vcommHubService.ts:43`, `:47` |

## 2. Điều kiện trước

- Đã có điểm Hub, được phân loại trạm (`standard`, `freeze`, `locker`) và nhân viên phụ trách.
- Đã cấu hình thời hạn nhận hàng và phí không đến nhận.
- Với trạm `standard`/`freeze` muốn bán tại quầy: đã có kho nội bộ, ca làm việc và POS nội bộ.

## 3. Luồng chính

1. Nhân viên điểm Hub mở ca làm việc (trạm standard/freeze) (`hubService.ts:177` — **mã chết, cần xác minh hàm ca thật của VCommHub**).
2. Đơn hàng được đưa về điểm Hub; hệ thống sinh mã nhận hàng (`vcommHubService.ts:121`).
3. Hệ thống tính thời hạn nhận hàng (`vcommHubService.ts:41`).
4. Hệ thống nhắc khách trước 72 giờ và 48 giờ (`vcommHubService.ts:43`, `:45`).
5. Khách đến nhận hàng bằng mã nhận hàng; nhân viên xác nhận và xuất kho.
6. Nếu khách không đến nhận, hệ thống áp phí theo tỉ lệ cấu hình (`vcommHubService.ts:47`).
7. **Bán tại quầy** (chỉ trạm `standard`/`freeze`): hệ thống kiểm tra loại trạm; nếu là `locker` thì từ chối bán tại quầy, chỉ cho nhận hàng. Trạm `standard`/`freeze` bán qua POS nội bộ (dùng chung với Siêu thị VComm QT-51 và E-Menu QT-54).

## 4. Sơ đồ

```
[Phân loại trạm: standard / freeze / locker]
            |
            v
[Mở ca điểm Hub :177*]  (* mã chết, cần xác minh)
            |
            v
[Đơn về Hub] --> [generatePickupCode :121]
            |
            v
[Tính thời hạn nhận hàng :41]
            |
            v
[Nhắc 72 giờ :43] --> [Nhắc 48 giờ :45]
            |
            +-----------+-----------+
            |                       |
            v                       v
[Khách nhận hàng]        [Không đến nhận]
            |                       |
            v                       v
[Xuất kho nội bộ]        [Áp phí :47]
            |
            v
[Bán tại quầy?] -- locker --> [TỪ CHỐI: chỉ nhận hàng]
            |
            v (standard/freeze)
[POS nội bộ: tạo đơn, thanh toán, xuất kho]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Khách nhận hàng sau thời hạn | Áp phí không đến nhận theo tỉ lệ cấu hình | `src/services/vcommHubService.ts:47` |
| E2 | Mã nhận hàng sai hoặc hết hiệu lực | Từ chối xuất hàng | `src/services/vcommHubService.ts:121` |
| E3 | Trạm `locker` cố bán tại quầy | Từ chối; chỉ cho nhận hàng | Quyết định 1 (2026-10-09) |
| E4 | Xuất kho nội bộ cho đơn không tồn tại | Chặn tạo phiếu xuất | `src/services/hubService.ts:44` (mã chết) |
| E5 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Ca làm việc: Đã mở --> Đã đóng
Đơn tại Hub: Chờ nhận --> Đã nhận --> Không đến nhận
Đơn tại quầy (chỉ standard/freeze): Mới --> Đã thanh toán --> Đã xuất kho
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Thời hạn nhận hàng tính từ lúc đơn về Hub | `src/services/vcommHubService.ts:41` |
| BR-02 | Nhắc khách hai mốc 72 giờ và 48 giờ trước hạn | `src/services/vcommHubService.ts:43`, `:45` |
| BR-03 | Phí không đến nhận áp theo tỉ lệ cấu hình | `src/services/vcommHubService.ts:47` |
| BR-04 | Đơn tại quầy ghi nhận doanh thu qua hàng đợi ra kế toán | `src/services/accountingOutbox.ts:70` |
| BR-05 | **Bán tại quầy tại Hub chỉ áp cho trạm `standard` và `freeze`** (có nhân viên trực, có POS nội bộ). Trạm `locker` **chỉ nhận hàng, không bán** | Quyết định 1 (2026-10-09); `src/services/vcommHubService.ts:31`, `:612`–`:615` (nhãn trạm) |
| BR-06 | Trạm `standard`/`freeze` bán tại quầy dùng **POS nội bộ do VComm vận hành**, khác iPOS đối tác (ngoài repo, đa tenant) | Quyết định 1; `src/components/VCommHub.tsx:25` |

## 8. Thông báo và nhật ký

- Nhắc khách nhận hàng trước 72 giờ và 48 giờ (`src/services/vcommHubService.ts:43`, `:45`).
- Chưa xác minh được kênh nhắc là tin nhắn hay thư điện tử.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng điểm Hub | Mã điểm, địa chỉ, loại trạm, nhân viên phụ trách | `src/services/vcommHubService.ts:31` (loại trạm), `:612`–`:615` (nhãn) |
| Bảng đơn tại Hub | Mã đơn, mã nhận hàng, thời hạn, trạng thái | `src/services/vcommHubService.ts:121` |
| Bảng ca làm việc | Nhân viên, thời gian mở, thời gian đóng | `src/services/hubService.ts:177` (mã chết — cần xác minh) |
| Bảng phí không đến nhận | Tỉ lệ phí, điều kiện áp | `src/services/vcommHubService.ts:47` |

## 10. Màn hình

- VComm Hub (`src/components/VCommHub.tsx`, tuyến `/vcomm-hub`, 685 dòng).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đơn về Hub, Khi hệ thống sinh mã, Thì khách nhận được mã nhận hàng.
- **AC-02.** Cho đơn còn 72 giờ là hết hạn, Khi đến mốc nhắc, Thì khách nhận thông báo nhắc (ca bắt buộc).
- **AC-03.** Cho khách không đến nhận, Khi quá hạn, Thì hệ thống áp phí theo tỉ lệ cấu hình.
- **AC-04.** Cho mã nhận hàng sai, Khi xuất hàng, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-05.** Cho trạm `locker` yêu cầu bán tại quầy, Khi tạo đơn bán, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-06.** Cho trạm `standard`/`freeze` bán tại quầy, Khi thanh toán, Thì doanh thu ghi qua hàng đợi kế toán (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- **Giới hạn quyết định #19 theo loại trạm** (quyết định 1): giữ bán tại quầy ở Hub nhưng chỉ cho `standard`/`freeze`; `locker` chỉ nhận hàng.
- **`hubService.ts` là mã chết.** Phân tích (`Phan_tich_chong_cheo...` mục 2.1) xác nhận `hubService.ts` (hàm `createPosOrder` ở `:135`, `openShift` ở `:177`) **không có thành phần chạy thật nào import** — chỉ tệp kiểm thử `hubService.test.ts` dùng. Luồng nhận hàng chạy thật nằm ở `vcommHubService.ts`. Vì vậy:
  - Bán tại quầy tại Hub (nếu có) phải dùng POS nội bộ chung với Siêu thị (QT-51) và E-Menu (QT-54), không dùng `hubService.ts`.
  - Hàm ca làm việc trích dẫn `hubService.ts:177` cần được xác minh/thay thế bằng hàm ca thật của `VCommHub.tsx`.
- Cần bổ sung chính sách thời hạn và phí không đến nhận nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Mỗi điểm Hub có nhân viên mở ca và đóng ca theo ngày (trạm `locker` không cần ca bán hàng).
- **Q-01.** Thời hạn nhận hàng tại Hub là bao nhiêu giờ?
- **Q-02.** Tỉ lệ phí không đến nhận là bao nhiêu?
- **Q-03.** Hàm ca làm việc thật của VCommHub nằm ở đâu (vì `hubService.ts:177` là mã chết)?

## 14. Ghi chú kỹ thuật

- Ba loại trạm đã có trong mã nguồn (`src/services/vcommHubService.ts:31`, nhãn ở `:612`–`:615`): `standard`, `freeze`, `locker`.
- Các mốc thời gian và tỉ lệ phí đã được khai báo thành hằng số có tên (`vcommHubService.ts:41` đến `:49`), thuận lợi khi chỉnh chính sách.
- Không gộp VComm Hub vào iPOS: `VCommHub.tsx:25` ghi rõ iPOS là sản phẩm SaaS đa tenant riêng biệt, điểm giao duy nhất là API xác thực mã nhận hàng dùng chung.

## Chưa xác minh được

- Chưa xác minh được giá trị cụ thể của thời hạn nhận hàng và tỉ lệ phí.
- Chưa xác minh được kênh nhắc khách.
- Chưa xác minh được luồng đối soát tiền mặt tại điểm Hub.
- Chưa xác minh được hàm ca làm việc thật của VCommHub (vì `hubService.ts` bị đánh dấu mã chết).
