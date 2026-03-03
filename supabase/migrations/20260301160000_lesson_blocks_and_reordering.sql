create type public.lesson_block_type as enum (
  'heading',
  'paragraph',
  'markdown',
  'image',
  'gif',
  'youtube',
  'embed'
);

create table if not exists public.lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  type public.lesson_block_type not null,
  content text,
  url text,
  caption text,
  position integer not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (lesson_id, position)
);

drop trigger if exists set_lesson_blocks_updated_at on public.lesson_blocks;
create trigger set_lesson_blocks_updated_at
before update on public.lesson_blocks
for each row
execute procedure public.handle_updated_at();

alter table public.lesson_blocks enable row level security;

create policy "lesson_blocks_public_read"
on public.lesson_blocks
for select
using (
  exists (
    select 1
    from public.lessons
    join public.modules on public.modules.id = public.lessons.module_id
    join public.courses on public.courses.id = public.modules.course_id
    where public.lessons.id = lesson_blocks.lesson_id
      and public.lessons.is_published = true
      and (public.courses.is_published = true or public.is_admin())
  )
);

create policy "lesson_blocks_admin_write"
on public.lesson_blocks
for all
using (public.is_admin())
with check (public.is_admin());
