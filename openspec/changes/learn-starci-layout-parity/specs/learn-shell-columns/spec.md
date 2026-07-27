# learn-shell-columns

## ADDED Requirements

### Requirement: Course-tools rail occupies the far-left column
The course-learn content dashboard SHALL render the course-tools / navigation rail
(`LearnToolsRail`) as the FIRST column (column 1, far left) of the learn shell, ahead of
the content-map, so the course tool menu reads on the left and is not pushed to the right.

#### Scenario: Content dashboard on desktop
- **WHEN** a learner opens `/courses/{id}/learn/content` at `lg` width or above
- **THEN** the course-tools rail is the left-most column of the shell
- **AND** it is not rendered as the right-hand rail

#### Scenario: Tools rail leads with menu header and resume card
- **WHEN** the course-tools rail renders on the content dashboard
- **THEN** it opens with the "Mục lục khoá học" course-menu header
- **AND** below the header it shows a highlighted "Tiếp tục · N/total" resume card that links to the next unread lesson when one exists
- **AND** the learn and subject tool groups follow beneath the resume card

### Requirement: Content-map occupies the middle column
The content dashboard SHALL render the content-map (module → lesson accordion with the
progress header and search) as column 2, between the far-left tools rail and the main
course content.

#### Scenario: Middle column is the content-map
- **WHEN** a learner opens the content dashboard on desktop
- **THEN** the content-map rail sits to the RIGHT of the course-tools rail
- **AND** it sits to the LEFT of the main course content

### Requirement: Main course content occupies the right column
The content dashboard SHALL render the main course content (`LearnContentPage`: title,
meta chips, continue + progress, trial→unlock card, about) as the right-most column
(column 3), after the tools rail and the content-map.

#### Scenario: Right column is the main content
- **WHEN** a learner opens the content dashboard on desktop
- **THEN** the course title, meta, trial/unlock card and about read in the right-most column
- **AND** no course-tools list is rendered inside that column on desktop

### Requirement: Global app navbar is retained above the learn shell
The learn shell SHALL NOT hide the global site navigation bar; the content dashboard
renders its three columns beneath the persistent app navbar (logo, primary nav, search,
theme toggle, cart, notifications, avatar).

#### Scenario: Navbar present on the learn page
- **WHEN** a learner opens the content dashboard
- **THEN** the global app navbar remains visible above the three-column shell

### Requirement: Columns stack on small screens
Below the `lg` breakpoint the learn shell SHALL collapse to a single stacked column, and
the course tools SHALL stay reachable through the inline mobile tools block rather than a
desktop side rail.

#### Scenario: Mobile viewport
- **WHEN** a learner opens the content dashboard below `lg` width
- **THEN** the desktop tools rail and content-map side rails are hidden
- **AND** the course tools remain available via the inline mobile block on the dashboard
