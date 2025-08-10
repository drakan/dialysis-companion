-- Add policy to allow users to see their own patient access
CREATE POLICY "Users can view their own patient access" 
ON public.patient_access 
FOR SELECT 
USING (
  user_id = (
    SELECT id 
    FROM public.simple_users 
    WHERE username = current_setting('app.current_user', true)
  )
);