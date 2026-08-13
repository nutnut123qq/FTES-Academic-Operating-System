# profile-gamification-dashboard

## ADDED Requirements

### Requirement: Skill EXP bar chart section
The Progress tab SHALL render a skill-EXP section showing one horizontal bar per skill category of
the career skill-category catalogue, so the learner reads at a glance where their study time is
accumulating. Bars SHALL be drawn from the RAW accumulated EXP — never normalised to a 0–100 scale
and never measured against an invented maximum — and the axis SHALL auto-scale to the learner's own
highest category, with the axis maximum printed under the bars so the lengths stay readable. Every
category the backend returns SHALL get a bar, including categories still at zero, and the section
SHALL own its loading, empty and error states.

#### Scenario: Learner with EXP sees ranked bars
- **WHEN** the Progress tab renders for a learner whose category totals include at least one non-zero category
- **THEN** every returned category appears as a labelled bar with its raw EXP printed beside the label
- **AND** the strongest category's bar reaches the axis maximum while the others are drawn in proportion to it
- **AND** the axis maximum is shown, so a longer bar is never mistaken for a fixed 100%

#### Scenario: Learner who has earned no EXP yet
- **WHEN** every category total is zero, or the catalogue returns no categories at all
- **THEN** the section shows an explanatory empty state instead of a row of zero-width bars on a meaningless axis

#### Scenario: Section is loading or the read fails
- **WHEN** the skill-EXP data is still loading
- **THEN** a skeleton mirroring the bar rows renders in place of the chart
- **AND** when the read fails with no data to fall back on, an error state with a retry action renders instead

#### Scenario: Category labels are localized
- **WHEN** the locale is vi or en
- **THEN** each category label renders in that locale
- **AND** a category with no translation falls back to the label the backend supplied, never a raw key

## REMOVED Requirements

### Requirement: Embedded skill graph section
**Reason**: The profile now answers "where is my EXP accumulating?" with the skill-EXP bar chart
(see "Skill EXP bar chart section"), which is fed by the category totals from the backend
`course-skill-exp` change. Keeping both a node graph and a category chart on the same tab would show
the same idea twice at two different granularities.
**Migration**: None. The `SkillGraph` feature component, its hooks and its `/career/skills` +
`/career/me/skills` backend are untouched — only the profile stops mounting it. The subject workspace
Career tab keeps rendering the subject-scoped graph (see `skill-graph-view`).
