## Context

`ResourceDetail` (`src/components/features/resource/ResourceDetail/index.tsx`)
renders a read-only mock comments list inline (from `useQueryResourceDetailSwr`).
No composer, no states, no auth gating. Rating already exists separately at
`/resources/[resourceId]/reviews` (`ResourceRating`, local state). FE-only repo;
BE is mocked.

## Goals / Non-Goals

**Goals:** interactive comments on detail page per spec (composer, list,
optimistic append, delete-own, gating, states, i18n/a11y); build + tsc green.
**Non-Goals:** real backend, replies/threads, edit comment, reactions,
pagination beyond a single mock page, any change to `ResourceRating`.

## Decisions

- **Component plan (house canon, HeroUI):** new sub-feature
  `ResourceDetail/ResourceComments/index.tsx` replacing the inline list;
  children `CommentComposer/` and `CommentItem/`; skeleton as a local
  `ResourceCommentsSkeleton` mirroring the list layout (HeroUI `Skeleton`).
  Reuse HeroUI `Textarea`, `Button`, `Avatar`, `Typography`; reuse existing
  `reuseable` blocks where they fit (no hand-rolled primitives). Composer is a
  standalone field → HeroUI `Textarea` (the flat-in-box exception applies only
  to AI chat composers).
- **Data hooks (mock SWR):** `useQueryResourceCommentsSwr(resourceId)` and
  `useMutateCreateResourceCommentSwr(resourceId)` (+
  `useMutateDeleteResourceCommentSwr`) in
  `src/components/features/resource/hooks/`, mirroring `useQueryReviewsSwr`.
  Mock fetcher backed by an in-module store keyed by `resourceId`; optimistic
  append/remove via SWR `mutate` with rollback on error. Comments are decoupled
  from `useQueryResourceDetailSwr` (its embedded `comments` field is dropped
  from the detail view; hook shape kept for compatibility).
- **Auth gating:** read `state.keycloak.authenticated` (Redux); guest focus or
  submit → `useAuthenticationOverlayState().setOpen(true)` +
  `setAuthenticationModalTab(SignIn)` — same pattern as `AuthActions`.
- **Ordering + identity:** newest-first sort by `createdAt`; optimistic items
  get a temp id and the current user's display name/avatar from the user slice.
- **BE contract assumption (documented, not invented):** future API
  `GET/POST/DELETE /resources/:id/comments` returning
  `{ id, author { id, name, avatarUrl }, text, createdAt }`; owner check via
  `author.id === currentUser.id`. Mock mirrors this shape so swap-in is a
  fetcher change only.
- **Alternatives considered:** extending `useQueryResourceDetailSwr` with
  mutations (rejected — couples list revalidation to the whole detail payload);
  merging comments into the reviews page (rejected — spec mandates separate
  surfaces: discussion vs rating).

## Risks / Trade-offs

- [Mock persistence] Comments reset on reload → acceptable; noted as mock, shape
  matches assumed BE contract.
- [Optimistic identity] Guest display data unavailable → gated before submit, so
  optimistic items always have an authenticated user.
- [Detail hook drift] Dropping the embedded `comments` render may leave dead mock
  data → clean up in tasks, keep types compiling.

## Open Questions

- None blocking. Reply threading and pagination deferred to a future change.
