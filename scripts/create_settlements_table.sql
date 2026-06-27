-- Drop if exists
DROP TABLE IF EXISTS public.settlements CASCADE;

-- Create settlements table
CREATE TABLE public.settlements (
    id VARCHAR(50) PRIMARY KEY,
    seller_id VARCHAR(50) NOT NULL REFERENCES public.sellers(id),
    seller_name VARCHAR(255),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_sales DECIMAL(15,2) DEFAULT 0.00,
    commission_fee DECIMAL(15,2) DEFAULT 0.00,
    shipping_fee DECIMAL(15,2) DEFAULT 0.00,
    net_payout DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add settlement_id to orders table to link them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='settlement_id') THEN
        ALTER TABLE public.orders ADD COLUMN settlement_id VARCHAR(50) REFERENCES public.settlements(id);
    END IF;
END $$;

-- Enable RLS for settlements
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (for demonstration)
CREATE POLICY "Enable read access for all users on settlements" ON public.settlements
    FOR SELECT USING (true);

-- Allow insert access to everyone
CREATE POLICY "Enable insert access for all users on settlements" ON public.settlements
    FOR INSERT WITH CHECK (true);

-- Allow update access to everyone
CREATE POLICY "Enable update access for all users on settlements" ON public.settlements
    FOR UPDATE USING (true);
