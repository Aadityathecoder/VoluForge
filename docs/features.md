# VoluForge Feature Specifications

This document defines the behavior planned for the VoluForge MVP. It is a product specification, not a claim that every feature is already implemented.

## System-wide rules

- Student, nonprofit staff, and administrator permissions must be enforced by the server and database, not only by hidden interface controls.
- The system must store important timestamps in a consistent format and display them in a user-readable local time.
- Only approved service entries contribute to verified totals or exports.
- Sensitive actions—organization approval, account suspension, service approval, and corrections to approved service—must identify the actor and time.
- The MVP should collect only information needed to operate the service workflow, especially because its primary student users may be minors.
- Prototype or demo data must be visibly labeled and must never be mixed into a verified service record.

## F01 — Role-based accounts

**Feature ID:** F01

**Name:** Role-based account access

**User goal:** A student or nonprofit representative wants to create a secure account and enter the part of VoluForge appropriate to their role.

### Expected system behavior

1. The user chooses either **Student** or **Nonprofit staff** during registration.
2. The user enters the required account information and accepts the applicable terms and privacy notice.
3. The app validates the submission, creates the account, and sends an email-verification message.
4. After verification and sign-in, the app loads the correct role-based home screen.
5. A signed-in user can sign out and can request a password-reset link if access is lost.
6. Administrator roles are assigned through a controlled internal process; a public user cannot self-register as an administrator.

### Error conditions and special cases

- Reject an email already attached to an account and direct the user to sign in or reset the password.
- Reject invalid, expired, or already-used verification and password-reset links with a safe retry path.
- Do not expose whether an arbitrary email address has an account in password-reset responses.
- Block role-restricted pages and actions when the session is absent, expired, or has the wrong role.
- Changing a user's role must require an authorized administrator and create an audit record.

### Acceptance criteria

- A student and nonprofit staff member can each register, verify, sign in, sign out, and reach distinct authorized areas.
- A student cannot access nonprofit or administrator actions by changing a URL or request payload.

## F02 — Profiles and organization verification

**Feature ID:** F02

**Name:** Student profiles and verified nonprofit profiles

**User goal:** A student wants opportunities relevant to their skills, while a nonprofit wants to establish a trustworthy organizational identity.

### Expected system behavior

1. A student can add and update a display name, school or community affiliation if desired, skills, causes of interest, general availability, and participation-mode preference.
2. A nonprofit staff member can create an organization profile containing its name, mission, service area, primary contact, location, and optional website.
3. A new nonprofit profile receives a **Pending verification** status.
4. An administrator reviews the submitted organization information and records an approval or rejection with a reason.
5. Only staff linked to an approved organization can publish opportunities.
6. Profile edits are saved and used by discovery filters and application review without making private account data public.

### Error conditions and special cases

- Required fields, malformed contact details, and unsupported values must be rejected with field-level messages.
- A user cannot add themselves as staff of an existing organization without an authorized invitation or administrator action.
- If an approved organization changes identity-critical information, the system may return it to **Pending verification**.
- A rejected organization can correct its information and resubmit; the previous decision remains in the audit trail.
- Suspending an organization prevents new publishing and verification actions without deleting historical records.

### Acceptance criteria

- Student skill/cause data persists after sign-out.
- An unverified nonprofit cannot publish, while an approved nonprofit can.

## F03 — Opportunity publishing

**Feature ID:** F03

**Name:** Structured opportunity publishing

**User goal:** Verified nonprofit staff want to describe a real service need clearly enough for qualified students to understand and apply.

### Expected system behavior

1. Authorized nonprofit staff choose **New opportunity**.
2. The app collects, at minimum, a title, description and expected work, cause, desired skills, remote/in-person mode, location when relevant, schedule or time commitment, capacity, eligibility or age limits, proof requirements, and safety/contact information.
3. The nonprofit saves the opportunity as a draft, previews it, and publishes it when required fields are complete.
4. A published, open opportunity appears in student discovery.
5. Authorized staff can edit future details, close applications, or archive the opportunity.
6. The app preserves the opportunity identity and its related application/service history after closure.

### Error conditions and special cases

- Only approved nonprofit staff can create or publish opportunities for their organization.
- Do not publish missing required fields, invalid dates, nonpositive capacity, or incompatible location/mode data.
- A closed, filled, expired, or archived opportunity cannot accept new applications.
- Material edits after students apply must be clearly identified; accepted students retain access to the details under which they were accepted.
- Deleting an opportunity with applications or service records must be replaced by archival rather than destructive deletion.

### Acceptance criteria

- A verified nonprofit can move an opportunity from draft to published to closed.
- Only published and open opportunities appear to students.

## F04 — Opportunity discovery

**Feature ID:** F04

**Name:** Search and deterministic filtering

**User goal:** A student wants to find open service opportunities that fit their skills, interests, and ability to participate.

### Expected system behavior

1. The student opens the opportunity list and sees currently published, open opportunities.
2. The student can search by keyword and filter by skill, cause, and remote/in-person mode.
3. The app updates the result set and shows which filters are active.
4. The student can clear individual filters or reset all filters.
5. Selecting a result opens a detail page with the full requirements, nonprofit identity, status, and application action.
6. Sorting and filtering are rule-based for the MVP; the app does not claim to use an AI compatibility score.

### Error conditions and special cases

- If no opportunities match, show a clear empty state and a way to broaden the search.
- If loading fails, preserve the selected filters and offer a retry.
- Do not display draft, archived, suspended-organization, or otherwise unauthorized opportunities.
- If an opportunity closes while its detail page is open, disable submission and explain that applications are closed.

### Acceptance criteria

- Each supported filter changes the returned set correctly and can be cleared.
- A student cannot discover a draft opportunity by guessing its URL.

## F05 — Applications and decisions

**Feature ID:** F05

**Name:** Student applications and nonprofit decisions

**User goal:** A student wants to request a role, and nonprofit staff want to accept appropriate applicants without exceeding capacity.

### Expected system behavior

1. A signed-in student opens an eligible opportunity and selects **Apply**.
2. The app shows the student's relevant profile information and collects a short interest statement and availability confirmation.
3. The student reviews and submits the application.
4. The application receives a **Submitted** status and appears in both the student and nonprofit views.
5. Authorized nonprofit staff review the application and select **Accept** or **Decline**.
6. The app records the decision, actor, and timestamp and updates the student's status.
7. A student may withdraw a submitted application before service is recorded.

### Error conditions and special cases

- Prevent duplicate active applications by the same student to the same opportunity.
- Prevent applications to closed, expired, full, or ineligible opportunities.
- Only staff linked to the owning nonprofit can view private application data or make a decision.
- Acceptance must fail safely if another decision fills the final available position first.
- Declining or withdrawing an application does not delete its audit history.

### Acceptance criteria

- The same application status is shown to the student and nonprofit after each decision.
- Only accepted students can submit service against the opportunity.

## F06 — Service time and proof

**Feature ID:** F06

**Name:** Timer-based and manual service logging

**User goal:** An accepted student wants to document when they volunteered, what they did, and any proof required by the nonprofit.

### Expected system behavior

1. The student opens an accepted opportunity and chooses **Start timer** or **Add time manually**.
2. For a timer session, the system stores the start time and prevents the student from starting a second simultaneous session.
3. When the student stops the timer, the system calculates the duration and asks for a short work note and any required proof.
4. For a manual entry, the student enters the service date, start/end times or duration, a reason for manual entry, a work note, and required proof.
5. The student reviews and submits the entry.
6. The entry receives a **Pending verification** status and does not yet count toward verified totals.

### Error conditions and special cases

- Reject negative, zero, impossible, overlapping, or unreasonably long durations and future service times.
- If the browser closes during an active timer, the server-stored start state must be recoverable when the student returns.
- If required proof is missing, too large, or of an unsupported type, keep the draft and explain how to correct it.
- Prevent a student from logging service for an opportunity to which they were not accepted.
- Detect likely duplicate submissions and require confirmation before saving.

### Acceptance criteria

- Timer and manual paths both create a persisted pending entry.
- Pending time remains excluded from the student's verified total.

## F07 — Nonprofit verification

**Feature ID:** F07

**Name:** Review and verification of submitted service

**User goal:** Nonprofit staff want to confirm that a student's submitted service is accurate before it becomes an official record.

### Expected system behavior

1. Authorized nonprofit staff open the pending-service queue for an opportunity owned by their organization.
2. The app shows the student, date, duration, work note, proof, and any duplicate or validation warnings.
3. The reviewer chooses **Approve**, **Needs changes**, or **Reject** and adds a reason when the entry is not approved.
4. Approval records the reviewer identity, organization, decision time, and approved duration.
5. An entry marked **Needs changes** returns to the student for editing and resubmission.
6. An approved entry is locked from ordinary editing and begins contributing to the student's verified total.
7. Corrections to an approved entry require an authorized amendment that preserves the original value and reason.

### Error conditions and special cases

- A student can never approve their own entry, even if they also belong to an organization.
- Nonprofit staff can review entries only for opportunities owned by their organization.
- The app must prevent double approval and handle two reviewers acting on the same entry safely.
- Revoked staff access immediately prevents new decisions but does not erase prior signed actions.
- Unavailable proof files must block approval until the reviewer can inspect the required evidence.

### Acceptance criteria

- Approval changes both entry status and verified totals exactly once.
- Every decision has a reviewer, organization, timestamp, and durable audit record.

## F08 — Verified record and export

**Feature ID:** F08

**Name:** Student dashboard and downloadable verification record

**User goal:** A student wants a clear history of their service and a portable document showing what nonprofits have verified.

### Expected system behavior

1. The student dashboard separates applications, pending service, entries needing changes, rejected entries, and approved service.
2. Summary totals use approved entries only.
3. The student chooses a date range and requests an export.
4. The app generates a downloadable record containing the student's name, covered date range, each approved service entry, nonprofit and opportunity names, approved hours, reviewer name/title, verification timestamp, and total approved hours.
5. The export includes a record identifier and a statement that the listed entries were approved in VoluForge.
6. The app clearly distinguishes this approval record from a cryptographic or third-party electronic signature.

### Error conditions and special cases

- If no approved entries exist for the date range, explain that there is nothing to export rather than generating a blank record.
- Pending, rejected, unverified, demo, or deleted test data must never appear in the approved total.
- If export generation fails, do not change any service data and allow the student to retry.
- An amended approval must appear with its current approved value while retaining the previous value in the audit history.
- Students can view and export only their own records.

### Acceptance criteria

- Dashboard totals equal the sum of approved entries.
- The exported entries and total match the stored approved data for the selected date range.

## F09 — Minimal administration and audit

**Feature ID:** F09

**Name:** Pilot administration and audit trail

**User goal:** An authorized platform operator wants to verify legitimate organizations, respond to account problems, and investigate sensitive actions without altering data invisibly.

### Expected system behavior

1. An administrator signs in through an account whose role was assigned internally.
2. The administrator can review pending nonprofit profiles and approve or reject them with a reason.
3. The administrator can look up a user or organization and suspend or restore access.
4. The administrator can inspect audit records for organization decisions, account-status changes, application decisions, service verification, and approved-entry amendments.
5. Each administrator action records the actor, target, action, reason when required, and timestamp.
6. The interface exposes only the minimum controls needed to operate the pilot.

### Error conditions and special cases

- Public registration can never create an administrator.
- Non-administrators receive no administrator data, even if they guess a route or API request.
- An administrator cannot erase audit history through the standard interface.
- Suspending an account preserves historical applications, service entries, and verification records.
- High-impact actions require confirmation and fail safely if the target changed after the page loaded.

### Acceptance criteria

- An administrator can complete the nonprofit-verification flow needed by F02.
- Every supported administrative mutation produces a searchable audit record.
