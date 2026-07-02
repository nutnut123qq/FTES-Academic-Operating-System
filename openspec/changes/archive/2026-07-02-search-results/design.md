## Layout — global search (§16)

A single-column results surface, narrower than the catalog (search is a focused task):
- `mx-auto max-w-3xl p-6` column; title (`h4`).
- One plain search `<input>` (house class) with a leading `MagnifyingGlassIcon`;
  controlled `useState`, `type="search"`, `aria-label` = placeholder.
- Below it, one `<section>` per non-empty category. Section = a muted bold heading
  (`groups.<key>`) + a stack of rows. Each row = house link-card class
  (`rounded-large border border-separator p-3 hover:bg-default/40 no-underline`) with an
  icon tile (`bg-accent/10 text-accent`) + title + subtitle.
- States: no query → `empty` ("type to search"); query but nothing matches → `noResults`.

## Categories → destinations

Five fixed categories, each with a Phosphor `*Icon` and a plausible link target:
- `users` → `UserIcon` → `/profile`
- `subjects` → `BookOpenIcon` → `/subjects`
- `courses` → `GraduationCapIcon` → `/courses`
- `resources` → `FileIcon` → `/resources`
- `posts` → `ChatCircleIcon` → `/community`

(Rows link to the domain list, not a per-hit detail route — mock hit ids are not real
routes yet. Swap to per-hit hrefs when the search contract lands.)

## Data
`useQuerySearchSwr(query)` — mock grouped results (`{ users, subjects, courses,
resources, posts }`, each `SearchHit[] = { id, title, subtitle }`), SWR-shaped and keyed
by query. Empty query → empty groups; any non-empty query → the same deterministic
sample (mock has no real matching). `ponytail:` note marks the BE swap point.

## Not doing
- No real matching / ranking / highlighting (mock returns a fixed set); no debounce
  (mock is instant); no per-hit detail routes; no recent-searches / filters / pagination.
- No shared-file wiring (nav entry, path builder) in this change — add when search gets
  a chrome entry point.
