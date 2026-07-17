# course-reliability-pass — Verify E2E toàn module Course sau đợt rush + AI chat FAB trên mọi buổi học

## Why

Đợt rush 5 lane song song (Course/Learn/Home/Commerce + Workspace/Community) đã wire hàng
loạt tính năng module Course từ mock sang contract thật (`apitest.ftes.vn/api/v1`) qua các
change: `course-engagement-fe`, `learn-engagement-wire`, `learn-exercises-wire`,
`learn-reader-and-enroll-ux`, `course-try-for-free`, `commerce-checkout-flows`,
`fix-course-purchase-product-resolve`, `lesson-ai-chat-fixes`, `lesson-tier-badge`.
Mỗi change tự verify cục bộ (build xanh + click-through lẻ), nhưng **chưa có 1 pass E2E
xuyên suốt** sau khi tất cả merge về main:

- Nhiều lane sửa CHUNG file (`LessonReader/index.tsx`, `useQueryCourseDetailSwr.ts`,
  `learn/layout.tsx`) — merge có thể đè/regress hành vi lane kia (đã xảy ra kiểu
  `LessonReactionFooter` vẫn trỏ `useLessonReactionMock` trong main tại thời điểm viết spec).
- Chuỗi tiền (PackageGateModal → cart → checkout → entitlement mở khóa) đi qua 3 module
  (course/commerce/learn) — chưa lần nào chạy trọn vòng trên main.
- FAB chat AI (`ContentAiFab`) mount ở learn layout theo `contentId` param — chưa verify nó
  hiện trên MỌI loại lesson (VIDEO/DOCUMENT/SLIDE/link-only) và mọi viewport, đặc biệt sau
  khi `lesson-ai-chat-fixes` thêm panel neo theo selection (2 surface phải cùng tồn tại).

Change này là **spec cho đợt cải tiến chạy SAU khi 5 lane merge**: 1 checklist verify E2E
có kịch bản cụ thể cho từng tính năng, kèm nơi sửa (file path) khi mục nào fail.

## What Changes

- **Không thêm tính năng mới** (trừ fix phát sinh): đây là reliability pass — chạy từng
  kịch bản trong checklist trên main sau merge, mục nào fail thì fix ngay tại file đã chỉ,
  mục nào cần BE thì ghi backlog.
- **Capability `course-reliability-verify`**: checklist E2E 16 nhóm tính năng Course —
  catalog + category filter, course detail (isPurchased/instructor/rating), enroll free +
  mua package (PackageGateModal → cart → checkout), learn shell (outline lock theo
  entitlement, video stream, document teaser), auto mark-complete (video ≥50% / document
  exit), watch-position report, like/view thật, quiz làm + nộp, assignment nộp GitHub,
  challenge 3 loại nộp + chấm, Q&A roll-up, leaderboard, mindmap, banner featured,
  my-courses ở Home + popup menu, search inline.
- **Capability `lesson-ai-fab`**: icon chat AI ở góc màn hình buổi học — verify
  `ContentAiFab` hiện trên MỌI loại lesson, mọi viewport, kéo-thả vị trí lưu localStorage,
  mở panel chat dùng được ngay; bài nào thiếu FAB thì fix; phối hợp với panel neo selection
  của `lesson-ai-chat-fixes` (FAB góc = luồng thường, panel neo = luồng bôi đen — cả 2
  cùng tồn tại, không surface nào nuốt surface kia).
- Fix regress phát hiện trong pass → sửa thẳng trong scope change này (ghi vào tasks);
  gap cần BE mới → ghi spec-backlog, KHÔNG mock thêm.

## Capabilities

### New Capabilities

- `course-reliability-verify`: checklist verify E2E toàn tính năng module Course sau merge,
  mỗi mục có bước thao tác + kỳ vọng + nơi sửa nếu fail.
- `lesson-ai-fab`: FAB chat AI góc màn hình hiện trên mọi buổi học, kéo-thả persist,
  chat dùng được tại chỗ, cộng sinh với panel neo selection.

### Modified Capabilities

- Không sửa delta spec sẵn có — pass này verify hành vi các capability đã đề xuất/implement
  ở các change kể trên; fail ở đâu fix theo đúng spec gốc của change đó.

## Impact

- Affected code (chỉ khi mục checklist fail — đây là danh sách nơi-sửa, không phải danh
  sách chắc-chắn-đổi):
  - `src/components/features/course/{CourseCatalog,CourseDetail,MyCourses,PackageGateModal,browse,hooks}/*`
  - `src/components/features/learn/{LessonReader,DocumentReader,ContentMap,ChallengeSubmission,CourseQa,Leaderboard,MindMap,ContentAiFab,ContentAiChat}/*`
  - `src/components/features/cart/CartShell/*`, `src/components/modals/PaymentModal/*`
  - `src/components/features/home-landing/HomeLanding/sections/MyCoursesSection.tsx`,
    `src/components/features/navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.tsx`
  - `src/components/features/search/{SearchOverlay,hooks}/*`
  - `src/app/[locale]/courses/**` (routes catalog/detail/learn/me)
  - `src/hooks/swr/api/rest/{queries,mutations}/*`, `src/modules/api/rest/{course,challenges,commerce}/*`
- Môi trường verify: BE thật `https://apitest.ftes.vn/api/v1` (seed `course-demo-seed-dev`),
  account test 4 role sẵn có; FE `npm run dev` (turbopack).
- Phụ thuộc: chạy SAU khi 5 lane merge main; các change BE contract
  (`course-learn-contract-gaps`, `course-lesson-reaction`, `course-challenge-bank`) đã deploy.
- Verify chốt: toàn checklist PASS (hoặc mục fail có fix/backlog kèm) + `npm run build`
  (webpack) xanh + `tsc --noEmit` sạch.
