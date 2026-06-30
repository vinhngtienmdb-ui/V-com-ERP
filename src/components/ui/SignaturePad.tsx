import React, { useRef, useState, useEffect } from 'react';
import { PenTool, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  initialSignature?: string | null;
}

export function SignaturePad({ onSignatureChange, initialSignature }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!initialSignature);
  const [drawnSignatureData, setDrawnSignatureData] = useState<string | null>(initialSignature || null);

  useEffect(() => {
    if (initialSignature && canvasRef.current) {
       setIsEmpty(false);
       setDrawnSignatureData(initialSignature);
    }
  }, [initialSignature]);

  const startCanvasDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (drawnSignatureData && isEmpty) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setDrawnSignatureData(null);
    }

    setIsDrawing(true);
    setIsEmpty(false);

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pos = getCanvasPosition(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const drawCanvas = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPosition(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopCanvasDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCanvasSignature();
  };

  const getCanvasPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? (e.touches[0] ? e.touches[0].clientX : e.changedTouches[0].clientX) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0] ? e.touches[0].clientY : e.changedTouches[0].clientY) : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearCanvasSignature = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    setDrawnSignatureData(null);
    onSignatureChange(null);
  };

  const saveCanvasSignature = () => {
    if (!canvasRef.current || isEmpty) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setDrawnSignatureData(dataUrl);
      onSignatureChange(dataUrl);
    } catch (err) {
      console.error('Failed to save drawn signature:', err);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1.5 font-sans">
          <PenTool className="w-4 h-4 text-primary-600 animate-pulse" /> Bàn vẽ chữ ký tay điện tử:
        </span>
        {drawnSignatureData && (
          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded">
            Đã thiết lập chữ ký
          </span>
        )}
      </div>
      <div className="relative border border-slate-300 rounded-lg bg-white overflow-hidden h-40 shadow-inner">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full h-full cursor-crosshair rounded-lg block touch-none"
          onMouseDown={startCanvasDrawing}
          onMouseMove={drawCanvas}
          onMouseUp={stopCanvasDrawing}
          onMouseLeave={stopCanvasDrawing}
          onTouchStart={startCanvasDrawing}
          onTouchMove={drawCanvas}
          onTouchEnd={stopCanvasDrawing}
        />
        {isEmpty && !drawnSignatureData && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center pointer-events-none select-none">
            <p className="text-[11px] text-slate-400 font-medium">Sử dụng chuột, bút cảm ứng hoặc ngón tay để vẽ chữ ký của bạn vào đây...</p>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center gap-4">
        <button
          type="button"
          onClick={clearCanvasSignature}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
        >
          <X className="w-3.5 h-3.5 text-slate-500" /> Xóa nét vẽ
        </button>
        <p className="text-[9px] text-slate-400 leading-snug font-medium text-right italic max-w-xs">Chữ ký tay sẽ được lưu tự động cục bộ và kết xuất trên văn bản trình in A4.</p>
      </div>
    </div>
  );
}
