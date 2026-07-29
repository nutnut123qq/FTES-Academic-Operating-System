# checkout-two-step-summary

## ADDED Requirements

### Requirement: The checkout modal is a two-step "Summary → Payment" wizard
The shared payment modal SHALL present its content as two steps driven by a pill segmented control shown directly under the header: a "Summary" segment (default/active on open) and a "Payment" segment. The segmented control SHALL be the house `SegmentedControl` block, bound to a `step` state that resets to "summary" every time the modal opens. The existing payment machinery — the `phase` state (`choose → awaiting → success → failed`), coupon, method toggle, QR, order polling, and the coin path — SHALL be preserved unchanged and rendered inside the Payment step.

#### Scenario: The modal opens on the Summary step
- **WHEN** the payment modal opens for any purchase
- **THEN** the header shows the title and a two-segment pill ("Summary" / "Payment") with "Summary" active
- **AND** the Summary step content is shown, not the payment UI

#### Scenario: Reopening resets to the Summary step
- **WHEN** the modal is closed after reaching the Payment step and later reopened
- **THEN** it starts again on the Summary step with `phase` back to `choose`

### Requirement: The Summary step shows the order at a glance
The Summary step SHALL show the course cover thumbnail (rendered with the house `CoverImage` block when the context carries an `imageUrl`, and omitted otherwise), the course title, the payable amount shown large and bold, and a full-width primary "Continue to payment" button (with a right-arrow icon) that advances to the Payment step. When the purchase is settled in VND and carries a real discount, the Summary SHALL render the struck-through original + `−X%` chip via the shared `PriceTag` block and a green savings line using the `text-success` token, reusing the exact savings derivation already in the modal (`originalAmountVnd − amountVnd`, percent `round(saved / originalAmountVnd × 100)`, only when `originalAmountVnd > amountVnd`).

#### Scenario: Discounted VND purchase shows price, savings, and the continue CTA
- **WHEN** the Summary step renders for a VND purchase whose `originalAmountVnd` exceeds `amountVnd`
- **THEN** it shows the thumbnail (when `imageUrl` is set), the title, the payable amount with the struck original and a `−X%` chip, a green "you save {amount} (−{percent}%)" line, and a "Continue to payment →" button
- **WHEN** the "Continue to payment" button is pressed
- **THEN** the modal advances to the Payment step

#### Scenario: Cart checkout has no single cover
- **WHEN** the Summary step renders for a multi-item cart checkout that passed no `imageUrl`
- **THEN** the title is shown with no thumbnail and the step still works

### Requirement: The Payment step keeps the existing pay flow with a recap
The Payment step SHALL render the existing `phase` views (`ChooseView`, `AwaitingView`, `SuccessView`, `FailedView`) exactly as before, preceded by a slim recap line (a small thumbnail when `imageUrl` is set, the title, and the payable amount) for context. The coin path SHALL stay correct: no savings are shown for coin, and the amount shown reflects the active method (coin amount when VND is 0), reusing the `summaryAmount` helper.

#### Scenario: Payment step shows the recap above the pay UI
- **WHEN** the user advances to the Payment step while `phase` is `choose`
- **THEN** a slim recap (thumbnail + title + payable amount) is shown above the method toggle / coupon / pay button

#### Scenario: Coin purchase shows the coin amount without savings
- **WHEN** the active method is COIN
- **THEN** both the Summary and the Payment recap show the coin amount with no struck original and no savings line

### Requirement: The Summary step is locked once payment is under way
Once a payment is in flight or settled (`phase` is not `choose`), the "Summary" segment SHALL be disabled and the modal SHALL be pinned to the Payment step, so the buyer cannot rewind to re-edit the order after a QR is shown or coins are charged. While `phase` is still `choose`, the user MAY move freely between the two segments.

#### Scenario: Summary is disabled after a QR is shown
- **WHEN** the buyer pays and `phase` becomes `awaiting` (or later `success` / `failed`)
- **THEN** the "Summary" segment is disabled and the modal stays on the Payment step

#### Scenario: Summary is reachable again after a retry resets the phase
- **WHEN** a failed payment is retried and `phase` returns to `choose`
- **THEN** the "Summary" segment is enabled again

### Requirement: The payment context carries an optional course cover
The payment context SHALL carry an optional `imageUrl` (a course cover URL), populated by every single-course purchase entry point that knows the cover — the package/whole-course gate (`PackageGateModal` via `useProductCheckout`), the course detail buy-now, and the course enrollment hook — and omitted by the multi-item cart checkout. An empty string SHALL be treated as absent.

#### Scenario: A course purchase passes its cover
- **WHEN** a buyer starts a course or package purchase whose course has a cover image
- **THEN** the modal receives that cover as `imageUrl` and shows it as the Summary thumbnail

#### Scenario: Cart checkout omits the cover
- **WHEN** a shopper checks out a multi-item cart
- **THEN** `imageUrl` is omitted and the Summary shows the title with no thumbnail
