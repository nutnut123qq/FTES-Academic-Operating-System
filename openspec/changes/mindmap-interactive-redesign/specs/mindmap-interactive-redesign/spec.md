# mindmap-interactive-redesign

## ADDED Requirements

### Requirement: Interactive draggable / pan / zoom React-Flow mind-map canvas
The course mind map SHALL render on an interactive `@xyflow/react` canvas whose nodes are draggable and whose viewport pans, zooms, and exposes a fit-view control, replacing the static radial SVG. The canvas SHALL mount SSR-safely (only after hydration, since React Flow measures the DOM) inside a `ReactFlowProvider`, hide the React Flow attribution, and on first paint frame the module the viewer resumes at ("you are here") — or fit the whole tree when there is no resume pointer. It SHALL stay on the existing `/learn/mind-map` route.

#### Scenario: Learner drags, pans and zooms the map
- **WHEN** the mind-map route renders with course data
- **THEN** the course is drawn as nodes and edges on a React Flow canvas
- **AND** the viewer can drag a node, pan the canvas, zoom in/out, and press the fit-view control to frame the whole tree

#### Scenario: Camera opens on the current module
- **WHEN** the viewer has a resume pointer (an incomplete "you are here" lesson)
- **THEN** the initial camera centres on that lesson's module at a readable zoom
- **AND** clicking the root node re-frames the camera to the whole tree

### Requirement: Root node shows the subject code, not the course title
The mind-map root node SHALL display the linked SUBJECT CODE (e.g. "CSD201") over the overall-completion percent ring, instead of the full course title. When the course has no linked subject code, the root SHALL fall back to a short derived course code (an uppercase acronym of the course title's significant words, capped in length; degrading to a trimmed course-id slug when the title is empty), so the root stays compact and every map reads evenly. The overall completion percent SHALL remain on the root.

#### Scenario: Course with a linked subject renders its code
- **WHEN** the course header carries `subjectCode` "CSD201"
- **THEN** the root node label is "CSD201" (not the course title)
- **AND** the root still shows the overall completion percent ring

#### Scenario: Course without a subject falls back to a short code
- **WHEN** the course header has no `subjectCode`
- **THEN** the root shows a short derived code (a title acronym, or a trimmed course-id slug)
- **AND** the long course title is never used as the root label

### Requirement: Lesson exercises render as their own nodes
The mind map SHALL render each lesson's exercises (challenges and assignments, from the learn tree's `lesson.exercises`) as child nodes beneath their lesson, in addition to the module and lesson nodes, laid out as a tidy left-to-right tree (root → module → lesson → exercise) whose parents are centred on their children so columns do not overlap. Exercise nodes SHALL be created ONLY where the data actually carries an exercise (a lesson with no exercises produces none — no fabricated nodes). Clicking an exercise SHALL open its solver (a challenge routes to its per-lesson solver via the slug; an assignment opens the lesson reader), while a gated exercise SHALL open the package gate on its parent lesson.

#### Scenario: A lesson's challenge and assignment become nodes
- **WHEN** a lesson carries one challenge and one assignment
- **THEN** two exercise nodes are rendered as children of that lesson's node
- **AND** a sibling lesson with no exercises renders no exercise node

#### Scenario: Clicking an accessible challenge opens its solver
- **WHEN** the viewer clicks a challenge node on a lesson they can access
- **THEN** the app routes to that challenge's solver route keyed on its slug

#### Scenario: Clicking a gated exercise opens the package gate
- **WHEN** the viewer clicks an exercise whose parent lesson is locked
- **THEN** the package gate opens on the parent lesson instead of routing into a locked solver

### Requirement: Content nodes carry a typed 3-state completion status colour
Every content node (module, lesson, exercise) SHALL carry a typed `status` field of exactly three states — `completed`, `inProgress`, `notStarted` — driving its colour via design tokens: `completed` = GREEN (`--success`), `inProgress` = ORANGE/amber (`--warning`), `notStarted` = light warm neutral (`--default`). The status SHALL be derived from the completion signals already on the learn tree: a module is `completed` when every lesson is complete, `inProgress` when some are, else `notStarted`; a lesson is `completed` when `isCompleted`, else `notStarted`. The premium paywall SHALL be an orthogonal `isLocked` flag (dimmed + lock glyph) that follows the PER-VIEWER lock, not the static premium flag, so a premium node the viewer owns is not greyed out. Exercise status SHALL be `notStarted` for now, with the typed field left ready for a later backend phase to feed the real per-node status (from AI progress + exercise results).

#### Scenario: Module tint reflects lesson completion
- **WHEN** every lesson in a module is complete
- **THEN** the module node is GREEN (`completed`)
- **WHEN** only some lessons are complete
- **THEN** the module node is ORANGE (`inProgress`)
- **WHEN** no lesson is complete
- **THEN** the module node is the light neutral (`notStarted`)

#### Scenario: A premium node the viewer owns is not greyed out
- **WHEN** a module's lessons are all premium but unlocked for this viewer (per-viewer `isLocked` false)
- **THEN** the module is not marked locked
- **WHEN** every lesson in a module is locked for this viewer
- **THEN** the module is marked locked (dimmed + lock glyph)

#### Scenario: Exercise status is ready for the backend phase
- **WHEN** an exercise node is built from current data
- **THEN** its `status` is `notStarted`
- **AND** the typed `status` field is available for a later backend phase to set `completed` or `inProgress` from the real per-node result
