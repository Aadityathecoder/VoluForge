# Launching the new VoluForge website and app

This branch replaces the Expo web export at voluforge.xyz with a real Next.js website. It also adds administrator accounts, fellowships and Google sign-in to both the website and the Expo app, and removes the sample-data preview mode.

## 1. Apply the database update

`database/migrations/202611130001_admin_fellowships.sql` (same file in `mobile/supabase/migrations/`) adds:

- `vf_profiles.account_type` (`student` or `admin`), `admin_organization` and `admin_verified`
- `vf_fellowships` and `vf_fellowship_enrollments`, reachable only through RPCs
- RPCs for students (`vf_fellowship_directory`, `vf_apply_to_fellowship`, `vf_withdraw_from_fellowship`), administrators (`vf_admin_*`) and Google sign-ins choosing a type once (`vf_choose_account_type`)

Existing people become students. Test it locally first:

```sh
cd database/tests && pnpm install && node fellowships.mjs
```

Then run the file once in the Supabase SQL editor for project `urljfugiaylhrmlyamqf`, or with `supabase db push` after reconciling migration history (see `mobile/supabase/README.md`). Until it runs, the site and app show a "fellowships aren't switched on yet" notice instead of failing.

## 2. Turn on Google sign-in

1. Google Cloud console → APIs & Services → Credentials → Create OAuth client ID (Web application). Authorized redirect URI: `https://urljfugiaylhrmlyamqf.supabase.co/auth/v1/callback`.
2. Supabase → Authentication → Sign In / Providers → Google: paste the client ID and secret, enable.
3. Supabase → Authentication → URL Configuration:
   - Site URL: `https://voluforge.xyz`
   - Redirect URLs: `https://voluforge.xyz/auth/callback`, `https://voluforge.com/auth/callback`, `voluforge://auth/callback`, and `http://localhost:3000/auth/callback` for local work.

Google sign-ins have no account type yet, so the website sends them to `/onboarding` and the app shows a one-time "student or administrator" question.

## 3. Administrators and verification

Anyone can create an administrator account and fellowships. Their open fellowships work immediately with a join code. They appear in the public fellowship list only after you verify the account:

```sql
-- Check the person and their organization first.
update public.vf_profiles set admin_verified = true where id = 'AUTH_USER_UUID';
```

To revoke public listing, set it back to `false`.

## 4. Deploy the website (Vercel project `volu-forge`)

- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public values only, never a service-role key).
- Build command is plain `next build`; `public/voluforge` and `scripts/website.mjs` are gone.
- Merging to `main` deploys both voluforge.xyz and voluforge.com.

## 5. Build the app with Expo

```sh
cd mobile
pnpm install
cp .env.example .env.local   # fill in EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY
pnpm start                   # Expo Go
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios
```

`react-native-reanimated` is used for press feedback, so test on a release build, not just Expo Go.

## What changed for people

- **Website**: top navigation, landing page, sign in/up with email or Google, student pages (Home, Fellowships, Opportunities, My activity, Profile), administrator console (fellowship list, create/edit, applicants with accept/decline, join codes). Service-hour logging, proof upload and impact tools stay in the mobile app.
- **App**: new welcome screen, Bricolage Grotesque headings, standard bottom tab bar, Fellowships tab for students, administrator console with its own tabs, Google sign-in, no "Take a look around" sample mode.
