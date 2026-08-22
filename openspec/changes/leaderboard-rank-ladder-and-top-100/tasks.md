# Tasks

## 1. Khảo sát

- [x] 1.1 Đọc `LeaderboardShell` — huy hiệu là `<img>` trần trong `rankSummary`, không có lối
      vào nào tới thang hạng đầy đủ.
- [x] 1.2 Đọc `leaderboardTiers.ts` — `RANK_TIERS` đã có đủ 5 tier (key + `minXp` + `badgeSrc`)
      và `tierFromXp`; thang hạng chỉ cần ĐỌC, không dựng nguồn thứ hai.
- [x] 1.3 Đọc `SeasonBoardList` — nó vẽ HẾT `rows` (bục top-3 + phần còn lại), không cắt ở đâu
      cả ⇒ chỗ cắt phải thêm ở tầng vẽ.
- [x] 1.4 Đọc `getSeasonBoard` — mặc định `limit: 50`, trần cứng backend 100; hook
      `useQuerySeasonBoardSwr` chưa nhận `limit`.
- [x] 1.5 Kiểm i18n: `gamification.tiers.*` đã có 5 tier; `gamification.seasonBoards.you` /
      `.xp` / `.myRankUnranked` đã có (dùng lại, không đẻ key trùng nghĩa).

## 2. Việc 2 — thang hạng bấm được từ huy hiệu

- [x] 2.1 `RankTiersModal.tsx`: HeroUI `Modal` (Backdrop/Container/Dialog/Header/Body/Footer),
      `max-w-md`, body cuộn `max-h-[60vh]`.
- [x] 2.2 Liệt kê `RANK_TIERS` tăng dần: art + `t('tiers.<key>')` + `t('rankTiers.threshold')`
      với `formatXpShort(minXp)`.
- [x] 2.3 Tier chưa đạt: `grayscale opacity-40` + `LockSimpleIcon` đè giữa (`absolute inset-0`).
- [x] 2.4 Tier hiện tại: `border-accent bg-accent/5` + `Chip` "Hạng hiện tại".
- [x] 2.5 A11y: mỗi hàng một `aria-label` RIÊNG cho 3 trạng thái (`lockedAria` / `currentAria` /
      `unlockedAria`) — trình đọc màn hình không "thấy" được ảnh mờ hay ổ khoá.
- [x] 2.6 Huy hiệu thành `<button type="button">` có `aria-label` + `focus-visible:ring-2`,
      KHÔNG `div onClick`.
- [x] 2.7 `viewerXp === null` (khách / snapshot chưa về): không khoá hạng nào, không đánh dấu
      hạng nào; lối vào vẫn còn dưới dạng hàng "Thang hạng" + huy hiệu mờ.

## 3. Việc 5 — "Xem thêm" top 100 + thẻ hồ sơ ghim

- [x] 3.1 `useQuerySeasonBoardSwr`: thêm `limit`, **đưa vào SWR key** (`limit ?? null`), truyền
      xuống `getSeasonBoard`.
- [x] 3.2 Thêm `keepPreviousData: true` — đổi limit/kỳ/lát cắt không làm bảng trắng xoá.
- [x] 3.3 `SeasonBoards`: state `expanded`; `limit = expanded ? 100 : undefined` (undefined =
      mặc định 50 của `getSeasonBoard`).
- [x] 3.4 Cắt tầng vẽ `COLLAPSED_ROWS = 10`; `canShowMore = !expanded && rows.length > 10` ⇒
      bảng ít người thì không hiện nút, mở rộng rồi thì nút biến mất.
- [x] 3.5 Nút `Button variant="ghost"` + `isPending={isValidating}`, nhãn
      `seasonBoards.showMore` mang sẵn con số 100.
- [x] 3.6 `ViewerRankCard.tsx`: `AvatarWithFrame` (`highlighted`) + tên + chip "Bạn" + `#hạng`
      / EXP; `frameCode` lấy từ dòng của chính người xem nếu họ có trong cửa sổ.
- [x] 3.7 Ba trạng thái tách bạch: khách ⇒ không render (khối cha nói `guest`) · có tài khoản
      chưa có hạng ⇒ `myRankUnranked` · có hạng ⇒ `#hạng` + EXP.
- [x] 3.8 Dải ghim `sticky bottom-0 ... backdrop-blur` ôm cả thẻ lẫn nút; chỉ dựng khi
      `outcome === "OK"`.

## 4. i18n

- [x] 4.1 `gamification.rankTiers.{title,subtitle,openAria,threshold,current,currentAria,
      unlockedAria,lockedAria,guestHint,close}` — en + vi.
- [x] 4.2 `gamification.seasonBoards.showMore` — en + vi.
- [x] 4.3 Đếm key hai file: 6673 = 6673, không key nào lệch (chèn bằng Edit anchor hẹp, KHÔNG
      ghi đè cả file — 4 lane cùng sửa 2 file này).

## 5. Verify

- [x] 5.1 `npx vitest run src/components/features/gamification/LeaderboardShell/index.test.tsx`
      → 8/8 xanh (6 case cũ + 2 case mới: khoá đúng 4 tier trên 1 500 EXP; `viewerXp` chưa biết
      thì không khoá và không đánh dấu hạng nào).
- [x] 5.2 `npx vitest run src/components/features/gamification` → 18 file / 151 test xanh.
- [x] 5.3 `npx eslint` trên 6 file đã đụng → sạch (có chạy `--fix` cho `SeasonBoards/index.tsx`,
      chỉ là thụt lề: khối `refresh` vốn đã lệch 4 space từ trước).
- [ ] 5.4 `npx tsc --noEmit` / `npm run build` — **KHÔNG chạy ở lane này** (3 lane khác đang
      dùng chung thư mục, tsc incremental sẽ đá nhau). Phase VERIFY riêng chạy sau.
- [ ] 5.5 Xem thật trên trình duyệt — chưa làm (phiên này không dựng dev server).

## 6. HARDEN (2026-08-22) — vá nợ sau vòng review đối kháng

- [x] 6.1 `LeaderboardShell`: tách BA trạng thái phiên thay vì suy từ `my == null`. Đọc
      `isLoading` + `mutate` của `useQueryMyGamificationSwr` (trước bị vứt) và
      `keycloak.initialized` / `keycloak.authenticated`. `!settled || isLoading` ⇒ huy hiệu +
      `Skeleton.Typography` (KHÔNG câu mời đăng nhập); `settled && !authed` ⇒ `rankTiers.guestHint`;
      `settled && authed` mà không có snapshot ⇒ `currentRank.unavailable` + nút thử lại. Lỗi cũ:
      người ĐANG đăng nhập bị nói là chưa đăng nhập — vĩnh viễn khi `/me/progression` lỗi, và ở
      mọi lần tải trang trong cửa sổ hydrate (redux không persist).
- [x] 6.2 `useQueryMyGamificationSwr` trả thêm `mutate` (revalidate lát progression) để nhánh lỗi
      có lối tự phục hồi thay vì bắt tải lại cả trang.
- [x] 6.3 i18n mới: `gamification.currentRank.{unavailable,retry}` — en + vi, chèn bằng Edit anchor
      hẹp. Parity: 6675 = 6675 key, không lệch chiều nào.
- [x] 6.4 `RankTiersModal`: bỏ `aria-label` trên `<li>` (phần tử không tương tác — AT không thống
      nhất chuyện tôn trọng hay bỏ qua), đưa `ariaLabel` vào `<span className="sr-only">` trong nội
      dung hàng. Không có nó, viewer dùng NVDA browse-mode nghe hàng khoá y hệt hàng mở khoá. Test
      đổi `getByLabelText` → `getByText` cho đúng thứ người dùng thật nghe được.
- [x] 6.5 `useQuerySeasonBoardSwr`: `keepPreviousData` giờ chỉ giữ dữ liệu khi CÂU HỎI không đổi.
      Fetcher dán nhãn `requestedBoard`/`requestedSeason` vào payload; lệch nhãn ⇒ coi như chưa có
      dữ liệu (rows rỗng, `outcome = EMPTY`, mọi trường dẫn xuất `null`) + `isLoading = true`.
      Trước đó đổi tab/kỳ vẽ nguyên bục + 12 người của bảng CŨ dưới nhãn bảng MỚI, `#hạng` nhảy số
      sau đó. Riêng "Xem thêm" (cùng board + season) vẫn giữ được bảng đang đọc dở.
- [x] 6.6 Nút "Xem thêm" bỏ `isPending={isValidating}` — prop chết (nút bị gỡ khỏi cây ngay khi
      `setExpanded(true)`) và chỉ sáng nhầm lúc bấm "Làm mới" (dùng chung `isValidating`).
- [ ] 6.7 `canShowMore` đổi sang ngưỡng bão hoà `rows.length >= 50` — **KHÔNG áp dụng**: nút này
      vừa mở rộng `limit` VỪA gỡ lát cắt `rows.slice(0, 10)` ở tầng vẽ, nên với ngưỡng đó bảng
      11–49 người sẽ vĩnh viễn kẹt ở 10 dòng. Lý do đầy đủ trong báo cáo phase HARDEN.
- [x] 6.8 `LeaderboardShell/index.test.tsx`: thêm describe 4 case ghim ba trạng thái (chưa ngã ngũ ·
      đang tải · khách · đã đăng nhập mà lỗi + retry gọi `mutate`). 12/12 xanh.
