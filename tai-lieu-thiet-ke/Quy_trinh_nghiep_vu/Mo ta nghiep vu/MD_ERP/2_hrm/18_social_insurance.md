# Đặc tả nghiệp vụ: Phân hệ Bảo hiểm xã hội (Social Insurance)

## 1. Trường dữ liệu (Data Fields)

### 1.1 Hồ sơ BHXH cá nhân (Insurance Profiles)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `insurance_profile_id`| UUID | Yes | Mã hồ sơ |
| `employee_id` | UUID | Yes | Mã nhân viên |
| `insurance_number`| String | Yes | Số sổ BHXH |
| `health_card_number`| String | No | Số thẻ BHYT |
| `hospital_id` | UUID | No | Nơi đăng ký KCB ban đầu (FK) |
| `status` | Enum | Yes | Trạng thái: ACTIVE, PAUSED (Nghỉ không lương/Thai sản), CLOSED |

### 1.2 Biến động BHXH (Insurance Variations)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `variation_id` | UUID | Yes | Mã biến động |
| `employee_id` | UUID | Yes | Mã nhân viên |
| `month_year` | String | Yes | Kỳ biến động (VD: 08/2023) |
| `type` | Enum | Yes | TĂNG MỚI, TĂNG LẠI, GIẢM HẲN, GIẢM THAI SẢN, GIẢM ỐM ĐAU, ĐIỀU CHỈNH LƯƠNG |
| `old_salary` | Decimal | No | Mức lương cũ (nếu điều chỉnh) |
| `new_salary` | Decimal | Yes | Mức lương mới đóng BH |

### 1.3 Quản lý chế độ (Insurance Claims/Benefits)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `claim_id` | UUID | Yes | Mã hồ sơ hưởng chế độ |
| `employee_id` | UUID | Yes | Mã nhân viên |
| `benefit_type` | Enum | Yes | Loại chế độ: Ốm đau, Thai sản, Dưỡng sức... |
| `start_date` | Date | Yes | Từ ngày |
| `end_date` | Date | Yes | Đến ngày |
| `amount_received`| Decimal | No | Số tiền BHXH duyệt chi |

### Master Data
- Danh mục Tỷ lệ đóng BHXH, BHYT, BHTN (Company: 17.5%, 3%, 1%; Employee: 8%, 1.5%, 1%).
- Danh mục Bệnh viện/Cơ sở KCB.
- Mức lương cơ sở do Nhà nước quy định (VD: 1.800.000 VNĐ).

---

## 2. Quy trình (Business Processes)

1. **Thiết lập tỷ lệ**: Cập nhật tỷ lệ đóng và mức lương trần/sàn theo quy định mới nhất của Nhà nước.
2. **Khai báo tăng/giảm**: Hàng tháng, HR rà soát nhân sự mới (Tăng), nhân sự nghỉ việc (Giảm), nhân sự thay đổi lương hợp đồng (Điều chỉnh) để chốt danh sách biến động.
3. **Trích nộp và Khấu trừ**: Truyền số liệu mức đóng BHXH của từng nhân viên sang Phân hệ Lương để khấu trừ vào Gross. Tính toán số tiền Công ty phải nộp.
4. **Giải quyết chế độ**: NV nộp giấy tờ (Giấy ra viện, Giấy khai sinh) -> HR làm hồ sơ điện tử gửi cơ quan BHXH -> BHXH duyệt chi -> Trả tiền cho NV.
5. **Báo cáo đối chiếu**: Xem báo cáo Thông báo kết quả đóng BHXH, BHYT, BHTN (Mẫu C12-TS).

**Phân quyền (Roles):**
- `C&B Specialist`: Thực hiện các nghiệp vụ báo tăng giảm, tính toán, làm hồ sơ chế độ.
- `Employee`: Gửi giấy tờ hưởng chế độ, xem thông tin đóng BHXH của mình.

---

## 3. Luồng nghiệp vụ (Business Workflows)

- **Workflow Tự động sinh Biến động**: 
  - Ký Hợp đồng chính thức -> Tự động sinh bản ghi `TĂNG MỚI`.
  - Có Phụ lục tăng lương -> Tự động sinh bản ghi `ĐIỀU CHỈNH MỨC ĐÓNG`.
  - Quyết định nghỉ việc -> Tự động sinh bản ghi `GIẢM HẲN`.
- **Luồng Ốm đau/Thai sản**: NV xin nghỉ Thai sản (trên Timekeeping) -> Chuyển status BHXH sang `PAUSED` (Không đóng BHXH tháng đó) -> Sinh hồ sơ Claim chế độ thai sản -> Nộp lên cổng BHXH Việt Nam.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1 API Endpoints (RESTful)
- `GET /api/v1/insurance/variations`: Lấy danh sách biến động trong tháng.
- `POST /api/v1/insurance/claims`: Tạo hồ sơ đề nghị hưởng chế độ.
- `GET /api/v1/insurance/reports/c12`: Xuất báo cáo đối chiếu C12-TS.

### 4.2 Ràng buộc logic (Business Rules)
- Mức đóng BHXH không được thấp hơn mức lương tối thiểu vùng, và không cao hơn 20 lần mức lương cơ sở.
- Trích nộp BHXH chỉ xảy ra khi nhân viên có số ngày làm việc trong tháng >= 14 ngày làm việc (quy định thông thường, cấu hình được). Nếu < 14 ngày, không tính BHXH tháng đó.
- Công thức đóng = Mức lương ghi trên HĐ x Tỷ lệ đóng (NV đóng 10.5%, Cty đóng 21.5%).

### 4.3 Điểm tích hợp (Integrations)
- **Cổng thông tin BHXH VN (IVAN/EFY/VNPT)**: Xuất file XML hoặc gọi API trực tiếp để nộp hồ sơ điện tử (D02-LT) mà không cần nhập lại trên phần mềm IVAN.
- **Phân hệ Tính lương**: Map trường Số tiền khấu trừ BHXH vào bảng lương.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1 Layouts
- **Variations Dashboard**: Bảng kê Tăng/Giảm/Điều chỉnh chia làm 3 tab rõ ràng. Có nút "Chốt kỳ báo cáo" to ở góc phải.
- **Hospital Selection Form**: Form chọn nơi KCB ban đầu, cung cấp bộ lọc Tỉnh/Thành -> Quận/Huyện -> Bệnh viện.

### 5.2 UI Components
- `File Exporter`: Tự động map dữ liệu ra các mẫu biểu Excel chuẩn của cơ quan nhà nước (Mẫu D02-LT, Mẫu 01B-HSB).
- `Status Stepper`: Luồng theo dõi Hồ sơ chế độ (Đang chuẩn bị -> Đã nộp lên BHXH -> Chờ duyệt -> BHXH đã chi trả).

### 5.3 UX Feedback
- Khi người dùng nhập Mức lương đóng BHXH thấp hơn mức lương tối thiểu vùng, tự động hiện tooltip cảnh báo màu đỏ nhưng vẫn cho phép lưu (nếu có lý do).
- Đẩy Notification cho NV: "Hồ sơ thai sản của bạn đã được BHXH duyệt chi số tiền X vnđ".
