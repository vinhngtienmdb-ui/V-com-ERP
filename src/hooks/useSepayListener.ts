import { useEffect } from 'react';
import { sePayService } from '../services/sepayService';
import { db, collection, addDoc, serverTimestamp, query, where, limit, getDocs, doc, getDoc, setDoc } from '../lib/firebase';
import { getMisaConfig } from '../services/misaService';
import { sendZnsNotification } from '../services/znsService';

/**
 * Custom hook to poll SePay webhook events from the backend
 * and dispatch custom events to the window object for components to consume.
 */
export function useSepayListener() {
  useEffect(() => {
    let intervalId: any;
    
    const checkWebhookEvents = async () => {
      try {
        const events = await sePayService.getWebhookEvents();
        if (events && events.length > 0) {
          console.log(`[SePay-Listener] Found ${events.length} pending transaction webhooks`);
          
          // Dispatch a custom event for each webhook event
          events.forEach(async (event: any) => {
            const transactionContent = event.transactionContent || event.transaction_content || '';
            const amount = Number(event.transferAmount || event.amountIn || event.amount_in || 0);
            const id = event.id;
            
            console.log(`[SePay-Listener] Dispatching payment event: ID ${id}, Content "${transactionContent}", Amount ${amount}`);
            
            const paymentEvent = new CustomEvent('sepay-payment-received', {
              detail: {
                id,
                transactionContent,
                amount,
                gateway: event.gateway,
                transactionDate: event.transactionDate || event.transaction_date,
                raw: event
              }
            });
            window.dispatchEvent(paymentEvent);

            // Tự động hạch toán kế toán và xuất hóa đơn điện tử
            try {
              // Kiểm tra ngày khóa sổ trước khi hạch toán tự động
              let isLocked = false;
              try {
                const settingsSnap = await getDoc(doc(db, 'tenant_settings', 'config'));
                if (settingsSnap.exists()) {
                  const lockDateStr = settingsSnap.data().closingLockDate;
                  if (lockDateStr) {
                    const lockDate = new Date(lockDateStr);
                    const txDateStr = event.transactionDate || event.transaction_date || new Date().toISOString();
                    const txDate = new Date(txDateStr);
                    if (txDate.getTime() <= lockDate.getTime()) {
                      isLocked = true;
                      console.warn(`[SePay-Listener] Chặn hạch toán tự động SePay Webhook: Giao dịch ngày ${txDate.toLocaleDateString('vi-VN')} nằm trong kỳ đã khóa sổ.`);
                    }
                  }
                }
              } catch (lockErr) {
                console.warn('[SePay-Listener] Không thể tải cấu hình khóa sổ để kiểm tra:', lockErr);
              }

              if (isLocked) {
                return;
              }

              let orderId = '';
              let isMatchedOrder = false;
              const match = transactionContent.match(/(?:IPOS_PAY_|ORD-|VCOM-)(\w+)/i);
              if (match) {
                orderId = match[0];
                try {
                  const orderRef = doc(db, 'orders', orderId);
                  const orderSnap = await getDoc(orderRef);
                  if (orderSnap.exists()) {
                    isMatchedOrder = true;
                  }
                } catch (errOrder) {
                  console.warn('[SePay-Listener] Lỗi kiểm tra sự tồn tại của đơn hàng:', errOrder);
                }
              }

              const accountNo = event.bankAccountNumber || event.bank_account_number || '123456789';
              
              // Cấu hình định khoản MISA AMIS
              const misaConfig = getMisaConfig();
              
              // Tìm mã đối tượng kế toán theo SĐT khách hàng
              const phone = event.customerPhone || '';
              let objectCode = 'KHLE';
              
              if (phone) {
                try {
                  const qCust = query(collection(db, 'customers'), where('phone', '==', phone), limit(1));
                  const snapCust = await getDocs(qCust);
                  if (!snapCust.empty) {
                    snapCust.forEach((d: any) => {
                      objectCode = d.id || 'KHLE';
                    });
                  }
                } catch (errCust) {
                  console.warn('[SePay-Listener] Lỗi truy vấn mã đối tượng kế toán:', errCust);
                }
              }

              // Định nghĩa tài khoản Nợ / Có và Diễn giải dựa theo kết quả đối soát
              const debitAccount = misaConfig.debitAccountDefault || '1121';
              let creditAccount = '5111';
              let description = '';

              if (isMatchedOrder) {
                creditAccount = misaConfig.receivableAccountDefault || '1311';
                description = `Hạch toán tự động SePay - Đối soát khớp thành công đơn hàng ${orderId}`;
                
                // Cập nhật trạng thái đơn hàng sang 'paid' để kích hoạt trigger trừ kho và hạch toán tự động
                try {
                  const { updateDoc: firebaseUpdateDoc } = await import('../lib/firebase');
                  await firebaseUpdateDoc(doc(db, 'orders', orderId), { status: 'paid' });
                  console.log(`[SePay-Listener] Đã cập nhật trạng thái đơn hàng ${orderId} sang 'paid'`);
                } catch (updateErr: any) {
                  console.error(`[SePay-Listener] Không thể cập nhật trạng thái đơn hàng ${orderId} sang 'paid':`, updateErr.message || updateErr);
                }
              } else {
                // Áp dụng Phương án A (An toàn): Hạch toán tạm treo vào tài khoản Có 3388 và gửi cảnh báo ZNS
                creditAccount = misaConfig.partnerLiabilitiesAccount || '3388';
                description = `SePay: Giao dịch chưa đối soát được - Nội dung: "${transactionContent}"`;
                
                try {
                  await sendZnsNotification(
                    '0987654321',
                    'ZNS_TICKET_REPLIED',
                    {
                      'Tên_Khách_Hàng': 'Kế toán viên',
                      'Mã_Phiếu': `TX-${id}`,
                      'Tiêu_Đề': 'CẢNH BÁO ĐỐI SOÁT SEPAY',
                      'Nội_Dung_Phản_Hồi': `Phát hiện giao dịch chuyển khoản chưa đối soát được. Số tiền: ${amount.toLocaleString('vi-VN')}đ. Nội dung: "${transactionContent}". Hệ thống đã hạch toán tạm vào Có ${creditAccount}.`
                    },
                    {
                      customerName: 'Kế toán viên',
                      orderId: `TX-${id}`
                    }
                  );
                  console.log('[SePay-Listener] Đã gửi ZNS cảnh báo đối soát thành công');
                } catch (znsErr) {
                  console.error('[SePay-Listener] Không thể gửi ZNS cảnh báo đối soát:', znsErr);
                }
              }
              
              // Bóc tách Thuế GTGT 10% mặc định
              const taxRate = 10;
              const vatAmount = Math.round(amount - (amount / 1.10));

              const journalEntryId = `JE-SP-${id}`;

              // Ghi sổ kế toán vào Firestore
              const txDoc = await addDoc(collection(db, 'finance_transactions'), {
                description,
                amount: amount,
                type: 'income',
                category: 'Doanh thu bán hàng',
                bankAccount: accountNo,
                referenceNumber: event.referenceNumber || event.reference_number || `SEPAY-${event.id}`,
                orderId: isMatchedOrder ? orderId : '',
                date: serverTimestamp(),
                createdAt: serverTimestamp(),
                createdBy: 'system-sepay-webhook',
                
                // MISA accounting mappings
                debitAccount,
                creditAccount,
                accountingObjectCode: objectCode,
                taxRate,
                vatAmount,
                misaSynced: true,
                misaVoucherId: journalEntryId,
                misaSyncError: ''
              });

              console.log(`[SePay-Listener] Đã ghi sổ kế toán thành công cho đơn hàng: ${orderId} (ID giao dịch: ${txDoc.id})`);

              // Ghi chứng từ kế toán sổ kép thực tế vào journal_entries / journal_items
              try {
                const journalEntry = {
                  id: journalEntryId,
                  date: event.transactionDate || event.transaction_date || new Date().toISOString(),
                  ref: orderId || `SEPAY-${event.id}`,
                  description,
                  tenantId: 'tenant-vcomm-prod-01',
                  items: [
                    { accountId: debitAccount, debit: amount, credit: 0, partnerId: objectCode },
                    { accountId: creditAccount, debit: 0, credit: amount, partnerId: objectCode }
                  ]
                };
                
                await setDoc(doc(db, 'journal_entries', journalEntryId), journalEntry);
                console.log(`[SePay-Listener] Đã hạch toán sổ kép nội bộ thành công cho đơn hàng: ${orderId} (${journalEntryId})`);
              } catch (ledgerErr: any) {
                console.error(`[SePay-Listener] Lỗi ghi sổ kép nội bộ cho đơn hàng: ${orderId}:`, ledgerErr.message || ledgerErr);
              }

              // Xuất hóa đơn điện tử SePay
              sePayService.createInvoice({
                order_id: orderId,
                amount: amount,
                payment_method: 'bank_transfer',
                customer_phone: phone || '0987654321',
                description: `Xuất hóa đơn tự động qua SePay cho đơn hàng ${orderId}`
              })
              .then((res: any) => {
                console.log(`[SePay-Listener] Đã đăng ký hóa đơn điện tử SePay thành công cho đơn hàng: ${orderId}`, res);
              })
              .catch((err: any) => {
                console.error('[SePay-Listener] Xuất hóa đơn điện tử thất bại:', err);
              });

            } catch (autoErr) {
              console.error('[SePay-Listener] Lỗi xử lý tự động kế toán & xuất hóa đơn:', autoErr);
            }
          });
          
          // Clear processed events on the backend to avoid reprocessing
          const eventIds = events.map((e: any) => e.id);
          await sePayService.clearWebhookEvents(eventIds);
        }
      } catch (err) {
        console.error('[SePay-Listener] Polling failed:', err);
      }
    };

    // Poll every 3 seconds for rapid automation response
    intervalId = setInterval(checkWebhookEvents, 3000);
    
    // Initial run on mount
    checkWebhookEvents();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
}
