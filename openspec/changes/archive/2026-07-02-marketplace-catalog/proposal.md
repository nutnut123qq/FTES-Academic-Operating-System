## Why

§13 Marketplace had no FE surface — there was no `/marketplace` route and no product
catalog to browse the coin-store items (merch, premium, AI credits, vouchers, course
unlocks). This ships the catalog as a FE-only mock shell, turning `/marketplace` into
a real 200 route and establishing the domain folder for later BE wiring.

## What Changes

- Add `features/marketplace/MarketplaceCatalog` + `[locale]/marketplace/page.tsx`:
  text search + category filter + a grid of product cards priced in FTES Coin with a
  mock "Mua" action. Mirrors the house catalog archetype (`SubjectCatalog`).
- Add `useQueryProductsSwr` (mock list of ~6 products, SWR-shaped for a BE swap).
- Add `marketplace.*` i18n (vi/en): catalog copy, category labels, price + buy.

## Capabilities

### New Capabilities
- `marketplace-catalog`: the product catalog at `/marketplace`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/marketplace/MarketplaceCatalog`, `marketplace/page.tsx`,
  `useQueryProductsSwr`; new `marketplace` i18n block. No BE (mock). No shared-file
  edits (nav/path builder deferred).
