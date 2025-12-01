-- Add 'rejected' status to orders table
-- First, check the current constraint and update it
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'preparing', 'delivering', 'delivered', 'rejected'));