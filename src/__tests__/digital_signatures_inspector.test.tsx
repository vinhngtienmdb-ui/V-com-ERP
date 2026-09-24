import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CertificateInspectorModal } from '../components/signature/modals/CertificateInspectorModal';
import { VerifyIntegrityModal } from '../components/signature/modals/VerifyIntegrityModal';
import {
  INITIAL_COMPANY_HSM,
  INITIAL_PERSONAL_CERTS,
  INITIAL_SIGNING_DOCUMENTS,
  generateX509Details,
  calculateDocumentHashSHA256
} from '../data/hsmSignatureData';

describe('Digital Signatures Inspector & Integrity Verification Modals', () => {
  describe('CertificateInspectorModal', () => {
    it('should return null when isOpen is false', () => {
      const html = renderToString(
        <CertificateInspectorModal
          isOpen={false}
          onClose={() => {}}
          certData={INITIAL_COMPANY_HSM}
        />
      );
      expect(html).toBe('');
    });

    it('should return null when certData is null', () => {
      const html = renderToString(
        <CertificateInspectorModal
          isOpen={true}
          onClose={() => {}}
          certData={null}
        />
      );
      expect(html).toBe('');
    });

    it('should render Company HSM Profile with Overview tab details and 3-tier hierarchy structure', () => {
      const html = renderToString(
        <CertificateInspectorModal
          isOpen={true}
          onClose={() => {}}
          certData={INITIAL_COMPANY_HSM}
        />
      );

      // Title & Badges
      expect(html).toContain('Trình Soi Chứng Thư Số X.509');
      expect(html).toContain('Cloud HSM Root');

      // Subject Info
      expect(html).toContain(INITIAL_COMPANY_HSM.companyName);
      expect(html).toContain(INITIAL_COMPANY_HSM.taxCode);
      expect(html).toContain(INITIAL_COMPANY_HSM.serialNumber);

      // Issuer Info
      expect(html).toContain('Viettel-CA Cloud HSM Root Authority Tier-1');
      expect(html).toContain('Bộ Thông tin và Truyền thông');

      // Status & Validity
      expect(html).toContain('HỢP LỆ &amp; KHẢ DỤNG');
      expect(html).toContain(INITIAL_COMPANY_HSM.validFrom);
      expect(html).toContain(INITIAL_COMPANY_HSM.validTo);
      expect(html).toContain(String(INITIAL_COMPANY_HSM.daysRemaining));
      expect(html).toContain('ngày');

      // Standard & Revocation
      expect(html).toContain('FIPS 140-2 Level 3');
      expect(html).toContain('Valid &amp; Active');
      expect(html).toContain('RFC 6960');
      expect(html).toContain('vcomm-corporate-hsm.crl');

      // Tabs & Actions
      expect(html).toContain('Tổng quan');
      expect(html).toContain('Chuỗi Chứng Thực (Trust Chain)');
      expect(html).toContain('Chi Tiết Mật Mã Học');
      expect(html).toContain('Xuất Chứng Thư (.CRT)');
      expect(html).toContain('Đóng');
    });

    it('should render Personal Certificate details accurately', () => {
      const personalCert = INITIAL_PERSONAL_CERTS[0];
      const html = renderToString(
        <CertificateInspectorModal
          isOpen={true}
          onClose={() => {}}
          certData={personalCert}
        />
      );

      expect(html).toContain('Personal CA');
      expect(html).toContain(personalCert.fullName);
      expect(html).toContain(personalCert.staffCode);
      expect(html).toContain(personalCert.email);
      expect(html).toContain(personalCert.serialNumber);
      expect(html).toContain('Việt Nam');
    });

    it('should generate accurate 3-level trust chain and cryptographic details from model', () => {
      const details = generateX509Details(INITIAL_COMPANY_HSM);

      // Verify Level 1, 2, 3 hierarchy
      expect(details.trustChain).toHaveLength(3);
      expect(details.trustChain[0].level).toBe(1);
      expect(details.trustChain[0].name).toContain('National Root CA');
      expect(details.trustChain[1].level).toBe(2);
      expect(details.trustChain[1].name).toContain('Viettel-CA');
      expect(details.trustChain[2].level).toBe(3);
      expect(details.trustChain[2].name).toBe(INITIAL_COMPANY_HSM.companyName);

      // Cryptographic attributes
      expect(details.publicKeyAlgorithm).toContain('RSA');
      expect(details.signatureAlgorithm).toContain('SHA256withRSA');
      expect(details.keyUsage).toContain('Digital Signature');
      expect(details.keyUsage).toContain('Non-Repudiation');
      expect(details.sha256Fingerprint).toMatch(/^([0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$/);
    });
  });

  describe('VerifyIntegrityModal', () => {
    it('should return null when isOpen is false', () => {
      const doc = INITIAL_SIGNING_DOCUMENTS[2]; // signed doc
      const html = renderToString(
        <VerifyIntegrityModal
          isOpen={false}
          onClose={() => {}}
          doc={doc}
        />
      );
      expect(html).toBe('');
    });

    it('should return null when doc is null', () => {
      const html = renderToString(
        <VerifyIntegrityModal
          isOpen={true}
          onClose={() => {}}
          doc={null}
        />
      );
      expect(html).toBe('');
    });

    it('should render signed document verification with 100% integrity banner and SHA-256 hash', () => {
      const signedDoc = INITIAL_SIGNING_DOCUMENTS[2]; // PXK-2026-9812
      const html = renderToString(
        <VerifyIntegrityModal
          isOpen={true}
          onClose={() => {}}
          doc={signedDoc}
        />
      );

      // Header & Legal Standard
      expect(html).toContain('Thẩm Tra Toàn Vẹn Chữ Ký Số');
      expect(html).toContain('Nghị định 130/2018/NĐ-CP');

      // 100% Integrity Banner
      expect(html).toContain('Chữ Ký Số Hợp Lệ &amp; Nguyên Vẹn 100%');
      expect(html).toContain('Luật Giao dịch Điện tử 2023');
      expect(html).toContain('Dấu thời gian TSA RFC 3161');

      // Document Info
      expect(html).toContain(signedDoc.docCode);
      expect(html).toContain(signedDoc.title);
      expect(html).toContain(signedDoc.department.replace('&', '&amp;'));
      expect(html).toContain(signedDoc.requestedBy);
      expect(html).toContain(signedDoc.fileSize);
      expect(html).toContain(String(signedDoc.totalPages));
      expect(html).toContain('trang tài liệu');

      // Signer Verification
      expect(html).toContain(signedDoc.signedBy!.name);
      expect(html).toContain(signedDoc.signedBy!.certSerial);
      expect(html).toContain(signedDoc.signedBy!.method);
      expect(html).toContain(signedDoc.signedBy!.signedAt);

      // SHA-256 Hash Frame
      expect(html).toContain('Mã Băm Toàn Vẹn SHA-256');
      expect(html).toContain(signedDoc.signedBy!.hashSHA256);
      expect(html).toContain('Sao chép mã băm');

      // Technical Verification Checklist
      expect(html).toContain('Kiểm tra mã băm văn bản không bị biến đổi');
      expect(html).toContain('Chứng thư số và khóa công khai hợp lệ tại thời điểm ký');
      expect(html).toContain('Dấu thời gian điện tử (TSA) hợp lệ');
      expect(html).toContain('Giá trị pháp lý theo Luật Giao dịch Điện tử');

      // Actions
      expect(html).toContain('Tải Giấy Chứng Nhận Ký Số (.PDF)');
      expect(html).toContain('Đóng');
    });

    it('should render pending document with unsigned status banner and calculated hash', () => {
      const pendingDoc = INITIAL_SIGNING_DOCUMENTS[0]; // HDLD-2026-0042
      const expectedHash = calculateDocumentHashSHA256(pendingDoc);

      const html = renderToString(
        <VerifyIntegrityModal
          isOpen={true}
          onClose={() => {}}
          doc={pendingDoc}
        />
      );

      // Unsigned Warning Banner
      expect(html).toContain('Văn Bản Chưa Hoàn Tất Ký Số');
      expect(html).toContain(pendingDoc.docCode);
      expect(html).toContain(pendingDoc.title);

      // Calculated Checksum rendered
      expect(html).toContain(expectedHash);
    });
  });
});
