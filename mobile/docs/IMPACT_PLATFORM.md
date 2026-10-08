# Expo impact platform

This feature set is implemented in the original React Native / Expo app, preserving its cream, orange, green palette and five bottom tabs. It also appears in the downloadable source copy.

## Student flow

1. Home → Make your matches yours, or You → Your matching preferences. Add skills, interests, city, age, experience, and an availability window. Adjust five matching priorities.
2. Explore shows skill-based opportunities ordered by personal fit. Each card and detail screen explain fit and missing eligibility details. Apply after checking requirements; partners decide acceptance.
3. Activity preserves applications, the service timer, proof attachments, and returned-service revision. Manual logs can include an outcome quantity and evidence in one database transaction. Timed sessions can add outcomes afterward from Impact.
4. Impact separates approved hours, approved concrete results, and pending/rejected outcomes. Both service and outcome must be approved for a result to count. The export contains approved results only, filtered to the selected service-date range.
5. Impact Graph connects volunteers, project skills, nonprofit organizations, accepted projects, and approved outcomes. Tap a node for its neighbors; project nodes can open the opportunity.
6. Community needs groups current unfilled listings by cause/location and lists demanded skills. Index priority is open places + twice urgent places; this measures listed requests, not population-wide need.

## Partner flow

You → Partner workspace is restricted to authorized staff. It connects publishing, applications, capacity, scheduling, organizer briefings, service proof review, independent outcome review, retention counts, and placement proposals. Organizations publish skills, minimum experience, urgency, and a measurable outcome target.

The exact maximum-weight allocation algorithm proposes at most one new placement per applicant and respects remaining capacity. Applicants must have confirmed age, experience, availability, and requested skills. It excludes overlapping accepted sessions visible to the partner. Outside commitments require organizer confirmation. Proposals never auto-accept an application.

The organizer briefing uses the device share sheet. Application/review notes remain the in-app communication channel; no messages are sent automatically.

## Matching and research limits

Matching is an explainable weighted recommendation model tailored to VoluForge. It is not a trained neural model, and there is no external AI service, invented training set, or prediction of a guaranteed placement. Skill overlap, interests, city/remote fit, experience, and partner urgency influence scores; age, capacity, dates, and availability gate eligibility. An incomplete profile does not imply eligibility confirmation.

Research summaries expose only fixed coarse cause cohorts with at least five distinct volunteers whose service is approved. They include approved hours and returning volunteers (service on two or more dates). Sample data is excluded. Location/skill demand can be examined through published listings. No demographic attributes or representative disparity dataset are collected, so demographic disparities and causal effectiveness are not claimed.

## Shared API

The native Open API panel documents the existing project’s Supabase RPC endpoints:

- POST `/rest/v1/rpc/vf_research_summary`, JSON `{}`, project publishable key in `apikey`: coarse anonymous summaries only.
- POST `/rest/v1/rpc/vf_verified_outcomes`, JSON `{}`, publishable key plus the volunteer’s own session bearer token: that volunteer’s approved outcomes attached to approved service.
- Existing `vf_verified_record` returns approved hours for the requested date range. Private proof stays in the private bucket.

Never put a service-role secret in the app. RLS and security-definer workflow checks enforce owner/staff boundaries, and reviewers cannot verify their own results.

## Deployment status, October 5, 2026

`202610050002_impact_platform.sql` was applied successfully to the existing Supabase project `urljfugiaylhrmlyamqf`. Its anonymous research endpoint returned HTTP 200; anonymous private outcome access returned HTTP 401.

`202610050003_mobile_impact.sql` is ready and tested locally, but deployment is awaiting the user’s explicit approval after automatic approval review blocked the hosted change. It adds atomic native resubmission, outcome logging for existing/timed entries, and a read-only native capability check. The app handles the missing upgrade without breaking existing sign-in, service logging, research, publishing, or new manual outcome submission.

No EAS update, signed App Store release, paid build, or GitHub push was performed. The existing Expo Go development app is running from the original project. Its LAN QR needs the phone on the computer’s Wi-Fi/network. The computer and server must stay running. The remote Expo tunnel failed its TLS certificate check; validation was not disabled.

## Validation

19 mobile tests, strict TypeScript, iOS Hermes export, and Expo web export passed. The shared database harness passed all 50 baseline workflow/security checks plus opportunity-detail checks, and dedicated tests for outcome review/isolation/atomicity/cohort suppression and native resubmission. Browser testing used the Expo app at iPhone dimensions to verify persisted preferences, service/outcome resubmission, unchanged approved totals, graph navigation, and needs/research/API screens. Actual phone attachment picking, OS sharing, and background/resume still require a device check.
