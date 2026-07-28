# Ẩn lối vào Kiểm duyệt khi không có quyền + bỏ nút Tham gia cho nhóm public

## Why
Hai chỗ UI hiện thừa với người dùng thường:
- **Kiểm duyệt:** rail cộng đồng (và menu ⋯) luôn hiện link "Kiểm duyệt", nhưng ai không có
  quyền `community.moderate` mở trang chỉ nhận thông báo "Bạn không có quyền kiểm duyệt cộng
  đồng". Đã không dùng được thì đừng hiện lối vào.
- **Nút Tham gia nhóm public:** nhóm PUBLIC vốn mở (đọc/tham gia không cần xin vào), nên nút
  "Tham gia" với người CHƯA là thành viên là thừa. Chỉ nhóm PRIVATE/RESTRICTED (xin duyệt) mới
  cần nút Tham gia.

## What Changes
- **NavRail cộng đồng** gate link "Kiểm duyệt" bằng `useHasPermission("community.moderate")` —
  đúng quyền mà trang `CommunityModeration` đang kiểm. Không có quyền → không render link. Menu
  ⋯ (mobile/tablet) lọc bỏ luôn mục moderation cùng gate, để link không xuất hiện ở mọi
  breakpoint. Trang `CommunityModeration` GIỮ fallback "restricted" cho ai vào thẳng URL.
- **GroupJoinButton** nhận thêm `visibility` (raw BE: `PUBLIC` / `PRIVATE` / `RESTRICTED`). Nhóm
  PUBLIC + người chưa là thành viên → KHÔNG render nút Tham gia. Thành viên/chủ nhóm giữ nguyên
  trạng thái Rời nhóm / Đã tham gia. Nhóm PRIVATE/RESTRICTED giữ nút Tham gia như cũ.
- Surface `visibility` từ DTO nhóm lên `Group` (list) và `GroupHeader` (detail) — vì `type` suy
  ra bị mất thông tin visibility với STUDY_GROUP/CLUB/PROJECT_TEAM.

## Impact
- Affected specs: `community-side-rails` (ADDED requirement), `group-live-surfaces` (ADDED requirement)
- Affected code (FE-only): `community/CommunityShell/NavRail.tsx`, `community/CommunityShell/index.tsx`,
  `group/GroupJoinButton/index.tsx`, `group/GroupsList/index.tsx`, `group/GroupDetailShell/index.tsx`,
  `group/hooks/useQueryGroupsSwr.ts`, `group/hooks/useQueryGroupSwr.ts`. Không đổi GraphQL/REST contract.
- **BE cần lưu ý (ngoài phạm vi FE):** đăng bài trong nhóm vẫn bị chặn 403 nếu chưa là thành viên
  (`PostService` kiểm `groupMembership.isMember`), bất kể visibility. Đúng ý "nhóm public không gate
  join" thì BE cần nới participation-gate cho nhóm PUBLIC (cho non-member đăng/tham gia). Đây là
  thay đổi BE, chỉ ghi nhận — bản change này chỉ ẩn nút Tham gia ở FE.
