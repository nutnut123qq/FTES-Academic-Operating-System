# Bookmark (Saved) — UX brainstorm (2026-06-25 · Opus)

> `/profile/settings/bookmarks` → `Bookmarks` feature. Brainstorm ONLY — no code.
> Thầy directives: (1) đổi "Saved" → "Bookmark", (2) seed bookmark, (3) search variant primary, (4) áp pattern pagination.
> Sau khi chốt → `/starci-fe-ux-apply`.

## 0. Mục tiêu trang
Trang để học viên **tìm lại nhanh** 1 bài đã lưu. Job ≤10s: gõ/lướt → thấy bài → bấm vào học tiếp. Đây là **list duyệt được có thể dài** → đúng đối tượng của "list-surface anatomy" ([[list-surface-anatomy-search-count-list-pagination]]).

## 1. Dữ liệu BE (verified)
Query `savedContents(skip?: Int=0, take?: Int=20)` → `{ contents: ContentEntity[], count: number }`.
- **Pagination native:** `skip`/`take` offset-limit. **`count` = tổng số bookmark** (đã trả sẵn) → đủ cho result-count + total pages.
- Mỗi item (đã JOIN course): `id` · `displayId` · `title` · `description` · `minutesRead` · `isPremium` · `challenges[]` (→ count) · `module.course { id, displayId, title, coverImageUrl }`. Sort `createdAt DESC` (mới nhất trước).
- Mutation `toggleFavourite(contentId, isFavorite)`. Bookmark = `user_contents.is_favorite = true`.
- Chỉ **ContentEntity** bookmark được (lesson / foundation doc) — không có type khác.

## 2. Hiện trạng + pain
- **Title** = `content.saved` "Đã lưu / Saved" → thầy đổi **"Bookmark"**.
- **Search** = `TextField variant="secondary"` (xám) đặt trên `bg-background` → blend → thầy đổi **primary** (bỏ variant = `bg-field` trắng nổi trên nền, đúng [[input-variant-by-surface-and-search-result-count]] "search trên background → no variant").
- **Pagination** = infinite-scroll (`InfiniteScrollSentinel`) + **group theo khóa bằng Accordion** + `PressableCard` mỗi item → KHÔNG phải pattern list-surface; thầy muốn **Pagination component** (căn trái, hover, reset khi search).
- **Search client-side** chỉ lọc trang đã tải (infinite) → không bao trùm toàn bộ bookmark; count "0 bookmarks" lấy từ `bookmarks.count`.
- List rỗng hiện "No content yet" (`content.empty`).

## 3. Ref (pattern đã có trong rules — không cần web)
- [[list-surface-anatomy-search-count-list-pagination]]: **1 list "đủ bộ" = search · số records · list · Pagination** (4 phần dọc). Gõ search → reset trang 1. Pagination ẩn khi ≤1 trang.
- [[list-pager-left-align-and-hover]]: pager căn **TRÁI** thẳng mép list + hover/cursor (HeroUI Pagination không tự bake).
- [[input-variant-by-surface-and-search-result-count]]: search trên background → **no variant** (primary, trắng); count phải hàng search.
- [[item-card-meta-inside-bounded-object]] + [[elements/card]] §3c: nhiều item đơn giản → **1 `SurfaceListCard`** (rows + separator inset), KHÔNG N `PressableCard` rời.
- [[hover-style-matches-clickable-nature]]: row điều hướng (nav) → hover **underline title**, không fill.

## 4. Các hướng

### Hướng A — List-surface anatomy phẳng + Pagination (ĐỀ XUẤT)
Đúng directive thầy. IA dọc:
1. **PageHeader** title "Bookmark" + breadcrumb + desc ngắn.
2. **Search row**: input **primary** (trắng, trên background) TRÁI `w-full sm:max-w-sm` + **result-count** PHẢI ("Tìm thấy {n} bookmark", muted, từ `count`).
3. **List**: **1 `SurfaceListCard`** — mỗi bookmark = `SurfaceListCardRow` (`leading` icon file · `title` lesson (group-hover underline, nav) · `subtitle` = **tên khóa** · `meta` = `minutesRead` + chip `Premium` nếu có + challenge count · `trailing` caret), whole-row → `displayId`. **Bỏ accordion group theo khóa** (khóa xuống subtitle).
4. **Pagination**: page-based (`skip = (page-1)*take`), **căn trái**, hover, **reset về trang 1 khi search**, **ẩn khi ≤1 trang**. Thay `InfiniteScrollSentinel`.

**Pros:** đúng pattern thầy yêu cầu; search/count/pager cho list dài; 1 surface bounded (hết N PressableCard rời + card-in-card); whole-row nav rõ.
**Cons:** mất grouping theo khóa (đổi sang subtitle); search nên chuyển **server-side** (xem §10 gap) để count + pager đúng toàn tập.

### Hướng B — Giữ group-theo-khóa (accordion) + search + count
Giữ Accordion nhóm theo khóa, chỉ thêm search-row + count, đổi title "Bookmark" + search primary.
**Pros:** grouping mạnh khi học nhiều khóa.
**Cons:** **Pagination KHÔNG gắn được vào grouping** (phân trang xuyên nhóm = rối) → vẫn infinite-scroll → **trái directive "áp pagination"**. Bỏ.

### Hướng C — Phẳng + lọc khóa bằng tab/segmented + pagination
List phẳng (như A) + 1 hàng `TabsCard`/chip lọc theo khóa (Tất cả / FS / SD / DevOps) trên search.
**Pros:** vừa phẳng-paginate vừa lọc được theo khóa (thay grouping).
**Cons:** thêm tầng filter; chỉ đáng khi học viên có bookmark ở **nhiều** khóa. Defer (A trước, thêm filter khóa sau nếu cần).

## 5. CHỐT: Hướng A
Đúng 4 directive thầy (rename · search primary · pagination · seed riêng). Robust, đúng [[list-surface-anatomy-search-count-list-pagination]]. Grouping theo khóa → subtitle (không mất thông tin khóa). Cần lọc khóa sau → nâng C.

## 6. Field → component map (A)
| Phần | Component | Field |
|---|---|---|
| Header | `PageHeader` + `SettingsBreadcrumb` | title "Bookmark" (i18n mới `bookmarks.heading`), desc |
| Search | `TextField` **bỏ variant** (primary) + `Input` | `search` |
| Count | `Typography body-sm muted shrink-0` | `count` — "Tìm thấy {n} bookmark" |
| List | `SurfaceListCard` + `SurfaceListCardRow` | per item |
| Row title | `title` (group-hover underline) | nav → `displayId` |
| Row subtitle | `module.course.title` | tên khóa |
| Row meta | `minutesRead` + `isPremium` chip + `challenges.length` | |
| Row leading | icon (FileText) / `IconTile` cover | |
| Pagination | HeroUI `Pagination` (trái, hover) | `count / take` → totalPages; ẩn ≤1 |

## 7. Cut / thêm / giữ
**Cut:** Accordion group-theo-khóa; `PressableCard` rời; `InfiniteScrollSentinel`.
**Thêm:** result-count phải search; `SurfaceListCard` rows; **Pagination** (trái, hover, reset on search, ẩn ≤1 trang).
**Giữ:** `PageHeader`+`SettingsBreadcrumb`, `AsyncContent` (skeleton mirror rows), empty/error state.
**Đổi:** title `content.saved` → key mới `bookmarks.heading` = "Bookmark"; search `variant="secondary"` → bỏ variant.

## 8. Empty / loading / error
- **Loading**: skeleton mirror `SurfaceListCard` (5–6 rows trong 1 bordered surface).
- **Empty (0 bookmark)**: `EmptyContent` icon `BookmarkSimpleIcon` + "Chưa có bookmark" + hint "Lưu bài học để xem lại ở đây".
- **Search rỗng**: `EmptyContent` "Không có bookmark khớp" (`bookmarks.noMatch` có sẵn).
- **Error**: `AsyncContent` retry.

## 9. A11y
- Row = `<a>`/onPress whole-row, `aria-label` = title; caret + meta `aria-hidden`.
- Pager: HeroUI Pagination + `aria-label` trang; reset trang khi đổi search.
- Search `aria-label`.

## 10. BE work (CHỐT thầy 2026-06-25)
- **✅ CHỐT: thêm BE arg `search` (server-side).** `savedContents` thêm `search?: String` → filter `content.title ILIKE %search%` (cân nhắc cả `description`) NGAY trong `findAndCount` (cùng `where` + `skip/take`) → **count + pager + kết quả đúng TOÀN BỘ bookmark** khi gõ search. `/apply` sửa **cả BE** (request DTO + handler where) **lẫn FE** (query thêm var `search`, hook page-based truyền search → reset page 1 khi search đổi). KHÔNG dùng client-filter-per-page.
  - BE đụng: `saved-contents/graphql-types/request.ts` (thêm field `search`), `saved-contents.handler.ts` (where `content.title ILIKE`), GraphQL query FE `query-saved-contents.ts` (thêm `$search`).
- **Pagination:** BE đã sẵn `skip/take` + `count` → FE đổi `useSWRInfinite` → `useSWR` page-based (`skip=(page-1)*take`, `take=12`); `totalPages=ceil(count/take)`; HeroUI `Pagination` trái+hover, ẩn ≤1 trang, reset page 1 khi `search` đổi (`useEffect`).
- **✅ Seed (đã làm):** 16 `user_contents (user_id=701d03f2…, content_id, is_favorite=true)` cho account thầy (pakoohacha588), trải 4 khóa + mix premium → tổng 22 bookmark (>12 = 2 trang, test pager + search).
