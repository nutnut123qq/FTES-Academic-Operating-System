# Design — community-side-rails

## Context

Feed Threads-style 620px đã xong; hai bên trống từ ~1280px. Các surface phụ
(trending/reputation/poll/moderation) có trang riêng + hook mock riêng nhưng không
có lối vào nhìn thấy được ngoài menu ⋯.

## Goals / Non-Goals

**Goals**: lấp hai bên bằng nội dung có sẵn; rail = pure composition trên 3 hook mock
hiện có; giữ nguyên header sticky + feed + mobile/tablet.

**Non-Goals**: không data/hook mới; không redesign các trang Trending/Reputation/Poll;
không làm rail cho các trang con (rail hiện ở shell nên mọi scope đều có — chấp nhận).

## Decisions

1. **Breakpoint `xl` (1280px)**: 240 + 620 + 280 + 2×24 gap ≈ 1188px. Dưới `xl` ẩn cả
   hai rail (`hidden xl:block`) — menu ⋯ vẫn là lối vào, không duplicate hành vi.
2. **Shell grid**: `xl:grid xl:grid-cols-[240px_minmax(0,620px)_280px] xl:justify-center
   xl:gap-6`; hai aside `sticky top-20 self-start`. Cột giữa giữ nguyên markup hiện tại.
3. **Panel idiom = giống feed panel**: `rounded-3xl border border-separator bg-surface`
   (đồng bộ change trước; card.md cho phép hand-rolled bordered panel theo idiom domain).
4. **Rail trái**: hàng icon + label (Phosphor, `size-5`, aria-hidden); "Đăng bài" là
   `<button>` mở overlay `communityComposer`; 3 hàng còn lại là `Link`. Không lặp lại
   4 scope tab (đã ở header).
5. **Rail phải**: 3 panel tái dùng hook — Trending top 4 (rank + title line-clamp-1 +
   ♥likes, `Link` tới post), Reputation top 3 (rank + name + score = up−down), Poll
   (question + option buttons, local `votedId` → % bar, logic như `CommunityPoll`).
   "Xem tất cả" = `Link` accent về trang đầy đủ.
6. **ponytail**: rails render thẳng trong 2 sub-component colocated của CommunityShell
   (`NavRail.tsx`, `DiscoveryRail.tsx`) — không block mới, không barrel mới; hook được
   gọi trong rail (feature-side, đúng cannon).

## Risks / Trade-offs

- SWR trending/contributors/poll giờ fetch cả ở shell (mọi scope) — mock nhẹ, chấp nhận;
  khi có BE thật thì SWR dedup theo key, không tốn thêm request.
- Poll vote ở rail và ở trang poll không share state (cả hai đều local mock) — chấp nhận,
  BE thật sẽ thống nhất qua mutation.
