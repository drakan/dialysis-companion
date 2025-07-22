-- Create a function to set configuration
CREATE OR REPLACE FUNCTION public.set_current_user(username_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM set_config('app.current_user', username_value, false);
END;
$$;