# Weekly deliverable — opportunity discovery slice

**Week of September 21, 2026 · Feature F04, partial**

## What can be demonstrated

The `/opportunities` route reads persisted listings from Supabase and lets visitors filter by keyword, cause, skill, and participation mode. A detail route shows the full role description. The database only exposes open listings belonging to approved organizations; a guessed ID for a draft or pending-partner listing returns 404. Demo listings are explicitly marked fictional. The existing `/explore` community-needs experiment remains separate.

This slice does not yet include nonprofit self-service publishing, applications, time logging, or verified records. The two sample listings are demonstration data and must not be represented as real available service.

## Setup and seven-minute demonstration

1. Confirm `.env.local` contains a Supabase URL and anon key for the intended pilot project.
2. In that project's SQL editor, run `database/migrations/20260924_opportunity_discovery.sql` after the existing `database/schema.sql`. Do not run it on a database with conflicting table/policy names without reviewing it first.
3. Start the app with `npm ci && npm run dev` and visit `/opportunities`. The two Demo listings should be visible.
4. Search `Python`; expect only the coding workshop. Select `Food access`; expect only the pantry role. Select `Remote`; expect the pantry role. Clear filters and open each listing.
5. As an anonymous browser visitor, try `/opportunities/87d1c78d-2f2e-4e9f-9803-ce002b2d9888` (pending partner) and `/opportunities/77b0945d-d3fb-4e5a-a174-8546ec82c4bf` (draft). Both must return 404. The database, not just the screen, enforces this rule.

## Acceptance and evidence

| Check | Expected result |
| --- | --- |
| Seeded list | Two fictional, labeled opportunities appear from persisted records |
| Filters | Keyword, cause, skill, and mode independently narrow the list; Clear resets them |
| Detail | Each visible listing opens with its requirements and organization name |
| Forbidden IDs | Pending-partner and draft IDs return 404 to an anonymous visitor |
| Setup/error | Missing configuration and query failure show distinct, honest messages |
| Build | `npm run build` completes after installing dependencies |

Record screenshots of the list, a filtered result, and a hidden-ID 404 after running this on a configured Supabase project. Do not mark the slice fully verified until those checks pass in that environment.

## Next dependency

Add staff ownership and an administrator approval workflow before granting nonprofit write access. Harden the existing profile role/signup path so users cannot assign themselves privileged roles; the current prototype accepts role metadata and lets users update their own profile rows. Then implement controlled opportunity publishing and student applications. Current seed insertion requires trusted database access by design.
