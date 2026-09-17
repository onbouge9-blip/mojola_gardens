-- ============================================================
-- MOJOLA GARDENS — schéma Supabase
-- À exécuter UNE FOIS dans : dashboard Supabase → SQL Editor → New query
-- Copiez-collez tout ce fichier, puis cliquez "Run".
-- ============================================================

-- ---------- TABLES ----------

create table if not exists stock (
  name text primary key,
  available boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz not null default now(),
  status text not null default 'nouveau',
  nom text,
  tel text,
  mode text,
  date text,
  heure text,
  adresse text,
  notes text,
  total integer default 0,
  lines jsonb
);

create table if not exists reservations (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz not null default now(),
  status text not null default 'nouveau',
  nom text,
  tel text,
  email text,
  personnes text,
  date text,
  heure text,
  occasion text,
  zone text,
  message text
);

create table if not exists messages (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz not null default now(),
  status text not null default 'nouveau',
  nom text,
  tel text,
  sujet text,
  message text
);

-- ---------- SÉCURITÉ (Row Level Security) ----------
-- Principe : tout le monde (vos visiteurs) peut LIRE le stock et ENVOYER
-- une commande / réservation / message. Seul l'admin connecté (via
-- Authentication) peut LIRE les commandes/réservations/messages et
-- MODIFIER le stock ou le statut d'une commande.

alter table stock enable row level security;
alter table orders enable row level security;
alter table reservations enable row level security;
alter table messages enable row level security;

-- STOCK : lecture publique, écriture admin uniquement
create policy "stock_select_public" on stock
  for select using (true);
create policy "stock_write_admin" on stock
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ORDERS : envoi public, lecture/modif admin uniquement
create policy "orders_insert_public" on orders
  for insert with check (true);
create policy "orders_select_admin" on orders
  for select using (auth.role() = 'authenticated');
create policy "orders_update_admin" on orders
  for update using (auth.role() = 'authenticated');

-- RESERVATIONS : envoi public, lecture/modif admin uniquement
create policy "reservations_insert_public" on reservations
  for insert with check (true);
create policy "reservations_select_admin" on reservations
  for select using (auth.role() = 'authenticated');
create policy "reservations_update_admin" on reservations
  for update using (auth.role() = 'authenticated');

-- MESSAGES : envoi public, lecture/modif admin uniquement
create policy "messages_insert_public" on messages
  for insert with check (true);
create policy "messages_select_admin" on messages
  for select using (auth.role() = 'authenticated');
create policy "messages_update_admin" on messages
  for update using (auth.role() = 'authenticated');
