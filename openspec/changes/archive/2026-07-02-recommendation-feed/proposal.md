## Why

§17 Recommendation Engine had no surface — the app could suggest subjects, courses,
groups, mentors and challenges conceptually, but there was no page where a learner
sees "for you" picks. This ships the FE shell for that engine: a `/recommendations`
page grouping mock suggestions by kind, ready to swap onto a real BE query.

## What Changes

- Add `features/recommendation/RecommendationFeed` + `[locale]/recommendations/page.tsx`:
  title + subtitle, then one section per recommendation kind (heading + horizontal-wrap
  grid of suggestion cards). Each card = icon badge + title + a "reason" caption
  (e.g. "Because you study PRF192") + a mock "Xem" action.
- Add `useQueryRecommendationsSwr` (mock, SWR-shaped) returning recommendations grouped
  by kind `{ subjects, courses, groups, mentors, challenges }`, each a small list of
  `{ id, title, reason }`.
- Add `recommendation.*` i18n (vi/en): `title`, `subtitle`, `view`, and
  `kinds.{subjects,courses,groups,mentors,challenges}`.

## Capabilities

### New Capabilities
- `recommendation-feed`: the "for you" recommendation feed at `/recommendations`.

### Modified Capabilities
- (none)

## Impact
- FE only: new `features/recommendation/RecommendationFeed`, `recommendations/page.tsx`,
  `useQueryRecommendationsSwr`, `recommendation.*` i18n. No BE (mock). No shared-file
  edits (nav/path/layout untouched — reachable by direct URL in this shell).
