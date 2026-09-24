import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { DocumentSigningStudioModal } from '../components/signature/modals/DocumentSigningStudioModal';
import { NewDocumentUploadModal } from '../components/signature/modals/NewDocumentUploadModal';
import {
  INITIAL_COMPANY_HSM,
  INITIAL_PERSONAL_CERTS,
  INITIAL_SIGNING_DOCUMENTS,
  SigningDocument,
  calculateDocumentHashSHA256
} from '../data/hsmSignatureData';

// Configure React act environment
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Helper to simulate React input change via native value setter
function setInputValue(input: HTMLInputElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('Digital Signatures Studio & Upload Modals (Task 3)', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
      container = null;
    }
  });

  describe('DocumentSigningStudioModal', () => {
    const mockDoc = INITIAL_SIGNING_DOCUMENTS[0]; // HDLD-2026-0042 (2 pages, contract)

    it('should return null when isOpen is false', () => {
      const html = renderToString(
        <DocumentSigningStudioModal
          isOpen={false}
          onClose={() => {}}
          document={mockDoc}
          companyHsm={INITIAL_COMPANY_HSM}
          personalCerts={INITIAL_PERSONAL_CERTS}
          onSignSuccess={() => {}}
        />
      );
      expect(html).toBe('');
    });

    it('should return null when document is null', () => {
      const html = renderToString(
        <DocumentSigningStudioModal
          isOpen={true}
          onClose={() => {}}
          document={null}
          companyHsm={INITIAL_COMPANY_HSM}
          personalCerts={INITIAL_PERSONAL_CERTS}
          onSignSuccess={() => {}}
        />
      );
      expect(html).toBe('');
    });

    it('should render document header details, file size, page count, and status badge', () => {
      const html = renderToString(
        <DocumentSigningStudioModal
          isOpen={true}
          onClose={() => {}}
          document={mockDoc}
          companyHsm={INITIAL_COMPANY_HSM}
          personalCerts={INITIAL_PERSONAL_CERTS}
          onSignSuccess={() => {}}
        />
      );

      // Header info
      expect(html).toContain(mockDoc.title);
      expect(html).toContain(mockDoc.docCode);
      expect(html).toContain(mockDoc.department);
      expect(html).toContain(mockDoc.fileSize);
      expect(html).toContain('Tổng số:');
      expect(html).toContain('Bàn ký số tương tác');
    });

    it('should render document canvas with multi-page content from pagesContent', () => {
      const html = renderToString(
        <DocumentSigningStudioModal
          isOpen={true}
          onClose={() => {}}
          document={mockDoc}
          companyHsm={INITIAL_COMPANY_HSM}
          personalCerts={INITIAL_PERSONAL_CERTS}
          onSignSuccess={() => {}}
        />
      );

      // Paper header
      expect(html).toContain('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM');
      expect(html).toContain('Độc lập - Tự do - Hạnh phúc');

      // Page content (Page 2 is initial page for mockDoc)
      expect(html).toContain('Trang 2: Chế độ đãi ngộ, Bảo mật');
      expect(html).toContain('Điều 2: Chế độ làm việc, tiền lương và phụ cấp.');

      // Initial stamp giáp lai
      expect(html).toContain('KÝ NHÁY GIÁP LAI • VCOMM-CA');
    });

    it('should render interactive stamp box with company_stamp details', () => {
      const html = renderToString(
        <DocumentSigningStudioModal
          isOpen={true}
          onClose={() => {}}
          document={{
            ...mockDoc,
            stampPosition: {
              page: 2,
              x: 350,
              y: 650,
              stampType: 'company_stamp'
            }
          }}
          companyHsm={INITIAL_COMPANY_HSM}
          personalCerts={INITIAL_PERSONAL_CERTS}
          onSignSuccess={() => {}}
        />
      );

      expect(html).toContain('rendered-company-stamp');
      expect(html).toContain(INITIAL_COMPANY_HSM.taxCode);
      expect(html).toContain('CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM');
      expect(html).toContain('CLOUD HSM SECURE');
    });

    it('should render interactive stamp box with personal_signature when personal cert chosen', () => {
      const html = renderToString(
        <DocumentSigningStudioModal
          isOpen={true}
          onClose={() => {}}
          document={{
            ...mockDoc,
            signatureTypeNeeded: 'personal_cert',
            stampPosition: {
              page: 2,
              x: 350,
              y: 650,
              stampType: 'personal_signature'
            }
          }}
          companyHsm={INITIAL_COMPANY_HSM}
          personalCerts={INITIAL_PERSONAL_CERTS}
          onSignSuccess={() => {}}
        />
      );

      expect(html).toContain('rendered-personal-signature');
      expect(html).toContain('SmartCA Verified');
      expect(html).toContain(INITIAL_PERSONAL_CERTS[0].fullName);
    });

    it('should render interactive stamp box with badge_eidas when badge_eidas selected', () => {
      const html = renderToString(
        <DocumentSigningStudioModal
          isOpen={true}
          onClose={() => {}}
          document={{
            ...mockDoc,
            stampPosition: {
              page: 2,
              x: 350,
              y: 650,
              stampType: 'badge_eidas'
            }
          }}
          companyHsm={INITIAL_COMPANY_HSM}
          personalCerts={INITIAL_PERSONAL_CERTS}
          onSignSuccess={() => {}}
        />
      );

      expect(html).toContain('rendered-badge-eidas');
      expect(html).toContain('eIDAS / FIPS 140-2 Level 3');
      expect(html).toContain(INITIAL_COMPANY_HSM.companyName);
    });

    it('should display authority limit warning when document amount exceeds selected personal certificate limit', async () => {
      const highValueDoc: SigningDocument = {
        ...mockDoc,
        amount: 300000000, // 300 million VND
        signatureTypeNeeded: 'personal_cert'
      };

      // CERT-005 has 20M limit
      const lowLimitCert = INITIAL_PERSONAL_CERTS.find(c => c.signingLimitVND === 20000000) || {
        ...INITIAL_PERSONAL_CERTS[0],
        id: 'TEST-LOW-LIMIT',
        signingLimitVND: 20000000
      };

      await act(async () => {
        root?.render(
          <DocumentSigningStudioModal
            isOpen={true}
            onClose={() => {}}
            document={highValueDoc}
            companyHsm={INITIAL_COMPANY_HSM}
            personalCerts={[lowLimitCert]}
            onSignSuccess={() => {}}
          />
        );
      });

      const warningEl = container?.querySelector('[data-testid="authority-limit-warning"]');
      expect(warningEl).not.toBeNull();
      expect(warningEl?.textContent).toContain('CẢNH BÁO VƯỢT THẨM QUYỀN KÝ');
      expect(warningEl?.textContent).toContain('20.000.000');
    });

    it('should allow user to navigate pages, adjust zoom, and click to reposition stamp', async () => {
      await act(async () => {
        root?.render(
          <DocumentSigningStudioModal
            isOpen={true}
            onClose={() => {}}
            document={mockDoc}
            companyHsm={INITIAL_COMPANY_HSM}
            personalCerts={INITIAL_PERSONAL_CERTS}
            onSignSuccess={() => {}}
          />
        );
      });

      // Check current page indicator
      expect(container?.textContent).toContain('Trang 2 / 2');

      // Click "Trang trước"
      const prevBtn = container?.querySelector('button[aria-label="Trang trước"]') as HTMLButtonElement;
      expect(prevBtn).not.toBeNull();
      await act(async () => {
        prevBtn.click();
      });
      expect(container?.textContent).toContain('Trang 1 / 2');

      // Test Zoom In button
      const zoomInBtn = container?.querySelector('button[aria-label="Phóng to"]') as HTMLButtonElement;
      expect(zoomInBtn).not.toBeNull();
      await act(async () => {
        zoomInBtn.click();
      });
      expect(container?.textContent).toContain('110%');

      // Click on canvas to place stamp
      const paperCanvas = container?.querySelector('[data-testid="document-paper-canvas"]') as HTMLDivElement;
      expect(paperCanvas).not.toBeNull();

      await act(async () => {
        paperCanvas.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            clientX: 200,
            clientY: 400
          })
        );
      });

      const stampBox = container?.querySelector('[data-testid="interactive-stamp-box"]');
      expect(stampBox).not.toBeNull();
    });

    it('should execute cryptographic signing and invoke onSignSuccess with payload', async () => {
      vi.useFakeTimers();
      const onSignSuccessMock = vi.fn();
      const onCloseMock = vi.fn();

      await act(async () => {
        root?.render(
          <DocumentSigningStudioModal
            isOpen={true}
            onClose={onCloseMock}
            document={mockDoc}
            companyHsm={INITIAL_COMPANY_HSM}
            personalCerts={INITIAL_PERSONAL_CERTS}
            onSignSuccess={onSignSuccessMock}
          />
        );
      });

      // Find "Xác Nhận Ký Số Mật Mã Học" button
      const signButtons = Array.from(container?.querySelectorAll('button') || []);
      const confirmSignBtn = signButtons.find(b => b.textContent?.includes('Xác Nhận Ký Số Mật Mã Học'));
      expect(confirmSignBtn).toBeDefined();

      await act(async () => {
        confirmSignBtn?.click();
      });

      // Fast-forward simulated cryptographic signing timer
      await act(async () => {
        vi.runAllTimers();
      });

      expect(onSignSuccessMock).toHaveBeenCalledTimes(1);
      const [calledDocId, payload] = onSignSuccessMock.mock.calls[0];
      expect(calledDocId).toBe(mockDoc.id);
      expect(payload.signerName).toBe(INITIAL_COMPANY_HSM.companyName);
      expect(payload.certSerial).toBe(INITIAL_COMPANY_HSM.serialNumber);
      expect(payload.method).toContain('Cloud HSM');
      expect(payload.hashSHA256).toMatch(/^[0-9a-f]{64}$/);
      expect(payload.hasInitialStampAllPages).toBe(true);

      expect(onCloseMock).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  describe('NewDocumentUploadModal', () => {
    it('should return null when isOpen is false', () => {
      const html = renderToString(
        <NewDocumentUploadModal
          isOpen={false}
          onClose={() => {}}
          onAddDocument={() => {}}
        />
      );
      expect(html).toBe('');
    });

    it('should render upload modal with all required form controls', () => {
      const html = renderToString(
        <NewDocumentUploadModal
          isOpen={true}
          onClose={() => {}}
          onAddDocument={() => {}}
        />
      );

      expect(html).toContain('Tải Lên Văn Bản Mới &amp; Khởi Tạo Luồng Ký');
      expect(html).toContain('Tệp tài liệu cần ký:');
      expect(html).toContain('Tiêu đề văn bản');
      expect(html).toContain('Phân loại văn bản:');
      expect(html).toContain('Mức độ ưu tiên:');
      expect(html).toContain('Giá trị tài chính (VNĐ, nếu có):');
      expect(html).toContain('Người khởi tạo:');
      expect(html).toContain('Phòng ban:');
      expect(html).toContain('Yêu cầu loại chữ ký số:');
      expect(html).toContain('Tạo &amp; Đưa Vào Bàn Ký');
    });

    it('should submit form, generate SigningDocument with 2 pages and invoke onAddDocument', async () => {
      const onAddDocMock = vi.fn();
      const onCloseMock = vi.fn();

      await act(async () => {
        root?.render(
          <NewDocumentUploadModal
            isOpen={true}
            onClose={onCloseMock}
            onAddDocument={onAddDocMock}
          />
        );
      });

      // Change title
      const titleInput = container?.querySelector('#doc-title-input') as HTMLInputElement;
      expect(titleInput).not.toBeNull();
      await act(async () => {
        setInputValue(titleInput, 'Hợp đồng kiểm toán hệ thống máy chủ Cloud HSM 2026');
      });

      // Change amount
      const amountInput = container?.querySelector('#doc-amount-input') as HTMLInputElement;
      expect(amountInput).not.toBeNull();
      await act(async () => {
        setInputValue(amountInput, '80000000');
      });

      // Submit form
      const form = container?.querySelector('form') as HTMLFormElement;
      expect(form).not.toBeNull();
      await act(async () => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });

      expect(onAddDocMock).toHaveBeenCalledTimes(1);
      const generatedDoc: SigningDocument = onAddDocMock.mock.calls[0][0];

      expect(generatedDoc.title).toBe('Hợp đồng kiểm toán hệ thống máy chủ Cloud HSM 2026');
      expect(generatedDoc.amount).toBe(80000000);
      expect(generatedDoc.status).toBe('pending');
      expect(generatedDoc.totalPages).toBe(2);
      expect(generatedDoc.pagesContent).toBeDefined();
      expect(generatedDoc.pagesContent?.length).toBe(2);
      expect(generatedDoc.docCode).toMatch(/^HD-2026-\d{4}$/);
      expect(generatedDoc.stampPosition).toBeDefined();

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should validate empty title on submission', async () => {
      const onAddDocMock = vi.fn();

      await act(async () => {
        root?.render(
          <NewDocumentUploadModal
            isOpen={true}
            onClose={() => {}}
            onAddDocument={onAddDocMock}
          />
        );
      });

      const titleInput = container?.querySelector('#doc-title-input') as HTMLInputElement;
      await act(async () => {
        setInputValue(titleInput, '');
      });

      const form = container?.querySelector('form') as HTMLFormElement;
      await act(async () => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });

      expect(onAddDocMock).not.toHaveBeenCalled();
      expect(container?.textContent).toContain('Vui lòng nhập tiêu đề văn bản.');
    });
  });
});
