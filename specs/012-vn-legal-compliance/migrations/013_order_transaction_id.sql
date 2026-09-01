-- 013: orders.transaction_id — giữ mã giao dịch SePay để trigger payments
-- truy vết đúng chứng từ gốc (test oms_lifecycle kỳ vọng transaction_id
-- từ đơn được pass-through sang payments row).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.transaction_id IS 'Mã giao dịch gateway (SePay) — trigger fn_process_paid_order_integration dùng cho payments.transaction_id';

NOTIFY pgrst, 'reload schema';
