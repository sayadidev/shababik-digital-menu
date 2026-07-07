-- ─── Tier & Ordering Toggle for site_settings ────────────────────────────────
-- Adds global tier plan and ordering enabled flag to the single-row site_settings.

alter table site_settings
  add column if not exists tier text not null default 'basic' check (tier in ('basic', 'pro')),
  add column if not exists ordering_enabled boolean not null default false;

-- Update the existing row (id=1) to use defaults if they were just added
update site_settings
  set tier = 'basic', ordering_enabled = false
  where id = 1 and tier is null;
