# Thư mục lưu trữ tạm hủy

Thư mục này chứa mã nguồn **tạm hủy** theo yêu cầu của Eric ngày 2026-10-05. Không xóa — chỉ dời khỏi cây đang hoạt động để khôi phục dễ dàng.

## 2026-10-05 — Cho thuê trả góp và Hỗ trợ tài chính Nhà bán

Hai mô-đun bị tạm hủy:

- **Cho thuê thiết bị (Trả góp)** — tuyến đường `/device-leasing`
- **Hỗ trợ Tài chính Nhà bán** — tuyến đường `/seller-finance`

**Giữ nguyên:** F2B2B — Gom đơn B2B (Trụ cột 4), theo xác nhận của Eric.

### Tệp đã dời

| Tệp gốc | Vị trí lưu trữ |
|---|---|
| `src/components/DeviceLeasing.tsx` | `_tam_huy/2026-10-05/src/components/DeviceLeasing.tsx` |
| `src/components/SellerFinance.tsx` | `_tam_huy/2026-10-05/src/components/SellerFinance.tsx` |
| `src/__tests__/device_leasing.test.ts` | `_tam_huy/2026-10-05/src/__tests__/device_leasing.test.ts` |
| `src/__tests__/seller_finance.test.ts` | `_tam_huy/2026-10-05/src/__tests__/seller_finance.test.ts` |

### Chỗ nối đã gỡ

- `src/App.tsx` — hai khai báo `React.lazy` và hai tuyến đường `/seller-finance`, `/device-leasing`
- `src/constants.ts` — hai mục menu "Hỗ trợ Tài chính Nhà bán" và "Cho thuê thiết bị (Trả góp)"
- `src/components/Home.tsx` — bỏ `/seller-finance` khỏi `modulePaths` của nhóm "Tài chính & Thanh toán"
- `src/components/Sidebar.tsx` — bỏ `/seller-finance` khỏi danh sách đường dẫn của ba vai trò `accountant`, `store_manager`, `seller`
- `src/components/WorkflowHub.tsx` — bỏ việc WF-102 "Phê duyệt 12 yêu cầu Early Payout"
- `src/__tests__/crm_integration.test.ts` — bỏ hai khối "Device Leasing Linking" và "B2B Seller Finance & Early Payouts Linking" cùng ba hàm trợ giúp chỉ phục vụ chúng
- `tsconfig.json` và `vitest.config.ts` — loại `_tam_huy` khỏi phạm vi biên dịch và kiểm thử

### Cách khôi phục

1. `git mv _tam_huy/2026-10-05/src/components/<tệp>.tsx src/components/`
2. `git mv _tam_huy/2026-10-05/src/__tests__/<tệp>.test.ts src/__tests__/`
3. Khôi phục các chỗ nối đã gỡ ở trên, đối chiếu commit tương ứng.

### Ghi chú

- `src/services/fixedAssetService.ts` và `src/services/writeFailure.ts` còn nhắc `DeviceLeasing` trong **chú thích** giải thích nguồn gốc mẫu lỗi — giữ nguyên, không phải phụ thuộc mã.
- Các đặc tả lịch sử `specs/001`, `specs/015`, `specs/023`, `specs/029` còn nhắc hai mô-đun này — là **bản ghi tại thời điểm rà soát**, giữ nguyên.
