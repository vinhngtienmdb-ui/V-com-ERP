/**
 * DỊCH VỤ SINH BÚT TOÁN TỰ ĐỘNG & OUTBOX WORKER (PHASE 5 - BƯỚC I5)
 * Căn cứ: 13_PLAYBOOK_TRIEN_KHAI.md (§PHASE 5, I5), 04_PROMPTS_TICH_HOP_ERP.md §9
 * Thực hiện: Transactional Outbox, Lũy đẳng (Idempotency), Bút toán đảo (Reversal), Dead-letter
 */

import { thucThiQuyTacHachToan, BienNghiepVu, KetQuaSinhButToan } from './ruleEngine';

export interface OutboxEvent {
  id: string;
  sourceSystem: string; // 'VCOMM_ERP', 'IPOS', 'ECOMMERCE', 'WMS'
  sourceDocType: string; // 'ORDER', 'INVENTORY_ISSUE', 'PO', 'PAYROLL'
  sourceDocId: string;
  sourceDocNo: string;
  sourceVersion: number;
  eventName: string; // 'ORDER_PAID', 'GOODS_ISSUED', 'ORDER_CANCELLED', etc.
  payload: BienNghiepVu;
  trangThai: 'PENDING' | 'PROCESSED' | 'FAILED' | 'DEAD_LETTER';
  soLanThu: number;
  maxRetries: number;
  loiCuoiCung?: string;
  createdAt: string;
  processedAt?: string;
}

export interface ChungTuGhiSo {
  id: string;
  soChungTu: string;
  ngayHachToan: string;
  loaiChungTu: string;
  sourceSystem: string;
  sourceDocType: string;
  sourceDocId: string;
  sourceDocNo: string;
  sourceVersion: number;
  autoPosted: boolean;
  postingRuleId?: string;
  reversalOfId?: string;
  tongTien: number;
  trangThai: 'DA_GHI_SO' | 'BO_GHI_SO';
  dongHachToan: {
    tkNo: string;
    tkCo: string;
    soTien: number;
    dienGiai: string;
    doiTuongId?: string;
    khoId?: string;
  }[];
}

export interface AutoPostingState {
  processedKeys: Set<string>; // source_system:source_doc_type:source_doc_id:source_version
  postedVouchers: Map<string, ChungTuGhiSo>;
  deadLetterQueue: OutboxEvent[];
}

export class AutoPostingService {
  private state: AutoPostingState = {
    processedKeys: new Set(),
    postedVouchers: new Map(),
    deadLetterQueue: []
  };

  /**
   * Tạo khóa lũy đẳng duy nhất (IR-02)
   */
  public generateIdempotencyKey(event: OutboxEvent): string {
    return `${event.sourceSystem}:${event.sourceDocType}:${event.sourceDocId}:${event.sourceVersion}`;
  }

  /**
   * Xử lý một sự kiện từ Outbox
   */
  public processOutboxEvent(event: OutboxEvent): {
    thanhCong: boolean;
    chungTu?: ChungTuGhiSo;
    loi?: string;
    daTonTai?: boolean;
  } {
    const key = this.generateIdempotencyKey(event);

    // 1. Kiểm tra Lũy đẳng (IR-02: Bỏ qua nếu đã xử lý thành công phiên bản này)
    if (this.state.processedKeys.has(key)) {
      const existing = this.state.postedVouchers.get(key);
      return {
        thanhCong: true,
        daTonTai: true,
        chungTu: existing
      };
    }

    // 2. Xử lý trường hợp hủy chứng từ nguồn -> Sinh bút toán ĐẢO (IR-04)
    if (event.eventName.endsWith('_CANCELLED') || event.eventName.endsWith('_RETURNED')) {
      return this.handleReversal(event, key);
    }

    // 3. Thực thi sinh bút toán qua Rule Engine
    const res: KetQuaSinhButToan = thucThiQuyTacHachToan(event.eventName, event.payload);

    if (!res.thanhCong || !res.canDoi) {
      event.soLanThu += 1;
      event.loiCuoiCung = res.loi?.join('; ') || 'Quy tắc sinh bút toán không cân đối.';

      if (event.soLanThu >= event.maxRetries) {
        event.trangThai = 'DEAD_LETTER';
        this.state.deadLetterQueue.push(event);
      } else {
        event.trangThai = 'FAILED';
      }

      return {
        thanhCong: false,
        loi: event.loiCuoiCung
      };
    }

    // 4. Tạo chứng từ ghi sổ tự động (IR-01, IR-07, IR-08)
    const newVoucher: ChungTuGhiSo = {
      id: `CT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      soChungTu: `PKT-${event.sourceDocNo}`,
      ngayHachToan: new Date().toISOString().split('T')[0],
      loaiChungTu: 'PKT',
      sourceSystem: event.sourceSystem,
      sourceDocType: event.sourceDocType,
      sourceDocId: event.sourceDocId,
      sourceDocNo: event.sourceDocNo,
      sourceVersion: event.sourceVersion,
      autoPosted: true,
      tongTien: res.tongNo,
      trangThai: 'DA_GHI_SO',
      dongHachToan: res.dongHachToan.map(d => ({
        tkNo: d.tkNo,
        tkCo: d.tkCo,
        soTien: d.soTien,
        dienGiai: d.dienGiai,
        doiTuongId: d.doiTuongId,
        khoId: d.khoId
      }))
    };

    // Đánh dấu thành công
    event.trangThai = 'PROCESSED';
    event.processedAt = new Date().toISOString();
    this.state.processedKeys.add(key);
    this.state.postedVouchers.set(key, newVoucher);

    return {
      thanhCong: true,
      chungTu: newVoucher
    };
  }

  /**
   * Sinh bút toán đảo khi chứng từ nguồn bị hủy (IR-04)
   * Giữ nguyên bút toán gốc, sinh bút toán đối nghịch để triệt tiêu số dư
   */
  private handleReversal(event: OutboxEvent, currentKey: string): {
    thanhCong: boolean;
    chungTu?: ChungTuGhiSo;
    loi?: string;
  } {
    // Tìm chứng từ gốc ở phiên bản trước
    const originalKey = `${event.sourceSystem}:${event.sourceDocType}:${event.sourceDocId}:${event.sourceVersion - 1}`;
    const originalVoucher = this.state.postedVouchers.get(originalKey);

    if (!originalVoucher) {
      // Nếu không tìm thấy bằng key version - 1, tìm kiếm theo sourceDocId
      let found: ChungTuGhiSo | undefined;
      for (const [k, v] of this.state.postedVouchers.entries()) {
        if (v.sourceDocId === event.sourceDocId && !v.reversalOfId) {
          found = v;
          break;
        }
      }

      if (!found) {
        event.trangThai = 'DEAD_LETTER';
        event.loiCuoiCung = `Không tìm thấy chứng từ kế toán gốc cho chứng từ nguồn ${event.sourceDocNo} để đảo.`;
        this.state.deadLetterQueue.push(event);
        return { thanhCong: false, loi: event.loiCuoiCung };
      }
    }

    const targetVoucher = originalVoucher || Array.from(this.state.postedVouchers.values()).find(v => v.sourceDocId === event.sourceDocId)!;

    // Đảo ngược Nợ và Có của từng dòng
    const reversedLines = targetVoucher.dongHachToan.map(line => ({
      tkNo: line.tkCo, // Đảo Có thành Nợ
      tkCo: line.tkNo, // Đảo Nợ thành Có
      soTien: line.soTien,
      dienGiai: `[BÚT TOÁN ĐẢO] Hủy chứng từ ${targetVoucher.soChungTu}: ${line.dienGiai}`,
      doiTuongId: line.doiTuongId,
      khoId: line.khoId
    }));

    const reversalVoucher: ChungTuGhiSo = {
      id: `CT-REV-${Date.now()}`,
      soChungTu: `REV-${targetVoucher.soChungTu}`,
      ngayHachToan: new Date().toISOString().split('T')[0],
      loaiChungTu: 'PKT',
      sourceSystem: event.sourceSystem,
      sourceDocType: event.sourceDocType,
      sourceDocId: event.sourceDocId,
      sourceDocNo: event.sourceDocNo,
      sourceVersion: event.sourceVersion,
      autoPosted: true,
      reversalOfId: targetVoucher.id,
      tongTien: targetVoucher.tongTien,
      trangThai: 'DA_GHI_SO',
      dongHachToan: reversedLines
    };

    event.trangThai = 'PROCESSED';
    event.processedAt = new Date().toISOString();
    this.state.processedKeys.add(currentKey);
    this.state.postedVouchers.set(currentKey, reversalVoucher);

    return {
      thanhCong: true,
      chungTu: reversalVoucher
    };
  }

  public getPostedVouchers(): ChungTuGhiSo[] {
    return Array.from(this.state.postedVouchers.values());
  }

  public getDeadLetterQueue(): OutboxEvent[] {
    return this.state.deadLetterQueue;
  }
}
