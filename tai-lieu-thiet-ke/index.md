# Mục lục bộ tài liệu thiết kế

- Dự án: VComm
- Ngày cập nhật gần nhất: 2026-10-06

## Tài liệu quản lý

| Tệp | Nội dung |
|---|---|
| index.md | Mục lục bộ tài liệu thiết kế |
| Nhat_ky_du_an.md | Nhật ký dự án — nguồn duy nhất: Phần I nhật ký phát hành hệ sinh thái, Phần II nhật ký công việc theo ngày |
| Checklist_cong_viec.md | Checklist công việc và roadmap sản phẩm |
| Ke_hoach/00_KE_HOACH_TONG_THE.md | Kế hoạch tổng thể toàn dự án VComm |
| Ke_hoach/00_INDEX.md | Mục lục bộ kế hoạch: 1 kế hoạch tổng thể, 8 kế hoạch hệ thống con, **26 kế hoạch module ERP đang hoạt động** (Vỏ Portal + 5 nhóm; 15 mô-đun lưu trữ) |
| Quy_trinh_nghiep_vu/index.md | Mục lục các quy trình nghiệp vụ — 5 nhóm chức năng (4 cốt lõi từ MD_ERP + 1 Thương mại & Nền tảng mở rộng); **27 quy trình Nhóm 5 đang hoạt động**, 24 hợp nhất vào MD_ERP, 9 lưu trữ/chuyển phạm vi |
| Quy_trinh_nghiep_vu/Phieu_yeu_cau.md | Phiếu yêu cầu trống để điền |
| Quy_trinh_nghiep_vu/QT-nn_*.md | Quy trình nghiệp vụ Nhóm 5 (QT-01, QT-24, QT-27…QT-51), đều ở trạng thái Chờ duyệt; 4 nhóm cốt lõi lấy từ MD_ERP |
| _Tam_huy/ | Tài liệu lưu trữ: 2026-10-05 (QT-49, QT-50, MOD-33, MOD-34), **2026-10-06 (6 mô-đun gộp/tách + QT-32, QT-39)**, 2026-10-09 (4 quy trình CRM cũ) và 2026-10-09 (24 quy trình hợp nhất vào MD_ERP) — xem `_Tam_huy/README.md` |

## Tài liệu thiết kế

| Số | Tệp | Nội dung | Trạng thái |
|---|---|---|---|
| 01 | 01_Tong_quan_du_an.md | Tổng quan dự án | Đang soạn |
| 02 | 02_Pham_vi.md | Phạm vi | Đang soạn |
| 03 | 03_Yeu_cau_nghiep_vu.md | Yêu cầu nghiệp vụ | Đang soạn |
| 04 | 04_Quy_tac_nghiep_vu.md | Quy tắc nghiệp vụ | Đang soạn |
| 05 | 05_Vai_tro_nguoi_dung.md | Vai trò người dùng | Đang soạn |
| 06 | 06_Luong_nghiep_vu.md | Luồng nghiệp vụ | Đang soạn |
| 07 | 07_Yeu_cau_chuc_nang.md | Yêu cầu chức năng | Đang soạn |
| 08 | 08_Tieu_chi_nghiem_thu.md | Tiêu chí nghiệm thu | Đang soạn |
| 09 | 09_Kien_truc_he_thong.md | Kiến trúc hệ thống | Đang soạn |
| 10 | 10_Cong_nghe_su_dung.md | Công nghệ sử dụng | Đang soạn |
| 11 | 11_Dac_ta_giao_dien.md | Đặc tả giao diện | Đang soạn |
| 12 | 12_He_thong_thiet_ke.md | Hệ thống thiết kế | Đang soạn |
| 13 | 13_Luoc_do_co_so_du_lieu.md | Lược đồ cơ sở dữ liệu | Đang soạn |
| 14 | 14_Dac_ta_API.md | Đặc tả API | Đang soạn |
| 15 | 15_Quy_tac_phat_trien_AI.md | Quy tắc phát triển cho AI | Đang soạn |
| 16 | 16_Cau_lenh_he_thong_AI.md | Câu lệnh hệ thống cho AI | Đang soạn |
| 17 | 17_Ke_hoach_kiem_thu.md | Kế hoạch kiểm thử | Đang soạn |
| 18 | 18_Ca_kiem_thu.md | Ca kiểm thử | Đang soạn |
| 19 | 19_Bao_mat.md | Bảo mật | Đang soạn |
| 20 | 20_Lich_su_thay_doi.md | Lịch sử thay đổi | Đang soạn |

## Tài liệu đã có trong dự án trước khi khởi tạo

Các tài liệu dưới đây tồn tại trước khi bộ tài liệu này được khởi tạo. Giữ nguyên, không di chuyển, không đổi tên, không xóa. Liên kết tại đây để tránh trùng lặp nội dung và tránh hai nguồn sự thật.

| Đường dẫn | Nội dung | Ghi chú |
|---|---|---|
| thiet-ke-erp-ke-toan/00_INDEX.md | Mục lục bộ tài liệu thiết kế phân hệ kế toán | 16 tệp, đánh số 00–15. Bộ tài liệu cấp phân hệ, giữ nguyên |
| vcomm-erp/docs/ | Tài liệu lớp tích hợp của vcomm-erp | ADR_LOP_TICH_HOP_I1.md, BAN_DO_TICH_HOP_I0.md, KE_HOACH_CUTOVER_I8.md |

Ngày 2026-10-05 đã gộp hai tệp nhật ký trùng lặp hoàn toàn ở thư mục gốc. Giữ lại `NHAT_KY_CAP_NHAT.md` làm nguồn duy nhất, xóa `CHANGELOG.md`. Không mất nội dung vì hai tệp giống hệt nhau từng byte.

Cùng ngày 2026-10-05, tiếp tục hợp nhất `NHAT_KY_CAP_NHAT.md` vào `tai-lieu-thiet-ke/Nhat_ky_du_an.md` và xóa tệp ở thư mục gốc. Từ đây `Nhat_ky_du_an.md` là nguồn duy nhất: Phần I là nhật ký phát hành hệ sinh thái (v1.0.0 đến v2.3.0), Phần II là nhật ký công việc theo ngày.

## Phân cấp tài liệu

- `tai-lieu-thiet-ke/` — tài liệu cấp toàn dự án VComm.
- `thiet-ke-erp-ke-toan/` — tài liệu cấp phân hệ kế toán.
- `vcomm-erp/docs/` — tài liệu cấp phân hệ vcomm-erp.

## Quy ước trạng thái tài liệu

Chỉ dùng các giá trị: Chưa bắt đầu, Đang soạn, Chờ duyệt, Đã duyệt, Cần cập nhật.
