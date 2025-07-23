-- Supprimer toutes les anciennes politiques qui utilisent auth.uid()
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can manage all patient access" ON public.patient_access;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.simple_users;
DROP POLICY IF EXISTS "Users can authenticate" ON public.simple_users;

-- Créer des politiques qui fonctionnent avec notre système simple
-- Pour simple_users : accès complet pour les admins
CREATE POLICY "Admins can manage all users" ON public.simple_users
FOR ALL USING (is_admin());

-- Pour user_permissions : accès complet pour les admins
CREATE POLICY "Admins can manage all permissions" ON public.user_permissions
FOR ALL USING (is_admin());

-- Pour patient_access : accès complet pour les admins
CREATE POLICY "Admins can manage all patient access" ON public.patient_access
FOR ALL USING (is_admin());

-- Mettre à jour la fonction is_admin pour qu'elle fonctionne correctement
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    current_username text;
    user_role text;
BEGIN
    -- Récupérer le nom d'utilisateur du contexte
    current_username := current_setting('app.current_user', true);
    
    -- Si pas de nom d'utilisateur dans le contexte, retourner false
    IF current_username IS NULL OR current_username = '' THEN
        RETURN false;
    END IF;
    
    -- Vérifier si l'utilisateur est admin
    SELECT role INTO user_role 
    FROM public.simple_users 
    WHERE username = current_username;
    
    RETURN user_role = 'admin';
END;
$function$;