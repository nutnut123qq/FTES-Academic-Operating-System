# Learn reader + enroll UX (content-type gates, inline nav, real checkout)

## Why

The lesson reader and the enroll CTA carry several UX gaps and mock/hardcoded gates
that either show tools where they don't belong or fail to run the real flow:

- **AI study tools show on every lesson.** `LessonAiStudy` (AI Note + AI Flashcards)
  renders for any unlocked, non-empty lesson — including pure document/link lessons —
  even though the two tools are meant to accompany a VIDEO lesson. It must gate on the
  lesson content-type (VIDEO).
- **"Open challenges" is not gated on a real signal.** The reader derives
  `hasChallenge` from a HARDCODED `false` (`useQueryLearnLessonSwr` → `hasChallenge: false`),
  so the challenges tab / the "Open challenges" CTA never reflect the BE. The BE now
  carries a per-lesson `hasChallenge` gate; the reader must consume it and only show the
  challenges tab and the "Open challenges" button when the lesson actually has one.
- **Next-lesson navigation is a heavy bottom pager only.** There is no quick
  "next lesson" affordance near the lesson title, and no way to hide the (wide)
  content-map sidebar to read full-width.
- **"See all questions" leaves the page.** The in-reader discussion's "See all
  questions" does `router.push('/courses/{id}/learn/qa')`, a full navigation away from
  the lesson; and the roll-up itself pages with Prev/Next. Both should reveal MORE
  inline and scroll, never navigating off the current surface.
- **Enroll must run the real checkout.** The enroll CTA is expected to open the shared
  PaymentModal (VietQR QR / Xu) rather than a placeholder route. The
  `commerce-checkout-flows` change built that modal but explicitly deferred wiring the
  course-enroll CTA; this change completes that wiring.

This change is FE-behavior-focused and EXTENDS (does not duplicate) the dev-A changes it
overlaps: `commerce-checkout-flows` (the `commerce-payment-modal` capability the enroll
CTA opens), `course-engagement-fe` (the live lesson discussion the Q&A see-all builds on),
and `course-try-for-free` (the try-learning intent already specced on the enroll hook).

## What Changes

- **AI study gate (content-type)**: mount `LessonAiStudy` ONLY for a VIDEO lesson —
  gate on the lesson content-type surfaced from the BE `LessonView.type` (carried into
  `LearnLessonView` as `contentType` / `isVideoLesson`), not merely on "not empty".
- **Challenge gate (BE `hasChallenge`)**: surface the real per-lesson `hasChallenge`
  from the BE lesson-content contract into `LearnLessonView.hasChallenge`; the reader's
  challenges tab AND the "Open challenges" CTA (in the Challenges view / practice area)
  render only when `hasChallenge` is true.
- **Inline next-lesson + sidebar toggle**: add a SMALL, right-aligned "next lesson"
  button INLINE on the lesson-title row, plus a toggle that shows/hides the left
  content-map sidebar (shared state so the reader button drives the layout-owned rail).
  The full bottom pager stays for prev/next.
- **Inline "See all questions"**: the discussion's "See all questions" no longer
  navigates — it reveals the course-wide roll-up INLINE below the thread (an embedded
  `CourseQa` variant) and smooth-scrolls to it; the roll-up replaces its Prev/Next pager
  with a progressive "See more" that appends the next page inline and scrolls.
- **Enroll → PaymentModal**: the enroll CTA (`useCourseEnrollment.onEnroll`) resolves the
  COURSE_UNLOCK product, adds it to the cart, and opens the shared `PaymentModal`
  (`commerce-payment-modal`) which renders the VietQR QR / Xu tab; the lesson-reader
  locked paywall's enroll button opens the same modal instead of only routing to the
  sales page.
- **i18n**: extend `learn.*` (reader next-lesson, sidebar toggle, see-more) + `contentAi.*`
  where needed (vi + en).

## Impact

- Affected specs (delta): `course-lesson` (MODIFIED + ADDED), `course-qa` (MODIFIED),
  `course-enrollment-intent` (MODIFIED).
- Affected FE code:
  - `src/components/features/learn/hooks/useQueryLearnLessonSwr.ts` (surface real
    `hasChallenge` + `contentType`/`isVideoLesson`).
  - `src/components/features/learn/LessonReader/index.tsx` (video gate for
    `LessonAiStudy`, `hasChallenge`-gated CTA, inline next-lesson + sidebar toggle on the
    title row, locked-paywall enroll opens PaymentModal).
  - `src/components/features/learn/LessonReader/LessonAiStudy/{index,LessonAiNote,LessonAiFlashcards}.tsx`
    (accept/annotate the video-only mount contract).
  - `src/components/features/learn/CourseQa/index.tsx` (add `embedded` variant +
    progressive "See more"), `src/components/features/learn/LessonReader/LessonComments/index.tsx`
    (replace `router.push('/learn/qa')` with inline reveal + scroll).
  - `src/components/features/course/hooks/useCourseEnrollment.ts` + `CourseDetail/index.tsx`
    (enroll CTA opens PaymentModal — already wired to `usePaymentOverlayState`; formalize).
  - `src/app/[locale]/courses/[courseId]/learn/layout.tsx` + `LearnShell` + a new
    `src/hooks/zustand/learnSidebar/store.ts` (shared collapse state for the content-map rail).
  - `src/messages/{vi,en}.json`.
- Affected BE code: expose a per-lesson `hasChallenge` boolean on the lesson-content
  contract (`GET /api/v1/lessons/{lessonId}/content` → `LessonContentView.hasChallenge`),
  computed from a PUBLISHED challenge linked to the lesson. Lesson content-type (`type`)
  is already served on `LessonView.type`.
- References (no duplication): `commerce-checkout-flows` (`commerce-payment-modal`),
  `course-engagement-fe` (lesson discussion), `course-try-for-free` (try-learning intent).
