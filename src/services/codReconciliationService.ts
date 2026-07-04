import { supabase } from '../lib/supabase';
import { db, addDoc, setDoc, doc, collection, serverTimestamp } from './dbService';
import { sendZnsNotification } from './znsService';

export interface CodReconciliationResult {
  success: boolean;
  orderId?: string;
  expectedAmount?: number;
  actualAmount?: number;
  difference?: number;
  status: 'matched' | 'discrepancy' | 'not_found';
  message: string;
}

export async function reconcileCodStatement(
  trackingCode: string,
  actualCodAmount: number,
  carrierName: string
): Promise<CodReconciliationResult> {
  try {
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('tracking_code', trackingCode)
      .maybeSingle();

    if (orderErr) {
      throw new Error(`Database error querying order: ${orderErr.message}`);
    }

    if (!order) {
      return {
        success: false,
        status: 'not_found',
        actualAmount: actualCodAmount,
        message: `Không tìm thấy đơn hàng tương ứng với mã vận đơn: ${trackingCode}`
      };
    }

    const orderId = order.id;
    const expectedAmount = Number(order.total || order.totalPrice || 0);
    const difference = actualCodAmount - expectedAmount;
    const tenantId = order.tenant_id || 'tenant-vcomm-prod-01';

    const journalEntryId = `JE-COD-${trackingCode}-${Date.now()}`;
    const items = [];

    let status: 'matched' | 'discrepancy' = 'matched';
    let message = '';

    if (Math.abs(difference) < 0.01) {
      items.push(
        { accountId: '1121', debit: actualCodAmount, credit: 0 },
        { accountId: '1311', debit: 0, credit: expectedAmount }
      );

      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          cod_reconciliation_status: 'matched',
          status: 'delivered'
        })
        .eq('id', orderId);

      message = `Đối soát COD thành công đơn hàng ${orderId}: Khớp số tiền ${actualCodAmount.toLocaleString('vi-VN')}đ`;
    } else {
      status = 'discrepancy';
      if (difference < 0) {
        const deficit = Math.abs(difference);
        items.push(
          { accountId: '1121', debit: actualCodAmount, credit: 0 },
          { accountId: '1388', debit: deficit, credit: 0 },
          { accountId: '1311', debit: 0, credit: expectedAmount }
        );
        message = `Đối soát COD lệch (THIẾU) đơn hàng ${orderId}: Thực nhận ${actualCodAmount.toLocaleString('vi-VN')}đ, Kì vọng ${expectedAmount.toLocaleString('vi-VN')}đ. Lệch thiếu ${deficit.toLocaleString('vi-VN')}đ treo vào TK 1388.`;
      } else {
        const surplus = difference;
        items.push(
          { accountId: '1121', debit: actualCodAmount, credit: 0 },
          { accountId: '1311', debit: 0, credit: expectedAmount },
          { accountId: '3388', debit: 0, credit: surplus }
        );
        message = `Đối soát COD lệch (DƯ) đơn hàng ${orderId}: Thực nhận ${actualCodAmount.toLocaleString('vi-VN')}đ, Kì vọng ${expectedAmount.toLocaleString('vi-VN')}đ. Lệch dư ${surplus.toLocaleString('vi-VN')}đ treo vào TK 3388.`;
      }

      await supabase
        .from('orders')
        .update({
          payment_status: 'discrepancy',
          cod_reconciliation_status: 'discrepancy',
          status: 'delivered'
        })
        .eq('id', orderId);

      try {
        await sendZnsNotification(
          '0987654321',
          'ZNS_TICKET_REPLIED',
          {
            'Tên_Khách_Hàng': 'Kế toán viên',
            'Mã_Phiếu': `JE-COD-${trackingCode}`,
            'Tiêu_Đề': 'CẢNH BÁO LỆCH TIỀN COD',
            'Nội_Dung_Phản_Hồi': `Phát hiện lệch tiền COD vận đơn ${trackingCode} (${carrierName}). Thực nhận: ${actualCodAmount.toLocaleString('vi-VN')}đ, Kì vọng: ${expectedAmount.toLocaleString('vi-VN')}đ. Hệ thống đã hạch toán phần chênh lệch vào tài khoản đối ứng thích hợp.`
          },
          {
            customerName: 'Kế toán viên',
            orderId: orderId
          }
        );
        console.log('[COD-Reconciliation] Đã gửi ZNS cảnh báo lệch tiền thành công');
      } catch (znsErr) {
        console.error('[COD-Reconciliation] Không thể gửi ZNS cảnh báo:', znsErr);
      }
    }

    await setDoc(doc(db, 'journal_entries', journalEntryId), {
      id: journalEntryId,
      tenantId: tenantId,
      ref: trackingCode,
      description: `Đối soát COD vận đơn ${trackingCode} qua ${carrierName} - ${message}`,
      items: items,
      createdAt: new Date().toISOString()
    });

    await addDoc(collection(db, 'finance_transactions'), {
      description: `Đối soát COD vận đơn ${trackingCode} - ${message}`,
      amount: actualCodAmount,
      type: 'income',
      category: 'Doanh thu bán hàng',
      bankAccount: 'Tiền COD đối soát',
      referenceNumber: trackingCode,
      orderId: orderId,
      date: serverTimestamp(),
      createdAt: serverTimestamp(),
      createdBy: 'system-cod-reconciliation',
      debitAccount: '1121',
      creditAccount: difference < 0 ? '1388' : (difference > 0 ? '3388' : '1311'),
      accountingObjectCode: order.customer_id || 'KHLE'
    });

    return {
      success: true,
      orderId,
      expectedAmount,
      actualAmount: actualCodAmount,
      difference,
      status,
      message
    };
  } catch (error: any) {
    console.error('[COD-Reconciliation] Error reconciling:', error);
    return {
      success: false,
      status: 'not_found',
      message: `Lỗi xử lý đối soát: ${error.message || error}`
    };
  }
}
