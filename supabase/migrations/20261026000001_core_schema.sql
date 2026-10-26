-- ============================================================================
-- Dukan — core multi-tenant schema
--
-- Security model (read before changing anything):
--   * Every tenant-owned row carries store_id. Merchants reach rows only through
--     store_memberships, enforced by RLS (policies use public.is_store_member()).
--   * anon has NO direct table access. Public storefront data is served by
--     SECURITY DEFINER functions that return only public fields of published,
--     non-suspended stores.
--   * Orders are created only by public.place_order(), executable solely by
--     service_role (called from the Next.js server, which adds rate-limit data).
--   * Privileged columns (status, slug, subscription data, order numbers) are not
--     updatable by merchants; dedicated functions change them after validation.
-- ============================================================================

create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Platform administrators. Granted only by SQL (see README). Never derived from
-- user metadata or any client-editable field.
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- One subscription per merchant account. The trial is tied to the account, not
-- to a store, so creating another store can never restart it.
create table public.subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'trialing', 'active', 'past_due', 'canceled', 'expired')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  provider text not null default 'manual',
  provider_customer_id text,
  provider_subscription_id text,
  note text,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint trial_window check (
    (trial_started_at is null and trial_ends_at is null)
    or (trial_started_at is not null and trial_ends_at > trial_started_at)
  )
);

-- ---------------------------------------------------------------------------
-- Stores
-- ---------------------------------------------------------------------------

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  slug extensions.citext not null unique
    check (slug ~ '^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$' and slug !~ '--'),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  category text not null default 'other'
    check (category in ('bakery', 'food', 'handmade', 'gifts', 'ceramics', 'jewelry', 'fashion', 'other')),
  description text not null default '' check (char_length(description) <= 600),
  phone text check (phone is null or phone ~ '^[0-9+() -]{7,20}$'),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9+() -]{7,20}$'),
  contact_email text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  instagram text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  logo_path text,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  published_at timestamptz,
  accepting_orders boolean not null default true,
  suspended_at timestamptz,
  suspended_reason text,
  next_order_number integer not null default 1001,
  -- Reserved for branded domains / subdomains (tenant resolution by host).
  custom_domain extensions.citext unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index stores_owner_idx on public.stores (owner_id);

-- Old slugs keep working: they redirect to the store's current slug.
create table public.store_slug_history (
  slug extensions.citext primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index store_slug_history_store_idx on public.store_slug_history (store_id);

create table public.store_memberships (
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);
create index store_memberships_user_idx on public.store_memberships (user_id);

create table public.store_settings (
  store_id uuid primary key references public.stores (id) on delete cascade,
  template text not null default 'artisan' check (template in ('boutique', 'artisan', 'bold')),
  font_preset text not null default 'warm' check (font_preset in ('elegant', 'warm', 'modern', 'classic')),
  color_primary text not null default '#5B3A29' check (color_primary ~ '^#[0-9A-Fa-f]{6}$'),
  color_accent text not null default '#C2416B' check (color_accent ~ '^#[0-9A-Fa-f]{6}$'),
  hero_title text not null default '' check (char_length(hero_title) <= 90),
  hero_subtitle text not null default '' check (char_length(hero_subtitle) <= 200),
  hero_image_path text,
  about_title text not null default '' check (char_length(about_title) <= 80),
  about_text text not null default '' check (char_length(about_text) <= 1500),
  pickup_address text not null default '' check (char_length(pickup_address) <= 200),
  pickup_instructions text not null default '' check (char_length(pickup_instructions) <= 600),
  pickup_requires_slot boolean not null default false,
  pickup_lead_hours integer not null default 24 check (pickup_lead_hours between 0 and 336),
  payment_note text not null default 'התשלום מתבצע ישירות מול העסק — במזומן, בביט או בהעברה, לפי מה שסוכם.'
    check (char_length(payment_note) <= 300),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (store_id, name),
  unique (id, store_id)
);
create index categories_store_idx on public.categories (store_id, position);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  category_id uuid,
  name text not null default '' check (char_length(name) <= 100),
  slug text not null check (slug ~ '^[a-z0-9-]{1,80}$'),
  description text not null default '' check (char_length(description) <= 2000),
  price_agorot integer check (price_agorot is null or price_agorot between 0 and 10000000),
  status text not null default 'draft' check (status in ('draft', 'active', 'hidden', 'archived')),
  in_stock boolean not null default true,
  is_featured boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug),
  unique (id, store_id),
  -- A product can only reference a category of the same store.
  foreign key (category_id, store_id) references public.categories (id, store_id)
    on delete set null (category_id),
  -- Only complete products can be shown publicly.
  constraint active_requires_name_and_price check (
    status <> 'active' or (char_length(btrim(name)) > 0 and price_agorot is not null)
  )
);
create index products_store_idx on public.products (store_id, status, position);
create index products_category_idx on public.products (category_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  product_id uuid not null,
  path text not null check (path ~ '^[0-9a-f-]{36}/[a-z]+/[0-9a-f-]{36}$'),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  bytes integer not null default 0,
  alt text not null default '' check (char_length(alt) <= 200),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  foreign key (product_id, store_id) references public.products (id, store_id) on delete cascade,
  -- Storage paths always live under the owning store's folder.
  constraint path_in_store_folder check (split_part(path, '/', 1) = store_id::text)
);
create index product_images_product_idx on public.product_images (product_id, position);
create index product_images_store_idx on public.product_images (store_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  order_number integer not null,
  public_token uuid not null default gen_random_uuid() unique,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'preparing', 'ready', 'completed', 'canceled')),
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 80),
  customer_phone text not null check (customer_phone ~ '^[0-9+() -]{9,20}$'),
  customer_email text check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  pickup_at timestamptz,
  notes text not null default '' check (char_length(notes) <= 1000),
  total_agorot integer not null check (total_agorot >= 0),
  item_count integer not null check (item_count > 0),
  idempotency_key uuid not null,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status_updated_at timestamptz not null default now(),
  unique (store_id, order_number),
  unique (store_id, idempotency_key),
  unique (id, store_id)
);
create index orders_store_created_idx on public.orders (store_id, created_at desc);
create index orders_store_status_idx on public.orders (store_id, status);
create index orders_ip_recent_idx on public.orders (ip_hash, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  store_id uuid not null,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price_agorot integer not null check (unit_price_agorot >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total_agorot integer not null check (line_total_agorot >= 0),
  foreign key (order_id, store_id) references public.orders (id, store_id) on delete cascade
);
create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Audit log (written by server-side code with elevated privileges)
-- ---------------------------------------------------------------------------

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  store_id uuid references public.stores (id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger stores_touch before update on public.stores
  for each row execute function public.touch_updated_at();
create trigger store_settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();

create or replace function public.orders_track_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.status_updated_at := now();
  end if;
  return new;
end;
$$;
create trigger orders_status_change before update on public.orders
  for each row execute function public.orders_track_status();

-- ---------------------------------------------------------------------------
-- New user bootstrap: profile + (not yet started) subscription
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120))
  on conflict (id) do nothing;
  insert into public.subscriptions (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Authorization helpers (used by RLS)
-- ---------------------------------------------------------------------------

create or replace function public.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.store_memberships m
    where m.store_id = p_store_id and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_store_owner(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.store_memberships m
    where m.store_id = p_store_id and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

-- Effective entitlement of an account, computed from server time only.
create or replace function public.account_entitlement(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when s.status = 'active' and (s.current_period_end is null or s.current_period_end > now()) then 'active'
    when s.status = 'past_due' and (s.current_period_end is null or s.current_period_end > now() - interval '3 days') then 'past_due'
    when s.status = 'canceled' and s.current_period_end > now() then 'active'
    when s.status = 'trialing' and s.trial_ends_at > now() then 'trialing'
    when s.status = 'not_started' then 'not_started'
    else 'expired'
  end
  from public.subscriptions s
  where s.user_id = p_user_id;
$$;

-- Why a store can or cannot take orders right now.
create or replace function public.store_order_gate(p_store_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when st.suspended_at is not null then 'suspended'
    when st.status <> 'published' then 'not_published'
    when not st.accepting_orders then 'paused'
    when coalesce(public.account_entitlement(st.owner_id), 'expired') not in ('active', 'trialing', 'past_due')
      then 'subscription_inactive'
    else 'ok'
  end
  from public.stores st
  where st.id = p_store_id;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stores enable row level security;
alter table public.store_slug_history enable row level security;
alter table public.store_memberships enable row level security;
alter table public.store_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.audit_logs enable row level security;

-- Start from zero privileges for API roles, then grant explicitly.
-- service_role (server only, bypasses RLS) keeps full access as on hosted Supabase.
revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
revoke all on all functions in schema public from public, anon, authenticated;

-- profiles: a user sees and edits only their own profile.
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- subscriptions: read-only for the account owner. Changes happen server-side.
grant select on public.subscriptions to authenticated;
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

-- platform_admins, store_slug_history, audit_logs: no API access at all.

-- stores: members read/update their own store; creation and status changes go
-- through security-definer functions.
grant select on public.stores to authenticated;
grant update (name, category, description, phone, whatsapp, contact_email, instagram, logo_path, accepting_orders)
  on public.stores to authenticated;
create policy stores_select_member on public.stores
  for select to authenticated using (public.is_store_member(id));
create policy stores_update_member on public.stores
  for update to authenticated using (public.is_store_member(id)) with check (public.is_store_member(id));

grant select on public.store_memberships to authenticated;
create policy memberships_select_own on public.store_memberships
  for select to authenticated using (user_id = (select auth.uid()));

grant select on public.store_settings to authenticated;
grant update (template, font_preset, color_primary, color_accent, hero_title, hero_subtitle, hero_image_path,
  about_title, about_text, pickup_address, pickup_instructions, pickup_requires_slot, pickup_lead_hours, payment_note)
  on public.store_settings to authenticated;
create policy settings_select_member on public.store_settings
  for select to authenticated using (public.is_store_member(store_id));
create policy settings_update_member on public.store_settings
  for update to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

grant select, insert, update, delete on public.categories to authenticated;
create policy categories_all_member on public.categories
  for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

grant select, insert, update, delete on public.products to authenticated;
create policy products_all_member on public.products
  for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

grant select, insert, update, delete on public.product_images to authenticated;
create policy product_images_all_member on public.product_images
  for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

-- orders: members read and change status only. No insert/delete from the API.
grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated;
create policy orders_select_member on public.orders
  for select to authenticated using (public.is_store_member(store_id));
create policy orders_update_member on public.orders
  for update to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

grant select on public.order_items to authenticated;
create policy order_items_select_member on public.order_items
  for select to authenticated using (public.is_store_member(store_id));

-- ---------------------------------------------------------------------------
-- Store lifecycle functions
-- ---------------------------------------------------------------------------

create or replace function public.slug_is_available(p_slug text, p_store_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_slug ~ '^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$'
    and p_slug !~ '--'
    and p_slug not in ('admin', 'api', 'app', 'dashboard', 'login', 'signup', 'store', 'stores', 'www', 'help', 'support', 'pricing', 'platform-admin')
    and not exists (select 1 from public.stores s where s.slug = p_slug::extensions.citext and s.id is distinct from p_store_id)
    and not exists (select 1 from public.store_slug_history h where h.slug = p_slug::extensions.citext and h.store_id is distinct from p_store_id);
$$;

-- MVP: one store per merchant account.
create or replace function public.create_store(
  p_name text,
  p_slug text,
  p_category text default 'other',
  p_description text default '',
  p_phone text default null,
  p_whatsapp text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_store_id uuid;
  v_template text;
  v_font text;
  v_primary text;
  v_accent text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if exists (select 1 from public.stores where owner_id = v_uid) then
    raise exception 'store_exists' using errcode = 'P0001';
  end if;
  if not public.slug_is_available(lower(p_slug)) then
    raise exception 'slug_taken' using errcode = 'P0001';
  end if;

  insert into public.stores (owner_id, slug, name, category, description, phone, whatsapp)
  values (v_uid, lower(p_slug), btrim(p_name), p_category, coalesce(p_description, ''),
          nullif(btrim(p_phone), ''), nullif(btrim(p_whatsapp), ''))
  returning id into v_store_id;

  insert into public.store_memberships (store_id, user_id, role) values (v_store_id, v_uid, 'owner');

  -- Pick a starting look that fits the business type.
  select t, f, p, a into v_template, v_font, v_primary, v_accent
  from (values
    ('bakery',   'artisan',  'warm',    '#5B3A29', '#C2416B'),
    ('food',     'artisan',  'warm',    '#3F5A2A', '#D9822B'),
    ('jewelry',  'boutique', 'elegant', '#2B2230', '#A88B5A'),
    ('ceramics', 'boutique', 'classic', '#3B3A36', '#B5651D'),
    ('gifts',    'boutique', 'elegant', '#4A2C3A', '#C08A3E'),
    ('handmade', 'artisan',  'classic', '#2F4858', '#D1603D'),
    ('fashion',  'bold',     'modern',  '#111827', '#E2483D'),
    ('other',    'bold',     'modern',  '#1E2A78', '#F2A900')
  ) as d(c, t, f, p, a)
  where d.c = p_category;

  insert into public.store_settings (store_id, template, font_preset, color_primary, color_accent, hero_title, about_title)
  values (v_store_id, coalesce(v_template, 'bold'), coalesce(v_font, 'modern'),
          coalesce(v_primary, '#1E2A78'), coalesce(v_accent, '#F2A900'),
          btrim(p_name), 'קצת עלינו');

  return v_store_id;
end;
$$;

create or replace function public.change_store_slug(p_store_id uuid, p_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old extensions.citext;
begin
  if not public.is_store_owner(p_store_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select slug into v_old from public.stores where id = p_store_id for update;
  if v_old = lower(p_slug)::extensions.citext then
    return;
  end if;
  if not public.slug_is_available(lower(p_slug), p_store_id) then
    raise exception 'slug_taken' using errcode = 'P0001';
  end if;
  -- Moving back to an old slug of this store: drop that history row.
  delete from public.store_slug_history where slug = lower(p_slug)::extensions.citext and store_id = p_store_id;
  insert into public.store_slug_history (slug, store_id) values (v_old, p_store_id)
  on conflict (slug) do nothing;
  update public.stores set slug = lower(p_slug) where id = p_store_id;
end;
$$;

-- Validates and publishes. Starts the account's single trial on first publish.
create or replace function public.publish_store(p_store_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store public.stores;
  v_errors text[] := '{}';
  v_active int;
begin
  if not public.is_store_owner(p_store_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into v_store from public.stores where id = p_store_id for update;

  if v_store.suspended_at is not null then
    v_errors := array_append(v_errors, 'suspended');
  end if;
  if char_length(btrim(v_store.name)) = 0 then
    v_errors := array_append(v_errors, 'missing_name');
  end if;
  if coalesce(v_store.phone, v_store.whatsapp) is null then
    v_errors := array_append(v_errors, 'missing_contact');
  end if;
  select count(*) into v_active from public.products
    where store_id = p_store_id and status = 'active';
  if v_active = 0 then
    v_errors := array_append(v_errors, 'no_active_products');
  end if;

  if array_length(v_errors, 1) > 0 then
    return jsonb_build_object('ok', false, 'errors', to_jsonb(v_errors));
  end if;

  update public.stores
    set status = 'published', published_at = coalesce(published_at, now())
    where id = p_store_id;

  update public.subscriptions
    set status = 'trialing', trial_started_at = now(), trial_ends_at = now() + interval '7 days'
    where user_id = v_store.owner_id and status = 'not_started' and trial_started_at is null;

  return jsonb_build_object('ok', true, 'slug', v_store.slug);
end;
$$;

create or replace function public.unpublish_store(p_store_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_store_owner(p_store_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.stores set status = 'unpublished' where id = p_store_id and status = 'published';
end;
$$;

-- The caller's own account status, evaluated against server time.
create or replace function public.my_account_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'status', s.status,
    'effective', public.account_entitlement(s.user_id),
    'trial_started_at', s.trial_started_at,
    'trial_ends_at', s.trial_ends_at,
    'current_period_end', s.current_period_end,
    'server_now', now(),
    'trial_days_left', case
      when s.trial_ends_at is null then null
      else greatest(0, ceil(extract(epoch from (s.trial_ends_at - now())) / 86400))::int
    end
  )
  from public.subscriptions s
  where s.user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Public storefront payload (no private fields)
-- ---------------------------------------------------------------------------

create or replace function public._store_payload(p_store_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'store', jsonb_build_object(
      'id', st.id, 'slug', st.slug, 'name', st.name, 'category', st.category,
      'description', st.description, 'phone', st.phone, 'whatsapp', st.whatsapp,
      'contact_email', st.contact_email, 'instagram', st.instagram, 'logo_path', st.logo_path,
      'status', st.status, 'updated_at', st.updated_at
    ),
    'settings', to_jsonb(se) - 'store_id',
    'order_gate', public.store_order_gate(st.id),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) order by c.position, c.name)
      from public.categories c
      where c.store_id = st.id
        and exists (select 1 from public.products p where p.category_id = c.id and p.status = 'active')
    ), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'slug', p.slug, 'name', p.name, 'description', p.description,
        'price_agorot', p.price_agorot, 'in_stock', p.in_stock, 'is_featured', p.is_featured,
        'category_id', p.category_id,
        'images', coalesce((
          select jsonb_agg(jsonb_build_object('path', i.path, 'width', i.width, 'height', i.height, 'alt', i.alt)
                           order by i.position, i.created_at)
          from public.product_images i where i.product_id = p.id
        ), '[]'::jsonb)
      ) order by p.position, p.created_at)
      from public.products p
      where p.store_id = st.id and p.status = 'active'
    ), '[]'::jsonb)
  )
  from public.stores st
  join public.store_settings se on se.store_id = st.id
  where st.id = p_store_id;
$$;

-- Public lookup by slug. Returns {redirect} for old slugs, null when not public.
create or replace function public.public_store(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_new extensions.citext;
begin
  select id into v_id from public.stores
    where slug = p_slug::extensions.citext and status = 'published' and suspended_at is null;
  if v_id is null then
    select s.slug into v_new from public.store_slug_history h
      join public.stores s on s.id = h.store_id
      where h.slug = p_slug::extensions.citext and s.status = 'published' and s.suspended_at is null;
    if v_new is not null then
      return jsonb_build_object('redirect', v_new::text);
    end if;
    return null;
  end if;
  return public._store_payload(v_id);
end;
$$;

-- Merchant preview of their own store, regardless of publication status.
create or replace function public.store_preview(p_store_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return public._store_payload(p_store_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

-- Creates an order from a public checkout. Prices come from the database, never
-- from the client. Idempotent per (store, idempotency_key). Executable only by
-- service_role: the Next.js server supplies a keyed hash of the client IP.
create or replace function public.place_order(
  p_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_pickup_at timestamptz,
  p_notes text,
  p_items jsonb,
  p_idempotency_key uuid,
  p_ip_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store public.stores;
  v_settings public.store_settings;
  v_gate text;
  v_existing public.orders;
  v_order_id uuid;
  v_number int;
  v_total bigint := 0;
  v_count int := 0;
  v_requested int;
  v_found int;
  v_recent int;
begin
  select * into v_store from public.stores
    where slug = p_slug::extensions.citext
    for update;
  if v_store.id is null then
    raise exception 'store_not_found' using errcode = 'P0001';
  end if;

  -- Retries of the same checkout return the original order.
  select * into v_existing from public.orders
    where store_id = v_store.id and idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    return jsonb_build_object('order_number', v_existing.order_number, 'token', v_existing.public_token, 'duplicate', true);
  end if;

  v_gate := public.store_order_gate(v_store.id);
  if v_gate <> 'ok' then
    raise exception 'store_closed:%', v_gate using errcode = 'P0001';
  end if;

  -- Basic abuse protection.
  if p_ip_hash is not null then
    select count(*) into v_recent from public.orders
      where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes';
    if v_recent >= 5 then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;
  end if;
  select count(*) into v_recent from public.orders
    where store_id = v_store.id and created_at > now() - interval '10 minutes';
  if v_recent >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  if char_length(btrim(coalesce(p_customer_name, ''))) not between 2 and 80 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  if coalesce(p_customer_phone, '') !~ '^[0-9+() -]{9,20}$'
     or char_length(regexp_replace(p_customer_phone, '[^0-9]', '', 'g')) not between 9 and 13 then
    raise exception 'invalid_phone' using errcode = 'P0001';
  end if;
  if nullif(btrim(p_customer_email), '') is not null and p_customer_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_notes, '')) > 1000 then
    raise exception 'invalid_notes' using errcode = 'P0001';
  end if;

  select * into v_settings from public.store_settings where store_id = v_store.id;
  if v_settings.pickup_requires_slot and p_pickup_at is null then
    raise exception 'pickup_required' using errcode = 'P0001';
  end if;
  if p_pickup_at is not null and (
       p_pickup_at < now() + make_interval(hours => v_settings.pickup_lead_hours) - interval '5 minutes'
       or p_pickup_at > now() + interval '60 days') then
    raise exception 'invalid_pickup' using errcode = 'P0001';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'invalid_items' using errcode = 'P0001';
  end if;

  create temporary table if not exists pg_temp.cart_lines (product_id uuid primary key, quantity int) on commit drop;
  truncate pg_temp.cart_lines;
  insert into pg_temp.cart_lines (product_id, quantity)
    select (e ->> 'product_id')::uuid, sum((e ->> 'quantity')::int)
    from jsonb_array_elements(p_items) e
    group by 1;

  if exists (select 1 from pg_temp.cart_lines where quantity < 1 or quantity > 99) then
    raise exception 'invalid_quantity' using errcode = 'P0001';
  end if;

  select count(*) into v_requested from pg_temp.cart_lines;
  select count(*) into v_found
    from pg_temp.cart_lines l
    join public.products p on p.id = l.product_id
    where p.store_id = v_store.id and p.status = 'active' and p.in_stock and p.price_agorot is not null;
  if v_found <> v_requested then
    raise exception 'product_unavailable' using errcode = 'P0001';
  end if;

  select sum(p.price_agorot::bigint * l.quantity), sum(l.quantity)
    into v_total, v_count
    from pg_temp.cart_lines l join public.products p on p.id = l.product_id;
  if v_total > 2000000000 then
    raise exception 'invalid_items' using errcode = 'P0001';
  end if;

  v_number := v_store.next_order_number;
  update public.stores set next_order_number = next_order_number + 1 where id = v_store.id;

  insert into public.orders (store_id, order_number, customer_name, customer_phone, customer_email,
                             pickup_at, notes, total_agorot, item_count, idempotency_key, ip_hash)
  values (v_store.id, v_number, btrim(p_customer_name), btrim(p_customer_phone),
          nullif(btrim(p_customer_email), ''), p_pickup_at, coalesce(btrim(p_notes), ''),
          v_total, v_count, p_idempotency_key, p_ip_hash)
  returning id into v_order_id;

  insert into public.order_items (order_id, store_id, product_id, product_name, unit_price_agorot, quantity, line_total_agorot)
    select v_order_id, v_store.id, p.id, p.name, p.price_agorot, l.quantity, p.price_agorot * l.quantity
    from pg_temp.cart_lines l join public.products p on p.id = l.product_id
    order by p.position, p.created_at;

  return jsonb_build_object(
    'order_number', v_number,
    'token', (select public_token from public.orders where id = v_order_id),
    'duplicate', false
  );
end;
$$;

-- Minimal confirmation data for the customer, addressed by an unguessable token.
create or replace function public.order_confirmation(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'order_number', o.order_number,
    'status', o.status,
    'created_at', o.created_at,
    'pickup_at', o.pickup_at,
    'total_agorot', o.total_agorot,
    'customer_first_name', split_part(o.customer_name, ' ', 1),
    'store', jsonb_build_object('slug', s.slug, 'name', s.name, 'phone', s.phone, 'whatsapp', s.whatsapp),
    'pickup_address', se.pickup_address,
    'pickup_instructions', se.pickup_instructions,
    'payment_note', se.payment_note,
    'items', (select jsonb_agg(jsonb_build_object('name', i.product_name, 'quantity', i.quantity,
                                                  'line_total_agorot', i.line_total_agorot))
              from public.order_items i where i.order_id = o.id)
  )
  from public.orders o
  join public.stores s on s.id = o.store_id
  join public.store_settings se on se.store_id = o.store_id
  where o.public_token = p_token
    and o.created_at > now() - interval '30 days';
$$;

-- ---------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------

revoke all on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_store_member(uuid) to authenticated;
grant execute on function public.is_store_owner(uuid) to authenticated;
grant execute on function public.slug_is_available(text, uuid) to authenticated;
grant execute on function public.create_store(text, text, text, text, text, text) to authenticated;
grant execute on function public.change_store_slug(uuid, text) to authenticated;
grant execute on function public.publish_store(uuid) to authenticated;
grant execute on function public.unpublish_store(uuid) to authenticated;
grant execute on function public.my_account_status() to authenticated;
grant execute on function public.store_preview(uuid) to authenticated;
grant execute on function public.public_store(text) to anon, authenticated;
grant execute on function public.order_confirmation(uuid) to anon, authenticated;
grant execute on function public.place_order(text, text, text, text, timestamptz, text, jsonb, uuid, text) to service_role;
