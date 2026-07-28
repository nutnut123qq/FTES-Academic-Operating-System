# community-side-rails (delta)

## ADDED Requirements

### Requirement: Moderation nav entry is gated by moderation permission

The community nav SHALL show the "Kiểm duyệt" (Moderation) entry ONLY to a viewer who
holds the `community.moderate` permission — the same permission the CommunityModeration
page gates its queue fetch on. A viewer without it SHALL NOT see the moderation link in
the left nav rail NOR in the ⋯ menu (any breakpoint). The CommunityModeration page SHALL
still render its "restricted" fallback for a viewer who reaches `/community/moderation`
directly by URL.

#### Scenario: Viewer without permission sees no moderation link

- **WHEN** a viewer without `community.moderate` opens the community page
- **THEN** the "Kiểm duyệt" entry is absent from both the left nav rail and the ⋯ menu

#### Scenario: Moderator still sees the moderation link

- **WHEN** a viewer who holds `community.moderate` opens the community page
- **THEN** the "Kiểm duyệt" entry appears in the nav (rail on `xl`+, ⋯ menu below) and links to `/community/moderation`

#### Scenario: Direct URL still guarded

- **WHEN** a viewer without `community.moderate` navigates straight to `/community/moderation`
- **THEN** the CommunityModeration page renders its "restricted" fallback instead of the queue
