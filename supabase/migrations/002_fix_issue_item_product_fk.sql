-- DemoLCS: fix session delete / reset failing on FK
-- Symptom: create_demo_session / reset_demo_session hit
--   issue_order_items_product_id_fkey (RESTRICT) when deleting products via session cascade
--
-- How to apply (you run this):
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Paste this entire file → Run
-- 3. Optional check (should show confdeltype = 'c' for CASCADE):
--      select conname, confdeltype
--      from pg_constraint
--      where conname = 'issue_order_items_product_id_fkey';
-- 4. On demolcs.vercel.app: Settings → Reset (cloud) must succeed;
--    phone/fresh visit should boot cloud without FK bootError

alter table public.issue_order_items
  drop constraint if exists issue_order_items_product_id_fkey;

alter table public.issue_order_items
  add constraint issue_order_items_product_id_fkey
  foreign key (product_id) references public.products (id) on delete cascade;
