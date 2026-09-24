import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { SigningWorkspace } from '../components/signature/SigningWorkspace';
import { BatchSigningModal } from '../components/signature/modals/BatchSigningModal';
import {
  INITIAL_COMPANY_HSM,
  INITIAL_PERSONAL_CERTS,
  INITIAL_SIGNING_DOCUMENTS,
  SigningDocument
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

describe('Digital Signatures Workspace & Batch Signing (Task 4)', () => {
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

  describe('SigningWorkspace Component', () => {
    const onOpenStudioMock = vi.fn();
    const onOpenVerifyMock = vi.fn();
    const onOpenUploadMock = vi.fn();
    const onBatchSignMock = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render initial pending documents correctly', () => {
      const pendingDocs = INITIAL_SIGNING_DOCUMENTS.filter(d => d.status === 'pending');
      const signedDocs = INITIAL_SIGNING_DOCUMENTS.filter(d => d.status === 'signed');

      const html = renderToString(
        <SigningWorkspace
          documents={INITIAL_SIGNING_DOCUMENTS}
          onOpenStudio={onOpenStudioMock}
          onOpenVerify={onOpenVerifyMock}
          onOpenUpload={onOpenUploadMock}
          onBatchSign={onBatchSignMock}
        />
      );

      // Verify tabs counts
      expect(html).toContain(`Chờ tôi ký (${pendingDocs.length})`);
      expect(html).toContain(`Đã hoàn tất ký (${signedDocs.length})`);

      // Verify first pending doc title is rendered
      expect(html).toContain(pendingDocs[0].title);
      expect(html).toContain('+ Trình Ký Văn Bản Mới');
    });

    it('should switch between "Chờ tôi ký" and "Đã hoàn tất ký" tabs', async () => {
      await act(async () => {
        root?.render(
          <SigningWorkspace
            documents={INITIAL_SIGNING_DOCUMENTS}
            onOpenStudio={onOpenStudioMock}
            onOpenVerify={onOpenVerifyMock}
            onOpenUpload={onOpenUploadMock}
            onBatchSign={onBatchSignMock}
          />
        );
      });

      // Default pending tab: contains pending document HDLD-2026-0042
      expect(container?.textContent).toContain('HDLD-2026-0042');
      expect(container?.textContent).toContain('Mở Bàn Ký');

      // Click "Đã hoàn tất ký" button
      const allButtons = Array.from(container?.querySelectorAll('button') || []);
      const signedTabBtn = allButtons.find(b => b.textContent?.includes('Đã hoàn tất ký'));
      expect(signedTabBtn).toBeDefined();

      await act(async () => {
        signedTabBtn?.click();
      });

      // In signed tab: should contain signed document PXK-2026-9812 and button "Xác Thực Chữ Ký"
      expect(container?.textContent).toContain('PXK-2026-9812');
      expect(container?.textContent).toContain('Xác Thực Chữ Ký');
      expect(container?.textContent).not.toContain('Mở Bàn Ký');
    });

    it('should filter documents by category tabs', async () => {
      await act(async () => {
        root?.render(
          <SigningWorkspace
            documents={INITIAL_SIGNING_DOCUMENTS}
            onOpenStudio={onOpenStudioMock}
            onOpenVerify={onOpenVerifyMock}
            onOpenUpload={onOpenUploadMock}
            onBatchSign={onBatchSignMock}
          />
        );
      });

      const buttons = Array.from(container?.querySelectorAll('button') || []);
      const invoiceCatBtn = buttons.find(b => b.textContent === 'Hóa đơn điện tử');
      expect(invoiceCatBtn).toBeDefined();

      await act(async () => {
        invoiceCatBtn?.click();
      });

      // Pending invoice INV-2026-4921 should be visible
      expect(container?.textContent).toContain('INV-2026-4921');
      // Contract HDLD-2026-0042 should not be visible
      expect(container?.textContent).not.toContain('HDLD-2026-0042');

      // Switch back to "Tất cả"
      const allCatBtn = Array.from(container?.querySelectorAll('button') || []).find(b => b.textContent === 'Tất cả');
      await act(async () => {
        allCatBtn?.click();
      });

      expect(container?.textContent).toContain('HDLD-2026-0042');
      expect(container?.textContent).toContain('INV-2026-4921');
    });

    it('should search documents in real-time by code, title, requester and department', async () => {
      await act(async () => {
        root?.render(
          <SigningWorkspace
            documents={INITIAL_SIGNING_DOCUMENTS}
            onOpenStudio={onOpenStudioMock}
            onOpenVerify={onOpenVerifyMock}
            onOpenUpload={onOpenUploadMock}
            onBatchSign={onBatchSignMock}
          />
        );
      });

      const searchInput = container?.querySelector('input[type="text"]') as HTMLInputElement;
      expect(searchInput).not.toBeNull();

      // Search by docCode
      await act(async () => {
        setInputValue(searchInput, 'DNTC-2026-0118');
      });

      expect(container?.textContent).toContain('DNTC-2026-0118');
      expect(container?.textContent).not.toContain('HDLD-2026-0042');

      // Search with non-matching query
      await act(async () => {
        setInputValue(searchInput, 'XYZ-NON-EXISTENT-QUERY-999');
      });

      expect(container?.textContent).toContain('Không tìm thấy văn bản nào phù hợp');

      // Clear search
      const clearBtn = container?.querySelector('button[aria-label="Xóa tìm kiếm"]') as HTMLButtonElement;
      expect(clearBtn).not.toBeNull();
      await act(async () => {
        clearBtn.click();
      });

      expect(container?.textContent).toContain('HDLD-2026-0042');
    });

    it('should trigger onOpenUpload when clicking "+ Trình Ký Văn Bản Mới"', async () => {
      await act(async () => {
        root?.render(
          <SigningWorkspace
            documents={INITIAL_SIGNING_DOCUMENTS}
            onOpenStudio={onOpenStudioMock}
            onOpenVerify={onOpenVerifyMock}
            onOpenUpload={onOpenUploadMock}
            onBatchSign={onBatchSignMock}
          />
        );
      });

      const buttons = Array.from(container?.querySelectorAll('button') || []);
      const uploadBtn = buttons.find(b => b.textContent?.includes('+ Trình Ký Văn Bản Mới'));
      expect(uploadBtn).toBeDefined();

      await act(async () => {
        uploadBtn?.click();
      });

      expect(onOpenUploadMock).toHaveBeenCalledTimes(1);
    });

    it('should handle document selection and display Floating Action Bar', async () => {
      await act(async () => {
        root?.render(
          <SigningWorkspace
            documents={INITIAL_SIGNING_DOCUMENTS}
            onOpenStudio={onOpenStudioMock}
            onOpenVerify={onOpenVerifyMock}
            onOpenUpload={onOpenUploadMock}
            onBatchSign={onBatchSignMock}
          />
        );
      });

      // Initially no floating action bar
      expect(container?.querySelector('[data-testid="batch-floating-action-bar"]')).toBeNull();

      // Find checkboxes in table rows
      const rowCheckboxes = Array.from(
        container?.querySelectorAll('tbody input[type="checkbox"]') || []
      ) as HTMLInputElement[];
      expect(rowCheckboxes.length).toBeGreaterThan(0);

      // Check first document
      await act(async () => {
        rowCheckboxes[0].click();
      });

      // Floating action bar appears
      const floatingBar = container?.querySelector('[data-testid="batch-floating-action-bar"]');
      expect(floatingBar).not.toBeNull();
      expect(floatingBar?.textContent).toContain('Đã chọn 1 văn bản');

      // Check second document
      await act(async () => {
        rowCheckboxes[1].click();
      });
      expect(container?.textContent).toContain('Đã chọn 2 văn bản');

      // Test "Hủy chọn" button in floating action bar
      const cancelSelectBtn = Array.from(floatingBar?.querySelectorAll('button') || []).find(
        b => b.textContent?.includes('Hủy chọn')
      );
      expect(cancelSelectBtn).toBeDefined();

      await act(async () => {
        cancelSelectBtn?.click();
      });

      // Floating action bar is removed
      expect(container?.querySelector('[data-testid="batch-floating-action-bar"]')).toBeNull();
    });

    it('should handle Select All / Deselect All via thead checkbox', async () => {
      await act(async () => {
        root?.render(
          <SigningWorkspace
            documents={INITIAL_SIGNING_DOCUMENTS}
            onOpenStudio={onOpenStudioMock}
            onOpenVerify={onOpenVerifyMock}
            onOpenUpload={onOpenUploadMock}
            onBatchSign={onBatchSignMock}
          />
        );
      });

      const theadCheckbox = container?.querySelector(
        'thead input[type="checkbox"]'
      ) as HTMLInputElement;
      expect(theadCheckbox).not.toBeNull();

      // Click to select all visible pending docs
      await act(async () => {
        theadCheckbox.click();
      });

      const pendingCount = INITIAL_SIGNING_DOCUMENTS.filter(d => d.status === 'pending').length;
      expect(container?.textContent).toContain(`Đã chọn ${pendingCount} văn bản`);

      // Click again to deselect all
      await act(async () => {
        theadCheckbox.click();
      });

      expect(container?.querySelector('[data-testid="batch-floating-action-bar"]')).toBeNull();
    });

    it('should trigger onBatchSign when clicking "Ký Hàng Loạt Ngay" in floating bar', async () => {
      await act(async () => {
        root?.render(
          <SigningWorkspace
            documents={INITIAL_SIGNING_DOCUMENTS}
            onOpenStudio={onOpenStudioMock}
            onOpenVerify={onOpenVerifyMock}
            onOpenUpload={onOpenUploadMock}
            onBatchSign={onBatchSignMock}
          />
        );
      });

      const rowCheckboxes = Array.from(
        container?.querySelectorAll('tbody input[type="checkbox"]') || []
      ) as HTMLInputElement[];

      await act(async () => {
        rowCheckboxes[0].click();
      });

      const floatingBar = container?.querySelector('[data-testid="batch-floating-action-bar"]');
      const batchSignBtn = Array.from(floatingBar?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Ký Hàng Loạt Ngay')
      );
      expect(batchSignBtn).toBeDefined();

      await act(async () => {
        batchSignBtn?.click();
      });

      expect(onBatchSignMock).toHaveBeenCalledTimes(1);
      const passedDocs: SigningDocument[] = onBatchSignMock.mock.calls[0][0];
      expect(passedDocs.length).toBe(1);
      expect(passedDocs[0].id).toBe(INITIAL_SIGNING_DOCUMENTS.filter(d => d.status === 'pending')[0].id);
    });

    it('should trigger onOpenStudio when clicking "Mở Bàn Ký"', async () => {
      await act(async () => {
        root?.render(
          <SigningWorkspace
            documents={INITIAL_SIGNING_DOCUMENTS}
            onOpenStudio={onOpenStudioMock}
            onOpenVerify={onOpenVerifyMock}
            onOpenUpload={onOpenUploadMock}
            onBatchSign={onBatchSignMock}
          />
        );
      });

      const openStudioBtns = Array.from(container?.querySelectorAll('button') || []).filter(b =>
        b.textContent?.includes('Mở Bàn Ký')
      );
      expect(openStudioBtns.length).toBeGreaterThan(0);

      await act(async () => {
        openStudioBtns[0].click();
      });

      expect(onOpenStudioMock).toHaveBeenCalledTimes(1);
      expect(onOpenStudioMock.mock.calls[0][0].id).toBe('DOC-001');
    });

    it('should trigger onOpenVerify when clicking "Xác Thực Chữ Ký" in signed tab', async () => {
      await act(async () => {
        root?.render(
          <SigningWorkspace
            documents={INITIAL_SIGNING_DOCUMENTS}
            onOpenStudio={onOpenStudioMock}
            onOpenVerify={onOpenVerifyMock}
            onOpenUpload={onOpenUploadMock}
            onBatchSign={onBatchSignMock}
          />
        );
      });

      // Switch to signed tab
      const signedTabBtn = Array.from(container?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Đã hoàn tất ký')
      );
      await act(async () => {
        signedTabBtn?.click();
      });

      const verifyBtns = Array.from(container?.querySelectorAll('button') || []).filter(b =>
        b.textContent?.includes('Xác Thực Chữ Ký')
      );
      expect(verifyBtns.length).toBeGreaterThan(0);

      await act(async () => {
        verifyBtns[0].click();
      });

      expect(onOpenVerifyMock).toHaveBeenCalledTimes(1);
      expect(onOpenVerifyMock.mock.calls[0][0].status).toBe('signed');
    });
  });

  describe('BatchSigningModal Component', () => {
    const selectedPendingDocs = INITIAL_SIGNING_DOCUMENTS.filter(d => d.status === 'pending').slice(0, 2);
    const onCloseMock = vi.fn();
    const onBatchSignSuccessMock = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return null when isOpen is false', () => {
      const html = renderToString(
        <BatchSigningModal
          isOpen={false}
          onClose={onCloseMock}
          selectedDocs={selectedPendingDocs}
          companyHsm={INITIAL_COMPANY_HSM}
          personalCerts={INITIAL_PERSONAL_CERTS}
          onBatchSignSuccess={onBatchSignSuccessMock}
        />
      );
      expect(html).toBe('');
    });

    it('should render modal with header, statistics badges, document list, and method selector', () => {
      const totalAmount = selectedPendingDocs.reduce((sum, d) => sum + (d.amount || 0), 0);
      const totalPages = selectedPendingDocs.reduce((sum, d) => sum + (d.totalPages || 1), 0);

      const html = renderToString(
        <BatchSigningModal
          isOpen={true}
          onClose={onCloseMock}
          selectedDocs={selectedPendingDocs}
          companyHsm={INITIAL_COMPANY_HSM}
          personalCerts={INITIAL_PERSONAL_CERTS}
          onBatchSignSuccess={onBatchSignSuccessMock}
        />
      );

      // Header
      expect(html).toContain('Ký Số Hàng Loạt Văn Bản &amp; Chứng Từ');
      expect(html).toContain('Batch Execution');

      // Statistics Badges
      expect(html).toContain(`${selectedPendingDocs.length}`);
      expect(html).toContain(`${totalPages}`);

      // Document list items
      expect(html).toContain(selectedPendingDocs[0].docCode);
      expect(html).toContain(selectedPendingDocs[1].docCode);

      // Method selector
      expect(html).toContain(`Cloud HSM Doanh nghiệp (${INITIAL_COMPANY_HSM.provider})`);
      expect(html).toContain('Chứng thư số Cá nhân SmartCA');

      // PIN input & submit button
      expect(html).toContain('Mã PIN bí mật ký số (6 chữ số):');
      expect(html).toContain(`Bắt Đầu Ký Hàng Loạt (${selectedPendingDocs.length} văn bản)`);
    });

    it('should allow switching to SmartCA Personal Certificate and selecting signer', async () => {
      await act(async () => {
        root?.render(
          <BatchSigningModal
            isOpen={true}
            onClose={onCloseMock}
            selectedDocs={selectedPendingDocs}
            companyHsm={INITIAL_COMPANY_HSM}
            personalCerts={INITIAL_PERSONAL_CERTS}
            onBatchSignSuccess={onBatchSignSuccessMock}
          />
        );
      });

      const radioPersonal = container?.querySelector(
        'input[type="radio"][value="personal_cert"]'
      ) as HTMLInputElement;
      expect(radioPersonal).not.toBeNull();

      await act(async () => {
        radioPersonal.click();
      });

      // Verify certificate selector dropdown appears
      const selectCert = container?.querySelector('select') as HTMLSelectElement;
      expect(selectCert).not.toBeNull();
      expect(selectCert.options.length).toBe(INITIAL_PERSONAL_CERTS.length);

      // Select second certificate
      await act(async () => {
        const optionVal = INITIAL_PERSONAL_CERTS[1].id;
        selectCert.value = optionVal;
        selectCert.dispatchEvent(new Event('change', { bubbles: true }));
      });

      expect(selectCert.value).toBe(INITIAL_PERSONAL_CERTS[1].id);
    });

    it('should validate PIN code and display error message when invalid', async () => {
      await act(async () => {
        root?.render(
          <BatchSigningModal
            isOpen={true}
            onClose={onCloseMock}
            selectedDocs={selectedPendingDocs}
            companyHsm={INITIAL_COMPANY_HSM}
            personalCerts={INITIAL_PERSONAL_CERTS}
            onBatchSignSuccess={onBatchSignSuccessMock}
          />
        );
      });

      // Clear PIN input
      const pinInput = container?.querySelector('#batch-pin-input') as HTMLInputElement;
      expect(pinInput).not.toBeNull();

      await act(async () => {
        setInputValue(pinInput, '');
      });

      // Click "Bắt Đầu Ký Hàng Loạt"
      const allButtons = Array.from(container?.querySelectorAll('button') || []);
      const startBtn = allButtons.find(b => b.textContent?.includes('Bắt Đầu Ký Hàng Loạt'));
      expect(startBtn).toBeDefined();

      await act(async () => {
        startBtn?.click();
      });

      expect(container?.textContent).toContain('Vui lòng nhập mã PIN bảo mật hợp lệ');
      expect(onBatchSignSuccessMock).not.toHaveBeenCalled();
    });

    it('should execute batch signing simulation, display progress, and invoke onBatchSignSuccess', async () => {
      vi.useFakeTimers();

      await act(async () => {
        root?.render(
          <BatchSigningModal
            isOpen={true}
            onClose={onCloseMock}
            selectedDocs={selectedPendingDocs}
            companyHsm={INITIAL_COMPANY_HSM}
            personalCerts={INITIAL_PERSONAL_CERTS}
            onBatchSignSuccess={onBatchSignSuccessMock}
          />
        );
      });

      // Find Start button
      const allButtons = Array.from(container?.querySelectorAll('button') || []);
      const startBtn = allButtons.find(b => b.textContent?.includes('Bắt Đầu Ký Hàng Loạt'));
      expect(startBtn).toBeDefined();

      await act(async () => {
        startBtn?.click();
      });

      // Check that processing has started
      expect(container?.textContent).toContain('Đang thực thi ký số hàng loạt');

      // Fast-forward the batch signing interval
      await act(async () => {
        vi.advanceTimersByTime(selectedPendingDocs.length * 100);
      });

      // Callback should have been called
      expect(onBatchSignSuccessMock).toHaveBeenCalledTimes(1);
      const [signedDocIds, payload] = onBatchSignSuccessMock.mock.calls[0];
      expect(signedDocIds).toEqual(selectedPendingDocs.map(d => d.id));
      expect(payload.signerName).toBe(INITIAL_COMPANY_HSM.companyName);
      expect(payload.certSerial).toBe(INITIAL_COMPANY_HSM.serialNumber);
      expect(payload.method).toContain('Cloud HSM');

      // Fast-forward auto close timer
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(onCloseMock).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});
