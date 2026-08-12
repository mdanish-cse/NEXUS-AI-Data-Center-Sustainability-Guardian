-- NEXUS Supabase schema (PRD.md §7).
-- Run in the Supabase SQL editor once a project exists. The app runs fine
-- without this — see web/src/lib/db/repository.ts — this is only needed to
-- move off the in-memory synthetic repository.

-- id is text, not uuid: web/src/lib/nexus/scenarios.ts's DATA_CENTER_ID is the
-- human-readable slug "dc-batam-01", and app-generated alert ids (derived from
-- finding ids) aren't UUIDs either — see supabaseRepository.ts.
create table if not exists data_centers (
  id text primary key,
  name text not null,
  location text not null,
  capacity_mw numeric not null
);

create table if not exists telemetry (
  id uuid primary key default gen_random_uuid(),
  data_center_id text not null references data_centers (id),
  timestamp timestamptz not null,
  it_load numeric not null, -- percent, 0-100
  it_power numeric not null, -- MW
  cooling_power numeric not null, -- MW
  ambient_temperature numeric not null, -- Celsius
  server_temperature numeric not null, -- Celsius
  water_usage numeric not null -- liters
);
create index if not exists telemetry_data_center_timestamp_idx
  on telemetry (data_center_id, timestamp desc);

create table if not exists alerts (
  id text primary key,
  timestamp timestamptz not null,
  type text not null,
  severity text not null,
  metric text not null,
  actual_value numeric not null,
  expected_value numeric not null,
  message text not null
);

create table if not exists simulations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  baseline_energy numeric not null, -- MWh/hr
  baseline_water numeric not null, -- L/hr
  simulated_energy numeric not null, -- MWh/hr
  simulated_water numeric not null, -- L/hr
  parameters jsonb not null,
  safety_status text not null -- 'safe' | 'unsafe'
);

-- Matches DATA_CENTER_ID in web/src/lib/nexus/scenarios.ts. Required before
-- any telemetry rows can be inserted (FK constraint above).
insert into data_centers (id, name, location, capacity_mw)
values ('dc-batam-01', 'Batam DC-1', 'Batam, Indonesia', 4)
on conflict (id) do nothing;
