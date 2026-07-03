# group-identity Specification

## Purpose
TBD - created by archiving change community-group-identity. Update Purpose after archive.
## Requirements
### Requirement: Group model carries identity images
The Group model SHALL carry two nullable identity fields — `avatarUrl: string | null`
(ảnh đại diện) and `coverUrl: string | null` (ảnh nền/banner) — on both the list
shape (`Group` in `useQueryGroupsSwr`) and the header shape (`GroupHeader` in
`useQueryGroupSwr`). Mock data SHALL include at least one group with both images,
one with only an avatar, and one with neither, so every fallback branch is exercised
by the UI.

#### Scenario: Mock exercises both branches
- **GIVEN** the mocked groups list
- **WHEN** `useQueryGroupsSwr` resolves
- **THEN** at least one group has non-null `avatarUrl` and `coverUrl`
- **AND** at least one group has `avatarUrl: null` and `coverUrl: null`

#### Scenario: Types stay in sync between list and header
- **WHEN** `useQueryGroupSwr(groupId)` resolves a `GroupHeader`
- **THEN** it exposes the same `avatarUrl` and `coverUrl` fields (nullable) as `Group`

### Requirement: Group card shows the group avatar
Each card in the groups list SHALL display the group avatar at the start of the name
row. When `avatarUrl` is set the image renders; when it is null the card SHALL fall
back to an initials tile (first letter of the name, `bg-accent/10 text-accent` style)
identical in size, so the row layout never shifts.

#### Scenario: Card with avatar image
- **GIVEN** a group whose `avatarUrl` is non-null
- **WHEN** the groups list renders
- **THEN** the card shows the avatar image in a fixed-size rounded container before the name
- **AND** the image has alt text derived from the group name (`groupsHub.identity.avatarAlt`)

#### Scenario: Card without avatar falls back to initials
- **GIVEN** a group whose `avatarUrl` is null
- **WHEN** the groups list renders
- **THEN** the card shows an initials tile of the same size in place of the image
- **AND** the name, type chip, description, and member count render unchanged

#### Scenario: Broken image URL degrades to initials
- **GIVEN** a group whose `avatarUrl` points to an unreachable image
- **WHEN** the image fails to load
- **THEN** the card falls back to the initials tile (no broken-image glyph)

### Requirement: Group detail header shows cover banner with overlapping avatar
The group detail shell SHALL render an identity header: a full-width cover banner
(aspect ratio `2/1` on mobile, `3/1` from the `sm` breakpoint, `object-cover`,
rounded top corners) with the group avatar overlapping its bottom edge (negative
margin, `ring-4 ring-background`), followed by the existing name + type chip +
member count and the unchanged tab nav. When `coverUrl` is null the banner area SHALL
render an accent gradient placeholder of the same aspect ratio; when `avatarUrl` is
null the overlapping avatar SHALL render the initials fallback.

#### Scenario: Header with both images
- **GIVEN** a group with non-null `coverUrl` and `avatarUrl`
- **WHEN** the group detail page renders
- **THEN** the cover image fills the banner with `object-cover` at the specified ratio
- **AND** the avatar overlaps the banner's bottom edge with a background-colored ring
- **AND** the name, type chip, member count, and tabs render below, unchanged in behavior

#### Scenario: Header without images keeps identity readable
- **GIVEN** a group with `coverUrl: null` and `avatarUrl: null`
- **WHEN** the group detail page renders
- **THEN** the banner area shows the accent gradient placeholder (same height, no image element)
- **AND** the overlapping avatar shows the group's initial letter
- **AND** no broken image or empty gap appears

#### Scenario: Responsive scaling
- **WHEN** the viewport is below the `sm` breakpoint
- **THEN** the banner uses the taller `2/1` ratio and the avatar/overlap scale down one step
- **AND** from `sm` upward the banner uses `3/1` and the avatar/overlap scale up
- **AND** the header never causes horizontal overflow

#### Scenario: Cover image failure falls back to gradient
- **GIVEN** a group whose `coverUrl` fails to load
- **WHEN** the image error fires
- **THEN** the banner shows the gradient placeholder instead of a broken image

### Requirement: Group create form accepts avatar and cover uploads
The create-group form SHALL add an avatar picker (circular upload button with camera
affordance) and a cover picker (drag-and-drop dropzone, house `ImageDropzone`
block). Both SHALL accept only PNG, JPEG, WebP, or GIF files up to 5 MB, show a
local preview of the accepted file, and allow removing the chosen file. Upload is
FE-mock: submit stays a no-op with an explicit swap-point for the backend presign
flow (generate presign URL → PUT → verify), mirroring the profile-avatar pattern.
No profile-scoped mutation is called for groups.

#### Scenario: Selecting a valid avatar shows a preview
- **WHEN** the user picks a 2 MB PNG via the avatar upload button
- **THEN** the circular control previews the image immediately (local object URL)
- **AND** a remove action restores the empty state and revokes the object URL

#### Scenario: Selecting a valid cover shows a preview
- **WHEN** the user drops a 3 MB JPEG on the cover dropzone
- **THEN** the dropzone is replaced by a banner-ratio preview of the file
- **AND** a remove action restores the dropzone

#### Scenario: Rejected file type
- **WHEN** the user picks a `.svg` or non-image file for avatar or cover
- **THEN** the file is not accepted and no preview appears
- **AND** an inline error message (`groupsHub.identity.invalidType`) is shown

#### Scenario: Rejected oversize file
- **WHEN** the user picks an image larger than 5 MB
- **THEN** the file is not accepted
- **AND** an inline error message (`groupsHub.identity.tooLarge`) is shown

#### Scenario: Submit remains mock with documented swap point
- **WHEN** the user submits the form with images chosen
- **THEN** no network upload occurs (mock)
- **AND** the code carries a marked swap-point comment describing the assumed
  generate-presign → PUT → verify backend contract

### Requirement: Group management exposes identity editing
The group management surface SHALL include a "group identity" section with the same
avatar and cover pickers (same validation and preview rules) pre-seeded from the
group's current images, so admins can change identity after creation. Saving is
FE-mock (no-op) with the same swap-point note.

#### Scenario: Existing images pre-fill the pickers
- **GIVEN** a group with non-null `avatarUrl` and `coverUrl`
- **WHEN** the management identity section renders
- **THEN** the avatar control shows the current avatar and the cover control shows the current cover

#### Scenario: Replacing an image previews the new file
- **WHEN** an admin picks a new valid cover file
- **THEN** the section previews the new file in place of the current cover
- **AND** validation rules (type, ≤5 MB) apply exactly as in the create form

### Requirement: Group identity loading skeleton mirrors the layout
While group data is loading (`isLoading || !group`), the detail shell SHALL render a
skeleton that mirrors the identity header — a banner-ratio skeleton block, an
overlapping circular avatar skeleton of matching size, and text-line skeletons for
name/meta. The list SHALL render card skeletons containing an avatar circle and text
lines. Static chrome (tab nav) stays outside the skeleton. No spinner and no "?"
placeholder initials are shown during load.

#### Scenario: Detail skeleton matches final geometry
- **WHEN** the group detail page is loading
- **THEN** a skeleton banner with the same aspect ratio renders where the cover will be
- **AND** a circular skeleton of the avatar's size overlaps it at the same offset
- **AND** the tab nav renders normally (not skeletonized)

#### Scenario: List skeleton includes avatar circles
- **WHEN** the groups list is loading
- **THEN** each skeleton card shows an avatar-circle skeleton beside text-line skeletons

### Requirement: Group identity strings are localized and accessible
All new identity UI strings SHALL live under `groupsHub.identity.*` in both
`src/messages/vi.json` and `src/messages/en.json` (labels, hints, validation errors,
alt-text templates, remove/upload CTAs). Identity images SHALL have name-derived alt
text; icon-only upload controls SHALL carry `aria-label`; the decorative gradient
fallback is a non-image element with no alt.

#### Scenario: Locale switch swaps identity strings
- **WHEN** the locale changes between vi and en
- **THEN** every identity label, hint, and error renders from the matching message file
- **AND** no hard-coded Vietnamese or English string remains in the identity UI

#### Scenario: Screen reader announces identity controls
- **WHEN** a screen reader focuses the avatar upload control
- **THEN** it announces the localized `aria-label`
- **AND** rendered avatar/cover images expose alt text containing the group name
