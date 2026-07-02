## Why

§6/§7 community & group posts today are read-only: `CommunityFeed` rows and `CommunityPostDetail`
render like/comment **counts** as plain text, `GroupFeed` shows none, and there is no way to like,
comment, or share anything. The API layer already ships unwired mutations
(`mutateReactCommunityPost`, `mutateCreateCommunityPostComment`), so the FE surface is the missing
piece. User intent: "Các bài đăng cho phép like share comment".

## What Changes

- **Threads-style engagement bar** (product owner decision: "Các mục comment, like, lưu xem sau hãy
  làm như bên Threads"): every post — community feed rows, post detail, group feed posts, **and the
  subject workspace "Thảo luận" tab feed** (the `subject-workspace-ia` change renames the workspace
  community tab to Thảo luận) — renders ONE shared action bar directly under the post content:
  `♥ like-count · 💬 comment-count · 🔁 share · 🔖 save`. Thin icon buttons, NO borders or
  background fills, counts inline next to the icons, single row. Active states: filled red heart
  when liked, filled bookmark when saved.
- **Like**: the ♥ button toggles like with optimistic count/state update, rollback + error toast on
  failure.
- **Comment**: a comment composer on the post detail page (submit button + Enter), optimistic append
  to the thread, empty-input guard, error handling that preserves the draft. Comments support
  **flat one-level replies** (Threads-like — no deeper nesting), and on mobile the composer
  **sticks to the bottom of the viewport** while the post detail is open. Feed rows link their
  comment count to the detail page's comments section (`#comments`).
- **Share (🔁)**: copy-link + Web Share API only:
  1. "Sao chép liên kết" / "Copy link" — always present, copies the post's absolute URL, confirms
     with a success toast.
  2. "Chia sẻ qua…" / "Share via…" — only when the Web Share API (`navigator.share`) is available.
  "Repost to own feed" ("Chia sẻ về trang cá nhân") is **explicitly deferred** — no re-share item.
- **Save (🔖)**: the save-for-later toggle JOINS the bar. Save *mechanics* (entityType `post`, mock
  save store, persistence, the `/saved` page) are owned by the `save-for-later` change; this change
  owns the button's **placement and behavior inside the bar** (position, active state, guest
  gating).
- **Guest gating**: like, comment, and save are auth-gated — a signed-out user's attempt opens the
  `AuthenticationModal` instead of mutating. Copy-link/native share stay available to guests.
- **Counts formatting**: like/comment counts ≥ 1000 render compact ("1k", "1,2k" vi / "1.2k" en).
- **New reusable block** `PostEngagementBar` shared by community feed, post detail, group feed, and
  the workspace Thảo luận feed.
- **i18n** vi/en for every new label/toast; **a11y**: like/save expose `aria-pressed` + accessible
  names on all icon buttons.
- Mock SWR hooks extended (`liked` flag, mutable counts, comment + reply append) with SWR-cache
  optimistic mutation; existing GraphQL mutations wired behind a mock-safe fallback (FE-only, no BE
  required).

## Capabilities

### New Capabilities
- `post-engagement`: the Threads-style engagement bar (like · comment · share · save) on community
  posts (feed + detail), group feed posts, and the subject workspace Thảo luận feed — bar
  composition/order/visual language, optimistic like, flat one-level replies, sticky mobile
  composer, share menu, save-button placement, guest gating, count formatting, i18n, a11y.

### Modified Capabilities
- (none — no existing spec in `openspec/specs/` covers community/group feeds; those changes are
  pre-archive and their behavior is only extended, not contradicted)

### Cross-change References
- `save-for-later` — owns save *mechanics* for entityType `post` (mock save contract
  `{ entityType: "post", entityId, isFavorite }`, persistence, `/saved` page). This change only
  places the 🔖 button in the bar and binds it to that contract.
- `subject-workspace-ia` — renames the subject workspace community tab to **Thảo luận**; this
  change covers the posts rendered in that tab's feed with the same engagement bar.

## Impact

- **Components**: `src/components/features/community/CommunityFeed/`,
  `src/components/features/community/CommunityPostDetail/`,
  `src/components/features/group/GroupFeed/`, the subject workspace Thảo luận tab feed component;
  new `src/components/reuseable/PostEngagementBar/`.
- **Hooks**: `useQueryCommunityFeedSwr`, `useQueryPostDetailSwr`, `useQueryGroupFeedSwr`, the
  workspace discussion feed hook (extend types + expose optimistic mutators); new engagement
  mutation hooks under `features/community/hooks/` and `features/group/hooks/`; save state consumed
  from the `save-for-later` change's post-save hook.
- **API layer**: reuse `mutation-react-community-post.ts`, `mutation-create-community-post-comment.ts`
  (already present, currently unwired). No group-post mutation exists — group like is mock-only with
  a logged assumption.
- **Modules**: `modules/toast` (confirmations/errors), overlay store (`useAuthenticationOverlayState`)
  for guest gating; i18n message catalogs (vi/en) under `communityHub.engagement.*`.
- FE only, mock BE. `npm run build` (webpack) + `tsc --noEmit` must stay green.
