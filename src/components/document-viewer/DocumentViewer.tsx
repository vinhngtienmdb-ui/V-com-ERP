import React, { useMemo } from 'react';
import { PdfViewer } from './viewers/PdfViewer';
import { DocxViewer } from './viewers/DocxViewer';
import { ExcelViewer } from './viewers/ExcelViewer';
import { XmlViewer } from './viewers/XmlViewer';
import { cn } from '../../lib/utils';
import { FileQuestion, Image as ImageIcon } from 'lucide-react';

export type DocumentType = 'pdf' | 'docx' | 'xlsx' | 'xls' | 'csv' | 'xml' | 'image' | 'auto';

export interface DocumentViewerProps {
  file?: string | File | Blob | ArrayBuffer | null;
  fileName?: string;
  fileType?: DocumentType;
  className?: string;
  height?: string | number;
  zoom?: number;
  watermarkText?: string;
}

/**
 * Suy luận loại tài liệu từ tên file hoặc MIME type
 */
export function detectDocumentType(fileName?: string, file?: any): Exclude<DocumentType, 'auto'> {
  const name = (fileName || (file && file.name ? file.name : '') || '').toLowerCase();

  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return 'xlsx';
  if (name.endsWith('.xml')) return 'xml';
  if (name.match(/\.(jpg|jpeg|png|webp|svg|gif)$/)) return 'image';

  if (file && typeof file === 'object' && file.type) {
    const mime = String(file.type).toLowerCase();
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('word') || mime.includes('officedocument.wordprocessingml')) return 'docx';
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return 'xlsx';
    if (mime.includes('xml')) return 'xml';
    if (mime.startsWith('image/')) return 'image';
  }

  // Mặc định cho PDF nếu không nhận diện được
  return 'pdf';
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  file,
  fileName = 'TaiLieu',
  fileType = 'auto',
  className,
  height = '100%',
  zoom = 100,
  watermarkText
}) => {
  const resolvedType = useMemo(() => {
    if (fileType && fileType !== 'auto') return fileType;
    return detectDocumentType(fileName, file);
  }, [fileType, fileName, file]);

  const resolvedHeight = typeof height === 'number' ? `${height}px` : height;

  const renderViewer = () => {
    switch (resolvedType) {
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <ExcelViewer data={file} fileName={fileName} zoom={zoom} />;
      case 'docx':
        return <DocxViewer data={file} fileName={fileName} zoom={zoom} />;
      case 'pdf':
        return <PdfViewer data={file} fileName={fileName} zoom={zoom} />;
      case 'xml':
        return <XmlViewer data={file as any} fileName={fileName} />;
      case 'image': {
        const imgSrc = typeof file === 'string'
          ? file
          : file instanceof Blob || file instanceof File
          ? URL.createObjectURL(file)
          : '';
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900 overflow-auto">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-slate-700"
              />
            ) : (
              <div className="text-slate-400 flex flex-col items-center">
                <ImageIcon className="w-12 h-12 mb-2" />
                <p className="text-xs">Không có dữ liệu hình ảnh</p>
              </div>
            )}
          </div>
        );
      }
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-50">
            <FileQuestion className="w-12 h-12 text-slate-400 mb-3" />
            <p className="text-sm font-bold text-slate-700">Định dạng tệp không được hỗ trợ trực tiếp</p>
            <p className="text-xs text-slate-400 mt-1">{fileName}</p>
          </div>
        );
    }
  };

  return (
    <div
      style={{ height: resolvedHeight }}
      className={cn("relative flex flex-col w-full overflow-hidden", className)}
    >
      {renderViewer()}

      {/* Security Watermark Overlay (optional) */}
      {watermarkText && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden opacity-10 select-none">
          <div className="transform -rotate-30 text-center font-black tracking-widest text-slate-900 text-3xl uppercase">
            {watermarkText}
          </div>
        </div>
      )}
    </div>
  );
};
