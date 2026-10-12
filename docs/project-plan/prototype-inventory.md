# Prototype inventory — October 11, 2026

| Area | Reusable source | Current evidence / remaining work |
| --- | --- | --- |
| Website shell | `app/page.tsx`, `public/voluforge/`, shared `mobile/src/` web build | Checked-in responsive website. API runs in Next.js; no Expo server required for API testing. |
| Accounts | `lib/api/volunteer.ts`, `app/api/v1/[...path]/route.ts` | Volunteer/nonprofit signup, login, logout and identity route. Nonprofit membership is created by database trigger; verification is separate. |
| Discovery / publishing | Same API; `vf_opportunities`, `vf_upsert_opportunity` | Live HTTP creation and discovery verified against hosted SQL. Browser form integration still needs acceptance testing. |
| Applications | Same API; `vf_applications`, `vf_apply_to_opportunity` | Apply, duplicate protection and authorized reviewer list. Decision workflow is outside this week's API slice. |
| Service loop | Shared screens and `vf_submit_service`, `vf_review_service`, timer RPCs | Implemented prototype/SQL; complete hosted browser acceptance and export validation remain. |
| AI/community-needs experiments | `app/project-kits/`, `app/submit-need/`, legacy tables | Earlier experimental scope. Not used as evidence for the assigned volunteer API. |
| Mobile | `mobile/` | Existing source preserved. Native packaging/App Store work is outside this weekly API task. |

Core route map: `/api/v1/auth/{signup,login,logout,me}`, `/api/v1/opportunities`, `/api/v1/opportunities/{id}/applications`, `/api/v1/applications?opportunity_id={id}`. Legacy `/api/auth/signup` delegates to the API flow.

Do not treat demonstration state, a successful compile, or an unverified organization as proof of a completed hosted service loop.
