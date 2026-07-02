## 1. Data hooks (mock SWR)

- [ ] 1.1 Add `ResourceComment` type + in-module mock store keyed by resourceId (shape: id, author { id, name, avatarUrl }, text, createdAt)
- [ ] 1.2 `useQueryResourceCommentsSwr(resourceId)` in `src/components/features/resource/hooks/` (newest-first, mirrors `useQueryReviewsSwr`)
- [ ] 1.3 `useMutateCreateResourceCommentSwr(resourceId)` with optimistic prepend + rollback on error
- [ ] 1.4 `useMutateDeleteResourceCommentSwr(resourceId)` with optimistic remove + restore on error

## 2. UI components

- [ ] 2.1 `ResourceDetail/ResourceComments/index.tsx`: section header (title + count + `goToReviews` link), wires query hook, no star input
- [ ] 2.2 `ResourceComments/CommentItem/`: avatar (initial fallback), author, relative time, text, delete affordance only when `author.id === currentUser.id`
- [ ] 2.3 `ResourceComments/CommentComposer/`: HeroUI Textarea + submit; 500-char limit + counter; disable submit on empty/whitespace; clear on success
- [ ] 2.4 Delete confirmation step before firing the delete mutation
- [ ] 2.5 `ResourceCommentsSkeleton` mirroring list layout; empty state; load error with retry; submit error with draft restore (`role="alert"`)
- [ ] 2.6 Auth gating: guest focus/submit opens `AuthenticationModal` via `useAuthenticationOverlayState().setOpen(true)` + `setAuthenticationModalTab(SignIn)`; guests still see the list
- [ ] 2.7 Replace the inline mock comments block in `ResourceDetail/index.tsx` with `<ResourceComments />`; remove dead embedded-comments rendering

## 3. i18n + a11y

- [ ] 3.1 Add `resourceHub.comments.*` keys to `src/messages/vi.json` and `src/messages/en.json` (title, placeholder, submit, counter, empty, loadError, submitError, retry, delete, deleteConfirm, goToReviews, justNow)
- [ ] 3.2 A11y pass: textarea label, `aria-label` on icon-only buttons, live region for errors

## 4. Verify

- [ ] 4.1 `openspec validate --change "resource-comments"` passes
- [ ] 4.2 `npm run build` (webpack) green + `tsc --noEmit` clean
