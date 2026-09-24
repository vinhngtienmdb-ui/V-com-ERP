# Thiết Kế Đặc Tả: Nâng Cấp Toàn Diện Tính Năng & Giao Diện Ứng Dụng Chữ Ký Số & Cloud HSM

**Ngày tạo:** 2026-09-24  
**Phân hệ:** VComm ERP - Ký Số & Cloud HSM (`/signature`)  
**Mục tiêu:** Tái cấu trúc module hóa toàn diện, nâng cấp trải nghiệm người dùng chuẩn Enterprise SaaS, bổ sung Bàn ký số tương tác (Document Signing Studio), Ký hàng loạt (Batch Signing), và Trình soi chứng thư số X.509 v3 chuyên sâu.

---

## 1. Bối Cảnh & Mục Tiêu Nghiệp Vụ

### 1.1. Hiện trạng
- Ứng dụng `SignatureHub.tsx` hiện tại là một file monolithic (>1.400 dòng), tích hợp quản lý Cloud HSM công ty, chứng thư số cá nhân CBNV, bàn ký số cơ bản và nhật ký kiểm toán.
- Bàn ký số hiện tại chỉ có modal nhập mã PIN đơn giản, thiếu trình xem trước văn bản trực quan (PDF viewer) và khả năng định vị vị trí đóng dấu / ký nháy / ký số.
- Doanh nghiệp thường xuyên phát sinh nhu cầu ký duyệt số lượng lớn hóa đơn điện tử, phiếu xuất kho, biên bản đối soát định kỳ nhưng hệ thống chưa có tính năng **Ký hàng loạt (Batch Signing)** qua Cloud HSM chỉ bằng 1 lần xác thực.
- Thiếu trình soi chi tiết chứng thư X.509 v3 và chuỗi tin cậy CA để kiểm tra tính toàn vẹn và tình trạng thu hồi (OCSP/CRL).

### 1.2. Mục tiêu sau nâng cấp
1. **Kiến trúc Module hóa (Componentization):** Tách `SignatureHub` thành hệ sinh thái các components con chuyên trách trong `src/components/signature/`.
2. **Bàn ký số tương tác chuyên nghiệp (Document Signing Studio):** Trình duyệt tài liệu với split-view fullscreen, cho phép xem trước nhiều trang, kéo thả / định vị vị trí ký (Mộc đỏ pháp nhân, Chữ ký cá nhân, Tem chứng nhận eIDAS/FIPS), hỗ trợ ký nháy giáp lai.
3. **Ký hàng loạt (Batch Signing):** Lựa chọn nhiều tài liệu cùng lúc và thực hiện ký tự động đồng loạt với 1 lần nhập PIN/OTP qua Cloud HSM.
4. **Trình soi chứng thư số X.509 v3 (Certificate Inspector):** Xem chi tiết Subject DN, Cây chuỗi chứng thực CA (Trust Chain), Public Key, Fingerprint SHA-256, và trạng thái thu hồi trực tuyến OCSP/CRL.
5. **Giao diện Dashboard Hiện đại:** Hệ thống thẻ KPI trực quan, thanh tiến trình hạn ngạch HSM, biểu đồ lưu lượng ký 7 ngày gần nhất, và cảnh báo chứng thư sắp hết hạn.
6. **Tải lên tài liệu mới (Upload & Submit for Signing):** Cho phép người dùng tải lên tệp PDF/Doc mới để đưa vào luồng trình ký.

---

## 2. Kiến Trúc Hệ Thống & Cấu Trúc File

### 2.1. Cấu trúc thư mục đề xuất
```
vcomm-erp/
├── src/
│   ├── data/
│   │   └── hsmSignatureData.ts              # Mở rộng Model dữ liệu, Document templates, X.509 cert chains
│   ├── components/
│   │   ├── SignatureHub.tsx                 # Điều phối trung tâm, route `/signature`, quản lý tabs và state chung
│   │   └── signature/
│   │       ├── SignatureDashboard.tsx       # Tab 1: Tổng quan chỉ số HSM, hạn ngạch, lưu lượng ký, cảnh báo hết hạn
│   │       ├── CompanyHsmManager.tsx        # Tab 2: Quản trị Cloud HSM doanh nghiệp, TPS, cấu hình Auto-Sign
│   │       ├── PersonalCertsManager.tsx     # Tab 3: Quản lý chứng thư CBNV, trích xuất HRM, gia hạn/tạm khóa/thu hồi
│   │       ├── SigningWorkspace.tsx         # Tab 4: Bàn ký số (Chờ ký / Đã ký), checkbox ký hàng loạt
│   │       ├── AuthorityMatrixTab.tsx       # Tab 5: Ma trận thẩm quyền ký duyệt và phân tầng hạn mức VND
│   │       ├── SignatureAuditLogsTab.tsx    # Tab 6: Nhật ký kiểm toán mật mã học SHA-256, IP, bộ lọc & xuất file
│   │       └── modals/
│   │           ├── DocumentSigningStudioModal.tsx  # Trình ký số tương tác (PDF Preview, định vị con dấu/chữ ký)
│   │           ├── BatchSigningModal.tsx           # Modal xác nhận và ký đồng loạt nhiều tài liệu
│   │           ├── CertificateInspectorModal.tsx   # Trình soi chi tiết chứng thư X.509 v3 & chuỗi tin cậy CA
│   │           ├── NewDocumentUploadModal.tsx      # Modal tải lên văn bản mới vào luồng trình ký
│   │           └── VerifyIntegrityModal.tsx        # Modal thẩm tra tính toàn vẹn tài liệu & mã băm SHA-256
```

### 2.2. Luồng Dữ Liệu & Quản Lý State (State Management)
* `SignatureHub.tsx` đóng vai trò State Controller cấp cao nhất:
  - `documents: SigningDocument[]`: Danh sách tài liệu trình ký và trạng thái ký.
  - `personalCerts: PersonalCertificate[]`: Danh sách chứng thư cá nhân CBNV.
  - `companyHsm: CompanyHSMProfile`: Cấu hình và chỉ số cụm Cloud HSM công ty.
  - `auditLogs: HSMAuditLog[]`: Nhật ký kiểm toán thời gian thực.
  - Trạng thái điều khiển mở các modal (`showStudioModal`, `showBatchModal`, `showInspectorModal`, `showUploadModal`, `showVerifyModal`).
* Khi người dùng thực thi ký trong **DocumentSigningStudioModal** hoặc **BatchSigningModal**:
  1. Cập nhật `documents` chuyển trạng thái sang `signed` cùng chữ ký số mật mã học và mã băm SHA-256.
  2. Khấu trừ hạn ngạch lượt ký `remainingSignatures` trong `companyHsm` nếu ký bằng Cloud HSM.
  3. Tự động thêm bản ghi vào `auditLogs` lưu lại IP, thời gian TSA, chứng thư và phương thức ký.

---

## 3. Thiết Kế Chi Tiết Từng Module

### 3.1. Tab Dashboard Điều Hành (`SignatureDashboard.tsx`)
- **4 Thẻ Chỉ Số Vận Hành:**
  1. *Trạng thái Cloud HSM Doanh Nghiệp:* Đèn báo Operational, tốc độ 120 TPS, độ trễ phản hồi ~14ms.
  2. *Hạn ngạch Lượt Ký Số:* Hiển thị số lượt ký còn lại / tổng quota kèm Progress Bar phần trăm trực quan.
  3. *Chứng thư Cá nhân CBNV:* Số chứng thư Đang hoạt động / Tạm khóa, kèm badge cảnh báo chứng thư sắp hết hạn.
  4. *Tài liệu Chờ Ký Duyệt:* Đếm số văn bản chưa ký, số văn bản ưu tiên cao và tổng giá trị tài chính VND đang chờ duyệt.
- **Biểu Đồ Lưu Lượng Ký Số (Signing Activity Trends):**
  - Biểu đồ thống kê 7 ngày gần nhất theo các nhóm văn bản: Hóa đơn điện tử (TT78), Phiếu xuất kho, Hợp đồng kinh tế, Tờ khai thuế.
  - Chỉ số SLA ký số thành công: 99.8%.
- **Thanh Tác Vụ Nhanh (Quick Actions Hub):**
  - Mở nhanh Bàn ký số.
  - Mở chế độ Ký hàng loạt chứng từ kế toán.
  - Kiểm tra kết nối HSM (Health Check Ping).
  - Cấp phát chứng thư mới cho nhân sự.

### 3.2. Bàn Ký Số & Ký Hàng Loạt (`SigningWorkspace.tsx` + `BatchSigningModal.tsx`)
- **Thanh lọc và tìm kiếm:**
  - Bộ lọc Chờ tôi ký / Đã hoàn tất ký.
  - Bộ lọc theo phân loại tài liệu: Hợp đồng, Đề xuất, Hóa đơn điện tử, Phiếu nhập xuất kho, Quyết định nội bộ.
  - Ô tìm kiếm thời gian thực theo mã tài liệu, tiêu đề, người tạo.
- **Ký Hàng Loạt (Batch Signing):**
  - Checkbox chọn từng dòng hoặc chọn tất cả các văn bản đang hiển thị.
  - Thanh tác vụ nổi (Floating Action Bar) xuất hiện khi số lượng văn bản được chọn $\ge 1$.
  - Modal Ký Hàng Loạt: Tổng hợp số lượng văn bản, tổng giá trị tài chính; chọn phương thức ký (Cloud HSM Doanh nghiệp hoặc Cá nhân); nhập mã PIN 1 lần duy nhất; hiển thị thanh tiến trình xử lý tuần tự/song song đến khi hoàn tất.
- **Tải Lên Văn Bản Mới (`NewDocumentUploadModal.tsx`):**
  - Cho phép người dùng kéo thả file hoặc chọn file PDF/Word từ máy tính.
  - Nhập tên văn bản, phân loại, giá trị tiền, người trình ký và loại chữ ký bắt buộc.

### 3.3. Trình Ký Số Tương Tác Chuyên Sâu (`DocumentSigningStudioModal.tsx`)
- **Khung xem tài liệu (Document Canvas View):**
  - Bố cục Split-view Fullscreen chiếm trọn không gian làm việc.
  - Hiển thị tài liệu theo từng trang, nút Previous / Next Page, nút Phóng to / Thu nhỏ (Zoom in/out).
  - Khung chữ ký tương tác: Cho phép người dùng kéo thả hoặc click để di chuyển vị trí đóng dấu / chữ ký trên trang.
  - Hỗ trợ 3 phong cách hiển thị chữ ký trực quan:
    1. *Mộc đỏ pháp nhân VComm Corporation* (Con dấu tròn đỏ với MST công ty).
    2. *Chữ ký tay mẫu cá nhân* (Handwritten Signature dạng thư pháp số).
    3. *Tem chứng nhận số chuẩn eIDAS/FIPS* (Khung viền bảo mật có mã băm SHA-256, thời gian TSA và thông tin CA).
  - Tùy chọn đóng dấu ký nháy / ký giáp lai tự động ở lề dưới của tất cả các trang văn bản.
- **Bảng điều khiển ký số (Signer Control Panel):**
  - Lựa chọn nguồn chữ ký: Cloud HSM Doanh nghiệp, Chứng thư cá nhân SmartCA, USB Token.
  - Nhập mã PIN bí mật 6 chữ số / OTP SmartCA.
  - Kiểm tra hạn mức tài chính của tài liệu so với thẩm quyền của người ký để cảnh báo tuân thủ.

### 3.4. Trình Soi Chứng Thư Số X.509 v3 (`CertificateInspectorModal.tsx`)
- Hiển thị theo 3 tab chuyên sâu:
  1. *Tab Tổng quan:* Tên chủ thể (Subject CN, Organization, Country, Tax Code), Tổ chức cấp phát (Issuer CA), Thời hạn hiệu lực (Valid From - Valid To), Thanh đếm ngược số ngày còn lại (Days Remaining), Trạng thái kiểm tra thu hồi trực tuyến (OCSP / CRL: Valid & Good).
  2. *Tab Chuỗi Chứng Thực (Trust Chain Hierarchy):* Cây chứng thực 3 cấp: Root CA (Bộ TT&TT) $\rightarrow$ Intermediate CA (Viettel/VNPT/Bkav/FPT) $\rightarrow$ Leaf Certificate (VComm Corp / CBNV).
  3. *Tab Chi Tiết Mật Mã Học:* Serial Number (Hex), Thuật toán Public Key (RSA 2048-bit / ECC P-256), Fingerprint SHA-1 & SHA-256, Key Usage, Tiêu chuẩn an toàn thiết bị FIPS 140-2 Level 3.

### 3.5. Quản Lý Chứng Thư Cá Nhân (`PersonalCertsManager.tsx`)
- Tích hợp trích xuất trực tiếp từ Hồ sơ CBNV và Đơn yêu cầu cá nhân trong HRM (`HrmStaffOrRequestPickerModal`), khóa nhập tay thông tin nhân sự để đảm bảo tính pháp lý.
- Cảnh báo trực quan các chứng thư sắp hết hạn (<90 ngày).
- Thao tác quản trị vòng đời chứng thư: Xem chi tiết (Inspect X.509), Tạm khóa (Suspend), Mở khóa (Activate), Thu hồi vĩnh viễn (Revoke), và Gia hạn nhanh (Renew).

### 3.6. Nhật Ký Kiểm Toán Mã Hóa (`SignatureAuditLogsTab.tsx`)
- Hiển thị đầy đủ mọi giao dịch ký số mật mã học: Thời gian, Hành động, Chủ thể, Mã băm SHA-256 (có nút copy 1-click), IP/Thiết bị, và trạng thái giao dịch.
- Bộ lọc nâng cao theo hành động, thời gian và ô tìm kiếm.
- Xuất dữ liệu nhật ký kiểm toán ra file Excel/CSV theo chuẩn thanh tra Nghị định 130/2018/NĐ-CP.

---

## 4. Kế Hoạch Kiểm Thử & Xác Minh (Verification Strategy)

1. **Kiểm thử giao diện (UI Verification):**
   - Đảm bảo chuyển đổi mượt mà giữa 6 tabs trong `SignatureHub.tsx`.
   - Kiểm tra mở và tương tác trong `DocumentSigningStudioModal`: Chuyển trang, zoom, đổi mẫu chữ ký (mộc đỏ, chữ ký tay, tem eIDAS), di chuyển vị trí ký, nhập mã PIN và ký thành công.
   - Kiểm tra chức năng Ký hàng loạt trong `SigningWorkspace` qua `BatchSigningModal`: Chọn $\ge 2$ tài liệu, nhập PIN và kiểm tra trạng thái toàn bộ tài liệu chuyển thành `signed`.
   - Kiểm tra mở `CertificateInspectorModal` từ thẻ HSM và từng dòng trong bảng chứng thư cá nhân, kiểm tra hiển thị chuỗi chứng thực và các thông số X.509.
   - Kiểm tra tính năng Tải lên văn bản mới (`NewDocumentUploadModal`) và xác nhận văn bản xuất hiện trong danh sách chờ ký.
2. **Kiểm thử tương thích & Build:**
   - Chạy `npm run build` trong `vcomm-erp` để xác nhận không có lỗi TypeScript hoặc bundle.
   - Chạy bộ kiểm thử tự động `npm run test` (hoặc `npx vitest run src/__tests__/digital_signatures.test.ts`) để đảm bảo không bị hồi quy.

---

## 5. Kết Luận
Bản thiết kế này nâng tầm phân hệ Chữ Ký Số & Cloud HSM của VComm ERP từ một công cụ quản lý cơ bản trở thành một Trung Tâm Ký Số Doanh Nghiệp hoàn chỉnh, tương đương với các giải pháp hàng đầu trên thị trường (DocuSign, Adobe Sign, VNPT eContract) và tuân thủ nghiêm ngặt khung pháp lý của Việt Nam.
