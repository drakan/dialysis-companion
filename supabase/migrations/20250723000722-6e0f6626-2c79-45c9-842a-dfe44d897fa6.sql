-- Ajouter une politique pour permettre l'authentification (lecture des utilisateurs)
CREATE POLICY "Allow authentication" ON public.simple_users
FOR SELECT USING (true);

-- Vérifier que la fonction set_current_user existe et fonctionne
CREATE OR REPLACE FUNCTION public.set_current_user(username_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    PERFORM set_config('app.current_user', username_value, false);
END;
$function$;