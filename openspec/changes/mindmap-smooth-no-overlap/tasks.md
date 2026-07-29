# Tasks — mindmap-smooth-no-overlap

## 1. FIX 1 — Đường cong mượt (cubic flowing)
- [x] 1.1 `CurvedEdge.tsx`: `curvedEdgePath` đổi từ quadratic-bow vuông-góc → **CUBIC bezier** `M .. C c1 c2 ..`
- [x] 1.2 Control point trượt về giữa **TRỤC TRỘI** (`|dx|≥|dy|` → ngang; ngược lại → dọc), mỗi điểm giữ ở trục-phụ của đầu mình (nét S ngang, rời/vào node theo phương của trục trội)
- [x] 1.3 **Chiều cong lấy từ hình học** (dấu `dx`/`dy`): nhánh phải cong phải, nhánh trái cong trái — không còn bow xoay cố định. Hằng `CURVE_TENSION = 0.5`
- [x] 1.4 Endpoint vẫn ở **tâm node** (handle tâm ẩn), cạnh nằm DƯỚI card → chỉ lộ đoạn cong giữa 2 card

## 2. FIX 2 — Các thẻ KHÔNG đè nhau (tidy tree 2 phía)
- [x] 2.1 `build.ts`: **export `NODE_SIZE`** (footprint từng cấp) để test rebuild bounding-box
- [x] 2.2 Bỏ hình học radial (`polar`/`moduleRadius`/`sector`/quạt-góc); thêm `ROW_GAP` (dọc = cao thẻ + lề: module 152 / lesson 116 / exercise 96) + `COL_GAP` (ngang, trừ nửa-rộng 2 bên + gutter) + `COLUMN_X` (x tích luỹ mỗi cấp)
- [x] 2.3 `lessonBandHeight` = `max(ROW_GAP.lesson, sốExercise·ROW_GAP.exercise)`; `moduleBandHeight` = expanded ? `max(ROW_GAP.module, Σ lessonBand)` : `ROW_GAP.module`
- [x] 2.4 `placeLesson`/`placeModule`/`placeSide`: mỗi node ở **tâm dải dọc** của mình; con nhồi vào **sub-dải rời nhau** (centered); section toả **TRÁI/PHẢI** cân bằng (xen kẽ index chẵn=phải, lẻ=trái), stack dọc quanh y=0
- [x] 2.5 Giữ nguyên id node/edge, `link()` phát `CURVED_EDGE_TYPE`, progressive disclosure, data node, click-để-học

## 3. Doc-comment
- [x] 3.1 `build.ts`: cập nhật doc `buildMindMap` + `link` (radial → tidy-tree 2 phía + cubic)
- [x] 3.2 `ContentNode.tsx` / `RootNode.tsx`: "radial/every side/bowed" → "left/right + cubic curve"

## 4. Test
- [x] 4.1 `index.test.tsx`: thay test bow (`Q`) → test **cubic** (`C`): control point ở giữa trục trội, giữ y của đầu mình, lệch khỏi đường thẳng
- [x] 4.2 Thêm test **hướng cong theo nhánh** (phải → control x > 0; trái → control x < 0)
- [x] 4.3 Thêm describe **"cards never overlap (worst case)"**: 8 section × 7 lesson × exercise, expand hết → rebuild AABB từ `NODE_SIZE` → khẳng định **không cặp nào giao nhau**

## 5. Verify
- [x] 5.1 `npx tsc --noEmit` sạch (exit 0)
- [x] 5.2 vitest `MindMap/index.test.tsx` xanh (23 test)
- [x] 5.3 eslint các file đổi sạch (exit 0)
- [ ] 5.4 `npm run build` (webpack) — CHẬM trong env này, có thể timeout cục bộ; tsc + test + eslint sạch, để CI/Vercel verify
