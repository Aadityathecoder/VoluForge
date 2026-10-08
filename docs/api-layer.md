# VoluForge website API

Added to the latest website source. No Expo server or mobile app is needed. The API uses the same `vf_*` tables and workflow RPCs as the updated website, so its data is shared with the website. Existing website direct Supabase calls remain in place.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/signup` | Volunteer or nonprofit account |
| POST | `/api/v1/auth/login` | Login for either account type |
| GET | `/api/v1/auth/me` | Profile and active organization memberships |
| POST | `/api/v1/opportunities` | Verified nonprofit staff creates opportunity |
| GET | `/api/v1/opportunities` | Published, unexpired opportunities from verified nonprofits |
| POST | `/api/v1/opportunities/{id}/applications` | Apply to opportunity |
| GET | `/api/v1/applications?opportunity_id={id}` | Owning nonprofit staff views applications |
| POST | `/api/v1/auth/logout` | End current session for either account type |

Lists accept `limit=1..100` and `offset=0..10000`; defaults are 50 and 0. Continue pagination for larger result sets. Errors contain `{ "error": "..." }`. Responses are not cached.

Signup JSON: `email`, `password` (8–128 characters), `fullName`, `accountType` (`volunteer` or `nonprofit`). Nonprofits also supply `organizationName`. Login JSON: `email`, `password`. The legacy `/api/auth/signup` delegates to this flow with `role: student|partner` and `schoolOrOrg` aliases. Signup cannot assign an admin role.

Nonprofit signup atomically creates an unverified organization and owner membership through migration `202610070001_api_nonprofit_signup.sql`. An administrator must verify the organization before staff can create opportunities, matching existing website rules. Metadata cannot grant verification. The new migration has been tested locally but **has not been applied to hosted Supabase**. Run it once after the existing `vf_*` migrations. The previously pending mobile impact migration is unrelated and not required for this API.

Opportunity JSON: `org_id`, `title`, `description`, `starts_at`, `ends_at` (ISO timestamps), `capacity`, optional `status: draft|published|closed` (default draft). Use published for volunteer discovery. Optional fields: category, location, remote, image_url, min_age, skills, proof_required, address, latitude, longitude, requirements. Apply JSON: `message` (10–3000 characters), `availability` (2–1000).

Authorization uses website cookies or `Authorization: Bearer <Supabase access token>`. Login returns the Supabase session and sets cookies for cookie clients. All application queries use the public key with the authenticated user's session. Database RLS and workflow RPCs enforce access. No service-role key is used. Cross-origin mutations are rejected; command-line clients omit Origin.

Logout revokes the current session/refresh token and clears cookies. A previously copied bearer access token remains valid until expiry, per [Supabase logout behavior](https://supabase.com/docs/guides/auth/signout). Clients must discard their session on logout. Immediate bearer-token revocation is not provided.

## Private configuration

Copy `.env.api.example` to `.env.local` and fill privately. The server and tests load values without printing credentials. NEXT_PUBLIC values are the public URL/key; DATABASE_URL is server/test-only. Use a direct or session-pooler connection with permission to inspect auth.users and auth.sessions. Never commit .env.local.

Start the website: `npm run dev -- --port 3157`. These backend changes need no website re-export.

## Sequential verification

Local direct database checks:

```sh
node database/tests/api-workflow.mjs
node database/tests/validate.mjs
```

These use embedded PostgreSQL (PGlite) with real migrations, RLS and RPCs. They test profile/nonprofit creation, atomic rollback, verification, publishing permission, volunteer visibility, applications, duplicates, staff access and revocation. They do not test Supabase Auth or successful HTTP calls.

Full live HTTP plus independent SQL checks, using a dedicated Supabase test project:

```sh
python3 -m venv .venv
.venv/bin/pip install -r tests/api-live/requirements.txt
.venv/bin/python tests/api-live/run.py
```

Set API_TEST_DATABASE=true only for a dedicated test project; the runner otherwise stops before writes. Apply the new signup migration there first. The runner verifies account/profile/membership rows before and after signup, login sessions, opportunity and audit rows, volunteer HTTP discovery, application rows, duplicate and unauthorized rejection, nonprofit HTTP review, and session removal plus HTTP denial after logout. It removes its exact temporary records in a finally block. It confirms generated example.com accounts through SQL; real email delivery is a separate test. It does not apply hosted migrations or alter existing organizations.

## Results from this task

- TypeScript check and production website build passed.
- Existing direct database regression suite: 50 workflow/security assertions plus opportunity detail checks passed.
- New sequential direct database workflow tests passed.
- Local HTTP checks passed: each implemented endpoint returns 503 without Supabase configuration; unknown endpoint 404, wrong method 405, cross-origin mutation 403.
- Successful live Supabase signup/login/logout and HTTP-to-database workflows remain **unverified**: no credentials were supplied. No hosted migration or production deployment occurred.
