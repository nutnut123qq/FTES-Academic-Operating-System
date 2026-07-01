# UX-BRAINSTORM — Dashboard tab "Cộng đồng" (2026-06-21)

> `/starci-fe-ux-brainstorm` — KHÔNG code. Target: `/dashboard?tab=community` → `dashboard/CommunityTab`
> (hiện = `LeagueCard` + `ChangelogList`). Tabs dashboard: Tổng quan · Khám phá · Khóa học · **Cộng đồng** (icon Trophy).

## 0. TL;DR
Tab "Cộng đồng" hiện = **League tuần + Changelog ("Có gì mới")**. Hai lỗi:
1. **Changelog KHÔNG phải cộng đồng** — nó là **tin sản phẩm** (Tính năng/Sửa lỗi). Đặt trong tab "Cộng đồng"
   (icon Trophy = thi đua) = lạc chỗ. → chuyển ra (Overview "Có gì mới" / footer / chuông).
2. **Tab mỏng + mơ hồ vai với Explore.** Explore (Compass) đã ôm **feed hoạt động + Ai nên theo dõi**. Community
   chỉ còn League → chưa xứng 1 tab. "Cộng đồng" nên là **nhà của THI ĐUA & VỊ THẾ** (bạn đứng đâu giữa mọi người),
   khác Explore (dòng chảy "ai vừa làm gì").
- **Chốt: D-A "Community = đấu trường/vị thế"** — League (đủ) + **BXH toàn cục** + vị thế của bạn + **Top học viên tuần**
  (+ huy hiệu); **bỏ changelog khỏi tab**. Dữ liệu đã có sẵn (`myLeague`, `globalLeaderboard`, `userXp`, achievements).

## 1. Khoanh vùng
| Khối | File | Trạng thái |
|---|---|---|
| League tuần (cohort, tier, promote/demote, reset, rank của bạn) | `LeagueCard` (`useQueryMyLeagueSwr`) | tốt — giữ, là lõi |
| Changelog "Có gì mới" | `ChangelogList` (`useQueryChangelogEntriesSwr`) | **lạc chỗ** — tin sản phẩm, không phải cộng đồng |
| (Explore tab) feed + ai-nên-theo-dõi | `ExploreTab` = `FeedTabs` + `WhoToFollow` | đã ôm phần "feed/social" → Community đừng lặp |

## 2. Dữ liệu THẬT (grounded — từ SOCIAL-FEED-BRAINSTORM + hooks)
| Nguồn | Có | Dùng cho Community |
|---|---|---|
| `myLeague` | ✅ | League tuần (đang dùng) |
| **`globalLeaderboard`** (`useQueryGlobalLeaderboardSwr`) | ✅ (hook có, dashboard CHƯA dùng) | **BXH toàn cục + top học viên** |
| `userXp` (lesson/challenge/milestone/total) | ✅ | XP của bạn / điểm so sánh |
| `suggestedUsers` · `setFollow` · `userFollowers/Following` · `followerCount` | ✅ | "Top học viên" có nút Theo dõi; social proof |
| `myAchievements` (earned/tier/rarity) | ✅ | strip huy hiệu (belonging/khoe) |
| `myWeeklyStats` (streak/xp 7d) | ✅ | "tuần này bạn kiếm N XP" cạnh league |
| `changelogEntries` | ✅ | **chuyển sang Overview/khác** |

## 3. Điểm đau (ref: Duolingo Leagues · GitHub trending/contributors · vanity-engineering)
1. **Changelog ≠ community** (lạc chỗ, icon Trophy mâu thuẫn nội dung tin-tức).
2. **Mỏng**: 1 league card + 1 list tin → tab thiếu sức nặng "đấu trường".
3. **Bỏ phí `globalLeaderboard`** (hook đã có) — không có BXH toàn cục / top học viên dù đây đúng là "cộng đồng".
4. **Trùng vai Explore mờ**: cả hai "social"; cần ranh giới rõ — Explore = *dòng chảy* (ai vừa làm gì), Community =
   *vị thế/đua* (bạn đứng đâu, ai top).
5. League "Hạng #2 · top 100%" đọc ngược (top 100% = bét) khi cohort ít — cần copy đúng khi data mỏng.

## 4. Mục tiêu (≤30s)
Mở tab Cộng đồng → thấy ngay: **(a) tuần này tôi đứng đâu** (league rank + reset + promote/demote), **(b) so với
TOÀN nền tảng tôi ở đâu** (global rank/percentile), **(c) ai đang dẫn đầu** (top học viên — có thể theo dõi). Thi đua
+ thuộc-về, KHÔNG phải tin sản phẩm.

## 5. Ba hướng + CHỐT
### D-A — "Đấu trường & vị thế" ✅ **CHỐT**
League tuần (giữ) → **Vị thế toàn cục** (global rank + percentile + XP, từ `globalLeaderboard`/`userXp`) → **Top học viên
tuần** (rows có avatar + XP + nút **Theo dõi** cho người lạ — `suggestedUsers`/`setFollow`) → (tùy) **strip huy hiệu**
mới đạt. **Changelog rời khỏi tab** (về Overview "Có gì mới").
- ✅ Dùng đúng data sẵn, lấp `globalLeaderboard` bỏ phí, ranh giới rõ với Explore, hợp icon Trophy. Thêm 1 chút social
  (Theo dõi) mà không lặp feed.
- ⚠️ "Top học viên" lấy từ `globalLeaderboard.entries` (đã có); nút Theo dõi cần userGlobalId trên entry (kiểm tra; nếu
  thiếu → chỉ link profile). Copy percentile phải đúng khi data mỏng.

### D-B — "Cộng đồng = người" (people-first)
Ai-nên-theo-dõi + đang theo dõi + top contributor + league phụ.
- ✅ Đậm "người"; ❌ **lặp `WhoToFollow` của Explore** → mờ ranh giới; bỏ qua sức mạnh "đấu trường".

### D-C — "Gộp Explore + Community"
Một tab "Cộng đồng" = feed + league + who-to-follow; bỏ tab Explore.
- ✅ Hết chồng vai 2 tab; ❌ đại phẫu IA tab (DashboardTabsBar + store + 2 tab) → rủi ro cao, để bàn riêng.

**Chốt D-A** (rẻ, đúng data, ranh giới rõ). Changelog → Overview.

## 6. Section → dữ liệu (D-A)
| # | Section | Hiển thị | Nguồn |
|---|---|---|---|
| 1 | **League tuần** (giữ) | cohort top 5 + row của bạn · tier · reset · promote/demote · rank·percentile | `myLeague` |
| 2 | **Vị thế toàn cục** | "Hạng #X toàn nền tảng · top Y% · N XP" + link BXH đầy đủ | `globalLeaderboard.myRank` + `userXp` |
| 3 | **Top học viên tuần** | 3–5 row: avatar · tên · XP · **Theo dõi** (người lạ) | `globalLeaderboard.entries` + `setFollow`/`suggestedUsers` |
| 4 (tùy) | **Huy hiệu mới** | strip 3–5 badge vừa đạt | `myAchievements` |
| — | ~~Changelog~~ | **chuyển sang Overview** "Có gì mới" | `changelogEntries` |

## 7. Cắt / Thêm
- **CẮT khỏi tab:** `ChangelogList` (→ Overview).
- **THÊM:** block **Vị thế toàn cục** (global rank/percentile) + **Top học viên tuần** (rows + Theo dõi) + (tùy) huy hiệu.
- **GIỮ:** `LeagueCard` (lõi). Ranh giới: Explore = feed/discovery; Community = đua/vị thế.

## 8. States / a11y / ranh giới
- Mỗi block bọc `AsyncContent` riêng, self-hide khi rỗng (data mỏng giai đoạn đầu → tab vẫn gọn, không vỡ).
- Nút **Theo dõi** `isPending`; entry có aria-label; số XP tabular.
- Copy percentile đúng khi cohort/board nhỏ (tránh "top 100%").
- KHÔNG cần BE mới (mọi query đã có). Changelog chỉ ĐỔI CHỖ render, không bỏ tính năng.
- Ref: [Duolingo Leagues](https://duolingo.deconstructoroffun.com/mechanics/leagues) (cohort + promote/demote + reset) ·
  GitHub trending/contributors (top people) · [[course-home-no-duplicate-surfaces]] (Explore vs Community không trùng).

→ Thầy chọn hướng (widget dưới) → `/starci-fe-ux-apply`. Pha: ① bỏ changelog + thêm Vị thế toàn cục → ② Top học viên + Theo dõi → ③ huy hiệu.

### ✅ ĐÃ DỰNG D-A (2026-06-21, *"D-A chốt, render theo LabeledCard"*)
- `CommunityTab` = **3 LabeledCard**: `<LeagueCard framed/>` + `<GlobalStanding/>` + `<TopLearners/>`. Bỏ `ChangelogList`.
- **LeagueCard**: thêm prop `framed` (default false → /league page giữ nguyên); khi `framed` render trong `LabeledCard`
  (title = Label ngoài + InfoTooltip help). Tách `titleNode`/`body` để không lặp JSX.
- **GlobalStanding** (mới): `LabeledCard "Vị thế toàn cục"` → "Hạng #myRank toàn nền tảng · myPoints XP" + see-more →
  /league. Dùng `globalLeaderboard.myRank/myPoints` (hook đã có, trước bỏ phí). Self-hide khi chưa có rank.
- **TopLearners** (mới): `LabeledCard "Top học viên tuần"` → top 5 `globalLeaderboard.entries` (rank · avatar · tên ·
  XP · `FollowButton` cho người lạ, reuse `useMutateSetFollowSwr` + optimistic như WhoToFollow). Row → profile (Link).
- **Changelog** chuyển sang **OverviewTab** (`<ChangelogList framed/>`); ChangelogList thêm prop `framed` (LabeledCard).
- i18n: `dashboard.community.globalStanding.{title,line,seeMore}` + `dashboard.community.topLearners.{title,xp}` (vi/en).
- tsc/lint/JSON sạch (baseline ContinueLearning errors có sẵn, không liên quan). KHÔNG cần BE mới.
