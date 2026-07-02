## Why
The course detail page (§4) was a thin scaffold: hero + flat outline + one enroll
button. It doesn't read as a course *sales* page. Following the chosen brainstorm
direction A (Coursera pattern), rebuild it as a two-column sales layout so a learner
can size up the course and enroll in one glance.

## What Changes
- Rebuild `CourseDetail` as a two-column layout: left content column (hero with
  rating, "what you'll learn", expandable syllabus with lesson durations, learner
  reviews, instructor) + a **sticky** right enroll card (cover, price, enroll CTA,
  "what's included").
- CTA copy is ENROLL, never buy/VIP (rule premium-unlock-is-enroll-not-vip). Price
  is VND via `PriceTag` with a muted USD reference.
- Extend the mock `useQueryCourseDetailSwr`: `price`, `rating`, `whatYouLearn`,
  `instructor`, `reviews`, per-lesson `durationLabel` + `isPremium`, `durationLabel`.
- i18n `courseSystem.detail.*` (vi/en). AsyncContent + layout-mirroring skeleton.

## Capabilities
### New Capabilities
- (none)
### Modified Capabilities
- `course-detail`: upgraded to the two-column sales layout (direction A).

## Impact
FE only. No BE — mock hook, enroll/try CTAs are no-ops. Build stays green.
