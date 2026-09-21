# MVP System Architecture

## Selected platforms

| Layer | Choice | Semester rationale |
| --- | --- | --- |
| Client and server | Next.js 15 App Router, React 19, TypeScript | Already present; one deployable application |
| Styling | Tailwind CSS | Already configured; fast responsive iteration |
| Authentication | Supabase Auth | Email accounts and server-readable sessions |
| Database | Supabase PostgreSQL | Relational workflow and row-level security |
| Proof storage | Supabase Storage, if time permits | Same provider and access model; metadata-only demo fallback |
| Record export | Server-generated printable/PDF response | Keeps verified totals server-derived |
| Hosting | Vercel + Supabase | Managed free-tier deployment with minimal administration |
| Tracking | GitHub Issues and milestones | Lives beside code and supports teacher access |

## Runtime boundaries

The browser renders role-specific screens and submits requests. Next.js server code validates sessions, roles, ownership, and transitions. PostgreSQL stores users, organizations, opportunities, applications, service entries, decisions, and audit events. Row-level security provides a second authorization boundary. Storage holds optional proof files. Export code requeries approved entries rather than trusting browser totals.

## Core data entities

- profiles and roles
- organizations and organization_staff
- organization_verification_decisions
- opportunities
- applications and application_decisions
- service_entries and service_reviews
- audit_events

## Administrative setup checklist

- Confirm Node.js/npm and local editor configuration
- Create or reactivate the Supabase project and record development environment variables locally
- Apply versioned database migrations and seed demo accounts/data
- Configure Auth redirect URLs for local and deployed environments
- Create private proof-storage bucket and access policies if proof upload remains in scope
- Connect the GitHub repository to Vercel, configure environment variables, and verify preview/production builds
- Configure `voluforge.xyz` only after the production deployment is stable
- Document backup/rollback approach: migrations in Git, tagged demo commit, and known-good deployment

No Apple/Google developer registration, Xcode, Android Studio, Docker, payment account, or AI-provider account is required for this web MVP.

## Architecture definition of done

The architecture is ready when a fresh environment can build the app, migrations create the documented schema, seeded users can exercise each role, protected requests reject the wrong role/owner, and the deployed environment completes the same core loop as local development.
