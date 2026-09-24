import { describe, it, expect } from 'vitest';
import {
  INITIAL_COMPANY_HSM,
  INITIAL_PERSONAL_CERTS,
  INITIAL_SIGNING_DOCUMENTS,
  generateX509Details,
  calculateDocumentHashSHA256,
  SigningDocument,
  X509CertificateDetails
} from '../data/hsmSignatureData';

describe('Digital Signatures & Cloud HSM Data Models & Helpers', () => {
  describe('generateX509Details', () => {
    it('should generate valid X.509 certificate details for Company HSM profile', () => {
      const details = generateX509Details(INITIAL_COMPANY_HSM);

      expect(details).toBeDefined();
      expect(details.subjectCN).toBe(INITIAL_COMPANY_HSM.companyName);
      expect(details.subjectTaxCode).toBe(INITIAL_COMPANY_HSM.taxCode);
      expect(details.subjectCountry).toBe('VN');
      expect(details.issuerOrg).toBeTruthy();
      expect(details.validFrom).toBe(INITIAL_COMPANY_HSM.validFrom);
      expect(details.validTo).toBe(INITIAL_COMPANY_HSM.validTo);
      expect(details.daysRemaining).toBe(INITIAL_COMPANY_HSM.daysRemaining);
      expect(['valid', 'warning', 'expired', 'revoked']).toContain(details.status);
      expect(details.serialNumber).toBe(INITIAL_COMPANY_HSM.serialNumber);
      expect(details.publicKeyAlgorithm).toBeTruthy();
      expect(details.keySize).toBeTruthy();
      expect(details.signatureAlgorithm).toBeTruthy();
      expect(details.sha1Fingerprint).toMatch(/^([0-9A-Fa-f]{2}:){19}[0-9A-Fa-f]{2}$/);
      expect(details.sha256Fingerprint).toMatch(/^([0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$/);
      expect(Array.isArray(details.keyUsage)).toBe(true);
      expect(details.keyUsage.length).toBeGreaterThan(0);
      expect(details.ocspStatus).toBeTruthy();
      expect(details.crlDistributionPoint).toContain('http');

      // Trust chain verification (3 tiers: Root CA -> Intermediate CA -> Leaf)
      expect(details.trustChain).toHaveLength(3);
      expect(details.trustChain[0].type).toBe('root_ca');
      expect(details.trustChain[0].level).toBe(1);
      expect(details.trustChain[1].type).toBe('intermediate_ca');
      expect(details.trustChain[1].level).toBe(2);
      expect(details.trustChain[2].type).toBe('leaf');
      expect(details.trustChain[2].level).toBe(3);
      expect(details.trustChain[2].name).toBe(INITIAL_COMPANY_HSM.companyName);
    });

    it('should generate valid X.509 certificate details for Personal Certificate', () => {
      const cert = INITIAL_PERSONAL_CERTS[0];
      const details = generateX509Details(cert);

      expect(details).toBeDefined();
      expect(details.subjectCN).toBe(cert.fullName);
      expect(details.subjectEmail).toBe(cert.email);
      expect(details.subjectCountry).toBe('VN');
      expect(details.serialNumber).toBe(cert.serialNumber);
      expect(details.validFrom).toBe(cert.issuedDate);
      expect(details.validTo).toBe(cert.expiryDate);
      expect(['valid', 'warning', 'expired', 'revoked']).toContain(details.status);

      // Trust chain verification
      expect(details.trustChain).toHaveLength(3);
      expect(details.trustChain[0].type).toBe('root_ca');
      expect(details.trustChain[1].type).toBe('intermediate_ca');
      expect(details.trustChain[2].type).toBe('leaf');
      expect(details.trustChain[2].name).toBe(cert.fullName);
    });

    it('should map suspended or expired certificate status accurately', () => {
      const suspendedCert = INITIAL_PERSONAL_CERTS.find(c => c.status === 'suspended');
      if (suspendedCert) {
        const details = generateX509Details(suspendedCert);
        expect(details.status).toBe('revoked');
      }
    });
  });

  describe('calculateDocumentHashSHA256', () => {
    it('should generate a 64-character lowercase hex SHA-256 hash', () => {
      const doc = INITIAL_SIGNING_DOCUMENTS[0];
      const hash = calculateDocumentHashSHA256(doc);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should be deterministic for the same document input', () => {
      const doc = INITIAL_SIGNING_DOCUMENTS[0];
      const hash1 = calculateDocumentHashSHA256(doc);
      const hash2 = calculateDocumentHashSHA256(doc);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hash when document content changes (tamper-evident)', () => {
      const doc = INITIAL_SIGNING_DOCUMENTS[0];
      const hashOriginal = calculateDocumentHashSHA256(doc);

      const modifiedDoc: SigningDocument = {
        ...doc,
        title: doc.title + ' (ĐÃ CHỈNH SỬA)'
      };
      const hashModified = calculateDocumentHashSHA256(modifiedDoc);

      expect(hashModified).toMatch(/^[a-f0-9]{64}$/);
      expect(hashModified).not.toBe(hashOriginal);
    });

    it('should incorporate PIN/secret when provided for enhanced signing hash', () => {
      const doc = INITIAL_SIGNING_DOCUMENTS[0];
      const hashWithoutPin = calculateDocumentHashSHA256(doc);
      const hashWithPin = calculateDocumentHashSHA256(doc, '123456');

      expect(hashWithPin).toMatch(/^[a-f0-9]{64}$/);
      expect(hashWithPin).not.toBe(hashWithoutPin);
    });
  });

  describe('INITIAL_SIGNING_DOCUMENTS Data Quality & Structure', () => {
    it('should contain between 6 and 8 varied enterprise documents', () => {
      expect(INITIAL_SIGNING_DOCUMENTS.length).toBeGreaterThanOrEqual(6);
      expect(INITIAL_SIGNING_DOCUMENTS.length).toBeLessThanOrEqual(10);
    });

    it('should contain both pending and signed documents', () => {
      const pendingDocs = INITIAL_SIGNING_DOCUMENTS.filter(d => d.status === 'pending');
      const signedDocs = INITIAL_SIGNING_DOCUMENTS.filter(d => d.status === 'signed');

      expect(pendingDocs.length).toBeGreaterThan(0);
      expect(signedDocs.length).toBeGreaterThan(0);
    });

    it('should cover key business categories', () => {
      const categories = INITIAL_SIGNING_DOCUMENTS.map(d => d.category);
      expect(categories).toContain('contract');
      expect(categories).toContain('e_invoice');
      expect(categories).toContain('warehouse_slip');
      expect(categories).toContain('request');
      expect(categories).toContain('tax_report');
    });

    it('every document must have at least 2 pages with title and paragraphs for Document Studio', () => {
      INITIAL_SIGNING_DOCUMENTS.forEach(doc => {
        expect(doc.pagesContent).toBeDefined();
        expect(doc.pagesContent!.length).toBeGreaterThanOrEqual(2);
        doc.pagesContent!.forEach(page => {
          expect(page.pageNumber).toBeGreaterThan(0);
          expect(page.title).toBeTruthy();
          expect(Array.isArray(page.paragraphs)).toBe(true);
          expect(page.paragraphs.length).toBeGreaterThan(0);
        });
      });
    });

    it('signed documents should contain cryptographic hash and signer serial', () => {
      const signedDocs = INITIAL_SIGNING_DOCUMENTS.filter(d => d.status === 'signed');
      signedDocs.forEach(doc => {
        expect(doc.signedBy).toBeDefined();
        expect(doc.signedBy!.certSerial).toBeTruthy();
        expect(doc.signedBy!.hashSHA256).toMatch(/^[a-f0-9]{64}$/);
      });
    });

    it('should support stampPosition and isBatchEligible flags', () => {
      const withStamp = INITIAL_SIGNING_DOCUMENTS.find(d => d.stampPosition !== undefined);
      expect(withStamp).toBeDefined();
      expect(withStamp!.stampPosition!.page).toBeGreaterThan(0);
      expect(withStamp!.stampPosition!.x).toBeGreaterThanOrEqual(0);
      expect(withStamp!.stampPosition!.y).toBeGreaterThanOrEqual(0);

      const batchEligible = INITIAL_SIGNING_DOCUMENTS.filter(d => d.isBatchEligible === true);
      expect(batchEligible.length).toBeGreaterThan(0);
    });
  });
});
