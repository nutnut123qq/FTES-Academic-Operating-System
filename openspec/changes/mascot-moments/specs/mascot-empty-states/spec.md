# mascot-empty-states

## ADDED Requirements

### Requirement: Mascot in zero-data empty states via shared icon slot

The app SHALL render the FTES mascot (reusing `FtesMascot` from `onboarding-mascot-guide`) in the
`icon` slot of the shared `EmptyContent` / `EmptyState` blocks on zero-data surfaces, in place of
the default Phosphor icon, without modifying those blocks — only the `icon` value at each call-site
SHALL change. The pose SHALL follow intent: `point` for "nothing yet → go create/explore"
surfaces (anchoring an existing CTA), and `explain` for filter/search-empty results or narrow
panels. Because the empty state itself is the surface content, these appearances SHALL NOT be
frequency-capped and SHALL disappear as soon as the list has at least one item.

#### Scenario: New learner with no courses sees a pointing mascot

- **WHEN** MyCourses finishes loading and `courses.length === 0`
- **THEN** the empty state renders `FtesMascot` in the `point` pose in the `icon` slot next to the
  browse-courses CTA, and the mascot disappears once the learner has at least one course

#### Scenario: Empty cart guides to the catalog

- **WHEN** CartShell has `items.length === 0`
- **THEN** the empty state shows the mascot pointing, alongside a CTA toward the course catalog

#### Scenario: Search with no results reassures rather than points

- **WHEN** SearchResults has enough characters, is not loading, has no error, and zero matches after debounce
- **THEN** the mascot renders in the `explain` pose with the query interpolated into the copy, and
  it does not flicker while the user is still typing

#### Scenario: Narrow panel uses the small size

- **WHEN** the NotificationCenter popover has `items.length === 0`
- **THEN** the mascot renders at size `sm` so it fits the narrow panel

### Requirement: One mascot per page to avoid clutter

On any surface that contains multiple empty regions, tabs, or sub-empty blocks, the app SHALL show
the mascot in at most one anchor region; all other empty regions on the same page SHALL keep their
plain icons. The Skills empty block on the owner's ProfilePersonal SHALL deliberately keep a plain
icon because the Job-readiness block on the same view already carries the mascot, and ProfilePublic
SHALL always keep plain icons.

#### Scenario: Career Center anchors the mascot to one block

- **WHEN** the Career Center renders with empty skills, roadmaps, and jobs blocks
- **THEN** only the skills block (the anchor) shows the mascot, and the roadmaps and jobs blocks
  keep plain icons

#### Scenario: Profile shows the mascot on Job-readiness only

- **WHEN** the owner views ProfilePersonal with both Job-readiness and Skills empty
- **THEN** the mascot appears on the Job-readiness block only, and the Skills block keeps a plain icon

#### Scenario: Public profile keeps plain icons

- **WHEN** another user views a ProfilePublic with an empty Skills section
- **THEN** the empty state keeps its plain icon and no mascot is shown

### Requirement: Filtered-empty results lower the tone

The app SHALL use the `explain` pose with reassuring copy — rather than the inviting `point`
pose — when an empty state is the result of a filter or search returning nothing (as opposed to a
never-had-data state), and MAY use size `sm` for frequently-changing filter results.

#### Scenario: Marketplace filter returns nothing

- **WHEN** MarketplaceCatalog has `filtered.length === 0` from an active filter
- **THEN** the mascot renders in the `explain` pose at size `sm` with reassuring "try removing a
  filter" copy, not a discovery invitation

#### Scenario: Groups list distinguishes never-joined from filtered

- **WHEN** GroupsList has `filtered.length === 0`
- **THEN** if the user has joined no groups the mascot uses `point` with a discovery invitation,
  and if the emptiness is due to a filter the mascot uses `explain` with lower-key copy
