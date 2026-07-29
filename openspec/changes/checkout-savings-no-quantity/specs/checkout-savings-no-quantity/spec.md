# checkout-savings-no-quantity

## ADDED Requirements

### Requirement: Checkout summary shows original price and savings for discounted VND purchases
The shared payment modal SHALL show, in its summary box, the pre-discount list price struck through and a green "you save {amount} (−{percent}%)" line whenever the purchase is settled in VND and carries a real discount. The struck-through original + charged pair SHALL be rendered with the shared PriceTag block so its `−X%` chip matches the cart's, and the savings line SHALL use the `text-success` token. The saved amount SHALL be `originalAmountVnd − amountVnd` and the percent `round(savedAmount / originalAmountVnd × 100)`, computed only when `originalAmountVnd` is greater than the payable `amountVnd`. The coupon machinery, method toggle, and QR flow SHALL be untouched — this is display only.

#### Scenario: VND purchase with a discount shows struck original and savings
- **WHEN** the modal opens for a VND purchase whose `originalAmountVnd` exceeds the payable `amountVnd`
- **THEN** the summary shows the payable amount with the original price struck through and a `−X%` chip
- **AND** a green "Tiết kiệm {amount} (−{percent}%)" / "Save {amount} (−{percent}%)" line appears

#### Scenario: VND purchase with no discount shows the payable amount alone
- **WHEN** `originalAmountVnd` is absent or not greater than `amountVnd`
- **THEN** the summary shows the payable amount with no strikethrough, no chip, and no savings line

### Requirement: Coin purchases never show savings
The savings display SHALL be limited to the VND (VietQR) path. When the active method is COIN, or the caller passed no VND list price, the summary SHALL show only the payable amount (coin or VND) with no struck original and no savings line, because the coin path carries no list price.

#### Scenario: Coin method hides savings even when a VND list price was passed
- **WHEN** the active payment method is COIN
- **THEN** the summary shows the coin amount alone with no struck original and no savings line

### Requirement: The list price is carried through the payment context
The payment context SHALL carry an optional `originalAmountVnd` (the pre-discount VND list total), populated by every purchase entry point that knows the list price and omitted when there is no discount. The cart page and mini-cart drawer SHALL derive it from `computeCartSavings(items, subtotal).originalTotal` (omitted when nothing is saved); a course buy-now SHALL pass the course or package original price only when it exceeds the charged amount.

#### Scenario: Cart checkout passes the summed list total only when the cart saves money
- **WHEN** a shopper checks out a cart whose lines carry list prices above their charged prices
- **THEN** the modal receives `originalAmountVnd` equal to the summed list total and renders the savings
- **AND** when no line carries a discount, `originalAmountVnd` is omitted and no savings show

#### Scenario: Course buy-now passes the course/package original when it beats the charge
- **WHEN** a buyer starts a course or package purchase whose list price exceeds the charged amount
- **THEN** the modal receives that original as `originalAmountVnd` and shows the struck price + savings

### Requirement: The cart shows no quantity and never multiplies by it
Because a course is added to the cart exactly once, the cart SHALL NOT display any quantity caption or control, and SHALL NOT multiply any charged total or saving by quantity. A line's charged total SHALL be its unit price and a line's saving SHALL be `originalPriceVnd − unitPrice` (when positive). The `quantity` field SHALL remain in the REST types and add-to-cart calls SHALL keep sending `quantity: 1` (the backend contract). The unreferenced `cart.quantity` i18n key SHALL be removed from both locales.

#### Scenario: A discounted line shows a qty-less saving and no quantity caption
- **WHEN** a cart line carries a list price above its charged unit price
- **THEN** the line shows "Save {amount}" equal to `originalPriceVnd − unitPrice` with no quantity caption

#### Scenario: Cart math ignores the quantity field
- **WHEN** a cart line's `quantity` field is greater than 1
- **THEN** the line's charged total and saving are computed from the unit price alone, not multiplied by quantity

#### Scenario: Add-to-cart still sends quantity 1
- **WHEN** a product is added to the cart
- **THEN** the request body still carries `quantity: 1` and the REST type still declares the `quantity` field
