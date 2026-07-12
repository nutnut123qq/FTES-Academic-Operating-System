## Context

The lesson reader (`LessonReader`) and its route layout own a 3-tier reading surface with
a layout-owned left content-map rail (`ContentMap` inside `ResizableRail`) and a right
on-this-page rail. The reader consumes `LearnLessonView` from `useQueryLearnLessonSwr`,
which today HARDCODES `hasChallenge: false` and does not carry a content-type flag; the
AI study tools (`LessonAiStudy`) mount for any unlocked, non-empty lesson. The in-reader
discussion (`LessonComments`, live against the BE per `course-engagement-fe`) links out to
the course-wide `CourseQa` roll-up by full navigation. The enroll CTA already delegates to
`useCourseEnrollment`, which is wired to `usePaymentOverlayState().open(...)` — the shared
`PaymentModal` from `commerce-checkout-flows`.

This change tightens the reader's gates to real signals, adds two small in-place navigation
affordances, keeps Q&A discovery on-surface, and formalizes the enroll → checkout wiring.

## Goals / Non-Goals

**Goals**
- Gate AI study tools on lesson content-type (VIDEO).
- Gate the challenges tab + "Open challenges" CTA on the real BE `hasChallenge`.
- Small inline next-lesson button on the title row + a content-map sidebar show/hide toggle.
- Keep "See all questions" on-surface (inline reveal + scroll), no route navigation.
- Enroll CTA opens the shared PaymentModal (VietQR QR / Xu), extending `commerce-checkout-flows`.

**Non-Goals**
- Building a new payment modal or checkout API — reuse `commerce-payment-modal`.
- Rewriting the lesson discussion data layer — reuse the live hooks from `course-engagement-fe`.
- A real scannable VietQR (BE `qrCode` is still a placeholder — same caveat as commerce).
- Per-lesson challenge listing UI — only the boolean gate + the existing "Open" entry.

## Decisions

**D1 — AI study gate on content-type, not "not empty".** `LessonAiStudy` mounts only when
the lesson is a VIDEO lesson. Source: the BE `LessonView.type` (already served), surfaced
into `LearnLessonView` as `contentType` + a derived `isVideoLesson`. The reader replaces the
`!isReadingEmpty` mount condition for `LessonAiStudy` with `isVideoLesson` (still requiring
`!isLocked`). Rationale: the Note/Flashcard tools summarize a watched lecture; on a
document/link lesson they are noise. Using `type` (authoritative content-type) rather than
the derived `hasVideo` keeps the gate aligned with the BE lesson taxonomy.

**D2 — `hasChallenge` comes from the BE, not a hardcode.** `useQueryLearnLessonSwr` today
sets `hasChallenge: false` unconditionally. The BE exposes a per-lesson `hasChallenge`
boolean on the lesson-content contract (`GET /api/v1/lessons/{lessonId}/content` →
`LessonContentView.hasChallenge`), true when a PUBLISHED challenge is linked to the lesson.
The hook maps it through; the reader's challenges tab (existing "Dynamic challenges tab"
requirement) AND the "Open challenges" CTA in `ChallengesView` render only when true.
Rationale: a dead-ending challenges entry trains distrust; the gate must reflect reality.

**D3 — Sidebar toggle = a tiny shared zustand slice, not prop-drilling.** The next-lesson
button lives in the reader; the content-map rail lives in the route `layout.tsx`. A new
`useLearnSidebarStore` (`src/hooks/zustand/learnSidebar/store.ts`, mirroring the
`dashboardTab` slice: `{ collapsed: boolean; toggle(); setCollapsed() }`) lets the reader's
toggle drive the layout-owned rail without lifting state through `LearnShell`. The layout
omits (or `hidden`s) `leftRail` when `collapsed` on the reader route. Default expanded.
Rationale: matches the house zustand pattern for cross-tree UI intent (same family as the
overlay/appearance stores) and avoids threading a prop through the shell.

**D4 — Inline next-lesson button = small, right-aligned, on the title row.** A compact
icon+label button ("Next" / next lesson title) sits INLINE at the right of the lesson-title
header row, next to the sidebar toggle, navigating to `readerHref(courseId, lesson.nextId)`
(same target as the bottom pager's next card). It self-hides when there is no next lesson.
The full `LessonPager` stays at the bottom for prev/next parity. Rationale: a persistent,
low-friction "continue" affordance without scrolling to the pager.

**D5 — "See all questions" reveals inline, never navigates.** `LessonComments`'s "See all
questions" button drops the `router.push('/courses/{id}/learn/qa')`; it instead toggles an
INLINE embedded roll-up (`<CourseQa embedded />`) mounted directly below the discussion and
smooth-scrolls to it. `CourseQa` gains an `embedded` prop that suppresses its page chrome
(`PageHeader`, outer `max-w`/`mx-auto`) so it composes inside the reader column. Separately,
`CourseQa` replaces its `Prev`/`Next` pager with a progressive "See more" that appends the
next page inline (`setPage(p+1)` accumulating rows) and scrolls, so even the dedicated
`/learn/qa` route never pages away. Rationale: keeps question discovery on-surface (the
task's "no navigation to another page"); reuses the existing roll-up rather than a second list.

**D6 — Enroll → PaymentModal (extends `commerce-checkout-flows`).** `useCourseEnrollment.onEnroll`
resolves the COURSE_UNLOCK product (`useGetCourseProductSwr(buy.rawId)`), adds it to the
cart (`usePostAddCartItemSwr`), and opens the shared PaymentModal via
`usePaymentOverlayState().open({ itemIds:[item.id], title, amountVnd, amountCoin? })` — the
`commerce-payment-modal` capability renders the VietQR QR and polls to PAID. The
lesson-reader locked paywall's enroll button (`LessonReader`, currently
`router.push('/courses/{courseId}')`) opens the same modal using `lesson.courseRawId`, falling
back to the sales page only when the product is unresolvable. Rationale: `commerce-checkout-flows`
deferred the course-enroll wiring; this closes it without a second checkout path.

## Risks / Trade-offs

- **BE `hasChallenge` field must land** for the gate to switch off the hardcode. Until it
  ships, the hook maps a missing field to `false` (current behavior) — no regression.
- **Embedded `CourseQa` double-mount cost** (reader + `/learn/qa` route) — mitigated by
  lazy mount (only after "See all" is pressed) and the shared SWR key deduping the fetch.
- **Sidebar collapse persistence** — v1 keeps collapse in memory (session); persisting to
  `localStorage` (like `ResizableRail` width) is a trivial follow-up, out of scope here.
- **Enroll modal for a not-on-sale course** — when no product resolves, fall back to the
  sales page (unchanged), so a PACKAGE/not-for-sale course never opens an empty modal.

## Migration Plan

FE-only except the additive BE `hasChallenge` field (no data migration; nullable/defaulted
false). Rollback = revert the reader gates + toggle store + `CourseQa embedded` prop; the
enroll wiring reverts to the sales-page route. Verify `npm run build` (webpack) +
`tsc --noEmit`.

## Open Questions

- Content-type taxonomy: confirm the exact `LessonView.type` value for VIDEO (mapped in the
  hook as `isVideoLesson = type === <VIDEO>`); resolved at implementation against the BE enum.
- Should the sidebar toggle also live in the layout header (not just the reader)? Deferred —
  the reader title row is the requested placement.
