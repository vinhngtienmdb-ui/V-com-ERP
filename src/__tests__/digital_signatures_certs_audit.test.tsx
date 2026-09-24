import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { PersonalCertsManager } from '../components/signature/PersonalCertsManager';
import { AuthorityMatrixTab } from '../components/signature/AuthorityMatrixTab';
import { SignatureAuditLogsTab } from '../components/signature/SignatureAuditLogsTab';
import {
  INITIAL_PERSONAL_CERTS,
  INITIAL_AUTHORITY_RULES,
  INITIAL_HSM_LOGS,
  PersonalCertificate,
  SigningAuthorityRule,
  HSMAuditLog
} from '../data/hsmSignatureData';
import { formatCurrency } from '../lib/utils';

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

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value'
  )?.set;
  nativeSetter?.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('Personal Certs Manager, Authority Matrix & Signature Audit Logs (Task 6)', () => {
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

  // =========================================================================
  // 1. PersonalCertsManager Component Tests
  // =========================================================================
  describe('PersonalCertsManager Component', () => {
    const onCertActionMock = vi.fn();
    const onOpenIssueModalMock = vi.fn();
    const onInspectCertMock = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render header, action bar, and stat cards correctly via SSR/renderToString', () => {
      const html = renderToString(
        <PersonalCertsManager
          certs={INITIAL_PERSONAL_CERTS}
          onCertAction={onCertActionMock}
          onOpenIssueModal={onOpenIssueModalMock}
          onInspectCert={onInspectCertMock}
        />
      );

      // Verify Stat Cards
      expect(html).toContain('Tổng Chứng Thư');
      expect(html).toContain('Đang Hoạt Động');
      expect(html).toContain('Tạm Khóa (Suspended)');
      expect(html).toContain('Đã Thu Hồi (Revoked)');

      // Verify Table Columns
      expect(html).toContain('Cán bộ Nhân sự');
      expect(html).toContain('Phòng ban &amp; Chức danh');
      expect(html).toContain('Serial Chứng thư');
      expect(html).toContain('Thuật toán');
      expect(html).toContain('Hạn mức Ký (VND)');
      expect(html).toContain('Thời hạn Hiệu lực');
      expect(html).toContain('Trạng thái');
      expect(html).toContain('Thao tác');

      // Verify initial staff members rendered
      expect(html).toContain('Nguyễn Tiến Vĩnh');
      expect(html).toContain('Trần Thị Mai');
      expect(html).toContain('Lê Thu Quỳnh');
      expect(html).toContain('Phạm Minh Hoàng');
      expect(html).toContain('Nguyễn Thị Kim Anh');

      // Verify "Không giới hạn" limit for CEO
      expect(html).toContain('Không giới hạn');
      // Verify formatted currency for accountant (500M)
      expect(html).toContain(formatCurrency(500000000));
    });

    it('should filter certificates by status (active, suspended, revoked, all)', async () => {
      await act(async () => {
        root?.render(
          <PersonalCertsManager
            certs={INITIAL_PERSONAL_CERTS}
            onCertAction={onCertActionMock}
            onOpenIssueModal={onOpenIssueModalMock}
            onInspectCert={onInspectCertMock}
          />
        );
      });

      // Default: all 5 certs are visible
      expect(container?.querySelectorAll('tbody tr').length).toBe(5);

      // Click "Tạm khóa" filter button
      const suspendedBtn = Array.from(container?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Tạm khóa')
      );
      expect(suspendedBtn).toBeTruthy();

      await act(async () => {
        suspendedBtn?.click();
      });

      // Only Nguyễn Thị Kim Anh is suspended
      const rowsSuspended = container?.querySelectorAll('tbody tr');
      expect(rowsSuspended?.length).toBe(1);
      expect(container?.textContent).toContain('Nguyễn Thị Kim Anh');
      expect(container?.textContent).not.toContain('Nguyễn Tiến Vĩnh');

      // Click "Đang hoạt động" filter button
      const activeBtn = Array.from(container?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Đang hoạt động')
      );
      expect(activeBtn).toBeTruthy();

      await act(async () => {
        activeBtn?.click();
      });

      // 4 active certs
      const rowsActive = container?.querySelectorAll('tbody tr');
      expect(rowsActive?.length).toBe(4);
      expect(container?.textContent).toContain('Nguyễn Tiến Vĩnh');
      expect(container?.textContent).toContain('Trần Thị Mai');
      expect(container?.textContent).not.toContain('Nguyễn Thị Kim Anh');

      // Click "Tất cả" to reset
      const allBtn = Array.from(container?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Tất cả')
      );
      await act(async () => {
        allBtn?.click();
      });
      expect(container?.querySelectorAll('tbody tr').length).toBe(5);
    });

    it('should filter certificates by search query (name, email, staffCode, serial, department)', async () => {
      await act(async () => {
        root?.render(
          <PersonalCertsManager
            certs={INITIAL_PERSONAL_CERTS}
            onCertAction={onCertActionMock}
            onOpenIssueModal={onOpenIssueModalMock}
            onInspectCert={onInspectCertMock}
          />
        );
      });

      const searchInput = container?.querySelector('input[data-testid="cert-search-input"]') as HTMLInputElement;
      expect(searchInput).toBeTruthy();

      // Search by Name: "Mai"
      await act(async () => {
        setInputValue(searchInput, 'Mai');
      });
      expect(container?.textContent).toContain('Trần Thị Mai');
      expect(container?.textContent).not.toContain('Nguyễn Tiến Vĩnh');

      // Search by Staff Code: "EMP-0004"
      await act(async () => {
        setInputValue(searchInput, 'EMP-0004');
      });
      expect(container?.textContent).toContain('Phạm Minh Hoàng');
      expect(container?.textContent).not.toContain('Trần Thị Mai');

      // Search by Serial Number substring: "8B:42:11"
      await act(async () => {
        setInputValue(searchInput, '8B:42:11');
      });
      expect(container?.textContent).toContain('Trần Thị Mai');

      // Search by Department: "Nhân sự"
      await act(async () => {
        setInputValue(searchInput, 'Nhân sự');
      });
      expect(container?.textContent).toContain('Lê Thu Quỳnh');

      // Non-matching search query displays empty state
      await act(async () => {
        setInputValue(searchInput, 'XYZNonExistentKeyword');
      });
      expect(container?.textContent).toContain('Không tìm thấy chứng thư số nào phù hợp');
    });

    it('should trigger onOpenIssueModal when clicking "+ Cấp Chứng Thư Mới"', async () => {
      await act(async () => {
        root?.render(
          <PersonalCertsManager
            certs={INITIAL_PERSONAL_CERTS}
            onCertAction={onCertActionMock}
            onOpenIssueModal={onOpenIssueModalMock}
            onInspectCert={onInspectCertMock}
          />
        );
      });

      const openIssueBtn = container?.querySelector('button[data-testid="open-issue-cert-button"]') as HTMLButtonElement;
      expect(openIssueBtn).toBeTruthy();

      await act(async () => {
        openIssueBtn.click();
      });

      expect(onOpenIssueModalMock).toHaveBeenCalledTimes(1);
    });

    it('should trigger onInspectCert when clicking inspect icon button', async () => {
      await act(async () => {
        root?.render(
          <PersonalCertsManager
            certs={INITIAL_PERSONAL_CERTS}
            onCertAction={onCertActionMock}
            onOpenIssueModal={onOpenIssueModalMock}
            onInspectCert={onInspectCertMock}
          />
        );
      });

      const inspectBtn = container?.querySelector('button[data-testid="inspect-cert-CERT-001"]') as HTMLButtonElement;
      expect(inspectBtn).toBeTruthy();

      await act(async () => {
        inspectBtn.click();
      });

      expect(onInspectCertMock).toHaveBeenCalledTimes(1);
      expect(onInspectCertMock).toHaveBeenCalledWith(INITIAL_PERSONAL_CERTS[0]);
    });

    it('should trigger onCertAction with "suspend" when clicking Lock button on active cert', async () => {
      await act(async () => {
        root?.render(
          <PersonalCertsManager
            certs={INITIAL_PERSONAL_CERTS}
            onCertAction={onCertActionMock}
            onOpenIssueModal={onOpenIssueModalMock}
            onInspectCert={onInspectCertMock}
          />
        );
      });

      const suspendBtn = container?.querySelector('button[data-testid="suspend-cert-CERT-001"]') as HTMLButtonElement;
      expect(suspendBtn).toBeTruthy();

      await act(async () => {
        suspendBtn.click();
      });

      expect(onCertActionMock).toHaveBeenCalledTimes(1);
      expect(onCertActionMock).toHaveBeenCalledWith('CERT-001', 'suspend');
    });

    it('should trigger onCertAction with "activate" when clicking CheckCircle2 button on suspended cert', async () => {
      await act(async () => {
        root?.render(
          <PersonalCertsManager
            certs={INITIAL_PERSONAL_CERTS}
            onCertAction={onCertActionMock}
            onOpenIssueModal={onOpenIssueModalMock}
            onInspectCert={onInspectCertMock}
          />
        );
      });

      // CERT-005 is suspended in INITIAL_PERSONAL_CERTS
      const activateBtn = container?.querySelector('button[data-testid="activate-cert-CERT-005"]') as HTMLButtonElement;
      expect(activateBtn).toBeTruthy();

      await act(async () => {
        activateBtn.click();
      });

      expect(onCertActionMock).toHaveBeenCalledTimes(1);
      expect(onCertActionMock).toHaveBeenCalledWith('CERT-005', 'activate');
    });

    it('should trigger onCertAction with "revoke" after confirmation dialog', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      await act(async () => {
        root?.render(
          <PersonalCertsManager
            certs={INITIAL_PERSONAL_CERTS}
            onCertAction={onCertActionMock}
            onOpenIssueModal={onOpenIssueModalMock}
            onInspectCert={onInspectCertMock}
          />
        );
      });

      const revokeBtn = container?.querySelector('button[data-testid="revoke-cert-CERT-002"]') as HTMLButtonElement;
      expect(revokeBtn).toBeTruthy();

      await act(async () => {
        revokeBtn.click();
      });

      expect(confirmSpy).toHaveBeenCalled();
      expect(onCertActionMock).toHaveBeenCalledTimes(1);
      expect(onCertActionMock).toHaveBeenCalledWith('CERT-002', 'revoke');

      // When user cancels confirm dialog, onCertAction should NOT be called
      confirmSpy.mockReturnValue(false);
      onCertActionMock.mockClear();

      await act(async () => {
        revokeBtn.click();
      });

      expect(onCertActionMock).not.toHaveBeenCalled();
    });

    it('should trigger onCertAction with "renew" when clicking Renew button', async () => {
      await act(async () => {
        root?.render(
          <PersonalCertsManager
            certs={INITIAL_PERSONAL_CERTS}
            onCertAction={onCertActionMock}
            onOpenIssueModal={onOpenIssueModalMock}
            onInspectCert={onInspectCertMock}
          />
        );
      });

      const renewBtn = container?.querySelector('button[data-testid="renew-cert-CERT-001"]') as HTMLButtonElement;
      expect(renewBtn).toBeTruthy();

      await act(async () => {
        renewBtn.click();
      });

      expect(onCertActionMock).toHaveBeenCalledTimes(1);
      expect(onCertActionMock).toHaveBeenCalledWith('CERT-001', 'renew');
    });

    it('should copy serial to clipboard when clicking copy serial button', async () => {
      await act(async () => {
        root?.render(
          <PersonalCertsManager
            certs={INITIAL_PERSONAL_CERTS}
            onCertAction={onCertActionMock}
            onOpenIssueModal={onOpenIssueModalMock}
            onInspectCert={onInspectCertMock}
          />
        );
      });

      const copyBtn = container?.querySelector('button[data-testid="copy-serial-CERT-001"]') as HTMLButtonElement;
      expect(copyBtn).toBeTruthy();

      await act(async () => {
        copyBtn.click();
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(INITIAL_PERSONAL_CERTS[0].serialNumber);
      expect(container?.textContent).toContain('Đã chép');
    });
  });

  // =========================================================================
  // 2. AuthorityMatrixTab Component Tests
  // =========================================================================
  describe('AuthorityMatrixTab Component', () => {
    const onSaveMatrixMock = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render authority matrix header, legal bases, and multi-tier workflow banner via SSR', () => {
      const html = renderToString(
        <AuthorityMatrixTab
          rules={INITIAL_AUTHORITY_RULES}
          onSaveMatrix={onSaveMatrixMock}
        />
      );

      // Header and Legal bases
      expect(html).toContain('Quy Định &amp; Ma Trận Thẩm Quyền Ký Số Doanh Nghiệp');
      expect(html).toContain('Luật Giao dịch Điện tử số 20/2023/QH15');
      expect(html).toContain('Nghị định 130/2018/NĐ-CP');
      expect(html).toContain('Quy Trình Leo Thang Thẩm Quyền Phê Duyệt');

      // Rules content
      expect(html).toContain('Tổng Giám đốc (CEO)');
      expect(html).toContain('Kế toán trưởng');
      expect(html).toContain('Trưởng phòng Nhân sự');
      expect(html).toContain('Quản lý Kho Tổng');

      // Limits and signatures
      expect(html).toContain('Không giới hạn');
      expect(html).toContain(formatCurrency(500000000));
      expect(html).toContain('Ký số HSM Doanh nghiệp');
      expect(html).toContain('Ký số Cá nhân');
    });

    it('should render all authority tiers when no rules prop is passed', () => {
      const html = renderToString(<AuthorityMatrixTab />);

      expect(html).toContain('Văn thư Công ty / Bộ phận Phát hành Văn bản');
      expect(html).toContain('Tổng Giám đốc (CEO) / Ban Giám Đốc');
      expect(html).toContain('Giám đốc Tài chính / Kế toán trưởng');
      expect(html).toContain('Trưởng phòng Kinh doanh &amp; Mua hàng');
      expect(html).toContain('Trưởng kho &amp; Điều phối Vận tải');
      expect(html).toContain('Chuyên viên &amp; Nhân viên Nghiệp vụ');
      expect(html).toContain('Ký nháy');
    });

    it('should call onSaveMatrix and show success alert when clicking "Cập Nhật Ma Trận"', async () => {
      await act(async () => {
        root?.render(
          <AuthorityMatrixTab
            rules={INITIAL_AUTHORITY_RULES}
            onSaveMatrix={onSaveMatrixMock}
          />
        );
      });

      const saveBtn = container?.querySelector('button[data-testid="save-matrix-button"]') as HTMLButtonElement;
      expect(saveBtn).toBeTruthy();

      await act(async () => {
        saveBtn.click();
      });

      expect(onSaveMatrixMock).toHaveBeenCalledTimes(1);
      expect(container?.querySelector('[data-testid="matrix-save-success-alert"]')).toBeTruthy();
      expect(container?.textContent).toContain('Cập nhật ma trận thẩm quyền thành công!');
    });

    it('should allow adding a new authority rule via modal and sync with parent', async () => {
      const onUpdateRulesMock = vi.fn();
      await act(async () => {
        root?.render(
          <AuthorityMatrixTab
            rules={INITIAL_AUTHORITY_RULES}
            onSaveMatrix={onSaveMatrixMock}
            onUpdateRules={onUpdateRulesMock}
          />
        );
      });

      // 1. Click Add Rule button
      const addBtn = container?.querySelector('button[data-testid="btn-add-authority-rule"]') as HTMLButtonElement;
      expect(addBtn).toBeTruthy();

      await act(async () => {
        addBtn.click();
      });

      // Modal should be open
      const modal = container?.querySelector('[data-testid="authority-rule-modal"]');
      expect(modal).toBeTruthy();

      // 2. Fill form inputs
      const roleInput = container?.querySelector('input[data-testid="input-rule-role"]') as HTMLInputElement;
      const deptInput = container?.querySelector('input[data-testid="input-rule-dept"]') as HTMLInputElement;
      const limitInput = container?.querySelector('input[data-testid="input-rule-limit"]') as HTMLInputElement;
      const descInput = container?.querySelector('textarea[data-testid="textarea-rule-desc"]') as HTMLTextAreaElement;

      expect(roleInput).toBeTruthy();
      expect(deptInput).toBeTruthy();

      await act(async () => {
        setInputValue(roleInput, 'Phó Tổng Giám Đốc (COO)');
        setInputValue(deptInput, 'Khối Vận Hành');
        setInputValue(limitInput, '350000000');
        setTextareaValue(descInput, 'Phê duyệt chi phí vận hành kho bãi và logistics.');
      });

      // 3. Submit form
      const saveModalBtn = container?.querySelector('button[data-testid="btn-save-rule-modal"]') as HTMLButtonElement;
      expect(saveModalBtn).toBeTruthy();

      await act(async () => {
        saveModalBtn.click();
      });

      // Modal should close
      expect(container?.querySelector('[data-testid="authority-rule-modal"]')).toBeNull();

      // New rule should be displayed
      expect(container?.textContent).toContain('Phó Tổng Giám Đốc (COO)');
      expect(container?.textContent).toContain('Khối Vận Hành');
      expect(container?.textContent).toContain(formatCurrency(350000000));

      // Callbacks invoked with original + 1 items
      expect(onUpdateRulesMock).toHaveBeenCalledTimes(1);
      expect(onUpdateRulesMock.mock.calls[0][0].length).toBe(INITIAL_AUTHORITY_RULES.length + 1);
      expect(onSaveMatrixMock).toHaveBeenCalledTimes(1);
    });

    it('should allow editing an existing authority rule', async () => {
      const onUpdateRulesMock = vi.fn();
      await act(async () => {
        root?.render(
          <AuthorityMatrixTab
            rules={INITIAL_AUTHORITY_RULES}
            onSaveMatrix={onSaveMatrixMock}
            onUpdateRules={onUpdateRulesMock}
          />
        );
      });

      // Click Edit on Rule 2 (Kế toán trưởng)
      const editBtn = container?.querySelector('button[data-testid="btn-edit-rule-2"]') as HTMLButtonElement;
      expect(editBtn).toBeTruthy();

      await act(async () => {
        editBtn.click();
      });

      // Modal should open pre-filled with "Kế toán trưởng"
      const roleInput = container?.querySelector('input[data-testid="input-rule-role"]') as HTMLInputElement;
      expect(roleInput?.value).toBe('Kế toán trưởng');

      const limitInput = container?.querySelector('input[data-testid="input-rule-limit"]') as HTMLInputElement;
      expect(limitInput?.value).toBe('500000000');

      // Update limit to 750,000,000 VND
      await act(async () => {
        setInputValue(limitInput, '750000000');
      });

      // Save
      const saveModalBtn = container?.querySelector('button[data-testid="btn-save-rule-modal"]') as HTMLButtonElement;
      await act(async () => {
        saveModalBtn.click();
      });

      // Verify updated limit in UI
      expect(container?.textContent).toContain(formatCurrency(750000000));
      expect(onUpdateRulesMock).toHaveBeenCalled();
      expect(onSaveMatrixMock).toHaveBeenCalled();
    });

    it('should allow deleting an authority rule with confirmation', async () => {
      const onUpdateRulesMock = vi.fn();
      await act(async () => {
        root?.render(
          <AuthorityMatrixTab
            rules={INITIAL_AUTHORITY_RULES}
            onSaveMatrix={onSaveMatrixMock}
            onUpdateRules={onUpdateRulesMock}
          />
        );
      });

      // Initially INITIAL_AUTHORITY_RULES.length rules
      expect(container?.querySelectorAll('[data-testid^="authority-rule-card-"]').length).toBe(INITIAL_AUTHORITY_RULES.length);

      // Click Delete on Rule 4 (Quản lý Kho Tổng)
      const deleteBtn = container?.querySelector('button[data-testid="btn-delete-rule-4"]') as HTMLButtonElement;
      expect(deleteBtn).toBeTruthy();

      await act(async () => {
        deleteBtn.click();
      });

      // Confirmation modal should appear
      const confirmModal = container?.querySelector('[data-testid="delete-rule-confirm-modal"]');
      expect(confirmModal).toBeTruthy();
      expect(confirmModal?.textContent).toContain('Quản lý Kho Tổng');

      // Click Confirm Delete
      const confirmDeleteBtn = container?.querySelector('button[data-testid="btn-confirm-delete-rule"]') as HTMLButtonElement;
      expect(confirmDeleteBtn).toBeTruthy();

      await act(async () => {
        confirmDeleteBtn.click();
      });

      // Should now have INITIAL_AUTHORITY_RULES.length - 1 rules
      expect(container?.querySelectorAll('[data-testid^="authority-rule-card-"]').length).toBe(INITIAL_AUTHORITY_RULES.length - 1);
      const grid = container?.querySelector('[data-testid="authority-rules-grid"]');
      expect(grid?.textContent).not.toContain('Quản lý Kho Tổng');
      expect(onUpdateRulesMock).toHaveBeenCalledTimes(1);
      expect(onUpdateRulesMock.mock.calls[0][0].length).toBe(INITIAL_AUTHORITY_RULES.length - 1);
      expect(onSaveMatrixMock).toHaveBeenCalledTimes(1);
    });

    it('should filter authority rules by search query', async () => {
      await act(async () => {
        root?.render(
          <AuthorityMatrixTab rules={INITIAL_AUTHORITY_RULES} />
        );
      });

      const searchInput = container?.querySelector('input[data-testid="input-search-authority-rules"]') as HTMLInputElement;
      expect(searchInput).toBeTruthy();

      // Search by role: "Nhân sự"
      await act(async () => {
        setInputValue(searchInput, 'Nhân sự');
      });

      const grid = container?.querySelector('[data-testid="authority-rules-grid"]');
      expect(grid?.textContent).toContain('Trưởng phòng Nhân sự');
      expect(grid?.textContent).not.toContain('Quản lý Kho Tổng');
      expect(grid?.textContent).not.toContain('Kế toán trưởng');

      // Reset search
      await act(async () => {
        setInputValue(searchInput, '');
      });

      expect(grid?.textContent).toContain('Tổng Giám đốc (CEO)');
      expect(grid?.textContent).toContain('Kế toán trưởng');
    });
  });

  // =========================================================================
  // 3. SignatureAuditLogsTab Component Tests
  // =========================================================================
  describe('SignatureAuditLogsTab Component', () => {
    it('should render audit logs table with timestamps, actions, hashes, and IP addresses via SSR', () => {
      const html = renderToString(
        <SignatureAuditLogsTab logs={INITIAL_HSM_LOGS} />
      );

      // Header
      expect(html).toContain('Nhật Ký Truy Vết Ký Số &amp; Cloud HSM (Audit Trail)');
      expect(html).toContain('Nghị định 130/2018/NĐ-CP');
      expect(html).toContain('Xuất Log Audit (.CSV / Excel)');

      // Initial Log Entries
      expect(html).toContain('INV-2026-4921');
      expect(html).toContain('STAFF-CERT-0006');
      expect(html).toContain('PXK-2026-9812');
      expect(html).toContain('HDMB-2026-0039');

      // Algorithms and IPs
      expect(html).toContain('RSA-SHA256');
      expect(html).toContain('118.69.182.10');
      expect(html).toContain('Thành công');
    });

    it('should filter audit logs by event type (hsm, personal, issue, all)', async () => {
      await act(async () => {
        root?.render(<SignatureAuditLogsTab logs={INITIAL_HSM_LOGS} />);
      });

      expect(container?.querySelectorAll('tbody tr').length).toBe(INITIAL_HSM_LOGS.length);

      // Filter by Ký HSM
      const hsmBtn = Array.from(container?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Ký HSM')
      );
      expect(hsmBtn).toBeTruthy();

      await act(async () => {
        hsmBtn?.click();
      });

      expect(container?.textContent).toContain('INV-2026-4921');
      expect(container?.textContent).not.toContain('STAFF-CERT-0006');

      // Filter by Cấp phát
      const issueBtn = Array.from(container?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Cấp phát')
      );
      await act(async () => {
        issueBtn?.click();
      });

      expect(container?.textContent).toContain('STAFF-CERT-0006');
      expect(container?.textContent).not.toContain('HDMB-2026-0039');

      // Reset to Tất cả
      const allBtn = Array.from(container?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Tất cả')
      );
      await act(async () => {
        allBtn?.click();
      });
      expect(container?.querySelectorAll('tbody tr').length).toBe(INITIAL_HSM_LOGS.length);
    });

    it('should search logs by SHA-256 hash, docCode, and signer name', async () => {
      await act(async () => {
        root?.render(<SignatureAuditLogsTab logs={INITIAL_HSM_LOGS} />);
      });

      const searchInput = container?.querySelector('input[data-testid="audit-search-input"]') as HTMLInputElement;
      expect(searchInput).toBeTruthy();

      // Search by partial hash
      await act(async () => {
        setInputValue(searchInput, 'c7be8a96');
      });
      expect(container?.textContent).toContain('INV-2026-4921');
      expect(container?.textContent).not.toContain('HDMB-2026-0039');

      // Search by docCode
      await act(async () => {
        setInputValue(searchInput, 'PXK-2026-9812');
      });
      expect(container?.textContent).toContain('PXK-2026-9812');
      expect(container?.textContent).not.toContain('INV-2026-4921');

      // Search by signer name
      await act(async () => {
        setInputValue(searchInput, 'Nguyễn Tiến Vĩnh');
      });
      expect(container?.textContent).toContain('HDMB-2026-0039');

      // Non-matching query
      await act(async () => {
        setInputValue(searchInput, 'NonExistentDocCode123');
      });
      expect(container?.textContent).toContain('Không tìm thấy bản ghi nhật ký kiểm toán nào');
    });

    it('should copy SHA-256 hash to clipboard when clicking copy hash button', async () => {
      await act(async () => {
        root?.render(<SignatureAuditLogsTab logs={INITIAL_HSM_LOGS} />);
      });

      const copyBtn = container?.querySelector('button[data-testid="copy-hash-LOG-001"]') as HTMLButtonElement;
      expect(copyBtn).toBeTruthy();

      await act(async () => {
        copyBtn.click();
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(INITIAL_HSM_LOGS[0].hashSHA256);
      expect(container?.textContent).toContain('Đã chép');
    });

    it('should trigger CSV export when clicking "Xuất Log Audit (.CSV / Excel)"', async () => {
      // Mock URL.createObjectURL and revokeObjectURL
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      await act(async () => {
        root?.render(<SignatureAuditLogsTab logs={INITIAL_HSM_LOGS} />);
      });

      const exportBtn = container?.querySelector('button[data-testid="export-audit-csv-button"]') as HTMLButtonElement;
      expect(exportBtn).toBeTruthy();

      await act(async () => {
        exportBtn.click();
      });

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
      expect(container?.querySelector('[data-testid="audit-export-success-alert"]')).toBeTruthy();
      expect(container?.textContent).toContain('Đã xuất file log audit (.CSV) thành công!');
    });
  });
});
