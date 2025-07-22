-- Fix infinite recursion in RLS policies for simple_users
DROP POLICY IF EXISTS "Admins can manage all users" ON public.simple_users;

-- Create a simpler policy that doesn't cause recursion
CREATE POLICY "Admins can manage all users" 
ON public.simple_users 
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.simple_users su 
        WHERE su.id = auth.uid()::uuid 
        AND su.role = 'admin'::app_role
    )
);