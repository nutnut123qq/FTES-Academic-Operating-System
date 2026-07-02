## Why

§6/§7 community & group posts today are read-only: `CommunityFeed` rows and `CommunityPostDetail`
render like/comment **counts** as plain text, `GroupFeed` shows none, and there is no way to like,
comment, or share anything. The API layer already ships unwired mutations
(`mutateReactCommunityPost`, `mutateCreateCommunityPostComment`), so the FE surface is the missing
piece. User intent: "Các bài đăng cho phép like share comment".

## What Changes

- **Threads-style engagement bar** (product owner decision: "Các mục comment, like, lưu xem sau hãy
  làm như bên Threads"): every post-like surface — community feed rows, post detail, group feed
  posts, **articles/blog (bài viết)**, **discussion threads** (group discussion + the subject
  workspace "Thảo luận" tab) — renders ONE shared action bar directly under the content. The FULL
  bar is `♥ like-count · 💬 comment-count · 🔁 share · 🔖 save`. Thin icon buttons, NO borders or
  background fills, counts inline next to the icons, single row. Active states: filled red heart
  when liked, filled bookmark when saved.
- **Per-surface engagement matrix** (product owner decision 2026-07-02, Vietnamese: "Tùy từng mục
  có cần lưu xem sau và share không — ví dụ discussion thì không cần lưu xem sau và share"): NOT
  every surface renders every action. The bar takes a config/prop selecting which actions render
  per surface. Canonical decision (see the matrix table in `design.md`):
  - **Bài đăng (posts) + Bài viết (articles/blog)** — community feed + detail, group feed,
    subject-scoped post feeds, `/blog/[slug]` articles: **Like + Comment + Save (🔖) + Share (full
    bar)**.
  - **Discussion (group discussion threads + the subject workspace "Thảo luận" tab)**: **Like +
    Comment ONLY — NO save, NO share.**
  The engagement bar defaults to the full set; discussion surfaces pass a config that hides the 🔖
  and 🔁 buttons entirely (not disabled — absent).
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
- **Share (🔁)** — only on surfaces the matrix allows (posts + articles, **NOT discussion**):
  copy-link + Web Share API only:
  1. "Sao chép liên kết" / "Copy link" — always present, copies the post's absolute URL, confirms
     with a success toast.
  2. "Chia sẻ qua…" / "Share via…" — only when the Web Share API (`navigator.share`) is available.
  "Repost to own feed" ("Chia sẻ về trang cá nhân") is **explicitly deferred** — no re-share item.
- **Save (🔖)** — only on surfaces the matrix allows (posts + articles, **NOT discussion**): the
  save-for-later toggle JOINS the bar. Save *mechanics* (entityType `post`/`article`, mock save
  store, persistence, the `/saved` page) are owned by the `save-for-later` change; this change owns
  the button's **placement and behavior inside the bar** (position, active state, guest gating) —
  including the decision that discussion items expose **no** 🔖 button, so discussion threads are
  never saveable.
- **Guest gating**: like, comment, and save are auth-gated — a signed-out user's attempt opens the
  `AuthenticationModal` instead of mutating. Copy-link/native share stay available to guests.
- **Counts formatting**: like/comment counts ≥ 1000 render compact ("1k", "1,2k" vi / "1.2k" en).
- **New reusable block** `PostEngagementBar` shared by ALL post-like surfaces (community feed +
  detail, group feed, articles/blog, group discussion, subject "Thảo luận"), taking an `actions`
  config prop that selects which of like/comment/share/save render per the matrix.
- **i18n** vi/en for every new label/toast; **a11y**: like/save expose `aria-pressed` + accessible
  names on all icon buttons.
- Mock SWR hooks extended (`liked` flag, mutable counts, comment + reply append) with SWR-cache
  optimistic mutation; existing GraphQL mutations wired behind a mock-safe fallback (FE-only, no BE
  required).

## Capabilities

### New Capabilities
- `post-engagement`: the Threads-style engagement bar (like · comment · share · save) on ALL
  post-like surfaces — community posts (feed + detail), group feed posts, articles/blog, group
  discussion, and the subject workspace "Thảo luận" tab — driven by a **per-surface engagement
  matrix** (posts + articles = full bar; discussion = like + comment only, NO save/share). Covers
  the bar's `actions` config prop, composition/order/visual language, optimistic like, **inline
  push-down comment expansion in feeds** (lazy-load, independent per post, no navigation), flat
  one-level replies, sticky mobile composer, share menu (posts/articles only), save-button
  placement (posts/articles only), guest gating per action, count formatting, i18n, a11y.

### Modified Capabilities
- (none — no existing spec in `openspec/specs/` covers community/group feeds; those changes are
  pre-archive and their behavior is only extended, not contradicted)

### Cross-change References
- `save-for-later` — owns save *mechanics* for entityType `post`/`article` (mock save contract
  `{ entityType, entityId, isFavorite }`, persistence, `/saved` page). This change only places the
  🔖 button in the bar and binds it to that contract, **and owns the placement decision that
  discussion threads carry no 🔖 button (never saveable)**. A small cross-reference note is added to
  that change's spec so it does not claim discussion items are saveable.
- `subject-workspace-ia` — renames the subject workspace community tab to **Thảo luận**; per the
  matrix this change treats that tab as a **discussion** surface (like + comment only, no
  save/share).

## Impact

- **Components** (posts + articles = full bar): `src/components/features/community/CommunityFeed/`,
  `src/components/features/community/CommunityPostDetail/`,
  `src/components/features/group/GroupFeed/`, and the blog/article surface (`/blog/[slug]`, backed by
  `query-blog-post(s)` — types exist under `modules/api/graphql/queries/types/blog.ts`; UI is scoped
  here as long-form article rendering).
  **Discussion = like + comment only**: `src/components/features/group/GroupDiscussion/` and
  `src/components/features/subject/SubjectCommunity/` (the `/subjects/[id]/discussion` "Thảo luận"
  tab). New `src/components/reuseable/PostEngagementBar/` (with the `actions` config prop) and new
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
