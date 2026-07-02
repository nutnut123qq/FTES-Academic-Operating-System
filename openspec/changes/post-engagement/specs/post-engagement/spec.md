## ADDED Requirements

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

### Requirement: Guest attempts open the authentication modal
Like, comment submission, and re-share SHALL be auth-gated. When a signed-out user attempts any of
them, the system SHALL open the `AuthenticationModal` and SHALL NOT apply any optimistic change.
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

### Requirement: Feed comment count links to the detail comments section
The comment count on each community feed row SHALL be an affordance that navigates to
`/community/[postId]#comments`, landing the user at the comments section with the composer ready.

#### Scenario: Jump from feed to comments
- **WHEN** the user activates the comment count/icon on a feed row
- **THEN** the app navigates to that post's detail page anchored at the comments section and the
  composer receives focus

### Requirement: Share menu with exact options
Feed rows and the post detail SHALL expose a share menu containing, in order: (1) "Sao chép liên
kết"/"Copy link" — always present; (2) "Chia sẻ qua…"/"Share via…" — present only when the Web
Share API (`navigator.share`) is available; (3) "Chia sẻ về trang cá nhân"/"Share to your feed" —
community posts only, auth-gated, recorded as a stub. No other items SHALL appear.

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

#### Scenario: Re-share to own feed
- **GIVEN** a signed-in user on a community post
- **WHEN** they choose "Chia sẻ về trang cá nhân"
- **THEN** the re-share is recorded (mock) and confirmed with a success toast

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
placeholder, and toast (like/unlike, comment placeholder and send, the three share options, copy
confirmation, error messages, "just now"/"you") — with no hardcoded strings in components.

#### Scenario: Switching locale switches engagement copy
- **WHEN** the user switches the app locale from vi to en
- **THEN** the like/comment/share labels, composer placeholder, and share menu items render in
  English without code changes

### Requirement: Accessible engagement controls
Icon-only engagement controls SHALL carry accessible names: the like button exposes
`aria-pressed` reflecting the liked state and a localized `aria-label`; the comment and share
buttons expose localized `aria-label`s; the share menu SHALL be keyboard-operable (open, arrow
between items, Escape closes).

#### Scenario: Like state announced
- **WHEN** a screen reader focuses the like button on a liked post
- **THEN** it announces the localized like label with a pressed/true state

#### Scenario: Share menu keyboard operation
- **WHEN** the user opens the share menu with the keyboard
- **THEN** items can be traversed with arrow keys, activated with Enter, and the menu closes on Escape
