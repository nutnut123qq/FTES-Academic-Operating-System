# learn-preview-player-gate

## ADDED Requirements

### Requirement: The package gate modal presents a compact enroll surface without an owned-courses line
The PackageGateModal SHALL present its enroll offer as a compact surface and SHALL NOT render an owned-courses count line. The dialog SHALL be capped at `max-w-lg`, the branded course thumbnail SHALL be at most `w-20`, and the modal body, the package grid, and every offer card SHALL use the house spacing scale (padding/gap of 2·3·4, not larger gaps and not off-scale 0.5/1.5 values). Each offer card's price SHALL be rendered through the shared `PriceTag` block — discounted amount, struck original, and the `−X%` chip in a single row — instead of a hand-rolled multi-row price stack. No variant of the modal SHALL render an owned-courses count line (e.g. "Bạn đã sở hữu N khóa học"), and the dead `payment.loyalty.enrolled` i18n key that backed that copy SHALL be absent from both `vi.json` and `en.json`. Both the whole-course fallback variant (`WholeCourseGateCard`) and the package-list variant SHALL follow this compact layout while keeping the existing checkout flow (resolve product → add to cart → PaymentModal, or free-enrollment) and all CTAs unchanged.

#### Scenario: Package-sold course shows a compact package list
- **WHEN** a signed-in viewer opens the gate on a lesson unlocked by one or more packages
- **THEN** each eligible package renders in a compact card (`p-3`, `gap-2`) with its name, the optional "Phổ biến" chip, a single-row `PriceTag` price, and the select CTA
- **AND** the modal shows no owned-courses count line

#### Scenario: Whole-course (legacy) variant is compact
- **WHEN** the course sells no packages and the gate falls back to the whole-course offer
- **THEN** the `WholeCourseGateCard` renders a compact card (`p-3`, `gap-2`) with the "Trọn khoá" label, a `PriceTag` price, and the enroll CTA
- **AND** the checkout flow (resolve COURSE_UNLOCK → cart → PaymentModal, or free-enrollment) is unchanged

#### Scenario: The owned-courses line is gone in every variant
- **WHEN** any variant of the gate modal (loading, package list, or whole-course fallback) is rendered
- **THEN** no "Bạn đã sở hữu N khóa học" line appears
- **AND** the `payment.loyalty.enrolled` key is not present in either `vi.json` or `en.json`
