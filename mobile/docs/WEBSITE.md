# VoluForge website and Expo app

The website uses the same `mobile/App.tsx` and screens as the Expo app. Desktop browsers get a sidebar, wider cards, and centered dialogs. Phone browsers keep the app layout and five-tab navigation. Supabase accounts, organization memberships, applications, proof, approved hours, and impact data use the existing shared backend.

## Website build

Run `npm run website:export` with dependencies installed in `mobile/`. This creates the checked-in `public/voluforge` release. `npm run build` verifies its source fingerprint and builds Next.js. Vercel can use its existing root-level install/build setup without installing mobile dependencies. Re-export after changing the app source; stale exports fail the build.

Root Next.js serves the shared app at `/`, `/explore`, `/activity`, `/impact`, `/profile`, `/partners`, `/community`, `/opportunity?id=...`, the auth routes, and policy/support routes. Earlier prototype navigation redirects to this shared experience. Existing API handlers remain available.

`runtime-config.js` includes only the Supabase URL and publishable key, with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` overriding the export's public defaults. Never supply a service-role key. Authorization remains enforced by Supabase RLS and workflow RPCs. The website uses per-tab session storage; native tokens remain in the OS keychain.

Signup and password-reset links return to `/auth/callback`. Configure `https://voluforge.xyz/auth/callback` and, if used, `https://voluforge.com/auth/callback` in Supabase Auth's redirect allowlist. Preview-domain callbacks need their own allowed URLs. Browser records use the print dialog's Save as PDF option.

## Feature scope

The shared feature guide in `IMPACT_PLATFORM.md` applies to both platforms. Matching is a configurable scoring model, not a model trained on platform outcomes. Research uses suppressed anonymous cause cohorts, not demographic or causal claims. The allocator proposes one capacity-constrained placement per volunteer; partner review remains required. Organization owner/reviewer membership controls access; there is no separate platform-administrator system.

Migration `202610050002_impact_platform.sql` is deployed. Migration `202610050003_mobile_impact.sql` remains pending explicit user approval following an automatic approval rejection. Logging results against existing/timed entries and atomic service/outcome resubmission need that migration; basic workflows and new manual service-plus-outcome submission work with the deployed migration.

## Verification

The production Next.js build and shared app TypeScript check pass. All 22 mobile/domain/website-route tests pass. Browser checks cover the production export, signup/reset dialogs, restored tab and opportunity links, matching cards, community needs, research suppression, API documentation, and partner-access gating. No real account was created or live service submitted for these checks. The browser also rendered the phone layout at 423 × 724, with body width matching the viewport, and the Impact Graph dialog was checked at that size. A physical phone check remains outstanding.

The existing Vercel project `volu-forge` hosts both voluforge.xyz and voluforge.com and deploys production from `main`. Publishing this replacement updates both domains. Production promotion has not been performed.

Supabase Auth currently has `http://localhost:3000` as Site URL and only native/Expo/local web redirects. Production website callbacks must be added before signup confirmation and reset-email flows are ready. These hosted settings have not been changed.

The local review branch is `codex/website-app-parity`. The attempted Git push failed because GitHub credentials are unavailable on this Mac; the SSH agent also has no identities. No remote branch, pull request, or hosted preview was created.
