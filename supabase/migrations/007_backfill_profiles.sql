-- Backfill script to create profiles for existing users
INSERT INTO public.user_profiles (id, full_name, email, role)
SELECT 
  id, 
  raw_user_meta_data->>'full_name', 
  email, 
  'Admin' -- Defaulting existing users to Admin for convenience during dev, change to 'Data Entry' if preferred
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles);
