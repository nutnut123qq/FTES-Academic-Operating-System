# lesson-title-hierarchy

## ADDED Requirements

### Requirement: Section title outranks its part label in the course outline
In the course detail syllabus outline, each section/buổi header SHALL render the section
**title as the prominent element** (`font-semibold`, a larger type size than the part label,
`foreground` color) with the **"Phần N" label as a small eyebrow above it** (`text-xs`, muted
color). The section description SHALL sit **below the title**. This inverts the current
hierarchy where the part label reads larger than the title.

Nơi sửa: `src/components/features/course/CourseDetail/index.tsx` — syllabus section header
(~L442–473): thêm eyebrow "Phần {index+1}" trên; nâng `section.title` từ
`body-sm weight="medium"` → nổi bật (`body`/`body-lg` `weight="semibold"` foreground);
description dưới tiêu đề. i18n `courseSystem.detail.partLabel`.

#### Scenario: Section header shows eyebrow above a prominent title
- **WHEN** the course detail syllabus renders a section
- **THEN** a small muted "Phần N" eyebrow appears above the section title
- **AND** the title is rendered semibold, larger than the eyebrow, in the foreground color
- **AND** the description appears below the title

#### Scenario: Title is visually dominant over the part label
- **WHEN** a viewer scans the outline
- **THEN** the section title reads as the dominant text and "Phần N" reads as a secondary label

### Requirement: Learn shell outline follows the same hierarchy
Where the learn shell content map uses the same section/module pattern, its module rows SHALL
apply the same hierarchy: a small muted "Phần N" eyebrow (when a part index is available) above
a prominent semibold module title, with the description below — keeping any existing progress
chip.

Nơi sửa: `src/components/features/learn/ContentMap/index.tsx` (accordion trigger — module title
đã `body-sm semibold`; thêm eyebrow "Phần N" nếu có index, giữ chip tiến độ).

#### Scenario: Content map module keeps title dominance
- **WHEN** the learn content map renders a module accordion row
- **THEN** the module title is the prominent element with an optional small "Phần N" eyebrow
  above it and the description below
