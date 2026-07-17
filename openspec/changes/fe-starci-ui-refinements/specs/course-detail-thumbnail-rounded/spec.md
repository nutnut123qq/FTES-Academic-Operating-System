# course-detail-thumbnail-rounded

## ADDED Requirements

### Requirement: Course detail thumbnail is rounded and clipped
The course thumbnail/cover image on the course detail page SHALL use the house rounded-corner
token (`rounded-2xl` / `rounded-3xl`) together with `overflow-hidden`, so the image corners are
visibly rounded and content never bleeds past the radius.

Nơi sửa: `src/components/features/course/CourseDetail/index.tsx` — `CardCover` (~L747, hiện
`rounded-large`; đồng bộ về token bo tròn nhà `rounded-2xl`/`rounded-3xl`) và mọi thumbnail hero
khoá khác nếu có.

#### Scenario: Cover image renders with rounded corners
- **WHEN** the course detail page renders the cover thumbnail
- **THEN** the image is wrapped with a rounded-corner container (`rounded-2xl`/`rounded-3xl`)
  and `overflow-hidden`
- **AND** the image is clipped to the rounded shape with no square-corner bleed
