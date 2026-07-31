# lesson-topbar-challenge-material — Nút "Làm thử thách" + "Tài liệu buổi học" trên thanh hành động ĐẦU trang đọc bài

## Why
Trên trang đọc bài (`LessonReader`), thanh hành động ĐẦU trang (prop `actions` của `PageHeader`)
mới chỉ có nút Bài trước / Bài sau + nút thu gọn bảng học phần. Thử thách của bài và tài liệu
buổi học đều nằm SÂU dưới trang (tab/CTA Challenges ở giữa, khối tài liệu inline ở dưới) — người
học phải cuộn tìm. Thầy: khi bài CÓ thử thách → hiện nút "Làm thử thách" ngay cạnh nút Bài sau,
bấm mở trang giải (đã có chấm AI); khi bài CÓ tài liệu → hiện thêm nút "Tài liệu buổi học" cạnh đó.
**Mỗi nút CHỈ hiện khi thứ đó tồn tại.**

## What Changes
- **Nút "Làm thử thách" (thanh đầu)** — thêm vào cùng `div` actions của `PageHeader`, cạnh nút Bài
  sau, render CHỈ khi `hasChallenge` (`(lesson.hasChallenge ?? false) && Boolean(lesson.challengeId)`,
  vị ngữ đã có sẵn). Điều hướng ĐÚNG MỘT route giải mà `TrialChallengeCta` + tab `ChallengesView`
  đang dùng: `challengeHref(courseId, lesson.moduleId, contentId, target)` với
  `target = lesson.freeChallengeSlug ?? lesson.challengeId` (ưu tiên slug học-thử theo đúng
  `TrialChallengeCta`, fallback `challengeId` theo đúng `ChallengesView`). Thử thách trả phí chưa mở
  khoá (`challengeLocked`) → mở package gate (`openGate("challenge")`) thay vì đẩy vào solver bị BE
  403 — y hệt `onOpen` của `ChallengesView`. Nhãn dùng lại key có sẵn `reader.trialChallengeCta`
  ("Làm thử thách"); icon `PuzzlePieceIcon` (khớp `TrialChallengeCta`). KHÔNG gỡ CTA/tab cũ (bổ sung).
- **Nút "Tài liệu buổi học" (thanh đầu)** — render CHỈ khi bài có tài liệu (`documents.length > 0`).
  Không có field `hasMaterial` trên lesson view; tín hiệu là `getLessonDocuments(lessonId)`. Thêm hook
  dùng chung `useQueryLessonDocumentsSwr(lessonId)` (key `["lesson-documents", lessonId]`) và dùng ở
  CẢ `LessonDocumentsBlock` LẪN `LessonReader` để chia sẻ 1 cache (SWR dedupe — không fetch 2 lần).
  Không có route tài liệu riêng: khối tài liệu render inline (`LessonDocumentsBlock`) được gắn
  `id="lesson-documents"`, nút bấm sẽ `scrollIntoView({ behavior: "smooth" })` tới đó (cuộn tại-chỗ,
  không đổi route); nút cũng ép về view "content" trước khi cuộn (khối không mount dưới tab Challenges).
  Nhãn: key mới `reader.materialButton` = vi "Tài liệu buổi học" / en "Lesson materials".
- **Mobile gọn hàng** — 2 nút mới ẩn nhãn dưới `sm` (icon-only + `aria-label`), hiện nhãn từ `sm:` lên
  (theo luật tab icon+label ẩn nhãn trên mobile), để hàng actions không tràn khi có đủ 5 nút.

## Impact
FE-only, KHÔNG cần API mới (`getLessonDocuments` + `hasChallenge`/`challengeId`/`freeChallengeSlug`
đã có trong contract). Sửa: thêm `features/learn/hooks/useQueryLessonDocumentsSwr.ts`; đổi
`features/learn/LessonReader/LessonDocumentsBlock.tsx` (dùng hook chung + `id="lesson-documents"`);
`features/learn/LessonReader/index.tsx` (2 nút + handler cuộn); i18n `learn.reader.materialButton`
(vi + en). KHÔNG đổi route giải, luồng chấm AI, hay cách render tài liệu (chỉ thêm `id` + đổi nguồn
fetch sang hook chung). `tsc --noEmit` sạch; test learn giữ xanh.
