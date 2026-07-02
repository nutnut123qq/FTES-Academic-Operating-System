## 1. Feed
- [x] 1.1 `useQueryRecommendationsSwr` — mock, SWR-shaped, grouped by kind (`{ subjects, courses, groups, mentors, challenges }`, items `{ id, title, reason }`)
- [x] 1.2 `features/recommendation/RecommendationFeed` — title + subtitle + one section per kind (heading + horizontal-wrap card grid; card = icon badge, title, reason caption, mock "Xem" Button)
- [x] 1.3 `[locale]/recommendations/page.tsx` renders RecommendationFeed

## 2. i18n
- [x] 2.1 `recommendation.{title,subtitle,view}` + `recommendation.kinds.{subjects,courses,groups,mentors,challenges}` (vi/en) — output in final report (messages/*.json not edited in this shell)

## 3. Verify
- [x] 3.1 eslint clean + JSON valid (no build/tsc per shell constraints)
