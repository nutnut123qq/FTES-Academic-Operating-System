# subject-catalog (delta)

## ADDED Requirements

### Requirement: The major catalog is a two-level tree from the FPT syllabus

The major catalog SHALL carry the syllabus' own two levels: a BLOCK (Công nghệ thông tin, Quản
trị kinh doanh, …) and, for a block that has more than one of them, its SPECIALISATIONS (Kỹ
thuật phần mềm, An toàn thông tin, Marketing Số, …). A block holding a single specialisation
SHALL NOT get a second level, because that level would only repeat the block. Every row returned
by `GET /api/v1/majors` SHALL carry `parentCode` — `null` for a block — and the list SHALL be
ordered block-then-its-specialisations so the picker can indent children without building a tree.

Codes already handed out (`SE`, `IC`) SHALL keep their ids, because user profiles point at them.
Codes that are not FPT majors (`MATH`, `LANG`) SHALL become INACTIVE rather than be deleted, so a
profile pointing at one still resolves to a name.

#### Scenario: Picker shows blocks with their specialisations

- **WHEN** a user opens the major filter
- **THEN** the blocks are listed in order, each followed by its own specialisations, indented

#### Scenario: A retired major still reads

- **WHEN** a profile holds `majorCode = "MATH"` after the catalog change
- **THEN** the profile still shows the major's name, and `MATH` is not offered in the picker

### Requirement: Filtering by a block includes its specialisations

Filtering the catalog by a BLOCK code SHALL return the subjects of that block AND of every ACTIVE
specialisation under it, because subjects are attached to the leaf a curriculum names. Filtering
by a SPECIALISATION code SHALL return only that specialisation's subjects — it SHALL NOT widen to
the parent block. An unknown or INACTIVE code SHALL be rejected (400), never answered with an
empty page, so a typo cannot look like "this major has no subjects yet".

#### Scenario: Block filter reaches specialisation subjects

- **WHEN** a subject is attached to "Kỹ thuật phần mềm" and the user filters by "Công nghệ thông tin"
- **THEN** the subject appears in the grid

#### Scenario: Specialisation filter does not widen

- **WHEN** the user filters by "Kỹ thuật phần mềm"
- **THEN** subjects belonging only to other specialisations of the same block do NOT appear

### Requirement: Semester is read from the selected major

A subject SHALL carry the semester its OWN major schedules it in, because the same subject sits
in different semesters across programs. When a major filter is active, the semester filter SHALL
match the subject↔major link's semester; when no major is selected it SHALL fall back to the
subject's own most-common semester. The two SHALL NOT be required together, or a subject whose
major schedules it off the common semester would be dropped from both.

#### Scenario: Same subject, two majors, two semesters

- **GIVEN** `ACC101` is semester 1 in one major and semester 2 in another
- **WHEN** the user filters that second major and semester 2
- **THEN** `ACC101` appears
- **AND** filtering the second major with semester 1 does not return it

## MODIFIED Requirements

### Requirement: Compact catalog filters as two dropdowns

The subject catalog SHALL present its major and semester filters as two dropdowns, and the
semester dropdown SHALL list all program semesters (1..9), so a user can pick any semester
regardless of whether it currently has subjects. ALL THREE filters (major, semester, search)
SHALL run server-side and the grid SHALL page through results, because the catalog holds the
whole FPT syllabus (~400 subjects) and a single pre-loaded page filtered in the browser truncates
the list with no sign to the user. Typing SHALL NOT fire one request per keystroke.

#### Scenario: Pick a semester

- **WHEN** a user opens the "Kỳ" dropdown
- **THEN** it lists "Tất cả" and Kì 1 through Kì 9

#### Scenario: Empty semester

- **WHEN** a user picks a semester that has no subjects
- **THEN** the grid is empty (not silently unfiltered)

#### Scenario: The list is complete, not the first page

- **WHEN** a filter matches more subjects than one page holds
- **THEN** scrolling to the end loads the next page until the result set is exhausted
