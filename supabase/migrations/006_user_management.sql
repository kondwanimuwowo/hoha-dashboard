-- Trigger to automatically create user_profiles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'Data Entry');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow re-running migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Security Policies for user_profiles

-- Allow admins to update everything
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Allow users to read all profiles (to see who is who)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.user_profiles;
CREATE POLICY "Authenticated users can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow users to update their own basic info (avatar, name) - BUT NOT ROLE
-- Note: This requires careful frontend handling or a separate function/policy to prevent role escalation if we were strict.
-- For now, we rely on the implementation NOT sending role updates from non-admins, 
-- or we can use a BEFORE UPDATE trigger to prevent non-admins from changing roles.

-- Let's create a safeguard trigger preventing non-admins from changing roles
CREATE OR REPLACE FUNCTION public.check_role_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Check if the current user is an Admin
    IF NOT EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'Admin'
    ) THEN
        RAISE EXCEPTION 'Only Administrators can change user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_role_update_trigger ON public.user_profiles;

CREATE TRIGGER check_role_update_trigger
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.check_role_update();
