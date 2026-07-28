# Tasks

## 1. Ẩn lối vào Kiểm duyệt khi thiếu quyền
- [x] 1.1 `NavRail` gate link "Kiểm duyệt" bằng `useHasPermission("community.moderate")`
- [x] 1.2 `CommunityShell` lọc mục moderation khỏi menu ⋯ cùng gate (ẩn ở mọi breakpoint)
- [x] 1.3 Giữ fallback "restricted" ở trang `CommunityModeration` cho truy cập thẳng URL

## 2. Bỏ nút Tham gia cho nhóm public
- [x] 2.1 Surface `visibility` từ DTO lên `Group` (`useQueryGroupsSwr`) và `GroupHeader` (`useQueryGroupSwr`)
- [x] 2.2 `GroupJoinButton` nhận `visibility`; nhóm PUBLIC + chưa là thành viên → không render nút Tham gia
- [x] 2.3 Truyền `visibility` từ `GroupsList` và `GroupDetailShell`; giữ Rời nhóm / Đã tham gia cho thành viên
- [x] 2.4 Ghi nhận BE participation-gate (`PostService.isMember`) cần nới cho nhóm PUBLIC

## 3. Verify
- [x] 3.1 `npx tsc --noEmit` sạch (0)
- [x] 3.2 Unit test group + community xanh (98 pass; 1 suite lỗi môi trường next-intl có sẵn từ base)
- [x] 3.3 `openspec validate hide-moderation-and-public-group-join --strict`
