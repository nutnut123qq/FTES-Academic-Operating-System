# Tasks

## 1. Progress engine
- [x] 1.1 `analyzeProgress` — roll-up (%/đếm bài+chương), strengths, review
- [x] 1.2 Luật gợi ý ưu tiên: continue → finishModule → startModule → unlock → done
- [x] 1.3 Unit test `progress.test.ts` cho từng nhánh luật + roll-up

## 2. Panel UI
- [x] 2.1 `MindMapProgressPanel` nổi, thu gọn được: % tổng, thẻ gợi ý + CTA, chip điểm mạnh/cần hoàn thành
- [x] 2.2 Dark-mode safe (token), responsive (max-width, thu gọn)

## 3. Canvas highlight + wire
- [x] 3.1 `build.ts`: input `recommendedLessonId` → flag `isRecommended` trên lesson node
- [x] 3.2 `ContentNode`: viền nhấn + badge "Gợi ý"
- [x] 3.3 `index.tsx`: tính insight, truyền recommendedLessonId, render panel, `onOpenRecommendation` tái dùng `onOpenNode`
- [x] 3.4 i18n `learn.mindMap.progress.*` (en ICU plural, vi)

## 4. Verify
- [x] 4.1 `vitest` MindMap: 21/21 pass (6 engine + 15 index)
- [x] 4.2 `next build` xanh (Compiled + TypeScript + Generating static pages)
- [x] 4.3 `openspec validate mindmap-progress-assistant --strict`
