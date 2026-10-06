# QT-36 — KOL, KOC và Tiếp thị liên kết (mạng gom nhu cầu)

- Dự án: VComm
- Mã quy trình: QT-36
- Phiên bản: 2.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án), mã nguồn `_recovery_V-com-ERP`, và Quyết định chủ dự án 2026-10-09 (xem `Phan_tich_chong_cheo_iPOS_Hub_MuaChung_VXu.md`, mục 6.1 quyết định 4 và mục 4.2/4.3)
- Mô-đun hệ thống: MOD-22 KOL, KOC và Affiliate (`/affiliate`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình quản lý và thiết lập hoa hồng theo ngành hàng

> Quyết định chủ dự án ngày 2026-10-09 (quyết định 4): **không xây vai trò "người gom nhu cầu" (团长) mới** — dùng chính mạng Affiliate/KOL hiện có để gánh vai trò này. Hub vì vậy **không còn phải gánh việc gom nhu cầu**. `leaderId` của mua chung (QT-31) là điểm gắn kết tự nhiên giữa phiên mua chung và người gom nhu cầu. Xem mục 7 và mục 12.

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên marketing | Quản lý danh sách KOL, KOC và thiết lập hoa hồng theo ngành hàng | `src/components/Affiliate.tsx:85`, `:251` |
| Cộng tác viên (Affiliate/KOL/KOC) | Nhận liên kết, theo dõi hoa hồng, **gom nhu cầu (团长): lập nhóm mua chung, đăng hàng, thu đơn** | `src/components/Affiliate.tsx:85`; `src/services/groupBuyService.ts:158`, `:191` (`leaderId`) |
| Hệ thống | Tính hoa hồng và khấu trừ thuế trên hoa hồng; gắn `leaderId` cho phiên mua chung | `src/services/commissionWithholdingService.ts:77`; `src/services/groupBuyService.ts:158` |

## 2. Điều kiện trước

- Đã có danh mục ngành hàng và tỉ lệ hoa hồng tương ứng.
- Đã có quy tắc khấu trừ thuế đối với thu nhập của cộng tác viên.
- (Với vai trò gom nhu cầu) đã có cơ chế mua chung (QT-31) để cộng tác viên mở phiên và gắn `leaderId`.

## 3. Luồng chính

1. Nhân viên marketing đăng ký cộng tác viên và gán mã theo dõi.
2. Thiết lập tỉ lệ hoa hồng theo từng ngành hàng (`Affiliate.tsx:251`).
3. Cộng tác viên **gom nhu cầu**: lập nhóm mua chung, đăng hàng, thu đơn, phối hợp kho, xử lý sau bán — tương ứng vai trò 团长 (không xây vai trò mới, dùng mạng hiện có).
4. Khi mở phiên mua chung, hệ thống gắn `leaderId` cho người gom nhu cầu (`groupBuyService.ts:158`, `:191`).
5. Khách mua qua liên kết hoặc qua phiên mua chung; hệ thống ghi nhận đơn gắn mã cộng tác viên/`leaderId`.
6. Khi đơn hoàn tất, hệ thống tính hoa hồng theo tỉ lệ ngành hàng.
7. Hệ thống tính khấu trừ thuế trên hoa hồng (`commissionWithholdingService.ts:77`).
8. Chi trả hoa hồng đã trừ thuế cho cộng tác viên.

## 4. Sơ đồ

```
[Đăng ký cộng tác viên + mã theo dõi]
            |
            v
[Thiết lập hoa hồng theo ngành hàng :251]
            |
            v
[Cộng tác viên gom nhu cầu (团长)] --> [Mở phiên mua chung + leaderId :158, :191]
            |                                       |
            v                                       v
[Khách mua qua liên kết / phiên]        [Ghi nhận đơn gắn mã / leaderId]
            |
            v
[Đơn hoàn tất] --> [Tính hoa hồng]
            |
            v
[buildCommissionWithholding :77] --> [Chi trả hoa hồng đã trừ thuế]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Ngành hàng chưa có tỉ lệ hoa hồng | Không tính được hoa hồng; yêu cầu cấu hình trước | `src/components/Affiliate.tsx:251` |
| E2 | Đơn bị hủy hoặc đổi trả | Hoa hồng bị thu hồi | `src/components/Affiliate.tsx:85` |
| E3 | Thiếu thông tin thuế của cộng tác viên | Không chi trả được; yêu cầu bổ sung | `src/services/commissionWithholdingService.ts:77` |
| E4 | Phiên mua chung không có `leaderId` | Hệ thống vẫn cho mở phiên, nhưng không gắn người gom nhu cầu | `src/services/groupBuyService.ts:158` |
| E5 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Cộng tác viên: Mới --> Đang hoạt động --> Tạm ngưng
Hoa hồng: Chờ tính --> Đã tính --> Chờ chi trả --> Đã chi trả / Đã thu hồi
Phiên mua chung: Đang mở --> ... --> Hoàn tất (gắn leaderId)
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Tỉ lệ hoa hồng thiết lập theo ngành hàng, không gắn cứng | `src/components/Affiliate.tsx:251` |
| BR-02 | Hoa hồng chỉ tính trên đơn hoàn tất | `src/components/Affiliate.tsx:85` |
| BR-03 | Hoa hồng phải qua khấu trừ thuế trước khi chi trả | `src/services/commissionWithholdingService.ts:77` |
| BR-04 | **Mạng Affiliate/KOL hiện có đảm nhận vai trò "người gom nhu cầu" (团长); không xây vai trò mới** | Quyết định 4 (2026-10-09); `Affiliate.tsx:251` (đủ nền tỉ lệ hoa hồng) |
| BR-05 | Cộng tác viên gom nhu cầu mở phiên mua chung qua `leaderId`; hoa hồng gom nhu cầu trả theo bậc (tham chiếu Pinduoduo 5%–8%) | `src/services/groupBuyService.ts:158`, `:191`; `Affiliate.tsx:251` |
| BR-06 | Hub **không** gánh việc gom nhu cầu — việc này do mạng Affiliate/KOL đảm nhận | Quyết định 4 (2026-10-09); phân tích mục 3.2 |

## 8. Thông báo và nhật ký

- Chưa xác minh được có thông báo cho cộng tác viên khi hoa hồng được ghi nhận hay không.
- Chưa xác minh được nhật ký kiểm toán cho thay đổi tỉ lệ hoa hồng.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng cộng tác viên | Mã, tên, mã theo dõi, trạng thái | `src/components/Affiliate.tsx:85` |
| Bảng tỉ lệ hoa hồng | Ngành hàng, tỉ lệ | `src/components/Affiliate.tsx:251` |
| Bảng hoa hồng phát sinh | Đơn hàng, số tiền, thuế khấu trừ, trạng thái chi trả | `src/services/commissionWithholdingService.ts:77` |
| Bảng phiên mua chung `group_buy_sessions` | `leader_id` (người gom nhu cầu) | `src/services/groupBuyService.ts:158`, `:191` |

## 10. Màn hình

- Quản lý KOL, KOC và Affiliate (`src/components/Affiliate.tsx:85`).
- Thiết lập Hoa hồng Affiliate theo ngành hàng (`src/components/Affiliate.tsx:251`).
- Mua chung (`src/components/GroupBuy.tsx`) — nơi cộng tác viên mở phiên và gắn `leaderId`.

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đơn hoàn tất gắn mã cộng tác viên, Khi tính hoa hồng, Thì số tiền theo tỉ lệ ngành hàng.
- **AC-02.** Cho ngành hàng chưa cấu hình tỉ lệ, Khi tính hoa hồng, Thì hệ thống không tính và báo thiếu cấu hình (ca thất bại bắt buộc).
- **AC-03.** Cho hoa hồng phát sinh, Khi chi trả, Thì đã trừ thuế theo quy định (ca bắt buộc).
- **AC-04.** Cho cộng tác viên mở phiên mua chung, Khi tạo phiên, Thì hệ thống gắn `leaderId` cho người gom nhu cầu (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình quản lý cộng tác viên và dịch vụ khấu trừ thuế.
- **Bổ sung vai trò gom nhu cầu (团长) cho mạng Affiliate/KOL** (quyết định 4): không xây bảng/vai trò mới; dùng `Affiliate.tsx:251` (tỉ lệ hoa hồng theo ngành hàng) làm nền để mở rộng theo bậc doanh số.
- **Gỡ gánh nặng gom nhu cầu khỏi Hub:** quyết định #19 (Hub bán hàng tại trạm) từng khiến Hub gánh luôn việc gom nhu cầu; nay việc này do mạng Affiliate/KOL đảm nhận (xem QT-34).
- Cần bổ sung bảng hoa hồng phát sinh nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Cộng tác viên là cá nhân, có thu nhập phải khấu trừ thuế.
- **Q-01.** Tỉ lệ hoa hồng theo ngành hàng như thế nào?
- **Q-02.** Hoa hồng bị thu hồi khi đơn đổi trả hay chỉ giảm một phần?
- **Q-03.** Bậc hoa hồng gom nhu cầu (团长) tính theo doanh số hay theo số đơn?

## 14. Ghi chú kỹ thuật

- Dịch vụ khấu trừ thuế hoa hồng là hàm thuần, kiểm thử được độc lập (`commissionWithholdingService.ts:77`).
- `leaderId` của mua chung chưa lộ ra giao diện (`grep -rnE "leaderId|leader_id" src/components/` trả về rỗng) — cần lộ ra để cộng tác viên thấy vai trò gom nhu cầu.

## Chưa xác minh được

- Chưa xác minh được tỉ lệ hoa hồng đang áp dụng.
- Chưa xác minh được quy tắc thu hồi hoa hồng khi đổi trả.
- Chưa xác minh được luồng chi trả hoa hồng.
- Chưa xác minh được `leaderId` có được đặt từ giao diện hay chỉ từ dữ liệu mẫu.
