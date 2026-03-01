create extension if not exists "pgcrypto";

create type public.app_role as enum ('user', 'admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  profession text,
  organization text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (course_id, position)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  content_markdown text,
  position integer not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (module_id, position)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, lesson_id)
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_type text not null,
  prompt_input jsonb not null default '{}'::jsonb,
  output_markdown text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_private boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (group_id, user_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute procedure public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, profession, organization)
  values (
    new.id,
    new.raw_user_meta_data ->> 'profession',
    new.raw_user_meta_data ->> 'organization'
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, status)
  values (new.id, 'inactive')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.ai_generations enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.events enable row level security;
alter table public.subscriptions enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create policy "profiles_insert_self"
on public.profiles
for insert
with check (auth.uid() = id or public.is_admin());

create policy "courses_public_read"
on public.courses
for select
using (is_published = true or public.is_admin());

create policy "courses_admin_write"
on public.courses
for all
using (public.is_admin())
with check (public.is_admin());

create policy "modules_public_read"
on public.modules
for select
using (
  exists (
    select 1 from public.courses
    where public.courses.id = modules.course_id
      and (public.courses.is_published = true or public.is_admin())
  )
);

create policy "modules_admin_write"
on public.modules
for all
using (public.is_admin())
with check (public.is_admin());

create policy "lessons_public_read"
on public.lessons
for select
using (
  exists (
    select 1
    from public.modules
    join public.courses on public.courses.id = public.modules.course_id
    where public.modules.id = lessons.module_id
      and (public.courses.is_published = true or public.is_admin())
  )
);

create policy "lessons_admin_write"
on public.lessons
for all
using (public.is_admin())
with check (public.is_admin());

create policy "lesson_progress_own_access"
on public.lesson_progress
for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "ai_generations_own_access"
on public.ai_generations
for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "groups_visible_to_members_or_public"
on public.groups
for select
using (
  is_private = false
  or created_by = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.group_members
    where group_members.group_id = groups.id
      and group_members.user_id = auth.uid()
  )
);

create policy "groups_creator_insert"
on public.groups
for insert
with check (created_by = auth.uid() or public.is_admin());

create policy "groups_creator_update"
on public.groups
for update
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

create policy "group_members_view_own_or_admin"
on public.group_members
for select
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.groups
    where groups.id = group_members.group_id
      and groups.is_private = false
  )
);

create policy "group_members_insert_own"
on public.group_members
for insert
with check (user_id = auth.uid() or public.is_admin());

create policy "group_members_delete_own"
on public.group_members
for delete
using (user_id = auth.uid() or public.is_admin());

create policy "posts_visible_by_group_access"
on public.posts
for select
using (
  exists (
    select 1
    from public.groups
    where groups.id = posts.group_id
      and (
        groups.is_private = false
        or groups.created_by = auth.uid()
        or public.is_admin()
        or exists (
          select 1
          from public.group_members
          where group_members.group_id = groups.id
            and group_members.user_id = auth.uid()
        )
      )
  )
);

create policy "posts_author_insert"
on public.posts
for insert
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.groups
    where groups.id = posts.group_id
      and (
        groups.is_private = false
        or groups.created_by = auth.uid()
        or exists (
          select 1
          from public.group_members
          where group_members.group_id = groups.id
            and group_members.user_id = auth.uid()
        )
      )
  )
);

create policy "posts_author_update"
on public.posts
for update
using (author_id = auth.uid() or public.is_admin())
with check (author_id = auth.uid() or public.is_admin());

create policy "comments_visible_by_post_access"
on public.comments
for select
using (
  exists (
    select 1
    from public.posts
    join public.groups on public.groups.id = public.posts.group_id
    where public.posts.id = comments.post_id
      and (
        public.groups.is_private = false
        or public.groups.created_by = auth.uid()
        or public.is_admin()
        or exists (
          select 1
          from public.group_members
          where group_members.group_id = public.groups.id
            and group_members.user_id = auth.uid()
        )
      )
  )
);

create policy "comments_author_insert"
on public.comments
for insert
with check (author_id = auth.uid() or public.is_admin());

create policy "comments_author_update"
on public.comments
for update
using (author_id = auth.uid() or public.is_admin())
with check (author_id = auth.uid() or public.is_admin());

create policy "events_public_read"
on public.events
for select
using (true);

create policy "events_admin_write"
on public.events
for all
using (public.is_admin())
with check (public.is_admin());

create policy "subscriptions_own_access"
on public.subscriptions
for select
using (auth.uid() = user_id or public.is_admin());

create policy "subscriptions_admin_write"
on public.subscriptions
for all
using (public.is_admin())
with check (public.is_admin());
