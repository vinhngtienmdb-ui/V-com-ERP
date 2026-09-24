import React, { useState, useEffect } from 'react';
import { FileText, ZoomIn, ZoomOut, RotateCw, ExternalLink, Printer, Download, AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { SAMPLE_CONTRACT_DOC } from '../sampleDocuments';

export interface PdfViewerProps {
  data?: string | File | Blob | ArrayBuffer | null;
  fileName?: string;
  className?: string;
  zoom?: number;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  data,
  fileName = 'TaiLieu.pdf',
  className,
  zoom = 100
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  const [rotation, setRotation] = useState<number>(0);
  const [isPdfEmbedded, setIsPdfEmbedded] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 3;

  useEffect(() => {
    let createdUrl: string | null = null;

    if (data instanceof File || data instanceof Blob) {
      createdUrl = URL.createObjectURL(data);
      setObjectUrl(createdUrl);
      setIsPdfEmbedded(true);
    } else if (typeof data === 'string' && data.length > 0) {
      if (data.startsWith('http') || data.startsWith('blob:') || data.startsWith('data:application/pdf')) {
        setObjectUrl(data);
        setIsPdfEmbedded(true);
      } else {
        // Fallback for mock IDs / file names
        setIsPdfEmbedded(false);
      }
    } else if (data instanceof ArrayBuffer) {
      const blob = new Blob([data], { type: 'application/pdf' });
      createdUrl = URL.createObjectURL(blob);
      setObjectUrl(createdUrl);
      setIsPdfEmbedded(true);
    } else {
      setIsPdfEmbedded(false);
    }

    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [data]);

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenNewTab = () => {
    if (objectUrl) {
      window.open(objectUrl, '_blank');
    } else {
      alert(`Mở tài liệu: ${fileName}`);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-slate-100 border border-slate-200 rounded-lg overflow-hidden select-text", className)}>
      {/* PDF Toolbar */}
      <div className="bg-slate-900 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-600 text-white rounded shadow-xs">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-100">{fileName}</span>
            <span className="text-[10px] text-slate-400 ml-2 font-mono">
              (Tài liệu PDF điện tử • Trang {currentPage}/{totalPages})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-md p-0.5">
            <button
              onClick={() => setCurrentZoom(z => Math.max(50, z - 10))}
              className="p-1 hover:bg-slate-700 rounded text-slate-300"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1.5 text-[11px] font-mono font-medium text-slate-200 min-w-[36px] text-center">
              {currentZoom}%
            </span>
            <button
              onClick={() => setCurrentZoom(z => Math.min(200, z + 10))}
              className="p-1 hover:bg-slate-700 rounded text-slate-300"
              title="Phóng to"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Rotate */}
          <button
            onClick={handleRotate}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 border border-slate-700 flex items-center gap-1 text-[11px]"
            title="Xoay trang 90°"
          >
            <RotateCw className="w-3 h-3" />
            {rotation !== 0 && <span className="text-[10px]">{rotation}°</span>}
          </button>

          {/* New tab */}
          {objectUrl && (
            <button
              onClick={handleOpenNewTab}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 border border-slate-700"
              title="Mở tab mới"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          {/* Print */}
          <button
            onClick={handlePrint}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md flex items-center gap-1 transition-colors"
          >
            <Printer className="w-3 h-3" /> In ấn
          </button>

          {/* Download */}
          <button
            onClick={() => {
              if (objectUrl) {
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = fileName;
                a.click();
              } else {
                alert(`Tải về: ${fileName}`);
              }
            }}
            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md flex items-center gap-1 transition-colors shadow-xs"
          >
            <Download className="w-3 h-3" /> Tải PDF
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-auto bg-slate-800/80 p-6 flex justify-center items-start relative">
        {isPdfEmbedded && objectUrl ? (
          <div
            style={{
              transform: `scale(${currentZoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              width: '100%',
              height: '100%',
              minHeight: '800px'
            }}
            className="transition-transform duration-100 flex justify-center"
          >
            <object
              data={objectUrl}
              type="application/pdf"
              className="w-full h-full rounded shadow-2xl border border-slate-700 bg-white"
            >
              <iframe
                src={`${objectUrl}#toolbar=0`}
                title={fileName}
                className="w-full h-full border-none"
              />
            </object>
          </div>
        ) : (
          /* High fidelity fallback A4 canvas with official seals */
          <div
            style={{
              transform: `scale(${currentZoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              width: '680px',
              minHeight: '940px'
            }}
            className="bg-white text-slate-900 shadow-2xl rounded-sm p-12 relative transition-transform border border-slate-300 mb-12"
          >
            {/* National Header */}
            <div className="text-center border-b border-slate-200 pb-5 mb-8">
              <p className="text-[11px] font-bold tracking-widest text-slate-800 uppercase">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </p>
              <p className="text-[10px] text-slate-600 underline font-semibold mt-0.5">
                Độc lập - Tự do - Hạnh phúc
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono">Số: {SAMPLE_CONTRACT_DOC.code}</span>
                <span>TP. Hà Nội, ngày {SAMPLE_CONTRACT_DOC.date}</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-6 space-y-1">
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                {SAMPLE_CONTRACT_DOC.title}
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                Mã văn bản điện tử: {fileName.replace(/\.[^/.]+$/, '')}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-800">
              {SAMPLE_CONTRACT_DOC.sections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-slate-900">{sec.heading}</h4>
                  <p className="text-justify indent-5 text-slate-700 leading-relaxed">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>

            {/* HSM Stamp & Signature Box */}
            <div className="mt-12 pt-8 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                <p>Nơi nhận:</p>
                <p>- Như Điều 1</p>
                <p>- Ban Pháp chế & Kế toán</p>
                <p>- Lưu: VT, HS.</p>
              </div>

              {/* Digital Red Seal */}
              <div className="relative border-2 border-dashed border-rose-500 bg-rose-50/50 p-4 rounded-xl text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-rose-600 text-rose-600 flex flex-col items-center justify-center font-bold text-[9px] uppercase leading-tight mb-1">
                  <span>C.T.C.P</span>
                  <span className="text-[10px] font-black">VCOMM</span>
                  <span>VIỆT NAM</span>
                </div>
                <div className="text-[10px] font-bold text-rose-700">
                  KÝ BỞI: CÔNG TY CỔ PHẦN VCOMM
                </div>
                <div className="text-[9px] text-rose-600 font-mono">
                  Ngày ký: {SAMPLE_CONTRACT_DOC.date}
                </div>
                <div className="text-[8px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded mt-1">
                  ✓ Chứng thư số hợp lệ (Cloud HSM)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
