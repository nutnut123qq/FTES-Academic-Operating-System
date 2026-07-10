## ADDED Requirements

### Requirement: Mobile rail access
The learn player SHALL provide, on viewports below `lg` where the desktop content-map and
on-this-page rails are hidden, a fixed bottom bar that opens those rails as drawers so a
phone learner can jump modules and read the outline. The reading column SHALL reserve bottom
space so the bar never covers content.

#### Scenario: Content-map reachable on mobile
- **WHEN** the lesson reader is viewed below `lg`
- **THEN** a fixed bottom bar shows a control that opens the course content-map in a drawer
- **AND** the reading column reserves bottom padding so the bar never overlaps the content tail

#### Scenario: Outline reachable on mobile
- **WHEN** the lesson being read has an on-this-page outline and is viewed below `lg`
- **THEN** the bottom bar shows a control that opens the outline as a full-width panel in a drawer

#### Scenario: Bar absent where it has no rails
- **WHEN** a learn surface without a content rail is viewed below `lg`
- **THEN** the bottom bar is not shown

### Requirement: Lesson body rendering quality
The learn player SHALL render migrated HTML lesson bodies with a full typography ladder
(headings, code, preformatted blocks, blockquotes, images, tables), and SHALL render code
blocks with horizontal scrolling rather than wrapping that shatters long tokens.

#### Scenario: HTML lesson typography
- **WHEN** a migrated HTML lesson body renders
- **THEN** its headings, inline code, code blocks, blockquotes and images are styled to match the markdown reading experience

#### Scenario: Long code does not shatter
- **WHEN** a code block contains a line longer than the reading column
- **THEN** the block scrolls horizontally instead of wrapping mid-token

### Requirement: Content-map continue action
The content-map rail SHALL offer a one-tap action to resume at the learner's next lesson.

#### Scenario: Continue from the rail
- **WHEN** the content-map rail renders and a resume target is known
- **THEN** a "continue learning" action is shown that opens the resume-target lesson

### Requirement: Dynamic challenges tab
The reader's content/challenges tab list SHALL omit the challenges tab when the current
lesson has no challenge, so it never presents a permanent dead-end tab.

#### Scenario: No-challenge lesson hides the tab
- **WHEN** the current lesson has no challenge
- **THEN** the challenges tab is not shown in the reader tab list

#### Scenario: Challenge lesson shows the tab
- **WHEN** the current lesson has a challenge
- **THEN** the challenges tab is shown
