# QT-01 — Đăng nhập và xác thực phiên người bán

- Dự án: VComm
- Mã quy trình: QT-01
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Liên quan: FR-01, FR-09 (`07_Yeu_cau_chuc_nang.md`); M1 (`Checklist_cong_viec.md`)

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Người bán (Seller) | Đăng ký, đăng nhập, thao tác dữ liệu của chính mình | `server.ts:3346`, `:3447`, `:3523` |
| Nhân viên người bán (Staff) | Đăng nhập theo `seller_staffs`, cùng phiên với người bán | `server.ts:41-43`, `:66` |
| Ẩn danh | Chỉ được đăng ký/đăng nhập; mọi route khác bị từ chối | `server.ts:424` |

Quyền do máy chủ quyết định qua `requireSellerAuth`; ẩn nút trên giao diện không được coi là bảo mật.

## 2. Điều kiện trước

- Người bán đã có bản ghi trong bảng `sellers`; nhân viên có bản ghi trong `seller_staffs` (`server.ts:41-59`).
- Biến môi trường `SELLER_TOKEN_SECRET` đã cấu hình ở Production (nếu thiếu, hệ thống fail-closed, `src/lib/sellerAuth.ts`).

## 3. Luồng chính

1. Người bán gửi thông tin tới `POST /api/seller/auth/login` (`server.ts:3447`).
2. Máy chủ truy vấn `seller_staffs` theo người dùng (`server.ts:41-43`).
3. Nếu có, tra `sellers` theo `seller_id` (`server.ts:56-59`).
4. Máy chủ cấp token HMAC-SHA256: `issueSellerToken(staffRow.seller_id)` (`server.ts:3514`).
5. Trả về `seller`, `role`, `token` (`server.ts:65-68`).
6. Client gửi kèm `Authorization: Bearer <token>` cho các thao tác sau.
7. `requireSellerAuth` (`server.ts:424`) xác thực token, ghi đè `sellerId`/`ownerId` rồi cho đi tiếp.

## 4. Sơ đồ

```
[Seller/Staff]
   |  POST /api/seller/auth/login
   v
[seller_staffs] --seller_id--> [sellers]
   |                                 |
   v                                 v
issueSellerToken(seller_id)  --> token HMAC (sid, iat, exp)
   |
   v
[Client] --Authorization: Bearer token--> [requireSellerAuth]
                                              |
                                              v
                                 ghi đè sellerId/ownerId từ token
                                              |
                                              v
                                        [Route nghiệp vụ]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Thiếu thông tin đăng nhập | Trả lỗi, không cấp token | `server.ts:3447` |
| E2 | Sai thông tin | Trả lỗi, không cấp token | `server.ts:3447` |
| E3 | Người dùng không có trong `seller_staffs` | Không cấp token (gợi ý đăng ký) | `server.ts:48-53` |
| E4 | Thiếu token ở route nghiệp vụ | HTTP 401 | `server.ts:424` |
| E5 | Token sai định dạng | HTTP 401 | `src/lib/sellerAuth.ts` |
| E6 | Token bị sửa đổi (chữ ký sai) | HTTP 401 | `src/lib/sellerAuth.ts` |
| E7 | Token hết hạn | HTTP 401 | `src/lib/sellerAuth.ts` |
| E8 | Thiếu `SELLER_TOKEN_SECRET` ở Production | Fail-closed, ném lỗi khi ký/kiểm | `src/lib/sellerAuth.ts` |
| E9 | Token của A cố truy cập dữ liệu B | `sellerId` bị ghi đè về A (không lộ dữ liệu B) | `server.ts:424` |

## 6. Máy trạng thái phiên

```
Chưa có phiên --đăng nhập thành công--> Đang có phiên (token còn hạn)
Đang có phiên --hết hạn token--------> Hết phiên (phải đăng nhập lại)
Đang có phiên --token sai/sửa--------> Bị từ chối (401)
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Token ký bằng HMAC-SHA256 trên payload `sid`, `iat`, `exp` | `src/lib/sellerAuth.ts` |
| BR-02 | Thời hạn token mặc định 12 giờ | `src/lib/sellerAuth.ts` |
| BR-03 | Máy chủ không tin `sellerId` từ client; luôn ghi đè bằng `sellerId` trong token | `server.ts:424` |
| BR-04 | So khớp chữ ký theo thời gian hằng (timing-safe) | `src/lib/sellerAuth.ts` |
| BR-05 | Thiếu khóa bí mật ở Production → từ chối (fail-closed) | `src/lib/sellerAuth.ts` |

## 8. Thông báo và nhật ký

- Lỗi trả về dạng JSON `{ status: 'error', message }` (`server.ts:424`).
- Sự kiện bảo mật (đăng nhập, từ chối) hiện ghi qua `logger` chung; chưa có nhật ký kiểm toán riêng cho đăng nhập người bán.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| `seller_staffs` | `seller_id`, `role` | `server.ts:42-43` |
| `sellers` | `id` (+ hồ sơ người bán) | `server.ts:56-59` |

Token không lưu cơ sở dữ liệu (phiên không trạng thái — stateless).

## 10. Màn hình

- Giao diện người bán nằm ở client riêng (ngoài kho mã này); trang quản trị liên quan là `SellerManagement` (`src/App.tsx:388`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho người bán đã đăng ký, Khi đăng nhập đúng, Thì nhận `token` hợp lệ.
- **AC-02.** Cho client không token, Khi gọi route nghiệp vụ người bán, Thì nhận HTTP 401.
- **AC-03.** Cho token hợp lệ của người bán A, Khi gọi dữ liệu với `sellerId` của B, Thì `sellerId` bị ghi đè về A (thất bại về quyền: B không bị đọc trộm).
- **AC-04.** Cho token bị sửa đổi, Khi gọi route nghiệp vụ, Thì nhận HTTP 401.
- **AC-05.** Cho token hết hạn, Khi gọi route nghiệp vụ, Thì nhận HTTP 401.

## 12. Ảnh hưởng tới phần có sẵn

- Thêm module `src/lib/sellerAuth.ts` (mới), middleware `requireSellerAuth` (`server.ts:424`), cấp token ở login (`server.ts:3514`), gắn guard cho 11 route (`server.ts:3523`–`:3910`).
- Route `register`/`login` giữ công khai (`server.ts:3346`, `:3447`) — không phá luồng đăng ký/đăng nhập hiện có.
- Client người bán (ngoài kho mã) **phải** gửi `Authorization: Bearer <token>` sau khi đăng nhập; đây là thay đổi hợp đồng API cần phối hợp.
- Không đổi schema dữ liệu.

## 13. Giả định và câu hỏi mở

- **GD-01.** Client người bán (Seller Centre) nằm ngoài kho mã này và sẽ được cập nhật để gửi token.
- **GD-02.** `SELLER_TOKEN_SECRET` sẽ được cấu hình ở Production trước khi phát hành.
- **Q-01.** Thời hạn token 12 giờ đã phù hợp nghiệp vụ chưa, có cần cơ chế làm mới (refresh) không?
- **Q-02.** Các giá trị `role` trong `seller_staffs` là gì, và có phân quyền khác nhau giữa các `role` không?
- **Q-03.** Có cần thu hồi token trước hạn (đăng xuất phía máy chủ, danh sách đen) không?

## 14. Ghi chú kỹ thuật

- Dự án không có `jsonwebtoken` → dùng `node:crypto` (HMAC-SHA256, base64url).
- Kiểm thử revert-proof: `src/lib/sellerAuth.test.ts` (7), `src/services/sellerAuthGuards.test.ts` (5).
- Commit tham chiếu: `c384e46`.

## Chưa xác minh được

- Giao diện đăng nhập phía client người bán (nằm ngoài kho mã) — chưa xác minh.
- Cơ chế làm mới/đăng xuất token — chưa có trong mã nguồn hiện tại.
- Nhật ký kiểm toán riêng cho sự kiện đăng nhập — chưa có.
