insert into public.courses (title, slug, description, is_published)
values
  (
    'AI Foundations for Professionals',
    'ai-foundations-for-professionals',
    'Core concepts for using AI confidently at work.',
    true
  )
on conflict (slug) do nothing;

with course as (
  select id from public.courses where slug = 'ai-foundations-for-professionals'
),
inserted_module as (
  insert into public.modules (course_id, title, position)
  select id, 'Module 1: Practical AI Basics', 1
  from course
  on conflict do nothing
  returning id
)
insert into public.lessons (module_id, title, content_markdown, position)
select
  coalesce(
    (select id from inserted_module limit 1),
    (
      select id
      from public.modules
      where title = 'Module 1: Practical AI Basics'
      limit 1
    )
  ),
  'Lesson 1: What AI can do for your workflow',
  '# Welcome to Onboard\n\nThis is example seeded lesson content.',
  1
where not exists (
  select 1 from public.lessons where title = 'Lesson 1: What AI can do for your workflow'
);
