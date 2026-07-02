## Layout — vertical timeline feed

A single-column feed, narrower than a catalog since rows are line-items not cards:
- `mx-auto max-w-3xl p-6` column; title + subtitle header.
- Rows in a `<ul>` separated by `divide-y divide-separator` (dense list = rows, not
  cards — house rule).
- Each row: an accent-tinted icon badge (`size-10 rounded-large bg-accent/10
  text-accent`, phosphor icon by kind) + a two-line body (kind label in accent
  caption + the event text) + a right-aligned relative time.
- Empty state (`activity.empty`) when the feed is empty.
- Client component (`useTranslations` + SWR hook).

## Kind → icon map

Eight kinds, each with a phosphor icon, held in a `Record<ActivityKind, Icon>` in the
component:
courseEnrolled→GraduationCap · lessonCompleted→CheckCircle · resourceUploaded→UploadSimple ·
questionPosted→ChatCircle · badgeEarned→Medal · coinEarned→Coins · eventJoined→CalendarCheck ·
groupJoined→UsersThree.

## Data

`useQueryActivitySwr` — mock list of ~8 `{ id, kind, text, time }`, SWR-shaped so the
FE surface is a drop-in swap for the real `activity()` query. `ponytail:` note marks
the BE swap point. Relative time is a coarse in-component formatter (m / h / d),
no plural-i18n fuss.

## Not doing
- No BE — the Activity Engine backbone is a BE service (§18); this is only its FE
  surface. DO NOT archive this change until the surface is wired against the real BE.
- No filtering / pagination / infinite scroll (8 mock rows) — add when the feed grows.
- No write/emit path (this is a read-only timeline).
