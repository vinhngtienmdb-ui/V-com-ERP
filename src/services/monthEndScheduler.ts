/**
 * monthEndScheduler.ts — Lập lịch trích khấu hao TSCĐ cuối tháng
 * ==============================================================
 *
 * ⭐ VÌ SAO CHẠY Ở TRÌNH DUYỆT, KHÔNG PHẢI CRON TRÊN SERVER?
 *
 *  Câu trả lời nằm ở DEMO_MODE. `dbService.ts` có:
 *      export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';
 *  `server.ts` được bundle bằng esbuild sang CJS, mà trong CJS **`import.meta`
 *  không tồn tại** → `import.meta.env` là `undefined` → `undefined !== 'false'`
 *  → **DEMO_MODE = true**. Nghĩa là mọi cron chạy trên server mà gọi dbService
 *  sẽ âm thầm làm việc trong CHẾ ĐỘ DEMO. Với khấu hao — thứ ảnh hưởng trực
 *  tiếp BCTC và khấu trừ thuế TNDN — đó là rủi ro không thể chấp nhận.
 *
 *  Lý do y hệt đã khiến outbox worker phải chạy ở browser
 *  (xem `services/outboxWorker.ts`). Nhất quán với quyết định đó.
 *
 * ⭐ VÌ SAO AN TOÀN KHI GỌI LẶP? (idempotency)
 *
 *  Mọi chứng từ sinh ra đều có ID CỐ ĐỊNH theo kỳ (`KH-<assetId>-<period>`,
 *  hoặc `KH-TONG-<period>` nếu gộp). `SupabaseAdapter.saveJournalEntry()` làm
 *  upsert rồi DELETE+INSERT lại items → gọi lặp THAY THẾ chứng từ cũ chứ không
 *  sinh chứng từ thứ hai. Vì vậy mở app nhiều lần trong tháng không sinh bút
 *  toán trùng. Đây là tính chất đã có sẵn của tầng adapter, không cần đọc trước
 *  khi ghi.
 *
 * ⭐ KHÔNG fail-fast: `runMonthlyDepreciation` đã chủ ý không dừng giữa chừng
 *  khi một tài sản lỗi (ghi vào `skipped`). Scheduler giữ nguyên triết lý đó:
 *  báo cáo đầy đủ, không ném, để người dùng thấy cả bức tranh.
 */

import { createLogger } from '../lib/logger';
import {
  runMonthlyDepreciation,
  consolidateDepreciationEntries,
  type DepreciationRunResult,
} from './depreciationRunService';
import type { FixedAsset, JournalEntryDraft } from './fixedAssetService';

const log = createLogger('services/monthEndScheduler');

/** Bảng ghi dấu "kỳ này đã chạy chưa" — tránh chạy lại mỗi lần mở app. */
export const MONTH_END_RUNS_TABLE = 'month_end_runs';

export interface MonthEndRunRecord {
  id: string;
  period: string;
  tenantId: string;
  ranAt: string;
  entryCount: number;
  totalAmount: number;
  skippedCount: number;
  warnings: string[];
}

export interface MonthEndResult {
  /** Kỳ được xử lý (yyyy-mm). */
  period: string;
  /** `true` = kỳ này đã có người chạy trước đó → bỏ qua, không ghi gì. */
  alreadyRun: boolean;
  /** Kết quả thô từ engine khấu hao (khi đã chạy). */
  run?: DepreciationRunResult;
  /** Chứng từ đã ghi (đã gộp nếu `consolidate`). */
  savedEntryIds: string[];
  /** Lỗi nghiêm trọng khiến cả kỳ không chạy được (vd: không tải được TSCĐ). */
  error?: string;
}

export interface MonthEndDeps {
  /** Tải danh sách TSCĐ của tenant. Ném = cả kỳ thất bại, có `error`. */
  loadAssets: (tenantId: string) => Promise<FixedAsset[]>;
  /** Ghi một chứng từ. Ném = chứng từ đó được ghi vào `skipped`. */
  saveEntry: (entry: JournalEntryDraft) => Promise<void>;
  /** Đọc bản ghi đã chạy của kỳ; `null` = chưa chạy. */
  getRun: (period: string, tenantId: string) => Promise<MonthEndRunRecord | null>;
  /** Ghi dấu đã chạy. Lỗi ở đây KHÔNG được huỷ kết quả đã ghi sổ. */
  markRun: (record: MonthEndRunRecord) => Promise<void>;
  now?: () => Date;
  /** Gộp N chứng từ thành 1 chứng từ tổng hợp (mặc định `true`). */
  consolidate?: boolean;
  /** Bắt buộc chạy lại dù đã có bản ghi — dùng khi admin muốn chạy lại. */
  force?: boolean;
}

/** '2026-09-03' → '2026-09'. Dùng cho kỳ HIỆN TẠI. */
export function periodOf(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Kỳ cần trích khi chạy vào thời điểm `date` = **tháng đã kết thúc gần nhất**,
 * tức luôn là tháng TRƯỚC tháng hiện tại.
 *
 *  Vì sao không có ngoại lệ "đang là ngày cuối tháng thì trích tháng hiện tại"?
 *  Vì `computeMonthlyDepreciation(asset, asOf)` trả **TRỌN THÁNG**, không chia
 *  theo số ngày (đúng chuẩn VN: tháng phát sinh thì tính trọn tháng). Chạy lúc
 *  31/10 09:00 mà trích tháng 10 → ghi nhận một tháng khấu hao cho tháng chưa
 *  kết thúc → **khống chi phí, sai BCTC và sai khấu trừ thuế TNDN**.
 *
 *  Ví dụ: chạy 05/10 → `2026-09` · chạy 31/10 23:59 → `2026-09` ·
 *         chạy 01/11 00:05 → `2026-10`.
 */
export function periodToRun(date: Date): string {
  // Ngày 1 của tháng hiện tại trừ 1 tháng = tháng trước (JS tự xử lý tháng 0).
  const prev = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
  return periodOf(prev);
}

/**
 * Chạy trích khấu hao cuối tháng cho một tenant.
 *
 *  Không bao giờ ném — nghiệp vụ cuối tháng mà ném thì người dùng không biết
 *  chuyện gì đã xảy ra. Mọi lỗi được gom vào `result.error` / `run.skipped`.
 */
export async function runMonthEndDepreciation(
  deps: MonthEndDeps,
  tenantId: string,
  at?: Date,
): Promise<MonthEndResult> {
  const now = at ?? (deps.now ? deps.now() : new Date());
  const period = periodToRun(now);
  const consolidate = deps.consolidate !== false;

  // 1. Chặn chạy lại — trừ khi có `force`.
  if (!deps.force) {
    try {
      const existing = await deps.getRun(period, tenantId);
      if (existing) {
        log.info('kỳ đã chạy trước đó → bỏ qua', { period, tenantId, ranAt: existing.ranAt });
        return { period, alreadyRun: true, savedEntryIds: [] };
      }
    } catch (e) {
      // Không đọc được bản ghi (bảng `month_end_runs` chưa được tạo, mất mạng…)
      // → VẪN CHẠY, chỉ cảnh báo.
      //
      // Lý do chọn "chạy" thay vì "dừng": chứng từ có ID CỐ ĐỊNH theo kỳ, nên
      // `saveJournalEntry` (upsert + DELETE/INSERT items) sẽ THAY THẾ chứng từ
      // cũ chứ không sinh bút toán thứ hai. Chạy lại không sinh sai số.
      // Dừng lại ở đây thì hậu quả tệ hơn: bảng dấu vết chưa tạo mà không ai
      // phát hiện → khấu hao KHÔNG BAO GIỜ được trích, BCTC và thuế TNDN sai.
      log.warn(
        `không đọc được trạng thái kỳ ${period} → vẫn chạy (id chứng từ cố định nên an toàn)`,
        { period, tenantId },
        e
      );
    }
  }

  // 2. Tải danh sách TSCĐ.
  let assets: FixedAsset[];
  try {
    assets = await deps.loadAssets(tenantId);
  } catch (e) {
    const msg = `Không tải được danh sách tài sản cố định cho kỳ ${period}.`;
    log.error(msg, { period, tenantId }, e);
    return { period, alreadyRun: false, savedEntryIds: [], error: msg };
  }

  // 3. Chạy engine (không fail-fast).
  const run = runMonthlyDepreciation(assets, period, tenantId);

  // 4. Ghi sổ. Lỗi từng chứng từ được gom, KHÔNG dừng các chứng từ còn lại.
  const savedEntryIds: string[] = [];
  const failed: Array<{ entryId: string; reason: string }> = [];

  const toSave: JournalEntryDraft[] = (() => {
    if (!consolidate || run.entries.length === 0) return run.entries;
    try {
      return [consolidateDepreciationEntries(run, { tenantId, date: lastDayOf(period) })];
    } catch (e) {
      // Gộp lỗi → ghi từng chứng từ riêng (vẫn đúng, chỉ không gọn).
      log.warn('gộp chứng từ thất bại → ghi từng chứng từ riêng', { period, tenantId }, e);
      return run.entries;
    }
  })();

  for (const entry of toSave) {
    try {
      await deps.saveEntry(entry);
      savedEntryIds.push(entry.id);
    } catch (e) {
      failed.push({ entryId: entry.id, reason: (e as Error)?.message || String(e) });
    }
  }

  if (failed.length) {
    log.error('một số chứng từ khấu hao KHÔNG ghi được', { period, tenantId, failed });
  }

  // 5. Ghi dấu đã chạy CHỈ KHI ghi được ít nhất một chứng từ.
  //    Nếu ghi dấu khi chưa ghi được gì, lần mở app sau sẽ bỏ qua luôn kỳ này.
  if (savedEntryIds.length > 0) {
    const record: MonthEndRunRecord = {
      id: `${tenantId}-${period}`, // id cố định → idempotent
      period,
      tenantId,
      ranAt: now.toISOString(),
      entryCount: savedEntryIds.length,
      totalAmount: run.totalAmount,
      skippedCount: run.skipped.length + failed.length,
      warnings: [...run.warnings, ...failed.map((f) => `Ghi sổ thất bại ${f.entryId}: ${f.reason}`)],
    };
    try {
      await deps.markRun(record);
    } catch (e) {
      // Chứng từ ĐÃ ghi sổ thành công; chỉ mỗi dấu vết bị lỗi. Không được huỷ
      // kết quả. Cảnh báo ở mức error vì lần chạy sau sẽ ghi đè chứng từ.
      log.error('đã ghi sổ nhưng không lưu được dấu vết — lần chạy sau sẽ GHI ĐÈ', { period, tenantId }, e);
    }
  }

  return { period, alreadyRun: false, run, savedEntryIds };
}

/** Ngày cuối tháng của kỳ, dạng yyyy-mm-dd (UTC). */
export function lastDayOf(period: string): string {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 0));
  return d.toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/*  Deps thật (nối vào dbService)                                             */
/* -------------------------------------------------------------------------- */

/**
 * Deps dùng `dbService` thật. Import ĐỘNG (`await import`) theo đúng quy ước dự
 * án: `dbService → lib/supabase.ts` đọc `import.meta.env`, nên import tĩnh sẽ
 * kéo theo cả cây này vào mọi nơi dùng scheduler (kể cả test).
 *
 * @param tenantId mặc định đúng tenant production của VComm.
 */
export function defaultMonthEndDeps(tenantId = 'tenant-vcomm-prod-01'): MonthEndDeps {
  return {
    async loadAssets(currentTenant: string): Promise<FixedAsset[]> {
      const db = await import('./dbService');
      const snap = await db.getDocs(db.collection(db.db, 'fixed_assets'));
      const rows: FixedAsset[] = [];
      snap.forEach?.((d: any) => rows.push({ id: d.id, ...(d.data?.() ?? {}) } as FixedAsset));
      // Lọc thêm theo tenant ở phía client — RLS đã chặn ở server, nhưng không
      // nên tin hoàn toàn vào filter ngầm nếu bảng lỡ thiếu policy.
      return rows.filter((a: any) => !a.tenantId || a.tenantId === currentTenant);
    },

    async saveEntry(entry: JournalEntryDraft): Promise<void> {
      const db = await import('./dbService');
      await db.setDoc(db.doc(db.db, 'journal_entries', entry.id), {
        ...entry,
        tenant_id: entry.tenantId,
      });
    },

    async getRun(period: string, currentTenant: string): Promise<MonthEndRunRecord | null> {
      const db = await import('./dbService');
      const snap = await db.getDoc(db.doc(db.db, MONTH_END_RUNS_TABLE, `${currentTenant}-${period}`));
      if (!snap?.exists?.()) return null;
      return snap.data?.() as MonthEndRunRecord;
    },

    async markRun(record: MonthEndRunRecord): Promise<void> {
      const db = await import('./dbService');
      await db.setDoc(db.doc(db.db, MONTH_END_RUNS_TABLE, record.id), record);
    },

    consolidate: true,
    force: false,
  };
}

/**
 * Chạy cuối tháng với deps thật. Bọc try/catch để lỗi bất ngờ cũng không làm
 * sập app — khấu hao là việc nền, không phải việc chặn người dùng.
 */
export async function runMonthEndDepreciationLive(
  tenantId = 'tenant-vcomm-prod-01',
): Promise<MonthEndResult> {
  try {
    return await runMonthEndDepreciation(defaultMonthEndDeps(tenantId), tenantId);
  } catch (e) {
    log.error('lỗi không lường trước khi chạy khấu hao cuối tháng', { tenantId }, e);
    return {
      period: periodToRun(new Date()),
      alreadyRun: false,
      savedEntryIds: [],
      error: (e as Error)?.message || String(e),
    };
  }
}
