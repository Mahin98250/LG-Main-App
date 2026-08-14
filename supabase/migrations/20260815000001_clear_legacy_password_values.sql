-- Defense-in-depth cleanup for the deprecated users.pass column.
-- Authentication credentials belong exclusively to Supabase Auth.
-- Keep the column for compatibility, but ensure no plaintext credential remains stored.
UPDATE public.users
SET pass = NULL
WHERE pass IS NOT NULL;

COMMENT ON COLUMN public.users.pass IS 'Deprecated. Never store passwords here; credentials are managed by Supabase Auth.';
