# profile-visual-identity Specification

## Purpose
TBD - created by archiving change profile-feature-complete. Update Purpose after archive.
## Requirements
### Requirement: Profile visual identity supports cover and avatar images
The profile visual identity shell SHALL support a cover image above the identity sidebar and an avatar image inside the gradient ring.

#### Scenario: Identity sidebar renders
- **WHEN** the profile shell loads
- **THEN** the sidebar displays cover, avatar, name, headline, campus, gamification chips, bio, and edit CTA
- **AND** the layout remains responsive at mobile and desktop widths

### Requirement: Profile visual identity uses semantic tokens
The profile visual identity SHALL use only semantic tokens (`--accent`, `bg-default`, `text-muted`, `border-separator`) and work in both dark and light themes.

#### Scenario: Theme switches
- **WHEN** the user toggles between dark and light themes
- **THEN** profile colors update without hardcoded values

