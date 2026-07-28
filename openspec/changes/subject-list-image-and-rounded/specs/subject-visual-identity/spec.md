# subject-visual-identity

## ADDED Requirements

### Requirement: Subject identity surfaces use a consistent slightly-rounded radius
Every subject cover/identity surface SHALL be rounded with the `rounded-2xl` radius — a
slight rounding (a rounded square), NOT a full circle (`rounded-full`) — so the catalog
list and the workspace detail read as one system and match the house `CoverImage` block
and the catalog card's outer container. This applies to: the catalog card's initials
placeholder badge (`SubjectCatalog`), its loading-skeleton badge, and the workspace
header identity slot (`SubjectWorkspaceShell`) in BOTH states — the `<img>` cover and the
initials fallback. The catalog card's 16:9 cover thumbnail SHALL remain rounded by its
`overflow-hidden rounded-2xl` container (unchanged). The previous smaller `rounded-large`
on these surfaces SHALL be removed.

#### Scenario: Catalog card cover and placeholder are slightly rounded
- **WHEN** a subject card renders in the `/subjects` catalog grid
- **THEN** the 16:9 cover thumbnail (when `imageUrl` is non-null) is clipped to `rounded-2xl` by the card container
- **AND** the initials placeholder badge in the identity row is `rounded-2xl`
- **AND** neither is a full circle

#### Scenario: Workspace detail identity slot is slightly rounded
- **WHEN** the subject workspace header renders for a subject
- **THEN** the `size-11` identity slot is `rounded-2xl` whether it shows the cover `<img>` or the initials fallback
- **AND** the rounding matches the catalog card (both `rounded-2xl`), not the previous `rounded-large`

#### Scenario: Rounding is consistent list ↔ detail
- **WHEN** the same subject is viewed as a catalog card and then on its detail workspace
- **THEN** the cover/identity radius is the same `rounded-2xl` on both surfaces

#### Scenario: Loading skeleton mirrors the rounded badge
- **WHEN** the catalog is in its loading state
- **THEN** the skeleton card's identity badge is `rounded-2xl`, matching the real card's badge
