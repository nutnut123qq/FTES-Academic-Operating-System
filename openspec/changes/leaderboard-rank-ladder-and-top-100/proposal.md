# leaderboard-rank-ladder-and-top-100 — thang hạng bấm được từ huy hiệu, và "Xem thêm" mở top 100 kèm thẻ hồ sơ ghim

## Why

Chủ dự án chốt hai việc trên trang `/leaderboard`:

1. *"Cho phép bấm dô cái icon Rank. Nó sẽ hiện ra popup hiện ra các rank của system. Rank nào
   chưa đạt đc thì gắn thêm cái ổ khóa."*
2. *"Leader Board hiện thêm show more → Bấm dô sẽ hiện ra top 100 bảng xếp hạng, và 1 ô chứa
   profile của mình kèm rank của mình."*

Hai vấn đề thật đằng sau:

- **Thang hạng vô hình.** Trang chỉ vẽ MỘT huy hiệu — hạng đang đứng — kèm thanh tiến độ tới
  hạng kế. Người xem không có đường nào biết hệ thống có mấy hạng, hạng cuối là gì, mỗi hạng
  đòi bao nhiêu EXP. Bảng ngưỡng có tồn tại ở trang "Cách tính điểm", nhưng đó là một trang
  khác và không ai rời bảng xếp hạng để đi tra. Cái huy hiệu **trông đã như một cái nút** —
  nó chỉ chưa phải là nút.
- **Bảng cụt ở đâu không ai biết.** `getSeasonBoard` xin 50 dòng, còn tầng vẽ đổ HẾT 50 dòng
  đó ra trang: bảng dài bằng cả màn hình mà vẫn cụt ở dòng thứ 50, không có gì nói cho người
  đọc biết là còn nữa hay hết rồi. Backend cho phép tới 100 (`SeasonBoardService.MAX_LIMIT`)
  nhưng FE chưa có đường nào xin.
- **Người hạng 87 không thấy mình.** Mở tới 100 dòng thì người đứng cuối phải cuộn qua 86
  người lạ mới thấy mình, và cuộn tiếp một dòng là mất dấu.

## What Changes

### 1. Huy hiệu hạng thành NÚT, mở thang hạng của cả hệ thống

- `LeaderboardShell` — `<img>` huy hiệu bọc trong `<button>` THẬT (`aria-label`, focus ring,
  đi được bằng bàn phím), không phải `div onClick`.
- Component mới `LeaderboardShell/RankTiersModal.tsx` — HeroUI `Modal`, liệt kê đủ 5 tier theo
  đúng thứ tự tăng dần của `RANK_TIERS` (nguồn duy nhất của cả ngưỡng lẫn art): art + tên
  (`gamification.tiers.<key>`) + ngưỡng EXP (`formatXpShort`).
- Tier CHƯA ĐẠT: art `grayscale opacity-40` + `LockSimpleIcon` đè giữa + `aria-label` nói rõ
  là chưa mở khoá và cần bao nhiêu EXP.
- Tier hiện tại: viền `border-accent` + `Chip` "Hạng hiện tại".

**★ KHOÁ ≠ CHƯA BIẾT.** Ổ khoá chỉ vẽ khi `viewerXp !== null && viewerXp < minXp`. Khách vãng
lai / snapshot `/me/*` chưa về thì `viewerXp === null` ⇒ **không hạng nào khoá, không hạng nào
là "hiện tại"**. Khoá sạch năm hạng sẽ đọc thành "phải đăng nhập mới xem được thang hạng" —
sai: thang hạng là thông tin công khai, chỉ VỊ TRÍ của người xem trên đó mới cần đăng nhập.
Và cũng vì thế lối vào (nút huy hiệu) **vẫn còn khi chưa có snapshot** — lúc đó khối "hạng
hiện tại" nhường chỗ cho một hàng gọn: huy hiệu mờ + "Thang hạng" + lời mời đăng nhập, chứ
KHÔNG dựng một khối hạng rỗng khẳng định thứ hạng mình chưa hỏi được máy chủ.

### 2. "Xem thêm" → top 100, kèm thẻ hồ sơ của chính người xem (ghim)

- `useQuerySeasonBoardSwr` nhận thêm `limit`, **đưa vào SWR key**. Không đưa vào key thì lần
  xin 100 sẽ nhận lại đúng 50 dòng đã cache và nút bấm xong không đổi gì.
- Hook thêm `keepPreviousData: true`: đổi key (mở rộng / đổi kỳ / đổi lát cắt) không được làm
  bảng trắng xoá rồi nhảy về khung xương khi người dùng đang đọc dở.
- `SeasonBoards` cắt ở **tầng vẽ**: `COLLAPSED_ROWS = 10`. Không hạ `limit` xuống 10 — cùng
  một lần gọi đã trả sẵn phần còn lại, nên `rows.length > 10` chính là câu trả lời cho "còn ai
  nữa không" mà không tốn thêm request. Bảng ≤ 10 người ⇒ **không hiện nút**; đã mở rộng ⇒
  **nút biến mất** (không để nút bấm mãi không đổi gì).
- Component mới `SeasonBoards/ViewerRankCard.tsx`, ghim `sticky bottom-0` cùng dải với nút.

**★ BA TRẠNG THÁI, BA CÂU NÓI** (đúng họ với bốn-kết-cục của `SeasonBoards/model.ts`):
chưa đăng nhập ⇒ thẻ KHÔNG render, khối cha nói `seasonBoards.guest` · đã đăng nhập nhưng
`myRank === null` ⇒ "Bạn chưa có hạng trong kỳ này" (KHÔNG vẽ `#—`, nó đọc thành "chưa tải
xong") · có hạng ⇒ `#hạng` + EXP.

Khung viền (`frameCode`) lấy từ chính dòng của người xem trong cửa sổ đang tải; ngoài cửa sổ
thì `null` và avatar vẽ trần — đúng luật "khung là trang trí, không chen vào đường đọc".

## Impact

- `src/components/features/gamification/LeaderboardShell/index.tsx` (nút + mount modal)
- `src/components/features/gamification/LeaderboardShell/RankTiersModal.tsx` (mới)
- `src/components/features/gamification/LeaderboardShell/index.test.tsx` (2 case mới)
- `src/components/features/gamification/SeasonBoards/index.tsx` (cắt 10 dòng, nút, dải ghim)
- `src/components/features/gamification/SeasonBoards/ViewerRankCard.tsx` (mới)
- `src/components/features/gamification/hooks/useQuerySeasonBoardSwr.ts` (`limit` + key + keepPreviousData)
- `src/messages/{en,vi}.json` — `gamification.rankTiers.*` (10 key) + `gamification.seasonBoards.showMore`

## KHÔNG đổi

- `RANK_TIERS` / `tierFromXp` — ngưỡng và art giữ nguyên, thang hạng chỉ ĐỌC chúng.
- Nguồn của khối "Hạng hiện tại" vẫn là `useQueryMyGamificationSwr` (tổng toàn sàn), KHÔNG
  đổi sang `myRank` theo kỳ — lý do đã ghi trong doc-comment của `LeaderboardShell`.
- Trần 100 là của backend; FE không tự phân trang tiếp quá 100.

## Non-goals

- Phân trang / cuộn vô hạn quá 100 dòng (backend chặn cứng ở 100).
- Gắn tên + avatar cho MỌI dòng của bảng (đã có từ V356, không thuộc đợt này).
