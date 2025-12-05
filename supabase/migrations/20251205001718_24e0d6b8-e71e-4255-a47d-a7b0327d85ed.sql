-- Drop existing policies
DROP POLICY IF EXISTS "add_ons_admin_manage_policy" ON public.add_ons;
DROP POLICY IF EXISTS "add_ons_public_read_policy" ON public.add_ons;

-- Create new PERMISSIVE policies
CREATE POLICY "add_ons_public_read" 
ON public.add_ons 
FOR SELECT 
USING (true);

CREATE POLICY "add_ons_admin_insert" 
ON public.add_ons 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "add_ons_admin_update" 
ON public.add_ons 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "add_ons_admin_delete" 
ON public.add_ons 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));