## ADDED Requirements

### Requirement: Hero with 3D user-journey scene ending in the payoff
The landing hero SHALL present, alongside the headline and CTAs, a 3D scene
(react-three-fiber) that narrates the user's overall journey through the product as
five ordered stations: Home → Subject Workplace (workplace môn học) → Course (khóa
học) → Luyện tập / AI → **Thành quả** (dự án, vinh danh, career). The journey MUST
end on the "Thành quả" station as the narrative payoff, and that station MUST be
visually emphasized (e.g. glow / success tone / larger scale). Stations MUST be
connected with animated flow indicators showing direction of progression. The scene
MUST be a guided, staged interaction (stage stepper with captions and camera
transitions), NOT free orbit and NOT scroll-hijacking of the page. Stage labels and
captions MUST come from i18n and MUST also render as regular DOM text (crawlable)
independent of the WebGL canvas.

#### Scenario: Journey stations are presented in order with the payoff emphasized
- **GIVEN** a visitor on `/[locale]` with WebGL available and no reduced-motion preference
- **WHEN** the hero 3D scene has loaded
- **THEN** the scene shows five connected stations representing Home → Subject Workplace → Course → Luyện tập/AI → Thành quả
- **AND** animated flow indicators travel along the connections in journey order
- **AND** the final "Thành quả" station is visually distinct from the others (emphasis treatment)
- **AND** one stage is highlighted as active with its label and caption visible as DOM text

#### Scenario: Visitor steps through the journey to the payoff
- **WHEN** the visitor activates a stage in the stepper (click, tap, or keyboard)
- **THEN** the camera transitions to that stage's station and it becomes highlighted
- **AND** the corresponding caption text updates
- **AND** any auto-advance stops after this manual selection

#### Scenario: Auto-advance narrates the journey and pauses on engagement
- **GIVEN** the scene is auto-advancing through stages in journey order
- **WHEN** the visitor hovers or focuses the scene or stepper
- **THEN** auto-advance pauses until pointer/focus leaves
- **AND** when auto-advance reaches the final "Thành quả" stage it dwells there before looping

### Requirement: 3D scene loading, SSR safety, and fallbacks
The 3D scene SHALL be client-only (dynamic import with SSR disabled) and
lazy-loaded, and SHALL degrade to a static journey illustration (SVG with crawlable
text labels) covering the same five stations; on mobile a scrollytelling variant of
the journey MAY be used instead of the SVG, but reduced-motion MUST always receive
the static version. three.js MUST NOT be imported in any server-rendered module (the
webpack `npm run build` must stay green). The journey narrative text MUST NOT depend
on WebGL.

#### Scenario: Scene never renders on the server
- **WHEN** `/[locale]` is server-rendered
- **THEN** the HTML contains the hero text and the journey stage texts
- **AND** contains no three.js output; the canvas hydrates client-side only

#### Scenario: Scene loads lazily
- **WHEN** the landing first paints
- **THEN** the three.js chunk is not part of the initial bundle
- **AND** while the chunk loads, the static fallback occupies the scene slot (no layout shift)

#### Scenario: Reduced motion gets the static journey
- **GIVEN** the visitor has `prefers-reduced-motion: reduce`
- **WHEN** the hero renders
- **THEN** the static journey illustration renders instead of the animated 3D canvas
- **AND** all five stations and captions remain readable and navigable

#### Scenario: Mobile gets the non-WebGL journey
- **GIVEN** a viewport below the `lg` breakpoint
- **WHEN** the hero renders
- **THEN** the WebGL canvas is not mounted and the static illustration (or, without reduced motion, an optional scrollytelling journey) renders in its place

#### Scenario: WebGL failure does not break the page
- **WHEN** WebGL context creation fails or the canvas throws
- **THEN** an error boundary swaps in the static fallback
- **AND** the rest of the landing renders normally

#### Scenario: Performance budget respected
- **WHEN** the 3D scene is idle (no transition or flow pulse running)
- **THEN** it does not render continuous frames (demand frameloop)
- **AND** device pixel ratio is clamped (max 2) and the scene disposes GPU resources on unmount

### Requirement: Platform stats strip "Số liệu thật"
The landing SHALL show a "Số liệu thật" stats section — positioned as real data
updated from the system, not marketing fluff — with four platform counts: người dùng
(users), tài nguyên (resources), khóa học (courses), cộng đồng (communities),
fetched through a mock SWR hook `useQueryPlatformStatsSwr` (BE `platformStats` query
assumed; mock until it exists, assumption recorded in code). Counts SHALL animate as
a count-up when first scrolled into view, except under reduced motion. Below the
counts, the section SHALL list the platform's AI features (at minimum: AI tutor
chat, AI grading/feedback, personalized recommendations) as a row of text chips
rendered as crawlable DOM text.

#### Scenario: Stats render with count-up
- **GIVEN** the stats query has resolved
- **WHEN** the strip enters the viewport for the first time
- **THEN** each of the four stats animates from 0 to its value with a localized label and locale thousands separator

#### Scenario: AI feature chips render
- **WHEN** the stats section renders
- **THEN** a chips row lists the AI features as plain localized text
- **AND** the chips render regardless of the stats query state

#### Scenario: Stats loading state
- **WHEN** the stats query is still loading
- **THEN** the count area shows skeleton placeholders matching the final layout (no layout shift)

#### Scenario: Stats failure falls back gracefully
- **WHEN** the stats query errors or returns no data
- **THEN** the strip renders fallback values or hides the count row (no broken zeros, no error banner)

#### Scenario: Reduced motion skips count-up
- **GIVEN** `prefers-reduced-motion: reduce`
- **WHEN** the strip enters the viewport
- **THEN** final values render immediately without animation

### Requirement: Journey detail module showcase
The landing SHALL include a module showcase detailing the journey stops — what is
inside the Subject Workplace, what a Course contains, and what the Cộng đồng offers
— as cards with icon, title, description (crawlable text), each linking to its
module route via locale-aware navigation.

#### Scenario: Modules are presented with links
- **WHEN** a visitor scrolls to the module showcase
- **THEN** they see cards for at least Workplace, Course, and Cộng đồng with icon, title, and description as plain DOM text
- **AND** each card links to the corresponding module route

### Requirement: Ưu đãi và chính sách section
The landing SHALL include an "Ưu đãi & chính sách" section presenting FTES's real
offer and policy content, organized into groups (tabbed or card groups): Học viên
mới, Lớp Live trên Zoom, Đăng ký nhóm, Học viên cũ, Vinh danh & Học bổng, Lộ trình
sau khóa học, Trả góp, Học thử & ưu đãi theo test. The content MUST carry these
exact terms (Vietnamese primary):
- **Học viên mới**: Combo 800k–1.199k giảm 100k · Combo 1.200k–1.599k giảm 200k ·
  Combo trên 1.600k giảm 300k + tặng Cursor bản quyền.
- **Lớp Live trên Zoom**: học trực tiếp với Mentor, Mentor đồng hành suốt khóa, toàn
  quyền truy cập video lớp Basic trị giá 300k.
- **Đăng ký nhóm**: 2–4 người giảm 20%/người · 5–10 giảm 25%/người · trên 10 giảm
  35%/người.
- **Học viên cũ**: giới thiệu học viên mới tặng 100k + điểm thưởng (người giới thiệu
  70đ, người được giới thiệu 30đ) · đăng ký khóa tiếp theo giảm 5% · đặt trước khóa
  tiếp theo trong quá trình học giảm 10%.
- **Vinh danh & Học bổng**: Học Bá (cao điểm nhất toàn FTES) → free kì sau + thưởng
  2.000.000đ · Học chuyên cần (đủ buổi + đủ bài tập) → 10% · Học tốt (cao điểm nhất
  lớp) → free kì sau · Học bổng tài năng: 2.000.000đ + free tất cả khóa + cơ hội đào
  tạo làm dự án từ sau kì 5.
- **Lộ trình sau khóa học**: học xong đủ kiến thức làm dự án → tham gia phỏng vấn để
  được chọn vào lớp đào tạo dự án.
- **Trả góp**: 30–50% trả trước, còn lại hoàn thành trong 1 tháng; 50% → truy cập
  ngay bài giảng cũ + tài liệu; 40% → truy cập bài giảng cũ; 30% → không truy cập
  trước.
- **Học thử & ưu đãi theo test**: 2 buổi kiến thức nền miễn phí; điểm test 6–6.9 →
  giảm 10% · 7–8.9 → giảm 15% · 9–10 → giảm 30%.

#### Scenario: All offer groups are reachable and readable
- **WHEN** the visitor opens the Ưu đãi & chính sách section
- **THEN** all eight content groups are reachable (via tabs or visible card groups)
- **AND** each group's terms render as plain localized text matching the confirmed content

#### Scenario: Offer content is crawlable
- **WHEN** the server-rendered HTML of the landing is inspected
- **THEN** the text of every offer group is present in the DOM (inactive tab panels are hidden, not unmounted)

#### Scenario: Offer CTAs route to courses
- **WHEN** the visitor activates an enrollment CTA in this section
- **THEN** they navigate to `/courses` via locale-aware navigation

### Requirement: Bảng vàng FTES honor section
The landing SHALL include a "Bảng vàng FTES" section honoring real FTES achievers —
at minimum Kim Khoa (TOP 100 sinh viên xuất sắc 3 kỳ liên tiếp, GPA 9.35 – 9.42 –
9.1, Học Bá kì FA25), Hoàng Blue (GPA 9.4, danh hiệu Học Tốt + Học bổng Tài Năng),
Hoàng Duy (Top 100 FPTU TP.HCM, GPA 9.6), Hồng Phúc, Phan Chi Thông, Trần Việt —
each with avatar/image, name, and achievement lines, and SHALL link to the full
leaderboard at `/leaderboard`.

#### Scenario: Honored learners render
- **WHEN** the honor section renders
- **THEN** the achievers appear with image (alt text = name), name, and achievement text
- **AND** a link/CTA navigates to `/leaderboard` (locale-aware navigation)

#### Scenario: Missing achiever image falls back
- **WHEN** an achiever's image fails to load or is absent
- **THEN** a placeholder renders in its place without breaking the card layout

#### Scenario: Empty honor list hides the section
- **GIVEN** the achievers list is empty
- **WHEN** the landing renders
- **THEN** the honor section is not rendered

### Requirement: Đội ngũ FTES mentor section
The landing SHALL include a "Đội ngũ FTES" section presenting the real FTES mentors
as a carousel or grid — Mentor Anh Khoa (Founder, CEO), Mentor Đức Hải (Co-Founder,
CTO), Mentor Thanh Huy (Co-Founder, COO), Mentor Nhật Huy (Developer), Mentor Ngọc
Hiếu (BrSE) — each with avatar, name, role, and their personal "chia sẻ" quote
(sourced from the old Ftes-frontend mentor content), rendered as crawlable text.

#### Scenario: Mentors render with quotes
- **WHEN** the mentor section renders
- **THEN** each of the five mentors shows avatar (alt text = name), name, role, and quote as plain DOM text in the active locale

#### Scenario: Carousel is operable and respects motion preference
- **GIVEN** the mentors render as a carousel
- **WHEN** the visitor uses previous/next controls (pointer or keyboard)
- **THEN** the visible mentors change accordingly
- **AND** under `prefers-reduced-motion: reduce` no auto-play occurs

#### Scenario: Missing mentor avatar falls back
- **WHEN** a mentor avatar fails to load
- **THEN** a placeholder avatar renders in its place

### Requirement: FTES FAQ accordion
The landing SHALL include an FAQ section (replacing the StarCi "dark side of coding"
concept) as an accordion of real FTES questions and answers derived from the offer
and policy content. It MUST include at minimum the refund Q&A: question "Khóa học ở
FTES học không hiểu thì có được hoàn tiền không?" answered with: có — sau buổi học
đầu tiên nếu không ổn thì hoàn tiền; hoàn 100% học phí nếu KHÔNG HIỂU / KHÔNG HỢP
CÁCH GIẢNG / KHÔNG HIỆU QUẢ (điều kiện: tham gia đủ các buổi + hoàn thành đầy đủ
BTVN). All questions and answers MUST be crawlable DOM text.

#### Scenario: FAQ renders as an accordion
- **WHEN** the FAQ section renders
- **THEN** each Q&A appears as an accordion item with the question as the trigger
- **AND** activating a question (pointer or keyboard) expands its answer

#### Scenario: Refund question is present with the confirmed answer
- **WHEN** the visitor expands the refund question
- **THEN** the answer states the 100% refund conditions (không hiểu / không hợp cách giảng / không hiệu quả) and the eligibility conditions (đủ buổi + đủ BTVN)

#### Scenario: FAQ content is crawlable
- **WHEN** the server-rendered HTML is inspected
- **THEN** all questions and answers exist as text in the DOM regardless of expanded state

### Requirement: Closing call to action
The landing SHALL end with a closing CTA section inviting the visitor to start
learning, with a primary CTA routing to `/courses` (or sign-up when unauthenticated)
via locale-aware navigation.

#### Scenario: Closing CTA routes correctly
- **WHEN** the visitor activates the closing CTA
- **THEN** they navigate to the target route via locale-aware navigation

### Requirement: Landing localization, accessibility, and SEO
All landing sections SHALL be fully localized in Vietnamese and English under
`homeLanding.*` (Vietnamese primary for promo copy), keyboard-accessible, and
crawlable: every section's meaning MUST be conveyed by DOM text and semantic
headings, never only by canvas, animation, or image.

#### Scenario: Locale switch localizes every section
- **WHEN** the visitor switches between `vi` and `en`
- **THEN** hero, journey stages, stats labels, module cards, offers, honor, mentors, FAQ, and CTA copy all render in the selected locale with no hardcoded strings

#### Scenario: Keyboard-only journey
- **WHEN** a visitor navigates the landing by keyboard
- **THEN** the stage stepper, tabs, accordion, carousel controls, and all CTAs/links are focusable in document order with visible focus
- **AND** the 3D canvas itself is not a focus trap

#### Scenario: Sections are crawlable
- **WHEN** the page HTML is inspected without JavaScript-rendered WebGL
- **THEN** each section exposes a semantic heading and its copy as text (stats counts may render after fetch; the section heading and AI chips are static)
