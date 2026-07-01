# Dashboard "Khám phá" (Explore) feed → reuse profile-activity feed + flatten tabs (UX brainstorm + plan)

> `/ux-brainstorm` · `/dashboard?tab=explore` → `ExploreTab` (`FeedTabs` + `Feed`) · 2026-06-18 · MAX effort
> Thầy chốt 2 việc: (1) **render danh sách bằng pattern feed "Hoạt động gần đây"** (profile Activity tab); (2) **2 lớp
> tab nhìn clumsy** → dẹp bớt. + lên plan. **Legacy = inventory, KHÔNG bê tư duy.**

## Mục tiêu trang (≤30s)
Explore = "có gì đang diễn ra trong cộng đồng StarCi để tôi học/leo theo". User cần **lướt nhanh dòng hoạt động**
(ai vừa pass challenge/milestone/đọc bài/được follow) + lọc nhẹ + đi theo. 1 primary = **lướt feed**. Cắt mọi thứ
làm feed khó đọc (avatar trần không badge, time tuyệt đối, 2 hàng tab chồng).

## Inventory + pain
- **Cây:** `dashboard/ExploreTab` → `FeedTabs` (2 lớp tab) + `Feed` (renderer) + `WhoToFollow`/`TrendingContents`.
- **2 lớp tab (clumsy):** ngoài = **scope** `Khám phá(forYou)` / `Đang theo dõi(following)`; trong = **category**
  `Tất cả / Khóa học / Thành tựu / Người`. → CỘNG với tab dashboard cấp trên (Tổng quan/Khám phá/…) = **3 tầng tab**.
- **Renderer legacy `Feed/index.tsx`:** `UserAvatar` trần (KHÔNG badge loại hoạt động) · `formatDateTime` **tuyệt đối**
  (không relative) · **KHÔNG group theo ngày** · `targetLabel ?? ""` → **token rỗng khi NoTarget** (phạm `starci-feed.md` §2).
- **2 feed phân kỳ:** profile Activity (`ProfileActivity`) đã render ĐÚNG bằng blocks `ActivityAvatar`+`FeedItem`+
  `EntityLink` (TYPE_ICON badge, relative time + tooltip tuyệt đối, group ngày "Hôm nay/Hôm qua", rollup milestone,
  NoTarget key). Dashboard Explore KHÔNG dùng blocks này → 2 nơi render cùng dữ liệu mà khác mặt (phạm §14 "đồng bộ mọi nơi render").
- **BUG i18n (đang lòi ở screenshot):** key `dashboard.feed.<type>NoTarget` (vd `challengePassedNoTarget`,
  `lessonReadNoTarget`) **THIẾU trong `messages/{vi,en}.json`** → khi `targetLabel==null` next-intl trả raw key.
  ProfileActivity tham chiếu key này nên **profile Activity tab đang lòi raw key** (thấy ở ảnh 2).

## Dữ liệu THẬT (không cần BE mới)
- `myFeed(tab: forYou|following, category: all|courses|achievements|people, cursor, limit)` → `MyFeedItemData[]`
  `{ actorGlobalId, actorUsername, actorAvatar, type(9 ActivityType), targetGlobalId, targetLabel, at }` + `nextCursor`.
  **4 inner tab = CÙNG 1 query, chỉ khác `category`.** scope = `tab`. → category/scope **chỉ là PARAM**, không đáng 2 hàng tab.
- `userFeed(userId,…)` = **cùng shape** `MyFeedItemData` (chronological). → 1 renderer phục vụ cả 2 trang.
- Target **luôn có** ở BE (snapshot trong `activity.payload.target`); `NoTarget` chỉ là nhánh phòng thủ FE → **phải có key**.
- Phụ trợ Explore: `trendingContents`, `suggestedUsers` (WhoToFollow) — giữ.

## IA mới
**Trục chính = SCOPE (forYou/following) = 1 hàng tab; category = bộ lọc nhẹ; render = 1 block feed dùng chung.**
1. **1 hàng tab** `Khám phá` / `Đang theo dõi` (scope — đổi feed thật sự). Bỏ hàng tab thứ 2.
2. **Category = segmented/chips 1 dòng** (`Tất cả · Khóa học · Thành tựu · Người`) đặt DƯỚI tab, kiểu filter (nhẹ,
   không phải tab). Icon nhỏ giữ. (Twitter = tab For You/Following + feed; lọc = chip — pattern đã chứng minh.)
3. **Render = block feed dùng chung** trích từ `ProfileActivity`: badge theo loại, actor·verb·target (Link), relative
   time + tooltip tuyệt đối, group ngày, rollup milestone, NoTarget. Explore + Activity **xài chung 1 renderer**.

## Hướng cho lớp tab (chốt)
- **A (CHỐT): scope = tab (1 hàng), category = filter chips.** Gọn nhất, đúng mental model (audience đổi feed; loại
  = refine). Khớp Twitter/LinkedIn. 1° tab dashboard + 1° tab scope + 1 dòng chip = hết clumsy.
- B: category = tab, scope = toggle nhỏ. → scope (forYou vs following) là ngữ cảnh lớn hơn, demote thành toggle kém nhận biết.
- C: gộp tất cả vào 1 segmented dài. → trộn 2 trục khác bản chất, khó hiểu.
→ **A** vì giảm tầng tab mà vẫn giữ trục quan trọng (scope) nổi bật.

## Section → dữ liệu BE
| Phần (mới) | Nguồn | Ghi chú |
|---|---|---|
| Tab scope forYou/following | `myFeed(tab)` | đổi feed |
| Chips category | `myFeed(category)` | chỉ param, không tab |
| Mỗi dòng feed (badge·actor·verb·target·relative time) | `MyFeedItemData` | block dùng chung |
| Group ngày / rollup milestone / NoTarget | FE (như ProfileActivity) | chuyển vào block |
| TrendingContents / WhoToFollow | `trendingContents` / `suggestedUsers` | giữ (rail phụ) |

## Empty / Loading / Error / A11y
- **Empty**: `following` mà chưa follow ai → empty-state + CTA "Khám phá người để theo dõi" (dẫn chip Người/WhoToFollow).
  `forYou` rỗng → ẩn/CTA học. **Loading**: skeleton **mirror feed row** (avatar+badge giả + 2 dòng text + chip ngày).
  **Error**: retry. **Infinite scroll**: `useSWRInfinite` + sentinel (đang cursor-paginate, giữ).
- **A11y**: tab=ARIA tablist; chip filter=`role=group`/toggle có `aria-pressed`; relative time có `<time title=tuyệt đối>`;
  badge icon `aria-hidden` (loại đã nằm trong câu chữ).

## Cắt / Thêm
- **Cắt**: hàng tab thứ 2 (category→chips); renderer legacy `Feed/index.tsx` (thay bằng block dùng chung).
- **Thêm/Sửa**: trích block feed dùng chung (Explore + Activity); **thêm key `dashboard.feed.<type>NoTarget`** (9 loại)
  vào `messages/{vi,en}.json` (sửa luôn bug raw-key ở CẢ Explore lẫn profile Activity).

## PLAN (thứ tự khi /ux-apply)
1. **Fix bug trước (rẻ, độc lập):** thêm 9 key `dashboard.feed.<type>NoTarget` vào vi/en (+ `milestonePassed` đơn nếu thiếu).
   → hết raw key ở profile Activity ngay.
2. **Trích renderer dùng chung:** đưa logic row của `ProfileActivity` (TYPE_ICON map · day-group · rollup · NoTarget ·
   relative time) vào 1 block `blocks/feed/ActivityFeed` (nhận `items[]`, props-only). Refactor `ProfileActivity` dùng nó (giữ y hệt mặt).
3. **Explore dùng block đó:** `Feed/index.tsx` (legacy) → render bằng `ActivityFeed` block. Xoá renderer cũ.
4. **Flatten tab:** `FeedTabs` → 1 hàng tab scope (forYou/following) + 1 dòng **chips** category (All/Courses/Achievements/People);
   bỏ hàng tab inner. URL state giữ (`?tab=explore` + scope/category nếu cần share).
5. Verify tsc/eslint; thầy soi mắt.

→ Thầy duyệt hướng A → `/ux-apply` dựng theo plan. KHÔNG code ở bước này.
