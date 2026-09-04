import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { summarizeDelegationNotice, type DelegationRecord } from '../services/einvoiceService';

/**
 * Banner thông báo ủy nhiệm phát hành HĐĐT (TT 91/2026 Điều 9.1.đ).
 * Hiển thị công khai trên gian hàng TRƯỚC khi khách đặt hàng — không được ẩn sau tooltip/modal.
 */
export function DelegationNotice({ delegation }: { delegation: DelegationRecord }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
      <BadgeCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
      <div className="text-xs text-blue-900 leading-relaxed">
        <p className="font-bold mb-0.5">Thông báo ủy nhiệm phát hành hóa đơn điện tử</p>
        <p>{summarizeDelegationNotice(delegation)}</p>
        <p className="text-[10px] text-blue-500 mt-1">
          Theo TT 91/2026/TT-BTC Điều 9.1.đ — hiển thị trước khi khách đặt hàng.
        </p>
      </div>
    </div>
  );
}
