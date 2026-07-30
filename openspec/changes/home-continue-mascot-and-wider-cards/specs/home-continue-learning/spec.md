# home-continue-learning — Delta

## MODIFIED Requirements

### Requirement: Mascot greeting sits directly below the Continue-learning band
The signed-in Home landing (`HomeLanding`) SHALL render the FrosTES mascot greeting
(`HomeMascotGreeting`) **INSIDE the "Continue learning" band (`MyCoursesSection`), between
the band heading and the course cards** — reading order: eyebrow → "Tiếp tục học" heading →
mascot greeting → course cards. It SHALL NOT render as a separate full-width band of its own
while the Continue-learning band is present, and it SHALL NOT sit inside the hero.

When the Continue-learning band self-hides (anonymous visitor, or a signed-in viewer with no
active published enrollment), the mascot greeting SHALL still render in its own band after
the hero, with the same copy/personalization as today. The page SHALL keep **exactly one**
mascot in every case — never two, never none.

#### Scenario: Signed-in learner with courses sees the mascot under the band heading
- **WHEN** a signed-in learner with at least one active, published enrollment opens the Home
  landing
- **THEN** the "Continue learning" band renders after the hero
- **AND** inside that band the mascot greeting bubble appears below the band heading and
  above the course cards
- **AND** no separate mascot band renders anywhere else on the page

#### Scenario: Guest still sees a single mascot greeting
- **WHEN** an anonymous visitor opens the Home landing
- **THEN** the "Continue learning" band self-hides (no enrollments)
- **AND** the mascot greeting still renders (guest copy) after the hero, remaining the only
  mascot on the page

### Requirement: Continue-learning cards show the course cover image
Each course card in the Home "Continue learning" band SHALL display the course cover image
via the shared `CoverImage` block (framed 16:9, rounded, `object-cover`), sourced from the
enrollment's `imageHeader` field mapped onto `MyCourse.coverImage`. When the course has no
cover image (null/absent), the card SHALL degrade gracefully to an empty framed surface
rather than a broken image, and the card's existing spacing SHALL be preserved.

The band SHALL lay the cards out so that **the course title and the "% complete" subtitle are
actually readable** — the band SHALL NOT pack so many cards per row that the text column is
squeezed to nothing by the fixed-width thumbnail and the call-to-action label. Concretely the
band SHALL show at most **two cards per row** on any viewport, and a course title too long for
one line SHALL wrap onto a second line rather than being cut off with an ellipsis.

#### Scenario: Card with a cover renders the thumbnail
- **WHEN** the Continue-learning band renders a course whose enrollment carries a non-null
  `imageHeader`
- **THEN** the card shows that image as a fixed-width 16:9 rounded thumbnail on its info row
- **AND** the title, "% complete" subtitle, "Continue learning" link and progress bar remain
  unchanged

#### Scenario: Card without a cover degrades gracefully
- **WHEN** the Continue-learning band renders a course whose enrollment has no `imageHeader`
  (null or the BE build omits it)
- **THEN** the card shows an empty framed cover surface (no broken image)
- **AND** the card layout and spacing are unchanged

#### Scenario: Course titles are readable, not truncated away
- **WHEN** the Continue-learning band renders on a desktop viewport
- **THEN** at most two cards share a row
- **AND** each card's title text is laid out wide enough to show the course name (not clipped
  to a few pixels by the thumbnail and CTA label)

#### Scenario: A long course name wraps to a second line
- **GIVEN** a course whose name does not fit on one line of the card
- **WHEN** its card renders
- **THEN** the name wraps onto a second line (two-line clamp)
- **AND** it is not cut off after a single line with an ellipsis
