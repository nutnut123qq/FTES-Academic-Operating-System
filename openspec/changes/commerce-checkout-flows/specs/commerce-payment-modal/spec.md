## ADDED Requirements

### Requirement: Global payment modal driven by overlay context

The system SHALL provide a single global `PaymentModal`, mounted in `ModalContainer`, opened via `usePaymentOverlayState().open(context)` where `context = { itemIds, title, amountVnd, amountCoin? }`. The modal SHALL be reused by every purchase entry point (buy-now, cart checkout).

#### Scenario: Opening the modal with a payment context

- **WHEN** any caller invokes `open({ itemIds, title, amountVnd })`
- **THEN** the modal opens showing the title and amount summary, defaulting to the VietQR method

#### Scenario: Modal opens without a context

- **WHEN** the overlay is open but `context` is null
- **THEN** the modal renders nothing (no crash) until a context is supplied

### Requirement: Choose payment method

The modal SHALL let the user choose between **VietQR** (bank QR) and **Xu** (wallet COIN). The chosen method SHALL be sent as `payMethod` (`"VIETQR"` or `"COIN"`) to `POST /commerce/checkout`.

#### Scenario: Coupon input visible only for VietQR

- **WHEN** the user selects the VietQR method
- **THEN** the coupon input is shown
- **AND** when the user selects the Xu method the coupon input is hidden (backend ignores coupons for COIN)

#### Scenario: Wallet balance shown for Xu method

- **WHEN** the user selects the Xu method
- **THEN** the modal shows the current wallet balance from `GET /wallet/me`
- **AND** disables the pay action when the balance is below `amountCoin`

### Requirement: Apply coupon before checkout

For the VietQR method the modal SHALL validate a coupon via `POST /commerce/coupons/validate` and display the discount amount, then include `couponName` in the checkout request.

#### Scenario: Valid coupon shows discount

- **WHEN** the user enters a coupon code and applies it
- **THEN** the modal shows the discount amount returned by the validate endpoint and the net payable

#### Scenario: Invalid coupon shows error

- **WHEN** the validate call rejects the coupon
- **THEN** the modal shows an error message and keeps the original amount, letting the user retry or clear it

### Requirement: VietQR checkout shows QR and polls until paid

For the VietQR method the modal SHALL call `checkout`, render the returned `qrCode` via the `reuseable/QRCode` component, and poll `GET /commerce/orders/{orderId}` until the order reaches a terminal status.

#### Scenario: Order becomes PAID

- **WHEN** checkout returns an order and the poll observes `status === "PAID"`
- **THEN** the modal shows a success state and refreshes the cart and wallet caches

#### Scenario: Order expires or is cancelled

- **WHEN** the poll observes `status` of `EXPIRED`, `CANCELLED`, or `FAILED`
- **THEN** the modal stops polling and shows a failure state with a retry option

#### Scenario: Polling stops when the modal closes

- **WHEN** the user closes the modal while awaiting payment
- **THEN** the poll is disabled so no background requests continue

#### Scenario: Idempotency key per checkout attempt

- **WHEN** the modal submits a checkout
- **THEN** it sends a single generated `idempotencyKey` for that attempt so a retried submit does not create a duplicate order

### Requirement: Xu (COIN) checkout settles immediately

For the Xu method the modal SHALL call `checkout` with `payMethod=COIN`; because the backend charges the wallet synchronously, the returned status is treated as final without polling.

#### Scenario: Sufficient balance pays instantly

- **WHEN** the wallet balance covers `amountCoin` and the user confirms
- **THEN** checkout returns `PAID` and the modal shows success and refreshes the wallet balance

#### Scenario: Insufficient balance is rejected

- **WHEN** checkout fails with an insufficient-coin error
- **THEN** the modal shows an insufficient-balance message and does not show success
