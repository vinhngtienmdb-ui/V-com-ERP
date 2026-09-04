# SPEC 020 — Tuân thủ TT88/2021: 7 sổ kế toán hộ kinh doanh + xuất XML nộp thuế

## 1. Hiệu đính quan trọng so với spec 015

spec 015 §3.2 ghi: **"TT88/2021 — 4 sổ kế toán bắt buộc"**. Con số này **không khớp văn bản gốc**.

Đối chiếu **TT88/2021/TT-BTC Điều 5 khoản 4**, danh mục sổ kế toán gồm **7 sổ**:

| STT | Tên sổ | Ký hiệu |
|---|---|---|
| 1 | Sổ chi tiết doanh thu bán hàng hóa, dịch vụ | S1-HKD |
| 2 | Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa | S2-HKD |
| 3 | Sổ chi phí sản xuất, kinh doanh | S3-HKD |
| 4 | Sổ theo dõi tình hình thực hiện nghĩa vụ thuế với NSNN | S4-HKD |
| 5 | Sổ theo dõi thanh toán tiền lương và các khoản nộp theo lương | S5-HKD |
| 6 | Sổ quỹ tiền mặt | S6-HKD |
| 7 | Sổ tiền gửi ngân hàng | S7-HKD |

**Nghĩa vụ áp dụng** (Điều 2):
- Điều 2(1) — **bắt buộc** với hộ/cá nhân kinh doanh nộp thuế theo **phương pháp kê khai**.
- Điều 2(2) — phương pháp **khoán** nằm ngoài diện bắt buộc, chỉ "được khuyến khích".
- Không có danh mục sổ riêng cho khoán; khác biệt nằm ở **nghĩa vụ**, không phải loại sổ.

**Quy tắc bổ sung** (cuối Điều 5(4)): nếu hộ kinh doanh có **nhiều địa điểm kinh doanh** thì phải mở sổ theo dõi chi tiết **từng địa điểm** → mọi bảng sổ đều có `location_code`.

> Hệ quả: spec 015 đã được sửa lại thành 7 sổ. Build theo 7 sổ để không phải đập đi làm lại khi cơ quan thuế kiểm tra.

## 2. Biểu thuế hộ kinh doanh — TT40/2021 Điều 10

| Mã | Ngành nghề | GTGT | TNCN | Tổng |
|---|---|---|---|---|
| `distribution` | Phân phối, cung cấp hàng hóa | 1,0% | 0,5% | **1,5%** |
| `manufacturing` | Sản xuất, vận tải, dịch vụ gắn với hàng hóa, xây dựng có bao thầu NVL | 3,0% | 1,5% | **4,5%** |
| `other` | Hoạt động kinh doanh khác | 2,0% | 1,0% | **3,0%** |
| `service` | Dịch vụ, xây dựng không bao thầu NVL | 5,0% | 2,0% | **7,0%** |

Đề án nhắc khoảng **1,5%–4,5%** — tương ứng đúng 2 nhóm thương mại hàng hóa (`distribution` 1,5% → `manufacturing` 4,5%). Bảng trên bao trọn vùng Đề án quan tâm và vẫn đúng luật cho các nhóm còn lại.

## 3. Quyết định thiết kế

### 3.1 Không lưu số dư — tính lũy kế
S2 (tồn kho), S6 (tồn quỹ), S7 (tiền gửi) là 3 sổ có cột số dư. **Không lưu số dư vào cột**, mà tính lũy kế từ các dòng theo thứ tự `(entry_date, id)`.

Lý do: Luật Kế toán Điều 27 cấm tẩy xoá, sửa sổ chỉ bằng 3 cách (ghi cải chính / ghi số âm / ghi điều chỉnh). Nếu lưu số dư cứng, mỗi lần sửa một chứng từ cũ sẽ làm lệch toàn bộ số dư phía sau → phải viết lại cả sổ. Tính lũy kế thì sửa chứng từ ở đâu, số dư tự đúng từ đó trở đi.

Tương tự, S4 (thuế còn phải nộp) và S5 (lương thực nhận) đều **tính**, không lưu.

### 3.2 Chống hạch toán trùng
Dùng **partial unique index** (chỉ áp dụng khi `source_type = 'order'`):
```sql
CREATE UNIQUE INDEX idx_hkd_s1_dedupe ON hkd_s1_revenue(tenant_id, seller_id, source_type, source_id)
  WHERE source_type = 'order';
```
Ghi sổ thủ công (`manual`) vẫn cho phép nhiều dòng, nhưng 1 đơn hàng không thể bị hạch toán 2 lần.

### 3.3 Đơn vị tiền & làm tròn
`NUMERIC(18,2)` cho tiền. Tính thuế **làm tròn xuống từng đồng** (`Math.floor`) — theo hướng có lợi cho người nộp và tránh lệch tổng khi cộng dồn.

## 4. Cấu trúc dữ liệu

9 bảng (xem `migrations/001_tt88_books.sql`):

| Bảng | Mục đích |
|---|---|
| `hkd_book_periods` | Đăng ký mở/khoá sổ theo (hộ KD, địa điểm, sổ, năm) |
| `hkd_s1_revenue` | S1 — doanh thu (trigger tự tính `taxable_revenue`) |
| `hkd_s2_goods` | S2 — nhập/xuất hàng hóa |
| `hkd_s3_expense` | S3 — chi phí SXKD (9 nhóm) |
| `hkd_s4_tax` | S4 — nghĩa vụ thuế NSNN (CHECK `tax_paid <= tax_payable`) |
| `hkd_s5_payroll` | S5 — lương + BHXH/BHYT/BHTN/TNCN |
| `hkd_s6_cash` | S6 — quỹ tiền mặt |
| `hkd_s7_bank` | S7 — tiền gửi ngân hàng |
| `hkd_tax_filings` | Tờ khai 01/CNKD + XML đã xuất/nộp |

View `hkd_missing_periods` — phát hiện kỳ đã ghi sổ nhưng chưa đăng ký mở sổ (thiếu sót thủ tục).

## 5. Xuất XML nộp `thuedientu.gdt.gov.vn`

- Mẫu: **01/CNKD** (TT40/2021) — tờ khai thuế đối với hộ kinh doanh, cá nhân kinh doanh, gồm cả GTGT và TNCN.
- Service sinh XML well-formed, escape đúng 5 thực thể (`& < > " '`).
- **Trạng thái hiện tại**: XML tuân theo cấu trúc HTKK nhưng **chưa được validate bằng XSD chính thức của Tổng cục Thuế**. Trước khi nộp thật phải đối chiếu XSD do GDT công bố — đây là việc không thể đoán, cần lấy file XSD gốc. Đã ghi nhận ở mã nguồn.

## 6. Phạm vi đã làm / chưa làm

**Đã làm:** migration 9 bảng · types · `tt88Service` (biểu thuế, ghi sổ, lũy kế, khoá sổ, XML, CSV) · UI 8 tab · route `/ke-toan-tt88` · test.

**Chưa làm (đều cần quyết định/nguồn lực):**
1. Validate XML bằng XSD chính thức của GDT (cần file XSD gốc).
2. Ký số tờ khai (chữ ký số USB token / HSM) — browser không làm được, cần service server-side.
3. Tự động hạch toán S3 (chi phí) và S5 (lương) từ nguồn dữ liệu có sẵn — hiện mới nối S1/S4/S6 từ đơn hàng.
4. S5-HKD payroll thực tế: chưa rõ hệ thống có module lương hay chưa (EasyHRM có vẻ có, cần xác nhận trước khi nối).
