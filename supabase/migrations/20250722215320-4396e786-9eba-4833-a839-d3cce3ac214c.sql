-- Insert default admin user
-- First, we need to insert into auth.users (this will be handled manually)
-- Then insert the profile for the admin user

-- Create trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nom_complet, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'nom_complet', 'Utilisateur'),
    CASE 
      WHEN NEW.email = 'admin@dialyse.com' THEN 'admin'::public.app_role
      ELSE 'user'::public.app_role
    END
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();