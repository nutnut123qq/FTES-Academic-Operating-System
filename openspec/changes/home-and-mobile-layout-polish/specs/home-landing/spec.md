# home-landing (delta)

## ADDED Requirements

### Requirement: Achievement cards link out to press coverage

An achievement milestone MAY carry a list of press articles, and the achievements carousel SHALL
render that list under the card's "view details" link. Each entry SHALL show the publication name and
the headline AS PUBLISHED, and SHALL open the article in a new tab with `rel="noopener noreferrer"`.

Publication names and headlines SHALL live in the content module, NOT in the i18n message files:
they are citation data (the source's own name and its published headline, verbatim Vietnamese), so
translating them would misquote the source. Only the section label around the list is localized.

Each headline SHALL be clamped to one line so a milestone with five articles does not make its card
taller than the others. A milestone with no coverage SHALL render no list and no empty label.

#### Scenario: Milestone with coverage but no FTES post

- **WHEN** a milestone has press articles but no public FTES post
- **THEN** the card renders the press list as its only evidence, with no "view details" link above it

#### Scenario: Milestone with both

- **WHEN** a milestone has both a public post and press articles
- **THEN** the "view details" link renders first and the press list under it

#### Scenario: Milestone with neither

- **WHEN** a milestone has no post and no press
- **THEN** the card footer renders nothing

### Requirement: Honor board content stays inside its card at phone widths

The "Bảng vàng" board (shared by the landing honor section and the standalone board page) SHALL keep
every name, headline and achievement line INSIDE its card at every width. Names and headlines SHALL
be allowed to wrap below `md` and SHALL step down one type size there; the headline's no-wrap
treatment SHALL apply from `md` upwards only. Cards SHALL allow their content box to shrink
(`min-w-0`) so a long uppercase name cannot push past the border.

Desktop rendering from `md` upwards SHALL be unchanged.

#### Scenario: Long uppercase name on a phone

- **WHEN** the board renders a full uppercase name on a narrow viewport, including the three-up
  podium at `sm`
- **THEN** the name wraps inside the card border instead of overflowing it

#### Scenario: Long headline

- **WHEN** an entry's headline is long (e.g. "CÓC VÀNG · SP25")
- **THEN** below `md` it wraps at a smaller size, and from `md` up it stays on one line as before

## MODIFIED Requirements

### Requirement: 3D scene loading, SSR safety, and fallbacks

The 3D scene SHALL be client-only (dynamic import with SSR disabled) and lazy-loaded, and SHALL
degrade to a static journey illustration (SVG with crawlable text labels) covering the same five
stations; reduced-motion MUST always receive the static version. three.js MUST NOT be imported in any
server-rendered module (the webpack `npm run build` must stay green). The journey narrative text MUST
NOT depend on WebGL.

Below the `lg` breakpoint the visual column SHALL NOT be VISIBLE at all: the hero's own stepper
already lists the same five stations, so showing the fallback illustration beside it made the phone
layout read the journey twice. The fallback node SHALL nevertheless stay MOUNTED and be hidden with
CSS only, so its crawlable station text remains in the server-rendered HTML.

#### Scenario: Scene never renders on the server

- **WHEN** `/[locale]` is server-rendered
- **THEN** the HTML contains the hero text and the journey stage texts
- **AND** contains no three.js output; the canvas hydrates client-side only

#### Scenario: Scene loads lazily

- **WHEN** the landing first paints at `lg` or wider
- **THEN** the three.js chunk is not part of the initial bundle
- **AND** while the chunk loads, the static fallback occupies the scene slot (no layout shift)

#### Scenario: Reduced motion gets the static journey

- **GIVEN** the visitor has `prefers-reduced-motion: reduce` on a viewport at `lg` or wider
- **WHEN** the hero renders
- **THEN** the static journey illustration renders instead of the animated 3D canvas
- **AND** all five stations and captions remain readable and navigable

#### Scenario: Mobile shows the journey exactly once

- **GIVEN** a viewport below the `lg` breakpoint
- **WHEN** the hero renders
- **THEN** the WebGL canvas is not mounted and the visual column is not visible
- **AND** the five stations are still readable from the hero stepper
- **AND** the fallback's station text is still present in the server-rendered HTML

#### Scenario: WebGL failure does not break the page

- **WHEN** WebGL context creation fails or the canvas throws
- **THEN** an error boundary swaps in the static fallback
- **AND** the rest of the landing renders normally

#### Scenario: Performance budget respected

- **WHEN** the 3D scene is idle (no transition or flow pulse running)
- **THEN** it does not render continuous frames (demand frameloop)
- **AND** device pixel ratio is clamped (max 2) and the scene disposes GPU resources on unmount

### Requirement: Ưu đãi và chính sách section

The landing SHALL include an "Ưu đãi & chính sách" section presenting FTES's real offer and policy
content, organized into the eight groups: Học viên mới, Lớp Live trên Zoom, Đăng ký nhóm, Học viên
cũ, Vinh danh & Học bổng, Lộ trình sau khóa học, Trả góp, Học thử & ưu đãi theo test. The verbatim
terms of each group are unchanged by this delta and remain as previously specified.

From `lg` upwards the section SHALL keep the tab rail plus one detail panel inside the showcase
mockup, with inactive panels hidden but MOUNTED.

Below `lg` the tab rail SHALL NOT render — eight chips wrapped into a ragged multi-line block that
pushed the panel off screen. The groups SHALL instead be a horizontally swipeable strip built from
plain CSS scroll-snap (no carousel library), with dots underneath that both report the current card
and move to a chosen one. The showcase mockup chrome SHALL be dropped on that path, because its 16:9
content box clips a four-line offer group at phone widths.

The group body (icon, title, bullet lines) SHALL be rendered from ONE shared component on both paths,
so the desktop panel and the mobile card cannot drift apart.

#### Scenario: All offer groups are reachable and readable

- **WHEN** the visitor opens the Ưu đãi & chính sách section
- **THEN** all eight content groups are reachable — via the tab rail at `lg`+, or by swiping/using the
  dots below `lg`
- **AND** each group's terms render as plain localized text matching the confirmed content

#### Scenario: Offer content is crawlable

- **WHEN** the server-rendered HTML of the landing is inspected
- **THEN** the text of every offer group is present in the DOM (inactive panels hidden, not unmounted)

#### Scenario: Phone reader swipes between groups

- **GIVEN** a viewport below `lg`
- **WHEN** the visitor swipes the strip
- **THEN** cards snap to centre, no group is clipped by a fixed-ratio box, and the dot row reflects
  the card that crosses the middle of the track

#### Scenario: Offer CTAs route to courses

- **WHEN** the visitor activates an enrollment CTA in this section
- **THEN** they navigate to `/courses` via locale-aware navigation
