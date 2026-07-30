# home-landing — Delta

## MODIFIED Requirements

### Requirement: Thành tựu FTES achievements section
The landing SHALL render a "Thành tựu" section — real FTES company recognitions and
milestones (awards, competition placements, scholarships and public events ported from the
legacy home) — in the journey slot formerly occupied by the stage-cards module showcase, and
SHALL NOT render the old "what each stage gives you" module-showcase cards.

The section SHALL present the milestones as a horizontal **carousel of milestone cards**
(several cards visible per viewport, scroll/swipe-able), built on the shared `useCarousel`
block hook (native CSS scroll-snap, no carousel dependency) — NOT as a static grid of
number tiles. Each milestone card SHALL show, in this shape:

- a **cover image** of the real event/award when one exists, rendered at a uniform aspect
  ratio; milestones without an image SHALL fall back to an icon tile of the same size (the
  card SHALL NOT be dropped and no image SHALL be fabricated);
- the milestone **year as a badge overlaid on the cover**, and — for ranked recognitions —
  the language-neutral highlight value rendered as-is (a rank or percentage string such as
  "Top 100" or "100%", NOT an animated numeric KPI counter);
- a localized **title** and a short localized **description**;
- a **"Xem chi tiết" link that opens the original public evidence** (Facebook post / press
  article) in a new tab with `rel="noopener"`, for every milestone that has one; milestones
  with no public evidence SHALL simply omit the link (no placeholder or dead `#` link).

The section SHALL cover at least these ten milestones: Techfest Vietnam 2025 (Top 100
outstanding startups), Startup Gia Lai 2025 (Top 4), Innovation Quest 2025 (Top 30), Gia Lai
Startup & Innovation Contest (Top 3), FPT University startup scholarship (100%), AI
assistants (5), Open Day, Tech Talent Showcase (TTSG), first fundraising round, and Demo Day.
The figures SHALL be distinct from the live course/enrollment counters
(PlatformStatsSection) and the per-learner honor board (HonorBoardSection) — no figure is
duplicated.

On viewports from `sm` up the carousel SHALL show several cards at once (up to three from
`lg`) with previous/next controls flanking the track; on phones it SHALL show one card with
a peek of the next and rely on the native horizontal swipe, and the page itself SHALL NOT
scroll horizontally at any viewport.

The carousel SHALL provide previous/next controls that navigate the track and autoplay that
advances every few seconds and wraps past the end, SHALL pause autoplay on pointer hover,
keyboard focus-within and while the tab is hidden, and SHALL disable autoplay entirely under
`prefers-reduced-motion`. It SHALL follow the WAI-ARIA carousel pattern: a labeled region
with `aria-roledescription="carousel"`, ArrowLeft/ArrowRight navigation on the region, and
labeled controls.

#### Scenario: Achievements replace the stage cards
- **WHEN** the landing renders
- **THEN** the "Thành tựu" achievements section renders in the slot between the platform
  stats and the offers/policy sections
- **AND** the former module-showcase ("what each stage gives you") cards are not rendered

#### Scenario: Milestone cards show image, year, title and description
- **WHEN** the achievements section renders
- **THEN** each milestone renders as a card whose cover is the real event image (or an icon
  fallback tile when the milestone has no image), with the milestone year, a localized title
  and a short localized description
- **AND** ranked recognitions additionally show their highlight value printed verbatim
  (e.g. "Top 100", "100%")
- **AND** no highlight value animates or counts up

#### Scenario: Evidence link opens the original post
- **GIVEN** a milestone that has public evidence (a Facebook post or press article)
- **WHEN** the user activates its "Xem chi tiết" link
- **THEN** the original evidence URL opens in a new tab with `rel="noopener"`
- **AND** milestones without evidence render no such link and no placeholder link

#### Scenario: Carousel advances and can be driven manually
- **WHEN** the section renders and nothing is hovered or focused
- **THEN** the track advances on its own every few seconds, wrapping from the last milestone
  back to the first
- **AND** clicking the next/previous control or pressing ArrowRight/ArrowLeft on the region
  scrolls the track accordingly

#### Scenario: Autoplay pauses and respects motion preference
- **WHEN** the pointer hovers the carousel, focus moves inside it, or the tab is hidden
- **THEN** autoplay pauses until the condition clears
- **AND** under `prefers-reduced-motion` autoplay never runs and programmatic scrolls are
  instant

#### Scenario: Card count adapts to the viewport without breaking the page
- **WHEN** the landing is viewed on a desktop viewport (≥ 1024 px)
- **THEN** about three milestone cards are visible per track width, with the previous/next
  controls flanking the track
- **AND** on a phone viewport one card plus a peek of the next is visible, the arrows are
  hidden in favour of the native swipe, and the document does not scroll horizontally

#### Scenario: Milestone images are shipped web-sized
- **WHEN** the achievements section loads its cover images
- **THEN** each image is served from the app's own public assets, downscaled and compressed
  for web delivery (no multi-megabyte originals)
- **AND** cover images load lazily
