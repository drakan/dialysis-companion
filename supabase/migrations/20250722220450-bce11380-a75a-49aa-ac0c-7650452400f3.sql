-- Simple authentication table with basic password storage
-- For simple internal app, we'll use basic hashing
CREATE TABLE public.simple_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Simple password storage for internal app
    nom_complet TEXT NOT NULL,
    role app_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simple_users ENABLE ROW LEVEL SECURITY;

-- Insert default admin
INSERT INTO public.simple_users (username, password, nom_complet, role)
VALUES ('admin', 'admin', 'Administrateur', 'admin');

-- Create policies (simplified for internal app)
CREATE POLICY "Anyone can authenticate" 
ON public.simple_users 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage all users" 
ON public.simple_users 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.simple_users 
        WHERE username = current_setting('app.current_user', true)
        AND role = 'admin'
    )
);

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
    AND u.password = password_input;
$$;

-- Create function to create new user
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
    INSERT INTO public.simple_users (username, password, nom_complet, role)
    VALUES (
        username_input, 
        password_input,
        nom_complet_input, 
        role_input::public.app_role
    )
    RETURNING id;
$$;

-- Create function to update password
CREATE OR REPLACE FUNCTION public.update_user_password(
    username_input TEXT,
    new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
    UPDATE public.simple_users 
    SET password = new_password,
        updated_at = now()
    WHERE username = username_input;
    
    SELECT true;
$$;

-- Create trigger for timestamps
CREATE TRIGGER update_simple_users_updated_at
BEFORE UPDATE ON public.simple_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();