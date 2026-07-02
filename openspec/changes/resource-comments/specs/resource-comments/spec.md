## ADDED Requirements

### Requirement: Comment list on resource detail
The resource detail page SHALL render a comments section listing comments for the
current resource, with top-level comments ordered newest-first. Each comment row
MUST show the author name, an avatar (initial fallback), the comment text, and a
relative timestamp. Rows MUST follow the Threads-style minimal presentation: no
bordered or boxed comment cards — plain rows (avatar + name + time + text)
separated by spacing only, with a thin action line of icon affordances (like
heart with count, reply link) under the text.

#### Scenario: Comments render newest-first
- **WHEN** the user opens `/resources/[resourceId]` and the resource has comments
- **THEN** the comments section lists top-level comments newest-first, each row showing author name, avatar, text, and relative time (e.g. "5 phút trước" / "5 minutes ago")

#### Scenario: Minimal Threads-style rows
- **WHEN** the comment list renders
- **THEN** each comment appears as a borderless row with no card/box styling, and its actions render as a thin line of quiet icon affordances (heart with like count, reply link) — no share or save affordances anywhere in the section

#### Scenario: Loading skeleton
- **WHEN** the comments query is still loading (or has no data yet)
- **THEN** the section renders a skeleton that mirrors the list layout (avatar circle + two text lines per row), and no flash of empty state occurs

#### Scenario: Empty state
- **WHEN** the query resolves with zero comments
- **THEN** the section shows an empty-state message inviting the user to be the first to comment (`resourceHub.comments.empty`), and the composer remains visible

#### Scenario: Load error
- **WHEN** the comments query fails
- **THEN** the section shows an inline error message (`resourceHub.comments.loadError`) with a retry action that revalidates the query

### Requirement: Comment composer
The resource detail page SHALL provide a composer: a multiline textarea plus a
submit button. Submitting a valid comment MUST append it optimistically at the
top of the list and clear the textarea. The composer MUST enforce a
500-character limit with a visible counter, and MUST block empty or
whitespace-only submissions.

#### Scenario: Authenticated user posts a comment
- **WHEN** an authenticated user types a non-empty comment (≤ 500 chars) and presses submit
- **THEN** the comment appears immediately at the top of the list (optimistic) attributed to the current user with time "just now", and the textarea is cleared

#### Scenario: Character limit enforced
- **WHEN** the draft reaches 500 characters
- **THEN** the counter shows `500/500`, further input is not accepted beyond the limit, and the counter is visually emphasized

#### Scenario: Empty submission blocked
- **WHEN** the textarea is empty or contains only whitespace
- **THEN** the submit button is disabled and no request is made

#### Scenario: Submit failure rolls back
- **WHEN** the create-comment mutation fails after an optimistic append
- **THEN** the optimistic comment is removed, the draft text is restored into the textarea, and an inline error (`resourceHub.comments.submitError`) is shown

### Requirement: Composer placement
The main composer SHALL be placed responsively: on mobile viewports it MUST
stick to the bottom of the viewport as a fixed bar; on desktop viewports it
MUST render inline at the top of the thread, above the list.

#### Scenario: Sticky composer on mobile
- **WHEN** the resource detail page is viewed on a mobile viewport (`<sm`)
- **THEN** the composer is fixed to the bottom of the viewport, remains visible while the user scrolls the thread, and the list reserves bottom padding so the last comment is never hidden behind it

#### Scenario: Inline composer on desktop
- **WHEN** the page is viewed on a desktop viewport (`sm` and up)
- **THEN** the composer renders inline at the top of the thread (above the comment list) and does not stick to the viewport

### Requirement: One-level replies
Users SHALL be able to reply to comments via a reply affordance on each row.
Replies MUST render indented exactly one level under their top-level parent,
ordered oldest-first within that parent. Nesting MUST be capped at one level:
replying to a reply MUST attach the new reply to that reply's top-level parent,
never creating a deeper level. Reply submissions follow the same 500-character
limit, optimistic behavior, and rollback rules as top-level comments.

#### Scenario: Reply renders one level deep
- **WHEN** an authenticated user taps reply on a top-level comment, types a valid reply, and submits
- **THEN** an inline reply composer had appeared under that comment, and the reply appears optimistically indented one level under the parent

#### Scenario: Replying to a reply stays flat
- **WHEN** the user invokes reply on a comment that is itself a reply
- **THEN** the submitted reply is attached to that reply's top-level parent and renders at the same single indent level — no second-level nesting is ever rendered

#### Scenario: Guest attempts to reply
- **WHEN** an unauthenticated user taps a reply affordance
- **THEN** the `AuthenticationModal` opens on the sign-in tab and no reply composer accepts input

### Requirement: Comment like
Each comment (top-level or reply) SHALL expose a like affordance: a heart icon
with a visible like count. Toggling like MUST be optimistic — the heart fills
red and the count increments immediately on like, and reverts on unlike; a
failed mutation MUST roll the state back. Comments MUST NOT expose share or
save affordances.

#### Scenario: Like a comment
- **WHEN** an authenticated user taps the heart on a comment they have not liked
- **THEN** the heart renders filled in red and the count increments immediately (optimistic), without waiting for the mutation to resolve

#### Scenario: Unlike a comment
- **WHEN** an authenticated user taps the heart on a comment they already liked
- **THEN** the heart returns to its outline state and the count decrements immediately

#### Scenario: Like failure rolls back
- **WHEN** the like toggle mutation fails after the optimistic update
- **THEN** the heart and count revert to their previous state

#### Scenario: Guest attempts to like
- **WHEN** an unauthenticated user taps a like heart
- **THEN** the `AuthenticationModal` opens on the sign-in tab and no like is recorded

### Requirement: Authentication gating for commenting
Guests SHALL NOT be able to post, reply to, or like comments. When a guest
attempts any of these actions, the system MUST open the existing
`AuthenticationModal` (sign-in tab) instead of performing it. Guests MAY still
read the comment list, including replies and like counts.

#### Scenario: Guest attempts to comment
- **WHEN** an unauthenticated user focuses the composer or presses submit
- **THEN** the `AuthenticationModal` opens on the sign-in tab and no comment is created

#### Scenario: Guest can read comments
- **WHEN** an unauthenticated user opens the resource detail page
- **THEN** the comment list renders normally in read-only fashion

### Requirement: Delete own comment
An authenticated user SHALL be able to delete their own comments and only their
own. Deletion MUST require an explicit confirmation step and MUST remove the
comment optimistically.

#### Scenario: Delete own comment
- **WHEN** the user invokes delete on a comment they authored and confirms
- **THEN** the comment is removed from the list immediately

#### Scenario: No delete on others' comments
- **WHEN** the list renders a comment authored by someone else
- **THEN** no delete affordance is shown for that comment

#### Scenario: Delete failure restores comment
- **WHEN** the delete mutation fails after the optimistic removal
- **THEN** the comment reappears in its original position and an inline error is shown

### Requirement: Comments and reviews are separate surfaces
Comments SHALL be free-form discussion on the resource detail page, distinct from
reviews/ratings which live at `/resources/[resourceId]/reviews`. The comments
section MUST NOT contain any star-rating input, and MUST link to the reviews page
for users who want to rate the resource.

#### Scenario: No rating input in comments
- **WHEN** the comments section renders
- **THEN** it contains no star-rating control; rating remains exclusively on the reviews page

#### Scenario: Cross-link to reviews
- **WHEN** the comments section header renders
- **THEN** it includes a link labeled via `resourceHub.comments.goToReviews` navigating to `/resources/[resourceId]/reviews`

### Requirement: Internationalization and accessibility
All comment UI strings SHALL come from `resourceHub.comments.*` message keys with
both `vi` and `en` translations. Interactive controls MUST be accessible: the
textarea has an associated label, icon-only buttons have `aria-label`, and error
messages are announced to assistive technology.

#### Scenario: Locale switch
- **WHEN** the user switches locale between vi and en
- **THEN** every string in the comments section (title, placeholder, submit, counter, empty, errors, delete, reply, like) renders in the active locale with no hardcoded text

#### Scenario: Accessible controls
- **WHEN** the section is inspected with assistive technology
- **THEN** the textarea exposes a label; the submit, delete, reply, and like controls expose accessible names (the like control also exposes its pressed state, e.g. `aria-pressed`); and submit/load errors are exposed via a live region (`role="alert"` or equivalent)
