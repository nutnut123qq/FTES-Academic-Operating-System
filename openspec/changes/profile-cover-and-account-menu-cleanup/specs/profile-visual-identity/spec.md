# profile-visual-identity (delta)

## MODIFIED Requirements

### Requirement: Profile visual identity supports cover and avatar images

The profile visual identity shell SHALL render an avatar image inside the gradient ring as the
FIRST element of the identity sidebar. It SHALL NOT render a cover band above the sidebar, and
SHALL NOT render a placeholder in its place — the sidebar starts at the avatar at every breakpoint.

#### Scenario: Identity sidebar renders

- **WHEN** the profile shell loads
- **THEN** the sidebar displays avatar, name, headline, gamification chips, bio, edit CTA, campus
  and joined date — with no cover band and no gradient placeholder where one used to be
- **AND** the layout remains responsive at mobile and desktop widths
