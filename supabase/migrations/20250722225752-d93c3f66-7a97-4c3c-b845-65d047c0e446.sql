-- Remove nom_complet field from simple_users table
ALTER TABLE public.simple_users DROP COLUMN IF EXISTS nom_complet;

-- Update the create_user function to not require nom_complet
CREATE OR REPLACE FUNCTION public.create_user(username_input text, password_input text, role_input text DEFAULT 'user'::text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
    INSERT INTO public.simple_users (username, password, role)
    VALUES (
        username_input, 
        password_input,
        role_input::public.app_role
    )
    RETURNING id;
$function$;

-- Update patient_access table to have proper foreign key to simple_users
ALTER TABLE public.patient_access DROP CONSTRAINT IF EXISTS patient_access_user_id_fkey;
ALTER TABLE public.patient_access ADD CONSTRAINT patient_access_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.simple_users(id) ON DELETE CASCADE;