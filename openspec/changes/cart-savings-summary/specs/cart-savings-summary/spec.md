# cart-savings-summary

## ADDED Requirements

### Requirement: Cart savings summary
The mini-cart drawer and the `/cart` page SHALL replace the bare subtotal row with a shared savings summary that shows a "Total" row (the charged cart total, with the summed list price struck through and a `−X%` chip whenever the cart carries any discount) and, when the cart saves money, a green "You save {amount}" line. Every figure SHALL be derived on the client from the per-line list vs charged prices — no backend savings or preview endpoint is required.

#### Scenario: Cart with discounted lines shows total, saved amount and percent
- **WHEN** a shopper opens a cart whose lines carry list prices above their charged unit prices
- **THEN** the summary shows the charged total with the summed list price struck through and a `−X%` chip
- **AND** a green "You save {amount}" line shows the summed per-line discount

#### Scenario: Cart with no discount shows a plain total
- **WHEN** no line carries a list price above its charged unit price
- **THEN** the summary shows the total with no strikethrough, no `−X%` chip, and no savings line

### Requirement: Savings figures stay consistent with the footer and per-line chips
The savings computation SHALL use the backend-charged `subtotal` as the current total and set `originalTotal = currentTotal + savedAmount`, so the displayed total never drifts from the charged figure and the summary's saving percent equals the shared PriceTag chip. A line's list price SHALL count toward savings only when it exceeds that line's charged unit price, matching the per-row rule.

#### Scenario: Percent matches the PriceTag chip
- **WHEN** the summary renders a `−X%` chip from `savedAmount / originalTotal`
- **THEN** X equals the percent the shared PriceTag computes for the same total and original amounts

#### Scenario: A line whose list price is not above its charged price adds no saving
- **WHEN** a line's `originalPriceVnd` is null or not greater than its `unitPrice`
- **THEN** that line contributes zero to the saved amount and shows no per-line saving caption

### Requirement: Per-item saving caption
The cart line item SHALL show a green "Save {amount}" caption beneath its price whenever the line carries a real discount, where the amount is `(originalPriceVnd − unitPrice) × quantity`.

#### Scenario: Discounted line shows its saving
- **WHEN** a cart line has a list price above its charged unit price
- **THEN** a green "Save {amount}" caption appears under that line's price

### Requirement: No fabricated combo discount
The cart SHALL NOT display a combo/bundle-discount progress bar while the commerce backend exposes no combo, bundle, or quantity-discount pricing. The savings summary SHALL rely only on the real per-line discounts already returned by the cart.

#### Scenario: Combo bar omitted when the backend has no combo pricing
- **WHEN** the cart is rendered and the commerce API returns no combo/bundle/quantity-discount data
- **THEN** no combo progress bar is shown and no fabricated combo discount is applied to the total
