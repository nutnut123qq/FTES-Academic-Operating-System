## Why

The "What you'll learn" section on the course detail page (`/courses/[courseId]`) currently renders as a plain two-column grid of checkmarks under a text heading. Starci's course landing uses a clearer section pattern: a titled, icon-led `LabeledCard` frameless header plus a concise check-list body, and the section hides itself entirely when there is nothing to show. Porting that structural pattern to FTES Academic Operating System makes the benefit list scannable and consistent with the rest of the detail page without changing the FTES color system.

## What Changes

- Restructure the `whatYouLearn` block in `CourseDetail` to match the Starci reference:
  - Keep the existing `Typography type="h6" weight="bold"` section header so it stays consistent with the syllabus/reviews/instructor sections.
  - Render items as a **responsive 2-column grid** (`grid-cols-1 md:grid-cols-2`) of outline check-circle icons + one-line labels.
- Use existing FTES tokens only:
  - `CheckCircleIcon` from `@phosphor-icons/react`.
  - `text-accent` for icons; `body-sm` muted text for labels.
- Self-hide the whole section when `course.whatYouLearn` is empty — no empty card, no standalone heading.
- Update the `CourseDetailSkeleton` so the loading state mirrors the new section layout (section heading + 2-column grid of placeholder rows).
- Keep the existing `whatYouLearn` data contract untouched.

## Capabilities

### New Capabilities

_None — this is a presentational refinement inside the existing `course-detail` capability._

### Modified Capabilities

- `course-detail`: update the "what you'll learn" section layout to a Starci-style icon-led labeled grid with self-empty behavior.

## Impact

- Affected file: `src/components/features/course/CourseDetail/index.tsx`.
- No translation, API, route, or dependency changes.
