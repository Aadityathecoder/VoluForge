# VoluForge database

The shared volunteer-service schema uses **PostgreSQL on Supabase**. Its executable definition is the [baseline](migrations/202609280001_voluforge_native.sql) followed by the [opportunity-detail migration](migrations/202610050001_opportunity_details.sql). It includes nine application tables, foreign keys, indexes, checks, row-level security, authenticated workflow functions, Auth profile provisioning, and private proof-storage policies.

This baseline is promoted unchanged from the existing mobile backend so web and mobile can use the same API. The historical filename is retained for migration tracking. The test runner checks that both copies remain identical; subsequent changes belong in new versioned migrations, not edits to this baseline. Do not apply both copies to the same database.

Both migrations are deployed on the existing VoluForge Supabase Free project. They were applied in SQL Editor; reconcile CLI migration history before later `db push` operations, as described in the [backend guide](../mobile/supabase/README.md#current-deployment-and-migration-history).

## Schema and relationships

See [SCHEMA.md](SCHEMA.md) for the entity relationship diagram, table dictionary, lifecycle rules, and access model. The existing [backend API guide](../mobile/supabase/README.md#client-api) documents function parameters and the trusted organization-onboarding workflow.

## Apply the schema

Use a Supabase database with Auth and Storage initialized. A plain PostgreSQL database does not provide the required `auth.users`, `auth.uid()`, roles, or `storage` tables. Run as the database owner.

For a new volunteer-service database, apply the baseline **once**, either by pasting the migration into the Supabase SQL editor or from the repository root:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f database/migrations/202609280001_voluforge_native.sql
```

Then apply `database/migrations/202610050001_opportunity_details.sql` once to add address, coordinate and requirement fields. Each migration wraps itself in a transaction. An error aborts it; do not bypass errors. It backfills profiles for existing Auth users. For projects already using the mobile Supabase CLI migration, the baseline is already installed: **skip this command**. Do not mix manual and CLI migration tracking without reconciling the migration history.

Keep `vf_private` out of Supabase's exposed API schemas. Use the public anonymous key plus the signed-in user's JWT in clients. Never expose the service-role key. Organization verification and staff membership are assigned by a trusted operator; signup metadata cannot grant those permissions.

Applying SQL creates database objects only. The Next.js prototype still needs to be connected to these tables/RPCs. Account deletion additionally requires the existing `mobile/supabase/functions/delete-account` Edge Function and Storage API cleanup; see the backend guide before deploying it.

## Existing prototype compatibility

`schema.sql`, `handle_new_user.sql`, and `need_images.sql` are the **legacy community-needs / AI project-kit prototype**, not prerequisites for the volunteer-service schema. They remain for the current Next.js screens. New `vf_` tables do not rename, migrate, or modify those tables or their policies. Legacy `profiles.role` is not used for volunteer-service authorization.

Do not treat the legacy scripts as a production security baseline: they allow client profile-role changes, derive roles from signup metadata, and contain broad image-update policies. Installing the new schema does not repair those separate prototype permissions. Prefer a separate Supabase project until the legacy access model and shared-Auth deletion behavior have been reviewed.

## Run database tests

The isolated test package avoids adding a PostgreSQL test engine to the web application's dependencies. With Node.js and pnpm installed:

```sh
cd database/tests
pnpm install --frozen-lockfile
pnpm test
pnpm demo
```

The runner uses an ephemeral in-memory PGlite database, creates minimal Auth/Storage substitutes, applies every versioned migration, checks all nine tables have RLS enabled, then runs the existing 50-check SQL regression suite. It validates access isolation, application capacity, reviewer permissions, approved-only exports, timer retry behavior, proof policies, and account-deletion cascades. It also checks detail persistence and coordinate constraints. `pnpm demo` shows an isolated student/reviewer workflow from publishing through 1.5 approved hours. No credentials or network database are used. Read-only hosted examples are in [`mobile/supabase/demo_queries.sql`](../mobile/supabase/demo_queries.sql).

PGlite does not validate hosted Auth, file transfers, Edge Functions, email, or concurrent connections. Before deployment, also run the SQL regression on a disposable Supabase database and test the full workflow with real Storage/Auth. Never run test fixtures against production.

## Current design limits

The implemented schema records current decision notes and status-only audit events, rather than separate immutable decision-history tables. Organization verification is an operator-set boolean, and there is no browser administrator-role table or moderation RPC. Auth deletion cascades service records; this differs from the longer-term archival design in `docs/architecture.md`. These remain explicit product decisions before a production launch, not features implied by this schema delivery.
