# subject-workspace-ia — delta

## ADDED Requirements

### Requirement: Subject workspace rail v2 composition
The subject workspace left rail SHALL contain exactly eight tabs in the order below,
grouped into three separator-divided clusters, and SHALL NOT contain a Learning/Lessons
tab. The rail is rendered by `SubjectWorkspaceShell` for every route under
`/subjects/[subjectId]`:

1. Cluster "subject space": Overview (`/subjects/[subjectId]`) · Thảo luận
   (`/subjects/[subjectId]/discussion`) · Tài liệu (`/subjects/[subjectId]/resources`) ·
   Luyện tập (`/subjects/[subjectId]/practice`) · AI (`/subjects/[subjectId]/ai`)
2. Cluster "community": Thành viên (`/subjects/[subjectId]/members`)
3. Cluster "insight": Thống kê (`/subjects/[subjectId]/statistics`) · Nghề nghiệp
   (`/subjects/[subjectId]/career`)

The rail itself (collapsible left sidebar, sticky under the navbar) is unchanged from the
shell spec — only its items change.

#### Scenario: Rail v2 renders eight tabs, no Lessons
- **WHEN** any subject workspace route renders
- **THEN** the left rail shows exactly the eight tabs above, in that order, in three clusters
- **AND** no rail item links to `/subjects/[subjectId]/learning` and no item is labeled
  "Bài học" (vi) / "Lessons" (en)

#### Scenario: Active tab detection follows the new segments
- **WHEN** the user is on `/subjects/[subjectId]/discussion` (or any of its subpaths)
- **THEN** the "Thảo luận" rail item is marked active (and only it)
- **WHEN** the user is on `/subjects/[subjectId]` exactly
- **THEN** the "Tổng quan" (Overview) rail item is marked active

#### Scenario: Rail v2 accessibility
- **WHEN** the rail renders (expanded or collapsed)
- **THEN** every tab remains keyboard-focusable and exposes an accessible name equal to its
  visible label ("Thảo luận", "Tài liệu", "Luyện tập", …), including in the collapsed
  icon-only state (via `aria-label` or equivalent)

### Requirement: Subject tab labels are localized (vi/en)
The rail tab labels SHALL come from i18n messages in both `vi` and `en` locales. Vietnamese
labels SHALL be: "Tổng quan", "Thảo luận", "Tài liệu", "Luyện tập", "AI", "Thành viên",
"Thống kê", "Nghề nghiệp". English labels SHALL be: "Overview", "Discussion", "Resources",
"Practice", "AI", "Members", "Statistics", "Career". The obsolete `subjects.nav.learning`
label SHALL be removed from both locales.

#### Scenario: Vietnamese labels
- **WHEN** the workspace renders under the `vi` locale
- **THEN** the rail shows "Thảo luận" for the discussion tab, "Tài liệu" for resources, and
  "Luyện tập" for practice

#### Scenario: English labels
- **WHEN** the workspace renders under the `en` locale
- **THEN** the rail shows "Discussion", "Resources", and "Practice" for those same tabs

### Requirement: Thảo luận tab is the subject-scoped discussion feed
The route `/subjects/[subjectId]/discussion` SHALL render the subject-scoped post feed
(the feature previously served at the workspace `community` segment) inside the workspace
shell. The legacy route `/subjects/[subjectId]/community` SHALL redirect to
`/subjects/[subjectId]/discussion`, preserving the `[subjectId]` and locale.

#### Scenario: Discussion tab shows the subject feed
- **WHEN** the user opens `/subjects/[subjectId]/discussion`
- **THEN** the subject-scoped discussion feed renders as the active tab content inside the
  workspace shell

#### Scenario: Legacy community segment redirects
- **WHEN** the user navigates to `/subjects/[subjectId]/community`
- **THEN** they are redirected to `/subjects/[subjectId]/discussion` for the same subject
  and locale, and the "Thảo luận" rail item is active after the redirect

### Requirement: Learning route removal and redirect
The workspace SHALL NOT serve learning content at `/subjects/[subjectId]/learning`. The
route SHALL remain resolvable and SHALL redirect to the workspace Overview
(`/subjects/[subjectId]`), preserving the `[subjectId]` and locale, so existing links and
bookmarks do not 404.

#### Scenario: Learning URL redirects to Overview
- **WHEN** the user navigates to `/subjects/[subjectId]/learning` (directly or via an old link)
- **THEN** they are redirected to `/subjects/[subjectId]` for the same subject and locale
- **AND** the Overview renders, where the "Khóa học của môn này" card (when the subject has
  linked courses) offers the path to structured learning

### Requirement: Domain separation — workspace renders no lesson content
The subject workspace (every route under `/subjects/[subjectId]`) SHALL NOT render
structured-learning content: no lesson bodies, section/lesson lists, lesson video players,
quiz players, per-lesson progress, or certificates. Structured learning belongs exclusively
to the Course module; the workspace MAY only link out to `/courses/[courseId]`.

#### Scenario: No lesson content in any workspace tab
- **WHEN** any workspace tab (Overview, Thảo luận, Tài liệu, Luyện tập, AI, Members,
  Statistics, Career) renders
- **THEN** no section/lesson list, lesson body, video player, quiz player, or certificate UI
  is rendered
- **AND** any course-related element is a link-out whose destination is under
  `/courses/[courseId]`

### Requirement: Domain separation — community module excludes subject-bound groups
The global Community module (groups list, group discovery, community feed) SHALL NOT list
or create subject-bound groups. Groups there represent clubs, teams, and interest groups
outside subjects; subject-scoped discussion SHALL exist only inside the subject workspace
(the Thảo luận tab).

#### Scenario: Groups list has no subject-bound groups
- **WHEN** the community groups list or group discovery renders
- **THEN** no group representing a subject workspace (a subject-bound group) appears among
  the listed or creatable group types

#### Scenario: Subject discussion is not mirrored in the community feed
- **WHEN** the global community feed renders
- **THEN** subject-workspace discussion posts are not sourced into it; they are reachable
  only via `/subjects/[subjectId]/discussion`

### Requirement: Domain separation — course pages render no workspace rail
Course module pages SHALL NOT render the subject workspace rail. This covers all routes
under `/courses/[courseId]` — catalog, detail, lesson player, quiz, and progress surfaces —
none of which may mount `SubjectWorkspaceShell` or its `CollapsibleSidebar` tab list. The
Course module remains a standalone surface with its own navigation.

#### Scenario: Course detail has no workspace rail
- **WHEN** the user opens `/courses/[courseId]` (e.g. by following the Overview card CTA)
- **THEN** the page renders without the subject workspace left rail and without any
  workspace tab list
