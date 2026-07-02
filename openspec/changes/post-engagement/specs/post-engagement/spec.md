## ADDED Requirements

### Requirement: Threads-style engagement bar on every post
Every post SHALL render ONE shared engagement bar directly under its content on all post surfaces
— community feed rows, the community post detail, group feed posts, and the subject workspace
"Thảo luận" tab feed (tab renamed by the `subject-workspace-ia` change) — containing exactly, in
order:
like button with inline count (♥), comment button with inline count (💬), share button (🔁), and
save button (🔖). The bar SHALL be a single row of thin icon buttons with NO borders and NO
background fills, counts rendered inline next to their icons. Active states SHALL render as a
filled red heart when the post is liked and a filled bookmark when the post is saved; inactive
icons render as outlines.

#### Scenario: Bar composition and order
- **WHEN** a post is rendered on any of the four surfaces
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
SHALL be satisfied by a local mock mutation with the assumption noted in code.

#### Scenario: Like a group post
- **WHEN** a signed-in group member activates the like button on a group feed post
- **THEN** the liked state applies and the count increments by 1

### Requirement: Engagement bar on the workspace Thảo luận feed
Posts in the subject workspace "Thảo luận" tab feed SHALL render the same shared engagement bar
(the workspace community tab is renamed to Thảo luận by the `subject-workspace-ia` change) with
the same behaviors as community feed rows — like toggle with optimistic update, comment count linking
to the post's comments, share menu, and save toggle — with no workspace-specific variant.

#### Scenario: Like from the Thảo luận feed
- **GIVEN** a signed-in user on a subject workspace's Thảo luận tab
- **WHEN** they activate the like button on a post in that feed
- **THEN** the liked state applies and the count increments by 1 in that feed

#### Scenario: Save from the Thảo luận feed
- **WHEN** a signed-in user activates the save button on a Thảo luận feed post
- **THEN** the bookmark fills and the post is saved via the save-for-later contract, identically
  to saving from the community feed

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
The save button (🔖) in the engagement bar SHALL toggle save-for-later on the post for a signed-in
user: not-saved → saved fills the bookmark icon; saved → not-saved returns it to outline. Save
*mechanics* (the `{ entityType: "post", entityId, isFavorite }` contract, persistence, and the
`/saved` page) are owned by the `save-for-later` change; this capability owns the button's
placement in the bar and its states. Inside feed rows, activating save SHALL NOT trigger the row's
navigation.

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
Copy-link and native share SHALL remain available to guests.

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
The comment composer SHALL remain affixed to the bottom of the viewport, regardless of scroll
position, while the post detail is open on a mobile viewport (below the `sm` breakpoint), and the
comments list SHALL reserve enough bottom space that the composer never hides the last comment. On
`sm` and wider viewports the composer renders in-flow with the comments section.

#### Scenario: Composer visible while scrolling on mobile
- **GIVEN** a mobile-width viewport showing a post detail with a long comment thread
- **WHEN** the user scrolls anywhere in the post
- **THEN** the composer stays pinned to the bottom of the viewport, ready for input

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

### Requirement: Feed comment count links to the detail comments section
The comment count on each community feed row SHALL be an affordance that navigates to
`/community/[postId]#comments`, landing the user at the comments section with the composer ready.

#### Scenario: Jump from feed to comments
- **WHEN** the user activates the comment count/icon on a feed row
- **THEN** the app navigates to that post's detail page anchored at the comments section and the
  composer receives focus

### Requirement: Share menu with exact options
The share button (🔁) in the engagement bar SHALL open a share menu containing, in order:
(1) "Sao chép liên kết"/"Copy link" — always present; (2) "Chia sẻ qua…"/"Share via…" — present
only when the Web Share API (`navigator.share`) is available. No other items SHALL appear —
"repost to own feed" ("Chia sẻ về trang cá nhân") is explicitly deferred and SHALL NOT be
rendered.

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
send, the two share options, copy confirmation, error messages, "just now"/"you") — with no
hardcoded strings in components.

#### Scenario: Switching locale switches engagement copy
- **WHEN** the user switches the app locale from vi to en
- **THEN** the like/comment/share labels, composer placeholder, and share menu items render in
  English without code changes

### Requirement: Accessible engagement controls
Icon-only engagement controls SHALL carry accessible names: the like button exposes
`aria-pressed` reflecting the liked state and the save button exposes `aria-pressed` reflecting
the saved state, each with a localized `aria-label`; the comment and share buttons expose
localized `aria-label`s; the share menu SHALL be keyboard-operable (open, arrow between items,
Escape closes).

#### Scenario: Like state announced
- **WHEN** a screen reader focuses the like button on a liked post
- **THEN** it announces the localized like label with a pressed/true state

#### Scenario: Share menu keyboard operation
- **WHEN** the user opens the share menu with the keyboard
- **THEN** items can be traversed with arrow keys, activated with Enter, and the menu closes on Escape
