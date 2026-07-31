# mindmap-side-handles-tidy — Đường nối sơ đồ tư duy vào cạnh thẻ gọn gàng (handle 2 bên + bezier gốc)

## Why
Sơ đồ tư duy là cây 2 phía (root giữa, phần nhánh trái/phải, con xếp cột hướng ra ngoài) nhưng
handle của node đặt ở TÂM, không có hướng cạnh. Bản vá trước (cắt về biên theo tia tâm→tâm) làm
con lệch phương dọc bị nối vào cạnh TRÊN/DƯỚI → đường **hở + rối, không trật tự** (thầy phản hồi).

## What Changes
- **Node có handle ở 2 CẠNH** (`ContentNode`, `RootNode`): mỗi thẻ có handle target/source ở giữa
  cạnh trái + phải (vô hình). Root chỉ source 2 cạnh.
- **`buildMindMap.link` chọn cặp handle theo phía nhánh (`sign`)**: nhánh phải → source-RIGHT của
  cha → target-LEFT của con; nhánh trái → source-LEFT → target-RIGHT. Truyền `sign` vào 3 chỗ gọi
  `link` (root→module, module→lesson, lesson→exercise).
- **`MindMapCurvedEdge` dùng `getBezierPath` gốc của React Flow** với `sourcePosition`/`targetPosition`
  do handle cạnh cung cấp → đường S mượt, RỜI/VÀO thẻ theo phương ngang, **áp sát cạnh** thẻ, không
  đâm vào giữa, không hở. Bỏ logic cắt-biên (`useInternalNode`). Giữ helper thuần `curvedEdgePath`
  cho unit test.

## Capabilities
### Modified Capabilities
- `course-mind-map`: đường nối vào/ra ở CẠNH thẻ (trái/phải theo phía nhánh), gọn gàng, không hở/đâm.

## Impact
FE-only, 4 file (`ContentNode`, `RootNode`, `build.ts`, `CurvedEdge.tsx`). MindMap test 29 pass.
