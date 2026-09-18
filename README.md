# VoluForge

**Turn your skills into measurable impact.**

VoluForge is a responsive web platform being built to connect high-school students with nonprofit organizations. Students will be able to find skills-aligned service opportunities, apply, document completed work, and receive a verified service record. Nonprofits will be able to recruit students for real needs and verify the time and work they complete.

> **Development status:** VoluForge is an active prototype. The repository currently contains early community-need, AI project-kit, authentication, and dashboard experiments. The opportunity, application, time-tracking, verification, and export workflow described in the MVP documentation is planned and is not yet fully implemented end to end.

## Problem and intended users

Students often struggle to find credible service work that matches their actual skills, while nonprofits may lack a simple way to recruit student volunteers and validate what they completed. VoluForge is intended to close that loop for three user groups:

- **High-school students**, who need relevant opportunities and trustworthy proof of service.
- **Nonprofit staff**, who need student help and a controlled way to review applications and verify service.
- **Platform administrators**, who need limited tools for nonprofit verification, account support, moderation, and auditing.

School staff are an important future user group, but a school portal is outside the initial MVP. See the [complete feature specifications](docs/features.md) for planned behavior and edge cases.

## MVP overview

The MVP covers one complete service cycle: a verified nonprofit publishes an opportunity; a student discovers and applies to it; the nonprofit accepts the student; the student records service time and proof; the nonprofit verifies the submission; and the student exports a verified service record.

- [MVP scope, feature IDs, and explicit exclusions](docs/mvp.md)
- [Detailed feature specifications](docs/features.md)
- [Essential user flows](docs/user-flows.md)

## Platform overview

| Layer | Planned platform choice |
| --- | --- |
| User experience | One responsive web application with role-based student, nonprofit, and admin interfaces |
| Front end and server | Next.js App Router, React, TypeScript, and Tailwind CSS |
| Authentication and data | Supabase Auth and PostgreSQL with role-based access policies |
| File storage | Supabase Storage or an equivalent object store for service proof and generated records |
| Hosting | Vercel for the web application and Supabase for managed backend services |

AI-assisted project-kit experiments already exist in the codebase, but AI is not required for the MVP service-verification loop.

## Repository layout

- `app/` — Next.js pages, route handlers, and role-facing flows
- `components/` — reusable interface components
- `database/` — current PostgreSQL/Supabase schema and migration scripts
- `docs/` — product scope, feature specifications, and user flows
- `lib/` — Supabase, AI, guest-session, and utility code
- `types/` — shared TypeScript models

## Development setup

Prerequisites: Node.js, npm, and a Supabase project for database-backed functionality.

The following repository, install, development-server, and production-build commands have been tested with the current `main` branch:

```bash
git clone https://github.com/Aadityathecoder/VoluForge.git
cd VoluForge
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:3000` after the development server reports that it is ready.

Before testing Supabase-backed flows, replace the placeholder values in `.env.local` for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The AI-related keys in `.env.example` are optional for the existing project-kit experiments and are not needed for the documented MVP. The repository does not yet provide an automated database bootstrap command; review the SQL files in `database/` before applying them to a Supabase project.

To verify that the application compiles:

```bash
npm run build
```

The production build passed locally on September 18, 2026. This confirms compilation; it does not confirm that every prototype or planned MVP flow is connected to a live backend.
