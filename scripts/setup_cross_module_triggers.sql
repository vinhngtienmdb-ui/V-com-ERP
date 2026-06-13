-- =============================================================================
-- SQL DDL: TRÌNH CÀI ĐẶT TRIGGER TỰ ĐỘNG LIÊN KẾT ĐA MODULE (CROSS-MODULE INTEGRATIONS)
-- =============================================================================

-- =============================================================================
-- 1. TRIGGER LIÊN KẾT 3 PHÂN HỆ: Orders -> Warehouse -> Finance
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_process_paid_order_integration()
RETURNS TRIGGER AS $$
DECLARE
  r_item jsonb;
  v_je_id TEXT;
  v_total_amount NUMERIC;
  v_order_items jsonb;
  v_customer_name TEXT;
  v_tenant_id TEXT;
BEGIN
  -- Kiểm tra nếu trạng thái chuyển sang 'paid'
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'paid') THEN
    
    v_order_items := NEW.items;
    v_total_amount := COALESCE(NEW.total, 0);
    v_customer_name := COALESCE(NEW.customer_name, 'KHLE');
    v_tenant_id := COALESCE(NEW.tenant_id, 'tenant-vcomm-prod-01');

    -- A. TRỪ TỒN KHO TỰ ĐỘNG TRONG WAREHOUSE (warehouse_stock)
    IF v_order_items IS NOT NULL AND jsonb_array_length(v_order_items) > 0 THEN
      FOR r_item IN SELECT * FROM jsonb_array_elements(v_order_items) LOOP
        -- Trừ kho nguyên tử trên cột quantity quan hệ thực tế
        UPDATE public.warehouse_stock
        SET quantity = GREATEST(0.00, COALESCE(quantity, 0.00) - (r_item->>'quantity')::numeric),
            updated_at = now()
        WHERE product_id = (r_item->>'productId') 
          AND tenant_id = v_tenant_id;
      END LOOP;
    END IF;

    -- B. TỰ ĐỘNG HẠCH TOÁN SỔ KÉP NỘI BỘ (journal_entries & journal_items)
    -- Tránh trùng lặp nếu đơn hàng đã được đối soát & hạch toán qua SePay Webhook từ trước
    IF NOT EXISTS (
      SELECT 1 FROM public.journal_entries 
      WHERE ref = NEW.id AND tenant_id = v_tenant_id
    ) THEN
      v_je_id := 'JE-AUTO-' || NEW.id;

      -- 1. Tạo chứng từ journal_entries
      INSERT INTO public.journal_entries (id, date, ref, description, tenant_id, created_at, updated_at)
      VALUES (
        v_je_id,
        now(),
        NEW.id,
        'Hạch toán doanh thu tự động từ Đơn hàng bán lẻ #' || NEW.id || ' (' || v_customer_name || ')',
        v_tenant_id,
        now(),
        now()
      ) ON CONFLICT (id) DO NOTHING;

      -- 2. Hạch toán Nợ 1121 (Tiền gửi ngân hàng) / Có 5111 (Doanh thu bán hàng hóa)
      IF v_total_amount > 0 THEN
        INSERT INTO public.journal_items (id, entry_id, account_id, debit, credit, partner_id, tenant_id, created_at)
        VALUES 
          (gen_random_uuid(), v_je_id, '1121', v_total_amount, 0.00, v_customer_name, v_tenant_id, now()),
          (gen_random_uuid(), v_je_id, '5111', 0.00, v_total_amount, v_customer_name, v_tenant_id, now());
      END IF;
    END IF;

    -- C. Ghi nhật ký kiểm toán hành chính (admin_audit_logs)
    INSERT INTO public.admin_audit_logs (id, tenant_id, data, created_at)
    VALUES (
      gen_random_uuid(),
      v_tenant_id,
      jsonb_build_object(
        'action', 'ORDER_PAID_TRIGGER',
        'details', 'Đã xử lý thanh toán đơn hàng #' || NEW.id || '. Tự động khấu trừ kho và kết chuyển sổ cái nội bộ ' || v_je_id
      ),
      now()
    ) ON CONFLICT DO NOTHING;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger xử lý thanh toán cho bảng orders
DROP TRIGGER IF EXISTS trg_order_paid_processor ON public.orders;
CREATE TRIGGER trg_order_paid_processor
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_process_paid_order_integration();


-- =============================================================================
-- 2. TRIGGER LIÊN KẾT 2 PHÂN HỆ: Warehouse -> RequestHub (Đề xuất thu mua)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_check_warehouse_safety_stock_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_product_name TEXT;
  v_product_id TEXT;
  v_quantity NUMERIC;
  v_safety_stock NUMERIC;
  v_tenant_id TEXT;
BEGIN
  v_product_name := COALESCE(NEW.product_name, 'Sản phẩm hết hàng');
  v_product_id := NEW.product_id;
  v_quantity := COALESCE(NEW.quantity, 0);
  v_safety_stock := COALESCE(NEW.safety_stock, 0);
  v_tenant_id := COALESCE(NEW.tenant_id, 'tenant-vcomm-prod-01');

  -- Kích hoạt đề xuất tự động nếu tồn kho giảm xuống dưới ngưỡng an toàn
  IF v_quantity < v_safety_stock AND (OLD IS NULL OR COALESCE(OLD.quantity, 0) >= v_safety_stock) THEN
    
    -- Tạo phiếu đề xuất thu mua tự động (Draft) trong bảng requests
    INSERT INTO public.requests (id, tenant_id, data, created_at)
    VALUES (
      'REQ-AUTO-' || substring(gen_random_uuid()::text, 1, 8),
      v_tenant_id,
      jsonb_build_object(
        'title', 'Đề xuất mua hàng tự động: ' || v_product_name,
        'type', 'procurement',
        'status', 'pending',
        'content', 'Hệ thống tự động phát hiện số lượng tồn kho của sản phẩm ' || v_product_name || ' (' || v_product_id || ') còn lại ' || v_quantity || ' chiếc, thấp hơn ngưỡng an toàn thiết lập (' || v_safety_stock || ' chiếc). Kính đề nghị bộ phận thu mua nhập thêm hàng gấp.',
        'createdAt', now()::text,
        'createdBy', 'system-warehouse-trigger'
      ),
      now()
    ) ON CONFLICT DO NOTHING;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger giám sát tồn kho cho bảng warehouse_stock
DROP TRIGGER IF EXISTS trg_warehouse_safety_stock_check ON public.warehouse_stock;
CREATE TRIGGER trg_warehouse_safety_stock_check
  AFTER UPDATE OF quantity ON public.warehouse_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_warehouse_safety_stock_trigger();


-- =============================================================================
-- 3. ĐỒNG BỘ CUSTOM CLAIMS TỚI auth.users TỪ NHÂN VIÊN
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT,
  department_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS employees_isolation ON public.employees;
CREATE POLICY employees_isolation ON public.employees
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01');

CREATE OR REPLACE FUNCTION public.fn_sync_employee_custom_claims()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = NEW.email OR id::text = NEW.id;
  
  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'role', NEW.role,
        'department_id', NEW.department_id,
        'tenant_id', NEW.tenant_id
      )
    WHERE id = v_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_employee_auth_sync ON public.employees;
CREATE TRIGGER trg_employee_auth_sync
  AFTER INSERT OR UPDATE OF role, department_id, tenant_id ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_employee_custom_claims();
