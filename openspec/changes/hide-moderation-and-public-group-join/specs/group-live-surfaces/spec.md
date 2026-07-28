# group-live-surfaces (delta)

## ADDED Requirements

### Requirement: Public group needs no Join CTA

The group Join button SHALL NOT render a "Join" call-to-action for a non-member of a group
whose visibility is `PUBLIC`, because a public group is open (readable and participable
without an explicit join). For a PRIVATE or RESTRICTED group the Join CTA SHALL remain
(request-to-join). A member's or owner's Leave / Joined state SHALL be unaffected by
visibility — only the actionable Join is suppressed for public groups. The group's raw BE
visibility SHALL be surfaced to the button (on both the discover list card and the detail
header) so the decision uses the true visibility rather than the lossy derived group type.

#### Scenario: Non-member of a public group sees no Join button

- **WHEN** a non-member views a group whose visibility is `PUBLIC` (on a list card or the group detail header)
- **THEN** no "Join" button is rendered for that group

#### Scenario: Non-member of a private group still sees Join

- **WHEN** a non-member views a group whose visibility is `PRIVATE` or `RESTRICTED`
- **THEN** the "Join" (request-to-join) button is rendered

#### Scenario: Member of a public group keeps Leave

- **WHEN** a member (or owner) views a public group
- **THEN** their Leave / Joined indicator is still shown (only the Join CTA is removed for public groups)
