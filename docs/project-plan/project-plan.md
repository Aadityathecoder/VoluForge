# VoluForge Fall 2026 Project Plan

## Delivery strategy

Build one vertical slice in dependency order. Every task ends in a verifiable artifact: a migration that can be queried, a protected route with an authorization test, or a browser flow with persisted results. Feature work ends November 29 so the remaining time can be used for a reliable live demo.

## Milestones

| Milestone | Target | Result |
| --- | --- | --- |
| M1 — Foundation and access | Oct 11 | Deployable app, confirmed Supabase project, schema v1, seeded roles, and enforced authentication |
| M2 — Opportunity-to-acceptance | Nov 1 | Approved nonprofit can publish; student can discover/apply; nonprofit can accept |
| M3 — Verified service loop | Nov 22 | Student submits service; nonprofit verifies; approved total and export agree |
| M4 — Stable live demo | Dec 10 | Production deployment, deterministic demo data, test evidence, fallback plan, and rehearsed demo |

## Task plan

| ID | Task and subtasks | Effort | Depends on | Target | MVP features | Definition of done |
| --- | --- | ---: | --- | --- | --- | --- |
| T01 | Audit existing prototype; map reusable routes/components; archive misleading demo paths | 2h | — | Sep 30 | F01–F09 | Inventory is recorded and the core route map is agreed |
| T02 | Confirm tools/accounts: Node/npm, Supabase project, Vercel project, environment variables, GitHub tracking | 2h | — | Oct 2 | Platform | Local build and preview deployment both start without secrets in Git |
| T03 | Design schema and state transitions; write migration for profiles, organizations, opportunities, applications, service entries, decisions, and audit events | 4h | T01–T02 | Oct 7 | F01–F09 | Migration succeeds from a clean database and constraints reject invalid state |
| T04 | Implement Auth/session helpers, role redirects, seed accounts, and baseline row-level-security policies | 4h | T03 | Oct 11 | F01, F09 | Student/nonprofit/admin reach only allowed areas; direct forbidden requests fail |
| T05 | Build organization profile plus minimal admin approve/reject flow | 3h | T04 | Oct 16 | F02, F09 | Pending nonprofit cannot publish; approval is persisted and audited |
| T06 | Build opportunity create/edit/publish/close form and server validation | 4h | T05 | Oct 22 | F03 | Approved nonprofit publishes one valid opportunity and cannot edit another organization's data |
| T07 | Build student opportunity list/detail with keyword plus mode filter | 3h | T06 | Oct 25 | F04 | Only open authorized opportunities appear; filters and empty/error states work |
| T08 | Build application submission, duplicate prevention, applicant list, and accept/decline action | 5h | T07 | Nov 1 | F05 | Status agrees in both roles and accepted applicant becomes service-eligible |
| T09 | Build manual service entry with validation, notes, duration, and proof metadata; add live timer only if on schedule | 4h | T08 | Nov 8 | F06 | Accepted student creates a pending entry; invalid and unauthorized entries fail |
| T10 | Build nonprofit service queue and approve/needs-changes/reject transition with audit event | 4h | T09 | Nov 15 | F07, F09 | Decision is ownership-checked, durable, and applied exactly once |
| T11 | Build student status dashboard and approved-hours-only total | 3h | T10 | Nov 18 | F08 | UI total exactly equals approved database entries and excludes all other states |
| T12 | Build date-range verification record and printable/PDF download | 3h | T11 | Nov 22 | F08 | Export lines and total match a server query for the signed-in student |
| T13 | Core-loop integration tests, authorization checks, accessibility/responsive pass, and bug triage | 4h | T05–T12 | Nov 29 | F01–F09 | Acceptance script passes twice from reset seed data; no open critical defects |
| T14 | Production deployment, environment and domain configuration, monitoring/log check, rollback tag | 2h | T13 | Dec 3 | Platform | Tagged build is live; health check and full loop pass in production |
| T15 | Prepare demo seed/reset, screenshots or backup video, presentation script, teacher access, and submission package | 3h | T14 | Dec 7 | Demo | Demo can be reset and completed in under seven minutes with a fallback |
| T16 | Rehearse twice, fix demo-blocking defects only, freeze release, and submit | 2h | T15 | Dec 10 | Demo | Two clean rehearsals and final links/files are submitted before deadline |

Estimated task work is 54 hours. Only about 39 hours of pre-cutoff implementation is safely plannable, so T01–T12 must remain thin. T13–T16 use the protected integration/demo capacity. The live timer, file uploads, and visual refinement are explicitly conditional.

## Weekly schedule

| Week | Planned outcome | Hours cap |
| --- | --- | ---: |
| Sep 28–Oct 4 | T01–T02 | 6 |
| Oct 5–11 | T03–T04, M1 | 7 |
| Oct 12–18 | T05 and start T06 | 5 |
| Oct 19–25 | Finish T06–T07 | 6 |
| Oct 26–Nov 1 | T08, M2 | 6 |
| Nov 2–8 | T09 | 6 |
| Nov 9–15 | T10 | 6 |
| Nov 16–22 | T11–T12, M3 | 6 |
| Nov 23–29 | T13 and feature freeze | 2–4 |
| Nov 30–Dec 6 | T14–T15 | 6 |
| Dec 7–11 | T16, M4, submission | 4 |

## AI-friendly development protocol

For each task, give AI only the relevant feature rules, schema/types, current files, and definition of done. Ask for one bounded change plus tests. Review the diff, run type/build checks, execute the task-specific acceptance test, and commit only after the result works. Database work is validated with migrations and SQL assertions before UI work depends on it; API/route work is validated with authorized and unauthorized cases before screens are connected.

## Risk and scope response

| Trigger | Response |
| --- | --- |
| Supabase setup takes over 4 hours | Use a fresh project and minimal schema; do not rescue obsolete prototype data |
| One task exceeds estimate by 50% | Split it, update velocity, and remove its optional branch |
| M2 slips past Nov 1 | Remove live timer and proof upload; preserve manual logged service |
| M3 slips past Nov 22 | Use printable HTML instead of styled PDF and freeze all UI polish |
| Production instability after Dec 3 | Demo the tagged local build and use captured evidence as fallback |
| New feature request | Put it in post-MVP backlog unless it fixes the core acceptance loop |
