# content-ai-document-qa — Delta Spec

## ADDED Requirements

### Requirement: Nút "Hỏi tài liệu" (OCR / document-QA) ở tab Docs của CourseLesson

Tab "Tài liệu" của `CourseLesson` SHALL thêm, cạnh nút tải xuống mỗi tài liệu, một nút "Hỏi tài liệu" mở luồng document-QA. Bấm nút SHALL gọi `POST /api/v1/ai/document-qa` (qua `usePostDocumentQaSwr`) với `documentId` của tài liệu + `lessonId` hiện tại + `question` (mặc định `contentAi.doc.ocrPrompt`, hoặc câu người dùng nhập). Trong khi chờ, hệ thống SHALL hiển thị trạng thái đang xử lý; khi backend còn đang OCR (answer rỗng) hiển thị `contentAi.doc.processing`. Nút MUST có `aria-label`.

#### Scenario: Hỏi một tài liệu

- **GIVEN** người học ở tab Tài liệu của một bài học có tài liệu
- **WHEN** người học bấm "Hỏi tài liệu" trên một tài liệu
- **THEN** hệ thống gọi document-QA với `documentId` + `lessonId` và hiển thị trạng thái đang xử lý cho tới khi có câu trả lời

### Requirement: Hiển thị answer + citations và cho hỏi tiếp trong chat

Kết quả document-QA SHALL hiển thị `answer` (định dạng markdown) và danh sách `citations` (mỗi trích dẫn có snippet) trong một panel dùng `AsyncContent` cho loading/empty/error. Panel SHALL có nút "Hỏi tiếp trong chat" mở `ContentAiChat` — dùng `sessionId` mà backend trả về nếu có, hoặc một session mới scoped theo tài liệu. Lỗi từ backend (endpoint thiếu/HTTP lỗi) MUST hiển thị `contentAi.doc.error` gọn gàng, KHÔNG crash và KHÔNG dựng dữ liệu giả.

#### Scenario: Xem câu trả lời và trích dẫn

- **GIVEN** document-QA trả về answer + citations
- **WHEN** kết quả render
- **THEN** người học thấy câu trả lời dạng markdown và danh sách trích dẫn kèm snippet

#### Scenario: Hỏi tiếp trong chat

- **GIVEN** panel kết quả document-QA đang hiển thị, backend đã trả `sessionId`
- **WHEN** người học bấm "Hỏi tiếp trong chat"
- **THEN** panel `ContentAiChat` mở đúng session của tài liệu để hỏi tiếp

#### Scenario: Backend document-QA lỗi

- **GIVEN** `POST /api/v1/ai/document-qa` trả lỗi hoặc chưa tồn tại
- **WHEN** người học bấm "Hỏi tài liệu"
- **THEN** hiển thị thông báo lỗi `contentAi.doc.error`, giao diện không vỡ, không có câu trả lời giả
