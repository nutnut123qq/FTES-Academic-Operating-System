# Tasks — mindmap-edge-stop-at-card

## 1. Cắt đầu đường nối về viền thẻ
- [x] 1.1 `borderAnchor(cx,cy,halfW,halfH,px,py)`: giao điểm tia tâm→node-kia với biên hộp (clamp scale ≤ 1)
- [x] 1.2 `MindMapCurvedEdge` lấy kích thước qua `useInternalNode(source/target).measured`, snap 2 đầu về viền rồi mới `curvedEdgePath`
- [x] 1.3 Chưa đo được (halfW=halfH=0) → trả tâm (fallback frame đầu)

## 2. Verify
- [x] 2.1 `useInternalNode` có export ở @xyflow/react đã cài
- [x] 2.2 MindMap vitest 29 pass (curvedEdgePath signature không đổi)
- [x] 2.3 Type-check qua Vercel build (next build)
