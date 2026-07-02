## 1. Data hooks (mock SWR)

- [ ] 1.1 Add `ResourceComment` type + in-module mock store keyed by resourceId (shape: id, parentId, author { id, name, avatarUrl }, text, createdAt, likeCount, likedByMe)
- [ ] 1.2 `useQueryResourceCommentsSwr(resourceId)` in `src/components/features/resource/hooks/` (top-level newest-first, replies oldest-first per parent; mirrors `useQueryReviewsSwr`)
- [ ] 1.3 `useMutateCreateResourceCommentSwr(resourceId)` with optional `parentId`, optimistic prepend (top-level) / append-under-parent (reply) + rollback on error; resolve a reply-target `parentId` to its top-level parent (one-level cap)
- [ ] 1.4 `useMutateDeleteResourceCommentSwr(resourceId)` with optimistic remove + restore on error
- [ ] 1.5 `useMutateToggleResourceCommentLikeSwr(resourceId)` — optimistic flip of `likedByMe` ±1 `likeCount`, rollback on error

## 2. UI components

- [ ] 2.1 `ResourceDetail/ResourceComments/index.tsx`: section header (title + count + `goToReviews` link), wires query hook, no star input
- [ ] 2.2 `ResourceComments/CommentItem/`: Threads-style minimal row (no card/border/box) — avatar (initial fallback), author, relative time, text; thin action line: ♥ like (filled red when `likedByMe`, count beside) + reply link + delete affordance only when `author.id === currentUser.id`; no share/save
- [ ] 2.3 `ResourceComments/CommentComposer/`: HeroUI Textarea + submit; 500-char limit + counter; disable submit on empty/whitespace; clear on success; responsive placement — fixed bottom bar on `<sm` (list reserves bottom padding) and inline at top of thread from `sm:` up
- [ ] 2.4 Reply flow: inline reply composer under the target row (with cancel); replies render indented one level, oldest-first; reply on a reply retargets to the top-level parent (no deeper nesting)
- [ ] 2.5 Like toggle wired to `useMutateToggleResourceCommentLikeSwr` (optimistic, `aria-pressed`)
- [ ] 2.6 Delete confirmation step before firing the delete mutation
- [ ] 2.7 `ResourceCommentsSkeleton` mirroring list layout; empty state; load error with retry; submit error with draft restore (`role="alert"`)
- [ ] 2.8 Auth gating: guest focus/submit/reply/like opens `AuthenticationModal` via `useAuthenticationOverlayState().setOpen(true)` + `setAuthenticationModalTab(SignIn)`; guests still see the list (incl. replies + like counts)
- [ ] 2.9 Replace the inline mock comments block in `ResourceDetail/index.tsx` with `<ResourceComments />`; remove dead embedded-comments rendering

## 3. i18n + a11y

- [ ] 3.1 Add `resourceHub.comments.*` keys to `src/messages/vi.json` and `src/messages/en.json` (title, placeholder, submit, counter, empty, loadError, submitError, retry, delete, deleteConfirm, goToReviews, justNow, reply, replyPlaceholder, cancelReply, like, unlike, likeCount)
- [ ] 3.2 A11y pass: textarea label, `aria-label` on icon-only buttons (like exposes `aria-pressed`), live region for errors

## 4. Verify

- [ ] 4.1 `openspec validate --change "resource-comments"` passes
- [ ] 4.2 `npm run build` (webpack) green + `tsc --noEmit` clean
