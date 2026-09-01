-- 012: Workflow liên thông toàn diện
-- ① fn_process_paid_order_integration: INSERT payments row (chứng từ gốc theo spec 004)
-- ② Escrow: server-side process (release khi hết retention / refund khi stale)
-- ⑤ pg_cron chạy escrow mỗi giờ
-- ③ Double-deduct: DB trigger là nguồn sự thật duy nhất khi status='paid';
--    client adjustStock khi shipped được bỏ (sửa code client — không cần SQL)

-- ============================================================
-- ① SỬA TRIGGER: paid → INSERT payments row TRƯỚC khi trừ kho
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_process_paid_order_integration()
RETURNS TRIGGER AS $$
DECLARE
  r_item jsonb;
  v_je_id TEXT;
  v_total_amount NUMERIC;
  v_order_items jsonb;
  v_customer_name TEXT;
  v_tenant_id TEXT;
  v_payment_id TEXT;
BEGIN
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'paid') THEN

    v_order_items := NEW.items;
    v_total_amount := COALESCE(NEW.total, 0);
    v_customer_name := COALESCE(NEW.customer_name, 'KHLE');
    v_tenant_id := COALESCE(NEW.tenant_id, 'tenant-vcomm-prod-01');

    -- ① INSERT PAYMENTS ROW — chứng từ thanh toán gốc (idempotent theo order)
    -- transaction_id: ưu tiên giá trị từ đơn (SePay listener ghi sẵn khi đối soát),
    -- fallback 'sepay-{order_id}' cho đơn paid qua kênh khác.
    v_payment_id := 'pm-' || NEW.id;
    INSERT INTO public.payments (id, tenant_id, order_id, amount, payment_method,
                                 transaction_id, payment_gateway, status, created_at)
    VALUES (v_payment_id, v_tenant_id, NEW.id, v_total_amount,
            COALESCE(NEW.payment_method, 'bank_transfer'),
            COALESCE(NEW.transaction_id, NEW.payment_date::text, 'sepay-' || NEW.id),
            'sepay', 'success', now())
    ON CONFLICT (id) DO NOTHING;

    -- A. TRỪ TỒN KHO
    IF v_order_items IS NOT NULL AND jsonb_array_length(v_order_items) > 0 THEN
      FOR r_item IN SELECT * FROM jsonb_array_elements(v_order_items) LOOP
        UPDATE public.warehouse_stock
        SET quantity = quantity - COALESCE((r_item->>'quantity')::numeric, 0),
            updated_at = now()
        WHERE product_id = COALESCE(r_item->>'productId', r_item->>'id')
          AND tenant_id = v_tenant_id;
      END LOOP;
    END IF;

    -- B. HẠCH TOÁN KẾ TOÁN SỔ KÉP
    v_je_id := 'JE-ORDER-PAID-' || NEW.id;
    INSERT INTO public.journal_entries (id, date, ref, description, tenant_id, created_at, updated_at)
    VALUES (v_je_id, now(), NEW.id,
            'Hạch toán doanh thu tự động từ Đơn hàng bán lẻ #' || NEW.id || ' (' || v_customer_name || ')',
            v_tenant_id, now(), now())
    ON CONFLICT (id) DO NOTHING;

    IF v_total_amount > 0 THEN
      INSERT INTO public.journal_items (id, entry_id, account_id, debit, credit, partner_id, tenant_id, created_at)
      VALUES (gen_random_uuid(), v_je_id, '1121', v_total_amount, 0.00, v_customer_name, v_tenant_id, now()),
             (gen_random_uuid(), v_je_id, '5111', 0.00, v_total_amount, v_customer_name, v_tenant_id, now());
    END IF;

    -- C. AUDIT
    INSERT INTO public.admin_audit_logs (id, tenant_id, data, created_at)
    VALUES (gen_random_uuid(), v_tenant_id,
            jsonb_build_object('action', 'ORDER_PAID_TRIGGER',
              'details', 'Đã xử lý thanh toán #' || NEW.id || ': ghi payment + trừ kho + sổ cái ' || v_je_id),
            now())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ②⑤ SERVER-SIDE ESCROW: release/refund hàng loạt (SQL thuần)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_process_due_escrows()
RETURNS TABLE (released_count INT, refunded_count INT) AS $$
DECLARE
  v_released INT := 0;
  v_refunded INT := 0;
  r RECORD;
  v_je_id TEXT;
  v_balance NUMERIC;
  v_seller RECORD;
BEGIN
  -- 2.1 RELEASE: delivered + hết auto_release_at + không dispute
  FOR r IN SELECT * FROM public.escrows
           WHERE status = 'delivered' AND auto_release_at <= now() AND dispute_id IS NULL
  LOOP
    BEGIN
      -- Cộng ví seller (wallet_balance)
      UPDATE public.sellers SET wallet_balance = COALESCE(wallet_balance,0) + r.amount, updated_at = now()
      WHERE id = r.seller_id AND tenant_id = r.tenant_id;
      IF NOT FOUND THEN
        -- seller chưa có row ví → vẫn ghi ledger để đối soát sau
        INSERT INTO public.sellers (id, tenant_id, wallet_balance) VALUES (r.seller_id, r.tenant_id, r.amount);
      END IF;

      -- Partner ledger công nợ (balance lũy kế)
      SELECT COALESCE(balance,0) INTO v_balance FROM public.partner_ledgers
      WHERE partner_id = r.seller_id ORDER BY created_at DESC LIMIT 1;

      INSERT INTO public.partner_ledgers (id, tenant_id, partner_id, partner_type, ref_type, ref_id,
                                          debit, credit, balance, description, created_at)
      VALUES ('ple-esc-' || r.id, r.tenant_id, r.seller_id, 'seller', 'order', r.order_id,
              0, r.amount, COALESCE(v_balance,0) + r.amount,
              'Escrow giải ngân tự động cho đơn ' || r.order_id, now());

      -- Đóng escrow (chỉ từ delivered — idempotent)
      UPDATE public.escrows SET status = 'released', released_at = now()
      WHERE id = r.id AND status = 'delivered';

      v_released := v_released + 1;
    EXCEPTION WHEN OTHERS THEN
      -- ghi audit lỗi từng escrow, không chết cả batch
      INSERT INTO public.escrow_audit_logs (escrow_id, old_status, new_status, changed_at)
      VALUES (r.id, 'delivered', 'release_failed', now());
    END;
  END LOOP;

  -- 2.2 REFUND: locked quá 14 ngày không được giao (bảo vệ NTD Điều 28)
  FOR r IN SELECT * FROM public.escrows
           WHERE status = 'locked' AND locked_at <= now() - interval '14 days'
  LOOP
    BEGIN
      UPDATE public.escrows SET status = 'refunded', refunded_at = now()
      WHERE id = r.id AND status = 'locked';

      INSERT INTO public.escrow_audit_logs (escrow_id, old_status, new_status, changed_at)
      VALUES (r.id, 'locked', 'refunded_stale', now());

      v_refunded := v_refunded + 1;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  RETURN QUERY SELECT v_released, v_refunded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ⑤ PG_CRON: chạy escrow mỗi giờ (nếu extension bật được)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'vcomm-escrow-hourly',
  '0 * * * *',
  $$SELECT public.fn_process_due_escrows()$$
);

NOTIFY pgrst, 'reload schema';
