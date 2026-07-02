## Layout — single page, three stacked sections

`mx-auto max-w-6xl p-6` column; title (`h4` bold) + subtitle (`body-sm` muted).
Sections separated by `border-t border-separator pt-6` (mirrors `SubjectCareer`).

1. **Skill graph** — `careerCenter.skills`. Rows of `{ name }` + a progress meter:
   a `bg-default/40` track holding a `bg-accent` fill div sized by `width: %`, and a
   rounded `%` label. Percentages rounded with `Math.round`.
2. **Career roadmaps** — `careerCenter.roadmaps`. Card grid
   `sm:grid-cols-2 lg:grid-cols-3` of the 6 tracks; each card = house link-card class
   (`rounded-large border border-separator p-4`), a Phosphor `*Icon` in an
   `bg-accent/10 text-accent` tile, the localized track label
   (`roadmapKeys.<key>`), and a mock "Xem lộ trình" `Button variant="ghost"`.
3. **Jobs** — `careerCenter.jobs`. List rows: title + company, a type chip
   (`jobTypes.<type>`, `soft`/`accent`), and a mock "Ứng tuyển" `Button`.

## Data
`useQueryCareerSwr` — one mock fetch returning `{ skills, roadmaps, jobs }`, SWR-shaped
(`useSWR(["career"], …)`), so a real GraphQL query drops in without touching the
component. `ponytail:` note marks the swap point. Shapes: `skills {id,name,progress}`,
`roadmaps {id,key}` (key ∈ backend|frontend|mobile|ai|data|devops),
`jobs {id,title,company,type}` (type ∈ internship|fulltime).

## Pitfalls honored
- HeroUI `Typography` has no `color="accent"` → `className="text-accent"`.
- HeroUI `Button` has no `color`/`startContent`/`endContent` → icons as children,
  styling via `variant`.
- Phosphor `*Icon` imports; tokens only; dark-mode + a11y (`aria-label` on icon tiles,
  progress meter `role="progressbar"` + aria values).

## Not doing
- No nav/sidebar/path wiring (shared files off-limits this change).
- Buttons are mock (no navigation/apply flow); no filtering/sort/pagination.
- No BE; mock data only.
