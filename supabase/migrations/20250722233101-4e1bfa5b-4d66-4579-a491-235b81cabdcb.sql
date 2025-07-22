-- Fix the search_path issue
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
BEGIN
    -- Check if current user is admin by checking localStorage username against database
    RETURN EXISTS (
        SELECT 1 FROM public.simple_users 
        WHERE username = current_setting('app.current_user', true) 
        AND role = 'admin'::public.app_role
    );
END;
$$;