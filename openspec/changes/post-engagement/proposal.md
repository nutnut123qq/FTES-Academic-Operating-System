## Why

§6/§7 community & group posts today are read-only: `CommunityFeed` rows and `CommunityPostDetail`
render like/comment **counts** as plain text, `GroupFeed` shows none, and there is no way to like,
comment, or share anything. The API layer already ships unwired mutations
(`mutateReactCommunityPost`, `mutateCreateCommunityPostComment`), so the FE surface is the missing
piece. User intent: "Các bài đăng cho phép like share comment".

## What Changes

- **Like**: a toggleable like button on every community feed row, on the post detail header, and on
  every group feed post. Optimistic count/state update with rollback + error toast on failure.
- **Comment**: a comment composer on the post detail page (submit button + Enter), optimistic append
  to the thread, empty-input guard, error handling that preserves the draft. Feed rows link their
  comment count to the detail page's comments section (`#comments`).
- **Share**: a share menu on feed rows and post detail with exactly these options:
  1. "Sao chép liên kết" / "Copy link" — always present, copies the post's absolute URL, confirms
     with a success toast.
  2. "Chia sẻ qua…" / "Share via…" — only when the Web Share API (`navigator.share`) is available.
  3. "Chia sẻ về trang cá nhân" / "Share to your feed" — re-share stub that records a re-share and
     confirms via toast (community posts only; mock BE).
- **Guest gating**: like and comment are auth-gated — a signed-out user's attempt opens the
  `AuthenticationModal` instead of mutating. Copy-link/native share stay available to guests.
- **Counts formatting**: like/comment counts ≥ 1000 render compact ("1k", "1,2k" vi / "1.2k" en).
- **New reusable block** `PostEngagementBar` shared by community feed, post detail, and group feed.
- **i18n** vi/en for every new label/toast; **a11y**: like exposes `aria-pressed` + accessible
  names on all icon buttons.
- Mock SWR hooks extended (`liked` flag, mutable counts, comment append) with SWR-cache optimistic
  mutation; existing GraphQL mutations wired behind a mock-safe fallback (FE-only, no BE required).

## Capabilities

### New Capabilities
- `post-engagement`: like, comment, and share interactions on community posts (feed + detail) and
  group feed posts — optimistic updates, guest gating, share menu, count formatting, i18n, a11y.

### Modified Capabilities
- (none — no existing spec in `openspec/specs/` covers community/group feeds; those changes are
  pre-archive and their behavior is only extended, not contradicted)

## Impact

- **Components**: `src/components/features/community/CommunityFeed/`,
  `src/components/features/community/CommunityPostDetail/`,
  `src/components/features/group/GroupFeed/`; new `src/components/reuseable/PostEngagementBar/`.
- **Hooks**: `useQueryCommunityFeedSwr`, `useQueryPostDetailSwr`, `useQueryGroupFeedSwr` (extend
  types + expose optimistic mutators); new engagement mutation hooks under
  `features/community/hooks/` and `features/group/hooks/`.
- **API layer**: reuse `mutation-react-community-post.ts`, `mutation-create-community-post-comment.ts`
  (already present, currently unwired). No group-post mutation exists — group like is mock-only with
  a logged assumption.
- **Modules**: `modules/toast` (confirmations/errors), overlay store (`useAuthenticationOverlayState`)
  for guest gating; i18n message catalogs (vi/en) under `communityHub.engagement.*`.
- FE only, mock BE. `npm run build` (webpack) + `tsc --noEmit` must stay green.
