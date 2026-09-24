-- =============================================================================
-- SEED HỆ THỐNG TÀI KHOẢN KẾ TOÁN THEO THÔNG TƯ 99/2025/TT-BTC
-- Nguồn: Phụ lục II - Hệ thống tài khoản kế toán doanh nghiệp
-- (Kèm theo Thông tư số 99/2025/TT-BTC ngày 27/10/2025 của Bộ trưởng Bộ Tài chính)
-- Hiệu lực: 01/01/2026 - áp dụng cho năm tài chính bắt đầu từ hoặc sau 01/01/2026
-- Số lượng: 172 tài khoản (cấp 1 + cấp 2)
-- LƯU Ý: cấp 3 trở lên (ví dụ 33311, 6421...) doanh nghiệp tự mở theo Điều 11 khoản 2.
-- =============================================================================

-- Xóa seed TT200 cũ (chỉ chạy khi chưa phát sinh chứng từ)
-- DELETE FROM dm_tai_khoan WHERE tenant_id = 'tenant-vcomm-prod-01';

INSERT INTO dm_tai_khoan
 (tenant_id, ma_tk, ten_tk, cap, loai_tk, tinh_chat, la_tk_chi_tiet,
  tk_cong_no, tk_kho, tk_ngoai_te, tk_thue)
VALUES
 ('tenant-vcomm-prod-01', '111', 'Tiền mặt', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '112', 'Tiền gửi không kỳ hạn', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '113', 'Tiền đang chuyển', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '121', 'Chứng khoán kinh doanh', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '128', 'Đầu tư nắm giữ đến ngày đáo hạn', 1, 'TAI_SAN', 'DU_NO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '1281', 'Tiền gửi có kỳ hạn', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '1282', 'Trái phiếu', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '1283', 'Cho vay', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '1288', 'Các khoản đầu tư khác nắm giữ đến ngày đáo hạn', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '131', 'Phải thu của khách hàng', 1, 'TAI_SAN', 'LUONG_TINH', TRUE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '133', 'Thuế GTGT được khấu trừ', 1, 'TAI_SAN', 'DU_NO', FALSE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '1331', 'Thuế GTGT được khấu trừ của hàng hóa, dịch vụ', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '1332', 'Thuế GTGT được khấu trừ của TSCĐ', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '136', 'Phải thu nội bộ', 1, 'TAI_SAN', 'DU_NO', FALSE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '1361', 'Vốn kinh doanh ở đơn vị trực thuộc', 2, 'TAI_SAN', 'DU_NO', TRUE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '1362', 'Phải thu nội bộ về chênh lệch tỷ giá', 2, 'TAI_SAN', 'DU_NO', TRUE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '1363', 'Phải thu nội bộ về chi phí đi vay đủ điều kiện được vốn hóa', 2, 'TAI_SAN', 'DU_NO', TRUE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '1368', 'Phải thu nội bộ khác', 2, 'TAI_SAN', 'DU_NO', TRUE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '138', 'Phải thu khác', 1, 'TAI_SAN', 'LUONG_TINH', FALSE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '1381', 'Tài sản thiếu chờ xử lý', 2, 'TAI_SAN', 'LUONG_TINH', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '1383', 'Thuế TTĐB của hàng nhập khẩu', 2, 'TAI_SAN', 'LUONG_TINH', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '1388', 'Phải thu khác', 2, 'TAI_SAN', 'LUONG_TINH', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '141', 'Tạm ứng', 1, 'TAI_SAN', 'DU_NO', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '151', 'Hàng mua đang đi đường', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, TRUE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '152', 'Nguyên liệu, vật liệu', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, TRUE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '153', 'Công cụ, dụng cụ', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, TRUE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '154', 'Chi phí sản xuất, kinh doanh dở dang', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, TRUE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '155', 'Sản phẩm', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, TRUE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '156', 'Hàng hóa', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, TRUE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '157', 'Hàng gửi đi bán', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, TRUE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '158', 'Nguyên liệu, vật tư tại kho bảo thuế', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, TRUE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '171', 'Giao dịch mua, bán lại trái phiếu chính phủ', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '211', 'Tài sản cố định hữu hình', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '212', 'Tài sản cố định thuê tài chính', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '213', 'Tài sản cố định vô hình', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '214', 'Hao mòn tài sản cố định', 1, 'TAI_SAN', 'DU_CO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2141', 'Hao mòn TSCĐ hữu hình', 2, 'TAI_SAN', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2142', 'Hao mòn TSCĐ thuê tài chính', 2, 'TAI_SAN', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2143', 'Hao mòn TSCĐ vô hình', 2, 'TAI_SAN', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2147', 'Hao mòn BĐSĐT', 2, 'TAI_SAN', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '215', 'Tài sản sinh học', 1, 'TAI_SAN', 'DU_NO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2151', 'Súc vật nuôi cho sản phẩm định kỳ', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2152', 'Súc vật nuôi lấy sản phẩm một lần', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2153', 'Cây trồng theo mùa vụ hoặc lấy sản phẩm một lần', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '217', 'Bất động sản đầu tư', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '221', 'Đầu tư vào công ty con', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '222', 'Đầu tư vào công ty liên doanh, liên kết', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '228', 'Đầu tư khác', 1, 'TAI_SAN', 'DU_NO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2281', 'Đầu tư góp vốn vào đơn vị khác', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2288', 'Đầu tư khác', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '229', 'Dự phòng tổn thất tài sản', 1, 'TAI_SAN', 'DU_CO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2291', 'Dự phòng giảm giá chứng khoán kinh doanh', 2, 'TAI_SAN', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2292', 'Dự phòng tổn thất đầu tư vào đơn vị khác', 2, 'TAI_SAN', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2293', 'Dự phòng phải thu khó đòi', 2, 'TAI_SAN', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2294', 'Dự phòng giảm giá hàng tồn kho', 2, 'TAI_SAN', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2295', 'Dự phòng tổn thất tài sản sinh học', 2, 'TAI_SAN', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '241', 'Xây dựng cơ bản dở dang', 1, 'TAI_SAN', 'DU_NO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2411', 'Mua sắm TSCĐ', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2412', 'Xây dựng cơ bản', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2413', 'Sửa chữa, bảo dưỡng định kỳ TSCĐ', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '2414', 'Nâng cấp, cải tạo TSCĐ', 2, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '242', 'Chi phí chờ phân bổ', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '243', 'Tài sản thuế thu nhập hoãn lại', 1, 'TAI_SAN', 'DU_NO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '244', 'Ký quỹ, ký cược', 1, 'TAI_SAN', 'DU_NO', TRUE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '331', 'Phải trả cho người bán', 1, 'NO_PHAI_TRA', 'LUONG_TINH', TRUE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '332', 'Phải trả cổ tức, lợi nhuận', 1, 'NO_PHAI_TRA', 'DU_CO', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '333', 'Thuế và các khoản phải nộp Nhà nước', 1, 'NO_PHAI_TRA', 'DU_CO', FALSE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '3331', 'Thuế giá trị gia tăng phải nộp', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '3332', 'Thuế tiêu thụ đặc biệt', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '3333', 'Thuế xuất, nhập khẩu', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '3334', 'Thuế thu nhập doanh nghiệp', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '3335', 'Thuế thu nhập cá nhân', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '3336', 'Thuế tài nguyên', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '3337', 'Thuế nhà đất, tiền thuê đất', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '3338', 'Thuế bảo vệ môi trường và các loại thuế khác', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '3339', 'Phí, lệ phí và các khoản phải nộp khác', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '334', 'Phải trả người lao động', 1, 'NO_PHAI_TRA', 'DU_CO', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '335', 'Chi phí phải trả', 1, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '336', 'Phải trả nội bộ', 1, 'NO_PHAI_TRA', 'DU_CO', FALSE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '3361', 'Phải trả nội bộ về vốn kinh doanh', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '3362', 'Phải trả nội bộ về chênh lệch tỷ giá', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '3363', 'Phải trả nội bộ về chi phí đi vay đủ điều kiện được vốn hóa', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '3368', 'Phải trả nội bộ khác', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '337', 'Thanh toán theo tiến độ hợp đồng xây dựng', 1, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '338', 'Phải trả, phải nộp khác', 1, 'NO_PHAI_TRA', 'LUONG_TINH', FALSE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3381', 'Tài sản thừa chờ giải quyết', 2, 'NO_PHAI_TRA', 'LUONG_TINH', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3382', 'Kinh phí công đoàn', 2, 'NO_PHAI_TRA', 'LUONG_TINH', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3383', 'Bảo hiểm xã hội', 2, 'NO_PHAI_TRA', 'LUONG_TINH', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3384', 'Bảo hiểm y tế', 2, 'NO_PHAI_TRA', 'LUONG_TINH', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3386', 'Bảo hiểm thất nghiệp', 2, 'NO_PHAI_TRA', 'LUONG_TINH', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3387', 'Doanh thu chờ phân bổ', 2, 'NO_PHAI_TRA', 'LUONG_TINH', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3388', 'Phải trả, phải nộp khác', 2, 'NO_PHAI_TRA', 'LUONG_TINH', TRUE, TRUE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '341', 'Vay và nợ thuê tài chính', 1, 'NO_PHAI_TRA', 'DU_CO', FALSE, FALSE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '3411', 'Các khoản đi vay', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '3412', 'Nợ thuê tài chính', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '343', 'Trái phiếu phát hành', 1, 'NO_PHAI_TRA', 'DU_CO', FALSE, FALSE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '3431', 'Trái phiếu thường', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '3432', 'Trái phiếu chuyển đổi', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '344', 'Nhận ký quỹ, ký cược', 1, 'NO_PHAI_TRA', 'DU_CO', TRUE, TRUE, FALSE, TRUE, FALSE),
 ('tenant-vcomm-prod-01', '347', 'Thuế thu nhập hoãn lại phải trả', 1, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '352', 'Dự phòng phải trả', 1, 'NO_PHAI_TRA', 'DU_CO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3521', 'Dự phòng bảo hành sản phẩm, hàng hóa', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3522', 'Dự phòng bảo hành công trình xây dựng', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3523', 'Dự phòng tái cơ cấu doanh nghiệp', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3525', 'Dự phòng phải trả khác', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '353', 'Quỹ khen thưởng, phúc lợi', 1, 'NO_PHAI_TRA', 'DU_CO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3531', 'Quỹ khen thưởng', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3532', 'Quỹ phúc lợi', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3533', 'Quỹ phúc lợi đã hình thành TSCĐ', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3534', 'Quỹ thưởng ban quản lý điều hành công ty', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '356', 'Quỹ phát triển khoa học và công nghệ', 1, 'NO_PHAI_TRA', 'DU_CO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3561', 'Quỹ phát triển khoa học và công nghệ', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '3562', 'Quỹ phát triển khoa học và công nghệ đã hình thành tài sản', 2, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '357', 'Quỹ bình ổn giá', 1, 'NO_PHAI_TRA', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '411', 'Vốn đầu tư của chủ sở hữu', 1, 'VON', 'DU_CO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '4111', 'Vốn góp của chủ sở hữu', 2, 'VON', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '4112', 'Thặng dư vốn', 2, 'VON', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '4113', 'Quyền chọn chuyển đổi trái phiếu', 2, 'VON', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '4118', 'Vốn khác', 2, 'VON', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '412', 'Chênh lệch đánh giá lại tài sản', 1, 'VON', 'LUONG_TINH', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '413', 'Chênh lệch tỷ giá hối đoái', 1, 'VON', 'LUONG_TINH', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '414', 'Quỹ đầu tư phát triển', 1, 'VON', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '418', 'Các quỹ khác thuộc vốn chủ sở hữu', 1, 'VON', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '419', 'Cổ phiếu mua lại của chính mình', 1, 'VON', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '421', 'Lợi nhuận sau thuế chưa phân phối', 1, 'VON', 'LUONG_TINH', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '4211', 'Lợi nhuận sau thuế chưa phân phối lũy kế đến cuối năm trước', 2, 'VON', 'LUONG_TINH', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '4212', 'Lợi nhuận sau thuế chưa phân phối năm nay', 2, 'VON', 'LUONG_TINH', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '511', 'Doanh thu bán hàng và cung cấp dịch vụ', 1, 'DOANH_THU', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '515', 'Doanh thu hoạt động tài chính', 1, 'DOANH_THU', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '521', 'Các khoản giảm trừ doanh thu', 1, 'DOANH_THU', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '621', 'Chi phí nguyên liệu, vật liệu trực tiếp', 1, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '622', 'Chi phí nhân công trực tiếp', 1, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '623', 'Chi phí sử dụng máy thi công', 1, 'CHI_PHI', 'DU_NO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6231', 'Chi phí nhân công', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6232', 'Chi phí vật liệu', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6233', 'Chi phí dụng cụ sản xuất', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6234', 'Chi phí khấu hao máy thi công', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6237', 'Chi phí dịch vụ mua ngoài', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6238', 'Chi phí bằng tiền khác', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '627', 'Chi phí sản xuất chung', 1, 'CHI_PHI', 'DU_NO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6271', 'Chi phí nhân viên phân xưởng', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6272', 'Chi phí vật liệu', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6273', 'Chi phí dụng cụ sản xuất', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6274', 'Chi phí khấu hao TSCĐ', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6275', 'Thuế, phí, lệ phí', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6277', 'Chi phí dịch vụ mua ngoài', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6278', 'Chi phí bằng tiền khác', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '632', 'Giá vốn hàng bán', 1, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '635', 'Chi phí tài chính', 1, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '641', 'Chi phí bán hàng', 1, 'CHI_PHI', 'DU_NO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6411', 'Chi phí nhân viên', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6412', 'Chi phí vật liệu, bao bì', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6413', 'Chi phí dụng cụ, đồ dùng', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6414', 'Chi phí khấu hao TSCĐ', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6415', 'Thuế, phí, lệ phí', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6417', 'Chi phí dịch vụ mua ngoài', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6418', 'Chi phí bằng tiền khác', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '642', 'Chi phí quản lý doanh nghiệp', 1, 'CHI_PHI', 'DU_NO', FALSE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6421', 'Chi phí nhân viên quản lý', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6422', 'Chi phí vật liệu quản lý', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6423', 'Chi phí đồ dùng văn phòng', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6424', 'Chi phí khấu hao TSCĐ', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6425', 'Thuế, phí và lệ phí', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6426', 'Chi phí dự phòng', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6427', 'Chi phí dịch vụ mua ngoài', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '6428', 'Chi phí bằng tiền khác', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '711', 'Thu nhập khác', 1, 'DOANH_THU', 'DU_CO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '811', 'Chi phí khác', 1, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, FALSE),
 ('tenant-vcomm-prod-01', '821', 'Chi phí thuế thu nhập doanh nghiệp', 1, 'CHI_PHI', 'DU_NO', FALSE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '8211', 'Chi phí thuế TNDN hiện hành', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '8212', 'Chi phí thuế TNDN hoãn lại', 2, 'CHI_PHI', 'DU_NO', TRUE, FALSE, FALSE, FALSE, TRUE),
 ('tenant-vcomm-prod-01', '911', 'Xác định kết quả kinh doanh', 1, 'CHI_PHI', 'LUONG_TINH', TRUE, FALSE, FALSE, FALSE, FALSE);

-- Gán tài khoản cha: TK cha = TK có mã DÀI NHẤT vẫn là tiền tố của mã con.
-- (Không hard-code độ sâu cấp — TT99 cho phép DN tự mở cấp con theo Điều 11.)
UPDATE dm_tai_khoan SET tk_me_id = NULL;

UPDATE dm_tai_khoan c
   SET tk_me_id = p.id
  FROM dm_tai_khoan p
 WHERE p.tenant_id = c.tenant_id
   AND c.ma_tk <> p.ma_tk
   AND c.ma_tk LIKE p.ma_tk || '_%'
   AND LENGTH(p.ma_tk) = (SELECT MAX(LENGTH(x.ma_tk))
                            FROM dm_tai_khoan x
                           WHERE x.tenant_id = c.tenant_id
                             AND x.ma_tk <> c.ma_tk
                             AND c.ma_tk LIKE x.ma_tk || '_%');

-- =============================================================================
-- ĐÁNH DẤU TÀI KHOẢN TT200 ĐÃ NGỪNG SỬ DỤNG
-- Chạy khi nâng cấp từ hệ thống đang dùng TT200. CHỈ đánh dấu, KHÔNG xóa
-- (Điều 28.1.b TT99 — phải giữ dấu vết dữ liệu đã ghi sổ).
-- Bỏ qua bước này nếu cài đặt mới hoàn toàn.
-- =============================================================================
UPDATE dm_tai_khoan
   SET ngung_su_dung = TRUE, ngay_ngung = DATE '2025-12-31', tt_ap_dung = 'TT200'
 WHERE ma_tk IN ('161','417','441','461','466','611','631','1385','3385',
                 '1111','1112','1113','1121','1122','1123','1131','1132',
                 '1211','1212','1218','1541','1542','1543','1544',
                 '1561','1562','1567')
   AND ngung_su_dung = FALSE;

-- =============================================================================
-- KIỂM TRA — kỳ vọng: tong = 172, cap1 = 71, cap2 = 101, la = 148
-- =============================================================================
SELECT COUNT(*)                                        AS tong,
       COUNT(*) FILTER (WHERE cap = 1)                 AS cap1,
       COUNT(*) FILTER (WHERE cap = 2)                 AS cap2,
       COUNT(*) FILTER (WHERE NOT EXISTS (
           SELECT 1 FROM dm_tai_khoan k WHERE k.tk_me_id = dm_tai_khoan.id)) AS la
  FROM dm_tai_khoan
 WHERE tenant_id = 'tenant-vcomm-prod-01' AND tt_ap_dung = 'TT99' AND NOT ngung_su_dung;

-- Không được có TK mồ côi (tk_me_id trỏ tới TK không tồn tại) — kỳ vọng 0 dòng
SELECT c.ma_tk FROM dm_tai_khoan c
 WHERE c.tk_me_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dm_tai_khoan p WHERE p.id = c.tk_me_id);
