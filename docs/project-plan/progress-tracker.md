# Progress and semester tracker — updated October 11, 2026

Primary tracker: [GitHub Issues](https://github.com/Aadityathecoder/VoluForge/issues). Dates below are the existing provisional semester plan, ending December 11. “Implemented prototype” means code exists; it does not mean hosted acceptance or release is complete.

| ID / issue | Status | Remaining work / completion evidence | Target |
| --- | --- | --- | --- |
| [T01](https://github.com/Aadityathecoder/VoluForge/issues/1) Audit | Done | [Inventory and core route map](prototype-inventory.md) recorded. Legacy experiments identified separately. | Oct 11 |
| [T02](https://github.com/Aadityathecoder/VoluForge/issues/2) Platforms | In progress | Local production build and hosted API connectivity pass; preview/production deployment still needed. | Oct 18 |
| [T03](https://github.com/Aadityathecoder/VoluForge/issues/3) Schema | Done | Clean migration and 50 regression checks plus opportunity details pass. Hosted signup migration applied; live API rows verified. Mobile impact upgrade remains separate. | Oct 11 |
| [T04](https://github.com/Aadityathecoder/VoluForge/issues/4) Auth/RLS | In progress | Both API roles/signup/login/logout and forbidden requests verified. Finish browser role redirects and real confirmation/recovery email checks. | Oct 18 |
| [T05](https://github.com/Aadityathecoder/VoluForge/issues/5) Organization verification | In progress | Pending signup/SQL operator verification works; audited browser/operator approve/reject workflow remains. | Oct 18 |
| [T06](https://github.com/Aadityathecoder/VoluForge/issues/6) Publishing | In progress | Create API passes hosted HTTP+SQL. Test shared browser create/edit/publish/close and foreign-org editing. | Oct 22 |
| [T07](https://github.com/Aadityathecoder/VoluForge/issues/7) Discovery | In progress | API lists persisted verified/published opportunities. Finish browser filter/detail and empty/error acceptance. | Oct 25 |
| [T08](https://github.com/Aadityathecoder/VoluForge/issues/8) Applications | In progress | Apply, duplicates and owner review pass hosted API+SQL. Verify browser accept/decline and service eligibility. | Nov 1 |
| [T09](https://github.com/Aadityathecoder/VoluForge/issues/9) Service submission | Implemented prototype | Complete hosted browser manual entry/proof validation; timer optional. | Nov 8 |
| [T10](https://github.com/Aadityathecoder/VoluForge/issues/10) Service verification | Implemented prototype | Test reviewer queue, ownership, resubmission, decisions and audit against hosted data. | Nov 15 |
| [T11](https://github.com/Aadityathecoder/VoluForge/issues/11) Hours dashboard | Implemented prototype | Match UI totals to approved-only SQL; test returned/rejected exclusion. | Nov 18 |
| [T12](https://github.com/Aadityathecoder/VoluForge/issues/12) Export | Implemented prototype | Validate date-range record/print output against signed-in student's approved SQL rows. | Nov 22 |
| [T13](https://github.com/Aadityathecoder/VoluForge/issues/13) Integration/freeze | In progress | API slice tested; full seeded browser loop twice, accessibility/responsive review and critical-defect triage remain. | Nov 29 |
| [T14](https://github.com/Aadityathecoder/VoluForge/issues/14) Production | Not started | Deployment, environment/domain/log checks and rollback tag. | Dec 3 |
| [T15](https://github.com/Aadityathecoder/VoluForge/issues/15) Demo assets | In progress | Week 3 screenshots and API script ready; complete full-loop reset, backup video, teacher access and seven-minute demo. | Dec 7 |
| [T16](https://github.com/Aadityathecoder/VoluForge/issues/16) Final rehearsal | Not started | Two final rehearsals, release freeze and final submission. | Dec 10 |

## Milestones

| Milestone | Target | Status |
| --- | --- | --- |
| M1 Foundation/access | Oct 11 | API/schema verified; browser/admin/email and deployment acceptance pending |
| M2 Opportunity-to-acceptance | Nov 1 | Create/list/apply/review API verified; browser/decision acceptance pending |
| M3 Verified service loop | Nov 22 | Prototype/SQL present; hosted end-to-end acceptance pending |
| M4 Stable live demo | Dec 10 | Week 3 API evidence ready; full release/demo pending |

## New sprint: October 12–18

| New task | Budget | Definition of done |
| --- | ---: | --- |
| T05 operator approval/rejection | 2h | Only authorized operator can change verification; durable audit; pending org publishing stays denied |
| T04 browser Auth | 1h | Both roles reach allowed areas; real confirmation/recovery emails and logout tested |
| T06–T08 browser acceptance | 1.5h | Publish, discover, apply, accept/decline match hosted rows across two roles |
| Weekly evidence and demo | 0.5h | Issues/status updated; API demo rehearsed with credentials private |

Capacity remains 5h next week per [availability](availability.md). No actual focused hours were supplied, so actual hours and velocity are **not recorded or invented**. Preserve the November 29 feature cutoff and November 30–December 10 stabilization period. Each following week completes the remaining work in the dated table; conditional timers/uploads/polish yield to the core service loop.

## Week ending October 11

Assigned API slice: complete and [evidenced](../evidence/week-3/README.md). The live test used a local Next.js HTTP server and hosted Supabase Auth/database. Direct SQL was run through the existing logged-in SQL Editor. No Expo server was needed. [One-screen check-in](../check-ins/2026-10-11.md).
