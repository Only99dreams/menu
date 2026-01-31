-- Add bank account fields to restaurants for payment settings
ALTER TABLE public.restaurants 
ADD COLUMN bank_name text,
ADD COLUMN bank_account_name text,
ADD COLUMN bank_account_number text;

-- Add delivery and payment fields to orders
ALTER TABLE public.orders 
ADD COLUMN customer_name text,
ADD COLUMN customer_phone text,
ADD COLUMN customer_email text,
ADD COLUMN delivery_address text,
ADD COLUMN payment_proof_url text,
ADD COLUMN order_type text DEFAULT 'dine_in';

-- Create a storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Policy for customers to upload payment proofs
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

-- Policy for restaurant owners to view payment proofs
CREATE POLICY "Restaurant owners can view payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');