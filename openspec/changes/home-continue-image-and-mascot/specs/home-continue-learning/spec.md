# home-continue-learning

## ADDED Requirements

### Requirement: Mascot greeting sits directly below the Continue-learning band
The signed-in Home landing (`HomeLanding`) SHALL render the FrosTES mascot greeting (`HomeMascotGreeting`) immediately AFTER the "Continue learning" band (`MyCoursesSection`), not inside the hero. The page SHALL keep exactly one mascot, and the greeting's copy/personalization SHALL be unchanged (pure reorder of sibling blocks). The sibling order SHALL be: hero (`JourneyHero`), then the Continue-learning band, then the mascot greeting, then the rest of the page.

#### Scenario: Signed-in learner with courses sees mascot below Continue learning
- **WHEN** a signed-in learner with at least one active, published enrollment opens the Home landing
- **THEN** the hero renders first without the mascot greeting inside it
- **AND** the "Continue learning" band renders after the hero
- **AND** the mascot greeting bubble renders immediately after the "Continue learning" band, above the platform-stats section

#### Scenario: Guest still sees a single mascot greeting, just relocated
- **WHEN** an anonymous visitor opens the Home landing
- **THEN** the "Continue learning" band self-hides (no enrollments)
- **AND** the mascot greeting still renders (guest copy) after the hero, remaining the only mascot on the page

### Requirement: Continue-learning cards show the course cover image
Each course card in the Home "Continue learning" band SHALL display the course cover image via the shared `CoverImage` block (framed 16:9, rounded, `object-cover`), sourced from the enrollment's `imageHeader` field mapped onto `MyCourse.coverImage`. When the course has no cover image (null/absent), the card SHALL degrade gracefully to an empty framed surface rather than a broken image, and the card's existing spacing SHALL be preserved.

#### Scenario: Card with a cover renders the thumbnail
- **WHEN** the Continue-learning band renders a course whose enrollment carries a non-null `imageHeader`
- **THEN** the card shows that image as a fixed-width 16:9 rounded thumbnail on its info row
- **AND** the title, "% complete" subtitle, "Continue learning" link and progress bar remain unchanged

#### Scenario: Card without a cover degrades gracefully
- **WHEN** the Continue-learning band renders a course whose enrollment has no `imageHeader` (null or the BE build omits it)
- **THEN** the card shows an empty framed cover surface (no broken image)
- **AND** the card layout and spacing are unchanged

### Requirement: Unpublished courses are excluded from Continue learning
The Home "Continue learning" data hook (`useQueryMyCoursesSwr`) SHALL exclude enrollments whose course is not published. The publish gate SHALL be defensive/permissive: an enrollment SHALL be treated as published UNLESS the backend positively indicates otherwise (a `published === false` boolean, or a `status` that is not `PUBLISHED`); when neither field is present the enrollment SHALL be kept (older backend, or a backend that already pre-filtered), so a missing flag never blanks the band. This FE filter complements a paired backend change that SHALL exclude unpublished courses from `GET /courses/me/enrollments` at the source and return the cover image (`imageHeader`) and a publish signal (`status` and/or `published`).

#### Scenario: A row flagged unpublished is filtered out on the FE
- **WHEN** `GET /courses/me/enrollments` returns an active enrollment whose course `status` is `DRAFT` (or `published` is `false`)
- **THEN** the Continue-learning hook drops that enrollment
- **AND** it does not appear as a card in the band

#### Scenario: Missing publish flag keeps the enrollment (no blank band)
- **WHEN** the backend build does not send `status` or `published` on the enrollment rows
- **THEN** the hook keeps every active enrollment (treated as published)
- **AND** the band renders exactly as before the change for that backend

#### Scenario: A published row is kept and carries its cover
- **WHEN** an active enrollment has `status` equal to `PUBLISHED` and a non-null `imageHeader`
- **THEN** the hook keeps it and maps `imageHeader` onto `MyCourse.coverImage`
- **AND** the card renders the cover thumbnail
