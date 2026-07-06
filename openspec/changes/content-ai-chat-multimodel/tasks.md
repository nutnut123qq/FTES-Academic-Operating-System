# Tasks — content-ai-chat-multimodel

## 1. Tầng REST + hook (models, document-qa)

- [ ] 1.1 `src/modules/api/rest/ai-models/ai-models.ts` + `types.ts`: `AiModelMeta` (id/label/provider/vision/defaultFor?/pricingHint?), `getAiModels()` GET `${publicEnv().api.http}/ai/models`, đọc envelope `{code,message,data:{models}}`, trả `models ?? []` (axios pattern nhà). Hằng `DEFAULT_CHAT_MODEL = "openai/gpt-oss-120b"`
- [ ] 1.2 `src/hooks/swr/api/rest/queries/useQueryAiModelsMetaSwr.ts`: `useSWR(["QUERY_AI_MODELS_META_SWR"], getAiModels, { revalidateOnFocus:false, dedupingInterval:1800000 })`; trả `{ models, isLoading, error }` + helper `defaultChatModel(models)`
- [ ] 1.3 `src/modules/api/rest/ai-document-qa/ai-document-qa.ts` + `types.ts`: `DocumentQaRequest` (documentId?/lessonId?/selection?/question/model?), `DocumentQaResult` (answer/citations[]/model/sessionId?), `postDocumentQa(req)` POST `/ai/document-qa`, đọc envelope `data`
- [ ] 1.4 `src/hooks/swr/api/rest/mutations/usePostDocumentQaSwr.ts`: `useSWRMutation` mirror `usePostAdminPresignedUrlSwr`; arg `DocumentQaRequest` → `DocumentQaResult`. Cập nhật `src/hooks/swr/api/rest/mutations/index.ts` nếu có barrel
- [ ] 1.5 Verify tầng REST: `tsc --noEmit` sạch; `npm run build` (webpack) xanh

## 2. ContentAiChat (panel + composer + views)

- [ ] 2.1 `src/components/features/course/ContentAiChat/index.tsx`: FAB (`fixed bottom-6 right-6 z-40`, icon chat, `aria-label` `contentAi.title`) + panel popover; state `view: "chat" | "conversations" | "settings"`; thread render turn (user/assistant), streaming append qua `useContentAiStream`; đọc `useContentAiChatOverlayState`
- [ ] 2.2 `ContentAiChat/ContentAiComposer.tsx`: **1 BOX** (`rounded-2xl border border-default bg-surface px-3 py-2 focus-within:border-accent`) chứa `<textarea>` flat + hàng `[model picker ▾] · flex-1 · [⚙] [gửi]`; model picker `placement="top start"` từ `useQueryAiModelsMetaSwr`, ghi `useContentAiSelectedModel`, default GPT-OSS-120B khi `selectedModel==null` (set 1 lần); nút ⚙/gửi `isIconOnly` + `aria-label`. KHÔNG dùng HeroUI Input cho ô nhập
- [ ] 2.3 `ContentAiChat/ContentAiSettingsView.tsx`: view in-panel — model trả lời (read-only context) + back; KHÔNG "xoá lịch sử" trần
- [ ] 2.4 `ContentAiChat/ContentAiConversationsView.tsx`: `SearchInput variant="secondary"` + list `ScrollShadow hideScrollBar` + `InfiniteScrollSentinel` (dùng `useQueryContentAiSessionsInfiniteSwr`) + "cuộc mới" + delete per-row (`useMutateClearContentAiHistorySwr`/deleteSession); back
- [ ] 2.5 Multi-session logic: lazy-create (`useMutateCreateContentAiSessionSwr` khi gửi tin đầu), hydrate theo session (`useQueryContentAiHistorySwr(sessionId)`, `hydratedRef`), reset thread CHỈ trong `onNew`/`onSwitch` (KHÔNG effect-on-[sessionId]); auto-open latest session CÓ nội dung khi đổi bài
- [ ] 2.6 Stream: `ask({ sessionId, contentId, question, history, mode, model, provider })` — mode `"premium"`+model/provider khi user chọn model; `"auto"`+model:null khi để mặc định. `abort()` khi đóng/hủy
- [ ] 2.7 Verify: `tsc --noEmit` sạch, `npm run build` xanh; không popover-on-popover (settings/conversations in-panel)

## 3. Selection-anchored FAB (ContentAiSelectionAsk)

- [ ] 3.1 `src/components/features/course/ContentAiSelectionAsk/index.tsx`: nghe `mouseup`/`touchend`, chỉ hiện khi selection TRONG `#lesson-article` + text ≥ vài ký tự; nút `createPortal(document.body)` `position:fixed` tại `getBoundingClientRect()`, `onMouseDown preventDefault`; ẩn khi collapse/scroll/resize
- [ ] 3.2 Click → `setSelection(passage, surroundingParagraph)` + `open()` chat (đoạn văn bao quanh = `closest("p")?.textContent`)
- [ ] 3.3 `ContentAiChat`: đọc `useContentAiSelection` → banner quote (`line-clamp-2` + × bỏ chọn) + 3 chip `selectionSuggestions.*`; gửi PREPEND `aboutPassage` quote (cap 200) + `selectionContext` làm hidden grounding; clear selection sau gửi/×/đổi bài
- [ ] 3.4 KHÔNG clear selection lúc mount — clear chỉ khi content đổi thật (`prevContentIdRef !== contentId`)
- [ ] 3.5 Verify: bôi đen trong `#lesson-article` → FAB hiện → mở chat kèm quote; bài `select-none` → FAB không hiện; `tsc`/build sạch

## 4. OCR / Hỏi tài liệu ở tab Docs (CourseLesson)

- [ ] 4.1 `CourseLesson/index.tsx` tab overview: bọc vùng đọc `id="lesson-article"` (+ `select-none` khi bài khoá)
- [ ] 4.2 Tab Docs: mỗi doc row thêm nút "Hỏi tài liệu" (`aria-label` `contentAi.doc.ask`) cạnh Download; bấm → gọi `usePostDocumentQaSwr({ documentId: doc.id, lessonId })` với `question` = `contentAi.doc.ocrPrompt` hoặc ô hỏi inline
- [ ] 4.3 Panel kết quả (`AsyncContent`/spinner khi mutation): `answer` (markdown) + list `citations` + nút "Hỏi tiếp trong chat" (mở `ContentAiChat`, dùng `sessionId` trả về nếu có); trạng thái `doc.processing` khi answer rỗng
- [ ] 4.4 Mount `<ContentAiChat contentId={lessonId} />` + `<ContentAiSelectionAsk contentId={lessonId} />` cuối `CourseLesson`
- [ ] 4.5 Verify: bấm "Hỏi tài liệu" → gọi đúng endpoint, hiện answer/citations; BE thiếu → lỗi gọn không crash; `tsc`/build sạch

## 5. i18n + hoàn thiện

- [ ] 5.1 Mở rộng cụm `contentAi.*` trong `src/messages/vi.json` + `en.json`: `modelPicker`, `modelDefault`, `modelVision`, `modelLoadError`, `doc.{ask,ocrPrompt,questionPlaceholder,processing,answerTitle,citations,continueInChat,error,empty}`; thêm `common.back` nếu thiếu. JSON hợp lệ, không key thô lộ
- [ ] 5.2 (Formalize rules) Tham chiếu 3 draft trong `design.md` §Formalized rules; nếu thầy chạy `/merge` thì hợp nhất vào rule chính thức
- [ ] 5.3 Verify cuối: `npm run build` (webpack) xanh + `tsc --noEmit` sạch; `openspec validate content-ai-chat-multimodel --strict` pass

## Test 3 vòng

- [ ] V1 (biên dịch): `tsc --noEmit` sạch, `npm run build` (webpack) xanh, JSON messages hợp lệ, `openspec validate content-ai-chat-multimodel` pass
- [ ] V2 (tương tác tay): model picker load + đổi model → câu sau dùng model đã chọn; bôi đen `#lesson-article` → FAB → chat kèm quote ≤200; tab Docs "Hỏi tài liệu" → answer + citations → "Hỏi tiếp trong chat"; multi-session tạo/đổi/xoá không mất turn; vi↔en đủ nhãn
- [ ] V3 (biên/hồi quy): BE endpoint thiếu → lỗi gọn không crash; bài `select-none` → FAB không hiện; đóng/mở panel không mất selection vừa set; reload giữ thread session; không cảnh báo hydration, không popover-on-popover z-fight
