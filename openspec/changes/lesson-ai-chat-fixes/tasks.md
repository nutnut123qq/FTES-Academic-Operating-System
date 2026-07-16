# Tasks — lesson-ai-chat-fixes

## 1. Tính năng A — Passage đến model (fix ưu tiên cao nhất)
- [ ] 1.1 Xác nhận store overlay có field context của selection (`contentAiSelectionContext` hoặc tương đương do `ContentAiSelectionAsk.setSelection(text, context)` set); thiếu → thêm field serializable
- [ ] 1.2 `ContentAiChat.onSend`: build `sent` (quote passage đầy đủ ≤600 + câu hỏi + khối context đánh dấu dữ liệu) — gửi `sent`, bubble giữ `display`; user turn lưu `{content: sent, display}`
- [ ] 1.3 Unit test (RTL): có selection → fetch body chứa passage + context block, bubble chỉ hiện display; không selection → body = raw
- [ ] 1.4 e2e tay (npm run dev, account student): bôi đen đoạn → hỏi → câu trả lời bám đúng đoạn
- [ ] 1.5 **Vòng chất lượng**: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2

## 2. Tính năng B — Model picker
- [ ] 2.1 Hook `useQueryAiModelCatalogSwr` (SWR, `listAiCatalogModels`, key GET_AI_MODEL_CATALOG)
- [ ] 2.2 Store overlay `contentAiSelectedModel` (string|null) — tra `hooks/zustand/overlay`, thêm nếu chưa có trong repo này
- [ ] 2.3 Composer: hàng controls trong box (dropdown model `placement="top start"` + nút gửi); catalog lỗi/rỗng → ẩn picker
- [ ] 2.4 REST client: `createSession`/`sendSessionMessageStream` thêm `model` optional; `onDone` parse `modelUsed`
- [ ] 2.5 Bubble assistant caption `answeredBy` khi có `modelUsed`; error `AI_MODEL_NOT_ALLOWED` → message + reset default; i18n vi+en
- [ ] 2.6 Unit test: default từ catalog, model ride body, remount giữ model, degrade khi catalog lỗi, caption render
- [ ] 2.7 e2e tay: đổi model → gửi → caption khớp model chọn
- [ ] 2.8 **Vòng chất lượng**: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2

## 3. Tính năng C — Anchored panel
- [ ] 3.1 Store: `contentAiAnchorRect` (snapshot serializable) + `contentAiAnchoredOpen`
- [ ] 3.2 `ContentAiSelectionAsk.onAsk`: desktop → set rect + mở anchored; mobile → giữ luồng bottom-sheet hiện tại
- [ ] 3.3 `ContentAiAnchoredChat` (mới, mount ở `learn/layout.tsx`): portal fixed z-50, đặt phải→flip trái→dưới, clamp viewport, header + `<ContentAiChat/>`
- [ ] 3.4 Đóng: Esc / pointer-down ngoài / đổi bài THẬT (prevContentIdRef — không clear-on-mount) → clear selection
- [ ] 3.5 Unit test: định vị 3 nhánh (phải/trái/dưới), clamp, close handlers, intent không bị reset lúc mount; mobile không render panel
- [ ] 3.6 e2e tay: desktop bôi đen giữa/bên mép phải trang; mobile 375px bottom-sheet
- [ ] 3.7 **Vòng chất lượng**: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2

## 4. Verify
- [ ] 4.1 `npm run build` (webpack) xanh + `tsc --noEmit` sạch; `openspec validate lesson-ai-chat-fixes --strict` PASS
