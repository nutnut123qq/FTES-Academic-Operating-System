## Layout — category-grouped card grid

The hub mirrors the house catalog archetype (search-less variant; cf.
`SubjectCatalog`): a centered column with title + subtitle over a card grid, but
grouped into category sections instead of one flat grid.

- `mx-auto max-w-6xl p-6` column; title (with a `PlugIcon` accent glyph) + subtitle.
- One `<section>` per non-empty category, in a fixed order (auth → developer →
  communication → payment → ai → storage), each with a muted category heading.
- Card grid `sm:grid-cols-2 lg:grid-cols-3`; each card = house card class
  `rounded-large border border-separator p-4`, a category icon badge
  (`bg-accent/10 text-accent`), the service name, a category chip, a status line
  (`text-success` Connected / `text-muted` Not connected) and a mock action button.

## Data
`useQueryIntegrationsSwr` — mock list of ~7 integrations
`{ id, key, category, connected }`, SWR-shaped for a drop-in BE swap. `key` is a
stable slug (google, github, gmail, firebase, paymentGateway, aiProviders,
cloudStorage) that drives both the i18n service label and the category-icon lookup.
`ponytail:` note marks the BE swap point.

## Component notes (verified HeroUI pitfalls)
- `Typography` has no `color="accent"` → status colors via `className="text-success"`
  / `text-muted`; category/title accents via `text-accent`.
- `Button` has no `color`/`startContent`/`endContent` → label as children,
  `variant="secondary"` (connect) / `"ghost"` (disconnect). Icons render as children
  elsewhere (icon badge).
- Category icon per group via a `Record<category, PhosphorIcon>` map; each `*Icon` is
  the Phosphor `Icon`-suffixed alias.

## Not doing
- No real OAuth / connect flow — connect/disconnect are mock no-ops (FE-only).
- No nav/path/sidebar wiring (shared files off-limits for this change); reachable by
  direct route only for now.
- No search/filter (7 rows) — add when the list grows.
