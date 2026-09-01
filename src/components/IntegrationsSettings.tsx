import React, { useState, useEffect } from 'react';
import {
  Plug, CheckCircle2, XCircle, Loader2, Save, KeyRound, ShieldAlert,
  FileText, Database, Landmark, TestTube2, Power, ExternalLink, Building2
} from 'lucide-react';
import {
  PROVIDER_SCHEMAS,
  getIntegrationConfig,
  saveIntegrationConfig,
  toggleIntegration,
  testIntegrationConnection,
  maskConfigForDisplay,
  ProviderKey,
  IntegrationConfig
} from '../services/integrationConfigService';
import {
  getLegalEntityInfo,
  saveLegalEntityInfo,
  LegalEntityInfo,
  DEFAULT_LEGAL_ENTITY
} from '../services/legalEntityService';
import { cn } from '../lib/utils';

/**
 * Settings → Integrations: quản lý API key 3 provider pháp lý
 * (E-Invoice TT78, Databank BCT, CQT/HSM). Add-key-sau: form render
 * từ PROVIDER_SCHEMAS, key bị mask khi hiển thị lại, test kết nối
 * ping health endpoint qua server proxy.
 */

const PROVIDER_ICONS: Record<ProviderKey, any> = {
  einvoice: FileText,
  databank: Database,
  cq_reporting: Landmark
};

export function IntegrationsSettings() {
  const [configs, setConfigs] = useState<Record<string, IntegrationConfig | null>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProviderKey | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<ProviderKey | null>(null);
  const [feedback, setFeedback] = useState<{ provider: ProviderKey; ok: boolean; message: string } | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const result: Record<string, IntegrationConfig | null> = {};
    for (const key of Object.keys(PROVIDER_SCHEMAS) as ProviderKey[]) {
      try {
        result[key] = await getIntegrationConfig(key);
      } catch {
        result[key] = null;
      }
    }
    setConfigs(result);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const startEdit = (provider: ProviderKey) => {
    const existing = configs[provider];
    const initial: Record<string, string> = {};
    for (const field of PROVIDER_SCHEMAS[provider].fields) {
      const current = existing?.config?.[field.name];
      // password fields: không fill lại key thật — hiển thị masked, user gõ lại nếu muốn đổi
      initial[field.name] = field.type === 'password' ? '' : String(current || '');
    }
    setFormData(initial);
    setEditing(provider);
    setFeedback(null);
  };

  const handleSave = async (provider: ProviderKey) => {
    setSaving(true);
    setFeedback(null);
    try {
      // Merge: password rỗng = giữ key cũ
      const existing = configs[provider]?.config || {};
      const merged: Record<string, any> = { ...existing };
      for (const field of PROVIDER_SCHEMAS[provider].fields) {
        const v = formData[field.name];
        if (field.type === 'password') {
          if (v) merged[field.name] = v; // chỉ ghi khi user nhập mới
        } else {
          merged[field.name] = v;
        }
      }
      await saveIntegrationConfig(provider, merged);
      await loadAll();
      setEditing(null);
      setFeedback({ provider, ok: true, message: 'Đã lưu cấu hình. Dùng "Test kết nối" để kiểm tra provider.' });
    } catch (e: any) {
      setFeedback({ provider, ok: false, message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (provider: ProviderKey) => {
    setTesting(provider);
    setFeedback(null);
    const result = await testIntegrationConnection(provider);
    setFeedback({ provider, ok: result.ok, message: result.message + (result.latency_ms ? ` (${result.latency_ms}ms)` : '') });
    setTesting(null);
    await loadAll();
  };

  const handleToggle = async (provider: ProviderKey, enabled: boolean) => {
    try {
      await toggleIntegration(provider, enabled);
      await loadAll();
    } catch (e: any) {
      setFeedback({ provider, ok: false, message: e.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-2 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" /> Đang tải cấu hình tích hợp...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header info */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
        <div className="text-sm text-primary-800 leading-relaxed">
          <p className="font-bold">Tích hợp Pháp lý — add API key khi sẵn sàng</p>
          <p className="text-[13px] mt-1 text-primary-700">
            Key được lưu trong bảng <code className="font-mono text-xs bg-primary-100 px-1 rounded">integration_configs</code> (Supabase)
            và chỉ server proxy sử dụng — không nằm trong client bundle.
            Chưa cấu hình thì tính năng tự tắt an toàn kèm hướng dẫn; test kết nối trước khi bật.
          </p>
        </div>
      </div>

      <LegalEntityForm />

      {(Object.keys(PROVIDER_SCHEMAS) as ProviderKey[]).map(provider => {
        const schema = PROVIDER_SCHEMAS[provider];
        const cfg = configs[provider];
        const Icon = PROVIDER_ICONS[provider];
        const isEditing = editing === provider;

        return (
          <div key={provider} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            {/* Provider header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-slate-700" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">{schema.label}</h3>
                  <p className="text-[11px] text-slate-500">{schema.legalBasis}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Status badge */}
                {cfg?.last_test_status === 'ok' && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> ĐÃ KẾT NỐI
                  </span>
                )}
                {cfg?.last_test_status === 'error' && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-md" title={cfg.last_test_message || ''}>
                    <XCircle className="w-3 h-3" /> LỖI KẾT NỐI
                  </span>
                )}
                {!cfg?.is_enabled && (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">CHƯA KÍCH HOẠT</span>
                )}
                {/* Toggle */}
                {cfg && (
                  <button
                    onClick={() => handleToggle(provider, !cfg.is_enabled)}
                    disabled={isEditing}
                    className={cn(
                      'relative w-10 h-5 rounded-full transition-colors',
                      cfg.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'
                    )}
                    title={cfg.is_enabled ? 'Đang bật — click để tắt' : 'Đang tắt — click để bật'}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all',
                      cfg.is_enabled ? 'left-5' : 'left-0.5'
                    )} />
                  </button>
                )}
                {/* Actions */}
                {!isEditing ? (
                  <>
                    <button onClick={() => startEdit(provider)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all">
                      <KeyRound className="w-3.5 h-3.5" /> {cfg ? 'Sửa' : 'Thêm key'}
                    </button>
                    {cfg && (
                      <button onClick={() => handleTest(provider)} disabled={testing === provider}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50">
                        {testing === provider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube2 className="w-3.5 h-3.5" />} Test
                      </button>
                    )}
                  </>
                ) : (
                  <button onClick={() => { setEditing(null); setFeedback(null); }}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg">Đóng</button>
                )}
              </div>
            </div>

            {/* Form editing */}
            {isEditing && (
              <div className="px-5 py-4 bg-slate-50/50 space-y-3">
                {schema.fields.map(field => (
                  <div key={field.name}>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
                      value={formData[field.name] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={
                        field.type === 'password' && cfg?.config?.[field.name]
                          ? '•••• (đã lưu — nhập mới để thay đổi)'
                          : field.placeholder
                      }
                      className={cn(
                        'w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/30',
                        field.type === 'password' ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-300'
                      )}
                    />
                    {field.helpText && <p className="text-[11px] text-slate-400 mt-1">{field.helpText}</p>}
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => handleSave(provider)} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu cấu hình
                  </button>
                </div>
              </div>
            )}

            {/* Saved config summary (masked) */}
            {!isEditing && cfg && Object.keys(cfg.config).length > 0 && (
              <div className="px-5 py-3 bg-slate-50/50 grid md:grid-cols-2 gap-x-6 gap-y-1.5 text-[12px]">
                {Object.entries(maskConfigForDisplay(cfg.config)).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 border-b border-slate-200/60 pb-1">
                    <span className="text-slate-500 font-medium shrink-0">{k}</span>
                    <span className="font-mono text-slate-800 truncate">{String(v)}</span>
                  </div>
                ))}
                {cfg.last_tested_at && (
                  <div className="md:col-span-2 text-[11px] text-slate-400 pt-1">
                    Kiểm tra lần cuối: {new Date(cfg.last_tested_at).toLocaleString('vi-VN')}
                    {cfg.last_test_message ? ` — ${cfg.last_test_message}` : ''}
                  </div>
                )}
              </div>
            )}

            {/* Feedback cho provider này */}
            {feedback?.provider === provider && (
              <div className={cn(
                'px-5 py-2.5 text-xs font-medium flex items-center gap-2',
                feedback.ok ? 'bg-emerald-50 text-emerald-700 border-t border-emerald-200' : 'bg-rose-50 text-rose-700 border-t border-rose-200'
              )}>
                {feedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                {feedback.message}
              </div>
            )}
          </div>
        );
      })}

      {/* Footer: nơi đăng ký provider */}
      <div className="bg-slate-900 rounded-lg p-4 text-slate-300 text-[12px] leading-relaxed flex items-start gap-3">
        <ExternalLink className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-white">Đăng ký nhà cung cấp:</p>
          <p className="mt-1">• <span className="font-semibold">E-Invoice</span>: MISA eInvoice / VNPT Invoice / FPT.eInvoice — cần MST + đăng ký mẫu BC22 với CQT trước khi add key.</p>
          <p>• <span className="font-semibold">Databank BCT</span>: đăng ký tài khoản tại cổng thông tin Bộ Công Thương (moit.gov.vn).</p>
          <p>• <span className="font-semibold">HSM</span>: hợp đồng CA tổ chức (VNPT-CA, FPT-CA...) + thiết bị HSM hoặc HSMaaS.</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Form thông tin pháp nhân — Single Source of Truth cho Điều 21 NĐ 52 (trang
 * công khai /legal-info) + MST trên hóa đơn điện tử TT 78. Sửa 1 nơi dùng mọi nơi.
 */
function LegalEntityForm() {
  const [info, setInfo] = useState<LegalEntityInfo>(DEFAULT_LEGAL_ENTITY);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editingInfo, setEditingInfo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await getLegalEntityInfo();
        if (!cancelled) setInfo(loaded);
      } finally {
        if (!cancelled) setLoadingInfo(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isDefault = info.taxCode === DEFAULT_LEGAL_ENTITY.taxCode;

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    setInfoMsg(null);
    try {
      const saved = await saveLegalEntityInfo(info);
      setInfo(saved);
      setInfoMsg({ ok: true, text: 'Đã lưu. Thông tin này sẽ hiển thị trên trang công khai /legal-info và in trên hóa đơn điện tử.' });
      setEditingInfo(false);
    } catch (e: any) {
      setInfoMsg({ ok: false, text: e.message });
    } finally {
      setSavingInfo(false);
    }
  };

  const FIELDS: Array<{ key: keyof LegalEntityInfo; label: string; full?: boolean; mono?: boolean }> = [
    { key: 'marketplaceName', label: 'Tên sàn TMĐT' },
    { key: 'legalEntity', label: 'Tên pháp nhân (công ty)' },
    { key: 'taxCode', label: 'Mã số thuế', mono: true },
    { key: 'businessLicense', label: 'Giấy phép đăng ký kinh doanh', full: true },
    { key: 'headquarters', label: 'Địa chỉ trụ sở chính', full: true },
    { key: 'legalRep', label: 'Người đại diện pháp luật' },
    { key: 'registrationDate', label: 'Ngày đăng ký hoạt động' },
    { key: 'hotline', label: 'Hotline hỗ trợ', mono: true },
    { key: 'email', label: 'Email hỗ trợ', mono: true }
  ];

  if (loadingInfo) {
    return <div className="bg-white border border-slate-200 rounded-lg p-5 text-sm text-slate-400">Đang tải thông tin pháp nhân...</div>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-slate-700" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">Thông tin Pháp nhân công ty</h3>
            <p className="text-[11px] text-slate-500">Điều 21 NĐ 52/2013 + MST trên hóa đơn điện tử TT 78/2021 — cấu hình 1 lần dùng toàn hệ thống</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDefault && (
            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
              CHƯA CẬP NHẬT MÃ SỐ THUẾ THẬT
            </span>
          )}
          {!editingInfo ? (
            <button onClick={() => setEditingInfo(true)}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all">
              Chỉnh sửa
            </button>
          ) : (
            <button onClick={() => { setEditingInfo(false); setInfoMsg(null); }}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg">
              Đóng
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4 bg-slate-50/50 grid md:grid-cols-2 gap-x-6 gap-y-3">
        {FIELDS.map(f => (
          <div key={f.key} className={f.full ? 'md:col-span-2' : ''}>
            <label className="block text-[10px] text-slate-500 mb-1">{f.label}</label>
            {editingInfo ? (
              <input
                type="text"
                value={String(info[f.key] || '')}
                onChange={e => setInfo(prev => ({ ...prev, [f.key]: e.target.value } as LegalEntityInfo))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            ) : (
              <p className={cn('text-sm text-slate-900 leading-relaxed', f.mono && 'font-mono font-semibold')}>
                {String(info[f.key] || '—')}
              </p>
            )}
          </div>
        ))}
      </div>

      {editingInfo && (
        <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
          <button onClick={handleSaveInfo} disabled={savingInfo}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all disabled:opacity-50">
            {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu thông tin pháp nhân
          </button>
        </div>
      )}

      {infoMsg && (
        <div className={cn(
          'px-5 py-2.5 text-xs font-medium flex items-center gap-2',
          infoMsg.ok ? 'bg-emerald-50 text-emerald-700 border-t border-emerald-200' : 'bg-rose-50 text-rose-700 border-t border-rose-200'
        )}>
          {infoMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {infoMsg.text}
        </div>
      )}
    </div>
  );
}
