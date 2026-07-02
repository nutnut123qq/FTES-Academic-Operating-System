## Context

`ResourceDetail` (`src/components/features/resource/ResourceDetail/index.tsx`)
renders a read-only mock comments list inline (from `useQueryResourceDetailSwr`).
No composer, no states, no auth gating. Rating already exists separately at
`/resources/[resourceId]/reviews` (`ResourceRating`, local state). FE-only repo;
BE is mocked.

## Goals / Non-Goals

**Goals:** interactive comments on detail page per spec (composer, list,
optimistic append, delete-own, gating, states, i18n/a11y) with the
**Threads interaction pattern**: minimal rows, flat one-level replies,
per-comment like, sticky mobile composer; build + tsc green.
**Non-Goals:** real backend, nesting deeper than one reply level, edit
comment, share/save on comments, reactions beyond like, pagination beyond a
single mock page, any change to `ResourceRating`.

## Decisions

- **Component plan (house canon, HeroUI):** new sub-feature
  `ResourceDetail/ResourceComments/index.tsx` replacing the inline list;
  children `CommentComposer/` and `CommentItem/`; skeleton as a local
  `ResourceCommentsSkeleton` mirroring the list layout (HeroUI `Skeleton`).
  Reuse HeroUI `Textarea`, `Button`, `Avatar`, `Typography`; reuse existing
  `reuseable` blocks where they fit (no hand-rolled primitives). Composer is a
  standalone field → HeroUI `Textarea` (the flat-in-box exception applies only
  to AI chat composers).
- **Row anatomy (Threads-style, minimal):** each comment is a borderless row —
  no `Card`, no `border`, no boxed background: `Avatar` (initial fallback) on
  the left; right column = header line (`name · relative time`), comment text,
  then a thin action line of icon affordances: ♥ like (phosphor `HeartIcon`,
  `size-4`, count beside it) + a `reply` text link + delete (own comments
  only). Actions are quiet (`text-muted`, hover accent), never buttons-in-a-box.
  Rows are separated by vertical spacing only (no dividers/cards).
- **Flat reply model (one-level cap):** `ResourceComment` gains
  `parentId: string | null`. Top-level comments have `parentId === null`;
  replies render indented one level under their parent (avatar-gutter indent),
  ordered oldest-first within a parent. Tapping `reply` on a top-level comment
  targets that comment; tapping `reply` on a reply targets the reply's
  **top-level parent** (Threads behavior — no deeper nesting, ever). The
  reply composer is a small inline field under the target row with a cancel
  affordance; the mock create mutation accepts an optional `parentId`.
- **Comment like (mock mutation):** `likeCount: number` + `likedByMe: boolean`
  on `ResourceComment`; `useMutateToggleResourceCommentLikeSwr(resourceId)`
  toggles optimistically via SWR `mutate` (flip `likedByMe`, ±1 `likeCount`,
  rollback on error). Liked state renders a **filled red heart**
  (`weight="fill"`, danger color); unliked is the outline icon. No share/save
  affordances on comments. Guests hitting like get the auth modal (same gating
  path as posting).
- **Composer placement (sticky mobile / inline desktop):** on `<sm` viewports
  the composer sticks to the bottom of the viewport
  (`fixed inset-x-0 bottom-0` bar with surface background + top border, list
  gets bottom padding so the last row is never covered); from `sm:` up it
  renders inline at the top of the thread (above the list). One component,
  responsive placement — reply composers stay inline in both modes.
- **Data hooks (mock SWR):** `useQueryResourceCommentsSwr(resourceId)`,
  `useMutateCreateResourceCommentSwr(resourceId)` (accepts optional
  `parentId`), `useMutateDeleteResourceCommentSwr`, and
  `useMutateToggleResourceCommentLikeSwr` in
  `src/components/features/resource/hooks/`, mirroring `useQueryReviewsSwr`.
  Mock fetcher backed by an in-module store keyed by `resourceId`; optimistic
  append/remove/toggle via SWR `mutate` with rollback on error. Comments are decoupled
  from `useQueryResourceDetailSwr` (its embedded `comments` field is dropped
  from the detail view; hook shape kept for compatibility).
- **Auth gating:** read `state.keycloak.authenticated` (Redux); guest focus or
  submit → `useAuthenticationOverlayState().setOpen(true)` +
  `setAuthenticationModalTab(SignIn)` — same pattern as `AuthActions`.
- **Ordering + identity:** top-level comments newest-first by `createdAt`;
  replies oldest-first within their parent. Optimistic items get a temp id and
  the current user's display name/avatar from the user slice.
- **BE contract assumption (documented, not invented):** future API
  `GET/POST/DELETE /resources/:id/comments` +
  `POST /resources/:id/comments/:commentId/like` (toggle), returning
  `{ id, parentId, author { id, name, avatarUrl }, text, createdAt,
  likeCount, likedByMe }`; the server enforces the one-level cap by resolving
  any `parentId` that points at a reply to that reply's top-level parent;
  owner check via `author.id === currentUser.id`. Mock mirrors this shape so
  swap-in is a fetcher change only.
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
- [Sticky composer overlap] Fixed bottom bar on mobile can cover the last rows
  or clash with other fixed chrome → reserve bottom padding on the list and
  keep the bar single-field compact.
- [Like spam] Optimistic toggle with no debounce can flicker on rapid taps →
  acceptable for mock; note for BE to make toggle idempotent.

## Open Questions

- None blocking. Deeper nesting (beyond one reply level) and pagination
  deferred; explicitly out of scope per the Threads pattern decision.
