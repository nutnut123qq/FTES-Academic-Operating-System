# user-avatar-fallback (delta)

## ADDED Requirements

### Requirement: One avatar fallback chain, uploaded photo always first

The shared user avatar SHALL resolve its image through ONE chain, everywhere:

1. the uploaded photo, when present (trimmed) and it loads;
2. otherwise a generated face, seeded deterministically by a stable identity string
   (`seed ?? username`) — the same person always gets the same face;
3. otherwise the user's initials on the neutral fallback tile;
4. otherwise a neutral person glyph, when there are no usable initials (no name, or the caller only
   had a raw uuid).

The uploaded photo SHALL always win over the generated face. The chain SHALL also advance on LOAD
FAILURE, not only on a missing URL — the underlying avatar primitive mounts its `<img>` only after
it decodes — so a broken photo URL, or the generated-avatar service being unreachable, simply leaves
the initials tile on screen.

#### Scenario: User with a photo

- **WHEN** an uploaded avatar URL is present
- **THEN** the photo renders and no generated face is requested

#### Scenario: User without a photo

- **WHEN** no uploaded avatar URL is present but a seed is available
- **THEN** the deterministic generated face renders

#### Scenario: Generated service unreachable

- **WHEN** the generated-avatar request fails to load
- **THEN** the initials tile renders in its place

### Requirement: No seed means no generated face

The generated-avatar URL builder SHALL trim its seed and SHALL return `null` for an empty or
whitespace-only seed, rather than substituting a placeholder seed.

Substituting one (as the reference implementation this was ported from does) would give EVERY
seedless user the exact same face, so distinct people would read as the same person. With no seed the
caller falls back to the initials tile instead.

The same seed SHALL always produce the same URL, including when the seed arrives with surrounding
whitespace, and the seed SHALL be URL-encoded so names with spaces or diacritics work.

#### Scenario: Empty seed

- **WHEN** the seed is empty or whitespace only
- **THEN** the builder returns null and the caller shows initials

#### Scenario: Stable identity

- **WHEN** the same seed is passed twice, once with padding whitespace
- **THEN** both calls produce the identical URL

### Requirement: The generated face carries its own debugging warning

The avatar component SHALL carry, in place, a warning about the trap this feature re-introduces, and
SHALL direct anyone investigating "my photo does not show" to inspect that surface's MAPPER first:
since the uploaded URL always wins, a generated face means the URL never arrived.

The trap is that a seeded face renders for EVERY user without a photo, so a mapper that silently
drops `avatarUrl` looks exactly like "this user has no photo" — which is how a real bug hid for weeks
across the community feed mappers and led to the generated face being removed once already.

#### Scenario: A surface shows generated faces for users who have photos

- **WHEN** someone investigates why a surface renders generated faces
- **THEN** the component documentation points them at that surface's mapper rather than at the
  avatar chain
