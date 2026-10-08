# Run VoluForge on your phone for free

VoluForge is a React Native / Expo SDK 57 app. The free development demo runs inside Expo Go; it is not an App Store release or a standalone signed installation.

1. Install **Expo Go** from your phone's app store.
2. Sign in to Expo Go and Expo CLI with the same Expo account. The configured computer account for this session is `aadityacoder`.
3. In `mobile`, install dependencies with `pnpm install --frozen-lockfile` and run `pnpm exec expo login --browser` if not already signed in.
4. Copy `.env.example` to `.env.local`, enter your Supabase project URL and **publishable** key, and run `pnpm phone`.
5. Scan the QR from your phone's camera (iPhone) or Expo Go (Android).
6. Choose **Take a look around** for local fictional sample data, or **Get started** to sign in to the hosted database. Local demo entries do not sync to real accounts.

The tunnel is temporary: the computer and development server must remain running. Restarting can change the link. No Apple Developer membership or App Store submission is used for Expo Go. A standalone iPhone app with its own icon requires a different signing/install process; TestFlight generally requires paid Apple Developer membership. No paid build was ordered.

The app must use a version of Expo Go compatible with SDK 57. A successful JavaScript/Hermes export is not a signed native build. Test device launch, login, background/resume, attachment picking, and sharing on the actual phone.

## Hosted backend configured in this session

- Project: `VoluForge`, reference `urljfugiaylhrmlyamqf`.
- Provider: Supabase, existing Free plan. No plan upgrade was made.
- URL: `https://urljfugiaylhrmlyamqf.supabase.co`.
- Nine `vf_*` application tables, private `vf-proofs` bucket, workflow RPCs, and `delete-account` function deployed.
- Three clearly labeled fictional opportunities in `VoluForge Demo Organization` support discovery. These are not real placements. No synthetic accounts or approved service hours were inserted into the hosted database.
- `.env.local` is configured on the working computer and ignored by Git. Obtain the public publishable key from Project Settings → API Keys on another computer. Never use a secret/service-role key in the app.
- Existing website tables and Auth identities are shared. Deleting an account also deletes that shared Auth identity and any cascading website records. Do not test deletion with a valuable existing account.

## Auth return links

The approved redirect allowlist contains `voluforge://auth/callback`, `http://localhost:8081/auth/callback`, and `exp://pw2aona-aadityacoder-8081.exp.direct/--/auth/callback` for this session. If a tunnel restart changes its address, update the exact callback in Supabase Authentication → URL Configuration before testing confirmation/recovery. Keep the development server running while opening email links.

## Demonstrate database queries

Run the queries in `supabase/demo_queries.sql` individually in the project's SQL Editor. They show RLS coverage, catalog relationships/capacity, workflow totals and the private proof bucket. SQL Editor queries as `postgres` bypass RLS, so they are not authorization tests.

For a repeatable student/reviewer workflow with synthetic identities in an isolated PostgreSQL runtime:

```sh
cd database/tests  # from the repository root
pnpm install --frozen-lockfile
pnpm test
pnpm demo
```

The demo publishes a listing, saves it, applies, accepts the application, submits 90 minutes, proves pending time is excluded, approves it and reads 1.5 verified hours. No hosted data is changed by this runner.

## Next device checks

Use separate real test accounts to confirm the connected student/reviewer flow, recovery links, private proof upload/download, PDF sharing, and account cleanup. Organization staff membership remains an operator-only step; ordinary users cannot make themselves reviewers. Public policy/support URLs are still release work. This demo is not certified production-ready.

References checked October 4, 2026: [Expo development setup](https://docs.expo.dev/get-started/start-developing/), [Apple membership comparison](https://developer.apple.com/support/compare-memberships/), [Supabase Free plan](https://supabase.com/pricing). Free projects can pause after one week of inactivity; Free includes 500 MB database and 1 GB file storage, with limits that should be checked again before launch.

## October 5 native feature update

The original Expo project now includes the impact platform. See [the feature and deployment guide](IMPACT_PLATFORM.md). The old remote tunnel is unavailable; use the new LAN Expo Go QR while your phone is on the computer’s network. Its current address is `exp://10.20.204.253:8081`. The main impact migration is deployed; the native timed-entry/resubmission extension is awaiting approval.
