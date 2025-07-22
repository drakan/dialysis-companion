-- Drop the old authenticate_user function and recreate it without nom_complet
DROP FUNCTION IF EXISTS public.authenticate_user(text, text);

-- Recreate the authenticate_user function without nom_complet
CREATE OR REPLACE FUNCTION public.authenticate_user(username_input text, password_input text)
RETURNS TABLE (
    user_id uuid,
    username text,
    role text
) 
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT 
        u.id,
        u.username,
        u.role::text
    FROM public.simple_users u
    WHERE u.username = username_input 
    AND u.password = password_input;
$$;