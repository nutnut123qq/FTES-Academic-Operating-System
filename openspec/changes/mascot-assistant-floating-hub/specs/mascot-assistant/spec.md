# mascot-assistant (delta)

## ADDED Requirements

### Requirement: The floating mascot is the site-wide AI entry point

A floating FrosTES mascot SHALL be mounted once in the app shell so it appears on every page,
fixed to the bottom-right corner, at a z-index above page content but below any open modal or
dialog. It SHALL sit above the safe-area inset and SHALL NOT affect page layout or CLS. The
character artwork itself is the button — no circular frame, no background plate, no rounding
applied to the image.

The character SHALL PEEK rather than stand: it LEANS and is pushed diagonally into the corner so
the viewport edge crops it, keeping head, waving paw and the shirt-front on screen while the legs
go off it. It SHALL sit FLUSH in the corner — the push absorbs the shell's own inset, so the
character's own pixels reach the screen edge even though the panel keeps its margin from it.

Flushness SHALL be measured on the rows that are actually VISIBLE, not on the whole silhouette:
the widest part of the body is the hips, which are cropped away, so fitting to the full outline
leaves the visible head and chest short of the corner with a gap at the very tip of it.

The part pushed past the edge SHALL NOT make the page scrollable, and the shortcut panel SHALL
still open flush above the VISIBLE top of the character, not above the slot it was cropped out of.

#### Scenario: The mascot reads as peeking in from the corner

- **WHEN** the visitor looks at the bottom-right corner of any page
- **THEN** the character is cropped below the chest — head, waving paw and shirt-front visible,
  legs off-screen — sitting flush in the corner with no horizontal scrollbar

#### Scenario: The panel stays attached to the visible character

- **WHEN** the panel opens
- **THEN** it sits directly above the character's visible top rather than leaving a gap the size
  of the cropped-away part

The mascot SHALL stand down on the routes that already own the bottom-right corner with a
lesson-scoped floating entry point, so two AI buttons never share the screen.

#### Scenario: Mascot appears on every page

- **WHEN** the visitor opens any page of the site
- **THEN** the mascot renders fixed in the bottom-right corner without shifting any page content

#### Scenario: Mascot yields the corner to the lesson reader

- **WHEN** the visitor opens a lesson reader route (`/courses/<id>/learn/...`), which already has
  its own grounded-chat floating button
- **THEN** the mascot does not render, so only one AI entry point occupies the corner

#### Scenario: Mascot stays clear of the cookie banner

- **GIVEN** the cookie-consent bar is still up, occupying the same bottom band and z-layer
- **WHEN** the mascot renders
- **THEN** it is lifted above the bar rather than hidden, so the Accept / Reject buttons stay
  clickable

### Requirement: Mascot artwork is an animated WebP with an animated GIF fallback

The mascot SHALL be served through a `<picture>` element offering an animated WebP source with an
animated GIF fallback, so browsers without animated-WebP support still see the waving character.
It SHALL NOT be rendered through the framework image component, which would flatten the animation
to a single frame and cannot express the fallback. The WebP SHALL be preloaded so the mascot is
present on first paint rather than popping in late.

The waving motion belongs to the artwork; CSS SHALL NOT simulate a wave. CSS SHALL add only a
gentle 4–6px vertical bob (~3s loop), and that bob SHALL be disabled under
`prefers-reduced-motion: reduce`.

#### Scenario: A modern browser gets the WebP

- **WHEN** a browser that supports animated WebP loads the page
- **THEN** the mascot image resolves to the `.webp` source and loops its waving animation

#### Scenario: Reduced motion stops the bob

- **GIVEN** the visitor has `prefers-reduced-motion: reduce` set
- **WHEN** the mascot renders
- **THEN** the vertical bob and the panel open animation are disabled

### Requirement: Hovering, tapping or keying the mascot opens the AI shortcut panel

The mascot SHALL open a panel of AI shortcuts above itself on mouse hover, on tap, and on
Enter/Space from the keyboard, animating open with a scale + fade of roughly 200ms. Hover-to-open
SHALL be bound to mouse pointers only, so a touch tap does not both hover and click and cancel
itself out. The panel SHALL close on Escape, on a pointer press outside it, when focus leaves the
assistant, and on navigation.

The mascot SHALL expose an accessible name, its expanded state and the id of the panel it
controls; the panel SHALL be a labelled navigation region whose options are reachable by keyboard
in visual order.

Leaving with the mouse SHALL NOT close the panel outright: it SHALL arm a short grace period,
which entering either the character or the panel cancels. The gap between the two is not
hoverable (the shell must stay click-through), so an immediate close makes the panel unreachable —
the pointer's natural diagonal travel from character to panel crosses dead space. The grace
period applies to mouse input only; touch, which has no "pointer left", is unaffected.

#### Scenario: Mouse hover opens, leaving closes after a grace period

- **WHEN** a visitor moves a mouse pointer onto the mascot and then away without reaching the panel
- **THEN** the panel stays up for the grace period and then closes on its own

#### Scenario: The pointer can cross the gap into the panel

- **WHEN** the visitor leaves the character and moves onto the panel within the grace period
- **THEN** the pending close is cancelled and the panel stays open for as long as the pointer
  rests on it

#### Scenario: A touch tap opens the panel and keeps it open

- **WHEN** a visitor taps the mascot on a touch device
- **THEN** the panel opens and stays open until they tap outside it or press its close control

#### Scenario: Escape and outside press close the panel

- **WHEN** the panel is open and the visitor presses Escape, or presses anywhere outside the
  assistant
- **THEN** the panel closes

### Requirement: The panel carries every AI feature, phrased as an invitation

The panel SHALL list the complete AI feature roster of the site — one row per feature, matching
the AI hub's tool catalog plus the CV builder — with each row phrased as a friendly suggestion
("Bạn muốn tạo lộ trình học không?") over a short description, and activating a row SHALL open
that feature's existing surface. No AI feature that exists in the hub may be missing from the
panel.

The roster SHALL be a static list rather than a quota-gated fetch, because a hover panel must not
wait on the network and every listed route exists regardless of remaining quota. Inside a subject
workspace the panel SHALL instead offer that subject's AI toolbox.

Because the panel can be taller than a short window, the shell SHALL be height-bounded so the row
list takes the space actually left above the mascot and scrolls within it, instead of overflowing
past the top of the viewport.

#### Scenario: Every hub tool is reachable from the mascot

- **WHEN** the visitor opens the panel on any ordinary page
- **THEN** it lists the AI hub, study planner, summariser, flashcards, quiz generator, code
  debugger, CV builder and CV review, each linking to its own surface

#### Scenario: The panel fits a short window

- **GIVEN** a viewport only 720px tall and the cookie bar lifting the assistant
- **WHEN** the panel opens
- **THEN** the whole panel stays inside the viewport and its row list scrolls internally

#### Scenario: Subject workspace swaps the roster

- **WHEN** the visitor opens the panel inside a subject workspace route
- **THEN** the panel offers that subject's AI tools instead of the site-wide roster

### Requirement: The mascot floats an occasional proactive bubble

The mascot SHALL float a small speech bubble above itself with a randomly chosen friendly line,
first appearing 30–60 seconds into a visit and then at random 3–5 minute gaps. A bubble SHALL
disappear on its own after about 8 seconds, and clicking it SHALL open the shortcut panel. No
bubble SHALL appear while the panel is open or on a page where the mascot itself does not render.

At most 3 bubbles SHALL appear per visit, counted in memory for the lifetime of the page session
(no persistent storage), and the count SHALL survive the assistant remounting during client-side
navigation so browsing many pages cannot multiply the allowance.

#### Scenario: First bubble invites interaction

- **WHEN** a visitor has been on the site for 30–60 seconds without opening the panel
- **THEN** a bubble appears above the mascot with one of the friendly lines and hides itself after
  about 8 seconds

#### Scenario: Clicking the bubble opens the panel

- **WHEN** the visitor clicks a bubble
- **THEN** the bubble disappears and the AI shortcut panel opens

#### Scenario: Bubbles stop after three

- **WHEN** three bubbles have already been shown during the visit
- **THEN** no further bubble appears, however long the visitor stays or however many pages they
  browse
