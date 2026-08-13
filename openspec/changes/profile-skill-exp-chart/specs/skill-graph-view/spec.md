# skill-graph-view

## ADDED Requirements

### Requirement: Surfaces — subject Career tab
The system SHALL render a subject-scoped skill subgraph inside the subject workspace Career tab using
the `SkillGraph` feature component, and the component SHALL keep its subject-agnostic full-graph mode
available for any other surface that mounts it.

#### Scenario: Career tab shows subject subgraph
- **WHEN** the learner opens a subject's Career tab
- **THEN** a subgraph scoped to that subject's skills (plus 1-hop neighbors) renders alongside the existing career content

#### Scenario: Full-graph mode stays available
- **WHEN** a surface mounts the component with no subject scope
- **THEN** the full spider-web graph renders with the same interactions, mobile fallback and loading behavior

## REMOVED Requirements

### Requirement: Surfaces — profile Progress and subject Career tab
**Reason**: The profile Progress section no longer embeds the skill graph — it shows the skill-EXP
bar chart instead (see `profile-gamification-dashboard`). The surfaces requirement is replaced by
"Surfaces — subject Career tab", which keeps the graph's remaining real surface.
**Migration**: None for the graph itself: the component, its hooks, its layout and its backend reads
are unchanged. Only the profile's mount point is removed.
