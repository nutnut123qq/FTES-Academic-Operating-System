## Context

The lesson reader (`src/components/features/learn/LessonReader/*`) is a StarCI port wired to
real REST. Seven independent state-handling gaps make a working page read as broken. All fixes
are FE-only and mostly re-wire parts that already ship. Two cross-cutting touch points exist:
the global socket store (`src/hooks/socketio/connectionStore.ts`) and the REST client
(`src/modules/api/rest/client/client.ts`), which currently throws a **plain `Error`** with no
HTTP status — blocking any status-aware branch. The open `course-engagement-fe` change also
edits `LessonComments/index.tsx`, so changes there stay additive (a new status branch only).

## Goals / Non-Goals

**Goals:**
- Every state surface (empty, loading, error, realtime) tells the truth about the lesson.
- The progress meter moves when a learner actually completes a lesson.
- Owned/premium/free lessons show the correct rail marker.
- No new backend contract; reuse shipped hooks (`usePostMarkLessonCompleteSwr`) and fields
  (`LessonView.locked`).

**Non-Goals:**
- Video playback-rate / resume position / watched-seconds (P1 rendering-quality change).
- Rebuilding the comment thread or composer (owned by `course-engagement-fe` / P2).
- Mobile shell, rail content, typography (P1). Course-wide Q&A, reactions, nudges (P2).

## Decisions

- **Socket "everConnected" gate.** Add `everConnected: Set<SocketNamespace>` to the connection
  store, populated the first time a namespace reports `"connected"`. `useAnySocketDown` returns
  true only for a namespace that is `"disconnected"` **and** in `everConnected`. Rationale: a
  never-handshaked optional socket (WAF-blocked / absent env) must not raise the banner; the app
  works over HTTP. Alternative (seed a `"connecting"` status) rejected — it needs every lifecycle
  hook to emit an extra state; the Set is a one-line read-site change. The Set mutates at most
  once per namespace, so no re-render churn.
- **Typed REST error for status branching.** Introduce `RestError extends Error` in
  `src/modules/api/rest/client/` carrying `status: number` and `errorCode?: string`, thrown by
  `restRequest` (status from `error.response.status` / envelope `code`). Purely additive: it still
  `extends Error` with the same `.message`, so every existing `catch`/`.message` consumer
  (`useRestWithToast`, SWR) is unaffected. `LessonComments` then branches:
  `error instanceof RestError && (status === 401 || 403)` → enroll invitation; else → error+retry.
  Alternative (substring-match the errorCode in the message) rejected as fragile. Alternative
  (thread an `entitled` prop from the reader) rejected — a free-enrolled viewer can read a free
  lesson yet still `403` on comments (FULL access required), so the reader can't know from lesson
  data alone.
- **Video slot states (HLS only).** `LessonHlsPlayer` gains a `loading` state (aspect-video
  skeleton until the first successful attach/`canplay`) and, on a fatal error, renders a compact
  "video unavailable" + retry (retry bumps an attempt nonce that re-runs the resolve effect)
  instead of `return null`. YouTube iframes keep their current behavior (no resolve step to fail).
  Rationale: `videoRef` is only shipped for accessible lessons, so a failure here is a genuine
  stream error worth surfacing, not a paywall.
- **Mark-complete progress loop.** An `IntersectionObserver` sentinel at the bottom of
  `#lesson-article` (plus a manual "mark complete" button for short/doc lessons) calls
  `usePostMarkLessonCompleteSwr(contentId)` once per lesson (guarded by a ref so it fires once),
  then revalidates `useQueryLearnCourseSwr` so `GET_COURSE_PROGRESS` re-reads and the rail meter +
  `n/m` counter advance. Only active when `!isLocked`. The mark-complete mutation is assumed
  idempotent (BE upsert); if it errors it degrades silently (no toast spam on auto-fire).
- **Premium marker from per-viewer `locked`.** `toLearnLesson` maps `isLocked` from
  `LessonView.locked` (defaulting `false` when absent for anon). The rail marker becomes
  three-state: locked-for-me → lock chip; premium-but-owned (`!locked && !free`) → no lock (star /
  plain); free → read-time. Keeps `isPremium` for the "star" affordance; adds `isLocked` as the
  gating flag. No extra request — `locked` rides the existing course-detail payload.
- **Empty-state + meta gating** are local to `LessonReader/index.tsx`: reuse `AsyncContent`
  `isEmpty`/`emptyContent` for the content view; render each meta chip only when its value `> 0`
  (mirrors the outcomes gate at line 138).

## Risks / Trade-offs

- **`RestError` touches the shared client while ~40 `rest-fetch-*` changes are open** → additive
  only (subclass + throw site), those changes add API functions, not edit the throw site, so merge
  risk is low; verified by a full `tsc` + webpack build.
- **`LessonView.locked` may be absent on the anonymous public course-detail payload** → default to
  `false` (unlocked-looking) rather than crash; authenticated viewers get the real flag.
- **Auto mark-complete fires on very short lessons immediately** → acceptable for P0 (completion is
  the goal); a dwell-time gate is a later refinement. Fires once per lesson via a ref guard.
- **Coordinated edit on `LessonComments/index.tsx`** with `course-engagement-fe` → keep the change
  additive (status branch only), do not touch the comment wiring that change owns.

## Migration Plan

Pure FE, no data migration. Ship behind no flag; behavior degrades cleanly for anon viewers.
Rollback = revert the change. Verify: `tsc --noEmit` clean + `npm run build` (webpack) green.
