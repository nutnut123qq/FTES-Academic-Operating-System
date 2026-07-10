## 1. Realtime connection banner honesty

- [x] 1.1 Add `everConnected` map to `connectionStore.ts`, populated on the first `"connected"` for a namespace
- [x] 1.2 Change `useAnySocketDown` to return true only when a namespace is `"disconnected"` AND in `everConnected`
- [ ] 1.3 Manually verify the pill no longer shows for a never-connected socket (dev), and still shows on a real drop — DEFERRED (auth + running sockets needed; unblocked at runtime)

## 2. Typed REST error (status branching prerequisite)

- [x] 2.1 Add `RestError extends Error` (fields `status: number`, `errorCode?: string`) in `src/modules/api/rest/client/` and export it
- [x] 2.2 Throw `RestError` from `restRequest` (status from `error.response.status` / envelope `code`), keeping `.message` identical
- [x] 2.3 Confirm `tsc` stays clean — existing `.message`/`catch` consumers are unaffected (subclass of Error)

## 3. Comments entitlement state

- [x] 3.1 In `LessonComments/index.tsx`, branch the AsyncContent error: `RestError` 401/403 → `EmptyContent` "enroll to join the discussion" invitation (reuse reader enroll copy), else keep error+retry
- [x] 3.2 Keep the change additive — do NOT touch the comment wiring owned by `course-engagement-fe`
- [x] 3.3 Add i18n `learn.comments.enrollInvite` (title + body) vi + en

## 4. Video slot state

- [x] 4.1 In `LessonHlsPlayer.tsx`, add a `loading` state → aspect-video `Skeleton` in the card until first successful attach/`canplay`
- [x] 4.2 On fatal error, render a compact "video unavailable" placeholder + retry (retry bumps an attempt nonce that re-runs the resolve effect) instead of `return null`
- [x] 4.3 Add i18n `learn.reader.videoUnavailable` + reuse `learn.common.retry`; vi + en

## 5. Empty content state + meta-chip gating (LessonReader)

- [x] 5.1 Gate the two header meta chips (`minutesRead`, `challengeCount`) to render only when their value `> 0`
- [x] 5.2 In the reading view, when `!isLocked && !bodyMd && !documentHtml && !hasVideo`, render an `EmptyContent` invitation instead of a blank Card (documents self-hide in their own block)
- [x] 5.3 Reuse existing i18n `learn.content.empty2` (already authored)

## 6. Mark-complete progress loop

- [x] 6.1 Add an `IntersectionObserver` sentinel at the bottom of `#lesson-article` (active only when `!isLocked`), firing once per lesson via a ref guard (component keyed on contentId)
- [x] 6.2 Add a manual "mark complete" button reflecting completed state
- [x] 6.3 Wire both to `usePostMarkLessonCompleteSwr(contentId)`, then revalidate every `GET_COURSE_PROGRESS` key so the rail meter + `n/m` counter advance; degrade silently on error
- [x] 6.4 Add i18n `learn.reader.markComplete` + `learn.reader.completed` vi + en

## 7. Premium marker from per-viewer lock

- [x] 7.1 Add `isLocked` to `LearnLesson`; map it from `LessonView.locked` (default `false`) in `toLearnLesson`
- [x] 7.2 Update the content-map rail marker to three-state: locked-for-me → lock; premium-but-owned → no lock; free → read-time
- [ ] 7.3 Confirm an owned premium lesson no longer renders a Premium lock — DEFERRED (runtime with an enrolled account)

## 8. Verify

- [x] 8.1 `tsc --noEmit` clean (0 errors — the co-resident `fe-mock-interview` change has since compiled)
- [x] 8.2 `npm run build` (webpack) green
- [x] 8.3 `openspec validate lesson-reader-states-progress --strict` passes
