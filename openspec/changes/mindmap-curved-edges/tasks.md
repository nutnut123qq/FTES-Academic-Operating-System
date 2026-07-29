# Tasks — mindmap-curved-edges

## 1. Edge tùy biến CONG (thay nan hoa thẳng)
- [x] 1.1 `CurvedEdge.tsx` (mới): hằng `CURVED_EDGE_TYPE = "mindMapCurved"` + component `MindMapCurvedEdge` render `BaseEdge` với path tự dựng
- [x] 1.2 Helper `curvedEdgePath(sx, sy, tx, ty)`: quadratic-bezier `M sx,sy Q cx,cy tx,ty`, control point = trung điểm nan hoa đẩy **vuông góc** một đoạn `min(MAX_BOW, length·CURVATURE)` (dấu vuông-góc CỐ ĐỊNH → mọi cạnh cong cùng chiều)
- [x] 1.3 Endpoint arc vẫn ở **tâm node** (handle tâm ẩn không đổi) → cong giấu dưới card, chỉ lộ đoạn giữa 2 card

## 2. Nối vào build + canvas
- [x] 2.1 `build.ts`: `link()` phát `type: CURVED_EDGE_TYPE` (thay `"straight"`); import `CURVED_EDGE_TYPE`
- [x] 2.2 `build.ts`: `edgeStyle` nhích stroke dày nhẹ (`1.75` thường / `2.75` current) + opacity `0.5/1` để đường cong đọc rõ; giữ `animated` cho cạnh current
- [x] 2.3 `MindMapCanvas.tsx`: `EDGE_TYPES = { [CURVED_EDGE_TYPE]: MindMapCurvedEdge }` + truyền `edgeTypes={EDGE_TYPES}` vào `ReactFlow`
- [x] 2.4 Giữ nguyên layout radial / progressive / route học / trạng thái node — chỉ đổi hình dạng cạnh; sửa doc-comment "straight spoke" → "curved" ở `ContentNode.tsx` / `RootNode.tsx`

## 3. Test
- [x] 3.1 `index.test.tsx`: describe "connectors are CURVED" — mọi edge `type === CURVED_EDGE_TYPE`, không còn `"straight"`
- [x] 3.2 `index.test.tsx`: test `curvedEdgePath` — nan hoa ngang → control point bị đẩy khỏi đường thẳng (bow ≠ 0)

## 4. Verify
- [x] 4.1 `npx tsc --noEmit` sạch (exit 0)
- [x] 4.2 vitest `MindMap/index.test.tsx` xanh (21 test)
- [ ] 4.3 `npm run build` (webpack) — CHẬM trong env này, có thể timeout cục bộ; tsc sạch + test xanh, để CI/Vercel verify
