-- Platform-admin read model. Executable only by service_role; the Next.js
-- server calls it after verifying the caller is listed in public.platform_admins.
create or replace function public.admin_merchants()
returns table (
  user_id uuid,
  email text,
  signed_up_at timestamptz,
  last_sign_in_at timestamptz,
  store_id uuid,
  store_name text,
  slug text,
  store_status text,
  suspended_at timestamptz,
  suspended_reason text,
  published_at timestamptz,
  subscription_status text,
  effective_status text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  product_count int,
  order_count int,
  last_order_at timestamptz,
  image_bytes bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text, u.created_at, u.last_sign_in_at,
         s.id, s.name, s.slug::text, s.status, s.suspended_at, s.suspended_reason, s.published_at,
         sub.status, public.account_entitlement(u.id), sub.trial_ends_at, sub.current_period_end,
         (select count(*)::int from public.products p where p.store_id = s.id and p.status <> 'archived'),
         (select count(*)::int from public.orders o where o.store_id = s.id),
         (select max(o.created_at) from public.orders o where o.store_id = s.id),
         (select coalesce(sum(i.bytes), 0)::bigint from public.product_images i where i.store_id = s.id)
  from auth.users u
  left join public.subscriptions sub on sub.user_id = u.id
  left join public.stores s on s.owner_id = u.id
  order by u.created_at desc;
$$;

revoke all on function public.admin_merchants() from public, anon, authenticated;
grant execute on function public.admin_merchants() to service_role;
