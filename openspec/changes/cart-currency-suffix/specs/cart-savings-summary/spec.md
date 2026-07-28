# cart-savings-summary

## ADDED Requirements

### Requirement: Cart savings amounts use the ₫-suffix VND format consistent with prices
The cart's savings amounts — the "You save {amount}" summary line in `CartSavingsSummary` and each line item's "Save {amount}" caption in `CartLineItem` — SHALL be formatted with the same house VND format as the displayed prices: the `₫` symbol AFTER the number with dot thousands separators (e.g. `267.000₫`), locale-independent, by reusing the shared `formatVnd` helper exported from the `PriceTag` block. The `cart.savings` and `cart.itemSaving` i18n templates SHALL interpolate the already-formatted currency string and SHALL NOT place the currency symbol before the number.

#### Scenario: Savings line matches the price format
- **WHEN** a cart shows a "You save {amount}" line while its prices render as `299.000₫`
- **THEN** the saved amount renders as `267.000₫` — the `₫` after the number with dot thousands separators, matching the prices
- **AND** it is not rendered as `₫267,000` (symbol before the number, comma separators)

#### Scenario: Per-line saving caption matches the line price format
- **WHEN** a discounted cart line renders its green "Save {amount}" caption
- **THEN** the amount uses the same ₫-suffix, dot-separated VND format as that line's price

#### Scenario: Format stays VND regardless of active locale
- **WHEN** the active locale is English
- **THEN** the savings amount still uses the VND `₫`-suffix dot-separated format — no comma separators and no leading symbol — because the cart currency is VND regardless of locale
