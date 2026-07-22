# commerce-cart Specification

## Purpose
TBD - created by archiving change commerce-checkout-flows. Update Purpose after archive.
## Requirements
### Requirement: Add product to cart from marketplace

The Marketplace product card SHALL provide a "Thêm vào giỏ" action that adds the product via `POST /commerce/cart/items` and refreshes the cart cache.

#### Scenario: Item added to cart

- **WHEN** the user clicks "Thêm vào giỏ"
- **THEN** the item is added and the cart cache (`GET /commerce/cart`) is revalidated so the cart page reflects it

### Requirement: Cart page lists items and removes them

The system SHALL provide a `/cart` route rendering the current cart from `GET /commerce/cart`, each line item with its price and a remove action calling `DELETE /commerce/cart/items/{id}`.

#### Scenario: Viewing the cart

- **WHEN** the user opens `/cart`
- **THEN** the page lists each cart item with unit price and shows the subtotal

#### Scenario: Empty cart state

- **WHEN** the cart has no items
- **THEN** the page shows an empty state instead of the checkout action

#### Scenario: Removing an item

- **WHEN** the user removes a line item
- **THEN** the item is deleted and the cart list and subtotal update

### Requirement: Cart checkout opens the payment modal

The cart page SHALL provide a "Thanh toán" action that opens the PaymentModal with all cart-item ids.

#### Scenario: Checkout from cart

- **WHEN** the user clicks "Thanh toán" with a non-empty cart
- **THEN** the PaymentModal opens with `itemIds` = every cart-item id, a title summarizing the cart, and the cart subtotal

