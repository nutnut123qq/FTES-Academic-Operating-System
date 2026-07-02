## ADDED Requirements

### Requirement: Course detail sales layout
The course detail page at `/courses/[courseId]` SHALL present a two-column sales
layout: a left content column and a sticky right enroll card. Data is FE-mocked
until the BE course contract lands.

#### Scenario: Two-column layout with sticky enroll card
- **WHEN** a user opens a course detail page on a `md`+ viewport
- **THEN** the left column shows the hero, "what you'll learn", the syllabus, reviews, and the instructor
- **AND** the right column shows an enroll card (cover, price, CTA, "what's included") that sticks while the left column scrolls

#### Scenario: Price is VND-primary with a USD reference
- **WHEN** the enroll card renders the price
- **THEN** the charged VND amount is shown prominently via the PriceTag block (with any struck original)
- **AND** the USD figure is shown below as a muted reference

#### Scenario: CTA enrolls, never "buys"
- **WHEN** the user presses the primary CTA
- **THEN** the label reads "Đăng ký học" / "Enroll" and routes to the course enroll flow
- **AND** no "buy"/"VIP" copy or membership upsell is shown

#### Scenario: Syllabus preview with durations and premium markers
- **WHEN** the syllabus renders
- **THEN** chapters expand and collapse (first chapter open by default)
- **AND** each lesson shows its duration, and premium lessons show a lock + a "Premium" chip

#### Scenario: Loading and error states
- **WHEN** the course data is loading
- **THEN** a skeleton mirroring the two-column layout is shown
- **WHEN** loading fails with no cached data
- **THEN** an error state with a retry action is shown
