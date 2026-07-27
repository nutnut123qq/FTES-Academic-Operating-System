# home-landing — Delta

## ADDED Requirements

### Requirement: Thành tựu FTES achievements section
The landing SHALL render a "Thành tựu" section — real FTES company recognitions (awards,
competition placements and scholarships ported from the legacy home) — in the journey slot
formerly occupied by the stage-cards module showcase, and SHALL NOT render the old
"what each stage gives you" module-showcase cards. Each achievement SHALL be an award card
showing an icon, a language-neutral highlight value rendered as-is (a rank or percentage
string such as "Top 100" or "100%" — NOT an animated numeric KPI counter), and a localized
label. The section SHALL cover at least: Techfest Vietnam 2025 (Top 100 outstanding startups),
Startup Gia Lai 2025 (Top 4), Innovation Quest 2025 (Top 30), Gia Lai Startup & Innovation
Contest (Top 3), FPT University startup scholarship (100%), and AI assistants (5). The
figures SHALL be distinct from the live course/enrollment counters (PlatformStatsSection)
and the per-learner honor board (HonorBoardSection) — no figure is duplicated.

#### Scenario: Achievements replace the stage cards
- **WHEN** the landing renders
- **THEN** the "Thành tựu" achievements section renders in the slot between the platform
  stats and the offers/policy sections
- **AND** the former module-showcase ("what each stage gives you") cards are not rendered

#### Scenario: Award cards show a value and label
- **WHEN** the achievements section renders
- **THEN** each of the FTES recognitions renders as a card with an icon, its highlight
  value printed verbatim (e.g. "Top 100", "100%"), and a localized label
- **AND** no highlight value animates or counts up

### Requirement: Đội ngũ FTES testimonials carousel
The landing "Đội ngũ FTES" section SHALL present the five real FTES mentors (founder
Nguyễn Anh Khoa first, then the team) as a self-advancing testimonial carousel — one
testimonial slide visible at a time, each a quote card with a byline (avatar, name, role,
optional social links, and a "view profile" link). The carousel SHALL be built on the
shared `useCarousel` block hook (native CSS scroll-snap, no carousel dependency) and SHALL
provide previous/next controls and per-slide dots that navigate the track, autoplay that
advances roughly every 6 seconds and wraps past either end, and SHALL pause autoplay on
pointer hover, keyboard focus-within, and while the tab is hidden, and SHALL disable
autoplay entirely under `prefers-reduced-motion`. The carousel SHALL follow the WAI-ARIA
carousel pattern: a labeled region with `aria-roledescription="carousel"`, ArrowLeft/
ArrowRight navigation on the region, labeled controls, an `aria-current` active dot, and
an `aria-live` that is off while autoplaying and polite otherwise.

#### Scenario: Five mentors advance automatically
- **WHEN** the testimonials section renders and nothing is hovered or focused
- **THEN** the founder's testimonial shows first and the carousel advances on its own about
  every 6 seconds, wrapping from the last mentor back to the first

#### Scenario: Manual controls navigate
- **WHEN** the user clicks the next/previous control, a dot, or presses ArrowRight/ArrowLeft
  on the region
- **THEN** the track scrolls to the corresponding testimonial and the active dot
  (`aria-current`) updates to match

#### Scenario: Autoplay pauses and respects motion preference
- **WHEN** the pointer hovers the carousel, focus moves inside it, or the tab is hidden
- **THEN** autoplay pauses until the condition clears
- **AND** under `prefers-reduced-motion` autoplay never runs and programmatic scrolls are instant

### Requirement: Mascot greeting as hero sign-off
The FrosTES mascot greeting SHALL render inside the landing hero BELOW the stage stepper
(not as a banner at the top of the page), at the small (`sm`) size, remaining the page's
single ambient mascot — a compact, persistent greeting that never blocks content, with a
personalized "welcome back" line for signed-in viewers and an invitation for guests.

#### Scenario: Greeting sits under the stepper
- **WHEN** the landing hero renders
- **THEN** the mascot greeting bubble appears below the hero stage stepper, not above the
  hero eyebrow/heading
- **AND** it renders at the small size as ambient hero chrome

#### Scenario: Personalized for signed-in viewers
- **GIVEN** the viewer is signed in
- **WHEN** the hero renders
- **THEN** the greeting shows a personalized welcome-back line
- **AND** guests instead see an invitation to explore
