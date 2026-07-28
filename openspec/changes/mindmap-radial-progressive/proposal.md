# mindmap-radial-progressive — Sơ đồ tư duy: phân bố RADIAL quanh tâm, mở/gập theo phần (progressive), thêm MÔ TẢ phần + buổi trên node

## Why
Sơ đồ tư duy khóa học (`features/learn/MindMap`, canvas `@xyflow/react`) hiện có 3 điểm chưa tốt,
thầy nêu (tiếng Việt):

1. "hiển thị thêm **description** của phần, buổi nữa" — node chỉ có tiêu đề, thiếu mô tả ngắn của
   phần (Phần) và buổi/bài. Dữ liệu learn **đã sẵn** `module.description` + `lesson.description`
   (từ `section.description` / `lesson.description` của course detail) nhưng map chưa dùng.
2. "mới vào thì hiển thị **phần thôi**, khi nhấn vào mới sổ ra bài, bài tập rồi bấm vô bài nhảy sang
   học" — hiện map bung HẾT module → bài → bài tập cùng lúc (rối). Cần **progressive disclosure**:
   vào là chỉ thấy Phần; nhấn Phần mới xổ bài + bài tập; nhấn bài = nhảy sang trang học.
3. "sơ đồ tư duy phải **phân bố xung quanh** luôn, hiện tại mới có 1 bên à" — bố cục hiện là cây
   trái→phải (mọi phần dồn về **một phía** của gốc). Cần toả **radial quanh tâm** như mind map kinh điển.

## What Changes
- **Bố cục RADIAL quanh node gốc (thay cây 1 phía).** `build.ts` bỏ layout cột trái→phải
  (`COLUMN_X` + claim-row). Node gốc (mã môn) đặt ở **tâm (0,0)**; N phần toả **đều mọi phía** ở
  góc `2π·i/N` (bắt đầu từ đỉnh) trên một vòng bán kính `moduleRadius = max(380, N·360/2π)` — bán
  kính **giãn theo số phần** nên card không chồng. Toạ độ tính bằng lượng giác đơn giản
  (`center + r·(cosθ, sinθ)`). Cạnh (edge) vẽ **thẳng tâm→tâm** (`type:"straight"`, handle đặt ở
  **tâm node**, ẩn) = nan hoa radial cổ điển.
- **Progressive disclosure theo phần.** Container giữ `expandedModuleIds: Set<string>` (mặc định
  **rỗng = gập hết**). `buildMindMap` **chỉ phát node bài + bài tập cho phần ĐANG mở**. Nhấn 1 phần =
  **toggle** mở/gập (canvas phân luồng click: gốc→fit view, **phần→toggle**, bài/bài tập→mở). Khi 1
  phần mở, bài của nó **fan tiếp ra ngoài** dọc hướng nhánh, **trong đúng cung `2π/N` của phần**
  (không đè phần khác, không đè tâm); bài tập fan tiếp ra ngoài bài. Node phần có **caret** báo
  mở/gập (`hasChildren`/`isExpanded`).
- **Nhấn bài/bài tập = ĐIỀU HƯỚNG sang trang học.** Giữ nguyên `resolveNodeOpen` + route builder
  `open.ts` (`/courses/{courseId}/learn/content/modules/{moduleId}/contents/{contentId}`, challenge →
  route solver theo slug), và **cùng PackageGateModal** cho node khóa hẳn.
- **MÔ TẢ trên node phần + buổi.** `MindMapNodeData.description` (mới) lấy từ `module.description` /
  `lesson.description` **đã có sẵn** trong learn tree. `ContentNode` render mô tả làm **phụ đề dưới
  tiêu đề**, `line-clamp-2` cho card gọn; **rỗng thì bỏ qua**. Bài tập không có mô tả → không hiện.
- **Camera + hint.** Fit-view **một lần** lúc dữ liệu về (khung trọn vòng phần), KHÔNG giật lại khi
  mở/gập (giữ pan/zoom người dùng). Chú giải (legend) thêm dòng hướng dẫn "nhấn phần để mở bài…".

## Out of scope
KHÔNG đụng backend. Mô tả phần/buổi **đã có** trong response course detail (`section.description` /
`lesson.description`) → không cần BE thêm field; nếu deployment cũ trả rỗng thì node **degrade sạch**
(không phụ đề). Bài tập vẫn **chưa có mô tả** ở contract hiện tại (chỉ tiêu đề + loại) — nếu sau này
muốn phụ đề cho bài tập thì BE phải bổ sung `exercise.description`; đợt này bỏ qua. Trạng thái
per-node của bài tập vẫn `notStarted` (đợt backend sau, không đổi ở đây).

## Capabilities
### New Capabilities
- `mindmap-radial-progressive`: sơ đồ tư duy = phân bố radial quanh tâm + progressive disclosure
  theo phần (nhấn phần mới xổ bài/bài tập, nhấn bài để học) + mô tả phần & buổi trên node.

## Impact
FE-only, nhánh `feat/mindmap-radial-progressive2`. Sửa `features/learn/MindMap`: `build.ts` (layout
radial + expandedModuleIds + field `description`/`isExpanded`/`hasChildren`), `ContentNode.tsx` (phụ
đề mô tả + caret + handle tâm), `RootNode.tsx` (handle tâm), `MindMapCanvas.tsx` (prop
`onToggleModule`, phân luồng click, legend hint, bỏ `currentModuleId`), `useMindMapFitView.ts`
(fit-once), `index.tsx` (state `expandedModuleIds` + `onToggleModule`), `index.test.tsx` (thêm test
progressive + mô tả). i18n thêm `learn.mindMap.{sectionHint,expand,collapse}` (en+vi). KHÔNG đụng
`useQueryLearnCourseSwr`, `open.ts`, `status.ts`, PackageGateModal, hay route học. Verify:
`npx tsc --noEmit` (exit 0) + vitest `MindMap/index.test.tsx` xanh + `npm run build` (webpack — CHẬM
trong env này, có thể timeout; CI/Vercel verify).
