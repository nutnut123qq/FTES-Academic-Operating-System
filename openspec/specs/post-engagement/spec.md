# post-engagement Specification

## Purpose
TBD - created by archiving change post-engagement. Update Purpose after archive.
## Requirements
### Requirement: Per-surface engagement matrix
The engagement bar SHALL render only the actions permitted for each surface, driven by a config
prop (`actions`) whose per-action flags default to enabled. Post and article surfaces — community
feed, community post detail, group feed, and articles/blog (`/blog/[slug]`) — SHALL render the FULL
bar (like, comment, share, save). Discussion surfaces — group discussion threads (`GroupDiscussion`)
and the subject workspace "Thảo luận" tab (`SubjectCommunity`) — SHALL render like and comment
ONLY; the share (🔁) and save (🔖) buttons SHALL NOT be rendered on discussion surfaces (absent,
not merely disabled or hidden).

#### Scenario: Full bar on a post
- **WHEN** the engagement bar renders on a community feed post, group feed post, or post detail
- **THEN** it shows like, comment, share, and save

#### Scenario: Full bar on an article
- **WHEN** the engagement bar renders on a blog/article (`/blog/[slug]`)
- **THEN** it shows like, comment, share, and save

#### Scenario: Discussion shows like and comment only
- **GIVEN** a group discussion thread or a subject workspace "Thảo luận" post
- **WHEN** its engagement bar renders
- **THEN** only the like and comment buttons appear, and the share and save buttons are absent from
  the DOM (not rendered)

### Requirement: Threads-style engagement bar on every post-like surface
Every post-like surface SHALL render ONE shared engagement bar directly under its content —
community feed rows, the community post detail, group feed posts, articles/blog, group discussion
threads, and the subject workspace "Thảo luận" tab (tab renamed by the `subject-workspace-ia`
change). The FULL bar contains exactly, in order: like button with inline count (♥), comment
button with inline count (💬), share button (🔁), and save button (🔖); which of these render on a
given surface is governed by the Per-surface engagement matrix requirement. The bar SHALL be a
single row of thin icon buttons with NO borders and NO background fills, counts rendered inline
next to their icons. Active states SHALL render as a filled red heart when the item is liked and a
filled bookmark when it is saved; inactive icons render as outlines.

#### Scenario: Bar composition and order
- **WHEN** a post or article renders with the full bar
- **THEN** directly under its content one row shows, left to right: like (with count), comment
  (with count), share, save — and no other actions in the bar

#### Scenario: Threads visual style
- **WHEN** the engagement bar renders
- **THEN** its buttons have no borders or background fills, and the like/comment counts sit inline
  next to their icons in the same row

#### Scenario: Active states
- **GIVEN** a post the user has liked and saved
- **WHEN** its engagement bar renders
- **THEN** the heart icon is filled red and the bookmark icon is filled

### Requirement: Like toggle on community feed rows
Every community feed post row SHALL render a like button showing the current like count and the
signed-in user's liked state. Activating it SHALL toggle the state: not-liked → liked increments
the count by 1; liked → not-liked decrements it by 1. The button SHALL NOT trigger the row's
navigation to the post detail.

#### Scenario: Like a post from the feed
- **GIVEN** a signed-in user viewing the community feed with a post they have not liked (count 42)
- **WHEN** they activate the like button on that row
- **THEN** the button switches to the liked state and the count shows 43, without navigating away

#### Scenario: Unlike a previously liked post
- **GIVEN** a signed-in user whose like is already applied to a post (count 43, liked state)
- **WHEN** they activate the like button again
- **THEN** the liked state clears and the count shows 42

#### Scenario: Like button does not navigate
- **WHEN** the user clicks the like button inside a feed row
- **THEN** the click is consumed by the button and the router does NOT navigate to `/community/[postId]`

### Requirement: Like toggle on post detail
The community post detail page SHALL render the same like toggle (count + liked state) for the
displayed post, and the liked state/count SHALL stay consistent with the feed row for the same post
within the session.

#### Scenario: Toggle like on the detail page
- **WHEN** a signed-in user activates the like button on `/community/[postId]`
- **THEN** the liked state and count update on the detail page

#### Scenario: Feed and detail stay consistent
- **GIVEN** the user liked a post on its detail page
- **WHEN** they return to the community feed in the same session
- **THEN** that post's row shows the liked state and the incremented count

### Requirement: Like toggle on group feed posts
Every group feed post SHALL render a like button with count and liked state behaving identically to
community feed likes. Because no group-post reaction contract exists on the BE, the interaction
SHALL be satisfied by a local mock mutation with the assumption noted in code. Group posts SHALL
also support the inline push-down comment expansion via 💬 (backed by a mock comments source —
no group comments BE contract exists).

#### Scenario: Like a group post
- **WHEN** a signed-in group member activates the like button on a group feed post
- **THEN** the liked state applies and the count increments by 1

#### Scenario: Expand comments on a group post
- **WHEN** a user activates 💬 on a group feed post
- **THEN** the comment thread expands inline below that post (mock data), with no navigation

### Requirement: Engagement bar on discussion surfaces (like + comment only)
Discussion surfaces SHALL render the shared engagement bar configured for discussion — the like
toggle (with optimistic update) and the 💬 comment control ONLY, with NO share button and NO save
button — using the same block with no discussion-specific fork beyond the `actions` config. The
discussion surfaces are group discussion threads (`GroupDiscussion`) and posts in the subject
workspace "Thảo luận" tab (`SubjectCommunity`, renamed by the `subject-workspace-ia` change).

#### Scenario: Like from a discussion surface
- **GIVEN** a signed-in user on a group discussion thread or a subject workspace "Thảo luận" tab
- **WHEN** they activate the like button on a discussion item
- **THEN** the liked state applies and the count increments by 1

#### Scenario: Comment on a discussion surface
- **WHEN** a user activates 💬 on a group discussion thread or a "Thảo luận" post
- **THEN** the comment thread expands inline below it (like other feeds), with no navigation

#### Scenario: No save or share on a discussion surface
- **WHEN** the engagement bar renders on any discussion surface
- **THEN** neither the save (🔖) nor the share (🔁) button is present

### Requirement: Engagement bar on articles/blog (full bar)
Articles / blog posts (`/blog/[slug]`, backed by `query-blog-post(s)`) SHALL render the full
engagement bar — like, comment, share, and save — with the same behaviors and visual language as
community posts. Article saves SHALL use the save-for-later contract with entityType `article`.

#### Scenario: Full bar on an article
- **WHEN** a blog/article page renders its engagement bar
- **THEN** it shows like, comment, share, and save, matching the post visual language

#### Scenario: Save an article
- **GIVEN** a signed-in user reading an unsaved article
- **WHEN** they activate the save button
- **THEN** the bookmark fills and the article is recorded as saved via the save-for-later contract
  with entityType `article`

### Requirement: Optimistic like with rollback
Like toggles SHALL apply optimistically: the UI updates immediately, before the write settles. If
the write reports an explicit failure, the UI SHALL roll back to the pre-toggle count and liked
state and surface a localized error toast.

#### Scenario: Optimistic apply
- **WHEN** the user toggles like
- **THEN** the count and liked state change immediately, without waiting for the mutation response

#### Scenario: Rollback on failure
- **GIVEN** the like mutation resolves with `success: false`
- **WHEN** the failure is received
- **THEN** the count and liked state revert to their pre-toggle values and an error toast is shown

#### Scenario: Mock transport is not a failure
- **GIVEN** the mock environment has no reachable BE (transport error)
- **WHEN** the like write is attempted
- **THEN** the optimistic state is kept (treated as local success), with no error toast

### Requirement: Save toggle in the engagement bar
The save button (🔖) SHALL render ONLY on post and article surfaces (never on discussion surfaces,
per the Per-surface engagement matrix). Where present, it SHALL toggle save-for-later on the item
for a signed-in user: not-saved → saved fills the bookmark icon; saved → not-saved returns it to
outline. Save *mechanics* (the `{ entityType: "post" | "article", entityId, isFavorite }` contract,
persistence, and the `/saved` page) are owned by the `save-for-later` change; this capability owns
the button's placement in the bar (including its absence on discussion) and its states. Inside feed
rows, activating save SHALL NOT trigger the row's navigation.

#### Scenario: Save button absent on discussion
- **GIVEN** a group discussion thread or a subject workspace "Thảo luận" post
- **WHEN** its engagement bar renders
- **THEN** no save (🔖) button is present, so the discussion item cannot be saved

#### Scenario: Signed-in user saves a post
- **GIVEN** a signed-in user viewing a post they have not saved
- **WHEN** they activate the save button in the engagement bar
- **THEN** the bookmark icon fills immediately and the post is recorded as saved via the
  save-for-later contract with entityType `post`

#### Scenario: Unsave from the bar
- **GIVEN** a post the user previously saved
- **WHEN** they activate the save button again
- **THEN** the bookmark returns to its outline state and the post is no longer saved

#### Scenario: Guest taps save
- **GIVEN** a signed-out visitor
- **WHEN** they activate the save button on any post
- **THEN** the `AuthenticationModal` opens and no save state changes

### Requirement: Guest attempts open the authentication modal
Like, comment/reply submission, and save SHALL be auth-gated. When a signed-out user attempts any
of them, the system SHALL open the `AuthenticationModal` and SHALL NOT apply any optimistic change.
Copy-link, native share, and expanding/reading inline comment threads SHALL remain available to
guests.

#### Scenario: Guest taps like
- **GIVEN** a signed-out visitor on the community feed
- **WHEN** they activate a like button
- **THEN** the `AuthenticationModal` opens and the like count/state does not change

#### Scenario: Guest submits a comment
- **GIVEN** a signed-out visitor who typed text into the comment composer
- **WHEN** they submit
- **THEN** the `AuthenticationModal` opens, no comment is appended, and the draft text is kept

#### Scenario: Guest copies the link
- **WHEN** a signed-out visitor chooses "Sao chép liên kết" from the share menu
- **THEN** the link is copied and confirmed by toast, with no authentication prompt

#### Scenario: Guest expands and reads comments
- **GIVEN** a signed-out visitor on a feed
- **WHEN** they activate 💬 on a post
- **THEN** the thread expands inline and is readable with no authentication prompt — only
  submitting a comment triggers the `AuthenticationModal`

### Requirement: Comment composer on post detail
The post detail page SHALL provide a comment composer (multi-line input + send action, Enter
submits) attached to the comments section. Submitting non-empty text SHALL optimistically append
the comment to the thread (attributed to the current user with a "just now" time label), increment
the comment count, and clear the input.

#### Scenario: Successful comment submit
- **GIVEN** a signed-in user typed "Cảm ơn bạn!" in the composer
- **WHEN** they submit
- **THEN** the comment appears at once in the thread attributed to them with a "vừa xong"/"just now"
  label, the comment count increments by 1, and the input clears

#### Scenario: Empty comment is blocked
- **GIVEN** the composer is empty or contains only whitespace
- **WHEN** the user attempts to submit
- **THEN** the send action is disabled/no-ops and no comment is created

#### Scenario: Comment failure rolls back and preserves the draft
- **GIVEN** the create-comment mutation resolves with `success: false`
- **WHEN** the failure is received
- **THEN** the optimistic comment is removed, the count reverts, an error toast is shown, and the
  typed text is restored into the composer

### Requirement: Composer sticks to the bottom of the viewport on mobile
On a mobile viewport (below the `sm` breakpoint) the comment composer SHALL remain affixed to the
bottom of the viewport, regardless of scroll position, in two cases: (a) while the post detail is
open, and (b) in a feed, for the EXPANDED post's composer while that composer is focused — on
blur or collapse it returns in-flow. The comments list SHALL reserve enough bottom space that the
sticky composer never hides the last comment. On `sm` and wider viewports the composer renders
in-flow with the comments section/thread.

#### Scenario: Composer visible while scrolling on mobile
- **GIVEN** a mobile-width viewport showing a post detail with a long comment thread
- **WHEN** the user scrolls anywhere in the post
- **THEN** the composer stays pinned to the bottom of the viewport, ready for input

#### Scenario: Expanded feed post's composer sticks when focused
- **GIVEN** a mobile-width viewport with a feed post's comment thread expanded inline
- **WHEN** the user focuses that post's composer
- **THEN** the composer affixes to the bottom of the viewport while focused, and returns in-flow
  on blur or when the thread is collapsed

#### Scenario: Last comment not obscured
- **GIVEN** the mobile sticky composer is shown
- **WHEN** the user scrolls to the end of the comment thread
- **THEN** the last comment is fully readable above the composer

### Requirement: Flat one-level comment replies
Comments on the post detail SHALL support replies exactly one level deep (Threads-like). Each
top-level comment SHALL expose a reply affordance that switches the composer into reply mode
(showing which comment is being replied to, cancellable). A submitted reply SHALL appear indented
under its parent comment and SHALL count toward the post's total comment count. Replies SHALL NOT
expose a reply affordance of their own — no nesting beyond one level.

#### Scenario: Reply to a comment
- **GIVEN** a signed-in user activates "Trả lời"/"Reply" on a top-level comment
- **WHEN** they type text and submit
- **THEN** the reply appears indented directly under that comment, attributed to them with a
  "vừa xong"/"just now" label, and the post's comment count increments by 1

#### Scenario: Cancel reply mode
- **GIVEN** the composer is in reply mode for a comment
- **WHEN** the user cancels the reply context
- **THEN** the composer returns to top-level comment mode and the typed draft is kept

#### Scenario: No second-level nesting
- **WHEN** a reply is rendered under its parent comment
- **THEN** the reply itself shows no reply affordance

### Requirement: Inline push-down comment expansion on feed posts
Activating the comment button/count (💬) on a feed post SHALL expand the comment thread INLINE
directly below that post (Threads-style push-down accordion) on ANY feed — community feed, group
feed, and the workspace Thảo luận feed — revealing the comment list (flat one-level replies) and
the comment composer, pushing the posts below it down. It SHALL NOT navigate to the post detail page
or change the route in any way, and the user's scroll position SHALL be preserved. Activating 💬
again, or an explicit collapse control ("Thu gọn"/"Collapse") in the expanded region, SHALL
collapse the thread back. The composer inside the expanded region SHALL behave identically to the
post detail composer (optimistic append, empty-input guard, draft-preserving error handling,
one-level replies, guest gating).

#### Scenario: Tap 💬 expands the thread below the post
- **GIVEN** a user viewing the community feed
- **WHEN** they activate the 💬 button on a post
- **THEN** the comment thread (comment list + composer) expands directly below that post, the
  posts underneath are pushed down, and the route does not change

#### Scenario: Tap 💬 again collapses
- **GIVEN** a post with its comment thread expanded inline
- **WHEN** the user activates the 💬 button again (or the "Thu gọn"/"Collapse" control)
- **THEN** the thread collapses and the posts below move back up, with no navigation

#### Scenario: Scroll position preserved on expand
- **GIVEN** the user has scrolled partway down the feed
- **WHEN** they expand a post's comments
- **THEN** the viewport does not jump — the expansion only pushes content down below the post

#### Scenario: Comment submitted from the inline thread
- **GIVEN** a signed-in user with a post's thread expanded inline in the feed
- **WHEN** they type a comment and submit
- **THEN** the comment appears optimistically in the inline thread, the post's comment count
  increments, and the feed does not navigate anywhere

### Requirement: Comments lazy-load on first expand
The comment thread SHALL NOT be fetched with the feed. On a post's FIRST expand the thread SHALL
be fetched (SWR fetch on expand) while skeleton comment rows render in the expanded region. If the
fetch fails, the expanded region SHALL show an inline error state with a retry affordance that
re-attempts the fetch — without collapsing the region. Once loaded, collapsing and re-expanding
SHALL show the cached thread immediately without a new blocking load.

#### Scenario: Skeleton rows on first expand
- **WHEN** the user expands a post's comments for the first time
- **THEN** skeleton comment rows render in the expanded region until the thread loads, then the
  comments replace them

#### Scenario: Inline error with retry
- **GIVEN** the comment fetch fails on expand
- **WHEN** the failure is received
- **THEN** the expanded region shows a localized inline error with a retry control, and activating
  retry re-fetches the thread in place

#### Scenario: Re-expand uses the cache
- **GIVEN** a post whose comments were already loaded once
- **WHEN** the user collapses and expands it again
- **THEN** the thread renders immediately from cache, with no skeleton phase

### Requirement: Multiple posts expand independently
Each post's inline comment expansion SHALL be independent: any number of posts in a feed MAY be
expanded at the same time, and expanding or collapsing one post SHALL NOT change the expansion
state of any other post.

#### Scenario: Two posts expanded at once
- **GIVEN** a user expanded the comments of post A
- **WHEN** they also expand the comments of post B
- **THEN** both threads are visible inline under their respective posts

#### Scenario: Collapsing one leaves the other open
- **GIVEN** posts A and B are both expanded
- **WHEN** the user collapses post A
- **THEN** post B's thread remains expanded and untouched

### Requirement: Post detail page remains for deep links only
The post detail page (`/community/[postId]`) SHALL continue to exist and serve deep links and
notification targets (including the `#comments` anchor), but feed interactions SHALL never force
navigation to it: the 💬 button expands inline, and only the post title (row link) navigates to
the detail page, as before.

#### Scenario: Title click still navigates
- **WHEN** the user activates a community feed post's title/row link
- **THEN** the app navigates to `/community/[postId]` as before

#### Scenario: Notification deep link lands on the detail comments
- **WHEN** the user follows a deep link to `/community/[postId]#comments`
- **THEN** the detail page opens anchored at the comments section with the composer focused

#### Scenario: 💬 never navigates
- **WHEN** the user activates the 💬 button on any feed post
- **THEN** the router does not navigate — the thread expands inline instead

### Requirement: Share menu with exact options
The share button (🔁) SHALL render ONLY on post and article surfaces (never on discussion surfaces,
per the Per-surface engagement matrix). Where present, it SHALL open a share menu containing, in
order: (1) "Sao chép liên kết"/"Copy link" — always present; (2) "Chia sẻ qua…"/"Share via…" —
present only when the Web Share API (`navigator.share`) is available. No other items SHALL appear —
"repost to own feed" ("Chia sẻ về trang cá nhân") is explicitly deferred and SHALL NOT be
rendered.

#### Scenario: Share button absent on discussion
- **GIVEN** a group discussion thread or a subject workspace "Thảo luận" post
- **WHEN** its engagement bar renders
- **THEN** no share (🔁) button is present, so the discussion item cannot be shared

#### Scenario: Copy link confirmation toast
- **WHEN** the user chooses "Sao chép liên kết"
- **THEN** the post's absolute URL is placed on the clipboard and a localized success toast
  ("Đã sao chép liên kết"/"Link copied") is shown

#### Scenario: Native share when available
- **GIVEN** the browser exposes `navigator.share`
- **WHEN** the user chooses "Chia sẻ qua…"
- **THEN** the native share sheet opens with the post title and URL; if the user cancels, no error
  is shown

#### Scenario: Native share hidden when unavailable
- **GIVEN** the browser does not expose `navigator.share`
- **WHEN** the share menu opens
- **THEN** the "Chia sẻ qua…" item is not rendered

#### Scenario: No repost item
- **WHEN** the share menu opens on any post
- **THEN** no "Chia sẻ về trang cá nhân"/"Share to your feed" item is present

### Requirement: Compact count formatting
Like and comment counts SHALL render as-is below 1000 and compactly at 1000 or above using
locale-aware compact notation with at most one fraction digit (e.g. vi: "1,2k"; en: "1.2K").

#### Scenario: Small counts unchanged
- **WHEN** a post has 999 likes
- **THEN** the like count renders "999"

#### Scenario: Thousand-plus counts compacted
- **GIVEN** the vi locale
- **WHEN** a post has 1234 likes
- **THEN** the like count renders in compact form ("1,2 N"/"1,2k" per locale data), not "1234"

### Requirement: Localized engagement copy (vi/en)
Engagement copy SHALL come from the i18n catalogs in both Vietnamese and English — every label,
placeholder, and toast (like/unlike, save, reply/replying-to/cancel-reply, comment placeholder and
send, the two share options, copy confirmation, error messages, "just now"/"you", and the
inline-expansion labels: collapse — "Thu gọn"/"Collapse", the expanded region's accessible name,
the comments load-failure message, and retry) — with no hardcoded strings in components.

#### Scenario: Switching locale switches engagement copy
- **WHEN** the user switches the app locale from vi to en
- **THEN** the like/comment/share labels, composer placeholder, and share menu items render in
  English without code changes

### Requirement: Accessible engagement controls
Icon-only engagement controls SHALL carry accessible names: the like button exposes
`aria-pressed` reflecting the liked state and the save button exposes `aria-pressed` reflecting
the saved state, each with a localized `aria-label`; the comment and share buttons expose
localized `aria-label`s; the share menu SHALL be keyboard-operable (open, arrow between items,
Escape closes). On feed surfaces the 💬 button SHALL be a disclosure button: it exposes
`aria-expanded` reflecting the thread's expansion state and `aria-controls` referencing the
expanded region's id, and when the thread expands, focus SHALL move into the expanded region.

#### Scenario: Like state announced
- **WHEN** a screen reader focuses the like button on a liked post
- **THEN** it announces the localized like label with a pressed/true state

#### Scenario: Comment disclosure announced
- **GIVEN** a feed post with its thread collapsed
- **WHEN** a screen reader user activates the 💬 button
- **THEN** the button reports `aria-expanded="true"`, its `aria-controls` region is revealed, and
  focus moves into the expanded comment region

#### Scenario: Share menu keyboard operation
- **WHEN** the user opens the share menu with the keyboard
- **THEN** items can be traversed with arrow keys, activated with Enter, and the menu closes on Escape

#### Scenario: Discussion bar exposes only like and comment to assistive tech
- **GIVEN** a discussion surface (group discussion or "Thảo luận")
- **WHEN** a keyboard/screen-reader user traverses the engagement bar
- **THEN** only the like and comment controls are reachable — no share or save control is in the
  focus order or announced

