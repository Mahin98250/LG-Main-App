-- Passwords belong exclusively to Supabase Auth.
-- Keep the legacy nullable column for schema compatibility, but remove every
-- stored plaintext credential immediately. New application writes are already
-- sanitized to exclude this column.
UPDATE public.users
SET pass = NULL
WHERE pass IS NOT NULL;

COMMENT ON COLUMN public.users.pass IS 'Deprecated. Never store passwords here; credentials are managed by Supabase Auth.';
