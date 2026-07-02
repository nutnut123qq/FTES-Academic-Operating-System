## Layout — catalog archetype (mirrors SubjectCatalog)

The house already decided the catalog shape in `SubjectCatalog` (search + filter +
card grid). Reuse it rather than re-brainstorm a standard list:
- `mx-auto max-w-6xl p-6` column; title (with a `StorefrontIcon`) + subtitle.
- Plain search `<input>` (house class) + category filter buttons (`all` + the five
  `marketplace.categories.*`), `secondary` when active else `ghost`.
- Card grid `sm:grid-cols-2 lg:grid-cols-3`; each card = house card class
  `rounded-large border border-separator p-4`, per-category icon badge
  (`bg-accent/10 text-accent`), name, category chip, 2-line description, and a footer
  row with the coin price (`CoinsIcon` + formatted number) + a mock "Mua" Button.
- Empty state when the filter matches nothing (`marketplace.catalog.empty`).

## Data
`useQueryProductsSwr` — mock list of ~6 products `{ id, name, category, priceCoin,
description }` with `category ∈ merch|premium|aiCredits|voucher|courseUnlock`,
SWR-shaped. A `ponytail:` note marks the BE swap point (a real `products()` query
drops in without changing the hook API).

## Icons (Phosphor)
`StorefrontIcon` (title), `CoinsIcon` (price), and one per category:
merch→`TShirtIcon`, premium→`SparkleIcon`, aiCredits→`CoinsIcon`, voucher→`TicketIcon`,
courseUnlock→`LockKeyOpenIcon`. Tokens own color; badges are `text-accent`.

## Wiring
- No shared-file edits: nav row + path builder are deferred (constraint — do not touch
  `useAppNav`/`resources/path`). `/marketplace` is reachable by URL for now.

## Not doing
- No cart/checkout/balance semantics — the "Mua" button is a mock (no handler).
- No BE, no sort/pagination (6 mock rows) — add when the catalog grows.
- No nav surfacing / path builder — a follow-up change once the domain lands.
