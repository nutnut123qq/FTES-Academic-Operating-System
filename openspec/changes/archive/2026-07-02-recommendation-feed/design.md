## Layout — grouped "for you" feed

Mirrors the house catalog column shape (see `SubjectCatalog`) but grouped by kind
instead of filtered by one facet:
- `mx-auto max-w-6xl p-6` column; title (`h4` bold) + subtitle (`body-sm` muted).
- One `<section>` per kind in a fixed order: subjects, courses, groups, mentors,
  challenges. Each section = a `body` bold heading + a horizontal-wrap card grid
  (`flex flex-wrap gap-3`, fixed-width `w-64` cards) so kinds read as sw'able rows.
- Card = house link-card class `rounded-large border border-separator p-4`, an icon
  badge (`bg-accent/10 text-accent`, Phosphor `*Icon` per kind), title (`body-sm`,
  2-line clamp), reason caption (`body-xs` muted, e.g. "Because you study PRF192"),
  and a mock `Xem` Button (`variant="secondary"`, no navigation in this shell).
- Sections with no items render nothing (defensive while data is mock/loading).

## Data
`useQueryRecommendationsSwr` — mock, SWR-shaped, returns `RecommendationsByKind`
(`{ subjects, courses, groups, mentors, challenges }`), each a small list of
`Recommendation` = `{ id, title, reason }`. A `ponytail:` note marks the BE swap
point; the hook API + shape stay when a real `recommendations()` query lands.

## Pitfalls honored
- HeroUI `Typography` has no `color="accent"` → the icon badge uses `text-accent`.
- HeroUI `Button` has no `color`/`startContent`/`endContent` → the "Xem" action is a
  plain-label secondary button; kind icons live in the card badge, not the button.
- Phosphor icons imported as `*Icon`; tokens only; dark-mode + a11y (`aria-hidden`
  on decorative badge icons, real text labels on the action).

## Not doing
- No real personalization / ranking (mock lists only); no BE.
- No nav/path/layout wiring — reachable by direct URL in this FE shell (shared files
  are out of scope for this change).
- No per-kind "see all" / pagination — add when the feed grows.
