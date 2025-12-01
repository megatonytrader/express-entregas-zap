-- Drop existing restrictive policies for orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

-- Create new policy that allows viewing all orders (for admin area)
CREATE POLICY "Anyone can view all orders"
ON public.orders
FOR SELECT
USING (true);

-- Keep the user creation policy
-- Users can create their own orders policy already exists

-- Allow updates to all orders (for admin status updates)
CREATE POLICY "Anyone can update orders"
ON public.orders
FOR UPDATE
USING (true);

-- Update order_items policies similarly
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;

CREATE POLICY "Anyone can view all order items"
ON public.order_items
FOR SELECT
USING (true);