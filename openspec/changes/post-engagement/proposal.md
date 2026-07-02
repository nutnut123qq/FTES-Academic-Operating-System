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
- **Comment — inline push-down expansion** (product owner decision 2026-07-02: "Bấm vô xem comment
  là đẩy xuống chứ không nhảy sang trang khác như hiện tại"): tapping the 💬 button/count on a post
  in ANY feed (community feed, group feed, workspace Thảo luận) **expands the comment thread INLINE
  directly below that post** (Threads-style push-down accordion) — comment list (flat one-level
  replies) + composer — instead of navigating to the post detail page. Tapping 💬 again (or a
  collapse control, "Thu gọn"/"Collapse") collapses it. **No route change**, scroll position
  preserved, posts below are pushed down. Comments **lazy-load on first expand** (SWR fetch on
  expand, skeleton rows while loading; inline error state with retry). **Multiple posts can be
  expanded independently.** The composer behaves as before: submit button + Enter, optimistic
  append, empty-input guard, error handling that preserves the draft; comments support **flat
  one-level replies** (Threads-like — no deeper nesting). The post detail page **still exists**
  (deep links, notifications) and keeps its own composer, but feed interactions never force
  navigation — only the post title still navigates as before. On mobile the composer **sticks to
  the bottom of the viewport** on the post detail and, in feeds, for the **expanded post's composer
  while focused**.
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
  composition/order/visual language, optimistic like, **inline push-down comment expansion in
  feeds** (lazy-load, independent per post, no navigation), flat one-level replies, sticky mobile
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
  new `src/components/reuseable/PostEngagementBar/` and new
  `src/components/reuseable/PostCommentThread/` (the inline expandable comment region: list +
  composer, shared with the post detail page).
- **Hooks**: `useQueryCommunityFeedSwr`, `useQueryPostDetailSwr`, `useQueryGroupFeedSwr`, the
  workspace discussion feed hook (extend types + expose optimistic mutators); comment threads
  **lazy-fetched on first expand** (conditional SWR keyed per postId — community/Thảo luận reuse
  the post-detail cache, group posts get a mock comments hook); new engagement mutation hooks under
  `features/community/hooks/` and `features/group/hooks/`; save state consumed from the
  `save-for-later` change's post-save hook.
- **API layer**: reuse `mutation-react-community-post.ts`, `mutation-create-community-post-comment.ts`
  (already present, currently unwired). No group-post mutation exists — group like is mock-only with
  a logged assumption.
- **Modules**: `modules/toast` (confirmations/errors), overlay store (`useAuthenticationOverlayState`)
  for guest gating; i18n message catalogs (vi/en) under `communityHub.engagement.*`.
- FE only, mock BE. `npm run build` (webpack) + `tsc --noEmit` must stay green.
