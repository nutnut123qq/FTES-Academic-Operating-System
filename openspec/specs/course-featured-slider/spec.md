# course-featured-slider Specification

## Purpose
TBD - created by archiving change course-catalog-hero-slider. Update Purpose after archive.
## Requirements
### Requirement: Featured hero slider at the top of the course catalog
The `/courses` catalog page SHALL render a full-width featured-courses hero slider ABOVE the existing search + level filter + grid. Each slide SHALL show the course cover image, course code + title, a level chip, the price, a short pitch, and a CTA linking to that course's detail page (`/courses/[id]`). Data comes from a mock SWR hook `useQueryFeaturedCoursesSwr` (3–5 courses) until the BE contract lands. The catalog behavior below the slider (search, level filter, grid) MUST remain unchanged.

#### Scenario: Slider renders above the unchanged catalog
- **GIVEN** the featured-courses mock resolves 4 courses
- **WHEN** a user opens `/courses`
- **THEN** a full-width hero slider with 4 slides renders above the catalog title/search/filter/grid
- **AND** searching and level-filtering the grid behave exactly as before

#### Scenario: Slide content and CTA
- **WHEN** a slide is visible
- **THEN** it shows the cover image, course code + title, level chip, price, and short pitch
- **AND** pressing the slide CTA navigates to `/courses/[id]` for that course

### Requirement: Autoplay with pause on hover and focus
The slider SHALL auto-advance to the next slide every ~5 seconds when it has 2+ slides. Autoplay MUST pause while the pointer hovers the slider or any element inside it has keyboard focus, and MUST resume when both end. On the last slide, autoplay SHALL wrap to the first slide.

#### Scenario: Auto-advance
- **GIVEN** the slider shows slide 1 of 4 and the user is not interacting
- **WHEN** ~5 seconds elapse
- **THEN** the slider moves to slide 2 and the active dot updates

#### Scenario: Pause on hover, resume on leave
- **WHEN** the pointer enters the slider
- **THEN** auto-advance stops
- **WHEN** the pointer leaves
- **THEN** auto-advance resumes

#### Scenario: Pause while focused
- **WHEN** any control inside the slider (arrow, dot, CTA) has keyboard focus
- **THEN** auto-advance stops until focus leaves the slider

#### Scenario: Wrap from last slide
- **GIVEN** the slider is on the last slide
- **WHEN** autoplay ticks (or the user presses next)
- **THEN** the slider returns to slide 1

### Requirement: Manual navigation via arrows and dots
The slider SHALL render previous/next arrow buttons and one dot per slide. Activating an arrow SHALL move one slide in that direction (wrapping at the ends); activating a dot SHALL jump to that slide. The active dot MUST reflect the currently visible slide, including after user swipes.

#### Scenario: Arrow navigation
- **GIVEN** slide 2 is visible
- **WHEN** the user presses the previous arrow
- **THEN** slide 1 becomes visible and its dot becomes active

#### Scenario: Dot navigation
- **WHEN** the user presses the dot for slide 3
- **THEN** the slider scrolls to slide 3 and that dot becomes active

### Requirement: Touch swipe on mobile
On touch devices the slide track SHALL be swipeable: a horizontal swipe moves to the adjacent slide and snaps it fully into view (CSS scroll-snap). Dots MUST stay in sync with the slide settled by the swipe.

#### Scenario: Swipe to next slide
- **GIVEN** a touch viewport showing slide 1
- **WHEN** the user swipes left on the track
- **THEN** slide 2 snaps into view and its dot becomes active

### Requirement: Keyboard navigation
With focus inside the slider region, pressing ArrowRight SHALL go to the next slide and ArrowLeft to the previous slide. All controls (arrows, dots, CTA) MUST be reachable in the Tab order and operable with Enter/Space.

#### Scenario: Arrow keys change slides
- **GIVEN** the slider region (or a control inside it) has focus on slide 1
- **WHEN** the user presses ArrowRight
- **THEN** slide 2 becomes visible

#### Scenario: Controls are keyboard-operable
- **WHEN** the user Tabs through the slider
- **THEN** prev/next arrows, each dot, and the slide CTA receive focus and activate with Enter/Space

### Requirement: Reduced motion disables autoplay
When the user agent reports `prefers-reduced-motion: reduce`, the slider MUST NOT autoplay and programmatic slide changes SHALL use non-smooth (instant) scrolling. Manual navigation (arrows, dots, swipe, keyboard) MUST remain available.

#### Scenario: No autoplay under reduced motion
- **GIVEN** the OS setting prefers reduced motion
- **WHEN** the user opens `/courses` and waits
- **THEN** the slider stays on slide 1 until the user navigates manually

### Requirement: Single-slide and empty fallbacks
With exactly one featured course, the slider SHALL render that slide as a static hero: no autoplay, no arrows, no dots. With zero featured courses (or a fetch error and no cached data), the slider section SHALL be hidden entirely and the catalog renders as today.

#### Scenario: Single slide is static
- **GIVEN** the mock resolves 1 featured course
- **WHEN** the catalog renders
- **THEN** the hero shows that course without arrows, dots, or auto-advance

#### Scenario: Empty list hides the section
- **GIVEN** the mock resolves 0 featured courses
- **WHEN** the catalog renders
- **THEN** no hero region, skeleton, or empty placeholder is shown above the catalog

### Requirement: Loading skeleton
While featured courses are loading, the slider area SHALL show a skeleton that mirrors the real slider box (same aspect ratio/height plus a dot row), built with the HeroUI Skeleton primitive. The catalog below MUST render independently of the slider's loading state.

#### Scenario: Skeleton mirrors the hero box
- **WHEN** the featured query is in flight
- **THEN** a skeleton with the hero's dimensions and a dot row renders in place of the slider
- **AND** the search/filter/grid below are not blocked by it

### Requirement: Localization of slider copy
All slider strings (region label, slide position label, arrow/dot accessible names, CTA label, pitch text source) SHALL come from i18n messages under `courseSystem.featured.*` with both `vi` and `en` translations. Prices SHALL render in the house VND-primary format.

#### Scenario: Locale switch
- **WHEN** the user views `/courses` in vi and then in en
- **THEN** the CTA, accessible labels, and pitches render in the active locale with no hard-coded strings

### Requirement: Carousel accessibility semantics
The slider SHALL follow the WAI-ARIA carousel pattern: the wrapper exposes `role="region"`, `aria-roledescription="carousel"`, and a localized `aria-label`; each slide exposes `role="group"`, `aria-roledescription="slide"`, and an `aria-label` of the form "i / N"; arrows and dots are buttons with localized `aria-label`s and the active dot exposes its selected state.

#### Scenario: Screen reader announces the carousel
- **WHEN** a screen reader enters the slider
- **THEN** it announces a localized carousel region and, per slide, "slide i of N" with the course title
- **AND** every control has an accessible name
