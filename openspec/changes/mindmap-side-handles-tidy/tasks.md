# Tasks — mindmap-side-handles-tidy

## 1. Handle 2 cạnh
- [x] 1.1 `ContentNode`: 4 handle vô hình ở giữa cạnh trái/phải (target `tl`/`tr`, source `sl`/`sr`)
- [x] 1.2 `RootNode`: 2 source handle `sl`/`sr` ở giữa cạnh trái/phải

## 2. Chọn cặp handle theo phía nhánh
- [x] 2.1 `buildMindMap.link(...,sign)`: right → `sr`→`tl`; left → `sl`→`tr`
- [x] 2.2 Truyền `sign` vào 3 chỗ gọi link (root→module, module→lesson, lesson→exercise)

## 3. Vẽ bằng bezier gốc
- [x] 3.1 `MindMapCurvedEdge` dùng `getBezierPath({sourcePosition,targetPosition,...})`, bỏ cắt-biên
- [x] 3.2 Giữ `curvedEdgePath` (unit test còn dùng)

## 4. Verify
- [x] 4.1 MindMap vitest 29 pass
- [x] 4.2 Type-check qua Vercel build
