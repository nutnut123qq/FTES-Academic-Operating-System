## Context

Four FE-only engagement gaps on the lesson page. Each reuses a shipped part: the reuseable
`CommentComposer` already supports `collapsible` + `currentUser`; the starci `ContentAiFab`
already implements pointer-drag + localStorage persistence; `SurfaceListCard` + the existing
`useQueryLearnLeaderboardSwr` back the nudges; SWR's `mutate({ optimisticData, rollbackOnError })`
backs the optimistic like.

## Goals / Non-Goals

**Goals:** collapse the composer; instant like; park the FAB; surface rank/next-step nudges.
**Non-Goals:** the reaction+view footer and the course-wide Q&A route (they need mock BE — a
separate change); swapping `CommentItem` (the reader uses the REST `LessonCommentView` shape,
not the reuseable item — keep the item, swap only the composer).

## Decisions

- **Swap only the top-level composer.** Replace the reader's hand-rolled always-expanded
  top-level composer with the reuseable `CommentComposer` (`collapsible currentUser={…}`),
  passing the learn-namespace placeholder/submit copy. Reply/edit composers stay the local
  expanded ones (they open on demand already). The reuseable composer clears its own draft on
  submit, which pairs cleanly with the optimistic post.
- **Optimistic like via a recursive toggle.** A pure `toggleLikeInPage(page, commentId)` flips
  `myReactions`/`reactionCount` for the target in `items` or nested `replies`, fed to
  `commentsSwr.mutate(runRequest, { optimisticData, rollbackOnError: true, revalidate: true })`.
  On failure SWR restores the prior cache; a like failure stays silent (no toast) since the
  visible rollback is feedback enough.
- **Port the starci FAB drag.** Bring the pointer-drag state (`bottom` + `STORAGE_KEY` +
  `onPointerDown/Move/Up` + the `onOpenChange` drag-swallow) into the FTES `ContentAiFab`
  desktop branch, keeping FTES's `useParams` contentId gate + `reader.ai.*` copy and mobile
  drawer. `touch-none` + `style={{ bottom }}`; persist only when a real drag occurred.
- **Nudges from leaderboard.** A `LearnNudges` sub-component (mirroring starci, built on
  FTES `SurfaceListCard`) computes the viewer's 1-based rank client-side from the leaderboard
  entries + viewer id and renders a small strip on the content home; each nudge self-hides at
  zero. No new backend.

## Risks / Trade-offs

- **Reuseable composer uses the root i18n namespace** → pass explicit `placeholder`/`submitLabel`
  from the `learn` namespace so copy stays consistent.
- **Optimistic recursion must cover replies** → the toggle walks both `items` and each item's
  `replies`; verified against the `LessonCommentsPage` shape.
- **FAB drag on a Popover trigger** → the `onOpenChange` swallow prevents a drag-release from
  toggling the chat (same guard starci uses).

## Migration Plan

Pure FE, no flag. Verify: `tsc --noEmit` clean + `npm run build` green.
