-- Add dialysis date fields and cause for end of dialysis
ALTER TABLE public.patients 
ADD COLUMN date_debut_dialyse date,
ADD COLUMN date_fin_dialyse date,
ADD COLUMN cause_fin_dialyse text CHECK (cause_fin_dialyse IN ('deces', 'guerie', 'greffe', 'transfert') OR cause_fin_dialyse IS NULL);

-- Add a trigger to ensure cause_fin_dialyse is required when date_fin_dialyse is set
CREATE OR REPLACE FUNCTION validate_dialysis_end()
RETURNS TRIGGER AS $$
BEGIN
  -- If date_fin_dialyse is set, cause_fin_dialyse must be set
  IF NEW.date_fin_dialyse IS NOT NULL AND NEW.cause_fin_dialyse IS NULL THEN
    RAISE EXCEPTION 'La cause de fin de dialyse est obligatoire quand une date de fin est spécifiée';
  END IF;
  
  -- If cause_fin_dialyse is set, date_fin_dialyse must be set
  IF NEW.cause_fin_dialyse IS NOT NULL AND NEW.date_fin_dialyse IS NULL THEN
    RAISE EXCEPTION 'La date de fin de dialyse est obligatoire quand une cause de fin est spécifiée';
  END IF;
  
  -- Date fin cannot be before date debut
  IF NEW.date_fin_dialyse IS NOT NULL AND NEW.date_debut_dialyse IS NOT NULL 
     AND NEW.date_fin_dialyse < NEW.date_debut_dialyse THEN
    RAISE EXCEPTION 'La date de fin de dialyse ne peut pas être antérieure à la date de début';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_dialysis_end_trigger
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION validate_dialysis_end();