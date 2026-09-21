# Progress and Velocity Tracker

## Status definitions

- **Backlog:** understood but not scheduled for immediate work
- **Ready:** dependencies satisfied and definition of done is testable
- **In progress:** actively being changed; limit to one development task at a time
- **Blocked:** cannot proceed; record blocker and next action
- **Done:** definition of done verified and code/documentation committed

## Milestone dashboard

| Milestone | Target | Status | Completion evidence |
| --- | --- | --- | --- |
| M1 — Foundation and access | Oct 11 | Not started | — |
| M2 — Opportunity-to-acceptance | Nov 1 | Not started | — |
| M3 — Verified service loop | Nov 22 | Not started | — |
| M4 — Stable live demo | Dec 10 | Not started | — |

## Weekly velocity log

Update every Sunday. Count a task only when its definition of done passes.

| Week ending | Available hours | Actual hours | Estimated hours completed | Velocity | Tasks completed | Blockers/notes | Next adjustment |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| Oct 4 | 6 | — | — | — | — | — | — |
| Oct 11 | 7 | — | — | — | — | — | — |
| Oct 18 | 5 | — | — | — | — | — | — |
| Oct 25 | 6 | — | — | — | — | — | — |
| Nov 1 | 6 | — | — | — | — | — | — |
| Nov 8 | 6 | — | — | — | — | — | — |
| Nov 15 | 6 | — | — | — | — | — | — |
| Nov 22 | 6 | — | — | — | — | — | — |
| Nov 29 | 2–4 | — | — | — | — | — | — |
| Dec 6 | 6 | — | — | — | — | — | — |
| Dec 10 | 4 | — | — | — | — | — | — |

Velocity formula: `estimated hours completed / actual focused hours`.

## Weekly review checklist

- Demonstrate the newest completed slice using persisted data
- Run build/type checks and the relevant authorization cases
- Close only tasks whose definition of done passed
- Record actual focused hours and velocity
- Re-estimate remaining work using the latest three-week average
- Identify the single biggest blocker and its next action
- Confirm the next week's work fits its hour cap
- Remove optional scope if projected work exceeds capacity by more than 10%

## Decision log

| Date | Decision | Reason | Plan impact |
| --- | --- | --- | --- |
| Sep 21 | Use a thin end-to-end vertical slice | Full production depth exceeds semester capacity | Advanced edge cases become post-MVP |
| Sep 21 | Stop feature development Nov 29 | Protect deployment and live-demo time | Final period is stabilization only |
| Sep 21 | Use GitHub Issues as tracker | Keeps tasks, evidence, and code together | Each task maps to T01–T16 |
