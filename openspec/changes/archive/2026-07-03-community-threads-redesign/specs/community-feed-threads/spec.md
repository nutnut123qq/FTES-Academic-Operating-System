# community-feed-threads — Delta

## ADDED Requirements

### Requirement: Single-column hairline feed
The community feed SHALL render as ONE centered reading column capped at ~620px
(`max-w-[620px]`). The feed body (composer trigger row + all post rows) SHALL sit
inside ONE shared rounded panel (`rounded-3xl border border-separator bg-surface`,
Threads' column panel), with rows separated by hairline dividers
(`divide-separator`) INSIDE the panel — never per-post bordered boxes. Post rows
SHALL have no own border and no shadow; hover SHALL apply only a faint surface
wash.

#### Scenario: One panel, no boxes
- **WHEN** the community feed renders
- **THEN** the composer trigger and every post row sit inside a single rounded
  hairline panel, separated from each other only by 1px hairlines — no post row
  has its own border or card background

#### Scenario: Calm hover
- **WHEN** the pointer hovers a post row
- **THEN** only a faint background wash appears (no border/shadow/scale)

### Requirement: Threads post anatomy
Each post row SHALL use a two-column grid: a fixed ~48px leading column holding the
36px author avatar, and a flexible content column holding (in order) the header line
(author name semibold + relative time in muted text on ONE line), the post title,
the snippet/body, and the engagement bar. The whole-row link wrapper SHALL be
replaced by a link covering only the title + snippet (navigation to detail); action
buttons keep their own press handling.

#### Scenario: Grid anatomy
- **WHEN** a post row renders
- **THEN** the avatar sits in a fixed leading column and the name + relative time
  share one header line, with title, snippet, and actions stacked in the content column

#### Scenario: Title navigates, actions do not
- **WHEN** the user activates the title/snippet link
- **THEN** the app navigates to `/community/[postId]`
- **AND** activating like/comment/share/save never navigates

### Requirement: Threadline connects the post to its inline thread
A vertical threadline SHALL render in the avatar column whenever a post's inline
comment thread is expanded in the feed, and on the post detail page whenever the
post has comments. The line SHALL run from below the author avatar toward the
comment region using the separator color token.

#### Scenario: Threadline appears on expand
- **GIVEN** a feed post with its comments collapsed
- **WHEN** the user expands the inline thread
- **THEN** a vertical line renders under the post avatar visually connecting the
  post to the expanded comment region

#### Scenario: Threadline on detail
- **GIVEN** a post detail page whose post has at least one comment
- **WHEN** the page renders
- **THEN** the threadline renders under the post author's avatar toward the comments

### Requirement: Inline composer trigger opens a modal composer
The top of the For You feed SHALL render a composer trigger row: the current user's
avatar, a muted "Có gì mới?"/"What's new?" prompt, and a "Đăng" button. Activating it
SHALL open a modal composer (overlay-store driven, mounted in the app modal
container) reusing the existing composer form (kind chips + title + body). The
`/community/new` route SHALL keep rendering the same form as a full page.

#### Scenario: Trigger opens the modal
- **WHEN** the user activates the "Có gì mới?" row or its Đăng button
- **THEN** the modal composer opens over a dimmed backdrop, focused on the title
  field, with no route change

#### Scenario: Same form both surfaces
- **WHEN** comparing the modal composer and `/community/new`
- **THEN** both render the same kind chips + title + body form with the same i18n copy

#### Scenario: Localized prompt
- **WHEN** the locale switches between vi and en
- **THEN** the trigger prompt renders "Có gì mới?" / "What's new?" from
  `communityHub.*` keys
