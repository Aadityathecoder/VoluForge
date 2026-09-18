# VoluForge MVP

The MVP will allow high-school student volunteers to find skills-aligned nonprofit opportunities, apply, record their completed service, and obtain a downloadable verified service record by using the platform's profile, discovery, application, time-logging, verification, and export features.

The MVP will allow nonprofit staff to recruit suitable student volunteers and validate their work by using the platform's organization profile, opportunity publishing, application review, and service-verification features.

The MVP will allow platform administrators to keep the pilot trustworthy by using limited nonprofit-verification, account-moderation, and audit-log features.

## Product goal

VoluForge's first release must prove one closed loop:

1. A legitimate nonprofit posts a structured opportunity.
2. A student finds and applies to the opportunity.
3. The nonprofit accepts the student.
4. The student records completed service and submits any required proof.
5. The nonprofit verifies the submission.
6. The student downloads a record containing only verified service.

The MVP is viable only when this loop works with persisted data and enforced role permissions. Static mock data alone does not satisfy the MVP.

## Features included in the MVP

| ID | Short name | MVP functionality |
| --- | --- | --- |
| **F01** | Role-based accounts | Students and nonprofit staff can register, verify their email, sign in, recover access, and reach the correct role-based experience. |
| **F02** | Profiles and organization verification | Students can record skills and causes; nonprofits can create organization profiles; administrators can approve an organization before it publishes opportunities. |
| **F03** | Opportunity publishing | Verified nonprofit staff can draft, publish, edit, close, and view structured volunteer opportunities. |
| **F04** | Opportunity discovery | Students can browse and deterministically filter open opportunities by keyword, skill, cause, and participation mode. |
| **F05** | Applications and decisions | Students can apply once to an opportunity, and nonprofit staff can accept or decline applications for opportunities owned by their organization. |
| **F06** | Service time and proof | Accepted students can use a timer or a justified manual entry to submit service time, notes, and required proof. |
| **F07** | Nonprofit verification | Authorized nonprofit staff can approve, reject, or return submitted service entries for changes, with reviewer and timestamp data recorded. |
| **F08** | Verified record and export | Students can view application/service status, see totals based only on approved entries, and download a verification record for a selected date range. |
| **F09** | Minimal administration and audit | Authorized administrators can review nonprofit profiles, suspend or restore accounts, and inspect an audit trail of sensitive actions. |

Detailed behavior and edge cases are defined in [features.md](features.md). The required journeys across these features are defined in [user-flows.md](user-flows.md).

## Explicitly excluded from the MVP

The following items are **not required for the first usable release** and must not block MVP completion:

- A school staff portal, school service-hour requirements, advisor approvals, or school information-system integrations
- Native iOS or Android applications
- AI matching, recommendation rankings, or automatic student selection
- AI conversion of community needs into full project kits, even though an early experiment exists in the repository
- Student project squads, team recruiting, mentor matching, or collaborative task boards
- In-app direct messaging, social feeds, public comments, or community forums
- QR-code, GPS, geofenced, biometric, or kiosk check-in
- Calendar synchronization, map/radius search, or route planning
- Background-check integrations or automated legal/safety clearance
- Cryptographic or third-party electronic signatures; the MVP export uses recorded approver identity and verification timestamps
- Advanced outcome analytics, regional impact maps, nonprofit network dashboards, or custom report builders
- Skill testing, skill endorsements, badges, points, leaderboards, streaks, or other gamification
- Public portfolios, résumé generators, college-application generators, or social sharing
- Blockchain, cryptocurrency, or non-fungible-token credentials
- Donations, payments, subscriptions, or financial transactions
- Multi-language support and white-label deployments

Existing prototype screens outside this scope may remain in the repository, but they are not part of the MVP acceptance criteria unless they are reassigned one of the feature IDs above.

## MVP success boundary

The MVP is ready for a controlled pilot when at least one student and one verified nonprofit can complete the full product goal without database edits or administrator impersonation, unauthorized users cannot approve service, and the exported record agrees with the approved entries stored by the system.
