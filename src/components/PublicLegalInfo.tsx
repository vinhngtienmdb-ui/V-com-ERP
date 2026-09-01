import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  Landmark,
  User,
  ExternalLink,
  Scale,
  AlertTriangle
} from 'lucide-react';
import { getLegalEntityInfo, LegalEntityInfo, DEFAULT_LEGAL_ENTITY } from '../services/legalEntityService';

/**
 * Trang công khai thông tin sàn TMĐT — Điều 21 NĐ 52/2013/NĐ-CP
 * (sửa đổi bởi NĐ 85/2021/NĐ-CP): sàn TMĐT phải công khai trên trang chủ:
 * tên sàn, tên tổ chức, MST, địa chỉ trụ sở, GPKD, điện thoại, email,
 * chính sách giao dịch, quy trình giải quyết khiếu nại.
 *
 * Dữ liệu đọc từ tenant_settings (key 'legal_entity') — cấu hình trong
 * Settings → Tích hợp Pháp lý → Thông tin pháp nhân. Chưa cấu hình →
 * hiển thị mặc định + cảnh báo "dữ liệu chưa xác thực".
 */

const LEGAL_LINKS = [
  { title: 'Điều khoản sử dụng sàn TMĐT', url: '/legal/terms' },
  { title: 'Chính sách bảo mật dữ liệu cá nhân (Luật 86/2025)', url: '/legal/privacy' },
  { title: 'Chính sách giao dịch & thanh toán', url: '/legal/transaction-policy' },
  { title: 'Quy trình giải quyết khiếu nại, tranh chấp (Luật 36/2024)', url: '/legal/complaints' },
  { title: 'Quy trình đăng ký gian hàng', url: '/legal/seller-onboarding' },
  { title: 'Chính sách hoàn tiền & đổi trả', url: '/legal/refund-policy' }
];

export function PublicLegalInfo() {
  const [info, setInfo] = useState<LegalEntityInfo>(DEFAULT_LEGAL_ENTITY);
  const [usingDefault, setUsingDefault] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await getLegalEntityInfo();
        if (!cancelled) {
          setInfo(loaded);
          // Nếu trùng taxCode default → chưa cấu hình thật
          setUsingDefault(loaded.taxCode === DEFAULT_LEGAL_ENTITY.taxCode);
        }
      } catch {
        // giữ default
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">{info.marketplaceName}</h1>
              <p className="text-[11px] text-slate-500 mt-0.5">Thông tin công khai theo Điều 21 NĐ 52/2013/NĐ-CP</p>
            </div>
          </div>
          <a href="/" className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
            Về trang chủ <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Cảnh báo khi vẫn dùng dữ liệu mặc định chưa cấu hình */}
        {usingDefault && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 leading-relaxed">
              <p className="font-bold">Thông tin đang ở chế độ mặc định, chưa xác thực</p>
              <p className="text-[13px] mt-1">
                Quản trị sàn cần cập nhật thông tin pháp nhân thật (MST, GPKD, địa chỉ) trong
                Hệ thống → Settings → Thông tin Pháp nhân trước khi hoạt động chính thức.
              </p>
            </div>
          </div>
        )}

        {/* Thông tin pháp nhân */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center gap-2">
            <Landmark className="w-5 h-5" />
            <h2 className="text-base font-bold">Thông tin tổ chức vận hành sàn</h2>
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-x-8 gap-y-5">
            <InfoRow icon={Building2} label="Tên tổ chức" value={info.legalEntity} />
            <InfoRow icon={FileText} label="Mã số thuế" value={info.taxCode} mono />
            <InfoRow icon={MapPin} label="Địa chỉ trụ sở chính" value={info.headquarters} full />
            <InfoRow icon={FileText} label="Giấy phép đăng ký kinh doanh" value={info.businessLicense} full />
            <InfoRow icon={User} label="Người đại diện pháp luật" value={info.legalRep} />
            <InfoRow icon={FileText} label="Ngày đăng ký hoạt động" value={info.registrationDate} />
            <InfoRow icon={Phone} label="Điện thoại hỗ trợ" value={info.hotline} mono />
            <InfoRow icon={Mail} label="Email hỗ trợ" value={info.email} mono />
          </div>
        </section>

        {/* Chính sách công khai */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">Chính sách giao dịch công khai</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {LEGAL_LINKS.map(link => (
              <a
                key={link.url}
                href={link.url}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
              >
                <span className="text-sm font-medium text-slate-800 group-hover:text-primary-700">{link.title}</span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-primary-600" />
              </a>
            ))}
          </div>
        </section>

        {/* Cam kết pháp lý */}
        <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Cam kết tuân thủ pháp luật
          </h3>
          <ul className="text-[13px] text-emerald-800 space-y-2 leading-relaxed list-disc pl-5">
            <li>Hoạt động theo NĐ 52/2013/NĐ-CP và NĐ 85/2021/NĐ-CP về quản lý website TMĐT; đã thông báo với Bộ Công Thương.</li>
            <li>Bảo vệ quyền lợi người tiêu dùng theo Luật 36/2024/QH15: giữ tiền escrow, giải ngân khi giao hàng thành công, hoàn tiền khi khiếu nại hợp lệ.</li>
            <li>Bảo vệ dữ liệu cá nhân theo Luật 86/2025/QH15: thu thập khi có đồng ý, cho phép truy cập/xóa dữ liệu theo yêu cầu.</li>
            <li>Kê khai và phát hành hóa đơn điện tử theo TT 78/2021/TT-BTC.</li>
            <li>Không khấu trừ thuế TNDN/TNCN thay nhà bán hàng theo NĐ 117/2025/NĐ-CP — nhà bán tự kê khai với cơ quan thuế.</li>
          </ul>
        </section>

        <footer className="text-center text-[11px] text-slate-400 pb-8">
          <p>Bản ghi thông tin công khai này phục vụ mục đích tuân thủ pháp luật Việt Nam.</p>
          <p className="mt-1">Cập nhật lần cuối: 31/08/2026 — {info.legalEntity}</p>
        </footer>
      </main>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono, full }: {
  icon: any; label: string; value: string; mono?: boolean; full?: boolean;
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </p>
      <p className={`text-sm text-slate-900 leading-relaxed ${mono ? 'font-mono font-semibold' : 'font-medium'}`}>{value}</p>
    </div>
  );
}
