-- Supprimer toutes les politiques existantes qui ne fonctionnent pas
DROP POLICY IF EXISTS "Admins can manage all patients" ON public.patients;
DROP POLICY IF EXISTS "Viewers can see assigned patients" ON public.patients;
DROP POLICY IF EXISTS "Creators can insert new patients" ON public.patients;
DROP POLICY IF EXISTS "Creators can update patients they created in current session" ON public.patients;

-- Créer les nouvelles politiques RLS correctes pour les patients
-- 1. Politique pour les admins (accès complet)
CREATE POLICY "Admins can manage all patients" ON public.patients
FOR ALL USING (is_admin());

-- 2. Politique pour les viewers (consultation seulement des patients assignés)
CREATE POLICY "Viewers can see assigned patients" ON public.patients
FOR SELECT USING (
    -- Admin peut tout voir
    is_admin() 
    OR 
    -- Viewers avec accès spécifique à ce patient
    EXISTS (
        SELECT 1 FROM public.patient_access pa 
        JOIN public.simple_users su ON su.id = pa.user_id
        WHERE su.username = current_setting('app.current_user', true)
        AND pa.patient_id = patients.id 
        AND pa.can_view = true
    )
);

-- 3. Politique pour les creators (peuvent créer)
CREATE POLICY "Creators can insert new patients" ON public.patients
FOR INSERT WITH CHECK (
    is_admin() 
    OR 
    EXISTS (
        SELECT 1 FROM public.user_permissions up 
        JOIN public.simple_users su ON su.id = up.user_id
        WHERE su.username = current_setting('app.current_user', true)
        AND up.permission_type = 'creator' 
        AND up.can_create_new_patients = true
    )
);

-- 4. Politique pour que les creators puissent modifier seulement leurs patients créés dans la session
CREATE POLICY "Creators can update their created patients" ON public.patients
FOR UPDATE USING (
    is_admin() 
    OR 
    EXISTS (
        SELECT 1 FROM public.user_created_patients ucp 
        JOIN public.simple_users su ON su.id = ucp.user_id
        WHERE su.username = current_setting('app.current_user', true)
        AND ucp.patient_id = patients.id 
        AND ucp.session_id = current_setting('app.session_id', true)
    )
);

-- 5. Aucune suppression pour les non-admins
CREATE POLICY "Only admins can delete patients" ON public.patients
FOR DELETE USING (is_admin());

-- Mettre à jour la fonction pour définir la session
CREATE OR REPLACE FUNCTION public.set_session_id(session_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    PERFORM set_config('app.session_id', session_value, false);
END;
$function$;