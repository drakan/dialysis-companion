-- Fix the user_permissions policies to work with simple_users table
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;

-- Create new policies that work with simple_users
CREATE POLICY "Admins can manage all permissions" ON public.user_permissions
FOR ALL TO authenticated
USING (is_admin());

CREATE POLICY "Users can view their own permissions" ON public.user_permissions
FOR SELECT TO authenticated
USING (user_id IN (
    SELECT id FROM public.simple_users 
    WHERE username = current_setting('app.current_user', true)
));

-- Also fix patient_access policies
DROP POLICY IF EXISTS "Admins can manage all patient access" ON public.patient_access;

CREATE POLICY "Admins can manage all patient access" ON public.patient_access
FOR ALL TO authenticated
USING (is_admin());