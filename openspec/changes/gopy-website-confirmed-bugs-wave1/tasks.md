# Tasks

- [x] 1. `GoalsCard`: `Typography` trong `TextField` → `Label`; bỏ `aria-label` trùng.
- [x] 2. `blocks/cards/PressableCard`: nhánh `href` dùng next-intl `Link` thay `<a>`.
- [x] 3. `CommunityPoll` + `DiscoveryRail.QuickPoll`: trạng thái poll đã đóng (khoá vote + nhãn
      + toast đúng `COMMUNITY_POLL_CLOSED` qua `RestError.errorCode`).
- [x] 4. i18n `poll.closed` (vi + en).
- [x] 5. BE `FreemiumService.readContent`: fallback teaser theo **teaser rỗng**, không chỉ
      `content == null` (bài học thử migrate từ PDF → paywall trắng). + test đơn vị.
- [x] 6. Verify: `tsc --noEmit` sạch · BE `FreemiumServiceTest` 25/25 · E2E tay trên dev server
      (leaderboard render, pager giữ `/vi` + client-side nav, poll đã đóng ở cả 2 surface).
- [x] 7. `npm run build` (webpack) xanh. Lưu ý: build vấp `.next/dev/types/cache-life.d.ts`
      mồ côi sau khi tắt dev server → `rm -rf .next` rồi build lại là sạch.
