# legacy-course-routes-removal Specification

## Purpose
TBD - created by archiving change learn-exercises-wire. Update Purpose after archive.
## Requirements
### Requirement: Legacy course routes redirect into learn shell
3 route legacy `/courses/[courseId]/lessons/[lessonId]`, `/courses/[courseId]/quiz`, `/courses/[courseId]/assignments` SHALL không còn mount component mock; mỗi route thay bằng redirect về `/courses/[courseId]/learn/content` để deep-link cũ không 404.

#### Scenario: Link cũ vẫn sống
- **WHEN** user mở `/courses/abc/quiz` từ bookmark cũ
- **THEN** browser được chuyển tới `/courses/abc/learn/content`

### Requirement: Mock components and hooks are deleted
`CourseLesson/`, `CourseQuiz/`, `CourseAssignments/` cùng `useQueryQuizSwr.ts`, `useQueryAssignmentsSwr.ts`, `useQueryLessonSwr.ts` SHALL bị xóa khỏi codebase; build SHALL không còn import nào tới chúng.

#### Scenario: Không còn dead mock
- **WHEN** chạy `tsc --noEmit` + `npm run build` sau khi xóa
- **THEN** compile sạch, grep `useQueryQuizSwr|CourseQuiz|CourseAssignments|useQueryLessonSwr` (ngoài git history) trả 0 kết quả

