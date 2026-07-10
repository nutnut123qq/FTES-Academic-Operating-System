## Why

A learner viewing a premium lesson they are not entitled to sees a blank "empty" reading
area with no video and — critically — **no paywall**, instead of an "enroll to unlock" lock.
Root cause: the reader derives its lock state from `GET /lessons/{id}/content`, which returns
`401 PLATFORM_UNAUTHORIZED` for an unentitled viewer; `useQueryLearnLessonSwr` catches that
error and falls back to `{ locked: false, bodyMd: "" }`, so the reader believes the lesson is
*unlocked but empty*. Meanwhile the BE strips `videoRef` to null for the same viewer, so no
video renders either. The reliable per-viewer `locked` flag already rides the course-detail
curriculum (used for the content-map rail marker) — the reader should trust that, not the
401 fallback.

## What Changes

- The lesson reader derives `isLocked` from the per-viewer `locked` flag on the course-detail
  curriculum lesson, falling back to the content payload's `locked` only when the curriculum
  has no entry. A premium lesson the viewer cannot access now shows the paywall (enroll CTA)
  instead of a misleading empty state.

## Capabilities

### Modified Capabilities
- `course-lesson`: the reader's lock state reflects the reliable per-viewer entitlement, so a
  locked lesson shows the paywall rather than an empty reading area.

## Impact

- FE-only, no BE change. `src/components/features/learn/hooks/useQueryLearnLessonSwr.ts`
  (`FlatLesson` carries `locked`; `buildLessonView` derives `isLocked` from it).
- Fixes the "empty lesson, no video, no paywall" symptom for unentitled viewers. Video itself
  still requires entitlement (the BE only ships `videoRef` to entitled viewers — by design).
