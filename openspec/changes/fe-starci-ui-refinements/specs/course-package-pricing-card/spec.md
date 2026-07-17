# course-package-pricing-card

## ADDED Requirements

### Requirement: Compact package pricing headline
The sticky enroll card on the course detail page SHALL present the selected package's price as
a compact headline in the StarCI `CoursePricingRail` style: the **current (discounted) price
large**, the **original price struck through** beside it, and a **`-%` discount badge** when
there is a real saving. When the package is genuinely free the headline SHALL read the free
label instead of a struck price. Prices map from the real `PackageView` (`salePrice` charged,
`originalPrice` reference).

Nơi sửa: `src/components/features/course/CourseDetail/index.tsx` — `PackageEnrollCard` (và
`EnrollCard` nếu còn dùng); helper `packagePrice()` cung cấp `discounted`/`original`.

#### Scenario: Discounted package shows big price, struck original, and badge
- **GIVEN** the selected package has a `salePrice` lower than its `originalPrice`
- **THEN** the headline shows the sale price large, the original price struck through, and a
  `-%` discount badge

#### Scenario: Free package shows the free label
- **GIVEN** the selected package's charged price is 0
- **THEN** the headline shows the free label, not a struck price

### Requirement: Scarcity line for the active package
The card SHALL, when the package data exposes a scarcity/slot figure, show a single **orange**
line (e.g. "Còn N suất Early bird"). When the contract carries no slot figure the line SHALL be
omitted rather than showing a fabricated number.

Nơi sửa: `PackageEnrollCard` (đọc field suất từ `PackageView`; ẩn khi thiếu, ghi giả định vào
`tasks.md` Findings).

#### Scenario: Slot figure present
- **GIVEN** the active package reports remaining slots
- **THEN** an orange scarcity line renders with that count

#### Scenario: No slot figure
- **GIVEN** the package data has no slot/scarcity figure
- **THEN** no scarcity line is shown and no placeholder number is invented

### Requirement: Package list as a highlighted radio group
The card SHALL list the course's packages as a **radio group** (via `SelectableCardGroup
variant="list"`): package name on the left, price on the right. The currently selected / open
package SHALL be **highlighted in the accent color** and carry an **"Đang mở"** label.

Nơi sửa: `PackageEnrollCard` `SelectableCardGroup` items từ `useQueryCoursePackagesSwr`.

#### Scenario: Selecting a package highlights it
- **WHEN** the user picks a package row
- **THEN** that row is highlighted in the accent color and shows the "Đang mở" label
- **AND** the headline price updates to that package's price

### Requirement: Three-tier CTA and enrolled-count proof
The card SHALL present, for a non-enrolled viewer, a primary full-width **Enroll** button; once
the package is added to cart it SHALL show an **"In cart"** state with a remove (xoá) icon; and
below it a **"Học thử miễn phí"** secondary button. A **"N người đã đăng ký"** line
(`course.enrollmentCount`) SHALL render at the bottom.

Nơi sửa: `PackageEnrollCard` CTA cluster (`onBuyPackage` add-to-cart + remove) + enrolled-count
row; i18n `courseSystem.detail.inCart` / `detail.enrolledCount`.

#### Scenario: Enroll then in-cart with remove
- **WHEN** the viewer presses Enroll and the package is added to the cart
- **THEN** the button reflects an "In cart" state with a remove icon that removes the item

#### Scenario: Try free is available
- **GIVEN** the viewer is not enrolled
- **THEN** a "Học thử miễn phí" secondary CTA is shown under the primary CTA

#### Scenario: Enrolled count shown
- **GIVEN** the course reports an enrollment count
- **THEN** a "N người đã đăng ký" line renders at the bottom of the card
