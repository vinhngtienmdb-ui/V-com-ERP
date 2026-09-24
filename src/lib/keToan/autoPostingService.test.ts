import { describe, it, expect, beforeEach } from 'vitest';
import { AutoPostingService, OutboxEvent } from './autoPostingService';

describe('AutoPostingService - Phase 5 Outbox & Idempotency', () => {
  let service: AutoPostingService;

  beforeEach(() => {
    service = new AutoPostingService();
  });

  it('xử lý thành công sự kiện đơn hàng thanh toán (ORDER_PAID)', () => {
    const event: OutboxEvent = {
      id: 'EVT-001',
      sourceSystem: 'VCOMM_ERP',
      sourceDocType: 'ORDER',
      sourceDocId: 'ORD-1001',
      sourceDocNo: 'DH-1001',
      sourceVersion: 1,
      eventName: 'ORDER_PAID',
      payload: {
        thanhTienTruocThue: 10000000,
        tienThue: 1000000,
        doiTuongId: 'KH-001'
      },
      trangThai: 'PENDING',
      soLanThu: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString()
    };

    const res = service.processOutboxEvent(event);
    expect(res.thanhCong).toBe(true);
    expect(res.chungTu).toBeDefined();
    expect(res.chungTu?.soChungTu).toBe('PKT-DH-1001');
    expect(res.chungTu?.tongTien).toBe(11000000);
    expect(res.chungTu?.dongHachToan.length).toBe(2);

    expect(event.trangThai).toBe('PROCESSED');
    expect(service.getPostedVouchers().length).toBe(1);
  });

  it('lũy đẳng: gửi cùng 1 event nhiều lần chỉ sinh 1 chứng từ duy nhất', () => {
    const event: OutboxEvent = {
      id: 'EVT-002',
      sourceSystem: 'VCOMM_ERP',
      sourceDocType: 'ORDER',
      sourceDocId: 'ORD-1002',
      sourceDocNo: 'DH-1002',
      sourceVersion: 1,
      eventName: 'ORDER_PAID',
      payload: {
        thanhTienTruocThue: 5000000,
        tienThue: 500000,
        doiTuongId: 'KH-002'
      },
      trangThai: 'PENDING',
      soLanThu: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString()
    };

    // Lần 1: Tạo mới
    const res1 = service.processOutboxEvent(event);
    expect(res1.thanhCong).toBe(true);
    expect(res1.daTonTai).toBeUndefined();

    // Lần 2..5: Gửi lại cùng event
    for (let i = 0; i < 4; i++) {
      const resDuplicate = service.processOutboxEvent(event);
      expect(resDuplicate.thanhCong).toBe(true);
      expect(resDuplicate.daTonTai).toBe(true);
      expect(resDuplicate.chungTu?.id).toBe(res1.chungTu?.id);
    }

    // Tổng số chứng từ sinh ra chỉ là 1
    expect(service.getPostedVouchers().length).toBe(1);
  });

  it('sinh bút toán đảo (Reversal) khi chứng từ nguồn bị hủy (ORDER_CANCELLED)', () => {
    // 1. Tạo chứng từ bán hàng ban đầu (version 1)
    const originalEvent: OutboxEvent = {
      id: 'EVT-003',
      sourceSystem: 'VCOMM_ERP',
      sourceDocType: 'ORDER',
      sourceDocId: 'ORD-1003',
      sourceDocNo: 'DH-1003',
      sourceVersion: 1,
      eventName: 'ORDER_PAID',
      payload: {
        thanhTienTruocThue: 2000000,
        tienThue: 200000,
        doiTuongId: 'KH-003'
      },
      trangThai: 'PENDING',
      soLanThu: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString()
    };
    const resGoc = service.processOutboxEvent(originalEvent);
    expect(resGoc.thanhCong).toBe(true);

    // 2. Sự kiện hủy đơn hàng (version 2)
    const cancelEvent: OutboxEvent = {
      id: 'EVT-004',
      sourceSystem: 'VCOMM_ERP',
      sourceDocType: 'ORDER',
      sourceDocId: 'ORD-1003',
      sourceDocNo: 'DH-1003',
      sourceVersion: 2,
      eventName: 'ORDER_CANCELLED',
      payload: {},
      trangThai: 'PENDING',
      soLanThu: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString()
    };

    const resDao = service.processOutboxEvent(cancelEvent);
    expect(resDao.thanhCong).toBe(true);
    expect(resDao.chungTu).toBeDefined();
    expect(resDao.chungTu?.reversalOfId).toBe(resGoc.chungTu?.id);
    expect(resDao.chungTu?.soChungTu).toBe(`REV-${resGoc.chungTu?.soChungTu}`);

    // Kiểm tra dòng đảo Nợ Có:
    // Bản gốc: Nợ 112 / Có 511 (2.0tr), Có 3331 (0.2tr)
    // Bản đảo: Nợ 511 (2.0tr), Nợ 3331 (0.2tr) / Có 112
    const reversedLines = resDao.chungTu!.dongHachToan;
    expect(reversedLines[0].tkNo).toBe('511');
    expect(reversedLines[0].tkCo).toBe('112');
    expect(reversedLines[0].soTien).toBe(2000000);

    expect(reversedLines[1].tkNo).toBe('3331');
    expect(reversedLines[1].tkCo).toBe('112');
    expect(reversedLines[1].soTien).toBe(200000);

    // Cả 2 chứng từ (gốc và đảo) đều được lưu giữ
    expect(service.getPostedVouchers().length).toBe(2);
  });

  it('đưa vào Dead-Letter Queue (DLQ) khi gặp lỗi quá số lần thử tối đa', () => {
    const invalidEvent: OutboxEvent = {
      id: 'EVT-ERR',
      sourceSystem: 'VCOMM_ERP',
      sourceDocType: 'UNKNOWN_TYPE',
      sourceDocId: 'UNK-999',
      sourceDocNo: 'UNK-999',
      sourceVersion: 1,
      eventName: 'NON_EXISTENT_RULE',
      payload: {},
      trangThai: 'PENDING',
      soLanThu: 2,
      maxRetries: 3,
      createdAt: new Date().toISOString()
    };

    const res = service.processOutboxEvent(invalidEvent);
    expect(res.thanhCong).toBe(false);
    expect(invalidEvent.trangThai).toBe('DEAD_LETTER');
    expect(service.getDeadLetterQueue().length).toBe(1);
    expect(service.getDeadLetterQueue()[0].id).toBe('EVT-ERR');
  });
});
