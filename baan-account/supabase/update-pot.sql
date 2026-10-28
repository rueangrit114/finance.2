-- รันครั้งเดียวใน Supabase > SQL Editor เพื่อเปิดใช้ "จ่ายจากกอง"
-- (ข้อมูลเดิมไม่หาย รันซ้ำได้)
alter table public.transactions add column if not exists pot smallint;
alter table public.transactions drop constraint if exists transactions_pot_check;
alter table public.transactions add constraint transactions_pot_check check (pot is null or pot between 0 and 3);
