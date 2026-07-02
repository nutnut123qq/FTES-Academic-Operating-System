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

## 2. PostEngagementBar block (Threads style)

- [ ] 2.1 Create `src/components/reuseable/PostEngagementBar/index.tsx` — ONE row in exact order
      `♥ like-count · 💬 comment-count · 🔁 share · 🔖 save`: thin icon buttons, NO borders/
      background fills, counts inline next to icons; like button (`aria-pressed`, localized
      `aria-label`, **filled red heart** when liked / outline otherwise, compact count), comment
      affordance (count; `commentHref` link variant for feeds, `onCommentClick` variant for
      detail), share menu trigger, save button — all buttons `preventDefault` + `stopPropagation`
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
      (likes/liked from hook, `commentHref={/community/[id]#comments}`, share URL from post id,
      `onToggleLike` → `useMutateReactPostSwr`)
- [ ] 3.2 Verify like/share/save clicks inside the row `<Link>` never navigate (preventDefault path)

## 4. Post detail — like + comment composer + flat replies

- [ ] 4.1 Replace the likes `Typography` line in `CommunityPostDetail` with `PostEngagementBar`
      (detail variant: `onCommentClick` focuses the composer)
- [ ] 4.2 Add `id="comments"` to the comments section; add the composer (textarea + primary send
      button, Enter submits, disabled when trimmed-empty or in flight); autofocus when URL hash is
      `#comments`
- [ ] 4.3 Sticky mobile composer: on `<sm` the composer is affixed to the bottom of the viewport
      while the detail is open (in-flow from `sm:` up); give the comments list bottom padding equal
      to the composer height so the last comment is never obscured
- [ ] 4.4 Flat one-level replies: "Trả lời"/"Reply" affordance on top-level comments switches the
      composer into reply mode (replying-to chip + × cancel that keeps the draft); submit appends
      the reply indented under the parent via `parentCommentId`; replies render WITHOUT a reply
      affordance (no second level)
- [ ] 4.5 Wire submit to `useMutateCreatePostCommentSwr`: optimistic append (top-level or reply) +
      count bump + clear input; on failure remove the optimistic comment/reply, restore count and
      draft, error toast

## 5. Group feed wiring

- [ ] 5.1 Add `PostEngagementBar` to `GroupFeed` post cards (like via `useMutateReactGroupPostSwr`,
      comment count display-only, full bar incl. share + save)

## 6. Workspace Thảo luận feed wiring

- [ ] 6.1 Render `PostEngagementBar` under each post in the subject workspace Thảo luận tab feed
      (tab renamed by `subject-workspace-ia`) — same wiring as community feed rows; mutate that
      feed's own SWR cache with the same snapshot/rollback pattern; no workspace-specific variant

## 7. i18n + polish

- [ ] 7.1 Add `communityHub.engagement.*` messages (vi + en): like, unlike, comment,
      commentPlaceholder, commentSend, reply, replyingTo, cancelReply, share, copyLink, linkCopied,
      shareVia, save, saved, likeFailed, commentFailed, justNow, you (no reshare keys — repost
      deferred)
- [ ] 7.2 Sweep components for hardcoded strings; confirm all toasts use the toast module hooks
- [ ] 7.3 A11y pass: `aria-pressed` on like AND save, `aria-label` on comment/share icon buttons,
      share menu Escape/arrow-key behavior

## 8. Verify

- [ ] 8.1 Manual sanity in `npm run dev`: like toggle on feed/detail/group/Thảo luận feed, save
      toggle (filled bookmark + appears on `/saved`), guest → auth modal (like/comment/save),
      comment + reply submit/empty/error, sticky composer on mobile width, no repost item in share
      menu, copy-link toast, count formatting at ≥1000
- [ ] 8.2 `npm run build` (webpack) green
- [ ] 8.3 `tsc --noEmit` clean
