# VoluForge native backend

This is an additive Supabase backend for the native app. The baseline and opportunity-detail migration are deployed to the existing VoluForge Free project (`urljfugiaylhrmlyamqf`), along with the deletion function. All application objects use `vf_` names; the `vf_private` schema holds authorization helpers. Existing website tables are not migrated or renamed.

Use a dedicated Supabase project for a separate native release, or deliberately share Auth with the existing website. In a shared project, deleting an account deletes that Supabase identity everywhere, including any legacy tables whose foreign keys cascade from `auth.users`. Review legacy foreign keys/storage policies before choosing shared Auth. Existing users are backfilled into `vf_profiles` by the migration.

## Current deployment and migration history

The two migrations were applied through SQL Editor. Before using `supabase db push` against this existing project, inspect `supabase migration list` and reconcile manually applied versions with the CLI history. Only after confirming the objects match, mark `202609280001` and `202610050001` applied using `supabase migration repair VERSION --status applied`. Do not reapply the baseline or the column-addition migration. New projects should apply both migrations normally.

Three exact Auth return URLs were saved with user approval: `voluforge://auth/callback`, `http://localhost:8081/auth/callback`, and the current Expo tunnel callback listed in the phone guide. The legacy JWT gateway check is off only for `delete-account`; the handler still authenticates each user with `auth.getUser`. An unauthenticated live invocation returned HTTP 401. Full authenticated cleanup remains a disposable-account test.

## Deploy

1. Create or select the Supabase project. Enable email/password Auth, email confirmation, a production SMTP provider, and appropriate Auth rate limits. Configure redirect URLs for the native app scheme from `app.config.ts` and any production web callback. Test confirmation and password recovery on a physical device before release.
2. Install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started). From the app directory run:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push --dry-run
   supabase db push
   supabase functions deploy delete-account --no-verify-jwt
   ```

   Inspect the dry-run before applying. The Edge Function deliberately performs its own server-side `auth.getUser(token)` verification; `--no-verify-jwt` does not make deletion anonymous. Keep `vf_private` out of the project's exposed API schemas.
3. The Edge runtime provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Keep the service-role key out of Expo variables, source control, logs, and clients. Client configuration is only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
4. Enable backups appropriate to the launch and configure operational monitoring. No production seed data is supplied. Create real organizations and actual opportunities through the trusted operator workflow below.
5. Run `tests/rls_regression.sql` on a disposable/local database with the migration installed. Do not run it against production. It uses fictional fixtures inside a transaction and rolls them back.
6. Perform a staging end-to-end check with two student accounts and a nonprofit reviewer: apply → accept → submit time and optional proof → request changes → resubmit → approve → export → delete account. Test object uploads and signed downloads through the real Storage API, email links, app background/restore, and deletion with network interruption.

A minimal `config.toml` is included for remote migration/functions use. For full local Supabase development, generate the normal local configuration with `supabase init` in a temporary directory, then merge the `[functions.delete-account]` section.

## Trusted operator workflow

Users cannot grant themselves staff membership or mark their organization verified. Verification and membership are operator responsibilities through the Supabase SQL editor/service API. There is no public administrator signup or automatic approval.

```sql
-- Run only after checking the organization and its representative.
insert into public.vf_organizations(name, description, website, verified)
values ('Actual organization name', 'Verified organization description', 'https://actual-organization.example', false)
returning id;

-- Substitute the returned organization ID and the representative's Auth UUID.
insert into public.vf_org_staff(org_id, user_id, role)
values ('ORGANIZATION_UUID'::uuid, 'AUTH_USER_UUID'::uuid, 'owner');

-- Mark verified only after your verification process is complete.
update public.vf_organizations set verified=true where id='ORGANIZATION_UUID'::uuid;

-- Revoke reviewer access immediately when they leave.
update public.vf_org_staff set active=false
where org_id='ORGANIZATION_UUID'::uuid and user_id='AUTH_USER_UUID'::uuid;
```

The example website is a placeholder, not a configured support/privacy endpoint. Replace it with the real organization's address. A verified staff member can publish using `vf_upsert_opportunity(p_data,p_id)`; this expects a complete opportunity object and optional existing ID. It preserves organization identity, rejects capacity below the accepted count, and serializes changes against acceptances. Operators can inspect `vf_audit`; clients cannot insert or modify audit events. Student account suspension can use an Auth ban; ensure a revoked/frozen profile also blocks already-issued JWT access when immediate cutoff is needed.

## Client API

All data access requires a signed-in Supabase user. Anonymous exploration is a separate local demo, not access to production rows.

| Operation | API |
| --- | --- |
| Read own profile; reviewers read applicant profiles | `vf_profiles` via RLS |
| Edit name, school, bio, skills, causes, goal | Safe-column profile update |
| Discover verified organizations/opportunities | `vf_organizations`, `vf_opportunities` via RLS |
| Accurate remaining capacity | RPC `vf_available_spots()` → `opportunity_id, spots_left` |
| Save / unsave | Insert / delete `vf_saved(user_id,opportunity_id)`; no update/upsert |
| Apply | `vf_apply_to_opportunity(p_opportunity_id,p_message,p_availability)` |
| Accept / decline | `vf_decide_application(p_application_id,p_decision,p_note='')` |
| Withdraw before service | `vf_withdraw_application(p_application_id)` |
| Submit / resubmit manual service | `vf_submit_service(p_application_id,p_service_date,p_minutes,p_notes,p_proof_path=null,p_entry_id=null)` |
| Review submitted service | `vf_review_service(p_entry_id,p_decision,p_note='')` |
| Start / recover timer | `vf_start_timer(p_application_id)`; read own active `vf_service_timers` |
| Stop timer and submit atomically | `vf_stop_timer(p_timer_id,p_notes,p_proof_path=null)` |
| Cancel timer | `vf_cancel_timer(p_timer_id)` |
| Verified export | `vf_verified_record(p_from=null,p_to=null)` |
| Publish/edit complete opportunity | `vf_upsert_opportunity(p_data,p_id=null)` |
| Delete own account | `functions.invoke('delete-account',{body:{confirmation:'DELETE'}})` |

Workflow RPCs return the affected row except `vf_cancel_timer` (void), the two table-returning report RPCs, and deletion (JSON). RPC errors are displayed to users as action failures. Never silently fall back to demo state after a server error.

Application states: `pending`, `accepted`, `declined`, `withdrawn`. Only pending applications can be decided. Staff cannot apply to their own organization; staff subsequently assigned to their application cannot decide it themselves. Both applying and accepting check capacity under an opportunity row lock. Capacity belongs to accepted applications, not pending applications.

Service states: `pending`, `approved`, `changes_requested`, `rejected`. Only the submitter can resubmit a returned entry. Only current staff of its verified organization can review a pending entry, and nobody can approve their own service. Approved/rejected entries are immutable through the public API. Reviewer notes are required for rejection and change requests. Pending, returned, and rejected entries are excluded from `vf_verified_record`; approved service does not imply school credit or a third-party signature.

Manual logs are date + duration, limited to 1–720 minutes per entry and 1,440 non-rejected minutes per student/date. These inputs do not encode start/end times, so manual interval overlap is not asserted. They remain unverified until nonprofit review. Dates use UTC for server boundaries. Minimum age is opportunity eligibility information for the volunteer/nonprofit to confirm; no date of birth is collected or automatically verified.

Timers use server timestamps and persist across app restarts. A student can have one active timer. Starting the same accepted application recovers that timer. Stop is atomic and retry-safe, returning the same entry after a lost response; timers under one minute cannot submit. Timer intervals cannot overlap existing non-rejected timer entries. If a timer exceeds 12 hours, cancel it and manually enter the actual duration with notes. If a required proof is missing or the network fails, the timer remains available for retry. Duration rounds down to completed minutes. For an overnight timer its start date is the service date.

## Private proof files

The migration creates the **private** `vf-proofs` bucket with a 10 MB limit. Accepted types are JPEG, PNG, HEIC, WebP, and PDF. Use exactly `<auth.uid>/<uuid>.<extension>`, lowercase extensions, with upload `upsert:false`. The backend checks object existence and ownership before accepting a proof path. Store only the path in service entries; arbitrary external URLs are rejected.

Own proof is readable by its owner and current authorized reviewers for the associated service entry. Use `createSignedUrl(path,60)` immediately before opening it. A signed URL remains usable until expiration even if staff access is revoked; do not save or log signed URLs. Unsubmitted attachments may be deleted. Submitted attachments cannot be deleted or overwritten from the client, including through unrelated permissive legacy Storage policies. Replacing proof on a returned entry uses a new object name. Restrictive bucket-specific fences do not change access to other buckets.

## Account deletion

The Edge Function validates the supplied JWT against Supabase Auth and always derives the user ID from that result. The client cannot specify another user to delete. It then freezes the profile, which blocks access with existing JWTs, deletes proof objects through the Storage API in batches, and hard-deletes the Auth user. Foreign keys cascade profiles, saves, applications, service entries, timers, and staff membership. Status-only audit events remain with a null actor; reviewer identity references in others' records become null. Organizations and their opportunities remain organization-owned records.

If deletion cannot finish, the account remains frozen and the endpoint permits an authenticated retry. No success is reported early. Very large proof sets may need multiple retries. A shared Supabase project may have other Storage objects owned by the same Auth user: Supabase can refuse Auth deletion until an operator removes/transfers those objects. This function deliberately does not delete unrelated legacy buckets. Resolve that retention/migration decision before release if sharing Auth.

## Verification performed

The migration was applied successfully to PGlite (PostgreSQL in WASM) using lightweight Auth/Storage schema substitutes. The SQL suite passed 50 explicit assertions/expected-error checks, including isolation, revoked/foreign staff, immutable approved records, capacity exhaustion, proof privacy even under a broad legacy policy, timer recovery/retry, and deletion cascades. The suite found and corrected a UTC/local-day boundary error during implementation.

The deletion handler also passed seven Node unit tests with explicit Auth/Storage mocks: method/JWT/confirmation checks, authenticated-user identity binding, ordered cleanup, and failure/retry behavior. After installing the app dependencies, run `node --test supabase/tests/delete-account.test.mjs` from the app root. These tests transpile and execute the actual handler source; they do not contact a Supabase project.

PGlite checks SQL/PLpgSQL, database constraints, grants, RLS, and transition behavior. It does not simulate Supabase's hosted Auth, Storage byte transport, Edge runtime, concurrent connections, or email delivery. The Edge Function is deployed; a live unauthenticated request was rejected with HTTP 401 by the handler. Authenticated cleanup and the staging tests listed above remain release gates.

Primary references: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [database functions](https://supabase.com/docs/guides/database/functions), [private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Storage deletion](https://supabase.com/docs/guides/storage/management/delete-objects), [Auth user deletion](https://supabase.com/docs/guides/auth/managing-user-data).
