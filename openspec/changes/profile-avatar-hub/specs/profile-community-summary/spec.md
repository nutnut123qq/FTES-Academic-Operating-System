## ADDED Requirements

### Requirement: Community tab reputation and posts summary
The profile Community tab SHALL replace its placeholder with a read-only summary fed by a mock hook `useQueryMyCommunitySummarySwr`: a reputation snapshot (reputation score plus counts of posts, comments, and received reactions) and a "my recent posts" list (title, date, engagement counts) where each row links to the post in the community section.

#### Scenario: Community summary renders
- **WHEN** a logged-in user opens the Community tab with loaded data
- **THEN** the reputation snapshot shows score and post/comment/reaction counts
- **AND** recent posts render as rows linking into their community post routes

#### Scenario: Community loading state
- **WHEN** the tab opens while data is loading
- **THEN** a skeleton mirroring the snapshot row and post list renders

#### Scenario: No community activity
- **WHEN** the mock data contains zero posts
- **THEN** a localized empty state renders with a link to browse the community, while the reputation snapshot still shows zeros

### Requirement: Community tab i18n and accessibility
All Community tab strings (headings, count labels, empty state) SHALL be localized vi/en; count values MUST be paired with visible or accessible labels (no bare numbers), and post rows MUST be keyboard-navigable links.

#### Scenario: Localized accessible summary
- **WHEN** the locale is vi or en
- **THEN** all strings render localized, every count has an accessible label, and post rows are focusable links activatable with Enter
