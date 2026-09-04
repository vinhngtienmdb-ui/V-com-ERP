# Spec 018 — Tách O2O thành hai sản phẩm phần mềm

**Ngày:** 2026-09-02
**Căn cứ:** Quyết định 6 của đợt rà soát (`specs/015` mục 9.3) · Đề án phần E.1–E.4
**Trạng thái:** Đã chốt hướng · Chờ xác nhận nguồn lực

---

## 1. Quyết định

O2O **không phải một module** — nó là **hai sản phẩm phần mềm khác nhau**, với hai đội
vận hành, hai mô hình triển khai và hai kiến trúc dữ liệu khác nhau:

| # | Sản phẩm | Ai vận hành | Phần mềm | Bản chất |
|---|---|---|---|---|
| 1 | **VComm Hub** | **VComm tự vận hành** | **VComm HUB** (module trong ERP này) | Trạm giao hàng / shop offline của VComm |
| 2 | **Shop Offline đối tác** | **Đối tác** | **iPOS** — sản phẩm **riêng biệt**, mô hình **SaaS**, đầy đủ chức năng | Mạng lưới điểm bán ngoài VComm |

> Hai sản phẩm này **không gộp chung bảng, không gộp chung route**.
> Điểm giao nhau duy nhất là **mã QR nhận hàng**: chủ trạm quét bằng phần mềm
> của họ (VComm HUB hoặc iPOS), nhưng cùng gọi về một API xác thực của VComm.

---

## 2. Vì sao tách — ba lý do

1. **Khác chủ thể vận hành.** Hub do VComm quản lý nhân sự, ca trực, tồn kho.
   Shop đối tác không phải nhân sự VComm — không thể gán cùng một luồng phân quyền.
2. **Khác mô hình cô lập dữ liệu.** Hub nằm **cùng tenant** với VComm.
   Shop đối tác mỗi chủ là **một tenant độc lập** — nếu dùng chung tenant,
   shop A thấy được doanh thu của shop B. Đây là lỗi không thể chấp nhận ở sản phẩm SaaS.
3. **Khác phạm vi chức năng.** Hub chỉ cần: nhận hàng, lưu kho tạm, giao chặng cuối,
   đồng kiểm, hoàn tiền. Shop đối tác cần **POS đầy đủ**: bán tại quầy, thu ngân,
   quản lý kho, ca làm việc, báo cáo doanh thu, in hoá đơn.

---

## 3. So sánh chi tiết

| Tiêu chí | VComm Hub | iPOS (Shop Offline đối tác) |
|---|---|---|
| Chủ vận hành | VComm | Đối tác |
| Nhân sự | Nhân viên VComm | Nhân viên của đối tác |
| Phần mềm | **VComm HUB** — module trong repo này | **iPOS** — sản phẩm riêng |
| Mô hình dữ liệu | **Cùng tenant** `tenant-vcomm-prod-01` | **Đa tenant** — mỗi shop một tenant |
| Phạm vi chức năng | Nhận/giữ hàng, giao chặng cuối, đồng kiểm, hoàn tiền | **POS đầy đủ**: bán hàng, kho, thu ngân, ca, báo cáo |
| Hạ tầng | Nằm trong ERP hiện tại (Vercel + Supabase) | Cần **triển khai riêng** + provisioning |
| Thanh toán | Nội bộ | **Cần billing theo tenant** (gói, hạn, giới hạn) |
| Loại trạm | Standard / Freeze Hub / Tủ khóa 24-7 | Không áp dụng |

---

## 4. Phần A — VComm Hub (xây trong repo này)

### 4.1 Ba loại trạm (theo Đề án E.2)

| Loại | Mã | Đặc điểm |
|---|---|---|
| Trạm tiêu chuẩn | `standard` | Nhận hàng thường, có nhân viên trực |
| Trạm đông lạnh | `freeze` | Có kho lạnh cho hàng đông lạnh / tươi sống |
| Tủ khóa 24-7 | `locker` | Tự phục vụ, mở bằng mã, không cần nhân viên |

### 4.2 Vòng đời kiện hàng tại trạm

```
in_transit ──(hàng đến trạm)──> arrived ──(sẵn sàng nhận)──> ready
                                                               │
                            ┌──────────────────────────────────┴──────────┐
                       (quét QR, ≤72h)                              (quá 72h)
                            │                                            │
                       picked_up                                     expired
                            │                                            │
                       (đối soát)                                    returned
```

### 4.3 Các quy tắc nghiệp vụ bắt buộc (Đề án E.3)

| Quy tắc | Hiện thực |
|---|---|
| Đặt online, chọn Hub gần nhất | `findNearestHub(provinceCode)` loại trừ Hub quá tải |
| **Định tuyến linh hoạt khi Hub quá tải** | Hub có `currentLoad >= capacity` → tự động **ẩn** khỏi kết quả tìm kiếm, điều hướng sang trạm lân cận |
| Nhận hàng bằng **QR động** | Mã QR xoay vòng theo thời gian (TOTP), chủ trạm quét để xác thực |
| **Nhắc 48h / 72h** | Cờ `reminder48hAt` / `reminder72hAt` |
| **Tự huỷ sau 72h**, phạt 15% | Hàm `expireStalePackages()` — quá 72h → `expired` → `returned`, ghi phạt 15% |
| **Đồng kiểm & hoàn tiền tức thì** tại trạm | Trạng thái `picked_up` kèm cờ `inspectionOk` |
| **Quỹ bảo hiểm O2O 100–200đ/đơn** | Cột `insuranceFee` trên mỗi kiện |

### 4.4 Bảng dữ liệu

- `vcomm_hubs` — danh mục trạm, sức chứa, tải hiện tại, loại trạm
- `hub_shipments` — kiện hàng gửi về trạm, vòng đời và các mốc thời gian

Chi tiết: `migrations/001_vcomm_hub.sql`

---

## 5. Phần B — iPOS (sản phẩm riêng, KHÔNG xây trong repo này)

### 5.1 Khuyến nghị: tách repo / tách triển khai

iPOS là **một sản phẩm SaaS độc lập**, không phải module của VComm ERP.
Lý do: khác tenant model, khác vòng đời phát hành, khác SLA,
và quan trọng nhất — **khác cơ sở dữ liệu tenant**.

> Nếu nhét iPOS vào repo này, mọi truy vấn trong ERP sẽ phải mang theo điều kiện
> "đây là tenant shop hay tenant VComm" — một lớp complexity dễ sinh lỗi rò rỉ dữ liệu
> giữa các shop đối tác.

### 5.2 Điều kiện tiên quyết: multi-tenancy thực sự

Quyết định này **đẩy yêu cầu multi-tenancy từ "Năm 2" lên trước khi O2O ra mắt**.

Hiện trạng: RLS đã có, nhưng hệ thống đang sống với giả định
`tenant_id = 'tenant-vcomm-prod-01'` cố định. Thiếu bốn thứ:

| # | Thành phần | Hiện trạng | Cần bổ sung |
|---|---|---|---|
| 1 | **Tenant provisioning** | ❌ | Tạo tenant mới: schema, admin đầu tiên, seeding dữ liệu mẫu |
| 2 | **Cô lập dữ liệu** | ⚠️ RLS có nhưng chưa từng test đa tenant | Test tự động: tenant A không thấy dữ liệu tenant B |
| 3 | **Billing theo tenant** | ❌ | Gói dịch vụ, hạn dùng, giới hạn (số SKU / số đơn / số user) |
| 4 | **Upgrade / downgrade path** | ❌ | Chuyển gói, khoá khi quá hạn, giữ dữ liệu khi downgrade |

> ⚠️ **Đây là spec riêng, cần làm trước khi viết bất kỳ dòng code iPOS nào.**
> Khuyến nghị: `specs/019-multi-tenancy.md`.

### 5.3 Giao tiếp giữa hai sản phẩm

iPOS và VComm giao tiếp qua **API, không qua database chung**:

| Tình huống | Hướng | Cơ chế |
|---|---|---|
| Chủ shop đối tác quét QR nhận hàng | iPOS → VComm | `POST /api/o2o/verify-pickup` — truyền mã QR, VComm xác thực và trả kết quả |
| Đồng bộ trạng thái kiện hàng | VComm → iPOS | Webhook `pickup.completed` |
| Đối soát COD | Hai chiều | Job đối soát T+1 |

---

## 6. Thứ tự triển khai

| Đợt | Hạng mục | Thuộc | Phụ thuộc |
|---|---|---|---|
| 1 | **VComm Hub** — schema + service + UI | Repo này | Không |
| 2 | **spec 019 — Multi-tenancy** (provisioning, isolation test, billing) | Repo này (lõi) | — |
| 3 | **iPOS** — repo riêng, POS đầy đủ | Repo mới | Đợt 2 |

> Đợt 1 làm ngay được vì Hub nằm cùng tenant — không vướng multi-tenancy.
> Đợt 3 **không được bắt đầu** khi đợt 2 chưa xong.

---

## 7. Rủi ro

| # | Rủi ro | Mức | Cách giảm thiểu |
|---|---|---|---|
| 1 | Bắt đầu iPOS trước khi có multi-tenancy → rò rỉ dữ liệu giữa các shop | **Cao** | Chặn đợt 3 cho đến khi đợt 2 có test cô lập chạy xanh |
| 2 | Xây Hub khi chưa có mạng lưới trạm vật lý → tính năng chết | **Cao** | Xây nhưng **chưa bật** trên menu cho đến khi có trạm đầu tiên; dùng seed data để demo |
| 3 | Hai sản phẩm lệch chuẩn QR → không quét được chéo | Trung bình | Một API xác thực QR duy nhất (`/api/o2o/verify-pickup`), cả hai sản phẩm đều gọi |
| 4 | Định tuyến quá tải sai → kiện hàng dồn vào trạm đã đầy | Trung bình | `findNearestHub` loại trừ trạm `currentLoad >= capacity`, luôn trả phương án dự phòng |

---

## 8. Câu hỏi còn mở (chặn tiến độ)

| # | Câu hỏi | Tại sao quan trọng |
|---|---|---|
| 1 | **Mấy dev? Ai xác nhận nghiệp vụ cho Feature Registry?** | GĐ1 của `015` (Feature Registry) vẫn bị chặn. Chưa có người ký xác nhận thì không được xoá/gộp bất cứ tính năng nào |
| 2 | **Đã có trạm VComm Hub vật lý nào chưa?** | Quyết định có bật menu Hub hay để ẩn chờ. Xem rủi ro 2 |
| 3 | **iPOS có đội riêng không?** | Quyết định có thể song song hoá đợt 2 và 3 hay phải nối tiếp |
| 4 | Gói billing iPOS tính theo gì (SKU / đơn / user)? | Ảnh hưởng trực tiếp thiết kế bảng tenant ở đợt 2 |
