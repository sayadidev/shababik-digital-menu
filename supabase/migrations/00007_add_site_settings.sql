-- ─── Site Settings ────────────────────────────────────────────────────────────
-- Single-row table with hero background image and logo configuration.
-- The CHECK(id = 1) constraint ensures only one row ever exists.

create table if not exists site_settings (
  id bigint primary key default 1,
  hero_image_url text default '',
  hero_logo_url text default '',
  header_logo_url text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

-- Insert the default single row
insert into site_settings (id, hero_image_url, hero_logo_url, header_logo_url)
values (1, '', '', '')
on conflict (id) do nothing;

-- Auto-update updated_at on row modification
create or replace function update_site_settings_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_site_settings_timestamp
  before update on site_settings
  for each row
  execute function update_site_settings_timestamp();

-- Enable RLS
alter table site_settings enable row level security;

-- RLS: public can select (for the public menu), only authenticated can upsert
create policy "Public can read site_settings"
  on site_settings for select
  using (true);

create policy "Authenticated can upsert site_settings"
  on site_settings for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can update site_settings"
  on site_settings for update
  using (auth.role() = 'authenticated');

-- Grant access
grant select on site_settings to anon, authenticated;
grant insert, update on site_settings to authenticated;
