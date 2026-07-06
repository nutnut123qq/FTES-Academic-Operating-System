## ADDED Requirements

### Requirement: Community tab strip must hide scrolled content

The community feed tab strip must have an opaque background so that feed posts scrolling underneath are fully covered and do not show through.

#### Scenario: User scrolls the community feed
- **WHEN** the user scrolls the community feed page
- **THEN** the tab strip background is opaque and no post content is visible behind it

### Requirement: Community tab strip must pin under the site header

The tab strip must be `sticky` and pin at `top-16` so it sits flush below the `h-16` site header while scrolling.

#### Scenario: User scrolls past the tab strip
- **WHEN** the user scrolls down past the tab strip
- **THEN** the tab strip sticks to the bottom edge of the site header and remains above the feed content
