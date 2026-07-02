## ADDED Requirements

### Requirement: Skill graph data model and mock hook
The system SHALL define a skill-graph data model — skill nodes (`id`, `name`, `domain` in {be, fe, mobile, ai, data, devops}, `level` 0–100, `status` in {locked, learning, mastered}) and typed edges (`prerequisite` | `related`) — served by a mock SWR hook `useQuerySkillGraphSwr(scope?)` that returns deterministic sample data, the full graph without scope and a subject-scoped subgraph (the subject's skills plus 1-hop neighbors) when `subjectId` is given.

#### Scenario: Full graph loads from mock
- **WHEN** a surface calls `useQuerySkillGraphSwr()` with no scope
- **THEN** the hook returns `{ graph, isLoading, error }` with deterministic nodes and edges covering all six domains
- **AND** the same input always yields the same data (no randomness between renders)

#### Scenario: Subject-scoped subgraph
- **WHEN** the hook is called with `{ subjectId }`
- **THEN** it returns only the skills mapped to that subject plus their direct (1-hop) prerequisite/related neighbors

### Requirement: Spider-web network visualization
The system SHALL render the skill graph as a spider-web force-directed network using `@xyflow/react` with a `d3-force` computed layout: a center node representing the user, skill nodes clustered in radial sectors by domain, node size and color encoding mastery (level/status), and edge styling distinguishing prerequisite (solid, directional) from related (dashed) links. The layout MUST be computed deterministically (no jitter across re-renders) and all colors MUST come from Tailwind design tokens.

#### Scenario: Graph renders with mock data
- **WHEN** the skill graph mounts with loaded mock data
- **THEN** the user node appears at the center with skill nodes arranged in domain clusters around it
- **AND** mastered, learning, and locked nodes are visually distinct (size/color/icon)
- **AND** prerequisite and related edges use distinct line styles

#### Scenario: Legend explains encodings
- **WHEN** the graph is visible
- **THEN** a legend lists the domain colors, the three node statuses, and the two edge kinds

#### Scenario: Empty graph for a new user
- **WHEN** the hook returns a graph with zero skill nodes
- **THEN** the surface shows an empty state with an explanatory message and no canvas
- **AND** the empty state is localized (vi/en)

### Requirement: Graph interactions
The system SHALL support pan and zoom of the graph viewport, clicking a skill node to open a detail side panel (skill name, domain, level progress, status, and links to related subjects/courses that navigate into the workspace), hovering a node to highlight its direct neighbors and connecting edges while dimming the rest, and filtering visible nodes by domain.

#### Scenario: Node click opens detail panel
- **WHEN** the learner clicks a skill node
- **THEN** a side panel opens showing the skill's name, domain, level progress, and status
- **AND** the panel lists related subjects/courses as links into the subject workspace
- **AND** closing the panel returns focus to the graph

#### Scenario: Hover highlights neighbors
- **WHEN** the learner hovers a skill node
- **THEN** that node, its direct neighbors, and their connecting edges are highlighted
- **AND** unrelated nodes and edges are dimmed until hover ends

#### Scenario: Filter by domain
- **WHEN** the learner selects one or more domains in the filter control
- **THEN** only nodes of those domains (and edges between visible nodes) remain shown
- **AND** clearing the filter restores the full graph

### Requirement: Surfaces — profile Progress and subject Career tab
The system SHALL render the full skill graph in the profile Progress section (replacing its placeholder) and a subject-scoped subgraph inside the subject workspace Career tab, both using the same `SkillGraph` feature component.

#### Scenario: Profile Progress shows full graph
- **WHEN** the learner opens their profile Progress section
- **THEN** the full spider-web skill graph renders in place of the previous placeholder

#### Scenario: Career tab shows subject subgraph
- **WHEN** the learner opens a subject's Career tab
- **THEN** a subgraph scoped to that subject's skills (plus 1-hop neighbors) renders alongside the existing career content

### Requirement: Responsive behavior and loading state
The system SHALL show a layout-mirroring skeleton while the graph data is loading, and on viewports below the `sm` breakpoint SHALL replace the canvas with a simplified list fallback — skills grouped by domain as tappable rows that open the same detail panel — while `sm` and above keeps the interactive canvas with touch pinch-zoom.

#### Scenario: Loading skeleton
- **WHEN** graph data is loading (or errored with no data)
- **THEN** a skeleton mirroring the graph area and toolbar renders instead of the canvas

#### Scenario: Mobile fallback list
- **WHEN** the surface renders below the `sm` breakpoint
- **THEN** skills appear as a domain-grouped list instead of the canvas
- **AND** tapping a row opens the same skill detail panel
- **AND** the domain filter still applies

### Requirement: Internationalization and accessibility
The system SHALL localize all skill-graph UI strings (toolbar, legend, statuses, empty state, detail panel labels) in Vietnamese and English, and SHALL be accessible: skill nodes reachable and activatable by keyboard (Tab/Enter opens the detail panel), visible focus indicator on nodes, `aria-label`s on the canvas region, nodes, and icon-only controls, and the detail panel announced as a dialog/region.

#### Scenario: Localized UI
- **WHEN** the app locale is vi or en
- **THEN** every skill-graph string (legend, filter, statuses, empty state, panel labels) renders in that locale with no hard-coded copy

#### Scenario: Keyboard navigation
- **WHEN** a keyboard user tabs into the graph
- **THEN** skill nodes receive a visible focus indicator in a predictable order
- **AND** pressing Enter on a focused node opens its detail panel
- **AND** Escape closes the panel and restores focus to the node
