# lesson-practice-rail-cleanup — Trang đọc bài: bỏ tab + nút bài tập/tài liệu trên top-bar, tài liệu về rail phải

## Why
Chủ dự án chốt lại bố cục trang đọc bài (`LessonReader`): thanh tab "Nội dung | Thử thách"
và cụm nút top-bar ("Làm thử thách" / "Làm bài tập" / "Tài liệu buổi học") làm header rối và
trùng chức năng. Việc luyện tập đã có sẵn ở panel rail phải "Luyện tập bài này" (liệt kê các
challenge của bài thành nút bấm). Tài liệu buổi học nên nằm ngay cạnh panel luyện tập ở rail
phải, mỗi tài liệu bấm mở xem trực tiếp — thay vì một nút cuộn tới khối tài liệu chèn giữa nội
dung. Kết quả: top-bar chỉ còn Bài trước / Bài sau + nút mở sidebar; khu nội dung luôn hiển thị
phần đọc (không còn chuyển tab).

## What Changes
- **`OnThisPage` (rail phải)** — THÊM panel "Tài liệu cho lesson này" NGAY DƯỚI panel "Luyện tập
  bài này": load bằng hook chung `useQueryLessonDocumentsSwr(contentId)` (cùng key
  `["lesson-documents", contentId]` nên dedupe), chỉ render khi `documents.length > 0`, mỗi tài
  liệu là 1 link mở `doc.url` ở tab mới (`target="_blank" rel="noopener noreferrer"`) hiển thị
  `doc.title` — gọn, đúng canon (Label + link nhỏ như panel challenge). Guard early-return của
  rail cập nhật: chỉ trả `null` khi KHÔNG có heading, KHÔNG có challenge VÀ KHÔNG có tài liệu.
- **`LessonReader` (khu nội dung)** — GỠ:
  - Tab "Nội dung | Thử thách": render `TabsCard`, `leftTabs` useMemo, nhánh `ChallengesView` +
    component `ChallengesView`/`ChallengeRow` cục bộ. Khu nội dung nay LUÔN hiển thị phần đọc
    (state `view`/`setView`/`ContentView` gỡ hẳn — nó chỉ phân biệt content↔challenges, KHÔNG
    chi phối nhánh reader DOCUMENT, nên gỡ an toàn; nhánh `DocumentReader` vẫn theo `contentType`).
  - 3 nút top-bar: "Làm thử thách" (`trialChallengeCta`), "Làm bài tập" (`assignmentButton`),
    "Tài liệu buổi học" (`materialButton`). GIỮ Bài trước (`prevId`), Bài sau (`nextId`), nút mở
    sidebar (hamburger).
  - `<LessonDocumentsBlock lessonId={contentId} />` inline trong thân reader (tài liệu chuyển ra rail).
  - Dọn theo: `revealDocuments`/`revealAssignments`, `hasChallenge`/`hasAssignment`/`hasMaterial`,
    `hasFullAccess`/`challengeLocked`, các call `useQueryLessonDocumentsSwr`/`useGetLessonAssignmentsSwr`/
    `useQueryLearnCourseSwr`, import icon `ClipboardTextIcon`/`FileTextIcon`, anchor cuộn
    `#lesson-documents`/`#lesson-assignments`, import `TabsCard`/`type Key`. GIỮ `PuzzlePieceIcon`
    (còn dùng ở `TrialChallengeCta` sau nội dung).
  - GIỮ nguyên phần còn lại: video/markdown, reaction footer, comments, AI study, quiz block,
    celebration, package gate, nhánh `DocumentReader`, khối `LessonAssignmentBlock` thật ở cuối
    bài, chip "N thử thách" dưới tiêu đề, panel "Luyện tập bài này" ở rail.
- **File `LessonDocumentsBlock.tsx`** — XOÁ (sau khi gỡ khỏi reader thì không nơi nào import nữa).
- **i18n** — thêm `learn.lessonRail.documents.title` = vi "Tài liệu cho lesson này" / en "Lesson
  materials" (mirror cạnh `lessonRail.challenges`, cả `vi.json` + `en.json`).
- **Test** — `LessonReader/index.test.tsx`: gỡ test cho các nút top-bar (trialChallengeCta/
  assignmentButton/materialButton) + assertion tab "Thử thách"; giữ các test còn lại xanh.

## Impact
FE-only. Sửa: `OnThisPage/index.tsx` (+panel tài liệu), `LessonReader/index.tsx` (gỡ tab + nút +
docs inline), `hooks/useQueryLessonDocumentsSwr.ts` (cập nhật JSDoc), `messages/vi.json` +
`en.json` (+1 key mirror), `LessonReader/index.test.tsx`. Xoá: `LessonReader/LessonDocumentsBlock.tsx`.
KHÔNG đụng BE/contract. `tsc --noEmit` exit 0; `vitest` LessonReader + OnThisPage xanh.
