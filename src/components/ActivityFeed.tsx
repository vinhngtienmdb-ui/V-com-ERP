import React, { useEffect, useState } from 'react';
import { db, collection, query, orderBy, limit, onSnapshot, Timestamp } from '../services/dbService';
import { Activity, X, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface LogEntry {
  id: string;
  action: string;
  targetLabel?: string;
  actorName?: string;
  actorEmail?: string;
  timestamp?: Timestamp;
  path?: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'order.status_changed':        { label: 'CẬP NHẬT ĐH',    color: 'text-blue-700 bg-primary-50 border-blue-200' },
  'order.created':               { label: 'TẠO ĐH',         color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  'finance.transaction_created': { label: 'TÀI CHÍNH',      color: 'text-violet-700 bg-violet-50 border-violet-200' },
  'product.created':             { label: 'THÊM SP',        color: 'text-teal-700 bg-teal-50 border-teal-200' },
  'product.updated':             { label: 'SỬA SP',         color: 'text-teal-700 bg-teal-50 border-teal-200' },
  'settings.updated':            { label: 'CÀI ĐẶT',       color: 'text-primary-600 bg-orange-50 border-orange-200' },
  'site_config.updated':         { label: 'CẤU HÌNH',      color: 'text-primary-600 bg-orange-50 border-orange-200' },
  'request.submitted':           { label: 'GỬI ĐX',        color: 'text-amber-700 bg-amber-50 border-amber-200' },
  'request.approved':            { label: 'PHÊ DUYỆT',     color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  'request.rejected':            { label: 'TỪ CHỐI',       color: 'text-red-700 bg-red-50 border-red-200' },
  'hr.staff_created':            { label: 'THÊM NV',       color: 'text-rose-700 bg-rose-50 border-rose-200' },
};

function getActionInfo(action: string) {
  return ACTION_LABELS[action] ?? { label: action.replace(/\./g, ' › '), color: 'text-slate-600 bg-slate-50' };
}

interface Props { onClose: () => void; }

export function ActivityFeed({ onClose }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as LogEntry)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-end"
      style={{ background: 'rgba(9,11,17,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-sm bg-white border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-250"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">Audit Log</span>
            <span className="font-mono text-[9px] border border-emerald-200 bg-emerald-50 text-emerald-700 px-1.5 py-0.5">LIVE</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="skeleton h-3 w-3/4" />
                  <div className="skeleton h-2.5 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="empty-state">
              <Activity />
              <h3>Chưa có hoạt động</h3>
              <p>Các hành động của team sẽ xuất hiện ở đây theo thời gian thực.</p>
            </div>
          )}

          {!loading && entries.length > 0 && (
            <div className="divide-y divide-slate-100">
              {entries.map(entry => {
                const { label, color } = getActionInfo(entry.action);
                const ts = entry.timestamp?.toDate?.();
                const name = entry.actorName ?? entry.actorEmail ?? 'System';
                const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={entry.id} className="flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    {/* Avatar */}
                    <div className="w-7 h-7 bg-[#1E293B] flex items-center justify-center text-white shrink-0">
                      <span className="font-mono text-[10px] font-bold">{initials || '?'}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] font-bold text-slate-800 truncate leading-snug">{name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={cn('font-mono text-[9px] font-bold px-1.5 py-0.5 border', color)}>{label}</span>
                            {entry.targetLabel && (
                              <span className="font-mono text-[10px] text-slate-500 truncate max-w-[130px]">{entry.targetLabel}</span>
                            )}
                          </div>
                        </div>
                        {ts && (
                          <span className="font-mono text-[9px] text-slate-400 shrink-0 flex items-center gap-0.5 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDistanceToNow(ts, { addSuffix: true, locale: vi })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 shrink-0">
          <p className="font-mono text-[9px] text-slate-400 text-center tracking-wider">50 RECORDS · REALTIME SYNC</p>
        </div>
      </div>
    </div>
  );
}
