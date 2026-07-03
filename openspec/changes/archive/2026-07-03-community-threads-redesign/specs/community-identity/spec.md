# community-identity — Delta

## MODIFIED Requirements

### Requirement: Community shell renders an identity header
`CommunityShell` SHALL render a COMPACT sticky identity header instead of a cover
banner: one slim row (sticky `top-0`, translucent `bg-background/85` + backdrop blur,
hairline bottom border) containing the community avatar (small), the community name,
and the member count (hidden below `sm`). No cover banner SHALL render in the shell;
`coverUrl` stays in the identity model for future surfaces. When `avatarUrl` is null
the avatar SHALL fall back to the initials tile. The scope tab nav SHALL render inside
the same sticky header region, and a "more" (⋯) menu SHALL expose entries for Đăng bài
(composer), Bảng uy tín, Bình chọn, and Kiểm duyệt.

#### Scenario: Compact header replaces the banner
- **WHEN** any community page renders
- **THEN** the shell shows one slim sticky row with avatar + name + member count and
  the scope tabs — and no cover banner element exists in the DOM

#### Scenario: Header stays visible while scrolling
- **GIVEN** a feed long enough to scroll
- **WHEN** the user scrolls down
- **THEN** the identity row and scope tabs remain affixed to the top with a
  translucent blurred background over the content

#### Scenario: Header without avatar image
- **GIVEN** the identity mock has `avatarUrl: null`
- **WHEN** the community shell renders
- **THEN** the avatar shows the community's initial letter with no layout shift

#### Scenario: Hidden pages reachable from the more menu
- **WHEN** the user opens the ⋯ menu in the header
- **THEN** entries navigate to `/community/new`, `/community/reputation`,
  `/community/poll`, and `/community/moderation`

### Requirement: Community identity loading skeleton mirrors the header
While identity data is loading, the shell SHALL render a skeleton mirroring the
compact header row: a circular avatar skeleton plus one name-line skeleton inside the
sticky row. The scope tab nav (static chrome) SHALL render normally outside the
skeleton, and the feed area continues to manage its own loading state independently.

#### Scenario: Skeleton matches header geometry
- **WHEN** the community identity is loading
- **THEN** a circular avatar skeleton and a short text-line skeleton render in the
  sticky row where the identity will be
- **AND** the scope tabs render normally and remain clickable
