-- Run in Supabase SQL Editor AFTER profiles table exists.
-- Creates a profile row when a new auth user signs up (works with email confirmation on or off).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, school_or_org, location)
  VALUES (
    NEW.id,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'student'),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'school_or_org', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'location', '')), '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
