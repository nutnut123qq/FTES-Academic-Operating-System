# course-detail Specification

## Purpose
TBD - created by archiving change course-detail-sales-layout. Update Purpose after archive.
## Requirements
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

### Requirement: Instructor profile card
The course detail page SHALL render a rich instructor profile card in the left content column, replacing the previous minimal name/title/bio block.

#### Scenario: Instructor card shows identity and credibility
- **WHEN** the instructor section renders
- **THEN** it displays the instructor avatar with a fallback to initials, the instructor name, and a role line
- **AND** it shows three headline stats: courses taught, total students, and average rating
- **AND** it shows a 2–3 sentence bio
- **AND** it lists credentials/achievements with icons
- **AND** it provides working social links (GitHub, LinkedIn, website) that open in a new tab with accessible labels
- **AND** it provides a follow/unfollow toggle button

#### Scenario: Missing optional fields degrade gracefully
- **WHEN** the instructor has no avatar URL
- **THEN** the avatar falls back to generated default or initials
- **AND** when any social link is absent, that icon is not rendered

#### Scenario: Follow action is FE-only until BE contract lands
- **WHEN** the user presses the follow/unfollow button
- **THEN** the button toggles its visual state immediately
- **AND** the interaction is mocked locally; no BE request is made

