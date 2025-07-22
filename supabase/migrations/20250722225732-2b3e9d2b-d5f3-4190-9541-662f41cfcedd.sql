-- Remove nom_complet field from simple_users table and update the interface
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

-- Create a more detailed permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.simple_users(id) ON DELETE CASCADE,
    can_create_patients boolean DEFAULT false,
    can_modify_existing_patients boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_permissions
CREATE POLICY "Admins can manage all permissions" ON public.user_permissions
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own permissions" ON public.user_permissions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update patient_access table to have proper foreign key to simple_users
ALTER TABLE public.patient_access DROP CONSTRAINT IF EXISTS patient_access_user_id_fkey;
ALTER TABLE public.patient_access ADD CONSTRAINT patient_access_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.simple_users(id) ON DELETE CASCADE;