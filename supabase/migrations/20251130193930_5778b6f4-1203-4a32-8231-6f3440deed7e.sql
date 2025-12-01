-- Add rejection_reason column to orders table
ALTER TABLE public.orders 
ADD COLUMN rejection_reason TEXT;