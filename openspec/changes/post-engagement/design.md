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

## Goals / Non-Goals

**Goals:**
- One shared engagement UI (`PostEngagementBar`) powering community feed rows, post detail, and
  group feed posts — like toggle, comment affordance, share menu.
- Optimistic SWR-cache mutation with snapshot rollback; guest gating via `AuthenticationModal`;
  toasts for share confirmation and mutation errors; compact count formatting; vi/en i18n; a11y.
- Keep everything mock-safe: the app has no live BE here, so writes must succeed locally.

**Non-Goals:**
- Reaction *types* (heart/laugh/…): binary like only; `myReaction` maps to liked/not-liked.
- Threaded replies, comment editing/deletion, comment reactions (`mutation-react-community-post-comment`
  stays unwired).
- Real re-share rendering in feeds (stub records + toasts only), share analytics, notification
  fan-out.
- Group post detail page (group feed has no detail route; comment affordance there is count-only).

## Decisions

1. **New reuseable block `src/components/reuseable/PostEngagementBar/`** (like · comment · share in
   one row) instead of duplicating per feature. Props: `likes`, `liked`, `commentsCount`,
   `postUrl`, `onToggleLike`, `commentHref?` (feed) / `onCommentClick?` (detail focuses composer),
   `onReshare?` (community only — omit for groups). Alternative — inline per component — rejected:
   three surfaces would drift (that is exactly today's bug).
2. **Feed row nesting**: `CommunityFeed` rows stay a `<Link>`; the bar's buttons call
   `event.preventDefault()` + `event.stopPropagation()` so like/share never navigate. Alternative —
   restructure rows so only the title is a link — rejected as a larger visual change out of scope.
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
   like toggle, comment submit, and re-share; copy-link/native share are not gated (harmless
   read-side actions).
6. **Share menu**: HeroUI dropdown/popover from the share icon button. Items in order: copy link
   (always; `navigator.clipboard.writeText` with a hidden-textarea `execCommand` fallback, then
   success toast), native share (render only when `typeof navigator !== "undefined" && !!navigator.share`;
   user-cancel `AbortError` is swallowed silently), re-share (community posts only; guest-gated;
   success toast). Post URL built from `window.location.origin` + localized `/community/[postId]`.
7. **Comment composer**: controlled textarea + primary send button at the top of the comments
   section in `CommunityPostDetail`, `id="comments"` anchor on the section, autofocus when the URL
   hash is `#comments`. Submit disabled while trimmed value is empty or a submit is in flight.
   Optimistic append (temp id `tmp-${Date.now()}`, author = current user's display name or the vi/en
   "Bạn"/"You" label, time label = "vừa xong"/"just now"), count +1, input cleared; on error the
   comment is removed, the count restored, and the draft restored into the input. Errors surface
   through the toast module (no bespoke inline error UI).
8. **Counts formatting**: shared `formatCompactCount(count, locale)` util using
   `Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 })` — 999 → "999",
   1000 → "1k"/"1 N" per locale data, 1234 → "1,2k" (vi) / "1.2K" (en). Lives beside the block so
   all three surfaces share it.
9. **a11y**: like button `aria-pressed={liked}` + `aria-label` (i18n "Thích"/"Like"), comment and
   share icon buttons get `aria-label`s, the share menu is a real menu (arrow-key + Escape via
   HeroUI), toasts announce via the existing toast region.
10. **i18n**: new `communityHub.engagement.*` namespace (like, unlike, comment, share, copyLink,
    linkCopied, shareVia, reshare, reshared, commentPlaceholder, commentSend, commentFailed,
    likeFailed, justNow, you) in both `vi` and `en` catalogs.

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
- [Re-share has no feed rendering] → explicitly stubbed (toast-confirmed record); logged as a
  follow-up, not silently faked into the feed.

## Open Questions

- (none blocking — reaction types and threaded replies deliberately deferred, see Non-Goals)
