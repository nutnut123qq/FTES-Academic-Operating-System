# design — course-learn-player

Page: `/courses/[courseId]/lessons/[lessonId]` → `features/course/CourseLesson`.
Where a learner works through an enrolled course. Distinct from the subject-workspace
learning tab.

## Decision (2026-07-02) — curriculum rail + cinema content (Coursera/Udemy player)
Approved from the mockup. Archetype = **course-learn two-column**: a full-width top
progress bar, then `lg:grid-cols-[320px_1fr]` — left rail
`lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)]` (own scroll), right content scrolls.

**Rail = the shared `OutlineRail` block** (not a bespoke sidebar): it already bakes the
progress header + client-side search + accordion of `ContentMapRow`s with
read/active/locked/premium markers. The feature maps the outline → groups/items and
owns the controlled state (search value, expanded chapter set, session mark-complete
overlay). Auto-opens the chapter holding the active lesson.

**Content area:** video placeholder → lesson title → `ExtendedTabs` (Bài giảng /
Tài liệu / Ghi chú, panels switched by local key) → end-of-chapter challenge callout
(accent-tint banner → quiz) → footer (prev / mark-complete / next).

**Why:** the rail is the learner's map (where am I, what's done, what's next); the
content is the focus. Reusing `OutlineRail` keeps the course player and the
personal-project milestone rail visually identical.

**Rules honored:** premium lessons show a lock in the rail, unlock by enrolling
(`premium-unlock-is-enroll-not-vip`); tabs are the underline (secondary) variant.

**ponytail:** video placeholder; mark-complete is a session-only overlay Set (no BE);
download + notes are placeholders. Mock via `useQueryLessonSwr` (returns lesson +
outline + progress + course label + challenge).

## Backend business
FE-only, no BE. Completion/progress/challenge are mocked; `useQueryLessonSwr` is
SWR-shaped for a drop-in `lesson(id)` + `courseOutline(courseId)` swap.
