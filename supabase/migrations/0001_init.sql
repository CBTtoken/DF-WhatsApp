-- Sprint 1 schema: leads, media_attachments, founding_nomad_counter, handoff_flags
-- See CLAUDE.md section 6, Data Model.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  whatsapp_number text not null,
  current_step text,
  menu_selection text,
  fork_selection text,
  tier_selection text,
  how_heard text,
  full_name text,
  business_name text,
  email text,
  province text,
  industry text,
  business_address text,
  business_description text,
  tagline text,
  products_services text,
  facebook_link text,
  instagram_link text,
  existing_website text,
  df_username text,
  df_password_encrypted text,
  registration_confirmed boolean not null default false,
  additional_notes text,
  payment_method text,
  payment_status text not null default 'not_started',
  paystack_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_whatsapp_number_idx on leads (whatsapp_number);

create table if not exists media_attachments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  type text not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists media_attachments_lead_id_idx on media_attachments (lead_id);

create table if not exists founding_nomad_counter (
  id int primary key default 1,
  slots_filled int not null default 0,
  slots_total int not null default 100,
  constraint founding_nomad_counter_single_row check (id = 1)
);

insert into founding_nomad_counter (id, slots_filled, slots_total)
values (1, 0, 100)
on conflict (id) do nothing;

create table if not exists handoff_flags (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);

create index if not exists handoff_flags_lead_id_idx on handoff_flags (lead_id);
