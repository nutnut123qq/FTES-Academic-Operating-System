## Why

With the reader's states (P0) and shell/rendering (P1) fixed, the remaining lesson-page gaps
are engagement polish that ships entirely on the FE: the discussion opens with an always-
expanded grey textarea that dominates the zone above the thread; liking a comment triggers a
blocking full-page refetch instead of an instant heart flip; the desktop AI FAB is hard-pinned
bottom-right where it can cover the reading column / composer / pager; and the built
leaderboard/XP data is undiscoverable from the content home. All four reuse parts that already
ship (`CommentComposer` collapsible, an in-repo optimistic-toggle pattern, the starci FAB
drag, `SurfaceListCard` + the existing leaderboard query).

## What Changes

- **Collapsible composer**: the top-level discussion composer becomes the shipped collapsible
  avatar-led `CommentComposer` (a slim "write a comment" pill that expands on click), so an
  empty grey box no longer dominates the discussion zone.
- **Optimistic like**: liking/unliking a comment flips the heart and count instantly via an
  optimistic cache update with rollback-on-error, instead of a blocking no-arg refetch.
- **Draggable AI FAB**: the desktop AI FAB becomes vertically draggable with a drag-vs-click
  threshold and a localStorage-persisted position, so it can be parked clear of the content.
- **Learn nudges**: the content home surfaces a contextual nudges strip (rank / XP / next
  step) computed from the existing leaderboard query, each nudge self-hiding at zero.

## Capabilities

### Modified Capabilities
- `course-lesson`: adds discussion-composer, optimistic-reaction, movable-AI-entry, and
  contextual-nudge behaviors to the learn player (new requirements; existing requirements
  unchanged by this delta).

## Impact

- FE-only. No new backend contract (nudges compute client-side from the existing
  `useQueryLearnLeaderboardSwr`; optimistic like uses the existing comment mutations).
- Affected code:
  - `src/components/features/learn/LessonReader/LessonComments/index.tsx` (collapsible composer + optimistic like)
  - `src/components/features/learn/ContentAiFab/index.tsx` (drag + persist)
  - `src/components/features/learn/LearnContentPage/index.tsx` + a new nudges sub-component
  - `src/messages/{vi,en}.json` (nudge copy; reuse existing where possible)
