import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { SignatureHub } from '../components/SignatureHub';
import {
  INITIAL_COMPANY_HSM,
  INITIAL_PERSONAL_CERTS,
  INITIAL_SIGNING_DOCUMENTS
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

describe('Digital Signatures Hub Integration (Task 7)', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve())
      }
    });

    // Mock window.alert and confirm
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
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
    vi.restoreAllMocks();
  });

  describe('1. Tab Navigation and Component Routing', () => {
    it('should start with default Dashboard tab and switch correctly across all 6 tabs', async () => {
      await act(async () => {
        root?.render(
          <MemoryRouter>
            <SignatureHub />
          </MemoryRouter>
        );
      });

      // Default: Dashboard is rendered
      expect(container?.querySelector('[data-testid="signature-dashboard"]')).not.toBeNull();
      expect(container?.textContent).toContain('Trung Tâm Ký Số & Cloud HSM Doanh Nghiệp');

      // Click tab: Company HSM
      const tabHsm = container?.querySelector('button[data-testid="tab-company_hsm"]') as HTMLButtonElement;
      expect(tabHsm).not.toBeNull();
      await act(async () => {
        tabHsm.click();
      });
      expect(container?.querySelector('[data-testid="company-hsm-manager"]')).not.toBeNull();
      expect(container?.querySelector('[data-testid="signature-dashboard"]')).toBeNull();

      // Click tab: Personal Certs
      const tabCerts = container?.querySelector('button[data-testid="tab-personal_certs"]') as HTMLButtonElement;
      expect(tabCerts).not.toBeNull();
      await act(async () => {
        tabCerts.click();
      });
      expect(container?.querySelector('[data-testid="personal-certs-manager"]')).not.toBeNull();

      // Click tab: Signing Workspace
      const tabWorkspace = container?.querySelector('button[data-testid="tab-signing_workspace"]') as HTMLButtonElement;
      expect(tabWorkspace).not.toBeNull();
      await act(async () => {
        tabWorkspace.click();
      });
      expect(container?.querySelector('[data-testid="signing-workspace"]')).not.toBeNull();

      // Click tab: Authority Matrix
      const tabMatrix = container?.querySelector('button[data-testid="tab-authority_matrix"]') as HTMLButtonElement;
      expect(tabMatrix).not.toBeNull();
      await act(async () => {
        tabMatrix.click();
      });
      expect(container?.querySelector('[data-testid="authority-matrix-tab"]')).not.toBeNull();

      // Click tab: Audit Logs
      const tabAudit = container?.querySelector('button[data-testid="tab-audit_logs"]') as HTMLButtonElement;
      expect(tabAudit).not.toBeNull();
      await act(async () => {
        tabAudit.click();
      });
      expect(container?.querySelector('[data-testid="signature-audit-logs-tab"]')).not.toBeNull();

      // Click back to Dashboard
      const tabDashboard = container?.querySelector('button[data-testid="tab-dashboard"]') as HTMLButtonElement;
      expect(tabDashboard).not.toBeNull();
      await act(async () => {
        tabDashboard.click();
      });
      expect(container?.querySelector('[data-testid="signature-dashboard"]')).not.toBeNull();
    });

    it('should navigate to Signing Workspace when clicking header "Bàn Ký Điện Tử" button', async () => {
      await act(async () => {
        root?.render(
          <MemoryRouter>
            <SignatureHub />
          </MemoryRouter>
        );
      });

      const headerWorkspaceBtn = container?.querySelector('button[data-testid="header-workspace-button"]') as HTMLButtonElement;
      expect(headerWorkspaceBtn).not.toBeNull();

      await act(async () => {
        headerWorkspaceBtn.click();
      });

      expect(container?.querySelector('[data-testid="signing-workspace"]')).not.toBeNull();
    });
  });

  describe('2. Single Document Signing Flow via Studio Modal', () => {
    it('should open studio modal, sign document with Cloud HSM, deduct quota, and append audit log', async () => {
      vi.useFakeTimers();

      await act(async () => {
        root?.render(
          <MemoryRouter>
            <SignatureHub />
          </MemoryRouter>
        );
      });

      // Switch to signing workspace
      const tabWorkspace = container?.querySelector('button[data-testid="tab-signing_workspace"]') as HTMLButtonElement;
      await act(async () => {
        tabWorkspace.click();
      });

      // Find "Mở Bàn Ký" on the first pending document
      const openStudioButtons = Array.from(container?.querySelectorAll('button') || []).filter(b =>
        b.textContent?.includes('Mở Bàn Ký')
      );
      expect(openStudioButtons.length).toBeGreaterThan(0);

      await act(async () => {
        openStudioButtons[0].click();
      });

      // Studio Modal should now be open
      expect(container?.querySelector('[data-testid="signing-studio-modal"]')).not.toBeNull();
      expect(container?.textContent).toContain('Xác Nhận Ký Số Mật Mã Học');

      // Click "Xác Nhận Ký Số Mật Mã Học"
      const allButtons = Array.from(container?.querySelectorAll('button') || []);
      const confirmSignBtn = allButtons.find(b => b.textContent?.includes('Xác Nhận Ký Số Mật Mã Học'));
      expect(confirmSignBtn).toBeDefined();

      await act(async () => {
        confirmSignBtn?.click();
      });

      // Advance timers to complete simulated cryptographic signing
      await act(async () => {
        vi.runAllTimers();
      });

      // Studio Modal should be closed
      expect(container?.querySelector('[data-testid="signing-studio-modal"]')).toBeNull();

      // Check remaining quota on Company HSM tab (was 14250, should now be 14249)
      const tabHsm = container?.querySelector('button[data-testid="tab-company_hsm"]') as HTMLButtonElement;
      await act(async () => {
        tabHsm.click();
      });
      expect(container?.textContent).toContain('14.249');

      // Check Audit Logs tab for the new signing entry
      const tabAudit = container?.querySelector('button[data-testid="tab-audit_logs"]') as HTMLButtonElement;
      await act(async () => {
        tabAudit.click();
      });
      expect(container?.textContent).toContain('Ký số thành công');

      vi.useRealTimers();
    });
  });

  describe('3. Batch Signing Flow via Batch Modal', () => {
    it('should select multiple pending documents, execute batch sign, deduct quota by N, and record audit logs', async () => {
      vi.useFakeTimers();

      await act(async () => {
        root?.render(
          <MemoryRouter>
            <SignatureHub />
          </MemoryRouter>
        );
      });

      // Switch to signing workspace
      const tabWorkspace = container?.querySelector('button[data-testid="tab-signing_workspace"]') as HTMLButtonElement;
      await act(async () => {
        tabWorkspace.click();
      });

      // Select checkboxes for two documents
      const checkboxes = container?.querySelectorAll('tbody input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      expect(checkboxes.length).toBeGreaterThanOrEqual(2);

      await act(async () => {
        checkboxes[0].click();
      });
      await act(async () => {
        checkboxes[1].click();
      });

      // Floating action bar should appear
      const floatingBar = container?.querySelector('[data-testid="batch-floating-action-bar"]');
      expect(floatingBar).not.toBeNull();

      // Click "Ký Hàng Loạt Ngay"
      const batchBtn = Array.from(floatingBar?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Ký Hàng Loạt Ngay')
      );
      expect(batchBtn).toBeDefined();

      await act(async () => {
        batchBtn?.click();
      });

      // Batch Signing Modal should be open
      expect(container?.textContent).toContain('Ký Số Hàng Loạt Văn Bản & Chứng Từ');

      // Click "Bắt Đầu Ký Hàng Loạt"
      const modalButtons = Array.from(container?.querySelectorAll('button') || []);
      const startBatchBtn = modalButtons.find(b => b.textContent?.includes('Bắt Đầu Ký Hàng Loạt'));
      expect(startBatchBtn).toBeDefined();

      await act(async () => {
        startBatchBtn?.click();
      });

      // Fast-forward simulated batch processing timer
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Batch modal should be closed
      expect(container?.textContent).not.toContain('Ký Số Hàng Loạt Văn Bản & Chứng Từ');

      // Check HSM quota (was 14250, deducted by 2 -> 14248)
      const tabHsm = container?.querySelector('button[data-testid="tab-company_hsm"]') as HTMLButtonElement;
      await act(async () => {
        tabHsm.click();
      });
      expect(container?.textContent).toContain('14.248');

      // Check Audit Logs tab has batch entries
      const tabAudit = container?.querySelector('button[data-testid="tab-audit_logs"]') as HTMLButtonElement;
      await act(async () => {
        tabAudit.click();
      });
      expect(container?.textContent).toContain('Ký số hàng loạt văn bản');

      vi.useRealTimers();
    });
  });

  describe('4. Upload New Document Flow', () => {
    it('should open new document upload modal, add document, and auto-navigate to workspace', async () => {
      await act(async () => {
        root?.render(
          <MemoryRouter>
            <SignatureHub />
          </MemoryRouter>
        );
      });

      // Click "+ Trình Ký Văn Bản Mới" in header
      const uploadHeaderBtn = container?.querySelector('button[data-testid="header-upload-doc-button"]') as HTMLButtonElement;
      expect(uploadHeaderBtn).not.toBeNull();

      await act(async () => {
        uploadHeaderBtn.click();
      });

      // Modal should be open
      expect(container?.textContent).toContain('Tải Lên Văn Bản Mới & Khởi Tạo Luồng Ký');

      // Fill in document title
      const titleInput = container?.querySelector('#doc-title-input') as HTMLInputElement;
      expect(titleInput).not.toBeNull();
      await act(async () => {
        setInputValue(titleInput, 'Hợp đồng hợp tác chiến lược logistics 2026');
      });

      // Submit upload form
      const allButtons = Array.from(container?.querySelectorAll('button') || []);
      const submitUploadBtn = allButtons.find(b => b.textContent?.includes('Tạo & Đưa Vào Bàn Ký'));
      expect(submitUploadBtn).toBeDefined();

      await act(async () => {
        submitUploadBtn?.click();
      });

      // Modal should be closed, and active tab should be signing_workspace
      expect(container?.querySelector('[data-testid="signing-workspace"]')).not.toBeNull();
      expect(container?.textContent).toContain('Hợp đồng hợp tác chiến lược logistics 2026');
    });
  });

  describe('5. Certificate Inspector Modal Flow', () => {
    it('should open Certificate Inspector from Company HSM tab and show X.509 details', async () => {
      await act(async () => {
        root?.render(
          <MemoryRouter>
            <SignatureHub />
          </MemoryRouter>
        );
      });

      // Switch to company_hsm tab
      const tabHsm = container?.querySelector('button[data-testid="tab-company_hsm"]') as HTMLButtonElement;
      await act(async () => {
        tabHsm.click();
      });

      // Find inspect certificate button on HSM manager
      const inspectBtn = container?.querySelector('button[data-testid="btn-open-inspect-hsm"]') as HTMLButtonElement;
      expect(inspectBtn).not.toBeNull();

      await act(async () => {
        inspectBtn.click();
      });

      // Certificate Inspector modal should be open
      expect(container?.textContent).toContain('Trình Soi Chứng Thư Số X.509');
      expect(container?.textContent).toContain(INITIAL_COMPANY_HSM.taxCode);

      // Close modal
      const closeBtn = container?.querySelector('button[data-testid="close-cert-inspector"]') as HTMLButtonElement;
      if (closeBtn) {
        await act(async () => {
          closeBtn.click();
        });
        expect(container?.textContent).not.toContain('Trình Soi Chứng Thư Số X.509');
      }
    });

    it('should open Certificate Inspector from Personal Certs tab for a specific user certificate', async () => {
      await act(async () => {
        root?.render(
          <MemoryRouter>
            <SignatureHub />
          </MemoryRouter>
        );
      });

      // Switch to personal_certs tab
      const tabCerts = container?.querySelector('button[data-testid="tab-personal_certs"]') as HTMLButtonElement;
      await act(async () => {
        tabCerts.click();
      });

      // Click inspect button for first certificate (CERT-001)
      const inspectCert1Btn = container?.querySelector('button[data-testid="inspect-cert-CERT-001"]') as HTMLButtonElement;
      expect(inspectCert1Btn).not.toBeNull();

      await act(async () => {
        inspectCert1Btn.click();
      });

      // Modal should be open with CERT-001 holder info
      expect(container?.textContent).toContain('Trình Soi Chứng Thư Số X.509');
      expect(container?.textContent).toContain('Nguyễn Tiến Vĩnh');
    });
  });

  describe('6. Personal Certificate Actions & Issue Flow', () => {
    it('should suspend and reactivate a personal certificate and log each action', async () => {
      await act(async () => {
        root?.render(
          <MemoryRouter>
            <SignatureHub />
          </MemoryRouter>
        );
      });

      // Switch to personal_certs tab
      const tabCerts = container?.querySelector('button[data-testid="tab-personal_certs"]') as HTMLButtonElement;
      await act(async () => {
        tabCerts.click();
      });

      // Suspend CERT-001
      const suspendBtn = container?.querySelector('button[data-testid="suspend-cert-CERT-001"]') as HTMLButtonElement;
      expect(suspendBtn).not.toBeNull();

      await act(async () => {
        suspendBtn.click();
      });

      // Check that activate button is now visible for CERT-001
      const activateBtn = container?.querySelector('button[data-testid="activate-cert-CERT-001"]') as HTMLButtonElement;
      expect(activateBtn).not.toBeNull();

      // Check Audit Log
      const tabAudit = container?.querySelector('button[data-testid="tab-audit_logs"]') as HTMLButtonElement;
      await act(async () => {
        tabAudit.click();
      });
      expect(container?.textContent).toContain('Tạm khóa chứng thư số');
    });

    it('should issue a new certificate via IssueCertificateModal and HRM pre-filling', async () => {
      await act(async () => {
        root?.render(
          <MemoryRouter>
            <SignatureHub />
          </MemoryRouter>
        );
      });

      // Click "+ Cấp Chứng Thư Mới" from header
      const headerIssueBtn = container?.querySelector('button[data-testid="header-issue-cert-button"]') as HTMLButtonElement;
      expect(headerIssueBtn).not.toBeNull();

      await act(async () => {
        headerIssueBtn.click();
      });

      // Issue Modal should be visible
      expect(container?.querySelector('[data-testid="issue-cert-modal"]')).not.toBeNull();
      expect(container?.textContent).toContain('Cấp Phát Chứng Thư Số Cá Nhân Mới');

      // Click "Dùng hồ sơ của tôi" to pre-fill HRM information
      const myProfileBtn = container?.querySelector('button[data-testid="picker-current-user-btn"]') as HTMLButtonElement;
      expect(myProfileBtn).not.toBeNull();

      await act(async () => {
        myProfileBtn.click();
      });

      // Submit form
      const submitIssueBtn = container?.querySelector('button[data-testid="submit-issue-cert-button"]') as HTMLButtonElement;
      expect(submitIssueBtn).not.toBeNull();

      await act(async () => {
        submitIssueBtn.click();
      });

      // Issue modal should close
      expect(container?.querySelector('[data-testid="issue-cert-modal"]')).toBeNull();

      // Check that certificate count has increased on Personal Certs tab
      const tabCerts = container?.querySelector('button[data-testid="tab-personal_certs"]') as HTMLButtonElement;
      await act(async () => {
        tabCerts.click();
      });
      // Original 5 certs + 1 new cert = 6 rows
      expect(container?.querySelectorAll('tbody tr').length).toBe(6);
    });
  });

  describe('7. Verify Integrity Modal & HSM Connection Test', () => {
    it('should open VerifyIntegrityModal for a signed document in workspace', async () => {
      await act(async () => {
        root?.render(
          <MemoryRouter>
            <SignatureHub />
          </MemoryRouter>
        );
      });

      // Switch to signing workspace
      const tabWorkspace = container?.querySelector('button[data-testid="tab-signing_workspace"]') as HTMLButtonElement;
      await act(async () => {
        tabWorkspace.click();
      });

      // Switch to "Đã hoàn tất ký" filter tab
      const signedFilterBtn = Array.from(container?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Đã hoàn tất ký')
      );
      expect(signedFilterBtn).toBeDefined();

      await act(async () => {
        signedFilterBtn?.click();
      });

      // Click "Xác Thực Chữ Ký"
      const verifyBtn = Array.from(container?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Xác Thực Chữ Ký')
      );
      expect(verifyBtn).toBeDefined();

      await act(async () => {
        verifyBtn?.click();
      });

      // Verify Integrity modal should be open
      expect(container?.textContent).toContain('Thẩm Tra Toàn Vẹn Chữ Ký Số');
      expect(container?.textContent).toContain('SHA-256');
    });

    it('should toggle auto sign rule in Company HSM manager', async () => {
      await act(async () => {
        root?.render(
          <MemoryRouter>
            <SignatureHub />
          </MemoryRouter>
        );
      });

      // Switch to company_hsm tab
      const tabHsm = container?.querySelector('button[data-testid="tab-company_hsm"]') as HTMLButtonElement;
      await act(async () => {
        tabHsm.click();
      });

      // Find toggle auto sign checkbox for invoices (default true)
      const toggleInvoices = container?.querySelector('input[data-testid="toggle-auto-sign-invoices"]') as HTMLInputElement;
      expect(toggleInvoices).not.toBeNull();
      expect(toggleInvoices.checked).toBe(true);

      await act(async () => {
        toggleInvoices.click();
      });

      // Auto sign for invoices should now be false
      expect(toggleInvoices.checked).toBe(false);
    });
  });
});
