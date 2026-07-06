# content-ai-selection-ask — Delta Spec

## ADDED Requirements

### Requirement: FAB "Hỏi AI về đoạn này" neo theo selection trong vùng đọc

`ContentAiSelectionAsk` SHALL hiển thị một nút nổi (FAB) khi người học bôi đen văn bản TRONG vùng đọc `#lesson-article` (không phải toàn trang) với độ dài đủ vài ký tự. Nút MUST render qua `createPortal(document.body)` ở `position:fixed` tại `range.getBoundingClientRect()`, có z-index trên FAB chat (z-40) nhưng dưới panel mở ra, và MUST giữ selection sống tới khi click (`onMouseDown preventDefault` trên wrapper). Nút SHALL ẩn khi selection bị collapse, hoặc khi scroll/resize làm rect trôi. Khi vùng đọc có `select-none` (bài premium chưa mở) người dùng không select được nên FAB MUST không bao giờ hiện.

#### Scenario: Bôi đen trong bài hiện FAB

- **GIVEN** người học đang đọc một bài đã mở khoá (vùng `#lesson-article` chọn được)
- **WHEN** người học bôi đen một đoạn văn
- **THEN** nút "Hỏi AI về đoạn này" nổi lên ngay phía trên vùng chọn

#### Scenario: Bài premium khoá không hiện FAB

- **GIVEN** bài premium chưa mở khoá, `#lesson-article` có `select-none`
- **WHEN** người học kéo chọn văn bản
- **THEN** không chọn được nên không nút nào hiện

### Requirement: Mở chat với đoạn làm ngữ cảnh, prepend trích dẫn ≤ 200 ký tự

Bấm FAB SHALL set `contentAiSelection` (đoạn) + `contentAiSelectionContext` (đoạn văn bao quanh) qua store, rồi mở panel chat. Chat SHALL hiển thị banner trích dẫn (rút gọn 2 dòng, có nút × bỏ chọn) và 3 chip gợi ý scoped (`selectionSuggestions.explain/example/simplify`). Khi gửi, câu hỏi SHALL được PREPEND một trích dẫn (`aboutPassage`, cap ≤ 200 ký tự) — không gọi endpoint mới; `contentAiSelectionContext` gửi kèm làm HIDDEN grounding, KHÔNG hiển thị trong thread. Selection SHALL được clear sau khi gửi, bấm ×, hoặc đổi bài. Component MUST KHÔNG clear selection lúc mount — chỉ clear khi content đổi thật (`prevContentIdRef !== contentId`).

#### Scenario: Hỏi về đoạn đã chọn

- **GIVEN** người học bôi đen một đoạn và bấm FAB, panel chat mở kèm banner trích dẫn
- **WHEN** người học gõ câu hỏi và gửi
- **THEN** tin nhắn gửi đi gồm trích dẫn đoạn (≤200 ký tự) đứng trước câu hỏi, và trích dẫn hiển thị trong bubble để thread nhất quán khi reload

#### Scenario: Mở panel không xoá đoạn vừa chọn

- **GIVEN** người học vừa set selection (bấm FAB) làm panel chat mở/remount
- **WHEN** panel render lần đầu
- **THEN** đoạn đã chọn vẫn còn (không bị effect-on-mount xoá), banner trích dẫn vẫn hiển thị
