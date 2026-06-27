-- Migration Script: Create Sellers Table
-- Run this script in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.sellers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT DEFAULT 'tenant-vcomm-prod-01'
);

-- Safely add columns if they don't exist
ALTER TABLE public.sellers 
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS total_products INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS gmv NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS tax_code TEXT,
    ADD COLUMN IF NOT EXISTS identity_card TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS representative TEXT,
    ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS join_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'documents',
    ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'seller',
    ADD COLUMN IF NOT EXISTS active_modules JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS business_license_url TEXT,
    ADD COLUMN IF NOT EXISTS id_card_front_url TEXT,
    ADD COLUMN IF NOT EXISTS id_card_back_url TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Enable Row Level Security (RLS)
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Allow anyone to read sellers (or adjust based on admin roles)
CREATE POLICY "Allow public read access on sellers"
    ON public.sellers FOR SELECT
    USING (true);

-- Allow authenticated users to insert/update (or adjust based on your auth logic)
CREATE POLICY "Allow authenticated insert on sellers"
    ON public.sellers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on sellers"
    ON public.sellers FOR UPDATE
    USING (true);

-- Insert Mock Data
INSERT INTO public.sellers (id, name, email, phone, total_products, rating, gmv, status, tax_code, identity_card, address, representative, commission_rate, join_date, onboarding_step, partner_type, active_modules)
VALUES 
('SEL-001', 'Mobile World', 'mobileworld@test.com', '0987654321', 1250, 4.8, 4500000000, 'active', '0101234567', '001090123456', '123 Nguyen Trai, Q1, HCMC', 'Nguyen Van A', 5, '2023-12-01T00:00:00Z', 'completed', 'dealer', '["ipos", "pim", "scm", "hr"]'::jsonb),
('SEL-002', 'Fashion Hub', 'fashionhub@test.com', '0912345678', 850, 4.6, 2800000000, 'active', '0309876543', '079090987654', '456 Le Loi, Q1, HCMC', 'Tran Thi B', 8, '2024-01-15T00:00:00Z', 'completed', 'seller', '["orders", "pim", "marketing", "flashsale", "affiliate"]'::jsonb),
('SEL-003', 'Eco Mart', 'ecomart@test.com', '0900112233', 120, 0, 0, 'pending', '0401122334', '012345678901', '789 Dien Bien Phu, Q3, HCMC', 'Le Van C', 10, '2024-03-10T00:00:00Z', 'verification', 'seller', '[]'::jsonb);
