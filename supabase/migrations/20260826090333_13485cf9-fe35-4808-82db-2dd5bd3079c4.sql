
CREATE OR REPLACE FUNCTION public.payment_module(_category text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _category WHEN 'billboard' THEN 'billboard_payments' WHEN 'lcd' THEN 'lcd_payments' ELSE 'influencer_payments' END;
$$;

REVOKE ALL ON FUNCTION public.log_audit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_perm(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.payment_module(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_perm(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.payment_module(text) TO authenticated;
