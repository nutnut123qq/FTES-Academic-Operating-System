# lesson-ai-chat-fixes — Gửi đoạn bôi đen cho AI, model picker trong composer, panel neo theo selection

## Why

Xác minh code 2026-07-16 (user đang dính bug):

1. **AI không thấy đoạn được hỏi**: `ContentAiChat/index.tsx` dòng ~88 build `display`
   có quote `aboutPassage` nhưng dòng ~136 gọi `sendSessionMessageStream(sessionId, raw, …)`
   — gửi RAW không kèm đoạn bôi đen. Quote chỉ nằm trong bubble hiển thị → model trả lời
   không liên quan tới đoạn user hỏi.
2. **Không có model picker**: composer chỉ có textarea + nút gửi; BE đã có
   `GET /api/v1/ai/models` (`listAiCatalogModels` sẵn trong `modules/api/rest/ai`) và
   (change BE `ai-tutor-grounding-and-model-pick`) session/message nhận `model` + `done`
   event trả `modelUsed`. Draft rule `ai-chat-composer-box-controls-and-settings-modal`
   đã chốt vị trí: controls TRONG box composer, dropdown mở LÊN.
3. **Chat mở sai chỗ khi hỏi theo selection**: `ContentAiSelectionAsk` chỉ set store +
   `open()` FAB popover cố định góc — user bôi đen giữa bài phải liếc xuống góc màn hình.
   Cần panel chat ANCHORED cạnh vùng bôi đen (portal + `range.getBoundingClientRect()`,
   flip khi chạm mép, mobile giữ bottom-sheet); FAB góc vẫn giữ cho luồng thường.

## What Changes

- **Gửi passage cho model**: `onSend` gửi content = quote `aboutPassage` + câu hỏi
  (+ khối ngữ cảnh đoạn cha, đánh dấu là dữ liệu) — bubble giữ nguyên `display` như cũ.
- **Model picker trong composer** (đúng draft rule): hàng controls
  `[model picker ▾] · flex-1 · [gửi]` BÊN TRONG box composer; catalog từ
  `listAiCatalogModels` (hook SWR mới `useQueryAiModelCatalogSwr`); default
  `openai/gpt-oss-120b`; model gửi kèm mỗi message; bubble assistant hiển thị
  `modelUsed` (caption nhỏ) từ `done` event.
- **Panel neo theo selection**: component mới `ContentAiAnchoredChat` — desktop: portal
  panel ~360px cạnh selection rect (flip trái/phải/trên/dưới khi chạm mép, đóng khi
  click-ngoài/Esc); mobile (<sm): bottom-sheet. Render CHUNG `ContentAiChat` bên trong.
  FAB + popover góc giữ nguyên cho luồng không-selection.

## Capabilities

### New Capabilities
- `lesson-ai-passage-to-model`: nội dung gửi BE chứa đoạn bôi đen + ngữ cảnh, bubble không đổi.
- `lesson-ai-model-picker`: chọn model trong composer, hiển thị model đã trả lời.
- `lesson-ai-anchored-panel`: chat mở neo cạnh vùng bôi đen, mobile bottom-sheet.

### Modified Capabilities
- Không có delta spec content-AI sẵn có trong `openspec/specs/` của repo này.

## Impact

- `src/components/features/learn/ContentAiChat/index.tsx` — send content, composer
  controls, modelUsed caption.
- `src/components/features/learn/LessonReader/ContentAiSelectionAsk/index.tsx` — mở
  anchored panel thay vì chỉ `open()` FAB.
- `src/components/features/learn/ContentAiAnchoredChat/index.tsx` (MỚI).
- `src/modules/api/rest/ai/ai.ts` — `createSession`/`sendSessionMessageStream` thêm
  `model`; parse `modelUsed` từ `done`.
- `src/hooks/swr/...` — hook mới `useQueryAiModelCatalogSwr`; zustand overlay: field
  `contentAiSelectedModel` (nếu chưa có trong store repo này thì thêm), field
  `contentAiAnchorRect` (serializable) cho panel neo.
- `src/messages/vi.json` + `en.json` — khoá `learn.reader.ai.{modelLabel,modelUsedBy,...}`.
- FE-only; contract BE model/modelUsed phụ thuộc change BE
  `ai-tutor-grounding-and-model-pick` — chưa có BE thì picker vẫn render nhưng gửi
  `model` bị BE bỏ qua (field thừa vô hại), `modelUsed` ẩn khi thiếu.
