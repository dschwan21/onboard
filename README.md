# Onboard

Onboard is a production-oriented Next.js SaaS foundation for helping non-technical professionals become fluent in AI through courses, AI tools, community learning, live events, and subscriptions.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Supabase Auth + Postgres + Row Level Security
- Stripe subscriptions
- Server-side LLM integration behind `/api/ai`

## What is implemented

- Email/password auth
- Google OAuth callback flow via Supabase
- Email verification handoff page for confirmed email signup flows
- Authenticated app shell with sidebar navigation
- Real course delivery flow:
  - course catalog with per-user progress
  - course overview with lesson progress and section navigation
  - lesson pages with section-based navigation, markdown rendering, optional video embeds, task prompts, submissions, and completion tracking
- Minimal admin CMS for courses and lessons:
  - create courses
  - edit course metadata and publishing state
  - create lessons without manual order inputs
  - drag-and-drop lesson ordering across the course
  - create and reorder lesson sections
  - block-based lesson builder inside each section with headings, paragraphs, markdown, images, GIFs, YouTube, and generic embeds
  - drag-and-drop lesson block ordering inside each section
  - legacy lesson markdown/video/task fields still supported as fallback
- Initial Supabase schema and RLS policies, plus course-delivery extensions for lesson states, lesson submissions, lesson blocks, and lesson sections
- Stripe Checkout session route and webhook handler
- Middleware protection for authenticated and Pro-only routes
- Unified AI generation API route with persistence to `ai_generations`
- Seed examples in SQL and TypeScript

## Project structure

```text
src/
  app/
    (marketing)/
    (auth)/
    (app)/
    api/
    auth/callback/
  components/
  lib/
  types/
supabase/
  migrations/
  seed/
scripts/
```

## Environment variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | Base app URL, for example `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key for browser and SSR auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key for admin operations and webhooks |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Yes | Monthly subscription price ID |
| `OPENAI_API_KEY` | Yes | OpenAI API key used by `/api/ai` |

## Supabase setup

1. Create a Supabase project.
2. Enable Email auth and Google auth in the Supabase dashboard.
3. Apply the SQL migrations in order:
   - [supabase/migrations/20260227130000_initial_schema.sql](/Users/derek/Desktop/onboard-llc/onboard/supabase/migrations/20260227130000_initial_schema.sql)
   - [supabase/migrations/20260301133000_course_delivery_and_admin.sql](/Users/derek/Desktop/onboard-llc/onboard/supabase/migrations/20260301133000_course_delivery_and_admin.sql)
   - [supabase/migrations/20260301143000_fix_is_admin_rls_recursion.sql](/Users/derek/Desktop/onboard-llc/onboard/supabase/migrations/20260301143000_fix_is_admin_rls_recursion.sql)
   - [supabase/migrations/20260301160000_lesson_blocks_and_reordering.sql](/Users/derek/Desktop/onboard-llc/onboard/supabase/migrations/20260301160000_lesson_blocks_and_reordering.sql)
   - [supabase/migrations/20260301190000_course_lesson_section_block.sql](/Users/derek/Desktop/onboard-llc/onboard/supabase/migrations/20260301190000_course_lesson_section_block.sql)
4. Set the site URL and redirect URL to include `http://localhost:3000/auth/callback` for local development.
5. Run the seed example if you want starter course content.

## Course features

- `/course`
  - lists published courses
  - shows progress percentage for the signed-in user
  - includes a resume button for the next incomplete lesson
- `/course/[courseId]`
  - shows ordered lessons and section counts
  - shows completed lesson counts
- `/course/[courseId]/[lessonId]`
  - renders ordered lesson sections and their content blocks
  - includes a lesson sidebar for moving between lessons and jumping to sections
  - supports headings, paragraphs, markdown, images, GIFs, YouTube, and generic embeds
  - supports optional task prompt/deliverable
  - saves lesson submissions and completion state
  - shows next lesson navigation

## Admin features

- `/admin/courses`
  - lists all courses
  - creates new courses
- `/admin/courses/[courseId]`
  - edits title, description, and published state
  - creates lessons with automatic ordering
  - drag-and-drop reorders lessons
- `/admin/lessons/[lessonId]`
  - edits lesson metadata and fallback fields
  - creates lesson sections
  - drag-and-drop reorders sections
  - creates lesson content blocks inside sections
  - edits and deletes lesson content blocks
  - drag-and-drop reorders lesson content blocks within a section

Admin routes are protected server-side and only accessible to users whose profile role is `admin`.

## Stripe setup

1. Create a recurring monthly product and copy its price ID into `STRIPE_PRICE_ID`.
2. Configure a webhook endpoint pointing to `/api/stripe/webhook`.
3. Subscribe the webhook to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Local development

```bash
npm install
npm run dev
```

Run type checking:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

Coverage:

```bash
npm run test:coverage
```

## Seed examples

SQL seed:

- [supabase/seed/seed.sql](/Users/derek/Desktop/onboard-llc/onboard/supabase/seed/seed.sql)

TypeScript seed script:

```bash
npm run seed
```

Source:

- [scripts/seed.ts](/Users/derek/Desktop/onboard-llc/onboard/scripts/seed.ts)

## AI route contract

`POST /api/ai`

Example request body:

```json
{
  "toolType": "meeting-brief",
  "input": {
    "audience": "operations team",
    "goal": "summarize a weekly update",
    "notes": "Revenue up 12%, hiring paused, pilot launch next month."
  }
}
```

Example response shape:

```json
{
  "generation": {
    "id": "uuid",
    "user_id": "uuid",
    "tool_type": "meeting-brief",
    "prompt_input": {
      "audience": "operations team"
    },
    "output_markdown": "# Weekly Brief",
    "created_at": "2026-02-27T00:00:00.000Z"
  }
}
```

## Deployment notes

- Middleware enforces auth for app routes and subscription status for Pro-only routes.
- Stripe webhooks are the source of truth for subscription state in Supabase.
- Public course content is readable through RLS when `is_published = true`.
- User-owned data such as profiles, lesson progress, AI generations, and subscriptions is restricted by user ID.

## Recommended next build steps

1. Add destructive admin actions such as archiving or deleting courses, lessons, sections, and blocks.
2. Add richer lesson types such as quizzes, checklists, and graded review.
3. Add Stripe customer portal support for self-service billing management.
