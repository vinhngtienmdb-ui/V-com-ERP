# Kế Hoạch Triển Khai: Nâng Cấp Toàn Diện Tính Năng & Giao Diện App Chữ Ký Số & Cloud HSM

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tái cấu trúc module hóa phân hệ Chữ Ký Số & Cloud HSM (`/signature`) trong VComm ERP, bổ sung Bàn ký số tương tác đa trang (Document Signing Studio), Ký hàng loạt (Batch Signing), Trình soi chứng thư số X.509 v3, và làm mới toàn diện giao diện Dashboard điều hành.

**Architecture:** Tách file monolithic `SignatureHub.tsx` thành hệ thống các module con chuyên biệt trong `src/components/signature/` và `src/components/signature/modals/`. Quản lý state tập trung tại `SignatureHub.tsx` để đồng bộ dữ liệu ký số, hạn ngạch HSM và log kiểm toán mật mã học SHA-256.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React, Vitest, Web Crypto API.

## Global Constraints

- Không làm phá vỡ route `/signature` và thanh điều hướng hiện tại trong `vcomm-erp`.
- Duy trì tính tương thích với modal trích xuất nhân sự HRM `HrmStaffOrRequestPickerModal`.
- Mọi giao dịch ký số phải cập nhật trạng thái tài liệu, khấu trừ hạn ngạch Cloud HSM (nếu dùng HSM), và ghi bản ghi vào nhật ký kiểm toán cryptographic `auditLogs`.
- Giao diện đáp ứng tiêu chuẩn Enterprise SaaS (Slate / Indigo / Emerald), responsive trên Desktop & Tablet.

---

### Task 1: Mở rộng Data Models & Mock Data trong `src/data/hsmSignatureData.ts`

**Files:**
- Modify: `D:/VComm/vcomm-erp/src/data/hsmSignatureData.ts`
- Test: `D:/VComm/vcomm-erp/src/__tests__/digital_signatures_data.test.ts`

**Interfaces:**
- Consumes: Hiện trạng `CompanyHSMProfile`, `PersonalCertificate`, `SigningDocument`, `HSMAuditLog`.
- Produces: 
  - `X509CertificateDetails`: cấu trúc thông tin chứng thư X.509 v3, trust chain, fingerprints.
  - Mở rộng `SigningDocument`: hỗ trợ `pages`, `contentPreview`, `category`, `stampPosition` `{ x: number, y: number, page: number }`.
  - Mẫu tài liệu mẫu đa trang (Hóa đơn VAT, Hợp đồng kinh tế B2B, Phiếu xuất kho 3PL, Quyết định).
  - Helper functions: `generateX509Details(certOrHsm)`, `calculateDocumentHashSHA256()`.

- [ ] **Step 1: Viết test cho data helpers và X.509 generator**
- [ ] **Step 2: Chạy test để xác nhận fail**
- [ ] **Step 3: Cập nhật `hsmSignatureData.ts` với đầy đủ types và dữ liệu mở rộng**
- [ ] **Step 4: Chạy test để xác nhận pass**
- [ ] **Step 5: Commit Git**

---

### Task 2: Xây dựng Trình Soi Chứng Thư Số X.509 & Modal Thẩm Tra Toàn Vẹn

**Files:**
- Create: `D:/VComm/vcomm-erp/src/components/signature/modals/CertificateInspectorModal.tsx`
- Create: `D:/VComm/vcomm-erp/src/components/signature/modals/VerifyIntegrityModal.tsx`

**Interfaces:**
- Consumes: `X509CertificateDetails`, `CompanyHSMProfile`, `PersonalCertificate`, `SigningDocument`.
- Produces:
  - `<CertificateInspectorModal isOpen={boolean} onClose={() => void} certData={CompanyHSMProfile | PersonalCertificate | null} />`
  - `<VerifyIntegrityModal isOpen={boolean} onClose={() => void} doc={SigningDocument | null} />`

- [ ] **Step 1: Viết component `CertificateInspectorModal.tsx` với 3 tabs (Tổng quan, Chuỗi chứng thực CA 3 cấp, Chi tiết Mật mã học)**
- [ ] **Step 2: Viết component `VerifyIntegrityModal.tsx` hiển thị trạng thái hợp lệ, dấu thời gian TSA, mã băm SHA-256**
- [ ] **Step 3: Viết test kiểm tra render modal và hiển thị chuỗi tin cậy CA**
- [ ] **Step 4: Chạy test pass**
- [ ] **Step 5: Commit Git**

---

### Task 3: Xây dựng Bàn Ký Số Tương Tác & Modal Tải Lên Văn Bản Mới

**Files:**
- Create: `D:/VComm/vcomm-erp/src/components/signature/modals/DocumentSigningStudioModal.tsx`
- Create: `D:/VComm/vcomm-erp/src/components/signature/modals/NewDocumentUploadModal.tsx`

**Interfaces:**
- Consumes: `SigningDocument`, `CompanyHSMProfile`, `PersonalCertificate`.
- Produces:
  - `<DocumentSigningStudioModal isOpen={boolean} onClose={() => void} document={SigningDocument} companyHsm={CompanyHSMProfile} personalCerts={PersonalCertificate[]} onSignSuccess={(docId, signaturePayload) => void} />`
  - `<NewDocumentUploadModal isOpen={boolean} onClose={() => void} onAddDocument={(newDoc) => void} />`

- [ ] **Step 1: Xây dựng `DocumentSigningStudioModal.tsx` với giao diện Split-view Fullscreen (Viewer + Kéo thả / click định vị con dấu/chữ ký + Ký nháy giáp lai + Bảng điều khiển xác thực PIN/OTP)**
- [ ] **Step 2: Xây dựng `NewDocumentUploadModal.tsx` hỗ trợ chọn file PDF/Word, nhập thông tin và đưa vào danh sách chờ ký**
- [ ] **Step 3: Viết test cho hành động ký số tương tác và cập nhật payload ký số**
- [ ] **Step 4: Chạy test pass**
- [ ] **Step 5: Commit Git**

---

### Task 4: Xây dựng Modal Ký Hàng Loạt & Bàn Xử Lý Văn Bản Ký Số

**Files:**
- Create: `D:/VComm/vcomm-erp/src/components/signature/modals/BatchSigningModal.tsx`
- Create: `D:/VComm/vcomm-erp/src/components/signature/SigningWorkspace.tsx`

**Interfaces:**
- Consumes: `SigningDocument[]`, `CompanyHSMProfile`, `PersonalCertificate[]`.
- Produces:
  - `<BatchSigningModal isOpen={boolean} onClose={() => void} selectedDocs={SigningDocument[]} companyHsm={CompanyHSMProfile} onBatchSignSuccess={(signedDocIds, method) => void} />`
  - `<SigningWorkspace documents={SigningDocument[]} onOpenStudio={(doc) => void} onOpenVerify={(doc) => void} onOpenUpload={() => void} onBatchSign={(selectedDocs) => void} />`

- [ ] **Step 1: Xây dựng `BatchSigningModal.tsx` với tiến trình thực thi ký hàng loạt (Progress Bar, 1 lần nhập PIN Cloud HSM)**
- [ ] **Step 2: Xây dựng `SigningWorkspace.tsx` với thanh chọn văn bản, bộ lọc Chờ ký/Đã ký, thanh tác vụ nổi Ký Hàng Loạt**
- [ ] **Step 3: Viết test cho luồng chọn nhiều văn bản và kích hoạt ký hàng loạt**
- [ ] **Step 4: Chạy test pass**
- [ ] **Step 5: Commit Git**

---

### Task 5: Xây dựng Dashboard Điều Hành & Quản Trị Cloud HSM Công Ty

**Files:**
- Create: `D:/VComm/vcomm-erp/src/components/signature/SignatureDashboard.tsx`
- Create: `D:/VComm/vcomm-erp/src/components/signature/CompanyHsmManager.tsx`

**Interfaces:**
- Consumes: `CompanyHSMProfile`, `PersonalCertificate[]`, `SigningDocument[]`, `HSMAuditLog[]`.
- Produces:
  - `<SignatureDashboard companyHsm={companyHsm} personalCerts={personalCerts} documents={documents} onNavigateTab={(tab) => void} onOpenInspectHsm={() => void} onTestHsm={() => void} isTestingHsm={boolean} testHsmSuccess={boolean} />`
  - `<CompanyHsmManager companyHsm={companyHsm} onToggleAutoSign={(rule) => void} onTestHsm={() => void} onOpenInspectHsm={() => void} isTestingHsm={boolean} testHsmSuccess={boolean} />`

- [ ] **Step 1: Xây dựng `SignatureDashboard.tsx` với 4 thẻ Hero KPI, thanh tiến trình quota, biểu đồ hoạt động ký 7 ngày gần nhất và Quick Actions Hub**
- [ ] **Step 2: Xây dựng `CompanyHsmManager.tsx` quản lý thông số cụm Cloud HSM, toggle quy tắc ký tự động (hóa đơn, phiếu kho, đối soát COD) và kiểm tra độ trễ kết nối**
- [ ] **Step 3: Viết test render Dashboard và toggle rule auto-sign**
- [ ] **Step 4: Chạy test pass**
- [ ] **Step 5: Commit Git**

---

### Task 6: Xây dựng Quản Lý Chứng Thư Cá Nhân, Ma Trận Thẩm Quyền & Nhật Ký Kiểm Toán

**Files:**
- Create: `D:/VComm/vcomm-erp/src/components/signature/PersonalCertsManager.tsx`
- Create: `D:/VComm/vcomm-erp/src/components/signature/AuthorityMatrixTab.tsx`
- Create: `D:/VComm/vcomm-erp/src/components/signature/SignatureAuditLogsTab.tsx`

**Interfaces:**
- Consumes: `PersonalCertificate[]`, `SigningAuthorityRule[]`, `HSMAuditLog[]`.
- Produces:
  - `<PersonalCertsManager certs={personalCerts} onCertAction={(id, action) => void} onOpenIssueModal={() => void} onInspectCert={(cert) => void} />`
  - `<AuthorityMatrixTab rules={INITIAL_AUTHORITY_RULES} />`
  - `<SignatureAuditLogsTab logs={auditLogs} />`

- [ ] **Step 1: Xây dựng `PersonalCertsManager.tsx` với bộ lọc trạng thái, tìm kiếm, nút xem chi tiết X.509, cảnh báo sắp hết hạn, và thao tác tạm khóa / mở khóa / thu hồi / gia hạn**
- [ ] **Step 2: Xây dựng `AuthorityMatrixTab.tsx` trực quan hóa quy tắc phân quyền ký duyệt và hạn mức VND**
- [ ] **Step 3: Xây dựng `SignatureAuditLogsTab.tsx` với bảng truy vết SHA-256, sao chép mã băm 1-click và xuất file Excel/CSV**
- [ ] **Step 4: Viết test cho các bộ lọc và hành động trên chứng thư cá nhân**
- [ ] **Step 5: Commit Git**

---

### Task 7: Tái cấu trúc `SignatureHub.tsx`, Ráp Nối Toàn Bộ Module & Test Tự Động

**Files:**
- Modify: `D:/VComm/vcomm-erp/src/components/SignatureHub.tsx`
- Test: `D:/VComm/vcomm-erp/src/__tests__/digital_signatures.test.ts`

**Interfaces:**
- Kết nối toàn bộ 6 tabs và 5 modals con vào `SignatureHub.tsx`.
- Điều phối state liền mạch: khi ký xong trong Studio hoặc Batch, cập nhật `documents`, `companyHsm`, và `auditLogs`.

- [ ] **Step 1: Cập nhật `SignatureHub.tsx` sử dụng các component con sạch sẽ, gọn gàng**
- [ ] **Step 2: Cập nhật bộ test tự động `digital_signatures.test.ts` bao phủ luồng ký tương tác, ký hàng loạt, và kiểm tra tính toàn vẹn**
- [ ] **Step 3: Chạy test tự động xác nhận pass toàn bộ**
- [ ] **Step 4: Commit Git**

---

### Task 8: Kiểm Thử Toàn Diện & Build Xác Thực

**Files:**
- Verification: Toàn bộ project `vcomm-erp`.

- [ ] **Step 1: Chạy `npm run build` trong `vcomm-erp` kiểm tra không có lỗi TypeScript / bundle**
- [ ] **Step 2: Chạy kiểm thử tự động toàn bộ test suite liên quan đến chữ ký số**
- [ ] **Step 3: Kiểm tra giao diện người dùng thực tế và ghi nhận kết quả xác minh**
- [ ] **Step 4: Commit Git cuối cùng**
