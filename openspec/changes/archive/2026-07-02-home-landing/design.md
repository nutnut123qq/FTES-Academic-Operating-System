## Layout — direction A (product tour + bento)

Marketing/on-ramp landing, composed in the feature (a landing is a bespoke
composition; feature owns copy + navigation, tokens/HeroUI own the look — no new
blocks needed). Full-bleed sections, each with an inner `max-w-6xl` gutter.

### Sections
1. **Hero** — centered: `Chip` eyebrow · `Typography h1` headline (`t.rich` accent
   span) · muted subline · two `Button`s (primary → `/courses`, secondary → `/community`).
2. **Bento** — `grid sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-fr`; Subject workspace
   tile is big (`sm:col-span-2 lg:row-span-2`). Tiles = house card class
   `rounded-large border border-separator p-6`; linked tiles add
   `hover:bg-default/40` + `no-underline`. Icon badge = `bg-accent/10 text-accent`.
3. **Pillars** — `border-t bg-default/20` band, 3-col icon + title + desc.
4. **Final CTA** — centered title + subline + buttons (courses · demo subject).

### Routing
Cards/CTAs use `Link` / `useRouter` from `@/i18n/navigation` (locale-less hrefs).
All targets return 200: `/courses` `/resources` `/community` `/groups`. Subject
tile → `/subjects/PRF192` — a **demo id** because the `/subjects` list is 404 until
Phase 1 (SubjectWorkspaceShell renders on mock data for any id). Marked with a
`ponytail:` comment; upgrade to a real subject when the catalog lands.

### Copy
New `homeLanding.*` key, NOT the legacy `landing.*` (StarCi coding-school pitch —
wrong substructure + off-message). Legacy left in place, unused, for a later cleanup.

### Not doing
- No hero product screenshot/mock (that was direction B).
- No gated-vs-guest variation; same landing for all (root `/` proxy-gating unchanged).
- No deletion of legacy `landing.*`/`home.*` i18n (separate cleanup).
