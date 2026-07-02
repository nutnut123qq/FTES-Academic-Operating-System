## 1. Data layer — types, cache mutators, engagement hooks

- [ ] 1.1 Extend `useQueryCommunityFeedSwr`: add `liked: boolean` to `CommunityPost`, expose the
      bound SWR `mutate` from the hook return
- [ ] 1.2 Extend `useQueryPostDetailSwr`: add `liked: boolean` to `PostDetail`, expose `mutate`
- [ ] 1.3 Extend `useQueryGroupFeedSwr`: add `likes: number` + `liked: boolean` to `GroupPost`
      (seed mock counts), expose `mutate`
- [ ] 1.4 Add `formatCompactCount(count, locale)` util (Intl compact, max 1 fraction digit) next to
      the new block, with a JSDoc note on vi/en output
- [ ] 1.5 New hook `useMutateReactPostSwr` (features/community/hooks): guest check → open
      `AuthenticationModal` via `useAuthenticationOverlayState`; optimistic mutate of BOTH
      `["community-feed"]` and `["post-detail", postId]` caches (`revalidate: false`), snapshot
      rollback on explicit `success: false`, call `mutateReactCommunityPost` in try/catch with
      mock-transport fallback treated as success
- [ ] 1.6 New hook `useMutateCreatePostCommentSwr`: guest check; optimistic append (temp id,
      "you" author label, "just now" time label) + count +1 on `["post-detail", postId]` and
      count +1 on the feed cache; rollback restores thread, count, and draft; wraps
      `mutateCreateCommunityPostComment` with the same mock fallback; accepts an optional
      `parentCommentId` — when set, the optimistic append goes into that comment's `replies`
      array (one level only) and still bumps the total count
- [ ] 1.7 Extend `PostComment` with optional `replies: Array<PostComment>` (seed a few mock
      replies); comments without the field render unchanged
- [ ] 1.8 New hook `useMutateReactGroupPostSwr` (features/group/hooks): guest check + local-only
      optimistic mutate of `["group-feed", groupId]` (no BE contract — `// ponytail: mock BE` note)
- [ ] 1.9 Lazy comment-thread fetch (SWR on expand): conditional SWR key = `null` until the post's
      first expand — community/Thảo luận posts reuse `["post-detail", postId]`
      (`useQueryPostDetailSwr`) so inline thread, detail page, and comment mutations share ONE
      cache; group posts get a mock `useQueryGroupPostCommentsSwr`
      (`["group-post-comments", groupId, postId]`, seeded mock comments, `// ponytail: mock BE`)

## 2. PostEngagementBar block (Threads style)

- [ ] 2.1 Create `src/components/reuseable/PostEngagementBar/index.tsx` — ONE row in exact order
      `♥ like-count · 💬 comment-count · 🔁 share · 🔖 save`: thin icon buttons, NO borders/
      background fills, counts inline next to icons; like button (`aria-pressed`, localized
      `aria-label`, **filled red heart** when liked / outline otherwise, compact count), comment
      **disclosure button** (count; feeds: `commentsExpanded` + `onToggleComments` with
      `aria-expanded` + `aria-controls={post-comments-${postId}}` — NO `commentHref`, 💬 never
      navigates; detail: `onCommentClick` focuses the composer), share menu trigger, save button —
      all buttons `preventDefault` + `stopPropagation`
- [ ] 2.1b Create `src/components/reuseable/PostCommentThread/index.tsx` — the inline expandable
      comment region (id `post-comments-${postId}`, `tabIndex={-1}` + localized accessible name,
      focus moved into it on expand): comment list with flat one-level replies + the composer;
      loading = skeleton comment rows (avatar circle + two text bars); fetch error = inline
      localized error + retry button (re-fetch in place, no collapse, no toast); bottom
      "Thu gọn"/"Collapse" control; pure push-down in document flow (no overlay/fixed height);
      reused by all three feeds AND the detail comments section (detail = permanently expanded)
- [ ] 2.2 Share menu inside the block: copy-link item (clipboard write + `execCommand` fallback →
      success toast), native-share item rendered only when `navigator.share` exists (swallow
      `AbortError`); keyboard-operable menu; NO repost/re-share item (explicitly deferred)
- [ ] 2.3 Save button wiring: consume the `save-for-later` change's post-save hook
      (`entityType: "post"`, `entityId: postId`) for `saved` state + toggle; **filled bookmark**
      when saved, `aria-pressed={saved}`, guest check → `AuthenticationModal` before toggling;
      render the button only when the save contract is available
- [ ] 2.4 Export the block per house canon (named export, JSDoc header, WithClassNames if applicable)

## 3. Community feed wiring

- [ ] 3.1 Replace the counts `Typography` line in `CommunityFeed` rows with `PostEngagementBar`
      (likes/liked from hook, share URL from post id, `onToggleLike` → `useMutateReactPostSwr`;
      💬 wired to `onToggleComments` — no `commentHref`, title/row link keeps navigating)
- [ ] 3.2 Inline expansion state per postId in the feed component (`Set<postId>` local state —
      multiple posts expanded independently); render `PostCommentThread` as a SIBLING below the
      row `<Link>` (never inside it) when expanded; no route change, no scroll jump on toggle
- [ ] 3.3 Verify like/comment/share/save clicks inside the row `<Link>` never navigate
      (preventDefault path), and clicks inside the expanded thread never navigate either

## 4. Post detail — like + comment composer + flat replies

- [ ] 4.1 Replace the likes `Typography` line in `CommunityPostDetail` with `PostEngagementBar`
      (detail variant: `onCommentClick` focuses the composer)
- [ ] 4.2 Render the detail comments section via `PostCommentThread` (permanently expanded); keep
      `id="comments"` on the section for deep links/notifications (feed no longer links here); the
      composer (textarea + primary send button, Enter submits, disabled when trimmed-empty or in
      flight) autofocuses when the URL hash is `#comments`
- [ ] 4.3 Sticky mobile composer: on `<sm` the composer is affixed to the bottom of the viewport
      (a) while the detail is open, and (b) in feeds, for the EXPANDED post's composer while
      focused — back in-flow on blur/collapse (in-flow from `sm:` up); give the comments list
      bottom padding equal to the composer height so the last comment is never obscured
- [ ] 4.4 Flat one-level replies: "Trả lời"/"Reply" affordance on top-level comments switches the
      composer into reply mode (replying-to chip + × cancel that keeps the draft); submit appends
      the reply indented under the parent via `parentCommentId`; replies render WITHOUT a reply
      affordance (no second level)
- [ ] 4.5 Wire submit to `useMutateCreatePostCommentSwr`: optimistic append (top-level or reply) +
      count bump + clear input; on failure remove the optimistic comment/reply, restore count and
      draft, error toast

## 5. Group feed wiring

- [ ] 5.1 Add `PostEngagementBar` to `GroupFeed` post cards (like via `useMutateReactGroupPostSwr`,
      full bar incl. share + save) with the same inline comment expansion: 💬 toggles
      `PostCommentThread` below the card, backed by the mock `useQueryGroupPostCommentsSwr`
      (lazy on first expand, skeleton + inline retry, independent per post)

## 6. Workspace Thảo luận feed wiring

- [ ] 6.1 Render `PostEngagementBar` under each post in the subject workspace Thảo luận tab feed
      (tab renamed by `subject-workspace-ia`) — same wiring as community feed rows, including the
      inline 💬 expansion (`PostCommentThread`, lazy fetch via the post-detail cache, per-postId
      expansion set); mutate that feed's own SWR cache with the same snapshot/rollback pattern;
      no workspace-specific variant

## 7. i18n + polish

- [ ] 7.1 Add `communityHub.engagement.*` messages (vi + en): like, unlike, comment,
      commentPlaceholder, commentSend, reply, replyingTo, cancelReply, share, copyLink, linkCopied,
      shareVia, save, saved, likeFailed, commentFailed, justNow, you, collapse ("Thu gọn" /
      "Collapse"), commentsRegion (accessible name of the expanded region), commentsLoadFailed,
      retry (no reshare keys — repost deferred)
- [ ] 7.2 Sweep components for hardcoded strings; confirm all toasts use the toast module hooks
- [ ] 7.3 A11y pass: `aria-pressed` on like AND save, `aria-label` on comment/share icon buttons,
      💬 disclosure semantics (`aria-expanded` + `aria-controls`, focus moves into the expanded
      region on expand), share menu Escape/arrow-key behavior

## 8. Verify

- [ ] 8.1 Manual sanity in `npm run dev`: like toggle on feed/detail/group/Thảo luận feed, save
      toggle (filled bookmark + appears on `/saved`), guest → auth modal (like/comment/save; guest
      CAN expand and read), comment + reply submit/empty/error, sticky composer on mobile width
      (detail + focused expanded-post composer), 💬 inline expansion on all three feeds (push-down
      below the post, no route change, scroll preserved, collapse via 💬/"Thu gọn", skeleton on
      first expand, inline error + retry, cached re-expand, two posts expanded at once, title still
      navigates), no repost item in share menu, copy-link toast, count formatting at ≥1000
- [ ] 8.2 `npm run build` (webpack) green
- [ ] 8.3 `tsc --noEmit` clean
