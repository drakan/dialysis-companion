-- Create enum for patient types
CREATE TYPE public.patient_type AS ENUM ('permanent', 'vacancier', 'transféré', 'décédé', 'greffé');

-- Create patients table
CREATE TABLE public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nom_complet TEXT NOT NULL,
    cin TEXT UNIQUE,
    ass_cnss TEXT,
    date_naiss DATE,
    sexe TEXT CHECK (sexe IN ('M', 'F')),
    gs TEXT,
    tele TEXT,
    tele_urg TEXT,
    adresse TEXT,
    profession TEXT,
    situa_fami TEXT,
    type patient_type DEFAULT 'permanent',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create policies for patients table
CREATE POLICY "Admins can manage all patients" 
ON public.patients 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view patients they have access to" 
ON public.patients 
FOR SELECT 
USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
        SELECT 1 FROM public.patient_access 
        WHERE user_id = auth.uid() 
        AND patient_id = patients.id 
        AND can_view = true
    )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();