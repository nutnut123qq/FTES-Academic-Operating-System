## 1. Collapsible top-level composer

- [x] 1.1 In `LessonComments`, replace the top-level hand-rolled composer with the reuseable `CommentComposer` (`collapsible`, `currentUser`, learn-namespace `placeholder`/`submitLabel`, `busy`)
- [x] 1.2 Keep reply composers as the local expanded composer
- [x] 1.3 Resolve `currentUser` from the redux user (username + avatar), null when signed out

## 2. Optimistic like

- [x] 2.1 Add a pure `toggleLikeInPage(page, commentId)` that flips `myReactions`/`reactionCount` in `items` and nested `replies`
- [x] 2.2 Rewrite `onLike` to `commentsSwr.mutate(runRequest, { optimisticData, rollbackOnError: true, revalidate: true })`; silent on failure (rollback is the feedback)

## 3. Draggable AI FAB

- [x] 3.1 Port the starci pointer-drag into `ContentAiFab` desktop: `bottom` state + `STORAGE_KEY` persist + `onPointerDown/Move/Up` + drag-threshold
- [x] 3.2 Apply `style={{ bottom }}` + `touch-none` to the desktop button and swallow the drag-release toggle via `onOpenChange`
- [x] 3.3 Keep the mobile drawer + `useParams` contentId gate + `reader.ai.*` copy unchanged

## 4. Learn nudges

- [x] 4.1 New `LearnNudges` sub-component on `SurfaceListCard`, computing the viewer's 1-based rank client-side from `useQueryLearnLeaderboardSwr` + viewer id
- [x] 4.2 Render it on `LearnContentPage`; each nudge self-hides when its value is zero/absent
- [x] 4.3 i18n for nudge copy (vi + en)

## 5. Verify

- [x] 5.1 `tsc --noEmit` clean
- [x] 5.2 `npm run build` (webpack) green
- [x] 5.3 `openspec validate lesson-engagement-fe --strict` passes
