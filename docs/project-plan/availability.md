# Calendar and Availability

## Baseline assumptions

| Item | Planning value |
| --- | --- |
| Project start | Monday, September 28, 2026 |
| Assumed final deadline | Friday, December 11, 2026 |
| Normal capacity | 5–7 hours/week; plan uses 6 hours/week |
| Cricket constraint | Weekday practice 3:30–5:00 p.m.; do not schedule project work in this window |
| Sick-day reserve | Two school days, modeled as 4 hours of lost project capacity total |
| Estimation buffer | 15% of available work time is held for debugging, rework, and AI-integration errors |
| Feature-development cutoff | Sunday, November 29, 2026 |
| Demo-only period | November 30–December 10, 2026 |

The deadline, holiday dates, and personal exceptions below are a provisional planning baseline and should be replaced with the exact course deadline and the current American Heritage Broward calendar when available.

## School calendar and reduced-efficiency dates

| Dates | Calendar effect | Capacity rule |
| --- | --- | --- |
| Sep 28–Nov 22 | Normal school weeks | 6 hours/week |
| Oct 12 | Provisional school-holiday allowance | Do not assume extra work; keep weekly cap at 5 hours |
| Nov 23–27 | Provisional Thanksgiving break | Limit to 2 optional hours; protect travel/family time |
| Two unassigned school days | Sick-day reserve | 0 project work on those days; consume contingency rather than moving the deadline |
| Nov 30–Dec 10 | Demo stabilization | No planned new features; testing, seed data, deployment, rehearsal, and submission only |
| Dec 11 | Assumed submission/demo | Submit stable build and evidence |

Known travel, competitions, college visits, field trips, and college-application weeks: **none supplied yet**. Add each event as soon as known. Use 50% of normal capacity for travel, competition, visit, or application-heavy weeks unless the entire day is unavailable.

## Sustainable weekly pattern

| Work block | Duration | Intended work |
| --- | ---: | --- |
| Two weekday evenings after school/cricket | 1 hour each | Small, verifiable implementation or test tasks |
| One weekend deep-work block | 3 hours | End-to-end feature work |
| Weekly review | 1 hour | Integration, issue updates, demo check, and next-week planning |

Do not plan more than two consecutive hours on a school night. Each work session should target a result that can be run, queried, or visually verified.

## Capacity calculation

- Nine development weeks at about 6 hours = 54 raw hours.
- Thanksgiving/reduced-week adjustment = about 4 hours removed.
- Two sick days = 4 hours reserved.
- Remaining forecast = about 46 hours.
- A 15% delivery buffer leaves about **39 planned implementation hours** before the development cutoff.
- The final 10–12 hours of semester availability are reserved for deployment, validation, demo data, rehearsal, and submission.

This capacity supports one narrow end-to-end pilot. It does not support production-grade versions of all edge cases in `docs/features.md`.

## Change procedure

When availability changes, record the date, new capacity, and reason here. Then update the remaining-hours forecast in `progress-tracker.md`. Protect the demo period by removing or simplifying scope before extending feature work beyond November 29.
