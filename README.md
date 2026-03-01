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
- Authenticated app shell with sidebar navigation
- Placeholder pages for Dashboard, Course, AI Tools, Community, Live Sessions, Library, Billing, and Settings
- Initial Supabase schema and RLS policies
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
3. Apply the SQL migration in [supabase/migrations/20260227130000_initial_schema.sql](/Users/derek/Desktop/onboard-llc/onboard/supabase/migrations/20260227130000_initial_schema.sql).
4. Set the site URL and redirect URL to include `http://localhost:3000/auth/callback` for local development.
5. Run the seed example if you want starter course content.

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

1. Add actual CRUD flows for courses, groups, posts, and events.
2. Add Stripe customer portal support for self-service billing management.
3. Add richer AI tool definitions and UI forms that call `/api/ai`.
