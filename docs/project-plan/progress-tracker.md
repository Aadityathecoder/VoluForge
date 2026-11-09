# VoluForge semester tracker — updated November 9, 2026

Primary task tracker: [GitHub Issues](https://github.com/Aadityathecoder/VoluForge/issues). Semester plan runs through December 11. “Implemented prototype” means code exists; hosted acceptance and release are separate.

| ID / issue | Status | Remaining work / completion evidence | Target |
| --- | --- | --- | --- |
| [T01](https://github.com/Aadityathecoder/VoluForge/issues/1) Audit | Done | Inventory and core route map recorded. | Oct 11 |
| [T02](https://github.com/Aadityathecoder/VoluForge/issues/2) Platforms | In progress | Hosted preview is ready; complete production deployment, environment/domain/log checks. | Dec 3 |
| [T03](https://github.com/Aadityathecoder/VoluForge/issues/3) Schema | Done | Core schema verified. Fellowship migrations are committed; apply and verify against hosted data. | Nov 15 |
| [T04](https://github.com/Aadityathecoder/VoluForge/issues/4) Auth/RLS | In progress | Validate role routes, email flows, and new fellowship/project RLS with separate roles. | Nov 15 |
| [T05](https://github.com/Aadityathecoder/VoluForge/issues/5) Organization verification | In progress | Finish audited operator approve/reject workflow. | Nov 22 |
| [T06](https://github.com/Aadityathecoder/VoluForge/issues/6) Publishing | In progress | Test browser create/edit/publish/close and foreign-org editing. | Nov 22 |
| [T07](https://github.com/Aadityathecoder/VoluForge/issues/7) Discovery | In progress | Finish browser filter/detail and empty/error acceptance. | Nov 22 |
| [T08](https://github.com/Aadityathecoder/VoluForge/issues/8) Applications | In progress | Verify browser accept/decline and service eligibility. | Nov 22 |
| [T09](https://github.com/Aadityathecoder/VoluForge/issues/9) Service submission | Prototype | Complete hosted browser manual entry/proof validation; timer optional. | Nov 22 |
| [T10](https://github.com/Aadityathecoder/VoluForge/issues/10) Service verification | Prototype | Test reviewer queue, ownership, resubmission, decisions and audit. | Nov 22 |
| [T11](https://github.com/Aadityathecoder/VoluForge/issues/11) Analytics | Prototype | Reconcile dashboard totals to hosted records; partner-reported impact is labeled. | Nov 15 |
| [T12](https://github.com/Aadityathecoder/VoluForge/issues/12) Export | Prototype | Validate date-range output against approved records. | Nov 29 |
| [T13](https://github.com/Aadityathecoder/VoluForge/issues/13) Integration/freeze | In progress | Seeded full workflow twice; accessibility/responsive review and critical-defect triage. | Nov 29 |
| T17 Fellowship connections | In progress | Apply migrations; verify invite join, shared roster, shared projects and access boundaries. | Nov 15 |
| T18 SwiftUI iOS preview | Prototype | Build/install to iPhone; validate navigation; later connect auth/data if time permits. | Nov 22 |
| [T14](https://github.com/Aadityathecoder/VoluForge/issues/14) Production | Not started | Production deploy, environment/domain/log checks, rollback tag. | Dec 3 |
| [T15](https://github.com/Aadityathecoder/VoluForge/issues/15) Demo assets | In progress | Finish reset/backup video, teacher access and seven-minute demo. | Dec 7 |
| [T16](https://github.com/Aadityathecoder/VoluForge/issues/16) Final rehearsal | Not started | Two final rehearsals, release freeze and submission. | Dec 10 |

## New sprint: November 9–15

| Task | Definition of done |
| --- | --- |
| Apply fellowship migrations | Run migrations 001 then 002 in hosted DB; verify no unintended access. |
| Validate fellowship connection | Join with invite code; confirm shared roster and linked projects for cohort members; deny unrelated access. |
| Reconcile dashboard analytics | Compare totals with hosted project/task/report rows and keep partner-reported impact clearly labeled. |
| Coordinator workflow | Document/operator-test invite issuance and project-to-cohort linking. |
| Update evidence and demo | Capture dashboard/fellowship evidence; update GitHub issues and rehearse the core flow. |

### Remaining sprint map

- **Nov 16–22:** Test iOS build on iPhone; validate service submission/review and organization publishing; finish discovery/application browser acceptance.
- **Nov 23–29:** Complete export, run full seeded student/nonprofit/fellowship loop twice, responsive/accessibility review, and defect triage.
- **Nov 30–Dec 6:** Production deployment, configuration/domain/log checks, rollback point, and demo environment reset.
- **Dec 7–11:** Complete demo assets, teacher access, two rehearsals, freeze and final submission.

Actual hours and velocity are not recorded because no time log was supplied.