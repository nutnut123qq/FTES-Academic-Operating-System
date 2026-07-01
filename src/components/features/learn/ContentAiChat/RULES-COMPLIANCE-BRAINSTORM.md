# Audit — ContentAiChat: ĐỒNG BỘ theo STRICT rules (elements/concepts), KHÔNG tự chế primitive

> Thầy: *"áp dụng strict rules… đồng bộ NGUYÊN TẮC làm UX/UI chứ không phải tự chế. Đọc rules elements, concepts."*
> Ngày 2026-06-28. KHÔNG code — audit + chốt hướng theo đúng rule, rồi `/starci-fe-ux-apply`.

## Nguyên tắc gốc (thầy nhắc)
Mọi primitive (input/search, link, list, scroll) phải lấy từ **`.claude/rules` (elements/ · concepts/ · layouts/)** — KHÔNG hand-roll `<div border>`/`<input flat>`/`<button hover:bg>` ad-hoc. Đụng 1 element → tra rule của nó trước.

## Vi phạm hiện tại (em tự chế) → rule đúng

| # | Chỗ | Hiện tại (TỰ CHẾ) | Rule bị bỏ qua | ĐÚNG phải dùng |
|---|---|---|---|---|
| 1 | **Search hội thoại** | `<div border border-default><MagnifyingGlass/><input flat/></div>` | [[elements/input]] §3 (variant theo NỀN) · [[input-variant-by-surface-and-search-result-count]] | **`<TextField variant="secondary"><Input/></TextField>`** (HeroUI). Panel = surface (`bg-overlay`) → input trên surface = **`secondary`** (`bg-default` nổi trên surface). Canonical: `FlashcardDeckList` (`TextField` + `Input`). Search icon = `startContent`/slot của Input nếu có, KHÔNG tự ghép div. |
| 2 | **Header "Cuộc trò chuyện"** (title + caret, mở list) | `<button hover:bg-default>` (fill) | [[hover-style-matches-clickable-nature]] (go-there/mở-panel → **underline**, KHÔNG fill) · [[elements/label]] §2 (summary-row mở panel) | **Summary-row link kiểu "Cài đặt chấm điểm ›"**: `group` + title `group-hover:underline` + caret, chữ **`text-sm`** (muted/foreground), KHÔNG `hover:bg-default`. Canonical: `ChallengeView` gradingSettings, `TaskSubmissionPanel` settingsTitle. |
| 3 | **List hội thoại** | `ScrollShadow` (✓) nhưng **load HẾT 1 lần** | [[list-surface-anatomy-search-count-list-pagination]] · [[sticky-rail-overflow-wrap-scrollshadow]] | `ScrollShadow hideScrollBar` (mirror `OutlineRail`: `-mx-1 min-h-0 flex-1 overflow-y-auto px-1`) + **infinite fetch** (`useSWRInfinite` + block **`InfiniteScrollSentinel`** đã có). Canonical: `useQueryUserFollowersInfiniteSwr` / `Discussion`. |
| 4 | **Row hội thoại** | `<div hover:bg-default + bg-accent/10 selected>` | [[elements/list]] §4 (ListBox master-detail flat) | Cân nhắc **`ListBox` block** (`selectionMode=single` + `onSelectionChange` — KHÔNG `onAction`, ref [[rating-scale-row-and-page-internal-rail-layout]] Luật 4) cho chuẩn; HOẶC giữ div-rows (select-tại-chỗ → fill + `bg-accent/10` là ĐÚNG hover-rule). Đây ít sai nhất — ưu tiên thấp. |
| 5 | **Count** (cân bằng search) | không có | [[list-surface-anatomy...]] (search · **count** · list · pagination) | Tùy: thêm "N hội thoại" cạnh/dưới search (count CÓ NGHĨA). Với infinite có thể bỏ (không biết tổng) — chấp nhận. |

## KHÔNG phải vi phạm (đừng "sửa" nhầm)
- **Ô nhập composer** (`<input flat>` trong box `bg-default`): là **NGOẠI LỆ CÓ TÊN** ([[ai-chat-composer-box-controls-and-settings-modal]]) — composer-in-box dùng input thuần để hoà 1 box với controls, KHÔNG dùng HeroUI Input (tránh lồng 2 viền). → GIỮ. Phân biệt: **search = field đứng riêng → HeroUI Input secondary**; **composer = input-in-box → flat** (đúng rule, khác nhau).
- **In-panel view** (conversations/settings trượt trong panel): đúng (tránh popover-on-popover z-fight, [[content-ai-multi-session-conversations]]).

## Infinite fetch — thiết kế (BE + FE, grounded canonical)
- **BE:** `contentAiSessions(contentId, search?, limit?, offset?)` thêm `limit`+`offset` (offset pagination; hoặc cursor theo `updated_at`). Trả page + (tùy) `hasMore`. List + search đều page được.
- **FE:** `useSWRInfinite` (mirror `useQueryUserFollowersInfiniteSwr`): key theo `(contentId, search, pageIndex)`; flatten pages; **search đổi → reset page 0** (key đổi tự lo). Render trong `ScrollShadow` + **`InfiniteScrollSentinel`** (block sẵn, IntersectionObserver) ở đáy → `setSize(+1)` khi chạm. Loading page = skeleton/spinner đáy.

## Chốt hướng
Áp **đúng primitive theo rule** cho 4 chỗ: (1) search → `TextField/Input variant="secondary"`; (2) header → summary-row link `group-hover:underline` (không fill); (3) list → `ScrollShadow` + `useSWRInfinite` + `InfiniteScrollSentinel`; (4) rows → cân nhắc `ListBox` (hoặc giữ, ít sai). Giữ composer flat (ngoại lệ có tên). → cần BE thêm pagination cho `contentAiSessions` + FE infinite hook.

→ Thầy duyệt → `/starci-fe-ux-apply` để dựng (BE pagination + FE primitives + infinite). KHÔNG tự chế thêm.
