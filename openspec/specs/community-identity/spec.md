# community-identity Specification

## Purpose
TBD - created by archiving change community-group-identity. Update Purpose after archive.
## Requirements
### Requirement: Community hub exposes an identity model
The community hub SHALL expose a mocked identity via a SWR-shaped hook
(`useQueryCommunityIdentitySwr`) returning `{ name: string, avatarUrl: string | null,
coverUrl: string | null, members: number }`. Community scopes (For You / Following /
Campus / Trending) remain route segments; identity lives at the hub level only —
there is no per-scope banner.

#### Scenario: Identity hook resolves hub identity
- **WHEN** `useQueryCommunityIdentitySwr` resolves
- **THEN** it returns the community name, member count, and nullable `avatarUrl`/`coverUrl`
- **AND** the hook is SWR-shaped (`{ identity, isLoading, error }`) for a drop-in BE swap

#### Scenario: Scopes stay banner-free
- **WHEN** the user switches between For You, Following, Campus, and Trending
- **THEN** the identity header does not change and no scope-specific banner renders

### Requirement: Community shell renders an identity header
`CommunityShell` SHALL replace its bare title with an identity header: a shallow
cover banner (aspect ratio `4/1` on mobile, `5/1` from `sm`, `object-cover`, rounded
corners) plus the community avatar and title. When `coverUrl` is null the banner
SHALL render an accent gradient placeholder of the same ratio; when `avatarUrl` is
null the avatar SHALL fall back to the initials tile. The scope tab nav and the
active feed below render unchanged.

#### Scenario: Header with images
- **GIVEN** the identity mock has non-null `coverUrl` and `avatarUrl`
- **WHEN** any community page renders
- **THEN** the shell shows the cover banner at the specified shallow ratio
- **AND** the community avatar and title render over/below the banner edge
- **AND** the scope tabs and feed content behave exactly as before

#### Scenario: Header without images
- **GIVEN** the identity mock has `coverUrl: null` and `avatarUrl: null`
- **WHEN** the community shell renders
- **THEN** the banner area shows the gradient placeholder at the same height
- **AND** the avatar shows the community's initial letter
- **AND** no layout shift occurs versus the with-image variant

#### Scenario: Responsive banner stays shallow
- **WHEN** the viewport is below `sm`
- **THEN** the banner uses the `4/1` ratio (never taller), keeping the feed above the fold
- **AND** from `sm` upward it uses `5/1` with no horizontal overflow

#### Scenario: Cover load failure degrades to gradient
- **GIVEN** a `coverUrl` that fails to load
- **WHEN** the image error fires
- **THEN** the gradient placeholder renders in place of the broken image

### Requirement: Community identity loading skeleton mirrors the header
While identity data is loading, the shell SHALL render a skeleton mirroring the
header: a banner-ratio skeleton block plus circular avatar and title-line skeletons.
The scope tab nav (static chrome) SHALL render normally outside the skeleton, and
the feed area continues to manage its own loading state independently.

#### Scenario: Skeleton matches header geometry
- **WHEN** the community identity is loading
- **THEN** a skeleton banner with the same aspect ratio renders where the cover will be
- **AND** circular and text-line skeletons stand in for the avatar and title
- **AND** the scope tabs render normally and remain clickable

### Requirement: Community identity strings are localized and accessible
New strings SHALL live under `communityHub.identity.*` in both `vi.json` and
`en.json` (at minimum `coverAlt` and `avatarAlt` templates containing `{name}`).
Rendered identity images SHALL expose name-derived alt text; the gradient fallback
is decorative (non-image element, no alt).

#### Scenario: Alt text follows the locale
- **WHEN** the community avatar and cover images render in locale vi or en
- **THEN** their alt attributes come from the matching `communityHub.identity.*` template
- **AND** include the community name
