-- Roles applicatifs sûrs : un utilisateur ne peut pas se promouvoir lui-même.
create type public.app_role as enum ('owner', 'admin');

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'owner',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger user_roles_set_updated_at before update on public.user_roles
  for each row execute function public.set_updated_at();

-- L'utilisateur reçoit toujours le rôle propriétaire lors de son inscription.
-- Le rôle administrateur est attribué uniquement par un administrateur DB.
create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'owner')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Cette fonction est uniquement utilisée dans les politiques RLS. Les rôles
-- viennent de user_roles, jamais de user_metadata ni de données du navigateur.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
grant select on public.user_roles to authenticated;

alter table public.user_roles enable row level security;

create policy "Users read their role and admins read all roles" on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- Les administrateurs peuvent lire et administrer toutes les données, les
-- propriétaires ne peuvent agir que sur les leurs.
drop policy "Owners manage their profile" on public.profiles;
drop policy "Owners manage their properties" on public.properties;
drop policy "Owners manage their guide sections" on public.guide_sections;
drop policy "Owners manage their amenities" on public.property_amenities;
drop policy "Owners manage their equipment guides" on public.equipment_guides;
drop policy "Owners manage their house rules" on public.property_house_rules;
drop policy "Owners manage their FAQs" on public.property_faqs;
drop policy "Owners manage their nearby places" on public.nearby_places;
drop policy "Owners manage their reservations" on public.reservations;
drop policy "Owners read their guide analytics" on public.guide_events;
drop policy "Owners create their own guide events" on public.guide_events;

create policy "Owners and admins manage profiles" on public.profiles
  for all to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

create policy "Owners and admins manage properties" on public.properties
  for all to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()))
  with check (owner_id = (select auth.uid()) or (select private.is_admin()));

create policy "Owners and admins manage guide sections" on public.guide_sections
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()));

create policy "Owners and admins manage amenities" on public.property_amenities
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()));

create policy "Owners and admins manage equipment guides" on public.equipment_guides
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()));

create policy "Owners and admins manage house rules" on public.property_house_rules
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()));

create policy "Owners and admins manage FAQs" on public.property_faqs
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()));

create policy "Owners and admins manage nearby places" on public.nearby_places
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()));

create policy "Owners and admins manage reservations" on public.reservations
  for all to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()))
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()));

create policy "Owners and admins read guide analytics" on public.guide_events
  for select to authenticated
  using (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()));

create policy "Owners and admins create guide events" on public.guide_events
  for insert to authenticated
  with check (property_id in (select id from public.properties where owner_id = (select auth.uid())) or (select private.is_admin()));

drop policy "Owners upload property media" on storage.objects;
drop policy "Owners read property media" on storage.objects;
drop policy "Owners update property media" on storage.objects;
drop policy "Owners delete property media" on storage.objects;

create policy "Owners and admins upload property media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-media' and ((storage.foldername(name))[1] = (select auth.uid()::text) or (select private.is_admin())));

create policy "Owners and admins read property media" on storage.objects
  for select to authenticated
  using (bucket_id = 'property-media' and ((storage.foldername(name))[1] = (select auth.uid()::text) or (select private.is_admin())));

create policy "Owners and admins update property media" on storage.objects
  for update to authenticated
  using (bucket_id = 'property-media' and ((storage.foldername(name))[1] = (select auth.uid()::text) or (select private.is_admin())))
  with check (bucket_id = 'property-media' and ((storage.foldername(name))[1] = (select auth.uid()::text) or (select private.is_admin())));

create policy "Owners and admins delete property media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-media' and ((storage.foldername(name))[1] = (select auth.uid()::text) or (select private.is_admin())));
