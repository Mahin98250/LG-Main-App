-- Security hardening: this function is invoked by a database trigger, not by client RPC.
-- Keep the SECURITY DEFINER execution context for the trigger, but remove direct API execution.
REVOKE EXECUTE ON FUNCTION public.notify_parents_of_test_result() FROM anon, authenticated;
