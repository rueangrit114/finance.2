-- ============================================================
--  บัญชีบ้านเรา — สร้างตารางใน Supabase
--  วิธีใช้: Supabase > SQL Editor > New query > วางทั้งไฟล์นี้ > Run
--  รันซ้ำได้ ไม่ทำให้ข้อมูลเดิมหาย
-- ============================================================

create extension if not exists pgcrypto;

-- 1) รายรับ-รายจ่ายของครอบครัว
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  date        date          not null,
  type        text          not null check (type in ('income','expense')),
  amount      numeric(14,2) not null check (amount >= 0),
  category    text          not null default 'อื่นๆ',
  description text          not null default '',
  person      text          not null default '',
  created_at  timestamptz   not null default now()
);
create index if not exists transactions_date_idx on public.transactions (date);
create index if not exists transactions_person_idx on public.transactions (person);

-- 2) ร้านขายข้าว (หนึ่งแถวต่อหนึ่งวัน)
create table if not exists public.shop_days (
  id         uuid primary key default gen_random_uuid(),
  date       date          not null unique,
  sales      numeric(14,2) not null default 0,
  cost       numeric(14,2) not null default 0,
  profit     numeric(14,2) not null default 0,
  note       text          not null default '',
  -- เก็บผลการแบ่งกำไร ณ วันที่จด เช่น {"pcts":[50,15,35],"amounts":[200,60,140]}
  alloc      jsonb         not null default '{}'::jsonb,
  created_at timestamptz   not null default now(),
  updated_at timestamptz   not null default now()
);
create index if not exists shop_days_date_idx on public.shop_days (date);

-- 3) ค่าตั้งค่าของแอพ (ธีม, หมวดหมู่, ชื่อคนในบ้าน, เปอร์เซ็นต์แบ่งกำไร)
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

-- 4) เงินเข้า/ออกของ 3 กอง (เงินเก็บครอบครัว, ทุนสำรองธุรกิจ, เกด)
--    pot = 0,1,2 ตามลำดับหัวข้อในหน้าร้านข้าว   direction = in (โอนเข้า) / out (โอนออก)
create table if not exists public.pot_moves (
  id         uuid primary key default gen_random_uuid(),
  date       date          not null,
  pot        smallint      not null check (pot between 0 and 2),
  direction  text          not null check (direction in ('in','out')),
  amount     numeric(14,2) not null check (amount >= 0),
  note       text          not null default '',
  created_at timestamptz   not null default now()
);
create index if not exists pot_moves_date_idx on public.pot_moves (date);

-- 3.1) จ่ายจากกองไหน (ว่าง = เงินในมือ, 0-2 = 3 กองจากร้านข้าว, 3 = เงินเดือน/ครอบครัว)
alter table public.transactions add column if not exists pot smallint;
alter table public.transactions drop constraint if exists transactions_pot_check;
alter table public.transactions add constraint transactions_pot_check check (pot is null or pot between 0 and 3);

-- 5) สิทธิ์การเข้าถึง
--    แอพนี้ไม่มีหน้าล็อกอิน (ตามที่ตกลงกัน เพราะใช้ในครอบครัว)
--    จึงเปิดให้คีย์ anon อ่าน/เขียนได้ — อย่าแชร์ลิงก์เว็บให้คนนอกครอบครัว
alter table public.transactions enable row level security;
alter table public.shop_days    enable row level security;
alter table public.app_settings enable row level security;
alter table public.pot_moves    enable row level security;

drop policy if exists "family_all" on public.transactions;
drop policy if exists "family_all" on public.shop_days;
drop policy if exists "family_all" on public.app_settings;
drop policy if exists "family_all" on public.pot_moves;

create policy "family_all" on public.transactions for all to anon using (true) with check (true);
create policy "family_all" on public.shop_days    for all to anon using (true) with check (true);
create policy "family_all" on public.app_settings for all to anon using (true) with check (true);
create policy "family_all" on public.pot_moves    for all to anon using (true) with check (true);

grant usage on schema public to anon;
grant select, insert, update, delete on public.transactions to anon;
grant select, insert, update, delete on public.shop_days    to anon;
grant select, insert, update, delete on public.app_settings to anon;
grant select, insert, update, delete on public.pot_moves    to anon;
