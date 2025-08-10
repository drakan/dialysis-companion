-- Fonction pour créer les permissions par défaut selon le rôle
CREATE OR REPLACE FUNCTION public.create_default_permissions_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Si l'utilisateur n'est pas admin, créer des permissions par défaut
  IF NEW.role != 'admin' THEN
    INSERT INTO public.user_permissions (user_id, permission_type, can_view_all_patients, can_create_new_patients)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.role = 'creator' THEN 'creator'
        ELSE 'viewer'
      END,
      CASE 
        WHEN NEW.role = 'creator' THEN true
        ELSE false
      END,
      CASE 
        WHEN NEW.role = 'creator' THEN true
        ELSE false
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger pour automatiquement créer les permissions
CREATE TRIGGER create_user_permissions_trigger
  AFTER INSERT ON public.simple_users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_permissions_for_user();