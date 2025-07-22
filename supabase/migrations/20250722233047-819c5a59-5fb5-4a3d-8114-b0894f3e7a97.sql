-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all users" ON public.simple_users;

-- Create a security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is admin by checking localStorage username against database
    RETURN EXISTS (
        SELECT 1 FROM public.simple_users 
        WHERE username = current_setting('app.current_user', true) 
        AND role = 'admin'::app_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create policies without recursion
CREATE POLICY "Admins can manage all users" 
ON public.simple_users 
FOR ALL 
TO authenticated
USING (public.is_admin());

-- Also update the policy that might be causing issues
DROP POLICY IF EXISTS "Anyone can authenticate" ON public.simple_users;
CREATE POLICY "Users can authenticate" 
ON public.simple_users 
FOR SELECT 
TO anon, authenticated
USING (true);