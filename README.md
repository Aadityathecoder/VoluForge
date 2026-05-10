# VoluForge 

Turn community needs into student-led action.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Apply `database/schema.sql` in the Supabase SQL editor (requires Supabase `auth` schema).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase client helpers in `lib/supabase/`
- AI kit generation in `lib/ai/generateProjectKit.ts` (Anthropic; OpenAI stub)

## Project layout

- `app/` — routes (dashboard, explore, auth, project kit flow)
- `components/` — UI (navbar, dashboard, project kit display)
- `lib/` — Supabase, AI, utilities, demo mocks
- `types/` — shared TypeScript models
- `database/schema.sql` — Postgres / Supabase DDL + RLS

## Environment

See `.env.example` for `NEXT_PUBLIC_SUPABASE_*`, optional `ANTHROPIC_API_KEY`, and `NEXT_PUBLIC_APP_URL`.

## Note

Login/signup and several dashboard flows are still demo/MVP placeholders; wire them to Supabase Auth and your API routes when you are ready.
