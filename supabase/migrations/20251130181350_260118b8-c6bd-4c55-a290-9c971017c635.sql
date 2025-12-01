-- Drop existing creation policy
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- Create new policy that allows creating orders without authentication
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Also update order_items policy
DROP POLICY IF EXISTS "Users can create their own order items" ON public.order_items;

CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (true);