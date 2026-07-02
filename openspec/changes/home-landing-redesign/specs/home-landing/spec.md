## ADDED Requirements

### Requirement: Hero with 3D user-flow scene
The landing hero SHALL present, alongside the existing headline and CTAs, a 3D scene
(react-three-fiber) that narrates the user journey through the product as six ordered
stages: Đăng ký (sign up) → Subject Workplace → Học Course → Luyện tập / AI → Cộng
đồng → Vinh danh / Career. The scene MUST be a guided, staged interaction (stage
stepper with camera transitions), NOT free orbit and NOT scroll-hijacking. Stage
labels and one-line descriptions MUST come from i18n and MUST also be rendered as
regular DOM text (crawlable) independent of the WebGL canvas.

#### Scenario: Journey stages are presented in order
- **GIVEN** a visitor on `/[locale]` with WebGL available and no reduced-motion preference
- **WHEN** the hero 3D scene has loaded
- **THEN** the scene shows six connected stations representing Đăng ký → Workplace →
  Course → Luyện tập/AI → Cộng đồng → Vinh danh/Career
- **AND** one stage is highlighted as active with its label and description visible as DOM text

#### Scenario: Visitor steps through the journey
- **WHEN** the visitor activates a stage in the stepper (click, tap, or keyboard)
- **THEN** the camera transitions to that stage's station and it becomes highlighted
- **AND** the corresponding stage text updates
- **AND** any auto-advance stops after this manual selection

#### Scenario: Auto-advance pauses on engagement
- **GIVEN** the scene is auto-advancing through stages
- **WHEN** the visitor hovers or focuses the scene or stepper
- **THEN** auto-advance pauses until the pointer/focus leaves

### Requirement: 3D scene loading, SSR safety, and fallbacks
The 3D scene SHALL be client-only (dynamic import with SSR disabled) and lazy-loaded,
and SHALL degrade to a static illustration of the same six stages. three.js MUST NOT
be imported in any server-rendered module (the webpack `npm run build` must stay
green). The page's narrative text MUST NOT depend on WebGL.

#### Scenario: Scene never renders on the server
- **WHEN** `/[locale]` is server-rendered
- **THEN** the HTML contains the hero text and the journey stage texts
- **AND** contains no three.js output; the canvas hydrates client-side only

#### Scenario: Scene loads lazily
- **WHEN** the landing first paints
- **THEN** the three.js chunk is not part of the initial bundle
- **AND** while the chunk loads, the static fallback illustration occupies the scene slot (no layout shift)

#### Scenario: Reduced motion gets a static scene
- **GIVEN** the visitor has `prefers-reduced-motion: reduce`
- **WHEN** the hero renders
- **THEN** the static stage illustration renders instead of the animated 3D canvas
- **AND** stage content remains fully readable and navigable

#### Scenario: Mobile gets the static fallback
- **GIVEN** a viewport below the `lg` breakpoint
- **WHEN** the hero renders
- **THEN** the static illustration renders instead of the WebGL canvas

#### Scenario: WebGL failure does not break the page
- **WHEN** WebGL context creation fails or the canvas throws
- **THEN** an error boundary swaps in the static fallback
- **AND** the rest of the landing renders normally

#### Scenario: Performance budget respected
- **WHEN** the 3D scene is idle (no transition running)
- **THEN** it does not render continuous frames (demand frameloop)
- **AND** device pixel ratio is clamped (max 2) and the scene disposes GPU resources on unmount

### Requirement: Platform stats strip
The landing SHALL show a stats strip with four platform counts — người dùng (users),
tài nguyên (resources), khóa học (courses), cộng đồng (communities) — fetched through
a mock SWR hook `useQueryPlatformStatsSwr` (BE `platformStats` query assumed; mock
data until it exists, assumption recorded in code). Counts SHALL animate as a
count-up when first scrolled into view, except under reduced motion.

#### Scenario: Stats render with count-up
- **GIVEN** the stats query has resolved
- **WHEN** the strip enters the viewport for the first time
- **THEN** each of the four stats animates from 0 to its value with a localized label

#### Scenario: Stats loading state
- **WHEN** the stats query is still loading
- **THEN** the strip shows skeleton placeholders matching the final layout (no layout shift)

#### Scenario: Stats failure hides gracefully
- **WHEN** the stats query errors or returns no data
- **THEN** the strip renders nothing (no broken zeros, no error banner on marketing page)

#### Scenario: Reduced motion skips count-up
- **GIVEN** `prefers-reduced-motion: reduce`
- **WHEN** the strip enters the viewport
- **THEN** final values render immediately without animation

### Requirement: AI features showcase
The landing SHALL include a section showcasing the platform's AI features (at minimum:
AI tutor chat, AI grading/feedback, personalized recommendations) as cards with icon,
title, and description rendered as crawlable text.

#### Scenario: AI features are presented
- **WHEN** a visitor scrolls to the AI section
- **THEN** they see a section heading and one card per AI feature (icon + title + description)
- **AND** all copy is plain DOM text in the active locale

### Requirement: FTES team section
The landing SHALL include a section presenting the FTES team from mock data, each
member with avatar, name, and role.

#### Scenario: Team members render
- **WHEN** the team section renders
- **THEN** each mock team member shows avatar image (with alt text = name), name, and role
- **AND** the grid wraps responsively on narrow viewports

#### Scenario: Missing avatar falls back
- **WHEN** a team member has no avatar asset
- **THEN** a placeholder avatar renders in its place

### Requirement: Bảng vàng FTES honor section
The landing SHALL include a "Bảng vàng FTES" section honoring top learners (mock
data: avatar, name, achievement) and SHALL link to the full leaderboard at
`/leaderboard`.

#### Scenario: Honored learners render
- **WHEN** the honor section renders
- **THEN** top learners appear with avatar, name, and achievement text
- **AND** a link/CTA navigates to `/leaderboard` (locale-aware navigation)

#### Scenario: Empty honor list hides the section body
- **GIVEN** the mock honor list is empty
- **WHEN** the landing renders
- **THEN** the honor section is not rendered

### Requirement: Course purchase and policy section
The landing SHALL include a purchase section with a primary CTA routing to `/courses`
and a course policy list (mock i18n content, at minimum: chính sách hoàn tiền, hỗ trợ
học viên, truy cập trọn đời).

#### Scenario: Purchase CTA routes to courses
- **WHEN** the visitor activates the purchase CTA
- **THEN** they navigate to `/courses` via locale-aware navigation

#### Scenario: Policies are readable
- **WHEN** the purchase section renders
- **THEN** each policy item shows an icon, title, and description as plain text in the active locale

### Requirement: Landing localization, accessibility, and SEO
All new landing sections SHALL be fully localized in Vietnamese and English under
`homeLanding.*`, keyboard-accessible, and crawlable: every section's meaning MUST be
conveyed by DOM text and semantic headings, never only by canvas, animation, or image.

#### Scenario: Locale switch localizes every section
- **WHEN** the visitor switches between `vi` and `en`
- **THEN** hero, flow stages, stats labels, AI, team roles, honor, and policy copy all render in the selected locale with no hardcoded strings

#### Scenario: Keyboard-only journey
- **WHEN** a visitor navigates the landing by keyboard
- **THEN** the stage stepper, all CTAs, and all links are focusable in document order with visible focus
- **AND** the 3D canvas itself is not a focus trap

#### Scenario: Sections are crawlable
- **WHEN** the page HTML is inspected without JavaScript-rendered WebGL
- **THEN** each section exposes a semantic heading and its copy as text (stats section may render after fetch; its heading is static)
