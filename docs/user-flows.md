# VoluForge User Flows

These textual flows define the essential MVP journeys. Each step names the actor and references the feature responsible for the behavior.

## UF01 — Student creates an account and profile

**Starting point:** A new student opens VoluForge while signed out.

**Relevant features:** F01, F02

1. **Student:** Selects **Create account**, then chooses **Student**. [F01]
2. **App:** Requests the required account details and displays the terms/privacy notice. [F01]
3. **Student:** Submits the form and follows the email-verification link. [F01]
4. **App:** Confirms the account and opens student onboarding. [F01]
5. **Student:** Adds skills, causes, availability, and optional school/community information. [F02]
6. **App:** Validates and saves the profile, then opens the student dashboard. [F02]

**Final outcome:** The student has a verified account, a persisted profile, and access only to student functionality.

**Exception path:** If verification expires or profile validation fails, the app explains the problem, preserves safe form data where possible, and provides a resend or correction path. [F01, F02]

## UF02 — Nonprofit registers and becomes verified

**Starting point:** A nonprofit representative opens VoluForge while signed out.

**Relevant features:** F01, F02, F09

1. **Nonprofit representative:** Creates an account and chooses **Nonprofit staff**. [F01]
2. **App:** Verifies the representative's email and opens organization onboarding. [F01]
3. **Nonprofit representative:** Enters organization identity, mission, service area, contact, location, and optional website information. [F02]
4. **App:** Saves the profile as **Pending verification** and prevents opportunity publishing. [F02]
5. **Administrator:** Opens the pending-organization queue and reviews the submission. [F09]
6. **Administrator:** Approves the organization or rejects it with a reason. [F02, F09]
7. **App:** Records the decision and updates the nonprofit view. [F02, F09]

**Final outcome:** An approved nonprofit can publish opportunities; a rejected nonprofit receives a reason and can correct and resubmit its profile.

**Exception path:** If an organization already exists, the app directs the representative to an authorized staff-invitation or support process instead of creating a duplicate. [F02]

## UF03 — Nonprofit publishes an opportunity

**Starting point:** Verified nonprofit staff are signed in on the nonprofit dashboard.

**Relevant features:** F03

1. **Nonprofit staff:** Selects **New opportunity**. [F03]
2. **App:** Displays the structured opportunity form. [F03]
3. **Nonprofit staff:** Enters the work, cause, desired skills, participation mode/location, schedule, capacity, eligibility, proof, safety, and contact details. [F03]
4. **Nonprofit staff:** Saves a draft and previews it. [F03]
5. **App:** Validates all required fields and identifies anything that blocks publication. [F03]
6. **Nonprofit staff:** Corrects any errors and selects **Publish**. [F03]
7. **App:** Marks the opportunity **Published/Open** and includes it in student discovery. [F03, F04]

**Final outcome:** Students can find and view a complete, open opportunity.

**Exception path:** If the organization is unverified or suspended, the app keeps the draft but refuses publication and explains the account restriction. [F02, F03]

## UF04 — Student discovers and applies to an opportunity

**Starting point:** A signed-in student opens the opportunity list.

**Relevant features:** F04, F05

1. **App:** Displays published, open opportunities. [F04]
2. **Student:** Searches by keyword and filters by skill, cause, or remote/in-person mode. [F04]
3. **App:** Updates the results and shows the active filters. [F04]
4. **Student:** Opens an opportunity and reviews its nonprofit, work, schedule, eligibility, safety, and proof requirements. [F04]
5. **Student:** Selects **Apply**, confirms profile information and availability, and writes a short interest statement. [F05]
6. **Student:** Reviews and submits the application. [F05]
7. **App:** Creates one **Submitted** application and displays it on the student's dashboard and the nonprofit's applicant list. [F05]

**Final outcome:** The student has a trackable application awaiting a nonprofit decision.

**Exception path:** If the opportunity closes, fills, or becomes ineligible before submission, the app does not create an application and explains why. [F04, F05]

## UF05 — Nonprofit reviews an application

**Starting point:** Authorized nonprofit staff open applicants for an opportunity owned by their organization.

**Relevant features:** F05

1. **App:** Displays submitted applications and current remaining capacity. [F05]
2. **Nonprofit staff:** Opens an application and reviews the student's relevant profile, statement, and availability. [F05]
3. **Nonprofit staff:** Selects **Accept** or **Decline**. [F05]
4. **App:** Rechecks ownership, application state, and capacity before saving the decision. [F05]
5. **App:** Records the actor and timestamp and updates the status visible to both parties. [F05]

**Final outcome:** An accepted student becomes eligible to log service for the opportunity; a declined student sees the final status.

**Exception path:** If another reviewer filled the last position first, the app refuses the stale acceptance and asks the reviewer to refresh. [F05]

## UF06 — Student records completed service

**Starting point:** An accepted student opens the opportunity from the dashboard.

**Relevant features:** F06

### Timer path

1. **Student:** Selects **Start timer**. [F06]
2. **App:** Stores the start time and shows an active session. [F06]
3. **Student:** Completes the work and selects **Stop timer**. [F06]
4. **App:** Calculates the duration and requests a work note and any required proof. [F06]
5. **Student:** Reviews and submits the entry. [F06]

### Manual path

1. **Student:** Selects **Add time manually**. [F06]
2. **Student:** Enters the date, time/duration, manual-entry reason, work note, and required proof. [F06]
3. **App:** Validates the entry for impossible, overlapping, future, or duplicate time. [F06]
4. **Student:** Corrects any errors and submits. [F06]

**Final outcome:** The app stores one **Pending verification** entry that is visible to the student and owning nonprofit but excluded from verified totals.

**Exception path:** If a proof upload fails, the app preserves the unsent entry so the student can replace the file and retry. [F06]

## UF07 — Nonprofit verifies service

**Starting point:** Authorized nonprofit staff open the pending-service queue for their opportunity.

**Relevant features:** F07

1. **App:** Displays the student, date, submitted duration, work note, proof, and validation warnings. [F07]
2. **Nonprofit staff:** Reviews the entry and supporting evidence. [F07]
3. **Nonprofit staff:** Chooses **Approve**, **Needs changes**, or **Reject** and supplies a reason when needed. [F07]
4. **App:** Rechecks the reviewer's organization access and current entry state. [F07]
5. **App:** Saves the decision, reviewer, organization, timestamp, reason, and approved duration. [F07]
6. **App:** If approved, locks ordinary edits and updates the student's verified total exactly once. If changes are needed, it returns the entry to the student. [F07, F08]

**Final outcome:** The service is either verified and counted, returned for correction, or rejected with a recorded reason.

**Exception path:** If a second reviewer already acted, the app shows the current decision and does not apply another update. [F07]

## UF08 — Student downloads a verified service record

**Starting point:** A signed-in student has at least one approved service entry.

**Relevant features:** F08

1. **Student:** Opens **Verified service** on the dashboard. [F08]
2. **App:** Displays approved entries and a total that excludes pending or rejected time. [F08]
3. **Student:** Selects a date range and chooses **Download record**. [F08]
4. **App:** Requeries the student's approved entries for the range and generates the record. [F08]
5. **App:** Includes entry details, nonprofit and reviewer information, verification timestamps, a record identifier, and the approved total. [F08]
6. **Student:** Downloads the generated file. [F08]

**Final outcome:** The student receives a portable record that agrees with the platform's approved service data.

**Exception path:** If there are no approved entries in the selected range or generation fails, the app creates no misleading blank record and offers a clear correction or retry path. [F08]

## UF09 — Administrator suspends an account and reviews the audit trail

**Starting point:** An authorized administrator is signed in to the minimal administration area.

**Relevant features:** F09

1. **Administrator:** Searches for a user or organization. [F09]
2. **App:** Displays the account's current status and permitted support actions. [F09]
3. **Administrator:** Chooses **Suspend**, enters a reason, and confirms. [F09]
4. **App:** Rechecks administrator authorization, changes the account status, and records the action. [F09]
5. **Administrator:** Opens the audit view and confirms the actor, target, reason, and timestamp. [F09]

**Final outcome:** The account cannot perform new protected actions, historical records remain intact, and the intervention is auditable.

**Exception path:** If the target changed after the page loaded or the administrator lost permission, the app makes no change and requires a refresh. [F09]
