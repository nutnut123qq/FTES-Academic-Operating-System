# Content-AI Chat multi-model — chọn nhiều model, bôi đen hỏi AI, OCR/hỏi-đáp tài liệu

## Why

Trợ giảng Content-AI hiện chỉ trả lời bằng 1 chuỗi model cố định (auto), người học không chọn được model; chưa có đường "bôi đen 1 đoạn trong bài → hỏi AI về đúng đoạn đó" như một component sống trong repo này (mới chỉ có draft rule + store field `contentAiSelection`); và tài liệu ở tab "Tài liệu" của trình học (`CourseLesson`) chỉ tải xuống được, không đọc/hỏi được nội dung. Thầy muốn: (1) người học **chọn model** trả lời (mặc định GPT-OSS-120B, danh sách lấy từ BE), (2) **bôi đen hỏi AI** neo theo đoạn, (3) **OCR + hỏi đáp tài liệu** ngay trong tab Docs. Backend đã có contract: `GET /api/v1/ai/models`, `POST /api/v1/ai/document-qa` (xem `AI-CONTRACT.md` §1/§4). Đây là phần FE dựng UI + hook khớp contract đó, tái dùng tối đa store/hook đã có.

## What Changes

- **`ContentAiChat`** (panel chat, multi-session) — chính thức hoá component mà 3 draft rule đã thiết kế nhưng CHƯA tồn tại trong repo này: thread + composer + view in-panel (chat / conversations / settings) không popover-on-popover. Composer là **1 box** chứa input flat + hàng controls `[model picker ▾] · [⚙] · [gửi]` (draft `ai-chat-composer-box-controls-and-settings-modal`). Multi-session + drawer/danh sách hội thoại (draft `content-ai-multi-session-conversations`). Tái dùng `useContentAiStream`, `useMutateAskContentAiSwr`, các hook session SWR đã có.
- **`ContentAiComposer`** — cụm composer tách riêng: input flat + **model picker** đọc catalog từ hook mới `useQueryAiModelsMetaSwr` (`GET /api/v1/ai/models`), mặc định `openai/gpt-oss-120b`; model đã chọn lưu qua `useContentAiSelectedModel` (đã có) và forward xuống `useContentAiStream.ask({ model, provider })`.
- **`ContentAiSelectionAsk`** — FAB nổi khi bôi đen trong `#lesson-article`: set `contentAiSelection` (+ context) qua store đã có → mở chat (`useContentAiChatOverlayState`) → chat prepend trích dẫn ≤ 200 ký tự vào câu hỏi (draft `ai-selection-anchored-ask-passage`). Vì repo này CHƯA có `#lesson-article` sống trong trình học, spec nêu rõ **điểm mount + điều kiện scope**.
- **Nút "OCR / Hỏi tài liệu"** ở tab Docs của `CourseLesson`: gọi `POST /api/v1/ai/document-qa` với `documentId` (+ `lessonId`) qua hook mutation mới `usePostDocumentQaSwr`; hiển thị `answer` + `citations`, và mở `ContentAiChat` scoped để hỏi tiếp trên tài liệu đó.
- **Hook mới**: `useQueryAiModelsMetaSwr` (REST GET models, cache SWR), `usePostDocumentQaSwr` (REST POST document-qa). Module REST mới `src/modules/api/rest/ai-models/` + `ai-document-qa/` theo pattern axios nhà.
- **i18n**: MỞ RỘNG cụm `contentAi.*` (không tạo file locale mới — repo dùng `src/messages/vi.json` + `en.json`) với các khoá model picker / OCR / doc-QA (liệt kê §Design D7).
- **Formalize 3 draft rule** liên quan (`ai-selection-anchored-ask-passage`, `ai-chat-composer-box-controls-and-settings-modal`, `content-ai-multi-session-conversations`) — tham chiếu trong `design.md` làm nguồn luật; nếu thầy chạy `/merge` thì hợp nhất vào rule chính thức.

## Capabilities

### New Capabilities

- `content-ai-multimodel-chat`: panel chat trợ giảng có model picker (catalog từ BE, default GPT-OSS-120B), composer-in-box, multi-session, stream qua socket sẵn có.
- `content-ai-selection-ask`: FAB "Hỏi AI về đoạn này" neo theo selection trong `#lesson-article` → mở chat với trích dẫn prepend.
- `content-ai-document-qa`: nút OCR/Hỏi tài liệu ở tab Docs của `CourseLesson` gọi document-QA + hiển thị answer/citations + hỏi tiếp.

### Modified Capabilities

<!-- Không có delta spec hiện hữu trong openspec/specs/ chạm content-AI. Change course-lesson là mock UI, không có spec content-AI. Không có delta. -->

## Impact

- `src/components/features/course/ContentAiChat/**` (mới) — panel chat + `ContentAiComposer` + `ContentAiSettingsView` + `ContentAiConversationsView`.
- `src/components/features/course/ContentAiSelectionAsk/index.tsx` (mới) — FAB selection-anchored.
- `src/components/features/course/CourseLesson/index.tsx` — tab Docs: thêm nút OCR/Hỏi tài liệu + panel kết quả; mount `ContentAiChat` (FAB) + `ContentAiSelectionAsk`; bọc phần overview markdown bằng `id="lesson-article"`.
- `src/hooks/swr/api/rest/queries/useQueryAiModelsMetaSwr.ts` (mới) + `.../mutations/usePostDocumentQaSwr.ts` (mới).
- `src/modules/api/rest/ai-models/**` + `src/modules/api/rest/ai-document-qa/**` (mới) — axios call + types.
- `src/hooks/zustand/overlay/**` — tái dùng: `useContentAiChatOverlayState`, `useContentAiSelectedModel`, `useContentAiSelection`, `contentAiSelectionContext`. KHÔNG thêm overlay key mới (dùng `contentAiChat` sẵn có).
- `src/messages/vi.json` / `en.json` — mở rộng cụm `contentAi.*`.
- Không đụng backend; FE-only, khớp contract BE `AI-CONTRACT.md`. Nếu BE chưa sẵn endpoint → hook trả lỗi/empty gọn (AsyncContent xử lý), KHÔNG bịa dữ liệu.
