# community-feed-threads — Delta

## ADDED Requirements

### Requirement: Flat scope-tab header that blends into the page
The community shell header SHALL be a minimal sticky strip containing ONLY the
scope tabs (For you / Following / Campus / Trending) and, below `xl`, a "more" (⋯)
menu for the buried actions (Đăng bài, Bảng uy tín, Bình chọn, Kiểm duyệt). It
SHALL NOT render any community identity (no avatar, name, or member count). The
header SHALL blend into the page — NO card background fill and NO bottom border —
while staying sticky with a light backdrop blur so scrolling content behind it
stays legible. The scope tablist SHALL keep an accessible name from
`communityHub.title`.

#### Scenario: Header shows only tabs
- **WHEN** any community page renders
- **THEN** the header contains the scope tabs and (below `xl`) the ⋯ menu, and no
  avatar / community name / member count appears anywhere in the shell

#### Scenario: Header blends into the page
- **WHEN** the header renders
- **THEN** it has no card background fill and no bottom border — it reads as part
  of the page, not a distinct band

#### Scenario: Sticky legibility on scroll
- **GIVEN** a feed long enough to scroll
- **WHEN** the user scrolls down
- **THEN** the tab strip stays affixed to the top and content behind it is softly
  blurred so the tabs stay readable

#### Scenario: More menu only below xl
- **GIVEN** a viewport at or above `xl` (where the nav rail already exposes the
  actions)
- **WHEN** the header renders
- **THEN** the ⋯ menu is not shown (no duplication with the rail); below `xl` it is
  shown and its entries navigate to the composer modal and the reputation / poll /
  moderation routes
