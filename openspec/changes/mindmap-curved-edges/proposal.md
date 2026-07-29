# mindmap-curved-edges — Sơ đồ tư duy: đường dẫn UỐN CONG thay vì thẳng tắp

## Why
Thầy nêu (tiếng Việt): *"Phần mindmap thì tôi cần các đường dẫn uốn cong nhé, đừng thẳng tắp như
vậy"*. Sơ đồ tư duy khóa học (`features/learn/MindMap`, canvas `@xyflow/react`) sau đợt radial
(`mindmap-radial-progressive`) nối các node bằng **nan hoa THẲNG tâm→tâm** (`type: "straight"`) — trông
cứng, thiếu cảm giác "bản đồ tư duy". Cần đổi các connector sang **đường CONG** cho mềm mại.

## What Changes
- **Connector đổi từ thẳng → CONG.** Thêm edge tùy biến `MindMapCurvedEdge` (`CurvedEdge.tsx`,
  `type: "mindMapCurved"`) vẽ **quadratic-bezier bowed**: control point đặt ở **trung điểm** nan hoa,
  đẩy **VUÔNG GÓC** với đường thẳng một đoạn `curvature · length` (cap ~90px) → mọi connector cong đều,
  nhất quán **bất kể hướng nhánh toả** trong layout radial. Dùng path tự dựng (không dùng bezier
  built-in) vì handle nằm ở **tâm node, không có hướng** → bezier-theo-handle sẽ ra gần thẳng; còn một
  dấu vuông-góc **cố định** giúp mọi cạnh cong cùng chiều xoay (pinwheel gọn, không lẫn trái/phải).
- **Giữ nguyên phần còn lại của radial/progressive.** `build.ts` chỉ đổi `link()` phát
  `type: "mindMapCurved"` (thay `"straight"`); vị trí radial, expand/collapse, click-bài-để-học, mô tả
  node **không đổi**. Handle vẫn ở **tâm node** (ẩn) nên endpoint arc nằm ở tâm, **giấu dưới card**, chỉ
  lộ đoạn cong giữa 2 card.
- **Edge nằm DƯỚI card + đọc rõ hơn.** React Flow render lớp edge dưới lớp node sẵn → cong vẫn nằm dưới
  card. Stroke nhích dày nhẹ (`1.75` thường / `2.75` current) + opacity `0.5/1` để **đường cong đọc rõ**
  nhưng vẫn kín đáo (accent muted). Cạnh của lộ trình hiện tại (`isCurrent`) vẫn `animated`.
- **Canvas đăng ký edge type.** `MindMapCanvas` thêm `edgeTypes={{ mindMapCurved: MindMapCurvedEdge }}`
  truyền vào `ReactFlow`.

## Out of scope
KHÔNG đụng backend, KHÔNG đổi layout radial / progressive disclosure / route học / PackageGate / trạng
thái node — **chỉ đổi HÌNH DẠNG cạnh** sang cong. Không thêm mũi tên (marker) hay nhãn cạnh. Handle vẫn ở
tâm (không tính hướng theo góc) vì path cong tự dựng đã lo độ cong đều mọi hướng.

## Capabilities
### New Capabilities
- `mindmap-curved-edges`: connector của sơ đồ tư duy vẽ thành **đường cong** (quadratic-bezier bowed
  tâm→tâm), thay nan hoa thẳng, giữ endpoint ở tâm node (ẩn dưới card).

## Impact
FE-only, nhánh `fix/mindmap-curved-edges`. Sửa `features/learn/MindMap`: **mới** `CurvedEdge.tsx`
(edge tùy biến + helper `curvedEdgePath` + hằng `CURVED_EDGE_TYPE`); `build.ts` (`link()` phát
`type: mindMapCurved`, stroke dày nhẹ); `MindMapCanvas.tsx` (`edgeTypes`); `ContentNode.tsx` /
`RootNode.tsx` (chỉ sửa doc-comment "straight spoke" → "curved"); `index.test.tsx` (thêm test cạnh cong
+ helper path bow). KHÔNG đụng `useQueryLearnCourseSwr`, `open.ts`, `status.ts`, `progress.ts`,
`useMindMapFitView.ts`, i18n hay PackageGateModal. Verify: `npx tsc --noEmit` (exit 0) + vitest
`MindMap/index.test.tsx` xanh + `npm run build` (webpack — CHẬM trong env này, có thể timeout;
CI/Vercel verify).
