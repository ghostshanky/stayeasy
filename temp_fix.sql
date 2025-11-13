DROP POLICY IF EXISTS "Service role can access users" ON public.users;
DROP POLICY IF EXISTS "Public can read users" ON public.users;
DROP POLICY IF EXISTS "Authenticated can manage users" ON public.users;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO public;
CREATE POLICY "Service role can access users" ON public.users
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
SELECT 'Testing users table access with service role...' as test;
INSERT INTO public.users (id, email, password, name, role, emailverified)
VALUES (gen_random_uuid()::text, 'test@example.com', 'hashedpassword', 'Test User', 'TENANT', true)
ON CONFLICT (email) DO NOTHING;
SELECT COUNT(*) as user_count FROM public.users WHERE email = 'test@example.com';
DELETE FROM public.users WHERE email = 'test@example.com';
SELECT COUNT(*) as total_users FROM public.users;
SELECT 'If you see counts above, service role access to public.users is working!' as success;
