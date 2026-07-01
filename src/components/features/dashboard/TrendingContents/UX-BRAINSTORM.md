# "Nổi bật tuần này" (TrendingContents) — UX brainstorm (2026-06-25)

> Khối "Nổi bật tuần này" trên dashboard `?tab=explore`. Thầy: *"render dạng LabeledCard dạng list, đọc kĩ rules"*.
> KHÔNG code ở đây. Thầy chốt hướng → `/starci-fe-ux-apply`.

## 0. Page & files
- Component: `src/components/features/dashboard/TrendingContents/index.tsx`
- Hook: `src/hooks/swr/api/graphql/queries/useQueryTrendingContentsSwr.ts`
- Parent: `ExploreTab` → `FeedTabs` → **Card 1** (TrendingContents) gap-6 trên **Card 2** (feed TabsCard).
- Blocks liên quan: `blocks/cards/LabeledCard`, `blocks/lists/ListRow`, `features/dashboard/EntityToken`.

## 1. Dữ liệu THẬT (BE — grounded)
`trendingContents(limit=6, max 20)` trả mỗi item **đúng 3 field**, sort `readCount DESC, title ASC`:
| Field | Kiểu | Ghi chú |
|---|---|---|
| `globalId` | String! | token route → `EntityToken` resolve khi click (KHÔNG có url sẵn) |
| `title` | String! | tiêu đề bài (có thể dài → truncate) |
| `readCount` | Int! | số lượt đọc trong 7 ngày (rolling) — **là tín hiệu trending** |

- **KHÔNG có**: kind/loại nội dung, cover, category, author, ngày, slug. → **KHÔNG vẽ icon-theo-loại / cover** (sẽ phải đổi BE `kind`; fake = vi phạm grounded-in-data + [[design-for-data-that-exists-coverless-lowvolume]]).
- **Thực tế data hiện tại**: mọi item `readCount = 1` ("1 lượt đọc") — early-stage, count gần như đồng đều → low-signal.
- Self-hiding khi rỗng; chỉ chạy khi `authenticated`. Trending toàn nền tảng (không theo scope) → hiện ở cả 2 tab feed.

## 2. Hiện trạng (inventory, KHÔNG phải design authority)
- **ĐÃ là `LabeledCard`** (flame + "Nổi bật tuần này", label NGOÀI + Card). Đúng [[dashboard-labeledcard-and-tabscard]] (Card 1 = TrendingContents = LabeledCard).
- **Rows = `<div className="flex justify-between">` TAY** (EntityToken trái + `<span>` readCount phải) — KHÔNG dùng block `ListRow`.
- → "render dạng list" = thay div tay bằng **block `ListRow`** ([[elements/list]] §1: row nhãn ngắn truncate + trailing meta). Đây là phần còn thiếu.

## 3. Rules áp (đọc kĩ)
- [[dashboard-labeledcard-and-tabscard]]: section dashboard có heading = `LabeledCard`; giữ Card 1/Card 2 (gap-6).
- [[elements/list]] §1 `ListRow`: title truncate + `meta` trailing + `leading?` + `onPress/href`. Dùng cho row nhãn ngắn — đúng vai trending.
- [[elements/card]] §2 LabeledCard (label ngoài + content trong Card).
- [[concepts/whitespace-over-dividers]]: **cắt count thừa khi list đã hiện item** — readCount "1" đồng đều = ứng viên cắt; nhưng đây là count PER-ROW (lý do trending), không phải total → cân nhắc, không cắt máy móc.
- [[concepts/card]]: KHÔNG 2 card bordered dính — Card 1/Card 2 cách gap-6, OK.
- [[interactive-needs-hover]]: row click được → hover + cursor (ListRow lo).
- [[design-for-data-that-exists-coverless-lowvolume]] (của chính mình): thiết kế cho 3 field CÓ, đừng vẽ cho kind/cover KHÔNG có.

## 4. Cấu trúc đã settle + điểm cần chốt
Structure gần như cố định bởi rules: **LabeledCard (flame + label) → body = list `ListRow`**. Chỉ còn 2 lựa chọn ở ROW:
- (a) **leading rank số** (1,2,3…) — list vốn sort theo reads → là 1 **rank-order list** (ref: NYT Most Read · Hacker News · Twitter trends). Rank suy từ ORDER, KHÔNG cần field mới.
- (b) **readCount trailing** — giữ hay cắt (đang "1" đồng đều = vanity tạm thời).

## 5. Ba hướng row (xem widget)
| Hướng | Row anatomy | Ref | Trade-off |
|---|---|---|---|
| **A** | title (truncate) + `readCount` phải | ListRow literal | chưa đọc ra "xếp hạng"; "1 lượt đọc" lặp = low-signal |
| **B** ✅ | **rank № (leading)** + title; BỎ count | NYT Most Read / rank-order list | đọc ra leaderboard, leading slot có nghĩa, cắt vanity; bỏ field BE có (thêm lại khi reads phân hoá) |
| **C** | rank № + title + `readCount` phải | rank + justification | 2 meta khi count toàn "1" = hơi thừa; hợp khi data đủ |

### Chốt đề xuất: **B — numbered most-read list**
- "Nổi bật tuần này" = bảng "đọc nhiều nhất tuần". Rank № biến list thành rank-order list (đọc ra ngay "top reads"), leading slot có nghĩa thật (suy từ order, không fake data).
- Cắt `readCount` vì hiện toàn "1" → lặp vô nghĩa ([[whitespace-over-dividers]] + [[progress-block-growing-quantity-headline-not-vanity-strip]] tinh thần "số nhiễu thì gate/cắt"). Rank đã hàm ý "nhiều reads".
- **Khi reads phân hoá** (vd 24 / 12 / 5) → bật lại count làm `meta` (thành C). Tức B bây giờ, C về sau — cùng 1 ListRow, chỉ thêm `meta`.
- Top-3 rank `text-accent`, còn lại `text-muted` (nhấn nhẹ top, không tô khối — [[highlight-accent-as-detail-not-block-fill]]).
- Caveat: data hiện tied (toàn 1 read) → rank tie-break theo title (alphabetical) hơi tuỳ ý; chấp nhận, sẽ thật khi reads tăng.

## 6. Section → dữ liệu
| Phần | Field |
|---|---|
| Label "Nổi bật tuần này" + flame | static (i18n `dashboard.trending.title`) |
| Rank № leading | index+1 (order = readCount DESC) |
| Row title (truncate, click) | `title` + `globalId` (EntityToken resolve route onPress) |
| (option) count meta | `readCount` (`dashboard.trending.reads`) |

## 7. Cắt / thêm / states
- **Cắt:** `<div>` row tay → `ListRow`; (hướng B) trailing "1 lượt đọc".
- **Thêm:** leading rank №; press/hover do ListRow lo (giữ EntityToken resolve trong onPress).
- **States:** đã `AsyncContent` + self-hide khi rỗng (giữ). Skeleton mirror = vài ListRow rỗng (rank + line). Loading/empty/error giữ nguyên hành vi self-hiding (Card 1 ẩn khi 0 item).
- **a11y:** rank № là phụ → có thể `aria-hidden` (thứ tự DOM đã mang nghĩa rank); title là link có nhãn rõ.

## 8. CHỐT (thầy duyệt 2026-06-25)
- **Hướng row = B** — `ListRow` với **leading rank № (1,2,3…, top-3 `text-accent`, còn lại `text-muted`) + title (truncate, click qua EntityToken resolve)**; **BỎ trailing "N lượt đọc"**. Order = `readCount DESC` (rank suy từ index+1). Khi reads phân hoá → bật count lại làm `meta` (thành C) — cùng 1 ListRow, chỉ thêm prop.
- **Phân tách row = `divider` inset** (ListRow `divider`, row cuối không kẻ) — đang TRONG 1 card bounded nên divider sub-row hợp lệ ([[whitespace-over-dividers]] cho phép divider bên trong khối bounded), dễ quét khi 6 row.
- Giữ: LabeledCard (flame + label), AsyncContent + self-hide khi rỗng, Card 1/Card 2 gap-6. EntityToken resolve route đặt trong `onPress` của ListRow.
- Skeleton: vài `ListRow` rỗng (ô rank + 1 line title). a11y: rank № `aria-hidden` (DOM order đã mang nghĩa).
→ Sẵn sàng `/starci-fe-ux-apply` (TrendingContents).
