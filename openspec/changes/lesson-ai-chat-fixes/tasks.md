# Tasks — lesson-ai-chat-fixes

## 1. Tính năng A — Passage đến model (fix ưu tiên cao nhất)
- [x] 1.1 Xác nhận store overlay có field context của selection (`contentAiSelectionContext` hoặc tương đương do `ContentAiSelectionAsk.setSelection(text, context)` set); thiếu → thêm field serializable — ĐÃ CÓ SẴN (`contentAiSelectionContext` trong store + `selectionContext` expose qua `useContentAiSelection`)
- [x] 1.2 `ContentAiChat.onSend`: build `sent` (quote passage đầy đủ ≤600 + câu hỏi + khối context đánh dấu dữ liệu) — gửi `sent`, bubble giữ `display`; user turn lưu `{content: sent, display}` — i18n key `reader.ai.passageContext` (vi+en) cho nhãn khối dữ liệu tham chiếu
- [x] 1.3 Unit test (RTL): có selection → fetch body chứa passage + context block, bubble chỉ hiện display; không selection → body = raw — ĐÃ TRẢ NỢ 2026-07-22 trong repo chính (vitest sẵn): `src/components/features/learn/ContentAiChat/index.test.tsx` (3 case passage-context: full passage + `[passageContext: …]` ride stream body, bubble chỉ display truncate + clear selection sau gửi, không selection → body = raw) — vitest xanh
- [ ] 1.4 e2e tay (npm run dev, account student): bôi đen đoạn → hỏi → câu trả lời bám đúng đoạn
- [ ] 1.5 **Vòng chất lượng**: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2

## 2. Tính năng B — Model picker
- [x] 2.1 Hook `useQueryAiModelCatalogSwr` (SWR, `listAiCatalogModels`, key GET_AI_MODEL_CATALOG) — ĐÃ CÓ SẴN trong repo: `useGetAiCatalogModelsSwr` (key `GET_AI_CATALOG_MODELS_SWR`, dedupe 30′, no revalidateOnFocus) → dùng lại, KHÔNG tạo hook trùng
- [x] 2.2 Store overlay `contentAiSelectedModel` (string|null) — ĐÃ CÓ SẴN (`contentAiSelectedModel` + `setContentAiSelectedModel` trong store; hook `useContentAiSelectedModel`) → dùng lại
- [x] 2.3 Composer: hàng controls TRONG box (dropdown model `placement="top start"` mở LÊN + nút gửi); catalog lỗi/rỗng (`!error && models.length>0`) → ẩn picker, chat vẫn chạy không gửi `model`. Label = short-name (phần sau `/`), `SparkleIcon`+`CaretUpIcon`, style muted khớp composer (mirror `SubjectAiTutor`)
- [x] 2.4 REST client: `createSession` (types `CreateSessionRequest.model?`) + `sendSessionMessageStream(sessionId, content, handlers, model?)` body `{content, ...(model?{model}:{})}`; `onDone(data)` parse `data.modelUsed` (đã có sẵn trong `SessionStreamHandlers`)
- [x] 2.5 Bubble assistant caption `answeredBy` (Typography body-xs muted) khi có `modelUsed`; event `error` code `AI_MODEL_NOT_ALLOWED` → `t("reader.ai.modelNotAllowed")` + `setSelectedModel(null)` (reset default); i18n vi+en (`modelLabel`/`answeredBy`/`modelNotAllowed`)
- [x] 2.6 Unit test: default từ catalog, model ride body, remount giữ model, degrade khi catalog lỗi, caption render — ĐÃ TRẢ NỢ 2026-07-22: cùng file `ContentAiChat/index.test.tsx` (7 case: default `defaults.chat` ride createSession+stream, model chọn ride body + remount giữ qua store, catalog lỗi/rỗng → ẩn picker + không gửi model, `AI_MODEL_NOT_ALLOWED` → reset default + notice, caption `answeredBy` từ done event ± modelUsed) — vitest xanh
- [ ] 2.7 e2e tay: đổi model → gửi → caption khớp model chọn — CHẶN: auth-gated (STUDENT), không chạy được trong phiên headless này
- [~] 2.8 **Vòng chất lượng**: unit/e2e bị chặn (không runner + auth-gated); verify tĩnh thay thế: `tsc --noEmit` sạch + `npm run build` (webpack) ✓ Compiled successfully + `openspec validate --strict` PASS

## 3. Tính năng C — Anchored panel
- [x] 3.1 Store: `contentAiAnchorRect` (snapshot serializable `AnchorRect {top,left,right,bottom,width,height}`) + open state qua overlay key `contentAiAnchored`; hook `useContentAiAnchoredPanel` (mirror `useAdModalOverlayState`: `open(rect)` stash rect+open, `close()` clear rect)
- [x] 3.2 `ContentAiSelectionAsk.onAsk`: snapshot full rect lúc đọc selection; desktop (`!isMobile`) → `openAnchored(rect)`; mobile → giữ `open()` bottom-sheet FAB hiện tại
- [x] 3.3 `ContentAiAnchoredChat` (mới, mount ở `learn/layout.tsx`): portal `document.body` fixed z-50 (~360px, max 70vh), đặt phải→flip trái→dưới-centered, clamp top/left trong viewport; measure height qua `useLayoutEffect` + reposition on resize (visibility hidden tới khi có pos → không nháy); header (SparkleIcon + title + CloseButton) + `<ContentAiChat/>`
- [x] 3.4 Đóng: Esc / pointer-down ngoài (bỏ qua portal dropdown model `[data-slot="dropdown-popover"],[role=menu/listbox/dialog]`) / đổi bài THẬT (`prevContentIdRef`, KHÔNG clear-on-mount) → `dismiss()` = close + clear selection
- [x] 3.5 Unit test: định vị 3 nhánh (phải/trái/dưới), clamp, close handlers, intent không bị reset lúc mount; mobile không render panel — ĐÃ TRẢ NỢ 2026-07-22: `ContentAiChat/ContentAiAnchoredChat.test.tsx` (10 case: 3 nhánh định vị + clamp top; Esc / pointer-down ngoài (menu portal KHÔNG đóng) / CloseButton — đều clear selection; mount panel mở KHÔNG reset selection, đổi contentId thật mới dismiss; ContentAiSelectionAsk desktop → anchored + rect snapshot, mobile (mock matchMedia ≤640px) → bottom-sheet FAB, panel không render) — vitest xanh
- [ ] 3.6 e2e tay: desktop bôi đen giữa/bên mép phải trang; mobile 375px bottom-sheet — CHẶN: auth-gated (STUDENT), không chạy headless
- [~] 3.7 **Vòng chất lượng**: unit/e2e bị chặn (không runner + auth-gated); verify tĩnh thay thế: `tsc --noEmit` sạch + `npm run build` (webpack) ✓ + `openspec validate --strict` PASS

## 4. Verify
- [~] 4.1 `tsc --noEmit` sạch ✓ + `openspec validate lesson-ai-chat-fixes --strict` PASS ✓ (re-verify 2026-07-17, feature C anchored-panel đã implement đủ 3.1-3.4). `npm run build` (webpack) đã xanh ở phiên trước (3.7); không đổi source từ đó.
