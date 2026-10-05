# Ca kiểm thử

> Danh sách ca kiểm thử theo chức năng, dữ liệu đầu vào, kết quả mong đợi, kết quả thực tế.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Quy ước

- Mã ca kiểm thử: `TC-nn`.
- Cột "Kết quả thực tế" ghi trạng thái đã chạy: Đạt / Chưa chạy / Không đạt.

## 2. Ca kiểm thử theo chức năng

### 2.1. Xác thực người bán (FR-01, FR-09)

| Mã | Tiêu chí | Đầu vào | Mong đợi | Tệp kiểm thử | Thực tế |
|---|---|---|---|---|---|
| TC-01 | AC-01 | `sellerId='seller-abc-123'` | `verifySellerToken` trả đúng `sellerId` | `src/lib/sellerAuth.test.ts` | Đạt |
| TC-02 | AC-04 | Token bị sửa 2 ký tự cuối | Ném `SellerAuthError` | `src/lib/sellerAuth.test.ts` | Đạt |
| TC-03 | AC-05 | Token `ttlSeconds=-10` | Ném lỗi hết hạn | `src/lib/sellerAuth.test.ts` | Đạt |
| TC-04 | AC-04 | Token ký bằng khóa khác | Ném lỗi chữ ký | `src/lib/sellerAuth.test.ts` | Đạt |
| TC-05 | AC-02 | Không có header `Authorization` | `parseBearerToken` trả `null` | `src/lib/sellerAuth.test.ts` | Đạt |
| TC-06 | AC-03 | Token người bán A, gọi dữ liệu B | `sellerId` bị ghi đè về A | `src/services/sellerAuthGuards.test.ts` | Đạt |
| TC-07 | AC-02/AC-03 | Đọc `server.ts` | Đủ 11 route có `requireSellerAuth` | `src/services/sellerAuthGuards.test.ts` | Đạt |

### 2.2. RLS `domain_events` (chức năng đa doanh nghiệp)

| Mã | Tiêu chí | Đầu vào | Mong đợi | Tệp kiểm thử | Thực tế |
|---|---|---|---|---|---|
| TC-08 | AC-11 | Tệp `006_harden_domain_events_rls.sql` | Có `DROP POLICY` + điều kiện `auth.uid() IS NOT NULL` | `src/services/domainEventsRls.test.ts` | Đạt |
| TC-09 | AC-11 | Mọi lần xuất hiện `tenant-vcomm-prod-01` | Đều được canh bởi `auth.uid() IS NOT NULL` | `src/services/domainEventsRls.test.ts` | Đạt |

### 2.3. Kế toán và khóa sổ (FR-12)

| Mã | Tiêu chí | Đầu vào | Mong đợi | Tệp kiểm thử | Thực tế |
|---|---|---|---|---|---|
| TC-10 | AC-09 | Số liệu khóa sổ | Vân tay SHA-256 giữ dấu | `src/services/ledgerClosing.test.ts` | Đạt |
| TC-11 | AC-09 | Khóa sổ hai lần cùng số liệu | Cùng vân tay (không va chạm do `Math.abs`) | `src/services/finance_ledger_lock.test.ts` | Đạt |
| TC-12 | FR-12 | Bút toán lệch Nợ/Có > 0,01 | Từ chối ghi | `saveJournalEntry` (nội bộ) | Chưa chạy trực tiếp |

### 2.4. Thanh toán và sự kiện

| Mã | Tiêu chí | Đầu vào | Mong đợi | Tệp kiểm thử | Thực tế |
|---|---|---|---|---|---|
| TC-13 | AC-10 | Lỗi ghi `payments` | Báo lỗi, không nuốt thầm | `src/services/order_payment_trigger.test.ts` | Đạt |
| TC-14 | FR-03 | Đơn sang `paid` | Kích hoạt ghi bản ghi `payments` | `src/services/order_payment_trigger.test.ts` | Đạt |

### 2.5. Guard các route nhạy cảm

| Mã | Tiêu chí | Đầu vào | Mong đợi | Thực tế |
|---|---|---|---|---|
| TC-15 | AC-06 | Không khóa iPOS | `/api/ipos/accounts` bị từ chối | Chưa chạy đầu-cuối (guard có trong mã) |
| TC-16 | AC-07 | Khóa Open API sai | `/api/openapi/orders` bị từ chối | Chưa chạy đầu-cuối |
| TC-17 | AC-12 | Gọi `/api/gemini/db-query` không quyền | Phải bị từ chối | **Không đạt** (route chưa guard, `server.ts:1554`) |

## 3. Ca kiểm thử thất bại về quyền (bắt buộc)

- TC-06: token người bán A không đọc được dữ liệu người bán B (chống IDOR) — Đạt.
- TC-17: truy vấn cơ sở dữ liệu qua `/api/gemini/db-query` khi chưa guard — Không đạt (còn hở).

## Chưa xác minh được

- Kết quả thực tế của các ca đầu-cuối (TC-12, TC-15, TC-16, TC-17) trên môi trường thật — chưa dựng server gọi thử.
- Số lượng đầy đủ ca kiểm thử trong 86 tệp `*.test.ts` (mới trích nhóm tiêu biểu).
