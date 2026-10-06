# Checklist công việc và roadmap

- Dự án: VComm
- Ngày cập nhật gần nhất: 2026-10-09
- Phiên bản mới nhất: tạm hủy 6 quy trình (2 mô-đun tài chính + 4 quy trình CRM cũ) và dồn số QT liên tục — còn 54 quy trình và 42 mô-đun đang hoạt động

## Ký hiệu trạng thái

- ✅ hoàn thành
- 🟡 một phần
- ⬜ chưa làm
- 🔑 cần tài khoản hoặc hạ tầng bên ngoài
- 🏗 hệ thống lớn, làm theo đợt riêng

## 1. Tiến độ theo phân hệ

| Phân hệ | Trạng thái | Việc còn lại |
|---|---|---|
| Kế toán TT99/2025 | 🟡 một phần | Thống nhất sổ kép (journal_entries vs acc_*); kiểm tra đối chiếu TT99 |
| Kho | 🟡 một phần | Ghi phiếu/stock chưa nguyên tử (cần transaction) |
| Bán hàng / E-commerce | 🟡 một phần | Phân loại đủ 76 component; kiểm thử E2E |
| POS (iPOS) | 🟡 một phần | Route checkout chưa rõ guard |
| Nhân sự / Tiền lương | 🟡 một phần | Kiểm thử payrollDeclaration |
| Trung tâm người bán (Seller) | 🟡 một phần | `/api/seller/*` IDOR đã vá (M1, `c384e46`): 11 route có guard + login cấp token + ghi đè sellerId. Còn: ví chưa atomic (M3), `/api/gemini/db-query` chưa guard |
| Đối soát (Settlement) | 🟡 một phần | Quy tắc đối chiếu chi tiết |
| Loyalty | ⬜ chưa làm | |
| Mua chung / F2B2B | ⬜ chưa làm | |
| Tích hợp MISA | 🔑 cần tài khoản | Token giả (`misaService.ts:56`) |
| AI (Gemini) | 🟡 một phần | Route db-query chưa guard (`server.ts:1515`) |
| Bảo mật API | 🟡 một phần | `/api/seller/*` IDOR đã vá (M1, `c384e46`); còn ~63/86 route chưa guard, `/api/gemini/db-query` (`:1515`) VẪN MỞ |
| Multi-tenant / RLS | 🟡 một phần | `domain_events` policy đã siết (M2, `4b9cd56`): chặn anon chưa login; chờ M2.1 (JWT mang claim `tenant_id`) để bỏ hẳn `OR` mặc định |

## 2. Việc còn lại

### 2.1 Làm được ngay, mã M<số phân hệ>

| Mã | Công việc | Phân hệ | Trạng thái | Ghi chú |
|---|---|---|---|---|
| M1 | Thiết kế cơ chế phiên/token người bán (seller-session) rồi gắn guard cho `/api/seller/*` (11 route) + login cấp token + ghi đè sellerId/ownerId (IDOR fix). `/api/gemini/db-query` (`:1515`) VẪN MỞ | Bảo mật API | ✅ hoàn thành | CRITICAL — commit `c384e46`. `src/lib/sellerAuth.ts` (HMAC `node:crypto`), `requireSellerAuth` bảo vệ 11 route, ghi đè `sellerId`/`ownerId` từ token. Test revert-proof (12 test). `/api/gemini/db-query` chưa guard → M1 mở rộng |
| M2 | Thu hẹp policy `domain_events_tenant_isolation` — chặn anon chưa đăng nhập truy cập tenant mặc định (giữ worker trình duyệt đã login) | Multi-tenant | ✅ hoàn thành | commit `4b9cd56` (`006_harden_domain_events_rls.sql`). JWT chưa mang claim `tenant_id` → `M2.1` follow-up |
| M3 | Đưa ghi đường tiền vào transaction / Supabase RPC (ví + ledger nguyên tử) | Kho / Seller | ⬜ chưa làm | `dbService.ts` không có transaction |
| M4 | Thay `accessToken: 'simulated_misa_access_token_abc123'` bằng cấu hình thực | MISA | 🔑 cần tài khoản | `misaService.ts:56` |
| M5 | Thiết kế to-be thống nhất hai sổ kế toán (`journal_entries` vs `acc_*`) | Kế toán | ⬜ chưa làm | Xác định nguồn xác thực duy nhất |
| M6 | Chuẩn hóa báo lỗi API và input validation tập trung | Bảo mật | ⬜ chưa làm | Nhiều handler tự `console.error` |
| M7 | Rà quét toàn bộ 86 route, liệt kê trạng thái guard từng route | Bảo mật API | ⬜ chưa làm | Hiện chỉ đếm tổng (23/86) |

### 2.2 Tính năng mới, mã N<số>

| Mã | Công việc | Trạng thái | Ghi chú |
|---|---|---|---|
| N1 | Bảng mã chức năng (FR-01..FR-13) → ma trận phân quyền | ⬜ chưa làm | từ `07_Yeu_cau_chuc_nang.md` |
| N2 | Thiết kế hệ thống RBAC to-be | ⬜ chưa làm | hiện phân quyền rời rạc |

### 2.3 Cần tài khoản hoặc hạ tầng bên ngoài

| Mã | Công việc | Cần gì | Trạng thái |
|---|---|---|---|
| M4 | Tích hợp MISA thực tế | token/key MISA thật | 🔑 chờ |
| — | Xác thực thực tế (Supabase auth / JWT secret) | biến môi trường Production | 🔑 chờ |

### 2.4 Hệ thống lớn, làm theo đợt riêng

| Mã | Công việc | Trạng thái | Ghi chú |
|---|---|---|---|
| N3 | Thiết kế lại kiến trúc transaction / event-driven chuẩn | ⬜ chưa làm | thay trigger SQL bằng cơ chế bền vững |
| N4 | Kiểm thử xâm nhập (penetration test) toàn diện | ⬜ chưa làm | 🏗 |

## 3. Thứ tự ưu tiên tiếp theo

1. ~~M1~~ ✅ ĐÃ XONG (`c384e46`): seller-session + guard `/api/seller/*` (11 route). Còn `/api/gemini/db-query` (`:1515`) — M1 mở rộng, VẪN MỞ.
2. ~~M2~~ ✅ ĐÃ XONG (`4b9cd56`): siết RLS `domain_events`. Còn M2.1 (JWT mang claim `tenant_id`) để bỏ hẳn `OR` mặc định.
3. M7 — rà quét toàn bộ route (để biết đầy đủ bề mặt).
4. M3 — transaction đường tiền (HIGH).
5. M5 — thống nhất sổ kế toán.

## 4. Đang làm

| Mã | Công việc | Giai đoạn | Người thực hiện | Trạng thái | Hạn | Ghi chú |
|---|---|---|---|---|---|---|
| — | Khảo sát lại toàn bộ quy trình (20 tệp thiết kế) | BA / Thiết kế | AI (Minh) | ✅ hoàn thành khảo sát | 2026-10-05 | `tai-lieu-thiet-ke/*` |
| #156 | Gập vật lý `Ke_hoach/N1…N7` thành 5 thư mục miền (theo ánh xạ 5 nhóm) | Tài liệu | AI (Minh) | ✅ hoàn thành (2026-10-09) | — | 42 tệp MOD-* → `01_Ke_toan`(2), `02_Nhan_su`(4), `03_CRM_Khach_hang`(2), `04_Van_phong_Dieu_hanh`(10), `05_Thuong_mai_Nen_tang_mo_rong`(24); cập nhật `00_INDEX.md`, `00_KE_HOACH_TONG_THE.md`, `_Tam_huy/README.md` |

## 5. Tạm dừng

| Mã | Công việc | Giai đoạn | Người thực hiện | Lý do tạm dừng |
|---|---|---|---|---|
|  |  |  |  |  |

## 6. Đã xong

| Mã | Công việc | Phân hệ | Ngày hoàn thành | Phiên bản | Ghi chú |
|---|---|---|---|---|---|
| — | Sửa 5 lỗi bảo mật (pattern #61,#74,#75,#77,#89,#90) | Bảo mật / Kế toán / Kho | 2026-10-05 | `0126231`,`128dd2f`,`651804f`,`3eac0a6`,`d65dc6a` | chi tiết `19_Bao_mat.md`, `20_Lich_su_thay_doi.md` |
| — | Cho phép ghi đè cổng qua PORT | Hệ thống | 2026-10-05 | `c479756` | `server.ts:119` |
| M1 | Vá IDOR `/api/seller/*` — seller-session HMAC + 11 guard + ghi đè sellerId/ownerId | Bảo mật API | 2026-10-05 | `c384e46` | `src/lib/sellerAuth.ts`, `server.ts` `requireSellerAuth`, test revert-proof (12) |
| M2 | Siết RLS `domain_events` — chặn anon chưa login đọc/ghi tenant mặc định | Multi-tenant | 2026-10-05 | `4b9cd56` | `006_harden_domain_events_rls.sql`, test revert-proof (4) |
| — | Hoàn thiện bộ tài liệu thiết kế (10 tệp stub 05–08, 11–12, 15–18 + quy trình QT-01) | Tài liệu | 2026-10-05 | `tai-lieu-thiet-ke/` | Mỗi tệp có bằng chứng file:line + "Chưa xác minh được"; thêm `Quy_trinh_nghiep_vu/QT-01` |
| — | Viết bộ 59 quy trình nghiệp vụ QT-02 … QT-60 | Tài liệu | 2026-10-05 | `tai-lieu-thiet-ke/Quy_trinh_nghiep_vu/` | Kế toán 11, Nhân sự 11, CRM 5, Văn phòng 2, Thương mại và Vận hành 30; mọi tệp ở trạng thái Chờ duyệt, có mục "Chưa xác minh được" |
| — | Tạm hủy 2 mô-đun: Cho thuê trả góp (`/device-leasing`) và Hỗ trợ Tài chính Nhà bán (`/seller-finance`) | Tài chính / Tài liệu | 2026-10-05 | `_tam_huy/2026-10-05/`, `_Tam_huy/` | Dời tài liệu (QT-49, QT-50, MOD-33, MOD-34) và mã nguồn (DeviceLeasing, SellerFinance) vào thư mục lưu trữ; gỡ route, menu, chỗ nối và test; **giữ nguyên F2B2B (Trụ cột 4)** |
| — | Tạm hủy 4 quy trình CRM không hợp mô hình TMĐT và dồn số QT liên tục | Tài liệu | 2026-10-09 | `_Tam_huy/`, `Quy_trinh_nghiep_vu/` | Dời Tiềm năng, Liên hệ, Cơ hội bán hàng, Báo giá (bỏ tiền tố mã); dồn QT-25→QT-24, QT-29…48→QT-25…44, QT-51…60→QT-45…54; viết lại QT-24 Quản trị Khách hàng theo mô hình eCommerce (khách chỉ sinh ra khi tự đăng ký, quản trị viên là ngoại lệ duy nhất); còn 54 quy trình, số tiếp theo QT-55 |
| — | Chuẩn hóa 5 nhóm chức năng, hợp nhất 24 QT trùng MD_ERP, xóa rác (Request F) | Tài liệu | 2026-10-09 | `tai-lieu-thiet-ke/` | commit `154d8a4` — 30 QT hoạt động, 24 hợp nhất vào MD_ERP, 6 tạm hủy; xóa `.workbuddy-ai/`, `_Luu-tru`; giữ `(1).xlsx` sau content-diff |
| — | Viết lại 7 QT theo 4 quyết định Pinduoduo (QT-31/35/37/34/36/53/54) | Tài liệu | 2026-10-09 | `tai-lieu-thiet-ke/Quy_trinh_nghiep_vu/` | V-Xu động cơ điểm duy nhất (QT-35/37); Hub bán tại quầy phân loại trạm (QT-34); Siêu thị/E-Menu POS nội bộ VComm khác iPOS (QT-53/54); Affiliate/KOL gánh gom nhu cầu (QT-36). Sửa lệch `znsService.ts:212`; ghi nhận `hubService.ts` mã chết |
| #158 | Rà soát 23 QT Nhóm 5 còn lại (việc 8) — kiểm chứng 211 trích dẫn `đường-dẫn:dòng` | Tài liệu | 2026-10-09 | `Quy_trinh_nghiep_vu/` | `server.ts` (8 dòng) + toàn bộ tầng service (`crmService`, `escrowService`, `dbService`, `consentService`, `f2b2bService`, `dropshipService`, `sellerKycService`, `integrationConfigService`, ...) KHỚP nội dung; component `.tsx:dòng` nằm trong phạm vi tệp. 1 mã chết: `SellerFinance.tsx` (chỉ còn ở `_tam_huy/2026-10-05`, dòng 1280 trích sai — thực tế là xác minh vận đơn, quy tắc xác minh tài khoản nhận tiền dùng MOCK bank) → re-point sang bản lưu trữ + ghi chú "Chưa xác minh được" trong QT-43, QT-44. Chi tiết `Phan_tich_...` §6.2 việc 8 |
| #156 | Gập vật lý `Ke_hoach/N1…N7` thành 5 thư mục miền — 42 mô-đun MOD-* | Tài liệu | 2026-10-09 | `Ke_hoach/02_ERP_Module/` | 42 tệp MOD-* chuyển từ 7 thư mục `N1…N7` vào 5 thư mục miền (`01_Ke_toan` 2, `02_Nhan_su` 4, `03_CRM_Khach_hang` 2, `04_Van_phong_Dieu_hanh` 10, `05_Thuong_mai_Nen_tang_mo_rong` 24); cập nhật đường dẫn trong `00_INDEX.md` (Cấp 2) và `00_KE_HOACH_TONG_THE.md` (§5); cập nhật nhãn "Nhóm chức năng" trong 42 MOD; re-point `_Tam_huy/README.md`. Không đứt liên kết (Backend dùng đường dẫn gốc `Ke_hoach/01_He_thong/...`). Phân loại vài module chéo: MOD-31/32 (thanh toán/đối soát) và MOD-35/38 (nhà bán hàng/đội ngũ kinh doanh) → Nhóm 5; MOD-43 (không gian làm việc) → Nhóm 4 |

## 7. Quy ước mã

- M<số> cho việc thuộc phân hệ đã có.
- N<số> cho tính năng mới ngoài kế hoạch gốc.
- Mã N đang dùng đến: N4
- Không đổi mã đã cấp.
- Không tái sử dụng mã N đã dùng, kể cả khi tính năng bị bỏ.
- Bỏ việc theo yêu cầu: gạch ngang và ghi ngày, không xóa im lắng.

## 8. Quy tắc cập nhật

- Chỉ đánh dấu hoàn thành khi đã chạy thử thật và đạt tiêu chí nghiệm thu.
  Chưa kiểm chứng thì để trạng thái một phần kèm ghi chú.
- Cập nhật trong cùng lượt làm việc với việc code, không để lệch với thực tế.
- Cập nhật ngày ở phần đầu sau mỗi lần sửa.
- Phát hành phiên bản mới thì ghi thêm một mục vào 20_Lich_su_thay_doi.md.
- Sau khi cập nhật, báo lại một dòng: mã công việc và trạng thái mới.
