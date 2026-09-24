import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import {
  detectDocumentType,
  DocumentViewer,
  DocumentPreviewModal,
  DocumentPreviewDrawer,
  DocumentPreviewProvider,
  useDocumentPreview,
  ExcelViewer,
  generateSampleExcelBuffer,
  SAMPLE_CONTRACT_DOC,
  SAMPLE_EINVOICE_XML
} from '../components/document-viewer';
import * as XLSX from 'xlsx';

// Configure React act environment
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('Document Viewer & Multi-App Direct Preview Tests', () => {
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

  describe('File Format Detection Engine', () => {
    it('correctly detects PDF files', () => {
      expect(detectDocumentType('hop-dong.pdf')).toBe('pdf');
      expect(detectDocumentType('HDMB_2026.PDF')).toBe('pdf');
      expect(detectDocumentType('phu-luc.pdf', { type: 'application/pdf' })).toBe('pdf');
    });

    it('correctly detects Word DOCX files', () => {
      expect(detectDocumentType('quyet-dinh.docx')).toBe('docx');
      expect(detectDocumentType('mau-hop-dong.doc')).toBe('docx');
      expect(detectDocumentType('file', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })).toBe('docx');
    });

    it('correctly detects Excel XLSX, XLS, and CSV files', () => {
      expect(detectDocumentType('bang-ke.xlsx')).toBe('xlsx');
      expect(detectDocumentType('bao-cao.xls')).toBe('xlsx');
      expect(detectDocumentType('du-lieu.csv')).toBe('xlsx');
      expect(detectDocumentType('file', { type: 'application/vnd.ms-excel' })).toBe('xlsx');
    });

    it('correctly detects XML and Image files', () => {
      expect(detectDocumentType('hoa-don-cqt.xml')).toBe('xml');
      expect(detectDocumentType('bien-lai.png')).toBe('image');
      expect(detectDocumentType('chung-tu.jpg')).toBe('image');
    });
  });

  describe('Excel SheetJS Generator & Multi-Sheet Verification', () => {
    it('generates sample multi-sheet Excel workbook with valid accounting data', () => {
      const buffer = generateSampleExcelBuffer('Test_BCTC.xlsx');
      expect(buffer).toBeDefined();
      expect(buffer.byteLength).toBeGreaterThan(100);

      const wb = XLSX.read(buffer, { type: 'array' });
      expect(wb.SheetNames).toContain('Tổng Hợp Cân Đối');
      expect(wb.SheetNames).toContain('Chi Tiết Công Nợ');
      expect(wb.SheetNames).toContain('Bảng Kê Hóa Đơn');
    });

    it('renders ExcelViewer component with SheetJS correctly', () => {
      const sampleBuf = generateSampleExcelBuffer();
      const html = renderToString(<ExcelViewer data={sampleBuf} fileName="BaoCao_Q3.xlsx" />);

      expect(html).toContain('BaoCao_Q3.xlsx');
      expect(html).toContain('Tìm ô dữ liệu...');
      expect(html).toContain('Tổng Hợp Cân Đối');
      expect(html).toContain('Chi Tiết Công Nợ');
      expect(html).toContain('Bảng Kê Hóa Đơn');
      expect(html).toContain('Tải XLSX');
    });
  });

  describe('DocumentPreviewModal & DocumentPreviewDrawer', () => {
    it('renders modal when isOpen is true and shows document title and watermark', () => {
      const handleClose = vi.fn();
      const html = renderToString(
        <DocumentPreviewModal
          isOpen={true}
          onClose={handleClose}
          fileName="HopDongLaoDong.docx"
          fileType="docx"
          title="HỢP ĐỒNG LAO ĐỘNG 2026"
          subtitle="Mã: HDLD-001 • Nhân sự"
          watermarkText="VCOMM CONFIDENTIAL"
        />
      );

      expect(html).toContain('HỢP ĐỒNG LAO ĐỘNG 2026');
      expect(html).toContain('HDLD-001');
      expect(html).toContain('Xem trực tiếp (No Download)');
      expect(html).toContain('VCOMM CONFIDENTIAL');
    });

    it('does not render modal when isOpen is false', () => {
      const html = renderToString(
        <DocumentPreviewModal
          isOpen={false}
          onClose={vi.fn()}
          fileName="TaiLieu.pdf"
        />
      );

      expect(html).toBe('');
    });

    it('renders drawer with slide-over layout when isOpen is true', () => {
      const html = renderToString(
        <DocumentPreviewDrawer
          isOpen={true}
          onClose={vi.fn()}
          fileName="BangKeChungTu.xlsx"
          fileType="xlsx"
          title="Đối chiếu chứng từ"
        />
      );

      expect(html).toContain('Đối chiếu chứng từ');
      expect(html).toContain('BangKeChungTu.xlsx');
    });
  });

  describe('Universal DocumentViewer Component Routing', () => {
    it('routes to Word layout for docx files', () => {
      const html = renderToString(
        <DocumentViewer
          fileName="QuyetDinhBoNhiem.docx"
          fileType="docx"
        />
      );

      expect(html).toContain('Microsoft Word .docx');
      expect(html).toContain('QuyetDinhBoNhiem.docx');
    });

    it('routes to PDF layout for pdf files', () => {
      const html = renderToString(
        <DocumentViewer
          fileName="CongVanDen.pdf"
          fileType="pdf"
        />
      );

      expect(html).toContain('Tài liệu PDF điện tử');
      expect(html).toContain('CongVanDen.pdf');
    });

    it('routes to XML layout for xml e-invoices', () => {
      const html = renderToString(
        <DocumentViewer
          fileName="HoaDon78.xml"
          fileType="xml"
        />
      );

      expect(html).toContain('XML Hóa đơn điện tử TT78');
      expect(html).toContain('Sao chép');
    });
  });

  describe('DocumentPreviewProvider & useDocumentPreview Hook', () => {
    it('provides openPreview and renders child components with document context', () => {
      let previewHook: any = null;

      const TestComponent = () => {
        previewHook = useDocumentPreview();
        return <div>Test App Content</div>;
      };

      const html = renderToString(
        <DocumentPreviewProvider>
          <TestComponent />
        </DocumentPreviewProvider>
      );

      expect(html).toContain('Test App Content');
      expect(previewHook).toBeDefined();
      expect(typeof previewHook.openPreview).toBe('function');
      expect(typeof previewHook.openDrawer).toBe('function');
      expect(typeof previewHook.closePreview).toBe('function');
      expect(typeof previewHook.closeDrawer).toBe('function');
    });
  });
});
