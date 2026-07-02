## Why
The lesson view (§4) was a standalone page (video placeholder + docs + prev/next) —
no sense of where you are in the course, no completion, no path to the challenge.
Rebuild it as a learn PLAYER (the approved mockup): a curriculum rail beside a
cinema content area, the Coursera/Udemy pattern.

## What Changes
- Rebuild `CourseLesson` as a two-column player: left `OutlineRail` (chapters →
  lessons with completion + the active lesson highlighted + search + progress
  header) + right content area (video, tabs Bài giảng/Tài liệu/Ghi chú,
  mark-complete, prev/next, end-of-chapter challenge callout) + a top progress bar.
- Extend the mock `useQueryLessonSwr` to return the lesson + the full course
  outline + progress + course label + per-chapter challenge.
- i18n `courseSystem.player.*` (vi/en). AsyncContent on both regions.

## Capabilities
### New Capabilities
- (none)
### Modified Capabilities
- `course-lesson`: upgraded from a standalone lesson page to the learn player.

## Impact
FE only. No BE — mock hook; mark-complete is a session overlay; download/challenge
CTAs are no-ops. Build stays green.
