-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;

-- Allow authenticated users to insert/update settings
-- (Admin page is already protected by AdminProtectedRoute)
CREATE POLICY "Authenticated users can insert settings"
ON public.settings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
ON public.settings
FOR UPDATE
USING (true);