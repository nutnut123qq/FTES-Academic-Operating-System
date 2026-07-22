# commerce-buy-now Specification

## Purpose
TBD - created by archiving change commerce-checkout-flows. Update Purpose after archive.
## Requirements
### Requirement: Buy-now from the marketplace

The Marketplace product card SHALL provide a "Mua ngay" action that starts checkout for exactly that product without a separate cart visit. Because the checkout endpoint requires cart-item ids, the action SHALL add the product to the cart via `POST /commerce/cart/items` then open the PaymentModal with the returned cart-item id.

#### Scenario: Buy-now opens the payment modal

- **WHEN** the user clicks "Mua ngay" on a product
- **THEN** the product is added to the cart and the PaymentModal opens with `itemIds = [newCartItemId]`, the product name as title, and its VND/coin price

#### Scenario: Add-to-cart failure surfaces an error

- **WHEN** the add-to-cart call fails
- **THEN** the modal does not open and the user sees an error, with the button returning to its idle state

#### Scenario: Button shows pending state

- **WHEN** the buy-now request is in flight
- **THEN** the button shows a loading state and is disabled to prevent duplicate submissions

