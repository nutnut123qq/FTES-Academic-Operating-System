## Layout — catalog archetype (mirrors SubjectCatalog)

The house already decided the catalog shape in `SubjectCatalog` (search + filter +
card grid). Reuse it rather than re-brainstorm a standard list:
- `mx-auto max-w-6xl p-6` column; title + subtitle.
- Plain search `<input>` (house class) matching title + location + type filter buttons
  (`all` + the five `eventSystem.types.*`), `secondary` when active else `ghost`.
- Card grid `sm:grid-cols-2 lg:grid-cols-3`; each card = house link-card class
  `rounded-large border border-separator p-4 hover:bg-default/40`, a per-type icon
  badge (`bg-accent/10 text-accent`), title + type chip, a date + location + attendees
  meta stack (`CalendarIcon` / `MapPinIcon` / `UsersIcon`), and a mock "Đăng ký" Button.
- Empty state when the filter matches nothing (`eventSystem.catalog.empty`).

## Data
`useQueryEventsSwr` — mock list of ~6 events, SWR-shaped, exports an `Event` interface
`{ id, title, type, date, location, attendees }` with `type ∈ webinar | workshop |
hackathon | competition | meetup`. `ponytail:` note marks the BE swap point.

## Interactivity note
The "Đăng ký" Button is a real interactive element, so it is a **sibling** of the card
Link (not a descendant) — the Link wraps only the icon + title, avoiding an
interactive-in-interactive DOM/a11y violation. The register action is a mock no-op
(no enrol/register endpoint yet).

## Not doing
- No event detail page (`/events/[id]`) yet — cards link there for when it lands.
- No real register/enrol semantics; no BE.
- No sort/pagination (6 mock rows) — add when the catalog grows.
- No sidebar/nav wiring in this change (kept to the domain folders + page + i18n).
