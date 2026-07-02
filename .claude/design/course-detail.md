# design — course-detail (course sales page)

Page: `/courses/[courseId]` → `features/course/CourseDetail`. Course = a course you
**buy → enroll → learn** (distinct from Subject Workspace, which is a community hub).

## Decision (2026-07-02) — direction A: two-column sales layout (Coursera pattern)
Chosen with the teacher over a single-column variant B. Archetype = **detail
two-column**: `grid md:grid-cols-5`, left `col-span-3` scrolling content, right
`col-span-2` **sticky** enroll card (`md:sticky md:top-20`).

**Section order (left):** breadcrumb → hero (code·name, level+credits chips, ★rating
+ learner count, description, instructor line) → "Bạn sẽ học được gì" (2-col checklist,
accent checks) → "Nội dung khóa học" (meta `N chương · M bài · duration` + syllabus)
→ "Đánh giá học viên" (review rows: initials avatar + stars + text) → instructor block.

**Enroll card (right):** cover 16:9 → price (`PriceTag` VND, size lg, struck original)
+ muted USD reference → primary CTA "Đăng ký học" → secondary "Học thử miễn phí" →
"Khóa học gồm" list (video duration, lessons, end-of-chapter challenge, certificate).

**Why:** a sales page must let the learner read the pitch on the left while price +
CTA + "what's included" stay in view on the right — the Coursera/Udemy convention.

**Rules honored:** CTA = ENROLL, never buy/VIP (`premium-unlock-is-enroll-not-vip`);
price VND-primary + USD-muted (design baseline); premium lessons in the syllabus show a
lock + "Premium" chip (unlock by enrolling).

**ponytail:** enroll/try CTAs are no-ops (no BE); syllabus is a hand-rolled
expandable (first chapter open) — swap to HeroUI Accordion once its v3 API is
confirmed in this stripped repo. Mock via `useQueryCourseDetailSwr`.

## Backend business
FE-only repo, no BE. All data is mocked in `useQueryCourseDetailSwr` (SWR-shaped for a
drop-in `course(id)` GraphQL swap). No enrollment/payment persistence yet.
