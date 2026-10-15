# Trusted organization verification — Week 4 mid-week progress

Implemented in migration `202610140001_operator_verification.sql` in both shared and mobile migration directories. This is a locally verified operator workflow, awaiting hosted deployment and browser acceptance. It does not claim email delivery, production readiness or a finished administrator dashboard.

## Access and decision model

Only an active, signed-in account in `vf_private.operators` can call `vf_review_organization`. A database owner enrolls or revokes operators explicitly; nonprofit signup, profile metadata and the service-role client do not enroll operators. The private schema must remain outside Supabase's exposed schemas. Operators cannot review their own active staff organization.

Approval/rejection takes one transaction: lock the operator allowlist row, validate the decision/reason, lock the organization, update `verified`, append a private decision with actor and previous state, and append a status-only `vf_audit` event. Existing publishing/discovery access checks continue to use `verified`; rejection also hides already-published listings. Ordinary clients, including operators, cannot edit/delete decision history or write the allowlist directly. The trusted database owner can maintain these records; this is not tamper resistance against database administrators.

Reasons are controlled codes: approval uses `identity_confirmed`; rejection uses `identity_unconfirmed`, `ineligible` or `verification_revoked`. No names, emails, freeform notes or credentials are copied into the audit. Existing verified organizations retain their state, without invented historical approval events.

## Deployment and demonstration

1. Review and apply the new migration once as database owner, after all existing migrations. Do not apply shared/mobile copies twice. Reconcile migration history before CLI deployment.
2. Select a real trusted operator's existing Auth UUID and enroll it privately:
   `insert into vf_private.operators(user_id) values ('OPERATOR_AUTH_UUID');`
3. Load the existing Supabase public URL/key and a short-lived operator access token privately into the environment. Do not store tokens in committed files or paste them into screenshots.
4. Call `node scripts/review-organization.mjs ORG_UUID approved identity_confirmed`. A success includes the decision UUID; rejected reviews use a permitted rejection code. The script accepts a normal operator JWT, not a service-role key.
5. Independently inspect `vf_organizations.verified`, the private decision row and the matching `vf_audit` event. Then check nonprofit publishing and volunteer discovery under their normal accounts.
6. Revoke approval with `rejected verification_revoked`; verify publishing is denied and listings disappear. Revoke an operator with `update vf_private.operators set active=false where user_id='OPERATOR_AUTH_UUID';` and verify future review is denied.

Database changes are atomic; HTTP retries can produce additional audit decisions. If a network response is lost, inspect history before retrying. A browser queue and idempotent review UI are follow-up work.

## Verification completed October 14

Run `node database/tests/operator-verification.mjs` in the isolated PGlite PostgreSQL test environment. All 23 checks pass: anonymous/owner/self-enrollment/direct-edit denial; pending/rejected publishing denial; invalid decision/reason and missing organization; persisted approval/actor/prior state/audit; publishing and discovery after approval; immutable client history; revocation visibility; self-review conflict; inactive operator denial; failed reviews leave no decision records.

Existing `node database/tests/validate.mjs` also passes all 50 workflow/security checks and opportunity-detail checks. Shared/mobile migration parity passes. These results do not validate real hosted Auth, concurrent database connections, email or browser flows. No hosted migration or real organization approval was performed for this check-in.
