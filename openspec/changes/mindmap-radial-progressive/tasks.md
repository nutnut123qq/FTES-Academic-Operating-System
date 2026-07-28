# Tasks — mindmap-radial-progressive

## 1. Bố cục RADIAL quanh tâm (thay cây 1 phía)
- [x] 1.1 `build.ts`: bỏ `COLUMN_X` + claim-row; gốc (mã môn) đặt ở **tâm (0,0)**; N phần toả ở góc `2π·i/N` (bắt đầu từ đỉnh) trên vòng `moduleRadius = max(380, N·360/2π)` (bán kính giãn theo số phần)
- [x] 1.2 Toạ độ bằng lượng giác: helper `polar(r, θ) = (r·cosθ, r·sinθ)`; `placeNode` đặt theo **tâm** rồi quy về top-left (`center − size/2`) theo `NODE_SIZE` mỗi cấp
- [x] 1.3 Con của phần mở **fan tiếp ra ngoài** trong đúng cung `2π/N` của phần: bài ở `moduleRadius + LESSON_GAP` (radius giãn theo số bài), bài tập ở `lessonRadius + EXERCISE_GAP` (fan trong cung con của bài) — không đè phần khác, không đè tâm
- [x] 1.4 Cạnh vẽ **thẳng tâm→tâm** (`type:"straight"`); handle nguồn/đích đặt ở **tâm node** (ẩn) ở `ContentNode`/`RootNode` để nan hoa chạy đúng mọi hướng

## 2. Progressive disclosure (mở/gập theo phần) + nhấn bài để học
- [x] 2.1 `index.tsx`: state `expandedModuleIds: Set<string>` (mặc định **rỗng = gập hết**) + `onToggleModule(moduleId)` toggle vào/ra Set
- [x] 2.2 `build.ts`: `buildMindMap` nhận `expandedModuleIds`; **chỉ phát node bài + bài tập cho phần trong Set**; node phần mang `isExpanded` + `hasChildren`
- [x] 2.3 `MindMapCanvas`: prop `onToggleModule`; `onNodeClick` phân luồng — gốc → fit view, **phần → `onToggleModule`**, bài/bài tập → `onOpenNode`
- [x] 2.4 Nhấn bài/bài tập = **điều hướng** qua `resolveNodeOpen` + route builder `open.ts` sẵn có (bài → reader, challenge → solver theo slug); node khóa hẳn → **cùng `PackageGateModal`**
- [x] 2.5 `ContentNode`: node phần có **caret** (`CaretRight` gập / `CaretDown` mở) + `aria-label` `mindMap.{expand,collapse}`
- [x] 2.6 `useMindMapFitView`: **fit-once** lúc dữ liệu về (khung trọn vòng phần), KHÔNG giật lại khi mở/gập (giữ pan/zoom người dùng)

## 3. Mô tả (description) của phần + buổi trên node
- [x] 3.1 `MindMapNodeData.description` (mới) lấy từ `module.description` / `lesson.description` **đã có sẵn** trong learn tree (nguồn `section.description` / `lesson.description`)
- [x] 3.2 `ContentNode`: render mô tả làm **phụ đề dưới tiêu đề** (`line-clamp-2`, `text-muted`); **rỗng → bỏ qua**; bài tập không có mô tả → không hiện
- [x] 3.3 Không đụng backend: nếu deployment cũ trả mô tả rỗng thì node degrade sạch (không phụ đề); bài tập chưa có `description` trong contract → ghi rõ ở proposal (BE phải thêm nếu muốn)

## 4. i18n + test
- [x] 4.1 Thêm `learn.mindMap.{sectionHint,expand,collapse}` ở CẢ `en.json` + `vi.json` (mirror, JSON hợp lệ)
- [x] 4.2 `index.test.tsx`: thêm describe "progressive disclosure" (mặc định chỉ có node phần; mở phần mới thấy bài + bài tập; `hasChildren`/`isExpanded`) + test mô tả phần/buổi lên node; sửa test cũ cần con sang truyền `expandedModuleIds`; mock canvas phân luồng phần→toggle; container test mở phần trước khi bấm bài + test gập lại

## 5. Verify
- [x] 5.1 `npx tsc --noEmit` sạch (exit 0)
- [x] 5.2 vitest `MindMap/index.test.tsx` xanh (19 test)
- [ ] 5.3 `npm run build` (webpack) — CHẬM trong env này, **timeout 10′** cục bộ; tsc sạch + test xanh, để CI/Vercel verify
