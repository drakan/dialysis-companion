-- Drop trigger first, then recreate function with proper security settings
DROP TRIGGER IF EXISTS validate_dialysis_end_trigger ON public.patients;
DROP FUNCTION IF EXISTS validate_dialysis_end() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_dialysis_end()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;

-- Recreate the trigger
CREATE TRIGGER validate_dialysis_end_trigger
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.validate_dialysis_end();