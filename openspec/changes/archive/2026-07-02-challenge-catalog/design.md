## Layout — catalog archetype (mirrors SubjectCatalog)

The house already decided the catalog shape in `SubjectCatalog` (search + filter +
card grid). Reuse it rather than re-brainstorm a standard list:
- `mx-auto max-w-6xl p-6` column; title + subtitle.
- Plain search `<input>` (house class) + type filter buttons (`all` + the five
  `challengeSystem.types.*`), `secondary` when active else `ghost`.
- Card grid `sm:grid-cols-2 lg:grid-cols-3`; each card = house link-card class
  `rounded-large border border-separator p-4 hover:bg-default/40 no-underline`,
  a per-type icon badge (`bg-accent/10 text-accent`, phosphor) + title + type label,
  a type chip + difficulty chip, and a points/participants meta row (trophy + users
  icons).
- Empty state when the filter matches nothing (`challengeSystem.catalog.empty`).

## Data
`useQueryChallengesSwr` — mock list of ~6 challenges
(`{ id, title, type, difficulty, points, participants }`, `type ∈
coding|sql|uiux|ai|business`, `difficulty ∈ basic|intermediate|advanced`),
SWR-shaped. `ponytail:` note marks the BE swap point.

## i18n
`challengeSystem.catalog.{title,subtitle,searchPlaceholder,all,empty}`,
`challengeSystem.types.{coding,sql,uiux,ai,business}`,
`challengeSystem.difficulty.{basic,intermediate,advanced}`,
`challengeSystem.pointsCount`, `challengeSystem.participantsCount` (ICU `{count}`).

## Not doing
- No solve view / `/challenges/[id]` page yet (cards link to a future route).
- No enrol/points-earning semantics (mock points/participants only); no BE.
- No sort/pagination (6 mock rows) — add when the catalog grows.
