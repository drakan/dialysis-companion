-- Fix the foreign key constraint in user_permissions table
ALTER TABLE public.user_permissions 
DROP CONSTRAINT IF EXISTS user_permissions_user_id_fkey;

-- Add the correct foreign key constraint referencing simple_users
ALTER TABLE public.user_permissions 
ADD CONSTRAINT user_permissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.simple_users(id) ON DELETE CASCADE;