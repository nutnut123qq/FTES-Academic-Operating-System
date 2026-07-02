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
      `mutateCreateCommunityPostComment` with the same mock fallback
- [ ] 1.7 New hook `useMutateReactGroupPostSwr` (features/group/hooks): guest check + local-only
      optimistic mutate of `["group-feed", groupId]` (no BE contract — `// ponytail: mock BE` note)

## 2. PostEngagementBar block

- [ ] 2.1 Create `src/components/reuseable/PostEngagementBar/index.tsx`: like button
      (`aria-pressed`, localized `aria-label`, filled/outline icon per state, compact count),
      comment affordance (count; `commentHref` link variant for feeds, `onCommentClick` variant
      for detail), share menu trigger — all buttons `preventDefault` + `stopPropagation`
- [ ] 2.2 Share menu inside the block: copy-link item (clipboard write + `execCommand` fallback →
      success toast), native-share item rendered only when `navigator.share` exists (swallow
      `AbortError`), optional re-share item via `onReshare` prop (community only, success toast);
      keyboard-operable menu
- [ ] 2.3 Export the block per house canon (named export, JSDoc header, WithClassNames if applicable)

## 3. Community feed wiring

- [ ] 3.1 Replace the counts `Typography` line in `CommunityFeed` rows with `PostEngagementBar`
      (likes/liked from hook, `commentHref={/community/[id]#comments}`, share URL from post id,
      `onToggleLike` → `useMutateReactPostSwr`, `onReshare` stub)
- [ ] 3.2 Verify like/share clicks inside the row `<Link>` never navigate (preventDefault path)

## 4. Post detail — like + comment composer

- [ ] 4.1 Replace the likes `Typography` line in `CommunityPostDetail` with `PostEngagementBar`
      (detail variant: `onCommentClick` focuses the composer)
- [ ] 4.2 Add `id="comments"` to the comments section; add the composer (textarea + primary send
      button, Enter submits, disabled when trimmed-empty or in flight); autofocus when URL hash is
      `#comments`
- [ ] 4.3 Wire submit to `useMutateCreatePostCommentSwr`: optimistic append + count bump + clear
      input; on failure remove the optimistic comment, restore count and draft, error toast

## 5. Group feed wiring

- [ ] 5.1 Add `PostEngagementBar` to `GroupFeed` post cards (like via `useMutateReactGroupPostSwr`,
      comment count display-only, share menu WITHOUT re-share item)

## 6. i18n + polish

- [ ] 6.1 Add `communityHub.engagement.*` messages (vi + en): like, unlike, comment,
      commentPlaceholder, commentSend, share, copyLink, linkCopied, shareVia, reshare, reshared,
      likeFailed, commentFailed, justNow, you
- [ ] 6.2 Sweep components for hardcoded strings; confirm all toasts use the toast module hooks
- [ ] 6.3 A11y pass: `aria-pressed` on like, `aria-label` on comment/share icon buttons, share
      menu Escape/arrow-key behavior

## 7. Verify

- [ ] 7.1 Manual sanity in `npm run dev`: like toggle on feed/detail/group, guest → auth modal,
      comment submit/empty/error, copy-link toast, count formatting at ≥1000
- [ ] 7.2 `npm run build` (webpack) green
- [ ] 7.3 `tsc --noEmit` clean
