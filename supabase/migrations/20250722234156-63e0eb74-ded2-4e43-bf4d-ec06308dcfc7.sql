-- Create a function to set configuration (since Postgres set_config is not directly accessible)
CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text, is_local boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM set_config(setting_name, setting_value, is_local);
END;
$$;