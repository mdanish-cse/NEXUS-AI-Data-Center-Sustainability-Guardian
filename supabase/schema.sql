-- NEXUS Supabase schema (PRD.md §7).
-- Run in the Supabase SQL editor once a project exists. The app runs fine
-- without this — see web/src/lib/db/repository.ts — this is only needed to
-- move off the in-memory synthetic repository.

create table if not exists data_centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  capacity_mw numeric not null
);

create table if not exists telemetry (
  id uuid primary key default gen_random_uuid(),
  data_center_id uuid not null references data_centers (id),
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
  id uuid primary key default gen_random_uuid(),
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
