-- Make the trigger more resilient by using a separate function approach
-- This avoids transaction rollbacks from blocking user creation

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists INTEGER;
BEGIN
  -- Check if profile already exists (avoid duplicate)
  SELECT COUNT(*) INTO profile_exists FROM public.profiles WHERE id = NEW.id;
  
  IF profile_exists = 0 THEN
    -- Create profile for new user
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;