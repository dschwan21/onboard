alter table public.lessons
add column if not exists course_id uuid references public.courses(id) on delete cascade;

update public.lessons
set course_id = public.modules.course_id
from public.modules
where public.lessons.module_id = public.modules.id
  and public.lessons.course_id is null;

alter table public.lessons
alter column course_id set not null;

alter table public.lessons
alter column module_id drop not null;

create table if not exists public.lesson_sections (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  position integer not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (lesson_id, position)
);

drop trigger if exists set_lesson_sections_updated_at on public.lesson_sections;
create trigger set_lesson_sections_updated_at
before update on public.lesson_sections
for each row
execute procedure public.handle_updated_at();

alter table public.lesson_sections enable row level security;

create policy "lesson_sections_public_read"
on public.lesson_sections
for select
using (
  exists (
    select 1
    from public.lessons
    join public.courses on public.courses.id = public.lessons.course_id
    where public.lessons.id = lesson_sections.lesson_id
      and public.lessons.is_published = true
      and (public.courses.is_published = true or public.is_admin())
  )
);

create policy "lesson_sections_admin_write"
on public.lesson_sections
for all
using (public.is_admin())
with check (public.is_admin());

insert into public.lesson_sections (lesson_id, title, position)
select public.lessons.id, 'Main section', 1
from public.lessons
where not exists (
  select 1
  from public.lesson_sections
  where public.lesson_sections.lesson_id = public.lessons.id
);

alter table public.lesson_blocks
add column if not exists lesson_section_id uuid references public.lesson_sections(id) on delete cascade;

update public.lesson_blocks
set lesson_section_id = public.lesson_sections.id
from public.lesson_sections
where public.lesson_blocks.lesson_id = public.lesson_sections.lesson_id
  and public.lesson_sections.position = 1
  and public.lesson_blocks.lesson_section_id is null;

alter table public.lesson_blocks
alter column lesson_section_id set not null;
