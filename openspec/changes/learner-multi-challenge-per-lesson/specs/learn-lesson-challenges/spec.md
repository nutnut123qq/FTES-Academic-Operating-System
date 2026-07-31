# learn-lesson-challenges (delta)

## ADDED Requirements

### Requirement: Reader shows all challenges of a lesson

The lesson reader SHALL render every active challenge attached to the lesson (a lesson may have many),
sourced from the curriculum challenge list — not the single `hasChallenge`/`challengeId` linkage. The
"Thử thách" tab SHALL appear whenever the lesson has at least one challenge, and each challenge SHALL be
shown as its own entry (title + type) that opens that specific challenge. A non-free challenge the
viewer has not unlocked SHALL open the package gate instead of the solver, gated independently per
challenge.

#### Scenario: Multiple challenges listed

- **WHEN** a lesson has more than one active challenge
- **THEN** the Thử thách tab lists every one of them, each opening its own solver

#### Scenario: Per-challenge gating

- **WHEN** a listed challenge is non-free and the viewer lacks full access
- **THEN** its entry opens the package gate instead of routing into the solver

#### Scenario: Legacy single-linkage fallback

- **WHEN** the curriculum does not return the challenges array (older backend) but the single
  `challengeId` linkage is present
- **THEN** the reader still shows that one challenge

### Requirement: Practice rail lists all challenges

The "On this page" rail SHALL offer one practice action per challenge of the lesson (labeled by the
challenge title), rather than a single practice button.

#### Scenario: One action per challenge

- **WHEN** a lesson has several challenges
- **THEN** the rail shows a practice button for each
