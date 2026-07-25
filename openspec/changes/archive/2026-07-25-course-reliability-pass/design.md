# Design — course-reliability-pass

## 0. Cách chạy pass

- Môi trường: FE `npm run dev` (turbopack) trỏ BE thật `https://apitest.ftes.vn/api/v1`
  (login native `/auth/login`, account test 4 role: student/lecturer/staff/admin — luồng
  learner dùng STUDENT). Seed: `course-demo-seed-dev` (V213/V215 — course demo, quiz
  `seed-les-c1-s1-l2`, challenge bank, packages).
- Thứ tự chạy: theo đúng thứ tự requirement trong
  `specs/course-reliability-verify/spec.md` (mô phỏng journey learner: khám phá → mua →
  học → luyện tập → cộng đồng khóa) rồi sang `specs/lesson-ai-fab/spec.md`.
- Kết quả mỗi mục ghi 1 dòng vào bảng PASS/FAIL trong tasks (đánh dấu checkbox). FAIL →
  fix ngay tại file trỏ sẵn ở cột "nơi sửa" (mapping §1 dưới); fail do BE thiếu contract →
  ghi spec-backlog (`openspec/changes/` mới), KHÔNG mock lại.
- Regress do merge conflict resolution: đối chiếu spec gốc của change nguồn (cột "change
  nguồn" §1) — hành vi chuẩn là hành vi spec gốc mô tả, không phải hành vi main hiện tại.

## 1. Bản đồ tính năng → file/endpoint (nơi sửa khi fail)

| # | Tính năng | File FE chính | Endpoint/hook | Change nguồn |
|---|-----------|---------------|---------------|--------------|
| 1 | Catalog + category filter | `src/app/[locale]/courses/page.tsx`, `src/components/features/course/CourseCatalog/index.tsx`, `src/components/features/course/browse/{CategoryChipBar,CategoryShelf,FacetSortBar,CatalogCourseCard}/`, `src/app/[locale]/courses/category/` | `GET /courses` (`course/hooks/`) | rest-fetch-course |
| 2 | Course detail | `src/components/features/course/CourseDetail/index.tsx`, `CourseDetail/CourseRatings/`, `course/hooks/useQueryCourseDetailSwr.ts`, `course/hooks/useCourseEnrollment.ts` | `GET /courses/{id}`, `GET /courses/{id}/ratings`, `GET /courses/{id}/me/access` (`useGetMyCourseAccessSwr`) | course-engagement-fe, learn-engagement-wire (`course-purchase-flag-fe`) |
| 3 | Enroll free + mua package | `src/components/features/course/PackageGateModal/index.tsx`, `src/components/features/cart/CartShell/index.tsx`, `src/app/[locale]/cart/page.tsx`, `src/components/modals/PaymentModal/index.tsx`, `src/modules/payment/submit-checkout.ts` | `useGetCoursePackageProductSwr`, `usePostAddCartItemSwr`, `useGetCartSwr`, `usePostCheckoutSwr`, `modules/api/rest/commerce/` | course-try-for-free, commerce-checkout-flows, fix-course-purchase-product-resolve |
| 4 | Learn shell + outline lock | `src/app/[locale]/courses/[courseId]/learn/layout.tsx`, `src/components/features/learn/ContentMap/index.tsx`, `LearnShell/` | `query-my-course-outline` / lesson payload `isLocked`/`accessLevel` | learn-reader-and-enroll-ux |
| 5 | Video stream | `src/components/features/learn/LessonReader/{LessonVideoBlock,LessonHlsPlayer,LessonYouTubePlayer}.tsx` | stream/videoRef từ lesson payload (`learn/hooks/useQueryLearnLessonSwr.ts`) | learn-reader-and-enroll-ux |
| 6 | Document teaser | `src/components/features/learn/DocumentReader/index.tsx`, `LessonReader/index.tsx` (nhánh `contentType === "DOCUMENT"`) | teaser cắt server-side trong lesson payload (`teaser`, `accessLevel: PREVIEW`) | course-try-for-free |
| 7 | Auto mark-complete | `LessonReader/index.tsx` — `LessonCompletion` (video: `handleHalfWatched`→`fireRef`; document: cleanup on-exit + `beforeunload`, dwell > 800ms) | `usePostMarkLessonCompleteSwr`, revalidate key `GET_COURSE_PROGRESS` | lesson-reader-states-progress (archive) |
| 8 | Watch-position report | hook `useWatchPositionReporter` (theo learn-engagement-wire) gắn trong `LessonVideoBlock` | `usePostReportLessonProgressSwr` → `PUT /courses/lessons/{id}/progress` (30s + pause/seek/unmount) | learn-engagement-wire (`watch-position-report`) |
| 9 | Like/view thật | `LessonReader/index.tsx` — `LessonReactionFooter` (dòng ~446; **main hiện còn trỏ `useLessonReactionMock.ts` — mock phải bị gỡ**) | `useGetLessonReactionsSwr`, `usePutLessonReactionSwr`, `useDeleteLessonReactionSwr` → `GET/PUT/DELETE /courses/lessons/{id}/reactions` | learn-engagement-wire (`lesson-reaction-wire`) |
| 10 | Quiz làm + nộp | block quiz trong `LessonReader` (theo learn-exercises-wire) | `useGetLessonQuizzesSwr`, `usePostStartQuizAttemptSwr`, `usePostSubmitQuizAttemptSwr`, `useGetMyQuizAttemptsSwr` | learn-exercises-wire (`learn-quiz-taking`) |
| 11 | Assignment nộp GitHub | block assignment trong `LessonReader` | `getLessonAssignments`, `usePostSubmitAssignmentSwr`, `getMyAssignmentSubmissions` | learn-exercises-wire (`learn-assignment-submission`) |
| 12 | Challenge 3 loại | `src/components/features/learn/ChallengeSubmission/{index.tsx,SubmissionRow/}`, `src/modules/api/rest/challenges/` | `getChallengeBySlug`, `usePostSubmitChallengeSwr` (answers/code/essayText), `getMyChallengeSubmissions`, `getChallengeSubmissionResults` | learn-exercises-wire (`learn-challenge-submission`) |
| 13 | Q&A roll-up | `src/components/features/learn/CourseQa/{index.tsx,useQueryCourseQuestionsSwr.ts}` (**`mock.ts` phải bị gỡ**), route `learn/qa` | roll-up từ `getLessonComments` các lesson trong course | learn-engagement-wire (`course-qa-rollup`) |
| 14 | Leaderboard | `src/components/features/learn/Leaderboard/{index.tsx,LeaderboardCategoryRail,LeaderboardPodium,LeaderboardTable}/`, route `learn/leaderboard` | hook leaderboard trong `learn/hooks/` | learn-reader-and-enroll-ux |
| 15 | Mindmap | `src/components/features/learn/MindMap/index.tsx`, route `learn/mind-map` (full-bleed theo `learn/layout.tsx`) | outline course | learn-reader-and-enroll-ux |
| 16 | Banner featured | `src/components/features/course/CourseCatalog/FeaturedSlider/`, `course/hooks/useQueryFeaturedCoursesSwr.ts` | `useGetAdminPublicBannersSwr` / featured courses | rest-fetch-course |
| 17 | My-courses Home + popup menu | `src/components/features/home-landing/HomeLanding/sections/MyCoursesSection.tsx`, `src/components/features/navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.tsx`, `src/components/features/course/MyCourses/index.tsx`, `src/app/[locale]/courses/me/page.tsx` | `useQueryMyCoursesSwr` (GraphQL read-gateway `query-my-courses`) | home lane |
| 18 | Search inline | `src/components/features/search/{SearchOverlay/,SearchResults/,hooks/useGlobalSearch.ts}`, `src/components/layouts/shell/Navbar/SearchButton/index.tsx` | search API (`rest-fetch-search`) | rest-fetch-search |

## 2. lesson-ai-fab — hiện trạng code + điểm verify

`src/components/features/learn/ContentAiFab/index.tsx` (đã có, mount 1 lần ở
`src/app/[locale]/courses/[courseId]/learn/layout.tsx` cạnh `ContentAiSelectionAsk`):

- **Điều kiện hiện**: `useParams().contentId` — FAB render trên MỌI route
  `learn/content/modules/[moduleId]/contents/[contentId]/**` (kể cả sub-route challenge),
  tự ẩn ở dashboard/leaderboard/mind-map (không có `contentId`). → Verify: mọi LOẠI lesson
  đi qua route `contents/[contentId]` (VIDEO / DOCUMENT / SLIDE / link-only / video-only /
  locked) đều phải thấy FAB; loại nào render qua route khác mà vẫn là "buổi học" thì FAB
  thiếu → fix ở `learn/layout.tsx` (điều kiện mount) hoặc `ContentAiFab` (điều kiện
  `contentId`).
- **Desktop**: `Popover` — nút `fixed right-4 z-40`, kéo DỌC (pointer events, threshold
  6px, guard `MIN_BOTTOM=16`/`TOP_GUARD=80`), vị trí persist localStorage key
  `contentAiFabBottom`, drag-release không được mở popover (swallow trong `onOpenChange`
  qua `draggingRef`). Panel = `PopoverContent placement="left bottom"` 380px chứa
  `ContentAiChat`.
- **Mobile (<sm, `useSmViewpoint`)**: `FloatingActionButton` mở `Drawer` bottom-sheet
  80vh chứa `ContentAiChat`. (Mobile không kéo-thả — FloatingActionButton cố định; spec
  chỉ yêu cầu kéo-thả ở desktop, mobile giữ nguyên.)
- **Cộng sinh với panel neo** (`ContentAiAnchoredChat` — change `lesson-ai-chat-fixes`):
  FAB góc = luồng thường (mở tay, không selection); panel neo = luồng bôi đen trong
  `#lesson-article`. Cả 2 render chung `ContentAiChat`, cả 2 mount ở `learn/layout.tsx`.
  Verify: mở panel neo KHÔNG ẩn/di chuyển FAB; đóng panel neo xong FAB vẫn mở được;
  z-index: FAB z-40 < nút selection z-45 < panel neo z-50 (không đè nhau sai tầng).
- **Store**: open-state qua `useContentAiChatOverlayState` (overlay store key
  `contentAiChat`) — không reset intent lúc mount (bẫy đã ghi trong draft rule
  `ai-selection-anchored-ask-passage`).

Fix dự kiến nếu lệch (chỉ áp khi verify fail):

- Lesson SLIDE/loại mới không thấy FAB → kiểm tra route thật của loại đó; nếu vẫn là
  `contents/[contentId]` thì lỗi ở điều kiện render con (vd component che `z-40+`),
  nếu route khác → thêm mount/điều kiện ở `learn/layout.tsx`.
- Kéo-thả mất persist → key `contentAiFabBottom` + `onPointerUp` (chỉ save khi
  `draggingRef` true — kéo xong không click vẫn phải save).
- FAB đè lên pager/composer ở viewport thấp → guard `TOP_GUARD`/`MIN_BOTTOM` +
  clamp lại theo `window.innerHeight` khi resize (hiện chỉ clamp lúc kéo — nếu fail thêm
  effect resize).

## 3. Nguyên tắc fix trong pass

- Fix = đưa hành vi VỀ ĐÚNG spec gốc của change nguồn (cột cuối bảng §1) — không thiết kế
  lại. Đổi hướng thiết kế → mở change mới.
- Mock còn sót (`useLessonReactionMock.ts`, `CourseQa/mock.ts`, href `-c` mock…) sau khi
  lane tương ứng đã merge = FAIL mặc định của mục đó (dù UI "trông chạy") — gỡ mock theo
  spec change nguồn.
- Mỗi fix phải giữ `npm run build` (webpack) xanh + `tsc --noEmit` sạch; fix chạm UI thì
  tra rule nhà (elements/concepts) trước, không tự chế primitive.
- BE thiếu/lệch contract: KHÔNG vá tạm bằng mock — ghi spec-backlog trỏ endpoint + payload
  kỳ vọng (theo pattern 5 spec-backlog của lane Community/Workspace).

## 4. Seed data

FE không có DB. Toàn bộ kịch bản chạy trên seed BE `course-demo-seed-dev` đã có tại
apitest: course demo có đủ section/lesson VIDEO + DOCUMENT (teaser PREVIEW), quiz PUBLISHED
3 câu gắn `seed-les-c1-s1-l2`, assignment + challenge 3 loại (MCQ/CODE/ESSAY — V215
challenge bank), packages mua được, banner featured. Account: bộ test 4 role sẵn có
(student cho journey learner, 1 account student MỚI chưa enroll cho kịch bản
free-enroll/paywall). Không cần fixture FE mới.
