# QT-31 — Mua chung

- Dự án: VComm
- Mã quy trình: QT-31
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-17 Mua chung (`/group-buy`)
- Hiện trạng mã nguồn: Đã có — dịch vụ mua chung đầy đủ vòng đời, kiểu dữ liệu đúng mô hình 拼团; còn thiếu 免拼, bộ kích hoạt hết hạn và giới hạn mua mỗi người

> Bản 1.0 của quy trình này mô tả "giá theo bậc số lượng" và trích hàm `resolveTierPrice`. **Mô hình đó không tồn tại trong mua chung.** Xem mục 12.

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Người mua (thành viên nhóm) | Tham gia phiên, rời phiên trước khi chốt sổ | `src/services/groupBuyService.ts:210`, `:259` |
| Người mở phiên (团长) | Phát động phiên; được ghi nhận qua `leaderId` | `src/types/erp.ts:741`, `src/services/groupBuyService.ts:158`, `:191` |
| Ban tổ chức hoặc quản trị | Tạo phiên, chốt sổ, huỷ phiên, xoá phiên rỗng | `src/services/groupBuyService.ts:162`, `:307`, `:362`, `:392` |
| Nhà cung cấp | Xác nhận nguồn hàng cho phiên | `src/services/groupBuyService.ts:324` |
| Hệ thống | Đếm số người tham gia; tự hết hạn và hoàn tiền | `specs/016-tru-cot-3-4/migrations/001_group_buy_sessions.sql:190`, `:198` |

## 2. Điều kiện trước

- Đã có sản phẩm hoặc combo, và **một mức giá nhóm duy nhất** thấp hơn giá gốc.
- Số người tối thiểu từ 2 trở lên (`src/services/groupBuyService.ts:165`).
- Hạn chót của phiên nằm trong tương lai (`src/services/groupBuyService.ts:175`).
- Người mua đã có tài khoản khách hàng (xem QT-24).

## 3. Luồng chính

1. Ban tổ chức tạo phiên với **một mức giá duy nhất** và số người tối thiểu (`src/services/groupBuyService.ts:162`).
2. Hệ thống mở phiên và hiển thị danh sách phiên đang mở (`src/services/groupBuyService.ts:79`).
3. Người mua tham gia phiên; hệ thống chặn nếu phiên đã đóng hoặc đã hết hạn (`src/services/groupBuyService.ts:210`, `:216`, `:222`).
4. Người mua có thể rời phiên trước khi chốt sổ (`src/services/groupBuyService.ts:259`).
5. Trigger cơ sở dữ liệu tự cộng số người và nâng phiên lên "Đạt tối thiểu" khi đủ (`specs/016-tru-cot-3-4/migrations/001_group_buy_sessions.sql:190`).
6. Ban tổ chức chốt sổ khi đã đủ người tối thiểu (`src/services/groupBuyService.ts:307`, `:313`).
7. Nhà cung cấp xác nhận nguồn hàng (`src/services/groupBuyService.ts:324`).
8. Hệ thống hoàn tất phiên và gắn mã đơn cho từng người tham gia (`src/services/groupBuyService.ts:334`, `:351`).

## 4. Sơ đồ

```
[Tạo phiên :162 — một giá, tối thiểu >= 2]
            |
            v
[Đang mở] --người mua tham gia :210--> [Trigger đếm :190]
            |                                        |
            |                                        v
            |                            [Đạt tối thiểu :179]
            |                                        |
            v                                        v
[Quá hạn chưa đủ]                        [Chốt sổ :307]
            |                                        |
            v                                        v
[gb_expire_stale_sessions :198]          [Nguồn xác nhận :324]
            |                                        |
            v                                        v
[Hết hạn + hoàn tiền]                    [Hoàn tất + gắn đơn :334, :351]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Tham gia phiên đã đóng hoặc đã chốt sổ | Từ chối tham gia | `src/services/groupBuyService.ts:216` |
| E2 | Tham gia phiên đã hết hạn | Từ chối tham gia | `src/services/groupBuyService.ts:222` |
| E3 | Một khách tham gia hai lần trong cùng phiên | Từ chối | `src/services/groupBuyService.ts:232` |
| E4 | Rời phiên sau khi đã chốt sổ | Từ chối rời | `src/services/groupBuyService.ts:267` |
| E5 | Chốt sổ khi chưa đủ người tối thiểu | Từ chối chốt | `src/services/groupBuyService.ts:313` |
| E6 | Xoá phiên đã có người tham gia | Từ chối; yêu cầu huỷ thay vì xoá | `src/services/groupBuyService.ts:397` |
| E7 | Số người tối thiểu nhỏ hơn 2 | Từ chối tạo phiên | `src/services/groupBuyService.ts:165` |
| E8 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Phiên: Đang mở --> Đạt tối thiểu --> Đã chốt sổ --> Nguồn đã xác nhận --> Hoàn tất
Bất kỳ bước nào --> Đã huỷ
Đang mở --quá hạn chưa đủ người--> Hết hạn
Người tham gia: Đã tham gia --> Đã chốt đơn
Đã tham gia / Đã chốt đơn --huỷ phiên hoặc hết hạn--> Đã hoàn tiền
Đã tham gia --tự rời--> Đã rời
```

Tập chuyển trạng thái hợp lệ ở `src/services/groupBuyService.ts:34`; nhãn trạng thái phiên ở `:422`, nhãn trạng thái người tham gia ở `:432`.

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Một phiên chỉ có **một mức giá duy nhất**, không có bậc giá theo số người | `src/types/erp.ts:741` (`unitPrice`); `src/services/groupBuyService.ts:189` |
| BR-02 | Số người tối thiểu từ 2 trở lên | `src/services/groupBuyService.ts:165` |
| BR-03 | Hạn chót của phiên phải nằm trong tương lai | `src/services/groupBuyService.ts:175` |
| BR-04 | Một khách chỉ có một dòng đang hoạt động trong một phiên | `src/services/groupBuyService.ts:232`; `specs/016-tru-cot-3-4/migrations/001_group_buy_sessions.sql:142` |
| BR-05 | Không rời phiên sau khi đã chốt sổ | `src/services/groupBuyService.ts:267` |
| BR-06 | Chỉ chốt sổ khi đã đủ người tối thiểu | `src/services/groupBuyService.ts:313` |
| BR-07 | Huỷ phiên thì hoàn tiền cho mọi người đang hoạt động | `src/services/groupBuyService.ts:379` |
| BR-08 | Số người tham gia do trigger cơ sở dữ liệu quản lý, tầng ứng dụng không ghi | `specs/016-tru-cot-3-4/migrations/001_group_buy_sessions.sql:190`; `src/services/groupBuyService.ts:26` |
| BR-09 | Chỉ xoá được phiên chưa có người tham gia | `src/services/groupBuyService.ts:397` |
| BR-10 | **免拼 (miễn ghép):** khách có lượt miễn ghép được mua một mình vẫn hưởng giá nhóm; hàng trong kênh trợ giá sâu không được miễn ghép | **Đề xuất mới — chưa có trong mã nguồn** |
| BR-11 | Giới hạn số lượng hoặc giá trị mua mỗi người trong một phiên, chống vét tồn | **Đề xuất mới — chưa có trong mã nguồn** |

## 8. Thông báo và nhật ký

- Giao diện tạo phiên ghi chú "Hết hạn chưa đạt tối thiểu, phiên tự chuyển 'Hết hạn' và hoàn tiền người tham gia (cron DB)" (`src/components/GroupBuy.tsx:189`) — nhưng **chưa có bộ lịch chạy nào** gọi hàm hoàn tiền (xem mục 12).
- Chưa xác minh được có thông báo cho người tham gia khi phiên chốt hoặc khi phiên hết hạn hay không.
- **Không có tệp kiểm thử nào cho dịch vụ mua chung** — `grep -rln "groupBuyService" --include=*.test.ts` trả về rỗng. Bản 1.0 ghi "có tệp kiểm thử đi kèm" là **sai**.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng phiên mua chung `group_buy_sessions` | `unit_price`, `min_participants`, `current_participants`, `leader_id`, `expires_at`, `status` | `specs/016-tru-cot-3-4/migrations/001_group_buy_sessions.sql:34`–`:43` |
| Bảng người tham gia `group_buy_participants` | `session_id`, `customer_id`, `quantity`, `unit_price`, `amount`, `status`, `payment_ref`, `order_id` | `specs/016-tru-cot-3-4/migrations/001_group_buy_sessions.sql:123`–`:138` |
| Bảng bậc giá | **Không tồn tại** — mua chung dùng một mức giá duy nhất | `grep -cniE "bậc\|tier" src/services/groupBuyService.ts` trả về 0 |

## 10. Màn hình

- Mua chung (`src/components/GroupBuy.tsx`, tuyến `/group-buy`, 719 dòng).
- Tạo phiên Mua chung (`src/components/GroupBuy.tsx:113`) — mặc định 5 người, 48 giờ (`:67`).
- Thêm người tham gia — demo vận hành nội bộ (`src/components/GroupBuy.tsx:198`, `:240`).
- Quản lý phiên và người tham gia (`src/components/GroupBuy.tsx:521`, `:608`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho phiên đang mở, Khi người mua tham gia, Thì người mua vào danh sách phiên.
- **AC-02.** Cho phiên đã chốt sổ, Khi người mua rời, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho phiên đủ số người tối thiểu, Khi chốt sổ, Thì phiên chuyển sang "Đã chốt sổ".
- **AC-04.** Cho phiên đã chốt sổ, Khi chốt lần hai, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-05.** Cho phiên quá hạn chưa đủ người, Khi bộ lịch chạy, Thì phiên chuyển "Hết hạn" và mọi người được hoàn tiền (ca bắt buộc).
- **AC-06.** Cho khách có lượt miễn ghép, Khi mua một mình, Thì vẫn hưởng giá nhóm và lượt miễn ghép bị trừ (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại dịch vụ mua chung và màn hình đã có.
- **Sửa tài liệu:** bản 1.0 mô tả "giá theo bậc số lượng", "Bảng bậc giá" và trích `resolveTierPrice` — mô hình đó không tồn tại trong mua chung. `resolveTierPrice` chỉ có ở `src/services/f2b2bService.ts:76` (gom đơn B2B).
- **Bổ sung:** trường cho 免拼 và giới hạn mua mỗi người; bộ lịch chạy gọi `gb_expire_stale_sessions()`; lộ `leaderId` ra giao diện.
- **Gỡ hiểu nhầm:** chú thích `src/components/GroupBuy.tsx:189` nói "cron DB" nhưng chưa có bộ lịch chạy nào.

## 13. Giả định và câu hỏi mở

- **GD-01.** Phiên mua chung gắn với một sản phẩm hoặc một combo.
- **GD-02.** Giá nhóm thấp hơn giá gốc.
- **Q-01.** Số người tối thiểu mặc định cho từng nhóm hàng là bao nhiêu? (mã nguồn đang mặc định 5)
- **Q-02.** Thời hạn phiên mặc định là bao nhiêu giờ? (mã nguồn đang mặc định 48 giờ; Pinduoduo thường dùng 24 giờ)
- **Q-03.** Lượt miễn ghép kiếm từ đâu (điểm danh, mua sắm, hạng thành viên)?
- **Q-04.** Giới hạn mua mỗi người tính theo số lượng hay theo giá trị?
- **Q-05.** Có cần đặt cọc khi tham gia phiên không?
- **Q-06.** Kênh trợ giá sâu nào bị loại khỏi 免拼?

## 14. Ghi chú kỹ thuật

- Dịch vụ mua chung là hàm thuần theo mã phiên, thuận lợi cho kiểm thử.
- Mọi chuyển trạng thái đi qua `assertTransition` (`src/services/groupBuyService.ts:51`), tập hợp lệ ở `:34`.
- `current_participants` do trigger `trg_gbp_sync` quản lý (`specs/016-tru-cot-3-4/migrations/001_group_buy_sessions.sql:190`); tầng ứng dụng không ghi để tránh đếm sai khi có người tham gia đồng thời.
- Hàm `gb_expire_stale_sessions()` đã có ở tầng cơ sở dữ liệu (`specs/016-tru-cot-3-4/migrations/001_group_buy_sessions.sql:198`) nhưng **chưa được nối vào bộ lịch chạy**.
- Trạng thái `expired` đã có trong ràng buộc CHECK (`specs/016-tru-cot-3-4/migrations/001_group_buy_sessions.sql:93`).

## Chưa xác minh được

- Chưa xác minh được luồng sinh đơn hàng sau khi chốt phiên — hàm `completeSession` nhận `orderIds` từ bên ngoài, chưa rõ thành phần nào sinh.
- Chưa xác minh được bộ lịch chạy nào gọi `gb_expire_stale_sessions()` trong môi trường sản xuất.
- Chưa xác minh được cơ chế đặt cọc.
- Chưa xác minh được `leaderId` có được đặt từ giao diện hay chỉ từ dữ liệu mẫu.
- Chưa xác minh được có thông báo cho người tham gia khi phiên chốt hoặc hết hạn hay không.
