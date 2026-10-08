# VoluForge weekly submission — October 4, 2026

## Task status

| Task | Status | Result and remaining work |
| --- | --- | --- |
| Review screen/user flows | First pass completed; device QA pending | Reviewed onboarding, Home, search/discovery, opportunity detail, applications, Activity, Impact and profile in the browser preview. Fixed remaining-capacity display, repeat application after withdrawal, and missing persisted requirements/address. Added an unapplied demo listing so the Apply flow can be demonstrated. |
| Create database schema | Implemented and deployed | Extended the repository's existing nine-table Supabase design with address, coordinates and requirements. Deployed both migrations, RLS, workflow functions and private proof storage to the existing VoluForge project. This builds on the existing backend rather than claiming all schema work is new. |
| Find DB hosting | Configured | Existing Supabase Free project `urljfugiaylhrmlyamqf`; no plan upgrade. Three clearly fictional hosted opportunities support discovery. |
| Demo database queries | Completed | Read-only hosted queries verify schema/catalog/storage. A repeatable isolated PostgreSQL demo runs publish → discover → save → apply → accept → submit 90 minutes → approve → 1.5 verified hours. Pending time is excluded. |
| Support mobile screen data | Implemented; connected workflow testing pending | Profiles, organizations, opportunities, saves, applications, service entries, timers and reviewer workflows use the hosted API. Added missing detail fields and wired the remaining-capacity RPC. Preview-mode data deliberately stays local. |
| Native demo on personal phone for free | Ready to try; device launch unconfirmed | Started an Expo Go tunnel, configured local public Supabase settings, and saved approved authentication callbacks. No App Store submission or standalone signed app was produced. The computer/server must stay running for this demo. |

Code is on `codex/mobile-database-demo`. The final submission records the exact commit identifier and whether GitHub upload succeeded. Work in progress is included in the commit.

## Validation and evidence

- TypeScript check and all **16** mobile domain/deletion-handler tests passed.
- Database tests passed: migration mirror parity, **nine RLS tables**, **50 workflow/security assertions**, plus new detail persistence and coordinate constraints.
- iOS JavaScript/Hermes export passed; this is not a signed native compilation.
- Hosted query returned: **9** mobile tables with RLS, **3** fictional opportunities, private proof bucket **true**, and **4** new detail columns.
- Live anonymous table/RPC requests were rejected. The deployed deletion handler rejected an unauthenticated request with HTTP **401**.
- The deletion function's legacy JWT gateway setting was disabled with explicit approval; its own server-side `auth.getUser` verification remains active.
- Three exact mobile/web authentication return URLs were saved with explicit approval. Email delivery and device callbacks remain untested.
- Browser evidence shows welcome, Home, search, Activity, the application form, a submitted **Pending** application, Impact and hosted SQL results. Screenshots demonstrate the web preview, not a physical phone.

## First-pass flow review

1. **Welcome → Home — healthy in preview.** The local sample path is clearly marked. Real accounts use a separate sign-in path. Evidence: welcome and Home screenshots.
2. **Explore → search → detail — healthy in preview.** Keyword search narrowed results; detail shows organization, date, eligibility, requirements and address. Remaining capacity now comes from the database instead of an absent column. Evidence: search and application-detail screenshots.
3. **Apply → pending → withdraw — corrected.** An untouched sample listing allows submission, and the submitted application displays Pending. Withdrawn applications cannot start a second application, matching the database's unique user/opportunity constraint. Evidence: application form and Pending screenshot; automated withdrawal-gate test.
4. **Accepted → log service / timer — further device checks needed.** Controls are reachable, and SQL tests enforce accepted applications, dates, duration, proof requirements and timer retry rules. Future/closed sessions still expose actions that can return a validation error; improve action availability messaging next week. Evidence: Activity screenshot; database regression results.
5. **Review → Impact → export — database logic verified, device export pending.** Only approved time contributes to the verified record. Preview impact is labeled fictional. Reviewer UI and native sharing need a connected two-account run. Evidence: Impact screenshot and database query transcript.
6. **Profile / recovery / deletion — setup complete, device validation pending.** Profile and policy/help controls are present. Hosted deletion rejects unauthenticated calls. Real recovery, destructive cleanup and shared website-account behavior must be checked with disposable accounts.

This is a first-pass logic and visual review, not full accessibility certification. Small supporting labels need large-text and screen-reader checks. Publishing around local/UTC midnight also needs focused testing.

## Issues / blockers

- Physical phone launch and connected student/reviewer testing have not been confirmed. Use Expo Go with a compatible SDK and the same Expo account as the CLI.
- Real reviewer access requires trusted operator provisioning; users cannot promote themselves. No fake hosted Auth accounts or approved hours were created.
- Native proof picking/upload/download, background timers, confirmation/recovery, PDF sharing and authenticated deletion remain integration checks.
- SQL migrations were applied manually. Reconcile CLI migration history before later `supabase db push`; do not rerun either installed migration.
- The Supabase Auth identity is shared with the existing website. Account deletion can affect shared website records. Legacy website authorization remains separate work.
- Free hosting has quotas and inactivity pausing; the Expo tunnel is temporary. No paid hosting/build/publishing was ordered.
- Public policy/support pages and production release requirements remain unfinished.

## First-pass goals for October 5–11

1. Launch on the personal phone and record a short student journey: sign in, browse, save, apply and reopen the app to confirm persistence.
2. Provision a test reviewer and complete apply → accept → log proof → request changes → resubmit → approve → export with separate accounts.
3. Verify confirmation/recovery, background/resume, file access, sharing and deletion using disposable accounts; capture device evidence.
4. Improve unavailable-action messaging, test dates across time zones, and check large text, VoiceOver/TalkBack and touch targets.
5. Reconcile migration tracking, review the shared website access/deletion model, and replace demo listings with verified organization data only when ready.

## Reproduce

- Phone setup: [FREE_PHONE_DEMO.md](FREE_PHONE_DEMO.md).
- Schema and relationships: [database/SCHEMA.md](../../database/SCHEMA.md).
- Hosted read queries: [demo_queries.sql](../supabase/demo_queries.sql).
- From `database/tests`: `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm demo`.
- From `mobile`: `pnpm typecheck`, `pnpm test`, `pnpm export:ios`, `pnpm phone`.
