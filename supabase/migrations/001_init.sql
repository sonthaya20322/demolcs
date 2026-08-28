-- DemoLCS MVP schema + RPCs
-- Apply in Supabase SQL Editor (or supabase db push)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.demo_sessions(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.demo_sessions(id) on delete cascade,
  sku text not null,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  unit text not null default 'ชิ้น',
  qty_on_hand numeric(12,2) not null default 0 check (qty_on_hand >= 0),
  reorder_level numeric(12,2) not null default 0,
  cost_price numeric(12,2) not null default 0,
  sell_price numeric(12,2) not null default 0,
  unique (session_id, sku)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.demo_sessions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('receive', 'issue')),
  qty numeric(12,2) not null check (qty > 0),
  ref_type text,
  ref_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.issue_orders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.demo_sessions(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'picking', 'completed', 'cancelled')),
  ref_note text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.issue_order_items (
  id uuid primary key default gen_random_uuid(),
  issue_order_id uuid not null references public.issue_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  qty_requested numeric(12,2) not null check (qty_requested > 0),
  qty_issued numeric(12,2) not null default 0
);

create index if not exists idx_categories_session on public.categories(session_id);
create index if not exists idx_products_session on public.products(session_id);
create index if not exists idx_movements_session on public.stock_movements(session_id, created_at desc);
create index if not exists idx_orders_session on public.issue_orders(session_id, created_at desc);

-- Demo-only RLS: open for anon (not production multi-tenant)
alter table public.demo_sessions enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.issue_orders enable row level security;
alter table public.issue_order_items enable row level security;

drop policy if exists demo_sessions_all on public.demo_sessions;
create policy demo_sessions_all on public.demo_sessions for all using (true) with check (true);

drop policy if exists categories_all on public.categories;
create policy categories_all on public.categories for all using (true) with check (true);

drop policy if exists products_all on public.products;
create policy products_all on public.products for all using (true) with check (true);

drop policy if exists movements_all on public.stock_movements;
create policy movements_all on public.stock_movements for all using (true) with check (true);

drop policy if exists orders_all on public.issue_orders;
create policy orders_all on public.issue_orders for all using (true) with check (true);

drop policy if exists order_items_all on public.issue_order_items;
create policy order_items_all on public.issue_order_items for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Seed helper
-- ---------------------------------------------------------------------------

create or replace function public.seed_demo_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c_hose uuid;
  c_bolt uuid;
  c_tool uuid;
  c_fluid uuid;
  c_filter uuid;
  c_elec uuid;
  c_bike uuid;
  order_id uuid;
begin
  insert into public.categories (session_id, name, sort_order) values
    (p_session_id, 'ท่อยาง / ยาง', 1),
    (p_session_id, 'น็อต / สกรู', 2),
    (p_session_id, 'เครื่องมือ', 3),
    (p_session_id, 'น้ำมัน / ของเหลว', 4),
    (p_session_id, 'ไส้กรอง', 5),
    (p_session_id, 'ไฟฟ้า / แบตเตอรี่', 6),
    (p_session_id, 'อะไหล่มอเตอร์ไซค์', 7);

  select id into c_hose from public.categories where session_id = p_session_id and name = 'ท่อยาง / ยาง';
  select id into c_bolt from public.categories where session_id = p_session_id and name = 'น็อต / สกรู';
  select id into c_tool from public.categories where session_id = p_session_id and name = 'เครื่องมือ';
  select id into c_fluid from public.categories where session_id = p_session_id and name = 'น้ำมัน / ของเหลว';
  select id into c_filter from public.categories where session_id = p_session_id and name = 'ไส้กรอง';
  select id into c_elec from public.categories where session_id = p_session_id and name = 'ไฟฟ้า / แบตเตอรี่';
  select id into c_bike from public.categories where session_id = p_session_id and name = 'อะไหล่มอเตอร์ไซค์';
  insert into public.products (session_id, sku, name, category_id, unit, qty_on_hand, reorder_level, cost_price, sell_price) values
    (p_session_id, 'HS-010', 'ท่อยางหม้อน้ำ 16 มม.', c_hose, 'ม้วน', 12, 5, 85, 140),
    (p_session_id, 'HS-011', 'ท่อยางหม้อน้ำ 20 มม.', c_hose, 'ม้วน', 8, 5, 95, 155),
    (p_session_id, 'HS-020', 'สายยางเบรก (เมตร)', c_hose, 'ม้วน', 4, 3, 120, 210),
    (p_session_id, 'HS-030', 'ซีลยางฝาครอบวาล์ว', c_hose, 'ชิ้น', 25, 10, 35, 65),
    (p_session_id, 'HS-040', 'ปะเก็นยางออยล์แพน', c_hose, 'ชิ้น', 18, 8, 45, 80),
    (p_session_id, 'BT-M6', 'น็อตหัวเหลี่ยม M6', c_bolt, 'ชิ้น', 200, 50, 1.5, 3),
    (p_session_id, 'BT-M8', 'น็อตหัวเหลี่ยม M8', c_bolt, 'ชิ้น', 180, 50, 2, 4),
    (p_session_id, 'BT-M10', 'น็อตหัวเหลี่ยม M10', c_bolt, 'ชิ้น', 40, 40, 3, 6),
    (p_session_id, 'BT-W8', 'แหวนอัด M8', c_bolt, 'ชิ้น', 150, 40, 0.8, 2),
    (p_session_id, 'BT-SC6', 'สกรูหัวจม M6x20', c_bolt, 'ชิ้น', 90, 30, 1.2, 2.5),
    (p_session_id, 'TL-001', 'ประแจรวม 10 มม.', c_tool, 'ชิ้น', 15, 5, 45, 89),
    (p_session_id, 'TL-002', 'ประแจรวม 12 มม.', c_tool, 'ชิ้น', 14, 5, 48, 95),
    (p_session_id, 'TL-010', 'ชุดลูกบล็อก 1/2"', c_tool, 'ชุด', 6, 3, 650, 990),
    (p_session_id, 'TL-020', 'คีมล็อกปากตรง', c_tool, 'ชิ้น', 10, 4, 120, 199),
    (p_session_id, 'TL-030', 'ไขควงแฉก #2', c_tool, 'ชิ้น', 22, 8, 35, 69),
    (p_session_id, 'FL-001', 'น้ำมันเครื่อง 5W-30 (ลิตร)', c_fluid, 'ลิตร', 36, 12, 95, 160),
    (p_session_id, 'FL-002', 'น้ำมันเกียร์ ATF', c_fluid, 'ลิตร', 20, 8, 110, 185),
    (p_session_id, 'FL-010', 'น้ำยาหล่อเย็นเขียว', c_fluid, 'ลิตร', 15, 6, 70, 120),
    (p_session_id, 'FL-020', 'น้ำมันเบรก DOT4', c_fluid, 'ขวด', 9, 5, 85, 145),
    (p_session_id, 'FL-030', 'จารบีแบริ่ง', c_fluid, 'กระปุก', 11, 4, 60, 110),
    (p_session_id, 'FT-001', 'ไส้กรองอากาศเก๋ง', c_filter, 'ชิ้น', 16, 6, 120, 220),
    (p_session_id, 'FT-002', 'ไส้กรองอากาศกระบะ', c_filter, 'ชิ้น', 10, 5, 150, 260),
    (p_session_id, 'FT-010', 'ไส้กรองน้ำมันเครื่อง', c_filter, 'ชิ้น', 28, 10, 55, 99),
    (p_session_id, 'FT-020', 'ไส้กรองน้ำมันเชื้อเพลิง', c_filter, 'ชิ้น', 12, 5, 90, 160),
    (p_session_id, 'FT-030', 'ไส้กรองแอร์ Cabin', c_filter, 'ชิ้น', 7, 4, 130, 240),
    (p_session_id, 'EL-001', 'แบตเตอรี่ 12V 60Ah', c_elec, 'ลูก', 5, 3, 1800, 2650),
    (p_session_id, 'EL-002', 'แบตเตอรี่ 12V 80Ah', c_elec, 'ลูก', 3, 2, 2400, 3450),
    (p_session_id, 'EL-010', 'หัวเทียน Iridium', c_elec, 'ชิ้น', 24, 8, 180, 320),
    (p_session_id, 'EL-020', 'ฟิวส์ใบมีด 15A', c_elec, 'ชิ้น', 80, 20, 5, 12),
    (p_session_id, 'EL-030', 'สายพานไดชาร์จ', c_elec, 'เส้น', 8, 4, 220, 380),
    (p_session_id, 'BK-001', 'โซ่ขับ 428H', c_bike, 'เส้น', 9, 4, 280, 450),
    (p_session_id, 'BK-002', 'สเตอร์หน้า 14T', c_bike, 'ชิ้น', 12, 5, 90, 160),
    (p_session_id, 'BK-003', 'สเตอร์หลัง 42T', c_bike, 'ชิ้น', 10, 4, 180, 310),
    (p_session_id, 'BK-010', 'ผ้าเบรกหน้ามอไซค์', c_bike, 'คู่', 14, 6, 95, 175),
    (p_session_id, 'BK-011', 'ผ้าเบรกหลังมอไซค์', c_bike, 'คู่', 13, 6, 85, 155),
    (p_session_id, 'BK-020', 'ไส้กรองอากาศมอไซค์', c_bike, 'ชิ้น', 18, 8, 70, 130),
    (p_session_id, 'BK-030', 'น้ำมันเครื่อง 2T', c_bike, 'ลิตร', 22, 8, 80, 140),
    (p_session_id, 'BK-040', 'ยางใน 275-17', c_bike, 'เส้น', 6, 4, 110, 190),
    (p_session_id, 'BK-050', 'สายคันเร่งมอไซค์', c_bike, 'เส้น', 8, 3, 65, 120),
    (p_session_id, 'BK-060', 'หลอดไฟหน้า LED H4', c_bike, 'ชิ้น', 11, 5, 150, 280),
    (p_session_id, 'HS-050', 'คลิปยึดท่อยาง 12–16', c_hose, 'ชิ้น', 2, 10, 8, 18),
    (p_session_id, 'BT-M12', 'น็อตหัวเหลี่ยม M12', c_bolt, 'ชิ้น', 3, 20, 4, 8),
    (p_session_id, 'FL-040', 'น้ำยาล้างคาร์บู', c_fluid, 'กระป๋อง', 2, 5, 55, 95),
    (p_session_id, 'EL-040', 'รีเลย์ไฟเลี้ยว', c_elec, 'ชิ้น', 1, 3, 95, 170),
    (p_session_id, 'TL-040', 'ประแจถอดไส้กรอง', c_tool, 'ชิ้น', 4, 3, 160, 280);

  insert into public.issue_orders (session_id, status, ref_note)
  values (p_session_id, 'pending', 'อ้างอิงงาน: เปลี่ยนถ่ายน้ำมันเก๋ง')
  returning id into order_id;

  insert into public.issue_order_items (issue_order_id, product_id, qty_requested)
  select order_id, p.id, q.qty
  from (values
    ('FT-010', 2),
    ('FL-001', 4),
    ('BT-M8', 6)
  ) as q(sku, qty)
  join public.products p on p.session_id = p_session_id and p.sku = q.sku;

  insert into public.issue_orders (session_id, status, ref_note)
  values (p_session_id, 'picking', 'ทะเบียน กข-1234 (มอไซค์)')
  returning id into order_id;

  insert into public.issue_order_items (issue_order_id, product_id, qty_requested)
  select order_id, p.id, q.qty
  from (values
    ('BK-010', 1),
    ('BK-001', 1)
  ) as q(sku, qty)
  join public.products p on p.session_id = p_session_id and p.sku = q.sku;
  -- small receive history today
  insert into public.stock_movements (session_id, product_id, type, qty, ref_type, note)
  select p_session_id, p.id, 'receive', 10, 'seed', 'รับเข้าตั้งต้น demo'
  from public.products p
  where p.session_id = p_session_id and p.sku in ('FL-001', 'BT-M6', 'FT-010');
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.touch_demo_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.demo_sessions
  set last_active_at = now(),
      expires_at = now() + interval '24 hours'
  where id = p_session_id
    and expires_at > now();
end;
$$;

create or replace function public.create_demo_session()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
begin
  -- cleanup expired sessions (cascade deletes business rows)
  delete from public.demo_sessions where expires_at <= now();

  insert into public.demo_sessions default values
  returning id into sid;

  perform public.seed_demo_session(sid);
  return sid;
end;
$$;

create or replace function public.reset_demo_session(p_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
begin
  delete from public.demo_sessions where id = p_session_id;

  insert into public.demo_sessions default values
  returning id into sid;

  perform public.seed_demo_session(sid);
  return sid;
end;
$$;

create or replace function public.receive_stock(p_session_id uuid, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  pid uuid;
  q numeric;
begin
  if not exists (
    select 1 from public.demo_sessions
    where id = p_session_id and expires_at > now()
  ) then
    raise exception 'SESSION_EXPIRED';
  end if;

  perform public.touch_demo_session(p_session_id);

  for item in select * from jsonb_array_elements(p_items)
  loop
    pid := (item->>'product_id')::uuid;
    q := (item->>'qty')::numeric;
    if q is null or q <= 0 then
      raise exception 'INVALID_QTY';
    end if;

    update public.products
    set qty_on_hand = qty_on_hand + q
    where id = pid and session_id = p_session_id;

    if not found then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;

    insert into public.stock_movements (session_id, product_id, type, qty, ref_type, note)
    values (p_session_id, pid, 'receive', q, 'receive', coalesce(item->>'note', 'รับเข้าสินค้า'));
  end loop;
end;
$$;

create or replace function public.complete_issue_order(p_order_id uuid, p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if not exists (
    select 1 from public.demo_sessions
    where id = p_session_id and expires_at > now()
  ) then
    raise exception 'SESSION_EXPIRED';
  end if;

  if not exists (
    select 1 from public.issue_orders
    where id = p_order_id and session_id = p_session_id
      and status in ('pending', 'picking')
  ) then
    raise exception 'ORDER_NOT_COMPLETABLE';
  end if;

  for r in
    select i.product_id, i.qty_requested, p.qty_on_hand, p.sku
    from public.issue_order_items i
    join public.products p on p.id = i.product_id
    where i.issue_order_id = p_order_id
  loop
    if r.qty_on_hand < r.qty_requested then
      raise exception 'INSUFFICIENT_STOCK:%', r.sku;
    end if;
  end loop;

  for r in
    select i.id as item_id, i.product_id, i.qty_requested
    from public.issue_order_items i
    where i.issue_order_id = p_order_id
  loop
    update public.products
    set qty_on_hand = qty_on_hand - r.qty_requested
    where id = r.product_id and session_id = p_session_id
      and qty_on_hand >= r.qty_requested;

    if not found then
      raise exception 'INSUFFICIENT_STOCK';
    end if;

    update public.issue_order_items
    set qty_issued = r.qty_requested
    where id = r.item_id;

    insert into public.stock_movements (session_id, product_id, type, qty, ref_type, ref_id, note)
    values (p_session_id, r.product_id, 'issue', r.qty_requested, 'issue_order', p_order_id, 'เบิกสำเร็จ');
  end loop;

  update public.issue_orders
  set status = 'completed', completed_at = now()
  where id = p_order_id and session_id = p_session_id;

  perform public.touch_demo_session(p_session_id);
end;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant execute on function public.create_demo_session() to anon, authenticated;
grant execute on function public.reset_demo_session(uuid) to anon, authenticated;
grant execute on function public.touch_demo_session(uuid) to anon, authenticated;
grant execute on function public.receive_stock(uuid, jsonb) to anon, authenticated;
grant execute on function public.complete_issue_order(uuid, uuid) to anon, authenticated;
grant execute on function public.seed_demo_session(uuid) to anon, authenticated;
