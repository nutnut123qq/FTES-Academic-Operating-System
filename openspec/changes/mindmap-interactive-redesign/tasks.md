# Tasks — mindmap-interactive-redesign

## 1. Canvas React-Flow tương tác (thay SVG toả tròn tĩnh)
- [x] 1.1 `MindMapCanvas.tsx`: SSR-safe mount + `ReactFlowProvider` + `ReactFlow` (theo canon `skill-graph`): `Background` dots, `Controls showInteractive={false}` (zoom + fit-view), `proOptions.hideAttribution`
- [x] 1.2 Node **kéo được** (`nodesDraggable`), canvas pan + zoom (`minZoom`/`maxZoom`), `useNodesState`/`useEdgesState` re-sync khi dữ liệu learn đổi
- [x] 1.3 `useMindMapFitView.ts`: camera ban đầu canh vào module "bạn ở đây" (zoom đọc được), không có thì fit toàn cây; click node gốc = fit lại toàn cây
- [x] 1.4 Đăng ký `nodeTypes` (root + content) qua `build.ts`; giữ `/learn/mind-map` full-bleed

## 2. Gốc = MÃ MÔN (không phải tên khóa)
- [x] 2.1 `resolveRootCode(subjectCode, title, courseId)`: ưu tiên `header.subjectCode`; fallback acronym viết hoa ≤6 ký tự từ tên khóa; cuối cùng slug courseId cắt ngắn
- [x] 2.2 `RootNode.tsx`: hiển thị mã môn (đậm) trên vòng % hoàn thành (`--separator` track + `--accent` arc), handle nguồn bên phải để fan-out
- [x] 2.3 Container truyền `subjectCode` + `progressPercent` vào `buildMindMap`

## 3. Bài tập thành node
- [x] 3.1 `build.ts`: cây tidy trái→phải root → module → lesson → **exercise**; mỗi `lesson.exercises` (challenge/assignment) = 1 node con; **chỉ tạo ở nơi có dữ liệu** (bài không exercise → không node)
- [x] 3.2 Bố cục không chồng: mỗi leaf 1 hàng, cha canh giữa theo trung bình Y của con; edge cha→con (accent, nhấn đường "bạn ở đây")
- [x] 3.3 `ContentNode.tsx`: icon theo loại (`exerciseSolverIcon`/`normalizeExerciseType` cho challenge, clipboard cho assignment), nhãn loại `mindMap.kind.{challenge,assignment}`
- [x] 3.4 `open.ts` `resolveNodeOpen`: exercise challenge → route solver theo slug; assignment → reader bài; exercise khóa → gate bài cha

## 4. Node 3 màu trạng thái (field `status` có kiểu)
- [x] 4.1 `status.ts`: `type MindMapNodeStatus = "completed" | "inProgress" | "notStarted"` + `STATUS_CARD_CLASS` (completed→`--success`, inProgress→`--warning`, notStarted→`--default`)
- [x] 4.2 `moduleStatus` (đủ bài xong→completed / có bài xong→inProgress / chưa→notStarted), `lessonStatus` (isCompleted→completed / else notStarted) — suy từ tín hiệu hoàn thành ĐÃ có
- [x] 4.3 `isModuleLocked`/`isExerciseLocked`: khóa bám lock THEO NGƯỜI XEM (`isLocked`), KHÔNG cờ premium tĩnh — trục riêng với `status`
- [x] 4.4 `exerciseStatus` tạm `notStarted` + **TODO(mindmap-backend-phase)** rõ: đợt backend feed status per-node THẬT (completed khi đạt, inProgress khi kết quả yếu / AI progress log đánh dấu)

## 5. i18n + test
- [x] 5.1 Thêm `learn.mindMap.{canvasAria,kind.challenge,kind.assignment}` ở CẢ `en.json` + `vi.json`
- [x] 5.2 `index.test.tsx`: buildMindMap (mã môn ở root + fallback; exercise thành node chỉ nơi có; "bạn ở đây"), status (3 trạng thái + lock theo người xem), `resolveNodeOpen` (route vs gate), container wiring (mã môn hiển thị, gate khi node khóa, route khi mở được)

## 6. Verify
- [x] 6.1 `npx tsc --noEmit` sạch (exit 0)
- [x] 6.2 `npm run build` (webpack) compiled successfully
- [x] 6.3 vitest `MindMap/index.test.tsx` xanh
