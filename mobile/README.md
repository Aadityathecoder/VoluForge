# VoluForge mobile

Native React Native / Expo iPhone app for the VoluForge student volunteering project. This is a work-in-progress source snapshot, not an App Store release. The existing Next.js website is independent and remains unchanged.

## Included

- Cream, black, and orange interface inspired by the supplied references: onboarding, Home, Explore, opportunity detail, Activity, Impact, and profile.
- Persistent, clearly labeled local demo; demo records never become live service records.
- Email/password Supabase authentication and account-recovery links; native tokens in SecureStore.
- Keyword/cause/remote discovery, saved opportunities, applications, and withdrawal.
- Manual service logs, persistent timers, private proof attachments, requested-change resubmission, and approved-hour totals.
- Nonprofit workspace for opportunity publishing, application decisions, and service review.
- PDF service-record sharing; live records come from an approved-only database RPC and demo exports are watermarked.
- In-app account deletion, an additive Supabase migration, private storage policies, deletion Edge Function, tests, and release documentation.

Stitch project 1548743735920365146 / screen 26ee6c5b2bcf4aa3903cdfa7307c7816 was referenced by the user but could not be retrieved: no connected Stitch tool or exported download URL was available. The implementation uses the supplied visual references and original components. It does not claim to reproduce the unavailable Stitch export.

## Run

Use a current Node.js release supported by Expo SDK 57 and pnpm 11.19.0.

```sh
cd mobile
pnpm install --frozen-lockfile
pnpm web
```

From the standalone source folder, omit `cd mobile`. Select **Take a look around** for the local demo. For iPhone development use `pnpm start` with a compatible Expo Go installation, or create a native development build. Native device testing is still required.

For live accounts copy `.env.example` to `.env.local`, fill the public Supabase settings, and follow [backend setup](supabase/README.md). No live backend, policies, signing credentials, or account keys are included. Never put a Supabase service-role key in Expo public variables. The new `vf_*` tables do not automatically import the website's existing community needs or projects.

```sh
pnpm typecheck
pnpm test
pnpm export:ios
pnpm preflight
```

`preflight` intentionally fails until real backend, public privacy/terms/support URLs, an EAS project ID, and a bundle identifier are configured. It does not prove production readiness.

## Validation and remaining work

- TypeScript check passed.
- iOS JavaScript/Hermes bundle export passed; this is not a signed IPA or native compilation.
- 13 application-domain and mocked deletion-handler tests passed.
- 50 PostgreSQL assertions passed in PGlite using minimal Auth/Storage schema substitutes.
- Phone-size web preview rendered and key screens were inspected. Full browser flow QA was still in progress when this snapshot was requested.
- Xcode is not installed on the build machine; no simulator, physical-device, TestFlight, or App Review validation has been performed.
- Hosted Supabase Auth, email links, Storage uploads, review workflows, account deletion, and PDF sharing require staging/device validation.
- Public policy/support pages, actual nonprofit onboarding, signing, store metadata, and store screenshots remain release tasks.

See [App Store release guide](docs/APP_STORE_RELEASE.md) and [asset sources](docs/ASSET_SOURCES.md). The source contains no App Store deployment or GitHub workflow that publishes automatically.
