# mindmap-smooth-no-overlap — Sơ đồ tư duy: dây CONG mượt + các thẻ KHÔNG đè nhau

## Why
Thầy nêu (tiếng Việt, kèm ảnh mẫu): *"Cái mindmap các sợi dây phải cong đẹp chứ, các thẻ đừng đè lên nhau
như mẫu này nè"*. Sau đợt `mindmap-curved-edges` + `mindmap-radial-progressive`, sơ đồ tư duy khóa học
(`features/learn/MindMap`, canvas `@xyflow/react`) còn 2 vấn đề so với ảnh mẫu:
1. **Đường cong chưa "đẹp".** `CurvedEdge` dùng 1 quadratic-bezier bow **vuông góc cố định** → mọi cạnh
   cong theo kiểu **chong chóng (pinwheel)** xoay cùng chiều, không phải nét S ngang mềm mại như mẫu.
2. **Các thẻ ĐÈ nhau.** Layout radial rải section quanh 1 vòng tròn rồi **quạt** lesson theo góc trong
   sector; với khóa nhiều phần / nhiều bài, bước góc quá nhỏ so với kích thước thẻ → thẻ chồng lên nhau.

Mẫu thầy đưa: root ở giữa, section toả **TRÁI / PHẢI**, lesson của section mở ra thành **CỘT DỌC** phía
ngoài, dây nối là **đường cong S ngang** mượt; các thẻ cách nhau rõ, **không chạm nhau**.

## What Changes
- **FIX 1 — Đường cong mượt hơn (`CurvedEdge.tsx`).** Đổi từ quadratic-bow vuông-góc → **CUBIC bezier
  "flowing"**: 2 control point trượt về **giữa TRỤC TRỘI** của nan hoa (|dx| vs |dy|), mỗi điểm giữ ở
  **giá trị trục-phụ của đầu mình** → nhánh trái/phải rời & vào node theo phương **NGANG** (nét S ngang
  như mẫu), thay vì bow xoay tròn. **Chiều cong lấy từ hình học** (dấu `dx`/`dy`): nhánh phải cong sang
  phải, nhánh trái cong sang trái. Vẫn tự dựng path (không `getBezierPath`) vì handle nằm ở **tâm node,
  không có hướng**. Cạnh vẫn nằm **DƯỚI** card, stroke accent kín đáo.
- **FIX 2 — Các thẻ KHÔNG đè nhau (`build.ts`).** Bỏ layout vòng-tròn + quạt-góc, thay bằng **cây gọn
  (tidy tree) 2 phía**: root ở giữa, section toả **TRÁI/PHẢI** (cân bằng, xen kẽ theo thứ tự), section mở
  → lesson xếp **CỘT DỌC** ngay phía ngoài, exercise xếp thành cột xa hơn nữa. **Không đè là do CẤU TRÚC,
  không phải canh tay:** mỗi node sở hữu 1 **DẢI DỌC** cao `max(ô-slot của nó, tổng dải các con)`, con
  được nhồi vào các **sub-dải rời nhau**; mỗi cấp ở **cột x riêng** (khoảng cách cột đã trừ nửa-rộng 2
  bên); 2 phía đẩy xa nhau trên trục x → **không cặp thẻ nào chạm nhau**, kể cả gần root. Bước dọc mỗi
  cấp = **chiều cao thẻ + lề** (module 152 / lesson 116 / exercise 96 px).
- **Giữ nguyên hành vi.** Progressive expand/collapse, click-bài-để-học, mô tả node, trạng thái 3-mức,
  PackageGate, route — **không đổi**; chỉ **VỊ TRÍ node + HÌNH DẠNG cạnh** đổi. Handle vẫn ở tâm (ẩn).
- **Test.** Cập nhật test đường cong (cubic thay vì bow), thêm test **hướng cong theo nhánh**, và thêm
  test **"không đè nhau"**: dựng khóa nhiều section × nhiều lesson × exercise (đã expand hết), rebuild
  bounding-box từ `build()` (footprint `NODE_SIZE` export mới) → khẳng định **không cặp AABB nào giao nhau**.

## Out of scope
KHÔNG đụng backend, KHÔNG đổi progressive disclosure / route học / PackageGate / trạng thái node / dữ
liệu; KHÔNG thêm mũi tên (marker) hay nhãn cạnh. Chỉ đổi **thuật toán layout (vị trí)** + **hình dạng
cạnh (cong)**.

## Capabilities
### New Capabilities
- `mindmap-smooth-no-overlap`: connector vẽ **cubic bezier mượt theo trục trái/phải** + layout **tidy
  tree 2 phía đảm bảo các thẻ KHÔNG đè nhau** (bất kể số section / bài / bài tập).

## Impact
FE-only, nhánh `fix/mindmap-smooth-no-overlap`. Sửa `features/learn/MindMap`: `CurvedEdge.tsx`
(`curvedEdgePath` → cubic flowing, hằng `CURVE_TENSION`); `build.ts` (bỏ hình học radial/quạt-góc, thêm
`ROW_GAP`/`COL_GAP`/`COLUMN_X` + `lessonBandHeight`/`moduleBandHeight` + `placeSide`/`placeModule`/
`placeLesson` tidy-tree 2 phía; **export `NODE_SIZE`**); `ContentNode.tsx` / `RootNode.tsx` (chỉ sửa
doc-comment "radial/every side" → "left/right + cubic"); `index.test.tsx` (test cubic + hướng + no-overlap).
KHÔNG đụng `useQueryLearnCourseSwr`, `open.ts`, `status.ts`, `progress.ts`, `useMindMapFitView.ts`,
`MindMapCanvas.tsx` (edge type đã đăng ký từ trước), i18n hay PackageGateModal. Verify: `npx tsc --noEmit`
(exit 0) + vitest `MindMap/index.test.tsx` xanh + `npm run build` (webpack — CHẬM trong env này, có thể
timeout cục bộ; CI/Vercel verify).
