# profile-identity-hero (delta)

## ADDED Requirements

### Requirement: Identity sidebar orders campus above the joined date

The profile identity sidebar SHALL render the campus line ABOVE the "joined" line: campus is
identity, the join date is metadata. Both lines stay conditional — a profile with no campus, or
with no creation date, renders neither the icon nor an empty row.

#### Scenario: Both lines present

- **WHEN** the profile carries a campus and a creation date
- **THEN** the campus row (map-pin icon) renders first and the joined row (calendar icon) after it

#### Scenario: Campus missing

- **WHEN** the profile has no campus
- **THEN** only the joined row renders, with no empty placeholder above it

## REMOVED Requirements

### Requirement: Profile identity sidebar renders a cover image

**Reason**: The app never shipped a way to upload a cover, so `coverUrl` is null for every profile
and the requirement's "cover missing" branch — a muted placeholder gradient — was the only branch
that ever ran. The result was an 8rem band of decoration on both `/profile` and `/u/[username]`
that could not carry content. The band, its placeholder, and the avatar's overlap onto it are all
removed; the avatar now heads the sidebar directly.

**Migration**: None for users. `coverUrl` is dropped from the FE view models (`Profile`,
`PublicProfile`) and from their mappers; the BE `SelfProfile.coverUrl` field is untouched, so the
capability can be re-introduced by re-adding the field on the FE side once an upload path exists.
The loading skeleton drops its cover block to match.
