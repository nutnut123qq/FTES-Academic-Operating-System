# course-reliability-verify

Checklist verify E2E toàn tính năng module Course sau khi 5 lane merge main. Mỗi
requirement = 1 nhóm tính năng; scenario = kịch bản thao tác cụ thể + kỳ vọng. Mục nào
fail → sửa tại "Nơi sửa nếu fail" ghi trong requirement (bản đồ đầy đủ ở `design.md` §1).
Môi trường: `npm run dev` + BE `apitest.ftes.vn`, seed `course-demo-seed-dev`, account
test STUDENT (kèm 1 student mới chưa enroll cho kịch bản paywall).

## ADDED Requirements

### Requirement: Catalog và category filter hoạt động với dữ liệu thật

Trang `/courses` SHALL render danh sách khóa từ `GET /courses` (không mock), lọc được theo
category (chip bar + trang `/courses/category/...`) và sort/facet không vỡ phân trang.
Nơi sửa nếu fail: `src/components/features/course/CourseCatalog/index.tsx`,
`src/components/features/course/browse/{CategoryChipBar,CategoryShelf,FacetSortBar,CatalogCourseCard}/`,
`src/app/[locale]/courses/{page.tsx,category/}`.

#### Scenario: Duyệt catalog và lọc category

- **WHEN** learner mở `/courses`, chờ load xong, bấm 1 chip category rồi đổi sort
- **THEN** grid chỉ còn khóa thuộc category đó, sort áp dụng đúng, skeleton không kẹt,
  card khóa hiện đủ thumbnail/giá/rating count thật (không số bịa)

#### Scenario: Category rỗng

- **WHEN** chọn category không có khóa nào
- **THEN** hiện empty state (không crash, không skeleton vô hạn)

### Requirement: Course detail hiển thị isPurchased, instructor và rating thật

Trang chi tiết khóa SHALL map `isPurchased` thật từ enrollments/me-access (không còn
hardcode `false`), hiển thị instructor và khối rating thật (aggregate + list + composer
sao có edit/delete) từ `course-engagement-fe`. Nơi sửa nếu fail:
`src/components/features/course/CourseDetail/{index.tsx,CourseRatings/}`,
`src/components/features/course/hooks/{useQueryCourseDetailSwr.ts,useCourseEnrollment.ts}`.

#### Scenario: Học viên đã mua xem detail

- **WHEN** student ĐÃ mua khóa mở trang detail khóa đó
- **THEN** CTA là "Vào học" (không phải mua lại), `isPurchased` phản ánh đúng, tên
  instructor + rating aggregate hiện từ API

#### Scenario: Đánh giá khóa

- **WHEN** student đã học chấm 4 sao + viết nhận xét, rồi sửa thành 5 sao, rồi xóa
- **THEN** list rating cập nhật ngay sau mỗi thao tác (optimistic/mutate), aggregate đổi
  theo, reload trang giữ đúng trạng thái cuối

### Requirement: Enroll free và mua package trọn vòng tiền

Luồng mua SHALL chạy trọn: lesson khóa → `PackageGateModal` (resolve đúng product theo
`fix-course-purchase-product-resolve`) → thêm giỏ → `/cart` → checkout → thanh toán →
quay lại lesson thấy nội dung MỞ KHÓA (mutate lesson + entitlement). Enroll free SHALL
mở được nội dung free ngay không qua cart. Nơi sửa nếu fail:
`src/components/features/course/PackageGateModal/index.tsx`,
`src/components/features/cart/CartShell/index.tsx`, `src/app/[locale]/cart/page.tsx`,
`src/components/modals/PaymentModal/index.tsx`, `src/modules/payment/submit-checkout.ts`,
hooks `useGetCoursePackageProductSwr`/`usePostAddCartItemSwr`/`usePostCheckoutSwr`.

#### Scenario: Enroll free

- **WHEN** student mới (chưa enroll) mở khóa demo và bấm đăng ký free
- **THEN** enrollment tạo được, bài free đọc/xem ngay, bài premium vẫn khóa

#### Scenario: Mua package từ paywall lesson

- **WHEN** student free mở lesson premium → bấm CTA ở paywall → PackageGateModal → chọn
  package → thêm giỏ → sang `/cart` → checkout → hoàn tất thanh toán (sandbox)
- **THEN** modal hiện đúng package + giá thật của khóa (không lỗi resolve product), cart
  có đúng item, checkout không lỗi, quay lại lesson thấy body đầy đủ không cần F5 tay
  (hoặc sau 1 lần mutate tự động)

#### Scenario: Hủy giữa chừng

- **WHEN** student đóng PackageGateModal hoặc rời cart không thanh toán
- **THEN** không có enrollment/entitlement nào tạo ra, lesson vẫn khóa, giỏ giữ item

### Requirement: Learn shell khóa outline đúng entitlement, video stream và document teaser

Learn shell SHALL: (a) `ContentMap` đánh dấu khóa/mở từng lesson đúng entitlement
(free/PREVIEW/premium-đã-mua); (b) lesson VIDEO stream phát được (HLS/YouTube theo
`videoRef`); (c) lesson DOCUMENT chưa mua hiện teaser cắt server-side + fade + paywall
(không leak full body trong DOM/response). Nơi sửa nếu fail:
`src/components/features/learn/ContentMap/index.tsx`,
`src/components/features/learn/LessonReader/{LessonVideoBlock,LessonHlsPlayer,LessonYouTubePlayer}.tsx`,
`src/components/features/learn/DocumentReader/index.tsx`,
`src/app/[locale]/courses/[courseId]/learn/layout.tsx`.

#### Scenario: Outline lock theo entitlement

- **WHEN** student free mở learn shell của khóa có bài free + PREVIEW + premium
- **THEN** rail trái hiện đúng icon khóa cho premium, PREVIEW vào được (teaser), free vào
  được full; sau khi mua → mọi khóa biến mất (mutate outline)

#### Scenario: Video phát và seek

- **WHEN** mở lesson VIDEO đã có quyền, phát 10s, seek tới giữa, phát tiếp
- **THEN** player phát không lỗi, seek mượt, không request lặp vô hạn (kiểm Network)

#### Scenario: Document teaser không leak

- **WHEN** student free mở lesson DOCUMENT premium (accessLevel PREVIEW) và xem
  response API trong DevTools
- **THEN** body trong response CHỈ là teaser (server cắt), UI hiện fade + paywall +
  giá package rẻ nhất, `#lesson-article` có `select-none`

### Requirement: Auto mark-complete theo loại lesson

Lesson SHALL tự đánh dấu hoàn thành KHÔNG cần nút tay: VIDEO khi xem ≥50%
(`onHalfWatched` → `fireRef`), DOCUMENT khi rời bài (unmount/`beforeunload`, dwell >
800ms); idempotent — bài đã complete không bắn lại; progress rail (n/m + meter) cập nhật
qua mutate `GET_COURSE_PROGRESS`. Nơi sửa nếu fail: `LessonCompletion` trong
`src/components/features/learn/LessonReader/index.tsx`, hook
`usePostMarkLessonCompleteSwr`.

#### Scenario: Video 50 phần trăm

- **WHEN** student xem video tới quá nửa thời lượng (tua cũng tính theo logic player)
- **THEN** badge "Đã hoàn thành" hiện, counter tiến độ ở rail tăng 1, Network chỉ có ĐÚNG
  1 request mark-complete

#### Scenario: Document rời bài

- **WHEN** student đọc lesson DOCUMENT hơn 1 giây rồi bấm "Bài tiếp theo"
- **THEN** bài vừa rời được đánh complete (thấy ở rail khi quay lại), lướt-qua-dưới-800ms
  thì KHÔNG complete

#### Scenario: Reload bài đã hoàn thành

- **WHEN** F5 một lesson đã complete rồi rời bài
- **THEN** không request mark-complete nào bắn thêm (guard seeded từ `isCompleted`)

### Requirement: Watch-position được report định kỳ

Trong lúc xem video, FE SHALL gọi `PUT /courses/lessons/{id}/progress`
(`usePostReportLessonProgressSwr` qua reporter `useWatchPositionReporter`) mỗi ~30s và
khi pause/seek/unmount — logic complete 50% hiện có KHÔNG đổi. Nơi sửa nếu fail: reporter
gắn trong `src/components/features/learn/LessonReader/LessonVideoBlock.tsx` (theo change
`learn-engagement-wire`).

#### Scenario: Report trong lúc xem

- **WHEN** student xem video 90 giây liên tục rồi pause
- **THEN** Network có ≥3 request progress (2 tick 30s + 1 pause) mang position tăng dần

#### Scenario: Resume vị trí

- **WHEN** student thoát giữa video rồi mở lại lesson
- **THEN** player resume gần đúng vị trí đã report (nếu BE trả position — thiếu thì ghi
  backlog, không mock)

### Requirement: Like và view lesson dùng API thật

`LessonReactionFooter` SHALL dùng REST reactions thật (`GET/PUT/DELETE
/courses/lessons/{id}/reactions`) — file `useLessonReactionMock.ts` không còn được import
(main hiện còn trỏ mock: đây là điểm NGHI REGRESS phải soi đầu tiên). Nơi sửa nếu fail:
`src/components/features/learn/LessonReader/index.tsx` (`LessonReactionFooter`, dòng
~446) + gỡ `useLessonReactionMock.ts` theo change `learn-engagement-wire`.

#### Scenario: Toggle like

- **WHEN** student bấm like 1 lesson, F5, rồi bỏ like
- **THEN** trạng thái like + count giữ đúng qua reload (server-persisted, không phải
  localStorage), bỏ like giảm count ngay (optimistic)

#### Scenario: View count thật

- **WHEN** mở lesson bằng 2 account khác nhau
- **THEN** view count lấy từ BE (không phải số hash từ contentId)

### Requirement: Quiz làm và nộp trọn vòng

Lesson có quiz SHALL hiện block quiz (theo `hasQuiz` payload), start attempt → làm bài có
đếm giờ → submit → điểm % + đạt/không đạt + lịch sử attempt — toàn bộ qua hook thật
(`useGetLessonQuizzesSwr`, `usePostStartQuizAttemptSwr`, `usePostSubmitQuizAttemptSwr`,
`useGetMyQuizAttemptsSwr`), không còn đường tới mock `useQueryQuizSwr`. Nơi sửa nếu fail:
block quiz trong `src/components/features/learn/LessonReader/` theo change
`learn-exercises-wire` (spec `learn-quiz-taking`).

#### Scenario: Làm quiz seed

- **WHEN** student mở lesson `seed-les-c1-s1-l2`, bấm làm quiz, trả lời 3 câu, submit
- **THEN** kết quả hiện điểm % + trạng thái đạt, lịch sử có attempt vừa nộp, làm lại lần 2
  ra attempt mới

#### Scenario: Chưa enroll bị chặn đúng

- **WHEN** student chưa enroll cố start attempt (BE 403 COURSE_ACCESS_DENIED)
- **THEN** UI hiện CTA đăng ký khóa (enroll — không "VIP"), không crash

### Requirement: Assignment nộp GitHub URL

Lesson có assignment SHALL hiện block nộp bài: dán GitHub URL → submit
(`usePostSubmitAssignmentSwr`) → lịch sử nộp + điểm/feedback AI khi có
(`getMyAssignmentSubmissions`). Nơi sửa nếu fail: block assignment trong
`src/components/features/learn/LessonReader/` theo change `learn-exercises-wire`
(spec `learn-assignment-submission`).

#### Scenario: Nộp và xem lịch sử

- **WHEN** student dán URL repo GitHub hợp lệ và bấm nộp, rồi mở lịch sử
- **THEN** submission tạo thành công, lịch sử hiện bản nộp (trạng thái chấm PENDING hoặc
  điểm nếu grader đã chạy), URL không hợp lệ bị chặn validate trước khi gọi API

### Requirement: Challenge ba loại nộp và chấm

Trang challenge (`ChallengeSubmission`) SHALL load challenge THẬT theo id từ lesson
payload (hết href mock `-c`), nộp được cả 3 loại theo `ChallengeView.type` — MCQ
(`answers`), CODE (code), ESSAY (`essayText`) — và xem kết quả chấm
(`getChallengeSubmissionResults`, điểm AI từ submission results). Nơi sửa nếu fail:
`src/components/features/learn/ChallengeSubmission/{index.tsx,SubmissionRow/}`,
`src/modules/api/rest/challenges/types.ts`, href builder trong
`src/components/features/learn/LessonReader/index.tsx` (`challengeHref`, dòng ~55).

#### Scenario: Nộp từng loại

- **WHEN** student mở lần lượt 3 challenge seed (MCQ/CODE/ESSAY) và nộp bài hợp lệ mỗi loại
- **THEN** cả 3 nộp thành công đúng shape payload, lịch sử submission hiện bản nộp, kết
  quả chấm (điểm/feedback) hiện khi BE trả

#### Scenario: Entry point gate theo challenge thật

- **WHEN** mở lesson KHÔNG có challenge ACTIVE
- **THEN** không hiện tab/nút thử thách ở bất kỳ entry nào (tab reader, nút practice ở
  rail OnThisPage)

### Requirement: Q&A roll-up toàn khóa

Trang `learn/qa` SHALL roll-up câu hỏi từ lesson comments thật của các lesson trong khóa
(hết `mock.ts`), mỗi câu link về đúng lesson, composer đăng câu hỏi về lesson đang chọn.
Nơi sửa nếu fail: `src/components/features/learn/CourseQa/{index.tsx,useQueryCourseQuestionsSwr.ts}`
+ gỡ `mock.ts` theo change `learn-engagement-wire` (spec `course-qa-rollup`).

#### Scenario: Xem và hỏi

- **WHEN** student mở tab Q&A của khóa, bấm 1 câu hỏi, rồi đăng câu hỏi mới
- **THEN** list là comment thật (khớp comment thấy trong từng lesson), click điều hướng về
  đúng lesson trong learn shell, câu mới xuất hiện trong cả Q&A lẫn lesson đích

### Requirement: Leaderboard render dữ liệu thật

Trang `learn/leaderboard` SHALL hiện bảng xếp hạng (podium + table + category rail trái)
từ API, đổi category đổi dữ liệu, empty/error state chuẩn. Nơi sửa nếu fail:
`src/components/features/learn/Leaderboard/{index.tsx,LeaderboardCategoryRail,LeaderboardPodium,LeaderboardTable}/`.

#### Scenario: Xem và đổi category

- **WHEN** student mở leaderboard và click qua các category ở rail trái
- **THEN** podium + bảng cập nhật theo category, hàng của chính mình (nếu có) nổi bật,
  không crash khi category rỗng

### Requirement: Mindmap render outline khóa

Trang `learn/mind-map` SHALL render mindmap từ outline thật của khóa, full-bleed (layout
không rail), node click điều hướng về lesson tương ứng. Nơi sửa nếu fail:
`src/components/features/learn/MindMap/index.tsx`,
`src/app/[locale]/courses/[courseId]/learn/layout.tsx` (nhánh `isMindMap`).

#### Scenario: Mở mindmap và điều hướng

- **WHEN** student mở mind-map của khóa demo và click 1 node lesson
- **THEN** map hiện đủ module/lesson theo outline, click node đưa về đúng reader lesson đó

### Requirement: Banner featured trên catalog

`FeaturedSlider` ở đầu `/courses` SHALL hiện banner/khóa featured từ API (admin banners /
featured courses), auto-slide không giật, click banner điều hướng đúng đích. Nơi sửa nếu
fail: `src/components/features/course/CourseCatalog/FeaturedSlider/`,
`src/components/features/course/hooks/useQueryFeaturedCoursesSwr.ts`.

#### Scenario: Banner hiển thị và điều hướng

- **WHEN** mở `/courses` có banner seed và click 1 slide
- **THEN** slider render ảnh + tiêu đề thật, điều hướng đúng course/URL đích; không banner
  nào → slider tự ẩn (không khung rỗng)

### Requirement: My-courses ở Home và popup menu

Khóa của tôi SHALL hiện ở 3 chỗ nhất quán từ cùng nguồn `useQueryMyCoursesSwr`: section
Home (`MyCoursesSection`), popup account menu (`AccountMenuAuthed`), trang `/courses/me`
— kèm tiến độ, click vào học tiếp đúng lesson. Nơi sửa nếu fail:
`src/components/features/home-landing/HomeLanding/sections/MyCoursesSection.tsx`,
`src/components/features/navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.tsx`,
`src/components/features/course/MyCourses/index.tsx`, `src/app/[locale]/courses/me/page.tsx`.

#### Scenario: Ba bề mặt nhất quán

- **WHEN** student đã enroll ≥1 khóa mở Home, mở popup account menu, mở `/courses/me`
- **THEN** cả 3 nơi hiện cùng danh sách khóa + tiến độ khớp nhau, click card vào learn
  shell đúng khóa; account chưa enroll → empty state + CTA khám phá (không khung vỡ)

### Requirement: Search inline tìm được khóa

Search overlay (nút navbar / phím tắt) SHALL trả kết quả khóa thật khi gõ, debounce không
spam API, click kết quả về trang detail. Nơi sửa nếu fail:
`src/components/features/search/{SearchOverlay/,SearchResults/,hooks/useGlobalSearch.ts}`,
`src/components/layouts/shell/Navbar/SearchButton/index.tsx`.

#### Scenario: Tìm khóa demo

- **WHEN** student mở search, gõ tên khóa demo từng ký tự
- **THEN** kết quả course hiện sau debounce (Network không bắn mỗi keystroke), click đưa
  về detail đúng khóa, query không khớp → empty state
