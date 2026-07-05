## Context

Repo FTES Academic Operating System là frontend Next.js 16 (App Router) + React 19 + TypeScript, dùng HeroUI v3, Tailwind 4, SWR 2, Apollo GraphQL và `next-intl`. Thông tin user được render ở rất nhiều chỗ: feed bài viết, comment, group, subject, leaderboard, chat, instructor card, review, saved library, activity feed, v.v. Hiện tại có nhiều đoạn code lặp (initials tile thủ công, cách chọn `displayName || username` không thống nhất, thiếu link profile) và chưa có trải nghiệm xem nhanh thông tin user.

API user đã có sẵn:
- `queryUserProfile(username)` / `useQueryUserProfileSwr(username)` — lấy public profile gồm `id`, `username`, `displayName`, `bio`, `avatar`, `followerCount`, `followingCount`, `isFollowedByMe`.
- `mutateSetFollow` / `useMutateSetFollowSwr()` — toggle follow/unfollow theo `userId`.
- Route public profile: `/[locale]/u/[username]`.

Tính năng hovercard sẽ được xây dựng hoàn toàn trên các primitive và data layer đã có, không thêm dependency.

## Goals / Non-Goals

**Goals:**
- Cung cấp một component dùng chung (`UserHovercard`) để hiển thị popup thông tin user khi hover/focus vào tên hoặc avatar.
- Cung cấp một component dùng chung (`UserLink`) để render tên + avatar của user, tự động bao bọc bởi hovercard và link đến profile.
- Lazy fetch profile chỉ khi hovercard kích hoạt; cache bằng SWR.
- Hỗ trợ keyboard focus, grace period, loading/error trong popup.
- Áp dụng `UserLink` ở tất cả các chỗ hiển thị user hiện có, loại bỏ code lặp.

**Non-Goals:**
- Thay đổi backend contract (không thêm field `postsCount`, không tạo API mới).
- Thay đổi auth flow, RBAC, hoặc styling token của hệ thống.
- Triển khai hovercard trên FTES Admin hay starci-academy.
- Thêm animation phức tạp ngoài transition mờ/scale cơ bản của HeroUI Popover.

## Decisions

### 1. Dùng HeroUI Popover thay vì Tooltip
**Rationale:** Tooltip thường chỉ chứa text ngắn; popup hovercard cần chứa avatar lớn, bio, stats, button Theo dõi — tương tự một card nhỏ. HeroUI `Popover` hỗ trợ compound anatomy (`Popover.Trigger`, `Popover.Content`), controlled state, placement, arrow, và tích hợp tốt với Tailwind 4.

### 2. Tách thành 2 blocks: `UserHovercard` (behavior + popup) và `UserLink` (render + link)
**Rationale:** `UserHovercard` chỉ lo phần tương tác hover/focus/fetch/popup; `UserLink` lo phần hiển thị avatar + tên + link profile. Tách ra cho phép `UserHovercard` tái sử dụng với các layout khác (ví dụ chỉ avatar, hoặc chỉ tên) mà không ép buộc cấu trúc UI.

### 3. Logic delay + grace period dùng React timer trong component
**Rationale:** HeroUI Popover không cung cấp sẵn delay/grace period cho hover. Dùng `setTimeout` quản lý trạng thái `isOpen`:
- Khi `mouseenter` trigger hoặc `focus`: bắt đầu delay ~400ms rồi mở.
- Khi `mouseleave` trigger: nếu chuột không vào popup trong grace period (~300ms) thì đóng.
- Khi `mouseenter` popup: hủy đóng.
- Khi `mouseleave` popup: đóng ngay hoặc sau grace period ngắn.
- `Esc` đóng popup.

### 4. Lazy fetch qua SWR key gating
**Rationale:** Không fetch khi component mount. Chỉ khi hovercard được kích hoạt (state `shouldFetch` chuyển `true`) thì `useQueryUserProfileSwr(username)` mới nhận key hợp lệ và fetch. SWR tự động cache theo key `["QUERY_USER_PROFILE_SWR", username]`; hover lại sẽ dùng cache.

### 5. Follow button dùng `useMutateSetFollowSwr` và optimistic update bằng SWR `mutate`
**Rationale:** Mutation đã có sẵn. Sau khi follow/unfollow thành công, gọi `mutate(["QUERY_USER_PROFILE_SWR", username])` để cập nhật lại `isFollowedByMe` và `followerCount` trong cache. Không dùng Apollo cache (dự án dùng SWR làm cache layer).

### 6. Link profile dùng `Link` từ `@heroui/react` + `pathConfig().locale(locale).profile(username).build()`
**Rationale:** `LeagueRow` đã dùng pattern này. `pathConfig` từ `@/resources/path` tạo URL localized `/[locale]/u/[username]`. Dùng HeroUI `Link` giữ đồng nhất typography và focus ring.

### 7. Không render hovercard khi thiếu `username`
**Rationale:** API `userProfile` key bằng `username`; route profile cũng cần `username`. Nếu dữ liệu chỉ có `name` hoặc `displayName`, component fallback về render avatar + tên không hovercard và không link.

### 8. i18n cho tất cả label
**Rationale:** Dự án yêu cầu vi + en cho mọi string. Thêm keys `hovercard.follow`, `hovercard.unfollow`, `hovercard.followers`, `hovercard.following`, `hovercard.loading`, `hovercard.errorRetry`.

## Risks / Trade-offs

- **[Risk]** Popover hover có thể gây khó chịu khi di chuột nhanh qua nhiều user trong list dài (leaderboard, comment).  
  → **Mitigation:** Delay 400ms trước khi mở; không mở khi di chuột chỉ "lướt qua".
- **[Risk]** Refactor nhiều file cùng lúc dễ gây lỗi type hoặc regression layout.  
  → **Mitigation:** Chia nhỏ task, ưu tiên các component phổ biến nhất (feed, comment, leaderboard, group/subject members); chạy `tsc --noEmit` và `npm run build` sau mỗi nhóm thay đổi.
- **[Risk]** Một số chỗ dùng `author` là `string` thay vì object có `username`/`avatar`.  
  → **Mitigation:** `UserLink` hỗ trợ cả 2 dạng; nếu chỉ có string thì render initials + text, không hovercard/link.
- **[Risk]** HeroUI Popover controlled có thể không tắt khi click outside nếu tự quản lý state.  
  → **Mitigation:** Vẫn truyền `isOpen`/`onOpenChange` cho Popover để nó xử lý `Esc` và outside click; timer chỉ làm phần hover.
- **[Trade-off]** Số bài viết (`postsCount`) không có trong `UserEntity` nên không hiển thị trong hovercard. Có thể thay bằng `followerCount`/`followingCount` đã có.

## Migration Plan

1. Tạo `UserHovercard` và `UserLink` trong `src/components/blocks/identity/`.
2. Thay thế từng nhóm component render user theo thứ tự ưu tiên:
   - Feed/comment (community + resource + discussion + post comment thread)
   - Group/subject members & feed
   - Leaderboard / LeagueRow
   - Chat conversation list
   - Course instructor / review author
   - Saved library
   - Navbar account menu (ít ưu tiên vì là current user)
3. Sau mỗi nhóm, chạy `tsc --noEmit`.
4. Cuối cùng chạy `npm run build`.
5. Rollback: revert các file trong commit; các component cũ chỉ bị sửa đổi về cách import/wrap, không xóa.

## Open Questions

- Có nên ẩn nút Follow khi hovercard thuộc về current user không? (Đề xuất: ẩn, vì không thể tự follow.)
- Có nên thêm `postsCount` vào `UserEntity` / `userProfile` response trong tương lai không? (Ngoài scope lần này.)
- Có nên áp dụng hovercard cho avatar trong `AvatarGroup` không? (Đề xuất: không trong lần này để tránh nhiều popup chồng chéo.)
