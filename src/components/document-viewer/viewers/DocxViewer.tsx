import React, { useState, useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';
import { FileText, ZoomIn, ZoomOut, RotateCcw, AlertCircle, Printer, Download, Sparkles } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { SAMPLE_CONTRACT_DOC } from '../sampleDocuments';

export interface DocxViewerProps {
  data?: ArrayBuffer | Blob | File | string | null;
  fileName?: string;
  className?: string;
  zoom?: number;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({
  data,
  fileName = 'VanBan_TaiLieu.docx',
  className,
  zoom = 100
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRenderedWithDocxPreview, setIsRenderedWithDocxPreview] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setIsRenderedWithDocxPreview(false);

    const loadAndRenderDocx = async () => {
      try {
        if (!data) {
          // No binary provided -> use structured template fallback
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        let buffer: ArrayBuffer;
        if (data instanceof File || data instanceof Blob) {
          buffer = await data.arrayBuffer();
        } else if (data instanceof ArrayBuffer) {
          buffer = data;
        } else if (typeof data === 'string') {
          if (data.startsWith('data:') || data.includes('base64,')) {
            const base64 = data.split('base64,')[1] || data;
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            buffer = bytes.buffer;
          } else {
            // Fetch URL
            const res = await fetch(data);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            buffer = await res.arrayBuffer();
          }
        } else {
          buffer = new ArrayBuffer(0);
        }

        if (containerRef.current && buffer.byteLength > 0) {
          // Clear previous DOM
          containerRef.current.innerHTML = '';
          await renderAsync(buffer, containerRef.current, undefined, {
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
            experimental: true,
            className: 'docx-preview-content'
          });

          if (isMounted) {
            setIsRenderedWithDocxPreview(true);
            setIsLoading(false);
          }
        } else {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      } catch (err: any) {
        console.warn('docx-preview fallback to structured view:', err);
        if (isMounted) {
          // Fall back gracefully to structured corporate document viewer
          setIsRenderedWithDocxPreview(false);
          setIsLoading(false);
        }
      }
    };

    loadAndRenderDocx();
    return () => {
      isMounted = false;
    };
  }, [data, fileName]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (data instanceof File) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert(`Đang chuẩn bị tải về tài liệu: ${fileName}`);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-slate-100 border border-slate-200 rounded-lg overflow-hidden select-text", className)}>
      {/* Docx Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded shadow-xs">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-800">{fileName}</span>
            <span className="text-[10px] text-slate-400 ml-2 font-mono">
              (Microsoft Word .docx • Khổ A4 tiêu chuẩn)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-white border border-slate-300 rounded-md p-0.5">
            <button
              onClick={() => setCurrentZoom(z => Math.max(60, z - 10))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1.5 text-[11px] font-mono font-medium text-slate-700 min-w-[36px] text-center">
              {currentZoom}%
            </span>
            <button
              onClick={() => setCurrentZoom(z => Math.min(150, z + 10))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Phóng to"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setCurrentZoom(100)}
              className="p-1 hover:bg-slate-100 rounded text-slate-400"
              title="Đặt lại 100%"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md flex items-center gap-1 transition-colors"
          >
            <Printer className="w-3 h-3" /> In ấn
          </button>
          <button
            onClick={handleDownload}
            className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md flex items-center gap-1 transition-colors"
          >
            <Download className="w-3 h-3" /> Tải tệp
          </button>
        </div>
      </div>

      {/* Main Document Body */}
      <div className="flex-1 overflow-auto p-6 flex justify-center items-start relative bg-slate-200/70">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80">
            <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-600">Đang đọc cấu trúc OpenXML & kiểu chữ tài liệu...</p>
          </div>
        )}

        {/* docx-preview Target Container */}
        <div
          ref={containerRef}
          style={{
            transform: `scale(${currentZoom / 100})`,
            transformOrigin: 'top center',
            display: isRenderedWithDocxPreview ? 'block' : 'none'
          }}
          className="transition-transform duration-100"
        />

        {/* Structured Fallback A4 Canvas (when raw docx-preview is not active) */}
        {!isRenderedWithDocxPreview && !isLoading && (
          <div
            style={{
              transform: `scale(${currentZoom / 100})`,
              transformOrigin: 'top center',
              width: '720px',
              minHeight: '1020px'
            }}
            className="bg-white text-slate-900 shadow-xl rounded-sm p-12 transition-transform border border-slate-300 mb-12"
          >
            {/* National Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-8 text-xs">
              <div className="text-left space-y-0.5">
                <p className="font-bold text-slate-800 uppercase tracking-tight">
                  CÔNG TY CỔ PHẦN DỊCH VỤ VCOMM
                </p>
                <p className="text-slate-500 font-mono">Số: {SAMPLE_CONTRACT_DOC.code}</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="font-bold text-slate-800 uppercase tracking-widest">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="text-slate-600 font-medium underline">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <p className="text-[11px] text-slate-400 italic pt-1">
                  Hà Nội, ngày {SAMPLE_CONTRACT_DOC.date}
                </p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-6 space-y-1">
              <h1 className="text-base font-black text-slate-900 uppercase tracking-wide leading-snug">
                {SAMPLE_CONTRACT_DOC.title}
              </h1>
              <p className="text-xs text-slate-500 font-mono italic">
                (Tài liệu: {fileName})
              </p>
            </div>

            {/* Contract Parties */}
            <div className="space-y-4 my-6 text-xs text-slate-700 bg-slate-50/70 p-4 rounded-lg border border-slate-200">
              {SAMPLE_CONTRACT_DOC.parties.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="font-bold text-slate-900 uppercase">{p.role}: {p.name}</p>
                  <p className="pl-4">• Đại diện: {p.rep}</p>
                  <p className="pl-4">• Mã số thuế: <span className="font-mono">{p.tax}</span></p>
                  <p className="pl-4">• Địa chỉ trụ sở: {p.addr}</p>
                </div>
              ))}
            </div>

            {/* Sections */}
            <div className="space-y-5 text-xs text-slate-800 leading-relaxed">
              {SAMPLE_CONTRACT_DOC.sections.map((sec, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h3 className="font-bold text-slate-900">{sec.heading}</h3>
                  <p className="text-justify indent-6 text-slate-700 leading-relaxed">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-slate-200 text-xs text-center">
              <div>
                <p className="font-bold uppercase text-slate-800">ĐẠI DIỆN BÊN A</p>
                <p className="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên và đóng dấu)</p>
                <div className="h-20 flex items-center justify-center">
                  <div className="border border-rose-300 bg-rose-50 text-rose-600 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transform rotate-[-3deg]">
                    ✓ Đã Ký Số Cloud HSM
                  </div>
                </div>
                <p className="font-bold text-slate-800">Nguyễn Văn A</p>
              </div>

              <div>
                <p className="font-bold uppercase text-slate-800">ĐẠI DIỆN BÊN B</p>
                <p className="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên và đóng dấu)</p>
                <div className="h-20 flex items-center justify-center">
                  <div className="border border-indigo-300 bg-indigo-50 text-indigo-600 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transform rotate-[2deg]">
                    ✓ Xác Nhận Điện Tử
                  </div>
                </div>
                <p className="font-bold text-slate-800">Phạm Thu Hương</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
