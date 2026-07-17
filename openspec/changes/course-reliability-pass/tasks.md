# Tasks — course-reliability-pass

> **Chế độ gấp**: implement → test & fix tại chỗ; phần "đánh giá" (review sâu 2 vòng theo
> quality loop) GHI BACKLOG chạy sau, không chặn pass. Mục checklist FAIL do FE → fix
> ngay trong change này; FAIL do BE thiếu contract → ghi spec-backlog mới, KHÔNG mock.
> Change này chạy SAU khi 5 lane merge main.

## 0. Chuẩn bị

- [ ] 0.1 Xác nhận 5 lane đã merge main; `npm run build` (webpack) xanh + `tsc --noEmit` sạch trên main TRƯỚC khi pass (baseline)
- [ ] 0.2 `npm run dev` trỏ `apitest.ftes.vn`; login được account STUDENT test + tạo/chuẩn bị 1 student MỚI chưa enroll
- [ ] 0.3 Soi nhanh 3 điểm nghi regress do merge chung file: `LessonReactionFooter` còn import `useLessonReactionMock`? `CourseQa/mock.ts` còn được import? `challengeHref` còn đuôi mock `-c`? — ghi kết quả vào bảng pass

## 1. Pass checklist `course-reliability-verify` (chạy theo thứ tự journey)

- [ ] 1.1 Catalog + category filter (2 scenario) — fail → `CourseCatalog/`, `browse/`
- [ ] 1.2 Course detail isPurchased/instructor/rating (2 scenario) — fail → `CourseDetail/`, `useQueryCourseDetailSwr.ts`
- [ ] 1.3 Enroll free + mua package trọn vòng PackageGateModal→cart→checkout→mở khóa (3 scenario) — fail → `PackageGateModal/`, `CartShell/`, `PaymentModal/`, `submit-checkout.ts`
- [ ] 1.4 Learn shell: outline lock đúng entitlement + video stream + document teaser không leak (3 scenario) — fail → `ContentMap/`, `LessonVideoBlock/LessonHlsPlayer`, `DocumentReader/`
- [ ] 1.5 Auto mark-complete video ≥50% / document exit / idempotent reload (3 scenario) — fail → `LessonCompletion` trong `LessonReader/index.tsx`
- [ ] 1.6 Watch-position report 30s + pause/seek + resume (2 scenario) — fail → reporter trong `LessonVideoBlock.tsx`; BE không trả position → backlog
- [ ] 1.7 Like/view thật, persist qua reload (2 scenario) — fail → gỡ `useLessonReactionMock.ts`, wire REST reactions
- [ ] 1.8 Quiz làm + nộp + gate chưa-enroll (2 scenario) — fail → block quiz `LessonReader` theo spec `learn-quiz-taking`
- [ ] 1.9 Assignment nộp GitHub + lịch sử (1 scenario) — fail → block assignment theo spec `learn-assignment-submission`
- [ ] 1.10 Challenge 3 loại MCQ/CODE/ESSAY nộp + chấm + gate entry (2 scenario) — fail → `ChallengeSubmission/`, `challengeHref`
- [ ] 1.11 Q&A roll-up + đăng câu hỏi (1 scenario) — fail → `CourseQa/`, gỡ `mock.ts`
- [ ] 1.12 Leaderboard đổi category (1 scenario) — fail → `Leaderboard/`
- [ ] 1.13 Mindmap render + điều hướng node (1 scenario) — fail → `MindMap/`
- [ ] 1.14 Banner featured slider (1 scenario) — fail → `FeaturedSlider/`
- [ ] 1.15 My-courses 3 bề mặt Home/popup menu/`/courses/me` nhất quán (1 scenario) — fail → `MyCoursesSection.tsx`, `AccountMenuAuthed/`, `MyCourses/`
- [ ] 1.16 Search inline debounce + điều hướng (1 scenario) — fail → `SearchOverlay/`, `useGlobalSearch.ts`
- [ ] 1.17 Tổng hợp bảng PASS/FAIL 16 mục + link commit fix / spec-backlog cho từng FAIL

## 2. Pass capability `lesson-ai-fab`

- [ ] 2.1 Rà FAB trên 6 dạng bài: VIDEO / DOCUMENT full / DOCUMENT teaser / SLIDE / link-only / premium khóa (+ tự ẩn ở dashboard, leaderboard, mind-map) — bài thiếu FAB → fix mount `learn/layout.tsx` hoặc điều kiện trong `ContentAiFab/index.tsx`
- [ ] 2.2 Viewport: desktop popover 1280px, mobile 375px bottom-sheet, desktop cao 600px (clamp) — chat gõ + gửi + stream được ngay trong surface
- [ ] 2.3 Kéo-thả: drag dọc persist `contentAiFabBottom` qua reload/đổi bài; thả sau kéo KHÔNG mở popover; click thường mở bình thường
- [ ] 2.4 Cộng sinh panel neo (`ContentAiAnchoredChat` của `lesson-ai-chat-fixes`): mở panel neo không ẩn/đóng FAB, z đúng tầng 40<45<50, intent selection không bị reset lúc mount, FAB dùng lại được sau khi panel đóng
- [ ] 2.5 Fix mọi lệch phát hiện ở 2.1–2.4 + unit test (RTL) cho phần fix (tối thiểu: điều kiện render theo loại bài, drag persist, swallow drag-release)

## 3. Chốt

- [ ] 3.1 `npm run build` (webpack) xanh + `tsc --noEmit` sạch sau toàn bộ fix
- [ ] 3.2 `openspec validate course-reliability-pass --strict` PASS
- [ ] 3.3 Backlog: ghi danh sách mục "đánh giá 2 vòng quality-loop" + FAIL-do-BE thành spec-backlog (`openspec/changes/` mới), kèm endpoint/payload kỳ vọng
