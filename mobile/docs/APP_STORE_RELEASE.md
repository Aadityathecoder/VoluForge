# VoluForge · App Store release guide

This repository is an iOS app implementation and release starting point. A web preview or successful JavaScript export does not verify an iOS binary. No signed archive, Apple upload, TestFlight run, or App Review approval was produced in this workspace. Follow the checks below before submitting.

## Release prerequisites

- An Expo account/project and an active Apple Developer Program membership, with permission to manage this app in App Store Connect.
- A final bundle identifier registered to your Apple team. `com.aadityamitra.voluforge` is provisional, not proof of ownership. Confirm or replace it before the first upload; use the same identifier in Expo and App Store Connect.
- A production Supabase project with the supplied migrations and server functions deployed, real organization membership configured, and authorization tested with separate student and nonprofit accounts.
- Public privacy-policy and support pages owned by you. Add the actual URLs to the app and store listing. No support address or privacy URL has been invented for this project.
- A completed production-build and physical-device test pass. Resolve every failed or untested critical check below before review.

Apple currently requires uploads to use Xcode 26 or later and the iOS 26 SDK or later. Confirm the actual EAS image/toolchain in the build log; a compatible JavaScript dependency graph alone is insufficient. [Apple upload requirements](https://developer.apple.com/news/upcoming-requirements/?id=02032026a)

## Build and signing

Run from the mobile project directory. Use the lockfile's dependencies:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm preflight
npx expo-doctor
pnpm export:ios
npx eas-cli@latest login
npx eas-cli@latest init
```

`eas init` associates the local app with your Expo project. Review its project-ID changes. Confirm the final app name, bundle identifier, version, icon, supported devices, and URL scheme in app configuration. Review `eas.json`: the production profile must use store distribution and the production environment, with a valid iOS build number. Let EAS manage distribution credentials or supply your team's existing credentials through its supported credential workflow. Keep signing materials out of Git.

Set these values in the Expo project's **production** environment before building:

| Variable | Value supplied by the owner |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Production Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anonymous client key for that project |
| `EXPO_PUBLIC_PRIVACY_URL` | Public privacy-policy URL |
| `EXPO_PUBLIC_SUPPORT_URL` | Working public support page |
| `EXPO_PUBLIC_TERMS_URL` | Public terms page |

A local `.env` is not automatically cloud-build configuration. All public-prefixed values are embedded in the app; service-role keys and other server credentials must stay on the server. `pnpm preflight` checks release configuration but does not establish that URLs work or backend policies are correct. [EAS environment configuration](https://docs.expo.dev/eas/environment-variables/), [Expo client variables](https://docs.expo.dev/guides/environment-variables/)

```sh
npx eas-cli@latest build --platform ios --profile production
```

After the build succeeds, inspect its selected SDK/Xcode image, warnings, entitlements, privacy-manifest aggregation, and archive status. Download and retain the build record. This cloud path does not require a local Xcode installation. [EAS build setup](https://docs.expo.dev/build/setup/), [EAS build infrastructure](https://docs.expo.dev/build-reference/infrastructure/)

```sh
npx eas-cli@latest submit --platform ios --profile production
```

Select the exact tested production build. Configure your real App Store Connect app ID if needed. EAS Submit uploads the archive to App Store Connect; it does not release the app publicly. Complete processing and TestFlight testing, then select that build and submit it for App Review in App Store Connect. [Expo iOS submission](https://docs.expo.dev/submit/ios/), [TestFlight distribution](https://docs.expo.dev/submit/testflight/)

## Listing copy — draft

**Name:** VoluForge  
**Subtitle:** Make your time matter  
**Suggested category:** Lifestyle; consider Education as a secondary category.  
**Keywords:** volunteer,student,service,community,nonprofit,hours,impact  
**Promotional text:** Find a cause you care about, turn up for your community, and keep your volunteering in one place.

**Description:**

VoluForge helps students turn their time and talents into community service.

Explore volunteering opportunities, save the ones that interest you, and see the details before applying. Keep track of your applications, record completed service, and follow the progress of your submitted hours.

Your impact deserves a clear record. VoluForge separates hours awaiting review from approved hours, helping you understand what has been submitted and what an organization has verified.

Find your next way to help. Make your time matter.

Review this copy against the final production build. Do not advertise partner coverage, verified organizations, guaranteed school acceptance, AI tools, or functionality absent from the shipped app. Demo organizations and demonstration hours are illustrative and are not evidence of real service.

**Owner must supply:** support URL, privacy-policy URL, copyright holder, App Review contact, review credentials, distribution territories, and a completed age-rating questionnaire. Do not infer the App Store age rating from the intended high-school audience.

## Screenshots and reviewer access

Capture the real native release build using fictional review accounts. Recommended sequence: home, discovery, opportunity detail, application status, service log, and approved-hours record. The supplied inspiration images and browser previews are not App Store screenshots. Use accepted display dimensions; Apple accepts one to ten screenshots per set, with no transparency. Confirm current device-size requirements in App Store Connect rather than stretching screenshots. [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)

Give App Review a functioning review account, exact navigation instructions, and an available backend. Explain nonprofit verification and provide a reviewer account for each role needed to demonstrate it. Disclose the optional demo explicitly; reviewers must be able to reach the actual connected workflow. Supply contact details in App Store Connect, not in a public source file. [Apple review preparation](https://developer.apple.com/app-store/review/)

## Privacy and account controls

The production App Privacy questionnaire must reflect both your application and its service providers. A public privacy-policy URL is required, and the policy must be reachable inside the app. State the real operator, what is collected, why, who receives it, retention, deletion, and a working contact method. The final account owner must approve those factual disclosures. [Apple privacy management](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)

The current data models and client identify these flows:

| App information | Handling to verify in production |
| --- | --- |
| Name, email, account ID | Supabase authentication and identity-linked profile data |
| School, biography, skills, causes, target hours | Student profile data |
| Saved opportunities, application statement and availability | Personal activity and application data |
| Service date, minutes, notes, proof image/PDF | Service submissions and private Supabase Storage evidence associated with the student and reviewing organization |
| Review status, reviewer name, notes and timestamp | Organization decisions and service-record data |
| Authentication session | Native SecureStore; tab-scoped sessionStorage in the web preview |

Evidence is uploaded to the private `vf-proofs` bucket; reviewers open time-limited signed URLs. Include photos and documents in the collection audit. Opportunity coordinates describe event locations, not the student's current location. Audit backend/hosting logs and all SDKs as well. With connected accounts, do not select “Data Not Collected.” Evaluate Contact Info, Identifiers, and User Content using Apple's definitions; decide purpose, identity linkage, and tracking separately for each category. Reassess location, diagnostics, analytics, and advertising if collected by the final build or providers. [Apple data-type definitions](https://developer.apple.com/app-store/app-privacy-details/)

Account deletion is backed by `supabase/functions/delete-account/index.ts`. Deploy it before enabling live sign-up. It validates the user's session, freezes account writes, removes private evidence files, then deletes the authentication account and cascading personal records. Anonymized operational audit events and organization-owned opportunities remain; existing exported copies cannot be recalled. Disclose this retention accurately. If deletion fails partway, the frozen account needs a successful retry. Verify removal with a disposable real account; signing out or resetting demo data is insufficient. [Apple account deletion guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app/)

Before allowing external organizations to publish content, establish the reporting, moderation, blocking, and contact mechanisms appropriate to the shipped user-generated content. Review age-related controls for the actual audience and regions. Complete export-compliance questions based on the final app's encryption use. [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## Physical-device / TestFlight acceptance checklist

- [ ] Cold launch, onboarding, and every tab work on the smallest supported iPhone and a large iPhone; safe areas and the keyboard never cover actions.
- [ ] VoiceOver can identify controls, text remains legible with larger type, and important state is conveyed beyond color.
- [ ] Sign-up, email verification, sign-in, recovery, expired sessions, sign-out, and relaunch work against production-equivalent authentication settings.
- [ ] Discovery, search, filters, saving, detail navigation, maps/directions, and sharing behave correctly with empty results and failed requests.
- [ ] Apply once; reject duplicates; prevent a student from reading another student's private application or changing review outcomes.
- [ ] A nonprofit reviewer can access only its own organization's submissions. A student can neither self-approve hours nor become a reviewer by changing client data.
- [ ] Log service, attach private evidence, submit it, review from a different authorized account, request changes, and resubmit the returned entry. Approved totals must exclude pending/rejected entries.
- [ ] Offline, timeout, background/resume, invalid inputs, and rapid repeated taps preserve data and surface actionable feedback.
- [ ] Demo data never contributes to connected verified totals or exported real service records.
- [ ] Exported/shared records identify their status correctly; canceling native share sheets is harmless.
- [ ] Privacy/support links open real public pages; deletion removes a disposable real account, evidence, and personal records. Simulate a failed deletion and confirm retry remains reachable after relaunch.
- [ ] No production crash, signing, permission, privacy-manifest, asset, or App Store validation warnings remain unresolved.

Record the actual device, OS, build number, account roles, test date, and outcome for each test. The final release gate is a signed build with these checks completed, a configured production backend, and complete owner-supplied store information.
