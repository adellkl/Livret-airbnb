alter table public.profiles
  add column organization_name text,
  add column activity_type text,
  add column accepted_terms_at timestamptz;

create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    organization_name,
    activity_type,
    accepted_terms_at
  )
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'activity_type'), ''),
    case when new.raw_user_meta_data ->> 'accepted_terms' = 'true' then timezone('utc', now()) end
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'owner')
  on conflict (user_id) do nothing;

  return new;
end;
$$;
