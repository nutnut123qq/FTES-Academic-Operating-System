# package-gate-legacy-style

## ADDED Requirements

### Requirement: Enroll modal matches the legacy checkout layout
The enroll modal SHALL match the legacy checkout layout — a "Thanh toán" header with a circular close button, a "Tóm tắt / Thanh toán" segmented control that defaults to "Tóm tắt", an order summary (rounded-square thumbnail + course/package title + the shared PriceTag price + a "Tiết kiệm {amount}" line when discounted), and a single big "Tiếp tục thanh toán" CTA — for both the whole-course and package variants. The CTA SHALL drive the existing resolve → cart → (free checkout | PaymentModal) flow, and the layout SHALL NOT show any "khóa học đã sở hữu" ownership line.

#### Scenario: Whole-course variant renders the legacy shell
- **WHEN** the modal opens for a course that sells no eligible packages and a COURSE_UNLOCK product resolves
- **THEN** it shows the "Thanh toán" header with a circular close, the "Tóm tắt / Thanh toán" tabs with "Tóm tắt" active, an order summary line (thumbnail + course title + price), and a big "Tiếp tục thanh toán" CTA

#### Scenario: Package variant renders the same shell with selectable order lines
- **WHEN** the modal opens for a course whose eligible package list is non-empty
- **THEN** it shows the same header, tabs and big "Tiếp tục thanh toán" CTA, with each package rendered as a selectable order line (thumbnail + name + PriceTag + saving) and one line selected by default

#### Scenario: Continue CTA drives the existing checkout without breaking enrollment
- **WHEN** the shopper presses "Tiếp tục thanh toán" for the selected whole course or package
- **THEN** the existing flow runs — resolve the product, add it to the cart, then either free-enroll via checkout or open the shared PaymentModal — exactly as before the restyle

#### Scenario: Summary is the default tab and reopens on it
- **WHEN** the modal is opened
- **THEN** the "Tóm tắt" tab is active and shows the order summary, while the "Thanh toán" tab shows only a short "next step" note

#### Scenario: No product still degrades gracefully
- **WHEN** the course sells no packages and carries no COURSE_UNLOCK product
- **THEN** the summary shows the "no matching offer" message instead of a CTA that cannot complete
