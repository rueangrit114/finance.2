-- รันครั้งเดียวใน Supabase > SQL Editor (รันซ้ำได้ ข้อมูลเดิมไม่หาย)
-- เปิดใช้ "จ่ายจากกอง / จ่ายจากการ์ดกระเป๋าเงิน"
alter table public.transactions drop constraint if exists transactions_pot_check;
alter table public.transactions add column if not exists pot text;
alter table public.transactions alter column pot type text using pot::text;
