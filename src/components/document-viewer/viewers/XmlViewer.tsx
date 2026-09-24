import React, { useState, useEffect } from 'react';
import { Code2, Copy, Check, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { SAMPLE_EINVOICE_XML } from '../sampleDocuments';

export interface XmlViewerProps {
  data?: string | File | Blob | null;
  fileName?: string;
  className?: string;
}

export const XmlViewer: React.FC<XmlViewerProps> = ({
  data,
  fileName = 'HoaDonDienTu_TT78.xml',
  className
}) => {
  const [content, setContent] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<number>(100);

  useEffect(() => {
    let isMounted = true;
    const readXml = async () => {
      if (!data) {
        setContent(SAMPLE_EINVOICE_XML);
        return;
      }
      if (typeof data === 'string') {
        if (data.trim().startsWith('<')) {
          setContent(data);
        } else {
          try {
            const res = await fetch(data);
            const text = await res.text();
            if (isMounted) setContent(text);
          } catch {
            if (isMounted) setContent(SAMPLE_EINVOICE_XML);
          }
        }
      } else if (data instanceof File || data instanceof Blob) {
        const text = await data.text();
        if (isMounted) setContent(text);
      }
    };
    readXml();
    return () => {
      isMounted = false;
    };
  }, [data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("flex flex-col h-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg overflow-hidden font-mono", className)}>
      {/* XML Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-3 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-600 text-white rounded">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-200">{fileName}</span>
          <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 font-sans">
            XML Hóa đơn điện tử TT78
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-md p-0.5">
            <button
              onClick={() => setCurrentZoom(z => Math.max(70, z - 10))}
              className="p-1 hover:bg-slate-700 rounded text-slate-300"
              title="Thu nhỏ font"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-slate-200 min-w-[36px] text-center">
              {currentZoom}%
            </span>
            <button
              onClick={() => setCurrentZoom(z => Math.min(140, z + 10))}
              className="p-1 hover:bg-slate-700 rounded text-slate-300"
              title="Phóng to font"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Đã sao chép' : 'Sao chép'}
          </button>

          <button
            onClick={handleDownload}
            className="px-2.5 py-1 text-[11px] font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900 border border-amber-700/60 rounded flex items-center gap-1 transition-colors"
          >
            <Download className="w-3 h-3" /> Tải XML
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="flex-1 overflow-auto p-4 bg-slate-950 text-slate-300 text-xs leading-relaxed select-text">
        <pre style={{ fontSize: `${(currentZoom / 100) * 12}px` }} className="font-mono">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
};
