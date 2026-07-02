## Context

- `CommunityFeed` renders post rows as one big `<Link>` to `/community/[postId]` with counts as a
  `Typography` line. `CommunityPostDetail` renders the post + a read-only comment list (no
  composer). `GroupFeed` renders plain post cards with no counts at all.
- Mock SWR hooks: `useQueryCommunityFeedSwr` (key `["community-feed"]`, `CommunityPost { likes, comments }`
  as plain numbers), `useQueryPostDetailSwr` (key `["post-detail", postId]`, `PostDetail.comments:
  Array<PostComment>`), `useQueryGroupFeedSwr` (key `["group-feed", groupId]`, no counts).
- API-layer mutations exist but are wired to nothing: `mutateReactCommunityPost`
  (`reactToCommunityPost` → `{ total, myReaction }`) and `mutateCreateCommunityPostComment`
  (`createCommunityPostComment` → full comment payload). There is **no** group-post mutation.
- House canon available: `modules/toast` (`useGraphQLWithToast` for GraphQL writes, `addToast`
  helpers for local confirmations), zustand overlay store (`useAuthenticationOverlayState` opens
  `AuthenticationModal`), redux `keycloak` slice holds `accessToken` (truthy ⇒ signed in),
  reuseable blocks live in `src/components/reuseable/`.
- Surface inventory (confirmed by exploration): **posts** — `CommunityFeed`, `CommunityPostDetail`,
  `GroupFeed`; **articles** — the `/blog/[slug]` long-form surface (query types exist under
  `modules/api/graphql/queries/types/blog.ts` / `query-blog-post(s).ts`; no rendered UI component
  yet, so this change scopes it as long-form article rendering); **discussion** —
  `GroupDiscussion` (thread list) and `SubjectCommunity` (the `/subjects/[id]/discussion` "Thảo
  luận" tab). Today none carry engagement controls (`SubjectCommunity` shows a read-only reactions
  chip; `GroupDiscussion` a reply-count chip).
- Related changes: `save-for-later` ships the save toggle mechanics (mock save contract
  `{ entityType, entityId, isFavorite }`, extended with entityType `post`/`article`) and the
  `/saved` page; per the matrix (Decision 0) only posts + articles expose 🔖, so discussion items
  are never saved; `subject-workspace-ia` renames the subject workspace community tab to **Thảo
  luận** — treated here as a **discussion** surface (like + comment only).
- Product owner decision (approved): "Các mục comment, like, lưu xem sau hãy làm như bên Threads"
  — Threads-style interactions across all post surfaces.
- Product owner decision (approved 2026-07-02): "Bấm vô xem comment là đẩy xuống chứ không nhảy
  sang trang khác như hiện tại" — tapping 💬 on a post in ANY feed expands the comment thread
  inline directly below that post (push-down accordion), never navigates to the detail page.

## Goals / Non-Goals

**Goals:**
- One shared Threads-style engagement bar (`PostEngagementBar`) powering EVERY post-like surface —
  community feed rows, post detail, group feed posts, articles/blog, group discussion threads, and
  the subject "Thảo luận" tab — `♥ like · 💬 comment · 🔁 share · 🔖 save` in a single thin row
  directly under the content, with an `actions` config prop selecting which buttons render per the
  per-surface engagement matrix (see Decision 0).
- Optimistic SWR-cache mutation with snapshot rollback; guest gating via `AuthenticationModal`;
  toasts for share confirmation and mutation errors; compact count formatting; vi/en i18n; a11y.
- **Inline push-down comment expansion in every feed**: tapping 💬 expands the thread (list +
  composer) directly below the post — lazy-loaded on first expand, independently expandable per
  post, no route change; the post detail page remains for deep links/notifications only.
- Flat one-level comment replies (Threads-like) and a mobile composer that sticks to the bottom of
  the viewport on the post detail and, in feeds, for the expanded post's composer while focused.
- Keep everything mock-safe: the app has no live BE here, so writes must succeed locally.

**Non-Goals:**
- Reaction *types* (heart/laugh/…): binary like only; `myReaction` maps to liked/not-liked.
- Nested replies beyond one level (replies-to-replies), comment editing/deletion, comment reactions
  (`mutation-react-community-post-comment` stays unwired).
- **Repost to own feed ("Chia sẻ về trang cá nhân") — explicitly deferred** per the Threads
  decision; the share menu ships copy-link + Web Share API only. Share analytics, notification
  fan-out also out.
- Save *mechanics* (store, persistence, `/saved` page, entityType `post` contract) — owned by the
  `save-for-later` change; here we only place and wire the button.
- Group post detail page (group feed still has no detail route — but group posts DO get the inline
  comment expansion like every other feed, backed by a mock comments hook since no BE contract
  exists).

## Decisions

0. **Per-surface engagement matrix + bar `actions` config prop** (product owner 2026-07-02: "Tùy
   từng mục có cần lưu xem sau và share không — ví dụ discussion thì không cần lưu xem sau và
   share"). Not every surface renders every action. `PostEngagementBar` takes an
   `actions?: { like?: boolean; comment?: boolean; share?: boolean; save?: boolean }` prop; **each
   flag defaults to `true`** (so a bare bar renders the full set), and a surface hides an action by
   passing `false` — the button is **not rendered at all** (absent, not disabled). Callers pass a
   named preset rather than raw booleans: `POST_ENGAGEMENT_ACTIONS` (all four) and
   `DISCUSSION_ENGAGEMENT_ACTIONS` (`{ like, comment }` only). The canonical matrix:

   | Surface | Kind | ♥ Like | 💬 Comment | 🔁 Share | 🔖 Save |
   | --- | --- | :---: | :---: | :---: | :---: |
   | Community feed (`CommunityFeed`) | post | ✅ | ✅ | ✅ | ✅ |
   | Community post detail (`CommunityPostDetail`) | post | ✅ | ✅ | ✅ | ✅ |
   | Group feed (`GroupFeed`) | post | ✅ | ✅ | ✅ | ✅ |
   | Article / blog (`/blog/[slug]`) | article | ✅ | ✅ | ✅ | ✅ |
   | Group discussion (`GroupDiscussion`) | discussion | ✅ | ✅ | ❌ | ❌ |
   | Subject "Thảo luận" tab (`SubjectCommunity`, `/subjects/[id]/discussion`) | discussion | ✅ | ✅ | ❌ | ❌ |

   **Posts + articles get the FULL bar** (like + comment + share + save). **Discussion surfaces get
   like + comment ONLY** — no 🔖 save, no 🔁 share. Rationale: discussion threads are ephemeral
   conversation, not shareable/bookmarkable long-form content; saving/sharing a thread is noise. The
   save (🔖) button's placement is thereby owned here (never on discussion); the `save-for-later`
   change owns save *mechanics* and carries a cross-reference note that discussion items are not
   saveable. Alternative — one always-full bar with per-surface CSS-hiding — rejected: hidden-but-
   present buttons still take DOM/focus order and leak into a11y traversal; the matrix must be a
   real render decision, not styling.

1. **New reuseable block `src/components/reuseable/PostEngagementBar/` — Threads visual language.**
   ONE single row directly under the post content, in this exact order:
   `♥ like-count · 💬 comment-count · 🔁 share · 🔖 save`. Thin icon buttons, **no borders, no
   background fills** (ghost buttons), counts rendered inline right next to their icon (like and
   comment only — share/save carry no counts). Active states: **filled red heart** when liked,
   **filled bookmark** when saved; inactive = outline icons in the muted foreground color.
   Props: `actions?` (the matrix config from Decision 0 — share/save render only when their flag is
   true), `likes`, `liked`, `commentsCount`, `postUrl`, `postId`, `onToggleLike`, plus the comment
   disclosure contract: `commentsExpanded: boolean` + `onToggleComments()` on feed surfaces (the 💬
   button is a **disclosure button** — `aria-expanded={commentsExpanded}`, `aria-controls` pointing
   at the expanded region's id) and `onCommentClick?` on the post detail (comments are already
   visible there — 💬 focuses the composer). The former `commentHref` link variant is **dropped**:
   💬 never navigates (2026-07-02 decision). Alternative — inline per component — rejected: six
   surfaces would drift (that is exactly today's bug). When `actions.share`/`actions.save` is false
   the share-URL / save-hook wiring is skipped entirely so discussion surfaces need no post URL or
   save contract.
2. **Feed row nesting**: `CommunityFeed` rows stay a `<Link>` (the title/row click still navigates
   to the detail, unchanged); the bar's buttons call `event.preventDefault()` +
   `event.stopPropagation()` so like/comment/share/save never navigate. The **expanded comment
   region renders as a SIBLING below the `<Link>` row** (inside the same list-item wrapper), NOT
   inside the link — otherwise every click in the thread (composer, reply, retry) would navigate.
   Alternative — restructure rows so only the title is a link — rejected as a larger visual change
   out of scope.
   2b. **Inline expandable comment region — new reuseable block
   `src/components/reuseable/PostCommentThread/`** (2026-07-02 decision: push-down, not navigate).
   Renders the comment list (flat one-level replies, same rendering as the detail page) + the
   composer, directly below the post, pushing subsequent posts down (document flow — no overlay, no
   fixed height). Collapse via the 💬 toggle or an explicit "Thu gọn"/"Collapse" control at the
   bottom of the region. **Expansion state lives in the feed component as a per-postId set**
   (`Set<postId>` in local state — multiple posts expanded independently; collapsing one never
   touches another). No route change and no scrolling on toggle: the region expands in place below
   the post, so scroll position is preserved. On expand, focus moves into the expanded region
   (region container `tabIndex={-1}` + localized label). The block is shared by community feed,
   group feed, the Thảo luận feed, AND the detail page's comments section (detail renders it
   permanently expanded), so thread rendering cannot drift between surfaces.
   2c. **SWR-on-expand (lazy comments)**: comments are fetched on FIRST expand, not with the feed.
   The thread hook is conditional SWR — key `null` until expanded once, then
   `["post-detail", postId]` for community/Thảo luận posts (reusing `useQueryPostDetailSwr`'s cache
   so the inline thread, the detail page, and optimistic comment mutations share ONE source of
   truth) and `["group-post-comments", groupId, postId]` for group posts (mock-only, no BE
   contract). While loading: skeleton comment rows (avatar circle + two text bars, mirroring real
   layout). On fetch error: inline error state INSIDE the region with a localized retry button
   (re-triggers the SWR fetch) — no toast, no collapse. Once loaded, re-expanding shows the cached
   thread instantly (SWR cache retained on collapse).
3. **SWR cache mutation strategy (optimistic + rollback)**: each query hook exposes a bound
   `mutate`. Engagement hooks do: snapshot `data` → `mutate(optimisticNext, { revalidate: false })`
   → run the write → on failure `mutate(snapshot, { revalidate: false })`. Because mock fetchers
   are deterministic, `revalidate: false` is mandatory or SWR would clobber optimistic state.
   Like state on detail and feed use **separate keys**, so the like hook mutates both caches
   (`["community-feed"]` and `["post-detail", postId]`) when both exist — `useSWRConfig().mutate`
   with the global key.
4. **Reuse existing mutations behind a mock fallback**: `useMutateReactPost` /
   `useMutateCreatePostComment` call `mutateReactCommunityPost` / `mutateCreateCommunityPostComment`
   wrapped in try/catch; any transport error (no BE in this skeleton) resolves to a locally
   fabricated success payload so the optimistic state sticks. Rollback still triggers on *explicit*
   `success: false` envelopes. This keeps the call sites identical for the drop-in BE swap
   (CLAUDE.md: mock what's missing, don't invent APIs — these two exist).
   **Group like**: no BE contract exists → pure local cache mutation, assumption logged in code.
5. **Guest gating**: `const accessToken = useAppSelector((state) => state.keycloak.accessToken)`;
   falsy ⇒ `useAuthenticationOverlayState().setOpen(true)` and *no* optimistic change. Applied to
   like toggle, comment/reply submit, and save toggle; copy-link/native share are not gated
   (harmless read-side actions).
6. **Share menu (🔁) — copy-link + Web Share only**: HeroUI dropdown/popover from the share icon
   button. Items in order: copy link (always; `navigator.clipboard.writeText` with a
   hidden-textarea `execCommand` fallback, then success toast), native share (render only when
   `typeof navigator !== "undefined" && !!navigator.share`; user-cancel `AbortError` is swallowed
   silently). **No re-share/repost item** — "repost to own feed" is explicitly deferred per the
   Threads decision (the former `onReshare` prop and reshare i18n keys are dropped). Post URL built
   from `window.location.origin` + localized `/community/[postId]`.
7. **Comment composer — sticky on mobile, flat one-level replies**: controlled textarea + primary
   send button, rendered by `PostCommentThread` (so the SAME composer appears in every expanded
   inline thread AND in the detail comments section). On the detail page the section keeps its
   `id="comments"` anchor with autofocus when the URL hash is `#comments` (deep links from
   notifications still work). **On mobile (`<sm`) the composer sticks to the bottom of the
   viewport** (`fixed bottom-0` / `sticky bottom-0`, above the tab bar if any) in two cases:
   (a) while the post detail is open — as before; (b) in a feed, for the **EXPANDED post's
   composer while it is focused** — on focus the expanded post's composer pins to the bottom, on
   blur/collapse it returns in-flow, so replying never requires scrolling back down — Threads
   behavior; from `sm:` up it renders in-flow with the thread.
   Submit disabled while trimmed value is empty or a submit is in flight. Optimistic append (temp
   id `tmp-${Date.now()}`, author = current user's display name or the vi/en "Bạn"/"You" label,
   time label = "vừa xong"/"just now"), count +1, input cleared; on error the comment is removed,
   the count restored, and the draft restored into the input. Errors surface through the toast
   module (no bespoke inline error UI).
   **Replies are flat, one level deep (Threads-like)**: each top-level comment exposes a
   "Trả lời"/"Reply" affordance that switches the (same, sticky-on-mobile) composer into reply
   mode (visible "replying to @author" chip with an × to cancel). Submitting appends the reply
   under that comment, indented one level; **replies themselves expose no reply affordance** — no
   deeper nesting. `PostDetail.comments` gains `replies: Array<PostComment>`; reply counts fold
   into the total comment count.
8. **Counts formatting**: shared `formatCompactCount(count, locale)` util using
   `Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 })` — 999 → "999",
   1000 → "1k"/"1 N" per locale data, 1234 → "1,2k" (vi) / "1.2K" (en). Lives beside the block so
   all three surfaces share it.
9. **a11y**: like button `aria-pressed={liked}` and save button `aria-pressed={saved}`, each with a
   localized `aria-label` ("Thích"/"Like", "Lưu xem sau"/"Save for later"); the 💬 button on feed
   surfaces is a **disclosure button** — `aria-expanded` reflecting the expanded state and
   `aria-controls` referencing the expanded region's id (`post-comments-${postId}`); on expand,
   focus moves into the expanded region; comment and share icon buttons get `aria-label`s; the
   share menu is a real menu (arrow-key + Escape via HeroUI); toasts announce via the existing
   toast region.
10. **i18n**: new `communityHub.engagement.*` namespace (like, unlike, comment, share, copyLink,
    linkCopied, shareVia, save, saved, reply, replyingTo, cancelReply, commentPlaceholder,
    commentSend, commentFailed, likeFailed, justNow, you, plus the inline-expansion keys:
    collapse — "Thu gọn"/"Collapse", commentsRegion — accessible name of the expanded region,
    commentsLoadFailed, retry) in both `vi` and `en` catalogs. The former `reshare`/`reshared`
    keys are dropped (repost deferred).
11. **Save button state comes from the `save-for-later` change — do not re-own it.** That change's
    mock save contract is generalized to `{ entityType: "post", entityId: postId, isFavorite }`;
    `PostEngagementBar` consumes its post-save hook (read `saved`, call `toggle`) and only renders
    the 🔖 button (placement, filled/outline state, guest gate before calling toggle). Saved posts
    then surface on that change's `/saved` page with no extra work here. Alternative — a second
    post-local save store in this change — rejected: two sources of truth for the same bookmark.
    If `save-for-later` ships later, the bar hides the save button behind the hook's availability
    (render nothing until the contract exists) rather than stubbing a divergent one.
12. **Workspace Thảo luận feed is the fourth surface, same bar, zero fork.** `subject-workspace-ia`
    renames the workspace community tab to Thảo luận; the posts listed there render
    `PostEngagementBar` exactly like community feed rows (like via the community react hook when
    the post is a community post; the feed's own SWR cache is mutated with the same
    snapshot/rollback pattern). No workspace-specific variant props.

## Risks / Trade-offs

- [Feed and detail caches disagree after a like on one surface] → the like hook mutates both SWR
  keys; keys that were never fetched are simply absent and ignored.
- [Deterministic mock fetchers overwrite optimistic state on revalidation (focus/reconnect)] →
  all optimistic writes use `revalidate: false`; acceptable for a mock BE, and the real BE swap
  replaces fetchers wholesale.
- [Clipboard API unavailable (insecure context/older WebView)] → textarea + `document.execCommand("copy")`
  fallback; failure toasts an error instead of silently lying.
- [Like button inside a `<Link>` row can trigger navigation] → `preventDefault` + `stopPropagation`
  on every interactive element in the bar; covered by an explicit spec scenario.
- [No BE contract for group-post like] → local-only mutation with a `// ponytail: mock BE` note;
  when the group contract lands this becomes a Modified requirement.
- [Cross-change coupling: save state depends on `save-for-later`, surface naming depends on
  `subject-workspace-ia`] → bar renders the save button only when the save contract is available;
  the Thảo luận feed wiring keys off the feed component, not the tab label, so the rename cannot
  break it.
- [Sticky mobile composer can cover the last comments] → the comments list gets bottom padding
  equal to the composer height on `<sm`; keyboard-open viewports rely on `sticky`/visual-viewport
  behavior, verified manually.
- [Expanded region inside the row `<Link>` would navigate on any thread click] → the region is a
  sibling of the link inside the list-item wrapper (decision 2), never a descendant of the link.
- [Expanding could jump the viewport] → expansion is pure push-down in document flow below the
  post; no `scrollIntoView`, no anchor jump — scroll position is preserved by construction.
- [Many expanded threads at once inflate the DOM] → accepted; threads are mock-sized. Collapsed
  regions unmount their list (SWR cache keeps the data for instant re-expand).
- [Feed comment-count cache vs lazily fetched thread disagree] → community/Thảo luận threads reuse
  the `["post-detail", postId]` cache that the comment mutation hook already mutates (decision 3),
  so inline thread, detail page, and counts share one optimistic source of truth.
- [Existing mock comments are a flat array] → `replies` added as an optional field; comments
  without it render as before (no reply rows), so seed-data migration is incremental.

## Open Questions

- (none blocking — reaction types, replies-to-replies, and repost-to-own-feed deliberately
  deferred, see Non-Goals)
