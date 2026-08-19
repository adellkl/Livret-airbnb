-- Livret d'accueil — schéma initial Supabase
-- À exécuter une seule fois dans Supabase > SQL Editor.
-- Les comptes sont gérés par Supabase Auth dans auth.users.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Types
-- ─────────────────────────────────────────────────────────────────────────────

create type public.property_status as enum ('draft', 'published', 'archived');
create type public.guide_access_mode as enum ('public_link', 'pin', 'date_limited');
create type public.reservation_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type public.guide_event_type as enum ('view', 'qr_scan', 'section_view', 'contact_click', 'wifi_copy');

-- ─────────────────────────────────────────────────────────────────────────────
-- Fonction commune de mise à jour des dates
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Utilisateurs et logements
-- ─────────────────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Crée automatiquement le profil applicatif à chaque inscription Supabase Auth.
-- full_name est purement informatif : il n'est jamais utilisé pour autoriser un accès.
create schema if not exists private;

create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));
  return new;
end;
$$;

create trigger auth_user_created_profile
  after insert on auth.users
  for each row execute function private.create_profile_for_new_user();

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  property_type text not null default 'Appartement',
  address_line1 text not null,
  address_line2 text,
  postal_code text not null,
  city text not null,
  country_code text not null default 'FR' check (char_length(country_code) = 2),
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  capacity smallint not null default 1 check (capacity > 0),
  bedrooms smallint not null default 0 check (bedrooms >= 0),
  description text not null default '',
  host_name text not null default '',
  host_phone text not null default '',
  host_email text not null default '',
  emergency_contact text,
  check_in_time time,
  check_out_time time,
  arrival_instructions text,
  access_instructions text,
  parking_instructions text,
  departure_instructions text,
  wifi_name text,
  wifi_password text,
  cover_image_url text,
  welcome_title text not null default 'Bienvenue chez vous',
  accent_color text not null default '#d85b24'
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  status public.property_status not null default 'draft',
  public_token uuid not null default gen_random_uuid() unique,
  access_mode public.guide_access_mode not null default 'public_link',
  access_pin_hash text,
  access_starts_at timestamptz,
  access_ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  archived_at timestamptz,
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180),
  check (access_ends_at is null or access_starts_at is null or access_ends_at > access_starts_at),
  check ((access_mode <> 'pin') or access_pin_hash is not null)
);

create index properties_owner_id_idx on public.properties(owner_id);
create index properties_status_idx on public.properties(status);
create index properties_public_token_idx on public.properties(public_token);

-- ─────────────────────────────────────────────────────────────────────────────
-- Contenu du livret (une ligne par élément, facile à trier et à éditer)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.guide_sections (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  section_key text not null check (section_key in (
    'welcome', 'arrival', 'wifi_equipment', 'house_rules', 'faq',
    'restaurants', 'activities', 'contact', 'departure'
  )),
  title text not null,
  subtitle text,
  icon text,
  is_visible boolean not null default true,
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (property_id, section_key),
  unique (property_id, position)
);

create index guide_sections_property_position_idx on public.guide_sections(property_id, position);

create table public.property_amenities (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  icon text,
  description text,
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (property_id, name)
);

create index property_amenities_property_position_idx on public.property_amenities(property_id, position);

create table public.equipment_guides (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  subtitle text,
  icon text,
  description text,
  image_url text,
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index equipment_guides_property_position_idx on public.equipment_guides(property_id, position);

create table public.property_house_rules (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  rule_text text not null,
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (property_id, rule_text)
);

create index property_house_rules_property_position_idx on public.property_house_rules(property_id, position);

create table public.property_faqs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  question text not null,
  answer text not null,
  position smallint not null default 0 check (position >= 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (property_id, question)
);

create index property_faqs_property_position_idx on public.property_faqs(property_id, position);

create table public.nearby_places (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  category text not null,
  address text,
  note text,
  distance_label text,
  rating numeric(2, 1) check (rating is null or rating between 0 and 5),
  image_url text,
  maps_url text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  position smallint not null default 0 check (position >= 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create index nearby_places_property_position_idx on public.nearby_places(property_id, position);

-- ─────────────────────────────────────────────────────────────────────────────
-- Réservations et statistiques
-- ─────────────────────────────────────────────────────────────────────────────

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_name text not null,
  guest_email text,
  guest_phone text,
  guests_count smallint not null default 1 check (guests_count > 0),
  check_in_date date not null,
  check_out_date date not null,
  status public.reservation_status not null default 'pending',
  guide_token uuid not null default gen_random_uuid() unique,
  access_pin_hash text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (check_out_date > check_in_date)
);

create index reservations_property_dates_idx on public.reservations(property_id, check_in_date, check_out_date);
create index reservations_guide_token_idx on public.reservations(guide_token);

create table public.guide_events (
  id bigint generated always as identity primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  event_type public.guide_event_type not null,
  section_key text,
  visitor_id uuid,
  device_type text,
  city text,
  country_code text,
  occurred_at timestamptz not null default timezone('utc', now())
);

create index guide_events_property_occurred_idx on public.guide_events(property_id, occurred_at desc);
create index guide_events_reservation_idx on public.guide_events(reservation_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Mise à jour automatique de updated_at
-- ─────────────────────────────────────────────────────────────────────────────

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger properties_set_updated_at before update on public.properties
  for each row execute function public.set_updated_at();
create trigger guide_sections_set_updated_at before update on public.guide_sections
  for each row execute function public.set_updated_at();
create trigger equipment_guides_set_updated_at before update on public.equipment_guides
  for each row execute function public.set_updated_at();
create trigger property_faqs_set_updated_at before update on public.property_faqs
  for each row execute function public.set_updated_at();
create trigger nearby_places_set_updated_at before update on public.nearby_places
  for each row execute function public.set_updated_at();
create trigger reservations_set_updated_at before update on public.reservations
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security : chaque propriétaire ne voit et ne modifie que ses données
-- L'accès voyageur doit passer par une route serveur qui vérifie public_token ou
-- guide_token. Ne donnez pas un SELECT anonyme aux tables ci-dessus : cela
-- exposerait notamment les mots de passe Wi-Fi et les contacts.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.guide_sections enable row level security;
alter table public.property_amenities enable row level security;
alter table public.equipment_guides enable row level security;
alter table public.property_house_rules enable row level security;
alter table public.property_faqs enable row level security;
alter table public.nearby_places enable row level security;
alter table public.reservations enable row level security;
alter table public.guide_events enable row level security;

create policy "Owners manage their profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Owners manage their properties" on public.properties
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owners manage their guide sections" on public.guide_sections
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())));

create policy "Owners manage their amenities" on public.property_amenities
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())));

create policy "Owners manage their equipment guides" on public.equipment_guides
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())));

create policy "Owners manage their house rules" on public.property_house_rules
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())));

create policy "Owners manage their FAQs" on public.property_faqs
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())));

create policy "Owners manage their nearby places" on public.nearby_places
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())));

create policy "Owners manage their reservations" on public.reservations
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())));

create policy "Owners read their guide analytics" on public.guide_events
  for select to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())));

-- Le navigateur authentifié peut écrire un événement uniquement pour l'un de ses
-- propres logements. Pour les événements voyageurs, utilisez une route serveur.
create policy "Owners create their own guide events" on public.guide_events
  for insert to authenticated
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())));

-- Permissions Data API explicites. RLS reste l'autorité sur les lignes.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Bucket d'images : créer dans Storage. Les fichiers seront rangés sous
-- <auth.uid()>/<property_id>/<nom-du-fichier>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-media', 'property-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Owners upload property media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Owners read property media" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Owners update property media" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Owners delete property media" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
