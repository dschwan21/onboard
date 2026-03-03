create type public.lesson_state as enum ('not_started', 'in_progress', 'completed');

alter table public.modules
add column if not exists is_pro boolean not null default false;

alter table public.lessons
add column if not exists task_prompt text,
add column if not exists video_url text,
add column if not exists is_published boolean not null default false;

alter table public.lesson_progress
add column if not exists state public.lesson_state not null default 'not_started',
add column if not exists started_at timestamptz,
add column if not exists last_viewed_at timestamptz,
add column if not exists updated_at timestamptz not null default timezone('utc'::text, now());

update public.lesson_progress
set
  state = case
    when completed_at is not null then 'completed'::public.lesson_state
    else 'in_progress'::public.lesson_state
  end,
  started_at = coalesce(started_at, created_at),
  last_viewed_at = coalesce(last_viewed_at, created_at),
  updated_at = timezone('utc'::text, now());

create table if not exists public.lesson_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  submission_text text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, lesson_id)
);

drop trigger if exists set_lesson_progress_updated_at on public.lesson_progress;
create trigger set_lesson_progress_updated_at
before update on public.lesson_progress
for each row
execute procedure public.handle_updated_at();

drop trigger if exists set_lesson_submissions_updated_at on public.lesson_submissions;
create trigger set_lesson_submissions_updated_at
before update on public.lesson_submissions
for each row
execute procedure public.handle_updated_at();

alter table public.lesson_submissions enable row level security;

drop policy if exists "lessons_public_read" on public.lessons;
create policy "lessons_public_read"
on public.lessons
for select
using (
  exists (
    select 1
    from public.modules
    join public.courses on public.courses.id = public.modules.course_id
    where public.modules.id = lessons.module_id
      and lessons.is_published = true
      and (public.courses.is_published = true or public.is_admin())
  )
);

create policy "lesson_submissions_own_access"
on public.lesson_submissions
for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());
