## MODIFIED Requirements

### Requirement: Course detail sales layout
The course detail page at `/courses/[courseId]` SHALL present a two-column sales layout: a left content column and a sticky right enroll card. Data is FE-mocked until the BE course contract lands.

#### Scenario: Two-column layout with sticky enroll card
- **WHEN** a user opens a course detail page on a `md`+ viewport
- **THEN** the left column shows the hero, "what you'll learn", the syllabus, reviews, and the instructor
- **AND** the right column shows an enroll card (cover, price, tier selector, CTA, "what's included") that sticks while the left column scrolls

#### Scenario: Price is VND-primary with a USD reference
- **WHEN** the enroll card renders the price
- **THEN** the charged VND amount is shown prominently via the PriceTag block (with any struck original)
- **AND** the USD figure is shown below as a muted reference

#### Scenario: Enroll card shows two enrollment tiers
- **WHEN** the user is not yet enrolled
- **THEN** the enroll card displays a Free tier and a Premium tier
- **AND** the user can switch between the two tiers
- **AND** each tier shows its name, badge when applicable, and a distinct benefit list

#### Scenario: Free tier benefits
- **WHEN** the Free tier is selected
- **THEN** the benefit list reflects preview access (~20% content), readable lessons, and challenges
- **AND** the certificate item is shown as unavailable or omitted

#### Scenario: Premium tier benefits
- **WHEN** the Premium tier is selected
- **THEN** the benefit list reflects full video access, all lessons, all challenges, and a completion certificate

#### Scenario: CTA enrolls, never "buys"
- **WHEN** the user presses the primary CTA
- **THEN** the label reads "Đăng ký học" / "Enroll" and routes to the course enroll flow
- **AND** no "buy"/"VIP" copy or membership upsell is shown

#### Scenario: Try-free CTA starts a trial
- **WHEN** the user presses the secondary "Học thử miễn phí" / "Try for free" CTA
- **THEN** the system best-effort calls the existing `startTrial` mutation
- **AND** the user is routed into the course content regardless of mutation outcome

#### Scenario: Enrolled state shows a single continue CTA
- **WHEN** the user is already enrolled
- **THEN** the tier selector and price are hidden
- **AND** a single primary CTA labeled "Tiếp tục học" / "Continue Learning" is shown
- **AND** pressing it routes the user into the course content

#### Scenario: Syllabus preview with durations and premium markers
- **WHEN** the syllabus renders
- **THEN** chapters expand and collapse (first chapter open by default)
- **AND** each lesson shows its duration, and premium lessons show a lock + a "Premium" chip

#### Scenario: Loading and error states
- **WHEN** the course data is loading
- **THEN** a skeleton mirroring the two-column layout is shown
- **WHEN** loading fails with no cached data
- **THEN** an error state with a retry action is shown
