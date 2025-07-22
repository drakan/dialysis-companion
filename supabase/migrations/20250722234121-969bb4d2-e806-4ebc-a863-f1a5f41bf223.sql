-- Modify user_permissions table to better reflect the permission types
ALTER TABLE public.user_permissions 
DROP COLUMN can_create_patients,
DROP COLUMN can_modify_existing_patients;

-- Add new permission columns
ALTER TABLE public.user_permissions 
ADD COLUMN permission_type text CHECK (permission_type IN ('viewer', 'creator')) DEFAULT 'viewer',
ADD COLUMN can_view_all_patients boolean DEFAULT false,
ADD COLUMN can_create_new_patients boolean DEFAULT false;

-- Update RLS policies for patients table to reflect new permission system
DROP POLICY IF EXISTS "Users can view patients they have access to" ON public.patients;

-- Policy for viewers - can see specific patients or all patients based on permissions
CREATE POLICY "Viewers can see assigned patients" ON public.patients
FOR SELECT 
USING (
  -- Admins can see all
  is_admin() 
  OR 
  -- Users with viewer permission who can see all patients
  (
    EXISTS (
      SELECT 1 FROM public.user_permissions up 
      WHERE up.user_id = (
        SELECT id FROM public.simple_users 
        WHERE username = current_setting('app.current_user', true)
      )
      AND up.permission_type = 'viewer' 
      AND up.can_view_all_patients = true
    )
  )
  OR 
  -- Users with specific patient access
  (
    EXISTS (
      SELECT 1 FROM public.patient_access pa 
      WHERE pa.user_id = (
        SELECT id FROM public.simple_users 
        WHERE username = current_setting('app.current_user', true)
      )
      AND pa.patient_id = patients.id 
      AND pa.can_view = true
    )
  )
);

-- Policy for creators - can create new patients
CREATE POLICY "Creators can insert new patients" ON public.patients
FOR INSERT 
WITH CHECK (
  is_admin() 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_permissions up 
    WHERE up.user_id = (
      SELECT id FROM public.simple_users 
      WHERE username = current_setting('app.current_user', true)
    )
    AND up.permission_type = 'creator' 
    AND up.can_create_new_patients = true
  )
);

-- Add a session tracking table for creators to track their created patients
CREATE TABLE IF NOT EXISTS public.user_created_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  session_id text NOT NULL -- Track user session
);

-- Enable RLS on the tracking table
ALTER TABLE public.user_created_patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can track their created patients" ON public.user_created_patients
FOR ALL USING (
  is_admin() 
  OR 
  user_id = (
    SELECT id FROM public.simple_users 
    WHERE username = current_setting('app.current_user', true)
  )
);

-- Policy for creators to update only patients they created in current session
CREATE POLICY "Creators can update patients they created in current session" ON public.patients
FOR UPDATE 
USING (
  is_admin() 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_created_patients ucp 
    WHERE ucp.patient_id = patients.id 
    AND ucp.user_id = (
      SELECT id FROM public.simple_users 
      WHERE username = current_setting('app.current_user', true)
    )
    AND ucp.session_id = current_setting('app.session_id', true)
  )
);

-- Function to track created patients
CREATE OR REPLACE FUNCTION public.track_created_patient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  SELECT id INTO current_user_id 
  FROM public.simple_users 
  WHERE username = current_setting('app.current_user', true);
  
  -- If user exists and has creator permissions, track the patient
  IF current_user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = current_user_id 
    AND permission_type = 'creator' 
    AND can_create_new_patients = true
  ) THEN
    INSERT INTO public.user_created_patients (user_id, patient_id, session_id)
    VALUES (
      current_user_id, 
      NEW.id, 
      COALESCE(current_setting('app.session_id', true), gen_random_uuid()::text)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to track created patients
CREATE TRIGGER track_patient_creation
  AFTER INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.track_created_patient();