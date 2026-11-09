# VoluForge website feature files

These changes are prepared for the existing Next.js/Supabase VoluForge repository.

## Fellowship network

Apply `database/migrations/202611090001_fellowship_network.sql` and then `database/migrations/202611090002_fellowship_project_access.sql` before using `/dashboard/fellowships`. These migrations create cohort membership, shared project links, invitation-code enrollment, and a roster RPC that returns only cohort-shared profile fields. The app does not expose email addresses or invite records. Members can open only projects that an operator explicitly links to their fellowship.

Fellowship creation, roster administration, project association, and invite issuance remain operator-managed through the database's trusted admin channel. App users can join only with an unexpired invite code. Do not place a service-role key in the browser or mobile app.

## Dashboard analytics

The dashboard calculates completed tasks from `project_tasks` and aggregates the latest `impact_reports` row per project. The UI calls hours and beneficiary totals partner-reported; they are not independently verified.

## SwiftUI phone preview

The separate `ios/VoluForge` Xcode project is a local demo with fictional sample data and local-only interactions. It is not connected to Supabase or live user records.
