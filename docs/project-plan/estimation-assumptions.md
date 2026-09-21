# Estimation Assumptions

## Method

Estimates represent focused human time while using AI for scaffolding, test generation, SQL review, debugging suggestions, and documentation. They still include time to understand generated code, integrate it, test it, and correct failures. AI output is never treated as automatically complete.

Tasks are sized as:

- **S — 1–2 hours:** one bounded file, migration, view, or testable behavior
- **M — 3–4 hours:** a small flow crossing two layers
- **L — 5–7 hours:** an end-to-end feature slice; split before work begins

No issue should exceed four estimated hours without being split. A 15% schedule buffer is held outside individual estimates.

## Planning assumptions

- One student developer with basic Python/programming experience and developing TypeScript/Next.js knowledge
- AI assistance reduces boilerplate time but does not eliminate architecture, security, database, or debugging work
- Existing Next.js/Tailwind/Supabase experiments can be reused only after validation
- Supabase and Vercel free tiers are adequate for a controlled classroom pilot
- Responsive web only; no native apps
- One organization, one nonprofit staff user, one student, and one admin are enough for the formal end-to-end acceptance demo
- PDF export may use a server-rendered printable record if a dedicated PDF library threatens the schedule
- Manual time entry is required; a resilient live timer is a stretch enhancement if the core loop falls behind

## Scope guardrails

Must-have work: F01 role enforcement; minimal F02/F09 nonprofit approval; F03 publishing; F04 discovery; F05 application/decision; F06 manual service entry and proof metadata; F07 verification; F08 verified totals and export; deployment and demo.

Simplify first if behind: visual polish, multiple filters, proof-file upload, live timer, password-recovery polish, advanced audit search, account suspension UI, and PDF styling.

Never simplify away: persisted data, ownership checks, role checks, approved-hours-only totals, or the full demo loop.

## Velocity calibration

At each weekly review:

1. Total estimated hours for completed tasks.
2. Total actual focused hours spent.
3. Compute velocity = completed estimated hours / actual hours.
4. Reforecast remaining work using the rolling average of the latest three weeks.
5. If forecast work exceeds capacity by more than 10%, cut or simplify stretch scope immediately.

Example: finishing 5 estimated hours in 6 actual hours gives a velocity of 0.83. If 30 estimated hours remain, forecast about 36 actual hours, not 30.

## Definition of ready

A task is ready when it has a feature ID, dependency state, test/verification method, and no unresolved product decision. AI prompts should include the relevant specification excerpt, current schema or interface, expected output, and the verification command.
