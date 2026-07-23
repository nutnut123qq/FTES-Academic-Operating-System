# Design — learn-engagement-wire

3-tier chuẩn. Mọi endpoint dưới đây prefix `/api/v1` (client sẵn có unwrap envelope
`{code, message, data|null}`).

## 1. REST layer (`modules/api/rest/course`)

```ts
/** GET/PUT/DELETE /courses/lessons/{lessonId}/reactions — BE change course-lesson-reaction. */
export interface LessonReactionSummaryView {
    lessonId: string
    viewCount: number
    likeCount: number
    myReaction: "LIKE" | null
}
export const getLessonReactions = (lessonId: string) => ...   // GET  .../reactions
export const putLessonReaction = (lessonId: string, reaction: "LIKE") => ... // PUT .../reactions/{reaction}
export const deleteLessonReaction = (lessonId: string, reaction: "LIKE") => ... // DELETE

/** GET /courses/{courseId}/me/access — BE change course-learn-contract-gaps. */
export interface CourseAccessStateView {
    courseId: string
    enrolled: boolean
    purchased: boolean
    fullAccess: boolean
}
export const getMyCourseAccess = (courseId: string) => ...
```

- `EnrollmentView` (types.ts) thêm `isPurchased: boolean` (BE trả từ giờ; default false khi
  thiếu để backward-safe).

## 2. Lesson reaction wire (`LessonReactionFooter` trong `LessonReader/index.tsx`)

- Hook mới `useGetLessonReactionsSwr(lessonId)` key `["lesson-reactions", lessonId]`.
- Toggle like: optimistic update qua SWR `mutate` (đổi `myReaction`/`likeCount` local) →
  `putLessonReaction`/`deleteLessonReaction` → revalidate; lỗi → rollback.
- Shape hiển thị giữ nguyên footer hiện tại (`ReactionSummary`): map
  `{counts:[{type: Like, count: likeCount}], total, myReaction, viewCount}` — đổi 1 nguồn
  dữ liệu, KHÔNG đổi UI. Xóa `useLessonReactionMock.ts`.
- 403 (PREVIEW không like được): disable nút like + tooltip "Đăng ký khóa để tương tác"
  (luật premium-unlock = enroll).

## 3. Watch-position reporter

- Hook mới `useWatchPositionReporter({lessonId, getPositionSeconds, isPlaying, durationSeconds})`
  đặt cạnh player trong LessonReader (chỉ lesson VIDEO):
  - `setInterval` 30s khi `isPlaying`: gọi `usePostReportLessonProgressSwr` với
    `{watchedSeconds: Math.floor(position), videoDurationSeconds: duration}`.
  - Flush thêm khi: pause, seek lớn (>5s), unmount/route change (cleanup), `visibilitychange`
    ẩn tab. Throttle: không bắn 2 request < 5s.
  - KHÔNG đụng logic complete hiện có (FE tự complete ở 50%; BE auto-complete ≥90% từ
    report — 2 đường cùng tồn tại, BE idempotent).
- Với PREVIEW: BE clamp watchedSeconds theo preview window — FE cứ report bình thường.

## 4. CourseQa roll-up từ lesson comments

- Giữ nguyên UI `CourseQa/` (QuestionRow, filter, search) + `types.ts` hiện có; thay
  `mock.ts` bằng adapter thật trong `useQueryCourseQuestionsSwr`:
  1. Nguồn cây bài: hook learn course sẵn có (`useQueryLearnCourseSwr`) → danh sách
     `{lessonId, lessonTitle}` của course.
  2. Fan-out `getLessonComments(lessonId, page=1, size=20)` **giới hạn đồng thời** (chunk 5
     request, `Promise.all` từng chunk) — course demo 6 lesson/khóa là 2 chunk; cache SWR
     key `["COURSE_QUESTIONS", courseId, ...]` TTL mặc định.
  3. Map `CommentView` → `CourseQuestion` types hiện có: comment gốc = question, `replies`
     = answers, `lessonTitle` + href về
     `/courses/{courseId}/learn/content/modules/{moduleId}/contents/{lessonId}` (moduleId
     lấy từ cây learn course).
  4. Filter/search/page chạy client-side trên tập roll-up (như mock đang làm) — chấp nhận
     cho quy mô lesson/khóa hiện tại; ghi chú nâng cấp BE aggregate nếu course > 50 lesson.
- Composer đặt câu hỏi: yêu cầu chọn lesson (dropdown các bài đã mở) → `postLessonComment`
  (hook `usePostLessonCommentSwr` sẵn có) → mutate roll-up key.
- Xóa `CourseQa/mock.ts`.

## 5. isPurchased thật (`useQueryCourseDetailSwr`)

- Enrollments fetch sẵn có: đọc `e.isPurchased` mới thay vì hardcode `false` (xóa comment
  "BE carries no paid flag").
- Bổ sung nguồn 2 (course PACKAGE mua không tạo enrollment): khi có token và không tìm thấy
  enrollment khớp slug, gọi `getMyCourseAccess(course.rawId)` (SWR key
  `["course-me-access", courseId]`, auth-gated) → `isPurchased = access.purchased`,
  `isEnrolled = isEnrolled || access.enrolled`.
- `useCourseEnrollment` giữ signature (đã nhận `isPurchased?`).

## 6. i18n

`learn.reactions.{likeGated}`, `learn.qa.{askOnLesson,pickLesson,goToLesson}` (vi+en) —
key khác tái dùng.

## 7. Dependency & thứ tự

1. BE `course-lesson-reaction` (V212) + `course-learn-contract-gaps` + seed
   `course-demo-seed-dev` deploy apitest trước.
2. Q&A roll-up KHÔNG cần BE mới (V177 đã LIVE) — làm được ngay.
3. Watch-position dùng endpoint LIVE sẵn — làm được ngay.
