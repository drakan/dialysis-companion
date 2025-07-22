-- Simplify authentication by removing email dependency
-- Add a simple users table for username/password auth
CREATE TABLE public.simple_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nom_complet TEXT NOT NULL,
    role app_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simple_users ENABLE ROW LEVEL SECURITY;

-- Insert default admin
INSERT INTO public.simple_users (username, password_hash, nom_complet, role)
VALUES ('admin', crypt('admin', gen_salt('bf')), 'Administrateur', 'admin');

-- Create policies
CREATE POLICY "Admins can manage all simple_users" 
ON public.simple_users 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.simple_users 
        WHERE id = current_setting('app.current_user_id')::uuid 
        AND role = 'admin'
    )
);

CREATE POLICY "Users can view their own data" 
ON public.simple_users 
FOR SELECT 
USING (id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Users can update their own data" 
ON public.simple_users 
FOR UPDATE 
USING (id = current_setting('app.current_user_id')::uuid);

-- Create function to authenticate user
CREATE OR REPLACE FUNCTION public.authenticate_user(username_input TEXT, password_input TEXT)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    nom_complet TEXT,
    role TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT 
        u.id,
        u.username,
        u.nom_complet,
        u.role::text
    FROM public.simple_users u
    WHERE u.username = username_input 
    AND u.password_hash = crypt(password_input, u.password_hash);
$$;

-- Create function to create new user (admin only)
CREATE OR REPLACE FUNCTION public.create_user(
    username_input TEXT,
    password_input TEXT,
    nom_complet_input TEXT,
    role_input TEXT DEFAULT 'user'
)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
    INSERT INTO public.simple_users (username, password_hash, nom_complet, role)
    VALUES (
        username_input, 
        crypt(password_input, gen_salt('bf')), 
        nom_complet_input, 
        role_input::public.app_role
    )
    RETURNING id;
$$;

-- Create function to update password
CREATE OR REPLACE FUNCTION public.update_user_password(
    user_id_input UUID,
    new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
    UPDATE public.simple_users 
    SET password_hash = crypt(new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = user_id_input;
    
    SELECT true;
$$;

-- Create trigger for timestamps
CREATE TRIGGER update_simple_users_updated_at
BEFORE UPDATE ON public.simple_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();