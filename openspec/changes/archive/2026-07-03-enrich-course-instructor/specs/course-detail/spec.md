## ADDED Requirements

### Requirement: Instructor profile card
The course detail page SHALL render a rich instructor profile card in the left content column, replacing the previous minimal name/title/bio block.

#### Scenario: Instructor card shows identity and credibility
- **WHEN** the instructor section renders
- **THEN** it displays the instructor avatar with a fallback to initials, the instructor name, and a role line
- **AND** it shows three headline stats: courses taught, total students, and average rating
- **AND** it shows a 2–3 sentence bio
- **AND** it lists credentials/achievements with icons
- **AND** it provides working social links (GitHub, LinkedIn, website) that open in a new tab with accessible labels
- **AND** it provides a follow/unfollow toggle button

#### Scenario: Missing optional fields degrade gracefully
- **WHEN** the instructor has no avatar URL
- **THEN** the avatar falls back to generated default or initials
- **AND** when any social link is absent, that icon is not rendered

#### Scenario: Follow action is FE-only until BE contract lands
- **WHEN** the user presses the follow/unfollow button
- **THEN** the button toggles its visual state immediately
- **AND** the interaction is mocked locally; no BE request is made
