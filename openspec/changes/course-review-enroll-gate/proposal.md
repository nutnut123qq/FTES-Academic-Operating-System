# Gate the course review composer input on enrollment

## Why

On the course detail page the "Đánh giá học viên" section shows a star picker + a
"Đánh giá của bạn" textarea + a "Gửi đánh giá" button to any signed-in viewer. A
viewer who has NOT enrolled in the course can still pick a star and type a full
review; only the server-side submit rejects them (403 `COURSE_ACCESS_DENIED` →
"accessDenied" toast). Letting them type first and fail on submit is a poor
experience — the wall arrives after the work.

The ask: a non-enrolled viewer should not be able to input at all. The moment they
click/focus the textarea or tap a star, tell them they haven't enrolled yet, instead
of accepting the input.

## What Changes

- `CourseDetail/CourseRatings` gains an `isEnrolled` prop, wired from the detail
  page's existing enroll signal (`useCourseEnrollment().isEnrolled`) — the SAME
  source the enroll CTA reads. No new enrollment lookup, no change to the submit gate.
- When the signed-in viewer is NOT enrolled, the composer stays visible but becomes
  read-only for INPUT:
  - The star buttons no longer set a rating; clicking one fires a warning toast.
  - The textarea is `readOnly` (kept focusable, not `disabled`, so the message is
    reachable): a mouse click is swallowed and prompts to enroll; keyboard (Tab)
    focus is bounced back out and prompts.
  - Both carry `aria-disabled` and a not-allowed cursor so the gated state is legible
    to assistive tech and sighted users alike.
- When enrolled: unchanged — full input + submit exactly as today.
- i18n: add `courseSystem.detail.rating.enrollFirst` (vi "Bạn chưa đăng ký khóa học" /
  en "You haven't enrolled in this course") to vi.json + en.json.

## Impact

- Affected specs: `course-detail` (new requirement).
- Affected code: `src/components/features/course/CourseDetail/CourseRatings/index.tsx`,
  `src/components/features/course/CourseDetail/index.tsx`, `src/messages/{vi,en}.json`.
- No backend change; the server-side rating access check is untouched.
