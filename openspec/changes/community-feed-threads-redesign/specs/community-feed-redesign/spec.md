# community-feed-redesign

## ADDED Requirements

### Requirement: Compact Threads-style feed header with the current user's avatar
The community feed SHALL present its composer trigger as a single compact row — the current user's
avatar, a "What's new?" prompt that opens the composer, a search icon, and a Post button — with a
hairline divider under it, and SHALL NOT render an always-visible search bar, filter chip row, or
sort row in the main feed view. The avatar SHALL come from the signed-in user (the same source as the
navbar account avatar), falling back to a generated/initials avatar for guests or when no avatar URL
is set.

#### Scenario: One-row composer trigger

- **WHEN** a signed-in user views the feed
- **THEN** the header shows, on one row, their real avatar, a "What's new?" prompt, a search icon,
  and a Post button, with a divider beneath it — and no standalone search bar, filter row, or sort
  row above the posts

#### Scenario: Prompt opens the composer

- **WHEN** the user clicks the "What's new?" prompt or the Post button
- **THEN** the community composer opens

#### Scenario: Guest avatar fallback

- **WHEN** a guest (no signed-in user / no avatar URL) views the feed
- **THEN** the header shows a generated/initials avatar instead of a broken or empty image

### Requirement: Search, filters and sort collapse into a magnifier popover
The feed SHALL collapse the search input, the post-type filter (All / Discussion / Question /
Showcase / Knowledge) and the time sort (Newest / Oldest) into a single magnifier icon button on the
header row that opens a popover anchored under the icon containing those controls. The popover
controls SHALL drive the same search state and handlers as before so filtering behaviour is
unchanged, and the icon SHALL show an indicator whenever a keyword, a post-type, or a non-default
sort is active. The icon button SHALL be keyboard-accessible and labelled.

#### Scenario: Open the search popover

- **WHEN** the user activates the magnifier icon button
- **THEN** a popover drops down under it containing the search input, the post-type filter, and the
  sort toggle

#### Scenario: Filtering still works from the popover

- **WHEN** the user types a keyword or picks a post type in the popover
- **THEN** the feed switches into search mode and shows matching posts, exactly as the previous
  always-visible controls did

#### Scenario: Active-filter indicator

- **WHEN** a keyword, a post-type filter, or a non-default sort is applied
- **THEN** the magnifier icon shows a small indicator and its accessible label reports that filters
  are applied

#### Scenario: Accessible trigger

- **WHEN** assistive tech or a keyboard user reaches the magnifier button
- **THEN** it exposes a text label and can be operated without a pointer

### Requirement: Every feed tab renders full post cards
Every feed scope tab — For you, Following, Campus and Trending — SHALL render the same full post
cards (author, content preview, media, and like/comment actions) as the For-you tab, and no tab SHALL
render a sparse row list. The Trending tab SHALL keep the feed's infinite-scroll pagination.

#### Scenario: Trending uses full post cards

- **WHEN** the user opens the Trending tab
- **THEN** it renders full post cards identical in shape to the For-you feed, not a "rank + title +
  likes" sparse list

#### Scenario: Consistent across tabs

- **WHEN** the user switches between For you, Following, Campus and Trending
- **THEN** each tab renders the same full post-card layout

#### Scenario: Trending keeps pagination

- **WHEN** the user scrolls to the end of the loaded Trending posts and more exist
- **THEN** the next page loads via the feed's infinite-scroll sentinel
