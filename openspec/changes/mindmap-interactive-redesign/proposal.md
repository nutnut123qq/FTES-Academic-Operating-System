# mindmap-interactive-redesign — Sơ đồ tư duy khóa học thành canvas React-Flow tương tác (kéo/pan/zoom), gốc = MÃ MÔN, có node bài tập, node 3 màu trạng thái

## Why
Sơ đồ tư duy hiện tại (`features/learn/MindMap`) chỉ là một map SVG toả tròn tĩnh: node
trung tâm là **tên khóa học đầy đủ** (dài → node lệch, không đồng đều), các node con chỉ là
"Phần N / x bài", **không kéo/pan/zoom được**, và **không thấy bài tập** đâu. So với StarCi
(bản gốc dựng trên `@xyflow/react` — kéo/pan/zoom/fit-view) thì FTES đang thua xa trải nghiệm,
dù FTES **đã sẵn phụ thuộc `@xyflow/react`** (React Flow v12) và đã có sẵn canvas React-Flow
canon trong repo (`features/skill-graph`).

Thầy chốt 3 điểm cho đợt này:
1. "để **mã môn học** tránh tình trạng để tên khóa học nó sẽ không đồng đều" → gốc = mã môn.
2. "có cả **bài tập** trong đó" → challenge/assignment thành node riêng.
3. Mỗi node có **3 màu trạng thái**: hoàn thành = XANH, đang làm/cảnh báo = CAM, chưa bắt đầu
   = trắng ngà nâu nhạt (neutral).

## What Changes
- **Canvas React-Flow tương tác thay cho SVG toả tròn tĩnh.** Port cơ chế canvas của StarCi
  (`ReactFlow` + `Background` + `Controls` fit-view + node types + `build` dựng nodes/edges +
  hook fit-view), nhưng đấu vào **dữ liệu learn của FTES** (`useQueryLearnCourseSwr`, REST/SWR —
  KHÔNG Redux như StarCi) và theo canon React-Flow sẵn có của repo (`skill-graph`: SSR-safe
  mount + `ReactFlowProvider` + `Controls showInteractive={false}` + `proOptions.hideAttribution`).
  Node **kéo được** (`nodesDraggable`), canvas **pan + zoom + nút fit-view**, camera tự canh vào
  module "bạn ở đây".
- **Gốc = MÃ MÔN, không phải tên khóa.** Node gốc hiển thị `header.subjectCode` (vd "CSD201")
  trên vòng % hoàn thành; khi khóa không gắn môn thì fallback về một **mã ngắn** (acronym viết
  hoa từ tên khóa, cắt ≤6 ký tự; cuối cùng là slug courseId cắt ngắn) — luôn gọn, mọi map đều đều.
- **Bài tập thành node.** Ngoài node module + node bài học, mỗi **exercise** của bài (challenge/
  assignment, lấy từ `lesson.exercises` sẵn có) render thành node con dưới bài — **chỉ tạo node
  ở nơi dữ liệu THẬT có** (bài không có exercise thì không đẻ node). Bố cục = cây tidy trái→phải
  (root → module → lesson → exercise), cha canh giữa theo trung bình Y của con nên không chồng.
- **Node 3 màu trạng thái (field `status` có kiểu).** Mỗi node nội dung mang
  `status: "completed" | "inProgress" | "notStarted"` → token màu: completed→`--success` (xanh),
  inProgress→`--warning` (cam), notStarted→`--default` (trắng ngà nâu nhạt). Suy ra từ **tín hiệu
  hoàn thành ĐÃ có** trên learn tree: module (đủ bài xong→xanh / có bài xong→cam / chưa→neutral),
  bài (isCompleted→xanh / chưa→neutral). Khóa premium (`isLocked`) là trục RIÊNG (mờ + ổ khóa),
  bám lock THEO NGƯỜI XEM (không dùng cờ premium tĩnh — khớp content-map).
- **Giữ route + hành vi cũ.** Vẫn ở `/learn/mind-map` (full-bleed). Click node = mở reader/solver
  đúng loại, hoặc mở **cùng PackageGateModal** content-map mở cho node khóa hẳn. Vẫn có nút
  "Tiếp tục học" + "đã hoàn thành" + chú giải (legend) 3 trạng thái.

## Out of scope (đợt backend SAU)
KHÔNG dựng đợt này: ghi nhật ký tiến độ AI xuống DB, cá nhân hóa, cảnh báo CAM theo **kết quả
bài tập** (điểm yếu / AI progress log), mentor/admin auto-generate. `exerciseStatus` tạm trả
`notStarted` + **TODO rõ** để đợt backend feed `status` per-node THẬT (completed khi đạt, inProgress
khi làm mà kết quả yếu / bị AI đánh dấu review). Field `status` đã có kiểu, sẵn sàng nhận.

## Capabilities
### New Capabilities
- `mindmap-interactive-redesign`: sơ đồ tư duy khóa học = canvas React-Flow kéo/pan/zoom/fit-view,
  gốc mã môn + vòng %, node bài tập, node 3 màu trạng thái (field `status` có kiểu, chờ backend feed).

## Impact
FE-only, nhánh `feat/mindmap-interactive-redesign`. Viết lại `features/learn/MindMap`:
`index.tsx` (container) + thêm `build.ts` (dựng cây + resolve mã gốc), `status.ts` (model 3
trạng thái + suy trạng thái + token màu + TODO backend), `open.ts` (route/gate), `RootNode.tsx`,
`ContentNode.tsx`, `MindMapCanvas.tsx`, `useMindMapFitView.ts`; đổi `index.test.tsx` sang cấu
trúc mới. i18n thêm `learn.mindMap.{canvasAria,kind.challenge,kind.assignment}` (en+vi). Không đụng
`useQueryLearnCourseSwr`, PackageGateModal, hay các route học khác. Verify: `npx tsc --noEmit`
(exit 0) + `npm run build` (webpack) + vitest MindMap xanh.
