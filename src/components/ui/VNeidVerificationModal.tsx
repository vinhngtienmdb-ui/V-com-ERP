import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ShieldCheck, QrCode, ScanFace, CheckCircle2, User, CreditCard, Calendar, Smartphone } from 'lucide-react';

export interface VNeidData {
  idNumber: string;
  fullName: string;
  dob: string;
  address: string;
}

export interface VNeidVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: VNeidData) => void;
  targetName?: string;
  targetId?: string;
}

export function VNeidVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  targetName = 'Đối tác',
  targetId
}: VNeidVerificationModalProps) {
  const [step, setStep] = useState<'qr' | 'scanning' | 'result'>('qr');
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('qr');
    }
  }, [isOpen]);

  const handleSimulateScan = () => {
    setStep('scanning');
    setTimeout(() => {
      setStep('result');
    }, 2000);
  };

  const handleConfirm = () => {
    // Generate dummy verified data
    const verifiedData: VNeidData = {
      idNumber: '001090' + Math.floor(100000 + Math.random() * 900000),
      fullName: targetName !== 'Đối tác' ? targetName : 'NGUYỄN VĂN A',
      dob: '01/01/1990',
      address: 'Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'
    };
    onSuccess(verifiedData);
  };

  const renderContent = () => {
    switch (step) {
      case 'qr':
        return (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Quét mã QR bằng ứng dụng VNeID</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Mở ứng dụng VNeID trên điện thoại của {targetName}, chọn tính năng Quét mã để chia sẻ thông tin định danh điện tử.
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-xl shadow-sm border-2 border-dashed border-slate-300 relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-600 -translate-x-1 -translate-y-1 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-600 translate-x-1 -translate-y-1 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-600 -translate-x-1 translate-y-1 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-600 translate-x-1 translate-y-1 rounded-br-lg" />
              
              <QrCode className="w-48 h-48 text-slate-800" strokeWidth={1} />
            </div>

            <button 
              onClick={handleSimulateScan}
              className="mt-4 bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <ScanFace className="w-4 h-4" />
              Giả lập đã quét thành công
            </button>
          </div>
        );

      case 'scanning':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center relative">
              <div className="absolute inset-0 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <ShieldCheck className="w-8 h-8 text-primary-600" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900">Đang kết nối hệ thống C06...</h3>
              <p className="text-sm text-slate-500">Vui lòng đợi trong giây lát</p>
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="py-4 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900">Xác thực VNeID thành công</h3>
                <p className="text-sm text-emerald-700">Dữ liệu đã được đối khớp với cơ sở dữ liệu quốc gia về dân cư.</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center">
                <span>Thông tin chia sẻ từ VNeID</span>
                <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-500 font-mono">Mức 2</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3"/> Họ và Tên</span>
                  <p className="font-bold text-slate-900 uppercase">{targetName !== 'Đối tác' ? targetName : 'NGUYỄN VĂN A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><CreditCard className="w-3 h-3"/> Số CCCD</span>
                  <p className="font-medium text-slate-900">001090{Math.floor(100000 + Math.random() * 900000)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3"/> Ngày sinh</span>
                  <p className="font-medium text-slate-900">01/01/1990</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Smartphone className="w-3 h-3"/> Số điện thoại</span>
                  <p className="font-medium text-slate-900">090****123</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary-700">
          <ShieldCheck className="w-5 h-5" />
          <span>Xác thực định danh điện tử VNeID</span>
        </div>
      }
      maxWidth="md"
      hideFooter={step !== 'result'}
      confirmText="Lưu dữ liệu & Hoàn tất"
      onConfirm={handleConfirm}
      confirmVariant="success"
    >
      {renderContent()}
    </Modal>
  );
}
