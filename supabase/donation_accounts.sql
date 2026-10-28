
-- Donation accounts table for multiple accounts (different purposes)
create table if not exists public.donation_accounts (
  id uuid primary key default gen_random_uuid(),
  purpose text not null,
  account_name text not null,
  account_number text not null,
  bank text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to update updated_at
create or replace function public.set_updated_at_donation_accounts()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_donation_accounts on public.donation_accounts;
create trigger set_updated_at_donation_accounts
  before update on public.donation_accounts
  for each row
  execute function public.set_updated_at_donation_accounts();

-- Enable RLS
alter table public.donation_accounts enable row level security;

-- Public can read active accounts
drop policy if exists "donation_accounts_public_read" on public.donation_accounts;
create policy "donation_accounts_public_read"
  on public.donation_accounts
  for select
  using (is_active = true);

-- Admins can do everything (using is_admin_email if available)
drop policy if exists "donation_accounts_admin_all" on public.donation_accounts;
create policy "donation_accounts_admin_all"
  on public.donation_accounts
  for all
  using (public.is_admin_email())
  with check (public.is_admin_email());

-- Migrate existing single account from site_settings if present
insert into public.donation_accounts (purpose, account_name, account_number, bank, is_active, sort_order)
select 
  'General Offering',
  coalesce((select value from public.site_settings where key = 'account_name'), ''),
  coalesce((select value from public.site_settings where key = 'account_number'), ''),
  coalesce((select value from public.site_settings where key = 'bank'), ''),
  true,
  0
where 
  (coalesce((select value from public.site_settings where key = 'account_number'), '') <> '' 
   or coalesce((select value from public.site_settings where key = 'account_name'), '') <> ''
   or coalesce((select value from public.site_settings where key = 'bank'), '') <> '')
  and not exists (select 1 from public.donation_accounts);
