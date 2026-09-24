import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { SignatureDashboard } from '../components/signature/SignatureDashboard';
import { CompanyHsmManager } from '../components/signature/CompanyHsmManager';
import {
  INITIAL_COMPANY_HSM,
  INITIAL_PERSONAL_CERTS,
  INITIAL_SIGNING_DOCUMENTS,
  CompanyHSMProfile,
  PersonalCertificate,
  SigningDocument
} from '../data/hsmSignatureData';

// Configure React act environment
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('Digital Signatures Dashboard & Company HSM Manager (Task 5)', () => {
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

  describe('SignatureDashboard Component', () => {
    const onNavigateTabMock = vi.fn();
    const onOpenInspectHsmMock = vi.fn();
    const onTestHsmMock = vi.fn();
    const onQuickBatchSignMock = vi.fn();
    const onQuickIssueCertMock = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render all 4 Hero KPI cards correctly', () => {
      const html = renderToString(
        <SignatureDashboard
          companyHsm={INITIAL_COMPANY_HSM}
          personalCerts={INITIAL_PERSONAL_CERTS}
          documents={INITIAL_SIGNING_DOCUMENTS}
          onNavigateTab={onNavigateTabMock}
          onOpenInspectHsm={onOpenInspectHsmMock}
          onTestHsm={onTestHsmMock}
          isTestingHsm={false}
          testHsmSuccess={false}
        />
      );

      // KPI 1: HSM Status
      expect(html).toContain('Cụm Cloud HSM Công Ty');
      expect(html).toContain('Operational');
      expect(html).toContain('Viettel-CA');
      expect(html).toContain('120 TPS');
      expect(html).toContain('14ms');

      // KPI 2: HSM Quota
      expect(html).toContain('Hạn Ngạch Ký Số HSM');
      expect(html).toContain('14.250');
      expect(html).toContain('20.000');
      expect(html).toContain('Hạn ngạch an toàn');

      // KPI 3: Personal Certs
      expect(html).toContain('Chứng Thư Cá Nhân CBNV');
      expect(html).toContain('đang hoạt động');
      expect(html).toContain('Tạm khóa:');

      // KPI 4: Pending Documents
      expect(html).toContain('Tài Liệu Chờ Ký Duyệt');
      expect(html).toContain('văn bản');
      expect(html).toContain('hồ sơ gấp');
    });

    it('should render 7-day signing activity trends with 4 categories and SLA metrics', () => {
      const html = renderToString(
        <SignatureDashboard
          companyHsm={INITIAL_COMPANY_HSM}
          personalCerts={INITIAL_PERSONAL_CERTS}
          documents={INITIAL_SIGNING_DOCUMENTS}
          onNavigateTab={onNavigateTabMock}
          onOpenInspectHsm={onOpenInspectHsmMock}
          onTestHsm={onTestHsmMock}
          isTestingHsm={false}
          testHsmSuccess={false}
        />
      );

      expect(html).toContain('Lưu Lượng Ký Số 7 Ngày Gần Nhất');
      expect(html).toContain('99.8% SLA');
      expect(html).toContain('Trung bình / ngày');
      expect(html).toContain('Hóa đơn điện tử (TT78)');
      expect(html).toContain('Phiếu xuất kho (3PL)');
      expect(html).toContain('Hợp đồng B2B');
      expect(html).toContain('Tờ khai thuế GTGT');
      expect(html).toContain('TSA (RFC 3161)');
    });

    it('should trigger onOpenInspectHsm when clicking "Soi X.509" on the HSM KPI card', async () => {
      await act(async () => {
        root?.render(
          <SignatureDashboard
            companyHsm={INITIAL_COMPANY_HSM}
            personalCerts={INITIAL_PERSONAL_CERTS}
            documents={INITIAL_SIGNING_DOCUMENTS}
            onNavigateTab={onNavigateTabMock}
            onOpenInspectHsm={onOpenInspectHsmMock}
            onTestHsm={onTestHsmMock}
            isTestingHsm={false}
            testHsmSuccess={false}
          />
        );
      });

      const inspectBtn = container?.querySelector('[data-testid="btn-inspect-hsm-kpi"]') as HTMLButtonElement;
      expect(inspectBtn).not.toBeNull();

      await act(async () => {
        inspectBtn.click();
      });

      expect(onOpenInspectHsmMock).toHaveBeenCalledTimes(1);
    });

    it('should trigger onNavigateTab when clicking navigation links in KPI cards', async () => {
      await act(async () => {
        root?.render(
          <SignatureDashboard
            companyHsm={INITIAL_COMPANY_HSM}
            personalCerts={INITIAL_PERSONAL_CERTS}
            documents={INITIAL_SIGNING_DOCUMENTS}
            onNavigateTab={onNavigateTabMock}
            onOpenInspectHsm={onOpenInspectHsmMock}
            onTestHsm={onTestHsmMock}
            isTestingHsm={false}
            testHsmSuccess={false}
          />
        );
      });

      // Navigate to personal certs
      const certsBtn = container?.querySelector('[data-testid="btn-view-personal-certs"]') as HTMLButtonElement;
      expect(certsBtn).not.toBeNull();
      await act(async () => {
        certsBtn.click();
      });
      expect(onNavigateTabMock).toHaveBeenCalledWith('personal_certs');

      // Navigate to signing workspace
      const workspaceBtn = container?.querySelector('[data-testid="btn-view-signing-workspace"]') as HTMLButtonElement;
      expect(workspaceBtn).not.toBeNull();
      await act(async () => {
        workspaceBtn.click();
      });
      expect(onNavigateTabMock).toHaveBeenCalledWith('signing_workspace');
    });

    it('should trigger quick actions in Quick Actions Hub', async () => {
      await act(async () => {
        root?.render(
          <SignatureDashboard
            companyHsm={INITIAL_COMPANY_HSM}
            personalCerts={INITIAL_PERSONAL_CERTS}
            documents={INITIAL_SIGNING_DOCUMENTS}
            onNavigateTab={onNavigateTabMock}
            onOpenInspectHsm={onOpenInspectHsmMock}
            onTestHsm={onTestHsmMock}
            isTestingHsm={false}
            testHsmSuccess={false}
            onQuickBatchSign={onQuickBatchSignMock}
            onQuickIssueCert={onQuickIssueCertMock}
          />
        );
      });

      // 1. Open Workspace
      const openWorkspaceBtn = container?.querySelector('[data-testid="btn-action-open-workspace"]') as HTMLButtonElement;
      expect(openWorkspaceBtn).not.toBeNull();
      await act(async () => {
        openWorkspaceBtn.click();
      });
      expect(onNavigateTabMock).toHaveBeenCalledWith('signing_workspace');

      // 2. Quick Batch Sign
      const batchSignBtn = container?.querySelector('[data-testid="btn-action-quick-batch-sign"]') as HTMLButtonElement;
      expect(batchSignBtn).not.toBeNull();
      await act(async () => {
        batchSignBtn.click();
      });
      expect(onQuickBatchSignMock).toHaveBeenCalledTimes(1);

      // 3. Test HSM Realtime
      const testHsmBtn = container?.querySelector('[data-testid="btn-action-test-hsm"]') as HTMLButtonElement;
      expect(testHsmBtn).not.toBeNull();
      await act(async () => {
        testHsmBtn.click();
      });
      expect(onTestHsmMock).toHaveBeenCalledTimes(1);

      // 4. Quick Issue Cert
      const issueCertBtn = container?.querySelector('[data-testid="btn-action-quick-issue-cert"]') as HTMLButtonElement;
      expect(issueCertBtn).not.toBeNull();
      await act(async () => {
        issueCertBtn.click();
      });
      expect(onQuickIssueCertMock).toHaveBeenCalledTimes(1);
    });

    it('should fallback to onNavigateTab if quick action callbacks are not provided', async () => {
      await act(async () => {
        root?.render(
          <SignatureDashboard
            companyHsm={INITIAL_COMPANY_HSM}
            personalCerts={INITIAL_PERSONAL_CERTS}
            documents={INITIAL_SIGNING_DOCUMENTS}
            onNavigateTab={onNavigateTabMock}
            onOpenInspectHsm={onOpenInspectHsmMock}
            onTestHsm={onTestHsmMock}
            isTestingHsm={false}
            testHsmSuccess={false}
          />
        );
      });

      const batchSignBtn = container?.querySelector('[data-testid="btn-action-quick-batch-sign"]') as HTMLButtonElement;
      await act(async () => {
        batchSignBtn.click();
      });
      expect(onNavigateTabMock).toHaveBeenCalledWith('signing_workspace');

      const issueCertBtn = container?.querySelector('[data-testid="btn-action-quick-issue-cert"]') as HTMLButtonElement;
      await act(async () => {
        issueCertBtn.click();
      });
      expect(onNavigateTabMock).toHaveBeenCalledWith('personal_certs');
    });

    it('should display loading state when isTestingHsm is true', async () => {
      await act(async () => {
        root?.render(
          <SignatureDashboard
            companyHsm={INITIAL_COMPANY_HSM}
            personalCerts={INITIAL_PERSONAL_CERTS}
            documents={INITIAL_SIGNING_DOCUMENTS}
            onNavigateTab={onNavigateTabMock}
            onOpenInspectHsm={onOpenInspectHsmMock}
            onTestHsm={onTestHsmMock}
            isTestingHsm={true}
            testHsmSuccess={false}
          />
        );
      });

      const testHsmBtn = container?.querySelector('[data-testid="btn-action-test-hsm"]') as HTMLButtonElement;
      expect(testHsmBtn.disabled).toBe(true);
      expect(testHsmBtn.textContent).toContain('Đang kiểm tra...');
    });

    it('should display success banner when testHsmSuccess is true and allow opening inspector', async () => {
      await act(async () => {
        root?.render(
          <SignatureDashboard
            companyHsm={INITIAL_COMPANY_HSM}
            personalCerts={INITIAL_PERSONAL_CERTS}
            documents={INITIAL_SIGNING_DOCUMENTS}
            onNavigateTab={onNavigateTabMock}
            onOpenInspectHsm={onOpenInspectHsmMock}
            onTestHsm={onTestHsmMock}
            isTestingHsm={false}
            testHsmSuccess={true}
          />
        );
      });

      const banner = container?.querySelector('[data-testid="hsm-test-success-banner"]');
      expect(banner).not.toBeNull();
      expect(banner?.textContent).toContain('Kiểm tra kết nối Cụm Cloud HSM thành công!');
      expect(banner?.textContent).toContain('14ms');
      expect(banner?.textContent).toContain('120 TPS');

      const inspectBtn = banner?.querySelector('button') as HTMLButtonElement;
      expect(inspectBtn).not.toBeNull();
      await act(async () => {
        inspectBtn.click();
      });
      expect(onOpenInspectHsmMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('CompanyHsmManager Component', () => {
    const onToggleAutoSignMock = vi.fn();
    const onTestHsmMock = vi.fn();
    const onOpenInspectHsmMock = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render corporate certificate identity card correctly', () => {
      const html = renderToString(
        <CompanyHsmManager
          companyHsm={INITIAL_COMPANY_HSM}
          onToggleAutoSign={onToggleAutoSignMock}
          onTestHsm={onTestHsmMock}
          onOpenInspectHsm={onOpenInspectHsmMock}
          isTestingHsm={false}
          testHsmSuccess={false}
        />
      );

      expect(html).toContain('CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM');
      expect(html).toContain('0318914439');
      expect(html).toContain('Viettel-CA');
      expect(html).toContain('FIPS 140-2 Level 3');
      expect(html).toContain('Có hiệu lực');
      expect(html).toContain(INITIAL_COMPANY_HSM.subjectDN);
      expect(html).toContain(INITIAL_COMPANY_HSM.serialNumber);
      expect(html).toContain('15/08/2023');
      expect(html).toContain('15/08/2026');
      expect(html).toContain('698 ngày');
      expect(html).toContain('Soi Chi Tiết X.509 v3 &amp; Chuỗi CA');
    });

    it('should render Cloud HSM hardware infrastructure specifications', () => {
      const html = renderToString(
        <CompanyHsmManager
          companyHsm={INITIAL_COMPANY_HSM}
          onToggleAutoSign={onToggleAutoSignMock}
          onTestHsm={onTestHsmMock}
          onOpenInspectHsm={onOpenInspectHsmMock}
          isTestingHsm={false}
          testHsmSuccess={false}
        />
      );

      expect(html).toContain('SLOT-VCOMM-PROD-01');
      expect(html).toContain('VCOMM_CORPORATE_KEY');
      expect(html).toContain('120 TPS');
      expect(html).toContain('HSM Enclave Protected');
      expect(html).toContain('hsm-cluster.viettel-ca.vn:8443/vcomm-core');
      expect(html).toContain('14.250 / 20.000 lượt');
    });

    it('should trigger onOpenInspectHsm when clicking inspector button', async () => {
      await act(async () => {
        root?.render(
          <CompanyHsmManager
            companyHsm={INITIAL_COMPANY_HSM}
            onToggleAutoSign={onToggleAutoSignMock}
            onTestHsm={onTestHsmMock}
            onOpenInspectHsm={onOpenInspectHsmMock}
            isTestingHsm={false}
            testHsmSuccess={false}
          />
        );
      });

      const inspectBtn = container?.querySelector('[data-testid="btn-open-inspect-hsm"]') as HTMLButtonElement;
      expect(inspectBtn).not.toBeNull();
      await act(async () => {
        inspectBtn.click();
      });
      expect(onOpenInspectHsmMock).toHaveBeenCalledTimes(1);
    });

    it('should trigger onTestHsm when clicking "Test Kết Nối HSM"', async () => {
      await act(async () => {
        root?.render(
          <CompanyHsmManager
            companyHsm={INITIAL_COMPANY_HSM}
            onToggleAutoSign={onToggleAutoSignMock}
            onTestHsm={onTestHsmMock}
            onOpenInspectHsm={onOpenInspectHsmMock}
            isTestingHsm={false}
            testHsmSuccess={false}
          />
        );
      });

      const testBtn = container?.querySelector('[data-testid="btn-test-hsm"]') as HTMLButtonElement;
      expect(testBtn).not.toBeNull();
      await act(async () => {
        testBtn.click();
      });
      expect(onTestHsmMock).toHaveBeenCalledTimes(1);
    });

    it('should disable test button and display spinner when isTestingHsm is true', async () => {
      await act(async () => {
        root?.render(
          <CompanyHsmManager
            companyHsm={INITIAL_COMPANY_HSM}
            onToggleAutoSign={onToggleAutoSignMock}
            onTestHsm={onTestHsmMock}
            onOpenInspectHsm={onOpenInspectHsmMock}
            isTestingHsm={true}
            testHsmSuccess={false}
          />
        );
      });

      const testBtn = container?.querySelector('[data-testid="btn-test-hsm"]') as HTMLButtonElement;
      expect(testBtn.disabled).toBe(true);
    });

    it('should render success banner when testHsmSuccess is true', async () => {
      await act(async () => {
        root?.render(
          <CompanyHsmManager
            companyHsm={INITIAL_COMPANY_HSM}
            onToggleAutoSign={onToggleAutoSignMock}
            onTestHsm={onTestHsmMock}
            onOpenInspectHsm={onOpenInspectHsmMock}
            isTestingHsm={false}
            testHsmSuccess={true}
          />
        );
      });

      const banner = container?.querySelector('[data-testid="hsm-connected-banner"]');
      expect(banner).not.toBeNull();
      expect(banner?.textContent).toContain('Kiểm tra kết nối HSM thành công!');
      expect(banner?.textContent).toContain('14ms');
      expect(banner?.textContent).toContain('120 TPS');
    });

    it('should trigger onToggleAutoSign for each auto-sign rule toggle', async () => {
      await act(async () => {
        root?.render(
          <CompanyHsmManager
            companyHsm={INITIAL_COMPANY_HSM}
            onToggleAutoSign={onToggleAutoSignMock}
            onTestHsm={onTestHsmMock}
            onOpenInspectHsm={onOpenInspectHsmMock}
            isTestingHsm={false}
            testHsmSuccess={false}
          />
        );
      });

      // 1. Invoices
      const invoicesToggle = container?.querySelector('[data-testid="toggle-auto-sign-invoices"]') as HTMLInputElement;
      expect(invoicesToggle).not.toBeNull();
      expect(invoicesToggle.checked).toBe(true);
      await act(async () => {
        invoicesToggle.click();
      });
      expect(onToggleAutoSignMock).toHaveBeenCalledWith('invoices');

      // 2. Warehouse Receipts
      const warehouseToggle = container?.querySelector('[data-testid="toggle-auto-sign-warehouse"]') as HTMLInputElement;
      expect(warehouseToggle).not.toBeNull();
      expect(warehouseToggle.checked).toBe(true);
      await act(async () => {
        warehouseToggle.click();
      });
      expect(onToggleAutoSignMock).toHaveBeenCalledWith('warehouseReceipts');

      // 3. Reconciliations
      const recToggle = container?.querySelector('[data-testid="toggle-auto-sign-reconciliations"]') as HTMLInputElement;
      expect(recToggle).not.toBeNull();
      expect(recToggle.checked).toBe(true);
      await act(async () => {
        recToggle.click();
      });
      expect(onToggleAutoSignMock).toHaveBeenCalledWith('reconciliations');

      // 4. Tax Declarations
      const taxToggle = container?.querySelector('[data-testid="toggle-auto-sign-tax"]') as HTMLInputElement;
      expect(taxToggle).not.toBeNull();
      expect(taxToggle.checked).toBe(false);
      await act(async () => {
        taxToggle.click();
      });
      expect(onToggleAutoSignMock).toHaveBeenCalledWith('taxDeclarations');
    });

    it('should render legal security compliance notice (TT 16/2019/TT-BTTTT)', () => {
      const html = renderToString(
        <CompanyHsmManager
          companyHsm={INITIAL_COMPANY_HSM}
          onToggleAutoSign={onToggleAutoSignMock}
          onTestHsm={onTestHsmMock}
          onOpenInspectHsm={onOpenInspectHsmMock}
          isTestingHsm={false}
          testHsmSuccess={false}
        />
      );

      expect(html).toContain('Lưu Ý Bảo Mật Pháp Lý (TT 16/2019/TT-BTTTT)');
      expect(html).toContain('FIPS 140-2 Level 3');
      expect(html).toContain('Timestamp Authority - TSA');
      expect(html).toContain('Nghị định 130/2018/NĐ-CP');
    });
  });
});
