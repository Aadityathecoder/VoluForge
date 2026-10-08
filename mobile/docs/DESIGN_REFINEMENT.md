# Website refinement — October 5, 2026

This pass preserves the app-matched website's cream, ink, orange, and green identity and its existing feature workflows. The live domain still serves the earlier Next.js prototype; this refinement applies to the completed shared Expo website on the local review branch.

Changes:
- A narrower white desktop sidebar, compact selected navigation, and secondary workspace links.
- Consistent website buttons, inputs, cards, dialog corners, and spacing.
- Self-hosted DM Sans typography, with its bundled OFL license. Source: https://github.com/google/fonts/tree/main/ofl/dmsans
- Less oversized desktop headings and simpler opportunity-image fallbacks.
- Visible keyboard focus, hover/disabled states, themed selection/caret/scrollbars, and reduced-motion support.
- Stronger muted-text contrast; tested palette pairs exceed 4.5:1.
- Desktop content now stretches to the viewport correctly, fixing clipped page tops.

The production build, TypeScript, and 22 shared tests pass. The two bounded browser passes covered desktop 1280×900 and phone 390×844, signup controls, search/empty-state recovery, and opportunity navigation. The final desktop heading appears within the viewport, fonts load, and document width matches each viewport.

Feature and database capability limits remain documented in WEBSITE.md and IMPACT_PLATFORM.md. No hosted schema, account, domain, or production deployment changed in this pass. Git publishing credentials are still unavailable.
