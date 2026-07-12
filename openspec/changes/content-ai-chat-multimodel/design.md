# Design — content-ai-chat-multimodel

## Context

- **Contract nguồn chân lý**: `AI-CONTRACT.md`. Model catalog + default (§1), REST BE `GET /api/v1/ai/models`, `POST /api/v1/ai/document-qa` (§4.2/§4.3), FE scope (§5). Envelope BE = `{code,message,data}` (§6); `data` có thể null.
- **Store overlay đã có (`src/hooks/zustand/overlay/`)** — TÁI DÙNG, không thêm key:
  - `useContentAiChatOverlayState()` → mở/đóng panel chat (key `contentAiChat`).
  - `useContentAiSelectedModel()` → `{ selectedModel, setSelectedModel }` (model picker + composer chung 1 nguồn).
  - `useContentAiSelection()` → `{ selection, selectionContext, setSelection(passage, context?) }` (bôi-đen-hỏi).
  - Field `contentAiSelectionContext` = đoạn văn bao quanh, gửi làm HIDDEN grounding, KHÔNG hiển thị trong thread.
- **Streaming đã có** (`src/hooks/socketio/useContentAiStream.ts`): `ask({ sessionId, contentId, question, history, mode, model, provider, onDelta, onDone })` + `abort()`. Multi-model = truyền `mode:"premium"` + `model`/`provider` khi người dùng chọn model cụ thể; `mode:"auto"` (default chain) khi để mặc định.
- **Session/mutation đã có**: `useMutateAskContentAiSwr`, `useMutateCreateContentAiSessionSwr`, `useMutateClearContentAiHistorySwr`, `useMutateTouchContentAiSessionSwr`, `useQueryContentAiHistorySwr`, `useQueryContentAiSessionsSwr`, `useQueryContentAiSessionsInfiniteSwr`. ContentAiChat lắp lại các hook này (multi-session đã có ở tầng data).
- **REST pattern nhà**: `src/modules/api/rest/<name>/<name>.ts` (axios `create({ baseURL: publicEnv().api.http })` → `${publicEnv().api.http}/<path>`) + `types.ts`; SWR wrapper ở `src/hooks/swr/api/rest/queries|mutations/`. `publicEnv().api.http` mặc định `http://localhost:3001/api/v1` → path chỉ cần `/ai/models`, `/ai/document-qa`.
- **⚠️ Trạng thái repo thực**: `ContentAiChat` / `ContentAiSelectionAsk` / `ContentAiFab` / route `learn/` / id `#lesson-article` (sống trong trình học) **CHƯA tồn tại** trong repo này — 3 draft rule mô tả chúng như đã dựng ở codebase StarCi gốc. Trình học sống ở đây là **`CourseLesson`** (`/courses/[courseId]/lessons/[lessonId]`, mock `useQueryLessonSwr`), tab "overview" render text (chưa markdown), tab "docs" render list tài liệu download-only. → change này DỰNG MỚI các component trong cây `features/course/`, mount vào `CourseLesson`, và gán `id="lesson-article"` cho vùng đọc.
- **Design canon**: HeroUI + Tailwind, `AsyncContent` cho loading/empty/error, SWR, `next-intl`. Không emoji trong UI. i18n vi + en. `npm run build` (webpack) + `tsc --noEmit` phải sạch.

## Goals / Non-Goals

**Goals**
- Người học chọn model trả lời (default GPT-OSS-120B), danh sách từ `GET /api/v1/ai/models`.
- Bôi đen 1 đoạn trong vùng đọc → FAB → mở chat với đoạn làm ngữ cảnh (prepend ≤ 200 ký tự).
- OCR / hỏi đáp tài liệu ở tab Docs → hiển thị answer + citations → hỏi tiếp trong chat.
- Tái dùng tối đa store/hook/stream đã có; chỉ thêm 2 hook REST mới.

**Non-Goals**
- KHÔNG sửa backend, KHÔNG định nghĩa lại endpoint (chỉ tiêu thụ contract).
- KHÔNG đổi cơ chế stream socket hiện có (chỉ truyền thêm `model`/`provider`).
- KHÔNG xây upload tài liệu mới (dùng `documentId` từ `lesson.docs`); OCR async/job là việc BE.
- KHÔNG tự do color-pick / đổi design tokens.

## Decisions

### D1 — Model picker: hook REST `useQueryAiModelsMetaSwr`, default GPT-OSS-120B

- Module `src/modules/api/rest/ai-models/ai-models.ts`:
  ```ts
  export interface AiModelMeta {
      id: string            // OpenRouter id, vd "openai/gpt-oss-120b"
      label: string         // "GPT-OSS 120B"
      provider: string      // "OPENROUTER"
      vision: boolean
      defaultFor?: Array<string> // ["chat"] | ["ocr"] ...
      pricingHint?: string
  }
  // GET ${publicEnv().api.http}/ai/models  → envelope { code, message, data: { models: AiModelMeta[] } }
  export const getAiModels = async (): Promise<Array<AiModelMeta>> => { ... return data?.models ?? [] }
  ```
- Hook `src/hooks/swr/api/rest/queries/useQueryAiModelsMetaSwr.ts`: `useSWR(["QUERY_AI_MODELS_META_SWR"], getAiModels, { revalidateOnFocus:false, dedupingInterval: 30*60_000 })` — catalog đổi hiếm (BE cache Redis 30m). Trả `{ models, isLoading, error }`.
- **Default**: model đầu tiên có `defaultFor` chứa `"chat"`, fallback hằng `DEFAULT_CHAT_MODEL = "openai/gpt-oss-120b"` (khớp §1 contract) nếu list rỗng/chưa load. Set vào `useContentAiSelectedModel` khi `selectedModel == null` (chỉ 1 lần, tránh clobber lựa chọn người dùng).
- **Provider** forward cho stream: lấy `provider` của model đã chọn (từ meta), truyền vào `ask({ model, provider, mode:"premium" })`. Nếu người dùng để default (không đổi) → `mode:"auto"`, `model:null` (giữ chain hiện tại).

### D2 — Composer = 1 BOX (input flat + hàng controls), settings + conversations IN-PANEL

- Theo draft `ai-chat-composer-box-controls-and-settings-modal` (STRICT): composer là **1 box bounded** (`rounded-2xl border border-default bg-surface px-3 py-2 focus-within:border-accent`) chứa 2 tầng — (1) `<textarea>` **flat** (`bg-transparent text-sm outline-none placeholder:text-muted`, KHÔNG HeroUI Input), (2) hàng `[model picker ▾] · flex-1 · [⚙] [gửi]`. Dropdown model mở LÊN (`placement="top start"`). Nút ⚙/gửi = `isIconOnly` (`GearIcon`/`PaperPlaneTiltIcon` phosphor `size-5`, `aria-label`).
- Theo draft `content-ai-multi-session-conversations` (fix z-fight): overlay phụ mở TỪ TRONG popover → render **IN-PANEL** (state `view: "chat" | "conversations" | "settings"`), KHÔNG Drawer/Modal body-level (tránh `@apply z-50` baked của HeroUI đè popover). Mỗi view có nút back (`ArrowLeftIcon` + `common.back`).
  - `view==="settings"`: model trả lời (read-only context, vì đã chọn ở composer) + không còn "Xoá lịch sử" trần (multi-session → delete per-row ở conversations).
  - `view==="conversations"`: `SearchInput variant="secondary"` (KHÔNG hand-roll `<div border><input>`) + list `ScrollShadow hideScrollBar` + `InfiniteScrollSentinel` (mirror `useSWRInfinite`) + "cuộc mới" + delete per-row.

### D3 — Multi-session: lazy-create, hydrate theo session, reset chỉ trong handler

- Theo draft `content-ai-multi-session-conversations` (STRICT gotchas):
  - **Lazy-create**: "cuộc mới" = `currentSessionId=null` + thread rỗng; session chỉ tạo khi GỬI tin đầu (`useMutateCreateContentAiSessionSwr` → id → set current → `ask`). Sau create set `hydratedRef = sessionId`.
  - **Hydrate theo SESSION**: `useQueryContentAiHistorySwr(sessionId)`, hydrate-once-per-session (`hydratedRef === sessionId`).
  - **Reset thread CHỈ trong `onSwitch`/`onNew` (KHÔNG effect-on-[sessionId])** — create-mid-send cũng đổi `currentSessionId`, reset trong effect sẽ xoá turn vừa append.
  - Auto-open most-recent session (chỉ session CÓ nội dung) khi đổi bài; "cuộc mới" set null nhưng ref giữ.

### D4 — Selection-anchored FAB (`ContentAiSelectionAsk`)

- Theo draft `ai-selection-anchored-ask-passage` (STRICT):
  - Nghe `mouseup`/`touchend`; chỉ hiện nút khi `window.getSelection()` range nằm TRONG `getElementById("lesson-article")` + text ≥ vài ký tự. Nút = `createPortal(document.body)` + `position:fixed` tại `range.getBoundingClientRect()`, `z` trên FAB (z-40) dưới panel. `onMouseDown preventDefault` trên wrapper để giữ selection sống tới click. Ẩn khi selection collapse (`selectionchange`) / scroll / resize.
  - Click → `setSelection(passage, surroundingParagraph)` (store) → `open()` chat. Chat đọc `selection` → banner quote (`line-clamp-2` + × bỏ chọn) + 3 chip scoped (`selectionSuggestions.{explain,example,simplify}`).
  - Gửi = **PREPEND** `aboutPassage` quote (cap 200 ký tự) vào câu hỏi — KHÔNG đụng BE; `selectionContext` gửi kèm làm HIDDEN grounding (không hiển thị). Quote là 1 phần message → thread nhất quán khi reload.
  - **KHÔNG clear selection lúc MOUNT** — panel remount mỗi lần mở; chỉ clear khi content ĐỔI THẬT (`prevContentIdRef !== contentId`).
  - Premium gate tự nhiên: khi `#lesson-article` có `select-none` (bài khoá) → không select được → FAB không hiện.
- **Mount**: `ContentAiSelectionAsk` mount 1 lần trong `CourseLesson` cạnh FAB `ContentAiChat`. Vùng đọc (tab overview) bọc `id="lesson-article"`.

### D5 — Document OCR / Q&A ở tab Docs của CourseLesson

- Module `src/modules/api/rest/ai-document-qa/ai-document-qa.ts`:
  ```ts
  export interface DocumentQaRequest { documentId?: string; lessonId?: string; selection?: string; question: string; model?: string }
  export interface DocumentQaResult { answer: string; citations: Array<{ ref: string; snippet: string }>; model: string; sessionId?: string }
  // POST ${publicEnv().api.http}/ai/document-qa  → envelope { code, message, data: DocumentQaResult }
  ```
- Hook `usePostDocumentQaSwr` (`useSWRMutation`, mirror `usePostAdminPresignedUrlSwr`): arg = `DocumentQaRequest` → trả `DocumentQaResult`.
- UI tab Docs: mỗi doc row thêm nút **"Hỏi tài liệu"** (`SparkleIcon`/`ChatCircleTextIcon`, `variant="ghost"`, `aria-label`) cạnh nút Download. Bấm → `question` mặc định (vd `contentAi.doc.ocrPrompt` = "Tóm tắt tài liệu này") HOẶC mở ô hỏi inline → gọi `usePostDocumentQaSwr({ documentId: doc.id, lessonId })`. Kết quả render trong panel `AsyncContent` (loading spinner khi mutation chạy): `answer` (markdown) + danh sách `citations` (snippet, click → không nav v1). Nút "Hỏi tiếp trong chat" → mở `ContentAiChat` với `sessionId` trả về (nếu có) hoặc session mới scoped tài liệu.
- **OCR** đúng nghĩa (ảnh/scan) do BE async job xử lý (contract §4.3) — FE chỉ gọi document-qa và nhận text/answer; nếu BE trả trạng thái "đang OCR" (job) thì hook hiển thị trạng thái chờ (v1: dựa `answer` rỗng + message → "Đang xử lý tài liệu…").

### D6 — Mount points trong `CourseLesson/index.tsx`

- Vùng overview (dòng ~204-208): bọc `<div id="lesson-article" className={isLocked ? "select-none" : undefined}>…markdown…</div>` (isLocked = bài premium chưa mở — tái dùng cờ premium sẵn có của lesson; mock: `lesson.isPremium && !purchased`).
- Tab Docs (dòng ~209-231): thêm nút "Hỏi tài liệu" + panel kết quả doc-QA.
- Cuối component (trước `</div>` bao ngoài): mount `<ContentAiChat contentId={lessonId} />` (FAB + panel) và `<ContentAiSelectionAsk contentId={lessonId} />`. FAB `fixed bottom-6 right-6 z-40`.

### D7 — i18n (mở rộng cụm `contentAi.*`, KHÔNG file locale mới)

Repo dùng `src/messages/vi.json` + `en.json` (1 file/locale). Cụm `contentAi.*` đã có nhiều khoá (title, hint, placeholder, send, pickModel, settings, modelLabel, suggestions.*, askAboutSelection, aboutPassage, selectionSuggestions.*, conversations, newConversation, untitled, searchConversations, deleteConversation, turnsCount…). **THÊM** các khoá còn thiếu:

| key | vi | en |
|---|---|---|
| `contentAi.modelPicker` | "Chọn model" | "Choose model" |
| `contentAi.modelDefault` | "Mặc định" | "Default" |
| `contentAi.modelVision` | "Nhận ảnh" | "Vision" |
| `contentAi.modelLoadError` | "Không tải được danh sách model" | "Could not load models" |
| `contentAi.doc.ask` | "Hỏi tài liệu" | "Ask this document" |
| `contentAi.doc.ocrPrompt` | "Tóm tắt tài liệu này giúp mình" | "Summarize this document for me" |
| `contentAi.doc.questionPlaceholder` | "Hỏi về tài liệu này…" | "Ask about this document…" |
| `contentAi.doc.processing` | "Đang xử lý tài liệu…" | "Processing document…" |
| `contentAi.doc.answerTitle` | "Trả lời" | "Answer" |
| `contentAi.doc.citations` | "Trích dẫn" | "Citations" |
| `contentAi.doc.continueInChat` | "Hỏi tiếp trong chat" | "Continue in chat" |
| `contentAi.doc.error` | "Không đọc được tài liệu. Thử lại sau." | "Could not read the document. Try again." |
| `contentAi.doc.empty` | "Chưa có câu trả lời." | "No answer yet." |

(`common.back` đã có; nếu chưa thì thêm.)

## Risks / Trade-offs

- [BE endpoint REST chưa sẵn khi FE land] → hook trả lỗi/empty; `AsyncContent`/mutation error UI hiện gọn ("Không tải được…"), KHÔNG crash, KHÔNG mock data giả REST. Ghi giả định trong tasks.
- [`#lesson-article` chưa từng tồn tại → selection scope có thể sai nếu quên gán id] → gán id ngay trong `CourseLesson` (D6) + tasks kiểm tra `getElementById` khớp.
- [Popover-on-popover z-fight] → tuân draft: settings/conversations render IN-PANEL, KHÔNG Drawer/Modal body-level.
- [Clobber lựa chọn model của user khi auto-set default] → chỉ set khi `selectedModel == null` (D1).
- [Reset thread xoá turn vừa gửi] → reset chỉ trong handler `onNew`/`onSwitch`, KHÔNG effect-on-[sessionId] (D3, draft gotcha).

## Migration Plan

1. Land 2 module REST + 2 hook SWR (models, document-qa) — độc lập, verify tsc.
2. Land `ContentAiChat` + `ContentAiComposer` + views (chat/conversations/settings) dùng hook đã có.
3. Land `ContentAiSelectionAsk` + gán `#lesson-article` trong `CourseLesson`.
4. Land nút OCR/Hỏi-tài-liệu ở tab Docs + panel kết quả; mount FAB.
5. i18n vi+en. Rollback = revert commit (FE-only, không migration dữ liệu).

## Open Questions

- Cờ `isLocked`/premium cho `select-none` lấy từ đâu ở `CourseLesson` mock — dùng `lesson.isPremium` + trạng thái enroll mock; chốt lúc implement, không chặn spec.
- Provider string cho model không thuộc OPENROUTER — v1 mọi model qua OPENROUTER (contract §1), provider = `"OPENROUTER"`.

## Formalized rules (nguồn luật của change)

- `.claude/rules/drafts/ai-selection-anchored-ask-passage.md` — selection-anchored entry (D4).
- `.claude/rules/drafts/ai-chat-composer-box-controls-and-settings-modal.md` — composer-in-box (D2).
- `.claude/rules/drafts/content-ai-multi-session-conversations.md` — multi-session + in-panel overlay (D2/D3).

Khi thầy chạy `/merge`, hợp nhất 3 draft này vào rule chính thức (repo hiện chỉ có `.claude/rules/drafts/`, chưa có thư mục rule "đã merge"); trước đó `design.md` này là điểm tham chiếu luật chính thức cho change.
