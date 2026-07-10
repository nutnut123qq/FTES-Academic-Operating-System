## Why

A UX audit of the course lesson reader found the page reads as *broken* rather than
*intentional*: on a content-less / migrated lesson it paints a full paper Card around a
`null` body, a global "Connection lost — reconnecting…" pill sticks forever because a
never-handshaked chat socket is treated as a dropped one, the progress meter is frozen at
`0/N` because nothing ever writes completion, every lesson is stamped "Premium" even when
the viewer owns it, the video slot vanishes on error, comments dead-end on a `403` with a
retry that can never succeed, and the header opens with two `0`-value meta chips. These
are state-handling gaps, not missing features — nearly every fix is wiring parts that
already ship (`AsyncContent` empty/error, the dead `usePostMarkLessonCompleteSwr` hook,
the per-viewer `LessonView.locked` flag).

## What Changes

- **Empty content state**: in the reading view, a lesson with no markdown body, no HTML
  fallback, no video and no documents shows an `EmptyContent` invitation instead of a
  blank bordered Card.
- **Realtime pill honesty**: the "reconnecting" banner is raised only for a namespace that
  was previously connected and then dropped — never for one that never handshaked.
- **Video slot state**: an aspect-ratio skeleton while the source resolves and a compact
  "Video unavailable" + retry placeholder on a fatal HLS error, instead of rendering nothing.
- **Comments entitlement state**: a `401/403` renders an "enroll to join the discussion"
  invitation (reusing the reader's enroll copy); error+retry is reserved for transient
  `5xx`/network failures. **Scoped: only a status branch is added — no change to the
  `course-engagement-fe` comment wiring.**
- **Meta chip gating**: the "min read" and "challenges" header chips render only when their
  value is `> 0` (mirrors the existing outcomes-card gate).
- **Progress loop**: reading a lesson to the end (an `IntersectionObserver` sentinel) or
  pressing a manual "mark complete" calls the already-shipped-but-unwired
  `usePostMarkLessonCompleteSwr`, then revalidates course progress so the rail meter and
  `n/m` counter advance.
- **Premium marker from per-viewer lock**: the rail marker derives from `LessonView.locked`
  (locked-for-me → lock, premium-but-owned → no lock, free → read-time) instead of the
  static `!free`, so owned lessons stop showing a Premium lock.

## Capabilities

### New Capabilities
- `realtime-connection-status`: the global socket-connection banner surfaces a "reconnecting"
  state only for a namespace that connected and then dropped, so an absent/blocked optional
  socket never raises a false alarm.

### Modified Capabilities
- `course-lesson`: the learn player's empty/loading/error states, mark-complete progress
  loop, and premium lock marker change behavior (content empty-state, video state, comments
  entitlement state, meta-chip gating, real mark-complete wiring, per-viewer lock marker).

## Impact

- FE-only (`FTES Academic Operating System`). No new backend contract; reuses the existing
  `usePostMarkLessonCompleteSwr` mutation and the per-viewer `LessonView.locked` field.
- Affected code:
  - `src/components/features/learn/LessonReader/index.tsx` (empty-state, meta-chip gating, mark-complete wiring)
  - `src/components/features/learn/LessonReader/LessonHlsPlayer.tsx` (video skeleton/error state)
  - `src/components/features/learn/LessonReader/LessonComments/index.tsx` (401/403 status branch — additive only)
  - `src/components/features/learn/hooks/useQueryLearnCourseSwr.ts` (premium marker from `locked`)
  - `src/hooks/socketio/connectionStore.ts` (everConnected tracking)
  - `src/messages/{vi,en}.json` (new `learn.content.empty2` + video/comment-invite/mark-complete keys)
- Coordinates with the open `course-engagement-fe` change on `LessonComments/index.tsx`
  (additive status branch only, no rewiring).
