# lesson-ai-fab

Icon chat AI ở GÓC màn hình buổi học. Component đã có:
`src/components/features/learn/ContentAiFab/index.tsx`, mount 1 lần ở
`src/app/[locale]/courses/[courseId]/learn/layout.tsx` (cạnh `ContentAiSelectionAsk`),
tự ẩn khi route không có `contentId`. Capability này VERIFY + FIX để FAB đạt chuẩn:
hiện trên MỌI loại lesson, mọi viewport, kéo-thả persist, chat dùng ngay tại chỗ, và
cộng sinh với panel neo selection của change `lesson-ai-chat-fixes`.

## ADDED Requirements

### Requirement: FAB hiện trên mọi loại lesson

FAB chat AI SHALL hiển thị ở góc màn hình trên MỌI buổi học đi qua route
`learn/content/modules/[moduleId]/contents/[contentId]` bất kể loại nội dung — VIDEO,
DOCUMENT (kể cả `DocumentReader` teaser/PREVIEW), SLIDE, link-only, video-only, lesson
đang khóa premium — và SHALL tự ẩn ở các bề mặt không phải buổi học (dashboard content,
leaderboard, mind-map, Q&A). Bài nào thiếu FAB là FAIL → fix điều kiện mount ở
`learn/layout.tsx` hoặc điều kiện `contentId` trong `ContentAiFab/index.tsx` (không
component nào được che FAB bằng z-index ≥ 40 tại góc phải).

#### Scenario: Rà mọi loại lesson

- **WHEN** student mở lần lượt lesson VIDEO, DOCUMENT full, DOCUMENT teaser (PREVIEW),
  SLIDE, lesson link-only và lesson premium đang khóa trong khóa demo
- **THEN** FAB (icon sparkle) hiện ở góc phải trên TẤT CẢ các bài, bấm mở panel chat
  được ở tất cả (kể cả bài khóa — chat mở, còn gate trả lời do BE quyết)

#### Scenario: Tự ẩn ngoài buổi học

- **WHEN** student đứng ở `learn/content` (dashboard), `learn/leaderboard`,
  `learn/mind-map`
- **THEN** FAB không render (không có `contentId`)

### Requirement: FAB hoạt động trên mọi viewport

FAB SHALL dùng được ở mọi viewport: desktop (≥sm) mở `Popover` 380px cạnh nút; mobile
(<sm, `useSmViewpoint`) là `FloatingActionButton` mở `Drawer` bottom-sheet 80vh — cả 2
chứa `ContentAiChat` dùng được ngay (gõ + gửi + stream trả lời trong chính surface đó).
Nơi sửa nếu fail: `ContentAiFab/index.tsx` (nhánh `isMobile`),
`ContentAiChat/index.tsx`.

#### Scenario: Desktop popover

- **WHEN** student desktop (1280px) bấm FAB, gõ câu hỏi và gửi
- **THEN** popover mở cạnh FAB (`placement="left bottom"`), câu trả lời stream ngay trong
  popover, đóng/mở lại giữ được thread phiên

#### Scenario: Mobile bottom-sheet

- **WHEN** student mobile 375px bấm FAB
- **THEN** drawer bottom-sheet 80vh mở với cùng `ContentAiChat`, composer không bị bàn
  phím che mất nút gửi, kéo đóng được

#### Scenario: Viewport thấp

- **WHEN** cửa sổ desktop cao 600px và FAB đã được kéo lên cao từ phiên trước
- **THEN** FAB vẫn nằm trong viewport (clamp `MIN_BOTTOM`/`TOP_GUARD`), không kẹt ngoài
  màn hình

### Requirement: Kéo-thả vị trí FAB persist qua localStorage

FAB desktop SHALL kéo-thả DỌC được (threshold 6px phân biệt drag/click), vị trí lưu
localStorage key `contentAiFabBottom` và khôi phục khi vào lesson khác/reload; nhả tay
sau khi kéo KHÔNG được mở popover (swallow toggle qua `draggingRef`). Nơi sửa nếu fail:
`ContentAiFab/index.tsx` (`onPointerDown/Move/Up`, `onOpenChange`).

#### Scenario: Kéo và persist

- **WHEN** student kéo FAB từ đáy lên giữa màn hình, thả tay, rồi F5 và mở lesson khác
- **THEN** thả tay không mở popover, sau reload + đổi bài FAB vẫn ở vị trí đã kéo
  (localStorage `contentAiFabBottom`)

#### Scenario: Click thường vẫn mở

- **WHEN** student bấm FAB không di chuyển quá 6px
- **THEN** tính là click — popover mở bình thường

### Requirement: FAB góc cộng sinh với panel neo selection

FAB góc (luồng thường — mở tay) và panel neo theo selection SHALL cùng tồn tại
(panel neo = `ContentAiAnchoredChat` của change `lesson-ai-chat-fixes` — luồng bôi đen
trong vùng đọc `id="lesson-article"`): mở panel neo không ẩn/di chuyển/đóng FAB; hai
surface không giành nhau z-index sai tầng (FAB z-40 < nút selection z-45 < panel neo
z-50); intent selection set trước khi surface mở KHÔNG bị reset lúc mount (bẫy đã ghi ở
draft rule `ai-selection-anchored-ask-passage`). Nơi sửa nếu fail:
`learn/layout.tsx` (thứ tự mount), `ContentAiFab/index.tsx`,
`ContentAiAnchoredChat/index.tsx`, store overlay `hooks/zustand/overlay/`.

#### Scenario: Hai luồng song song

- **WHEN** student bôi đen 1 đoạn → mở panel neo hỏi xong → đóng panel → bấm FAB góc hỏi
  câu khác
- **THEN** trong lúc panel neo mở FAB vẫn nhìn thấy và không nhảy vị trí; FAB mở lại
  bình thường sau khi panel neo đóng; câu hỏi từ FAB không dính selection cũ đã clear

#### Scenario: Không nuốt intent

- **WHEN** student bôi đen và bấm "Hỏi AI về đoạn này" (panel/popup remount khi mở)
- **THEN** đoạn bôi đen vẫn còn trong banner ngữ cảnh của chat (không bị effect-on-mount
  xóa), gửi câu hỏi có kèm passage
