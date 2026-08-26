
DO $$
DECLARE t text; m text; pol record;
  pairs text[][] := ARRAY[
    ARRAY['influencers','influencers'],
    ARRAY['influencer_targets','targets'],
    ARRAY['influencer_deliveries','deliveries'],
    ARRAY['billboards','billboards'],
    ARRAY['lcd_screens','lcd_screens'],
    ARRAY['lcd_videos','lcd_videos'],
    ARRAY['budgets','budget'],
    ARRAY['expenses','expenses'],
    ARRAY['payments','payments']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(pairs,1) LOOP
    t := pairs[i][1]; m := pairs[i][2];
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    IF t = 'payments' THEN
      EXECUTE 'CREATE POLICY "perm view payments" ON public.payments FOR SELECT TO authenticated USING (public.has_perm(public.payment_module(category), ''view''))';
      EXECUTE 'CREATE POLICY "perm add payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.has_perm(public.payment_module(category), ''add''))';
      EXECUTE 'CREATE POLICY "perm update payments" ON public.payments FOR UPDATE TO authenticated USING (public.has_perm(public.payment_module(category), ''update'') OR public.has_perm(public.payment_module(category), ''approve'')) WITH CHECK (public.has_perm(public.payment_module(category), ''update'') OR public.has_perm(public.payment_module(category), ''approve''))';
      EXECUTE 'CREATE POLICY "perm delete payments" ON public.payments FOR DELETE TO authenticated USING (public.has_perm(public.payment_module(category), ''delete''))';
    ELSE
      EXECUTE format('CREATE POLICY "perm view %1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.has_perm(%2$L, ''view''))', t, m);
      EXECUTE format('CREATE POLICY "perm add %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_perm(%2$L, ''add''))', t, m);
      EXECUTE format('CREATE POLICY "perm update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_perm(%2$L, ''update'')) WITH CHECK (public.has_perm(%2$L, ''update''))', t, m);
      EXECUTE format('CREATE POLICY "perm delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_perm(%2$L, ''delete''))', t, m);
    END IF;

    EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s ON public.%1$I', t);
    EXECUTE format('CREATE TRIGGER audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.log_audit(%2$L)', t, m);
  END LOOP;
END $$;

-- admin-only management of roles and permissions
CREATE POLICY "admin manage roles insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admin manage roles update" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin manage roles delete" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin());
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

CREATE POLICY "admin manage perms insert" ON public.user_permissions FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admin manage perms update" ON public.user_permissions FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin manage perms delete" ON public.user_permissions FOR DELETE TO authenticated USING (public.is_admin());
GRANT INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
